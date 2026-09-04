import { Component, inject, input } from '@angular/core';
import { CounterService } from '../services-di.shared';

/** Every <app-counter-widget> gets its OWN CounterService — see `providers` below. */
@Component({
  selector: 'app-counter-widget',
  providers: [CounterService],
  templateUrl: './counter-widget.html',
})
export class CounterWidget {
  /**
   * This widget's **own** counter instance.
   *
   * The demo's punchline: because {@link CounterService} is listed in this
   * component's `providers`, every widget gets a separate instance — whereas the
   * cart above, provided in `root`, is one object shared by everyone.
   */
  protected readonly counter = inject(CounterService);
  /**
   * Display name, so two widgets on the page can be told apart.
   */
  readonly label = input('Widget');
  /**
   * Shows {@link CounterService.heartbeat} next to the count. Off by default —
   * the two-widget "independent instances" demo has nothing to do with
   * lifecycles, and showing a ticking number there would be noise. The
   * teardown demo turns it on so the heartbeat has something to watch stop.
   */
  readonly showHeartbeat = input(false);
}
