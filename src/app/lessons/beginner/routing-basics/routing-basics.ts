import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './routing-basics.html',
  styleUrl: './routing-basics.css',
})
export class RoutingBasics {
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
