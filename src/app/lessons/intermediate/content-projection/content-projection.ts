import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from './panel/panel';
import { TabLabel } from './tab-label/tab-label';
import { TabPanel } from './tab-panel/tab-panel';
import { TabGroup } from './tab-group/tab-group';
import { BadgeHost } from './badge-host/badge-host';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
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
 * ## Presentation
 *
 * Migrated to the brain-friendly layer — see `shared/brain/` and
 * `src/app/lessons/expert/change-detection/change-detection.ts`, the reference
 * implementation this shape is copied from. The teaching order:
 *
 * 1. **Pose the problem before naming it.** A component author cannot write an
 *    input for "arbitrary markup" — the lesson opens on that impossibility, and
 *    on a napkin prediction about styling, before `<ng-content>` is named.
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
      text: "`templateUrl` points at a separate file — the one shown right below it, same convention as every lesson in this app.",
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
      text: "`AfterContentInit` — the lifecycle interface for the hook implemented on line 6. It exists specifically because content queries resolve **later** than view ones.",
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
      text: "The slot is matched against a **class** selector, `.badge`. An `<ng-container>` has no class of its own to offer it — exactly the problem `ngProjectAs` exists to solve.",
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
