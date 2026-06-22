import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-route-guards',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Functional Route Guards</h1>
      <p class="lead">
        Guards decide whether navigation may proceed. Modern guards are just
        functions that return <code>boolean</code>, a <code>UrlTree</code> (to
        redirect), or an <code>Observable</code>/<code>Promise</code> of those.
      </p>

      <h2>CanActivate — protect a route</h2>
      <div class="code">
        <pre>export const authGuard: CanActivateFn = (route, state) =&gt; {{ '{' }}
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
{{ '}' }};

// in routes:
{{ '{' }} path: 'admin', canActivate: [authGuard], component: Admin {{ '}' }}</pre>
      </div>

      <h2>The guard types</h2>
      <table class="t">
        <tr><td><code>CanActivateFn</code></td><td>Can the user enter this route?</td></tr>
        <tr><td><code>CanActivateChildFn</code></td><td>Can the user enter any child route?</td></tr>
        <tr><td><code>CanDeactivateFn</code></td><td>May the user leave? (e.g. unsaved-changes prompt)</td></tr>
        <tr><td><code>CanMatchFn</code></td><td>Should this route even match? Runs before lazy loading — great for feature flags &amp; role-based bundles.</td></tr>
      </table>

      <h2>CanDeactivate — guard against losing work</h2>
      <div class="code">
        <pre>export const unsavedGuard: CanDeactivateFn&lt;EditPage&gt; = (component) =&gt;
  component.hasUnsavedChanges()
    ? confirm('Discard unsaved changes?')
    : true;</pre>
      </div>

      <h2>CanMatch — choose a route conditionally</h2>
      <div class="code">
        <pre>{{ '{' }} path: 'beta', canMatch: [featureFlag('beta')], loadComponent: ... {{ '}' }}
// if the flag is off the route simply doesn't match → falls through</pre>
      </div>

      <h2>Try it — a simulated authGuard</h2>
      <div class="demo">
        <p class="demo__title">Live — toggle "auth" then attempt navigation</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="loggedIn.set(!loggedIn())">
            {{ loggedIn() ? 'Log out' : 'Log in' }}
          </button>
          <span class="pill">isLoggedIn: {{ loggedIn() }}</span>
          <button class="ghost" (click)="attempt()">Navigate to /admin</button>
        </div>
        <p>guard result: <strong>{{ outcome() }}</strong></p>
      </div>

      <div class="note">
        Functional guards use <code>inject()</code> to reach services — no class, no
        boilerplate. They replaced the old class-based <code>CanActivate</code>
        interfaces. Multiple guards on a route <strong>all</strong> must pass (logical
        AND), evaluated in array order; the first to return <code>false</code>/a
        <code>UrlTree</code> stops navigation. <code>canActivateChild</code> guards a
        parent's children without repeating the guard on each.
      </div>
      <div class="warn">
        Inside a guard, <strong>return</strong> a <code>UrlTree</code>
        (<code>router.createUrlTree([...])</code>) to redirect — don't call
        <code>router.navigate()</code> yourself, which races with the navigation the
        guard is resolving. Returning a <code>UrlTree</code> cancels the current
        navigation and starts the redirect atomically.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Guards are functions returning <code>boolean</code> | <code>UrlTree</code> | <code>Observable</code>/<code>Promise</code>.</li>
        <li>Return a <code>UrlTree</code> to redirect instead of blocking.</li>
        <li><code>CanMatch</code> runs before lazy loading — ideal for flags/roles.</li>
        <li><code>CanDeactivate</code> protects against leaving with unsaved work.</li>
      </ul>

      <p><a routerLink="/resolvers">Next: Resolvers &amp; Route Data →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 190px; white-space: nowrap; }`,
  ],
})
export class RouteGuards {
  protected readonly loggedIn = signal(false);
  protected readonly outcome = signal('—');

  protected attempt() {
    this.outcome.set(
      this.loggedIn()
        ? '✅ true → navigation allowed to /admin'
        : '⛔ redirected to /login (returned a UrlTree)',
    );
  }
}
