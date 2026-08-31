import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';

/** One line of dialogue between two objects, APIs or ideas. */
export interface BubbleTurn {
  /** Who is speaking — a class, an API, a role. Rendered in the hand face. */
  who: string;
  /** What they say. Supports `backticked` inline code via RichText. */
  says: string;
}

/**
 * A short conversation between two objects, drawn as chat bubbles.
 *
 * ## Why a dialogue rather than a paragraph
 *
 * Head First's most-copied device, and the reason it works is not that it is
 * cute. Prose describing a collaboration ("the decorator holds a reference to
 * the component and forwards the call, adding its own cost afterwards") makes
 * the reader hold both parties in their head at once and infer the exchange.
 * A dialogue *stages* the exchange: each party gets a turn, in their own voice,
 * and the reader follows a conversation — something human memory is built for —
 * instead of reconstructing a relationship from a description.
 *
 * Use it for the two-party interactions a learner reliably gets backwards: who
 * calls whom, who knows about whom, what one side can and cannot see. Keep it to
 * four to six turns; past that it stops being a beat and becomes a transcript.
 *
 * ## Usage
 *
 * ```ts
 * protected readonly talk: BubbleTurn[] = [
 *   { who: 'Template', says: 'I read `count()`. Tell me when it changes.' },
 *   { who: 'Signal',   says: "I noted you. I won't call you — I'll mark you dirty." },
 * ];
 * ```
 * ```html
 * <app-bubbles [turns]="talk" caption="What actually passes between them" />
 * ```
 *
 * Speakers alternate sides automatically by index, so a two-party exchange
 * lands left/right/left the way a chat log does. The component makes no attempt
 * to group consecutive turns by the same speaker: give each party one turn at a
 * time, which is better dialogue anyway.
 *
 * ## Accessibility
 *
 * A `<figure>` containing a definition list — speaker as `<dt>`, line as `<dd>` —
 * so the pairing survives with no styling at all, and a screen reader announces
 * "Signal: I noted you…" rather than two loose strings. The tails are drawn with
 * CSS borders and are invisible to assistive tech.
 */
@Component({
  selector: 'app-bubbles',
  imports: [RichText],
  templateUrl: './bubbles.html',
  styleUrl: './bubbles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bubbles {
  /** The exchange, in order. */
  readonly turns = input.required<BubbleTurn[]>();

  /** Optional caption under the conversation. */
  readonly caption = input<string>('');
}
