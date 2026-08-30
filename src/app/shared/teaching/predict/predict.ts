import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { highlight } from '../../highlighter';
import { RichText } from '../rich-text/rich-text';

/**
 * Poses a question, shows optional code, and hides the answer behind a button.
 *
 * ## Why hide the answer
 *
 * Reading an explanation feels like learning and mostly is not. The gap between "I follow
 * this" and "I could produce this" only becomes visible when you are asked to commit to a
 * prediction first — and the moment of being wrong is what makes the correction stick.
 * Text alone cannot enforce that, because the eye reaches the answer before the brain has
 * tried. A button can.
 *
 * This is the lightest of the teaching components: no options, no state worth keeping, no
 * correctness. Use it for "what does this print?", "which of these two runs first?", and
 * "this code has a bug — where?". Use {@link Quiz} instead when the plausible wrong
 * answers are themselves worth naming and correcting.
 *
 * ## Usage
 *
 * ```html
 * <app-predict
 *   prompt="What does this log, and how many times?"
 *   [code]="samples.effectOrder"
 *   answer="`0` then `1`. The effect runs once on creation, then again after `set()`."
 * />
 * ```
 *
 * ## Accessibility
 *
 * The button owns the disclosure semantics: `aria-expanded` reflects the state and
 * `aria-controls` points at the answer panel, which is removed from the DOM while hidden
 * so it cannot be reached by tab or read ahead of time by a screen reader.
 */
@Component({
  selector: 'app-predict',
  templateUrl: './predict.html',
  styleUrl: './predict.css',
  imports: [RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Predict {
  /** The question. May contain `backtick` code spans. */
  readonly prompt = input.required<string>();

  /** Optional code sample to reason about. Rendered verbatim in a `<pre>`. */
  readonly code = input<string>('');

  /**
   * The sample, tokenised into `<span class="hl-*">` markup.
   *
   * Highlighting happens here rather than in the app-wide sweep in `app.ts`,
   * which only ever selected `.code pre`. This component's block is
   * `.predict__code pre`, so it was missed entirely and every Predict sample in
   * the curriculum rendered as flat, unhighlighted text — the one place a
   * learner is being asked to read code closely.
   *
   * Safe to bind with `[innerHTML]`: {@link highlight} escapes every character
   * it emits, so the sample is displayed as source rather than parsed as markup.
   */
  protected readonly highlightedCode = computed(() => highlight(this.code()));

  /** The reveal. May contain `backtick` code spans. */
  readonly answer = input.required<string>();

  /** Label for the reveal button, when "Reveal the answer" is not the right words. */
  readonly revealLabel = input<string>('Reveal the answer');

  /** Whether the answer panel is currently shown. */
  protected readonly revealed = signal(false);

  /** Unique id linking the button's `aria-controls` to the panel it toggles. */
  protected readonly panelId = `predict-panel-${nextPredictId++}`;

  /** Shows the answer. Deliberately one-way — there is no reason to re-hide it. */
  protected reveal(): void {
    this.revealed.set(true);
  }
}

/** Counter behind the generated panel ids used by `aria-controls`. */
let nextPredictId = 0;
