import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: accessibility in depth — semantics-first (with a live div-vs-button
 * keyboard test), why ARIA needs [attr.] binding, an accessible disclosure,
 * form errors that announce themselves, live regions, the CDK a11y toolkit,
 * the WAI-ARIA keyboard patterns table, and a real WCAG contrast-ratio
 * calculator implementing the spec math.
 */

/** WCAG relative luminance of a #rrggbb color. */
function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const chan = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

/** WCAG contrast ratio between two hex colors: (L1 + .05) / (L2 + .05). */
function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

@Component({
  selector: 'app-lesson-a11y',
  imports: [RouterLink],
  styles: [`
    .fake-btn { display: inline-block; padding: 8px 14px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border); cursor: pointer; user-select: none; color: var(--text); }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .contrast-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin: 10px 0; }
    .contrast-row label { display: flex; gap: 8px; align-items: center; font-size: .85rem; }
    .sample-text { padding: 14px 20px; border-radius: 10px; font-size: 1rem; border: 1px solid var(--border); }
    .ratio { font-family: monospace; font-size: 1.3rem; font-weight: 700; }
    .verdicts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .verdict { font-size: .8rem; padding: 3px 12px; border-radius: 999px; font-weight: 600; }
    .verdict.pass { background: rgba(16,185,129,.12); color: var(--green); }
    .verdict.fail { background: rgba(239,68,68,.12); color: #ef4444; }

    .err[role="alert"] { color: #ef4444; font-size: .85rem; margin-top: 6px; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Accessibility (a11y)</h1>
      <p class="lead">
        An accessible app works for keyboard users, screen-reader users, low-vision
        users — and, not coincidentally, works better for everyone else too. Most of it
        is semantic HTML done right; Angular adds dynamic ARIA binding and the CDK
        <code>a11y</code> toolkit. This page is hands-on: every rule below has a live
        demonstration or the exact keys/math behind it.
      </p>

      <h2>Semantics first — feel the difference</h2>
      <div class="demo">
        <p class="demo__title">Live — press Tab. Which "button" can you reach?</p>
        <div class="row">
          <div class="fake-btn" (click)="clicks.set(clicks() + 1)">div + (click)</div>
          <button (click)="clicks.set(clicks() + 1)">real button</button>
          <span class="pill">clicks: {{ clicks() }}</span>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          The <code>&lt;div&gt;</code> is invisible to the keyboard: not focusable, no
          Enter/Space activation, announced as plain text ("group") by screen readers.
          The real <code>&lt;button&gt;</code> gets all of it for free. To fix the div
          you'd need <code>tabindex="0"</code>, <code>role="button"</code>, a keydown
          handler for Enter <em>and</em> Space, and a disabled story — four bugs waiting
          to happen versus one native element.
        </p>
      </div>
      <div class="tip">
        The first rule of ARIA: <strong>don't use ARIA</strong> — use the native element
        with the behavior built in (<code>button</code>, <code>a</code>,
        <code>label</code>, <code>dialog</code>, <code>details</code>, headings,
        landmarks). ARIA only fills genuine gaps, and bad ARIA is worse than none: it
        makes confident, wrong announcements.
      </div>

      <h2>Dynamic ARIA needs [attr.] — an exam classic</h2>
      <p>
        <code>aria-*</code> are HTML <em>attributes</em> with no corresponding DOM
        properties. Property binding (<code>[ariaLabel]</code>) targets properties, so
        it fails — bind the attribute explicitly:
      </p>
      <div class="code"><pre>{{ ariaBindSample }}</pre></div>

      <h2>An accessible disclosure, annotated</h2>
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
          A screen reader announces this trigger as "Details, button, expanded/collapsed"
          — state included — because of <code>aria-expanded</code>.
          <code>aria-controls</code> ties the panel to its trigger, and
          <code>[hidden]</code> removes the content from BOTH the visual and
          accessibility trees (unlike <code>opacity: 0</code>, which hides it visually
          but leaves it readable).
        </div>
      </div>

      <h2>Forms that announce their errors</h2>
      <div class="demo">
        <p class="demo__title">Live — submit empty, then imagine hearing it</p>
        <label for="a11y-email" style="display:block;font-size:.85rem;margin-bottom:4px">Email</label>
        <input id="a11y-email" type="email" [attr.aria-invalid]="emailError() !== ''"
          aria-describedby="a11y-email-err"
          [value]="email()" (input)="email.set($any($event.target).value)" />
        <button style="margin-left:8px" (click)="submit()">Subscribe</button>
        @if (emailError()) {
          <p class="err" id="a11y-email-err" role="alert">{{ emailError() }}</p>
        }
      </div>
      <div class="code"><pre>{{ formSample }}</pre></div>
      <ul>
        <li><code>&lt;label for&gt;</code> — clicking the label focuses the input, and the reader announces the field's name.</li>
        <li><code>aria-describedby</code> — the error text is read <em>with</em> the field when focused.</li>
        <li><code>role="alert"</code> — an implicit assertive live region: the error is announced the moment it appears, no focus change needed.</li>
        <li><code>aria-invalid</code> — announced as "invalid entry" on the field itself.</li>
      </ul>

      <h2>Live regions — updates without navigation</h2>
      <div class="demo">
        <p class="demo__title">Live — aria-live="polite"</p>
        <div class="row">
          <button (click)="save()">Save (simulated)</button>
          <span aria-live="polite" class="pill">{{ status() }}</span>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Sighted users see the status change; without <code>aria-live</code>,
          screen-reader users hear nothing. <code>polite</code> waits for a pause,
          <code>assertive</code> interrupts (reserve it for errors). The CDK's
          <code>LiveAnnouncer</code> is the service-layer version of the same mechanism.
        </p>
      </div>

      <h2>The CDK a11y toolkit</h2>
      <div class="code"><pre>{{ cdkSample }}</pre></div>
      <table class="cmp">
        <tr><th>Tool</th><th>Problem it solves</th></tr>
        <tr><td><code>cdkTrapFocus</code></td><td>Tab must cycle INSIDE an open modal — reaching the page underneath is a WCAG failure.</td></tr>
        <tr><td><code>LiveAnnouncer</code></td><td>Announce async results ("3 results found", "Saved") from anywhere in code.</td></tr>
        <tr><td><code>FocusMonitor</code></td><td>Knows whether focus came from keyboard, mouse or program — show strong focus rings for keyboards only.</td></tr>
        <tr><td><code>ListKeyManager</code></td><td>Arrow-key navigation + typeahead for custom listboxes/menus, so you don't hand-roll key handling.</td></tr>
        <tr><td><code>cdkAriaLive</code></td><td>Directive form of LiveAnnouncer for a region whose content changes.</td></tr>
      </table>

      <h2>Focus management — the SPA-specific discipline</h2>
      <ul>
        <li><strong>Route changes:</strong> a browser navigation resets focus to the top;
          an SPA navigation changes content while focus stays on a link that may no longer
          exist. Move focus to the new view's heading (<code>tabindex="-1"</code> +
          <code>focus()</code>) and offer a skip-to-content link.</li>
        <li><strong>Dialogs:</strong> focus moves in on open, is trapped while open, and
          returns to the trigger on close. Native <code>&lt;dialog&gt;</code> +
          <code>showModal()</code> gives you most of this free.</li>
        <li><strong>Deleted elements:</strong> if the focused item disappears (delete row),
          move focus deliberately (next row / list heading) — otherwise it drops to
          <code>&lt;body&gt;</code> and the reader goes silent.</li>
        <li><strong>Never positive <code>tabindex</code></strong> — it hijacks the natural
          order; use DOM order and <code>0</code>/<code>-1</code> only.</li>
      </ul>

      <h2>Keyboard patterns cheat sheet (WAI-ARIA APG)</h2>
      <table class="cmp">
        <tr><th>Widget</th><th>Expected keys</th></tr>
        <tr><td>Button</td><td>Enter and Space activate</td></tr>
        <tr><td>Dialog</td><td>Esc closes; Tab cycles inside (trap); focus returns to trigger</td></tr>
        <tr><td>Tabs</td><td>←/→ move between tabs, Tab leaves the tablist into the panel</td></tr>
        <tr><td>Menu</td><td>↑/↓ navigate, Enter selects, Esc closes, typeahead jumps</td></tr>
        <tr><td>Listbox</td><td>↑/↓ (+Shift for range), Home/End, typeahead</td></tr>
        <tr><td>Disclosure</td><td>Enter/Space toggle; <code>aria-expanded</code> reflects state</td></tr>
      </table>

      <h2>Contrast — the actual WCAG math, live</h2>
      <div class="demo">
        <p class="demo__title">Interactive — a real contrast checker (WCAG 2.x formula)</p>
        <div class="contrast-row">
          <label>text <input type="color" [value]="fg()" (input)="fg.set($any($event.target).value)" /></label>
          <label>background <input type="color" [value]="bg()" (input)="bg.set($any($event.target).value)" /></label>
          <span class="ratio">{{ ratio().toFixed(2) }} : 1</span>
        </div>
        <div class="sample-text" [style.color]="fg()" [style.background]="bg()">
          The quick brown fox — can you comfortably read this?
        </div>
        <div class="verdicts">
          <span class="verdict" [class.pass]="ratio() >= 4.5" [class.fail]="ratio() < 4.5">AA normal text ≥ 4.5 : {{ ratio() >= 4.5 ? 'pass' : 'fail' }}</span>
          <span class="verdict" [class.pass]="ratio() >= 3" [class.fail]="ratio() < 3">AA large text / UI ≥ 3.0 : {{ ratio() >= 3 ? 'pass' : 'fail' }}</span>
          <span class="verdict" [class.pass]="ratio() >= 7" [class.fail]="ratio() < 7">AAA normal text ≥ 7.0 : {{ ratio() >= 7 ? 'pass' : 'fail' }}</span>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Ratio = (L1 + 0.05) / (L2 + 0.05) over relative luminance. 4.5:1 for body text,
          3:1 for large text (≥ 24px / 18.66px bold) and UI components/focus indicators.
          This is the single most-failed WCAG criterion in audits.
        </p>
      </div>

      <h2>Testing workflow</h2>
      <ul>
        <li><strong>Keyboard-only pass</strong> — unplug the mouse: reach everything, see focus everywhere, no traps.</li>
        <li><strong>Automated</strong> — axe DevTools / Lighthouse catch ~30-40% of issues (labels, contrast, ARIA misuse). Useful floor, never the ceiling.</li>
        <li><strong>Screen reader</strong> — NVDA (Windows, free) or VoiceOver (macOS, built-in) on your critical flows.</li>
        <li><strong>Motion &amp; zoom</strong> — honor <code>prefers-reduced-motion</code>; make sure 200% zoom doesn't break layouts.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why must ARIA be bound with <code>[attr.aria-expanded]</code>, not <code>[aria-expanded]</code>?</summary>
        <div>Property binding writes DOM properties, and <code>aria-*</code> exist only as
        HTML attributes — there is no <code>ariaExpanded</code> property contract Angular
        can target. <code>attr.</code> tells Angular to call <code>setAttribute</code>.</div>
      </details>
      <details class="qa">
        <summary>What's wrong with <code>&lt;div (click)="save()"&gt;Save&lt;/div&gt;</code> — and the full fix?</summary>
        <div>Not focusable, not keyboard-activatable, announced as plain text. Fix:
        <code>tabindex="0"</code>, <code>role="button"</code>, keydown for Enter AND
        Space, plus disabled handling — or just use <code>&lt;button&gt;</code>.</div>
      </details>
      <details class="qa">
        <summary>A toast says "Saved". How do screen-reader users find out?</summary>
        <div>They don't, unless it's a live region: <code>aria-live="polite"</code> /
        <code>role="status"</code> on the toast container, or announce via the CDK's
        <code>LiveAnnouncer</code>. <code>role="alert"</code>/assertive only for errors.</div>
      </details>
      <details class="qa">
        <summary>What focus work does an SPA route change require?</summary>
        <div>The DOM changed but focus didn't — move it to the new content (heading with
        <code>tabindex="-1"</code>), keep a skip link, and make sure the document title
        updates so the reader announces where you landed.</div>
      </details>
      <details class="qa">
        <summary>Minimum contrast for body text? For icons/focus rings?</summary>
        <div>4.5:1 (AA) for normal text; 3:1 for large text and for non-text UI —
        component boundaries, icons, focus indicators (WCAG 1.4.11).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Native elements first — ARIA fills gaps, and only <code>[attr.aria-*]</code> binds it dynamically.</li>
        <li>States belong in ARIA (<code>aria-expanded</code>, <code>aria-invalid</code>); updates belong in live regions.</li>
        <li>CDK a11y = focus trap, focus monitor, live announcer, list key manager — don't hand-roll these.</li>
        <li>SPAs must manage focus on navigation, dialogs and deletions — the browser won't.</li>
        <li>Contrast: 4.5:1 body / 3:1 large &amp; UI — measured, not eyeballed.</li>
      </ul>

      <p><a routerLink="/animations">Next: Animations →</a></p>
    </article>
  `,
})
export class A11y {
  protected readonly open = signal(true);
  protected readonly clicks = signal(0);

  // --- form error demo ---
  protected readonly email = signal('');
  protected readonly emailError = signal('');
  submit() {
    const v = this.email().trim();
    this.emailError.set(
      v === '' ? 'Email is required.' : !v.includes('@') ? 'Enter a valid email address.' : '',
    );
  }

  // --- live region demo ---
  protected readonly status = signal('idle');
  private saveCount = 0;
  save() {
    this.saveCount++;
    this.status.set('saving…');
    setTimeout(() => this.status.set(`saved (${this.saveCount})`), 600);
  }

  // --- contrast checker ---
  protected readonly fg = signal('#6b6b76');
  protected readonly bg = signal('#fafafa');
  protected readonly ratio = computed(() => contrast(this.fg(), this.bg()));

  // --- code samples ---
  readonly ariaBindSample = `<!-- ✗ NG0303: can't bind 'aria-expanded' — not a known property -->
<button [aria-expanded]="open()">

<!-- ✓ attribute binding -->
<button [attr.aria-expanded]="open()" [attr.aria-label]="label()">

<!-- static values need no binding at all -->
<button aria-haspopup="menu">`;

  readonly formSample = `<label for="email">Email</label>
<input id="email" type="email"
  [attr.aria-invalid]="error() !== ''"
  aria-describedby="email-err" />

@if (error()) {
  <p id="email-err" role="alert">{{ error() }}</p>
}`;

  readonly cdkSample = `import { A11yModule, LiveAnnouncer, FocusMonitor } from '@angular/cdk/a11y';

<div cdkTrapFocus [cdkTrapFocusAutoCapture]="true"> …dialog content… </div>

// announce async outcomes to screen readers:
inject(LiveAnnouncer).announce('3 results found');           // polite
inject(LiveAnnouncer).announce('Connection lost', 'assertive');

// keyboard-vs-mouse focus styling:
inject(FocusMonitor).monitor(el).subscribe(origin => {
  // origin: 'keyboard' | 'mouse' | 'touch' | 'program' | null
});`;
}
