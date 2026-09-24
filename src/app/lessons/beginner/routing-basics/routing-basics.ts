import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/** A route entry for the live matcher demo. */
interface DemoRoute {
  path: string;
  label: string;
  full?: boolean; // pathMatch: 'full' (only the empty-path route needs it here)
}

/**
 * Lesson: Routing Basics — how the router turns a URL into a component.
 *
 * Covers the `Routes` array, `path` / `component` / `loadComponent`, route
 * parameters, `routerLink` and `routerLinkActive`, and the first-match-wins
 * scan that trips up more beginners than any other single routing fact.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem first.** The page opens on "there is one HTML page —
 *    how do you get a dozen different screens out of it?" before naming the
 *    router as the answer, and asks the reader to predict whether a plain
 *    `href` and a `routerLink` pointed at the same path behave identically.
 * 2. **Analogy before vocabulary.** The passport-control queue gives
 *    "first match wins" somewhere to live before the matching rules
 *    (segments, `:params`, `**`) have to carry any weight on their own.
 * 3. **Then the same idea in several modes** — a dialogue between the route
 *    table entries scanning a URL, a six-step flow diagram of a whole
 *    navigation, a live matcher table, and annotated real route/config code.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * The centrepiece is still the route-matcher playground: a fixed table of demo
 * routes and a URL you can edit, with the row that would win highlighted live.
 * Route matching is first-match-wins on a top-down scan, which is the single
 * most common source of "my route never fires" — and it is far easier to see
 * than to read about.
 *
 * @see routeMatches for the matching rules the demo implements.
 */
@Component({
  selector: 'app-lesson-routing-basics',
  imports: [
    RouterLink,
    RouterLinkActive,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Compare,
    Faq,
    Flow,
    Napkin,
    Predict,
    Quiz,
    Remember,
    TapeCard,
    BrainPower,
    Scribble,
    Whiteboard,
  ],
  templateUrl: './routing-basics.html',
  styleUrl: './routing-basics.css',
})
export class RoutingBasics {
  /** The Routing track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Routing Basics' },
    { label: 'Child Routes & Lazy', id: 'router-children-lazy' },
    { label: 'Route Guards', id: 'route-guards' },
    { label: 'Resolvers', id: 'resolvers' },
    { label: 'Route Params', id: 'route-params' },
    { label: 'Navigation Events', id: 'router-events' },
  ];

  // -- Page-shape block: "The Whiteboard" --

  /** What changes, step by step, the moment `pathMatch: 'full'` is added to an empty-path route. */
  protected readonly pathMatchFlow: FlowStep[] = [
    {
      label: "Scan reaches path: ''",
      detail: 'Same first row, same URL — nothing about the scan itself has changed yet.',
    },
    {
      label: 'The comparison target changes',
      detail:
        "Without the flag: 'does the URL START WITH this?' With it: 'does the URL EQUAL this, in full?'",
      tone: 'accent',
    },
    {
      label: '/about is compared',
      detail:
        "'' is a prefix of /about (always true) — but /about is not EQUAL to '' (only true when the flag is set).",
      tone: 'warn',
    },
    {
      label: 'Row one either claims it or steps aside',
      detail:
        'No flag: row one wins, every time. With the flag: row one declines, and the scan continues.',
    },
    {
      label: 'The next matching row finally gets a turn',
      detail: "'about' → About only ever runs once row one has legitimately said no.",
      tone: 'good',
    },
  ];

  /** The block's own quiz — the fixed table, checked before the broken one is revealed in the predict below. */
  protected readonly pathMatchQuizOptions: QuizOption[] = [
    {
      text: 'Home — pathMatch only matters for redirects that have child routes, not simple top-level ones like this.',
      why: "pathMatch applies to any route with an empty path — redirect or not, top-level or nested. It isn't scoped to routes with children; it's exactly this route it changes.",
    },
    {
      text: "About — pathMatch: 'full' makes '' match ONLY when the entire remaining URL is empty, so /about no longer satisfies row one and falls through to the row that actually names it.",
      correct: true,
      why: "Right. Prefix matching (the default) treats '' as a prefix of every URL. pathMatch: 'full' switches the comparison to the WHOLE remaining URL rather than just its start — one flag, and row one stops claiming traffic that was never meant for it.",
    },
    {
      text: 'Still Home, because the router already redirects before pathMatch is ever checked.',
      why: "pathMatch is part of deciding whether a route matches AT ALL — it isn't a separate step that runs after a redirect has already fired. Nothing redirects here until some route actually matches first.",
    },
    {
      text: 'A router error, because two routes now compete for the same URL.',
      why: 'No conflict, and no error. The router still stops at the FIRST match in a top-down scan — pathMatch only changes whether row one is willing to claim /about in the first place.',
    },
  ];

  /**
   * The route table scanning a URL, dramatised as each entry speaking up in
   * turn. Exists because "first match wins" as a sentence is easy to nod
   * along to and easy to forget the moment a real table has five entries in
   * it — watching each one get asked and rejected in order is what actually
   * sticks. Uses the same URL the live matcher demo defaults to, on purpose.
   */
  protected readonly matchTalk: BubbleTurn[] = [
    { who: 'The URL', says: '`/users/7/edit` just arrived. Who wants me?' },
    {
      who: "Route `''`",
      says: 'Not me — I only take the truly empty path, and this one has three segments.',
    },
    { who: 'Route `about`', says: 'Not me either — wrong segment count, wrong first segment.' },
    {
      who: 'Route `users/:id/edit`',
      says: 'Me. `:id` matches `7`, and `edit` matches itself exactly — I’ll take it.',
    },
    {
      who: 'The router',
      says: 'Match found at entry three. Scan over — nothing below this line even gets asked.',
    },
  ];

  /**
   * What one click on a `routerLink` actually sets in motion. Laid out because
   * beginners tend to picture "URL changes, component appears" as one step, and
   * every routing feature they meet later — guards, resolvers, lazy loading —
   * slots into one of the gaps in between.
   */
  protected readonly navigation: FlowStep[] = [
    { label: 'Click a `routerLink`', detail: 'The default browser navigation is cancelled' },
    { label: 'URL → `UrlTree`', detail: 'Parsed into segments, query params and a fragment' },
    {
      label: 'Match the table, top-down',
      detail: 'The scan stops at the first route that fits',
      tone: 'accent',
    },
    { label: 'Guards run', detail: 'Any one of them can cancel or redirect the whole navigation' },
    {
      label: 'Lazy chunk + resolvers',
      detail: '`loadComponent` fetches; resolvers pre-fetch data',
    },
    {
      label: 'Component into the outlet',
      detail: 'Only now does the address bar update',
      tone: 'good',
    },
  ];

  /**
   * Sample: the route table — a static path, a param, a lazy route, and the
   * wildcard. Deliberately keeps the wildcard as a real component rather than
   * a `redirectTo`, so it doesn't pre-empt the empty-path redirect trap in
   * {@link pathMatchSample} further down.
   */
  protected readonly routesSample = `// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'users/:id', component: UserComponent },
  { path: 'users/:id/edit', loadComponent: () => import('./user-edit/user-edit').then((m) => m.UserEdit) },
  { path: '**', component: NotFoundComponent },
];`;

  /** Line-by-line walkthrough of {@link routesSample}. */
  protected readonly routesNotes: CodeNote[] = [
    {
      line: 2,
      text: '`Routes` is the array type every route object must satisfy — plain data, no class and no service to register.',
    },
    {
      line: 3,
      text: "The empty path `''` matches the site root, `/`. No `pathMatch` is set here — worth remembering for the trap a few sections down.",
    },
    {
      line: 4,
      text: 'A literal segment: this route matches `/about` and nothing else.',
    },
    {
      line: 5,
      text: '`:id` is a route **parameter** — a colon-prefixed segment that matches any single value and captures it. `/users/7` and `/users/anything` both match; the component reads the captured value back out through `ActivatedRoute`.',
    },
    {
      line: 6,
      text: '`loadComponent` defers this route into its own chunk, fetched only when the user actually navigates here. The `component` property used above bundles eagerly instead — this is also the reason it can afford a longer, more specific path.',
    },
    {
      line: 7,
      text: "`'**'` is the wildcard — it matches anything nothing above it claimed first. It has to be **last**: the router stops scanning at the first match, so a wildcard any earlier would swallow every route beneath it.",
    },
  ];

  /**
   * Sample: registering the router — the one line that turns a plain array
   * into a working `Router`, `routerLink` and `routerLinkActive`.
   */
  protected readonly configSample = `// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};`;

  /** Line-by-line walkthrough of {@link configSample}. */
  protected readonly configNotes: CodeNote[] = [
    {
      line: 2,
      text: '`ApplicationConfig` is a plain interface with one required property — no base class, no module to extend.',
    },
    {
      line: 3,
      text: '`provideRouter` is a **function call**, not a class. Calling it with your `routes` array returns the bundle of providers that makes `Router`, `routerLink` and `routerLinkActive` all work together — omit this line and injecting `Router` anywhere throws `NullInjectorError`.',
    },
  ];

  /** Sample: where the matched component actually renders. Trivial on purpose — one real line. */
  protected readonly outletSample = `<nav>...</nav>
<router-outlet />   <!-- the routed component appears here -->`;

  /** Sample: static, dynamic and relative `routerLink` forms. */
  protected readonly linkingSample = `<a routerLink="/about" routerLinkActive="active">About</a>
<a [routerLink]="['/users', user.id]">Profile</a>   <!-- dynamic, from a variable -->
<a routerLink="../sibling">Up one level</a>          <!-- relative to the current route -->`;

  /** Sample: query params and a fragment riding along with a routerLink. */
  protected readonly queryFragmentSample = `<a [routerLink]="['/users', id]"
   [queryParams]="{ tab: 'profile' }"
   fragment="bio">Profile</a>
<!-- → /users/7?tab=profile#bio -->`;

  /**
   * Sample: navigating from code — the array form of the path, query params as
   * a sibling property, and the one-string alternative for when you already
   * have a full path in hand.
   */
  protected readonly navSample = `// user-list.component.ts
private readonly router = inject(Router);
private readonly route = inject(ActivatedRoute);

goToUser(id: number): void {
  this.router.navigate(['/users', id], {
    queryParams: { tab: 'profile' },
    relativeTo: this.route,
  });
}

// or, parsing a ready-made path directly:
goToUrl(path: string): void {
  this.router.navigateByUrl(path);
}`;

  /** Line-by-line walkthrough of {@link navSample}. */
  protected readonly navNotes: CodeNote[] = [
    {
      line: 2,
      text: '`inject()` is the modern way to get a service handle — the same object a constructor parameter would give you, without the constructor.',
    },
    {
      line: 3,
      text: "`ActivatedRoute` describes THIS component's own route. It's only needed here for `relativeTo` below — reading a route's own params is a separate lesson.",
    },
    {
      line: 6,
      text: "`router.navigate()` takes an **array** of path segments, not a single string — `['/users', id]` builds `/users/7` for you, with `id` interpolated safely instead of string-concatenated.",
    },
    {
      line: 7,
      text: 'Query params ride along as a separate, sibling property — never appended onto the path string yourself.',
    },
    {
      line: 8,
      text: '`relativeTo` is what makes the array above relative to the CURRENT route instead of absolute. Omit it and a segment with no leading `/` is resolved from the app root instead — a common source of “navigates somewhere surprising”.',
    },
    {
      line: 14,
      text: '`navigateByUrl()` takes one ready-made string instead of building segments — reach for it when you already have a full path (a saved URL, a deep link) rather than assembling one piece by piece.',
    },
  ];

  /** Choices for the href check. */
  protected readonly hrefOptions: QuizOption[] = [
    {
      text: 'The same as `routerLink` — Angular intercepts every anchor on the page',
      why: 'Angular only intercepts anchors carrying the `routerLink` directive. A plain `href` is an ordinary link and the browser handles it the ordinary way, with no framework involvement at all.',
    },
    {
      text: 'The whole app reloads from the server and re-bootstraps',
      correct: true,
      why: 'The browser does a full document navigation: it throws away the page, re-downloads the bundle, and starts Angular again from scratch. Every signal, service instance and unsaved form is gone. Visually it "works", which is exactly why this one survives into production — it just feels inexplicably slow.',
    },
    {
      text: 'Nothing — Angular blocks navigations it did not initiate',
      why: 'The router has no veto over ordinary browser navigation. Guards protect routes the *router* activates; they never see a full page load leaving the app.',
    },
    {
      text: 'It navigates client-side but skips the guards',
      why: 'There is no half-measure here. Either the router handles it (guards and all) or the browser does (no Angular involved until the app restarts).',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'What is the difference between `routerLink="users"` and `routerLink="/users"`?',
      a: 'The leading slash means **absolute**. From `/admin`, `routerLink="/users"` goes to `/users`, while `routerLink="users"` is relative and goes to `/admin/users`. Getting this wrong is a common cause of "the link works from one page but not another" — the absolute form is the safer default unless you specifically want relative navigation.',
    },
    {
      q: 'Why is my Home link highlighted on every page?',
      a: '`routerLinkActive` uses **prefix** matching, and every URL starts with `/`. So the link to `/` is technically active everywhere. Add `[routerLinkActiveOptions]="{ exact: true }"` to that one link. You rarely want `exact` on the others, because you usually *do* want `/users` highlighted while sitting on `/users/7`.',
    },
    {
      q: 'When do I use `component` versus `loadComponent`?',
      a: '`component` imports the class eagerly, so it lands in your initial bundle whether or not the user visits that route. `loadComponent: () => import(...)` defers it into its own chunk, fetched on first navigation. For anything beyond a landing page, prefer `loadComponent` — it is the single easiest way to keep the initial bundle small, and this very app uses it for all 100 lessons.',
    },
    {
      q: 'Navigating from /users/1 to /users/2 does not reload my data. Why?',
      a: 'Because the router reuses the component instance when only the parameters change — destroying and rebuilding identical DOM would be wasteful. Your `ngOnInit` therefore does not run again. The fix is to treat the params as a stream rather than a one-off read: subscribe to `route.paramMap`, or use its signal equivalent, so the component reacts to a param change instead of assuming it only happens once.',
    },
    {
      q: 'What is a `UrlTree`, and why do guards return one?',
      a: 'It is a parsed URL as an object — segments, params and fragment — rather than a string. A guard returning a `UrlTree` says "not that route, this one instead" as a single decision the router can act on atomically. That is why it is preferred over calling `router.navigate()` inside a guard, which starts a *second* navigation while the first is still deciding.',
    },
  ];

  /** The empty-path redirect trap — the most-failed routing exam question. */
  protected readonly pathMatchSample = `export const routes: Routes = [
  { path: '', redirectTo: 'home' },     // no pathMatch
  { path: 'home', component: Home },
  { path: 'about', component: About },
];

// The user navigates to /about. Where do they end up?`;

  /**
   * The URL being matched in the playground. Seeded with a parameterised,
   * multi-segment path so the demo opens on an interesting case rather than on
   * a bare `/` — and so it matches {@link matchTalk} above.
   */
  protected readonly testUrl = signal('users/7/edit');

  /** The demo table, in match order (top wins). */
  protected readonly demoRoutes: DemoRoute[] = [
    { path: '', label: 'HomeComponent', full: true },
    { path: 'about', label: 'AboutComponent' },
    { path: 'users/:id/edit', label: 'UserEditComponent' },
    { path: 'users/:id', label: 'UserComponent' },
    { path: '**', label: 'NotFoundComponent (404)' },
  ];

  /** The path of the first route that matches the typed URL (first match wins). */
  protected readonly matchedPath = computed(() => {
    const segs = this.testUrl().split('/').filter(Boolean);
    for (const r of this.demoRoutes) {
      if (this.routeMatches(r, segs)) return r.path;
    }
    return null;
  });

  /**
   * Whether a demo route would match a URL, mirroring Angular's own rules in
   * miniature: `**` matches anything, segment counts must agree, and a `:param`
   * segment matches any single segment.
   *
   * Simplified on purpose — no matrix parameters, no `pathMatch: 'full'`, no child
   * routes. The point is the top-down first-match scan, and the real matcher's
   * edge cases would bury it.
   *
   * @param route The candidate route.
   * @param url   The URL split into segments.
   * @returns Whether this route would claim the URL.
   */
  private routeMatches(route: DemoRoute, url: string[]): boolean {
    if (route.path === '**') return true; // wildcard matches anything
    const routeSegs = route.path.split('/').filter(Boolean);
    // Empty path with pathMatch:'full' only matches the empty URL.
    if (routeSegs.length === 0) return route.full ? url.length === 0 : true;
    if (routeSegs.length !== url.length) return false; // exact segment count here
    return routeSegs.every((seg, i) => seg.startsWith(':') || seg === url[i]);
  }
}
