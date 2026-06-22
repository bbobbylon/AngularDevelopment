import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ============================================================
// WHAT YOU'LL BUILD: an Auth Flow covering:
//   Signal store for auth state, JWT token handling (in-memory),
//   HTTP interceptors, Route guards, Login form, Profile page
// ============================================================

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// ---------- Simulated Auth Service (normally backed by HTTP) ----------
@Injectable({ providedIn: 'root' })
class MockAuthService {
  private readonly _user = signal<AuthUser | null>(this.loadSession());
  private _token: string | null = null;
  private _fromSession = this._user() !== null;

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  getToken() { return this._token; }
  wasRestoredFromSession() { return this._fromSession; }

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

  logout() {
    this._user.set(null);
    this._token = null;
    this._fromSession = false;
    sessionStorage.removeItem('demo_auth_user');
  }

  private loadSession(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem('demo_auth_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

@Component({
  selector: 'app-project-auth-flow',
  standalone: true,
  imports: [RouterLink, FormsModule],
  styles: [`
    .auth-demo { max-width: 460px; }
    .auth-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 24px; }
    .auth-panel h3 { margin: 0 0 16px; font-size: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .field label { font-size: .83rem; color: var(--text-muted); }
    .field input { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: .9rem; }
    .login-btn { width: 100%; padding: 9px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .login-btn:hover { background: #5558e3; }
    .error-msg { color: #ef4444; font-size: .85rem; margin-bottom: 10px; }
    .profile-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.4rem; font-weight: 700; margin-bottom: 12px; }
    .profile-name { font-size: 1.1rem; font-weight: 600; }
    .profile-email { color: var(--text-muted); font-size: .88rem; }
    .role-badge { display: inline-block; margin: 8px 0; padding: 4px 12px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
    .role-badge.admin { background: #fee2e2; color: #991b1b; }
    .role-badge.user  { background: #dcfce7; color: #166534; }
    .logout-btn { margin-top: 14px; padding: 7px 16px; border: 1px solid var(--border); border-radius: 8px; background: transparent; cursor: pointer; color: var(--text); font-size: .88rem; }
    .hint-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
    .hint-pill { font-size: .78rem; padding: 4px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); cursor: pointer; color: var(--text); }
    .hint-pill:hover { background: rgba(99,102,241,.1); }
    .step-callout { background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: .88rem; line-height: 1.5; }
    .step-callout h4 { margin: 0 0 6px; color: #6366f1; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Projects · Full Walkthrough</span>
      <h1>Project: Auth Flow</h1>
      <p class="lead">
        Build a complete authentication flow: login form, JWT token storage, an HTTP
        interceptor that attaches the token to every request, and a route guard that
        protects private pages.
      </p>

      <h2>What you will build</h2>
      <ul>
        <li>A signal-based <code>AuthService</code> that holds the current user and token</li>
        <li>A login form with error feedback</li>
        <li>A profile page shown only when logged in</li>
        <li>An HTTP interceptor that automatically attaches <code>Authorization: Bearer ...</code></li>
        <li>A functional route guard (<code>authGuard</code>) that redirects unauthenticated users</li>
      </ul>

      <h2>Architecture overview</h2>
      <div class="code">
        <pre>AuthService (root service)
  currentUser: Signal&lt;AuthUser | null&gt;    // read-only
  isLoggedIn:  Signal&lt;boolean&gt;            // computed
  isAdmin:     Signal&lt;boolean&gt;            // computed
  login(email, password): boolean         // sets user + token
  logout(): void                          // clears both

authInterceptor (functional interceptor)
  reads AuthService.getToken()
  clones the request with Authorization header
  passes to next()

authGuard (functional CanActivateFn)
  reads AuthService.isLoggedIn()
  returns true or UrlTree('/login')</pre>
      </div>

      <h2>Step 1 — The AuthService signal store</h2>
      <div class="step-callout">
        <h4>Key decision: where to store the JWT</h4>
        We keep the token in memory (a private class field) — not localStorage. In-memory
        tokens are invisible to other tabs and XSS cannot read them with document.cookie or
        localStorage.getItem. The downside: the user is logged out on page refresh. For
        production, use an HttpOnly cookie (server-set) or a short-lived access token
        refreshed from a secure refresh token cookie.
      </div>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AuthService {{ '{' }}
  private readonly _user  = signal&lt;AuthUser | null&gt;(null);
  private _token: string | null = null;  // in-memory only — no localStorage

  // Public read-only signals
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() =&gt; this._user() !== null);
  readonly isAdmin     = computed(() =&gt; this._user()?.role === 'admin');

  // Called only by the interceptor — never exposed to templates
  getToken() {{ '{' }} return this._token; {{ '}' }}

  login(email: string, password: string): Observable&lt;AuthUser&gt; {{ '{' }}
    return this.http.post&lt;{{ '{' }} user: AuthUser; token: string {{ '}' }}&gt;('/api/auth/login',
      {{ '{' }} email, password {{ '}' }}
    ).pipe(
      tap(res =&gt; {{ '{' }}
        this._user.set(res.user);
        this._token = res.token;
      {{ '}' }})
    );
  {{ '}' }}

  logout() {{ '{' }}
    this._user.set(null);
    this._token = null;
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 2 — The HTTP interceptor</h2>
      <div class="step-callout">
        <h4>Concept: functional interceptors</h4>
        Interceptors sit between your code and the network. Every HTTP request passes
        through them. The auth interceptor reads the token and attaches it as a header —
        your services never need to know about auth.
      </div>
      <div class="code">
        <pre>// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) =&gt; {{ '{' }}
  const auth  = inject(AuthService);
  const token = auth.getToken();

  if (!token) return next(req);   // not logged in — pass through unchanged

  const authedReq = req.clone({{ '{' }}
    headers: req.headers.set('Authorization', 'Bearer ' + token)
  {{ '}' }});
  return next(authedReq);
{{ '}' }};

// app.config.ts — register it:
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
{{ '}' }};</pre>
      </div>

      <h2>Step 3 — The route guard</h2>
      <div class="step-callout">
        <h4>Critical: always return a UrlTree, never call router.navigate()</h4>
        Calling router.navigate() inside a guard and returning undefined lets the original
        navigation proceed. Always return a UrlTree to block AND redirect atomically.
      </div>
      <div class="code">
        <pre>// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) =&gt; {{ '{' }}
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Return a UrlTree — blocks AND redirects in one operation:
  return router.createUrlTree(['/login'], {{ '{' }}
    queryParams: {{ '{' }} returnUrl: state.url {{ '}' }}    // save where they were going
  {{ '}' }});
{{ '}' }};

// In routes:
{{ '{' }}
  path: 'dashboard',
  loadComponent: () =&gt; import('./dashboard').then(m =&gt; m.Dashboard),
  canActivate: [authGuard],          // guard runs before the component loads
{{ '}' }},

// In LoginComponent — redirect back after login:
readonly returnUrl = inject(ActivatedRoute).snapshot.queryParams['returnUrl'] ?? '/dashboard';
// After successful login:
this.router.navigateByUrl(this.returnUrl);</pre>
      </div>

      <h2>Step 4 — The login component</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '
    &lt;form [formGroup]="form" (ngSubmit)="submit()"&gt;
      &lt;input formControlName="email"    type="email" placeholder="Email" /&gt;
      &lt;input formControlName="password" type="password" placeholder="Password" /&gt;
      &#64;if (error()) {{ '{' }}
        &lt;p class="error"&gt;{{ '{{' }} error() {{ '}}' }}&lt;/p&gt;
      {{ '}' }}
      &lt;button type="submit" [disabled]="loading()"&gt;
        {{ '{{' }} loading() ? 'Signing in...' : 'Sign In' {{ '}}' }}
      &lt;/button&gt;
    &lt;/form&gt;
  '
{{ '}' }})
export class LoginComponent {{ '{' }}
  private auth   = inject(AuthService);
  private router = inject(Router);
  readonly returnUrl = inject(ActivatedRoute).snapshot.queryParams['returnUrl'] ?? '/';

  form = new FormGroup({{ '{' }}
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  {{ '}' }});

  readonly error   = signal('');
  readonly loading = signal(false);

  submit() {{ '{' }}
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.value.email!, this.form.value.password!).subscribe({{ '{' }}
      next: () =&gt; this.router.navigateByUrl(this.returnUrl),
      error: () =&gt; {{ '{' }}
        this.error.set('Invalid email or password');
        this.loading.set(false);
      {{ '}' }},
    {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Live demo — auth simulation</h2>
      <div class="demo">
        <p class="demo__title">Try logging in with different accounts</p>
        <div class="hint-row">
          <span class="hint-pill" (click)="fillAdmin()">admin&#64;example.com / admin123</span>
          <span class="hint-pill" (click)="fillUser()">user&#64;example.com / user123</span>
        </div>
        <div class="auth-demo">
          @if (!auth.isLoggedIn()) {
            <div class="auth-panel">
              <h3>Sign In</h3>
              @if (loginError()) {
                <p class="error-msg">{{ loginError() }}</p>
              }
              <div class="field">
                <label>Email</label>
                <input [(ngModel)]="email" type="email" placeholder="you@example.com" />
              </div>
              <div class="field">
                <label>Password</label>
                <input [(ngModel)]="password" type="password" placeholder="password" />
              </div>
              <button class="login-btn" (click)="login()">Sign In</button>
            </div>
          } @else {
            <div class="profile-card">
              <div class="avatar">{{ auth.currentUser()!.name.charAt(0) }}</div>
              <p class="profile-name">{{ auth.currentUser()!.name }}</p>
              <p class="profile-email">{{ auth.currentUser()!.email }}</p>
              <span class="role-badge {{ auth.currentUser()!.role }}">{{ auth.currentUser()!.role }}</span>
              @if (auth.isAdmin()) {
                <p style="margin:8px 0;font-size:.85rem;color:#6366f1">You have admin access.</p>
              }
              <p style="margin:8px 0 0;font-size:.78rem;color:var(--text-muted)">
                {{ auth.wasRestoredFromSession() ? '↺ Restored from sessionStorage' : '✓ Session saved — refresh the tab to test' }}
              </p>
              <br>
              <button class="logout-btn" (click)="auth.logout()">Log out</button>
            </div>
          }
        </div>
      </div>

      <h2>Step 5 — Role-based access control (RBAC) and session persistence</h2>
      <div class="code">
        <pre>// Role guard — restrict routes to admins only:
export const adminGuard: CanActivateFn = () =&gt; {{ '{' }}
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  return inject(Router).createUrlTree(['/forbidden']);
{{ '}' }};

// In routes:
{{ '{' }}
  path: 'admin',
  loadComponent: () =&gt; import('./admin').then(m =&gt; m.AdminPanel),
  canActivate: [authGuard, adminGuard],   // both guards must pass
{{ '}' }},

// In templates — hide UI elements based on role:
&#64;if (auth.isAdmin()) {{ '{' }}
  &lt;button (click)="deleteUser(id)"&gt;Delete User&lt;/button&gt;
{{ '}' }}

// IMPORTANT: guards protect the UI, not the data.
// Your backend must still authorize every API call independently.</pre>
      </div>

      <h2>Step 6 — Persist the user across tab refresh (sessionStorage)</h2>
      <div class="step-callout">
        <h4>Key decision: user object vs token</h4>
        Store the user profile (name, role) in sessionStorage so the UI can restore
        immediately on refresh — no API round-trip needed. Never store the JWT in sessionStorage
        (it is vulnerable to XSS). The token stays in memory only and the user re-authenticates
        silently via a refresh-token cookie when they revisit.
      </div>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AuthService {{ '{' }}
  // On construction, attempt to restore from sessionStorage:
  private readonly _user = signal&lt;AuthUser | null&gt;(this.loadSession());
  private _token: string | null = null;  // token stays in-memory only

  login(email: string, password: string) {{ '{' }}
    return this.http.post&lt;AuthResponse&gt;('/api/auth/login', {{ '{' }} email, password {{ '}' }}).pipe(
      tap(res =&gt; {{ '{' }}
        this._user.set(res.user);
        this._token = res.accessToken;
        // Persist the user profile — NOT the token:
        sessionStorage.setItem('auth_user', JSON.stringify(res.user));
      {{ '}' }})
    );
  {{ '}' }}

  logout() {{ '{' }}
    this._user.set(null);
    this._token = null;
    sessionStorage.removeItem('auth_user');
  {{ '}' }}

  private loadSession(): AuthUser | null {{ '{' }}
    try {{ '{' }}
      const raw = sessionStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    {{ '}' }} catch {{ '{' }} return null; {{ '}' }}
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 7 — CanDeactivate guard for unsaved changes</h2>
      <div class="step-callout">
        <h4>Concept: CanDeactivateFn prevents accidental navigation away</h4>
        When a user has unsaved form edits, ask them to confirm before navigating away.
        The guard gets a reference to the component, so it can call a method on it
        or read a signal.
      </div>
      <div class="code">
        <pre>// Shared interface — components that support deactivation checks implement it:
export interface CanDeactivateComponent {{ '{' }}
  hasUnsavedChanges: Signal&lt;boolean&gt;;
{{ '}' }}

// The guard — generic, reusable across any component:
export const unsavedChangesGuard: CanDeactivateFn&lt;CanDeactivateComponent&gt; = (component) =&gt; {{ '{' }}
  if (!component.hasUnsavedChanges()) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
{{ '}' }};

// In routes:
{{ '{' }}
  path: 'profile/edit',
  component: ProfileEditComponent,
  canDeactivate: [unsavedChangesGuard],
{{ '}' }},

// In ProfileEditComponent:
export class ProfileEditComponent implements CanDeactivateComponent {{ '{' }}
  form = new FormGroup({{ '{' }} ... {{ '}' }});
  readonly hasUnsavedChanges = computed(() =&gt; this.form.dirty);
{{ '}' }}</pre>
      </div>

      <h2>Step 8 — JWT refresh token interceptor (enterprise pattern)</h2>
      <div class="step-callout">
        <h4>The problem: short-lived access tokens expire</h4>
        Enterprise apps use access tokens that expire in 15 minutes. When they do, every
        API call returns 401. The solution is a refresh token interceptor that catches
        the 401, silently calls /api/auth/refresh (the server reads an HttpOnly refresh
        token cookie automatically), gets a new access token, then retries the original
        request — all invisible to the component that made the call.
      </div>
      <div class="code">
        <pre>// token-refresh.interceptor.ts
import {{ '{' }} inject {{ '}' }} from '@angular/core';
import {{ '{' }} HttpInterceptorFn, HttpErrorResponse, HttpClient {{ '}' }} from '@angular/common/http';
import {{ '{' }} catchError, switchMap, throwError {{ '}' }} from 'rxjs';
import {{ '{' }} AuthService {{ '}' }} from './auth.service';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) =&gt; {{ '{' }}
  const auth = inject(AuthService);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) =&gt; {{ '{' }}
      // Only intercept 401s — and never retry the refresh call itself
      if (error.status !== 401 || req.url.includes('/api/auth/refresh')) {{ '{' }}
        return throwError(() =&gt; error);
      {{ '}' }}

      // Call the refresh endpoint — browser sends the HttpOnly cookie automatically
      return http.post&lt;{{ '{' }} accessToken: string {{ '}' }}&gt;(
        '/api/auth/refresh', {{ '{' }}{{ '}' }}, {{ '{' }} withCredentials: true {{ '}' }}
      ).pipe(
        switchMap(({{ '{' }} accessToken {{ '}' }}) =&gt; {{ '{' }}
          auth.setToken(accessToken);       // update the in-memory token
          // Replay the original request with the new token attached:
          return next(req.clone({{ '{' }}
            headers: req.headers.set('Authorization', 'Bearer ' + accessToken),
          {{ '}' }}));
        {{ '}' }}),
        catchError((refreshError) =&gt; {{ '{' }}
          // Refresh token is expired too — force the user to log in again
          auth.logout();
          return throwError(() =&gt; refreshError);
        {{ '}' }}),
      );
    {{ '}' }}),
  );
{{ '}' }};

// Register both interceptors in app.config.ts — order matters:
// authInterceptor runs first (attaches token), tokenRefreshInterceptor retries on 401.
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, tokenRefreshInterceptor])
    ),
  ],
{{ '}' }};</pre>
      </div>
      <div class="note">
        <strong>Why switchMap, not mergeMap?</strong> switchMap cancels any previous
        in-flight refresh. If two requests 401 simultaneously, only one refresh call
        goes out. For production, share a single refresh Observable with
        <code>shareReplay(1)</code> so concurrent 401s all wait on the same call rather
        than firing multiple refresh requests.
      </div>

      <h2>Step 9 — Multi-tab sync with BroadcastChannel</h2>
      <div class="step-callout">
        <h4>Problem: logging out in one tab doesn't affect other tabs</h4>
        Signals live in a single JavaScript context. Tab B has no way to know Tab A
        logged out — until you use the BroadcastChannel API, which sends messages
        between all same-origin tabs instantly.
      </div>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AuthService {{ '{' }}
  private readonly _user  = signal&lt;AuthUser | null&gt;(this.loadSession());
  private _token: string | null = null;

  // One channel shared across all tabs on the same origin:
  private readonly channel = new BroadcastChannel('auth_events');

  constructor() {{ '{' }}
    // Listen for messages sent by OTHER tabs (not ourselves):
    this.channel.onmessage = ({{ '{' }} data {{ '}' }}: MessageEvent&lt;string&gt;) =&gt; {{ '{' }}
      if (data === 'logout') {{ '{' }}
        this._user.set(null);
        this._token = null;
        sessionStorage.removeItem('auth_user');
        // Optionally navigate to /login here via inject(Router)
      {{ '}' }}
    {{ '}' }};
  {{ '}' }}

  logout() {{ '{' }}
    this._user.set(null);
    this._token = null;
    sessionStorage.removeItem('auth_user');
    this.channel.postMessage('logout'); // broadcast to all other tabs
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 10 — Server-side logout (token revocation)</h2>
      <div class="step-callout">
        <h4>Client-only logout is not real logout</h4>
        Clearing the in-memory token means the current device can no longer make
        authenticated requests. But if the refresh token cookie is still valid, an
        attacker (or another device) can silently obtain a new access token. Real logout
        tells the server to invalidate the refresh token in its database.
      </div>
      <div class="code">
        <pre>// In AuthService:
logout(): Observable&lt;void&gt; {{ '{' }}
  return this.http
    .post&lt;void&gt;('/api/auth/logout', {{ '{' }}{{ '}' }}, {{ '{' }} withCredentials: true {{ '}' }})
    .pipe(
      finalize(() =&gt; {{ '{' }}
        // Always clear locally — even if the server call fails
        this._user.set(null);
        this._token = null;
        sessionStorage.removeItem('auth_user');
        this.channel.postMessage('logout');
      {{ '}' }})
    );
{{ '}' }}

// Server must:
// 1. Read the refresh token from the HttpOnly cookie
// 2. Delete (or mark revoked) that token in the DB
// 3. Clear the cookie:  Set-Cookie: refresh_token=; Max-Age=0; HttpOnly; Secure

// In the component:
logoutClick() {{ '{' }}
  this.auth.logout().subscribe(); // subscribe to trigger the HTTP call
{{ '}' }}</pre>
      </div>
      <div class="note">
        <strong>finalize() vs tap()</strong> — use <code>finalize()</code> to guarantee
        local state is cleared whether the server call succeeds or fails. Using
        <code>tap()</code> would skip the cleanup if the network request errors.
      </div>

      <h2>PKCE / OAuth2 OIDC — federated login (concept map)</h2>
      <div class="step-callout">
        <h4>Most enterprise apps don't roll their own auth</h4>
        They delegate to an Identity Provider (IdP) — Google, Microsoft Azure AD, Okta,
        Auth0 — using the OAuth2 Authorization Code flow with PKCE. Your Angular app
        never sees the user's password; the IdP handles it and returns tokens.
      </div>
      <div class="code">
        <pre>// High-level PKCE flow (what happens in the browser):
//
// 1. User clicks "Sign in with Google"
// 2. App generates: code_verifier (random), code_challenge = SHA-256(code_verifier)
// 3. App redirects to IdP:
//    https://accounts.google.com/o/oauth2/auth
//      ?client_id=YOUR_CLIENT_ID
//      &redirect_uri=https://yourapp.com/callback
//      &response_type=code
//      &scope=openid email profile
//      &code_challenge=BASE64URL(SHA256(verifier))
//      &code_challenge_method=S256
//
// 4. IdP authenticates the user, redirects back to /callback?code=AUTH_CODE
// 5. App exchanges the code:
//    POST https://oauth2.googleapis.com/token
//      {{ '{' }} code, code_verifier, client_id, redirect_uri, grant_type: 'authorization_code' {{ '}' }}
//    Response: {{ '{' }} access_token, id_token (JWT), refresh_token {{ '}' }}
//
// 6. App decodes the id_token JWT (claims: sub, email, name, picture)
// 7. App sends id_token to YOUR backend for verification and session creation

// Angular library: use @angular/fire for Firebase/Google, or @auth0/auth0-angular,
// or the lightweight 'angular-oauth2-oidc' package.

// angular-oauth2-oidc — minimal setup:
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      OAuthModule.forRoot({{ '{' }}
        resourceServer: {{ '{' }}
          allowedUrls: ['https://api.yourapp.com'],
          sendAccessToken: true,       // auto-attach token to matching URLs
        {{ '}' }},
      {{ '}' }})
    ),
  ],
{{ '}' }};

// In AppComponent.ngOnInit():
this.oauthService.configure({{ '{' }}
  issuer: 'https://accounts.google.com',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: window.location.origin + '/callback',
  scope: 'openid email profile',
  responseType: 'code',
{{ '}' }});
await this.oauthService.loadDiscoveryDocumentAndTryLogin();
// PKCE is enabled by default in auth0-angular and angular-oauth2-oidc >=13</pre>
      </div>

      <h2>What you practiced</h2>
      <ul>
        <li><strong>Signal store for auth state</strong> — private token, read-only user signal, computed flags</li>
        <li><strong>SessionStorage persistence</strong> — user profile survives tab refresh; token stays in-memory</li>
        <li><strong>Functional HTTP interceptor</strong> — auto-attaches Authorization header</li>
        <li><strong>Functional route guard</strong> — returns UrlTree to redirect, saves returnUrl</li>
        <li><strong>CanDeactivate guard</strong> — prevents accidental navigation from unsaved forms</li>
        <li><strong>Role-based access</strong> — computed isAdmin() signal, admin guard, template conditionals</li>
        <li><strong>JWT refresh token interceptor</strong> — catches 401, silently refreshes, retries original request</li>
        <li><strong>BroadcastChannel multi-tab sync</strong> — logout in one tab reflects everywhere instantly</li>
        <li><strong>Server-side logout</strong> — revokes refresh token on the server with finalize() safety net</li>
        <li><strong>PKCE / OAuth2 OIDC</strong> — federated login flow with an external identity provider</li>
      </ul>

      <h2>Further extensions</h2>
      <ul>
        <li>Share the refresh Observable with <code>shareReplay(1)</code> so concurrent 401s send only one refresh request</li>
        <li>Replace <code>confirm()</code> in the canDeactivate guard with a custom Angular dialog component</li>
        <li>Write a test for <code>authGuard</code> using TestBed with a mocked AuthService</li>
        <li>Add silent re-auth on app load: call <code>/api/auth/refresh</code> on startup and set the token before the first protected route resolves</li>
        <li>Implement "logout all devices" by adding a <code>jti</code> (JWT ID) claim and maintaining a server-side revocation list</li>
      </ul>

      <p><a routerLink="/data-dashboard">Next Project: Data Dashboard →</a></p>
    </article>
  `,
})
export class AuthFlow {
  protected readonly auth = inject(MockAuthService);
  protected email = '';
  protected password = '';
  protected readonly loginError = signal('');

  protected login() {
    this.loginError.set('');
    const ok = this.auth.login(this.email, this.password);
    if (!ok) this.loginError.set('Invalid email or password. Try the hint buttons above.');
  }

  protected fillAdmin() { this.email = 'admin@example.com'; this.password = 'admin123'; }
  protected fillUser()  { this.email = 'user@example.com';  this.password = 'user123'; }
}
