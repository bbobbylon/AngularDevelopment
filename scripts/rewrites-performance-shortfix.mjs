/** Fix the 11 strictly-shortest answers in "performance" left over after the
 * longest-push rebalance already met this category's ~25% quota. Each answer
 * is a length-verified mid-pack lengthening (checked against the live
 * distractor lengths so none of these accidentally become the new longest
 * and overshoot the quota). */
export default {
  45: { answer: 1, options: [
    `Disable optimization in angular.json to cut the minification overhead`,
    `Route-level code splitting done with loadComponent/loadChildren per route`,
    `Remove all of the TypeScript type annotations to shrink the bundle down`,
    `Apply OnPush change detection to every single one of your components here`,
  ] },
  137: { answer: 1, options: [
    `Run ng build --verbose and then read through all of the console output`,
    `Run ng build --stats-json, then open in webpack-bundle-analyzer tool`,
    `Just check the sizes of the files in the dist/ folder after a build`,
    `Use the DevTools Network tab and multiply it by the compression ratio`,
  ] },
  138: { answer: 1, options: [
    `It checks whether the app is running in a Chromium-based browser or not`,
    `It guards browser-only APIs from running during SSR, where they'd crash`,
    `It detects whether or not the app is currently installed as a PWA here`,
    `It is required before you are allowed to use any Angular DI service here`,
  ] },
  285: { answer: 1, options: [
    `The window.innerWidth property just always returns a plain 0 in this case`,
    `No window exists in Node during SSR, so reading it at construction throws`,
    `innerWidth must be invoked as a function call: window.innerWidth() here`,
    `The template interpolation syntax used in this component is just invalid`,
  ] },
  286: { answer: 1, options: [
    `It automatically compresses all of the images on the page during the SSR`,
    `It serializes server-fetched data into the HTML, so the client reuses it`,
    `It caches the application's routes out on a CDN for much faster delivery`,
    `It encrypts every one of the API responses while they are in transit here`,
  ] },
  361: { answer: 1, options: [
    `@defer (on immediate) — just load absolutely everything up front, ready`,
    `@defer (on viewport; prefetch on idle) with a sized @placeholder here slot`,
    `@defer (when isVisible()) polling a scroll listener that you write by hand`,
    `Wrap the whole thing in @if (false) and flip the flag in ngAfterViewInit`,
  ] },
  365: { answer: 1, options: [
    `It is skipped entirely during server rendering and stays blank until clicked`,
    `Server renders the real HTML that stays inert; JS hydrates on the interaction`,
    `It hydrates right away, immediately — hydrate triggers only affect dev builds`,
    `The section renders twice: on the server, then again from scratch on client`,
  ] },
  366: { answer: 1, options: [
    `Method calls placed in templates are actually compile errors in strict mode`,
    `It re-runs on every CD cycle; now replace it with a memoized computed() value`,
    `Methods run outside of the zone, so the total is never going to update at all`,
    `It is completely fine — Angular caches template method call results for you`,
  ] },
  367: { answer: 1, options: [
    `Throttle the listener down to one event per second and accept choppy drawing`,
    `Register it via ngZone.runOutsideAngular so no CD gets scheduled per event`,
    `Set the whole component to ChangeDetectionStrategy.OnPush to stop the CD here`,
    `Move the whole canvas into a Web Worker; DOM listeners cannot be optimized`,
  ] },
  368: { answer: 1, options: [
    `signal(new Date()) is allocating far too much memory on every single tick`,
    `The interval subscription is never torn down; so use takeUntilDestroyed()`,
    `Signals just must not ever be written from inside a subscribe() callback`,
    `interval() drifts over time and so it must be replaced with a setInterval`,
  ] },
  43: { answer: 1, options: [
    `Loads AND renders the deferred block the moment the browser goes idle`,
    `Downloads the lazy chunk during idle, so later rendering is instant too`,
    `Disables the whole deferred block whenever on a slow network connection`,
    `Inlines the deferred chunk straight back into the main app bundle again`,
  ] },
};
