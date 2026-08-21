/** Fix the 10 strictly-shortest answers in "forms" left over after the
 * longest-push rebalance already met this category's ~25% quota. Each answer
 * is a length-verified mid-pack lengthening (checked against the live
 * distractor lengths so none of these accidentally become the new longest
 * and overshoot the quota). */
export default {
  37: { answer: 1, options: [
    `null — exactly the same as a passing synchronous validator would return`,
    `Observable<ValidationErrors | null>; status is PENDING while it resolves`,
    `A boolean: true while it is pending, or false once the check is complete`,
    `Some kind of ValidationPending sentinel object while it is still running`,
  ] },
  97: { answer: 1, options: [
    `Add the very same validator to each of the two FormControls individually`,
    `Add a validator onto the FormGroup; it can compare the two child values`,
    `Use a custom async validator that calls the server to verify the match`,
    `Subscribe to valueChanges and manually set an error on confirmPassword`,
  ] },
  321: { answer: 1, options: [
    `A special compiler mode that has no equivalent longhand form at all here`,
    `[ngModel]="name", plus (ngModelChange)="name = value" — input and output`,
    `A two-way binding straight to the DOM element's value attribute directly`,
    `A shortcut that creates a FormControl behind the scenes in reactive forms`,
  ] },
  322: { answer: 1, options: [
    `Immediately on page load, so that users know all of the rules upfront`,
    `Once the control is touched or dirty — any earlier just reads as nagging`,
    `Only after the entire form has already been submitted successfully once`,
    `Never — invalid controls really should just be silently ignored entirely`,
  ] },
  326: { answer: 1, options: [
    `ngSubmit is required here, or else Angular throws a runtime error at you`,
    `ngSubmit fires on click AND Enter, and it prevents the default page reload`,
    `A click handler is simply unable to call any component methods at all here`,
    `ngSubmit automatically validates the form and blocks invalid ones for you`,
  ] },
  107: { answer: 1, options: [
    `setValue() triggers validation while patchValue() bypasses all validators`,
    `setValue() requires every key or it throws; patchValue() updates only some`,
    `patchValue() works only on a FormArray while setValue() is for a FormGroup`,
    `They are entirely identical in both their behaviour and their output here`,
  ] },
  324: { answer: 0, options: [
    `FormControl, FormGroup, FormArray — one value, a keyed object, and a list`,
    `Input, Form, Button — the three HTML elements that Angular enhances here`,
    `Model, View, Controller — the classic MVC triad applied here onto forms`,
    `ngModel, ngForm, ngSubmit — the three main reactive forms directives here`,
  ] },
  332: { answer: 1, options: [
    `Nothing at all — control.events is merely an alias for valueChanges here`,
    `One typed stream of ALL events, now including touched and pristine changes`,
    `It replaces the form's validators with plain event handlers on the control`,
    `Synchronous access to future values even before the user has typed them in`,
  ] },
  98: { answer: 1, options: [
    `getRawValue() returns the values as strings; value returns typed values`,
    `value now drops disabled controls; getRawValue() includes every control`,
    `getRawValue() triggers validation to run, whereas plain value does not`,
    `They are completely identical in every modern version of Angular today`,
  ] },
  157: { answer: 1, options: [
    `compose() runs the validators in parallel; an array runs them one by one`,
    `They are quite identical; compose() just merges the validators into one fn`,
    `compose() short-circuits on the first error; an array always runs them all`,
    `compose() only works for the async validators, never the synchronous ones`,
  ] },
};
