import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * The four states in the basic `@switch` demo.
 */
type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * A discriminated union for the narrowing demo — each arm carries different
 * fields, reachable only after the `kind` has been matched.
 */
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number };

/**
 * Lesson: the built-in @switch / @case / @default control flow.
 *
 * Beyond the state-machine demo: how @switch differs from a chained @if (one
 * expression, strict === , exactly one branch), a live discriminated-union demo
 * showing per-case type narrowing, the object-identity and "no multi-value case"
 * traps, the *ngSwitch → @switch migration, and the exam questions people miss.
 */
@Component({
  selector: 'app-lesson-control-flow-switch',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './control-flow-switch.html',
  styleUrl: './control-flow-switch.css',
})
export class ControlFlowSwitch {
  /**
   * The string-vs-number puzzle used by the ask-before-telling block. Route
   * params are always strings, `@case` compares with `===`, and the failure is
   * a silently empty render rather than an error — which is what makes it worth
   * a whole section.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly strictEqualitySample = `// The route is /plan/:tier — the user visits /plan/2.
tier = toSignal(this.route.paramMap.pipe(map(p => p.get('tier'))));

// The template:
@switch (tier()) {
  @case (1) { <p>Starter</p> }
  @case (2) { <p>Pro</p> }
  @case (3) { <p>Enterprise</p> }
}`;

  /**
   * The self-test, on the destroy-vs-hide distinction. The wrong answers are the
   * three intuitions people carry over from CSS-based show/hide.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'Empty. Switching away destroyed the component; switching back constructed a brand-new one, and a new instance has new state.',
      correct: true,
      why: 'Right. A non-matching branch is not hidden, it is *destroyed* — `ngOnDestroy` runs and the instance is gone. Coming back builds a fresh one from scratch, so anything it held is lost.',
    },
    {
      text: 'The text is still there — the branch was hidden, not removed, so the component instance survived.',
      why: 'That is `[hidden]` or `display: none`, where the element stays in the DOM. `@switch` never instantiates non-matching branches at all, so there is nothing left to survive.',
    },
    {
      text: 'The text is still there — Angular caches destroyed embedded views and restores them when the same case matches again.',
      why: 'There is no such cache. Each match instantiates the branch fresh; Angular does not retain destroyed views in the hope you come back.',
    },
    {
      text: 'It depends: the state survives if the component is `OnPush`, because OnPush components are not torn down.',
      why: 'Change-detection strategy has nothing to do with lifetime. `OnPush` controls *when a component is checked*, never *whether it exists*.',
    },
  ];

  /**
   * The state in the basic `@switch` demo.
   */
  protected readonly status = signal<Status>('idle');

  // --- discriminated-union narrowing demo ---
  /**
   * The shape in the narrowing demo.
   */
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });
  /**
   * The current shape's area.
   *
   * Computed in TypeScript rather than in the template because that is where the
   * narrowing matters: `@switch` picks which markup renders, but it is the
   * `switch` on the discriminant here that lets each branch read the fields only
   * its own variant has.
   */
  protected readonly area = computed(() => {
    const s = this.shape();
    switch (s.kind) {
      case 'circle':
        return +(Math.PI * s.radius ** 2).toFixed(2);
      case 'square':
        return s.side ** 2;
      case 'triangle':
        return (s.base * s.height) / 2;
    }
  });

  /**
   * Sample: `@switch` with `@case` arms and a `@default`.
   */
  protected readonly basicSample = `<!-- The expression is evaluated ONCE, then compared against each @case. -->
@switch (status()) {
  <!-- Comparison is strict === . No type coercion, so @case (1) will never
       match the string '1' — a common source of a silently empty screen. -->
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-results /> }
  <!-- No "break" needed: unlike JavaScript's switch, exactly one arm runs
       and there is no fall-through to worry about. -->
  <!-- @default is optional, but omitting it means an unmatched value
       renders NOTHING at all — usually not what you want. -->
  @default          { <app-error />   }
}`;

  /**
   * Sample: migrating `ngSwitch` — three cooperating directives plus
   * `CommonModule` — to the single built-in block.
   */
  protected readonly migrationSample = `<!-- BEFORE — three cooperating directives, needs CommonModule -->
<div [ngSwitch]="status">
  <app-spinner *ngSwitchCase="'loading'" />
  <app-results *ngSwitchCase="'success'" />
  <app-error   *ngSwitchDefault />
</div>

<!-- AFTER — built-in, strict ===, no import -->
@switch (status) {
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-results /> }
  @default          { <app-error /> }
}`;
}
