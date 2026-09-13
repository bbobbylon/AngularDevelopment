import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One line on the bill. */
export interface ReceiptRow {
  /** What was paid for — a chunk, a request, a change-detection pass. */
  readonly label: string;
  /** What it cost, already formatted (`'312 kB'`, `'$18,240'`, `'×47'`). */
  readonly amount: string;
  /** `warn` for the line that is the problem; `muted` for the ones that are not. */
  readonly tone?: 'warn' | 'muted';
}

/**
 * An itemised bill — the opening move of the "Receipt" shape.
 *
 * ## Why a receipt and not a table
 *
 * A comparison table asks the reader to evaluate. A receipt asks them to
 * *react*: there is a total at the bottom, it is larger than it should be, and
 * one line is the reason. That is a narrative in four rows. The thermal-paper
 * styling is not decoration — it tells the reader "this is a bill you
 * received", which frames every number as something that happened to them
 * rather than something being explained to them.
 *
 * Use it wherever the topic *is* a cost: bytes in the initial chunk, ms on the
 * main thread, change-detection passes per keystroke, requests per page. Put
 * the surprising line in `warn`, keep the rest plain or `muted`, and let the
 * total say the rest. The `Scribble` that follows names the gap.
 *
 * ## Usage
 *
 * ```ts
 * protected readonly bill: ReceiptRow[] = [
 *   { label: 'main.js', amount: '212 kB' },
 *   { label: 'chart-widget (eager)', amount: '318 kB', tone: 'warn' },
 *   { label: 'styles.css', amount: '31 kB', tone: 'muted' },
 * ];
 * ```
 * ```html
 * <app-receipt heading="Initial load · first paint" [rows]="bill"
 *              [total]="{ label: 'TOTAL', amount: '561 kB' }" footer="thank you for waiting" />
 * ```
 *
 * ## Accessibility
 *
 * A real `<table>` inside a `<figure>`: the heading is its `<caption>`, every
 * label is a row header (`<th scope="row">`), the total is in `<tfoot>`. So the
 * bill reads as "chart-widget (eager): 318 kilobytes" row by row, and the total
 * is announced as the table's footer rather than as one more line. Tone is a
 * class plus weight, never colour alone.
 */
@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.html',
  styleUrl: './receipt.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Receipt {
  /** Printed across the top of the paper. Named `heading`, not `title`, to keep it off the host as a tooltip. */
  readonly heading = input.required<string>();

  /** The lines, in the order they were "rung up". */
  readonly rows = input.required<readonly ReceiptRow[]>();

  /** The total. `null` prints no footer row. */
  readonly total = input<ReceiptRow | null>(null);

  /** Small print under the paper — "thank you", or the one-line sting. */
  readonly footer = input<string>('');
}
