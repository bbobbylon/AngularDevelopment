import { AfterViewInit, Component, DoCheck, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { LifecycleLog } from '../lifecycle.shared';

/** A child whose every lifecycle hook records into the shared log. */
@Component({
  selector: 'app-lifecycle-child',
  templateUrl: './lifecycle-child.html',
  styleUrl: './lifecycle-child.css',
})
export class LifecycleChild
  implements OnChanges, OnInit, DoCheck, AfterViewInit, OnDestroy
{
  /**
   * A plain `@Input()` rather than the modern `input()`, on purpose: `ngOnChanges`
   * only fires for decorator inputs, and this lesson needs to demonstrate it.
   */
  @Input() value = 0;
  /**
   * The shared log, so the child's hooks report into the parent's panel.
   */
  private readonly log = inject(LifecycleLog);

  /**
   * Fires before `ngOnInit` and again on every input change, with the previous and
   * current values.
   *
   * Largely unnecessary once inputs are signals — a `computed` or an `effect` over
   * an `input()` reacts to the same change with less ceremony — but it is still
   * the only hook that hands you the *previous* value.
   *
   * @param changes The changed inputs.
   */
  ngOnChanges(changes: SimpleChanges) {
    const v = changes['value'];
    this.log.add(`ngOnChanges — value ${v.previousValue} → ${v.currentValue}`);
  }
  /**
   * Runs once, after the first `ngOnChanges` and before the first render. With
   * signals a field initialiser usually does the same job.
   */
  ngOnInit() {
    this.log.add('ngOnInit — component initialised');
  }
  /**
   * Runs on **every** change-detection pass, which is why it is the hook most
   * likely to be a performance problem. Almost always the wrong tool: if you need
   * to react to a change, react to the thing that changed.
   */
  ngDoCheck() {
    this.log.add('ngDoCheck — change detection ran');
  }
  /**
   * Runs once, after the component's own view and its children exist. The first
   * point at which a `viewChild` is safe to touch.
   */
  ngAfterViewInit() {
    this.log.add('ngAfterViewInit — view & children ready');
  }
  /**
   * The cleanup hook: unsubscribe, clear timers, disconnect observers. Fires when
   * the component is removed, which in this demo is when the toggle hides it.
   */
  ngOnDestroy() {
    this.log.add('ngOnDestroy — cleaning up 🧹');
  }
}
