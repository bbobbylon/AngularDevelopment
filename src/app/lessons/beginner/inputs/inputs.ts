import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoerceDemo } from './coerce-demo/coerce-demo';
import { Badge } from './badge/badge';

/**
 * Lesson: Component Inputs — passing data down.
 *
 * Covers the signal-based `input()` function, optional against `input.required()`,
 * aliasing, and `transform`.
 *
 * The demo the lesson is built around is coercion. An attribute in a template is
 * always a string; without a `transform` a child declared as taking a number
 * quietly receives `"42"`, and `size() + 1` yields `"421"`. `numberAttribute`
 * and `booleanAttribute` fix that at the boundary, and {@link CoerceDemo} shows
 * the runtime type so the fix is visible rather than asserted.
 *
 * Also contrasts `input()` with the older `@Input()` decorator: the signal form
 * is readable in a `computed`, needs no `ngOnChanges` to react to, and cannot be
 * written to from inside the child.
 */
@Component({
  selector: 'app-lesson-inputs',
  imports: [RouterLink, Badge, CoerceDemo],
  templateUrl: './inputs.html',
})
export class Inputs {
  /**
   * Text passed to the badge demo.
   */
  protected readonly label = signal('Online');
  /**
   * Colour passed to the badge demo.
   */
  protected readonly color = signal('#2ec16b');
  /**
   * A number passed to the badge demo.
   */
  protected readonly count = signal(7);
  /**
   * A boolean passed to the badge demo, for the `booleanAttribute` transform.
   */
  protected readonly large = signal(false);
  /**
   * Initials derived from {@link label} — a `computed` over a signal that happens
   * to feed an input, to show the two composing.
   */
  protected readonly initials = computed(() => this.label().slice(0, 2).toUpperCase());
  /**
   * The **string** bound to the coercion demo's numeric input. A string on purpose:
   * that is what a template attribute always is.
   */
  protected readonly raw = signal('42');
}
