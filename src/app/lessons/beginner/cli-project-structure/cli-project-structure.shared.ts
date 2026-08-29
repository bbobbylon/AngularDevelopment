/**
 * Declarations shared by the CliProjectStructure lesson and its demo components.
 *
 * Hoisted out of `cli-project-structure.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

/**
 * One file in the scaffolded-project tree, with the role it plays.
 */
export interface FileNode {
  path: string;
  label: string;
  role: string;
}
