/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "routing" MC questions. Distractor text and answer index unchanged. */
export default {
  15: { answer: 1, options: [
    `null, to indicate that no decision has yet been made`,
    `true to allow, false to block, or a UrlTree (from createUrlTree) to redirect`,
    `void, to indicate that the guard has finished running`,
    `An Observable that emits either true or false eventually`,
  ] },
  38: { answer: 1, options: [
    `Both simply block navigation to the current route with no fallback`,
    `CanMatch skips the route and tries the next match; CanActivate just blocks it`,
    `CanMatchFn is only ever checked for lazy-loaded routes`,
    `CanActivateFn always runs before CanMatchFn is evaluated`,
  ] },
  50: { answer: 1, options: [
    `CanActivateFn — return true for admins, false for users (blocks but does not redirect)`,
    `CanMatchFn — returning false skips the route and tries the next config, enabling role-based routing`,
    `CanLoadFn — prevents chunk loading for non-admins`,
    `Route resolvers — pre-fetch user role and pass it to the component`,
  ] },
  109: { answer: 1, options: [
    `Add a second { path: } entry that carries a "/" prefix`,
    `Use children: [] on the parent, whose template needs its own router-outlet`,
    `Nest router-outlet elements in the template with no route config`,
    `Call parentRoute.addChild(childRoute) at app runtime`,
  ] },
  120: { answer: 0, options: [
    `It navigates and renders the route's component but does not update the browser's URL bar`,
    `It skips the canDeactivate guard for the current component`,
    `It replaces history instead of pushing (replaceState)`,
    `It makes navigation skip all guards and resolvers entirely`,
  ] },
  156: { answer: 1, options: [
    `{ path: "admin", component: () => import("./admin") }`,
    `{ path: "admin", loadComponent: () => import(...).then(m => m.AdminComponent) }`,
    `{ path: "admin", lazy: true, component: AdminComponent } loads it`,
    `{ path: "admin", defer: () => AdminComponent } loads it`,
  ] },
  213: { answer: 1, options: [
    `It automatically lazy-loads every routed component for you`,
    `It binds route params, query params and route data to component inputs by matching name`,
    `It validates that route params match the input types at runtime`,
    `It enables two-way binding between the URL and component state`,
  ] },
  271: { answer: 1, options: [
    `It preloads every one of the lazy routes on application startup`,
    `It wraps navigations in the browser's View Transitions API to animate between views`,
    `It enables server-side rendering for all of the routes`,
    `It adds a loading spinner shown between every single route change`,
  ] },
  338: { answer: 1, options: [
    `Query params always survive a navigation automatically`,
    `Use queryParamsHandling: "preserve" to keep params, or "merge" to combine them with new ones`,
    `Store the params in localStorage and restore them manually`,
    `Use a resolver to re-fetch the params after navigating`,
  ] },
};
