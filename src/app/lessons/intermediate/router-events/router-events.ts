import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── The simulated navigation timeline ───────────────────────────────────────

/** One entry in a simulated `router.events` stream. */
interface TimelineStep {
  /** The real event class name this step stands in for. */
  readonly name: string;
  /** A short extra detail — a code, a field value. */
  readonly detail?: string;
  /** Marks the step that ends the navigation — one of four possible names. */
  readonly terminal?: boolean;
}

/**
 * A navigation with one passing guard and one resolver, start to finish. This
 * is the order the router's own event classes document themselves as firing
 * in — see the class doc below for the exact source citations.
 */
const SUCCESS_TIMELINE: readonly TimelineStep[] = [
  { name: 'NavigationStart' },
  { name: 'RoutesRecognized' },
  { name: 'GuardsCheckStart' },
  { name: 'GuardsCheckEnd', detail: 'shouldActivate: true' },
  { name: 'ResolveStart' },
  { name: 'ChildActivationStart' },
  { name: 'ActivationStart' },
  { name: 'ActivationEnd' },
  { name: 'ChildActivationEnd' },
  { name: 'ResolveEnd' },
  { name: 'NavigationEnd', terminal: true },
];

/** The same navigation, except its one guard returns `false`. */
const CANCELLED_TIMELINE: readonly TimelineStep[] = [
  { name: 'NavigationStart' },
  { name: 'RoutesRecognized' },
  { name: 'GuardsCheckStart' },
  { name: 'GuardsCheckEnd', detail: 'shouldActivate: false' },
  { name: 'NavigationCancel', detail: 'code: GuardRejected', terminal: true },
];

/** Milliseconds between simulated steps — slow enough to read as they land. */
const STEP_DELAY_MS = 220;

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: `router.events` — the ordered stream every navigation emits, the
 * four ways it can end, and the "stuck loading bar" bug that comes from
 * listening for only one of them.
 *
 * ## Shape: `no-dumb-questions`
 *
 * The lesson opens on the misconception this topic reliably produces —
 * "show on `NavigationStart`, hide on `NavigationEnd`, what could go wrong"
 * — and lets {@link ndq} carry the whole explanation, escalating from that
 * misconception through the four-terminal-events rule, the "events narrate,
 * they don't decide" boundary, and the redirect-disguised-as-cancel surprise,
 * to where it bites at work and the one-sentence fix. `app-brain-power` poses
 * an open question about which terminal event a same-URL navigation gets
 * (answered later, without saying so, by the `NavigationSkipped` tape-card),
 * `app-layers` answers the announcer/referee split as a containment figure, a
 * quiz checks the loading-bar bug directly, and the block closes on
 * `app-napkin` with the announcer analogy. See `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated straight to the brain-friendly layer (see `shared/brain/` and the
 * reference implementation, `expert/change-detection`). After the shape
 * block, "the mental model, in full" replays the loading-bar problem and the
 * announcer analogy at full length. Teaching order for the rest of the page:
 *
 * 1. **Analogy, restaged.** `router.events` is the stadium announcer,
 *    not the referee: it reports what a guard or resolver already decided, and
 *    a subscriber cannot change the outcome from inside a `.subscribe()`. That
 *    frame is what makes the rest of the page make sense, including why this
 *    lesson and `route-guards` are companions rather than duplicates — guards
 *    decide, this page narrates.
 * 2. **The same order, three modes**: a `<app-flow>` spine, an annotated real
 *    console trace via `<app-code-lab>`, and a live simulated event log the
 *    reader triggers themselves.
 * 3. **The payoff demo is a bug, not a feature.** Two progress bars driven by
 *    the identical simulated stream — one listens for `NavigationEnd` only,
 *    one for any terminal event — so a cancelled navigation visibly leaves one
 *    of them stuck. This is the strongest "demonstrate, don't assert" moment
 *    on the page and the reason the whole lesson exists.
 *
 * ## Why the live demo is simulated, not a real navigation
 *
 * `route-guards.ts` sets the precedent this lesson follows: its own live
 * guard demos drive a local `outcome` signal from a fake `attempt()` call
 * rather than firing `Router.navigateByUrl()` at a real route. This lesson
 * does the same, for a second reason on top of that precedent: a real
 * navigation away from `/router-events` would destroy this very component —
 * and its subscription — mid-navigation, and there is no route in this app
 * configured to fail a guard, throw from a resolver, or get skipped on
 * demand. A simulated timeline lets the reader trigger a passing navigation
 * and a guard-rejected one, on a fixed schedule, as many times as they like,
 * with the real event **names** and the real nesting order (Activation
 * inside Resolve) preserved exactly. Nothing here calls `HttpClient` or the
 * real `Router`, so there is nothing for `lessons.smoke.spec.ts`'s
 * `provideHttpClientTesting()` mount to hang on.
 */
@Component({
  selector: 'app-lesson-router-events',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    BrainPower,
    NoDumbQuestions,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './router-events.css',
  templateUrl: './router-events.html',
})
export class RouterEventsLesson {
  /**
   * The shape block's spine: seven questions escalating from the
   * NavigationStart/NavigationEnd-only misconception through the
   * four-terminal-events rule, the narrate-vs-decide boundary and the
   * redirect-disguised-as-cancel surprise, to where it bites at work and
   * the one-sentence fix. Carries the entire explanation on its own — see
   * `NoDumbQuestions`'s own doc comment for why that is the point.
   */
  protected readonly ndq: NdqItem[] = [
    {
      q: 'I show a loading bar on `NavigationStart` and hide it on `NavigationEnd`. What could possibly go wrong?',
      a: "A guard rejects the navigation. `NavigationStart` still fires — every attempt gets one — but the navigation never reaches `NavigationEnd`, because it didn't succeed. Nothing ever tells the bar to hide, and it's stuck until some later, unrelated navigation happens to end cleanly.",
    },
    {
      q: 'So does every navigation end in exactly one event, whatever happens to it?',
      a: 'Yes — one of exactly four: `NavigationEnd` (it worked), `NavigationCancel` (a guard said no, a resolver came back empty, or a newer navigation pre-empted it), `NavigationError` (something threw), or `NavigationSkipped` (the router never even attempted it, usually because the target URL was already the current one). A UI wired to only the first of those is wired to roughly a quarter of reality.',
    },
    {
      q: 'If I see NavigationCancel in my subscriber, can I do anything from there to let the navigation through anyway?',
      a: "No. By the time an event reaches your `.subscribe()`, the decision is already made and finished — same as shouting at a stadium announcer after the referee's whistle has already blown. Only a guard or a resolver, running BEFORE the event fires, can actually change what a navigation does.",
    },
    {
      q: 'A guard redirects instead of just rejecting — surely THAT fires NavigationError, since the original request effectively failed?',
      a: "Surprisingly, no. A guard returning a redirect fires `NavigationCancel` with `code: Redirect`, not `NavigationError`. Anything in the app watching specifically for `NavigationError` will not see this one at all — it looks, from the event stream's point of view, exactly like an ordinary cancellation.",
    },
    {
      q: 'Where does any of this actually bite people at work?',
      a: "An analytics 'page view' ping wired to `NavigationEnd` only. Every navigation a guard blocks — a logged-out user hitting `/admin`, say — silently never gets counted, because it never reaches the one event the tracker is listening for. The dashboard just quietly under-reports how often people hit the login wall, with nothing in the logs explaining the gap.",
    },
    {
      q: 'withNavigationErrorHandler sounds like the tidy, centralised way to handle failures. Any surprise there?',
      a: "One: if the handler itself returns a redirect (a `RedirectCommand`), Angular suppresses the error entirely — the navigation still ends, but as `NavigationCancel` with `code: Redirect` instead of `NavigationError`. Anything else in the app watching specifically for `NavigationError` misses it too, for the exact same reason a guard's own redirect does.",
    },
    {
      q: "So what's the one-sentence fix for all of this?",
      a: 'Handle all four terminal events — or a generic "this attempt is over" check — instead of just `NavigationEnd`, and remember `router.events` only ever narrates: if you need to allow, block or redirect a navigation, that decision belongs in a guard, never in a subscriber.',
    },
  ];

  /**
   * The shape block's quiz: the loading-bar bug checked directly, before
   * the live demo further down lets the reader trigger the real rejected
   * navigation and watch the naive bar get stuck.
   */
  protected readonly ndqBlockQuiz: QuizOption[] = [
    {
      text: 'It shows, and then never hides — the navigation ends in NavigationCancel, which nothing here is listening for.',
      correct: true,
      why: "`NavigationStart` fires for every attempt, guard-rejected or not — so the bar still shows. The guard's `false` sends the navigation to `NavigationCancel` instead of `NavigationEnd`, and since nothing subscribes to that event, nothing ever calls `hide()`.",
    },
    {
      text: 'It never shows in the first place, since the guard blocks the navigation before NavigationStart fires.',
      why: 'Backwards — guards run AFTER `NavigationStart`, as part of the pipeline the event kicks off. The attempt has already begun, and already shown the bar, by the time any guard gets a chance to reject it.',
    },
    {
      text: 'It shows and hides normally — NavigationCancel triggers the same UI cleanup as NavigationEnd automatically.',
      why: "There's no automatic bridging between the two. `NavigationCancel` and `NavigationEnd` are simply different values on the same Observable; nothing about the router wires one to trigger handlers written for the other.",
    },
    {
      text: "Angular throws a runtime error, since the bar's hide handler was never satisfied.",
      why: 'Nothing here throws. The subscriber that only listens for `NavigationEnd` simply never runs for this navigation — a silent gap, not an error, which is exactly what makes this bug easy to ship without noticing.',
    },
  ];

  /** The Routing track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Routing Basics', id: 'routing-basics' },
    { label: 'Child Routes & Lazy Loading', id: 'router-children-lazy' },
    { label: 'Route Guards', id: 'route-guards' },
    { label: 'Resolvers', id: 'resolvers' },
    { label: 'Route Params', id: 'route-params' },
    { label: 'Navigation Events' },
  ];

  // ── The simulated timeline demo ─────────────────────────────────────────

  /** The event log the last simulated run produced, in arrival order. */
  protected readonly log = signal<TimelineStep[]>([]);
  /** Whether a simulated run is still in flight. */
  protected readonly running = signal(false);
  /** The naive bar: on at `NavigationStart`, off only at `NavigationEnd`. */
  protected readonly naiveBarOn = signal(false);
  /** The correct bar: on at `NavigationStart`, off at ANY terminal event. */
  protected readonly fixedBarOn = signal(false);

  /**
   * Invalidates any `setTimeout`s from a previous run that haven't fired yet,
   * so mashing a button mid-playback can't interleave two timelines' steps
   * into one log.
   */
  private runToken = 0;

  /** Plays a timeline into {@link log}, driving both bars from it. */
  private simulate(timeline: readonly TimelineStep[]): void {
    const token = ++this.runToken;
    this.log.set([]);
    this.running.set(true);
    this.naiveBarOn.set(true);
    this.fixedBarOn.set(true);

    timeline.forEach((step, i) => {
      setTimeout(() => {
        if (token !== this.runToken) return; // superseded by a newer click
        this.log.update((entries) => [...entries, step]);
        if (step.name === 'NavigationEnd') this.naiveBarOn.set(false);
        if (step.terminal) {
          this.fixedBarOn.set(false);
          this.running.set(false);
        }
      }, i * STEP_DELAY_MS);
    });
  }

  /** Runs the passing-guard, passing-resolver timeline. */
  protected simulateSuccess(): void {
    this.simulate(SUCCESS_TIMELINE);
  }

  /** Runs the timeline where the one guard on this route returns `false`. */
  protected simulateCancelled(): void {
    this.simulate(CANCELLED_TIMELINE);
  }

  // ── Presentation data ───────────────────────────────────────────────────

  /**
   * The announcer/referee exchange the mental-model section is built around.
   * Exists because the mistake this lesson exists to prevent is trying to
   * steer a navigation from a `router.events` subscriber — by the time an
   * event arrives, the decision behind it has already been made.
   */
  protected readonly announcerTalk: BubbleTurn[] = [
    {
      who: 'A guard',
      says: 'I just returned `false`. This navigation is blocked — that was my call.',
    },
    {
      who: 'router.events',
      says: "Noted. I'll tell anyone listening: `GuardsCheckEnd`, `shouldActivate: false`. Then `NavigationCancel`, code `GuardRejected`.",
    },
    {
      who: 'A subscriber (you)',
      says: 'Can I stop it from here instead — cancel it myself the moment I see that event come through?',
    },
    {
      who: 'router.events',
      says: "No. By the time I've told you about it, the decision already happened. I only report what already occurred — I'm the announcer, not the referee.",
    },
    {
      who: 'A subscriber (you)',
      says: 'So if I want control over the outcome, not just visibility into it —',
    },
    {
      who: 'router.events',
      says: "— that's a guard's job, not mine. Come back to me when you just want to react: a loading bar, an analytics ping, a scroll reset.",
    },
  ];

  /** The ordered spine, for the `<app-flow>` diagram. */
  protected readonly spineSteps: FlowStep[] = [
    { label: 'NavigationStart', detail: 'a navigation was requested' },
    {
      label: 'RouteConfigLoadStart / End',
      detail: "only if this route's lazy chunk isn't cached yet",
    },
    { label: 'RoutesRecognized', detail: 'a route config actually matches the URL' },
    {
      label: 'GuardsCheckStart / End',
      detail: 'every canActivate/canActivateChild/canMatch, as one block',
    },
    {
      label: 'ResolveStart … ResolveEnd',
      detail: 'resolvers run, and Activation nests inside here — see below',
      tone: 'accent',
    },
    {
      label: 'One terminal event',
      detail: 'End, Cancel, Error, or Skipped — never more than one',
      tone: 'good',
    },
  ];

  /** Naive side of the {@link Compare} in the live-demo section: one terminal event. */
  protected readonly naiveSubscribeSample = `router.events.subscribe((e) => {
  if (e instanceof NavigationStart) loading.set(true);
  if (e instanceof NavigationEnd) loading.set(false);
});`;

  /** Correct side of the {@link Compare}: all four terminal events. */
  protected readonly fixedSubscribeSample = `router.events.subscribe((e) => {
  if (e instanceof NavigationStart) loading.set(true);
  if (
    e instanceof NavigationEnd ||
    e instanceof NavigationCancel ||
    e instanceof NavigationError ||
    e instanceof NavigationSkipped
  ) {
    loading.set(false);
  }
});`;

  /**
   * A real subscribe pattern next to a real console trace, so the nesting
   * claim above is something the reader can check rather than take on faith.
   */
  protected readonly traceSample = `router.events
  .pipe(filter((e): e is RouterEvent => e instanceof RouterEvent))
  .subscribe((e) => console.log(e.constructor.name));

// console, for one click from /a to /b (route has 1 guard, 1 resolver):
NavigationStart
RoutesRecognized
GuardsCheckStart
GuardsCheckEnd
ResolveStart
ChildActivationStart
ActivationStart
ActivationEnd
ChildActivationEnd
ResolveEnd
NavigationEnd`;

  /** Line-by-line walkthrough of {@link traceSample}. */
  protected readonly traceNotes: CodeNote[] = [
    {
      line: 1,
      text: '`router.events` is a plain RxJS `Observable<Event>` on the injected `Router` — not a signal. `Event` here is the union of every event class the router can emit, imported from `@angular/router`.',
    },
    {
      line: 2,
      text: "`instanceof` is the idiomatic way to narrow that union — this is the pattern `RouterEvent`'s own doc comment recommends, not a `switch` on a `.type` field.",
    },
    {
      line: 11,
      text: "`ResolveStart` (line 10) has already fired, but `ResolveEnd` (line 15) hasn't yet. `ChildActivationStart` landing **here** — between the two — is the detail almost everyone gets backwards.",
    },
    {
      line: 13,
      text: "`ActivationEnd` still isn't the end of anything at the navigation level. It means one route's component is ready to be considered active — resolution overall is still in progress for two more lines.",
    },
    {
      line: 15,
      text: "Only now, after Activation has come and gone, does `ResolveEnd` fire. If you assumed a component couldn't be “active” until resolve was fully done, this is the line that proves otherwise.",
    },
  ];

  /**
   * Sample: centralizing error handling, and the one branch that quietly
   * changes which terminal event actually fires.
   */
  protected readonly errorHandlerSample = `provideRouter(
  routes,
  withNavigationErrorHandler((error: NavigationError) => {
    if (error.error instanceof ChunkLoadError) {
      const router = inject(Router);
      return new RedirectCommand(router.parseUrl('/reload-required'));
    }
    inject(ErrorTracker).report(error);
    // no return value: NavigationError still fires as normal
  }),
);`;

  /** Line-by-line walkthrough of {@link errorHandlerSample}. */
  protected readonly errorHandlerNotes: CodeNote[] = [
    {
      line: 3,
      text: '`withNavigationErrorHandler` is a `provideRouter` feature — one handler for every `NavigationError` in the app, instead of a `NavigationError` filter repeated in every `router.events` subscriber that cares.',
    },
    {
      line: 5,
      text: 'The handler runs inside an injection context, so `inject()` works directly in its body — no constructor, no field, just call it.',
    },
    {
      line: 6,
      text: "Returning a `RedirectCommand` here doesn't just redirect — it **replaces** the outcome. The router converts what was about to be a `NavigationError` into a `NavigationCancel` with `code: NavigationCancellationCode.Redirect`, and the `NavigationError` this function was reacting to never fires at all.",
    },
    {
      line: 8,
      text: 'Report and fall through instead: the handler runs, `report()` fires, and because nothing is returned, `NavigationError` still emits exactly as if this feature weren\'t configured. Only a returned `RedirectCommand` changes the outcome — everything else is just "I noticed."',
    },
  ];

  /** The self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: '3 — once for each guard that ran.',
      why: 'GuardsCheckStart/End bracket the whole guard phase for this navigation, not each individual check. A route with five guards produces exactly the same two events as a route with one — count guards from your route config, not from the event log.',
    },
    {
      text: '1 — once for the entire guard phase, regardless of how many individual guards ran.',
      correct: true,
      why: 'Exactly. GuardsCheckStart fires once when the phase begins, GuardsCheckEnd once when every guard involved has settled — carrying one shared shouldActivate for the whole block.',
    },
    {
      text: '0 — GuardsCheckStart only fires when a guard is about to reject.',
      why: "It fires for every navigation that reaches the guard phase, pass or fail alike — it's not an error signal, it's a phase marker.",
    },
    {
      text: 'It depends on whether the guards are synchronous or return an Observable.',
      why: "Sync vs. async changes how long the phase takes, not how many times it's announced. GuardsCheckStart/End still bracket it exactly once either way.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I need to unsubscribe from `router.events` myself?',
      a: "The router's own internal use of the stream is its business, not yours. But if you call `.subscribe()` on it yourself — say, in a component constructor — that subscription is exactly as leaky as any other RxJS subscription you create: it outlives the component unless you tear it down, typically with `takeUntilDestroyed()`.",
    },
    {
      q: 'Is `router.events` a signal?',
      a: 'No — it\'s a plain `Observable<Event>`, because a navigation is inherently a sequence over time, not a single current value. Wrap it with `toSignal(router.events, { initialValue: undefined })` if a component genuinely wants "the latest event" as a signal read in a template.',
    },
    {
      q: 'Does `RouteConfigLoadStart` fire again if I revisit a lazy route?',
      a: "No. Once a lazy chunk is fetched it's cached for the session — the `router-children-lazy` lesson covers this in depth. Revisit the same route and the trace jumps straight from `RoutesRecognized` to `GuardsCheckStart`, with no load events at all.",
    },
    {
      q: 'Can I cancel a navigation from inside a `router.events` subscriber?',
      a: 'No — see the announcer exchange above. By the time an event reaches your subscriber, the router has already committed to what it describes. If you need to affect the outcome — block it, redirect it, delay it — that decision belongs in a guard or a resolver, which run before the events they cause.',
    },
    {
      q: "What's actually different between `NavigationCancel` and `NavigationSkipped`?",
      a: "`NavigationCancel` means the router attempted the navigation and then aborted partway — a guard rejected it, a resolver produced nothing, a redirect superseded it, a newer navigation preempted it. `NavigationSkipped` means the router looked at the request and chose not to attempt it at all, most often because the target URL is identical to the one you're already on.",
    },
  ];
}
