import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Angular animations in 2026 — the landscape shifted. The classic
 * @angular/animations package (trigger/state/transition) is DEPRECATED; the
 * modern path is native CSS transitions/keyframes plus the built-in
 * animate.enter / animate.leave bindings for DOM add/remove. This page
 * teaches the modern approach live (enter/leave, state toggles, staggered
 * lists), maps the legacy API onto it (you WILL meet trigger() in older
 * codebases and exams), and covers performance + reduced-motion discipline.
 */
@Component({
  selector: 'app-lesson-animations',
  imports: [RouterLink],
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

  // --- code samples ---
  /**
   * Sample: enter and leave animations in plain CSS, which is the modern default —
   * the `@angular/animations` package is deprecated.
   */
  readonly enterLeaveSample = `<!-- classes defined in plain CSS -->
@if (saved()) {
  <!-- animate.enter applies its class when the element is ADDED to the DOM. -->
  <!-- animate.leave is the one you cannot do in CSS alone: Angular keeps the
       element alive until the animation finishes, THEN removes it. Without
       this, @if would rip the node out instantly and you would see nothing. -->
  <div class="toast"
       animate.enter="fade-slide-in"
       animate.leave="fade-slide-out">
    Saved!
  </div>
}

/* component or global stylesheet */
.fade-slide-in  { animation: fade-slide-in .3s ease; }
/* 'forwards' holds the FINAL keyframe after the animation ends. Drop it and
   the toast snaps back to full opacity for one frame before disappearing. */
.fade-slide-out { animation: fade-slide-out .25s ease forwards; }
/* Only 'from' is given — the browser uses the element's live computed style
   as the implicit 'to', so this works whatever the toast's real position is. */
@keyframes fade-slide-in  { from { opacity: 0; transform: translateY(8px); } }
/* And the mirror image: only 'to', starting from wherever it currently is. */
@keyframes fade-slide-out { to   { opacity: 0; transform: translateY(-8px); } }
/* Both animate opacity and transform ONLY. Those two are composited on the
   GPU and never trigger layout, which is what keeps this at 60fps. Animating
   height or top instead would reflow the page on every frame. */`;

  /**
   * Sample: state as a class plus a `transition`, rather than a state machine.
   */
  readonly stateSample = `<!-- template: state is just a class -->
<!-- [class.closed] toggles one class from one signal. That is the entire
     "state machine" — no trigger, no state(), no transition() vocabulary. -->
<div class="panel" [class.closed]="!open()">
  <!-- The inner wrapper is REQUIRED for the trick below to work. -->
  <div> …content… </div>
</div>

/* the 0fr→1fr grid trick transitions "height: auto" correctly */
/* Why the trick exists: CSS cannot transition to or from height:auto, so the
   naive version snaps open instead of sliding. A grid row FRACTION is a real
   number, so 1fr → 0fr interpolates smoothly and still sizes to content. */
.panel        { display: grid; grid-template-rows: 1fr; opacity: 1;
                transition: grid-template-rows .3s ease, opacity .3s ease; }
.panel.closed { grid-template-rows: 0fr; opacity: 0; }
/* Both of these are load-bearing. A grid item's default min-height is auto,
   which refuses to shrink below its content — so without min-height:0 the
   row never actually collapses. overflow:hidden then clips the content as
   the row closes instead of letting it spill out. */
.panel > div  { min-height: 0; overflow: hidden; }`;

  /**
   * Sample: staggering with a per-index `animation-delay`.
   */
  readonly staggerSample = `@for (item of items(); track item.id) {
  <!-- The .ms SUFFIX is the trick: Angular appends the unit for you, so the
       expression can stay a plain number. Without it you would be writing
       [style.animation-delay]="$index * 70 + 'ms'" — and a bare number with
       no unit is invalid CSS that fails silently. -->
  <!-- $index * 70 gives each item a delay 70ms after the one before it. One
       multiplication is the whole stagger; no timeline library involved. -->
  <div class="stagger-item" [style.animation-delay.ms]="$index * 70">
    {{ item.name }}
  </div>
}

/* 'backwards' keeps delayed items hidden until their animation begins */
/* This is the line people miss. Without it, item #10 sits fully visible for
   700ms and then fades in from opacity 0 — a visible flicker. 'backwards'
   applies the FIRST keyframe during the delay, so it waits invisibly. */
.stagger-item { animation: fade-slide-in .35s ease backwards; }
/* Keep the step small (50-80ms). Past ~100ms the list stops reading as one
   motion and starts feeling slow. */`;

  /**
   * Sample: the deprecated `trigger`/`state`/`transition` vocabulary. Here for
   * reading existing code, not for writing new code.
   */
  readonly legacySample = `// DEPRECATED vocabulary — for reading existing code
import { trigger, state, style, transition, animate, query, stagger }
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
// <div [@openClose]="isOpen ? 'open' : 'closed'" (@openClose.done)="…">
// required: provideAnimationsAsync() in app.config.ts`;

  /**
   * Sample: honouring `prefers-reduced-motion`. Not optional — for some users
   * motion causes actual nausea, and the media query is how they say so.
   */
  readonly reducedMotionSample = `/* The query reads an OS-level setting the user already chose — macOS Reduce
   Motion, Windows "Show animations", the Android equivalent. You are not
   guessing; they told the browser. */
@media (prefers-reduced-motion: reduce) {
  /* animation: none removes the whole thing, and the element simply appears
     in its final state. It does NOT break anything — the end state of every
     animation above is the normal, correct style. */
  .fade-slide-in, .fade-slide-out, .stagger-item { animation: none; }
  .panel { transition: none; }
}

/* or flip the default: define motion ONLY for users who allow it */
/* This version is strictly safer. The opt-OUT above needs updating every
   time you add an animation, and a forgotten selector silently ships motion
   to someone it makes ill. Here, motion is the exception you opt into. */
@media (prefers-reduced-motion: no-preference) {
  .toast { animation: fade-slide-in .3s ease; }
}
/* Either way: this is an accessibility requirement, not a nicety. Vestibular
   disorders make large motion genuinely nauseating. Ship one of these. */`;
}
