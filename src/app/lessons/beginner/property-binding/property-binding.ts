import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Property & Attribute Binding — `[prop]="expr"` and its variants.
 *
 * Covers the distinction the lesson exists for: `[x]` writes a **DOM property**,
 * live, on every check; `[attr.x]` writes an **HTML attribute**, stringified,
 * with `removeAttribute` reserved for exactly `null`/`undefined`. They look
 * interchangeable and are not — which is why `[attr.colspan]` works and
 * `[colspan]` silently doesn't, and why `[attr.disabled]="false"` is a live
 * trap rather than a working toggle.
 *
 * Also covers `[attr.*]` on component inputs and native elements, the
 * `numberAttribute`/`booleanAttribute` coercion escape hatch, NG8002 (the
 * single most common Angular compile error) and its four causes, and the
 * three sanitization contexts a bound property can land in.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer, following the shape of the reference
 * implementation in `lessons/expert/change-detection/`. Teaching order:
 *
 * 1. **Pose the problem before naming it.** The page opens on the classic
 *    `disabled="false"` gotcha and makes the reader predict whether Angular's
 *    own `[]` syntax has a version of the same trap, before it's shown one.
 * 2. **Analogy before vocabulary.** The sticker-on-the-box / gauge-on-the-dash
 *    frame gives "attribute" and "property" somewhere to land before either
 *    word is used technically.
 * 3. **Then the same idea in several modes** — a hand-drawn mirror-and-diverge
 *    diagram, a dialogue between the markup and the live object, annotated
 *    compiled output for both binding kinds, and four live demos culminating
 *    in the three-buttons-one-signal proof of the `[attr.disabled]` trap.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Coverage-sweep material folded in (docs/COVERAGE-SWEEP.md, `beginner/property-binding`)
 *
 * - The `[attr.disabled]="false"` mirror trap gets a live three-buttons demo
 *   (all three read the *same* `disabled` signal) plus its own quiz, not just
 *   a line in a pitfalls list.
 * - A new section diagnoses NG8002 by its four real causes, contrasted with
 *   NG8001 in one line.
 * - `numberAttribute` / `booleanAttribute` get a short annotated snippet that
 *   explicitly calls back to the `[attr.*]` trap — `booleanAttribute` is the
 *   one place `"false"` really does mean `false`.
 * - The sanitization section now names all three contexts (URL, HTML,
 *   RESOURCE_URL) instead of only URL/HTML, with the `<iframe [src]>` throw
 *   case that neither existing demo covered.
 *
 * @see lessons/beginner/event-binding — the full treatment of `$any($event.target)`
 * and the strict-template typing wall this lesson's demos touch only briefly.
 * @see lessons/beginner/inputs — `numberAttribute` / `booleanAttribute` in depth.
 * @see lessons/expert/security — every sanitization context and bypass method.
 */
@Component({
  selector: 'app-lesson-property-binding',
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
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './property-binding.css',
  templateUrl: './property-binding.html',
})
export class PropertyBinding {
  /**
   * Backs the `[disabled]` demo — a genuine DOM *property* — and, reused
   * later, the three-buttons-one-signal proof of the `[attr.disabled]` trap.
   * One signal driving both demos is deliberate: it is the same value, read
   * through two different binding kinds, which is the entire lesson.
   */
  protected readonly disabled = signal(false);
  /**
   * Backs the `[src]` demo. Points at a real remote image so the sanitized
   * property binding visibly does something when it changes.
   */
  protected readonly url = signal(
    'https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif',
  );
  /**
   * Backs the `[attr.colspan]` demo. `colspan` has no matching DOM property
   * Angular reaches for by default, which is exactly why it needs `attr.`.
   */
  protected readonly span = signal(2);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Data Binding track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Property Binding' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding', id: 'two-way-binding' },
    { label: 'Class & Style', id: 'class-style-binding' },
  ];

  /**
   * The mirror-and-diverge conversation staged again as dialogue, after the
   * SVG diagram stages it visually — a genuinely different mode, not the
   * same explanation twice. The DevTools turn is the one people actually
   * trip over: it names the fix for "I bound it but the HTML source still
   * shows the old value."
   */
  protected readonly mirrorTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I bound `[value]="draft()"`. The user just typed `hello`. What does the input actually hold now?',
    },
    {
      who: 'The property',
      says: "Live text — `hello`. I'm updated on every keystroke; that's the whole job of a text input.",
    },
    {
      who: 'The attribute',
      says: 'Still whatever `draft()` was when the element was born. Nobody has touched me since — nobody ever will, unless something calls `setAttribute` on me by name.',
    },
    {
      who: 'View Source',
      says: "I only ever read the attribute. I'll show you the input's birth certificate, not its current mood.",
    },
    {
      who: 'DevTools → Elements → Properties tab',
      says: 'I read the live object instead. Check me, and the mystery disappears.',
    },
  ];

  /**
   * Sample: what the compiler emits for a property binding — one function,
   * an update branch, and a bare `ɵɵproperty` call per binding.
   */
  protected readonly propertyCompiledSample = `// roughly what the compiler emits for:
// <button [disabled]="disabled()">Save</button>
// <img [src]="url()" [alt]="'preview of ' + url()">

function PropertyBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();                                 // move the cursor to <button>'s node slot
    ɵɵproperty('disabled', ctx.disabled());      // el.disabled = value — after a === check

    ɵɵadvance();                                 // move the cursor to <img>'s node slot
    ɵɵproperty('src', ɵɵsanitizeUrl(ctx.url())); // sanitized BEFORE it ever reaches setProperty
    ɵɵproperty('alt', 'preview of ' + ctx.url());
  }
}`;

  /** Line-by-line walkthrough of {@link propertyCompiledSample}. */
  protected readonly propertyCompiledNotes: CodeNote[] = [
    {
      line: 5,
      text: '`rf` is a bitmask saying which mode to run — create once, update on every check. `ctx` is the component instance, so `ctx.disabled` is your signal, straight off the class.',
    },
    {
      line: 6,
      text: 'The **update** branch. Everything inside it runs on every single check that reaches this view; the create branch above it (not shown) never runs a second time.',
    },
    {
      line: 7,
      text: '`ɵɵadvance()` moves an internal cursor forward to the node this binding targets — by array index, never by querying the DOM.',
    },
    {
      line: 8,
      text: '`ɵɵproperty` is the property-binding instruction. It compares the new value against what was stored last time and, only on a difference, does the equivalent of `el.disabled = value` straight on the DOM node object.',
    },
    {
      line: 11,
      text: '`ɵɵsanitizeUrl` wraps the value **before** `ɵɵproperty` ever sees it. `src` is one of a handful of properties Angular treats as security-sensitive, and this wrapping is not optional.',
    },
    {
      line: 12,
      text: 'A second, independent property binding on the same element — proof you can stack as many `[prop]="expr"` bindings as an element has properties. `alt` gets no sanitization pass; it\'s a plain string.',
    },
  ];

  /**
   * Sample: what the compiler emits for an attribute binding — same shape,
   * a different instruction, and the `null`/`undefined`-only removal rule
   * this lesson's whole third act depends on.
   */
  protected readonly attrCompiledSample = `// roughly what the compiler emits for:
// <td [attr.colspan]="span()">...</td>

function AttrBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();                        // move the cursor to <td>'s node slot
    ɵɵattribute('colspan', ctx.span()); // setAttribute, or removeAttribute on null/undefined
  }
}`;

  /** Line-by-line walkthrough of {@link attrCompiledSample}. */
  protected readonly attrCompiledNotes: CodeNote[] = [
    {
      line: 4,
      text: 'Same shape as the property version — a plain function, an `rf` bitmask, a `ctx` — but a different instruction on the line that matters.',
    },
    {
      line: 6,
      text: 'The same cursor mechanism as `ɵɵproperty`. Attribute and property bindings share the traversal machinery; they differ only in what they do once they arrive at the node.',
    },
    {
      line: 7,
      text: "`ɵɵattribute` **stringifies** the value and calls `setAttribute('colspan', String(span()))`. The one exception: a value that is exactly `null` or `undefined` calls `removeAttribute('colspan')` instead — the attribute leaves the DOM entirely.",
    },
  ];

  /**
   * Sample: three lines, three different meanings for "48" — the compile-time
   * check on a component input and the bracket/no-bracket string trap.
   */
  protected readonly componentInputsSample = `<app-avatar [user]="currentUser()" [size]="48" />
<app-avatar size="48" />
<img bind-src="url()" />`;

  /** Line-by-line walkthrough of {@link componentInputsSample}. */
  protected readonly componentInputsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`[user]` is checked at **compile time** against `AvatarComponent`\'s own declared inputs — a typo or a type mismatch is a build error, not a silent no-op. `[size]="48"` is a real expression, so `48` here is the **number** `48`.',
    },
    {
      line: 2,
      text: "No brackets, so this is a plain HTML attribute: Angular passes the literal **string** `'48'`. If `size` is typed `number`, strict templates flags this at build time; without strict mode it becomes a string where a number was expected.",
    },
    {
      line: 3,
      text: '`bind-src="expr"` is the canonical, non-bracket spelling of `[src]="expr"` — 100% equivalent. Real code almost never uses it; recognizing it is the actual skill being tested when it shows up.',
    },
  ];

  /**
   * Sample: the `transform` option on `input()` — the two built-ins, plus a
   * custom one, coercing a plain attribute string at the boundary.
   */
  protected readonly coercionSample = `readonly size = input(0, { transform: numberAttribute });
readonly disabled = input(false, { transform: booleanAttribute });
readonly id = input('', { transform: (v: string) => v.trim().toLowerCase() });

// <app-avatar size="48" disabled />
// size()     -> the NUMBER 48
// disabled() -> the boolean true — no attr.* trap here at all`;

  /** Line-by-line walkthrough of {@link coercionSample}. */
  protected readonly coercionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The second argument to `input()` is an options object. `numberAttribute` coerces whatever arrives — a bound value or a plain attribute string — into a number before the input is ever set. `size="48"` now yields the number `48`, brackets or not.',
    },
    {
      line: 2,
      text: '`booleanAttribute` follows HTML\'s own rule: **presence** means `true` — `<app-avatar disabled>` alone is enough — and the literal string `"false"` is specifically treated as `false` too. This is the one place in Angular where the string `"false"` behaves the way people assume it always does — contrast that with the raw `[attr.*]` trap above, which has no such special case.',
    },
    {
      line: 3,
      text: "`transform` isn't limited to the two built-ins. Any function from the raw input value to the type you actually want compiles the same way.",
    },
  ];

  /**
   * The self-test on the `[attr.disabled]` mirror trap — the coverage-sweep
   * item this lesson exists to fix. The distractors are the three ways a
   * learner mis-imagines `[attr.*]`: that it mirrors the property, that it
   * errors on a boolean, and that it consults JS truthiness.
   */
  protected readonly attrDisabledQuizOptions: QuizOption[] = [
    {
      text: 'It toggles in sync with the first button — same signal, same result.',
      why: "That's true of the property-bound button, not this one. `[attr.*]` doesn't care whether the expression is `true` or `false` — it cares whether the *attribute* ends up present, and stringifying either boolean produces a non-empty string.",
    },
    {
      text: 'It never becomes enabled, no matter what the checkbox says.',
      correct: true,
      why: '`disabled()` being `false` sets the attribute to the string `"false"`. HTML boolean attributes are governed by presence, not content, so a *present* attribute — any content at all — disables the element. Only `null`/`undefined` removes it.',
    },
    {
      text: "It throws a runtime error, because you can't bind a boolean to `[attr.*]`.",
      why: '`[attr.*]` happily accepts any value and stringifies it — that permissiveness is the entire problem. No error is raised, which is what makes this trap easy to ship: the code compiles, runs, and looks fine in every way except the one that matters.',
    },
    {
      text: 'It stays permanently enabled, because `[attr.*]` ignores falsy values.',
      why: "Backwards — falsy in JavaScript and *absent* in HTML are different questions. `[attr.*]` never consults JS truthiness; it only checks whether the value is exactly `null`/`undefined`. `false`, `0` and `''` are all falsy in JS and all still land in the DOM as a present attribute.",
    },
  ];

  /**
   * Self-test on diagnosing NG8002 once the obvious cause (a missing import)
   * is already ruled out — reinforces the four-cause table with a scenario
   * that forces picking between them.
   */
  protected readonly ng8002QuizOptions: QuizOption[] = [
    {
      text: "`count` isn't declared as an input on `Badge` — check for a typo, or that it's actually written with `input()`/`@Input()`.",
      correct: true,
      why: "Being imported only makes the component's selector legal to use in a template — Angular still checks every bracketed binding against that component's own declared inputs. A typo'd name, or a field that was never turned into an input, reproduces the exact same error even with the import in place.",
    },
    {
      text: '`Badge` needs to use `OnPush` change detection.',
      why: 'Change-detection strategy decides when a view is *checked*, not which bindings the compiler considers legal to *write*. NG8002 is a compile-time error; it happens before any pass has run.',
    },
    {
      text: '`count` should be passed without brackets, as a plain attribute.',
      why: "Dropping the brackets would make NG8002 disappear, but it also makes `count` the string `'5'` instead of the number `5` — trading a build error for a silent type bug. If `count` is typed `number`, strict templates still flags the mismatch.",
    },
    {
      text: "The parent component's own selector is misspelled.",
      why: "That would break the *parent's* own tag in whatever renders it — a different error, on a different template. NG8002 names the binding target, `count`, not the host element's selector.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does inspecting the element in DevTools sometimes show the old value?',
      a: "Because the **Elements** panel's default view renders attributes, and attributes freeze at their initial value. Switch to the **Properties** tab (or run `el.value` in the console) to see what the object actually holds right now — that's the one a `[value]` or `[disabled]` binding is writing to.",
    },
    {
      q: 'Can I just use interpolation, like `colspan="{{ n }}"`, instead of `[attr.colspan]`?',
      a: 'For a plain string attribute, yes — they compile to roughly the same thing. It stops being interchangeable the moment you need `null` to remove the attribute: interpolation always produces a string, at worst an empty one, where only a real `[attr.*]` binding can pass `null`/`undefined` through to `removeAttribute`.',
    },
    {
      q: 'Do `[class.x]` and `[style.x]` follow the same attribute-vs-property split?',
      a: "No — they're their own binding forms with their own rules, because `class` and `style` have unusually rich browser-native syntax and Angular gives each one a dedicated binding shape rather than routing it through `[attr.*]`. **Class & Style Binding**, next in this track, gives them the same close treatment this page gave `disabled` and `colspan`.",
    },
    {
      q: 'Will I ever actually type `bind-src` for real?',
      a: "Almost never in this app's own code — everyone writes `[src]`. It exists for template pipelines where literal square brackets are awkward to author. Treat it as an exam-recognition item: know it's 100% equivalent to `[src]`, and move on.",
    },
    {
      q: 'If `[attr.disabled]="false"` still disables, how does a boolean attribute ever get removed?',
      a: "Bind `[attr.*]` to an expression that evaluates to `null` or `undefined` exactly when you want the attribute gone — never to a boolean, which will just get stringified and stay. `disabled() ? '' : null` is the pattern; the empty string is present (disabled), `null` is absent (enabled).",
    },
  ];
}
