import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextWhiteboardId = 0;

/**
 * The frame for one big figure — the "Whiteboard" shape's centrepiece.
 *
 * ## Why a frame and not a diagram component
 *
 * Ten lessons already draw a whiteboard figure: boxes, curved arrows, the
 * author's handwriting inside the picture. Every one of them hand-codes the
 * SVG, and every one of them copy-pasted the same `.dia-*` stylesheet to do
 * it. A generic node-and-edge component would need a layout engine to replace
 * that, and would still draw the wrong picture — the value of a whiteboard
 * figure is that it is *this* mechanism, drawn by someone who understands it.
 *
 * So this component owns everything around the drawing and nothing inside
 * it: the board (paper, faint grid, shadow), the caption, the long
 * description for assistive tech, and the row of {@link Scribble} call-outs
 * that point into the picture by quoting its labels. The drawing itself is
 * projected — an inline `<svg>` with a `viewBox`, styled by the global `.wb-*`
 * classes in `brain-friendly.css` §16 (the lifted `.dia-*` set), or a DOM
 * figure — so it scales with the column and inherits the reader's colour
 * scheme.
 *
 * ## Usage
 *
 * ```html
 * <app-whiteboard
 *   caption="One request, three interceptors, and the way back out"
 *   alt="Three stacked boxes labelled auth, retry and logging. A solid arrow runs down the left side from the component through each box to the backend; a dashed arrow runs back up the right side, through the same boxes in reverse order."
 * >
 *   <svg class="wb-svg" viewBox="0 0 720 360" aria-hidden="true">
 *     <defs><marker id="http-interceptors-arrow" …><path class="wb-head" d="…" /></marker></defs>
 *     <rect class="wb-node wb-node--lit" x="…" />
 *     <text class="wb-hand" x="…">this one runs twice</text>
 *     <path class="wb-arrow" d="…" marker-end="url(#http-interceptors-arrow)" />
 *   </svg>
 *   <app-scribble quote="auth" text="runs **first** on the way down, **last** on the way up." />
 * </app-whiteboard>
 * ```
 *
 * Marker ids must be unique per page — prefix them with the lesson id. Under
 * `prefers-reduced-motion: no-preference`, solid `.wb-arrow` paths draw
 * themselves on (the layer's `bf-draw` keyframes); dashed ones do not, because
 * animating a dash offset on a dashed stroke makes it crawl rather than draw.
 *
 * Prefer a `viewBox` SVG: it scales, so nothing overflows. A DOM figure wider
 * than the column scrolls *inside* the board; set `scrollable` in that case so
 * keyboard users can reach the scroll (it makes the board a focusable group
 * named by the caption).
 *
 * ## Accessibility
 *
 * A `<figure>` named by its visible `<figcaption>` and described by `alt`,
 * which is rendered visually hidden and linked with `aria-describedby`. `alt`
 * is a real description of what the picture shows and what it teaches — not
 * "diagram". The projected SVG should be `aria-hidden="true"`; the description
 * is its accessible content. Scribbles are ordinary paragraphs.
 */
@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.html',
  styleUrl: './whiteboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Whiteboard {
  /** The handwritten line under the board. Also the figure's accessible name. */
  readonly caption = input.required<string>();

  /** What the picture shows and teaches, for a reader who cannot see it. */
  readonly alt = input.required<string>();

  /** Set when the projected figure is wider than the column and has to scroll. */
  readonly scrollable = input<boolean>(false);

  /** Unique per instance so `aria-describedby` resolves on a page with several. */
  protected readonly descId = `whiteboard-desc-${nextWhiteboardId++}`;
}
