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
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · HTTP</span>
      <h1>HTTP Interceptors</h1>
      <p class="lead">
        An interceptor is a function in the pipeline between your code and the network.
        Every request flows through it on the way out and every response on the way back —
        the one place to add auth headers, logging, error handling and retries, written
        once instead of at every call site.
      </p>

      <h2>A functional interceptor</h2>
      <div class="code"><pre>{{ basicSample }}</pre></div>
      <div class="note">
        Requests are <strong>immutable</strong> — you can't set a header on
        <code>req</code> directly; <code>req.clone(&#123; setHeaders &#125;)</code> returns a
        modified copy. And you must <strong>return <code>next(...)</code></strong>: forget
        it and the request never reaches the backend (a silent hang).
      </div>

      <h2>The onion: order matters</h2>
      <p>
        Interceptors run in array order on the way <em>out</em> and in <strong>reverse</strong>
        on the way <em>back</em> — like layers of an onion wrapping the request. Send a
        request and watch the chain <code>[auth, logging, error]</code> unwind:
      </p>
      <div class="demo">
        <p class="demo__title">Live — illustrative pipeline (not a real request)</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="send(200)">Send → succeeds</button>
          <button class="ghost" (click)="send(401)">Send → 401 (redirect)</button>
          <button class="ghost" (click)="send(503)">Send → 503 (retry ×2)</button>
        </div>
        @if (log().length) {
          <div class="code"><pre>{{ logText() }}</pre></div>
        }
      </div>
      <div class="code"><pre>{{ registerSample }}</pre></div>

      <h2>Error handling &amp; retries</h2>
      <div class="code"><pre>{{ errorSample }}</pre></div>
      <div class="tip">
        Ordering has teeth: put <code>retry</code> <em>inside</em> the error interceptor and
        place auth <em>before</em> it, so each retried request is re-cloned with a fresh
        token. Put retry before auth and you may replay a request with a stale header.
      </div>

      <h2>Per-request config with <code>HttpContext</code></h2>
      <p>
        A type-safe channel to pass metadata from the call site to an interceptor — without
        abusing headers. Opt a single request out of auth, mark it cacheable, tag it for a
        loading spinner:
      </p>
      <div class="code"><pre>{{ contextSample }}</pre></div>

      <h2>Functional vs legacy class-based</h2>
      <table class="cmp">
        <tr><th></th><th><code>HttpInterceptorFn</code> (modern)</th><th>class + <code>HTTP_INTERCEPTORS</code> (legacy)</th></tr>
        <tr><td>Shape</td><td>a function <code>(req, next) =&gt; …</code></td><td>a class implementing <code>intercept()</code></td></tr>
        <tr><td>Register</td><td><code>withInterceptors([...])</code></td><td><code>&#123; provide: HTTP_INTERCEPTORS, useClass, multi: true &#125;</code></td></tr>
        <tr><td>Inject services</td><td class="ok"><code>inject()</code> directly — it runs in an injection context</td><td>constructor injection</td></tr>
        <tr><td>Boilerplate</td><td class="ok">minimal</td><td>a class + a multi-provider per interceptor</td></tr>
      </table>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Forgetting <code>return next(req)</code>.</strong> The request never
          continues — the call just hangs.</li>
        <li><strong>Mutating the request.</strong> It's immutable; use
          <code>req.clone(...)</code> to add headers/params.</li>
        <li><strong>Order bugs.</strong> Out in order, back in reverse. Retry-vs-auth and
          logging placement change behaviour.</li>
        <li><strong>Expecting non-HttpClient calls to be intercepted.</strong> A raw
          <code>fetch()</code>/<code>XMLHttpRequest</code> bypasses the chain entirely.</li>
        <li><strong>One mega-interceptor.</strong> Keep each focused on a single concern and
          compose them — easier to reason about and reorder.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>In what order do <code>[a, b, c]</code> process a response?</summary>
        <div>Reverse: <code>c → b → a</code>. Requests flow out <code>a → b → c</code>;
        responses come back through the same layers in reverse (the onion).</div>
      </details>
      <details class="qa">
        <summary>Why doesn't my header appear on the request?</summary>
        <div>You mutated <code>req</code> instead of cloning. Return
        <code>next(req.clone(&#123; setHeaders: &#123; … &#125; &#125;))</code>.</div>
      </details>
      <details class="qa">
        <summary>How do you skip auth for one specific request?</summary>
        <div>Pass an <code>HttpContext</code> token from the call site
        (<code>context: new HttpContext().set(SKIP_AUTH, true)</code>) and check
        <code>req.context.get(SKIP_AUTH)</code> in the interceptor.</div>
      </details>
      <details class="qa">
        <summary>Can an interceptor <code>inject()</code> a service?</summary>
        <div>Yes — functional interceptors run in an injection context, so
        <code>inject(AuthService)</code> works directly inside them.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>An <code>HttpInterceptorFn</code> wraps every request/response; register with <code>withInterceptors([...])</code>.</li>
        <li>Requests are immutable — <code>req.clone()</code> to modify; always <code>return next(...)</code>.</li>
        <li>Out in array order, back in reverse — order affects retry/auth/logging.</li>
        <li><code>HttpContext</code> passes per-request metadata; only <code>HttpClient</code> calls are intercepted.</li>
      </ul>

      <p><a routerLink="/rxjs-observables">Next: RxJS — Observables →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .82rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .ok { color: var(--green); font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class HttpInterceptors {
  protected readonly log = signal<string[]>([]);
  protected readonly logText = () => this.log().join('\n');

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

  protected readonly basicSample = `import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  // requests are immutable — clone to modify
  const authed = req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  });
  return next(authed);          // hand off to the next interceptor / backend
};`;

  protected readonly registerSample = `provideHttpClient(
  withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor]),
)
// out:  auth → logging → error → backend
// back: backend → error → logging → auth`;

  protected readonly errorSample = `export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({ count: 2, delay: 500 }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(['/login']);
      return throwError(() => err);
    }),
  );`;

  protected readonly contextSample = `export const SKIP_AUTH = new HttpContextToken(() => false);

// at the call site, opt one request out:
http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) });

// inside the interceptor, read it:
if (req.context.get(SKIP_AUTH)) return next(req);   // don't attach the token`;
}
