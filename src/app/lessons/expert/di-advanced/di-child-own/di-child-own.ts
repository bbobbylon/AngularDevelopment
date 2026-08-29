import { Component, inject } from '@angular/core';
import { Beacon } from '../di-advanced.shared';

/**
 * Child WITH its own provider — default resolution stops at itself.
 * Attribute selector on <tr>: a custom element inside <table> would be
 * foster-parented out of the table by the HTML parser.
 */
@Component({
  selector: 'tr[appDiChildOwn]',
  templateUrl: './di-child-own.html',
  providers: [Beacon],
})
export class DiChildOwn {
  /**
   * Resolved normally: stops at this component's own provider.
   */
  readonly own = inject(Beacon);
  /**
   * Resolved with `skipSelf`: starts the search at the parent, so it deliberately
   * steps over the local provider and reaches the lesson's instance instead.
   */
  readonly fromParent = inject(Beacon, { skipSelf: true });
}
