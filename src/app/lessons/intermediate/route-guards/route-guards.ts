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
  templateUrl: './route-guards.html',
  styleUrl: './route-guards.css',
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
