import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
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
 * Lesson: FormArray — a dynamic, ordered list of controls (or groups) whose
 * LENGTH is decided at runtime. Covers building one with FormBuilder, adding
 * and removing controls, arrays of GROUPS vs arrays of PLAIN controls,
 * array-level validators, what actually happens inside push()/removeAt(),
 * and the classic track-by-index bug that makes rows "jump".
 */
@Component({
  selector: 'app-lesson-form-arrays',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    JsonPipe,
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

  // --- Demo 1B: hydrating a FormArray from server data ---

  /**
   * Stand-in for what an "edit this invoice" API call would return — an
   * existing invoice with THREE line items, while both demo forms below
   * still start with just the one seeded row.
   */
  private readonly serverInvoice = {
    title: 'Consulting — March',
    items: [
      { name: 'Discovery call', qty: 1 },
      { name: 'Wireframes', qty: 2 },
      { name: 'Review session', qty: 1 },
    ],
  };

  /** Naive hydrate form — never resized before the server data is applied. */
  protected readonly naiveHydrateForm = this.fb.group({
    title: [''],
    items: this.fb.array([this.newItem()]),
  });

  protected get naiveHydrateItems(): FormArray {
    return this.naiveHydrateForm.get('items') as FormArray;
  }

  /** Fixed hydrate form — resized to match before the server data lands. */
  protected readonly fixedHydrateForm = this.fb.group({
    title: [''],
    items: this.fb.array([this.newItem()]),
  });

  protected get fixedHydrateItems(): FormArray {
    return this.fixedHydrateForm.get('items') as FormArray;
  }

  /** Signal so the demo can show, in words, what patchValue() actually did. */
  protected readonly naiveHydrateLog = signal<string | null>(null);

  /** Signal so the demo can show, in words, what setValue() actually did. */
  protected readonly fixedHydrateLog = signal<string | null>(null);

  /**
   * The bug: patchValue() only ever writes into indices that ALREADY exist.
   * It never adds rows, so item 2 and item 3 vanish with no error at all.
   */
  protected hydrateNaive() {
    this.naiveHydrateForm.patchValue(this.serverInvoice);
    const kept = this.naiveHydrateItems.length;
    const sent = this.serverInvoice.items.length;
    this.naiveHydrateLog.set(
      `patchValue() wrote into ${kept} of ${sent} rows — the array was never resized, so rows ${kept + 1}–${sent} were silently dropped.`,
    );
  }

  /**
   * The fix: resize the array to match the incoming data's length FIRST,
   * then call setValue() — which requires an exact length match and throws
   * instead of guessing, so a real mismatch would fail loudly here.
   */
  protected hydrateFixed() {
    this.fixedHydrateItems.clear();
    this.serverInvoice.items.forEach(() => this.fixedHydrateItems.push(this.newItem()));
    this.fixedHydrateForm.setValue(this.serverInvoice);
    this.fixedHydrateLog.set(
      `Resized to ${this.fixedHydrateItems.length} rows first, then setValue() filled every one of them.`,
    );
  }

  /**
   * Resets both hydrate demos back to their single seeded row.
   */
  protected resetHydrateDemo() {
    this.naiveHydrateItems.clear();
    this.naiveHydrateItems.push(this.newItem());
    this.naiveHydrateForm.get('title')?.setValue('');
    this.naiveHydrateLog.set(null);

    this.fixedHydrateItems.clear();
    this.fixedHydrateItems.push(this.newItem());
    this.fixedHydrateForm.get('title')?.setValue('');
    this.fixedHydrateLog.set(null);
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

  /**
   * Sample: resizing before hydrating from server data — the fix behind the
   * demo above.
   */
  readonly hydrateSample = `protected hydrateNaive() {
  // BUG: patchValue() only writes into indices that ALREADY exist. It never
  // adds rows on its own, so if the array has 1 row and the server sent 3
  // items, items 2 and 3 vanish — no error, no warning, just missing data.
  this.form.patchValue(this.serverInvoice);
}

protected hydrateFixed() {
  // FIX, step 1: resize the array to match the incoming data FIRST.
  this.items.clear();
  this.serverInvoice.items.forEach(() => this.items.push(this.newItem()));

  // FIX, step 2: NOW set the values. setValue() is the stricter sibling of
  // patchValue() — it requires an EXACT length/shape match and THROWS if one
  // is missing, instead of silently dropping it. That's a feature here: any
  // real mismatch fails loudly right where the bug is, not three screens away.
  this.form.setValue(this.serverInvoice);
}`;

  /**
   * Compare panel: template wiring for an array of groups.
   */
  readonly groupBindingSample = `<div formArrayName="items">
  @for (item of items.controls; track item; let i = $index) {
    <div [formGroupName]="i">
      <input formControlName="name" />
      <input formControlName="qty" />
    </div>
  }
</div>`;

  /**
   * Compare panel: template wiring for an array of plain controls.
   */
  readonly plainBindingSample = `<div formArrayName="tags">
  @for (tag of tags.controls; track tag; let i = $index) {
    <input [formControlName]="i" />
  }
</div>`;

  // ── brain-friendly content ──

  /**
   * Chapter rail: this lesson's Forms track (intermediate level only —
   * template-forms is beginner, control-value-accessor is expert).
   */
  readonly stops: ChapterStop[] = [
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Form Validation', id: 'form-validation' },
    { label: 'Async Validators', id: 'async-validators' },
    { label: 'FormArray' },
    { label: 'Signal Forms', id: 'signal-forms' },
  ];

  /**
   * Bridge dialogue: FormArray mutates in place — which sounds wrong right
   * after a lesson (HttpClient CRUD) that spent a whole section insisting
   * HttpParams must never be mutated. This resolves that apparent conflict.
   */
  readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'Wait — the HttpParams lesson said always copy, never mutate. But items.push() mutates the array directly. Which rule is right?',
    },
    {
      who: 'FormArray',
      says: "Both, for different reasons. HttpParams is meant to look immutable — it's a value. I'm a mutable node in the form's control tree; my whole job is to notify my parent when I change.",
    },
    { who: 'You', says: 'So push() is fine because you’re not a signal or a value type.' },
    {
      who: 'FormArray',
      says: "Right. I call updateValueAndValidity() on myself, then on my parent, all the way up. That's my version of a signal write — it's just a convention, not something the framework forces on me.",
    },
  ];

  /**
   * Line-by-line notes for `setupSample`.
   */
  readonly setupNotes: CodeNote[] = [
    {
      line: 1,
      text: 'this.fb.group({ … }) is FormBuilder shorthand for new FormGroup({ … }) — each property becomes a control.',
    },
    {
      line: 4,
      text: 'A plain top-level control with a starting value and one synchronous validator — nothing FormArray-specific yet.',
    },
    {
      line: 6,
      text: 'The important line: fb.array(...) creates a FormArray seeded with one FormGroup. That FormArray is itself just a control nested under "items".',
    },
    {
      line: 12,
      text: 'A GETTER, not a field — always reads the live array, and keeps the AbstractControl → FormArray cast in exactly one place.',
    },
    {
      line: 15,
      text: 'The cast is required: get() returns AbstractControl | null, and only FormArray has .push()/.removeAt().',
    },
    {
      line: 21,
      text: 'A FACTORY, not a stored instance — reusing one FormGroup object across rows would bind every row’s inputs to the same control.',
    },
    {
      line: 26,
      text: 'The array-of-validators form, used once a control needs more than one synchronous validator.',
    },
  ];

  /**
   * Line-by-line notes for `addRemoveSample`.
   */
  readonly addRemoveNotes: CodeNote[] = [
    {
      line: 5,
      text: 'push() appends to the end of the internal controls list and immediately recomputes value/validity — no separate "refresh the form" step.',
    },
    {
      line: 12,
      text: 'removeAt(i) detaches the control (setParent(null)) then splices it out — every later control shifts DOWN one index. That shift is exactly why tracking matters, below.',
    },
    { line: 14, text: 'Also on FormArray: insert(i, ctrl), clear(), at(i), and .length.' },
  ];

  /**
   * Line-by-line notes for `primitiveArraySample`.
   */
  readonly primitiveArrayNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The initial items are plain strings, auto-boxed to FormControl<string>. The 2nd argument is a validator on the ARRAY control itself, not on any item.',
    },
    {
      line: 8,
      text: 'Typed reactive forms: cast to the precise generic, so .controls gives FormControl<string>[] instead of AbstractControl[].',
    },
    {
      line: 15,
      text: 'A SEPARATE control outside the array — the input box is UI state, not form data.',
    },
    {
      line: 21,
      text: 'fb.nonNullable keeps the type string, not string | null — required here since the array itself is typed string.',
    },
  ];

  /**
   * Line-by-line notes for `wrongRightSample`.
   */
  readonly wrongRightNotes: CodeNote[] = [
    {
      line: 2,
      text: 'setControl swaps in a brand-new FormArray instance. Any binding or subscription still pointing at the OLD one goes stale — silently, no error.',
    },
    {
      line: 7,
      text: 'clear() empties the SAME array instance — every control gets setParent(null), then the list empties. Bindings to the array itself stay valid.',
    },
    {
      line: 8,
      text: 'Repopulates the same array by pushing fresh rows — exactly the pattern add() already uses, one row at a time.',
    },
  ];

  /**
   * Line-by-line notes for `hydrateSample`.
   */
  readonly hydrateNotes: CodeNote[] = [
    {
      line: 4,
      text: 'patchValue() never adds or removes controls — it only writes into indices the array already has. Extra server data past the current length is silently ignored.',
    },
    {
      line: 10,
      text: "clear() empties the array (detaching every control), then push() adds exactly enough fresh rows to match the incoming data's length — before any value is set.",
    },
    {
      line: 17,
      text: 'setValue() demands an EXACT length/shape match and throws otherwise — the opposite tradeoff from patchValue(), and the reason it only becomes safe to call once the resize above has already happened.',
    },
  ];

  /**
   * The push()/removeAt() lifecycle, as a visual flow — matches "Under the
   * hood" below.
   */
  readonly pushRemoveFlow: FlowStep[] = [
    { label: 'push(control)', detail: 'Appends to the plain controls array', tone: 'default' },
    {
      label: 'control.setParent(this)',
      detail: 'Wires the new control into the tree',
      tone: 'default',
    },
    {
      label: 'updateValueAndValidity()',
      detail: 'Recomputes this control, then bubbles to every ancestor',
      tone: 'accent',
    },
    {
      label: 'removeAt(i)',
      detail: 'Detaches control i, then splices — every LATER control shifts down one index',
      tone: 'warn',
    },
    {
      label: 'form.value / form.valid update',
      detail: 'Reflects the new shape immediately — no manual refresh',
      tone: 'good',
    },
  ];

  /**
   * Self-test: where an array-level validator belongs.
   */
  readonly minLengthQuizOptions: QuizOption[] = [
    {
      text: "On each tag's own FormControl, e.g. fb.control(value, Validators.required)",
      why: "That only checks each tag's own text isn't blank — it says nothing about how many tags exist.",
    },
    {
      text: 'As the second argument to fb.array(controls, Validators.minLength(1))',
      correct: true,
      why: "This attaches the validator to the FormArray control itself, which checks the length of the array's OWN value — independent of any one item.",
    },
    {
      text: 'On the parent FormGroup that contains the array',
      why: 'The parent group only knows about controls named by key (title, tags, …) — it has no way to see "how many items are inside tags" from there.',
    },
  ];

  /**
   * Exam-corner questions, ported from the original detail/summary blocks.
   */
  readonly questions: FaqItem[] = [
    {
      q: 'Why track by the control instance, not $index?',
      a: 'Indices shift when you remove a row, so track $index re-associates controls with the wrong DOM and values appear to jump. The control instance is stable.',
    },
    {
      q: 'Array of groups vs array of controls — how does binding differ?',
      a: 'Groups: [formGroupName]="i" then formControlName inside. Simple controls: [formControlName]="i" directly on the array item.',
    },
    {
      q: 'How do you clear every row at once?',
      a: "this.items.clear() — then push fresh ones if needed. It's cheaper and safer than removeAt in a loop, and it keeps the same FormArray instance alive so existing bindings and subscriptions stay valid.",
    },
    {
      q: 'How do you validate "the list must have at least one item", as opposed to validating each item?',
      a: "Pass the validator as the SECOND argument to fb.array(controls, Validators.minLength(1)). That attaches it to the FormArray control itself, which checks the length of the array's own value — independent of whether each individual item control is valid.",
    },
  ];
}
