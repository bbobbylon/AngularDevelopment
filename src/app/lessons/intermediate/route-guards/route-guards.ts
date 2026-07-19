import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: functional route guards.
 *
 * Beyond CanActivate: the full guard execution order (deactivate → match →
 * activate → activateChild → resolvers), a live CanDeactivate unsaved-changes
 * demo alongside the auth demo, the return-type menu (boolean | UrlTree |
 * RedirectCommand | async), why you return a UrlTree instead of calling
 * navigate(), canMatch vs canActivate for lazy routes, and the exam traps.
 */
@Component({
  selector: 'app-lesson-route-guards',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Functional Route Guards</h1>
      <p class="lead">
        Guards decide whether navigation may proceed. Modern guards are just functions
        that <code>inject()</code> services and return <code>boolean</code>, a
        <code>UrlTree</code> / <code>RedirectCommand</code> (to redirect), or an
        <code>Observable</code>/<code>Promise</code> of those.
      </p>

      <h2>CanActivate — protect a route</h2>
      <div class="code"><pre>{{ authSample }}</pre></div>

      <h2>The guard types</h2>
      <table class="cmp">
        <tr><td><code>CanActivateFn</code></td><td>Can the user enter this route?</td></tr>
        <tr><td><code>CanActivateChildFn</code></td><td>Can the user enter any child route? (guard a parent's children once)</td></tr>
        <tr><td><code>CanDeactivateFn</code></td><td>May the user leave? (e.g. unsaved-changes prompt)</td></tr>
        <tr><td><code>CanMatchFn</code></td><td>Should this route even match? Runs <em>before</em> lazy loading — feature flags, role-based bundles, A/B routes.</td></tr>
      </table>

      <h2>Execution order</h2>
      <p>
        A single navigation runs guards in a fixed sequence — and only reaches resolvers
        if every guard passes. Knowing the order explains a lot of "why didn't my guard
        run?" confusion:
      </p>
      <div class="code"><pre>{{ orderSample }}</pre></div>

      <h2>Live — auth guard &amp; unsaved-changes guard</h2>
      <div class="demo">
        <p class="demo__title">Live — CanActivate</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="loggedIn.set(!loggedIn())">{{ loggedIn() ? 'Log out' : 'Log in' }}</button>
          <span class="pill">isLoggedIn: {{ loggedIn() }}</span>
          <button class="ghost" (click)="attempt()">Navigate to /admin</button>
        </div>
        <p>guard result: <strong>{{ outcome() }}</strong></p>
      </div>
      <div class="demo">
        <p class="demo__title">Live — CanDeactivate</p>
        <div class="row" style="margin-bottom:10px">
          <input placeholder="edit me…" (input)="dirty.set(true)" style="width:240px" />
          <button (click)="dirty.set(false)">Save</button>
          <button class="ghost" (click)="leave()">Leave page</button>
        </div>
        <p>guard result: <strong>{{ leaveOutcome() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Type to make the form dirty, then "Leave" — the guard blocks. Save first, and it
          lets you go.
        </p>
      </div>

      <h2>CanDeactivate &amp; CanMatch in code</h2>
      <div class="code"><pre>{{ deactivateSample }}</pre></div>
      <div class="warn">
        To redirect, <strong>return</strong> a <code>UrlTree</code>
        (<code>router.createUrlTree([...])</code>) or a <code>RedirectCommand</code> — don't
        call <code>router.navigate()</code> yourself, which races the navigation the guard
        is resolving. Returning a redirect cancels the current navigation and starts the
        new one atomically. Multiple guards on a route <strong>all</strong> must pass
        (logical AND, in array order); the first falsy/redirect result stops the rest.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong><code>navigate()</code> inside a guard.</strong> Return a
          <code>UrlTree</code>/<code>RedirectCommand</code> instead — imperative navigation
          races the in-flight one.</li>
        <li><strong>Guarding a lazy route's download.</strong> <code>canActivate</code> fetches
          the chunk first, then denies. Use <code>canMatch</code> to skip the download.</li>
        <li><strong>Assuming guards run in parallel.</strong> They're sequential per phase
          and short-circuit on the first block.</li>
        <li><strong>Async guard that never completes.</strong> Like resolvers, an Observable
          guard must emit and complete, or navigation hangs — pipe <code>first()</code>.</li>
        <li><strong>Forgetting <code>CanDeactivate</code> gets the component instance.</strong>
          Its first arg is your component, so you can read <code>hasUnsavedChanges()</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>How do you redirect from a guard?</summary>
        <div>Return <code>router.createUrlTree(['/login'])</code> or a
        <code>RedirectCommand</code>. Never call <code>navigate()</code> — it races the
        current navigation.</div>
      </details>
      <details class="qa">
        <summary>Which guard stops a lazy chunk from downloading for the wrong user?</summary>
        <div><code>canMatch</code> — it runs before the route matches, so the chunk is never
        fetched. <code>canActivate</code> fetches first.</div>
      </details>
      <details class="qa">
        <summary>Two <code>canActivate</code> guards — do both run?</summary>
        <div>Yes, in array order, and both must pass. The first to return
        <code>false</code>/a redirect stops navigation and skips the rest.</div>
      </details>
      <details class="qa">
        <summary>How does <code>CanDeactivate</code> know the form is dirty?</summary>
        <div>Its signature includes the component being left as the first argument, so it can
        call something like <code>component.hasUnsavedChanges()</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Guards are functions returning <code>boolean</code> | <code>UrlTree</code> | <code>RedirectCommand</code> | <code>Observable</code>/<code>Promise</code>.</li>
        <li>Order: deactivate → canMatch → canActivate → canActivateChild → resolvers.</li>
        <li>Return a redirect to reroute; never call <code>navigate()</code> inside a guard.</li>
        <li><code>canMatch</code> gates lazy loading; <code>canDeactivate</code> protects unsaved work.</li>
      </ul>

      <p><a routerLink="/resolvers">Next: Resolvers &amp; Route Data →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp td, table.cmp th { padding: 8px 12px; border: 1px solid var(--border); vertical-align: top; }
      table.cmp td:first-child { width: 190px; white-space: nowrap; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
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

  // --- CanDeactivate demo ---
  protected readonly dirty = signal(false);
  protected readonly leaveOutcome = signal('—');

  protected leave() {
    this.leaveOutcome.set(
      this.dirty()
        ? '⛔ blocked — confirm("Discard unsaved changes?") returned false'
        : '✅ true → navigation allowed to leave',
    );
  }

  protected readonly authSample = `export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// in routes:
{ path: 'admin', canActivate: [authGuard], component: Admin }`;

  protected readonly orderSample = `1. CanDeactivate   — guards on the route being LEFT
2. CanMatch        — before the route matches (before lazy download)
3. CanActivate     — for the target route
4. CanActivateChild — for each activated child
5. Resolvers       — only if all guards passed
6. Route activates`;

  protected readonly deactivateSample = `// CanDeactivate receives the component instance being left
export const unsavedGuard: CanDeactivateFn<EditPage> = (component) =>
  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;

// CanMatch — choose a route conditionally, before lazy loading
{ path: 'beta', canMatch: [featureFlag('beta')], loadComponent: () => import('./beta/beta') }
// flag off → route doesn't match → the router falls through to the next route`;
}
