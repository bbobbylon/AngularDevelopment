import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';


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
    question: 'UserCard is declared in FeatureModule. Another component declared in FeatureModule uses <app-user-card>.',
    works: true,
    why: "Same compilation scope — a module's declarations all see each other. This is the baseline case.",
  },
  {
    label: 'declared there, no export',
    question: 'UserCard is declared in SharedModule (NOT exported). AdminModule imports SharedModule and a component there uses <app-user-card>.',
    works: false,
    why: 'Declarations are PRIVATE by default. Importing a module gives you only its EXPORTS. Result: "app-user-card is not a known element" — the single most common NgModule error. Fix: add UserCard to SharedModule\'s exports.',
  },
  {
    label: 'exported + imported',
    question: 'UserCard is declared AND exported by SharedModule. AdminModule imports SharedModule.',
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
    question: 'AuthService is in SharedModule\'s providers (not exported). AdminModule imports SharedModule and injects AuthService.',
    works: true,
    why: 'The trap question: exports only govern TEMPLATE scope (components/directives/pipes). Providers ignore it — an eagerly-loaded module\'s providers merge into the app-wide injector. This asymmetry confused everyone, and is one reason standalone splits the concepts cleanly.',
  },
  {
    label: 'standalone into NgModule',
    question: 'StatCard is a standalone component. LegacyModule adds it to its imports array, and a declared component uses it.',
    works: true,
    why: 'Standalone components import like a module: put them in the NgModule\'s IMPORTS (never declarations — NG6008). This interop is what makes incremental migration possible.',
  },
];

/**
 * Lesson: NgModules & the standalone migration — the compilation-scope model
 * that explains every NgModule error (with an interactive scope quiz), the
 * declarations/imports/exports/providers anatomy, forRoot/forChild and why
 * they existed, the three-step migration schematic, the provide* function
 * map, mixing both worlds, and the classic error messages decoded.
 */
@Component({
  selector: 'app-lesson-ngmodules-migration',
  imports: [RouterLink],
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

  /**
   * Sample: `@NgModule` and what each of its four arrays meant.
   */
  readonly anatomySample = `@NgModule({
  declarations: [UserCard, HighlightDirective, InitialsPipe], // template scope (private!)
  imports:      [CommonModule, SharedModule],                  // other modules' exports
  exports:      [UserCard],                                    // my public template API
  providers:    [UserService],                                 // injector — different world
  bootstrap:    [AppComponent],                                // root module only
})
export class UserModule {}`;

  /**
   * Sample: the `forRoot()` convention, and the singleton problem it existed to
   * solve.
   */
  readonly forRootSample = `// the old convention, seen in every router/config-style library
@NgModule({ declarations: [...], exports: [...] })
export class CarouselModule {
  static forRoot(config: CarouselConfig): ModuleWithProviders<CarouselModule> {
    return {
      ngModule: CarouselModule,
      providers: [{ provide: CAROUSEL_CONFIG, useValue: config }], // ONCE, at root
    };
  }
  // lazy features import CarouselModule (or forChild()) — directives, no providers
}`;

  /**
   * Sample: the same thing standalone — the component declares exactly what its
   * own template uses.
   */
  readonly standaloneSample = `@Component({
  selector: 'app-user-card',
  imports: [RouterLink, DatePipe, StatBadge],   // exactly what THIS template uses
  template: \`…\`,
})
export class UserCard {}          // standalone by default — no module anywhere

// main.ts
bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});`;

  /**
   * Sample: `ng generate @angular/core:standalone`, and the three modes it has to
   * be run in.
   */
  readonly migrationSample = `ng generate @angular/core:standalone
# run three times, once per mode:
#   1. "Convert all components…"  → adds imports arrays, flips declarations
#   2. "Remove unnecessary NgModules" → deletes emptied modules
#   3. "Bootstrap the application…"   → AppModule → bootstrapApplication + app.config.ts

# then review: leftover provider-only modules, forRoot calls, route modules`;

  /**
   * Sample: interop in both directions, since a real migration is incremental and
   * the two styles have to coexist.
   */
  readonly interopSample = `// standalone component INSIDE an NgModule app:
@NgModule({
  imports: [StatCard],        // standalone things go in imports (NG6008 if declared)
  declarations: [LegacyPage], // legacy component using <app-stat-card>
})

// NgModule INSIDE a standalone component:
@Component({
  imports: [LegacyChartsModule],   // whole module's exports become available
})`;
}
