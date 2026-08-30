import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Lesson: template-driven forms — ngModel/ngForm build the form model FOR you
 * from the template. This page shows the live control-registration mechanics,
 * how the framework tracks validity/touched/dirty as CSS classes, how a plain
 * WritableSignal can sit inside a two-way ngModel binding, and exactly what
 * ControlValueAccessor is doing under the hood so none of it feels like magic.
 */
@Component({
  selector: 'app-lesson-template-forms',
  imports: [RouterLink, FormsModule, JsonPipe],
  templateUrl: './template-forms.html',
  styleUrl: './template-forms.css',
})
export class TemplateForms {
  /**
   * The last submitted form value, shown as JSON.
   */
  protected readonly submitted = signal<unknown>(null);

  /**
   * Records a submission.
   *
   * @param value The form's value, assembled by `ngForm` from the `name`
   *              attributes of its controls.
   */
  protected submit(value: unknown) {
    this.submitted.set(value);
  }

  // Live demo: a WritableSignal driving a two-way ngModel binding, with two
  // computed() signals derived from it — see "Live demo — a signal living
  // inside a two-way ngModel binding" above.
  /**
   * The username in the signal-based alternative demo.
   */
  protected readonly username = signal('');
  /**
   * Its length, derived.
   */
  protected readonly usernameLength = computed(() => this.username().length);
  /**
   * A strength verdict, derived.
   *
   * The contrast the lesson draws: this is the same validation a template-driven
   * form would express through directives and `#ref="ngModel"`, written as plain
   * reactive state instead — testable without a fixture, and readable without
   * knowing what `ngModel` exports.
   */
  protected readonly usernameStrength = computed(() => {
    const len = this.usernameLength();
    if (len === 0) return 'empty';
    if (len < 4) return 'weak';
    if (len < 8) return 'ok';
    return 'strong';
  });

  /**
   * Sample: the `FormsModule` import that template-driven forms require.
   */
  readonly setupSample = `import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-form',
  imports: [FormsModule],   // standalone component opts in here
  template: \`...\`,
})
export class SignupForm {}`;

  /**
   * Sample: the anatomy of a template-driven form — `#f="ngForm"`, `ngSubmit`, the
   * `name` attribute, and validation state.
   */
  readonly anatomySample = `<!-- #f="ngForm" exports the NgForm DIRECTIVE instance (not the DOM element)
     into a local variable. That is what gives you f.value, f.valid, f.reset(). -->
<!-- f.value is an object built from the name attributes below. -->
<form #f="ngForm" (ngSubmit)="submit(f.value)">
  <!-- Four things are happening on the input below, and no comment can sit
       between them — that would be inside the tag, which HTML forbids:
         name="name"       REQUIRED. It is the key this control gets in
                           f.value, and without it ngModel throws. The #1
                           template-forms mistake.
         ngModel           Bare, no brackets, no value: registers the control
                           with the form without binding a component field.
         required /        Plain HTML validation attributes. Angular's
         minlength="2"     directives pick these up as real validators.
         #name="ngModel"   A SECOND export, this time of the NgModel directive
                           for THIS control — what makes name.invalid and
                           name.errors work in the block below. -->
  <input
    name="name"
    ngModel
    required
    minlength="2"
    #name="ngModel"
  />
  <!-- && name.touched is what stops every field screaming "required" before
       the user has typed anything. Validity alone is not enough. -->
  @if (name.invalid && name.touched) {
    <!-- errors is null when valid, so ?. avoids a read on null. The keys are
         whatever the failing validators returned. -->
    @if (name.errors?.['required']) { Name is required. }
    <!-- Bracket notation, not .minlength — errors is a plain index-signature
         object, so dot access does not type-check. -->
    @if (name.errors?.['minlength']) { At least 2 characters. }
  }
</form>`;

  /**
   * Sample: the three `ngModel` forms — one-way into the form model, two-way to a
   * field, and standalone outside a `<form>`.
   */
  readonly variationsSample = `<input name="q" ngModel />                  // one-way into the form model
<input name="q" [(ngModel)]="query" />      // two-way to a component field
<input ngModel #x="ngModel" />              // standalone — no parent <form>

<div ngModelGroup="address">                // nest controls into a sub-group
  <input name="city" ngModel />            // -> form.value.address.city
</div>`;

  /**
   * Sample: the same form expressed with signals and `computed`.
   */
  readonly signalFormSample = `protected readonly username = signal('');

readonly usernameLength = computed(() => this.username().length);
readonly usernameStrength = computed(() => {
  const len = this.usernameLength();
  if (len === 0) return 'empty';
  if (len < 4) return 'weak';
  if (len < 8) return 'ok';
  return 'strong';
});

// template — bind the BARE signal, no call parentheses:
// <input name="uname" [(ngModel)]="username" />
// desugars to:
// [ngModel]="username()" (ngModelChange)="username.set($event)"`;

  /**
   * Sample: under the hood — `ControlValueAccessor` as the DOM-to-model bridge,
   * and how `ngForm` assembles a value from named controls.
   */
  readonly underTheHoodSample = `// 1) The DOM <-> model bridge: ControlValueAccessor
interface ControlValueAccessor {
  writeValue(value: any): void;                 // model -> DOM
  registerOnChange(fn: (value: any) => void): void; // DOM -> model
  registerOnTouched(fn: () => void): void;       // DOM blur -> "touched"
}
// <input> gets Angular's built-in DefaultValueAccessor for free.

// 2) Registration is deferred to a microtask (NgModel#ngOnChanges, simplified)
ngOnChanges() {
  if (this._isFirstChange) {
    Promise.resolve().then(() => {
      this.formDirective.addControl(this); // avoids "changed after checked"
    });
  }
}

// 3) Validators compose into one function
const validator = Validators.compose([
  requiredValidator,
  minLengthValidator,
]);
control.setValidators(validator);
// -> control.errors, control.valid, control.statusChanges all derive from this`;
}
