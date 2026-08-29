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
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · RxJS</span>
      <h1>Subjects</h1>
      <p class="lead">
        A regular Observable is a <em>cold</em> producer — each subscriber gets its own
        private run. A <strong>Subject</strong> is different: it's both an Observable
        <em>and</em> an Observer. You can <code>next()</code> values <em>into</em> it, and
        it <strong>multicasts</strong> them to every subscriber at once. That makes it the
        classic building block for event buses and shared state.
      </p>

      <h2>Observable vs Subject in one picture</h2>
      <div class="code">
        <pre>Cold Observable — each subscriber gets a fresh, independent run:
  subA: --1--2--3--|
  subB:    --1--2--3--|    (its OWN run, started when it subscribed)

Subject — ONE run, the same values pushed to everyone (multicast):
  you:  --A--B-----C--      (you call .next('A'), .next('B'), …)
  subA: --A--B-----C--
  subB: -----B-----C--      (joined after A, so only sees B and C onward)</pre>
      </div>

      <h2>The four flavors</h2>
      <table class="t">
        <tr><td><code>Subject</code></td><td>No memory. Subscribers only get values emitted <em>after</em> they subscribe.</td></tr>
        <tr><td><code>BehaviorSubject</code></td><td>Holds a <strong>current value</strong>; new subscribers immediately get the latest. <strong>Ideal for state.</strong></td></tr>
        <tr><td><code>ReplaySubject</code></td><td>Replays the last <em>N</em> values to new subscribers.</td></tr>
        <tr><td><code>AsyncSubject</code></td><td>Emits only the <em>final</em> value, and only once it completes.</td></tr>
      </table>

      <div class="code">
        <pre>The difference is what a LATE subscriber sees (joins after 1,2,3 emitted):

Subject:           late sub → (nothing until the next emission)
BehaviorSubject(0):late sub → 3            (the current value, immediately)
ReplaySubject(2):  late sub → 2, 3          (the last two, immediately)
AsyncSubject:      late sub → (nothing until complete, then the last value)</pre>
      </div>

      <h2>BehaviorSubject for shared state</h2>
      <div class="code">
        <pre>private count$ = new BehaviorSubject&lt;number&gt;(0);
readonly count = this.count$.asObservable();   // expose READ-ONLY

increment() {{ '{' }} this.count$.next(this.count$.value + 1); {{ '}' }}
//                                  ^ .value reads the current value synchronously</pre>
      </div>

      <h2>Try it — multicast to two subscribers</h2>
      <div class="demo">
        <p class="demo__title">Live — a BehaviorSubject pushing to two subscribers</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="emit()">Emit next value</button>
          <button class="ghost" (click)="lateSubscribe()" [disabled]="lateJoined()">
            Add a late subscriber
          </button>
        </div>
        <p>BehaviorSubject current value: <strong>{{ current() }}</strong></p>
        <p>Subscriber A (joined at start) saw: <code>{{ a().join(', ') || '—' }}</code></p>
        <p>Subscriber B (joined late) saw: <code>{{ b().join(', ') || '— not joined' }}</code></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Emit a few values, then add the late subscriber — B immediately receives the
          <em>current</em> value on joining. That's the BehaviorSubject difference; a
          plain Subject would give B nothing until the next emit.
        </p>
      </div>

      <h2>The event-bus pattern</h2>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class NotificationBus {{ '{' }}
  private events$ = new Subject&lt;string&gt;();
  readonly messages = this.events$.asObservable();   // others subscribe to this
  notify(msg: string) {{ '{' }} this.events$.next(msg); {{ '}' }}     // anyone can publish
{{ '}' }}</pre>
      </div>
      <p>Unrelated components can communicate without knowing about each other — one publishes, others subscribe.</p>

      <div class="warn">
        A Subject is <strong>hot &amp; multicast</strong>, and once it
        <code>complete()</code>s or errors it is <strong>terminated</strong> — further
        <code>next()</code> calls are ignored, and a new subscriber to a completed Subject
        gets only the completion. Never expose the raw Subject; return
        <code>.asObservable()</code> so consumers can't push or complete it.
      </div>

      <div class="note">
        In modern Angular, a <strong>signal</strong> often replaces a
        <code>BehaviorSubject</code> for component/service state — it's simpler, has no
        subscription to manage, and integrates with change detection. Reach for a Subject
        when you specifically need an <em>event stream</em> you can pipe RxJS operators
        through (debounce a search box, buffer clicks, etc.).
      </div>

      <h2>Live #2 — the four flavors, one late subscriber</h2>
      <p>
        This is the whole point of the four types. Emit a few values into all four subjects,
        optionally <em>complete</em> them, then add a late subscriber and see exactly what each
        one delivers on join:
      </p>
      <div class="demo">
        <p class="demo__title">Live — emitted so far: <code>{{ emitted().join(', ') || '—' }}</code>{{ done() ? ' (completed)' : '' }}</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="emitAll()" [disabled]="done()">Emit next</button>
          <button class="ghost" (click)="completeAll()" [disabled]="done()">complete()</button>
          <button (click)="subscribeLate()" [disabled]="lateJoined2()">Add late subscriber</button>
          <button class="ghost" (click)="resetFlavors()">reset</button>
        </div>
        <table class="t">
          <tr><th>Flavor</th><th>Late subscriber received</th></tr>
          <tr><td><code>Subject</code></td><td><code>{{ show(lateSubject()) }}</code></td></tr>
          <tr><td><code>BehaviorSubject(0)</code></td><td><code>{{ show(lateBehavior()) }}</code></td></tr>
          <tr><td><code>ReplaySubject(2)</code></td><td><code>{{ show(lateReplay()) }}</code></td></tr>
          <tr><td><code>AsyncSubject</code></td><td><code>{{ show(lateAsync()) }}</code></td></tr>
        </table>
        <p style="color:var(--text-muted);font-size:.85rem">
          Plain <code>Subject</code> gives the latecomer nothing already-emitted;
          <code>BehaviorSubject</code> replays just the current value; <code>ReplaySubject(2)</code>
          replays the last two; <code>AsyncSubject</code> stays silent until you press
          <code>complete()</code>, then delivers only the final value.
        </p>
      </div>

      <h2>Under the hood — how multicast works</h2>
      <p>
        A Subject keeps an internal <strong>list of observers</strong>. Calling
        <code>next(v)</code> simply loops that list and pushes <code>v</code> to each one — that's
        the entire multicast mechanism. A plain Observable has no such list: its subscribe callback
        re-runs per subscriber, which is why it's unicast. The flavors differ only in what they do
        <em>at subscribe time</em>: <code>BehaviorSubject</code> immediately emits its stored current
        value, <code>ReplaySubject</code> replays a buffer, <code>AsyncSubject</code> waits for
        completion. Once a Subject completes or errors, its observer list is cleared and it will
        never emit again.
      </p>

      <h2>Exam pitfalls</h2>
      <ul>
        <li><strong>next() after complete() is silently ignored.</strong> A completed Subject is dead; new subscribers get only the completion notification (or, for BehaviorSubject/ReplaySubject, the buffered value then completion).</li>
        <li><strong>Exposing the raw Subject.</strong> Return <code>.asObservable()</code> so consumers can't <code>next()</code> or <code>complete()</code> your stream from outside.</li>
        <li><strong><code>BehaviorSubject</code> requires an initial value</strong> — that's why new subscribers always get something. A plain <code>Subject</code> has none.</li>
        <li><strong>Reading <code>.value</code> everywhere.</strong> It's handy but pulls you out of the reactive flow; overusing it is a code smell — prefer piping, or a signal.</li>
        <li><strong>Leaks.</strong> A Subject is an infinite hot stream; subscribers must unsubscribe (<code>async</code> pipe, <code>takeUntilDestroyed</code>) or they pile up.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>A Subject is an Observable you can also push into; it <strong>multicasts</strong> to all subscribers.</li>
        <li><code>BehaviorSubject</code> holds a current value (great for state); <code>ReplaySubject</code> replays history.</li>
        <li>A late subscriber's experience differs per flavor — that's the whole point of the four.</li>
        <li>Expose <code>.asObservable()</code> to keep <code>next()</code> private; prefer signals for plain state.</li>
      </ul>

      <p><a routerLink="/rxjs-interop">Next: Signals ↔ RxJS Interop →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 150px; white-space: nowrap; }`,
  ],
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
