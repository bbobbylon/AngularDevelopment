import { Component, computed, signal } from '@angular/core';
import { httpResource, type HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * A post from the demo API — the shape `httpResource<Post>` resolves to.
 */
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: `httpResource()` — `resource()` wired to `HttpClient`, and
 * specifically what that wiring buys beyond less boilerplate: three signals
 * plain `resource()` doesn't have, a structured `HttpErrorResponse` instead of
 * a bare `Error`, transparent interceptor participation, and a request that a
 * test can actually intercept and flush.
 *
 * ## Presentation
 *
 * Follows the brain-friendly shape from `expert/change-detection` (the
 * reference implementation): pose the problem before naming it, an analogy
 * before the vocabulary, then the same idea in several modes.
 *
 * ## This lesson assumes `resource()` is already known
 *
 * `intermediate/resource-api` already teaches the base mental model this page
 * leans on without re-deriving it — the `loading`-vs-`reloading` distinction,
 * `value()` throwing in the `error` state, the reactive-URL rule (a signal
 * must be *read inside* the factory), and the GET-vs-mutation caveat. This
 * page opens with an explicit link back rather than repeating any of that, and
 * spends its depth on what's specific to the HTTP flavour.
 *
 * ## Why this lesson is allowed exactly one live `httpResource()`, where `resource-api` has none
 *
 * `resource-api`'s own class doc explains, source-verified, why it carries no
 * live `httpResource()` panel: `HttpResourceImpl` opens a `PendingTasks` entry
 * for the duration of a request, and `lessons.smoke.spec.ts` mounts every
 * lesson with `provideHttpClientTesting()` and never flushes a captured
 * request — so a field-initializer `httpResource()` that fires immediately
 * would leave that task open forever and hang the smoke test for whichever
 * lesson tried it.
 *
 * {@link post} below is real, live, field-initialized `httpResource()` — and
 * is safe anyway, because its request factory ({@link postId}) defaults to
 * `undefined`. Returning `undefined` from a request factory is the documented
 * idle mechanism: no request is sent, no `PendingTasks` entry opens, and
 * `lessons.smoke.spec.ts` mounts this component, calls `detectChanges` and
 * `whenStable`, and finds nothing pending — because nothing ever clicked
 * {@link loadValid} or {@link loadMissing}. That idle default is simultaneously
 * this lesson's central teaching device (see the "idle" section below) and the
 * mechanism that makes it safe to demonstrate live at all. Every OTHER
 * `httpResource()` shape on this page ({@link requestFormSample},
 * {@link testingSample}) is deliberately kept as an annotated string, never a
 * real class field — the same discipline `resource-api` uses for its own
 * `httpResourceSample`.
 */
@Component({
  selector: 'app-lesson-http-resource',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './http-resource.css',
  templateUrl: './http-resource.html',
})
export class HttpResourceLesson {
  /**
   * Which post to load, or `undefined` for "nothing yet."
   *
   * `undefined` is not a placeholder value here — it is the actual idle
   * signal the request factory below checks for. See the class doc for why
   * that is also what keeps this lesson's smoke test from hanging.
   */
  protected readonly postId = signal<number | undefined>(undefined);

  /**
   * The one real, live `httpResource()` on this page.
   *
   * Idle until {@link postId} holds a real id — see the class doc.
   */
  protected readonly post = httpResource<Post>(() =>
    this.postId() === undefined
      ? undefined
      : `https://jsonplaceholder.typicode.com/posts/${this.postId()}`,
  );

  /**
   * `content-type` off the live response — the one response header
   * `jsonplaceholder.typicode.com` reliably exposes cross-origin. See the FAQ
   * for why most custom headers would NOT show up this easily.
   */
  protected readonly contentType = computed(() => this.post.headers()?.get('content-type') ?? '—');

  /**
   * `Resource.error` is typed as plain `Error`, even on `HttpResourceRef` — the
   * interface isn't specialised for HTTP. At runtime it's always the
   * `HttpErrorResponse` the loader actually threw, so this computed does the
   * one cast the whole page needs, once, instead of scattering `$any()` or
   * inline casts through the template. See the FAQ for why the type stays
   * this way.
   */
  protected readonly postError = computed(() => this.post.error() as HttpErrorResponse | undefined);

  /** Points {@link postId} at a real post (1–100 all exist on this API). */
  protected loadValid(id: number): void {
    this.postId.set(id);
  }

  /** Points {@link postId} at an id this API genuinely doesn't have — a real 404, not a simulated one. */
  protected loadMissing(): void {
    this.postId.set(9999);
  }

  /** Back to idle — `postId` becomes `undefined` again, same as at mount. */
  protected reset(): void {
    this.postId.set(undefined);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The HTTP track, for the "you are here" rail. This is the last stop in it. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Basics', id: 'http-basics' },
    { label: 'CRUD', id: 'http-crud' },
    { label: 'Interceptors', id: 'http-interceptors' },
    { label: 'httpResource()' },
  ];

  /** The journey one request actually takes — the concrete shape "wired to HttpClient" buys. */
  protected readonly requestJourney: FlowStep[] = [
    { label: 'A signal changes', detail: 'postId.set(2)' },
    { label: 'Factory re-runs', detail: 'returns a new URL string' },
    {
      label: 'HttpClient sends it',
      detail: 'through every registered interceptor',
      tone: 'accent',
    },
    { label: 'Server responds', detail: 'or the app never leaves the browser, under a test' },
    { label: 'Signals update', detail: 'value(), status(), headers() together', tone: 'good' },
  ];

  /**
   * The mailroom analogy, staged as dialogue — what "wired to HttpClient"
   * concretely buys over a hand-rolled `resource()` + `fetch()` loader.
   */
  protected readonly mailroomTalk: BubbleTurn[] = [
    {
      who: 'resource() + fetch()',
      says: 'I walk my own package to the post office. I fill out my own customs form (`res.ok`), and if it gets rejected, I find out by prying the box back open myself.',
    },
    {
      who: 'httpResource()',
      says: "I drop the same package in the company mailroom instead — `HttpClient`. Every package that goes through there automatically clears the building's checkpoints.",
    },
    {
      who: 'You',
      says: 'What checkpoints?',
    },
    {
      who: 'httpResource()',
      says: 'Interceptors. A guard stamps an auth header on the way out, a retry desk re-sends a dropped package — and I never had to know either policy exists.',
    },
    {
      who: 'You',
      says: 'And if the mailroom rejects it?',
    },
    {
      who: 'httpResource()',
      says: 'I hand you a proper rejection slip — `HttpErrorResponse`, with a status code and a reason — instead of a blank box you have to guess about.',
    },
  ];

  /**
   * Why the live demo above is safe to auto-mount, staged as the actual
   * negotiation between "wanting a live demo" and "not hanging a test."
   */
  protected readonly idleTalk: BubbleTurn[] = [
    {
      who: 'This lesson',
      says: 'I want a genuinely live httpResource() panel, not another static code sample.',
    },
    {
      who: 'lessons.smoke.spec.ts',
      says: 'Fine by me — but if it fires a real request the moment this page mounts, I will never flush it, and I will wait for stability forever.',
    },
    { who: 'This lesson', says: 'So it only fires once a reader actually clicks something?' },
    {
      who: 'lessons.smoke.spec.ts',
      says: "Exactly. Return undefined from the factory and there's no request and no pending task — nothing for me to wait on. Mount, render, done.",
    },
  ];

  /** Line-by-line walkthrough of the live {@link post} field, shown as a matching annotated sample. */
  protected readonly idleFactorySample = `protected readonly postId = signal<number | undefined>(undefined);

protected readonly post = httpResource<Post>(() =>
  this.postId() === undefined ? undefined : \`https://jsonplaceholder.typicode.com/posts/\${this.postId()}\`,
);`;

  /** Notes for {@link idleFactorySample}. */
  protected readonly idleFactoryNotes: CodeNote[] = [
    {
      line: 1,
      text: "`postId` starts as `undefined` — not `0`, not `null`. That specific value is what the factory below checks for, and it's the reason this exact page's own automated smoke test doesn't hang: no id yet means no URL, which means no request.",
    },
    {
      line: 3,
      text: "`httpResource()` takes a **function**, not a string. Angular re-runs it whenever a signal it reads changes — reading `this.postId()` on the next line is what registers `postId` as a dependency, the same reactive rule `resource()`'s `params` uses.",
    },
    {
      line: 4,
      text: "The ternary is the whole safety mechanism. `postId() === undefined` → the factory itself returns `undefined` → `status()` stays `'idle'` and nothing is ever sent. Only a real id produces a real URL string worth fetching.",
    },
  ];

  /**
   * What `HttpResourceRef` adds on top of the base `Resource` contract
   * `resource-api` already covers.
   */
  protected readonly newSignals: { heading: string; kicker: string; body: string }[] = [
    {
      heading: 'headers()',
      kicker: 'Signal<HttpHeaders | undefined>',
      body: 'The response headers, once a response arrives. Only headers the server actually exposes cross-origin show up for a cross-origin call — see the FAQ.',
    },
    {
      heading: 'statusCode()',
      kicker: 'Signal<number | undefined>',
      body: "The numeric HTTP status of a successful response — 200, 201, 204. Read a failure's status off error()?.status instead; see the error-handling section.",
    },
    {
      heading: 'progress()',
      kicker: 'Signal<HttpProgressEvent | undefined>',
      body: "Only populated when the request opts in with reportProgress: true — loaded/total byte counts for a large upload or download's progress bar.",
    },
  ];

  /** Sample: the request-object form — NOT a live field, purely illustrative (see class doc). */
  protected readonly requestFormSample = `protected readonly page = signal(1);

protected readonly posts = httpResource<Post[]>(
  () => ({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: { _page: this.page(), _limit: 5 },
    headers: { 'X-Lesson': 'http-resource' },
  }),
  { defaultValue: [] },
);`;

  /** Notes for {@link requestFormSample}. */
  protected readonly requestFormNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The generic `<Post[]>` is what `posts.value()` is typed as — the PARSED result, after any `parse` option below has run.',
    },
    {
      line: 4,
      text: 'Same rule as the simple URL form: the whole request is built by one function, and Angular tracks every signal read while building it.',
    },
    {
      line: 6,
      text: "This `params` is query-string parameters — `?_page=1&_limit=5` — appended for you. It's a different `params` from plain `resource()`'s option of the same name; don't conflate them.",
    },
    {
      line: 7,
      text: 'Static or computed headers go here as a plain record — the request-object form is how you reach anything beyond a bare URL: headers, a body, `withCredentials`, a `timeout`.',
    },
    {
      line: 9,
      text: '`defaultValue: []` means `posts.value()` is `Post[]`, never `Post[] | undefined` — a template can `@for` over it immediately, no `hasValue()` guard needed for "nothing yet."',
    },
  ];

  /** Sample: flushing a request `httpResource()` fired, from a component test. */
  protected readonly testingSample = `it('flushes the request httpResource() fired', () => {
  TestBed.configureTestingModule({
    imports: [PostViewer],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(PostViewer);
  fixture.componentInstance.postId.set(1);
  fixture.detectChanges();

  const req = TestBed.inject(HttpTestingController).expectOne(
    'https://jsonplaceholder.typicode.com/posts/1',
  );
  req.flush({ id: 1, title: 'Mock title', body: '…', userId: 1 });

  fixture.detectChanges();
  expect(fixture.componentInstance.post.value()?.title).toBe('Mock title');
});`;

  /** Notes for {@link testingSample}. */
  protected readonly testingNotes: CodeNote[] = [
    {
      line: 4,
      text: "The exact same testing backend this app's own `lessons.smoke.spec.ts` provides to every lesson. It intercepts the request instead of letting it reach the network — which means something now has to tell it what to respond with.",
    },
    {
      line: 7,
      text: 'Setting `postId` to a real value is what makes the factory return a real URL and fire a request — the identical trigger the live demo above uses.',
    },
    {
      line: 10,
      text: "`expectOne(url)` asserts exactly one pending request matches that URL, and throws immediately if none does — which is how a test catches 'I forgot to actually trigger it' as a hard failure instead of a silent no-op.",
    },
    {
      line: 13,
      text: "`flush()` supplies the response body directly, with no real network round-trip. This is the exact step neither the live demo's real request nor an un-clicked httpResource() in a mounted lesson ever gets — which is why an eagerly-firing one hangs `whenStable()` instead of resolving.",
    },
  ];

  /** The self-test on the [object Object] trap — reading error() correctly. */
  protected readonly errorQuizOptions: QuizOption[] = [
    {
      text: '`{{ post.error() }}` — bind it straight into the template.',
      why: 'This renders `[object Object]`. `error()` holds a whole `HttpErrorResponse` instance, not a string — interpolating an object falls back to its default `toString()`, which is exactly `[object Object]`.',
    },
    {
      text: '`{{ post.error()?.status }}` and `{{ post.error()?.error }}`, shown separately.',
      correct: true,
      why: '`.status` is the numeric HTTP status (`404`), and `.error` is the parsed response body — together a real, usable message instead of a stringified object. `HttpErrorResponse` also carries `.statusText` and `.url` if you need them.',
    },
    {
      text: "You can't read it at all — `error()` throws once the resource is in the error state, same as `value()`.",
      why: "That's `value()`, not `error()`. Reading `value()` while `status()` is `'error'` throws — but `error()` is exactly the safe, always-readable way to find out why it failed.",
    },
    {
      text: '`{{ post.error().message }}`.',
      why: '`HttpErrorResponse.message` is typically a generic string like "Http failure response for …" — the useful, server-sent detail lives on `.error`, and the status code on `.status`.',
    },
  ];

  /** The self-test on GET-shaped-by-design — a like button is not a read. */
  protected readonly mutationQuizOptions: QuizOption[] = [
    {
      text: "Yes — httpResource() supports POST, so this is exactly what it's for.",
      why: "Supporting `method: 'POST'` in the request shape doesn't mean every POST belongs here. A resource re-issues its request whenever a signal it reads changes — right for a *read* that happens to depend on that signal, wrong for a *command* that should fire exactly once per click.",
    },
    {
      text: 'No — call http.post() directly from the click handler instead.',
      correct: true,
      why: 'Exactly. A resource is state kept in sync with its inputs; a like is an action that happens once, on a click. Wiring it as a resource risks it firing again for reasons that have nothing to do with the click at all — any other signal read inside the same factory changing is enough.',
    },
    {
      text: 'No — httpResource() can only send GET requests.',
      why: 'Not a capability limit — `HttpResourceRequest.method` can genuinely be overridden. The problem is semantics, reads vs commands, not what the API technically allows.',
    },
    {
      text: "It doesn't matter — httpResource() de-duplicates identical in-flight requests automatically.",
      why: 'There is no such de-duplication. Each dependency change is a fresh request; this option describes a safety net that does not exist.',
    },
  ];

  /** Predict: what the page shows before any click. */
  protected readonly idlePredictPrompt =
    "Before you click anything below, what does post.status() read, and what shows up in the browser's Network tab?";
  protected readonly idlePredictAnswer =
    "`'idle'`, and nothing in the Network tab — no request was ever sent, because the factory above returned `undefined`. That is not a coincidence: it is the exact mechanism that lets this be a genuinely live demo rather than another static code sample.";

  /** Predict: what Reset actually does to the displayed value. */
  protected readonly resetPredictPrompt =
    "You load post #1 successfully, then click Reset, which sets postId back to undefined. Does the post stay on screen while it 'waits', or does it disappear?";
  protected readonly resetPredictAnswer =
    'It disappears — value() reverts to undefined, because no defaultValue is set here. Going back to undefined isn\'t "no change"; it\'s a real transition back to idle, and idle is treated like any other request change: the previous resolved value is dropped, not dimmed.';

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'post.error() is really an HttpErrorResponse — why does TypeScript only offer me Error?',
      a: "Resource<T>'s error signal is typed as plain Error, and HttpResourceRef never overrides it — the interface isn't specialised for HTTP. At runtime it's genuinely always the HttpErrorResponse the loader threw, so a cast (`error() as HttpErrorResponse`) is the honest fix, not a workaround for a bug. This lesson does that cast once, in postError, rather than repeating it at every call site.",
    },
    {
      q: 'Do I still need provideHttpClient() somewhere for httpResource() to work?',
      a: 'Yes — exactly the same requirement as injecting `HttpClient` directly. `httpResource()` calls `inject(HttpClient)` internally, so without a provider in scope it throws immediately (`NG0201`), not a silent failure you discover later.',
    },
    {
      q: 'Can headers() see every response header the server sent?',
      a: "Only the ones the server explicitly exposes for cross-origin reads via `Access-Control-Expose-Headers`, plus a small set browsers always allow through (`Content-Type`, `Content-Length`, a few others) — that's a CORS rule, not an Angular one. This lesson's live demo reads `content-type` because it happens to be one of those; a custom header from a real API often silently reads `null` until the server opts in.",
    },
    {
      q: 'What happens to the in-flight request if the component is destroyed first?',
      a: "It's cancelled, not left running. `HttpResourceRef` is built on the same `ResourceImpl` that reads `DestroyRef` to know when to clean up — and because the request goes through real `HttpClient` rather than a raw `fetch()` you forgot to abort, cancellation actually stops the network call, not just the result from being used.",
    },
    {
      q: 'I set defaultValue — does that rescue me if the request fails?',
      a: "No, and this is worth double-checking against what `resource-api` already found for plain `resource()`: `defaultValue` covers `idle` and `loading` only. Once `status()` is `'error'`, `value()` still throws regardless of `defaultValue` — `error()` and `hasValue()` are the safe reads in that state.",
    },
  ];
}
