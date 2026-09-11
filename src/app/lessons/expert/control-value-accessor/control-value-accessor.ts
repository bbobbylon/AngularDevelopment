import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { StarRating } from './star-rating/star-rating';
import { QtyStepper } from './qty-stepper/qty-stepper';

/**
 * Lesson: `ControlValueAccessor` — the contract that makes ANY component a
 * first-class form control. Two live custom controls (a star rating, and a
 * quantity stepper that also validates itself), the two directions of the
 * bridge, how `formControlName` finds the accessor under the hood, and the
 * classic mistakes (missing `onChange`, the echo loop, forgotten `multi: true`).
 *
 * ## Presentation
 *
 * Follows the brain-friendly teaching order from `expert/change-detection`:
 * pose the problem (why does `<input>` work but your component doesn't?),
 * analogy before vocabulary (a translator who must never repeat a diplomat's
 * own words back to them), then the same mechanism in four modes — a flow
 * diagram of the round trip, a dialogue between `FormControl` and the CVA, an
 * annotated provider registration, and two live controls you can actually
 * click.
 */
@Component({
  selector: 'app-lesson-control-value-accessor',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    JsonPipe,
    StarRating,
    QtyStepper,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './control-value-accessor.css',
  templateUrl: './control-value-accessor.html',
})
export class ControlValueAccessorLesson {
  /** The star-rating control's form control. */
  protected readonly rating = new FormControl(3);
  /** The quantity stepper's form control. */
  protected readonly qty = new FormControl(1);

  /**
   * Toggles the rating control's disabled state, so `setDisabledState` can be seen
   * firing.
   */
  protected toggleDisabled(): void {
    this.rating.disabled ? this.rating.enable() : this.rating.disable();
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Forms track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Template Forms', id: 'template-forms' },
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'Form Arrays', id: 'form-arrays' },
    { label: 'Signal Forms', id: 'signal-forms' },
    { label: 'Custom Controls (CVA)' },
  ];

  /**
   * The round trip a value takes through a CVA, both directions in one
   * sequence. Deliberately one flow rather than two side by side: the point
   * is that they interleave — `writeValue` and `onChange` are two halves of
   * the same bridge, not two unrelated features.
   */
  protected readonly flowSteps: FlowStep[] = [
    {
      label: 'FormControl.setValue(4)',
      detail: 'Or patchValue, reset, or the initial value.',
      tone: 'accent',
    },
    { label: 'writeValue(4)', detail: "Your CVA renders 4 filled stars. That's model → view." },
    {
      label: 'user clicks the 2nd star',
      detail: 'A real DOM event, inside your component.',
      tone: 'accent',
    },
    {
      label: 'this.onChange(2)',
      detail: "The callback the form handed you in registerOnChange. That's view → model.",
    },
    {
      label: 'control.value = 2, dirty = true',
      detail: 'The form updates itself — you never touch control.value.',
    },
  ];

  /**
   * `FormControl` and the CVA, talking. Exists because the relationship
   * learners get backwards is which side initiates which method: they assume
   * the component "sends" its value, when really `onChange` is a callback the
   * *form* handed over, and `writeValue` is a call the *form* makes on you.
   */
  protected readonly bridgeTalk: BubbleTurn[] = [
    { who: 'FormControl', says: 'I just ran `setValue(4)`.' },
    {
      who: 'Your CVA',
      says: "That's model → view. I call my own `writeValue(4)` — render 4 filled stars. I never call `onChange` for this.",
    },
    { who: 'FormControl', says: 'Understood. Now — someone out there just clicked your 2nd star.' },
    {
      who: 'Your CVA',
      says: "View → model. I call the function you gave me in `registerOnChange` — `onChange(2)`. Then `onTouched()`, because they've left me.",
    },
    { who: 'FormControl', says: 'Value is 2 now. `dirty` is true, `touched` is true.' },
    {
      who: 'Your CVA',
      says: "And if you disable yourself? Call my `setDisabledState(true)` — I'll reflect it, or the whole API silently breaks.",
    },
  ];

  /**
   * Sample: registering with `NG_VALUE_ACCESSOR` — the entire act of
   * becoming a form control.
   */
  protected readonly registerSample = `@Component({
  selector: 'app-star-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRating),  // class defined below this point
    multi: true,                                // contribute, don't replace
  }],
})
export class StarRating implements ControlValueAccessor { … }`;

  /** Line-by-line walkthrough of {@link registerSample}. */
  protected readonly registerNotes: CodeNote[] = [
    {
      line: 1,
      text: "An ordinary component decorator. Nothing here says 'form control' yet — that comes entirely from the `providers` array below.",
    },
    {
      line: 4,
      text: '`NG_VALUE_ACCESSOR` is an Angular-defined injection token — a slot that `formControlName` looks up with `@Self()`. Providing against it is the entire act of becoming a form control.',
    },
    {
      line: 5,
      text: "`useExisting` reuses the component instance Angular already built for this element, not a new one. `forwardRef(() => StarRating)` defers reading the class until it exists, because this decorator runs while the class body underneath it hasn't finished being defined.",
    },
    {
      line: 6,
      text: '`multi: true` because `NG_VALUE_ACCESSOR` collects an **array** of providers, not one. Omit this and you replace whatever else was registered instead of adding to it.',
    },
    {
      line: 8,
      text: '`implements ControlValueAccessor` is a TypeScript-only promise — it buys you compile-time checking that all four methods exist, but Angular never checks for it at runtime. The `providers` array above is the only thing Angular actually reads.',
    },
  ];

  /**
   * Sample: a control that is also its own validator, via `NG_VALIDATORS`.
   * Comments trimmed to tags on purpose — the depth lives in
   * {@link validatorNotes} now, not in a wall of inline prose.
   */
  protected readonly validatorSample = `providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => QtyStepper), multi: true },
  { provide: NG_VALIDATORS,     useExisting: forwardRef(() => QtyStepper), multi: true },
]
export class QtyStepper implements ControlValueAccessor, Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as number;                    // typed any — a control can hold anything
    if (v < this.min()) return { qtyTooLow:  { min: this.min(), actual: v } };
    if (v > this.max()) return { qtyTooHigh: { max: this.max(), actual: v } };
    return null;                                           // null means VALID
  }
}`;

  /** Line-by-line walkthrough of {@link validatorSample}. */
  protected readonly validatorNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Two registrations of the **same class** against two **different** tokens — one makes it a value accessor, the other makes it a validator.',
    },
    {
      line: 3,
      text: '`useExisting` — not `useClass` — is what guarantees both tokens point at the same instance. `useClass` would build a second, disconnected `QtyStepper` that knows nothing about the first.',
    },
    {
      line: 5,
      text: '`Validator` is a second, independent contract. Nothing stops one class from implementing both — a control can be its own accessor and its own validator at once.',
    },
    {
      line: 6,
      text: '`validate()` is called **by** the forms system on every value change. You never call it yourself.',
    },
    {
      line: 8,
      text: "The **returned object** is the error. Its key (`qtyTooLow`) is what a template checks with `errors?.['qtyTooLow']`; the payload gives the template real numbers, so the message can say '3 is below the minimum of 1' instead of just 'invalid'.",
    },
    {
      line: 10,
      text: '`null` means **valid**. This trips everyone once: returning an object is failure, returning nothing is success — backwards from how error handling usually reads.',
    },
  ];

  /**
   * Sample: how `formControlName` finds the accessor — a `@Self()`
   * injection of the multi-provided `NG_VALUE_ACCESSOR` array, which is why
   * the provider has to be on the component itself.
   */
  protected readonly underHoodSample = `// inside the formControl/formControlName/ngModel directive (simplified):
constructor(
  @Self() @Optional() @Inject(NG_VALUE_ACCESSOR) accessors: ControlValueAccessor[],
  @Self() @Optional() @Inject(NG_VALIDATORS)     validators: Validator[],
) {
  this.valueAccessor = selectValueAccessor(accessors);
  // precedence: your custom CVA  >  built-in (checkbox/select/…)  >  DefaultValueAccessor
}

// setUpControl(control, dir) wires both directions:
dir.valueAccessor.writeValue(control.value);
dir.valueAccessor.registerOnChange((v) => updateControl(control, v));
dir.valueAccessor.registerOnTouched(() => control.markAsTouched());`;

  /** Line-by-line walkthrough of {@link underHoodSample}. */
  protected readonly underHoodNotes: CodeNote[] = [
    {
      line: 3,
      text: "`@Self()` restricts the lookup to **this element only** — not a parent, not a child. That's why the provider must sit on your own component, and why putting `formControlName` on a `<div>` with no accessor throws 'No value accessor' instead of quietly finding one further up the tree.",
    },
    {
      line: 6,
      text: 'If several accessors matched — rare, but possible — precedence picks yours first: custom beats built-in (checkbox, select, …), which beats `DefaultValueAccessor`.',
    },
    {
      line: 10,
      text: "The directive calls **your** `writeValue` with the control's current value once at setup, exactly the way `setValue` calls it later.",
    },
    {
      line: 11,
      text: '`registerOnChange` hands you a function that closes over `control` and `dir`. Store it; call it on every user edit. This one call is the entire reason `onChange` exists as a concept.',
    },
    {
      line: 12,
      text: 'Same idea for `onTouched` — one function, handed to you once, called by you on blur. Validators from `NG_VALIDATORS` on the same element compose with any validators passed to the `FormControl` directly.',
    },
  ];

  /** The self-test. Built around the trap that gives the lesson its name: the echo loop. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'Nothing — writeValue and onChange are independent methods, so calling one from the other is harmless.',
      why: "They're independent **methods**, but not independent **effects**. writeValue is called BY the form; onChange is a callback INTO the form. Calling one from the other wires the form's own output back into its own input.",
    },
    {
      text: 'The control silently ignores the value — nothing happens.',
      why: "The value isn't ignored, it's **echoed**. The whole problem is that something happens — just something nobody asked for.",
    },
    {
      text: "A feedback loop: the write you're rendering gets reported straight back to the form as if the user made it.",
      correct: true,
      why: "Exactly. writeValue(4) → your own onChange(4) → the form updates its model → anything that re-triggers writeValue (another bound control, a valueChanges subscriber) → writeValue fires again → onChange again. With two controls sharing a model, this is a visible ping-pong; with one, it's a control that reports itself as user-edited for a write nobody made.",
    },
    {
      text: 'Angular throws NG0100, because the value changed after the view was checked.',
      why: 'NG0100 is a change-detection-pass problem — a value changing DURING a dev-mode double-check. This is a data-flow problem: a programmatic write masquerading as user input. Different bug, similar "this feels unfair" energy.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "I put formControlName on my component and Angular threw 'No value accessor for form control name: rating'. What's wrong?",
      a: 'The element carrying `formControlName` provides no `NG_VALUE_ACCESSOR` — either your component forgot the provider (or the `multi: true`), or you put the directive on a plain `<div>`. The lookup is `@Self()`, so the accessor must be on that exact element, not a parent or a child.',
    },
    {
      q: 'The form stays pristine no matter what the user does. Which method is missing?',
      a: "Really, which call is missing: user edits reach the model only through `onChange(value)` — that call is what updates `control.value` AND flips `dirty` to true. If you're only updating your own internal signal and never calling the function `registerOnChange` gave you, the form never hears about it.",
    },
    {
      q: 'Why does form.reset() crash my control?',
      a: '`reset()` calls `writeValue(null)`. A `writeValue` that assumes a real value — `v.trim()`, `v.length` — throws on the very first reset. Normalize instead: `this.value.set(v ?? defaultValue)`.',
    },
    {
      q: "setValue() on one control causes a valueChanges storm on another control bound to the same model. What's actually happening?",
      a: 'A CVA calling `onChange` inside `writeValue` — the echo loop from above. Programmatic write → writeValue → onChange → model update → writeValue on the OTHER control → its own onChange → … Keep the two directions strictly separate; writeValue only ever renders.',
    },
    {
      q: 'How do I add validation that lives inside the control itself, instead of making every consumer write it?',
      a: "Implement `Validator` too (`validate(control)` returning `ValidationErrors | null`) and register the same class under `NG_VALIDATORS` with `multi: true` and `useExisting: forwardRef(...)` — exactly like the quantity stepper above. For a rule that needs a server round-trip, it's the async sibling: `AsyncValidator` + `NG_ASYNC_VALIDATORS`.",
    },
  ];
}
