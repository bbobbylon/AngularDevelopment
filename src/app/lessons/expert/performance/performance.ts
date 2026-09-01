import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Cost Lab primitives ─────────────────────────────────────────────────────

/** One row in the Cost Lab's dataset. Only `active` matters — the rest is bulk. */
interface CostItem {
  readonly active: boolean;
}

/** A snapshot of the Cost Lab's counters, taken the moment "Reveal" is pressed. */
interface CostSnapshot {
  readonly naiveCalls: number;
  readonly naiveMs: string;
  readonly computedCalls: number;
  readonly computedMs: string;
}

// ── Track-identity demo primitives ──────────────────────────────────────────

/** One row in the track-by-id-vs-$index demo. */
interface FruitRow {
  readonly id: number;
  readonly name: string;
}

// ── Main lesson component ───────────────────────────────────────────────────

/**
 * Lesson: Performance Optimization — knowing which kind of slow you have, and
 * proving every fix with a number instead of an "Impact: High" table cell.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `docs/UI-DESIGN.md`
 * §9), following the section rhythm `expert/change-detection` established:
 * pose the symptom before naming the diagnosis, give the reader an analogy to
 * hang the vocabulary on, then work through each axis with a live demo rather
 * than an assertion.
 *
 * The previous version of this lesson was five independent tabs — load time,
 * runtime, Web Vitals, images, profiling — with checklist tables asserting
 * "High" / "Medium" impact and not one live demo anywhere on the page, despite
 * opening with "measure, then optimize." This rewrite keeps all five topics but
 * replaces the tabs with a continuous read and adds three real, signal-driven
 * demos:
 *
 * 1. **The Cost Lab** — the same `.filter(i => i.active).length` bound two
 *    ways, one as a plain template call and one wrapped in `computed()`, each
 *    instrumented with a real call counter and `performance.now()`. The naive
 *    version's counter climbs on every change-detection pass, including ones
 *    the reader triggers with a no-op click; the `computed()` counter reaches
 *    1 and — because it depends on nothing that ever changes — never moves
 *    again. Numbers, not a claim.
 * 2. **The track-identity demo** — the same four rows rendered twice, once
 *    `track item.id` and once `track $index`, each row carrying a plain
 *    `<input>`. Type a note next to a name, shuffle, and watch the note
 *    either follow its row (`track item.id`) or stay in the DOM position it
 *    started in, now sitting next to the wrong name (`track $index`).
 * 3. **The windowed list** — a hand-rolled 500-row scrollable list that keeps
 *    roughly a dozen real DOM nodes alive no matter how far you scroll,
 *    demonstrating the mechanism `*cdkVirtualFor` automates (this app has no
 *    `@angular/cdk` dependency to build a live CDK demo against, so the
 *    lesson proves the underlying idea instead of the library call).
 *
 * ## Coverage-sweep findings folded in
 *
 * `docs/COVERAGE-SWEEP.md` under `expert/performance` flagged four gaps; the
 * high-priority two are fully addressed (the Cost Lab / track-identity /
 * windowed-list demos above are the direct answer to "a performance lesson
 * with no measurement in it", and virtual scrolling gets its own section with
 * an explanation, a CDK snippet and a live windowed demo). The two
 * medium-priority findings — INP's Angular-specific fixes being one table
 * cell, and `NgOptimizedImage` omitting `fill`/`placeholder`/the
 * priority-overuse warning — are folded into the Web Vitals and Images
 * sections respectively.
 *
 * @see expert/change-detection — the CD mechanism this lesson assumes.
 * @see expert/onpush — all five OnPush re-check triggers, live.
 * @see expert/deferrable-views — every `@defer` trigger and block in depth.
 */
@Component({
  selector: 'app-lesson-performance',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './performance.css',
  templateUrl: './performance.html',
})
export class Performance {
  // ── The Cost Lab: computed() vs. a function call in the template ─────────

  /**
   * 50,000 rows so a `.filter()` over them costs enough real time that
   * `performance.now()` reliably reports something other than `0.00` even
   * under a browser's clamped timer resolution — the point is the call
   * *count*, but a genuinely-zero millisecond figure would undercut it.
   */
  private readonly costItems: CostItem[] = Array.from({ length: 50000 }, () => ({
    active: Math.random() > 0.5,
  }));

  /** How many times {@link activeCountNaive} has actually run. */
  private naiveCalls = 0;
  /** Accumulated milliseconds spent inside {@link activeCountNaive}. */
  private naiveTotalMs = 0;
  /** How many times the body of {@link activeCountComputed} has actually run. */
  private computedCalls = 0;
  /** Accumulated milliseconds spent inside {@link activeCountComputed}'s body. */
  private computedTotalMs = 0;

  /**
   * The naive version: an ordinary method, called directly from an
   * interpolation. It re-filters the full 50,000-row array on **every**
   * change-detection pass that reaches this view — including the dev-mode
   * verification re-run, and including passes triggered by something that
   * changed nothing at all.
   *
   * Deliberately not a getter — see the class JSDoc in this app's other
   * lessons for why a getter that mutates its own displayed value throws
   * NG0100. This is safe: `naiveCalls`/`naiveTotalMs` are plain fields that
   * nothing in the template reads reactively, so the bound return value never
   * disagrees with itself between the two dev-mode checks of one pass.
   */
  protected activeCountNaive(): number {
    const start = performance.now();
    const result = this.costItems.filter((i) => i.active).length;
    this.naiveCalls++;
    this.naiveTotalMs += performance.now() - start;
    return result;
  }

  /**
   * The fixed version: the identical filter, wrapped in `computed()`. It
   * reads no signal, so it has nothing that could ever go stale — Angular
   * computes it once, on first read, and every later read (including every
   * dev-mode verification pass) returns the cached value without
   * re-executing this function at all.
   */
  protected readonly activeCountComputed = computed(() => {
    const start = performance.now();
    const result = this.costItems.filter((i) => i.active).length;
    this.computedCalls++;
    this.computedTotalMs += performance.now() - start;
    return result;
  });

  /** The counters, captured the moment the reader asks to see them. */
  protected readonly costReveal = signal<CostSnapshot | null>(null);

  /** Copies the live counters into {@link costReveal} for display. */
  protected revealCost(): void {
    this.costReveal.set({
      naiveCalls: this.naiveCalls,
      naiveMs: this.naiveTotalMs.toFixed(2),
      computedCalls: this.computedCalls,
      computedMs: this.computedTotalMs.toFixed(2),
    });
  }

  /**
   * Does nothing, deliberately. A template event listener still marks its
   * view and notifies the scheduler before this runs — so clicking it still
   * costs a real change-detection pass, which is the entire point.
   */
  protected noop(): void {}

  // ── The track-identity demo: track item.id vs. track $index ──────────────

  /** The same four rows, rendered twice with different `track` expressions. */
  protected readonly fruitRows = signal<FruitRow[]>([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
    { id: 4, name: 'Date' },
  ]);

  /** Reorders the rows in place — a Fisher–Yates shuffle of the array's data. */
  protected shuffleFruit(): void {
    this.fruitRows.update((current) => {
      const copy = [...current];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  }

  // ── The windowed list: virtual scrolling's core idea, hand-rolled ────────

  /** How many rows "exist", most of which never touch the DOM. */
  protected readonly totalRows = 500;
  /** Fixed row height in pixels — the one assumption that makes the maths cheap. */
  protected readonly rowHeight = 28;
  /** The scrollable viewport's height in pixels. */
  protected readonly viewportHeight = 224;

  /** The viewport's current `scrollTop`, read from the native `(scroll)` event. */
  protected readonly scrollTop = signal(0);

  /** The first row index the window should render, with a small look-behind buffer. */
  protected readonly windowStart = computed(() =>
    Math.max(0, Math.floor(this.scrollTop() / this.rowHeight) - 2),
  );

  /** The row indexes actually rendered right now — never far past a dozen. */
  protected readonly visibleRowIndexes = computed(() => {
    const start = this.windowStart();
    const count = Math.ceil(this.viewportHeight / this.rowHeight) + 4;
    const end = Math.min(this.totalRows, start + count);
    return Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
  });

  /** Mirrors the viewport's native `scrollTop` into a signal on every scroll event. */
  protected onViewportScroll(event: Event): void {
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }

  // ── Presentation data ─────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer', id: 'deferrable-views' },
    { label: 'Performance' },
    { label: 'afterRender', id: 'after-render' },
  ];

  /**
   * Sample: two lazy routes. `loadComponent` for one screen, `loadChildren`
   * for a whole feature area sharing one chunk.
   */
  protected readonly lazyRoutesSample = `export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
  },
];
// Each import() call is a dynamic import — the bundler treats it as a chunk boundary.
// Neither chunk exists in the initial bundle; each downloads on first navigation to its route.`;

  /** Line-by-line walkthrough of {@link lazyRoutesSample}. */
  protected readonly lazyRoutesNotes: CodeNote[] = [
    {
      line: 1,
      text: "`Routes` is Angular's type for an array of route configs — this constant is exactly what you hand to `provideRouter()`.",
    },
    {
      line: 4,
      text: "`loadComponent` takes a function returning a `Promise`. `import('./dashboard/dashboard')` is a **dynamic import**; it resolves to `m`, the module's namespace object, and `.then((m) => m.Dashboard)` picks the named export off it.",
    },
    {
      line: 8,
      text: '`loadChildren` is the same idea one level up: instead of resolving to one component, it resolves to **more routes** — `SETTINGS_ROUTES`, itself a `Routes` array — so a whole feature area shares one chunk.',
    },
    {
      line: 11,
      text: 'The mechanism, named: every `import()` call is where the bundler cuts a **chunk boundary**. Nothing else needs configuring — writing the route this way is the whole trick.',
    },
  ];

  /** Sample: a custom `PreloadingStrategy` that preloads only opted-in routes. */
  protected readonly preloadStrategySample = `export class SelectivePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] === true ? load() : EMPTY;
  }
}

provideRouter(routes, withPreloading(SelectivePreload));

// opt a route in:
{ path: 'dashboard', data: { preload: true }, loadComponent: () => import('./dashboard/dashboard') }`;

  /** Line-by-line walkthrough of {@link preloadStrategySample}. */
  protected readonly preloadStrategyNotes: CodeNote[] = [
    {
      line: 1,
      text: "`implements PreloadingStrategy` is Angular's contract for exactly this job: one method, `preload`, called once per lazy route after the initial app finishes loading.",
    },
    {
      line: 2,
      text: '`route: Route` is the route config under consideration. `load` is a **function Angular hands you** that starts the chunk downloading if you call it — you decide whether to, not how the download happens.',
    },
    {
      line: 3,
      text: "`route.data?.['preload']` reads the `data` object off the route (`?.` guards a route that never set one). Returning `load()` starts the download in the background; returning `EMPTY` — an Observable that completes immediately and does nothing — skips it.",
    },
    {
      line: 7,
      text: "`withPreloading(SelectivePreload)` wires the class in as the app's preloading strategy, passed to `provideRouter()` alongside the routes themselves.",
    },
    {
      line: 10,
      text: "The opt-in is one property inside the route's `data` — no extra code, just a flag the strategy above reads back.",
    },
  ];

  /** Sample: `@defer` splitting a chunk within a route, not between routes. */
  protected readonly deferSample = `@defer (on viewport) {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-skeleton"></div>
}
// HeavyChart's chunk is not in the initial bundle — it downloads only once
// the placeholder scrolls into view. The deferrable-views lesson covers
// every trigger (on viewport / on interaction / on idle / on timer / on hover)
// and the @loading / @error blocks this short version leaves out.`;

  /** Sample: bundle budgets that fail the build, and how to see what's in a chunk. */
  protected readonly bundleBudgetsSample = `// angular.json:
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumError": "4kB" },
  { "type": "anyLazyModule", "maximumWarning": "150kB", "maximumError": "500kB" }
]

// see what's actually inside a bundle:
// ng build --stats-json
// npx source-map-explorer dist/app/browser/main*.js`;

  /** Illustrative: a function call bound directly — the naive half of the compare. */
  protected readonly naiveFilterSample = `// re-evaluated on every change-detection pass, no matter how many:
<p>{{ items().filter(i => i.active).length }}</p>`;

  /** Illustrative: the same filter, wrapped in computed() — the fixed half. */
  protected readonly computedFilterSample = `// runs once, then returns a cached value until items() itself changes:
readonly activeCount = computed(() =>
  this.items().filter((i) => i.active).length,
);

// template:
<p>{{ activeCount() }}</p>`;

  /** Sample: an OnPush component with a signal input and a computed(). */
  protected readonly onPushSignalsSample = `@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly price = input.required<number>();
  readonly discounted = computed(() => this.price() * 0.9);
}`;

  /** Line-by-line walkthrough of {@link onPushSignalsSample}. */
  protected readonly onPushSignalsNotes: CodeNote[] = [
    {
      line: 3,
      text: '`ChangeDetectionStrategy.OnPush` — this view is skipped by a pass unless one of four specific things happens. The OnPush lesson proves all four live; this page assumes you know the shape.',
    },
    {
      line: 6,
      text: '`input.required<number>()` is a signal-backed input. Reading `price()` in the template registers that read, which is what lets a write to `price` reach exactly this view.',
    },
    {
      line: 7,
      text: '`computed(() => …)` wraps the derivation once. Read `discounted()` from a hundred places in the template and the multiplication still runs only when `price` actually changes.',
    },
  ];

  /** Illustrative: `track $index` — the trap half of the track compare. */
  protected readonly trackIndexSample = `// Angular cannot tell which row is which — a reorder looks like N deletions
// and N insertions, so every row is destroyed and rebuilt from scratch:
@for (item of items(); track $index) {
  <app-product-row [item]="item" />
}`;

  /** Illustrative: `track item.id` — the fix half of the track compare. */
  protected readonly trackIdSample = `// Angular matches rows by identity — a reorder just moves existing DOM
// nodes to new positions. Nothing is destroyed:
@for (item of items(); track item.id) {
  <app-product-row [item]="item" />
}`;

  /** Sample: the shape of a working CDK virtual-scroll viewport. */
  protected readonly virtualScrollSample = `import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-big-list',
  imports: [ScrollingModule],
  templateUrl: './big-list.html',
})
export class BigList {
  readonly rows = input.required<Row[]>();
}

// big-list.html:
// <cdk-virtual-scroll-viewport itemSize="48" class="viewport">
//   <div *cdkVirtualFor="let row of rows()">{{ row.label }}</div>
// </cdk-virtual-scroll-viewport>`;

  /** Line-by-line walkthrough of {@link virtualScrollSample}. */
  protected readonly virtualScrollNotes: CodeNote[] = [
    {
      line: 1,
      text: '`ScrollingModule` ships in `@angular/cdk/scrolling` — a separate package from `@angular/core`. This app does not have `@angular/cdk` installed, so treat this as the shape to reach for, not a route you can click through here.',
    },
    {
      line: 6,
      text: 'A real `.html` file, not projected inline — the viewport needs to size a real scroll container, which gets awkward fast written as a template string.',
    },
    {
      line: 13,
      text: '`itemSize="48"` tells the viewport every row is exactly **48px tall, fixed**. That single assumption is what lets it compute which rows are visible from `scrollTop` alone, with no measuring.',
    },
    {
      line: 14,
      text: '`*cdkVirtualFor` looks like `@for` but is not: it **recycles** a small pool of real DOM elements as you scroll, rewriting their content, instead of creating one element per row. `@for` never recycles — that difference is the entire reason this directive exists.',
    },
  ];

  /** Illustrative: the leak — a subscription nothing ever tears down. */
  protected readonly leakSample = `// leaks: nothing ever unsubscribes this, for the life of the app:
ngOnInit(): void {
  this.dataService.items$.subscribe((items) => this.items.set(items));
}`;

  /** Illustrative: the fix — tied to the component's destruction. */
  protected readonly sealedSample = `// tears itself down when the component is destroyed:
private readonly destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.dataService.items$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((items) => this.items.set(items));
}`;

  /** Sample: the fix for a long synchronous handler — yield, don't just add OnPush. */
  protected readonly inpFixSample = `// ❌ one long synchronous loop — nothing can paint until it's done:
items().forEach((item) => expensiveWork(item));

// ✅ hand control back to the browser between chunks of work:
async function processInChunks(items: Item[]): Promise<void> {
  for (const item of items) {
    expensiveWork(item);
    await yieldToMain(); // scheduler.yield() where supported, else a 0ms setTimeout
  }
}`;

  /** Line-by-line walkthrough of {@link inpFixSample}. */
  protected readonly inpFixNotes: CodeNote[] = [
    {
      line: 2,
      text: '`forEach` runs every iteration **synchronously, back to back** — the browser cannot paint a frame, handle another click, or even scroll until the whole loop returns. This is what a "long task" looks like in the Performance panel.',
    },
    {
      line: 5,
      text: '`async` and `Promise<void>` — the function can now pause partway through, which a plain `forEach` never could.',
    },
    {
      line: 8,
      text: '`await` on each iteration hands control back to the browser for one turn before the loop continues. `yieldToMain()` is a small helper: call the new `scheduler.yield()` where the browser supports it, otherwise fall back to `await new Promise(r => setTimeout(r, 0))`.',
    },
  ];

  /** Sample: finding what's actually inside a bundle, and the usual culprits. */
  protected readonly bundleAnalysisSample = `// build with stats, then look at what's actually in the chunk:
ng build --stats-json
npx source-map-explorer 'dist/*/browser/main*.js'

// common culprits once you can see inside a chunk:
// - moment.js — swap for date-fns (tree-shakeable) or the Temporal API
// - lodash — use lodash-es or plain Array methods, never \`import _ from 'lodash'\`
// - a large third-party library sitting in the INITIAL chunk — lazy-load or @defer it
// - @angular/animations still imported, unused — this app teaches CSS + View Transitions instead`;

  /** Sample: the two browser-level instruments the DevTools profiler doesn't replace. */
  protected readonly lighthouseWorkflowSample = `// DevTools → Lighthouse tab, run in an incognito window (no extensions skewing the score):
// - the "Performance" audit scores the page and lists "Opportunities", ranked by impact
// - the LCP element is named explicitly — confirms whether it's the one you marked [priority]

// DevTools → Performance tab, record while you perform the slow interaction:
// - a red-flagged bar is a Long Task: over 50ms of unbroken main-thread work
// - a Long Task inside a click handler is exactly the INP problem the ladder above fixes
// - even under 50ms, anything past one frame's ~16ms budget (60fps) risks a dropped frame`;

  /** Sample: reading Core Web Vitals from real users, not a lab run. */
  protected readonly webVitalsLibSample = `import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP((metric) => sendToAnalytics('LCP', metric.value));
onINP((metric) => sendToAnalytics('INP', metric.value));
onCLS((metric) => sendToAnalytics('CLS', metric.value));
// call this once, early — main.ts or app.config.ts`;

  /** Sample: NgOptimizedImage — priority, lazy-by-default, fill, and placeholder. */
  protected readonly ngOptimizedImageSample = `import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  templateUrl: './product-page.html',
})
export class ProductPage {}

// product-page.html — the ONE largest-contentful-paint image on the page:
// <img ngSrc="/hero.webp" width="1200" height="600" priority />

// below the fold — lazy by default, responsive srcset supplied by the loader:
// <img ngSrc="/product.jpg" width="400" height="400" />

// unknown or variable aspect ratio — fill the positioned parent instead of a fixed box:
// <div class="media" style="position: relative; height: 320px">
//   <img ngSrc="/banner.jpg" fill priority placeholder />
// </div>`;

  /** Line-by-line walkthrough of {@link ngOptimizedImageSample}. */
  protected readonly ngOptimizedImageNotes: CodeNote[] = [
    {
      line: 1,
      text: "`NgOptimizedImage` ships inside `@angular/common` — no separate install. Import it and add it to the component's `imports`.",
    },
    {
      line: 10,
      text: '`ngSrc` replaces `src` — that rename is what lets the directive intercept the request and add `fetchpriority`, generate a `srcset`, and validate the size hints. `priority` is for **one** image per page: the one that is your LCP element. Mark two, and the directive warns you in the console — priority for everyone is priority for no one.',
    },
    {
      line: 13,
      text: 'No `priority` here — Angular adds `loading="lazy"` itself. `width`/`height` are mandatory: the directive throws a build-time error without them, because they are exactly what reserves the box before the pixels arrive — the CLS fix.',
    },
    {
      line: 16,
      text: "`fill` (next line) needs a **positioned** ancestor with an explicit size — the image is absolutely positioned to cover it, and `object-fit` handles the cropping. Reach for this when you do not know the image's dimensions ahead of time: user uploads, a CMS.",
    },
    {
      line: 17,
      text: '`placeholder` renders a blurred low-resolution version — generated by the loader — while the real image streams in. The blur-up effect, one attribute.',
    },
  ];

  /** Sample: what "the loader" mentioned throughout the block above actually is. */
  protected readonly imageLoaderSample = `// app.config.ts — pick one of Angular's built-in CDN loaders:
providers: [
  provideImgixLoader('https://my-site.imgix.net'),
  // or provideCloudinaryLoader(...), provideCloudflareLoader(...), provideImageKitLoader(...)
]

// no CDN account? write a custom one — it's a single function:
import { IMAGE_LOADER, type ImageLoaderConfig } from '@angular/common';
providers: [
  { provide: IMAGE_LOADER, useValue: (c: ImageLoaderConfig) => \`/img/\${c.src}?w=\${c.width}\` },
]

// either way the template never changes — ngSrc is all NgOptimizedImage reads:
// <img ngSrc="products/shirt.jpg" width="400" height="400" />`;

  /**
   * Self-test 1 — computed() memoization.
   *
   * The distractors are the three ways learners misexplain what `computed()`
   * actually skips: that it's purely organizational, that dev-mode's
   * verification re-run defeats it, and that OnPush controls it. The Cost Lab
   * demo above this quiz proves the correct answer with a real counter.
   */
  protected readonly computedQuizOptions: QuizOption[] = [
    {
      text: 'Once per change-detection pass, same as a plain method — computed() is mainly a naming convenience.',
      why: 'That would make it no better than the naive `.filter()` call above, and the Cost Lab demo shows it plainly is not. `computed()` **memoizes**: it re-runs its function only when a signal it read has actually changed, not on every pass that happens to touch the template.',
    },
    {
      text: "Twice — once for the real pass, once for dev mode's verification re-run.",
      why: "Reasonable guess, and wrong for a specific reason: the verification re-run calls the *signal*, not the derivation function. Since nothing this `computed()` reads has changed, the signal returns its cached value without re-invoking the body — which is exactly why the demo's computed counter never moves, not even by one.",
    },
    {
      text: 'It depends on whether the host component is OnPush or Default.',
      why: "A `computed()`'s memoization is about its own **signal dependency graph** — has anything it reads changed? — and has nothing to do with the change-detection strategy of whatever component happens to read it. An OnPush component and a Default one see identical caching behaviour from the same computed().",
    },
    {
      text: 'Exactly once, ever — after that it returns the cached value without re-running the function.',
      correct: true,
      why: "Exactly, for this case: `activeCountComputed` reads no signal, so nothing can ever invalidate it. In general the rule is a little broader — it re-runs whenever a signal it read last time has since changed — but here nothing does, which is what makes the demo's second counter freeze at 1.",
    },
  ];

  /**
   * Self-test 2 — the INP counter-example this section exists to teach.
   *
   * `OnPush` reduces how much a change-detection *pass* checks; it does
   * nothing to how long your own handler runs before a pass even begins. The
   * distractors each restate a plausible but wrong story about why OnPush
   * "should" help here.
   */
  protected readonly inpQuizOptions: QuizOption[] = [
    {
      text: 'INP improves — OnPush means less work per change-detection pass.',
      why: 'OnPush does reduce how much a *pass* checks. It does nothing about the 400ms that happens **inside your own click handler, before any pass begins**. INP measures wall-clock time from the interaction to the next paint — your handler is on that clock regardless of strategy.',
    },
    {
      text: 'INP gets worse regardless — the 400ms happens inside the handler, before Angular ever reaches a change-detection pass.',
      correct: true,
      why: 'Correct. The fix for a slow handler is to make the handler itself faster or non-blocking — split the work and yield, move it off the main thread, or defer it — not to change how the component is checked afterward.',
    },
    {
      text: 'INP improves, but only after the second click, once the view is marked clean.',
      why: 'There is no such warm-up effect. Each click runs the same 400ms of synchronous work from scratch; "clean" or "dirty" describes whether a pass needs to re-check bindings, not how long your handler\'s own code takes to execute.',
    },
    {
      text: "Nothing changes, because this app runs zoneless and zoneless apps don't measure INP.",
      why: 'INP is a **browser-level** measurement (via `PerformanceObserver`, and what the `web-vitals` library reads), entirely independent of whether the app itself uses zones. Zoneless changes how Angular schedules its own passes, not what the browser reports about your interaction handler.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I need `@defer` if my routes are already lazy-loaded?',
      a: "Yes — they split at different granularities, not in competition. Lazy routes split **between** pages; `@defer` splits **within** one, for a component that's heavy but not worth its own route (a chart, a rich editor, a map). A dashboard route can be lazy-loaded and still `@defer` the one panel nobody scrolls to.",
    },
    {
      q: 'My `computed()` still re-runs on every keystroke — is it broken?',
      a: "Almost certainly not — check what it actually reads. Memoization only skips a re-run when **none** of the signals it read last time have changed. If it reads a signal your keystroke handler updates, of course it reruns; that's correct, not a bug. What `computed()` prevents is running when nothing it depends on changed at all — which is exactly the case the Cost Lab demo above proves.",
    },
    {
      q: 'Does `track item.id` cost anything extra?',
      a: "One property read per item, against `$index`'s free array position — not a meaningful cost next to what it buys. Angular reuses the existing `<input>`, scroll position, CSS transition or focus for that row, instead of destroying and rebuilding it from nothing on every reorder.",
    },
    {
      q: 'Is virtual scrolling always the right fix for a long list?',
      a: 'No. Reach for it once a list is genuinely long — hundreds of rows on screen at once, not tens — and know what it costs: variable-height rows get harder, in-page find and a screen reader\'s "read the whole list" no longer see rows that were never rendered, and a crawler sees only the visible window. Pagination solves the same DOM-count problem with none of those trade-offs, for the price of an extra click.',
    },
    {
      q: 'If `NgOptimizedImage` already lazy-loads below-the-fold images, do I still need `@defer` for an image-heavy gallery component?',
      a: "Different layers, same instinct. `NgOptimizedImage`'s laziness is about **when the browser fetches the pixels** for an `<img>` already sitting in the DOM. `@defer` is about **when Angular even creates the component** — its whole JavaScript chunk. A gallery that's expensive to construct benefits from `@defer`; the images inside it benefit from `NgOptimizedImage` regardless of which one you also use.",
    },
  ];

  /** The profiling workflow — record, reproduce, stop, read, confirm. */
  protected readonly profilerSteps: FlowStep[] = [
    { label: 'Record', detail: 'Angular DevTools → Profiler tab → Record.' },
    {
      label: 'Reproduce',
      detail: 'Perform the exact interaction that feels slow. Once, deliberately.',
      tone: 'accent',
    },
    { label: 'Stop', detail: 'The flame chart renders — one bar per change-detection pass.' },
    {
      label: 'Read it',
      detail: 'Find the widest bar, and which component dominates it.',
      tone: 'warn',
    },
    {
      label: 'Confirm',
      detail: 'Apply one fix, record again, compare. Not five fixes at once.',
      tone: 'good',
    },
  ];
}
