import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions, Scribble, Whiteboard } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Property & Attribute Binding — `[prop]="expr"` and its variants.
 *
 * Covers the distinction the lesson exists for: `[x]` sets a **DOM property**,
 * while `[attr.x]` sets an **HTML attribute**. They look interchangeable and are
 * not — attributes are the initial value in the markup, properties are the live
 * state of the element — which is why `[attr.colspan]` works and `[colspan]`
 * does not.
 *
 * The live demos bind a checkbox to `disabled`, an image `src` to a URL, and a
 * table cell's `colspan` through `[attr.]`.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer. One analogy replaces "attributes and
 * properties are basically the same thing" (the intuitive but wrong default
 * assumption): **a shipping label vs. what's actually in the box.** The label
 * printed on a box at ship time (the attribute) says what was packed then —
 * fixed, readable from outside without opening anything, exactly what "View
 * Source" reads. The real contents (the property) are whatever is actually in
 * there right now, and someone can swap them without ever reprinting the
 * label. That single image explains every hard fact in this lesson: why
 * checking DevTools' markup for a live value is like reading the label
 * instead of opening the box (the opening Predict), why `disabled="false"`
 * still disables (presence is all a label-reader checks), why binding `null`
 * to an attribute *removes* it while binding `null` to a property just stores
 * the value `null` (peeling a label off vs. a box that literally contains
 * "null"), and why ARIA/`colspan`-style attributes need `[attr.*]` at all
 * (some labels have no corresponding box contents whatsoever).
 */
@Component({
  selector: 'app-lesson-property-binding',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    BrainPower,
    NoDumbQuestions,
    Scribble,
    Whiteboard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './property-binding.css',
  templateUrl: './property-binding.html',
})
export class PropertyBinding {
  /**
   * Backs the `[disabled]` demo — a genuine DOM *property*, so `[disabled]` is
   * the correct form and `[attr.disabled]` would be the wrong one.
   */
  protected readonly disabled = signal(false);
  /**
   * Backs the `[src]` demo. Points at a real remote image so the binding visibly
   * does something when it changes.
   */
  protected readonly url = signal(
    'https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif',
  );
  /**
   * Backs the `[attr.colspan]` demo. `colspan` has no matching DOM property, which
   * is exactly why it needs the `attr.` prefix.
   */
  protected readonly span = signal(2);

  // ── Presentation data ──────────────────────────────────────────────────────

  // -- Page-shape block: "There Are No Dumb Questions" --

  /**
   * The block's own Q&A spine — six questions escalating from the surface
   * misconception ("aren't these the same thing?") through a real production
   * failure mode to the one-habit fix. Deliberately distinct copy from
   * {@link questions} below, which closes the page with a different set.
   */
  protected readonly bindingQuestions: NdqItem[] = [
    {
      q: 'Isn\'t `[prop]="x"` just shorthand for writing `prop="{{ x }}"`?',
      a: "No — they compile to two different instructions. Interpolation always writes a **string** attribute; `[prop]` writes the DOM property with whatever type `x` really is. Bind a number through interpolation and you get the string `'48'`. Bind it with `[prop]` and you get the real number `48`. Same-looking markup, a different type landing on the other side.",
    },
    {
      q: "You typed a brand-new value into a bound `<input>`. Why does DevTools' Elements panel still show the OLD one?",
      a: "Because the Elements panel shows you the **attribute** — the label from when the element was created — and typing never reprints that label. Your keystrokes are updating the input's live `value` property instead. DevTools' Properties tab (or `el.value` in the console) is where you'd see what's actually in the box right now.",
    },
    {
      q: 'Where does that actually bite you at work?',
      a: "Automated tests. Selenium's `get_attribute('value')` reads the attribute, not the property — a test that types into a field and immediately asserts on `get_attribute('value')` can see the field's ORIGINAL contents, not what it just typed, and fail for a reason that has nothing to do with your component's logic. You'll lose a real afternoon to this exact bug at some point.",
    },
    {
      q: 'So `disabled="false"` should un-disable a button, right?',
      a: "It won't. For a boolean attribute like `disabled`, **presence is the only thing that counts** — the attribute doesn't read what string you wrote inside the quotes, only whether it's there at all. `[disabled]=\"false\"` sets the live boolean property instead, and that one actually listens to `true`/`false`.",
    },
    {
      q: "If properties are the 'real' thing, why does `[attr.*]` exist at all?",
      a: "Because a few labels have no box behind them. ARIA attributes, `colspan`, SVG-specific attributes and your own `data-*` names have no matching DOM property — there's nothing for `[prop]` to write to. `[attr.*]` is the only tool that reaches them, and it's also the only one that can remove a label entirely: bind it to `null` and Angular calls `removeAttribute` — something a property binding has no equivalent for.",
    },
    {
      q: 'How do you keep this straight without memorizing a table?',
      a: 'Default to `[prop]` for almost everything you write. Reach for `[attr.*]` only when the compiler tells you to — a missing-property error on something like `colspan` or `aria-*`. And when you need to know what a value actually is right now — in a test, in the console, in a bug report — read the property, never the markup.',
    },
  ];

  /** The block's own quiz — the Selenium trap, predicted before the DevTools predict below proves the same thing live. */
  protected readonly ndqQuiz: QuizOption[] = [
    {
      text: 'The password the tester just typed — Selenium reads whatever is really in the box.',
      why: "That's what reading the live property (`.get_property('value')`, or `el.value` in a browser console) would return. `get_attribute('value')` deliberately reads the attribute — the frozen label — not the live property, so it does not see this.",
    },
    {
      text: "Whatever the field's value attribute was when the page first rendered — not the new password.",
      correct: true,
      why: 'Right. The attribute is set once, at creation, from the initial binding. Typing into the field only ever changes the live property; nothing re-writes the attribute afterward, so an attribute read stays stuck on the original value.',
    },
    {
      text: 'An error, because the element has already changed since the page loaded.',
      why: "No error — the attribute genuinely still exists, it's just stale. `get_attribute` succeeds and returns a real (wrong) answer, which is exactly what makes this bug so easy to miss: nothing looks broken.",
    },
    {
      text: 'It depends on whether change detection has run since the keystroke.',
      why: 'Change detection decides when Angular re-checks its OWN bindings — it has no effect here, because nothing in this scenario ever asks Angular to write the attribute again in the first place.',
    },
  ];

  /** The Data Binding track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Property & Attribute' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding', id: 'two-way-binding' },
    { label: 'Class & Style', id: 'class-style-binding' },
  ];

  /** Code for the opening predict — a value bound but never re-attributed. */
  readonly predictCode = `<input [value]="url()" />
<!-- you type a brand-new value into this field -->`;

  /** The path a property binding takes, under the hood. */
  protected readonly propertyFlow: FlowStep[] = [
    { label: 'Expression evaluates', detail: 'disabled() reads the signal' },
    { label: 'ɵɵproperty() runs', detail: 'skipped if unchanged since last check', tone: 'accent' },
    {
      label: 'el.disabled = value',
      detail: 'a real property write — the box, not the label',
      tone: 'good',
    },
  ];

  /** The path an attribute binding takes, under the hood. */
  protected readonly attributeFlow: FlowStep[] = [
    { label: 'Expression evaluates', detail: 'span() reads the signal' },
    { label: 'ɵɵattribute() runs', detail: 'the value is stringified', tone: 'accent' },
    {
      label: 'setAttribute() or removeAttribute()',
      detail: 'null/undefined peels the label off entirely',
      tone: 'warn',
    },
  ];

  /** Options for the null-handling self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'Both remove the value from the DOM entirely',
      why: "Only the attribute binding behaves this way. A property binding doesn't remove anything — properties don't have a 'not present' state the way attributes do.",
    },
    {
      text: 'colspan is removed via removeAttribute; value becomes the literal property value null',
      correct: true,
      why: 'Attribute and property bindings compile to different instructions — ɵɵattribute calls removeAttribute for a nullish value, while ɵɵproperty just assigns whatever value it is given, including null itself, straight onto the property.',
    },
    {
      text: 'Both just store the literal value null and nothing visibly changes',
      why: "True for the property binding, but not the attribute one — [attr.*] explicitly special-cases null/undefined to mean 'remove this attribute,' which is exactly why it's the standard tool for conditionally-present ARIA attributes.",
    },
    {
      text: 'Angular throws a runtime error for binding null to either',
      why: 'Neither binding throws. This is normal, well-defined behavior in both cases — two different behaviors, not an error in either one.',
    },
  ];

  /** The "no dumb questions" block. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does `disabled="false"` still disable the button?',
      a: 'It\'s an attribute — presence alone disables, the same way a label is either stuck on the box or it isn\'t. Bind the property instead: `[disabled]="false"` sets the live DOM property to false.',
    },
    {
      q: 'When do you need `[attr.*]` instead of `[prop]`?',
      a: 'When there is no matching DOM property — ARIA (aria-*), colspan, SVG attributes, custom data-*. Those exist only as labels; there is no corresponding box contents to bind to with plain [prop].',
    },
    {
      q: '`[size]="48"` vs `size="48"` on a component input?',
      a: "The first passes the number 48; the second passes the string '48' (no brackets means a literal attribute string).",
    },
    {
      q: "What's the difference between this lesson's [prop] and the [class.x]/[style.x] bindings in the next lesson?",
      a: 'Same underlying mechanism — [class.x] and [style.x] are special-cased compiler shorthand for toggling one class or one style property, built on the exact same property/attribute binding model this lesson covers. They get their own lesson for their own shorthand rules, not because the binding model underneath is different.',
    },
    {
      q: 'Does `[colSpan]="n"` (camelCase, no attr.) work on a `<td>`?',
      a: 'Yes — HTMLTableCellElement has a real colSpan DOM property that reflects the colspan attribute, so a plain property binding works. It is still common (and usually clearer) to write [attr.colspan], but exams sometimes test whether you know the camelCase property secretly exists.',
    },
  ];

  // --- code samples (kept as properties so braces/backticks need no template escaping) ---
  /**
   * Sample: binding DOM properties directly.
   */
  readonly propSample = `<button [disabled]="disabled()">Save</button>

<img
  [src]="url()"
  [alt]="caption()"
/>`;

  /** Line-by-line notes for {@link propSample}. */
  protected readonly propNotes: CodeNote[] = [
    {
      line: 1,
      text: "Calls the disabled signal (the () reads its current boolean) and writes that value straight onto the button's live .disabled property — not the disabled attribute. Because it's a real property assignment, not an attribute string, the button's interactive state flips instantly with no parsing involved.",
    },
    {
      line: 4,
      text: "src is one of a handful of properties Angular treats as security-sensitive: the value is routed through DomSanitizer's URL security context before it reaches the DOM, stripping dangerous schemes like javascript: — automatically, on every [src] binding, with no opt-in.",
    },
    {
      line: 5,
      text: 'A second, independent property binding on the same element — proof you can stack as many [prop]="expr" bindings as an element has properties. alt is a plain string property with no sanitization pass, used here purely for accessible descriptive text.',
    },
  ];

  /**
   * Sample: binding attributes that have no DOM property equivalent.
   */
  readonly attrSample = `<td [attr.colspan]="span()">...</td>
<span [attr.aria-label]="label()">...</span>`;

  /** Line-by-line notes for {@link attrSample}. */
  protected readonly attrNotes: CodeNote[] = [
    {
      line: 1,
      text: "The attr. prefix compiles this as an ATTRIBUTE binding, not a property one: it stringifies span() and calls setAttribute('colspan', ...) on the element. If span() ever evaluated to null/undefined, Angular would call removeAttribute('colspan') instead — the label peels off entirely, a behavior [prop] bindings don't have.",
    },
    {
      line: 2,
      text: 'ARIA attributes have no reliable DOM property equivalent at all, so [attr.*] is the only correct tool here. The expression concatenates a live string every time span() changes, and the attribute is re-stringified on each change — still a label, just one the compiler keeps reprinting for you.',
    },
  ];

  /**
   * Sample: property binding on a component's own inputs, plus two rarely-seen
   * equivalent spellings.
   */
  readonly inputSample = `<app-avatar [user]="currentUser()" [size]="48" />
<app-avatar size="48" />
<img bind-src="url()" />`;

  /** Line-by-line notes for {@link inputSample}. */
  protected readonly inputNotes: CodeNote[] = [
    {
      line: 1,
      text: "Because app-avatar is a component, not a native element, the compiler resolves [user] and [size] against AvatarComponent's own @Input()/input() metadata at compile time. A typo'd input name or a type mismatch is a build error here, not a silent runtime no-op — and 48 inside the brackets is the real TypeScript number 48, not text.",
    },
    {
      line: 2,
      text: "No brackets means a plain HTML attribute, so Angular passes the literal STRING '48'. If size is typed number, strict template type-checking flags this at build time; without strict mode it silently becomes a string where a number was expected — a classic exam trap.",
    },
    {
      line: 3,
      text: 'bind-src="expr" is the canonical, non-bracket spelling of property binding — 100% equivalent to [src]="expr". You will almost never see it in real code, but exams can ask you to recognize it.',
    },
  ];

  /**
   * A hand-written sketch of the instructions the compiler emits for a property
   * binding, shown in the "under the hood" panel.
   *
   * Approximate rather than real output: the point is that a binding compiles to
   * an imperative `setProperty` call guarded by a dirty check — not that this is
   * byte-for-byte what Angular generates.
   */
  readonly underTheHoodSample = `// roughly what the compiler generates for:
// <button [disabled]="disabled()">
// <img [src]="url()" [alt]="caption()">

function PropertyBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();                                  // move to <button>'s node slot
    ɵɵproperty('disabled', ctx.disabled());       // setProperty-style: el.disabled = value

    ɵɵadvance();                                  // move to <img>'s node slot
    ɵɵproperty('src', ɵɵsanitizeUrl(ctx.url()));  // sanitized BEFORE setProperty
    ɵɵproperty('alt', 'preview of ' + ctx.url());
  }
}

// compare with an attribute binding, e.g. [attr.colspan]="span()":
function AttrBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();
    ɵɵattribute('colspan', ctx.span());  // el.setAttribute / el.removeAttribute(null)
  }
}`;

  /** Line-by-line notes for {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 8,
      text: 'ɵɵproperty compiles a property binding — the setProperty-style instruction, guarded by a strict-equality check against the previous value first, so unchanged values skip the actual DOM write.',
    },
    {
      line: 11,
      text: 'Sanitization happens INSIDE the compiled instruction, before the value ever reaches setProperty — ɵɵsanitizeUrl runs first, every time, for every [src] binding. You never call this yourself and cannot accidentally skip it.',
    },
    {
      line: 20,
      text: 'ɵɵattribute is a genuinely different instruction from ɵɵproperty — the setAttribute/removeAttribute-style call. Passing null or undefined here removes the attribute entirely; there is no equivalent "remove" behavior for ɵɵproperty, which just assigns whatever value it is given, including null itself.',
    },
  ];
}
