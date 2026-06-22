import { Lesson } from './lesson.model';

/**
 * THE MASTER CURRICULUM.
 *
 * Every Angular (and supporting TypeScript) concept a developer needs for the
 * beginner, intermediate and expert certification tracks is enumerated here.
 * Lessons with a `loadComponent` are fully written; the rest are placeholders
 * that route to the "coming soon" page so the full scope is always visible and
 * the app always builds. Fill them in by adding the component + loader.
 */
export const CURRICULUM: Lesson[] = [
  // ===================================================================
  // FOUNDATIONS (for people brand new to coding)
  // ===================================================================
  {
    id: 'how-the-web-works',
    title: 'How Websites & Apps Work',
    summary: 'Client vs server, HTML/CSS/JS, web pages vs web apps, and what a SPA is.',
    level: 'foundations',
    category: 'Web Basics',
    loadComponent: () =>
      import('../lessons/foundations/how-the-web-works/how-the-web-works').then(
        (m) => m.HowTheWebWorks,
      ),
  },
  {
    id: 'programming-basics',
    title: 'Programming Basics: Values & Variables',
    summary: 'What code is, plus numbers, strings, booleans, variables and assignment.',
    level: 'foundations',
    category: 'Programming from Zero',
    loadComponent: () =>
      import('../lessons/foundations/programming-basics/programming-basics').then(
        (m) => m.ProgrammingBasics,
      ),
  },
  {
    id: 'functions-basics',
    title: 'Functions',
    summary: 'Reusable instructions: parameters, return values and arrow functions.',
    level: 'foundations',
    category: 'Programming from Zero',
    loadComponent: () =>
      import('../lessons/foundations/functions-basics/functions-basics').then(
        (m) => m.FunctionsBasics,
      ),
  },
  {
    id: 'arrays-objects-basics',
    title: 'Arrays & Objects',
    summary: 'Ordered lists and labelled groups — the shape of almost all app data.',
    level: 'foundations',
    category: 'Programming from Zero',
    loadComponent: () =>
      import('../lessons/foundations/arrays-objects-basics/arrays-objects-basics').then(
        (m) => m.ArraysObjectsBasics,
      ),
  },
  {
    id: 'decisions-loops',
    title: 'Decisions & Loops',
    summary: 'if/else branching, loops, and the map & filter array helpers.',
    level: 'foundations',
    category: 'Programming from Zero',
    loadComponent: () =>
      import('../lessons/foundations/decisions-loops/decisions-loops').then(
        (m) => m.DecisionsLoops,
      ),
  },
  {
    id: 'async-basics',
    title: 'Doing Things Later: Async',
    summary: 'Why slow tasks run asynchronously: callbacks, promises and async/await.',
    level: 'foundations',
    category: 'Programming from Zero',
    loadComponent: () =>
      import('../lessons/foundations/async-basics/async-basics').then((m) => m.AsyncBasics),
  },
  {
    id: 'dom-and-events',
    title: 'The DOM & Events',
    summary: 'The page as a tree, event handlers, and the problem Angular solves.',
    level: 'foundations',
    category: 'Web Basics',
    loadComponent: () =>
      import('../lessons/foundations/dom-and-events/dom-and-events').then((m) => m.DomAndEvents),
  },
  {
    id: 'json-and-apis',
    title: 'Data on the Web: JSON & APIs',
    summary: 'JSON as the universal data format, parse/stringify, and what an API is.',
    level: 'foundations',
    category: 'Data & the Web',
    loadComponent: () =>
      import('../lessons/foundations/json-and-apis/json-and-apis').then((m) => m.JsonAndApis),
  },
  {
    id: 'terminal-and-npm',
    title: 'The Terminal & npm',
    summary: 'The command line, core commands, and installing packages with Node & npm.',
    level: 'foundations',
    category: 'Your Dev Toolkit',
    loadComponent: () =>
      import('../lessons/foundations/terminal-and-npm/terminal-and-npm').then(
        (m) => m.TerminalAndNpm,
      ),
  },
  {
    id: 'git-basics',
    title: 'Git & Version Control',
    summary: 'Commits, branches, push/pull and GitHub — a time machine for your code.',
    level: 'foundations',
    category: 'Your Dev Toolkit',
    loadComponent: () =>
      import('../lessons/foundations/git-basics/git-basics').then((m) => m.GitBasics),
  },
  {
    id: 'debugging-basics',
    title: 'Debugging & Reading Errors',
    summary: 'Reading error messages & stack traces, console.log, and the browser DevTools.',
    level: 'foundations',
    category: 'Your Dev Toolkit',
    loadComponent: () =>
      import('../lessons/foundations/debugging-basics/debugging-basics').then(
        (m) => m.DebuggingBasics,
      ),
  },
  {
    id: 'why-typescript-angular',
    title: 'Why TypeScript & Angular?',
    summary: 'How types prevent bugs, what a framework gives you, and how to use this app.',
    level: 'foundations',
    category: 'Web Basics',
    loadComponent: () =>
      import('../lessons/foundations/why-typescript-angular/why-typescript-angular').then(
        (m) => m.WhyTypescriptAngular,
      ),
  },

  // ===================================================================
  // TYPESCRIPT ESSENTIALS
  // ===================================================================
  {
    id: 'ts-types',
    title: 'Types, Annotations & Inference',
    summary: 'Primitives, type annotations, inference, any/unknown/never, literal & union types.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () => import('../lessons/typescript/types/types').then((m) => m.Types),
  },
  {
    id: 'ts-interfaces',
    title: 'Interfaces vs Type Aliases',
    summary: 'Describing object shapes, optional/readonly members, extension and merging.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () =>
      import('../lessons/typescript/interfaces/interfaces').then((m) => m.Interfaces),
  },
  {
    id: 'ts-classes',
    title: 'Classes & Access Modifiers',
    summary: 'Fields, constructors, public/private/protected/readonly, parameter properties.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () => import('../lessons/typescript/classes/classes').then((m) => m.Classes),
  },
  {
    id: 'ts-generics',
    title: 'Generics',
    summary: 'Generic functions, classes and constraints — the backbone of Angular APIs.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () => import('../lessons/typescript/generics/generics').then((m) => m.Generics),
  },
  {
    id: 'ts-enums',
    title: 'Enums & Literal Unions',
    summary: 'Numeric & string enums, const enums, and when a union of literals is better.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () => import('../lessons/typescript/enums/enums').then((m) => m.Enums),
  },
  {
    id: 'ts-narrowing',
    title: 'Type Narrowing & Guards',
    summary: 'typeof, instanceof, in, discriminated unions and user-defined type guards.',
    level: 'typescript',
    category: 'Type System',
    loadComponent: () =>
      import('../lessons/typescript/narrowing/narrowing').then((m) => m.Narrowing),
  },
  {
    id: 'ts-utility-types',
    title: 'Utility Types',
    summary: 'Partial, Required, Readonly, Pick, Omit, Record, Exclude, ReturnType and more.',
    level: 'typescript',
    category: 'Advanced Types',
    loadComponent: () =>
      import('../lessons/typescript/utility-types/utility-types').then((m) => m.UtilityTypes),
  },
  {
    id: 'ts-keyof-typeof',
    title: 'keyof, typeof & Indexed Access',
    summary: 'Deriving types from values and other types; lookup types.',
    level: 'typescript',
    category: 'Advanced Types',
    loadComponent: () =>
      import('../lessons/typescript/keyof-typeof/keyof-typeof').then((m) => m.KeyofTypeof),
  },
  {
    id: 'ts-mapped-conditional',
    title: 'Mapped & Conditional Types',
    summary: 'Transforming types, infer, distributive conditionals and template literal types.',
    level: 'typescript',
    category: 'Advanced Types',
    loadComponent: () =>
      import('../lessons/typescript/mapped-conditional/mapped-conditional').then(
        (m) => m.MappedConditional,
      ),
  },
  {
    id: 'ts-decorators',
    title: 'Decorators',
    summary: 'How TypeScript decorators work and why Angular relies on them.',
    level: 'typescript',
    category: 'Language Features',
    loadComponent: () =>
      import('../lessons/typescript/decorators/decorators').then((m) => m.Decorators),
  },
  {
    id: 'ts-modules',
    title: 'Modules, Imports & Exports',
    summary: 'ES modules, default vs named exports, barrels and path mapping.',
    level: 'typescript',
    category: 'Language Features',
    loadComponent: () => import('../lessons/typescript/modules/modules').then((m) => m.Modules),
  },
  {
    id: 'ts-async',
    title: 'Promises & async/await',
    summary: 'Asynchronous code, error handling and how it relates to Observables.',
    level: 'typescript',
    category: 'Language Features',
    loadComponent: () => import('../lessons/typescript/async/async').then((m) => m.Async),
  },
  {
    id: 'ts-nullish',
    title: 'Optional Chaining & Nullish Coalescing',
    summary: '?., ??, ??= and non-null assertion — safe access patterns.',
    level: 'typescript',
    category: 'Language Features',
    loadComponent: () => import('../lessons/typescript/nullish/nullish').then((m) => m.Nullish),
  },

  // ===================================================================
  // BEGINNER
  // ===================================================================
  {
    id: 'what-is-angular',
    title: 'What is Angular?',
    summary: 'Framework overview, architecture, the CLI and the standalone-first model.',
    level: 'beginner',
    category: 'Getting Started',
    loadComponent: () =>
      import('../lessons/beginner/what-is-angular/what-is-angular').then((m) => m.WhatIsAngular),
  },
  {
    id: 'cli-project-structure',
    title: 'CLI & Project Structure',
    summary: 'ng new / generate / serve / build and what every file in a project does.',
    level: 'beginner',
    category: 'Getting Started',
    loadComponent: () =>
      import('../lessons/beginner/cli-project-structure/cli-project-structure').then(
        (m) => m.CliProjectStructure,
      ),
  },
  {
    id: 'components',
    title: 'Components',
    summary: 'The @Component decorator, selectors, templates, styles and standalone components.',
    level: 'beginner',
    category: 'Components & Templates',
    loadComponent: () => import('../lessons/beginner/components/components').then((m) => m.Components),
  },
  {
    id: 'interpolation',
    title: 'Interpolation & Expressions',
    summary: 'Rendering data with {{ }}, template expressions and their restrictions.',
    level: 'beginner',
    category: 'Components & Templates',
    loadComponent: () =>
      import('../lessons/beginner/interpolation/interpolation').then((m) => m.Interpolation),
  },
  {
    id: 'property-binding',
    title: 'Property & Attribute Binding',
    summary: '[property], [attr.*], and the difference between DOM properties and attributes.',
    level: 'beginner',
    category: 'Data Binding',
    loadComponent: () =>
      import('../lessons/beginner/property-binding/property-binding').then((m) => m.PropertyBinding),
  },
  {
    id: 'event-binding',
    title: 'Event Binding',
    summary: '(event) syntax, $event, key modifiers and template statements.',
    level: 'beginner',
    category: 'Data Binding',
    loadComponent: () =>
      import('../lessons/beginner/event-binding/event-binding').then((m) => m.EventBinding),
  },
  {
    id: 'two-way-binding',
    title: 'Two-Way Binding',
    summary: '[(ngModel)] and the model() signal — banana-in-a-box explained.',
    level: 'beginner',
    category: 'Data Binding',
    loadComponent: () =>
      import('../lessons/beginner/two-way-binding/two-way-binding').then((m) => m.TwoWayBinding),
  },
  {
    id: 'class-style-binding',
    title: 'Class & Style Binding',
    summary: '[class.x], [style.x], [ngClass] and [ngStyle] for dynamic presentation.',
    level: 'beginner',
    category: 'Data Binding',
    loadComponent: () =>
      import('../lessons/beginner/class-style-binding/class-style-binding').then(
        (m) => m.ClassStyleBinding,
      ),
  },
  {
    id: 'control-flow-if',
    title: 'Control Flow: @if / @else',
    summary: 'Conditional rendering with the built-in @if block and the as alias.',
    level: 'beginner',
    category: 'Control Flow',
    loadComponent: () =>
      import('../lessons/beginner/control-flow-if/control-flow-if').then((m) => m.ControlFlowIf),
  },
  {
    id: 'control-flow-for',
    title: 'Control Flow: @for',
    summary: 'List rendering, track, $index/$first/$last/$even and @empty.',
    level: 'beginner',
    category: 'Control Flow',
    loadComponent: () =>
      import('../lessons/beginner/control-flow-for/control-flow-for').then((m) => m.ControlFlowFor),
  },
  {
    id: 'control-flow-switch',
    title: 'Control Flow: @switch',
    summary: 'Multi-branch rendering with @switch / @case / @default.',
    level: 'beginner',
    category: 'Control Flow',
    loadComponent: () =>
      import('../lessons/beginner/control-flow-switch/control-flow-switch').then(
        (m) => m.ControlFlowSwitch,
      ),
  },
  {
    id: 'let-block',
    title: 'Local Template Variables: @let',
    summary: 'Computing and reusing values directly in templates with @let.',
    level: 'beginner',
    category: 'Control Flow',
    loadComponent: () => import('../lessons/beginner/let-block/let-block').then((m) => m.LetBlock),
  },
  {
    id: 'builtin-directives',
    title: 'Built-in Directives & Legacy Control Flow',
    summary: '*ngIf / *ngFor / *ngSwitch, ngClass, ngStyle, ng-container & ng-template.',
    level: 'beginner',
    category: 'Directives',
    loadComponent: () =>
      import('../lessons/beginner/builtin-directives/builtin-directives').then(
        (m) => m.BuiltinDirectives,
      ),
  },
  {
    id: 'pipes',
    title: 'Built-in Pipes',
    summary: 'Transforming display values: date, currency, number, percent, json, slice, async.',
    level: 'beginner',
    category: 'Pipes',
    loadComponent: () => import('../lessons/beginner/pipes/pipes').then((m) => m.Pipes),
  },
  {
    id: 'lifecycle',
    title: 'Lifecycle Hooks',
    summary: 'ngOnInit, ngOnChanges, ngOnDestroy and friends — when and why they fire.',
    level: 'beginner',
    category: 'Components & Templates',
    loadComponent: () => import('../lessons/beginner/lifecycle/lifecycle').then((m) => m.Lifecycle),
  },
  {
    id: 'inputs',
    title: 'Component Inputs',
    summary: 'Passing data in with signal input() and the @Input decorator, required & transforms.',
    level: 'beginner',
    category: 'Component Communication',
    loadComponent: () => import('../lessons/beginner/inputs/inputs').then((m) => m.Inputs),
  },
  {
    id: 'outputs',
    title: 'Component Outputs',
    summary: 'Emitting events with output() / @Output and EventEmitter to parents.',
    level: 'beginner',
    category: 'Component Communication',
    loadComponent: () => import('../lessons/beginner/outputs/outputs').then((m) => m.Outputs),
  },
  {
    id: 'services-di',
    title: 'Services & Dependency Injection',
    summary: '@Injectable, providedIn, the inject() function and sharing state.',
    level: 'beginner',
    category: 'Dependency Injection',
    loadComponent: () =>
      import('../lessons/beginner/services-di/services-di').then((m) => m.ServicesDi),
  },
  {
    id: 'signals',
    title: 'Signals Basics',
    summary: 'signal(), computed(), effect() — Angular’s reactive primitive.',
    level: 'beginner',
    category: 'Signals',
    loadComponent: () => import('../lessons/beginner/signals/signals').then((m) => m.Signals),
  },
  {
    id: 'routing-basics',
    title: 'Routing Basics',
    summary: 'Defining routes, router-outlet, routerLink and routerLinkActive.',
    level: 'beginner',
    category: 'Routing',
    loadComponent: () =>
      import('../lessons/beginner/routing-basics/routing-basics').then((m) => m.RoutingBasics),
  },
  {
    id: 'http-basics',
    title: 'HttpClient Basics',
    summary: 'provideHttpClient, GET requests and rendering the result.',
    level: 'beginner',
    category: 'HTTP',
    loadComponent: () =>
      import('../lessons/beginner/http-basics/http-basics').then((m) => m.HttpBasics),
  },
  {
    id: 'template-forms',
    title: 'Template-Driven Forms',
    summary: 'ngModel, ngForm, and basic validation the template-first way.',
    level: 'beginner',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/beginner/template-forms/template-forms').then((m) => m.TemplateForms),
  },
  {
    id: 'ngmodules',
    title: 'NgModules Explained',
    summary: '@NgModule metadata, feature/shared/core modules, lazy loading & standalone interop.',
    level: 'beginner',
    category: 'NgModules',
    loadComponent: () =>
      import('../lessons/beginner/ngmodules/ngmodules').then((m) => m.Ngmodules),
  },

  // ===================================================================
  // INTERMEDIATE
  // ===================================================================
  {
    id: 'reactive-forms',
    title: 'Reactive Forms',
    summary: 'FormControl, FormGroup, FormBuilder and typed forms.',
    level: 'intermediate',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/intermediate/reactive-forms/reactive-forms').then((m) => m.ReactiveForms),
  },
  {
    id: 'form-validation',
    title: 'Form Validation',
    summary: 'Built-in validators, custom validators and showing error messages.',
    level: 'intermediate',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/intermediate/form-validation/form-validation').then(
        (m) => m.FormValidation,
      ),
  },
  {
    id: 'async-validators',
    title: 'Async Validators',
    summary: 'Server-side / asynchronous validation with Observables.',
    level: 'intermediate',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/intermediate/async-validators/async-validators').then(
        (m) => m.AsyncValidators,
      ),
  },
  {
    id: 'form-arrays',
    title: 'Dynamic Forms & FormArray',
    summary: 'Adding and removing controls at runtime.',
    level: 'intermediate',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/intermediate/form-arrays/form-arrays').then((m) => m.FormArrays),
  },
  {
    id: 'router-children-lazy',
    title: 'Child Routes & Lazy Loading',
    summary: 'Nested outlets, feature routes and loadChildren / loadComponent.',
    level: 'intermediate',
    category: 'Routing',
    loadComponent: () =>
      import('../lessons/intermediate/router-children-lazy/router-children-lazy').then(
        (m) => m.RouterChildrenLazy,
      ),
  },
  {
    id: 'route-guards',
    title: 'Functional Route Guards',
    summary: 'CanActivate, CanMatch, CanDeactivate as functional guards.',
    level: 'intermediate',
    category: 'Routing',
    loadComponent: () =>
      import('../lessons/intermediate/route-guards/route-guards').then((m) => m.RouteGuards),
  },
  {
    id: 'resolvers',
    title: 'Resolvers & Route Data',
    summary: 'Pre-fetching data before navigation and static route data.',
    level: 'intermediate',
    category: 'Routing',
    loadComponent: () =>
      import('../lessons/intermediate/resolvers/resolvers').then((m) => m.Resolvers),
  },
  {
    id: 'route-params',
    title: 'Route & Query Parameters',
    summary: 'paramMap, queryParamMap, fragments and the withComponentInputBinding option.',
    level: 'intermediate',
    category: 'Routing',
    loadComponent: () =>
      import('../lessons/intermediate/route-params/route-params').then((m) => m.RouteParams),
  },
  {
    id: 'http-crud',
    title: 'HttpClient CRUD',
    summary: 'POST/PUT/PATCH/DELETE, headers, params and typed responses.',
    level: 'intermediate',
    category: 'HTTP',
    loadComponent: () =>
      import('../lessons/intermediate/http-crud/http-crud').then((m) => m.HttpCrud),
  },
  {
    id: 'http-interceptors',
    title: 'HTTP Interceptors',
    summary: 'Functional interceptors for auth, logging, errors and retries.',
    level: 'intermediate',
    category: 'HTTP',
    loadComponent: () =>
      import('../lessons/intermediate/http-interceptors/http-interceptors').then(
        (m) => m.HttpInterceptors,
      ),
  },
  {
    id: 'rxjs-observables',
    title: 'RxJS: Observables',
    summary: 'Observables, observers, subscriptions and the push model.',
    level: 'intermediate',
    category: 'RxJS',
    loadComponent: () =>
      import('../lessons/intermediate/rxjs-observables/rxjs-observables').then(
        (m) => m.RxjsObservables,
      ),
  },
  {
    id: 'rxjs-operators',
    title: 'RxJS: Core Operators',
    summary: 'map, filter, tap, switchMap, mergeMap, concatMap, exhaustMap.',
    level: 'intermediate',
    category: 'RxJS',
    loadComponent: () =>
      import('../lessons/intermediate/rxjs-operators/rxjs-operators').then((m) => m.RxjsOperators),
  },
  {
    id: 'rxjs-subjects',
    title: 'RxJS: Subjects',
    summary: 'Subject, BehaviorSubject, ReplaySubject and multicasting.',
    level: 'intermediate',
    category: 'RxJS',
    loadComponent: () =>
      import('../lessons/intermediate/rxjs-subjects/rxjs-subjects').then((m) => m.RxjsSubjects),
  },
  {
    id: 'rxjs-interop',
    title: 'Signals ↔ RxJS Interop',
    summary: 'toSignal, toObservable and takeUntilDestroyed.',
    level: 'intermediate',
    category: 'RxJS',
    loadComponent: () =>
      import('../lessons/intermediate/rxjs-interop/rxjs-interop').then((m) => m.RxjsInterop),
  },
  {
    id: 'custom-pipes',
    title: 'Custom Pipes',
    summary: 'Writing pure and impure pipes with @Pipe and transform().',
    level: 'intermediate',
    category: 'Pipes & Directives',
    loadComponent: () =>
      import('../lessons/intermediate/custom-pipes/custom-pipes').then((m) => m.CustomPipes),
  },
  {
    id: 'attribute-directives',
    title: 'Custom Attribute Directives',
    summary: 'Manipulating elements with @Directive, HostBinding and HostListener.',
    level: 'intermediate',
    category: 'Pipes & Directives',
    loadComponent: () =>
      import('../lessons/intermediate/attribute-directives/attribute-directives').then(
        (m) => m.AttributeDirectives,
      ),
  },
  {
    id: 'structural-directives',
    title: 'Custom Structural Directives',
    summary: 'TemplateRef, ViewContainerRef and the * micro-syntax.',
    level: 'intermediate',
    category: 'Pipes & Directives',
    loadComponent: () =>
      import('../lessons/intermediate/structural-directives/structural-directives').then(
        (m) => m.StructuralDirectives,
      ),
  },
  {
    id: 'content-projection',
    title: 'Content Projection',
    summary: 'ng-content, multi-slot projection, ngProjectAs and contentChild queries.',
    level: 'intermediate',
    category: 'Components & Templates',
    loadComponent: () =>
      import('../lessons/intermediate/content-projection/content-projection').then(
        (m) => m.ContentProjection,
      ),
  },
  {
    id: 'view-queries',
    title: 'View Queries',
    summary: 'viewChild / viewChildren signal queries and @ViewChild.',
    level: 'intermediate',
    category: 'Components & Templates',
    loadComponent: () =>
      import('../lessons/intermediate/view-queries/view-queries').then((m) => m.ViewQueries),
  },
  {
    id: 'ng-template-outlet',
    title: 'ng-template & ngTemplateOutlet',
    summary: 'Reusable template fragments with context.',
    level: 'intermediate',
    category: 'Components & Templates',
    loadComponent: () =>
      import('../lessons/intermediate/ng-template-outlet/ng-template-outlet').then(
        (m) => m.NgTemplateOutletLesson,
      ),
  },
  {
    id: 'di-providers',
    title: 'DI Providers In Depth',
    summary: 'useClass, useValue, useFactory, useExisting and InjectionToken.',
    level: 'intermediate',
    category: 'Dependency Injection',
    loadComponent: () =>
      import('../lessons/intermediate/di-providers/di-providers').then((m) => m.DiProviders),
  },
  {
    id: 'signals-advanced',
    title: 'Advanced Signals',
    summary: 'linkedSignal, untracked, effect cleanup and equality functions.',
    level: 'intermediate',
    category: 'Signals',
    loadComponent: () =>
      import('../lessons/intermediate/signals-advanced/signals-advanced').then(
        (m) => m.SignalsAdvanced,
      ),
  },
  {
    id: 'resource-api',
    title: 'The resource() API',
    summary: 'Async data loading with resource() / rxResource and signals.',
    level: 'intermediate',
    category: 'Signals',
    loadComponent: () =>
      import('../lessons/intermediate/resource-api/resource-api').then((m) => m.ResourceApi),
  },
  {
    id: 'testing-components',
    title: 'Testing Components',
    summary: 'TestBed, ComponentFixture, querying the DOM and change detection.',
    level: 'intermediate',
    category: 'Testing',
    loadComponent: () =>
      import('../lessons/intermediate/testing-components/testing-components').then(
        (m) => m.TestingComponents,
      ),
  },
  {
    id: 'testing-services-http',
    title: 'Testing Services & HTTP',
    summary: 'Spies, provideHttpClientTesting and HttpTestingController.',
    level: 'intermediate',
    category: 'Testing',
    loadComponent: () =>
      import('../lessons/intermediate/testing-services-http/testing-services-http').then(
        (m) => m.TestingServicesHttp,
      ),
  },

  // ===================================================================
  // EXPERT
  // ===================================================================
  {
    id: 'change-detection',
    title: 'Change Detection Deep Dive',
    summary: 'How Zone.js triggers CD, the component tree and dirty checking.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () =>
      import('../lessons/expert/change-detection/change-detection').then((m) => m.ChangeDetection),
  },
  {
    id: 'onpush',
    title: 'OnPush Change Detection',
    summary: 'ChangeDetectionStrategy.OnPush, immutability and markForCheck.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () => import('../lessons/expert/onpush/onpush').then((m) => m.Onpush),
  },
  {
    id: 'zoneless',
    title: 'Zoneless Angular',
    summary: 'provideZonelessChangeDetection and signal-driven updates.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () => import('../lessons/expert/zoneless/zoneless').then((m) => m.Zoneless),
  },
  {
    id: 'deferrable-views',
    title: 'Deferrable Views (@defer)',
    summary: '@defer / @placeholder / @loading / @error and triggers like on viewport.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () =>
      import('../lessons/expert/deferrable-views/deferrable-views').then((m) => m.DeferrableViews),
  },
  {
    id: 'performance',
    title: 'Performance Optimization',
    summary: 'Bundle budgets, lazy loading, track functions, pure pipes and profiling.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () =>
      import('../lessons/expert/performance/performance').then((m) => m.Performance),
  },
  {
    id: 'after-render',
    title: 'afterRender & afterNextRender',
    summary: 'Running DOM work safely after the framework renders.',
    level: 'expert',
    category: 'Runtime & Performance',
    loadComponent: () =>
      import('../lessons/expert/after-render/after-render').then((m) => m.AfterRender),
  },
  {
    id: 'ssr',
    title: 'Server-Side Rendering',
    summary: 'provideServerRendering, the server build and SEO benefits.',
    level: 'expert',
    category: 'Rendering & Delivery',
    loadComponent: () => import('../lessons/expert/ssr/ssr').then((m) => m.Ssr),
  },
  {
    id: 'hydration',
    title: 'Hydration',
    summary: 'provideClientHydration, event replay and incremental hydration.',
    level: 'expert',
    category: 'Rendering & Delivery',
    loadComponent: () => import('../lessons/expert/hydration/hydration').then((m) => m.Hydration),
  },
  {
    id: 'pwa-service-worker',
    title: 'PWA & Service Worker',
    summary: '@angular/service-worker, caching strategies and offline support.',
    level: 'expert',
    category: 'Rendering & Delivery',
    loadComponent: () =>
      import('../lessons/expert/pwa-service-worker/pwa-service-worker').then(
        (m) => m.PwaServiceWorker,
      ),
  },
  {
    id: 'state-management',
    title: 'State Management',
    summary: 'Signal stores, NgRx concepts and choosing an architecture.',
    level: 'expert',
    category: 'Architecture',
    loadComponent: () =>
      import('../lessons/expert/state-management/state-management').then((m) => m.StateManagement),
  },
  {
    id: 'dynamic-components',
    title: 'Dynamic Components',
    summary: 'ngComponentOutlet, ViewContainerRef.createComponent and host APIs.',
    level: 'expert',
    category: 'Architecture',
    loadComponent: () =>
      import('../lessons/expert/dynamic-components/dynamic-components').then(
        (m) => m.DynamicComponents,
      ),
  },
  {
    id: 'host-directives',
    title: 'Directive Composition API',
    summary: 'hostDirectives for composing behavior onto components.',
    level: 'expert',
    category: 'Architecture',
    loadComponent: () =>
      import('../lessons/expert/host-directives/host-directives').then((m) => m.HostDirectives),
  },
  {
    id: 'control-value-accessor',
    title: 'Custom Form Controls (CVA)',
    summary: 'Implementing ControlValueAccessor for first-class form integration.',
    level: 'expert',
    category: 'Forms',
    loadComponent: () =>
      import('../lessons/expert/control-value-accessor/control-value-accessor').then(
        (m) => m.ControlValueAccessorLesson,
      ),
  },
  {
    id: 'di-advanced',
    title: 'Advanced DI',
    summary: 'Multi providers, @Optional/@Self/@SkipSelf/@Host, forwardRef and hierarchies.',
    level: 'expert',
    category: 'Dependency Injection',
    loadComponent: () =>
      import('../lessons/expert/di-advanced/di-advanced').then((m) => m.DiAdvanced),
  },
  {
    id: 'rxjs-advanced',
    title: 'Advanced RxJS',
    summary: 'combineLatest, forkJoin, withLatestFrom, retry, error handling, custom operators.',
    level: 'expert',
    category: 'RxJS',
    loadComponent: () =>
      import('../lessons/expert/rxjs-advanced/rxjs-advanced').then((m) => m.RxjsAdvanced),
  },
  {
    id: 'security',
    title: 'Security & Sanitization',
    summary: 'XSS protection, DomSanitizer, trusted types and CSP.',
    level: 'expert',
    category: 'Cross-Cutting',
    loadComponent: () => import('../lessons/expert/security/security').then((m) => m.Security),
  },
  {
    id: 'i18n',
    title: 'Internationalization (i18n)',
    summary: 'i18n attributes, $localize, extraction and locale builds.',
    level: 'expert',
    category: 'Cross-Cutting',
    loadComponent: () => import('../lessons/expert/i18n/i18n').then((m) => m.I18n),
  },
  {
    id: 'a11y',
    title: 'Accessibility (a11y)',
    summary: 'ARIA, focus management, the CDK a11y module and testing.',
    level: 'expert',
    category: 'Cross-Cutting',
    loadComponent: () => import('../lessons/expert/a11y/a11y').then((m) => m.A11y),
  },
  {
    id: 'animations',
    title: 'Animations',
    summary: 'The animations API, triggers, states, transitions and keyframes.',
    level: 'expert',
    category: 'Cross-Cutting',
    loadComponent: () =>
      import('../lessons/expert/animations/animations').then((m) => m.Animations),
  },
  {
    id: 'view-transitions',
    title: 'View Transitions',
    summary: 'withViewTransitions for smooth route-level transitions.',
    level: 'expert',
    category: 'Cross-Cutting',
    loadComponent: () =>
      import('../lessons/expert/view-transitions/view-transitions').then((m) => m.ViewTransitions),
  },
  {
    id: 'ngmodules-migration',
    title: 'NgModules & Standalone Migration',
    summary: 'Understanding NgModules and migrating to standalone APIs.',
    level: 'expert',
    category: 'Architecture',
    loadComponent: () =>
      import('../lessons/expert/ngmodules-migration/ngmodules-migration').then(
        (m) => m.NgmodulesMigration,
      ),
  },
  {
    id: 'libraries-schematics',
    title: 'Libraries & Schematics',
    summary: 'Building reusable libraries with ng-packagr and authoring schematics.',
    level: 'expert',
    category: 'Tooling',
    loadComponent: () =>
      import('../lessons/expert/libraries-schematics/libraries-schematics').then(
        (m) => m.LibrariesSchematics,
      ),
  },

  // ===================================================================
  // PROJECTS (end-to-end walkthroughs)
  // ===================================================================
  {
    id: 'task-manager',
    title: 'Project: Task Manager',
    summary: 'Build a Kanban board — signal store, components, two-way binding, localStorage.',
    level: 'projects',
    category: 'Full-Stack Angular',
    loadComponent: () =>
      import('../lessons/projects/task-manager/task-manager').then((m) => m.TaskManager),
  },
  {
    id: 'auth-flow',
    title: 'Project: Auth Flow',
    summary: 'Build login/logout with JWT, an HTTP interceptor and a route guard.',
    level: 'projects',
    category: 'Full-Stack Angular',
    loadComponent: () =>
      import('../lessons/projects/auth-flow/auth-flow').then((m) => m.AuthFlow),
  },
  {
    id: 'data-dashboard',
    title: 'Project: Data Dashboard',
    summary: 'Build a filtered/sorted sales dashboard with KPIs, resource() and computed selectors.',
    level: 'projects',
    category: 'Full-Stack Angular',
    loadComponent: () =>
      import('../lessons/projects/data-dashboard/data-dashboard').then((m) => m.DataDashboard),
  },
];

/** Fast lookup of a lesson by its route id. */
export const LESSON_BY_ID = new Map<string, Lesson>(CURRICULUM.map((l) => [l.id, l]));
