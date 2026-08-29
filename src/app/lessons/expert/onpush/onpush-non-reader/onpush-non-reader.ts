import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TickerStore } from '../onpush.shared';

/** OnPush child that does NOT read the signal — never re-checked by its writes. */
@Component({
  selector: 'app-onpush-nonreader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onpush-non-reader.html',
  styleUrl: './onpush-non-reader.css',
})
export class OnpushNonReader {
  /**
   * A snapshot taken once, at construction. Reading the signal here — outside a
   * reactive context — does not subscribe to it.
   */
  readonly snapshot = inject(TickerStore).count();
  /**
   * How many times this view has been checked.
   */
  private n = 0;
  /**
   * The check count. Stays put while the store changes, because this view never
   * read the signal reactively and so was never registered as a consumer.
   */
  get tick() {
    return ++this.n;
  }
}
