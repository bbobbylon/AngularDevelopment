import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  getToken() { return this._token; }
  /**
   * Whether the session was restored rather than logged in.
   */
  wasRestoredFromSession() { return this._fromSession; }

  /**
   * Attempts a sign-in.
   *
   * @param email    The email.
   * @param password The password.
   * @returns Whether it succeeded.
   */
  login(email: string, password: string): boolean {
    const users: Record<string, { password: string; user: AuthUser }> = {
      'admin@example.com': { password: 'admin123', user: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' } },
      'user@example.com':  { password: 'user123',  user: { id: 2, name: 'Jane Smith', email: 'user@example.com',  role: 'user'  } },
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
  imports: [RouterLink, FormsModule],
  styleUrl: './auth-flow.css',
  templateUrl: './auth-flow.html',
})
export class AuthFlow {
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
  protected fillAdmin() { this.email = 'admin@example.com'; this.password = 'admin123'; }
  /**
   * Fills in the ordinary-user credentials.
   */
  protected fillUser()  { this.email = 'user@example.com';  this.password = 'user123'; }
}
