/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of "forms"
 * MC questions. Distractor text and answer index unchanged. */
export default {
  13: { answer: 1, options: [
    `Template-driven is faster; Reactive is the more powerful, flexible one`,
    `Template-driven derives its state from ngModel; Reactive builds it explicitly from FormControl`,
    `They are equivalent; teams merely prefer one form syntax over the other`,
    `Reactive forms support signals; Template-driven works only with zones here`,
  ] },
  35: { answer: 2, options: [
    `formArray.controls.push(new FormControl("")) — mutate raw controls array`,
    `formArray.add(new FormControl("")) — use FormArray add method`,
    `formArray.push(new FormControl("")) — the FormArray method that also notifies subscribers`,
    `formArray.append(new FormControl("")) — use FormArray append method`,
  ] },
  99: { answer: 1, options: [
    `It resets every control to its initial value and then marks them all pristine`,
    `It recursively marks every control in the group and its nested groups touched, revealing errors`,
    `It triggers the async validators on all of the controls simultaneously`,
    `It is basically equivalent to calling patchValue({}) on the whole group`,
  ] },
  102: { answer: 1, options: [
    `Subscribe to every single FormControl's valueChanges individually here`,
    `Subscribe to form.valueChanges; it emits the whole value object on any change`,
    `Use the (ngModelChange) event directly on the form tag in the template`,
    `Override ngOnChanges and inspect the whole form as a SimpleChange object`,
  ] },
  105: { answer: 1, options: [
    `It automatically adds a Validators.required validator to all of the fields`,
    `form.value and control.value are fully typed, so typos in control names are caught at compile time`,
    `It enables two-way binding between a FormGroup and an interface directly`,
    `Typed forms will automatically serialize themselves to JSON for a server`,
  ] },
  167: { answer: 1, options: [
    `It binds the form's submit event straight to the myForm method for you`,
    `It links the <form> element to the myForm FormGroup so child directives can resolve controls`,
    `It imports the FormGroup class directly into the template for you to use here`,
    `It automatically calls myForm.reset() every time the form is submitted`,
  ] },
  245: { answer: 1, options: [
    `ngModel is deprecated now; you are required to use a Reactive FormControl`,
    `Two-way [(ngModel)] needs FormsModule in the standalone component's imports array`,
    `The name field must be declared as a signal for ngModel to work at all`,
    `[(ngModel)] must be split into [ngModel] with a separate (ngModelChange)`,
  ] },
  323: { answer: 1, options: [
    `Bind [disabled]="isDisabled" on the input just like any other property`,
    `Use the reactive forms API instead: { value: "", disabled: true } or control.disable()/enable()`,
    `Just set control.readonly = true on the control and leave it at that here`,
    `Remove the control from the FormGroup entirely to disable it for the user`,
  ] },
  331: { answer: 1, options: [
    `It works fine — ngModel and formControlName just sync up automatically`,
    `Mixing ngModel with reactive form directives on one control is unsupported; pick one system`,
    `ngModel silently wins the conflict and the FormControl is quietly detached`,
    `It only actually breaks in the case where the form is submitted twice over`,
  ] },
};
