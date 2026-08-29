import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, map } from 'rxjs';

/**
 * Lesson: Signals ↔ RxJS Interop — converting at the boundary.
 *
 * Signals and observables are not competing answers to one question. A signal is
 * synchronous state with a value you can always read; an observable is a stream
 * of things that happen over time, with operators for debouncing, retrying and
 * cancelling. `@angular/core/rxjs-interop` supplies the two bridges —
 * `toSignal` and `toObservable` — so each can be used where it fits.
 *
 * The demos are a stream consumed as state (`toSignal` over an interval, no
 * `async` pipe in the template), and the full round trip: a signal out to RxJS
 * for `debounceTime` and straight back to a signal, which is how you get
 * operator power over signal-shaped state.
 *
 * @see intermediate/rxjs-operators — the operators worth crossing the bridge for.
 */
@Component({
  selector: 'app-lesson-rxjs-interop',
  imports: [RouterLink],
  templateUrl: './rxjs-interop.html',
  styleUrl: './rxjs-interop.css',
})
export class RxjsInterop {
  // toSignal: an Observable consumed as a signal, auto-unsubscribed on destroy.
  /**
   * A counter driven by an interval and consumed as a signal. `initialValue`
   * removes the `undefined` a not-yet-emitted stream would otherwise produce.
   */
  protected readonly tick = toSignal(interval(1000).pipe(map((n) => n + 1)), {
    initialValue: 0,
  });

  /**
   * The same tick multiplied, fed by an RxJS pipeline in the constructor rather
   * than a `computed` — so the round trip is visible.
   */
  protected readonly tickTimesTen = signal(0);

  // The full round-trip: a signal → toObservable → debounceTime → toSignal.
  /**
   * What the user typed, immediately.
   */
  protected readonly query = signal('');
  /**
   * The same text after a 500 ms pause: signal → `toObservable` → `debounceTime`
   * → `toSignal`. Nothing in signals alone does this, which is the argument for
   * the bridge existing.
   */
  protected readonly debounced = toSignal(toObservable(this.query).pipe(debounceTime(500)), {
    initialValue: '',
  });

  /**
   * Wires the `toObservable` demo. `takeUntilDestroyed` ends the subscription with
   * the component, which is what makes subscribing here safe.
   */
  constructor() {
    // Demonstrate toObservable + takeUntilDestroyed feeding another signal.
    const tick$ = toObservable(this.tick);
    tick$.pipe(takeUntilDestroyed()).subscribe((v) => this.tickTimesTen.set(v * 10));
  }

  /**
   * Updates the query.
   *
   * @param v The input's text.
   */
  protected setQuery(v: string): void {
    this.query.set(v);
  }
}
