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

/**
 * Answer-quality guards — the "longest option is always correct" tell.
 *
 * The mock exam shuffles option *positions* at render time, so it cannot leak the
 * answer by placement. But it renders option *text* verbatim, so if the author
 * writes the correct answer as a full self-justifying paragraph and the three
 * distractors as terse throwaway labels, the answer is guessable by length alone.
 * An earlier version of this bank had that flaw badly: the correct option was the
 * single longest choice in 96% of questions (random chance is ~25%) and averaged
 * 3.4x the word count of a distractor — you could pass by "pick the long one".
 *
 * These are statistical guards, not per-question style rules: they let individual
 * questions vary but fail the build if the *bank as a whole* drifts back toward
 * length being a reliable predictor of the answer. Justification for why an option
 * is right or wrong belongs in `explanation`, not smuggled into the option text.
 */
describe('practice-data answer-length neutrality', () => {
  /** Multiple-choice questions the length tell can apply to. */
  const mc = CHALLENGES.filter(
    (c) => Array.isArray(c.options) && typeof c.answer === 'number',
  ) as (typeof CHALLENGES[number] & { options: string[]; answer: number })[];

  const words = (s: string) => s.trim().split(/\s+/).length;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  it('does not make the correct option the longest more than ~40% of the time', () => {
    // Random baseline for 4 options is 25%. We allow head-room for honest
    // variation but fail well before the old 96%.
    let longestIsCorrect = 0;
    for (const c of mc) {
      const lens = c.options.map((o) => o.length);
      const max = Math.max(...lens);
      // Count as a "tell" only when the correct one is the unique longest.
      if (lens[c.answer] === max && lens.filter((l) => l === max).length === 1) {
        longestIsCorrect++;
      }
    }
    const rate = longestIsCorrect / mc.length;
    expect(rate, `correct==longest rate ${(rate * 100).toFixed(0)}% (baseline ~25%)`).toBeLessThan(
      0.4,
    );
  });

  it('keeps correct and distractor options comparable in length on average', () => {
    // The completeness tell: even ignoring which is *longest*, the correct answer
    // used to average 3.4x the words of a distractor. Cap the ratio near parity.
    const correctWords = mean(mc.map((c) => words(c.options[c.answer])));
    const distractorWords = mean(
      mc.flatMap((c) => c.options.filter((_, i) => i !== c.answer).map(words)),
    );
    const ratio = correctWords / distractorWords;
    expect(
      ratio,
      `correct/distractor word ratio ${ratio.toFixed(2)} (correct ${correctWords.toFixed(
        1,
      )}w vs distractor ${distractorWords.toFixed(1)}w)`,
    ).toBeLessThan(1.4);
  });

  it('has no question whose correct option grossly outlengths every distractor', () => {
    // Per-question backstop: a single option more than 2x the longest distractor
    // screams the answer on its own, regardless of the aggregate. List offenders
    // so a future author can see exactly which questions to rebalance.
    const offenders: string[] = [];
    for (const c of mc) {
      const correctLen = c.options[c.answer].length;
      const maxDistractor = Math.max(
        ...c.options.filter((_, i) => i !== c.answer).map((o) => o.length),
      );
      if (correctLen > maxDistractor * 2) {
        offenders.push(`#${c.id} (correct ${correctLen} vs longest distractor ${maxDistractor})`);
      }
    }
    expect(offenders, `length-outlier answers:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });
});
