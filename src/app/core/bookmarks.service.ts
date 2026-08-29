import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'ng-bookmarks-v1';

export interface Bookmark {
  /** Curriculum lesson id, or `practice-<challengeId>` for a starred question. */
  id: string;
  label: string;
  note: string;
  addedAt: number;
}

type BookmarkMap = Record<string, Bookmark>;

/**
 * Bookmarks & personal notes — star any lesson or practice question and
 * attach a free-text note. Same signal+effect pattern as ProgressService:
 * loaded once from localStorage, persisted automatically on every change.
 *
 * Keys are route-shaped so a bookmark can always be resolved back to where
 * it came from: a curriculum lesson id (`routing-basics`) or a synthetic
 * `practice-<id>` for a challenge, which has no route of its own.
 */
@Injectable({ providedIn: 'root' })
export class BookmarksService {
  private readonly _bookmarks = signal<BookmarkMap>(this.loadFromStorage());
  readonly bookmarks = this._bookmarks.asReadonly();
  readonly count = computed(() => Object.keys(this._bookmarks()).length);

  /** Newest first — matches how a "recently saved" list is expected to read. */
  readonly list = computed(() =>
    Object.values(this._bookmarks()).sort((a, b) => b.addedAt - a.addedAt),
  );

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._bookmarks()));
      } catch {
        // storage full or unavailable — ignore
      }
    });
  }

  isBookmarked(id: string): boolean {
    return id in this._bookmarks();
  }

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

  setNote(id: string, note: string): void {
    this._bookmarks.update((map) => (id in map ? { ...map, [id]: { ...map[id], note } } : map));
  }

  remove(id: string): void {
    this._bookmarks.update((map) => {
      const rest = { ...map };
      delete rest[id];
      return rest;
    });
  }

  private loadFromStorage(): BookmarkMap {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BookmarkMap) : {};
    } catch {
      return {};
    }
  }
}
