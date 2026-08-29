import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Signals Basics — Angular's reactive primitive.
 *
 * Covers the three pieces and how they differ: `signal()` holds writable state,
 * `computed()` derives from it lazily and caches, and `effect()` runs a side
 * effect when its dependencies change.
 *
 * The distinction the lesson leans on hardest is `computed` against `effect`.
 * Both react to the same signals, but a `computed` *returns* a value and must
 * stay pure, while an `effect` returns nothing and exists precisely for the
 * impure work — logging, storage, DOM. Reaching for an `effect` to compute a
 * value is the mistake this page is built to prevent.
 *
 * The live demo shows a counter with a derived double and parity, plus an
 * effect log that fills in as the count changes.
 */
@Component({
  selector: 'app-lesson-signals',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './signals.html',
  styleUrl: './signals.css',
})
export class Signals {
  /** The mutation trap, posed before the "common mistakes" table names it. */
  protected readonly mutationSample = `items = signal(['a', 'b']);

addItem() {
  this.items().push('c');   // read the array, push into it
}`;

  /** What actually happens when you write to a signal. */
  protected readonly propagation = [
    { label: '`set()`', detail: 'The value changes and the version counter ticks' },
    {
      label: 'Mark dirty',
      detail: 'Every consumer that read it is flagged',
      tone: 'accent' as const,
    },
    {
      label: 'Nothing runs',
      detail: 'Marking is not running — this is the surprising part',
      tone: 'warn' as const,
    },
    { label: 'Something reads', detail: 'A template or `computed` asks for the value' },
    { label: 'Recompute', detail: 'Only then does the formula re-run', tone: 'good' as const },
  ];

  /** Choices for the batching check. */
  protected readonly batchOptions = [
    {
      text: 'Three times — once per `set()`',
      why: 'Signal writes are synchronous, but effects are not. Running an effect per write would mean the effect sees intermediate states that never appeared on screen.',
    },
    {
      text: 'Once, with the final value',
      correct: true,
      why: 'Effects are scheduled, not immediate. Angular batches them into the next change-detection pass, so all three writes collapse into a single run that sees `3`.',
    },
    {
      text: 'Twice — once on creation and once at the end',
      why: 'True for the *first* tick, when the effect also runs once on creation. Within a single synchronous block afterwards, though, three writes produce one run.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Why do I call a signal like a function? It looks odd.',
      a: 'Because the call is the tracking mechanism. When `count()` runs inside a template or a `computed`, the signal records who is asking, and that record is what lets it notify exactly the right consumers later. A plain property read would be invisible to it.',
    },
    {
      q: 'What is the actual difference between `computed` and `effect`? Both react to changes.',
      a: 'A `computed` *returns a value* and must be pure; an `effect` returns nothing and exists for the impure work. If you are writing `effect(() => this.total.set(...))`, you wanted a `computed`. The rule: deriving is `computed`, doing is `effect`.',
    },
    {
      q: 'Are signals the same as RxJS `BehaviorSubject`?',
      a: 'They overlap but solve different problems. A signal always has a value, is read synchronously, and tracks its own dependencies. An Observable is a stream over time with operators for combining, debouncing and cancelling. Use signals for state, RxJS for events and async pipelines — and `toSignal`/`toObservable` to cross between them.',
    },
    {
      q: 'Do I have to use `update()`, or can I read and then `set()`?',
      a: '`count.set(count() + 1)` works and is not wrong. `update()` is preferred because it makes the read-then-write atomic in one expression, which is clearer and avoids a class of bug where the read happens further away than you think.',
    },
    {
      q: 'What happens if I create an `effect` outside a constructor?',
      a: 'Angular throws unless you are in an injection context or you pass an explicit `injector`. This is deliberate: an effect needs an owner to be destroyed with, and one without an owner runs forever. That is a memory leak the framework would rather stop at creation.',
    },
  ];
  /**
   * The counter — the one piece of writable state on the page.
   */
  protected readonly count = signal(0);
  /**
   * Twice the count. Derived, not stored: a second signal kept in sync by hand is
   * the bug `computed` removes.
   */
  protected readonly doubled = computed(() => this.count() * 2);
  /**
   * Whether the count is even or odd. A second derivation off the same source, to
   * show that a signal can feed many.
   */
  protected readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));
  /**
   * Lines recorded by the effect, so its firing is visible rather than implied.
   */
  protected readonly effectLog = signal<string[]>([]);

  /**
   * Registers the demo effect.
   *
   * In an injection context, so it is torn down with the component — an effect
   * created outside one has to be disposed by hand, and forgetting is a leak.
   */
  constructor() {
    // Demonstrates effect(): reacts to count changes and records them.
    effect(() => {
      const value = this.count();
      this.effectLog.update((log) => [`count changed to ${value}`, ...log].slice(0, 8));
    });
  }
}
