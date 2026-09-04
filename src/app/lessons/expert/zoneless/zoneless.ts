import { Component, afterRenderEffect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: zoneless Angular — what `Zone.js` actually patched and why that made
 * every async completion a full-tree tick, the explicit notification list that
 * replaces it, the scheduler's coalescing (proven live, three ways), the
 * `PendingTasks` half of the story that stability/SSR/testing quietly depend
 * on, the high-frequency-event trap that "zoneless removes wasted passes"
 * glosses over, and the migration path. This app runs zoneless — no
 * `zone.js` in its dependencies — so every proof below is the real behaviour.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shape and rhythm copied from
 * `expert/change-detection`, the reference implementation. The teaching order:
 *
 * 1. **Pose the problem before naming the answer.** "How did Angular ever know
 *    to check, before you told it anything?" — and a napkin asking the reader
 *    to predict which of two `setTimeout`-written values renders, before the
 *    live proof settles it.
 * 2. **Analogy next, mechanism after.** A concierge who patrols every hallway
 *    versus room-service buttons gives the reader somewhere to put "implicit,
 *    guess-everything scheduling" versus "explicit, tell-me scheduling" before
 *    `ChangeDetectionScheduler` and `PendingTasks` show up by name.
 * 3. **Then the same idea in several modes** — a dialogue between Zone.js and a
 *    signal, an annotated compiled-era sample, a table of the exact six
 *    triggers, three live demos, and a vertical migration flow.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    here assumes the reader can already read the snippet.
 *
 * ## What this pass added over the pre-brain-friendly version
 *
 * The old lesson's own comparison table asserted "wasted passes: none — no
 * notification, no pass" while never mentioning that every `(mousemove)` /
 * `(scroll)` / `(input)` template listener is itself a notification — so a
 * dragged slider or a tracked cursor ticks the whole app at native event
 * frequency, the exact problem `runOutsideAngular()` used to solve, which the
 * old lesson retired as "inert" without ever naming its replacement. This pass
 * adds a live demo proving the gap and states the replacement in one rule. It
 * also adds the `PendingTasks` half of stability (what actually drives
 * `whenStable()`/SSR once there is no zone to watch), and the
 * `eventCoalescing`/`runCoalescing` stepping stone between naive Zone.js and
 * zoneless.
 */
@Component({
  selector: 'app-lesson-zoneless',
  imports: [
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
  ],
  styleUrl: './zoneless.css',
  templateUrl: './zoneless.html',
})
export class Zoneless {
  constructor() {
    afterRenderEffect(() => this.passes.update((n) => n + 1));
  }

  /**
   * How many render passes have reached this lesson's own view, total.
   *
   * Incremented from `afterRenderEffect`, never from a template getter. A
   * getter that mutates on read (`get tick() { return ++this.n; }`) disagrees
   * with itself on dev mode's double-read verify pass and throws NG0100 — see
   * `expert/change-detection`'s `passes` field for the full story.
   * `afterRenderEffect` runs once per application render, strictly after that
   * verify window, so counting here is honest.
   */
  protected readonly passes = signal(0);

  // ── Live proof #1 — plain field vs signal, both written from setTimeout ────

  /**
   * A plain field, written by a `setTimeout`. In this zoneless app nothing
   * notices the write — the demo.
   */
  protected plainValue = '—';
  /** A signal written the same way. This one does update the view. */
  protected readonly signalValue = signal('—');
  /** Sequence number for plain writes, so each one is distinguishable. */
  private plainN = 0;
  /** Sequence number for signal writes. */
  private signalN = 0;

  /**
   * Writes a plain field from a `setTimeout`.
   *
   * The assignment genuinely happens — the field really does hold the new
   * value. Without `zone.js` patching `setTimeout`, nothing tells Angular to
   * check, so the screen keeps showing the old one. "The value is wrong" and
   * "nobody looked" are different bugs; this is the second.
   */
  protected timeoutPlain(): void {
    setTimeout(() => {
      // really assigns — but in a zoneless app nobody schedules a pass
      this.plainValue = `write #${++this.plainN} (invisible until the next pass)`;
    }, 300);
  }

  /**
   * Writes a signal from a `setTimeout`. The signal notifies the scheduler
   * itself, so no zone is needed.
   */
  protected timeoutSignal(): void {
    setTimeout(() => {
      this.signalValue.set(`write #${++this.signalN}`);
    }, 300);
  }

  // ── Live proof #2 — template events still schedule, no signal required ────

  /** Clicks on the plain-field button. Also plain, so also invisible on its own. */
  protected plainClicks = 0;

  /** Adds one to {@link plainClicks}. Called from a template `(click)`. */
  protected bumpPlainClicks(): void {
    this.plainClicks = this.plainClicks + 1;
  }

  // ── Live proof #3 — writes coalesce into one render pass ──────────────────

  /** First of three signals written together. */
  protected readonly a = signal(0);
  /** Second of three. */
  protected readonly b = signal(0);
  /** Third of three. */
  protected readonly c = signal(0);

  /**
   * Writes three signals in a row.
   *
   * {@link passes} goes up by one, not three: the scheduler coalesces
   * notifications into a single pass at the end of the microtask. Batching is
   * a property of the scheduler, not something the caller has to arrange.
   */
  protected writeAllThree(): void {
    this.a.update((v) => v + 1);
    this.b.update((v) => v + 1);
    this.c.update((v) => v + 1);
    // three notifications → one coalesced render pass (watch `passes` above)
  }

  // ── Live proof #4 — high-frequency events, bound vs summarized ────────────

  /**
   * Render passes attributable to the naive path: one signal write per
   * simulated event, exactly mirroring what a real `(mousemove)` binding does
   * — every firing is a template event, and a template event schedules a pass
   * before the handler body even runs. Each burst uses real, separately
   * scheduled `setTimeout` callbacks (not a synchronous loop) so the writes
   * are genuinely separate tasks and cannot coalesce into one pass — which is
   * exactly what makes sixty real mousemove events a second sixty real passes,
   * not one.
   */
  protected readonly boundPasses = signal(0);

  /**
   * Raw event counter for the smart path. Deliberately a plain field, not a
   * signal — incrementing it must cost nothing, the same way a native
   * `addEventListener` callback running outside any Angular-bound listener
   * costs nothing until *you* decide to act on it.
   */
  private rawEvents = 0;

  /** A manually revealed snapshot of {@link rawEvents}, for the "peek" button. */
  protected readonly rawPeek = signal(0);

  /**
   * Render passes attributable to the smart path: one signal write for every
   * fourth raw event, instead of one for every single event. Same physical
   * input as {@link boundPasses}, roughly a quarter of the passes.
   */
  protected readonly throttledPasses = signal(0);

  /**
   * Fires twelve separately scheduled "events" down the naive path — one
   * `boundPasses` write, and therefore one render pass, per event. Stands in
   * for twelve real `(mousemove)` firings.
   */
  protected simulateBoundBurst(): void {
    for (let i = 1; i <= 12; i++) {
      setTimeout(() => this.boundPasses.update((n) => n + 1), i * 45);
    }
  }

  /**
   * Fires the same twelve events down the smart path: every one increments
   * the free {@link rawEvents} counter, and only every fourth one writes to
   * {@link throttledPasses} — the signal write that actually costs a pass.
   */
  protected simulateSmartBurst(): void {
    for (let i = 1; i <= 12; i++) {
      setTimeout(() => {
        this.rawEvents++;
        if (this.rawEvents % 4 === 0) {
          this.throttledPasses.update((n) => n + 1);
        }
      }, i * 45);
    }
  }

  /** Reveals the current {@link rawEvents} count without itself rendering anything new. */
  protected peekRawEvents(): void {
    this.rawPeek.set(this.rawEvents);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless' },
    { label: '@defer', id: 'deferrable-views' },
    { label: 'Performance', id: 'performance' },
    { label: 'afterRender', id: 'after-render' },
  ];

  /**
   * `Zone.js`'s scheduling philosophy against a signal's, staged as dialogue.
   *
   * The relationship learners get backwards here isn't "signals vs plain
   * fields" (that's the change-detection lesson's job) — it's *why* the old
   * mechanism was so blunt. Zone.js didn't ignore anything on purpose; it had
   * no way to tell relevant async apart from irrelevant, so it treated all of
   * it as maybe-relevant.
   */
  protected readonly schedulingTalk: BubbleTurn[] = [
    {
      who: 'A setTimeout',
      says: "I just finished, somewhere in your analytics widget. Don't know if that matters to anyone.",
    },
    {
      who: 'Zone.js',
      says: "Can't tell either — I patched every async API so I'd hear about all of them equally. Safest move: tick the whole application and let the comparison sort out what changed.",
    },
    {
      who: 'Your component',
      says: 'I do this ten times a second and nothing I own ever changes. You just checked me anyway.',
    },
    {
      who: 'Zone.js',
      says: 'I know. I have no way to know that in advance — every async completion looks the same to me.',
    },
    {
      who: 'A signal (zoneless)',
      says: "I don't have that problem. I already know exactly which views read me — I'll wake only those, and only on a real write.",
    },
  ];

  /**
   * Sample: what `Zone.js` actually did — patch the async surface of the
   * browser, then tick the entire application on any completion at all.
   */
  protected readonly zoneEraSample = `// zone.js, once per app bootstrap:
window.setTimeout = zonePatched(setTimeout);
window.Promise = zonePatched(Promise);
XMLHttpRequest.prototype.send = zonePatched(send);
// …about twenty more browser APIs, patched the same way

// then, forever, on every app:
ngZone.onMicrotaskEmpty.subscribe(() => {
  appRef.tick(); // ← checks EVERYTHING, every single time
});`;

  /** Line-by-line walkthrough of {@link zoneEraSample}. */
  protected readonly zoneEraNotes: CodeNote[] = [
    {
      line: 2,
      text: '`zonePatched()` wraps the real `setTimeout` so that whatever callback you pass it runs *inside* a zone Angular can observe. Your code never asks for this — it happens once, at startup, to the global.',
    },
    {
      line: 3,
      text: 'Same trick on `Promise`, so `.then()` continuations and `async`/`await` (which desugars to promises) are visible too.',
    },
    {
      line: 4,
      text: 'Same trick on the XHR prototype `fetch` is built on. By the time this finishes, essentially every way a callback can run later has been rerouted through the zone.',
    },
    {
      line: 8,
      text: '`onMicrotaskEmpty` fires once the current burst of async work has fully drained — the zone equivalent of "things have gone quiet."',
    },
    {
      line: 9,
      text: '`appRef.tick()` walks the **entire component tree from the root**, unconditionally. It has no idea which of the twenty patched APIs just fired, or whether anything relevant changed — only that *something*, somewhere, finished.',
    },
  ];

  /**
   * Sample: the scheduler's actual job — coalesce any number of notifications
   * arriving before the next microtask into exactly one pass. This is a
   * simplified illustration of the real mechanism, not the literal Angular
   * source, but it is honest about the one property that matters: the flag.
   */
  protected readonly schedulerSample = `class ChangeDetectionScheduler {
  private pending = false;

  notify(): void {
    if (this.pending) return;       // a tick is already on the way — absorb
    this.pending = true;
    queueMicrotask(() => {
      this.pending = false;
      this.applicationRef.tick();   // one pass, root → leaves, as always
    });
  }
}`;

  /** Line-by-line walkthrough of {@link schedulerSample}. */
  protected readonly schedulerNotes: CodeNote[] = [
    {
      line: 2,
      text: '`pending` is the whole coalescing mechanism. One boolean: is a pass already on its way?',
    },
    {
      line: 4,
      text: '`notify()` is what every trigger in the table below calls — a signal write, a template event, `markForCheck()`, a framework input write.',
    },
    {
      line: 5,
      text: 'If a pass is already scheduled, this call does **nothing more**. That is why three signal writes in one handler still produce one pass: the first call flips the flag, the second and third both return here.',
    },
    {
      line: 7,
      text: '`queueMicrotask` schedules the tick for the end of the *current* synchronous work — after your handler finishes, not immediately. This is what lets several writes in a row still land in the same pass.',
    },
    {
      line: 8,
      text: 'The flag resets before the tick runs, so a **new** notification arriving during the tick itself schedules a genuinely new pass rather than being silently dropped.',
    },
    {
      line: 9,
      text: '`tick()` is completely unaware that anything changed about *how* it got called. Zoneless changes **when** a pass is scheduled; it does not touch what a pass does once it starts — that is still root-to-leaves, OnPush pruning, `===` per binding.',
    },
  ];

  /**
   * Sample: `PendingTasks` — the piece that tracks outstanding async work once
   * there is no zone doing it implicitly. Both shapes: a promise-returning
   * call wrapped end to end, and a start/stop pair for work with no single
   * promise to await.
   */
  protected readonly pendingTasksSample = `private readonly pendingTasks = inject(PendingTasks);

// promise-shaped: one call wraps both ends for you
loadReport(): Promise<Report> {
  return this.pendingTasks.run(() => thirdPartySdk.fetchReport());
}

// span-shaped: you own the start and the end yourself
connectWidget(): void {
  const done = this.pendingTasks.add();
  thirdPartySdk.onReady(() => done());
}`;

  /** Line-by-line walkthrough of {@link pendingTasksSample}. */
  protected readonly pendingTasksNotes: CodeNote[] = [
    {
      line: 1,
      text: '`PendingTasks` is an injectable service — one instance, app-wide. `inject()` is the standard way to reach it from a field initializer or a function.',
    },
    {
      line: 5,
      text: '`run()` takes a function returning a `Promise`. It marks the app unstable the moment this is called, and stable again the moment the promise settles — success or failure, either way.',
    },
    {
      line: 10,
      text: '`add()` returns a callback — call it **nothing** yet marks the app unstable immediately. Use this shape when there is no single promise: a callback-based SDK, a WebSocket handshake, an event you wait for.',
    },
    {
      line: 11,
      text: 'The app stays unstable until `done()` is actually called. Forgetting to call it — an error path that never reaches the callback, say — leaves the app permanently unstable, which is its own failure mode: `whenStable()` never resolves at all.',
    },
  ];

  /**
   * Sample: testing. `fakeAsync` and `tick()` give way to
   * `await fixture.whenStable()` once there is no zone to fake.
   */
  protected readonly testingSample = `// zone era:
it('updates', fakeAsync(() => {
  component.load();
  tick(300);                    // zone-powered virtual time
  fixture.detectChanges();
}));

// zoneless:
it('updates', async () => {
  component.load();
  await fixture.whenStable();   // real async, same notifications as prod
  expect(el.textContent).toContain('loaded');
});`;

  /** Line-by-line walkthrough of {@link testingSample}. */
  protected readonly testingNotes: CodeNote[] = [
    {
      line: 4,
      text: '`tick(300)` fast-forwards a *simulated* clock that only exists because `fakeAsync` patched it — there is no real 300ms wait, and no equivalent once the test is not running inside a zone.',
    },
    {
      line: 11,
      text: '`fixture.whenStable()` returns a real `Promise` that resolves once `ApplicationRef.isStable` goes back to `true` — driven by `PendingTasks`, the same mechanism SSR depends on. If `load()` awaits something `PendingTasks` never heard about (a raw `setTimeout`, a callback-based SDK), this resolves **before** the assertion is true and the test is flaky rather than failing honestly.',
    },
  ];

  /**
   * The migration path, as a sequence rather than a list — each step depends
   * on the one before it landing cleanly, which a vertical flow says more
   * honestly than six bullet points at the same visual weight.
   */
  protected readonly migrationSteps: FlowStep[] = [
    {
      label: 'Go OnPush-first',
      detail:
        'Flip `ChangeDetectionStrategy.OnPush` across the app while `zone.js` is still there to catch anything you missed.',
    },
    {
      label: 'Hunt async-assigned fields',
      detail:
        '`subscribe()`, `.then()`, timers and socket callbacks writing to plain fields → convert to `signal()` or `toSignal()`.',
    },
    {
      label: 'Audit PendingTasks coverage',
      detail:
        'Anything SSR or a test must wait for that does not go through `HttpClient` needs its own `inject(PendingTasks)`.',
      tone: 'accent',
    },
    {
      label: 'Search for onStable / zone.run',
      detail:
        '`NgZone.onStable`, `onMicrotaskEmpty`, `zone.run` — in your code and your dependencies. Replace with `afterNextRender()` or an explicit notification.',
      tone: 'warn',
    },
    {
      label: 'Flip the provider, run the suite',
      detail:
        '`provideZonelessChangeDetection()` on a branch. Failures map almost 1:1 to missing notifications.',
    },
    {
      label: 'Delete the polyfill',
      detail:
        'Remove `"zone.js"` from `angular.json`’s `polyfills`. The provider alone does not do this — this step is the actual −25 kB.',
      tone: 'good',
    },
  ];

  /**
   * The self-test for live proof #1.
   *
   * The distractors are the two mistakes this lesson exists to prevent — that
   * an assignment inside `setTimeout` is somehow lost, and that "zoneless"
   * means plain fields stop working altogether. The `why` on each wrong
   * answer names the misconception rather than just restating the right one.
   */
  protected readonly setTimeoutQuizOptions: QuizOption[] = [
    {
      text: 'It updates within 300ms, same as the signal — both really changed.',
      why: 'The field really did change; the **screen** is what has not. Angular only reads a binding during a pass, and a plain assignment inside `setTimeout` schedules nothing. Reading and rendering are different moments.',
    },
    {
      text: 'It never updates — plain fields are broken once zoneless is on.',
      why: 'Plain fields render fine — every pre-signals Angular app was built on them. What a plain write cannot do is **notify**. Cause a pass by any means (a click elsewhere, say) and the field renders normally.',
    },
    {
      text: "Nothing changes until something else schedules a pass — then it shows the field's current value.",
      correct: true,
      why: 'Exactly. The write is invisible, not lost. The next pass — from any cause at all — re-reads the field and shows whatever it currently holds, which is why a stale plain-field demo can appear to “jump” the moment you click something unrelated.',
    },
    {
      text: 'It throws an error, because zoneless Angular forbids `setTimeout`.',
      why: 'Zoneless does not forbid anything — `setTimeout` runs exactly as normal JavaScript. What changed is that nothing is listening for it any more; there is no error, only silence.',
    },
  ];

  /**
   * The self-test for the `PendingTasks`/`whenStable()` material — the
   * coverage-sweep addition. The wrong options are the two ways a learner
   * predictably over- or under-trusts `whenStable()`.
   */
  protected readonly pendingTasksQuizOptions: QuizOption[] = [
    {
      text: "It waits for every Promise and timer anywhere in the app, because that's what `PendingTasks` tracks.",
      why: '`PendingTasks` only knows about work that **registered** with it — either through `HttpClient` (which does this for you) or an explicit `run()`/`add()` call. A bare `setTimeout` or a third-party callback is invisible to it, so `whenStable()` can resolve while that work is still in flight.',
    },
    {
      text: 'It resolves once the HTTP call completes, because it is registered — the raw `setTimeout` inside the same method is not, and the promise can resolve before that timer fires.',
      correct: true,
      why: "Right, and it's the trap: a test or an SSR render that looks like it “waited for everything” actually waited for exactly the things that registered — nothing more.",
    },
    {
      text: 'It throws, because mixing a tracked call with an untracked one inside the same method is not allowed.',
      why: 'Nothing enforces this — you can freely mix tracked and untracked async in one method. `PendingTasks` has no way to know the untracked call exists at all, which is precisely the danger: no error, just a race.',
    },
    {
      text: "It waits for the HTTP call and the timer, because both are inside the same component's method.",
      why: '`PendingTasks` tracks individual pieces of work, not methods or components. Being in the same function does nothing to make the raw timer visible to it.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'So does going zoneless mean I have to use signals for everything?',
      a: 'No — it means anything that should render has to **notify** somehow. A signal write is the easiest way, but `markForCheck()`, the `async` pipe, and a framework input write all notify too. What stops working is silent mutation with nothing telling the scheduler.',
    },
    {
      q: "I bound `(mousemove)` on a draggable panel and my render count went through the roof. Isn't zoneless supposed to remove wasted passes?",
      a: 'It removes passes caused by async work you never asked Angular to watch. A template event listener is different — Angular wraps every one of them, marking the view and notifying the scheduler **before your handler runs**, on every single firing. A `(mousemove)` binding really does behave like sixty tiny clicks a second. The fix is the same one `runOutsideAngular()` used to provide: keep the raw event off a template binding, do the frequent work in a plain callback, and write only a summarized value into a signal.',
    },
    {
      q: 'What actually happened to `runOutsideAngular()` — is it gone?',
      a: "The method itself still runs your callback fine; it just no longer controls anything, because change detection was never listening to `NgZone` in the first place once zoneless is on. It's inert rather than deleted. Code that actively *listens* to `NgZone.onStable`/`onMicrotaskEmpty` is the real migration risk — that has to be rewritten, usually with `afterNextRender()` or an explicit notification.",
    },
    {
      q: 'Three signals, one click handler — how many renders, and why does it matter?',
      a: 'One. Each write notifies the scheduler, but a pass is already pending after the first — see the `pending` flag in the scheduler sample. It matters because it means you never have to manually batch writes yourself; a burst of synchronous updates is always one pass, and the template never observes a half-applied state partway through.',
    },
    {
      q: 'Why does `PendingTasks` matter to me if I never call it directly?',
      a: "Because `HttpClient` calls it **for** you — every request you fire registers a pending task automatically, which is why `whenStable()`/SSR already correctly wait for your HTTP calls without any code from you. The moment your data comes from anywhere else (a raw `WebSocket`, a third-party SDK's callback, a bare `setTimeout`), that automatic coverage disappears and you own registering it yourself.",
    },
  ];
}
