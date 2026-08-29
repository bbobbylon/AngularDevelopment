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
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Routing</span>
      <h1>Routing Basics</h1>
      <p class="lead">
        The Angular Router maps URLs to components, enabling a single-page app to
        have many "pages" without full reloads. You define a route table, mark
        where components render with <code>&lt;router-outlet&gt;</code>, and link
        with <code>routerLink</code>.
      </p>

      <h2>1. Define the routes</h2>
      <div class="code">
        <pre>// app.routes.ts
export const routes: Routes = [
  {{ '{' }} path: '', component: HomeComponent {{ '}' }},
  {{ '{' }} path: 'about', component: AboutComponent {{ '}' }},
  {{ '{' }} path: 'users/:id', component: UserComponent {{ '}' }},   // route param
  {{ '{' }} path: '**', redirectTo: '' {{ '}' }},                    // wildcard / 404
];</pre>
      </div>

      <h2>2. Register the router</h2>
      <div class="code">
        <pre>// app.config.ts
export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [provideRouter(routes)],
{{ '}' }};</pre>
      </div>

      <h2>3. Place an outlet</h2>
      <p>The matched component renders wherever you put the outlet:</p>
      <div class="code">
        <pre>&lt;nav&gt;...&lt;/nav&gt;
&lt;router-outlet /&gt;   &lt;!-- routed component appears here --&gt;</pre>
      </div>

      <h2>4. Link with routerLink (not href)</h2>
      <p>
        <code>routerLink</code> navigates without reloading the page;
        <code>routerLinkActive</code> adds a class when the link's route is active.
        These links are live — they navigate this very app:
      </p>
      <div class="demo">
        <p class="demo__title">Live navigation</p>
        <div class="navdemo">
          <a routerLink="/signals" routerLinkActive="active">Signals</a>
          <a routerLink="/inputs" routerLinkActive="active">Inputs</a>
          <a routerLink="/pipes" routerLinkActive="active">Pipes</a>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        </div>
      </div>

      <div class="code">
        <pre>&lt;a routerLink="/about" routerLinkActive="active"&gt;About&lt;/a&gt;
&lt;a [routerLink]="['/users', user.id]"&gt;Profile&lt;/a&gt;   &lt;!-- dynamic --&gt;</pre>
      </div>

      <div class="note">
        Use <code>[routerLinkActiveOptions]="{{ '{' }} exact: true {{ '}' }}"</code> on the
        home link so <code>/</code> is not marked active for every route (since every
        path starts with <code>/</code>).
      </div>

      <h2>Links with params, query & fragment</h2>
      <div class="code">
        <pre>&lt;a [routerLink]="['/users', id]"
   [queryParams]="{{ '{' }} tab: 'profile' {{ '}' }}"
   fragment="bio"&gt;Profile&lt;/a&gt;             // → /users/7?tab=profile#bio

&lt;a routerLink="../sibling"&gt;Up one&lt;/a&gt;   // relative to the current route</pre>
      </div>

      <h2>Programmatic navigation</h2>
      <div class="code">
        <pre>private router = inject(Router);
goToUser(id: number) {{ '{' }}
  this.router.navigate(['/users', id], {{ '{' }}
    queryParams: {{ '{' }} tab: 'profile' {{ '}' }},
    relativeTo: this.route,          // for relative navigation
  {{ '}' }});
{{ '}' }}
// or parse a string: this.router.navigateByUrl('/users/7?tab=profile');</pre>
      </div>
      <div class="note">
        Routes are matched <strong>top-to-bottom, first match wins</strong>, so put the
        wildcard <code>**</code> last and order specific paths before generic ones. Set
        per-route page titles with the <code>title</code> property, and provide a
        <code>TitleStrategy</code> to customise how they're applied.
      </div>

      <h2>Live #2 — the matcher: first match wins</h2>
      <p>
        The router walks the table top-to-bottom and stops at the <strong>first</strong> route
        that matches the URL. Type a path below and watch which entry wins — reorder in your head
        and you'll see why a stray <code>**</code> or a bare <code>''</code> in the wrong place can
        swallow everything:
      </p>
      <div class="demo">
        <p class="demo__title">Live — enter a URL path</p>
        <div class="row" style="margin-bottom:12px">
          <span>/</span>
          <input [value]="testUrl()" (input)="testUrl.set($any($event.target).value)"
                 placeholder="e.g. users/7/edit" style="width:200px" />
        </div>
        <table class="matcher">
          @for (r of demoRoutes; track r.path) {
            <tr [class.hit]="matchedPath() === r.path">
              <td><code>{{ r.path === '' ? "'' (empty)" : r.path }}</code>{{ r.full ? ' · full' : '' }}</td>
              <td>{{ r.label }}</td>
              <td>{{ matchedPath() === r.path ? '✅ matched' : '' }}</td>
            </tr>
          }
        </table>
      </div>

      <h2>Under the hood — how a URL is matched</h2>
      <p>
        The router splits both the URL and each route's <code>path</code> into
        <strong>segments</strong> on <code>/</code>, then compares them left to right. A literal
        segment must equal the URL's; a <code>:param</code> segment matches any single segment and
        captures its value; <code>**</code> matches all remaining segments. By default matching is
        <strong>prefix</strong>: <code>path: 'users'</code> matches <code>/users</code>,
        <code>/users/7</code> and deeper, because the route only needs to match the <em>start</em>.
        That's usually what you want for parent routes with children — but it's a trap for redirects.
      </p>

      <h2>Exam pitfalls</h2>
      <ul>
        <li><strong><code>pathMatch: 'full'</code> on empty-path redirects.</strong> <code>{{ '{' }} path: '', redirectTo: 'home' {{ '}' }}</code> with the default prefix match redirects <em>every</em> URL (they all start with <code>''</code>). Add <code>pathMatch: 'full'</code> so only the exact empty path redirects.</li>
        <li><strong>Order matters — wildcard last.</strong> A <code>**</code> or a greedy prefix route placed early wins before more specific ones ever get a chance.</li>
        <li><strong><code>href</code> triggers a full page reload.</strong> Use <code>routerLink</code> for in-app navigation; <code>href</code> re-downloads the whole app.</li>
        <li><strong>Home link stays "active" everywhere.</strong> <code>routerLinkActive</code> uses prefix matching too — add <code>[routerLinkActiveOptions]="{{ '{' }} exact: true {{ '}' }}"</code> to the <code>/</code> link.</li>
        <li><strong>Leading slash = absolute.</strong> <code>routerLink="/users"</code> is absolute; <code>routerLink="users"</code> is relative to the current route. Mixing them up navigates somewhere surprising.</li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>Routes map a <code>path</code> to a <code>component</code> (or a lazy <code>loadComponent</code>).</li>
        <li><code>&lt;router-outlet&gt;</code> marks where the matched component renders.</li>
        <li><code>routerLink</code> navigates in-app; <code>routerLinkActive</code> highlights the current link.</li>
        <li><code>:param</code> declares a route parameter; <code>**</code> is the wildcard.</li>
        <li>Navigate from code with <code>Router.navigate()</code>.</li>
      </ul>

      <p><a routerLink="/http-basics">Next: HTTP Basics →</a></p>
    </article>
  `,
  styles: [
    `
      .navdemo {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .navdemo a {
        padding: 8px 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
      }
      .navdemo a.active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        text-decoration: none;
      }
      .matcher { width: 100%; border-collapse: collapse; font-size: .85rem; }
      .matcher td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
      .matcher tr.hit { background: rgba(46, 193, 107, 0.12); }
      .matcher tr.hit td:first-child { border-left: 3px solid var(--green, #2ec16b); }
    `,
  ],
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
