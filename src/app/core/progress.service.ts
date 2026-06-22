import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'ng-concepts-visited';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _visited = signal<ReadonlySet<string>>(this.loadFromStorage());

  /** Read-only view of the visited-lesson ID set. */
  readonly visited = this._visited.asReadonly();

  /** Number of lessons the user has opened. */
  readonly visitedCount = computed(() => this._visited().size);

  constructor() {
    // effect() persists every change to localStorage automatically.
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._visited()]));
      } catch {
        /* storage full or unavailable — ignore */
      }
    });
  }

  markVisited(lessonId: string): void {
    if (!lessonId || this._visited().has(lessonId)) return;
    this._visited.update((s) => new Set([...s, lessonId]));
  }

  isVisited(lessonId: string): boolean {
    return this._visited().has(lessonId);
  }

  reset(): void {
    this._visited.set(new Set());
  }

  private loadFromStorage(): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }
}
