/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "performance" MC questions. Distractor text and answer index unchanged. */
export default {
  20: { answer: 1, options: [
    `<img src="/hero.jpg" fetchpriority="high"> — as a raw HTML attribute`,
    `<img ngSrc="/hero.jpg" width height priority> — the NgOptimizedImage recommended way`,
    `<img [src]="heroUrl" [fetchpriority]="'high'"> — a property binding`,
    `Angular has no native fetchpriority support; just use plain HTML for it`,
  ] },
  133: { answer: 1, options: [
    `It boosts the image's z-index so that it renders above other elements`,
    `It adds fetchpriority=high and a <link rel=preload> hint, improving the image LCP`,
    `It caches the image inside the service worker permanently for later use`,
    `It prevents lazy loading — the image loads during the initial page parse`,
  ] },
  136: { answer: 1, options: [
    `Add overflow: auto and height: 300px CSS onto the list's container div here`,
    `Use CdkVirtualScrollViewport with itemSize — it renders only the visible rows plus a small buffer`,
    `Set *ngFor with trackBy and a [limit]="20" to only ever show 20 items`,
    `Virtual scrolling is built right into @for — no extra package is needed`,
  ] },
  139: { answer: 1, options: [
    `Enable zone.js debug mode and it reveals the source of each CD trigger`,
    `Open the Angular DevTools Profiler — it shows CD cycles, their duration, and root causes`,
    `Add a console.log inside the ngDoCheck of every single component you have`,
    `Run Lighthouse in CI — it flags excessive change detection as an issue`,
  ] },
  159: { answer: 1, options: [
    `OnPush entirely skips ALL of the change detection for the component and children`,
    `OnPush re-checks only on an input reference change, a DOM event, async pipe emission, or markForCheck`,
    `OnPush uses Web Workers to run its change detection off the main thread`,
    `OnPush automatically applies itself to every child component recursively`,
  ] },
  222: { answer: 1, options: [
    `On every single change-detection cycle, regardless of the input value`,
    `Only when the items array reference changes; an in-place push mutates it without re-running the pipe`,
    `Never — a pure pipe runs its transform exactly one single time only, ever here`,
    `Whenever literally any signal anywhere in the component changes at all`,
  ] },
  283: { answer: 1, options: [
    `It re-renders the whole page on the client, discarding the server's HTML`,
    `It reuses the server-rendered DOM by attaching listeners, instead of destroying and recreating it`,
    `It disables JavaScript entirely on the client side once it has loaded here`,
    `It only works at all when you are using one special kind of pages router`,
  ] },
  362: { answer: 1, options: [
    `@for is simply not able to render component elements, only plain old HTML`,
    `track $index keys DOM elements by list position, not item identity; use track user.id instead`,
    `The track expression has to be a function here, not a plain property access`,
    `sortedUsers() is required to return a readonly array for the tracking work`,
  ] },
  364: { answer: 1, options: [
    `A polling loop that Angular quietly runs on every single animation frame`,
    `Explicit notifications only: signal reads, async pipe emissions, markForCheck, and DOM events`,
    `Every macrotask, in exactly the same way as zone.js but implemented natively`,
    `Only the router navigations and the HTTP responses ever cause it to run`,
  ] },
};
