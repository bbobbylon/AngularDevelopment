import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// ── OnPush demo child — re-checks only when its input changes / it's marked ──

/**
 * An `OnPush` child, for the strategy comparison.
 */
@Component({
  selector: 'app-cd-onpush-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './on-push-child.html',
  styleUrl: './on-push-child.css',
})
export class OnPushChild {
  /** A real input this time — the parent binding is what marks this view dirty. */
  readonly value = input(0);
  /**
   * How many times this view has been checked.
   */
  private ticks = 0;
  /**
   * The check count, incremented as a side effect of being read.
   *
   * A getter in a template runs once per check of that view, so reading it *is*
   * the measurement. Deliberately impure — normally a bug, here the instrument.
   */
  protected get checks(): number {
    return ++this.ticks;
  }
}
