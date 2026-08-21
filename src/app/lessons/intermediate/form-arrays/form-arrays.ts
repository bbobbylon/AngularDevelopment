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
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Forms</span>
      <h1>Dynamic Forms &amp; FormArray</h1>
      <p class="lead">
        A <code>FormArray</code> holds a variable-length, <strong>ordered</strong> list of
        controls — and unlike a <code>FormGroup</code>, that list has no fixed set of named
        keys. Reach for it whenever the number of fields is decided at runtime: invoice line
        items, phone numbers, tags, anything a user can add or remove. The items can be whole
        <code>FormGroup</code>s (a name + a quantity, say) or plain single controls (just a
        string). Both patterns are demoed below, along with how to validate the array
        <em>itself</em> — e.g. "must have at least one row" — separately from validating each
        item inside it.
      </p>

      <h2>Setup — building a FormArray of groups</h2>
      <p>
        This is the exact code behind the invoice demo further down. <code>fb.array(...)</code>
        builds the <code>FormArray</code>; each entry inside it is a whole <code>FormGroup</code>
        produced by a small factory function so every row gets its own independent controls:
      </p>
      <div class="code"><pre>{{ setupSample }}</pre></div>
      <p class="lbl">Line-by-line</p>
      <ul class="lbl-list">
        <li>
          <code>this.fb.group({{ '{' }} … {{ '}' }})</code> — <code>FormBuilder</code> shorthand
          for <code>new FormGroup({{ '{' }} … {{ '}' }})</code>. Each property becomes a control;
          an array value like <code>[initial, validators]</code> is sugar for
          <code>new FormControl(initial, validators)</code>.
        </li>
        <li>
          <code>title: ['Office supplies', Validators.required]</code> — a plain top-level
          control with a starting value and one synchronous validator. Nothing FormArray-specific
          yet, just an ordinary reactive-forms control.
        </li>
        <li>
          <code>items: this.fb.array([this.newItem('Notebook', 3)])</code> — the important line.
          <code>fb.array(...)</code> creates a <code>FormArray</code> whose initial contents are
          one <code>FormGroup</code> (built by <code>newItem</code>). Crucially, that
          <code>FormArray</code> is itself just a <strong>control</strong> nested under the key
          <code>items</code> — it plugs into the same value/validity tree as <code>title</code>,
          it just happens to hold a list instead of a scalar.
        </li>
        <li>
          <code>this.form.get('items') as FormArray</code> — <code>get()</code> is typed to
          return <code>AbstractControl | null</code> because Angular can't statically know what
          you named your controls. You must cast to <code>FormArray</code> before
          <code>.controls</code>, <code>.push()</code> or <code>.removeAt()</code> exist on the
          type; skip the cast and TypeScript refuses to compile the call.
        </li>
        <li>
          <code>private newItem(name = '', qty = 1) {{ '{' }} return this.fb.group({{ '{' }} … {{ '}' }}); {{ '}' }}</code>
          — a <strong>factory</strong>, not a stored instance. It returns a brand-new
          <code>FormGroup</code> every time it's called. If you instead built one group and
          reused that same object reference for multiple rows, every row's inputs would be bound
          to the identical control — typing in one would change them all.
        </li>
        <li>
          <code>qty: [qty, [Validators.min(1)]]</code> — the array-of-validators form, used the
          moment a control needs more than one synchronous validator.
        </li>
      </ul>

      <h2>Add &amp; remove at runtime</h2>
      <div class="code"><pre>{{ addRemoveSample }}</pre></div>
      <p class="lbl">Line-by-line</p>
      <ul class="lbl-list">
        <li>
          <code>this.items.push(this.newItem())</code> — <code>push</code> appends a fresh
          control to the <strong>end</strong> of the array's internal <code>controls</code> list
          and immediately recomputes the array's (and every ancestor's) value and validity. There
          is no separate "refresh the form" step to remember.
        </li>
        <li>
          <code>this.newItem()</code> with no arguments — reuses the exact same factory as setup,
          so a row added by clicking "+ Add line" is validated identically to the seeded row
          (<code>name</code> required, <code>qty</code> ≥ 1).
        </li>
        <li>
          <code>this.items.removeAt(i)</code> — detaches the control that currently sits at index
          <code>i</code> (internally: <code>control.setParent(null)</code>) and splices it out of
          the array. Every control that was after it shifts down one index. That index shift is
          exactly why the template below tracks the <em>control instance</em>, not the index — see
          "Under the hood".
        </li>
      </ul>

      <h2>Try it — a tiny invoice (array of groups)</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <form [formGroup]="form">
          <div class="field">
            <label>Invoice title</label>
            <input formControlName="title" />
          </div>

          <div formArrayName="items">
            @for (item of items.controls; track item; let i = $index) {
              <div class="line" [formGroupName]="i">
                <input formControlName="name" placeholder="item name" />
                <input type="number" formControlName="qty" style="width:80px" />
                <button type="button" class="ghost" (click)="remove(i)" [disabled]="items.length === 1">✕</button>
              </div>
            }
          </div>

          <div class="row" style="margin-top:10px">
            <button type="button" (click)="add()">+ Add line</button>
            <span class="pill">lines: {{ items.length }}</span>
            <span class="pill">valid: {{ form.valid }}</span>
          </div>
        </form>

        <h3>form.value</h3>
        <div class="code"><pre>{{ form.value | json }}</pre></div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Type an item name and hit Tab — <code>form.value</code> updates instantly because every
          row's controls bubble their value up through the array to the group. Delete a middle
          row: notice the remaining rows keep <em>their own</em> typed values, because Angular
          re-associated the DOM with the surviving control instances, not with fixed index slots.
        </p>
      </div>

      <h2>FormArray of plain controls — tags (no groups)</h2>
      <p>
        Not every array needs groups. When each item is a single value, skip the wrapper
        <code>FormGroup</code> entirely and put controls straight into the array. This demo also
        shows an <strong>array-level validator</strong> — one that checks the list as a whole
        (its length), completely separate from validating each tag's own text:
      </p>
      <div class="code"><pre>{{ primitiveArraySample }}</pre></div>
      <p class="lbl">Line-by-line</p>
      <ul class="lbl-list">
        <li>
          <code>this.fb.array&lt;string&gt;(['angular', 'forms'], Validators.minLength(2))</code> —
          the array's initial items are plain strings (each becomes a
          <code>FormControl&lt;string&gt;</code> automatically), and the <strong>second
          argument</strong> is a validator attached to the <em>array control itself</em>. Because
          the array's own <code>.value</code> is the string array, <code>Validators.minLength(2)</code>
          checks <code>value.length &lt; 2</code> — i.e. "at least two tags" — not the length of
          any individual tag's text.
        </li>
        <li>
          <code>this.tagsForm.get('tags') as FormArray&lt;FormControl&lt;string&gt;&gt;</code> —
          with typed reactive forms you cast to the precise generic, not just bare
          <code>FormArray</code>, so <code>.controls</code> gives you
          <code>FormControl&lt;string&gt;[]</code> instead of <code>AbstractControl[]</code>.
        </li>
        <li>
          <code>this.tags.push(this.fb.nonNullable.control(value))</code> —
          <code>fb.nonNullable</code> returns a builder whose controls' values can never become
          <code>null</code> (e.g. after <code>reset()</code>), which matters here because the
          array is typed <code>string</code>, not <code>string | null</code>.
        </li>
        <li>
          <code>[formArrayName]="tags"</code> / <code>[formControlName]="i"</code> in the
          template — for an array of <em>groups</em> you bind <code>[formGroupName]="i"</code>
          per item; for an array of <em>plain controls</em> you bind
          <code>[formControlName]="i"</code> directly on the input, with no group wrapper element
          in between.
        </li>
      </ul>

      <div class="demo">
        <p class="demo__title">Live — array-level validator: needs at least 2 tags</p>
        <div [formGroup]="tagsForm">
          <div formArrayName="tags" class="row" style="flex-wrap:wrap">
            @for (tag of tags.controls; track tag; let i = $index) {
              <span class="pill tagpill">
                <input [formControlName]="i" style="width:100px" />
                <button type="button" class="ghost" (click)="removeTag(i)">✕</button>
              </span>
            }
          </div>
          <div class="row" style="margin-top:10px">
            <input [formControl]="newTagCtrl" placeholder="new tag" (keydown.enter)="addTag()" />
            <button type="button" (click)="addTag()">+ Add tag</button>
            <span class="pill">count: {{ tags.length }}</span>
            <span class="pill" [style.color]="tags.valid ? 'var(--green)' : 'var(--amber)'">
              array valid: {{ tags.valid }}
            </span>
          </div>
          <p style="color:var(--text-muted);font-size:.85rem">
            Remove tags down to one — every remaining tag control is still individually valid
            (nothing checks a single tag's text here), yet <strong>array valid</strong> flips to
            <code>false</code>. That failure belongs to the <code>FormArray</code> control itself,
            not to any child, because the validator was attached to the array in
            <code>fb.array(initial, validator)</code>.
          </p>
        </div>
      </div>

      <h2>Template wiring — the two binding shapes</h2>
      <ul>
        <li><code>formArrayName="items"</code> binds the array (must sit inside a
          <code>[formGroup]</code> or an ancestor <code>formGroupName</code>).</li>
        <li>Iterate <code>items.controls</code> with <code>&#64;for</code> — never iterate the
          array's raw <em>value</em>, since that's just data with no control identity attached.</li>
        <li><strong>Array of groups:</strong> each item binds via <code>[formGroupName]="i"</code>
          (the index), with <code>formControlName</code> for the fields inside it.</li>
        <li><strong>Array of plain controls:</strong> use <code>[formControlName]="i"</code>
          directly on the input — there's no group wrapper to open.</li>
      </ul>

      <div class="tip">
        Track by the control instance (<code>track item</code> / <code>track tag</code>) so
        Angular reuses rows correctly as you add and remove them. <code>track $index</code> is the
        single most common FormArray bug — see "Under the hood" for exactly why.
      </div>

      <div class="note">
        <strong>Typed forms &amp; disabled controls:</strong> with typed reactive forms,
        cast precisely — <code>get('items') as FormArray&lt;FormGroup&gt;</code>. Note that
        <code>form.value</code> <em>omits disabled controls</em>; use
        <code>form.getRawValue()</code> to include them. For arrays of primitives, build
        with <code>fb.array&lt;string&gt;([])</code> and bind
        <code>[formControlName]="i"</code>. <code>fb.nonNullable</code> keeps values from
        resetting to <code>null</code>.
      </div>

      <h2>Under the hood — what push()/removeAt() actually do</h2>
      <p>
        A <code>FormArray</code> is not magic list-diffing; it's a thin wrapper around a plain
        JavaScript array of controls, <code>controls: AbstractControl[]</code>, plus the same
        value/validity bookkeeping every <code>AbstractControl</code> does. This is the same
        mental model as <code>FormGroup</code>, just indexed by position instead of by key name:
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <ul>
        <li>
          <strong><code>controls</code> is the array.</strong> There is no hidden diffing engine —
          <code>push</code>/<code>removeAt</code>/<code>insert</code>/<code>clear</code> are thin
          wrappers around ordinary <code>Array</code> methods (<code>push</code>,
          <code>splice</code>) plus parent-linking.
        </li>
        <li>
          <strong><code>setParent()</code> wires the tree.</strong> Every control added to the
          array gets a reference to it as its parent; every control removed has that reference
          cleared. This parent chain is how a keystroke in one leaf control eventually recomputes
          <code>form.valid</code> at the root.
        </li>
        <li>
          <strong><code>updateValueAndValidity()</code> is the "notify" step.</strong> It
          recalculates this control's own value/status from its children, then calls the same
          method on its parent — the change <em>bubbles upward</em> through the whole ancestor
          chain, which is why the top-level <code>form.valid</code> updates the instant a nested
          <code>qty</code> field goes invalid.
        </li>
        <li>
          <strong><code>value</code> vs <code>getRawValue()</code>.</strong> The plain
          <code>.value</code> getter filters out disabled controls before mapping to values;
          <code>getRawValue()</code> walks every control regardless of <code>disabled</code>,
          recursing into nested groups/arrays. This is exactly why a disabled row silently
          vanishes from <code>form.value | json</code> but still shows up with
          <code>getRawValue()</code>.
        </li>
        <li>
          <strong>Why <code>track $index</code> breaks.</strong> <code>&#64;for</code> uses the track
          expression to decide "is this the same logical row as last render, or a new one?" With
          <code>track $index</code>, removing row 0 means index 0 now refers to the control that
          used to be row 1 — Angular reuses the existing <code>&lt;input&gt;</code> DOM node (and
          its focus/cursor state) for what your data now says is a <em>different</em> control, so
          values appear to "jump" between fields. <code>track item</code> tracks the control
          object itself, which is stable across the splice, so DOM nodes move with their data.
        </li>
      </ul>

      <h2>Rebuilding the array vs mutating it</h2>
      <div class="code"><pre>{{ wrongRightSample }}</pre></div>
      <p class="lbl">Line-by-line</p>
      <ul class="lbl-list">
        <li>
          <code>this.form.setControl('items', new FormArray([...]))</code> — replaces the
          <code>items</code> control with a brand-new <code>FormArray</code> instance. Any
          template binding, subscription, or reference that pointed at the <em>old</em>
          <code>FormArray</code> (including anything mid-flight in <code>valueChanges</code>) is
          now stale — the form re-renders around a different object than the one your code, and
          possibly a parent component, still holds a reference to.
        </li>
        <li>
          <code>this.items.clear()</code> — removes every control from the <strong>same</strong>
          array instance (each gets <code>setParent(null)</code>, then the internal list is
          emptied) and recomputes validity once. Existing bindings to the array itself stay valid.
        </li>
        <li>
          <code>rows.forEach(r =&gt; this.items.push(this.newItem(r.name, r.qty)))</code> — repopulates
          the same array by pushing fresh rows, which is exactly the pattern the invoice demo's
          <code>add()</code> already uses one row at a time.
        </li>
      </ul>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Tracking by <code>$index</code>.</strong> With <code>track $index</code>, removing a
          middle row makes Angular reuse the wrong DOM/control and inputs "jump". Track the control
          instance (<code>track item</code>) instead.</li>
        <li><strong>Forgetting the group wrapper.</strong> An array <em>of groups</em> needs
          <code>[formGroupName]="i"</code> inside <code>formArrayName</code>; an array of simple
          controls uses <code>[formControlName]="i"</code>. Mixing them throws.</li>
        <li><strong>Casting to the wrong type.</strong> <code>form.get('items')</code> returns
          <code>AbstractControl</code> — cast to <code>FormArray</code> (or
          <code>FormArray&lt;FormGroup&gt;</code>) or <code>.controls</code>/<code>.push</code> won't exist.</li>
        <li><strong><code>value</code> drops disabled rows.</strong> Same rule as any form —
          <code>getRawValue()</code> includes disabled controls; <code>value</code> omits them.</li>
        <li><strong>Rebuilding instead of mutating.</strong> Reach for <code>push</code>/<code>removeAt</code>/
          <code>clear</code>; reassigning a brand-new array breaks existing bindings and validity state.</li>
        <li><strong>Array-level validator on the wrong thing.</strong> "At least one item" belongs on
          the array — <code>fb.array(controls, Validators.minLength(1))</code> — not copy-pasted onto
          each item's own control, which only validates that one item's value.</li>
        <li><strong>Iterating <code>.value</code> instead of <code>.controls</code>.</strong> The array's
          value is plain data with no control identity; binding a template to it directly means you
          lose per-row validity state and can't use <code>formGroupName</code>/<code>formControlName</code>
          at all.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why track by the control instance, not <code>$index</code>?</summary>
        <div>Indices shift when you remove a row, so <code>track $index</code> re-associates controls
        with the wrong DOM and values appear to jump. The control instance is stable.</div>
      </details>
      <details class="qa">
        <summary>Array of groups vs array of controls — how does binding differ?</summary>
        <div>Groups: <code>[formGroupName]="i"</code> then <code>formControlName</code> inside. Simple
        controls: <code>[formControlName]="i"</code> directly on the array item.</div>
      </details>
      <details class="qa">
        <summary>How do you clear every row at once?</summary>
        <div><code>this.items.clear()</code> — then <code>push</code> fresh ones if needed. It's cheaper
        and safer than <code>removeAt</code> in a loop, and it keeps the same <code>FormArray</code>
        instance alive so existing bindings and subscriptions stay valid.</div>
      </details>
      <details class="qa">
        <summary>How do you validate "the list must have at least one item", as opposed to validating each item?</summary>
        <div>Pass the validator as the <em>second argument</em> to <code>fb.array(controls, Validators.minLength(1))</code>.
        That attaches it to the <code>FormArray</code> control itself, which checks the length of the
        array's own value — independent of whether each individual item control is valid.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>FormArray</code> = a dynamic, ordered list of controls or groups, indexed by position.</li>
        <li>Mutate with <code>push</code>, <code>removeAt</code>, <code>insert</code>, <code>clear</code> — never reassign a new array.</li>
        <li>Bind with <code>formArrayName</code> + indexed <code>formGroupName</code> (groups) or <code>formControlName</code> (plain controls).</li>
        <li>Validate the array's own shape (e.g. minimum length) by passing a validator as <code>fb.array</code>'s second argument — separate from validating each item.</li>
        <li>Track by the control instance so rows survive add/remove correctly; <code>updateValueAndValidity()</code> bubbles every change up the parent chain automatically.</li>
      </ul>

      <p><a routerLink="/router-children-lazy">Next: Child Routes &amp; Lazy Loading →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
     .line { display: flex; gap: 8px; margin-bottom: 8px; }
     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }
     .lbl { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); margin: 10px 0 6px; }
     .lbl-list { margin-top: 0; }
     .tagpill { display: inline-flex; gap: 6px; align-items: center; padding: 4px 6px 4px 10px; }
     .tagpill input { width: 100px; padding: 4px 6px; }`,
  ],
})
export class FormArrays {
  private readonly fb = inject(FormBuilder);

  // --- Demo 1: FormArray of GROUPS (invoice line items) ---

  protected readonly form = this.fb.group({
    title: ['Office supplies', Validators.required],
    items: this.fb.array([this.newItem('Notebook', 3)]),
  });

  protected get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private newItem(name = '', qty = 1) {
    return this.fb.group({
      name: [name, Validators.required],
      qty: [qty, [Validators.min(1)]],
    });
  }

  protected add() {
    this.items.push(this.newItem());
  }

  protected remove(i: number) {
    this.items.removeAt(i);
  }

  // --- Demo 2: FormArray of PLAIN controls (tags) + an array-level validator ---

  protected readonly tagsForm = this.fb.group({
    tags: this.fb.array<string>(['angular', 'forms'], Validators.minLength(2)),
  });

  protected readonly newTagCtrl = this.fb.nonNullable.control('');

  protected get tags(): FormArray<FormControl<string>> {
    return this.tagsForm.get('tags') as FormArray<FormControl<string>>;
  }

  protected addTag() {
    const value = this.newTagCtrl.value.trim();
    if (!value) return;
    this.tags.push(this.fb.nonNullable.control(value));
    this.newTagCtrl.setValue('');
  }

  protected removeTag(i: number) {
    this.tags.removeAt(i);
  }

  // --- Code samples shown to the reader (kept as fields — see the "safe braces" note) ---

  readonly setupSample = `protected readonly form = this.fb.group({
  title: ['Office supplies', Validators.required],
  items: this.fb.array([this.newItem('Notebook', 3)]),   // a FormArray of groups
});

protected get items(): FormArray {
  return this.form.get('items') as FormArray;
}

private newItem(name = '', qty = 1) {
  return this.fb.group({
    name: [name, Validators.required],
    qty: [qty, [Validators.min(1)]],
  });
}`;

  readonly addRemoveSample = `protected add() {
  this.items.push(this.newItem());
}

protected remove(i: number) {
  this.items.removeAt(i);
}`;

  readonly primitiveArraySample = `protected readonly tagsForm = this.fb.group({
  tags: this.fb.array<string>(['angular', 'forms'], Validators.minLength(2)),
  //    ^ array of plain FormControl<string>        ^ validator on the ARRAY, not the items
});

protected get tags(): FormArray<FormControl<string>> {
  return this.tagsForm.get('tags') as FormArray<FormControl<string>>;
}

protected addTag() {
  const value = this.newTagCtrl.value.trim();
  if (!value) return;
  this.tags.push(this.fb.nonNullable.control(value));  // never null, matches string typing
  this.newTagCtrl.setValue('');
}`;

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

  readonly wrongRightSample = `// WRONG — new FormArray instance: existing bindings/subscriptions go stale
this.form.setControl('items', new FormArray([
  this.newItem('A', 1), this.newItem('B', 2),
]));

// RIGHT — mutate the SAME FormArray instance
this.items.clear();                                             // detach every control, keep the array
rows.forEach((r) => this.items.push(this.newItem(r.name, r.qty))); // repopulate it`;
}
