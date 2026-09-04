import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Faq,
  type FaqItem,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * Lesson: NgModules Explained — what they were for, and why standalone replaced
 * them.
 *
 * A history lesson with a practical purpose. Standalone components are the
 * default now and nothing here is what you should write in a new app, but
 * `NgModule` is in every codebase older than Angular 15, in most of the tutorials
 * still online, and in the certification exam.
 *
 * The page covers `declarations` / `imports` / `exports` / `providers`, and is
 * built around a visibility toggle: a component is invisible unless the owning
 * module **exports** it *and* the consuming module **imports** that module. Two
 * switches, four combinations, one of which works — and that two-sided rule is
 * both the thing people got wrong and the thing standalone components removed.
 */
@Component({
  selector: 'app-lesson-ngmodules',
  imports: [RouterLink, Faq, Predict, Quiz, Remember],
  templateUrl: './ngmodules.html',
  styleUrl: './ngmodules.css',
})
export class Ngmodules {
  /**
   * The duplicated-singleton puzzle used by the ask-before-telling block.
   *
   * Every lazy-loaded module gets its own injector, so a service listed in a
   * module's `providers` is instantiated once per injector that sees that
   * module. Nothing errors — the app just quietly runs two copies of a service
   * everyone believes is a singleton. This is the bug the `@Optional()
   * @SkipSelf()` guard constructor was invented for, and it is the single best
   * argument for `providedIn: 'root'`.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}` and `@`, both of which Angular's template parser claims for itself.
   */
  protected readonly duplicateSingletonSample = `// core.module.ts
@NgModule({
  providers: [AuthService],        // registered on THIS module's injector
})
export class CoreModule {}

// app.module.ts — the intended, once-only import
@NgModule({ imports: [BrowserModule, CoreModule] })
export class AppModule {}

// admin.module.ts — lazy-loaded, and someone added CoreModule here too
// because AdminDashboard needed AuthService and this "made the error go away".
@NgModule({
  declarations: [AdminDashboard],
  imports: [CommonModule, CoreModule],   // <-- the line in question
})
export class AdminModule {}

// The user logs in on the home page, then navigates to /admin.`;

  /**
   * The self-test, on the non-transitivity of `imports`. Every wrong answer is a
   * reasonable guess about how module visibility "should" propagate, and the
   * whole point of the module system is that it does not.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'No. `imports` is not transitive — `SharedModule` has to re-export `FormsModule` before importers of `SharedModule` can use `ngModel`.',
      correct: true,
      why: 'Right. Importing a module gives you only what that module *exports*, never what it imports for its own private use. Re-exporting is deliberate: `exports: [FormsModule]` is `SharedModule` saying “and anyone who imports me gets this too”.',
    },
    {
      text: 'Yes. Module imports chain, so anything `SharedModule` can use, its importers can use.',
      why: 'This is the single most common mental-model error with NgModules, and it is the reason “`ngModel` is not a known property of input” shows up so often. Visibility stops at the module boundary unless the module explicitly re-exports.',
    },
    {
      text: 'Yes, but only if `SharedModule` also declares at least one component that uses `ngModel`.',
      why: 'What a module declares has no effect on what its importers can see. Only the `exports` array does, and declarations and exports are answered independently.',
    },
    {
      text: 'Only in development. The production build inlines the whole scope, so it works after `ng build`.',
      why: 'Compilation scope is resolved at compile time in both modes — if anything, a production build is stricter. A template that fails in `ng serve` fails in `ng build` too.',
    },
  ];

  /**
   * The conversational Q&A. These are the questions a learner meeting a legacy
   * codebase actually asks, which are not the questions the migration guide
   * answers.
   */
  protected readonly questions: readonly FaqItem[] = [
    {
      q: 'Are NgModules deprecated? Should I bother learning this?',
      a: 'Not deprecated, just no longer the default. They still work, they still ship in Angular, and they are still how the DI hierarchy is described in the docs. Learn them for two concrete reasons: the certification exam tests them, and any codebase started before Angular 15 is full of them. You will read far more NgModule code than you write.',
    },
    {
      q: 'What actually breaks if I put a component in two modules?',
      a: 'The compiler refuses to build: "Type X is part of the declarations of 2 modules." It is not a style rule — a declarable has exactly one owning module because that is what defines its compilation scope. Fix it by declaring it once, exporting it there, and importing that module in the second place.',
    },
    {
      q: 'Why does `*ngIf` work in AppModule but not in my feature module?',
      a: 'Because `BrowserModule` re-exports `CommonModule`, and only the root module imports `BrowserModule`. Feature modules import `CommonModule` directly. Importing `BrowserModule` a second time throws at startup, so `CommonModule` is genuinely the answer, not a workaround.',
    },
    {
      q: 'Can I mix standalone components and NgModules in one app?',
      a: 'Yes, and that is exactly how a migration works. A standalone component can go straight into an NgModule `imports` array, and an NgModule can be pulled into a standalone app with `importProvidersFrom(SomeModule)`. What you cannot do is put a *declared* (non-standalone) component into a standalone component `imports` array — wrap it in a module and import that.',
    },
    {
      q: 'If I am starting a new app, is there any reason to write an NgModule?',
      a: 'Realistically, no. Use standalone plus `provideX()` functions. The one place you still touch module syntax is consuming a third-party library that only ships an NgModule — and then you import it and move on.',
    },
  ];

  /**
   * Which style the comparison is showing.
   */
  protected readonly mode = signal<'ngmodule' | 'standalone'>('ngmodule');

  /**
   * The code for the selected style.
   */
  protected readonly sample = computed(() =>
    this.mode() === 'ngmodule'
      ? `// greeting.component.ts — declared, can't stand alone
@Component({ selector: 'app-greeting', template: '<h2>Hi</h2>' })
export class GreetingComponent {}

// greeting.module.ts — must be wrapped in a module
@NgModule({
  declarations: [GreetingComponent],
  imports: [CommonModule],
  exports: [GreetingComponent],   // so other modules can use it
})
export class GreetingModule {}`
      : `// greeting.ts — self-contained, no module needed
@Component({
  selector: 'app-greeting',
  standalone: true,            // (the default in Angular 19+)
  imports: [CommonModule],     // declares its OWN dependencies
  template: '<h2>Hi</h2>',
})
export class Greeting {}
// just import Greeting directly wherever you use it`,
  );

  /**
   * The prose explanation for the selected style.
   */
  protected readonly explanation = computed(() =>
    this.mode() === 'ngmodule'
      ? 'The NgModule way: a component is inert until a module declares it, and other modules can only use it if the owning module exports it. More files, more indirection.'
      : 'The standalone way: the component carries its own dependencies in imports and is used by importing the class directly. No declarations bucket, no wrapper module.',
  );

  /**
   * Whether `SharedModule` exports the button.
   */
  protected readonly exported = signal(true);
  /**
   * Whether `FeatureModule` imports `SharedModule`.
   */
  protected readonly imported = signal(true);
  /**
   * Whether the button is usable — true only when **both** switches are on.
   */
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

  /**
   * Flips the export switch.
   */
  protected toggleExported() {
    this.exported.set(!this.exported());
  }

  /**
   * Flips the import switch.
   */
  protected toggleImported() {
    this.imported.set(!this.imported());
  }
}
