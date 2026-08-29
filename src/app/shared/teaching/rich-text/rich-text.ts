import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { segmentInlineCode } from '../inline-code';

/**
 * Renders a plain string, turning `backtick` spans into `<code>` elements.
 *
 * A one-line component rather than a pipe because the output is a *list of elements*,
 * not a string — a pipe would have to return HTML and be bound with `[innerHTML]`, which
 * is exactly what {@link segmentInlineCode} exists to avoid.
 *
 * Used by `Quiz`, `Faq` and `Predict` wherever lesson copy arrives as data rather than as
 * projected markup.
 *
 * ```html
 * <app-rich-text [text]="item.answer" />
 * ```
 */
@Component({
  selector: 'app-rich-text',
  template: `@for (segment of segments(); track $index) {
    @if (segment.code) {
      <code>{{ segment.text }}</code>
    } @else {
      {{ segment.text }}
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichText {
  /** Copy that may contain backtick-delimited code spans. */
  readonly text = input.required<string>();

  /** The parsed pieces, recomputed only when `text` actually changes. */
  protected readonly segments = computed(() => segmentInlineCode(this.text()));
}
