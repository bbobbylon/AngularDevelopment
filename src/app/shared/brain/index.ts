/**
 * The brain-friendly presentation set — the devices that make a lesson read
 * like a chapter of a book rather than a page of a manual.
 *
 * This is the *second* teaching layer. `shared/teaching/` owns the retention
 * devices (say it again in another mode, make the reader commit to an answer,
 * answer the doubt they would not ask). This one owns presentation: the shapes,
 * voices and textures that decide where the eye lands and what it lands on.
 * They compose — a migrated lesson uses both.
 *
 * | Component        | The job it does                                          |
 * | ---------------- | -------------------------------------------------------- |
 * | {@link Chapter}  | opens the lesson: numeral, track badge, "you are here"    |
 * | {@link CodeLab}  | an editor window with line-by-line numbered annotations   |
 * | {@link Layers}   | concentric rings — for anything that *contains* something |
 * | {@link Bubbles}  | two objects talking, instead of prose about their contract|
 * | {@link TapeCard} | a named thing pinned to the page; use in rows of 3–4      |
 * | {@link Napkin}   | the author interrupting: stop and do this one thing       |
 * | {@link BfPage}   | opts the whole page into the warm palette                 |
 *
 * ## Opting a lesson in
 *
 * ```html
 * <article class="lesson bf" bfPage>
 *   <app-chapter number="7" title="…" hand="…" [stops]="stops" [current]="1">
 *     <p class="lead">…</p>
 *   </app-chapter>
 *   …
 * </article>
 * ```
 *
 * `class="bf"` scopes the typography and palette; `bfPage` extends the paper
 * tint to `<html>` for as long as the lesson is mounted. Both are needed —
 * see {@link BfPage} for why.
 *
 * Imported through this barrel so a lesson pulls several in one line:
 *
 * ```ts
 * import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
 * ```
 *
 * @see src/brain-friendly.css for the tokens, prose colour and shared classes.
 * @see docs/UI-DESIGN.md §9 for the design rationale and the rollout state.
 */
export { BfPage } from './bf-page.directive';
export { Bubbles, type BubbleTurn } from './bubbles/bubbles';
export { Chapter, type ChapterStop } from './chapter/chapter';
export { CodeLab, type CodeNote } from './code-lab/code-lab';
export { Layers, type Layer } from './layers/layers';
export { Napkin } from './napkin/napkin';
export { TapeCard, type TapeTone } from './tape-card/tape-card';
