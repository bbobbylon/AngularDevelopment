import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Visual treatment for the box, chosen by what kind of thing is being remembered. */
export type RememberVariant = 'hook' | 'rule' | 'mnemonic';

/** Default heading text per variant, so most usages need no `label` at all. */
const DEFAULT_LABELS: Record<RememberVariant, string> = {
  hook: 'If you remember one thing',
  rule: 'The rule',
  mnemonic: 'Memory hook',
};

/**
 * A "remember this" box — the single most compressed statement of a lesson's idea.
 *
 * ## Why this exists
 *
 * Lessons in this app were already deep, but depth is a comprehension tool, not a
 * retention tool. A learner who understands a 400-line lesson while reading it can still
 * fail to recall it under exam pressure two weeks later. This box is the deliberate
 * counterweight: one boxed, visually distinct, deliberately short claim per concept, of
 * the kind that survives in memory when the surrounding prose does not.
 *
 * It is part of the small teaching-component set in `shared/teaching/` — alongside
 * `Quiz`, `Faq`, `Predict`, `Flow` and `Compare` — that exists so every lesson can hit
 * the retention bar in `.claude/CLAUDE.md` without each one reinventing the markup.
 *
 * ## Usage
 *
 * ```html
 * <app-remember>
 *   A signal is a value that <strong>announces</strong> when it changes.
 * </app-remember>
 *
 * <app-remember variant="rule">
 *   <code>set</code> for a new value, <code>update</code> when it depends on the old one.
 * </app-remember>
 * ```
 *
 * Content is projected rather than passed as a string so that lessons can mark up code,
 * emphasis and links inside the box the same way they do in body copy.
 *
 * ## Accessibility
 *
 * Renders as an `<aside>` with an `aria-label` taken from the visible heading, so screen
 * reader users get the same "this is a set-aside key point" signal that the border and
 * background give sighted users. Keep exactly one of these per concept — a page of
 * highlight boxes highlights nothing.
 */
@Component({
  selector: 'app-remember',
  templateUrl: './remember.html',
  styleUrl: './remember.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Remember {
  /** Which visual treatment and default heading to use. */
  readonly variant = input<RememberVariant>('hook');

  /** Overrides the variant's default heading when a lesson wants specific wording. */
  readonly label = input<string>('');

  /** The heading actually rendered: the explicit label if given, else the variant default. */
  protected readonly heading = computed(() => this.label() || DEFAULT_LABELS[this.variant()]);
}
