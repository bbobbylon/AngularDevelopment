import { ChangeDetectionStrategy, Component, type OnInit, signal } from '@angular/core';

/**
 * Counter behind each instance's birth number — shared across every instance
 * that has ever existed on this page, so the number keeps climbing every time
 * `@if` builds a fresh one, and never moves for an instance that was merely
 * hidden. The same module-level-counter pattern `shared/teaching/quiz.ts` and
 * friends use for their own ids.
 */
let instancesEver = 0;

/**
 * A stand-in for a real child that fetches something in `ngOnInit` — a
 * spinner's data, a chart, a comment thread. It reports its own birth number
 * and whether it has "fetched" yet, which is the whole demo: closing and
 * reopening an `@if` branch builds a brand-new instance every time, and a
 * brand-new instance means `ngOnInit` — and whatever it fetches — runs again.
 * The same instance parked behind `[hidden]` is built once and never rebuilt,
 * so its number and its fetch never change no matter how often it is shown
 * and hidden.
 *
 * @see ../control-flow-if.ts — used from the "destroyed state" demo.
 */
@Component({
  selector: 'app-toggle-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle-child.html',
  styleUrl: './toggle-child.css',
})
export class ToggleChild implements OnInit {
  /** This instance's number — fixed forever the moment it is constructed. */
  protected readonly instanceNumber = ++instancesEver;

  /**
   * Whether this instance's simulated fetch has completed.
   *
   * Starts `false` so "fetching…" is visible for at least a frame, the way a
   * real network request would be — set from `ngOnInit` via a signal rather
   * than mutated in the constructor, so there is a real, observable moment
   * where the fetch is still pending.
   */
  protected readonly fetched = signal(false);

  ngOnInit(): void {
    this.fetched.set(true);
  }
}
