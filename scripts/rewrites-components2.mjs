/** Length-balance touch-up for the 15 still-answer-is-longest `components`
 * questions (the rest were balanced in a prior pass). Correct-answer text is
 * preserved; one distractor per question is lengthened so the answer is no longer
 * the strict-longest option. Answer indices match current data (#166 stays 0; all
 * others stay 1). Backtick strings — no option contains a backtick or ${ . */
export default {
  59: { answer: 1, options: [
    `ElementRef requires the Renderer2 service before you can ever read its nativeElement`,
    `canvas is undefined in ngOnInit — the view is not built yet; use ngAfterViewInit`,
    `The template variable name must exactly match the class field name`,
    `@ViewChild does not work at all unless you pass { static: true } to it`,
  ] },
  61: { answer: 1, options: [
    `It validates the input at runtime, throwing whenever a non-number value is passed`,
    `It coerces the bound value to a number, so count="5" arrives as the number 5`,
    `It applies a CSS transform to the element whenever the input changes`,
    `It makes the input accept only boxed Number objects, never primitives`,
  ] },
  62: { answer: 1, options: [
    `afterRender runs once; afterNextRender runs after every render cycle`,
    `afterNextRender runs once after the next paint; afterRender runs after each one`,
    `They are completely identical — afterNextRender is afterRender with { once: true }`,
    `afterRender is only for SSR, whereas afterNextRender is browser-only`,
  ] },
  63: { answer: 1, options: [
    `Method calls inside templates are forbidden outright in Angular 17+`,
    `Angular re-runs getUser() on every change-detection cycle — wasteful and risky`,
    `Method calls in a template silently bypass OnPush change detection`,
    `Template expressions are only ever allowed to read properties, never call methods`,
  ] },
  64: { answer: 1, options: [
    `It attaches a click event listener onto the component's first child element instead`,
    `It is the metadata form of @HostListener — a click listener on the host element`,
    `It stops click events from reaching any of the child elements`,
    `It overrides the browser's default click behavior for the component`,
  ] },
  65: { answer: 1, options: [
    `It lets several components share a single template by all declaring one parent directive`,
    `It attaches directives to a component's host, composing behavior without subclassing`,
    `It lets one directive apply to many element types via multiple host selectors`,
    `It overrides a parent component's directive without creating a subclass`,
  ] },
  166: { answer: 0, options: [
    `ShadowDom uses native browser Shadow DOM; Emulated fakes scoping with attributes`,
    `ShadowDom stops all event bubbling from escaping out of the component`,
    `ShadowDom is faster mainly because it skips Angular's entire style-compilation step`,
    `Emulated uses inline styles while ShadowDom uses linked stylesheets`,
  ] },
  210: { answer: 1, options: [
    `It validates at compile time that only boolean values may ever be assigned to the input`,
    `It coerces attribute inputs to boolean, so a bare disabled attribute becomes true`,
    `It makes the input two-way bindable with the banana-in-a-box syntax`,
    `It runs the transform once, on the initial value only, and never again`,
  ] },
  211: { answer: 1, options: [
    `viewChild cannot query a plain <div>; it only ever finds components`,
    `The query resolves after view init — read it in effect()/afterNextRender, not here`,
    `You must call viewChild.required() or the query always returns undefined`,
    `The #box template reference must be exposed with exportAs before it becomes queryable`,
  ] },
  212: { answer: 1, options: [
    `model() adds full runtime validation to each and every value that gets assigned to it`,
    `model() is a writable two-way signal — setting it emits a valueChange for [(value)]`,
    `model() makes the input required by default, unlike an optional input()`,
    `model() converts the input signal into an Observable you subscribe to`,
  ] },
  247: { answer: 1, options: [
    `Never — the two binding forms really are always completely interchangeable here`,
    `When the target wants a non-string — interpolation always produces a string`,
    `Only when binding to custom components, never to native DOM elements`,
    `Only inside @if blocks`,
  ] },
  248: { answer: 1, options: [
    `http.get actually returns a Promise, so you have to await it inside of the template`,
    `user$ is an Observable — interpolating it prints the object; use the async pipe`,
    `The URL is wrong; /api/me returns nothing for the template to show`,
    `You must call user$.value to read the Observable's current value`,
  ] },
  269: { answer: 1, options: [
    `Just one single CSS class that some directive toggles on and off on the element there`,
    `trigger() names it; state() defines end styles; transition() animates between them`,
    `A single animate() call placed on the component's own selector`,
    `keyframes that are defined only inside the global stylesheet file`,
  ] },
  270: { answer: 1, options: [
    `They target the mouseenter and mouseleave hover events fired on the element itself here`,
    `:enter is void => * (element entering) and :leave is * => void (element leaving)`,
    `Route entry and exit transitions only`,
    `The focus and blur states of a form control`,
  ] },
  274: { answer: 1, options: [
    `@HostListener subscribes to a service and @HostBinding injects a DI token`,
    `@HostBinding keeps a class/style on the host in sync; @HostListener wires host events`,
    `Both of these decorators are usable only inside of @Component, and never within @Directive`,
    `They both require a ViewChild query in order to reach the host element`,
  ] },
};
