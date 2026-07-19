import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-form-arrays',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Forms</span>
      <h1>Dynamic Forms & FormArray</h1>
      <p class="lead">
        A <code>FormArray</code> holds a variable-length list of controls (or groups).
        Use it whenever the number of fields is decided at runtime — tags, line
        items, phone numbers, etc.
      </p>

      <h2>Setup</h2>
      <div class="code">
        <pre>form = this.fb.group({{ '{' }}
  title: ['', Validators.required],
  items: this.fb.array([this.newItem()]),   // a FormArray of groups
{{ '}' }});

newItem() {{ '{' }}
  return this.fb.group({{ '{' }} name: ['', Validators.required], qty: [1] {{ '}' }});
{{ '}' }}
get items() {{ '{' }} return this.form.get('items') as FormArray; {{ '}' }}</pre>
      </div>

      <h2>Add & remove at runtime</h2>
      <div class="code">
        <pre>add()    {{ '{' }} this.items.push(this.newItem()); {{ '}' }}
remove(i){{ '{' }} this.items.removeAt(i); {{ '}' }}</pre>
      </div>

      <h2>Try it — a tiny invoice</h2>
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
      </div>

      <h2>Template wiring</h2>
      <ul>
        <li><code>formArrayName="items"</code> binds the array.</li>
        <li>Iterate <code>items.controls</code> with <code>&#64;for</code>.</li>
        <li>Each group binds via <code>[formGroupName]="i"</code> (the index).</li>
        <li>For an array of simple controls, use <code>[formControlName]="i"</code> instead.</li>
      </ul>

      <div class="tip">
        Track by the control instance (<code>track item</code>) so Angular reuses
        rows correctly as you add and remove them.
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
        and safer than <code>removeAt</code> in a loop.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>FormArray</code> = a dynamic, ordered list of controls/groups.</li>
        <li>Mutate with <code>push</code>, <code>removeAt</code>, <code>insert</code>, <code>clear</code>.</li>
        <li>Bind with <code>formArrayName</code> + indexed <code>formGroupName</code>/<code>formControlName</code>.</li>
        <li>Track by the control instance so rows survive add/remove correctly.</li>
      </ul>

      <p><a routerLink="/router-children-lazy">Next: Child Routes &amp; Lazy Loading →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
     .line { display: flex; gap: 8px; margin-bottom: 8px; }
     .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class FormArrays {
  private readonly fb = inject(FormBuilder);

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
}
