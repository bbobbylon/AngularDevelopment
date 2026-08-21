export default {
  133: {
    options: [
      "It boosts the image's z-index so that it renders above other elements",
      "It adds fetchpriority=high and a <link rel=preload> hint, improving the image LCP",
      "It caches the image inside the service worker permanently for later use",
      "It prevents lazy loading — the image loads during the initial page parse"
    ],
    answer: 1,
    explanation: `marking an image as \`priority\` with \`NgOptimizedImage\` (\`<img ngSrc="hero.jpg" priority>\`) injects a \`<link rel="preload">\` tag and sets \`fetchpriority="high"\` on the \`<img>\`. This instructs the browser to download the image at the highest priority, critical for LCP images. Angular also warns if a large above-the-fold image is missing the \`priority\` attribute. The z-index claim is wrong — priority has no effect on stacking order. The service-worker caching claim is also wrong. Preventing lazy loading is close — priority does disable lazy loading for that image — but it's not the full picture; the preload hint plus fetchpriority=high together are what drive the LCP improvement.`
  },
  134: {
    options: [
      "It compresses the chart component's own JS bundle at runtime on the fly",
      "The chart is excluded from the initial bundle; it loads on idle instead",
      "The chart renders inside a Web Worker, keeping the main thread free here",
      "It caches all of the chart's data inside IndexedDB for later offline use"
    ],
    answer: 1,
    explanation: `\`@defer\` creates code-split points at build time. The chart library (potentially hundreds of KB) is not included in the initial bundle and is not parsed or executed until the trigger fires (here: browser idle time, via \`requestIdleCallback\`). This directly improves TTI because the main thread is free from parsing a large chart library during startup. The runtime-compression claim is wrong — \`@defer\` splits code at build time, it doesn't compress anything on the fly. The Web Worker claim is wrong — the deferred content still renders on the main thread, it's just downloaded later. The IndexedDB claim is wrong — \`@defer\` only affects when the component's JS chunk loads, it has nothing to do with caching data.`
  },
  135: {
    options: [
      "It is a CSS selector that tracks exactly which items should be animated",
      "track gives each item a stable identity so Angular reuses the DOM nodes",
      "It limits the rendering so that only the tracked items are ever drawn",
      "track is only ever needed with animations; @for is efficient without it"
    ],
    answer: 1,
    explanation: `Without \`track\`, Angular has no way to match old DOM nodes to new data items when the list changes — it destroys and recreates every element. With \`track item.id\`, Angular identifies which items are new, moved, or removed and surgically updates only those parts. For a 1000-item list where 1 item is added, \`track\` means one insertion instead of 1000 re-renders. The CSS-selector/animation claim is wrong — \`track\` is a TypeScript expression evaluated per item, not a selector, and it isn't tied to animations. The claim that it limits which items render is wrong — every item in the list still renders; \`track\` only affects whether existing DOM nodes are reused or recreated. The claim that it's only needed for animations is wrong — it matters for list re-render performance any time the underlying array changes, animated or not.`
  },
  136: {
    options: [
      "Add overflow: auto and height: 300px CSS onto the list's container div here",
      "Use CdkVirtualScrollViewport with itemSize — it renders only the visible rows plus a small buffer",
      "Set *ngFor with trackBy and a [limit]=\"20\" to only ever show 20 items",
      "Virtual scrolling is built right into @for — no extra package is needed"
    ],
    answer: 1,
    explanation: `\`<cdk-virtual-scroll-viewport itemSize="50" style="height: 400px"><div *cdkVirtualFor="let item of items">...</div></cdk-virtual-scroll-viewport>\`. The CDK only renders the visible items plus a small buffer, keeping the DOM to ~20 nodes regardless of list size. Plain CSS overflow scrolling still renders every DOM node — the browser just clips what's visible, so it doesn't reduce DOM size. The \`*ngFor\` with a \`[limit]\` claim is wrong — \`*ngFor\` has no \`[limit]\` input. Virtual scrolling being built into \`@for\` is also wrong — it still requires the separate CDK package.`
  },
  137: {
    options: [
      "Run ng build --verbose and then read through all of the console output",
      "Run ng build --stats-json, then open in webpack-bundle-analyzer tool",
      "Just check the sizes of the files in the dist/ folder after a build",
      "Use the DevTools Network tab and multiply it by the compression ratio"
    ],
    answer: 1,
    explanation: `\`webpack-bundle-analyzer\` (or \`source-map-explorer\`) parses the stats file and shows an interactive treemap where larger rectangles = larger bundle contributions. You can see which imports are duplicated, which libraries are unexpectedly large, and which tree-shaking opportunities exist. Reading raw \`--verbose\` console output gives chunk info but not a per-module breakdown. Just checking \`dist/\` file sizes gives total sizes but no granular, per-package insight. Estimating from the Network tab and a compression ratio is indirect and inaccurate.`
  },
  138: {
    options: [
      "It checks whether the app is running in a Chromium-based browser or not",
      "It guards browser-only APIs from running during SSR, where they'd crash",
      "It detects whether or not the app is currently installed as a PWA here",
      "It is required before you are allowed to use any Angular DI service here"
    ],
    answer: 1,
    explanation: `During SSR, Angular runs in Node.js where browser globals like \`window\`, \`localStorage\`, and \`document\` do not exist. \`isPlatformBrowser(platformId)\` (where \`platformId = inject(PLATFORM_ID)\`) returns \`true\` only in the browser. Wrap browser-only code: \`if (isPlatformBrowser(this.platformId)) { localStorage.setItem(...) }\`. The Chromium-detection claim is wrong — it distinguishes browser vs server platform, not browser vendor. The PWA-install-detection claim is wrong — it has nothing to do with install state, only execution platform. The claim that it's required before using DI is wrong — dependency injection works identically on both platforms; this check is unrelated to whether you can inject services.`
  },
  139: {
    options: [
      "Enable zone.js debug mode and it reveals the source of each CD trigger",
      "Open the Angular DevTools Profiler — it shows CD cycles, their duration, and root causes",
      "Add a console.log inside the ngDoCheck of every single component you have",
      "Run Lighthouse in CI — it flags excessive change detection as an issue"
    ],
    answer: 1,
    explanation: `Angular DevTools (Chrome extension) Profiler records change detection cycles frame by frame, showing which components are re-rendered and why. Common causes in Zone.js apps: \`setInterval\` not cleaned up (fires CD every tick), \`requestAnimationFrame\` callbacks, WebSocket messages, or a third-party library that triggers browser events. In signals-based apps, an \`effect()\` that sets a signal which triggers another effect is a common cause. Enabling zone.js debug mode gives stack traces of what scheduled a task, but not a visual timeline of CD cycles and their durations — a partial workaround at best. Sprinkling \`console.log\` inside every component's \`ngDoCheck\` is manual, doesn't scale, and gives no duration/timing data. Running Lighthouse in CI audits page-load metrics like LCP and TBT — it doesn't instrument or flag change-detection cycles specifically.`
  },
  140: {
    options: [
      "It defers the block until isLoaded finally emits true via an Observable",
      "It renders the block once isLoaded() becomes true, re-checked each cycle",
      "It downloads the deferred chunk when isLoaded is invoked as a function",
      "when() requires a Promise — use on() for any synchronous conditions here"
    ],
    answer: 1,
    explanation: `\`@defer (when condition)\` accepts any boolean expression. Angular re-evaluates it each change detection cycle. Once it becomes \`true\`, the deferred block's JavaScript chunk is downloaded and rendered. If the condition starts as \`true\`, the block renders immediately after the chunk loads. The parentheses call \`isLoaded()\` as a signal — this is a common pattern. The Observable-emission claim is wrong — \`when\` takes a boolean, not an Observable. The claim that the chunk downloads simply because \`isLoaded\` is invoked as a function is wrong — the function is re-evaluated every cycle regardless, but the chunk only downloads once the expression evaluates to \`true\`. The claim that \`when()\` requires a Promise and synchronous conditions need \`on()\` is backwards — \`when()\` is exactly the mechanism for synchronous boolean conditions.`
  },
  141: {
    options: [
      "They are identical — NgOptimizedImage just adds the loading=lazy attribute",
      "Both lazy-load, but NgOptimizedImage adds srcset, LCP hints, and warnings",
      "loading=lazy uses IntersectionObserver; NgOptimizedImage a service worker",
      "NgOptimizedImage is only for background images; loading=lazy for inline img"
    ],
    answer: 1,
    explanation: `native \`loading="lazy"\` is a single browser hint. \`NgOptimizedImage\` wraps it plus: automatic \`srcset\`/\`sizes\` generation for responsive images, \`width\`/\`height\` requirement (preventing CLS), \`fill\` mode for fluid images, priority/preload management, image CDN loader support, and dev-time warnings. Use NgOptimizedImage in Angular projects for the full set of optimisations. The claim that they're identical, with \`NgOptimizedImage\` just adding \`loading=lazy\`, is wrong — it does considerably more, as above. The claim that \`NgOptimizedImage\` uses a service worker is wrong — it works through native image attributes, not a service worker. The claim that \`NgOptimizedImage\` is only for background images is wrong — it's a directive for \`<img>\` elements via \`ngSrc\`, not CSS \`background-image\`.`
  },
  142: {
    options: [
      "When the component is inside an *ngIf, to prevent any double detection",
      "For rarely-changing external data — detach, then detectChanges() yourself",
      "When using OnPush — a detach() call is required for OnPush to work at all",
      "After every async operation you run, in order to prevent any memory leaks"
    ],
    answer: 1,
    explanation: `\`cdr.detach()\` disconnects a component from the change detection tree entirely. Angular skips it completely during every global CD cycle. You call \`cdr.detectChanges()\` only when you know data changed — e.g., in a WebSocket handler or a \`requestAnimationFrame\` callback. This is the most aggressive CD optimisation, useful for high-frequency data visualisations (stock tickers, live charts). The claim that it's needed inside an \`*ngIf\` to prevent double detection is wrong — \`*ngIf\` doesn't cause double detection that \`detach()\` would need to solve. The claim that OnPush requires \`detach()\` to work is wrong — OnPush still participates in CD via its own set of triggers; \`detach()\` is a separate, more aggressive opt-out. The claim that it should follow every async operation to prevent memory leaks is wrong — memory leaks from async work are addressed by unsubscribing (e.g., \`takeUntil\`), not by detaching from change detection.`
  },
  159: {
    options: [
      "OnPush entirely skips ALL of the change detection for the component and children",
      "OnPush re-checks only on an input reference change, a DOM event, async pipe emission, or markForCheck",
      "OnPush uses Web Workers to run its change detection off the main thread",
      "OnPush automatically applies itself to every child component recursively"
    ],
    answer: 1,
    explanation: `By default Angular re-checks every component on every change detection cycle triggered anywhere in the app. OnPush breaks this by only marking a component dirty — and checking it — under specific conditions: a new @Input reference, a component event, async pipe new value, or a manual \`markForCheck()\`. With signals, signal reads automatically mark the component. The claim that OnPush skips ALL change detection for the component and its children is wrong — it still checks under those specific conditions. The Web Worker claim is wrong — OnPush is a synchronous, main-thread strategy about when CD runs, not where. The claim that it applies to every child component recursively is wrong — it must be set per-component.`
  },
  165: {
    options: [
      "prefetch is just a CSS optimization hint — entirely unrelated to @defer",
      "It prefetches the bundle on idle but only renders the block on interaction",
      "prefetch forces the deferred block to render right after it is prefetched",
      "prefetch is exactly equivalent to a <link rel=\"prefetch\"> in the HTML head"
    ],
    answer: 1,
    explanation: `Angular's \`@defer\` supports combining a render trigger with a separate prefetch trigger. \`@defer (on viewport; prefetch on idle)\` means: start downloading the JS bundle when the browser is idle, but only render the content when the element enters the viewport. This gives near-instant render on interaction because the bundle is already cached. The claim that \`prefetch\` is a CSS optimization hint unrelated to \`@defer\` is wrong — it's an \`@defer\` block modifier controlling bundle download timing. The claim that \`prefetch\` forces the block to render right after prefetching is wrong — prefetch only downloads the bundle, it doesn't trigger rendering. A manual \`<link rel="prefetch">\` in the head is similar in concept but is a manual approach without Angular's automatic bundle splitting.`
  },
  180: {
    options: [
      "OnPush does not support accessing service properties directly in templates",
      "push() mutates the same array reference, so OnPush sees no change and skips",
      "The template should really use the async pipe to observe service.items here",
      "OnPush components are not allowed to inject services in their constructor"
    ],
    answer: 1,
    explanation: `\`OnPush\` only re-checks a component when an @Input reference changes, an Observable emits (via async pipe), a signal changes, or \`markForCheck()\` is called. \`Array.push()\` mutates the SAME array reference — the reference does not change, so OnPush skips the check entirely. Fix: either use \`this.items = [...this.items, item]\` (new reference), or use a \`signal<Item[]>([])\` in the service which OnPush automatically tracks. The claim that OnPush doesn't support accessing service properties directly in templates is wrong — that access works fine; the problem is the mutation, not the access pattern. Switching the template to the async pipe is a workable fix but doesn't identify the actual diagnosis. The claim that OnPush components can't inject services in their constructor is wrong — DI works identically regardless of change detection strategy.`
  },
  187: {
    options: [
      "It sorts the whole list before rendering it, keyed by the tracked property",
      "It gives each item a stable identity so Angular can reuse existing nodes",
      "It stops Angular from re-rendering any items that have not changed value",
      "It applies CSS will-change: transform to the list items for GPU speed-up"
    ],
    answer: 1,
    explanation: `Without \`track\`, Angular has no way to match old and new items — it destroys all DOM nodes and creates new ones on any data change. With \`track item.id\` (or \`trackBy: fn\`), Angular identifies which items are new, moved, or removed and surgically updates the DOM. For a list of 1000 items where 1 changes, \`track\` means one node update instead of 1000 re-renders. The claim that it sorts the list is wrong — nothing gets reordered by \`track\` itself. The claim that it stops re-rendering items whose value hasn't changed is a subtly wrong description — \`track\`'s job is DOM node identity and reuse across a list re-render, not detecting per-item value changes; bindings on a reused node still update normally. The \`will-change: transform\` claim is wrong — \`track\` doesn't apply any CSS.`
  },
  195: {
    options: [
      "Components that use signals in place of templates for doing the rendering",
      "Components whose reactive state is all signals — enabling fine-grained CD",
      "Components that cannot use Zone.js at all — they require the zoneless mode",
      "A special component class that extends SignalComponent, not base Component"
    ],
    answer: 1,
    explanation: `The signal-based component model (\`input()\`, \`output()\`, \`viewChild()\`, \`signal()\`, \`computed()\`) gives Angular a complete picture of which reactive values drive which DOM nodes. This is the foundation for fine-grained reactivity where only the specific DOM nodes reading a changed signal update — not the entire component. You can use signals without zoneless mode today, and adding zoneless mode on top gives the full performance benefit. The claim that signals replace templates for rendering is wrong — signals are a state/reactivity primitive, not a templating mechanism. The claim that these components can't use Zone.js and require zoneless mode is wrong — signal-based components work fine inside Zone.js apps; zoneless is a separate, optional opt-in. The claim that there's a special \`SignalComponent\` base class is wrong — there is no such class; these components still use the standard \`Component\` decorator, just with signal-based APIs.`
  }
};
