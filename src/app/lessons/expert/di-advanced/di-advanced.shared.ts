/**
 * Declarations shared by the DiAdvanced lesson and its demo components.
 *
 * Hoisted out of `di-advanced.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

import { Injectable } from '@angular/core';

/**
 * Instance beacon for the live playground: every instantiation gets the next
 * id, so components can PROVE which injector their dependency came from.
 */
@Injectable()
export class Beacon {
  /**
   * Sequence source for instance ids.
   */
  private static next = 1;
  /**
   * This instance's id. Distinct ids are how the demo proves two components got
   * different instances rather than sharing one.
   */
  readonly id = Beacon.next++;
}
