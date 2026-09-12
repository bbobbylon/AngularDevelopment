import { AsyncPipe } from '@angular/common';
import { Component, afterRenderEffect, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, map, timer } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Interpolation & Template Expressions — the `{{ }}` syntax, what kinds
 * of expressions are legal inside it, a live proof that a template method call
 * re-runs every check while `computed()` memoizes, null/undefined handling
 * with safe navigation, the `[object Object]` pitfall, and what the Angular
 * compiler actually generates for an interpolated text node.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. This is a **beginner** lesson, so the
 * mechanism stops at "a check reads, stringifies, compares, and maybe writes" —
 * it deliberately does not reach for OnPush, zones or the scheduler, which the
 * change-detection lesson owns.
 *
 * The teaching order:
 *
 * 1. **Pose the problem first.** "You changed a value — how does the screen
 *    find out?", with a napkin asking the reader to commit to a guess before
 *    any syntax appears.
 * 2. **Analogy before vocabulary.** `{{ }}` as a peephole in a door: you can
 *    look through it and see what is there *right now*, but you cannot reach a
 *    hand through it. That one image explains both halves of the topic at
 *    once — why it stays live (look again, see the current state) and why it
 *    only accepts an expression, never a statement (a look, never a reach).
 * 3. **Then the same idea in several modes** — a dialogue between the template
 *    and the component, a labelled diagram of one check, a taped row of the
 *    three things every interpolation always does, and a side-by-side of
 *    expression vs. statement — before landing on the live demos.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Demos on this page
 *
 * - basic string interpolation (`first`, `last`) — kept from the original;
 * - arithmetic, a ternary and a plain method call (`count`, `square`) — kept;
 * - **the method-vs-`computed` live proof** — kept, now preceded by a
 *   `app-predict` asking the reader to guess whether an unrelated click still
 *   re-runs an expensive method call inside `{{ }}`;
 * - **null/object handling** — kept, now preceded by a `app-predict` on what
 *   `{{ user() }}` prints when `user` is a plain object, and followed by a
 *   `app-quiz` on what it prints when `user` is `null`.
 *
 * @see beginner/property-binding — `[property]` vs. `{{ }}`, the next lesson.
 * @see beginner/signals — the reactive primitive most of these demos read.
 */
@Component({
  selector: 'app-lesson-interpolation',
  imports: [
    RouterLink,
    AsyncPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './interpolation.css',
  templateUrl: './interpolation.html',
})
export class Interpolation {
  /**
   * First name for the string-expression demo.
   */
  protected readonly first = signal('Grace');
  /**
   * Last name for the string-expression demo.
   */
  protected readonly last = signal('Hopper');
  /**
   * A number for the arithmetic and ternary demos.
   */
  protected readonly count = signal(3);

  /**
   * Squares a number, called straight from the template.
   *
   * Exists so the lesson can point at what that costs: see {@link noisyDouble}.
   *
   * @param n The input.
   */
  protected square(n: number): number {
    return n * n;
  }

  // ---- Live proof: computed() memoizes, a plain method call in a template does not ----
  /**
   * The input to both halves of the method-vs-`computed` demo.
   */
  protected readonly seed = signal(2);
  /**
   * An **unrelated** signal, changed by a button that touches nothing the demo
   * reads.
   *
   * It is the control in the experiment: bumping it must not change either
   * result, so any re-execution it causes is pure waste — which is exactly what
   * the method-call counter goes on to show.
   */
  protected readonly unrelatedTick = signal(0);

  /** Plain (non-signal) counter — safe to mutate for demo instrumentation; it notifies nobody. */
  protected noisyRuns = 0;
  /**
   * What the template actually shows. Angular's dev-mode double-check re-invokes
   * `noisyDouble()` a second time within the same tick (to verify nothing changed), so
   * `noisyRuns` itself is already one increment ahead of what the first pass rendered by the
   * time that second pass re-reads it — binding straight to `noisyRuns` would make the two
   * passes disagree and throw ExpressionChangedAfterItHasBeenCheckedError.
   *
   * A SIGNAL, snapshotted once per render (below, via `afterRenderEffect`) — not a plain
   * field written from `afterEveryRender`, which was this field's original shape and still
   * threw the same NG0100 on the very first render. A plain field is compared by the LView's
   * own before/after read of that exact template expression; `afterEveryRender` can still
   * write it before dev mode's checkNoChanges verify re-reads the template, so the verify
   * pass sees a value the original render never painted. `afterRenderEffect` exists
   * specifically for this: it is exempt from the verify comparison, and a signal write from
   * inside it schedules its OWN next pass rather than needing to already agree with the one
   * that just finished.
   */
  protected readonly noisyRunsDisplay = signal(0);
  /** Called directly from the template; re-executes on every change-detection pass that reaches it. */
  protected noisyDouble(): number {
    this.noisyRuns++;
    return this.seed() * 2;
  }

  /**
   * Snapshots the method-call counter once per render.
   *
   * The display value cannot be bound directly: dev mode runs change detection a
   * second time to verify nothing changed, which calls {@link noisyDouble} again
   * and leaves the counter one ahead of what the first pass rendered. The two
   * passes would then disagree and Angular would throw
   * `ExpressionChangedAfterItHasBeenCheckedError` — the demo's instrumentation
   * causing the very bug the demo is not about.
   */
  constructor() {
    afterRenderEffect(() => {
      this.noisyRunsDisplay.set(this.noisyRuns);
    });
  }

  /**
   * How many times the `computed` has actually recomputed.
   *
   * The number to compare against the method's counter: the method's climbs on
   * every change-detection pass, this one only when {@link seed} changes.
   */
  protected computedRuns = 0;
  /**
   * computed() tracks exactly which signals were read on its last run (here, only
   * seed()) and only re-invokes this callback when one of them actually changed.
   */
  protected readonly computedDouble = computed(() => {
    this.computedRuns++;
    return this.seed() * 2;
  });

  /**
   * Bumps the input both halves of the demo depend on. Both counters advance.
   */
  protected bumpSeed(): void {
    this.seed.update((v) => v + 1);
  }

  /**
   * Bumps the unrelated signal. Only the method's counter advances — the point of
   * the whole demo, and the live proof behind {@link methodPredictAnswer}.
   */
  protected bumpUnrelated(): void {
    this.unrelatedTick.update((v) => v + 1);
  }

  // ---- Live proof: null handling & the [object Object] pitfall ----
  /**
   * A nullable user for the safe-navigation demo.
   */
  protected readonly user = signal<{ name: string } | null>({ name: 'Ada' });

  /**
   * Toggles the user between present and `null`, so `{{ user()?.name }}` can be
   * seen surviving both.
   */
  protected toggleUser(): void {
    this.user.update((u) => (u ? null : { name: 'Ada' }));
  }

  // ---- Live proof: interpolating an Observable directly vs. through `| async` ----
  /**
   * A fake network Observable for the async-interpolation demo. Built with
   * `timer` rather than `of` on purpose — `of` emits synchronously, on
   * subscribe, before the trap this demo exists to show (`| async` handing
   * back `null` before the first emission) could ever actually be seen.
   */
  protected readonly userName$: Observable<string> = timer(1200).pipe(map(() => 'Ada'));

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The early-templates path a beginner walks, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Components', id: 'components' },
    { label: 'Interpolation' },
    { label: 'Property Binding', id: 'property-binding' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding', id: 'two-way-binding' },
  ];

  /**
   * The peephole analogy, staged as a short exchange between the template and
   * the component it reads from.
   *
   * Deliberately not the "I read you / I noted you" exchange the change-
   * detection and signals lessons already use for a *different* relationship
   * (a signal and its consumer) — this one is about the template and the class
   * it renders, and about the one-way nature of the read.
   */
  protected readonly peepTalk: BubbleTurn[] = [
    { who: 'Template', says: "What's in `first` right now?" },
    {
      who: 'Component',
      says: "`'Grace'`. Ask me again whenever you like — I keep no memory of you asking.",
    },
    { who: 'Template', says: 'Can I set it to `Ada` while I have your attention?' },
    {
      who: 'Component',
      says: 'No. You get to look through the hole, not reach through it. Want to change me? Wire up an event binding instead.',
    },
    { who: 'Template', says: 'Fine — and if I look again in five minutes?' },
    {
      who: 'Component',
      says: "Same hole, new answer. Whatever `first()` returns **at that moment** is what you'll see — that's the whole reason this stays in sync without you doing anything.",
    },
  ];

  /**
   * What one interpolation check actually does, in order.
   *
   * The visual companion to {@link underTheHoodSample}: the compiled
   * instructions are the *proof*, this is the *shape* a beginner can hold onto
   * without reading `ɵɵ`-prefixed function names.
   */
  protected readonly checkFlow: FlowStep[] = [
    { label: 'Evaluate', detail: "Run the expression fresh — e.g. `first() + ' ' + last()`" },
    { label: 'Stringify', detail: "Coerce the result to text — `null`/`undefined` become `''`" },
    {
      label: 'Compare',
      detail: 'Diff the new string against what was painted last time',
      tone: 'accent',
    },
    {
      label: 'Write (maybe)',
      detail: 'Touch the DOM only if the string actually changed',
      tone: 'good',
    },
  ];

  /** Sample: interpolating values and expressions. */
  protected readonly basicSample = `<p>Full name: {{ first() }} {{ last() }}</p>
<p>Characters: {{ (first() + last()).length }}</p>
<p>Uppercase: {{ (first() + ' ' + last()).toUpperCase() }}</p>`;

  /** Line-by-line walkthrough of {@link basicSample}. */
  protected readonly basicNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two separate interpolations sharing one line of text. `first` and `last` are signals — calling them with `()` reads the current value, not the signal object itself — and Angular stringifies each result and glues them back together with the literal space that sits between the two `{{ }}` pairs in the source.',
    },
    {
      line: 2,
      text: "An ordinary TypeScript expression is allowed as long as it evaluates to a single value with no side effects: string concatenation, then `.length` off the result. Angular re-runs the **whole** expression on every check — there's no partial re-evaluation of the pieces inside it.",
    },
    {
      line: 3,
      text: "Calling `.toUpperCase()` on the computed string is fine, because it's pure and deterministic for the same input — exactly the class of call the expression sandbox is built to allow.",
    },
  ];

  /** Sample: arithmetic, a ternary and a method call inside `{{ }}`. */
  protected readonly mathSample = `<span>count = {{ count() }}</span>
<p>Doubled: {{ count() * 2 }}</p>
<p>Is even? {{ count() % 2 === 0 ? 'yes' : 'no' }}</p>
<p>Squared via method: {{ square(count()) }}</p>`;

  /** Line-by-line walkthrough of {@link mathSample}. */
  protected readonly mathNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Reads the counter signal directly — the cheapest interpolation there is: no operators, no method call, just a value read.',
    },
    {
      line: 2,
      text: "Arithmetic is allowed inline. Angular re-evaluates `count() * 2` on every pass that reaches this view, but only writes to the DOM's `Text` node when the new string actually differs from the last one.",
    },
    {
      line: 3,
      text: "The ternary operator is explicitly allowed — it's still one expression, unlike an `if`/`else` statement, which is not. Strict `===` avoids the coercion surprises `==` can produce.",
    },
    {
      line: 4,
      text: "Legal syntax, and the exact anti-pattern the next section measures: Angular can't know `square()` is pure just by looking at the call, so it re-invokes it on every change-detection pass that reaches this template — harmless for something this trivial, costly for anything that isn't.",
    },
  ];

  /** Short "allowed" side of the expression-vs-statement comparison. */
  protected readonly compareAllowedSample = `{{ count() }}
{{ count() * 2 }}
{{ isEven() ? 'yes' : 'no' }}
{{ user()?.name }}`;

  /** Short "blocked" side of the expression-vs-statement comparison. */
  protected readonly compareBlockedSample = `{{ count = 5 }}
{{ count()++ }}
{{ new Date() }}
{{ first(); last() }}`;

  /**
   * Sample: the method-call against `computed` comparison, with the component code
   * alongside the template.
   */
  protected readonly noisyVsComputedSample = `// Component class
protected readonly seed = signal(2);

protected noisyRuns = 0;
protected noisyDouble(): number {
  this.noisyRuns++;              // proves this body ran again
  return this.seed() * 2;
}

protected computedRuns = 0;
protected readonly computedDouble = computed(() => {
  this.computedRuns++;           // proves this body ran again
  return this.seed() * 2;
});

// Template
<p>Method call: {{ noisyDouble() }} (ran {{ noisyRuns }} times)</p>
<p>computed(): {{ computedDouble() }} (ran {{ computedRuns }} times)</p>`;

  /** Line-by-line walkthrough of {@link noisyVsComputedSample}. */
  protected readonly noisyVsComputedNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The one writable signal both derivations depend on — the single source of truth this whole comparison is built around.',
    },
    {
      line: 5,
      text: "An ordinary method. Angular has no way to know it 'really' only depends on `seed()` — it has to assume the return value could differ on every single check, so it runs the whole body, increment included, every time the template is checked.",
    },
    {
      line: 6,
      text: "A plain (non-signal) counter, here purely as instrumentation. Mutating it never notifies Angular of anything — it's just a way to make invocations visible for this demo, not reactive state.",
    },
    {
      line: 11,
      text: '`computed()` records exactly which signals were read during its **last** run — here, only `seed()`. It only re-invokes this callback, and therefore only re-runs the increment on the line below it, when one of those recorded dependencies actually produced a new value.',
    },
    {
      line: 17,
      text: "Both `noisyDouble()` and `computedDouble()` are **read** here on every check that reaches this view — that part is unavoidable, it's just a function/signal call. The difference is entirely inside each one: the method's body always runs to completion; the computed's short-circuits to a cached value when nothing it depends on has changed.",
    },
  ];

  /** Prompt for the "does an unrelated click still cost you?" prediction. */
  protected readonly methodPredictPrompt =
    'A template calls `loadReport()` — a method that filters a 10,000-row array — inside an interpolation. You then click a totally unrelated button somewhere else on the page, one that has nothing to do with the report. Does `loadReport()` run again?';

  /** Tiny code sample shown alongside {@link methodPredictPrompt}. */
  protected readonly methodPredictCode = `<p>Rows shown: {{ loadReport().length }}</p>`;

  /** Reveal for {@link methodPredictPrompt}. */
  protected readonly methodPredictAnswer =
    "Yes — every single time, no matter how unrelated the click was. Angular has no way to know that `loadReport()`'s result only depends on some of your data; it just re-runs the whole method body on every change-detection pass that reaches this view, 'just in case' something changed. For a cheap calculation that's invisible. For a 10,000-row filter, an unrelated click somewhere else on the page can cost a real, measurable delay — with nothing in the console to explain why. This is the entire reason the exam (and every style guide) says: put anything non-trivial behind `computed()` or a pure pipe, which only re-run when their actual inputs change. Try it below with `bumpUnrelated()` — the method's counter climbs, the computed's does not.";

  /**
   * Sample: expressions a template *cannot* contain — assignment, `new`,
   * increment, chained statements — and why the restriction exists.
   */
  protected readonly invalidSample = `<!-- Assignment: templates may only READ, never write -->
<p>{{ count = 5 }}</p>              <!-- compile error -->

<!-- new / increment / decrement mutate — also blocked -->
<p>{{ new Date() }}</p>             <!-- compile error -->
<p>{{ count()++ }}</p>              <!-- compile error -->

<!-- Chaining with ; or , isn't a single expression -->
<p>{{ first(); last() }}</p>        <!-- compile error -->

<!-- No ambient globals inside the expression sandbox -->
<p>{{ window.innerWidth }}</p>      <!-- compile error -->

<!-- | is ALWAYS the pipe operator here, never bitwise OR -->
<p>{{ a | b }}</p>                  <!-- 'b' is looked up as a pipe name -->`;

  /** Line-by-line walkthrough of {@link invalidSample}. */
  protected readonly invalidNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Assignment writes state; a template expression may only **read**. Writes belong in an event binding instead — `(click)="count.set(5)"` — which Angular parses as a **statement**, not an expression, and statements are allowed to have side effects.',
    },
    {
      line: 5,
      text: "`new` is disallowed: constructing an object is exactly the kind of non-idempotent operation the expression grammar deliberately excludes — call it twice and you'd get two different `Date` instances from what looks like the same read.",
    },
    {
      line: 6,
      text: "Increment/decrement mutate a value in place, so the same 'reads only' rule blocks them too.",
    },
    {
      line: 9,
      text: "`;` and `,` chain **statements**. A template expression has to parse as one single expression — there's no way to 'run two things' inside one pair of braces.",
    },
    {
      line: 12,
      text: "Top-level template expressions resolve only against the component instance and any template-local variables (like `let item` in `@for`) — ambient globals like `window` aren't in scope. Inject what you need and expose it as a component member instead.",
    },
    {
      line: 15,
      text: "Inside a template, `|` is **always** the pipe operator, never JavaScript's bitwise OR. `b` here is looked up as a **pipe name**, and the build fails if nothing called `b` is registered as one.",
    },
  ];

  /** Prompt for the "does interpolating an object throw?" prediction. */
  protected readonly objectPredictPrompt =
    "The `user` signal currently holds a real object: `{ name: 'Ada' }`. You interpolate the whole thing directly — `{{ user() }}` — instead of `user()?.name`. What shows up on the page?";

  /** Reveal for {@link objectPredictPrompt}. */
  protected readonly objectPredictAnswer =
    "Nothing throws. The page prints the text `[object Object]` instead. Angular still has to turn the object into a string somehow, and a plain object's default `toString()` produces exactly that placeholder — so you get a confusing word on screen instead of an error you could search for. If you actually want to see the object's shape while debugging, interpolate `{{ user() | json }}`, or better, interpolate the specific field you meant to show.";

  /**
   * Sample: handling null safely, and when to reach for a binding or a pipe
   * instead of interpolation.
   */
  protected readonly nullHandlingSample = `<p>{{ user()?.name }}</p>          <!-- '' if user() is null, no crash -->
<img [src]="avatar()" />           <!-- property binding, not interpolation -->
<p>{{ price() | currency }}</p>    <!-- format with a pipe -->`;

  /** Line-by-line walkthrough of {@link nullHandlingSample}. */
  protected readonly nullHandlingNotes: CodeNote[] = [
    {
      line: 1,
      text: "The safe-navigation operator `?.` short-circuits to `undefined` the instant `user()` is `null`/`undefined`, instead of throwing 'Cannot read properties of null'. Angular then stringifies that `undefined` down to an empty string — no crash, and no visible error either.",
    },
    {
      line: 2,
      text: 'Square brackets are a **property binding**, not interpolation: the raw return value of `avatar()` is assigned directly to the DOM `src` property, preserving its real type. Writing `src="{{ avatar() }}"` instead would force it through string interpolation first.',
    },
    {
      line: 3,
      text: 'The pipe runs **after** the signal is read, formatting the raw number into a display string. Pipes are the idiomatic place for display formatting, not string concatenation inside the expression itself.',
    },
  ];

  /**
   * Self-test — what `{{ user() }}` prints when `user` is `null`, right after
   * the object-interpolation prediction covered the non-null case.
   *
   * Distractors name the three real ways a beginner mis-imagines this: plain
   * JS stringification, a build-time type error, and confusing it with the
   * object case just covered above.
   */
  protected readonly nullVsObjectOptions: QuizOption[] = [
    {
      text: 'The text `null`, spelled out.',
      why: "That's what plain JavaScript string concatenation would give you — `'' + null` really does produce `'null'` — but Angular's interpolation pipeline checks for `null`/`undefined` explicitly and swaps in an empty string before that concatenation ever happens. The word `null` never reaches the screen.",
    },
    {
      text: 'Nothing visible — an empty string.',
      correct: true,
      why: "Exactly. Angular treats `null` and `undefined` as `''` when it stringifies an interpolated value. Nothing renders, nothing throws, and — this is the trap — nothing in the console tells you why the text is missing.",
    },
    {
      text: "A runtime error, because you can't interpolate a nullable value.",
      why: "A strictly-typed template setup might flag this at *build* time, but at runtime a nullish value never throws from inside `{{ }}`. It just quietly becomes nothing — arguably worse than an error, since there's nothing to search for.",
    },
    {
      text: '`[object Object]`, the same as any other object.',
      why: "That's what an actual object like `{ name: 'Ada' }` prints, because Angular falls back to plain string concatenation (`'' + value`), which calls `Object.prototype.toString`. `null` is caught by an earlier, explicit check specifically so it never reaches that fallback.",
    },
  ];

  /**
   * Sample: roughly what the compiler emits for an interpolated line — the
   * `advance`/`textInterpolate` pair and its dirty check.
   */
  protected readonly underTheHoodSample = `// This template line:
<p>Hi {{ name() }}, you have {{ count() }} messages</p>

// compiles to (simplified) instructions for the component's view:

// --- creation mode: runs once ---
ɵɵelementStart(0, 'p');
ɵɵtext(1);                      // reserves an empty text node at slot 1
ɵɵelementEnd();

// --- update mode: runs every change-detection pass that reaches this view ---
ɵɵadvance(1);                   // move the slot pointer to node 1
ɵɵtextInterpolate2(
  'Hi ', ctx.name(), ', you have ', ctx.count(), ' messages'
);
// diffs the freshly-built string against what it wrote last time;
// the DOM Text node's .data is only touched when it actually changed.`;

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 7,
      text: "Creation-mode instructions run **once** per view instance, before any data exists to fill them in. `ɵɵelementStart(0, 'p')` builds the `<p>` element; `0` is its slot index in this view's internal array — how Angular finds the node again without ever querying the DOM.",
    },
    {
      line: 8,
      text: '`ɵɵtext(1)` reserves an empty text node at slot 1. It says nothing yet; the update-mode instructions below are what fill it in.',
    },
    {
      line: 12,
      text: '`ɵɵadvance(1)` moves an internal cursor to slot 1 before the next instruction touches that node — Angular finds the right spot by index, never by re-walking the template tree.',
    },
    {
      line: 13,
      text: "`ɵɵtextInterpolate2` — the '2' means the compiler found exactly two dynamic expressions in this text node. There's a specialised instruction per expression count (1 through 8, then a generic form for more), purely to avoid allocating an array for the common cases.",
    },
    {
      line: 16,
      text: "The expressions themselves always re-run on a pass that reaches this view. What's cheap is what happens **after**: the real DOM `Text.data` is only written when the freshly-built string differs from what was painted last time — which is why interpolation stays cheap even though 'it runs every pass' is technically true.",
    },
  ];

  /**
   * The literal source text `{{ '{{' }}`, rendered through interpolation
   * because typing the raw braces directly into the `.html` — even as the
   * text of a `<code>` element — would itself open a real interpolation and
   * break the build; this field exists purely to sidestep that trap.
   */
  protected readonly selfInterpolationSource = "{{ '{{' }}";

  /**
   * Sample: the escape hatch for a component whose template has to coexist
   * with a different templating language that also uses `{{ }}`.
   */
  protected readonly customDelimiterSample = `@Component({
  selector: 'app-legacy-page',
  interpolation: ['[[', ']]'],
  template: \`<p>[[ first() ]]</p>\`,
})
export class LegacyPage {}`;

  /** Line-by-line walkthrough of {@link customDelimiterSample}. */
  protected readonly customDelimiterNotes: CodeNote[] = [
    {
      line: 3,
      text: "`interpolation` takes a two-element tuple — open marker, close marker — and replaces `{{ }}` for THIS component's template only. Every other component in the app keeps using the default.",
    },
    {
      line: 4,
      text: 'The template now reads `[[ … ]]` instead of `{{ … }}` — genuinely different delimiters, not an escaped form of the usual ones. A stray `{{ }}` left over from a copy-paste is now just plain text here, not an interpolation.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why can’t I write something like `{{ if (x) { … } }}` inside the braces?',
      a: "Because `{{ }}` only speaks **expressions** — something that evaluates to a single value — and `if` is a **statement**, an instruction to do something conditionally. There's no version of `if` in JavaScript that evaluates to a value, so the parser for `{{ }}` was never built to understand it. A real conditional block in your markup is a completely different piece of syntax — `@if` — that wraps *around* markup instead of living inside a pair of braces.",
    },
    {
      q: "What's the actual difference between `{{ }}` and `[property]`?",
      a: '`{{ }}` always ends up as **text** — Angular stringifies whatever you give it and drops it between two text nodes. `[property]` assigns the **real value**, untouched, straight to a DOM property or a component input. `<img src="{{ url }}">` sends the *string* form of `url`; `<img [src]="url">` sends whatever `url` actually is. For anything that isn\'t plain text content, reach for the square brackets.',
    },
    {
      q: 'If `{{ }}` reruns on every check anyway, why does it matter how I write the expression?',
      a: "Because 'runs on every check' and 'costs the same every time' are different claims. `{{ count() }}` is a slot read — essentially free. `{{ sortedList() }}`, if `sortedList` is a method that sorts an array, is a full sort — every single pass. Both 'run' on every check, but one of them is doing real work dozens of times a second and the other genuinely isn't.",
    },
    {
      q: 'Does `{{ }}` work inside any attribute, like `title="{{ tooltip }}"`?',
      a: 'Yes, and it\'s the same trap as `value="{{ n }}"` — it produces a string glued into the attribute rather than a live binding to a property. That\'s fine for a genuinely textual attribute like `title` or `alt`. For anything that should stay a real typed value, reach for `[attr.title]` or a property binding instead.',
    },
    {
      q: 'Can I put more than one `{{ }}` in the same piece of text?',
      a: "Yes — `Hi {{ first() }}, you have {{ count() }} messages` is completely normal. It's also exactly why the compiler has a whole family of instructions, `textInterpolate1` through `textInterpolate8`, one per how many separate expressions show up in that single text node — a build-time detail you can see for yourself in the 'under the hood' sample above.",
    },
  ];
}
