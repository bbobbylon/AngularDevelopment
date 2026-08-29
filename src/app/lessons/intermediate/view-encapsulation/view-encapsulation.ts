import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, VeBadge],
  styleUrl: './view-encapsulation.css',
  templateUrl: './view-encapsulation.html',
})
export class ViewEncapsulationLesson {
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
