import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  selector: 'app-ve-badge',
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 14px;
      border: 2px solid var(--badge-accent, var(--accent));
      background: color-mix(in srgb, var(--badge-accent, var(--accent)) 12%, transparent);
      font-weight: 600;
      transition: all .2s ease;
    }
    /* Conditional on the HOST element's classes — set by the parent. */
    :host(.compact) {
      padding: 3px 10px;
      font-size: .78rem;
      border-radius: 8px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--badge-accent, var(--accent));
    }
    /* This generic selector CANNOT leak — encapsulation scopes it here. */
    span { letter-spacing: .02em; }
  `],
  template: `<span class="dot"></span><span><ng-content /></span>`,
})
export class VeBadge {}

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

@Component({
  selector: 'app-lesson-view-encapsulation',
  imports: [RouterLink, VeBadge],
  styles: [`
    .mode-chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .mode-chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .mode-chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .mode-meaning { font-size: .9rem; margin: 10px 0 0; }

    .badge-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin: 12px 0; }
    .theme-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 12px 0; }
    .theme-row .swatch-btn { width: 34px; height: 34px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; padding: 0; }
    .theme-row .swatch-btn.on { border-color: var(--text); }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Components &amp; Templates</span>
      <h1>View Encapsulation &amp; Component Styles</h1>
      <p class="lead">
        Every component ships its own CSS — and that CSS mysteriously never
        breaks the rest of the page. This lesson shows the machinery behind that
        (attribute stamping), the three encapsulation modes, the
        <code>:host</code> selector family, and the custom-property pattern that
        replaces the deprecated <code>::ng-deep</code>.
      </p>

      <h2>Why component CSS cannot leak</h2>
      <p>
        With the default <strong>ViewEncapsulation.Emulated</strong>, a rule like
        <code>p {{ '{' }} color: red {{ '}' }}</code> in one component colors only that
        component's paragraphs. Pick a mode to see what the compiler actually emits:
      </p>
      <div class="demo">
        <p class="demo__title">Explore the modes</p>
        <div class="mode-chips">
          @for (mode of modes; track mode) {
            <button [class.on]="activeMode() === mode" (click)="activeMode.set(mode)">{{ mode }}</button>
          }
        </div>
        <div class="code"><pre>{{ modeInfo[activeMode()].emitted }}</pre></div>
        <p class="mode-meaning">{{ modeInfo[activeMode()].meaning }}</p>
      </div>
      <div class="note">
        Encapsulation rewrites <strong>selectors</strong>. It does NOT block value
        <strong>inheritance</strong> — font, color and CSS custom properties still flow
        down the DOM as usual. That asymmetry powers the theming pattern below.
      </div>

      <h2>:host — styling the component's own tag</h2>
      <p>
        A component's scoped rules match elements <em>inside</em> its template. The tag
        itself (<code>&lt;app-ve-badge&gt;</code>) belongs to the parent's markup — reach
        it with <code>:host</code>. The badge below is a real child component:
      </p>
      <div class="code">
        <pre>{{ hostSample }}</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live — :host(.compact) reacts to a class the PARENT sets</p>
        <div class="badge-row">
          <app-ve-badge [class.compact]="compact()">Deployed</app-ve-badge>
          <app-ve-badge [class.compact]="compact()">3 reviews due</app-ve-badge>
          <button (click)="compact.set(!compact())">
            {{ compact() ? 'Normal size' : 'Compact size' }}
          </button>
        </div>
        <p style="font-size:.85rem; color:var(--text-muted); margin:0">
          The parent writes <code>[class.compact]="compact()"</code> on the badge TAG;
          the badge's own <code>:host(.compact)</code> rule does the rest. No inputs, no
          style piercing. (<code>:host-context(.dark)</code> extends the idea to ancestor
          conditions — theme switches.)
        </p>
      </div>
      <div class="tip">
        Custom elements default to <code>display: inline</code> — the single most common
        :host rule is <code>:host {{ '{' }} display: block {{ '}' }}</code>. If a component's
        width/margin "does nothing", check this first.
      </div>

      <h2>Restyling a child: the wrong way and the right way</h2>
      <p>
        A parent rule like <code>app-ve-badge .dot {{ '{' }} … {{ '}' }}</code> silently never
        matches — the child's internals carry the CHILD's scoping attribute. The old
        escape hatch <code>::ng-deep</code> pierces everything and is deprecated. The
        maintainable pattern is a <strong>styling API</strong>: the child consumes a CSS
        custom property, the parent sets it — inheritance carries it across the boundary.
      </p>
      <div class="code">
        <pre>{{ themingSample }}</pre>
      </div>
      <div class="demo">
        <p class="demo__title">Live — the parent themes the badges via --badge-accent</p>
        <div class="theme-row">
          Pick an accent:
          @for (color of accents; track color) {
            <button class="swatch-btn" [class.on]="accent() === color"
              [style.background]="color" [attr.aria-label]="'accent ' + color"
              (click)="accent.set(color)"></button>
          }
        </div>
        <div class="badge-row" [style.--badge-accent]="accent()">
          <app-ve-badge>Custom-property themed</app-ve-badge>
          <app-ve-badge class="compact">me too</app-ve-badge>
        </div>
        <p style="font-size:.85rem; color:var(--text-muted); margin:0">
          One style binding on the wrapper — <code>[style.--badge-accent]="accent()"</code> —
          and every badge inside inherits it. The badge stays a black box.
        </p>
      </div>

      <h2>Global styles vs component styles</h2>
      <ul>
        <li><strong>styles.css</strong> (registered in angular.json's "styles" array) is document-wide:
          resets, typography, design tokens like <code>--accent</code> — this app's whole
          light/dark theme is custom properties flipped on <code>&lt;html&gt;</code>.</li>
        <li><strong>Component styles</strong> ship WITH the component — lazy-loaded pages bring their
          CSS along — and are scoped by encapsulation.</li>
        <li>The idiomatic split: global tokens, component-scoped consumption via <code>var()</code>.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>Emulated (default) = attribute stamping: styles cannot leak out; page styles still cascade in.</li>
        <li>None = verbatim global CSS; ShadowDom = real isolation where globals stop working inside.</li>
        <li><code>:host</code> styles the tag; <code>:host(.x)</code> / <code>:host-context(.x)</code> make it conditional.</li>
        <li>Parents cannot match child internals — expose CSS custom properties instead of piercing (<code>::ng-deep</code> is deprecated).</li>
        <li>Encapsulation blocks selector MATCHING, never value INHERITANCE — that is why var() theming works.</li>
      </ul>

      <p>
        Drill this with the <a routerLink="/practice">Styling &amp; CSS challenges</a>,
        or revisit <a routerLink="/class-style-binding">Class &amp; Style Binding</a> for
        the binding syntax side.
      </p>
    </article>
  `,
})
export class ViewEncapsulationLesson {
  readonly modes: Mode[] = ['Emulated', 'None', 'ShadowDom'];
  readonly modeInfo = MODE_INFO;
  readonly activeMode = signal<Mode>('Emulated');

  readonly compact = signal(false);
  readonly accents = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#e74694'];
  readonly accent = signal(this.accents[0]);

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

  readonly themingSample = `/* ✗ parent.css — compiles to a selector that can never match */
app-ve-badge .dot { background: purple; }

/* ✓ child declares the knob (with a fallback)… */
.dot { background: var(--badge-accent, var(--accent)); }

/* ✓ …and any ancestor sets it — inheritance crosses the boundary */
<div [style.--badge-accent]="accent()">
  <app-ve-badge>themed</app-ve-badge>
</div>`;
}
