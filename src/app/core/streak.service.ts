import { Injectable, computed, effect, signal } from '@angular/core';

const STORAGE_KEY = 'ng-study-streak-v1';

interface StreakState {
  current: number;
  longest: number;
  lastDate: string | null; // YYYY-MM-DD, local calendar day of the last recorded visit
}

const EMPTY_STATE: StreakState = { current: 0, longest: 0, lastDate: null };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole calendar days between two YYYY-MM-DD keys (b - a). */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / msPerDay);
}

/**
 * Study-streak tracker — counts consecutive calendar days on which the app
 * was visited. Mirrors the ProgressService pattern: signal state loaded once
 * from localStorage, an effect() persists every change, everything is
 * SSR-safe.
 *
 * `recordVisit()` is called once per navigation from app.ts. It is a no-op
 * once today has already been counted, so repeated navigations in the same
 * day don't inflate anything.
 */
@Injectable({ providedIn: 'root' })
export class StreakService {
  private readonly _state = signal<StreakState>(this.loadFromStorage());

  readonly current = computed(() => this._state().current);
  readonly longest = computed(() => this._state().longest);
  readonly lastDate = computed(() => this._state().lastDate);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state()));
      } catch {
        // storage full or unavailable — ignore
      }
    });
  }

  /**
   * Advances the streak if today hasn't been counted yet. Returns the new
   * current-streak value when it changed (so the caller can show a toast),
   * or null when today was already recorded.
   */
  recordVisit(): number | null {
    const today = todayKey();
    const state = this._state();
    if (state.lastDate === today) return null;

    const gap = state.lastDate ? daysBetween(state.lastDate, today) : null;
    const current = gap === 1 ? state.current + 1 : 1;
    const longest = Math.max(state.longest, current);
    this._state.set({ current, longest, lastDate: today });
    return current;
  }

  reset(): void {
    this._state.set(EMPTY_STATE);
  }

  private loadFromStorage(): StreakState {
    try {
      if (typeof localStorage === 'undefined') return EMPTY_STATE;
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StreakState) : EMPTY_STATE;
    } catch {
      return EMPTY_STATE;
    }
  }
}
