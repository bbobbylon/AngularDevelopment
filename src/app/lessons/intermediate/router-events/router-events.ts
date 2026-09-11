import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
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
 * ## Presentation
 *
 * Migrated straight to the brain-friendly layer (see `shared/brain/` and the
 * reference implementation, `expert/change-detection`). Teaching order:
 *
 * 1. **Pose the problem before naming it.** A global loading bar is the
 *    concrete hook — "where do you even attach that?" — before `router.events`
 *    is named as the answer.
 * 2. **Analogy before vocabulary.** `router.events` is the stadium announcer,
 *    not the referee: it reports what a guard or resolver already decided, and
 *    a subscriber cannot change the outcome from inside a `.subscribe()`. That
 *    frame is what makes the rest of the page make sense, including why this
 *    lesson and `route-guards` are companions rather than duplicates — guards
 *    decide, this page narrates.
 * 3. **The same order, three modes**: a `<app-flow>` spine, an annotated real
 *    console trace via `<app-code-lab>`, and a live simulated event log the
 *    reader triggers themselves.
 * 4. **The payoff demo is a bug, not a feature.** Two progress bars driven by
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
    Napkin,
    TapeCard,
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
