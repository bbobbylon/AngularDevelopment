import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Which hue the tape and heading take. Each tone means one thing — see the CSS. */
export type TapeTone = 'gold' | 'accent' | 'olive' | 'blue';

/**
 * A card taped to the page: hatched tape tab across the top edge, a pin, and a
 * display-serif heading.
 *
 * ## Why this exists
 *
 * The retention bar asks for the same idea in several *modes*, and the mode this
 * fills is "a thing pinned to a board" — a definition, a place you have already
 * met this pattern, a named part of a mechanism. A row of these reads as a set
 * of collected artefacts rather than as a bulleted list, and a set of artefacts
 * is markedly easier to recall as a set. It is the one component in the layer
 * whose job is texture as much as structure.
 *
 * Reach for it when you have **three to five short, parallel items** that each
 * need a name and a sentence: the parts of a pattern, the places an idea shows
 * up, the members of an API family. For anything sequential use `app-flow`; for
 * two things in opposition use `app-compare`.
 *
 * ## Usage
 *
 * ```html
 * <div class="bf-grid-3">
 *   <app-tape-card heading="Component">
 *     The shared type. Both the real object and every decorator implement it.
 *   </app-tape-card>
 *   <app-tape-card heading="Decorator" tone="accent">
 *     Holds a Component, implements Component, delegates to it.
 *   </app-tape-card>
 * </div>
 * ```
 *
 * ## Accessibility
 *
 * Renders as a `<section>` labelled by its own visible heading, so the card is a
 * navigable landmark and its name is the name a sighted reader sees. The tape,
 * hatching and pin are decorative and hidden from assistive tech. Tone is never
 * the only carrier of meaning — the heading text always says what the card is.
 */
@Component({
  selector: 'app-tape-card',
  templateUrl: './tape-card.html',
  styleUrl: './tape-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TapeCard {
  /** The card's name. Short — this is a label, not a sentence. */
  readonly heading = input.required<string>();

  /** Optional monospace kicker above the heading, e.g. a type or file name. */
  readonly kicker = input<string>('');

  /** Hue of the tape and kicker. Defaults to gold ("remember this"). */
  readonly tone = input<TapeTone>('gold');
}
