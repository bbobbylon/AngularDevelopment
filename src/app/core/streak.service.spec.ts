import { TestBed } from '@angular/core/testing';
import { StreakService } from './streak.service';
import { STORAGE_KEYS } from './storage';

/**
 * The streak counter is pure calendar arithmetic over a persisted date string,
 * and calendar arithmetic is where date bugs live. Three properties matter:
 *
 * - **Idempotence within a day** — `recordVisit` runs on every single
 *   `NavigationEnd`, so browsing twenty lessons must count exactly once.
 * - **Local, not UTC, day boundaries** — the counter has to follow the
 *   calendar the user actually lives in (see the regression test below).
 * - **`longest` is monotonic** — the streak badges read it, and a badge once
 *   earned must never be revoked by a missed day.
 *
 * Time is frozen with fake timers throughout; a test that depended on the real
 * clock would pass or fail depending on the hour it ran.
 */
describe('StreakService', () => {
  /** Builds a fresh service against whatever is currently in localStorage. */
  function makeService(): StreakService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(StreakService);
  }

  /** Freezes the clock at a local date/time, so `todayKey()` is deterministic. */
  function freezeLocal(year: number, month: number, day: number, hour = 12): void {
    vi.setSystemTime(new Date(year, month - 1, day, hour, 0, 0));
  }

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at zero for a user who has never visited', () => {
    const streak = makeService();
    expect(streak.current()).toBe(0);
    expect(streak.longest()).toBe(0);
    expect(streak.lastDate()).toBeNull();
  });

  it('counts the first visit as a streak of 1', () => {
    freezeLocal(2026, 3, 10);
    const streak = makeService();
    expect(streak.recordVisit()).toBe(1);
    expect(streak.current()).toBe(1);
    expect(streak.lastDate()).toBe('2026-03-10');
  });

  it('is a no-op for the rest of the day (returns null so the toast fires once)', () => {
    freezeLocal(2026, 3, 10, 9);
    const streak = makeService();
    expect(streak.recordVisit()).toBe(1);

    freezeLocal(2026, 3, 10, 23);
    expect(streak.recordVisit()).toBeNull();
    expect(streak.current()).toBe(1);
  });

  it('advances on the next calendar day', () => {
    freezeLocal(2026, 3, 10);
    const streak = makeService();
    streak.recordVisit();

    freezeLocal(2026, 3, 11);
    expect(streak.recordVisit()).toBe(2);
    expect(streak.current()).toBe(2);
  });

  it('restarts at 1 after a missed day', () => {
    freezeLocal(2026, 3, 10);
    const streak = makeService();
    streak.recordVisit();

    freezeLocal(2026, 3, 12);
    expect(streak.recordVisit()).toBe(1);
    expect(streak.current()).toBe(1);
  });

  it('keeps `longest` after the current streak breaks', () => {
    const streak = makeService();
    for (const day of [10, 11, 12]) {
      freezeLocal(2026, 3, day);
      streak.recordVisit();
    }
    expect(streak.current()).toBe(3);

    freezeLocal(2026, 3, 20);
    streak.recordVisit();
    expect(streak.current()).toBe(1);
    expect(streak.longest()).toBe(3);
  });

  it('carries the streak across a month boundary', () => {
    freezeLocal(2026, 3, 31);
    const streak = makeService();
    streak.recordVisit();

    freezeLocal(2026, 4, 1);
    expect(streak.recordVisit()).toBe(2);
  });

  it('carries the streak across a leap day', () => {
    freezeLocal(2028, 2, 28);
    const streak = makeService();
    streak.recordVisit();

    freezeLocal(2028, 2, 29);
    expect(streak.recordVisit()).toBe(2);

    freezeLocal(2028, 3, 1);
    expect(streak.recordVisit()).toBe(3);
  });

  it('carries the streak across a spring-forward DST boundary', () => {
    // US DST 2026 starts Sun Mar 8. Parsing the two day-keys as LOCAL time
    // would make this gap 23 hours and round to 0 days ("same day"), silently
    // freezing the counter. The service parses both as UTC midnight so the
    // offset cancels and the gap is exactly 1.
    freezeLocal(2026, 3, 7);
    const streak = makeService();
    streak.recordVisit();

    freezeLocal(2026, 3, 8);
    expect(streak.recordVisit()).toBe(2);
  });

  it('uses the LOCAL calendar day, not the UTC one', () => {
    // Regression: `toISOString().slice(0, 10)` converts to UTC first, so for a
    // user west of Greenwich an 8pm session is already "tomorrow" in UTC.
    // Two consecutive evening sessions would then land on the same UTC day and
    // the streak would stop advancing. Late-evening visits on consecutive
    // local days must count as two days regardless of the runner's timezone.
    freezeLocal(2026, 6, 10, 20);
    const streak = makeService();
    expect(streak.recordVisit()).toBe(1);
    expect(streak.lastDate()).toBe('2026-06-10');

    freezeLocal(2026, 6, 11, 20);
    expect(streak.recordVisit()).toBe(2);
    expect(streak.lastDate()).toBe('2026-06-11');
  });

  it('pads single-digit months and days to a sortable YYYY-MM-DD', () => {
    freezeLocal(2026, 1, 5);
    const streak = makeService();
    streak.recordVisit();
    expect(streak.lastDate()).toBe('2026-01-05');
  });

  it('persists across a reload', () => {
    freezeLocal(2026, 3, 10);
    makeService().recordVisit();
    TestBed.tick(); // flush the persistence effect()

    freezeLocal(2026, 3, 11);
    const reloaded = makeService();
    expect(reloaded.current()).toBe(1);
    expect(reloaded.recordVisit()).toBe(2);
  });

  it('starts clean when the persisted state is corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.streak, '{not json');
    freezeLocal(2026, 3, 10);
    const streak = makeService();
    expect(streak.current()).toBe(0);
    expect(streak.recordVisit()).toBe(1);
  });

  it('reset() clears longest too', () => {
    freezeLocal(2026, 3, 10);
    const streak = makeService();
    streak.recordVisit();
    streak.reset();
    expect(streak.current()).toBe(0);
    expect(streak.longest()).toBe(0);
    expect(streak.lastDate()).toBeNull();
  });
});
