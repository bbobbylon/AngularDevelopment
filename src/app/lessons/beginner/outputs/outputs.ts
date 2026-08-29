import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import { RateEvent } from './outputs.shared';
import { Rating } from './rating/rating';

/**
 * Lesson: Component Outputs — sending events up.
 *
 * Covers the `output()` function, emitting typed payloads, `output<void>()` for
 * bare notifications, and how a parent binds with `(eventName)`.
 *
 * The framing the lesson uses: inputs flow down, outputs flow up, and neither
 * crosses back. A child never writes to its input, and a parent never reaches
 * into a child — the two talk only through this pair. Keeping that boundary is
 * what makes a component reusable somewhere it was not designed for.
 *
 * Also notes what changed from `@Output() new EventEmitter()`: `output()` is not
 * an RxJS subject, has no `.subscribe()` for consumers, and is completed for you
 * when the component is destroyed.
 *
 * @see beginner/inputs — the other half of the contract.
 */
@Component({
  selector: 'app-lesson-outputs',
  imports: [RouterLink, Rating, DatePipe, Flow, Predict, Quiz, Remember],
  templateUrl: './outputs.html',
  styleUrl: './outputs.css',
})
export class Outputs {
  /** The `$event` question, posed before the note that answers it. */
  protected readonly eventSample = `// child
rate = output<RateEvent>();
this.rate.emit({ stars: 4, at: new Date() });

// parent
<app-rating (rate)="onRate($event)" />`;

  /** The unidirectional data loop, which is the real subject of this lesson. */
  protected readonly loop = [
    { label: 'Child emits', detail: 'A typed payload leaves the child' },
    {
      label: 'Parent handles',
      detail: 'The bound method runs with `$event`',
      tone: 'accent' as const,
    },
    { label: 'Parent updates', detail: 'It changes state it owns' },
    {
      label: 'Input flows down',
      detail: 'The child re-renders from the new value',
      tone: 'good' as const,
    },
  ];

  /** Choices for the two-way binding check. */
  protected readonly twoWayOptions = [
    {
      text: 'An input called `value` and an output called `valueChange`',
      correct: true,
      why: 'That is the whole convention. `[(value)]` is pure syntax sugar over `[value]` plus `(valueChange)`, and the `Change` suffix is what makes the pair discoverable to the compiler. `model()` generates exactly this.',
    },
    {
      text: 'A single two-way binding primitive built into Angular',
      why: 'There is no such primitive. The banana-in-a-box is desugared by the compiler into the input/output pair before anything runs.',
    },
    {
      text: 'A shared mutable object passed by reference',
      why: 'That is how you would fake it without the framework, and it is the pattern outputs exist to replace — a shared mutable reference is invisible to OnPush and impossible to trace.',
    },
  ];
  /**
   * The most recent event from the rating child.
   */
  protected readonly last = signal<RateEvent | null>(null);
  /**
   * Every event received, so the demo shows the stream rather than a snapshot.
   */
  protected readonly history = signal<RateEvent[]>([]);

  /**
   * Records a rating event.
   *
   * @param e The emitted payload.
   */
  protected onRate(e: RateEvent) {
    this.last.set(e);
    this.history.update((h) => [...h, e]);
  }

  /**
   * Handles the child's clear event.
   */
  protected onClear() {
    this.last.set(null);
  }
}
