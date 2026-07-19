import { CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the @let template variable.
 *
 * Beyond "name a value once": the crucial nuance that @let is re-evaluated every
 * change-detection pass (NOT memoized like computed()), the exact scope/forward-
 * reference rules, why it fixes the async-pipe multi-subscription problem, and a
 * comparison against computed(), template reference variables and the `; as`
 * alias — plus the exam traps.
 */
@Component({
  selector: 'app-lesson-let-block',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Local Template Variables: &#64;let</h1>
      <p class="lead">
        <code>&#64;let</code> declares a local variable inside a template. Use it to name
        a computed value once and reuse it — keeping templates DRY and readable without
        adding fields to the component class. It's reactive, read-only, and lexically
        scoped, with one performance nuance most people miss (below).
      </p>

      <h2>Declare once, reuse everywhere</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <label>price <input type="number" [value]="price()" (input)="price.set(+$any($event.target).value)" /></label>
          <label>qty <input type="number" [value]="qty()" (input)="qty.set(+$any($event.target).value)" /></label>
        </div>

        @let subtotal = price() * qty();
        @let tax = subtotal * 0.2;
        @let total = subtotal + tax;

        <table class="bill">
          <tr><td>Subtotal</td><td>{{ subtotal | currency }}</td></tr>
          <tr><td>Tax (20%)</td><td>{{ tax | currency }}</td></tr>
          <tr class="grand"><td>Total</td><td>{{ total | currency }}</td></tr>
        </table>
      </div>
      <div class="code"><pre>{{ basicSample }}</pre></div>
      <p>
        Each <code>&#64;let</code> may reference earlier ones (chaining, as above),
        template reference variables, and pipes. Its value updates reactively whenever a
        dependency changes.
      </p>

      <h2>Great with the async pipe — one subscription, not three</h2>
      <p>
        Piping <code>user$ | async</code> in three bindings creates <em>three</em>
        subscriptions (three renders, possibly three HTTP calls). Unwrap it once into a
        <code>&#64;let</code> and every use shares the single subscription — and the value
        is already narrowed away from <code>null</code> inside an <code>&#64;if</code>:
      </p>
      <div class="code"><pre>{{ asyncSample }}</pre></div>

      <h2>The nuance: &#64;let is <em>not</em> memoized</h2>
      <p>
        A <code>&#64;let</code> is re-evaluated on <strong>every change-detection pass</strong>,
        like any template expression — it is <em>not</em> cached the way
        <code>computed()</code> is. For cheap arithmetic that's fine. For anything
        expensive (sorting, filtering a big list, formatting thousands of rows), compute
        it in the class with <code>computed()</code>, which only recomputes when its
        signal dependencies actually change:
      </p>
      <div class="code"><pre>{{ memoSample }}</pre></div>
      <table class="cmp">
        <tr><th></th><th><code>&#64;let</code></th><th><code>computed()</code></th><th><code>#ref</code> (template var)</th><th><code>; as</code> alias</th></tr>
        <tr><td>Lives in</td><td>template</td><td>class</td><td>template</td><td>the block's condition</td></tr>
        <tr><td>Memoized?</td><td class="bad">no — recomputes each CD</td><td class="ok">yes — on dep change</td><td>n/a (points at a DOM/dir)</td><td class="bad">no</td></tr>
        <tr><td>Refers to</td><td>any expression</td><td>signal graph</td><td>an element / component / directive</td><td>the truthy condition value</td></tr>
        <tr><td>Scope</td><td>here &amp; below</td><td>whole component</td><td>its template &amp; below</td><td>inside the <code>&#64;if</code> only</td></tr>
        <tr><td>Best for</td><td>cheap derived values, unwrapping async</td><td>expensive/shared derivations</td><td>calling a child's API, focusing an input</td><td>narrowing one nullable in a condition</td></tr>
      </table>

      <h2>Scope &amp; rules</h2>
      <ul>
        <li><strong>Read-only.</strong> You can't assign to a <code>&#64;let</code> from an
          event handler — it's derived, not state. Put mutable state in a signal.</li>
        <li><strong>No forward references.</strong> A <code>&#64;let</code> is usable in its
          own scope and nested scopes, but <em>not</em> earlier in the template. Using it
          above its declaration is a compile error.</li>
        <li><strong>Scoped like a block.</strong> Declared inside <code>&#64;if</code> /
          <code>&#64;for</code>, it's visible only within that block (and deeper).</li>
      </ul>
      <div class="code"><pre>{{ scopeSample }}</pre></div>

      <h2>Per-row values inside &#64;for</h2>
      <p>
        Declare a per-row derived value once and reuse it across that row's markup,
        instead of recomputing the expression in several bindings:
      </p>
      <div class="code"><pre>{{ forSample }}</pre></div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Is <code>&#64;let</code> cached like <code>computed()</code>?</summary>
        <div>No. It re-evaluates on every change-detection pass. Use <code>computed()</code>
        in the class for expensive or widely-shared derivations.</div>
      </details>
      <details class="qa">
        <summary>Can I write to a <code>&#64;let</code> from a click handler?</summary>
        <div>No — it's read-only/derived. Keep mutable state in a <code>signal</code> and
        derive the <code>&#64;let</code> from it.</div>
      </details>
      <details class="qa">
        <summary>Why prefer <code>&#64;let x = obs$ | async</code> over piping in three places?</summary>
        <div>Each <code>| async</code> is its own subscription. One <code>&#64;let</code>
        shares a single subscription across every use, and narrows away <code>null</code>
        inside an <code>&#64;if</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;let name = expr;</code> creates a reusable, reactive, read-only template variable.</li>
        <li>It re-runs every change detection — <strong>not memoized</strong>; use <code>computed()</code> for expensive work.</li>
        <li>Lexically scoped: usable at and below its declaration, never before it.</li>
        <li>Ideal for unwrapping an async value once and for per-row values in <code>&#64;for</code>.</li>
      </ul>

      <p><a routerLink="/builtin-directives">Next: Built-in Directives →</a></p>
    </article>
  `,
  styles: [
    `
      .bill { width: 100%; max-width: 320px; border-collapse: collapse; }
      .bill td { padding: 6px 8px; border-bottom: 1px solid var(--border); }
      .bill td:last-child { text-align: right; }
      .bill .grand td { font-weight: 700; border-bottom: none; color: var(--accent); }
      table.cmp { width: 100%; border-collapse: collapse; font-size: .8rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 7px 10px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .ok { color: var(--green); font-weight: 700; }
      .bad { color: #ef4444; font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class LetBlock {
  protected readonly price = signal(9.99);
  protected readonly qty = signal(3);

  protected readonly basicSample = `@let subtotal = price() * qty();
@let tax = subtotal * 0.2;
@let total = subtotal + tax;

<p>Total: {{ total | currency }}</p>`;

  protected readonly asyncSample = `@let user = user$ | async;
@if (user) {
  <h2>{{ user.name }}</h2>    <!-- non-null here -->
  <p>{{ user.email }}</p>     <!-- same subscription, no re-fetch -->
}`;

  protected readonly memoSample = `<!-- recomputed every change detection — fine when cheap -->
@let total = price() * qty();

<!-- expensive? compute in the class instead: -->
// component
readonly sortedRows = computed(() =>
  [...this.rows()].sort((a, b) => a.name.localeCompare(b.name)));
// template
@for (row of sortedRows(); track row.id) { … }`;

  protected readonly scopeSample = `@if (user(); as u) {
  @let greeting = 'Hi ' + u.name;   <!-- scoped to this @if -->
  <p>{{ greeting }}</p>
}
<!-- <p>{{ greeting }}</p>  ← ERROR here: out of scope -->

<!-- <p>{{ label }}</p>     ← ERROR: used before declaration -->
@let label = 'later';`;

  protected readonly forSample = `@for (p of products(); track p.id) {
  @let line = p.price * p.qty;
  <td>{{ line | currency }}</td>
  <td>{{ line * 0.2 | currency }}</td>   <!-- reuse, don't recompute -->
}`;
}
