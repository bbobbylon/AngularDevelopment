import { Component, computed, linkedSignal, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  private readonly palettes = [
    ['Red', 'Green', 'Blue'],
    ['Cyan', 'Magenta', 'Yellow'],
    ['Amber', 'Violet', 'Teal'],
  ];
  private paletteIndex = 0;

  protected readonly options = signal(this.palettes[0]);
  protected readonly selected = linkedSignal(() => this.options()[0]);

  protected readonly a = signal(1);
  protected readonly b = signal(100);
  protected readonly sum = computed(() => this.a() + untracked(this.b));

  protected reshuffle() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.options.set(this.palettes[this.paletteIndex]);
  }
}
