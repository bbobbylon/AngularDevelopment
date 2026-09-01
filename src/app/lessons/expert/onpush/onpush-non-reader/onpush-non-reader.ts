import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
   * The check count. Stays put while the store changes, because this view never
   * read the signal reactively and so was never registered as a consumer.
   * Incremented from `ngDoCheck` rather than a template getter, which would
   * throw NG0100 in dev mode (see `expert/change-detection`'s `OnPushChild.checks`).
   */
  protected readonly tick = signal(0);

  ngDoCheck(): void {
    this.tick.update((n) => n + 1);
  }
}
