import {
  Component,
  ElementRef,
  afterEveryRender,
  afterNextRender,
  afterRenderEffect,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: the render hooks in depth — why `afterNextRender`/`afterEveryRender` replaced
 * the `ngAfterViewInit`-for-DOM-work habit, the phase system that prevents layout
 * thrashing, `afterRenderEffect` as the dependency-gated third option, the hooks'
 * lifetime (`AfterRenderRef.destroy()`, `DestroyRef` auto-cleanup, `onCleanup`), and the
 * third-party-widget recipe rebuilt around the current API.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `docs/UI-DESIGN.md` §9), copying
 * the shape of `expert/change-detection` — the reference implementation.
 *
 * The lesson is organised around three genuinely separable questions, mirrored from the
 * reference lesson's own three-question spine so the two pages teach the reader the same
 * *kind* of structure even though the content differs:
 *
 * 1. **Frequency** — how many times does a hook fire? `afterNextRender` once,
 *    `afterEveryRender` every render forever, `afterRenderEffect` only when a signal it
 *    reads actually changed. Proven with a three-counter live demo, not just stated.
 * 2. **Discipline** — what is a hook allowed to do while it runs? The phase system
 *    (`earlyRead` → `write` → `mixedReadWrite` → `read`), including the fact that a bare
 *    callback — for any of the three functions — always lands in `mixedReadWrite`, and
 *    the twist that `afterRenderEffect`'s phases thread a `Signal` between them where the
 *    plain hooks thread a raw value.
 * 3. **Lifetime** — how long does a hook stick around? `AfterRenderRef.destroy()`,
 *    `DestroyRef` auto-cleanup (and how passing the wrong injector defeats it), and
 *    `onCleanup` for undoing one run before the next.
 *
 * The analogy — "render hooks are building inspectors, not architects" — is introduced
 * before any of the three functions are named, per the standing teaching order (pose the
 * problem, then the mental model, then mechanism, then the same idea in several modes).
 */
@Component({
  selector: 'app-lesson-after-render',
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
  ],
  styleUrl: './after-render.css',
  templateUrl: './after-render.html',
})
export class AfterRender {
  /**
   * The element the measuring demo measures.
   */
  private readonly box = viewChild<ElementRef<HTMLElement>>('boxEl');
  /**
   * Where the `afterNextRender` run count is written directly to the DOM.
   */
  private readonly onceEl = viewChild<ElementRef<HTMLElement>>('onceEl');
  /**
   * Where the `afterEveryRender` run count is written directly to the DOM.
   */
  private readonly everyEl = viewChild<ElementRef<HTMLElement>>('everyEl');

  /**
   * The requested width, driven by the slider. Also the one dependency the
   * `afterRenderEffect` counter below actually reads.
   */
  protected readonly boxWidth = signal(60);
  /**
   * The width actually measured from the DOM after render.
   */
  protected readonly measuredPx = signal(0);
  /**
   * Renders forced, to prove `afterEveryRender` fires whether or not `boxWidth` moved.
   */
  protected readonly ticks = signal(0);
  /**
   * How many times the `afterRenderEffect` counter has run. A signal, deliberately —
   * unlike the two counters below, this hook never reads `effectRuns` itself, so writing
   * it here cannot create a self-triggering loop. See the "rule" remember box on the page
   * for why the other two counters may not do the same thing.
   */
  protected readonly effectRuns = signal(0);

  /**
   * How many times the once-hook has run. Stays at one, which is the demo. A plain field,
   * not a signal — see the constructor for why.
   */
  private onceRuns = 0;
  /**
   * How many times the every-render hook has run. A plain field, not a signal.
   */
  private everyRuns = 0;

  /**
   * Registers all three hooks.
   *
   * The first two write to the DOM **directly** rather than to a signal, and that is not
   * incidental: a signal write inside `afterEveryRender` marks this view dirty, which
   * schedules another render, which runs the hook again — an infinite loop. The third
   * hook writes a signal on purpose, to show that the same move is safe there for a
   * specific reason: it does not read the signal it writes, so the write cannot make
   * itself dirty again.
   */
  constructor() {
    afterNextRender(() => {
      this.measure();
      this.onceRuns++;
      const el = this.onceEl()?.nativeElement;
      if (el) el.textContent = String(this.onceRuns);
    });

    // DOM write, NOT a signal write — a signal here would loop forever.
    afterEveryRender(() => {
      this.everyRuns++;
      const el = this.everyEl()?.nativeElement;
      if (el) el.textContent = String(this.everyRuns);
    });

    // Reads boxWidth(), so this one is dependency-gated: it reruns only on a
    // render where boxWidth changed, not on every render like the hook above.
    afterRenderEffect(() => {
      this.boxWidth();
      this.effectRuns.update((n) => n + 1);
    });
  }

  /**
   * Measures the box from the real DOM.
   */
  protected measure() {
    const el = this.box()?.nativeElement;
    if (el) this.measuredPx.set(Math.round(el.getBoundingClientRect().width));
  }

  /**
   * Handles the slider.
   *
   * @param event The input event.
   */
  protected resize(event: Event) {
    this.boxWidth.set(+(event.target as HTMLInputElement).value);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer', id: 'deferrable-views' },
    { label: 'Performance', id: 'performance' },
    { label: 'afterRender' },
  ];

  /**
   * What a finished render actually announces, and the rule that keeps the
   * announcement from turning into a loop — dramatised before either hook is
   * named in prose, so the vocabulary has somewhere to land when it arrives.
   */
  protected readonly hookTalk: BubbleTurn[] = [
    { who: 'The render pass', says: 'I just finished writing the DOM. Anyone need to know?' },
    { who: 'afterNextRender', says: 'Me — once. Wake me for this one, then forget I exist.' },
    {
      who: 'afterEveryRender',
      says: "Me too — but don't forget me. Wake me again after the next one. And the one after that.",
    },
    {
      who: 'The render pass',
      says: 'Understood. And if either of you writes to a signal my templates read—',
    },
    {
      who: 'afterEveryRender',
      says: "—then you'd have just given me a reason to run again, and you'd wake me again, and—",
    },
    { who: 'The render pass', says: "Exactly. Don't." },
  ];

  /**
   * Sample: `afterNextRender` against `afterEveryRender`, and the injection-context
   * requirement they share.
   */
  protected readonly hooksSample = `constructor() {
  // once, after the browser paints the very NEXT render — one-time setup:
  afterNextRender(() => {
    this.chart = new Chart(this.host.nativeElement, this.config);
  });

  // after EVERY render, forever — keep this one tiny:
  afterEveryRender(() => this.syncCanvasSize());
}

// outside an injection context? capture one first:
private readonly injector = inject(Injector);
afterNextRender(() => el.focus(), { injector: this.injector });`;

  /** Line-by-line walkthrough of {@link hooksSample}. */
  protected readonly hooksNotes: CodeNote[] = [
    {
      line: 1,
      text: "Both hooks below are registered here, in the constructor, because a constructor already runs inside this component's own injection context — the easiest way to satisfy the one requirement every hook shares.",
    },
    {
      line: 3,
      text: '`afterNextRender` takes a plain callback and returns an `AfterRenderRef` (unused here — see the lifetime section for why it exists). It fires once: the first render this component ever reaches, and never again.',
    },
    {
      line: 8,
      text: "`afterEveryRender` — same shape, opposite cadence. `() => this.syncCanvasSize()` runs again after literally every render the WHOLE APP produces from now on, not just this component's own. Keep the body cheap.",
    },
    {
      line: 12,
      text: '`inject(Injector)` — capture the current injector as a field while you ARE in an injection context, so you can hand it to a hook you register later from somewhere that is not one.',
    },
    {
      line: 13,
      text: '`{ injector: this.injector }` — the second argument every hook function accepts. Without it, calling one from a click handler or a `setTimeout` throws NG0203: not in an injection context.',
    },
  ];

  /** The full application-render pipeline, hooks included. */
  protected readonly pipelineSteps: FlowStep[] = [
    { label: 'Signal write or event', detail: 'something notifies the scheduler' },
    { label: 'CD pass runs', detail: 'bindings compared, DOM written', tone: 'accent' },
    { label: '`earlyRead`', detail: 'measure, before any writes' },
    { label: '`write`', detail: 'styles and attributes land' },
    { label: '`mixedReadWrite`', detail: 'the default for any bare callback', tone: 'warn' },
    { label: '`read`', detail: 'final measurements', tone: 'good' },
  ];

  /**
   * Sample: the render phases — `earlyRead`, `write`, `mixedReadWrite`, `read` — which
   * exist to batch reads and writes and avoid layout thrashing. The next phase receives
   * the previous one's return value as a **plain value** — contrast {@link effectPhasesSample}.
   */
  protected readonly phasesSample = `afterEveryRender({
  earlyRead: () => {
    this.rect = this.tooltipAnchor.getBoundingClientRect(); // READ layout
    return this.rect; // becomes write's argument, as a plain value
  },
  write: (rect) => {
    this.tooltip.style.transform = // WRITE — no reads in here, ever
      \`translate(\${rect.x}px, \${rect.bottom}px)\`;
  },
});
// every earlyRead registered anywhere in the app runs first, then every write —
// one layout pass instead of one per component`;

  /** Line-by-line walkthrough of {@link phasesSample}. */
  protected readonly phasesNotes: CodeNote[] = [
    {
      line: 1,
      text: '`afterEveryRender` given an object instead of a plain function — each key names a phase. This spec uses two of the four; the missing ones simply never run.',
    },
    {
      line: 3,
      text: '`getBoundingClientRect()` forces the browser to finish any pending layout before answering — the expensive part of a "read". Doing it here, before any writes, is what keeps that cost to once.',
    },
    {
      line: 4,
      text: "The return value becomes `write`'s only argument, `rect` — a plain object. That threading is what lets a measurement computed in one phase feed a write in another without a shared field.",
    },
    {
      line: 6,
      text: '`write(rect)` receives exactly what `earlyRead` returned. No DOM reads happen in this function — everything it needs already arrived as an argument.',
    },
    {
      line: 8,
      text: 'A template literal building a CSS transform from the measured rect. This is the only DOM mutation in the whole hook.',
    },
    {
      line: 11,
      text: 'Angular does not run these two phases per component. It collects every `earlyRead` callback registered anywhere in the app, runs all of them, THEN collects and runs every `write` — a page with forty tooltip-like components still costs one layout pass, not forty.',
    },
  ];

  /**
   * Sample: `afterRenderEffect`'s phase form. Same phase names as {@link phasesSample},
   * a different contract underneath — this whole spec is a reactive computation, and a
   * later phase receives the earlier one's return value as a **`Signal`**, not a raw value.
   */
  protected readonly effectPhasesSample = `afterRenderEffect({
  earlyRead: () => this.anchor().nativeElement.getBoundingClientRect(),
  write: (rect, onCleanup) => {
    this.tooltip.nativeElement.style.transform =
      \`translate(\${rect().x}px, \${rect().bottom}px)\`;
    onCleanup(() => (this.tooltip.nativeElement.style.transform = ''));
  },
});
// reruns only when a signal read inside earlyRead (or write) actually changed —
// a render that left the anchor exactly where it was costs nothing here`;

  /** Line-by-line walkthrough of {@link effectPhasesSample}. */
  protected readonly effectPhasesNotes: CodeNote[] = [
    {
      line: 1,
      text: '`afterRenderEffect` — the same two phase names as `afterEveryRender`, but this whole spec is now a reactive computation: Angular tracks every signal each phase reads and only reruns a phase when one of them changes.',
    },
    {
      line: 2,
      text: '`this.anchor()` reads a `viewChild` signal — a tracked read, so a change in WHICH element `anchor` points at would itself make `earlyRead` dirty again. `getBoundingClientRect()` is the plain DOM measurement, unchanged from before.',
    },
    {
      line: 3,
      text: "`write(rect, onCleanup)` — two parameters this time. `rect` is `earlyRead`'s return value, but wrapped: in `afterRenderEffect` a later phase always receives the earlier one's result as a `Signal`, never a plain value.",
    },
    {
      line: 5,
      text: "`rect()` — called, not read as a property. Forgetting the parentheses is the easiest slip moving from `afterEveryRender`'s phases to these: `rect.x` would be `undefined`, because `rect` is the signal, not the rectangle.",
    },
    {
      line: 6,
      text: "`onCleanup` — every phase function gets one. A function registered here runs right before THIS phase's next invocation, or on destroy if there is not one — how a render hook undoes its own side effect instead of accumulating them.",
    },
    {
      line: 9,
      text: '"Only when dirty" is the whole point of this API over the plain phase hooks: an `afterEveryRender` with this exact body would re-measure and re-write on every single render in the app, forever, whether the anchor moved or not.',
    },
  ];

  /**
   * Sample: the complete, current third-party-widget recipe — creation via
   * `afterNextRender`, ongoing sync via `afterRenderEffect`, teardown via `DestroyRef`.
   * Compare against {@link recipeOldSample} for the shape this replaced.
   */
  protected readonly recipeSample = `export class ChartHost {
  private readonly host = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = input.required<Point[]>();
  private chart?: ThirdPartyChart;

  constructor() {
    afterNextRender(() => {
      // 1. create — DOM exists, browser guaranteed, SSR-safe
      this.chart = new ThirdPartyChart(this.host.nativeElement);
    });

    // 2. update — reruns only when data changes; no injector to capture
    afterRenderEffect(() => this.chart?.setData(this.data()));

    // 3. teardown
    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }
}`;

  /** Line-by-line walkthrough of {@link recipeSample}. */
  protected readonly recipeNotes: CodeNote[] = [
    {
      line: 2,
      text: "`inject(ElementRef)` — the component's own host element. The `afterNextRender` below is what makes reaching into `.nativeElement` safe.",
    },
    {
      line: 3,
      text: "`inject(DestroyRef)` — this component's own teardown hook, used on line 17. Not the same thing as a render hook's own automatic cleanup — this one is for the chart object, not for the hooks themselves.",
    },
    {
      line: 4,
      text: '`input.required<Point[]>()` — a signal input. Line 14 is what turns a later change to this into an actual chart update; nothing else in this class watches it.',
    },
    {
      line: 8,
      text: "`afterNextRender` — runs exactly once, the first time this component's view renders. This is the only place `new ThirdPartyChart(...)` may correctly happen.",
    },
    {
      line: 10,
      text: "The construction itself. If this ran during SSR, `ThirdPartyChart` would likely reach for `window` and throw — but it cannot run there; the hook's contract is browser-only.",
    },
    {
      line: 14,
      text: 'Reads `this.data()` inside its own callback, so it is dependency-gated on that input specifically: it runs once at creation, then again only on renders where `data` produced a new value — never merely because something unrelated re-rendered. The `?.` is defensive, in case an input update ever reaches this before line 10 has finished.',
    },
    {
      line: 17,
      text: "`DestroyRef.onDestroy` — teardown tied to the component's own destruction, not to a render at all. `chart?.destroy()` runs exactly once, whenever Angular removes this component from the tree.",
    },
  ];

  /** Prompt for {@link recipeSample}'s predict-then-reveal strip. */
  protected readonly recipePrompt =
    'On the very first render, before `data` has changed even once, does the `afterRenderEffect` on line 14 run at all?';

  /** Reveal for {@link recipePrompt}. */
  protected readonly recipeOutput =
    "Yes — every `afterRenderEffect` runs at least once, on the first render it becomes eligible for, regardless of whether anything it reads has 'changed' yet. That first run is what gives the chart its initial dataset without a separate manual call.";

  /** The old shape: creation plus a manually injected `effect()` for updates. */
  protected readonly recipeOldSample = `private readonly injector = inject(Injector);

afterNextRender(() => {
  this.chart = new ThirdPartyChart(this.host.nativeElement);
  effect(() => this.chart!.setData(this.data()), {
    injector: this.injector,
  });
});`;

  /** The current shape: the update step becomes its own top-level hook. */
  protected readonly recipeNewSample = `afterNextRender(() => {
  this.chart = new ThirdPartyChart(this.host.nativeElement);
});

afterRenderEffect(() => this.chart?.setData(this.data()));`;

  /** A one-time DOM read in the wrong place — the opening failure mode. */
  protected readonly earlyReadSample = `ngOnInit() {
  console.log(this.box().nativeElement.getBoundingClientRect().width); // 0
}`;

  /** A hook registered with `manualCleanup` and cleaned up by hand. */
  protected readonly manualCleanupSample = `const poll = afterEveryRender(() => this.sync());
// later, from wherever decides this should stop:
poll.destroy();`;

  /**
   * The self-test, built on the three-counter demo already on the page.
   *
   * The distractors are the three ways people misread that demo: treating
   * "next" as "every", assuming a render hook can tell WHAT changed without
   * reading a signal, and assuming a no-op click schedules nothing.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'All three counters climb — every hook fires on every render.',
      why: '`afterNextRender` already had its one turn, on the very first render. It does not mean "runs on the next render something happens to trigger" — it means "runs once, on the render right after registration". Naming it after WHEN it fires, not HOW OFTEN, is exactly the trap here.',
    },
    {
      text: '`afterNextRender` stays put, but the other two climb together.',
      why: 'The `afterEveryRender` counter does climb — it cannot see WHAT changed, only THAT a render happened. But `afterRenderEffect` reads `boxWidth()`, and the tick button never touches `boxWidth`, so it has nothing to be dirty about, and it stays exactly where it was. Reading a signal is what makes an effect selective; without one, it would behave just like `afterEveryRender`.',
    },
    {
      text: 'Only the middle counter climbs; the other two hold.',
      correct: true,
      why: 'Exactly. `afterNextRender` already spent its one shot. `afterRenderEffect` only reruns when something it actually reads changes, and `boxWidth` never moved. `afterEveryRender` has no such filter — any render at all is enough.',
    },
    {
      text: 'None of them climb — a click that does nothing schedules nothing.',
      why: 'A click still marks the view dirty and schedules a real render, even when the handler is a no-op — Angular cannot know in advance that nothing changed. `afterEveryRender` does not care why a render happened, only that one did, so it always counts it.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I still need `effect()` if I have `afterRenderEffect` now?',
      a: "Yes — they solve different problems. A plain `effect()` is a pure reactive computation with no guarantee about WHEN it runs relative to rendering; touching the DOM inside one is technically unsupported timing. `afterRenderEffect` is the one built for the DOM: the same dependency tracking, but guaranteed to run after the browser has actually painted. Reach for a plain `effect()` when nothing you're doing touches the DOM.",
    },
    {
      q: 'Why does `write` get a value I have to call in one sample and a plain object in another?',
      a: "Because the two hook families keep a different promise. `afterEveryRender`'s phases pass a plain value to the next phase — no tracking involved. `afterRenderEffect`'s phases are each their own reactive computation, so what gets passed along is a `Signal` wrapping that value, which is what lets a later phase notice a change without the earlier phase re-running. Forgetting the `()` is the easiest slip moving from one to the other.",
    },
    {
      q: 'How do I even test code that lives inside a render hook?',
      a: "`fixture.detectChanges()` alone usually is not enough — render hooks run on their own schedule, slightly after the check that triggers them. `await fixture.whenStable()` is what actually flushes them before your assertions run. And watch for `getBoundingClientRect()` in a jsdom-style test runner: it reports every element as zero-sized, since there's no real layout engine behind it, so measurement code needs either a real-browser test runner or a seam you can stub.",
    },
    {
      q: "Couldn't I just wrap the DOM code in `isPlatformBrowser` instead?",
      a: "It solves half the problem. `isPlatformBrowser` tells you WHERE you're running, but nothing about WHEN — code guarded by it inside `ngOnInit` can still run before the DOM it wants to touch has been laid out. `afterNextRender` solves both at once: browser-only AND correctly timed, which is exactly why it replaced the guard for this specific job.",
    },
  ];
}
