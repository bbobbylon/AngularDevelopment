import { Component, input, output, signal } from '@angular/core';
import { RateEvent } from '../outputs.shared';

/** A child that emits events upward via output(). */
@Component({
  selector: 'app-rating',
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class Rating {
  /**
   * How many stars to show.
   */
  readonly max = input(5);
  /**
   * The currently selected rating — the child's own state, distinct from what it
   * emits.
   */
  readonly current = signal(0);
  /**
   * `1..max` for rendering the stars. A getter rather than a `computed` here to
   * keep the child minimal; it is cheap and re-reads on each check.
   */
  protected get stars() {
    return Array.from({ length: this.max() }, (_, i) => i + 1);
  }

  /** output() returns an emitter; parents bind (rate)="..." */
  readonly rate = output<RateEvent>();
  /**
   * Emitted when the rating is cleared. `output<void>()` — an event that carries
   * no payload is still worth being an output rather than a shared flag.
   */
  readonly cleared = output<void>();

  /**
   * Selects a rating and announces it.
   *
   * The child sets its own state **and** emits: the parent is told what happened,
   * not asked for permission. Outputs are notifications, not requests.
   *
   * @param stars The chosen rating.
   */
  protected select(stars: number) {
    this.current.set(stars);
    this.rate.emit({ stars, at: new Date() });
  }

  /**
   * Clears the rating and announces that too.
   */
  protected reset() {
    this.current.set(0);
    this.cleared.emit();
  }
}
