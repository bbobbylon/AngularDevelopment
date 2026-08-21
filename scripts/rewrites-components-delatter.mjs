// Rewrites for 'components'-category questions whose explanations referenced
// distractors by bare original-letter position (A/B/C/D). Each entry below
// replaces ONLY the explanation text with a version that identifies distractors
// by their actual content instead of by shuffled-unsafe letter position.
//
// Consumed by scripts/apply-option-rewrites.mjs (run centrally by a human —
// do not run it from here).

export default {
  51: {
    options: [
      "It emits a custom \"active\" event whenever the host element is clicked by the user",
      "It toggles the \"active\" class on the host element to match the isActive field",
      "It binds the host element's class attribute as a read-only string value",
      "It is equivalent to putting [class]=\"isActive\" on a child element",
    ],
    answer: 1,
    explanation: `\`@HostBinding("class.active")\` binds a class on the directive's own host element — the element the directive selector matches. When \`isActive\` is true the class is added; false removes it. This is the declarative alternative to \`renderer.addClass(el, "active")\`. Emitting a custom "active" event on click describes @Output/EventEmitter, a different mechanism entirely — for emitting events, not toggling classes. Binding the class attribute as a read-only string is wrong — the binding is not read-only, it reacts live to isActive changes. Treating this as equivalent to putting [class]="isActive" on a child element is also wrong — @HostBinding targets the host itself, not a child element.`,
  },

  52: {
    options: [
      "@ContentChild returns just the first match; @ContentChildren returns a QueryList",
      "@ContentChild is for components while @ContentChildren is only for directives",
      "@ContentChildren resolves asynchronously; @ContentChild resolves synchronously",
      "They are identical — @ContentChildren is merely the plural alias of the other",
    ],
    answer: 0,
    explanation: `\`@ContentChild\` returns the first projected element matching the selector (or undefined). \`@ContentChildren\` returns a live \`QueryList<T>\` of ALL matching projected elements, which updates when content changes. The claim that @ContentChild is for components while @ContentChildren is only for directives is wrong — both work with components and directives alike. The claim that @ContentChildren resolves asynchronously while @ContentChild resolves synchronously is wrong — both are synchronous once content is initialised. Treating them as identical, with @ContentChildren just a plural alias, is wrong — they behave differently for multiple matches (single result vs a full QueryList).`,
  },

  53: {
    options: [
      "ngTemplateOutlet must be placed on an <ng-template> element, never on an <ng-container>",
      "The name context variable is never passed — add [ngTemplateOutletContext]",
      "let-name is invalid syntax; you must write let-name=\"name\" with a value",
      "<ng-template> elements are not allowed to contain interpolation bindings",
    ],
    answer: 1,
    explanation: `\`let-name\` declares a local variable bound from the context's \`$implicit\` property, but no context is passed via \`[ngTemplateOutletContext]\`. Without it, \`name\` is \`undefined\` and the paragraph renders "Hello ". Fix: add \`[ngTemplateOutletContext]="{ $implicit: 'World' }"\`. The claim that ngTemplateOutlet must sit on an <ng-template> and never on <ng-container> is wrong — <ng-container> is in fact the correct, idiomatic host for ngTemplateOutlet. The claim that let-name is invalid without an explicit value (let-name="name") is wrong — bare let-name binds $implicit by convention. The claim that <ng-template> elements can't contain interpolation bindings is wrong — templates fully support interpolation.`,
  },

  54: {
    options: [
      "ngAfterViewInit fires first, because the component view renders before content projects",
      "ngAfterContentInit fires first — projected content initializes before the view",
      "They both fire simultaneously in the same change-detection pass",
      "The order depends on whether the component uses OnPush change detection",
    ],
    answer: 1,
    explanation: `Angular's lifecycle order is ngOnInit → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked. Content projection (what goes into \`<ng-content>\`) is resolved before the component's own view is fully initialised. Use \`ngAfterContentInit\` to work with \`@ContentChild\` queries and \`ngAfterViewInit\` for \`@ViewChild\` queries. Claiming ngAfterViewInit fires first, because the view renders before content projects, reverses the actual order. Claiming they fire simultaneously in the same change-detection pass is wrong — they are separate, sequential lifecycle phases. Claiming the order depends on OnPush is wrong — OnPush changes when detection runs, not the fixed lifecycle-hook ordering.`,
  },

  55: {
    options: [
      "<app-card><footer>Save</footer></app-card>",
      "<app-card><span slot=\"footer\">Save</span></app-card>",
      "<app-card><span footer>Save</span></app-card>",
      "<app-card footer=\"Save\"></app-card>",
    ],
    answer: 2,
    explanation: `\`select="[footer]"\` is an attribute CSS selector — it matches any element that has a \`footer\` attribute. So \`<span footer>Save</span>\` matches. Using a <footer> element is wrong — that matches an element tag selector (select="footer"), not the [footer] attribute selector used here. Using slot="footer" is wrong — slot is Web Component/native shadow DOM syntax, not something Angular content projection recognizes. Passing footer="Save" as a host attribute is wrong — that's a binding to the parent component's own footer input/attribute, not projected content at all.`,
  },

  56: {
    options: [
      "<li>1</li><li>2</li><li>3</li>",
      "<li>2</li><li>4</li><li>6</li>",
      "Nothing — ngTemplateOutlet is not supported inside an @for block",
      "<li>NaN</li><li>NaN</li><li>NaN</li>",
    ],
    answer: 1,
    explanation: `Each \`@for\` iteration passes the current item as \`$implicit\` context. Inside the template, \`let-n\` binds to \`$implicit\`, so \`n\` is 1, 2, 3. The expression \`n * 2\` produces 2, 4, 6. Rendering the raw items unchanged (1, 2, 3) is wrong — the template doubles each value via n * 2. Claiming nothing renders because ngTemplateOutlet isn't supported inside @for is wrong — ngTemplateOutlet works fine inside any control-flow block. Getting NaN for each item is wrong — n is a proper number from $implicit, so the multiplication succeeds correctly.`,
  },

  57: {
    options: [
      "createEmbeddedView is older and deprecated — always prefer ngTemplateOutlet",
      "createEmbeddedView is imperative — insert a template from TypeScript at runtime",
      "createEmbeddedView compiles a template string; ngTemplateOutlet needs a fixed one",
      "createEmbeddedView returns a Promise, whereas ngTemplateOutlet is synchronous",
    ],
    answer: 1,
    explanation: `\`createEmbeddedView\` is the imperative API for inserting a \`TemplateRef\` into a \`ViewContainerRef\` from TypeScript. It is the building block that \`*ngIf\` and custom structural directives use under the hood. \`ngTemplateOutlet\` is the declarative template equivalent. Use \`createEmbeddedView\` when the insertion logic must live in a service or factory. Calling createEmbeddedView deprecated in favor of always using ngTemplateOutlet is wrong — both APIs have valid, distinct use cases and neither is deprecated. Claiming createEmbeddedView compiles a template string while ngTemplateOutlet needs a fixed one is wrong — both require an already-compiled TemplateRef, not a raw string. Claiming createEmbeddedView returns a Promise is wrong — both APIs are synchronous.`,
  },

  58: {
    options: [
      "Attribute directives use @Directive while structural ones use @Component",
      "Structural directives add/remove DOM via TemplateRef; attribute ones only restyle it",
      "Attribute directives need a [] selector; structural directives need a * selector",
      "Structural directives can only ever be applied to <ng-template> elements",
    ],
    answer: 1,
    explanation: `Structural directives (like \`*ngIf\`, \`*ngFor\`) receive a \`TemplateRef\` and a \`ViewContainerRef\` and physically add or remove DOM content. The \`*\` prefix is syntactic sugar for \`<ng-template>\`. Attribute directives (\`[highlight]\`, \`[appTooltip]\`) leave the DOM structure intact and only modify the host element's properties, classes, styles, or events. Claiming attribute directives use @Directive while structural ones use @Component is wrong — both kinds are declared with @Directive. Pointing to the [] vs * selector convention describes surface syntax, not the fundamental structural difference — the * is just sugar over <ng-template>, not the underlying mechanism. Claiming structural directives can only ever be applied to <ng-template> elements is wrong — the * syntax lets you apply them to any element, which Angular desugars into an <ng-template> wrapper behind the scenes.`,
  },

  59: {
    options: [
      "ElementRef requires the Renderer2 service before you can ever read its nativeElement",
      "canvas is undefined in ngOnInit — the view is not built yet; use ngAfterViewInit",
      "The template variable name must exactly match the class field name",
      "@ViewChild does not work at all unless you pass { static: true } to it",
    ],
    answer: 1,
    explanation: `\`@ViewChild\` queries are resolved after the component's view is created, which happens AFTER \`ngOnInit\`. In \`ngOnInit\` the canvas is still \`undefined\`, causing a null-reference error. Move DOM access to \`ngAfterViewInit\`. Claiming ElementRef requires Renderer2 before nativeElement can ever be read is wrong — nativeElement is a plain direct property, no Renderer2 involvement needed. Claiming the template variable name must exactly match the class field name is wrong — the @ViewChild selector string "myCanvas" matches the #myCanvas template reference regardless of what the class field itself is called. Claiming @ViewChild doesn't work at all without { static: true } is wrong — { static: true } only matters for making a query available inside ngOnInit for elements not behind *ngIf/@if; without it the query still resolves fine, just later, in ngAfterViewInit.`,
  },

  60: {
    options: [
      "Styles are completely removed — the component then relies only on global CSS rules",
      "Styles go global with no scoping — they leak out and hit other components",
      "Styles use real browser Shadow DOM for complete, native isolation",
      "Each individual style rule is inlined onto the element's style attribute",
    ],
    answer: 1,
    explanation: `\`ViewEncapsulation.None\` adds the component's styles to the global stylesheet without any scoping attributes. Every rule can potentially match elements in other components — a dangerous choice for shared components. Use \`None\` only for global reset or theming components. \`Emulated\` (default) scopes via generated attributes like \`[_ngcontent-abc]\`. \`ShadowDom\` uses native Shadow DOM isolation. Claiming styles are completely removed, leaving the component reliant only on global CSS, is wrong — the component's own styles are still written to the stylesheet, just without scoping. Claiming styles use real browser Shadow DOM for isolation describes ViewEncapsulation.ShadowDom, not None. Claiming each rule gets inlined onto the element's style attribute describes inline styling, not how None encapsulation actually works.`,
  },

  61: {
    options: [
      "It validates the input at runtime, throwing whenever a non-number value is passed",
      "It coerces the bound value to a number, so count=\"5\" arrives as the number 5",
      "It applies a CSS transform to the element whenever the input changes",
      "It makes the input accept only boxed Number objects, never primitives",
    ],
    answer: 1,
    explanation: `\`@Input({ transform: numberAttribute })\` (Angular 16+) pipes the bound value through a transform function before assigning it to the property. Since HTML attributes are always strings, \`count="5"\` arrives as the string \`"5"\` — without the transform. With it, Angular converts \`"5"\` to the number \`5\` automatically. Claiming it validates at runtime and throws on non-number values is wrong — numberAttribute converts the value, it does not validate or throw. Claiming it applies a CSS transform whenever the input changes is wrong — the transform option refers to the input transform function that reshapes the bound value, nothing to do with CSS. Claiming it restricts the input to boxed Number objects rather than primitives is wrong — numberAttribute produces an ordinary primitive number.`,
  },

  62: {
    options: [
      "afterRender runs once; afterNextRender runs after every render cycle",
      "afterNextRender runs once after the next paint; afterRender runs after each render cycle",
      "They are completely identical — afterNextRender is afterRender with { once: true }",
      "afterRender is only for SSR, whereas afterNextRender is browser-only",
    ],
    answer: 1,
    explanation: `\`afterNextRender()\` fires exactly once after the next browser paint — useful for one-time setup like initialising a third-party chart library. \`afterRender()\` fires after every render cycle for the component's lifetime — useful for work that must react to every DOM update (e.g., measuring element dimensions after each layout change). Both run in the browser only (not SSR). Claiming afterRender runs once while afterNextRender runs after every cycle reverses the actual behavior of the two APIs. Claiming they are completely identical, with afterNextRender just afterRender plus { once: true }, is wrong — they are distinct APIs with their own semantics. Claiming afterRender is SSR-only while afterNextRender is browser-only is wrong — both run in the browser only, neither executes during SSR.`,
  },

  63: {
    options: [
      "Method calls inside templates are forbidden outright in Angular 17+",
      "Angular re-runs getUser() on every change-detection cycle — wasteful and risky",
      "Method calls in a template silently bypass OnPush change detection",
      "Template expressions are only ever allowed to read properties, never call methods",
    ],
    answer: 1,
    explanation: `Angular re-evaluates every template expression on each change detection cycle. A method called in a template runs every cycle — if it is expensive (filtering a large array) or returns a new object each call, it wastes CPU and can cause infinite detection loops. The fix: use a computed signal, a \`get\` accessor with memoisation, or the \`async\` pipe. Claiming method calls inside templates are forbidden outright in Angular 17+ is wrong — such calls are allowed, just potentially wasteful. Claiming method calls silently bypass OnPush change detection is wrong — whenever OnPush does run a detection pass, it still invokes template methods normally; OnPush only reduces how often detection runs, it doesn't skip method calls within a run. Claiming template expressions can only read properties and never call methods is wrong — method calls are valid template expressions.`,
  },

  64: {
    options: [
      "It attaches a click event listener onto the component's first child element instead",
      "It is the metadata form of @HostListener — a click listener on the host element",
      "It stops click events from reaching any of the child elements",
      "It overrides the browser's default click behavior for the component",
    ],
    answer: 1,
    explanation: `The \`host\` metadata object supports event bindings like \`"(click)": "handler($event)"\` and property bindings like \`"[class.active]": "isActive"\`. This is the metadata equivalent of \`@HostListener\` and \`@HostBinding\`. Both approaches produce identical results. Claiming it attaches the listener to the component's first child element is wrong — the host metadata binding targets the host element itself, not a child. Claiming it stops click events from reaching child elements is wrong — it doesn't affect event propagation to children at all. Claiming it overrides the browser's default click behavior is wrong — that requires calling event.preventDefault() inside the handler; the host binding alone doesn't do this.`,
  },

  65: {
    options: [
      "It lets several components share a single template by all declaring one parent directive",
      "It attaches reusable directives to a component's host, composing behavior without subclassing",
      "It lets one directive apply to many element types via multiple host selectors",
      "It overrides a parent component's directive without creating a subclass",
    ],
    answer: 1,
    explanation: `\`hostDirectives: [CdkDrag, { directive: TooltipDir, inputs: ["text: tip"] }]\` attaches these directive behaviours to the component at the framework level — the component class has no reference to them. This is composition over inheritance: mix orthogonal behaviours (drag, tooltip, focustrap) on any component without creating deep class hierarchies. Inputs and outputs can be selectively forwarded to the host. Describing it as letting several components share a single template via one parent directive is wrong — hostDirectives has nothing to do with template sharing; it's about attaching behavior to a single host. Describing it as letting one directive apply to many element types via multiple host selectors is wrong — that describes broadening a directive's own selector, not composing several different directives onto a host. Describing it as overriding a parent component's directive without subclassing is wrong — hostDirectives doesn't override anything or relate to a parent/child inheritance chain; it purely composes independent directive behaviors onto the declaring component.`,
  },

  151: {
    options: [
      "A type-safe DI key for non-class values such as config objects, avoiding the \"magic string\" anti-pattern",
      "A decorator that marks a class as injectable into the DI system",
      "A guard that prevents more than one instance of a service being created",
      "A helper used to inject primitive values such as numbers directly into your templates",
    ],
    answer: 0,
    explanation: `\`InjectionToken<T>\` creates a unique DI token for values that are not classes — configuration objects, string constants, feature flags. Example: \`const API_URL = new InjectionToken<string>("apiUrl")\` then \`provide: API_URL, useValue: "https://..."\`. Inject it with \`inject(API_URL)\`. Describing it as a decorator marking a class as injectable is wrong — that's what @Injectable does, not InjectionToken. Describing it as a guard preventing more than one instance of a service is wrong — InjectionToken has no singleton-enforcement behavior; providers, not the token, control instantiation. Describing it as a helper for injecting primitive values directly into templates is wrong — InjectionToken is a DI key used in providers and constructors/inject(), it has no template-level role.`,
  },

  152: {
    options: [
      "@Input() is deprecated — you should always use input() in Angular 17+",
      "input() returns a Signal read as this.name(); @Input() is a plain property",
      "input() can only accept string values, whereas @Input() accepts any type",
      "They are identical — input() is just syntactic sugar over the @Input() decorator",
    ],
    answer: 1,
    explanation: `\`readonly name = input<string>()\` creates a signal-based input — access the value with \`this.name()\`. \`@Input() name!: string\` stores the value as a plain property. Signal inputs participate in the reactive graph, making computed() and effect() that read them automatically reactive. @Input() is still fully supported and not deprecated. Claiming @Input() is deprecated and that input() must always be used in Angular 17+ is wrong — @Input() remains fully supported; input() is an additional API, not a mandated replacement. Claiming input() only accepts string values while @Input() accepts any type is wrong — signal inputs are generic (input<T>()) and accept any type just like @Input(). Claiming they are identical, with input() merely sugar over the decorator, is wrong — they have meaningfully different behaviour: one is a signal integrated into the reactive graph, the other a plain property updated imperatively.`,
  },

  154: {
    options: [
      "setInterval is simply not allowed to be used inside an Angular component",
      "The interval is never cleared, so it keeps firing after the view is destroyed",
      "count++ is a mutation that OnPush change detection is unable to detect",
      "ngOnInit runs before the component is in the DOM, so setInterval does nothing",
    ],
    answer: 1,
    explanation: `\`setInterval\` continues to fire after the component is destroyed because no \`clearInterval\` is called in \`ngOnDestroy\`. The callback tries to update \`count\` and may trigger change detection on a destroyed view, causing "ExpressionChangedAfterItHasBeenChecked" or "ViewDestroyedError". Fix: store the handle (\`this.timer = setInterval(...)\`) and call \`clearInterval(this.timer)\` in \`ngOnDestroy()\`. Claiming setInterval simply isn't allowed inside an Angular component is wrong — setInterval is a standard browser API that works fine in any Angular component; the bug here is failing to clear it, not using it at all. Claiming count++ is a mutation OnPush can't detect is a red herring — this component doesn't even use OnPush (it's on the default strategy), and the leak is about the timer outliving the destroyed component, not about detecting the mutation. Claiming ngOnInit runs before the component is in the DOM, so setInterval does nothing, is wrong — ngOnInit runs after the component initializes and setInterval executes normally, which is exactly why the leak occurs.`,
  },

  161: {
    options: [
      "A real DOM element that groups styles without affecting the page layout",
      "A virtual element that renders no DOM node — host structural directives on it",
      "A projection slot element — the direct equivalent of <slot> in Web Components",
      "A wrapper that switches off Angular change detection for all of its children",
    ],
    answer: 1,
    explanation: `\`<ng-container>\` is Angular's virtual element — it disappears from the rendered DOM. Use it when you need to apply \`@if\`, \`@for\`, or a directive but adding a \`<div>\` or \`<span>\` would break CSS layout (flexbox/grid children, table rows, etc.). Also used to group elements for \`ngTemplateOutlet\`. Calling it a real DOM element that groups styles without affecting layout is wrong — ng-container renders no DOM node at all, so there's no element present to hold styles. Calling it a projection slot equivalent to <slot> in Web Components is wrong — that role belongs to ng-content, not ng-container. Calling it a wrapper that switches off change detection for its children is wrong — ng-container has no effect on change detection whatsoever.`,
  },

  166: {
    options: [
      "ShadowDom uses native browser Shadow DOM; Emulated fakes scoping with generated attributes",
      "ShadowDom stops all event bubbling from escaping out of the component",
      "ShadowDom is faster mainly because it skips Angular's entire style-compilation step",
      "Emulated uses inline styles while ShadowDom uses linked stylesheets",
    ],
    answer: 0,
    explanation: `\`ViewEncapsulation.ShadowDom\` attaches a real Shadow DOM to the host element — native browser isolation, styles truly cannot leak in or out, and \`::ng-deep\` does not work through it. \`Emulated\` (default) simulates scoping by adding \`[_ngcontent-xxx]\` attributes without using Shadow DOM, meaning \`::ng-deep\` can still penetrate it and styles apply to dynamically created content more reliably. Claiming ShadowDom stops all event bubbling from escaping the component is wrong — ShadowDom doesn't change event propagation; custom events can still cross the boundary using composed: true, and native DOM events bubble normally within it. Claiming ShadowDom is faster mainly because it skips Angular's style-compilation step is wrong — Angular still processes and scopes the component's styles for ShadowDom, it just delivers them via the native shadow root instead of generated attributes; any performance difference doesn't come from skipping compilation. Claiming Emulated uses inline styles while ShadowDom uses linked stylesheets is wrong — Emulated scopes styles by injecting a stylesheet with generated attribute selectors, not inline styles, and ShadowDom encapsulates styles within the shadow root rather than via a separate linked stylesheet.`,
  },

  175: {
    options: [
      "It strips Zone.js out of the bundle and relies only on manual markForCheck() calls everywhere",
      "It drops Zone.js patching; components must use signals, async pipe, or markForCheck",
      "It is equivalent to running Angular in strict mode, with no performance gain",
      "It enables Web Workers to run every change-detection cycle off the main thread",
    ],
    answer: 1,
    explanation: `\`provideExperimentalZonelessChangeDetection()\` replaces Zone.js-based automatic change detection. Without Zone.js patching \`setTimeout\`, \`addEventListener\`, etc., Angular only knows about changes through signals, async pipe emissions, or \`markForCheck()\`. Benefits: smaller bundle (Zone.js removed), faster change detection, better SSR compatibility. The whole app must be signal-aware — any class property mutation will NOT be detected. The description that it strips Zone.js and relies only on manual markForCheck() calls everywhere is partially right but incomplete — Zone.js is indeed dropped, but signals and the async pipe also drive change detection automatically, so manual markForCheck() isn't the only mechanism. Claiming it's equivalent to strict mode with no performance gain is wrong — it's an entirely different feature from strict mode, and it does bring real performance benefits (smaller bundle, less overhead from Zone-based detection). Claiming it enables Web Workers to run every change-detection cycle off the main thread is wrong — zoneless change detection is about removing Zone.js patching, not about offloading detection to workers.`,
  },

  183: {
    options: [
      "static: true resolves in ngOnInit; static: false resolves in ngAfterViewInit",
      "static: true caches the query result, while static: false re-runs it on every cycle",
      "They control whether the parent is allowed to modify the child component",
      "static: true is the default; static: false is only for dynamic components",
    ],
    answer: 0,
    explanation: `\`static: true\` resolves the query once BEFORE change detection runs, making it available in \`ngOnInit\`. Only use \`static: true\` for elements that always exist in the template (not inside structural directives like \`@if\`/\`@for\`). \`static: false\` (default) resolves after change detection, available in \`ngAfterViewInit\`, and correctly handles conditionally rendered elements. With the modern signal \`viewChild()\` API, the distinction is handled automatically. Claiming static: true caches the query result while static: false re-runs it every cycle is wrong — static merely controls the timing of the first resolution, it isn't about caching versus re-querying on every cycle. Claiming they control whether the parent is allowed to modify the child component is wrong — the static option has nothing to do with parent/child mutation permissions, only with query resolution timing. Claiming static: true is the default is wrong — static: false is actually the default in modern Angular, since it correctly handles content that may be conditionally rendered.`,
  },

  186: {
    options: [
      "viewChild() queries the component's own template; contentChild() queries projection",
      "contentChild() is only for CSS selectors, while viewChild() is for component or directive types",
      "viewChild() is signal-based while contentChild() returns a plain reference",
      "They are identical — contentChild is just an alias for viewChild in Angular 17+",
    ],
    answer: 0,
    explanation: `\`viewChild(MyComponent)\` queries within the component's own template. \`contentChild(MyComponent)\` queries content that was projected from OUTSIDE via \`<ng-content>\`. Example: a tab panel component uses \`contentChild\` to find tab headers that parents project in. Both return signals — \`viewChild()\` resolves to \`Signal<MyComponent | undefined>\`. Claiming contentChild() only accepts CSS selectors while viewChild() only accepts component/directive types is wrong — both accept the same kinds of locators (component type, directive type, or string selector). Claiming viewChild() is signal-based while contentChild() returns a plain reference is wrong — both are signal-based APIs, returning a Signal that resolves to the match or undefined. Claiming they are identical, with contentChild just an alias for viewChild, is wrong — they query fundamentally different things: the component's own template versus content projected in from outside.`,
  },

  188: {
    options: [
      "inject() bypasses Angular DI entirely and directly instantiates the service",
      "inject(Token) resolves a dependency from the current injection context, no constructor needed",
      "inject() only works for services, whereas constructor injection works for any token",
      "inject() is slower than constructor injection because it looks the token up each time",
    ],
    answer: 1,
    explanation: `\`const router = inject(Router)\` in a class property initializer, a \`CanActivateFn\` guard, or a factory function resolves the dependency from the nearest injector. This is more flexible than constructor injection — you can compose DI usage in standalone functions. Both approaches use the same DI hierarchy. Claiming inject() bypasses Angular DI entirely and directly instantiates the service is wrong — inject() fully participates in the standard DI resolution process, it's just a different call-site mechanism than constructor injection. Claiming inject() only works for services while constructor injection works for any token is wrong — both mechanisms can resolve any DI token, including InjectionTokens and non-service classes. Claiming inject() is slower because it looks the token up each time is wrong — both use the same underlying injector resolution, with no meaningful performance difference.`,
  },

  191: {
    options: [
      "ngOnChanges fires whenever any signal used by the component changes value",
      "ngOnChanges fires on @Input() changes with a SimpleChanges object — not for input()",
      "ngOnChanges fires exactly once, after every other lifecycle hook has completed",
      "ngOnChanges entirely replaces ngOnInit whenever the component declares @Input() bindings",
    ],
    answer: 1,
    explanation: `\`ngOnChanges(changes: SimpleChanges)\` fires before \`ngOnInit\` and before each change detection cycle when @Input properties change. It gives you previous/current values and whether it is the first change. With signal inputs (\`input()\`), Angular's signal graph handles reactivity — compute values in \`computed()\` or react in \`effect()\` instead of \`ngOnChanges\`. The lifecycle hook is not called for signal inputs. Claiming ngOnChanges fires whenever any signal used by the component changes value is wrong — ngOnChanges is tied to decorator-based @Input() property changes, not to arbitrary signal reads or writes. Claiming it fires exactly once, after every other lifecycle hook has completed, is wrong — it actually fires before ngOnInit and again before every subsequent change-detection cycle in which an @Input property changes, so it can run many times, not once at the end. Claiming it entirely replaces ngOnInit whenever @Input() bindings are declared is wrong — ngOnChanges and ngOnInit are independent hooks that both run; declaring inputs doesn't remove ngOnInit from the lifecycle.`,
  },

  193: {
    options: [
      "[className]=\"isActive ? 'active' : ''\" with manual empty-string handling",
      "[class.active]=\"isActive\" toggles the class from the isActive value",
      "ngClass=\"{{ isActive }}\"",
      "style.className=\"active\"",
    ],
    answer: 1,
    explanation: `\`[class.className]="expression"\` is the idiomatic Angular single-class binding. For multiple conditional classes: \`[ngClass]="{ active: isActive, disabled: isDisabled }"\` or \`[class]="{ active: isActive }"\`. Using [className]="isActive ? 'active' : ''" does technically work but is clunky, requiring manual empty-string handling for the false case instead of a clean toggle. Writing ngClass="{{ isActive }}" is wrong syntax — ngClass needs a property binding ([ngClass]=...) with an object/array/string expression, not interpolation into a plain attribute. Writing style.className="active" is wrong — the style. binding prefix is for CSS properties (like style.color), not for setting class names.`,
  },

  200: {
    options: [
      "@let creates a template variable that, unlike a #ref, you can later reassign",
      "@let binds a computed expression to a local, reusable name, evaluated once per template",
      "@let imports an external variable from the component class into the template",
      "@let is the template form of TypeScript let, replacing @const for mutable values",
    ],
    answer: 1,
    explanation: `\`@let name = expression\` (Angular 18+) evaluates the expression once and binds the result to a local name within the template scope. It solves the "double pipe" problem: instead of writing \`(user$ | async)?.name\` and \`(user$ | async)?.email\` (two subscriptions), write \`@let user = user$ | async\` once and reference \`user.name\`, \`user.email\`. Works with any expression — signal calls, pipe chains, method calls. Framing @let as a variable you can later reassign, unlike a #ref, is wrong — @let's value is derived from its expression each time the template is checked, it isn't an assignable variable, and the real distinction from a #ref is that #ref points to a DOM element or directive instance while @let is a computed local binding. Claiming @let imports an external variable from the component class into the template is wrong — @let evaluates a template expression and binds its result locally, it doesn't import anything from the class. Claiming @let is the template form of TypeScript's let, replacing a nonexistent @const for mutable values, is wrong — there is no @const directive being replaced, and @let's purpose is avoiding repeated evaluation of an expression, not general-purpose mutable state.`,
  },

  275: {
    options: [
      "Nothing — Angular automatically deduplicates the embedded views for you",
      "Each change creates another view without clearing — the content duplicates",
      "TemplateRef simply cannot be injected into a structural directive",
      "The setTimeout is a memory leak that crashes the entire application almost immediately",
    ],
    answer: 1,
    explanation: `\`ViewContainerRef\` is additive — every \`createEmbeddedView\` appends another instance of the template. Because the setter never clears the container (or cancels the previous \`setTimeout\`), each change to \`appDelay\` stacks a fresh copy of the content. A correct version clears first: \`this.vcr.clear(); this.timer = setTimeout(() => this.vcr.createEmbeddedView(this.tpl), ms);\` and clears \`this.timer\` in \`ngOnDestroy\`. Claiming Angular automatically deduplicates embedded views is wrong — there is no automatic dedup; ViewContainerRef only ever appends. Claiming TemplateRef simply cannot be injected into a structural directive is wrong — injecting TemplateRef and ViewContainerRef via the constructor is exactly the standard mechanism structural directives are built on. Claiming the setTimeout is a memory leak that crashes the app almost immediately overstates the bug — the real defect is stacking duplicate views over repeated changes, not an instant crash.`,
  },
};
