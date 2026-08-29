import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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

/**
 * Lesson: accessibility in depth — semantics-first (with a live div-vs-button
 * keyboard test), why ARIA needs [attr.] binding, an accessible disclosure,
 * form errors that announce themselves, live regions, the CDK a11y toolkit,
 * the WAI-ARIA keyboard patterns table, and a real WCAG contrast-ratio
 * calculator implementing the spec math.
 */
@Component({
  selector: 'app-lesson-a11y',
  imports: [RouterLink],
  styleUrl: './a11y.css',
  templateUrl: './a11y.html',
})
export class A11y {
  /**
   * Whether the disclosure is open, for the `aria-expanded` demo.
   */
  protected readonly open = signal(true);
  /**
   * How many times the accessible control has been activated — including via
   * keyboard, which is the point of using a real `<button>`.
   */
  protected readonly clicks = signal(0);

  // --- form error demo ---
  /**
   * The email in the accessible-error demo.
   */
  protected readonly email = signal('');
  /**
   * The current error, or empty. Also announced, since a message a screen reader
   * never reaches is not an error message.
   */
  protected readonly emailError = signal('');
  /**
   * Validates the email and sets the error.
   */
  submit() {
    const v = this.email().trim();
    this.emailError.set(
      v === '' ? 'Email is required.' : !v.includes('@') ? 'Enter a valid email address.' : '',
    );
  }

  // --- live region demo ---
  /**
   * The live-region status. Changes here are announced.
   */
  protected readonly status = signal('idle');
  /**
   * How many saves have run, so each announcement differs.
   *
   * Identical consecutive text in a live region may not be re-announced at all —
   * varying it is how you guarantee the user hears the second save.
   */
  private saveCount = 0;
  /**
   * Runs a fake save, announcing each state change through the live region.
   */
  save() {
    this.saveCount++;
    this.status.set('saving…');
    setTimeout(() => this.status.set(`saved (${this.saveCount})`), 600);
  }

  // --- contrast checker ---
  /**
   * Foreground colour in the contrast checker.
   */
  protected readonly fg = signal('#6b6b76');
  /**
   * Background colour in the contrast checker.
   */
  protected readonly bg = signal('#fafafa');
  /**
   * The contrast ratio. WCAG AA wants 4.5:1 for body text, 3:1 for large text.
   */
  protected readonly ratio = computed(() => contrast(this.fg(), this.bg()));

  // --- code samples ---
  /**
   * Sample: why `[aria-expanded]` fails and `[attr.aria-expanded]` works.
   *
   * ARIA attributes are not DOM properties, so the property-binding form raises
   * NG0303. Attribute binding is the correct one, and this is the single commonest
   * ARIA mistake in Angular templates.
   */
  readonly ariaBindSample = `<!-- ✗ NG0303: can't bind 'aria-expanded' — not a known property -->
<button [aria-expanded]="open()">

<!-- ✓ attribute binding -->
<button [attr.aria-expanded]="open()" [attr.aria-label]="label()">

<!-- static values need no binding at all -->
<button aria-haspopup="menu">`;

  /**
   * Sample: an accessible form field — a real `<label for>`, `aria-invalid`,
   * `aria-describedby`, and the error in a live region.
   */
  readonly formSample = `<label for="email">Email</label>
<input id="email" type="email"
  [attr.aria-invalid]="error() !== ''"
  aria-describedby="email-err" />

@if (error()) {
  <p id="email-err" role="alert">{{ error() }}</p>
}`;

  /**
   * Sample: the CDK a11y utilities — `cdkTrapFocus`, `LiveAnnouncer`,
   * `FocusMonitor` — which exist so nobody has to hand-roll a focus trap.
   */
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
