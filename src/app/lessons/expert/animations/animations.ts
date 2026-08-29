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
  private readonly baseItems = ['Signals', 'RxJS interop', 'Control flow', 'Deferred views', 'Hydration'];
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
  <div class="toast"
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

  /**
   * Sample: state as a class plus a `transition`, rather than a state machine.
   */
  readonly stateSample = `<!-- template: state is just a class -->
<div class="panel" [class.closed]="!open()">
  <div> …content… </div>
</div>

/* the 0fr→1fr grid trick transitions "height: auto" correctly */
.panel        { display: grid; grid-template-rows: 1fr; opacity: 1;
                transition: grid-template-rows .3s ease, opacity .3s ease; }
.panel.closed { grid-template-rows: 0fr; opacity: 0; }
.panel > div  { min-height: 0; overflow: hidden; }`;

  /**
   * Sample: staggering with a per-index `animation-delay`.
   */
  readonly staggerSample = `@for (item of items(); track item.id) {
  <div class="stagger-item" [style.animation-delay.ms]="$index * 70">
    {{ item.name }}
  </div>
}

/* 'backwards' keeps delayed items hidden until their animation begins */
.stagger-item { animation: fade-slide-in .35s ease backwards; }`;

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
  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  .fade-slide-in, .fade-slide-out, .stagger-item { animation: none; }
  .panel { transition: none; }
}

/* or flip the default: define motion ONLY for users who allow it */
@media (prefers-reduced-motion: no-preference) {
  .toast { animation: fade-slide-in .3s ease; }
}`;
}
