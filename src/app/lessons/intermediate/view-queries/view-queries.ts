import {
  Component,
  ElementRef,
  computed,
  effect,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { StatCard } from './stat-card/stat-card';

/**
 * Lesson: view queries — `viewChild()` / `viewChildren()`, the `@ViewChild` /
 * `@ViewChildren` decorators they replaced, and the two runtime errors that
 * make timing the actual subject of this page.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The whole page is organised around three
 * questions that stay constant no matter which form of query is in play, first
 * posed in the opening section and closed off in a recap table at the end:
 *
 * 1. **What** can a query find — the locator (template ref, component type,
 *    directive type)?
 * 2. **When** is it safe to read one — before or after the view exists?
 * 3. **How far** does it reach — this template only, and not one tag further?
 *
 * The teaching order follows the reference lesson's recipe: pose the problem
 * before naming it (a napkin asks the reader to predict a constructor read
 * before any API is shown), an analogy before vocabulary (a coat-check claim
 * ticket, which the required-query section later reuses to explain NG0951 as
 * "the same ticket, a stricter clerk"), then the same ideas in several modes —
 * a taped row of the three query shapes, a dialogue between a component and
 * its own query, four live demos, and five annotated `app-code-lab` samples.
 *
 * ## Depth added beyond the pre-migration lesson
 *
 * Four gaps from a prior coverage sweep are folded in as new material rather
 * than left as prose assertions:
 *
 * - **The child-component wall.** `viewChild` never descends into a child's
 *   own template, even though a child's markup reads as "on the page" —
 *   demonstrated live with {@link StatCard}: `read: ElementRef` on a component
 *   match returns the host tag, and the only two ways across are calling a
 *   method the child exposes or having the child expose its own query.
 * - **`viewChild.required()` throws on *timing*, not only on a missing
 *   target** — NG0951 fires from `ngOnInit` even when the target is
 *   unconditionally present in the template, which is the exam trap the old
 *   copy invited by saying signal queries "make this safe by design."
 * - **Writing through a resolved query can still throw NG0100.** A query read
 *   in `ngAfterViewInit` is safe; using that result to *write* to a plain
 *   field the child's own template is bound to is not, because that view was
 *   already checked this pass.
 * - **`QueryList` / `.changes` interop** for the legacy decorator form, and
 *   the gotcha that `.changes` never emits for the query's initial resolution
 *   — only for matches that appear or disappear afterwards.
 *
 * @see lessons/intermediate/content-projection — `contentChild`/`contentChildren`,
 * the other half of "view vs content" this lesson only sketches.
 */
@Component({
  selector: 'app-lesson-view-queries',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Predict,
    Quiz,
    Remember,
    StatCard,
  ],
  templateUrl: './view-queries.html',
  styleUrl: './view-queries.css',
})
export class ViewQueries {
  // ── Demo 1: grab it, focus it, fill it ─────────────────────────────────────

  /** An input in the view, queried by template reference variable. */
  protected readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  /** A live list of the repeated rows. */
  protected readonly rows = viewChildren<ElementRef<HTMLElement>>('item');

  /** Focuses the queried input. The `?.` is doing real work: undefined until the view exists. */
  protected focusBox(): void {
    this.box()?.nativeElement.focus();
  }
  /** Writes into the queried input's DOM value directly. */
  protected fillBox(): void {
    const el = this.box()?.nativeElement;
    if (el) el.value = 'Set from the component!';
  }

  // ── Demo 2: queries re-resolve reactively ──────────────────────────────────

  /** Whether the conditional target is rendered. */
  protected readonly showTarget = signal(false);
  /**
   * The conditional target. Resolves to `undefined` when it is not in the DOM,
   * which is why the non-required form returns an optional.
   */
  protected readonly target = viewChild<ElementRef<HTMLInputElement>>('target');
  /** What the effect last saw. */
  protected readonly effectLog = signal('(waiting)');

  constructor() {
    // Reading a query signal inside effect() re-runs whenever it resolves/clears —
    // the live proof behind mentalModelTalk's last two turns, below.
    effect(() => {
      this.effectLog.set(this.target() ? 'resolved → ElementRef' : 'cleared → undefined');
    });
  }

  // ── Demo 3: the child-component wall ───────────────────────────────────────

  /** The number shown on the tile — plain state a parent binding can still change freely. */
  protected readonly sessionCount = signal(128);
  /** The child, matched by type — every public method on it is fair game. */
  protected readonly card = viewChild(StatCard);
  /** The *same* match, asked for a different token: the host element, not anything inside it. */
  protected readonly cardHost = viewChild(StatCard, { read: ElementRef });
  /** What `read: ElementRef` actually resolved to, spelled out as its tag name. */
  protected readonly cardHostTag = computed(
    () => this.cardHost()?.nativeElement.tagName ?? '(not resolved yet)',
  );

  // ── Presentation data — the "you are here" rail ────────────────────────────

  /** The Components & Templates track, in curriculum order. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Content Projection', id: 'content-projection' },
    { label: 'View Queries' },
    { label: 'ng-template', id: 'ng-template-outlet' },
    { label: 'Encapsulation', id: 'view-encapsulation' },
  ];

  /**
   * The mental-model dialogue: a component declaring a query, and the query
   * explaining its own timing rule twice — once for a plain read, once for
   * the reactive re-resolution the live demo above proves.
   */
  protected readonly mentalModelTalk: BubbleTurn[] = [
    { who: 'Your code', says: "I wrote `box = viewChild('box')` as a field. Give me the input." },
    {
      who: 'The query',
      says: "Ticket noted. But there's no view yet — ask from the constructor and I'll say `undefined`.",
    },
    { who: 'Your code', says: "Fine — I'll ask from an `effect()` instead." },
    {
      who: 'The query',
      says: 'Good call. The moment Angular builds `<input #box>`, I resolve to its `ElementRef` — and your effect re-runs on its own.',
    },
    { who: 'Your code', says: "And if it's inside `@if` and the condition flips off?" },
    {
      who: 'The query',
      says: "I clear back to `undefined`, and your effect fires again to tell you. I'm not a one-time lookup — I track the view for as long as you keep reading me.",
    },
  ];

  /**
   * Sample: the query API — the "ticket" from the mental-model analogy, made
   * literal as a field declaration.
   */
  protected readonly apiSample = `// declared once, as a field — the "ticket"
box = viewChild<ElementRef<HTMLInputElement>>('box');

// required — throws NG0951 if read too early, not only if nothing ever matches
title = viewChild.required<ElementRef>('title');

// the plural form — every match, live
items = viewChildren<ElementRef>('item');

focus() { this.box()?.nativeElement.focus(); }`;

  /** Line-by-line walkthrough of {@link apiSample}. */
  protected readonly apiNotes: CodeNote[] = [
    {
      line: 2,
      text: "`viewChild<ElementRef<HTMLInputElement>>('box')` — the generic says what a match returns; `'box'` is the **locator**, a template reference variable declared as `#box` somewhere in *this* component's own template. The field's real type is `Signal<ElementRef<HTMLInputElement> | undefined>` — call it like a function to read the current value.",
    },
    {
      line: 5,
      text: "`.required` is a second entry point on the same `viewChild` function, not a flag you pass in. It returns `Signal<T>` with no `undefined` in the type — but it doesn't change *when* the query resolves, only what happens if you read it too early, or if it never matches at all.",
    },
    {
      line: 8,
      text: "`viewChildren()` starts at an empty array and grows or shrinks as matches appear and disappear — never `undefined`, because from a list's point of view 'zero matches so far' and 'the view isn't built yet' look identical.",
    },
    {
      line: 10,
      text: "Reading a query is calling it — `this.box()` — then narrowing with `?.`, because the signal's type includes `undefined`. Angular resolves queries during a dedicated pass that runs strictly after a view is built, so anything read before that pass — the constructor, a field initializer — sees `undefined` here regardless of what the template contains.",
    },
  ];

  /** Sample: does the plural form report "not built yet" the same way the singular one does? */
  protected readonly requiredSample = `title = viewChild.required<ElementRef<HTMLHeadingElement>>('title');
// <h2 #title>Report</h2> — right there in the template, no @if around it

ngOnInit() {
  console.log(this.title().nativeElement.textContent);
}`;

  /** Line-by-line walkthrough of {@link requiredSample}. */
  protected readonly requiredNotes: CodeNote[] = [
    {
      line: 1,
      text: "`.required()` — the type is `Signal<ElementRef<HTMLHeadingElement>>`, no `undefined` anywhere in it. That's a promise about the **result**, not about **when** you're allowed to ask for one.",
    },
    {
      line: 2,
      text: "The target genuinely exists, unconditionally, in the compiled template. If 'required' meant 'about the element', this would be the safe case.",
    },
    {
      line: 5,
      text: '`ngOnInit()` runs early — before Angular has built this view even once. The query has nothing to report yet, and the required form has no `undefined` to fall back on the way the optional form does.',
    },
  ];

  /** Sample: the two legitimate ways across a child component's own boundary. */
  protected readonly boundarySample = `// inside the CHILD's own file — it exposes the result itself
private readonly valueEl = viewChild<ElementRef<HTMLElement>>('valueEl');
readonly pixelWidth = computed(() => this.valueEl()?.nativeElement.offsetWidth ?? 0);

// the parent reads the exposed computed like any other signal:
this.card()?.pixelWidth();`;

  /**
   * Sample: querying a component instance rather than an element, and the
   * `read` option for choosing which token comes back from a matched node.
   */
  protected readonly readSample = `// grab a child component instance and call its own API
chart = viewChild(ChartComponent);
refresh() { this.chart()?.redraw(); }

// read: chooses which token comes back from the SAME match
cardHost = viewChild(StatCard, { read: ElementRef });
slotRef  = viewChild('slot', { read: ViewContainerRef });

// the plural form, matched by component type
tabs = viewChildren(TabComponent);`;

  /** Line-by-line walkthrough of {@link readSample}. */
  protected readonly readNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Passing a component **type** as the locator, instead of a string, matches that type wherever it appears in this template and gives you the instance — every public method and property on `ChartComponent` is fair game from here.',
    },
    {
      line: 6,
      text: "Same idea as line 2 — matched by type — but `{ read: ElementRef }` asks for a *different token off that same match*: the component's **host element**, the `<app-stat-card>` tag itself. Never anything from inside `StatCard`'s own template — a component's internals are never a valid `read:` target from outside it.",
    },
    {
      line: 7,
      text: "A string locator takes `read:` too. `'slot'` still has to be a template reference declared in *this* template — `read:` only changes which token comes back, never what counts as a match.",
    },
    {
      line: 10,
      text: 'No `read:`, no string — matched purely by type, plural. `Signal<readonly TabComponent[]>`, live, same reactive shape as any other `viewChildren()`.',
    },
  ];

  /** Sample: the legacy `@ViewChildren` / `QueryList` form, and its one real gotcha. */
  protected readonly legacySample = `@ViewChildren(RowComponent) rows!: QueryList<RowComponent>;

ngAfterViewInit() {
  console.log(this.rows.first, this.rows.last, this.rows.length);
  console.log(this.rows.toArray());

  this.rows.changes.pipe(takeUntilDestroyed()).subscribe((list) => {
    console.log('rows changed:', list.length);
  });
}`;

  /** Line-by-line walkthrough of {@link legacySample}. */
  protected readonly legacyNotes: CodeNote[] = [
    {
      line: 1,
      text: "The decorator form. `rows!` — the `!` tells TypeScript 'trust me, this gets assigned', because Angular sets it after construction, not TypeScript at compile time. `QueryList<RowComponent>` is its own iterable type, not a plain array.",
    },
    {
      line: 4,
      text: 'By `ngAfterViewInit`, the query has already resolved once, so `.first`, `.last`, `.length` and index access all work synchronously — the same moment a signal query would already be readable, just without the `()` call.',
    },
    {
      line: 5,
      text: '`.toArray()` snapshots the current matches into a real `Array` — for `.map()`, `.filter()`, spreading, anything `QueryList` itself does not implement.',
    },
    {
      line: 7,
      text: "`.changes` is an `Observable` that fires on every **later** re-match — a row added or removed after this point. It does **not** emit for the three rows already sitting in `rows` when this subscription starts; those were already read, synchronously, on line 4. `takeUntilDestroyed()` is what unsubscribes automatically when this component is destroyed — without it, `.changes` leaks the subscription for the app's lifetime.",
    },
  ];

  /** Sample: a query read is safe; using its result to write is a different question entirely. */
  protected readonly chartSample = `chart = viewChild.required(ChartComponent);

ngAfterViewInit() {
  this.chart().title = 'Ready';
}
// ChartComponent's own template binds: <h2>{{ title }}</h2>`;

  /** Line-by-line walkthrough of {@link chartSample}. */
  protected readonly chartNotes: CodeNote[] = [
    {
      line: 1,
      text: '`.required()` is genuinely safe to call from here — `ngAfterViewInit` is one of the safe read points from a few sections back. The **read** is not the problem in this snippet.',
    },
    {
      line: 4,
      text: 'This is not reading the query — it is using the result to **write**, straight into a plain (non-signal) field on the child. `chart()` hands back the real `ChartComponent` instance; nothing about a view query stops you from mutating it.',
    },
    {
      line: 6,
      text: "Here's the trap: `title` is exactly what `ChartComponent`'s own template binds to. That view was already checked as part of the *same* pass that got you into this hook — writing to it now means the template's stored value and the field's live value disagree, and dev mode's second verification pass catches the disagreement.",
    },
  ];

  /** The self-test on the child-component boundary — the highest-priority gap this migration closes. */
  protected readonly boundaryQuizOptions: QuizOption[] = [
    {
      text: "The button's `ElementRef`, because it's visually part of the parent's rendered page.",
      why: "It looks that way once rendered, but the compiler works from one template file per component. The parent's own template has no `#saveBtn` node in it at all — that reference variable belongs to a completely different file — so there's nothing here to resolve, ever.",
    },
    {
      text: '`undefined`, and it stays that way forever.',
      correct: true,
      why: "There's no `#saveBtn` anywhere in the *parent's* own template — it exists only inside the child's separate template — so the query has nothing to match against in this component. It compiles fine and simply never resolves, silently, which is arguably worse than an error.",
    },
    {
      text: 'The `<app-child>` host element, the same as querying `ChildComponent` with `read: ElementRef`.',
      why: "That's what happens if you query the **component type**, not this template-ref string. A `'saveBtn'` locator with no matching node in this template just never resolves — it does not fall back to the host.",
    },
  ];

  /** The self-test on `.changes` — closes the QueryList-interop gap. */
  protected readonly changesQuizOptions: QuizOption[] = [
    {
      text: 'The three rows, immediately — `.changes` always fires once for the current state.',
      why: "That's how a `BehaviorSubject` behaves, and `.changes` is not one — it's a plain `Observable` that only fires on the *next* re-match. The three rows already there produce no emission at all here; `.length` or `.toArray()`, read synchronously, is how you actually see them.",
    },
    {
      text: 'Nothing — until a row is later added or removed.',
      correct: true,
      why: 'Exactly. `.changes` reports future re-matches only. The initial population is something you read directly off `rows`, not something you wait for on the stream.',
    },
    {
      text: "An error, because `.changes` isn't available until `ngAfterContentInit`.",
      why: "`.changes` exists the moment the `QueryList` field is assigned — it's a real `Observable` property, not something added later. The subscription is legal; it just never fires when you'd expect it to for the initial set.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why is my `viewChild()` `undefined` in the constructor?',
      a: 'Queries resolve after the view renders, and the constructor runs before that. Read the signal in an `effect()`, `afterNextRender()`, `ngAfterViewInit()`, or an event handler instead — it reads `undefined` until one of those points.',
    },
    {
      q: "The element is inside an `@if` that's false right now — what does the query return?",
      a: '`undefined`, until the condition flips true and it renders. A signal query updates automatically the moment that happens — no manual re-check, no `ngAfterViewChecked` polling.',
    },
    {
      q: 'How do I query something a parent projected in with `<ng-content>`?',
      a: "Not with `viewChild` — that only searches this component's own template. Content a parent projected in was written in the *parent's* template, so the child needs `contentChild`/`contentChildren` to reach it.",
    },
    {
      q: 'Why did my `.changes` subscription in `ngAfterViewInit` never fire for the rows already there?',
      a: "`.changes` only reports matches that appear or disappear **after** you subscribe. The rows present at that first `ngAfterViewInit` were already resolved — read them synchronously off the `QueryList` itself, the same instant you're subscribing to hear about the next ones.",
    },
    {
      q: 'Is it safe to measure an element with `getBoundingClientRect()` in `ngAfterViewInit`?',
      a: 'Reading is always safe there — measuring writes nothing. The trap is writing the measured number back onto something the just-checked view is bound to, in the same pass. Do that inside `afterNextRender()`, or store it in a signal you set from an `effect()`, instead of assigning it directly.',
    },
  ];
}
