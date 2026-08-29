import { STORAGE_KEYS, readJson, readRaw, removeKey, writeJson, writeRaw } from './storage';

/**
 * The storage layer is the one module every feature depends on, so two very
 * different things are pinned here:
 *
 * 1. **The literal key strings.** Feature specs now reference `STORAGE_KEYS.*`
 *    instead of re-typing `'angular-coding-tasks-v1'`, which is the right call
 *    for readability but means a typo in the registry would rename a key
 *    everywhere at once and silently orphan every existing user's data. The
 *    snapshot below is the guard: changing a value here must be deliberate.
 * 2. **The failure behaviour of the helpers.** Every caller treats persisted
 *    study data as advisory, and that only holds if the helpers really do
 *    swallow corrupt JSON and unavailable storage instead of throwing.
 */
describe('core/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('STORAGE_KEYS', () => {
    it('pins the exact on-disk key strings (changing one orphans real user data)', () => {
      expect(STORAGE_KEYS).toEqual({
        visitedLessons: 'ng-concepts-visited',
        streak: 'ng-study-streak-v1',
        bookmarks: 'ng-bookmarks-v1',
        theme: 'theme',
        practiceProgress: 'angular-practice-progress-v1',
        practiceAdaptive: 'angular-practice-adaptive-v1',
        reviewQueue: 'angular-review-queue-v1',
        reviewMastered: 'angular-review-mastered-v1',
        mockExamHistory: 'angular-mock-exam-history-v1',
        codingTasks: 'angular-coding-tasks-v1',
        examDayActive: 'angular-exam-day-active-v1',
        examDayHistory: 'angular-exam-day-history-v1',
      });
    });

    it('never reuses a key for two features', () => {
      const values = Object.values(STORAGE_KEYS);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('readJson', () => {
    it('returns the fallback when the key was never written', () => {
      expect(readJson(STORAGE_KEYS.mockExamHistory, ['fallback'])).toEqual(['fallback']);
    });

    it('round-trips a written value', () => {
      writeJson(STORAGE_KEYS.bookmarks, { a: 1 });
      expect(readJson(STORAGE_KEYS.bookmarks, {})).toEqual({ a: 1 });
    });

    it('returns the fallback rather than throwing on corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEYS.streak, '{not json');
      expect(readJson(STORAGE_KEYS.streak, { current: 0 })).toEqual({ current: 0 });
    });

    it('treats an empty stored string as absent', () => {
      localStorage.setItem(STORAGE_KEYS.codingTasks, '');
      expect(readJson(STORAGE_KEYS.codingTasks, { fallback: true })).toEqual({ fallback: true });
    });

    it('does not confuse a stored falsy value with a missing one', () => {
      writeJson(STORAGE_KEYS.practiceProgress, 0);
      expect(readJson(STORAGE_KEYS.practiceProgress, 99)).toBe(0);
      writeJson(STORAGE_KEYS.practiceProgress, false);
      expect(readJson(STORAGE_KEYS.practiceProgress, true)).toBe(false);
    });
  });

  describe('writeJson', () => {
    it('swallows a quota error instead of surfacing it to the UI', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new DOMException('QuotaExceededError');
      };
      try {
        expect(() => writeJson(STORAGE_KEYS.bookmarks, { a: 1 })).not.toThrow();
      } finally {
        Storage.prototype.setItem = original;
      }
    });
  });

  describe('removeKey', () => {
    it('leaves no residue behind, so the next read takes the fallback', () => {
      writeJson(STORAGE_KEYS.examDayActive, { inFlight: true });
      removeKey(STORAGE_KEYS.examDayActive);
      expect(localStorage.getItem(STORAGE_KEYS.examDayActive)).toBeNull();
      expect(readJson(STORAGE_KEYS.examDayActive, null)).toBeNull();
    });

    it('is a no-op on a key that was never written', () => {
      expect(() => removeKey(STORAGE_KEYS.examDayHistory)).not.toThrow();
    });
  });

  describe('readRaw / writeRaw', () => {
    it('stores the string unquoted so a first-paint script can use it directly', () => {
      writeRaw(STORAGE_KEYS.theme, 'dark');
      expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    });

    it('round-trips through readRaw', () => {
      writeRaw(STORAGE_KEYS.theme, 'dark');
      expect(readRaw(STORAGE_KEYS.theme, 'light')).toBe('dark');
    });

    it('falls back when absent', () => {
      expect(readRaw(STORAGE_KEYS.theme, 'light')).toBe('light');
    });
  });
});
