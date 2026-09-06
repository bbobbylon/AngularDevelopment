import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, map } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
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
 * Migrated to the brain-friendly layer (`shared/brain/`, see
 * `expert/change-detection` for the reference implementation this copies the
 * shape from). The teaching order:
 *
 * 1. **Pose the problem first.** A signal cannot wait for a pause in typing; an
 *    Observable cannot be read synchronously in a template. Both limits are felt
 *    — via a napkin prediction — before either bridge is named.
 * 2. **Analogy, then vocabulary.** A whiteboard and a ticker tape. A reader with
 *    somewhere to *put* "always has a value" versus "might not have one yet"
 *    retains `initialValue` and `requireSync` when those words arrive.
 * 3. **Mechanism next, for both directions.** Simplified (not real-internals)
 *    implementations of `toSignal` and `toObservable`, annotated line by line,
 *    plus a hand-drawn bridge diagram showing the two one-way crossings.
 * 4. **Then the same idea in four modes**: prose, the `roundTrip` flow diagram,
 *    an annotated real snippet, and a live debounced-search demo — because the
 *    retention bar is redundancy across modes, not repetition in one.
 * 5. **Every snippet is annotated** via `app-code-lab`, or walked through in a
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
   * The whiteboard and the ticker tape, arguing about who covers what.
   *
   * Staged as a conversation because the relationship — a signal always has an
   * answer, an observable sometimes has nothing to say yet, and the fix is to
   * *visit* the other side rather than becoming it — is the one idea the whole
   * lesson hangs off, and prose stating it once does not make it stick the way
   * watching the two sides negotiate does.
   */
  protected readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'Signal',
      says: 'I always have a value. Read me any time — no subscribing, no waiting.',
    },
    {
      who: 'Observable',
      says: "I don't. I only have something to say when something happens — and until it does, there is nothing to read.",
    },
    {
      who: 'Signal',
      says: 'Fine. Then where do I get `debounceTime`, `retry`, `switchMap`? I have none of that.',
    },
    {
      who: 'Observable',
      says: "You don't grow it — you visit me. `toObservable()` crosses you over, you use my operators for as long as you need them, then you come back.",
    },
    {
      who: 'Signal',
      says: 'Come back as what, exactly?',
    },
    {
      who: 'Observable',
      says: 'As a signal again — `toSignal()`. Just tell me what to say before your first value lands, because I might stay quiet a while.',
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

  /** The undefined-before-first-emission trap. */
  protected readonly initialValueSample = `@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  readonly users = toSignal(this.http.get<User[]>('/api/users'));
}

// In a component template, on first render:
//   {{ users().length }}

// The request takes 200ms. What renders?`;

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
      q: 'Why does `toSignal` need an `initialValue` at all? Observables manage without one.',
      a: 'Because the two shapes differ on exactly this point. A signal is defined by always having a value — that is what lets a template read it synchronously during rendering. An Observable may not have emitted yet. `initialValue` is what you put on the whiteboard while you wait for the first value off the tape. Without one, the type is `T | undefined` and you have to handle it.',
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
