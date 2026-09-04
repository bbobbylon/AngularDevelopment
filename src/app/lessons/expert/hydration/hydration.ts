import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember, RichText } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Demo data: the boot comparator ──────────────────────────────────────────

/** Which boot path the comparator is showing. */
type Boot = 'destructive' | 'hydrated';

/** One step in a boot path. `bad` marks a step that costs the user something. */
interface BootStep {
  readonly text: string;
  readonly bad?: boolean;
}

/** One boot path: its toggle label, its heading, and the steps it walks through. */
interface BootPath {
  /** Short label for the toggle button. */
  readonly tab: string;
  /** Heading shown above the step list once selected. */
  readonly title: string;
  readonly steps: readonly BootStep[];
}

const BOOT_STEPS: Record<Boot, BootPath> = {
  destructive: {
    tab: 'Without hydration',
    title: 'Destructive re-render',
    steps: [
      { text: 'Server HTML arrives — the visitor already sees real content' },
      { text: 'JS bundles finish downloading; Angular bootstraps' },
      { text: 'Angular throws away every server-rendered node', bad: true },
      { text: 'The whole tree rebuilds from scratch — flicker, layout shift', bad: true },
      { text: 'Focus, text selection and scroll position inside the content are lost', bad: true },
      { text: '`<video>` and `<iframe>` elements reload from the start', bad: true },
      { text: 'App becomes interactive — after paying for a second full render' },
    ],
  },
  hydrated: {
    tab: 'With hydration',
    title: 'provideClientHydration()',
    steps: [
      { text: 'Server HTML arrives, annotated with an `ngh` map' },
      { text: 'JS bundles finish downloading; Angular bootstraps' },
      { text: 'Angular walks the existing DOM instead of rebuilding it' },
      { text: 'Matching nodes are adopted — nothing destroyed, nothing re-created' },
      { text: 'Event listeners attach; any buffered pre-hydration clicks replay' },
      { text: 'No flicker, no layout shift — media keeps playing exactly where it was' },
      { text: 'App becomes interactive — the first render stays the only render' },
    ],
  },
};

// ── Demo data: the mismatch clinic ──────────────────────────────────────────

/** One hydration mismatch: what causes it, and what Angular logs when it happens. */
interface Mismatch {
  readonly label: string;
  readonly error: string;
  readonly cause: string;
  readonly fix: string;
}

const MISMATCHES: readonly Mismatch[] = [
  {
    label: 'Direct DOM manipulation',
    error: 'NG0500 — hydration node mismatch',
    cause:
      'Code (or a third-party script) added or moved DOM nodes outside Angular — `innerHTML` on an `ElementRef`, a jQuery plugin, a cookie banner injecting itself into the page. The server HTML no longer matches what Angular expects to find.',
    fix: 'Move the DOM work into `afterNextRender` (browser-only, runs after hydration), render it through templates instead, or put `ngSkipHydration` on the component hosting the widget.',
  },
  {
    label: 'Invalid HTML nesting',
    error: 'NG0500 — usually surfaces deep inside a table or list',
    cause:
      'The template contains HTML the browser "corrects" while parsing: a `<table>` with no `<tbody>` (the browser inserts one), a block element inside a `<p>` (the browser closes the `<p>` early), nested `<a>` tags. The parsed DOM differs from the template structure, so node matching derails.',
    fix: 'Write HTML the parser can\'t "fix": add the `<tbody>` yourself, never put a block element inside a `<p>`. Run the markup through the W3C validator if the error location looks baffling.',
  },
  {
    label: 'Different server vs client output',
    error: 'NG0500 — text-content mismatch',
    cause:
      'The template renders a value that differs per run: `Date.now()`, `Math.random()`, locale-dependent formatting, or platform-branched markup like `if (isBrowser)` inside the template path.',
    fix: 'Render deterministic values on the server; compute volatile ones after hydration, in `afterNextRender` plus a signal. Server and client must render the same markup, always.',
  },
  {
    label: 'Whitespace / comment differences',
    error: 'silent corruption, or NG0500',
    cause:
      'An HTML minifier, a CDN, or a proxy rewrites the server response — stripping comments, collapsing whitespace — and destroys the `ngh` annotations and node positions hydration relies on.',
    fix: 'Serve the SSR output byte-for-byte: turn off HTML minification and rewriting for document responses specifically.',
  },
  {
    label: 'i18n blocks (older versions)',
    error: 'hydration skipped for the block',
    cause:
      "On older Angular versions, `i18n`-translated regions weren't hydratable at all — Angular fell back to destroying and re-rendering them.",
    fix: 'Modern Angular supports this: add `withI18nSupport()` to `provideClientHydration()`.',
  },
];

/**
 * Lesson: hydration in depth — destructive vs hydrated bootstrap, how DOM
 * adoption actually works (the `ngh` map and the `ng-state` transfer blob),
 * how to confirm it happened at all, the mismatch clinic (NG0500 and
 * friends, dev vs prod), the `ngSkipHydration` / `@defer (hydrate never)`
 * contrast, event replay's real mechanism and limits, and incremental
 * hydration's constraints.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape and teaching order copied from
 * `expert/change-detection`, the reference implementation.
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "the HTML is
 *    already right — watch Angular throw it out", with the destructive-vs-
 *    hydrated boot comparator doing the demonstrating before any vocabulary
 *    arrives.
 * 2. **Analogy next, mechanism after.** "Moving into a furnished apartment"
 *    gives the reader somewhere to put `ngh`, node claiming and NG0500
 *    before those words show up, dramatized a second way as a dialogue
 *    between the server's HTML and the client runtime doing the walk.
 * 3. **Then the same idea in several modes** — annotated server output, a
 *    glossary of the four artifacts involved, a live comparator, a mismatch
 *    clinic, a three-way compare table — because redundancy is the retention
 *    tool, not repetition.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    here assumes the reader can already read the snippet.
 *
 * ## Coverage-sweep material folded in (docs/COVERAGE-SWEEP.md, `expert/hydration`)
 *
 * The previous version never said whether a mismatch is fatal, never showed
 * how to confirm hydration actually happened, never contrasted
 * `ngSkipHydration` with `@defer (hydrate never)` (a near-opposite pair, not
 * siblings), described event replay with no mechanics, and left incremental
 * hydration's constraints unstated. All five are now first-class sections.
 */
@Component({
  selector: 'app-lesson-hydration',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
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
    RichText,
  ],
  styleUrl: './hydration.css',
  templateUrl: './hydration.html',
})
export class Hydration {
  /** The two boot paths, for the toggle. */
  protected readonly boots: readonly Boot[] = ['destructive', 'hydrated'];
  /** The steps each boot path goes through. */
  protected readonly bootSteps = BOOT_STEPS;
  /** The boot path currently shown. */
  protected readonly boot = signal<Boot>('destructive');

  /** The known mismatch causes. */
  protected readonly mismatches = MISMATCHES;
  /** The mismatch being examined, or `null` for none. */
  protected readonly activeMismatch = signal<Mismatch | null>(null);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Rendering & Delivery track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'SSR', id: 'ssr' },
    { label: 'Hydration' },
    { label: 'PWA & Service Worker', id: 'pwa-service-worker' },
  ];

  /**
   * The server's HTML and the client runtime, walking the DOM together —
   * once successfully, once not. This exists because the relationship
   * learners get backwards is thinking hydration re-reads the *markup*; it
   * actually re-reads a *map* the server shipped alongside the markup, and
   * the map — not the HTML itself — is what a mismatch actually breaks.
   */
  protected readonly walkTalk: BubbleTurn[] = [
    {
      who: 'Server HTML',
      says: 'I\'m already painted. Here\'s `ngh="0"` on my root — an index into the map I shipped in `<script id="ng-state">`.',
    },
    {
      who: 'Client runtime',
      says: "Got it. I won't create a single node. I'll walk you, in the order the map describes, and claim what's already here.",
    },
    {
      who: 'Server HTML',
      says: 'This `<header>` is `ngh="1"` — one element, no children of its own. Next sibling after it is the `@for` container.',
    },
    {
      who: 'Client runtime',
      says: "Claimed the header. Advancing into the container — three `<article>`s expected. …That third one isn't what the map said would be there.",
    },
    {
      who: 'Server HTML',
      says: "Then I'm not what I used to be. Something touched me after I was rendered.",
    },
    {
      who: 'Client runtime',
      says: "Then I can't safely adopt this. `NG0500` — this subtree gets destroyed and rebuilt from scratch, same as if hydration never ran here.",
    },
  ];

  /**
   * The mnemonic above ("Map, walk, claim, verify") as a picture, not just a
   * sentence — the same four beats, in order, drawn from the vocabulary the
   * mechanism section builds up (`ngh`, the walk, node claiming). `verify` is
   * marked `warn` because it is the step the mismatch clinic below picks up
   * from: a "no" there is what an `NG0500` actually is.
   */
  protected readonly mechanismFlow: FlowStep[] = [
    {
      label: 'Map',
      detail: 'Server ships `ngh` indexes + the `__nghData__` blob — directions, not DOM.',
    },
    {
      label: 'Walk',
      detail: "Client traverses in the map's exact order. Zero `createElement` calls.",
      tone: 'accent',
    },
    {
      label: 'Claim',
      detail: 'Matching nodes are adopted — listeners attach, nothing is destroyed.',
      tone: 'good',
    },
    {
      label: 'Verify',
      detail: 'Live DOM must match the map exactly, or the walk gives up right there.',
      tone: 'warn',
    },
  ];

  /**
   * Sample: `provideClientHydration`, with `withEventReplay` and
   * `withIncrementalHydration`.
   */
  protected readonly enableSample = `import { provideClientHydration, withEventReplay, withIncrementalHydration }
  from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),           // buffers & replays clicks lost before hydration
      withIncrementalHydration(),  // opts in to @defer (hydrate ...) triggers
    ),
  ],
};`;

  /** Line-by-line walkthrough of {@link enableSample}. */
  protected readonly enableNotes: CodeNote[] = [
    {
      line: 6,
      text: '`provideClientHydration()` is the provider that turns hydration on at all. Leave it out of `providers` and the client bootstrap is the destructive path from the comparator above — full stop.',
    },
    {
      line: 7,
      text: "`withEventReplay()` buffers user events that land in the gap between paint and hydration, then replays them once the real listener attaches. It's an explicit opt-in — `provideClientHydration()` on its own doesn't turn it on.",
    },
    {
      line: 8,
      text: '`withIncrementalHydration()` is what makes `@defer (hydrate ...)` triggers do anything at all — without it, those triggers are silently ignored and the block just hydrates eagerly. Worth knowing: as of Angular v22 this call is **deprecated**, because incremental hydration became the default the moment `provideClientHydration()` is called at all — the flag is kept only for the deprecation window and is slated for removal in v24.',
    },
  ];

  /**
   * Sample: the `ngh` annotations the server emits — the map the client
   * runtime navigates by instead of ever calling its usual create-DOM
   * instructions.
   */
  protected readonly annotatedSample = `<!-- simplified server output: the map the client runtime navigates by -->
<app-root ngh="0">
  <header ngh="1">…</header>
  <!--ngh: container start (the @for block claimed 3 root nodes)-->
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <!--ngh: container end-->
</app-root>
<script id="ng-state" type="application/json">
  { "__nghData__": [...], "transfer-cache": { ... } }
</script>`;

  /** Line-by-line walkthrough of {@link annotatedSample}. */
  protected readonly annotatedNotes: CodeNote[] = [
    {
      line: 2,
      text: "`ngh`'s value isn't the bookkeeping itself — it's an **index** into `__nghData__` in the script tag at the bottom, where the real per-view data (which child components it owns, how its bindings map to DOM nodes) actually lives.",
    },
    {
      line: 3,
      text: 'Every component gets its own `ngh` index, numbered in the order the server created them. `1` here just means "the second entry in that array."',
    },
    {
      line: 4,
      text: 'A `@for` block has no single host element to stamp an `ngh` on — it can produce any number of root nodes. So the server brackets the whole range in HTML comments instead, and the client walks everything between them as one unit.',
    },
    {
      line: 8,
      text: 'The matching close. Between these two markers the runtime already knows from `__nghData__` how many `<article>` siblings to expect — three — so it claims exactly that many and stops.',
    },
    {
      line: 10,
      text: 'This is `TransferState`, not something hydration invented — the same channel Angular already used to avoid re-running an `HttpClient` request the server had made. Hydration just adds its own data to the same blob.',
    },
    {
      line: 11,
      text: 'Two independent payloads sharing one script tag: `__nghData__` is the hydration map every `ngh` attribute points into; `transfer-cache` is unrelated HTTP response caching. Lose this tag — a minifier stripping `<script type="application/json">`, say — and both break at once.',
    },
  ];

  /** Illustration: the one-line summary Angular prints after a hydrated navigation. */
  protected readonly hydrationLogSample =
    'Angular hydrated 42 component(s) and 187 node(s), 2 component(s) were skipped.';

  /**
   * Sample: the `jsaction` contract event replay is actually built on — a
   * plain HTML attribute a single document-root listener reads, not magic.
   */
  protected readonly jsactionSample = `<!-- Angular's own runtime writes this — you never author it by hand: -->
<button jsaction="click:;">Add to cart</button>

<!-- the value after the colon is deliberately empty —
     "buffer this click", not "call a specific handler" -->`;

  /** Line-by-line walkthrough of {@link jsactionSample}. */
  protected readonly jsactionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A reminder, not code: the compiler stamps this attribute onto every element carrying an Angular `(event)` binding, during server rendering. It is generated, never written by a lesson author.',
    },
    {
      line: 2,
      text: '`jsaction="click:;"` is the contract a single document-level listener reads. `click` names the event type to watch for; everything after the colon would normally name a handler to call.',
    },
    {
      line: 4,
      text: 'That handler name is left blank on purpose. It doesn\'t route to a function — it means "remember that this element was touched," because the listener Angular eventually attaches for the real `(click)` binding is the one that will actually run.',
    },
  ];

  /**
   * Sample: incremental hydration with `@defer (hydrate on …)`, which ships
   * the server-rendered markup immediately and attaches its JavaScript only
   * when the trigger fires.
   */
  protected readonly incrementalSample = `@defer (hydrate on viewport) {
  <app-comments />        <!-- server-rendered NOW, visible immediately;
                               its JS loads & attaches when scrolled into view -->
} @placeholder {
  <div>…</div>            <!-- used only on client-side navigation,
                               where there is no server HTML to adopt -->
}

@defer (hydrate never) {
  <app-static-footer />   <!-- stays inert server HTML forever: zero JS shipped -->
}`;

  /** Line-by-line walkthrough of {@link incrementalSample}. */
  protected readonly incrementalNotes: CodeNote[] = [
    {
      line: 1,
      text: "`hydrate on viewport` isn't a placeholder-swap trigger — it controls **when this block's JavaScript attaches** to DOM that already exists.",
    },
    {
      line: 2,
      text: "On the initial SSR document, the real `<app-comments />` markup is what's server-rendered here, immediately — there is nothing dormant about how it looks, only about how much JS is attached to it.",
    },
    {
      line: 4,
      text: '`@placeholder` only matters on a **client-side navigation** into this route, where there is no server HTML to adopt yet. On a hard load this branch never runs at all, because real content already fills its place.',
    },
    {
      line: 9,
      text: "`hydrate never` is a different promise from `@placeholder`: this block's server DOM is kept **forever**, and none of its JavaScript ever ships — contrast that with `ngSkipHydration`, further up this page, which ships and runs all of a component's JS.",
    },
  ];

  /**
   * The self-test: the `ngSkipHydration` / `@defer (hydrate never)` pairing
   * this lesson's exam-trap material builds toward. The distractors are the
   * two ways learners conflate the pair; each `why` names the misconception
   * rather than just restating the right answer (CONTRIBUTING §2A).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'It renders nothing until the visitor interacts with it — same as `@defer (hydrate never)`.',
      why: "That's `hydrate never`'s behavior, not `ngSkipHydration`'s. `ngSkipHydration` doesn't stay inert — it re-renders **eagerly**, just not by adopting the server DOM.",
    },
    {
      text: 'Its server-rendered DOM is thrown away and rebuilt client-side — the same JS cost as if hydration had never run for it.',
      correct: true,
      why: 'Exactly. `ngSkipHydration` is a per-subtree opt-out of **DOM reuse**, not of running the component at all. You still ship and execute every line of its JavaScript.',
    },
    {
      text: 'Angular skips shipping its JavaScript bundle, so it stays static server HTML forever.',
      why: "That's `hydrate never` again. `ngSkipHydration` ships the JS — it just refuses to adopt the DOM that's already there for it.",
    },
    {
      text: 'It hydrates normally, but any NG0500 inside it is suppressed.',
      why: "There's no mismatch to suppress, because hydration is never attempted there in the first place — `ngSkipHydration` removes the subtree from the node-matching walk entirely.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'What exactly happens without `provideClientHydration()`?',
      a: 'The client app discards the server-rendered DOM and re-renders everything from scratch — a visible flicker, layout shift, lost focus and selection, reloaded media. SSR still helped first paint and SEO; the bootstrap is just destructive on top of it.',
    },
    {
      q: 'A mismatch only ever shows up in production. Why would that happen?',
      a: 'Because the **cause** is often something only your production pipeline does — a CDN or reverse proxy minifying documents and stripping comments (killing the `ngh` annotations), or a prod-only third-party script injecting DOM before hydration completes. Nothing about hydration itself behaves differently there; the input it receives does.',
    },
    {
      q: 'Why does a missing `<tbody>` break hydration?',
      a: "The browser's parser inserts one automatically, so the client-side DOM has an extra element the server's `ngh` map never accounted for — node matching derails right there. Hydration needs HTML the parser won't feel the need to correct.",
    },
    {
      q: 'How is `@defer (hydrate on viewport)` different from plain `@defer (on viewport)`?',
      a: "Plain defer renders a placeholder and swaps in the content once triggered — the content isn't there yet. Incremental hydration ships the real, server-rendered content immediately, visible and crawlable, and defers only the JavaScript that makes it interactive.",
    },
    {
      q: 'I keep seeing `withIncrementalHydration()` called explicitly, but I heard it was deprecated?',
      a: "Both are true. It's deprecated as of Angular v22, because incremental hydration became the default the instant you call `provideClientHydration()` at all — the explicit flag turned into a no-op, kept only until its planned removal in v24. Call it anyway on anything targeting an earlier version; that's what actually turns `@defer (hydrate ...)` triggers on there.",
    },
    {
      q: 'A cookie-consent script breaks hydration. What are the options?',
      a: 'Load it after hydration with `afterNextRender`, keep its DOM outside the app root entirely, or wrap the affected region in a component marked `ngSkipHydration` so just that subtree re-renders destructively while the rest of the page hydrates normally.',
    },
  ];
}
