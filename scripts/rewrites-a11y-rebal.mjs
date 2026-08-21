/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of "a11y"
 * MC questions. Distractor text and answer index unchanged. */
export default {
  238: { answer: 1, options: [
    `Nothing — a click handler makes any element a proper button`,
    `A <div> is not focusable, has no button role, and isn't announced to assistive tech`,
    `The bug is the CSS class name; just rename it to "button"`,
    `You must add a (mouseover) alongside (click) for accessibility`,
  ] },
  300: { answer: 1, options: [
    `Pick whichever heading tag happens to have the font size you want`,
    `A logical outline: one h1, then h2, h3 in document order, with no skipped levels`,
    `Every heading on the page should be an h1 for better SEO`,
    `Headings are decorative and interchangeable with styled divs`,
  ] },
  301: { answer: 1, options: [
    `Any color combination is fine if the design team approves it`,
    `At least 4.5:1 for normal text, 3:1 for large text and UI components`,
    `Only black text on a white background is truly compliant`,
    `Contrast rules apply only to links, never to body text`,
  ] },
  377: { answer: 1, options: [
    `Dialogs only need a close button; focus is a nice-to-have`,
    `Trap focus inside, return it to the trigger on close; CDK cdkTrapFocus helps`,
    `Set tabindex="-1" on everything behind it by walking the DOM`,
    `Just add autofocus to the first input; the browser does the rest`,
  ] },
  379: { answer: 1, options: [
    `Nothing — updating document.title triggers a full announcement`,
    `Move focus to the new view's main heading (tabindex=-1) on nav end`,
    `Set aria-live="assertive" on <router-outlet> for all changes`,
    `Use full page reloads always; SPAs simply cannot be accessible`,
  ] },
};
