/**
 * Declarations shared by the Onpush lesson and its demo components.
 *
 * Hoisted out of `onpush.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

import { Injectable, signal } from '@angular/core';

/** Shared signal used to prove that only the views that READ it get re-rendered. */
@Injectable({ providedIn: 'root' })
export class TickerStore {
  /**
   * The shared count. Which views re-render when it changes is the point of the
   * reader/non-reader pair below.
   */
  readonly count = signal(0);
}
