import { Injectable, computed, effect, signal } from '@angular/core';
import { STORAGE_KEYS, readJson, writeJson } from './storage';

/** A single starred item plus the user's note about it. */
export interface Bookmark {
  /** See the id convention on {@link BookmarksService}. */
  id: string;
  /** Display text: the lesson title, or `Practice #<n> — <truncated question>`. */
  label: string;
  /** Free-text note; empty string until the user types one. */
  note: string;
  /** Epoch ms when starred. Sorts the list newest-first. */
  addedAt: number;
}

/** Bookmarks indexed by id — O(1) `isBookmarked` on every practice card render. */
type BookmarkMap = Record<string, Bookmark>;

/** Longest question text kept in a generated label before it is ellipsized. */
const LABEL_MAX_LENGTH = 60;

/**
 * Star lessons and practice questions, and attach a personal note to each.
 *
 * ## Id convention
 *
 * Bookmarks come from two places with different addressing, so ids are
 * namespaced to keep them distinguishable *and* resolvable back to a
 * destination:
 * - **Lessons** use the bare curriculum lesson id (`signals`), which is also
 *   its route — so `/bookmarks` can link straight to it.
 * - **Practice questions** use `practice-<challengeId>`, because a challenge
 *   has no route of its own; the page links to `/practice` instead.
 *
 * The `practice-` prefix is the *only* thing distinguishing the two cases, so
 * the Bookmarks page tests for it rather than storing a separate `kind` field.
 *
 * Set from the ☆ button in the app header (lesson pages) and the ☆ on each
 * card on the Practice page. Surfaced at `/bookmarks`, with the count shown as
 * a nav badge and feeding the `collector` achievement.
 *
 * @see storage.ts for the key registry and SSR-safe read/write helpers.
 */
@Injectable({ providedIn: 'root' })
export class BookmarksService {
  /** All bookmarks, keyed by id. */
  private readonly _bookmarks = signal<BookmarkMap>(this.loadFromStorage());

  /** Read-only map view, for callers that want direct id lookup. */
  readonly bookmarks = this._bookmarks.asReadonly();

  /** How many items are starred. Drives the nav badge and the achievement. */
  readonly count = computed(() => Object.keys(this._bookmarks()).length);

  /** All bookmarks newest-first — the order the `/bookmarks` page renders. */
  readonly list = computed(() =>
    Object.values(this._bookmarks()).sort((a, b) => b.addedAt - a.addedAt),
  );

  /**
   * Mirrors every change to localStorage. Declared once here rather than
   * writing from each mutator, so no future mutator can forget to save.
   * (Same pattern as {@link ProgressService}.)
   */
  constructor() {
    effect(() => writeJson(STORAGE_KEYS.bookmarks, this._bookmarks()));
  }

  /**
   * Whether an item is currently starred. Called once per rendered practice
   * card, hence the map-backed O(1) lookup.
   *
   * @param id A namespaced bookmark id (see the class doc).
   */
  isBookmarked(id: string): boolean {
    return id in this._bookmarks();
  }

  /**
   * Stars an unstarred item, or removes an already-starred one.
   *
   * Removing discards any note attached to it — starring again starts with an
   * empty note rather than resurrecting the old one. This is intentional: the
   * star is the single control, and a hidden note surviving an un-star would
   * be surprising.
   *
   * @param id    A namespaced bookmark id (see the class doc).
   * @param label Display text, used only when creating. Ignored on removal.
   */
  toggle(id: string, label: string): void {
    this._bookmarks.update((map) => {
      if (id in map) {
        const rest = { ...map };
        delete rest[id];
        return rest;
      }
      return { ...map, [id]: { id, label, note: '', addedAt: Date.now() } };
    });
  }

  /**
   * Replaces the note on an existing bookmark. Silently ignores unknown ids so
   * a stale editor cannot resurrect a bookmark removed in another tab.
   *
   * @param id   A namespaced bookmark id.
   * @param note The full replacement note text.
   */
  setNote(id: string, note: string): void {
    this._bookmarks.update((map) => (id in map ? { ...map, [id]: { ...map[id], note } } : map));
  }

  /**
   * Deletes a bookmark outright. Backs the ✕ button on the Bookmarks page,
   * where {@link toggle}'s create-if-absent behaviour would be wrong.
   *
   * @param id A namespaced bookmark id.
   */
  remove(id: string): void {
    this._bookmarks.update((map) => {
      const rest = { ...map };
      delete rest[id];
      return rest;
    });
  }

  /**
   * Builds the display label for a starred practice question, truncating long
   * question text so the Bookmarks list stays scannable.
   *
   * @param challengeId The challenge's numeric id.
   * @param question    Its full question text.
   * @returns A label like `Practice #133 — What does adding 'priority' to…`.
   */
  static practiceLabel(challengeId: number, question: string): string {
    const trimmed =
      question.length > LABEL_MAX_LENGTH ? `${question.slice(0, LABEL_MAX_LENGTH)}…` : question;
    return `Practice #${challengeId} — ${trimmed}`;
  }

  /**
   * Loads persisted bookmarks, starting empty when storage is unavailable or
   * the stored JSON is corrupt.
   */
  private loadFromStorage(): BookmarkMap {
    return readJson<BookmarkMap>(STORAGE_KEYS.bookmarks, {});
  }
}
