import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-lesson-rxjs-operators',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · RxJS</span>
      <h1>Core Operators</h1>
      <p class="lead">
        Operators are functions that transform a stream into a new stream. You chain
        them inside <code>.pipe(...)</code> like an assembly line: each operator takes
        the values flowing through, does one job, and passes the result to the next.
        The source is never changed — every operator returns a brand-new Observable.
      </p>

      <h2>The assembly-line idea</h2>
      <div class="code">
        <pre>source$.pipe(
  operatorA,   // value flows in here…
  operatorB,   // …then through here…
  operatorC,   // …and out the bottom
).subscribe(result =&gt; ...);</pre>
      </div>

      <h2>Transforming & filtering (with marbles)</h2>
      <p>Read <code>--1--2--3--|</code> as "emits 1, 2, 3 over time, then completes":</p>
      <div class="code">
        <pre>source:           --1--2--3--4--|

map(x =&gt; x * 10):  --10-20-30-40-|     transform each value
filter(x =&gt; x%2): -----2-----4--|     keep values that pass a test
take(2):           --1--2|             first 2, then complete
tap(log):          --1--2--3--4--|     side effect, value passes through unchanged
scan((a,b)=&gt;a+b):  --1--3--6--10-|     running total (like reduce, but emits each step)
startWith(0):      0-1--2--3--4--|     emit a seed value first</pre>
      </div>

      <h2>Time-based filtering</h2>
      <div class="code">
        <pre>debounceTime(300):        wait for a 300ms PAUSE, then emit the latest
                          (collapses a burst of keystrokes into one)
throttleTime(300):        emit, then ignore for 300ms (rate-limit)
distinctUntilChanged():   drop a value if it equals the previous one
auditTime / sampleTime:   emit the latest value on a timer</pre>
      </div>

      <h2>The flattening operators (higher-order)</h2>
      <p>
        The hardest — and most important — operators handle a stream whose values each
        <em>start another stream</em> (e.g. a keystroke that triggers an HTTP call).
        Your choice controls what happens when a new value arrives while a previous inner
        stream is still running:
      </p>
      <div class="code">
        <pre>outer:          --a------b--------c----
inner per item: (each letter starts a 2-tick request: --1--2|)

switchMap:      --a1-a2--b1--CANCELS-b2|c1--c2   cancel previous, keep newest
mergeMap:       --a1-a2--b1-a?-b2----c1--c2      run ALL at once (concurrent)
concatMap:      --a1-a2----b1-b2----c1-c2        queue, one after another, in order
exhaustMap:     --a1-a2----------c1-c2           ignore new while one is in flight</pre>
      </div>
      <table class="t">
        <tr><td><code>switchMap</code></td><td>Cancel the previous inner stream when a new value arrives. <strong>Type-ahead search</strong> — you only want results for the latest query.</td></tr>
        <tr><td><code>mergeMap</code></td><td>Run all inner streams concurrently. <strong>Independent writes</strong> (e.g. save several items at once).</td></tr>
        <tr><td><code>concatMap</code></td><td>Queue inner streams in order, one completing before the next starts. <strong>Order-sensitive</strong> work.</td></tr>
        <tr><td><code>exhaustMap</code></td><td>Ignore new values while one is in flight. <strong>Submit buttons</strong> — block double-submits.</td></tr>
      </table>

      <h2>Try it — debounced, switchMapped "search"</h2>
      <div class="demo">
        <p class="demo__title">Live — type fast; only the settled query "searches"</p>
        <input
          (input)="onType($any($event.target).value)"
          placeholder="search…"
          style="width:100%;margin-bottom:10px"
        />
        <p>raw keystrokes: <strong>{{ keystrokes() }}</strong></p>
        <p>actual searches fired: <strong style="color:var(--green)">{{ searches() }}</strong></p>
        <p>result: <code>{{ result() }}</code></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          debounceTime(400) + distinctUntilChanged() collapse the bursts;
          switchMap cancels stale lookups so only the last query's result shows.
        </p>
      </div>

      <div class="code">
        <pre>this.query$.pipe(
  debounceTime(400),
  distinctUntilChanged(),
  switchMap(q =&gt; this.api.search(q).pipe(   // ← catchError goes INSIDE
    catchError(() =&gt; of([])),               // so one failure won't kill the outer stream
  )),
).subscribe(r =&gt; this.result.set(r));</pre>
      </div>
      <div class="warn">
        Put <code>catchError</code> on the <strong>inner</strong> stream of a
        <code>switchMap</code>/<code>mergeMap</code>. If an error reaches the
        <em>outer</em> stream, that stream completes and stops reacting to future
        keystrokes — the search box goes dead. All pipeable operators are tree-shakable,
        so you only bundle the ones you import.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Operators chain in <code>.pipe()</code>; each returns a new Observable, never mutating the source.</li>
        <li>Daily drivers: <code>map</code>, <code>filter</code>, <code>tap</code>, <code>debounceTime</code>, <code>distinctUntilChanged</code>, <code>take</code>, <code>scan</code>, <code>startWith</code>.</li>
        <li>Flatten nested streams with <code>switchMap</code>/<code>mergeMap</code>/<code>concatMap</code>/<code>exhaustMap</code> — the choice is about concurrency.</li>
        <li>Type-ahead → <code>switchMap</code>; parallel writes → <code>mergeMap</code>; ordered → <code>concatMap</code>; submit → <code>exhaustMap</code>.</li>
        <li>Marble diagrams are the fastest way to reason about what an operator does.</li>
      </ul>

      <p><a routerLink="/rxjs-subjects">Next: Subjects →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 130px; white-space: nowrap; }`,
  ],
})
export class RxjsOperators implements OnDestroy {
  protected readonly keystrokes = signal(0);
  protected readonly searches = signal(0);
  protected readonly result = signal('—');

  private readonly query$ = new Subject<string>();
  private readonly sub: Subscription;

  constructor() {
    this.sub = this.query$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((q) => {
          this.searches.update((n) => n + 1);
          // simulate an API returning a transformed result
          return of(q).pipe(map((s) => (s ? `found "${s}"` : '—')));
        }),
      )
      .subscribe((r) => this.result.set(r));
  }

  protected onType(value: string) {
    this.keystrokes.update((n) => n + 1);
    this.query$.next(value);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
