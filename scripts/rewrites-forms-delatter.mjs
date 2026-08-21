// Rewrites for the 17 'forms'-category questions whose explanations referenced
// distractors by bare original (unshuffled) letter (e.g. "A is wrong", "C describes...").
// Each entry replaces the letter references with content-based identification of the
// referenced option, preserving the original technical reasoning (and adding real
// reasoning anywhere a bare, content-free letter reference existed).
//
// Consumed by scripts/apply-option-rewrites.mjs — do not run that here.

export default {
  96: {
    options: [
      "The control's current value is reset on every single blur event fired",
      'Validators and valueChanges fire on blur, not on each keystroke typed',
      'The control becomes read-only right after the very first blur happens',
      'The control marks itself touched on blur (which the default already does)',
    ],
    answer: 1,
    explanation: `By default \`updateOn\` is \`"change"\` — validators run and \`valueChanges\` fires on every keystroke. \`"blur"\` defers this to when focus leaves the field, and \`"submit"\` defers to form submission. This is a UX improvement: the user does not see a "required" error as they begin typing. The claim that the control's value is reset on every blur is wrong — \`updateOn\` only changes when validation and \`valueChanges\` fire, not the value itself. The claim that the control becomes read-only after the first blur is also wrong — \`updateOn\` has no effect on editability. And marking the control touched on blur already happens by default regardless of the \`updateOn\` setting — that's a separate, unrelated mechanism.`,
  },
  97: {
    options: [
      'Add the very same validator to each of the two FormControls individually',
      'Add a validator onto the FormGroup; it can compare the two child values',
      'Use a custom async validator that calls the server to verify the match',
      'Subscribe to valueChanges and manually set an error on confirmPassword',
    ],
    answer: 1,
    explanation: `Group-level validators receive the \`FormGroup\` itself. Inside the validator: \`const g = control as FormGroup; return g.get("password")?.value === g.get("confirmPassword")?.value ? null : { mismatch: true }\`. This keeps the logic co-located with the group. Adding the same validator to each FormControl individually doesn't work — a control-level validator only receives that single control, not its siblings, so it has no way to compare the two values. Using a custom async validator that calls the server is unnecessary — a client-side match check needs no round trip to a backend. Subscribing to \`valueChanges\` and manually setting the error works but is imperative and error-prone — it's easy to forget to clear the error once the values later match, and it duplicates logic the group-level validator already gives you for free.`,
  },
  98: {
    options: [
      'getRawValue() returns the values as strings; value returns typed values',
      'value now drops disabled controls; getRawValue() includes every control',
      'getRawValue() triggers validation to run, whereas plain value does not',
      'They are completely identical in every modern version of Angular today',
    ],
    answer: 1,
    explanation: `\`FormGroup.value\` omits any control that is \`disabled\` — this protects against inadvertently submitting fields the user cannot edit. \`getRawValue()\` returns the complete model including disabled controls. Use \`getRawValue()\` when you need to read a disabled field's value (e.g., a pre-filled user ID in a record-update form). The claim that \`getRawValue()\` returns strings while \`value\` returns typed values is wrong — both preserve the controls' actual value types; neither coerces to string. The claim that \`getRawValue()\` triggers validation is also wrong — neither accessor runs validators, they're pure value reads. And they are not identical — they diverge specifically once the group contains disabled controls.`,
  },
  99: {
    options: [
      'It resets every control to its initial value and then marks them all pristine',
      'It recursively marks every control in the group and its nested groups touched, revealing errors',
      'It triggers the async validators on all of the controls simultaneously',
      'It is basically equivalent to calling patchValue({}) on the whole group',
    ],
    answer: 1,
    explanation: `Angular validation errors are typically shown only after \`touched === true\`. If a user skips required fields and hits Submit, calling \`this.form.markAllAsTouched()\` in the submit handler forces all error messages to appear. \`markAllAsTouched()\` recursively touches every control in nested \`FormGroup\`s and \`FormArray\`s. Resetting every control to its initial value and marking them pristine is what \`reset()\` does, not \`markAllAsTouched()\` — the two are unrelated methods. Triggering the async validators simultaneously is also wrong — \`markAllAsTouched()\` only changes touched state, it never invokes validation. And it's nothing like calling \`patchValue({})\` on the group — an empty \`patchValue({})\` call updates nothing at all, since no keys are supplied.`,
  },
  100: {
    options: [
      'It prevents any null values from ever being submitted to the server here',
      'Controls reset to their initial value, not null, when reset() is called',
      'It adds a Validators.required validator onto every one of the controls',
      'It makes each control read-only so their values cannot be set to null',
    ],
    answer: 1,
    explanation: `By default, \`formControl.reset()\` sets the value to \`null\`. \`FormBuilder.nonNullable\` (or \`new FormControl("initial", { nonNullable: true })\`) changes \`reset()\` to restore the initial value. This is critical for typed forms — \`FormControl<string>\` should never hold \`null | string\` unless intended. The claim that it prevents null values from ever being submitted to the server is wrong — \`nonNullable\` has no effect on server submission; it only changes what \`reset()\` restores. The claim that it adds a \`Validators.required\` validator is also wrong — no validators are added at all. And it doesn't make the control read-only either — the value can still be set normally; only the \`reset()\` fallback behavior changes.`,
  },
  101: {
    options: [
      'map() is not allowed to return null here — you must use filter() instead',
      'Fast typing overlaps requests; a stale response can win — use switchMap',
      'The validator must return Observable<ValidationErrors | null>, not this',
      'Async validators are required to return a Promise, never an Observable',
    ],
    answer: 1,
    explanation: `Angular calls the async validator on every value change (or on blur with \`updateOn: "blur"\`). Without debouncing and cancellation, rapid typing spawns multiple concurrent HTTP requests. If the request for "ali" arrives after "alice" was already validated, the form shows stale state. Fix: wrap in \`switchMap\`: \`return control.valueChanges.pipe(debounceTime(300), take(1), switchMap(val => http.get(...)), ...)\`. The validator itself should also be debounced at the control level. The claim that \`map()\` can't return \`null\` and needs \`filter()\` instead is wrong — returning \`null\` from \`map()\` to signal "no errors" is exactly the expected pattern for a validator. The claim that the return type is wrong is also incorrect — \`http.get(...).pipe(map(...))\` here does produce \`Observable<ValidationErrors | null>\`, the correct signature. And async validators are not required to return a Promise — returning an Observable, as this code does, is equally valid.`,
  },
  102: {
    options: [
      "Subscribe to every single FormControl's valueChanges individually here",
      'Subscribe to form.valueChanges; it emits the whole value object on any change',
      'Use the (ngModelChange) event directly on the form tag in the template',
      'Override ngOnChanges and inspect the whole form as a SimpleChange object',
    ],
    answer: 1,
    explanation: `\`FormGroup.valueChanges\` is an Observable that emits the full form value object whenever any control changes. You can pipe it through \`debounceTime\`, \`distinctUntilChanged\`, etc. for autosave or preview features. Subscribing to every individual FormControl's \`valueChanges\` works but is verbose and misses changes bubbling up from nested groups or arrays. Using \`(ngModelChange)\` on the form tag is template-driven forms syntax and doesn't apply in a reactive forms setup. Overriding \`ngOnChanges\` is for reacting to \`@Input()\` property changes on a component, not for observing form value changes — it has nothing to do with \`FormGroup\` at all.`,
  },
  104: {
    options: [
      'It emits the validation errors object each time that validation fails',
      "It emits VALID, INVALID or PENDING whenever the control's status changes",
      'It emits the total number of currently failed validators, as a count',
      'It only emits when a control moves from VALID straight to the INVALID state',
    ],
    answer: 1,
    explanation: `\`control.statusChanges\` is an Observable<FormControlStatus> emitting \`"VALID"\`, \`"INVALID"\`, \`"PENDING"\`, or \`"DISABLED"\` on every status transition. The \`"PENDING"\` state is particularly useful: subscribe and show a spinner while async validators are in flight. Emitting the validation errors object is what \`control.errors\` (a plain property, not an Observable) provides, not \`statusChanges\`. Emitting a count of failed validators is also wrong — \`statusChanges\` never emits a number, only the status strings. And it isn't limited to VALID→INVALID transitions — it emits on every status transition, including into and out of PENDING and DISABLED.`,
  },
  105: {
    options: [
      'It automatically adds a Validators.required validator to all of the fields',
      'form.value and control.value are fully typed, so typos in control names are caught at compile time',
      'It enables two-way binding between a FormGroup and an interface directly',
      'Typed forms will automatically serialize themselves to JSON for a server',
    ],
    answer: 1,
    explanation: `Before typed forms, \`form.get("name")?.value\` returned \`any\`. With typed forms, \`this.form.controls.name.value\` is \`string\` — TypeScript catches typos in control names and type mismatches at compile time. This dramatically reduces runtime errors in large forms. Automatically adding a \`Validators.required\` validator to every field is wrong — typed forms add compile-time type information only, not runtime validators. Enabling two-way binding between a FormGroup and an interface is also wrong — reactive forms are still explicitly wired up via the FormBuilder/constructor calls; typing doesn't create implicit bindings. And there's no automatic JSON serialization either — \`.value\`/\`.getRawValue()\` still return plain objects exactly as before; typing only changes their inferred TypeScript type.`,
  },
  106: {
    options: [
      'Assign it: this.form.controls["newField"] = new FormControl("") directly here',
      'Call this.form.addControl("newField", new FormControl("")) to register it',
      'Call this.form.push(new FormControl("")) to add the new field to it here',
      'Use this.form.patch({ newField: new FormControl("") }) to add it in here',
    ],
    answer: 1,
    explanation: `\`FormGroup.addControl(name, control)\` registers the control and triggers valueChanges/statusChanges. Directly assigning to \`this.form.controls["newField"]\` is wrong — it bypasses Angular's internal bookkeeping, so the new control never gets properly registered with the parent, its \`valueChanges\`/\`statusChanges\` don't propagate, and the form's own value/status won't reflect it. Calling \`this.form.push(...)\` is wrong because \`push\` is a \`FormArray\` method, not a \`FormGroup\` method — \`FormGroup\` has no \`push\`. And \`patch({...})\` (like the real \`patchValue\`) only updates the values of controls that already exist — it can't add new structure to the form.`,
  },
  107: {
    options: [
      'setValue() triggers validation while patchValue() bypasses all validators',
      'setValue() requires every key or it throws; patchValue() updates only some',
      'patchValue() works only on a FormArray while setValue() is for a FormGroup',
      'They are entirely identical in both their behaviour and their output here',
    ],
    answer: 1,
    explanation: `\`setValue()\` requires an object with a key for EVERY control in the group — omitting any key throws "Must supply a value for form control with name: X". \`patchValue()\` only updates the controls whose keys are present in the object; unspecified controls retain their current value. Use \`setValue()\` for full model replacement; \`patchValue()\` for partial updates (e.g., pre-filling only some fields from an API response). The claim that \`setValue()\` triggers validation while \`patchValue()\` bypasses all validators is wrong — both methods run validation and update status as normal; the difference is only in which controls must be supplied. The claim that \`patchValue()\` is FormArray-only and \`setValue()\` is FormGroup-only is also wrong — both methods exist on \`FormGroup\`, \`FormArray\`, and \`FormControl\` alike. And they are not identical — \`setValue()\`'s strict, all-keys-required behavior versus \`patchValue()\`'s partial-update behavior is the whole point of having both.`,
  },
  108: {
    options: [
      'control.validators.push(Validators.required)',
      'control.addValidators(Validators.minLength(5)) followed by control.updateValueAndValidity()',
      'control.setValidators() replaces and addValidators() appends — call updateValueAndValidity() after either to re-run validation',
      'Both B and C are correct — B describes addValidators, C clarifies the full picture',
    ],
    answer: 3,
    explanation: `\`addValidators(v)\` appends without removing existing validators; \`setValidators(v)\` replaces all validators. In both cases you MUST call \`control.updateValueAndValidity()\` afterwards to re-trigger validation with the new set of validators. Pushing directly onto \`control.validators\` is wrong — \`validators\` is not a publicly mutable array; there is no supported way to mutate Angular's internal validator list that way. Describing only \`addValidators()\` followed by \`updateValueAndValidity()\` is correct but incomplete by itself, since it says nothing about how \`setValidators()\` differs (replacing rather than appending). Spelling out that \`setValidators()\` replaces while \`addValidators()\` appends, with \`updateValueAndValidity()\` required after either, gives the complete rule. Since both of those explanations are individually accurate and together cover the full picture, affirming that both are correct is itself the most complete and accurate answer.`,
  },
  157: {
    options: [
      'compose() runs the validators in parallel; an array runs them one by one',
      'They are quite identical; compose() just merges the validators into one fn',
      'compose() short-circuits on the first error; an array always runs them all',
      'compose() only works for the async validators, never the synchronous ones',
    ],
    answer: 1,
    explanation: `Angular's form control automatically composes multiple validators from an array, so \`[v1, v2]\` and \`Validators.compose([v1, v2])\` are equivalent. \`compose()\` is useful when an API expects a single \`ValidatorFn\` but you need to combine multiple — for example, passing to \`AbstractControl.setValidators()\`. The claim that \`compose()\` runs validators in parallel while an array runs them one by one is wrong — both approaches simply run every validator in the set; there's no parallel/sequential distinction in outcome. The claim that \`compose()\` short-circuits on the first error is also wrong — no short-circuiting occurs in either case, all validators always run and their errors are merged into one object. And \`compose()\` isn't limited to async validators — it composes synchronous \`ValidatorFn\`s (there's a separate \`Validators.composeAsync\` for the async case).`,
  },
  167: {
    options: [
      "It binds the form's submit event straight to the myForm method for you",
      'It links the <form> element to the myForm FormGroup so child directives can resolve controls',
      'It imports the FormGroup class directly into the template for you to use here',
      'It automatically calls myForm.reset() every time the form is submitted',
    ],
    answer: 1,
    explanation: `\`[formGroup]="myForm"\` sets up the reactive forms context. It bridges the FormGroup model in the component class with the \`<form>\` element in the template. Child \`formControlName="email"\` directives then look up their controls in \`myForm\`. Without \`[formGroup]\`, \`formControlName\` has no context to look controls up in and throws. Binding the form's submit event is wrong — that's what \`(ngSubmit)\` is for, a separate binding entirely. Importing the FormGroup class into the template is also wrong — \`[formGroup]\` doesn't import anything, it's a property binding to an existing FormGroup instance already created in the component class. And it doesn't automatically call \`reset()\` on submission — the value simply stays as the user left it unless the component explicitly resets it.`,
  },
  177: {
    options: [
      'FormArray holds primitive values like strings — a multi-value FormControl',
      'FormArray manages an ordered, dynamic list of controls you add or remove',
      'FormArray is a deprecated alternative to FormGroup for the flat forms here',
      'FormArray binds to a <select multiple> element for multi-value selection',
    ],
    answer: 1,
    explanation: `\`FormArray\` is the right tool when the number of controls is dynamic. \`this.form.get("phones") as FormArray\` holds an arbitrary number of phone \`FormGroup\`s. Use \`array.push(new FormGroup({...}))\` to add and \`array.removeAt(i)\` to remove. \`array.controls\` iterates the current controls. The claim that it just holds primitive values like a multi-value \`FormControl\` is wrong — its elements are full \`AbstractControl\`s (which can themselves be \`FormGroup\`s, \`FormControl\`s, or nested \`FormArray\`s), not raw primitives. The claim that it's a deprecated alternative to \`FormGroup\` is also wrong — it's not deprecated, and it solves a different problem (an ordered, indexable list) than \`FormGroup\` (a fixed set of named controls). And it has no special binding to \`<select multiple>\` — that's an unrelated native HTML control with no automatic FormArray wiring.`,
  },
  194: {
    options: [
      'dirty means that validation failed, while touched means the user interacted',
      'dirty means the value changed; touched means it was focused then blurred',
      'They are identical — both turn true the moment the user types in a field',
      'dirty tracks async validation state while touched tracks sync validation',
    ],
    answer: 1,
    explanation: `\`dirty\` tracks VALUE changes; \`touched\` tracks focus/blur interactions. Typical pattern: show validation errors when \`control.invalid && control.touched\` (user has visited but has an error). Show "unsaved changes" warnings when \`form.dirty\` (value changed from saved state). \`markAsDirty()\` and \`markAsTouched()\` can set these programmatically. The claim that \`dirty\` means validation failed is wrong — \`dirty\` has nothing to do with validation outcome, only with whether the value has changed from its initial state; validation failure is reflected in \`invalid\`/\`errors\` instead. They aren't identical either — \`touched\` requires a blur after focus, so a control can become \`dirty\` (value changed) while the user is still typing, well before it becomes \`touched\`. And neither property tracks validation timing — \`dirty\`/\`touched\` are purely about value-change and focus/blur interaction, unrelated to whether validators are synchronous or asynchronous.`,
  },
  196: {
    options: [
      'You simply cannot check form.valid synchronously the way this code does',
      'Disabled controls are dropped from form.value; use getRawValue() instead',
      'The save() call really ought to be wrapped inside a try/catch block here',
      'You must call form.markAllAsTouched() before you check form.valid at all',
    ],
    answer: 1,
    explanation: `\`FormGroup.value\` silently excludes disabled controls. If your form has a pre-filled, disabled "userId" field, \`this.form.value\` will NOT include it. \`this.form.getRawValue()\` returns ALL controls regardless of disabled state. This is a subtle bug that causes silent data loss — the save request goes through but without the disabled field's value. The claim that \`form.valid\` can't be checked synchronously is wrong — reading \`form.valid\` synchronously like this is completely normal, as long as no async validators are still pending (in which case the status reads PENDING rather than a stale true/false). Wrapping \`save()\` in a try/catch would be reasonable defensive coding in general, but it doesn't address the actual data-loss bug in this handler. And calling \`markAllAsTouched()\` first is a good UX improvement — it makes error messages visible on an invalid, untouched form — but it's unrelated to the bug being asked about here, which is about which data gets submitted, not about error visibility.`,
  },
};
