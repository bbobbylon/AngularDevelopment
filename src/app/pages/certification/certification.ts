import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LESSON_BY_ID } from '../../core/curriculum';

// ── Exam topic map (study guide) ─────────────────────────────────────────────
interface ExamTopic  { topic: string; lessonIds: string[]; }
interface ExamLevel  { key: string; name: string; format: string; blurb: string; topics: ExamTopic[]; }

const EXAM: ExamLevel[] = [
  {
    key: 'junior', name: 'Junior Angular Developer',
    format: '40 min · 50 multiple-choice questions',
    blurb: 'Core concepts and basic implementations — the language, templates, binding and the building blocks.',
    topics: [
      { topic: 'JavaScript & TypeScript essentials', lessonIds: ['programming-basics','functions-basics','arrays-objects-basics','decisions-loops','async-basics','json-and-apis','ts-types','ts-interfaces','ts-classes','ts-modules','ts-async','ts-nullish'] },
      { topic: 'Angular basics & the CLI',            lessonIds: ['what-is-angular','cli-project-structure'] },
      { topic: 'Components & templates',              lessonIds: ['components','interpolation','lifecycle'] },
      { topic: 'Data binding',                        lessonIds: ['property-binding','event-binding','two-way-binding','class-style-binding'] },
      { topic: 'Directives & control flow',           lessonIds: ['control-flow-if','control-flow-for','control-flow-switch','let-block','builtin-directives'] },
      { topic: 'Pipes',                               lessonIds: ['pipes'] },
      { topic: 'Component communication',             lessonIds: ['inputs','outputs'] },
      { topic: 'Services & dependency injection',     lessonIds: ['services-di'] },
      { topic: 'NgModules',                           lessonIds: ['ngmodules'] },
      { topic: 'Signals (basics)',                    lessonIds: ['signals'] },
      { topic: 'Routing (basics)',                    lessonIds: ['routing-basics'] },
      { topic: 'HTTP (basics)',                       lessonIds: ['http-basics'] },
      { topic: 'Template-driven forms',               lessonIds: ['template-forms'] },
    ],
  },
  {
    key: 'mid', name: 'Mid-Level Angular Developer',
    format: '135 min · 40 questions + 105 min coding tasks',
    blurb: 'Advanced concepts and real-world applications — RxJS, advanced forms & routing, custom directives, DI, testing and change detection.',
    topics: [
      { topic: 'Advanced TypeScript',              lessonIds: ['ts-generics','ts-enums','ts-narrowing','ts-utility-types','ts-keyof-typeof','ts-decorators'] },
      { topic: 'Reactive forms & validation',      lessonIds: ['reactive-forms','form-validation','async-validators','form-arrays'] },
      { topic: 'Advanced routing',                 lessonIds: ['router-children-lazy','route-guards','resolvers','route-params'] },
      { topic: 'HTTP in depth',                    lessonIds: ['http-crud','http-interceptors'] },
      { topic: 'RxJS',                             lessonIds: ['rxjs-observables','rxjs-operators','rxjs-subjects','rxjs-interop'] },
      { topic: 'Custom directives & pipes',        lessonIds: ['custom-pipes','attribute-directives','structural-directives'] },
      { topic: 'Advanced components',              lessonIds: ['content-projection','view-queries','ng-template-outlet'] },
      { topic: 'DI providers in depth',            lessonIds: ['di-providers'] },
      { topic: 'Advanced signals & resources',     lessonIds: ['signals-advanced','resource-api'] },
      { topic: 'Change detection & OnPush',        lessonIds: ['change-detection','onpush'] },
      { topic: 'Testing',                          lessonIds: ['testing-components','testing-services-http'] },
      { topic: 'State management (intro)',         lessonIds: ['state-management'] },
    ],
  },
  {
    key: 'senior', name: 'Senior Angular Developer',
    format: '135 min · 40 questions + 105 min coding tasks',
    blurb: 'Architecture and large-scale applications — performance, rendering, security, advanced DI/RxJS and reusable libraries.',
    topics: [
      { topic: 'Advanced RxJS',                  lessonIds: ['rxjs-advanced'] },
      { topic: 'Advanced type system',           lessonIds: ['ts-mapped-conditional'] },
      { topic: 'Performance & runtime',          lessonIds: ['performance','deferrable-views','after-render','zoneless'] },
      { topic: 'Rendering & delivery',           lessonIds: ['ssr','hydration','pwa-service-worker'] },
      { topic: 'Architecture & patterns',        lessonIds: ['state-management','dynamic-components','host-directives','ngmodules-migration'] },
      { topic: 'Advanced dependency injection',  lessonIds: ['di-advanced'] },
      { topic: 'Custom form controls (CVA)',     lessonIds: ['control-value-accessor'] },
      { topic: 'Cross-cutting concerns',         lessonIds: ['security','i18n','a11y','animations','view-transitions'] },
      { topic: 'Libraries & schematics',         lessonIds: ['libraries-schematics'] },
    ],
  },
];

// ── Exam simulator questions (10 per level) ───────────────────────────────────
interface ExamQ {
  level: 'junior' | 'mid' | 'senior';
  q: string;
  opts: string[];
  answer: number; // 0-indexed
  explanation: string;
}

const EXAM_QS: ExamQ[] = [
  // ──── JUNIOR ────
  {
    level: 'junior',
    q: 'What does standalone: true in @Component mean?',
    opts: [
      'The component can run without Angular installed',
      'The component declares its own dependencies in imports: [] instead of relying on an NgModule',
      'The component is lazy-loaded automatically',
      'The component cannot be used inside an NgModule',
    ],
    answer: 1,
    explanation: 'standalone: true means the component owns its dependency declarations. It imports directives, pipes, and other components directly in its imports: [] array — no NgModule needed. This is the default in Angular 17+.',
  },
  {
    level: 'junior',
    q: 'You have const count = signal(0). Which call correctly increments the value using its current value?',
    opts: [
      'count.next(count() + 1)',
      'count.mutate(c => c + 1)',
      'count.update(c => c + 1)',
      'count.set(count + 1)',
    ],
    answer: 2,
    explanation: 'update(fn) reads the current value, passes it to your function, and sets the result. set(v) replaces with a literal value. mutate() and next() do not exist on writable signals.',
  },
  {
    level: 'junior',
    q: 'Which syntax correctly passes a parent property "title" down to a child component as a property binding?',
    opts: [
      '<app-card title="{{ pageTitle }}">',
      '<app-card [title]="pageTitle">',
      '<app-card title="pageTitle">',
      '<app-card bind-title="{{ pageTitle }}">',
    ],
    answer: 1,
    explanation: 'Square brackets [] create a property binding that evaluates the expression. Without brackets, "pageTitle" is treated as a string literal, not a variable. Interpolation inside an attribute is only valid for native HTML attributes, not component inputs.',
  },
  {
    level: 'junior',
    q: 'A parent template has <app-btn (clicked)="save()">. What must the child component declare?',
    opts: [
      '@Input() clicked: EventEmitter',
      '@Output() clicked = new EventEmitter()',
      'output() named clicked',
      'Either B or C — both are valid in modern Angular',
    ],
    answer: 3,
    explanation: 'Both @Output() with EventEmitter (classic) and output() (modern signal API, Angular 17+) produce an output named "clicked". The parent binds to it with (clicked)="save()" in either case.',
  },
  {
    level: 'junior',
    q: 'What is the critical difference between <a routerLink="/shop"> and <a href="/shop">?',
    opts: [
      'routerLink only works for lazy-loaded routes',
      'routerLink requires the HttpClient to be provided',
      'href causes a full page reload; routerLink performs client-side navigation without reloading',
      'There is no functional difference in a compiled build',
    ],
    answer: 2,
    explanation: 'href="/shop" tells the browser to fetch a new page from the server — Angular is destroyed and restarted. routerLink="/shop" uses Angular Router to swap components in-place, preserving all service singletons and avoiding the network round-trip.',
  },
  {
    level: 'junior',
    q: 'What is the correct modern Angular control flow for conditional rendering?',
    opts: [
      '<div *ngIf="show">Content</div>',
      '@if (show) { <div>Content</div> }',
      '<ng-if [when]="show">Content</ng-if>',
      '{{ show ? "<div>Content</div>" : "" }}',
    ],
    answer: 1,
    explanation: '@if is the built-in control flow syntax introduced in Angular 17. It requires no import, supports @else if / @else chaining, and provides better TypeScript type narrowing. *ngIf still works but @if is the modern standard.',
  },
  {
    level: 'junior',
    q: 'Which lifecycle hook runs exactly once, right after Angular first sets the component\'s inputs?',
    opts: [
      'ngAfterViewInit',
      'ngOnChanges',
      'ngOnInit',
      'constructor',
    ],
    answer: 2,
    explanation: 'ngOnInit runs once after the first ngOnChanges call and before the first render. It is the right place to kick off data loading that depends on @Input() values. The constructor runs before inputs are set.',
  },
  {
    level: 'junior',
    q: 'What is the correct two-way binding syntax with ngModel?',
    opts: [
      '[ngModel]="name"',
      '(ngModel)="name"',
      '[(ngModel)]="name"',
      '{{ngModel}}="name"',
    ],
    answer: 2,
    explanation: '[(ngModel)] is the "banana-in-a-box" syntax — it combines property binding [ngModel] (parent → input) and event binding (ngModelChange) (input → parent) into one shorthand. FormsModule must be imported for ngModel to work.',
  },
  {
    level: 'junior',
    q: 'What does providedIn: "root" in @Injectable mean?',
    opts: [
      'The service is only available to root-level components',
      'Angular creates one singleton instance shared across the entire application',
      'The service is lazy-loaded with the root route',
      'The service must be manually added to AppModule.providers',
    ],
    answer: 1,
    explanation: 'providedIn: "root" registers the service with Angular\'s root injector. One instance is created and reused everywhere the service is injected. This is the default and correct choice for app-wide services like AuthService or ApiService.',
  },
  {
    level: 'junior',
    q: 'You want to display a date as "January 15, 2025" in a template. Which is correct?',
    opts: [
      '{{ date.toLocaleDateString() }}',
      '{{ date | date:"MMMM d, y" }}',
      '{{ formatDate(date) }}',
      '{{ date | "longDate" }}',
    ],
    answer: 1,
    explanation: 'The built-in DatePipe accepts format strings. "MMMM d, y" produces "January 15, 2025". Pipe syntax is value | pipeName:"arg". DatePipe is available automatically in standalone components that import CommonModule or just use it directly.',
  },

  // ──── MID ────
  {
    level: 'mid',
    q: 'What is the key behavioral difference between switchMap and mergeMap?',
    opts: [
      'switchMap handles synchronous Observables; mergeMap handles asynchronous ones',
      'switchMap cancels the previous inner Observable when a new value arrives; mergeMap keeps all concurrent inner Observables running',
      'They behave identically — only the name differs',
      'mergeMap is deprecated in RxJS 7 in favor of switchMap',
    ],
    answer: 1,
    explanation: 'switchMap is "cancel previous" — ideal for typeahead search where stale HTTP requests should be abandoned. mergeMap is "run all in parallel" — ideal for independent parallel operations. concatMap queues; exhaustMap ignores new while one is in flight.',
  },
  {
    level: 'mid',
    q: 'ChangeDetectionStrategy.OnPush re-renders a component when (select all that apply — pick the most complete answer):',
    opts: [
      'Any property in the class changes',
      'An @Input() reference changes, a signal it reads changes, or a DOM event fires inside it',
      'Zone.js detects any async operation anywhere in the app',
      'The developer manually calls markForCheck()',
    ],
    answer: 1,
    explanation: 'OnPush skips the component unless: (1) an @Input() reference changes, (2) a signal the template reads emits a new value, (3) an event handler runs inside the component, or (4) markForCheck()/detectChanges() is called manually. This drastically reduces unnecessary DOM diffing.',
  },
  {
    level: 'mid',
    q: 'A FormGroup.setValue() call throws at runtime. What is the most likely cause?',
    opts: [
      'setValue() is deprecated — use patchValue() instead',
      'setValue() is strict and requires every control in the group to be provided; omitting any key throws an error',
      'FormGroup is read-only after the first render',
      'setValue() requires Observable input',
    ],
    answer: 1,
    explanation: 'setValue() is strict: it throws "Must supply a value for form control with name: X" if any control is omitted. patchValue() is lenient — it only updates the keys you provide and ignores missing ones. Use setValue() for full model replacement; patchValue() for partial updates.',
  },
  {
    level: 'mid',
    q: 'In a functional HTTP interceptor, how do you add an Authorization header without mutating the original request?',
    opts: [
      'req.headers["Authorization"] = "Bearer " + token',
      'return next(req.setHeader("Authorization", token))',
      'return next(req.clone({ headers: req.headers.set("Authorization", "Bearer " + token) }))',
      'req.update(h => h.set("Authorization", token))',
    ],
    answer: 2,
    explanation: 'HttpRequest is immutable. req.clone() creates a new request with the specified overrides. headers.set() returns a new HttpHeaders object (also immutable). The original request is never modified — this is a requirement because interceptors can run in parallel.',
  },
  {
    level: 'mid',
    q: 'When a CanMatchFn returns false, what happens to the navigation, versus CanActivateFn returning false?',
    opts: [
      'Both block navigation and display nothing',
      'CanMatchFn causes the router to skip that route and try the next matching route; CanActivateFn blocks and tries no other routes',
      'CanMatchFn only applies to lazy-loaded routes',
      'CanActivateFn runs before CanMatchFn',
    ],
    answer: 1,
    explanation: 'CanMatchFn returning false makes the router treat this route as non-existent and fall through to the next route definition for the same URL — enabling role-based routing. CanActivateFn returning false blocks the navigation entirely, with no fallback to other routes.',
  },
  {
    level: 'mid',
    q: 'What is the correct distinction between computed() and effect() in Angular signals?',
    opts: [
      'computed() runs side effects; effect() derives values',
      'computed() derives a memoized, lazy value from other signals; effect() runs arbitrary side-effect code when its signal dependencies change',
      'computed() is asynchronous; effect() is synchronous',
      'They are interchangeable — use whichever is more readable',
    ],
    answer: 1,
    explanation: 'computed() is for pure derivation: lazy, memoized, synchronous, returns a Signal<T>. effect() is for side effects (logging, localStorage writes, DOM updates) — it runs after render when dependencies change. Never use effect() to synchronize one signal\'s value to another; use computed() or linkedSignal() instead.',
  },
  {
    level: 'mid',
    q: 'What does @defer (on interaction; prefetch on idle) do?',
    opts: [
      'Renders the component when the browser is idle',
      'Downloads the lazy chunk during browser idle time; renders the component only when the user interacts with the placeholder',
      'Disables the component on slow connections',
      'Inlines the lazy chunk back into the main bundle at build time',
    ],
    answer: 1,
    explanation: '@defer separates "when to prefetch" from "when to render". Prefetch on idle downloads the chunk in the background before the user needs it. On interaction defers rendering until a click or focus event. The result: near-instant render on first interaction with no download latency.',
  },
  {
    level: 'mid',
    q: 'A service is listed in a @Component\'s providers: [MyService] array. What scope does this create?',
    opts: [
      'A root singleton shared with the whole app',
      'A module-scoped singleton shared with the declaring NgModule',
      'A component-scoped instance, one per component instance, destroyed when the component is destroyed',
      'A lazy-loaded singleton, created only when the component first renders',
    ],
    answer: 2,
    explanation: 'Component providers create a new service instance for each component instance (and its view children). When the component is destroyed, so is its scoped service instance. This is ideal for features that need isolated state — for example, an edit form with its own unsaved-changes service.',
  },
  {
    level: 'mid',
    q: 'What does wrapping a test in fakeAsync() allow you to do?',
    opts: [
      'Run the test in a worker thread for better isolation',
      'Control all timer and Promise-based async code synchronously using tick(ms) and flushMicrotasks()',
      'Skip the TestBed.configureTestingModule() setup',
      'Automatically intercept all HTTP requests',
    ],
    answer: 1,
    explanation: 'fakeAsync() patches timer APIs (setTimeout, setInterval) and Promises to run under a virtual clock. tick(500) advances time 500ms instantly; flushMicrotasks() drains all pending Promise callbacks. This makes debounce, retry delays, and async validation fully deterministic in tests.',
  },
  {
    level: 'mid',
    q: 'An async validator is running an HTTP check. What is the control\'s .status while the request is in flight?',
    opts: [
      '"INVALID" — it defaults to invalid until a value is confirmed',
      '"PENDING" — Angular sets this status while an async validator Observable has not completed',
      '"CHECKING" — a special status only present during async validation',
      '"VALID" — status only changes when validation fails',
    ],
    answer: 1,
    explanation: 'Angular sets FormControl.status = "PENDING" while any async validator Observable or Promise is in flight. Check this in templates to show a spinner: @if (ctrl.status === "PENDING") { <span>Checking...</span> }. When the Observable completes, the status resolves to "VALID" or "INVALID".',
  },

  // ──── SENIOR ────
  {
    level: 'senior',
    q: 'How does Angular\'s incremental hydration (19+) differ from full hydration?',
    opts: [
      'Incremental hydration downloads JavaScript files incrementally over a slow connection',
      'Full hydration activates the entire SSR page at once; incremental hydration (via @defer triggers) hydrates each block only when its trigger fires — most components may never hydrate at all',
      'Incremental hydration only works with static pre-rendered routes',
      'They are identical since Angular 18 unified the two approaches',
    ],
    answer: 1,
    explanation: 'Full hydration downloads and parses JavaScript for every component immediately. Incremental hydration defers JavaScript execution per @defer block until the block\'s trigger (viewport, idle, interaction). Components the user never reaches incur zero JS cost, dramatically reducing Time to Interactive on content-heavy pages.',
  },
  {
    level: 'senior',
    q: 'Angular\'s DI throws "Cannot instantiate cyclic dependency!" for ServiceA and ServiceB. What is the best fix?',
    opts: [
      'Use @Inject() decorators on both services',
      'Add providedIn: "any" to both service decorators',
      'Extract the shared logic into a third service, or inject one service lazily inside a method using inject()',
      'Merge both services into a single class',
    ],
    answer: 2,
    explanation: 'A → B → A is a construction deadlock. The cleanest fix is extracting the shared logic into SharedStateService that both A and B depend on. Alternatively, defer one dependency: inject ServiceB lazily inside a method body (not the constructor) using inject(), which resolves past construction time.',
  },
  {
    level: 'senior',
    q: 'What is the primary architectural advantage of Angular\'s Directive Composition API (hostDirectives)?',
    opts: [
      'Host directives speed up initial render by deferring directive setup',
      'Behavior can be composed onto a component declaratively without the component class knowing about it — enabling composition over inheritance',
      'hostDirectives is a performance optimization that merges directive change detection cycles',
      'It provides a way to share templates between components',
    ],
    answer: 1,
    explanation: 'hostDirectives: [CdkDrag, FocusTrapDirective] in @Component attaches these directive behaviors to the component without any class-level coupling. Inputs and outputs can be selectively forwarded. This replaces inheritance and mixin patterns for composable behaviors in design systems.',
  },
  {
    level: 'senior',
    q: 'What does shareReplay(1) do when added to a cold HTTP Observable?',
    opts: [
      'Retries the HTTP request once on failure',
      'Makes the Observable hot and replays the last emission to new subscribers, so multiple subscribers share one HTTP call instead of making duplicates',
      'Caches the response in localStorage for the session',
      'Delays execution by one rendering tick',
    ],
    answer: 1,
    explanation: 'http.get() is cold — each subscribe makes a new request. pipe(shareReplay(1)) converts it to a hot multicasting Observable with a buffer of 1. All current and future subscribers receive the same response without triggering duplicate network requests. Essential for shared data streams (user profile, config).',
  },
  {
    level: 'senior',
    q: 'BroadcastChannel is used in an Angular AuthService to:',
    opts: [
      'Broadcast auth events to the backend API over WebSocket',
      'Synchronize auth state (especially logout) across all browser tabs on the same origin in real time',
      'Replace the JWT HTTP interceptor with a more efficient mechanism',
      'Invalidate server-side sessions automatically',
    ],
    answer: 1,
    explanation: 'Signals live in a single JavaScript context per tab. BroadcastChannel.postMessage("logout") instantly notifies all same-origin tabs. Each tab\'s service listens with channel.onmessage and clears its local auth state. Without this, logout in Tab A is invisible to Tab B until it makes an authenticated request and gets a 401.',
  },
  {
    level: 'senior',
    q: 'What is the fundamental requirement for running an Angular app without Zone.js?',
    opts: [
      'Use OnPush on every component',
      'Every async operation that updates displayed state must flow through Angular\'s reactive primitives: signals, async pipe, or resource()',
      'Replace all Observables with Promises',
      'Manually call detectChanges() after every async operation',
    ],
    answer: 1,
    explanation: 'Zone.js works by monkey-patching async APIs and triggering change detection globally. Without it, Angular cannot know when async operations complete. Every state change must be tracked by signals, async pipe, or resource() so Angular knows exactly which components to re-render and when.',
  },
  {
    level: 'senior',
    q: 'What is InjectionToken<T> used for in Angular\'s DI system?',
    opts: [
      'Creating singleton services with generic type parameters',
      'Injecting non-class values — configuration objects, primitives, factory functions — into the dependency injection tree',
      'A replacement for @Injectable on service classes',
      'Registering services at module scope instead of root scope',
    ],
    answer: 1,
    explanation: 'Classes are their own DI tokens. For non-class values (API base URL string, feature-flag object, factory function), you create a typed token: const API_URL = new InjectionToken<string>("API_URL"). Provide it: { provide: API_URL, useValue: "https://api.example.com" }. Inject it: inject(API_URL).',
  },
  {
    level: 'senior',
    q: 'When must you implement ControlValueAccessor (CVA)?',
    opts: [
      'For every custom component that wraps an HTML input',
      'When building a reusable custom form control that needs to integrate transparently with both Reactive Forms (formControlName) and Template-Driven Forms (ngModel)',
      'When extending FormControl with custom validation logic',
      'When a third-party input component lacks native Angular support',
    ],
    answer: 1,
    explanation: 'CVA is Angular\'s protocol for custom form controls. Implementing it (writeValue, registerOnChange, registerOnTouched, setDisabledState) lets the control work with [formControl]="ctrl", formControlName="x", and [(ngModel)] — exactly as a native <input> would. Without CVA, your component is invisible to Angular\'s form model.',
  },
  {
    level: 'senior',
    q: 'What is the critical security risk of storing a JWT access token in localStorage?',
    opts: [
      'localStorage is too slow for the frequent reads an auth check requires',
      'XSS (Cross-Site Scripting) attacks can call localStorage.getItem() and steal the token; prefer HttpOnly cookies which are inaccessible to JavaScript',
      'Tokens in localStorage expire immediately when the tab is closed',
      'localStorage is not available during Server-Side Rendering',
    ],
    answer: 1,
    explanation: 'Any JavaScript running on your page — including injected scripts from XSS — can read localStorage. An attacker who injects JS steals the token and impersonates the user. HttpOnly cookies are set by the server and cannot be read by JavaScript at all. Access tokens should be in-memory (lost on refresh, XSS-safe) with an HttpOnly refresh token cookie for silent re-auth.',
  },
  {
    level: 'senior',
    q: 'What is the purpose of Nx module boundary rules (project constraints) in an Angular monorepo?',
    opts: [
      'They prevent the TypeScript compiler from optimizing across library boundaries',
      'They enforce architectural rules automatically in CI — for example, preventing feature libraries from importing other feature libraries directly, enforcing a layered architecture without manual PR review',
      'They speed up builds by limiting which files the compiler processes per project',
      'They generate API documentation for each library boundary',
    ],
    answer: 1,
    explanation: 'Nx project constraints in .eslintrc define allowed import directions (feature → data-access → util, never sideways). Breaking a boundary fails the lint step in CI. This makes architectural rules machine-enforced rather than review-enforced — the constraint system replaces "please don\'t import from other features" guidelines.',
  },

  // ──── JUNIOR (continued — 20 additional) ────
  {
    level: 'junior',
    q: 'What is the purpose of the `track` expression in an `@for` loop?',
    opts: [
      'It filters items that should not be rendered',
      'It provides Angular a unique identity for each item so the DOM can be reused when the list changes, instead of destroying and recreating every element',
      'It sorts the array before rendering',
      'It limits the number of items that Angular will render',
    ],
    answer: 1,
    explanation: 'B is correct: `track item.id` (or `track $index`) gives Angular a stable key per item. When the array is updated, Angular can reuse existing DOM nodes for matching keys rather than recreating them — a critical performance optimisation for large lists. A is wrong: filtering is done by the array itself or a computed value, not `track`. C is wrong: `track` does not sort. D is wrong: it does not limit count.',
  },
  {
    level: 'junior',
    q: 'A template has `<input #searchInput>`. How do you read its value from the component class using the new signal API?',
    opts: [
      '@ViewChild("searchInput") input: ElementRef',
      'viewChild<ElementRef>("searchInput")',
      'Both A (decorator) and B (signal function) are valid modern approaches',
      'Template reference variables cannot be accessed from the class — only from the template',
    ],
    answer: 2,
    explanation: 'C is correct: Angular supports both `@ViewChild("searchInput") input!: ElementRef` (decorator) and `readonly input = viewChild<ElementRef>("searchInput")` (signal-based, Angular 17+). Both give you a reference to the element, available after `ngAfterViewInit`. D is wrong: the whole point of `@ViewChild` / `viewChild()` is cross-boundary access. A and B are each individually correct, so C (both) is the most complete answer.',
  },
  {
    level: 'junior',
    q: 'What is `ngOnDestroy` primarily used for and which interface must the class implement?',
    opts: [
      'It runs code when a child component is added; implement OnChildInit',
      'It cleans up subscriptions, timers, and event listeners when the component is removed from the DOM; implement OnDestroy',
      'It resets all @Input() values to their defaults when the component is hidden',
      'It runs after every change detection cycle; implement DoCheck',
    ],
    answer: 1,
    explanation: 'B is correct: `ngOnDestroy` is the teardown hook — implement `OnDestroy` and put cleanup (unsubscribe, clearInterval, removeEventListener) there to prevent memory leaks. A is wrong: no such hook exists. C is wrong: Angular does not reset inputs on hide; `ngOnDestroy` fires on full destruction. D is wrong: `ngDoCheck` runs every cycle; `ngOnDestroy` runs once on destruction.',
  },
  {
    level: 'junior',
    q: 'Which syntax is the correct Angular `@switch` control flow?',
    opts: [
      '<ng-switch [ngSwitchCase]="status"><ng-template *case="active"></ng-template></ng-switch>',
      '@switch (status) { @case ("active") { <p>Active</p> } @default { <p>Other</p> } }',
      '@if (status === "active") { <p>Active</p> } @else { <p>Other</p> }',
      '<switch [value]="status"><case value="active"><p>Active</p></case></switch>',
    ],
    answer: 1,
    explanation: 'B is correct: the built-in `@switch`/`@case`/`@default` syntax introduced in Angular 17 requires no imports and replaces `[ngSwitch]`/`*ngSwitchCase`. A is wrong: that is the old NgSwitch directive syntax which still works but is not modern. C is wrong: that is `@if`/`@else`, not a switch. D is wrong: no such HTML-like element exists in Angular.',
  },
  {
    level: 'junior',
    q: 'What does `[class.active]="isActive"` do on a host element?',
    opts: [
      'Adds the string "active" unconditionally to the class list',
      'Removes the "active" class and all other classes',
      'Adds the "active" CSS class when `isActive` is truthy, removes it when falsy',
      'It is a property binding to a CSS variable named --active',
    ],
    answer: 2,
    explanation: 'C is correct: `[class.className]="expression"` is Angular\'s class binding — the class is added if the expression is truthy and removed if falsy. A is wrong: without `[]` it would be a static string, but `[class.active]` is conditional. B is wrong: it only toggles the one named class. D is wrong: CSS custom property bindings use `[style.--var]` syntax, not `[class]`.',
  },
  {
    level: 'junior',
    q: 'What is the modern Angular way to inject a service without a constructor parameter?',
    opts: [
      'Declare a class field typed as the service and Angular injects it automatically by type',
      'Use the `inject()` function in the field initializer: `private svc = inject(MyService)`',
      'Add `providedIn: "auto"` to @Injectable',
      'Use `@Inject(MyService)` on a class method',
    ],
    answer: 1,
    explanation: 'B is correct: `inject()` is the modern DI function available in Angular 14+. It can be called in field initializers, constructors, and factory functions. A is wrong: Angular does not inject by field name — it needs a type annotation AND a decorator or `inject()`. C is wrong: no "auto" providedIn value exists. D is wrong: `@Inject` is a parameter decorator for constructors, not methods.',
  },
  {
    level: 'junior',
    q: 'What happens when you use `@Input({ required: true })` and the parent does not provide the value?',
    opts: [
      'The input defaults to undefined and the app continues silently',
      'Angular throws a compile-time error when building with strict mode',
      'Angular throws a runtime error during component initialization',
      'The component renders but logs a warning to the console',
    ],
    answer: 2,
    explanation: 'C is correct: `@Input({ required: true })` causes Angular to throw a runtime error if the binding is missing at component initialisation. This is checked at runtime (not always at compile time) and is enforced even in non-strict builds. A is wrong: the error is thrown, not silently ignored. B is wrong: it is a runtime, not compile-time, check (though templates with static analysis may catch it earlier). D is wrong: it throws, not warns.',
  },
  {
    level: 'junior',
    q: 'What does `async` pipe do for an Observable used directly in a template?',
    opts: [
      'Converts the Observable to a Promise before rendering',
      'Subscribes to the Observable, renders each emitted value, and automatically unsubscribes when the component is destroyed',
      'Delays rendering until the Observable emits at least 10 values',
      'Executes the Observable in a Web Worker for better performance',
    ],
    answer: 1,
    explanation: 'B is correct: `async` pipe handles the full subscription lifecycle — subscribe on init, update the DOM on each emission, and unsubscribe on destroy. This eliminates memory leak risk and manual subscription boilerplate. A is wrong: the Observable is not converted to a Promise. C is wrong: there is no count threshold. D is wrong: it executes in the same thread.',
  },
  {
    level: 'junior',
    q: 'What does `HttpClient.get<User[]>("/api/users")` return?',
    opts: [
      'A Promise<User[]> that resolves immediately',
      'The User[] array directly (synchronous)',
      'An Observable<User[]> that must be subscribed to (or used with async pipe)',
      'A Subject<User[]> that emits when the request completes',
    ],
    answer: 2,
    explanation: 'C is correct: `HttpClient` methods return cold Observables. No HTTP request is made until something subscribes — either manually with `.subscribe()`, with `async` pipe in the template, or via `toSignal()`. A is wrong: it is an Observable, not a Promise (though you can convert with `firstValueFrom()`). B is wrong: HTTP is asynchronous by nature. D is wrong: it is a regular Observable, not a Subject.',
  },
  {
    level: 'junior',
    q: 'You have `count = signal(0)`. What is the WRONG way to read the value in a template?',
    opts: [
      '{{ count() }}',
      '[value]="count()"',
      '{{ count }}',
      '@if (count() > 0) { ... }',
    ],
    answer: 2,
    explanation: 'C is wrong (and therefore the correct answer): `{{ count }}` prints the string representation of the signal object itself (a function), not its value. You must call the signal as a function: `{{ count() }}`. A, B, and D are all correct ways to read a signal — they call it as a function.',
  },
  {
    level: 'junior',
    q: 'Which import does `[(ngModel)]` require to work in a standalone component?',
    opts: [
      'ReactiveFormsModule from @angular/forms',
      'FormsModule from @angular/forms',
      'CommonModule from @angular/common',
      'NgModel does not require any import in standalone components',
    ],
    answer: 1,
    explanation: 'B is correct: `NgModel` (the directive behind `[(ngModel)]`) is part of `FormsModule`. In a standalone component, add it to `imports: [FormsModule]`. A is wrong: `ReactiveFormsModule` provides `FormControl`, `FormGroup` etc. — not `ngModel`. C is wrong: `CommonModule` provides `*ngIf`, `*ngFor` (the old directives) etc. D is wrong: `ngModel` always requires the directive to be available.',
  },
  {
    level: 'junior',
    q: 'What is the correct way to create a custom pipe named "truncate" in Angular?',
    opts: [
      'export function truncate(value: string, limit: number): string { ... }',
      '@Pipe({ name: "truncate", standalone: true }) export class TruncatePipe implements PipeTransform { transform(v: string, limit = 50): string { ... } }',
      '@Component({ selector: "truncate" }) export class TruncatePipe { ... }',
      'pipes: [{ name: "truncate", fn: (v, limit) => v.slice(0, limit) }] in @NgModule',
    ],
    answer: 1,
    explanation: 'B is correct: a pipe requires the `@Pipe` decorator with a `name`, must implement `PipeTransform` (the `transform` method), and should be `standalone: true` in modern Angular. Use it as `{{ text | truncate:100 }}`. A is wrong: a standalone function is not usable as a template pipe. C is wrong: `@Component` is for components not pipes. D is wrong: there is no such `pipes` array in NgModule API.',
  },
  {
    level: 'junior',
    q: 'What is the key difference between `@ContentChild` and `@ViewChild`?',
    opts: [
      '@ViewChild queries projected content; @ContentChild queries the component\'s own template',
      '@ContentChild queries content projected into <ng-content> by the parent; @ViewChild queries elements in the component\'s own template',
      'They are identical — both query the component\'s full DOM subtree',
      '@ContentChild only works with directive references; @ViewChild only works with component references',
    ],
    answer: 1,
    explanation: 'B is correct: `@ContentChild` accesses elements that a parent inserts into the component via `<ng-content>`, available in `ngAfterContentInit`. `@ViewChild` accesses elements defined in the component\'s own template, available in `ngAfterViewInit`. A is wrong: it reverses the two. C is wrong: they have distinct scopes. D is wrong: both can query directives, components, and template references.',
  },
  {
    level: 'junior',
    q: 'A TypeScript interface and a class both define a User type. When should you use `class User` vs `interface User`?',
    opts: [
      'Use class when you need a runtime object with methods or a DI token; use interface when you only need a compile-time shape for type checking',
      'Classes are only for Angular components; interfaces are for all other types',
      'Interfaces support inheritance; classes do not',
      'Use class for async types and interface for synchronous types',
    ],
    answer: 0,
    explanation: 'A is correct: interfaces are erased at compile time — they exist only for type checking and autocomplete. Classes survive to runtime and can be used as DI tokens, instantiated with `new`, and carry method implementations. A is the accurate distinction. B is wrong: classes are used throughout Angular for services, guards, and more. C is wrong: both support inheritance. D is wrong: the async/sync split has nothing to do with class vs interface.',
  },
  {
    level: 'junior',
    q: 'What TypeScript type represents "a string OR a number"?',
    opts: [
      'string & number',
      'string | number',
      'Union<string, number>',
      'string + number',
    ],
    answer: 1,
    explanation: 'B is correct: `|` is the union operator — a value of type `string | number` can be either a string or a number. A is wrong: `&` is the intersection type — `string & number` means a value that is simultaneously both, which is effectively `never`. C is wrong: no `Union<>` generic exists in TypeScript. D is wrong: `+` is not a TypeScript type operator.',
  },
  {
    level: 'junior',
    q: 'How do you perform lazy loading for a standalone component route in Angular?',
    opts: [
      '{ path: "dashboard", component: DashboardComponent, lazy: true }',
      '{ path: "dashboard", loadComponent: () => import("./dashboard/dashboard").then(m => m.DashboardComponent) }',
      '{ path: "dashboard", module: () => import("./dashboard/dashboard.module") }',
      'Add lazy="true" to <router-outlet> in the parent template',
    ],
    answer: 1,
    explanation: 'B is correct: `loadComponent` with a dynamic `import()` is the standalone lazy-loading pattern. Angular creates a separate JavaScript chunk for the component and downloads it only when the user first navigates to that path. A is wrong: no `lazy: true` property exists in route config. C is wrong: `module` is not a valid route property; standalone components use `loadComponent` not `module`. D is wrong: `<router-outlet>` has no `lazy` attribute.',
  },
  {
    level: 'junior',
    q: 'What is `ng-content` used for?',
    opts: [
      'It declares a component\'s internal template content',
      'It is a slot where a parent component can project arbitrary HTML into a child component',
      'It conditionally shows content, like *ngIf',
      'It iterates over an array to render content, like *ngFor',
    ],
    answer: 1,
    explanation: 'B is correct: `<ng-content>` is Angular\'s content projection mechanism. A child component declares one or more `<ng-content>` slots; the parent fills them with HTML when using the child: `<app-card><h2>Title</h2></app-card>`. A is wrong: the component\'s own HTML in its `template` property is its internal content, not `<ng-content>`. C and D are wrong: those describe `@if` and `@for`.',
  },
  {
    level: 'junior',
    q: 'What is `toSignal()` used for in Angular?',
    opts: [
      'It converts a signal into an EventEmitter',
      'It converts an Observable into a read-only signal, subscribing automatically and cleaning up on destroy',
      'It converts a Promise into a signal that starts as undefined',
      'It creates a new writable signal from a constant value',
    ],
    answer: 1,
    explanation: 'B is correct: `toSignal(obs$)` from `@angular/core/rxjs-interop` bridges RxJS with signals — it subscribes to the Observable, stores the latest value in a signal, and unsubscribes when the injection context is destroyed. A is wrong: toSignal returns a signal, not an emitter. C is wrong: you can use `toSignal()` with a Promise via `from(promise)` but its primary purpose is Observables. D is wrong: use `signal(value)` for that.',
  },
  {
    level: 'junior',
    q: 'What does `@HostListener("click", ["$event"]) onClick(e: MouseEvent) {}` do?',
    opts: [
      'Attaches a click listener to a child component element',
      'Listens to the click event on the host element of the directive or component itself',
      'Prevents click events from bubbling to parent elements',
      'Emits a click event from the component to its parent',
    ],
    answer: 1,
    explanation: 'B is correct: `@HostListener` binds an event listener to the directive\'s or component\'s host element (the element the selector matches). A is wrong: it targets the host, not a child. C is wrong: you would need to call `event.stopPropagation()` inside the method to stop bubbling. D is wrong: emitting events to the parent requires `@Output` / `output()`.',
  },
  {
    level: 'junior',
    q: 'In TypeScript, what does the `?` operator do in `user?.address?.city`?',
    opts: [
      'It casts user.address.city to optional type',
      'It is a null check — if user or user.address is null/undefined, the expression returns undefined instead of throwing',
      'It makes the assignment optional and skips it if the left side is undefined',
      'It is the ternary operator shorthand for `if (user) user.address.city`',
    ],
    answer: 1,
    explanation: 'B is correct: `?.` is optional chaining — it short-circuits to `undefined` if any part of the chain is nullish (null or undefined) instead of throwing "Cannot read properties of null". A is wrong: it is an expression operator, not a type cast. C is wrong: optional chaining is for reading, not writing. D is wrong: ternary is `condition ? a : b` — optional chaining is distinct.',
  },

  // ──── MID (continued — 20 additional) ────
  {
    level: 'mid',
    q: 'What is `takeUntilDestroyed()` and why is it preferred over manually unsubscribing in `ngOnDestroy`?',
    opts: [
      'It is a Subject that completes when the component emits a specific destroy event',
      'It is an RxJS operator from @angular/core/rxjs-interop that automatically completes a subscription when the current injection context (component/directive) is destroyed — no manual ngOnDestroy required',
      'It destroys the component after a single emission to prevent memory leaks',
      'It replaces the async pipe for managing Observable lifecycles in templates',
    ],
    answer: 1,
    explanation: 'B is correct: `takeUntilDestroyed()` from `@angular/core/rxjs-interop` (Angular 16+) uses the current `DestroyRef` to automatically complete subscriptions on destroy. It eliminates the `Subject destroy$ = new Subject()` + `takeUntil(this.destroy$)` + `ngOnDestroy` pattern. A is wrong: it is an operator, not a Subject. C is wrong: it does not destroy the component. D is wrong: it is for class-based subscriptions, not templates.',
  },
  {
    level: 'mid',
    q: 'What is the difference between `BehaviorSubject` and `ReplaySubject` when used for state sharing in a service?',
    opts: [
      'BehaviorSubject emits all past values to new subscribers; ReplaySubject emits only the latest value',
      'BehaviorSubject requires an initial value and always emits the current value to new subscribers; ReplaySubject(n) replays the last n emissions with no mandatory initial value',
      'They are interchangeable — both replay the last 1 value by default',
      'BehaviorSubject is for synchronous state; ReplaySubject is for async HTTP state',
    ],
    answer: 1,
    explanation: 'B is correct: `BehaviorSubject(initialValue)` always has a current value (`getValue()`) and immediately emits it to any new subscriber. `ReplaySubject(n)` buffers the last n emissions and replays them to late subscribers — no mandatory initial value. A is wrong: BehaviorSubject only replays 1 (the current value), not all history. C is wrong: they are not interchangeable. D is wrong: both work in any context.',
  },
  {
    level: 'mid',
    q: 'When should you use `combineLatest([a$, b$])` vs `forkJoin([a$, b$])`?',
    opts: [
      'combineLatest for parallel HTTP calls that each complete; forkJoin for streams that stay open',
      'forkJoin for parallel HTTP calls that each complete once; combineLatest for streams that stay open and re-emit when any source emits a new value',
      'They are identical — use whichever is imported already',
      'combineLatest is deprecated in RxJS 7; always use forkJoin',
    ],
    answer: 1,
    explanation: 'B is correct: `forkJoin` waits for all source Observables to complete, then emits one combined result — perfect for parallel HTTP requests. `combineLatest` emits a new combined value whenever any source emits, continuing until all sources complete — ideal for combining reactive state streams like signals or form value changes. A reverses the two. C is wrong. D is wrong: combineLatest is not deprecated.',
  },
  {
    level: 'mid',
    q: 'What does `distinctUntilChanged()` do and why is it critical in a typeahead search?',
    opts: [
      'It emits only values that are different from the very first emission in the stream',
      'It suppresses consecutive duplicate emissions — if the new value equals the previous value, it is not forwarded, preventing redundant HTTP calls when the user types then deletes back to the same query',
      'It filters out null and undefined values from the stream',
      'It only emits the last value before the source completes',
    ],
    answer: 1,
    explanation: 'B is correct: `distinctUntilChanged()` compares each emission to the previous one using strict equality (or a custom comparator). In a typeahead, if the user types "ang" → "angu" → "ang" (backspace), without it you\'d fire three searches; with it, only "ang" and "angu" trigger requests (the second "ang" is suppressed). A is wrong: it compares with the previous, not the first. C is wrong: use `filter(v => v != null)` for that. D is wrong: that is `last()`.',
  },
  {
    level: 'mid',
    q: 'What is `linkedSignal()` and when would you use it instead of `computed()`?',
    opts: [
      'linkedSignal() creates a read-only derived value like computed() but updates asynchronously',
      'linkedSignal() creates a writable signal that resets to a derived value when its source signal changes — useful when the user can override a default but the default should update when the source changes',
      'linkedSignal() links two signals bidirectionally so setting either updates the other',
      'linkedSignal() is a performance optimisation that batches multiple signal updates into one',
    ],
    answer: 1,
    explanation: 'B is correct: `linkedSignal()` (Angular 19+) gives you a signal whose initial/reset value is derived from another signal, but which can be overridden by the user. Example: a "selected item" signal that defaults to the first item in a list, but allows the user to select a different one — and resets to the new first item when the list source changes. A is wrong: computed() is lazy/synchronous; linkedSignal is also synchronous. C is wrong: it is not bidirectional. D is wrong: batching is handled by the scheduler.',
  },
  {
    level: 'mid',
    q: 'What is `withComponentInputBinding()` added to `provideRouter()` and what does it enable?',
    opts: [
      'It allows components to receive route parameters, query parameters, and resolver data directly as `@Input()` / `input()` bindings — no need to inject `ActivatedRoute`',
      'It enables two-way binding between a route\'s component and its parent layout',
      'It automatically creates child routes for every `@Input()` declared on a component',
      'It links the router outlet to a specific component input for data sharing',
    ],
    answer: 0,
    explanation: 'A is correct: `withComponentInputBinding()` (Angular 16+) makes the router automatically pass route params, query params, and resolve data as component inputs matching the same name. For example, `{ path: "product/:id" }` maps to `readonly id = input<string>()`. B, C, and D do not describe real Angular features.',
  },
  {
    level: 'mid',
    q: 'You want an HTTP error to be caught and mapped to a user-friendly object. Which RxJS pattern is correct?',
    opts: [
      'obs$.pipe(try { } catch(e) { })',
      'obs$.pipe(catchError(err => of({ error: true, message: err.message })))',
      'obs$.pipe(onError(err => throwError(err)))',
      'obs$.pipe(filter(v => !(v instanceof HttpErrorResponse)))',
    ],
    answer: 1,
    explanation: 'B is correct: `catchError(fn)` intercepts errors in the stream and must return a replacement Observable — `of(value)` creates one that emits and completes immediately. A is wrong: try/catch does not work with asynchronous Observables. C is wrong: `onError` does not exist as an RxJS operator. D is wrong: `filter` prevents emissions from reaching subscribers but does not handle errors — an error is not an emission, it is a separate channel.',
  },
  {
    level: 'mid',
    q: 'What is the purpose of a route `resolveFn` (functional resolver) in Angular?',
    opts: [
      'It blocks the entire app from loading until all resolvers complete',
      'It pre-fetches data before the component activates so the component receives loaded data on init rather than loading asynchronously inside itself',
      'It validates route parameters and redirects if they are invalid',
      'It provides services to a component at route level, similar to a component providers array',
    ],
    answer: 1,
    explanation: 'B is correct: a resolver runs before route activation and its return value (Observable, Promise, or value) is made available via `ActivatedRoute.data` (or as a component input with `withComponentInputBinding()`). The component loads already having the data. A is wrong: resolvers run per-route, not app-wide. C is wrong: use `CanMatchFn` or `CanActivateFn` for guard/redirect logic. D is wrong: that is component-level or route-level `providers`.',
  },
  {
    level: 'mid',
    q: 'In an Angular TestBed test, what does `fixture.detectChanges()` do?',
    opts: [
      'It destroys and recreates the component to apply new @Input() values',
      'It triggers one round of change detection, causing Angular to update the DOM to reflect the current component state',
      'It waits 1 second for any asynchronous operations to complete',
      'It resets all signal values to their initial state',
    ],
    answer: 1,
    explanation: 'B is correct: `fixture.detectChanges()` runs Angular\'s change detection synchronously, updating the DOM. You call it after changing component state to see the reflected DOM changes. A is wrong: the component is not destroyed; only detection runs. C is wrong: use `tick()` inside `fakeAsync` for that. D is wrong: signals are not reset by `detectChanges()`.',
  },
  {
    level: 'mid',
    q: 'What does `TestBed.overrideComponent(MyComponent, { set: { providers: [MockService] } })` accomplish?',
    opts: [
      'It replaces the entire component class with MockService for this test suite',
      'It overrides specific metadata of a compiled component — useful for swapping providers, changing the template, or modifying inputs in a single test without a full reconfigure',
      'It converts a non-standalone component to standalone for testing',
      'It only works if MockService extends the real service class',
    ],
    answer: 1,
    explanation: 'B is correct: `TestBed.overrideComponent()` patches component metadata after TestBed has been configured. This lets you swap a real service for a mock in a scoped way for a specific test scenario. A is wrong: the component class is not replaced — only its metadata. C is wrong: standalone conversion is not what this does. D is wrong: MockService need not extend anything — it only needs to satisfy the injection token.',
  },
  {
    level: 'mid',
    q: 'What is the signal-based equivalent of `@Input() title!: string` in Angular 17+?',
    opts: [
      'title = signal<string>("")',
      'readonly title = input<string>()',
      'readonly title = input.required<string>()',
      'B and C are both valid; the difference is whether the input is optional or required',
    ],
    answer: 3,
    explanation: 'D is correct: `input<string>()` creates an optional signal input (value is `string | undefined` unless a default is given), while `input.required<string>()` creates a required signal input that throws if the parent does not bind it. Both replace `@Input()`. A is wrong: `signal()` creates internal state, not a component input.',
  },
  {
    level: 'mid',
    q: 'How do you add a custom HTTP header to every outgoing request using a functional interceptor?',
    opts: [
      'Add the header directly to HttpClient.get() options on every call site',
      'Register a function `(req, next) => next(req.clone({ headers: req.headers.set("X-App", "1") }))` via `withInterceptors([fn])` in `provideHttpClient()`',
      'Override the browser\'s fetch API in main.ts to add headers globally',
      'Use `HttpClientModule.forRoot({ headers: { "X-App": "1" } })` in app config',
    ],
    answer: 1,
    explanation: 'B is correct: functional interceptors are provided via `provideHttpClient(withInterceptors([myInterceptorFn]))`. The function signature is `HttpInterceptorFn = (req, next) => Observable<HttpEvent<unknown>>`. Clone the request to add the header (HttpRequest is immutable) and pass the clone to `next()`. A works but is not global. C is not how Angular HTTP works. D is wrong: no `forRoot` config for headers exists.',
  },
  {
    level: 'mid',
    q: 'What is `ng-container` and when would you use it instead of a regular HTML element?',
    opts: [
      'A special element that applies change detection to its children independently',
      'A logical grouping element that renders its children directly without creating an extra DOM node — useful for applying structural directives without adding a wrapper div',
      'A lazy-loaded container that defers its children until they scroll into view',
      'An Angular-specific replacement for HTML5 <article> that adds routing support',
    ],
    answer: 1,
    explanation: 'B is correct: `<ng-container>` is invisible in the final DOM — Angular renders its children in-place. This is essential when you need to apply structural directives (`@if`, `@for`, `*ngIf`) to a group of elements without wrapping them in a `<div>` that would break CSS layout (flex/grid rows, table rows, etc.). A, C, D do not describe `ng-container`.',
  },
  {
    level: 'mid',
    q: 'How does `afterNextRender()` differ from `ngAfterViewInit()`?',
    opts: [
      'They are identical; afterNextRender() is just the functional API replacement',
      'ngAfterViewInit is a lifecycle hook called once after the first DOM render; afterNextRender() is a standalone function that runs once after the very next browser render frame — it works outside components and in factory functions',
      'afterNextRender() runs on the server during SSR; ngAfterViewInit() runs only in the browser',
      'afterNextRender() supports async callbacks; ngAfterViewInit() is synchronous only',
    ],
    answer: 1,
    explanation: 'B is correct: `afterNextRender()` (Angular 17+) schedules a one-time callback after the next browser paint. Unlike `ngAfterViewInit`, it is injection-context-aware but not tied to a specific lifecycle phase, can be called outside a component class, and is safe to use in injection factories. It does NOT run during SSR. A is wrong: they are not identical. C is wrong: `afterNextRender` skips SSR. D is wrong: both can use async patterns.',
  },
  {
    level: 'mid',
    q: 'You have a `FormArray` for a dynamic list of email inputs. Which method CORRECTLY adds a new control?',
    opts: [
      'this.form.get("emails").push(new FormControl(""))',
      'this.emailsArray.controls.push(new FormControl(""))',
      'this.emailsArray.push(new FormControl(""))',
      'this.emailsArray.append(new FormControl(""))',
    ],
    answer: 2,
    explanation: 'C is correct: `FormArray.push(control)` is the official method to append a new control and trigger valueChanges/statusChanges. B is wrong: directly mutating `.controls` bypasses Angular\'s internal bookkeeping — the form will not detect the change. A is wrong: `form.get("emails")` returns `AbstractControl`, not `FormArray`, so `.push` would not be available without a cast. D is wrong: `append` does not exist on FormArray.',
  },
  {
    level: 'mid',
    q: 'A component uses `ChangeDetectionStrategy.OnPush`. You call a service method that mutates a plain array input. The view does not update. Why?',
    opts: [
      'OnPush components never update after initialisation',
      'OnPush only re-checks when an @Input() reference changes. Mutating an array keeps the same reference, so Angular considers the input unchanged and skips re-rendering',
      'The service method should emit via a Subject — OnPush ignores direct mutations',
      'OnPush requires Zone.js to be removed for mutations to be detected',
    ],
    answer: 1,
    explanation: 'B is correct: OnPush uses reference equality to decide if an input changed. If you push to an existing array, the reference is the same, so Angular skips the component. The fix: pass a new array reference — `this.items = [...this.items, newItem]`. A is wrong: OnPush components update on reference changes, signal changes, and events. C is wrong: though signals and Subject are better patterns, they are not required. D is wrong: Zone.js is unrelated to this.',
  },
  {
    level: 'mid',
    q: 'How do you test a component that uses signals without any special testing utility?',
    opts: [
      'Signals cannot be tested in TestBed — use services with RxJS instead',
      'Signals are synchronous and readable directly: set a signal value, call fixture.detectChanges(), then assert the DOM or read the signal with signal()',
      'Use fakeAsync() and tick() to wait for signal propagation',
      'Wrap all signal reads in a try-catch in the test to handle async emissions',
    ],
    answer: 1,
    explanation: 'B is correct: signals are synchronous — setting a signal value immediately updates the signal\'s stored value. After calling `fixture.detectChanges()` the template re-renders with the new value. No special async handling is needed for basic signal state. A is wrong: signals are fully testable. C is wrong: signals do not need `fakeAsync` since they are synchronous. D is wrong: no async emissions, no try-catch needed.',
  },
  {
    level: 'mid',
    q: 'What does `debounceTime(300)` do when applied to a search input\'s `valueChanges` stream?',
    opts: [
      'It limits the search to 300 results',
      'It waits 300ms after the last keystroke before emitting the value, reducing the number of HTTP requests while the user is still typing',
      'It runs the HTTP request a maximum of 300 times per session',
      'It adds a 300ms animation delay to the search results rendering',
    ],
    answer: 1,
    explanation: 'B is correct: `debounceTime(300)` suppresses emissions until 300ms of silence — if a new value arrives within 300ms of the previous, the timer resets. This prevents an HTTP request on every keystroke for a user typing quickly. A, C, D all misrepresent the operator.',
  },
  {
    level: 'mid',
    q: 'What is the correct way to declare a route guard as a functional guard in modern Angular?',
    opts: [
      'class AuthGuard implements CanActivate { canActivate(route, state): boolean { ... } }',
      'export const authGuard: CanActivateFn = (route, state) => inject(AuthService).isLoggedIn()',
      'function authGuard() { return AuthService.getInstance().isLoggedIn(); }',
      'canActivate: [AuthGuard] where AuthGuard is a class provided in root',
    ],
    answer: 1,
    explanation: 'B is correct: functional guards (Angular 15+) are plain functions matching the `CanActivateFn` type. They use `inject()` to access services and are registered directly: `{ path: "...", canActivate: [authGuard] }`. No class, no `implements`, no provider needed. A is the old class-based pattern (still works but not modern). C is wrong: using a static instance bypasses DI. D is wrong: the class guard must be declared in providers if using class-based approach.',
  },
  {
    level: 'mid',
    q: 'Which RxJS operator should you use to handle a sequence of operations that must run one after another in order?',
    opts: [
      'mergeMap — it handles all inner Observables concurrently',
      'concatMap — it subscribes to each inner Observable only after the previous one completes, preserving order',
      'switchMap — it ensures only one inner Observable is active at a time',
      'exhaustMap — it processes the first and ignores subsequent values until done',
    ],
    answer: 1,
    explanation: 'B is correct: `concatMap` queues inner Observables and starts the next only when the previous completes — perfect for sequential file uploads or ordered API calls. A is wrong: `mergeMap` runs all concurrently, losing order guarantees. C is wrong: `switchMap` cancels the previous, so you would lose all but the last operation. D is wrong: `exhaustMap` ignores new values while one is in flight — useful for preventing double-submit, not for sequential processing of all values.',
  },

  // ──── SENIOR (continued — 20 additional) ────
  {
    level: 'senior',
    q: 'What does `provideClientHydration(withHttpTransferCache())` do for an Angular SSR app?',
    opts: [
      'It enables lazy hydration of HTTP responses stored in the browser cache',
      'During SSR, HTTP responses are serialised into the HTML; the browser reuses them on startup instead of making duplicate requests — then hydration activates the server-rendered DOM without re-fetching data',
      'It moves all HTTP requests to a service worker to cache responses for offline use',
      'It replaces the browser\'s fetch API with Angular\'s HttpClient during hydration',
    ],
    answer: 1,
    explanation: 'B is correct: `withHttpTransferCache()` serialises HTTP responses made during SSR into the `<script type="application/json">` block in the HTML. On the client, `HttpClient` reads from this transfer state cache first, serving the responses instantly without network calls. Once the cache is consumed, subsequent requests go to the network normally. A, C, D misrepresent what this API does.',
  },
  {
    level: 'senior',
    q: 'When should you use `makeEnvironmentProviders()` when building a reusable Angular library?',
    opts: [
      'To mark providers as available only in the development environment',
      'To wrap library providers so they can only be used in environment injectors (root/platform), not in component providers — preventing misuse that would create unexpected scoped instances',
      'To conditionally provide services only when the consuming app is online',
      'To bundle providers into a single lazy chunk for better code splitting',
    ],
    answer: 1,
    explanation: 'B is correct: `makeEnvironmentProviders()` wraps a provider array and marks it as environment-only. If a developer accidentally puts these providers in a component\'s `providers: []` array, Angular throws an error at development time. This prevents library consumers from inadvertently creating per-component instances of services that must be app-wide singletons. A, C, D are all incorrect descriptions.',
  },
  {
    level: 'senior',
    q: 'How do you implement optimistic UI updates with signals in Angular?',
    opts: [
      'Use effect() to update the server before the signal changes',
      'Update the signal immediately with the expected state, make the API call, and on error roll back the signal to the previous value — giving instant visual feedback while handling failures gracefully',
      'Use resource() which automatically applies optimistic updates when given a mutate function',
      'Delay signal updates by 200ms using setTimeout so the animation completes before the API response arrives',
    ],
    answer: 1,
    explanation: 'B is correct: optimistic UI = update locally first, confirm (or revert) after. Pattern: `const prev = this.items(); this.items.update(add); http.post(...).pipe(catchError(() => { this.items.set(prev); return EMPTY; })).subscribe()`. The user sees instant feedback; failures are silently rolled back. A is wrong: effect() would create a side-effect loop. C is wrong: resource() does not support built-in optimistic updates. D is wrong: intentional delays worsen UX.',
  },
  {
    level: 'senior',
    q: 'What is the role of `ENVIRONMENT_INITIALIZER` vs `APP_INITIALIZER` in Angular?',
    opts: [
      'APP_INITIALIZER runs once per route change; ENVIRONMENT_INITIALIZER runs once on app startup',
      'Both run factory functions on startup; APP_INITIALIZER blocks rendering until all Promises resolve; ENVIRONMENT_INITIALIZER runs eagerly during environment setup without blocking — useful for setting up effects or registering listeners in library providers',
      'ENVIRONMENT_INITIALIZER is for SSR only; APP_INITIALIZER is for browser only',
      'They are identical — ENVIRONMENT_INITIALIZER is the standalone API replacement for APP_INITIALIZER',
    ],
    answer: 1,
    explanation: 'B is correct: `APP_INITIALIZER` factory functions must return Promises and block app startup until resolved — useful for loading config before the first render. `ENVIRONMENT_INITIALIZER` runs a side-effect (not blocking) during environment injector creation — ideal for library setup code that registers effects, opens WebSocket connections, etc. without delaying the user. A, C, D misstate the timing or applicability.',
  },
  {
    level: 'senior',
    q: 'How does Angular\'s `DOCUMENT` injection token differ from using `document` directly?',
    opts: [
      'DOCUMENT is typed as Document<unknown> for better TypeScript generics',
      'Injecting `DOCUMENT` via `inject(DOCUMENT)` allows Angular to substitute a server-compatible Document implementation during SSR, where the browser\'s global `document` object does not exist',
      'DOCUMENT bypasses Angular\'s change detection when making DOM mutations',
      'DOCUMENT is read-only — it prevents accidental DOM mutations during change detection',
    ],
    answer: 1,
    explanation: 'B is correct: the browser\'s `document` global throws on the server (Node.js) during SSR. `inject(DOCUMENT)` is platform-agnostic — Angular substitutes a DOM-compatible implementation server-side. This is part of the "platform abstraction" pattern for writing components that work in both environments. A, C, D are incorrect descriptions of `DOCUMENT`.',
  },
  {
    level: 'senior',
    q: 'You notice `ExpressionChangedAfterItHasBeenCheckedError` in development. What is the most likely root cause and correct fix?',
    opts: [
      'The template has a syntax error; fix the HTML',
      'A computed value or template expression is being modified during the change detection pass itself — Angular runs detection twice in development and catches the inconsistency. Fix by ensuring values are stable before detection runs, using signals instead of mutable class properties, or moving side effects to afterNextRender()',
      'The component is missing `implements OnChanges` — add the interface',
      'Zone.js is missing; add it to polyfills.ts',
    ],
    answer: 1,
    explanation: 'B is correct: Angular runs change detection twice in development mode. If a template expression produces a different value on the second pass (because something changed it during the first pass), this error fires. Common causes: calling a method with side effects in a template, setting a value in ngAfterViewInit that affects a parent template, or a getter that returns a new object every call. Signals prevent this because they are stable references. A, C, D do not address the real cause.',
  },
  {
    level: 'senior',
    q: 'What is `ViewEncapsulation.ShadowDom` and its key trade-off vs the default `Emulated`?',
    opts: [
      'ShadowDom uses real browser Shadow DOM — styles are truly isolated from the global CSS, but global styles and CSS custom properties do not penetrate the shadow boundary by default',
      'ShadowDom disables all styling — use Emulated for any production component',
      'ShadowDom is identical to Emulated but uses less memory due to fewer attribute selectors',
      'ShadowDom is required to use CSS animations in Angular components',
    ],
    answer: 0,
    explanation: 'A is correct: `ShadowDom` uses the browser\'s native Shadow DOM API — component styles are completely isolated (no leakage in or out), which is perfect for true web components. The trade-off: global stylesheets (like Angular Material\'s typography) do not reach inside the shadow boundary. `Emulated` (default) scopes styles using generated attribute selectors — not true isolation but compatible with global CSS. B, C, D are all incorrect.',
  },
  {
    level: 'senior',
    q: 'How do you implement a ControlValueAccessor for a custom slider component so it works with both `formControlName` and `[(ngModel)]`?',
    opts: [
      'Extend FormControl in the slider class and override writeValue()',
      'Implement the ControlValueAccessor interface (writeValue, registerOnChange, registerOnTouched, setDisabledState) and provide the component as NG_VALUE_ACCESSOR: { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SliderComponent), multi: true }',
      'Add @Input() value and @Output() valueChange to the component — Angular automatically treats this as a form control',
      'Register the component with FormBuilder.registerControl(SliderComponent)',
    ],
    answer: 1,
    explanation: 'B is correct: `ControlValueAccessor` is Angular\'s protocol for custom form controls. The four methods let Angular read (`writeValue`), be notified of (`registerOnChange`, `registerOnTouched`), and disable (`setDisabledState`) your control. The `NG_VALUE_ACCESSOR` multi-provider registers it with the forms system so `formControlName` and `ngModel` work transparently. A is wrong: you never extend FormControl. C is wrong: `[(ngModel)]` banana-box works for components but does not integrate with reactive forms. D is wrong: `FormBuilder.registerControl` does not exist.',
  },
  {
    level: 'senior',
    q: 'How do you configure Content Security Policy (CSP) nonces for Angular SSR to allow inline scripts?',
    opts: [
      'Add ngCspNonce="random" to the <app-root> element in index.html',
      'Set a per-request nonce server-side via the `ngCspNonce` meta tag or `CSP_NONCE` injection token so Angular stamps the nonce on all inline script elements it generates, allowing the browser to execute them under a strict CSP',
      'Disable inline script blocking in the CSP header for Angular routes',
      'Use ViewEncapsulation.None to prevent Angular from generating any inline styles that would need a nonce',
    ],
    answer: 1,
    explanation: 'B is correct: Angular 16+ reads the `ngCspNonce` attribute from `<app-root ngCspNonce="...">` (or the `CSP_NONCE` token) and stamps that nonce onto inline `<style>` and `<script>` elements it generates. The server generates a fresh random nonce per request, sets it in the `Content-Security-Policy: script-src \'nonce-<value>\'` header, and writes it into the HTML. A is partially right but requires server-side-per-request generation, not a static string. C is wrong: disabling CSP defeats the purpose. D is wrong: `ViewEncapsulation.None` does not help.',
  },
  {
    level: 'senior',
    q: 'What is the `outputFromObservable()` function (Angular 17+) used for?',
    opts: [
      'It converts an output() into an Observable for use in RxJS pipelines',
      'It creates a component output that wraps an Observable — when the Observable emits, the output fires, bridging RxJS streams with the new output() API',
      'It converts EventEmitter outputs to the new functional output() format automatically',
      'It multicasts an Observable to multiple component outputs simultaneously',
    ],
    answer: 1,
    explanation: 'B is correct: `outputFromObservable(myObservable$)` creates a component output that fires whenever `myObservable$` emits — bridging RxJS-based internal logic with the modern `output()` API so parent components can bind with `(outputName)="handler()"`. A describes the reverse — that is `outputToObservable()`. C and D do not describe real Angular behaviour.',
  },
  {
    level: 'senior',
    q: 'How do you correctly use `inject()` outside of an injection context (e.g., inside a factory function or a callback)?',
    opts: [
      'inject() always works anywhere in the codebase — it reads from the global injector',
      'Store the required services in class fields during construction, then use the stored references in callbacks — or use runInInjectionContext(injector, () => inject(Service)) to temporarily enter an injection context',
      'Use @Inject(Token) in a function parameter to call inject() outside the class',
      'inject() cannot be used outside injection context; always use constructor injection for callbacks',
    ],
    answer: 1,
    explanation: 'B is correct: `inject()` must be called during component/directive/service construction (the injection context). For asynchronous callbacks, store the injected service in a class field or use `runInInjectionContext(this.injector, () => inject(SomeService))` to temporarily enter an injection context. A is wrong: `inject()` outside context throws "inject() must be called from an injection context". C is wrong: `@Inject` is a parameter decorator for constructors, not standalone functions. D is too absolute — `runInInjectionContext` is the solution.',
  },
  {
    level: 'senior',
    q: 'What is `withFetch()` in Angular\'s `provideHttpClient()` and what does it replace?',
    opts: [
      'It adds a fetch-based retry mechanism to all HTTP requests',
      'It switches HttpClient\'s underlying transport from `XMLHttpRequest` to the browser\'s native `fetch` API — enabling HTTP/2 server push, streaming, and better SSR compatibility',
      'It provides a mock fetch implementation for unit tests',
      'It enables request/response caching via the browser\'s Cache API',
    ],
    answer: 1,
    explanation: 'B is correct: by default (before Angular 18 made it the default), `HttpClient` used `XMLHttpRequest` internally. `withFetch()` (Angular 16+) switches it to the native `fetch` API, which is available in modern browsers and Node.js (for SSR), enables streaming responses, and aligns with modern web standards. A, C, D all misrepresent what `withFetch()` does. In Angular 18+, `withFetch()` is the default.',
  },
  {
    level: 'senior',
    q: 'What is the `model()` function and how does it enable two-way binding in a custom component?',
    opts: [
      'model() creates a reactive model class that components can observe',
      'model() creates a writable input/output pair — the parent binds with [(value)]="x", the component reads and writes the signal, and writes propagate back to the parent via an implicit valueChange output',
      'model() is an alias for signal() that automatically persists the value to localStorage',
      'model() replaces @Input()/@Output() for all use cases — you should always prefer it',
    ],
    answer: 1,
    explanation: 'B is correct: `readonly value = model<string>("")` creates a writable signal that acts as both an input and an output. The parent binds with `[(value)]="name"` (two-way). Inside the component, `this.value()` reads it and `this.value.set(x)` writes it — automatically emitting to the parent. A, C, D are all incorrect descriptions.',
  },
  {
    level: 'senior',
    q: 'How do you run RxJS marble tests to verify an operator works correctly on a time-based stream?',
    opts: [
      'Use fakeAsync() and tick(500) to advance time and observe Observable emissions',
      'Use RxJS TestScheduler with marble syntax: testScheduler.run(({ hot, cold, expectObservable }) => { ... }) — marble strings like "--a-b|" represent emissions at specific virtual time frames',
      'Use jasmine.clock() to control time, then subscribe and collect emissions in an array',
      'Marble testing requires a third-party library like jest-marbles; Angular TestBed does not support it',
    ],
    answer: 1,
    explanation: 'B is correct: `TestScheduler` from `rxjs/testing` provides marble syntax where each `-` is 10 virtual milliseconds, letters are emissions, `|` is completion, and `#` is error. `expectObservable(result$).toBe("--a-b|", { a: 1, b: 2 })` asserts time-aware Observable behaviour. A is wrong: `fakeAsync/tick` works for Angular tests but lacks marble expressiveness. C is wrong: `jasmine.clock()` does not integrate with RxJS virtual time. D is wrong: `TestScheduler` is built into RxJS.',
  },
  {
    level: 'senior',
    q: 'What does `APP_ID` injection token control in Angular SSR and why does it matter?',
    opts: [
      'It sets the application\'s bundle identifier used by the Angular CLI during build',
      'It is stamped on SSR-generated component element attributes (e.g., ng-version) and is used to associate inline styles with their owning application — critical when running multiple Angular apps on the same page to avoid style collisions',
      'It uniquely identifies each HTTP request from the browser to the SSR server',
      'It sets the router base URL for all links in the application',
    ],
    answer: 1,
    explanation: 'B is correct: Angular uses `APP_ID` to prefix the IDs of server-generated inline style elements (e.g., `<style ng-app-id="ng">`) so the client knows which styles to remove during hydration. When running multiple Angular micro-frontends on one page, each should have a unique `APP_ID` to prevent style element confusion. A, C, D describe unrelated concepts.',
  },
  {
    level: 'senior',
    q: 'How do you build a signal-based state service in Angular without NgRx?',
    opts: [
      'Create a class with public signal() fields and mutate them directly from any component',
      'Create an @Injectable({ providedIn: "root" }) service with private writable signals for state, expose readonly computed signals as public API, and expose explicit mutation methods — this enforces unidirectional data flow without a library',
      'Use a global object window.__state = {} with signal wrappers around each property',
      'NgRx is required for signal-based state — signal() alone cannot handle cross-component state',
    ],
    answer: 1,
    explanation: 'B is correct: the pattern is: private `_state = signal<State>(initial)`, public `readonly state = this._state.asReadonly()` (or exposed computed slices), and named mutation methods like `addItem(item: Item)`. This is a "Mini-Store" — explicit mutations, derived computed, no external library. A is wrong: making signals fully public breaks encapsulation and makes debugging impossible. C is wrong: this bypasses DI entirely. D is wrong: NgRx is optional.',
  },
  {
    level: 'senior',
    q: 'What is the `LOCALE_ID` injection token and how does it affect Angular pipes?',
    opts: [
      'It controls which language is used for Angular CLI error messages during development',
      'It defines the active locale for the application — pipes like DatePipe, CurrencyPipe, DecimalPipe, and PercentPipe use it to format values according to locale-specific rules (date formats, decimal separators, currency symbols)',
      'It is required to enable i18n translation and must match the xlf file name',
      'It only affects the language direction (LTR/RTL) of the application',
    ],
    answer: 1,
    explanation: 'B is correct: `LOCALE_ID` (default "en-US") determines how locale-aware pipes format their output. Provide a different locale: `{ provide: LOCALE_ID, useValue: "de-DE" }` and `{{ 1234.5 | number }}` outputs "1.234,5" instead of "1,234.5". You must also call `registerLocaleData(localeDe)` for Angular to have the locale data. A, C, D misstate its role.',
  },
];

// ── Resolved types ────────────────────────────────────────────────────────────
interface ResolvedLesson { id: string; title: string; built: boolean; }
interface ResolvedTopic  { topic: string; lessons: ResolvedLesson[]; }
interface ResolvedLevel  { key: string; name: string; format: string; blurb: string; topics: ResolvedTopic[]; count: number; }

type ExamView = 'map' | 'exam' | 'results';

@Component({
  selector: 'app-certification',
  imports: [RouterLink],
  styles: [`
    :host { display: block; max-width: 1000px; margin: 0 auto; }

    /* ─── hero ─────────────────────────────────── */
    .hero { text-align: center; padding: 24px 0 8px; }
    .hero h1 { font-size: clamp(1.7rem,4vw,2.6rem); margin: 14px 0 8px;
      background: linear-gradient(90deg,#fff,var(--accent));
      -webkit-background-clip: text; background-clip: text; color: transparent; }
    .hero .lead { max-width: 680px; margin: 0 auto; }
    .covered { color: var(--text-muted); margin-top: 16px; }
    .covered strong { color: var(--green); }

    /* ─── level sections (map view) ────────────── */
    .level { margin: 40px 0; }
    .level__head { display: flex; align-items: baseline; justify-content: space-between;
      gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .level__head h2 { margin: 0; font-size: 1.45rem; }
    h2[data-key='junior'] { color: var(--green); }
    h2[data-key='mid']    { color: var(--amber); }
    h2[data-key='senior'] { color: var(--accent); }
    .fmt { font-size: .8rem; color: var(--text-muted); white-space: nowrap; }
    .blurb { color: var(--text-muted); margin: 10px 0 2px; }
    .count { font-size: .75rem; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-muted); margin: 0 0 14px; }
    .topic { display: grid; grid-template-columns: 220px 1fr; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid var(--border); }
    .topic__name { font-weight: 600; font-size: .95rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { display: inline-block; background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 999px; padding: 4px 12px; font-size: .82rem; color: var(--text);
      text-decoration: none; transition: border-color .12s, transform .12s; }
    .chip:hover { border-color: var(--accent); transform: translateY(-1px); }
    .chip--soon { opacity: .6; }

    /* ─── simulate button ──────────────────────── */
    .sim-bar { display: flex; align-items: center; justify-content: space-between;
      margin-top: 20px; padding: 14px 18px; border-radius: 12px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); }
    .sim-bar p { margin: 0; font-size: .9rem; color: var(--text-muted); }
    .sim-btn { padding: 9px 20px; background: #6366f1; color: #fff; border: none;
      border-radius: 8px; cursor: pointer; font-size: .9rem; font-weight: 600;
      white-space: nowrap; }
    .sim-btn:hover { background: #5558e3; }

    /* ─── exam view ─────────────────────────────── */
    .exam-wrap { padding: 24px 0 60px; }
    .exam-topbar { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .exam-level-badge { font-size: .78rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; padding: 4px 10px; border-radius: 20px; }
    .exam-level-badge.junior { background: #dcfce7; color: #166534; }
    .exam-level-badge.mid    { background: #fef9c3; color: #854d0e; }
    .exam-level-badge.senior { background: #fee2e2; color: #991b1b; }
    .exam-progress-bar-outer { flex: 1; height: 6px; background: var(--border); border-radius: 3px; min-width: 80px; }
    .exam-progress-bar-inner { height: 100%; background: #6366f1; border-radius: 3px; transition: width .3s; }
    .exam-qnum { font-size: .85rem; color: var(--text-muted); white-space: nowrap; }
    .timer { font-variant-numeric: tabular-nums; font-size: 1.2rem; font-weight: 700;
      padding: 6px 14px; border-radius: 8px; background: var(--surface);
      border: 1px solid var(--border); }
    .timer.urgent { color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,.08); }
    .exit-btn { margin-left: auto; padding: 6px 14px; border: 1px solid var(--border);
      border-radius: 8px; background: transparent; cursor: pointer; color: var(--text-muted);
      font-size: .84rem; }

    /* ─── question card ─────────────────────────── */
    .q-card { background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 28px 28px 20px; margin-bottom: 20px; }
    .q-text { font-size: 1.05rem; font-weight: 600; line-height: 1.5; margin: 0 0 20px; }
    .options { display: flex; flex-direction: column; gap: 10px; }
    .opt { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
      border: 1px solid var(--border); border-radius: 10px; cursor: pointer;
      font-size: .92rem; background: transparent; text-align: left; color: var(--text);
      transition: border-color .15s, background .15s; }
    .opt:hover:not(:disabled) { background: var(--surface); border-color: #6366f1; }
    .opt.selected  { border-color: #6366f1; background: rgba(99,102,241,.09); }
    .opt.correct   { border-color: #22c55e; background: rgba(34,197,94,.1); }
    .opt.wrong     { border-color: #ef4444; background: rgba(239,68,68,.1); }
    .opt:disabled  { cursor: default; }
    .opt-letter { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; font-size: .78rem;
      font-weight: 700; flex-shrink: 0; }
    .check-btn { margin-top: 16px; padding: 10px 24px; background: #6366f1; color: #fff;
      border: none; border-radius: 8px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .check-btn:disabled { opacity: .4; cursor: default; }
    .explanation { margin-top: 14px; padding: 14px 18px; border-radius: 10px;
      font-size: .9rem; line-height: 1.55; }
    .explanation.correct { background: rgba(34,197,94,.08); border: 1px solid #22c55e; }
    .explanation.wrong   { background: rgba(239,68,68,.06); border: 1px solid #ef4444; }
    .explanation strong  { display: block; margin-bottom: 4px; }
    .next-btn { margin-top: 14px; padding: 9px 22px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 8px; cursor: pointer;
      font-size: .9rem; color: var(--text); }
    .next-btn:hover { border-color: #6366f1; color: #6366f1; }

    /* ─── results ───────────────────────────────── */
    .results { text-align: center; padding: 40px 24px 60px; }
    .score-circle { width: 130px; height: 130px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin: 0 auto 20px; border: 5px solid #6366f1; }
    .score-circle.passed { border-color: #22c55e; }
    .score-circle.failed { border-color: #ef4444; }
    .score-pct { font-size: 2.2rem; font-weight: 800; line-height: 1; }
    .score-frac { font-size: .8rem; color: var(--text-muted); margin-top: 2px; }
    .pass-badge { display: inline-block; padding: 6px 18px; border-radius: 20px;
      font-weight: 700; font-size: .9rem; margin-bottom: 16px; }
    .pass-badge.passed { background: #dcfce7; color: #166534; }
    .pass-badge.failed { background: #fee2e2; color: #991b1b; }
    .result-msg { color: var(--text-muted); max-width: 480px; margin: 0 auto 28px; line-height: 1.6; }
    .result-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { padding: 10px 22px; background: #6366f1; color: #fff; border: none;
      border-radius: 8px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .btn-primary:hover { background: #5558e3; }
    .btn-ghost { padding: 10px 22px; border: 1px solid var(--border); border-radius: 8px;
      background: transparent; cursor: pointer; font-size: .95rem; color: var(--text); }
    .btn-ghost:hover { border-color: #6366f1; color: #6366f1; }
    .review-list { max-width: 600px; margin: 32px auto 0; text-align: left; }
    .review-list h3 { font-size: .85rem; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-muted); margin-bottom: 12px; }
    .review-item { padding: 10px 14px; border-radius: 8px; border: 1px solid #ef4444;
      background: rgba(239,68,68,.04); font-size: .88rem; margin-bottom: 8px; line-height: 1.4; }
    .review-exp  { margin-top: 4px; font-size: .82rem; color: var(--text-muted); }

    .back { margin: 32px 0 8px; }
    @media (max-width: 640px) {
      .topic { grid-template-columns: 1fr; gap: 6px; }
      .exam-topbar { gap: 10px; }
    }
  `],
  template: `
    @if (view() === 'map') {
      <!-- ─── STUDY MAP ─────────────────────────────────────────────── -->
      <header class="hero">
        <span class="pill">Exam prep · certificates.dev</span>
        <h1>Pass the Angular Certification</h1>
        <p class="lead">
          The official
          <a href="https://certificates.dev/angular" target="_blank" rel="noopener">certificates.dev</a>
          Angular certification has three levels. Every topic maps to a lesson here — work top to bottom
          and you have covered the full syllabus. Then test yourself with the built-in exam simulator.
        </p>
        <p class="covered">
          <strong>{{ totalCovered() }}</strong> lessons mapped across all three exams · every topic covered.
        </p>
      </header>

      @for (lvl of levels(); track lvl.key) {
        <section class="level">
          <div class="level__head">
            <h2 [attr.data-key]="lvl.key">{{ lvl.name }}</h2>
            <span class="fmt">{{ lvl.format }}</span>
          </div>
          <p class="blurb">{{ lvl.blurb }}</p>
          <p class="count">{{ lvl.count }} lessons</p>
          <div class="topics">
            @for (t of lvl.topics; track t.topic) {
              <div class="topic">
                <div class="topic__name">{{ t.topic }}</div>
                <div class="chips">
                  @for (lesson of t.lessons; track lesson.id) {
                    <a class="chip" [class.chip--soon]="!lesson.built" [routerLink]="'/' + lesson.id">
                      {{ lesson.title }}
                    </a>
                  }
                </div>
              </div>
            }
          </div>
          <div class="sim-bar">
            <p>Ready to test yourself? 20 questions · 40 min · ≥70% to pass</p>
            <button class="sim-btn" (click)="startExam(lvl.key)">
              Simulate Exam →
            </button>
          </div>
        </section>
      }

      <p class="back"><a routerLink="/">← Back to all concepts</a></p>
    }

    @if (view() === 'exam') {
      <!-- ─── EXAM ───────────────────────────────────────────────────── -->
      <div class="exam-wrap">
        <div class="exam-topbar">
          <span class="exam-level-badge {{ examLevel() }}">{{ examLevel() }}</span>
          <div class="exam-progress-bar-outer">
            <div class="exam-progress-bar-inner"
              [style.width]="((examIndex() + 1) / examQs().length * 100) + '%'"></div>
          </div>
          <span class="exam-qnum">Q {{ examIndex() + 1 }} / {{ examQs().length }}</span>
          <span class="timer" [class.urgent]="examTimeLeft() < 120">{{ timerDisplay() }}</span>
          <button class="exit-btn" (click)="exitExam()">✕ Exit</button>
        </div>

        @if (currentQ(); as q) {
          <div class="q-card">
            <p class="q-text">{{ q.q }}</p>
            <div class="options">
              @for (opt of q.opts; track $index) {
                <button class="opt"
                  [class.selected]="examSel()[examIndex()] === $index && !examRevealed()[examIndex()]"
                  [class.correct]="examRevealed()[examIndex()] && $index === q.answer"
                  [class.wrong]="examRevealed()[examIndex()] && examSel()[examIndex()] === $index && $index !== q.answer"
                  [disabled]="examRevealed()[examIndex()]"
                  (click)="selectOpt($index)">
                  <span class="opt-letter">{{ letters[$index] }}</span>
                  {{ opt }}
                </button>
              }
            </div>

            @if (!examRevealed()[examIndex()]) {
              <button class="check-btn"
                [disabled]="examSel()[examIndex()] === null"
                (click)="checkAnswer()">
                Check Answer
              </button>
            }

            @if (examRevealed()[examIndex()]) {
              <div class="explanation"
                [class.correct]="examSel()[examIndex()] === q.answer"
                [class.wrong]="examSel()[examIndex()] !== q.answer">
                <strong>{{ examSel()[examIndex()] === q.answer ? '✓ Correct!' : '✗ Not quite.' }}</strong>
                {{ q.explanation }}
              </div>
              <button class="next-btn" (click)="nextQuestion()">
                {{ examIndex() < examQs().length - 1 ? 'Next Question →' : 'See Results →' }}
              </button>
            }
          </div>
        }
      </div>
    }

    @if (view() === 'results') {
      <!-- ─── RESULTS ────────────────────────────────────────────────── -->
      <div class="results">
        <div class="score-circle" [class.passed]="examScore() >= passThreshold()" [class.failed]="examScore() < passThreshold()">
          <span class="score-pct">{{ Math.round(examScore() / examQs().length * 100) }}%</span>
          <span class="score-frac">{{ examScore() }} / {{ examQs().length }}</span>
        </div>
        <div class="pass-badge" [class.passed]="examScore() >= passThreshold()" [class.failed]="examScore() < passThreshold()">
          {{ examScore() >= passThreshold() ? '✓ PASS' : '✗ FAIL' }}
        </div>
        <p class="result-msg">
          @if (examScore() >= passThreshold()) {
            Great work! You scored {{ examScore() }}/{{ examQs().length }} on the {{ examLevel() }} exam simulation.
            Keep reviewing the lessons for any topics you missed.
          } @else {
            You scored {{ examScore() }}/{{ examQs().length }}. You need 70% ({{ passThreshold() }}/{{ examQs().length }}) to pass. Review the explanations
            for the questions below and try again once you have studied those topics.
          }
        </p>
        <div class="result-actions">
          <button class="btn-primary" (click)="retryExam()">Try Again</button>
          <button class="btn-ghost" (click)="exitExam()">Back to Study Map</button>
        </div>

        @if (missedQs().length > 0) {
          <div class="review-list">
            <h3>Questions to review ({{ missedQs().length }})</h3>
            @for (item of missedQs(); track item.q.q) {
              <div class="review-item">
                <div>{{ item.q.q }}</div>
                <div class="review-exp">
                  <strong style="color:#6366f1">Correct: {{ item.q.opts[item.q.answer] }}</strong>
                  — {{ item.q.explanation }}
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class Certification implements OnDestroy {
  protected readonly Math = Math;
  protected readonly letters = ['A', 'B', 'C', 'D'];

  // ── Study map computed ────────────────────────────────────────────────────
  protected readonly levels = computed<ResolvedLevel[]>(() =>
    EXAM.map((lvl) => {
      const topics: ResolvedTopic[] = lvl.topics.map((t) => ({
        topic: t.topic,
        lessons: t.lessonIds
          .map((id) => {
            const lesson = LESSON_BY_ID.get(id);
            return lesson ? { id: lesson.id, title: lesson.title, built: !!lesson.loadComponent } : null;
          })
          .filter((l): l is ResolvedLesson => l !== null),
      }));
      return { ...lvl, topics, count: topics.reduce((s, t) => s + t.lessons.length, 0) };
    }),
  );

  protected readonly totalCovered = computed(() =>
    this.levels().reduce((s, l) => s + l.count, 0),
  );

  // ── Exam simulator state ──────────────────────────────────────────────────
  protected readonly view       = signal<ExamView>('map');
  protected readonly examLevel  = signal<'junior' | 'mid' | 'senior'>('junior');
  protected readonly examQs     = signal<ExamQ[]>([]);
  protected readonly examIndex  = signal(0);
  protected readonly examSel    = signal<(number | null)[]>(Array(20).fill(null));
  protected readonly examRevealed = signal<boolean[]>(Array(20).fill(false));
  protected readonly examTimeLeft = signal(2400); // 40 minutes

  protected readonly timerDisplay = computed(() => {
    const t = this.examTimeLeft();
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  protected readonly currentQ = computed(() => {
    const qs = this.examQs();
    const i  = this.examIndex();
    return qs[i] ?? null;
  });

  protected readonly examScore = computed(() => {
    const qs  = this.examQs();
    const sel = this.examSel();
    return qs.filter((q, i) => sel[i] === q.answer).length;
  });

  protected readonly passThreshold = computed(() =>
    Math.ceil(this.examQs().length * 0.7),
  );

  protected readonly missedQs = computed(() => {
    const qs  = this.examQs();
    const sel = this.examSel();
    return qs
      .map((q, i) => ({ q, selected: sel[i] }))
      .filter((item) => item.selected !== item.q.answer);
  });

  private interval: ReturnType<typeof setInterval> | null = null;

  // ── Exam controls ─────────────────────────────────────────────────────────
  startExam(level: string) {
    const lv = level as 'junior' | 'mid' | 'senior';
    const pool = EXAM_QS.filter((q) => q.level === lv);
    const size = Math.min(20, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, size);
    this.examLevel.set(lv);
    this.examQs.set(shuffled);
    this.examIndex.set(0);
    this.examSel.set(Array(size).fill(null));
    this.examRevealed.set(Array(size).fill(false));
    this.examTimeLeft.set(2400);
    this.view.set('exam');
    this.startTimer();
  }

  selectOpt(idx: number) {
    const i = this.examIndex();
    if (this.examRevealed()[i]) return;
    this.examSel.update((a) => { const n = [...a]; n[i] = idx; return n; });
  }

  checkAnswer() {
    const i = this.examIndex();
    this.examRevealed.update((a) => { const n = [...a]; n[i] = true; return n; });
  }

  nextQuestion() {
    const next = this.examIndex() + 1;
    if (next >= this.examQs().length) {
      this.endExam();
    } else {
      this.examIndex.set(next);
    }
  }

  endExam() {
    this.stopTimer();
    this.view.set('results');
  }

  exitExam() {
    this.stopTimer();
    this.view.set('map');
  }

  retryExam() {
    this.startExam(this.examLevel());
  }

  private startTimer() {
    this.stopTimer();
    this.interval = setInterval(() => {
      this.examTimeLeft.update((t) => {
        if (t <= 1) { this.endExam(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  private stopTimer() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }

  ngOnDestroy() { this.stopTimer(); }
}
