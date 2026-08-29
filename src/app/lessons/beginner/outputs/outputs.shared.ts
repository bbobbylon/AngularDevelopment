/**
 * Declarations shared by the Outputs lesson and its demo components.
 *
 * Hoisted out of `outputs.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

/**
 * The payload the rating component emits.
 */
export interface RateEvent {
  stars: number;
  at: Date;
}
