import { CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the @let template variable.
 *
 * Beyond "name a value once": the crucial nuance that @let is re-evaluated every
 * change-detection pass (NOT memoized like computed()), the exact scope/forward-
 * reference rules, why it fixes the async-pipe multi-subscription problem, a
 * comparison against computed(), template reference variables and the `; as`
 * alias, a line-by-line walkthrough of every code sample, what Angular is
 * actually doing internally with the declaration, and the exam traps.
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
        scoped, with one performance nuance most people miss (below). Every code sample
        on this page has a line-by-line breakdown right underneath it.
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
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Edit price or qty above: all three <code>&#64;let</code> lines re-run on the very
          next change-detection pass because they read the <code>price()</code> /
          <code>qty()</code> signals — that's the live template above, not a static screenshot.
        </p>
      </div>
      <div class="code"><pre>{{ basicSample }}</pre></div>

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Line</th><th>What &amp; why</th></tr>
        @for (row of basicBreakdown; track $index) {
          <tr><td><code>{{ row.line }}</code></td><td>{{ row.note }}</td></tr>
        }
      </table>
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

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Line</th><th>What &amp; why</th></tr>
        @for (row of asyncBreakdown; track $index) {
          <tr><td><code>{{ row.line }}</code></td><td>{{ row.note }}</td></tr>
        }
      </table>

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

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Line</th><th>What &amp; why</th></tr>
        @for (row of memoBreakdown; track $index) {
          <tr><td><code>{{ row.line }}</code></td><td>{{ row.note }}</td></tr>
        }
      </table>

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

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Line</th><th>What &amp; why</th></tr>
        @for (row of scopeBreakdown; track $index) {
          <tr><td><code>{{ row.line }}</code></td><td>{{ row.note }}</td></tr>
        }
      </table>

      <h2>Per-row values inside &#64;for</h2>
      <p>
        Declare a per-row derived value once and reuse it across that row's markup,
        instead of recomputing the expression in several bindings:
      </p>
      <div class="code"><pre>{{ forSample }}</pre></div>

      <h3>Line-by-line</h3>
      <table class="ll">
        <tr><th>Line</th><th>What &amp; why</th></tr>
        @for (row of forBreakdown; track $index) {
          <tr><td><code>{{ row.line }}</code></td><td>{{ row.note }}</td></tr>
        }
      </table>

      <h2>Under the hood</h2>
      <p>
        <code>&#64;let</code> is not sugar for a class field, and it isn't a JavaScript
        <code>let</code> either. The template compiler treats it as its own construct with
        its own storage and its own compile-time scope checking:
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <ul>
        <li>
          <strong>Lives on the view, not the class or a global.</strong> Each
          <code>&#64;let</code> gets a slot on the current view's internal data structure.
          It never becomes a component property, so you can't read it from TypeScript code
          or from a different template — only from this template, at or below its
          declaration.
        </li>
        <li>
          <strong>Re-runs top-to-bottom, every reachable pass.</strong> There's no
          dependency graph and no "did the inputs change?" check the way
          <code>computed()</code> has — the right-hand expression is just re-executed in
          declaration order whenever change detection reaches that part of the template.
        </li>
        <li>
          <strong>Fresh slot per embedded view.</strong> Content inside <code>&#64;for</code>
          or <code>&#64;if</code> lives in its own embedded view, so a <code>&#64;let</code>
          declared inside one gets a new, independent copy per iteration / per time the
          block is entered — never one shared mutable variable that leaks between rows.
        </li>
        <li>
          <strong>Scope is enforced at compile time.</strong> "Used before declaration" and
          "used outside its block" are template <em>compilation</em> errors, caught before
          the app ever runs — not a runtime <code>undefined</code> the way a stray
          JavaScript variable reference would behave.
        </li>
      </ul>

      <h2>Exam pitfalls</h2>
      <ul>
        <li>
          <strong>"&#64;let is memoized like computed(), so it's fine in a hot loop."</strong>
          False. It re-evaluates on every change-detection pass that touches it — no
          caching, no dependency tracking. Expensive work belongs in a <code>computed()</code>
          class field, not a <code>&#64;let</code>.
        </li>
        <li>
          <strong>"You can update a &#64;let from a click handler."</strong> False — it's
          derived and read-only, with no setter. <code>(click)="total = total + 1"</code>
          on a <code>&#64;let</code> name is a compile error, not a silent no-op.
        </li>
        <li>
          <strong>"Once declared, a &#64;let is visible for the rest of the file, like a
          JS var."</strong> False — there's no hoisting. It's scoped to the block it's
          declared in (and nested blocks below it); reading it earlier or outside that
          block is a compile error, not <code>undefined</code>.
        </li>
        <li>
          <strong>"&#64;let needs curly braces, like &#64;if {{ '{' }} {{ '}' }}."</strong> False —
          <code>&#64;let name = expr;</code> is one statement ending in a semicolon. It has
          no block body of its own, unlike <code>&#64;if</code>/<code>&#64;for</code>/<code>&#64;switch</code>.
        </li>
        <li>
          <strong>"Binding the same expression in three places always means three
          evaluations."</strong> Only if you repeat the raw expression. A
          <code>&#64;let</code> computes it once per reachable pass and every binding that
          reads the name just reuses that stored value — this is the whole reason it fixes
          the multi-subscription <code>async</code> pipe problem.
        </li>
        <li>
          <strong>"&#64;let supports reassignment further down, like JS let."</strong>
          False — there is no <code>name = newValue;</code> syntax in a template at all.
          Each <code>&#64;let</code> is a single declaration plus initializer, which is
          exactly why it's suited to <em>derived</em> values rather than mutable state.
        </li>
      </ul>

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
      <details class="qa">
        <summary>A template reads a <code>&#64;let</code> one line above where it's declared. What happens?</summary>
        <div>A template compile-time error, not a runtime <code>undefined</code>. Angular's
        compiler statically tracks each <code>&#64;let</code>'s declaration point and scope
        and rejects any read that appears earlier — the mistake is caught before the app
        ever ships, unlike a JavaScript <code>var</code> reference.</div>
      </details>
      <details class="qa">
        <summary>A <code>&#64;let</code> is declared inside <code>&#64;for</code>. Do all rows share one variable?</summary>
        <div>No. Each iteration renders its own embedded view, and the <code>&#64;let</code>
        gets its own independent slot on that view. Row 3's value can never be overwritten
        by row 7's — they're separate storage, created and destroyed with each row.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;let name = expr;</code> creates a reusable, reactive, read-only template variable.</li>
        <li>It re-runs every change detection — <strong>not memoized</strong>; use <code>computed()</code> for expensive work.</li>
        <li>Lexically scoped: usable at and below its declaration, never before it — enforced at compile time, with no hoisting.</li>
        <li>It lives in a slot on the current view, not on the component class — inside <code>&#64;for</code>/<code>&#64;if</code> every embedded view gets its own independent copy.</li>
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
      table.ll { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 10px 0 20px; }
      table.ll th, table.ll td { border: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }
      table.ll th { background: var(--bg-elevated); }
      table.ll td:first-child { white-space: pre-wrap; color: var(--accent); width: 34%; }
      .ok { color: var(--green); font-weight: 700; }
      .bad { color: #ef4444; font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class LetBlock {
  /**
   * Unit price for the `@let` demo.
   */
  protected readonly price = signal(9.99);
  /**
   * Quantity for the `@let` demo.
   */
  protected readonly qty = signal(3);

  /**
   * Sample: chained `@let` declarations, each able to read the ones above it.
   */
  protected readonly basicSample = `@let subtotal = price() * qty();
@let tax = subtotal * 0.2;
@let total = subtotal + tax;

<p>Total: {{ total | currency }}</p>`;

  /**
   * Line-by-line notes for {@link basicSample}.
   */
  protected readonly basicBreakdown: { line: string; note: string }[] = [
    {
      line: '@let subtotal = price() * qty();',
      note:
        'Declares a template-local variable named subtotal by calling the two signals ' +
        'declared in the class, price() and qty(), and multiplying their current values. ' +
        "This lives in the template, not the class, so you don't need a computed() field " +
        'just to give a value a name.',
    },
    {
      line: '@let tax = subtotal * 0.2;',
      note:
        'Reuses subtotal, which was declared on the line above. A @let can only see ' +
        'declarations that came earlier in the same or an enclosing scope, never a later ' +
        "one — that's the 'no forward references' rule covered later on this page.",
    },
    {
      line: '@let total = subtotal + tax;',
      note:
        'Chains a third variable off the first two. Notice there is no opening/closing ' +
        'brace pair here — @let is a single statement ending in a semicolon, unlike @if ' +
        'or @for, which wrap a block of content.',
    },
    {
      line: '<p>Total: {{ total | currency }}</p>',
      note:
        "Reads total by its bare name — no parentheses, because it's a stored value, not " +
        'a function or a signal — then formats it with the currency pipe. If price or qty ' +
        'changes, subtotal, tax and total are all silently recalculated on the next ' +
        'change-detection pass.',
    },
  ];

  /**
   * Sample: `@let` with the `async` pipe — subscribing once and reusing the value,
   * instead of piping the same observable in three places.
   */
  protected readonly asyncSample = `@let user = user$ | async;
@if (user) {
  <h2>{{ user.name }}</h2>    <!-- non-null here -->
  <p>{{ user.email }}</p>     <!-- same subscription, no re-fetch -->
}`;

  /**
   * Line-by-line notes for {@link asyncSample}.
   */
  protected readonly asyncBreakdown: { line: string; note: string }[] = [
    {
      line: '@let user = user$ | async;',
      note:
        'Subscribes to user$ exactly once through the async pipe and stores the latest ' +
        'emitted value (or null before the first emission) under the name user. Every ' +
        'later read of user reuses this single subscription instead of creating a new one.',
    },
    {
      line: '@if (user) {',
      note:
        "Narrows the type: inside this block, Angular's template type-checker treats user " +
        'as non-null — the same kind of narrowing you get from the older ' +
        '*ngIf="user$ | async as user" pattern.',
    },
    {
      line: '<h2>{{ user.name }}</h2>',
      note:
        "Safe to dot straight into user.name without the safe-navigation operator (?.), " +
        'because of the narrowing on the line above — accessing .name here would fail ' +
        'type-checking if user could still be null.',
    },
    {
      line: '<p>{{ user.email }}</p>',
      note:
        'A second read of the same stored value. Because @let only subscribed once, this ' +
        'does not trigger a second subscription, a second HTTP call, or a second emission ' +
        '— both bindings share the one async result.',
    },
    {
      line: '}',
      note:
        'Closes the @if. Because user was declared with @let above the @if (not inside ' +
        'it), user stays in scope after this brace too — only the compile-time narrowing ' +
        'to "non-null" is lost outside the block, not the variable itself.',
    },
  ];

  /**
   * Sample: what `@let` does and does not memoize.
   *
   * The caveat the lesson is careful about: `@let` is a *name*, not a cache. Its
   * expression re-runs on every change-detection pass, so it saves repetition but
   * not computation — a `computed()` in the class is what saves the work.
   */
  protected readonly memoSample = `<!-- recomputed every change detection — fine when cheap -->
@let total = price() * qty();

<!-- expensive? compute in the class instead: -->
// component
readonly sortedRows = computed(() =>
  [...this.rows()].sort((a, b) => a.name.localeCompare(b.name)));
// template
@for (row of sortedRows(); track row.id) { … }`;

  /**
   * Line-by-line notes for {@link memoSample}.
   */
  protected readonly memoBreakdown: { line: string; note: string }[] = [
    {
      line: '@let total = price() * qty();',
      note:
        "Cheap arithmetic, so it's fine that this literally reruns on every " +
        'change-detection pass that reaches this template — whether or not price or qty ' +
        'actually changed since the last pass.',
    },
    {
      line:
        'readonly sortedRows = computed(() => [...this.rows()].sort((a, b) => ' +
        'a.name.localeCompare(b.name)));',
      note:
        'Lives on the class, not the template. computed() builds a memoized signal: ' +
        'Angular records exactly which signals were read while the function ran (here, ' +
        'rows()) and only reruns the function when one of those specific signals writes a ' +
        'new value. The array is spread into a copy before sort() runs, because sort() ' +
        "mutates in place — sorting the signal's own array reference directly would " +
        'corrupt its internal state without going through set()/update().',
    },
    {
      line: '@for (row of sortedRows(); track row.id) { … }',
      note:
        'Reads the memoized signal in the template. This loop only re-renders when ' +
        'sortedRows() actually returns a new array reference, not on every unrelated ' +
        "change-detection pass — exactly the win a @let in this spot would not give you.",
    },
  ];

  /**
   * Sample: `@let` scoping — a declaration belongs to the block it is written in
   * and is not visible outside it.
   */
  protected readonly scopeSample = `@if (user(); as u) {
  @let greeting = 'Hi ' + u.name;   <!-- scoped to this @if -->
  <p>{{ greeting }}</p>
}
<!-- <p>{{ greeting }}</p>  ← ERROR here: out of scope -->

<!-- <p>{{ label }}</p>     ← ERROR: used before declaration -->
@let label = 'later';`;

  /**
   * Line-by-line notes for {@link scopeSample}.
   */
  protected readonly scopeBreakdown: { line: string; note: string }[] = [
    {
      line: '@if (user(); as u) {',
      note:
        "The '; as' syntax is a different mechanism from @let — it aliases the truthy " +
        "result of the @if's own condition expression for the lifetime of this block only.",
    },
    {
      line: "@let greeting = 'Hi ' + u.name;",
      note:
        'Declared inside the @if, so its scope is this block and anything nested inside ' +
        'it — never outside, and never above this line.',
    },
    {
      line: '<p>{{ greeting }}</p>',
      note: 'Valid: still inside the same @if block where greeting was declared.',
    },
    {
      line: '}',
      note:
        'Closes the block. Everything declared inside it — both u and greeting — stops ' +
        'existing from this point on.',
    },
    {
      line: '<p>{{ greeting }}</p>  (commented out above: ERROR, out of scope)',
      note:
        "Would be a compile-time error if uncommented: greeting doesn't exist outside the " +
        '@if that declared it. This is caught when the template compiles, not at runtime.',
    },
    {
      line: '<p>{{ label }}</p>  (commented out above: ERROR, used before declaration)',
      note:
        'Also a compile error, for a different reason: label is read above the line that ' +
        "declares it. Angular's template compiler enforces top-to-bottom " +
        'declare-before-use — unlike a JavaScript var, a @let is never hoisted.',
    },
    {
      line: "@let label = 'later';",
      note: 'The actual declaration. label only becomes usable starting from this line downward.',
    },
  ];

  /**
   * Sample: `@let` inside `@for`, evaluated once per row.
   */
  protected readonly forSample = `@for (p of products(); track p.id) {
  @let line = p.price * p.qty;
  <td>{{ line | currency }}</td>
  <td>{{ line * 0.2 | currency }}</td>   <!-- reuse, don't recompute -->
}`;

  /**
   * Line-by-line notes for {@link forSample}.
   */
  protected readonly forBreakdown: { line: string; note: string }[] = [
    {
      line: '@for (p of products(); track p.id) {',
      note:
        "Iterates the products() signal's array. 'track p.id' tells Angular how to match " +
        'old and new DOM nodes across re-renders by identity rather than by index — ' +
        "required syntax for @for, not optional the way *ngFor's trackBy used to be.",
    },
    {
      line: '@let line = p.price * p.qty;',
      note:
        "Declared inside the loop body, so Angular gives every iteration's embedded view " +
        "its own independent line slot. Row 3's line is not the same storage as row 7's " +
        '— it is not one shared variable being overwritten each iteration.',
    },
    {
      line: '<td>{{ line | currency }}</td>',
      note: "First use of this row's line value.",
    },
    {
      line: '<td>{{ line * 0.2 | currency }}</td>',
      note:
        'Second use in the same row. p.price * p.qty itself is not recomputed here — only ' +
        'the already-stored line is read and multiplied by 0.2.',
    },
    {
      line: '}',
      note:
        "Closes the @for body. Each iteration's line is torn down along with that " +
        "iteration's embedded view whenever the row disappears from products().",
    },
  ];

  /**
   * Sample: what a `@let` compiles to — a slot on the current view, which is why
   * it is scoped to the block and re-evaluated per pass.
   */
  protected readonly underTheHoodSample = `// Conceptually, each @let reserves its own hidden slot on the CURRENT VIEW
// (not a class field, not a global variable):

view.slot[0] = price() * qty();              // @let subtotal = ...
view.slot[1] = view.slot[0] * 0.2;            // @let tax = ...
view.slot[2] = view.slot[0] + view.slot[1];   // @let total = ...

// Every change-detection pass that reaches this template RE-RUNS those
// assignments, top to bottom, in declaration order — no dependency tracking,
// no "did anything actually change?" check. That's the opposite of
// computed(), which subscribes to specific signals and only reruns when one
// of them fires.

// Scope is a COMPILE-TIME concept: the template compiler tracks which block
// each @let belongs to and refuses to compile a read that appears before the
// declaration, or outside its enclosing block — there is no runtime lookup
// or "undefined" fallback the way a stray JS variable reference would behave.

// Inside @for / @if, each embedded view gets its OWN slot: 100 rows means
// 100 independent copies of that row's @let, created and destroyed with the
// row's view — never one shared mutable variable.`;
}
