/**
 * Declarations shared by the StructuralDirectives lesson and its demo components.
 *
 * Hoisted out of `structural-directives.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

/** Context object type for *appRepeat — enables type-checked `let` vars in templates. */
export interface RepeatContext {
  $implicit: number; // fills the bare `let n`
  index: number; // fills `let i = index`
  first: boolean; // fills `let f = first`
}
