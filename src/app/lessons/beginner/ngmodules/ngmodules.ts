import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './ngmodules.html',
  styleUrl: './ngmodules.css',
})
export class Ngmodules {
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
    return 'No — SharedModule declares ButtonComponent but never exports it, so importers still can\'t see it even though they imported the module.';
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
