import { CURRICULUM } from '../../core/curriculum';
import { CHALLENGES, shuffle } from './practice-data';

/**
 * Integrity checks over the shared challenge bank — the single source of truth
 * behind Practice, Mock Exam, Flashcards, Review and Exam-Day. These guard the
 * invariants the consuming pages rely on but cannot enforce at compile time.
 */
describe('practice-data challenge bank', () => {
  it('has globally unique ids (review queue and progress key on them)', () => {
    const ids = CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every challenge non-empty question, options and explanation', () => {
    for (const ch of CHALLENGES) {
      expect(ch.question.trim().length, `challenge ${ch.id} question`).toBeGreaterThan(0);
      expect(ch.options?.length ?? 0, `challenge ${ch.id} options`).toBeGreaterThanOrEqual(2);
      expect(ch.explanation.trim().length, `challenge ${ch.id} explanation`).toBeGreaterThan(0);
    }
  });

  it('keeps every numeric answer a valid index into its options', () => {
    for (const ch of CHALLENGES) {
      if (!ch.options || typeof ch.answer !== 'number') continue;
      expect(ch.answer, `challenge ${ch.id} answer index`).toBeGreaterThanOrEqual(0);
      expect(ch.answer, `challenge ${ch.id} answer index`).toBeLessThan(ch.options.length);
    }
  });

  it('points every topicPath at a real curriculum lesson (no 404 study links)', () => {
    // Regression guard: several challenges once used topicPath 'state', which
    // is a category id, not a lesson id — their "Study this topic" links 404d.
    const lessonIds = new Set(CURRICULUM.map((l) => l.id));
    for (const ch of CHALLENGES) {
      if (!ch.topicPath) continue;
      expect(lessonIds.has(ch.topicPath), `challenge ${ch.id} topicPath "${ch.topicPath}"`).toBe(
        true,
      );
    }
  });

  it('shuffle returns a permutation without mutating its input', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    const out = shuffle(input);
    expect(input).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
  });
});
