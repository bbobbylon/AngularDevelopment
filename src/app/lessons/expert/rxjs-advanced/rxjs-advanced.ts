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

/**
 * One of the four flattening strategies.
 */
type Strategy = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';

/**
 * Lesson: advanced RxJS — combination operators (with marble diagrams), a LIVE
 * flattening-strategy lab (switchMap/mergeMap/concatMap/exhaustMap racing real
 * timers), subject variants, hot vs cold + shareReplay, error handling with
 * backoff, custom operators, and the signals interop story.
 */
@Component({
  selector: 'app-lesson-rxjs-advanced',
  imports: [RouterLink],
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

  // ── code samples ────────────────────────────────────────────────────────
  /**
   * Sample: the combination operators — `combineLatest`, `forkJoin`,
   * `withLatestFrom`, `zip` — and what each waits for.
   */
  readonly combineSample = `combineLatest([a$, b$])     // emits whenever EITHER emits (after both have once)
forkJoin([req1$, req2$])    // waits for ALL to complete, emits final values once
withLatestFrom(other$)      // on source emit, snapshot the latest of other$
merge(a$, b$)  zip(a$, b$)  concat(a$, b$)`;

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

  /**
   * Sample: error handling — `retry` with exponential backoff, then `catchError`
   * for the fallback. Order matters: `catchError` before `retry` swallows the
   * error the retry was supposed to see.
   */
  readonly errorSample = `source$.pipe(
  retry({ count: 3, delay: (err, n) => timer(2 ** n * 500) }), // exponential backoff
  catchError((err) => of(FALLBACK)),        // AFTER retry — swap in a fallback
  finalize(() => this.loading.set(false)),  // success, error or unsubscribe
);

// typeahead: catch on the INNER stream or one bad request kills the search
query$.pipe(
  switchMap((q) => this.api.search(q).pipe(
    catchError(() => of([])),               // this stream dies; the outer lives on
  )),
);`;

  /**
   * Sample: writing a custom operator, which is just a function from observable to
   * observable.
   */
  readonly customOpSample = `function logEach<T>(tag: string) {
  return (source$: Observable<T>) =>
    source$.pipe(tap((v) => console.log(tag, v)));
}

stream$.pipe(logEach('debug'), map(double));`;

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
}
