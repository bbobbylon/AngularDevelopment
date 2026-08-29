import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AsyncSubject,
  BehaviorSubject,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';

/**
 * Lesson: Subjects — observables you can also push into.
 *
 * A `Subject` is both an observable and an observer, which makes it the bridge
 * between imperative code ("this happened") and a reactive pipeline. It is also
 * the most misused thing in RxJS, so the lesson is organised around *which* of
 * the four to reach for.
 *
 * The distinction is entirely about what a **late subscriber** sees:
 *
 * - `Subject` — nothing. Values emitted before you joined are gone.
 * - `BehaviorSubject` — the current value, immediately. Needs an initial value,
 *   which is why it models *state* rather than events.
 * - `ReplaySubject(n)` — the last `n` values.
 * - `AsyncSubject` — nothing until the source completes, then only the final
 *   value.
 *
 * The second demo emits into all four, then lets a late subscriber join, so that
 * table is produced by the page rather than printed on it.
 *
 * Also covers the discipline point: expose `subject.asObservable()`, so
 * consumers can listen without being able to `next()` into your state.
 */
@Component({
  selector: 'app-lesson-rxjs-subjects',
  imports: [RouterLink],
  templateUrl: './rxjs-subjects.html',
  styleUrl: './rxjs-subjects.css',
})
export class RxjsSubjects implements OnDestroy {
  /**
   * The state behind the first demo. A `BehaviorSubject` because it models a
   * *current value* — there is always one, and a new subscriber needs it.
   */
  private readonly value$ = new BehaviorSubject<number>(0);
  /**
   * The current value, mirrored into a signal for the template.
   */
  protected readonly current = signal(0);
  /**
   * What subscriber A has seen. A joins immediately.
   */
  protected readonly a = signal<number[]>([]);
  /**
   * What subscriber B has seen. B joins late — the comparison is the demo.
   */
  protected readonly b = signal<number[]>([]);
  /**
   * Whether B has joined yet.
   */
  protected readonly lateJoined = signal(false);

  /**
   * The first demo's subscriptions.
   */
  private subs = new Subscription();

  // --- Live #2: the four flavors ---
  /**
   * Plain `Subject` — no history at all.
   */
  private subjectF = new Subject<number>();
  /**
   * `BehaviorSubject` — holds the current value, so needs an initial one.
   */
  private behaviorF = new BehaviorSubject<number>(0);
  /**
   * `ReplaySubject(2)` — buffers the last two values.
   */
  private replayF = new ReplaySubject<number>(2);
  /**
   * `AsyncSubject` — emits only the final value, and only on completion.
   */
  private asyncF = new AsyncSubject<number>();
  /**
   * The flavour demo's subscriptions, replaced wholesale on reset.
   */
  private flavorSubs = new Subscription();

  /**
   * Values pushed into all four flavours.
   */
  protected readonly emitted = signal<number[]>([]);
  /**
   * Whether the sources have been completed — which is what makes the
   * `AsyncSubject` finally emit.
   */
  protected readonly done = signal(false);
  /**
   * Whether the late subscriber has joined the flavour demo.
   */
  protected readonly lateJoined2 = signal(false);
  /**
   * What the late subscriber received from the plain `Subject` — nothing, unless
   * something is emitted after it joined.
   */
  protected readonly lateSubject = signal<number[]>([]);
  /**
   * What it received from the `BehaviorSubject` — the current value.
   */
  protected readonly lateBehavior = signal<number[]>([]);
  /**
   * What it received from the `ReplaySubject` — the last two.
   */
  protected readonly lateReplay = signal<number[]>([]);
  /**
   * What it received from the `AsyncSubject` — the final value, if completed.
   */
  protected readonly lateAsync = signal<number[]>([]);

  /**
   * Subscribes A immediately, so the first demo starts with one early listener and
   * room for a late one.
   */
  constructor() {
    // Subscriber A joins immediately.
    this.subs.add(this.value$.subscribe((v) => this.a.update((arr) => [...arr, v])));
    this.subs.add(this.value$.subscribe((v) => this.current.set(v)));
  }

  /**
   * Pushes the next value. Reads `.value` off the `BehaviorSubject` — the
   * synchronous getter only that flavour has.
   */
  protected emit() {
    this.value$.next(this.value$.value + 1);
  }

  /**
   * Subscribes B late. It receives the current value at once, which a plain
   * `Subject` would not have given it.
   */
  protected lateSubscribe() {
    this.lateJoined.set(true);
    this.subs.add(this.value$.subscribe((v) => this.b.update((arr) => [...arr, v])));
  }

  /** Format a late-subscriber result array for display. */
  protected show(arr: number[]): string {
    if (!this.lateJoined2()) return '— (add a late subscriber)';
    return arr.length ? arr.join(', ') : '(nothing)';
  }

  /**
   * Pushes one value into all four flavours at once.
   */
  protected emitAll() {
    const v = this.emitted().length + 1;
    this.emitted.update((a) => [...a, v]);
    this.subjectF.next(v);
    this.behaviorF.next(v);
    this.replayF.next(v);
    this.asyncF.next(v);
  }

  /**
   * Completes all four. Watch the `AsyncSubject`: this is the moment it emits, and
   * it emits only the last value.
   */
  protected completeAll() {
    this.subjectF.complete();
    this.behaviorF.complete();
    this.replayF.complete();
    this.asyncF.complete(); // AsyncSubject only emits its final value now
    this.done.set(true);
  }

  /**
   * Joins the flavour demo late, filling in the four "what did I get?" lists.
   */
  protected subscribeLate() {
    this.lateJoined2.set(true);
    this.flavorSubs.add(this.subjectF.subscribe((v) => this.lateSubject.update((a) => [...a, v])));
    this.flavorSubs.add(this.behaviorF.subscribe((v) => this.lateBehavior.update((a) => [...a, v])));
    this.flavorSubs.add(this.replayF.subscribe((v) => this.lateReplay.update((a) => [...a, v])));
    this.flavorSubs.add(this.asyncF.subscribe((v) => this.lateAsync.update((a) => [...a, v])));
  }

  /**
   * Rebuilds all four sources from scratch. A completed subject cannot be reused —
   * completion is permanent — so this replaces them rather than clearing them.
   */
  protected resetFlavors() {
    this.flavorSubs.unsubscribe();
    this.flavorSubs = new Subscription();
    this.subjectF = new Subject<number>();
    this.behaviorF = new BehaviorSubject<number>(0);
    this.replayF = new ReplaySubject<number>(2);
    this.asyncF = new AsyncSubject<number>();
    this.emitted.set([]);
    this.done.set(false);
    this.lateJoined2.set(false);
    this.lateSubject.set([]);
    this.lateBehavior.set([]);
    this.lateReplay.set([]);
    this.lateAsync.set([]);
  }

  /**
   * Unsubscribes everything on teardown.
   */
  ngOnDestroy() {
    this.subs.unsubscribe();
    this.flavorSubs.unsubscribe();
  }
}
