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
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
  TapeCard,
} from '../../../shared/brain';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * Custom validator: value must contain a digit. A FACTORY — see "What does a
 * custom validator actually look like?" below for why the parentheses in
 * `hasDigit()` are load-bearing.
 */
function hasDigit(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /\d/.test(control.value ?? '') ? null : { hasDigit: true };
}

/**
 * Cross-field validator: password === confirm. Reads TWO sibling controls, so
 * it has to be attached to the FormGroup that contains them — see "Where does
 * a cross-field check actually go?" below.
 */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw === confirm ? null : { mismatch: true };
}

/**
 * Lesson: Form Validation — built-in validators, custom ones, cross-field
 * checks, and the two timing questions that actually cause exam and code-review
 * pain: *when does a validator run*, and *when is a user allowed to see that it
 * failed*.
 *
 * Covers the `Validators` set and their error keys, writing a `ValidatorFn`,
 * where a group-level validator has to live, reading `errors` to drive
 * messages, the `touched` / `dirty` / `pristine` / `pending` / `disabled` flags,
 * `updateOn`, and the sync-then-async gate that decides whether an async
 * validator ever gets asked at all.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), following the teaching order recorded on
 * `expert/change-detection`: pose the problem before naming it — a brand-new
 * required control is already invalid, so why doesn't the box start out red? —
 * then an analogy that carries the mechanism (a sticky-note pad stuck to every
 * control), then the same idea in more than one mode: a dialogue between a
 * control, its validators and the template that decides whether to repeat what
 * they said; two annotated `app-code-lab` blocks for the custom and cross-field
 * validators; a `app-compare` panel putting the cross-field validator in the
 * wrong place next to the right one; a `app-tape-card` grid of the four places
 * a validator can actually attach; and the two live demos this lesson already
 * had, now built on the same touched/dirty story the opening napkin asks the
 * reader to predict.
 *
 * @see intermediate/reactive-forms — the form model these validators attach to.
 * @see intermediate/async-validators — the async path, once the sync gate below opens.
 * @see intermediate/form-arrays — an array-level validator, the FormArray sibling of the group-level one here.
 */
@Component({
  selector: 'app-lesson-form-validation',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Forms track, for the "you are here" rail — this lesson's own position. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Form Validation' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'FormArray', id: 'form-arrays' },
  ];

  /**
   * The sticky-note analogy played out as an exchange, staged so that the
   * merge-into-`errors` mechanism and the touched-gating question posed at the
   * top of the page land in the SAME beat — a reader who saw them as two
   * separate facts now sees them as one control refusing to repeat itself
   * until it has been asked twice.
   */
  protected readonly mergeTalk: BubbleTurn[] = [
    {
      who: 'The username control',
      says: "My value just became `'bob'`. Let me ask every validator on my list whether they're happy.",
    },
    {
      who: '`Validators.required`',
      says: 'Not empty. Nothing to report from me — I hand back `null`.',
    },
    {
      who: '`hasDigit()`',
      says: "I checked `'bob'` for a digit. Found none. My note reads `{ hasDigit: true }`.",
    },
    {
      who: 'The username control',
      says: "Merged: `{ hasDigit: true }`. That object is my `errors` now, and I'm `INVALID` — but I haven't told the template anything yet.",
    },
    {
      who: 'The template',
      says: "I only ask for `errors` once you're `touched`. Until the user actually leaves this field, I'm not going to repeat what you just said.",
    },
  ];

  /**
   * Sample: the custom validator, with the factory-vs-value distinction that
   * causes the single most common "my validator never runs" bug.
   */
  protected readonly customValidatorSample = `// A FACTORY — calling hasDigit() is what returns the real ValidatorFn.
// Forgetting the parentheses is the single most common way a custom
// validator silently does nothing at all.
function hasDigit(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    /\\d/.test(control.value ?? '') ? null : { hasDigit: true };
}

// Used exactly like a built-in validator, in the SAME array:
username: ['', [Validators.required, hasDigit()]],`;

  /** Line-by-line walkthrough of {@link customValidatorSample}. */
  protected readonly customValidatorNotes: CodeNote[] = [
    {
      line: 4,
      text: '`function hasDigit(): ValidatorFn` is a **factory**, not the validator itself. It takes no arguments here and returns a function — that returned function is the actual thing Angular calls on every revalidation.',
    },
    {
      line: 5,
      text: '`control: AbstractControl` is the base type every `FormControl`, `FormGroup` and `FormArray` shares — which is why this exact function shape checks one field here and, further down, a whole group. The return type says the whole contract: an object of complaints, or `null`.',
    },
    {
      line: 6,
      text: "`control.value ?? ''` guards against `null` — a control reads `null` right after `form.reset()`, and `.test(null)` would throw without it. Then the ternary: a digit found → `null` (happy); none found → `{ hasDigit: true }`, an object naming exactly what went wrong.",
    },
    {
      line: 10,
      text: '`hasDigit()` — called **with parentheses**. Passing the bare `hasDigit` hands Angular a function one argument short of `ValidatorFn`, and it quietly validates nothing. There is an FAQ entry below on exactly this mistake.',
    },
  ];

  /**
   * Sample: the cross-field validator, showing it reads through the GROUP to
   * reach both siblings — the thing a control-level validator can never do.
   */
  protected readonly crossFieldSample = `// Reads TWO sibling controls, so it must be attached to the GROUP that
// contains them — a validator on a single child control never sees its
// neighbours.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw === confirm ? null : { mismatch: true };
}

this.fb.group(
  { username: [...], password: [...], confirm: [''] },
  { validators: passwordsMatch },   // 2nd argument to group() = GROUP-level
);`;

  /** Line-by-line walkthrough of {@link crossFieldSample}. */
  protected readonly crossFieldNotes: CodeNote[] = [
    {
      line: 4,
      text: '`group: AbstractControl` — named `group` on purpose, not `control`. Inside this function it **is** the `FormGroup` itself, which is the only reason the next two lines can reach anywhere at all.',
    },
    {
      line: 5,
      text: "`group.get('password')` reaches into a **sibling** control through their shared parent — something a validator attached to a single control can never do, because it only ever receives that one control.",
    },
    {
      line: 6,
      text: 'The other sibling, read the same way. Both reads only work because this function is attached to the group — see the wrong-vs-right comparison just below.',
    },
    {
      line: 7,
      text: "Plain reference equality. `null` when they match, or `{ mismatch: true }` when they don't — read later from `form.errors`, **never** `confirm.errors`, because the error belongs to the group that ran the check.",
    },
    {
      line: 12,
      text: "The **second argument** to `.group()`, an options object. This is what makes `passwordsMatch` a group-level validator — there is no way to get the same effect by adding it to one control's own validator array.",
    },
  ];

  /** Compare panel: a cross-field validator wired to the wrong place. */
  protected readonly wrongPlacementSample = `confirm: ['', [passwordsMatch]],
// passwordsMatch(control) is called with ONLY the confirm control.
// There is no sibling in reach from here — "password" might as well
// not exist as far as this validator can see.`;

  /** Compare panel: the same validator, wired to the group instead. */
  protected readonly rightPlacementSample = `this.fb.group(
  { password: [...], confirm: [...] },
  { validators: passwordsMatch },   // ← SECOND argument to group()
);
// passwordsMatch(group) is called with the FormGroup itself.
// group.get('password') and group.get('confirm') are both in reach.`;

  /**
   * Sample: controlling *when* a control revalidates, reacting to that from
   * outside the template, and the `setErrors()` escape hatch — three short,
   * self-contained facts, kept in one block because none of them needs a full
   * line-by-line walkthrough on its own.
   */
  protected readonly controlSample = `// validate on blur/submit instead of every keystroke:
new FormControl('', { validators: [Validators.required], updateOn: 'blur' });

// react to validity changes from outside the template:
this.form.statusChanges.subscribe((s) => console.log(s));  // 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'

// set/clear errors imperatively (e.g. from a server response):
ctrl.setErrors({ taken: true });      // REPLACES the whole errors object — never merges
ctrl.updateValueAndValidity();        // re-runs the REAL validators — this is what undoes the line above`;

  /**
   * The validation pipeline, in the order it actually executes. The gate at step
   * four is the part that surprises people: async validators are not merely
   * "slower", they are *conditional* on the synchronous pass coming back clean.
   */
  protected readonly pipeline: FlowStep[] = [
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
      tone: 'warn',
    },
    {
      label: 'Async queue, status PENDING',
      detail: 'Only reached when the sync pass came back clean',
      tone: 'accent',
    },
    {
      label: 'Status settles',
      detail: 'VALID or INVALID, and the `ng-*` CSS classes follow',
      tone: 'good',
    },
  ];

  /** Choices for the async-gating check. */
  protected readonly asyncGateOptions: QuizOption[] = [
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

  /** The setErrors trap, posed before "under the hood" explains it. */
  protected readonly setErrorsSample = `// The server rejects the username, so you mark it by hand:
this.ctrl('username').setErrors({ taken: true });
// The message appears. Then the user edits the field —
// they type a single character.

// Is the "already taken" message still on screen?`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
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
    {
      q: 'Why is `Validators.minLength(6)` camelCase but the error key `minlength` all lowercase?',
      a: "Historical accident, not something you can derive — the function names follow the rest of the `Validators` API, and the error keys were chosen to mirror the plain HTML attributes (`minlength`, `maxlength`) they stand in for. There is no way to guess it from the function name, and `errors?.['minLength']` (capital L) silently reads `undefined` forever — it belongs on a cheat sheet, not memorised from first principles.",
    },
  ];
}
