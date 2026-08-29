/**
 * Persistence layer — the single source of truth for every localStorage key
 * the app writes, plus the two SSR-safe helpers used to read and write them.
 *
 * ## Why this file exists
 *
 * Study state is spread across independent features (Practice, Mock Exam,
 * Review, Coding Tasks, Exam Day, and the Progress dashboard that aggregates
 * them all). Before this module, each feature declared its key as a bare
 * string literal and the Progress dashboard re-declared the same literals to
 * read them back — `angular-coding-tasks-v1` was spelled out in six separate
 * files. A typo or a version bump in one place silently orphaned the data
 * everywhere else, and nothing failed loudly enough to notice.
 *
 * Centralizing the keys here does not couple the lazy-loaded feature chunks
 * to each other: this module has no Angular dependencies and compiles to a
 * handful of string constants, so importing it from a lazy chunk pulls in
 * essentially nothing.
 *
 * ## Versioning convention
 *
 * Keys carry a `-v<n>` suffix. Bumping it is the deliberate way to invalidate
 * incompatible persisted data: old entries are simply never read again, and
 * `readJson` falls back to the caller's default. Never change a key's shape
 * without bumping its suffix.
 *
 * @see progress.service.ts, streak.service.ts, bookmarks.service.ts — core stores
 * @see pages/practice/review-queue.ts — the spaced-repetition store
 * @see pages/progress/progress.ts — the read-only aggregator over all of these
 */

/**
 * Every localStorage key owned by the app, grouped by the feature that writes
 * it. Readers (notably the Progress dashboard) reference the same constants
 * rather than re-typing the literal.
 *
 * The two unsuffixed keys (`visitedLessons`, `theme`) predate the versioning
 * convention and are left as-is: they hold trivially-shaped data (a string
 * array and a two-value string) that has never needed a migration.
 */
export const STORAGE_KEYS = {
  // --- core services ---
  /** `string[]` of curriculum lesson ids the user has opened. Owner: ProgressService. */
  visitedLessons: 'ng-concepts-visited',
  /** `{current, longest, lastDate}` consecutive-day counter. Owner: StreakService. */
  streak: 'ng-study-streak-v1',
  /** `Record<id, Bookmark>` of starred lessons/questions. Owner: BookmarksService. */
  bookmarks: 'ng-bookmarks-v1',
  /** `'light' | 'dark'`. Owner: App shell (app.ts). */
  theme: 'theme',

  // --- practice ---
  /** `Record<challengeId, {selected, answered, correct, expanded}>`. Owner: Practice. */
  practiceProgress: 'angular-practice-progress-v1',
  /** `{enabled, level, streak}` adaptive-difficulty state. Owner: Practice. */
  practiceAdaptive: 'angular-practice-adaptive-v1',

  // --- spaced repetition ---
  /** `Record<challengeId, ReviewItem>` Leitner queue. Owner: review-queue.ts. */
  reviewQueue: 'angular-review-queue-v1',
  /** `number[]` of challenge ids graduated out of the queue. Owner: review-queue.ts. */
  reviewMastered: 'angular-review-mastered-v1',

  // --- exams & tasks ---
  /** `ExamAttempt[]`, newest first. Owner: MockExam. */
  mockExamHistory: 'angular-mock-exam-history-v1',
  /** `Record<taskId, {done}>`. Owner: CodingTasks. Also read by ExamDay and Progress. */
  codingTasks: 'angular-coding-tasks-v1',
  /** In-flight readiness check, so a refresh does not lose it. Owner: ExamDay. */
  examDayActive: 'angular-exam-day-active-v1',
  /** `ReadinessEntry[]`, newest first. Owner: ExamDay. */
  examDayHistory: 'angular-exam-day-history-v1',
} as const;

/** Union of the literal key strings, for helpers that want to accept only a known key. */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Reads and JSON-parses a stored value, returning `fallback` for every failure
 * mode rather than throwing.
 *
 * Callers treat persisted study data as advisory, never load-bearing, so all
 * three failure modes collapse to the same answer:
 * - storage unavailable (SSR, or a browser with storage disabled),
 * - key absent (first visit),
 * - stored JSON corrupt or from an incompatible older shape.
 *
 * @param key     A key from {@link STORAGE_KEYS}.
 * @param fallback Value returned when nothing usable is stored. Also fixes `T`.
 * @returns The parsed value, or `fallback`.
 *
 * @example
 * const attempts = readJson<ExamAttempt[]>(STORAGE_KEYS.mockExamHistory, []);
 */
export function readJson<T>(key: StorageKey, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * JSON-serializes and stores a value, silently doing nothing if storage is
 * unavailable or full.
 *
 * Writes are deliberately fire-and-forget: a failed write (quota exceeded,
 * private-mode restrictions) must never break the UI the user is interacting
 * with. The in-memory signal remains the source of truth for the session; only
 * persistence across reloads is lost.
 *
 * @param key   A key from {@link STORAGE_KEYS}.
 * @param value Any JSON-serializable value.
 */
export function writeJson(key: StorageKey, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked — persistence is best-effort by design.
  }
}

/**
 * Reads a value stored as a bare string rather than JSON.
 *
 * Only the theme key uses this: it is written unquoted (`dark`, not `"dark"`)
 * because the very first paint reads it, and an unquoted value can be consumed
 * by a tiny inline script without a JSON parse. Everything else should use
 * {@link readJson}.
 *
 * @param key      A key from {@link STORAGE_KEYS}.
 * @param fallback Value returned when nothing is stored or storage is unavailable.
 * @returns The raw stored string, or `fallback`.
 */
export function readRaw<T extends string>(key: StorageKey, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Stores a bare string. Counterpart to {@link readRaw}; same fire-and-forget
 * failure behaviour as {@link writeJson}.
 *
 * @param key   A key from {@link STORAGE_KEYS}.
 * @param value The string to store, written verbatim (not JSON-encoded).
 */
export function writeRaw(key: StorageKey, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // Same rationale as writeJson — persistence is best-effort.
  }
}

/**
 * Removes a stored value. Used by the "reset" affordances (clearing visited
 * lessons, wiping practice progress) rather than writing an empty value, so a
 * reset leaves no residue behind.
 *
 * @param key A key from {@link STORAGE_KEYS}.
 */
export function removeKey(key: StorageKey): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // Same rationale as writeJson — never let a storage failure surface.
  }
}
