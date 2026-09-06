import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * One "is this in scope?" scenario: the question, the answer, and why.
 */
interface ScopeScenario {
  label: string;
  question: string;
  works: boolean;
  why: string;
}

const SCENARIOS: ScopeScenario[] = [
  {
    label: 'declared here, used here',
    question:
      'UserCard is declared in FeatureModule. Another component declared in FeatureModule uses <app-user-card>.',
    works: true,
    why: "Same compilation scope — a module's declarations all see each other. This is the baseline case.",
  },
  {
    label: 'declared there, no export',
    question:
      'UserCard is declared in SharedModule (NOT exported). AdminModule imports SharedModule and a component there uses <app-user-card>.',
    works: false,
    why: 'Declarations are PRIVATE by default. Importing a module gives you only its EXPORTS. Result: "app-user-card is not a known element" — the single most common NgModule error. Fix: add UserCard to SharedModule\'s exports.',
  },
  {
    label: 'exported + imported',
    question:
      'UserCard is declared AND exported by SharedModule. AdminModule imports SharedModule.',
    works: true,
    why: "exports define the module's public template API; importing the module pulls those into your compilation scope. Declared-and-exported is the shared-UI pattern.",
  },
  {
    label: 'declared in two modules',
    question: 'UserCard is added to the declarations of BOTH FeatureAModule and FeatureBModule.',
    works: false,
    why: 'NG6007: a declarable may belong to exactly ONE module. The fix was declaring it once in a shared module and importing that everywhere — or, today, making it standalone.',
  },
  {
    label: 'service, not exported',
    question:
      "AuthService is in SharedModule's providers (not exported). AdminModule imports SharedModule and injects AuthService.",
    works: true,
    why: "The trap question: exports only govern TEMPLATE scope (components/directives/pipes). Providers ignore it — an eagerly-loaded module's providers merge into the app-wide injector. This asymmetry confused everyone, and is one reason standalone splits the concepts cleanly.",
  },
  {
    label: 'standalone into NgModule',
    question:
      'StatCard is a standalone component. LegacyModule adds it to its imports array, and a declared component uses it.',
    works: true,
    why: "Standalone components import like a module: put them in the NgModule's IMPORTS (never declarations — NG6008). This interop is what makes incremental migration possible.",
  },
];

/**
 * Lesson: NgModules & the standalone migration — the compilation-scope model
 * that explains every classic NgModule error, and the specific ways a
 * migration to standalone breaks silently rather than loudly.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, see
 * `expert/change-detection` for the reference implementation) following the
 * same teaching order:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "why does the
 *    same component compile here and not there?" — the exact confusion every
 *    `NgModule` learner hits — before any of `declarations` / `imports` /
 *    `exports` / `providers` is defined.
 * 2. **Analogy next, mechanism after.** The clubhouse-with-a-guest-list frame
 *    (a private room, a door list, and — separately — a street's electricity
 *    grid that doesn't care about either) gives the reader somewhere to put
 *    the asymmetry between template scope and injector scope before those
 *    words show up.
 * 3. **The same idea in more than one mode** — an annotated `@NgModule`, four
 *    tape cards, a six-scenario interactive predict-then-check quiz, and a
 *    two-panel "free ride" diagram showing exactly what a migration silently
 *    drops when an ancestor module's re-exported directive is not replaced
 *    with a direct `imports` entry.
 * 4. **Two traps that don't throw.** A `Predict` on the classic
 *    `HTTP_INTERCEPTORS` migration gotcha (compiles clean, silently stops
 *    authenticating requests) and a `Quiz` on the providers/exports asymmetry,
 *    because both of this lesson's hardest ideas are things that fail
 *    quietly, not loudly.
 *
 * @see beginner/ngmodules — the introductory `@NgModule` anatomy this lesson assumes.
 * @see intermediate/http-interceptors — the functional-interceptor API the migration trap here revolves around.
 * @see expert/libraries-schematics — building and migrating a library, the next step after an app.
 */
@Component({
  selector: 'app-lesson-ngmodules-migration',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './ngmodules-migration.css',
  templateUrl: './ngmodules-migration.html',
})
export class NgmodulesMigration {
  /**
   * The scope scenarios.
   */
  readonly scenarios = SCENARIOS;
  /**
   * The scenario being examined, or `null` for none.
   */
  readonly active = signal<ScopeScenario | null>(null);

  /** The Architecture track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'State Management', id: 'state-management' },
    { label: 'Dynamic Components', id: 'dynamic-components' },
    { label: 'Host Directives', id: 'host-directives' },
    { label: 'NgModules & Standalone' },
  ];

  /**
   * Sample: `@NgModule` and what each of its arrays actually governs.
   */
  protected readonly anatomySample = `@NgModule({
  declarations: [UserCard, HighlightDirective, InitialsPipe], // template scope — PRIVATE by default
  imports:      [CommonModule, SharedModule],                  // pulls in OTHER modules' exports
  exports:      [UserCard],                                    // this module's public template API
  providers:    [UserService],                                 // injector scope — ignores exports entirely
  bootstrap:    [AppComponent],                                // root module only, where Angular starts
})
export class UserModule {}`;

  /** Line-by-line walkthrough of {@link anatomySample}. */
  protected readonly anatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@NgModule` is a decorator — a function call that attaches configuration to the class on the last line. Nothing here runs; the compiler reads this object once, at build time, to work out what this module can see and what it exposes.',
    },
    {
      line: 2,
      text: "`declarations` lists this module's own components, directives and pipes — collectively called **declarables**. `UserCard` is a component, `HighlightDirective` a directive, `InitialsPipe` a pipe. They can all use each other freely inside this module. Outside it, by default, none of them exist.",
    },
    {
      line: 3,
      text: "`imports` names other modules whose **exports** this module wants. `CommonModule` is Angular's own grab-bag; `SharedModule` is a project module. Importing a module never hands you its private declarations — only whatever it chose to re-export.",
    },
    {
      line: 4,
      text: "`exports` re-publishes a subset of `declarations` (or of an import) as this module's public template API. Only `UserCard` is listed — `HighlightDirective` and `InitialsPipe` stay locked inside this module even though line 2 declared them too.",
    },
    {
      line: 5,
      text: '`providers` registers services with dependency injection, and pays no attention to `exports` at all. Load this module eagerly and `UserService` becomes available to the injector for the **entire app**, exported or not.',
    },
    {
      line: 6,
      text: '`bootstrap` exists only on the root module. It tells `platformBrowserDynamic()` which component to create first — the one that ends up rendered into `index.html`. A feature module never sets this.',
    },
    {
      line: 8,
      text: 'The class itself is usually empty. `@NgModule` did all the work above it; `UserModule` is just the thing the metadata is attached to.',
    },
  ];

  /**
   * Sample: the `forRoot()` convention, and the singleton problem it existed
   * to solve — a static method, not a language feature.
   */
  protected readonly forRootSample = `// the convention seen in every router/config-style library before standalone:
@NgModule({ declarations: [Carousel], exports: [Carousel] })
export class CarouselModule {
  static forRoot(config: CarouselConfig): ModuleWithProviders<CarouselModule> {
    return {
      ngModule: CarouselModule,
      providers: [{ provide: CAROUSEL_CONFIG, useValue: config }], // registered ONCE, at the root
    };
  }

  // a lazy feature imports CarouselModule directly (or a forChild() twin):
  // directives only, no providers — so no second config is ever registered
}`;

  /** Line-by-line walkthrough of {@link forRootSample}. */
  protected readonly forRootNotes: CodeNote[] = [
    {
      line: 2,
      text: "This `@NgModule` only declares and exports the carousel's UI — no `providers` array here. Providers are handled separately, by the static method below.",
    },
    {
      line: 3,
      text: '`CarouselModule` is a plain class. `static forRoot` is ordinary JavaScript, not special Angular syntax — which is why this trick worked with any module and needed no framework support.',
    },
    {
      line: 4,
      text: '`ModuleWithProviders<T>` is the return type that makes this legal inside an `imports` array: instead of a bare module class, you hand Angular a value shaped like `{ ngModule, providers }`, meaning "import this module, then merge these providers into the injector too".',
    },
    {
      line: 6,
      text: '`ngModule: CarouselModule` still has to say which module to actually import — returning providers alone would not be enough.',
    },
    {
      line: 7,
      text: 'The providers array is built from whatever `config` was passed in. Because this line only runs where `forRoot(config)` is actually called — once, at the app root — the config is registered exactly once no matter how many feature modules later import `CarouselModule`.',
    },
    {
      line: 11,
      text: 'Every lazy feature imports the **bare** module (or a `forChild()` twin with no return-type games), getting the directives but never re-registering `CAROUSEL_CONFIG`. Skip this distinction and each lazy chunk quietly creates its own separate provider instance.',
    },
  ];

  /**
   * Sample: the same job, done the standalone way — template deps on the
   * component, providers centralized at bootstrap.
   */
  protected readonly standaloneSample = `@Component({
  selector: 'app-user-card',
  imports: [RouterLink, DatePipe, StatBadge],   // exactly what THIS template uses — nothing inherited
  template: \`…\`,
})
export class UserCard {}          // standalone by default — no NgModule anywhere

// main.ts — the whole app in one call:
bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});`;

  /** Line-by-line walkthrough of {@link standaloneSample}. */
  protected readonly standaloneNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@Component` is the only decorator this class needs — there is no companion `@NgModule` anywhere in the file, and none is coming.',
    },
    {
      line: 3,
      text: "This `imports` array is the component's **entire** template dependency list: `RouterLink` for its `routerLink` bindings, `DatePipe` for a `date` pipe, `StatBadge` for a child component — every single thing the template references, and nothing it doesn't. There is no ancestor module to inherit from.",
    },
    {
      line: 4,
      text: 'The inline template (elided here) is where those three imports actually get used — `routerLink`, a `date` pipe, `<app-stat-badge>`.',
    },
    {
      line: 6,
      text: 'No `standalone: true` written anywhere — since Angular 19 a component is standalone unless it explicitly opts out with `standalone: false`, which only `NgModule`-declared components still need.',
    },
    {
      line: 9,
      text: '`bootstrapApplication` replaces `platformBrowserDynamic().bootstrapModule(AppModule)` entirely — one function, no module, no `BrowserModule` to remember.',
    },
    {
      line: 11,
      text: "`provideRouter` replaces `RouterModule.forRoot(routes)`. `withComponentInputBinding()` is a **feature** — an optional add-on passed as an extra argument, the standalone equivalent of a module's config object.",
    },
    {
      line: 12,
      text: '`provideHttpClient` replaces `HttpClientModule`. `withInterceptors([...])` takes **functional** interceptors — plain functions, not injectable classes. That distinction is exactly what bites a real migration; more on that a little further down.',
    },
  ];

  /**
   * Sample: `ng generate @angular/core:standalone`, and the three modes it
   * has to be run in.
   */
  protected readonly migrationSample = `ng generate @angular/core:standalone
# run three times, once per mode:
#   1. "Convert all components…"      → adds imports arrays, flips declarations
#   2. "Remove unnecessary NgModules" → deletes emptied modules
#   3. "Bootstrap the application…"   → AppModule → bootstrapApplication + app.config.ts

# then review by hand: leftover provider-only modules, forRoot() calls, route modules`;

  /** Line-by-line walkthrough of {@link migrationSample}. */
  protected readonly migrationNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One schematic, but it has three separate jobs bundled behind one command — it asks which mode to run each time.',
    },
    {
      line: 3,
      text: "Mode 1 walks every `@Component` still using `declarations`, adds an `imports` array built from what its template actually references, and removes it from its module's `declarations`.",
    },
    {
      line: 4,
      text: "Mode 2 deletes any `NgModule` left with nothing in it — but leaves alone any module still holding `providers`, a `forRoot()` call, or a route definition, because those aren't safe to delete automatically.",
    },
    {
      line: 5,
      text: "Mode 3 rewrites `main.ts`: `platformBrowserDynamic().bootstrapModule(AppModule)` becomes `bootstrapApplication(App, appConfig)`, translating whatever was in `AppModule`'s `imports`/`providers` into `app.config.ts` wherever a `provide*()` function exists for it.",
    },
    {
      line: 7,
      text: 'The schematic is mechanical; it cannot know that a provider-only module fed an interceptor, or that a `forRoot()` call carried config nothing else mentions. Those are exactly the things worth checking by hand — and exactly what the next two sections cover.',
    },
  ];

  /**
   * Sample: the classic silent migration trap — an `HTTP_INTERCEPTORS`
   * multi-provider that `provideHttpClient()` does not pick up on its own.
   * Fed to the `Predict` below rather than a `CodeLab`, since the point is to
   * commit to an answer before seeing why it's wrong.
   */
  protected readonly interceptorTrapSample = `// AppModule (deleted during migration):
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
],

// app.config.ts (after migration):
providers: [
  provideHttpClient(),   // compiles clean — looks like a straight swap
],`;

  /**
   * Sample: interop in both directions, since a real migration is incremental
   * and the two styles have to coexist for a while.
   */
  protected readonly interopSample = `// standalone component INSIDE an NgModule app:
@NgModule({
  imports:      [StatCard],    // standalone things go in imports — NG6008 if you declare them
  declarations: [LegacyPage],  // LegacyPage's template can use <app-stat-card> normally
})
export class LegacyFeatureModule {}

// NgModule INSIDE a standalone component:
@Component({
  imports: [LegacyChartsModule],   // the WHOLE module's exports become available here
})
export class ReportPage {}`;

  /** Line-by-line walkthrough of {@link interopSample}. */
  protected readonly interopNotes: CodeNote[] = [
    {
      line: 3,
      text: '`StatCard` is standalone, so it belongs in `imports`, exactly like a module would. Put it in `declarations` instead and you get NG6008 — "this component is standalone and cannot be declared".',
    },
    {
      line: 4,
      text: '`LegacyPage` is still `NgModule`-declared, so it stays in `declarations`. Both directions work in the same file — this is what makes migrating one component at a time possible instead of a rewrite in one sitting.',
    },
    {
      line: 10,
      text: "A standalone component's `imports` array accepts a whole `NgModule`, not just standalone things. Every directive, component and pipe that module **exports** becomes available in this template — the old transitive-export rule still applies, just crossing into the new world instead of staying inside it.",
    },
  ];

  /** The two bootstrap calls, for the before/after comparison. */
  protected readonly bootstrapModuleSample = `platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));`;

  /** The standalone replacement for {@link bootstrapModuleSample}. */
  protected readonly bootstrapApplicationSample = `bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));`;

  /**
   * The self-test.
   *
   * Each wrong option names a real, specific misconception about the
   * exports/providers asymmetry rather than a generic "no" — that's where the
   * actual correction happens (CONTRIBUTING §2A.2).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: "No — it was never exported, so it doesn't exist outside `SharedModule`.",
      why: "That rule is real, but it's the wrong rule for this line. `exports` governs which components, directives and pipes another module can put in a template. It has no say over the injector at all — that's the entire asymmetry this lesson keeps coming back to.",
    },
    {
      text: "Yes — an eagerly loaded module's providers merge straight into the app-wide injector, exports or not.",
      correct: true,
      why: "Exactly the asymmetry. `providers` never checks `exports`. The moment `SharedModule` loads eagerly, `AuthService` is registered once, for the whole app, regardless of which modules can or can't see `SharedModule`'s components.",
    },
    {
      text: "No — the two feature modules never import each other, so there's no path between their injectors.",
      why: "Providers don't travel along the `imports` graph the way template access does. An eagerly loaded module's providers land directly in the single root **environment injector**, which every component in the app can reach — no import relationship between the two feature modules is needed.",
    },
    {
      text: 'Yes, but only because `SharedModule` calls `forRoot()`.',
      why: "`forRoot()` solves a different problem — stopping a **lazily** loaded module from re-registering its providers every time another lazy chunk imports it. An eagerly loaded module registers its providers exactly once with no `forRoot()` involved; the pattern doesn't even apply here.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Module A imports module B. Can A's components use B's declared-but-unexported directive?",
      a: 'No — importing a module only grants access to its `exports`. Declarations are private by default. This is the asymmetry that trips almost everyone up at least once: `providers` leak out of an eager module regardless of `exports`, but templates never do.',
    },
    {
      q: 'Why did `RouterModule` need `forRoot`/`forChild`?',
      a: "To register the router's singleton services exactly once. `forRoot()` returned the module plus providers for the app root; `forChild()` returned just the directives for lazy features, so each lazy import didn't create duplicate router state. `provideRouter()` plus plain route arrays replaced the whole pattern — there's no singleton problem left to solve.",
    },
    {
      q: 'During migration, how does an NgModule use an already-converted standalone component?',
      a: "Add the component class to the NgModule's `imports` array — never `declarations`, which throws NG6008. Standalone things import like modules do.",
    },
    {
      q: 'A library only ships `SomeLibModule` with providers. My app is standalone now — what do I do?',
      a: "`importProvidersFrom(SomeLibModule)` inside `app.config.ts`'s `providers` array extracts the module's whole provider graph into the environment injector. It's the designated bridge until the library ships its own `provideSomeLib()` function.",
    },
    {
      q: 'Do I still need `CommonModule` in a standalone component?',
      a: 'Rarely. `@if`/`@for`/`@switch` replaced the structural directives `CommonModule` used to supply, so you import only the individual pieces you actually use — typically pipes like `AsyncPipe` or `DatePipe`. A blanket `CommonModule` import in a standalone component is usually a migration leftover, not a real need.',
    },
  ];
}
