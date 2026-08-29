/**
 * Helper utilities for the practice component
 * Handles option shuffling, tracking correct answers, and generating explanations
 */

/**
 * Represents shuffled options with tracking of the correct answer
 */
export interface ShuffledOptions {
  /** The shuffled option texts */
  options: string[];
  /** Index of the correct answer in the shuffled options */
  correctIndex: number;
}

/**
 * Shuffle an array of options and track which index contains the correct answer
 * @param options Original option array
 * @param correctAnswerIndex Index of correct answer in original array
 * @returns Shuffled options with correct index updated
 */
export function shuffleOptions(options: string[], correctAnswerIndex: number): ShuffledOptions {
  // Create array of indices to track original positions
  const indices = options.map((_, i) => i);

  // Fisher-Yates shuffle the indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Reorder options based on shuffled indices
  const shuffled = indices.map((i) => options[i]);

  // Find where the correct answer ended up
  const newCorrectIndex = indices.indexOf(correctAnswerIndex);

  return {
    options: shuffled,
    correctIndex: newCorrectIndex,
  };
}

/**
 * Memoizes shuffled options so they don't change on re-renders
 * Maps challenge ID to its shuffled options
 */
export class OptionsShuffler {
  /**
   * Shuffle per challenge id, computed on first request and reused after.
   *
   * Memoizing is what makes the shuffle usable at all: without it, every
   * change-detection pass would re-shuffle and the options would visibly
   * reorder under the cursor. Keyed by id rather than by array identity
   * because the same challenge object is looked up repeatedly.
   */
  private cache = new Map<number, ShuffledOptions>();

  /**
   * Get or create shuffled options for a challenge
   * Once created, returns the same shuffle every time (during session)
   */
  getShuffledOptions(id: number, options: string[], correctIndex: number): ShuffledOptions {
    if (!this.cache.has(id)) {
      this.cache.set(id, shuffleOptions(options, correctIndex));
    }
    return this.cache.get(id)!;
  }

  /**
   * Reset all shuffles (for reshuffle button)
   */
  reset(): void {
    this.cache.clear();
  }

  /**
   * Reset specific challenge shuffle
   */
  resetChallenge(id: number): void {
    this.cache.delete(id);
  }
}
