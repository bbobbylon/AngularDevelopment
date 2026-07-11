import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Promises & async/await — the three promise states and what await
 * desugars to, microtask vs macrotask ordering with a live log demo, error
 * handling including the return-await subtlety, all four combinators with
 * their failure semantics, a live sequential-vs-parallel timing race, and the
 * Promise/Observable bridge Angular code crosses daily.
 */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Component({
  selector: 'app-lesson-ts-async',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Promises & async/await</h1>
      <p class="lead">
        A <code>Promise</code> is a one-shot state machine for a value that arrives
        later: it starts <em>pending</em> and settles exactly once — to
        <em>fulfilled</em> with a value or <em>rejected</em> with a reason — and
        never changes again. <code>async/await</code> is syntax over that machine,
        not a different mechanism. Understanding what <code>await</code> actually
        does (suspend the function, queue a microtask) explains every ordering
        surprise on this page, and sets up the contrast with Angular's Observables.
      </p>

      <h2>Creating &amp; consuming</h2>
      <div class="code"><pre>const wait = (ms: number) =&gt;
  new Promise&lt;void&gt;(resolve =&gt; setTimeout(resolve, ms));

// .then chaining — each .then returns a NEW promise, which is why chains work:
wait(500).then(() =&gt; 'done').then(msg =&gt; console.log(msg)).catch(err =&gt; …);

// async/await (preferred)
async function run() {{ '{' }}
  await wait(500);
  console.log('done');
{{ '}' }}</pre></div>
      <ul>
        <li><strong>An <code>async</code> function always returns a Promise</strong> — <code>return 5</code> becomes <code>Promise&lt;number&gt;</code>; a thrown error becomes a rejection. The caller can't tell whether you used await or raw .then internally.</li>
        <li><strong><code>await x</code> works on any "thenable"</strong>, and unwraps nested promises fully — you never get <code>Promise&lt;Promise&lt;T&gt;&gt;</code>. (The type-level mirror is <code>Awaited&lt;T&gt;</code>.)</li>
        <li><strong>Promises are eager:</strong> the executor function runs the moment <code>new Promise(…)</code> executes — before any .then is attached. This is the deepest contrast with lazy Observables.</li>
      </ul>

      <h2>What <code>await</code> desugars to</h2>
      <div class="code"><pre>async function f() {{ '{' }}
  const a = await getA();      // ≈ getA().then(a =&gt; {{ '{' }} …rest of the function… {{ '}' }})
  return a + 1;
{{ '}' }}</pre></div>
      <p>
        At each <code>await</code>, the function <em>suspends</em>: everything after
        the await is packaged as a continuation and scheduled as a
        <strong>microtask</strong> once the awaited promise settles. The function
        returns to its caller immediately at the first await — async functions run
        synchronously <em>up to</em> the first await, then yield. Nothing blocks;
        the event loop keeps servicing other work while the promise is pending.
      </p>

      <h2>Microtasks vs macrotasks — watch the order</h2>
      <div class="code"><pre>console.log('1: sync');
setTimeout(() =&gt; console.log('4: macrotask (timer)'));
Promise.resolve().then(() =&gt; console.log('3: microtask'));
console.log('2: sync');</pre></div>
      <div class="demo">
        <p class="demo__title">Live — run exactly that code and watch the log</p>
        <div class="row" style="margin-bottom:8px">
          <button (click)="runOrder()">Run</button>
          <button class="ghost" (click)="orderLog.set([])">Clear</button>
        </div>
        @if (orderLog().length) {
          <div class="code"><pre>{{ orderLog().join('\\n') }}</pre></div>
        } @else {
          <p style="color:var(--text-muted);font-size:.9rem">— log is empty —</p>
        }
      </div>
      <p>
        The rule: after the current synchronous code finishes, the engine drains the
        <strong>entire microtask queue</strong> (promise reactions, including every
        suspended <code>await</code> continuation) before it takes even one
        macrotask (timers, I/O, clicks). A microtask that queues more microtasks
        keeps the drain going — an accidental infinite microtask loop starves
        rendering entirely, which a <code>setTimeout</code> loop would not.
      </p>

      <h2>Error handling — including the <code>return await</code> subtlety</h2>
      <div class="code"><pre>async function load() {{ '{' }}
  try {{ '{' }}
    const res = await fetch('/api/user');
    if (!res.ok) throw new Error(\`HTTP \${{ '{' }}res.status{{ '}' }}\`);  // fetch does NOT reject on 404!
    return await res.json();     // ⚠️ 'return await' matters here — see below
  {{ '}' }} catch (err) {{ '{' }}
    console.error(err);
    return null;
  {{ '}' }}
{{ '}' }}</pre></div>
      <ul>
        <li><strong><code>return await p</code> vs <code>return p</code>:</strong> outside a try/catch they're equivalent (minus one microtask tick). <em>Inside</em> a try/catch they are not — <code>return p</code> hands the pending promise out before it settles, so a rejection <strong>skips your catch block</strong>. When the return sits in a try, keep the await.</li>
        <li><strong>Unhandled rejections don't vanish.</strong> A rejected promise with no handler fires the global <code>unhandledrejection</code> event and logs an error. A floating <code>doWork()</code> call (no await, no .catch) is a bug magnet — either await it or attach a handler.</li>
        <li><strong><code>catch (err)</code> types <code>err</code> as <code>unknown</code></strong> — anything can be thrown. Narrow before using: <code>if (err instanceof Error) …</code>.</li>
      </ul>

      <h2>Sequential vs parallel — race them</h2>
      <div class="code"><pre>// sequential (slow): the second await doesn't start until the first settles
const a = await taskA();  const b = await taskB();

// parallel (fast): start both promises first, THEN await
const [a2, b2] = await Promise.all([taskA(), taskB()]);</pre></div>
      <div class="demo">
        <p class="demo__title">Live — three 400ms tasks, both strategies timed</p>
        <div class="row">
          <button (click)="raceStrategies()" [disabled]="racing()">{{ racing() ? 'Racing…' : 'Run both' }}</button>
          <span class="pill">sequential: {{ seqTime() }}</span>
          <span class="pill">parallel: {{ parTime() }}</span>
        </div>
        <p style="font-size:.88rem;color:var(--text-muted);margin-top:8px">
          Sequential ≈ 3 × 400ms because each await parks the function until the
          previous task settles. Parallel ≈ 400ms because all three timers run
          concurrently — awaiting only joins the results.
        </p>
      </div>
      <div class="warn">
        <code>await</code> inside a <code>for</code> loop is the stealth version of
        the sequential case. To parallelize, map to promises first:
        <code>await Promise.all(items.map(fetchOne))</code> — and note the promises
        start during the <code>map</code>, not during the <code>all</code>.
      </div>

      <h2>The four combinators — failure semantics matter</h2>
      <table class="t">
        <tr><th>Combinator</th><th>Resolves with</th><th>Rejects when</th></tr>
        <tr><td><code>Promise.all</code></td><td>array of all values (order preserved)</td><td><strong>any</strong> input rejects — fail-fast; other results are discarded</td></tr>
        <tr><td><code>Promise.allSettled</code></td><td>array of <code>{{ '{' }}status, value|reason{{ '}' }}</code></td><td>never — inspect per-result status</td></tr>
        <tr><td><code>Promise.race</code></td><td>first to <em>settle</em> (value or rejection)</td><td>first settler was a rejection — used for timeouts</td></tr>
        <tr><td><code>Promise.any</code></td><td>first to <em>fulfill</em></td><td>only if <strong>all</strong> reject (<code>AggregateError</code>)</td></tr>
      </table>
      <div class="code"><pre>// the classic race use — a timeout wrapper:
const result = await Promise.race([
  fetchData(),
  wait(5000).then(() =&gt; {{ '{' }} throw new Error('timeout'); {{ '}' }}),
]);
// note: race doesn't CANCEL the loser — promises are not cancellable. The slow
// fetch keeps running; you've merely stopped waiting for it.</pre></div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — a simulated async task</p>
        <div class="row">
          <button (click)="run()" [disabled]="busy()">{{ busy() ? 'Working…' : 'Run async task' }}</button>
          <span class="pill">{{ result() }}</span>
        </div>
        <p style="font-size:.88rem;color:var(--text-muted);margin-top:8px">
          The handler is an <code>async</code> method: it sets state, awaits a 900ms
          promise (the UI stays fully responsive — nothing blocks), then sets state
          again. Signals make both updates render.
        </p>
      </div>

      <h2>Promise vs Observable — and the bridge</h2>
      <table class="t">
        <tr><th></th><th>Promise</th><th>Observable (RxJS)</th></tr>
        <tr><td>Values</td><td>exactly one settlement</td><td>zero, one, or many over time</td></tr>
        <tr><td>Eager / lazy</td><td>eager (executor runs at construction)</td><td>lazy (producer runs per subscribe)</td></tr>
        <tr><td>Cancellable</td><td>no</td><td>yes (unsubscribe tears down the producer)</td></tr>
        <tr><td>Retryable</td><td>no — settled is settled</td><td>yes — resubscribe (<code>retry</code>)</td></tr>
        <tr><td>Operators</td><td>then/catch/finally + combinators</td><td>map, switchMap, debounceTime, …</td></tr>
      </table>
      <div class="note">
        Angular's <code>HttpClient</code> returns Observables, but bridging is
        routine: <code>firstValueFrom(obs$)</code> / <code>lastValueFrom(obs$)</code>
        produce promises (rejecting with <code>EmptyError</code> if the source
        completes without emitting), and <code>from(promise)</code> goes the other
        way. Historical note: zone.js-based Angular patched Promise resolution to
        trigger change detection; in zoneless apps nothing is patched — signals
        carry the update instead, exactly as the demos here do.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What does an <code>async</code> function return to its caller <em>before</em> its first await settles?</summary>
        <div>A pending Promise, immediately. The body runs synchronously up to the
        first <code>await</code>, then the function suspends and control returns to
        the caller with the not-yet-settled promise. This is why side effects placed
        before the first await happen "now", while everything after it happens in a
        later microtask.</div>
      </details>
      <details class="qa">
        <summary>Inside a try/catch, <code>return fetchJson()</code> silently skips the catch on failure. Why does <code>return await fetchJson()</code> fix it?</summary>
        <div>Without await, the function returns the pending promise and pops its
        try/catch scope off the stack — the later rejection happens outside any
        protection and surfaces at the caller. With <code>return await</code>, the
        rejection is raised <em>inside</em> the function as an exception while the
        try/catch is still active. Lint rules like <code>no-return-await</code>
        explicitly except this case.</div>
      </details>
      <details class="qa">
        <summary><code>Promise.all</code> vs <code>allSettled</code> for saving 10 independent form sections — which and why?</summary>
        <div><code>allSettled</code>. <code>all</code> is fail-fast: one rejection
        rejects the whole thing and you can't tell which of the other nine succeeded
        (they still ran — their results are just discarded). <code>allSettled</code>
        never rejects and reports each outcome, letting you show "8 saved, 2 failed —
        retry?". Use <code>all</code> when results are useless unless complete;
        <code>allSettled</code> when partial success is meaningful.</div>
      </details>
      <details class="qa">
        <summary>Does <code>Promise.race</code> cancel the losing operation? What does that imply for a fetch timeout?</summary>
        <div>No — promises have no cancellation. Race only decides which settlement
        <em>you observe first</em>; the losing fetch continues consuming network and
        memory. Real cancellation needs a cooperating mechanism:
        <code>AbortController</code> passed to fetch, or an Observable (where
        unsubscribe aborts the request — what HttpClient does under
        <code>switchMap</code>).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A promise settles once (fulfilled/rejected) and is eager; <code>async</code> functions always return promises and run synchronously up to the first <code>await</code>.</li>
        <li>Await continuations are microtasks: the whole microtask queue drains before any timer/event macrotask runs.</li>
        <li>Use <code>return await</code> inside try/catch; never leave promises floating; <code>catch</code> errors are <code>unknown</code>.</li>
        <li>Start promises first, then await — <code>Promise.all</code> (fail-fast), <code>allSettled</code> (per-result), <code>race</code> (first settle), <code>any</code> (first success). None of them cancel losers.</li>
        <li>Observables are lazy, multi-value, cancellable and retryable; bridge with <code>firstValueFrom</code>/<code>from</code>.</li>
      </ul>

      <p><a routerLink="/ts-nullish">Next: Optional Chaining &amp; Nullish Coalescing →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Async {
  protected readonly busy = signal(false);
  protected readonly result = signal('idle');

  protected readonly orderLog = signal<string[]>([]);

  protected readonly racing = signal(false);
  protected readonly seqTime = signal('—');
  protected readonly parTime = signal('—');

  protected async run() {
    this.busy.set(true);
    this.result.set('loading…');
    await wait(900);
    this.result.set('✅ resolved after 900ms');
    this.busy.set(false);
  }

  protected runOrder() {
    this.orderLog.set([]);
    const log = (line: string) => this.orderLog.update((l) => [...l, line]);
    log('1: sync');
    setTimeout(() => log('4: macrotask (timer)'));
    Promise.resolve().then(() => log('3: microtask'));
    log('2: sync');
  }

  protected async raceStrategies() {
    this.racing.set(true);
    this.seqTime.set('running…');
    this.parTime.set('…');

    const t0 = performance.now();
    await wait(400);
    await wait(400);
    await wait(400);
    this.seqTime.set(`${Math.round(performance.now() - t0)}ms`);

    const t1 = performance.now();
    await Promise.all([wait(400), wait(400), wait(400)]);
    this.parTime.set(`${Math.round(performance.now() - t1)}ms`);
    this.racing.set(false);
  }
}
