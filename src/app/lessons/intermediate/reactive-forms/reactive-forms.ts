import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-reactive-forms',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Forms</span>
      <h1>Reactive Forms</h1>
      <p class="lead">
        Reactive (model-driven) forms define the form structure in the component
        class. The model is the source of truth, fully typed, synchronous to read,
        and easy to unit test — ideal for non-trivial forms.
      </p>

      <h2>Building the model</h2>
      <div class="code">
        <pre>import {{ '{' }} ReactiveFormsModule, FormBuilder, Validators {{ '}' }} from '&#64;angular/forms';

private fb = inject(FormBuilder);
form = this.fb.group({{ '{' }}
  name: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
  age: [18, [Validators.min(0), Validators.max(120)]],
{{ '}' }});</pre>
      </div>

      <h2>Binding to the template</h2>
      <div class="code">
        <pre>&lt;form [formGroup]="form" (ngSubmit)="save()"&gt;
  &lt;input formControlName="name" /&gt;
  &lt;input formControlName="email" /&gt;
&lt;/form&gt;</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Name</label>
            <input formControlName="name" />
          </div>
          <div class="field">
            <label>Email</label>
            <input formControlName="email" />
          </div>
          <div class="field">
            <label>Age</label>
            <input type="number" formControlName="age" />
          </div>
          <div class="row">
            <button type="submit" [disabled]="form.invalid">Save</button>
            <button type="button" class="ghost" (click)="form.reset()">Reset</button>
            <button type="button" class="ghost" (click)="patch()">Patch demo</button>
          </div>
        </form>

        <h3>Live form state</h3>
        <p class="row">
          <span class="pill">valid: {{ form.valid }}</span>
          <span class="pill">dirty: {{ form.dirty }}</span>
          <span class="pill">touched: {{ form.touched }}</span>
        </p>
        <div class="code"><pre>{{ form.value | json }}</pre></div>
        @if (saved()) {
          <p style="color:var(--green)">✅ Saved: {{ saved() | json }}</p>
        }
      </div>

      <h2>Reading & writing programmatically</h2>
      <div class="code">
        <pre>this.form.value;                       // {{ '{' }} name, email, age {{ '}' }} (typed!)
this.form.controls.name.value;         // a single control
this.form.get('email')?.errors;        // validation errors
this.form.patchValue({{ '{' }} name: 'Ada' {{ '}' }});    // update some fields
this.form.setValue({{ '{' }} name, email, age {{ '}' }});  // update ALL fields
this.form.valueChanges.subscribe(...); // Observable of changes</pre>
      </div>

      <div class="tip">
        With the typed-forms API, <code>form.value</code> and <code>controls</code> are
        strongly typed from the <code>group()</code> definition — no <code>any</code>.
        Use <code>patchValue</code> for partial updates, <code>setValue</code> for all
        fields.
      </div>
      <div class="note">
        Two subtleties: <code>form.value</code> types every field as <em>optional</em>
        and <strong>omits disabled controls</strong> — use <code>getRawValue()</code> for
        a complete, non-partial object. And controls are nullable by default
        (<code>reset()</code> sets <code>null</code>); build with
        <code>fb.nonNullable.group({{ '{' }}…{{ '}' }})</code> (or
        <code>nonNullable: true</code>) when you want resets to restore the initial value
        instead.
      </div>

      <h2>Reactive vs template-driven</h2>
      <ul>
        <li>Model lives in the <strong>class</strong> (vs the template).</li>
        <li>Better for dynamic controls, cross-field validation, and testing.</li>
        <li>Import <code>ReactiveFormsModule</code> (not <code>FormsModule</code>).</li>
      </ul>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong><code>value</code> omits disabled controls.</strong> Use
          <code>getRawValue()</code> for a complete object including disabled fields.</li>
        <li><strong><code>setValue</code> needs every field.</strong> It throws on a partial
          object — use <code>patchValue</code> for partial updates.</li>
        <li><strong>Disabling via the template.</strong> <code>[disabled]</code> on a
          <code>formControlName</code> input warns — set disabled in the model
          (<code>disable()</code> / the control config).</li>
        <li><strong>Controls are nullable and reset to <code>null</code>.</strong> Use
          <code>fb.nonNullable</code> when a reset should restore the initial value.</li>
        <li><strong>Wrong module.</strong> Reactive forms need
          <code>ReactiveFormsModule</code>, not <code>FormsModule</code> — mismatched imports
          give "no known property formControlName".</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary><code>patchValue</code> vs <code>setValue</code>?</summary>
        <div><code>patchValue</code> updates a subset; <code>setValue</code> requires the full
        shape and throws if a field is missing.</div>
      </details>
      <details class="qa">
        <summary>Why is a disabled field missing from <code>form.value</code>?</summary>
        <div>By design — disabled controls are excluded. Use <code>getRawValue()</code> to
        include them.</div>
      </details>
      <details class="qa">
        <summary>When choose reactive over template-driven forms?</summary>
        <div>Dynamic controls, cross-field validation, heavy testing, or a typed model in the
        class. Template-driven suits simple, mostly-static forms.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>FormBuilder.group()</code> defines a typed form model in the class.</li>
        <li>Bind with <code>[formGroup]</code> + <code>formControlName</code>.</li>
        <li>Read state via <code>value</code>, <code>valid</code>, <code>errors</code>, <code>valueChanges</code>.</li>
        <li>Update with <code>patchValue</code> (partial) or <code>setValue</code> (full).</li>
      </ul>

      <p><a routerLink="/form-validation">Next: Form Validation →</a></p>
    </article>
  `,
  styles: [
    `
      .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class ReactiveForms {
  private readonly fb = inject(FormBuilder);
  protected readonly saved = signal<unknown>(null);

  protected readonly form = this.fb.group({
    name: ['Ada', [Validators.required, Validators.minLength(2)]],
    email: ['ada@example.com', [Validators.required, Validators.email]],
    age: [36, [Validators.min(0), Validators.max(120)]],
  });

  protected save() {
    if (this.form.valid) {
      this.saved.set(this.form.value);
    }
  }

  protected patch() {
    this.form.patchValue({ name: 'Grace' });
  }
}
