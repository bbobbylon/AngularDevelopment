/** Fix the 2 strictly-shortest answers in "components" (52, 2) left over after
 * the longest-push rebalance already met this category's ~25% quota. #52 is
 * allowed to land longest (harmless overshoot on a 51-question category); #2
 * is verified mid-pack (length-checked against the live distractor lengths). */
export default {
  52: { answer: 0, options: [
    `@ContentChild returns just the first match; @ContentChildren returns a QueryList`,
    `@ContentChild is for components while @ContentChildren is only for directives`,
    `@ContentChildren resolves asynchronously; @ContentChild resolves synchronously`,
    `They are identical — @ContentChildren is merely the plural alias of the other`,
  ] },
  2: { answer: 3, options: [
    `The selector must start with a custom prefix like "my-" rather than "app-"`,
    `The {{ name }} interpolation is written incorrectly and will not bind at all`,
    `The component must implement the OnInit lifecycle-hook interface to render`,
    `The standalone: true flag is entirely missing from the @Component decorator`,
  ] },
};
