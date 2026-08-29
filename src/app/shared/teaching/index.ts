/**
 * The teaching-component set: the shared building blocks that let every lesson hit the
 * retention bar recorded in `.claude/CLAUDE.md` without reinventing the markup.
 *
 * Each one exists because the retention audit (`node scripts/audit-retention.mjs`) found
 * the same gap in nearly every lesson:
 *
 * | Component        | Fills the gap                                          |
 * | ---------------- | ------------------------------------------------------ |
 * | {@link Remember} | a boxed, memorable one-line statement of the key idea  |
 * | {@link Quiz}     | active recall with explained feedback, mid-lesson      |
 * | {@link Predict}  | ask-before-telling — commit to an answer, then reveal  |
 * | {@link Faq}      | the small doubts a learner hesitates to ask out loud   |
 * | {@link Flow}     | a step diagram, the visual most lessons actually need  |
 * | {@link Compare}  | before/after and old-API/new-API side by side          |
 *
 * Imported through this barrel so a lesson pulls several in one line:
 *
 * ```ts
 * import { Compare, Flow, Quiz, Remember } from '../../../shared/teaching';
 * ```
 *
 * @see docs/CONTRIBUTING.md for when to reach for each one.
 */
export { Compare, type CompareTone } from './compare/compare';
export { Faq, type FaqItem } from './faq/faq';
export { Flow, type FlowStep, type FlowTone } from './flow/flow';
export { Predict } from './predict/predict';
export { Quiz, type QuizOption } from './quiz/quiz';
export { Remember, type RememberVariant } from './remember/remember';
export { RichText } from './rich-text/rich-text';
export { segmentInlineCode, type TextSegment } from './inline-code';
