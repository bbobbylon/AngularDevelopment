import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 * @see intermediate/route-guards — the guards this would use.
 * @see intermediate/http-interceptors — where the token would be attached.
 * @see expert/security — why the token is in memory and not in `localStorage`.
 */
@Component({
  selector: 'app-project-auth-flow',
  standalone: true,
  imports: [RouterLink, FormsModule, Faq, Flow, Predict, Quiz, Remember],
  styleUrl: './auth-flow.css',
  templateUrl: './auth-flow.html',
})
export class AuthFlow {
  /**
   * One authenticated request, end to end. Worth tracing once because every piece
   * the walkthrough builds — service, interceptor, guard, refresh — is a station
   * on this line, and knowing where each sits explains what each may assume.
   */
  protected readonly requestFlow = [
    { label: 'Login', detail: 'Credentials go to the server exactly once; a token comes back' },
    {
      label: 'Token held in memory',
      detail: 'A private field on the service — not localStorage',
      tone: 'accent' as const,
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
      tone: 'warn' as const,
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

  /** Choices for the token-storage check. */
  protected readonly storageOptions = [
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

  /** The doubts this project reliably leaves behind. */
  protected readonly questions = [
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
   * The email field.
   */
  protected email = '';
  /**
   * The password field.
   */
  protected password = '';
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
    const ok = this.auth.login(this.email, this.password);
    if (!ok) this.loginError.set('Invalid email or password. Try the hint buttons above.');
  }

  /**
   * Fills in the admin credentials, so the role-based UI can be tried without
   * reading them off the page.
   */
  protected fillAdmin() {
    this.email = 'admin@example.com';
    this.password = 'admin123';
  }
  /**
   * Fills in the ordinary-user credentials.
   */
  protected fillUser() {
    this.email = 'user@example.com';
    this.password = 'user123';
  }
}
