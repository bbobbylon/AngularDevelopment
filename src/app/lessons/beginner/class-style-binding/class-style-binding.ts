import { NgClass, NgStyle } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Class & Style Binding — five ways to change how an element looks, and
 * which to reach for.
 *
 * Covers `[class.x]`, `[class]`, `[style.prop]`, `[style.prop.unit]`, `[style]`,
 * and the older `ngClass` / `ngStyle` directives.
 *
 * The guidance the lesson lands on: the per-class and per-property forms are the
 * default, because they are the ones Angular can update surgically and the ones
 * that compose without fighting each other. `ngClass` and `ngStyle` still work,
 * but they replace whole objects and are no longer the recommended form.
 *
 * The demos run each form against the same element so the differences — and the
 * precedence when two of them touch the same class — are visible.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer, following the teaching order in
 * `expert/change-detection`: pose the problem before naming it, give the reader
 * an analogy to hang the vocabulary on, walk the actual mechanism, then show the
 * same idea again in as many modes as it takes to stick.
 *
 * The analogy is a stack of transparencies on an overhead projector: the static
 * `class` attribute is the bottom sheet, drawn once and never erased; every
 * binding — `[class]`, `[class.x]`, `ngClass` — lays one more transparent sheet
 * on top. Nobody wipes anyone else's sheet clean, which is why a `[class]`
 * binding that never mentions `box` cannot remove it, and why two sheets
 * targeting the same class resolve by *which sheet it is*, never by which one
 * was drawn last. That single picture is restated four separate ways on this
 * page — as prose, as a `Bubbles` conversation between the sheets themselves, as
 * a compiled-instruction `CodeLab`, and as a live collision demo you can drive
 * yourself — because the retention bar is redundancy *across modes*, not the
 * same sentence four times.
 */
@Component({
  selector: 'app-lesson-class-style-binding',
  imports: [
    RouterLink,
    NgClass,
    NgStyle,
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
  templateUrl: './class-style-binding.html',
  styleUrl: './class-style-binding.css',
})
export class ClassStyleBinding {
  // ── Demo state ──────────────────────────────────────────────────────────────

  /**
   * Drives the `[class.active]` demo.
   */
  protected readonly active = signal(true);
  /**
   * Drives the `[style.font-size.px]` demo, showing the unit suffix.
   */
  protected readonly size = signal(20);
  /**
   * Drives the `[style.color]` demo.
   */
  protected readonly color = signal('#7c4dff');
  /**
   * Drives the `[class]` map demo — three states, one binding.
   */
  protected readonly state = signal<'ok' | 'warn' | 'error'>('ok');
  /**
   * Whether the *object* form asks for `active`.
   */
  protected readonly objectWantsActive = signal(true);
  /**
   * Whether the *per-class* form asks for `active`. Paired with
   * {@link objectWantsActive} so the two can disagree, which is how the demo shows
   * which one wins.
   */
  protected readonly perClassActive = signal(false);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Data Binding track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Property & Attribute', id: 'property-binding' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding', id: 'two-way-binding' },
    { label: 'Class & Style' },
  ];

  /**
   * The sheets on the projector, talking about who is drawn where.
   *
   * Prose already makes the layering argument; this restates it as a
   * conversation because the fact learners get backwards — that a binding only
   * ever touches the keys it names, never anyone else's — is much easier to
   * believe when the *other* sheet says it out loud.
   */
  protected readonly sheetsTalk: BubbleTurn[] = [
    {
      who: 'Static class="box"',
      says: "I'm painted once, when the element is created. Nobody gets to erase me — they can only draw on top.",
    },
    {
      who: '[class] / [style] map',
      says: "I only touch the keys I name. I never mentioned `box`, so it's still sitting right there underneath me.",
    },
    {
      who: '[class.box--active] / [style.color]',
      says: "I'm the most specific sheet on the stack. When we both claim the same class, I'm the one you see — every time, no exceptions.",
    },
    {
      who: "Angular's differ",
      says: 'Every pass, I compare what each sheet says now against what it said last time. Only the differences get written to the real DOM.',
    },
  ];

  /**
   * Sample: the compiled update instructions behind a handful of class/style
   * bindings on one element. Loosely based on Angular's real Ivy instructions
   * (`ɵɵclassProp`, `ɵɵclassMap`, `ɵɵstyleProp`, `ɵɵstyleMap`) — simplified, not
   * byte-for-byte compiler output.
   */
  protected readonly mechanismSample = `function Box_Template(rf: RenderFlags, ctx: Box) {
  if (rf & RenderFlags.Update) {
    ɵɵclassProp('box--active', ctx.active());
    ɵɵclassMap({
      'box--ok': ctx.state() === 'ok',
      'box--warn': ctx.state() === 'warn',
    });
    ɵɵstyleProp('font-size', ctx.size(), 'px');
    ɵɵstyleMap({ fontWeight: '600' });
  }
}`;

  /** Line-by-line walkthrough of {@link mechanismSample}. */
  protected readonly mechanismNotes: CodeNote[] = [
    {
      line: 3,
      text: "`ɵɵclassProp` is what a per-class `[class.x]` binding compiles to. One boolean in; when it's `true` Angular calls `classList.add('box--active')`, when `false` it calls `classList.remove('box--active')`. Nothing else on the element is touched.",
    },
    {
      line: 4,
      text: "`ɵɵclassMap` is what a `[class]` object binding compiles to. It receives the *whole* object every pass and diffs it against the object from last time, patching only the keys that actually changed — that's the diffing the projector picture calls out.",
    },
    {
      line: 8,
      text: "`ɵɵstyleProp` is a per-style binding, and its third argument is the piece people forget exists: the **unit suffix**. It's appended to `ctx.size()` as a plain string, before the value ever reaches the browser — Angular never inspects or validates it.",
    },
    {
      line: 9,
      text: '`ɵɵstyleMap` does for inline styles exactly what `ɵɵclassMap` does for classes: one object, diffed against last pass, only the changed properties written.',
    },
  ];

  /** The layering/resolution order, as a flow diagram. */
  protected readonly resolutionFlow: FlowStep[] = [
    { label: 'Static `class="box"`', detail: 'Applied once at creation. No binding can remove it' },
    { label: '`[class]` map or string', detail: 'Adds and removes only the keys it names' },
    {
      label: '`[class.box--active]`',
      detail: 'Per-class bindings sit above maps and win any collision',
      tone: 'accent' as const,
    },
    {
      label: 'Angular diffs',
      detail: 'Compares against last pass — unchanged entries are left alone',
    },
    {
      label: '`classList.add` / `remove`',
      detail: 'Only what actually changed is touched',
      tone: 'good' as const,
    },
  ];

  /**
   * Sample: a single element driven by three per-class/per-style bindings.
   */
  protected readonly singleBindingSample = `<div [class.box--active]="active()"
     [style.fontSize.px]="size()"
     [style.color]="color()">
  Styled box ({{ size() }}px)
</div>`;

  /** Line-by-line walkthrough of {@link singleBindingSample}. */
  protected readonly singleBindingNotes: CodeNote[] = [
    {
      line: 1,
      text: '`[class.box--active]="active()"` — a per-class binding. Reads the `active` signal; `true` adds `box--active`, `false` removes it, and nothing else on the element is affected.',
    },
    {
      line: 2,
      text: "`[style.fontSize.px]=\"size()\"` — a per-style binding with a **unit suffix**. Angular reads `size()`, appends the literal string `'px'`, and calls `style.setProperty('font-size', '<value>px')`.",
    },
    {
      line: 3,
      text: '`[style.color]="color()"` — the same per-style binding form, no suffix needed because a hex colour is already a complete string, not a bare number.',
    },
    {
      line: 4,
      text: "`{{ size() }}` is a plain interpolation, included only to prove the same signal is driving both the box's font size and the number printed on the label.",
    },
  ];

  /** Choices for the unit-suffix check. */
  protected readonly unitOptions: QuizOption[] = [
    {
      text: 'The element is 8 pixels wide — Angular infers `px` for numbers',
      why: 'Angular does no inference here. It passes your value through to `style.setProperty` essentially untouched; the `px` has to come from somewhere, and nothing supplies it.',
    },
    {
      text: 'No width is applied at all',
      correct: true,
      why: '`width: 8` is not valid CSS — a length needs a unit — so the browser discards the declaration silently. Nothing throws and nothing warns; the element simply keeps its default width, which is why this one can survive review. Write `[style.width.px]="8"` and the suffix appends the unit for you.',
    },
    {
      text: 'A console warning, and the width falls back to `auto`',
      why: 'The width does effectively stay at its default, but there is no warning. Browsers drop invalid declarations without comment, which is exactly what makes this hard to spot.',
    },
    {
      text: 'The width is set to 8% of the parent',
      why: 'Nothing in the binding mentions a percentage. An invalid unit-less length is dropped rather than reinterpreted as some other unit.',
    },
  ];

  /**
   * Sample: binding an object to `[class]` / `[style]` at once.
   */
  protected readonly mapBindingSample = `<div
  [class]="{
    'box--ok': state() === 'ok',
    'box--warn': state() === 'warn',
    'box--error': state() === 'error',
  }"
  [style]="{ fontWeight: '600', letterSpacing: '0.04em' }"
>
  state = {{ state() }}
</div>`;

  /** Line-by-line walkthrough of {@link mapBindingSample}. */
  protected readonly mapBindingNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A `[class]` binding evaluating to an object — each key is a class name, each value a boolean. Angular adds the keys that are `true` and removes the keys that are `false`; nothing outside this list is ever touched.',
    },
    {
      line: 7,
      text: 'A `[style]` binding evaluating to an object — each key is a CSS property (camelCase or kebab-case both work inside an object), each value the string to set. Same idea as `[class]`, just for inline styles.',
    },
    {
      line: 9,
      text: 'This interpolation and the `[class]` binding above read the exact same signal — the visible label and the highlighted box can never disagree about the current state.',
    },
  ];

  /** The merge misconception, posed before the note that corrects it. */
  protected readonly mergeSample = `<div class="card shadow"
     [class]="{ active: isActive() }">
  …
</div>

// isActive() is true.
// What is the element's final class attribute?`;

  /**
   * Sample: `ngClass` / `ngStyle`, the pre-signals directives that do the same
   * jobs as `[class]` / `[style]`.
   */
  protected readonly ngClassSample = `<div
  [ngClass]="{ 'box--active': active(), 'box--ok': state() === 'ok' }"
  [ngStyle]="{ 'border-style': active() ? 'solid' : 'dashed' }"
>
  driven by ngClass / ngStyle
</div>`;

  /** Line-by-line walkthrough of {@link ngClassSample}. */
  protected readonly ngClassNotes: CodeNote[] = [
    {
      line: 2,
      text: '`NgClass` is a structural directive, not a compiled template instruction — it must be imported (`NgClass` from `@angular/common`), and at runtime it walks the object through a general-purpose differ rather than the compiled `ɵɵclassMap` instruction `[class]` gets for free.',
    },
    {
      line: 3,
      text: '`NgStyle` does for inline styles exactly what `NgClass` does for classes: same import cost, same runtime differ, same job `[style]` already does natively.',
    },
  ];

  /**
   * Sample: a per-class binding and a `[class]` map both targeting the same
   * class name.
   */
  protected readonly collisionSample = `<div
  [class]="{ 'box--active': objectWantsActive() }"
  [class.box--active]="perClassActive()"
>
  ...
</div>

<!-- resolved class always follows perClassActive(), never objectWantsActive() -->`;

  /** Line-by-line walkthrough of {@link collisionSample}. */
  protected readonly collisionNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The map binding asks for `box--active` whenever `objectWantsActive()` is true — a perfectly reasonable-looking request, on its own.',
    },
    {
      line: 3,
      text: 'The per-class binding targets the *exact same class name*. Two different binding kinds, one class — this is the collision.',
    },
    {
      line: 8,
      text: 'Angular doesn\'t consult DOM order or "last one wins". It resolves by binding *kind*: a per-class binding always outranks a same-named key inside a `[class]` map, regardless of which one appears first in the template or which was set most recently.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If they all merge, why does `[class.x]` beat a key inside `[class]`?',
      a: 'Because the two are different kinds of instruction, and Angular gives them a fixed priority — the more specific binding wins, exactly like it does for `[style.color]` over `[style]`. Note what this is *not*: it has nothing to do with CSS specificity or the cascade. Angular settles the argument at the styling layer and hands the browser a single answer. Reordering the attributes in your template changes nothing.',
    },
    {
      q: 'So should I use `[class.x]` or `[class]`?',
      a: 'Use `[class.x]` when you know the class name at author time, which is most of the time — it is the cheapest to update because Angular only has to check one boolean. Reach for the `[class]` map when the *set* of classes is data-driven, like a status that could be any of five values. What you should not do is drive the same class from both; that is the collision the demo above shows, and the winner is not obvious to whoever reads it next.',
    },
    {
      q: 'Is `ngClass` actually deprecated?',
      a: 'Not formally — it still works and nothing warns. But it needs a `CommonModule`/`NgClass` import, it goes through a general-purpose differ rather than a compiled instruction, and it does the same job as syntax that is built into the template compiler. In new code the native bindings are simply the better default. Existing `ngClass` is not a bug and does not need an urgent migration.',
    },
    {
      q: 'Why does camelCase work in one place and kebab-case in another?',
      a: 'In the binding *syntax* (`[style.fontSize.px]`), the property name is part of a template expression, so it follows the DOM style-object convention: camelCase. Inside a bound *object* (`[style]="{ ... }"`), the key is a plain string being passed to `setProperty`, and CSS itself accepts `font-size`. Both spellings work there. When in doubt, kebab-case inside objects is the form that never surprises anyone.',
    },
    {
      q: 'Can a binding remove a class that came from the static attribute?',
      a: 'No, and that trips people up when they try to override a class from a design system. The static `class` is applied once at element creation and no binding gets to erase it. If you need the class to be conditional, it has to be conditional at the source: move it out of the static attribute and into `[class.x]="condition"`. Fighting it with CSS overrides works but leaves the wrong class in the DOM for the next person to puzzle over.',
    },
  ];
}
