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
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, ReactiveFormsModule, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './form-validation.html',
  styleUrl: './form-validation.css',
})
export class FormValidation {
  /**
   * The validation pipeline, in the order it actually executes. The gate at step
   * four is the part that surprises people: async validators are not merely
   * "slower", they are *conditional* on the synchronous pass coming back clean.
   */
  protected readonly pipeline = [
    { label: 'DOM event', detail: '`input`, `blur` or `submit` — whichever `updateOn` selected' },
    {
      label: '`updateValueAndValidity()`',
      detail: 'The control rebuilds its value, then its validity',
    },
    {
      label: 'Sync validators run',
      detail: 'Every one of them, every time; results merge into one object',
    },
    {
      label: 'All returned `null`?',
      detail: 'If any failed, stop here — status is INVALID and async never runs',
      tone: 'warn' as const,
    },
    {
      label: 'Async queue, status PENDING',
      detail: 'Only reached when the sync pass came back clean',
      tone: 'accent' as const,
    },
    {
      label: 'Status settles',
      detail: 'VALID or INVALID, and the `ng-*` CSS classes follow',
      tone: 'good' as const,
    },
  ];

  /** The setErrors trap, posed before "under the hood" explains it. */
  protected readonly setErrorsSample = `// The server rejects the username, so you mark it by hand:
this.ctrl('username').setErrors({ taken: true });
// The message appears. Then the user edits the field —
// they type a single character.

// Is the "already taken" message still on screen?`;

  /** Choices for the async-gating check. */
  protected readonly asyncGateOptions = [
    {
      text: 'Yes — sync and async validators both run on every change',
      why: 'They would, if the queues were independent. They are not: the async queue sits behind a gate that only opens when the synchronous pass returns clean.',
    },
    {
      text: 'No — the sync failure short-circuits the async queue',
      correct: true,
      why: 'Angular runs the synchronous queue first and only starts the async one if the control came out valid. This is a deliberate optimisation: there is no point asking the server whether an empty string is taken.',
    },
    {
      text: 'Yes, but the result is discarded once `required` fails',
      why: 'The request would still have been sent, which is the cost the gate exists to avoid. Angular does not fire it and throw the answer away — it does not fire it at all.',
    },
    {
      text: 'Only if `updateOn` is set to `blur`',
      why: '`updateOn` chooses *which DOM event* triggers revalidation. It has no say in the ordering of the two validator queues, which is the same under every setting.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Why does a validator return `null` when things are FINE? That feels backwards.',
      a: 'Because it returns *the errors it found*, and finding none is `null`. Read the return type as "a report", not "a verdict": an empty report means nothing to complain about. It also makes merging trivial — Angular can spread every validator\'s object together, and absent keys simply are not there.',
    },
    {
      q: 'Where exactly does a "passwords match" validator go?',
      a: 'On the `FormGroup`, via its second argument: `fb.group({...}, { validators: passwordsMatch })`. A validator on a control receives only that control, and a control cannot see its siblings. Read the result from `form.errors`, not `confirm.errors` — that trips people up constantly, because the message *looks* like it belongs to the confirm field.',
    },
    {
      q: 'What is the difference between `touched` and `dirty`?',
      a: '`touched` means the user focused and then left the field — it is about *visiting*. `dirty` means the value changed — it is about *editing*. Tab straight through a form and every control is touched but pristine. For error display, `touched` is usually what you want: it means "they have had their chance at this field".',
    },
    {
      q: 'Can I do an HTTP call inside a validator?',
      a: 'Not in a synchronous one. Sync validators must be pure and return immediately — they run on every keystroke, and the framework has nowhere to put a promise. That is what the separate *async* validator slot is for; it returns an Observable or Promise and puts the control into `PENDING` while it waits.',
    },
    {
      q: 'My custom validator never runs. What did I do wrong?',
      a: 'Almost always: you passed the function instead of calling the factory. `hasDigit` is a factory that *returns* a `ValidatorFn`, so the array needs `hasDigit()`, with parentheses. Passing `hasDigit` hands Angular a function with the wrong signature, and it quietly does nothing useful.',
    },
  ];

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
