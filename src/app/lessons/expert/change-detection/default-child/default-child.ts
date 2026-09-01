import { Component, signal } from '@angular/core';

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
   * The check count. See {@link OnPushChild.checks} for why this is a signal
   * incremented from `ngDoCheck`, not a getter incremented from the template.
   */
  protected readonly checks = signal(0);

  ngDoCheck(): void {
    this.checks.update((n) => n + 1);
  }
}
