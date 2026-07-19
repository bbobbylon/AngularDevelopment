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

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Cross-field validator on a control.</strong> It belongs on the
          <code>FormGroup</code> — a single control can't see its siblings. Read the error from
          <code>form.errors</code>, not the control's.</li>
        <li><strong>Showing errors immediately.</strong> Gate on <code>touched</code>/<code>dirty</code>
          so users aren't warned before typing.</li>
        <li><strong>Reading a missing error key.</strong> <code>errors</code> is <code>null</code>
          when valid — use <code>errors?.['required']</code>, never <code>errors['required']</code>.</li>
        <li><strong>setErrors clobbers other errors.</strong> <code>setErrors</code> replaces the
          whole object; merge if you must keep existing keys, and call
          <code>updateValueAndValidity()</code> after imperative changes.</li>
        <li><strong>A validator with side effects.</strong> Validators must be pure and
          synchronous (async ones are a separate slot) — no HTTP, no state mutation.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Where does a "passwords match" validator go?</summary>
        <div>On the <code>FormGroup</code> (its <code>validators</code> option), because it needs
        both sibling controls. Read the result from <code>form.errors</code>.</div>
      </details>
      <details class="qa">
        <summary>What does a validator return?</summary>
        <div><code>null</code> when valid, or a <code>ValidationErrors</code> object
        (<code>&#123; keyName: true &#125;</code>) when invalid. Keys from multiple validators
        merge.</div>
      </details>
      <details class="qa">
        <summary>How do you set an error from a server response?</summary>
        <div><code>control.setErrors(&#123; taken: true &#125;)</code> — then optionally
        <code>updateValueAndValidity()</code>. It stays until the control revalidates.</div>
      </details>

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
    `
      .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
      .err { color: var(--accent); font-size: 0.8rem; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
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
