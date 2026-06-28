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
  const shuffled = indices.map(i => options[i]);

  // Find where the correct answer ended up
  const newCorrectIndex = indices.indexOf(correctAnswerIndex);

  return {
    options: shuffled,
    correctIndex: newCorrectIndex,
  };
}

/**
 * Generate explanation for why other answers are wrong
 * This should be customized for each question type
 */
export interface WrongAnswerExplanation {
  option: string;
  reason: string;
}

/**
 * Structure for enhanced challenge feedback
 */
export interface ChallengeFeedback {
  isCorrect: boolean;
  explanation: string;
  wrongAnswerReasons?: WrongAnswerExplanation[];
  topicLink?: {
    path: string;
    label: string;
  };
}

/**
 * Memoizes shuffled options so they don't change on re-renders
 * Maps challenge ID to its shuffled options
 */
export class OptionsShuffler {
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

/**
 * Sample function to generate wrong answer reasons
 * Should be customized per question domain
 */
export function generateWrongAnswerReasons(
  question: string,
  options: string[],
  correctIndex: number
): WrongAnswerExplanation[] {
  const reasons: WrongAnswerExplanation[] = [];

  options.forEach((option, index) => {
    if (index !== correctIndex) {
      // This is a placeholder - real implementation would analyze each option
      // and provide specific, educational reasons why it's wrong
      reasons.push({
        option,
        reason: 'This answer is incorrect. Review the explanation above for the correct concept.',
      });
    }
  });

  return reasons;
}
