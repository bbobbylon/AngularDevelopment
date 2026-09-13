import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';

/** Colour of the handwriting. Each hue has one job — see brain-friendly.css §1. */
export type ScribbleTone = 'accent' | 'gold' | 'olive' | 'clay';

/**
 * A handwritten call-out that points at something on the page by *quoting* it.
 *
 * ## Why quoting beats pointing
 *
 * The obvious way to annotate a figure or a code block is an arrow drawn from
 * the margin to the thing — and the obvious way is fragile. It needs
 * coordinates, it breaks when the text wraps, it is hidden on a phone, and it
 * is invisible to a screen reader. The sibling project this shape comes from
 * solved it the way a person with a pen does when the margin is too narrow:
 * write the label you mean, then say what you mean about it. The quote *is*
 * the pointer. It survives any layout, reads aloud correctly, and — because it
 * repeats a label the reader just saw in the figure — it doubles as a second
 * exposure to the same term, which is the retention bar's whole point.
 *
 * Stack two or three under a figure or a `CodeLab`, one per thing the reader
 * should have noticed. The glyph turns up (`point="up"`) when the thing is
 * above the note, down when it is below — the direction is decorative, the
 * quote carries the meaning.
 *
 * ## Usage
 *
 * ```html
 * <app-scribble quote="next(req)" text="hands the request to the **next** interceptor — or the backend." />
 * <app-scribble quote="pipe(...)" point="up" tone="clay" text="runs on the way *back* — after `next()` returned." />
 * ```
 *
 * The input is `point`, not `dir`: `dir` is the global text-direction
 * attribute, and a static `dir="up"` would land on the host element as an
 * invalid direction.
 *
 * ## Accessibility
 *
 * A paragraph. The glyph is `aria-hidden`; the quoted label is a `<b>` so it is
 * emphasised without being announced as a heading; the gloss is ordinary text.
 * The tilt is a static transform and carries no meaning.
 */
@Component({
  selector: 'app-scribble',
  imports: [RichText],
  templateUrl: './scribble.html',
  styleUrl: './scribble.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scribble {
  /** The label being pointed at — a figure label, an identifier, a line of code. */
  readonly quote = input.required<string>();

  /** What to say about it. Supports `backticks` and `**bold**`. */
  readonly text = input.required<string>();

  /** Which way the glyph curls: toward the thing above, or the thing below. */
  readonly point = input<'down' | 'up'>('down');

  /** Handwriting colour. Clay is the trap, olive the right way, gold a question. */
  readonly tone = input<ScribbleTone>('accent');

  /** The curled arrow, chosen by {@link point}. */
  protected readonly glyph = computed(() => (this.point() === 'up' ? '⤴' : '⤵'));
}
