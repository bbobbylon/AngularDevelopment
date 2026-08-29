import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RichText } from '../rich-text/rich-text';

/** One question-and-answer pair. Both fields may contain `backtick` code spans. */
export interface FaqItem {
  /** The question, phrased the way a learner would actually ask it. */
  readonly q: string;
  /** A direct answer. Two or three sentences; if it needs more, it needs a section. */
  readonly a: string;
}

/**
 * A "there are no dumb questions" block — the small doubts a lesson leaves behind.
 *
 * ## What belongs in here
 *
 * Not a summary, and not the FAQ of a product manual. This is for the specific things a
 * learner silently wonders and would feel slightly stupid asking: *why do I have to call
 * it like a function?*, *is this the same as the old thing?*, *what happens if I forget?*
 * Answering them in plain conversational voice does two jobs at once — it clears the
 * doubt, and it tells the reader their confusion was reasonable, which is most of what
 * keeps someone reading past a hard section.
 *
 * The test for whether a question belongs here: would a beginner think it, and would they
 * hesitate to ask it out loud? If it is neither, it is either body copy or noise.
 *
 * ## Usage
 *
 * ```html
 * <app-faq
 *   [items]="[
 *     {
 *       q: 'Why do I call a signal like a function?',
 *       a: 'Reading is what registers the dependency, so it has to be a call.',
 *     },
 *   ]"
 * />
 * ```
 *
 * ## Accessibility
 *
 * Built on native `<details>`/`<summary>`, which gives keyboard operation, correct
 * expanded/collapsed announcement, and in-page find that can open a closed answer —
 * none of which a hand-rolled accordion gets for free.
 */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.html',
  styleUrl: './faq.css',
  imports: [RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faq {
  /** The questions, in the order a learner is likely to hit them. */
  readonly items = input.required<readonly FaqItem[]>();

  /** Heading above the block. Override only if "there are no dumb questions" reads oddly. */
  readonly heading = input<string>('There are no dumb questions');
}
