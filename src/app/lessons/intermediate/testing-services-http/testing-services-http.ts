import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The five areas of service and HTTP testing this lesson covers.
 */
type Tab = 'pure' | 'http' | 'interceptors' | 'rxjs' | 'patterns';

/**
 * Lesson: Testing Services & HTTP — the half of testing that needs no DOM.
 *
 * Five tabs:
 *
 * - **Pure services** — a service with no dependencies is just a class; test it
 *   by `new`-ing it, no `TestBed` required.
 * - **HTTP controller** — `provideHttpClientTesting` and
 *   `HttpTestingController`: `expectOne`, `flush`, and `verify` to prove no
 *   request went unasserted.
 * - **Interceptors** — testing them through the real `HttpClient` rather than
 *   by calling the function directly, since the chain is the thing under test.
 * - **RxJS** — marble testing and the simpler subscribe-and-assert approach,
 *   plus why a test that forgets to unsubscribe can pass and still leak.
 * - **Patterns** — arranging tests so the assertions read as requirements.
 *
 * @see intermediate/testing-components — the component half.
 */
@Component({
  selector: 'app-lesson-testing-services-http',
  imports: [RouterLink],
  styleUrl: './testing-services-http.css',
  templateUrl: './testing-services-http.html',
})
export class TestingServicesHttp {
  /**
   * Which tab is showing.
   */
  protected readonly activeTab = signal<Tab>('pure');
  /**
   * The tab definitions, in reading order.
   */
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'pure', label: 'Pure Services' },
    { id: 'http', label: 'HTTP Controller' },
    { id: 'interceptors', label: 'Interceptors' },
    { id: 'rxjs', label: 'RxJS / Marbles' },
    { id: 'patterns', label: 'Patterns' },
  ];
}
