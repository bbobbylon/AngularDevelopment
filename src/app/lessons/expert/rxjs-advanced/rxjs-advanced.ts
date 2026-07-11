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
 * Lesson: advanced RxJS — combination operators (with marble diagrams), a LIVE
 * flattening-strategy lab (switchMap/mergeMap/concatMap/exhaustMap racing real
 * timers), subject variants, hot vs cold + shareReplay, error handling with
 * backoff, custom operators, and the signals interop story.
 */

type Strategy = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';

@Component({
  selector: 'app-lesson-rxjs-advanced',
  imports: [RouterLink],
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 260px; }

     table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
     table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
     table.cmp th { background: var(--bg-elevated); }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }

     .lab-log { background: var(--code-bg); color: var(--code-fg); border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: .82rem; min-height: 120px; max-height: 200px; overflow: auto; margin-top: 10px; }
     .lab-log div { padding: 1px 0; }
     .strat button.on { outline: 2px solid var(--blue); }`,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · RxJS</span>
      <h1>Advanced RxJS</h1>
      <p class="lead">
        Once observables underpin your data flow, two skills separate senior code from
        junior code: <strong>combining streams</strong> declaratively, and choosing the
        right <strong>flattening strategy</strong> for nested async work. This page has
        live laboratories for both, then covers subjects, hot/cold sharing, error
        recovery, custom operators, and where signals take over.
      </p>

      <h2>Combining streams</h2>
      <div class="code"><pre>{{ combineSample }}</pre></div>

      <h2>The difference in one picture</h2>
      <p>Given the same two inputs, each operator produces a different output:</p>
      <div class="code"><pre>{{ marbleSample }}</pre></div>

      <h2>Live #1 — combineLatest</h2>
      <div class="demo">
        <p class="demo__title">Live — two streams joined into a greeting</p>
        <div class="field">
          <label>First name</label>
          <input [value]="first()" (input)="setFirst($any($event.target).value)" />
        </div>
        <div class="field">
          <label>Last name</label>
          <input [value]="last()" (input)="setLast($any($event.target).value)" />
        </div>
        <p class="row"><span class="pill" style="color:var(--green)">combined: {{ full() }}</span></p>
      </div>

      <h2>Higher-order observables — the flattening four</h2>
      <p>
        A <code>map</code> that returns an observable gives you an observable <em>of
        observables</em>. The flattening operators subscribe to those inner streams for
        you — and differ only in their <strong>concurrency policy</strong>:
      </p>
      <table class="cmp">
        <tr><th>Operator</th><th>When a new outer value arrives while an inner is running…</th><th>Canonical use</th></tr>
        <tr><td><code>switchMap</code></td><td><strong>cancel</strong> the running inner, switch to the new one</td><td>typeahead search, route param → detail fetch (only the latest matters)</td></tr>
        <tr><td><code>mergeMap</code></td><td>run them <strong>in parallel</strong> (optional concurrency cap)</td><td>independent side-by-side requests, fire-and-forget logging</td></tr>
        <tr><td><code>concatMap</code></td><td><strong>queue</strong> it — strict order, one at a time</td><td>writes that must not interleave (audit trails, sequential saves)</td></tr>
        <tr><td><code>exhaustMap</code></td><td><strong>ignore</strong> it until the running inner completes</td><td>submit buttons, login — swallow double-clicks</td></tr>
      </table>

      <h2>Live #2 — the flattening lab</h2>
      <p>
        Pick a strategy, then hammer "fire request" a few times fast. Every request is
        a real 1.5-second timer; the log shows what each policy does with the overlap:
      </p>
      <div class="demo">
        <p class="demo__title">Live — same clicks, four different concurrency policies</p>
        <div class="row strat">
          @for (s of strategies; track s) {
            <button [class.on]="strategy() === s" (click)="setStrategy(s)">{{ s }}</button>
          }
        </div>
        <div class="row" style="margin-top:10px">
          <button (click)="fire()">fire request (takes 1.5s)</button>
          <button class="ghost" (click)="log.set([])">clear log</button>
        </div>
        <div class="lab-log">
          @if (!log().length) {
            <div style="opacity:.6">— click "fire request" a few times quickly —</div>
          }
          @for (line of log(); track $index) {
            <div>{{ line }}</div>
          }
        </div>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:6px">
          <strong>switchMap</strong>: earlier requests report "cancelled" — only the
          last response lands. <strong>mergeMap</strong>: all responses land, ordered by
          <em>completion</em>. <strong>concatMap</strong>: all land, in click order,
          1.5s apart — later ones wait in the queue. <strong>exhaustMap</strong>: clicks
          during a flight are ignored so those requests never even start.
        </p>
      </div>
      <div class="code"><pre>{{ labSample }}</pre></div>

      <h2>Subject varieties</h2>
      <table class="cmp">
        <tr><th>Type</th><th>What a NEW subscriber receives</th><th>Typical job</th></tr>
        <tr><td><code>Subject</code></td><td>only values emitted after subscribing</td><td>event bus, imperative → reactive bridge</td></tr>
        <tr><td><code>BehaviorSubject(seed)</code></td><td>the current value immediately, then updates</td><td>state holders (pre-signals); requires an initial value; has <code>.value</code></td></tr>
        <tr><td><code>ReplaySubject(n)</code></td><td>the last <code>n</code> values, even from before subscribing</td><td>late subscribers needing history (e.g. last route event)</td></tr>
        <tr><td><code>AsyncSubject</code></td><td>only the final value, only on complete</td><td>rare — "result of a computation" semantics</td></tr>
      </table>

      <h2>Hot vs cold — and shareReplay</h2>
      <div class="code"><pre>{{ shareSample }}</pre></div>
      <p>
        A cold observable (like every <code>HttpClient</code> call) runs its producer
        <em>per subscriber</em> — two <code>async</code> pipes on the same stream means
        two HTTP requests. <code>shareReplay(&#123; bufferSize: 1, refCount: true &#125;)</code>
        multicasts one execution to all subscribers and replays the latest value to
        late arrivals; <code>refCount: true</code> tears the source down when the last
        subscriber leaves (without it, the subscription — and a socket or timer behind
        it — leaks forever).
      </p>

      <h2>Error handling &amp; retries</h2>
      <div class="code"><pre>{{ errorSample }}</pre></div>
      <ul>
        <li><strong>Errors travel the pipe like values</strong> — the first operator that handles one decides the stream's fate. Order matters: <code>retry</code> must sit <em>before</em> <code>catchError</code>, or there is nothing left to retry.</li>
        <li><strong>An error unsubscribes the source.</strong> The classic bug: <code>catchError</code> on the <em>outer</em> typeahead stream kills the whole search after one failed request. Handle errors on the <strong>inner</strong> stream (inside the <code>switchMap</code>).</li>
        <li><code>finalize</code> runs on complete, error <em>and</em> unsubscribe — the right home for "loading = false".</li>
      </ul>

      <h2>Custom operators</h2>
      <p>An operator is just a function from <code>Observable</code> to <code>Observable</code>:</p>
      <div class="code"><pre>{{ customOpSample }}</pre></div>

      <h2>Where signals take over</h2>
      <table class="cmp">
        <tr><th>Concern</th><th>Reach for</th></tr>
        <tr><td>synchronous state + derivations</td><td>signals: <code>signal</code>/<code>computed</code> — no subscription management at all</td></tr>
        <tr><td>events over time: debounce, cancellation, races, retries</td><td>RxJS — signals have no time axis</td></tr>
        <tr><td>observable → template</td><td><code>toSignal(obs$, &#123; initialValue &#125;)</code> (or the <code>async</code> pipe)</td></tr>
        <tr><td>signal → observable world (e.g. debounce a signal)</td><td><code>toObservable(sig)</code>, pipe, then <code>toSignal</code> back</td></tr>
      </table>
      <div class="code"><pre>{{ interopSample }}</pre></div>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr>
          <td><code>combineLatest</code> seems silent</td>
          <td>It emits nothing until <em>every</em> source has emitted once. Seed slow inputs with <code>startWith(initial)</code>.</td>
        </tr>
        <tr>
          <td><code>forkJoin</code> never fires</td>
          <td>It needs every source to <strong>complete</strong>. HTTP calls complete; <code>interval</code>/<code>fromEvent</code> don't — cap them with <code>take(n)</code> or use <code>combineLatest</code>.</td>
        </tr>
        <tr>
          <td>One failed request kills <code>forkJoin</code></td>
          <td>A single error rejects the whole join. <code>catchError(() =&gt; of(null))</code> per inner stream to keep the others.</td>
        </tr>
        <tr>
          <td>Re-running an HTTP call per subscriber</td>
          <td>Each <code>subscribe</code> re-fires a cold stream. Share with <code>shareReplay({{ '{' }} bufferSize: 1, refCount: true {{ '}' }})</code>.</td>
        </tr>
        <tr>
          <td><code>catchError</code> after <code>retry</code> but expecting more retries</td>
          <td>Once <code>catchError</code> swaps in a fallback the stream completes — order operators as <code>retry</code> → <code>catchError</code>.</td>
        </tr>
        <tr>
          <td>Nesting <code>subscribe</code> inside <code>subscribe</code></td>
          <td>Use a flattening operator (<code>switchMap</code>/<code>mergeMap</code>/…) instead — it manages the inner subscription for you.</td>
        </tr>
        <tr>
          <td>Search dies after one HTTP error</td>
          <td><code>catchError</code> sat on the outer stream, so the error completed the whole pipeline. Catch inside the flattening operator's inner observable.</td>
        </tr>
      </table>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>A save button double-submits under fast clicks. Which operator, and why not switchMap?</summary>
        <div><code>exhaustMap</code>: it ignores new outer values while the inner
        request is in flight, so the duplicate click does nothing.
        <code>switchMap</code> would <em>cancel the in-flight save</em> and fire a
        second one — worse than the bug you started with.</div>
      </details>
      <details class="qa">
        <summary>Typeahead returns results for an OLD query after fast typing. Diagnose.</summary>
        <div>Requests were flattened with <code>mergeMap</code> (or nested
        subscribes), so responses land in completion order and a slow early request
        overwrites a fast later one. <code>switchMap</code> cancels the stale request
        the moment a new query arrives — proven in the lab above.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>shareReplay(1)</code> without <code>refCount</code> leak?</summary>
        <div>The internal <code>ReplaySubject</code> stays subscribed to the source
        after the last consumer unsubscribes, keeping the producer (socket, timer,
        HTTP-polling chain) alive forever. <code>&#123; bufferSize: 1, refCount: true &#125;</code>
        disconnects when the subscriber count hits zero.</div>
      </details>
      <details class="qa">
        <summary>Difference between <code>combineLatest</code> and <code>withLatestFrom</code> in one sentence each?</summary>
        <div><code>combineLatest</code> emits when <em>any</em> source emits (all
        sources are triggers). <code>withLatestFrom</code> emits only when the
        <em>source</em> stream emits, snapshotting the other streams' latest values
        (they're passengers, not triggers).</div>
      </details>
      <details class="qa">
        <summary>When would you still choose a BehaviorSubject over a signal?</summary>
        <div>When consumers need the <em>stream</em> API: piping through time-based
        operators, combining with other observables, or interop with RxJS-first
        libraries. For plain synchronous state read by templates, the signal wins —
        less ceremony, no subscription lifecycle, and glitch-free
        <code>computed</code> derivations.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>combineLatest</code>/<code>forkJoin</code>/<code>withLatestFrom</code> compose streams — know which ones trigger and which need completion.</li>
        <li>The flattening four differ only in concurrency policy: cancel (<code>switchMap</code>), parallel (<code>mergeMap</code>), queue (<code>concatMap</code>), ignore (<code>exhaustMap</code>).</li>
        <li>Handle errors on the inner stream; order <code>retry</code> before <code>catchError</code>; <code>finalize</code> for cleanup.</li>
        <li>Share cold streams with <code>shareReplay(&#123; bufferSize: 1, refCount: true &#125;)</code>.</li>
        <li>Signals own synchronous state; RxJS owns time. <code>toSignal</code>/<code>toObservable</code> are the bridge.</li>
      </ul>

      <p><a routerLink="/security">Next: Security &amp; Sanitization →</a></p>
    </article>
  `,
})
export class RxjsAdvanced {
  private readonly destroyRef = inject(DestroyRef);

  private readonly first$ = new BehaviorSubject('Ada');
  private readonly last$ = new BehaviorSubject('Lovelace');

  protected readonly first = signal('Ada');
  protected readonly last = signal('Lovelace');
  protected readonly full = signal('');

  // ── flattening lab ──────────────────────────────────────────────────────
  protected readonly strategies: Strategy[] = ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'];
  protected readonly strategy = signal<Strategy>('switchMap');
  protected readonly log = signal<string[]>([]);
  private readonly fires$ = new Subject<number>();
  private labSub?: Subscription;
  private reqId = 0;
  private readonly landed = new Set<number>();

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

  protected setFirst(v: string): void {
    this.first.set(v);
    this.first$.next(v);
  }
  protected setLast(v: string): void {
    this.last.set(v);
    this.last$.next(v);
  }

  protected setStrategy(s: Strategy): void {
    this.strategy.set(s);
    this.rebuildLab(); // swap the pipeline — same clicks, different policy
    this.log.set([]);
    this.reqId = 0;
    this.landed.clear();
  }

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

  private push(line: string): void {
    this.log.update((l) => [...l, line].slice(-14));
  }

  // ── code samples ────────────────────────────────────────────────────────
  readonly combineSample = `combineLatest([a$, b$])     // emits whenever EITHER emits (after both have once)
forkJoin([req1$, req2$])    // waits for ALL to complete, emits final values once
withLatestFrom(other$)      // on source emit, snapshot the latest of other$
merge(a$, b$)  zip(a$, b$)  concat(a$, b$)`;

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

  readonly labSample = `this.fires$.pipe(
  // the ONLY line that changes between the four demos:
  switchMap((id) => fakeRequest(id)),   // or mergeMap / concatMap / exhaustMap
).subscribe((id) => log('response #' + id));

// switchMap  : new click UNSUBSCRIBES the in-flight request (finalize proves it)
// mergeMap   : requests overlap; responses arrive by completion order
// concatMap  : requests queue; strict click order, one at a time
// exhaustMap : clicks during a flight never even create a request`;

  readonly shareSample = `// COLD: every subscriber re-runs the producer — two async pipes = two GETs
readonly user$ = this.http.get<User>('/api/me');

// SHARED: one GET, latest value replayed to late subscribers,
// torn down when the last subscriber leaves
readonly user$ = this.http.get<User>('/api/me').pipe(
  shareReplay({ bufferSize: 1, refCount: true }),
);`;

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

  readonly customOpSample = `function logEach<T>(tag: string) {
  return (source$: Observable<T>) =>
    source$.pipe(tap((v) => console.log(tag, v)));
}

stream$.pipe(logEach('debug'), map(double));`;

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
