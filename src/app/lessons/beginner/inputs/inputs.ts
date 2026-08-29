import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import { CoerceDemo } from './coerce-demo/coerce-demo';
import { Badge } from './badge/badge';

/**
 * Lesson: Component Inputs — passing data down.
 *
 * Covers the signal-based `input()` function, optional against `input.required()`,
 * aliasing, and `transform`.
 *
 * The demo the lesson is built around is coercion. An attribute in a template is
 * always a string; without a `transform` a child declared as taking a number
 * quietly receives `"42"`, and `size() + 1` yields `"421"`. `numberAttribute`
 * and `booleanAttribute` fix that at the boundary, and {@link CoerceDemo} shows
 * the runtime type so the fix is visible rather than asserted.
 *
 * Also contrasts `input()` with the older `@Input()` decorator: the signal form
 * is readable in a `computed`, needs no `ngOnChanges` to react to, and cannot be
 * written to from inside the child.
 */
@Component({
  selector: 'app-lesson-inputs',
  imports: [RouterLink, Badge, CoerceDemo, Compare, Faq, Predict, Quiz, Remember],
  templateUrl: './inputs.html',
})
export class Inputs {
  /** The `disabled="false"` trap, posed before the transform section explains it. */
  protected readonly coercionTrapSample = `// child
disabled = input(false);          // no transform

// parent template
<app-button disabled="false" />`;

  /** Choices for the constructor-read check — the single most common input mistake. */
  protected readonly timingOptions = [
    {
      text: 'It logs the value the parent bound',
      why: 'Bindings have not been applied when the constructor runs. The instance exists, but nothing has been passed into it yet.',
    },
    {
      text: 'It logs `undefined`',
      why: 'Close, and that is what happens for an *optional* input — but a required input is stricter than that.',
    },
    {
      text: 'It throws',
      correct: true,
      why: 'Reading a `required` input before it is set throws NG0950. Angular would rather fail loudly than hand you an `undefined` that surfaces as a bug three layers away. Read it in `ngOnInit`, a `computed`, or the template.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Why is an input a function I have to call, rather than a plain property?',
      a: 'Because the call is what registers the dependency. When a `computed` or a template reads `label()`, the reactivity graph records that it depends on this input, so it can re-run exactly those readers when the value changes. A plain property read gives Angular no way to know who cared.',
    },
    {
      q: 'Is `@Input()` deprecated? Should I rewrite everything?',
      a: 'Not deprecated, and no. The decorator form works and will keep working. Use `input()` in new code because it composes with `computed` and removes the need for `ngOnChanges`, and migrate existing code when you are touching it anyway — not as a project of its own.',
    },
    {
      q: 'If inputs are read-only, how do I let the child change the value?',
      a: 'Use `model()`, which gives you a writable signal plus an automatic `xChange` output, so the parent can bind `[(value)]`. Reach for it only when the child genuinely owns the value — a form control, a toggle. For everything else, one-way in and an event out is easier to reason about.',
    },
    {
      q: 'I mutated an object I received as an input and the parent changed too. Is that a bug?',
      a: 'It is doing what JavaScript does — you were handed the same reference, not a copy. It is still a bug in the design: it is a hidden two-way channel that OnPush will not notice, so the parent can end up displaying stale data it technically already has. Treat inputs as immutable and emit an event instead.',
    },
  ];
  /**
   * Text passed to the badge demo.
   */
  protected readonly label = signal('Online');
  /**
   * Colour passed to the badge demo.
   */
  protected readonly color = signal('#2ec16b');
  /**
   * A number passed to the badge demo.
   */
  protected readonly count = signal(7);
  /**
   * A boolean passed to the badge demo, for the `booleanAttribute` transform.
   */
  protected readonly large = signal(false);
  /**
   * Initials derived from {@link label} — a `computed` over a signal that happens
   * to feed an input, to show the two composing.
   */
  protected readonly initials = computed(() => this.label().slice(0, 2).toUpperCase());
  /**
   * The **string** bound to the coercion demo's numeric input. A string on purpose:
   * that is what a template attribute always is.
   */
  protected readonly raw = signal('42');
}
