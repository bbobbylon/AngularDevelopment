/** Length-balanced option rewrites for the `i18n` category (15 Qs).
 * Answer indices unchanged (#373 stays 0; the rest stay 1). Depth stays in each
 * (untouched) explanation. Backtick strings — no option contains a backtick or
 * ${ (the $localize option is described in prose, no interpolation literal). */
export default {
  265: { answer: 1, options: [
    `Wrap the text inside a translate() pipe on every single element`,
    `Add the i18n attribute; the CLI then extracts the marked text`,
    `Rename the template file to use the *.i18n.html suffix`,
    `Set a translate="yes" attribute on the page's <body> tag`,
  ] },
  266: { answer: 1, options: [
    `Concatenate: count + (count === 1 ? " item" : " items")`,
    `Use an ICU plural expression so each locale sets its own forms`,
    `Store both strings and pick the right one in the component`,
    `Always just use the plural form — users will understand it anyway`,
  ] },
  267: { answer: 1, options: [
    `It translates strings at runtime by fetching per-locale JSON`,
    `It builds a separate fully-translated bundle for each locale`,
    `It ships every language in one bundle, toggled with a signal`,
    `It requires a dedicated backend translation microservice`,
  ] },
  268: { answer: 1, options: [
    `Those formatting pipes simply cannot be localized at all`,
    `Register the locale data and provide LOCALE_ID, or it falls back`,
    `You must pass the locale string into every pipe call manually`,
    `DatePipe reads the browser's own language automatically, so do nothing`,
  ] },
  311: { answer: 1, options: [
    `translate("Welcome back!") from some global translate() function`,
    `$localize with a tagged template marks TS strings for extraction`,
    `i18n("Welcome back!") imported directly from the @angular/core package`,
    `new TranslatedString("Welcome back!") from the framework`,
  ] },
  312: { answer: 1, options: [
    `Element attributes simply cannot be translated in Angular i18n`,
    `Prefix the attribute name with i18n-, e.g. i18n-placeholder`,
    `Wrap the whole element inside a dedicated <i18n> tag`,
    `Move every attribute string into the component class first`,
  ] },
  313: { answer: 1, options: [
    `Three alternative translations of the same source text`,
    `meaning|description@@id — context, translator note, stable id`,
    `locale|region@@currency configuration used by the pipes`,
    `A CSS class, inline style, and element id applied after translation`,
  ] },
  314: { answer: 1, options: [
    `plural, =0 {She} =1 {He} other {They} — numeric branches`,
    `select, female {She replied} ... — matches by string value`,
    `switch, case female: … — like a TypeScript switch statement`,
    `Gender is not supported — use three separate *ngIf blocks`,
  ] },
  315: { answer: 1, options: [
    `They are functionally identical, so the choice is cosmetic`,
    `Compile-time bakes per-locale bundles; runtime swaps JSON live`,
    `ngx-translate is faster because it skips translation entirely`,
    `Built-in i18n supports only two locales per application`,
  ] },
  369: { answer: 1, options: [
    `It translates the text at runtime via a translation API call`,
    `It marks content for extraction and build-time replacement`,
    `It enables right-to-left layout when the locale requires it`,
    `It restricts the element to only render for non-English users`,
  ] },
  370: { answer: 1, options: [
    `It only saves typing; an @if/@else chain compiles the same`,
    `It branches by the locale's CLDR plural rules, set in the file`,
    `It memoizes the string so change detection skips the span`,
    `ICU syntax is now deprecated in favor of a built-in plural pipe`,
  ] },
  371: { answer: 1, options: [
    `ToastService must be provided in the root injector for translations to load`,
    `The string is built in TypeScript, so extraction misses it — use $localize`,
    `String concatenation with + is not allowed in zoneless apps`,
    `The i18n attribute is missing from the component decorator`,
  ] },
  372: { answer: 1, options: [
    `One single bundle holds every language; a runtime switch flips instantly`,
    `One build per locale with translations baked in; you redirect to switch`,
    `Translations are fetched as JSON on startup and applied by a pipe`,
    `Each lazy route downloads only its own language file on demand`,
  ] },
  373: { answer: 0, options: [
    `i18n-title — attributes are marked with the i18n-<name> prefix`,
    `[title.i18n]="true" — attribute translation uses a binding flag`,
    `translate="title" — a translate attribute lists what to localize`,
    `i18n="title" — the i18n attribute takes the attribute name`,
  ] },
  374: { answer: 1, options: [
    `Pass the locale on each and every call, e.g. date:"medium":"":"de-CH"`,
    `The CLDR locale data was never registered; pipes fall back to en-US`,
    `The pipes only support English; use Intl.DateTimeFormat directly`,
    `The server must send a Content-Language: de-CH header to switch`,
  ] },
};
