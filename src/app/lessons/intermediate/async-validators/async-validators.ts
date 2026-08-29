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

/**
 * Lesson: Async Validators — validation that has to ask a server.
 *
 * Covers `AsyncValidatorFn`, the `PENDING` status, why async validators only run
 * once the synchronous ones pass, and how multiple async validators' errors are
 * merged.
 *
 * Two things the lesson insists on:
 *
 * - **`PENDING` is not `INVALID`.** `form.invalid` is false while a check is in
 *   flight, so `[disabled]="form.invalid"` leaves the submit button enabled
 *   during exactly the window where it should not be. The fix is to check
 *   `pending` too.
 * - **Debounce, or you have built a keystroke-per-request API client.** Two
 *   identical username fields run side by side — one naive, one debounced — with
 *   a request counter on each. Type a name into both and the difference is a
 *   number.
 *
 * Also covers the completion requirement: an async validator's observable must
 * emit *and complete*, or the control stays `PENDING` forever.
 *
 * @see intermediate/reactive-forms — the form model these attach to.
 */
@Component({
  selector: 'app-lesson-async-validators',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './async-validators.html',
  styleUrl: './async-validators.css',
})
export class AsyncValidators {
  /**
   * Builds the controls.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Requests the naive validator issued.
   */
  protected readonly naiveChecks = signal(0);
  /**
   * Requests the debounced validator issued. The gap is the point.
   */
  protected readonly debouncedChecks = signal(0);

  /**
   * The naive field — one request per keystroke.
   */
  protected readonly username = this.fb.control('', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsername(() => this.naiveChecks.update((n) => n + 1))],
    updateOn: 'change',
  });

  /**
   * The debounced field — one request per pause.
   */
  protected readonly usernameDebounced = this.fb.control('', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsernameDebounced(() => this.debouncedChecks.update((n) => n + 1))],
    updateOn: 'change',
  });

  /**
   * Resets both fields and both counters so the race can be re-run.
   */
  protected resetRace() {
    this.username.reset('');
    this.usernameDebounced.reset('');
    this.naiveChecks.set(0);
    this.debouncedChecks.set(0);
  }

  // ---- code samples shown in the template (kept as fields so literal braces
  // never sit directly in the HTML template — see lesson-authoring notes) ----

  /**
   * Literal `{ taken: true }` for the template. Braces are template syntax in
   * Angular, so an error-object example has to arrive as a string rather than be
   * written inline.
   */
  protected readonly objTakenTrue = '{ taken: true }';
  /**
   * A literal `{`, for the same reason.
   */
  protected readonly objOpen = '{';
  /**
   * A literal `}`, for the same reason.
   */
  protected readonly objClose = '}';
  /**
   * The spread that merges two validators' error objects, as a literal.
   */
  protected readonly mergeSpread = '{ ...uniqueUsernameErrors, ...bannedWordErrors }';

  /**
   * Sample: defining an `AsyncValidatorFn`.
   */
  readonly defineSample = `const TAKEN = ['admin', 'root', 'ada'];

function uniqueUsername(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    of(TAKEN.includes(control.value.toLowerCase())).pipe(
      delay(700),                                   // pretend network latency
      map((taken) => (taken ? { taken: true } : null)),
    );
}`;

  /**
   * Sample: registering it, in the `asyncValidators` slot rather than alongside
   * the synchronous ones.
   */
  readonly registerSample = `username: ['', {
  validators: [Validators.required],
  asyncValidators: [uniqueUsername()],
  updateOn: 'blur',   // optional: validate on blur, not every keystroke
}],`;

  /**
   * Sample: debouncing inside the validator with `timer` + `switchMap`.
   */
  readonly debounceSample = `function uniqueUsernameDebounced(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(400).pipe(                                // wait for a pause in typing
      switchMap(() => of(TAKEN.includes(control.value.toLowerCase())).pipe(delay(700))),
      map((taken) => (taken ? { taken: true } : null)),
    );
}`;

  /**
   * Sample: `updateValueAndValidity` simplified from the framework source —
   * where `PENDING` is set, and why sync validators gate the async ones.
   */
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

  /**
   * Sample: the status getters, showing that `invalid` and `pending` are separate
   * booleans over one `status` string.
   */
  readonly statusGettersSample = `get valid()   { return this.status === 'VALID'; }
get invalid() { return this.status === 'INVALID'; }
get pending() { return this.status === 'PENDING'; }`;

  /**
   * Sample: the disabled-button bug and its fix.
   */
  readonly disableSample = `<!-- WRONG — 'invalid' is only true for status === 'INVALID'; PENDING is separate -->
<button [disabled]="form.invalid">Submit</button>

<!-- RIGHT — 'valid' is only true for status === 'VALID', so this blocks PENDING too -->
<button [disabled]="!form.valid">Submit</button>`;

  /**
   * Sample: multiple async validators, and how `composeAsyncValidators` merges
   * their error objects.
   */
  readonly multipleValidatorsSample = `asyncValidators: [uniqueUsername(), bannedWordCheck()],

// internally, composeAsyncValidators() does roughly —
forkJoin([uniqueUsername()(control), bannedWordCheck()(control)])
  .pipe(map((results) => mergeErrors(results)));   // spreads all results into one object`;
}
