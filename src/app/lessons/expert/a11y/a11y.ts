import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

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
 * Lesson: accessibility in depth — why this is the one category of bug in the
 * whole curriculum that never throws, and how to catch it anyway.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`; see
 * `expert/change-detection` for the reference implementation and the teaching
 * order it is built around). The order here follows the same discipline —
 * pose the problem, give it a mental model, then work outward through
 * mechanism — with one addition specific to this subject:
 *
 * 1. **The silent-failure framing, up front.** Every other lesson in this app
 *    teaches a mistake that Angular eventually tells you about — NG0100,
 *    NG0303, a stale snapshot. This is the one lesson about mistakes that
 *    produce no error, no failed build and no visual difference on the
 *    author's own screen, which is why it opens on that asymmetry rather than
 *    on ARIA syntax.
 * 2. **The phone-call analogy**, deepened from the existing "imagine hearing
 *    it" aside in the forms section rather than replaced with an unrelated
 *    one: a screen reader receives a document the way a listener receives a
 *    phone call — linearly, one utterance at a time, with no way to glance
 *    ahead. Semantics are what let you say "heading" or "button" out loud;
 *    ARIA state is you mentioning what changed; a live region is you
 *    speaking up before you're asked.
 * 3. **Two ask-before-telling traps** via `app-predict`, both genuine silent
 *    failures: a div styled as a button that is invisible to keyboard and
 *    screen-reader users despite working perfectly for a mouse, and the very
 *    different screen-reader outcomes of an empty `alt` versus a missing one.
 * 4. **Two visuals the prose can't say in one line**: a 2×2 table crossing
 *    "painted on screen" against "present in the accessibility tree", which
 *    is the actual shape of nearly every confusing case in this subject
 *    (`aria-hidden`, `display: none`, the "visually hidden" CSS trick); and,
 *    directly under it, a DOM-tree-vs-accessibility-tree diagram showing the
 *    edge the table can't — that `aria-hidden` is inherited, so a perfectly
 *    accessible button nested inside a hidden wrapper is pruned along with
 *    it, not just the element the attribute is actually on.
 * 5. **Every snippet annotated line by line** via `app-code-lab` — the
 *    `[attr.aria-*]` binding fix, the accessible form fragment, and the CDK
 *    `a11y` toolkit.
 *
 * ## Dogfooding note — this lesson teaches accessibility, so its own "wrong
 * way" example has to be a genuine one, not merely one that happens to pass
 * axe-core
 *
 * The keyboard-invisible box in the semantics demo below (`.fake-btn`) is a
 * REAL, clickable element — clicking it with a mouse increments the same
 * counter the real button does, which is the entire point: it has to look
 * and behave identically for a mouse user for the trap to be honest. What
 * keeps it from being an accessibility violation *in this app* rather than
 * merely an example *of* one is that it carries no `role`, no `tabindex` and
 * no keyboard handler — so it is genuinely, not just nominally, unreachable
 * from the keyboard and unannounced to a screen reader, exactly as the
 * lesson claims. Nothing about it is a functioning control for the
 * population it excludes; it is only ever a functioning control for the
 * population the demo is warning about. See `a11y.css` for the same note
 * kept next to the CSS that must not change that.
 */
@Component({
  selector: 'app-lesson-a11y',
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security', id: 'security' },
    { label: 'i18n', id: 'i18n' },
    { label: 'Accessibility' },
    { label: 'Animations', id: 'animations' },
    { label: 'View Transitions', id: 'view-transitions' },
  ];

  /**
   * The accessibility tree, describing itself, once with a fake button and
   * once with `aria-hidden` — foreshadowing the semantics demo and the tree
   * diagram that follow this section, staged as a conversation instead of a
   * paragraph about both at once.
   */
  protected readonly treeTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I just rendered a div styled exactly like a button, right next to a real one. They look identical. Go ahead — describe the page for me.',
    },
    {
      who: 'The accessibility tree',
      says: 'The real button? Easy: role button, name “Save”, focusable, ready for a click or a keypress. Your div? I don’t see a control there at all — just plain text, and it isn’t even in my focus order.',
    },
    {
      who: 'You',
      says: "But it's styled the same, and it has a click handler and everything.",
    },
    {
      who: 'The accessibility tree',
      says: "Styling is paint — I don't read paint. I read semantics: tags, roles, states. No role, no keyboard behaviour, nothing here for me to hand off to a screen reader or a Tab key.",
    },
    {
      who: 'You',
      says: 'Fine. What if I mark that same real button with `aria-hidden` instead?',
    },
    {
      who: 'The accessibility tree',
      says: "Then I skip it completely, even though it's sitting right there on the screen, glowing under your cursor. Painted and in my tree are two separate questions — you have to answer both, not just one.",
    },
  ];

  // --- code samples ---
  /**
   * Sample: why `[aria-expanded]` fails and `[attr.aria-expanded]` works.
   *
   * ARIA attributes are not DOM properties, so the property-binding form raises
   * NG0303. Attribute binding is the correct one, and this is the single commonest
   * ARIA mistake in Angular templates.
   */
  protected readonly ariaBindSample = `<!-- ✗ NG0303: can't bind 'aria-expanded' — not a known property -->
<button [aria-expanded]="open()">

<!-- ✓ attribute binding -->
<button [attr.aria-expanded]="open()" [attr.aria-label]="label()">

<!-- static values need no binding at all -->
<button aria-haspopup="menu">`;

  /** Line-by-line walkthrough of {@link ariaBindSample}. */
  protected readonly ariaBindNotes: CodeNote[] = [
    {
      line: 1,
      text: '`NG0303` is Angular’s runtime error for a binding target it cannot find. It fires the moment this component compiles, before the page ever renders — so this is one of the rare accessibility mistakes that actually does throw.',
    },
    {
      line: 2,
      text: 'Property binding compiles to `element.ariaExpanded = value` — an ordinary JavaScript property write. There has never been an `ariaExpanded` property on a `<button>` for that write to land on, so Angular throws instead of silently doing nothing.',
    },
    {
      line: 5,
      text: "`attr.` tells Angular to call `element.setAttribute('aria-expanded', value)` directly, bypassing the property lookup entirely. Every dynamic ARIA state or label anywhere in this app is bound this exact way.",
    },
    {
      line: 8,
      text: 'A value that never changes needs no binding syntax at all — plain HTML, evaluated once. Reach for `[attr.aria-*]` only once the value has to change at runtime, the way `open()` does above.',
    },
  ];

  /**
   * Sample: an accessible form field — a real `<label for>`, `aria-invalid`,
   * `aria-describedby`, and the error in a live region.
   */
  protected readonly formSample = `<label for="email">Email</label>
<input id="email" type="email"
  [attr.aria-invalid]="error() !== ''"
  aria-describedby="email-err" />

@if (error()) {
  <p id="email-err" role="alert">{{ error() }}</p>
}`;

  /** Line-by-line walkthrough of {@link formSample}. */
  protected readonly formNotes: CodeNote[] = [
    {
      line: 1,
      text: '`for` ties this label to the input sharing the same `id`. Click the text and focus jumps to the field — and a screen reader announces "Email" the moment that focus lands, not a moment later.',
    },
    {
      line: 2,
      text: '`type="email"` isn’t just validation sugar: it also tells a mobile screen reader which on-screen keyboard to offer, and a desktop one which kind of field it just landed on.',
    },
    {
      line: 3,
      text: 'Bound as an **attribute**, for the same reason the sample above needed `attr.` — there is no `ariaInvalid` property to target. Flip this to `true` and the field announces as an invalid entry the instant validation fails, with no extra prose required.',
    },
    {
      line: 4,
      text: '`aria-describedby` points at another element’s `id` by reference — it can be static here because the element it points to always exists, even before there is an error to show. A screen reader reads the label, the value, **and** whatever this id resolves to.',
    },
    {
      line: 6,
      text: '`@if` doesn’t hide this block when `error()` is falsy — it removes it from the DOM entirely, the same as never having written it. That makes it functionally identical to the bottom-right box of the tree diagram further down this page: gone from the page, gone from the tree, nothing to prune.',
    },
    {
      line: 7,
      text: '`role="alert"` is an **implicit live region** — assertive, meaning it interrupts. The moment this `<p>` exists in the DOM, its text is announced immediately, with no focus change and no `aria-live` attribute needed.',
    },
  ];

  /**
   * Sample: a live region created fresh, already holding its text, the moment
   * a toast appears — for {@link Compare}'s left panel.
   */
  protected readonly liveRegionWrongSample = `@if (toastOpen()) {
  <div aria-live="polite" aria-atomic="true">
    {{ toastMessage() }}
  </div>
}`;

  /**
   * Sample: the same region, always present, with only its text swapped —
   * for {@link Compare}'s right panel.
   */
  protected readonly liveRegionRightSample = `<div aria-live="polite" aria-atomic="true">
  {{ toastMessage() }}
</div>
<!-- toastMessage() starts as '' — this div is ALWAYS in the DOM -->`;

  /**
   * Sample: the CDK a11y utilities — `cdkTrapFocus`, `LiveAnnouncer`,
   * `FocusMonitor` — which exist so nobody has to hand-roll a focus trap.
   */
  protected readonly cdkSample = `import { A11yModule, LiveAnnouncer, FocusMonitor } from '@angular/cdk/a11y';

<div cdkTrapFocus [cdkTrapFocusAutoCapture]="true"> …dialog content… </div>

// announce async outcomes to screen readers:
inject(LiveAnnouncer).announce('3 results found');           // polite
inject(LiveAnnouncer).announce('Connection lost', 'assertive');

// keyboard-vs-mouse focus styling:
inject(FocusMonitor).monitor(el).subscribe(origin => {
  // origin: 'keyboard' | 'mouse' | 'touch' | 'program' | null
});`;

  /** Line-by-line walkthrough of {@link cdkSample}. */
  protected readonly cdkNotes: CodeNote[] = [
    {
      line: 1,
      text: '`A11yModule` exports the directives (`cdkTrapFocus`, `cdkAriaLive`…); `LiveAnnouncer` and `FocusMonitor` are plain injectable services and need no module import at all.',
    },
    {
      line: 3,
      text: '`cdkTrapFocus` keeps Tab cycling inside this element while it’s present — the fix for the classic "Tab walked me straight through the dialog into the page behind it" bug. `cdkTrapFocusAutoCapture` also moves focus **in** the moment the element appears.',
    },
    {
      line: 6,
      text: "`announce()` with no second argument defaults to `'polite'` — it waits for a pause in whatever the screen reader is already saying before it speaks.",
    },
    {
      line: 7,
      text: "`'assertive'` interrupts immediately. Reserve it for things the user must hear right now — a dropped connection, a failed save — never for routine confirmations, which is exactly what the wording tests below the CDK table are checking.",
    },
    {
      line: 10,
      text: '`FocusMonitor.monitor()` returns an Observable of **how** focus arrived: keyboard, mouse, touch, or set programmatically. It’s how a component can show a strong focus ring for keyboard users only, without punishing a mouse click with an outline nobody asked for.',
    },
  ];

  // --- predict: the invisible "button" ---
  /** Sample for the keyboard-invisibility predict: the exact markup the live demo below runs. */
  protected readonly divButtonPredictCode = `<div (click)="clicks.set(clicks() + 1)">div + (click)</div>
<button (click)="clicks.set(clicks() + 1)">real button</button>`;

  /**
   * Predict prompt/answer text, kept as `.ts` fields rather than inline HTML
   * attributes so the literal `<div>`/`<button>` tags can be shown without
   * quote-escaping gymnastics in the template.
   */
  protected readonly divButtonPredictPrompt =
    "Below are the two elements the live demo further down actually renders: a `<div>` with a click handler, and a real `<button>`, styled to look identical. Before you scroll — press Tab in your head. How many of them can you reach, and what does a screen reader call the one you can't?";
  protected readonly divButtonPredictAnswer =
    "Exactly one — the real button. Tab order is built only from a short list of naturally-focusable elements (links with `href`, form controls, `<button>`, anything with an explicit `tabindex`) plus whatever `tabindex` you add yourself, and a plain `<div>` isn't on that list no matter what listener you attach to it. A screen reader agrees: with no `role`, it announces the div as plain text, not as a control — so a keyboard user cannot even discover it exists, let alone activate it.";

  // --- predict: alt="" versus a missing alt ---
  /** Sample for the alt-text predict: two images, two different fallback behaviours. */
  protected readonly imgAltPredictCode = `<img src="hero-bg.png" alt="">
<img src="team-photo.png">`;

  /** Predict prompt/answer for the `alt=""`-versus-missing-`alt` trap, kept as `.ts` fields for the same reason. */
  protected readonly imgAltPredictPrompt =
    'Two images, back to back: one decorative background flourish with `alt` set to an empty value, and one photo with the `alt` attribute left off completely. Which one does a screen reader actually announce, and what does it say?';
  protected readonly imgAltPredictAnswer =
    'The empty `alt` is announced as nothing at all — silently skipped, exactly as intended for a flourish that carries no information. The missing `alt` does the opposite of nothing: most screen readers fall back to reading the file name, so a photo with no caption gets announced as “team hyphen photo dot p n g.” An empty `alt` is a deliberate decision that says “skip this”; a missing one is an undecided attribute the browser guesses badly on your behalf.';

  /**
   * The self-test on the exam-classic ARIA binding mistake.
   *
   * The distractors are the three ways this project has actually seen learners
   * misdiagnose `NG0303` — a type problem, a "dynamic ARIA is impossible"
   * overcorrection, and a role requirement that doesn't exist. Each `why`
   * names the specific wrong belief rather than only repeating the fix.
   */
  protected readonly ariaQuizOptions: QuizOption[] = [
    {
      text: '`aria-expanded` needs a string, not a boolean — coerce it with a template literal and the property binding will work.',
      why: "The type was never the problem — Angular would happily stringify a boolean onto an attribute. NG0303 is about the binding **target**, not the value: property binding needs a matching DOM property, and `ariaExpanded` isn't one.",
    },
    {
      text: "There's no `ariaExpanded` DOM property for `[x]` to write to — switch to `[attr.aria-expanded]`, which sets the HTML attribute directly.",
      correct: true,
      why: "Exactly. `aria-*` attributes were never mirrored onto matching JavaScript properties the way `class` or `id` are, so Angular's property-binding syntax has nothing to target. `attr.` sidesteps the property lookup and calls `setAttribute()` instead.",
    },
    {
      text: "Angular can't bind ARIA states dynamically at all — `aria-expanded` has to be a static attribute, set once.",
      why: 'It can, and a changing ARIA state is the normal case — a disclosure, a menu and a tab list all need `aria-expanded` or `aria-selected` to update at runtime. The fix is the right binding syntax, not giving up on dynamic values.',
    },
    {
      text: 'The button needs `role="button"` added before any `aria-*` attribute is allowed to bind to it.',
      why: '`<button>` already carries an implicit `button` role, and role has nothing to do with why the binding throws. `NG0303` fires during compilation, before Angular has looked at what element — or what role — it’s even attached to.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is `aria-hidden="true"` the same thing as `display: none`?',
      a: 'No — mixing them up is the most common mistake in the diagram further up this page. `display: none` removes an element from layout **and** the accessibility tree, so nobody sees or hears it. `aria-hidden="true"` only removes it from the tree — the element stays fully visible on screen. Put it on a decorative icon and a sighted user still sees it while a screen reader skips straight past, which is exactly the pairing you want for a purely visual flourish.',
    },
    {
      q: 'A toast says “Saved”. How do screen-reader users find out?',
      a: 'They don\'t, unless the toast container is a live region — `aria-live="polite"` or `role="status"` — or you announce it explicitly through the CDK\'s `LiveAnnouncer`. A toast that only appears is exactly as invisible to a screen reader as the div in the semantics demo above: present on screen, absent from the experience.',
    },
    {
      q: 'What focus work does an SPA route change actually require?',
      a: 'The DOM changed but focus didn’t move — an SPA never gets the reset-to-the-top-of-the-page behaviour a full browser navigation gives you for free. Move focus to the new view’s heading (`tabindex="-1"` plus `.focus()`), keep a skip-to-content link for keyboard users who land mid-page, and update the document title so a screen reader announces where the user just arrived.',
    },
    {
      q: "What's the actual minimum fix for a div with a click handler, if I can't swap in a real button right now?",
      a: 'Four separate additions, and skipping any one of them leaves a gap: `tabindex="0"` so Tab can reach it, `role="button"` so it’s announced as a control, a keydown handler that fires on **both** Enter and Space (a real button responds to both, and a `role` alone doesn’t wire that up for you), and your own disabled and hover states, since none of that comes free either. Compare that list against swapping in `<button>` for zero extra code, and "just use the native element" stops sounding like a slogan.',
    },
    {
      q: 'Minimum contrast for body text? For icons and focus rings?',
      a: 'Four-point-five to one for normal text under WCAG AA; three to one for large text (24px or larger, or bold at 18.66px) and for non-text UI — component boundaries, icons, focus indicators (WCAG 1.4.11). The checker further down this page computes the real ratio rather than an eyeballed guess.',
    },
  ];
}
