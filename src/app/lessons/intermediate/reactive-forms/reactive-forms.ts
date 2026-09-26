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
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';

/**
 * Cross-field validator: it needs to read TWO sibling controls at once, so it
 * has to be attached to the FormGroup that contains them — a validator on a
 * single child control can never see its siblings. See "Two fields need to
 * agree" below for the line-by-line walkthrough.
 */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pass && confirm && pass !== confirm ? { passwordsMismatch: true } : null;
}

/**
 * Async validator factory: simulates a server round-trip that checks whether
 * a username is already taken. Must return an Observable/Promise that emits
 * AND completes exactly once — see "Talking to a server" below.
 */
function usernameTaken(taken: string[]): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(600).pipe(
      map(() =>
        taken.includes(String(control.value ?? '').toLowerCase()) ? { usernameTaken: true } : null,
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
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), following the teaching order recorded on
 * `expert/change-detection`: pose the problem before naming it (can a single
 * child control ever see its sibling?), then an analogy that carries the
 * mechanism — a `FormGroup` as a filing cabinet of named folders, each an
 * independent `FormControl` — before any API vocabulary appears, then the same
 * idea in more than one mode (a dialogue between a folder and the cabinet about
 * `updateValueAndValidity()`, a hand-drawn cabinet diagram, annotated code for
 * every API surface, and the four live demos this lesson already had). The
 * cabinet/folder/snapshot language is also used by `intermediate/form-arrays`,
 * which contrasts a `FormArray`'s numbered slots against it — read this lesson
 * first.
 *
 * Four demos build up in difficulty: a basic typed group, a cross-field password
 * match (which has to be attached to the *group*, since it reads siblings), an
 * async availability check with its `PENDING` state, and a `FormArray` of skills.
 *
 * @see intermediate/form-validation — validators in depth.
 * @see intermediate/form-arrays — dynamic arrays in depth, and the same analogy.
 * @see intermediate/async-validators — the async path in depth.
 */
@Component({
  selector: 'app-lesson-reactive-forms',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    JsonPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    Scribble,
    Whiteboard,
  ],
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

  /**
   * Mutates the SNAPSHOT `form.value` hands back, live, so the predict trap
   * above has a real button to press instead of only a code sample. Nothing in
   * the form changes — that is the entire point.
   */
  protected mutateSnapshot() {
    const snapshot = this.form.value;
    snapshot.name = 'Mutated (not saved)';
    this.mutatedSnapshot.set({ ...snapshot });
  }

  /** What {@link mutateSnapshot} produced — a throwaway object, never the form itself. */
  protected readonly mutatedSnapshot = signal<unknown>(null);

  /** How many times valueChanges fired during the feedback-loop demo — the runaway proof. */
  protected readonly loopCount = signal(0);
  /** Two independent controls, wired to each other only inside {@link triggerLoop}/{@link triggerLoopFixed}. */
  protected readonly loopA = this.fb.control('');
  protected readonly loopB = this.fb.control('');

  /**
   * The bug: subscribing to `valueChanges` and patching the OTHER control with
   * no `emitEvent` guard. Each patch is itself a write, so it re-fires the
   * sibling's own subscription — a synchronous ping-pong. Capped at 40 here so
   * the demo proves the point without genuinely overflowing the call stack;
   * the real bug has no such cap.
   */
  protected triggerLoop() {
    this.loopA.setValue('', { emitEvent: false });
    this.loopB.setValue('', { emitEvent: false });
    let n = 0;
    const subA = this.loopA.valueChanges.subscribe((v) => {
      n++;
      this.loopCount.set(n);
      if (n < 40) this.loopB.patchValue(v);
    });
    const subB = this.loopB.valueChanges.subscribe((v) => {
      n++;
      this.loopCount.set(n);
      if (n < 40) this.loopA.patchValue(v);
    });
    this.loopA.setValue('go');
    subA.unsubscribe();
    subB.unsubscribe();
  }

  /** The fix: identical wiring, but the patch passes `{ emitEvent: false }`. */
  protected triggerLoopFixed() {
    this.loopA.setValue('', { emitEvent: false });
    this.loopB.setValue('', { emitEvent: false });
    let n = 0;
    const subA = this.loopA.valueChanges.subscribe((v) => {
      n++;
      this.loopCount.set(n);
      this.loopB.patchValue(v, { emitEvent: false });
    });
    this.loopA.setValue('go');
    subA.unsubscribe();
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

  // ── Code samples shown to the reader ────────────────────────────────────────

  /**
   * Sample: defining a typed form with `FormBuilder`.
   */
  protected readonly modelSample = `// FormBuilder is sugar. Everything below could be written with \`new
// FormGroup({ name: new FormControl(...) })\` — the builder just removes the
// repetition, and infers the types for you.
private fb = inject(FormBuilder);

form = this.fb.group({
  // Read the array positionally — this is the part that confuses people:
  //   [0] initial value    [1] sync validator(s)    [2] async validator(s)
  // TypeScript infers \`string | null\` for name from the 'Ada' at [0]. It is
  // nullable because form.reset() sets every control back to null.
  name: ['Ada', [Validators.required, Validators.minLength(2)]],
  // Validators.email checks the SHAPE of the address only. It cannot tell you
  // the mailbox exists — that needs an async validator hitting your backend.
  email: ['ada@example.com', [Validators.required, Validators.email]],
  // min/max are for numbers; minLength/maxLength are for strings. Swapping
  // them silently never fires, which is a genuinely annoying afternoon.
  age: [36, [Validators.min(0), Validators.max(120)]],
});`;

  /** Line-by-line walkthrough of {@link modelSample}. */
  protected readonly modelNotes: CodeNote[] = [
    {
      line: 4,
      text: "`inject(FormBuilder)` in a field initializer — functional injection. It runs inside the component's own injection context, so no constructor is needed here (it would not be legal inside a later method body).",
    },
    {
      line: 6,
      text: '`.group()` builds a `FormGroup` — the cabinet from the analogy above, holding the three controls below as its named folders.',
    },
    {
      line: 11,
      text: "Shorthand control config: `[initialValue, syncValidators, asyncValidators?]`. `'Ada'` seeds this folder's starting value **and** its static type — typed forms infer `string` straight from the literal.",
    },
    {
      line: 14,
      text: '`Validators.email` is a built-in regex check on shape only. It flags obviously malformed text; it cannot tell you the mailbox actually exists — that needs an async validator, further down this lesson.',
    },
    {
      line: 17,
      text: "Initial value `36` makes this folder's type `number | null`. `Validators.min`/`max` are range checks, not the HTML `min`/`max` attributes — you can still add those in the template for native constraints too.",
    },
    {
      line: 18,
      text: 'Closes `.group()`. The whole cabinet is now fully typed — `FormGroup` of three named `FormControl`s — with no `any` anywhere.',
    },
  ];

  /**
   * Sample: the template side — `[formGroup]`, `formControlName`, `ngSubmit`.
   */
  protected readonly templateSample = `<!-- [formGroup] binds the FormGroup you built in the class to this element.
     Everything inside can now be addressed by control name. -->
<!-- (ngSubmit), not (submit): Angular's directive intercepts the native
     event, stops the browser's default page reload, and calls your method. -->
<form [formGroup]="form" (ngSubmit)="save()">
  <!-- formControlName is a plain string, NOT bound with brackets. It looks
       up 'name' in the parent [formGroup] and wires up two-way sync via the
       ControlValueAccessor. Misspell it and you get a runtime error. -->
  <input formControlName="name" />
  <input formControlName="email" />
  <!-- type="number" makes Angular hand you a number rather than a string. -->
  <input type="number" formControlName="age" />
  <!-- form.invalid is live: it flips the moment any validator fails, with no
       subscription on your side. Note this disables the button before the
       user has typed anything, which some designers dislike — the
       alternative is to leave it enabled and show errors on submit. -->
  <button type="submit" [disabled]="form.invalid">Save</button>
</form>`;

  /** Line-by-line walkthrough of {@link templateSample}. */
  protected readonly templateNotes: CodeNote[] = [
    {
      line: 5,
      text: "`[formGroup]` is `FormGroupDirective` — it binds this `<form>` to the `FormGroup` instance from the class and takes over the submit lifecycle. `(ngSubmit)` is Angular's own submit event: it calls `preventDefault()` for you, which is what stops a native full-page reload.",
    },
    {
      line: 9,
      text: '`formControlName` looks up the sibling folder named `"name"` on the nearest ancestor `[formGroup]` and wires a `ControlValueAccessor` between the DOM element and that control — the model stays the single source of truth, unlike `[(ngModel)]`, which writes straight to a template variable instead.',
    },
    {
      line: 12,
      text: "Same mechanism as line 9, but the accessor for a number input coerces the DOM's string value to/from the control's `number` type automatically.",
    },
    {
      line: 17,
      text: 'Reads `form.invalid` straight off the `FormGroup` in the template — no manual subscription. The directives above already keep the view in sync; "The mechanism" section explains exactly how.',
    },
  ];

  /**
   * Sample: reading and writing — `value` against `getRawValue()` (disabled
   * controls are omitted from the first), and `setValue` against `patchValue`.
   */
  protected readonly readWriteSample = `this.form.value;                          // typed, optional fields, disabled controls OMITTED
this.form.getRawValue();                  // same shape but COMPLETE — includes disabled controls
this.form.controls.name.value;            // read one control directly (typed: string | null)
this.form.get('email')?.errors;           // ValidationErrors | null for a single control
this.form.patchValue({ name: 'Grace' });  // update SOME fields — untouched fields keep their value
this.form.setValue({ name: 'Grace', email: 'g@x.com', age: 40 }); // update ALL fields — throws if any key is missing
this.form.valueChanges.subscribe((v) => console.log(v));   // Observable<value> — fires on every edit
this.form.statusChanges.subscribe((s) => console.log(s));  // Observable<'VALID'|'INVALID'|'PENDING'|'DISABLED'>`;

  /** Line-by-line walkthrough of {@link readWriteSample}. */
  protected readonly readWriteNotes: CodeNote[] = [
    {
      line: 1,
      text: "A **fresh snapshot**: a plain object Angular rebuilds from every folder whenever the cabinet's value changes — never a live window into the drawers themselves. Every field is typed optional, and disabled controls are omitted entirely.",
    },
    {
      line: 2,
      text: 'Same shape, but complete — includes disabled controls. Reach for this when you need every field regardless of disabled state: re-hydrating a form, or logging.',
    },
    {
      line: 3,
      text: '`.controls` on a typed group is a plain object literal of its children, known at compile time — so this is direct, typed access with no optional chain needed.',
    },
    {
      line: 4,
      text: "`get()` takes a string/array path and returns `AbstractControl | null` — useful for dynamic paths a dotted property access can't express, e.g. inside a loop.",
    },
    {
      line: 5,
      text: 'Partial update — only the keys you pass are touched, everything else keeps its current value. No error if fields are omitted.',
    },
    {
      line: 6,
      text: 'Full update — every key the group defines must be present, or this **throws**. Angular is deliberately strict here so a forgotten field cannot silently vanish.',
    },
    {
      line: 7,
      text: 'An `Observable` emitting the new value on every edit. A manual `subscribe()` like this needs manual teardown — the exam pitfalls list below has the safer alternatives.',
    },
    {
      line: 8,
      text: "An `Observable` of `'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'` — fires on every status transition, including the transient `PENDING` state further down this lesson.",
    },
  ];

  /**
   * Sample: the mutate-the-snapshot trap, live below the code as well as here.
   */
  protected readonly mutateTrapSample = `const snapshot = this.form.value;
snapshot.name = 'Mutated (not saved)';   // "changes" the name... or does it?

console.log(snapshot.name);                    // 'Mutated (not saved)'
console.log(this.form.get('name')!.value);     // ?`;

  /** The prompt for the mutate-trap {@link Predict} box. */
  protected readonly mutateTrapPrompt =
    "You grab the snapshot with `const snapshot = this.form.value;` and mutate it directly. `console.log(snapshot.name)` now prints the new text. Does the **Name input on screen** change to match — and does `this.form.get('name')!.value` agree with `snapshot.name`?";

  /** The reveal for the mutate-trap {@link Predict} box. */
  protected readonly mutateTrapAnswer =
    "No, and no. Nothing throws or warns — it just silently does not work. `form.value` hands back a plain object that Angular rebuilds from every folder's current value whenever the cabinet's own value changes — exactly the **snapshot** in the filing-cabinet picture above, and never a live view back into the drawers. Writing to `snapshot.name` only edits that disposable object; the real `FormControl` wired to the `name` field never hears about it, so its own `.value`, its `valueChanges` stream, and the input on screen all stay exactly where they were. `this.form.get('name')!.value` still reads the old value. The only way to actually change a control is through the control: `patchValue()`, `setValue()`, or `form.controls.name.setValue(...)`.";

  /**
   * Sample: the `valueChanges` feedback loop and the `emitEvent` option that
   * fixes it. Simplified from the live demo above, which caps the runaway
   * count at 40 purely so the browser tab doesn't lock up proving the point.
   */
  protected readonly emitEventSample = `// BUGGY — each patch re-triggers the sibling's own subscription:
priceA.valueChanges.subscribe((v) => priceB.patchValue(v));
priceB.valueChanges.subscribe((v) => priceA.patchValue(v));
priceA.setValue(10);   // A emits -> patches B -> B emits -> patches A -> ...

// FIXED — the write no longer emits, so the ping-pong never starts:
priceA.valueChanges.subscribe((v) =>
  priceB.patchValue(v, { emitEvent: false }),
);

// The option exists on every write method, and on onlySelf too:
form.patchValue(v, { emitEvent: false });   // don't re-run valueChanges/statusChanges
form.setValue(v, { onlySelf: true });       // don't bubble to the parent's own validity
control.disable({ emitEvent: false });      // disable() emits by default — easy to miss`;

  /** Line-by-line walkthrough of {@link emitEventSample}. */
  protected readonly emitEventNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Ordinary subscription, no guard: every value `priceA` emits gets written straight into `priceB`.',
    },
    {
      line: 3,
      text: 'The mirror image on `priceB`. Nothing here looks wrong in isolation — each line reads like a normal sync-two-fields pattern.',
    },
    {
      line: 4,
      text: "`setValue` is itself a write, so it fires `priceA`'s `valueChanges` — which patches `priceB` — which fires `priceB`'s own `valueChanges` — which patches `priceA` right back. Nothing here breaks the cycle.",
    },
    {
      line: 7,
      text: '`{ emitEvent: false }` suppresses `valueChanges`/`statusChanges` for **this** write only. `priceB` still receives the new value — it just never announces it, so nothing downstream re-fires.',
    },
    {
      line: 13,
      text: '`disable()` emits on `valueChanges` by default (with the disabled control\'s key already dropped from the value) — the single most common **accidental** trigger of this exact loop, since it rarely looks like a "write."',
    },
  ];

  /**
   * Sample: a cross-field validator, and why it attaches to the group.
   */
  protected readonly crossFieldValidatorSample = `// A cross-field validator reads MULTIPLE sibling controls, so it has to be
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

  /** Line-by-line walkthrough of {@link crossFieldValidatorSample}. */
  protected readonly crossFieldValidatorNotes: CodeNote[] = [
    {
      line: 3,
      text: "A plain function matching Angular's `ValidatorFn` shape — no decorator, no class. Declared outside the component so it stays pure and easy to unit-test on its own.",
    },
    {
      line: 4,
      text: "Because this validator is attached to the group, `group` here **is** the cabinet — `.get('password')` reaches into a sibling folder. A validator attached to one folder has no such reach.",
    },
    {
      line: 6,
      text: 'Returning `null` means "no error"; returning an object means "invalid", keyed by an error code you choose — the template/tests check for it later with `hasError(\'passwordsMismatch\')`.',
    },
    {
      line: 9,
      text: '`fb.nonNullable` produces folders whose value type drops `| null` and whose `reset()` restores the **initial** value instead of `null` — appropriate here, since "reset a password field to null" makes little sense.',
    },
    {
      line: 14,
      text: 'The second argument to `group()` is `AbstractControlOptions`, not another control config — this is what makes `passwordsMatch` a **group-level** validator instead of (failing to) attach to one field.',
    },
  ];

  /**
   * Sample: an async validator, including the requirement that it emit **and
   * complete** — a stream that never completes leaves the control `PENDING`
   * forever.
   */
  protected readonly asyncValidatorSample = `// AsyncValidatorFn returns an Observable (or Promise) of ValidationErrors | null.
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

  /** Line-by-line walkthrough of {@link asyncValidatorSample}. */
  protected readonly asyncValidatorNotes: CodeNote[] = [
    {
      line: 4,
      text: 'A **factory** returning an `AsyncValidatorFn` — written this way so the list of taken names is configurable per use rather than hard-coded inside the validator itself.',
    },
    {
      line: 6,
      text: '`timer(600)` emits once, 600ms later, then **completes** — standing in for a debounced HTTP call. Completing is not optional: a validator whose Observable never completes leaves the control stuck in `PENDING` forever.',
    },
    {
      line: 9,
      text: "Same contract as a sync validator's return value — an error object or `null` — just delivered asynchronously through the Observable instead of returned directly.",
    },
    {
      line: 16,
      text: 'Sync validators run first, on every keystroke. If either fails, Angular **never even calls** the async validator — no point checking availability for an empty or too-short name.',
    },
    {
      line: 17,
      text: "Only reached once sync validators pass. While it's in flight, `control.status === 'PENDING'` — a state most learners forget exists until an exam question tests it.",
    },
  ];

  /**
   * Sample: the class side of a `FormArray`.
   */
  protected readonly formArrayClassSample = `// class
// A FormArray holds controls by INDEX rather than by name — the right shape
// whenever the number of fields is decided at runtime.
// Seeded with one control so the UI is never empty on first render.
skills = this.fb.array([this.fb.control('Angular', Validators.required)]);
// The array is nested inside a group, which is what the template's
// [formGroup] binds to. Note it stores the same instance as \`skills\` above,
// so this.skills and skillsForm.get('skills') are the one object.
skillsForm = this.fb.group({ skills: this.skills });

addSkill() {
  // A NEW control per call. Reusing one instance would put the same object
  // at two indices, and typing in one row would change both.
  this.skills.push(this.fb.control('', Validators.required));
}

removeSkill(i: number) {
  // removeAt, not splice on .controls: it also detaches the control and
  // re-runs the parent's validation. Splicing leaves the form's validity stale.
  this.skills.removeAt(i);
}`;

  /** Line-by-line walkthrough of {@link formArrayClassSample}. */
  protected readonly formArrayClassNotes: CodeNote[] = [
    {
      line: 5,
      text: '`fb.array()` takes an initial list of controls (here, one pre-filled one) and returns a typed `FormArray` whose element type is inferred from that first control — a numbered drawer of folders instead of a cabinet of named ones.',
    },
    {
      line: 9,
      text: 'A `FormArray` is still just an `AbstractControl`, so it nests inside a `FormGroup` like any other folder — that is what lets a `<form>` bind to it at all.',
    },
    {
      line: 14,
      text: '`push()` appends a new control **and** triggers `updateValueAndValidity()` on the array (and its parent) — the same update pipeline a normal value edit goes through.',
    },
    {
      line: 20,
      text: "Removes the control at that index. Because the array is indexed, every control **after** `i` shifts down one position — important context for the template sample's `track $index` choice, below.",
    },
  ];

  /**
   * Sample: the template side of a `FormArray`, with `formArrayName` and the
   * indexed `formControlName`.
   */
  protected readonly formArrayTemplateSample = `<!-- template -->
<div [formGroup]="skillsForm">
  <!-- formArrayName points at the 'skills' key inside skillsForm. Inside this
       element, control names are INDICES rather than strings. -->
  <div formArrayName="skills">
    <!-- track $index, not the control: the value changes as the user types,
         so tracking by value would tear down and rebuild the input on every
         keystroke and you would lose focus after each character. -->
    @for (ctrl of skills.controls; track $index; let i = $index) {
      <!-- SQUARE BRACKETS here, unlike formControlName="name" above. The
           index is a number expression, not a literal string — write
           formControlName="i" and Angular looks for a control called "i". -->
      <input [formControlName]="i" />
      <!-- type="button" is essential. The default inside a <form> is
           type="submit", so omitting it makes "Remove" submit the form. -->
      <button type="button" (click)="removeSkill(i)">Remove</button>
    }
  </div>
</div>`;

  /** Line-by-line walkthrough of {@link formArrayTemplateSample}. */
  protected readonly formArrayTemplateNotes: CodeNote[] = [
    {
      line: 5,
      text: '`formArrayName` is the array counterpart of `formGroupName` — it points at the child named `"skills"` and puts everything nested inside it into that array\'s indexing context.',
    },
    {
      line: 9,
      text: 'Deliberately tracking by `$index` — the exam pitfalls list below explains why that is the **correct** choice here, not the anti-pattern it usually is.',
    },
    {
      line: 13,
      text: '`formControlName` also accepts a **number** when its container is a `FormArray` — `i` is the control\'s position, not a name. Square brackets bind it as an expression; without them Angular would look for a control literally called `"i"`.',
    },
    {
      line: 16,
      text: '`type="button"` is essential here: the default button type inside a `<form>` is `submit`, so omitting it would make "Remove" submit the whole form instead.',
    },
  ];

  /**
   * Sample: the control tree — every node an `AbstractControl`, which is why the
   * same API works at every level.
   */
  protected readonly underTheHoodSample = `FormGroup "form"                         ← every node is an AbstractControl
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Forms track, for the "you are here" rail — intermediate level only. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Reactive Forms' },
    { label: 'Form Validation', id: 'form-validation' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'FormArray', id: 'form-arrays' },
    { label: 'Signal Forms', id: 'signal-forms' },
  ];

  // ── Shape: "The Whiteboard" opener ──────────────────────────────────────────

  /** The ping-pong loop's steps, numbered — the mechanism behind the figure. */
  protected readonly loopFlowSteps: FlowStep[] = [
    { label: "loopA.setValue('go')", detail: 'one deliberate write — nothing wrong yet' },
    {
      label: "loopA's valueChanges fires",
      detail: 'a write always announces itself, by default',
      tone: 'accent',
    },
    {
      label: 'subscriber patches loopB',
      detail: 'itself a write — emitEvent defaults to true here too',
      tone: 'accent',
    },
    { label: "loopB's valueChanges fires", detail: 'the round trip completes', tone: 'warn' },
    {
      label: 'subscriber patches loopA back',
      detail: 'and the cycle repeats — synchronously, with no queue and no cap of its own',
      tone: 'warn',
    },
  ];

  /** The shape block's own quiz — the fixed version, same scenario. */
  protected readonly loopFixQuizOptions: QuizOption[] = [
    {
      text: "0 — { emitEvent: false } silences everything, including loopA's own write.",
      why: "loopA.setValue('go') still announces itself once — `emitEvent: false` was only passed to the PATCH into loopB, not to the original write.",
    },
    {
      text: "1 — loopA's own valueChanges still fires once, but the patch into loopB never re-announces, so the loop never starts.",
      correct: true,
      why: 'Exactly this. The very first write is still real and still fires. What stops is everything AFTER it — the patch into loopB carries `emitEvent: false`, so loopB changes value with no announcement, and there is nothing left to bounce back.',
    },
    {
      text: '2 — one fire per control, exactly balanced.',
      why: "loopB's value still changes — it just does so silently. There is no second `valueChanges` firing to balance against the first.",
    },
    {
      text: 'It still climbs, just more slowly — emitEvent only adds a delay, not a stop.',
      why: "`emitEvent: false` isn't a throttle, it's a switch. The subscription that would have re-fired simply has nothing to react to.",
    },
  ];

  /**
   * The mental-model diagram, staged as dialogue between one folder and the
   * cabinet — the same `updateValueAndValidity()` cascade "Under the hood"
   * spells out as pseudocode further down, said once in a mode a reader
   * follows without holding the whole pipeline in their head at once.
   */
  protected readonly cascadeTalk: BubbleTurn[] = [
    {
      who: 'The email folder',
      says: "My value just changed to `'ada@'`. That fails my own `Validators.email` check, so my own status is now `INVALID`.",
    },
    {
      who: 'The email folder',
      says: "Before I do anything else, I call my parent's `updateValueAndValidity()`. I don't get to keep that to myself.",
    },
    {
      who: 'The cabinet (form)',
      says: "Noted. I don't re-check my other folders — I just note that my own `status` is `INVALID` too, because **one bad folder is enough**, and I bubble the same call up to whatever contains me.",
    },
    {
      who: 'FormControlName directive',
      says: "I'm subscribed to both of your `statusChanges`. The moment either of you emits, I call `ChangeDetectorRef.markForCheck()` on the view — that's the entire reason the disabled Save button appears with no `subscribe()` in your component.",
    },
  ];

  /**
   * The self-test: where a cross-field validator actually has to live.
   *
   * The distractors are the two placements a learner tries first — on either
   * single control — plus the "just make it async" guess that confuses
   * *waiting on something* with *reading more than one value*. Each `why`
   * names the specific misconception rather than just restating the answer.
   */
  protected readonly crossFieldQuizOptions: QuizOption[] = [
    {
      text: "On the confirm control, since that's the field usually showing the error",
      why: "A validator only ever receives the single `AbstractControl` it's attached to. Attached to `confirm`, it can read `confirm`'s own value and nothing else — there is no path from there back to a sibling called `password`.",
    },
    {
      text: "On the password control, since that's the value being confirmed against",
      why: "Same problem, mirrored: a validator on `password` can see `password`'s value but has no reference to `confirm`. Whichever single folder you pick, it can only ever see itself.",
    },
    {
      text: 'On the FormGroup that contains both controls, passed as its second argument',
      correct: true,
      why: "Correct — the group is the only node with both `.get('password')` and `.get('confirm')` in reach. Passing it as the second argument to `group()` runs it as a **group-level** validator, re-evaluated whenever either child changes.",
    },
    {
      text: 'As an async validator on confirm, since comparing two live values is asynchronous',
      why: 'Comparing two already-known strings needs no round trip. Sync vs async is about whether a check has to **wait** on something external, like a server — not about how many fields it reads. This would just make an instant comparison needlessly slower.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "What's actually different between `patchValue` and `setValue`?",
      a: "`patchValue` updates only the keys you give it and leaves the rest of the cabinet untouched. `setValue` demands the *entire* shape the group defines — miss one folder and it throws, on purpose, so you can't silently lose a field.",
    },
    {
      q: 'Why is a disabled field missing from `form.value` — is that a bug?',
      a: 'By design. `value` is meant to be roughly "what you\'d actually submit", and a disabled field usually shouldn\'t be. `getRawValue()` is the escape hatch when you need every folder regardless of disabled state — re-hydrating a form, or logging.',
    },
    {
      q: 'Reactive vs template-driven — when do I actually reach for the other one?',
      a: "Template-driven earns its keep on something genuinely simple and mostly static — a login box, a one-field search. The moment you need cross-field validation, controls added at runtime, or a test that doesn't need a DOM fixture, reactive forms are the better trade, even for something small.",
    },
    {
      q: 'What does status `PENDING` actually mean, and when do I see it?',
      a: 'One or more async validators are currently in flight on that control. It only happens after every synchronous validator on the control has already passed, and before the async one\'s Observable/Promise has resolved — neither valid nor invalid, just "still checking".',
    },
    {
      q: 'This app is zoneless. How does typing into a formControlName input still update the Save button?',
      a: "Not zone.js, and not signals either, for a plain `form.invalid` read — it's the reactive-forms directives themselves, exactly like the cabinet dialogue above shows. `FormControlName`/`FormGroupDirective` subscribe to the control's `statusChanges` and call `ChangeDetectorRef.markForCheck()` on every emission, the same trick the `async` pipe uses for any other Observable.",
    },
  ];
}
