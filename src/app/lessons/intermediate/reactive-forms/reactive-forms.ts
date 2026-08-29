import { JsonPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Cross-field validator: it needs to read TWO sibling controls at once, so it
 * has to be attached to the FormGroup that contains them — a validator on a
 * single child control can never see its siblings. See "Custom & cross-field
 * validators" below for the line-by-line walkthrough.
 */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pass && confirm && pass !== confirm ? { passwordsMismatch: true } : null;
}

/**
 * Async validator factory: simulates a server round-trip that checks whether
 * a username is already taken. Must return an Observable/Promise that emits
 * AND completes exactly once — see "Async validators & the PENDING status".
 */
function usernameTaken(taken: string[]): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(600).pipe(
      map(() =>
        taken.includes(String(control.value ?? '').toLowerCase())
          ? { usernameTaken: true }
          : null,
      ),
    );
}

/**
 * Lesson: Reactive Forms — the form model that lives in the class.
 *
 * Covers `FormBuilder`, `FormGroup` / `FormControl` / `FormArray`, typed forms,
 * `value` against `getRawValue()`, cross-field validators, async validators, and
 * bridging the form's observables into signals with `toSignal`.
 *
 * The framing against template-driven forms: there the template *is* the model,
 * which is quick for a login box and painful the moment validation gets
 * conditional, fields get added at runtime, or anything needs a unit test
 * without a fixture. Reactive forms put the model in TypeScript, where it can be
 * inspected, composed and tested.
 *
 * Four demos build up in difficulty: a basic typed group, a cross-field password
 * match (which has to be attached to the *group*, since it reads siblings), an
 * async availability check with its `PENDING` state, and a `FormArray` of skills.
 *
 * @see intermediate/form-validation — validators in depth.
 * @see intermediate/form-arrays — dynamic arrays in depth.
 * @see intermediate/async-validators — the async path in depth.
 */
@Component({
  selector: 'app-lesson-reactive-forms',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe],
  templateUrl: './reactive-forms.html',
  styleUrl: './reactive-forms.css',
})
export class ReactiveForms {
  /**
   * Builds the form models. `FormBuilder` over `new FormGroup(...)` purely for
   * brevity — the result is identical.
   */
  private readonly fb = inject(FormBuilder);
  /**
   * The last submitted value, shown as JSON.
   */
  protected readonly saved = signal<unknown>(null);

  /**
   * The basic demo's form: three typed controls with synchronous validators.
   */
  protected readonly form = this.fb.group({
    name: ['Ada', [Validators.required, Validators.minLength(2)]],
    email: ['ada@example.com', [Validators.required, Validators.email]],
    age: [36, [Validators.min(0), Validators.max(120)]],
  });

  /** Bridges form.valueChanges/statusChanges into signals — same data, signal-shaped reads. */
  protected readonly liveValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  /**
   * The form's status as a signal — `VALID`, `INVALID`, `PENDING` or `DISABLED`.
   */
  protected readonly liveStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  /**
   * Length of the name field, derived from the live value.
   */
  protected readonly nameChars = computed(() => (this.liveValue().name ?? '').length);
  /**
   * A human-readable readiness line.
   *
   * Handles `PENDING` explicitly rather than lumping it in with invalid: a form
   * waiting on an async check is not yet known to be wrong, and telling the user
   * it "needs fixes" while it is still checking is the classic mistake.
   */
  protected readonly readiness = computed(() =>
    this.liveStatus() === 'VALID'
      ? 'Ready to submit'
      : this.liveStatus() === 'PENDING'
        ? 'Checking…'
        : 'Needs fixes',
  );

  /**
   * Submits, if valid. The guard is here rather than only on the button because a
   * form can be submitted by pressing Enter.
   */
  protected save() {
    if (this.form.valid) {
      this.saved.set(this.form.value);
    }
  }

  /**
   * Patches one field, to show `patchValue` updating part of the model —
   * `setValue` would require every field.
   */
  protected patch() {
    this.form.patchValue({ name: 'Grace' });
  }

  /** Cross-field validator demo: a group-level check, not a per-control one. */
  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  /**
   * The password form's status as a signal.
   */
  protected readonly passwordStatus = toSignal(this.passwordForm.statusChanges, {
    initialValue: this.passwordForm.status,
  });
  /**
   * Whether the two passwords disagree.
   *
   * Reads {@link passwordStatus} first purely to establish the reactive
   * dependency: `hasError` is a plain method call on the form object, which a
   * `computed` cannot track. Touching the status signal is what makes this
   * recompute when validity changes.
   */
  protected readonly passwordsMismatch = computed(() => {
    this.passwordStatus(); // establish the dependency: recompute on every status change
    return this.passwordForm.hasError('passwordsMismatch');
  });

  /** Async validator demo: PENDING while the (simulated) availability check runs. */
  protected readonly username = this.fb.control('ada', {
    validators: [Validators.required, Validators.minLength(3)],
    asyncValidators: [usernameTaken(['ada', 'admin', 'root'])],
  });
  /**
   * The username control's status as a signal.
   */
  protected readonly usernameStatus = toSignal(this.username.statusChanges, {
    initialValue: this.username.status,
  });
  /**
   * The message under the username field — checking, taken, or available.
   */
  protected readonly usernameMessage = computed(() => {
    const status = this.usernameStatus();
    if (status === 'PENDING') return 'Checking availability…';
    if (status === 'INVALID') {
      return this.username.hasError('usernameTaken')
        ? 'Username taken'
        : 'Enter at least 3 characters';
    }
    return 'Available ✅';
  });

  /** FormArray demo: a growable, indexed list of same-shaped controls. */
  protected readonly skills = this.fb.array([this.fb.control('Angular', Validators.required)]);
  /**
   * A group wrapping the skills array, because `formArrayName` in the template
   * needs a parent `formGroup` to resolve against.
   */
  protected readonly skillsForm = this.fb.group({ skills: this.skills });
  /**
   * The skills array's live value.
   */
  protected readonly skillsValue = toSignal(this.skillsForm.valueChanges, {
    initialValue: this.skillsForm.getRawValue(),
  });
  /**
   * How many skills there are.
   */
  protected readonly skillCount = computed(() => this.skillsValue().skills?.length ?? 0);

  /**
   * Appends an empty skill control.
   */
  protected addSkill() {
    this.skills.push(this.fb.control('', Validators.required));
  }

  /**
   * Removes a skill by index.
   *
   * @param i Position to drop.
   */
  protected removeSkill(i: number) {
    this.skills.removeAt(i);
  }

  /**
   * Sample: defining a typed form with `FormBuilder`.
   */
  readonly modelSample = `private fb = inject(FormBuilder);

form = this.fb.group({
  name: ['Ada', [Validators.required, Validators.minLength(2)]],
  email: ['ada@example.com', [Validators.required, Validators.email]],
  age: [36, [Validators.min(0), Validators.max(120)]],
});`;

  /**
   * Sample: the template side — `[formGroup]`, `formControlName`, `ngSubmit`.
   */
  readonly templateSample = `<form [formGroup]="form" (ngSubmit)="save()">
  <input formControlName="name" />
  <input formControlName="email" />
  <input type="number" formControlName="age" />
  <button type="submit" [disabled]="form.invalid">Save</button>
</form>`;

  /**
   * Sample: reading and writing — `value` against `getRawValue()` (disabled
   * controls are omitted from the first), and `setValue` against `patchValue`.
   */
  readonly readWriteSample = `this.form.value;                          // typed, optional fields, disabled controls OMITTED
this.form.getRawValue();                  // same shape but COMPLETE — includes disabled controls
this.form.controls.name.value;            // read one control directly (typed: string | null)
this.form.get('email')?.errors;           // ValidationErrors | null for a single control
this.form.patchValue({ name: 'Grace' });  // update SOME fields — untouched fields keep their value
this.form.setValue({ name: 'Grace', email: 'g@x.com', age: 40 }); // update ALL fields — throws if any key is missing
this.form.valueChanges.subscribe((v) => console.log(v));   // Observable<value> — fires on every edit
this.form.statusChanges.subscribe((s) => console.log(s));  // Observable<'VALID'|'INVALID'|'PENDING'|'DISABLED'>`;

  /**
   * Sample: a cross-field validator, and why it attaches to the group.
   */
  readonly crossFieldValidatorSample = `// A cross-field validator reads MULTIPLE sibling controls, so it has to be
// attached to the GROUP that contains them — not to a single child control.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pass && confirm && pass !== confirm ? { passwordsMismatch: true } : null;
}

passwordForm = this.fb.nonNullable.group(
  {
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  },
  { validators: passwordsMatch },  // 2nd arg to group() = GROUP-level options
);`;

  /**
   * Sample: an async validator, including the requirement that it emit **and
   * complete** — a stream that never completes leaves the control `PENDING`
   * forever.
   */
  readonly asyncValidatorSample = `// AsyncValidatorFn returns an Observable (or Promise) of ValidationErrors | null.
// It must emit AND complete exactly once per run — a never-completing stream
// leaves the control stuck in PENDING forever.
function usernameTaken(taken: string[]): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(600).pipe(                      // simulate network latency
      map(() =>
        taken.includes(String(control.value ?? '').toLowerCase())
          ? { usernameTaken: true }
          : null,
      ),
    );
}

username = this.fb.control('ada', {
  validators: [Validators.required, Validators.minLength(3)],  // sync — run FIRST
  asyncValidators: [usernameTaken(['ada', 'admin', 'root'])],   // async — only if sync passes
});`;

  /**
   * Sample: the class side of a `FormArray`.
   */
  readonly formArrayClassSample = `// class
skills = this.fb.array([this.fb.control('Angular', Validators.required)]);
skillsForm = this.fb.group({ skills: this.skills });

addSkill() {
  this.skills.push(this.fb.control('', Validators.required));
}

removeSkill(i: number) {
  this.skills.removeAt(i);
}`;

  /**
   * Sample: the template side of a `FormArray`, with `formArrayName` and the
   * indexed `formControlName`.
   */
  readonly formArrayTemplateSample = `<!-- template -->
<div [formGroup]="skillsForm">
  <div formArrayName="skills">
    @for (ctrl of skills.controls; track $index; let i = $index) {
      <input [formControlName]="i" />
      <button type="button" (click)="removeSkill(i)">Remove</button>
    }
  </div>
</div>`;

  /**
   * Sample: the control tree — every node an `AbstractControl`, which is why the
   * same API works at every level.
   */
  readonly underTheHoodSample = `FormGroup "form"                         ← every node is an AbstractControl
 ├─ FormControl "name"
 ├─ FormControl "email"
 └─ FormControl "age"

each AbstractControl carries:
  value           current value
  status          'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'
  errors          ValidationErrors | null   (from its OWN validators only)
  valueChanges$   Observable — next() on every value write
  statusChanges$  Observable — next() on every status transition

on setValue / patchValue / a user keystroke via the ControlValueAccessor:
  1. control.value = newValue
  2. control.updateValueAndValidity()
       → runs this control's synchronous validators first  → status = VALID or INVALID
       → if (and only if) sync validators passed, runs async validators
         → status = PENDING while they're in flight, then VALID/INVALID on resolve
       → emits on valueChanges$ and statusChanges$
       → by default ALSO calls parent.updateValueAndValidity()
         so a child edit can flip the PARENT's status too — this is how the
         group-level passwordsMatch validator re-runs on every keystroke in
         EITHER password field
  3. FormControlName / FormGroupDirective subscribe to valueChanges$ /
     statusChanges$ themselves, and that subscription calls
     ChangeDetectorRef.markForCheck() on the host view — the real reason
     reactive forms "just work" under OnPush / zoneless with zero manual
     signal or subscription wiring from you`;
}
