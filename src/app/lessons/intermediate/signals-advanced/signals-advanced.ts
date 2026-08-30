import { Component, computed, linkedSignal, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Advanced Signals — the parts beyond `signal` / `computed` / `effect`.
 *
 * Covers `linkedSignal`, `untracked`, equality functions, and how the dependency
 * graph actually works (pull-based, lazily evaluated, glitch-free).
 *
 * Two demos:
 *
 * - **`linkedSignal`**, which is writable state that *resets* when its source
 *   changes. The classic case is a select whose options get replaced: a plain
 *   `signal` keeps the now-invalid selection, a `computed` cannot be written to
 *   at all, and `linkedSignal` is the thing that is both.
 * - **`untracked`**, reading a signal without subscribing to it. The demo makes
 *   the consequence concrete: the `computed` recomputes when `a` changes and not
 *   when `b` does, even though it reads both — which is either exactly what you
 *   wanted or a stale-value bug, depending on whether you meant it.
 */
@Component({
  selector: 'app-lesson-signals-advanced',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './signals-advanced.html',
  styleUrl: './signals-advanced.css',
})
export class SignalsAdvanced {
  /**
   * What a write actually does, including the step most mental models skip: the
   * equality check happens *after* recomputation, and a value that compares equal
   * stops the ripple there rather than passing it on.
   */
  protected readonly propagation = [
    { label: 'You call `set()`', detail: 'The value lands and the version counter ticks' },
    { label: 'Dependents marked dirty', detail: 'Marked, not run — nothing is recomputed yet' },
    {
      label: 'Something reads',
      detail: 'A template or `computed` finally asks for the value',
      tone: 'accent' as const,
    },
    { label: 'Formula re-runs', detail: 'Only now, and only for the consumers actually read' },
    {
      label: '`equal(old, new)`?',
      detail: 'Equal → the ripple stops here and nobody downstream is told',
      tone: 'warn' as const,
    },
    {
      label: 'Different → notify',
      detail: 'The next layer is marked dirty and it repeats',
      tone: 'good' as const,
    },
  ];

  /** The untracked staleness trap. */
  protected readonly untrackedSample = `a = signal(1);
b = signal(100);

sum = computed(() => this.a() + untracked(this.b));
// sum() is 101

this.b.set(500);

// What does sum() return now?`;

  /** Choices for the linkedSignal reset check. */
  protected readonly linkedOptions = [
    {
      text: "'Blue' — it only resets when the old value disappears",
      why: 'That is the behaviour people expect, and it is what the `source` / `computation` form gives you. The plain one-argument form has no idea what the previous value was, so it cannot make that comparison.',
    },
    {
      text: 'The first option of the new list',
      correct: true,
      why: 'The computation `() => this.options()[0]` re-runs in full whenever `options` changes, and it says "the first one" unconditionally. Whether the old selection is still present never enters into it — nothing in that expression looks.',
    },
    {
      text: "'Blue', but only until the next read of `selected()`",
      why: 'There is no deferred reset in signals. A `linkedSignal` settles synchronously when its source changes; reading it later just returns the settled value.',
    },
    {
      text: 'It stays whatever the user last wrote until you call `.set()` again',
      why: 'That would make it an ordinary `signal`. The entire point of `linkedSignal` is that it *does* re-derive from its source — writability is the addition, not a replacement.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'When do I actually need `linkedSignal` rather than `computed`?',
      a: 'Only when a human has to be able to overwrite the derived value. Selection state is the giveaway: the default comes from the data (first row, cheapest plan, current month), but the user can pick something else, and reloading the data should sensibly reset it. If nothing ever writes it, `computed` is simpler and you should prefer it.',
    },
    {
      q: 'Is `untracked` a code smell?',
      a: 'Used often, yes. It silently removes an edge from the dependency graph, which is invisible at the call site and produces stale values that look like data bugs rather than reactivity bugs. It has genuine uses — reading a logger, a config that never changes, or breaking a feedback loop — but "I want the current value here" is almost always better served by passing that value in as a parameter.',
    },
    {
      q: 'Does a custom `equal` work on `computed` too, or only writable signals?',
      a: 'Both. `computed(fn, { equal })` compares the newly computed value against the cached one and, if they match, does not notify anything downstream. That is the useful case, actually — a computed that rebuilds an array every run will hand out a new reference every time, and a value-based `equal` stops that from invalidating half your template.',
    },
    {
      q: 'What happens if I write to a signal inside a `computed`?',
      a: 'Angular throws. A `computed` is expected to be pure and can be re-run at any time, in any order, or skipped entirely if nobody reads it — so a write inside one would fire an unpredictable number of times. The framework refuses rather than letting you build something that works in development and misbehaves under a different read pattern.',
    },
    {
      q: 'Why is `effect` said to be worse than `computed` for copying a value?',
      a: 'Timing and honesty. An effect is scheduled, so the copy lands a beat after the source changed, and anything reading in between sees the old value — a real glitch. It also hides the relationship: with a `computed`, the dependency is visible in the expression, whereas an effect that writes a signal makes you read the body to discover that the two are connected at all.',
    },
  ];

  /**
   * The palettes the `linkedSignal` demo cycles through.
   */
  private readonly palettes = [
    ['Red', 'Green', 'Blue'],
    ['Cyan', 'Magenta', 'Yellow'],
    ['Amber', 'Violet', 'Teal'],
  ];
  /**
   * Which palette is showing.
   */
  private paletteIndex = 0;

  /**
   * The current options — the source the selection is linked to.
   */
  protected readonly options = signal(this.palettes[0]);
  /**
   * The selection. A `linkedSignal`, so it is writable like a `signal` *and* resets
   * to the first option whenever the options change. Neither `signal` nor
   * `computed` alone does both.
   */
  protected readonly selected = linkedSignal(() => this.options()[0]);

  /**
   * Tracked dependency of {@link sum}.
   */
  protected readonly a = signal(1);
  /**
   * Untracked dependency of {@link sum} — read, but not subscribed to.
   */
  protected readonly b = signal(100);
  /**
   * The sum. Recomputes on `a`, not on `b`: `untracked` reads the value without
   * registering a dependency, so the displayed total can be stale by design.
   */
  protected readonly sum = computed(() => this.a() + untracked(this.b));

  /**
   * Swaps in the next palette, which is what makes the linked selection reset.
   */
  protected reshuffle() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.options.set(this.palettes[this.paletteIndex]);
  }
}
