import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Async — why the single thread can't wait, execution-order traced
 * live, callbacks → promises → async/await with each code block dissected,
 * promise states, parallel vs sequential awaits, and error handling. The
 * groundwork for HttpClient and Observables later.
 */

@Component({
  selector: 'app-lesson-async-basics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Foundations · Programming from Zero</span>
      <h1>Doing Things Later: Async</h1>
      <p class="lead">
        Some things are instant (<code>2 + 2</code>). Others take <em>time</em> —
        fetching data from a server, waiting for a timer. Here's the constraint that
        shapes everything: <strong>JavaScript runs on one thread</strong>. One lane,
        one instruction at a time — and it's the <em>same lane the page uses to
        respond to clicks and repaint</em>. If your code stood still waiting two
        seconds for a server, the whole page would freeze for two seconds. So
        JavaScript never waits. It starts slow work, keeps going, and handles the
        result <strong>later</strong>. This page is about how "later" works.
      </p>

      <h2>The coffee-shop analogy</h2>
      <p>
        You order a coffee and the barista hands you a <strong>buzzer</strong>. You
        don't stand frozen at the counter — you sit down, read, chat (the program
        keeps running). When the coffee is ready the buzzer goes off and you collect
        it. Every async tool below is a variation on that buzzer:
        <em>"I'll let you know when it's done."</em>
      </p>

      <h2>Prove the order to yourself</h2>
      <p>
        The single most important fact: async code does <strong>not</strong> run
        where it's written — it runs when it's ready, after the current code
        finishes. Predict the order these three print, then run it:
      </p>
      <div class="code"><pre>console.log('A');                          // plain, instant
setTimeout(() => console.log('B'), 0);     // "later" — even at 0ms!
console.log('C');</pre></div>
      <div class="demo">
        <p class="demo__title">Live — run it and watch the console</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="runOrder()" [disabled]="orderRunning()">▶ Run</button>
          <button class="ghost" (click)="orderLog.set([])">Clear</button>
        </div>
        <div class="console">
          @for (line of orderLog(); track $index) {
            <div>{{ line }}</div>
          } @empty {
            <div class="dim">// output appears here…</div>
          }
        </div>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">
          A, C, <em>then</em> B — even with a 0ms delay. <code>setTimeout</code> hands
          the callback to the browser and returns <em>immediately</em>; the callback
          is only allowed back into the lane once the current run-to-completion
          finishes. "Async" beats "0 milliseconds".
        </p>
      </div>

      <h2>Round 1: Callbacks — pass a function to run when done</h2>
      <div class="code"><pre>setTimeout(() => {{ '{' }}
  console.log('2 seconds passed!');   // runs LATER
{{ '}' }}, 2000);
console.log('this prints FIRST');     // the program didn't wait</pre></div>
      <p>
        This is the functions-are-values superpower from the Functions lesson: hand
        over a function (no parentheses — unpressed!), and the browser calls it when
        the time comes. Callbacks work fine for one step. The trouble starts when
        steps depend on each other — each "and then" nests another level:
      </p>
      <div class="code"><pre>loadUser(id, (user) => {{ '{' }}
  loadOrders(user, (orders) => {{ '{' }}
    loadInvoice(orders[0], (invoice) => {{ '{' }}
      // three levels deep and every level needs its own error handling…
    {{ '}' }});
  {{ '}' }});
{{ '}' }});   // ← the "callback pyramid" / "callback hell"</pre></div>

      <h2>Round 2: Promises — the buzzer as an object</h2>
      <p>
        A <strong>Promise</strong> makes "a value that will arrive" into a thing you
        can hold, store, and attach handlers to. It is always in one of three states:
      </p>
      <table class="t">
        <tr><td><strong>pending</strong></td><td>still working — the buzzer hasn't gone off</td></tr>
        <tr><td><strong>fulfilled</strong></td><td>done, with a value — <code>.then</code> handlers run</td></tr>
        <tr><td><strong>rejected</strong></td><td>failed, with a reason — <code>.catch</code> handlers run</td></tr>
      </table>
      <div class="code"><pre>loadUser()                                    // returns a Promise instantly (pending)
  .then(user => console.log('got', user))    // "when fulfilled, run this"
  .catch(err => console.error('oops', err)); // "if rejected anywhere above, run this"</pre></div>
      <ul>
        <li><strong>Line 1</strong>: calling an async function doesn't give you the user — it gives you the <em>promise of</em> a user, immediately, while work continues in the background.</li>
        <li><strong><code>.then</code></strong> registers a callback for success — and returns a <em>new</em> promise, so thens chain flat instead of nesting: <code>loadUser().then(u =&gt; loadOrders(u)).then(o =&gt; …)</code>. The pyramid becomes a pipeline.</li>
        <li><strong><code>.catch</code></strong> catches a failure from <em>any</em> earlier step — one error handler for the whole chain, instead of one per level.</li>
        <li>A promise settles exactly once — the buzzer can't ring twice. (Angular's Observables, coming later, are the "can ring many times" upgrade.)</li>
      </ul>

      <h2>Round 3: async / await — promises in plain clothes</h2>
      <div class="code"><pre>async function showUser() {{ '{' }}          // "async" marks: this function awaits inside
  try {{ '{' }}
    const user = await loadUser();     // pause THIS FUNCTION until fulfilled
    const orders = await loadOrders(user);   // then this — reads top-to-bottom
    console.log('got', orders);
  {{ '}' }} catch (err) {{ '{' }}                     // any rejection above lands here
    console.error('oops', err);
  {{ '}' }}
{{ '}' }}</pre></div>
      <ul>
        <li><strong><code>await</code></strong> unwraps a promise: instead of <code>.then(user =&gt; …)</code>, the resolved value lands in a normal variable. The code below the await simply doesn't run until the promise settles.</li>
        <li><strong>Only the function pauses</strong> — not the page. At each <code>await</code>, the function steps out of the lane and lets everything else run; it steps back in when the value arrives. Same buzzer, nicer syntax — it <em>is</em> promises underneath.</li>
        <li><strong>Errors become ordinary <code>try/catch</code></strong> — the same construct you'd use for synchronous mistakes.</li>
        <li>An <code>async</code> function always returns a promise itself — its <code>return</code> value is what the promise fulfills with. Async is contagious: whoever calls you must await you (or <code>.then</code> you).</li>
      </ul>

      <div class="warn">
        <strong>The forgotten-await bug</strong> — the most common async mistake in
        real code: <code>const user = loadUser();</code> (no await) doesn't fail — it
        quietly puts a <em>Promise object</em> in the variable instead of the user.
        The symptom is seeing <code>[object Promise]</code> on screen or
        <code>undefined</code> properties. When data looks wrong, check for a missing
        <code>await</code> first.
      </div>

      <h2>Sequential vs parallel — a real performance decision</h2>
      <div class="code"><pre>// SEQUENTIAL — b doesn't even START until a finished (total: a + b time):
const a = await loadProfile();
const b = await loadSettings();

// PARALLEL — start both immediately, then wait for both (total: the slower one):
const [profile, settings] = await Promise.all([
  loadProfile(),      // ← called with no await: both promises are now pending…
  loadSettings(),
]);                   // ← …and Promise.all bundles them into one awaitable</pre></div>
      <p>
        Independent requests should run in parallel — two 1-second calls take 1
        second, not 2. Await sequentially only when step 2 genuinely needs step 1's
        answer. Interviewers ask this; production code reviews flag it.
      </p>

      <h2>Try it — start something slow</h2>
      <div class="demo">
        <p class="demo__title">Live — a simulated 1.2s load</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="load()" [disabled]="status() === 'loading'">Load user data</button>
          <span class="pill">promise state: {{ status() === 'loading' ? 'pending' : status() === 'done' ? 'fulfilled' : '—' }}</span>
        </div>
        @if (status() === 'loading') {
          <p>⏳ Working… (the page is still responsive — try the theme toggle or scroll)</p>
        } @else if (status() === 'done') {
          <p style="color:var(--green)">✅ Got it: {{ result() }}</p>
        } @else {
          <p style="color:var(--text-muted)">Press the button to start.</p>
        }
        <div class="code" style="margin-top:10px"><pre>protected async load() {{ '{' }}
  this.status.set('loading');                  // 1· instant: show the spinner
  const data = await fakeServer(1200);         // 2· function pauses HERE; page lives on
  this.result.set(data);                       // 3· resumes when fulfilled
  this.status.set('done');
{{ '}' }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          This is the demo's actual source. Line 1 runs instantly, the UI repaints,
          and 1.2s later execution resumes at line 3. That idle-then-resume gap is
          all of async in one picture.
        </p>
      </div>

      <div class="note">
        Angular mostly uses a cousin of promises called <strong>Observables</strong>
        for data over time (a promise settles once; an observable can deliver many
        values — keystrokes, live prices). But every observable skill builds on this
        page's mindset: start slow work, don't block, handle the result when it
        arrives, always handle the failure case too.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Predict the output: <code>console.log(1); setTimeout(() =&gt; console.log(2), 0); Promise.resolve().then(() =&gt; console.log(3)); console.log(4);</code></summary>
        <div>1, 4, 3, 2. Synchronous code first (1, 4). Then queued async work — and
        promise callbacks (called <em>microtasks</em>) run before timer callbacks
        (<em>macrotasks</em>), so 3 beats 2. You rarely need the micro/macro detail
        day-to-day, but "sync first, promises before timers" wins interview points.</div>
      </details>
      <details class="qa">
        <summary>A template shows <code>[object Promise]</code> instead of a name. Diagnosis?</summary>
        <div>Somewhere a promise was assigned without being awaited/unwrapped —
        e.g. <code>this.name = loadName()</code> instead of
        <code>this.name = await loadName()</code>. The variable holds the buzzer,
        not the coffee.</div>
      </details>
      <details class="qa">
        <summary>Why can't you just write a loop that waits until <code>done === true</code>?</summary>
        <div>A busy-wait loop occupies the single lane — the callback that would set
        <code>done = true</code> can never run, and the page freezes forever. The
        lane must be <em>yielded</em> (function ends, or awaits) for queued work to
        run. This is why async is cooperative, not optional.</div>
      </details>
      <details class="qa">
        <summary>Three independent API calls each take ~1s. Minimum total time, and how?</summary>
        <div>~1 second: start all three without awaiting, then
        <code>await Promise.all([p1, p2, p3])</code>. Awaiting each in turn costs ~3s.
        Caveat: Promise.all rejects as soon as ANY member rejects — use
        <code>Promise.allSettled</code> when you want every result regardless of
        individual failures.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>JavaScript is single-threaded and shares its lane with the UI — so it <strong>never waits</strong>; slow work is started, and its result handled later. Async callbacks run only after the current code finishes (A, C, B — even at 0ms).</li>
        <li>Evolution: <strong>callbacks</strong> (nest into pyramids) → <strong>promises</strong> (pending → fulfilled/rejected; <code>.then</code> chains flat, one <code>.catch</code> for the chain) → <strong>async/await</strong> (same promises, top-to-bottom syntax, <code>try/catch</code> errors).</li>
        <li><code>await</code> pauses only the function, never the page; a missing await hands you the buzzer (<code>[object Promise]</code>) instead of the coffee.</li>
        <li>Independent work runs in <strong>parallel</strong> with <code>Promise.all</code> — sequential awaits are a silent performance bug.</li>
        <li>Observables (Angular's tool for values-over-time) are this same mindset, many-values edition.</li>
      </ul>

      <p><a routerLink="/json-and-apis">Next: Data on the Web — JSON &amp; APIs →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; margin: 8px 0; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 120px; }

     /* Fixed dark console — colours must not come from theme vars (see styles.css --code-fg note). */
     .console { background: var(--code-bg); color: var(--code-fg); border-radius: 8px; padding: 10px 14px; font-family: monospace; font-size: .82rem; min-height: 80px; }
     .console .dim { color: #8b93a8; }

     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class AsyncBasics {
  protected readonly status = signal<'idle' | 'loading' | 'done'>('idle');
  protected readonly result = signal('');

  protected readonly orderLog = signal<string[]>([]);
  protected readonly orderRunning = signal(false);

  /** The A/C/B execution-order proof — really uses setTimeout(…, 0). */
  protected runOrder() {
    this.orderRunning.set(true);
    this.orderLog.set([]);
    const log = (s: string) => this.orderLog.update((l) => [...l, s]);

    log(`console.log('A')  → A`);
    setTimeout(() => {
      log(`(the timer callback finally runs)  → B`);
      this.orderRunning.set(false);
    }, 0);
    log(`console.log('C')  → C   ← ran before B despite the 0ms delay`);
  }

  protected async load() {
    this.status.set('loading');
    this.result.set('');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    this.result.set('{ name: "Ada", role: "admin" }');
    this.status.set('done');
  }
}
