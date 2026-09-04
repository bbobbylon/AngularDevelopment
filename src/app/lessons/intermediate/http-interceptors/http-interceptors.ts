import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * Lesson: functional HTTP interceptors.
 *
 * Beyond "add an auth header": the onion model made concrete (a live demo that
 * logs the request going out through the chain and the response coming back in
 * reverse), functional vs legacy class-based registration, per-request
 * HttpContext, retry/error mapping, and the pitfalls (must return next(req),
 * request immutability, ordering of retry vs auth) plus exam questions.
 */
@Component({
  selector: 'app-lesson-http-interceptors',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './http-interceptors.html',
  styleUrl: './http-interceptors.css',
})
export class HttpInterceptors {
  /**
   * The forgotten-`return` puzzle used by the ask-before-telling block.
   *
   * TypeScript would normally flag this — `HttpInterceptorFn` requires an
   * `Observable` return — but a loosely-typed helper or a refactor that leaves
   * a stray statement behind can slip it past review. The point isn't the typo,
   * it's what "the request just hangs" actually means underneath.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly missingReturnSample = `export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('sending', req.url);
  next(req);          // <- missing "return"
};

// elsewhere:
http.get('/api/profile').subscribe({
  next: (data) => console.log('got it', data),
  error: (err) => console.error('failed', err),
});`;

  /**
   * The self-test, on whether the interceptor chain is re-run per subscription.
   * Every wrong answer invents a caching/deduplication mechanism that
   * HttpClient's cold, subscribe-driven chain does not have.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'Twice — once per subscription. The entire interceptor chain is cold, so calling subscribe() again re-enters every interceptor from scratch and fires a completely separate network request.',
      correct: true,
      why: "This is the direct consequence of 'requests are cold end to end': nothing in the chain runs until subscribe(), and nothing remembers that a subscription already happened. Two subscribes mean two full trips through auth, logging, error and the network — genuinely two requests, not one shared one.",
    },
    {
      text: 'Once — Angular caches the result of the first subscription and replays it for the second subscribe() automatically.',
      why: 'HttpClient has no built-in caching or deduplication of in-flight or completed requests. Any caching (like the short-circuit example above) has to be written explicitly as an interceptor — it is never automatic.',
    },
    {
      text: 'Only the interceptors that call next() run twice; an interceptor that short-circuits with of(...) runs once and shares its cached value across both subscriptions.',
      why: 'Short-circuiting only means "skip the rest of the chain for THIS pass" — it has no memory across separate subscriptions. A short-circuiting interceptor still re-runs its own logic in full on every subscribe, same as any other interceptor.',
    },
    {
      text: 'It depends on whether withFetch() is configured — a fetch()-based backend automatically deduplicates identical in-flight requests.',
      why: "Neither backend (XHR nor fetch) deduplicates requests on Angular's behalf. withFetch() only changes which browser API sends the request, not whether repeat subscriptions share a network call.",
    },
  ];

  /**
   * The interceptor-chain demo's log.
   */
  protected readonly log = signal<string[]>([]);
  /**
   * The log as one string for the `<pre>`.
   */
  protected readonly logText = () => this.log().join('\n');

  /**
   * Simulates a request through the chain.
   *
   * The ordering is the whole lesson: a request passes **outward** through the
   * interceptors in registration order, and the response comes back **inward**
   * through them in reverse. Registering an auth interceptor after an error
   * interceptor therefore means the retry re-sends the request without its token.
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

  /**
   * The caching demo's log.
   */
  protected readonly cacheLog = signal<string[]>([]);
  /**
   * That log as one string.
   */
  protected readonly cacheLogText = () => this.cacheLog().join('\n');

  /**
   * Simulates a cache hit or miss.
   *
   * Shows the property that makes caching an interceptor's job at all: an
   * interceptor can return a synthetic response **without calling `next()`**, so
   * the request never leaves the browser and no consumer has to know.
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
          '  └ [cache]  miss → return next(req)',
          '← RESPONSE 200 OK  { name: "Ada" }  (from the network — now cached for next time)',
        ];
    this.cacheLog.set(lines);
  }

  /**
   * Sample: a functional interceptor — `HttpInterceptorFn`, cloning the request to
   * add a header.
   */
  protected readonly basicSample = `import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  // requests are immutable — clone to modify
  const authed = req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  });
  return next(authed);          // hand off to the next interceptor / backend
};`;

  /**
   * Sample: registering interceptors with `withInterceptors`, in the order they
   * run.
   */
  protected readonly registerSample = `provideHttpClient(
  withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor]),
)
// out:  auth → logging → error → backend
// back: backend → error → logging → auth`;

  /**
   * Sample: an error interceptor with `retry` and `catchError`.
   */
  protected readonly errorSample = `export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject HERE, in the interceptor body. This is the injection context.
  // Calling inject(Router) inside the catchError callback below would throw
  // NG0203 — by the time the error arrives, the context is long gone.
  const router = inject(Router);

  return next(req).pipe(
    // retry RESUBSCRIBES to the source on failure, which re-sends the whole
    // request. count: 2 means up to three attempts total. The 500ms delay
    // matters: retrying instantly usually just fails instantly.
    // Note this retries EVERY error, including a 404 that will never
    // succeed. Production code narrows it, e.g. only 5xx and network errors.
    retry({ count: 2, delay: 500 }),
    // Reached only after the retries are exhausted.
    catchError((err: HttpErrorResponse) => {
      // 401 = the token is missing or expired. Bounce to login centrally, so
      // not one component has to handle it.
      if (err.status === 401) router.navigate(['/login']);
      // RE-THROW. Handling the error here without this line would make every
      // failed request look like it silently succeeded — the caller's error
      // handler would never run and the UI would sit on a spinner forever.
      return throwError(() => err);
    }),
  );
};`;

  /**
   * Sample: short-circuiting — returning a response without calling `next()`, so
   * the request never leaves the browser.
   */
  protected readonly shortCircuitSample = `export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only GETs are safe to cache. A POST/PUT/DELETE changes server state, so
  // replaying a stored response for one would be a serious bug.
  if (req.method !== 'GET') return next(req);

  const cached = cache.get(req.url);
  // Returning an Observable WITHOUT calling next() ends the chain right here.
  // The request never reaches the network, and the caller cannot tell the
  // difference — it just receives a response, instantly.
  if (cached) return of(cached);   // ⛔ short-circuit — next() never runs, no network call

  // Cache miss: let it through, and tap() records the response on the way
  // back. tap observes without altering what the caller receives.
  return next(req).pipe(tap((event) => cache.set(req.url, event)));
};
// Two things this simplified version skips: filtering for HttpResponse
// events (next() also emits upload/download progress events), and any kind
// of expiry. Cache forever and users will see stale data until they reload.`;

  /**
   * Sample: `HttpContextToken`, for per-request opt-outs. Without it the only way
   * to exempt one call from an interceptor is a URL check inside the interceptor,
   * which puts call-site knowledge in the wrong place.
   */
  protected readonly contextSample = `export const SKIP_AUTH = new HttpContextToken(() => false);

// at the call site, opt one request out:
http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) });

// inside the interceptor, read it:
if (req.context.get(SKIP_AUTH)) return next(req);   // don't attach the token`;
}
