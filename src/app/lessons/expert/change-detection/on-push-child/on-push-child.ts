import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

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
   * The check count.
   *
   * A template getter that increments on every read looks like the obvious
   * instrument, and it was this component's original one — but dev mode reads
   * every binding twice per pass to verify nothing moved, and a getter with a
   * side effect guarantees the two reads disagree, throwing NG0100 on the very
   * page that goes on to explain NG0100. `ngDoCheck` is the honest fix: it fires
   * once per real check of *this* view — respecting OnPush's own skip logic —
   * and, being a lifecycle hook rather than a bound expression, is outside the
   * verify comparison entirely.
   */
  protected readonly checks = signal(0);

  ngDoCheck(): void {
    this.checks.update((n) => n + 1);
  }
}
