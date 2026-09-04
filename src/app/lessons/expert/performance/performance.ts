import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Faq,
  type FaqItem,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * The five angles this lesson takes on performance. Tabbed rather than
 * sequential because they are independent concerns — you arrive here with a
 * specific problem, not to read the topic end to end.
 */
type Tab = 'load' | 'runtime' | 'webvitals' | 'images' | 'profiling';

/**
 * Lesson: Performance Optimization — making an Angular app fast, and knowing
 * which kind of slow you have.
 *
 * Organised as five tabs, because "slow" is at least five different problems
 * with different fixes:
 *
 * - **Load time** — bundle size, lazy routes, `@defer`, preloading strategies.
 * - **Runtime** — change detection cost, `OnPush`, signals, `track` on `@for`,
 *   and the pure-pipe against method-call-in-template question.
 * - **Web Vitals** — LCP, INP and CLS: what they measure and what moves them.
 * - **Images** — `NgOptimizedImage`, `priority`, responsive `srcset`.
 * - **Profiling** — the Angular DevTools profiler and Chrome performance
 *   traces, i.e. how to find out which of the above you actually have.
 *
 * The ordering is deliberate: measuring comes last on the page but first in
 * practice, and the lesson says so.
 */
@Component({
  selector: 'app-lesson-performance',
  imports: [RouterLink, Faq, Predict, Quiz, Remember],
  styleUrl: './performance.css',
  templateUrl: './performance.html',
})
export class Performance {
  /**
   * The OnPush mutation trap, used by the ask-before-telling block.
   *
   * Kept in the class rather than inline in the template because the snippet is
   * full of `{`/`}`, which Angular's parser reads as control-flow syntax inside
   * an attribute value.
   */
  protected readonly onPushTrapSample = `// Parent — default change detection, plain array.
@Component({ template: '<app-row-list [rows]="rows" /> <button (click)="add()">Add</button>' })
export class Parent {
  rows = [{ id: 1, label: 'first' }];   // a plain array, NOT a signal

  add() {
    this.rows.push({ id: 2, label: 'second' });   // mutate in place
  }
}

// Child — OnPush.
@Component({
  selector: 'app-row-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '@for (r of rows; track r.id) { <p>{{ r.label }}</p> }',
})
export class RowList {
  @Input() rows: Row[] = [];
}`;

  /**
   * The self-test. Every wrong answer is a real belief people hold about
   * `OnPush` — that it re-checks on a timer, that it deep-compares, or that
   * `@for`'s `track` would notice the new element on its own.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'It renders one row. `push()` mutates the array without changing its reference, so the OnPush child is never marked dirty.',
      correct: true,
      why: 'Exactly. OnPush compares inputs by reference (`===`). The array object is the same object before and after `push()`, so as far as Angular is concerned nothing changed.',
    },
    {
      text: 'It renders two rows — `@for` with `track r.id` notices the new id and adds a row.',
      why: '`track` only decides how to *reconcile* rows once the template is re-rendered. It cannot trigger that re-render; if the component is never checked, the `@for` never runs again.',
    },
    {
      text: 'It renders two rows, just one change-detection tick later than usual.',
      why: 'There is no delayed catch-up pass. An OnPush component that is never marked dirty is skipped on every tick, forever — the stale row survives indefinitely.',
    },
    {
      text: 'It renders two rows — Angular deep-compares object inputs to detect changes like this.',
      why: 'Angular never deep-compares. Deep equality on every input on every tick would cost far more than the change detection it is meant to save.',
    },
  ];

  /**
   * The doubts that survive a first read of any performance guide.
   */
  protected readonly questions: readonly FaqItem[] = [
    {
      q: 'Should I just put `OnPush` on every component and be done?',
      a: 'Close to it, yes — if your state is signals. With signals a read inside the template registers a dependency, so OnPush components still update automatically and the strategy costs you nothing. The trap is OnPush plus *mutable* plain objects, which is exactly the bug in the puzzle above.',
    },
    {
      q: 'Is a slow app usually a change-detection problem?',
      a: 'Usually not. Most "slow" apps are shipping too much JavaScript, or blocking on a waterfall of requests, or rendering a 5,000-row table with no virtualisation. Change detection is real but it is rarely the first thing a profile shows you — which is why measuring comes first.',
    },
    {
      q: "What counts as fast enough? I don't have a number to aim at.",
      a: 'Use the Core Web Vitals thresholds: LCP under 2.5s, INP under 200ms, CLS under 0.1. They are what Google grades you on, they map to things users notice, and they give you a place to stop — which matters, because performance work has no natural end.',
    },
    {
      q: 'Does `@defer` help if the deferred component is above the fold?',
      a: "No, and it can hurt. `@defer` moves work *later*; if the user sees the thing immediately, later is worse. It's for below-the-fold widgets, heavy charts, modals, and anything behind an interaction.",
    },
    {
      q: 'Is zoneless actually faster, or just newer?',
      a: 'Genuinely faster, and for a specific reason: zone.js patches every async API in the browser and triggers a check after each one, including ones that changed nothing. Zoneless checks only when a signal you actually rendered changed. The busier your app, the bigger the gap.',
    },
  ];

  /**
   * Which tab is showing.
   */
  protected readonly activeTab = signal<Tab>('load');
  /**
   * The tab definitions, in reading order.
   */
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'load', label: 'Load Time' },
    { id: 'runtime', label: 'Runtime' },
    { id: 'webvitals', label: 'Web Vitals' },
    { id: 'images', label: 'NgOptimizedImage' },
    { id: 'profiling', label: 'Profiling' },
  ];
}
