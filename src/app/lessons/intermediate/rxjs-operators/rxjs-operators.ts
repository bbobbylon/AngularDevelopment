import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, of, timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  mergeMap,
  switchMap,
} from 'rxjs/operators';

/**
 * Lesson: Core Operators — the handful worth knowing, and the choice that
 * matters most.
 *
 * Covers `map`, `filter`, `tap`, `debounceTime`, `distinctUntilChanged`,
 * `catchError`, `take`/`takeUntil`, and the four flattening operators.
 *
 * Two live demos:
 *
 * - **A type-ahead**, counting keystrokes against searches actually issued, so
 *   `debounceTime` + `distinctUntilChanged` show up as a number rather than a
 *   claim.
 * - **`switchMap` against `mergeMap`**, racing the same trigger through both.
 *   This is the choice the lesson cares about: `switchMap` cancels the previous
 *   inner observable, `mergeMap` lets them all run. For a search box, `mergeMap`
 *   is a race condition with a stale winner; for a save queue, `switchMap`
 *   silently drops writes. Same signature, opposite failure modes — which is why
 *   the demo fires both from one button and shows the outputs side by side.
 *
 * @see intermediate/rxjs-observables — what these operate on.
 */
@Component({
  selector: 'app-lesson-rxjs-operators',
  imports: [RouterLink],
  templateUrl: './rxjs-operators.html',
  styleUrl: './rxjs-operators.css',
})
export class RxjsOperators implements OnDestroy {
  /**
   * Keystrokes typed into the type-ahead.
   */
  protected readonly keystrokes = signal(0);
  /**
   * Searches actually issued. The gap against {@link keystrokes} is what
   * debouncing bought.
   */
  protected readonly searches = signal(0);
  /**
   * The type-ahead's latest result.
   */
  protected readonly result = signal('—');

  /**
   * The type-ahead's input stream.
   */
  private readonly query$ = new Subject<string>();
  /**
   * Every subscription this component holds, unsubscribed together on destroy.
   */
  private readonly subs = new Subscription();

  // --- Live #2: switchMap vs mergeMap race ---
  /**
   * Sequence source for race-demo request ids.
   */
  private fireId = 0;
  /**
   * Trigger for the `switchMap` arm of the race.
   */
  private readonly switch$ = new Subject<number>();
  /**
   * Trigger for the `mergeMap` arm — the same events, a different policy.
   */
  private readonly merge$ = new Subject<number>();
  /**
   * Requests fired, in order.
   */
  protected readonly fired = signal<number[]>([]);
  /**
   * Results that made it out of the `switchMap` arm. Shorter than {@link fired}:
   * the cancelled ones never arrive.
   */
  protected readonly switchOut = signal<number[]>([]);
  /**
   * Results that made it out of the `mergeMap` arm. Every request completes — but
   * not necessarily in the order it was fired.
   */
  protected readonly mergeOut = signal<number[]>([]);

  /**
   * Wires both demos.
   *
   * The type-ahead chains `debounceTime` (wait for a pause) then
   * `distinctUntilChanged` (ignore a repeat) before `switchMap`, which is the
   * standard three-step and does most of the work of not hammering an API.
   */
  constructor() {
    this.subs.add(
      this.query$
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap((q) => {
            this.searches.update((n) => n + 1);
            // simulate an API returning a transformed result
            return of(q).pipe(map((s) => (s ? `found "${s}"` : '—')));
          }),
        )
        .subscribe((r) => this.result.set(r)),
    );

    // Each fired id starts a 700ms "task"; switchMap cancels stale ones, mergeMap keeps all.
    this.subs.add(
      this.switch$
        .pipe(switchMap((id) => timer(700).pipe(map(() => id))))
        .subscribe((id) => this.switchOut.update((a) => [...a, id])),
    );
    this.subs.add(
      this.merge$
        .pipe(mergeMap((id) => timer(700).pipe(map(() => id))))
        .subscribe((id) => this.mergeOut.update((a) => [...a, id])),
    );
  }

  /**
   * Feeds a keystroke into the type-ahead.
   *
   * @param value The input's current text.
   */
  protected onType(value: string) {
    this.keystrokes.update((n) => n + 1);
    this.query$.next(value);
  }

  /**
   * Fires one request into both arms of the race, so the two policies are compared
   * on identical input.
   */
  protected fire() {
    const id = ++this.fireId;
    this.fired.update((a) => [...a, id]);
    this.switch$.next(id);
    this.merge$.next(id);
  }

  /**
   * Clears the race demo.
   */
  protected resetRace() {
    this.fireId = 0;
    this.fired.set([]);
    this.switchOut.set([]);
    this.mergeOut.set([]);
  }

  /**
   * Unsubscribes everything on teardown.
   */
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
