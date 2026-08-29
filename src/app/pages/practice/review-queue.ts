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
 * Deliberately plain functions rather than an injectable service: misses are
 * recorded from several independently lazy-loaded pages, and a module of pure
 * functions over localStorage avoids giving them a shared DI dependency. The
 * trade-off is that nothing here is reactive — callers re-read after mutating
 * (see how `dueCount` is refreshed on navigation in `app.ts`).
 *
 * Challenge ids reference the shared bank in `practice-data.ts`, so consumers
 * must tolerate ids that no longer resolve if the bank ever shrinks.
 *
 * @see core/storage.ts for the key registry and read/write helpers.
 */
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';

/**
 * Days until an item is due again, indexed by box. Box 0 = due immediately.
 * The array length also defines graduation: a correct answer at the last box
 * removes the item from the queue entirely.
 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

/** Milliseconds in a day — converts {@link REVIEW_INTERVALS_DAYS} into a due timestamp. */
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

/**
 * The queue: items by challenge id. A map rather than an array so recording a
 * miss is an O(1) upsert from any page, and so an id can never be queued twice.
 */
export type ReviewQueue = Record<number, ReviewItem>;

/**
 * Reads the queue from storage.
 *
 * Every mutator below re-reads rather than caching, because misses are
 * recorded from several pages (Practice, Mock Exam, Exam Day) that each hold
 * their own component instance. Re-reading is what keeps them consistent
 * without a shared in-memory owner.
 *
 * @returns The stored queue, or `{}` when absent/unavailable/corrupt.
 */
export function loadQueue(): ReviewQueue {
  return readJson<ReviewQueue>(STORAGE_KEYS.reviewQueue, {});
}

/**
 * Persists the queue. Best-effort — a failed write never surfaces.
 *
 * @param queue The complete queue to store.
 */
export function saveQueue(queue: ReviewQueue): void {
  writeJson(STORAGE_KEYS.reviewQueue, queue);
}

/**
 * Reads the ids of challenges that graduated out of the queue by being
 * answered correctly at the top box.
 *
 * Kept separately from the queue so "mastered" survives the item's removal —
 * the Progress dashboard reports it as a lifetime achievement.
 *
 * @returns Mastered challenge ids, or `[]`.
 */
export function loadMastered(): number[] {
  return readJson<number[]>(STORAGE_KEYS.reviewMastered, []);
}

/**
 * Persists the mastered-id list.
 *
 * @param ids The complete list to store.
 */
function saveMastered(ids: number[]): void {
  writeJson(STORAGE_KEYS.reviewMastered, ids);
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
