import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Signals Basics — Angular's reactive primitive.
 *
 * Covers the three pieces and how they differ: `signal()` holds writable state,
 * `computed()` derives from it lazily and caches, and `effect()` runs a side
 * effect when its dependencies change.
 *
 * The distinction the lesson leans on hardest is `computed` against `effect`.
 * Both react to the same signals, but a `computed` *returns* a value and must
 * stay pure, while an `effect` returns nothing and exists precisely for the
 * impure work — logging, storage, DOM. Reaching for an `effect` to compute a
 * value is the mistake this page is built to prevent.
 *
 * The live demo shows a counter with a derived double and parity, plus an
 * effect log that fills in as the count changes.
 */
@Component({
  selector: 'app-lesson-signals',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Signals</span>
      <h1>Signals Basics</h1>
      <p class="lead">
        A <strong>signal</strong> is a value that announces when it changes. Anything
        that reads it — a template, a <code>computed</code>, an <code>effect</code> —
        automatically re-runs when the value updates. Signals are the foundation of
        modern Angular reactivity and the engine behind its change detection, so this is
        a lesson worth really understanding.
      </p>

      <h2>The mental model: a spreadsheet</h2>
      <p>
        The clearest way to picture signals is a <strong>spreadsheet</strong>:
      </p>
      <ul>
        <li>A <strong>signal</strong> is a cell holding a value, like <code>A1 = 5</code>.</li>
        <li>A <strong>computed</strong> is a formula cell, like <code>B1 = A1 * 2</code>. Change <code>A1</code> and <code>B1</code> recalculates <em>by itself</em>.</li>
        <li>An <strong>effect</strong> is a cell that <em>does something</em> (sends an email, saves a file) whenever the cells it watches change.</li>
      </ul>
      <p>
        You never manually tell the spreadsheet to recalculate — it tracks which cells
        depend on which, and updates exactly what's affected. Signals give your Angular
        code that same automatic, fine-grained reactivity.
      </p>

      <h2>Why not just a normal variable?</h2>
      <div class="code">
        <pre>let count = 0;          // a plain variable
count = 5;              // changed it… but nothing KNOWS it changed.
                        // the screen, derived values — all now out of date.

count = signal(0);      // a signal
count.set(5);           // everything that read count() re-runs automatically</pre>
      </div>
      <p>
        A plain variable is a silent box. A signal is a box that <strong>shouts "I
        changed!"</strong> so the UI and any derived values stay correct without you
        wiring anything up. That announcement is the whole point.
      </p>

      <h2>signal() — a writable value</h2>
      <div class="code">
        <pre>count = signal(0);   // create
count();             // READ  → 0   (call it like a function — note the parentheses)
count.set(5);        // WRITE a brand-new value → 5
count.update(n =&gt; n + 1);   // WRITE based on the current value → 6

// custom equality — skip notifications when "unchanged" by your rule:
user = signal(initial, {{ '{' }} equal: (a, b) =&gt; a.id === b.id {{ '}' }});</pre>
      </div>
      <p>
        Use <code>set</code> for a brand-new value and <code>update</code> when the new
        value depends on the old. Signals compare with <code>Object.is</code> by default,
        so setting an object to a <em>new</em> reference always notifies — treat signal
        values as <strong>immutable</strong> (replace, don't mutate in place).
      </p>

      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row">
          <button (click)="count.update((n) => n - 1)">−</button>
          <span class="pill" style="font-size:1.1rem">count = {{ count() }}</span>
          <button (click)="count.update((n) => n + 1)">+</button>
          <button class="ghost" (click)="count.set(0)">reset</button>
        </div>
      </div>

      <h2>computed() — derived & cached</h2>
      <p>
        A <code>computed</code> signal derives its value from other signals. Read it like
        any signal; it recomputes only when a dependency actually changes, and caches the
        result in between.
      </p>
      <div class="code">
        <pre>doubled = computed(() =&gt; this.count() * 2);
parity  = computed(() =&gt; this.count() % 2 === 0 ? 'even' : 'odd');</pre>
      </div>
      <p>
        <code>computed</code> is <strong>lazy</strong> (it doesn't run until something
        reads it) and <strong>memoized</strong> (re-runs only after a dependency changes).
        Its dependencies are tracked <em>dynamically</em> — only the signals read on the
        last run count. Keep the function <strong>pure</strong>: no writes, no side
        effects, just compute and return.
      </p>
      <div class="demo">
        <p class="demo__title">Live — these update themselves from count()</p>
        <p>doubled = <strong>{{ doubled() }}</strong></p>
        <p>parity = <strong>{{ parity() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">Click +/− above — you never told these to recompute.</p>
      </div>

      <h2>effect() — run side effects</h2>
      <p>
        An <code>effect</code> runs whenever any signal it reads changes. Use it for
        <em>side effects</em> — logging, saving to <code>localStorage</code>, driving a
        non-Angular chart library. Not for deriving values; that's <code>computed</code>'s
        job.
      </p>
      <div class="code">
        <pre>constructor() {{ '{' }}
  effect((onCleanup) =&gt; {{ '{' }}
    const value = this.count();
    console.log('count is now', value);
    onCleanup(() =&gt; {{ '{' }} /* runs before the next run & on destroy */ {{ '}' }});
  {{ '}' }});
{{ '}' }}</pre>
      </div>
      <p>
        An effect runs <strong>once immediately</strong>, then again whenever a signal it
        read changes. Create it in an injection context (a constructor or field
        initializer) so Angular cleans it up automatically when the component is
        destroyed; <code>onCleanup</code> tears down work (timers, subscriptions) between
        runs.
      </p>
      <div class="demo">
        <p class="demo__title">Live — an effect logs every change to count()</p>
        <ol class="log">
          @for (line of effectLog(); track $index) {
            <li>{{ line }}</li>
          }
        </ol>
        <p style="color:var(--text-muted);font-size:.85rem">
          Click the +/− buttons above and watch entries appear here.
        </p>
      </div>

      <h2>Under the hood</h2>
      <p>
        A signal is not magic — it's a small object holding a value plus a
        <strong>version counter</strong> and a set of subscribed "consumers"
        (a <code>computed</code>, an <code>effect</code>, or a template binding).
      </p>
      <ul>
        <li>
          <strong>Reading tracks, writing bumps the version.</strong> Calling
          <code>count()</code> inside a reactive context (a <code>computed</code>
          body, an <code>effect</code>, or template evaluation) registers that
          context as a consumer. Calling <code>.set()</code>/<code>.update()</code>
          bumps the signal's version and marks every registered consumer
          <em>dirty</em> — it does not run them synchronously.
        </li>
        <li>
          <strong><code>computed</code> is lazy, so "dirty" just means "maybe stale."</strong>
          Marking it dirty schedules nothing; the next time something actually
          <em>reads</em> the computed, it checks whether any dependency's version
          changed and only then re-runs the formula. Read a computed that nobody
          ever reads again, and its function may never re-run at all.
        </li>
        <li>
          <strong><code>effect</code> runs are scheduled, not immediate.</strong> Angular
          batches effect execution into the app's next change-detection pass (a
          microtask), so several <code>.set()</code> calls in the same synchronous
          block only trigger one effect run with the final values — not one run
          per <code>set</code>.
        </li>
        <li>
          <strong>This is also how OnPush + zoneless change detection works.</strong>
          A template binding is itself a consumer. When a signal it read changes
          version, Angular marks <em>only that component</em> for a re-check —
          not the whole tree — which is the fine-grained update <a routerLink="/onpush">OnPush</a>
          relies on and why apps can drop Zone.js entirely once everything reactive
          is signal-driven.
        </li>
      </ul>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr><td>Forgetting the <code>()</code></td><td><code>{{ '{{' }} count {{ '}}' }}</code> shows the function itself; you need <code>{{ '{{' }} count() {{ '}}' }}</code> to read the value.</td></tr>
        <tr><td>Mutating instead of replacing</td><td><code>arr().push(x)</code> won't notify — do <code>arr.update(a =&gt; [...a, x])</code>.</td></tr>
        <tr><td>Using <code>effect</code> to set a signal</td><td>If you're deriving a value, use <code>computed</code> — it's simpler and glitch-free.</td></tr>
        <tr><td>Reading a signal outside reactivity</td><td>Reading in a one-off function gives a snapshot; it won't "stay live" unless read in a template/computed/effect.</td></tr>
      </table>

      <h2>Why signals?</h2>
      <ul>
        <li><strong>Fine-grained:</strong> Angular updates exactly what depends on a changed signal — not the whole page.</li>
        <li><strong>Glitch-free:</strong> reads are always consistent within a tick; no half-updated states.</li>
        <li><strong>Zoneless-ready:</strong> they enable change detection without Zone.js.</li>
        <li><strong>Ergonomic:</strong> <code>computed</code> replaces piles of <code>ngOnChanges</code> boilerplate.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>signal(v)</code> holds a value; read with <code>()</code>, write with <code>set</code>/<code>update</code>.</li>
        <li><code>computed(fn)</code> derives a cached, lazy value from other signals — keep it pure.</li>
        <li><code>effect(fn)</code> runs side effects when its dependencies change (and once immediately).</li>
        <li>Reading a signal inside a reactive context auto-subscribes you; treat values as immutable.</li>
      </ul>

      <p><a routerLink="/services-di">← Services &amp; DI</a> &nbsp;·&nbsp; <a routerLink="/signals-advanced">Advanced Signals</a> &nbsp;·&nbsp; <a routerLink="/routing-basics">Next: Routing Basics →</a></p>
    </article>
  `,
  styles: [
    `
      .log {
        background: var(--code-bg);
        color: var(--code-fg);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px 12px 12px 32px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.82rem;
        max-height: 180px;
        overflow: auto;
        margin: 0 0 10px;
      }
      .t { width: 100%; border-collapse: collapse; margin: 8px 0; }
      .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
      .t td:first-child { width: 240px; }
    `,
  ],
})
export class Signals {
  /**
   * The counter — the one piece of writable state on the page.
   */
  protected readonly count = signal(0);
  /**
   * Twice the count. Derived, not stored: a second signal kept in sync by hand is
   * the bug `computed` removes.
   */
  protected readonly doubled = computed(() => this.count() * 2);
  /**
   * Whether the count is even or odd. A second derivation off the same source, to
   * show that a signal can feed many.
   */
  protected readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));
  /**
   * Lines recorded by the effect, so its firing is visible rather than implied.
   */
  protected readonly effectLog = signal<string[]>([]);

  /**
   * Registers the demo effect.
   *
   * In an injection context, so it is torn down with the component — an effect
   * created outside one has to be disposed by hand, and forgetting is a leak.
   */
  constructor() {
    // Demonstrates effect(): reacts to count changes and records them.
    effect(() => {
      const value = this.count();
      this.effectLog.update((log) => [`count changed to ${value}`, ...log].slice(0, 8));
    });
  }
}
