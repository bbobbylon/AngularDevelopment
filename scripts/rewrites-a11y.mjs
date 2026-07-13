/** Length-balanced option rewrites for the `a11y` category (18 Qs).
 * Answer indices unchanged (#380 stays 0; the rest stay 1). Depth stays in each
 * (untouched) explanation. Backtick strings — no option contains a backtick or ${ . */
export default {
  238: { answer: 1, options: [
    `Nothing — a click handler makes any element a proper button`,
    `A <div> is not focusable, has no button role, isn't announced`,
    `The bug is the CSS class name; just rename it to "button"`,
    `You must add a (mouseover) alongside (click) for accessibility`,
  ] },
  239: { answer: 1, options: [
    `Add a plain title attribute to the inner <svg> element only`,
    `Give the button an aria-label and mark the icon aria-hidden`,
    `Wrap the whole thing in a <div role="button"> element`,
    `Nothing needed — screen readers read the SVG path data aloud`,
  ] },
  240: { answer: 1, options: [
    `Only add a semi-transparent backdrop behind the dialog`,
    `Move focus in, trap it inside, and restore it to the trigger`,
    `Disable the keyboard entirely while the dialog is open`,
    `Nothing special — the browser handles <div> modal focus for free`,
  ] },
  241: { answer: 1, options: [
    `Show a toast with a bright color so it clearly stands out`,
    `Put it in an aria-live region, or use CDK LiveAnnouncer`,
    `Call element.focus() on the results heading every time`,
    `Nothing — screen readers re-read the whole page on DOM changes`,
  ] },
  242: { answer: 1, options: [
    `Make sure that all animations are shorter than about 500ms each`,
    `Honor prefers-reduced-motion; gate non-essential motion on it`,
    `Only animate on desktop screens, and never on mobile`,
    `Add a manual "turn off animations" toggle and nothing else`,
  ] },
  297: { answer: 1, options: [
    `alt is optional — screen readers skip images without it`,
    `Informative images need alt; decorative ones get alt="" to skip`,
    `Every single image needs a long alt describing every pixel`,
    `alt="" hides the image visually as well as from the screen reader`,
  ] },
  298: { answer: 1, options: [
    `Placeholders were fully deprecated as of the HTML5 specification`,
    `Placeholder text vanishes on typing and is unreliably announced`,
    `Labels are only required for checkboxes and radio buttons`,
    `A placeholder works fine as long as it is written in capitals`,
  ] },
  299: { answer: 1, options: [
    `(click)="skip()" on the anchor and #main on the <main> tag`,
    `href="#main-content" on the anchor, matching id on <main>`,
    `routerLink="/main" on the anchor and a "main" route path`,
    `aria-skip="true" on the anchor and aria-target on <main>`,
  ] },
  300: { answer: 1, options: [
    `Pick whichever heading tag happens to have the font size you want`,
    `A logical outline: one h1, then h2, h3, with no skipped levels`,
    `Every heading on the page should be an h1 for better SEO`,
    `Headings are decorative and interchangeable with styled divs`,
  ] },
  301: { answer: 1, options: [
    `Any color combination is fine if the design team approves it`,
    `At least 4.5:1 for normal text, 3:1 for large text and UI`,
    `Only black text on a white background is truly compliant`,
    `Contrast rules apply only to links, never to body text`,
  ] },
  302: { answer: 1, options: [
    `aria-selected="true" hardcoded onto the current link`,
    `[attr.aria-current]="rla.isActive ? 'page' : null" drives it`,
    `disabled on the current link so that it can no longer be clicked`,
    `title="current", which every screen reader will announce`,
  ] },
  303: { answer: 1, options: [
    `Nothing — the router fully replicates real browser navigation`,
    `Focus and announcement: move focus to the new view, set titles`,
    `You must manually reload all of the stylesheets on every route change`,
    `You must re-register every event listener after navigating`,
  ] },
  375: { answer: 1, options: [
    `Nothing — (click) works the same on any element, style only`,
    `No focus, no Enter/Space activation, no button role announced`,
    `The div fires click twice on touch devices, double-saving`,
    `Divs cannot receive (click) bindings in zoneless applications`,
  ] },
  376: { answer: 1, options: [
    `mat-icon requires the fontIcon input instead of text content`,
    `Icon-only buttons have no accessible name; add aria-label`,
    `Buttons may not contain custom elements; move icons outside`,
    `The buttons need tabindex="0" to be announced correctly`,
  ] },
  377: { answer: 1, options: [
    `Dialogs only need a close button; focus is a nice-to-have`,
    `Trap focus inside, return it on close; CDK cdkTrapFocus helps`,
    `Set tabindex="-1" on everything behind it by walking the DOM`,
    `Just add autofocus to the first input; the browser does the rest`,
  ] },
  378: { answer: 1, options: [
    `Move focus onto the toast so the reader is forced to read it`,
    `A live region (aria-live/role=status) announces without focus`,
    `Add aria-label="Saved!" to the toast div when it appears`,
    `Screen readers automatically read any element added to the DOM`,
  ] },
  379: { answer: 1, options: [
    `Nothing — updating document.title triggers a full announcement`,
    `Move focus to the new view's heading (tabindex=-1) on nav end`,
    `Set aria-live="assertive" on <router-outlet> for all changes`,
    `Use full page reloads always; SPAs simply cannot be accessible`,
  ] },
  380: { answer: 0, options: [
    `for="email" — matching the input's id links label and control`,
    `[label]="email" — bind the label to the FormControl instance`,
    `aria-label="email" — labels reference inputs via aria-label`,
    `name="email" — the label's name attribute pairs it with control`,
  ] },
};
