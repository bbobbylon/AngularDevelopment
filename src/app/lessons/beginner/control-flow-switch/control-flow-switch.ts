import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './control-flow-switch.html',
  styleUrl: './control-flow-switch.css',
})
export class ControlFlowSwitch {
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
