import { Component } from '@angular/core';

// ── Default (CheckAlways) child ──────────────────────────────────────────────

/**
 * A default-strategy child, checked on every pass, next to the `OnPush` one.
 */
@Component({
  selector: 'app-cd-default-child',
  // No changeDetection set → Default = CheckAlways
  templateUrl: './default-child.html',
  styleUrl: './default-child.css',
})
export class DefaultChild {
  /**
   * How many times this view has been checked.
   */
  private ticks = 0;
  /**
   * The check count. See {@link OnPushChild.checks}.
   */
  protected get checks(): number {
    return ++this.ticks;
  }
}
