/**
 * Declarations shared by the Lifecycle lesson and its demo components.
 *
 * Hoisted out of `lifecycle.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

import { Injectable, signal } from '@angular/core';

/** Shared, lesson-scoped log so parent and child see the same entries. */
@Injectable()
export class LifecycleLog {
  /**
   * The log lines, numbered as they arrive.
   */
  readonly entries = signal<string[]>([]);
  /**
   * Appends a line.
   *
   * @param msg What happened.
   */
  add(msg: string) {
    this.entries.update((e) => [...e, `${this.entries().length + 1}. ${msg}`]);
  }
  /**
   * Clears the log.
   */
  clear() {
    this.entries.set([]);
  }
}
