/**
 * The page-shape set — the devices that let a lesson OPEN differently.
 *
 * This is the *third* teaching layer, added 2026-09-13 for BACKLOG §2.10.
 * `shared/teaching/` owns retention (say it again, make them commit, answer
 * the doubt) and `shared/brain/` owns presentation (where the eye lands). Both
 * were rolled out to all 103 lessons — and the audit that followed found the
 * cost: 88 of them open Chapter → Napkin, 63 with the same third device too.
 * The pieces vary; the frame never does.
 *
 * Head First does the opposite. Each chapter picks a *dominant* format and
 * strips the rest. This set is what those formats are built from — the
 * opening block after the chapter title is one of four **shapes**, each led
 * by a different device below and each forbidding the devices the others
 * lean on (the sequences and the forbidden lists are in
 * `docs/CONTRIBUTING.md` §2C):
 *
 * | Shape                 | Led by                                    | Also uses                          |
 * | --------------------- | ----------------------------------------- | ---------------------------------- |
 * | `no-dumb-questions`   | {@link NoDumbQuestions} — Q&A as the spine | BrainPower, Layers/Whiteboard, Quiz|
 * | `receipt`             | {@link Receipt} — an itemised bill         | Scribble, Compare, Chain, CodeLab  |
 * | `whiteboard`          | {@link Whiteboard} — one big figure        | BrainPower (first), Scribble, Flow |
 * | `argument`            | two `Bubbles` split by {@link BrainPower}  | `.bf-principle`, Layers/Whiteboard |
 *
 * | Component                | The job it does                                               |
 * | ------------------------ | ------------------------------------------------------------- |
 * | {@link BrainPower}       | a question posed and left open — the hook that stays open     |
 * | {@link Scribble}         | a handwritten call-out that points by quoting a label         |
 * | {@link NoDumbQuestions}  | six to eight open Q&As that carry the whole explanation       |
 * | {@link Receipt}          | an itemised bill with the surprising line and a loud total    |
 * | {@link Chain}            | the pipeline named on one line, before the code that is it    |
 * | {@link Whiteboard}       | the board, caption, description and call-outs around a figure |
 *
 * The typographic beats the shapes share — `.bf-big`, `.bf-say`, `.bf-principle`,
 * `.bf-answer` — are classes in `brain-friendly.css` §16, like the eyebrow and
 * the margin voice, because a giant sentence needs no component. (The handwritten
 * line under the chapter title is the Chapter's own `hand` input, not a shape
 * beat.) The `.wb-*` classes for drawing inside a {@link Whiteboard} live there
 * too.
 *
 * A lesson declares which shape it uses with `shape:` on its curriculum entry
 * (`Shape` in `core/lesson.model.ts`); `node scripts/audit-variety.mjs` checks
 * the declaration against the markup and flags neighbours that match.
 *
 * ```ts
 * import { BrainPower, Receipt, Scribble } from '../../../shared/shapes';
 * ```
 *
 * @see docs/BACKLOG.md §2.10 for why, and the sibling project the shapes are copied from.
 * @see docs/CONTRIBUTING.md §2C for the block sequence of each shape.
 */
export { BrainPower } from './brain-power/brain-power';
export { Chain } from './chain/chain';
export { NoDumbQuestions, type NdqItem } from './no-dumb-questions/no-dumb-questions';
export { Receipt, type ReceiptRow } from './receipt/receipt';
export { Scribble, type ScribbleTone } from './scribble/scribble';
export { Whiteboard } from './whiteboard/whiteboard';
