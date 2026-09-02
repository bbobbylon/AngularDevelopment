import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: NgModules Explained — what they were for, and why standalone replaced
 * them.
 *
 * A history lesson with a practical purpose. Standalone components are the
 * default now and nothing here is what you should write in a new app, but
 * `NgModule` is in every codebase older than Angular 15, in most tutorials still
 * online, and on the certification exam. This page is a translation guide: what
 * an NgModule actually does, the two entirely separate jobs it was quietly doing
 * at once, and exactly how each piece maps onto the standalone code every other
 * lesson in this app already uses.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the problem first.** Nothing in this curriculum has an `@NgModule`.
 *    The page opens on what was standing in for it, and makes the reader guess
 *    before naming the mechanism.
 * 2. **Analogy before vocabulary.** A module as a box with two doors —
 *    `exports` opens it outward, `imports` opens another box inward — gives
 *    `declarations`/`exports`/`imports` somewhere to land before the words
 *    have to carry any weight on their own.
 * 3. **Then the same idea in several modes**: a live door-toggle demo proving
 *    the two-door rule, an annotated six-bucket `@NgModule`, a dialogue between
 *    the compiler and the injector staging the "two jobs" distinction, and a
 *    containment diagram of why a lazy module's provider is a separate instance.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`,
 *    including the exact `standalone: false` correction the coverage sweep
 *    flagged as a high-priority outdated-API fix.
 *
 * ## Demos on this page
 *
 * - the door demo (`exported`, `imported`) — the original demo, kept, restyled
 *   as toggle buttons instead of checkboxes;
 * - the NgModule/standalone toggle (`mode`) — the original demo, kept, and
 *   deepened: the NgModule-mode sample now carries `standalone: false` with a
 *   line note explaining the flag inversion, and both modes get their own
 *   `app-code-lab` annotations instead of a single unannotated block.
 *
 * @see lessons/expert/ngmodules-migration — converting a real NgModule app to
 * standalone, step by step, once this page's vocabulary is second nature.
 */
@Component({
  selector: 'app-lesson-ngmodules',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './ngmodules.html',
  styleUrl: './ngmodules.css',
})
export class Ngmodules {
  // ── Demo 1: NgModule vs standalone, same component ─────────────────────────

  /** Which style the comparison is showing. */
  protected readonly mode = signal<'ngmodule' | 'standalone'>('ngmodule');

  /** One-line framing for the selected mode, shown above its code-lab. */
  protected readonly explanation = computed(() =>
    this.mode() === 'ngmodule'
      ? 'The NgModule way: the component is inert until a module declares it, and only usable elsewhere if that module also exports it.'
      : 'The standalone way: the component lists its own dependencies and is used by importing the class directly — there is no module in the middle at all.',
  );

  /**
   * Sample: a component that opts back into NgModule land, and the module
   * wrapper it now requires.
   *
   * `standalone: false` is the coverage-sweep correction — without it this
   * sample does not compile under Angular 19+, where standalone is the
   * default and `declarations` will only accept a component that opted out.
   */
  protected readonly ngModuleSample = `// greeting.ts
@Component({
  selector: 'app-greeting',
  standalone: false, // OPT OUT — Angular 19+ defaults every component to standalone
  template: '<h2>Hi</h2>',
})
export class GreetingComponent {}

// greeting.module.ts — a wrapper this component now REQUIRES
@NgModule({
  declarations: [GreetingComponent],
  imports: [CommonModule],
  exports: [GreetingComponent], // so other modules can use it
})
export class GreetingModule {}`;

  /** Line-by-line walkthrough of {@link ngModuleSample}. */
  protected readonly ngModuleNotes: CodeNote[] = [
    {
      line: 4,
      text: "This line is the whole coverage-sweep correction, and it's load-bearing. Since Angular 19 every component defaults to `standalone: true`, so a component that wants to live inside an NgModule has to **opt out** explicitly. Older tutorials show the opposite — pre-v19 code wrote `standalone: true` to opt **in**. The flag is deprecated either way; it exists only so a codebase mid-migration can mix both styles.",
    },
    {
      line: 7,
      text: 'Without line 4, this class is standalone, and putting it in `declarations` below fails to compile with `Component GreetingComponent is standalone, and cannot be declared in an NgModule` — the exact error waiting for anyone who pastes pre-2023 tutorial code into a current CLI app.',
    },
    {
      line: 11,
      text: '`declarations` is legal for this class specifically **because** of line 4 — this is the one metadata bucket a standalone component can never appear in, no matter what else is true about it.',
    },
    {
      line: 12,
      text: "A module's own `imports`, not the component's. `CommonModule` supplies `*ngIf`/`*ngFor` and the built-in pipes to every class declared in this module — none of them can import it individually the way a standalone component would.",
    },
    {
      line: 13,
      text: "Delete this line and `GreetingComponent` keeps working **inside** `GreetingModule` — declaring it was enough for that. What breaks is every OTHER module: declared-but-not-exported is the single most common 'my component isn't showing up over there' bug in NgModule code.",
    },
  ];

  /** Sample: the same component, standalone. */
  protected readonly standaloneSample = `// greeting.ts — self-contained, no module needed
@Component({
  selector: 'app-greeting',
  imports: [CommonModule], // declares its OWN dependencies
  template: '<h2>Hi</h2>',
})
export class Greeting {}

// used directly, wherever it's needed:
imports: [Greeting]`;

  /** Line-by-line walkthrough of {@link standaloneSample}. */
  protected readonly standaloneNotes: CodeNote[] = [
    {
      line: 3,
      text: 'No `standalone: false` here — this IS the default, the unwritten shape every lesson before this one in this app has used.',
    },
    {
      line: 4,
      text: "The component's OWN `imports`, not a module's. `CommonModule` — or, more idiomatically today, nothing at all, since built-in `@if`/`@for` need no import — is declared right where it's used, instead of inherited from whichever module happened to declare this component.",
    },
    {
      line: 6,
      text: 'Nothing wraps this class. `Greeting` IS the unit: there is no `GreetingModule` to also write, keep in sync, or forget to export from.',
    },
    {
      line: 9,
      text: "Using it somewhere else is one line: add the class itself to the consumer's `imports` array. No `exports` bucket and no import-the-module-that-exports-it indirection — the two-door rule from earlier collapses into a single door.",
    },
  ];

  // ── Demo 2: the door demo (export & import decide visibility) ──────────────

  /** Whether `SharedModule` exports the button. */
  protected readonly exported = signal(true);
  /** Whether `FeatureModule` imports `SharedModule`. */
  protected readonly imported = signal(true);
  /** Whether the button is usable — true only when **both** doors are open. */
  protected readonly canUse = computed(() => this.exported() && this.imported());
  /**
   * The verdict text, naming which of the two conditions is missing rather than
   * just saying no.
   */
  protected readonly verdict = computed(() => {
    if (this.canUse()) {
      return "Yes — FeatureModule imports SharedModule, and SharedModule exports ButtonComponent, so it's visible.";
    }
    if (!this.imported()) {
      return "No — FeatureModule never imports SharedModule, so none of its exports are visible here, no matter what's exported.";
    }
    return "No — SharedModule declares ButtonComponent but never exports it, so importers still can't see it even though they imported the module.";
  });

  /** Flips the export door. */
  protected toggleExported(): void {
    this.exported.set(!this.exported());
  }

  /** Flips the import door. */
  protected toggleImported(): void {
    this.imported.set(!this.imported());
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** This lesson stands alone in its curriculum category. */
  protected readonly stops: ChapterStop[] = [{ label: 'NgModules' }];

  /** The two-door chain a component travels to become usable elsewhere. */
  protected readonly doorFlow: FlowStep[] = [
    {
      label: 'Declare',
      detail: '`SharedModule` declares `ButtonComponent` — it now has exactly one owner',
    },
    {
      label: 'Export',
      detail: 'The first door: `SharedModule` lists it in `exports`',
      tone: 'accent',
    },
    {
      label: 'Import',
      detail: 'The second door: `FeatureModule` lists `SharedModule` in `imports`',
    },
    {
      label: 'Usable',
      detail: "`FeatureModule`'s own templates can now render `<app-button>`",
      tone: 'good',
    },
  ];

  /**
   * The compiler and the injector, arguing about what "visible" even means.
   *
   * This exchange exists because the misconception it corrects is the single
   * most common thing beginners get wrong about NgModules: they picture ONE
   * mechanism deciding both what a template may reference and who provides a
   * service. It is two mechanisms, checked by two different systems, and an
   * NgModule was the one file that fed both of them at once.
   */
  protected readonly compilerInjectorTalk: BubbleTurn[] = [
    {
      who: 'The compiler',
      says: 'I need to know: is `<app-widget>` allowed in this template? Let me check declarations and imports.',
    },
    {
      who: 'The injector',
      says: "Not my department. I only care about providers — who's actually implementing `UserService` for this component?",
    },
    {
      who: 'The compiler',
      says: 'So if I say the template is fine, does that mean its services are available too?',
    },
    {
      who: 'The injector',
      says: "Only if a provider was registered somewhere on my chain. Declarations and imports never touch me — that's the whole reason a component can render and then crash looking up a service.",
    },
    {
      who: 'The compiler',
      says: "And if a class was never declared or imported anywhere, you don't even get involved.",
    },
    {
      who: 'The injector',
      says: 'Right — you refuse it before the app is even built, so I never meet a component that should not exist.',
    },
  ];

  /**
   * Sample: the five original metadata buckets, plus `schemas` as the sixth —
   * the coverage-sweep addition.
   */
  protected readonly metadataSample = `@NgModule({
  declarations: [HomeComponent, HighlightDirective, MoneyPipe], // OWNED — built here, nowhere else
  imports: [CommonModule, FormsModule, RouterModule], // other modules whose exports you need
  exports: [HomeComponent], // re-opened for whoever imports THIS module
  providers: [UserService], // services registered on this module's injector
  bootstrap: [AppComponent], // the root component — AppModule only
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // relax template validation, narrowly
})
export class AppModule {}`;

  /** Line-by-line walkthrough of {@link metadataSample}. */
  protected readonly metadataNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The components, directives and pipes this module **owns**. Each one may be declared by exactly one module in the whole app — declaring the same class twice fails with `Type X is part of the declarations of 2 modules`.',
    },
    {
      line: 3,
      text: 'Other **modules** whose exported declarables or providers this module wants to borrow. Only modules belong here — a stray component or service in `imports` is a type error, not a warning.',
    },
    {
      line: 4,
      text: "The subset of this module's own declarations (or re-exported imported modules) that importers are allowed to use. Own it but don't export it, and it stays invisible to every other file.",
    },
    {
      line: 5,
      text: "Services registered on **this module's own injector**. On the root module that's effectively app-wide; on a lazy feature module it creates a second, separate instance from anything already provided at the root — the subject of the diagram further down this page.",
    },
    {
      line: 6,
      text: "The component Angular mounts to the page at startup. Only the true root module sets this — a feature module has nothing to bootstrap, because it's loaded into an app that is already running.",
    },
    {
      line: 7,
      text: "Relaxes the template compiler's own validation. `CUSTOM_ELEMENTS_SCHEMA` (shown here) whitelists any tag containing a dash, so a real web component doesn't trip 'unknown element'. Its sibling `NO_ERRORS_SCHEMA` is far riskier — see the comparison below.",
    },
  ];

  /**
   * Sample: `forRoot`/`forChild` as an ordinary static method, not magic
   * syntax — the coverage-sweep addition asking for the implementation next to
   * the usage.
   */
  protected readonly forRootSample = `@NgModule({ declarations: [], imports: [] })
export class FeatureModule {
  static forRoot(config: FeatureConfig): ModuleWithProviders<FeatureModule> {
    return {
      ngModule: FeatureModule,
      providers: [{ provide: FEATURE_CONFIG, useValue: config }],
    };
  }

  static forChild(): ModuleWithProviders<FeatureModule> {
    return { ngModule: FeatureModule, providers: [] };
  }
}`;

  /** Line-by-line walkthrough of {@link forRootSample}. */
  protected readonly forRootNotes: CodeNote[] = [
    {
      line: 3,
      text: "`forRoot` is not special syntax — it's an ordinary **static method** on the module class; you could name it anything. It takes whatever config the feature needs and returns a `ModuleWithProviders`, a small wrapper type pairing a module with an extra providers array.",
    },
    {
      line: 5,
      text: '`ngModule: FeatureModule` tells `imports: [FeatureModule.forRoot(cfg)]` which class is actually the imported module — the returned object is a wrapper, not the module itself.',
    },
    {
      line: 6,
      text: "Here's the entire trick: `forRoot` hands back a **fresh providers array** every time it runs. Import it once, and one array gets added to whichever injector owns that `imports` line. Call it — meaning import it — a second time from a second module, and a second, separate array gets added there too.",
    },
    {
      line: 11,
      text: "`forChild` returns the same module reference with an **empty** providers array. That's the whole difference: `forRoot` seeds the config once, `forChild` just registers the module's routes and declarations again without re-adding the providers.",
    },
  ];

  /** The self-test after `forRoot`/`forChild`. */
  protected readonly forRootQuiz: QuizOption[] = [
    {
      text: 'Nothing — Angular deduplicates identical providers automatically.',
      why: 'There is no deduplication step. `forRoot()` is a plain function call that returns a fresh array every time; nothing in Angular inspects that array for duplicates against anything registered elsewhere.',
    },
    {
      text: "The service in forRoot's providers array is created twice — once per module that called it.",
      correct: true,
      why: 'Exactly. Each call to `forRoot()` returns its own providers array, and each `imports: [...]` line adds whatever it receives to the injector that owns it. Two calls, two arrays, two instances — even though the config values inside them are identical.',
    },
    {
      text: "It throws a compile-time error: 'Provider already registered'.",
      why: 'Angular raises no such error, at compile time or otherwise. Duplicate providers are a silent runtime reality, not a caught mistake — which is precisely why it is worth memorising rather than trusting the tooling to catch it.',
    },
    {
      text: 'The second call is silently ignored, because forRoot can only run once.',
      why: "Nothing enforces 'once' — a static method runs exactly as many times as it is called, full stop. That is the entire reason the `CoreModule` import-once guard exists further down this page: without writing that check yourself, nothing stops a second call.",
    },
  ];

  /**
   * Sample: an app-wide singleton with the classic import-once guard —
   * `@Optional() @SkipSelf()` — the coverage-sweep addition.
   */
  protected readonly coreModuleSample = `@NgModule({ providers: [AuthService, NavService] })
export class CoreModule {
  constructor(@Optional() @SkipSelf() parent?: CoreModule) {
    if (parent) {
      throw new Error('CoreModule is already loaded. Import it in AppModule only.');
    }
  }
}`;

  /** Line-by-line walkthrough of {@link coreModuleSample}. */
  protected readonly coreModuleNotes: CodeNote[] = [
    {
      line: 3,
      text: 'Two parameter decorators doing different jobs. `@SkipSelf()` starts the lookup **one injector up**, so it can never resolve to the `CoreModule` instance under construction right now — only to one further up the tree. `@Optional()` means a lookup that finds nothing resolves to `null` instead of throwing `NullInjectorError`, which is what lets the FIRST, legitimate import succeed at all.',
    },
    {
      line: 4,
      text: 'If `parent` is anything but `null`, an ancestor injector already has a `CoreModule` — this is a **second** import somewhere below the first. The constructor throws immediately, at the exact spot the mistake was made, instead of quietly running two copies of every singleton.',
    },
  ];

  /**
   * Sample: a lazy feature module and the route that loads it — the
   * `loadChildren`/`forChild` pairing.
   */
  protected readonly lazySample = `// app.routes.ts
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
}

// admin.module.ts
@NgModule({
  declarations: [AdminDashboard],
  imports: [CommonModule, RouterModule.forChild(ADMIN_ROUTES)],
})
export class AdminModule {}`;

  /** Line-by-line walkthrough of {@link lazySample}. */
  protected readonly lazyNotes: CodeNote[] = [
    {
      line: 4,
      text: '`loadChildren` takes a function returning a **dynamic `import()`** — a promise for the module, not the module itself. The bundler recognises this exact shape and splits `admin.module.ts`, and everything only it needs, into its own chunk, downloaded only when someone actually navigates to `/admin`.',
    },
    {
      line: 10,
      text: '`RouterModule.forChild(ADMIN_ROUTES)` — **`forChild`, never `forRoot`**, in every feature module. `forRoot` sets up the router service itself; calling it a second time here would create a second router and break navigation app-wide.',
    },
    {
      line: 12,
      text: "No `bootstrap` bucket anywhere in this file. `AdminModule` is loaded on demand, into an app that's already running, so there is nothing here for it to bootstrap.",
    },
  ];

  /**
   * The self-test on the coverage sweep's top-priority correction: what
   * actually happens when a plain (standalone) component is declared.
   */
  protected readonly finalQuiz: QuizOption[] = [
    {
      text: 'It works — declarations accepts any component, standalone or not.',
      why: 'Pre-v19 tutorials show exactly this and it used to be true, because everything defaulted to `standalone: false` back then. In Angular 19+ the default flipped: a plain `@Component()` with no `standalone` flag IS standalone, and the compiler refuses to declare it.',
    },
    {
      text: 'It fails to compile unless the component explicitly sets standalone: false.',
      correct: true,
      why: 'Correct. `declarations` will only accept a component that has opted OUT of the new default — that single boolean is the entire gate. Miss it and you get `Component X is standalone, and cannot be declared in an NgModule`.',
    },
    {
      text: 'It compiles, but throws the first time the component renders.',
      why: 'This is a **compile-time** diagnostic from the template/module compiler, checked before the app ever runs — not a runtime surprise. Angular already knows the shape of every declarations array ahead of time; nothing here waits for a render to fail.',
    },
    {
      text: "It works, as long as you also add the component to the module's imports.",
      why: "Worse, not better — `declarations` and `imports` are mutually exclusive categories for the same class. `declarations` means 'this module OWNS it'; `imports` means 'borrowed from elsewhere'. A class cannot be both, and adding it to both is its own error.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If nobody writes NgModules anymore, why does the exam still test them?',
      a: 'Because roughly eight years of production Angular code — and every certification question written before full standalone adoption — is built entirely on them. The exam predates the ecosystem catching up, and most enterprise codebases have not fully migrated either. You need to read this fluently even though you will not write it.',
    },
    {
      q: 'Can I mix NgModules and standalone components in the same app?',
      a: "Yes, in both directions. `importProvidersFrom(SomeModule)` pulls an old module's providers into a standalone `bootstrapApplication` call, and a standalone component or directive can be dropped straight into an NgModule's `imports` array. The one direction that never works is a standalone component in `declarations` — that bucket is for module-owned, non-standalone classes only.",
    },
    {
      q: "Do I still need CommonModule if I'm never writing an NgModule?",
      a: "No. `CommonModule`'s directives — `NgIf`, `NgFor`, the built-in pipes — are themselves standalone now, each with its own selector, so a standalone component imports exactly the ones it uses. More often today you reach for the built-in `@if`/`@for` control flow instead, which needs no import at all.",
    },
    {
      q: "What's actually different between forRoot() and providedIn: 'root'?",
      a: "`forRoot()` is a manual discipline: it works correctly only if every developer remembers to call it exactly once, in the root module — nothing enforces that, which is why the `CoreModule` guard exists. `providedIn: 'root'` is a property Angular's own tree-shaker understands directly, on the service itself, with no module-level call to forget or duplicate.",
    },
    {
      q: 'Why does a declarable have to belong to exactly one module?',
      a: "Because that constraint is what makes the compiler's job well-defined. If a component could belong to two modules, the compiler would not know which module's own imports — its available directives and pipes — to resolve the component's template against. One owner keeps that lookup unambiguous.",
    },
  ];
}
