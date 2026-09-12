import { Component, signal } from '@angular/core';
import {
  NgClass,
  NgFor,
  NgIf,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Built-in Directives & Legacy Control Flow — `*ngIf`, `*ngFor`,
 * `ngClass`, `ngStyle` and `ngSwitch`.
 *
 * A deliberately *legacy* lesson. The modern equivalents (`@if`, `@for`,
 * `@switch`, and plain `[class.x]` / `[style.x]` bindings) are covered in their
 * own lessons and are what you should write today. This page exists because you
 * will still meet the structural-directive syntax in every codebase older than
 * Angular 17, in most tutorials, and in exam questions — and because the `*`
 * prefix is not obvious once you stop seeing it every day.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the problem before naming it.** The page opens on a rule every
 *    beginner hits and nobody explains — you can never put two structural
 *    directives on one element — and asks the reader to guess why before any
 *    mechanism is described.
 * 2. **Analogy before vocabulary.** An `<ng-template>` is a stencil, not a page:
 *    holding it does nothing until something presses it down. That frame gives
 *    `TemplateRef`/`ViewContainerRef` somewhere to land before those words carry
 *    any weight, staged twice — once in prose, once as a dialogue between "you",
 *    the compiler and `NgIf`.
 * 3. **The same idea in several modes.** The desugaring gets a quiz (commit to
 *    an answer), a `CodeLab` (the literal before/after), and a `Flow` diagram
 *    (the runtime steps) — three angles on one rewrite, because that rewrite is
 *    the single fact every other rule on this page follows from.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`:
 *    the desugared template, `*ngIf`'s else/then/as trio, `*ngFor`'s microsyntax
 *    plus its `trackBy` function, `[ngSwitch]`, and `ngClass`/`ngStyle`'s three
 *    forms.
 *
 * The demos run the *real* `@angular/common` directives side by side with their
 * annotated source, so the mapping between "what you read" and "what runs" is
 * direct rather than asserted.
 *
 * @see beginner/control-flow-if — the modern `@if`/`@else` this page's `*ngIf` predates.
 * @see beginner/control-flow-for — the modern `@for` this page's `*ngFor` predates.
 */
@Component({
  selector: 'app-lesson-builtin-directives',
  imports: [
    RouterLink,
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
    NgIf,
    NgFor,
    NgClass,
    NgStyle,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
  ],
  templateUrl: './builtin-directives.html',
  styleUrl: './builtin-directives.css',
})
export class BuiltinDirectives {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Control Flow / Directives stretch of the Beginner track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: '@for', id: 'control-flow-for' },
    { label: '@switch', id: 'control-flow-switch' },
    { label: '@let', id: 'let-block' },
    { label: 'Built-in Directives' },
    { label: 'Built-in Pipes', id: 'pipes' },
  ];

  // ── Section: the mental model — the "you" / compiler / NgIf exchange ───────

  /**
   * The desugaring, staged as a dialogue. Written for the misconception this
   * lesson exists to prevent — that the star is read at runtime like an
   * attribute — by making the compiler explicitly say it rewrites the
   * template *before* anything runs, and `NgIf` explicitly say it never hides
   * anything with CSS.
   */
  protected readonly desugarTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I wrote `*ngIf="loggedIn"` right on my `<p>` — one attribute, simple.',
    },
    {
      who: 'The compiler',
      says:
        "There's no such attribute once I'm done with it. I lift your `<p>` into an " +
        '`<ng-template>`, and move `loggedIn` onto `[ngIf]` instead.',
    },
    {
      who: 'You',
      says: 'So the star just… disappears?',
    },
    {
      who: 'The compiler',
      says:
        "Completely. What's left is an ordinary property binding, feeding a directive that now " +
        'injects a `TemplateRef` — the stencil — and a `ViewContainerRef` — the place allowed to press it.',
    },
    {
      who: 'You',
      says: 'And when `loggedIn` flips?',
    },
    {
      who: 'NgIf',
      says:
        '`createEmbeddedView()` on true, `clear()` on false. Real nodes, made and destroyed — ' +
        'I never just hide anything.',
    },
  ];

  // ── Section: the mechanism — the desugaring, three ways ─────────────────────

  /**
   * The literal before/after of one `*ngIf`. This is the fact every other rule
   * about structural directives follows from — read it once as code, then meet
   * the same rewrite again as a runtime sequence in {@link desugar}.
   */
  protected readonly desugarSample = `<p *ngIf="loggedIn">Welcome</p>

<ng-template [ngIf]="loggedIn">
  <p>Welcome</p>
</ng-template>`;

  /** Line-by-line walkthrough of {@link desugarSample}. */
  protected readonly desugarNotes: CodeNote[] = [
    {
      line: 1,
      text: "This is what you write: one element, one attribute, nothing else visible. By the time your app runs, this exact syntax doesn't exist anywhere — the compiler expands it before a single line of your code executes.",
    },
    {
      line: 3,
      text: "The compiler lifts the host element into an `<ng-template>` wrapper — a blueprint that's parsed but rendered *nowhere* by default. The star is gone; what's left is an ordinary property binding, `[ngIf]`, now feeding the directive that sits on the template instead of on your element.",
    },
    {
      line: 4,
      text: 'The original `<p>` becomes the CONTENT of that blueprint. It reaches the real DOM only the instant `NgIf` decides to stamp this template out — never before.',
    },
    {
      line: 5,
      text: 'Nothing left to import here, but plenty happening behind it: at runtime `NgIf` injects a `TemplateRef` (the stencil this tag represents) and a `ViewContainerRef` (the place allowed to press it), then calls `createEmbeddedView()` or `clear()` depending on the expression.',
    },
  ];

  /**
   * What the compiler and `NgIf` do between them, as a runtime sequence — the
   * same rewrite as {@link desugarSample}, in a different mode.
   */
  protected readonly desugar = [
    {
      label: 'Compiler sees `*ngIf` on `<p>`',
      detail: 'The `*` is the marker. Everything below is automatic',
    },
    {
      label: 'Wrap `<p>` in an `<ng-template>`',
      detail: 'The element is now *inside* a template — so by default it renders nowhere',
      tone: 'accent' as const,
    },
    {
      label: 'Move the expression to `[ngIf]`',
      detail: 'Bound on the template, not on your element',
    },
    {
      label: '`NgIf` injects `TemplateRef` + `ViewContainerRef`',
      detail: 'The stencil, and the place to press it',
    },
    {
      label: 'Truthy → `createEmbeddedView`',
      detail: 'Falsy → `clear()`. Real nodes created and destroyed, not hidden',
      tone: 'good' as const,
    },
  ];

  /** Choices for the desugaring check. */
  protected readonly desugarOptions: QuizOption[] = [
    {
      text: '`<p style="display: none">Welcome</p>` when the expression is falsy',
      why: 'That is `[hidden]`, which is a CSS toggle on an element that stays in the DOM. Structural directives do not hide anything — there is no element left to hide.',
    },
    {
      text: '`<ng-template [ngIf]="loggedIn"><p>Welcome</p></ng-template>`',
      correct: true,
      why: 'The `*` wraps the host element in an `<ng-template>` and moves the binding onto it. Everything odd about structural directives follows from this one rewrite: you cannot put two on an element because there is only one template to wrap, `<ng-container>` exists to give a `*` somewhere to live without adding a `<div>`, and the element truly disappears because the template was never instantiated.',
    },
    {
      text: '`<p *ngIf>` with the directive reading the attribute value at runtime',
      why: 'There is no runtime attribute reading. `*ngIf="expr"` is microsyntax that the *compiler* expands before your code ever runs — by the time the app is executing, the `*` no longer exists in any form.',
    },
    {
      text: '`@if (loggedIn) { <p>Welcome</p> }` — they compile to the same thing',
      why: 'They do the same job, but not the same way. `@if` is a control-flow block emitted directly into the template function: no directive class, no `TemplateRef` injection, nothing to import. That difference is exactly why forgetting an import can break `*ngIf` and can never break `@if`.',
    },
  ];

  // ── Section: *ngIf — else, then, as ─────────────────────────────────────────

  /** Sample: `*ngIf`'s else/then/as trio. */
  protected readonly ngIfVariantsSample = `<p *ngIf="user as u; else loading">Hi {{ u.name }}</p>

<ng-template #loading>Loading…</ng-template>

<div *ngIf="ready; then content; else spinner"></div>`;

  /** Line-by-line walkthrough of {@link ngIfVariantsSample}. */
  protected readonly ngIfVariantsNotes: CodeNote[] = [
    {
      line: 1,
      text: "`user as u` does two jobs in one breath: it tests `user` for truthiness AND binds the result to a local `u` for the body. That's why you write `u.name` here and not `user!.name` — inside this tag, `u` can never be null.",
    },
    {
      line: 3,
      text: '`#loading` is a template reference variable: it NAMES this blueprint so the `else` above can point at it. Nothing renders here until `NgIf` explicitly asks for it.',
    },
    {
      line: 5,
      text: "With an explicit `then`, the host element's own content is ignored completely — hence the empty `<div>`. Both branches now live in named templates (defined elsewhere as `#content` / `#spinner`), so this line is pure routing: true → `content`, false → `spinner`.",
    },
  ];

  // ── Section: *ngFor — track, index, the booleans ───────────────────────────

  /** Sample: `*ngFor`'s microsyntax and its `trackBy` function. */
  protected readonly ngForSample = `<li *ngFor="let item of items;
            let i = index;
            let first = first; let last = last;
            let even = even; let odd = odd;
            trackBy: trackById">
  {{ i }}: {{ item.name }}
</li>

trackById(index: number, item: Item) {
  return item.id;
}`;

  /** Line-by-line walkthrough of {@link ngForSample}. */
  protected readonly ngForNotes: CodeNote[] = [
    {
      line: 1,
      text: "Read the quoted part as clauses separated by `;` — Angular's own microsyntax, not HTML (which is why no HTML comment can go inside it). `let item of items` names the current element `item`; one `<li>` is stamped per entry.",
    },
    {
      line: 2,
      text: "`index` is the built-in name for the 0-based position; `i` is just the local name you're choosing to hold it in.",
    },
    {
      line: 3,
      text: '`first` and `last` are true on exactly one iteration each — the very first and the very last.',
    },
    {
      line: 4,
      text: '`even`/`odd` alternate every iteration, starting from `even` at index 0.',
    },
    {
      line: 5,
      text: '`trackBy` names the function below. Skip it and Angular falls back to tracking by object identity — see the warning underneath for why that quietly costs you.',
    },
    {
      line: 6,
      text: 'Every `let` name declared above is in scope here, and only here — they belong to this one iteration, not to the component class.',
    },
    {
      line: 9,
      text: "Lives in the component class, not the template. Angular calls it for every item on every check and uses the RETURNED value as that row's identity.",
    },
    {
      line: 10,
      text: 'Returning `item.id` means "a row is the same row if its id is the same" — a reordered array reuses existing DOM nodes instead of Angular destroying and rebuilding every one of them.',
    },
  ];

  // ── Section: [ngSwitch] ──────────────────────────────────────────────────────

  /** Sample: `[ngSwitch]` plus its case/default templates. */
  protected readonly ngSwitchSample = `<div [ngSwitch]="status">
  <p *ngSwitchCase="'loading'">Loading…</p>
  <p *ngSwitchCase="'success'">Done</p>
  <p *ngSwitchDefault>Unknown</p>
</div>`;

  /** Line-by-line walkthrough of {@link ngSwitchSample}. */
  protected readonly ngSwitchNotes: CodeNote[] = [
    {
      line: 1,
      text: '`[ngSwitch]` is a PLAIN property binding — no star. It holds the value to match against and renders nothing of its own; the `<div>` always stays in the DOM.',
    },
    {
      line: 2,
      text: "This one DOES have a star: each case is its own template, stamped out only when its value matches. Note the quotes inside quotes — `'loading'` is a string literal *inside* the expression, not an attribute value.",
    },
    {
      line: 4,
      text: 'The fallback. No expression to match, so it needs no value at all. Every match here is strict (`===`), which is the usual reason a case "silently" never fires: the number `1` will never match the string `\'1\'`.',
    },
  ];

  // ── Section: ngClass & ngStyle ───────────────────────────────────────────────

  /** Sample: `ngClass`'s three forms plus `ngStyle`'s object form. */
  protected readonly ngClassStyleSample = `<div [ngClass]="{ active: isActive, disabled: !enabled }">…</div>
<div [ngClass]="'a b c'">…</div>
<div [ngClass]="['a', 'b']">…</div>

<div [ngStyle]="{ color: c, 'font-size.px': size }">…</div>`;

  /** Line-by-line walkthrough of {@link ngClassStyleSample}. */
  protected readonly ngClassStyleNotes: CodeNote[] = [
    {
      line: 1,
      text: "Object form, the one you'll actually reach for: every key is a class name, and Angular adds it exactly when the value is truthy — `active` applies when `isActive` is true, `disabled` when `enabled` is false.",
    },
    {
      line: 2,
      text: 'String form: one space-separated class expression. Rare in practice — a plain `class="a b c"` attribute does the same job with no binding at all.',
    },
    {
      line: 3,
      text: 'Array form: same idea, one entry per class. Rare for the same reason as the line above.',
    },
    {
      line: 5,
      text: "`[ngStyle]` mirrors `[ngClass]`'s object form: each key is a CSS property — camelCase, or a string like `'font-size.px'` when you need an explicit unit — and each value is what to set it to.",
    },
  ];

  /** Sample: a single class/style, the case where the native binding is lighter than `ngClass`/`ngStyle`. */
  protected readonly compareNativeSample = `<div [class.active]="isActive">
<div [style.color]="c">`;

  /** Sample: the same two toggles, done with `ngClass`/`ngStyle` for contrast. */
  protected readonly compareNgClassSample = `<div [ngClass]="{ active: isActive, disabled: !enabled }">
<div [ngStyle]="{ color: c, 'font-size.px': size }">`;

  // ── Section: ng-container & ng-template ─────────────────────────────────────

  /** Sample: the wrong way — a wrapper `<div>` that was never asked for. */
  protected readonly wrapperDivSample = `<div *ngIf="user as u">
  <h2>{{ u.name }}</h2>
</div>`;

  /** Sample: the right way — `<ng-container>`, which leaves no node behind. */
  protected readonly ngContainerSample = `<ng-container *ngIf="user as u">
  <h2>{{ u.name }}</h2>
</ng-container>`;

  /** Sample: a reusable fragment rendered on demand via `ngTemplateOutlet`. */
  protected readonly ngTemplateOutletSample = `<ng-template #row let-name><td>{{ name }}</td></ng-template>
<ng-container *ngTemplateOutlet="row; context: { $implicit: 'Ada' }"></ng-container>`;

  // ── Section: the trap — [hidden] looks like *ngIf ───────────────────────────

  /** The `*ngIf` vs `[hidden]` distinction, posed on a component with a live subscription. */
  protected readonly hiddenSample = `<!-- VideoPlayer polls the server every second
     and holds a WebSocket open. -->

<app-video-player [hidden]="!showPlayer" />

<!-- The user hides the player and walks away
     for an hour. What is the app doing? -->`;

  /** The rule that defeats `[hidden]`: any same-specificity `display` rule on the same element. */
  protected readonly hiddenDefeatCssSample = `.card { display: flex; }

<div class="card" hidden>Still visible!</div>`;

  /** The fixes, ranked by how much they cost you. */
  protected readonly hiddenDefeatFixSample = `/* 1. Bind display instead of trusting [hidden] */
[style.display]="show ? null : 'none'"

/* 2. Or make [hidden] win, globally, once */
[hidden] { display: none !important; }`;

  // ── Section: questions from the back row ────────────────────────────────────

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If `@if` is better, why learn `*ngIf` at all?',
      a: 'Because you will read far more Angular than you write. Every codebase older than v17, most Stack Overflow answers, most tutorials and a good chunk of the certification question bank use the directive forms. You need to *read* them fluently and *write* the block forms — that asymmetry is the whole point of this lesson.',
    },
    {
      q: 'Why can I not put `*ngIf` and `*ngFor` on the same element?',
      a: 'Because each `*` wants to wrap that element in its own `<ng-template>`, and there is only one element to wrap. The compiler rejects it rather than guessing an order — which is right, because the two orders mean genuinely different things. Put one on an `<ng-container>` to get a second wrapping layer for free, with no extra DOM node.',
    },
    {
      q: 'Is `<ng-container>` a real element?',
      a: 'No — it compiles to a comment node and never appears in the rendered HTML. That is its whole reason to exist: somewhere to attach a structural directive when adding a `<div>` would break your flex or grid layout. You cannot style it, give it a class, or query for it, because there is nothing there.',
    },
    {
      q: 'What is the difference between `*ngIf` and `[hidden]`?',
      a: 'Destruction versus concealment. `*ngIf` creates and destroys real DOM, so a hidden component is genuinely gone — its subscriptions torn down, its timers cleared, its state lost. `[hidden]` sets `display: none` on an element that is still fully alive and still doing whatever it was doing. Use `*ngIf` by default; use `[hidden]` when you specifically want the state and the cost preserved, such as a tab you toggle constantly.',
    },
    {
      q: 'Do `ngClass` and `ngStyle` replace my static `class` attribute?',
      a: 'No, they merge with it, and this is the same rule the native `[class]` binding follows. They diff against what they applied last time and patch only the difference, calling `addClass`/`removeClass` — so a class that came from the static attribute is not theirs to remove and stays put.',
    },
  ];

  // ── Live demo state ──────────────────────────────────────────────────────────

  /**
   * Toggles the `*ngIf` demo.
   */
  protected readonly show = signal(true);
  /**
   * The list for the `*ngFor` demo.
   */
  protected readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  /**
   * The `ngSwitch` demo's selected fruit.
   */
  protected readonly selected = signal('Banana');
  /**
   * The `ngSwitch` demo's state — three arms plus a default.
   */
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');

  /**
   * `trackBy` function for the `*ngFor` demo.
   *
   * The old-style counterpart to `@for`'s `track` expression, and the reason
   * `@for` made tracking mandatory: `*ngFor` without a `trackBy` re-creates every
   * DOM node when the array is replaced, and nothing warns you.
   *
   * @param _index Unused — the name is the identity here.
   * @param name   The item.
   * @returns The tracking key.
   */
  protected trackByName(_index: number, name: string): string {
    return name;
  }
}
