import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, Rating, DatePipe],
  templateUrl: './outputs.html',
  styleUrl: './outputs.css',
})
export class Outputs {
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
