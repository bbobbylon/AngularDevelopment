import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The five areas of component testing this lesson covers.
 */
type Tab = 'basics' | 'async' | 'signals' | 'mocking' | 'patterns';

/**
 * Lesson: Testing Components — `TestBed`, fixtures, and what a component test
 * should actually assert.
 *
 * Five tabs:
 *
 * - **Basics** — `TestBed.configureTestingModule`, `createComponent`,
 *   `detectChanges`, and querying with `DebugElement` against native DOM.
 * - **Async / fakeAsync** — `fakeAsync` + `tick`, `waitForAsync`, and
 *   `fixture.whenStable`; when each is the right tool.
 * - **Signals** — testing signal state and effects, including flushing them.
 * - **Mocking** — stub providers, spies, and mocking child components.
 * - **Patterns** — testing behaviour rather than implementation: assert what a
 *   user would observe, so a refactor that changes no behaviour does not break
 *   the suite.
 *
 * @see intermediate/testing-services-http — the non-component half.
 */
@Component({
  selector: 'app-lesson-testing-components',
  imports: [RouterLink],
  styleUrl: './testing-components.css',
  templateUrl: './testing-components.html',
})
export class TestingComponents {
  /**
   * Which tab is showing.
   */
  protected readonly activeTab = signal<Tab>('basics');
  /**
   * The tab definitions, in reading order.
   */
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'async', label: 'Async / fakeAsync' },
    { id: 'signals', label: 'Signals' },
    { id: 'mocking', label: 'Mocking' },
    { id: 'patterns', label: 'Patterns' },
  ];
}
