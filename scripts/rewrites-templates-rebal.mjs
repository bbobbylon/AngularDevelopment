/** Rebalance pass: fix the 2 strictly-shortest answers in "templates" (398, 400)
 * by lengthening them with genuine clarifying detail; both cross into
 * strictly-longest, which also satisfies this category's ~25% quota (2/8).
 * Distractor text and answer index unchanged. */
export default {
  398: { answer: 1, options: [
    `The script executes — [innerHTML] is a direct XSS hole in Angular`,
    `Angular's sanitizer strips it: the inline <script> tag and event handlers are both removed before rendering`,
    `Angular throws a sanitization error and then renders nothing at all`,
    `The HTML renders as escaped text, with every tag visible to the user`,
  ] },
  400: { answer: 1, options: [
    `Plain <div> elements simply cannot host Angular event bindings at all`,
    `A real <button> element is natively focusable, keyboard-activatable, and properly announced to screen readers`,
    `Buttons render measurably faster than divs during change detection`,
    `The (click) event binding syntax only compiles on native form controls`,
  ] },
};
