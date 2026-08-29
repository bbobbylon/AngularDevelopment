import { ACHIEVEMENTS, type AchievementStats } from './achievements';

/**
 * Achievements are pure predicates over a stats snapshot — no storage, no DI.
 * That makes two whole classes of bug possible instead of the usual one:
 *
 * - a predicate that never fires (or fires for everyone), and
 * - a `progress` bar that disagrees with its own `unlocked` predicate, so the
 *   card sits at 100% while still showing as locked.
 *
 * The generic sweeps below check the second class across every badge at once,
 * so a badge added later is covered without touching this file.
 */

/** A user who has done nothing — every badge must be locked. */
const ZERO: AchievementStats = {
  lessonsVisited: 0,
  lessonsBuilt: 100,
  practiceAnswered: 0,
  practiceCorrect: 0,
  examsPassed: 0,
  bestExam: 0,
  streakLongest: 0,
  bookmarksCount: 0,
  tasksDone: 0,
  reviewMastered: 0,
};

/** A user who has maxed out everything — every badge must be unlocked. */
const MAXED: AchievementStats = {
  lessonsVisited: 100,
  lessonsBuilt: 100,
  practiceAnswered: 500,
  practiceCorrect: 500,
  examsPassed: 20,
  bestExam: 100,
  streakLongest: 60,
  bookmarksCount: 50,
  tasksDone: 30,
  reviewMastered: 100,
};

/** ZERO with a single stat raised — for testing one badge in isolation. */
function statsWith(overrides: Partial<AchievementStats>): AchievementStats {
  return { ...ZERO, ...overrides };
}

describe('achievements', () => {
  it('has a unique id per achievement', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every achievement an icon, title and description', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.icon, a.id).toBeTruthy();
      expect(a.title, a.id).toBeTruthy();
      expect(a.description, a.id).toBeTruthy();
    }
  });

  it('locks everything for a brand-new user', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.unlocked(ZERO), a.id).toBe(false);
    }
  });

  it('unlocks everything for a maxed-out user', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.unlocked(MAXED), a.id).toBe(true);
    }
  });

  it('reports 0% progress for a brand-new user', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.progress(ZERO), a.id).toBe(0);
    }
  });

  it('clamps progress to 0-100 in both directions', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.progress(ZERO), a.id).toBeGreaterThanOrEqual(0);
      expect(a.progress(MAXED), a.id).toBeLessThanOrEqual(100);
      expect(a.progress(MAXED), a.id).toBe(100);
    }
  });

  it('never shows 100% progress on a badge that is still locked', () => {
    // The inverse of the pair below: a full bar must mean the predicate fired,
    // otherwise the card reads "complete" while refusing to unlock.
    for (const a of ACHIEVEMENTS) {
      if (a.progress(MAXED) === 100) expect(a.unlocked(MAXED), a.id).toBe(true);
    }
  });

  it('shows 100% progress on every unlocked badge', () => {
    for (const a of ACHIEVEMENTS) {
      if (a.unlocked(MAXED)) expect(a.progress(MAXED), a.id).toBe(100);
    }
  });

  describe('individual thresholds', () => {
    /** Looks a badge up by id, failing loudly if it was renamed. */
    function byId(id: string) {
      const found = ACHIEVEMENTS.find((a) => a.id === id);
      expect(found, `achievement "${id}" not found`).toBeDefined();
      return found!;
    }

    it('first-lesson unlocks on the very first visit', () => {
      expect(byId('first-lesson').unlocked(statsWith({ lessonsVisited: 1 }))).toBe(true);
    });

    it('all-lessons needs every built lesson visited', () => {
      const badge = byId('all-lessons');
      expect(badge.unlocked(statsWith({ lessonsVisited: 99, lessonsBuilt: 100 }))).toBe(false);
      expect(badge.unlocked(statsWith({ lessonsVisited: 100, lessonsBuilt: 100 }))).toBe(true);
    });

    it('all-lessons stays locked when the curriculum is empty (no vacuous win)', () => {
      // Guards the `lessonsBuilt > 0` clause: 0 >= 0 would otherwise unlock it
      // for a user who has visited nothing.
      expect(byId('all-lessons').unlocked(statsWith({ lessonsVisited: 0, lessonsBuilt: 0 }))).toBe(
        false,
      );
    });

    it('practice-50 and practice-100 unlock at their exact counts', () => {
      expect(byId('practice-50').unlocked(statsWith({ practiceAnswered: 49 }))).toBe(false);
      expect(byId('practice-50').unlocked(statsWith({ practiceAnswered: 50 }))).toBe(true);
      expect(byId('practice-100').unlocked(statsWith({ practiceAnswered: 99 }))).toBe(false);
      expect(byId('practice-100').unlocked(statsWith({ practiceAnswered: 100 }))).toBe(true);
    });

    it('exam-90 needs a 90% score, not just a pass', () => {
      const badge = byId('exam-90');
      expect(badge.unlocked(statsWith({ bestExam: 89 }))).toBe(false);
      expect(badge.unlocked(statsWith({ bestExam: 90 }))).toBe(true);
    });

    it('streak badges read the longest streak, so a missed day cannot revoke them', () => {
      expect(byId('streak-3').unlocked(statsWith({ streakLongest: 3 }))).toBe(true);
      expect(byId('streak-7').unlocked(statsWith({ streakLongest: 6 }))).toBe(false);
      expect(byId('streak-7').unlocked(statsWith({ streakLongest: 7 }))).toBe(true);
    });

    it('collector needs 5 bookmarks', () => {
      expect(byId('collector').unlocked(statsWith({ bookmarksCount: 4 }))).toBe(false);
      expect(byId('collector').unlocked(statsWith({ bookmarksCount: 5 }))).toBe(true);
    });

    it('builder needs 5 coding tasks', () => {
      expect(byId('builder').unlocked(statsWith({ tasksDone: 4 }))).toBe(false);
      expect(byId('builder').unlocked(statsWith({ tasksDone: 5 }))).toBe(true);
    });

    it('reviewer needs 10 mastered questions', () => {
      expect(byId('reviewer').unlocked(statsWith({ reviewMastered: 9 }))).toBe(false);
      expect(byId('reviewer').unlocked(statsWith({ reviewMastered: 10 }))).toBe(true);
    });
  });
});
