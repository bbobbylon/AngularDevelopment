import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-template-forms',
  imports: [RouterLink, FormsModule, JsonPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Forms</span>
      <h1>Template-Driven Forms</h1>
      <p class="lead">
        Template-driven forms keep the logic in the template using
        <code>ngModel</code>. Angular builds the form model for you behind the
        scenes — great for simple forms. (Reactive forms, covered later, move that
        model into the component for complex cases.)
      </p>

      <h2>Setup</h2>
      <p>Import <code>FormsModule</code> into the component:</p>
      <div class="code">
        <pre>import {{ '{' }} FormsModule {{ '}' }} from '&#64;angular/forms';
// imports: [FormsModule]</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <form #f="ngForm" (ngSubmit)="submit(f.value)">
          <div class="field">
            <label for="name">Name (required, min 2)</label>
            <input
              id="name"
              name="name"
              ngModel
              required
              minlength="2"
              #name="ngModel"
            />
            @if (name.invalid && name.touched) {
              <small class="err">
                @if (name.errors?.['required']) { Name is required. }
                @if (name.errors?.['minlength']) { At least 2 characters. }
              </small>
            }
          </div>

          <div class="field">
            <label for="email">Email (required, email)</label>
            <input id="email" name="email" type="email" ngModel required email #email="ngModel" />
            @if (email.invalid && email.touched) {
              <small class="err">Enter a valid email.</small>
            }
          </div>

          <div class="field">
            <label for="plan">Plan</label>
            <select id="plan" name="plan" ngModel required>
              <option value="">— choose —</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div class="row">
            <button type="submit" [disabled]="f.invalid">Submit</button>
            <button type="button" class="ghost" (click)="f.resetForm()">Reset</button>
            <span class="pill">form valid: {{ f.valid }}</span>
          </div>
        </form>

        @if (submitted()) {
          <h3>Submitted value</h3>
          <div class="code"><pre>{{ submitted() | json }}</pre></div>
        }
      </div>

      <h2>How it works</h2>
      <ul>
        <li><code>ngModel</code> + a <code>name</code> registers a control on the parent <code>ngForm</code>.</li>
        <li><code>#f="ngForm"</code> exposes the form; <code>#name="ngModel"</code> exposes one control.</li>
        <li>Validators are plain HTML attributes: <code>required</code>, <code>minlength</code>, <code>email</code>, <code>pattern</code>.</li>
        <li>Angular tracks states &amp; CSS classes: <code>ng-valid/ng-invalid</code>, <code>ng-touched</code>, <code>ng-dirty</code>.</li>
        <li><code>(ngSubmit)</code> fires on submit; bind <code>[disabled]="f.invalid"</code> to gate it.</li>
      </ul>

      <h2>ngModel variations</h2>
      <div class="code">
        <pre>&lt;input name="q" ngModel /&gt;                  // one-way into the form model
&lt;input name="q" [(ngModel)]="query" /&gt;      // two-way to a component field
&lt;input ngModel #x="ngModel" /&gt;              // standalone — no parent &lt;form&gt;

&lt;div ngModelGroup="address"&gt;                // nest controls into a sub-group
  &lt;input name="city" ngModel /&gt;            // → form.value.address.city
&lt;/div&gt;</pre>
      </div>
      <p>
        Angular reflects control state as CSS classes you can style:
        <code>ng-valid</code>/<code>ng-invalid</code>,
        <code>ng-touched</code>/<code>ng-untouched</code>,
        <code>ng-dirty</code>/<code>ng-pristine</code> — so error styling can be pure CSS.
      </p>

      <div class="tip">
        Reach for <strong>template-driven</strong> forms for small, mostly-static
        forms. Prefer <strong>reactive</strong> forms when you need dynamic
        controls, complex validation, or unit-testable form logic. Template forms are
        asynchronous — the model is assembled over a tick, so <code>f.value</code> may be
        empty in the very first <code>ngOnInit</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Import <code>FormsModule</code>; drive everything from the template with <code>ngModel</code>.</li>
        <li>Template reference vars expose <code>ngForm</code> and <code>ngModel</code> state.</li>
        <li>Validation uses HTML-attribute validators and the control's <code>errors</code>/state.</li>
      </ul>

      <p><a routerLink="/ngmodules">Next: NgModules Explained →</a></p>
    </article>
  `,
  styles: [
    `
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 14px;
        max-width: 360px;
      }
      .err {
        color: var(--accent);
        font-size: 0.8rem;
      }
    `,
  ],
})
export class TemplateForms {
  protected readonly submitted = signal<unknown>(null);

  protected submit(value: unknown) {
    this.submitted.set(value);
  }
}
