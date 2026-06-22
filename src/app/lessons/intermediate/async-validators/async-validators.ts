import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, delay, map, of } from 'rxjs';

const TAKEN = ['admin', 'root', 'ada'];

/** Simulates an HTTP "is this username free?" check. */
function uniqueUsername(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    of(TAKEN.includes((control.value ?? '').toLowerCase())).pipe(
      delay(700), // pretend network latency
      map((taken) => (taken ? { taken: true } : null)),
    );
}

@Component({
  selector: 'app-lesson-async-validators',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Forms</span>
      <h1>Async Validators</h1>
      <p class="lead">
        Async validators return an Observable (or Promise) that resolves to errors
        or <code>null</code>. They are perfect for server checks like "is this
        username available?". While pending, the control's status is
        <code>PENDING</code>.
      </p>

      <h2>Defining one</h2>
      <div class="code">
        <pre>function uniqueUsername(): AsyncValidatorFn {{ '{' }}
  return (c) =&gt; this.api.check(c.value).pipe(
    map(taken =&gt; taken ? {{ '{' }} taken: true {{ '}' }} : null)
  );
{{ '}' }}</pre>
      </div>

      <h2>Registering it (3rd argument)</h2>
      <div class="code">
        <pre>username: ['', {{ '{' }}
  validators: [Validators.required],
  asyncValidators: [uniqueUsername()],
  updateOn: 'blur',   // optional: validate on blur, not every keystroke
{{ '}' }}]</pre>
      </div>

      <h2>Try it (taken: admin, root, ada)</h2>
      <div class="demo">
        <p class="demo__title">Live — simulated 700ms server check</p>
        <div class="field">
          <label>Username</label>
          <input [formControl]="username" />
          <small>
            @switch (username.status) {
              @case ('PENDING') { <span style="color:var(--amber)">⏳ checking availability…</span> }
              @case ('VALID') {
                @if (username.value) { <span style="color:var(--green)">✅ available</span> }
              }
              @case ('INVALID') {
                @if (username.errors?.['taken']) { <span style="color:var(--accent)">❌ already taken</span> }
                @if (username.errors?.['required']) { <span style="color:var(--accent)">Required.</span> }
              }
            }
          </small>
        </div>
        <p class="row">
          <span class="pill">status: {{ username.status }}</span>
          <span class="pill">pending: {{ username.pending }}</span>
        </p>
      </div>

      <h2>Debouncing the request</h2>
      <div class="code">
        <pre>return (c) =&gt; timer(400).pipe(   // wait for a pause in typing
  switchMap(() =&gt; this.api.check(c.value)),  // switchMap cancels the stale check
  map(taken =&gt; taken ? {{ '{' }} taken: true {{ '}' }} : null),
);</pre>
      </div>

      <div class="note">
        Async validators only run <strong>after</strong> sync validators pass — no
        point hitting the server for an empty required field. While
        <code>PENDING</code>, the whole form is <em>not</em> valid, so a submit button
        bound to <code>[disabled]="form.invalid"</code> stays disabled until the check
        resolves. Use <code>updateOn: 'blur'</code> or debounce to avoid a request per
        keystroke.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Async validators return <code>Observable&lt;ValidationErrors | null&gt;</code> (or a Promise).</li>
        <li>Register them as the <code>asyncValidators</code> option, separate from sync ones.</li>
        <li>Control status becomes <code>PENDING</code> while they run; check <code>.pending</code>.</li>
        <li>They run only after sync validators pass; debounce or use <code>updateOn: 'blur'</code>.</li>
      </ul>

      <p><a routerLink="/form-arrays">Next: Dynamic Forms &amp; FormArray →</a></p>
    </article>
  `,
  styles: [
    `.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }`,
  ],
})
export class AsyncValidators {
  private readonly fb = inject(FormBuilder);

  protected readonly username = this.fb.control('', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsername()],
    updateOn: 'change',
  });
}
