import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from './panel/panel';
import { TabLabel } from './tab-label/tab-label';
import { TabPanel } from './tab-panel/tab-panel';
import { TabGroup } from './tab-group/tab-group';
import { BadgeHost } from './badge-host/badge-host';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── The lesson component ───────────────────────────────────────────────────────

/**
 * Lesson: Content Projection — letting the caller supply the markup.
 *
 * Covers `<ng-content />`, named slots via `select=`, fallback content, `ngProjectAs`,
 * and the content queries (`contentChild()` / `contentChildren()`) that let a component
 * find what was projected into it.
 *
 * ## Shape: `whiteboard`
 *
 * The lesson opens on the styling question drawn as one picture: a caller's
 * `<strong>` element, tagged with the PARENT's `_ngcontent` attribute the
 * moment it's compiled, moving into Callout's rendered DOM without that tag
 * ever changing. `app-brain-power` poses the styling question before the
 * figure; three {@link Scribble} call-outs name the attribute that never
 * changes, the scoped rule that can never match it, and the split between
 * position and ownership; `.bf-answer` spells the answer out, and
 * {@link wholePictureFlow} restates the same order as a numbered list. The
 * block's own quiz ({@link viewScopeQuizOptions}) checks the attribute
 * directly. The predict-napkin that used to open the page is now this
 * block's own `app-brain-power` question, word for word — nothing was lost,
 * only reshaped into the device the block actually uses. See
 * `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer — see `shared/brain/` and
 * `src/app/lessons/expert/change-detection/change-detection.ts`, the reference
 * implementation this shape is copied from. The teaching order:
 *
 * 1. **Pose the problem before naming it.** A component author cannot write an
 *    input for "arbitrary markup" — the lesson opens on that impossibility,
 *    drawn as one picture of the styling question, before `<ng-content>` is
 *    named.
 * 2. **Analogy next, mechanism after.** The picture-frame analogy gives the reader
 *    somewhere to put "the child never builds what it hosts" before any API
 *    vocabulary appears, then says the same thing a second way as a five-line
 *    dialogue between the parent, the compiler, `<ng-content>`, `viewChild` and
 *    `contentChild`.
 * 3. **Then the mechanism, five different snippets** — default slot, `select`,
 *    fallback, `contentChildren()`, `ngProjectAs` — each one an `app-code-lab`
 *    with real line-by-line notes, paired with a live demo wherever one of the
 *    original demo components ({@link Panel}, {@link TabGroup}, {@link BadgeHost})
 *    makes that possible.
 * 4. **The one trap that actually shows up in review** — projected content is
 *    built eagerly, with the parent, whatever the child does with it afterwards —
 *    proven with a predict-then-reveal, and said again a different way later on
 *    (a second wrong/right pair: two bare `<ng-content>` versus named slots).
 *
 * The distinction that matters throughout: projected content belongs to the
 * **caller**, not to the component rendering it. It is compiled in the caller's
 * context, styled by the caller's styles, instantiated with the caller's view —
 * and, as {@link TabGroup} shows, the receiving component can only find it
 * through a content query, never a view query.
 */
@Component({
  selector: 'app-lesson-content-projection',
  imports: [
    RouterLink,
    Panel,
    TabGroup,
    TabLabel,
    TabPanel,
    BadgeHost,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    BrainPower,
    Scribble,
    Whiteboard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './content-projection.html',
  styleUrl: './content-projection.css',
})
export class ContentProjection {
  // ── Chapter header ────────────────────────────────────────────────────────

  /** Neighbouring lessons in the Components & Templates track. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Lifecycle Hooks', id: 'lifecycle' },
    { label: 'Content Projection' },
    { label: 'View Queries', id: 'view-queries' },
    { label: 'ng-template & ngTemplateOutlet', id: 'ng-template-outlet' },
    { label: 'View Encapsulation', id: 'view-encapsulation' },
  ];

  /** The shape block's numbered restatement of the whiteboard figure. */
  protected readonly wholePictureFlow: FlowStep[] = [
    {
      label: "Parent's template compiles",
      detail:
        "the caller's <strong> gets tagged _ngcontent-parent right here, before Callout is even involved.",
    },
    {
      label: '<ng-content> marks a spot, nothing more',
      detail:
        "Callout's template names WHERE projected content goes — it never rebuilds or retags what arrives.",
    },
    {
      label: "The node moves into Callout's DOM",
      detail: 'position changes. The _ngcontent-parent attribute travels with it, unchanged.',
    },
    {
      label: "Callout's scoped styles are checked",
      detail:
        'every rule in callout.css was rewritten to require [_ngcontent-callout] — a tag this node never carries.',
    },
  ];

  /**
   * The shape block's quiz: which view's encapsulation attribute a projected
   * node carries, checked directly against the figure.
   */
  protected readonly viewScopeQuizOptions: QuizOption[] = [
    {
      text: "The parent's — the attribute was assigned when the parent's template compiled, and projection never reassigns it.",
      correct: true,
      why: "Angular tags every element with its OWN template's view-encapsulation attribute at compile time. Content projection only changes where a node is drawn in the DOM tree — it never recompiles the node under a different component's template, so the attribute it started with is the attribute it keeps.",
    },
    {
      text: "Callout's — once a node is physically inside Callout's DOM, Callout's scoped styles apply to it like any other descendant.",
      why: "That's the exact misconception this block exists to correct. Scoped styles match on the ATTRIBUTE Angular stamped at compile time, not on DOM position — and a projected node's attribute was stamped by the parent, before Callout ever saw it.",
    },
    {
      text: 'Neither — a projected node carries no view-encapsulation attribute at all.',
      why: "It carries one — just not Callout's. Every element in an emulated-encapsulation view gets tagged with SOME component's attribute, and for projected content that's always the template that originally compiled it.",
    },
    {
      text: 'It depends on whether Callout uses ViewEncapsulation.Emulated or ViewEncapsulation.None.',
      why: "Callout's own encapsulation mode decides how Callout's OWN styles get scoped — it has no effect on an attribute that was already assigned to the projected node before Callout was ever involved.",
    },
  ];

  // ── The mental model ──────────────────────────────────────────────────────

  /**
   * The picture-frame analogy, restaged as a chain reaction: who wrote the
   * projected node, who built it, and who is — and isn't — allowed to find it
   * afterwards. The misconception this heads off is the one nearly everyone
   * starts with: that the child builds what it hosts.
   */
  protected readonly dialogue: BubbleTurn[] = [
    {
      who: 'Parent template',
      says: 'I wrote `<app-callout><strong>Heads up!</strong></app-callout>`.',
    },
    {
      who: 'Angular compiler',
      says: "That `<strong>` compiled into the PARENT's view, not Callout's — built before Callout's own constructor even ran.",
    },
    {
      who: '`<ng-content>`',
      says: "I don't build anything. I'm an insertion point — I relocate whatever the parent already built, into this exact spot.",
    },
    {
      who: '`viewChild(...)`',
      says: "I only search MY OWN component's template. That `<strong>` was never written inside Callout's `@Component`, so as far as I'm concerned it doesn't exist.",
    },
    {
      who: '`contentChild(...)`',
      says: "I've seen it — I search whatever arrived from outside, once `ngAfterContentInit` runs.",
    },
  ];

  // ── CodeLab 1: the default slot ───────────────────────────────────────────

  /** Sample: the simplest form — one default `<ng-content>` absorbs everything. */
  protected readonly singleSlotSample = `@Component({
  selector: 'app-callout',
  templateUrl: './callout.html',
})
export class Callout {}

// callout.html
<div class="callout">
  <ng-content />
</div>

// parent template:
<app-callout>
  <strong>Heads up!</strong> This is projected content.
</app-callout>`;

  /** Line-by-line walkthrough of {@link singleSlotSample}. */
  protected readonly singleSlotNotes: CodeNote[] = [
    {
      line: 1,
      text: "`@Component({...})` registers `Callout` as a component. Nothing about `<ng-content>` is special-cased in the decorator — it's just markup that happens to live in the template file.",
    },
    {
      line: 3,
      text: '`templateUrl` points at a separate file — the one shown right below it, same convention as every lesson in this app.',
    },
    {
      line: 5,
      text: '`export class Callout {}` — genuinely empty. This component owns no state; its only job is deciding **where** something appears, never **what** that something is.',
    },
    {
      line: 9,
      text: "`<ng-content />` — self-closing, because it builds nothing of its own. It's a placeholder Angular fills with whatever markup the caller wrote between `<app-callout>` and `</app-callout>`.",
    },
    {
      line: 14,
      text: "This `<strong>` was never written inside Callout's own template — it was written in the **parent's**. Angular compiles it there, then `<ng-content>` on line 9 relocates it here. Nothing about it is rebuilt.",
    },
  ];

  // ── CodeLab 2: select and the catch-all ───────────────────────────────────

  /** Sample: multi-slot projection routed with `select`. */
  protected readonly multiSlotSample = `@Component({
  selector: 'app-panel',
  templateUrl: './panel.html',
})
export class Panel {}

// panel.html
<header><ng-content select="[panel-title]" /></header>
<div><ng-content /></div>
<footer><ng-content select="[panel-actions]" /></footer>

// parent:
<app-panel>
  <h3 panel-title>Invoice #42</h3>
  <p>Body goes in the default slot.</p>
  <ng-container panel-actions>
    <button>Pay now</button>
  </ng-container>
</app-panel>`;

  /** Line-by-line walkthrough of {@link multiSlotSample}. */
  protected readonly multiSlotNotes: CodeNote[] = [
    {
      line: 5,
      text: 'Empty, same as `Callout` — `Panel` decides layout only, never content.',
    },
    {
      line: 8,
      text: '`select` takes a CSS selector — here an **attribute** selector, `[panel-title]`. Any element the parent tags with that attribute is routed here, and only here.',
    },
    {
      line: 9,
      text: "No `select` on this one — it's the **catch-all**. Every projected node that matched no other slot lands here. There can be only one bare `<ng-content>` per template; write a second and it just sits empty.",
    },
    {
      line: 10,
      text: 'A second `select`ed slot, matched completely independently of the one above — order between **named** slots never matters. Order only matters relative to the bare catch-all: put that one first in the template and it swallows everything before Angular even reaches this line.',
    },
    {
      line: 14,
      text: '`panel-title` is a bare attribute, no value needed — it exists purely as a marker for the selector on line 8. Prefer an attribute over a class here: renaming a CSS class later cannot silently disconnect the projection.',
    },
    {
      line: 16,
      text: "`<ng-container>` groups the button for the `panel-actions` slot **without** adding a real element to the DOM. It carries the marker attribute without becoming an extra wrapper the footer's own layout has to account for.",
    },
  ];

  // ── select matches static, top-level attributes only ─────────────────────

  // Both traps are demonstrated live, below, with the real Panel and
  // BadgeHost components already imported above — no code samples needed.

  // ── The default nobody states: descendants ────────────────────────────────

  /**
   * Inline snippet for prose. A raw `{`/`}` typed directly into template
   * *text* reads as the start of an interpolation, so this has to arrive as a
   * plain string bound via `{{ }}` rather than be typed straight into the
   * `.html`.
   */
  protected readonly descendantsFalseSample = '{ descendants: false }';

  /** Inline snippet for prose — see {@link descendantsFalseSample}. */
  protected readonly descendantsTrueFixSample = 'contentChildren(TabLabel, { descendants: true })';

  // ── CodeLab 3: fallback content ───────────────────────────────────────────

  /** Sample: fallback markup inside `<ng-content>`, shown only when a slot is empty. */
  protected readonly fallbackSample = `// panel.html — the title slot, with a fallback
<ng-content select="[panel-title]">
  <span class="muted">No title provided</span>
</ng-content>`;

  /** Line-by-line walkthrough of {@link fallbackSample}. */
  protected readonly fallbackNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Fallback markup goes **between** the opening and closing `<ng-content>` tags — this one is no longer self-closing.',
    },
    {
      line: 3,
      text: "This `<span>` is part of **Panel's own** template, not projected content. It renders only when the parent's `[panel-title]` slot receives nothing at all.",
    },
  ];

  // ── CodeLab 4: contentChild / contentChildren ─────────────────────────────

  /** Sample: `contentChildren()` querying projected `TabLabel` / `TabPanel` directives. */
  protected readonly contentQuerySample = `@Component({ selector: 'app-tab-group' })
export class TabGroup implements AfterContentInit {
  readonly labels = contentChildren(TabLabel);
  readonly panels = contentChildren(TabPanel);

  ngAfterContentInit(): void {
    console.log(this.labels().length, 'tabs found');
  }
}

// parent:
<app-tab-group>
  <span tabLabel>Overview</span>
  <div tabPanel>Overview content…</div>
  <span tabLabel>Settings</span>
  <div tabPanel>Settings content…</div>
</app-tab-group>`;

  /** Line-by-line walkthrough of {@link contentQuerySample}. */
  protected readonly contentQueryNotes: CodeNote[] = [
    {
      line: 2,
      text: '`AfterContentInit` — the lifecycle interface for the hook implemented on line 6. It exists specifically because content queries resolve **later** than view ones.',
    },
    {
      line: 3,
      text: "`contentChildren(TabLabel)` — a live **signal** over every projected `TabLabel` directive. **Content** children, because these elements live in the parent's markup and were only relocated in; `viewChildren()` would find nothing here.",
    },
    {
      line: 4,
      text: 'Same idea, a different directive. `labels` and `panels` stay paired by **array position** — nothing enforces that, so a stray `tabLabel` with no matching `tabPanel` shifts every tab after it.',
    },
    {
      line: 6,
      text: "`ngAfterContentInit()` is the **earliest** point at which `labels()` and `panels()` are guaranteed to hold anything. Read either one in the constructor and it's `[]`.",
    },
    {
      line: 7,
      text: "Calling `labels()` like a function reads its current value. Because it's a signal — not the old `QueryList` — anything computed from it re-runs automatically if the parent adds or removes a tab later; no subscription to remember.",
    },
    {
      line: 13,
      text: 'The parent writes a flat, unstructured list — no config object, no array binding. `TabGroup` discovers the pairing entirely by **querying** for the directives, which is what makes this API feel declarative.',
    },
  ];

  // ── The other famous error, content-query edition ─────────────────────────

  /** Sample: reading a content query safely, then using the result to write to a plain, bound field. */
  protected readonly contentWriteTrapSample = `readonly labels = contentChildren(TabLabel);

ngAfterContentInit() {
  this.labels().forEach((label, i) => (label.active = i === 0));
}
// Each TabLabel's own template binds: <span [class.tg__tab--active]="active">`;

  /** Line-by-line walkthrough of {@link contentWriteTrapSample}. */
  protected readonly contentWriteTrapNotes: CodeNote[] = [
    {
      line: 1,
      text: '`contentChildren(TabLabel)` resolving here is completely fine — `ngAfterContentInit` is the documented, earliest-safe moment to read it. The **read** is not the problem in this snippet.',
    },
    {
      line: 4,
      text: '`labels()` hands back the real `TabLabel` directive instances — nothing about a content query stops you from reaching in and mutating one. This line is not reading the query any more; it is using the result to **write**.',
    },
    {
      line: 6,
      text: "Here's the trap: `active` is exactly what each `TabLabel`'s own host binding reads. Those bindings were already checked as part of the *same* pass that got you into this hook — writing to `active` now means the template's already-rendered value and the field's live value disagree, and dev mode's second verification pass catches the disagreement: `NG0100`.",
    },
  ];

  /** Sample: the declarative fix — each TabLabel computes its own active state. */
  protected readonly contentWriteFixSample = `// tab-label.ts
@Directive({
  selector: '[tabLabel]',
  host: { '[class.tg__tab--active]': 'isActive()' },   // Angular owns this write
})
export class TabLabel {
  private readonly group = inject(TabGroup);
  readonly isActive = computed(() => this.group.activeLabel() === this);
}`;

  /** Line-by-line walkthrough of {@link contentWriteFixSample}. */
  protected readonly contentWriteFixNotes: CodeNote[] = [
    {
      line: 4,
      text: 'The host binding itself performs the write now — never a lifecycle hook. Angular re-evaluates `isActive()` as part of **its own** change-detection pass for this directive, exactly where a read-and-render is supposed to happen.',
    },
    {
      line: 7,
      text: "`computed()` re-derives `isActive` purely from two signals it reads — `TabGroup`'s `activeLabel()` and its own identity. Nothing calls `.set()` on anything from inside a lifecycle hook, so there is no timing left to get wrong.",
    },
  ];

  // ── CodeLab 5: ngProjectAs ─────────────────────────────────────────────────

  /** Sample: `ngProjectAs` making an `<ng-container>` match a selector it has no class for. */
  protected readonly projectAsSample = `// panel.html — BadgeHost's slot
<ng-content select=".badge" />

// parent — wraps several badges in ng-container, projects as .badge
<app-badge-host>
  <ng-container ngProjectAs=".badge">
    <span class="pill">New</span>
    <span class="pill">Beta</span>
  </ng-container>
</app-badge-host>`;

  /** Line-by-line walkthrough of {@link projectAsSample}. */
  protected readonly projectAsNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The slot is matched against a **class** selector, `.badge`. An `<ng-container>` has no class of its own to offer it — exactly the problem `ngProjectAs` exists to solve.',
    },
    {
      line: 6,
      text: '`ngProjectAs=".badge"` tells Angular: for **matching purposes only**, treat this node as though it carried `class="badge"`. The container itself never actually gets that class — only the projection logic sees it.',
    },
    {
      line: 7,
      text: 'Both spans travel to the `.badge` slot together, as one group, because they share the same `ngProjectAs`-tagged wrapper. Without it, each `<span>` would need its own class to match individually.',
    },
  ];

  // ── Who builds it, and when ───────────────────────────────────────────────

  /**
   * Who creates projected nodes, and when. Laid out because every surprising
   * thing about projection — the eager instantiation, the injection context,
   * why `viewChild` cannot see it — follows from the first step: the nodes
   * belong to the parent's view, and `<ng-content>` only relocates them.
   */
  protected readonly journey: FlowStep[] = [
    {
      label: 'Compiled into the *parent* view',
      detail: 'The projected markup is part of the parent template, not the child',
      tone: 'accent',
    },
    {
      label: 'Created with the parent',
      detail: 'Eagerly — before the child has any say in the matter',
    },
    {
      label: '`<ng-content>` relocates them',
      detail: 'An insertion point, not a factory. The nodes are moved, never rebuilt',
    },
    {
      label: 'Child runs `ngAfterContentInit`',
      detail: 'The first moment a content query has anything in it',
    },
    {
      label: 'Checked as part of the parent',
      detail: 'Parent injectors, parent styles, parent change detection',
      tone: 'good',
    },
  ];

  /** The eager-instantiation trap. */
  protected readonly eagerSample = `// Accordion's template:
//   @if (open()) {
//     <div class="body"><ng-content /></div>
//   }

<app-accordion [open]="false">
  <app-sales-chart />   <!-- fetches 50k rows on init -->
</app-accordion>

// The accordion starts closed and nobody opens it.
// Does SalesChart fetch anything?`;

  // ── One projected node, many iterations ───────────────────────────────────

  /** Sample: the predict prompt — a bare `<ng-content>` dropped inside a `@for`. */
  protected readonly repeatedSlotSample = `// repeater.html
@for (row of rows; track row) {
  <div class="row"><ng-content /></div>
}

// parent:
<app-repeater [rows]="[1, 2, 3]">
  <span>Static content</span>
</app-repeater>`;

  /** The reveal for {@link repeatedSlotSample}. */
  protected readonly repeatedSlotAnswer =
    'Only the first row. `<ng-content>` relocates the ONE `<span>` the parent already built — it never ' +
    'instantiates it per iteration, because it has no template of its own to stamp out, only an existing ' +
    'node to move. There is exactly one `<span>` in existence, and a real DOM node can only be attached to ' +
    'one place at a time, so it lands wherever the loop reaches first and the other two rows render an ' +
    'empty `<div class="row">`. The fix is to stop projecting content and start projecting a ' +
    '**blueprint** instead: accept a `TemplateRef` input and stamp it out fresh, once per row, with ' +
    '`NgTemplateOutlet` — the subject of the next lesson.';

  /** Sample: the fix — stamp a `TemplateRef` per row instead of relocating one node. */
  protected readonly repeatedSlotFixSample = `// repeater.html — stamp a blueprint per row instead
@for (row of rows; track row) {
  <ng-container [ngTemplateOutlet]="rowTemplate" [ngTemplateOutletContext]="{ $implicit: row }" />
}

// parent:
<app-repeater [rows]="[1, 2, 3]">
  <ng-template #rowTemplate let-row>
    <span>Row {{ row }}</span>
  </ng-template>
</app-repeater>`;

  /** Line-by-line walkthrough of {@link repeatedSlotFixSample}. */
  protected readonly repeatedSlotFixNotes: CodeNote[] = [
    {
      line: 3,
      text: "`ngTemplateOutlet` takes a `TemplateRef` and creates a **fresh embedded view** from it every time Angular runs this line — the opposite of `<ng-content>`'s one-node relocation. `ngTemplateOutletContext` hands each stamped-out copy its own `row`.",
    },
    {
      line: 8,
      text: "`<ng-template>` compiles to nothing by itself — it is a blueprint, never a rendered node. The parent hands over instructions this time, not an already-built `<span>`. `let-row` destructures the context object's `$implicit` key bound on line 3 — the exact mechanism `@for`'s own row variable uses under the hood.",
    },
  ];

  // ── The trap, again: two bare slots vs named slots ────────────────────────

  /** Sample: the wrong side of the projection-vs-broadcast comparison. */
  protected readonly twoBareSlotsSample = `template: \`
  <ng-content />
  <ng-content />
\`
// The SECOND one never receives anything —
// the first bare slot already claimed every
// unmatched node the moment it appeared.`;

  /** Sample: the right side — named slots, nothing left as an unlabelled catch-all. */
  protected readonly namedSlotsSample = `template: \`
  <ng-content select="[a]" />
  <ng-content select="[b]" />
\`
// Now both fire — neither is a catch-all,
// so each slot claims only what actually
// matches ITS OWN selector.`;

  // ── Choosing a query ───────────────────────────────────────────────────────

  /** Choices for the query-type check. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'A timing problem — `viewChild` resolves too late for projected nodes',
      why: 'Timing is a real concern with queries generally, but not the issue here. It would not matter how long you waited: a view query is scanning a different tree.',
    },
    {
      text: "The nodes are in the parent's view, so a view query never sees them",
      correct: true,
      why: "A `viewChild` searches the component's **own** template — the markup you wrote inside its `@Component`. Projected nodes were compiled into the parent's template and merely relocated into a slot, so they were never part of the child's view to begin with. `contentChild` is the query that looks at what came in from outside. The whole distinction reduces to one question: did **this** component's template contain that node?",
    },
    {
      text: 'Content queries need `{ descendants: true }` and view queries do not',
      why: '`descendants` controls how deep a query looks, and it applies to both kinds. It cannot make a view query cross into a tree it does not search.',
    },
    {
      text: 'The element needs a template reference variable before any query can find it',
      why: 'A `#ref` is one way to identify a target, but a query can just as well take a directive or component type. Adding one would not help — the view query still would not be looking in the right place.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Why does my child component's CSS not style the projected content?",
      a: "Because view encapsulation attaches style scoping attributes at compile time, based on which component's template a node came from — and these nodes came from the parent's. So the parent's styles apply and the child's do not. If the child genuinely needs to style what it hosts, `::ng-deep` works but is deprecated and leaks; the better answers are a CSS custom property the child sets and the projected content reads, or styling the wrapper element the child does own.",
    },
    {
      q: 'What is the difference between `ng-content` and `NgTemplateOutlet`?',
      a: '`ng-content` is a hole: the parent fills it once, eagerly, and the child decides only where the hole is. A `TemplateRef` is a blueprint the child can stamp zero times, once, or once per row, with data the child supplies. If you need the content more than once or need to hand it a value, `ng-content` cannot do it — that is the whole reason both APIs exist.',
    },
    {
      q: 'Can I have two `<ng-content>` without a `select`?',
      a: 'You can write it, and the second one will be empty. Projection is a distribution, not a broadcast: each projected node goes to exactly one slot, and the first matching default slot claims everything unmatched. If you want the same content in two places, you want a `TemplateRef` and two outlets.',
    },
    {
      q: 'When is `ngProjectAs` actually needed?',
      a: 'When the node you want to project is a wrapper that cannot carry the selector the child is matching on. The usual case is grouping several elements in an `<ng-container>` so they travel to one slot together — the container has no tag or class of its own to match, so `ngProjectAs` tells Angular to treat it as though it did.',
    },
    {
      q: 'Does `contentChildren()` update when the projected content changes?',
      a: "Yes — it returns a signal, so a `@for` in the parent adding a tab makes the child's `labels()` grow, and anything computing from it recalculates. That is the substantive upgrade over the old `@ContentChildren`, which handed you a `QueryList` you had to subscribe to and remember to unsubscribe from.",
    },
  ];
}
