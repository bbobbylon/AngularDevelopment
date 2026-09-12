import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Template-Driven Forms — the form model Angular builds FOR you, straight
 * off the template.
 *
 * Covers `FormsModule`, `ngModel` / `ngForm`, the `name` attribute as the key
 * into `form.value`, HTML-attribute validators, the automatic `ng-*` state
 * classes every control carries through its lifecycle, a writable signal living
 * inside a two-way `[(ngModel)]` binding, and — past the API surface —
 * `ControlValueAccessor` as the DOM-to-model bridge, the microtask that defers
 * control registration, and the several very different ways a submit button
 * can end up doing nothing at all.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem first.** The page opens on "you typed into a box — where
 *    did that value actually go?" before any directive is named.
 * 2. **Analogy before vocabulary.** The librarian-and-ledger frame gives the
 *    reader somewhere to put `ngModel` and `ngForm` before those words have to
 *    carry any weight, and it doubles as the contrast with reactive forms, where
 *    the reader builds the ledger themselves.
 * 3. **Then the same idea in several modes** — a dialogue between an input and
 *    the form it registers with, a hand-drawn state diagram of the three
 *    lifecycle flags, a row of cards naming each one, annotated snippets, and
 *    four live demos.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *    Nothing here assumes the reader can already read the snippet.
 *
 * @see intermediate/reactive-forms — the model built by hand instead, and the
 * four situations where that trade actually pays off.
 */
@Component({
  selector: 'app-lesson-template-forms',
  imports: [
    RouterLink,
    FormsModule,
    JsonPipe,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
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
  // inside a two-way ngModel binding" below.
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Forms track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Template-Driven Forms' },
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Form Validation', id: 'form-validation' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'FormArray', id: 'form-arrays' },
    { label: 'Signal Forms', id: 'signal-forms' },
    { label: 'Custom Controls (CVA)', id: 'control-value-accessor' },
  ];

  /**
   * The registration handshake between one control and the form it joins.
   *
   * Staged as dialogue because the relationship — who tells whom, and when —
   * is the part beginners reliably get backwards: they picture `ngModel` as
   * something that *is* the value, rather than something that reports a value
   * (and two flags about it) to a ledger kept somewhere else entirely.
   */
  protected readonly registrationTalk: BubbleTurn[] = [
    {
      who: 'Your input',
      says: 'I\'ve got `ngModel` and `name="email"` on me. What do you want from me?',
    },
    {
      who: 'The librarian',
      says: "Register with me. Give me that `name` and I'll open a slot for you at `form.value.email`.",
    },
    { who: 'Your input', says: 'Someone just typed into me.' },
    {
      who: 'The librarian',
      says: 'Copied into the ledger. That keystroke also flips your `pristine` flag to `dirty` — for good, until the whole form resets.',
    },
    { who: 'Your input', says: 'They clicked away from me, without fixing what they typed.' },
    {
      who: 'The librarian',
      says: "Then you're `touched` now, and whatever your validators say about that value is what I act on from here.",
    },
  ];

  /**
   * Sample: the `FormsModule` import that template-driven forms require.
   */
  protected readonly setupSample = `import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup-form',
  imports: [FormsModule],   // standalone component opts in here
  template: \`...\`,
})
export class SignupForm {}`;

  /** Line-by-line walkthrough of {@link setupSample}. */
  protected readonly setupNotes: CodeNote[] = [
    {
      line: 1,
      text: "`FormsModule` is a small NgModule that ships `NgModel`, `NgForm`, `NgModelGroup`, and the attribute-based validators (`required`, `minlength`, `maxlength`, `pattern`, `email`). It's a separate module from `ReactiveFormsModule` — importing one does not give you the other.",
    },
    {
      line: 5,
      text: "Adding `FormsModule` to this standalone component's `imports` array is what makes `ngModel` a legal attribute **inside this template specifically**. A standalone component doesn't inherit directives from anywhere else — every template lists what it needs, on its own.",
    },
  ];

  /**
   * Sample: the anatomy of a template-driven control — `#f="ngForm"`,
   * `ngSubmit`, the `name` attribute, and validation state.
   */
  protected readonly anatomySample = `<form #f="ngForm" (ngSubmit)="submit(f.value)">
  <input
    name="name"
    ngModel
    required
    minlength="2"
    #name="ngModel"
  />

  @if (name.invalid && name.touched) {
    @if (name.errors?.['required']) { Name is required. }
    @if (name.errors?.['minlength']) { At least 2 characters. }
  }
</form>`;

  /** Line-by-line walkthrough of {@link anatomySample}. */
  protected readonly anatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`#f="ngForm"` grabs a template reference to the `NgForm` directive Angular attaches to every `<form>` automatically once `FormsModule` is imported — no attribute needed for that part. `(ngSubmit)` binds to an event `NgForm` re-emits after it calls `preventDefault()` on your behalf, so the page never hard-navigates.',
    },
    {
      line: 3,
      text: '`name="name"` is the key this control registers under. `f.value` ends up shaped like an object built entirely from these `name` strings — never from `id`.',
    },
    {
      line: 4,
      text: 'Bare `ngModel` — no brackets, no bound value — still creates and registers a control. It just means **one-way, into the form only**: nothing from the component is pushed back down into this input.',
    },
    {
      line: 5,
      text: '`required` and `minlength="2"` (next line) are plain HTML attributes. `NgModel` recognises them through Angular\'s own validator directives, shipped inside `FormsModule`, and folds their results into `errors` — there is no separate validators array to wire up by hand.',
    },
    {
      line: 7,
      text: '`#name="ngModel"` is a **second** reference variable, this time for this one control\'s own `NgModel` directive — it is what makes `name.invalid`, `name.touched` and `name.errors` readable two lines down.',
    },
    {
      line: 10,
      text: 'Gated on **both** conditions. `invalid` alone would show "Name is required" on an empty, untouched field the instant the page loads — `touched` only flips after a `blur`, so the message waits until the reader has actually left the field.',
    },
    {
      line: 11,
      text: "`errors` is `null` while the control is valid, so `?.` is load-bearing: without it, reading `['required']` off `null` throws the moment the field becomes valid.",
    },
  ];

  /**
   * Sample: the three `ngModel` forms — one-way into the form model, two-way to
   * a field, and standalone outside a `<form>` — plus `ngModelGroup` nesting.
   */
  protected readonly variationsSample = `<input name="q" ngModel />                  // one-way into the form model
<input name="q" [(ngModel)]="query" />      // two-way to a component field
<input ngModel #x="ngModel" />              // standalone — no parent <form>

<div ngModelGroup="address">                // nest controls into a sub-group
  <input name="city" ngModel />            // -> form.value.address.city
</div>`;

  /** Line-by-line walkthrough of {@link variationsSample}. */
  protected readonly variationsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Bare `ngModel` plus a `name` — the value flows **up** into `form.value.q` on every change; nothing flows back down. Reach for this when the component only needs the value at submit time.',
    },
    {
      line: 2,
      text: '`[(ngModel)]="query"` — "banana in a box", sugar for `[ngModel]="query" (ngModelChange)="query = $event"`. Now it is genuinely two-way: setting `this.query` in the class updates what is on screen, and typing updates `this.query` on every keystroke.',
    },
    {
      line: 3,
      text: "No `<form>` around this one. A **standalone** control still gets a working `FormControl` and a template reference (`x.value`, `x.valid`) — it just never rolls up into anybody's `form.value`, because there is no `NgForm` for it to register with.",
    },
    {
      line: 5,
      text: '`ngModelGroup="address"` nests every `ngModel` inside it under an `address` key, so `form.value` grows a nested `address` object instead of staying flat — the template-driven equivalent of a nested `FormGroup`.',
    },
    {
      line: 6,
      text: 'Same rules as any other control — it just registers on the `NgModelGroup` instead of the root `NgForm`, which is the entire reason its value lands one level deeper than a plain sibling would.',
    },
  ];

  /**
   * Sample: the same field expressed with signals and `computed` instead of
   * `ngModel` validation directives.
   */
  protected readonly signalFormSample = `protected readonly username = signal('');

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

  /** Line-by-line walkthrough of {@link signalFormSample}. */
  protected readonly signalFormNotes: CodeNote[] = [
    {
      line: 1,
      text: "A plain `WritableSignal<string>`, not a form control of any kind. Template-driven forms don't know or care that the backing store is a signal — from `NgModel`'s point of view it is just something readable and writable.",
    },
    {
      line: 3,
      text: '`computed()` instead of a getter, because it **memoises**: it only re-runs when `username` actually changes, and reading it in a template registers that template as a dependant, so Angular knows exactly when to re-render this binding.',
    },
    {
      line: 4,
      text: 'Derives from `usernameLength()`, not from `username()` directly — computed signals can depend on other computed signals, and Angular builds that graph from whichever signals actually got read, with nothing declared by hand.',
    },
    {
      line: 13,
      text: 'The **bare** signal is the whole trick. Writing `[(ngModel)]="username()"` — with the call — would target the signal\'s current *value*, a plain string, and the write-back would need to reassign that call expression, which the compiler rejects outright.',
    },
    {
      line: 15,
      text: 'Leaving off the parentheses lets the compiler see the binding target itself is a `WritableSignal`, so it reads it for display and rewires the write-back to `username.set($event)` instead of a plain, illegal assignment.',
    },
  ];

  /**
   * Sample: a form with no `(ngSubmit)` binding at all — the Predict below asks
   * what a click on Submit does.
   */
  protected readonly silentSubmitSample = `<form #f="ngForm">
  <input name="email" ngModel required email />
  <button type="submit">Submit</button>
</form>`;

  /**
   * Sample: the same required/email attributes as {@link silentSubmitSample},
   * minus `(ngSubmit)`'s absence — this time the field is left empty, so the
   * browser's own native validation is what intercepts the click. No
   * `novalidate` anywhere.
   */
  protected readonly nativeValidationSample = `<form #f="ngForm" (ngSubmit)="submit(f.value)">
  <input name="email" ngModel required email />
  <button type="submit">Submit</button>
</form>
<!-- the email field is left EMPTY. you click Submit. -->`;

  /**
   * Sample: under the hood — `ControlValueAccessor` as the DOM-to-model bridge,
   * and how `ngForm` assembles a value from named controls.
   */
  protected readonly underTheHoodSample = `// 1) The DOM <-> model bridge: ControlValueAccessor
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

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The bridge every custom form control has to implement to plug into `ngModel` (and reactive forms) the same way a plain `<input>` does: `writeValue` pushes the model into the DOM, `registerOnChange` wires the DOM back to the model, `registerOnTouched` wires up `blur`.',
    },
    {
      line: 12,
      text: 'A `Promise.resolve().then(...)` — a microtask — is what defers the actual `addControl` call. It runs after the current synchronous pass finishes, which is exactly why `f.value` can still read as an empty object inside `ngOnInit`: that hook runs before this microtask ever gets a turn.',
    },
    {
      line: 19,
      text: "`Validators.compose()` folds every attribute validator (`required`, `minlength`, ...) into one function. That's why `errors` can hold several keys at once even though only one validator is failing in practice — each contributes its own key.",
    },
    {
      line: 23,
      text: 'Everything downstream — `control.errors`, `control.valid`, the `ng-valid` / `ng-invalid` classes, and the `statusChanges` observable — is a live read of the state this one call produced. Nothing here is special-cased for `ngModel`; it is the same machinery reactive forms use.',
    },
  ];

  /**
   * The self-test: the microtask trap from `underTheHoodSample`, applied to a
   * concrete question. The distractors are the three ways a beginner
   * mis-explains an empty `f.value` in `ngOnInit` — assuming the DOM and the
   * model are the same thing, assuming "not ready" means "doesn't exist", and
   * assuming registration is instant once it has happened once.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: "An object matching what's in the inputs, like `{ name: '', email: '', plan: '' }`.",
      why: "Tempting, since that's what's on screen — but nothing has been written into `f.value` yet at this point. `f.value` is not a mirror of the DOM; it is built from controls that have to check in with `ngForm` first, and none of them have.",
    },
    {
      text: 'An empty object, with no keys at all.',
      correct: true,
      why: 'Each `ngModel` registers itself with the parent `NgForm` inside a microtask — deliberately deferred, to dodge an "expression changed after it was checked" error. `ngOnInit` runs **synchronously**, before that microtask gets a turn, so not one control has checked in by the time it runs.',
    },
    {
      text: "A runtime error, because `f` doesn't exist yet inside `ngOnInit`.",
      why: '`f` is built during the view\'s create pass, which finishes before `ngOnInit` runs — it exists, and `f.value` is a perfectly real, readable object. This mixes up **"not populated yet"** with **"not created yet"**, and only the first one is true here.',
    },
    {
      text: 'Whatever value was last typed, because `ngModel` writes into the form on every keystroke.',
      why: '`ngModel` really does write on every keystroke — **after** registration. `ngOnInit` fires while the page is still being built, before a human has had any chance to type, and before the microtask that would have wired a keystroke up to `f.value` in the first place.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does `ngModel` need a `name` inside a `<form>`?',
      a: 'The `name` is the key the control registers under on the parent `ngForm` — `form.value` is assembled entirely from those names. Leave it off and there is nowhere to put the value, so Angular throws rather than silently dropping it.',
    },
    {
      q: "What's actually different between `name` and `id` here?",
      a: '`id` only exists for the `<label for>` pairing and for CSS/JS hooks — the forms machinery never reads it. `name` (and `ngModelGroup` nesting) is the only thing that shapes `form.value`. Mixing the two up is a quiet way to end up with a control that looks fine on screen but never appears in the submitted object.',
    },
    {
      q: "Can I use `[(ngModel)]` on an input that isn't inside a `<form>`?",
      a: 'Yes — a bare `<input ngModel #x="ngModel">`, two-way bound or not, still gets a fully working `FormControl` behind it. It just never rolls up into anyone\'s `form.value`, because there is no `NgForm` for it to register with. Fine for a single search box; not fine once you need to submit several fields together.',
    },
    {
      q: 'I never wrote any code to stop the page reloading on submit — so why does it not reload?',
      a: '`NgForm` does that for you automatically, the moment `FormsModule` is imported and you have a `<form>` — it listens for the native `submit` event and calls `preventDefault()` on your behalf before it even looks at whether you bound `(ngSubmit)`. A plain HTML form, with no Angular involved at all, would reload the page.',
    },
    {
      q: "I pressed Enter with one field on screen and the form submitted — with three fields it didn't. What changed?",
      a: 'Nothing about Angular — that\'s a plain HTML rule called implicit submission: a form with exactly one text field treats Enter as a click on submit; add a second field and the browser stops guessing which action you meant, unless there is an actual submit button to target. Add `<button type="submit">` and Enter behaves the same way no matter how many fields there are.',
    },
  ];
}
