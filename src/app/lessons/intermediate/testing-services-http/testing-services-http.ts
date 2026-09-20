import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  type Layer,
  Layers,
} from '../../../shared/brain';
import { BrainPower, Chain, Receipt, type ReceiptRow, Scribble } from '../../../shared/shapes';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * Lesson: Testing Services & HTTP — the half of testing that needs no DOM.
 *
 * ## Shape: `receipt`
 *
 * The lesson opens on the itemised cost of a test that has been green for
 * eight months without ever running its own assertion: {@link silentTestBill}
 * bills one written assertion against zero executions, `app-scribble` names
 * the gap, and `app-compare` — relocated here from its original spot deeper
 * in the "full control over the network" section, which now leaves a callback
 * line instead of showing the identical `silentSample`/`fixedSample` pair
 * twice — shows the wrong test next to the fixed one. `app-chain` names the
 * five-step mechanism, `app-code-lab` annotates {@link fixedSample} line by
 * line, `app-brain-power` asks what `http.verify()` does and does not catch,
 * and the block's own quiz ({@link silentTestQuizOptions}) checks the
 * unflushed-and-unverified case directly — distinct from `coldOptions`
 * further down the page, which is a different bug (a cold observable never
 * subscribed to) than this block's silent-pass bug. See
 * `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and `docs/UI-DESIGN.md`
 * §9); shape copied from `expert/change-detection`, the reference implementation,
 * and from `intermediate/testing-components` — this lesson's other half, migrated
 * first and reused here as the closer structural template since both lessons share
 * an author, a subject area, and a "five areas, one chapter" rhythm.
 *
 * The teaching order:
 *
 * 1. **Pose the problem before naming the fix.** A test that has been green for
 *    months without ever running its own assertion is described — not shown yet —
 *    so the reader commits to "how could that possibly happen?" before any API
 *    arrives to answer it.
 * 2. **Analogy next.** Angular's `HttpTestingController` recast as a kitchen with no
 *    cook in it: `HttpClient` writes a ticket, the testing backend clips it to a
 *    rail, and *you* are the only thing that can take it off and send a plate back.
 *    That gives `expectOne` and `flush` somewhere to live before the words arrive.
 * 3. **Then the same idea in four modes** — a dialogue between the three actors, a
 *    step-by-step timeline of one `expectOne`/`flush` pair, a containment diagram
 *    of a request travelling through an interceptor chain, and annotated spec files
 *    for every area this lesson covers — because retention comes from redundancy
 *    across modes, not repetition in one.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing on this
 *    page assumes the reader can already read a `.spec.ts` file — annotating a test
 *    file matters exactly as much as annotating application code, since a test that
 *    silently asserts nothing is invisible to anyone who cannot read what it does.
 *
 * Five areas, covered top to bottom rather than behind tabs (dropped in this
 * migration, matching every other migrated lesson): pure services, the HTTP
 * controller, interceptors, RxJS/marbles, and the test patterns that survive a
 * refactor.
 *
 * @see intermediate/testing-components — the component half.
 */
@Component({
  selector: 'app-lesson-testing-services-http',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    BrainPower,
    Chain,
    Receipt,
    Scribble,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './testing-services-http.css',
  templateUrl: './testing-services-http.html',
})
export class TestingServicesHttp {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Testing track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Testing Components', id: 'testing-components' },
    { label: 'Testing Services & HTTP' },
  ];

  /** The shape block's itemised bill: what the silent test actually cost. */
  protected readonly silentTestBill: ReceiptRow[] = [
    { label: "CI runs where 'fetches a user' reported green", amount: '200+' },
    { label: 'assertions written inside the test', amount: '1' },
    { label: 'times that assertion has ever executed', amount: '0', tone: 'warn' },
  ];

  /** The shape block's receipt total — the number that should not add up. */
  protected readonly silentTestBillTotal: ReceiptRow = {
    label: 'bugs this test has ever caught',
    amount: '0',
  };

  /**
   * Line-by-line walkthrough of {@link fixedSample}, the shape block's
   * mechanism code-lab.
   */
  protected readonly fixedSampleNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Still cold until this fires. `.subscribe()` is what turns the description of a request into an actual one — nothing before this line has sent anything.',
    },
    {
      line: 3,
      text: 'The assertion. Identical to the broken version — the bug was never in this line.',
    },
    {
      line: 6,
      text: '`flush(...)` is the one addition that matters: it delivers a response synchronously, which is what makes the callback above — and the assertion inside it — actually run on this same tick.',
    },
    {
      line: 9,
      text: 'The seatbelt. If ANY expectOne() in this file is left unflushed when the test ends, verify() fails the suite outright instead of letting a forgotten request pass silently.',
    },
  ];

  /**
   * The shape block's quiz: the unflushed-and-unverified case, checked
   * directly against the receipt's own numbers.
   */
  protected readonly silentTestQuizOptions: QuizOption[] = [
    {
      text: 'It passes. The subscribe callback holding the assertion never fires, and nothing in the suite is set up to notice the request was left unhandled either.',
      correct: true,
      why: 'Exactly the bill at the top of the page: one assertion written, zero times executed. Without flush(), the callback never runs; without afterEach(() => http.verify()), nothing else in the suite is watching for an unhandled request either.',
    },
    {
      text: 'It fails immediately — expectOne() throws if the request is never flushed before the test function returns.',
      why: 'expectOne() only takes a matching request off the rail and hands it back; it never demands you do anything further with it. Nothing about calling it alone throws.',
    },
    {
      text: "It hangs until the test runner's default timeout expires.",
      why: 'There is no timer or promise anywhere in this loop — everything here is synchronous. A test with nothing to wait on cannot hang; it simply finishes, having checked nothing.',
    },
    {
      text: 'It passes on this run, but afterEach(() => http.verify()) catches it on the very next test.',
      why: "verify() isn't in this suite in the scenario as described — and even where it is present, it runs at the END of the SAME test, checked against that test's own unhandled requests, not a future one.",
    },
  ];

  /**
   * The kitchen analogy, staged as a three-way exchange. Three actors, three
   * jobs — far easier to keep straight as a conversation than as a paragraph
   * naming all three at once.
   */
  protected readonly kitchenTalk: BubbleTurn[] = [
    {
      who: 'HttpClient',
      says: "You called `api.getUser(1)` and subscribed. I just wrote a ticket — `GET /api/users/1` — and clipped it to the rail. Before that subscribe, there wasn't even a ticket to write.",
    },
    {
      who: 'The testing backend',
      says: "I caught it. It's sitting on my rail now, waiting — there's no kitchen behind me at all. You are the kitchen.",
    },
    { who: 'Your test', says: 'So `http.expectOne(...)` is me doing what, exactly?' },
    {
      who: 'The testing backend',
      says: 'Reading the ticket off the rail — and complaining loudly if there are zero matches, or two.',
    },
    { who: 'Your test', says: 'And `req.flush(body)`?' },
    {
      who: 'The testing backend',
      says: 'You, cooking the plate yourself, on this exact tick. No waiter runs anywhere and back, so whatever was waiting on the response already has it by your very next line.',
    },
  ];

  /**
   * What one `expectOne` / `flush` pair actually does. Worth drawing because the
   * synchronous feel of these tests is genuinely strange the first time — there
   * is no network, no timer and no promise anywhere in the loop, so every step
   * below happens on the same tick.
   */
  protected readonly loop: FlowStep[] = [
    {
      label: 'The test calls `.subscribe()`',
      detail: 'Nothing happened before this. The observable was cold',
      tone: 'accent',
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
      tone: 'good',
    },
    {
      label: '`http.verify()` checks the rail is empty',
      detail: 'Any request nobody asserted on is now a test failure',
      tone: 'good',
    },
  ];

  /** Sample: the canonical happy-path test — one `expectOne`/`flush` pair, in full. */
  protected readonly fetchUserSample = `it('fetches a user', () => {
  let result: User | undefined;
  api.getUser(1).subscribe((u) => (result = u));

  const req = http.expectOne('/api/users/1');
  expect(req.request.method).toBe('GET');
  expect(req.request.headers.get('Accept')).toBe('application/json');

  req.flush({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com' });
  expect(result?.name).toBe('Ada Lovelace');
});`;

  /** Line-by-line walkthrough of {@link fetchUserSample}. */
  protected readonly fetchUserNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A capture variable. It stays `undefined` until the observable emits, which is what lets the final assertion prove the value actually arrived.',
    },
    {
      line: 3,
      text: 'Subscribing is what SENDS the request — `HttpClient` observables are cold, so without this line nothing is ever dispatched and `expectOne()` below finds nothing.',
    },
    {
      line: 5,
      text: 'Claims the pending request and hands you a `TestRequest`. `expectOne` throws a descriptive error if zero requests match, or if two or more do.',
    },
    {
      line: 6,
      text: '`req.request` is the real `HttpRequest` object, so you can assert on anything the service set — starting with the verb.',
    },
    {
      line: 7,
      text: '...and the headers. Worth checking: a missing `Accept` header is exactly the kind of bug that only shows up against a picky real backend.',
    },
    {
      line: 9,
      text: '`flush()` plays the role of the server responding. It runs SYNCHRONOUSLY, so the subscribe callback above has already fired by the next line — no `tick()`, no `await`, no `done()`.',
    },
    {
      line: 10,
      text: 'Now the captured value is populated — proof the whole round trip actually happened, not just that a request was sent.',
    },
  ];

  /** Sample: a service with no DI dependencies — just a class. */
  protected readonly cartServiceSample = `@Injectable()
export class CartService {
  private readonly _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();

  readonly total = computed(() => this._items().reduce((sum, item) => sum + item.price, 0));

  add(item: CartItem) {
    this._items.update((list) => [...list, item]);
  }

  remove(id: number) {
    this._items.update((list) => list.filter((item) => item.id !== id));
  }
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    service = new CartService();
  });

  it('adds items and computes total', () => {
    service.add({ id: 1, name: 'Widget', price: 10 });
    service.add({ id: 2, name: 'Gadget', price: 25 });

    expect(service.items().length).toBe(2);
    expect(service.total()).toBe(35);
  });

  it('removes an item', () => {
    service.add({ id: 1, name: 'Widget', price: 10 });
    service.remove(1);

    expect(service.items().length).toBe(0);
    expect(service.total()).toBe(0);
  });
});`;

  /** Line-by-line walkthrough of {@link cartServiceSample}. */
  protected readonly cartServiceNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The single source of truth: a private, writable signal. `private` plus the underscore convention means nothing outside this class can call `.set()` or `.update()` on it.',
    },
    {
      line: 5,
      text: 'The public face of the same signal. `asReadonly()` strips the write methods, so callers can read `items()` but can never mutate state from outside.',
    },
    {
      line: 7,
      text: 'Derived, not stored. `computed()` re-runs only when `_items` actually changes and caches the result — it can never drift out of sync the way a hand-maintained `total` field could.',
    },
    {
      line: 10,
      text: '`update()` receives the current array and returns the next one. The spread builds a brand-new array — signals compare by reference, so `.push()`-ing the existing array would change nothing anyone can observe.',
    },
    {
      line: 14,
      text: 'Same rule: `filter()` returns a new array instead of editing in place.',
    },
    {
      line: 19,
      text: 'Declared here, assigned in `beforeEach` — every test in this file gets a FRESH instance, never one left over from the test before it.',
    },
    {
      line: 22,
      text: 'A plain constructor call. No `TestBed` anywhere in this file — `CartService` has no injected dependencies, so `new` is all it needs.',
    },
    {
      line: 29,
      text: 'Note the parentheses: `items` is a signal, so `items()` READS it. Drop them and you compare the function object itself, which always "passes" for the wrong reason.',
    },
    {
      line: 30,
      text: 'Nothing recomputed this by hand — reading `total()` pulled the computed, which is exactly the behaviour under test.',
    },
  ];

  /** Sample: a service that uses `inject()` — needs `TestBed` to resolve the injector. */
  protected readonly userServiceSample = `describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
  });
});`;

  /** Line-by-line walkthrough of {@link userServiceSample}. */
  protected readonly userServiceNotes: CodeNote[] = [
    {
      line: 5,
      text: 'Builds a throwaway injector for this test. `new UserService()` would throw here, because `inject()` inside the service needs an active injection context to resolve from.',
    },
    {
      line: 7,
      text: 'The class under test, listed as a provider like any other.',
    },
    {
      line: 8,
      text: 'The real `HttpClient` — nothing is faked yet.',
    },
    {
      line: 9,
      text: '…until this line swaps its BACKEND for a fake. Order here is not cosmetic: Angular resolves the LAST provider registered for a given token in the same array, so if this line came before `provideHttpClient()`, the real backend would win and every request in this suite would attempt an actual network call.',
    },
    {
      line: 13,
      text: "Pulls the instance out of that injector, with `UserService`'s own dependencies — including the now-fake `HttpClient` — already wired in.",
    },
  ];

  /** Sample: the full setup a `HttpTestingController` suite needs. */
  protected readonly controllerSetupSample = `import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

let http: HttpTestingController;
let api: UserApi;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [UserApi, provideHttpClient(), provideHttpClientTesting()],
  });

  http = TestBed.inject(HttpTestingController);
  api = TestBed.inject(UserApi);
});

afterEach(() => http.verify());`;

  /** Line-by-line walkthrough of {@link controllerSetupSample}. */
  protected readonly controllerSetupNotes: CodeNote[] = [
    {
      line: 4,
      text: 'The remote control for the fake backend: it lets you assert what was requested and decide what comes back.',
    },
    {
      line: 5,
      text: 'The service under test — the thing that will actually call `HttpClient`.',
    },
    {
      line: 9,
      text: '`provideHttpClientTesting()` must come after `provideHttpClient()` in this array — Angular resolves the LAST provider registered for a token, and this order is what makes the fake backend win.',
    },
    {
      line: 12,
      text: "Both come from the SAME injector, which is what connects them: any request `api` makes lands directly in this `http` controller's queue.",
    },
    {
      line: 16,
      text: "The safety net. `verify()` throws if the service made a request that no `expectOne()` ever claimed, so a typo'd URL fails loudly instead of a test that silently checked nothing.",
    },
  ];

  /** Sample: simulating a server-returned error and a network-level failure. */
  protected readonly errorSample = `it('handles 404 gracefully', () => {
  let error: string | undefined;
  api.getUser(999).subscribe({
    next: () => fail('should not succeed'),
    error: (e) => (error = e.message),
  });

  const req = http.expectOne('/api/users/999');
  req.flush('User not found', { status: 404, statusText: 'Not Found' });
  expect(error).toContain('404');
});

it('handles network error', () => {
  let error: any;
  api.getUser(1).subscribe({ error: (e) => (error = e) });

  const req = http.expectOne('/api/users/1');
  req.error(new ProgressEvent('error'));
  expect(error).toBeTruthy();
});`;

  /** Line-by-line walkthrough of {@link errorSample}. */
  protected readonly errorNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The observer-object form of `subscribe`, so you can supply an error handler alongside `next`.',
    },
    {
      line: 4,
      text: 'A guard clause: if `next` ever ran, the test fails immediately instead of quietly passing because `error` stayed undefined and nothing checked it.',
    },
    {
      line: 9,
      text: '`flush()` takes an optional second argument describing the response. Any status ≥ 400 makes `HttpClient` wrap it in an `HttpErrorResponse` and push it down the error channel instead of `next`.',
    },
    {
      line: 10,
      text: '`toContain`, not `toBe` — Angular composes a longer message that embeds the status code, so matching the exact string would be brittle.',
    },
    {
      line: 15,
      text: 'Shorthand observer — only the error channel matters for this test.',
    },
    {
      line: 18,
      text: 'A DIFFERENT failure mode from the 404 above: `.error()` means the request never reached a server at all — offline, DNS failure, CORS rejection. There is no status code, so `error.status` is `0`.',
    },
  ];

  /** Sample: matching by predicate, inspecting a POST body, and the "assert nothing was sent" case. */
  protected readonly matchingSample = `it('creates a user with correct body', () => {
  let createdId: number | undefined;
  api.createUser({ name: 'Bob', email: 'bob@test.com' }).subscribe((r) => (createdId = r.id));

  const req = http.expectOne((r) => r.url.includes('/api/users') && r.method === 'POST');

  expect(req.request.body.name).toBe('Bob');
  expect(req.request.body.email).toBe('bob@test.com');

  req.flush({ id: 42, ...req.request.body });
  expect(createdId).toBe(42);
});

const reqs = http.match((r) => r.url.startsWith('/api/search'));
reqs.forEach((r) => r.flush([]));

http.expectNone('/api/admin');`;

  /** Line-by-line walkthrough of {@link matchingSample}. */
  protected readonly matchingNotes: CodeNote[] = [
    {
      line: 5,
      text: 'Match by predicate instead of an exact URL string — handy when the same endpoint has to be told apart by verb, not just address.',
    },
    {
      line: 7,
      text: '`req.request.body` is whatever the service actually sent — inspect it before deciding what to flush back.',
    },
    {
      line: 10,
      text: 'Echoes the request body back with an id attached, which is exactly what a real create endpoint would do.',
    },
    {
      line: 14,
      text: '`match()` — no "One" — returns EVERY matching request instead of throwing past the first, which is the shape a debounced search bar needs: several requests genuinely in flight at once.',
    },
    {
      line: 17,
      text: '`expectNone` asserts the OPPOSITE of `expectOne`: that nothing matching this was ever sent — useful for proving an unauthenticated user never even attempts an admin route.',
    },
  ];

  /** Sample: matching a request that carries `HttpParams` — a query string, not just a path. */
  protected readonly queryParamsMatchSample = `// service:
getUsers(page: number) {
  return this.http.get('/api/users', { params: { page: String(page) } });
}

// test:
it('requests page 2', () => {
  service.getUsers(2).subscribe();

  // matches by exact string — but only while params stay in THIS order:
  const req = http.expectOne('/api/users?page=2');

  // robust to param order — matches on the DECODED params, not the string:
  // const req = http.expectOne(
  //   (r) => r.url === '/api/users' && r.params.get('page') === '2',
  // );

  req.flush([]);
});

// lost? dump every request actually queued before guessing at a URL:
// http.match(() => true).forEach((r) => console.log(r.request.urlWithParams));`;

  /** Line-by-line walkthrough of {@link queryParamsMatchSample}. */
  protected readonly queryParamsMatchNotes: CodeNote[] = [
    {
      line: 3,
      text: '`{ params: { page: String(page) } }` becomes an `HttpParams` instance under the hood — Angular serializes it onto the URL as a query string before the request ever reaches the testing backend.',
    },
    {
      line: 11,
      text: '`expectOne` compares this string against `r.urlWithParams` — path AND query string together — so it has to match character for character, including whatever order Angular happened to serialize the params in.',
    },
    {
      line: 15,
      text: 'The predicate checks `r.url`, the bare path with no query string, and reads the value back off `r.params` — an `HttpParams` instance with the same `.get()`/`.getAll()` API the service used to build the request. Add a second param to the service call and this predicate needs no edits; the exact-string form would.',
    },
    {
      line: 22,
      text: '`http.match(() => true)` matches every queued request without narrowing at all — the fastest way to see what actually got sent, real URL included, before guessing at the string `expectOne` wants.',
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

  /** Compare panel, right side: the same test, fixed. */
  protected readonly fixedSample = `it('fetches a user', () => {
  api.getUser(1).subscribe((u) => {
    expect(u.name).toBe('Ada Lovelace');
  });

  http.expectOne('/api/users/1').flush({ id: 1, name: 'Ada Lovelace' });
});

afterEach(() => http.verify());`;

  /** Choices for the cold-observable check. */
  protected readonly coldOptions: QuizOption[] = [
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
      why: "Order genuinely matters here — unlike the URL, this one is worth double-checking. Angular resolves the LAST provider registered for a token in the same array, so if `provideHttpClientTesting()` really were listed first, the REAL backend would win, `HttpClient` would attempt a genuine network call, and this controller's queue would stay empty forever — which looks exactly like this failure. But the setup a few sections back already has the order right (testing last), so in this specific case it isn't the cause. Get the order backwards in your own code, though, and this is precisely the symptom you'll see.",
    },
    {
      text: 'The request is queued asynchronously and `expectOne` ran too early',
      why: 'There is nothing async in the testing backend — that is the point of it. A request created on this tick is available to `expectOne` on this tick.',
    },
  ];

  /** Sample: registering and testing an auth interceptor through the real `HttpClient`. */
  protected readonly interceptorSample = `describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  const fakeAuth = { accessToken: vi.fn().mockReturnValue('my-token') };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  it('attaches Authorization header', () => {
    client.get('/api/profile').subscribe();
    const req = http.expectOne('/api/profile');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({ name: 'Ada' });
  });

  it('does not attach header when not logged in', () => {
    fakeAuth.accessToken.mockReturnValueOnce(null);
    client.get('/api/profile').subscribe();
    const req = http.expectOne('/api/profile');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ name: 'Ada' });
  });
});`;

  /** Line-by-line walkthrough of {@link interceptorSample}. */
  protected readonly interceptorNotes: CodeNote[] = [
    {
      line: 3,
      text: 'No service under test here — the interceptor sits between `HttpClient` and the network, so injecting `HttpClient` directly is enough to exercise it.',
    },
    {
      line: 4,
      text: 'A stand-in for whatever the interceptor reads the token from. Declared `const` so each test below can re-script its return value independently.',
    },
    {
      line: 9,
      text: 'The interceptor will resolve `AuthService` from the injector, so overriding it here is what actually controls the token it sees.',
    },
    {
      line: 10,
      text: 'Registers the real interceptor. `withInterceptors()` takes an array in run order — the first entry sees the request first.',
    },
    {
      line: 11,
      text: 'Must come after `provideHttpClient()` — listed first, the real backend wins and this suite would attempt genuine network calls.',
    },
    {
      line: 19,
      text: 'No callback needed — subscribing only exists to dispatch the request. The interceptor runs during this call, before the fake backend ever sees it.',
    },
    {
      line: 21,
      text: "The assertion IS the test: inspect the outgoing request and confirm the interceptor rewrote it — `'Bearer '` plus the token `fakeAuth` handed back.",
    },
    {
      line: 22,
      text: "Responds so `afterEach`'s `http.verify()` doesn't complain about a request nobody claimed.",
    },
    {
      line: 26,
      text: "`...Once` — overrides the return value for the NEXT call only, so the `describe`-level `'my-token'` default is untouched for every other test.",
    },
    {
      line: 29,
      text: '`.has()`, not `.get()` — asserting the header is genuinely ABSENT. This is the test people skip, and it\'s the one that catches an interceptor sending literal "Bearer null" to a real server.',
    },
  ];

  /** Sample: an interceptor that retries once on a 500, driven through `fakeAsync`. */
  protected readonly retrySample = `it('retries once on 500', fakeAsync(() => {
  let result: any;
  client.get('/api/data').subscribe((r) => (result = r));

  http.expectOne('/api/data').flush('Error', { status: 500, statusText: 'Server Error' });
  tick();

  http.expectOne('/api/data').flush({ ok: true });
  tick();
  expect(result).toEqual({ ok: true });
}));`;

  /** Line-by-line walkthrough of {@link retrySample}. */
  protected readonly retryNotes: CodeNote[] = [
    {
      line: 5,
      text: "First call fails with a server error — the retry interceptor under test is what's supposed to notice and react.",
    },
    {
      line: 6,
      text: "Advances the fake clock, which is what actually lets a retry's delay — even a zero-delay one — fire.",
    },
    {
      line: 8,
      text: 'A SECOND request lands in the queue: the retry itself. `expectOne()` here claims the retried attempt, not the original.',
    },
    {
      line: 10,
      text: 'Only the retried, successful response reaches the subscriber — proof the interceptor swallowed the first failure instead of letting it through.',
    },
  ];

  /** The interceptor chain, as a containment diagram. */
  protected readonly interceptorCore: Layer = {
    label: 'Fake backend',
    sub: 'HttpTestingController',
  };
  /** Rings around {@link interceptorCore}, outermost first. */
  protected readonly interceptorRings: Layer[] = [
    { label: 'authInterceptor', sub: 'attaches the token' },
    { label: 'retryInterceptor', sub: 'retries on 5xx' },
  ];

  /** Sample: marble testing — describing an Observable sequence as ASCII and asserting it precisely. */
  protected readonly marbleSample = `describe('debounceSearch$', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('debounces search input by 300ms', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input$ = hot('-a-b---------c', { a: 'h', b: 'he', c: 'hello' });
      const result$ = input$.pipe(debounceTime(300));

      expectObservable(result$).toBe('430ms c', { c: 'hello' });
    });
  });
});`;

  /** Line-by-line walkthrough of {@link marbleSample}. */
  protected readonly marbleNotes: CodeNote[] = [
    {
      line: 5,
      text: 'TestScheduler takes an ASSERTION FUNCTION, not a config object. RxJS calls it at the end of `run()` with the actual vs expected notification lists, and you delegate to whatever matcher your runner provides.',
    },
    {
      line: 9,
      text: "Inside `run()`, RxJS patches time itself: every operator's delay runs on a virtual clock, so a 300ms debounce costs zero real milliseconds.",
    },
    {
      line: 10,
      text: '`hot()` means already running, emitting regardless of subscribers — a `Subject`, a DOM event stream. `cold()` starts fresh per subscriber — an HTTP call. Picking the wrong one is the #1 marble-test mistake. Marble syntax: `-` is 10ms of silence, a letter is an emission at that frame (`|` completes, `#` errors), and the second argument maps each letter to the value it stands for. Counting characters gives the frames — `a` at 10ms, `b` at 30ms, `c` at 130ms: a user typing "h", then "he", then "hello".',
    },
    {
      line: 11,
      text: 'The operator chain actually under test.',
    },
    {
      line: 13,
      text: "Trace it: `h` starts a 300ms timer; `b` arrives 20ms later and RESTARTS it, so `h` never emits. `c` arrives at 130ms and restarts it again, killing `he`. Nothing follows, so `hello` finally emits 300ms after it arrived — 130 + 300 = frame 430. `'430ms c'` is time-progression syntax, clearer than counting 43 dashes, and it's exactly why the emission is NOT at frame 130.",
    },
  ];

  /** Sample: subscribe-and-assert with `done`, and the cleaner `firstValueFrom` alternative. */
  protected readonly simpleObservableSample = `it('maps and filters items', (done) => {
  const source$ = of([1, 2, 3, 4, 5]);
  const result$ = source$.pipe(switchMap((arr) => of(arr.filter((n) => n % 2 === 0))));

  result$.subscribe((arr) => {
    expect(arr).toEqual([2, 4]);
    done();
  });
});

it('resolves the first value', fakeAsync(() => {
  let val: number | undefined;
  firstValueFrom(of(42)).then((v) => (val = v));

  tick();
  expect(val).toBe(42);
}));`;

  /** Line-by-line walkthrough of {@link simpleObservableSample}. */
  protected readonly simpleObservableNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The `done` callback tells the runner "this test is async — wait for me".',
    },
    {
      line: 2,
      text: 'One emission containing the whole array, not five separate emissions.',
    },
    {
      line: 3,
      text: '`switchMap` returns a NEW observable per emission; `of()` wraps the filtered array back into one so the chain keeps its Observable type.',
    },
    {
      line: 7,
      text: 'Call `done()` INSIDE the subscription. Omit it and the test times out; move the `expect()` after the subscribe block instead and the test passes without the assertion ever running — a silent false green.',
    },
    {
      line: 13,
      text: '`firstValueFrom` converts an Observable to a Promise that resolves with the first emission — no subscribe, no `done()`, no manual teardown.',
    },
    {
      line: 15,
      text: 'The `.then()` above is queued as a microtask; `tick()` drains it so the assertion below sees the resolved value.',
    },
  ];

  /** Sample: `toSignal` reflecting a `BehaviorSubject`, synchronously. */
  protected readonly signalInteropSample = `it('toSignal reflects latest BehaviorSubject value', () => {
  const subject$ = new BehaviorSubject(10);

  const sig = TestBed.runInInjectionContext(() => toSignal(subject$, { requireSync: true }));

  expect(sig()).toBe(10);

  subject$.next(20);
  expect(sig()).toBe(20);
});`;

  /** Line-by-line walkthrough of {@link signalInteropSample}. */
  protected readonly signalInteropNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A `BehaviorSubject` always holds a current value — 10 to start.',
    },
    {
      line: 4,
      text: '`toSignal()` needs an injection context — it registers a `DestroyRef` so the subscription is cleaned up. Calling it bare in a test throws NG0203; `runInInjectionContext` supplies the context `TestBed` already owns. `requireSync` tells Angular "this source emits immediately, so the signal has no undefined phase", which is why `sig()` is typed `number`, not `number | undefined`. Pass a source that isn\'t synchronous and Angular throws at runtime instead of quietly handing back `undefined`.',
    },
    {
      line: 6,
      text: "No subscribe, no async — the signal already has the subject's value.",
    },
    {
      line: 8,
      text: 'Push a new value through the stream…',
    },
    {
      line: 9,
      text: '…and the signal reflects it synchronously. No `detectChanges()` needed — reading a signal never depends on change detection.',
    },
  ];

  /** Sample: nested `describe` blocks that name the unit and, per method, the behaviour. */
  protected readonly organizationSample = `describe('UserService', () => {
  // Setup once per describe block in beforeEach — TestBed config, injections,
  // and the afterEach(() => http.verify()) that guards the whole suite.

  describe('getUser()', () => {
    it('fetches user by id', ...);
    it('caches the result', ...);
    it('throws 404 for unknown id', ...);
  });

  describe('createUser()', () => {
    it('posts the correct body', ...);
    it('returns the created user with id', ...);
    it('rejects with validation errors', ...);
  });
});`;

  /** Line-by-line walkthrough of {@link organizationSample}. */
  protected readonly organizationNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The OUTER `describe` names the unit under test. One per file.',
    },
    {
      line: 5,
      text: 'A NESTED `describe` per METHOD. This is the part worth copying: a failure reports as "UserService > getUser() > throws 404 for unknown id", which tells you where to look before you\'ve read a single line of code.',
    },
    {
      line: 6,
      text: 'Name each `it()` after the BEHAVIOUR, not the implementation. "fetches user by id" survives a rewrite; "calls http.get with /api/users" does not.',
    },
    {
      line: 8,
      text: 'Always include the failure cases. A suite with only happy paths tells you the code works when nothing goes wrong — the easy half.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'When should I use `req.flush(body, { status: 500 })` versus `req.error(...)`?',
      a: '`flush` with an error status simulates the **server answering badly** — it reached your API, your API said no. `req.error(new ProgressEvent("error"))` simulates the request never getting there: offline, DNS, CORS. Both arrive at your code as an `HttpErrorResponse`, but the `status` differs (0 for the network case), and any code that branches on status codes needs a test for each.',
    },
    {
      q: 'Do I have to call `http.verify()`?',
      a: 'Nothing forces you, and that is exactly why you should. `verify()` in `afterEach` is what catches the two quietest failures in this whole area: a request your code fired that you never asserted on, and a test whose assertions live inside a callback that never ran. Without it, those tests are green and empty.',
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
}
