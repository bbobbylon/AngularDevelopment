import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower } from '../../../shared/shapes';
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
 * ## Shape: `argument`
 *
 * The lesson opens on the echo loop itself: `writeValue`, `onChange` and
 * `FormControl` each did their own job correctly, and the bug is only in the
 * one call connecting two of them. {@link argRoundOne} stages all three
 * insisting they behaved exactly as documented; `app-brain-power` asks where
 * it went wrong if nobody did anything wrong; {@link argRoundTwo} has all
 * three deny responsibility before "You" names the one line that should
 * never have existed. `app-layers` answers the same split as a call-cascade
 * figure, the block's quiz is {@link quizOptions} — relocated from its
 * original spot in the "echo loop" section further down, which now leaves a
 * callback line instead of asking the identical question twice — and the
 * block closes on `app-napkin` with a microphone-feedback analogy, kept
 * deliberately separate from the "translator who must never talk to
 * themselves" analogy in the mental-model section just below, which explains
 * the full four-method contract rather than just this one failure mode. See
 * `docs/CONTRIBUTING.md` §2C.
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
    Layers,
    Napkin,
    BrainPower,
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
   * A second, independent quantity control — parked at 4 — for the
   * `registerOnValidatorChange` demo below.
   */
  protected readonly qtyRangeDemo = new FormControl(4);
  /**
   * The second stepper's `[max]` input, toggled between 5 and 3 while
   * {@link qtyRangeDemo}'s value stays put at 4 — so the reader watches the
   * form's status react to the *range itself* moving, not to a new value
   * being typed in.
   */
  protected readonly qtyRangeMax = signal(5);

  /**
   * Toggles the rating control's disabled state, so `setDisabledState` can be seen
   * firing.
   */
  protected toggleDisabled(): void {
    this.rating.disabled ? this.rating.enable() : this.rating.disable();
  }

  /** Flips {@link qtyRangeMax} between 5 and 3, without touching the control's value. */
  protected toggleQtyRangeMax(): void {
    this.qtyRangeMax.update((m) => (m === 5 ? 3 : 5));
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
   * The shape block's first round: `writeValue`, `onChange` and
   * `FormControl` each insisting — correctly — that they did their own job
   * right, which is exactly what makes the echo loop hard to spot from
   * inside any single method.
   */
  protected readonly argRoundOne: BubbleTurn[] = [
    {
      who: 'writeValue',
      says: 'The form asked me to render 4. I rendered 4. My job is done.',
    },
    {
      who: 'onChange',
      says: 'Right after that, someone called ME with 4 too. I did what I always do — reported it to the form as a change.',
    },
    {
      who: 'FormControl',
      says: 'And I did what I always do when onChange fires — updated my value and marked myself dirty. As far as I can tell, a user just typed 4.',
    },
    {
      who: 'writeValue',
      says: 'Nobody typed anything. I was the one who called onChange — from inside myself, right after I finished rendering.',
    },
    {
      who: 'onChange',
      says: "I can't tell the difference between 'a user pressed a key' and 'writeValue called me directly.' I only know one thing: I was invoked with 4.",
    },
    {
      who: 'FormControl',
      says: 'So from where I stand, this looks exactly like a real edit. I have no way to see that it came from my own setValue() bouncing back.',
    },
  ];

  /**
   * The shape block's second round: everyone denies responsibility before
   * "You" names the one call that should never have existed.
   */
  protected readonly argRoundTwo: BubbleTurn[] = [
    {
      who: 'writeValue',
      says: 'Not me — rendering the value the form hands me is literally my one job.',
    },
    {
      who: 'onChange',
      says: "Not me — I report whatever I'm called with. Nobody told me to check who called me.",
    },
    {
      who: 'FormControl',
      says: 'Not me — I can only react to the callback I was given. I have no way to see inside your component.',
    },
    {
      who: 'You',
      says: "It's mine. writeValue is IN — model to view, render only. onChange is OUT — view to model, report only. I wired the IN method to call the OUT one directly, the one connection this contract exists to prevent. Delete that line, and every party above goes back to doing exactly the job it already had.",
    },
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
   * Sample: the fourth `NG_VALUE_ACCESSOR` method nobody reaches for —
   * `registerOnValidatorChange` — and why `validate()` alone isn't enough
   * once the validator's own configuration is an `@Input`.
   */
  protected readonly validatorChangeSample = `private onValidatorChange: () => void = () => {};

// the fix: an effect that re-fires validation when min/max move
private readonly revalidateOnRangeChange = effect(() => {
  this.min();
  this.max();
  this.onValidatorChange();     // "hey form, re-run validate() — nothing else changed"
});

registerOnValidatorChange(fn: () => void): void {
  this.onValidatorChange = fn;  // the forms system hands you this in exchange
}`;

  /** Line-by-line walkthrough of {@link validatorChangeSample}. */
  protected readonly validatorChangeNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A fourth callback, alongside `onChange` and `onTouched` — but from `NG_VALIDATORS`, not `NG_VALUE_ACCESSOR`. Most custom controls that implement `Validator` never store this one.',
    },
    {
      line: 4,
      text: 'Reading `min()`/`max()` inside the effect is what makes it re-run every time either input changes — the same signal-dependency tracking every other effect in this app relies on.',
    },
    {
      line: 6,
      text: "This is the entire fix. It doesn't touch `control.value` at all — it just tells the forms system 'call `validate()` again,' which is the one thing nothing else in the CVA contract does when the validator's own rules move.",
    },
    {
      line: 9,
      text: 'The forms system calls this once, at setup, the same way it calls `registerOnChange` and `registerOnTouched` — handing you the function to fire whenever validation needs to be re-run for a reason that has nothing to do with the value itself.',
    },
  ];

  /**
   * The self-test on `registerOnValidatorChange`. The distractors are the
   * ways a reader reaches for the wrong half of the CVA contract to fix an
   * input-driven validation bug.
   */
  protected readonly validatorChangeQuizOptions: QuizOption[] = [
    {
      text: "Call `this.onChange(this.value())` from inside an effect that watches `min`/`max` — that's what re-runs validation.",
      why: 'That re-runs validation as a side effect, but it also reports the value to the form as if the user just edited it — flipping `dirty` and `touched` for a range change nobody asked the user about. It fixes the symptom by causing the echo-loop bug from the quiz above.',
    },
    {
      text: "Nothing to fix — `validate()` already reads `this.min()`/`this.max()`, so it's always using the current range.",
      why: '`validate()` reads the current range **whenever it runs** — the bug is that nothing tells the forms system to run it again. Angular only calls `validate()` on a value change (`setValue`, `onChange`, a sibling validator re-running); an `@Input` changing on its own triggers none of those.',
    },
    {
      text: 'Store the callback from `registerOnValidatorChange`, and call it from an effect that reads the inputs the validator depends on.',
      correct: true,
      why: "Exactly — this is what `registerOnValidatorChange` exists for. It's a direct request to the forms system to re-validate, entirely separate from the value-change machinery `onChange` drives.",
    },
    {
      text: "Angular already re-runs every control's validator on every change-detection cycle, so this can't actually be a bug.",
      why: 'Validators run on value changes, not on every CD pass — that would be enormously wasteful for anything with many controls. An `@Input` moving on its own is invisible to that mechanism, which is exactly why this bug ships silently in real code.',
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
