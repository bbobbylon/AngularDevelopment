import { CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: the @let template variable.
 *
 * Beyond "name a value once": the crucial nuance that @let is re-evaluated every
 * change-detection pass (NOT memoized like computed()), the exact scope/forward-
 * reference rules, why it fixes the async-pipe multi-subscription problem, a
 * comparison against computed(), template reference variables and the `; as`
 * alias, a line-by-line walkthrough of every code sample, what Angular is
 * actually doing internally with the declaration, and the exam traps.
 *
 * ## Presentation
 *
 * Pose the problem (repeat an expression, or subscribe three times?), analogy
 * before vocabulary (a sticky note, not a locked box), then the same
 * mechanism in four modes — a dialogue between @let and change detection, an
 * annotated code lab for each of the three real shapes it takes (chained,
 * async-unwrap, per-row), a wrong/right scope comparison, and the live price
 * × qty bill this lesson already had.
 */
@Component({
  selector: 'app-lesson-let-block',
  imports: [
    RouterLink,
    CurrencyPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Control Flow track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: '@if', id: 'control-flow-if' },
    { label: '@for', id: 'control-flow-for' },
    { label: '@switch', id: 'control-flow-switch' },
    { label: '@let' },
    { label: 'Built-in Directives', id: 'builtin-directives' },
  ];

  /**
   * @let and a change-detection pass, negotiating whether re-running an
   * expression is actually owed — it never is, which is the whole nuance.
   */
  protected readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'A change-detection pass',
      says: 'Reached your line in the template. Running you again.',
    },
    {
      who: '@let subtotal',
      says: "Recomputing price() * qty(). Same result as last time — doesn't matter, I don't check.",
    },
    {
      who: 'A change-detection pass',
      says: 'Ten passes later, for a click on a completely different part of the page.',
    },
    {
      who: '@let subtotal',
      says: "Recomputing anyway. I don't know or care what triggered this pass — I just re-run.",
    },
    {
      who: 'computed() total',
      says: "I'd have skipped that. I actually remember which signals I read, and only rerun when one of them changes.",
    },
    {
      who: '@let subtotal',
      says: "That's you, not me. I'm a name for an expression, not a cache for a result.",
    },
  ];

  /**
   * Sample: chained `@let` declarations, each able to read the ones above it.
   */
  protected readonly basicSample = `@let subtotal = price() * qty();
@let tax = subtotal * 0.2;
@let total = subtotal + tax;

<p>Total: {{ total | currency }}</p>`;

  /** Line-by-line walkthrough of {@link basicSample}. */
  protected readonly basicNotes: CodeNote[] = [
    {
      line: 1,
      text: "Declares a template-local variable named `subtotal` by calling the two signals declared in the class, `price()` and `qty()`. This lives in the template, not the class, so you don't need a `computed()` field just to give a value a name.",
    },
    {
      line: 2,
      text: 'Reuses `subtotal`, declared on the line above. A @let can only see declarations that came earlier in the same or an enclosing scope, never a later one — the "no forward references" rule covered further down this page.',
    },
    {
      line: 3,
      text: 'Chains a third variable off the first two. No opening/closing brace pair here — @let is a single statement ending in a semicolon, unlike @if or @for, which wrap a block of content.',
    },
    {
      line: 5,
      text: "Reads `total` by its bare name — no parentheses, because it's a stored value, not a function or a signal — then formats it with the currency pipe. If price or qty changes, subtotal, tax and total are all silently recalculated on the next change-detection pass.",
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

  /** Line-by-line walkthrough of {@link asyncSample}. */
  protected readonly asyncNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Subscribes to `user$` exactly once through the async pipe and stores the latest emitted value (or `null` before the first emission) under the name `user`. Every later read of `user` reuses this single subscription instead of creating a new one.',
    },
    {
      line: 2,
      text: 'Narrows the type: inside this block, the template type-checker treats `user` as non-null — the same narrowing you\'d get from the older `*ngIf="user$ | async as user"` pattern.',
    },
    {
      line: 3,
      text: 'Safe to dot straight into `user.name` without `?.`, because of the narrowing on the line above — this would fail type-checking if `user` could still be `null` here.',
    },
    {
      line: 4,
      text: 'A second read of the same stored value. Because @let only subscribed once, this does not trigger a second subscription, a second HTTP call, or a second emission — both bindings share the one async result.',
    },
    {
      line: 5,
      text: 'Closes the @if. Because `user` was declared with @let above the @if — not inside it — `user` stays in scope after this brace too; only the compile-time narrowing to "non-null" is lost outside the block, not the variable itself.',
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
   * Sample: `@let` inside `@for`, evaluated once per row.
   */
  protected readonly forSample = `@for (p of products(); track p.id) {
  @let line = p.price * p.qty;
  <td>{{ line | currency }}</td>
  <td>{{ line * 0.2 | currency }}</td>   <!-- reuse, don't recompute -->
}`;

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

  /**
   * The re-run sequence, every reachable pass — no memoization step anywhere
   * in it, which is the entire point of drawing it as a loop back to the top.
   */
  protected readonly rerunFlow: FlowStep[] = [
    {
      label: 'Pass reaches this template',
      detail: 'No check for "did anything relevant change" happens first.',
      tone: 'accent',
    },
    { label: 'slot[0] = price() * qty()', detail: 're-runs subtotal from scratch' },
    { label: 'slot[1] = slot[0] * 0.2', detail: 're-runs tax from scratch' },
    { label: 'slot[2] = slot[0] + slot[1]', detail: 're-runs total from scratch' },
    {
      label: 'Next reachable pass: repeat all four steps',
      detail: 'Every time, dependencies changed or not.',
      tone: 'warn',
    },
  ];

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 4,
      text: "Each @let reserves a slot on the view's own internal array — never a class field, never anything reachable from TypeScript code or another template.",
    },
    {
      line: 6,
      text: 'Chaining works because later slots simply read earlier ones by index, in the exact declaration order they appear in the template.',
    },
    {
      line: 8,
      text: 'No dependency graph, no "did the inputs actually change" check — every reachable pass re-runs this assignment from scratch, top to bottom. That\'s the entire meaning of "@let is not memoized".',
    },
    {
      line: 14,
      text: '"Used before declaration" and "used outside its block" are template *compilation* errors, caught before the app ever ships — never a runtime `undefined` the way a stray JavaScript variable reference would behave.',
    },
    {
      line: 19,
      text: 'Content inside @for or @if lives in its own embedded view, so a @let declared there gets a fresh, independent slot per iteration or per time the block is entered — never one shared mutable variable that leaks between rows.',
    },
  ];

  /** The self-test for the memoization nuance — the myth most worth unlearning. */
  protected readonly memoQuizOptions: QuizOption[] = [
    {
      text: 'True — @let caches its value and only recomputes when price or qty changes.',
      why: "That's the exact claim to unlearn. @let has no dependency tracking and no cache at all — that description is computed(), not @let.",
    },
    {
      text: '"@let is memoized like computed()" is false — it re-evaluates on every reachable change-detection pass, cache-free.',
      correct: true,
      why: 'Right. For cheap arithmetic like price() * qty() it barely matters — but the moment the expression gets expensive (sorting, filtering, formatting thousands of rows), that per-pass re-run becomes the entire cost of the page. computed() is what actually memoizes.',
    },
    {
      text: 'False — but only because @let recomputes for the first row of a @for and reuses that value for every other row.',
      why: "Each row gets its own independent slot for the @let, and each one recomputes completely independently, every pass. There's no first-row-wins sharing between rows.",
    },
    {
      text: 'It depends on whether the component uses OnPush.',
      why: 'OnPush controls whether a pass reaches this view AT ALL — it has no effect on what @let does once a pass gets there. Inside a reached view, @let always re-runs, OnPush or not.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is @let cached like computed()?',
      a: 'No. It re-evaluates on every change-detection pass that reaches it. Use `computed()` in the class for expensive or widely-shared derivations.',
    },
    {
      q: 'Can I write to a @let from a click handler?',
      a: "No — it's read-only and derived, with no setter. Keep mutable state in a `signal` and derive the @let from it.",
    },
    {
      q: 'Why prefer `@let x = obs$ | async` over piping the same observable in three places?',
      a: 'Each `| async` is its own subscription. One @let shares a single subscription across every use, and narrows away `null` inside an `@if`.',
    },
    {
      q: "A template reads a @let one line above where it's declared. What happens?",
      a: "A template compile-time error, not a runtime `undefined`. The compiler statically tracks each @let's declaration point and scope, and rejects any read that appears earlier — caught before the app ever ships, unlike a JavaScript `var` reference.",
    },
    {
      q: 'A @let is declared inside @for. Do all the rows share one variable?',
      a: "No. Each iteration renders its own embedded view, and the @let gets its own independent slot on that view. Row 3's value can never be overwritten by row 7's — separate storage, created and destroyed with each row.",
    },
  ];
}
