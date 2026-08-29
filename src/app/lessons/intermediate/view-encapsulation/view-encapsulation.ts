import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
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

/**
 * Lesson: how component CSS is scoped (emulated encapsulation), the three
 * ViewEncapsulation modes, :host / :host-context, and the CSS-custom-property
 * theming pattern that replaces the deprecated ::ng-deep.
 *
 * The badge below is a real child component with :host styles, used by the
 * live demos: the parent classes its tag (:host(.compact)) and themes it via
 * an inherited custom property — the two sanctioned ways in from outside.
 */
@Component({
  selector: 'app-lesson-view-encapsulation',
  imports: [RouterLink, VeBadge, Faq, Predict, Quiz, Remember],
  styleUrl: './view-encapsulation.css',
  templateUrl: './view-encapsulation.html',
})
export class ViewEncapsulationLesson {
  /** The silently-never-matches rule, posed before the section that explains it. */
  protected readonly piercingSample = `/* parent.css */
app-ve-badge .dot {
  background: purple;
}

/* child template */
<span class="dot"></span>`;

  /** Choices for the inheritance-vs-matching check — the crux of the whole lesson. */
  protected readonly boundaryOptions = [
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
  protected readonly questions = [
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
}
