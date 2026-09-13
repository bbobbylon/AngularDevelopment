import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions, Scribble, Whiteboard } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
import { Predict, Quiz, Remember } from '../../../shared/teaching';
import type { QuizOption } from '../../../shared/teaching';
import { VeBadge } from './ve-badge/ve-badge';

/**
 * One of the three encapsulation modes.
 */
type Mode = 'Emulated' | 'None' | 'ShadowDom';

const MODE_INFO: Record<Mode, { emitted: string; meaning: string }> = {
  Emulated: {
    emitted: `/* what actually reaches the page (default) */
p[_ngcontent-abc-123] { color: red; }

<!-- and the template is stamped to match -->
<p _ngcontent-abc-123>…</p>`,
    meaning:
      'The compiler invents a per-component attribute, stamps every template element with it, and rewrites each selector to require it. Styles cannot leak OUT; global page styles still cascade IN. No browser magic involved — just clever CSS rewriting.',
  },
  None: {
    emitted: `/* injected verbatim — a global stylesheet */
p { color: red; }`,
    meaning:
      'No scoping at all: the CSS lands in a plain <style> tag untouched and hits matching elements ANYWHERE on the page, load-order dependent. Deliberate for design-system roots; a foot-gun for generic selectors.',
  },
  ShadowDom: {
    emitted: `/* attached inside a real shadow root */
#shadow-root
  <style>p { color: red; }</style>
  <p>…</p>`,
    meaning:
      "Real browser isolation: the template renders inside a shadow root and styles attach only there. Your global stylesheet's RULES stop matching inside it — resets, element rules, class rules, all of them — though inherited VALUES still flow in (a font-family set on body, every custom property), because inheritance is not a selector. The strongest boundary, and the one that surprises the most.",
  },
};

/** Line-by-line notes for each mode's {@link MODE_INFO} sample, keyed the same way. */
const MODE_NOTES: Record<Mode, CodeNote[]> = {
  Emulated: [
    {
      line: 2,
      text: 'The compiler appends `_ngcontent-abc-123` — a per-component attribute, a different one for every component in the app — to the selector. This exact rule can now only ever match an element that carries that exact attribute.',
    },
    {
      line: 5,
      text: "Every element in this component's OWN template gets stamped with the same attribute at build time, so the rule above finds them and nothing written by any other component.",
    },
  ],
  None: [
    {
      line: 2,
      text: 'No attribute, no rewriting — this exact rule ships into a plain `<style>` tag and matches every `<p>` on the page, in every component, for as long as that tag stays in the document.',
    },
  ],
  ShadowDom: [
    {
      line: 2,
      text: '`#shadow-root` is a real browser feature — `element.attachShadow()` — not an Angular convention. Everything indented below it lives in its own document-like subtree.',
    },
    {
      line: 3,
      text: 'This `<style>` tag is physically INSIDE the shadow root, so its rules can only ever see the elements that are also inside it. The browser enforces that, not the Angular compiler — which is why no outside rule, not even one with `!important`, gets past it.',
    },
  ],
};

/**
 * Lesson: how component CSS is scoped (emulated encapsulation), the three
 * ViewEncapsulation modes, :host / :host-context, and the CSS-custom-property
 * theming pattern that replaces the deprecated ::ng-deep.
 *
 * ## Shape: "There Are No Dumb Questions" (`shape: 'no-dumb-questions'`)
 *
 * The first pilot of BACKLOG §2.10 / CONTRIBUTING §2C. The chapter's `hand` line is
 * the shape's stage line; then the opening block is:
 * the giant sentence ("Selectors stop at the boundary. Inherited values
 * walk straight through.") → a statement → {@link ndq}, eight open questions
 * that carry the whole explanation → a Brain Power left open → the boundary
 * figure in an `<app-whiteboard>` with three scribbles quoting its labels →
 * the one quiz that is the crux ({@link boundaryOptions}) → the one-way-window
 * analogy on a napkin. No cards, no dialogue, and no Remember until the
 * mechanism section — the Q&A does the teaching.
 *
 * Everything after the block is the conventional lesson (see
 * `src/app/lessons/expert/change-detection/change-detection.ts` for the shape
 * it follows): the same three modes in four representations — an interactive
 * mode-picker, an annotated `app-code-lab` sample, a `TapeCard` row and a
 * comparison table — then `:host`, the `!important` prediction, the
 * custom-property styling API, and a second quiz on what a shadow root does
 * and does not stop ({@link shadowOptions}).
 *
 * The badge is a real child component with :host styles, used by the live
 * demos: the parent classes its tag (:host(.compact)) and themes it via an
 * inherited custom property — the two sanctioned ways in from outside.
 */
@Component({
  selector: 'app-lesson-view-encapsulation',
  imports: [
    RouterLink,
    VeBadge,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    BrainPower,
    NoDumbQuestions,
    Scribble,
    Whiteboard,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './view-encapsulation.css',
  templateUrl: './view-encapsulation.html',
})
export class ViewEncapsulationLesson {
  /** The Components & Templates track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Content Projection', id: 'content-projection' },
    { label: 'View Queries', id: 'view-queries' },
    { label: 'ng-template & Outlet', id: 'ng-template-outlet' },
    { label: 'View Encapsulation' },
  ];

  /**
   * The eight questions that ARE the lesson — the shape's spine. They escalate:
   * the first misconception (1–2), where it bites at work (3–4), the fix (5–6),
   * then the modes and their cost (7–8). Every answer talks to "you": the
   * dialogue is gone, so the second person has to live here. Questions and
   * answers both take backticks and bold — the device renders both as RichText.
   */
  protected readonly ndq: readonly NdqItem[] = [
    {
      q: "I write `p { color: red }` in my component and only MY paragraphs turn red. CSS can't do that on its own — so what is?",
      a: "The Angular compiler. At build time it invents an attribute for your component — something like `_ngcontent-abc-123` — stamps it on every element in your template, and rewrites your rule to `p[_ngcontent-abc-123]`. Your rule still matches every `<p>` it can find; it's just that the only `<p>`s wearing your stamp are yours. That's the default mode, **Emulated**, and it's pure text rewriting — no browser feature involved.",
    },
    {
      q: 'So my styles are sealed in. Nothing gets in from outside either, right?',
      a: "No — and this is the misconception the whole lesson exists to fix. The rewriting touches **selectors**. It does nothing to the cascade. Set `font-family: serif` on `<body>` and your component's text goes serif, because `font-family` inherits, and inheritance never asked a selector for permission. Selectors stop at the boundary; inherited values walk straight through it.",
    },
    {
      q: "Then what happens when I write `app-ve-badge .dot { background: purple }` in the PARENT's stylesheet?",
      a: "Nothing. Silently. The rule compiles fine — with the **parent's** stamp attached — while the only `.dot` in existence wears the **child's** stamp. Two different attributes, so the selector is valid CSS that can never match anything. No error, no warning, no red squiggle: just a dot that stays whatever colour it was, and an afternoon of your life spent finding out why.",
    },
    {
      q: 'Where does this actually bite me?',
      a: "The first time you theme a library component. You'll write a selector aimed at its internals, watch nothing happen, and then find `::ng-deep` on Stack Overflow. It pierces the boundary and it works — and it has been deprecated for years, which is the worst combination, because codebases keep accumulating it. Treat it as unavailable in new code: if you want it, the child is missing a styling API.",
    },
    {
      q: 'Then how DO I recolour that dot from outside?',
      a: "You don't reach in. You ask for a knob. The child writes `.dot { background: var(--badge-accent, var(--accent)) }` — a custom property with a fallback — and any ancestor sets `--badge-accent`. Custom properties **inherit**, and inheritance crosses the boundary untouched, so your value walks through the exact wall your selector couldn't. The child stays a black box; you turned the knob it offered.",
    },
    {
      q: 'The `app-ve-badge` tag itself — whose styles reach that?',
      a: "Nobody's, by default. The tag lives in the parent's template, so the child's scoped rules can't see it; the child's internals are behind the wall, so the parent can't style them. So the child gets one special selector for its own tag: `:host`. `:host(.compact)` matches only when the **parent** put `class=\"compact\"` on the tag — an ordinary class binding on the outside, a rule on the inside, no `@Input` in between. And the single most common `:host` rule you'll ever write is `:host { display: block }`, because a custom element is `display: inline` by default, and inline elements ignore your `width` and `margin`.",
    },
    {
      q: "If Emulated isn't real isolation, why not switch everything to ShadowDom?",
      a: "Because real isolation cuts both ways. `ViewEncapsulation.ShadowDom` renders your template inside an actual `attachShadow()` root, and the browser — not the compiler — refuses to let outside **rules** match inside: your global resets, element rules and class rules all stop at the root, and you re-provide what you need per component. Inherited values still arrive, though — a `font-family` on `<body>`, every custom property — because inheritance isn't a selector, in any mode. Emulated gives you the leak protection you actually wanted without giving up the cascade. (`ViewEncapsulation.None` is the third option: no scoping at all, your CSS lands in a plain `<style>` tag and hits the whole page, load-order dependent.)",
    },
    {
      q: 'Does any of this cost me at runtime?',
      a: "Emulated costs essentially nothing: the rewriting happened at build time, so what ships is ordinary CSS with slightly longer selectors and one extra attribute per element. ShadowDom is the only mode with real runtime machinery behind it, and even that is browser-native. What costs you is the hour spent on a selector that can never match — and now you know why it can't.",
    },
  ];

  /** Choices for the inheritance-vs-matching check — the crux of the whole lesson. */
  protected readonly boundaryOptions: QuizOption[] = [
    {
      text: 'Nothing crosses — the child is fully isolated',
      why: 'Too strong for Emulated mode. Set `font-family` on `<body>` and every component picks it up; encapsulation never touched that.',
    },
    {
      text: 'Inherited values cross; selectors do not',
      correct: true,
      why: 'Exactly the asymmetry to memorise. Encapsulation rewrites **selectors** so they cannot match across the boundary, but it does nothing to the cascade — inherited properties, including CSS custom properties, flow straight through. That single fact is why `var()` theming works and `::ng-deep` is unnecessary.',
    },
    {
      text: 'Selectors cross but only with `::ng-deep`',
      why: 'True as a description of `::ng-deep`, but it inverts the point. `::ng-deep` is deprecated precisely because there is a supported channel that already works — inheritance.',
    },
  ];

  /** Choices for the ShadowDom check — the same asymmetry, enforced by the browser instead of the compiler. */
  protected readonly shadowOptions: QuizOption[] = [
    {
      text: "The parent's `app-ve-badge .dot` rule — the browser is more forgiving than the compiler",
      why: "Less forgiving, if anything. The compiler could only rewrite the selector into something that never matches; a shadow root has the browser refuse outside rules outright. Nothing you write in the parent's stylesheet matches an element inside it.",
    },
    {
      text: 'The `--badge-accent` custom property set on an ancestor',
      correct: true,
      why: "Inheritance crosses even a real shadow root. It's the same asymmetry as Emulated — selectors stop, values pass — with the browser doing the enforcing instead of the compiler, and it's why the custom-property styling API is the one pattern that works in all three modes.",
    },
    {
      text: 'Neither — a shadow root is sealed in both directions',
      why: "Sealed against selectors, not against inheritance. `color`, `font-family` and every custom property still flow into the shadow tree from the host element; what stops is your global stylesheet's rules matching the elements inside. Sealed in both directions would mean re-declaring your font in every component.",
    },
  ];

  /** The piercing rule that matched nothing, now shouting — the prediction in the trap-and-fix section. */
  protected readonly piercingSample = `/* parent.css — the rule that matched nothing, now with !important */
app-ve-badge .dot {
  background: purple !important;
}

/* child template — the only .dot there is */
<span class="dot"></span>`;

  /**
   * The three modes.
   */
  readonly modes: Mode[] = ['Emulated', 'None', 'ShadowDom'];
  /**
   * What each mode emits and what it means.
   */
  readonly modeInfo = MODE_INFO;
  /**
   * Line-by-line notes for the sample currently shown, keyed by mode.
   */
  readonly modeNotes = MODE_NOTES;
  /**
   * The mode being examined.
   */
  readonly activeMode = signal<Mode>('Emulated');

  /**
   * Whether the badge is in its compact variant, for the `:host-context` demo.
   */
  readonly compact = signal(false);
  /**
   * The accent colours available.
   */
  readonly accents = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#e74694'];
  /**
   * The chosen accent — passed in as a CSS custom property, which is the one
   * styling channel that crosses the encapsulation boundary in every mode.
   */
  readonly accent = signal(this.accents[0]);

  /**
   * Sample: `:host` and `:host-context`, and why the second is the way a component
   * reacts to an ancestor's class.
   */
  readonly hostSample = `@Component({
  selector: 'app-ve-badge',
  styles: [\`
    :host {                       /* the <app-ve-badge> element itself */
      display: inline-flex;
      border: 2px solid var(--badge-accent, var(--accent));
    }
    :host(.compact) {             /* only when the PARENT adds class="compact" */
      padding: 3px 10px;
      font-size: .78rem;
    }
  \`],
  template: '<span class="dot"></span><ng-content />',
})
export class VeBadge {}

<!-- parent template -->
<app-ve-badge [class.compact]="compact()">Deployed</app-ve-badge>`;

  /** Line-by-line walkthrough of {@link hostSample}. */
  readonly hostNotes: CodeNote[] = [
    {
      line: 4,
      text: "`:host` selects the component's own tag — `<app-ve-badge>` itself — which normally belongs to the PARENT's template and would otherwise be unreachable from inside the child's own scoped styles.",
    },
    {
      line: 6,
      text: '`var(--badge-accent, var(--accent))` is a fallback chain: use `--badge-accent` if some ancestor set it, else fall back to the app-wide `--accent` token. Both are custom properties, so both cross the boundary by inheritance.',
    },
    {
      line: 8,
      text: "`:host(.compact)` only matches when the ELEMENT ITSELF carries `.compact` — and only the parent's template can put a class on that tag, since it lives outside the child's own template entirely.",
    },
    {
      line: 13,
      text: "The child's actual internals. This `<span>` carries the CHILD's `_ngcontent-*` attribute at runtime — the thing an outside selector can never directly reach.",
    },
    {
      line: 18,
      text: 'The parent adds `class="compact"` to the tag from the OUTSIDE — no `@Input`, no method call, just an ordinary class binding that the child\'s own `:host(.compact)` rule reacts to.',
    },
  ];

  /**
   * Sample: the theming mistake and its fix.
   *
   * A parent styling `app-ve-badge .dot` compiles to a selector carrying the
   * parent's attribute, which the child's DOM does not have — so it silently never
   * matches. Custom properties inherit through the boundary and are the supported
   * way in.
   */
  readonly themingSample = `/* ✗ parent.css — compiles to a selector that can never match */
app-ve-badge .dot { background: purple; }

/* ✓ child declares the knob (with a fallback)… */
.dot { background: var(--badge-accent, var(--accent)); }

/* ✓ …and any ancestor sets it — inheritance crosses the boundary */
<div [style.--badge-accent]="accent()">
  <app-ve-badge>themed</app-ve-badge>
</div>`;

  /** Line-by-line walkthrough of {@link themingSample}. */
  readonly themingNotes: CodeNote[] = [
    {
      line: 2,
      text: "Valid CSS, and it compiles fine — with the PARENT's scoping attribute appended to `.dot`. The child's actual `.dot` carries the CHILD's attribute. Two different attributes, so this can never match anything. No error, no warning — just a colour that never changes.",
    },
    {
      line: 5,
      text: 'The child names its OWN styling API: a custom property with a sane fallback. Anyone outside can now affect this colour without ever writing a selector that reaches inside.',
    },
    {
      line: 8,
      text: '`[style.--badge-accent]` sets a custom property on this `<div>` — the leading `--` is what makes it a custom property rather than a real CSS property Angular would otherwise try to validate.',
    },
    {
      line: 9,
      text: 'The badge is nested inside that `<div>` in the DOM, so it inherits `--badge-accent` the same way it would inherit `color` or `font-family`. Encapsulation never touches inheritance — only selector matching.',
    },
  ];
}
