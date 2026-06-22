import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ts-async',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Promises & async/await</h1>
      <p class="lead">
        A <code>Promise</code> represents a value that arrives later.
        <code>async/await</code> is syntactic sugar for consuming promises as if the
        code were synchronous. Knowing this clarifies how it relates to Angular's
        Observables.
      </p>

      <h2>Creating & consuming a Promise</h2>
      <div class="code">
        <pre>const wait = (ms: number) =&gt;
  new Promise&lt;void&gt;(resolve =&gt; setTimeout(resolve, ms));

// .then chaining
wait(500).then(() =&gt; console.log('done')).catch(err =&gt; ...);

// async/await (preferred)
async function run() {{ '{' }}
  await wait(500);
  console.log('done');
{{ '}' }}</pre>
      </div>

      <h2>Error handling with try/catch</h2>
      <div class="code">
        <pre>async function load() {{ '{' }}
  try {{ '{' }}
    const res = await fetch('/api/user');
    return await res.json();
  {{ '}' }} catch (err) {{ '{' }}
    console.error(err);
    return null;
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Running in parallel</h2>
      <div class="code">
        <pre>// sequential (slow): each awaits the previous
const a = await getA(); const b = await getB();

// parallel (fast): start both, then await
const [a2, b2] = await Promise.all([getA(), getB()]);   // rejects if ANY rejects
const settled = await Promise.allSettled([getA(), getB()]); // never rejects; per-result status
const first = await Promise.race([getA(), getB()]);     // first to settle (resolve OR reject)
const firstOk = await Promise.any([getA(), getB()]);    // first to RESOLVE</pre>
      </div>
      <div class="warn">
        <code>await</code> inside a <code>for</code> loop runs iterations
        <strong>sequentially</strong>. To parallelize, map to promises first:
        <code>await Promise.all(items.map(fetchOne))</code>. And remember an
        <code>async</code> function <em>always</em> returns a Promise — even
        <code>return 5</code> becomes <code>Promise&lt;number&gt;</code>.
      </div>

      <h2>Execution order: microtasks</h2>
      <div class="code">
        <pre>console.log('1');
Promise.resolve().then(() =&gt; console.log('3'));  // microtask — after sync code
setTimeout(() =&gt; console.log('4'));               // macrotask — even later
console.log('2');
// logs: 1, 2, 3, 4</pre>
      </div>
      <p>
        Resolved promises schedule a <strong>microtask</strong> that runs after the
        current synchronous code but before timers — worth knowing when ordering
        surprises you.
      </p>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live — a simulated async task</p>
        <div class="row">
          <button (click)="run()" [disabled]="busy()">{{ busy() ? 'Working…' : 'Run async task' }}</button>
          <span class="pill">{{ result() }}</span>
        </div>
      </div>

      <h2>Promise vs Observable</h2>
      <table class="t">
        <tr><th></th><th>Promise</th><th>Observable (RxJS)</th></tr>
        <tr><td>Values</td><td>one</td><td>zero, one, or many over time</td></tr>
        <tr><td>Eager / lazy</td><td>eager (runs immediately)</td><td>lazy (runs on subscribe)</td></tr>
        <tr><td>Cancellable</td><td>no</td><td>yes (unsubscribe)</td></tr>
        <tr><td>Operators</td><td>then/catch</td><td>map, switchMap, retry, …</td></tr>
      </table>
      <div class="note">
        Angular's <code>HttpClient</code> returns Observables, but you can bridge:
        <code>firstValueFrom(obs$)</code> turns an Observable into a Promise, and
        <code>from(promise)</code> goes the other way.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Promises model a single future value; <code>async/await</code> reads like sync code.</li>
        <li>Use <code>try/catch</code> for errors and <code>Promise.all</code> for parallelism.</li>
        <li>Observables are lazy, multi-value and cancellable — a superset of Promise use-cases.</li>
        <li>Bridge with <code>firstValueFrom</code> / <code>from</code>.</li>
      </ul>

      <p><a routerLink="/ts-nullish">Next: Optional Chaining &amp; Nullish Coalescing →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t th, .t td { padding: 8px; border-bottom: 1px solid var(--border); text-align: left; }`,
  ],
})
export class Async {
  protected readonly busy = signal(false);
  protected readonly result = signal('idle');

  protected async run() {
    this.busy.set(true);
    this.result.set('loading…');
    await new Promise((resolve) => setTimeout(resolve, 900));
    this.result.set('✅ resolved after 900ms');
    this.busy.set(false);
  }
}
