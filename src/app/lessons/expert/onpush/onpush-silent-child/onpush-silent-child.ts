import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';

/**
 * OnPush child that updates its own state ASYNCHRONOUSLY (setTimeout).
 * The event handler itself marks the view dirty, but the timeout callback
 * does not — so without markForCheck the new value never appears.
 */
@Component({
  selector: 'app-onpush-silent-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onpush-silent-child.html',
  styleUrl: './onpush-silent-child.css',
})
export class OnpushSilentChild {
  /**
   * This view's change detector, so the demo can mark it dirty by hand.
   */
  private cdr = inject(ChangeDetectorRef);
  /**
   * The last async result.
   */
  protected result = '—';
  /**
   * Sequence number, so successive results differ.
   */
  private n = 0;

  /**
   * Loads without marking the view.
   *
   * A plain field written from a `setTimeout`: no input change, no event, no
   * signal. The field updates and the screen does not, which is the single most
   * common `OnPush` complaint.
   */
  protected loadSilently() {
    setTimeout(() => {
      // plain field mutation: no signal, no input, no event → nobody is told
      this.result = `loaded #${++this.n} (you are seeing a STALE view)`;
    }, 300);
  }

  /**
   * Loads and calls `markForCheck()`.
   *
   * The same write, plus telling Angular to check this view on the next pass. Note
   * it is `markForCheck` and not `detectChanges` — the former flags the view and
   * its ancestor path and lets the normal pass do the work.
   */
  protected loadAndMark() {
    setTimeout(() => {
      this.result = `loaded #${++this.n} (fresh — view was marked dirty)`;
      this.cdr.markForCheck(); // mark this view + ancestors, schedule a pass
    }, 300);
  }
}
