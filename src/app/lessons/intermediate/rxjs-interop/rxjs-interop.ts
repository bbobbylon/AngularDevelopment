import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, map } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Signals ↔ RxJS Interop — converting at the boundary.
 *
 * Signals and observables are not competing answers to one question. A signal is
 * synchronous state with a value you can always read; an observable is a stream
 * of things that happen over time, with operators for debouncing, retrying and
 * cancelling. `@angular/core/rxjs-interop` supplies the two bridges —
 * `toSignal` and `toObservable` — so each can be used where it fits.
 *
 * ## Presentation
 *
 * Brain-friendly layer (`shared/brain/`, see `expert/change-detection` for the
 * reference), opening on the **argument** shape (`shape: 'argument'` in
 * `curriculum.ts`; the sequence is `docs/CONTRIBUTING.md` §2C). The teaching
 * order:
 *
 * 1. **The argument.** Deck → a giant quote from one of the parties → the scene
 *    → six turns between the HTTP Observable, `toSignal` and the template over a
 *    `TypeError` on first render, every line true → a Brain Power ("three
 *    parties, zero mistakes — so who caused it?") → four turns of "not me", the
 *    last of them *you*, delivering the verdict → the principle in one ruled
 *    paragraph → a whiteboard timeline of the 200 ms gap → one quiz → the
 *    whiteboard-and-ticker-tape analogy as a napkin. No code, no cards, no
 *    Remember before the quiz: the mechanism is carried by the dialogue, and
 *    the reader has to adjudicate it before they are shown any source.
 * 2. **Mechanism next, for both directions.** Simplified (not real-internals)
 *    implementations of `toSignal` and `toObservable`, annotated line by line,
 *    the `requireSync` / errors-on-read / injection-context vocabulary as
 *    tape cards, and a hand-drawn bridge diagram showing the two one-way
 *    crossings. The second direction opens on its own complaint — a signal has
 *    no `debounce()` — so the outbound bridge is motivated, not announced.
 * 3. **Then the same idea in four modes**: prose, the `roundTrip` flow diagram,
 *    an annotated real snippet, and a live debounced-search demo — because the
 *    retention bar is redundancy across modes, not repetition in one.
 * 4. **Every snippet is annotated** via `app-code-lab`, or walked through in a
 *    `app-predict` / `app-compare` where a full annotation would be overkill.
 *
 * @see intermediate/rxjs-operators — the operators worth crossing the bridge for.
 * @see intermediate/rxjs-subjects — the other stream-that-holds-state option, and
 *   why most of what it used to do is now a signal's job instead.
 */
@Component({
  selector: 'app-lesson-rxjs-interop',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    BrainPower,
    Scribble,
    Whiteboard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
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

    // Demonstrate that toObservable reports only the value a signal settles
    // on, never every value it passed through — see fireBurst() above.
    toObservable(this.burstCounter)
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.emissionsLog.update((log) => [...log, v]));
  }

  /**
   * Updates the query.
   *
   * @param v The input's text.
   */
  protected setQuery(v: string): void {
    this.query.set(v);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The RxJS track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Observables', id: 'rxjs-observables' },
    { label: 'Operators', id: 'rxjs-operators' },
    { label: 'Subjects', id: 'rxjs-subjects' },
    { label: 'RxJS + Signals' },
  ];

  /**
   * Round one of the argument: the three parties to a `TypeError` on first
   * render, each speaking from what it actually does and nothing more.
   *
   * The Observable only knows subscribe / emit / complete, and emits when the
   * server answers. `toSignal` knows it subscribed the instant it was called
   * and writes each value into a signal. The template knows it reads a signal
   * synchronously, mid-render, and gets whatever is in it. Every line is true,
   * which is the point: the reader has to find the fault *between* the parties
   * — the unpaid gap at the boundary — because it is not inside any of them.
   */
  protected readonly roundOne: BubbleTurn[] = [
    {
      who: 'Template',
      says: 'First render. I read `users().length` — the way you read any signal: call it, get a value, no subscribing. I got `undefined`, and `.length` of `undefined` is a `TypeError`. Somebody explain.',
    },
    {
      who: 'Observable',
      says: "I'm `GET /api/users`. I emit exactly once, when the server answers — about 200 milliseconds after someone subscribes. I have never promised anything sooner, to anyone.",
    },
    {
      who: 'toSignal',
      says: 'Someone did subscribe: me, the instant I was called, in the field initializer. Every value that arrives, I write into a signal with `.set()`. Nothing has arrived yet.',
    },
    {
      who: 'Template',
      says: 'So the signal was empty?',
    },
    {
      who: 'toSignal',
      says: "A signal is never empty — that's the whole point of me. It held what I was seeded with, and I was seeded with nothing in particular. `undefined` is a value.",
    },
    {
      who: 'Observable',
      says: 'Two hundred milliseconds later I delivered a perfectly good array. It landed on a page that had already thrown.',
    },
  ];

  /**
   * Round two, after the Brain Power: everyone says "not me", and each of them
   * is right. The last speaker is the reader, and their line is the actual
   * explanation — the value crossed from a world where "nothing yet" is normal
   * into one where "always something" is the contract, and nobody said what to
   * hold in the meantime. `initialValue` is that sentence as an argument.
   */
  protected readonly roundTwo: BubbleTurn[] = [
    {
      who: 'Observable',
      says: "Not me. I emit when the server answers. I have never once claimed to know what the screen should show in the meantime — that isn't a question a stream can answer.",
    },
    {
      who: 'toSignal',
      says: 'Not me. I always have a value — you just never told me what it was. So the value was `undefined`, and I stand by it.',
    },
    {
      who: 'Template',
      says: 'Not me. I read a signal the only way a signal can be read: synchronously, mid-render. Whatever is in it is what I get, and nobody had put a list in it.',
    },
    {
      who: 'You',
      says: "Then it's me. I carried a value across the bridge from a world where **nothing yet** is normal into one where **always something** is the contract — and I never said what to put on the board while we waited. `toSignal(users$, { initialValue: [] })`: one argument, and the first render reads an empty list instead of `undefined`. None of you had a bug. The gap was at the boundary, and the boundary is mine.",
    },
  ];

  /** Choices for the "what does the first render produce" check that closes the argument. */
  protected readonly gapOptions: QuizOption[] = [
    {
      text: '`Signal<User[]>`, and an empty list — `toSignal` holds the first render until a value has arrived',
      why: 'Nothing holds anything. `toSignal` returns at once, the first render happens at once, and a signal is read with whatever it contains at that instant. There is no "wait for a value" in the signals world — which is exactly why the gap exists.',
    },
    {
      text: '`Signal<User[] | undefined>`, and a `TypeError` from `.length` — unless `strictTemplates` flags it first',
      correct: true,
      why: 'With no `initialValue` and no `requireSync`, the type honestly includes `undefined`, and the value genuinely is `undefined` until the first emission lands at 200 ms. `.length` of `undefined` throws — or, with `strictTemplates` on, the template fails to compile, which is the cheaper way to find out.',
    },
    {
      text: '`Signal<User[]>`, and nothing at all for 200 ms — then the list appears once the response lands',
      why: 'Right about the ending, wrong about everything before it. The type includes `undefined`, and the first render is neither skipped nor delayed: it runs immediately, reads the signal, and gets `undefined`. Angular has no notion of "hold the render until this signal has a value".',
    },
    {
      text: 'Nothing renders — it throws at creation, because `toSignal` requires `initialValue` or `requireSync`',
      why: 'Neither is required; leave both out and you simply get the `| undefined` type. The one thing that does throw at creation is `requireSync: true` on a source that turns out **not** to emit synchronously — the opposite situation.',
    },
  ];

  /**
   * Sample: a simplified stand-in for `toSignal`, the plumbing removed.
   *
   * Not the real internals (the real one tracks the error separately and
   * re-throws it lazily on read, and resolves the injection context more
   * carefully) — but every surprising behaviour on this page falls out of these
   * twelve lines: why `initialValue` exists, why errors surface on read rather
   * than on arrival, and why the call has to happen somewhere Angular can find a
   * `DestroyRef`.
   */
  protected readonly toSignalSample = `function toSignal<T>(source$: Observable<T>, opts?: { initialValue?: T }): Signal<T> {
  const state = signal(opts?.initialValue as T);        // seeded before anything has arrived

  const sub = source$.subscribe({
    next: (value) => state.set(value),                   // each emission simply overwrites the signal
    error: (err) => { throw err; },                       // simplified — really stored, re-thrown on the next read
  });

  inject(DestroyRef).onDestroy(() => sub.unsubscribe());  // legal only because this runs in an injection context

  return state;
}`;

  /** Line-by-line walkthrough of {@link toSignalSample}. */
  protected readonly toSignalNotes: CodeNote[] = [
    {
      line: 1,
      text: '`<T>` is a generic parameter — whatever type the Observable carries becomes the type the returned `Signal<T>` carries. `opts?.initialValue` is optional, which is exactly why the resulting type can end up `T | undefined` if you omit it.',
    },
    {
      line: 2,
      text: 'The signal exists **before the first emission**, seeded with whatever `initialValue` was passed (or nothing, if it was not). This is the entire reason `toSignal(obs$).length` can crash: with no seed, the value genuinely is `undefined` until line 5 runs for the first time.',
    },
    {
      line: 4,
      text: '`subscribe` happens exactly once, right here, when `toSignal` is called — not lazily, not per template read. That single subscription is what every future `state()` call is reading from.',
    },
    {
      line: 5,
      text: 'Every value that arrives just overwrites the signal with `.set()`. No merging, no history — the signal only ever knows the **latest** thing the Observable said.',
    },
    {
      line: 6,
      text: 'Simplified almost to the point of being wrong: the real implementation stores the error and only re-throws it the next time something **reads** the signal, which is why the stack trace points at your template instead of at the failing HTTP call.',
    },
    {
      line: 9,
      text: '`inject()` may only run inside an **injection context** — a field initializer or a constructor. That is the whole reason a lifecycle hook like `ngOnInit` cannot call `toSignal` directly: by the time it runs, that context is gone.',
    },
    {
      line: 11,
      text: 'What comes back is an ordinary signal. Callers never see the subscription, the seeding or the teardown — they just call `state()`, exactly like any other signal in the component.',
    },
  ];

  /**
   * Sample: a simplified stand-in for `toObservable`, the other direction.
   *
   * The real implementation is more careful about scheduling and about signal
   * writes inside the effect, but the shape is this: subscribing creates an
   * `effect`, and an effect reruns whenever a signal it reads changes — which is
   * the entire mechanism, and the reason the *current* value is always the
   * first thing a new subscriber receives.
   */
  protected readonly toObservableSample = `function toObservable<T>(source: Signal<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const watcher = effect(() => {                // reruns every time source() changes
      subscriber.next(source());                    // pushes the CURRENT value — including on the very first run
    });

    return () => watcher.destroy();                 // torn down the moment the subscriber unsubscribes
  });
}`;

  /** Line-by-line walkthrough of {@link toObservableSample}. */
  protected readonly toObservableNotes: CodeNote[] = [
    {
      line: 1,
      text: "Takes a `Signal<T>` and hands back an `Observable<T>` — the mirror image of `toSignal`'s signature.",
    },
    {
      line: 2,
      text: "`new Observable(...)` takes a function that runs **once per subscriber**. Everything inside it is that subscriber's own private setup — which is why two subscribers to the same `toObservable(sig)` each get their own `effect`.",
    },
    {
      line: 3,
      text: 'An `effect()` re-runs whenever a signal it reads changes. Reading `source()` inside it is what makes this effect a **consumer** of the signal, in exactly the sense a template binding is.',
    },
    {
      line: 4,
      text: "This line runs **immediately**, on creation, before any change has happened — because an effect always runs once up front. That single fact is why a brand-new subscriber is handed the signal's current value straight away, with no gap.",
    },
    {
      line: 7,
      text: 'The function returned from the subscribe callback is the teardown. Destroying the effect here is what stops the bridge from doing any more work once nobody is listening.',
    },
  ];

  /**
   * A signal driving the "dropped writes" live demo: three synchronous
   * `.set()` calls, and a `toObservable`-backed subscriber watching them.
   */
  protected readonly burstCounter = signal(0);

  /** What the demo button is *about* to write, shown before it fires. */
  protected readonly writesLog = signal<number[]>([]);

  /** What the `toObservable(burstCounter)` subscriber actually received. */
  protected readonly emissionsLog = signal<number[]>([]);

  /**
   * Fires three synchronous writes to {@link burstCounter}. Because
   * `toObservable` is an `effect()` underneath, and an effect only gets a
   * turn once the current synchronous block finishes, the subscriber below
   * never sees 1 or 2 — only the value the signal has settled on by the time
   * the effect actually runs.
   */
  protected fireBurst(): void {
    this.writesLog.set([1, 2, 3]);
    this.emissionsLog.set([]);
    this.burstCounter.set(1);
    this.burstCounter.set(2);
    this.burstCounter.set(3);
  }

  /**
   * Sample: why `toObservable` is not a drop-in replacement for a `Subject` —
   * it reports the value a signal *settles on*, never the values it passed
   * through on the way there.
   */
  protected readonly dropsIntermediateSample = `const count = signal(0);
const count$ = toObservable(count);
count$.subscribe((v) => console.log('emitted:', v));

count.set(1);   // no log yet — a write does not emit anything by itself
count.set(2);   // still no log — this overwrites the pending value
count.set(3);   // still no log

// ...only once this synchronous block finishes, and the underlying
// effect() gets its turn to run, does the subscriber hear anything:
// emitted: 3
// — never "emitted: 1" or "emitted: 2". Both were overwritten before the
//   effect ran even once.`;

  /** Line-by-line walkthrough of {@link dropsIntermediateSample}. */
  protected readonly dropsIntermediateNotes: CodeNote[] = [
    {
      line: 3,
      text: "`subscribe` starts the effect from the `toObservable` implementation above — it runs once immediately (emitting the signal's current value, `0`), then again every time the effect reruns.",
    },
    {
      line: 5,
      text: 'A `.set()` call updates the signal and marks its consumers dirty. It does **not** synchronously run the effect — that is scheduled for later, not inlined into this call.',
    },
    {
      line: 6,
      text: 'This second write happens before the effect from line 5 has had a chance to run, so it simply replaces the pending value. Nothing observed `1` at all.',
    },
    {
      line: 10,
      text: "The effect finally runs once execution yields — and by then `count()` reads `3`. An effect reports the signal's **current** value at the moment it runs, never a history of values it missed along the way.",
    },
  ];

  /**
   * The round trip the demo below performs, station by station. Worth laying out
   * because the useful insight is that both *ends* are signals — RxJS is visited
   * for the middle three steps and then left behind.
   */
  protected readonly roundTrip: FlowStep[] = [
    { label: '`query` signal', detail: 'Set on every keystroke — synchronous state' },
    {
      label: '`toObservable()`',
      detail: 'Crossing into stream-land, where operators live',
      tone: 'accent',
    },
    { label: '`debounceTime(500)`', detail: 'Swallow everything until the typing stops' },
    { label: '`switchMap()`', detail: 'In a real search: fire the request, cancel any in flight' },
    {
      label: '`toSignal()`',
      detail: 'Back to a value the template can just read',
      tone: 'good',
    },
    { label: 'Template', detail: 'No `async` pipe, no subscription to remember' },
  ];

  /**
   * Sample: the real fields behind the round-trip demo below, in one place and
   * annotated — the same two declarations, read top to bottom instead of found
   * by scrolling the class.
   */
  protected readonly roundTripSample = `protected readonly query = signal('');

protected readonly debounced = toSignal(
  toObservable(this.query).pipe(debounceTime(500)),   // out to RxJS, wait for 500ms of silence
  { initialValue: '' },                                // what debounced() reads before the first pause happens
);`;

  /** Line-by-line walkthrough of {@link roundTripSample}. */
  protected readonly roundTripNotes: CodeNote[] = [
    {
      line: 1,
      text: '`query` is the instant, unfiltered state — it changes on every single keystroke, and the template below reads it directly.',
    },
    {
      line: 3,
      text: '`debounced` is a second signal, built entirely out of the first one. Nothing here is a fresh source of truth; it is `query`, sent on a round trip.',
    },
    {
      line: 4,
      text: '`toObservable(this.query)` is the outbound crossing; `.pipe(debounceTime(500))` is the one thing signals cannot do on their own — wait for 500ms of silence before letting a value through.',
    },
    {
      line: 5,
      text: "`initialValue: ''` matters here specifically because `debounceTime` **delays** the very first value too — without it, `debounced()` would read `undefined` for the first 500ms of the component's life.",
    },
  ];

  /**
   * Sample behind the errors-on-read Predict: the gap from the argument is
   * covered, and the failure still surfaces somewhere surprising.
   */
  protected readonly errorOnReadSample = `readonly users = toSignal(
  this.http.get<User[]>('/api/users'),   // this time the server answers 500
  { initialValue: [] },                  // the gap is covered — the first render shows an empty list
);

// template, on the next change-detection pass after the failure:
//   @for (user of users(); track user.id) { … }

// Where does the 500 show up?`;

  /**
   * Sample: the real ticker demo, field and constructor together — annotated so
   * the two halves of "consume a stream, then re-expose the result" read as one
   * story instead of two separate class members.
   */
  protected readonly tickerSample = `protected readonly tick = toSignal(
  interval(1000).pipe(map((n) => n + 1)),   // 0, 1, 2… once a second, straight off the interval
  { initialValue: 0 },
);

protected readonly tickTimesTen = signal(0);

constructor() {
  const tick$ = toObservable(this.tick);           // the signal, crossed back into RxJS
  tick$
    .pipe(takeUntilDestroyed())                     // ends the subscription when this component is destroyed
    .subscribe((v) => this.tickTimesTen.set(v * 10));
}`;

  /** Line-by-line walkthrough of {@link tickerSample}. */
  protected readonly tickerNotes: CodeNote[] = [
    {
      line: 1,
      text: '`toSignal` is called in a **field initializer** — an injection context — which is why it is legal here with no extra ceremony.',
    },
    {
      line: 2,
      text: "`interval(1000)` never completes on its own; `.pipe(map(...))` just reshapes each tick before it reaches the signal. Neither line needs its own teardown code — that is `toSignal`'s job.",
    },
    {
      line: 3,
      text: '`{ initialValue: 0 }` is what `tick()` reads before the first second has passed. Omit it and the type becomes `number | undefined` for that first tick.',
    },
    {
      line: 6,
      text: 'A second signal, set from RxJS in the constructor instead of a `computed` — deliberately, so the round trip through `toObservable` is visible rather than hidden behind a one-line `computed(() => tick() * 10)`.',
    },
    {
      line: 9,
      text: "`toObservable(this.tick)` sends the signal back out into RxJS. It immediately emits the signal's **current** value to this new subscriber, then every value after.",
    },
    {
      line: 11,
      text: '`takeUntilDestroyed()` with no argument: a constructor is an injection context, so it finds the ambient `DestroyRef` on its own and completes the stream — which unsubscribes it — when this component is destroyed.',
    },
    {
      line: 12,
      text: 'A hand-written `.subscribe()`, the one place in this file that is not `toSignal`. It exists to prove the point: `toObservable` and `takeUntilDestroyed` compose with a plain subscription just as well as they compose with each other.',
    },
  ];

  /** Sample behind the injection-context Predict. */
  protected readonly injectionMistakeSample = `export class Widget {
  count!: Signal<number>;

  ngOnInit(): void {
    this.count = toSignal(this.source$, { initialValue: 0 }); // NOT a field initializer or the constructor
  }
}`;

  /** Choices for the debounce + switchMap check. */
  protected readonly pipelineOptions: QuizOption[] = [
    {
      text: 'Three — one per keystroke',
      why: 'That is what you get *without* `debounceTime`. Its whole job is to swallow emissions that are followed by another one too quickly, so the three keystrokes never reach `switchMap` as three separate values.',
    },
    {
      text: 'One',
      correct: true,
      why: '`debounceTime(300)` only lets a value through once 300ms have passed with no new one. Typing quickly means the first two are discarded before they are ever emitted, so `switchMap` is handed a single value and makes a single request.',
    },
    {
      text: 'Three, but only the last response is used',
      why: 'This describes `switchMap` alone — it does cancel the *subscription* to earlier inner observables, so earlier responses are ignored. But cancelling a response is not the same as never sending the request: your server would still see three. Debouncing is what stops them being sent.',
    },
    {
      text: 'None — `toObservable` only emits after the component stabilises',
      why: '`toObservable` emits the current value to each new subscriber and then every subsequent change. There is no gate on component stability; the values flow as soon as they are set.',
    },
  ];

  /** Old imperative pattern, for the compare against the modern bridge. */
  protected readonly oldWayTickerSample = `export class TickerComponent implements OnDestroy {
  tick = 0;
  private sub = interval(1000).subscribe((n) => {
    this.tick = n;                // a plain field — nothing marks the view dirty
    this.cdr.markForCheck();      // so you have to remember this too
  });

  ngOnDestroy(): void {
    this.sub.unsubscribe();       // forget this line and the interval outlives the component
  }
}`;

  /** The same behaviour, the modern way. */
  protected readonly newWayTickerSample = `export class TickerComponent {
  readonly tick = toSignal(interval(1000), { initialValue: 0 });
  // subscribes, marks only the views that read tick(), and unsubscribes on
  // destroy — all three jobs, for free, in one line
}`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Can I call `toSignal` twice on the same Observable?',
      a: 'You can, and you will get two subscriptions — because `toSignal` subscribes right there, once per call, exactly like the simplified implementation above. For an `HttpClient` call that means two requests to your server. Either share the source first (`shareReplay(1)` in the pipe) or, better, create the signal once and derive the second thing from it with a `computed` — which is what you would do with any other signal.',
    },
    {
      q: 'What is `requireSync` for?',
      a: 'It is the escape hatch for sources that genuinely do emit immediately — a `BehaviorSubject`, or a `startWith(...)` pipeline. `{ requireSync: true }` tells Angular "trust me, a value arrives synchronously", and in exchange the type is plain `T` rather than `T | undefined`. If the source turns out not to emit synchronously, it throws at creation rather than handing you a broken signal.',
    },
    {
      q: 'What happens if the Observable errors?',
      a: 'The error is re-thrown *when you read the signal* — which usually means during template rendering, in a stack trace that points at your template rather than at the HTTP call that failed. Put a `catchError` in the pipe before `toSignal` and map the failure into a value your template can render, such as an empty array or an error object.',
    },
    {
      q: 'Do I still need the `async` pipe?',
      a: 'Rarely, and that is the point. `toSignal` does the same job in the class instead of the template: subscribes, unsubscribes on destroy, and gives you something readable. It is also more flexible — you can feed the result into a `computed`, which you cannot do with an `async` pipe result. The `async` pipe is not deprecated, it is just usually the more awkward of the two now.',
    },
    {
      q: 'Should I convert everything to signals and be done with RxJS?',
      a: 'No, and trying is how people end up reimplementing operators badly. Anything involving *time* — debouncing, retry with backoff, cancelling a request because a newer one arrived, combining two sources by arrival order — is what streams are for, and signals have no answer to it. Convert at the boundary: state lives as signals, orchestration happens in RxJS.',
    },
  ];
}
