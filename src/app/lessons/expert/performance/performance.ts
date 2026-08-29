import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  styleUrl: './performance.css',
  templateUrl: './performance.html',
})
export class Performance {
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
