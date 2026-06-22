import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-http-interceptors',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · HTTP</span>
      <h1>HTTP Interceptors</h1>
      <p class="lead">
        An interceptor is a function that sits in the pipeline between your code and
        the network. Every request flows through it on the way out and every response
        on the way back — the ideal place for auth headers, logging, error handling
        and retries, written once instead of at every call site.
      </p>

      <h2>A functional interceptor</h2>
      <div class="code">
        <pre>import {{ '{' }} HttpInterceptorFn {{ '}' }} from '&#64;angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) =&gt; {{ '{' }}
  const token = inject(AuthService).token();
  // requests are immutable — clone to modify
  const authed = req.clone({{ '{' }}
    setHeaders: {{ '{' }} Authorization: \`Bearer \${{ '{' }}token{{ '}' }}\` {{ '}' }},
  {{ '}' }});
  return next(authed);          // hand off to the next interceptor / backend
{{ '}' }};</pre>
      </div>

      <h2>Registering them (order matters)</h2>
      <div class="code">
        <pre>provideHttpClient(
  withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor]),
)</pre>
      </div>
      <p>
        Interceptors run in array order on the way out and in reverse on the way back —
        like layers of an onion wrapping the request.
      </p>

      <h2>Logging & error handling</h2>
      <div class="code">
        <pre>export const errorInterceptor: HttpInterceptorFn = (req, next) =&gt;
  next(req).pipe(
    retry({{ '{' }} count: 2, delay: 500 {{ '}' }}),
    catchError((err: HttpErrorResponse) =&gt; {{ '{' }}
      if (err.status === 401) inject(Router).navigate(['/login']);
      return throwError(() =&gt; err);
    {{ '}' }}),
  );</pre>
      </div>

      <h2>Try it — simulated pipeline</h2>
      <div class="demo">
        <p class="demo__title">Live — illustrative, not a real request</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="send(200)">Send (succeeds)</button>
          <button class="ghost" (click)="send(401)">Send (401 → redirect)</button>
        </div>
        @if (log().length) {
          <div class="code"><pre>{{ logText() }}</pre></div>
        }
      </div>

      <h2>Per-request config with HttpContext</h2>
      <div class="code">
        <pre>export const SKIP_AUTH = new HttpContextToken(() =&gt; false);

// at the call site, opt a single request out:
http.get(url, {{ '{' }} context: new HttpContext().set(SKIP_AUTH, true) {{ '}' }});

// inside the interceptor, read it:
if (req.context.get(SKIP_AUTH)) return next(req);   // skip attaching the token</pre>
      </div>
      <p>
        <code>HttpContext</code> is a type-safe way to pass metadata from a call site to
        an interceptor without abusing headers.
      </p>

      <div class="tip">
        Interceptors run in an injection context, so you can <code>inject()</code>
        services right inside them. Keep each one focused on a single concern —
        compose several rather than writing one giant interceptor.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>An <code>HttpInterceptorFn</code> wraps every request/response.</li>
        <li>Requests are immutable — <code>req.clone()</code> to add headers/params.</li>
        <li>Register with <code>withInterceptors([...])</code>; order is significant.</li>
        <li>Great for cross-cutting concerns: auth, logging, retries, error mapping.</li>
      </ul>

      <p><a routerLink="/rxjs-observables">Next: RxJS — Observables →</a></p>
    </article>
  `,
})
export class HttpInterceptors {
  protected readonly log = signal<string[]>([]);
  protected readonly logText = () => this.log().join('\n');

  protected send(status: number) {
    const lines = [
      '→ GET /api/profile',
      '  [auth]    attach Authorization: Bearer ***',
      '  [logging] start timer',
    ];
    if (status === 200) {
      lines.push('← 200 OK  { name: "Ada" }', '  [logging] done in 142ms');
    } else {
      lines.push('← 401 Unauthorized', '  [error]   inject(Router).navigate(["/login"])');
    }
    this.log.set(lines);
  }
}
