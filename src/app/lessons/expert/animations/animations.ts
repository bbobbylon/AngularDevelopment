import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Chain, Receipt, Scribble } from '../../../shared/shapes';
import type { ReceiptRow } from '../../../shared/shapes';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Angular animations in 2026 — the landscape shifted. The classic
 * @angular/animations package (trigger/state/transition) is DEPRECATED; the
 * modern path is native CSS transitions/keyframes plus the built-in
 * animate.enter / animate.leave bindings for DOM add/remove. This page
 * teaches the modern approach live (enter/leave, state toggles, staggered
 * lists), maps the legacy API onto it (you WILL meet trigger() in older
 * codebases and exams), and covers performance + reduced-motion discipline.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer, following the shape recorded in
 * `lessons/expert/change-detection/`. Everything hangs off one analogy,
 * introduced early and called back to at every later section rather than
 * introduced once and dropped: **you are the keyframe artist, the browser
 * is the in-betweener.** Traditional animation studios had a lead artist
 * draw the key poses and junior "in-betweeners" draw every frame that
 * connects them; CSS `@keyframes` is named after exactly this division of
 * labor. It pays for itself repeatedly — it explains why `from`/`to` can be
 * given alone, why the legacy JS-driven API was slower (Angular was doing
 * the director's *and* the in-betweener's job on the main thread), and why
 * only `transform`/`opacity` are cheap (the in-betweener can only work for
 * free when the poses it's handed don't require redrawing the scene).
 *
 * ## Page shape — "The Receipt" (BACKLOG §2.10 step 5)
 *
 * The opening block itemises the rendering pipeline as a bill: four stages
 * paid, every frame, by a naively-animated property, versus one paid by
 * `transform`/`opacity` — a real cost, which is exactly what `app-receipt` is
 * for (`docs/CONTRIBUTING.md` §2C). Its own code sample and quiz are
 * deliberately fresh, not `pipelineCheap`/`pipelineExpensive`/`quizOptions`
 * used later for the full Web Vitals walkthrough — same underlying
 * mechanism, a different device asking a different question (the block asks
 * "does `box-shadow` reach Layout"; the later quiz asks which properties are
 * cheap at all).
 */
@Component({
  selector: 'app-lesson-animations',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
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
  ],
  styleUrl: './animations.css',
  templateUrl: './animations.html',
})
export class Animations {
  /**
   * Whether the toast is showing, for the enter/leave demo.
   */
  protected readonly showToast = signal(false);
  /**
   * Whether the panel is open, for the state-as-a-class demo.
   */
  protected readonly open = signal(true);

  // --- stagger demo: change the tracking keys so @for re-creates (and re-animates) items ---
  /**
   * Bumped to force the stagger demo's items to be re-created.
   */
  private readonly generation = signal(0);
  /**
   * The stagger demo's items.
   */
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
   * Reads {@link generation} purely for the dependency — the list itself never
   * changes. The point is to make `@for` tear the nodes down and build them again,
   * since a CSS entry animation only plays on a *new* element.
   */
  readonly items = computed(() => {
    void this.generation();
    return this.baseItems;
  });
  /**
   * The tracking key for a stagger item.
   *
   * Includes the generation, which is what makes the keys change and therefore
   * what makes `@for` re-create rather than reuse. Tracking by index alone would
   * reuse every node and nothing would animate.
   *
   * @param index Position in the list.
   */
  trackKey(index: number): string {
    return `${this.generation()}-${index}`;
  }
  /**
   * Re-runs the stagger animation.
   */
  reshuffle() {
    this.generation.update((g) => g + 1);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  // -- Page-shape block: "The Receipt" --

  /** The bill: four pipeline stages, paid every frame, by one naively-animated box. */
  protected readonly frameBill: ReceiptRow[] = [
    { label: 'Style', amount: 'recalculates which rules apply' },
    {
      label: 'Layout',
      amount: 'recomputes geometry — this element AND everything it displaces',
      tone: 'warn',
    },
    { label: 'Paint', amount: 'redraws pixels into a new layer', tone: 'warn' },
    { label: 'Composite', amount: 'GPU assembles the frame' },
  ];

  /** The total line: how many stages a naive animation pays, every single frame. */
  protected readonly frameBillTotal: ReceiptRow = {
    label: 'stages paid, every single frame',
    amount: '4',
    tone: 'warn',
  };

  /** The pipeline, named in one line before the code proves which stages a fix skips. */
  protected readonly frameChainSteps: readonly string[] = ['Style', 'Layout', 'Paint', 'Composite'];

  /** Sample: the identical visual result, animated two ways with two very different bills. */
  protected readonly frameBillSample = `/* pays Style → Layout → Paint → Composite, every frame */
.panel { height: 0; transition: height .3s; }
.panel.open { height: 240px; }

/* pays Style → Composite only — Layout and Paint never run */
.panel { transform: scaleY(0); transform-origin: top; transition: transform .3s; }
.panel.open { transform: scaleY(1); }`;

  /** Line-by-line walkthrough of {@link frameBillSample}. */
  protected readonly frameBillNotes: CodeNote[] = [
    {
      line: 2,
      text: '`height` is a **layout** property — the browser cannot know how tall the box now is without recomputing where every element below it sits. That recompute reruns on every single animation frame, not once.',
    },
    {
      line: 6,
      text: '`transform: scaleY()` never changes the geometry the rest of the page reasons about — as far as Layout is concerned, this box is still its original size. `transform-origin: top` just moves the pivot so it grows downward instead of from the centre; the property doing the real work is still `transform` alone.',
    },
  ];

  /** The block's own quiz — a different trap from the later compositor-properties one. */
  protected readonly frameBillQuiz: QuizOption[] = [
    {
      text: 'Yes — anything animated forces Layout to re-run.',
      why: 'Layout is specifically about **geometry** — where things sit and how big they are. `box-shadow` changes neither, so it never reaches this stage, no matter how often it repaints.',
    },
    {
      text: "No — box-shadow never changes any element's geometry, so Layout never runs. But it DOES force Paint every frame, since the shadow's pixels have to be redrawn.",
      correct: true,
      why: "Exactly. `box-shadow` skips Layout but not Paint — on a large or complex element that repaint is real cost, just a smaller bill than Layout's, and a much bigger one than `transform`/`opacity`'s.",
    },
    {
      text: "No, and it's free — the compositor handles box-shadow exactly like transform.",
      why: 'Only `transform` and `opacity` skip straight to Composite. `box-shadow` still has to be repainted into a layer first — cheaper than a Layout-triggering property, but not free.',
    },
    {
      text: 'It depends on whether the shadow is declared in px or a CSS custom property.',
      why: 'The unit the value is written in has no bearing on which pipeline stages run — that is decided entirely by which visual property is changing.',
    },
  ];

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security', id: 'security' },
    { label: 'i18n', id: 'i18n' },
    { label: 'Accessibility', id: 'a11y' },
    { label: 'Animations' },
    { label: 'View Transitions', id: 'view-transitions' },
  ];

  /** Abstract code for the opening predict — a minimal, illustrative `@if` fade. */
  readonly predictCode = `.toast { transition: opacity .3s, transform .3s; }

@if (show()) {
  <div class="toast">Saved!</div>
}`;

  /** The rendering pipeline's cheap path — what transform/opacity actually cost. */
  protected readonly pipelineCheap: FlowStep[] = [
    { label: 'Style', detail: 'recalculate which CSS rules apply' },
    { label: 'Composite', detail: 'GPU repositions or fades the existing layer', tone: 'good' },
  ];

  /** The rendering pipeline's expensive path — what layout properties actually cost. */
  protected readonly pipelineExpensive: FlowStep[] = [
    { label: 'Style', detail: 'recalculate which CSS rules apply' },
    {
      label: 'Layout',
      detail: 'recompute geometry for this element and everything it pushes',
      tone: 'warn',
    },
    { label: 'Paint', detail: 'redraw pixels into layers', tone: 'warn' },
    { label: 'Composite', detail: 'GPU assembles the final frame' },
  ];

  /** Options for the compositor-properties self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: '`height` and `width`',
      why: 'Both trigger a full Layout pass — recomputing geometry for this element and everything it displaces — on every single frame.',
    },
    {
      text: '`top` and `margin`',
      why: 'Same story: both are layout properties. Changing either forces Layout to re-run before the frame can even reach Paint.',
    },
    {
      text: '`transform` and `opacity`',
      correct: true,
      why: 'Both can be handled entirely by the compositor — repositioning or fading an already-painted layer needs no Layout and no Paint, so it runs on the GPU, off the main thread, at a steady 60fps.',
    },
    {
      text: '`box-shadow` and `border-radius`',
      why: 'An animated `box-shadow` forces a real repaint on every frame. `border-radius` alone is cheap, but pairing it with that shadow drags the whole thing back into Paint anyway.',
    },
  ];

  /** The "no dumb questions" block. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does removing an element skip its CSS animation?',
      a: 'Structural directives like `@if` and `@for` delete the DOM node the instant the condition changes — there is nothing left for CSS to animate by the next frame. `animate.leave="cls"` tells Angular to apply that class first and hold the node in the DOM until the animation or transition genuinely finishes, then remove it.',
    },
    {
      q: 'Is `@angular/animations` actually going away?',
      a: "Deprecated, not removed — existing trigger()-based code keeps working today. The guidance is to stop investing in it: new code uses CSS plus animate.enter/animate.leave, and route-change choreography moves to the router's View Transitions integration instead of @routeAnimations.",
    },
    {
      q: 'My accordion animates height and stutters on mobile — how do I fix it?',
      a: 'Height animation forces a Layout recalculation on every single frame. Switch to the grid-template-rows: 0fr → 1fr trick from this lesson, or a transform-based approach, or FLIP. If height truly must animate, at least scope the damage with `contain: layout`.',
    },
    {
      q: 'How do you stagger a list without the legacy stagger() helper?',
      a: 'Bind the delay per item — `[style.animation-delay.ms]="$index * 70"` — and add `animation-fill-mode: backwards` so later items stay invisible during their wait instead of flashing at full opacity first.',
    },
    {
      q: 'Do CSS animations need any special handling in tests?',
      a: "Less than you'd think. The legacy engine needed provideNoopAnimations() so tests didn't stall waiting on transitions; plain CSS animations mostly don't run in a JSDOM-style test environment at all, which removes the problem rather than working around it. For real browser E2E runs, Playwright can force prefers-reduced-motion directly.",
    },
    {
      q: 'Wait — is `@keyframes` actually named after the animation-industry term?',
      a: 'Yes, literally. Traditional studios had a lead artist draw the key poses and junior "in-betweeners" draw everything connecting them. CSS @keyframes is you drawing the poses; the browser is the in-betweener, and it\'s very good at exactly one kind of in-betweening: interpolating transform and opacity on the GPU.',
    },
  ];

  // --- code samples ---
  /**
   * Sample: enter and leave animations in plain CSS, which is the modern default —
   * the `@angular/animations` package is deprecated.
   */
  readonly enterLeaveSample = `@if (saved()) {
  <div class="toast"
       animate.enter="fade-slide-in"
       animate.leave="fade-slide-out">
    Saved!
  </div>
}

.fade-slide-in  { animation: fade-slide-in .3s ease; }
.fade-slide-out { animation: fade-slide-out .25s ease forwards; }
@keyframes fade-slide-in  { from { opacity: 0; transform: translateY(8px); } }
@keyframes fade-slide-out { to   { opacity: 0; transform: translateY(-8px); } }`;

  /** Line-by-line notes for {@link enterLeaveSample}. */
  protected readonly enterLeaveNotes: CodeNote[] = [
    {
      line: 3,
      text: '`animate.enter` — Angular applies this class the instant the element is added to the DOM by any structural directive. Plain CSS could trigger this part alone; the binding mostly exists to pair symmetrically with `animate.leave` below.',
    },
    {
      line: 4,
      text: 'The one thing CSS cannot do by itself. When `saved()` flips back to `false`, Angular does **not** remove this `<div>` immediately — it applies `fade-slide-out`, waits for that animation to actually finish, and only then deletes the node.',
    },
    {
      line: 10,
      text: "`forwards` holds the animation's **final** keyframe after it ends, instead of snapping back to the element's original style for one frame. Drop it and the toast would flash back to full opacity right before Angular deletes it.",
    },
    {
      line: 11,
      text: "Only `from` is given. The browser reads the element's live computed style as the implicit `to` — the keyframe artist drew one pose, and the in-betweener figured out the other from what's already on screen.",
    },
    {
      line: 12,
      text: 'The mirror image: only `to` is given. This animation also needs a real, measurable duration — that duration is exactly how long `animate.leave` keeps the node alive after removal is requested.',
    },
  ];

  /**
   * Sample: state as a class plus a `transition`, rather than a state machine.
   */
  readonly stateSample = `<div class="panel" [class.closed]="!open()">
  <div>…content…</div>
</div>

.panel {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows .3s ease, opacity .3s ease;
}
.panel.closed { grid-template-rows: 0fr; opacity: 0; }
.panel > div { min-height: 0; overflow: hidden; }`;

  /** Line-by-line notes for {@link stateSample}. */
  protected readonly stateNotes: CodeNote[] = [
    {
      line: 1,
      text: '`[class.closed]` toggles one class from one signal. That is the entire "state machine" — no `trigger()`, no `state()`, no `transition()` vocabulary needed.',
    },
    {
      line: 7,
      text: '`1fr` is a real, animatable number — a grid-row fraction — unlike `auto`. CSS flatly refuses to transition to or from `height: auto`; this is the trick that gets around that limitation entirely.',
    },
    {
      line: 9,
      text: "Transitioning `grid-template-rows` interpolates the fraction smoothly, and the row's height — so the content's visible height — follows it exactly.",
    },
    {
      line: 11,
      text: 'Flipping to `0fr` shrinks the row to nothing. Both properties are declared on the base `.panel`, not only on `.closed`, or the transition would have nothing to interpolate *from*.',
    },
    {
      line: 12,
      text: "Both declarations are load-bearing. A grid item's default `min-height` is `auto`, which refuses to shrink below its content's natural height — without `min-height: 0` the row can never actually reach zero. `overflow: hidden` then clips the content as it shrinks instead of letting it spill out.",
    },
  ];

  /**
   * Sample: staggering with a per-index `animation-delay`.
   */
  readonly staggerSample = `@for (item of items(); track trackKey($index)) {
  <div class="stagger-item"
       [style.animation-delay.ms]="$index * 70">
    {{ item }}
  </div>
}

.stagger-item { animation: fade-slide-in .35s ease backwards; }`;

  /** Line-by-line notes for {@link staggerSample}. */
  protected readonly staggerNotes: CodeNote[] = [
    {
      line: 1,
      text: '`$index` is supplied automatically inside every `@for` block — no separate counter variable to declare or increment.',
    },
    {
      line: 3,
      text: "The `.ms` suffix does the unit conversion for you: Angular appends `ms` to the number. Without it you'd need `[style.animation-delay]=\"$index * 70 + 'ms'\"` by hand, and a bare unitless number is invalid CSS that fails silently — no console warning, the item just never delays.",
    },
    {
      line: 8,
      text: "`backwards` is the line people skip. Without it, item #10 sits fully visible for 700ms and only then pops from opacity 0 — a visible flash. `backwards` applies the animation's *first* keyframe during the delay too, so each item stays invisible until its own turn starts.",
    },
  ];

  /**
   * Sample: the deprecated `trigger`/`state`/`transition` vocabulary. Here for
   * reading existing code, not for writing new code.
   */
  readonly legacySample = `import { trigger, state, style, transition, animate, query, stagger }
  from '@angular/animations';

@Component({
  animations: [
    trigger('openClose', [
      state('open',   style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0', opacity: 0 })),
      transition('open <=> closed', animate('200ms ease')),
    ]),
    trigger('list', [
      transition('* => *', [
        query(':enter',
          [style({ opacity: 0 }), stagger(60, animate('200ms'))],
          { optional: true }),
      ]),
    ]),
  ],
})

// template: <div [@openClose]="isOpen ? 'open' : 'closed'">
// required in app.config.ts: providers: [provideAnimationsAsync()]`;

  /** Line-by-line notes for {@link legacySample}. */
  protected readonly legacyNotes: CodeNote[] = [
    {
      line: 1,
      text: "Every name here is a function imported from the deprecated package — `trigger`, `state`, `transition` and friends are the vocabulary you'll meet in older codebases and exam questions, not something to reach for in new code.",
    },
    {
      line: 6,
      text: '`trigger()` names an animation and attaches it to a template binding — `openClose` here is matched by `[@openClose]` in the template below.',
    },
    {
      line: 7,
      text: "`state()` names a condition and the styles it should end at — `'*'` means \"whatever the natural height computes to,\" Angular's own escape hatch for the exact height-of-auto problem the modern `grid-template-rows` trick also solves.",
    },
    {
      line: 9,
      text: "`transition('open <=> closed', …)` reads as a mini state machine: whenever the state flips either direction between these two names, run this animation. That whole vocabulary is what a class binding plus a CSS `transition` replaces.",
    },
    {
      line: 13,
      text: "`query(':enter', …)` reaches into a list to find elements Angular has just added — the legacy equivalent of a CSS entry animation, but driven from JavaScript on the main thread instead of the browser's compositor.",
    },
    {
      line: 14,
      text: '`stagger(60, …)` delays each matched element 60ms more than the last — the direct ancestor of `[style.animation-delay.ms]="$index * 70"` from the previous section.',
    },
    {
      line: 22,
      text: 'This bootstraps the entire legacy animation engine into the app — real bundle weight the modern CSS approach never pays. One more reason to delete it once no `trigger()` calls remain.',
    },
  ];

  /**
   * Sample: the `animationend`/`transitionend` bubbling trap the migration
   * table glosses over, and the guard that fixes it.
   */
  readonly bubbleGuardSample = `<div class="card" (transitionend)="onCardTransitionEnd($event)">
  <button class="icon-btn" style="transition: transform .15s">…</button>
</div>

onCardTransitionEnd(event: TransitionEvent) {
  // fires once for the card's OWN transition, and once more for
  // every descendant's transition that happens to end around the same time
  if (event.target !== event.currentTarget) return;   // ← the guard
  if (event.propertyName !== 'transform') return;       // multi-property elements
  // …now it's safe to treat this as "the card itself finished"
}`;

  /** Line-by-line notes for {@link bubbleGuardSample}. */
  protected readonly bubbleGuardNotes: CodeNote[] = [
    {
      line: 1,
      text: '`(transitionend)` is bound on the card, but a DOM event handler hears an event fired **anywhere inside it too** — that includes the button nested one level down.',
    },
    {
      line: 6,
      text: '`event.target` is whichever element the transition actually ran on; `event.currentTarget` is always the element the listener is attached to. When the button transitions, those two differ — this line is the only thing telling the handler "that one wasn\'t mine."',
    },
    {
      line: 7,
      text: 'A single element can run several transitioned properties at once, each firing its own `transitionend`. Filtering `propertyName` (or `animationName` for `animationend`) stops a handler written for one property from firing early on a different one.',
    },
  ];

  /**
   * Sample: honouring `prefers-reduced-motion`. Not optional — for some users
   * motion causes actual nausea, and the media query is how they say so.
   */
  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  .fade-slide-in, .fade-slide-out, .stagger-item { animation: none; }
  .panel { transition: none; }
}

@media (prefers-reduced-motion: no-preference) {
  .toast { animation: fade-slide-in .3s ease; }
}`;

  /** Line-by-line notes for {@link reducedMotionSample}. */
  protected readonly reducedMotionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'This media query reads an OS-level setting the person already chose — macOS Reduce Motion, Windows "Show animations," the Android equivalent. You are not guessing at what they want; they told the browser directly.',
    },
    {
      line: 2,
      text: '`animation: none` removes the effect entirely — the element just appears in its final state. Safe precisely because every animation in this lesson ends at the normal, correct style; nothing here is load-bearing for correctness, only for polish.',
    },
    {
      line: 6,
      text: 'The opt-**in** form: define motion only for people who allow it, rather than removing it for people who do not. This direction is strictly safer — the opt-out version above needs a new selector added every time a new animation ships, and a forgotten one silently ships motion to someone it can make physically ill.',
    },
  ];
}
