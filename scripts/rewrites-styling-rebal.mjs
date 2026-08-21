/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "styling" MC questions. Distractor text and answer index unchanged. */
export default {
  401: { answer: 1, options: [
    `Angular renames every <p> tag to a unique generated element name`,
    `Emulated encapsulation adds a unique per-component attribute that every compiled selector is then rewritten to require`,
    `Component styles only apply to elements that carry an [ngStyle] binding`,
    `The styles array is documentation-only, so real CSS must live in the global sheet`,
  ] },
  403: { answer: 1, options: [
    `Its template stops rendering the component's own styles entirely`,
    `Its styles are injected as unscoped globals, so the selectors can match elements anywhere in the whole page`,
    `It switches the component over to native Shadow DOM isolation of styles`,
    `Child components can no longer receive inputs from this component`,
  ] },
};
