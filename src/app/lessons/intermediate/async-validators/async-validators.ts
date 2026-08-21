import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, delay, map, of, switchMap, tap, timer } from 'rxjs';

const TAKEN = ['admin', 'root', 'ada'];

/**
 * Simulates an HTTP "is this username free?" check. Fires the moment it is
 * subscribed — i.e. on every keystroke when the control's `updateOn` is
 * `'change'`. `onCheckStart` is a hook the demo uses to count how many times
 * the "server" was actually asked, so you can SEE the per-keystroke cost.
 */
function uniqueUsername(onCheckStart?: () => void): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    of(TAKEN.includes((control.value ?? '').toLowerCase())).pipe(
      tap(() => onCheckStart?.()), // fires synchronously on subscribe — "the request went out"
      delay(700), // pretend network latency
      map((taken) => (taken ? { taken: true } : null)),
    );
}

/**
 * Same check, but waits out a 400ms pause in typing before it fires at all.
 * `onCheckStart` only runs once the pause has elapsed, so the demo's counter
 * shows far fewer "requests" than {@link uniqueUsername} for the same typing.
 */
function uniqueUsernameDebounced(onCheckStart?: () => void): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(400).pipe(
      tap(() => onCheckStart?.()), // only reached if 400ms passed without a newer keystroke
      switchMap(() => of(TAKEN.includes((control.value ?? '').toLowerCase())).pipe(delay(700))),
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
        A sync <code>ValidatorFn</code> must answer instantly — it can't ask a server
        "is this username taken?". An <strong>async validator</strong> solves that: it
        has the same job (return errors or clear them) but is allowed to take its time,
        because it returns an <code>Observable&lt;ValidationErrors | null&gt;</code> (or a
        <code>Promise</code>) instead of the answer itself. While Angular waits for that
        Observable to emit, the control's <code>status</code> is <code>'PENDING'</code> — a
        real, distinct state, not just "still invalid". This page builds one, wires it
        up, races a debounced version against a naive one live, and then opens up
        Angular's own source to show exactly what <code>updateValueAndValidity()</code>
        does with it.
      </p>

      <h2>Defining one</h2>
      <div class="code"><pre>{{ defineSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>const TAKEN = [...]</code> — stands in for a database lookup. In real code
          this function has no hardcoded list; it calls <code>this.http.get(...)</code>
          or similar and lets the response drive the result.
        </li>
        <li>
          <code>function uniqueUsername(): AsyncValidatorFn</code> — a <strong>factory</strong>,
          not the validator itself. It returns a function matching Angular's
          <code>AsyncValidatorFn</code> shape. Writing it as a factory (rather than a bare
          function) is what lets the demo below pass in an <code>onCheckStart</code> callback
          — factories are how you parametrize a validator (a min length, an HTTP service, a
          counter) without hardcoding it.
        </li>
        <li>
          <code>(control: AbstractControl): Observable&lt;ValidationErrors | null&gt; =&gt;</code>
          — the actual function Angular calls, once per validation run, with the control as
          its only argument. Compare this to a sync <code>ValidatorFn</code>, which returns
          <code>ValidationErrors | null</code> directly: here the same contract is wrapped in
          an Observable, because the answer isn't available yet.
        </li>
        <li>
          <code>of(TAKEN.includes(...))</code> — <code>of()</code> wraps a plain boolean in a
          cold Observable that emits it once, synchronously, the instant something subscribes.
          This is the line a real implementation swaps for <code>this.http.get&lt;boolean&gt;('/api/username-taken', ...)</code>.
        </li>
        <li>
          <code>tap(() =&gt; onCheckStart?.())</code> — a side-effect only the demo needs, to
          increment a "requests fired" counter the moment the check actually starts. It runs
          before <code>delay</code>, so it fires the instant the validator is subscribed —
          exactly when a real HTTP call would go out.
        </li>
        <li>
          <code>delay(700)</code> — simulates round-trip latency. Without it (or a real
          network call) you'd never observe the <code>PENDING</code> state at all, which
          defeats the point of the lesson — everything would resolve on the same tick.
        </li>
        <li>
          <code>map((taken) =&gt; (taken ? {{ objTakenTrue }} : null))</code> — the actual
          validation contract: <strong>any truthy object</strong> (with whatever key you
          choose) means "invalid, here's why"; <strong>only <code>null</code></strong>
          means "valid". Returning <code>false</code> or <code>undefined</code> instead of
          <code>null</code> to mean "no error" is a classic exam trap — the control will
          treat a truthy non-object value as if errors were present.
        </li>
      </ul>

      <h2>Registering it — the <code>asyncValidators</code> option</h2>
      <div class="code"><pre>{{ registerSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>username: ['', {{ objOpen }} ... {{ objClose }}]</code> — FormBuilder's
          object-config overload for a single control: the first array element is the
          initial value, the second is an options object (as opposed to the shorthand
          <code>['', Validators.required]</code>, which only accepts sync validators).
        </li>
        <li>
          <code>validators: [Validators.required]</code> — the sync validators array,
          checked first and synchronously on every revalidation.
        </li>
        <li>
          <code>asyncValidators: [uniqueUsername()]</code> — a <strong>separate</strong>
          option, not appended into <code>validators</code>. This is deliberate: a
          <code>ValidatorFn</code> and an <code>AsyncValidatorFn</code> have incompatible
          return types (a value vs. an Observable of a value), so Angular exposes two
          slots and composes each with its own logic (<code>compose()</code> for sync,
          <code>composeAsync()</code>/<code>forkJoin</code> for async — see "Under the hood").
          Putting an async validator in the sync slot throws at runtime.
        </li>
        <li>
          <code>updateOn: 'blur'</code> — controls when <em>any</em> validators (sync
          and async) rerun: on every <code>valueChanges</code> emission ('change', the
          default), only when the input loses focus ('blur'), or only on
          <code>ngSubmit</code> ('submit'). Setting it to <code>'blur'</code> is a built-in
          alternative to manually debouncing an async validator — the server is asked once
          per visit to the field, not once per keystroke.
        </li>
      </ul>

      <h2>Try it (taken: admin, root, ada)</h2>
      <div class="demo">
        <p class="demo__title">Live — simulated 700ms server check, no debounce</p>
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
          <span class="pill">checks fired: {{ naiveChecks() }}</span>
        </p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Type continuously (e.g. hold a letter key, or type fast) and watch
          <strong>checks fired</strong> climb — this control uses <code>updateOn: 'change'</code>
          with no debounce, so <em>every</em> keystroke starts a fresh 700ms "server" check.
        </p>
      </div>

      <h2>Debouncing the request</h2>
      <div class="code"><pre>{{ debounceSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>timer(400)</code> — an Observable that emits exactly once, 400ms after
          something subscribes to it. This is the "wait for a pause in typing" mechanism.
        </li>
        <li>
          <code>switchMap(() =&gt; ...)</code> — once the pause elapses, switch into the
          "network" Observable. <code>switchMap</code> is the conventional choice here
          because it would cancel a still-running <em>inner</em> request if the
          <em>outer</em> source emitted again — but read "Under the hood" below: for a
          single async validator, Angular's own machinery already guarantees only one
          instance of this whole chain is ever alive per control, so the cancellation
          you're relying on here is mostly redundant with what the framework does for you.
        </li>
        <li>
          <code>map((taken) =&gt; ...)</code> — identical contract to before: object means
          invalid, <code>null</code> means valid.
        </li>
      </ul>

      <h2>Live demo — debounce cuts how many checks actually fire</h2>
      <div class="demo">
        <p class="demo__title">Live — same check, with vs. without a 400ms debounce</p>
        <div class="race">
          <div class="field">
            <label>No debounce (same control as above)</label>
            <input [formControl]="username" />
            <p class="row">
              <span class="pill">status: {{ username.status }}</span>
              <span class="pill">checks fired: {{ naiveChecks() }}</span>
            </p>
          </div>
          <div class="field">
            <label>Debounced (400ms pause required)</label>
            <input [formControl]="usernameDebounced" />
            <p class="row">
              <span class="pill">status: {{ usernameDebounced.status }}</span>
              <span class="pill">checks fired: {{ debouncedChecks() }}</span>
            </p>
          </div>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="ghost" (click)="resetRace()">Reset both fields &amp; counters</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Type the same burst into both fields (try holding a key down, or pasting a long
          string). The left counter climbs once per keystroke; the right counter only
          climbs after you <em>stop</em> typing for 400ms — because every keystroke cancels
          the debounced field's pending <code>timer(400)</code> before it can fire. That
          cancellation is real and automatic: it's not something your component code does,
          it's Angular's <code>AbstractControl</code> doing it on your behalf (next section).
        </p>
      </div>

      <h2>Under the hood — what <code>updateValueAndValidity()</code> actually does</h2>
      <p>
        Every value change on a reactive form control funnels through one method,
        <code>updateValueAndValidity()</code>. Simplified from Angular's own
        <code>AbstractControl</code> source (<code>@angular/forms</code>), here is the part
        that matters for async validators:
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>cancelExistingSubscription()</code> — the <strong>first</strong> thing that
          happens on every revalidation: Angular unsubscribes whatever async validator
          Observable is currently in flight for this control, in full — <code>timer</code>,
          <code>switchMap</code>, the lot. This is the real reason a stale check never "wins"
          against a newer keystroke; it has nothing to do with which RxJS operator your
          validator happens to use internally.
        </li>
        <li>
          <code>this.errors = runSyncValidators()</code> then <code>this.status = calculateStatus()</code>
          — sync validators run first and synchronously, exactly like the lesson's earlier
          note said, but now you can see <em>why</em>: the very next line only calls the
          async validator <code>if (status === VALID)</code>.
        </li>
        <li>
          <code>if (this.status === VALID) {{ '{' }} ... {{ '}' }}</code> — the gate. If a sync validator
          already produced an error, <code>status</code> is <code>INVALID</code> and the
          async validator function is <strong>never even invoked</strong> — no wasted request
          for an empty required field.
        </li>
        <li>
          <code>this.status = PENDING</code> — set synchronously, immediately, before the
          Observable has emitted anything. This is why the UI shows "checking…" the instant
          you type, not 700ms later.
        </li>
        <li>
          <code>toObservable(this.asyncValidator(this))</code> — calls your factory-returned
          function fresh, every single time (a brand-new Observable instance each
          revalidation — nothing is reused or cached). <code>toObservable</code> also wraps a
          <code>Promise</code> via RxJS's <code>from()</code>, which is why <code>async</code>
          functions work as async validators too, not just Observable-returning ones.
        </li>
        <li>
          <code>obs.subscribe((errors) =&gt; {{ '{' }} this.setErrors(errors) {{ '}' }})</code> — notice this
          subscribe call only supplies a <strong><code>next</code> handler</strong>, no error
          handler. If your validator's Observable errors out instead of completing (e.g. an
          <code>HttpClient</code> call that 500s and you didn't <code>catchError</code> it),
          <code>setErrors</code> is <strong>never called</strong> — the control is stuck
          <code>PENDING</code> forever, and separately you get an unhandled-error report in
          the console. Always <code>catchError</code> inside your own validator and resolve
          to <code>null</code> or an error object; never let the source error.
        </li>
        <li>
          <code>setErrors(errors)</code> — recomputes status one more time: a non-null object
          → <code>INVALID</code>; <code>null</code> → <code>VALID</code> (assuming no sync
          errors reappeared). This is the moment <code>PENDING</code> ends.
        </li>
      </ul>

      <h3>The status state machine</h3>
      <p>
        <code>status</code> is a single field with exactly one value at a time — never a
        combination. <code>.valid</code>, <code>.invalid</code>, <code>.pending</code>, and
        <code>.disabled</code> are just getters that compare <code>status</code> to one enum
        member each:
      </p>
      <div class="code"><pre>{{ statusGettersSample }}</pre></div>
      <table class="cmp">
        <tr><th>status</th><th>.valid</th><th>.invalid</th><th>.pending</th><th>when Angular sets it</th></tr>
        <tr>
          <td><code>'VALID'</code></td><td>true</td><td>false</td><td>false</td>
          <td>no sync errors, and either no async validator or it resolved to <code>null</code></td>
        </tr>
        <tr>
          <td><code>'INVALID'</code></td><td>false</td><td>true</td><td>false</td>
          <td>a sync validator returned errors, OR an async validator resolved with errors</td>
        </tr>
        <tr>
          <td><code>'PENDING'</code></td><td>false</td><td>false</td><td>true</td>
          <td>sync validators passed and an async validator is currently running</td>
        </tr>
        <tr>
          <td><code>'DISABLED'</code></td><td>false</td><td>false</td><td>false</td>
          <td>the control (or an ancestor) is disabled — validators don't run at all</td>
        </tr>
      </table>

      <h2>PENDING vs. INVALID — the submit-button trap</h2>
      <p>
        Because <code>PENDING</code> is its own status, <strong><code>invalid</code> is
        <em>not</em> true while a control is pending</strong> — the table above shows
        <code>.invalid</code> is <code>false</code> on that row. A submit button gated only
        on <code>form.invalid</code> stays <em>enabled</em> during the async check:
      </p>
      <div class="code"><pre>{{ disableSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>[disabled]="form.invalid"</code> — WRONG on its own: while
          <code>status === 'PENDING'</code>, <code>invalid</code> evaluates to
          <code>false</code>, so the button is clickable for the entire 700ms the "server" is
          being asked — a user can submit before the availability check even resolves.
        </li>
        <li>
          <code>[disabled]="!form.valid"</code> — RIGHT: <code>valid</code> is only
          <code>true</code> when <code>status === 'VALID'</code>, so this expression is
          <code>true</code> (button disabled) for <em>both</em> <code>INVALID</code> and
          <code>PENDING</code>. Equivalent and sometimes clearer to a reviewer:
          <code>[disabled]="form.invalid || form.pending"</code>.
        </li>
      </ul>

      <h2>Registering more than one async validator</h2>
      <p>
        <code>asyncValidators</code> takes an <strong>array</strong>. Angular composes it
        with <code>forkJoin</code> — every entry runs in <strong>parallel</strong>, not one
        after another, and the control stays <code>PENDING</code> until <em>all</em> of them
        settle:
      </p>
      <div class="code"><pre>{{ multipleValidatorsSample }}</pre></div>
      <h3>Line-by-line</h3>
      <ul class="lbl">
        <li>
          <code>asyncValidators: [uniqueUsername(), bannedWordCheck()]</code> — both
          validators subscribe at the same time; neither waits for the other to start.
        </li>
        <li>
          <code>forkJoin([...])</code> — an RxJS operator that subscribes to every source and
          emits once, only after <strong>all</strong> of them have completed, combining their
          latest values into an array. Practically: if <code>uniqueUsername()</code> resolves
          in 100ms but <code>bannedWordCheck()</code> takes 2 seconds, the control is
          <code>PENDING</code> for the full 2 seconds — the slowest validator sets the pace
          for the whole control.
        </li>
        <li>
          <code>mergeErrors(results)</code> — spreads each validator's result object into one
          combined object (<code>{{ mergeSpread }}</code>). If two validators return the
          <strong>same error key</strong>, the later one in the array silently overwrites the
          earlier one's value for that key — give each validator its own distinct key
          (<code>taken</code>, <code>banned</code>, …) so nothing is lost.
        </li>
      </ul>

      <div class="tip">
        <strong>Myth to unlearn:</strong> "switchMap cancels the stale request" is the
        textbook explanation, and it's not <em>wrong</em> as a habit — but for a single async
        validator on a single control, the actual cancellation guarantee comes from Angular's
        <code>AbstractControl</code> itself: it unsubscribes the previous async validator's
        entire Observable before creating a new one, every time <code>updateValueAndValidity()</code>
        runs. <code>switchMap</code> becomes load-bearing when a validator's Observable can
        emit more than once from a <em>single</em> subscription (e.g. it's built on a shared,
        long-lived stream) — not in the common "debounce then check" shape shown above.
      </div>

      <div class="note">
        Async validators only run <strong>after</strong> sync validators pass — no point
        hitting the server for an empty required field. While <code>PENDING</code>, the
        control (and any parent <code>FormGroup</code>/<code>FormArray</code> containing it)
        is neither <code>valid</code> nor <code>invalid</code> — gate submit buttons on
        <code>!form.valid</code>, not <code>form.invalid</code>, or you'll let users submit
        mid-check.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Not completing the Observable.</strong> It must emit and
          <em>complete</em>, or the control stays <code>PENDING</code> forever. HTTP calls
          complete; <code>switchMap</code> off a <code>timer</code> is the usual pattern.</li>
        <li><strong>Letting the Observable error instead of complete.</strong> Angular's
          internal <code>subscribe()</code> only has a <code>next</code> handler — an errored
          source never calls <code>setErrors</code>, so the control is stuck
          <code>PENDING</code> <em>and</em> you get an unhandled error. Always
          <code>catchError</code> inside your validator.</li>
        <li><strong>Gating submit on <code>form.invalid</code> alone.</strong>
          <code>invalid</code> is <code>false</code> while <code>PENDING</code> — use
          <code>!form.valid</code> or explicitly check <code>.pending</code> too.</li>
        <li><strong>A request per keystroke.</strong> Debounce (<code>timer</code> +
          <code>switchMap</code>) or set <code>updateOn: 'blur'</code>.</li>
        <li><strong>Putting it in the sync slot.</strong> Async validators go in
          <code>asyncValidators</code>, not <code>validators</code> — the return types are
          incompatible (value vs. Observable of a value).</li>
        <li><strong>Assuming multiple async validators run sequentially.</strong> They run in
          parallel via <code>forkJoin</code>; the slowest one determines how long the control
          stays <code>PENDING</code>, and colliding error keys silently overwrite.</li>
        <li><strong>Forgetting sync gates run first.</strong> An empty required field never
          reaches the async validator at all — <code>status</code> must already be
          <code>VALID</code> from sync validators before Angular calls it.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>The spinner never stops — control stuck on PENDING. Why?</summary>
        <div>Two possible causes: (1) the async validator's Observable never completed —
        complete it (HTTP does, or use <code>timer().pipe(switchMap(...))</code>, or
        <code>first()</code>); (2) it <em>errored</em> instead of completing — Angular's
        internal subscription has no error handler, so an uncaught error also leaves the
        control PENDING forever. Add <code>catchError</code> inside the validator.</div>
      </details>
      <details class="qa">
        <summary>Your submit button uses <code>[disabled]="form.invalid"</code> but users can click it while the async check is still running. What's wrong?</summary>
        <div><code>invalid</code> only reflects <code>status === 'INVALID'</code>;
        <code>PENDING</code> is a separate status where <code>invalid</code> is
        <code>false</code>. Fix with <code>[disabled]="!form.valid"</code> (or
        <code>form.invalid || form.pending</code>), since <code>valid</code> is only
        <code>true</code> when <code>status === 'VALID'</code>.</div>
      </details>
      <details class="qa">
        <summary>Does switchMap cancel the previous server call, or does something else?</summary>
        <div>For a single async validator on a control, Angular's <code>AbstractControl</code>
        itself unsubscribes the entire previous async-validator Observable every time
        <code>updateValueAndValidity()</code> runs again — before the new one is even created.
        <code>switchMap</code> is the conventional operator for chaining a debounce into a
        request, but the cancellation guarantee here comes from the forms module, not from
        that operator.</div>
      </details>
      <details class="qa">
        <summary>Two async validators on the same control both return an error under the key <code>invalid</code>. What happens?</summary>
        <div>Both run in parallel via <code>forkJoin</code> and their result objects are
        merged with object spread. Whichever validator is <strong>later</strong> in the
        <code>asyncValidators</code> array wins for that key — the earlier one's error is
        silently overwritten. Give each validator a distinct key.</div>
      </details>
      <details class="qa">
        <summary>Do async validators run before sync ones?</summary>
        <div>No — <code>updateValueAndValidity()</code> runs sync validators first and only
        calls the async validator if the resulting status is already <code>VALID</code>, so
        an obviously invalid value never reaches the server.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Async validators return <code>Observable&lt;ValidationErrors | null&gt;</code>
          (or a Promise, via <code>toObservable</code>'s <code>from()</code> wrapping) and
          must complete — an error instead of a completion leaves the control PENDING with
          no way to recover.</li>
        <li>Register them under the separate <code>asyncValidators</code> option; they run
          only after sync validators produce a <code>VALID</code> status.</li>
        <li><code>PENDING</code> is its own status, mutually exclusive with
          <code>VALID</code>/<code>INVALID</code> — <code>.invalid</code> is
          <code>false</code> while pending, so gate submit on <code>!form.valid</code>.</li>
        <li>Angular's <code>AbstractControl</code> cancels the previous async validator's
          Observable on every revalidation, before starting a new one — that's what actually
          stops stale checks from winning, independent of which RxJS operator you use inside.</li>
        <li>Multiple async validators on one control run in parallel via <code>forkJoin</code>
          and have their errors merged (later array entries win key collisions); the control
          waits for the slowest one.</li>
      </ul>

      <p><a routerLink="/form-arrays">Next: Dynamic Forms &amp; FormArray →</a></p>
    </article>
  `,
  styles: [
    `
      .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 340px; }
      .race { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .race .field { max-width: none; }
      @media (max-width: 640px) { .race { grid-template-columns: 1fr; } }
      .lbl { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 20px; padding-left: 0; list-style: none; }
      .lbl li { padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elevated); font-size: .88rem; }
      .lbl code { white-space: normal; }
      table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class AsyncValidators {
  private readonly fb = inject(FormBuilder);

  protected readonly naiveChecks = signal(0);
  protected readonly debouncedChecks = signal(0);

  protected readonly username = this.fb.control('', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsername(() => this.naiveChecks.update((n) => n + 1))],
    updateOn: 'change',
  });

  protected readonly usernameDebounced = this.fb.control('', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsernameDebounced(() => this.debouncedChecks.update((n) => n + 1))],
    updateOn: 'change',
  });

  protected resetRace() {
    this.username.reset('');
    this.usernameDebounced.reset('');
    this.naiveChecks.set(0);
    this.debouncedChecks.set(0);
  }

  // ---- code samples shown in the template (kept as fields so literal braces
  // never sit directly in the HTML template — see lesson-authoring notes) ----

  protected readonly objTakenTrue = '{ taken: true }';
  protected readonly objOpen = '{';
  protected readonly objClose = '}';
  protected readonly mergeSpread = '{ ...uniqueUsernameErrors, ...bannedWordErrors }';

  readonly defineSample = `const TAKEN = ['admin', 'root', 'ada'];

function uniqueUsername(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    of(TAKEN.includes(control.value.toLowerCase())).pipe(
      delay(700),                                   // pretend network latency
      map((taken) => (taken ? { taken: true } : null)),
    );
}`;

  readonly registerSample = `username: ['', {
  validators: [Validators.required],
  asyncValidators: [uniqueUsername()],
  updateOn: 'blur',   // optional: validate on blur, not every keystroke
}],`;

  readonly debounceSample = `function uniqueUsernameDebounced(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(400).pipe(                                // wait for a pause in typing
      switchMap(() => of(TAKEN.includes(control.value.toLowerCase())).pipe(delay(700))),
      map((taken) => (taken ? { taken: true } : null)),
    );
}`;

  readonly underTheHoodSample = `// Simplified from AbstractControl (@angular/forms) — runs on every value change:

updateValueAndValidity() {
  cancelExistingSubscription()          // unsubscribe the PREVIOUS async validator's Observable
  this.errors = runSyncValidators()     // sync validators run first, synchronously
  this.status = calculateStatus()       // errors present -> INVALID, else -> VALID (for now)

  if (this.status === VALID) {          // async validators are skipped if sync failed
    this.status = PENDING               // flips immediately — before anything resolves
    const obs = toObservable(this.asyncValidator(this))   // call your factory fresh, every time
    this.asyncValidationSubscription = obs.subscribe((errors) => {
      this.setErrors(errors)            // errors -> INVALID, null -> VALID; status recomputed
    })
  }
}`;

  readonly statusGettersSample = `get valid()   { return this.status === 'VALID'; }
get invalid() { return this.status === 'INVALID'; }
get pending() { return this.status === 'PENDING'; }`;

  readonly disableSample = `<!-- WRONG — 'invalid' is only true for status === 'INVALID'; PENDING is separate -->
<button [disabled]="form.invalid">Submit</button>

<!-- RIGHT — 'valid' is only true for status === 'VALID', so this blocks PENDING too -->
<button [disabled]="!form.valid">Submit</button>`;

  readonly multipleValidatorsSample = `asyncValidators: [uniqueUsername(), bannedWordCheck()],

// internally, composeAsyncValidators() does roughly —
forkJoin([uniqueUsername()(control), bannedWordCheck()(control)])
  .pipe(map((results) => mergeErrors(results)));   // spreads all results into one object`;
}
