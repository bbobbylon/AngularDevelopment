import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, NoDumbQuestions, Scribble, Whiteboard } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
import { HighlightDirective } from './highlight-directive/highlight-directive';
import { BadgeDirective } from './badge-directive/badge-directive';
import { DemoTooltipDirective } from './demo-tooltip-directive/demo-tooltip-directive';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: Custom Attribute Directives — behaviour without a template.
 *
 * A directive is a component without a view: it attaches to an existing element
 * and changes how it looks or behaves. Covers signal inputs on directives, the
 * `host` metadata object (which replaces `@HostBinding` / `@HostListener`),
 * `ElementRef` against `Renderer2`, `exportAs`, and cleanup.
 *
 * Three directives are defined and demonstrated: {@link HighlightDirective} for
 * host bindings, {@link BadgeDirective} for `exportAs` and derived ARIA, and
 * {@link DemoTooltipDirective} for creating DOM — and disposing of it.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), copying the teaching order documented on
 * `ChangeDetection` — the reference implementation — and already followed by
 * its sibling `StructuralDirectives`:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "a component and
 *    a directive are declared almost identically — what's actually different?"
 *    and makes the reader commit to three guesses (does it render markup, can
 *    several stack on one element, does created DOM get cleaned up for free)
 *    before any mechanism is described. Two guesses resolve within a paragraph;
 *    the third is the trap the whole lesson is built around.
 * 2. **Analogy next, mechanism after.** The roof-rack-on-somebody-else's-car frame
 *    gives the reader somewhere to put `host` bindings and cleanup responsibility
 *    before those words show up as `host: {}` and `ngOnDestroy`.
 * 3. **Then the same idea in several modes** — a dialogue between the directive
 *    and its host element, four annotated `app-code-lab` walkthroughs of the
 *    three real directives this lesson demonstrates, a before/after
 *    `app-compare` of the decorator-era API against the modern one, and three
 *    live directives running against real markup — because the retention bar is
 *    redundancy across modes, not repetition in one.
 * 4. **Every non-trivial snippet is annotated line by line** via `app-code-lab`.
 *    Nothing here assumes the reader can already parse the snippet.
 *
 * This lesson already scored 9/9 on the retention audit before this migration;
 * the analogy, the orphaned-tooltip trap and the three live directives are the
 * same ones that earned that score, reshaped rather than replaced.
 *
 * @see shared/tooltip.directive — the app's own tooltip, built on this pattern.
 */
@Component({
  selector: 'app-lesson-attribute-directives',
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
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    NoDumbQuestions,
    Scribble,
    Whiteboard,
    HighlightDirective,
    BadgeDirective,
    DemoTooltipDirective,
  ],
  templateUrl: './attribute-directives.html',
  styleUrl: './attribute-directives.css',
})
export class AttributeDirectives {
  /** The Pipes & Directives track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Custom Pipes', id: 'custom-pipes' },
    { label: 'Attribute Directives' },
    { label: 'Structural Directives', id: 'structural-directives' },
  ];

  // -- Page-shape block: "There Are No Dumb Questions" --

  /**
   * Escalates from the misconception ("Angular cleans up whatever I create")
   * through where it actually bites, to the one-line fix. Carries the whole
   * explanation on its own, so every answer threads "you"/"your".
   */
  protected readonly cleanupQuestions: NdqItem[] = [
    {
      q: 'Does Angular clean up anything a directive creates, the same way it cleans up the directive itself?',
      a: "Only what you put **on the host**. Host bindings and host listeners are wired through Angular's own machinery, so it can undo them automatically the moment your directive's view goes away. Anything you create somewhere else is invisible to that cleanup — you own it, start to finish.",
    },
    {
      q: "So a `@HostListener('mouseenter')` and a `renderer.createElement()` call get cleaned up the same way?",
      a: 'No — and that\'s the whole trap. A host listener disappears with the element for free, no code required. A node you appended to `document.body` has no relationship to your directive\'s lifecycle at all. Nothing about it says "delete me when this directive dies" unless you write that yourself.',
    },
    {
      q: 'Where does this actually bite, at work?',
      a: "A tooltip directive on a row inside an `@if`. You hover it, the tooltip appears on `document.body`, and — before your mouse leaves — something flips the `@if` off. The row is destroyed, `mouseleave` never fires, and the tooltip node just sits there. On a fast-changing dashboard that's dozens of orphaned nodes an hour, each one still painted, forever.",
    },
    {
      q: "Isn't an orphaned node just a memory leak I can live with?",
      a: "It's worse than memory — it's **visible**. An orphaned tooltip still renders. Your users see stray floating text attached to nothing, sitting on top of whatever loads next, and the only fix they have is a full page reload.",
    },
    {
      q: 'What actually fixes it?',
      a: 'One method: `ngOnDestroy()`, calling the exact same cleanup your `mouseleave` handler already has. Anything created outside the host needs an explicit teardown path that runs no matter *how* the directive dies — a normal mouseleave, or the host vanishing out from under it mid-hover.',
    },
    {
      q: 'How do I know if MY directive needs this?',
      a: "Ask where the node you created actually lives. Appended **under the host element**? Angular already owns it — destroy the host and everything under it goes too. Appended **anywhere else** — `document.body`, a portal, a sibling container — you're on your own, and `ngOnDestroy` stops being optional.",
    },
    {
      q: 'Does `Renderer2` make this automatic somehow, since it abstracts the DOM?',
      a: "No — `Renderer2` is only a safer way to reach the DOM (it keeps working under server-side rendering, where `document` doesn't exist). It has no idea which nodes you intend to be temporary. It will happily create a node, and just as happily leave it there forever if nothing ever tells it otherwise.",
    },
  ];

  /** The self-test for the cleanup trap — the one no other gate can see coming. */
  protected readonly cleanupQuizOptions: QuizOption[] = [
    {
      text: "It disappears automatically — Angular removes anything a destroyed directive's instance created.",
      why: "That's the exact claim this block exists to break. Angular only knows how to clean up what it wired for you — host bindings, host listeners. A node appended to `document.body` was never part of that bookkeeping.",
    },
    {
      text: 'It stays on screen, orphaned on `document.body` forever — `mouseleave` never got the chance to fire, and nothing else ever calls `hide()`.',
      correct: true,
      why: 'Right. Destroying the host tears down the directive instance, but the tooltip `div` was appended to `document.body`, not the host — it has no parent-child relationship the framework can use to find and remove it. Without an `ngOnDestroy` that explicitly removes it, it is permanent.',
    },
    {
      text: "It throws, because the destroyed directive's `mouseleave` handler tries to run against a node that no longer exists.",
      why: 'Nothing tries to run at all. `mouseleave` simply never fires — the element it was listening on is gone, so the browser never dispatches the event. Silence, not an error, which is exactly why this bug is so easy to ship.',
    },
    {
      text: 'It stays until the next change-detection pass, which sweeps away anything left behind by a destroyed component.',
      why: 'Change detection has no concept of "anything left behind" — it walks bindings it knows about and compares values. A `document.body` node created imperatively is completely invisible to it, pass or no pass.',
    },
  ];

  /**
   * The exchange a `<p appHighlight>` binding actually sets off.
   *
   * Exists because the roof-rack analogy gives the reader a picture, but a
   * picture alone still leaves "who calls whom, and who cleans up what" to be
   * inferred. Staged as a conversation, the division of labour is explicit: the
   * directive owns the decision, the host element owns nothing but what is
   * written directly onto it — and destruction only travels one way.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'The template',
      says: 'I wrote `<p appHighlight>`. Compiler, make this real.',
    },
    {
      who: 'The directive',
      says: 'Matched. I have no view of my own — just this `host` object and two listeners.',
    },
    {
      who: 'The host element',
      says:
        "You want my `style.backgroundColor`? Fine — but you're writing directly onto me, " +
        'not appending a child.',
    },
    {
      who: 'The directive',
      says: '`mouseenter` fires, I set a signal, and your binding updates itself. I never touch you directly.',
    },
    {
      who: 'The host element',
      says: 'And when I get destroyed?',
    },
    {
      who: 'The directive',
      says:
        'Anything I put on you goes with you, automatically. Anything I put somewhere else is a ' +
        'problem I have to solve myself.',
    },
  ];

  /**
   * `HighlightDirective` in full — modern anatomy. Kept free of trailing `//`
   * comments; {@link highlightNotes} carries that job instead.
   */
  protected readonly highlightSample = `@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '[style.transition]': '"background-color .15s ease"',
    '[style.backgroundColor]': 'bg()',
  },
})
export class HighlightDirective {
  appHighlight = input<string>('var(--amber)');
  protected readonly bg = signal('');

  @HostListener('mouseenter') onEnter() {
    this.bg.set(this.appHighlight());
  }
  @HostListener('mouseleave') onLeave() {
    this.bg.set('');
  }
}`;

  /** Line-by-line walkthrough of {@link highlightSample}. */
  protected readonly highlightNotes: CodeNote[] = [
    {
      line: 2,
      text: "The square brackets make this an **attribute** selector: it matches any element carrying `appHighlight`. Drop them and you'd be matching a `<appHighlight>` *tag* — a component's job, not a directive's.",
    },
    {
      line: 4,
      text: "`host: {}` replaces every `@HostBinding`/`@HostListener` pair. Angular compiles it straight into this element's own update function at build time — nothing here is resolved by decorator metadata at runtime.",
    },
    {
      line: 5,
      text: 'Keys read like template syntax: `[property]` binds. The **value** is an expression string evaluated against this directive instance — which is why the double quotes are nested inside the single ones here. Drop them and Angular goes looking for a field literally named `background-color`.',
    },
    {
      line: 6,
      text: 'This one reads a signal. Any `host` binding that reads a signal re-runs automatically whenever that signal changes — no manual triggering, no `markForCheck()`.',
    },
    {
      line: 10,
      text: 'A **signal input** — replaces `@Input()`. The field\'s name *is* the attribute name, so `<div appHighlight="red">` feeds this directly. The argument is the fallback used when the attribute is present but empty.',
    },
    {
      line: 11,
      text: 'Internal state, `protected` — only this class and its own host binding above need it. Nothing outside should be able to set the colour directly.',
    },
    {
      line: 13,
      text: '`@HostListener` wires a DOM event on the **host** element to a method. Angular removes the listener automatically when the directive is destroyed — the exact thing a hand-written `addEventListener` does not do for you.',
    },
    {
      line: 14,
      text: 'Setting `bg()` is all it takes. The host binding on line 6 is already watching this signal, so the style updates with zero direct DOM manipulation anywhere in this class.',
    },
    {
      line: 17,
      text: "Reset to `''` rather than a colour, so the element falls back to whatever the stylesheet already says instead of being locked to a hardcoded default.",
    },
  ];

  /** The decorator-era equivalent of {@link highlightSample}, for the before/after comparison. */
  protected readonly oldHighlightSample = `@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  @Input() appHighlight = 'var(--amber)';

  @HostBinding('style.transition')
  transition = 'background-color .15s ease';

  @HostBinding('style.backgroundColor')
  bg = '';

  @HostListener('mouseenter')
  onEnter() { this.bg = this.appHighlight; }

  @HostListener('mouseleave')
  onLeave() { this.bg = ''; }
}`;

  /**
   * The life of a directive instance, from selector match to teardown. Laid out
   * because the two things that bite people — reading an input too early, and
   * leaking DOM created outside the host — are both really questions about
   * *when* in this sequence your code is running.
   */
  protected readonly lifecycle: FlowStep[] = [
    {
      label: 'The compiler matches the selector',
      detail: 'Any element carrying the attribute, anywhere the directive is imported',
      tone: 'accent',
    },
    {
      label: 'An instance is constructed',
      detail: '`inject()` works here. Inputs do **not** have values yet',
    },
    {
      label: 'Inputs are set',
      detail: 'First change detection pass, before `ngOnInit`',
    },
    {
      label: 'Host bindings fold into the element',
      detail: '`host: {}` is compiled into the element’s own update function',
    },
    {
      label: 'Host listeners are attached',
      detail: 'Angular registers them and will remove them for you',
    },
    {
      label: 'It lives as long as the element does',
      detail: 'Re-rendered by `@if`? New element, new directive instance',
    },
    {
      label: '`ngOnDestroy` — your only chance',
      detail: 'Host bindings clean themselves up. Anything you appended elsewhere does not',
      tone: 'good',
    },
  ];

  /** Choices for the input-timing check. */
  protected readonly timingOptions: QuizOption[] = [
    {
      text: 'It works — inputs are resolved before the constructor runs',
      why: 'Inputs are written onto the instance, so the instance has to exist first. There is no ordering in which the constructor could already see them.',
    },
    {
      text: 'It throws `NG0950` — the input has no value during construction',
      correct: true,
      why: 'Angular constructs the directive, *then* sets its inputs on the first change-detection pass. A required signal input asked for its value before that point throws `NG0950: Input is required but no value is available yet`, which is a genuinely good error — the old `@Input` equivalent silently handed you `undefined` and let the bug surface three files away. Move the work to `ngOnInit`, which runs after inputs are set, or into an `effect()`, which additionally re-runs whenever the input changes later.',
    },
    {
      text: 'It returns `undefined` and the directive silently does nothing',
      why: 'That is exactly what `@Input() text: string` used to do, and the reason `input.required()` was given a real error instead. Silence here is the old behaviour, not the current one.',
    },
    {
      text: 'It works, but only when the value is a static attribute rather than a binding',
      why: 'A tempting distinction, since static attributes are known at compile time. Angular still applies both through the same input-setting step, after construction.',
    },
  ];

  /**
   * Sample: injecting `ElementRef`/`Renderer2` and the methods that keep DOM
   * access portable. Trimmed of trailing comments; {@link elementRefNotes}
   * carries that job instead.
   */
  protected readonly elementRefSample = `private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
private readonly renderer = inject(Renderer2);

this.renderer.addClass(this.el.nativeElement, 'is-active');
this.renderer.setStyle(this.el.nativeElement, 'color', 'red');

const tip = this.renderer.createElement('span');
this.renderer.setProperty(tip, 'textContent', 'Hello');
this.renderer.appendChild(this.el.nativeElement, tip);`;

  /** Line-by-line walkthrough of {@link elementRefSample}. */
  protected readonly elementRefNotes: CodeNote[] = [
    {
      line: 1,
      text: '`ElementRef<HTMLElement>` wraps the host DOM node. The generic tells TypeScript the exact shape, so `.nativeElement.style` and `.getBoundingClientRect()` both type-check.',
    },
    {
      line: 2,
      text: '`Renderer2` — an abstraction over "whatever is drawing the page right now". Prefer it over `.nativeElement` directly: it keeps a directive working under server-side rendering and inside a web worker, where `document` does not exist at all.',
    },
    {
      line: 4,
      text: '`addClass` — the safe way to toggle a class. Same effect as `el.nativeElement.classList.add(...)`, routed through the renderer so it also works off the real DOM.',
    },
    {
      line: 5,
      text: 'An inline style, written the same abstracted way as the class above.',
    },
    {
      line: 7,
      text: '`createElement` makes a brand-new node without ever calling `document.createElement` directly.',
    },
    {
      line: 8,
      text: "`setProperty` with `'textContent'`, never `innerHTML` — text can never be parsed as markup, so a string handed in from outside cannot inject a script.",
    },
    {
      line: 9,
      text: '`appendChild` inserts the new node **under the host** here. Hold onto that detail — the real tooltip directive further down deliberately breaks this rule.',
    },
  ];

  /**
   * `BadgeDirective` in full — `exportAs`, a derived ARIA label, and the host
   * markup that consumes both. Trimmed of trailing comments; {@link badgeNotes}
   * carries that job instead.
   */
  protected readonly badgeSample = `@Directive({
  selector: '[appBadge]',
  exportAs: 'appBadge',
  host: {
    '[class.badge-active]': 'active()',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class BadgeDirective {
  label = input<string>('New');
  readonly active = signal(true);
  readonly ariaLabel = signal('');

  constructor() {
    effect(() => {
      this.ariaLabel.set(this.active() ? \`Badge: \${this.label()}\` : '');
    });
  }

  toggle(): void {
    this.active.update((v) => !v);
  }
}

// Template — grab the instance via #b="appBadge"
<span appBadge label="Beta" #b="appBadge"></span>
<button (click)="b.toggle()">Toggle badge</button>`;

  /** Line-by-line walkthrough of {@link badgeSample}. */
  protected readonly badgeNotes: CodeNote[] = [
    {
      line: 3,
      text: '`exportAs` gives the **template** a name for this directive instance. Set it here, grab it in the template with `#b="appBadge"`. Without it, `#b` alone would grab the host *element*, not the directive.',
    },
    {
      line: 5,
      text: "A host **class** binding — identical syntax to `HighlightDirective`'s style binding, just reading a boolean signal instead of a string.",
    },
    {
      line: 6,
      text: 'A host **attribute** binding — `[attr.x]`, not `[x]`. `aria-label` is not a DOM property, so it has to go through the `attr.` prefix rather than a plain property binding.',
    },
    {
      line: 11,
      text: 'The visible state. A plain `signal(true)`, no different from one you would write inside a component.',
    },
    {
      line: 12,
      text: 'A **second** signal, kept separate from `active` on purpose — so the accessible name can say something a sighted user does not need ("Badge: Beta") rather than merely mirroring the boolean.',
    },
    {
      line: 15,
      text: '`effect()` re-runs whenever a signal it reads changes. It reads both `active()` and `label()`, so either one changing recomputes the label with no manual wiring.',
    },
    {
      line: 21,
      text: '`.update()`, not `.set()` — the new value depends on the *old* one, which is exactly the case `update` exists for.',
    },
    {
      line: 26,
      text: '`#b="appBadge"` — thanks to `exportAs`, this template reference variable now points at the **directive instance**, not the `<span>`, so `b.toggle()` on the next line calls a real method.',
    },
  ];

  /**
   * `DemoTooltipDirective` in full, stripped of its own trailing comments —
   * {@link tooltipNotes} carries that job instead.
   */
  protected readonly tooltipSample = `@Directive({
  selector: '[appDemoTooltip]',
  standalone: true,
})
export class DemoTooltipDirective implements OnDestroy {
  text = input<string>('', { alias: 'appDemoTooltip' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private tip: HTMLElement | null = null;

  @HostListener('mouseenter') show(): void {
    if (!this.text()) return;
    this.tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(this.tip, 'app-tooltip');
    this.renderer.setProperty(this.tip, 'textContent', this.text());
    this.renderer.appendChild(document.body, this.tip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(this.tip, 'left', \`\${rect.left + rect.width / 2 + window.scrollX}px\`);
    this.renderer.setStyle(this.tip, 'top', \`\${rect.top - 36 + window.scrollY}px\`);
  }

  @HostListener('mouseleave') hide(): void {
    if (this.tip) {
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}`;

  /** Line-by-line walkthrough of {@link tooltipSample}. */
  protected readonly tooltipNotes: CodeNote[] = [
    {
      line: 6,
      text: '`alias` lets the **field** be called `text` (readable inside the class) while the **attribute** stays `appDemoTooltip` (what the template writes). Without it, the field itself would have to be named `appDemoTooltip` too.',
    },
    {
      line: 8,
      text: '`ElementRef<HTMLElement>` — the generic is what lets `.nativeElement.getBoundingClientRect()` on line 19 type-check.',
    },
    {
      line: 10,
      text: 'The handle to what was created. `null` means "no tooltip showing" — this one field is the *entire* cleanup story, so it has to stay accurate.',
    },
    {
      line: 13,
      text: 'A guard clause. Empty tooltip text would create an empty, pointless `<div>` — returning early is cheaper than creating one and immediately hiding it.',
    },
    {
      line: 16,
      text: "`setProperty` with `'textContent'`, never `innerHTML` — text can never be parsed as markup, so a tooltip string cannot inject a script.",
    },
    {
      line: 17,
      text: 'Appended to `document.body`, **not** to the host. Deliberate: nested inside the host, the tooltip would be clipped by any ancestor with `overflow: hidden` and would inherit its stacking context.',
    },
    {
      line: 19,
      text: "The **host's** bounding box, read fresh on every hover — so the tooltip tracks the button correctly even if the page scrolled or resized since the last time it was shown.",
    },
    {
      line: 25,
      text: 'Guarded by `if (this.tip)`, which makes `hide()` idempotent — calling it twice in a row does nothing the second time. That idempotence is exactly what lets `ngOnDestroy` call it blindly below.',
    },
    {
      line: 32,
      text: "**The line that matters.** Angular cleans up host listeners and host bindings for you automatically — but this tooltip lives on `document.body`, outside the directive's own view. Delete this line and navigating away mid-hover leaves the tooltip orphaned on screen forever.",
    },
  ];

  /** The orphaned-tooltip trap: the same directive, one line short. */
  protected readonly orphanSample = `@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  @HostListener('mouseenter') show() {
    this.tip = this.renderer.createElement('div');
    this.renderer.appendChild(document.body, this.tip);
  }

  @HostListener('mouseleave') hide() {
    this.renderer.removeChild(document.body, this.tip);
    this.tip = null;
  }
  // note: no ngOnDestroy
}

<!-- The host: -->
@if (showButton()) {
  <button appTooltip="Deletes everything">Delete</button>
}

// You hover the button. While the tooltip is up,
// something sets showButton() to false. Then what?`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'When should this be a directive rather than a component?',
      a: 'Ask whether you are adding markup or adding behaviour. If the answer involves rendering something with a shape of its own — a card, a dialog, a chart — that is a component. If it is "make an element that already exists do something extra" — highlight on hover, autofocus, confirm before click, track visibility — that is a directive. The strongest tell is the wrapper test: if turning it into a component would force you to wrap other people’s markup in an extra element, you wanted a directive.',
    },
    {
      q: 'Can I put several attribute directives on one element?',
      a: 'Yes, as many as you like — and this is the sharpest difference from structural directives, where the `*` allows exactly one. `<button appTooltip="Save" appHighlight appAnalytics="save-click">` is completely normal. The catch is collisions: if two of them bind `[style.backgroundColor]`, the result is whichever ran last, and nothing warns you. Directives that write to the same host property should be designed not to overlap.',
    },
    {
      q: 'Why bother with `Renderer2` when `nativeElement` is right there?',
      a: 'Because `nativeElement` is only a DOM node when there is a DOM. Under server-side rendering there is not one, and code that reaches for `document` or `.style` directly either crashes the render or silently produces different HTML than the browser would. `Renderer2` is an abstraction over "whatever is drawing right now". If your app will never be server-rendered you can get away without it; if you are unsure, use it, because retrofitting is far more work than starting with it.',
    },
    {
      q: 'Do the square brackets in the selector matter?',
      a: "They are the whole point. `selector: 'appHighlight'` matches an `<appHighlight>` **element**; `selector: '[appHighlight]'` matches any element with that **attribute**, which is what you want. You can also narrow it: `'button[appConfirm]'` matches only buttons, so misusing your directive on a `<div>` becomes a compile-time non-match rather than a runtime surprise.",
    },
    {
      q: 'How do I react when an input changes, without `ngOnChanges`?',
      a: 'Read it in an `effect()`, or derive from it with `computed()`. Both track the signal input automatically, so they re-run only when that specific input changes — rather than `ngOnChanges` firing for every input on the directive and handing you a bag of `SimpleChange` objects to sort through. If the reaction is purely visual, better still: put the expression straight in a `host` binding and let change detection handle it.',
    },
  ];
}
