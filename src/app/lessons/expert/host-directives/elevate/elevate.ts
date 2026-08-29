import { Directive, output, signal } from '@angular/core';

/**
 * A reusable behavior: lift the host on hover. No template — pure host
 * bindings. Written signal-era: the `host` object replaces @HostBinding /
 * @HostListener decorators one-for-one.
 */
@Directive({
  selector: '[appElevate]',
  host: {
    '[style.display]': '"block"',
    '[style.transition]': '"transform .15s ease, box-shadow .15s ease"',
    '[style.transform]': 'lifted() ? "translateY(-4px)" : "none"',
    '[style.boxShadow]': 'lifted() ? "0 10px 30px rgba(0,0,0,.4)" : "none"',
    '(mouseenter)': 'enter()',
    '(mouseleave)': 'lifted.set(false)',
  },
})
export class Elevate {
  /**
   * Whether the host is currently lifted.
   */
  readonly lifted = signal(false);
  /**
   * How many times it has lifted, so a composed host can show the directive's own
   * state is really shared.
   */
  readonly lifts = signal(0);
  /**
   * Emits when the lifted state turns on. Composed hosts can re-export this.
   */
  readonly liftedChange = output<boolean>();

  /**
   * Handles pointer entry: lifts, counts, notifies.
   */
  protected enter() {
    this.lifted.set(true);
    this.lifts.update((n) => n + 1);
    this.liftedChange.emit(true);
  }
}
