import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LifecycleLog } from './lifecycle.shared';
import { LifecycleChild } from './lifecycle-child/lifecycle-child';

/**
 * Lesson: Lifecycle Hooks — the order Angular calls them in, and which ones you
 * still need.
 *
 * The demo mounts and unmounts a child that logs every hook it receives, so the
 * sequence is observed rather than memorised — including the parts that surprise
 * people, like `ngOnChanges` running *before* `ngOnInit`, and content hooks
 * running before view hooks.
 *
 * The modern framing the lesson gives: most of these hooks existed to work
 * around the lack of reactivity. With signals, `ngOnChanges` is usually a
 * `computed`, and `ngOnInit` is usually just a field initialiser. The two that
 * remain genuinely necessary are `ngOnDestroy` for cleanup and the
 * `afterNextRender` / `afterEveryRender` family for work that needs real DOM.
 */
@Component({
  selector: 'app-lesson-lifecycle',
  imports: [RouterLink, LifecycleChild],
  providers: [LifecycleLog],
  templateUrl: './lifecycle.html',
  styleUrl: './lifecycle.css',
})
export class Lifecycle {
  /**
   * The shared log the child writes into.
   */
  protected readonly log = inject(LifecycleLog);
  /**
   * Whether the child is mounted — toggling it is what drives the whole demo.
   */
  protected readonly show = signal(false);
  /**
   * The value bound to the child's input, so `ngOnChanges` can be provoked without
   * remounting.
   */
  protected readonly value = signal(0);

  /**
   * Mounts or unmounts the child, producing the init or destroy hooks.
   */
  protected toggle() {
    this.show.update((s) => !s);
  }
}
