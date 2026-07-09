import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Server-Side Rendering in depth — CSR vs SSR vs prerender timelines,
 * per-route render modes (RenderMode.Server / Prerender / Client), SSR-safe
 * code patterns, the double-fetch problem and the HTTP transfer cache, server
 * stability, and the pitfalls that break real SSR deployments.
 *
 * Two interactive explorers: a request-timeline comparator and a
 * "pick the right render mode for this page" decision lab.
 */

type Strategy = 'CSR' | 'SSR' | 'SSG';

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

@Component({
  selector: 'app-lesson-ssr',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

    .timeline { list-style: none; margin: 0; padding: 0; }
    .timeline li { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px dashed var(--border); font-size: .9rem; }
    .timeline li:last-child { border-bottom: none; }
    .actor { flex: 0 0 70px; font-size: .7rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; border-radius: 6px; text-align: center; padding: 2px 0; }
    .actor.browser { background: rgba(99,102,241,.12); color: var(--accent); }
    .actor.server  { background: rgba(16,185,129,.12); color: var(--green); }
    .actor.build   { background: rgba(245,158,11,.14); color: var(--amber); }
    .marker { margin-left: auto; font-family: monospace; font-size: .74rem; font-weight: 700; color: var(--green); border: 1px solid var(--green); border-radius: 6px; padding: 1px 8px; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }

    .mode-pill { display: inline-block; font-family: monospace; font-weight: 700; font-size: .88rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.12); color: var(--accent); margin: 10px 0 6px; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>Server-Side Rendering (SSR)</h1>
      <p class="lead">
        With SSR, Angular renders your components to HTML on the server, so the browser
        paints real content before a single byte of JavaScript executes — then the same
        app boots on the client and <em>hydrates</em> the existing DOM. This page covers
        the three delivery strategies, per-route render modes, SSR-safe coding patterns,
        and the transfer cache that prevents double-fetching.
      </p>

      <h2>Three delivery strategies, one framework</h2>
      <div class="demo">
        <p class="demo__title">Interactive — follow a request through each strategy</p>
        <div class="chips">
          @for (s of strategies; track s) {
            <button [class.on]="strategy() === s" (click)="strategy.set(s)">{{ s }}</button>
          }
        </div>
        <p style="font-size:.9rem">{{ timelines[strategy()].blurb }}</p>
        <ul class="timeline">
          @for (step of timelines[strategy()].steps; track $index) {
            <li>
              <span class="actor" [class]="'actor ' + step.actor">{{ step.actor }}</span>
              <span>{{ step.text }}</span>
              @if (step.marker) { <span class="marker">{{ step.marker }}</span> }
            </li>
          }
        </ul>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Note where FCP (first contentful paint) lands: CSR pays for download + bootstrap
          + data fetch before showing anything; SSR/SSG paint before JavaScript even
          arrives. Crawlers and link previews read the initial HTML — with CSR they may
          see an empty shell.
        </p>
      </div>

      <h2>Adding SSR</h2>
      <div class="code"><pre>{{ setupSample }}</pre></div>
      <p>
        The build now emits a <strong>browser</strong> bundle and a <strong>server</strong>
        bundle, plus a small Node server (<code>server.ts</code>, Express-based) you can
        deploy or adapt. <code>ng serve</code> renders through the server engine in
        development too — so SSR bugs surface immediately instead of in production.
      </p>

      <h2>Per-route render modes — the real architecture decision</h2>
      <p>
        Modern Angular doesn't force one strategy on the whole app. A
        <code>ServerRoute[]</code> config assigns each route
        <code>RenderMode.Server</code>, <code>RenderMode.Prerender</code> (default), or
        <code>RenderMode.Client</code> — so a single deployment mixes static marketing
        pages, per-request SSR, and client-only authenticated areas:
      </p>
      <div class="code"><pre>{{ renderModeSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Decision lab — pick a page, get the mode + the reasoning</p>
        <div class="chips">
          @for (p of pageKinds; track p.label) {
            <button [class.on]="activePage() === p" (click)="activePage.set(p)">{{ p.label }}</button>
          }
        </div>
        @if (activePage(); as p) {
          <span class="mode-pill">RenderMode.{{ p.mode }}</span>
          <p style="font-size:.9rem; margin:6px 0 10px">{{ p.why }}</p>
          <div class="code" style="font-size:.82rem"><pre>{{ p.snippet }}</pre></div>
        }
      </div>

      <h2>Writing SSR-safe code</h2>
      <p>
        On the server there is no <code>window</code>, <code>document</code>,
        <code>localStorage</code>, <code>navigator</code>, or layout engine. The
        number-one SSR bug is touching them during construction or rendering — the render
        crashes (or silently produces wrong HTML) for every request:
      </p>
      <div class="code"><pre>{{ safeCodeSample }}</pre></div>
      <table class="cmp">
        <tr><th>Need</th><th>SSR-safe tool</th></tr>
        <tr><td>Measure/manipulate the DOM after paint</td><td><code>afterNextRender()</code> — browser-only by design, never runs on the server</td></tr>
        <tr><td>Branch logic per platform</td><td><code>isPlatformBrowser(inject(PLATFORM_ID))</code></td></tr>
        <tr><td>Read the incoming request (cookies, headers)</td><td>inject <code>REQUEST</code> (Angular's server DI tokens)</td></tr>
        <tr><td>Third-party browser-only library</td><td>dynamic <code>import()</code> inside <code>afterNextRender</code>, or <code>&#64;defer</code> the component using it</td></tr>
        <tr><td>Storage</td><td>cookies (exist on both sides) or guard localStorage behind a platform check</td></tr>
      </table>
      <div class="warn">
        <strong>Stability trap:</strong> the server waits for the app to become
        <em>stable</em> (pending HttpClient requests resolved, no queued macrotasks)
        before serializing. An innocent <code>setInterval</code> started in a constructor
        keeps the app unstable — the server render hangs until a timeout. Start recurring
        timers in <code>afterNextRender</code> so they only ever exist in the browser.
      </div>

      <h2>The double-fetch problem &amp; the transfer cache</h2>
      <p>
        The server fetched your data to render the page — then the client app boots and
        fetches <em>the same data again</em>. Angular solves this with the
        <strong>HTTP transfer cache</strong> (on by default with
        <code>provideClientHydration()</code>): server-side <code>HttpClient</code>
        responses are embedded in the HTML and replayed as instant cache hits during
        hydration, then the cache is discarded:
      </p>
      <div class="code"><pre>{{ transferSample }}</pre></div>
      <p>
        For non-HttpClient data (a database read in a server route, a heavy computation),
        use <code>TransferState</code> directly with <code>makeStateKey</code> — same
        mechanism, manual keys.
      </p>

      <h2>Pitfalls seen in real deployments</h2>
      <ul>
        <li><strong>Auth-gated APIs return 401 during SSR</strong> — the server's HttpClient
          does not automatically forward the user's cookies. Read them from the
          <code>REQUEST</code> token and attach explicitly (or make those routes
          <code>RenderMode.Client</code>).</li>
        <li><strong>Absolute vs relative URLs</strong> — on the server, a relative
          <code>/api/...</code> URL has no origin to resolve against unless the server
          entry configures one. Interceptor that prefixes the API origin is the standard fix.</li>
        <li><strong>Memory leaks are amplified</strong> — a leak that costs one browser tab
          now costs a long-running Node process serving every user. Clean up in
          <code>DestroyRef</code>/<code>ngOnDestroy</code> religiously.</li>
        <li><strong>Different output per render</strong> — randomness or timestamps in
          templates make the server HTML differ from the client's first render; that's a
          hydration mismatch (covered in the <a routerLink="/hydration">Hydration lesson</a>).</li>
        <li><strong>Prerender + late data</strong> — an SSG page is frozen at build time;
          if its data changes hourly, either rebuild on a schedule, switch that route to
          <code>RenderMode.Server</code>, or fetch the volatile part client-side.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>When would you choose Prerender over Server rendering?</summary>
        <div>When the page is the same for every visitor at request time — marketing pages,
        docs, blog posts, enumerable product pages. It's rendered once at build (per param
        set via <code>getPrerenderParams</code>) and served statically: no per-request
        compute, best TTFB. Server mode is for per-request/personalized-but-crawlable
        content.</div>
      </details>
      <details class="qa">
        <summary>Why did the SSR response take 30 seconds, then render fine?</summary>
        <div>Something kept the app from becoming stable — usually a recurring timer or a
        never-completing observable tied to a macrotask started during bootstrap. The
        server waits for stability before serializing. Move timers into
        <code>afterNextRender</code>.</div>
      </details>
      <details class="qa">
        <summary>How does Angular avoid fetching data twice (server + client)?</summary>
        <div>The HTTP transfer cache: server-side HttpClient responses are serialized into
        the HTML and replayed on the client during hydration. Enabled by default with
        <code>provideClientHydration()</code>; tune with
        <code>withHttpTransferCacheOptions()</code> (e.g. include POST or requests with
        auth headers). Manual data goes through <code>TransferState</code>.</div>
      </details>
      <details class="qa">
        <summary>Where does <code>localStorage</code> access belong in an SSR app?</summary>
        <div>Behind a browser boundary: inside <code>afterNextRender()</code>, or guarded
        by <code>isPlatformBrowser</code>. On the server it doesn't exist — unguarded
        access throws for every request.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>SSR renders per request; prerender renders at build; client mode opts a route out — mix all three via <code>ServerRoute</code> configs.</li>
        <li>FCP happens before JavaScript with SSR/SSG; crawlers and previews see real HTML.</li>
        <li>Guard browser globals (<code>afterNextRender</code> / <code>isPlatformBrowser</code>); keep timers out of bootstrap or the server render hangs.</li>
        <li>The HTTP transfer cache kills the double fetch; <code>TransferState</code> is the manual escape hatch.</li>
        <li>Server-side HttpClient forwards no cookies by itself — handle auth explicitly.</li>
      </ul>

      <p><a routerLink="/hydration">Next: Hydration →</a></p>
    </article>
  `,
})
export class Ssr {
  readonly strategies: Strategy[] = ['CSR', 'SSR', 'SSG'];
  readonly timelines = TIMELINES;
  readonly strategy = signal<Strategy>('CSR');

  readonly pageKinds = PAGE_KINDS;
  readonly activePage = signal<PageKind | null>(null);

  readonly setupSample = `ng add @angular/ssr        # scaffolds server.ts, server build & entry

// app.config.server.ts — merged with your normal appConfig on the server
import { provideServerRendering, withRoutes } from '@angular/ssr';

export const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};`;

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
