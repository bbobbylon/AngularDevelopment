import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AsyncSubject, BehaviorSubject, ReplaySubject, Subject, Subscription } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── The marble-diagram primitives ─────────────────────────────────────────────

/** How a marble is drawn, which is the only thing the diagram says in colour. */
type MarbleTone =
  /** A value that went out on the wire. Solid accent. */
  | 'emitted'
  /** A value the subscriber on this row actually received. Solid olive. */
  | 'got'
  /** A value that went past this subscriber. Hollow, dashed. */
  | 'missed';

/**
 * One cell on a marble track.
 *
 * Every row of every diagram on this page is built from these, so a lane is
 * always the same width per cell and rows line up column-for-column. That
 * alignment is the whole point of a marble diagram — if the columns drift, the
 * picture stops saying "at this moment, here is what each subscriber saw".
 */
interface Tick {
  /** `value` draws a marble, `blank` reserves the column, `end` draws the completion bar. */
  readonly kind: 'value' | 'blank' | 'end';
  /** What is printed inside the marble. Empty for `blank` and `end`. */
  readonly label: string;
  /** Ignored unless `kind` is `value`. */
  readonly tone: MarbleTone;
}

/** One row of a marble diagram: who it belongs to, and what happened on it. */
interface Track {
  /** Whose timeline this is. Real text — the track itself is `aria-hidden`. */
  readonly name: string;
  /** The cells, left to right in time order. */
  readonly ticks: Tick[];
  /** Plain-text summary of what this subscriber ended up with. Empty to omit. */
  readonly received: string;
}

/** Builds a value cell. Kept terse so the diagram data below reads as a picture. */
function marble(label: string | number, tone: MarbleTone = 'emitted'): Tick {
  return { kind: 'value', label: String(label), tone };
}

/** Builds an empty column — nothing happened here, but the column still exists. */
function blank(): Tick {
  return { kind: 'blank', label: '', tone: 'emitted' };
}

/** Builds the vertical bar that means `complete()`. */
function end(): Tick {
  return { kind: 'end', label: '', tone: 'emitted' };
}

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: Subjects — the observable you are also allowed to push into.
 *
 * A `Subject` is both an Observable and an Observer, which makes it the bridge
 * between imperative code ("this just happened") and a reactive pipeline, and
 * the canonical way to turn a cold source into a multicast one. It is also the
 * most misused thing in RxJS, so the lesson is organised around *choosing*
 * rather than around the API surface.
 *
 * ## Teaching order
 *
 * This lesson uses the brain-friendly presentation layer (`shared/brain/`,
 * `src/brain-friendly.css`), and follows the section rhythm the reference
 * implementation in `expert/change-detection` established:
 *
 * 1. **Pose the problem first.** An Observable cannot be pushed into and is
 *    cold. Both facts are stated as consequences the reader can feel — two
 *    components, two HTTP requests — before the word "Subject" appears.
 * 2. **Analogy, then vocabulary.** Recipe versus radio station. A learner who
 *    has somewhere to *put* "hot", "multicast" and "late subscriber" retains
 *    them; one who meets the words first does not.
 * 3. **Mechanism next.** A twenty-line `MiniSubject` explains multicast, the
 *    silence of `next()` after `complete()`, and why a terminated subject is
 *    dead forever — all from an array and a `for` loop.
 * 4. **Then the same idea in four modes:** a dialogue between the flavours and
 *    a latecomer, a marble timeline, a table, and a live bench that draws its
 *    own marble diagram from real subjects.
 * 5. **Every substantial snippet is annotated line by line** through
 *    `app-code-lab`; nothing here assumes the reader can already read it.
 *
 * ## The claims that are easy to get wrong
 *
 * Two behaviours on this page contradict what most tutorials say, and both were
 * verified against the RxJS 7.8 in this repo rather than recalled:
 *
 * - After `complete()`, a **`BehaviorSubject` gives a new subscriber nothing** —
 *   the completion check in `Subject._subscribe` closes the subscription before
 *   `BehaviorSubject` gets to push its current value. A `ReplaySubject` in the
 *   same state *does* replay its buffer, because it pushes the buffer before
 *   checking. Same scenario, opposite answer.
 * - `BehaviorSubject.next()` on a stopped subject still **writes `_value`**,
 *   even though nothing is emitted, so `.value` and the stream can disagree
 *   permanently and silently.
 *
 * The four-flavour bench proves the first of those live; the `app-predict` in
 * the termination section covers the second.
 *
 * @see intermediate/rxjs-observables — cold producers and the push model.
 * @see intermediate/rxjs-interop — `toSignal`, `toObservable`, and the modern
 *   answer to most of what `BehaviorSubject` used to be used for.
 */
@Component({
  selector: 'app-lesson-rxjs-subjects',
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
  templateUrl: './rxjs-subjects.html',
  styleUrl: './rxjs-subjects.css',
})
export class RxjsSubjects implements OnDestroy {
  /**
   * The handle to this component's destruction, used by `takeUntilDestroyed`
   * from places that are not injection contexts — a click handler, for instance.
   * Captured here because `inject()` may only run in an injection context, and a
   * field initializer is one.
   */
  private readonly destroyRef = inject(DestroyRef);

  // ── Bench 1: one subject, two subscribers ──────────────────────────────────

  /**
   * The state behind the first bench. A `BehaviorSubject` because it models a
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

  // ── Bench 2: the four flavours ─────────────────────────────────────────────

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
   * The flavour bench's subscriptions.
   *
   * A hand-managed `Subscription` rather than `takeUntilDestroyed` on purpose:
   * this bench can be reset, and reset has to tear the old subscriptions down
   * *before* the component dies. `takeUntilDestroyed` ties a stream to the
   * component's lifetime, which is the right tool only when that is the lifetime
   * you actually want — see the two live subscriptions in the constructor.
   */
  private flavorSubs = new Subscription();

  /**
   * Values pushed into all four flavours.
   */
  protected readonly emitted = signal<number[]>([]);
  /**
   * Whether the sources have been completed — which is what makes the
   * `AsyncSubject` finally emit, and what makes the `BehaviorSubject` stop
   * handing out its current value.
   */
  protected readonly done = signal(false);
  /**
   * Whether the late subscriber has joined the flavour bench.
   */
  protected readonly lateJoined2 = signal(false);
  /**
   * What the late subscriber received from the plain `Subject` — nothing, unless
   * something is emitted after it joined.
   */
  protected readonly lateSubject = signal<number[]>([]);
  /**
   * What it received from the `BehaviorSubject` — the current value, *unless the
   * subject was already completed*, in which case nothing at all.
   */
  protected readonly lateBehavior = signal<number[]>([]);
  /**
   * What it received from the `ReplaySubject` — the last two, completed or not.
   */
  protected readonly lateReplay = signal<number[]>([]);
  /**
   * What it received from the `AsyncSubject` — the final value, if completed.
   */
  protected readonly lateAsync = signal<number[]>([]);

  // ── Bench 3: the dead bus ──────────────────────────────────────────────────

  /**
   * The event bus behind the termination bench. Replaced wholesale on reset,
   * because a terminated subject genuinely cannot be revived.
   */
  private bus = new Subject<string>();
  /**
   * The bus bench's subscriptions. Same reasoning as {@link flavorSubs}.
   */
  private busSubs = new Subscription();
  /**
   * Everything that has happened on the bus, oldest first. The gaps in this log
   * are the teaching: a `next()` with no lines under it is a silent drop.
   */
  protected readonly busLog = signal<string[]>([]);
  /**
   * How many listeners have subscribed so far. Never goes down — a listener that
   * was dropped by `complete()` still happened.
   */
  protected readonly busListeners = signal(0);
  /**
   * Whether the bus is still accepting values, and if not, how it died.
   */
  protected readonly busState = signal<'live' | 'completed' | 'errored'>('live');
  /**
   * A snapshot of `bus.observed` — RxJS's own "does anyone still hear me?" flag.
   * Sampled after every action because it is a plain getter, not a signal.
   */
  protected readonly busObserved = signal(false);
  /**
   * Counter behind the published message names.
   */
  private busPublished = 0;

  /**
   * Subscribes A immediately, so the first bench starts with one early listener
   * and room for a late one.
   *
   * `takeUntilDestroyed()` is called with no argument here: a constructor *is*
   * an injection context, so the operator can find the ambient `DestroyRef`
   * itself. These two subscriptions live exactly as long as the component, which
   * is what makes it the right tool.
   */
  constructor() {
    this.value$.pipe(takeUntilDestroyed()).subscribe((v) => this.a.update((arr) => [...arr, v]));
    this.value$.pipe(takeUntilDestroyed()).subscribe((v) => this.current.set(v));
  }

  // ── Bench 1 behaviour ──────────────────────────────────────────────────────

  /**
   * Pushes the next value. Reads `.value` off the `BehaviorSubject` — the
   * synchronous getter only that flavour has.
   */
  protected emit(): void {
    this.value$.next(this.value$.value + 1);
  }

  /**
   * Subscribes B late. It receives the current value at once, which a plain
   * `Subject` would not have given it.
   *
   * `takeUntilDestroyed(this.destroyRef)` rather than the bare call: a click
   * handler is not an injection context, so the `DestroyRef` has to be handed
   * over explicitly.
   */
  protected lateSubscribe(): void {
    this.lateJoined.set(true);
    this.value$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.b.update((arr) => [...arr, v]));
  }

  // ── Bench 2 behaviour ──────────────────────────────────────────────────────

  /** Format a late-subscriber result array for display. */
  protected show(arr: number[]): string {
    if (!this.lateJoined2()) return '— (add a late subscriber)';
    return arr.length ? arr.join(', ') : '(nothing)';
  }

  /**
   * Pushes one value into all four flavours at once.
   */
  protected emitAll(): void {
    const v = this.emitted().length + 1;
    this.emitted.update((a) => [...a, v]);
    this.subjectF.next(v);
    this.behaviorF.next(v);
    this.replayF.next(v);
    this.asyncF.next(v);
  }

  /**
   * Completes all four. Watch the `AsyncSubject`: this is the moment it emits,
   * and it emits only the last value. Watch the `BehaviorSubject` too — this is
   * the moment it stops giving newcomers anything.
   */
  protected completeAll(): void {
    this.subjectF.complete();
    this.behaviorF.complete();
    this.replayF.complete();
    this.asyncF.complete(); // AsyncSubject only emits its final value now
    this.done.set(true);
  }

  /**
   * Joins the flavour bench late, filling in the four "what did I get?" lists.
   */
  protected subscribeLate(): void {
    this.lateJoined2.set(true);
    this.flavorSubs.add(this.subjectF.subscribe((v) => this.lateSubject.update((a) => [...a, v])));
    this.flavorSubs.add(
      this.behaviorF.subscribe((v) => this.lateBehavior.update((a) => [...a, v])),
    );
    this.flavorSubs.add(this.replayF.subscribe((v) => this.lateReplay.update((a) => [...a, v])));
    this.flavorSubs.add(this.asyncF.subscribe((v) => this.lateAsync.update((a) => [...a, v])));
  }

  /**
   * Rebuilds all four sources from scratch. A completed subject cannot be reused —
   * completion is permanent — so this replaces them rather than clearing them.
   */
  protected resetFlavors(): void {
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
   * The live marble diagram: one lane per flavour, drawn from what the four real
   * subjects actually delivered.
   *
   * Every lane opens with the same leading column so the four rows stay in step —
   * for the `BehaviorSubject` that column holds its seed value `0`, and for the
   * other three it is empty. That is not a layout hack; the seed genuinely exists
   * before anybody emits anything, and having it occupy a visible column is the
   * clearest statement of what makes that flavour different.
   *
   * A marble is solid accent while nobody has joined (it was emitted, and there
   * is no latecomer to have missed it), and turns olive or hollow the moment a
   * late subscriber exists and the question "did *you* get this one?" becomes
   * answerable.
   */
  protected readonly lanes = computed<Track[]>(() => {
    const values = this.emitted();
    const joined = this.lateJoined2();
    const finished = this.done();

    const lane = (name: string, got: number[], seed: number | null, received: string): Track => {
      const toneFor = (v: number): MarbleTone =>
        !joined ? 'emitted' : got.includes(v) ? 'got' : 'missed';

      const ticks: Tick[] = [
        seed === null ? blank() : marble(seed, toneFor(seed)),
        ...values.map((v) => marble(v, toneFor(v))),
      ];
      if (finished) ticks.push(end());

      return { name, ticks, received };
    };

    return [
      lane('Subject', this.lateSubject(), null, this.show(this.lateSubject())),
      lane('BehaviorSubject(0)', this.lateBehavior(), 0, this.show(this.lateBehavior())),
      lane('ReplaySubject(2)', this.lateReplay(), null, this.show(this.lateReplay())),
      lane('AsyncSubject', this.lateAsync(), null, this.show(this.lateAsync())),
    ];
  });

  // ── Bench 3 behaviour ──────────────────────────────────────────────────────

  /** Appends one line to the bus log. */
  private logBus(line: string): void {
    this.busLog.update((lines) => [...lines, line]);
  }

  /**
   * Publishes a value. Deliberately stays enabled after the bus has terminated,
   * because "nothing happens, and nothing tells you" is the lesson.
   */
  protected publishToBus(): void {
    const message = `event ${++this.busPublished}`;
    this.logBus(`you called next("${message}")`);
    this.bus.next(message);
    this.busObserved.set(this.bus.observed);
  }

  /** Subscribes another listener, whenever the reader feels like it. */
  protected addBusListener(): void {
    const id = this.busListeners() + 1;
    this.busListeners.set(id);
    this.logBus(`listener ${id} subscribed`);
    this.busSubs.add(
      this.bus.subscribe({
        next: (v) => this.logBus(`  → listener ${id} received "${v}"`),
        error: (e: Error) => this.logBus(`  → listener ${id} was handed the error: ${e.message}`),
        complete: () => this.logBus(`  → listener ${id} was told: complete`),
      }),
    );
    this.busObserved.set(this.bus.observed);
  }

  /** Ends the bus politely. Every current listener is completed, then dropped. */
  protected completeBus(): void {
    this.logBus('you called complete()');
    this.bus.complete();
    this.busState.set('completed');
    this.busObserved.set(this.bus.observed);
  }

  /** Ends the bus badly. The error is stored and replayed to everyone who arrives later. */
  protected failBus(): void {
    this.logBus('you called error(new Error("the feed dropped"))');
    this.bus.error(new Error('the feed dropped'));
    this.busState.set('errored');
    this.busObserved.set(this.bus.observed);
  }

  /** Replaces the bus. The only way back from a termination. */
  protected resetBus(): void {
    this.busSubs.unsubscribe();
    this.busSubs = new Subscription();
    this.bus = new Subject<string>();
    this.busPublished = 0;
    this.busListeners.set(0);
    this.busState.set('live');
    this.busObserved.set(false);
    this.busLog.set([]);
  }

  /**
   * Tears down the two hand-managed benches.
   *
   * The constructor's subscriptions are absent from this method on purpose:
   * `takeUntilDestroyed()` already ends them. What is left here is exactly the
   * case that operator does not cover — subscriptions whose lifetime is shorter
   * than the component's, because a reset button can end them early.
   */
  ngOnDestroy(): void {
    this.flavorSubs.unsubscribe();
    this.busSubs.unsubscribe();
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The RxJS track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Observables', id: 'rxjs-observables' },
    { label: 'Operators', id: 'rxjs-operators' },
    { label: 'Subjects' },
    { label: 'RxJS + Signals', id: 'rxjs-interop' },
  ];

  /**
   * A latecomer asking the four flavours what it missed.
   *
   * The exchange exists because the four types differ in exactly one respect —
   * what a subscriber is told on arrival — and prose about that turns into four
   * parallel sentences the reader has to hold at once. Staged as a conversation,
   * each flavour answers the *same question* in its own voice, which is how the
   * distinction survives past the page.
   */
  protected readonly lateTalk: BubbleTurn[] = [
    {
      who: 'Late subscriber',
      says: 'I just subscribed. What did I miss?',
    },
    {
      who: 'Subject',
      says: "Nothing is coming. I don't keep values — I push each one to whoever is in my list at that moment and then forget it. You hear from my next `next()` onwards.",
    },
    {
      who: 'Late subscriber',
      says: 'So if nobody ever emits again, I sit here empty forever?',
    },
    {
      who: 'BehaviorSubject',
      says: 'Not with me. I always hold a **current value** — the seed you passed my constructor, or the last one pushed — and you get it the instant you subscribe. One value, immediately, then the live feed.',
    },
    {
      who: 'ReplaySubject(2)',
      says: 'And I keep a buffer. You get the last **two**, replayed back to back, before anything new arrives. Make it `ReplaySubject(50)` and you get fifty.',
    },
    {
      who: 'AsyncSubject',
      says: 'I tell you nothing at all — until somebody calls `complete()`. Then you get exactly one value, the final one, and the ending. If nobody ever completes me, you get silence forever.',
    },
  ];

  /**
   * The life of a subject, as a one-way sequence.
   *
   * Drawn as a flow rather than as a list because the irreversibility is the
   * point: there is no arrow back from the last two steps, and a reader who sees
   * the shape stops asking how to restart a completed subject.
   */
  protected readonly lifecycle: FlowStep[] = [
    {
      label: 'new Subject()',
      detail: 'An empty observer list. No producer, nothing running, nothing subscribed to.',
    },
    {
      label: 'subscribe()',
      detail: 'A callback is pushed onto the list. Nothing replays — you hear from now on.',
    },
    {
      label: 'next(v)',
      detail: 'One loop over the list. Every listener is handed the same `v`, synchronously.',
      tone: 'accent',
    },
    {
      label: 'complete() or error()',
      detail: 'The list is emptied, the ending is stored, and the subject is marked stopped.',
      tone: 'warn',
    },
    {
      label: 'stopped, permanently',
      detail:
        '`next()` is ignored in silence. Every future subscriber is handed the stored ending on arrival.',
      tone: 'warn',
    },
  ];

  /**
   * Sample: a Subject, reduced to the two fields that make it one.
   *
   * Twenty lines that answer four separate questions the lesson would otherwise
   * have to assert: why it multicasts, why subscribing is free, why `next()`
   * after `complete()` is silent, and why a terminated subject is unrecoverable.
   */
  protected readonly miniSubjectSample = `class MiniSubject<T> {
  private observers: ((value: T) => void)[] = []; // everyone currently listening
  private stopped = false;                        // set once, by complete() or error()

  subscribe(fn: (value: T) => void): void {
    if (this.stopped) return;                     // a finished subject registers nobody
    this.observers.push(fn);                      // an array push. That is the whole thing.
  }

  next(value: T): void {
    if (this.stopped) return;                     // ignored in silence — nothing is thrown
    for (const fn of [...this.observers]) fn(value);
  }

  complete(): void {
    this.stopped = true;
    this.observers = [];                          // the listeners are dropped, permanently
  }
}`;

  /** Line-by-line walkthrough of {@link miniSubjectSample}. */
  protected readonly miniSubjectNotes: CodeNote[] = [
    {
      line: 1,
      text: '`<T>` is a **generic parameter** — a placeholder for the type of value this subject carries, filled in at the point of use (`new MiniSubject<string>()`). the real RxJS `Subject<T>` has this exact shape; only the bookkeeping is bigger.',
    },
    {
      line: 2,
      text: '`observers` is the entire difference between a Subject and an Observable. The type `((value: T) => void)[]` reads as *array of functions that take a `T` and return nothing* — one entry per subscriber, **held by the subject itself**. An Observable owns no such list, which is why it cannot multicast.',
    },
    {
      line: 5,
      text: '`subscribe` takes `fn`, the callback you would have written as `subject.subscribe(v => …)`. Note what it does **not** take: a producer, a source, anything to start.',
    },
    {
      line: 6,
      text: 'The stopped check comes **before** the push. This one line is why a completed subject can never be revived: subscribing to it does not fail loudly, you are simply never registered.',
    },
    {
      line: 7,
      text: 'Subscribing costs one `push`. No timer starts, no HTTP request goes out, no generator is created. Compare that with a cold Observable, where `subscribe` **runs the function that makes the values** — that difference is the whole of cold versus hot.',
    },
    {
      line: 11,
      text: '`next()` on a stopped subject returns early. No exception, no console warning, no delivery. A large share of confused bug reports about Subjects are this single line.',
    },
    {
      line: 12,
      text: 'The multicast mechanism, complete. `[...this.observers]` copies the array first, so a listener that unsubscribes *during* the loop cannot shift the array under the iterator. Then each `fn` is handed **the same** `value` — one call in, N deliveries out.',
    },
    {
      line: 17,
      text: '`complete()` drops the list. Not "pauses", not "clears until next time" — the references are gone and `stopped` guards the door. `error()` does the same, and additionally **stores the error** so every future subscriber can be handed it on arrival.',
    },
  ];

  /**
   * Sample: the manual cold-to-hot bridge, and the operator that packages it.
   *
   * The line worth the whole snippet is `ticks$.subscribe(hub)` — passing a
   * Subject where an Observer is expected. Once a reader sees that this is legal,
   * `share()` and `shareReplay()` stop being magic.
   */
  protected readonly multicastSample = `const ticks$ = interval(1000);           // COLD: each subscriber starts its own timer
const hub = new Subject<number>();       // the microphone everyone will listen to

ticks$.subscribe(hub);                   // legal, and the whole trick: a Subject IS an Observer
hub.subscribe((n) => console.log('A', n));
hub.subscribe((n) => console.log('B', n));

// the identical wiring, packaged by an operator:
const shared$ = ticks$.pipe(share());    // share() builds that Subject and subscribes it for you`;

  /** Line-by-line walkthrough of {@link multicastSample}. */
  protected readonly multicastNotes: CodeNote[] = [
    {
      line: 1,
      text: '`interval(1000)` is a **cold** source: the timer is created *inside* its subscribe function, so two subscribers means two timers, each counting from `0` at its own moment. The `$` on `ticks$` is only a naming convention meaning "this is a stream".',
    },
    {
      line: 2,
      text: '`new Subject<number>()` — `<number>` says what it carries. It has no source yet: right now it is an empty observer list, waiting for somebody to push into it.',
    },
    {
      line: 4,
      text: 'Stare at this one. `subscribe()` accepts an **Observer** — any object with `next`, `error` and `complete` methods — and a `Subject` has all three. So you can hand the subject itself to the source. One subscription to `ticks$`, and every value it produces lands in `hub.next()`.',
    },
    {
      line: 5,
      text: 'A and B subscribe to the **hub**, not to `ticks$`. They now share one timer and see byte-for-byte identical values. If B subscribes late it simply misses whatever already went past — which is the entire cost of going hot.',
    },
    {
      line: 9,
      text: '`share()` is that pattern as one operator: it puts a Subject in the middle, subscribes to the source when the **first** subscriber arrives, and drops the source subscription when the **last** one leaves. `shareReplay(1)` is the same with a `ReplaySubject(1)` in the middle — which is how you get "cache the last response".',
    },
  ];

  /**
   * Sample: the `asObservable()` discipline, on the shape of service most Angular
   * apps have at least one of.
   */
  protected readonly busServiceSample = `@Injectable({ providedIn: 'root' })
export class NotificationBus {
  private readonly events$ = new Subject<string>();  // private — only this class may push
  readonly messages$ = this.events$.asObservable();  // public — a subscribe-only view

  notify(message: string): void {
    this.events$.next(message);                      // the one door, and it has a name
  }
}`;

  /** Line-by-line walkthrough of {@link busServiceSample}. */
  protected readonly busServiceNotes: CodeNote[] = [
    {
      line: 1,
      text: "`@Injectable({ providedIn: 'root' })` registers the class with the root injector, so every component that injects `NotificationBus` gets **the same instance** — which is what makes one shared Subject possible at all.",
    },
    {
      line: 3,
      text: '`private readonly` is doing real work here. `private` keeps `events$` out of every other file; `readonly` stops even this class from reassigning it, so nobody can quietly swap in a fresh subject and orphan the existing subscribers.',
    },
    {
      line: 4,
      text: '`asObservable()` returns a **new Observable** whose only job is to forward `subscribe` to the subject. That returned object has no `next`, no `error`, no `complete` — so this is a real barrier at runtime, not merely a narrower type.',
    },
    {
      line: 6,
      text: '`notify` is the public verb. Every value that ever enters this stream comes through a named method you can search for, put a breakpoint in, log, or validate — which is exactly what you lose by making the subject public.',
    },
    {
      line: 7,
      text: '`this.events$.next(message)` is the only `next()` in the file. Note that the class pushes into `events$`, the private one, while the outside world reads `messages$`, the wrapper. Two names for one stream is the point, not an accident.',
    },
  ];

  /**
   * Sample: what termination actually does, written as a transcript so the silent
   * line in the middle is visible.
   */
  protected readonly terminationSample = `const bus = new Subject<string>();
bus.subscribe({ next: (v) => log('A', v), error: (e) => log('A error', e.message) });

bus.next('ping');                       // A logs: A ping
bus.error(new Error('feed dropped'));   // A logs: A error feed dropped — then A is dropped
bus.next('pong');                       // nothing at all. No throw, no delivery, no warning.

bus.subscribe({ next: (v) => log('B', v), error: (e) => log('B error', e.message) });
// B logs: B error feed dropped — immediately, before it has read a single value`;

  /** Line-by-line walkthrough of {@link terminationSample}. */
  protected readonly terminationNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The object form of `subscribe`. `{ next, error, complete }` is an **Observer**: three optional callbacks, one per kind of notification. Supplying `error` matters — a stream that errors with no handler reports an unhandled error instead.',
    },
    {
      line: 5,
      text: '`error(e)` hands `e` to every current subscriber, empties the observer list, and stores `e` on the subject. Three things, one call. The stored copy is what makes the next surprise possible.',
    },
    {
      line: 6,
      text: 'The silent line. `next()` on a terminated subject returns immediately — the value is not queued, not buffered, not reported. If you are debugging "my event fired but nothing happened", this is the first thing to rule out.',
    },
    {
      line: 8,
      text: 'B subscribes **after** the failure and is handed the stored error before its own first line of code runs. A terminated subject is not silent to newcomers; it is loudly, permanently finished.',
    },
  ];

  /**
   * Sample: the two ways to call `takeUntilDestroyed`, and why there are two.
   *
   * The distinction between them — injection context or not — is the single most
   * common runtime error people hit when they first reach for the operator.
   */
  protected readonly teardownSample = `private readonly bus = inject(NotificationBus);
private readonly destroyRef = inject(DestroyRef);

constructor() {
  this.bus.messages$
    .pipe(takeUntilDestroyed())               // in a constructor the context is implicit
    .subscribe((m) => this.toast(m));
}

onOpenPanel(): void {
  this.bus.messages$
    .pipe(takeUntilDestroyed(this.destroyRef)) // in a handler, hand it over yourself
    .subscribe((m) => this.toast(m));
}`;

  /** Line-by-line walkthrough of {@link teardownSample}. */
  protected readonly teardownNotes: CodeNote[] = [
    {
      line: 2,
      text: '`DestroyRef` is an injectable object that represents *this component being destroyed*; you can hand it around, and `onDestroy()` on it registers a callback. `inject()` may only run in an **injection context**, and a field initializer is one.',
    },
    {
      line: 6,
      text: '`takeUntilDestroyed()` completes the stream when the component is destroyed, and completing a stream unsubscribes it. Called with **no argument** it looks up the ambient injection context — available in a field initializer or a constructor, and nowhere else.',
    },
    {
      line: 12,
      text: 'The same operator, called from a click handler. There is no ambient injector inside an event callback, so you pass the `DestroyRef` you captured on line 2. Omit it here and Angular throws *"takeUntilDestroyed() can only be used within an injection context"* at runtime, not at build time.',
    },
    {
      line: 13,
      text: '`subscribe` returns a `Subscription` you are deliberately not storing. That is the point of the operator: the teardown is expressed once, in the pipe, instead of as bookkeeping you have to remember in `ngOnDestroy`.',
    },
  ];

  /**
   * Sample: the case where a Subject is still exactly right in a signals-first
   * app — a stream of *events*, with time semantics a signal has no vocabulary
   * for, converted to a signal only at the very end.
   */
  protected readonly searchSample = `private readonly search$ = new Subject<string>();  // an EVENT stream: keystrokes that happened

readonly results = toSignal(
  this.search$.pipe(
    debounceTime(300),        // wait for a 300ms gap in typing — pure time semantics
    distinctUntilChanged(),   // drop a query identical to the previous one
    switchMap((q) => this.http.get<Hit[]>('/api/search?q=' + q)), // cancel the in-flight request
  ),
  { initialValue: [] },       // what results() reads before the first response lands
);

onType(text: string): void {
  this.search$.next(text);    // the template pushes in; the pipeline does everything else
}`;

  /** Line-by-line walkthrough of {@link searchSample}. */
  protected readonly searchNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A `Subject`, not a signal, because a keystroke is an **event**: it happened, at a moment, and then it is over. "What is the current keystroke?" is not a question with an answer, which is the test for whether something is state.',
    },
    {
      line: 3,
      text: '`toSignal(...)` from `@angular/core/rxjs-interop` subscribes to the stream, keeps the latest value, and unsubscribes when the injection context is destroyed. `results` is then an ordinary signal you call as `results()` in the template.',
    },
    {
      line: 5,
      text: '`debounceTime(300)` waits for a 300-millisecond gap with no new value and only then lets the most recent one through. **This is the argument for keeping RxJS.** A signal has no way to say "later, if nothing else happens".',
    },
    {
      line: 6,
      text: '`distinctUntilChanged()` compares each value with the previous one and drops the duplicates — so backspacing a character and retyping it does not fire a second identical request.',
    },
    {
      line: 7,
      text: '`switchMap` swaps to a new inner observable for each incoming value and **cancels the previous one** — including the HTTP request it was running. That cancellation is why the search results can never arrive out of order.',
    },
    {
      line: 9,
      text: '`{ initialValue: [] }` is what `results()` returns before the first response arrives. Supply it and `results` is `Hit[]`; omit it and the type becomes `Hit[] | undefined`, because there is genuinely a moment with no value.',
    },
    {
      line: 13,
      text: '`this.search$.next(text)` is the imperative push — the exact thing an Observable will not let you do, and the reason a Subject is here at all. The template calls this from `(input)` and nothing else in the component knows about the pipeline.',
    },
  ];

  /**
   * Sample behind the `.value` drift prediction.
   *
   * Five lines, and the last two disagree with each other — which is the entire
   * argument against reading `.value` in application code.
   */
  protected readonly valueDriftSample = `const state$ = new BehaviorSubject(1);
state$.subscribe((v) => console.log('saw', v));
state$.complete();
state$.next(99);
console.log(state$.value);`;

  /** Short illustration: the service that hands out the microphone. */
  protected readonly leakySample = `// anyone, anywhere, can do anything to this:
readonly user$ = new BehaviorSubject<User | null>(null);

someComponent.userService.user$.next(null);      // silently logs everyone out
someComponent.userService.user$.complete();      // and now the stream is dead, app-wide`;

  /** Short illustration: the same service, sealed. */
  protected readonly sealedSample = `private readonly user = new BehaviorSubject<User | null>(null);
readonly user$ = this.user.asObservable();       // no next(), no complete(), no error()

setUser(next: User | null): void {
  this.user.next(next);                          // one door, named, greppable, testable
}`;

  /** Short illustration: state held the 2018 way. */
  protected readonly behaviorStateSample = `private readonly count$ = new BehaviorSubject(0);
readonly count = this.count$.asObservable();

increment(): void { this.count$.next(this.count$.value + 1); }
// template: {{ count | async }} — and a subscription you cannot see`;

  /** Short illustration: the same state, held the 2026 way. */
  protected readonly signalStateSample = `readonly count = signal(0);

increment(): void { this.count.update((c) => c + 1); }
// template: {{ count() }} — no subscription, no async pipe, nothing to tear down`;

  /**
   * Self-test 1 — cold versus hot.
   *
   * The distractors are the three stories people tell themselves about why two
   * subscribers "should" share one request: that observables are shared objects,
   * that sharing depends on timing, and that RxJS caches. Each `why` names the
   * belief rather than restating the answer.
   */
  protected readonly coldQuiz: QuizOption[] = [
    {
      text: 'One. Both components are subscribing to the same observable object.',
      why: 'They are — and it makes no difference. A cold Observable is a **recipe, not a dish**: the code that makes the request lives *inside* the function that `subscribe` calls, so every subscription runs it again. Sharing the object shares the instructions, not the result.',
    },
    {
      text: 'Two. Each subscriber gets its own private run of the producer.',
      correct: true,
      why: 'Exactly. Cold means the producer is created per subscription, so two subscribes are two runs and two requests. Piping through `share()` or `shareReplay(1)` puts a **Subject** in the middle: the Subject subscribes once and multicasts the single result to both.',
    },
    {
      text: 'Two, but only if the two subscriptions overlap in time.',
      why: 'Timing is not the variable. Cold is about **where the producer lives** — inside the subscribe function — so every subscription builds a brand new one. Subscribe an hour apart and you still get two requests; subscribe in the same tick and you still get two.',
    },
    {
      text: 'One. The second subscriber gets the cached response.',
      why: 'Nothing in RxJS caches by default. Caching is precisely what `shareReplay(1)` adds, and `shareReplay` is a `ReplaySubject` with wiring around it. Without one, an observable has no memory at all — a recipe does not remember the last meal.',
    },
  ];

  /**
   * Self-test 2 — the completed `BehaviorSubject`.
   *
   * This is the trap the four-flavour bench exists to spring, and nearly every
   * tutorial on the internet gets it wrong (including the earlier version of this
   * lesson). The `why` on option 1 has to explain the *ordering* inside
   * `subscribe`, because "it does not" is not an explanation anybody remembers.
   */
  protected readonly completedQuiz: QuizOption[] = [
    {
      text: '`3`, then the completion — a BehaviorSubject always delivers its current value first.',
      why: 'True right up until `complete()` is called, and this is the ordering that flips it. `BehaviorSubject` pushes its current value **inside `subscribe`, after** the base `Subject` has checked whether it is already stopped — and a stopped subject completes the new subscriber immediately, which closes the subscription before the value ever gets its turn. Completion is checked first; the value never runs.',
    },
    {
      text: '`0, 1, 2, 3`, then the completion — it replays everything it has held.',
      why: 'That would be a `ReplaySubject` with an unbounded buffer. A `BehaviorSubject` keeps exactly **one** value — the current one — in a single slot that each `next()` overwrites. It has no history to replay, completed or not.',
    },
    {
      text: 'Nothing but the completion notification.',
      correct: true,
      why: 'Correct, and it catches almost everyone. Now hold it next to the sibling case: a `ReplaySubject(2)` in the *same* state **does** replay `2, 3` first, because it pushes its buffer before checking the stopped flag. Same scenario, opposite answer — which is exactly why "BehaviorSubject is just ReplaySubject(1)" is wrong.',
    },
    {
      text: 'It throws `ObjectUnsubscribedError`, because the subject is closed.',
      why: 'That error is real but it belongs to a different ending. `subject.unsubscribe()` sets `closed` to `true` and then **throws** on any further `next()` or `subscribe()`. `complete()` leaves `closed` as `false` and politely completes whoever arrives. Two different kinds of dead, and only one of them is loud.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is a Subject just an `EventEmitter` with a longer name?',
      a: "Almost literally — Angular's `EventEmitter` **extends** `Subject`. The difference is what each is *for*. `EventEmitter` is the type of an `@Output`, and Angular's own docs say to use it only there; the modern spelling is the `output()` function anyway. Anything living in a service should be a real `Subject`, so that nobody reading the code assumes there is a component boundary involved.",
    },
    {
      q: 'Is `BehaviorSubject` the same as `ReplaySubject(1)`?',
      a: 'Close enough to trip you, different in three ways that get examined. `BehaviorSubject` **requires a seed value**, so a subscriber always gets something immediately; `ReplaySubject(1)` starts empty and gives a newcomer nothing until the first emission. `BehaviorSubject` has a synchronous `.value` getter; `ReplaySubject` has none. And after `complete()`, the `ReplaySubject` still replays its buffer while the `BehaviorSubject` gives newcomers nothing.',
    },
    {
      q: 'If a consumer can cast `messages$` back to a `Subject`, what is `asObservable()` actually protecting?',
      a: 'The object, not just the type. `asObservable()` hands back a genuinely different instance — a plain `Observable` that forwards `subscribe` and has no `next`, `error` or `complete` on it at all. A cast changes what the compiler believes, never what the object is, so the cast compiles and then fails with a `TypeError` at runtime. It is a real fence, not a sign asking people not to climb.',
    },
    {
      q: 'Do I really have to unsubscribe? My subject never errors and never completes.',
      a: 'That is *precisely* when you have to. A subscription ends by itself when the stream **completes**, and a Subject modelling an ongoing feed never does — so every component that subscribes and forgets leaves a live callback holding a reference to a destroyed component. Use `takeUntilDestroyed()`, the `async` pipe, or `toSignal()`. And note that completing a subject you *own* in `ngOnDestroy` is a different thing entirely: it releases your subscribers, and does nothing about your own subscriptions to other streams.',
    },
    {
      q: 'Every article I have read says `BehaviorSubject` for state. Is that wrong now?',
      a: 'It was the right answer for a decade and it is now the second-best one. A signal gives you the same contract — always has a current value, always readable synchronously — with no subscription, no teardown and change detection that understands it natively. Keep `BehaviorSubject` where you genuinely want the RxJS pipeline wrapped around the value, and remember you can have both: `toSignal(stream$)` and `toObservable(sig)` convert in either direction.',
    },
  ];

  /**
   * The static cold-side marble diagram: two subscribers, two private runs.
   *
   * B's row restarting at `0` is the entire claim of the section, and it is the
   * kind of thing prose states and a picture proves.
   */
  protected readonly coldTracks: Track[] = [
    {
      name: 'subscriber A — subscribed at t0',
      ticks: [marble(0), marble(1), marble(2), marble(3)],
      received: '',
    },
    {
      name: 'subscriber B — subscribed at t2, and got its own run, from zero',
      ticks: [blank(), blank(), marble(0), marble(1)],
      received: '',
    },
  ];

  /**
   * The static hot-side marble diagram: one run, everybody on the same values,
   * and a latecomer that has simply missed the start.
   */
  protected readonly hotTracks: Track[] = [
    {
      name: 'you, calling next()',
      ticks: [marble(1), marble(2), marble(3), marble(4)],
      received: '',
    },
    {
      name: 'subscriber A — subscribed at t0',
      ticks: [marble(1), marble(2), marble(3), marble(4)],
      received: '',
    },
    {
      name: 'subscriber B — subscribed at t2, and those two are gone for good',
      ticks: [marble(1, 'missed'), marble(2, 'missed'), marble(3, 'got'), marble(4, 'got')],
      received: '',
    },
  ];
}
