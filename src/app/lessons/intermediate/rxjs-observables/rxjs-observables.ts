import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, interval, shareReplay, take, tap } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Observables — the lazy, cancellable, multi-value primitive everything
 * else in RxJS builds on.
 *
 * ## Teaching order
 *
 * This lesson uses the brain-friendly presentation layer (`shared/brain/`,
 * `src/brain-friendly.css`) and follows the section rhythm the reference
 * implementation in `expert/change-detection` established:
 *
 * 1. **Pose the problem before naming it.** `http.get(...)` is called and
 *    nothing happens — no request, no error, silence — which contradicts how
 *    every learner already thinks `fetch` behaves. That surprise is the hook.
 * 2. **Analogy, then vocabulary.** A recipe you have to follow versus a meal
 *    that is already cooking whether you watch or not. Lazy/eager, cold/hot and
 *    "runs once per subscriber" all fall out of that one picture.
 * 3. **Then the same idea in four modes**: prose (the recipe analogy), a
 *    dialogue between the parts of the Observer contract (`app-bubbles`), an
 *    annotated `app-code-lab` of that same contract's real syntax, and a
 *    second annotated `app-code-lab` building one by hand from scratch.
 * 4. **Every substantial snippet is annotated line by line.** Nothing here
 *    assumes the reader can already read RxJS; that is the entire audience.
 *
 * ## Coverage-sweep additions (docs/COVERAGE-SWEEP.md → `intermediate/rxjs-observables`)
 *
 * Three gaps a prior sweep found and this rewrite closes:
 *
 * - **The `async` pipe was recommended four times and demonstrated zero.** It
 *   now has its own section with a live double-subscription trap (two
 *   `| async` bindings on one cold source firing two independent runs) and the
 *   `@if (…; as x)` fix, proved rather than asserted.
 * - **No Observable↔Promise bridge.** `firstValueFrom`/`lastValueFrom` get an
 *   annotated `app-code-lab` covering the three real traps: `EmptyError` on a
 *   source with nothing to give, and each function hanging forever on a source
 *   that never emits or never completes.
 * - **`shareReplay`'s `refCount` leak was named as a pitfall with no fix shown
 *   and no demo.** It now has a live bench: the same `interval`, two
 *   `shareReplay` configurations, and a tick counter that keeps climbing on
 *   the leaky one after "Unsubscribe" — capped at 50 ticks so the demo itself
 *   cannot actually leak in a reader's tab.
 *
 * @see intermediate/rxjs-operators — transforming what comes out.
 * @see intermediate/rxjs-subjects — observables you can push into.
 * @see intermediate/rxjs-interop — `toSignal`, the modern alternative to
 *   consuming a stream with `| async` at all.
 */
@Component({
  selector: 'app-lesson-rxjs-observables',
  imports: [
    RouterLink,
    AsyncPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './rxjs-observables.html',
  styleUrl: './rxjs-observables.css',
})
export class RxjsObservables implements OnDestroy {
  // ── Bench 1: subscribe / unsubscribe ───────────────────────────────────────

  /** The latest value from the interval demo. */
  protected readonly value = signal<number | string>('—');
  /** Whether the interval demo is running. */
  protected readonly running = signal(false);
  /**
   * The interval demo's subscription — the handle {@link stop} needs, and
   * without which the timer would keep running after the component is gone.
   */
  private sub?: Subscription;

  /** Starts the interval demo, ignoring a second click while it is already running. */
  protected start(): void {
    if (this.running()) return;
    const counter$: Observable<number> = interval(500).pipe(take(1000));
    this.sub = counter$.subscribe((v) => this.value.set(v));
    this.running.set(true);
  }

  /** Unsubscribes, stopping the interval. */
  protected stop(): void {
    this.sub?.unsubscribe();
    this.running.set(false);
  }

  // ── Bench 2: cold vs hot ────────────────────────────────────────────────────

  /** Whether the cold/hot demo is using the shared source. */
  protected readonly shared = signal(false);
  /** The execution id subscriber A received. */
  protected readonly execA = signal('—');
  /** The execution id subscriber B received. Equal to A's only when sharing. */
  protected readonly execB = signal('—');
  /** A cold source: each subscription runs the producer function again and gets its own id. */
  private coldSource$ = this.buildSource();
  /**
   * The same source through `shareReplay(1)`: one execution, multicast to
   * every subscriber, with the last value replayed to late joiners.
   */
  private sharedSource$ = this.coldSource$.pipe(shareReplay(1));

  /**
   * Builds a source that stamps each execution with a random id.
   *
   * The id is generated **inside** the subscribe function, which is what makes
   * the demo work: it is created per execution, not per observable, so two ids
   * mean two executions.
   */
  private buildSource(): Observable<string> {
    return new Observable<string>((subscriber) => {
      const id = Math.random().toString(36).slice(2, 7);
      subscriber.next(id);
      subscriber.complete();
    });
  }

  /** Switches between the cold and shared sources. */
  protected toggleShared(): void {
    this.shared.set(!this.shared());
  }

  /** Subscribes as A. */
  protected subscribeA(): void {
    (this.shared() ? this.sharedSource$ : this.coldSource$).subscribe((id) => this.execA.set(id));
  }

  /** Subscribes as B. Run it after A and compare the ids. */
  protected subscribeB(): void {
    (this.shared() ? this.sharedSource$ : this.coldSource$).subscribe((id) => this.execB.set(id));
  }

  /** Clears both results so the demo can be re-run. */
  protected resetDemo(): void {
    this.execA.set('—');
    this.execB.set('—');
    this.coldSource$ = this.buildSource();
    this.sharedSource$ = this.coldSource$.pipe(shareReplay(1));
  }

  // ── Bench 3: the async pipe's double subscription ──────────────────────────

  /**
   * A fresh cold source for the `| async` demo. Deliberately its own field
   * rather than reusing {@link coldSource$} above — resetting this demo should
   * not disturb the manual subscribe-A/B one.
   */
  protected asyncDemoSource$ = this.buildSource();

  /** Rebuilds {@link asyncDemoSource$} so the reader can run the async-pipe demo again. */
  protected resetAsyncDemo(): void {
    this.asyncDemoSource$ = this.buildSource();
  }

  // ── Bench 4: shareReplay's refCount ─────────────────────────────────────────

  /** Real ticks the leaky bench's producer has ever emitted — proves it keeps running unwatched. */
  protected readonly leakyTicks = signal(0);
  /** Real ticks the guarded bench's producer has emitted. */
  protected readonly guardedTicks = signal(0);
  /** Whether the UI currently holds a subscription to the leaky bench. */
  protected readonly leakySubscribed = signal(false);
  /** Whether the UI currently holds a subscription to the guarded bench. */
  protected readonly guardedSubscribed = signal(false);

  private leakySub?: Subscription;
  private guardedSub?: Subscription;

  /**
   * `shareReplay(1)` — the short form. `refCount` defaults to `false`, so once
   * the first subscriber arrives the source is never torn down again, no
   * matter how many subscribers later leave. `take(50)` caps it so this demo
   * cannot actually run forever in a reader's tab; the underlying claim has no
   * such cap.
   */
  private readonly leaky$ = interval(400).pipe(
    take(50),
    tap(() => this.leakyTicks.update((n) => n + 1)),
    shareReplay(1),
  );

  /**
   * The same shape with `refCount: true`: when the subscriber count drops to
   * zero, the source subscription is genuinely torn down.
   */
  private readonly guarded$ = interval(400).pipe(
    take(50),
    tap(() => this.guardedTicks.update((n) => n + 1)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Subscribes or unsubscribes the leaky bench's UI-side listener. */
  protected toggleLeaky(): void {
    if (this.leakySubscribed()) {
      this.leakySub?.unsubscribe();
      this.leakySubscribed.set(false);
    } else {
      this.leakySub = this.leaky$.subscribe();
      this.leakySubscribed.set(true);
    }
  }

  /** Subscribes or unsubscribes the guarded bench's UI-side listener. */
  protected toggleGuarded(): void {
    if (this.guardedSubscribed()) {
      this.guardedSub?.unsubscribe();
      this.guardedSubscribed.set(false);
    } else {
      this.guardedSub = this.guarded$.subscribe();
      this.guardedSubscribed.set(true);
    }
  }

  /**
   * Stops every live subscription this lesson holds. The interval demo is the
   * leak this whole page warns about, handled; the `shareReplay` benches are
   * capped by `take(50)` regardless, but there is no reason to leave even a
   * bounded timer running once the reader has navigated away.
   */
  ngOnDestroy(): void {
    this.stop();
    this.leakySub?.unsubscribe();
    this.guardedSub?.unsubscribe();
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The RxJS track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Observables' },
    { label: 'Operators', id: 'rxjs-operators' },
    { label: 'Subjects', id: 'rxjs-subjects' },
    { label: 'RxJS + Signals', id: 'rxjs-interop' },
  ];

  /**
   * The Observer contract, staged as a negotiation between the code that
   * subscribes and the producer that was handed the guarded `subscriber`.
   *
   * Prose describing "next fires many times, error and complete are terminal
   * and mutually exclusive" makes a reader hold three rules in their head at
   * once. Staged as a conversation, each rule is the answer to the question
   * that naturally follows the one before it.
   */
  protected readonly contractTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: "I'll hand you an object with `next`, `error` and `complete`. Call whichever fits.",
    },
    {
      who: 'The producer',
      says: "Understood. I'll call `next` as many times as I like — zero, one, or thousands.",
    },
    { who: 'You', says: 'And if something goes wrong partway through?' },
    {
      who: 'The producer',
      says: "I call `error()` — once — and after that I'm finished. I will never call anything again.",
    },
    { who: 'You', says: 'What if you finish normally instead?' },
    {
      who: 'The producer',
      says: '`complete()` — also once, also final. `error` and `complete` are mutually exclusive: at most one of them ever fires, for the whole life of the subscription.',
    },
  ];

  /** The literal syntax behind the {@link contractTalk} dialogue. */
  protected readonly observerContractSample = `const sub = source$.subscribe({
  next: (v) => console.log('got a value:', v), // fires 0..many times
  error: (e) => console.error('failed:', e), // fires at most once, then done
  complete: () => console.log('no more values'), // fires at most once, then done
});

sub.unsubscribe(); // stop early — you simply stop receiving values`;

  /** Line-by-line walkthrough of {@link observerContractSample}. */
  protected readonly observerContractNotes: CodeNote[] = [
    {
      line: 1,
      text: "`subscribe()` takes an **Observer**: an object with up to three optional callbacks. `sub` is the `Subscription` it returns — the handle you need to stop early. `source$`'s trailing **`$`** is a naming convention, not a language rule — RxJS code marks anything that holds a stream this way, so you can spot one at a glance.",
    },
    {
      line: 2,
      text: '`next` is the one you write almost every time. `(v) => …` is an arrow function; `v` is whatever type this observable carries.',
    },
    {
      line: 3,
      text: '`error` receives whatever the producer passed to its own `error()` call — conventionally an `Error`, but RxJS does not enforce that at the type level.',
    },
    {
      line: 4,
      text: '`complete` takes **no arguments**. There is no "final value" to hand over — only the fact that nothing more is coming.',
    },
    {
      line: 7,
      text: "`.unsubscribe()` on the returned `Subscription` runs the producer's teardown immediately, even if it never called `complete()` on its own.",
    },
  ];

  /**
   * Sample: building an Observable by hand — the producer function, `next`,
   * `complete`, and the teardown slot.
   */
  protected readonly constructSample = `const obs$ = new Observable<number>((subscriber) => {
  // Runs once per subscribe() call — not now, not when this line was written.
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete(); // any next() after this point is silently ignored

  return () => console.log('teardown: cleaning up'); // runs on complete/error/unsubscribe
});

// Nothing above has executed yet. obs$ is just a recipe sitting in a variable.
obs$.subscribe((v) => console.log(v)); // NOW the function body runs: 1, 2, 3, then done`;

  /** Line-by-line walkthrough of {@link constructSample}. */
  protected readonly constructNotes: CodeNote[] = [
    {
      line: 1,
      text: '`new Observable<number>(fn)` stores `fn` — the **producer** — and does nothing else yet. `<number>` is a **generic parameter**: every value pushed through `next()` must be a number. `subscriber` is the guarded object `fn` receives each time somebody subscribes.',
    },
    {
      line: 3,
      text: '`subscriber.next(1)` pushes one value downstream to whoever is listening. Call it as many times as you like — synchronously here, but it could just as well be inside a `setTimeout` or a WebSocket handler.',
    },
    {
      line: 6,
      text: '`complete()` ends the stream **permanently** for this subscriber. Code written after this line still runs as ordinary JavaScript, but the guarded `subscriber` silently drops whatever it sends — see the Subscriber card below.',
    },
    {
      line: 8,
      text: 'The **teardown**: an optional function returned from the producer, run on `complete()`, `error()`, or `unsubscribe()` — whichever happens first. Clear a timer, close a socket, remove a listener here. Skipping it is how RxJS subscriptions leak.',
    },
    {
      line: 12,
      text: 'The only line that actually **runs** anything. `subscribe()` calls `fn` with a fresh `subscriber`, which is why the producer runs again, from the top, for every single subscriber — the property that makes this observable **cold**.',
    },
  ];

  /** The Observable lifecycle, as a one-way sequence. */
  protected readonly lifecycle: FlowStep[] = [
    { label: 'new Observable(fn)', detail: 'The recipe is stored. `fn` has not run yet.' },
    {
      label: 'subscribe()',
      detail: '`fn` runs now, handed a fresh, guarded subscriber.',
      tone: 'accent',
    },
    {
      label: 'next(v) — 0, 1, or many times',
      detail: 'Each call reaches your `next` callback, in order.',
    },
    {
      label: 'complete() or error()',
      detail: 'Terminal. At most once, and only one of the two, ever.',
      tone: 'warn',
    },
    {
      label: 'teardown runs',
      detail: 'The returned function — or an early unsubscribe() — closes whatever fn opened.',
      tone: 'good',
    },
  ];

  /** Short illustration: pipe() wraps, never mutates. */
  protected readonly wrapSample = `const doubled$ = source$.pipe(map((x) => x * 2)); // a brand-new Observable
source$.subscribe((x) => console.log('raw:', x)); // completely unaffected — still emits raw values`;

  /** The pipe()-wrapping prediction. */
  protected readonly wrapPrompt =
    'Two lines above: `doubled$` is built from `source$.pipe(map(x => x * 2))`. If some other, unrelated code subscribes to `source$` directly, does it see doubled values or raw ones?';
  /** The pipe()-wrapping answer. */
  protected readonly wrapAnswer =
    'Raw ones. **`pipe()` never mutates `source$`.** It returns a brand-new Observable (`doubled$`) whose producer subscribes to `source$` internally and forwards a transformed value onward. `source$` has no idea `doubled$` exists, and every other subscriber to `source$` keeps seeing the untouched values.';

  /**
   * Self-test 1 — cold duplication in a realistic, service-shaped scenario.
   *
   * The distractors are the three stories people tell themselves about why two
   * subscribers "should" share one request — the same three the reference
   * `rxjs-subjects` lesson's cold quiz targets, restated for a first
   * encounter with the idea.
   */
  protected readonly coldQuiz: QuizOption[] = [
    {
      text: "One — they're calling the exact same method, so the request only fires once.",
      why: 'Calling the same **method** does not mean sharing one execution. `getUsers()` almost certainly returns `this.http.get(...)` fresh on every call — and even a single shared Observable object still re-runs its producer per subscription. Sharing the code is not sharing the run.',
    },
    {
      text: 'Two — each `subscribe()` reruns the producer from scratch.',
      correct: true,
      why: 'Exactly. `http.get()` is cold: the request genuinely goes out again for every subscription. To share one request between both components, pipe the source through `shareReplay(1)` in the service and hand out that shared Observable — that is the section coming up.',
    },
    {
      text: 'Zero, until a template actually reads the value.',
      why: 'That confuses laziness with subscription. Calling `getUsers()` builds an Observable and runs nothing — true. But the moment either component actually calls `.subscribe()` — directly, or via `| async` — the request fires. Two subscribes, two fires.',
    },
    {
      text: 'It depends on whether the components use `OnPush`.',
      why: "Change-detection strategy decides whether a **view** gets checked; it has no say over how many times an Observable's producer runs. That's a different axis entirely — see the Change Detection lesson for the one CD actually governs.",
    },
  ];

  /**
   * Self-test 2 — the async pipe's double subscription, the coverage-sweep
   * finding this rewrite was built to close.
   */
  protected readonly asyncQuiz: QuizOption[] = [
    {
      text: 'One — Angular reuses the subscription for identical expressions.',
      why: 'It does not de-duplicate across separate `| async` usages, even against the exact same expression. Each `| async` in the template gets its **own** `AsyncPipe` instance, and each instance subscribes independently the moment it is created.',
    },
    {
      text: 'Two — each `| async` creates its own subscription.',
      correct: true,
      why: 'Exactly what the demo above shows: two different ids from one cold source. For a real `http.get()`, that is two identical network requests for the same data. Fix it with `@if (user$ | async; as user)` to bind once, or `shareReplay(1)` on the source so a second subscription joins the first run instead of starting a new one.',
    },
    {
      text: 'Zero, until change detection runs a second time.',
      why: 'Subscribing happens when the `AsyncPipe` is created, during the **first** pass that reaches it — not on some later one. There is no delay to wait out.',
    },
    {
      text: 'It depends on whether the component uses `OnPush`.',
      why: 'Strategy decides whether the **view** gets checked again later; it has nothing to do with how many `AsyncPipe` instances the template creates in the first place. Two `| async` bindings are two instances under either strategy.',
    },
  ];

  /**
   * Sample: the two `shareReplay` signatures, side by side.
   */
  protected readonly shareReplaySample = `private cached$ = this.http.get<Config>('/api/config').pipe(
  shareReplay(1), // ⚠ keeps the source subscribed forever — even at zero listeners
);

private live$ = interval(1000).pipe(
  shareReplay({ bufferSize: 1, refCount: true }), // tears down at zero listeners, restarts on the next
);`;

  /** Line-by-line walkthrough of {@link shareReplaySample}. */
  protected readonly shareReplayNotes: CodeNote[] = [
    {
      line: 1,
      text: '`this.http.get(...)` is a **cold** Observable: every `.subscribe()` on it — without `shareReplay` — fires a brand-new HTTP request.',
    },
    {
      line: 2,
      text: "`shareReplay(1)` — the short form — defaults to `refCount: false`. Once **anyone** has subscribed, the source subscription is kept alive forever, replaying its last value to every future subscriber, even after every current one has left. Right for a config request you want cached for the app's lifetime; a leak for anything ongoing.",
    },
    {
      line: 6,
      text: 'The object form adds `refCount: true`: when the subscriber count drops to zero, the source subscription is torn down — for `interval`, the timer actually stops — and a fresh subscriber re-runs the source from scratch. Use this for anything live; use the short form only for a value you deliberately want to keep forever.',
    },
  ];

  /**
   * Sample: bridging to `await` for the case where you genuinely want one
   * value and nothing more.
   */
  protected readonly promiseSample = `const user = await firstValueFrom(this.http.get<User>('/api/me'));
// resolves with the FIRST value, then unsubscribes — perfect for a single HTTP response

const finalTotal = await lastValueFrom(prices$);
// waits for the source to COMPLETE, then resolves with the LAST value it emitted

await firstValueFrom(EMPTY); // rejects immediately with EmptyError — nothing was ever emitted
await firstValueFrom(someSubject$); // hangs forever if someSubject$ never emits and never completes`;

  /** Line-by-line walkthrough of {@link promiseSample}. */
  protected readonly promiseNotes: CodeNote[] = [
    {
      line: 1,
      text: '`firstValueFrom` subscribes, takes the **first** emission, calls `unsubscribe()` for you, and resolves the promise — one `await` instead of a whole subscribe/unsubscribe dance. Errors from the source **reject** the promise, so plain `try`/`catch` works here — unlike `subscribe()`, which needs a separate `error` callback.',
    },
    {
      line: 4,
      text: '`lastValueFrom` does not resolve on the first value — it keeps the subscription open until the source **completes**, then hands back whichever value arrived last. On a stream that never completes, this line never resolves.',
    },
    {
      line: 7,
      text: '`EMPTY` completes **immediately without emitting anything**. `firstValueFrom` has no value to give you, so — unless you pass `{ defaultValue: … }` as a second argument — the promise **rejects with `EmptyError`** instead of hanging.',
    },
    {
      line: 8,
      text: 'A `Subject` nobody ever pushes to, or any other source that neither emits nor completes, leaves this `await` suspended **forever** — no error, no timeout, nothing in the console. This is the trap that catches people converting an event stream to a promise.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is `| async` really doing anything more than a manual `subscribe()`?',
      a: "Two things a manual subscribe leaves to you: it calls `markForCheck()` on this view for every emission, which is exactly why it renders correctly under `OnPush` and under this app's zoneless setup with no extra work from you; and it unsubscribes automatically when the binding is destroyed, so there is nothing to remember in `ngOnDestroy`. `intermediate/custom-pipes` builds a small working reimplementation if you want to see the shape.",
    },
    {
      q: 'Does unsubscribing actually cancel an in-flight HTTP request?',
      a: 'For `HttpClient`, yes — unsubscribing aborts the underlying request. For a source built from a `Promise`, no: a Promise cannot be cancelled once created, so unsubscribing just stops you hearing about a result that is still on its way and will still complete somewhere.',
    },
    {
      q: 'If a source never completes, does forgetting to unsubscribe always leak?',
      a: 'Only while something keeps it alive. A source that `complete()`s or errors tears its own subscription down — nothing to leak. An infinite one (`interval`, `fromEvent`, a live WebSocket) does not, so a component that subscribes to one and is later destroyed leaves a callback holding a reference to a component that no longer exists.',
    },
    {
      q: 'Why does `shareReplay(1)` keep running even with nobody listening?',
      a: 'Because its default, `refCount: false`, was designed for exactly that: a value you want cached for good once anyone has asked for it, like an app config fetched once at startup. It becomes a leak only when you reach for it out of habit on something ongoing. Pass `{ bufferSize: 1, refCount: true }` and it tears itself down the moment the last subscriber leaves — see the bench above.',
    },
    {
      q: 'Should I just `await firstValueFrom(...)` everything instead of `subscribe()`?',
      a: 'Only for the case it is built for: a source that produces exactly the one value you want, right now. It cannot express "give me every value as it arrives" — an infinite stream awaited with `lastValueFrom` simply never resolves. For a value you want to keep reading over time, `intermediate/rxjs-interop`\'s `toSignal()` is the better modern answer.',
    },
  ];
}
