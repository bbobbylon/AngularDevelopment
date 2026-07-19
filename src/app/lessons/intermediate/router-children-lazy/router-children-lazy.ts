import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Feature {
  id: string;
  label: string;
  eager: boolean;
  size: string;
}

/**
 * Lesson: child routes, nested outlets, and lazy loading.
 *
 * Beyond the config snippets: a live simulation of on-demand chunk loading
 * (first visit downloads, later visits are cached), the loadComponent vs
 * loadChildren vs @defer trade-off, why canMatch (not canActivate) is the guard
 * that avoids downloading a forbidden feature, route-scoped providers and the
 * injector hierarchy, preloading strategies, and the exam-day traps
 * (pathMatch: 'full', default exports).
 */
@Component({
  selector: 'app-lesson-router-children-lazy',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Child Routes &amp; Lazy Loading</h1>
      <p class="lead">
        Real apps nest routes and split code so the browser only downloads a feature when
        the user visits it. Child routes render into a nested
        <code>&lt;router-outlet&gt;</code>; lazy loading defers the JavaScript until first
        navigation — the single biggest lever on your initial bundle size.
      </p>

      <h2>See it: on-demand chunks, cached after first load</h2>
      <div class="demo">
        <p class="demo__title">Live — a mock router with lazy features</p>
        <div class="row" style="margin-bottom:12px">
          @for (f of features; track f.id) {
            <button [class.active]="active() === f.id" (click)="navTo(f)">
              {{ f.label }}
              @if (f.eager) { <span class="tag">eager</span> }
              @else if (loaded().includes(f.id)) { <span class="tag ok">cached</span> }
              @else { <span class="tag">lazy</span> }
            </button>
          }
        </div>
        <div class="screen">
          @if (loadingId()) {
            <div class="net">GET {{ chunkName(loadingId()!) }} <span class="spinner"></span> downloading…</div>
          } @else {
            <div class="net done">
              {{ activeFeature().eager ? 'in the initial bundle — no request' : 'GET ' + chunkName(active()) + ' → 200 (cached)' }}
            </div>
            <h3 style="margin:.4rem 0 0">{{ activeFeature().label }}</h3>
            <p style="margin:.2rem 0;color:var(--text-muted)">rendered from its chunk ({{ activeFeature().size }})</p>
          }
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          The first visit to a lazy feature downloads its chunk (~700 ms here); after that
          it's <span class="ok">cached</span> and navigation is instant. The eager
          Dashboard ships in the initial bundle, so it never makes a request.
        </p>
      </div>

      <h2>Child routes &amp; nested outlets</h2>
      <div class="code"><pre>{{ childrenSample }}</pre></div>
      <p>
        <code>SettingsShell</code>'s template places a second
        <code>&lt;router-outlet&gt;</code> where <code>ProfileTab</code>/<code>SecurityTab</code>
        render — that's the nested outlet. The empty-path child redirect needs
        <code>pathMatch: 'full'</code>.
      </p>

      <h2>Lazy: a component, or a whole route group</h2>
      <div class="code"><pre>{{ lazySample }}</pre></div>
      <p>
        <strong>This entire tutorial app uses <code>loadComponent</code></strong> — every
        lesson is its own lazy chunk, which is why the initial bundle stays ~400 kB while
        the app has 100+ lessons.
      </p>
      <table class="cmp">
        <tr><th>Tool</th><th>Splits</th><th>Use when</th></tr>
        <tr><td><code>loadComponent</code></td><td>one standalone component into a chunk</td><td>a single lazy page</td></tr>
        <tr><td><code>loadChildren</code></td><td>a <code>Routes</code> array (a whole feature) into a chunk</td><td>a feature area with several routes</td></tr>
        <tr><td><code>&#64;defer</code></td><td>a block <em>within</em> a page</td><td>below-the-fold / heavy widgets, no URL of their own</td></tr>
      </table>

      <h2>Guard the download: <code>canMatch</code> vs <code>canActivate</code></h2>
      <p>
        A subtle but important distinction. <code>canActivate</code> runs <em>after</em>
        the lazy chunk is fetched — so an unauthorized user still pays the download.
        <code>canMatch</code> runs <em>before</em> matching, so a failing guard skips the
        route entirely and the chunk is never requested (and the router can fall through
        to another route):
      </p>
      <div class="code"><pre>{{ canMatchSample }}</pre></div>

      <h2>Route-scoped providers</h2>
      <p>
        A lazy route can declare <code>providers</code>. They create a child injector for
        that route subtree, so a service can be scoped to one feature instead of the root —
        it's created when you enter the feature and shares one instance across its routes:
      </p>
      <div class="code"><pre>{{ providersSample }}</pre></div>

      <h2>Preloading strategies</h2>
      <p>
        Lazy chunks load on demand by default. A preloading strategy fetches them in the
        background <em>after</em> the app boots, so later navigation feels instant without
        bloating the initial bundle:
      </p>
      <table class="cmp">
        <tr><th>Strategy</th><th>Behaviour</th></tr>
        <tr><td><em>(none, default)</em></td><td>each chunk downloads on first navigation to it.</td></tr>
        <tr><td><code>PreloadAllModules</code></td><td>after boot, background-fetch every lazy chunk.</td></tr>
        <tr><td>custom strategy</td><td>preload only routes you flag, e.g. <code>data: &#123; preload: true &#125;</code>.</td></tr>
        <tr><td><code>ngx-quicklink</code></td><td>community: preload chunks for the links currently in the viewport.</td></tr>
      </table>
      <div class="code"><pre>{{ preloadSample }}</pre></div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong><code>pathMatch: 'full'</code> on empty redirects.</strong> The default
          <code>'prefix'</code> matches every URL, so an empty-path
          <code>redirectTo</code> creates a redirect loop.</li>
        <li><strong>Guarding lazy routes with <code>canActivate</code> only.</strong> The
          chunk still downloads before the guard denies. Use <code>canMatch</code> to skip
          the download.</li>
        <li><strong><code>loadChildren</code> target shape.</strong> It must resolve to a
          <code>Routes</code> array — a named export or the file's <strong>default
          export</strong>.</li>
        <li><strong>Preloading everything on a huge app.</strong> <code>PreloadAllModules</code>
          can flood the network on boot; prefer a flag-based custom strategy at scale.</li>
        <li><strong>Feature service leaking to root.</strong> If it's
          <code>providedIn: 'root'</code>, route <code>providers</code> won't scope it —
          drop the root registration to keep it feature-local.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Which guard prevents downloading a lazy chunk for an unauthorized user?</summary>
        <div><code>canMatch</code>. It runs before the route matches, so the chunk is never
        fetched. <code>canActivate</code> runs after the fetch.</div>
      </details>
      <details class="qa">
        <summary><code>loadComponent</code> vs <code>loadChildren</code>?</summary>
        <div><code>loadComponent</code> lazy-loads a single standalone component;
        <code>loadChildren</code> lazy-loads a whole <code>Routes</code> array (a feature
        with several routes and its own child outlet).</div>
      </details>
      <details class="qa">
        <summary>Empty-path redirect causes an infinite loop. Fix?</summary>
        <div>Add <code>pathMatch: 'full'</code> so it matches only the exact empty URL
        instead of every path (<code>'prefix'</code>).</div>
      </details>
      <details class="qa">
        <summary>How do you scope a service to one lazy feature?</summary>
        <div>Add it to that route's <code>providers</code> array (creating a child injector
        for the subtree) and don't also register it <code>providedIn: 'root'</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>children</code> + a nested <code>&lt;router-outlet&gt;</code> build layered UIs.</li>
        <li><code>loadComponent</code> lazy-loads one component; <code>loadChildren</code> a route group; <code>&#64;defer</code> a block within a page.</li>
        <li>Use <code>canMatch</code> to skip the download for forbidden routes; <code>canActivate</code> fetches first.</li>
        <li>Route <code>providers</code> scope services to a feature; <code>withPreloading</code> warms chunks in the background.</li>
      </ul>

      <p><a routerLink="/route-guards">Next: Functional Route Guards →</a></p>
    </article>
  `,
  styles: [
    `
      button.active { background: var(--accent); color: #fff; }
      .tag { font-size: .62rem; text-transform: uppercase; letter-spacing: .04em; padding: 1px 5px; border-radius: 4px; border: 1px solid var(--border); margin-left: 6px; opacity: .8; }
      .tag.ok { color: var(--green); border-color: var(--green); }
      .screen { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; background: var(--bg-elevated); min-height: 84px; }
      .net { font-family: monospace; font-size: .78rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
      .net.done { color: var(--green); }
      .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .ok { color: var(--green); font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class RouterChildrenLazy {
  protected readonly features: Feature[] = [
    { id: 'dashboard', label: 'Dashboard', eager: true, size: 'in main' },
    { id: 'reports', label: 'Reports', eager: false, size: '42 kB' },
    { id: 'admin', label: 'Admin', eager: false, size: '31 kB' },
  ];

  protected readonly active = signal('dashboard');
  protected readonly loaded = signal<string[]>(['dashboard']);
  protected readonly loadingId = signal<string | null>(null);
  private navToken = 0;

  protected activeFeature(): Feature {
    return this.features.find((f) => f.id === this.active())!;
  }

  protected chunkName(id: string): string {
    return `${id}-a1b2c3.js`;
  }

  protected navTo(f: Feature): void {
    const token = ++this.navToken;
    // Eager or already-downloaded chunk → navigate immediately (cache hit).
    if (f.eager || this.loaded().includes(f.id)) {
      this.loadingId.set(null);
      this.active.set(f.id);
      return;
    }
    // First visit to a lazy feature → simulate the network fetch.
    this.loadingId.set(f.id);
    setTimeout(() => {
      if (token !== this.navToken) return; // superseded by another click
      this.loaded.update((l) => [...l, f.id]);
      this.loadingId.set(null);
      this.active.set(f.id);
    }, 700);
  }

  protected readonly childrenSample = `const routes: Routes = [
  {
    path: 'settings',
    component: SettingsShell,          // has its own <router-outlet>
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileTab },
      { path: 'security', component: SecurityTab },
    ],
  },
];`;

  protected readonly lazySample = `// one component
{ path: 'admin', loadComponent: () => import('./admin/admin').then(m => m.Admin) }

// a whole feature (route group)
{ path: 'shop', loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES) }

// shop.routes.ts
export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopHome },
  { path: ':id', component: ProductPage },
];`;

  protected readonly canMatchSample = `{
  path: 'admin',
  canMatch: [() => inject(Auth).isAdmin()],   // false → route skipped, chunk NOT fetched
  loadComponent: () => import('./admin/admin').then(m => m.Admin),
}
// vs canActivate: [...] which fetches the chunk first, THEN denies.`;

  protected readonly providersSample = `{
  path: 'shop',
  providers: [ShopApi],   // a child injector — one ShopApi shared across /shop/**
  loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES),
}`;

  protected readonly preloadSample = `provideRouter(routes, withPreloading(PreloadAllModules));

// custom: preload only routes flagged data: { preload: true }
export class FlagPreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`;
}
