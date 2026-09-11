import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
  TapeCard,
} from '../../../shared/brain';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * Lesson: functional route guards — the checkpoints a navigation has to clear before
 * Angular lets it happen.
 *
 * Covers `CanMatch`, `CanActivate`, `CanActivateChild` and `CanDeactivate` as functional
 * guards sharing one return contract (`boolean | UrlTree | RedirectCommand`, optionally
 * wrapped in an `Observable`/`Promise`); the router's actual navigation pipeline
 * (deactivate → match → activate → activateChild → resolve → activate); why a guard
 * should **return** a `UrlTree` instead of imperatively calling `router.navigate()`; and
 * the child-route guard-cascade trap, verified against `@angular/router`'s own type
 * declarations rather than assumed.
 *
 * ## Presentation
 *
 * Teaching order follows `expert/change-detection`, the reference implementation of the
 * brain-friendly layer: pose the problem before naming it, give the reader an analogy to
 * hang the vocabulary on, then teach the one mechanism that trips people up — how the
 * checkpoints fit into a single navigation — four different ways: a dialogue between the
 * router and the guards, a diagram of the execution order for a nested route, an
 * annotated dump of the router's own pipeline, and three live demos the reader drives.
 *
 * @see intermediate/resolvers — the very next checkpoint after every guard has passed.
 *   Its own guard/redirect note (why a `UrlTree` beats `router.navigate()`) is the exact
 *   claim this lesson's predict box backs up with a live-navigation explanation.
 */
@Component({
  selector: 'app-lesson-route-guards',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Routing category, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Child Routes & Lazy', id: 'router-children-lazy' },
    { label: 'Route Guards' },
    { label: 'Resolvers', id: 'resolvers' },
    { label: 'Route Params', id: 'route-params' },
    { label: 'Navigation Events', id: 'router-events' },
  ];

  /**
   * The dialogue for one navigation, from the moment a link is clicked to the
   * moment a component activates.
   *
   * This exists because the fact learners get backwards is ordering: they assume
   * the guard on the route they're headed TO runs first. It never does —
   * `CanDeactivate` on the OLD route always goes first, before the router has
   * even decided whether the destination exists. Staging it as a conversation
   * makes that ordering unmissable in a way a bullet list does not.
   */
  protected readonly navigationTalk: BubbleTurn[] = [
    {
      who: 'Router',
      says: "Someone clicked a link from `/admin/edit` to `/admin/settings`. Before I look at where they're going — can they leave `/admin/edit`?",
    },
    {
      who: 'CanDeactivate (on /admin/edit)',
      says: "Checking… the form's dirty, so I have to ask. …They chose to discard. You're clear to leave.",
    },
    {
      who: 'Router',
      says: 'Good. Now — does `/admin/settings` even exist for this user at all?',
    },
    {
      who: 'CanMatch (on /admin)',
      says: 'Feature flag is on, role matches. Yes — this route is a real candidate. Match confirmed, chunk downloaded.',
    },
    {
      who: 'Router',
      says: 'Matched and downloaded. May they actually enter it?',
    },
    {
      who: 'CanActivate + CanActivateChild (on /admin)',
      says: "Auth's fine, role's fine on both checks. Go ahead — I'll ask the resolvers next, then build the component.",
    },
  ];

  /**
   * Sample: a typical auth guard — inject, check, redirect with a `UrlTree`.
   */
  protected readonly authSample = `export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// in routes:
{ path: 'admin', canActivate: [authGuard], component: Admin }`;

  /** Line-by-line walkthrough of {@link authSample}. */
  protected readonly authNotes: CodeNote[] = [
    {
      line: 1,
      text: "A functional guard is just a plain arrow function typed as `CanActivateFn` — no class, no `@Injectable`, no constructor. `route` is the `ActivatedRouteSnapshot` being entered and `state` is the `RouterStateSnapshot`; the type is what constrains what you're allowed to return.",
    },
    {
      line: 2,
      text: '`inject()` works here because the router opens an injection context just for this call — the guard behaves as if it had constructor DI even though it never declared any. That context only exists synchronously, for the duration of this one call (see “Under the hood” further down).',
    },
    {
      line: 3,
      text: "Grabs `Router` so the guard can build a `UrlTree` to redirect with — you need a live `Router` instance to call `createUrlTree()`, there's no way to construct a route object by hand.",
    },
    {
      line: 4,
      text: 'The whole guard, on one line: `true` lets the in-flight navigation continue unchanged; a `UrlTree` tells the router "cancel this navigation and start a new one here instead" — atomically, with nothing left to race against.',
    },
    {
      line: 8,
      text: '`canActivate` takes an ARRAY of guards. Stack several — `[authGuard, roleGuard]` — and every one must pass, in order, before the route activates. This wiring lives in the route config, never on the component itself.',
    },
  ];

  /**
   * Sample: a `canMatch` guard factory, and why two routes can share one path.
   */
  protected readonly canMatchSample = `// featureFlag() is a GUARD FACTORY — a function that returns a CanMatchFn,
// closed over whichever flag name you pass it. One guard, reused per feature.
export function featureFlag(flag: string): CanMatchFn {
  return () => inject(FeatureFlags).isOn(flag);
}

// two route objects can share the exact same path:
{ path: 'beta', canMatch: [featureFlag('beta')], loadComponent: () => import('./beta/beta') },
{ path: 'beta', loadComponent: () => import('./beta-legacy/beta-legacy') },
// flag ON  → first entry matches, the NEW beta's chunk downloads
// flag OFF → first entry's canMatch returns false, the router tries the next
//            entry at the same path — the OLD beta downloads instead`;

  /** Line-by-line walkthrough of {@link canMatchSample}. */
  protected readonly canMatchNotes: CodeNote[] = [
    {
      line: 3,
      text: 'A guard **factory**: a function that returns a `CanMatchFn` rather than being one itself. It closes over `flag`, so the same logic serves any number of features without a new guard per flag.',
    },
    {
      line: 4,
      text: 'The returned arrow function is the actual guard, and `inject()` still works inside it — the router opens its injection context around whichever function ends up in the `canMatch` array, not around `featureFlag` itself.',
    },
    {
      line: 8,
      text: "`canMatch` is an array, same as `canActivate`. `loadComponent`'s `import()` is the lazy chunk — the entire point of this guard is deciding before this line ever executes.",
    },
    {
      line: 9,
      text: "A second `Route` object registered at the identical `'beta'` path. Angular tries route configs in the order they're written; this is what the router falls back to.",
    },
    {
      line: 11,
      text: "The payoff: a rejected `canMatch` doesn't cancel anything or throw — it just removes that `Route` from consideration, so the router quietly tries the next entry with the same path. A rejected `canActivate` would cancel the whole navigation instead.",
    },
  ];

  /**
   * Sample: `CanDeactivateFn` — the guard that receives the component being left.
   */
  protected readonly deactivateSample = `// CanDeactivate receives the component instance being LEFT — the only
// guard type that gets a live reference to what's actually on screen.
export const unsavedGuard: CanDeactivateFn<EditPage> = (component) =>
  component.hasUnsavedChanges() ? confirm('Discard unsaved changes?') : true;

// route — this guards LEAVING /edit/:id, not entering it:
{ path: 'edit/:id', component: EditPage, canDeactivate: [unsavedGuard] }`;

  /** Line-by-line walkthrough of {@link deactivateSample}. */
  protected readonly deactivateNotes: CodeNote[] = [
    {
      line: 3,
      text: "The generic parameter — `EditPage` — types the guard's first argument as the real component instance being left, so TypeScript knows `component.hasUnsavedChanges()` actually exists. The full signature also takes `currentRoute`, `currentState` and `nextState`; most guards only need the component.",
    },
    {
      line: 4,
      text: "Only prompts when there's something to lose. `confirm()` is a synchronous browser dialog, used here for brevity — a real app usually returns an `Observable<boolean>` from a custom dialog instead, which is exactly why `CanDeactivateFn` also accepts async return types.",
    },
    {
      line: 7,
      text: '`canDeactivate` is declared on the route being LEFT, not the one being entered — it has to be, since the router needs an answer before it has committed to any destination at all.',
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

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 3,
      text: 'Handles plain `redirectTo` route config entries first, unrelated to guards — but it matters here because every guard downstream evaluates the FINAL destination URL, never the alias the user actually typed.',
    },
    {
      line: 5,
      text: 'Matches URL segments against the route tree and builds the `RouterStateSnapshot` guards receive as their `state` argument. `canMatch` is evaluated route-by-route as part of THIS step — which is exactly why a `canMatch` rejection can make the router try the next sibling route instead of failing the whole navigation.',
    },
    {
      line: 8,
      text: 'A separate phase from matching: now that the route tree is fixed, the router walks it running `canDeactivate` for routes being left, then `canActivate`/`canActivateChild` for routes being entered, in that order.',
    },
    {
      line: 11,
      text: "This is the mechanism that makes `inject()` legal inside a bare function: the router manually pushes an injection context before calling your guard and pops it immediately after. That's also why `inject()` only works SYNCHRONOUSLY at the top of a guard — call it inside a later `.then()` or `setTimeout` and it throws, because by then the context is already gone.",
    },
    {
      line: 12,
      text: 'Normalizes whatever you returned — a boolean or `UrlTree` gets wrapped in `of(...)`, a `Promise` via `from(...)`, an `Observable` passed straight through — so the pipeline can treat every guard uniformly. `first()` is why an `Observable` guard that never emits hangs navigation forever instead of erroring.',
    },
    {
      line: 13,
      text: "A plain `false` is a hard stop with no redirect: the URL bar doesn't move, and a `NavigationCancel` event fires on `Router.events` — that's how you'd wire up a global “navigation blocked” toast.",
    },
    {
      line: 14,
      text: "This is precisely why you return a `UrlTree` instead of calling `router.navigate()` yourself: the router treats the returned tree as authoritative, cleanly cancels the guard's own in-flight navigation, and starts the redirect as a brand-new tracked navigation. An imperative `navigate()` call instead fires a second, competing navigation that can be silently pre-empted by the one already running.",
    },
    {
      line: 19,
      text: 'Resolvers run in this step ONLY — never for a navigation the guard phase already cancelled, which is the whole reason resolvers are considered a safe place to put expensive data fetches.',
    },
    {
      line: 20,
      text: "The last step: component instances are created or reused, and lifecycle hooks (`ngOnInit`, etc.) fire for the first time — this is the earliest point a guard's decision becomes visible on screen.",
    },
  ];

  /**
   * Sample: the navigate()-race trap — a guard that imperatively navigates
   * instead of returning the redirect, shown in the predict box below.
   */
  protected readonly navigateRaceSample = `export const authGuard: CanActivateFn = () => {
  if (!inject(AuthService).isLoggedIn()) {
    inject(Router).navigate(['/login']);   // ← imperative, not returned
    return false;
  }
  return true;
};`;

  /**
   * The execution order for a nested route, as a diagram — the visual the
   * table version of this same information cannot make as obvious: that
   * `CanDeactivate` sits entirely outside the "does this route exist / may I
   * enter it" question, because it is checked against a completely different
   * route than everything below it.
   */
  protected readonly guardOrderFlow: FlowStep[] = [
    {
      label: 'CanDeactivate — the OLD route',
      detail:
        'Checked on `/admin/edit`, the view being LEFT. Runs before the router has looked at the destination at all.',
      tone: 'warn',
    },
    {
      label: 'CanMatch — the candidate route',
      detail:
        'Checked for `/admin` while the URL is still being matched. A `false` here just skips this `Route` object — no lazy chunk requested yet.',
    },
    {
      label: 'CanActivate — the parent',
      detail: "`/admin`'s own guard. Its lazy chunk is already downloaded by now, win or lose.",
      tone: 'accent',
    },
    {
      label: 'CanActivateChild — declared on the parent',
      detail:
        'One guard, declared once on `/admin`, runs again here specifically for the `/admin/settings` child.',
      tone: 'accent',
    },
    {
      label: 'CanActivate — the child',
      detail: "`/admin/settings`'s own guard, only if it declares one of its own.",
      tone: 'accent',
    },
    {
      label: 'Resolvers',
      detail:
        'Every `resolve` key on the matched route tree — only reached if every guard above returned `true`.',
      tone: 'good',
    },
    {
      label: 'Route activates',
      detail:
        'The old component is destroyed, the new one is created, and its lifecycle hooks fire for the first time.',
      tone: 'good',
    },
  ];

  /**
   * The self-test: whether `canActivate` on a parent protects its children.
   *
   * The distractor options are the real, specific misconceptions a learner
   * reaches for here — that a parent guard cascades, that Angular errors
   * instead of silently letting the child through, and an invented caching
   * mechanism — rather than throwaway wrong answers (CONTRIBUTING §2A.2).
   */
  protected readonly cascadeQuizOptions: QuizOption[] = [
    {
      text: '`authGuard` runs for the child too, because `canActivate` automatically covers every route nested under it.',
      why: 'That\'s the intuitive but wrong assumption. `canActivate` only ever runs for the exact route it\'s declared on — nothing about it "covers" descendants, because descendants are a separate guard slot entirely.',
    },
    {
      text: '`authGuard` never runs for `/admin/settings`, and the child activates with no check at all.',
      correct: true,
      why: 'Exactly — and silently. `canActivate` is per-route, not per-subtree. Guarding a whole section requires `canActivateChild` declared on the parent (or repeating `canActivate` on every child), which is precisely the gap `canActivateChild` exists to close.',
    },
    {
      text: "The router throws a runtime error, because a child route can't activate without inheriting a guard from its parent.",
      why: 'No error is thrown — that is what makes this dangerous. The child simply activates as if `/admin` were unguarded, with nothing in the console to catch during testing.',
    },
    {
      text: "Angular re-runs `authGuard` automatically the first time the parent's guard passes, then caches the result for every descendant.",
      why: "There's no such caching or re-running mechanism. Each guard type is evaluated exactly where it is declared, once per navigation — `canActivate` on a parent is simply never consulted for a child at all.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'How do I actually redirect someone from inside a guard?',
      a: "Return a `UrlTree` — `router.createUrlTree(['/login'])` — or a `RedirectCommand` if you need navigation options like `skipLocationChange`. Don't call `router.navigate()` yourself; the predict box above walks through exactly why that goes wrong.",
    },
    {
      q: 'If `canMatch` runs before the route even exists, how is that different from `canActivate` just blocking me?',
      a: '`canActivate` still lets the route MATCH first — for a lazy route, that means the chunk is already downloaded by the time it says no. `canMatch` runs during matching itself, so a false result means the route was never a candidate at all: no chunk, no wasted bytes, and the router quietly tries the next route registered at that path instead.',
    },
    {
      q: 'How does `CanDeactivate` know my form has unsaved changes — I never told it anything?',
      a: "You do tell it, just not through the guard's arguments — `CanDeactivateFn`'s first parameter IS your live component instance, so the guard calls a method you wrote on it directly, like `component.hasUnsavedChanges()`. It's the one guard type that gets a real reference to what's on screen, rather than just route data.",
    },
    {
      q: 'My `canMatch` guard returned `false` and… nothing happened. No error, no redirect, no console message. Is it broken?',
      a: "It's working exactly as designed. A false `canMatch` doesn't cancel anything — it just removes that route object from consideration, and the router silently tries the next route registered at the same path (or falls through to a wildcard). Compare a false `canActivate`, which DOES cancel the navigation outright. They look almost identical in the route config and behave completely differently.",
    },
    {
      q: "I called `inject()` inside a `.then()` in my guard and it threw. My component does this kind of thing all the time — what's different here?",
      a: "A component's constructor runs inside Angular's own injection context, which sticks around for the component's lifetime. A guard is a bare function — the router manually opens an injection context just long enough to call it SYNCHRONOUSLY, then closes it the moment your function returns control. By the time a `.then()` callback fires, that window is long gone; grab everything you need with `inject()` at the very top of the guard, before any `await`.",
    },
  ];
}
