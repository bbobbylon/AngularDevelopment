import { Component, afterRenderEffect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { OnPushChild } from './on-push-child/on-push-child';
import { DefaultChild } from './default-child/default-child';
import { DetachChild } from './detach-child/detach-child';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: change detection deep dive — what a CD pass actually is (LView,
 * binding slots, `===` comparison), what schedules one (zone era vs zoneless),
 * Default vs OnPush proven side-by-side with live check counters, signals'
 * targeted marking, detach/reattach, and NG0100 (ExpressionChanged…).
 *
 * ## Presentation
 *
 * This is the **reference implementation of the brain-friendly layer** (see
 * `shared/brain/` and `docs/UI-DESIGN.md` §9) — the first lesson migrated to it,
 * and the one to copy the shape from when migrating another.
 *
 * The teaching order is deliberate and is the order the layer is designed
 * around, not just a list of sections:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "your data
 *    changed — who tells the screen?", and makes the reader commit to an answer
 *    on a napkin before any mechanism is described. A reader with a wrong guess
 *    in their head reads the explanation far more carefully than one with no
 *    guess at all.
 * 2. **Analogy next, mechanism after.** The proofreader-with-a-photocopy frame
 *    gives the reader somewhere to *put* LView and binding slots before those
 *    words appear. Introduced in reverse, the vocabulary has nothing to attach
 *    to and slides off.
 * 3. **Then the same idea in four modes** — dialogue between the parts, a
 *    containment diagram, an annotated compiled template, and live counters —
 *    because the retention bar is redundancy across modes, not repetition in
 *    one.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing on
 *    this page assumes the reader can already read the snippet; they are here
 *    because they cannot.
 */
@Component({
  selector: 'app-lesson-change-detection',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
    OnPushChild,
    DefaultChild,
    DetachChild,
  ],
  styleUrl: './change-detection.css',
  templateUrl: './change-detection.html',
})
export class ChangeDetection {
  /**
   * How many passes have reached this lesson's own view.
   *
   * Deliberately NOT a getter that increments on every read (`get renderTick() {
   * return ++this.ticks; }`), which is what this field replaced. That pattern reads
   * as an elegant way to "count checks" but is actually a live NG0100 generator: dev
   * mode reads every template expression twice per pass to verify nothing moved, and
   * a getter with a side effect guarantees the two reads disagree. `afterRenderEffect`
   * runs once per pass, strictly after rendering and outside the verify window, so
   * counting here is safe — and it is also the more honest place to count from, since
   * it fires only on passes that actually reached the DOM.
   */
  protected readonly passes = signal(0);

  constructor() {
    afterRenderEffect(() => this.passes.update((n) => n + 1));
  }

  /**
   * A counter driving the demo.
   */
  protected readonly count = signal(0);
  /**
   * The value fed to the `OnPush` child.
   */
  protected readonly onPushValue = signal(0);
  /**
   * The value fed to the detachable child.
   */
  protected readonly detachValue = signal(0);
  /**
   * A signal value, for the signal-versus-plain-field comparison.
   */
  protected readonly sigVal = signal(0);
  /**
   * A plain field holding the equivalent value. Writes to it are invisible.
   */
  protected plainVal = 0;

  /**
   * Does nothing, deliberately.
   *
   * Clicking it still triggers a change-detection pass — an event handler marks
   * its view dirty regardless of whether the handler changed anything. That is
   * why a button that does nothing still makes the counters move.
   */
  protected noop(): void {}
  /**
   * Mutates a plain field from a `setTimeout`.
   *
   * Asynchronous on purpose: no event to mark the view, no signal to notify the
   * scheduler. The field really changes; nothing renders it.
   */
  protected mutatePlain(): void {
    // async on purpose: no event, no signal → nothing schedules or marks
    setTimeout(() => this.plainVal++);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection' },
    { label: 'OnPush', id: 'onpush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer', id: 'deferrable-views' },
    { label: 'Performance', id: 'performance' },
  ];

  /**
   * The three parts of a check, talking to each other.
   *
   * This exchange exists because the relationship it describes is the one
   * learners reliably get backwards: they assume the *signal* updates the DOM.
   * It does not. It marks, and it asks for a pass; the pass does the comparing;
   * the comparing decides whether the DOM is touched at all. Three actors, three
   * jobs — far easier to keep straight as a conversation than as a paragraph
   * about a pipeline.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: 'I just ran `count.set(1)`. Go update the screen.',
    },
    {
      who: 'The signal',
      says: "I don't touch the screen. I noted which views read me, I've flagged those, and I told the scheduler a pass is needed.",
    },
    {
      who: 'The scheduler',
      says: 'Noted. I coalesce — if you set five signals in one go, that is still one pass.',
    },
    {
      who: 'The pass',
      says: 'Walking from the root. For each view I run its update function and compare every binding with the value I stored last time.',
    },
    {
      who: 'The binding',
      says: "`0 === 1`? No. So I write to the DOM. Everything else on this view compared equal, so I didn't touch it.",
    },
  ];

  /**
   * Sample: what the compiler turns a template into — one function with a create
   * pass and an update pass, plus the binding slots it compares against.
   */
  protected readonly lviewSample = `function Counter_Template(rf: RenderFlags, ctx: Counter) {
  if (rf & RenderFlags.Create) {
    ɵɵelementStart(0, 'p');
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & RenderFlags.Update) {
    ɵɵadvance(1);
    ɵɵtextInterpolate1('Count: ', ctx.count(), '');
  }
}`;

  /** Line-by-line walkthrough of {@link lviewSample}. */
  protected readonly lviewNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Your template compiled down to a plain function. `rf` is a bitmask saying which mode to run; `ctx` is the component instance — so `ctx.count` is your field.',
    },
    {
      line: 2,
      text: 'The **create** branch. It runs exactly once, when the view is first built.',
    },
    {
      line: 3,
      text: "`ɵɵelementStart(0, 'p')` creates a `<p>`. The `0` is its index in this view's LView array — that array is how Angular finds the node again without ever querying the DOM.",
    },
    {
      line: 4,
      text: '`ɵɵtext(1)` reserves slot 1 for a text node. It is empty right now; the update branch is what fills it.',
    },
    {
      line: 7,
      text: 'The **update** branch. This is what "checking a view" means, and it runs on every single pass that reaches this view.',
    },
    {
      line: 8,
      text: '`ɵɵadvance(1)` moves the internal cursor to slot 1 — the text node from line 4. Slots, not selectors: this is why checking is cheap.',
    },
    {
      line: 9,
      text: 'The whole game, on one line. It calls `ctx.count()`, compares the result with the value already parked in slot 1 using `===`, and touches the DOM **only if they differ**. Equal values cost one comparison and nothing else.',
    },
  ];

  /** Sample: scheduling, zone era against signal era. */
  protected readonly schedulingSample = `// ZONE ERA — implicit:
click / setTimeout / fetch / Promise.then
  → zone.js notices the async work finished
  → onMicrotaskEmpty → ApplicationRef.tick()

// ZONELESS (this app) — explicit:
signal.set(…) | (click) handler | markForCheck() | input write
  → ChangeDetectionScheduler.notify()
  → one coalesced tick`;

  /**
   * Sample: how a signal read inside a template registers that view as a
   * consumer, which is what makes a signal write able to mark exactly the right
   * views.
   */
  protected readonly signalsSample = `readonly count = signal(0);

this.count.set(1);
// 1. marks the consuming views dirty — not the whole tree
// 2. notifies the scheduler that a pass is needed`;

  /** Line-by-line walkthrough of {@link signalsSample}. */
  protected readonly signalsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Creating the signal does nothing special. The interesting part happens when a **template** calls `count()` — that read quietly registers the view as a consumer of this signal.',
    },
    {
      line: 3,
      text: 'One call, two entirely separate jobs. Learners who blur them cannot explain why a mutation renders nothing, so keep them apart: **marking** and **scheduling**.',
    },
    {
      line: 4,
      text: 'Job one — marking. Only the views that actually read `count` are flagged dirty, plus their ancestor path so the pass can reach them. A tree of 400 components with one consumer flags one branch.',
    },
    {
      line: 5,
      text: 'Job two — scheduling. Without this, the flags would sit there until something else caused a pass. This is the job a plain field write cannot do, which is the entire reason mutation appears to "not work".',
    },
  ];

  /**
   * Sample: NG0100 — `ExpressionChangedAfterItHasBeenCheckedError`. Dev mode
   * runs every pass twice and compares, so a binding that changes as a side
   * effect of being read is caught rather than left as a mystery.
   */
  protected readonly ng0100Sample = `// parent template:
<app-child [label]="title" />

// child, violating one-way data flow:
ngOnInit() {
  this.parentState.title = 'changed!';
}
// → dev mode's verify run sees a different value → NG0100`;

  /** Line-by-line walkthrough of {@link ng0100Sample}. */
  protected readonly ng0100Notes: CodeNote[] = [
    {
      line: 2,
      text: 'The parent binds `title` into the child. By the time the child is checked, the parent has **already been checked this pass** — its slots are recorded and it will not be revisited.',
    },
    {
      line: 5,
      text: '`ngOnInit` on the child runs during that same pass, and here it reaches back up and writes to state the parent is bound to. Data is now flowing **up** through a binding that only flows down.',
    },
    {
      line: 6,
      text: 'The write itself is legal JavaScript and succeeds. That is what makes this bug feel unfair — nothing failed, the pass just no longer agrees with itself.',
    },
    {
      line: 8,
      text: 'In dev builds Angular runs the whole pass a second time and compares. `title` now reads `changed!` where it read the old value moments ago, so it throws. In production the second run is skipped: no error, just a view that is silently stale until something else schedules a pass.',
    },
  ];

  /**
   * Sample: the `ChangeDetectorRef` API — `markForCheck`, `detectChanges`,
   * `detach`, `reattach` — and which direction through the tree each one goes.
   */
  protected readonly cdrSample = `private readonly cdr = inject(ChangeDetectorRef);

cdr.markForCheck();
cdr.detectChanges();
cdr.detach();
cdr.reattach();
inject(ApplicationRef).tick();`;

  /** Line-by-line walkthrough of {@link cdrSample}. */
  protected readonly cdrNotes: CodeNote[] = [
    {
      line: 1,
      text: "`ChangeDetectorRef` is the handle to **this component's own view**. `inject()` is the modern way to get it; the constructor-parameter form does the same thing.",
    },
    {
      line: 3,
      text: '`markForCheck()` walks **upward**, flagging this view and every ancestor so the next pass can reach it. It does not run anything — nothing happens until a pass arrives.',
    },
    {
      line: 4,
      text: '`detectChanges()` walks **downward**, and runs **now**, synchronously: this view and its children, immediately. Reach for it only when you have detached and taken over rendering yourself.',
    },
    {
      line: 5,
      text: '`detach()` removes the view from the traversal entirely. Not "skip unless dirty" like OnPush — genuinely absent. Even a changed input renders nothing.',
    },
    {
      line: 6,
      text: '`reattach()` puts it back. Pair it with `markForCheck()` or the view will keep showing whatever it last rendered until something else dirties it.',
    },
    {
      line: 7,
      text: '`ApplicationRef.tick()` runs a full pass from the root. Almost always the wrong tool — if you need this, something upstream has failed to notify the scheduler.',
    },
  ];

  /**
   * The self-test.
   *
   * The distractors are the two mistakes this lesson exists to prevent — that a
   * signal write pushes to the DOM, and that OnPush is what stops the plain
   * field from rendering. The `why` on each wrong answer is the most valuable
   * copy on the page (CONTRIBUTING §2A), so each one names the misconception
   * rather than just restating the right answer.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'The counter shows the new value immediately — the field changed.',
      why: 'The field really did change; the **screen** is what has not. Angular only reads a binding during a pass, and a plain assignment inside `setTimeout` schedules nothing. Reading and rendering are different moments.',
    },
    {
      text: 'Nothing changes until something else schedules a pass — then it jumps to the current value.',
      correct: true,
      why: 'Exactly. The write is invisible, not lost. The next pass — from any cause at all, including a no-op click somewhere else — re-reads the field and finds the newer number, so the display can jump by several at once.',
    },
    {
      text: 'Nothing changes, ever. Angular only renders signals.',
      why: 'Plain fields render fine — every pre-signals Angular app was built on them. What plain fields cannot do is **notify**. Cause a pass by any means and the field renders normally.',
    },
    {
      text: 'It throws NG0100, because the value changed after the view was checked.',
      why: "NG0100 needs the value to change **during** a pass, so that dev mode's verification run disagrees with the first. A `setTimeout` fires long after the pass is over — no disagreement, no error.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If the pass walks the whole tree anyway, how is OnPush faster?',
      a: 'It walks the tree but does not **check** every view. Reaching an OnPush view that is not dirty and has no changed input costs one flag test, and the entire subtree below it is skipped. The walk is cheap; running update functions and evaluating bindings is what costs, and that is what gets pruned.',
    },
    {
      q: "I called `markForCheck()` and nothing happened. Isn't it supposed to re-render?",
      a: 'It marks; it does not run. `markForCheck()` flags this view and its ancestors as needing a check on the **next** pass. If nothing ever schedules that pass, nothing renders. In a zoneless app that is a real possibility — you need something that calls `notify()` too. `detectChanges()` is the one that runs immediately.',
    },
    {
      q: 'Why does clicking a button that does nothing still make the counters move?',
      a: 'Angular wraps every template listener. The wrapper marks the view dirty and notifies the scheduler **before** your handler runs — it cannot know in advance that your handler will change nothing. So a no-op click costs a real pass. That is exactly why an expensive expression in a binding hurts: it pays that cost on every one.',
    },
    {
      q: 'Is `===` on every binding not slow for a big app?',
      a: 'The comparison is not the cost — it is a flat array read and one reference compare per slot, and a large app has thousands of those, not millions. What gets expensive is what happens **before** the compare: a getter that sorts a list, a function call in a binding, a pipe that is not pure. Move that work into a `computed()` and the pass gets its speed back.',
    },
    {
      q: 'Does using signals mean I can drop OnPush?',
      a: 'Increasingly, yes — signal-based components are checked when their signals change regardless of strategy, and Angular is moving toward that being the default behaviour. Today, on a component that still has non-signal state, `OnPush` is what stops the pass from checking it on every unrelated event. Setting both costs nothing and is the current recommendation.',
    },
  ];
}
