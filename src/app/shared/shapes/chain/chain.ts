import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A pipeline on one line: monospace chips joined by arrows.
 *
 * ## Why this exists next to `Flow`
 *
 * `Flow` (from `shared/teaching`) is numbered boxes with a current step — a
 * process the reader is walked through. This is the process *named*, the way
 * an engineer scribbles it on a whiteboard before explaining any step:
 * `trigger → prefetch → load → render`. It is read in one glance, wraps on a
 * phone, and its job is to give the reader the shape of the mechanism right
 * before the code that implements it, so the code's structure is expected
 * rather than discovered.
 *
 * Four to six steps. Past that it is not a chain, it is a list, and `Flow`
 * with its numbering is the honest device.
 *
 * ## Usage
 *
 * ```html
 * <app-chain [steps]="['trigger', 'prefetch', 'load chunk', 'render']" label="What @defer does, in order" />
 * ```
 *
 * ## Accessibility
 *
 * An ordered list with an accessible name, so the sequence survives as
 * "list, four items" and each chip is announced in order. The arrows between
 * chips are `aria-hidden` — the list already carries the ordering.
 */
@Component({
  selector: 'app-chain',
  templateUrl: './chain.html',
  styleUrl: './chain.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chain {
  /** The steps, in order. Short — each has to fit a chip. */
  readonly steps = input.required<readonly string[]>();

  /** Accessible name for the list. Say what the pipeline is. */
  readonly label = input<string>('Pipeline');
}
