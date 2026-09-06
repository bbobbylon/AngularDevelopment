import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, of, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, mergeMap, switchMap } from 'rxjs/operators';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Core Operators — the handful worth knowing, and the choice that
 * matters most.
 *
 * Covers `map`, `filter`, `tap`, `debounceTime`, `distinctUntilChanged`,
 * `catchError`, `take`/`takeUntil`, `scan`, `startWith`, and the four
 * flattening operators.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape copied from
 * `expert/change-detection/change-detection.ts`, the reference
 * implementation. Same teaching order:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "type-ahead
 *    with no operators fires one request per keystroke" and asks the reader
 *    to guess the damage before any operator is named.
 * 2. **Analogy next, mechanism after.** Two analogies, in order: the pipe
 *    itself is an assembly line (every operator is a one-job machine on a
 *    belt), and the four flattening operators are four receptionists handling
 *    a second phone call while still on the first. The receptionist framing
 *    predates this migration — it already scored 9/9 on the retention audit —
 *    and is preserved rather than replaced.
 * 3. **Then the same idea in four modes**: the analogy in prose, a `TapeCard`
 *    row for the four policies, a `Bubbles` dialogue dramatising what
 *    `switchMap` actually does to the abandoned call, a marble-diagram
 *    timing comparison, and two live demos (a real type-ahead, and a
 *    switchMap-vs-mergeMap race) with the exact code behind each wired
 *    through `CodeLab`.
 * 4. **Every real snippet is annotated line by line** via `app-code-lab` —
 *    the type-ahead pipe, the race, and a hand-written pipeable operator that
 *    demystifies what `pipe()` actually calls. Illustrative pseudocode
 *    (marble diagrams, the bare assembly-line shape) stays as plain,
 *    non-annotated blocks, matching how the reference lesson treats its own
 *    `schedulingSample` — annotation is for real, runnable code.
 *
 * Two live demos, unchanged in mechanics from the pre-migration lesson:
 *
 * - **A type-ahead**, counting keystrokes against searches actually issued, so
 *   `debounceTime` + `distinctUntilChanged` show up as a number rather than a
 *   claim.
 * - **`switchMap` against `mergeMap`**, racing the same trigger through both.
 *   `switchMap` cancels the previous inner observable, `mergeMap` lets them
 *   all run. For a search box, `mergeMap` is a race condition with a stale
 *   winner; for a save queue, `switchMap` silently drops writes. Same
 *   signature, opposite failure modes — which is why the demo fires both
 *   from one button and shows the outputs side by side.
 *
 * @see intermediate/rxjs-observables — what these operate on.
 */
@Component({
  selector: 'app-lesson-rxjs-operators',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './rxjs-operators.html',
  styleUrl: './rxjs-operators.css',
})
export class RxjsOperators implements OnDestroy {
  /** The RxJS track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Observables', id: 'rxjs-observables' },
    { label: 'Core Operators' },
    { label: 'Subjects', id: 'rxjs-subjects' },
    { label: 'Signals ↔ RxJS', id: 'rxjs-interop' },
  ];

  /**
   * What `switchMap` actually does to the call it abandons, staged as a
   * two-party exchange rather than described in a sentence.
   *
   * This exists because of a doubt learners reliably raise (see the FAQ
   * item on the same question): that `switchMap` merely *ignores* the stale
   * inner observable rather than actively killing it. The dialogue makes the
   * cancellation an event that happens, not a property that is true.
   */
  protected readonly switchMapTalk: BubbleTurn[] = [
    { who: 'Outer stream', says: 'A new value just came through — call it #2.' },
    {
      who: 'switchMap',
      says: "Then I'm done with #1's inner observable. Unsubscribing now — even mid-request.",
    },
    { who: 'Outer stream', says: "And #1's HTTP call? It already left for the server." },
    {
      who: 'switchMap',
      says: "Doesn't matter. I told it to stop caring about the response. That's a cancelled request, not a discarded result.",
    },
  ];

  /**
   * How to pick a flattening operator, as four questions asked in order. Framed as
   * a decision path rather than a table of definitions because the definitions are
   * easy and the *choice* is what people get wrong — and the choice is nearly
   * always settled by the first question that gets a yes.
   */
  protected readonly choosing = [
    {
      label: 'Does only the newest matter?',
      detail: 'Yes → `switchMap`. Search, autocomplete, a detail page following a selection',
      tone: 'accent' as const,
    },
    {
      label: 'Must they happen in order?',
      detail: 'Yes → `concatMap`. Queued writes, sequenced animations',
    },
    {
      label: 'Are they independent?',
      detail: 'Yes → `mergeMap`. Parallel uploads, fire-and-forget analytics',
    },
    {
      label: 'Should extras be ignored while busy?',
      detail: 'Yes → `exhaustMap`. Submit buttons, login, refresh',
    },
    {
      label: 'Still unsure?',
      detail:
        'If the values are writes, it is not `switchMap`. That rules out the dangerous answer',
      tone: 'good' as const,
    },
  ];

  /** Illustrative shape of `.pipe()` — a conveyor belt, not real API. */
  protected readonly assemblyLineSample = `source$.pipe(
  operatorA,   // value flows in here...
  operatorB,   // ...then through here...
  operatorC,   // ...and out the bottom
).subscribe((result) => /* ... */);`;

  /** Marbles: the everyday transforming/filtering operators. */
  protected readonly transformFilterSample = `source:            --1--2--3--4--|

map(x => x * 10):    --10-20-30-40-|   transform each value
filter(x => x % 2):  -----2-----4--|   keep values that pass a test
take(2):             --1--2|           first 2, then complete
tap(log):            --1--2--3--4--|   side effect, value passes through unchanged
scan((a,b)=>a+b):    --1--3--6--10-|   running total (like reduce, but emits each step)
startWith(0):        0-1--2--3--4--|   emit a seed value first`;

  /** Marbles: the time-based filtering operators. */
  protected readonly timeFilterSample = `debounceTime(300):        wait for a 300ms PAUSE, then emit the latest
                          (collapses a burst of keystrokes into one)
throttleTime(300):        emit, then ignore for 300ms (rate-limit)
distinctUntilChanged():   drop a value if it equals the previous one
auditTime / sampleTime:   emit the latest value on a timer`;

  /** Marbles: the four flattening operators against identical input. */
  protected readonly flattenMarbleSample = `outer:          --a------b--------c----
inner per item: (each letter starts a 2-tick request: --1--2|)

switchMap:      --a1-a2--b1--CANCELS-b2|c1--c2   cancel previous, keep newest
mergeMap:       --a1-a2--b1-a?-b2----c1--c2      run ALL at once (concurrent)
concatMap:      --a1-a2----b1-b2----c1-c2        queue, one after another, in order
exhaustMap:     --a1-a2----------c1-c2           ignore new while one is in flight`;

  /** The switchMap-for-writes trap. */
  protected readonly autosaveSample = `// Autosave a form as the user types.
this.formChanges$.pipe(
  debounceTime(500),
  switchMap((draft) => this.api.save(draft)),
).subscribe();

// The user types steadily for ten seconds.
// The API is slow — each save takes ~2s.
// What ends up on the server?`;

  /** Real code behind live demo #1 — the type-ahead pipe. */
  protected readonly typeaheadSample = `this.query$.pipe(
  debounceTime(400),
  distinctUntilChanged(),
  switchMap((q) => this.api.search(q).pipe(
    catchError(() => of([])),
  )),
).subscribe((r) => this.result.set(r));`;

  /** Line-by-line walkthrough of {@link typeaheadSample}. */
  protected readonly typeaheadNotes: CodeNote[] = [
    {
      line: 1,
      text: '`query$` is the Subject every keystroke gets pushed into. `.pipe()` opens the assembly line — everything below wraps what came before and returns a new Observable, never touching `query$` itself.',
    },
    {
      line: 2,
      text: '`debounceTime(400)` waits for 400ms with no new keystroke before letting the latest one through — a burst of typing collapses into a single emission, once it settles.',
    },
    {
      line: 3,
      text: "`distinctUntilChanged()` compares that emission with the previous one and drops it if they're equal. Needed because `debounceTime` only cares about timing — type, delete, and retype the same word slowly enough and it settles twice.",
    },
    {
      line: 4,
      text: '`switchMap` is where a stream of query strings becomes a stream of HTTP calls. `q` is the settled string; `this.api.search(q)` returns a new inner observable — and `switchMap` unsubscribes from whichever inner observable it started last time, the moment this one arrives.',
    },
    {
      line: 5,
      text: "`catchError` sits inside `switchMap`'s callback, on the inner observable — so a failed search returns an empty array and only this one lookup is affected. Move it outside `switchMap` and it protects nothing.",
    },
    {
      line: 6,
      text: "Closes the inner `.pipe()` first, then `switchMap`'s own argument list.",
    },
    {
      line: 7,
      text: '`.subscribe()` is what actually runs any of this — a pipe with no subscriber never executes. The callback here writes the final value into the `result` signal.',
    },
  ];

  /** Real code behind live demo #2 — the switchMap/mergeMap race. */
  protected readonly raceSample = `this.switch$.pipe(
  switchMap((id) => timer(700).pipe(map(() => id))),
).subscribe((id) => this.switchOut.update((a) => [...a, id]));

this.merge$.pipe(
  mergeMap((id) => timer(700).pipe(map(() => id))),
).subscribe((id) => this.mergeOut.update((a) => [...a, id]));`;

  /** Line-by-line walkthrough of {@link raceSample}. */
  protected readonly raceNotes: CodeNote[] = [
    {
      line: 1,
      text: '`switch$` is what the Fire button pushes into — one emission per click, carrying that click’s id.',
    },
    {
      line: 2,
      text: '`switchMap` starts a 700ms `timer` for this id — and if another id arrives before that timer fires, cancels it and starts a fresh one for the new id. Only the most recent survives long enough to fire.',
    },
    {
      line: 3,
      text: 'Every id that does survive gets appended to `switchOut`. Click three times within 700ms of each other and this array gets exactly one entry — the last one.',
    },
    {
      line: 5,
      text: '`merge$` receives the identical clicks as `switch$` — the same `fire()` call feeds both, so the operator is the only thing being compared.',
    },
    {
      line: 6,
      text: '`mergeMap` also starts a 700ms `timer` per id, but never cancels an earlier one. Every timer that starts gets to finish.',
    },
    {
      line: 7,
      text: '`mergeOut` ends up with every id that was ever fired — just not necessarily in firing order, because whichever 700ms timer happens to elapse first reports first.',
    },
  ];

  /** Under the hood: a hand-written pipeable operator. */
  protected readonly operatorSample = `function double(): (source: Observable<number>) => Observable<number> {
  return (source) =>
    new Observable((subscriber) =>
      source.subscribe({
        next: (v) => subscriber.next(v * 2),
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      }),
    );
}

source$.pipe(double()).subscribe(/* ... */);`;

  /** Line-by-line walkthrough of {@link operatorSample}. */
  protected readonly operatorNotes: CodeNote[] = [
    {
      line: 1,
      text: 'This type signature is the definition of a pipeable operator: a function that takes no stream yet, and returns a function from `Observable<number>` to `Observable<number>`. `pipe()` is what actually calls that returned function.',
    },
    {
      line: 2,
      text: '`source` is whatever observable came before `double()` in the chain — it arrives here the moment `pipe()` calls the function `double()` returned.',
    },
    {
      line: 3,
      text: "The operator's entire job is to hand back a brand-new observable — never the original, never a mutated one.",
    },
    {
      line: 4,
      text: 'Subscribing to the new observable is what subscribes to `source` underneath it. Nothing above this line has run anything yet — building the pipe wires up nested functions, and only a `.subscribe()` further downstream pulls a value through all of them.',
    },
    {
      line: 5,
      text: '`next` relays each value from `source`, doubled, to whoever subscribed downstream. This one line is `map`, by hand.',
    },
    {
      line: 6,
      text: '`error` relays a failure through unchanged. Skip this line and a failure vanishes silently instead of reaching a `catchError` further down the chain.',
    },
    {
      line: 7,
      text: '`complete` relays the terminal completion event too. All three channels — `next`, `error`, `complete` — have to be forwarded, or the operator leaks one of them.',
    },
    {
      line: 12,
      text: '`pipe(a, b, c)` is nothing more than calling `a` on the source, `b` on that result, then `c` — function composition. Every operator is a standalone import rather than a method on some global object, which is also why a bundler can tree-shake every one this file never imports.',
    },
  ];

  /** Choices for the catchError-placement check. */
  protected readonly catchOptions: QuizOption[] = [
    {
      text: 'The failed search shows an error, and the next keystroke searches normally',
      why: 'That is what you get when `catchError` is on the *inner* observable — inside the `switchMap` callback. Placed on the outer pipe, it is handling the error after it has already escaped the inner stream.',
    },
    {
      text: 'The search box stops working entirely — no further keystroke does anything',
      correct: true,
      why: 'An error propagating to the outer stream *terminates* it. Observables have exactly one terminal event, and once the source has errored it will never emit again — `catchError` at that level can substitute a replacement observable, but the original keystroke stream is already dead. The input keeps accepting text and nothing happens, with no error in the console because you handled it. Put `catchError` inside the `switchMap` callback, on the inner request, so the failure is contained to that one lookup.',
    },
    {
      text: 'Every subsequent search also returns the fallback value',
      why: 'Closer to the truth in spirit — the pipeline is permanently altered — but nothing returns anything, because nothing runs. The stream is not stuck on a value; it has completed.',
    },
    {
      text: 'Nothing changes; `catchError` behaves the same wherever you put it in the pipe',
      why: 'Position is the entire question with `catchError`. It handles errors coming from *upstream of itself*, and what counts as upstream depends on whether you are inside or outside the flattening callback.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I really need to learn all four flattening operators — all four receptionists?',
      a: "You need `switchMap` and `concatMap` fluently, because between them they cover reads and writes and the wrong one of that pair is a real bug. `exhaustMap` is worth recognising for the one job it is perfect at — a submit button that must not double-fire. `mergeMap` you will mostly meet in other people's code; it is the right answer when the calls are genuinely independent, and the wrong answer whenever order matters.",
    },
    {
      q: 'Why does `debounceTime` need `distinctUntilChanged` next to it?',
      a: 'Because debouncing is about *timing* and says nothing about *value*. Type "ng", delete both characters, retype "ng" slowly enough for the debounce to settle twice, and you have issued the same search twice. `distinctUntilChanged` drops an emission equal to the previous one, so the pair together mean "wait for a pause, and only then if something actually changed."',
    },
    {
      q: 'Is `tap` just for logging?',
      a: 'That is its most common honest use, along with setting a loading flag. The thing to avoid is treating it as a place to *do the work* — writing to a signal, navigating, mutating a store — because `tap` runs per subscription, so a stream with two subscribers runs your side effect twice. If it must happen exactly once, it belongs in the `subscribe` callback or behind a `shareReplay`.',
    },
    {
      q: 'What is the difference between `switchMap` and just using the newest value?',
      a: '`switchMap` actively unsubscribes from the previous inner observable, and for an HTTP request that unsubscribe aborts the network call — the dialogue further up this page is exactly this exchange. So you are not merely ignoring stale answers, you are cancelling the work. Filtering results by hand — checking "is this still the query I want?" in the subscribe — gets you the same UI and pays for every request anyway.',
    },
    {
      q: 'Why is a nested `subscribe` inside a `subscribe` an anti-pattern?',
      a: 'It works, which is why it survives review. What it loses is everything the operator would have given you: no cancellation of the inner stream when the outer emits again, no error propagation to a single handler, and no single subscription to tear down — so the inner ones leak. Every nested subscribe is a `*Map` operator waiting to be written; the only question is which of the four.',
    },
  ];

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
