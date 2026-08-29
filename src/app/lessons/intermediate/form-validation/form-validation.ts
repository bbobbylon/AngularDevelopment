import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

/** Custom validator: value must contain a digit. */
function hasDigit(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /\d/.test(control.value ?? '') ? null : { hasDigit: true };
}

/** Cross-field validator: password === confirm. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw === confirm ? null : { mismatch: true };
}

/**
 * Lesson: Form Validation — built-in validators, custom ones, and when they run.
 *
 * Covers the `Validators` set, writing a `ValidatorFn`, group-level validators,
 * reading `errors` to drive messages, and the `touched` / `dirty` / `pristine`
 * flags that decide *when* to show them.
 *
 * The demo the lesson hangs on is `updateOn`. By default a control revalidates
 * on every keystroke, so an email field screams "invalid" from the first
 * character — technically correct and thoroughly unhelpful. Two identical fields
 * run side by side, one default and one `updateOn: 'blur'`, so the difference is
 * in the interaction rather than in the description.
 */
@Component({
  selector: 'app-lesson-form-validation',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './form-validation.html',
  styleUrl: './form-validation.css',
})
export class FormValidation {
  /**
   * Builds the form models.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * The demo form: built-in and custom validators, plus a group-level check.
   */
  protected readonly form = this.fb.group(
    {
      username: ['', [Validators.required, hasDigit()]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: [''],
    },
    { validators: passwordsMatch },
  );

  /**
   * A control by name. The non-null assertion is safe because every name used
   * comes from the form defined just above.
   *
   * @param name Control name.
   */
  protected ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  /**
   * A field validating on every keystroke — the default.
   */
  protected readonly liveField = new FormControl('x', { validators: [Validators.required] });
  /**
   * The same field validating on blur. The comparison is the demo.
   */
  protected readonly blurField = new FormControl('x', {
    validators: [Validators.required],
    updateOn: 'blur',
  });
}
