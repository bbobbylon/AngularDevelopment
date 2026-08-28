import { OptionsShuffler, shuffleOptions } from './practice-helpers';

/**
 * shuffleOptions/OptionsShuffler back every options-rendering surface (Practice,
 * Mock Exam, Exam Day) — a wrong correctIndex here silently marks right answers
 * as wrong across all three.
 */
describe('shuffleOptions', () => {
  it('always reports a valid correctIndex that actually points at the correct text', () => {
    const options = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 50; i++) {
      const { options: shuffled, correctIndex } = shuffleOptions(options, 2);
      expect(correctIndex).toBeGreaterThanOrEqual(0);
      expect(shuffled[correctIndex]).toBe('c');
      expect(shuffled).toHaveLength(4);
      expect([...shuffled].sort()).toEqual([...options].sort());
    }
  });

  it('handles a single-option array without correctIndex becoming -1', () => {
    const { options: shuffled, correctIndex } = shuffleOptions(['only'], 0);
    expect(shuffled).toEqual(['only']);
    expect(correctIndex).toBe(0);
  });

  it('does not mutate the input array', () => {
    const options = ['a', 'b', 'c', 'd'];
    const copy = [...options];
    shuffleOptions(options, 0);
    expect(options).toEqual(copy);
  });
});

describe('OptionsShuffler', () => {
  it('memoizes: repeated calls for the same id return the identical shuffle', () => {
    const shuffler = new OptionsShuffler();
    const first = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
    for (let i = 0; i < 10; i++) {
      const again = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
      expect(again).toEqual(first);
    }
  });

  it('reset() clears every cached shuffle', () => {
    const shuffler = new OptionsShuffler();
    const before = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
    shuffler.reset();
    // Re-request many times; at least the cache entry itself must be gone even
    // if a re-shuffle happens to land on the same order by chance.
    let allSame = true;
    for (let i = 0; i < 20; i++) {
      shuffler.reset();
      const after = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
      if (JSON.stringify(after) !== JSON.stringify(before)) allSame = false;
    }
    // This is probabilistic (4! = 24 permutations), but 20 fresh resets landing
    // on the exact same permutation as `before` every time is vanishingly
    // unlikely unless reset() failed to clear the cache.
    expect(allSame).toBe(false);
  });

  it('resetChallenge(id) clears only that id, leaving other cached shuffles intact', () => {
    const shuffler = new OptionsShuffler();
    const a = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
    const b = shuffler.getShuffledOptions(2, ['w', 'x', 'y', 'z'], 0);

    shuffler.resetChallenge(1);
    // id 2 must be untouched.
    expect(shuffler.getShuffledOptions(2, ['w', 'x', 'y', 'z'], 0)).toEqual(b);

    // id 1 was evicted, so re-requesting re-shuffles (may or may not differ,
    // but must not throw and must still resolve the correct index correctly).
    const aAgain = shuffler.getShuffledOptions(1, ['a', 'b', 'c', 'd'], 0);
    expect(aAgain.options[aAgain.correctIndex]).toBe('a');
    void a;
  });
});
