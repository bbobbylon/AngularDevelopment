import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One feature area in the lazy-loading demo: whether it ships in the main bundle
 * or as its own chunk, and how big that chunk is.
 */
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
  templateUrl: './router-children-lazy.html',
  styleUrl: './router-children-lazy.css',
})
export class RouterChildrenLazy {
  /**
   * The demo's feature areas — one eager, the rest lazy.
   */
  protected readonly features: Feature[] = [
    { id: 'dashboard', label: 'Dashboard', eager: true, size: 'in main' },
    { id: 'reports', label: 'Reports', eager: false, size: '42 kB' },
    { id: 'admin', label: 'Admin', eager: false, size: '31 kB' },
  ];

  /**
   * Which feature is showing.
   */
  protected readonly active = signal('dashboard');
  /**
   * Which chunks have been downloaded. Starts with the eager one, which was never
   * a separate download in the first place.
   */
  protected readonly loaded = signal<string[]>(['dashboard']);
  /**
   * The chunk currently downloading, or `null`.
   */
  protected readonly loadingId = signal<string | null>(null);
  /**
   * Invalidates in-flight navigation timers, so switching features mid-download
   * cannot let the abandoned one finish and overwrite the view.
   */
  private navToken = 0;

  /**
   * The active feature. The non-null assertion is safe because the active id only
   * ever comes from the list.
   */
  protected activeFeature(): Feature {
    return this.features.find((f) => f.id === this.active())!;
  }

  /**
   * The chunk filename the CLI would emit for a feature — content hash and all.
   *
   * @param id The feature id.
   */
  protected chunkName(id: string): string {
    return `${id}-a1b2c3.js`;
  }

  /**
   * Navigates to a feature, simulating the download if its chunk is not yet
   * cached.
   *
   * The delay only ever happens once per feature: a downloaded chunk is cached for
   * the life of the page, which is why lazy loading costs a pause on first visit
   * and nothing after that.
   */
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

  /**
   * Sample: child routes, and where the parent's `<router-outlet />` has to be.
   */
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

  /**
   * Sample: `loadComponent` for one component and `loadChildren` for a whole
   * route file.
   */
  protected readonly lazySample = `// one component
{ path: 'admin', loadComponent: () => import('./admin/admin').then(m => m.Admin) }

// a whole feature (route group)
{ path: 'shop', loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES) }

// shop.routes.ts
export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopHome },
  { path: ':id', component: ProductPage },
];`;

  /**
   * Sample: `canMatch` on a lazy route — the only guard that runs early enough to
   * stop the chunk being fetched at all.
   */
  protected readonly canMatchSample = `{
  path: 'admin',
  canMatch: [() => inject(Auth).isAdmin()],   // false → route skipped, chunk NOT fetched
  loadComponent: () => import('./admin/admin').then(m => m.Admin),
}
// vs canActivate: [...] which fetches the chunk first, THEN denies.`;

  /**
   * Sample: route-level `providers`, which create a child injector scoped to that
   * route subtree.
   */
  protected readonly providersSample = `{
  path: 'shop',
  providers: [ShopApi],   // a child injector — one ShopApi shared across /shop/**
  loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES),
}`;

  /**
   * Sample: preloading — fetching lazy chunks in idle time, so the first visit is
   * not the one that pays.
   */
  protected readonly preloadSample = `provideRouter(routes, withPreloading(PreloadAllModules));

// custom: preload only routes flagged data: { preload: true }
export class FlagPreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`;
}
