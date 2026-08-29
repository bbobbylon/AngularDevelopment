import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RichText } from '../rich-text/rich-text';

/** One answer choice. Copy in `text` and `why` may contain `backtick` code spans. */
export interface QuizOption {
  /** The answer as the learner reads it. */
  readonly text: string;
  /** Exactly one option in a quiz should set this. */
  readonly correct?: boolean;
  /**
   * Why this option is right or wrong. Shown after the learner commits to an answer.
   * Worth writing for the *wrong* options especially — that is where the misconception
   * being corrected actually lives.
   */
  readonly why?: string;
}

/** Counter behind the generated radio-group names, so two quizzes never share a group. */
let nextQuizId = 0;

/**
 * A single multiple-choice question with immediate, explained feedback.
 *
 * ## Why a quiz inside the lesson
 *
 * The app already has a 392-question Practice bank and a mock exam, so it would be
 * reasonable to ask why a lesson needs its own quiz. The answer is that those are
 * *assessment*, run after the fact, and this is *retrieval practice*, run during
 * learning. Being made to produce an answer — even a wrong one — before seeing the
 * correct one measurably improves later recall, and it has to happen next to the
 * material to do that. Recognising the idea while reading feels like knowing it; being
 * asked to choose is what exposes the difference.
 *
 * Hence the design constraints:
 * - **One question**, placed right after the concept it tests, not a quiz section at the
 *   end. Several of these spread through a lesson beats one block of five.
 * - **Feedback is explanation, not a score.** Nothing is recorded, nothing is graded, and
 *   the learner can change their answer freely. The value is in the `why` text.
 * - **Wrong answers are explained too**, because the misconception is the teachable part.
 *
 * ## Usage
 *
 * ```html
 * <app-quiz
 *   question="What does `count.set(5)` do that `count = 5` cannot?"
 *   [options]="[
 *     { text: 'Nothing — they are equivalent', why: 'Assignment replaces the signal itself.' },
 *     { text: 'Notifies everything that read it', correct: true, why: 'That is the whole point.' },
 *   ]"
 * />
 * ```
 *
 * ## Accessibility
 *
 * A real `<fieldset>` with the question as its `<legend>` and one radio per option, so
 * the grouping and the question are announced together and arrow keys move between
 * choices as users expect. Feedback lands in an `aria-live="polite"` region so it is
 * read out on selection without stealing focus.
 */
@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
  imports: [RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz {
  /** The question. May contain `backtick` code spans. */
  readonly question = input.required<string>();

  /** The choices, in the order they should appear. Exactly one should be `correct`. */
  readonly options = input.required<readonly QuizOption[]>();

  /** Optional note shown under the feedback — a pointer to the section that explains it. */
  readonly followUp = input<string>('');

  /** Index of the option the learner picked, or null before they have answered. */
  protected readonly chosen = signal<number | null>(null);

  /** Unique radio-group name; without it, two quizzes on a page act as one control. */
  protected readonly groupName = `quiz-${nextQuizId++}`;

  /** The picked option, or null. Drives the entire feedback panel. */
  protected readonly answer = computed(() => {
    const index = this.chosen();
    return index === null ? null : (this.options()[index] ?? null);
  });

  /** True once the learner has picked the correct option. */
  protected readonly isCorrect = computed(() => this.answer()?.correct === true);

  /** Records the choice. Re-answering is allowed on purpose — this is practice, not a test. */
  protected choose(index: number): void {
    this.chosen.set(index);
  }
}
