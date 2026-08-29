import { Component, inject } from '@angular/core';
import { Beacon } from '../di-advanced.shared';

/** Child WITHOUT a provider — default resolution walks up to the parent. */
@Component({
  selector: 'tr[appDiChildBare]',
  templateUrl: './di-child-bare.html',
})
export class DiChildBare {
  /**
   * Resolved normally with no local provider, so it walks up and finds the
   * lesson's instance.
   */
  readonly inherited = inject(Beacon);
  /**
   * Resolved with `self` — this injector only. There is no local provider, so it
   * is `null` rather than an error, which is what `optional` buys.
   */
  readonly selfOnly = inject(Beacon, { self: true, optional: true });
}
