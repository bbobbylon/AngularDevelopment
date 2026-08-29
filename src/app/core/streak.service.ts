import { Injectable, computed, effect, signal } from '@angular/core';
import { STORAGE_KEYS, readJson, writeJson } from './storage';

/** Persisted shape of the streak counter. */
interface StreakState {
  /** Consecutive days up to and including `lastDate`. `0` before the first visit. */
  current: number;
  /** Best `current` ever reached. Never decreases. */
  longest: number;
  /** Local calendar day (`YYYY-MM-DD`) of the most recent counted visit, or `null`. */
  lastDate: string | null;
}

/** Starting state for a user who has never visited, and the reset target. */
const EMPTY_STATE: StreakState = { current: 0, longest: 0, lastDate: null };

/** Milliseconds in a day — used to convert a date difference into whole days. */
const MS_PER_DAY = 86_400_000;

/**
 * Today's date as a `YYYY-MM-DD` key in the user's **local** timezone.
 *
 * Deliberately not `toISOString().slice(0, 10)`, which converts to UTC first:
 * for a user west of Greenwich, studying at 8pm local would already be
 * "tomorrow" in UTC, so two evening sessions on consecutive local days could
 * register as the same UTC day (silently breaking the streak) or skip one.
 * A streak counter must follow the calendar the user actually lives in.
 *
 * @returns The local date, e.g. `2026-08-28`.
 */
function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Whole calendar days from `a` to `b` (so `b - a`).
 *
 * Both keys are parsed as UTC midnight. That is safe precisely *because* both
 * sides get the same treatment: the offset cancels, leaving an exact day count
 * with no DST drift (parsing as local time would make a spring-forward
 * boundary 23 hours and round to 0).
 *
 * @param a Earlier `YYYY-MM-DD` key.
 * @param b Later `YYYY-MM-DD` key.
 * @returns Day difference; `1` means `b` is the day after `a`.
 */
function daysBetween(a: string, b: string): number {
  const from = new Date(`${a}T00:00:00Z`).getTime();
  const to = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

/**
 * Counts consecutive calendar days on which the app was used — the 🔥 counter
 * in the header and a stat box on the Progress dashboard.
 *
 * The streak advances at most once per day. The app shell calls
 * {@link recordVisit} on every router `NavigationEnd`; the first call each day
 * advances the counter and every later call that day is a no-op, so browsing
 * twenty lessons counts exactly the same as browsing one.
 *
 * Also feeds the `streak-3` and `streak-7` achievements, which read
 * {@link longest} rather than {@link current} so that a badge once earned is
 * never taken away by a missed day.
 *
 * @see storage.ts for the key registry and SSR-safe read/write helpers.
 * @see achievements.ts for the badges derived from `longest`.
 */
@Injectable({ providedIn: 'root' })
export class StreakService {
  /** Whole persisted state; the public surface exposes it as three computeds. */
  private readonly _state = signal<StreakState>(this.loadFromStorage());

  /** Current consecutive-day count. Resets to 1 after a missed day. */
  readonly current = computed(() => this._state().current);

  /** Best streak ever reached. Monotonic — never decreases. */
  readonly longest = computed(() => this._state().longest);

  /** Local `YYYY-MM-DD` of the last counted visit, or `null` if never visited. */
  readonly lastDate = computed(() => this._state().lastDate);

  /**
   * Mirrors every change to localStorage. Declared once here rather than
   * writing from {@link recordVisit} and {@link reset} separately.
   * (Same pattern as {@link ProgressService}.)
   */
  constructor() {
    effect(() => writeJson(STORAGE_KEYS.streak, this._state()));
  }

  /**
   * Counts today toward the streak, if it has not been counted already.
   *
   * Three cases, decided by the gap since the last counted day:
   * - **same day** — no-op, returns `null`.
   * - **exactly 1 day** — the streak continues, `current + 1`.
   * - **anything else** (a gap, or the very first visit) — the streak restarts at 1.
   *
   * @returns The new `current` value when the streak advanced, or `null` if
   *          today was already counted. Callers use the `null` to decide
   *          whether to show a toast, so it fires once a day at most.
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

  /**
   * Clears the streak entirely, including `longest`. Not currently wired to
   * any UI — provided for parity with the other stores and for tests.
   */
  reset(): void {
    this._state.set(EMPTY_STATE);
  }

  /**
   * Loads persisted state, falling back to a zeroed streak when storage is
   * empty, unavailable or corrupt.
   *
   * @returns The stored state, or {@link EMPTY_STATE}.
   */
  private loadFromStorage(): StreakState {
    return readJson<StreakState>(STORAGE_KEYS.streak, EMPTY_STATE);
  }
}
