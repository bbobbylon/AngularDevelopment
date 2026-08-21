// Standalone rewrites module for the 'routing' category letter-reference bug.
// Consumed by scripts/apply-option-rewrites.mjs (run separately by a human).
// Each entry: options/answer are verbatim copies from the source data; only
// `explanation` has been rewritten to stop referencing distractors by their
// original (pre-shuffle) letter position.

export default {
  109: {
    options: [
      "Add a second { path: } entry that carries a \"/\" prefix",
      "Use children: [] on the parent, whose template needs its own router-outlet",
      "Nest router-outlet elements in the template with no route config",
      "Call parentRoute.addChild(childRoute) at app runtime",
    ],
    answer: 1,
    explanation:
      "`{ path: \"admin\", component: AdminLayout, children: [{ path: \"users\", component: UsersPage }] }`. The parent `AdminLayout` template must contain `<router-outlet>` — that is where the child renders. Navigating to `/admin/users` renders `AdminLayout` in the root outlet and `UsersPage` in the nested outlet. A second top-level `{ path: }` entry prefixed with \"/\" just creates an absolute sibling route, not a nested child — that \"/\" prefix makes it an absolute path rather than true child nesting. Nesting `router-outlet` elements in the template with no route config configured wouldn't render anything — outlets need routes configured to know what component to activate. And there is no `parentRoute.addChild(childRoute)` runtime API — child routes must be declared in the route config, not attached programmatically.",
  },
  110: {
    options: [
      "router.navigate([\"/products/42?sort=price#reviews\"])",
      "router.navigate([\"/products\", 42], { queryParams, fragment })",
      "router.navigateByUrl(\"/products/42\", { queryParams: { sort } })",
      "router.go(\"/products/42?sort=price#reviews\") does it",
    ],
    answer: 1,
    explanation:
      "`router.navigate([\"/products\", 42], { queryParams: { sort: \"price\" }, fragment: \"reviews\" })` is the clean, structured way. Passing `router.navigate([\"/products/42?sort=price#reviews\"])` is wrong — cramming the query string and fragment into the path segment itself isn't valid `navigate()` syntax; those belong in the extras object. `router.navigateByUrl(\"/products/42\", { queryParams: { sort } })` is wrong too — `navigateByUrl` takes a complete URL string as its first argument, and query params can't be layered on top via an extras object the way they can with `navigate()`. There's also no `router.go()` method on Angular's `Router` — that's not part of its API.",
  },
  111: {
    options: [
      "snapshot works only on first navigation; the observable on all",
      "snapshot reads current params once; paramMap emits on changes",
      "They are identical — use snapshot for production performance",
      "The paramMap observable exists only in Angular 16+ builds",
    ],
    answer: 1,
    explanation:
      "When Angular reuses a component instance for a param change (e.g., navigating between /products/1 and /products/2), `snapshot` is stale — it reflects the params from the initial activation. `paramMap` Observable emits on every change. With `withComponentInputBinding()` you can skip `ActivatedRoute` entirely and receive params as signal inputs. Saying snapshot works only on the initial navigation while the observable works on all navigations is close but imprecise — snapshot isn't limited to the initial navigation specifically, it's just a one-time read that goes stale whenever the same component instance is reused for a param change. Claiming they're identical and recommending snapshot for production performance is wrong — they behave differently precisely in the reused-component case described above, and using snapshot there produces stale data, not a performance win. And the `paramMap` observable isn't an Angular 16+ addition — it has existed since Angular 4.",
  },
  112: {
    options: [
      "It matches all routes and serves as the default home page",
      "A wildcard matching any unmatched URL — must be placed LAST",
      "It matches all routes that literally start with two asterisks",
      "It enables regex-based route matching within the config",
    ],
    answer: 1,
    explanation:
      "`**` is the catch-all wildcard — it matches any URL. Because Angular's router tries routes in order, placing `**` last ensures all specific routes are checked first. If placed first, it would capture every navigation. Treating it as the default home page is wrong — the empty path `path: \"\"` is what serves as the home/default route, not the wildcard. Thinking it only matches URLs that literally contain two asterisk characters is wrong — `**` is a special route-matching token, not a literal string to match against the URL. And it doesn't enable regex-based matching — Angular's route matching is segment-based, not regex; any regex-style matching would require a custom `UrlMatcher` function instead.",
  },
  113: {
    options: [
      "Override ngOnInit and then call router.getCurrentNavigation()",
      "Subscribe to router.events, filtering by the event classes",
      "Use the window.history API to listen for popstate events",
      "Add a RouterInterceptor to the app's providers array",
    ],
    answer: 1,
    explanation:
      "`this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(...)` is the canonical pattern. `Router.events` is a hot Observable that emits `NavigationStart`, `RouteConfigLoadStart`, `RoutesRecognized`, `NavigationEnd`, `NavigationCancel`, `NavigationError`, etc. Use it for page view tracking, loading indicators, or scroll restoration. Calling `router.getCurrentNavigation()` from `ngOnInit` only gives you a snapshot of the navigation in progress at that moment — it's not a stream you can subscribe to for ongoing start/end/error events. Listening to `window.history` popstate events is too low-level and misses Angular-specific lifecycle events like route resolution, guard rejection, or lazy-chunk load errors — you'd only see browser-level back/forward transitions. And there's no `RouterInterceptor` provider in Angular's router API — that's not a real construct.",
  },
  114: {
    options: [
      "It adds Angular's generated attribute selector for encapsulation",
      "It adds the \"active\" CSS class when the URL matches the route",
      "It disables the link while active to prevent self-navigation",
      "It applies only when routerLink points to an exact URL match",
    ],
    answer: 1,
    explanation:
      "`routerLinkActive` dynamically adds/removes a CSS class based on whether the current route matches. By default it matches prefix — `/products/123` also activates a link to `/products`. Use `[routerLinkActiveOptions]=\"{ exact: true }\"` for exact matching. It has nothing to do with Angular's generated attribute selectors for style encapsulation — that's a separate, unrelated mechanism (View Encapsulation). It also doesn't disable the link while active to block self-navigation — the link stays fully clickable regardless of its active state; `routerLinkActive` only toggles a CSS class. And it isn't limited to exact URL matches — prefix matching is the default behavior, which is exactly why `exact: true` exists as an opt-in override.",
  },
  115: {
    options: [
      "canActivate runs first, and only then does canMatch run afterward",
      "canMatch runs first (selection); canActivate then (activation)",
      "They both run in parallel during the same phase",
      "The order depends on where they appear in the route config",
    ],
    answer: 1,
    explanation:
      "Angular's navigation pipeline is: (1) Route matching — `canMatch` guards run here to decide which route definition to use. (2) Route activation — `canActivate`, `canActivateChild`, and resolvers run here. `canMatch` returning false means this route is not considered at all and the router tries the next definition for the same URL. `canActivate` returning false blocks access but the route WAS matched. Claiming `canActivate` runs first and `canMatch` only afterward has the order backwards — route matching (where `canMatch` runs) always happens before route activation (where `canActivate` runs), never the reverse. Saying they run in parallel during the same phase is wrong — they belong to two distinct, sequential phases of the navigation pipeline. And the order isn't determined by where the guards appear in the route config — it's fixed by the pipeline architecture itself, not configuration order.",
  },
  116: {
    options: [
      "Use a query parameter inside the URL, such as /page?title=Home",
      "Use the route's data property, read via snapshot.data[\"key\"]",
      "Add a resolve function that returns a static object value",
      "Pass it as a route path parameter, like /page/Home",
    ],
    answer: 1,
    explanation:
      "The `data` property holds arbitrary static values attached to a route. Unlike `resolve`, no async loading occurs — the data is available immediately in `route.snapshot.data`. Use it for page titles, breadcrumb labels, or permission keys. Using a query parameter like `/page?title=Home` works but is the wrong tool here — it's visible in the URL and requires parsing it back out at runtime, when the value never actually varies. Writing a resolver that just returns a static object technically works but adds unnecessary async machinery — resolvers exist for data that needs fetching, not values known at config time. And encoding it as a path parameter like `/page/Home` is wrong too — that bakes the data into the URL structure itself, which changes what the route matches rather than just attaching metadata to it.",
  },
  117: {
    options: [
      "It creates a sidebar CSS layout beside the main outlet",
      "A named auxiliary outlet targeted via { outlets: {...} }",
      "It replaces the default router-outlet with a custom one",
      "Named outlets are deprecated — use multiple primary ones",
    ],
    answer: 1,
    explanation:
      "auxiliary (named) outlets allow multiple independent route sections on the same page. Navigate to them with `router.navigate([{ outlets: { sidebar: [\"help\"] } }])` or `[routerLink]=\"[{ outlets: { sidebar: ['help'] } }]\"`. They appear in the URL as `(sidebar:help)`. Use them for side panels, notifications, or modals driven by the URL. It isn't a CSS layout mechanism that positions a sidebar next to the main outlet — outlets are purely about which routed component renders where, not visual layout. It also doesn't replace the default (primary) outlet with a custom implementation — the primary outlet keeps working exactly as before; a named outlet is an additional, independent outlet alongside it. And named outlets aren't deprecated, nor is having multiple primary outlets even a real concept — a page can only have one primary (unnamed) outlet, and named auxiliary outlets are the fully supported way to add more independently-routed regions.",
  },
  118: {
    options: [
      "Set PreloadAllModules and then use guards to skip unwanted routes",
      "Implement PreloadingStrategy; call load() only when data says so",
      "Add lazy: \"eager\" to the routes you want preloaded",
      "Custom preloading is unsupported — only the two built-ins exist",
    ],
    answer: 1,
    explanation:
      "implement `PreloadingStrategy.preload(route, load): Observable<unknown>`. Return `load()` to preload, `of(null)` to skip. Provide it: `provideRouter(routes, withPreloading(CustomStrategy))`. This lets you be selective — preload priority routes after the critical path loads. Using `PreloadAllModules` and then relying on guards to skip unwanted routes doesn't work — guards run during navigation/activation, not during preloading, so they have no effect on which chunks get preloaded ahead of time. There's no `lazy: \"eager\"` route property — that's not part of the router's config surface. And custom preloading isn't unsupported — `PreloadAllModules` and `NoPreloading` are just the two built-in strategies; implementing your own `PreloadingStrategy` class, as described above, is an officially supported extension point.",
  },
  119: {
    options: [
      "Navigates to a sibling — \"../\" goes up one level, then in",
      "Navigates to the root first, then finds the \"sibling\" route",
      "Navigates backwards in the browser history by one step",
      "../ is not valid inside Angular navigation command arrays",
    ],
    answer: 0,
    explanation:
      "relative navigation with `relativeTo: this.route` treats the URL like a file path. `[\"../sibling\"]` navigates up one route level (out of the current route) then into \"sibling\". Without `relativeTo`, the path is interpreted as absolute. This is essential in feature modules where routes should not hardcode absolute paths. It doesn't navigate to the root first and then search for a \"sibling\" route anywhere in the tree — the \"../\" segment moves up exactly one level relative to the current route, it doesn't reset to root. It also isn't the same as stepping back through browser history — for that you'd use `location.back()`, which replays the previous history entry rather than computing a relative route path. And \"../\" is fully valid inside Angular's navigation command arrays — relative path segments are a supported, documented part of the `navigate()` API when paired with `relativeTo`.",
  },
  120: {
    options: [
      "It navigates and renders the route's component but does not update the browser's URL bar",
      "It skips the canDeactivate guard for the current component",
      "It replaces history instead of pushing (replaceState)",
      "It makes navigation skip all guards and resolvers entirely",
    ],
    answer: 0,
    explanation:
      "`router.navigate([\"/internal\"], { skipLocationChange: true })` navigates to a route and renders its component without updating the URL in the address bar. The browser back button goes to the previous URL. Use it for internal redirects, modal-like navigation where the URL should not change, or wizard steps you do not want bookmarked. It doesn't skip the `canDeactivate` guard for the current component — guard execution is unaffected; only whether the URL bar updates changes. Replacing history instead of pushing a new entry (`replaceState` behavior) is a different option entirely — that's what `replaceUrl: true` does, not `skipLocationChange`. And it doesn't cause navigation to skip all guards and resolvers — those still run normally; `skipLocationChange` only affects the browser's address bar, not the guard/resolve pipeline.",
  },
  156: {
    options: [
      "{ path: \"admin\", component: () => import(\"./admin\") }",
      "{ path: \"admin\", loadComponent: () => import(...).then(m => m.AdminComponent) }",
      "{ path: \"admin\", lazy: true, component: AdminComponent } loads it",
      "{ path: \"admin\", defer: () => AdminComponent } loads it",
    ],
    answer: 1,
    explanation:
      "`loadComponent` accepts a function returning a dynamic import Promise. Angular creates a separate bundle for `AdminComponent` and only downloads it when the user navigates to `/admin`. `loadChildren` is used for lazy route modules. Putting a function directly on the `component` property, like `component: () => import(\"./admin\")`, is wrong — `component` expects a component class reference, not a function; it has no special handling for dynamic imports, that's exactly what the dedicated `loadComponent` property is for. Adding `lazy: true` alongside `component: AdminComponent` is wrong too — there is no `lazy` route property in Angular's router API, and setting `component` directly still causes it to be bundled eagerly regardless of any extra flag. A `defer: () => AdminComponent` property is also not part of the router config — Angular's `@defer` block is a template-level lazy-loading construct for view blocks, not a route-config property, so this syntax doesn't correspond to any real API.",
  },
  164: {
    options: [
      "ActivatedRoute is the router itself — use it to navigate",
      "The current route; read snapshot.paramMap or subscribe to it",
      "ActivatedRoute is only ever available in root, not lazy routes",
      "ActivatedRoute is deprecated — use ActivatedRouteSnapshot",
    ],
    answer: 1,
    explanation:
      "`inject(ActivatedRoute)` (or constructor injection) gives you the active route. `route.snapshot.paramMap.get(\"id\")` reads the current value once. `route.paramMap` is an Observable that emits whenever route params change, which happens when navigating between routes that share the same component instance. With `withComponentInputBinding()`, params automatically map to signal inputs. It isn't the router itself, and it isn't used to trigger navigation — that's the `Router` service's job; `ActivatedRoute` only describes the currently activated route and its data. It's also not limited to the root route — every activated route, including those inside lazy-loaded feature modules or lazy-loaded standalone routes, gets its own injectable `ActivatedRoute` instance scoped to that route. And it isn't deprecated in favor of `ActivatedRouteSnapshot` — the snapshot is just a static, point-in-time slice obtained via `route.snapshot`; the injectable `ActivatedRoute` service itself remains the current, fully-supported API and is what you inject to get that snapshot in the first place.",
  },
  173: {
    options: [
      "It stops a route from activating unless a condition is met",
      "It runs when navigating AWAY — for unsaved-changes prompts",
      "It deactivates a route, making it inaccessible without reload",
      "It clears route parameters when leaving the component",
    ],
    answer: 1,
    explanation:
      "`CanDeactivateFn<T>` receives the component instance and allows or blocks leaving. The component typically implements a `canDeactivate()` method or has a `isDirty` signal that the guard checks. Return `true` to allow navigation, `false` to block, or a `UrlTree` to redirect. This is the correct hook for \"unsaved changes\" warnings. Stopping a route from activating unless a condition is met describes `CanActivateFn`, not `CanDeactivateFn` — that guard runs on the way in, before a route activates, not on the way out. It also doesn't permanently deactivate a route or make it inaccessible without a reload — a rejected `canDeactivate` result simply cancels that one navigation attempt; the route remains fully reachable on a later attempt once the guard's condition is satisfied. And it has nothing to do with clearing route parameters — parameter values aren't touched by this guard at all; it only decides whether the pending navigation away is allowed to proceed.",
  },
  181: {
    options: [
      "A resolver is a guard blocking navigation by user permission",
      "It pre-fetches data BEFORE a route activates, no loading flash",
      "A resolver transforms route params before the component gets them",
      "Resolvers are deprecated — use resource() in the component now",
    ],
    answer: 1,
    explanation:
      "`ResolveFn<T>` returns a value or Observable — Angular waits for it to complete before activating the route. Access the result in the component: `route.snapshot.data[\"product\"]` or via signal input with `withComponentInputBinding()`. Use resolvers when you want zero loading state UI. Skip them when you prefer to show a skeleton/spinner — load in the component instead. Blocking navigation based on user permission describes a guard like `canActivate`, not a resolver — resolvers don't grant or deny access to a route, they only fetch data once access has already been decided. A resolver also doesn't transform route params before the component receives them — params pass through unchanged; a resolver instead produces separate, additional data (like a fetched entity) that gets attached alongside the route under its own key in `route.data`. And resolvers aren't deprecated in favor of the `resource()` API — `resource()` is a component-level reactive data-fetching primitive, while resolvers remain the preferred pattern specifically for pre-fetching data before route activation so there's no loading flash.",
  },
  197: {
    options: [
      "It makes the router do exact URL matching for its decisions",
      "It marks routerLinkActive only on an EXACT URL match, not prefix",
      "It disables partial matching for the route parameters",
      "exact: true is the default — set exact: false for prefix matching",
    ],
    answer: 1,
    explanation:
      "By default, `routerLinkActive` uses prefix matching — a link to `/` is considered active on any URL. `[routerLinkActiveOptions]=\"{ exact: true }\"` switches to exact matching, so the home link is only highlighted on the root `/`. This is critical for navigation menus where the home/dashboard link should not always appear active. It doesn't change how the router itself matches and resolves routes for navigation purposes — this option only affects which CSS class gets applied for visual \"active\" styling, it has zero effect on actual route matching/activation decisions. It also has nothing to do with route parameters — no partial-matching behavior for params is disabled or altered; the option only governs URL-segment comparison for the active-link class. And the default behavior is prefix matching, not exact matching — `exact: true` is an opt-in override you set explicitly; there's no need for a separate `exact: false` flag since prefix matching is already what happens without specifying the option at all.",
  },
};
