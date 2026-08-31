import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A torn scrap of paper with a note scrawled on it — the author interrupting.
 *
 * ## Why an aside needs its own shape
 *
 * The base theme has `.note`, `.tip` and `.warn`: tinted rectangles with a left
 * rule. They work, and after four of them on a page the reader stops seeing
 * them, because they are the same shape as everything else with a different
 * hue. This one is a *different object on the page* — torn edges, a slight
 * tilt, a handwritten lead-in — so it keeps its interrupt value no matter how
 * many callouts the lesson already used.
 *
 * Spend it on the one thing per section that the reader should stop and do:
 * predict an output before scrolling, notice the trap in the snippet above,
 * try the change themselves. Not for extra information — extra information is
 * a paragraph.
 *
 * ## Usage
 *
 * ```html
 * <app-napkin lead="psst —">
 *   Trace the wrapped calls before you run it. What does <code>cost()</code> print?
 * </app-napkin>
 * ```
 *
 * ## Accessibility
 *
 * An `<aside>` labelled by its lead-in, so it is announced as a set-aside
 * remark rather than as body copy in the middle of a sentence. The tear, the
 * tilt and the tape are drawn with CSS and carry no meaning of their own.
 */
@Component({
  selector: 'app-napkin',
  templateUrl: './napkin.html',
  styleUrl: './napkin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Napkin {
  /** The handwritten lead-in. Two or three words at most. */
  readonly lead = input<string>('psst —');

  /** Announced name for the aside when the lead-in is too terse to be one. */
  readonly label = input<string>('Aside');
}
