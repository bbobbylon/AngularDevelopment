import {
  REVIEW_INTERVALS_DAYS,
  dueCount,
  dueItems,
  gradeReview,
  loadMastered,
  loadQueue,
  recordMisses,
} from './review-queue';

/**
 * The review queue is the one store SHARED across pages (Practice, Mock Exam,
 * Flashcards and Exam-Day all write misses; Review grades; the nav badge and
 * Progress dashboard read counts) — so its behavior and its storage keys are
 * app-wide contracts.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const QUEUE_KEY = 'angular-review-queue-v1';
const MASTERED_KEY = 'angular-review-mastered-v1';

describe('review-queue store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('recordMisses', () => {
    it('enqueues new misses at box 0, due immediately', () => {
      const now = 1_000_000;
      const queue = recordMisses([7, 9], now);
      expect(queue[7]).toEqual({ id: 7, box: 0, due: now, lapses: 1 });
      expect(queue[9]).toEqual({ id: 9, box: 0, due: now, lapses: 1 });
    });

    it('demotes an already-queued item back to box 0 and counts the lapse', () => {
      recordMisses([7], 1000);
      gradeReview(7, true, 1000); // promote to box 1
      const queue = recordMisses([7], 2000);
      expect(queue[7].box).toBe(0);
      expect(queue[7].lapses).toBe(2);
    });

    it('pulls a re-missed challenge back out of the mastered list', () => {
      recordMisses([7], 0);
      // Promote through every box until it graduates.
      for (let i = 1; i < REVIEW_INTERVALS_DAYS.length; i++) gradeReview(7, true, 0);
      gradeReview(7, true, 0);
      expect(loadMastered()).toContain(7);

      recordMisses([7], 0);
      expect(loadMastered()).not.toContain(7);
      expect(loadQueue()[7]).toBeDefined();
    });

    it('is a no-op read when given no ids', () => {
      recordMisses([5], 0);
      const queue = recordMisses([], 999);
      expect(Object.keys(queue)).toEqual(['5']);
    });
  });

  describe('gradeReview', () => {
    it('promotes a correct answer one box with the longer interval', () => {
      const now = 1_000_000;
      recordMisses([3], now);
      const queue = gradeReview(3, true, now);
      expect(queue[3].box).toBe(1);
      expect(queue[3].due).toBe(now + REVIEW_INTERVALS_DAYS[1] * DAY_MS);
    });

    it('demotes a wrong answer to box 0, due immediately', () => {
      const now = 1_000_000;
      recordMisses([3], now);
      gradeReview(3, true, now);
      const queue = gradeReview(3, false, now + 5000);
      expect(queue[3].box).toBe(0);
      expect(queue[3].due).toBe(now + 5000);
      expect(queue[3].lapses).toBe(2);
    });

    it('graduates an item correct at the top box: out of the queue, into mastered', () => {
      recordMisses([3], 0);
      let queue = loadQueue();
      for (let i = 1; i < REVIEW_INTERVALS_DAYS.length; i++) {
        queue = gradeReview(3, true, 0);
      }
      expect(queue[3].box).toBe(REVIEW_INTERVALS_DAYS.length - 1);
      queue = gradeReview(3, true, 0);
      expect(queue[3]).toBeUndefined();
      expect(loadMastered()).toEqual([3]);
    });

    it('ignores an id that is not queued (stale session)', () => {
      const queue = gradeReview(42, true, 0);
      expect(queue[42]).toBeUndefined();
      expect(loadMastered()).toEqual([]);
    });
  });

  describe('dueItems / dueCount', () => {
    it('returns only due items, most overdue first', () => {
      const now = 10 * DAY_MS;
      recordMisses([1], now - 2 * DAY_MS);
      recordMisses([2], now - 5 * DAY_MS);
      recordMisses([3], now); // due exactly now — included
      // Promote 1 so its due date moves into the future.
      gradeReview(1, true, now);

      const due = dueItems(loadQueue(), now);
      expect(due.map((i) => i.id)).toEqual([2, 3]);
      expect(dueCount(loadQueue(), now)).toBe(2);
    });
  });

  describe('storage contract', () => {
    it('writes the keys other pages read (progress dashboard, nav badge)', () => {
      // These literals are duplicated in consumers — this test fails if the
      // store ever bumps its -v suffix without the readers being updated.
      recordMisses([1], 0);
      expect(localStorage.getItem(QUEUE_KEY)).toBeTruthy();

      for (let i = 0; i <= REVIEW_INTERVALS_DAYS.length; i++) gradeReview(1, true, 0);
      expect(localStorage.getItem(MASTERED_KEY)).toBeTruthy();
    });

    it('survives corrupt storage by returning empty structures', () => {
      localStorage.setItem(QUEUE_KEY, '{not json');
      localStorage.setItem(MASTERED_KEY, '{not json');
      expect(loadQueue()).toEqual({});
      expect(loadMastered()).toEqual([]);
    });
  });
});
