import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Signals Basics — Angular's reactive primitive.
 *
 * Covers the three pieces and how they differ: `signal()` holds writable state,
 * `computed()` derives from it lazily and caches, and `effect()` runs a side
 * effect when its dependencies change.
 *
 * The distinction the lesson leans on hardest is `computed` against `effect`.
 * Both react to the same signals, but a `computed` *returns* a value and must
 * stay pure, while an `effect` returns nothing and exists precisely for the
 * impure work — logging, storage, DOM. Reaching for an `effect` to compute a
 * value is the mistake this page is built to prevent.
 *
 * The live demo shows a counter with a derived double and parity, plus an
 * effect log that fills in as the count changes.
 */
@Component({
  selector: 'app-lesson-signals',
  imports: [RouterLink],
  templateUrl: './signals.html',
  styleUrl: './signals.css',
})
export class Signals {
  /**
   * The counter — the one piece of writable state on the page.
   */
  protected readonly count = signal(0);
  /**
   * Twice the count. Derived, not stored: a second signal kept in sync by hand is
   * the bug `computed` removes.
   */
  protected readonly doubled = computed(() => this.count() * 2);
  /**
   * Whether the count is even or odd. A second derivation off the same source, to
   * show that a signal can feed many.
   */
  protected readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));
  /**
   * Lines recorded by the effect, so its firing is visible rather than implied.
   */
  protected readonly effectLog = signal<string[]>([]);

  /**
   * Registers the demo effect.
   *
   * In an injection context, so it is torn down with the component — an effect
   * created outside one has to be disposed by hand, and forgetting is a leak.
   */
  constructor() {
    // Demonstrates effect(): reacts to count changes and records them.
    effect(() => {
      const value = this.count();
      this.effectLog.update((log) => [`count changed to ${value}`, ...log].slice(0, 8));
    });
  }
}
