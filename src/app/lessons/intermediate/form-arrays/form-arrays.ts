import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Lesson: FormArray — a dynamic, ordered list of controls (or groups) whose
 * LENGTH is decided at runtime. Covers building one with FormBuilder, adding
 * and removing controls, arrays of GROUPS vs arrays of PLAIN controls,
 * array-level validators, what actually happens inside push()/removeAt(),
 * and the classic track-by-index bug that makes rows "jump".
 */
@Component({
  selector: 'app-lesson-form-arrays',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe],
  templateUrl: './form-arrays.html',
  styleUrl: './form-arrays.css',
})
export class FormArrays {
  /**
   * Builds the form models.
   */
  private readonly fb = inject(FormBuilder);

  // --- Demo 1: FormArray of GROUPS (invoice line items) ---

  /**
   * The invoice demo's form: a title plus a `FormArray` of line-item groups.
   */
  protected readonly form = this.fb.group({
    title: ['Office supplies', Validators.required],
    items: this.fb.array([this.newItem('Notebook', 3)]),
  });

  /**
   * The line items, cast to `FormArray` — `form.get()` is typed as the
   * `AbstractControl` base, so the narrowing has to be asserted.
   */
  protected get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  /**
   * Builds one line-item group.
   *
   * A factory rather than a template object, because every row needs its **own**
   * control instances. Reusing one group across rows would make them share state.
   *
   * @param name Item name.
   * @param qty  Quantity.
   */
  private newItem(name = '', qty = 1) {
    return this.fb.group({
      name: [name, Validators.required],
      qty: [qty, [Validators.min(1)]],
    });
  }

  /**
   * Appends an empty line item.
   */
  protected add() {
    this.items.push(this.newItem());
  }

  /**
   * Removes a line item.
   *
   * @param i Position to drop.
   */
  protected remove(i: number) {
    this.items.removeAt(i);
  }

  // --- Demo 2: FormArray of PLAIN controls (tags) + an array-level validator ---

  /**
   * The tags demo's form: a `FormArray` of plain string controls rather than
   * groups, with the validator on the **array** rather than on its items.
   */
  protected readonly tagsForm = this.fb.group({
    tags: this.fb.array<string>(['angular', 'forms'], Validators.minLength(2)),
  });

  /**
   * The input for adding a tag. Outside the array, since it is not part of the
   * form's value.
   */
  protected readonly newTagCtrl = this.fb.nonNullable.control('');

  /**
   * The tags array, typed down to `FormControl<string>` so the template gets real
   * types on each item.
   */
  protected get tags(): FormArray<FormControl<string>> {
    return this.tagsForm.get('tags') as FormArray<FormControl<string>>;
  }

  /**
   * Adds a tag, ignoring blank input, and clears the input.
   */
  protected addTag() {
    const value = this.newTagCtrl.value.trim();
    if (!value) return;
    this.tags.push(this.fb.nonNullable.control(value));
    this.newTagCtrl.setValue('');
  }

  /**
   * Removes a tag.
   *
   * @param i Position to drop.
   */
  protected removeTag(i: number) {
    this.tags.removeAt(i);
  }

  // --- Code samples shown to the reader (kept as fields — see the "safe braces" note) ---

  /**
   * Sample: setting up a `FormArray` of groups.
   */
  readonly setupSample = `protected readonly form = this.fb.group({
  // A normal control alongside the array — a FormArray is just one more
  // member of the group, not a special top-level thing.
  title: ['Office supplies', Validators.required],
  // Seeded with one row so the form is never empty on first render.
  items: this.fb.array([this.newItem('Notebook', 3)]),   // a FormArray of groups
});

// A GETTER, not a field. The template calls items.controls in a loop, and a
// getter always reads the live array. It also keeps the cast in exactly one
// place instead of scattered through the template.
protected get items(): FormArray {
  // get() is typed loosely (AbstractControl | null), so the cast is what
  // gives you .push() and .removeAt() back.
  return this.form.get('items') as FormArray;
}

// A FACTORY for one row. Every add() call needs a brand-new FormGroup —
// reusing one instance would put the SAME control object in two rows, and
// typing in one would change both.
private newItem(name = '', qty = 1) {
  // Defaults let the same function serve both the seed row above and the
  // blank rows that add() creates.
  return this.fb.group({
    name: [name, Validators.required],
    qty: [qty, [Validators.min(1)]],
  });
}`;

  /**
   * Sample: adding and removing entries.
   */
  readonly addRemoveSample = `protected add() {
  // push() MUTATES the FormArray in place — and that is correct here. A
  // FormArray is not a signal; the template reads items.controls directly,
  // and the array's own change notification handles the rest.
  this.items.push(this.newItem());
}

protected remove(i: number) {
  // removeAt(i), not splice: it also unsubscribes the control and tells the
  // parent to re-run validation. Reaching into .controls yourself would
  // leave the form's validity stale.
  this.items.removeAt(i);
}
// Also available: insert(i, ctrl), clear(), at(i), and .length.`;

  /**
   * Sample: a `FormArray` of primitives, and validating the array itself.
   */
  readonly primitiveArraySample = `protected readonly tagsForm = this.fb.group({
  tags: this.fb.array<string>(['angular', 'forms'], Validators.minLength(2)),
  //    ^ array of plain FormControl<string>        ^ validator on the ARRAY, not the items
});

// The full generic FormArray<FormControl<string>> is worth spelling out: it
// makes tags.at(0).value a string rather than any, all the way down.
protected get tags(): FormArray<FormControl<string>> {
  return this.tagsForm.get('tags') as FormArray<FormControl<string>>;
}

protected addTag() {
  // Read from a SEPARATE control that is not part of the array — the input
  // box is UI state, not form data.
  const value = this.newTagCtrl.value.trim();
  // Guard against empty/whitespace-only tags before they reach the array.
  if (!value) return;
  // .nonNullable is what keeps the type FormControl<string> instead of
  // FormControl<string | null> — and it also means reset() returns to the
  // initial value rather than null.
  this.tags.push(this.fb.nonNullable.control(value));  // never null, matches string typing
  // Clear the input so the user can type the next tag straight away.
  this.newTagCtrl.setValue('');
}`;

  /**
   * Sample: what a `FormArray` actually is — a wrapper over a plain list of child
   * controls, which is why `push` and `removeAt` are all it needs.
   */
  readonly underTheHoodSample = `// Simplified shape of FormArray — a wrapper over a plain array of controls
class FormArray extends AbstractControl {
  controls: AbstractControl[] = [];        // ← the array IS this list

  push(control: AbstractControl) {
    this.controls.push(control);
    control.setParent(this);                // wire the control into the tree
    this.updateValueAndValidity();           // recompute + bubble to ancestors
  }

  removeAt(index: number) {
    this.controls[index]?.setParent(null);   // detach — no longer contributes
    this.controls.splice(index, 1);          // shifts every later control DOWN one index
    this.updateValueAndValidity();
  }

  get value() {
    return this.controls
      .filter((c) => c.enabled)              // ← why .value skips disabled controls
      .map((c) => c.value);
  }

  getRawValue() {
    return this.controls.map((c) => c.getRawValue?.() ?? c.value);  // ← includes disabled
  }
}`;

  /**
   * Sample: the mutate-don't-replace rule.
   *
   * Calling `setControl` with a **new** `FormArray` leaves every existing template
   * binding and subscription pointing at the old instance. They do not error; they
   * just stop updating, which is far harder to spot.
   */
  readonly wrongRightSample = `// WRONG — new FormArray instance: existing bindings/subscriptions go stale
this.form.setControl('items', new FormArray([
  this.newItem('A', 1), this.newItem('B', 2),
]));

// RIGHT — mutate the SAME FormArray instance
this.items.clear();                                             // detach every control, keep the array
rows.forEach((r) => this.items.push(this.newItem(r.name, r.qty))); // repopulate it`;
}
