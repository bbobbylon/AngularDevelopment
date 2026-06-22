import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-a11y',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Accessibility (a11y)</h1>
      <p class="lead">
        An accessible app works for everyone — keyboard users, screen readers, and
        assistive tech. Most of it is plain HTML done right; Angular adds dynamic ARIA
        bindings and the CDK <code>a11y</code> module for focus management and
        announcements.
      </p>

      <h2>Semantics first, ARIA second</h2>
      <ul>
        <li>Use real <code>&lt;button&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;label&gt;</code>, headings and landmarks — they are accessible for free.</li>
        <li>Reach for ARIA only to fill gaps; "no ARIA is better than bad ARIA".</li>
        <li>Bind ARIA dynamically: <code>[attr.aria-expanded]</code>, <code>[attr.aria-label]</code>.</li>
      </ul>

      <h2>Try it — an accessible disclosure</h2>
      <div class="demo">
        <p class="demo__title">Live — keyboard-operable, screen-reader friendly</p>
        <button
          [attr.aria-expanded]="open()"
          aria-controls="a11y-panel"
          (click)="open.set(!open())">
          {{ open() ? '▼' : '▶' }} Details
        </button>
        <div id="a11y-panel" role="region" aria-label="Details" [hidden]="!open()"
             style="margin-top:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px">
          The button exposes <code>aria-expanded</code> and <code>aria-controls</code>;
          the panel is a labelled <code>region</code>. Tab to the button and press Enter
          or Space.
        </div>
      </div>

      <h2>The CDK a11y toolkit</h2>
      <div class="code">
        <pre>import {{ '{' }} A11yModule, LiveAnnouncer {{ '}' }} from '&#64;angular/cdk/a11y';

&lt;div cdkTrapFocus&gt;…&lt;/div&gt;          // trap focus inside a dialog
inject(LiveAnnouncer).announce('Saved');   // polite screen-reader message
// FocusMonitor — distinguish keyboard vs mouse focus for focus rings</pre>
      </div>

      <h2>Focus management &amp; routing</h2>
      <ul>
        <li>Move focus to new content after navigation; offer a "skip to content" link.</li>
        <li>Return focus to the trigger when a dialog/menu closes.</li>
        <li>Never remove focus outlines without providing a visible alternative.</li>
        <li>Maintain a logical tab order; avoid positive <code>tabindex</code>.</li>
      </ul>

      <div class="tip">
        Test with the keyboard only (no mouse), run Lighthouse/axe audits, and try a
        screen reader. Color contrast and visible focus states catch the most common
        real-world failures.
      </div>
      <div class="note">
        High-impact quick wins: label every input (<code>&lt;label for&gt;</code> or
        <code>aria-label</code>), give icon-only buttons an <code>aria-label</code>, hit
        4.5:1 text contrast, never remove the focus ring without a replacement, and make
        custom widgets fully keyboard-operable (Enter/Space/arrow keys + the right
        <code>role</code>). Announce async results with <code>LiveAnnouncer</code> so
        screen-reader users hear updates that happen without a navigation.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Native semantic HTML is the foundation; ARIA fills the gaps.</li>
        <li>Bind dynamic ARIA with <code>[attr.aria-*]</code>.</li>
        <li>The CDK <code>a11y</code> module provides focus trap, focus monitor and live announcements.</li>
        <li>Manage focus across navigation and overlays; keep contrast and focus visible.</li>
      </ul>

      <p><a routerLink="/animations">Next: Animations →</a></p>
    </article>
  `,
})
export class A11y {
  protected readonly open = signal(true);
}
