import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

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

/** Which of `SettingsShell`'s two tabs is active in the shell-reuse demo. */
type SettingsTab = 'profile' | 'security';

/**
 * Lesson: child routes, nested outlets, and lazy loading.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), following the shape set by
 * `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the bundle-bloat problem before naming the fix.** Everything ships
 *    up front unless you deliberately split it — the reader predicts, on the
 *    live demo further down, whether an eager and two lazy features cost any
 *    requests before they click anything.
 * 2. **One analogy carries the whole lesson.** The app is a building, not a
 *    room: a route is a floor, `<router-outlet>` is the doorway into whichever
 *    room is currently open, lazy loading is a floor that isn't built until
 *    someone asks for it, and `canMatch`/`canActivate` are a receptionist who
 *    won't call the construction crew versus a guard checking badges at an
 *    already-built door. Nesting, splitting, guarding and scoping are all the
 *    same picture at different zoom levels.
 * 3. **The same idea in several modes**, per concept: a `CodeLab` for the
 *    syntax, a `Compare` or `Layers` diagram for the shape, a live demo for
 *    the consequence, a quiz or predict for the trap.
 * 4. **Every snippet is annotated line by line.** Nothing here assumes the
 *    reader can already parse a route config object.
 *
 * ## Coverage-sweep material folded in (docs/COVERAGE-SWEEP.md → this lesson)
 *
 * - A stray *value* import from the eager graph silently un-lazies a route
 *   that still reads correctly — "the chunk that didn't split" section, with
 *   a predict-then-reveal `CodeLab`.
 * - Componentless routes (`children` with no `component`) — a `Compare`, a
 *   `Layers` diagram and a `TapeCard` row, three different angles on the same
 *   point, plus a quiz.
 * - The parent shell is **not** recreated when navigating between sibling
 *   children — a dedicated section with its own live demo (`shellVisits` /
 *   `tabVisits`), since this is the failure mode that makes
 *   `canActivateChild` and route-scoped `providers` necessary rather than
 *   optional.
 * - Named (auxiliary) outlets — a short annotated `CodeLab`.
 * - `ChunkLoadError` after a redeploy — folded into the pitfalls table with
 *   its standard fix.
 */
@Component({
  selector: 'app-lesson-router-children-lazy',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './router-children-lazy.html',
  styleUrl: './router-children-lazy.css',
})
export class RouterChildrenLazy {
  // ── "You are here" rail — Routing, in curriculum order ────────────────────

  /** The Routing track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Routing Basics', id: 'routing-basics' },
    { label: 'Child Routes' },
    { label: 'Route Guards', id: 'route-guards' },
    { label: 'Resolvers', id: 'resolvers' },
    { label: 'Route Params', id: 'route-params' },
  ];

  // ── Demo 1: on-demand chunks, cached after first load ──────────────────────

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

  // ── Demo 2: the parent shell is not recreated between sibling children ─────

  /**
   * How many times the simulated `SettingsShell` has been "constructed" — only
   * moves when {@link leaveAndReturn} is pressed, never when switching tabs.
   */
  protected readonly shellVisits = signal(1);
  /**
   * Which tab is currently open inside the shell.
   */
  protected readonly settingsTab = signal<SettingsTab>('profile');
  /**
   * How many times each tab has been "entered" — increments on every switch,
   * unlike {@link shellVisits}.
   */
  protected readonly tabVisits = signal<Record<SettingsTab, number>>({ profile: 1, security: 0 });

  /**
   * Switches to the given tab inside the shell — the equivalent of clicking
   * between `/settings/profile` and `/settings/security`. The shell itself is
   * untouched; only the child changes.
   *
   * @param tab The tab to switch to.
   */
  protected switchTab(tab: SettingsTab): void {
    if (tab === this.settingsTab()) return;
    this.settingsTab.set(tab);
    this.tabVisits.update((v) => ({ ...v, [tab]: v[tab] + 1 }));
  }

  /**
   * Simulates leaving `/settings` entirely (say, to `/dashboard`) and coming
   * back — the one thing that really does destroy and rebuild the shell, and
   * with it every child and every route-scoped provider underneath it.
   */
  protected leaveAndReturn(): void {
    this.shellVisits.update((n) => n + 1);
    this.settingsTab.set('profile');
    this.tabVisits.set({ profile: 1, security: 0 });
  }

  // ── Code samples ────────────────────────────────────────────────────────

  /**
   * Sample: child routes, and where the parent's `<router-outlet />` has to be.
   */
  protected readonly childrenSample = `const routes: Routes = [
  {
    path: 'settings',
    component: SettingsShell, // owns its own <router-outlet>
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileTab },
      { path: 'security', component: SecurityTab },
    ],
  },
];`;

  /** Line-by-line walkthrough of {@link childrenSample}. */
  protected readonly childrenNotes: CodeNote[] = [
    {
      line: 1,
      text: '`Routes` is the array type every route config exports — an ordinary array of route objects, nothing more magical than that.',
    },
    {
      line: 4,
      text: "`component: SettingsShell` is what makes this a **component route** — and because it has one, its own template needs a second `<router-outlet>` for whatever's below to render into.",
    },
    {
      line: 5,
      text: "`children` are matched **relative to this route's own path**. `profile` here means `/settings/profile`, never bare `/profile`.",
    },
    {
      line: 6,
      text: "The empty-path child. `pathMatch: 'full'` is required here — the default `'prefix'` matches every URL that starts with the parent's path, which would make this redirect match itself and loop forever.",
    },
    {
      line: 7,
      text: "`/settings/profile` renders `ProfileTab` — into `SettingsShell`'s own outlet, not the root one.",
    },
    {
      line: 8,
      text: "`/settings/security` — same shell, same outlet, a different room. Switching between these two lines never touches `SettingsShell` itself; there's a live demo of exactly that further down.",
    },
  ];

  /** Sample: a route WITH a component, for the componentless comparison. */
  protected readonly componentRouteSample = `{
  path: 'admin',
  component: AdminShell, // needs its own <router-outlet>
  children: [
    { path: 'users', component: AdminUsers },
    { path: 'roles', component: AdminRoles },
  ],
}`;

  /** Sample: the same grouping, componentless. */
  protected readonly componentlessRouteSample = `{
  path: 'admin',
  canActivate: [adminGuard], // shared by every child below
  providers: [AdminApi], // one instance for the whole group
  children: [
    { path: 'users', component: AdminUsers },
    { path: 'roles', component: AdminRoles },
  ],
}
// no \`component\` → children render in the PARENT'S outlet,
// one level up. AdminShell is never built at all.`;

  /**
   * Sample: `loadComponent` for one component and `loadChildren` for a whole
   * route file.
   */
  protected readonly lazySample = `// one component
{ path: 'admin', loadComponent: () => import('./admin/admin').then((m) => m.Admin) }

// a whole feature (route group)
{ path: 'shop', loadChildren: () => import('./shop/shop.routes').then((m) => m.SHOP_ROUTES) }

// shop.routes.ts
export const SHOP_ROUTES: Routes = [
  { path: '', component: ShopHome },
  { path: ':id', component: ProductPage },
];`;

  /** Line-by-line walkthrough of {@link lazySample}. */
  protected readonly lazyNotes: CodeNote[] = [
    {
      line: 2,
      text: "`loadComponent` takes a function returning a `Promise` of the component. `import('./admin/admin')` is a **dynamic import** — the browser only fetches that module the first time this function actually runs, which the router does on first navigation to `/admin`.",
    },
    {
      line: 5,
      text: '`loadChildren` is the same idea for a whole file of routes rather than one component. It resolves to a `Routes` array, not a component class — that is the entire difference between the two APIs.',
    },
    {
      line: 8,
      text: "The chunk's own routes file — a completely ordinary `Routes` array, imported by the dynamic `import()` above rather than at the top of `app.routes.ts`.",
    },
    {
      line: 10,
      text: "`:id` here is relative too: mounted under `path: 'shop'`, this becomes `/shop/:id`, and it lives inside the same chunk as `ShopHome` — one download for the whole feature.",
    },
  ];

  /**
   * Sample: a stray *value* import from the eager graph reaching into a
   * folder that is supposed to be lazy — the #1 real-world lazy-loading
   * failure. The route config is completely correct and it makes no
   * difference.
   */
  protected readonly staleImportSample = `// app.ts — statically imported, so everything it imports ships in main.js
import { ROUTE_ICONS } from './shared/route-icons';

// shared/route-icons.ts
import { AdminIcon } from './admin/admin-icon'; // a VALUE import, reaching into admin/
export const ROUTE_ICONS = { admin: AdminIcon, shop: ShopIcon };

// app.routes.ts — this still looks completely correct:
{ path: 'admin', loadComponent: () => import('./admin/admin').then((m) => m.Admin) }`;

  /** Line-by-line walkthrough of {@link staleImportSample}. */
  protected readonly staleImportNotes: CodeNote[] = [
    {
      line: 2,
      text: "`app.ts` is part of the **eager graph** — every file it imports, and every file those import, ships in the initial bundle. This one import looks completely innocent: it's just some icon constants.",
    },
    {
      line: 5,
      text: "Follow the chain: `route-icons.ts` imports `AdminIcon` as a real **value** — an actual class or object — from inside the `admin/` folder. That folder is supposed to be lazy. The bundler's static analysis doesn't know 'supposed to'; it only sees a value dependency, and it will happily pull the whole reachable module graph in with it.",
    },
    {
      line: 9,
      text: 'This line is completely correct and unchanged. `loadComponent` is right there, the syntax is right — and it makes no difference. The chunk boundary was already erased three imports upstream, before the router was ever involved.',
    },
  ];

  /**
   * Sample: `canMatch` on a lazy route — the only guard that runs early enough to
   * stop the chunk being fetched at all.
   */
  protected readonly canMatchSample = `{
  path: 'admin',
  canMatch: [() => inject(Auth).isAdmin()], // false → route skipped, chunk NOT fetched
  loadComponent: () => import('./admin/admin').then((m) => m.Admin),
}
// canActivate: [...] instead would match first, fetch the chunk, THEN ask.`;

  /** Line-by-line walkthrough of {@link canMatchSample}. */
  protected readonly canMatchNotes: CodeNote[] = [
    {
      line: 3,
      text: "`canMatch` is an array of functions run **before** the router treats this route object as a match for the URL at all. Return `false` (or a `UrlTree`) and it's as if this route were never in the config — the router can even fall through to another route with the same path.",
    },
    {
      line: 4,
      text: 'This line never runs if line 3 said no. That ordering is the entire trick: `canMatch` gates whether `import()` is ever called in the first place.',
    },
    {
      line: 6,
      text: "`canActivate` cannot do this — by the time it runs, the route has already matched, which for a lazy route means the chunk has already been requested and evaluated. Denying entry at that point doesn't undo the download.",
    },
  ];

  /**
   * Sample: route-level `providers`, which create a child injector scoped to that
   * route subtree.
   */
  protected readonly providersSample = `{
  path: 'shop',
  providers: [ShopApi], // one instance, shared across every /shop/** route
  loadChildren: () => import('./shop/shop.routes').then((m) => m.SHOP_ROUTES),
}
// ShopApi is destroyed only when you leave /shop entirely —
// never when you move between routes inside it.`;

  /** Line-by-line walkthrough of {@link providersSample}. */
  protected readonly providersNotes: CodeNote[] = [
    {
      line: 3,
      text: '`providers` creates a **child injector** scoped to this route and everything under it. `ShopApi` is created the first time something under `/shop` asks for it, and that one instance is shared by the whole subtree — every child route, every time you move between them.',
    },
    {
      line: 4,
      text: 'Works exactly the same with `loadComponent`. The provider does not know or care whether the route is lazy.',
    },
    {
      line: 6,
      text: 'Same rule as the shell component, one section up: a route-scoped injector lives for as long as its subtree is active, and is torn down only when the router leaves the whole subtree — never when it moves between siblings inside it.',
    },
  ];

  /**
   * Sample: a named (auxiliary) outlet — a second doorway on the same page,
   * opened and closed independently of the primary one.
   */
  protected readonly namedOutletSample = `// dashboard.html
<router-outlet />
<router-outlet name="sidebar" />

// routes
{ path: 'help', outlet: 'sidebar', component: HelpPanel }

// open the side outlet
router.navigate([{ outlets: { sidebar: ['help'] } }]);
// URL becomes /dashboard(sidebar:help)

// close it again
router.navigate([{ outlets: { sidebar: null } }]);`;

  /** Line-by-line walkthrough of {@link namedOutletSample}. */
  protected readonly namedOutletNotes: CodeNote[] = [
    {
      line: 3,
      text: "A second, **named** outlet. Every outlet without a name is implicitly `primary` — this one is `sidebar`, and whatever renders into it is completely independent of whatever's in the outlet above.",
    },
    {
      line: 6,
      text: "`outlet: 'sidebar'` targets this route at that named outlet specifically. Leave it off, and the route defaults to `primary` — a route meant for a side panel that forgets this line will try to replace your main content instead.",
    },
    {
      line: 9,
      text: "The array-of-objects form of `navigate()` is the router's multi-outlet syntax. Each key in `outlets` names an outlet; its value is the URL segments for that outlet alone. The primary outlet — whatever it's currently showing — is left untouched.",
    },
  ];

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

  /** Line-by-line walkthrough of {@link preloadSample}. */
  protected readonly preloadNotes: CodeNote[] = [
    {
      line: 1,
      text: '`withPreloading` runs once the initial bundle has finished and the app is interactive — it background-fetches every lazy chunk using whatever strategy you give it. `PreloadAllModules` means literally all of them.',
    },
    {
      line: 4,
      text: 'A `PreloadingStrategy` is just a class with one method. Write your own to be selective instead of preloading the entire app.',
    },
    {
      line: 6,
      text: "`load()` is a function the router hands you — call it to actually preload this route's chunk (it returns an `Observable`), or return `of(null)` to skip it. `route.data` is the router's general-purpose place to stash flags like this one.",
    },
  ];

  /** Sample: the standard fix for a post-deploy `ChunkLoadError`. */
  protected readonly chunkLoadErrorSample = `provideRouter(
  routes,
  withNavigationErrorHandler((e) => {
    if (isChunkLoadError(e)) location.reload();
  }),
);`;

  // ── Presentation data ──────────────────────────────────────────────────────

  /**
   * The `canMatch` / `canActivate` exchange, staged as dialogue — the
   * relationship learners reliably get backwards: that a guard *anywhere* on
   * the route stops the download, when only `canMatch` runs early enough to.
   */
  protected readonly guardTalk: BubbleTurn[] = [
    { who: 'Your click', says: 'Take me to `/admin`.' },
    {
      who: 'The router',
      says: 'Hold on — does `canMatch` on this route object say yes, before I even call it a match?',
    },
    { who: '`canMatch`', says: 'Not an admin. No — skip this route entirely.' },
    {
      who: 'The router',
      says: "Skipped. I never ran the route's `import()`, so nothing downloaded.",
    },
    {
      who: '`canActivate`, elsewhere',
      says: "I don't get a say that early. By the time I run, the route already matched — which means the chunk is already sitting in memory, evaluated, waiting on me.",
    },
  ];

  /**
   * The self-test on `canMatch` vs `canActivate` — the classic exam trap this
   * lesson exists to settle.
   */
  protected readonly guardQuizOptions: QuizOption[] = [
    {
      text: 'Nothing downloads — the router blocks the navigation before fetching anything.',
      why: "That's what `canMatch` does, not `canActivate`. `canActivate` only runs **after** the route has already matched — which for a lazy route means after `loadComponent`'s `import()` has already resolved.",
    },
    {
      text: 'The admin chunk downloads, evaluates, and only then does the guard deny entry and redirect.',
      correct: true,
      why: "Exactly — and it's wasted bandwidth every time. The route matched, so the router fetched and ran the chunk before ever asking whether this user is allowed to see it. Only `canMatch` can prevent the fetch.",
    },
    {
      text: 'The route is skipped and the router falls through to the next matching route.',
      why: 'That fallback belongs to `canMatch` too — returning `false` from `canMatch` makes the router treat the route as if it were never in the config, so it can try the next one. `canActivate` has already committed to this route by the time it runs; there is no falling through.',
    },
    {
      text: 'It throws, because the guard ran before the route was matched.',
      why: "Guards don't throw for a denial — they return `false` or a `UrlTree`, and the router redirects or cancels quietly. And this guard ran **after** matching, not before; that ordering claim is backwards for `canActivate`.",
    },
  ];

  /** The self-test on componentless routes. */
  protected readonly componentlessQuizOptions: QuizOption[] = [
    {
      text: 'Into a new `<router-outlet>` that Angular creates automatically for the componentless route.',
      why: 'There is no automatic outlet — an outlet only exists where a component template puts one. A route with no component has no template, so it cannot have added one.',
    },
    {
      text: "Into the parent route's outlet, one level up — this route added no outlet of its own.",
      correct: true,
      why: "Right. A componentless route is a pure grouping device: a guard, some `data`, a `providers` array, a shared path prefix. It contributes zero rendering — its children render exactly where they would if this route weren't there at all.",
    },
    {
      text: 'Nowhere — Angular throws a configuration error, because every route with `children` needs a `component`.',
      why: 'This is a completely valid, commonly-used configuration — grouping routes to share a guard or a service without a wrapper component is the main reason `children` works without `component` at all.',
    },
    {
      text: 'Into the root `<router-outlet>`, regardless of how deeply nested the route is.',
      why: "Only true if every ancestor up to the root is also componentless. Rendering always targets the nearest ancestor that does have a component and an outlet — 'the parent's outlet' means the nearest one, not necessarily the root.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Which guard actually stops the chunk from downloading for someone who should not see it?',
      a: '`canMatch`. It runs before the router treats the route as a match, so a `false` means the `import()` never happens. `canActivate` runs after matching — which for a lazy route is after the fetch — so it can deny entry but it cannot undo the download.',
    },
    {
      q: 'loadComponent vs loadChildren — what is actually different?',
      a: '`loadComponent` lazy-loads one standalone component. `loadChildren` lazy-loads a whole `Routes` array — a feature with several routes, sometimes its own nested outlet, all in one chunk. Reach for `loadChildren` the moment a feature needs more than one route.',
    },
    {
      q: "Why doesn't my parent route's ngOnInit run again when I switch tabs?",
      a: "Because it was never destroyed. The router only tears down and rebuilds the part of its internal tree that actually changed — moving between sibling children replaces the child, and the shared ancestor (`SettingsShell` here) is reused as-is. If you need something on every tab switch, that's `canActivateChild` or the child's own lifecycle hooks, not the parent's.",
    },
    {
      q: 'My redeploy broke lazy routes for anyone who still had the site open in a tab. What happened?',
      a: "Lazy chunk filenames are content-hashed, and the browser resolves `import('./admin/admin')` against the **old** build's filename map, which no longer exists on the server after a deploy. That is `ChunkLoadError`. Catch it with `withNavigationErrorHandler` and reload the page — a hard reload picks up the new build's map.",
    },
    {
      q: 'Do I need a named outlet very often?',
      a: 'Rarely — most apps get by with one primary outlet per shell. Reach for a named one when a piece of UI genuinely has its own URL-addressable state alongside the main content — a help panel, a chat drawer, a modal you want to be linkable — rather than for ordinary page-to-page navigation, which the primary outlet already handles.',
    },
  ];
}
