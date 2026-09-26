import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  concatMap,
  exhaustMap,
  finalize,
  map,
  mergeMap,
  switchMap,
  timer,
} from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, Chain, Receipt, Scribble } from '../../../shared/shapes';
import type { ReceiptRow } from '../../../shared/shapes';

/**
 * One of the four flattening strategies.
 */
type Strategy = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';

/**
 * Lesson: advanced RxJS — combination operators (with marble diagrams), a LIVE
 * flattening-strategy lab (switchMap/mergeMap/concatMap/exhaustMap racing real
 * timers), subject variants, hot vs cold + shareReplay, error handling with
 * backoff, custom operators, and the signals interop story.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer. The unifying analogy is **a control
 * room watching several camera feeds at once**: a `Subject` variant is a kind
 * of monitor (does it remember anything before you tuned in, and if so, how
 * much?), hot vs cold is whether subscribing STARTS a private screening or
 * JOINS a broadcast already running, `shareReplay` is one shared antenna
 * instead of a private dish per apartment, and the combination operators are
 * the video-wall director deciding what the audience sees when several feeds
 * are live together. That single frame is reused across the Subjects,
 * hot/cold and combining-streams sections rather than invented three times.
 *
 * The flattening four already have a strong analogy elsewhere in the
 * curriculum — the four-receptionists picture in `intermediate/rxjs-operators`
 * — so this lesson leans on the LIVE lab (real 1.5s timers, a real log, a real
 * `finalize` proving cancellation) instead of re-explaining that mental model
 * from scratch, and cross-references it once.
 */
@Component({
  selector: 'app-lesson-rxjs-advanced',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    Chain,
    Receipt,
    Scribble,
  ],
  styleUrl: './rxjs-advanced.css',
  templateUrl: './rxjs-advanced.html',
})
export class RxjsAdvanced {
  /**
   * This component's destroy ref, so subscriptions can be tied to its lifetime.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * First name, as a stream — the left input of the `combineLatest` demo.
   */
  private readonly first$ = new BehaviorSubject('Ada');
  /**
   * Last name, as a stream — the right input.
   */
  private readonly last$ = new BehaviorSubject('Lovelace');

  /**
   * First name, for the template.
   */
  protected readonly first = signal('Ada');
  /**
   * Last name, for the template.
   */
  protected readonly last = signal('Lovelace');
  /**
   * The combined result, produced by the RxJS pipeline rather than a `computed`,
   * so the operator's behaviour is what is on display.
   */
  protected readonly full = signal('');

  // ── flattening lab ──────────────────────────────────────────────────────
  /**
   * The four strategies.
   */
  protected readonly strategies: Strategy[] = ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'];
  /**
   * The strategy the lab is currently using.
   */
  protected readonly strategy = signal<Strategy>('switchMap');
  /**
   * The lab's log, capped so it stays readable.
   */
  protected readonly log = signal<string[]>([]);
  /**
   * The lab's trigger.
   */
  private readonly fires$ = new Subject<number>();
  /**
   * The lab's current subscription, torn down when the strategy changes.
   */
  private labSub?: Subscription;
  /**
   * Sequence source for request ids.
   */
  private reqId = 0;
  /**
   * Which request ids have produced a result — so a dropped one is identifiable
   * rather than merely absent.
   */
  private readonly landed = new Set<number>();

  /**
   * Wires the `combineLatest` demo.
   *
   * `combineLatest` emits whenever **either** source emits, but only once both
   * have emitted at least once — which is why a `BehaviorSubject` (always has a
   * value) makes it behave and a plain `Subject` makes it look broken.
   */
  constructor() {
    combineLatest([this.first$, this.last$])
      .pipe(
        map(([f, l]) => `${f} ${l}`.trim()),
        takeUntilDestroyed(),
      )
      .subscribe((v) => this.full.set(v));

    this.rebuildLab();
    this.destroyRef.onDestroy(() => this.labSub?.unsubscribe());
  }

  /**
   * Sets the first name in both the signal and the stream.
   *
   * @param v The new value.
   */
  protected setFirst(v: string): void {
    this.first.set(v);
    this.first$.next(v);
  }
  /**
   * Sets the last name in both.
   *
   * @param v The new value.
   */
  protected setLast(v: string): void {
    this.last.set(v);
    this.last$.next(v);
  }

  /**
   * Switches the lab to a different strategy and rebuilds the pipeline.
   *
   * Only one line of the pipeline changes. Everything else — the trigger, the
   * inner observable, the logging — is identical, which is what makes the four
   * outputs a fair comparison.
   *
   * @param s The strategy to use.
   */
  protected setStrategy(s: Strategy): void {
    this.strategy.set(s);
    this.rebuildLab(); // swap the pipeline — same clicks, different policy
    this.log.set([]);
    this.reqId = 0;
    this.landed.clear();
  }

  /**
   * Fires one request into the lab.
   *
   * Click it several times in quick succession: `switchMap` keeps only the last,
   * `mergeMap` keeps all of them in whatever order they finish, `concatMap` keeps
   * all of them in order, and `exhaustMap` ignores every click until the current
   * one finishes.
   */
  protected fire(): void {
    const id = ++this.reqId;
    this.push(`→ request #${id} fired`);
    this.fires$.next(id);
  }

  /** Build clicks → (chosen operator) → 1.5s "request" pipeline. */
  private rebuildLab(): void {
    this.labSub?.unsubscribe();
    // one simulated request: 1.5s, then deliver its id back
    const request = (id: number) =>
      timer(1500).pipe(
        map(() => id),
        // finalize fires on complete AND on unsubscribe — so a cancelled
        // inner (switchMap) reports here without ever delivering a value
        finalize(() => {
          if (!this.landed.has(id)) this.push(`   ✗ request #${id} cancelled mid-flight`);
        }),
      );
    const s = this.strategy();
    const flattened$ =
      s === 'switchMap'
        ? this.fires$.pipe(switchMap(request))
        : s === 'mergeMap'
          ? this.fires$.pipe(mergeMap(request))
          : s === 'concatMap'
            ? this.fires$.pipe(concatMap(request))
            : this.fires$.pipe(exhaustMap(request));
    this.labSub = flattened$.subscribe((id) => {
      this.landed.add(id);
      this.push(`   ✓ response #${id} arrived`);
    });
  }

  /**
   * Appends a line to the log, keeping only the most recent.
   *
   * @param line What to log.
   */
  private push(line: string): void {
    this.log.update((l) => [...l, line].slice(-14));
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The RxJS track, for the "you are here" rail. This lesson caps it. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Observables', id: 'rxjs-observables' },
    { label: 'Operators', id: 'rxjs-operators' },
    { label: 'Subjects', id: 'rxjs-subjects' },
    { label: 'RxJS + Signals', id: 'rxjs-interop' },
    { label: 'Advanced RxJS' },
  ];

  // -- Page-shape block: "The Receipt" --

  /** What three fast clicks on a mergeMap-wired save button actually send. */
  protected readonly mergeMapBill: ReceiptRow[] = [
    { label: 'User clicks Save', amount: '×3', tone: 'muted' },
    { label: 'Real POST /orders requests mergeMap fires', amount: '×3', tone: 'warn' },
    { label: 'Requests exhaustMap would have fired instead', amount: '×1', tone: 'muted' },
    {
      label: 'Anything on the client that cancels the earlier two',
      amount: 'nothing',
      tone: 'warn',
    },
  ];

  /** The bill's total — two writes nobody asked for, still in flight. */
  protected readonly mergeMapBillTotal: ReceiptRow = {
    label: 'TOTAL duplicate writes racing your database',
    amount: '2 extra',
  };

  /** What mergeMap does to every click, in order — the mechanism behind the bill above. */
  protected readonly mergeMapChainSteps: readonly string[] = [
    'click fires',
    'mergeMap subscribes',
    'inner POST starts',
    'next click fires',
    'mergeMap subscribes again — no wait',
  ];

  /** The self-test for the mergeMap-on-a-save-button trap. */
  protected readonly mergeMapQuizOptions: QuizOption[] = [
    {
      text: 'One — mergeMap waits for the first request to resolve before subscribing to the next inner observable.',
      why: "That's concatMap's policy — strict order, one at a time. mergeMap makes no such promise; it subscribes to every inner observable the moment it arrives.",
    },
    {
      text: 'One — mergeMap, like switchMap, cancels the first request and starts over with the second click.',
      why: "That's switchMap's policy, and it would be worse here in a different way — cancelling a save mid-flight rather than duplicating it. mergeMap cancels nothing; it just runs both.",
    },
    {
      text: 'Two — mergeMap subscribes to every inner observable immediately, with no concept of "one is already running."',
      correct: true,
      why: "Right. mergeMap's entire job is running inner observables in parallel. It has no memory of what's already in flight, so a second click during the first request's 1.5 seconds doesn't wait, doesn't cancel — it just starts a second, fully independent POST.",
    },
    {
      text: 'Zero — mergeMap holds new clicks in a buffer until something explicitly flushes them.',
      why: 'mergeMap has no buffering step of its own to hold anything back — every value it receives is subscribed to right away, which is exactly why "concurrent" is the word that describes it, not "queued" or "held".',
    },
  ];

  /** The video-wall visual: why `combineLatest` looks silent, then fires twice. */
  protected readonly combineFlow: FlowStep[] = [
    {
      label: '`first$` emits "Ada"',
      detail: 'a BehaviorSubject, so a late subscriber would get this too',
    },
    {
      label: 'combineLatest waits',
      detail: '`last$` has not emitted even once yet — no output at all',
      tone: 'warn',
    },
    {
      label: '`last$` emits "Lovelace"',
      detail: 'NOW every source has spoken at least once',
      tone: 'accent',
    },
    {
      label: 'Fires: "Ada Lovelace"',
      detail: 'and again on every subsequent emit from either side',
      tone: 'good',
    },
  ];

  /** The shareReplay containment picture: which subscribers actually reach the cold source. */
  protected readonly shareCore: Layer = { label: 'GET /api/me', sub: 'the ONE real HTTP request' };
  protected readonly shareRings: Layer[] = [
    {
      label: 'shareReplay({ bufferSize: 1, refCount: true })',
      sub: 'holds the latest value; answers new subscribers from here',
    },
  ];

  /**
   * The catchError-placement dialogue — the two-party mistake learners reliably
   * get backwards: which stream an error actually terminates.
   */
  protected readonly errorTalk: BubbleTurn[] = [
    {
      who: 'The outer stream (`query$`)',
      says: 'A user types → I emit a new query and hand it to `switchMap`.',
    },
    {
      who: '`switchMap`',
      says: 'Got it. I subscribe to a fresh `search(query)` for every value you hand me.',
    },
    {
      who: 'The inner stream (`search$`)',
      says: 'This particular request just failed — I am throwing.',
    },
    {
      who: '`catchError` on the OUTER stream',
      says: "I only watch you, the outer stream. An error anywhere below unsubscribes you completely — and once you're done, you're done. There's nothing left of you to emit next keystroke.",
    },
    {
      who: '`catchError` on the INNER stream',
      says: "I sit right where the error happens, inside switchMap's callback. I swallow it, hand back `of([])`, and the outer stream never even hears about it — next keystroke works fine.",
    },
  ];

  /** The self-test: what a seedless `combineLatest` actually does, and when. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: "Emits 'Ada' paired with `undefined` for the missing side.",
      why: "combineLatest never emits a partial result with a placeholder for a source that hasn't fired yet — there is no such thing as a half-formed emission.",
    },
    {
      text: "Emits nothing — it's still waiting on `last$` to emit at least once.",
      correct: true,
      why: "Exactly. combineLatest requires EVERY source to have emitted at least once before its very first emission. `first$` just emitted; `last$` hasn't yet, so the whole thing stays silent — precisely the trap a `BehaviorSubject` avoids by always having a value ready the instant anything subscribes.",
    },
    {
      text: "Throws, because one of the sources hasn't produced a value yet.",
      why: "A slow source doesn't error combineLatest — it just waits, potentially forever if that source never emits. The failure mode here is silence, not an exception.",
    },
    {
      text: "Emits 'Ada' alone right now, then emits the pair once `last$` catches up.",
      why: "There is no solo first emission to catch up from — combineLatest's output always has one value per source, never fewer. Until every source has spoken once, it produces literally nothing.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Typeahead returns results for an OLD query after fast typing. Diagnose.',
      a: 'Requests were flattened with `mergeMap` (or nested subscribes), so responses land in completion order and a slow early request overwrites a fast later one. `switchMap` cancels the stale request the moment a new query arrives — proven in the lab above.',
    },
    {
      q: 'Why does `shareReplay(1)` without `refCount` leak?',
      a: 'The internal `ReplaySubject` stays subscribed to the source after the last consumer unsubscribes, keeping the producer (socket, timer, HTTP-polling chain) alive forever. `{ bufferSize: 1, refCount: true }` disconnects when the subscriber count hits zero.',
    },
    {
      q: 'Difference between `combineLatest` and `withLatestFrom` in one sentence each?',
      a: "`combineLatest` emits when ANY source emits (all sources are triggers). `withLatestFrom` emits only when the SOURCE stream emits, snapshotting the other streams' latest values (they're passengers, not triggers).",
    },
    {
      q: 'When would you still choose a BehaviorSubject over a signal?',
      a: 'When consumers need the stream API: piping through time-based operators, combining with other observables, or interop with RxJS-first libraries. For plain synchronous state read by templates, the signal wins — less ceremony, no subscription lifecycle, and glitch-free `computed` derivations.',
    },
  ];

  // --- code samples (kept as properties so braces/backticks need no template escaping) ---
  /**
   * Sample: the combination operators — `combineLatest`, `forkJoin`,
   * `withLatestFrom`, `zip` — and what each waits for.
   */
  readonly combineSample = `combineLatest([a$, b$])     // emits whenever EITHER emits (after both have once)
forkJoin([req1$, req2$])    // waits for ALL to complete, emits final values once
withLatestFrom(other$)      // on source emit, snapshot the latest of other$
merge(a$, b$)  zip(a$, b$)  concat(a$, b$)`;

  /** Line-by-line notes for {@link combineSample}. */
  protected readonly combineNotes: CodeNote[] = [
    {
      line: 1,
      text: "combineLatest re-fires on ANY source's emission, but only once every source in the array has emitted at least once — that gate is what makes a slow or seedless source look like it 'breaks' the whole pipeline.",
    },
    {
      line: 2,
      text: 'forkJoin ignores every intermediate value from either source and only cares about completion — it emits exactly once, with the LAST value each stream produced right before it completed. No completion, no emission, ever.',
    },
    {
      line: 3,
      text: "withLatestFrom only fires when the SOURCE — the one it's piped onto — emits; other$ is purely a passenger being sampled for its most recent value, never a trigger in its own right.",
    },
    {
      line: 4,
      text: 'Three more in one line: merge interleaves raw values from both with no pairing at all; zip pairs emissions strictly by index (1st with 1st, 2nd with 2nd), stalling on whichever side is slower; concat runs a$ to completion before ever subscribing to b$.',
    },
  ];

  /**
   * Sample: the same operators as marble diagrams, which is the notation the RxJS
   * docs and every test use.
   */
  readonly marbleSample = `a$:  --1--------2--------3----------|
b$:  -----A--------B-----------------|

combineLatest([a,b])  — newest of BOTH, on any emit:
     -----1A--2A--2B---3B-----------|

zip([a,b])            — pair by INDEX, wait for both:
     -----1A-------2B----------------|     (3 waits for b's 3rd, never comes)

withLatestFrom(b)     — sample on a$, ignore b$'s own emits:
     -----------2A-----3B-----------|     (1 dropped: b hadn't emitted yet)

forkJoin([a,b])       — only the LAST of each, on complete:
     ---------------------------3B--|     (one emission, at the very end)`;

  /**
   * Sample: the lab's pipeline, with the one line that differs between the four
   * strategies marked.
   */
  readonly labSample = `this.fires$.pipe(
  // the ONLY line that changes between the four demos:
  switchMap((id) => fakeRequest(id)),   // or mergeMap / concatMap / exhaustMap
).subscribe((id) => log('response #' + id));

// switchMap  : new click UNSUBSCRIBES the in-flight request (finalize proves it)
// mergeMap   : requests overlap; responses arrive by completion order
// concatMap  : requests queue; strict click order, one at a time
// exhaustMap : clicks during a flight never even create a request`;

  /** Line-by-line notes for {@link labSample}. */
  protected readonly labNotes: CodeNote[] = [
    {
      line: 1,
      text: 'fires$ is the Subject that fire() calls .next() on — one event per click, carrying nothing but a request id.',
    },
    {
      line: 3,
      text: 'This is the ENTIRE difference between the four demos below: swap this one operator for mergeMap, concatMap or exhaustMap and nothing else in the pipeline changes — proof that flattening strategy is orthogonal to everything else in the pipe.',
    },
    {
      line: 4,
      text: 'The subscribe is identical for all four strategies too — it just logs whatever id lands. Every difference you see in the log comes from the ONE swapped operator above, not from anything here.',
    },
    {
      line: 6,
      text: "finalize inside the simulated request (see rebuildLab in the component) runs when switchMap unsubscribes a stale inner observable, which is what makes a cancelled request provably different from one that's merely slow.",
    },
  ];

  /**
   * Sample: multicasting. A cold HTTP observable behind two `async` pipes is two
   * requests; `shareReplay` makes it one.
   */
  readonly shareSample = `// COLD: every subscriber re-runs the producer — two async pipes = two GETs
readonly user$ = this.http.get<User>('/api/me');

// SHARED: one GET, latest value replayed to late subscribers,
// torn down when the last subscriber leaves
readonly user$ = this.http.get<User>('/api/me').pipe(
  shareReplay({ bufferSize: 1, refCount: true }),
);`;

  /** Line-by-line notes for {@link shareSample}. */
  protected readonly shareNotes: CodeNote[] = [
    {
      line: 2,
      text: 'HttpClient observables are cold: nothing is sent over the network until something calls .subscribe() (which the async pipe does for you) — and each separate subscribe re-runs the producer from scratch, as its own independent HTTP request.',
    },
    {
      line: 6,
      text: "Same source, but piped through an operator before it's ever subscribed — the pipe wraps the cold producer once, and every subscriber shares whatever that one wrapped instance does.",
    },
    {
      line: 7,
      text: 'bufferSize: 1 keeps only the latest value ready to replay to a late subscriber; refCount: true counts active subscribers and tears the real HTTP subscription down — and stops caching — the instant that count hits zero, so nothing leaks. Drop refCount and the subscription never closes on its own.',
    },
  ];

  /**
   * Sample: error handling — `retry` with exponential backoff, then `catchError`
   * for the fallback. Order matters: `catchError` before `retry` swallows the
   * error the retry was supposed to see.
   */
  readonly errorSample = `source$.pipe(
  retry({
    count: 3,
    delay: (err: HttpErrorResponse, n) =>
      err.status === 0 || err.status >= 500
        ? timer(2 ** n * 500)    // network/5xx — worth another attempt
        : throwError(() => err), // 4xx — fails immediately, no retry
  }),
  catchError((err) => of(FALLBACK)),        // AFTER retry — swap in a fallback
  finalize(() => this.loading.set(false)),  // success, error or unsubscribe
);

// typeahead: catch on the INNER stream or one bad request kills the search
query$.pipe(
  switchMap((q) => this.api.search(q).pipe(
    catchError(() => of([])),               // this stream dies; the outer lives on
  )),
);

// mergeMap's concurrency cap, made concrete — a bounded upload queue:
uploads$.pipe(mergeMap((file) => upload(file), 2));  // at most 2 in flight

// concatMap is just mergeMap with the cap pinned to 1:
concatMap(fn)  ===  mergeMap(fn, 1)`;

  /** Line-by-line notes for {@link errorSample}. */
  protected readonly errorNotes: CodeNote[] = [
    {
      line: 2,
      text: 'retry re-subscribes to source$ from scratch on error, up to count: 3 times — but only for the errors delay decides are worth it. Getting this wrong is the standard mistake: retry taught as unconditional retries a mutation on every failure, including ones that will never succeed.',
    },
    {
      line: 5,
      text: "status === 0 (the request never reached the server — offline, DNS, CORS) or a 5xx is transient, so it's worth another attempt after a backoff. A 4xx (bad request, unauthorized, not found) will fail again instantly no matter how many times you retry it — so it doesn't get one.",
    },
    {
      line: 6,
      text: 'timer(2 ** n * 500) is the actual backoff schedule: 500ms, then 1000ms, then 2000ms. Returning an observable here is what delay wants — retry waits for IT to emit before resubscribing.',
    },
    {
      line: 7,
      text: 'throwError(() => err) re-throws immediately instead of scheduling another attempt — this is what makes the 4xx branch fail fast instead of waiting through three pointless backoffs.',
    },
    {
      line: 9,
      text: 'Placement is everything: because catchError comes AFTER retry in the pipe, it only ever sees an error once retry has given up (either the count ran out, or line 7 re-threw a 4xx immediately) — a last resort, not competing with retry for the same failures.',
    },
    {
      line: 10,
      text: "finalize runs no matter how the stream ends — value, error, or the subscriber walking away early — which is why it's the right place for cleanup like a loading flag, and retry/catchError are the wrong place: they only see specific outcomes, not all of them.",
    },
    {
      line: 15,
      text: 'The inner pipe — the one search(q) itself goes through — is where catchError is attached here, not the outer query$.pipe(...). That placement is the entire point of this example.',
    },
    {
      line: 16,
      text: "Because this catchError sits INSIDE switchMap's callback, it only ever terminates the CURRENT inner search. The outer query$ stream never sees an error and never completes, so the next keystroke starts a perfectly normal new search.",
    },
    {
      line: 21,
      text: "The second argument to mergeMap is the concurrency cap the table above only mentions in parentheses — with it set to 2, a third file's upload() call doesn't even start until one of the first two completes, instead of all of them racing at once.",
    },
    {
      line: 24,
      text: "concatMap isn't a fourth, separate strategy — it's mergeMap with its concurrency cap pinned to exactly 1, which is why it queues strictly one at a time. Same operator, one number different.",
    },
  ];

  /**
   * Rule of thumb tying the retry rewrite above back to a decision, not just a snippet.
   */
  protected readonly retryIdempotencyRule =
    'Retry a GET freely — reading twice is harmless. Retry a mutation (POST/PATCH/DELETE) only if the endpoint is genuinely idempotent, or you attach an idempotency key the server can use to recognise a repeat.';

  /**
   * Sample: writing a custom operator, which is just a function from observable to
   * observable.
   */
  readonly customOpSample = `function logEach<T>(tag: string) {
  return (source$: Observable<T>) =>
    source$.pipe(tap((v) => console.log(tag, v)));
}

stream$.pipe(logEach('debug'), map(double));`;

  /** Line-by-line notes for {@link customOpSample}. */
  protected readonly customOpNotes: CodeNote[] = [
    {
      line: 1,
      text: "A custom operator is just a function that takes config (tag here) and RETURNS the real operator function — this outer function is what you actually call inside a .pipe(), e.g. logEach('debug').",
    },
    {
      line: 2,
      text: "The returned function is the real operator: it takes one observable in (source$) and must return one observable out. That signature — Observable in, Observable out — is the entire contract, and RxJS's own operators follow the exact same shape.",
    },
    {
      line: 3,
      text: 'Delegates to an existing operator rather than manually subscribing and emitting — tap runs a side effect (the console.log) without touching the values flowing through, so logEach is transparent to everything downstream.',
    },
    {
      line: 6,
      text: 'Reads left to right like any other operator in the pipe, indistinguishable from map or filter to anyone using it — which is the payoff: once written, a custom operator is a first-class citizen of the pipe.',
    },
  ];

  /**
   * Sample: the interop bridges, for when signals are the better shape for the
   * result.
   */
  readonly interopSample = `// observable → signal (template-friendly, no subscribe/unsubscribe)
readonly user = toSignal(this.http.get<User>('/api/me'));

// signal → observable → signal: debounce a search box
readonly query = signal('');
readonly results = toSignal(
  toObservable(this.query).pipe(
    debounceTime(300),
    switchMap((q) => this.api.search(q)),
  ),
  { initialValue: [] },
);`;

  /** Line-by-line notes for {@link interopSample}. */
  protected readonly interopNotes: CodeNote[] = [
    {
      line: 2,
      text: 'toSignal subscribes for you and keeps a signal in sync with the latest emission — no manual .subscribe(), and the subscription tears down automatically when the injection context is destroyed. Until the first value arrives the signal reads undefined, unless you pass an initialValue.',
    },
    {
      line: 7,
      text: 'toObservable is the mirror bridge: it wraps a signal in an observable that emits whenever the signal changes, which is what lets query — plain synchronous state — enter a world of time-based operators like debounceTime at all.',
    },
    {
      line: 9,
      text: 'Right back to toSignal at line 6, so results ends up as an ordinary signal in the template — the RxJS pipeline is an implementation detail sandwiched between two signal reads, invisible to whatever renders results().',
    },
    {
      line: 11,
      text: "initialValue is required here because until the debounced pipeline's first emission arrives there's nothing to show — without it, results() would read undefined and every template use would need a null check.",
    },
  ];
}
