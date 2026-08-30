import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 * parameters, `routerLink` and `routerLinkActive`.
 *
 * The centrepiece is a route-matcher playground: a fixed table of demo routes
 * and a URL you can edit, with the row that would win highlighted live. Route
 * matching is first-match-wins on a top-down scan, which is the single most
 * common source of "my route never fires" — and it is far easier to see than to
 * read about.
 *
 * @see routeMatches for the matching rules the demo implements.
 */
@Component({
  selector: 'app-lesson-routing-basics',
  imports: [RouterLink, RouterLinkActive, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './routing-basics.html',
  styleUrl: './routing-basics.css',
})
export class RoutingBasics {
  /**
   * What one click on a `routerLink` actually sets in motion. Laid out because
   * beginners tend to picture "URL changes, component appears" as one step, and
   * every routing feature they meet later — guards, resolvers, lazy loading —
   * slots into one of the gaps in between.
   */
  protected readonly navigation = [
    { label: 'Click a `routerLink`', detail: 'The default browser navigation is cancelled' },
    { label: 'URL → `UrlTree`', detail: 'Parsed into segments, query params and a fragment' },
    {
      label: 'Match the table, top-down',
      detail: 'The scan stops at the first route that fits',
      tone: 'accent' as const,
    },
    { label: 'Guards run', detail: 'Any one of them can cancel or redirect the whole navigation' },
    {
      label: 'Lazy chunk + resolvers',
      detail: '`loadComponent` fetches; resolvers pre-fetch data',
    },
    {
      label: 'Component into the outlet',
      detail: 'Only now does the address bar update',
      tone: 'good' as const,
    },
  ];

  /** The empty-path redirect trap — the most-failed routing exam question. */
  protected readonly pathMatchSample = `export const routes: Routes = [
  { path: '', redirectTo: 'home' },     // no pathMatch
  { path: 'home', component: Home },
  { path: 'about', component: About },
];

// The user navigates to /about. Where do they end up?`;

  /** Choices for the href check. */
  protected readonly hrefOptions = [
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
  protected readonly questions = [
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

  /**
   * The URL being matched in the playground. Seeded with a parameterised,
   * multi-segment path so the demo opens on an interesting case rather than on a
   * bare `/`.
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
