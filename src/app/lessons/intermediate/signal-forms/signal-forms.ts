import { Component, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  hidden,
  minLength,
  required,
  schema,
  submit,
  validateTree,
  type FieldTree,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/** The shape behind the mechanism demo — deliberately tiny, one field. */
interface NicknameModel {
  nickname: string;
}

/** The shape behind the main signup demo, built up across the lesson. */
interface SignupModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  wantsCompanyAccount: boolean;
  companyName: string;
}

/** The shape behind the array demo — a list of plain strings, nothing more. */
interface SkillsModel {
  skills: string[];
}

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: Signal Forms — `form()` wrapping a plain signal model, `schema()`
 * rules declared beside it, field state read as signals through
 * `[formField]`, and `submit()` round-tripping server-side errors back onto
 * the field that caused them.
 *
 * ## Presentation
 *
 * Built against the brain-friendly layer from the first line (see
 * `shared/brain/` and the reference implementation, `expert/change-detection`).
 * Teaching order: pose the problem the previous lesson (Reactive Forms) leaves
 * open → an analogy for the mechanism → the mechanism itself, verified against
 * `@angular/forms`'s shipped type declarations, not guessed from memory → the
 * same idea in several modes → a working form built up section by section →
 * self-test → FAQ → recap.
 *
 * ## Why one form, built up incrementally
 *
 * Reactive Forms teaches with several small, disposable demos. This lesson
 * uses one signup form and adds a capability to it per section — validation,
 * then a conditional field, then submission — so that by the time `submit()`
 * shows up the reader already trusts the model underneath it, instead of
 * meeting a fifth unrelated example.
 *
 * ## A note on accuracy
 *
 * Every API claim on this page — the `Field`/`FieldTree` recursion, the
 * `FieldState` signal list, `validateTree`'s `fieldTree`-tagged errors,
 * `submit()`'s concurrency rule — is checked against
 * `node_modules/@angular/forms/types/_structure-chunk.d.ts` as shipped in this
 * repo's `@angular/forms@21.2.0`, not against general knowledge of the API,
 * because it is young enough that general knowledge is often stale.
 */
@Component({
  selector: 'app-lesson-signal-forms',
  imports: [
    RouterLink,
    FormField,
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
  styleUrl: './signal-forms.css',
  templateUrl: './signal-forms.html',
})
export class SignalForms {
  // ── Demo 1: the mechanism itself ──────────────────────────────────────────

  /** The tiny model behind the "what even is `userForm.email`" demo. */
  protected readonly nicknameModel = signal<NicknameModel>({ nickname: '' });

  /** `form()` wrapping it — a `FieldTree`, both callable and drillable. */
  protected readonly nicknameForm: FieldTree<NicknameModel> = form(this.nicknameModel);

  /** What `typeof` reports for each of the three things a reader can do with it. */
  protected readonly whatIsIt = {
    theForm: () => typeof this.nicknameForm,
    theField: () => typeof this.nicknameForm.nickname,
    theState: () => typeof this.nicknameForm.nickname(),
  };

  // ── Demo 2: the signup form — validation, a conditional field, submission ──

  /** The one form the rest of the lesson builds on. Still a plain signal. */
  protected readonly signupModel = signal<SignupModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    wantsCompanyAccount: false,
    companyName: '',
  });

  /**
   * The rules, kept beside the model rather than scattered across the
   * template as `required` attributes or spread through a service as
   * `Validators.compose([...])`. `schema()` caches this so it is built once
   * even though `form()` re-reads it on every reactive re-evaluation.
   */
  protected readonly signupSchema = schema<SignupModel>((p) => {
    required(p.username, { message: 'Pick a username.' });
    minLength(p.username, 3, { message: 'At least 3 characters.' });

    required(p.email, { message: 'We need an email to reach you.' });
    email(p.email);

    required(p.password, { message: 'Choose a password.' });
    minLength(p.password, 8, { message: 'At least 8 characters.' });

    // Cross-field: neither field's own validator can see the other one's
    // value, so the check has to live on the tree, not on `confirmPassword`.
    validateTree(p, ({ value, fieldTreeOf }) => {
      const model = value();
      if (model.password && model.confirmPassword && model.confirmPassword !== model.password) {
        return [
          {
            kind: 'mismatch',
            message: 'Passwords do not match.',
            fieldTree: fieldTreeOf(p.confirmPassword),
          },
        ];
      }
      return undefined;
    });

    // Reactive, not a one-time check: flips live as the checkbox above it
    // changes, because `valueOf` re-reads the signal every time this runs.
    hidden(p.companyName, ({ valueOf }) => !valueOf(p.wantsCompanyAccount));
    required(p.companyName, { message: 'Company name is required for a company account.' });
  });

  /** The form itself: the model plus the schema, nothing else. */
  protected readonly signupForm = form(this.signupModel, this.signupSchema);

  /** Set once `submit()` resolves, so the demo can show a final state. */
  protected readonly submitOutcome = signal<'idle' | 'rejected' | 'accepted'>('idle');

  /**
   * Simulates a server call that rejects one specific username, and maps the
   * rejection back onto that exact field — the same pattern as the
   * `submit()` JSDoc's own `registerNewUser` example, adapted to a
   * self-contained demo with a fake 500ms round trip instead of a real
   * backend or `httpResource()` call (a real HTTP call here would open a
   * `PendingTasks` entry `lessons.smoke.spec.ts` never flushes, hanging the
   * smoke test for this exact lesson — see the `/http-resource` lesson for
   * why, and how it works around the same trap for a *live* HTTP demo).
   */
  protected submitSignup(): void {
    this.submitOutcome.set('idle');
    void submit(this.signupForm, {
      action: async (field) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (field().value().username === 'admin') {
          return [
            {
              kind: 'server',
              message: 'That username is already taken.',
              fieldTree: this.signupForm.username,
            },
          ];
        }
        return undefined;
      },
    }).then((success) => this.submitOutcome.set(success ? 'accepted' : 'rejected'));
  }

  // ── Demo 3: arrays, the declarative way ─────────────────────────────────────

  /** A list of skills — a plain array on the model, no separate array API. */
  protected readonly skillsModel = signal<SkillsModel>({ skills: [''] });

  protected readonly skillsForm = form(this.skillsModel, (p) => {
    // One rule, applied to every current AND future item — nothing re-runs
    // when an item is added, because there is no separate array control to
    // keep in sync. The array is just a field whose value happens to be an
    // array.
    minLength(p.skills, 1, { message: 'Add at least one skill.' });
  });

  /** Adds a blank skill by writing a new array to the model — that's it. */
  protected addSkill(): void {
    this.skillsModel.update((m) => ({ ...m, skills: [...m.skills, ''] }));
  }

  /** Removes one skill by index, same way. */
  protected removeSkill(index: number): void {
    this.skillsModel.update((m) => ({ ...m, skills: m.skills.filter((_, i) => i !== index) }));
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Forms track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Template-Driven Forms', id: 'template-forms' },
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Form Validation', id: 'form-validation' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'FormArray', id: 'form-arrays' },
    { label: 'Signal Forms' },
    { label: 'Custom Controls (CVA)', id: 'control-value-accessor' },
  ];

  /**
   * The relationship reactive-forms veterans reliably get backwards: they
   * expect `userForm.email` to be a value they can read directly, the way
   * `formGroup.get('email').value` almost is. It is neither a value nor a
   * getter — it is a plain function Angular built for you.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    { who: 'You', says: 'I want the email field. `userForm.email`, right?' },
    {
      who: 'The FieldTree',
      says: "That's me — but I'm not a value, I'm a function. Call me for state.",
    },
    { who: 'You', says: 'Okay — `userForm.email()`. What do I get?' },
    {
      who: 'The FieldTree',
      says: 'A `FieldState`: `.value()`, `.touched()`, `.dirty()`, `.errors()` — all signals.',
    },
    { who: 'You', says: 'And `userForm` on its own, with no `.email`?' },
    { who: 'The FieldTree', says: "Same deal, one level up — call it for the whole form's state." },
  ];

  /** What happens between a keystroke and the field state updating. */
  protected readonly keystrokeFlow: FlowStep[] = [
    { label: 'You type', detail: '`[formField]` catches the input event' },
    { label: 'Model updates', detail: 'the signal you own gets a new value', tone: 'accent' },
    { label: 'Schema re-runs', detail: 'every rule that reads this field, or one it depends on' },
    {
      label: 'FieldState updates',
      detail: '`.value()`, `.dirty()`, `.errors()` — all signals',
      tone: 'good',
    },
    {
      label: 'Template re-renders',
      detail: 'only the bindings that actually read a changed signal',
    },
  ];

  /** Sample: the mechanism — calling vs. drilling, verified against `_structure-chunk.d.ts`. */
  protected readonly mechanismSample = `protected readonly model = signal({ nickname: '' });
protected readonly userForm = form(this.model);

userForm();              // FieldState<{ nickname: string }> — the whole form
userForm.nickname;       // Field<string> — itself a function, not a value
userForm.nickname();     // FieldState<string> — THIS field's own state
userForm.nickname().value();    // 'whatever the reader typed'
userForm.nickname().touched();  // false, until the input is blurred`;

  /** Line-by-line walkthrough of {@link mechanismSample}. */
  protected readonly mechanismNotes: CodeNote[] = [
    {
      line: 2,
      text: '`form()` takes the `WritableSignal` you already own and hands back a `FieldTree` — it does not copy your data into some other internal structure the way a `FormGroup` does.',
    },
    {
      line: 4,
      text: '`userForm` itself is callable. Calling it with no property access gives the **root** `FieldState` — the state of the whole model as one field.',
    },
    {
      line: 5,
      text: '`userForm.nickname` is a property access, not a call — and what you get back is `Field<string>`, which is defined as `() => FieldState<string>`. It is a function, not the string itself. This is the one line most reactive-forms veterans misread first.',
    },
    {
      line: 6,
      text: 'Calling it — `userForm.nickname()` — is what actually produces the `FieldState`: `.value()`, `.touched()`, `.dirty()`, `.errors()`, all as their own signals.',
    },
    {
      line: 7,
      text: "`.value()` is itself a `WritableSignal`, so `userForm.nickname().value.set('x')` would work too — `[formField]` is doing exactly that under the hood on every keystroke.",
    },
    {
      line: 8,
      text: '`.touched()` starts `false` and flips to `true` on blur, which `[formField]` also wires up for you — the same signal a reactive-forms `FormControl` exposes as a method, here exposed as a signal that a template can read directly.',
    },
  ];

  /** Sample: `submit()`'s server-error mapping, adapted from the API's own JSDoc example. */
  protected readonly submitSample = `async function registerUser(f: FieldTree<Signup>) {
  const result = await fakeApi.register(f().value());
  if (result.code === 'USERNAME_TAKEN') {
    return [{ fieldTree: f.username, kind: 'server', message: 'Username already taken' }];
  }
  return undefined;
}

submit(signupForm, { action: (f) => registerUser(f) });
// on rejection:
signupForm.username().errors();
// [{ kind: 'server', message: 'Username already taken' }]`;

  /** Line-by-line walkthrough of {@link submitSample}. */
  protected readonly submitNotes: CodeNote[] = [
    {
      line: 2,
      text: '`f().value()` reads the whole submitted model in one call — `f()` for the root `FieldState`, `.value()` for the signal, `()` again to read it. The demo above calls a `setTimeout` instead of a real API, for the smoke-test reason noted in the class doc.',
    },
    {
      line: 4,
      text: "The return shape is a `ValidationError` with an extra `fieldTree` naming exactly which field the error belongs to — here, `f.username`, not the form as a whole. `kind` can be any string you choose; `'server'` is a convention, not a built-in.",
    },
    {
      line: 6,
      text: 'Returning `undefined` (or nothing at all) means success — no error attached anywhere.',
    },
    {
      line: 9,
      text: '`submit()` calls your `action`, awaits it, and — if it returned errors — attaches each one to the `fieldTree` it named. You never call `.setErrors()` yourself.',
    },
    {
      line: 11,
      text: "The error surfaces exactly where a hand-written validator's error would: on `username().errors()`. The template does not need to know the difference between a client-side rule and a server rejection.",
    },
  ];

  /** The self-test — the `valid()`/`invalid()` pending-state trap, quoted from the source doc. */
  protected readonly stateQuizOptions: QuizOption[] = [
    {
      text: '`valid()` is `true` and `invalid()` is `false` — no errors yet, so it must be fine.',
      why: 'Close, but `valid()` isn\'t just "no errors" — the source doc is explicit: `valid()` requires no errors **and** no pending validators. A pending one blocks it.',
    },
    {
      text: 'Both `valid()` and `invalid()` are `false` at the same time.',
      correct: true,
      why: 'Exactly the trap the type declarations call out by name: `invalid()` is `true` only when there ARE errors, and a still-pending validator has not produced one yet — so `invalid()` reads `false`. Meanwhile `valid()` needs zero errors *and* zero pending, and one is still pending — so it also reads `false`. `valid()` is not simply `!invalid()`.',
    },
    {
      text: '`pending()` throws until the validator settles.',
      why: '`pending()` is an ordinary boolean signal — reading it is always safe. Only `.value()` on a resource in the `error` state throws, and that is a different API entirely (`httpResource()`, covered in its own lesson).',
    },
  ];

  /** The self-test — `submit()`'s concurrency rule. */
  protected readonly submitQuizOptions: QuizOption[] = [
    {
      text: 'The second call queues and runs its `action` right after the first finishes.',
      why: 'No queueing happens. The source doc is direct about this: "subsequent calls to `submit` will return `false` immediately without running the action."',
    },
    {
      text: 'The second call returns `false` immediately, and its `action` never runs at all.',
      correct: true,
      why: '"Concurrent submissions are prohibited," per the API\'s own doc comment — a submit already in flight for this field (or an ancestor) makes every other `submit()` call on it a same-tick no-op.',
    },
    {
      text: 'Both calls run their `action` at once, and whichever resolves last wins.',
      why: "That would be a real race condition, and it's exactly what the concurrency guard exists to prevent. Only one `action` for a given field is ever in flight.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Is `[formField]` a full replacement for a `ControlValueAccessor`?',
      a: "For most controls, yes — `[formField]` binds straight to a native `<input>`/`<textarea>`, or to a custom control that implements `FormValueControl`/`FormCheckboxControl`. A `ControlValueAccessor` still works underneath it for backwards compatibility, but it's the fallback path, not the one to reach for in new code. The `/control-value-accessor` lesson, next in this track, covers building a custom control either way.",
    },
    {
      q: "`hidden(p.companyName, ...)` — why didn't the field disappear from the page?",
      a: "Because `hidden` only sets a signal — `field().hidden()` — it never touches the DOM for you. The demo above wraps the input in `@if (!signupForm.companyName().hidden())` itself. Skip that and the field stays fully visible and fully interactive, just excluded from the form's touched/dirty/valid rollup. It's an easy one to get burned by once.",
    },
    {
      q: 'Do I still need `Validators` from `@angular/forms`?',
      a: "Not for a signal form — `required`, `email`, `min`, `pattern` and friends here are a completely separate set of functions with a different call shape (they take a `SchemaPath`, not a control). They happen to share a package with the reactive-forms `Validators` namespace, which is a naming coincidence worth knowing about so you don't reach for the wrong import.",
    },
    {
      q: 'Is this ready to use in a real app today?',
      a: "Every export behind it — `form`, `schema`, `submit`, all the validators — is still tagged `@experimental` in this exact version's type declarations, one step earlier than `@developerPreview`. That means the shape can still change without a deprecation cycle. The core `form()`/`schema()`/`[formField]` contract has been stable across the versions this app has tracked, and it's the direction Angular's own team is steering new form code toward, but budget for API drift if you ship it.",
    },
    {
      q: 'Can I mix Signal Forms and Reactive Forms in the same app?',
      a: 'Yes — nothing about adopting `form()` requires migrating every existing `FormGroup` at once. They are separate systems that happen to render into the same kind of `<input>` elements, so a new feature can use Signal Forms while the rest of the app keeps its `ReactiveFormsModule` forms exactly as they are.',
    },
  ];
}
