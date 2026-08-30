import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from './panel/panel';
import { TabLabel } from './tab-label/tab-label';
import { TabPanel } from './tab-panel/tab-panel';
import { TabGroup } from './tab-group/tab-group';
import { BadgeHost } from './badge-host/badge-host';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

// ── The lesson component ───────────────────────────────────────────────────────

/**
 * Lesson: Content Projection — letting the caller supply the markup.
 *
 * Covers `<ng-content />`, named slots via `select=`, fallback content, and the
 * content queries (`contentChild` / `contentChildren`) that let a component find
 * what was projected into it.
 *
 * The distinction that matters: projected content belongs to the **caller**, not
 * to the component rendering it. It is compiled in the caller's context, styled
 * by the caller's styles, and — as {@link TabGroup} shows — the receiving
 * component can only find it through a content query, never a view query.
 */
@Component({
  selector: 'app-lesson-content-projection',
  standalone: true,
  imports: [
    RouterLink,
    Panel,
    TabGroup,
    TabLabel,
    TabPanel,
    BadgeHost,
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
  /**
   * Who creates projected nodes, and when. Laid out because every surprising thing
   * about projection — the eager instantiation, the injection context, why
   * `viewChild` cannot see it — follows from the first step: the nodes belong to
   * the parent's view, and `<ng-content>` only relocates them.
   */
  protected readonly journey = [
    {
      label: 'Compiled into the *parent* view',
      detail: 'The projected markup is part of the parent template, not the child',
      tone: 'accent' as const,
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
      tone: 'good' as const,
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

  /** Choices for the query-type check. */
  protected readonly queryOptions = [
    {
      text: 'A timing problem — `viewChild` resolves too late for projected nodes',
      why: 'Timing is a real concern with queries generally, but not the issue here. It would not matter how long you waited: a view query is scanning a different tree.',
    },
    {
      text: "The nodes are in the parent's view, so a view query never sees them",
      correct: true,
      why: "A `viewChild` searches the component's *own* template — the markup you wrote inside its `@Component`. Projected nodes were compiled into the parent's template and merely relocated into a slot, so they were never part of the child's view to begin with. `contentChild` is the query that looks at what came in from outside. The whole distinction reduces to one question: did *this* component's template contain that node?",
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
  protected readonly questions = [
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
