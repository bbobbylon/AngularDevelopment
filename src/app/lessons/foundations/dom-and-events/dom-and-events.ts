import { Component, ElementRef, afterNextRender, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One layer's record of a bubbling (or capturing) click: which layer, and where
 * in the order it fired.
 */
interface BubbleHit {
  layer: string;
  order: number;
}

/**
 * Lesson: The DOM & Events — the page as a live object tree (explorable), the
 * manual toolkit for reading and changing it (including the `textContent`
 * versus `innerHTML` injection vector), attribute versus property, the full
 * three-phase event journey (capture, target, bubble — not bubbling alone),
 * and the manual-sync pain that motivates Angular's data binding.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`; see
 * `expert/change-detection` for the reference implementation and the teaching
 * order it is built around: pose the problem, give it a mental model, then
 * work outward through mechanism in several modes).
 *
 * ## Coverage-sweep findings folded in (docs/COVERAGE-SWEEP.md, `foundations/dom-and-events`)
 *
 * All four are new material in this pass, not a re-skin of the old lesson:
 *
 * 1. **Capture, not just bubble.** The old lesson taught propagation as a
 *    one-way trip. The bubbling demo now has a real capture-phase toggle
 *    (native `addEventListener(..., { capture: true })` under the hood, since
 *    Angular's own `(click)` syntax has no way to express it), a `Layers`
 *    diagram of the two legs, and a table distinguishing `stopPropagation`,
 *    `stopImmediatePropagation` and `preventDefault`.
 * 2. **`innerHTML` and the injection vector.** The old toolkit block never
 *    mentioned it. Now it sits next to `textContent` with the difference
 *    annotated, a `Compare` panel, and a live two-button demo that writes the
 *    same attacker-shaped string through both — one inert, one that really
 *    executes (via `nativeElement.innerHTML`, deliberately outside any Angular
 *    binding, so nothing here is sanitized).
 * 3. **Attribute versus property**, previously claimed by the component
 *    docstring and never shown. A live probe reads `.value` against
 *    `getAttribute('value')` on the same input as you type, plus the
 *    `disabled="false"` trap proven with two real buttons.
 * 4. **Non-bubbling events.** `focus`/`blur`/`load`/`error` don't bubble;
 *    `focusin`/`focusout` do. A small live demo makes the gap failure visible
 *    rather than asserted, right after the delegation paragraph that depends
 *    on bubbling working.
 */
@Component({
  selector: 'app-lesson-dom-and-events',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './dom-and-events.html',
  styleUrl: './dom-and-events.css',
})
export class DomAndEvents {
  // ── DOM tree explorer ───────────────────────────────────────────────────

  /** Explorable DOM tree — one entry per node with its depth and description. */
  protected readonly nodes = [
    {
      id: 'body',
      tag: '<body>',
      depth: 0,
      info: 'The root of everything visible on the page. Parent of header and main — document.body always points straight at this node.',
    },
    {
      id: 'header',
      tag: '<header>',
      depth: 1,
      info: 'A child of body, sibling of main, parent of the h1. "Sibling" means same parent, same depth — neither one is inside the other.',
    },
    {
      id: 'h1',
      tag: '<h1>',
      depth: 2,
      info: 'A leaf node — no element children of its own. Its "My App" is a separate TEXT node, one level further in; write to h1.textContent and the heading changes on screen instantly.',
    },
    {
      id: 'main',
      tag: '<main>',
      depth: 1,
      info: "A child of body with two children of its own: the p and the button. Same depth as header, and header's sibling.",
    },
    {
      id: 'p',
      tag: '<p>',
      depth: 2,
      info: 'Sibling of the button — same parent (main), same depth. Order in the tree matches order in the source.',
    },
    {
      id: 'button',
      tag: '<button>',
      depth: 2,
      info: 'The interactive one: it has properties like disabled, and events like click fire on it first, before travelling anywhere else in the tree.',
    },
  ];
  /** Which node is selected in the DOM-tree explorer. */
  protected readonly selected = signal('body');
  /**
   * The selected node. The non-null assertion is safe because the selection
   * only ever comes from the node list.
   */
  protected readonly selectedNode = computed(() =>
    this.nodes.find((n) => n.id === this.selected())!,
  );

  /** Sample: the same tree, as source — what the explorer above is exploring. */
  protected readonly treeSample = `<body>
  <header>
    <h1>My App</h1>
  </header>
  <main>
    <p>Welcome!</p>
    <button>Click</button>
  </main>
</body>`;

  /** Line-by-line walkthrough of {@link treeSample}. */
  protected readonly treeNotes: CodeNote[] = [
    {
      line: 1,
      text: '`<body>` becomes the root of what you can see. Its own node is the top of the tree, and `document.body` in JavaScript always points straight at it.',
    },
    {
      line: 2,
      text: '`<header>` sits one level inside `<body>` in the source, which is the entire rule for nesting: it becomes a **child** of body, and body becomes its **parent**.',
    },
    {
      line: 3,
      text: '`<h1>` is a **leaf** — no element children of its own. `My App` is not a string sitting on the tag; it is a separate **text node**, one level further in, which is why `h1.textContent` reads and writes it directly.',
    },
    {
      line: 5,
      text: '`<main>` is at the same depth as `<header>` and shares the same parent (`body`) — that makes them **siblings**. Neither one is inside the other.',
    },
    {
      line: 6,
      text: "`<p>` is one level inside `<main>`, making it main's child.",
    },
    {
      line: 7,
      text: '`<button>` — same depth as `<p>`, same parent, so button and p are siblings too. This is the exact node a `click` listener attaches to a few sections down.',
    },
  ];

  // ── The manual toolkit ──────────────────────────────────────────────────

  /** Sample: finding and changing nodes with the raw DOM API. */
  protected readonly toolkitSample = `const btn = document.querySelector('button');       // first match
const items = document.querySelectorAll('li.item'); // ALL matches

btn.textContent = 'Save';       // swap the TEXT — always literal
btn.innerHTML = '<b>Save</b>';  // swap the MARKUP — parsed as real HTML
btn.disabled = true;            // set a boolean PROPERTY
btn.classList.add('primary');   // add a CSS class
btn.remove();                   // delete the node — gone from the tree AND the screen

const p = document.createElement('p'); // exists only in memory so far…
p.textContent = 'Saved!';
document.body.append(p);               // …now it's in the tree → now it's on screen`;

  /** Line-by-line walkthrough of {@link toolkitSample}. */
  protected readonly toolkitNotes: CodeNote[] = [
    {
      line: 1,
      text: '`document.querySelector(css)` takes a CSS selector — the exact syntax you already style with — and hands back the **first** matching element, or `null` if nothing matches.',
    },
    {
      line: 2,
      text: '`querySelectorAll` takes the same syntax but returns **every** match, as a `NodeList` — array-like, but without `map`/`filter`/`find` unless you spread it into a real array first.',
    },
    {
      line: 4,
      text: '`.textContent` replaces whatever is inside the node with **plain text**. Put `<b>` in this string and the screen shows the literal characters `<b>` — nothing here is ever parsed as markup.',
    },
    {
      line: 5,
      text: '`.innerHTML` replaces the inside with **parsed markup**. The same `<b>` here becomes a real, live `<b>` element. Powerful, and — two sections down — dangerous.',
    },
    {
      line: 6,
      text: '`.disabled` is a live **property** on the element object, not a string sitting in the markup. The next section is entirely about the gap between this and the HTML attribute of the same name.',
    },
    {
      line: 7,
      text: "`.classList` is a small built-in set of the element's CSS classes — `.add()`, `.remove()`, `.toggle()`, `.contains()` — so you rarely need to hand-edit the whole `class` string.",
    },
    {
      line: 8,
      text: '`.remove()` deletes the node from the tree. Since on-screen literally means *attached to the tree*, that is the whole mechanism — there is no separate "hide it" step.',
    },
    {
      line: 10,
      text: '`createElement` builds a node that exists **only in memory** — it has no parent yet, so nothing about it is on screen. This is the detached half of the two-step insert.',
    },
    {
      line: 12,
      text: '`document.body.append(p)` is the second step: attach the node somewhere in the live tree. The instant this line runs, the paragraph is on screen — not one line before.',
    },
  ];

  /** Sample: the same string set as text — always inert. */
  protected readonly textLiteralSample = `el.textContent = '<b>hi</b>';

// the node now contains eight literal
// characters: <b>hi</b> — shown AS TEXT`;

  /** Sample: the same string set as markup — parsed, and therefore live. */
  protected readonly htmlParsedSample = `el.innerHTML = '<b>hi</b>';

// the browser's HTML parser runs on the
// string — a REAL <b> element is created: hi`;

  /**
   * The XSS demo's payload: an `img` whose `onerror` fires the instant its
   * (deliberately invalid) `src` fails to load.
   *
   * Shaped exactly like a real attack — an `onerror` handler smuggled onto an
   * image is one of the most common script-injection vectors, because it needs
   * no `<script>` tag at all — but it mutates the DOM visibly instead of
   * popping a blocking `alert()`, so it is safe to actually execute on a live
   * page. Same technique as `expert/security`'s own live XSS lab.
   */
  protected readonly xssPayload = `<img src="x" alt="" onerror="this.insertAdjacentHTML('afterend','<strong style=color:#a4432c>&larr; that just ran real JavaScript, not a screenshot</strong>')">`;

  /** Where the "set via textContent" half of the XSS demo writes. */
  private readonly xssTextSink = viewChild<ElementRef<HTMLDivElement>>('xssTextSink');
  /** Where the "set via innerHTML" half of the XSS demo writes. */
  private readonly xssHtmlSink = viewChild<ElementRef<HTMLDivElement>>('xssHtmlSink');
  /** Whether the innerHTML half has been run — drives the demo's note text. */
  protected readonly xssHtmlRan = signal(false);

  /** Writes {@link xssPayload} into the left panel as literal text. Always inert. */
  protected runXssText(): void {
    const el = this.xssTextSink()?.nativeElement;
    if (el) el.textContent = this.xssPayload;
  }

  /**
   * Writes {@link xssPayload} into the right panel via raw `innerHTML` —
   * `nativeElement`, not an Angular `[innerHTML]` binding, so there is no
   * `DomSanitizer` in the way and the `onerror` genuinely fires.
   */
  protected runXssHtml(): void {
    const el = this.xssHtmlSink()?.nativeElement;
    if (!el) return;
    el.innerHTML = this.xssPayload;
    this.xssHtmlRan.set(true);
  }

  /** Clears both panels so the demo can be run again. */
  protected resetXssDemo(): void {
    const textEl = this.xssTextSink()?.nativeElement;
    const htmlEl = this.xssHtmlSink()?.nativeElement;
    if (textEl) textEl.textContent = '';
    if (htmlEl) htmlEl.innerHTML = '';
    this.xssHtmlRan.set(false);
  }

  // ── Attribute versus property ───────────────────────────────────────────

  /** Sample: reading and writing the same "value" two different ways. */
  protected readonly valueVsAttrSample = `const input = document.querySelector('input');

input.value;                       // 'seed' — straight after the page loads
input.value = 'typed by hand';     // changes the LIVE property
input.value;                       // 'typed by hand'

input.getAttribute('value');       // still 'seed' — frozen from the HTML
input.setAttribute('value', 'x');  // only THIS line touches the attribute`;

  /** Line-by-line walkthrough of {@link valueVsAttrSample}. */
  protected readonly valueVsAttrNotes: CodeNote[] = [
    {
      line: 3,
      text: '`.value` is a **property** — the live current state of the input, kept up to date by the browser on every keystroke. Right after load it matches what the HTML said.',
    },
    {
      line: 4,
      text: 'Assigning to `.value` changes that live state — exactly what happens automatically whenever a person types into the box.',
    },
    {
      line: 5,
      text: 'So reading `.value` again shows the new text. This is the number a form actually submits.',
    },
    {
      line: 7,
      text: "`getAttribute('value')` reads the **HTML attribute** instead — the text that was literally written in the markup (or set via `setAttribute`). Typing in the box, and even assigning `.value` from code, never touches this.",
    },
    {
      line: 8,
      text: "The one operation that **does** change what `getAttribute('value')` returns. Attribute and property are two separate pieces of state that merely start out agreeing.",
    },
  ];

  /** Clicks on the `disabled="false"` button — should stay at 0 forever. */
  protected readonly attrDisabledClicks = signal(0);
  /** Clicks on the `[disabled]="false"` button — should climb normally. */
  protected readonly propDisabledClicks = signal(0);

  // ── Events: reacting to the user ────────────────────────────────────────

  /** Sample: addEventListener's three arguments, one per line. */
  protected readonly listenerSample = `button.addEventListener(
  'click',
  (event) => {
    console.log(event.target);
  },
);`;

  /** Line-by-line walkthrough of {@link listenerSample}. */
  protected readonly listenerNotes: CodeNote[] = [
    {
      line: 1,
      text: '`button` is the node to watch, and `.addEventListener(` opens the call. Three arguments matter here, one per line below.',
    },
    {
      line: 2,
      text: "The **event name** — always a plain string: `'click'`, `'input'` (fires on every keystroke in a field), `'submit'`, `'keydown'`. Angular's own `(click)=\"…\"` syntax is this exact string with the quotes and parentheses removed.",
    },
    {
      line: 3,
      text: "The **handler** — an ordinary function, here an arrow function. You are handing it to the browser to be called **later**: maybe never, maybe a thousand times, whenever `'click'` actually fires.",
    },
    {
      line: 4,
      text: "`event` is the browser's incident report, handed to your handler automatically. `event.target` is the exact node the click landed on — which, inside a styled button, might be an icon `<span>` rather than the button itself.",
    },
  ];

  /** Click count for the simplest listener demo. */
  protected readonly count = signal(0);
  /** Increments the click count. */
  protected onClick() {
    this.count.update((c) => c + 1);
  }

  /**
   * Does nothing, deliberately.
   *
   * An event handler marks its view dirty and notifies the scheduler
   * regardless of whether the handler itself changes anything — so binding
   * this to the attribute-vs-property probe's `(input)` is enough to make
   * Angular re-check `probe.value` and `probe.getAttribute('value')` on every
   * keystroke, with no signal or state needed at all.
   */
  protected noop(): void {}

  // ── Bubbling and capture ────────────────────────────────────────────────

  /** Bubbling/capture demo log — each entry is one layer's handler firing. */
  protected readonly hits = signal<BubbleHit[]>([]);
  /** Whether the demo's three boxes are wired for the capture leg instead of the default bubble leg. */
  protected readonly captureMode = signal(false);

  private readonly outerBox = viewChild<ElementRef<HTMLDivElement>>('outerBox');
  private readonly middleBox = viewChild<ElementRef<HTMLDivElement>>('middleBox');
  private readonly innerBox = viewChild<ElementRef<HTMLDivElement>>('innerBox');

  constructor() {
    // Angular's own (click) binding syntax has no way to say { capture: true }
    // — there is no `(click.capture)`. So the capture-toggle demo reaches past
    // the framework and calls the browser's own addEventListener directly,
    // once, after the first render puts the three boxes on screen. Both a
    // bubble-phase and a capture-phase listener go on every box; recordHit
    // only ever logs the leg the toggle currently selects, so the two never
    // interleave in the printed order.
    afterNextRender(() => {
      this.wireLayer(this.outerBox(), 'outer');
      this.wireLayer(this.middleBox(), 'middle');
      this.wireLayer(this.innerBox(), 'inner');
    });
  }

  /** Registers both a bubble-phase and a capture-phase click listener on one box. */
  private wireLayer(ref: ElementRef<HTMLDivElement> | undefined, layer: string): void {
    const el = ref?.nativeElement;
    if (!el) return;
    el.addEventListener('click', () => this.recordHit(layer, false), { capture: false });
    el.addEventListener('click', () => this.recordHit(layer, true), { capture: true });
  }

  /** Logs a hit only when its phase matches the current toggle. */
  private recordHit(layer: string, firedDuringCapture: boolean): void {
    if (firedDuringCapture !== this.captureMode()) return;
    this.hits.update((h) => [...h, { layer, order: h.length + 1 }]);
  }

  /** Clears the bubbling/capture log. */
  protected clearHits(): void {
    this.hits.set([]);
  }

  /**
   * `event.target` and `event.currentTarget`, staged as a conversation.
   *
   * The confusion these two cause is entirely about audience: `target` never
   * changes as the event travels, `currentTarget` changes on every single
   * listener that runs. A dialogue keeps that straight far better than a
   * paragraph defining both terms in a row.
   */
  protected readonly targetTalk: BubbleTurn[] = [
    {
      who: 'Listener on <ul>',
      says: "I'm registered on the list, but somebody clicked deep inside me. Who actually got hit?",
    },
    {
      who: 'event.target',
      says: "Me. I'm whichever element the pointer was actually over — the `<li>`, maybe even a `<span>` inside it.",
    },
    {
      who: 'event.currentTarget',
      says: "And I'm whoever's handler is running *right now* — the `<ul>`, always, no matter how deep the click landed.",
    },
    {
      who: 'Listener on <ul>',
      says: "So: which row got clicked? Read `target`. Which element am I actually attached to? That's always `currentTarget`.",
    },
  ];

  /** Sample for the stopPropagation predict — the journey, interrupted mid-flight. */
  protected readonly stopPropagationSample = `middleBox.addEventListener('click', (event) => {
  console.log('middle heard it');
  event.stopPropagation();
});

outerBox.addEventListener('click', () => {
  console.log('outer heard it');
});`;

  /** "focus" listener hits — should stay at 0, since focus never bubbles to a wrapper. */
  protected readonly focusHits = signal(0);
  /** "focusin" listener hits — should climb, since focusin is focus's bubbling twin. */
  protected readonly focusinHits = signal(0);

  /**
   * Self-test 1 — the default propagation order.
   *
   * The distractors are the three real confusions: mistaking capture order for
   * the default, assuming one event means one instant, and assuming a click on
   * a child is invisible to its ancestors at all.
   */
  protected readonly orderQuizOptions: QuizOption[] = [
    {
      text: "outer, then middle, then inner — top-down, the way you'd read the HTML.",
      why: "That's the **capture** order, and capture-phase listeners are the ones almost nothing registers by default. With the toggle off, none of these three boxes have a capture-phase listener doing anything — so that leg never fires at all.",
    },
    {
      text: 'inner, then middle, then outer — target first, then outward.',
      correct: true,
      why: "Right. The click's target really is `inner`, so its bubble-phase listener runs first; then the event retraces the tree **upward**, ancestor by ancestor, until it reaches `document`.",
    },
    {
      text: 'All three at the same instant — one click, one event.',
      why: 'One event object, but not one instant. Dispatch is a genuine sequence — capture down, a stop at the target, then bubble up — and each listener runs to completion before the next one starts.',
    },
    {
      text: 'Only inner — the others never hear about a click on a child element.',
      why: "That would be true if propagation didn't happen at all, which is exactly the wrong mental model this lesson exists to fix. Bubbling is the default: an ancestor's listener hears about a click on any descendant, unless something explicitly stops it.",
    },
  ];

  // ── Self-test 2 — the disabled attribute trap ───────────────────────────

  /**
   * The distractors chase the real misreadings of a boolean attribute: taking
   * the string at face value, blaming an unrelated attribute, and inventing a
   * browser-compatibility angle that does not exist for this one.
   */
  protected readonly disabledQuizOptions: QuizOption[] = [
    {
      text: 'Yes — `"false"` clearly means false.',
      why: 'This is the single most common assumption about boolean HTML attributes, and it is backwards. `disabled` never reads its string value at all — a browser checks whether the attribute is **present**, spelled `"false"` or not.',
    },
    {
      text: 'No — the attribute is present, and presence is all that counts.',
      correct: true,
      why: 'Exactly. Boolean attributes like `disabled`, `checked`, `required` and `readonly` have no "falsy string" — remove the attribute entirely to enable it, or in Angular bind `[disabled]="someBoolean"` and let the framework manage presence/absence for you.',
    },
    {
      text: "It depends on the button's `type`.",
      why: '`type` controls what a **click** does once the button is enabled (submit versus a plain button) — it has no bearing on whether `disabled` blocks the click from happening in the first place.',
    },
    {
      text: 'Only in strict-mode browsers.',
      why: "There's no such split for this attribute — every browser treats a present `disabled` attribute identically, string value and all. This one isn't a compatibility trap; it's a reading-comprehension trap.",
    },
  ];

  // ── The hard way — and why it doesn't scale ─────────────────────────────

  /** Sample: wiring the counter demo entirely by hand. */
  protected readonly hardWaySample = `let count = 0;
const button = document.querySelector('button');
const label = document.querySelector('#count');

button.addEventListener('click', () => {
  count = count + 1;
  label.textContent = 'Clicked ' + count + ' times';
});`;

  /** Line-by-line walkthrough of {@link hardWaySample}. */
  protected readonly hardWayNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The data, and only the data. A plain number in a plain variable — nothing here knows or cares that a screen exists.',
    },
    {
      line: 2,
      text: "A selector string, doing the finding by hand. Rename the button's markup and this line doesn't error — it silently returns `null`, and the crash shows up somewhere else entirely.",
    },
    {
      line: 3,
      text: 'A second selector, for whatever element is meant to display the count. Same fragility.',
    },
    {
      line: 5,
      text: 'The event, reacted to — identical in shape to every listener earlier on this page.',
    },
    {
      line: 6,
      text: 'The DATA updates. If the file stopped here, `count` would be perfectly correct and the screen would show nothing new.',
    },
    {
      line: 7,
      text: "And here's the line that doesn't scale: the SCREEN updates **by hand**, one connection at a time. Every other place this count is shown needs its own copy of this exact line.",
    },
  ];

  /**
   * The path from "one mutation" to "a stale screen" — drawn as a sequence
   * because the failure is entirely about *ordering*. Every individual step
   * is reasonable; it is only laid end to end that the gap becomes visible.
   */
  protected readonly staleSyncFlow: FlowStep[] = [
    {
      label: 'Data changes',
      detail: '`count = count + 1` — one plain assignment, nothing watches it',
      tone: 'accent',
    },
    {
      label: 'Nothing is told',
      detail: 'JavaScript has no built-in way to announce that a variable changed',
    },
    {
      label: 'You must remember',
      detail: 'Every place the value is shown needs its own hand-written sync line',
    },
    {
      label: 'Add a feature',
      detail: 'A reset button, a second counter in the header — each is another line to remember',
    },
    {
      label: 'Miss one',
      detail: 'The classic bug: the data is right and the screen is a lie',
      tone: 'warn',
    },
  ];

  // ── Presentation data ────────────────────────────────────────────────────

  /** The Web Basics track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'How the Web Works', id: 'how-the-web-works' },
    { label: 'The DOM & Events' },
    { label: 'Why TS & Angular', id: 'why-typescript-angular' },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "So which one does `document.querySelector('button')` actually search — the file, or the DOM?",
      a: "The DOM, always. `querySelector` only ever sees the live tree as it currently stands, so it happily finds a button your own JavaScript added five seconds ago and has no idea what the original HTML file said. A screen reader and the browser's own Find-in-page work the exact same way — both read the rendered DOM (really, the accessibility tree built from it), never the source file. That's why 'View Page Source' on a heavily scripted Angular app can show a handful of near-empty tags while every one of those tools sees a fully built page.",
    },
    {
      q: 'If Angular does all this for me, will I ever actually write `addEventListener` myself?',
      a: 'Rarely inside a component template — `(click)="…"` is that exact call with the ceremony removed. But the raw API does not go away: directives, third-party widgets, and this very page\'s capture-phase demo all reach for it directly, because Angular\'s own binding syntax has no way to say `{ capture: true }`. Knowing the primitive underneath is what makes those escape hatches make sense instead of feeling like magic.',
    },
    {
      q: 'Why does a form reload the page when submitted, and how do I stop it?',
      a: "The browser's default action for a form submit is a full-page request to the form's action URL — web-1.0 behaviour, still there under everything. Call `event.preventDefault()` in the submit handler to cancel it and handle the data with JavaScript instead. Angular's `(ngSubmit)` does this for you automatically — now you know exactly what it's suppressing.",
    },
    {
      q: "`document.querySelector('#total').textContent = sum;` is sprinkled through a codebase 14 times. What's the risk?",
      a: 'Manual DOM sync: every code path that changes `sum` must remember all 14 lines — miss one and you get a stale screen — and all 14 depend on an id that nothing verifies at build time. This exact maintenance nightmare is the pitch for declarative frameworks: one template expression, updated automatically, everywhere it is used.',
    },
    {
      q: 'If innerHTML can run attacker code, why does it exist at all?',
      a: "Because sometimes you genuinely need to render markup — a rich-text comment, a preview pane, a CMS field. The property is not the bug; using it on a string you do not fully trust is. Angular's own `[innerHTML]` binding keeps the convenience and removes the danger by running every value through a sanitizer first — the Security lesson covers exactly what that strips, and what still gets through if you sidestep it the way this page's own live demo just did.",
    },
    {
      q: "Why doesn't `focus` bubble when almost everything else does?",
      a: 'Historical, and it has stayed that way on purpose: a bubbling `focus` would be noisy, since every ancestor up to `<body>` would hear about every field on the page gaining focus. Browsers added `focusin`/`focusout` specifically so delegation still works when you actually want it — same underlying event, opt-in bubbling. `blur`, `load` and `error` follow the identical pattern, with `focusout` covering the `blur` case.',
    },
    {
      q: "Is `getAttribute('value')` ever actually useful, or is it just a trap to avoid?",
      a: 'Genuinely useful — it\'s how you read the **original** markup, which matters for something like a "reset form" control (put every field back to what the HTML said, not to empty) or a custom element reading its own configuration. The trap is not the method; it\'s assuming it tracks what a user typed. For that, `.value` is always the one you want.',
    },
    {
      q: 'event.target versus event.currentTarget — is there a rule of thumb?',
      a: 'Yes: `target` answers "what was actually clicked" and never changes as the event travels; `currentTarget` answers "which element\'s listener is running right now" and changes on every single handler along the way. Reach for `target` when you need to know exactly what the user touched — the classic delegation case — and `currentTarget` when you just need a reliable handle on the element you attached the listener to.',
    },
  ];
}
