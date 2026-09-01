import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TickerStore } from '../onpush.shared';

/** OnPush child that READS the shared signal — updates when it changes. */
@Component({
  selector: 'app-onpush-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onpush-reader.html',
  styleUrl: './onpush-reader.css',
})
export class OnpushReader {
  /**
   * The shared store. Reading `count()` in this component's template registers
   * this view as a consumer of that signal.
   */
  readonly store = inject(TickerStore);
  /**
   * The check count. Moves whenever the shared count is written — incremented
   * from `ngDoCheck` rather than a template getter, which would throw NG0100 in
   * dev mode (see `expert/change-detection`'s `OnPushChild.checks`).
   */
  protected readonly tick = signal(0);

  ngDoCheck(): void {
    this.tick.update((n) => n + 1);
  }
}
