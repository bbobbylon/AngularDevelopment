import { Component, computed, linkedSignal, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Advanced Signals — the parts beyond `signal` / `computed` / `effect`.
 *
 * Covers `linkedSignal`, `untracked`, equality functions, and how the dependency
 * graph actually works (pull-based, lazily evaluated, glitch-free).
 *
 * Two demos:
 *
 * - **`linkedSignal`**, which is writable state that *resets* when its source
 *   changes. The classic case is a select whose options get replaced: a plain
 *   `signal` keeps the now-invalid selection, a `computed` cannot be written to
 *   at all, and `linkedSignal` is the thing that is both.
 * - **`untracked`**, reading a signal without subscribing to it. The demo makes
 *   the consequence concrete: the `computed` recomputes when `a` changes and not
 *   when `b` does, even though it reads both — which is either exactly what you
 *   wanted or a stale-value bug, depending on whether you meant it.
 */
@Component({
  selector: 'app-lesson-signals-advanced',
  imports: [RouterLink],
  templateUrl: './signals-advanced.html',
  styleUrl: './signals-advanced.css',
})
export class SignalsAdvanced {
  /**
   * The palettes the `linkedSignal` demo cycles through.
   */
  private readonly palettes = [
    ['Red', 'Green', 'Blue'],
    ['Cyan', 'Magenta', 'Yellow'],
    ['Amber', 'Violet', 'Teal'],
  ];
  /**
   * Which palette is showing.
   */
  private paletteIndex = 0;

  /**
   * The current options — the source the selection is linked to.
   */
  protected readonly options = signal(this.palettes[0]);
  /**
   * The selection. A `linkedSignal`, so it is writable like a `signal` *and* resets
   * to the first option whenever the options change. Neither `signal` nor
   * `computed` alone does both.
   */
  protected readonly selected = linkedSignal(() => this.options()[0]);

  /**
   * Tracked dependency of {@link sum}.
   */
  protected readonly a = signal(1);
  /**
   * Untracked dependency of {@link sum} — read, but not subscribed to.
   */
  protected readonly b = signal(100);
  /**
   * The sum. Recomputes on `a`, not on `b`: `untracked` reads the value without
   * registering a dependency, so the displayed total can be stale by design.
   */
  protected readonly sum = computed(() => this.a() + untracked(this.b));

  /**
   * Swaps in the next palette, which is what makes the linked selection reset.
   */
  protected reshuffle() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.options.set(this.palettes[this.paletteIndex]);
  }
}
