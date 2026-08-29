import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Which rendering strategy the timeline is showing.
 */
type Strategy = 'CSR' | 'SSR' | 'SSG';

/**
 * One step in a rendering timeline: who does it, and what happens.
 */
interface TimelineStep {
  actor: 'browser' | 'server' | 'build';
  text: string;
  marker?: string; // e.g. 'FCP', 'TTI'
}

const TIMELINES: Record<Strategy, { blurb: string; steps: TimelineStep[] }> = {
  CSR: {
    blurb:
      'Client-side rendering (the default without @angular/ssr): the server sends an empty shell; all rendering waits for JavaScript.',
    steps: [
      { actor: 'server', text: 'Serves index.html — essentially an empty <app-root></app-root>' },
      { actor: 'browser', text: 'Paints… nothing meaningful. Blank page (or a spinner)' },
      { actor: 'browser', text: 'Downloads and parses the JS bundles' },
      { actor: 'browser', text: 'Bootstraps Angular, runs change detection, renders the DOM', marker: 'FCP' },
      { actor: 'browser', text: 'Fetches data over HTTP, renders again with real content' },
      { actor: 'browser', text: 'Interactive', marker: 'TTI' },
    ],
  },
  SSR: {
    blurb:
      'Server-side rendering: each request renders real HTML on the server; the client then hydrates the existing DOM instead of rebuilding it.',
    steps: [
      { actor: 'server', text: 'Bootstraps the app per request, runs your components, awaits data' },
      { actor: 'server', text: 'Serializes the rendered page and streams complete HTML' },
      { actor: 'browser', text: 'Paints real content immediately — before any JS runs', marker: 'FCP' },
      { actor: 'browser', text: 'Downloads JS in the background; crawlers already have the content' },
      { actor: 'browser', text: 'Hydrates: adopts the existing DOM, attaches listeners (no re-render)' },
      { actor: 'browser', text: 'Interactive — event replay bridges the gap for early clicks', marker: 'TTI' },
    ],
  },
  SSG: {
    blurb:
      'Prerendering (SSG): pages are rendered ONCE at build time and served as static files — the fastest possible delivery, for content that is the same for everyone.',
    steps: [
      { actor: 'build', text: 'ng build renders each prerender route to a real .html file' },
      { actor: 'server', text: 'A CDN/static host serves the file — no per-request compute at all' },
      { actor: 'browser', text: 'Paints real content immediately', marker: 'FCP' },
      { actor: 'browser', text: 'Downloads JS, hydrates exactly like SSR' },
      { actor: 'browser', text: 'Interactive', marker: 'TTI' },
    ],
  },
};

/**
 * One kind of page, and the render mode that suits it.
 */
interface PageKind {
  label: string;
  mode: 'Server' | 'Prerender' | 'Client';
  why: string;
  snippet: string;
}

const PAGE_KINDS: PageKind[] = [
  {
    label: 'Marketing landing page',
    mode: 'Prerender',
    why: 'Identical for every visitor and SEO-critical — render it once at build time and serve it from a CDN. No server compute, best possible TTFB.',
    snippet: `{ path: '', renderMode: RenderMode.Prerender }`,
  },
  {
    label: 'Product page (/products/:id)',
    mode: 'Prerender',
    why: 'Parameterized but enumerable: getPrerenderParams returns the id list at build time and every product page becomes a static file. Falls back to SSR for ids added after the build.',
    snippet: `{
  path: 'products/:id',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    const ids = await inject(ProductService).ids();
    return ids.map(id => ({ id }));   // one static page per id
  },
}`,
  },
  {
    label: 'News feed (fresh per-request data)',
    mode: 'Server',
    why: 'Content changes per request and still benefits from SEO + fast first paint — render on the server for every request.',
    snippet: `{ path: 'news', renderMode: RenderMode.Server }`,
  },
  {
    label: 'Dashboard behind login',
    mode: 'Client',
    why: 'Personalized, non-crawlable, and gated by auth tokens that live in the browser. Server rendering buys nothing — skip it and ship the CSR shell.',
    snippet: `{ path: 'dashboard/**', renderMode: RenderMode.Client }`,
  },
];

/**
 * Lesson: Server-Side Rendering in depth — CSR vs SSR vs prerender timelines,
 * per-route render modes (RenderMode.Server / Prerender / Client), SSR-safe
 * code patterns, the double-fetch problem and the HTTP transfer cache, server
 * stability, and the pitfalls that break real SSR deployments.
 *
 * Two interactive explorers: a request-timeline comparator and a
 * "pick the right render mode for this page" decision lab.
 */
@Component({
  selector: 'app-lesson-ssr',
  imports: [RouterLink],
  styleUrl: './ssr.css',
  templateUrl: './ssr.html',
})
export class Ssr {
  /**
   * The three strategies.
   */
  readonly strategies: Strategy[] = ['CSR', 'SSR', 'SSG'];
  /**
   * Each strategy's timeline.
   */
  readonly timelines = TIMELINES;
  /**
   * The strategy being shown.
   */
  readonly strategy = signal<Strategy>('CSR');

  /**
   * The page kinds.
   */
  readonly pageKinds = PAGE_KINDS;
  /**
   * The page kind being examined, or `null` for none.
   */
  readonly activePage = signal<PageKind | null>(null);

  /**
   * Sample: `ng add @angular/ssr` and the server config it scaffolds.
   */
  readonly setupSample = `ng add @angular/ssr        # scaffolds server.ts, server build & entry

// app.config.server.ts — merged with your normal appConfig on the server
import { provideServerRendering, withRoutes } from '@angular/ssr';

export const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};`;

  /**
   * Sample: `app.routes.server.ts` — per-route `RenderMode`, so one app can
   * prerender its marketing pages, server-render its dashboards and leave the rest
   * client-only.
   */
  readonly renderModeSample = `// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },        // static at build time
  { path: 'news', renderMode: RenderMode.Server },       // fresh HTML per request
  { path: 'dashboard/**', renderMode: RenderMode.Client }, // browser-only (auth'd SPA)
  {
    path: 'products/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {                          // enumerate params at build
      return [{ id: '1' }, { id: '2' }];
    },
  },
];`;

  /**
   * Sample: code that crashes on the server.
   *
   * `window`, `document` and `localStorage` do not exist in Node, so touching them
   * in a field initialiser throws during every server render. `afterNextRender` is
   * the browser-only slot.
   */
  readonly safeCodeSample = `// ❌ crashes on the server — window doesn't exist there
export class Chart {
  width = window.innerWidth;   // ReferenceError during every SSR render
}

// ✅ platform guard for logic that must branch
private platformId = inject(PLATFORM_ID);
ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.width = window.innerWidth;
  }
}

// ✅ afterNextRender — the idiomatic home for DOM work; never runs on the server
constructor() {
  afterNextRender(() => {
    this.chart = new ThirdPartyChart(this.host.nativeElement);
  });
}`;

  /**
   * Sample: the HTTP transfer cache, which carries the server's fetched data into
   * the client so hydration does not immediately refetch everything.
   */
  readonly transferSample = `// on by default via provideClientHydration() — tune it:
provideClientHydration(
  withHttpTransferCacheOptions({
    includePostRequests: true,          // cache POSTs too (off by default)
    includeRequestsWithAuthHeaders: false,
  }),
)

// manual variant for non-HttpClient data:
const HERO_KEY = makeStateKey<Hero>('hero');

// server: render-time write            // client: hydration-time read
transferState.set(HERO_KEY, hero);      const hero = transferState.get(HERO_KEY, null);`;
}
