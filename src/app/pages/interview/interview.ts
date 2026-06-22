import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Level    = 'all' | 'junior' | 'mid' | 'senior';
type Category = 'all' | 'components' | 'signals' | 'rxjs' | 'forms' | 'routing' | 'testing' | 'performance' | 'architecture' | 'typescript';
type Rating   = 'easy' | 'review';
type Mode     = 'browse' | 'flashcard';

interface QA {
  id: number;
  level: Exclude<Level, 'all'>;
  category: Exclude<Category, 'all'>;
  q: string;
  a: string;
  followUp?: string;
  topicPath?: string;
}

const QA_LIST: QA[] = [
  // ======================== JUNIOR ========================
  {
    id: 1, level: 'junior', category: 'components',
    q: 'What is an Angular component?',
    a: 'A component is the basic building block of an Angular UI. It is a TypeScript class decorated with @Component that combines a template (HTML), styles (CSS), and logic. Components are composable — they can nest other components — and each manages a piece of the UI. In modern Angular, components are standalone by default, meaning they declare their own dependencies instead of relying on NgModules.',
    followUp: 'What is the difference between a component and a directive?',
  },
  {
    id: 2, level: 'junior', category: 'components',
    q: 'What is the difference between @Input() and @Output()?',
    a: '@Input() passes data DOWN from a parent component to a child. @Output() passes events UP from a child to its parent. The modern API uses input() and output() functions instead of decorators: input() creates a signal input, output() creates an OutputEmitterRef. Think of it as: inputs are what a component receives; outputs are what it announces.',
    followUp: 'How would you pass data two levels deep without prop drilling?',
  },
  {
    id: 3, level: 'junior', category: 'components',
    q: 'What are lifecycle hooks? Which ones do you use most?',
    a: 'Lifecycle hooks are methods Angular calls at specific moments in a component\'s life. The most used are: ngOnInit (runs once after inputs are set — good for data loading), ngOnChanges (runs when @Input() values change), and ngOnDestroy (runs before destruction — good for cleanup like unsubscribing). With signals, effects() and resource() replace many ngOnInit data-loading patterns. ngOnDestroy is still important for cleanup.',
  },
  {
    id: 4, level: 'junior', category: 'routing',
    q: 'How do you navigate between pages in Angular?',
    a: 'Two ways: (1) In templates, use routerLink: <a [routerLink]="[\'/products\', id]">. (2) In code, inject the Router service and call router.navigate([\'/products\', id]) or router.navigateByUrl(\'/products/1\'). Define routes in the app.routes.ts file with path/component pairs. Add a <router-outlet> where route components should render.',
  },
  {
    id: 5, level: 'junior', category: 'signals',
    q: 'What is a signal in Angular?',
    a: 'A signal is a reactive value — a wrapper around a value that notifies Angular when it changes. You create one with signal(initialValue). Read it by calling it as a function: count(). Update it with set(newValue) or update(fn). Angular automatically re-renders only the parts of the template that read a changed signal. This replaces the need for manual change detection in most cases.',
  },
  {
    id: 6, level: 'junior', category: 'forms',
    q: 'What is the difference between Template-driven and Reactive forms?',
    a: 'Template-driven forms (FormsModule, ngModel) define the form structure in the HTML template. They are simpler for basic cases but harder to unit test. Reactive forms (ReactiveFormsModule, FormControl/FormGroup) define the form model in the TypeScript class. They are more explicit, fully typed, easier to test, and required for complex forms with dynamic controls or async validation. Modern Angular projects typically use reactive forms.',
  },
  {
    id: 7, level: 'junior', category: 'rxjs',
    q: 'What is an Observable and how does it differ from a Promise?',
    a: 'A Promise resolves once and is eager (starts immediately). An Observable is lazy (starts only when subscribed) and can emit multiple values over time, then complete or error. Observables can be cancelled by unsubscribing. Angular uses Observables for HTTP, router events, form value changes, and more. RxJS operators (map, filter, switchMap) let you transform and combine Observable streams. Signals are the newer, simpler alternative for state — Observables are best for event streams.',
  },
  {
    id: 8, level: 'junior', category: 'components',
    q: 'What is dependency injection (DI)?',
    a: 'DI is a design pattern where a class declares what it needs (its dependencies) and Angular creates and provides them automatically. You declare a dependency by typing a constructor parameter or using inject(). Angular\'s DI system is hierarchical — a service provided at root is a singleton; one provided in a component\'s providers array is scoped to that component tree. This makes code modular and testable: you can swap a real service for a mock in tests.',
  },

  // ======================== MID ========================
  {
    id: 9, level: 'mid', category: 'components',
    q: 'Explain ChangeDetectionStrategy.OnPush and when you would use it.',
    a: 'By default, Angular checks every component on every change. OnPush restricts checking to when: (1) an @Input() reference changes, (2) an event fires inside the component, (3) an async pipe emits, or (4) a signal it reads changes. Use OnPush on "leaf" components that receive all their data via inputs and don\'t have internal mutable state — it dramatically reduces the number of DOM checks Angular performs. With signals, OnPush is effectively the default behavior because signals automatically track which template reads them.',
    followUp: 'What happens if you mutate an array that was passed as an input to an OnPush component?',
  },
  {
    id: 10, level: 'mid', category: 'signals',
    q: 'What is the difference between computed() and effect()?',
    a: 'computed() derives a new signal value from other signals. It is lazy (only evaluates when read), memoized (only re-runs when dependencies change), and synchronous. It returns a Signal<T>. effect() runs arbitrary side-effect code when reactive dependencies change — things like writing to localStorage, logging, or DOM manipulation. It runs asynchronously (after render). Use computed() to derive values for display; use effect() for side effects. Never use effect() to synchronize one signal\'s value to another — use computed() or linkedSignal() instead.',
    followUp: 'What is linkedSignal() and when would you use it?',
  },
  {
    id: 11, level: 'mid', category: 'rxjs',
    q: 'When would you use switchMap vs. mergeMap vs. concatMap vs. exhaustMap?',
    a: 'All four project each value to an inner Observable, but differ in how concurrent inner Observables are handled. switchMap: cancels the previous inner Observable — use for typeahead search (cancel old HTTP requests). mergeMap: runs all concurrently — use for independent parallel operations. concatMap: queues and runs in order — use when order matters (sequential uploads). exhaustMap: ignores new values while one is in flight — use for form submissions (prevent double-submit). The mnemonic: switch=cancel, merge=parallel, concat=queue, exhaust=ignore.',
  },
  {
    id: 12, level: 'mid', category: 'routing',
    q: 'What are route guards? How do you implement one?',
    a: 'Route guards control whether a user can activate, deactivate, or load a route. In modern Angular, they are functional: export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn() || inject(Router).createUrlTree([\'/login\']). Return true to allow, false to block, or a UrlTree to redirect. Add it to the route config: { path: \'dashboard\', canActivate: [authGuard] }. Common types: CanActivateFn (entering a route), CanDeactivateFn (leaving a route with unsaved changes), CanMatchFn (choosing between routes).',
    followUp: 'How would you pass a return URL to the login page so users can be redirected back after login?',
  },
  {
    id: 13, level: 'mid', category: 'forms',
    q: 'How do you write a custom validator in Angular?',
    a: 'A custom sync validator is a function that takes an AbstractControl and returns ValidationErrors | null: const noSpaces: ValidatorFn = (c) => /\\s/.test(c.value) ? { noSpaces: true } : null; Add it to a FormControl: new FormControl(\'\', [Validators.required, noSpaces]). For async validators (e.g., checking if a username exists on the server), the function returns Observable<ValidationErrors | null> and you add it as the third FormControl argument. In the template, check control.hasError(\'noSpaces\') to show an error message.',
  },
  {
    id: 14, level: 'mid', category: 'architecture',
    q: 'What is a signal store and when would you use it over a simple signal in a component?',
    a: 'A signal store is an @Injectable service that owns private writable signals, exposes public read-only signals and computed selectors, and exposes named mutation methods. Use a signal store when multiple components need to share and mutate the same state. A component-local signal is fine for UI state (tooltip open, tab index). A signal store is the right choice for cart contents, current user, or any state that outlives a single component. The invariant: private writes, public reads, named mutations.',
  },
  {
    id: 15, level: 'mid', category: 'testing',
    q: 'How do you test an Angular component that depends on a service?',
    a: 'Use TestBed.configureTestingModule with a mock service in providers. The simplest approach: provide a plain object with the methods you need faked out: { provide: AuthService, useValue: { isLoggedIn: vi.fn().mockReturnValue(true) } }. For partial mocks, inject the real service then spy on individual methods with vi.spyOn. For components that make HTTP calls, use provideHttpClientTesting() and HttpTestingController to intercept and flush mock responses synchronously.',
    followUp: 'What is the difference between a mock and a spy?',
  },
  {
    id: 16, level: 'mid', category: 'performance',
    q: 'What causes performance problems in Angular templates and how do you fix them?',
    a: 'The #1 runtime performance problem is function calls in templates: {{ filterItems() }} — Angular calls this function on every CD pass. Fix: replace with a computed() signal — it only re-evaluates when dependencies change. Other issues: (1) Missing track in @for — Angular destroys and recreates DOM nodes on reorder; fix with track item.id. (2) Not using OnPush — every component re-checks on every event. (3) Unsubscribed Observables — memory leaks and potential errors after destroy. (4) Large lists without virtual scrolling — fix with CDK ScrollingModule.',
  },
  {
    id: 17, level: 'mid', category: 'components',
    q: 'What is content projection and when do you use it?',
    a: 'Content projection lets a parent component inject HTML into a child component\'s template. The child declares <ng-content> where the projected content should appear. Use it when building reusable layout components (card, modal, tab) where the parent controls the content but the child controls the structure. Multi-slot projection uses select: <ng-content select="[header]"> to route specific parts to specific slots. The modern alternative is to use structural directives or signals-based APIs for more complex composition.',
  },
  {
    id: 18, level: 'mid', category: 'rxjs',
    q: 'How do you prevent memory leaks with RxJS subscriptions?',
    a: 'Three main approaches: (1) takeUntilDestroyed(inject(DestroyRef)) — the recommended modern way; auto-unsubscribes when the component is destroyed. (2) toSignal() — wraps an Observable in a signal and auto-unsubscribes. (3) async pipe in the template — subscribes on create, unsubscribes on destroy. Avoid manual .unsubscribe() in ngOnDestroy — it\'s verbose and easy to forget. The async pipe is the safest for template bindings; toSignal() is best when you need the value in TypeScript code.',
  },

  // ======================== SENIOR ========================
  {
    id: 19, level: 'senior', category: 'architecture',
    q: 'How would you architect state management for a large Angular application?',
    a: 'Start with the simplest thing that works. Local UI state lives in component signals. Shared feature state lives in a signal store service scoped to the feature (providers: [FeatureStore] on the feature component). App-wide state (auth, theme, notifications) lives in root-scoped signal stores. When a team grows past ~5 devs, or you need time-travel debugging, an audit log, or strict action-based flows, reach for @ngrx/signals or NgRx Store. The invariants that never change: write state privately, expose read-only, update immutably, derive with computed(). Never scatter shared state across multiple services.',
    followUp: 'How would you handle optimistic updates in a signal store?',
  },
  {
    id: 20, level: 'senior', category: 'performance',
    q: 'Walk me through how you would debug and fix a slow Angular app.',
    a: 'I start with measurement, not guesses. Step 1: Run Angular DevTools Profiler — it shows every component that ran change detection and how long each pass took. I look for components that check frequently but rarely change (add OnPush). Step 2: Run Lighthouse in incognito — identifies load-time issues (LCP, bundle size, render-blocking). Step 3: Run ng build --stats-json and open in a bundle analyzer — find oversized chunks, duplicate packages. Common fixes: OnPush everywhere, computed() instead of template methods, track by stable id, lazy routes, @defer for below-fold content, NgOptimizedImage with priority for the LCP image. I fix the highest-impact items first and re-measure.',
  },
  {
    id: 21, level: 'senior', category: 'testing',
    q: 'What is the testing pyramid and how do you apply it to an Angular app?',
    a: 'The testing pyramid (Mike Cohn) recommends: many unit tests at the bottom (fast, isolated), fewer integration tests in the middle, and few E2E tests at the top (slow, brittle). In Angular: unit tests = plain new Service() or TestBed with mocked dependencies; integration tests = TestBed with real services, real routing, real HTTP (HttpTestingController); E2E = Playwright or Cypress driving the real app. Avoid testing implementation details — test behaviors. A service test that mocks the DB can miss real SQL bugs; an HTTP integration test with HttpTestingController is a good middle ground. For components, test what the user sees (DOM output), not component state.',
  },
  {
    id: 22, level: 'senior', category: 'rxjs',
    q: 'How does the Angular resource() API differ from using switchMap + HttpClient directly?',
    a: 'resource() and rxResource() are Angular\'s built-in async data-loading primitives. They automatically expose status signals (isLoading, error, value) and tie the request lifetime to the component. switchMap + HttpClient gives you more operator flexibility but requires manual loading/error state management. resource() is ideal for "load this data based on this signal parameter" — it re-fetches automatically when the signal changes and cancels in-flight requests. switchMap is better for complex event-driven flows (debounce, retry with exponential backoff, combining multiple streams). For most data-fetching, resource() is simpler.',
  },
  {
    id: 23, level: 'senior', category: 'architecture',
    q: 'What is the Directive Composition API (hostDirectives) and what problem does it solve?',
    a: 'hostDirectives lets you attach directive behavior to a component declaratively, without the component being aware. Instead of implementing tooltip behavior in every component, you create a TooltipDirective and list it in hostDirectives: [TooltipDirective]. Angular applies the directive to the host element automatically. This solves the "behavior explosion" problem — without it, you either repeat behavior in every component or use inheritance (inflexible). hostDirectives is composition over inheritance. Inputs and outputs can be exposed through the host component with inputs/outputs arrays.',
  },
  {
    id: 24, level: 'senior', category: 'components',
    q: 'How does Angular\'s zoneless change detection differ from Zone.js, and when would you choose it?',
    a: 'Zone.js patches all async browser APIs (setTimeout, Promises, XHR, etc.) and notifies Angular after every async operation — Angular then checks the whole component tree. This is automatic but imprecise. Zoneless (provideZonelessChangeDetection()) removes Zone.js entirely. Angular only updates components when signals they read change. This reduces unnecessary CD cycles, eliminates Zone.js patching overhead, and makes it easier to reason about what triggers re-renders. Choose zoneless in new apps or when you\'ve fully migrated to signals. Legacy apps using imperative patterns (setTimeout, manual subscribe) need careful signal migration before going zoneless.',
    followUp: 'What would break if you removed Zone.js without migrating to signals?',
  },
  {
    id: 25, level: 'senior', category: 'architecture',
    q: 'What is a ControlValueAccessor and why would you implement one?',
    a: 'A ControlValueAccessor (CVA) is an interface that bridges a custom UI component to Angular\'s forms system. Without it, Angular forms can\'t read or write the value of your custom control. Implement CVA when building a custom form control (a date picker, a rich text editor, a rating widget) that should work seamlessly with both template-driven and reactive forms — including validation, touched/dirty states, and disabled states. You implement four methods: writeValue (Angular writes to your control), registerOnChange (your control notifies Angular of changes), registerOnTouched (mark as touched), setDisabledState (enable/disable your control).',
  },
  {
    id: 26, level: 'senior', category: 'performance',
    q: 'What are Core Web Vitals and which Angular patterns directly affect each?',
    a: 'LCP (Largest Contentful Paint, target <2.5s): how fast the biggest visible element appears. Fix: NgOptimizedImage with [priority] on the hero image, SSR for above-fold content, don\'t lazy-load the LCP component. INP (Interaction to Next Paint, target <200ms): how fast the UI responds to clicks. Fix: short event handlers, OnPush + signals for fine-grained updates, avoid synchronous blocking in event handlers, use afterNextRender for DOM work. CLS (Cumulative Layout Shift, target <0.1): unexpected layout shifts. Fix: explicit image width/height (NgOptimizedImage does this), skeleton placeholders with correct dimensions in @defer.',
  },
  {
    id: 27, level: 'senior', category: 'signals',
    q: 'How would you implement an optimistic update with signals?',
    a: 'Optimistic updates immediately apply the change to the UI, then confirm or roll back based on the server response. Pattern: (1) Apply the change locally first: this._items.update(l => [...l, newItem]); (2) Make the HTTP call; (3) On success, optionally update with the server-returned ID; (4) On error, roll back: this._items.update(l => l.filter(i => i.id !== newItem.id)); and show an error. Signals make this clean because you can update and roll back atomically. Store a "pending" flag signal alongside the state if you need to disable interaction during the round-trip.',
  },
  {
    id: 28, level: 'senior', category: 'architecture',
    q: 'How do you handle cross-cutting concerns (logging, error handling, auth) in Angular?',
    a: 'HTTP interceptors are the right tool for HTTP cross-cutting concerns: auth token attachment, global error handling, request logging, and retry logic. Functional interceptors with withInterceptors([...]) are the modern API. For non-HTTP concerns: a global ErrorHandler service (extend ErrorHandler) catches uncaught errors app-wide. For feature-level cross-cutting behavior, use hostDirectives or custom attribute directives. For auth state accessible anywhere, a root-scoped AuthService signal store. The key principle: cross-cutting concerns should not leak into components or services — keep them in interceptors, directives, and error handlers.',
  },
  {
    id: 29, level: 'senior', category: 'testing',
    q: 'How would you test an HTTP interceptor?',
    a: 'Register the interceptor with provideHttpClient(withInterceptors([myInterceptor])) in the test module, then make real HTTP calls through HttpClient and intercept them with HttpTestingController. The interceptor runs transparently. Assert on the outgoing request headers, body, or URL. For an auth interceptor: inject a mock AuthService, make a call, use http.expectOne() to capture the request, and assert that req.request.headers.get(\'Authorization\') equals \'Bearer my-token\'. Test the fallback case (no token) separately. Always call http.verify() in afterEach.',
  },
  {
    id: 30, level: 'senior', category: 'architecture',
    q: 'What is the difference between NgRx Store, @ngrx/signals signalStore, and a hand-rolled signal store service?',
    a: 'Hand-rolled signal store: the minimal approach — @Injectable, private signals, computed selectors, named methods. No library. Best for most apps. @ngrx/signals signalStore: a structured factory function that generates the same pattern with conventions — withState(), withComputed(), withMethods(), plus entity helpers. Good when you want consistency across a large team without the Redux boilerplate. NgRx Store: full Redux — actions, reducers, selectors, effects. Provides time-travel DevTools, strict action log, and ecosystem plugins. Overhead is justified for very large apps or teams that need an auditable action trail. Choose the simplest option that meets your team\'s needs — you can always escalate.',
  },

  // ======================== JUNIOR (continued) ========================
  {
    id: 31, level: 'junior', category: 'components',
    q: 'What is two-way binding in Angular and how do you use it?',
    a: 'Two-way binding keeps a component property and a template element in sync in both directions. The classic syntax [(ngModel)]="name" reads the input value into name AND writes name back to the input when it changes. The [()] "banana in a box" syntax is shorthand for [value]="name" (property binding down) plus (valueChange)="name = $event" (event binding up). In modern Angular you can achieve the same with the model() signal function: readonly value = model(\'\') — changes from parent update the signal, changes emitted by the component update the parent.',
    followUp: 'How does model() differ from input() for two-way binding?',
  },
  {
    id: 32, level: 'junior', category: 'components',
    q: 'What are Angular pipes and how do you create a custom one?',
    a: 'Pipes transform template values without modifying the underlying data. Built-in examples: {{ price | currency }}, {{ date | date:"short" }}, {{ name | uppercase }}. To create a custom pipe: decorate a class with @Pipe({ name: \'truncate\', standalone: true }) and implement the PipeTransform interface\'s transform(value, ...args) method. Example: transform(text: string, limit = 100): string { return text.length > limit ? text.slice(0, limit) + \'...\' : text; }. Use the pipe in templates: {{ description | truncate:50 }}. Pure pipes (the default) only re-run when the input reference changes — this is a key performance optimization.',
    followUp: 'What is the difference between a pure and impure pipe?',
  },
  {
    id: 33, level: 'junior', category: 'components',
    q: 'What is @ViewChild and when do you use it?',
    a: '@ViewChild queries the component\'s own template for a child element, component, or directive. Declare it as: @ViewChild(\'myInput\') inputRef!: ElementRef<HTMLInputElement>. The element is available in ngAfterViewInit (NOT ngOnInit — the view has not rendered yet). Common uses: programmatically focusing an input, calling a method on a child component, reading a DOM property, or accessing a template reference variable. Modern alternative: use viewChild() signal function — it is synchronous once the view is created and does not require lifecycle hooks.',
  },
  {
    id: 34, level: 'junior', category: 'signals',
    q: 'What is the difference between signal(), input(), and model()?',
    a: 'signal() creates a general-purpose reactive value: you own it, you read and write it freely. input() creates a read-only signal that receives its value from a parent component\'s property binding — the component cannot write to it directly. model() is a two-way input/output pair: the parent binds down with [(value)], the component can read AND write it, and changes propagate back up to the parent. Use signal() for internal component state. Use input() for data flowing from parent to child. Use model() for form controls or any component where the parent should stay in sync with the child\'s value.',
    followUp: 'How does input() differ from the older @Input() decorator?',
  },
  {
    id: 35, level: 'junior', category: 'forms',
    q: 'How do you display validation error messages for a reactive form control?',
    a: 'After defining controls with validators, check the control\'s state in the template. Example: show a required error only after the user has touched the field: @if (emailCtrl.invalid && emailCtrl.touched) { <p>Email is required</p> }. For specific errors: @if (emailCtrl.hasError(\'email\') && emailCtrl.dirty) { <p>Enter a valid email</p> }. Key states: invalid/valid, touched/untouched (has the user left the field?), dirty/pristine (has the user typed anything?). Showing errors too early (before touched) creates a bad UX. Showing them after submit is also valid — check the form\'s submitted state.',
  },
  {
    id: 36, level: 'junior', category: 'rxjs',
    q: 'What is the async pipe and why is it preferred over manually subscribing?',
    a: 'The async pipe subscribes to an Observable or Promise, renders the latest emitted value, and automatically unsubscribes when the component is destroyed. It eliminates: (1) the manual subscribe/unsubscribe boilerplate, (2) the memory leak risk of forgetting to unsubscribe, and (3) the extra class property to hold the subscription. It also triggers change detection when a new value arrives — important for OnPush components. Modern alternative: toSignal(users$) does the same but returns a signal you can use directly in templates without the async pipe syntax.',
    followUp: 'What happens if you apply async pipe to an Observable that never emits?',
  },
  {
    id: 37, level: 'junior', category: 'components',
    q: 'How does the new @if control flow syntax differ from *ngIf?',
    a: '@if is the new built-in control flow syntax introduced in Angular 17. Key differences: (1) No import needed — @if is part of the template compiler, not a directive you import. (2) Easier else: @if (show) { <A /> } @else { <B /> } vs the verbose <ng-template #elseBlock>. (3) @else if chaining without nested templates. (4) Better TypeScript type narrowing inside the block — Angular knows the type is non-null inside @if (user). (5) Slightly better performance since it is a first-class compiler construct. *ngIf still works but @if is the modern way.',
  },
  {
    id: 38, level: 'junior', category: 'routing',
    q: 'What is the difference between using routerLink and a plain <a href="..."> tag in Angular?',
    a: 'A plain <a href="/products"> causes a full page reload — the browser fetches the page from the server, destroying all Angular state. routerLink="/products" performs client-side navigation — Angular\'s Router updates the URL and renders the new component WITHOUT reloading, keeping all Angular state, services, and animations intact. routerLink also adds the active class automatically when the route matches (with routerLinkActive). Always use routerLink for in-app navigation. Use plain href only for external links (other domains) or to force a hard reload intentionally.',
  },

  // ======================== MID (continued) ========================
  {
    id: 39, level: 'mid', category: 'architecture',
    q: 'What is the difference between providedIn: \'root\' and providing a service in a component\'s providers array?',
    a: 'providedIn: \'root\' registers the service with the root injector — one singleton instance is shared across the entire app. Providing in a component\'s providers: [MyService] creates a NEW instance scoped to that component\'s subtree. Every component in that subtree shares the scoped instance, and the instance is destroyed when the component is destroyed. Use root for app-wide singletons (auth, theme, API). Use component providers for feature-scoped state (e.g., an edit form with its own unsaved-changes service that should not leak outside the dialog).',
    followUp: 'What happens to component-scoped services when the component is destroyed?',
  },
  {
    id: 40, level: 'mid', category: 'routing',
    q: 'How do you implement lazy loading in Angular and why does it matter?',
    a: 'Lazy loading defers loading a route\'s code until the user first navigates to it. For standalone components: { path: \'admin\', loadComponent: () => import(\'./admin/admin\').then(m => m.AdminComponent) }. For a group of routes: { path: \'admin\', loadChildren: () => import(\'./admin/admin.routes\').then(m => m.ADMIN_ROUTES) }. The Angular CLI creates a separate JavaScript chunk for each lazy route. On first load, only the shell and the entry route download — typically reducing the initial bundle by 40-70%. Later, Angular downloads the lazy chunk only when needed.',
    followUp: 'How would you preload only critical routes while leaving others truly lazy?',
  },
  {
    id: 41, level: 'mid', category: 'performance',
    q: 'What is the @defer block and how does it improve application performance?',
    a: '@defer lazily loads a component and its dependencies only when a trigger condition is met. The @placeholder block renders while the component is not yet loaded; @loading shows while the chunk is downloading; @error shows if loading fails. Triggers: on idle (browser idle), on viewport (element enters view), on interaction (click or focus), on timer(2s), when(condition), and prefetch equivalents. Key benefit: heavy components (charts, editors, complex forms) are excluded from the initial bundle entirely. Use @defer aggressively for below-the-fold content.',
    followUp: 'How do you test a component that contains @defer blocks?',
  },
  {
    id: 42, level: 'mid', category: 'architecture',
    q: 'How do you share state between two sibling components that have no direct parent-child relationship?',
    a: 'Three approaches in increasing order of weight: (1) Lift state up — move the state to the nearest common ancestor component and pass it down via inputs and outputs. (2) Shared signal store service — an @Injectable with private signal state, exposed as readonly signals and mutated via named methods. Both siblings inject the same service and share its state reactively. (3) Full state management library (@ngrx/signals, NgRx) — adds structure and DevTools for large teams. Avoid the RxJS Subject-as-event-bus pattern; signal stores are cleaner.',
  },
  {
    id: 43, level: 'mid', category: 'forms',
    q: 'How does FormArray work and when would you use it over FormGroup?',
    a: 'FormArray manages a dynamic, ordered list of AbstractControls where the count can change at runtime. Use it when the form has a variable number of items — "add another phone number", "list of team members", "dynamic questionnaire". FormGroup is for a fixed, named set of controls; FormArray is for a numbered list. Key methods: push(control) to append, insert(index, control) to add at a position, removeAt(index) to delete, and clear() to empty it. Always use FormArray\'s own methods, never mutate .controls directly.',
  },
  {
    id: 44, level: 'mid', category: 'signals',
    q: 'How does the resource() API work and when would you use it over HttpClient.get() directly?',
    a: 'resource() is Angular\'s built-in async data-loading primitive. You give it a request function that returns a Promise and Angular manages the full lifecycle: loading state (isLoading signal), error state (error signal), and the value (value signal). When the request parameter signal changes, it automatically cancels any in-flight request and starts a new one. Use resource() for "fetch this data based on this signal param". Use HttpClient directly when you need complex RxJS operators (retry, debounce, merge with other streams).',
    followUp: 'What is the difference between resource() and rxResource()?',
  },
  {
    id: 45, level: 'mid', category: 'components',
    q: 'How does content projection with ng-content work and when would you use it?',
    a: 'Content projection lets a parent component inject HTML into a child\'s template. The child declares <ng-content /> as a slot; the parent fills it: <app-card><h2>Title</h2></app-card>. Multi-slot projection uses select to target specific parts: <ng-content select="[header]" /> and <ng-content select="[body]" />. The parent marks its content with the matching attribute: <span header>Title</span>. Use it for reusable layout components (cards, modals, tabs, accordions). The projected content is owned by the PARENT\'s component context — it can use the parent\'s signals and methods.',
  },
  {
    id: 46, level: 'mid', category: 'testing',
    q: 'What is the difference between shallow rendering and deep rendering in an Angular TestBed test?',
    a: 'Deep rendering compiles the full component tree including all child components — useful for integration tests but slow and requires all child dependencies to be provided. Shallow rendering (using NO_ERRORS_SCHEMA or CUSTOM_ELEMENTS_SCHEMA) treats unknown elements as harmless placeholders — child components are not compiled. This is fast but can miss integration issues. Best practice: use shallow rendering for unit tests of a single component\'s logic; use full deep rendering for integration tests that cover a feature slice.',
  },
  {
    id: 47, level: 'mid', category: 'rxjs',
    q: 'What is the difference between a hot and a cold Observable?',
    a: 'A cold Observable starts its producer on each new subscription — each subscriber gets its own independent stream from the beginning. HTTP requests are cold: each subscribe makes a new HTTP call. A hot Observable\'s producer runs regardless of subscribers — like a DOM event stream or a WebSocket. Subscribing late to a hot Observable means you miss past emissions. BehaviorSubject is "warm" — it is hot but replays the last value to new subscribers. In practice: http.get() is cold (make it hot with shareReplay(1)); fromEvent(window, click) is hot.',
    followUp: 'How would you convert a cold HTTP Observable to hot so all subscribers share one request?',
  },
  {
    id: 48, level: 'mid', category: 'architecture',
    q: 'How do you handle errors globally in an Angular application?',
    a: 'Two complementary layers: (1) HTTP interceptors — catch all failed HTTP responses in one place: use catchError in an HttpInterceptorFn, log to a monitoring service, optionally retry, and return EMPTY or a fallback. (2) Angular\'s ErrorHandler — extend it to catch any uncaught JavaScript error (including errors thrown outside HTTP): { provide: ErrorHandler, useClass: GlobalErrorHandler }. Inside, log to Sentry/Datadog and optionally navigate to an error page. Avoid putting try/catch in every component — that is the wrong level.',
  },
  {
    id: 49, level: 'mid', category: 'components',
    q: 'What is ViewEncapsulation and how does it affect component styling?',
    a: 'ViewEncapsulation controls how Angular scopes component CSS. Emulated (the default): Angular adds unique attribute selectors to every element in the component and rewrites the CSS to match — styles are effectively scoped without Shadow DOM. ShadowDom: uses the browser\'s native Shadow DOM for true style isolation. None: styles are written to the document head as globals — they affect every element in the app. Use Emulated for most components. Use None only for a global theme stylesheet.',
    followUp: 'How do you style a child component\'s internals from a parent when ViewEncapsulation.Emulated is on?',
  },
  {
    id: 50, level: 'mid', category: 'routing',
    q: 'What is a Route Resolver and should you still use it in modern Angular?',
    a: 'A resolver pre-fetches data before a route activates — the router waits for it to complete before rendering the component. Pro: no loading spinner inside the component. Con: navigation visually "hangs" while waiting. Modern recommendation: prefer loading state inside the component using resource() or a signal store with isLoading signal. This gives immediate navigation with an inline skeleton/spinner, which feels faster. Resolvers are still valid for short-lived data fetches where a brief navigation pause is acceptable.',
  },

  // ======================== SENIOR (continued) ========================
  {
    id: 51, level: 'senior', category: 'architecture',
    q: 'How do you implement automatic JWT refresh using an HTTP interceptor?',
    a: 'The interceptor handles 401 responses. Pattern: intercept every request, and if a 401 comes back, attempt a token refresh and replay the original request with the new token. Critical detail: queue all parallel requests that arrive during the refresh to prevent N simultaneous refresh calls. Implementation: maintain a refreshing$ BehaviorSubject or signal. When you get a 401 and are not already refreshing: call the refresh endpoint, store the new token, then switchMap back to the original request. If the refresh fails, log the user out and return EMPTY.',
    followUp: 'What is the risk of using localStorage vs HttpOnly cookies for storing JWTs?',
  },
  {
    id: 52, level: 'senior', category: 'performance',
    q: 'What is Angular\'s incremental hydration and how does it differ from full hydration?',
    a: 'Full hydration (Angular 17) serializes server-rendered HTML and hydrates it client-side — Angular attaches event listeners without re-rendering DOM. The cost: JavaScript for the entire app downloads even if the user never interacts with most of it. Incremental hydration (Angular 19+) combines SSR with @defer: server renders everything, but client hydration is deferred per block — components only hydrate when their trigger fires (idle, viewport, interaction). Most components may never hydrate at all, dramatically reducing Time to Interactive.',
    followUp: 'What is the "void zone" in Angular SSR and how does it affect event replay?',
  },
  {
    id: 53, level: 'senior', category: 'architecture',
    q: 'What are standalone components and how do they change the architecture versus NgModule-based apps?',
    a: 'Standalone components (default since Angular 17) declare their own dependencies in imports: [] instead of relying on an NgModule. Key changes: (1) No shared modules — each component explicitly imports what it uses, enabling better tree-shaking. (2) bootstrapApplication() replaces AppModule. (3) provideRouter(), provideHttpClient() replace module imports. (4) Lazy loading uses loadComponent or loadChildren with a routes array. (5) Testing is easier — TestBed imports the component directly without NgModule ceremony.',
    followUp: 'Can you mix standalone and NgModule-based components in the same app?',
  },
  {
    id: 54, level: 'senior', category: 'testing',
    q: 'How would you test a component that contains @defer blocks?',
    a: '@defer blocks are deferred by default in tests — they render in the @placeholder state. To test the loaded state, use the DeferBlockFixture API: const deferBlocks = await fixture.getDeferBlocks(); await deferBlocks[0].render(DeferBlockState.Complete). This transitions the block synchronously in the test. For @loading state: DeferBlockState.Loading. For @error state: DeferBlockState.Error. Always test the @placeholder and @error states too — they are the user-facing fallbacks.',
  },
  {
    id: 55, level: 'senior', category: 'rxjs',
    q: 'What are marble tests and how do you use TestScheduler to test RxJS operators?',
    a: 'Marble tests let you specify Observable timelines using ASCII diagrams and assert that an operator produces the expected output timeline. TestScheduler from rxjs/testing runs time virtually without async delays. Marble syntax: "-" = 10ms frame, "|" = complete, "#" = error, letters = emitted values. Use marble tests for custom operators, complex switchMap/debounce chains, and any time-dependent RxJS logic — they make timing bugs visible and reproducible.',
    followUp: 'How do you test an Observable that uses a real delay() operator without real waiting?',
  },
  {
    id: 56, level: 'senior', category: 'signals',
    q: 'What is the inject() function and what new composition patterns does it enable?',
    a: 'inject() retrieves a dependency from the current injection context without needing a constructor parameter. It can be called in field initializers, factory functions, and any code running inside a DI context. Key composition pattern: "injectable composables" (similar to React hooks). Example: function withPagination() { const page = signal(1); const router = inject(Router); return { page, navigate: () => router.navigate([], { queryParams: { page: page() } }) }; }. A component calls withPagination() in its constructor and gets a fully wired paginator — replacing mixins and inheritance.',
    followUp: 'What happens if you call inject() outside an injection context?',
  },
  {
    id: 57, level: 'senior', category: 'architecture',
    q: 'How would you structure a large Angular codebase in a monorepo for maximum reuse and build performance?',
    a: 'Using Nx or Angular workspace libraries: split into feature libraries (feature-products, feature-auth), UI libraries (ui-button, ui-table), data-access libraries, and utility libraries. Each library has a clear public API (index.ts barrel) and enforced import constraints (Nx module boundaries). Build performance: Nx computes a dependency graph and only rebuilds/retests affected libraries. Caching (local + remote) skips unchanged libraries. The import constraints replace PR review as the enforcement mechanism for architectural rules.',
    followUp: 'What is the difference between a publishable and a buildable library in an Angular Nx workspace?',
  },
  {
    id: 58, level: 'senior', category: 'performance',
    q: 'How do you analyze and systematically reduce an Angular application\'s bundle size?',
    a: 'Step 1: Measure — run ng build --stats-json then open in webpack-bundle-analyzer. Identify the largest chunks. Step 2: Find quick wins — importing all of a large library instead of tree-shakeable subpaths, duplicate package versions. Step 3: Route split — every lazy route becomes its own chunk. Step 4: Component split with @defer — heavy components (charts, map, editor) become separate chunks. Step 5: Set budgets in angular.json to catch regressions in CI. Step 6: Measure again.',
  },
  {
    id: 59, level: 'senior', category: 'components',
    q: 'How does the Directive Composition API (hostDirectives) work and what architectural patterns does it enable?',
    a: 'hostDirectives: [CdkDrag, FocusTrapDirective] in @Component attaches these directive behaviors to the component without any class-level coupling. Inputs and outputs can be forwarded: hostDirectives: [{ directive: TooltipDirective, inputs: ["text: tooltipText"] }]. This enables true composition over inheritance — instead of a TooltipButtonComponent that extends TooltipDirective, you compose them. It solves the "behavior explosion" problem: mix and match orthogonal behaviors without inheritance chains.',
    followUp: 'What limitations does hostDirectives have compared to a component base class?',
  },
  {
    id: 60, level: 'senior', category: 'architecture',
    q: 'What is the strategy for migrating a large Zone.js-based Angular app to zoneless change detection?',
    a: 'Migration strategy: (1) Add provideExperimentalZonelessChangeDetection() alongside Zone.js first (dual mode). (2) Enable Angular DevTools profiler and look for components that stop updating — these have undetected async patterns. (3) Migrate components one by one: replace subscribe() callbacks that set properties with toSignal(), replace template methods with computed(), replace ngOnInit data loads with resource(). (4) Once all components pass E2E tests in dual mode, remove Zone.js from polyfills. Key risk: third-party libraries that rely on Zone.js patching.',
    followUp: 'What does provideExperimentalZonelessChangeDetection() do differently from provideZoneChangeDetection()?',
  },

  // ─── COMPONENTS 61-75 ────────────────────────────────────────────────────────
  {
    id: 61, level: 'junior', category: 'components',
    q: 'What is the difference between a component and a directive in Angular?',
    a: 'A component is a directive with a template — it always has a `template` or `templateUrl` and renders a view into the DOM. A directive has no template; it decorates an existing element by modifying its behaviour, appearance, or structure. Structural directives (*ngIf, *ngFor) reshape the DOM by adding/removing elements via ViewContainerRef. Attribute directives ([highlight], [tooltip]) change the host element\'s properties or classes. Every Angular component is internally a directive, but not every directive is a component.',
    followUp: 'Can you apply a directive and a component to the same element?',
  },
  {
    id: 62, level: 'junior', category: 'components',
    q: 'What is `ng-content` and how does content projection work?',
    a: '`<ng-content>` is a placeholder inside a component\'s template where the parent passes in child DOM. Example: a `<card>` component with `<ng-content>` renders whatever is between `<app-card>...</app-card>` in the parent. Multiple named slots use `select`: `<ng-content select="[header]">` matches `<span header>Title</span>`. Default (unnamed) `<ng-content>` catches everything not matched by a named slot. Content is projected, not copied — Angular\'s view hierarchy keeps it as a child of the parent component.',
    followUp: 'How does ngProjectAs change which slot projected content lands in?',
  },
  {
    id: 63, level: 'mid', category: 'components',
    q: 'Explain the Angular component lifecycle in order.',
    a: 'In order: (1) constructor — DI only, no inputs yet. (2) ngOnChanges — called when input-bound properties change, including before ngOnInit on first set. (3) ngOnInit — inputs are available; initialise component state. (4) ngDoCheck — every change detection cycle, for custom detection. (5) ngAfterContentInit — projected content (`@ContentChild`) is initialised. (6) ngAfterContentChecked — after projected content is checked. (7) ngAfterViewInit — component\'s own view and `@ViewChild` queries are resolved. (8) ngAfterViewChecked — after view is checked. (9) ngOnDestroy — cleanup subscriptions, timers, event listeners.',
    followUp: 'Which lifecycle hooks are called only once vs every change detection cycle?',
  },
  {
    id: 64, level: 'mid', category: 'components',
    q: 'What is ViewEncapsulation and what are its three modes?',
    a: '`ViewEncapsulation` controls how component styles are scoped. (1) `Emulated` (default) — Angular adds unique attributes like `[_ngcontent-abc]` to the component\'s elements and scopes CSS rules to those attributes, preventing style leakage. (2) `ShadowDom` — uses the browser\'s native Shadow DOM for true style isolation; external styles cannot penetrate unless using CSS custom properties. (3) `None` — styles are added globally with no scoping, able to affect any element on the page. Use `None` sparingly; use `Emulated` for most components; use `ShadowDom` only when full isolation is required.',
    followUp: 'How do you style a child component\'s internals from a parent when using Emulated encapsulation?',
  },
  {
    id: 65, level: 'mid', category: 'components',
    q: 'How do @ViewChild and @ContentChild differ?',
    a: '`@ViewChild` queries the component\'s own template (its view) — elements in the component\'s `template` or `templateUrl`. Available from `ngAfterViewInit`. `@ContentChild` queries content projected into the component via `<ng-content>` — DOM that the parent passes in. Available from `ngAfterContentInit`. Key rule: use `@ViewChild` for things you put in your own template; use `@ContentChild` for things your consumers insert. Both use a template reference variable (`#myRef`), component/directive type, or provider token as the selector.',
    followUp: 'What is the static: true option on ViewChild and when do you need it?',
  },
  {
    id: 66, level: 'senior', category: 'components',
    q: 'How do you dynamically create and insert a component at runtime?',
    a: 'Use `ViewContainerRef.createComponent(ComponentClass)`. Inject `ViewContainerRef` via DI or get it from a `@ViewChild("anchor", { read: ViewContainerRef })`. In Angular 13+ you no longer need a module: `const ref = this.vcr.createComponent(AlertComponent); ref.instance.message = "Hello"; ref.instance.closed.subscribe(() => ref.destroy())`. The component is appended to the container\'s anchor. Alternatively, `@defer` handles lazy loading declaratively. For modal/dialog services, this is the standard pattern.',
    followUp: 'What is the difference between createComponent() and createEmbeddedView()?',
  },
  {
    id: 67, level: 'junior', category: 'components',
    q: 'What is the difference between one-way property binding and two-way binding in Angular templates?',
    a: 'One-way property binding `[value]="expr"` flows data FROM the component class TO the DOM/child component — only the parent can change it. Two-way binding `[(ngModel)]="prop"` is syntactic sugar for `[ngModel]="prop" (ngModelChange)="prop=$event"` — it both sets the DOM value from the class AND updates the class property when the user changes the value. In Angular\'s modern signal world, two-way binding also works with `model()` inputs: `[(count)]="myCount"`. Use one-way binding as the default; two-way only when the child needs to push changes back to the parent.',
    followUp: 'Explain the "banana in a box" `[()]` syntax mnemonic.',
  },
  {
    id: 68, level: 'mid', category: 'components',
    q: 'What is the `DestroyRef` service and how does it replace ngOnDestroy?',
    a: '`DestroyRef` (Angular 16+) is an injectable service that lets you register cleanup callbacks in any function or service — not just in lifecycle hooks. `inject(DestroyRef).onDestroy(() => subscription.unsubscribe())` runs the callback when the current injection context (component, directive, service, guard) is destroyed. This enables composable, reusable cleanup logic extracted into standalone functions outside the class. The `takeUntilDestroyed()` RxJS operator uses it internally. It replaces the boilerplate `implements OnDestroy { ngOnDestroy() { ... } }` pattern.',
    followUp: 'Can DestroyRef be used in a service with providedIn: root?',
  },
  {
    id: 69, level: 'junior', category: 'components',
    q: 'What is the Angular async pipe and what problem does it solve?',
    a: 'The `async` pipe subscribes to an Observable or Promise and returns its latest emitted value in the template. It also automatically unsubscribes when the component is destroyed — eliminating manual subscription management. `{{ user$ | async }}` is equivalent to subscribing in ngOnInit and storing the value in a property, but safer. It also triggers change detection when the value arrives, which is critical with `OnPush` components. Best practice: use the async pipe for all template-driven subscriptions and avoid manual `.subscribe()` in components.',
    followUp: 'What happens to the async pipe\'s subscription when the component is inside an *ngIf that becomes false?',
  },
  {
    id: 70, level: 'senior', category: 'components',
    q: 'How does the Directive Composition API differ from Angular Mixins or class inheritance?',
    a: '`hostDirectives` composes behaviour at the template level without class inheritance. Multiple orthogonal behaviours (drag, tooltip, focus-trap) can be composed on any component without creating a complex inheritance tree. Inputs and outputs from composed directives can be forwarded or aliased. Unlike class inheritance, the component class has no runtime reference to the composed directives — they are applied by Angular\'s DI machinery. This avoids the fragile base class problem and makes behaviours independently testable. Mixins require TypeScript class intersection types and can cause naming conflicts.',
    followUp: 'Can a directive applied via hostDirectives access the host component\'s properties?',
  },
  {
    id: 71, level: 'mid', category: 'components',
    q: 'What is ChangeDetectionStrategy.OnPush and when should you use it?',
    a: 'With `OnPush`, Angular only runs change detection for a component when: (1) one of its `@Input()` references changes, (2) an event originates from the component or its children, (3) an async pipe in its template receives a new value, or (4) `ChangeDetectorRef.markForCheck()` is called explicitly. Without OnPush, Angular checks the component on every global detection cycle. Use OnPush on every leaf and presentational component to dramatically reduce CPU time. It works seamlessly with signals and `async` pipe. The main pitfall: mutating an input object instead of replacing it will not trigger detection.',
    followUp: 'How do you trigger change detection manually in an OnPush component?',
  },
  {
    id: 72, level: 'junior', category: 'components',
    q: 'What are Angular pipes and how do you create a custom one?',
    a: 'Pipes transform values in templates: `{{ birthday | date:"shortDate" }}`. They are pure functions by default — called only when the input reference changes. Create a custom pipe with `@Pipe({ name: "truncate", standalone: true })` on a class that implements `PipeTransform` with a `transform(value: string, limit = 50): string` method. Import it in the component\'s `imports` array. For pipes that depend on mutable state or external data, mark as `pure: false` (impure) — but use sparingly as impure pipes run on every change detection cycle.',
    followUp: 'What is the difference between a pure and impure pipe?',
  },
  {
    id: 73, level: 'senior', category: 'components',
    q: 'Explain the `afterRender` and `afterNextRender` APIs and when to use them.',
    a: '`afterNextRender(callback)` fires exactly once after the next browser paint cycle — use it for one-time DOM setup like initialising a third-party chart library or measuring element dimensions on first render. `afterRender(callback)` fires after every render cycle for the lifetime of the injection context — use it for work that must run after every DOM update, like re-measuring a resizable element. Both are browser-only (no-op during SSR) and should be registered in a constructor or field initialiser within an injection context. They accept phase options (`earlyRead`, `write`, `mixedReadWrite`, `read`) to batch DOM operations and avoid layout thrashing.',
    followUp: 'Why is it important to use the correct phase option in afterRender?',
  },
  {
    id: 74, level: 'mid', category: 'components',
    q: 'How do you share state between sibling components without a shared parent?',
    a: 'The correct approach is a shared service provided at the right scope. Create `@Injectable({ providedIn: "root" })` (global) or provide it in a common ancestor\'s `providers` array (scoped). Store state as signals: `private _state = signal(initialValue); readonly state = this._state.asReadonly()`. Both siblings inject the service and read `state()` reactively. Alternatives: NgRx/store for complex state, router query params for shareable/bookmarkable state, or `@Input`/`@Output` chains routed through the parent if the hierarchy is shallow. Avoid using a Subject in a service as a pub/sub bus — prefer signals for their glitch-free synchronous derivation.',
    followUp: 'What is the difference between providedIn: "root" and providedIn: "any"?',
  },
  {
    id: 75, level: 'junior', category: 'components',
    q: 'What is the difference between `@Component({ standalone: true })` and module-based components?',
    a: 'Standalone components (Angular 14+, default in Angular 17+) declare their own dependencies in their `imports` array directly — no `NgModule` needed. Module-based components belong to a `@NgModule`\'s `declarations` array; their dependencies come from the module\'s imports. Standalone is simpler: one file, explicit imports, tree-shakeable, easier to test. Angular 17+ makes standalone the default; the schematics no longer generate NgModules. When mixing, a standalone component can be added to a module\'s `imports`; a non-standalone component can be wrapped with `createComponent()` or bootstrapped via `importProvidersFrom`.',
    followUp: 'How do you lazy-load a standalone component with the Angular router?',
  },

  // ─── SIGNALS 76-90 ───────────────────────────────────────────────────────────
  {
    id: 76, level: 'junior', category: 'signals',
    q: 'What is a signal in Angular and how does it differ from a BehaviorSubject?',
    a: 'A signal is a reactive primitive that holds a value and notifies consumers when it changes — `const count = signal(0); count.set(1); count()`. It is synchronous, glitch-free, and automatically tracked inside reactive contexts (templates, computed, effect). A `BehaviorSubject` is an RxJS Observable with a current-value cache — it requires `.subscribe()` / `async` pipe, produces asynchronous push notifications, and relies on Zone.js or explicit `markForCheck()` for Angular rendering. Signals integrate directly into Angular\'s change detection without Zone.js, making them ideal for component state in the modern signal-based architecture.',
    followUp: 'How do you convert an existing BehaviorSubject to a signal in incremental migration?',
  },
  {
    id: 77, level: 'junior', category: 'signals',
    q: 'What is computed() and what are its rules?',
    a: '`computed(() => expression)` creates a lazy, memoised, read-only signal derived from other signals. Angular tracks which signals the expression reads and re-runs the computation ONLY when those dependencies change. Key rules: (1) it is read-only — you cannot call `.set()` on it. (2) it is lazy — the expression does not run until the computed is first read. (3) it is cached — it does not re-run if dependencies have not changed. (4) it is glitch-free — Angular guarantees that all dependencies are fully updated before the computed re-runs. Never write to signals inside computed() — use effect() for side effects.',
    followUp: 'Can computed() read from an Observable or only from other signals?',
  },
  {
    id: 78, level: 'mid', category: 'signals',
    q: 'When would you use effect() and what are its pitfalls?',
    a: '`effect(() => { ... })` runs code as a side effect when signals it reads change — for example, saving to localStorage, logging, or syncing with a non-reactive third-party library. Pitfalls: (1) by default, writing to a signal inside an effect throws — use `allowSignalWrites: true` as a last resort, but prefer computed() or linkedSignal(). (2) effects run asynchronously after rendering — not synchronously on signal change. (3) using effects to copy one signal value to another (`effect(() => b.set(a()))`) is an anti-pattern — use computed() instead. Always register effects in a constructor or field to tie them to the component\'s lifetime.',
    followUp: 'How do you perform cleanup inside an effect when it re-runs?',
  },
  {
    id: 79, level: 'mid', category: 'signals',
    q: 'Explain the input(), output(), and model() signal APIs.',
    a: '`input<T>()` replaces `@Input()` and returns a read-only signal the parent binds to: `readonly name = input<string>("default")`. Use `input.required<T>()` to enforce binding. `output<T>()` replaces `@Output() new EventEmitter<T>()` and returns an `OutputEmitterRef` — call `.emit(value)` to fire it. `model<T>()` is the two-way binding signal: it is both an input and an output in one — writable by the component, settable by the parent via `[(myModel)]`. These function-based APIs integrate with zoneless change detection and provide better TypeScript type inference than their decorator counterparts.',
    followUp: 'What is the wire syntax difference between input() and model() from the parent\'s perspective?',
  },
  {
    id: 80, level: 'mid', category: 'signals',
    q: 'What is toSignal() and when would you use it?',
    a: '`toSignal(observable$, options?)` from `@angular/core/rxjs-interop` converts an Observable into a signal. On subscription, it reads the Observable synchronously (if a ReplaySubject/BehaviorSubject) or sets to `undefined`/`initialValue` until the first emission. Angular automatically unsubscribes when the component is destroyed. Use it to bridge RxJS data streams (HttpClient, ngrx actions) into a signal-based component: `readonly user = toSignal(userService.getUser(id), { initialValue: null })`. The template reads `user()` reactively. Use `requireSync: true` for Observables guaranteed to emit synchronously.',
    followUp: 'What happens if the Observable passed to toSignal() errors?',
  },
  {
    id: 81, level: 'junior', category: 'signals',
    q: 'How do you mutate an array or object stored in a signal?',
    a: 'Signals use reference equality (`Object.is`) by default. To trigger consumers: (1) Use `signal.set([...currentArray, newItem])` — creates a new array reference. (2) Use `signal.update(arr => [...arr, newItem])` — concise functional update. (3) For objects: `signal.update(obj => ({ ...obj, name: "new" }))`. Never do `array.push(item); signal.set(array)` — same reference, no notification. For mutable update patterns, provide a custom `equal` function so Angular compares by structure rather than reference. The principle: always create new references for nested data to ensure reactivity.',
    followUp: 'When would you use a custom equality function on signal()?',
  },
  {
    id: 82, level: 'senior', category: 'signals',
    q: 'What is linkedSignal() and what gap does it fill between signal() and computed()?',
    a: '`linkedSignal({ source, computation })` creates a writable signal whose value is reset to `computation(source())` whenever `source` changes — but can be freely overridden by the user between resets. Example: `const selected = linkedSignal({ source: items, computation: items => items[0] })`. When the items array changes, `selected` resets to the first item; but the user can call `selected.set(items[2])` without affecting the reset behaviour. This fills the gap: `computed()` is read-only and always derives its value; `signal()` is writable but has no automatic derivation. `linkedSignal()` is writable with a smart default.',
    followUp: 'How would you implement a "page resets to 1 when the filter changes" UX with linkedSignal()?',
  },
  {
    id: 83, level: 'senior', category: 'signals',
    q: 'How does the resource() API work and how does it handle loading states?',
    a: '`resource({ request, loader })` declares an async data dependency. The `request` function is a reactive signal expression — when it changes, the loader re-runs. The `loader` receives the current request value and returns a Promise. The resource exposes: `value()` — the resolved data (or undefined while loading), `status()` — a `ResourceStatus` enum (Idle/Loading/Resolved/Error/Refreshing), `isLoading()` — boolean convenience, `error()` — the caught error. Use `rxResource()` for Observable-returning loaders. Call `.reload()` to manually trigger a re-fetch. This replaces the common `effect(() => { http.get(...).subscribe(...) })` anti-pattern.',
    followUp: 'How do you implement optimistic updates with resource()?',
  },
  {
    id: 84, level: 'mid', category: 'signals',
    q: 'What is untracked() and when is it necessary?',
    a: '`untracked(() => someSignal())` reads a signal without registering it as a dependency of the enclosing reactive context (computed or effect). Use it when you need a signal\'s current value for side-effect purposes but do not want the effect/computed to re-run when that signal changes. Example: in an effect that responds to `userId()` changes, you might read `analyticsEnabled()` to decide whether to log — but you do not want the effect to re-run every time analytics is toggled. Without `untracked`, both signals would be dependencies. Misuse can hide reactive bugs; only use when you have a clear reason to break the dependency.',
    followUp: 'Can untracked() be used outside of a reactive context?',
  },
  {
    id: 85, level: 'junior', category: 'signals',
    q: 'What is the signal-based query API (viewChild, viewChildren, contentChild, contentChildren)?',
    a: 'Angular 17.1+ introduces function-based signal queries as replacements for decorator queries. `readonly header = viewChild<ElementRef>("header")` returns `Signal<ElementRef | undefined>`. `readonly items = viewChildren(ItemComponent)` returns `Signal<ReadonlyArray<ItemComponent>>`. These are available from component initialisation (not just in lifecycle hooks) and work reactively in computed/effect. `contentChild` and `contentChildren` work the same but query projected content. The signals automatically update as the view changes (e.g., items added inside @if or @for). The decorator equivalents (`@ViewChild`, `@ViewChildren`) still work but are considered legacy in new code.',
    followUp: 'What is the required() option on viewChild?',
  },
  {
    id: 86, level: 'mid', category: 'signals',
    q: 'How do Angular signals integrate with change detection in zoneless mode?',
    a: 'In zoneless mode (`provideExperimentalZonelessChangeDetection()`), Angular does not use Zone.js to intercept async operations. Change detection runs only when a signal changes or `markForCheck()` is explicitly called. Templates that read signals are automatically scheduled for re-render when any signal they read updates — no zone patching needed. This reduces overhead, works in environments where Zone.js cannot run (Web Workers, certain SSR setups), and makes the update flow predictable and traceable. The migration path: move component state to signals, replace Subject-based state with signal stores, and use `async` pipe or `toSignal()` for remaining Observables.',
    followUp: 'What happens with setTimeout() and Promise.resolve() in a zoneless Angular app?',
  },
  {
    id: 87, level: 'senior', category: 'signals',
    q: 'Describe a signal-based mini-store pattern for a feature module.',
    a: 'Create an `@Injectable({ providedIn: "root" })` service with private writable signals for state, public `readonly` computed signals for derived views, and named mutation methods: `private _items = signal<Item[]>([]); readonly items = this._items.asReadonly(); readonly count = computed(() => this._items().length); add(item: Item) { this._items.update(arr => [...arr, item]); }`. Components inject the store and read `store.items()` and `store.count()` reactively. The private/readonly split enforces unidirectional data flow. For async operations, add a `resource()` or `rxResource()` for fetching and an `effect()` to persist to localStorage. This is a lightweight alternative to NgRx for feature-level state.',
    followUp: 'When would you choose NgRx over a signal store?',
  },
  {
    id: 88, level: 'junior', category: 'signals',
    q: 'What is the difference between signal.set() and signal.update()?',
    a: '`signal.set(newValue)` replaces the signal\'s value directly with the provided value. `signal.update(fn)` takes a function that receives the current value and returns the new value — it is shorthand for `signal.set(fn(signal()))`. Use `set()` when you have the new value ready: `count.set(5)`. Use `update()` when the new value depends on the current value: `count.update(n => n + 1)`. For collections, `update()` is safer because it avoids the race condition of reading and setting separately: `items.update(arr => arr.filter(i => i.id !== id))`.',
    followUp: 'Is there a mutate() method on signals in Angular 18+?',
  },
  {
    id: 89, level: 'mid', category: 'signals',
    q: 'How do you test a component that uses signals?',
    a: 'Signals work naturally in tests — no special setup needed. Set signal values directly: `component.mySignal.set(newValue)`, then call `fixture.detectChanges()` to re-render. For `input()` signals use `fixture.setInput("inputName", value)`. For effects, call `TestBed.flushEffects()` (Angular 18+) or use `fakeAsync` + `tick()` to drain the effect queue. For `resource()`, provide `provideHttpClientTesting()` and flush requests via `HttpTestingController`. Computed signals update synchronously — just read them after setting their dependencies. Signal tests tend to be simpler than zone-based tests because there is no need to manage `async`/`fakeAsync` for state updates.',
    followUp: 'Why might an effect assertion fail even after detectChanges()?',
  },
  {
    id: 90, level: 'senior', category: 'signals',
    q: 'What are the trade-offs of using signals vs NgRx for application state?',
    a: 'Signals are lightweight, built-in, zero-dependency, and synchronous — great for component-local and feature-level state. The signal store pattern (private writable + public readonly + mutation methods) provides clear ownership without boilerplate. NgRx (Redux pattern) provides: time-travel debugging via Redux DevTools, strict immutable state enforcement, a standardised action/reducer/selector vocabulary across large teams, effects for complex async orchestration, entity adapters, and `@ngrx/component-store` for feature-scoped state. Choose signals for smaller apps or isolated features; choose NgRx when you need centralized debugging, team conventions, or complex async state machines. The two can coexist — signals in components, NgRx for global state.',
    followUp: 'What does @ngrx/signals provide and how does it bridge the gap?',
  },

  // ─── RXJS 91-105 ─────────────────────────────────────────────────────────────
  {
    id: 91, level: 'junior', category: 'rxjs',
    q: 'What is the difference between a cold and a hot Observable?',
    a: 'A cold Observable creates a new data producer for each subscriber — the producer starts when you subscribe. `http.get("/api/data")` is cold: each subscription triggers a new HTTP request. A hot Observable shares one producer among all subscribers — it produces values whether or not anyone is subscribed. `fromEvent(button, "click")` is hot: clicks happen regardless of subscribers. Practical impact: if two components subscribe to the same cold `http.get()` call, two network requests fire. Solve with `shareReplay(1)` to multicast and cache. Understanding cold vs hot is essential for correct resource management and avoiding duplicate side effects.',
    followUp: 'How does share() differ from shareReplay(1) for a cold HTTP Observable?',
  },
  {
    id: 92, level: 'junior', category: 'rxjs',
    q: 'What do switchMap, mergeMap, concatMap, and exhaustMap each do?',
    a: 'All four flatten an Observable of Observables, but differ in concurrency strategy: `switchMap` — cancels the previous inner Observable when a new outer value arrives. Best for search/autocomplete where only the latest result matters. `concatMap` — queues each inner Observable, starting the next only when the previous completes. Best for ordered operations (sequential API calls). `mergeMap` — subscribes to all inner Observables concurrently. Best for parallel independent requests. `exhaustMap` — ignores new outer values while an inner Observable is active. Best for login buttons (prevent double-submit). Memorise: switch=cancel, concat=queue, merge=parallel, exhaust=ignore.',
    followUp: 'What happens to an in-flight HTTP request when switchMap cancels it?',
  },
  {
    id: 93, level: 'mid', category: 'rxjs',
    q: 'How does RxJS error handling work, and what is the difference between catchError returning EMPTY vs throwError?',
    a: '`catchError(fn)` intercepts errors in an Observable pipeline. The function receives the error and must return a new Observable. Returning `of(fallback)` emits a fallback value and completes the stream — downstream continues. Returning `EMPTY` completes without emitting — downstream `next` never fires. Returning `throwError(() => newError)` re-throws (possibly transformed) — downstream error handlers fire. For retry: `catchError` combined with `retryWhen` or the `retry({ count, delay })` operator. Key rule: if `catchError` does not re-throw, the Observable completes normally — the subscriber\'s `error` callback never fires.',
    followUp: 'How do you retry only on 5xx errors but immediately fail on 4xx errors?',
  },
  {
    id: 94, level: 'mid', category: 'rxjs',
    q: 'What is the takeUntilDestroyed() operator and why is it preferred over manual unsubscription?',
    a: '`takeUntilDestroyed(destroyRef?)` (from `@angular/core/rxjs-interop`, Angular 16+) completes an Observable when the current injection context is destroyed. Called inside a constructor or field initialiser, it automatically injects `DestroyRef`. `this.someService.data$.pipe(takeUntilDestroyed()).subscribe(...)`. Advantages over manual `ngOnDestroy`: no `implements OnDestroy` boilerplate, works in standalone functions and services, composes naturally with other operators. Use it as the last operator in a chain. The older `takeUntil(this.destroy$)` pattern requires a Subject and `destroy$.next()` in ngOnDestroy — more code for the same result.',
    followUp: 'Can takeUntilDestroyed() be used in a service with providedIn: "root"?',
  },
  {
    id: 95, level: 'mid', category: 'rxjs',
    q: 'Explain combineLatest vs forkJoin vs zip.',
    a: '`combineLatest([a$, b$])` emits a combined `[latestA, latestB]` whenever any source emits — but only after all sources have emitted at least once. Ideal for combining live streams. `forkJoin([a$, b$])` waits for ALL sources to complete, then emits one combined result of their last values — ideal for parallel HTTP requests where you need all results before proceeding. `zip([a$, b$])` pairs emissions by index — first from a with first from b, second from a with second from b — regardless of timing. Use `forkJoin` for parallel API calls, `combineLatest` for reactive UI state combinations, `zip` when pairing indexed data.',
    followUp: 'What happens to forkJoin if one of its source Observables errors?',
  },
  {
    id: 96, level: 'junior', category: 'rxjs',
    q: 'What is the purpose of the async pipe in Angular and what are its advantages?',
    a: 'The `async` pipe subscribes to an Observable or Promise in the template and renders its latest value. Advantages: (1) Auto-unsubscription — when the component is destroyed, the pipe unsubscribes, preventing memory leaks. (2) Change detection integration — with `OnPush` components, the async pipe calls `markForCheck()` when a new value arrives, ensuring re-render without Zone.js. (3) Null safety — before the Observable emits, the expression is `null` (or `undefined`), not an error. Pattern: `<div *ngIf="user$ | async as user">{{ user.name }}</div>` — the `as user` alias avoids multiple subscriptions to the same Observable.',
    followUp: 'Why is using multiple async pipes on the same Observable in a template inefficient?',
  },
  {
    id: 97, level: 'mid', category: 'rxjs',
    q: 'What is a Subject vs a BehaviorSubject vs a ReplaySubject?',
    a: '`Subject` — plain multicast: only subscribers present at emission time receive the value; late subscribers get nothing. `BehaviorSubject(initialValue)` — requires an initial value; always has a current value; new subscribers immediately receive the latest value. `ReplaySubject(bufferSize)` — replays the last N values to any new subscriber. `AsyncSubject` — emits only the last value and only when the source completes. Use `BehaviorSubject` for state that always has a current value (auth user, theme). Use `ReplaySubject(1)` for state without a meaningful initial value. Use `Subject` for event buses. In signals-first Angular code, prefer signals over Subjects for state.',
    followUp: 'What happens if you subscribe to a BehaviorSubject after it has completed?',
  },
  {
    id: 98, level: 'mid', category: 'rxjs',
    q: 'How do you implement debounce search with RxJS in Angular?',
    a: 'Wire a `FormControl` to `this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), filter(v => v.length > 2), switchMap(term => this.searchService.search(term)), takeUntilDestroyed()).subscribe(results => this.results = results)`. Key operators: `debounceTime(300)` waits 300ms after the last keystroke. `distinctUntilChanged()` skips re-fetching if the term did not change. `filter(v => v.length > 2)` avoids single-character searches. `switchMap` cancels previous in-flight requests. `takeUntilDestroyed()` cleans up. This is the canonical Angular search implementation — a standard interview coding exercise.',
    followUp: 'How would you add a loading indicator that shows while the HTTP request is in flight?',
  },
  {
    id: 99, level: 'senior', category: 'rxjs',
    q: 'What is the difference between scan() and reduce() in RxJS?',
    a: '`reduce(fn, seed)` accumulates values like `Array.reduce()` but emits only the FINAL accumulated value when the source Observable completes — if the source never completes, `reduce()` never emits. `scan(fn, seed)` emits the accumulated value after EVERY emission. `scan((acc, val) => [...acc, val], [])` on a stream of items builds up an array in real time, emitting the growing array after each item. Use `scan()` for running totals, real-time aggregation, and state accumulation in Redux-like patterns. Use `reduce()` for batch processing where only the end result matters.',
    followUp: 'How would you implement a simple Redux-style store using scan()?',
  },
  {
    id: 100, level: 'mid', category: 'rxjs',
    q: 'How do you test RxJS code in Angular — what is marble testing?',
    a: 'Marble testing uses ASCII art diagrams to describe Observable time flows in unit tests. Using `TestScheduler` from `rxjs/testing`: `const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected))`. Inside `scheduler.run(({ cold, hot, expectObservable }) => { const source = cold("-a-b-c|"); const result = source.pipe(map(x => x.toUpperCase())); expectObservable(result).toBe("-A-B-C|") })`. Each character represents one frame of virtual time. For Angular HTTP tests, `HttpClientTestingModule` + `HttpTestingController.expectOne().flush()` is used instead. Marble testing excels for testing complex operator combinations.',
    followUp: 'What do the characters -, |, #, and ^ mean in marble diagrams?',
  },
  {
    id: 101, level: 'senior', category: 'rxjs',
    q: 'What is the multicast refCount pattern and why was shareReplay changed in RxJS 6.4?',
    a: '`share()` uses `Subject` + `refCount()` — when the subscriber count drops to 0, it unsubscribes from the source and the Subject is reset; when a new subscriber arrives, it re-subscribes from scratch. `shareReplay(1)` prior to RxJS 6.4 had `refCount: false` by default — the source NEVER unsubscribed even when all subscribers left, causing memory leaks for long-lived Observables. RxJS 6.4 added `{ refCount: true }` option (and later made it available via `shareReplay({ bufferSize: 1, refCount: true })`). The breaking change: `shareReplay(1)` with `refCount: false` keeps a zombie subscription indefinitely — always explicitly set `refCount: true` in new code.',
    followUp: 'When would you intentionally use shareReplay with refCount: false?',
  },
  {
    id: 102, level: 'mid', category: 'rxjs',
    q: 'How do you handle multiple concurrent API calls and combine their results?',
    a: 'Use `forkJoin([api1$, api2$, api3$]).subscribe(([r1, r2, r3]) => ...)` for parallel calls where you need all results before proceeding. If any call errors, the entire forkJoin errors — use `pipe(catchError(() => of(null)))` on each source to make errors non-fatal. For dependent calls (call B with A\'s result): `api1$.pipe(switchMap(r1 => api2$(r1.id)))`. For independent calls that should update the UI as each arrives: `merge(api1$, api2$, api3$)`. Angular\'s `resource()` / `rxResource()` provides the same capability with built-in loading/error state management.',
    followUp: 'What is the difference between forkJoin and combineLatest for one-shot HTTP calls?',
  },
  {
    id: 103, level: 'senior', category: 'rxjs',
    q: 'Explain the concept of backpressure in RxJS and how operators handle it.',
    a: 'Backpressure occurs when a producer emits faster than a consumer can process. RxJS handles this with several strategies: `throttleTime(ms)` — emit first, then ignore for duration (rate-limit). `debounceTime(ms)` — emit only after a pause (trail-off). `auditTime(ms)` — emit the last value in each time window. `bufferTime(ms)` — collect all values in a window and emit as an array. `sample(notifier$)` — emit the latest value only when the notifier fires. `throttle(obs)` — like throttleTime but with a dynamic duration Observable. For CPU-intensive processing, use `observeOn(asyncScheduler)` to push work to macrotasks. For truly unbounded streams, `windowCount` or `bufferCount` breaks them into manageable chunks.',
    followUp: 'What is the difference between throttleTime with leading:true,trailing:false vs leading:false,trailing:true?',
  },
  {
    id: 104, level: 'mid', category: 'rxjs',
    q: 'How does HttpClient in Angular use RxJS, and what is the significance of it returning cold Observables?',
    a: '`HttpClient.get<T>()` returns a cold Observable — the HTTP request does not fire until you subscribe. Each new subscription triggers a fresh request. Consequences: (1) If two components subscribe to the same service method, two HTTP requests fire — share with `shareReplay(1)`. (2) Forgetting to subscribe means the request never fires. (3) Unsubscribing cancels the XHR request, preventing stale data — `switchMap` exploits this for search. `HttpClient` also emits exactly one value (the response) then completes, making it ideal for `firstValueFrom()`, `forkJoin()`, and `take(1)` patterns. Interceptors allow adding auth headers, logging, and retry logic to all requests.',
    followUp: 'What does HttpClient emit when the request fails vs succeeds?',
  },
  {
    id: 105, level: 'senior', category: 'rxjs',
    q: 'What is the purpose of schedulers in RxJS and when would you use asyncScheduler?',
    a: 'Schedulers control WHEN Observable callbacks execute relative to the event loop. `asyncScheduler` — schedules work as a macrotask (like `setTimeout(fn, 0)`). `asapScheduler` — schedules as a microtask (like `Promise.resolve().then(fn)`). `animationFrameScheduler` — schedules before the next browser paint, ideal for smooth animations. `queueScheduler` — synchronous, queued execution for recursive observables. Use `observeOn(asyncScheduler)` to move heavy computation off the critical path, or to escape Zone.js detection in Angular. Use `subscribeOn(asyncScheduler)` to move the subscription logic itself to a macro task. Most Angular code never needs explicit schedulers; they are critical for library authors and performance tuning.',
    followUp: 'How does TestScheduler in unit tests relate to real schedulers?',
  },

  // ─── FORMS 106-116 ─────────────────────────────────────────────────────────
  {
    id: 106, level: 'junior', category: 'forms',
    q: 'What is the difference between template-driven forms and reactive forms in Angular?',
    a: 'Template-driven forms use `NgModel` and form directives in the HTML template to create the form model implicitly — simpler, less code, good for basic forms. Reactive forms build the form model explicitly in the component class using `FormGroup`, `FormControl`, and `FormArray` — the model exists before the template renders. Reactive forms are: testable (model is a plain object, no fixture needed), composable (form controls can be programmatically manipulated), type-safe with Angular 14+ typed forms, and better for complex validation. The Angular team recommends reactive forms for all non-trivial use cases. Both are mutually exclusive per form.',
    followUp: 'Can you mix ngModel and reactive forms in the same form?',
  },
  {
    id: 107, level: 'mid', category: 'forms',
    q: 'How do you implement a reusable form control as a custom ControlValueAccessor?',
    a: 'Implement `ControlValueAccessor`: `writeValue(val)` — Angular calls this to push a value into your control\'s UI. `registerOnChange(fn)` — store `fn`; call it when the user changes the value. `registerOnTouched(fn)` — store `fn`; call it on blur. `setDisabledState(disabled)` — optional; handle enable/disable. Provide as `NG_VALUE_ACCESSOR`: `providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyControl), multi: true }]`. In the template: `<app-my-control formControlName="field">`. The parent `FormGroup` drives the value in and receives user changes out — your component is a black box to the form system.',
    followUp: 'What is forwardRef and why is it needed in NG_VALUE_ACCESSOR providers?',
  },
  {
    id: 108, level: 'mid', category: 'forms',
    q: 'How does FormArray work and when do you use it?',
    a: '`FormArray` is an array of `AbstractControl`s — useful for dynamic lists of form items (e.g., phone numbers, tags, order line items). `const phones = new FormArray([new FormControl("")])`. Add with `phones.push(new FormControl(""))`. Remove with `phones.removeAt(index)`. In the template: `<div formArrayName="phones"><input *ngFor="let c of phones.controls; let i = index" [formControlIndex]="i">`. Access value as `phones.value` — an array. Validators on a `FormArray` receive the array as `AbstractControl`; validators on individual controls work per-item. `FormArray.valueChanges` emits the full array on any child change.',
    followUp: 'How do you validate that a FormArray has at least one item?',
  },
  {
    id: 109, level: 'junior', category: 'forms',
    q: 'How do you show validation errors in an Angular reactive form template?',
    a: 'Check the control\'s state: `<div *ngIf="form.get(\'email\')?.invalid && form.get(\'email\')?.touched">`. Access specific errors: `<span *ngIf="form.get(\'email\')?.errors?.[\'required\']">Email is required</span>`. A common pattern: create a getter `get email() { return this.form.get("email")! }` and use `email.invalid && email.touched` in the template. Show all errors at once on submit by calling `this.form.markAllAsTouched()`. With Angular Material: `<mat-error>` inside `<mat-form-field>` integrates automatically with form state. Style invalid touched fields with: `input.ng-invalid.ng-touched { border-color: red }`.',
    followUp: 'What CSS classes does Angular add to a FormControl\'s host element to reflect its state?',
  },
  {
    id: 110, level: 'mid', category: 'forms',
    q: 'How do you write a custom synchronous validator?',
    a: 'A validator is a function `(control: AbstractControl) => ValidationErrors | null`. Return `null` for valid, or an error object like `{ minAge: { required: 18, actual: 15 } }`. Apply: `new FormControl("", [Validators.required, ageValidator])`. Or as a directive implementing `Validator` interface for template-driven forms. For group validators: the function receives the `FormGroup` — cross-field comparison is done by reading child control values. The error object key becomes the property you check in the template: `form.errors?.["minAge"]`. Return descriptive error objects with context to enable rich error messages.',
    followUp: 'How do you compose multiple validators so all errors are shown simultaneously?',
  },
  {
    id: 111, level: 'senior', category: 'forms',
    q: 'How do you write an async validator (e.g., check if a username is taken)?',
    a: 'An async validator returns an Observable or Promise of `ValidationErrors | null`. Example: `(control: AbstractControl): Observable<ValidationErrors | null> => this.http.get("/api/check?user=" + control.value).pipe(map(r => r.available ? null : { taken: true }), catchError(() => of(null)))`. Apply: `new FormControl("", [], [usernameValidator])` — third argument is async validators. Angular shows `PENDING` status while the Observable is in flight. Best practices: `debounce` before validation, use `switchMap` inside the validator to cancel outdated requests, add a `first()` to complete the Observable so Angular resolves it. The form is invalid while any async validator is pending.',
    followUp: 'How do you add a spinner that shows while async validation is running?',
  },
  {
    id: 112, level: 'mid', category: 'forms',
    q: 'What is the difference between Validators.compose() and Validators.composeAsync()?',
    a: '`Validators.compose([v1, v2, v3])` combines sync validators into one — all validators run and their error objects are merged. `Validators.composeAsync([av1, av2])` combines async validators — all run in parallel and their error objects are merged when all complete. Angular runs all sync validators first; if any sync validator returns an error, async validators are NOT run (skipping the server round-trip). These composition functions are what Angular uses internally when you pass an array to `FormControl` — you rarely call them directly unless building a validator factory.',
    followUp: 'When would you want to NOT run async validators if sync validation fails?',
  },
  {
    id: 113, level: 'senior', category: 'forms',
    q: 'What are typed forms in Angular 14+ and what TypeScript benefits do they provide?',
    a: 'Typed reactive forms (`FormControl<string>`, `FormGroup<{ name: FormControl<string>, age: FormControl<number> }>`) make `control.value` fully typed — TypeScript knows each field\'s type and rejects incorrect access. `getRawValue()` returns the exact type including disabled fields. `FormControl<string | null>` (nullable, the default) vs `FormControl<string>` (non-nullable, via `nonNullable: true`) is now explicit. `FormGroup` type parameters mirror your model interface, enabling autocomplete and compile-time validation. The `NonNullableFormBuilder` (accessed via `fb.nonNullable`) creates non-nullable controls from defaults — `reset()` restores to the initial value, not null.',
    followUp: 'How do you type a FormArray whose items have different types?',
  },
  {
    id: 114, level: 'mid', category: 'forms',
    q: 'How does `patchValue` vs `setValue` work on nested FormGroups?',
    a: '`setValue` is recursive and strict — every level of the nested hierarchy must have a matching key, or it throws. `patchValue` is recursive and lenient — only provided keys are updated, missing keys are ignored at every level. For a `FormGroup({ address: FormGroup({ street, city }) })`: `form.setValue({ address: { street: "123 Main", city: "Anytown" } })` requires both keys. `form.patchValue({ address: { city: "Springfield" } })` only updates city, leaving street unchanged. Use `setValue` when doing full model replacement (e.g., loading an edit form from an API); use `patchValue` for partial updates or when the API might omit optional fields.',
    followUp: 'Does patchValue on a FormArray work the same way?',
  },
  {
    id: 115, level: 'junior', category: 'forms',
    q: 'What is the updateOn option for FormControl and FormGroup?',
    a: '`updateOn` controls when validators run and `valueChanges` emits. Options: `"change"` (default) — on every keystroke. `"blur"` — when the input loses focus. `"submit"` — only when the enclosing `<form>` is submitted. Set per control: `new FormControl("", { updateOn: "blur" })` or per group: `new FormGroup({...}, { updateOn: "submit" })`. Group-level setting overrides control-level. The UX benefit: `"blur"` prevents showing a "required field" error while the user is still typing. `"submit"` delays all validation until the user attempts to submit, reducing error noise during form fill.',
    followUp: 'If a FormGroup has updateOn: "submit" but a child FormControl has updateOn: "change", which wins?',
  },
  {
    id: 116, level: 'senior', category: 'forms',
    q: 'How do you implement a form that saves a partial draft automatically (autosave)?',
    a: 'Subscribe to `this.form.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(isEqual), takeUntilDestroyed(), filter(() => this.form.valid)).subscribe(value => this.draftService.save(value))`. `debounceTime(1000)` batches rapid changes. `distinctUntilChanged(deepEqual)` skips saves when value is semantically unchanged. `filter(() => this.form.valid)` only saves valid drafts. `takeUntilDestroyed()` cleans up. On component init, load the draft and patch: `this.draftService.load().subscribe(draft => this.form.patchValue(draft))`. For unsaved changes warning, implement `CanDeactivateFn` checking `this.form.dirty`.',
    followUp: 'How do you reset `form.dirty` after a successful save so the dirty check stays accurate?',
  },

  // ─── ROUTING 117-127 ─────────────────────────────────────────────────────────
  {
    id: 117, level: 'junior', category: 'routing',
    q: 'How does lazy loading work in Angular routing?',
    a: 'Lazy loading defers downloading a feature module or standalone component until its route is first visited. For standalone components: `{ path: "admin", loadComponent: () => import("./admin/admin.ts").then(m => m.AdminComponent) }`. For feature routes: `{ path: "admin", loadChildren: () => import("./admin/routes").then(m => m.ADMIN_ROUTES) }`. Angular builds each lazy route as a separate JS chunk at build time. On first navigation to `/admin`, the chunk is downloaded. Benefits: faster initial load (only the app shell downloads at startup), code that is never visited is never downloaded. Pre-loading strategies (`withPreloading`) optionally pre-fetch lazy chunks after initial load.',
    followUp: 'What is the difference between loadComponent and loadChildren in route config?',
  },
  {
    id: 118, level: 'mid', category: 'routing',
    q: 'What is a route resolver and how does it differ from data fetching in ngOnInit?',
    a: 'A resolver is a function that fetches data BEFORE the route is activated. `ResolveFn<T>` runs when the URL matches the route; the component is not instantiated until the resolve completes. The resolved data is available in `route.snapshot.data["key"]`. Advantage: the component always receives its data on first render — no loading state needed. Disadvantage: the user sees a blank/frozen UI during resolution (no component renders). Fetching in `ngOnInit` shows the component immediately with a loading state, providing a better perceived performance for slow network. Modern recommendation: use `ngOnInit` + `resource()` or `toSignal(http.get(...))` for most cases; use resolvers only for critical pre-conditions or title/breadcrumb data.',
    followUp: 'How do you implement a resolver as a functional ResolveFn in Angular 15+?',
  },
  {
    id: 119, level: 'junior', category: 'routing',
    q: 'How do route guards work in Angular and what are the functional guard APIs?',
    a: 'Guards intercept navigation to allow or block it. Functional guards (Angular 14+) are simple functions: `export const isAuth: CanActivateFn = (route, state) => inject(AuthService).isLoggedIn() || router.createUrlTree(["/login"])`. Return: `true` (allow), `false` (block), or a `UrlTree` (redirect). Guard types: `CanActivateFn` — component can be activated. `CanActivateChildFn` — child routes can be activated. `CanDeactivateFn` — user can leave (unsaved changes check). `CanMatchFn` — route definition matches the URL (can serve different components per URL based on state). `ResolveFn` — prefetch data. Provide in `providers` with `provideRouter(routes, withRouterConfig(...))` or directly in route\'s `canActivate` array.',
    followUp: 'What is the difference between CanActivate and CanMatch guards?',
  },
  {
    id: 120, level: 'mid', category: 'routing',
    q: 'How do you pass data through route parameters and query parameters?',
    a: 'Route parameters are part of the path: `{ path: "product/:id", component: ProductPage }`. Read with `inject(ActivatedRoute).snapshot.paramMap.get("id")` or subscribe to `route.paramMap`. Query parameters are appended: `/search?term=angular&page=2`. Navigate: `router.navigate(["/search"], { queryParams: { term, page } })`. Read: `route.snapshot.queryParamMap.get("term")`. With `withComponentInputBinding()` in `provideRouter()`, route params and query params are automatically bound to `@Input()` or `input()` properties of the routed component — no `ActivatedRoute` injection needed: `readonly id = input<string>()`.',
    followUp: 'How do you preserve existing query parameters when navigating with new ones?',
  },
  {
    id: 121, level: 'mid', category: 'routing',
    q: 'What is router-outlet and how do named/secondary outlets work?',
    a: '`<router-outlet>` is the placeholder where the router renders the matched component. The default (unnamed) outlet renders primary routes. Named outlets: `<router-outlet name="sidebar">` enable multiple independent routing regions on the same page. Navigate to named outlets: `router.navigate([{ outlets: { primary: ["dashboard"], sidebar: ["help"] } }])`. The URL encodes named outlet state as `/(sidebar:help)`. Named outlets are useful for dialogs, side panels, or notifications driven by the URL. Each outlet has its own route tree, independent navigation history, and can be cleared with `router.navigate([{ outlets: { sidebar: null } }])`.',
    followUp: 'Can a named outlet have its own child routes?',
  },
  {
    id: 122, level: 'senior', category: 'routing',
    q: 'How do you implement scroll restoration and anchor navigation in Angular?',
    a: 'Enable with `withInMemoryScrolling({ scrollPositionRestoration: "top", anchorScrolling: "enabled" })` in `provideRouter()`. `scrollPositionRestoration: "top"` scrolls to top on every navigation; `"enabled"` restores the previous scroll position when navigating back. `anchorScrolling: "enabled"` scrolls to the fragment specified in the URL (`/page#section`). For more control, listen to `router.events.pipe(filter(e => e instanceof NavigationEnd))` and call `window.scrollTo(0, 0)` manually. Angular\'s built-in scroll restoration works well for most SPAs; custom implementation is needed for infinite scroll or tab-based navigation where position must be tracked per-route.',
    followUp: 'How do you scroll to a specific element after a route navigation completes?',
  },
  {
    id: 123, level: 'senior', category: 'routing',
    q: 'What is the Angular router\'s navigation lifecycle and in what order do events fire?',
    a: 'Navigation lifecycle in order: (1) `NavigationStart` — navigation begins. (2) `RoutesRecognized` — URL parsed, route matched. (3) `GuardsCheckStart` — guard evaluation begins. (4) `CanMatch` guards run. (5) `CanActivate`/`CanActivateChild` guards run. (6) `GuardsCheckEnd`. (7) `ResolveStart` — resolvers begin. (8) `ResolveEnd` — resolvers complete. (9) Component is instantiated and activated. (10) `ActivationEnd`. (11) `NavigationEnd` — navigation complete. On cancellation/error: `NavigationCancel` (guard returned false) or `NavigationError` (error thrown). Subscribe to `router.events` to hook into any stage — commonly used for analytics, loading indicators, and title updates.',
    followUp: 'How do you show a global loading bar that appears during navigation and hides on NavigationEnd?',
  },
  {
    id: 124, level: 'mid', category: 'routing',
    q: 'How do you implement a breadcrumb system driven by route data?',
    a: 'Add `data: { breadcrumb: "Products" }` to each route. In a `BreadcrumbComponent`, inject `ActivatedRoute` and traverse the route tree: `let route = this.route.root; const crumbs = []; while (route) { if (route.snapshot.data["breadcrumb"]) crumbs.push(route.snapshot.data["breadcrumb"]); route = route.firstChild; }`. Subscribe to `router.events.pipe(filter(e => e instanceof NavigationEnd))` to rebuild on navigation. For dynamic breadcrumbs (e.g., "Product #42"), use a resolver that sets the breadcrumb in `data`, or provide a factory function as the breadcrumb value. Angular CDK and libraries like `xng-breadcrumb` provide this pattern out of the box.',
    followUp: 'How do you make a breadcrumb dynamically reflect the resolved product name instead of a static "Product Detail" string?',
  },
  {
    id: 125, level: 'mid', category: 'routing',
    q: 'What is withComponentInputBinding() and how does it simplify route data access?',
    a: '`withComponentInputBinding()` added to `provideRouter(routes, withComponentInputBinding())` automatically binds route params, query params, path data, and resolved data to component `@Input()` or `input()` properties by matching names. `{ path: "product/:id" }` → `readonly id = input<string>()` in the component — no `ActivatedRoute` injection needed. Query params are bound the same way. Route `data: { title }` and resolved data are also auto-bound. This eliminates `inject(ActivatedRoute).snapshot.paramMap.get("id")` boilerplate. Works with both classic `@Input()` and signal-based `input()`. First available in Angular 16.',
    followUp: 'Can you use withComponentInputBinding with optional route params?',
  },
  {
    id: 126, level: 'junior', category: 'routing',
    q: 'What is the RouterLink directive and how does it differ from href?',
    a: '`[routerLink]="["/products", productId]"` is Angular\'s client-side navigation directive. Unlike `href`, it does NOT trigger a full page reload — it uses the Angular router to navigate without a server round-trip, preserving application state. `href` causes a full browser navigation, clearing all in-memory state. `routerLink` also handles base href, hashes, and query params. Add `routerLinkActive="active"` to automatically apply a CSS class when the link\'s route is active. Use `[routerLinkActiveOptions]="{ exact: true }"` for exact matching on the home route. Always use `routerLink` for internal navigation in an Angular SPA.',
    followUp: 'When is it appropriate to use href instead of routerLink?',
  },
  {
    id: 127, level: 'senior', category: 'routing',
    q: 'How do you implement a multi-step wizard with route guards preserving state between steps?',
    a: 'Model each step as a child route under a parent wizard route. Store wizard state in a scoped service provided in the parent route\'s `providers` array — this service lives exactly as long as the wizard is active. `CanActivateFn` guards on each step check that the previous step\'s data exists: `isStep2Fn: CanActivateFn = () => inject(WizardStateService).step1Complete() || router.createUrlTree(["/wizard/step1"])`. On final submit, call the API and navigate away. On `CanDeactivate`, warn if the user tries to leave mid-wizard. The scoped service pattern ensures the state is automatically cleaned up when the user navigates out of the wizard.',
    followUp: 'How do you persist wizard state across a page refresh?',
  },

  // ─── TESTING 128-137 ─────────────────────────────────────────────────────────
  {
    id: 128, level: 'junior', category: 'testing',
    q: 'What is TestBed and what does it do?',
    a: '`TestBed` is Angular\'s primary testing utility — it creates a mini Angular application (a testing module) for each test. `TestBed.configureTestingModule({ imports: [...], providers: [...] })` registers the component and its dependencies. `TestBed.createComponent(MyComponent)` returns a `ComponentFixture<MyComponent>` wrapping the component instance, the host element, and utilities for triggering change detection. It simulates the Angular runtime in a JSDOM environment (with Jest) or a real browser (with Karma). TestBed resets between tests by default — always configure it fresh in `beforeEach` unless explicitly sharing state. It handles DI, lifecycle hooks, and template compilation.',
    followUp: 'How do you speed up tests that use TestBed?',
  },
  {
    id: 129, level: 'mid', category: 'testing',
    q: 'How do you test a service that uses HttpClient?',
    a: 'Replace `HttpClient` with `HttpClientTestingModule` (or `provideHttpClientTesting()` in standalone): `TestBed.configureTestingModule({ providers: [MyService, provideHttpClient(), provideHttpClientTesting()] })`. Inject `HttpTestingController`. In the test: call your service method, then `const req = httpMock.expectOne("/api/users"); req.flush(mockData)`. For errors: `req.flush("error", { status: 500, statusText: "Server Error" })`. In `afterEach`: `httpMock.verify()` — ensures no unexpected requests were made. For multiple requests: use `httpMock.match("/api/")` which returns an array. Always test both success and error paths.',
    followUp: 'How do you test an HttpInterceptor?',
  },
  {
    id: 130, level: 'mid', category: 'testing',
    q: 'What is the difference between shallow and deep (integration) component tests?',
    a: 'Shallow tests use `NO_ERRORS_SCHEMA` or `CUSTOM_ELEMENTS_SCHEMA` to ignore child components — they render as empty elements. Only the component under test\'s logic is verified. Fast, isolated, not brittle to child component changes. Deep integration tests import all real child components — they test the full rendered tree, asserting on actual child output. Slower, more realistic, catch integration bugs (renamed @Input, broken template). The Angular team recommends a mix: shallow tests for component logic (unit testing), integration tests for critical user flows. Use `ng-mocks` library for a middle ground — child components are replaced with configurable mock versions.',
    followUp: 'What is the trade-off of using NO_ERRORS_SCHEMA extensively?',
  },
  {
    id: 131, level: 'mid', category: 'testing',
    q: 'How do you test an Observable-based service with RxJS?',
    a: 'For synchronous Observables: subscribe directly and push values into a spy array. For async: use `fakeAsync` + `tick()` or `async/await` + `fixture.whenStable()`. For Subjects: `subject.next(value)` in the test to simulate emissions. For Promises: `flushMicrotasks()` drains the Promise queue inside `fakeAsync`. Example: `const results: User[] = []; service.users$.subscribe(u => results.push(u)); subject.next(mockUser); expect(results).toEqual([mockUser])`. For marble testing complex operators, use `TestScheduler` from `rxjs/testing`. Always complete or error the Observable at test end to prevent open subscriptions.',
    followUp: 'How do you test that an Observable errors correctly?',
  },
  {
    id: 132, level: 'senior', category: 'testing',
    q: 'How do you test a component with @defer blocks?',
    a: '`@defer` blocks are controlled in tests via the `DeferBlockFixture` API. From the fixture: `const deferBlock = await fixture.getDeferBlocks()` returns all defer blocks. `await deferBlock[0].render(DeferBlockState.Placeholder)` renders the placeholder. `await deferBlock[0].render(DeferBlockState.Loading)` renders the loading state. `await deferBlock[0].render(DeferBlockState.Complete)` renders the deferred content (triggering the lazy load). `DeferBlockState.Error` renders the error template. This is much simpler than trying to trigger real `on idle` / `on viewport` events. Test the complete/error/loading/placeholder states independently.',
    followUp: 'How do you test a @defer block that has an on viewport trigger?',
  },
  {
    id: 133, level: 'junior', category: 'testing',
    q: 'What is fakeAsync and why is it needed for testing async Angular code?',
    a: '`fakeAsync()` wraps a test body and replaces the browser\'s real timer functions (setTimeout, setInterval) with synchronous virtual ones — controlled by `tick(ms)` and `flush()`. Without it, async code runs AFTER the test\'s `expect` statements, making assertions on the result impossible without callbacks or done(). With `fakeAsync`: `fakeAsync(() => { someService.delayedMethod(); tick(1000); expect(result).toBe("done") })`. `tick(ms)` advances virtual time. `flush()` drains all pending timers. `flushMicrotasks()` drains Promises. Essential for testing debounce, throttle, setTimeout-based state updates, and `async pipe` resolution.',
    followUp: 'Can fakeAsync wrap async/await code?',
  },
  {
    id: 134, level: 'mid', category: 'testing',
    q: 'How do you mock a service dependency in a component test?',
    a: 'Three approaches: (1) `useValue` with a hand-crafted spy object: `{ provide: AuthService, useValue: { login: jasmine.createSpy("login").and.returnValue(of({})) } }`. (2) `jasmine.createSpyObj("AuthService", ["login", "logout"])` then `{ provide: AuthService, useValue: spy }`. (3) In Jest: `jest.fn()` equivalents. Provide in `TestBed.configureTestingModule({ providers: [...] })`. Retrieve via `TestBed.inject(AuthService)` to set return values and assert calls. For `HttpClient` specifically, use `provideHttpClientTesting()`. Prefer spies over real implementations to isolate the component under test from service-level bugs.',
    followUp: 'When would you use a real service instead of a mock in a component test?',
  },
  {
    id: 135, level: 'mid', category: 'testing',
    q: 'How do you query the DOM in Angular component tests?',
    a: 'Use `ComponentFixture.debugElement.query(By.css(".selector"))` to get a `DebugElement` — Angular\'s testable wrapper with `.nativeElement`, `.triggerEventHandler()`, and `.injector`. `fixture.nativeElement.querySelector(".class")` for direct DOM access. Common patterns: `fixture.debugElement.queryAll(By.css("li"))` — all matching elements. `fixture.debugElement.query(By.directive(MyDirective))` — element with a directive. `debugEl.triggerEventHandler("click", { preventDefault: () => {} })` — fire an Angular event. After DOM interaction, call `fixture.detectChanges()` to process any resulting updates. Use `By.css()` from `@angular/platform-browser/testing`.',
    followUp: 'What is the difference between debugElement.nativeElement and fixture.nativeElement?',
  },
  {
    id: 136, level: 'senior', category: 'testing',
    q: 'What testing strategy do you recommend for a large Angular feature?',
    a: 'Follow the testing pyramid: (1) Unit tests for services (pure logic, no DOM), pipes, and utility functions — fast, numerous, mock dependencies. (2) Component unit tests (shallow with spy services) for component-specific logic, input/output behaviour, and template bindings. (3) Integration/feature tests for key user flows — test a parent + children rendering together, using `RouterTestingHarness` for routing. (4) E2E tests (Cypress/Playwright) for critical paths only (login, checkout). Aim for 70% unit, 20% integration, 10% E2E. Use `ng-mocks` to simplify Angular testing boilerplate. Co-locate tests (`component.spec.ts` next to `component.ts`). Run tests in CI on every PR.',
    followUp: 'How do you measure and enforce code coverage requirements in Angular?',
  },
  {
    id: 137, level: 'senior', category: 'testing',
    q: 'How do you test signal-based components in Angular 18+?',
    a: 'Signal tests are straightforward: set inputs with `fixture.setInput("name", value)`, which also triggers change detection. For writable signals on the class: `fixture.componentInstance.mySignal.set(value); fixture.detectChanges()`. For effects: call `TestBed.flushEffects()` before asserting side effects — effects run asynchronously and do not flush on `detectChanges()` alone. For `resource()`: provide `provideHttpClientTesting()`, flush the request, then `fixture.detectChanges()`. Computed signals re-evaluate synchronously when their dependencies change — just read them. Signal queries (viewChild, viewChildren) are automatically populated after `detectChanges()`. No special async handling needed for signal state itself.',
    followUp: 'What does TestBed.flushEffects() do differently from detectChanges()?',
  },

  // ─── PERFORMANCE 138-145 ──────────────────────────────────────────────────────
  {
    id: 138, level: 'junior', category: 'performance',
    q: 'What is the @defer block in Angular 17+ and how does it improve performance?',
    a: '`@defer` creates a code-split point — the deferred component and ALL its dependencies are excluded from the initial JS bundle and downloaded lazily as a separate chunk. Trigger options: `on idle` (requestIdleCallback), `on viewport` (IntersectionObserver), `on interaction` (user click/hover), `on timer(2s)`, `when condition`. The block also supports `@placeholder`, `@loading`, and `@error` sub-blocks. Performance impact: a heavy chart or rich-text editor that loads on idle can save hundreds of KB from the initial parse, directly improving Time to Interactive. Unlike lazy-loaded routes, `@defer` works at the component level within a single route.',
    followUp: 'What is the difference between @defer on interaction and @defer on viewport?',
  },
  {
    id: 139, level: 'mid', category: 'performance',
    q: 'What are Core Web Vitals and how does Angular impact them?',
    a: 'Core Web Vitals are Google\'s user-experience metrics used in search ranking. LCP (Largest Contentful Paint) — time until the largest visible element renders: Angular impacts this via bundle size, SSR, and `NgOptimizedImage priority`. FID/INP (Interaction to Next Paint) — responsiveness latency: Angular impacts this via bundle parse time, change detection overhead, and long tasks; signals/zoneless reduce INP. CLS (Cumulative Layout Shift) — unexpected layout shifts: Angular impacts this via image size hints (`width`/`height` required by `NgOptimizedImage`) and font loading. Improving: SSR + hydration for LCP, OnPush + signals for INP, image dimensions for CLS.',
    followUp: 'How does Angular Universal/SSR specifically improve LCP?',
  },
  {
    id: 140, level: 'mid', category: 'performance',
    q: 'How do you prevent unnecessary change detection re-renders in Angular?',
    a: 'Strategy: (1) `ChangeDetectionStrategy.OnPush` — component only re-renders on input reference changes, events, and async pipe updates. (2) Signals + zoneless — only signal-reading components re-render on signal change. (3) `pure: true` pipes (default) — transform is called only when input reference changes. (4) Avoid method calls in templates — use signals, computed(), or pure pipes instead. (5) `trackBy`/`track` in `*ngFor`/`@for` — reuses DOM nodes. (6) `ChangeDetectorRef.detach()` for manually controlled components. (7) Move expensive work out of `ngDoCheck`. Profiling: Angular DevTools Profiler shows per-component re-render counts and timing.',
    followUp: 'What is the ExpressionChangedAfterItHasBeenChecked error and how do you fix it?',
  },
  {
    id: 141, level: 'senior', category: 'performance',
    q: 'What is Angular\'s SSR/hydration strategy and how does withHttpTransferCache work?',
    a: 'Angular SSR renders the application on the server and sends complete HTML to the browser — the user sees content before JS loads (improves LCP). Hydration (Angular 16+): instead of destroying the server-rendered DOM and re-creating it, Angular reuses existing DOM nodes and attaches event listeners. `provideClientHydration()` enables this. `withHttpTransferCache()` serialises HTTP responses made during SSR into the HTML payload (as a `<script>` tag). The browser-side Angular reads this cache instead of re-making the same API calls, preventing double-fetching. `TransferState` is the lower-level API for manually caching arbitrary data between server and client.',
    followUp: 'What are the constraints on components for hydration to work correctly?',
  },
  {
    id: 142, level: 'mid', category: 'performance',
    q: 'How do you optimise Angular application bundle size?',
    a: 'Bundle optimisation strategy: (1) Lazy loading — `loadComponent`/`loadChildren` per route, keeping the initial chunk minimal. (2) `@defer` for heavy components within routes. (3) Tree-shaking — Angular\'s build uses Ivy + esbuild which tree-shakes unused code automatically; avoid barrel `index.ts` re-exports that defeat tree-shaking. (4) Analyse with `webpack-bundle-analyzer` (`ng build --stats-json`) to find large dependencies. (5) Replace heavy libraries with lighter alternatives (e.g., `date-fns` instead of `moment`). (6) `NgOptimizedImage` with a CDN loader for image optimisation. (7) Enable Brotli compression on the server. (8) Use differential loading / modern JS targets (`"target": "ES2022"`).',
    followUp: 'How does esbuild in the Angular build pipeline compare to Webpack for bundle size?',
  },
  {
    id: 143, level: 'senior', category: 'performance',
    q: 'Explain the Event Loop, macro-tasks, micro-tasks, and how Zone.js intercepts them.',
    a: 'The browser event loop processes tasks sequentially. Micro-tasks (Promises, MutationObserver callbacks, queueMicrotask) run to completion after each task before the next task begins. Macro-tasks (setTimeout, setInterval, XHR callbacks, DOM events) are queued as discrete tasks. Zone.js monkey-patches all these APIs at application startup. When any patched async operation completes inside Angular\'s zone, Zone.js notifies Angular to run change detection. This means ANY setTimeout anywhere in the app triggers a full change detection cycle. In zoneless Angular, only explicit signal changes or `markForCheck()` trigger detection — eliminating accidental detection triggers and their CPU cost.',
    followUp: 'How does requestAnimationFrame interact with Zone.js?',
  },
  {
    id: 144, level: 'senior', category: 'performance',
    q: 'How do Angular\'s new @for and @if differ from *ngFor and *ngIf in performance?',
    a: 'The new control flow (`@for`, `@if`, `@switch` in Angular 17+) are built into the Angular compiler as first-class constructs, not directives. `@for` requires a `track` expression (previously optional `trackBy`) — enforced by the compiler, preventing accidental O(n) re-renders. The compiler can statically analyse control flow and generate more optimal code. `@for` also short-circuits — if the array is identical, no DOM diffing occurs. `@if`/`@else` is a single structural unit, eliminating the `ng-template` + `else` pattern. The new syntax also enables `@defer` to understand what it is deferring. In benchmarks, the new `@for` is measurably faster than `*ngFor` for large lists.',
    followUp: 'How do you migrate from *ngFor to @for automatically?',
  },
  {
    id: 145, level: 'senior', category: 'performance',
    q: 'What is the Angular CDK and how does it help with performance for complex UIs?',
    a: 'The Angular CDK (Component Dev Kit) provides behaviour primitives without opinionated styling. Performance-relevant CDK features: `CdkVirtualScrollViewport` (from `@angular/cdk/scrolling`) — renders only visible items in large lists via windowed virtual scrolling, reducing DOM nodes from thousands to ~20. `CdkDrag`/`CdkDrop` — performant drag-and-drop using CSS transforms (not reflow-triggering layout changes). `OverlayModule` — manages overlays with efficient positioning calculations, detaching from the DOM when hidden. `Portal` — renders content into a different part of the DOM without performance overhead. `ResizeObserver` via CdkObserveContent — efficient DOM resize tracking. The CDK is the foundation that Angular Material is built on.',
    followUp: 'What is the itemSize option on CdkVirtualScrollViewport and what happens if items have variable height?',
  },

  // ─── ARCHITECTURE 146-155 ─────────────────────────────────────────────────────
  {
    id: 146, level: 'mid', category: 'architecture',
    q: 'What is the smart/dumb (container/presentational) component pattern in Angular?',
    a: '"Smart" (container) components know about services, state, and business logic — they inject stores, make HTTP calls, and pass data to children via @Input(). "Dumb" (presentational) components receive data via inputs and emit events via outputs — they have no service dependencies, are purely reactive to their inputs, and are easy to test and reuse. Benefits: presentational components can be `OnPush` and tested without TestBed. Smart components can be swapped with different presenters for different contexts (desktop vs mobile). The pattern enforces a one-directional data flow. In a signal-based app: smart components inject signal stores; dumb components use `input()` and `output()`.',
    followUp: 'When does the strict separation between smart and dumb components become counterproductive?',
  },
  {
    id: 147, level: 'senior', category: 'architecture',
    q: 'How do you structure a large Angular application (folder structure and module boundaries)?',
    a: 'Feature-based folder structure: `src/app/core/` (singletons: auth, HTTP interceptors, logging — providedin root), `src/app/shared/` (reusable components, pipes, directives with no domain logic), `src/app/features/admin/`, `features/shop/` (each feature has its own routes, components, services — lazy-loaded). Use `provideRouter` with `loadChildren` or `loadComponent` per feature. Enforce module boundaries with the Nx `@nx/enforce-module-boundaries` rule or ESLint `import/no-restricted-paths`. Each feature should only import from `shared/` and `core/`, never from sibling features. This enables independent team ownership, lazy-loading, and predictable dependency graphs.',
    followUp: 'What is Nx and why do large Angular teams adopt it?',
  },
  {
    id: 148, level: 'senior', category: 'architecture',
    q: 'What are HTTP interceptors and what problems do they solve architecturally?',
    a: '`HttpInterceptorFn` (functional, Angular 15+): `(req, next) => { const authReq = req.clone({ headers: req.headers.set("Authorization", "Bearer " + token) }); return next(authReq) }`. Interceptors wrap the HTTP pipeline — each interceptor calls `next()` to pass to the next interceptor or to the actual HTTP call. Problems they solve: (1) Auth header injection for all requests — single place instead of every service. (2) Retry logic on 5xx errors. (3) Global loading indicator tracking. (4) Error normalisation (translate HTTP errors to app error types). (5) Request/response logging. (6) Cache layer. Provide with `withInterceptors([authInterceptor, loggingInterceptor])` in `provideHttpClient()`.',
    followUp: 'How do you skip an interceptor for specific requests?',
  },
  {
    id: 149, level: 'mid', category: 'architecture',
    q: 'What is dependency injection scoping in Angular (root, platform, component)?',
    a: '`providedIn: "root"` — single instance shared across the entire application; available everywhere; tree-shaken if unused. `providedIn: "platform"` — shared across multiple Angular applications on the same page. `providedIn: "any"` — one instance per lazy-loaded module, separate instance for eagerly-loaded modules. Component/directive `providers: [MyService]` — creates a new instance scoped to that component and its descendants; destroyed with the component. This enables "scoped store" patterns: a `WizardStateService` provided in the wizard\'s parent component exists only while the wizard is active. Understanding scoping is critical for avoiding shared mutable state bugs and for designing feature-scoped stores.',
    followUp: 'What happens when a child component provides a service that the parent also provides?',
  },
  {
    id: 150, level: 'senior', category: 'architecture',
    q: 'Explain the concept of injection tokens and when to use InjectionToken over a class.',
    a: '`InjectionToken<T>` provides a unique token for DI when the dependency is not a class: config objects, primitives, interface implementations, or abstract bases. `const API_URL = new InjectionToken<string>("API_URL"); providers: [{ provide: API_URL, useValue: "https://api.example.com" }]; /* inject: */ const url = inject(API_URL)`. Use cases: (1) Providing a configuration object `APP_CONFIG`. (2) Providing an interface implementation (injectable, not instantiatable). (3) Multi-providers: `{ provide: VALIDATORS, useClass: EmailValidator, multi: true }`. (4) Browser tokens: `DOCUMENT`, `WINDOW` for testability. Using a class token requires the class to be instantiatable — InjectionToken works with plain values.',
    followUp: 'What does the factory option on InjectionToken provide?',
  },
  {
    id: 151, level: 'senior', category: 'architecture',
    q: 'How do you implement a feature flag system in Angular?',
    a: 'Create a `FeatureFlagService` that loads flags from the server (or a config JSON) and exposes them as signals: `private _flags = signal<Record<string, boolean>>({})`. Components check: `flagService.isEnabled("newDashboard")`. For routing: use `CanMatchFn` to serve different components per flag value. For template control: `@if (flagService.isEnabled("feature"))`. For server-driven flags (A/B testing), load flags in an `APP_INITIALIZER` so they are available before any component renders. To prevent flicker: SSR can embed the flags in the HTML via `TransferState`. For gradual rollout: call an analytics endpoint when the flag is read to track exposure. Integrate with services like GrowthBook, LaunchDarkly, or Unleash.',
    followUp: 'How do you test components that branch on feature flags?',
  },
  {
    id: 152, level: 'mid', category: 'architecture',
    q: 'What is the purpose of the APP_INITIALIZER token?',
    a: '`APP_INITIALIZER` runs factory functions BEFORE the application bootstraps — before any component renders. Example: load configuration from the server, verify auth tokens, or initialise feature flags: `providers: [{ provide: APP_INITIALIZER, useFactory: () => { const cfg = inject(ConfigService); return () => cfg.load() }, multi: true }]`. The factory returns a function that returns a Promise or Observable — Angular waits for all to resolve before displaying any UI. Use `multi: true` because multiple initializers can be registered. Common use cases: translation loading (`ngx-translate`), user profile pre-loading, analytics setup. Overuse delays the first paint — only use for truly blocking requirements.',
    followUp: 'What happens if an APP_INITIALIZER function rejects or errors?',
  },
  {
    id: 153, level: 'senior', category: 'architecture',
    q: 'How do you implement micro-frontends with Angular?',
    a: 'Angular micro-frontends approaches: (1) Module Federation (Webpack 5) — each Angular app is a remote that exposes components/routes; a shell app loads them at runtime. `@angular-architects/module-federation` provides Angular-specific tooling. (2) Web Components — compile Angular components to custom elements (`createCustomElement()` from `@angular/elements`), mount them in any host app. (3) iframes — full isolation but poor UX and cross-frame communication complexity. (4) Single-SPA — framework-agnostic lifecycle management. Key challenges: shared dependencies (multiple Angular versions), state sharing across micro-apps, routing coordination, and CSS isolation. Module Federation is the most practical for all-Angular teams.',
    followUp: 'How do you handle shared state (auth, theme) across Angular micro-frontends?',
  },
  {
    id: 154, level: 'senior', category: 'architecture',
    q: 'What is the Angular security model for XSS and how does DomSanitizer work?',
    a: 'Angular escapes all interpolated values (`{{ }}`) and attribute bindings by default — HTML entities are escaped, preventing XSS. For resource URLs and HTML, Angular blocks potentially dangerous values. `DomSanitizer.bypassSecurityTrustHtml(html)` explicitly marks content as safe — use ONLY for known-safe HTML from your own server (never from user input). `bypassSecurityTrustUrl(url)` for resource URLs. The `[innerHTML]="html"` binding sanitises HTML by default even without `bypassSecurity`. The Content Security Policy (CSP) is the defense-in-depth layer — configure it via HTTP headers. Never use `bypassSecurityTrustHtml` with user-supplied content; that is the XSS vulnerability.',
    followUp: 'How do you safely render markdown content in an Angular component?',
  },
  {
    id: 155, level: 'senior', category: 'architecture',
    q: 'What is Angular\'s standalone component migration path from NgModules and what are the trade-offs?',
    a: 'Migration path: (1) Run `ng generate @angular/core:standalone` — the schematic converts components, directives, and pipes to standalone, moves imports to the `imports` array, and bootstraps with `bootstrapApplication`. (2) Convert routes to `loadComponent`/`loadChildren`. (3) Replace `NgModule` services with `providedIn: "root"` or route-level providers. (4) Remove empty NgModules. Trade-offs: Standalone makes dependencies explicit (each component declares its own imports), enables tree-shaking per component, simplifies testing (no TestBed module declarations), and aligns with the Angular team\'s direction. The cost is verbosity — every component lists its own imports. Shared imports can be grouped into an `importGroup` array or a flat exports file, but there is no re-export module equivalent.',
    followUp: 'Can standalone and NgModule components coexist in the same Angular application?',
  },

  // ─── TYPESCRIPT 156-163 ──────────────────────────────────────────────────────
  {
    id: 156, level: 'junior', category: 'typescript',
    q: 'What is the difference between interface and type alias in TypeScript?',
    a: 'Both describe object shapes but have differences: Interfaces can be extended with `extends` and can be `implement`ed by classes — they are open (can be re-declared and merged across files). Type aliases use `=` and can represent unions, intersections, primitives, tuples, and mapped types — not just object shapes. Interfaces are typically preferred for public API contracts and class shapes (they generate better error messages). Type aliases are preferred for unions (`type Result = Success | Error`), utility types, and mapped/conditional types. Both are erased at runtime — no performance difference. In modern TypeScript, the distinction matters less; many teams use `interface` for objects and `type` for everything else.',
    followUp: 'What is declaration merging and which type declarations support it?',
  },
  {
    id: 157, level: 'mid', category: 'typescript',
    q: 'What are TypeScript generics and how do they improve Angular component and service design?',
    a: 'Generics add type parameters to functions, classes, and interfaces — enabling type-safe reusability. `function first<T>(arr: T[]): T | undefined`. In Angular: `signal<T>()`, `FormControl<T>`, `HttpClient.get<User[]>("/users")`, `resource<User, number>({ request: id, loader })`. A typed data table component: `@Component(...)  class DataTable<T> { rows = input<T[]>() }` — the template can call methods on `T` if constrained: `T extends { id: number }`. Service generics: `class Repository<T extends Entity> { findById(id: number): Observable<T> }`. Generics eliminate `any` and enable the type system to catch mismatches between API responses and their consumers.',
    followUp: 'What is the difference between T extends object and T extends Record<string, unknown>?',
  },
  {
    id: 158, level: 'mid', category: 'typescript',
    q: 'Explain TypeScript\'s discriminated unions and how they apply to Angular state management.',
    a: 'A discriminated union is a union of types that each have a common literal property (the discriminant). Example: `type State = { status: "loading" } | { status: "success"; data: User[] } | { status: "error"; message: string }`. TypeScript narrows the type based on the discriminant: `if (state.status === "success") { state.data.length }`. In Angular, this pattern models async data states safely — the `data` property is only accessible in the `"success"` branch, preventing `undefined` access. Angular\'s `resource()` status enum is effectively a discriminated union. Use discriminated unions for action types in signal reducers and for typed HTTP response handling.',
    followUp: 'How does TypeScript\'s exhaustiveness checking work with discriminated unions?',
  },
  {
    id: 159, level: 'mid', category: 'typescript',
    q: 'What is TypeScript\'s strict mode and why should Angular projects enable it?',
    a: '`"strict": true` in `tsconfig.json` enables: `strictNullChecks` (null/undefined are not assignable to every type), `strictFunctionTypes` (contravariant function parameter checking), `strictBindCallApply`, `strictPropertyInitialization` (class properties must be initialised), `noImplicitAny` (implicit `any` is an error), `noImplicitThis`. Angular\'s `ng new` enables strict mode by default. Benefits: catches null pointer exceptions at compile time, prevents `any` spreading through the codebase, enables Angular\'s typed forms API, and improves IDE autocomplete accuracy. The initial migration is painful (fixing existing `any`s and null checks) but drastically reduces runtime bugs. Pair with `strictTemplates: true` in `tsconfig.app.json` for full template type checking.',
    followUp: 'What is the noUncheckedIndexedAccess option and should you enable it?',
  },
  {
    id: 160, level: 'senior', category: 'typescript',
    q: 'How do you use TypeScript decorators (metadata reflection) in Angular and what changes with Angular 17\'s partial compilation?',
    a: 'Traditional Angular uses TypeScript decorators (`@Component`, `@Injectable`, `@NgModule`) with `emitDecoratorMetadata: true` to store type information for DI. Angular\'s Ivy compiler performs static analysis at build time, making runtime metadata less critical. Angular 17+ uses "partial compilation" (Ivy\'s `linkedCompileMode`) — components emit a `ɵcmp` definition that is fully resolved at link time rather than runtime, improving build performance and enabling Angular-specific optimisations. The `inject()` function (a procedural DI alternative) works without decorators entirely. TypeScript 5.0 introduced Stage 3 decorators (different from legacy TypeScript decorators) — Angular 19+ supports them. The practical impact: gradual migration toward decorator-free, inject()-based code.',
    followUp: 'What is the difference between inject() and constructor injection in terms of testability?',
  },
  {
    id: 161, level: 'senior', category: 'typescript',
    q: 'What are TypeScript mapped types and how are they used in Angular\'s typed forms?',
    a: 'Mapped types transform every property of an existing type: `type Optional<T> = { [K in keyof T]?: T[K] }`. Angular\'s typed `FormGroup<T>` uses a mapped type where `T` maps each key to a `FormControl`, `FormGroup`, or `FormArray`: `type ControlsOf<T> = { [K in keyof T]: FormControl<T[K]> }`. The typed forms API internally maps the model interface to a tree of form controls. Other common mapped types: `Readonly<T>`, `Partial<T>`, `Required<T>`, `Record<K, V>`, and custom `Nullable<T> = { [K in keyof T]: T[K] | null }`. Mapped types power Angular\'s signal API: `InputSignal<T>` maps the `T` of `input<T>()` through the signal system.',
    followUp: 'What is the difference between a homomorphic mapped type and a non-homomorphic one?',
  },
  {
    id: 162, level: 'mid', category: 'typescript',
    q: 'What is the difference between unknown, any, and never in TypeScript?',
    a: '`any` — the escape hatch; a value of type `any` can be used as any type and any type is assignable to it — it effectively disables type checking. `unknown` — the type-safe alternative: you cannot use an `unknown` value without first narrowing it with `typeof`, `instanceof`, or a type guard. `never` — the bottom type; represents a value that can never exist (an exhaustively narrowed union, a function that always throws, an infinite loop). Use `unknown` instead of `any` for externally typed values (parsed JSON, API responses before typing). Use `never` for exhaustiveness: `function assertNever(x: never): never { throw new Error("Unreachable: " + x) }` at the end of a switch to ensure all union cases are handled.',
    followUp: 'What type does TypeScript infer for a function that throws unconditionally?',
  },
  {
    id: 163, level: 'senior', category: 'typescript',
    q: 'How do you write type-safe event handlers in Angular with custom event types?',
    a: 'Define strict event types: `interface UserSelectedEvent { userId: string; timestamp: number }`. Use `EventEmitter<UserSelectedEvent>` or `output<UserSelectedEvent>()`. In the template handler, TypeScript infers `$event` as `UserSelectedEvent`. For DOM events, extend `Event`: `interface CustomClickEvent extends MouseEvent { detail: { itemId: string } }`. Access in handlers: `(event: CustomClickEvent) => event.detail.itemId`. For `@HostListener` with typed events: `@HostListener("click", ["$event"]) onClick(event: MouseEvent)`. With signal inputs receiving complex event objects, use generics: `readonly event = input<UserSelectedEvent>()`. Proper event typing prevents `$event.target.value` type errors that `any` would hide.',
    followUp: 'How do you type a custom DOM event that a Web Component emits?',
  },

  // ─── COMPONENTS 164-167 ──────────────────────────────────────────────────────
  {
    id: 164, level: 'junior', category: 'components',
    q: 'What is @HostListener and @HostBinding, and when would you use them?',
    a: '@HostListener("event", ["$event"]) attaches an event listener to the host element of a directive or component. @HostBinding("class.active") prop = true binds a property, attribute, or class directly to the host element without touching the template. Modern preferred alternative: the static `host` property on @Component/@Directive: `host: { "(click)": "onClick($event)", "[class.active]": "isActive()" }`. The `host` object is statically analysable and tree-shaken better than decorator-based listeners. Practical use: a `HighlightDirective` that listens to `mouseenter`/`mouseleave` on its host to toggle a background color — @HostListener is still the most readable choice for that pattern.',
    followUp: 'Can @HostListener listen to window or document events from within a component?',
  },
  {
    id: 165, level: 'mid', category: 'components',
    q: 'How do you create a custom structural directive with ViewContainerRef and TemplateRef?',
    a: 'Structural directives control DOM structure using `ViewContainerRef` and `TemplateRef`. Inject both: `constructor(private vcr: ViewContainerRef, private tpl: TemplateRef<any>) {}`. To show content: `this.vcr.createEmbeddedView(this.tpl)`. To hide it: `this.vcr.clear()`. Wire to an input with a setter: `@Input() set appUnless(condition: boolean) { condition ? this.vcr.clear() : this.vcr.createEmbeddedView(this.tpl) }`. Angular translates `*appUnless="expr"` to `<ng-template [appUnless]="expr">` automatically. To pass context (like `*ngFor let item of`), supply a context object: `this.vcr.createEmbeddedView(this.tpl, { $implicit: currentItem })` — the template accesses it with `let item`.',
    followUp: 'What is the $implicit context property in a structural directive context object?',
  },
  {
    id: 166, level: 'senior', category: 'components',
    q: 'What is Renderer2 and why should you use it over direct DOM manipulation in Angular?',
    a: 'Renderer2 is Angular\'s abstraction layer over the DOM. Instead of `el.classList.add("active")`, use `this.renderer.addClass(el, "active")`. Reasons to prefer it: (1) SSR compatibility — `document` and `window` do not exist on the server; Renderer2 no-ops gracefully. (2) Security — it integrates with Angular\'s DomSanitizer and CSP enforcement. (3) Web Worker readiness — future Angular architectures may move component logic off the main thread. Key methods: `createElement`, `appendChild`, `setStyle`, `setAttribute`, `listen`, `addClass`, `removeClass`. Inject via `private renderer = inject(Renderer2)` and access the host element via `inject(ElementRef).nativeElement`. Reserve direct `nativeElement` access for `afterNextRender()` scenarios where browser APIs are required.',
    followUp: 'What is the isPlatformBrowser() utility and when do you need it alongside Renderer2?',
  },
  {
    id: 167, level: 'senior', category: 'components',
    q: 'What are Angular Elements (custom elements) and when would you use them?',
    a: '`@angular/elements` compiles Angular components into standard Web Components (Custom Elements v1). `createCustomElement(MyWidget, { injector })` returns a constructor you register with `customElements.define("my-widget", ctor)`. Once registered, `<my-widget></my-widget>` works in any HTML page — React, Vue, or plain HTML — without the consumer knowing Angular is involved. Use cases: (1) embedding an Angular component in a non-Angular host app or CMS; (2) micro-frontends where teams use different frameworks; (3) shareable widgets (chat bubble, feedback form). @Input() maps to observed HTML attributes; @Output() becomes a DOM CustomEvent. Trade-off: the Angular runtime bundles with the element — use with `application/` builder and split the polyfill separately to keep size reasonable.',
    followUp: 'How does Angular Elements handle two-way binding and complex object inputs?',
  },

  // ─── SIGNALS 168-171 ──────────────────────────────────────────────────────────
  {
    id: 168, level: 'mid', category: 'signals',
    q: 'How does Angular\'s signal graph prevent the "diamond problem" (glitches in reactive updates)?',
    a: 'The diamond problem: if A → B, A → C, and D depends on both B and C, a naive system updates D twice with a stale intermediate B or C value. Angular\'s signal graph uses version tracking: when A changes, B and C are marked "dirty" but NOT immediately re-evaluated. D is also marked dirty. When D is READ (by the template renderer), it checks if its direct dependencies (B, C) are dirty, pulls their latest value (which triggers their lazy re-evaluation from A), then computes D once. This "pull" model guarantees: (1) each computed evaluates at most once per change cycle, (2) it always sees fully consistent inputs, (3) no extraneous intermediate values reach the template.',
    followUp: 'How does this pull-based model differ from RxJS\'s push-based Subject notifications?',
  },
  {
    id: 169, level: 'senior', category: 'signals',
    q: 'How would you implement undo/redo functionality using Angular signals?',
    a: 'Store state as a history stack signal and a pointer signal: `private _history = signal<State[]>([initial]); private _ptr = signal(0)`. Expose current state: `readonly state = computed(() => this._history()[this._ptr()])`. Apply a change: `this._history.update(h => [...h.slice(0, this._ptr() + 1), newState]); this._ptr.update(p => p + 1)` — slicing discards the redo branch on new changes. Undo: `this._ptr.update(p => Math.max(0, p - 1))`. Redo: `this._ptr.update(p => Math.min(this._history().length - 1, p + 1))`. Derive button enable states: `readonly canUndo = computed(() => this._ptr() > 0); readonly canRedo = computed(() => this._ptr() < this._history().length - 1)`. Cap history at N entries to limit memory usage.',
    followUp: 'What is the trade-off between storing full state snapshots vs. storing action deltas for undo/redo?',
  },
  {
    id: 170, level: 'junior', category: 'signals',
    q: 'What is the difference between a writable signal and a read-only signal?',
    a: 'A writable signal (returned by `signal()`) exposes `.set()`, `.update()` — any code holding the reference can change its value. A read-only signal only exposes the `()` call to read the value; write methods are absent. You get one from `.asReadonly()` or from `computed()` or `input()`. The canonical signal store pattern: `private _items = signal<Item[]>([]); readonly items = this._items.asReadonly()` — the service holds the private writable reference and exposes the read-only view. Components can read `store.items()` reactively but cannot call `.set()` on it. This enforces unidirectional data flow at the TypeScript type level — the compiler rejects write attempts on a `Signal<T>` vs. a `WritableSignal<T>`.',
    followUp: 'What TypeScript type does asReadonly() return and how does it differ from WritableSignal<T>?',
  },
  {
    id: 171, level: 'senior', category: 'signals',
    q: 'How do you bridge Angular signals with third-party reactive libraries (RxJS, NgRx, Firebase)?',
    a: 'Two directions: (1) Observable → Signal — `toSignal(obs$, { initialValue })` from `@angular/core/rxjs-interop` works for any Observable — NgRx selectors, Firebase `valueChanges()`, RxDB queries. Angular auto-unsubscribes when the context is destroyed. (2) Signal → Observable — `toObservable(signal)` from the same package converts a signal to a `ReplaySubject(1)`-backed Observable, emitting each time the signal changes. Use this when a library needs an Observable interface. For non-RxJS libraries (TanStack Query, Zustand): write a thin bridge effect that reads the library\'s cache state and writes into a local writable signal. The principle: signals are the component\'s truth; external libraries live at the boundary and are translated in once.',
    followUp: 'What timing guarantees does toObservable() give — does the Observable emit synchronously when the signal changes?',
  },

  // ─── RXJS 172-175 ─────────────────────────────────────────────────────────────
  {
    id: 172, level: 'senior', category: 'rxjs',
    q: 'How do you write a custom RxJS operator?',
    a: 'A custom operator is a function that takes an Observable and returns an Observable. The idiomatic pipeable pattern: `function throttleDistinct<T>(ms: number): MonoTypeOperatorFunction<T> { return source => source.pipe(throttleTime(ms), distinctUntilChanged()) }`. Use it: `source$.pipe(throttleDistinct(300))`. For stateful operators that need teardown: return a `new Observable(subscriber => { const sub = source.subscribe({...}); return () => sub.unsubscribe() })`. Never extend Observable — the factory function pattern composes, tree-shakes, and tests cleanly. Always write marble tests for custom operators using `TestScheduler` to verify timing behavior: wrong operator ordering is a subtle bug that only marble tests catch reliably.',
    followUp: 'What is the difference between a pipeable (lettable) operator and a creation operator like interval()?',
  },
  {
    id: 173, level: 'mid', category: 'rxjs',
    q: 'What replaced retryWhen() in RxJS 7+ and how does the retry() config API work?',
    a: '`retryWhen()` was deprecated in RxJS 7 because its API was confusing — the notifier Observable\'s emissions triggered retries but controlling delay required composing extra operators inside the notifier. The modern replacement is `retry({ count, delay, resetOnSuccess })`. `count` — max retry attempts. `delay` — a function `(error, retryIndex) => ObservableInput` — return an Observable whose first emission triggers the next attempt (e.g., `timer(1000 * 2 ** retryIndex)` for exponential backoff), or a plain number for ms delay. `resetOnSuccess: true` resets the counter after a successful emission — useful for polling streams. To retry only on specific errors: `delay: (err) => err.status >= 500 ? timer(1000) : throwError(() => err)`.',
    followUp: 'How do you add a maximum total timeout across all retry attempts, not just per attempt?',
  },
  {
    id: 174, level: 'senior', category: 'rxjs',
    q: 'How do you manage a long-lived WebSocket connection with RxJS in Angular?',
    a: '`webSocket<T>(url)` from `rxjs/webSocket` creates a Subject — subscribe to receive messages, call `.next(msg)` to send. For reconnection: `ws$.pipe(retry({ delay: () => timer(2000) }), share())`. In a root service: `private ws = webSocket<ServerEvent>(url); readonly messages$ = this.ws.pipe(retry({ delay: timer(3000) }), share()); send(msg: ClientMsg) { this.ws.next(msg) }`. Components subscribe to `messages$.pipe(filter(isRelevant), takeUntilDestroyed())`. Close explicitly on app destroy: `ws.complete()`. Key pitfall: creating the socket per-component creates N connections — it must be a singleton service. For multiplexing multiple event types over one socket, use `ws.multiplex(subscribe, unsubscribe, filter)` to create topic-scoped Observables that share the single connection.',
    followUp: 'How does webSocket() handle reconnection — does it restore subscriptions from before the disconnect?',
  },
  {
    id: 175, level: 'mid', category: 'rxjs',
    q: 'What is connectable() in RxJS 7+ and what did it replace?',
    a: '`connectable(source, { connector })` replaces the deprecated `multicast()` and `publish()` operators. It wraps a cold Observable in a multicast Subject but does NOT auto-connect — you call `.connect()` explicitly to start the upstream subscription. Example: `const c = connectable(http.get("/api"), { connector: () => new ReplaySubject(1) }); const subA = c.subscribe(a); const subB = c.subscribe(b); c.connect()` — one HTTP request, both subscribers get the value. Compare to `share()` which auto-connects on first subscriber and resets when the count reaches zero. `connectable()` is for precise control (e.g., pre-subscribing multiple consumers before starting the source). For most caching, prefer `share({ connector: () => new ReplaySubject(1), resetOnRefCountZero: false })`.',
    followUp: 'What happens to a connectable() Observable if connect() is never called?',
  },

  // ─── ARCHITECTURE 176-179 ─────────────────────────────────────────────────────
  {
    id: 176, level: 'senior', category: 'architecture',
    q: 'What is the Facade pattern in Angular and why does it improve testability?',
    a: 'A Facade is a service that wraps a complex subsystem (NgRx store, multiple API services, a signal store) behind a simple, domain-oriented interface. Components inject the Facade and call `facade.loadProducts()`, `facade.addToCart(item)`, and read `facade.cart()` — they have no direct knowledge of what is underneath. Testability benefit: a component test mocks three method calls on one Facade instead of wiring up NgRx + HTTP + auth service. Domain benefit: the Facade is the feature\'s public API — changing state management from plain signals to NgRx only requires editing the Facade, not every component. In DDD terms, the Facade is an anti-corruption layer between the UI and the domain model.',
    followUp: 'How does a Facade relate to the Command Query Separation (CQS) principle?',
  },
  {
    id: 177, level: 'mid', category: 'architecture',
    q: 'What are Angular environment files and how do build-time file replacements work?',
    a: '`src/environments/environment.ts` (dev) and `environment.prod.ts` (prod) hold build-time constants. The `angular.json` `configurations.production.fileReplacements` array tells the builder to swap `environment.ts` with `environment.prod.ts` during `ng build --configuration production`. Import in app code: `import { environment } from "../environments/environment"`. Limitation: you need a separate build artifact per environment, which is incompatible with Docker "build once, deploy many" pipelines. Modern recommendation: move to runtime configuration — fetch a `config.json` via `APP_INITIALIZER`, swap the JSON file per deployment without rebuilding. Environment files remain useful for truly build-time constants (e.g., feature flags that affect tree-shaking).',
    followUp: 'How do you pass Angular environment values into an SSR server without hardcoding them?',
  },
  {
    id: 178, level: 'senior', category: 'architecture',
    q: 'How do you implement dynamic runtime configuration (one build, many environments) in Angular?',
    a: 'Fetch a `config.json` at startup via `APP_INITIALIZER`: `{ provide: APP_INITIALIZER, useFactory: () => { const cfg = inject(ConfigService); return () => cfg.load() }, multi: true }`. `ConfigService.load()` calls `HttpClient.get<Config>("/assets/config.json")` and stores values in a private signal. Components read `configService.apiUrl()`. The `config.json` lives outside the bundle — CI/CD replaces it per environment, or Docker bakes values via environment variables into it at container startup. This is the 12-factor app approach: one artifact, externalized config. For SSR: use `process.env` server-side and embed the config into `TransferState` so the client hydrates without an extra fetch. Never put secrets (API keys) in `config.json` — those belong in server-side proxy calls.',
    followUp: 'How do you validate the shape of the loaded config.json at runtime to catch misconfiguration early?',
  },
  {
    id: 179, level: 'junior', category: 'architecture',
    q: 'What is the Angular CLI and what are the most important ng commands to know?',
    a: 'The Angular CLI (`ng`) is the official build tool, dev server, and scaffold generator. Key commands: `ng new <name>` — scaffold a project with routing, tests, and build config. `ng serve` — dev server with HMR at localhost:4200. `ng build` — production bundle in `dist/`. `ng generate component <name>` (or `ng g c`) — generates component, spec, and wires imports. Also: `ng g service`, `ng g directive`, `ng g pipe`, `ng g guard`. `ng test` — run unit tests via Jest or Karma. `ng add @angular/material` — installs a package and runs its schematic (auto-configures the app). `ng update` — migrates packages AND runs Angular codemods (e.g., automatic ngModule → standalone migration). `ng lint` — runs ESLint. Understanding schematics is the key to customizing what `ng generate` produces.',
    followUp: 'What is a schematic and how does it differ from a regular npm package install?',
  },

  // ─── TESTING 180-182 ─────────────────────────────────────────────────────────
  {
    id: 180, level: 'senior', category: 'testing',
    q: 'What are Angular CDK component harnesses and why are they better than CSS selectors in tests?',
    a: 'A CDK `ComponentHarness` is a test utility class that provides a stable API for interacting with a component — decoupled from internal DOM structure. Angular Material ships harnesses for all its components. Create one: `class ButtonHarness extends ComponentHarness { static hostSelector = "app-button"; async click() { return (await this.host()).click() } async isDisabled() { return (await this.host()).getProperty<boolean>("disabled") } }`. In tests: `const btn = await TestbedHarnessEnvironment.harnessForFixture(fixture, ButtonHarness); await btn.click()`. Benefits: when the HTML structure changes, only the harness class needs updating — all tests that use the harness continue to pass. CSS selectors in tests are tightly coupled to implementation; harnesses are coupled only to user-visible behaviour.',
    followUp: 'What is HarnessLoader and how does it help test a parent component that contains multiple harness instances?',
  },
  {
    id: 181, level: 'mid', category: 'testing',
    q: 'How do you test Angular routing with RouterTestingHarness?',
    a: '`RouterTestingHarness` (Angular 15+) is a declarative routing test utility. Setup: `TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] })`. Navigate: `const harness = await RouterTestingHarness.create("/products/42")`. The harness performs real router navigation, compiles the matched component, and renders it. Assert on the routed component: `const comp = harness.routeDebugElement!.componentInstance as ProductPage; expect(comp.productId()).toBe("42")`. Assert on the DOM: `harness.fixture.debugElement.query(By.css("h1")).nativeElement.textContent`. Test guards by navigating and checking `harness.routeNativeElement === null` (navigation was blocked) or the URL changed. More realistic than mocking `ActivatedRoute` or `Router` directly.',
    followUp: 'How do you test that a CanDeactivate guard shows a confirmation dialog before leaving a route?',
  },
  {
    id: 182, level: 'senior', category: 'testing',
    q: 'How do you set up E2E testing with Playwright for an Angular application?',
    a: 'Install: `npm install -D @playwright/test`. Create `playwright.config.ts` with `baseURL: "http://localhost:4200"` and `webServer: { command: "ng serve", url: "http://localhost:4200", reuseExistingServer: !process.env.CI }`. Write tests: `test("user logs in", async ({ page }) => { await page.goto("/login"); await page.fill("[data-testid=email]", "user@test.com"); await page.fill("[data-testid=password]", "pass"); await page.click("[data-testid=submit]"); await expect(page).toHaveURL("/dashboard") })`. Best practices: use `data-testid` attributes (stable across refactors), avoid CSS class selectors (implementation details), use `page.getByRole()` for accessible elements. Run in CI: `npx playwright test`. Playwright parallelises tests across browsers (Chromium, Firefox, WebKit) out of the box.',
    followUp: 'What is the trade-off between data-testid attributes and ARIA-role selectors for Playwright tests?',
  },

  // ─── PERFORMANCE 183-185 ─────────────────────────────────────────────────────
  {
    id: 183, level: 'senior', category: 'performance',
    q: 'What are Angular\'s preloading strategies and how do you implement a custom one?',
    a: 'Preloading downloads lazy route chunks in the background after the initial route loads, so future navigations feel instant. Built-in strategies: `NoPreloading` (default) — nothing preloads. `PreloadAllModules` — preloads all lazy routes after initial load. Custom strategy: implement `PreloadingStrategy`: `class DataDrivenPreload implements PreloadingStrategy { preload(route, load) { return route.data?.["preload"] ? load() : EMPTY } }`. Mark routes: `{ path: "shop", loadChildren: ..., data: { preload: true } }`. Register: `provideRouter(routes, withPreloading(DataDrivenPreload))`. Third-party option: `QuicklinkModule` preloads only routes whose `routerLink` is currently visible in the viewport — the most user-intent-aware strategy.',
    followUp: 'Does preloading happen for nested lazy child routes automatically, or do you need to configure it separately?',
  },
  {
    id: 184, level: 'mid', category: 'performance',
    q: 'How does NgOptimizedImage work and what performance improvements does it provide?',
    a: '`NgOptimizedImage` (`[ngSrc]`) replaces `<img src>` with automatic optimisations: (1) Enforces `width` and `height` attributes — prevents CLS (Cumulative Layout Shift) by reserving space before the image loads. (2) Adds `loading="lazy"` by default for below-fold images. The `[priority]` attribute adds `fetchpriority="high"` and `loading="eager"` for the LCP image and emits a `<link rel="preload">` in SSR. (3) Generates `srcset` for responsive images automatically. (4) Integrates with CDN loaders (Imgix, Cloudflare, Cloudinary) to generate correctly sized, format-optimised URLs. (5) Warns in dev mode when the image is rendered significantly larger than its natural size. The single biggest impact: adding `[priority]` to the hero image typically improves LCP score by 200-500ms.',
    followUp: 'What does the fill mode on NgOptimizedImage do and when is it appropriate?',
  },
  {
    id: 185, level: 'senior', category: 'performance',
    q: 'How does Angular\'s esbuild/Vite build pipeline (Angular 17+) compare to the old Webpack builder?',
    a: 'Angular 17+ ships `@angular-devkit/build-angular:application` (esbuild-based) as the default, replacing the Webpack `browser` builder. Key differences: (1) Speed — esbuild compiles TypeScript/JavaScript 10–100x faster than Webpack; cold production builds drop from 60s to ~8s on large apps; HMR is near-instant because only changed module output is re-emitted. (2) Smaller bundles — esbuild\'s tree-shaking is more aggressive; no Webpack runtime overhead in the bundle. (3) Dev server — uses Vite for native ESM serving and fast invalidation. (4) Less configurability — no direct Webpack plugin ecosystem; custom loaders/plugins need migration. Migrate: `ng update @angular/cli` then change `builder` in `angular.json` from `browser` to `application`.',
    followUp: 'How do you handle a Webpack-specific plugin (e.g., a custom SVG loader) when migrating to the esbuild builder?',
  },

  // ─── TYPESCRIPT 186-189 ──────────────────────────────────────────────────────
  {
    id: 186, level: 'senior', category: 'typescript',
    q: 'What are TypeScript conditional types and how do Angular\'s generic APIs use them?',
    a: '`T extends U ? X : Y` evaluates to `X` if `T` is assignable to `U`, else `Y`. Angular uses conditional types throughout its signal APIs: `input.required<T>()` returns `InputSignal<T>` (no `undefined`) while `input<T>()` returns `InputSignal<T | undefined>` — enforced via conditional constraints. `FormControl<T | null>` (nullable default) vs `FormControl<T>` (non-nullable with `nonNullable: true`) is differentiated at the type level. `infer` extends conditional types to extract embedded types: `type Unwrap<T> = T extends Signal<infer V> ? V : never`. `type RouteData<T> = T extends ResolveFn<infer D> ? D : never`. Distributive conditional types: `Nullable<T> = T extends any ? T | null : never` distributes over union members. These are library-authoring primitives — app code encounters them as the result of using Angular\'s typed APIs.',
    followUp: 'What is the distributive behaviour of conditional types and how do you disable it?',
  },
  {
    id: 187, level: 'mid', category: 'typescript',
    q: 'What are TypeScript template literal types and where do they appear in Angular contexts?',
    a: 'Template literal types construct string union types: `type Side = "left" | "right"; type Padding = \`padding-\${Side}\`` evaluates to `"padding-left" | "padding-right"`. Combined with `Capitalize<S>`, `Lowercase<S>`, `Uppercase<S>`. In Angular application code: (1) Strongly typing translation keys: `type TKey = keyof typeof en; translate(key: TKey)` — catches typos at compile time. (2) CSS custom property names: `type ThemeToken = "primary" | "secondary"; type CSSVar = \`--color-\${ThemeToken}\``. (3) Event name typing: `type InputEvent = \`on\${Capitalize<"change" | "focus" | "blur">}\``. Angular\'s own router explored path-typed routes using template literal types to extract `:param` names statically. Primarily useful in utility types and library APIs, not in everyday component code.',
    followUp: 'How would you use template literal types to type a strongly-typed i18n translation function?',
  },
  {
    id: 188, level: 'mid', category: 'typescript',
    q: 'What is the infer keyword in TypeScript and how would you use it in Angular services?',
    a: '`infer` appears only in the `extends` clause of a conditional type — it captures a type from the matched pattern into a local variable. `type ReturnType<T> = T extends (...args: any) => infer R ? R : never`. `type ElementOf<T> = T extends Array<infer E> ? E : never`. In Angular: `type SignalValue<T> = T extends Signal<infer V> ? V : never` extracts the value type from a signal. `type Resolved<T> = T extends ResolveFn<infer D> ? D : never`. `type Emitted<T> = T extends EventEmitter<infer E> ? E : never`. In generic service classes: `class Repo<T extends { id: number }> { findById(id: number): Observable<T> {} }` — callers do not need to specify `T` explicitly because TypeScript infers it from usage. Most Angular app code uses `infer` indirectly via built-in utility types: `Awaited<T>`, `Parameters<T>`, `InstanceType<T>`.',
    followUp: 'How does TypeScript\'s Awaited<T> utility type use infer to unwrap nested Promises?',
  },
  {
    id: 189, level: 'mid', category: 'typescript',
    q: 'What is type narrowing in TypeScript and which Angular patterns depend on it?',
    a: 'Type narrowing refines a union type to a more specific type inside a conditional branch. Narrowing techniques: `typeof x === "string"` (primitives), `x instanceof HttpErrorResponse` (classes), `"data" in response` (property check), discriminated union switch on a literal field, and user-defined type guards `function isUser(x: unknown): x is User { return typeof x === "object" && x !== null && "name" in x }`. Angular patterns that depend on narrowing: (1) Strict template type-checking — `@if (user)` tells the template compiler `user` is non-null inside the block. (2) Discriminated union state models: `type AsyncState<T> = { status: "loading" } | { status: "success"; data: T } | { status: "error"; msg: string }` — accessing `.data` only compiles in the `"success"` branch. (3) `catchError((e: HttpErrorResponse | TypeError) => ...)` — narrowing the error before handling it.',
    followUp: 'What is a type predicate and when is it safer than a type assertion (as)?',
  },

  // ─── ROUTING 190-191 ─────────────────────────────────────────────────────────
  {
    id: 190, level: 'mid', category: 'routing',
    q: 'How do you implement a dynamic page title strategy in Angular?',
    a: 'Angular 14+ provides `TitleStrategy`. The default sets `document.title` from the nearest `title` property in the route config: `{ path: "profile", title: "My Profile", component: ProfilePage }`. For a global app name prefix: extend `TitleStrategy`: `@Injectable() class AppTitleStrategy extends TitleStrategy { updateTitle(state: RouterStateSnapshot) { const t = this.buildTitle(state); document.title = t ? \`\${t} — MyApp\` : "MyApp" } }`. Provide: `{ provide: TitleStrategy, useClass: AppTitleStrategy }`. For fully dynamic titles (e.g., the product name from a resolver), supply a `ResolveFn<string>` as `title` in the route: `{ path: "product/:id", title: productTitleResolver, component: ProductPage }`. The resolver returns a plain string — Angular\'s TitleStrategy picks it up automatically.',
    followUp: 'How does Angular\'s TitleStrategy interact with SSR and what does it set on the server?',
  },
  {
    id: 191, level: 'senior', category: 'routing',
    q: 'How do you implement route transition animations in Angular?',
    a: 'Define an animation trigger on the element wrapping `<router-outlet>`. Get a route key from the outlet and bind it to the trigger: `<div [@routeAnim]="getRouteKey(outlet)"><router-outlet #outlet="outlet"></router-outlet></div>`. `getRouteKey(outlet) { return outlet.activatedRoute?.routeConfig?.path ?? "" }`. The trigger: `trigger("routeAnim", [transition("* <=> *", [query(":enter, :leave", style({ position: "absolute", width: "100%" }), { optional: true }), group([query(":leave", animate("200ms ease", style({ opacity: 0, transform: "translateX(-10px)" })), { optional: true }), query(":enter", [style({ opacity: 0 }), animate("200ms 100ms ease", style({ opacity: 1 }))], { optional: true })])])`. Key: absolute-position the leaving component so it overlaps the entering one during animation, then let the entering component claim flow.',
    followUp: 'How do you skip route animations for users who prefer reduced motion (prefers-reduced-motion)?',
  },

  // ─── FORMS 192-193 ──────────────────────────────────────────────────────────
  {
    id: 192, level: 'senior', category: 'forms',
    q: 'How do you implement cross-field validation (e.g., password confirmation) in Angular reactive forms?',
    a: 'Apply a group-level `ValidatorFn` to the `FormGroup` — it receives the group as the `AbstractControl`: `const passwordsMatch: ValidatorFn = (group) => { const pass = group.get("password")!.value; const confirm = group.get("confirm")!.value; return pass === confirm ? null : { passwordMismatch: true } }`. Add to the group: `new FormGroup({ password: new FormControl(""), confirm: new FormControl("") }, { validators: passwordsMatch })`. The error lives on the GROUP, not a child control: `form.errors?.["passwordMismatch"]`. Show in the template: `@if (form.hasError("passwordMismatch") && form.get("confirm")?.touched) { <p>Passwords do not match</p> }`. To propagate the error to the child control so it shows `ng-invalid` styling: call `form.get("confirm")!.setErrors({ passwordMismatch: true })` inside the validator.',
    followUp: 'How do you make the confirm-password field show ng-invalid CSS state when the group-level error fires?',
  },
  {
    id: 193, level: 'mid', category: 'forms',
    q: 'How do you dynamically enable or disable form controls based on another field\'s value?',
    a: 'Subscribe to the controlling field\'s `valueChanges` and call `enable()` / `disable()` on the dependent control: `this.form.get("hasDiscount")!.valueChanges.pipe(startWith(this.form.get("hasDiscount")!.value), takeUntilDestroyed()).subscribe(has => { const code = this.form.get("discountCode")!; has ? code.enable() : code.disable() })`. Key behaviours: (1) `form.value` excludes disabled controls — use `form.getRawValue()` to include them. (2) Disabled controls do not run validators. (3) `startWith()` ensures the initial state is applied when the form loads. With signals: observe the controlling field via `toSignal(valueChanges, { initialValue })` and use an `effect()` to call enable/disable. Never simulate disable by removing validators — the `control.disable()` API is the correct approach and integrates with `form.valid`.',
    followUp: 'Why does form.value exclude disabled controls, and when does that cause subtle bugs?',
  },

  // ─── COMPONENTS 194-197 ──────────────────────────────────────────────────────
  {
    id: 194, level: 'mid', category: 'components',
    q: 'What causes the ExpressionChangedAfterItHasBeenChecked error and how do you fix it?',
    a: 'This error fires in dev mode when Angular\'s second verification pass finds that a binding\'s value changed during the first pass. Common causes: (1) a lifecycle hook (ngAfterViewInit, ngAfterContentInit) synchronously updates a binding that was already checked. (2) a pipe returns a different object reference on every call. (3) a service value mutates as a side effect of rendering. Fixes: (a) Use `ChangeDetectorRef.detectChanges()` immediately AFTER the offending hook — schedules another sync check for that component subtree. (b) Move the state update to `ngOnInit` (runs before the first view check). (c) Use `queueMicrotask(() => this.value = x)` or `setTimeout` to defer the update past the current CD cycle. (d) With signals, the error typically disappears — signal writes schedule future updates, not synchronous ones inside the current cycle.',
    followUp: 'Why does this error only appear in development mode and not in production builds?',
  },
  {
    id: 195, level: 'junior', category: 'components',
    q: 'What is ng-template and how do you use TemplateRef in Angular?',
    a: '`<ng-template>` is an Angular template fragment that is NOT rendered by default — it exists as a definition only. Mark it with a template reference: `<ng-template #loadingTpl><p>Loading...</p></ng-template>`. Use it as an @else branch: `@if (data) { ... } @else { <ng-container *ngTemplateOutlet="loadingTpl"> }`. Pass it to a component as an input: `<app-table [rowTemplate]="myRow">` — the component receives it as `@Input() rowTemplate!: TemplateRef<any>` and renders it with `ViewContainerRef.createEmbeddedView(rowTemplate, context)`. The `context` object\'s `$implicit` property binds to `let item` in the consuming template. The pattern powers reusable table, list, and dialog components where the caller controls the rendering while the component controls the structure.',
    followUp: 'What is the difference between ng-template and ng-container?',
  },
  {
    id: 196, level: 'senior', category: 'components',
    q: 'How do Angular\'s internal LViews and embedded views relate to ViewContainerRef?',
    a: 'Angular\'s runtime represents the component tree as a tree of LViews (logical views). Each component has a host LView and a template LView. Embedded views are LViews created by `ViewContainerRef.createEmbeddedView(TemplateRef)` — they have no host element and are anchored inside a `ViewContainerRef` slot in the parent LView. Dynamic components (`createComponent()`) also produce an LView but with a host element. Change detection walks this LView tree top-down. `ViewContainerRef.detach(index)` removes an embedded view from the CD tree without destroying it — what CDK virtual scrolling uses to "recycle" off-screen rows (detach, move the component, patch inputs, re-attach). `ViewContainerRef.insert(view, index)` moves an EmbeddedViewRef between containers. Understanding this explains why `viewChildren()` returns items in DOM/creation order — it iterates the LView\'s child array.',
    followUp: 'What is the difference between ComponentRef.destroy() and ViewContainerRef.detach() for dynamic components?',
  },
  {
    id: 197, level: 'mid', category: 'components',
    q: 'How does the signal input() API differ from @Input() + ngOnChanges for reacting to parent data changes?',
    a: 'With `@Input()`, `ngOnChanges(changes: SimpleChanges)` is the only way to react when a parent changes an input. All inputs fire together in one callback — you must check `changes["myInput"]` and narrow the type manually. With `input()` signals, each input IS a reactive value — derive from it with `computed(() => this.items().filter(u => u.active))` or react in `effect(() => { const id = this.id(); this.load(id) })`. The derivation is co-located with the input, type-safe, and individual. `input.required<T>()` adds a compile-time error if the parent omits the binding — `ngOnChanges` cannot enforce this. Result: signal-based components rarely need any lifecycle hooks at all — signals ARE the reactivity mechanism.',
    followUp: 'Can you still implement ngOnChanges on a component that uses the input() signal API?',
  },

  // ─── SIGNALS 198-200 ──────────────────────────────────────────────────────────
  {
    id: 198, level: 'mid', category: 'signals',
    q: 'How do afterRender phases work and why do they prevent layout thrashing?',
    a: 'Layout thrashing occurs when reads and writes of DOM geometry are interleaved — each read forces a browser reflow. `afterRender` solves this with four ordered phase callbacks: (1) `earlyRead` — read DOM properties without writing (e.g., `el.offsetWidth`). (2) `write` — apply DOM mutations (e.g., `el.style.width = w + "px"`). (3) `mixedReadWrite` — fallback for code that must both read and write. (4) `read` — final reads after writes. Register: `afterRender({ earlyRead: () => { this.width = this.el.offsetWidth }, write: () => { this.chart.resize(this.width) } })`. Critically, ALL `earlyRead` callbacks across ALL components run before ANY `write` callbacks run — preventing one component\'s DOM write from invalidating another component\'s geometry read within the same frame. Use `afterNextRender` with phases for one-time DOM initialisation (e.g., chart library setup).',
    followUp: 'What happens if you perform a DOM write inside an earlyRead phase callback?',
  },
  {
    id: 199, level: 'junior', category: 'signals',
    q: 'What is the difference between input(), input(default), and input.required()?',
    a: '`input<T>()` — optional input; if the parent does not bind it, the value is `undefined`. TypeScript type: `InputSignal<T | undefined>`. `input<T>(defaultValue)` — optional with a fallback; reading it never returns `undefined`. TypeScript type: `InputSignal<T>`. `input.required<T>()` — required; Angular raises a template compile-time error if the parent omits the binding. TypeScript type: `InputSignal<T>` (no `undefined`). Rule of thumb: use `input.required<T>()` for anything the component cannot function without — the type system catches the mistake before runtime. Use `input<T>(default)` for configuration options (page size, colours, labels) with sensible defaults. Use bare `input<T>()` only when the component has explicit behaviour for the absence case and you want to distinguish "not provided" from "provided as undefined".',
    followUp: 'Can input.required() accept a transform function to coerce the value type?',
  },
  {
    id: 200, level: 'senior', category: 'signals',
    q: 'How do you perform cleanup inside an effect() when it re-runs or the component is destroyed?',
    a: '`effect()` callbacks receive an `onCleanup` parameter: `effect((onCleanup) => { const ws = new WebSocket(this.url()); ws.onmessage = e => this.msg.set(e.data); onCleanup(() => ws.close()) })`. The cleanup callback runs: (1) before the effect re-runs because a dependency changed (closes the old WebSocket before opening a new one for a new URL), and (2) when the injection context is destroyed (component destroyed, final teardown). Without `onCleanup`, a URL signal change would open a second WebSocket while the first remains open — leaking memory and receiving duplicate messages. Use `onCleanup` for anything that must be explicitly released: `removeEventListener`, `clearInterval`, third-party library destroy calls, and Subscription.unsubscribe(). This is the effect equivalent of ngOnDestroy.',
    followUp: 'In what order do onCleanup and the new effect invocation run relative to rendering?',
  },

  // ─── RXJS 201-204 ─────────────────────────────────────────────────────────────
  {
    id: 201, level: 'mid', category: 'rxjs',
    q: 'When should you use an Observable vs a Promise in Angular, and how do you interop between them?',
    a: 'Use a Promise when: the operation resolves once, cancellation is not needed, and `async/await` is cleaner (e.g., a one-off API call in a service method). Use an Observable when: multiple values are emitted over time (WebSocket, event stream), cancellation matters (switchMap kills in-flight XHR on new keystrokes), or you need RxJS operators (debounce, retry, merge). Angular\'s `HttpClient` returns cold Observables — cancellable by design. Interop: `firstValueFrom(obs$)` converts an Observable to a Promise (resolves on first emission, rejects on error). `lastValueFrom(obs$)` resolves on last emission before completion. `from(promise)` wraps a Promise in an Observable. Prefer keeping the full RxJS chain intact in services; only convert at the component boundary when `async/await` is noticeably simpler.',
    followUp: 'What does firstValueFrom() do if the Observable completes without emitting?',
  },
  {
    id: 202, level: 'senior', category: 'rxjs',
    q: 'How do you implement exponential backoff with jitter using RxJS?',
    a: 'Exponential backoff waits 2^n × base seconds between retries. Jitter adds randomness to prevent thundering herd (all clients retrying simultaneously after a server outage). Implementation: `source$.pipe(retry({ count: 5, delay: (error, attempt) => { if (error.status < 500) return throwError(() => error); const base = Math.min(30_000, 1_000 * 2 ** attempt); const jitter = Math.random() * base * 0.3; return timer(base + jitter) }, resetOnSuccess: true }))`. Full-jitter (AWS best practice): replace `base * 0.3` with `base` — `timer(Math.random() * base)`. The `resetOnSuccess: true` option resets the retry counter after a successful emission — important for polling streams. This pattern is essential for any production service calling third-party APIs that experience transient failures.',
    followUp: 'What is "thundering herd" and why does adding jitter prevent it?',
  },
  {
    id: 203, level: 'mid', category: 'rxjs',
    q: 'What is the difference between withLatestFrom and combineLatestWith in RxJS?',
    a: '`withLatestFrom(b$)` — the combination is TRIGGERED by the source Observable. When the source emits, it grabs the latest value from `b$` and emits a pair. If `b$` has never emitted, the pair is silently skipped. `combineLatestWith(b$)` — emits whenever EITHER source emits, using the latest value from the other (after both have emitted at least once). Classic mistake: using `combineLatest` for a button click + form value — every form keystroke fires the output, not just the click. Correct: `buttonClicks$.pipe(withLatestFrom(form.valueChanges))` — fires ONLY on click, snapshotting the current form state. Use `withLatestFrom` for "take a snapshot of X when event Y happens". Use `combineLatest` for "emit whenever any reactive input changes (e.g., combined filter state)".',
    followUp: 'What happens in withLatestFrom if the secondary Observable (b$) throws an error?',
  },
  {
    id: 204, level: 'mid', category: 'rxjs',
    q: 'How do you implement a polling mechanism with RxJS that stops automatically when data is ready?',
    a: '`timer(0, 5000)` emits immediately then every 5 seconds. Chain through `switchMap` for the HTTP call and `takeWhile` (or `first`) to stop when the condition is met: `timer(0, 5_000).pipe(switchMap(() => http.get<Job>("/api/job/123")), takeWhile(job => job.status === "pending", true), takeUntilDestroyed()).subscribe(job => { if (job.status === "done") this.result.set(job.result) })`. The second argument `true` to `takeWhile` is "inclusive" — it includes the final emission that broke the predicate so you can read the terminal state. Wrap the inner HTTP call in `catchError(() => of(null))` inside the `switchMap` to prevent a transient network error from killing the entire polling stream. Add `filter(Boolean)` after to skip the null responses.',
    followUp: 'How do you add a maximum polling duration (e.g., time out after 2 minutes regardless of job status)?',
  },

  // ─── ARCHITECTURE 205-208 ─────────────────────────────────────────────────────
  {
    id: 205, level: 'senior', category: 'architecture',
    q: 'What does "declarative vs imperative" mean in Angular and why does the community prefer declarative?',
    a: 'Imperative describes HOW to get a result step-by-step: `ngOnInit() { this.service.getUsers().subscribe(u => this.users = u); this.filtered = this.users.filter(u => u.active) }`. Declarative describes WHAT the result IS: `readonly users = toSignal(this.service.getUsers()); readonly filtered = computed(() => this.users()?.filter(u => u.active) ?? [])`. Declarative advantages: (1) derivation and value are co-located — easier to reason about. (2) no mutation bugs — derived values update automatically. (3) no lifecycle boilerplate — no ngOnInit, no unsubscribe. (4) testable in isolation — set `_users.set([...])`, read `filtered()`, assert. The fully declarative Angular component uses `resource()` for fetching, `computed()` for all derived state, `input()` for parent data, and `output()` for events — zero instance property assignments after construction.',
    followUp: 'Are there legitimate cases where imperative code is the right choice in Angular even in 2025?',
  },
  {
    id: 206, level: 'mid', category: 'architecture',
    q: 'When do you use InjectionToken instead of a class as a DI token?',
    a: 'Use `InjectionToken<T>` when: (1) the dependency is not a class — a config object, primitive, abstract interface, or factory result. (2) You want `multi: true` providers — Angular merges all `multi` providers into an array. (3) The dependency is a browser global that must be mockable for SSR: `const WINDOW = new InjectionToken<Window>("WINDOW", { factory: () => window })`. (4) The same interface has multiple implementations — the interface itself is not a runtime value and cannot be a DI token. Example: `const API_URL = new InjectionToken<string>("API_URL"); providers: [{ provide: API_URL, useValue: env.apiUrl }]`. Use a class token when the dependency IS a class Angular should instantiate. Class tokens are unique by reference (no string collision); tokens with a `factory` option are tree-shakeable.',
    followUp: 'What is the difference between useValue, useClass, useFactory, and useExisting in provider definitions?',
  },
  {
    id: 207, level: 'senior', category: 'architecture',
    q: 'How do you architect a multi-tenant Angular app where API endpoints and theming vary per tenant?',
    a: 'Resolve tenant identity at bootstrap (from subdomain, HTTP header, or `/tenant` API call) inside an `APP_INITIALIZER` that populates a `TenantService`. Provide the API base URL via `InjectionToken<string>` derived from the tenant config — an HTTP interceptor prepends it to every request. For theming: the tenant object carries CSS custom property overrides applied to `:root` at bootstrap: `this.renderer.setProperty(document.documentElement, "style", \`--primary: \${t.colors.primary}\`)`. Feature availability: a `FeatureFlagService` reads `tenant.features` and exposes them as signals. Route access: `CanMatchFn` guards serve different components per tenant plan tier. The key invariant: tenant config is loaded once at startup and injected via DI — no component ever calls the tenant API directly.',
    followUp: 'How do you handle SSR in a multi-tenant app where tenant identity comes from the request hostname?',
  },
  {
    id: 208, level: 'junior', category: 'architecture',
    q: 'What are the key files in a modern Angular standalone application?',
    a: 'Since Angular 17, `ng new` generates a standalone app with no NgModules. Key files: `main.ts` — entry point; calls `bootstrapApplication(AppComponent, appConfig)`. `app.config.ts` — exports `appConfig: ApplicationConfig` containing all root-level providers: `provideRouter(routes)`, `provideHttpClient(withInterceptors([...]))`, `provideAnimationsAsync()`. `app.routes.ts` — exports `const routes: Routes` — top-level route definitions using `loadComponent`/`loadChildren` for lazy loading. `app.component.ts` — the shell component containing the global layout and `<router-outlet>`. Feature routes live in `features/products/products.routes.ts`. There is no `app.module.ts` — `@NgModule` is gone from new projects. The structure is flatter, more explicit about dependencies, and tree-shakeable.',
    followUp: 'How do you provide a root-level singleton service in a standalone app that has no AppModule?',
  },

  // ─── TESTING 209-212 ─────────────────────────────────────────────────────────
  {
    id: 209, level: 'mid', category: 'testing',
    q: 'How do you test a custom Angular pipe?',
    a: 'A pure pipe is a plain TypeScript class — test it directly without TestBed: `const pipe = new TruncatePipe(); expect(pipe.transform("hello world", 5)).toBe("hello...")`. For pipes that use `inject()` internally: `TestBed.configureTestingModule({ providers: [TruncatePipe, { provide: I18nService, useValue: mockI18n }] }); const pipe = TestBed.inject(TruncatePipe)`. For template integration: create a minimal host component that renders `{{ value | truncate:5 }}` and assert on the rendered text after `detectChanges()`. Always test edge cases: null/undefined input, empty string, exact boundary length. For pure pipes, verify the `transform()` is NOT called when the input reference is unchanged — spy on the method and call `detectChanges()` twice with the same input. Impure pipes must be tested with side effects that change between renders.',
    followUp: 'How do you test that an impure pipe updates the view when external state changes?',
  },
  {
    id: 210, level: 'mid', category: 'testing',
    q: 'How do you measure and enforce code coverage in an Angular project?',
    a: 'Run `ng test --coverage` — Angular CLI generates an Istanbul/NYC coverage report in `coverage/`. Open `coverage/index.html` for the HTML report showing statement, branch, function, and line coverage per file. Enforce thresholds in `jest.config.ts`: `coverageThreshold: { global: { statements: 80, branches: 75, functions: 80, lines: 80 } }` — CI fails if coverage drops below. In `angular.json`, use `codeCoverageExclude` to skip barrels and generated files: `["**/index.ts", "**/*.mock.ts", "**/main.ts"]`. Insight: 100% coverage does not mean 0 bugs — a test that calls a function without asserting anything achieves line coverage but tests nothing. Prioritise behaviour coverage (does the component do the right thing for the user?) over line coverage. Use `/* istanbul ignore next */` sparingly for truly unreachable error stubs.',
    followUp: 'Which of the four coverage metrics (statements, branches, functions, lines) is the most meaningful and why?',
  },
  {
    id: 211, level: 'senior', category: 'testing',
    q: 'How do you test a custom Angular attribute directive?',
    a: 'Create a minimal host component for the test: `@Component({ template: `<button appConfirm (confirmed)="onConfirm()">Delete</button>` }) class TestHost { onConfirm = jest.fn() }`. Configure TestBed with `TestHost` and `ConfirmDirective` (or import the directive in the host\'s imports if standalone). Get the directive instance: `const de = fixture.debugElement.query(By.directive(ConfirmDirective)); const dir = de.injector.get(ConfirmDirective)`. Trigger host events: `de.triggerEventHandler("click", new MouseEvent("click"))`. Assert on host outputs: `expect(fixture.componentInstance.onConfirm).toHaveBeenCalled()`. For directives that modify DOM: assert `de.nativeElement.classList.contains("active")`. For structural directives: assert the controlled element is in or out of the DOM — `expect(fixture.debugElement.query(By.css(".content"))).toBeNull()`.',
    followUp: 'How do you test a directive that reads and reacts to a @HostBinding property?',
  },
  {
    id: 212, level: 'senior', category: 'testing',
    q: 'What is the Page Object Model (POM) pattern in Angular component testing and when does it pay off?',
    a: 'A Page Object encapsulates DOM queries and interactions for a specific component or view. Instead of repeating `fixture.debugElement.query(By.css("[data-testid=submit]")).nativeElement.click(); fixture.detectChanges()` in every test, create: `class LoginPage { constructor(private f: ComponentFixture<LoginComponent>) {} get emailInput() { return this.f.debugElement.query(By.css("[data-testid=email]")).nativeElement } fillEmail(v: string) { this.emailInput.value = v; this.emailInput.dispatchEvent(new Event("input")); this.f.detectChanges() } submit() { this.f.debugElement.query(By.css("[data-testid=submit]")).nativeElement.click(); this.f.detectChanges() } get error() { return this.f.debugElement.query(By.css(".error"))?.nativeElement.textContent } }`. Tests read cleanly: `page.fillEmail("x@test.com"); page.submit(); expect(page.error).toContain("Invalid")`. POM pays off on complex forms, wizards, or any component tested 4+ ways. Angular CDK harnesses are the more standardised version of the same idea.',
    followUp: 'How do Angular CDK harnesses differ from hand-rolled page objects in terms of API stability guarantees?',
  },

  // ─── PERFORMANCE 213-215 ─────────────────────────────────────────────────────
  {
    id: 213, level: 'senior', category: 'performance',
    q: 'How do you add PWA / Service Worker support to an Angular app and what does the Angular SW cache?',
    a: 'Run `ng add @angular/pwa` — the schematic installs `@angular/service-worker`, generates `ngsw-config.json`, adds `provideServiceWorker("ngsw-worker.js", { enabled: !isDevMode() })` to `app.config.ts`, and creates a `manifest.webmanifest`. The Angular SW (NGSW) pre-caches all app shell assets on install and serves them from cache, making the app load offline. `ngsw-config.json` controls: `assetGroups` — which assets to precache (app shell: index.html, JS, CSS, fonts). `dataGroups` — API response caching with either `"freshness"` strategy (network first, cache fallback) or `"performance"` strategy (cache first, background update). For update notifications: `SwUpdate.versionUpdates` emits when a new version is detected — show a "new version available" banner and call `document.location.reload()` when the user acknowledges.',
    followUp: 'What happens if the NGSW has cached a broken version — how do you force all clients to update?',
  },
  {
    id: 214, level: 'mid', category: 'performance',
    q: 'What is TransferState in Angular SSR and what problem does it solve?',
    a: 'Without TransferState: the server renders HTML (making API calls), sends it to the browser. Angular bootstraps client-side and makes the SAME API calls again — double fetching. `TransferState` serialises server-fetched data into the HTML payload as a `<script type="application/json">` tag. On the client, Angular reads that JSON before making any HTTP calls. Angular 16+ automates this for all `HttpClient` requests via `withHttpTransferCache()` inside `provideClientHydration()` — zero manual code needed for HTTP. Manual usage is still needed for non-HTTP server data: `const key = makeStateKey<Product[]>("products"); if (this.transferState.hasKey(key)) { this.products.set(this.transferState.getAndRemove(key)) } else { const data = await this.db.query(); this.transferState.set(key, data); this.products.set(data) }`.',
    followUp: 'How do you prevent TransferState from caching authenticated user-specific responses on the server?',
  },
  {
    id: 215, level: 'senior', category: 'performance',
    q: 'What is prerendering (SSG) in Angular and when do you choose it over runtime SSR?',
    a: 'Prerendering generates static HTML files at BUILD time for known routes — `ng build` outputs `dist/index.html`, `dist/products/index.html`, etc. Configure in `angular.json`: `"prerender": { "discoverRoutes": true }` (Angular crawls static routes) or supply a `routes.txt` file for parameterised routes. The web server (Nginx, S3+CloudFront) serves plain HTML with zero server-side compute per request. Use prerendering for: marketing pages, docs, blog posts — content that rarely changes and has predictable URLs. Use SSR for: personalised pages, cart/account data, paginated search results, any content that depends on the request context or user identity. Hybrid in one app: `"prerender"` renders static routes, `"ssr"` handles dynamic ones. The decision rule: can this page\'s content be determined without knowing who is requesting it? If yes — prerender.',
    followUp: 'How do you provide route parameters to the prerenderer for parameterised routes like /product/:id?',
  },

  // ─── TYPESCRIPT 216-219 ──────────────────────────────────────────────────────
  {
    id: 216, level: 'mid', category: 'typescript',
    q: 'What is the TypeScript satisfies operator and how does it help in Angular configuration?',
    a: '`satisfies` (TypeScript 4.9) validates that an expression matches a type WITHOUT widening the inferred type. Contrast: `const routes: Routes = [{ path: "home", component: Home }]` — TypeScript validates the shape but `routes[0].path` is `string`. `const routes = [{ path: "home", component: Home }] satisfies Routes` — validates against `Routes` AND keeps `routes[0].path` as the literal `"home"`. In Angular: `const config = { apiUrl: "https://api.example.com", featureFlags: { darkMode: true } } satisfies AppConfig` — TypeScript catches missing or mistyped keys but `config.apiUrl` stays as the literal type, not widened to `string`. `const handlers = { login: loginFn, logout: logoutFn } satisfies Record<AuthAction, Handler>` — exhaustiveness check (if you add a new `AuthAction`, TypeScript requires a handler) while keeping the object\'s inferred shape.',
    followUp: 'What is the difference between using satisfies vs a type assertion (as AppConfig)?',
  },
  {
    id: 217, level: 'senior', category: 'typescript',
    q: 'What are TypeScript const assertions (as const) and how do they apply to Angular patterns?',
    a: '`as const` freezes an expression into its most specific literal type — all properties become `readonly`, strings narrow to their literal, numbers to their literal. `const dir = "left" as const` → type `"left"`, not `string`. Arrays: `["admin", "user"] as const` → `readonly ["admin", "user"]`. Object: `{ status: "loading" } as const` → `{ readonly status: "loading" }`. Angular patterns: (1) Route config — `const routes = [...] as const satisfies Routes` — path values are literals for potential static route-type libraries. (2) Signal store initial state — `const INIT = { count: 0, name: "" } as const` — the signal type is `WritableSignal<{ count: 0; name: "" }>` capturing literal types for exhaustive testing. (3) Deriving union types from arrays: `const ROLES = ["admin", "user", "guest"] as const; type Role = typeof ROLES[number]` → `"admin" | "user" | "guest"` — a single source of truth for the roles array AND the type.',
    followUp: 'What is the difference between Object.freeze() and as const — do they provide the same guarantees?',
  },
  {
    id: 218, level: 'mid', category: 'typescript',
    q: 'What are TypeScript utility types and how do you use them in Angular services and DTOs?',
    a: 'Key utility types in Angular: `Partial<T>` — all properties optional; use for update/patch DTOs: `function patchUser(id: string, changes: Partial<User>)`. `Required<T>` — all properties required; use when an API guarantees all fields. `Pick<T, K>` — keep only listed keys: `type UserCard = Pick<User, "id" | "name" | "avatar">` for table columns. `Omit<T, K>` — exclude keys: `type CreateUserDto = Omit<User, "id" | "createdAt">` for creation payloads. `Record<K, V>` — object with known key type: `Record<string, FeatureFlag>` for a flag map. `NonNullable<T>` — removes null/undefined: used after filtering nullable signals. `Parameters<F>` / `ReturnType<F>` — extract function signature types. `Readonly<T>` — immutable shape for signal store state. Combining: `Partial<Pick<User, "name" | "email">>` for a profile edit form model.',
    followUp: 'How do you write a DeepPartial<T> that makes nested objects partial recursively?',
  },
  {
    id: 219, level: 'junior', category: 'typescript',
    q: 'What does the readonly keyword do in TypeScript and how does it reinforce Angular signal patterns?',
    a: '`readonly` prevents reassignment of a property after initialisation. Class property: `readonly id: string` — set in the constructor, never after. Array: `readonly Item[]` (or `ReadonlyArray<Item>`) — no push/pop/splice. With mapped types: `Readonly<User>` — every property becomes readonly. In Angular signals: `readonly items = this._items.asReadonly()` combines two guarantees — the TypeScript `readonly` property modifier prevents reassigning `this.items` to a different signal, AND `asReadonly()` returns a `Signal<T>` (not `WritableSignal<T>`) so callers cannot call `.set()`. `input()` and `computed()` return `Signal<T>` (read-only by the type system). `WritableSignal<T>` is the private type held by the service. Together, `readonly` on the field + `Signal<T>` return type form a complete encapsulation that the TypeScript compiler enforces, not just a convention.',
    followUp: 'What is the difference between readonly on a class property and const on a variable — can you reassign either?',
  },

  // ─── ROUTING 220-222 ─────────────────────────────────────────────────────────
  {
    id: 220, level: 'mid', category: 'routing',
    q: 'What are NavigationExtras in Angular routing and when do you use each option?',
    a: '`NavigationExtras` is the options object passed to `router.navigate([...], extras)`. Key options: `queryParams: { sort: "asc" }` — append query params. `queryParamsHandling: "merge"` — merge with current query params instead of replacing them. `fragment: "section2"` — add a URL hash. `relativeTo: inject(ActivatedRoute)` — navigate relative to the current route rather than the root. `replaceUrl: true` — replace the current browser history entry (no back button for this navigation — use on login redirect so users cannot back-navigate to the login page). `state: { data }` — pass arbitrary data not encoded in the URL (readable in the destination via `router.getCurrentNavigation()?.extras.state`). `skipLocationChange: true` — navigate without changing the URL (rare; useful for multi-step wizards that should appear as a single history entry).',
    followUp: 'How do you read the state object from NavigationExtras in the destination component after navigation completes?',
  },
  {
    id: 221, level: 'junior', category: 'routing',
    q: 'What is a wildcard route and how do you implement a 404 Not Found page in Angular?',
    a: 'A wildcard route (`path: "**"`) matches any URL not matched by earlier routes. Add it LAST in the routes array — if placed before specific routes, it matches everything and prevents them from activating: `{ path: "**", component: NotFoundComponent }`. The `NotFoundComponent` shows a friendly "page not found" message with a link home. For redirect-style: `{ path: "**", redirectTo: "/home" }` — silently sends unknown URLs home (poor UX, hides the 404). For SSR: the Angular client-side router alone cannot set an HTTP 404 status. Configure the Node.js SSR server (or Angular\'s `renderApplication`) to check if the matched route is the wildcard and respond with HTTP 404. This is important for SEO — search engines treat 200 pages as indexable, so a soft 404 (200 response + "not found" message) will index the error page.',
    followUp: 'How do you set the HTTP 404 status code for the wildcard route when Angular SSR is active?',
  },
  {
    id: 222, level: 'senior', category: 'routing',
    q: 'How does route data inheritance work in Angular and what does paramsInheritanceStrategy control?',
    a: 'By default (`paramsInheritanceStrategy: "emptyOnly"`), child routes only inherit data, params, and resolved values from parent routes when the child has an empty path (`path: ""`). A child with a non-empty path sees only its own snapshot. With `withRouterConfig({ paramsInheritanceStrategy: "always" })` in `provideRouter()`, ALL child routes inherit params, data, and resolved values from every ancestor route — cumulative merge with child values winning on key collision. `"always"` is useful for: breadcrumbs in deeply nested routes that need the parent\'s resolved entity name, feature components that need the grandparent\'s tenant ID, or any nested component that would otherwise have to walk `route.parent.parent.snapshot.data`. Trade-off: increases memory used by snapshots and can cause subtle overwrite bugs on key name collisions.',
    followUp: 'How do you access a grandparent route\'s resolved data from a grandchild component without enabling "always" inheritance?',
  },

  // ─── FORMS 223 ──────────────────────────────────────────────────────────────
  {
    id: 223, level: 'senior', category: 'forms',
    q: 'What is FormRecord in Angular 14+ and when do you use it instead of FormGroup?',
    a: '`FormRecord<T>` is a typed `FormGroup` where the keys are NOT known at compile time but all values share the same control type. Example: `const perms = new FormRecord<FormControl<boolean>>({})`. Add controls at runtime: `roles.forEach(role => perms.addControl(role.id, new FormControl(false)))`. `perms.value` is `Record<string, boolean | null>`. Contrast with `FormGroup<{ name: FormControl<string>, age: FormControl<number> }>` — keys are fixed at design time, values can differ per key. Use `FormRecord` for: a permissions matrix where role names come from an API response, a dynamic feature-flag toggle panel, or any form where the field set is determined at runtime but all fields have the same type. TypeScript enforces consistency: adding a `FormControl<number>` to a `FormRecord<FormControl<boolean>>` is a compile error.',
    followUp: 'Can you nest FormRecord inside a FormGroup to model a complex dynamic form hierarchy?',
  },

  // ──────────────── BATCH 224-253 ────────────────────────────────────────────

  // COMPONENTS
  {
    id: 224, level: 'mid', category: 'components',
    q: 'What is the Directive Composition API (hostDirectives) and what design problem does it solve?',
    a: '`hostDirectives` attaches one or more directives to a component\'s host element declaratively in metadata, without the component class extending or importing them: `hostDirectives: [CdkDrag, { directive: TooltipDirective, inputs: ["text: tooltip"] }]`. This is composition over inheritance — a component gains drag, tooltip, and focus-trap behaviours without class hierarchies. The component consumer simply uses the component and gets all composed behaviours automatically. Inputs/outputs can be selectively forwarded so the parent can bind them. Contrast with class inheritance, where you can only inherit from one base and the chain grows fragile. Use hostDirectives for cross-cutting behavioural concerns (accessibility, drag-and-drop, resize) that many components share.',
    followUp: 'How do you forward an input from a hostDirective to the host component\'s public API?',
  },
  {
    id: 225, level: 'mid', category: 'components',
    q: 'What is the difference between ng-content (content projection) and ng-template with TemplateRef?',
    a: 'ng-content projects static DOM from the parent into a slot in the child — the DOM is provided by the parent and rendered in the child\'s template. `ng-template` + `TemplateRef` provides reusable template fragments that can be rendered anywhere by `NgTemplateOutlet` or `ViewContainerRef.createEmbeddedView()`. The key difference: ng-content projection happens at compile time and the parent owns the DOM. TemplateRef is a template factory that can be instantiated multiple times with different contexts. Use ng-content for component slot composition (card body, modal footer). Use TemplateRef when the consumer needs to provide a reusable, context-aware template fragment (like a row template for a data table).',
    followUp: 'How would you create a generic data table component where the consumer provides the row template?',
  },
  {
    id: 226, level: 'junior', category: 'components',
    q: 'What does the `providers` array inside @Component do?',
    a: 'The `providers` array in @Component creates a scoped DI injector for that component and its descendants. A service listed there gets a fresh instance for each component instance — not the global singleton. This is useful for services that manage per-component state (like a form state service for a specific wizard) or for providing a mock/stub in that component tree during testing. Contrast with `providers: [MyService]` in `@NgModule` or `providedIn: "root"` which creates a global singleton. Scoped providers let two instances of the same component each have their own service state, fully isolated.',
    followUp: 'What is the difference between a service provided in root vs one provided in a component\'s providers array?',
  },
  {
    id: 227, level: 'senior', category: 'signals',
    q: 'Explain the signal "glitch-free" guarantee and how it differs from Effect-based reactivity.',
    a: 'A "glitch" in reactive systems is when a consumer temporarily sees a partially updated state — for example, a computed sees its dependency A updated but not B yet, producing an invalid intermediate result. Angular\'s `computed()` avoids this: Angular\'s reactive graph processes computed nodes lazily and in topological order, so by the time any component reads a computed value, all of its transitive dependencies are fully up to date. No consumer ever sees an inconsistent intermediate state. In contrast, `effect()` is scheduled asynchronously (after render), so if you chain two effects to synchronise signals, there IS a window where the second signal has not updated yet. This is why the Angular team discourages using effects to derive state — use computed() for guaranteed, glitch-free consistency.',
    followUp: 'Why does the Angular docs say "effects are rarely the best tool" for deriving state?',
  },
  {
    id: 228, level: 'mid', category: 'rxjs',
    q: 'What is the difference between hot and cold Observables?',
    a: 'A cold Observable creates a new data producer for each subscriber — subscribing twice runs the source twice. `of(1,2,3)`, `http.get("/api")`, and `new Observable(subscriber => {...})` are cold. A hot Observable shares a single data producer among all subscribers — the source runs once and subscribers receive whatever emissions happen after they subscribe. `fromEvent(button, "click")`, `Subject`, and a `webSocket()` connection are hot. Late subscribers to a hot Observable miss past emissions (unless combined with `shareReplay` or `BehaviorSubject`). Understanding this distinction is critical for debugging shared vs. isolated data flows in Angular apps.',
    followUp: 'How do you convert a cold Observable into a hot one?',
  },
  {
    id: 229, level: 'junior', category: 'forms',
    q: 'What is the difference between Validators.required and a null check in the component?',
    a: 'Both check for empty values, but `Validators.required` integrates with Angular\'s Forms API: it sets `control.errors = { required: true }`, marks the control as INVALID, prevents `form.valid` from being true, and participates in `form.statusChanges`. A null check in the component (TypeScript if statement) has none of this integration — the form doesn\'t know about it. Always use built-in or custom validators for form validation so you get the full Forms integration: error display in templates, form-level validity, touched/pristine tracking, and testability through `control.errors`.',
    followUp: 'How would you write a custom validator that checks if a value matches a specific pattern?',
  },
  {
    id: 230, level: 'junior', category: 'routing',
    q: 'What is the difference between path: "" and path: "**" in Angular routing?',
    a: '`path: ""` matches the root URL exactly (or the default empty route) — this is your home/landing page. `path: "**"` is a wildcard that matches ANY URL not matched by preceding routes — this is your 404/not-found page. The ORDER matters critically: Angular tries routes top to bottom and stops at the first match. Always place `path: "**"` LAST in your route array. A common setup: a redirectTo route (`path: "", redirectTo: "/home", pathMatch: "full"`), specific feature routes, and `path: "**"` as the final fallback.',
    followUp: 'What does pathMatch: "full" do on an empty-path redirect route?',
  },
  {
    id: 231, level: 'senior', category: 'performance',
    q: 'What is Angular\'s Ivy compiler and what performance improvements did it bring over View Engine?',
    a: 'Ivy (the Angular compiler since v9) compiles components into incremental DOM instructions — each component describes how to create and update ONLY its own part of the DOM, rather than patching a virtual DOM diff. Key improvements: (1) Tree-shaking — unused Angular code is eliminated at build time because each component explicitly declares its dependencies (standalone components make this perfect). (2) Smaller bundles — "Hello World" shrunk from ~130KB to ~50KB. (3) Faster compilation — incremental builds only recompile changed files. (4) Better debugging — stack traces map to template source. (5) Locality principle — components are independently compilable units. Ivy is now the only compiler; View Engine has been removed.',
    followUp: 'How does standalone components architecture improve upon the pre-Ivy NgModule model for bundle size?',
  },
  {
    id: 232, level: 'mid', category: 'testing',
    q: 'What is the difference between unit, integration, and end-to-end tests in Angular?',
    a: 'Unit tests test the smallest isolatable pieces — a single component in isolation with dependencies mocked (TestBed with useValue mocks), a pure pipe tested with `new MyPipe().transform(...)`, or a service method tested with a mock HttpClient. They are fast and pinpoint failures precisely. Integration tests test multiple real pieces working together — a component with its real service and real child components, HTTP requests flushed with HttpTestingController. They catch interaction bugs. E2E tests (Playwright/Cypress) boot the full app in a real browser and test user flows. They are slow and flaky but verify the complete system. The testing pyramid: many unit tests, fewer integration, few E2E.',
    followUp: 'How would you decide when to write an integration test vs a unit test for an Angular service?',
  },
  {
    id: 233, level: 'mid', category: 'architecture',
    q: 'What is the "smart component / dumb component" (container / presentational) pattern?',
    a: 'Smart (container) components own data fetching, state management, and business logic. They inject services, subscribe to Observables/signals, and pass data down to child components via inputs. Dumb (presentational) components receive data purely via inputs, emit events via outputs, and contain no service injections or business logic. They are pure display units. Benefits: presentational components are reusable (they work with any data source), testable (no service mocking needed — just set inputs), and cacheable with OnPush. Smart components change independently without affecting display components. In a signals-based app, the smart component injects a signal store service; inputs to presentational components are derived from those signals.',
    followUp: 'How do signals change the tradeoffs of this pattern compared to RxJS-based state management?',
  },

  // SIGNALS
  {
    id: 234, level: 'senior', category: 'signals',
    q: 'How does Angular know which template needs to update when a signal changes?',
    a: 'Angular\'s signal system tracks reads at a fine-grained level using a "reactive context." When Angular renders a component\'s template, it activates a tracking scope. Every call to `signal()` (reading a signal) inside that scope registers the component as a "consumer" of that signal. When the signal\'s value changes, Angular marks every consumer as dirty — the specific components (or computed nodes) that read that signal. Angular then re-renders ONLY those dirty components, not the entire tree. This is fundamentally more efficient than Zone.js-based change detection, which checked the full tree on any async event. With `ChangeDetectionStrategy.OnPush` + signals, Angular approaches fine-grained reactive updating similar to Solid.js.',
    followUp: 'What happens if a signal is read conditionally in a template — does Angular track it even in the false branch?',
  },
  {
    id: 235, level: 'mid', category: 'signals',
    q: 'What is the difference between `model()` and `input()` in Angular?',
    a: '`input()` creates a one-way data flow — the parent sets the value and the child reads it as a signal. It is read-only inside the component: you cannot call `.set()` on it. `model()` creates a two-way bindable signal — the parent can bind with `[(propertyName)]`, and the child can call `.set()` to send the new value back to the parent. `model()` automatically creates a paired output named `propertyNameChange`. This is the signal-based replacement for the `@Input() / @Output() myPropChange = new EventEmitter()` banana-in-a-box pattern. Use `model()` for form-control-like components where the child manages a value (a custom date picker, a toggle).',
    followUp: 'Can you use model() with two-way binding syntax even if the parent does not need two-way binding?',
  },
  {
    id: 236, level: 'junior', category: 'signals',
    q: 'What happens when you read a signal outside of a reactive context?',
    a: 'Reading a signal outside a reactive context (like inside a regular class method, a setTimeout callback, or a non-reactive function) still returns the current value — signals always return their value when called. The difference is that Angular DOES NOT track the dependency, so changes to that signal will NOT automatically trigger re-computation or re-renders. For example, `console.log(this.count())` in a setTimeout logs the current value but the log does not re-run when count changes. This is intentional and safe — use it when you need the current value without establishing a reactive dependency.',
    followUp: 'What function can you use to explicitly opt out of tracking inside a reactive context?',
  },

  // RXJS
  {
    id: 237, level: 'senior', category: 'rxjs',
    q: 'What is `multicasting` in RxJS and how do share(), shareReplay(), and connectable() differ?',
    a: 'Multicasting converts a cold Observable into a hot one that shares a single execution across multiple subscribers. `share()` is equivalent to `pipe(multicast(new Subject()), refCount())` — it multicasts and starts the upstream source when the first subscriber arrives, tears it down when the last unsubscribes. `shareReplay({ bufferSize: 1, refCount: true })` additionally replays the last emission to late subscribers. With `refCount: false`, the upstream never tears down even when all subscribers leave — useful for HTTP requests you want cached regardless of subscriber count. `connectable(obs$, subjectFactory)` gives the most control: the source only starts when you manually call `.connect()`. Use `share` for event streams, `shareReplay(1)` for cacheable HTTP, `connectable` for controlled hot sources.',
    followUp: 'What is the "diamond problem" in RxJS and how does shareReplay help?',
  },
  {
    id: 238, level: 'mid', category: 'rxjs',
    q: 'What are marble diagrams and how are they used in RxJS testing?',
    a: 'Marble diagrams are ASCII representations of Observable timelines. Syntax: `-` is a frame, values are letters, `|` is completion, `#` is error, `(abc)` is synchronous group. Example: `--a--b--c--|` — values a, b, c emitted at frames 2, 5, 8, completing at 11. In tests using `TestScheduler`: `const result = hot("--a--b").pipe(debounceTime(30, scheduler))`. `scheduler.expectObservable(result).toBe("-----b")`. This lets you test time-dependent operators (debounceTime, delay, throttle) deterministically without real timers. The `TestScheduler` provides virtual time — no real waiting. Marble testing is the gold standard for validating complex RxJS pipelines.',
    followUp: 'How would you write a marble test for a search observable that uses debounceTime(300)?',
  },
  {
    id: 239, level: 'junior', category: 'rxjs',
    q: 'What does the takeUntilDestroyed() operator do and why is it the modern preferred cleanup approach?',
    a: '`takeUntilDestroyed()` from `@angular/core/rxjs-interop` completes the Observable stream automatically when the current injection context (component, directive, service) is destroyed. Without it, subscriptions linger after component destruction, consuming memory and potentially triggering actions on a destroyed view. The modern approach: `this.http.get("/api/data").pipe(takeUntilDestroyed()).subscribe(...)` — no ngOnDestroy needed, no manual `unsubscribe()` reference stored. If called outside an injection context (like inside a method), pass `inject(DestroyRef)` explicitly: `takeUntilDestroyed(this.destroyRef)`. It replaces the older `takeUntil(this.destroy$)` + Subject pattern.',
    followUp: 'What is the alternative takeUntil pattern and why did Angular introduce takeUntilDestroyed instead?',
  },

  // FORMS
  {
    id: 240, level: 'senior', category: 'forms',
    q: 'How do you implement a ControlValueAccessor for a custom form component?',
    a: 'Implement the `ControlValueAccessor` interface on your component and provide it as `NG_VALUE_ACCESSOR` with `multi: true`. The four methods: `writeValue(val)` — Angular calls this to push a new model value into your UI; update your internal state. `registerOnChange(fn)` — Angular passes a callback to call when your UI value changes; store it and call it whenever the user interacts. `registerOnTouched(fn)` — Angular passes a callback to mark the control as touched; call it on blur. `setDisabledState(isDisabled)` — optional, Angular calls this to enable/disable your control. With this interface, your component works seamlessly with `formControlName`, `formControl`, and `[(ngModel)]` without any special handling by the parent.',
    followUp: 'What is the difference between ControlValueAccessor and a custom form field that uses existing controls internally?',
  },
  {
    id: 241, level: 'mid', category: 'forms',
    q: 'What is the difference between sync and async validators in Angular?',
    a: 'Synchronous validators run immediately and return `ValidationErrors | null` synchronously — no async operations. They are passed as the second constructor argument: `new FormControl("", [Validators.required, myCustomValidator])`. Async validators run asynchronous operations (HTTP calls, debounced checks) and return `Observable<ValidationErrors | null>` or `Promise<ValidationErrors | null>`. They are passed as the third argument: `new FormControl("", [], [usernameAvailableValidator])`. The control enters `status: "PENDING"` while async validators are running — you can subscribe to `statusChanges` to show a spinner. Angular runs async validators only AFTER all sync validators pass, preventing unnecessary HTTP calls on obviously invalid input.',
    followUp: 'How would you debounce an async validator to prevent a request on every keystroke?',
  },
  {
    id: 242, level: 'junior', category: 'forms',
    q: 'How do you reset a reactive form to its initial values?',
    a: '`form.reset()` resets all controls to null (or their `defaultValue` if using `nonNullable: true`), clears validation errors, and resets dirty/touched/pristine states. `form.reset({ email: "", name: "" })` resets to specific values. With `FormBuilder.nonNullable.group({ name: "Alice" })`, calling `form.reset()` resets back to `"Alice"`, not null. To reset only some fields, use `form.patchValue({ email: "" })`. Calling `form.markAsPristine()` and `form.markAsUntouched()` manually resets state flags without changing values — useful for "save successful" UI feedback after an API call.',
    followUp: 'What is the practical difference between reset() and patchValue(defaultValues)?',
  },

  // ROUTING
  {
    id: 243, level: 'senior', category: 'routing',
    q: 'How does Angular\'s router handle route reuse, and when does it create vs destroy a component?',
    a: 'By default, Angular destroys and recreates a component when navigating away and back — ngOnDestroy fires on leave, ngOnInit fires on re-enter. The router has a `RouteReuseStrategy` that decides whether to detach a component from the DOM and reattach it later. The built-in `DefaultRouteReuseStrategy` never reuses routes. A custom strategy can preserve components in memory (detach on leave, reattach on return) — useful for expensive-to-build pages like dashboards with heavy charts. Angular also has `withRouterConfig({ onSameUrlNavigation: "reload" })` to trigger re-navigation to the same URL. With signal inputs and `withComponentInputBinding()`, components receive updated params reactively without destruction.',
    followUp: 'What are the risks of reusing components across navigations with RouteReuseStrategy?',
  },
  {
    id: 244, level: 'mid', category: 'routing',
    q: 'What is `withComponentInputBinding()` in Angular routing?',
    a: '`withComponentInputBinding()` is a router provider function (Angular 16+) that automatically binds route parameters, query parameters, and resolved data to `@Input()` and `input()` signal inputs of the routed component by matching parameter names to input names. Before this feature, you had to inject `ActivatedRoute` and read from `paramMap` or `snapshot`. With `withComponentInputBinding()`, a route `/product/:id` automatically sets the component\'s `readonly id = input<string>()` to the route parameter value, and updates it reactively when the parameter changes. Add it in `app.config.ts`: `provideRouter(routes, withComponentInputBinding())`.',
    followUp: 'How do you read resolved data from a route resolver with withComponentInputBinding()?',
  },
  {
    id: 245, level: 'junior', category: 'routing',
    q: 'What is the difference between canActivate and canMatch guards?',
    a: '`CanActivateFn` runs AFTER route matching — the route is already selected, but the guard can block activation (e.g., redirect to login if not authenticated). The URL in the address bar updates even if the guard returns false (it then navigates elsewhere). `CanMatchFn` runs DURING route matching — if it returns false, that route definition is skipped entirely and the router tries the next matching path. This makes canMatch useful for serving different components at the same URL based on user role: an admin and a regular user both navigate to `/dashboard` but match different route definitions with different components. canMatch false means the route was never considered.',
    followUp: 'Can you have both canMatch and canActivate on the same route, and what order do they run in?',
  },

  // TESTING
  {
    id: 246, level: 'mid', category: 'testing',
    q: 'How do you test an Angular component that uses router navigation?',
    a: 'Two approaches: (1) Unit test — spy on the Router service: `const routerSpy = TestBed.inject(Router); spyOn(routerSpy, "navigate")` then after triggering the action: `expect(routerSpy.navigate).toHaveBeenCalledWith(["/dashboard"])`. No real navigation occurs. (2) Integration test with `RouterTestingHarness` (Angular 15+): `const harness = await RouterTestingHarness.create(); const component = await harness.navigateByUrl("/products/1", ProductDetailComponent)`. The harness renders the actual routed component with real router infrastructure. Use approach 1 for simple navigation assertions; use `RouterTestingHarness` when you need the full routing lifecycle (guards, resolvers, param binding).',
    followUp: 'How would you test a component that reads route parameters with ActivatedRoute?',
  },
  {
    id: 247, level: 'senior', category: 'testing',
    q: 'What is test isolation and why does it matter in Angular component tests?',
    a: 'Test isolation means each test starts with a clean, independent state — no shared mutable state between tests. In Angular, failures in isolation manifest as: (1) Test order dependency — a test passes alone but fails when run after another. (2) Shared module state — a service singleton mutates state in test A that bleeds into test B. (3) Unflushed async — an HTTP request from test A responds in test B. Best practices: reset state in `afterEach`, use `TestBed.resetTestingModule()` if needed, always call `httpMock.verify()`, avoid shared service instances across tests (use `useValue` with fresh mocks per test), and run tests in random order in CI to surface order dependencies early.',
    followUp: 'How would you structure a test suite to ensure complete isolation when testing a service that uses localStorage?',
  },
  {
    id: 248, level: 'junior', category: 'testing',
    q: 'What is a ComponentFixture and how is it used in Angular testing?',
    a: '`ComponentFixture<T>` is the testing wrapper for a component instance. Created with `TestBed.createComponent(MyComponent)`. Key properties and methods: `fixture.componentInstance` — the actual component class instance (set inputs, call methods). `fixture.nativeElement` — the root DOM element (query the rendered HTML). `fixture.debugElement` — Angular\'s wrapper with query helpers. `fixture.detectChanges()` — runs change detection (required before the first DOM assertion and after any state change). `fixture.whenStable()` — returns a Promise that resolves when all async tasks complete. Without `fixture.detectChanges()`, the template does not render and DOM assertions will fail.',
    followUp: 'Why do you need to call fixture.detectChanges() multiple times in some tests?',
  },

  // PERFORMANCE
  {
    id: 249, level: 'mid', category: 'performance',
    q: 'What is Server-Side Rendering (SSR) in Angular and what are its main benefits?',
    a: 'SSR with `@angular/ssr` renders the app on the Node.js server and sends fully-formed HTML to the browser. Benefits: (1) Better First Contentful Paint (FCP) — the user sees content immediately without waiting for JS to download and boot. (2) SEO — search engines index the pre-rendered HTML. (3) Core Web Vitals — reduced LCP and TTI. After the initial HTML loads, Angular "hydrates" — it bootstraps in the browser and takes over interactivity from the pre-rendered HTML. Without SSR, the browser receives an empty `<app-root></app-root>` and must wait for all JS to download and execute before rendering anything.',
    followUp: 'What is client-side hydration and what can go wrong if the SSR HTML does not match the client render?',
  },
  {
    id: 250, level: 'senior', category: 'performance',
    q: 'What is Angular\'s incremental hydration and how does it improve SSR performance?',
    a: 'Incremental (partial) hydration (Angular 19+) lets different parts of the page hydrate at different times based on triggers — just like `@defer` blocks for loading, but applied to the hydration phase. Server-rendered HTML is delivered fully, but Angular does not immediately hydrate (attach event listeners, restore component state) for every component. Sections inside `@defer` blocks can hydrate lazily — on viewport entry, on interaction, or on idle. This dramatically reduces the JS needed at startup because non-critical components\' code is not even downloaded until their hydration trigger fires. Only components that trigger events need to be hydrated before the user interacts with them.',
    followUp: 'How does incremental hydration relate to the @defer directive and what triggers does it support?',
  },

  // TYPESCRIPT
  {
    id: 251, level: 'mid', category: 'typescript',
    q: 'What is TypeScript\'s `satisfies` operator and how does it differ from a type annotation?',
    a: 'A type annotation (`const config: Config = { ... }`) widens the type to `Config` — you lose the literal type information. `satisfies` (`const config = { ... } satisfies Config`) validates that the value matches `Config` AT THE TYPE-LEVEL, but TypeScript infers the NARROWEST type for the variable. Example: `const palette = { red: [255, 0, 0], blue: "blue" } satisfies Record<string, string | number[]>` — `palette.red` is typed as `number[]` (not `string | number[]`) and `palette.blue` is `string`. This gives you both type safety (satisfies ensures the shape is correct) and precision (you keep literal types and narrowed types). TypeScript 4.9+.',
    followUp: 'When would you use satisfies over a const assertion (as const)?',
  },
  {
    id: 252, level: 'senior', category: 'typescript',
    q: 'What are mapped types and how are they used in Angular?',
    a: 'Mapped types iterate over the keys of an existing type and transform each property. Syntax: `type Mapped<T> = { [K in keyof T]: Transform<T[K]> }`. Built-in examples: `Partial<T>` → `{ [K in keyof T]?: T[K] }`, `Readonly<T>` → `{ readonly [K in keyof T]: T[K] }`, `Record<K, V>` → `{ [P in K]: V }`. In Angular: typed reactive forms use mapped types to derive `FormGroup<{ [K in keyof T]: FormControl<T[K]> }>` from a model type. Signal stores use them to create `{ [K in keyof State]: Signal<State[K]> }` — each field becomes its own signal. Mapped types are how Angular\'s type system evolves: one model type drives derived types throughout the codebase.',
    followUp: 'How would you write a mapped type that makes all properties of T into readonly signals?',
  },
  {
    id: 253, level: 'junior', category: 'typescript',
    q: 'What is the difference between interface and type alias in TypeScript?',
    a: 'Both describe shapes, but with key differences. Interfaces: can be merged (declaration merging — two `interface User` blocks combine), can be extended with `extends`, are slightly faster in the TS compiler for object types. Type aliases: can represent any type (primitives, unions, intersections, tuples, mapped types), cannot be merged, use `&` for composition. In Angular, use interfaces for component inputs/outputs (they document the "contract"), use type aliases for complex types (union states, utility type transformations). `interface A { a: string }` and `type B = A & { b: number }` are common together. The teams-level rule: prefer interfaces for object shapes (they are more extensible), type for everything else.',
    followUp: 'What is TypeScript declaration merging and when would you use it in an Angular library?',
  },
];

@Component({
  selector: 'app-interview',
  imports: [RouterLink],
  styles: [`
    /* ─── layout ────────────────────────────────────────── */
    :host { display: block; max-width: 900px; margin: 0 auto; }
    .hero { text-align: center; padding: 40px 24px 24px; }
    .hero h1 { font-size: clamp(1.8rem,4vw,2.8rem); margin: 12px 0; }
    .hero p { max-width: 600px; margin: 0 auto 20px; color: var(--text-muted); }
    .stats-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
    .stat-box { text-align: center; padding: 10px 18px; border: 1px solid var(--border);
      border-radius: 12px; background: var(--surface); }
    .stat-box strong { display: block; font-size: 1.5rem; }
    .stat-box span { font-size: .8rem; color: var(--text-muted); }

    /* ─── mode toggle ─────────────────────────────────── */
    .mode-toggle { display: flex; justify-content: center; gap: 8px; margin: 0 0 20px; }
    .mode-btn { padding: 9px 22px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .9rem; color: var(--text);
      font-weight: 500; transition: all .15s; }
    .mode-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .mode-btn:hover:not(.active) { border-color: #6366f1; color: #6366f1; }

    /* ─── filters ─────────────────────────────────────── */
    .filters { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 24px 10px; }
    .filter-btn { padding: 5px 13px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .83rem; color: var(--text); }
    .filter-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

    /* ─── browse: qa accordion ───────────────────────── */
    .qa-list { padding: 0 24px 60px; display: flex; flex-direction: column; gap: 10px; }
    .qa-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden;
      background: var(--surface); transition: border-color .15s; }
    .qa-card.rated-easy   { border-color: #22c55e; }
    .qa-card.rated-review { border-color: #f59e0b; }
    .qa-header { display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px;
      cursor: pointer; user-select: none; }
    .qa-header:hover { background: rgba(99,102,241,.04); }
    .qa-q { font-weight: 500; font-size: .94rem; flex: 1; line-height: 1.4; }
    .qa-badges { display: flex; gap: 5px; flex-shrink: 0; align-items: center; }
    .badge-level { font-size: .7rem; padding: 3px 8px; border-radius: 20px; font-weight: 700; }
    .badge-level.junior { background: #dcfce7; color: #166534; }
    .badge-level.mid    { background: #fef9c3; color: #854d0e; }
    .badge-level.senior { background: #fee2e2; color: #991b1b; }
    .badge-cat  { font-size: .7rem; padding: 3px 8px; border-radius: 20px;
      background: rgba(99,102,241,.1); color: #6366f1; border: 1px solid rgba(99,102,241,.2); }
    .badge-easy   { font-size: .7rem; padding: 3px 8px; border-radius: 20px;
      background: #dcfce7; color: #166534; font-weight: 700; }
    .badge-review { font-size: .7rem; padding: 3px 8px; border-radius: 20px;
      background: #fef9c3; color: #854d0e; font-weight: 700; }
    .qa-chevron { flex-shrink: 0; transition: transform .2s; color: var(--text-muted); font-size: .8rem; }
    .qa-chevron.open { transform: rotate(180deg); }
    .qa-body { padding: 0 18px 16px; border-top: 1px solid var(--border); }
    .qa-answer { margin: 12px 0 8px; font-size: .91rem; line-height: 1.65; }
    .qa-followup { margin: 8px 0 12px; padding: 10px 14px; border-radius: 10px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); font-size: .84rem; }
    .qa-followup strong { display: block; margin-bottom: 3px; font-size: .75rem;
      color: #6366f1; text-transform: uppercase; letter-spacing: .5px; }
    .browse-rate { display: flex; gap: 8px; margin-top: 10px; }
    .rate-easy   { padding: 6px 14px; border-radius: 8px; border: 1px solid #22c55e;
      background: rgba(34,197,94,.08); color: #166534; cursor: pointer; font-size: .83rem; font-weight: 600; }
    .rate-easy:hover   { background: rgba(34,197,94,.18); }
    .rate-review { padding: 6px 14px; border-radius: 8px; border: 1px solid #f59e0b;
      background: rgba(245,158,11,.08); color: #854d0e; cursor: pointer; font-size: .83rem; font-weight: 600; }
    .rate-review:hover { background: rgba(245,158,11,.18); }

    /* ─── flashcard ──────────────────────────────────── */
    .fc-wrap { padding: 0 24px 60px; }
    .fc-topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .fc-prog-bar-outer { flex: 1; height: 6px; background: var(--border); border-radius: 3px; min-width: 80px; }
    .fc-prog-bar-inner { height: 100%; border-radius: 3px; transition: width .3s;
      background: linear-gradient(90deg, #22c55e, #6366f1); }
    .fc-counts { font-size: .82rem; color: var(--text-muted); white-space: nowrap; }
    .fc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
      min-height: 280px; display: flex; flex-direction: column; justify-content: center;
      padding: 36px 32px; margin-bottom: 20px; box-shadow: 0 4px 24px rgba(0,0,0,.06);
      transition: opacity .18s, transform .18s; }
    .fc-card.fading { opacity: 0; transform: scale(.97) translateY(6px); }
    .fc-eyebrow { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted); margin-bottom: 14px; display: flex; gap: 8px; }
    .fc-question { font-size: 1.18rem; font-weight: 600; line-height: 1.5; margin: 0 0 20px; }
    .fc-reveal-hint { font-size: .85rem; color: var(--text-muted); }
    .fc-answer { font-size: .94rem; line-height: 1.65; color: var(--text); }
    .fc-followup { margin-top: 14px; padding: 12px 16px; border-radius: 10px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2);
      font-size: .85rem; }
    .fc-followup strong { display: block; font-size: .74rem; color: #6366f1;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
    .fc-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .fc-reveal-btn { padding: 11px 28px; background: #6366f1; color: #fff; border: none;
      border-radius: 10px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .fc-reveal-btn:hover { background: #5558e3; }
    .fc-rate-easy   { padding: 11px 24px; border-radius: 10px; border: 2px solid #22c55e;
      background: rgba(34,197,94,.1); color: #166534; cursor: pointer; font-size: .95rem; font-weight: 700; }
    .fc-rate-easy:hover   { background: rgba(34,197,94,.2); }
    .fc-rate-review { padding: 11px 24px; border-radius: 10px; border: 2px solid #f59e0b;
      background: rgba(245,158,11,.1); color: #854d0e; cursor: pointer; font-size: .95rem; font-weight: 700; }
    .fc-rate-review:hover { background: rgba(245,158,11,.2); }
    .fc-skip { padding: 11px 18px; border-radius: 10px; border: 1px solid var(--border);
      background: transparent; cursor: pointer; font-size: .9rem; color: var(--text-muted); }

    /* ─── session done ────────────────────────────────── */
    .session-done { text-align: center; padding: 48px 24px 60px; }
    .done-title { font-size: 1.8rem; font-weight: 700; margin: 0 0 8px; }
    .done-stats { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 20px 0 28px; }
    .done-stat { padding: 14px 22px; border-radius: 14px; text-align: center; }
    .done-stat.easy-stat   { background: rgba(34,197,94,.1); border: 1px solid #22c55e; }
    .done-stat.review-stat { background: rgba(245,158,11,.1); border: 1px solid #f59e0b; }
    .done-stat strong { display: block; font-size: 2rem; font-weight: 800; }
    .done-stat span   { font-size: .83rem; }
    .done-stat.easy-stat strong   { color: #166534; }
    .done-stat.review-stat strong { color: #854d0e; }
    .done-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
    .done-review-list h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-muted); margin-bottom: 12px; text-align: left; }
    .done-review-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
      border-radius: 8px; border: 1px solid #f59e0b; background: rgba(245,158,11,.05);
      font-size: .88rem; margin-bottom: 8px; cursor: pointer; text-align: left; }
    .done-review-item:hover { background: rgba(245,158,11,.12); }

    .empty-state { text-align: center; padding: 60px 24px; color: var(--text-muted); }
    .tip-box { margin: 0 24px 16px; padding: 12px 16px; border-radius: 10px;
      background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2);
      font-size: .87rem; line-height: 1.5; }

    @media (max-width: 600px) {
      .fc-card { padding: 24px 20px; min-height: 220px; }
      .fc-question { font-size: 1rem; }
    }
  `],
  template: `
    <div class="hero">
      <span class="pill">Interview Prep</span>
      <h1>Angular Interview Questions</h1>
      <p>253 real interview questions — Junior, Mid, and Senior — with complete answers.
         Browse the accordion or use Flashcard mode to drill yourself and track what you know.</p>
      <div class="stats-row">
        <div class="stat-box"><strong>{{ countFor('junior') }}</strong><span>Junior</span></div>
        <div class="stat-box"><strong>{{ countFor('mid') }}</strong><span>Mid</span></div>
        <div class="stat-box"><strong>{{ countFor('senior') }}</strong><span>Senior</span></div>
        <div class="stat-box"><strong>{{ easyCount() }}</strong><span>✓ Easy</span></div>
        <div class="stat-box"><strong>{{ reviewCount() }}</strong><span>↺ Review</span></div>
      </div>
    </div>

    <!-- Mode toggle -->
    <div class="mode-toggle">
      <button class="mode-btn" [class.active]="mode() === 'browse'" (click)="switchMode('browse')">
        Browse
      </button>
      <button class="mode-btn" [class.active]="mode() === 'flashcard'" (click)="switchMode('flashcard')">
        ⚡ Flashcard Mode
      </button>
    </div>

    <!-- Shared filters -->
    <div class="filters">
      @for (l of levelFilters; track l.id) {
        <button class="filter-btn" [class.active]="activeLevel() === l.id" (click)="activeLevel.set(l.id)">
          {{ l.label }}
        </button>
      }
    </div>
    <div class="filters" style="padding-top:0">
      @for (c of categoryFilters; track c.id) {
        <button class="filter-btn" [class.active]="activeCategory() === c.id" (click)="activeCategory.set(c.id)">
          {{ c.label }}
        </button>
      }
    </div>

    <!-- ─── BROWSE MODE ───────────────────────────────────────────── -->
    @if (mode() === 'browse') {
      @if (visibleQA().length === 0) {
        <div class="empty-state">No questions match the selected filters.</div>
      } @else {
        <div class="tip-box">
          <strong>How to use:</strong> Read the question, close the accordion, try to answer out loud,
          then open it to check. Rate yourself — it helps you track what sticks.
        </div>
        <div class="qa-list">
          @for (qa of visibleQA(); track qa.id) {
            <div class="qa-card"
              [class.rated-easy]="getRating(qa.id) === 'easy'"
              [class.rated-review]="getRating(qa.id) === 'review'">
              <div class="qa-header" (click)="toggle(qa.id)">
                <div class="qa-q">{{ qa.q }}</div>
                <div class="qa-badges">
                  @if (getRating(qa.id) === 'easy')   { <span class="badge-easy">✓ Easy</span> }
                  @if (getRating(qa.id) === 'review') { <span class="badge-review">↺ Review</span> }
                  <span class="badge-level {{ qa.level }}">{{ qa.level }}</span>
                  <span class="badge-cat">{{ qa.category }}</span>
                </div>
                <span class="qa-chevron" [class.open]="isOpen(qa.id)">▼</span>
              </div>
              @if (isOpen(qa.id)) {
                <div class="qa-body">
                  <div class="qa-answer">{{ qa.a }}</div>
                  @if (qa.followUp) {
                    <div class="qa-followup">
                      <strong>Follow-up question</strong>
                      {{ qa.followUp }}
                    </div>
                  }
                  @if (qa.topicPath) {
                    <a [routerLink]="'/' + qa.topicPath" style="display:inline-block;margin-bottom:10px;font-size:.82rem;color:var(--blue)">Study this topic →</a>
                  }
                  <div class="browse-rate">
                    <button class="rate-easy"   (click)="browseRate(qa.id, 'easy')">✓ Got it</button>
                    <button class="rate-review" (click)="browseRate(qa.id, 'review')">↺ Review</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    }

    <!-- ─── FLASHCARD MODE ───────────────────────────────────────── -->
    @if (mode() === 'flashcard') {
      @if (flashQueue().length === 0) {
        <div class="empty-state">No questions match the selected filters.</div>
      } @else if (sessionDone()) {
        <!-- Session summary -->
        <div class="session-done">
          <div class="done-title">Session complete!</div>
          <p style="color:var(--text-muted);margin:0 0 4px">
            You went through {{ flashQueue().length }} questions.
          </p>
          <div class="done-stats">
            <div class="done-stat easy-stat">
              <strong>{{ easyCount() }}</strong>
              <span>✓ Easy — you know these</span>
            </div>
            <div class="done-stat review-stat">
              <strong>{{ reviewCount() }}</strong>
              <span>↺ Needs more review</span>
            </div>
          </div>
          <div class="done-actions">
            <button class="fc-reveal-btn" (click)="restartSession()">Restart All</button>
            @if (reviewCount() > 0) {
              <button class="fc-rate-review" (click)="drillReview()">
                Drill {{ reviewCount() }} Review Cards
              </button>
            }
          </div>
          @if (reviewQueue().length > 0) {
            <div class="done-review-list">
              <h3>Questions to revisit ({{ reviewQueue().length }})</h3>
              @for (qa of reviewQueue(); track qa.id) {
                <div class="done-review-item" (click)="jumpTo(qa.id)">
                  <span style="flex-shrink:0;color:#f59e0b">↺</span>
                  {{ qa.q }}
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Active flashcard session -->
        <div class="fc-wrap">
          <div class="fc-topbar">
            <span style="font-size:.82rem;color:var(--text-muted)">
              {{ ratedCount() }} / {{ flashQueue().length }} rated
            </span>
            <div class="fc-prog-bar-outer">
              <div class="fc-prog-bar-inner"
                [style.width]="(ratedCount() / flashQueue().length * 100) + '%'"></div>
            </div>
            <span class="fc-counts">✓ {{ easyCount() }} &nbsp; ↺ {{ reviewCount() }}</span>
          </div>

          @if (currentCard(); as card) {
            <div class="fc-card" [class.fading]="fading()">
              <div class="fc-eyebrow">
                <span class="badge-level {{ card.level }}">{{ card.level }}</span>
                <span class="badge-cat">{{ card.category }}</span>
                <span style="margin-left:auto">{{ cardIndex() + 1 }} / {{ flashQueue().length }}</span>
              </div>

              @if (!revealed()) {
                <p class="fc-question">{{ card.q }}</p>
                <p class="fc-reveal-hint">Think about it, then tap to reveal the answer.</p>
              } @else {
                <p class="fc-question" style="font-size:.92rem;font-weight:400;color:var(--text-muted);margin-bottom:8px">
                  {{ card.q }}
                </p>
                <div class="fc-answer">{{ card.a }}</div>
                @if (card.followUp) {
                  <div class="fc-followup">
                    <strong>Follow-up</strong>{{ card.followUp }}
                  </div>
                }
                @if (card.topicPath) {
                  <a [routerLink]="'/' + card.topicPath" style="display:inline-block;margin-top:12px;font-size:.82rem;color:var(--blue)">Study this topic →</a>
                }
              }
            </div>

            <div class="fc-actions">
              @if (!revealed()) {
                <button class="fc-reveal-btn" (click)="reveal()">Reveal Answer</button>
                <button class="fc-skip" (click)="skip()">Skip →</button>
              } @else {
                <button class="fc-rate-easy"   (click)="rate('easy')">✓ Got it — Easy</button>
                <button class="fc-rate-review" (click)="rate('review')">↺ Needs Review</button>
              }
            </div>
          }
        </div>
      }
    }
  `,
})
export class Interview {
  // ── Filter state ───────────────────────────────────────────────────────────
  readonly activeLevel    = signal<Level>('all');
  readonly activeCategory = signal<Category>('all');

  readonly visibleQA = computed(() => {
    const lev = this.activeLevel();
    const cat = this.activeCategory();
    return QA_LIST.filter(
      (q) => (lev === 'all' || q.level === lev) && (cat === 'all' || q.category === cat),
    );
  });

  // ── Browse mode state ──────────────────────────────────────────────────────
  private readonly openIds = signal<Set<number>>(new Set());

  // ── Mode ───────────────────────────────────────────────────────────────────
  readonly mode = signal<Mode>('browse');

  // ── Flashcard state ────────────────────────────────────────────────────────
  readonly flashQueue  = computed(() => this.visibleQA());
  readonly cardIndex   = signal(0);
  readonly revealed    = signal(false);
  readonly fading      = signal(false);
  readonly ratings     = signal<Map<number, Rating>>(new Map());
  private reviewOnly   = false;

  readonly currentCard = computed(() => this.flashQueue()[this.cardIndex()] ?? null);

  readonly sessionDone = computed(() => {
    const total = this.flashQueue().length;
    return total > 0 && this.cardIndex() >= total;
  });

  readonly ratedCount = computed(() => {
    const r = this.ratings();
    return this.flashQueue().filter((q) => r.has(q.id)).length;
  });

  readonly easyCount = computed(() => {
    const r = this.ratings();
    return QA_LIST.filter((q) => r.get(q.id) === 'easy').length;
  });

  readonly reviewCount = computed(() => {
    const r = this.ratings();
    return QA_LIST.filter((q) => r.get(q.id) === 'review').length;
  });

  readonly reviewQueue = computed(() => {
    const r = this.ratings();
    return this.flashQueue().filter((q) => r.get(q.id) === 'review');
  });

  // ── Mode switch ────────────────────────────────────────────────────────────
  switchMode(m: Mode) {
    this.mode.set(m);
    if (m === 'flashcard') this.resetSession();
  }

  // ── Browse methods ─────────────────────────────────────────────────────────
  isOpen(id: number)          { return this.openIds().has(id); }
  getRating(id: number)       { return this.ratings().get(id) ?? null; }

  toggle(id: number) {
    this.openIds.update((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  browseRate(id: number, rating: Rating) {
    this.ratings.update((m) => new Map(m).set(id, rating));
  }

  // ── Flashcard methods ──────────────────────────────────────────────────────
  reveal() { this.revealed.set(true); }

  rate(rating: Rating) {
    const card = this.currentCard();
    if (!card) return;
    this.ratings.update((m) => new Map(m).set(card.id, rating));
    this.advance();
  }

  skip() { this.advance(); }

  private advance() {
    this.fading.set(true);
    setTimeout(() => {
      this.cardIndex.update((i) => i + 1);
      this.revealed.set(false);
      this.fading.set(false);
    }, 160);
  }

  resetSession() {
    this.cardIndex.set(0);
    this.revealed.set(false);
    this.fading.set(false);
    this.reviewOnly = false;
  }

  restartSession() {
    this.ratings.set(new Map());
    this.resetSession();
  }

  drillReview() {
    // flip all review-rated items back to unrated so the regular queue re-shows them
    const r = new Map(this.ratings());
    this.flashQueue().filter((q) => r.get(q.id) === 'review').forEach((q) => r.delete(q.id));
    this.ratings.set(r);
    this.resetSession();
  }

  jumpTo(id: number) {
    const idx = this.flashQueue().findIndex((q) => q.id === id);
    if (idx !== -1) {
      this.cardIndex.set(idx);
      this.revealed.set(false);
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  countFor(level: Exclude<Level, 'all'>): number {
    return QA_LIST.filter((q) => q.level === level).length;
  }

  // ── Filter definitions ─────────────────────────────────────────────────────
  readonly levelFilters: { id: Level; label: string }[] = [
    { id: 'all',    label: 'All levels' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid',    label: 'Mid-level' },
    { id: 'senior', label: 'Senior' },
  ];

  readonly categoryFilters: { id: Category; label: string }[] = [
    { id: 'all',          label: 'All' },
    { id: 'components',   label: 'Components' },
    { id: 'signals',      label: 'Signals' },
    { id: 'rxjs',         label: 'RxJS' },
    { id: 'forms',        label: 'Forms' },
    { id: 'routing',      label: 'Routing' },
    { id: 'testing',      label: 'Testing' },
    { id: 'performance',  label: 'Performance' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'typescript',   label: 'TypeScript' },
  ];
}
