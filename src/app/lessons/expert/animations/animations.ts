import { AnimationCallbackEvent, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: Angular animations in 2026 — the landscape changed. The legacy
 * `@angular/animations` package (`trigger`/`state`/`transition`) is DEPRECATED;
 * the modern path is native CSS transitions/keyframes plus two small framework
 * hooks — `animate.enter` and `animate.leave` — that solve the one thing CSS
 * genuinely cannot do alone: animating an element *out* of the DOM.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, see
 * `expert/change-detection` for the reference implementation and teaching
 * order this follows: pose the problem, then the analogy, then the mechanism,
 * then the same idea in several modes).
 *
 * The teaching spine is one sentence — **"Angular is a doorman, not a
 * choreographer"** — walked through every surface that sentence touches:
 * the declarative class form, the imperative callback form (new to this
 * rewrite — the class form alone leaves out half the modern API surface,
 * per `docs/COVERAGE-SWEEP.md`), the pure-CSS `@starting-style` primitive
 * that needs no Angular involvement at all, the legacy vocabulary read
 * fluently rather than written, and the two failure modes that catch people
 * who assume `animationend` is a drop-in replacement for `(@trigger.done)`
 * or that `prefers-reduced-motion` protects JavaScript-driven motion for
 * free. Every demo from the previous version of this lesson still works;
 * two more were added for the callback form and the reduced-motion gotcha.
 */
@Component({
  selector: 'app-lesson-animations',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Flow,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './animations.css',
  templateUrl: './animations.html',
})
export class Animations {
  // ── Demo 1: declarative enter/leave (CSS classes) ───────────────────────────
  /** Whether the toast is showing, for the class-based enter/leave demo. */
  protected readonly showToast = signal(false);

  // ── Demo 2: imperative enter/leave (callback form + Web Animations API) ─────
  /** Whether the JS-driven card is showing. */
  protected readonly jsCardVisible = signal(true);
  /** Arms the exact bug the Predict below asks about: never calling `animationComplete()`. */
  protected readonly forgetComplete = signal(false);

  /**
   * The callback form of `animate.leave`. Runs a Web Animations API animation
   * directly on the leaving element and — in the correct branch — signals
   * Angular when it is done.
   *
   * The `if (this.forgetComplete()) return;` branch exists only so the live
   * demo can arm the bug the Predict block asks about on purpose. It is not
   * part of the pattern being taught — {@link callbackSample} shows the
   * pattern without it.
   */
  protected onJsLeave(event: AnimationCallbackEvent): void {
    const anim = event.target.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'scale(.85) translateY(10px)' },
      ],
      { duration: 320, easing: 'ease-in' },
    );
    if (this.forgetComplete()) return; // the bug, on purpose — armed by the toggle below
    anim.finished.then(() => event.animationComplete());
  }

  protected removeJsCard(): void {
    this.jsCardVisible.set(false);
  }

  protected bringBackJsCard(): void {
    this.forgetComplete.set(false);
    this.jsCardVisible.set(true);
  }

  // ── Demo 3: state as a class + transition ───────────────────────────────────
  /** Whether the panel is open, for the state-as-a-class demo. */
  protected readonly open = signal(true);

  // ── Demo 4: staggered list ───────────────────────────────────────────────────
  /** Bumped to force the stagger demo's items to be re-created (and therefore re-animated). */
  private readonly generation = signal(0);
  /** The stagger demo's items. The list itself never changes — only {@link generation} does. */
  private readonly baseItems = [
    'Signals',
    'RxJS interop',
    'Control flow',
    'Deferred views',
    'Hydration',
  ];
  /**
   * The items, recomputed on each generation.
   *
   * Reads {@link generation} purely for the dependency — the list itself never changes. The
   * point is to make `@for` tear the nodes down and build them again, since a CSS entry
   * animation only plays on a genuinely *new* element.
   */
  protected readonly items = computed(() => {
    void this.generation();
    return this.baseItems;
  });
  /**
   * The tracking key for a stagger item.
   *
   * Includes the generation, which is what makes the keys change and therefore what makes
   * `@for` re-create rather than reuse. Tracking by index alone would reuse every node and
   * nothing would animate.
   */
  protected trackKey(index: number): string {
    return `${this.generation()}-${index}`;
  }
  /** Re-runs the stagger animation. */
  protected reshuffle(): void {
    this.generation.update((g) => g + 1);
  }

  // ── Presentation data ────────────────────────────────────────────────────────

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security', id: 'security' },
    { label: 'i18n', id: 'i18n' },
    { label: 'A11y', id: 'a11y' },
    { label: 'Animations' },
    { label: 'View Transitions', id: 'view-transitions' },
  ];

  /**
   * CSS and Angular negotiating who owns which half of a leave animation.
   * The exchange exists because the misconception it corrects is the whole
   * reason this lesson exists: learners assume Angular does the animating,
   * when really CSS (or a JS library) always did — Angular's one job is
   * timing the removal.
   */
  protected readonly doorTalk: BubbleTurn[] = [
    { who: 'You', says: '`@if` just flipped to false. Get this element off my screen.' },
    {
      who: 'Angular',
      says: "Normally I'd rip the node out right now — that's instant, and CSS can't animate what's already gone.",
    },
    {
      who: 'CSS',
      says: "Give me the node for one more moment and I'll fade it out myself. I don't need your help — I need time.",
    },
    {
      who: 'Angular',
      says: "Fine — `animate.leave`. I'll apply your class (or run your callback), hold the node, and wait for `animationend` or your own `animationComplete()`.",
    },
    { who: 'CSS', says: "…done. Opacity's at zero, the transform finished. Take it away." },
  ];

  /** The sequence `animate.leave` actually runs, for the {@link Flow} diagram. */
  protected readonly leaveFlowSteps: FlowStep[] = [
    { label: '`@if` flips', detail: 'A signal read turns false. Nothing animation-specific yet.' },
    {
      label: 'Angular holds the node',
      detail: "Doesn't remove it. This is the one step CSS alone cannot do.",
      tone: 'accent',
    },
    {
      label: 'Your exit runs',
      detail: 'A CSS class, or your own callback — either way, the motion happens here.',
    },
    {
      label: 'Angular is told',
      detail: '`animationend`/`transitionend` fires, or you call `animationComplete()`.',
      tone: 'good',
    },
    { label: 'Node removed', detail: 'Only now does the element actually leave the DOM.' },
  ];

  // --- code samples ---

  /** Sample: enter and leave via plain CSS classes — the modern default. */
  protected readonly enterLeaveSample = `@if (saved()) {
  <div
    class="toast"
    animate.enter="fade-slide-in"
    animate.leave="fade-slide-out">
    Saved!
  </div>
}

/* component or global stylesheet */
.fade-slide-in  { animation: fade-slide-in .3s ease; }
.fade-slide-out { animation: fade-slide-out .25s ease forwards; }

@keyframes fade-slide-in  { from { opacity: 0; transform: translateY(8px); } }
@keyframes fade-slide-out { to   { opacity: 0; transform: translateY(-8px); } }`;

  /** Line-by-line walkthrough of {@link enterLeaveSample}. */
  protected readonly enterLeaveNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@if` is control flow, not animation — `saved()` is a signal read, so this block appears and disappears as the signal changes.',
    },
    {
      line: 4,
      text: '`animate.enter` — a **property binding**, no parentheses. Its value is the CSS class to apply. Angular adds it right after the node is inserted and strips it again once the animation ends; you never touch it yourself.',
    },
    {
      line: 5,
      text: "`animate.leave` — same shape, opposite moment. This is the one CSS can't do alone: it names the exit class, and Angular keeps the node in the DOM until that class's animation finishes, then removes it.",
    },
    {
      line: 11,
      text: 'Ordinary CSS, nothing Angular-specific. `animate.enter` only decides **when** this class gets added — the animation itself is a plain `@keyframes` rule.',
    },
    {
      line: 12,
      text: '`forwards` is load-bearing. Drop it and the element snaps back to `opacity: 1` for one frame before Angular removes it — the hold-then-remove sequence below is what makes that frame visible at all.',
    },
    {
      line: 14,
      text: 'Only `from` is given. The browser fills in the implicit `to` from the element’s live computed style, so this works wherever the toast actually sits on screen.',
    },
    {
      line: 15,
      text: 'The mirror image: only `to`. Neither keyframe needs to know the "other side" — the browser interpolates from whatever is currently rendered.',
    },
  ];

  /** Sample: the callback form of `animate.leave`, driving a Web Animations API animation. */
  protected readonly callbackSample = `<div class="js-card" (animate.leave)="onJsLeave($event)">
  Driven by the Web Animations API, not a class.
</div>

import { AnimationCallbackEvent } from '@angular/core';

protected onJsLeave(event: AnimationCallbackEvent): void {
  const anim = event.target.animate(
    [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'scale(.85) translateY(10px)' },
    ],
    { duration: 320, easing: 'ease-in' },
  );
  anim.finished.then(() => event.animationComplete());
}`;

  /** Line-by-line walkthrough of {@link callbackSample}. */
  protected readonly callbackNotes: CodeNote[] = [
    {
      line: 1,
      text: '`(animate.leave)` in parentheses — an **event binding**, not the property form above. This is how you hand the exit over to your own code instead of a CSS class.',
    },
    {
      line: 5,
      text: '`AnimationCallbackEvent` is a real, exported type with exactly two members: `target` (the leaving `Element`) and `animationComplete` (a function you call when you’re done).',
    },
    {
      line: 8,
      text: '`event.target` is the actual DOM element about to be removed. `.animate()` is the **Web Animations API** — built into the browser, no Angular involvement and no library required to use it.',
    },
    {
      line: 9,
      text: 'A "from" object and a "to" object. Anything a JS animation library — GSAP, Motion One — would do here works identically; the contract only cares that something eventually finishes.',
    },
    {
      line: 15,
      text: '**The line that matters.** `anim.finished` is a promise the Web Animations API gives you; the moment it resolves, this calls `event.animationComplete()` — the signal that tells Angular the node can finally go. Forget this line and see the demo below for what actually happens.',
    },
  ];

  /** Sample: `@starting-style` + `transition-behavior: allow-discrete` — a native, Angular-free entry primitive. */
  protected readonly startingStyleSample = `/* Plain CSS — no Angular API. Works with <dialog>, popovers, or any
   element you show or hide by toggling a class or [hidden]. */
dialog {
  opacity: 0;
  transform: scale(.92);
  transition:
    opacity .2s ease,
    transform .2s ease,
    display .2s allow-discrete,
    overlay .2s allow-discrete;
}
dialog[open] {
  opacity: 1;
  transform: none;
}

/* The 'from' state for the very first paint after [open] appears —
   normally a transition can't run on an element's INITIAL styles. */
@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(.92);
  }
}`;

  /** Line-by-line walkthrough of {@link startingStyleSample}. */
  protected readonly startingStyleNotes: CodeNote[] = [
    {
      line: 4,
      text: 'The closed rest state — also what `dialog` snaps to the instant `[open]` is removed, unless a transition is already running.',
    },
    {
      line: 9,
      text: "`display` can't normally be *animated* — it's discrete, either `none` or not. `allow-discrete` treats it as a two-value step anyway: keep the old value for the whole transition, flip only at the very end.",
    },
    {
      line: 10,
      text: "`overlay` controls when the browser drops the element from the top layer, where `<dialog>` and popovers render. Same discrete treatment, for the same reason: don't vanish from the accessibility tree before the fade finishes.",
    },
    {
      line: 12,
      text: '`dialog[open]` is the **arrived** state — what the browser transitions *to* when `open` is added, and transitions *from* when it’s removed.',
    },
    {
      line: 19,
      text: "This is the whole trick. `display: none → block` has no 'before' opacity to transition from — the element didn't exist a frame ago. `@starting-style` invents one: the instant `[open]` appears, the browser briefly renders these values, then immediately starts transitioning to the real `dialog[open]` rule above.",
    },
  ];

  /** Sample: state as a class plus a `transition`, rather than a state machine. */
  protected readonly stateSample = `<!-- state lives in a signal; [class.closed] IS the entire "state machine" -->
<div class="panel" [class.closed]="!open()">
  <div class="panel__inner">…content…</div>
</div>

.panel {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows .3s ease, opacity .3s ease;
}
.panel.closed { grid-template-rows: 0fr; opacity: 0; }
.panel > div  { min-height: 0; overflow: hidden; }`;

  /** Line-by-line walkthrough of {@link stateSample}. */
  protected readonly stateNotes: CodeNote[] = [
    {
      line: 2,
      text: "`[class.closed]` toggles ONE class from ONE signal read (`!open()`). That's the entire 'state machine' — no `trigger()`, no `state()`, no `transition()` vocabulary needed.",
    },
    {
      line: 8,
      text: '`1fr` — a grid row set to one fraction of the available space, i.e. "as tall as the content needs". Unlike `height: auto`, an `fr` value is a real number, so it can be interpolated smoothly.',
    },
    {
      line: 9,
      text: 'Both properties animate together over the same `.3s` — the entire open/close motion is this one line.',
    },
    {
      line: 11,
      text: '`0fr` is also a real number. `1fr → 0fr` genuinely interpolates to zero height, which `auto → 0` cannot do at all.',
    },
    {
      line: 12,
      text: "Both declarations are load-bearing. A grid item's default `min-height` is `auto`, which refuses to shrink below its content — without `min-height: 0` the row never actually collapses. `overflow: hidden` then stops the content spilling out while it closes.",
    },
  ];

  /** Sample: staggering with a per-index `animation-delay`. */
  protected readonly staggerSample = `@for (item of items(); track trackKey($index)) {
  <div
    class="stagger-item"
    [style.animation-delay.ms]="$index * 70">
    {{ item }}
  </div>
}

.stagger-item {
  animation: fade-slide-in .35s ease backwards;
}`;

  /** Line-by-line walkthrough of {@link staggerSample}. */
  protected readonly staggerNotes: CodeNote[] = [
    {
      line: 1,
      text: "`trackKey($index)` bakes in a generation counter — pressing “Load list again” below gives `@for` brand-new keys, so it tears every item down and rebuilds them. That's the only way a CSS entry animation gets to run a second time.",
    },
    {
      line: 4,
      text: "`.ms` is a **unit suffix**, not decoration — Angular appends it for you, so the expression stays a plain number. Drop it and you're binding a bare number to a CSS property, which is invalid and fails silently.",
    },
    {
      line: 10,
      text: "`backwards` fixes a flicker nobody expects: without it, an item sits fully visible for its whole delay and only then jumps to invisible before fading in. `backwards` applies the animation's first keyframe **during** the delay too, so it waits invisibly instead.",
    },
  ];

  /** Sample: the deprecated `trigger`/`state`/`transition` vocabulary, extended into a fuller cheat sheet. */
  protected readonly legacySample = `// DEPRECATED — for reading legacy code, not for writing new code
import {
  trigger, state, style, transition, animate,
  query, stagger, group, sequence, animateChild,
} from '@angular/animations';

@Component({
  animations: [
    trigger('openClose', [
      state('open',   style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0', opacity: 0 })),
      transition('open <=> closed', animate('200ms ease')),
      transition(':enter', [style({ opacity: 0 }), animate('150ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms', style({ opacity: 0 }))]),
    ]),
    trigger('list', [
      transition('* => *', [
        query(':enter', [style({ opacity: 0 }), stagger(60, animate('200ms'))], { optional: true }),
      ]),
    ]),
  ],
})
// <div [@openClose]="isOpen ? 'open' : 'closed'" (@openClose.done)="onDone($event)">
// required: provideAnimationsAsync() in app.config.ts`;

  /** Line-by-line walkthrough of {@link legacySample}. */
  protected readonly legacyNotes: CodeNote[] = [
    {
      line: 4,
      text: "`group()` runs its child steps **in parallel** — same timing frame. `sequence()` runs them **one after another**. `animateChild()` tells a parent's own transition to wait for a nested trigger's animation before considering itself done — the fix for the trap in the Predict further down.",
    },
    {
      line: 10,
      text: '`\'*\'` inside `style()` is special: it means "whatever the real computed value is". This is how the legacy engine animated to `height: auto` — the grid-rows trick a few sections back exists because CSS alone has no equivalent of this trick.',
    },
    {
      line: 12,
      text: "`'open <=> closed'` is shorthand for two transitions at once — `open => closed` and `closed => open` — animated identically.",
    },
    {
      line: 13,
      text: "`:enter` is an **alias**, not new syntax. It means exactly `void => *`: the element didn't exist a moment ago (`void`), and now it's in some state (`*`).",
    },
    {
      line: 14,
      text: '`:leave` is the mirror alias for `* => void`. `void` is a real pseudo-state name here, not "nothing" — it represents the element not existing.',
    },
    {
      line: 17,
      text: "`'* => *'` — wildcard to wildcard, meaning **any** state change at all fires this transition. Used here because `list` isn't tracking named states, just reacting to anything changing.",
    },
    {
      line: 18,
      text: "`query(':enter', …)` finds only the elements newly added this cycle. `{ optional: true }` is not decoration: without it, `query()` **throws** the moment it matches zero elements — which it will, the first time this list renders empty.",
    },
    {
      line: 23,
      text: '`(@openClose.done)` — the modern replacement is `(animationend)`/`(transitionend)`. They are not quite equivalent; the gotcha is below.',
    },
    {
      line: 24,
      text: 'This provider wires up the whole legacy engine. Remove it once nothing in the app still declares `animations: […]` — you also remove the bundle weight it costs.',
    },
  ];

  /** Sample: honouring `prefers-reduced-motion`. Not optional — for some users motion causes real nausea. */
  protected readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  .fade-slide-in, .fade-slide-out, .stagger-item, .js-card {
    animation: none;
  }
  .panel {
    transition: none;
  }
}

/* Stricter and safer: motion is the exception, not the default. */
@media (prefers-reduced-motion: no-preference) {
  .toast {
    animation: fade-slide-in .3s ease;
  }
}`;

  /** Line-by-line walkthrough of {@link reducedMotionSample}. */
  protected readonly reducedMotionNotes: CodeNote[] = [
    {
      line: 1,
      text: "Reads an OS-level setting the user already chose — macOS Reduce Motion, Windows's animation toggle, the Android equivalent. You're not guessing; they told the browser.",
    },
    {
      line: 2,
      text: 'Every animation class this lesson defines, in one selector — including `.js-card`, even though its motion is driven from JavaScript. CSS can strip the *keyframes* behind the class form for free; see the FAQ below for why this line does **not** protect the Web Animations API demo above.',
    },
    {
      line: 3,
      text: "`animation: none` removes the whole thing. Safe by construction: the end state of every animation here is simply the element's normal, final style.",
    },
    {
      line: 11,
      text: 'The opt-**out** pattern above needs updating every time a new animation is added, and one forgotten selector silently ships motion to someone it can make ill. This flips the default: nothing animates unless the user has explicitly allowed it.',
    },
  ];

  // --- retention devices ---

  /** The self-test on why `animate.leave` exists at all. */
  protected readonly whyLeaveQuizOptions: QuizOption[] = [
    {
      text: "Because CSS can't animate `transform` or `opacity` changes on its own.",
      why: 'CSS has always been able to animate those — that was never the gap. The toast demo above proves it: the entrance runs on pure CSS, zero framework help.',
    },
    {
      text: "Because `@if` removes the element from the DOM the same instant its condition flips, so by the time a CSS animation would start, there's nothing left to animate.",
      correct: true,
      why: "Exactly the problem this whole lesson is about. `animate.leave` doesn't add animation capability CSS lacked — it buys CSS the time it needed by delaying the removal.",
    },
    {
      text: "Because this app runs zoneless, and zoneless apps can't run CSS animations without a framework hook.",
      why: "Zoneless is a change-detection scheduling story — when Angular decides to re-check a component. It has nothing to do with whether the browser plays a CSS animation; that runs entirely outside Angular's render loop, zoned or not.",
    },
    {
      text: 'Because any animation in an Angular app needs `@angular/animations` imported, even a plain CSS one.',
      why: "That's the legacy package, and it was never required for CSS. A `@keyframes` rule and a class binding have animated Angular templates since before that package existed.",
    },
  ];

  /** The self-test on compositor-safe properties. */
  protected readonly performanceQuizOptions: QuizOption[] = [
    {
      text: '`height` and `top`',
      why: "These trigger layout on every single frame — the browser has to re-flow this element and everything it displaces before it can even paint. That's the most common cause of animation jank on weaker devices.",
    },
    {
      text: '`transform` and `opacity`',
      correct: true,
      why: 'Both are handled entirely by the compositor — a separate thread that only touches the final bitmap. No layout, no paint, and it stays smooth even while the main thread is busy running your app code.',
    },
    {
      text: '`margin` and `width`',
      why: 'Same problem as height/top: both affect layout, so the browser recomputes geometry for this element and its neighbours on every frame of the animation.',
    },
    {
      text: '`box-shadow` and `filter`',
      why: 'Half right — `filter` is usually paint-only and fine. Animating `box-shadow` directly forces a full repaint of its bounding box every frame, which is why the trick is to animate the *opacity* of a separate shadow layer instead.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I still need `provideAnimationsAsync()` for `animate.enter`/`animate.leave`?',
      a: 'No. Those bindings ship free with the framework — no provider, no extra bundle weight. `provideAnimationsAsync()` (and `provideNoopAnimations()`) only exist for the legacy `@angular/animations` engine; once nothing in the app declares `animations: […]` any more, delete them.',
    },
    {
      q: 'Do my tests need to do anything special for these animations?',
      a: "Almost never. CSS animations don't run meaningfully in most test environments, so assertions typically check the DOM directly — is the node present, does it have the class — rather than waiting on motion. `provideNoopAnimations()` existed specifically because `trigger()`-driven animations **would** hang a synchronous legacy test; that need disappears with the package. For an end-to-end tool like Playwright, you can force `prefers-reduced-motion` on the browser context so screenshots stay deterministic instead of racing a real animation.",
    },
    {
      q: 'Does turning on reduce motion protect the callback-form demo above too?',
      a: "Not automatically — that's the trap. CSS animations and transitions honour the media query for free; the browser checks it before running anything CSS triggers. A `.animate()` call from your own JavaScript doesn't get that check. You have to read `matchMedia('(prefers-reduced-motion: reduce)').matches` yourself and shorten or skip the keyframes — one more reason to prefer the declarative class form unless you specifically need JavaScript.",
    },
    {
      q: 'Does `animate.leave` work the same way for `@for` removing one item as it does for `@if`?',
      a: "Yes — anything that causes Angular to remove a node triggers it, item by item. Each `<div>` in a `@for` needs its own `animate.leave`; there's no list-level version, because the framework is only ever holding one node at a time.",
    },
    {
      q: 'What exactly does `(animationend)` give me that `(@trigger.done)` had, and what does it lose?',
      a: '`(@trigger.done)` fired once, scoped to the element that owned the trigger, with a rich `$event` (`fromState`, `toState`, `phaseName`, `totalTime`). `(animationend)` is a plain DOM event, which means it also **bubbles** from any animated descendant — see the guard below, because that difference is a real, working regression, not just a smaller API.',
    },
  ];
}
