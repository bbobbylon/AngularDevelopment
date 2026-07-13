/** Length-balanced option rewrites for the `styling` category (8 Qs).
 * Answer indices unchanged; the correct option is trimmed into the distractor
 * band and every distractor is a plausible, comparable-length claim. All depth
 * stays in each (untouched) explanation. Backtick strings — no option contains a
 * backtick or ${ interpolation. */
export default {
  401: { answer: 1, options: [
    `Angular renames every <p> tag to a unique generated element name`,
    `Emulated encapsulation adds a per-component attribute the selector then requires`,
    `Component styles only apply to elements that carry an [ngStyle] binding`,
    `The styles array is documentation-only, so real CSS must live in the global sheet`,
  ] },
  402: { answer: 1, options: [
    `<li class="active={{ isActive }}"> — interpolates the class name inline`,
    `<li [class.active]="isActive"> — toggles that one class as the boolean flips`,
    `<li className="isActive"> — sets the DOM className property to that string`,
    `<li (class)="active: isActive"> — binds class changes as a DOM event handler`,
  ] },
  403: { answer: 1, options: [
    `Its template stops rendering the component's own styles entirely`,
    `Its styles inject as unscoped globals that can match elements anywhere`,
    `It switches the component over to native Shadow DOM isolation of styles`,
    `Child components can no longer receive inputs from this component`,
  ] },
  404: { answer: 1, options: [
    `:host targets the <body> element that hosts the whole Angular app`,
    `:host styles the component's own element; :host(.compact) adds the class case`,
    `:host targets the first child element rendered inside the component template`,
    `:host targets the router outlet the component was rendered into by the router`,
  ] },
  405: { answer: 1, options: [
    `Raise specificity until it wins, e.g. app-fancy-list div .item-title`,
    `Expose a CSS custom property the child consumes and the parent sets`,
    `Move the rule into index.html so it loads before Angular boots up`,
    `Set encapsulation: ShadowDom on the parent to reach into the child`,
  ] },
  406: { answer: 1, options: [
    `None — the build simply concatenates them into one shared stylesheet`,
    `Global styles are document-wide and unscoped; component styles ship scoped`,
    `Component styles always override global ones regardless of CSS specificity`,
    `Global styles in styles.css are not permitted to use CSS custom properties`,
  ] },
  407: { answer: 1, options: [
    `They are the only CSS feature that Angular chooses not to sanitize at runtime`,
    `Custom properties inherit through the DOM; encapsulation rewrites only selectors`,
    `Angular compiles each var() reference into a real component input automatically`,
    `They bypass the browser cascade entirely, which is what makes them fast`,
  ] },
  408: { answer: 1, options: [
    `A crash — style bindings require strings that already include their units`,
    `style="width: 250px; opacity: 0.5" — the .px suffix appends the unit`,
    `Only opacity applies; the width binding needs an [ngStyle] object instead`,
    `width: 250 unitless and ignored — the .px suffix syntax is not real`,
  ] },
};
