import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';

/** One question a learner would actually ask, and its answer. */
export interface NdqItem {
  /** The question, in the learner's words — a misconception phrased as a doubt. */
  readonly q: string;
  /** The answer. Second person, contractions. Supports `backticks` and `**bold**`. */
  readonly a: string;
}

let nextNdqId = 0;

/**
 * "There are no Dumb Questions" — a Q&A that carries the whole explanation.
 *
 * ## Why this is not the FAQ
 *
 * `Faq` (from `shared/teaching`) is a closer: three to five collapsed doubts
 * at the end of a lesson that has already explained itself. This device is
 * the opposite bet. It is the lesson's *spine*: six to eight questions, all
 * open, escalating from the first misconception ("so the styles just… don't
 * reach the child?") through "where does this bite at work" to the fix — and
 * there is no prose beside it doing the real explaining. The reader is
 * pulled through by the questions they were about to ask.
 *
 * It works for topics where the confusion is the content: view encapsulation,
 * lifecycle timing, why the input is `undefined` in the constructor. It does
 * not work for topics that need a picture first — use the whiteboard shape
 * for those.
 *
 * Because the dialogue is gone, the second-person voice has to live in the
 * answers. Thread "you" and "your" through every one; the sibling project
 * that piloted this shape found that dropping the conversation flattened the
 * voice until it was put back deliberately.
 *
 * ## Usage
 *
 * ```ts
 * protected readonly ndq: NdqItem[] = [
 *   { q: 'So my `.card` rule just… stops at the child?', a: 'Yes. Angular rewrote it to `.card[_ngcontent-abc]`, and your child\'s elements carry a different attribute. **Nothing matches.**' },
 * ];
 * ```
 * ```html
 * <app-no-dumb-questions [items]="ndq" />
 * ```
 *
 * ## Accessibility
 *
 * A `<section>` named by its heading (an `<h2>` by default — it opens the
 * lesson, right under the chapter title — or an `<h3>` inside a section),
 * containing a definition list: question as `<dt>`, answer as `<dd>`, so the
 * pairing is announced as such. The "Q" and "A" marks are drawn, `aria-hidden`
 * — the list semantics already say which is which.
 */
@Component({
  selector: 'app-no-dumb-questions',
  imports: [RichText],
  templateUrl: './no-dumb-questions.html',
  styleUrl: './no-dumb-questions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoDumbQuestions {
  /** The questions, in the order a learner would arrive at them. Six to eight. */
  readonly items = input.required<readonly NdqItem[]>();

  /** The handwritten heading. Named `heading`, not `title`, to keep it off the host as a tooltip. */
  readonly heading = input<string>('there are no Dumb Questions');

  /** Heading level: 2 when the device opens the lesson, 3 inside a section. */
  readonly level = input<2 | 3>(2);

  /** Unique per instance so `aria-labelledby` resolves on a page with several. */
  protected readonly headingId = `ndq-${nextNdqId++}`;
}
