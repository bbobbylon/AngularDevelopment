/**
 * Spaced-repetition review queue — the shared store behind the /review page.
 *
 * Every question answered WRONG anywhere in the app (the self-paced Practice
 * page or a Mock Exam) is enqueued here. The Review page then resurfaces items
 * on a Leitner-style schedule: each consecutive correct review promotes an item
 * one "box" (longer interval); a miss demotes it back to box 0 (due
 * immediately). A correct answer at the top box GRADUATES the item — it leaves
 * the queue and is counted as mastered.
 *
 * Storage is localStorage (same SSR-safe try/catch pattern as the Practice
 * progress and Mock Exam history stores). Challenge ids reference the shared
 * bank in `practice-data.ts`, so consumers must tolerate ids that no longer
 * resolve if the bank ever shrinks.
 */

/** Days until an item is due again, indexed by box. Box 0 = due immediately. */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

const DAY_MS = 24 * 60 * 60 * 1000;

/** One queued challenge and where it sits in the schedule. */
export interface ReviewItem {
  /** Challenge id from the shared bank in practice-data.ts. */
  id: number;
  /** Index into REVIEW_INTERVALS_DAYS — consecutive correct reviews so far. */
  box: number;
  /** Epoch ms when the item becomes due for review. */
  due: number;
  /** How many times this challenge has been answered wrong in total. */
  lapses: number;
}

export type ReviewQueue = Record<number, ReviewItem>;

/** localStorage keys (bump the suffix to invalidate old data). */
const QUEUE_KEY = 'angular-review-queue-v1';
const MASTERED_KEY = 'angular-review-mastered-v1';

/** Load the queue; returns {} when storage is unavailable (SSR/private mode) or corrupt. */
export function loadQueue(): ReviewQueue {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ReviewQueue) : {};
  } catch {
    return {};
  }
}

/** Persist the queue, swallowing quota/permission errors so the UI never breaks on a write. */
export function saveQueue(queue: ReviewQueue): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore — storage full or blocked
  }
}

/** Ids of challenges that graduated out of the queue (correct at the top box). */
export function loadMastered(): number[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(MASTERED_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveMastered(ids: number[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MASTERED_KEY, JSON.stringify(ids));
  } catch {
    // ignore — storage full or blocked
  }
}

/**
 * Record misses from anywhere in the app: new challenges enter at box 0 (due
 * now); already-queued ones are demoted back to box 0. Returns the new queue.
 * Re-missing a mastered challenge puts it back in rotation.
 */
export function recordMisses(ids: number[], now = Date.now()): ReviewQueue {
  if (ids.length === 0) return loadQueue();
  const queue = loadQueue();
  const mastered = loadMastered();
  let masteredChanged = false;
  for (const id of ids) {
    const existing = queue[id];
    queue[id] = {
      id,
      box: 0,
      due: now,
      lapses: (existing?.lapses ?? 0) + 1,
    };
    const mi = mastered.indexOf(id);
    if (mi !== -1) {
      mastered.splice(mi, 1);
      masteredChanged = true;
    }
  }
  saveQueue(queue);
  if (masteredChanged) saveMastered(mastered);
  return queue;
}

/**
 * Grade an item answered ON the Review page. Correct promotes it one box
 * (removing it entirely — mastered — when it was already at the top box);
 * wrong demotes it to box 0, due immediately. Returns the new queue.
 */
export function gradeReview(id: number, correct: boolean, now = Date.now()): ReviewQueue {
  const queue = loadQueue();
  const item = queue[id];
  if (!item) return queue; // not queued (stale session) — nothing to grade
  if (correct) {
    const nextBox = item.box + 1;
    if (nextBox >= REVIEW_INTERVALS_DAYS.length) {
      delete queue[id];
      const mastered = loadMastered();
      if (!mastered.includes(id)) saveMastered([...mastered, id]);
    } else {
      queue[id] = { ...item, box: nextBox, due: now + REVIEW_INTERVALS_DAYS[nextBox] * DAY_MS };
    }
  } else {
    queue[id] = { ...item, box: 0, due: now, lapses: item.lapses + 1 };
  }
  saveQueue(queue);
  return queue;
}

/** Items due at `now`, most-overdue first. */
export function dueItems(queue: ReviewQueue, now = Date.now()): ReviewItem[] {
  return Object.values(queue)
    .filter((i) => i.due <= now)
    .sort((a, b) => a.due - b.due);
}

/** Count of items due at `now` — used for badges on other pages. */
export function dueCount(queue: ReviewQueue, now = Date.now()): number {
  return dueItems(queue, now).length;
}
