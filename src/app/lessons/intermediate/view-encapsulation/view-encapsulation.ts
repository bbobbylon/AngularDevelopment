import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
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
      'Real browser isolation: the template renders inside a shadow root, styles apply only there, and outside styles cannot cascade in AT ALL (your global stylesheet stops working inside it — including fonts and resets). The strongest boundary, and the one that surprises the most.',
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
      text: 'This `<style>` tag is physically INSIDE the shadow root, so its rules can only ever see the elements that are also inside it. The browser enforces that, not the Angular compiler — which is why nothing, not even `!important`, gets past it from outside.',
    },
  ],
};

/**
 * Lesson: how component CSS is scoped (emulated encapsulation), the three
 * ViewEncapsulation modes, :host / :host-context, and the CSS-custom-property
 * theming pattern that replaces the deprecated ::ng-deep.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `src/app/lessons/expert/change-detection/change-detection.ts` for the shape
 * this copies). The teaching order: pose the leak-that-never-happens problem,
 * then the one-way-window analogy with a hand-authored SVG boundary diagram
 * (selectors stop at the fence, inheritance crosses it), then the same three
 * modes in five different representations — prose, an interactive
 * mode-picker, an annotated `app-code-lab` sample, a `TapeCard` row, and a
 * comparison table — before moving on to `:host` and the custom-property
 * styling API that replaces `::ng-deep`.
 *
 * The badge below is a real child component with :host styles, used by the
 * live demos: the parent classes its tag (:host(.compact)) and themes it via
 * an inherited custom property — the two sanctioned ways in from outside.
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
    Faq,
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

  /** The silently-never-matches rule, posed before the section that explains it. */
  protected readonly piercingSample = `/* parent.css */
app-ve-badge .dot {
  background: purple;
}

/* child template */
<span class="dot"></span>`;

  /** Choices for the inheritance-vs-matching check — the crux of the whole lesson. */
  protected readonly boundaryOptions: QuizOption[] = [
    {
      text: 'Nothing crosses — the child is fully isolated',
      why: 'Too strong for Emulated mode. Set `font-family` on `<body>` and every component picks it up; encapsulation never touched that.',
    },
    {
      text: 'Inherited values cross; selectors do not',
      correct: true,
      why: 'Exactly the asymmetry to memorise. Encapsulation rewrites *selectors* so they cannot match across the boundary, but it does nothing to the cascade — inherited properties, including CSS custom properties, flow straight through. That single fact is why `var()` theming works and `::ng-deep` is unnecessary.',
    },
    {
      text: 'Selectors cross but only with `::ng-deep`',
      why: 'True as a description of `::ng-deep`, but it inverts the point. `::ng-deep` is deprecated precisely because there is a supported channel that already works — inheritance.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why is my component ignoring `width` and `margin`?',
      a: 'Almost certainly because a custom element is `display: inline` by default, and inline elements ignore width and vertical margin. Add `:host { display: block }` — this is the single most common styling surprise in Angular.',
    },
    {
      q: 'If Emulated is not real isolation, why not use ShadowDom everywhere?',
      a: 'Because real isolation cuts both ways. Inside a shadow root your global stylesheet stops working entirely — resets, fonts, design tokens, the lot — and you have to re-provide them per component. Emulated gives you the leak protection people actually want without losing the cascade they rely on.',
    },
    {
      q: 'Is `::ng-deep` really going away, or is that just advice?',
      a: 'It has been marked deprecated for years and still works, which is a bad combination — it means codebases keep accumulating it. Treat it as unavailable in new code. If you find yourself wanting it, the child is missing a styling API, and adding a custom property is both easier and something the child can keep supporting.',
    },
    {
      q: 'Does encapsulation cost anything at runtime?',
      a: 'Essentially nothing. The attribute rewriting happens at build time, so what ships is ordinary CSS with slightly longer selectors and one extra attribute per element. ShadowDom is the mode with real runtime machinery behind it, and even that is browser-native.',
    },
  ];
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
