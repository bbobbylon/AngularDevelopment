import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-lesson-rxjs-advanced',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · RxJS</span>
      <h1>Advanced RxJS</h1>
      <p class="lead">
        Once observables underpin your data flow, combination operators let you compose
        multiple streams declaratively — joining the latest values, waiting for several
        requests, or sampling one stream when another fires — with built-in error
        handling and retries.
      </p>

      <h2>Combining streams</h2>
      <div class="code">
        <pre>combineLatest([a$, b$])     // emits whenever EITHER emits (after both have once)
forkJoin([req1$, req2$])    // waits for ALL to complete, emits final values once
withLatestFrom(other$)      // on source emit, snapshot the latest of other$
merge(a$, b$)  zip(a$, b$)  concat(a$, b$)</pre>
      </div>

      <h2>The difference in one picture</h2>
      <p>Given the same two inputs, each operator produces a different output:</p>
      <div class="code">
        <pre>a$:  --1--------2--------3----------|
b$:  -----A--------B-----------------|

combineLatest([a,b])  — newest of BOTH, on any emit:
     -----1A--2A--2B---3B-----------|

zip([a,b])            — pair by INDEX, wait for both:
     -----1A-------2B----------------|     (3 waits for b's 3rd, never comes)

withLatestFrom(b)     — sample on a$, ignore b$'s own emits:
     -----------2A-----3B-----------|     (1 dropped: b hadn't emitted yet)

forkJoin([a,b])       — only the LAST of each, on complete:
     ---------------------------3B--|     (one emission, at the very end)</pre>
      </div>

      <h2>Try it — combineLatest</h2>
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

      <h2>Error handling &amp; retries</h2>
      <div class="code">
        <pre>source$.pipe(
  retry({{ '{' }} count: 3, delay: 500 {{ '}' }}),                 // re-subscribe on error
  catchError((err) =&gt; of(FALLBACK)),            // swap in a fallback value
  finalize(() =&gt; this.loading.set(false)),      // always runs (success or error)
);</pre>
      </div>

      <h2>Custom operators</h2>
      <p>An operator is just a function from <code>Observable</code> to <code>Observable</code>:</p>
      <div class="code">
        <pre>function logEach&lt;T&gt;(tag: string) {{ '{' }}
  return (source$: Observable&lt;T&gt;) =&gt;
    source$.pipe(tap((v) =&gt; console.log(tag, v)));
{{ '}' }}

stream$.pipe(logEach('debug'), map(double));</pre>
      </div>

      <div class="tip">
        Remember the flattening four for nested subscriptions:
        <code>switchMap</code> (cancel previous — typeahead), <code>mergeMap</code>
        (parallel), <code>concatMap</code> (queue, in order),
        <code>exhaustMap</code> (ignore while busy — submit buttons).
      </div>
      <div class="warn">
        Gotchas: <code>combineLatest</code> emits nothing until <em>every</em> source has
        emitted once — seed laggards with <code>startWith</code>.
        <code>forkJoin</code> requires every source to <strong>complete</strong> (HTTP
        calls do; an <code>interval</code> never will, so it hangs forever). And cache
        shared streams with <code>shareReplay({{ '{' }} bufferSize: 1, refCount: true {{ '}' }})</code> —
        <code>refCount</code> prevents the subscription from leaking after the last
        consumer leaves.
      </div>

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
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>combineLatest</code>/<code>forkJoin</code>/<code>withLatestFrom</code> compose multiple streams.</li>
        <li><code>retry</code>, <code>catchError</code>, <code>finalize</code> handle failures gracefully.</li>
        <li>A custom operator is a plain <code>Observable → Observable</code> function.</li>
        <li>Pick the right flattening operator for the concurrency you want.</li>
      </ul>

      <p><a routerLink="/security">Next: Security &amp; Sanitization →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 260px; }`,
  ],
})
export class RxjsAdvanced {
  private readonly first$ = new BehaviorSubject('Ada');
  private readonly last$ = new BehaviorSubject('Lovelace');

  protected readonly first = signal('Ada');
  protected readonly last = signal('Lovelace');
  protected readonly full = signal('');

  constructor() {
    combineLatest([this.first$, this.last$])
      .pipe(
        map(([f, l]) => `${f} ${l}`.trim()),
        takeUntilDestroyed(),
      )
      .subscribe((v) => this.full.set(v));
  }

  protected setFirst(v: string): void {
    this.first.set(v);
    this.first$.next(v);
  }
  protected setLast(v: string): void {
    this.last.set(v);
    this.last$.next(v);
  }
}
