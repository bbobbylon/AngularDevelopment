import { Component, DestroyRef, inject, input } from '@angular/core';
import { LifecycleLog } from '../lifecycle.shared';

/**
 * A child that starts a raw `setInterval` in its constructor and writes into
 * the shared {@link LifecycleLog} on every tick — clearing that timer in
 * `ngOnDestroy` only when {@link cleanup} is `true`, so toggling this input
 * turns "you must clean up your own resources" into a genuine, watchable leak
 * instead of a rule taken on faith.
 *
 * The tick writes go straight through the injected log instance, not a
 * template output binding — which is exactly why they keep landing even
 * after Angular has torn this component's view down. Destroying a view tears
 * down the *bindings* wired to it; it does nothing at all to a plain browser
 * timer that nobody explicitly cleared.
 */
@Component({
  selector: 'app-lifecycle-leaky-child',
  template: `<p class="dim">
    ticking every 400ms{{
      cleanup() ? ' — cleaned up on destroy' : ' — nobody is clearing this timer'
    }}…
  </p>`,
})
export class LifecycleLeakyChild {
  /** Whether this instance clears its own interval when Angular destroys it. */
  readonly cleanup = input(false);
  private readonly log = inject(LifecycleLog);

  constructor() {
    const id = setInterval(() => this.log.add('leak-tick — the interval is still running'), 400);
    if (this.cleanup()) {
      inject(DestroyRef).onDestroy(() => clearInterval(id));
    }
  }
}
