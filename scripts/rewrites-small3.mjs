/** Length-balanced rewrites for templates (8) + styling (8) + tooling (10).
 * All answers index 1; depth stays in the untouched explanations. */
export default {
  // ---- templates ----
  393: { answer: 1, options: [
    `[src] binds one time only, whereas the interpolation form keeps updating live`,
    `Both stay in sync — [src] sets the DOM property and is generally preferred`,
    `src="{{ url }}" is a compile-time error when used on native elements`,
    `They only differ for custom components, and never for native elements`,
  ] },
  394: { answer: 1, options: [
    `colspan must be capitalized as [colSpan]; the lowercase form never binds either way`,
    `colspan is an attribute, not a property — bind it with [attr.colspan]="span"`,
    `Numbers cannot be bound in templates, so span has to be a string first`,
    `<td> elements simply do not support any Angular bindings at all`,
  ] },
  395: { answer: 1, options: [
    `A <div> that has display: contents applied to it`,
    `Nothing — a template-only grouping element for structural directives`,
    `A comment node that measurably slows the page rendering down every time`,
    `An <ng-container> custom element that the browser simply ignores`,
  ] },
  396: { answer: 1, options: [
    `Always the raw underlying DOM element in every case, tag or component`,
    `The DOM element on a plain tag; the component instance on a component`,
    `Always the component class instance backing the current template`,
    `A string value that simply holds the element's id attribute`,
  ] },
  397: { answer: 1, options: [
    `Both lines immediately throw a template compilation error`,
    `The first renders empty (?. is safe); the second throws (! is type-only)`,
    `Both simply render the literal string "undefined" to the page`,
    `The safe-navigation line renders "null"; the assertion line renders empty`,
  ] },
  398: { answer: 1, options: [
    `The script executes — [innerHTML] is a direct, unguarded XSS hole in Angular`,
    `Angular sanitizes it — the script and event handlers are stripped out`,
    `Angular throws an error and renders nothing on the page at all`,
    `The HTML renders as escaped text, with the tags visible to the user`,
  ] },
  399: { answer: 1, options: [
    `It declares a new field on the component class from the template`,
    `It names an expression once for reuse below it in the same template`,
    `It is a compile-time constant that is frozen at the first render`,
    `It replaces @if — @let renders its content only when the value is truthy`,
  ] },
  400: { answer: 1, options: [
    `A plain <div> is simply not able to host Angular event bindings like (click)`,
    `A real <button> is semantic — focusable, keyboard-activatable, and announced`,
    `Buttons render measurably faster than divs during change detection`,
    `The (click) event syntax only compiles when placed on form controls`,
  ] },
  // ---- styling ----
  401: { answer: 1, options: [
    `Angular renames every single <p> tag to a unique, per-component element name`,
    `Emulated encapsulation scopes CSS via a generated per-component attribute`,
    `Component styles only ever apply to elements that carry [ngStyle]`,
    `The styles array is documentation-only; the real CSS must all be global`,
  ] },
  402: { answer: 1, options: [
    `<li class="active={{ isActive }}">`,
    `<li [class.active]="isActive">`,
    `<li className="isActive">`,
    `<li (class)="active: isActive">`,
  ] },
  403: { answer: 1, options: [
    `Its template just stops rendering any styles at all`,
    `Its styles become unscoped globals that can match elements anywhere`,
    `It switches the component over to native browser Shadow DOM isolation instead`,
    `Child components can no longer receive any of their inputs`,
  ] },
  404: { answer: 1, options: [
    `The <body> element that is hosting the entire Angular application here`,
    `The component's own host element; :host(.compact) adds the class case`,
    `The very first child element inside the component template`,
    `The router outlet that the component was rendered into`,
  ] },
  405: { answer: 1, options: [
    `Increase the specificity until it wins: app-fancy-list div .item-title`,
    `Encapsulation blocks it — expose a CSS custom property the parent sets`,
    `Move the rule into index.html so that it loads before Angular does`,
    `Set encapsulation: ShadowDom on the parent component to gain internal access`,
  ] },
  406: { answer: 1, options: [
    `None — the build just concatenates them all into one stylesheet`,
    `Global styles are document-wide and unscoped; component styles ship scoped`,
    `Component styles override global styles regardless of the CSS specificity rules`,
    `Global stylesheets are not allowed to use CSS custom properties`,
  ] },
  407: { answer: 1, options: [
    `They are the single CSS feature that Angular deliberately chooses not to sanitize`,
    `Custom properties inherit down the DOM; encapsulation only rewrites selectors`,
    `Angular automatically compiles every var() call down into a component input`,
    `They bypass the browser's cascade entirely, purely for speed reasons`,
  ] },
  408: { answer: 1, options: [
    `A crash — style bindings must always be given strings with explicit units`,
    `style="width: 250px; opacity: 0.5" — the .px suffix appends the unit`,
    `Only opacity applies; the width binding really needs [ngStyle] instead`,
    `width: 250 unitless and ignored — the .px suffix syntax does not exist`,
  ] },
  // ---- tooling ----
  409: { answer: 1, options: [
    `Alphabetical convention only — the split does not carry any real meaning at all`,
    `dependencies ship in the app bundle; devDependencies are build-time tools`,
    `devDependencies are optional and are allowed to fail during installation`,
    `Packages in devDependencies cannot be imported from your TypeScript code`,
  ] },
  410: { answer: 1, options: [
    `It lists the JavaScript files that get injected into index.html at build`,
    `It defines named commands run via npm run, with .bin on the PATH`,
    `It configures the Angular compiler's own entry-point scripts`,
    `It registers the service workers used by the production build`,
  ] },
  411: { answer: 1, options: [
    `The npm manifest that lists dependencies and package scripts`,
    `The CLI workspace config — projects, architect targets, and builders`,
    `The TypeScript compiler's configuration file for the project`,
    `A runtime configuration file that the browser fetches during app bootstrap`,
  ] },
  412: { answer: 1, options: [
    `^ means beta releases while ~ means stable-only releases`,
    `^ allows minor+patch, ~ allows patch only; the lockfile pins exact`,
    `They are interchangeable — npm simply ignores the version-range prefix`,
    `^ pins the one exact version, whereas ~ allows anything newer`,
  ] },
  413: { answer: 1, options: [
    `It imported that CSS into every component's own scoped styles`,
    `It registers a global stylesheet; angular.json is read once at startup`,
    `It only added a <link> tag for production builds specifically`,
    `Nothing at all — third-party CSS must instead be imported inside main.ts`,
  ] },
  414: { answer: 1, options: [
    `Monetary cost limits for your cloud deployment bills`,
    `Bundle size thresholds checked at build time — warn or fail past a limit`,
    `Wall-clock time limits on how long a single ng build is allowed to run for`,
    `Memory usage limits placed on the dev-server process`,
  ] },
  415: { answer: 1, options: [
    `Three fully independent configs that you must keep in sync by hand yourself`,
    `tsconfig.json is the base; app and spec extend it, narrowing file scope`,
    `Only tsconfig.app.json is real — the others are legacy stub files`,
    `They correspond to the dev, staging, and production build variants`,
  ] },
  416: { answer: 1, options: [
    `Nothing at all — it is simply an alias for the very same TypeScript flag`,
    `It type-checks template bindings, catching wrong-typed [input]s at build`,
    `It forces every component template into its own separate .html file`,
    `It enables runtime assertions inside your production templates`,
  ] },
  417: { answer: 1, options: [
    `It only sets NODE_ENV and hopes that libraries react to it`,
    `It applies the named config's option overrides — minify, hashing, budgets`,
    `It runs the exact same build twice over and then diffs the two output sets`,
    `Production builds quietly use a different framework version`,
  ] },
  418: { answer: 1, options: [
    `Nothing here really matters; CI just needs a newer version of Node installed`,
    `Removing the spec exclusion pulled test files into the app compilation`,
    `describe must be imported from @angular/core at the top of every spec`,
    `The "files" and "extends" keys are not allowed to be used together`,
  ] },
};
