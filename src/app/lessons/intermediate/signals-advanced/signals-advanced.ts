import { Component, computed, linkedSignal, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Advanced Signals — the parts beyond `signal` / `computed` / `effect`.
 *
 * Covers `linkedSignal`, `untracked`, equality functions, and how the dependency
 * graph actually works (pull-based, lazily evaluated, glitch-free).
 *
 * Two demos:
 *
 * - **`linkedSignal`**, which is writable state that *resets* when its source
 *   changes. The classic case is a select whose options get replaced: a plain
 *   `signal` keeps the now-invalid selection, a `computed` cannot be written to
 *   at all, and `linkedSignal` is the thing that is both.
 * - **`untracked`**, reading a signal without subscribing to it. The demo makes
 *   the consequence concrete: the `computed` recomputes when `a` changes and not
 *   when `b` does, even though it reads both — which is either exactly what you
 *   wanted or a stale-value bug, depending on whether you meant it.
 */
@Component({
  selector: 'app-lesson-signals-advanced',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Signals</span>
      <h1>Advanced Signals</h1>
      <p class="lead">
        Beyond <code>signal</code>, <code>computed</code> and <code>effect</code>,
        Angular adds tools for trickier reactive shapes: <code>linkedSignal</code> for
        writable-yet-derived state, <code>untracked</code> to read without subscribing,
        effect cleanup, and custom equality.
      </p>

      <h2>Which derivation tool?</h2>
      <div class="code">
        <pre>Do you derive a value from other signals?
│
├─ No, it's independent state ............. signal()
│
└─ Yes ─ does a user also need to WRITE it directly?
         │
         ├─ No  → read-only derived ........ computed()
         ├─ Yes → writable + re-derives .... linkedSignal()
         │
         └─ Not a value at all — a side effect
            (log, DOM, localStorage) ........ effect()</pre>
      </div>
      <p>
        The trap is reaching for <code>effect</code> to copy one signal into another.
        That's what <code>computed</code> and <code>linkedSignal</code> are for — they're
        synchronous and glitch-free, while an effect runs <em>after</em> render and can
        cause extra change-detection passes.
      </p>

      <h2>linkedSignal — writable, but resets from a source</h2>
      <p>
        A <code>computed</code> is read-only; a <code>linkedSignal</code> can be written
        <em>and</em> recomputes when its source changes. Perfect for "selected item"
        state that should reset when the list reloads.
      </p>
      <div class="code">
        <pre>options = signal(['Red', 'Green', 'Blue']);
// defaults to the first option, but stays user-writable:
selected = linkedSignal(() =&gt; this.options()[0]);</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          @for (o of options(); track o) {
            <button [class.ghost]="selected() !== o" (click)="selected.set(o)">{{ o }}</button>
          }
        </div>
        <p class="row">
          <span class="pill">selected: {{ selected() }}</span>
          <button class="ghost" (click)="reshuffle()">Reload options (resets selection)</button>
        </p>
      </div>

      <h2>untracked — read without depending</h2>
      <p>
        Inside a <code>computed</code>/<code>effect</code>, reading a signal subscribes
        to it. Wrap a read in <code>untracked()</code> to use its value <em>without</em>
        re-running when it changes.
      </p>
      <div class="code">
        <pre>// recomputes when a() changes — but NOT when b():
sum = computed(() =&gt; this.a() + untracked(this.b));</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live</p>
        <p class="row">
          <span class="pill">a = {{ a() }}</span>
          <span class="pill">b = {{ b() }}</span>
          <span class="pill" style="color:var(--green)">sum = {{ sum() }}</span>
        </p>
        <div class="row">
          <button (click)="a.set(a() + 1)">a++ (updates sum)</button>
          <button class="ghost" (click)="b.set(b() + 1)">b++ (sum unchanged until a++)</button>
        </div>
      </div>

      <h2>Effect cleanup & custom equality</h2>
      <div class="code">
        <pre>effect((onCleanup) =&gt; {{ '{' }}
  const id = setInterval(tick, 1000);
  onCleanup(() =&gt; clearInterval(id));   // runs before re-run / on destroy
{{ '}' }});

// suppress notifications when the value is "equal" by your rule:
const user = signal(initial, {{ '{' }} equal: (a, b) =&gt; a.id === b.id {{ '}' }});</pre>
      </div>

      <h2>linkedSignal with previous value</h2>
      <div class="code">
        <pre>// keep the current selection if it still exists in the new list:
selected = linkedSignal({{ '{' }}
  source: this.options,
  computation: (options, prev) =&gt;
    options.includes(prev?.value) ? prev!.value : options[0],
{{ '}' }});</pre>
      </div>
      <p>
        The source/computation form gives the computation access to the
        <code>previous</code> source and value — ideal for "preserve selection across a
        reload, else reset" logic.
      </p>

      <div class="tip">
        Reach for <code>linkedSignal</code> instead of an <code>effect</code> that
        copies one signal into another — it is synchronous, glitch-free and clearer.
        Use <code>untracked</code> to break unwanted dependencies, not as a habit.
      </div>

      <h2>Under the hood — a pull-based, glitch-free graph</h2>
      <p>
        Signals form a <strong>dependency graph</strong> of producers (writable signals) and
        consumers (<code>computed</code>, <code>effect</code>, views). When you read a signal
        <em>inside</em> a reactive context, Angular records an edge: "this consumer depends on that
        producer." That's why dependencies are dynamic — an <code>if</code> branch that isn't
        taken this run creates no edge, and <code>untracked()</code> deliberately skips recording one.
      </p>
      <ul>
        <li><strong>Pull, not push.</strong> Writing a signal doesn't eagerly recompute anything — it just bumps a version number and marks dependents "dirty". A <code>computed</code> only re-runs when someone actually <em>reads</em> it and finds a dependency changed. Untouched computeds cost nothing.</li>
        <li><strong>Memoized.</strong> A <code>computed</code> caches its last value and returns it until a dependency's version changes — so reading it ten times runs the formula at most once.</li>
        <li><strong>Glitch-free.</strong> Because evaluation is synchronous and pull-based, a reader never observes a half-updated graph (an intermediate "glitch") the way a chain of <code>effect</code>s copying values can.</li>
        <li><strong>Equality gates propagation.</strong> After recomputing, a signal compares new vs old with its <code>equal</code> fn (reference by default). If equal, dependents are <em>not</em> notified — the ripple stops early.</li>
      </ul>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr>
          <td>Using <code>effect</code> to sync one signal to another</td>
          <td>Prefer <code>computed</code>/<code>linkedSignal</code> — synchronous, glitch-free, no extra CD pass.</td>
        </tr>
        <tr>
          <td>Writing to a signal inside a <code>computed</code></td>
          <td>Computeds must be pure. Set signals only in event handlers or effects.</td>
        </tr>
        <tr>
          <td>Reaching for <code>untracked</code> everywhere</td>
          <td>It silently breaks reactivity. Use it only to deliberately exclude one dependency.</td>
        </tr>
        <tr>
          <td>Forgetting effect cleanup for timers/listeners</td>
          <td>Return work through <code>onCleanup</code> or it leaks across re-runs and on destroy.</td>
        </tr>
        <tr>
          <td>Mutating an object/array in place then <code>set</code>-ing it</td>
          <td>Default equality is by reference; pass a fresh value (or a custom <code>equal</code>) so readers update.</td>
        </tr>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>linkedSignal</code> = derived <em>and</em> writable, resets from its source.</li>
        <li><code>untracked()</code> reads a signal without creating a dependency.</li>
        <li>The <code>onCleanup</code> callback tears down work between effect runs.</li>
        <li>A custom <code>equal</code> fn stops needless notifications for unchanged data.</li>
      </ul>

      <p><a routerLink="/resource-api">Next: The resource() API →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 300px; }`,
  ],
})
export class SignalsAdvanced {
  /**
   * The palettes the `linkedSignal` demo cycles through.
   */
  private readonly palettes = [
    ['Red', 'Green', 'Blue'],
    ['Cyan', 'Magenta', 'Yellow'],
    ['Amber', 'Violet', 'Teal'],
  ];
  /**
   * Which palette is showing.
   */
  private paletteIndex = 0;

  /**
   * The current options — the source the selection is linked to.
   */
  protected readonly options = signal(this.palettes[0]);
  /**
   * The selection. A `linkedSignal`, so it is writable like a `signal` *and* resets
   * to the first option whenever the options change. Neither `signal` nor
   * `computed` alone does both.
   */
  protected readonly selected = linkedSignal(() => this.options()[0]);

  /**
   * Tracked dependency of {@link sum}.
   */
  protected readonly a = signal(1);
  /**
   * Untracked dependency of {@link sum} — read, but not subscribed to.
   */
  protected readonly b = signal(100);
  /**
   * The sum. Recomputes on `a`, not on `b`: `untracked` reads the value without
   * registering a dependency, so the displayed total can be stale by design.
   */
  protected readonly sum = computed(() => this.a() + untracked(this.b));

  /**
   * Swaps in the next palette, which is what makes the linked selection reset.
   */
  protected reshuffle() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.options.set(this.palettes[this.paletteIndex]);
  }
}
