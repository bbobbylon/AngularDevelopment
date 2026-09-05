import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
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
 */
@Component({
  selector: 'app-lesson-animations',
  imports: [RouterLink, BfPage, Chapter, CodeLab, Faq, Flow, Predict, Quiz, Remember],
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
