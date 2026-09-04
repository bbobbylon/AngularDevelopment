import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';

/** One concentric ring, or the solid thing at the centre. */
export interface Layer {
  /** What this layer is. Short — it has to sit on a dotted edge. */
  label: string;
  /** Optional second line: the value, cost or state at this depth. */
  sub?: string;
}

/**
 * A nesting diagram: dotted rings wrapped around a solid core, with an optional
 * hand-drawn arrow pointing at the thing a call actually reaches.
 *
 * ## Why this picture and not a box-and-arrow one
 *
 * A surprising number of the hardest ideas in this curriculum are the same
 * shape — something is *inside* something else, and a call travels inward
 * through every layer and a result travels back out:
 *
 * | Concept                | Core                | Rings                          |
 * | ---------------------- | ------------------- | ------------------------------ |
 * | DI resolution          | the root injector   | element → component → env      |
 * | Change detection       | the leaf component  | its ancestors up to the root   |
 * | HTTP interceptors      | the backend call    | each interceptor in the chain  |
 * | Closures               | the captured value  | each enclosing scope           |
 * | RxJS `pipe()`          | the source          | each operator wrapping it      |
 *
 * Drawn as a left-to-right flow, all of those look like a pipeline, and the
 * reader loses the one property that matters: the outer thing *contains* the
 * inner one and can see it, while the inner one cannot see out. Concentric
 * rings make containment the first thing the eye reports, before any label is
 * read. That is the whole reason to spend a diagram here.
 *
 * ## Usage
 *
 * ```html
 * <app-layers
 *   [core]="{ label: 'House Blend', sub: '$0.89' }"
 *   [rings]="[
 *     { label: '+ Mocha', sub: '$1.29' },
 *     { label: '+ Whip',  sub: '$1.09' },
 *     { label: '+ Soy',   sub: '$0.99' },
 *   ]"
 *   arrow="cost() called"
 *   caption="The call goes in through **Mocha → Whip → Soy**…"
 * />
 * ```
 *
 * `rings` is **outermost first**, matching the order the labels are read down
 * the top-left corner. Between one and four rings; past four the innermost ring
 * has no room left for a label, and a five-layer diagram was going to need
 * splitting anyway.
 *
 * ## Accessibility
 *
 * The diagram is a `<figure>` whose visual nesting is duplicated as a nested
 * ordered list in the accessible tree, so a screen reader gets the containment
 * relationship rather than a flat list of labels. The arrow and its handwritten
 * label are decorative; when the arrow says something the prose does not, say it
 * in `caption` too.
 */
@Component({
  selector: 'app-layers',
  imports: [RichText],
  templateUrl: './layers.html',
  styleUrl: './layers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layers {
  /** The solid object at the centre — the thing everything else wraps. */
  readonly core = input.required<Layer>();

  /** Wrappers, outermost first. One to four. */
  readonly rings = input.required<Layer[]>();

  /** Handwritten label on the arrow pointing at the core. Empty hides the arrow. */
  readonly arrow = input<string>('');

  /** Sentence under the diagram. Supports `backticks` and `**bold**`. */
  readonly caption = input<string>('');

  /** Ring count clamped to what the CSS has insets for. */
  protected readonly depth = computed(() => Math.min(this.rings().length, 4));

  /**
   * A defensive copy of {@link rings}, outermost-first — same order as
   * `rings` itself. Renamed from a previous `inward`/"innermost-first" that
   * had it backwards: each `<li>` in the template reads "X, which wraps:"
   * before the next one, so the list must OPEN with the outermost ring and
   * end at the core for that phrasing to describe a coherent containment
   * chain ("Outer, which wraps: Middle, which wraps: Leaf") — reversing it
   * would make the sentence read inside-out. `brain.spec.ts`'s Layers
   * describe block ("describes the nesting for assistive tech, innermost
   * last") asserts exactly this order; only the CORE, appended after this
   * list in the template, is innermost-last.
   */
  protected readonly containment = computed(() => [...this.rings()]);
}
