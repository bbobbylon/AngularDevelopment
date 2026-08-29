import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Colour treatment for one side of the comparison. */
export type CompareTone = 'neutral' | 'good' | 'bad';

/**
 * Two panels side by side: before/after, wrong/right, old API/new API.
 *
 * ## Why this shape teaches
 *
 * A difference described in prose has to be held in working memory to be seen. The same
 * difference placed in two adjacent columns is seen directly, and the reader does the
 * comparison themselves — which is both faster and far stickier than being told the
 * conclusion. It is the single highest-value visual for an app that spends most of its
 * time explaining "this replaced that": `NgModule` → standalone, `*ngIf` → `&#64;if`,
 * zones → signals, `subscribe` → `toSignal`.
 *
 * Content is projected rather than passed as data because both sides are almost always
 * code blocks, which are far more readable written as markup in the lesson than escaped
 * into a TypeScript string.
 *
 * ## Usage
 *
 * ```html
 * <app-compare leftTitle="Before — *ngIf" leftTone="bad" rightTitle="Now — &#64;if" rightTone="good">
 *   <div left>
 *     <div class="code"><pre>...</pre></div>
 *   </div>
 *   <div right>
 *     <div class="code"><pre>...</pre></div>
 *   </div>
 * </app-compare>
 * ```
 *
 * The `left` and `right` attributes are plain attribute selectors, so the projected
 * wrapper can be any element the lesson finds convenient.
 *
 * ## Accessibility
 *
 * Each side is a `<section>` labelled by its own visible heading, so the two panels are
 * navigable as distinct regions and a screen-reader user is told which side they are in.
 * Tone is never the only signal — the titles carry the meaning in words.
 */
@Component({
  selector: 'app-compare',
  templateUrl: './compare.html',
  styleUrl: './compare.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Compare {
  /** Heading for the left panel. Say what it *is*, e.g. "Before — `*ngIf`". */
  readonly leftTitle = input.required<string>();

  /** Heading for the right panel. */
  readonly rightTitle = input.required<string>();

  /** Colour treatment for the left panel. */
  readonly leftTone = input<CompareTone>('neutral');

  /** Colour treatment for the right panel. */
  readonly rightTone = input<CompareTone>('neutral');

  /** Optional one-line summary under both panels — the takeaway the comparison supports. */
  readonly note = input<string>('');

  /** Unique ids tying each panel to its heading via `aria-labelledby`. */
  protected readonly leftId = `compare-left-${nextCompareId}`;
  protected readonly rightId = `compare-right-${nextCompareId++}`;
}

/** Counter behind the generated heading ids. */
let nextCompareId = 0;
