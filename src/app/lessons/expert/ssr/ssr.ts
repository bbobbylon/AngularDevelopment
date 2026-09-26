import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember, RichText } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';
import { HighlightCode } from '../../../shared/highlight-code.directive';

/**
 * Which rendering strategy the timeline is showing.
 */
type Strategy = 'CSR' | 'SSR' | 'SSG';

/**
 * One step in a rendering timeline: who does it, and what happens.
 *
 * `text` may contain `backtick` code spans, rendered via `app-rich-text` — see
 * the demo template.
 */
interface TimelineStep {
  readonly actor: 'browser' | 'server' | 'build';
  readonly text: string;
  /** A milestone label shown at the end of the row, e.g. `'FCP'`, `'TTI'`. */
  readonly marker?: string;
}

const TIMELINES: Record<Strategy, { blurb: string; steps: TimelineStep[] }> = {
  CSR: {
    blurb:
      'Client-side rendering — the default without `@angular/ssr`: the server sends an empty shell, and every bit of rendering waits for JavaScript.',
    steps: [
      {
        actor: 'server',
        text: 'Serves `index.html` — essentially an empty `<app-root></app-root>`',
      },
      { actor: 'browser', text: 'Paints nothing meaningful — a blank page, maybe a spinner' },
      { actor: 'browser', text: 'Downloads and parses the JS bundles' },
      {
        actor: 'browser',
        text: 'Bootstraps Angular, runs change detection, renders the DOM',
        marker: 'FCP',
      },
      { actor: 'browser', text: 'Fetches data over HTTP, renders again with real content' },
      { actor: 'browser', text: 'Interactive', marker: 'TTI' },
    ],
  },
  SSR: {
    blurb:
      'Server-side rendering: each request renders real HTML on the server; the client then hydrates the existing DOM instead of rebuilding it.',
    steps: [
      {
        actor: 'server',
        text: 'Boots the app for this one request via `CommonEngine`, runs your components, awaits data',
      },
      { actor: 'server', text: 'Serializes the finished page into one HTML string and streams it' },
      {
        actor: 'browser',
        text: 'Paints real content immediately — before any JS runs',
        marker: 'FCP',
      },
      {
        actor: 'browser',
        text: 'Downloads JS in the background; crawlers already have the content',
      },
      {
        actor: 'browser',
        text: "Hydrates: adopts the existing DOM, attaches listeners — that's the next lesson's whole subject",
      },
      {
        actor: 'browser',
        text: 'Interactive — event replay bridges the gap for early clicks',
        marker: 'TTI',
      },
    ],
  },
  SSG: {
    blurb:
      'Prerendering: pages are rendered ONCE at build time and served as static files — the fastest possible delivery, for content that is the same for everyone.',
    steps: [
      {
        actor: 'build',
        text: '`ng build` renders each prerender route to a real `.html` file, once',
      },
      {
        actor: 'server',
        text: 'A CDN or static host serves that file — zero per-request compute',
      },
      { actor: 'browser', text: 'Paints real content immediately', marker: 'FCP' },
      { actor: 'browser', text: 'Downloads JS, hydrates exactly like SSR' },
      { actor: 'browser', text: 'Interactive', marker: 'TTI' },
    ],
  },
};

/**
 * One kind of page, and the render mode that suits it.
 *
 * `why` may contain `backtick` code spans, rendered via `app-rich-text`.
 */
interface PageKind {
  readonly label: string;
  readonly mode: 'Server' | 'Prerender' | 'Client';
  readonly why: string;
  readonly snippet: string;
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
    why: '`getPrerenderParams` returns the id list at build time and every product page becomes a static file. Falls back to SSR for ids added after the build.',
    snippet: `{
  path: 'products/:id',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    const ids = await inject(ProductService).ids();
    return ids.map((id) => ({ id })); // one static page per id
  },
}`,
  },
  {
    label: 'News feed (fresh per-request data)',
    mode: 'Server',
    why: 'Content changes per request and still benefits from SEO and a fast first paint — render on the server for every request.',
    snippet: `{ path: 'news', renderMode: RenderMode.Server }`,
  },
  {
    label: 'Dashboard behind login',
    mode: 'Client',
    why: 'Personalized, non-crawlable, and gated by auth tokens that live in the browser. Server rendering buys nothing here — skip it and ship the CSR shell.',
    snippet: `{ path: 'dashboard/**', renderMode: RenderMode.Client }`,
  },
];

/**
 * Lesson: Server-Side Rendering in depth — CSR vs SSR vs prerender timelines,
 * turning it on (`provideServerRendering`, `CommonEngine`), per-route render
 * modes (`RenderMode.Server` / `Prerender` / `Client`), SSR-safe code
 * patterns, the double-fetch problem and the HTTP transfer cache, server
 * stability, and the pitfalls that break real SSR deployments.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape and teaching order copied from
 * `expert/change-detection`, the reference implementation, and kept
 * deliberately non-overlapping with `expert/hydration` — that lesson owns
 * everything about what the client does with this page's output.
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "your
 *    JavaScript hasn't even downloaded yet — what's on screen?", with the
 *    CSR/SSR/SSG timeline comparator doing the demonstrating before any
 *    vocabulary arrives.
 * 2. **Analogy next, mechanism after.** "A restaurant that plates your
 *    appetizer in the kitchen" gives the reader somewhere to put
 *    `CommonEngine`, `provideServerRendering` and per-route render modes
 *    before those words show up, dramatized a second way as a dialogue
 *    between the browser and the server making the actual API calls.
 * 3. **Then the same idea in several modes** — an annotated server file, a
 *    request-lifecycle diagram, a live timeline comparator, a decision lab,
 *    a tape-card glossary of the three render modes — because redundancy is
 *    the retention tool, not repetition.
 * 4. **Every substantial snippet is annotated line by line** via
 *    `app-code-lab`. Nothing here assumes the reader can already read the
 *    snippet.
 *
 * ## The boundary with hydration
 *
 * This lesson stops at "the browser painted real HTML and the JS bundle is
 * on its way." What happens the instant that JS bundle finishes — adopting
 * the DOM instead of rebuilding it, `ngh`, event replay, `NG0500` — is
 * `expert/hydration`'s entire subject and is deliberately not re-explained
 * here beyond the one paragraph a reader needs to know it exists.
 */
@Component({
  selector: 'app-lesson-ssr',
  imports: [
    HighlightCode,
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    RichText,
    BrainPower,
    Scribble,
    Whiteboard,
  ],
  styleUrl: './ssr.css',
  templateUrl: './ssr.html',
})
export class Ssr {
  /** The three strategies, for the timeline toggle. */
  protected readonly strategies: Strategy[] = ['CSR', 'SSR', 'SSG'];
  /** Each strategy's timeline. */
  protected readonly timelines = TIMELINES;
  /** The strategy currently shown. */
  protected readonly strategy = signal<Strategy>('CSR');

  /** The page kinds for the decision lab. */
  protected readonly pageKinds = PAGE_KINDS;
  /** The page kind being examined, or `null` for none. */
  protected readonly activePage = signal<PageKind | null>(null);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Rendering & Delivery track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'SSR' },
    { label: 'Hydration', id: 'hydration' },
    { label: 'PWA & Service Worker', id: 'pwa-service-worker' },
  ];

  // -- Page-shape block: "The Whiteboard" --

  /** What happens on the request, in order — the mechanism behind {@link windowTrapQuiz}. */
  protected readonly windowTrapFlow: FlowStep[] = [
    { label: 'Route matches RenderMode.Server', detail: 'A real visitor request, not ng serve' },
    {
      label: 'Angular constructs the component in Node',
      detail: 'The exact same class as in the browser',
    },
    {
      label: 'Field initializer runs immediately',
      detail: 'Same moment it would run client-side',
      tone: 'accent',
    },
    {
      label: '`window` is read',
      detail: 'Node never defined it — there is nothing to fall back to',
      tone: 'warn',
    },
    {
      label: 'ReferenceError throws mid-render',
      detail: 'The whole response fails — not just this component',
      tone: 'warn',
    },
  ];

  /** The self-test for the window/document trap — the crash version, not the silent one. */
  protected readonly windowTrapQuiz: QuizOption[] = [
    {
      text: "It works fine — Angular polyfills `window` on the server so browser-only code doesn't need special handling.",
      why: 'Nothing polyfills it. Node has no layout engine and no reason to fake one; `PLATFORM_ID` exists precisely because Angular expects you to branch yourself rather than pretending the server is a browser.',
    },
    {
      text: 'It throws a `ReferenceError: window is not defined`, and that takes down the entire response for every visitor who hits the route.',
      correct: true,
      why: "Right. `window` does not exist in the Node process at all — not `undefined`, not a stub, simply never declared. Reading a property off it throws before the assignment even completes, and because this happens during the server's render of the whole page, the failure takes the entire response with it.",
    },
    {
      text: 'It silently returns `undefined` for `window.innerWidth`, and the chart just renders at width 0 until the client hydrates.',
      why: "That would be the behaviour if `window` itself existed as an empty object — it doesn't. Reading `.innerWidth` off a name that was never declared throws a `ReferenceError` immediately; there is no silent, degraded path here at all.",
    },
    {
      text: "It only fails in a production deployment — `ng serve`'s dev server provides a stub `window` that a real Node SSR process does not.",
      why: "`ng serve` on its own never renders this component on the server at all — it's a client-side dev server. The crash isn't a production-only edge case; it happens on the very first request any Node process actually serves for this route, dev or prod.",
    },
  ];

  /**
   * The browser and the server, making the real API calls the analogy is
   * built on. This exists because the misconception this lesson exists to
   * prevent — "SSR makes the app itself faster" — comes from thinking about
   * SSR as a switch rather than as a second, real render happening somewhere
   * else, with a real class doing real work for exactly one request.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    { who: 'Browser', says: "GET /products/42. I've got nothing rendered for this yet." },
    {
      who: 'Server',
      says: "I'm not a plain file host — I've got `@angular/ssr`'s `CommonEngine`, and `provideServerRendering()` registered with your real component tree. Give me a moment.",
    },
    {
      who: 'Server',
      says: 'Booting the app fresh, for this request only. Running every component, waiting on the data your resolvers kicked off… done. Here is a finished `<article>`, not a shell.',
    },
    {
      who: 'Browser',
      says: 'Painting it right now. The visitor is already reading real content — not one line of your JavaScript has run yet.',
    },
    {
      who: 'Browser',
      says: '(a moment later) The JS bundle just finished downloading. Booting the same app a second time, on top of what you already gave me.',
    },
    {
      who: 'Server',
      says: "That second boot isn't mine to explain — I disappear the instant this response is sent. Go read the next lesson for what happens to my HTML from here.",
    },
  ];

  /**
   * Sample: turning SSR on. Two files, shown together because the second one
   * is what the first is actually paying for — `provideServerRendering()`
   * wires up the class that does the real work, `CommonEngine`.
   */
  protected readonly turningOnSample = `// app.config.server.ts — merged with the browser config, but only on the server
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

export const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

// server.ts — simplified to the one call that actually renders a request
import { CommonEngine } from '@angular/ssr/node';

const engine = new CommonEngine();

app.get('*', async (req, res) => {
  const html = await engine.render({ bootstrap, documentFilePath: indexHtml, url: req.originalUrl });
  res.send(html);                                          // one finished HTML string — the whole response
});`;

  /** Line-by-line walkthrough of {@link turningOnSample}. */
  protected readonly turningOnNotes: CodeNote[] = [
    {
      line: 2,
      text: '`provideServerRendering()` is the provider that turns a plain Angular app into one `@angular/ssr` can boot on the server at all. Leave it out of `serverConfig.providers` and there is no server render to speak of — only ever the client bundle from the CSR timeline above.',
    },
    {
      line: 3,
      text: 'The per-route table from the next section — which pages are `Server`, `Prerender` or `Client` — lives in this file, imported here so the server config knows about it.',
    },
    {
      line: 6,
      text: '`withRoutes(serverRoutes)` is what actually wires the two together. Without it, `provideServerRendering()` has nowhere to look up per-route behaviour, and every route falls back to the same default treatment.',
    },
    {
      line: 10,
      text: '`CommonEngine` is the class doing the real work underneath everything above — the direct API for rendering one Angular app to one HTML string on the server. Everything in `serverConfig` exists to configure how this gets called.',
    },
    {
      line: 12,
      text: 'Created once, when the Node process starts — not per request. Every visitor this process ever serves reuses the same instance.',
    },
    {
      line: 15,
      text: "`engine.render()` is the call your server makes for every request that isn't prerendered: boot the app fresh, run every component, wait for its data, and turn the whole result into a string. `url: req.originalUrl` is what makes each render specific to **this** request.",
    },
    {
      line: 16,
      text: 'A plain string — not a stream of framework instructions, nothing left to compute. That is the entire reason the browser can paint before a byte of your JavaScript has run.',
    },
  ];

  /**
   * Sample: the request lifecycle SSR actually runs, as a sequence — the
   * mnemonic for the mechanism section, drawn rather than only stated.
   */
  protected readonly requestFlow: FlowStep[] = [
    { label: 'Request', detail: 'Browser asks for the URL. No JS has run for this visitor yet.' },
    {
      label: 'Render',
      detail:
        '`CommonEngine` boots your app in Node, runs every component, waits on the data it needs.',
      tone: 'accent',
    },
    {
      label: 'Serialize',
      detail:
        "The finished component tree becomes one HTML string, plus the transfer-state blob if it's needed.",
    },
    {
      label: 'Paint',
      detail: 'The browser paints that HTML immediately — before downloading a single script.',
      tone: 'good',
    },
    {
      label: 'Hydrate',
      detail:
        "Once the JS bundle arrives, the client takes over. That handoff is next lesson's entire subject.",
      tone: 'warn',
    },
  ];

  /**
   * Sample: `app.routes.server.ts` — per-route `RenderMode`, so one app can
   * prerender its marketing pages, server-render its dashboards and leave the
   * rest client-only.
   */
  protected readonly renderModeSample = `// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },          // static at build time
  { path: 'news', renderMode: RenderMode.Server },         // fresh HTML per request
  { path: 'dashboard/**', renderMode: RenderMode.Client }, // browser-only (auth'd SPA)
  {
    path: 'products/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {                           // enumerate params at build time
      return [{ id: '1' }, { id: '2' }];
    },
  },
];`;

  /** Line-by-line walkthrough of {@link renderModeSample}. */
  protected readonly renderModeNotes: CodeNote[] = [
    {
      line: 4,
      text: 'One array, one route table for the whole app — this is what makes the per-page choice a config decision rather than something baked into each component.',
    },
    {
      line: 5,
      text: "`RenderMode.Prerender` is the default when a route doesn't specify one at all — this line is only here to say so explicitly.",
    },
    {
      line: 6,
      text: '`RenderMode.Server` means every request re-renders — the same `engine.render()` call from the mechanism section above, run again for every visitor.',
    },
    {
      line: 7,
      text: '`RenderMode.Client` opts a route **out** of server rendering entirely — a plain CSR shell, chosen deliberately for content that gains nothing from being crawlable or pre-painted.',
    },
    {
      line: 10,
      text: 'Same `RenderMode.Prerender` as line 5, but a parameterized route needs to be told **which** ids exist — that is the whole job of the function on the next line.',
    },
    {
      line: 11,
      text: '`getPrerenderParams()` runs once, at build time, and returns every param combination the build should generate a static page for.',
    },
    {
      line: 12,
      text: "Two params in, two static `.html` files out — one per product id. An id that doesn't exist yet at build time has no prerendered page at all, and needs a fallback (see the FAQ below).",
    },
  ];

  /**
   * The predict-before-telling trap: unconditional browser-global access on
   * the server. Deliberately kept separate from the leak-style trap in
   * {@link quizOptions} — one crashes immediately, the other fails silently,
   * and conflating them is itself a common mistake.
   */
  protected readonly trapPrompt =
    'This field initializer runs the instant Angular constructs the component — on the server exactly like in the browser. A route rendering this component with `RenderMode.Server` re-runs it on every single request. What happens?';

  /** Sample: code that crashes on the server. */
  protected readonly brokenWindowSample = `export class Chart {
  width = window.innerWidth; // a field initializer — runs during construction, every render
}`;

  /** The reveal for {@link trapPrompt}. */
  protected readonly trapAnswer =
    'It throws — a `ReferenceError: window is not defined` — and that takes down the **entire response** for every visitor who hits the route, not a warning tucked into a console only you would see. `window`, `document`, `localStorage` and `navigator` simply do not exist in the Node process doing the rendering, and nothing polyfills them by default. The fix is not scattering existence checks everywhere — it is moving this line into one of the two browser-only slots below.';

  /**
   * Sample: the two SSR-safe patterns for the trap above — a platform guard
   * for logic that must branch, and `afterNextRender` for anything that just
   * needs the DOM.
   */
  protected readonly safeFixSample = `// ✅ platform guard, when the logic itself needs to branch
private readonly platformId = inject(PLATFORM_ID);

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.width = window.innerWidth;
  }
}

// ✅ afterNextRender — the idiomatic home for DOM work; never runs on the server at all
constructor() {
  afterNextRender(() => {
    this.chart = new ThirdPartyChart(this.host.nativeElement);
  });
}`;

  /** Line-by-line walkthrough of {@link safeFixSample}. */
  protected readonly safeFixNotes: CodeNote[] = [
    {
      line: 2,
      text: "`inject(PLATFORM_ID)` reads a token that's `'server'` in Node and `'browser'` in the browser — the way any code can ask which side of the fence it is running on right now.",
    },
    {
      line: 5,
      text: 'isPlatformBrowser() turns that token into a plain boolean. On the server this `if` is simply false, so `window` is never touched — no guard inside the guard needed.',
    },
    {
      line: 12,
      text: 'afterNextRender() only ever runs in the browser, after the first paint — it is a deliberate no-op on the server, which is why code inside it never needs its own platform check.',
    },
    {
      line: 13,
      text: 'This is the right home for a third-party library that expects a real `document` to exist the moment it is constructed — chart libraries, jQuery plugins, anything DOM-first.',
    },
  ];

  /**
   * Sample: killing the double fetch. Two mechanisms, shown together because
   * they solve the same problem for two different sources — `HttpClient`
   * traffic is automatic, everything else needs `TransferState` by hand.
   */
  protected readonly transferSample = `// on by default via provideClientHydration() — tune it explicitly if needed:
provideClientHydration(
  withHttpTransferCacheOptions({
    includePostRequests: true,               // cache POSTs too — off by default
    includeRequestsWithAuthHeaders: false,    // opt in only if you trust where the HTML ends up
  }),
);

// for data that never went through HttpClient — a raw DB read, say — key it yourself:
const HERO_KEY = makeStateKey<Hero>('hero');
transferState.set(HERO_KEY, hero);              // server: written during render
const hero = transferState.get(HERO_KEY, null); // client: read during hydration, instead of re-fetching`;

  /** Line-by-line walkthrough of {@link transferSample}. */
  protected readonly transferNotes: CodeNote[] = [
    {
      line: 2,
      text: '`provideClientHydration()` is the same provider the hydration lesson covers for DOM adoption — the transfer cache is a second, independent job it does at the same time.',
    },
    {
      line: 4,
      text: 'By default only `GET` requests are cached across the server/client boundary. A page fetching its data via a `POST` gets double-fetched unless you opt in here.',
    },
    {
      line: 5,
      text: "Left `false` on purpose: an authenticated response cached into the page's HTML is now sitting in that HTML for anyone who can read the response — view-source, a shared cache, a saved page. Opt in only once you have thought about where that HTML ends up.",
    },
    {
      line: 10,
      text: "`makeStateKey<Hero>('hero')` creates a typed, string-backed lookup key. The same key has to be used on both sides, so it usually lives once in a shared file rather than being retyped.",
    },
    {
      line: 11,
      text: "This only runs on the server, and only for data `HttpClient` didn't fetch for you. Nothing here is automatic the way the HTTP cache above is — you own writing and reading both ends.",
    },
    {
      line: 12,
      text: "The second argument is the fallback used when the key isn't present — exactly the case on a client-side navigation with no server render behind it. Getting `null` there is expected, not a bug.",
    },
  ];

  /** The predict-then-reveal for the transfer-cache-as-data-leak spot-the-bug. */
  protected readonly cdnLeakPrompt =
    "A `/dashboard/:userId` route is `RenderMode.Server`, its `HttpClient` call sends the signed-in user's auth header, and `includeRequestsWithAuthHeaders` has been flipped to `true` to avoid a double-fetch. The whole app sits behind a shared CDN cache keyed on the URL. What actually goes wrong the first time two different users load the same route?";

  /** The reveal for {@link cdnLeakPrompt}. */
  protected readonly cdnLeakAnswer =
    "The second user gets served the CDN's cached copy of the FIRST user's fully rendered page — auth-header response, transfer-cache payload and all. The transfer cache did exactly its job: it embedded the authenticated response into that render's HTML, inside the `ng-state` script tag the page ships. Nothing about the transfer cache knows the response was personal, and nothing about a CDN keyed only on the URL knows two different users hit the same path. The fix is at the HTTP layer, not the transfer cache: a personalized route needs `Cache-Control: private` (so no shared cache stores it at all) — or simplest of all, `RenderMode.Client` for that route, so there is no server-rendered HTML containing anyone's data to cache in the first place.";

  /**
   * The self-test: the silent-leak trap, distinct from the crash trap above.
   * Distractors name the specific ways this gets guessed wrong — that a
   * server render tears down like a closed tab, that the failure is a crash
   * rather than a leak, and that Angular's own cleanup APIs reach code they
   * were never told about (CONTRIBUTING §2A.2).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: "It's cleared automatically — a server render ends the same way closing a browser tab would.",
      why: "That's the exact misconception this trap exists to correct. Closing a browser tab destroys its whole JS context, timers included. A Node process serving SSR requests gets no such reset between them — finishing one response tears down nothing a class happened to start on its own.",
    },
    {
      text: 'It keeps firing in that same Node process, polling included, compounding with every request the server ever handles.',
      correct: true,
      why: "Exactly. Angular discards the `ApplicationRef` for that one render, but nothing tells the JavaScript event loop to stop an interval it was never told about through Angular's own lifecycle. Request one's leaked timer is still ticking when request ten thousand arrives.",
    },
    {
      text: 'It throws immediately and crashes that request, the same way touching `window` would.',
      why: '`setInterval` is valid JavaScript everywhere, Node included — it never throws. This mixes up two different failure shapes: a crash you notice on request one, and a leak you might never notice at all.',
    },
    {
      text: '`DestroyRef` cleans it up automatically once the view is destroyed after rendering.',
      why: '`DestroyRef` only ever runs a callback you explicitly register with `onDestroy()`. Angular has no way to know a raw `setInterval` call needs undoing unless you tell it — nothing about server rendering makes cleanup automatic.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Does SSR mean my app runs twice?',
      a: "In a sense, yes — once on the server producing HTML, and once on the client when the JS bundle boots and Angular runs the same component tree again. What differs is what that second run does with the DOM: without hydration it throws the server's markup away and rebuilds from scratch; with `provideClientHydration()` it walks the existing DOM and adopts it instead. That handoff, and everything that can go wrong in it, is the entire subject of the next lesson.",
    },
    {
      q: 'When would I choose Prerender over Server rendering?',
      a: "When the page is the same for every visitor at request time — marketing pages, docs, enumerable product pages. `getPrerenderParams()` lists the param sets at build time and each becomes a static file: no per-request compute, the best possible TTFB. `RenderMode.Server` is for content that's per-request or genuinely changes between visits.",
    },
    {
      q: 'Why did my SSR response hang for 30 seconds and then render fine?',
      a: 'Something kept the app from becoming **stable** — usually a recurring timer or a subscription tied to a macrotask that never completes, started during bootstrap. The server waits for stability before it will serialize anything, and eventually times out. Move timers and long-lived subscriptions into `afterNextRender`, which never runs on the server at all.',
    },
    {
      q: 'How does Angular avoid fetching the same data twice?',
      a: "The HTTP transfer cache: server-side `HttpClient` responses get serialized into the page's HTML and replayed as instant cache hits on the client during hydration, then discarded. It's on by default the moment `provideClientHydration()` is registered; `withHttpTransferCacheOptions()` tunes what gets included. Data that never went through `HttpClient` needs the manual `TransferState` API instead.",
    },
    {
      q: "I only see `window is not defined` after I deploy — why didn't ng serve catch it?",
      a: "It should have — `ng serve` renders through the same server engine in development specifically so this surfaces early. The usual reason it slips through locally: the crashing line only runs down a code path you didn't click through in dev (a lazy route, a conditionally-rendered card), or that route is configured `RenderMode.Client` in your dev setup and `RenderMode.Server` or `Prerender` in production. Same component, different render path actually taken.",
    },
  ];
}
