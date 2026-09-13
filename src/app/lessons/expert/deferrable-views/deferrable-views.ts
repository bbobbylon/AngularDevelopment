import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Chain, Receipt, Scribble } from '../../../shared/shapes';
import type { ReceiptRow } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { HeavyWidget } from './heavy-widget/heavy-widget';

/**
 * Lesson: deferrable views — template-level code splitting with @defer. Live
 * demos of the trigger kinds, the compiler mechanics that make the split
 * happen (and silently un-happen), companion-block lifecycles, SSR semantics
 * vs incremental hydration, testing with DeferBlockBehavior, and pitfalls.
 *
 * ## Shape: the Receipt (`shape: 'receipt'`, CONTRIBUTING §2C)
 *
 * The opening block is a bill, not a problem statement. Deck → the anomaly
 * with numbers (`.bf-say`) → `app-receipt` itemising a typical first paint
 * with the eager chart as the line that is wrong → `app-scribble` naming the
 * gap → `app-compare` (eager vs deferred, same template) → "The mechanism"
 * → `app-chain` (trigger → import() → chunk → render) → the four-block
 * `app-code-lab` with three scribbles quoting its lines → `app-brain-power`
 * left open (the build that didn't shrink) → one `app-quiz` → the closing
 * `.bf-big` verdict. No napkin opens it; the Brain Power is answered only in
 * "Under the hood", by the eager-reference Predict and the rule that follows.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); the material after the block keeps the teaching
 * order of `expert/change-detection`, the reference implementation.
 *
 * 1. **The bill before the mechanism.** The reader reacts to a total before
 *    `@defer` is explained — the shape's whole bet.
 * 2. **Analogy next, states after.** A restaurant that cooks to order
 *    instead of running a buffet gives the reader somewhere to put
 *    `@placeholder`/`@loading`/`@error`; the buffet-line trap (a dish also
 *    served eagerly elsewhere can't be made-to-order for free) is held back
 *    until the compiler section, where it answers the Brain Power.
 * 3. **Then the same idea in several modes** — four companion-block cards, a
 *    state-flow diagram of the chain with each state's job, all seven
 *    triggers as a reference table, and four live interactive demos —
 *    because redundancy across modes is the retention tool, not repetition
 *    within one.
 * 4. **The mechanism-bearing snippets are annotated line by line** via
 *    `app-code-lab`: the four blocks, the compiler's actual output, and the
 *    SSR plain-vs-hydrate contrast. The two purely illustrative samples (this
 *    app's own usage, the testing snippet) stay plain — already explained
 *    fully by the surrounding prose, same as `schedulingSample` in the
 *    reference lesson.
 */
@Component({
  selector: 'app-lesson-deferrable-views',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    BrainPower,
    Chain,
    Receipt,
    Scribble,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    HeavyWidget,
  ],
  styleUrl: './deferrable-views.css',
  templateUrl: './deferrable-views.html',
})
export class DeferrableViews {
  /**
   * Whether the deferred widget's trigger has fired.
   */
  protected readonly showWidget = signal(false);

  // ── The receipt (opening block) ────────────────────────────────────────────

  /**
   * A typical dashboard's first paint, itemised. Illustrative numbers, kept
   * consistent everywhere they recur (the `.bf-say`, the scribble's 57%, the
   * Brain Power's 530 kB `main.js`): 212 kB of shell plus 318 kB of chart is
   * the 530 kB `main.js`; with 31 kB of CSS the bill comes to 561 kB. The
   * chart is `warn` because it is the line the whole lesson is about.
   */
  protected readonly bill: readonly ReceiptRow[] = [
    { label: 'main.js · the app shell', amount: '212 kB' },
    { label: 'main.js · chart widget, eager', amount: '318 kB', tone: 'warn' },
    { label: 'styles.css', amount: '31 kB', tone: 'muted' },
  ];

  /** The total line of {@link bill}. */
  protected readonly billTotal: ReceiptRow = { label: 'TOTAL · first paint', amount: '561 kB' };

  /**
   * Sample (left side of the compare): the chart referenced eagerly, which is
   * how it ended up on every visitor's bill.
   */
  readonly eagerSample = `<section class="dashboard">
  <app-kpi-strip [totals]="totals()" />
  <app-chart [data]="sales()" />      <!-- 318 kB, inside main.js, for everyone -->
</section>`;

  /**
   * Sample (right side of the compare): the same template with the chart
   * behind a viewport trigger. Nothing else changes — that is the point of
   * putting the two side by side.
   */
  readonly deferredSample = `<section class="dashboard">
  <app-kpi-strip [totals]="totals()" />
  @defer (on viewport) {
    <app-chart [data]="sales()" />    <!-- its own chunk, fetched on scroll -->
  } @placeholder {
    <div class="chart-skeleton"></div>
  }
</section>`;

  /**
   * The mechanism as one line, read before the code that implements it: a
   * deferred block doesn't shrink anything, it puts one `import()` on the far
   * side of a trigger. The states the *user* sees while this runs are the
   * `mechanismFlow` further down.
   */
  protected readonly pipeline: readonly string[] = [
    'trigger fires',
    'import()',
    'chunk downloads',
    'render',
  ];

  /**
   * The block's self-test: what a non-scrolling visitor actually pays for
   * once the chart is deferred. The three distractors are the three ways the
   * split gets misread — as skipping the companions too, as "later" instead
   * of "never", and as a per-file rather than per-dependency split — and each
   * `why` names that misreading (CONTRIBUTING §2A).
   */
  protected readonly receiptQuizOptions: QuizOption[] = [
    {
      text: 'Nothing at all — Angular skips the whole block, skeleton included, until the trigger fires.',
      why: "The companions aren't lazy. `@placeholder`, `@loading` and `@error` all ship in the main bundle — that's how the skeleton can be on screen before any chunk exists. Only the deferred content leaves.",
    },
    {
      text: 'The skeleton and the trigger wiring — a few hundred bytes. The chart chunk is never requested.',
      correct: true,
      why: "Right. The compiler moved the chart's import to the far side of `on viewport`, and that trigger never fired — so `import()` never ran and the chunk was never fetched. That's the 318 kB line coming off this visitor's bill.",
    },
    {
      text: 'The full 318 kB, just later — after first paint, in the background.',
      why: "That describes `prefetch on idle` (or a plain `on idle`), which fetches the chunk during quiet time whether or not it's ever needed. A bare `on viewport` fetches nothing until the placeholder is actually seen.",
    },
    {
      text: "The chart's TypeScript, but not its template or styles — those stay in `main.js`.",
      why: "The split is per **dependency**, not per file. A component's class, compiled template and styles are one module, and `import()` moves all of it or none of it.",
    },
  ];

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer' },
    { label: 'Performance', id: 'performance' },
    { label: 'afterRender', id: 'after-render' },
  ];

  /**
   * The `pipeline` chain from the opening block, seen from the user's side:
   * what is on screen at each beat, in order. `@error` isn't a real fifth
   * state — it's the alternate ending, marked `warn` because it's the one the
   * pitfalls section below picks up from.
   */
  protected readonly mechanismFlow: FlowStep[] = [
    { label: '@placeholder', detail: 'Shown immediately — ships eagerly in the main bundle.' },
    {
      label: 'Trigger fires',
      detail: 'viewport, interaction, hover, timer, idle, or `when` turns true.',
      tone: 'accent',
    },
    { label: '@loading', detail: 'Shown while the lazy chunk downloads.' },
    {
      label: 'Content',
      detail: 'The chunk arrives and renders — the only part ever deferred.',
      tone: 'good',
    },
    {
      label: '@error (instead)',
      detail: 'The `import()` rejected — offline, or a deploy pruned the chunk.',
      tone: 'warn',
    },
  ];

  /**
   * Sample: the four blocks — `@defer`, `@placeholder`, `@loading`, `@error` —
   * around the chart from the receipt, and the triggers that move between
   * them. Same nine lines as the right side of the compare, with the two
   * optional companions added.
   */
  readonly blocksSample = `@defer (on viewport) {
  <app-chart [data]="sales()" />        <!-- ← only this is lazy-loaded -->
} @placeholder (minimum 500ms) {
  <div class="chart-skeleton"></div>    <!-- stays in main bundle -->
} @loading (after 100ms; minimum 500ms) {
  <p>Fetching chart…</p>
} @error {
  <p>Chart failed to load.</p>
}`;

  /** Line-by-line walkthrough of {@link blocksSample}. */
  protected readonly blocksNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@defer` opens the block and names its trigger — `on viewport` here. Nothing inside runs yet; this line only says *when* to start.',
    },
    {
      line: 2,
      text: 'The 318 kB line from the receipt — and the only line in this whole sample that ends up in a separate chunk. Every companion block below ships in the main bundle no matter what.',
    },
    {
      line: 3,
      text: "`@placeholder` is what's on screen **right now**, before the trigger fires. `(minimum 500ms)` keeps it up at least that long even if the trigger fires almost instantly, so it never flashes for one frame.",
    },
    {
      line: 5,
      text: '`@loading` replaces the placeholder once the chunk starts downloading. `after 100ms` skips it entirely for fast loads; `minimum 500ms` stops it flickering once it does appear.',
    },
    {
      line: 7,
      text: '`@error` is reachable only if the dynamic `import()` itself rejects — offline, or a deploy that pruned the chunk hash this build expects.',
    },
  ];

  /**
   * Sample: what the compiler turns a `@defer` block into, so the lazy chunk is
   * not magic.
   */
  readonly underHoodSample = `// what you write:
@defer (on viewport) { <app-chart /> }

// what the compiler emits (conceptually):
ɵɵdefer(/* … */, () => [
  import('./chart.component').then(m => m.Chart),   // ← real dynamic import
]);
// the bundler sees import() → emits chart-XXXX.js as its own chunk
//
// BUT: one eager <app-chart /> anywhere in the same template, and the
// compiler must import it statically — the chunk quietly disappears.`;

  /** Line-by-line walkthrough of {@link underHoodSample}. */
  protected readonly underHoodNotes: CodeNote[] = [
    {
      line: 2,
      text: 'One line of template. No dynamic import written by hand anywhere — the whole mechanism is the compiler reading this syntax.',
    },
    {
      line: 5,
      text: "`ɵɵdefer` is Angular's internal instruction for a deferred block — never written by hand, only ever emitted by the compiler. `/* … */` stands in for the trigger and template-function arguments this sample skips.",
    },
    {
      line: 6,
      text: "This is the real work: a genuine `import()` call, the same syntax a bundler already knows how to split on. Angular didn't invent lazy loading here — it generated the standard mechanism for you.",
    },
    {
      line: 8,
      text: "The bundler's job, not Angular's — it recognizes `import()` as a split point and writes `chart-XXXX.js` as its own file, fetched only when that function actually runs.",
    },
    {
      line: 10,
      text: "The trap. `@defer` only controls **when** the import call executes — it has no power over whether that's the *only* place the component is referenced.",
    },
    {
      line: 11,
      text: "A second, eager `<app-chart />` needs its own static import, and a module only gets imported once — so the compiler can't split what it must also import eagerly. The component quietly moves back into the main bundle, and the `@defer` around the first usage keeps functioning (placeholder, trigger, states) while saving nothing.",
    },
  ];

  /**
   * Sample: this app's own use of `@defer` on the lesson grid, including
   * `prefetch on idle`.
   */
  readonly appUsageSample = `@defer (on viewport; prefetch on idle) {
  <div class="grid">
    <!-- lesson cards for each level -->
  </div>
} @placeholder {
  <div class="grid">
    <!-- shimmer skeleton cards (same size → no layout shift) -->
  </div>
}`;

  /**
   * Sample: `@defer` under SSR. The server renders the placeholder, so a plain
   * trigger means the real content only ever appears after hydration — `hydrate on`
   * triggers are what change that.
   */
  readonly hydrationSample = `<!-- plain trigger + SSR: server renders the PLACEHOLDER -->
@defer (on viewport) { <app-reviews /> } @placeholder { <div class="skeleton"></div> }

<!-- hydrate trigger + SSR: server renders the CONTENT, JS arrives lazily -->
@defer (hydrate on viewport) { <app-reviews /> }
@defer (hydrate never)       { <app-static-footer /> }   <!-- never ships JS -->

// app.config.server / client:
provideClientHydration(withIncrementalHydration())`;

  /** Line-by-line walkthrough of {@link hydrationSample}. */
  protected readonly hydrationNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A plain trigger has no idea SSR is even happening. The server has no chunk to fetch, so it renders exactly what it would show before the trigger fires: the placeholder — never the real content.',
    },
    {
      line: 5,
      text: 'Adding `hydrate` changes what the **server** renders, not just the client. It now renders `<app-reviews />` itself — full markup, visible and crawlable on first paint — and only its JavaScript waits for the viewport trigger.',
    },
    {
      line: 6,
      text: "`hydrate never` is the extreme end of the same idea: this subtree's server HTML is permanent. No JS for it ships, ever, on this route.",
    },
    {
      line: 9,
      text: "`withIncrementalHydration()` is what makes every `hydrate` trigger above mean anything — omit it and they're silently ignored, hydrating eagerly instead. As of Angular v22 this call is deprecated: incremental hydration is on by default the moment `provideClientHydration()` is called at all, and the flag survives only for the deprecation window.",
    },
  ];

  /**
   * Sample: testing deferred blocks with `DeferBlockBehavior.Manual`, which stops
   * the states auto-playing so each can be asserted on.
   */
  readonly testingSample = `TestBed.configureTestingModule({
  deferBlockBehavior: DeferBlockBehavior.Manual,   // don't auto-play states
});
const fixture = TestBed.createComponent(Dashboard);

const [block] = await fixture.getDeferBlocks();
await block.render(DeferBlockState.Loading);      // assert the spinner
await block.render(DeferBlockState.Complete);     // assert the real content
await block.render(DeferBlockState.Error);        // assert the fallback`;

  /**
   * The self-test: the `when` one-way-door trap Demo 4 proves live. The
   * distractors are the three ways learners conflate `when` with `@if`; each
   * `why` names the misconception rather than just restating the right
   * answer (CONTRIBUTING §2A).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'The `@placeholder` comes back — `when` is just a condition, like `@if`.',
      why: "That's `@if`'s job, not `when`'s. `when` only ever answers one question — *should this load?* — and once the answer has been yes, Angular never asks again.",
    },
    {
      text: 'The already-loaded content stays exactly where it was.',
      correct: true,
      why: "Right — loading is a one-way door. Angular fetched the chunk and rendered it once; toggling the expression back to false doesn't unload or hide anything. For show/hide behavior after loading, nest an `@if` *inside* the deferred content itself.",
    },
    {
      text: 'Angular throws an error, because the trigger expression went false after the block had already loaded.',
      why: "Nothing about `@defer` watches its trigger for *staying* true — only for *becoming* true, the first time. There's no error; there's just nothing happening, which is the part that catches people out.",
    },
    {
      text: 'The chunk is re-fetched from the network the next time `isReady()` turns true again.',
      why: "The chunk is already in the browser's module cache after the first fetch. There's no second network request to make, and no second trigger to wait for either — the block already loaded.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "I added `@defer` but the bundle didn't shrink. Most likely cause?",
      a: 'The deferred component is also referenced eagerly — used elsewhere in the same template, or inside another eagerly-loaded component. Any eager reference forces it into the main bundle; the `@defer` block still functions but splits nothing. Check the production build output for the chunk you expect.',
    },
    {
      q: 'Why does `@defer (on viewport)` demand a `@placeholder`?',
      a: 'Before loading, the block renders nothing — there would be no DOM node for the `IntersectionObserver` to watch. The placeholder (a single root element) is the observed target; alternatively, pass an explicit reference with `on viewport(someRef)`.',
    },
    {
      q: "The component I want to defer isn't standalone yet. Can I still `@defer` it?",
      a: "No — only standalone components, directives and pipes are deferrable. An `NgModule`-declared dependency can't be split this way, because the compiler can't rewrite an `NgModule`'s eager import graph into a dynamic one for just this usage.",
    },
    {
      q: 'Difference between `prefetch on idle` and just `on idle`?',
      a: '`on idle` fetches *and renders* when the browser goes idle. `prefetch on idle; on interaction` downloads the chunk during idle time but keeps showing the placeholder until the user actually interacts — instant render at interaction time, zero wasted rendering if they never do.',
    },
    {
      q: 'With SSR, what HTML does a plain `@defer (on viewport)` emit versus `@defer (hydrate on viewport)`?',
      a: "Plain: the placeholder's HTML — the real content loads client-side after scroll. `hydrate`: the full content's HTML (great for SEO and LCP), with its JS chunk and hydration itself deferred until scrolled into view. Incremental hydration requires `withIncrementalHydration()` on `provideClientHydration()`.",
    },
  ];
}
