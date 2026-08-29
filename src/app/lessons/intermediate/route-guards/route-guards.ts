import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: functional route guards.
 *
 * Beyond CanActivate: the full guard execution order (deactivate → match →
 * activate → activateChild → resolvers), a live CanDeactivate unsaved-changes
 * demo alongside the auth demo, a live canMatch-vs-canActivate lazy-loading
 * demo, the return-type menu (boolean | UrlTree | RedirectCommand | async),
 * why you return a UrlTree instead of calling navigate(), canMatch vs
 * canActivate for lazy routes, a line-by-line breakdown of every code sample,
 * an "under the hood" walk of the router's guard pipeline (including why
 * inject() only works synchronously inside a guard), and the exam traps.
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
      <h3>Line-by-line</h3>
      <table class="breakdown">
        <tr><th>Line</th><th>What it does</th></tr>
        @for (item of authBreakdown; track item.code) {
          <tr><td><code>{{ item.code }}</code></td><td>{{ item.explain }}</td></tr>
        }
      </table>

      <h2>Guard return types — the full menu</h2>
      <p>
        Every guard type accepts the same union of return values. The type you pick
        changes what the router does next — memorize this table, exam questions love
        to swap one row for another:
      </p>
      <table class="breakdown">
        <tr><th>Return</th><th>Meaning</th><th>Example</th></tr>
        <tr>
          <td><code>true</code></td>
          <td>Allow navigation to proceed exactly as requested.</td>
          <td><code>return true;</code></td>
        </tr>
        <tr>
          <td><code>false</code></td>
          <td>Block navigation outright — no redirect, no message, just cancelled.</td>
          <td><code>return false;</code></td>
        </tr>
        <tr>
          <td><code>UrlTree</code></td>
          <td>Cancel this navigation and atomically start a new one at the given URL.</td>
          <td><code>return router.createUrlTree(['/login']);</code></td>
        </tr>
        <tr>
          <td><code>RedirectCommand</code></td>
          <td>Same redirect behaviour as <code>UrlTree</code>, but also lets you pass navigation options (e.g. <code>skipLocationChange</code>).</td>
          <td><code>return new RedirectCommand(router.parseUrl('/login'));</code></td>
        </tr>
        <tr>
          <td><code>Observable&lt;...&gt;</code></td>
          <td>Any of the above, resolved asynchronously. The router takes the FIRST emitted value and unsubscribes — the source must complete or navigation hangs.</td>
          <td><code>return this.auth.isLoggedIn$.pipe(first());</code></td>
        </tr>
        <tr>
          <td><code>Promise&lt;...&gt;</code></td>
          <td>Same async contract as an Observable, resolved once.</td>
          <td><code>return firstValueFrom(this.http.get('/api/check'));</code></td>
        </tr>
      </table>

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
      <h3>Line-by-line</h3>
      <table class="breakdown">
        <tr><th>Step</th><th>Why it's there</th></tr>
        @for (item of orderBreakdown; track item.code) {
          <tr><td><code>{{ item.code }}</code></td><td>{{ item.explain }}</td></tr>
        }
      </table>

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

      <h2>Live — canMatch vs canActivate on a lazy route</h2>
      <p>
        Same feature flag, two different guard types, two very different costs when the
        flag is off. Toggle the flag, reset the "chunk downloaded" indicator, then fire
        both buttons and watch exactly when the (simulated) network request happens.
      </p>
      <div class="demo">
        <p class="demo__title">Live — /beta is lazy-loaded; guarding it two ways</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="betaFlag.set(!betaFlag())">{{ betaFlag() ? 'Feature flag: ON' : 'Feature flag: OFF' }}</button>
          <span class="pill">chunk downloaded: {{ chunkDownloaded() }}</span>
          <button class="ghost" (click)="resetChunk()">Reset chunk</button>
        </div>
        <div class="row" style="margin-bottom:10px">
          <button class="ghost" (click)="tryCanActivate()">Navigate to /beta (canActivate guard)</button>
          <button class="ghost" (click)="tryCanMatch()">Navigate to /beta (canMatch guard)</button>
        </div>
        <p>canActivate result: <strong>{{ activateOutcome() }}</strong></p>
        <p>canMatch result: <strong>{{ matchOutcome() }}</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Turn the flag off, reset the chunk, then try each button in turn: canActivate
          always downloads the lazy chunk before it even asks the guard a question, while
          canMatch never requests it when the flag is off — it just falls through as if
          the route weren't registered at all.
        </p>
      </div>

      <h2>CanDeactivate &amp; CanMatch in code</h2>
      <div class="code"><pre>{{ deactivateSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="breakdown">
        <tr><th>Line</th><th>What it does</th></tr>
        @for (item of deactivateBreakdown; track item.code) {
          <tr><td><code>{{ item.code }}</code></td><td>{{ item.explain }}</td></tr>
        }
      </table>
      <div class="warn">
        To redirect, <strong>return</strong> a <code>UrlTree</code>
        (<code>router.createUrlTree([...])</code>) or a <code>RedirectCommand</code> — don't
        call <code>router.navigate()</code> yourself, which races the navigation the guard
        is resolving. Returning a redirect cancels the current navigation and starts the
        new one atomically. Multiple guards on a route <strong>all</strong> must pass
        (logical AND, in array order); the first falsy/redirect result stops the rest.
      </div>

      <h2>Under the hood — how the router actually runs a guard</h2>
      <p>
        Guards feel like magic — a bare function suddenly has DI and the ability to
        reroute the whole app. Here's the (simplified, conceptual) shape of what
        <code>Router.navigateByUrl()</code> is doing so none of it feels like magic
        anymore:
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="breakdown">
        <tr><th>Line</th><th>What's really happening</th></tr>
        @for (item of underTheHoodBreakdown; track item.code) {
          <tr><td><code>{{ item.code }}</code></td><td>{{ item.explain }}</td></tr>
        }
      </table>
      <div class="note">
        The single most exam-relevant detail here: <code>inject()</code> only works
        because the router wraps your guard call in <code>runInInjectionContext()</code>,
        and that wrapping only covers the <strong>synchronous</strong> call. Call
        <code>inject()</code> after an <code>await</code>, inside a <code>.then()</code>,
        or inside a <code>setTimeout</code> and it throws — grab every service you need
        at the very top of the guard, before anything async happens.
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
        <li><strong>Treating a rejected <code>canMatch</code> like a rejected
          <code>canActivate</code>.</strong> A false <code>canMatch</code> just removes that
          route from consideration and the router tries the next matching route — it does
          <em>not</em> cancel the navigation the way a false <code>canActivate</code> does.</li>
        <li><strong>Calling <code>inject()</code> asynchronously inside a guard.</strong> It only
          works synchronously at the top of the function, before any <code>await</code>/
          <code>.then()</code>/<code>setTimeout</code> — the injection context is gone by then.</li>
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
      <details class="qa">
        <summary>A <code>canMatch</code> guard on <code>/beta</code> returns false. What happens to the navigation?</summary>
        <div>Nothing is cancelled — the router treats <code>/beta</code> as though it never
        matched and tries the next route in the config with the same path (or a wildcard).
        Compare a false <code>canActivate</code>, which cancels the whole navigation
        outright unless a redirect was returned.</div>
      </details>
      <details class="qa">
        <summary>A guard calls <code>inject(AuthService)</code> inside a <code>.then()</code> callback and Angular throws. Why?</summary>
        <div><code>inject()</code> only works inside an active injection context, and the
        router only wraps the <em>synchronous</em> call to your guard in that context. By
        the time a <code>.then()</code> callback runs, the context is already gone —
        inject everything you need synchronously, at the top of the guard, before going
        async.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Guards are functions returning <code>boolean</code> | <code>UrlTree</code> | <code>RedirectCommand</code> | <code>Observable</code>/<code>Promise</code>.</li>
        <li>Order: deactivate → canMatch → canActivate → canActivateChild → resolvers.</li>
        <li>Return a redirect to reroute; never call <code>navigate()</code> inside a guard.</li>
        <li><code>canMatch</code> gates lazy loading; <code>canDeactivate</code> protects unsaved work.</li>
        <li>A false <code>canMatch</code> lets the router fall through to the next route; a false <code>canActivate</code> cancels the navigation outright — they are not interchangeable.</li>
        <li><code>inject()</code> inside a guard only works synchronously, at the top of the function, thanks to <code>runInInjectionContext()</code> — grab your services before any async work.</li>
      </ul>

      <p><a routerLink="/resolvers">Next: Resolvers &amp; Route Data →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp td, table.cmp th { padding: 8px 12px; border: 1px solid var(--border); vertical-align: top; }
      table.cmp td:first-child { width: 190px; white-space: nowrap; }

      table.breakdown { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 8px 0 22px; }
      table.breakdown th, table.breakdown td { padding: 7px 10px; border: 1px solid var(--border); vertical-align: top; text-align: left; }
      table.breakdown th { background: var(--bg-elevated); }
      table.breakdown td:first-child {
        font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        white-space: pre-wrap;
        width: 42%;
        color: var(--text-muted);
      }

      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class RouteGuards {
  /**
   * Whether the fake user is signed in, for the `canActivate` demo.
   */
  protected readonly loggedIn = signal(false);
  /**
   * What the last navigation attempt did.
   */
  protected readonly outcome = signal('—');

  /**
   * Attempts a navigation and reports what the guard decided.
   */
  protected attempt() {
    this.outcome.set(
      this.loggedIn()
        ? '✅ true → navigation allowed to /admin'
        : '⛔ redirected to /login (returned a UrlTree)',
    );
  }

  // --- CanDeactivate demo ---
  /**
   * Whether the fake edit form has unsaved changes.
   */
  protected readonly dirty = signal(false);
  /**
   * What the last leave attempt did.
   */
  protected readonly leaveOutcome = signal('—');

  /**
   * Attempts to leave, running the `canDeactivate` check.
   */
  protected leave() {
    this.leaveOutcome.set(
      this.dirty()
        ? '⛔ blocked — confirm("Discard unsaved changes?") returned false'
        : '✅ true → navigation allowed to leave',
    );
  }

  // --- canMatch vs canActivate demo ---
  /**
   * The feature flag the `canMatch` demo gates on.
   */
  protected readonly betaFlag = signal(false);
  /**
   * Whether the lazy chunk has been downloaded yet. The whole point of the
   * comparison below is which guards can still stop that from happening.
   */
  protected readonly chunkDownloaded = signal(false);
  /**
   * What the `canActivate` attempt did.
   */
  protected readonly activateOutcome = signal('—');
  /**
   * What the `canMatch` attempt did.
   */
  protected readonly matchOutcome = signal('—');

  /**
   * Attempts the route with a `canActivate` guard.
   *
   * The download happens either way: matching completes — and therefore the lazy
   * chunk is fetched — before `canActivate` is even consulted. Blocking here
   * blocks the *navigation*, not the bytes.
   */
  protected tryCanActivate() {
    // canActivate only runs AFTER the route has matched — for a lazy route that
    // means the chunk is already downloaded by the time the guard is even asked.
    this.chunkDownloaded.set(true);
    this.activateOutcome.set(
      this.betaFlag()
        ? '✅ chunk downloaded, guard passed → route activates'
        : '📦 chunk downloaded anyway, then ⛔ guard denied — bytes wasted on a user who was never getting in',
    );
  }

  /**
   * Attempts the same route with a `canMatch` guard.
   *
   * `canMatch` runs during matching, so a false result means the route never
   * matches and the `import()` never runs. For a flag that gates a whole lazy
   * feature, this is the guard that actually keeps the code off the wire.
   */
  protected tryCanMatch() {
    // canMatch runs DURING matching, before any lazy import() executes.
    if (this.betaFlag()) {
      this.chunkDownloaded.set(true);
      this.matchOutcome.set('✅ flag on → route matches → chunk downloaded → activates');
    } else {
      this.matchOutcome.set(
        '⛔ flag off → route never matches → chunk NEVER requested → router falls through',
      );
    }
  }

  /**
   * Resets the chunk demo so the two guards can be compared again from scratch.
   */
  protected resetChunk() {
    this.chunkDownloaded.set(false);
    this.activateOutcome.set('—');
    this.matchOutcome.set('—');
  }

  /**
   * Sample: a typical auth guard — inject, check, redirect with `returnUrl`.
   */
  protected readonly authSample = `export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// in routes:
{ path: 'admin', canActivate: [authGuard], component: Admin }`;

  /**
   * Breakdown of {@link authSample}, line by line.
   */
  protected readonly authBreakdown: Array<{ code: string; explain: string }> = [
    {
      code: `export const authGuard: CanActivateFn = (route, state) => {`,
      explain:
        'A functional guard is just a plain arrow function typed as CanActivateFn — no class, no @Injectable, no constructor. The type gives route (the ActivatedRouteSnapshot being entered) and state (the RouterStateSnapshot) their types, and constrains what you\'re allowed to return.',
    },
    {
      code: `  const auth = inject(AuthService);`,
      explain:
        'inject() works here because the router calls this function inside an injection context it sets up itself — the guard behaves as if it had constructor DI even though it never declared any. That context only exists synchronously for the duration of this call.',
    },
    {
      code: `  const router = inject(Router);`,
      explain:
        "Grabs the Router service so the guard can build a UrlTree to redirect with — you need a live Router instance to call createUrlTree(), you can't construct a route object by hand.",
    },
    {
      code: `  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);`,
      explain:
        'The whole guard boils down to one branch: true lets the in-flight navigation continue unchanged; a UrlTree tells the router "cancel this navigation and start a new one here instead" — atomically, with no race against the original.',
    },
    {
      code: `};`,
      explain: 'Closes the guard function.',
    },
    {
      code: `{ path: 'admin', canActivate: [authGuard], component: Admin }`,
      explain:
        "canActivate takes an ARRAY of guards — you can stack several (e.g. [authGuard, roleGuard]) and every one must pass, in order, before the route activates. This wiring lives in the route config, never on the component itself.",
    },
  ];

  /**
   * Sample: the order guards run in during one navigation.
   */
  protected readonly orderSample = `1. CanDeactivate   — guards on the route being LEFT
2. CanMatch        — before the route matches (before lazy download)
3. CanActivate     — for the target route
4. CanActivateChild — for each activated child
5. Resolvers       — only if all guards passed
6. Route activates`;

  /**
   * Breakdown of {@link orderSample}.
   */
  protected readonly orderBreakdown: Array<{ code: string; explain: string }> = [
    {
      code: `1. CanDeactivate — guards on the route being LEFT`,
      explain:
        "Runs first because the router has to confirm you're even allowed to leave the CURRENT view before it spends any effort on the destination — this is the unsaved-changes prompt, and it fires even for a destination route that doesn't exist.",
    },
    {
      code: `2. CanMatch — before the route matches (before lazy download)`,
      explain:
        'Only applies to routes that declare canMatch. It runs as part of matching the URL to a route, so a false result does not fail the navigation — the router just treats that route as non-matching and tries the next sibling with the same path. Crucially, this happens BEFORE any lazy chunk is requested.',
    },
    {
      code: `3. CanActivate — for the target route`,
      explain:
        'By now the router has committed to this exact route (its chunk is already downloaded if lazy) and asks "is this specific user allowed to activate it?" A false result here fails the navigation outright, unless a UrlTree/RedirectCommand was returned instead.',
    },
    {
      code: `4. CanActivateChild — for each activated child`,
      explain:
        'Runs once per matched child in the route tree, letting a parent route guard an entire section (e.g. everything under /admin) without repeating canActivate on every individual child route object.',
    },
    {
      code: `5. Resolvers — only if all guards passed`,
      explain:
        'Guaranteed ordering: resolvers never fire for a navigation the guard phase is going to block, so you never fetch data for a screen the user was never allowed to see.',
    },
    {
      code: `6. Route activates`,
      explain:
        'Angular creates (or reuses) the component instance and runs its lifecycle hooks — this is the first moment the new component actually exists on screen.',
    },
  ];

  /**
   * Sample: `CanDeactivateFn`, which receives the component instance being left —
   * the only guard that does.
   */
  protected readonly deactivateSample = `// CanDeactivate receives the component instance being left
export const unsavedGuard: CanDeactivateFn<EditPage> = (component) =>
  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;

// CanMatch — choose a route conditionally, before lazy loading
{ path: 'beta', canMatch: [featureFlag('beta')], loadComponent: () => import('./beta/beta') }
// flag off → route doesn't match → the router falls through to the next route`;

  /**
   * Breakdown of {@link deactivateSample}.
   */
  protected readonly deactivateBreakdown: Array<{ code: string; explain: string }> = [
    {
      code: `export const unsavedGuard: CanDeactivateFn<EditPage> = (component) =>`,
      explain:
        "The generic parameter (EditPage) types the guard's first argument as the actual component instance being left, so TypeScript knows component.hasUnsavedChanges() exists — CanDeactivate is the one guard type that gets a live reference to your component.",
    },
    {
      code: `  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;`,
      explain:
        "Only prompts when there's something to lose. confirm() is a synchronous browser dialog used here for brevity — a real app usually returns an Observable<boolean> from a custom (Material/CDK) dialog instead, which is exactly why CanDeactivateFn also accepts async return types.",
    },
    {
      code: `{ path: 'beta', canMatch: [featureFlag('beta')], loadComponent: () => import('./beta/beta') }`,
      explain:
        "canMatch is also an array of guards. featureFlag('beta') is a guard FACTORY — a function that returns a CanMatchFn closed over the flag name, so the same guard logic can be reused for any flag without copy-pasting a new guard per feature.",
    },
    {
      code: `// flag off → route doesn't match → the router falls through to the next route`,
      explain:
        'This is the behavioural difference that matters most: a rejected canMatch does not throw or cancel the navigation, it just removes this route object from consideration — perfect for registering two route entries at the same path (e.g. an old vs a new implementation) and letting canMatch pick which one "exists" for this user.',
    },
  ];

  /**
   * Sample: the router's navigation pipeline, simplified — where each guard type
   * is consulted, and why that explains the ordering.
   */
  protected readonly underTheHoodSample = `// simplified/conceptual — the shape of the router's internal navigation pipeline
navigateByUrl(url) {
  applyRedirects(url);                  // resolve static \`redirectTo\` routes first

  const snapshot = recognize(url);      // match URL → RouterStateSnapshot
                                         //   canMatch guards run HERE, per candidate route

  const ok = checkGuards(snapshot);     // canDeactivate (routes being left), then
                                         //   canActivate + canActivateChild (routes being entered)
  //   for each guard:
  //     const raw = runInInjectionContext(envInjector, () => guardFn(route, state));
  //     const result$ = wrapIntoObservable(raw).pipe(first());  // bool | UrlTree | RedirectCommand
  //     result === false                  → NavigationCancel, stop here
  //     result is UrlTree / RedirectCommand → NavigationCancel, start a NEW navigation
  //     result === true                   → move to the next guard

  if (!ok) return;                      // navigation cancelled, nothing below runs

  await resolveData(snapshot);          // resolvers — only reached if every guard passed
  activateRoutes(snapshot);             // create/destroy components, fire lifecycle hooks
}`;

  /**
   * Breakdown of {@link underTheHoodSample}.
   */
  protected readonly underTheHoodBreakdown: Array<{ code: string; explain: string }> = [
    {
      code: `applyRedirects(url);`,
      explain:
        "Handles plain redirectTo route config entries first, unrelated to guards — but it matters here because it means every guard downstream evaluates the FINAL destination URL, never the alias the user actually typed.",
    },
    {
      code: `const snapshot = recognize(url);`,
      explain:
        'Matches URL segments against your route tree and builds the RouterStateSnapshot guards receive as their state argument. canMatch is evaluated route-by-route as part of THIS step — which is exactly why a canMatch rejection can make the router try the next sibling route instead of failing the whole navigation.',
    },
    {
      code: `const ok = checkGuards(snapshot);`,
      explain:
        'A separate phase from matching: now that the route tree is fixed, the router walks it running canDeactivate for routes being left, then canActivate/canActivateChild for routes being entered, in that order.',
    },
    {
      code: `const raw = runInInjectionContext(envInjector, () => guardFn(route, state));`,
      explain:
        "This is the mechanism that makes inject() legal inside a bare function: the router manually pushes an injection context before calling your guard and pops it immediately after. That's also why inject() only works SYNCHRONOUSLY at the top of a guard — call it inside a later .then() or setTimeout and it throws, because by then the context is already gone.",
    },
    {
      code: `const result$ = wrapIntoObservable(raw).pipe(first());`,
      explain:
        'Normalizes whatever you returned — a boolean or UrlTree gets wrapped in of(...), a Promise via from(...), an Observable passed straight through — so the pipeline can treat every guard uniformly as an Observable. first() is why an Observable guard that never emits hangs navigation forever instead of erroring.',
    },
    {
      code: `result === false                  → NavigationCancel, stop here`,
      explain:
        "A plain false is a hard stop with no redirect: the URL bar doesn't move, and a NavigationCancel event fires on Router.events — that's how you'd wire up a global \"navigation blocked\" toast.",
    },
    {
      code: `result is UrlTree / RedirectCommand → NavigationCancel, start a NEW navigation`,
      explain:
        "This is precisely why you return a UrlTree instead of calling router.navigate() yourself: the router treats the returned tree as authoritative, cleanly cancels the guard's own in-flight navigation, and starts the redirect as a brand-new tracked navigation. An imperative navigate() call instead fires a second, competing navigation that can be silently pre-empted by the one already running.",
    },
    {
      code: `await resolveData(snapshot);`,
      explain:
        "Resolvers run in this step ONLY — never for a navigation the guard phase already cancelled, which is the whole reason resolvers are considered \"safe\" places to put expensive data fetches.",
    },
    {
      code: `activateRoutes(snapshot);`,
      explain:
        'The last step: component instances are created or reused, and lifecycle hooks (ngOnInit, etc.) fire for the first time — this is the earliest point a guard\'s decision becomes visible on screen.',
    },
  ];
}
