import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: functional HTTP interceptors.
 *
 * Beyond "add an auth header": the onion model made concrete (a live demo that logs the
 * request going out through the chain and the response coming back in reverse), the
 * short-circuit escape hatch, retry vs. a real refresh-and-replay flow (and the
 * concurrent-refresh stampede that a naive version causes), per-request `HttpContext`
 * opt-outs, functional vs. legacy registration, and a from-source correction of a claim
 * that keeps circulating about `retry()` and token freshness.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape copied from
 * `expert/change-detection/change-detection.ts`, the reference implementation.
 *
 * `app-layers` — built for exactly this ("HTTP interceptors: the backend call is the
 * core, each interceptor is a ring") — carries the onion picture, so no bespoke SVG was
 * needed here. Two claims in the previous version of this lesson turned out to be wrong
 * on inspection and are corrected rather than carried forward:
 *
 * 1. The mixed-registration API is `withInterceptorsFromDi()`, not
 *    `withInterceptorsFromLegacy()` (which does not exist and fails to compile).
 * 2. "Put auth before retry so a retried request gets a fresh token" is false. Read from
 *    Angular's own source (`chainedInterceptorFn` / `HttpInterceptorHandler.handle` in
 *    `@angular/common/fesm2022/_module-chunk.mjs`): every interceptor's function body
 *    runs exactly **once**, synchronously, per subscription — `retry()` only resubscribes
 *    to the Observable that a single `next(req)` call already produced, which for a
 *    request that reaches the backend is `HttpXhrBackend`'s own cold XHR dispatch. No
 *    interceptor's code re-runs, in either direction, no matter how you order the array.
 *    A fresh token needs an *explicit* second call to `next()`, which is what the
 *    refresh-and-replay section builds toward.
 */
@Component({
  selector: 'app-lesson-http-interceptors',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './http-interceptors.html',
  styleUrl: './http-interceptors.css',
})
export class HttpInterceptors {
  // ── Presentation data ────────────────────────────────────────────────────────

  /** The HTTP track, for the "you are here" rail. Curriculum order: basics → CRUD → interceptors. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Basics', id: 'http-basics' },
    { label: 'CRUD', id: 'http-crud' },
    { label: 'Interceptors' },
  ];

  // ── The onion-chain demo (unchanged behaviour from the previous version) ───────

  /** The interceptor-chain demo's log. */
  protected readonly log = signal<string[]>([]);
  /** The log as one string for the `<pre>`. */
  protected readonly logText = () => this.log().join('\n');

  /**
   * Simulates a request through the chain.
   *
   * The ordering is the whole lesson: a request passes **outward** through the
   * interceptors in registration order, and the response comes back **inward** through
   * them in reverse. Registering an auth interceptor after an error interceptor
   * therefore means the retry re-sends the request without its token — see the "order
   * has teeth" section for exactly what "the retry" can and can't fix.
   *
   * @param status The status code to simulate.
   */
  protected send(status: number) {
    // Out through [auth, logging], then the response back through [logging, error].
    const lines = [
      '→ REQUEST  GET /api/profile',
      '  ├ [auth]     clone → Authorization: Bearer ***',
      '  └ [logging]  start timer',
    ];
    if (status === 200) {
      lines.push(
        '← RESPONSE 200 OK  { name: "Ada" }',
        '  ├ [logging]  done in 142ms',
        '  └ [auth]     pass through',
      );
    } else if (status === 401) {
      lines.push(
        '← RESPONSE 401 Unauthorized',
        '  ├ [logging]  failed in 88ms',
        '  └ [error]    catchError → inject(Router).navigate(["/login"])',
      );
    } else {
      lines.push(
        '← RESPONSE 503 Service Unavailable',
        '  └ [error]    retry({ count: 2, delay: 500 }) → attempt 2, 3…',
        '← RESPONSE 200 OK  (recovered on retry)',
      );
    }
    this.log.set(lines);
  }

  // ── The short-circuit / cache demo (unchanged behaviour) ───────────────────────

  /** The caching demo's log. */
  protected readonly cacheLog = signal<string[]>([]);
  /** That log as one string. */
  protected readonly cacheLogText = () => this.cacheLog().join('\n');

  /**
   * Simulates a cache hit or miss.
   *
   * Shows the property that makes caching an interceptor's job at all: an interceptor
   * can return a synthetic response **without calling `next()`**, so the request never
   * leaves the browser and no consumer has to know.
   *
   * @param hit Whether to simulate a cache hit.
   */
  protected fetchCached(hit: boolean) {
    const lines = hit
      ? [
          '→ REQUEST  GET /api/profile',
          '  └ [cache]  hit → return of(cachedResponse)   ⛔ next() never called',
          '← RESPONSE 200 OK  { name: "Ada" }  (served from cache, 0ms — no network, no later interceptors)',
        ]
      : [
          '→ REQUEST  GET /api/profile',
          '  └ [cache]  miss → return next(req).pipe(tap(...))',
          '← RESPONSE 200 OK  { name: "Ada" }  (from the network — the real HttpResponse gets cached for next time)',
        ];
    this.cacheLog.set(lines);
  }

  // ── The 401 stampede demo (new) ─────────────────────────────────────────────

  /** The refresh-stampede demo's log. */
  protected readonly stampedeLog = signal<string[]>([]);
  /** That log as one string. */
  protected readonly stampedeLogText = () => this.stampedeLog().join('\n');

  /**
   * Simulates three requests 401-ing at the same moment, with and without the shared
   * `refreshing` gate from {@link refreshSample}.
   *
   * @param guarded Whether the shared-refresh gate is in place.
   */
  protected simulateStampede(guarded: boolean) {
    const lines = guarded
      ? [
          '→ Requests A, B, C fire together — all three 401',
          '  ├ [A] refreshing is null → sets it, calls auth.refresh()',
          '  ├ [B] refreshing already set → subscribes to the SAME call',
          '  └ [C] refreshing already set → subscribes to the SAME call',
          '← ONE refresh call lands, token v2',
          '  └ A, B and C are all replayed with token v2 — one call, three winners',
        ]
      : [
          '→ Requests A, B, C fire together — all three 401',
          '  ├ [A] catchError → auth.refresh() → POST /refresh (its own call)',
          '  ├ [B] catchError → auth.refresh() → POST /refresh (its own call)',
          '  └ [C] catchError → auth.refresh() → POST /refresh (its own call)',
          '← THREE refresh calls land: token v2, v3, v4 — whichever resolves LAST wins',
          '  └ A and B replay with tokens the server may have already invalidated',
        ];
    this.stampedeLog.set(lines);
  }

  // ── Code samples ────────────────────────────────────────────────────────────

  /**
   * Sample: the interceptor contract — `HttpInterceptorFn`, cloning the request to add a
   * header, and returning what `next` hands back.
   */
  protected readonly basicSample = `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  const authed = req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  });

  return next(authed);
};`;

  /** Line-by-line walkthrough of {@link basicSample}. */
  protected readonly basicNotes: CodeNote[] = [
    {
      line: 1,
      text: '`HttpInterceptorFn` is a type alias for `(req: HttpRequest<unknown>, next: HttpHandlerFn) => Observable<HttpEvent<unknown>>`. `req` is the outgoing request; `next` is a function you call to hand the request to whatever comes next in the chain.',
    },
    {
      line: 2,
      text: '`inject()` works here because a functional interceptor runs **in an injection context** — no constructor, no class needed, the same as inside a field initializer.',
    },
    {
      line: 4,
      text: '`req` is **immutable** — there is no `req.headers.set(...)`. `.clone()` returns a brand-new `HttpRequest` with the given overrides merged in; the original `req` is never touched.',
    },
    {
      line: 5,
      text: '`setHeaders` on `.clone()` **merges** headers into the existing set rather than replacing the whole `HttpHeaders` object, so you never have to read the old ones first just to keep them.',
    },
    {
      line: 8,
      text: "`return` is doing two jobs at once: it hands `authed` to `next`, and it hands `next`'s Observable straight back out as this interceptor's own result. Drop the `return` and `next(authed)` still runs — but the caller sees nothing, because nothing links this function's output to it. See below for what TypeScript does and does not catch about that.",
    },
  ];

  /**
   * Sample: an interceptor that (looks like it) forgot to continue the chain. Feeds the
   * predict below — it does not compile.
   */
  protected readonly forgottenReturnSample = `export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('sending', req.url);
  next(req);
};`;

  /**
   * Sample: an interceptor that DOES compile, and DOES genuinely hang — the honest
   * version of the "forgot to continue the chain" failure mode.
   */
  protected readonly trueHangSample = `export const brokenInterceptor: HttpInterceptorFn = (req, next) => {
  const events = new Subject<HttpEvent<unknown>>();
  next(req).subscribe();          // the request genuinely goes out…
  return events.asObservable();   // …but nothing ever calls events.next()
};`;

  /**
   * Sample: registering interceptors, with the ordering rule for mixing the legacy DI
   * form and the modern functional one.
   */
  protected readonly registerSample = `provideHttpClient(
  withInterceptorsFromDi(),                 // legacy HTTP_INTERCEPTORS classes, as ONE group
  withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor]),
)
// out:  (the DI group) → auth → logging → error → backend
// back: backend → error → logging → auth → (the DI group)`;

  /** Line-by-line walkthrough of {@link registerSample}. */
  protected readonly registerNotes: CodeNote[] = [
    {
      line: 2,
      text: '`withInterceptorsFromDi()` is the real name — **not** `withInterceptorsFromLegacy()`, which does not exist and will fail to compile if you type it. It folds every interceptor registered the old way (`{ provide: HTTP_INTERCEPTORS, useClass: X, multi: true }`) into the chain as a single block.',
    },
    {
      line: 3,
      text: 'The functional ones still run in plain **array order** — `auth` first, `error` last, going out.',
    },
    {
      line: 5,
      text: "The DI group's position **relative to** `withInterceptors([...])` in this argument list is the entire ordering decision for a mixed chain. Swap these two lines and the whole legacy group moves to the other side of the functional one — a behavioural change, not a formatting one.",
    },
  ];

  /**
   * Sample: short-circuiting a cache hit, and — corrected from the previous version of
   * this lesson — narrowing the `HttpEvent` stream to the one member worth caching.
   */
  protected readonly shortCircuitSample = `export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);       // only GETs are safe to cache

  const cached = cache.get(req.url);
  if (cached) return of(cached);   // ⛔ short-circuit — next() never runs

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) cache.set(req.url, event.clone());
    }),
  );
};`;

  /** Line-by-line walkthrough of {@link shortCircuitSample}. */
  protected readonly shortCircuitNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A `POST`/`PUT`/`DELETE` changes server state, so replaying a stored response for one would silently redo — or skip — a real mutation. `next(req)` here just continues the chain normally; this branch is an opt-out, not the short-circuit.',
    },
    {
      line: 5,
      text: 'Returning `of(cached)` — an `Observable` that emits once and completes immediately — **without calling `next`** ends the chain right here. The request never reaches the network, and every interceptor after this one in the array never runs either.',
    },
    {
      line: 7,
      text: '`next(req)` returns a **stream of `HttpEvent`s**, not one response: `Sent`, maybe some `UploadProgress`/`DownloadProgress`, and eventually one `HttpResponse`. `.pipe(tap(...))` watches that stream on its way back out without altering any of it.',
    },
    {
      line: 9,
      text: '`event instanceof HttpResponse` narrows the union down to the one member that actually carries a finished `body` — skip this check and a request that reports progress can cache a `HttpDownloadProgressEvent` instead (no usable `body`), whichever happens to be the last event before the pipe unsubscribes. `.clone()` matters too: without it, every future "hit" hands out the *exact same* response object, and code anywhere that mutates a returned body in place corrupts the cached copy for everyone else.',
    },
  ];

  /**
   * Sample: the plain `retry` + `catchError` version, and where the injection-context
   * rule the top-of-lesson napkin asked about actually bites.
   */
  protected readonly errorSample = `export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);          // must inject HERE — see the note below

  return next(req).pipe(
    retry({ count: 2, delay: 500 }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(['/login']);
      return throwError(() => err);       // re-throw, or callers never see the failure
    }),
  );
};`;

  /** Line-by-line walkthrough of {@link errorSample}. */
  protected readonly errorNotes: CodeNote[] = [
    {
      line: 2,
      text: "This resolves the napkin question from the top of the lesson: the answer is **injection context**. `inject()` only works while Angular is actively constructing or invoking something for you — the interceptor's own function body is one such moment. The `catchError` callback on line 6 is not: it runs later, asynchronously, after Angular has moved on, which is why `inject(Router)` written *inside* it throws `NG0203: inject() must be called from an injection context`.",
    },
    {
      line: 5,
      text: '`retry` **resubscribes to the source** on failure, which re-sends the request. `count: 2` allows up to three attempts total; `delay: 500` waits half a second between them — retrying instantly usually just fails instantly again. Unnarrowed like this, it retries **every** error, including a 404 that will never succeed; production code gates it on `err.status` or a custom predicate instead of retrying blindly.',
    },
    {
      line: 7,
      text: '401 means the token is missing, expired, or rejected outright. Redirecting centrally, here, means no individual component ever has to check for it.',
    },
    {
      line: 8,
      text: "Re-throwing is not optional. Skip this line and every failed request looks like it silently succeeded from the caller's side — no value ever arrives, but no error does either, so a `subscribe({ error })` handler or an `async` pipe never fires and the UI just sits there.",
    },
  ];

  /**
   * Sample: the guarded refresh-and-replay interceptor. The centrepiece of the retry vs.
   * refresh section — a `shareReplay(1)`-backed gate so N concurrent 401s produce exactly
   * one refresh call, and an explicit second `next()` call to replay each one.
   */
  protected readonly refreshSample = `let refreshing: Observable<string> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url.includes('/auth/refresh')) return next(req);   // never refresh the refresh call

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      refreshing ??= auth.refresh().pipe(
        shareReplay(1),
        finalize(() => (refreshing = null)),
      );

      return refreshing.pipe(
        switchMap((token) =>
          next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })),
        ),
      );
    }),
  );
};`;

  /** Line-by-line walkthrough of {@link refreshSample}. */
  protected readonly refreshNotes: CodeNote[] = [
    {
      line: 1,
      text: "The shared gate, module-scoped so every request through this interceptor sees the same variable. `null` means 'no refresh in flight'; anything else means one is, and here is how to hear about it when it finishes.",
    },
    {
      line: 6,
      text: 'The refresh call itself has to be let through untouched, or a 401 from `/auth/refresh` recurses into refreshing forever.',
    },
    {
      line: 10,
      text: "Anything that is not a 401 is not this interceptor's problem — re-throw immediately so a genuine 404 or 500 does not get mistaken for an expired token.",
    },
    {
      line: 12,
      text: '`??=` assigns only when `refreshing` is currently `null`. The **first** request to hit a 401 starts the refresh; every request that 401s while one is already running finds `refreshing` already set and skips straight to line 17 without calling `auth.refresh()` again.',
    },
    {
      line: 13,
      text: '`shareReplay(1)` is what makes the gate work: instead of a fresh HTTP call per subscriber, every request piles onto the **same** in-flight Observable and replays its one cached emission — the new token — the moment it arrives.',
    },
    {
      line: 14,
      text: 'Once the refresh settles, `finalize` clears the gate back to `null` — skip this and every 401 from here on replays a token that is now permanently stale, because `refreshing` never becomes `null` again.',
    },
    {
      line: 18,
      text: 'Once the token arrives, `switchMap` re-clones the **original failed request** with the fresh header and calls `next()` on it a **second time** — the only place in this lesson `next` is invoked more than once for the same logical request. This is a genuine, intentional second call, which is exactly why it succeeds where `retry()` alone does not (see the warning above).',
    },
  ];

  /**
   * Sample: `HttpContextToken`, for per-request opt-outs.
   */
  protected readonly contextSample = `export const SKIP_AUTH = new HttpContextToken(() => false);

// at the call site, opt one request out:
http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) });

// inside the interceptor, read it:
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) return next(req);   // don't attach the token
  return next(attachToken(req));
};`;

  /** Line-by-line walkthrough of {@link contextSample}. */
  protected readonly contextNotes: CodeNote[] = [
    {
      line: 1,
      text: '`HttpContextToken` takes a **factory**, not a bare default value — `() => false` runs once per token, and any request that never sets it reads that default. The token itself carries the value type (`boolean` here), so `.get()` and `.set()` are checked.',
    },
    {
      line: 4,
      text: '`context` is a third channel, separate from headers, params and the body — built specifically for metadata meant for **your own interceptors**, not the server. It travels with the request through the whole chain.',
    },
    {
      line: 8,
      text: "`req.context.get(SKIP_AUTH)` reads the value set at the call site: `true` for this one request, the token's own default (`false`) for every other. This interceptor now behaves differently per call site without a single URL string check inside it.",
    },
  ];

  /**
   * Sample: a loading-indicator interceptor built on the same `HttpContext` idea, and
   * `finalize` — the operator that runs on all three ways a stream can end.
   */
  protected readonly loadingSample = `export const SKIP_LOADING = new HttpContextToken(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING)) return next(req);

  const loading = inject(LoadingService);
  loading.start();

  return next(req).pipe(finalize(() => loading.stop()));
};`;

  /** Sample: the broken version — `tap`'s two callbacks look like `finalize`, but aren't. */
  protected readonly loadingTapSample = `return next(req).pipe(
  tap({
    next: () => loading.stop(),
    error: () => loading.stop(),
  }),
);`;

  /** Sample: the correct version, for the same comparison. */
  protected readonly loadingFinalizeSample = `return next(req).pipe(
  finalize(() => loading.stop()),
);`;

  /** Sample: how `withInterceptors([...])` actually composes the array, once, at bootstrap. */
  protected readonly compositionSample = `withInterceptors([a, b, c])
// composes, once, into:
a(req, r1 => b(r1, r2 => c(r2, backendHandle)))`;

  /** Line-by-line walkthrough of {@link loadingSample}. */
  protected readonly loadingNotes: CodeNote[] = [
    {
      line: 4,
      text: 'Same pattern as `SKIP_AUTH` above — a background poll sets this token at its call site so it never touches the spinner, without this interceptor needing to know which URL is "the polling one".',
    },
    {
      line: 7,
      text: '`start()`/`stop()` are almost certainly a signal-backed counter inside `LoadingService`, not a boolean — two requests in flight at once means `stop()` has to run twice before the spinner actually goes away.',
    },
    {
      line: 9,
      text: '`finalize` is the one operator that runs on **all three** ways a stream can end: it completes (the response arrived), it errors (a 404, a dropped connection), or it is unsubscribed (the caller navigated away, or a `switchMap` moved on to a newer request). A spinner needs exactly that guarantee — see the comparison below.',
    },
  ];
  // ── The self-tests ──────────────────────────────────────────────────────────

  /**
   * Quiz 1: the onion's reverse order on the way back. The distractors are the three
   * ways learners get this backwards — registration order, timing, and concurrency —
   * rather than nesting/reversal.
   */
  protected readonly orderQuizOptions: QuizOption[] = [
    {
      text: "`auth` — it's first in the array, so it's first to see anything.",
      why: 'First in the array means first on the way **out**. The response travels back through the same interceptors in the opposite order, so the one closest to the backend is first to see it, not the one that ran first going out.',
    },
    {
      text: "`error` — it's closest to the backend, so it's first to see the response.",
      correct: true,
      why: 'Exactly — picture the rings around a core: whichever ring is innermost sits right against the backend, and the response has to pass through it first on the way back out. `error` runs last going out and first coming back.',
    },
    {
      text: "Whichever one finishes its own work fastest — order isn't really fixed.",
      why: 'Order is fixed and entirely static, decided by the array passed to `withInterceptors`. Nothing about how long an interceptor takes to run changes where it sits in the chain.',
    },
    {
      text: "All three see the response at the same time — they aren't really sequential.",
      why: "They are genuinely sequential, nested function calls: the `next()` inside `auth` IS a call into `logging`, whose `next()` IS a call into `error`. Nothing runs concurrently — each interceptor's own pipe only sees the response after the interceptor nested inside it has already handed it back.",
    },
  ];

  /**
   * Quiz 2: how many refresh calls the shared gate actually produces under a stampede.
   * The distractors are exactly the three wrong mental models of what `shareReplay(1)`
   * plus `??=` buys you.
   */
  protected readonly stampedeQuizOptions: QuizOption[] = [
    {
      text: 'Ten — once per failing request, same as without the gate.',
      why: "That's the naive version this gate replaces. The whole point of `refreshing ??=` is that only the request which finds `refreshing` still `null` starts a new call; the other nine find it already set and skip straight past `auth.refresh()`.",
    },
    {
      text: 'One.',
      correct: true,
      why: "Exactly — the first 401 sets the gate and starts the call; the other nine subscribe to the **same** `shareReplay(1)`'d Observable and receive the same replayed token when it lands, without ever calling `refresh()` themselves.",
    },
    {
      text: 'Zero — `shareReplay` prevents the call from running at all until something else forces it.',
      why: '`shareReplay(1)` changes how many *subscribers* trigger separate work, not whether the work runs at all. The very first subscription — the first 401 — still executes `auth.refresh()` for real.',
    },
    {
      text: 'It depends on network timing — however many calls land before the first one resolves.',
      why: "That's true of the version *without* the gate, where each unguarded 401 races to call refresh before an earlier one has replied. The gate closes as soon as the first 401 sets `refreshing`, synchronously, before any of it depends on how fast the network responds.",
    },
  ];

  /**
   * The exchange three concurrent, unguarded 401s actually have — nobody in it is
   * behaving unreasonably in isolation, which is the whole point.
   */
  protected readonly stampedeTalk: BubbleTurn[] = [
    {
      who: 'Request A',
      says: "401. I'll call `auth.refresh()` myself and retry with what it gives me.",
    },
    {
      who: 'Request B',
      says: '401, same instant. I have no idea A is already refreshing — calling `auth.refresh()` too.',
    },
    {
      who: 'Request C',
      says: 'Also 401. Same story — a third `refresh()` call, on its way to the server.',
    },
    {
      who: 'The backend',
      says: "Three refresh calls landed. I'll honour all three and mint three different tokens — whichever one you save last wins.",
    },
    {
      who: 'Request A, replayed',
      says: "I'm retrying with the token **my** call got back — which B and C's calls just invalidated.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Can a raw `fetch()` or `XMLHttpRequest` call get intercepted?',
      a: 'No. The interceptor chain sits specifically between `HttpClient` and `HttpBackend` — bypass `HttpClient` and you bypass the whole chain, auth headers, retries and the loading spinner included. This is also why third-party SDKs that use their own HTTP layer never show up in your interceptors.',
    },
    {
      q: 'Can I `.subscribe()` inside an interceptor just to peek at the response?',
      a: "You can call it, but don't return a *different* Observable afterward if that second one also calls `next()` — `HttpClient` calls are cold, so that fires the request a second time. Use `tap()` on the **same** Observable you're already returning to observe it without creating a second subscription.",
    },
    {
      q: 'Does it matter whether `withInterceptorsFromDi()` comes before or after `withInterceptors([...])` in `provideHttpClient()`?',
      a: "Yes — that relative position is the entire ordering decision for the legacy block. Before it, the legacy classes are outermost: they run before any functional interceptor going out, and after all of them coming back. After it, they're innermost, right next to the backend — the mirror image.",
    },
    {
      q: 'Do I need `HttpContext` if I can just check `req.url` inside the interceptor?',
      a: 'You can, and small apps often do — but a URL check means the interceptor has to know about every call site that wants to opt out, and that list drifts out of sync with reality. `HttpContext` moves the decision to the call site, where the reason for opting out actually lives.',
    },
    {
      q: 'Does `finalize` run before or after `catchError` sees the error?',
      a: "`catchError` first — it's upstream in the pipe, so it gets the error and decides whether to re-throw or recover before the stream actually terminates. `finalize` runs once that termination happens, regardless of which way `catchError` resolved it. That ordering is why a loading interceptor's `finalize` can sit outside a `catchError` used elsewhere in the same chain without missing anything.",
    },
  ];
}
