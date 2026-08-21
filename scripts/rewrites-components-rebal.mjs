/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "components" MC questions. Distractor text and answer index unchanged; only
 * the correct option gains real technical precision (never padding/fluff). */
export default {
  1: { answer: 1, options: [
    `@NgModule — groups related components and services into one shared module`,
    `@Component — declares a reusable UI element with a template, styles, and a CSS selector`,
    `@Injectable — marks a class as available for dependency injection`,
    `@Directive — adds behavior to an existing element without its own template`,
  ] },
  28: { answer: 1, options: [
    `@Component and @Directive are entirely separate, unrelated decorators`,
    `@Component is @Directive plus a template — it renders and owns its own DOM view`,
    `@Directive is a simplified, cut-down version of @Component for small jobs`,
    `They are aliases; the framework picks one based on how you use the class`,
  ] },
  48: { answer: 1, options: [
    `The root singleton instance — the root injector always takes precedence`,
    `The component-scoped instance — the nearest injector in the tree wins first`,
    `Both instances, merged together into an array of providers`,
    `Angular throws a duplicate-provider compilation error at build time`,
  ] },
  58: { answer: 1, options: [
    `Attribute directives use @Directive while structural ones use @Component`,
    `Structural directives add/remove DOM via TemplateRef; attribute ones only restyle it`,
    `Attribute directives need a [] selector; structural directives need a * selector`,
    `Structural directives can only ever be applied to <ng-template> elements`,
  ] },
  62: { answer: 1, options: [
    `afterRender runs once; afterNextRender runs after every render cycle`,
    `afterNextRender runs once after the next paint; afterRender runs after each render cycle`,
    `They are completely identical — afterNextRender is afterRender with { once: true }`,
    `afterRender is only for SSR, whereas afterNextRender is browser-only`,
  ] },
  65: { answer: 1, options: [
    `It lets several components share a single template by all declaring one parent directive`,
    `It attaches reusable directives to a component's host, composing behavior without subclassing`,
    `It lets one directive apply to many element types via multiple host selectors`,
    `It overrides a parent component's directive without creating a subclass`,
  ] },
  151: { answer: 0, options: [
    `A type-safe DI key for non-class values such as config objects, avoiding the "magic string" anti-pattern`,
    `A decorator that marks a class as injectable into the DI system`,
    `A guard that prevents more than one instance of a service being created`,
    `A helper used to inject primitive values such as numbers directly into your templates`,
  ] },
  166: { answer: 0, options: [
    `ShadowDom uses native browser Shadow DOM; Emulated fakes scoping with generated attributes`,
    `ShadowDom stops all event bubbling from escaping out of the component`,
    `ShadowDom is faster mainly because it skips Angular's entire style-compilation step`,
    `Emulated uses inline styles while ShadowDom uses linked stylesheets`,
  ] },
  188: { answer: 1, options: [
    `inject() bypasses Angular DI entirely and directly instantiates the service`,
    `inject(Token) resolves a dependency from the current injection context, no constructor needed`,
    `inject() only works for services, whereas constructor injection works for any token`,
    `inject() is slower than constructor injection because it looks the token up each time`,
  ] },
  200: { answer: 1, options: [
    `@let creates a template variable that, unlike a #ref, you can later reassign`,
    `@let binds a computed expression to a local, reusable name, evaluated once per template`,
    `@let imports an external variable from the component class into the template`,
    `@let is the template form of TypeScript let, replacing @const for mutable values`,
  ] },
  212: { answer: 1, options: [
    `model() adds full runtime validation to each and every value that gets assigned to it`,
    `model() is a writable two-way signal — setting it emits a valueChange event for the [(value)] binding`,
    `model() makes the input required by default, unlike an optional input()`,
    `model() converts the input signal into an Observable you subscribe to`,
  ] },
  247: { answer: 1, options: [
    `Never — the two binding forms really are always completely interchangeable here`,
    `When the target property wants a non-string value — interpolation always produces a string`,
    `Only when binding to custom components, never to native DOM elements`,
    `Only inside @if blocks`,
  ] },
  269: { answer: 1, options: [
    `Just one single CSS class that some directive toggles on and off on the element there`,
    `trigger() names it; state() defines end styles; transition() animates between them, using duration and easing`,
    `A single animate() call placed on the component's own selector`,
    `keyframes that are defined only inside the global stylesheet file`,
  ] },
};
