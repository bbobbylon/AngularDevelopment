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
  templateUrl: './let-block.html',
  styleUrl: './let-block.css',
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
