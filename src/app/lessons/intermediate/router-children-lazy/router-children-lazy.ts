import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './router-children-lazy.html',
  styleUrl: './router-children-lazy.css',
})
export class RouterChildrenLazy {
  /**
   * The double-instance puzzle used by the ask-before-telling block.
   *
   * `providedIn: 'root'` and a route-level `providers` entry are not the same
   * registration — the second one creates a *second* instance in the route's
   * child injector. Nothing errors, nothing warns; the two halves of the app
   * simply keep separate carts. It is held in the class rather than the template
   * because the snippet is full of `{`/`}`, which Angular's parser reads as
   * control-flow syntax in an attribute.
   */
  protected readonly doubleInstanceSample = `// shop-api.ts
@Injectable({ providedIn: 'root' })      // registration #1 — the ROOT injector
export class ShopApi {
  readonly cart = signal<string[]>([]);  // the shared shopping cart
}

// app.routes.ts
{
  path: 'shop',
  providers: [ShopApi],                  // registration #2 — a CHILD injector for /shop/**
  loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES),
}

// ProductPage renders at /shop/42 and runs:  this.api.cart.update(c => [...c, id]);
// HeaderBadge renders in the app shell, OUTSIDE /shop, and renders:  {{ api.cart().length }}`;

  /**
   * The self-test, on what a `canActivate`-guarded lazy route actually does on
   * the wire. Every wrong answer is a belief a working developer holds until the
   * first time they open the Network tab on a denied navigation.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'The chunk downloads with a 200, and only then does the guard reject and the router navigate away.',
      correct: true,
      why: 'Right, and this is the whole reason `canMatch` exists. `canActivate` is asked *after* the router has resolved the route, which for a lazy route means the import has already run. The admin code is now sitting in the browser of someone who is not an admin.',
    },
    {
      text: 'No request is made — the guard fails first, so the router never reaches the loader.',
      why: 'That is what `canMatch` does, not `canActivate`. `canMatch` runs during route *matching*, before the route is even chosen; `canActivate` runs during *activation*, which is after the component has been loaded and is ready to be created.',
    },
    {
      text: 'The request is made but the server returns 403, so nothing sensitive reaches the browser.',
      why: 'The chunk is a static JavaScript file served by your CDN or dev server, not a protected API route — it has no idea who is asking. It answers 200 to anyone. Guards are client-side routing logic, not server authorization.',
    },
    {
      text: 'It depends on the preloading strategy — with no preloading configured, the chunk is not fetched.',
      why: 'Preloading changes *when* chunks are fetched in the background, not whether an actual navigation fetches them. This navigation really happened, so the loader really ran.',
    },
  ];

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
