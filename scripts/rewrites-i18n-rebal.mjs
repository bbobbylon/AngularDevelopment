/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of "i18n"
 * MC questions. Distractor text and answer index unchanged. */
export default {
  265: { answer: 1, options: [
    `Wrap the text inside a translate() pipe on every single element`,
    `Add the i18n attribute, then run ng extract-i18n to pull the marked text into a translation file`,
    `Rename the template file to use the *.i18n.html suffix`,
    `Set a translate="yes" attribute on the page's <body> tag`,
  ] },
  314: { answer: 1, options: [
    `plural, =0 {She} =1 {He} other {They} — numeric branches`,
    `select, female {She replied} male {He replied} other {They replied} — matches by string value`,
    `switch, case female: … — like a TypeScript switch statement`,
    `Gender is not supported — use three separate *ngIf blocks`,
  ] },
  370: { answer: 1, options: [
    `It only saves typing; an @if/@else chain compiles the same`,
    `It branches by the locale's CLDR plural rules, so each language supplies its own required forms`,
    `It memoizes the string so change detection skips the span`,
    `ICU syntax is now deprecated in favor of a built-in plural pipe`,
  ] },
  373: { answer: 0, options: [
    `i18n-title — attributes are marked with the i18n-<name> prefix, same as i18n-alt or i18n-placeholder`,
    `[title.i18n]="true" — attribute translation uses a binding flag`,
    `translate="title" — a translate attribute lists what to localize`,
    `i18n="title" — the i18n attribute takes the attribute name`,
  ] },
};
