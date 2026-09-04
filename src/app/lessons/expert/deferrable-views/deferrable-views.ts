import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { HeavyWidget } from './heavy-widget/heavy-widget';

/**
 * Lesson: deferrable views — template-level code splitting with `@defer`. Live
 * proof of every trigger kind (including pointing one at an element elsewhere
 * on the page), the compiler mechanics that make a chunk exist and the single
 * mistake that silently makes it stop existing, a real `ng build` before/after
 * showing the split by the numbers, companion-block lifecycles, SSR semantics
 * versus incremental hydration (and the client-navigation trap that catches
 * almost everyone who ships `hydrate` triggers), testing with
 * `DeferBlockBehavior`, and the pitfalls that show up in production and on
 * an exam.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (`shared/brain/`); shape and teaching
 * order copy `expert/change-detection`, the reference implementation:
 *
 * 1. **Pose the problem before naming the fix.** The lesson opens on "your
 *    whole bundle ships on day one, whether anyone opens that panel or not,"
 *    and makes the reader commit to a guess about a concrete 200 KB chart
 *    before `@defer` is named at all.
 * 2. **Analogy next, mechanism after.** The buffet-versus-restaurant frame
 *    gives the four companion blocks somewhere to attach before their names
 *    (`@placeholder`/`@loading`/`@error`) show up as vocabulary to memorise.
 * 3. **The same idea in several modes** — a `Flow` lifecycle diagram, an
 *    annotated companion-block sample, a row of `TapeCard`s, and a `Bubbles`
 *    dialogue walking the compile-time decision — because the retention bar
 *    is redundancy *across modes*, not the same paragraph said four times.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    here assumes the reader can already read a `@defer` block; the whole
 *    audience is here because they cannot yet.
 *
 * The five live demos from the previous version of this lesson all survive
 * (on interaction, on timer, on hover + prefetch on idle, the `when` one-way
 * door) with one added: a trigger pointed at an element that lives nowhere
 * near the block it loads, which is the coverage-sweep gap this rewrite
 * closes alongside the hydrate/client-navigation trap and a real chunk-table
 * verification.
 */
@Component({
  selector: 'app-lesson-deferrable-views',
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
    HeavyWidget,
  ],
  styleUrl: './deferrable-views.css',
  templateUrl: './deferrable-views.html',
})
export class DeferrableViews {
  /**
   * Whether the signal-controlled defer block's trigger has fired. Loading is
   * one-way: setting this back to `false` does not un-render the block, which
   * is the whole point of the demo it drives.
   */
  protected readonly showWidget = signal(false);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer' },
    { label: 'Performance', id: 'performance' },
    { label: 'After Render', id: 'after-render' },
  ];

  /**
   * The lifecycle a block moves through, top to bottom, with `@error` as the
   * one other place it can end up. A different mode from {@link blocksSample}
   * on purpose — this is the *order things happen in*, which a code sample
   * shows only implicitly.
   */
  protected readonly lifecycleSteps: FlowStep[] = [
    { label: 'Placeholder up', detail: '`@placeholder` renders — nothing has been asked for yet' },
    {
      label: 'Trigger fires',
      detail: 'viewport, interaction, hover, timer, idle, or `when` turns true',
      tone: 'accent',
    },
    {
      label: 'Chunk fetches',
      detail: '`@loading` shows only if this takes long enough to be worth showing',
    },
    {
      label: 'Content renders',
      detail: 'swaps in for good — nothing here ever reverses',
      tone: 'good',
    },
    {
      label: '…or: @error',
      detail: 'the `import()` rejected — offline, or a deploy pruned the old hash',
      tone: 'warn',
    },
  ];

  /** Caption for {@link lifecycleSteps}, kept in the class to avoid an `@` in a template attribute. */
  protected readonly lifecycleCaption =
    'The top path runs exactly once, start to finish; `@error` is the only other place it can end up.';

  /**
   * Sample: the four companion blocks — `@defer`, `@placeholder`, `@loading`,
   * `@error` — and the triggers/timings that move between them.
   */
  protected readonly blocksSample = `@defer (on viewport) {
  <app-heavy-widget />
} @placeholder (minimum 500ms) {
  <p>Nothing needed yet — this is what ships on day one</p>
} @loading (after 100ms; minimum 500ms) {
  <p>Fetching the chunk…</p>
} @error {
  <p>Couldn't load it.</p>
}`;

  /** Line-by-line walkthrough of {@link blocksSample}. */
  protected readonly blocksNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@defer` opens the block; `(on viewport)` is the trigger — the condition that has to happen before Angular fetches anything at all.',
    },
    {
      line: 2,
      text: 'The only line in this entire sample that ends up in its own chunk. Everything else here ships in the main bundle no matter what.',
    },
    {
      line: 3,
      text: '`@placeholder` is what is on screen right now, before the trigger fires. `minimum 500ms` keeps it up at least that long even if the chunk arrives instantly, so it never flashes for one frame.',
    },
    {
      line: 5,
      text: '`@loading` shows only while the chunk is actually downloading. `after 100ms` skips it on fast connections; `minimum 500ms` stops it blinking on and straight back off for slow ones.',
    },
    {
      line: 7,
      text: "`@error` renders if the dynamic `import()` this compiles to actually rejects — offline, or a deploy that pruned the chunk's old hash.",
    },
  ];

  /**
   * The exchange that decides, once, at compile time, whether a component
   * ever ships eagerly at all — a different mode from {@link underHoodSample}
   * for the same mechanism.
   */
  protected readonly compileTalk: BubbleTurn[] = [
    {
      who: 'Template',
      says: 'I only use `<app-chart />` inside this `@defer` block — nowhere else in the file.',
    },
    {
      who: 'Compiler',
      says: "Noted. Then I don't need Chart in the eager output at all — I'll turn that reference into a real `import()` call instead.",
    },
    {
      who: 'Bundler',
      says: "I see that `import()`. I'll cut `chart-7F3A21.js` into its own file and leave it out of the main bundle.",
    },
    {
      who: 'Browser',
      says: "Nobody has asked for `chart-7F3A21.js` yet, so I have not fetched it — your visitor's first paint never waits on it.",
    },
    {
      who: 'Trigger',
      says: "Viewport says it's on screen now. Fetching `chart-7F3A21.js`… done. Swapping it in.",
    },
  ];

  /**
   * Sample: what the compiler turns a `@defer` block into, so the lazy chunk
   * is not magic — and where the "silent un-split" actually happens.
   */
  protected readonly underHoodSample = `// what you write:
@defer (on viewport) {
  <app-chart />
}

// what the compiler emits (conceptually):
ɵɵdefer(/* … */, () => [
  import('./chart.component').then((m) => m.Chart),   // ← real dynamic import
]);
// the bundler sees that import() and cuts chart-7F3A21.js into its
// own chunk — fetched only once the trigger fires.

// BUT: reference <app-chart /> eagerly ANYWHERE ELSE in this same
// template, and the compiler must import Chart statically too —
// the chunk quietly disappears, even though the @defer block
// still "works" (triggers fire, states swap) — it just saves
// nothing.`;

  /** Line-by-line walkthrough of {@link underHoodSample}. */
  protected readonly underHoodNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The trigger you actually write. Everything below it happens at compile/build time — you never see this code yourself.',
    },
    {
      line: 3,
      text: '`<app-chart />` used only inside `@defer` — that is what makes it *eligible* to be split at all.',
    },
    {
      line: 7,
      text: 'The compiled instruction (the name and arguments are illustrative — the real one is not public API). What matters is the array of loader functions it is handed.',
    },
    {
      line: 8,
      text: "A genuine dynamic `import()`. This exact call — the one the bundler's own static analysis looks for — is what turns into a separate file on disk.",
    },
    {
      line: 13,
      text: "This whole comment is the #1 way `@defer`'s savings quietly evaporate: the block still fires, the states still swap, the trigger still works — it just no longer saves a single byte, because Chart has to sit in the main bundle anyway for the eager reference.",
    },
  ];

  /**
   * Sample: pointing a trigger at an element that is not the block's own
   * placeholder — the trigger-element-reference form (coverage-sweep gap).
   */
  protected readonly triggerRefSample = `<button #loadTrigger type="button">Load the widget below ↓</button>

<!-- … further down the very same template … -->

@defer (on interaction(loadTrigger)) {
  <app-heavy-widget />
} @placeholder {
  <p>Waiting for the button above…</p>
}`;

  /** Line-by-line walkthrough of {@link triggerRefSample}. */
  protected readonly triggerRefNotes: CodeNote[] = [
    {
      line: 1,
      text: '`#loadTrigger` is a template reference variable — it just names this element so something else in the same template can point at it. On its own it does nothing.',
    },
    {
      line: 5,
      text: 'The name in parentheses after the trigger word says "watch clicks on THAT element, not on my own placeholder." It has to live in the same template as the block, and it cannot be inside another block that is itself deferred.',
    },
    {
      line: 7,
      text: 'Still required, even though it is no longer the thing being watched — `@placeholder` is what is actually on screen until `loadTrigger` is clicked.',
    },
  ];

  /**
   * Sample: `@defer` under SSR. The server renders the placeholder for a
   * plain trigger, so the real content only ever appears after hydration —
   * `hydrate on` triggers are what change that, and only during hydration.
   */
  protected readonly hydrationSample = `<!-- plain trigger + SSR: the SERVER renders the PLACEHOLDER -->
@defer (on viewport) {
  <app-reviews />
} @placeholder {
  <div class="skeleton"></div>
}

<!-- hydrate trigger + SSR: the SERVER renders the CONTENT itself -->
@defer (hydrate on viewport) {
  <app-reviews />
}

<!-- hydrate never: this block's JS is never shipped to the client -->
@defer (hydrate never) {
  <app-static-footer />
}

// app.config.ts (server AND client providers):
provideClientHydration(withIncrementalHydration())`;

  /** Line-by-line walkthrough of {@link hydrationSample}. */
  protected readonly hydrationNotes: CodeNote[] = [
    {
      line: 2,
      text: 'No `hydrate` keyword — under SSR this block has not been triggered yet at render time, so the server has nothing real to send for it.',
    },
    {
      line: 5,
      text: 'This is what actually ships in the server-rendered HTML in that case: the placeholder, not the reviews.',
    },
    {
      line: 9,
      text: '`hydrate` paired with the ordinary trigger word. This is the one that changes what the SERVER does, not only the client.',
    },
    {
      line: 10,
      text: "Same component, same trigger word — but now the FULL markup is what the server emits. Only the JavaScript (event wiring, this component's own change detection) waits for the trigger, client-side.",
    },
    {
      line: 14,
      text: "The strongest form: this block's JS is never shipped, ever — ideal for content that is genuinely done once it has painted.",
    },
    {
      line: 19,
      text: '`withIncrementalHydration()` is what makes every `hydrate` keyword above mean anything at all. Leave it off and they are silently ignored — see the trap below.',
    },
  ];

  /**
   * Sample: testing deferred blocks with `DeferBlockBehavior.Manual`, which
   * stops the states auto-playing so each can be asserted on deliberately.
   */
  protected readonly testingSample = `TestBed.configureTestingModule({
  deferBlockBehavior: DeferBlockBehavior.Manual,   // stop the states auto-playing
});
const fixture = TestBed.createComponent(Dashboard);

const [block] = await fixture.getDeferBlocks();
await block.render(DeferBlockState.Placeholder);  // assert the placeholder markup
await block.render(DeferBlockState.Loading);      // assert the spinner
await block.render(DeferBlockState.Complete);     // assert the real content
await block.render(DeferBlockState.Error);        // assert the fallback`;

  /** Line-by-line walkthrough of {@link testingSample}. */
  protected readonly testingNotes: CodeNote[] = [
    {
      line: 2,
      text: '`DeferBlockBehavior.Manual` turns off the default auto-play through placeholder → loading → complete. Without it, an assertion races against whichever state happened to be current when it ran.',
    },
    {
      line: 6,
      text: 'One `DeferBlockFixture` per `@defer` block in the component, in template order. `await` because getting there involves a microtask.',
    },
    {
      line: 7,
      text: 'Forces the block into exactly that state so you can assert against known markup — nothing is "played," the fixture jumps there directly.',
    },
    {
      line: 8,
      text: "The state your `@loading` block's own markup renders in — where you would assert a spinner or skeleton appears.",
    },
    {
      line: 9,
      text: 'The real content. The state where you assert your actual component rendered correctly — the one a naive auto-playing test usually reaches by accident, racily.',
    },
    {
      line: 10,
      text: 'Forces the failure branch without needing a real network failure to reproduce it.',
    },
  ];

  /** The "when is a one-way door" prediction, tied to the live demo above it. */
  protected readonly whenPredictPrompt =
    'You click "Set showWidget = true" below, wait for the widget to load, then click "Set it back to false." `showWidget()` really is `false` again now, in memory. What renders?';

  protected readonly whenPredictAnswer =
    'The widget stays exactly as it was — still rendered, unchanged. `@defer (when expr())` only controls when Angular STARTS loading the block; it is a one-way door, not a visibility switch, so there is no value of `expr()` that can un-render something once loading has already happened. Want a block that genuinely hides again? Wrap its content in a plain `@if` INSIDE the block, and drive that with its own condition, independent of the trigger.';

  /**
   * The self-test. The hydrate/client-navigation trap is the highest-priority
   * gap this rewrite closes — flagged as a high-severity exam trap because it
   * looks like a bug rather than documented behaviour.
   */
  protected readonly hydrateQuizOptions: QuizOption[] = [
    {
      text: 'The chunk must already be cached in the browser from the earlier visit.',
      why: 'Try it on a route the browser has never loaded this session — same result. Caching is not what is happening here; the trigger itself behaves differently, not the network.',
    },
    {
      text: '`hydrate` triggers only mean something during hydration of a server-rendered load. A client-side navigation never hydrates anything, so the trigger falls back to its plain meaning — and since no plain trigger was written, the block just renders eagerly.',
      correct: true,
      why: '`hydrate on viewport` is really two instructions bundled into one: how to behave during SSR hydration, and — implicitly — how to behave otherwise. Write only the hydrate half, and "otherwise" has no trigger left to wait for at all.',
    },
    {
      text: '`on viewport` is the wrong trigger here — it should be `on immediate`.',
      why: 'The trigger word was never the problem; `on viewport` behaves correctly for the SSR path this block was written for. Swapping it would not change what happens on a client-side navigation.',
    },
    {
      text: 'This is a framework bug — `hydrate on viewport` should behave identically no matter how the page was reached.',
      why: 'It is documented behaviour, not a bug. `hydrate` specifically modifies what happens *during* hydration; off that path there is nothing for it to modify, and this block was never given a trigger for the non-hydration case.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "My `@defer` block runs perfectly — states, trigger, everything — but the bundle didn't get smaller. What did I do wrong?",
      a: "Probably nothing in the block itself. Something else in the same template (or the class) still references the same component eagerly, and any eager reference forces Angular to import it statically — the block still fires correctly, it just is not saving anything. Check the build output for the chunk you expect; see 'Trust, but verify' below for what that looks like.",
    },
    {
      q: "Why does `on viewport` need a `@placeholder`, but `on timer(2s)` doesn't complain if I skip it?",
      a: '`on viewport`, `on interaction` and `on hover` all need a real DOM node to attach an observer or a listener to, and before the trigger fires there is no rendered content yet — so that node has to be the placeholder, or an element you name explicitly. `on timer` and `on idle` do not watch anything on the page at all, they just wait, so there is nothing to attach to. Skipping the placeholder there compiles fine — though the reader still sees nothing at all until the timer fires, which is its own kind of bad.',
    },
    {
      q: 'What is the actual difference between `on idle` and `prefetch on idle`?',
      a: '`on idle` alone fetches the chunk AND swaps it in the moment the browser goes idle. `prefetch on idle` only downloads the chunk during idle time — it keeps the placeholder up until whatever your real trigger is actually fires. Pair them, `on interaction; prefetch on idle`, and you get both: an instant swap at interaction time, because the bytes were already sitting there.',
    },
    {
      q: 'Can `@defer` go inside `@for`?',
      a: 'Yes, and it compiles — but N items means N separate defer blocks, each registering its own trigger (its own `IntersectionObserver` entry, its own timer, whatever). That is real, if individually cheap, per-item overhead. Past a few dozen items, defer the list as a whole instead, or virtualize it.',
    },
    {
      q: 'Does the element I point a trigger at have to be near the `@defer` block, or even visible?',
      a: 'It has to exist in the rendered DOM — `on viewport(ref)` cannot watch something an `@if` removed — but it does not have to be near the block, or be its placeholder at all. A button at the very top of a page can legitimately trigger a block far below it, which is exactly what the demo above does.',
    },
  ];
}
