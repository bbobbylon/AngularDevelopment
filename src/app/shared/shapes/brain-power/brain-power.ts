import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';

let nextBrainPowerId = 0;

/**
 * A question posed and deliberately left open — the Head First "Brain Power".
 *
 * ## Why an unanswered question is a device
 *
 * Every other box on the page resolves: `Predict` reveals, `Quiz` grades, `Faq`
 * answers. This one does not, and that is the point. A question the page
 * refuses to answer stays open in the reader's head — it is the one they are
 * still turning over when they reach the figure or the dialogue that answers
 * it three screens later. Closing it early would turn a hook into a fact, and
 * facts are what a reader scrolls past.
 *
 * Use it once per shape block, at the moment the reader has just enough to
 * *start* answering and not enough to finish: after the receipt has been read
 * but before the mechanism; before the whiteboard figure it tells them to
 * search; between the two halves of an argument. The hint is a nudge toward
 * where to look, never a partial answer — if you find yourself writing "it
 * starts with…", cut it.
 *
 * ## Usage
 *
 * ```html
 * <app-brain-power
 *   question="Three parties, zero mistakes — so who caused the timeout?"
 *   hint="Re-read who promised what, and to whom."
 * />
 * ```
 *
 * ## Accessibility
 *
 * An `<aside>` named by its kicker ("Brain Power"), so a screen reader
 * announces it as a set-aside prompt rather than as body copy, and the reader
 * can skip it from the landmark list. There is nothing interactive here on
 * purpose: no reveal, no button, nothing to leave un-pressed.
 */
@Component({
  selector: 'app-brain-power',
  imports: [RichText],
  templateUrl: './brain-power.html',
  styleUrl: './brain-power.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrainPower {
  /** The open question. Supports `backticks` and `**bold**`. */
  readonly question = input.required<string>();

  /** The handwritten label above the question. Also the aside's accessible name. */
  readonly kicker = input<string>('Brain Power');

  /** Where to look, never what to find. Empty hides the line. */
  readonly hint = input<string>('');

  /** Unique per instance so `aria-labelledby` resolves on a page with several. */
  protected readonly kickerId = `brain-power-${nextBrainPowerId++}`;
}
