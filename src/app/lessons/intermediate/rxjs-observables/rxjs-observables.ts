import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { shareReplay, take } from 'rxjs/operators';

/**
 * Lesson: Observables — the RxJS primitive, and the two properties that catch
 * people out.
 *
 * Covers creating an observable, the observer's three channels (`next`, `error`,
 * `complete`), subscribing, and unsubscribing.
 *
 * Two demos, each aimed at one misconception:
 *
 * - **Nothing runs until you subscribe.** An observable is a *recipe*, not a
 *   running process. Building one and never subscribing does nothing at all —
 *   unlike a promise, which starts the moment it is constructed.
 * - **Cold observables run once per subscriber.** Two subscriptions to the same
 *   observable get two separate executions, and therefore two separate HTTP
 *   requests. The demo prints a fresh random id per execution, so a second
 *   subscriber showing a *different* id is the proof. `shareReplay(1)` makes
 *   them share one, and the toggle switches between the two behaviours.
 *
 * @see intermediate/rxjs-operators — transforming what comes out.
 * @see intermediate/rxjs-subjects — observables you can push into.
 */
@Component({
  selector: 'app-lesson-rxjs-observables',
  imports: [RouterLink],
  templateUrl: './rxjs-observables.html',
  styleUrl: './rxjs-observables.css',
})
export class RxjsObservables implements OnDestroy {
  /**
   * The latest value from the interval demo.
   */
  protected readonly value = signal<number | string>('—');
  /**
   * Whether the interval demo is running.
   */
  protected readonly running = signal(false);
  /**
   * The interval demo's subscription — the handle that {@link stop} needs, and
   * without which the timer would keep running after the component is gone.
   */
  private sub?: Subscription;

  /**
   * Starts the interval demo, ignoring a second click while it is already running.
   */
  protected start() {
    if (this.running()) return;
    const counter$: Observable<number> = interval(500).pipe(take(1000));
    this.sub = counter$.subscribe((v) => this.value.set(v));
    this.running.set(true);
  }

  /**
   * Unsubscribes, stopping the interval.
   */
  protected stop() {
    this.sub?.unsubscribe();
    this.running.set(false);
  }

  /**
   * Stops the interval on teardown. An observable subscription is not cleaned up
   * for you — this is the leak the lesson keeps warning about, handled.
   */
  ngOnDestroy() {
    this.stop();
  }

  // --- cold vs hot demo ---
  /**
   * Whether the cold/hot demo is using the shared source.
   */
  protected readonly shared = signal(false);
  /**
   * The execution id subscriber A received.
   */
  protected readonly execA = signal('—');
  /**
   * The execution id subscriber B received. Equal to A's only when sharing.
   */
  protected readonly execB = signal('—');
  /**
   * A cold source: each subscription runs the producer function again and gets its
   * own id.
   */
  private coldSource$ = this.buildSource();
  /**
   * The same source through `shareReplay(1)`: one execution, multicast to every
   * subscriber, with the last value replayed to late joiners.
   */
  private sharedSource$ = this.coldSource$.pipe(shareReplay(1));

  /**
   * Builds a source that stamps each execution with a random id.
   *
   * The id is generated **inside** the subscribe function, which is what makes the
   * demo work: it is created per execution, not per observable, so two ids mean
   * two executions.
   */
  private buildSource(): Observable<string> {
    return new Observable<string>((subscriber) => {
      const id = Math.random().toString(36).slice(2, 7);
      subscriber.next(id);
      subscriber.complete();
    });
  }

  /**
   * Switches between the cold and shared sources.
   */
  protected toggleShared() {
    this.shared.set(!this.shared());
  }

  /**
   * Subscribes as A.
   */
  protected subscribeA() {
    (this.shared() ? this.sharedSource$ : this.coldSource$).subscribe((id) => this.execA.set(id));
  }

  /**
   * Subscribes as B. Run it after A and compare the ids.
   */
  protected subscribeB() {
    (this.shared() ? this.sharedSource$ : this.coldSource$).subscribe((id) => this.execB.set(id));
  }

  /**
   * Clears both results so the demo can be re-run.
   */
  protected resetDemo() {
    this.execA.set('—');
    this.execB.set('—');
    this.coldSource$ = this.buildSource();
    this.sharedSource$ = this.coldSource$.pipe(shareReplay(1));
  }
}
