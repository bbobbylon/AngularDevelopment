import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ============================================================
// WHAT YOU'LL BUILD: an Auth Flow covering:
//   Signal store for auth state, JWT token handling (in-memory),
//   HTTP interceptors, Route guards, Login form, Profile page
// ============================================================

/**
 * A signed-in user in the demo.
 */
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// ---------- Simulated Auth Service (normally backed by HTTP) ----------
/**
 * A mock auth service — the shape a real one would have, with the network
 * replaced by a lookup table.
 *
 * Holds the user in a private signal, exposes it read-only, and derives
 * `isLoggedIn` / `isAdmin` from it so no separate flag can fall out of step. The
 * session is mirrored into `sessionStorage` so a refresh does not sign the user
 * out.
 *
 * Deliberately **not** production auth: the credentials are in the bundle, the
 * token is fabricated, and nothing is verified. It exists so the routing, guard
 * and UI patterns around auth can be practised without a backend.
 */
@Injectable({ providedIn: 'root' })
class MockAuthService {
  /**
   * The signed-in user, or `null`. Seeded from the stored session.
   */
  private readonly _user = signal<AuthUser | null>(this.loadSession());
  /**
   * The fake token. Kept out of storage on purpose — the demo mirrors the common
   * advice to hold access tokens in memory.
   */
  private _token: string | null = null;
  /**
   * Whether this session was restored from storage rather than freshly logged in.
   */
  private _fromSession = this._user() !== null;

  /**
   * The current user, read-only.
   */
  readonly currentUser = this._user.asReadonly();
  /**
   * Whether anyone is signed in.
   */
  readonly isLoggedIn = computed(() => this._user() !== null);
  /**
   * Whether the signed-in user is an admin. Derived, so a role change cannot leave
   * a stale permission behind.
   */
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  /**
   * The current token, or `null`.
   */
  getToken() {
    return this._token;
  }
  /**
   * Whether the session was restored rather than logged in.
   */
  wasRestoredFromSession() {
    return this._fromSession;
  }

  /**
   * Attempts a sign-in.
   *
   * @param email    The email.
   * @param password The password.
   * @returns Whether it succeeded.
   */
  login(email: string, password: string): boolean {
    const users: Record<string, { password: string; user: AuthUser }> = {
      'admin@example.com': {
        password: 'admin123',
        user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      },
      'user@example.com': {
        password: 'user123',
        user: { id: 2, name: 'Jane Smith', email: 'user@example.com', role: 'user' },
      },
    };
    const record = users[email];
    if (!record || record.password !== password) return false;
    this._user.set(record.user);
    this._token = 'fake-jwt-' + Date.now();
    this._fromSession = false;
    sessionStorage.setItem('demo_auth_user', JSON.stringify(record.user));
    return true;
  }

  /**
   * Signs out and clears the stored session.
   */
  logout() {
    this._user.set(null);
    this._token = null;
    this._fromSession = false;
    sessionStorage.removeItem('demo_auth_user');
  }

  /**
   * Reads the stored session.
   *
   * Wrapped in a `try`: `sessionStorage` throws in private-mode browsers and the
   * stored JSON may be anything, so a failure has to mean "signed out" rather than
   * "the app will not start".
   *
   * @returns The stored user, or `null`.
   */
  private loadSession(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem('demo_auth_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Project: Auth Flow — sign-in, session, guards and role-based UI.
 *
 * A practice project rather than a lesson: it puts the routing, guard, service
 * and form pieces together into the thing they are usually assembled into.
 *
 * Covers a signal-based auth service ({@link MockAuthService}), session
 * persistence across a refresh, conditional UI by role, and where the guards and
 * interceptors would attach in a real app.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`) alongside its content —
 * see `docs/BACKLOG.md` §1.2. `expert/change-detection` is the reference for a
 * *concept* lesson (pose the problem → analogy → mechanism → four modes); a
 * project this size needs a different shape, because there is no single
 * mechanism to reveal — there is a small system with several cooperating parts.
 * So the order here is **"here's the next piece, and here's why it exists"**,
 * one real file at a time:
 *
 * 1. Pose the problem (what a page full of protected routes actually needs),
 *    then the wristband analogy, before any code appears.
 * 2. Introduce the three collaborators as a set (`AuthService`, the
 *    interceptor, the guard) via {@link TapeCard}, then show, with
 *    {@link Bubbles}, that none of the three know about each other directly —
 *    they only ever ask the service what it is holding.
 * 3. Walk the real implementation of each piece in turn as its own
 *    {@link CodeLab}, in the order a reader would actually build it: the
 *    service and its storage decision, the interceptor, the guard (after a
 *    predict-the-bug moment on the wrong version), the login form.
 * 4. Layer on the parts that turn a toy into something closer to production —
 *    RBAC, session persistence, `CanDeactivate`, silent token refresh,
 *    multi-tab logout, server-side revocation, federated login — each as its
 *    own small piece with its own reason to exist, not a wall of extra code.
 *
 * The live demo in the middle of the page is the actual working thing: real
 * signals, a real (simulated) login, a real guard-shaped decision rendered as
 * conditional UI. Everything else on the page is teaching material about how to
 * build more of it.
 *
 * @see intermediate/route-guards — the guards this would use.
 * @see intermediate/http-interceptors — where the token would be attached.
 * @see expert/security — why the token is in memory and not in `localStorage`.
 */
@Component({
  selector: 'app-project-auth-flow',
  standalone: true,
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
  styleUrl: './auth-flow.css',
  templateUrl: './auth-flow.html',
})
export class AuthFlow {
  /** The Projects track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Task Manager', id: 'task-manager' },
    { label: 'Auth Flow' },
    { label: 'Data Dashboard', id: 'data-dashboard' },
  ];

  /**
   * One authenticated request, end to end. Worth tracing once because every piece
   * the walkthrough builds — service, interceptor, guard, refresh — is a station
   * on this line, and knowing where each sits explains what each may assume.
   */
  protected readonly requestFlow: FlowStep[] = [
    { label: 'Login', detail: 'Credentials go to the server exactly once; a token comes back' },
    {
      label: 'Token held in memory',
      detail: 'A private field on the service — not localStorage',
      tone: 'accent',
    },
    {
      label: 'Guard checks the route',
      detail: 'Returns `true` or a `UrlTree` — never navigates itself',
    },
    {
      label: 'Interceptor clones the request',
      detail: 'Adds `Authorization: Bearer …` to every outgoing call',
    },
    {
      label: 'Server validates',
      detail: 'The signature proves the token was issued by you and is unexpired',
    },
    {
      label: '401 → refresh → retry',
      detail: 'The access token expired; swap it and replay the request once',
      tone: 'warn',
    },
  ];

  /**
   * The three collaborators never talking to each other directly — each only
   * asks {@link MockAuthService} what it is currently holding. Staged as
   * dialogue because "they are decoupled through the service" is a sentence
   * that is easy to read and easy to forget; watching them say it is not.
   */
  protected readonly decoupleTalk: BubbleTurn[] = [
    {
      who: 'Login form',
      says: 'I just called `auth.login(email, password)`. Here — a token came back.',
    },
    {
      who: 'AuthService',
      says: 'Got it. I set the user signal and stashed the token in a private field. Nobody outside me can read it directly.',
    },
    {
      who: 'HTTP interceptor',
      says: "I don't know or care how you signed in. I call `auth.getToken()` on every outgoing request and attach it if there is one.",
    },
    {
      who: 'Route guard',
      says: "I don't know or care either. I call `auth.isLoggedIn()` before letting a navigation through — that's the whole job.",
    },
  ];

  /** The guard trap, posed before the "always return a UrlTree" callout. */
  protected readonly guardSample = `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return router.navigate(['/login']);   // looks reasonable
};

// The user is signed out and hits /profile. What happens?`;

  /** The corrected guard — a `UrlTree`, never a call to `router.navigate()`. */
  protected readonly authGuardSample = `export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};`;

  /** Line-by-line walkthrough of {@link authGuardSample}. */
  protected readonly authGuardNotes: CodeNote[] = [
    {
      line: 1,
      text: '`CanActivateFn` is a plain function, like the interceptor — no class, no `@Injectable`. `state.url` is the URL the user was *trying* to reach, the piece that makes the round trip work.',
    },
    {
      line: 5,
      text: '`true` means allow the navigation, unchanged. Nothing else needs to happen.',
    },
    {
      line: 7,
      text: 'A `UrlTree` is a parsed URL object. Returning one tells the router "not there — **here**", and the router cancels this navigation and starts the new one as one atomic decision: no flash of protected content, no race between two navigations.',
    },
    {
      line: 8,
      text: 'Stashing the intended destination is the difference between “please sign in” and “please sign in, then find your way back to that invoice yourself”. The login form reads it back out of `queryParams`.',
    },
  ];

  /** Choices for the token-storage check. */
  protected readonly storageOptions: QuizOption[] = [
    {
      text: '`localStorage`, so the session survives a refresh',
      why: 'It does survive — and so does the token, in a place any JavaScript on the page can read with one line. A single XSS hole, including one in a third-party script you did not write, walks away with a valid session.',
    },
    {
      text: 'A regular (non-HttpOnly) cookie, so the browser sends it automatically',
      why: 'Automatic sending is exactly the problem: a cookie the browser attaches without being asked is what CSRF exploits. And without `HttpOnly` it is still readable by script, so it buys the risk without the protection.',
    },
    {
      text: 'In memory, with a long-lived refresh token in an HttpOnly cookie',
      correct: true,
      why: 'This splits the two jobs. The access token is short-lived and lives where no script can read it after a reload — memory. The refresh token is long-lived but sits in an `HttpOnly` cookie, which JavaScript cannot touch at all, so an XSS payload cannot steal it. A refresh call on startup restores the session without ever exposing a readable credential.',
    },
    {
      text: '`sessionStorage`, since it is cleared when the tab closes',
      why: "Better than `localStorage` on lifetime, and no better at all on the thing that matters: it is still plain readable storage. `sessionStorage.getItem` is as available to an attacker's script as it is to yours.",
    },
  ];

  /**
   * The final `AuthService` shape: signal store, in-memory token, and the
   * `sessionStorage`-backed profile restore. Deliberately shown once, fully
   * assembled, rather than as two near-identical drafts — the storage decision
   * and the persistence trick are one design, not two lessons.
   */
  protected readonly authServiceSample = `@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.loadSession());
  private _token: string | null = null; // in-memory only — no localStorage, no sessionStorage

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  // Called only by the interceptor — never exposed to templates.
  getToken() {
    return this._token;
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<{ user: AuthUser; token: string }>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        this._user.set(res.user);
        this._token = res.token;
        // Persist the PROFILE, never the token — see the callout above.
        sessionStorage.setItem('auth_user', JSON.stringify(res.user));
      }),
    );
  }

  logout() {
    this._user.set(null);
    this._token = null;
    sessionStorage.removeItem('auth_user');
  }

  private loadSession(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}`;

  /** Line-by-line walkthrough of {@link authServiceSample}. */
  protected readonly authServiceNotes: CodeNote[] = [
    {
      line: 1,
      text: "`providedIn: 'root'` makes this a singleton — one instance for the whole app, so the login form, the profile card, the interceptor and the guard all read the exact same state.",
    },
    {
      line: 3,
      text: '`loadSession()` runs in the field initialiser, so the user is already known before the first render — no flash of a signed-out header on a refresh.',
    },
    {
      line: 4,
      text: 'A **plain field**, not a signal, and never persisted anywhere. This one line is the whole storage decision: it dies with the tab, so a successful XSS payload has nothing to read out of storage.',
    },
    {
      line: 7,
      text: '`computed()` derives `isLoggedIn` from the user signal, so it can never disagree with `currentUser` — there is no separate boolean to forget to update.',
    },
    {
      line: 11,
      text: 'The one accessor for the token. Nothing calls this except the interceptor you are about to see — templates only ever read `currentUser` / `isLoggedIn` / `isAdmin`.',
    },
    {
      line: 15,
      text: 'Returns an `Observable`, unsubscribed. The *caller* subscribes — that is what lets the login component control its own loading and error UI instead of the service deciding for it.',
    },
    {
      line: 17,
      text: '`tap()` performs a side effect **without** changing what flows downstream — the caller still receives the `AuthUser`. `map()` would replace it.',
    },
    {
      line: 21,
      text: 'Only `res.user` — name, email, role — goes to storage. `res.token`, set two lines above, never does. Leaking the profile is embarrassing; leaking the token hands over the account.',
    },
    {
      line: 26,
      text: 'Clears all three places the session lives, in one method. Miss one and you get the classic bug: the UI shows signed-out while the next request still carries a valid token.',
    },
    {
      line: 35,
      text: '`getItem` returns `null` when nothing is stored, and the ternary avoids calling `JSON.parse(null)`. A corrupted value throws instead and lands in the `catch` below — either way this degrades to "signed out", the safe direction to fail in an auth service.',
    },
  ];

  /**
   * Sample: the functional HTTP interceptor. No class, no `@Injectable` — a
   * plain function Angular calls for every outgoing request.
   */
  protected readonly authInterceptorSample = `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (!token) return next(req); // not logged in — pass through unchanged

  const authedReq = req.clone({
    headers: req.headers.set('Authorization', 'Bearer ' + token),
  });
  return next(authedReq);
};

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};`;

  /** Line-by-line walkthrough of {@link authInterceptorSample}. */
  protected readonly authInterceptorNotes: CodeNote[] = [
    {
      line: 1,
      text: '`HttpInterceptorFn` is a plain function. It receives the outgoing `req` and `next`, the rest of the chain — calling `next(req)` is how you hand the request onward.',
    },
    {
      line: 2,
      text: '`inject()` works here because Angular runs interceptors inside an injection context. Calling `inject()` from inside a nested callback (like a `.subscribe()`) would **not** work.',
    },
    {
      line: 5,
      text: 'Returning `next(req)` **unchanged** is how anonymous calls opt out — and it is what stops you sending a literal `Authorization: Bearer null` to the server.',
    },
    {
      line: 7,
      text: '`HttpRequest` is **immutable**. You cannot set a header on `req` directly — `clone()` returns a modified copy. Forgetting this is the #1 interceptor bug: mutating `req` appears to work and silently changes nothing.',
    },
    {
      line: 8,
      text: '`headers.set()` is also immutable, returning a new `HttpHeaders`. `set()` replaces an existing value; `append()` would add a second one alongside it.',
    },
    {
      line: 10,
      text: 'Passes the **modified** request down the chain, not the original — the one thing every version of this bug gets backwards.',
    },
    {
      line: 14,
      text: 'The array is ordered: interceptors run left-to-right on the way out, and right-to-left on the way back with the response. One entry today; the refresh interceptor later in this page becomes the second.',
    },
  ];

  /**
   * Sample: the interceptor as it should have shipped — scoped to the app's own
   * API, with an explicit opt-out for calls that must never carry the token.
   */
  protected readonly scopedInterceptorSample = `export const SKIP_AUTH = new HttpContextToken(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isOwnApi = req.url.startsWith('/api/');
  if (!token || !isOwnApi || req.context.get(SKIP_AUTH)) {
    return next(req); // no token, a third-party origin, or opted out
  }

  return next(req.clone({
    headers: req.headers.set('Authorization', 'Bearer ' + token),
  }));
};

// login() and the refresh call both opt out explicitly:
http.post('/api/auth/refresh', {}, {
  withCredentials: true,
  context: new HttpContext().set(SKIP_AUTH, true),
});`;

  /** Line-by-line walkthrough of {@link scopedInterceptorSample}. */
  protected readonly scopedInterceptorNotes: CodeNote[] = [
    {
      line: 1,
      text: '`HttpContextToken` is a typed, per-request key. Any call can carry `context: new HttpContext().set(SKIP_AUTH, true)` to flag itself, and the interceptor reads it back with `req.context.get(SKIP_AUTH)` — a way to opt a specific request out without a URL pattern.',
    },
    {
      line: 7,
      text: '`isOwnApi` is the one line the earlier version shipped without. Without it, **every** request through this `HttpClient` gets the header attached — including a Stripe call, a maps API, an analytics beacon, or any third-party origin the app happens to talk to.',
    },
    {
      line: 8,
      text: "Three independent reasons to skip: no token yet, not the app's own API (a third-party origin), or explicitly opted out — the refresh call itself needs this last one.",
    },
    {
      line: 19,
      text: '`withCredentials: true` is what makes the browser attach the `HttpOnly` refresh cookie automatically. Cross-origin, that also triggers a CORS preflight, and the server must echo a **specific** `Access-Control-Allow-Origin` — never `*` — plus `Access-Control-Allow-Credentials: true`, or the browser discards the response before this code ever runs.',
    },
  ];

  /**
   * Sample: the role guard, chained after `authGuard` so a route can require
   * both "signed in" and "an admin".
   */
  protected readonly adminGuardSample = `export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  return inject(Router).createUrlTree(['/forbidden']);
};

// In routes — both guards must pass, left to right:
{
  path: 'admin',
  loadComponent: () => import('./admin').then((m) => m.AdminPanel),
  canActivate: [authGuard, adminGuard],
}`;

  /** Line-by-line walkthrough of {@link adminGuardSample}. */
  protected readonly adminGuardNotes: CodeNote[] = [
    {
      line: 3,
      text: "The exact same `isAdmin()` the profile card's role badge reads from below — one `computed()` signal, two completely unrelated consumers, guaranteed to agree.",
    },
    {
      line: 4,
      text: '`inject()` used inline, with no variable — perfectly legal. Injection only needs an *active injection context*, not a reference held somewhere else.',
    },
    {
      line: 11,
      text: 'Guards run in array order and **all** must return `true` for the navigation to proceed. `authGuard` runs first — an unauthenticated visitor never even reaches the question `adminGuard` asks.',
    },
  ];

  /**
   * Sample: `CanDeactivateFn` — confirming before navigating away from unsaved
   * edits. Generic over any component that can answer "do I have unsaved
   * changes?", so it is not tied to one screen.
   */
  protected readonly deactivateGuardSample = `export interface CanDeactivateComponent {
  hasUnsavedChanges: Signal<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
};`;

  /** Line-by-line walkthrough of {@link deactivateGuardSample}. */
  protected readonly deactivateGuardNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A shared **interface**, not a class. Any component that exposes this one signal satisfies the guard — without it, the guard would be hard-wired to a single component.',
    },
    {
      line: 5,
      text: 'The type parameter is what gives you a *typed* `component` argument below — `CanDeactivateFn` passes the actual instance of the component being left.',
    },
    {
      line: 6,
      text: 'Nothing to lose → leave silently. Prompting on a pristine form is the fastest way to train users to click through your dialogs without reading them.',
    },
    {
      line: 7,
      text: '`confirm()` returns a `boolean`, exactly what a guard wants: `true` = leave, `false` = stay. A real app would use a styled dialog instead — `window.confirm` blocks the whole page and cannot be themed.',
    },
  ];

  /**
   * Sample: the login component — reactive form, disabled-while-loading
   * button, and the `returnUrl` the guard planted in the query string.
   */
  protected readonly loginComponentSample = `@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" type="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <button type="submit" [disabled]="loading()">
        {{ loading() ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>
  ',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly returnUrl = inject(ActivatedRoute).snapshot.queryParams['returnUrl'] ?? '/';

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  readonly error = signal('');
  readonly loading = signal(false);

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: () => {
        this.error.set('Invalid email or password');
        this.loading.set(false);
      },
    });
  }
}`;

  /** Line-by-line walkthrough of {@link loginComponentSample}. */
  protected readonly loginComponentNotes: CodeNote[] = [
    {
      line: 6,
      text: '`type="email"` gives mobile users the right on-screen keyboard instead of a generic one.',
    },
    {
      line: 7,
      text: '`type="password"` masks the field and keeps it out of the browser\'s "did you mean to submit this as plain text?" password-manager confusion.',
    },
    {
      line: 9,
      text: 'One error slot for the whole form — and notice what it will **not** say: "no such user" or "wrong password" specifically. Distinguishing the two tells an attacker which emails are registered.',
    },
    {
      line: 11,
      text: 'Disabled while `loading()` is true, so an impatient double-click cannot fire two login requests at once.',
    },
    {
      line: 12,
      text: 'The button label doubles as the progress indicator — no spinner element needed.',
    },
    {
      line: 20,
      text: "The guard put `returnUrl` in the query string when it bounced the user here (back in `authGuardSample`) — so someone who deep-linked to `/orders/42` lands back on `/orders/42` rather than a generic home page. `?? '/' ` covers a direct visit to `/login` with no `returnUrl` at all.",
    },
    {
      line: 24,
      text: '`minLength(6)` is **client-side convenience only**. The server must enforce its own rules — anyone can `POST` straight past this validator with a tool like curl.',
    },
    {
      line: 27,
      text: 'Two pieces of local UI state (this and `loading` below) that belong to *this component*, not the auth service — a different login screen would want to present loading/error differently.',
    },
    {
      line: 31,
      text: 'Guard clause: `ngSubmit` still fires on an invalid form (pressing Enter in a field submits it), so this is what stops a pointless request from going out.',
    },
    {
      line: 33,
      text: 'Clearing any previous error here matters — otherwise the old failure message lingers under the spinner during a retry and reads as if it just failed again.',
    },
    {
      line: 35,
      text: 'The `!` non-null assertions are safe *only* because the `invalid` check above already guaranteed both controls are filled in — `FormControl` values are typed `string | null` because `reset()` can null them.',
    },
    {
      line: 39,
      text: 'Loading is reset **only** in the error branch. The success branch navigates away, so this component is destroyed and its loading state stops mattering.',
    },
  ];

  /**
   * Sample: the token-refresh interceptor — catches a 401, refreshes silently,
   * replays the original request once.
   */
  protected readonly refreshInterceptorSample = `export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/api/auth/refresh')) {
        return throwError(() => error);
      }

      return http.post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
        switchMap(({ accessToken }) => {
          auth.setToken(accessToken);
          return next(req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
          }));
        }),
        catchError((refreshError) => {
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};`;

  /** Line-by-line walkthrough of {@link refreshInterceptorSample}. */
  protected readonly refreshInterceptorNotes: CodeNote[] = [
    {
      line: 6,
      text: "`catchError` intercepts anything the request's `Observable` throws — here, any HTTP error status the backend sends back.",
    },
    {
      line: 7,
      text: 'Two conditions guard against an infinite loop: only handle `401`s, and never retry the refresh call itself — if `/api/auth/refresh` also 401s, this check is what stops it recursing forever.',
    },
    {
      line: 11,
      text: '`withCredentials: true` is what makes the browser attach the `HttpOnly` refresh-token cookie automatically — without it, the cookie never leaves the browser at all.',
    },
    {
      line: 13,
      text: 'Updates the in-memory token, so the next call to `getToken()` — including the retry two lines down — sees the fresh value.',
    },
    {
      line: 14,
      text: 'Replays the **original** request, cloned with the new token attached. The component that made the call never even sees the 401 — the whole retry is invisible to it.',
    },
    {
      line: 19,
      text: 'The refresh itself failed too, which means the session is genuinely over — a force `logout()` here is the correct move, not another retry.',
    },
  ];

  /**
   * Sample: the single-flight fix for the refresh stampede — every concurrent
   * caller shares the same in-flight refresh Observable instead of each
   * triggering its own.
   */
  protected readonly refreshStampedeFixSample = `@Injectable({ providedIn: 'root' })
export class AuthService {
  private refreshInFlight$: Observable<string> | null = null;

  refreshToken(): Observable<string> {
    if (this.refreshInFlight$) return this.refreshInFlight$; // someone's already asking

    this.refreshInFlight$ = this.http
      .post<{ accessToken: string }>('/api/auth/refresh', {}, {
        withCredentials: true,
        context: new HttpContext().set(SKIP_AUTH, true),
      })
      .pipe(
        map((res) => res.accessToken),
        tap((token) => this.setToken(token)),
        shareReplay({ bufferSize: 1, refCount: true }),
        finalize(() => (this.refreshInFlight$ = null)),
      );
    return this.refreshInFlight$;
  }
}

// tokenRefreshInterceptor's catchError block now calls this instead:
switchMap(() => auth.refreshToken()),
switchMap((accessToken) => next(req.clone({
  headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
}))),`;

  /** Line-by-line walkthrough of {@link refreshStampedeFixSample}. */
  protected readonly refreshStampedeFixNotes: CodeNote[] = [
    {
      line: 3,
      text: "`refreshInFlight$` is the whole fix — one field every caller shares, instead of each request's own interceptor pipeline building an independent Observable that knows nothing about any other request.",
    },
    {
      line: 6,
      text: "A second concurrent 401 arrives here while the first refresh is still pending, and is handed the **same** Observable rather than starting a new HTTP call — that's the single flight.",
    },
    {
      line: 11,
      text: 'Reuses the `SKIP_AUTH` escape hatch from the scoped interceptor above — the refresh call must never trigger its own `Authorization` header.',
    },
    {
      line: 16,
      text: '`shareReplay({ bufferSize: 1, refCount: true })` is what makes every subscriber — the first caller and every later one that arrived while it was pending — receive the **same** eventual value, instead of each getting its own subscription to the underlying HTTP call.',
    },
    {
      line: 17,
      text: '`finalize` clears the field once the shared Observable settles, success or error, so the **next** 401 after this one starts a genuinely new refresh instead of replaying a stale, already-completed one forever.',
    },
  ];

  /**
   * Sample: `BroadcastChannel` — a logout in one tab reaching every other tab
   * on the same origin, instantly.
   */
  protected readonly broadcastSample = `@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.loadSession());
  private _token: string | null = null;

  private readonly channel = new BroadcastChannel('auth_events');

  constructor() {
    this.channel.onmessage = ({ data }: MessageEvent<string>) => {
      if (data === 'logout') {
        this._user.set(null);
        this._token = null;
        sessionStorage.removeItem('auth_user');
      }
    };
  }

  logout() {
    this._user.set(null);
    this._token = null;
    sessionStorage.removeItem('auth_user');
    this.channel.postMessage('logout'); // tell every other tab
  }
}`;

  /** Line-by-line walkthrough of {@link broadcastSample}. */
  protected readonly broadcastNotes: CodeNote[] = [
    {
      line: 6,
      text: "One channel, shared by every tab on the same origin that opens it with this exact name — `'auth_events'` is effectively the channel's address.",
    },
    {
      line: 9,
      text: "`onmessage` fires only for messages sent by **other** tabs — `BroadcastChannel` never echoes a tab's own `postMessage` back to itself.",
    },
    {
      line: 10,
      text: "Mirrors `logout()`'s own cleanup exactly, because a message arriving from another tab has to leave this tab in the same state a real logout would.",
    },
    {
      line: 22,
      text: 'The broadcast. Every other same-origin tab with this channel open receives it and runs the handler above — no polling, no shared storage event, just a message.',
    },
  ];

  /**
   * Sample: the conceptual PKCE / Authorization Code flow a federated login
   * delegates to. Pseudocode, not a literal file — the point is the sequence,
   * not a specific library's API.
   */
  protected readonly pkceSample = `// 1. User clicks "Sign in with Google"
// 2. App generates: code_verifier (random), code_challenge = SHA-256(code_verifier)
// 3. App redirects to the IdP:
window.location.href =
  'https://accounts.google.com/o/oauth2/auth' +
  '?client_id=YOUR_CLIENT_ID' +
  '&redirect_uri=https://yourapp.com/callback' +
  '&response_type=code' +
  '&scope=openid email profile' +
  '&code_challenge=' + base64UrlEncode(sha256(codeVerifier)) +
  '&code_challenge_method=S256';

// 4. IdP authenticates the user, redirects back to /callback?code=AUTH_CODE
// 5. App exchanges the code for tokens:
const tokens = await http.post('https://oauth2.googleapis.com/token', {
  code, code_verifier: codeVerifier, client_id, redirect_uri, grant_type: 'authorization_code',
});
// tokens: { access_token, id_token (a JWT), refresh_token }

// 6. App decodes id_token's claims: sub, email, name, picture
// 7. App sends id_token to YOUR backend, which verifies it and starts a session`;

  /** Line-by-line walkthrough of {@link pkceSample}. */
  protected readonly pkceNotes: CodeNote[] = [
    {
      line: 2,
      text: '`code_verifier` never leaves the browser; `code_challenge` is a one-way hash of it. This is the whole PKCE trick — proving you hold the verifier without ever transmitting it.',
    },
    {
      line: 6,
      text: "Everything from here on is public — visible in the browser's address bar and history. That is fine: none of it is a secret, which is exactly why PKCE exists for apps (like a browser SPA) that cannot keep one.",
    },
    {
      line: 15,
      text: 'The code from step 4 is exchanged together with the **same** `code_verifier` from step 2. The server recomputes the hash and checks it matches `code_challenge` — proof this exchange came from the app that started the flow, not an attacker who intercepted the code.',
    },
    {
      line: 18,
      text: '`id_token` is a JWT your app can read (it is just base64) but should never trust for authorization on its own — it is a claim about identity, not a grant of access. Your backend still verifies its signature.',
    },
    {
      line: 21,
      text: 'The password never touched your Angular app at any point in this flow. That is the entire pitch for delegating to an identity provider.',
    },
  ];

  /** Sample: clearing local state only — the token is gone from this device, but the server never finds out. */
  protected readonly logoutClientOnlySample = `logout() {
  this._user.set(null);
  this._token = null;
  sessionStorage.removeItem('auth_user');
  // The refresh-token cookie is still valid on
  // the server. Nothing here touches it.
}`;

  /** Sample: the real thing — the server revokes the refresh token too. */
  protected readonly logoutServerSample = `logout(): Observable<void> {
  return this.http
    .post<void>('/api/auth/logout', {}, { withCredentials: true })
    .pipe(
      finalize(() => {
        this._user.set(null);
        this._token = null;
        sessionStorage.removeItem('auth_user');
        this.channel.postMessage('logout');
      }),
    );
}
// Server: reads the HttpOnly cookie, deletes/revokes
// that refresh token in its own database, clears the cookie.`;

  /** Sample: minimal `angular-oauth2-oidc` wiring for the PKCE flow above. */
  protected readonly oauthConfigSample = `// angular-oauth2-oidc — minimal setup:
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      OAuthModule.forRoot({
        resourceServer: {
          allowedUrls: ['https://api.yourapp.com'],
          sendAccessToken: true, // auto-attach token to matching URLs
        },
      }),
    ),
  ],
};
// PKCE is enabled by default in auth0-angular and angular-oauth2-oidc >= 13`;

  /** The doubts this project reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If the token must not go in localStorage, how does a real app survive a refresh?',
      a: 'It re-earns the token instead of storing it. On startup the app calls a `/refresh` endpoint; the browser automatically attaches the `HttpOnly` refresh cookie, the server checks it and returns a fresh access token that goes straight into memory. The user sees an uninterrupted session, and at no point was a readable credential sitting in storage.',
    },
    {
      q: 'What does `HttpOnly` actually do? It sounds like it is about HTTP versus HTTPS.',
      a: 'Nothing to do with HTTPS — that is the `Secure` flag. `HttpOnly` means the cookie is invisible to JavaScript: `document.cookie` will not show it and no script can read it. The browser still sends it on requests. It is the one storage location in a browser that an XSS payload genuinely cannot reach, which is why the most valuable credential goes there.',
    },
    {
      q: 'If the guard already blocks the route, why does the server need to check anything?',
      a: "Because the guard is a *convenience*, not a defence. It runs in the user's browser, in code they can read and modify — anyone can open devtools and call the router directly. A guard exists to stop honest users from landing on a broken page. Authorisation is enforced on the server, every request, without exception.",
    },
    {
      q: 'This demo keeps the user object in sessionStorage. Does that contradict the advice?',
      a: 'No, because the user object is not a credential. Storing `{ name, email, role }` lets the UI render immediately on refresh without a flash of logged-out state; if an attacker reads or edits it, they get a wrong-looking navbar and nothing else. The *token* is what grants access, and that is what stays out of storage. Never trust the stored role for anything but rendering.',
    },
    {
      q: 'Do I need CSRF protection if I send a bearer token in a header?',
      a: "Generally no, and that is the quiet upside of headers. CSRF works because browsers attach cookies to cross-site requests automatically; an `Authorization` header is never attached automatically, so an attacker's page cannot forge one. The moment you put the refresh token in a cookie, though, that endpoint is cookie-authenticated and does need protecting — usually `SameSite=Strict` plus a CSRF token.",
    },
  ];

  /**
   * The auth service.
   */
  protected readonly auth = inject(MockAuthService);
  /**
   * The email field. A signal, like every other piece of reactive state this
   * template reads — kept in step with `MockAuthService`'s own fields rather
   * than mixing a plain two-way-bound property in among them.
   */
  protected readonly email = signal('');
  /**
   * The password field.
   */
  protected readonly password = signal('');
  /**
   * The sign-in error, or empty.
   */
  protected readonly loginError = signal('');

  /**
   * Attempts a sign-in and reports failure.
   *
   * The message says the credentials are wrong without saying which one — the same
   * user-enumeration rule a real login has to follow.
   */
  protected login() {
    this.loginError.set('');
    const ok = this.auth.login(this.email(), this.password());
    if (!ok) this.loginError.set('Invalid email or password. Try the hint buttons above.');
  }

  /**
   * Fills in the admin credentials, so the role-based UI can be tried without
   * reading them off the page.
   */
  protected fillAdmin() {
    this.email.set('admin@example.com');
    this.password.set('admin123');
  }
  /**
   * Fills in the ordinary-user credentials.
   */
  protected fillUser() {
    this.email.set('user@example.com');
    this.password.set('user123');
  }
}
