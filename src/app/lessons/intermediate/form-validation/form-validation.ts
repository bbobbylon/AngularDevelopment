import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
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

@Component({
  selector: 'app-lesson-form-validation',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Forms</span>
      <h1>Form Validation</h1>
      <p class="lead">
        Angular ships built-in validators and lets you write your own — including
        cross-field validators. Each control exposes an <code>errors</code> object
        you use to show messages.
      </p>

      <h2>Built-in validators</h2>
      <div class="code">
        <pre>Validators.required
Validators.minLength(2) / maxLength(20)
Validators.min(0) / max(100)
Validators.email
Validators.pattern(/^[a-z]+$/)
Validators.requiredTrue   // for "accept terms" checkboxes</pre>
      </div>

      <h2>Custom validator (a function returning errors or null)</h2>
      <div class="code">
        <pre>function hasDigit(): ValidatorFn {{ '{' }}
  return (c: AbstractControl): ValidationErrors | null =&gt;
    /\\d/.test(c.value ?? '') ? null : {{ '{' }} hasDigit: true {{ '}' }};
{{ '}' }}</pre>
      </div>

      <h2>Cross-field validator (placed on the group)</h2>
      <div class="code">
        <pre>this.fb.group({{ '{' }} password: [''], confirm: [''] {{ '}' }},
  {{ '{' }} validators: passwordsMatch {{ '}' }});   // group-level</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <form [formGroup]="form">
          <div class="field">
            <label>Username (required, must contain a digit)</label>
            <input formControlName="username" />
            @if (ctrl('username').touched && ctrl('username').invalid) {
              <small class="err">
                @if (ctrl('username').errors?.['required']) { Required. }
                @if (ctrl('username').errors?.['hasDigit']) { Must contain a digit. }
              </small>
            }
          </div>
          <div class="field">
            <label>Password (min 6)</label>
            <input type="password" formControlName="password" />
          </div>
          <div class="field">
            <label>Confirm password</label>
            <input type="password" formControlName="confirm" />
            @if (form.errors?.['mismatch'] && ctrl('confirm').touched) {
              <small class="err">Passwords do not match.</small>
            }
          </div>
          <p class="row">
            <span class="pill">form valid: {{ form.valid }}</span>
          </p>
        </form>
      </div>

      <h2>Showing errors at the right time</h2>
      <p>
        Only show errors once a control is <code>touched</code> or <code>dirty</code>,
        so users are not yelled at before they type. Read errors with
        <code>control.errors?.['errorKey']</code>.
      </p>

      <h2>Controlling when validation runs</h2>
      <div class="code">
        <pre>// validate on blur/submit instead of every keystroke:
new FormControl('', {{ '{' }} validators: [Validators.required], updateOn: 'blur' {{ '}' }});

// react to validity changes:
this.form.statusChanges.subscribe(s =&gt; ...);   // 'VALID' | 'INVALID' | 'PENDING'…

// set/clear errors imperatively (e.g. from a server response):
ctrl.setErrors({{ '{' }} taken: true {{ '}' }});
ctrl.updateValueAndValidity();</pre>
      </div>
      <p>
        <code>Validators.compose([...])</code> merges several validators into one;
        a validator returns an <strong>error object</strong> (merged across all
        validators) or <code>null</code> when valid.
      </p>

      <div class="tip">
        Control states drive CSS classes too: <code>ng-valid</code>,
        <code>ng-invalid</code>, <code>ng-touched</code>, <code>ng-dirty</code>,
        <code>ng-pending</code> — handy for styling without extra logic.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Compose built-in validators in the control's validator array.</li>
        <li>A custom validator is <code>(control) =&gt; ValidationErrors | null</code>.</li>
        <li>Cross-field validators go on the <code>FormGroup</code>, not a single control.</li>
        <li>Gate error messages on <code>touched</code>/<code>dirty</code>; read via <code>errors</code>.</li>
      </ul>

      <p><a routerLink="/async-validators">Next: Async Validators →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
     .err { color: var(--accent); font-size: 0.8rem; }`,
  ],
})
export class FormValidation {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group(
    {
      username: ['', [Validators.required, hasDigit()]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: [''],
    },
    { validators: passwordsMatch },
  );

  protected ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }
}
