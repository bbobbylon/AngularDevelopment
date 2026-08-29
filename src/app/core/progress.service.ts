import { Injectable, computed, effect, signal } from '@angular/core';
import { STORAGE_KEYS, readJson, writeJson } from './storage';

/**
 * Tracks which curriculum lessons the user has opened at least once.
 *
 * This is the app's simplest persistent store and the template the other
 * signal-backed services ({@link StreakService}, {@link BookmarksService})
 * follow: state lives in a private `signal`, is exposed read-only, derived
 * values are `computed`, and a single `effect` in the constructor mirrors
 * every change to localStorage.
 *
 * Marking happens centrally — the app shell subscribes to router
 * `NavigationEnd` and calls {@link markVisited} with the URL segment — so no
 * individual lesson component has to remember to report itself.
 *
 * Consumers:
 * - `app.html` footer — the visited count and the "Reset progress" button.
 * - `pages/home` — the green "visited" markers on curriculum cards.
 * - `pages/progress` — lesson-coverage percentage feeding the readiness score.
 *
 * @see storage.ts for the key registry and the SSR-safe read/write helpers.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  /**
   * The visited lesson ids. A `Set` (not an array) because the only two
   * operations are membership tests and idempotent inserts, both O(1).
   * Persisted as a plain array since `Set` is not JSON-serializable.
   */
  private readonly _visited = signal<ReadonlySet<string>>(this.loadFromStorage());

  /** Read-only view for templates and other services. */
  readonly visited = this._visited.asReadonly();

  /** How many distinct lessons have been opened. Drives the footer counter. */
  readonly visitedCount = computed(() => this._visited().size);

  /**
   * Mirrors every state change to localStorage.
   *
   * Declared once here rather than writing from each mutator, so no future
   * mutator can forget to save. This is the pattern {@link StreakService} and
   * {@link BookmarksService} both copy.
   */
  constructor() {
    effect(() => writeJson(STORAGE_KEYS.visitedLessons, [...this._visited()]));
  }

  /**
   * Records a lesson as visited. Idempotent — re-visiting is a no-op that does
   * not touch the signal, so it will not trigger a redundant storage write.
   *
   * @param lessonId A curriculum lesson id (the route segment, e.g. `signals`).
   */
  markVisited(lessonId: string): void {
    if (this._visited().has(lessonId)) return;
    this._visited.update((set) => new Set(set).add(lessonId));
  }

  /**
   * Whether a lesson has been opened before.
   *
   * @param lessonId A curriculum lesson id.
   * @returns `true` if the lesson has been visited.
   */
  isVisited(lessonId: string): boolean {
    return this._visited().has(lessonId);
  }

  /**
   * Clears all visited-lesson history. Wired to the footer's "Reset progress"
   * button.
   *
   * Note this only clears the signal — the constructor `effect` then persists
   * the now-empty set. Deleting the key here instead would be undone by that
   * same effect a moment later.
   */
  reset(): void {
    this._visited.set(new Set());
  }

  /**
   * Loads the persisted id list on construction, tolerating absent or corrupt
   * data by starting empty.
   *
   * @returns The stored visited-lesson set, or an empty set.
   */
  private loadFromStorage(): ReadonlySet<string> {
    return new Set(readJson<string[]>(STORAGE_KEYS.visitedLessons, []));
  }
}
