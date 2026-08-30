import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  styleUrl: './testing-services-http.css',
  templateUrl: './testing-services-http.html',
})
export class TestingServicesHttp {
  /**
   * What one `expectOne` / `flush` pair actually does. Worth drawing because the
   * synchronous feel of these tests is genuinely strange the first time — there
   * is no network, no timer and no promise anywhere in the loop, so every step
   * below happens on the same tick.
   */
  protected readonly loop = [
    {
      label: 'The test calls `.subscribe()`',
      detail: 'Nothing happened before this. The observable was cold',
      tone: 'accent' as const,
    },
    {
      label: 'Interceptors run for real',
      detail: 'Headers, auth tokens, retries — the whole chain, unmocked',
    },
    {
      label: 'The testing backend queues the request',
      detail: 'Instead of sending it. It now sits on a rail, waiting',
    },
    {
      label: '`expectOne(...)` takes it off the rail',
      detail: 'And fails loudly if there are zero matches, or two',
    },
    {
      label: '`req.flush(body)` pushes a response back up',
      detail: 'Back through the interceptors, into your subscribe callback',
    },
    {
      label: 'Assertions run — synchronously',
      detail: 'No `tick`, no `await`, no `done`. The value is already there',
      tone: 'good' as const,
    },
    {
      label: '`http.verify()` checks the rail is empty',
      detail: 'Any request nobody asserted on is now a test failure',
      tone: 'good' as const,
    },
  ];

  /** The test that passes while asserting nothing. */
  protected readonly silentSample = `it('fetches a user', () => {
  api.getUser(1).subscribe((u) => {
    expect(u.name).toBe('Nobody At All');
  });

  http.expectOne('/api/users/1');
  // ...and that is the whole test.
});

// The name is deliberately wrong.
// Does this test pass or fail?`;

  /** Choices for the cold-observable check. */
  protected readonly coldOptions = [
    {
      text: 'The URL must be wrong — `expectOne` matched nothing',
      why: 'The natural first guess, and worth ruling out with `http.match(() => true)` to dump every queued request. But in this case the queue is genuinely empty, so no URL would have matched.',
    },
    {
      text: 'No request was ever made, because nothing subscribed',
      correct: true,
      why: "`HttpClient` returns a **cold** observable: it is a description of a request, not a request. Calling `api.getUser(1)` and throwing away the result sends nothing at all, so the testing backend's queue is empty and `expectOne` correctly reports zero matches. Add `.subscribe()` — even an empty one — and the request appears. This is the same coldness that makes `switchMap` able to cancel an in-flight call, so it is not a testing quirk; you are just seeing it plainly for once.",
    },
    {
      text: '`provideHttpClientTesting()` was listed before `provideHttpClient()`',
      why: 'Order between those two does not matter — the testing provider overrides the backend either way. Leaving out `provideHttpClient()` entirely is a real error, but it produces a no-provider error, not an empty queue.',
    },
    {
      text: 'The request is queued asynchronously and `expectOne` ran too early',
      why: 'There is nothing async in the testing backend — that is the point of it. A request created on this tick is available to `expectOne` on this tick.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'When should I use `req.flush(body, { status: 500 })` versus `req.error(...)`?',
      a: '`flush` with an error status simulates the **server answering badly** — it reached your API, your API said no. `req.error(new ProgressEvent("error"))` simulates the request never getting there: offline, DNS, CORS. Both arrive at your code as an `HttpErrorResponse`, but the `status` differs (0 for the network case), and any code that branches on status codes needs a test for each.',
    },
    {
      q: 'Do I have to call `http.verify()`?',
      a: 'Nothing forces you, and that is exactly why you should. `verify()` in `afterEach` is what catches the two quietest failures in this whole area: a request your code fired that you never asserted on, and a test whose assertions live inside a callback that never ran. Without it those tests are green and empty.',
    },
    {
      q: 'Should I mock my own service, or the HTTP layer beneath it?',
      a: 'Mock the HTTP layer when the service under test *is* the thing you care about — you want its URL building, its error mapping and its caching exercised for real. Mock the service itself when you are testing something above it, like a component. A common smell is a service test that mocks the service, which proves only that your mock works.',
    },
    {
      q: 'Why do my interceptors run in these tests? Should they?',
      a: 'Yes, and it is deliberate. `provideHttpClientTesting` replaces only the **backend** — the last link in the chain — so everything above it is the real implementation. That means an auth interceptor really does attach its header, and you can assert on it via `req.request.headers`. If you want a service test with no interceptors, register the client without them for that suite.',
    },
    {
      q: 'Is marble testing worth learning?',
      a: 'For most application code, no. `fakeAsync` with `tick()`, or just subscribing and asserting, covers nearly everything and reads far better in a review. Marbles earn their keep when the *timing* is the behaviour under test — a debounce, a retry with backoff, a race between two streams — because there the diff a failing marble test prints tells you exactly which frame went wrong.',
    },
  ];

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
