import { ChangeDetectorRef, Component, inject, input } from '@angular/core';

// ── Detachable child — cdr.detach() removes it from the tree entirely ───────

/**
 * A child that can detach its own change detector, for the third demo.
 */
@Component({
  selector: 'app-cd-detach-child',
  templateUrl: './detach-child.html',
  styleUrl: './detach-child.css',
})
export class DetachChild {
  /**
   * The value passed in.
   */
  readonly value = input(0);
  /**
   * Whether the detector is currently detached.
   */
  protected detached = false;
  /**
   * This view's change detector.
   */
  private readonly cdr = inject(ChangeDetectorRef);
  /**
   * How many times this view has been checked.
   */
  private ticks = 0;
  /**
   * The check count. Freezes while detached, which is the demo.
   */
  protected get checks(): number {
    return ++this.ticks;
  }

  /**
   * Detaches or reattaches this view's change detector.
   *
   * Detaching removes the view from every pass entirely — its bindings stop
   * updating until something calls `detectChanges()` on it by hand. It is the
   * heavyweight option, for a view rendering thousands of rows at high frequency,
   * and it is easy to forget you did it.
   */
  toggle(): void {
    this.detached = !this.detached;
    if (this.detached) {
      this.cdr.detach(); // out of the tree — nothing re-checks this view anymore
    } else {
      this.cdr.reattach(); // back in — it catches up on the next pass
      this.cdr.markForCheck();
    }
  }
}
