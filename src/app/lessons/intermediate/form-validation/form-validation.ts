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

      <h2>updateOn: 'change' vs 'blur'</h2>
      <div class="demo">
        <p class="demo__title">Live — clear a box, then look at its status before clicking away</p>
        <div class="field">
          <label>Live validation (<code>updateOn: 'change'</code>, the default)</label>
          <input [formControl]="liveField" />
          <small class="pill">status: {{ liveField.status }}</small>
        </div>
        <div class="field">
          <label>Deferred validation (<code>updateOn: 'blur'</code>)</label>
          <input [formControl]="blurField" />
          <small class="pill">status: {{ blurField.status }}</small>
        </div>
      </div>
      <p style="color:var(--text-muted);font-size:.85rem">
        Clear the first box and its status flips to <code>INVALID</code> immediately, on every
        keystroke. Clear the second box — the status stays <code>VALID</code> (stale) until you
        tab or click away, because with <code>updateOn: 'blur'</code> the control only reruns
        validation on the <code>blur</code> DOM event, not on every <code>input</code> event.
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

      <h2>Under the hood</h2>
      <ul>
        <li><strong>A validator is just a function <code>(control) =&gt; ValidationErrors | null</code>.</strong>
          <code>Validators.required</code> and friends are all plain functions matching
          <code>ValidatorFn</code>; the custom <code>hasDigit()</code> above isn't special syntax —
          it's the exact same signature, which is why validators compose so easily.</li>
        <li><strong><code>valueChanges</code> and <code>statusChanges</code> are Observables</strong>,
          not bespoke Angular machinery — every <code>AbstractControl</code> exposes them as
          RxJS streams. The reactive-forms directives (<code>formControlName</code>,
          <code>formGroup</code>, …) are themselves just subscribers wired up for you at bind
          time.</li>
        <li><strong>Sync validators run first, every time; async validators only run once every
          sync validator returns <code>null</code>.</strong> Each control keeps two separate
          validator queues internally. <code>updateValueAndValidity()</code> runs the synchronous
          queue immediately, and only if the control comes out <code>VALID</code> from that pass
          does it kick off the async queue, flipping status to <code>PENDING</code> until every
          async validator resolves.</li>
        <li><strong><code>updateOn</code> decides which DOM event triggers that
          <code>updateValueAndValidity()</code> call</strong> — <code>'change'</code> (default)
          hooks the <code>input</code> event, <code>'blur'</code> hooks <code>blur</code>,
          <code>'submit'</code> waits for the form's submit event. It changes <em>when</em>
          validators run, never <em>what</em> they check.</li>
        <li><strong><code>setErrors()</code> bypasses the validator pipeline entirely.</strong> It
          writes directly to <code>control.errors</code>, which is why it clobbers the whole
          object instead of merging — the next <code>updateValueAndValidity()</code> call (from a
          value change, a blur, …) throws that away and rebuilds <code>errors</code> from the
          validator functions again.</li>
      </ul>

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
