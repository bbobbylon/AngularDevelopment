/**
 * Glossary / cheat-sheet data — a curated A-Z reference of Angular and
 * TypeScript terms used across the curriculum. `topicPath`, when present,
 * must be a real curriculum lesson id (see `curriculum.ts`) — the same
 * convention `practice-data.ts` uses for `topicPath`, enforced there by a
 * spec that fails the build on a dead link. Keep that convention here too.
 */
export interface GlossaryTerm {
  term: string;
  definition: string;
  topicPath?: string;
}

/**
 * Every glossary entry, kept in A-Z order by first letter so the file stays
 * navigable by hand — the page re-sorts and buckets them itself, so the exact
 * within-letter order here does not affect rendering.
 *
 * A spec enforces the grouping, the absence of duplicates, and that every
 * `topicPath` resolves to a real lesson.
 *
 * @see glossary-data.spec.ts
 */
export const GLOSSARY: GlossaryTerm[] = [
  { term: 'a11y', definition: 'Shorthand for "accessibility" (11 letters between the "a" and the "y"). Building UIs usable with a keyboard, screen reader, or other assistive technology.', topicPath: 'a11y' },
  { term: 'Async pipe', definition: 'A built-in pipe (`| async`) that subscribes to an Observable or Promise in the template and auto-unsubscribes when the component is destroyed — no manual subscription management needed.', topicPath: 'rxjs-observables' },
  { term: 'Async validator', definition: 'A form validator that returns a Promise or Observable instead of a synchronous result, used for checks that require a server round-trip (e.g. "is this username taken?").', topicPath: 'async-validators' },
  { term: 'Attribute directive', definition: 'A directive that changes the appearance or behavior of an existing element without adding or removing elements from the DOM, e.g. `NgClass` or a custom `appHighlight`.', topicPath: 'attribute-directives' },
  { term: 'Barrel file', definition: 'An `index.ts` that re-exports everything from a folder so consumers import from one path. Convenient, but can hurt tree-shaking and lazy-loading boundaries if overused.' },
  { term: 'Change detection', definition: 'Angular\'s process of walking the component tree and re-checking bindings to sync the view with the model. Triggered by events, timers, XHR/fetch, and signal writes.', topicPath: 'change-detection' },
  { term: 'CanActivate / CanMatch', definition: 'Route guard function types. `CanActivate` decides whether a route may be entered; `CanMatch` decides whether a route configuration matches at all (useful for feature-flagging entire route trees).', topicPath: 'route-guards' },
  { term: 'Class binding', definition: 'Template syntax (`[class.foo]="cond"`) that toggles a single CSS class based on an expression, without touching the rest of the `class` attribute.', topicPath: 'class-style-binding' },
  { term: 'CLI (Angular CLI)', definition: 'The `ng` command-line tool for scaffolding, building, testing and serving Angular projects (`ng new`, `ng generate`, `ng build`, `ng serve`).', topicPath: 'cli-project-structure' },
  { term: 'Computed signal', definition: 'A signal (`computed(() => ...)`) whose value is derived from other signals. Recalculates lazily and only when a dependency actually changes.', topicPath: 'signals' },
  { term: 'Content projection', definition: 'Passing markup into a component from its usage site via `<ng-content>`, so the component wraps caller-supplied content instead of only rendering its own template.', topicPath: 'content-projection' },
  { term: 'Control flow (@if/@for/@switch)', definition: 'Angular\'s built-in template control-flow syntax (replacing `*ngIf`/`*ngFor`/`*ngSwitch`), compiled directly rather than through structural directives — faster and requires no imports.', topicPath: 'control-flow-if' },
  { term: 'ControlValueAccessor', definition: 'The interface a custom component implements to plug into Angular forms (`formControl`/`ngModel`) as if it were a native input — bridges the form API and a custom UI.', topicPath: 'control-value-accessor' },
  { term: 'CSP (Content Security Policy)', definition: 'An HTTP header that restricts what scripts/styles/resources a page may load, mitigating XSS. Angular\'s `ngCspNonce` attribute cooperates with a strict CSP.', topicPath: 'security' },
  { term: 'DI (Dependency Injection)', definition: 'A design pattern where a class declares what it needs (via constructor or `inject()`) and a framework-managed injector supplies it, rather than the class constructing its own dependencies.', topicPath: 'services-di' },
  { term: 'Deferrable views (@defer)', definition: 'Template syntax that splits part of a component into a separate lazy-loaded chunk, fetched only when a trigger condition (viewport, interaction, idle, timer, custom signal) is met.', topicPath: 'deferrable-views' },
  { term: 'Directive', definition: 'A class that attaches behavior to a DOM element. Components are directives with a template; attribute and structural directives have no template of their own.', topicPath: 'builtin-directives' },
  { term: 'Effect (signals)', definition: 'A function (`effect(() => ...)`) that re-runs automatically whenever a signal it reads changes — used for side effects like syncing to localStorage or the DOM, never for deriving values (use `computed` for that).', topicPath: 'signals' },
  { term: 'Enum', definition: 'A TypeScript construct naming a fixed set of related constants (`enum Status { Active, Done }`). Compiles to a real JS object unless declared `const enum`.', topicPath: 'ts-enums' },
  { term: 'Event binding', definition: 'Template syntax (`(click)="onClick()"`) that wires a DOM or custom `@Output()` event to a component method.', topicPath: 'event-binding' },
  { term: 'Generics', definition: 'TypeScript type parameters (`function identity<T>(x: T): T`) that let a function, class or interface work over a variety of types while preserving type information at each call site.', topicPath: 'ts-generics' },
  { term: 'Guard (route)', definition: 'A function run before router navigation completes (`CanActivate`, `CanDeactivate`, `CanMatch`) that can allow, redirect, or block the navigation.', topicPath: 'route-guards' },
  { term: 'Host directive', definition: 'A mechanism (`hostDirectives` metadata) for composing a directive\'s behavior into a component or another directive without inheritance — the modern alternative to subclassing directives.', topicPath: 'host-directives' },
  { term: 'Hydration', definition: 'The client-side process of attaching event listeners and reconciling with server-rendered DOM instead of re-rendering it from scratch, avoiding SSR-then-flicker.', topicPath: 'hydration' },
  { term: 'Injection token (InjectionToken)', definition: 'A unique, type-safe key for providing/injecting values (config objects, primitives) that aren\'t classes, so they can\'t be looked up by a class reference.', topicPath: 'di-providers' },
  { term: 'Input()', definition: 'Marks a component/directive property as bindable from a parent template (`[value]="x"`). The modern `input()` signal function replaces the `@Input()` decorator.', topicPath: 'inputs' },
  { term: 'Interceptor (HTTP)', definition: 'A function that sits in the `HttpClient` request/response pipeline — used for attaching auth headers, logging, retrying, or transforming every outgoing request/incoming response.', topicPath: 'http-interceptors' },
  { term: 'Interface (TS)', definition: 'A TypeScript construct describing the shape of an object — property names and types — checked only at compile time; it produces no runtime code.', topicPath: 'ts-interfaces' },
  { term: 'Intersection type', definition: 'A TypeScript type combining several types into one with `&`, requiring a value to satisfy all of them simultaneously (as opposed to `|`, which requires just one).', topicPath: 'ts-utility-types' },
  { term: 'Keyof', definition: 'A TypeScript operator producing a union of an object type\'s property-name literals (`keyof Foo`), commonly used to constrain a "which property" parameter.', topicPath: 'ts-keyof-typeof' },
  { term: 'Lazy loading', definition: 'Deferring the download of a route\'s or block\'s JavaScript until it\'s actually needed, shrinking the initial bundle. Done at the route level with `loadChildren`/`loadComponent`, or in-template with `@defer`.', topicPath: 'router-children-lazy' },
  { term: 'Lifecycle hook', definition: 'Methods like `ngOnInit`, `ngOnChanges`, `ngOnDestroy` that Angular calls at specific points in a component\'s life — creation, input changes, destruction.', topicPath: 'lifecycle' },
  { term: 'linkedSignal', definition: 'A signal that resets to a computed default whenever its source changes, but can also be written to directly afterward — useful for "selection follows data, but the user can override it" state.', topicPath: 'signals-advanced' },
  { term: 'Mapped type', definition: 'A TypeScript type built by transforming every property of another type (`{ [K in keyof T]: ... }`), the mechanism behind `Partial<T>`, `Readonly<T>`, `Pick<T, K>`, etc.', topicPath: 'ts-mapped-conditional' },
  { term: 'ngOnDestroy', definition: 'The lifecycle hook called just before Angular destroys a component/directive — the place to unsubscribe, clear timers, and release other resources not already handled by `takeUntilDestroyed`.', topicPath: 'lifecycle' },
  { term: 'NgModule', definition: 'A `@NgModule`-decorated class that groups declarations, imports, exports and providers into a compilation/DI unit. Superseded by standalone components as the default, but still common in existing code and on the exam.', topicPath: 'ngmodules' },
  { term: 'Narrowing', definition: 'TypeScript refining a variable\'s type within a branch based on a runtime check (`typeof`, `instanceof`, a discriminant property), so a union type is treated as its specific member inside that branch.', topicPath: 'ts-narrowing' },
  { term: 'Observable', definition: 'An RxJS primitive representing a stream of values delivered over time to subscribers. Lazy (does nothing until subscribed) and cancellable (via unsubscribe).', topicPath: 'rxjs-observables' },
  { term: 'OnPush (change detection strategy)', definition: 'A component-level setting that skips re-checking a component unless an `@Input()` reference changes, an event originates inside it, or an `async`-piped/signal source emits — the performance-critical default to reach for.', topicPath: 'onpush' },
  { term: 'Operator (RxJS)', definition: 'A pure function (`map`, `filter`, `switchMap`, ...) that takes an Observable and returns a new transformed Observable, composed together with `.pipe()`.', topicPath: 'rxjs-operators' },
  { term: 'Output()', definition: 'Marks a component/directive property as an event source a parent can bind to with `(event)="handler($event)"`. Backed by an `EventEmitter` (decorator API) or the `output()` function (signal API).', topicPath: 'outputs' },
  { term: 'Pipe', definition: 'A template-transform function (`{{ value | pipeName }}`) for formatting displayed data — built-in (`date`, `currency`, `async`) or custom, optionally `pure` for automatic memoization.', topicPath: 'pipes' },
  { term: 'Provider', definition: 'A recipe telling Angular\'s injector how to create a value for a given token — `useClass`, `useValue`, `useFactory`, or `useExisting`.', topicPath: 'di-providers' },
  { term: 'PWA (Progressive Web App)', definition: 'A web app that behaves like a native app via a service worker (offline caching, background sync) and a manifest (installable, home-screen icon).', topicPath: 'pwa-service-worker' },
  { term: 'Resolver (route)', definition: 'A function that pre-fetches data before a route activates, so the component starts with data already available instead of loading state.', topicPath: 'resolvers' },
  { term: 'resource() / rxResource()', definition: 'Signal-based APIs for async data fetching that expose `value`, `status`, `error` signals and automatically re-fetch when their reactive `params`/`request` change.', topicPath: 'resource-api' },
  { term: 'Router outlet', definition: 'The `<router-outlet>` template marker where the router renders the component matching the current URL.', topicPath: 'routing-basics' },
  { term: 'RxJS Subject', definition: 'An Observable that is also an Observer — you can call `.next()` on it manually to push values, making it a multicast bridge between imperative code and reactive streams.', topicPath: 'rxjs-subjects' },
  { term: 'Selector (component)', definition: 'The CSS-style string (`app-foo`, `[appFoo]`, `.foo`) that tells Angular where in a template a component or directive should be instantiated.' },
  { term: 'Service worker', definition: 'A background script the browser runs independent of any page, used by Angular\'s PWA support to cache assets and serve them offline.', topicPath: 'pwa-service-worker' },
  { term: 'Signal', definition: 'A reactive primitive (`signal(initialValue)`) holding a value that notifies readers exactly when it changes — the foundation of Angular\'s newer, zoneless-friendly reactivity model.', topicPath: 'signals' },
  { term: 'Standalone component', definition: 'A component that declares its own template dependencies via an `imports` array and needs no owning `NgModule` — the default since Angular 17 and the style used throughout this curriculum.', topicPath: 'components' },
  { term: 'State management', definition: 'The broader pattern of where and how an app\'s shared, cross-component data lives — anything from a signal-based service to a full store library, chosen by how much coordination the app actually needs.', topicPath: 'state-management' },
  { term: 'Structural directive', definition: 'A directive that adds, removes or repeats DOM elements (`*ngIf`, `*ngFor`, or a custom one using `TemplateRef`/`ViewContainerRef`) — mostly superseded by built-in `@if`/`@for` control flow.', topicPath: 'structural-directives' },
  { term: 'Take Until Destroyed (takeUntilDestroyed)', definition: 'An RxJS interop helper that automatically completes a subscription when the current injection context (usually a component) is destroyed, replacing manual `ngOnDestroy` unsubscribe boilerplate.', topicPath: 'rxjs-interop' },
  { term: 'Template reference variable', definition: 'A local name (`#myInput`) assigned to a DOM element or directive instance within a template, usable elsewhere in that same template.' },
  { term: 'Two-way binding', definition: 'Template syntax (`[(ngModel)]="value"` or a custom `[(prop)]`) that combines a property binding and an event binding into one, keeping a value and a UI control in sync in both directions.', topicPath: 'two-way-binding' },
  { term: 'Type narrowing', definition: 'See "Narrowing" — refining a union type to a more specific member within a conditional branch based on a runtime check.', topicPath: 'ts-narrowing' },
  { term: 'Union type', definition: 'A TypeScript type meaning "one of these" (`string | number`), requiring narrowing before member access specific to just one branch.', topicPath: 'ts-types' },
  { term: 'Utility type', definition: 'Built-in generic TypeScript types (`Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`, ...) that derive a new type from an existing one without hand-writing it.', topicPath: 'ts-utility-types' },
  { term: 'View encapsulation', definition: 'Angular\'s default style-scoping strategy (`Emulated`) that rewrites selectors so a component\'s CSS only applies within its own template, simulating Shadow DOM without requiring it.', topicPath: 'view-encapsulation' },
  { term: 'View query (ViewChild/viewChild)', definition: 'A way for a component to get a reference to a child element, component, or directive instance from its own template, available once the view is initialized.', topicPath: 'view-queries' },
  { term: 'View transitions', definition: 'Browser-native animated transitions between DOM states (the View Transitions API), which the Angular router can trigger automatically on navigation.', topicPath: 'view-transitions' },
  { term: 'Zone.js', definition: 'The library Angular historically used to auto-trigger change detection by monkey-patching async browser APIs (timers, events, XHR) so it would know when "something happened".', topicPath: 'change-detection' },
  { term: 'Zoneless', definition: 'Running Angular without Zone.js, relying instead on signals (and explicit `markForCheck`/`ApplicationRef.tick` where needed) to know when to re-render — smaller bundle, more predictable change detection.', topicPath: 'zoneless' },
];
