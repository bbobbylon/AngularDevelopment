import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './http-interceptors.html',
  styleUrl: './http-interceptors.css',
})
export class HttpInterceptors {
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
  protected readonly errorSample = `export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({ count: 2, delay: 500 }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(['/login']);
      return throwError(() => err);
    }),
  );`;

  /**
   * Sample: short-circuiting — returning a response without calling `next()`, so
   * the request never leaves the browser.
   */
  protected readonly shortCircuitSample = `export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);

  const cached = cache.get(req.url);
  if (cached) return of(cached);   // ⛔ short-circuit — next() never runs, no network call

  return next(req).pipe(tap((event) => cache.set(req.url, event)));
};`;

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
