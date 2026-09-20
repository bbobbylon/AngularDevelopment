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
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
  TapeCard,
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
import { BrainPower, Chain, Receipt, Scribble } from '../../../shared/shapes';
import type { ReceiptRow } from '../../../shared/shapes';

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
 * Same check as {@link uniqueUsername}, but first asks one extra question:
 * is the control's current value the SAME value the record already had? If
 * so it resolves with a synchronous `of(null)` — valid — instead of asking
 * the server whether a username is taken by the one person it's guaranteed
 * to already belong to: this user.
 */
function uniqueUsernameForEdit(originalValue: string, onCheckStart?: () => void): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (control.value === originalValue) {
      return of(null); // valid, synchronously — no request goes out at all
    }
    return of(TAKEN.includes((control.value ?? '').toLowerCase())).pipe(
      tap(() => onCheckStart?.()),
      delay(700),
      map((taken) => (taken ? { taken: true } : null)),
    );
  };
}

/**
 * Lesson: Async Validators — validation that has to ask someone else before it can answer.
 *
 * Covers `AsyncValidatorFn`, the `PENDING` status, why async validators only run once the
 * synchronous ones pass, what actually stops a stale keystroke's response from overwriting a
 * fresher one (it isn't `switchMap`), and how multiple async validators on one control are
 * combined.
 *
 * ## Teaching order
 *
 * Mirrors `expert/change-detection` (the reference implementation for this layer): pose the
 * problem — a synchronous function cannot wait for a server — before naming `PENDING`; give
 * the "bouncer phones head office" analogy before any API surface; then work through the one
 * idea the whole lesson turns on — that a stale check can never win a race against a fresher
 * one — five separate ways: the analogy, a dialogue between `AbstractControl` and two
 * competing checks, a timeline-plus-comparison diagram, the framework's own (simplified)
 * source, and a live demo racing a debounced field against a naive one with a request
 * counter on each.
 *
 * ## What this lesson corrects
 *
 * "The Observable must complete" is the folk version of the completion rule, and it is
 * usually harmless — but Angular's own subscription, `obs.subscribe((errors) =>
 * this.setErrors(errors))`, only reacts to an emitted *value*; completion by itself is never
 * checked for a single validator. What actually strands a control is a source that never
 * emits at all — a `filter` that silently drops the "everything's fine" case is the sharpest
 * example, and the subject of this lesson's predict-before-reading trap. The folk version
 * becomes exactly true again once a control has two or more async validators, because those
 * are combined with `forkJoin`, which itself never emits until every source has completed.
 *
 * @see intermediate/reactive-forms — the form model these attach to.
 * @see intermediate/form-validation — synchronous validators, which async ones run after.
 * @see intermediate/form-arrays — next in the Forms track.
 *
 * ## Page shape (BACKLOG §2.10 step 5, batch 6)
 *
 * Opens as `receipt`: the topic genuinely is a cost, itemised in
 * {@link keystrokeBillRows} — five keystrokes typing "admin", five separate
 * 700ms server checks, four of them for a username nobody was ever going to
 * submit. The compare panel reuses the existing {@link defineSample} (wrong
 * side) and {@link debounceSample} (right side) rather than new code; the
 * `app-code-lab` RELOCATES the existing {@link underTheHoodSample}/
 * {@link underTheHoodNotes} up from the page's own "Under the hood" section
 * (a short callback note sits at the old spot) because it's the actual
 * mechanism the receipt's numbers come from. The block's own
 * {@link requestCountQuizOptions} checks the specific "does cancelling stop
 * the request from being SENT" misconception the live demo's counters prove
 * wrong; the existing {@link polarityQuizOptions} (kept later) tests a
 * different bug entirely. See `docs/CONTRIBUTING.md` §2C.
 */
@Component({
  selector: 'app-lesson-async-validators',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    Chain,
    Receipt,
    Scribble,
  ],
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

  /**
   * Requests the naive edit-mode validator issued — nonzero the instant the
   * form loads, because it re-checks the user's own current value.
   */
  protected readonly editChecks = signal(0);
  /**
   * Requests the fixed edit-mode validator issued — stays 0 until the value
   * genuinely changes from the original.
   */
  protected readonly editChecksFixed = signal(0);

  /**
   * Edit form, naive: the unmodified create-form validator, seeded with the
   * record's own current username.
   */
  protected readonly editUsername = this.fb.control('ada', {
    validators: [Validators.required],
    asyncValidators: [uniqueUsername(() => this.editChecks.update((n) => n + 1))],
    updateOn: 'change',
  });

  /**
   * Edit form, fixed: skips the check entirely when the value hasn't moved
   * from the original.
   */
  protected readonly editUsernameFixed = this.fb.control('ada', {
    validators: [Validators.required],
    asyncValidators: [
      uniqueUsernameForEdit('ada', () => this.editChecksFixed.update((n) => n + 1)),
    ],
    updateOn: 'change',
  });

  /**
   * Resets both edit-mode fields back to the seeded 'ada' value, re-running
   * both validators from scratch.
   */
  protected resetEditDemo() {
    this.editUsername.reset('ada');
    this.editUsernameFixed.reset('ada');
    this.editChecks.set(0);
    this.editChecksFixed.set(0);
  }

  // ── Code samples shown to the reader ────────────────────────────────────────
  // Kept as class fields, never as literal markup, so braces and @-symbols in
  // the samples never sit directly in the template (see lesson-authoring notes).

  /**
   * Sample: defining an `AsyncValidatorFn`.
   */
  protected readonly defineSample = `const TAKEN = ['admin', 'root', 'ada'];

// A FACTORY that returns the validator, so you can configure it at the call
// site. The returned function is what the forms system actually calls.
function uniqueUsername(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    // In real code this line is an http.get(). of() stands in for it so the
    // sample runs with no backend.
    of(TAKEN.includes(control.value.toLowerCase())).pipe(
      delay(700),                                   // pretend network latency
      // Same inversion as sync validators: an OBJECT means invalid, null
      // means valid. The key 'taken' is what the template checks for.
      map((taken) => (taken ? { taken: true } : null)),
      // of() both emits AND completes on its own — and emitting is the
      // part that actually matters: Angular's internal subscribe only
      // reacts to a VALUE. A source that completes without ever emitting
      // one (see "Under the hood" below) leaves the control PENDING forever.
    );
}`;

  /** Line-by-line walkthrough of {@link defineSample}. */
  protected readonly defineNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Stands in for a real lookup. In production this function has no hardcoded list — it calls `this.http.get(...)` (or similar) and lets the response decide the result.',
    },
    {
      line: 5,
      text: 'A **factory**, not the validator itself. Calling it — `uniqueUsername()` — is what produces the function Angular actually calls; writing it this way is what lets a real version take an `HttpClient` or a minimum length as a parameter.',
    },
    {
      line: 6,
      text: 'The function Angular calls, once per revalidation, with the control as its only argument. A sync `ValidatorFn` returns `ValidationErrors | null` directly; this returns the same contract wrapped in an `Observable`, because the answer is not ready yet.',
    },
    {
      line: 9,
      text: "`of()` wraps a plain value in a cold Observable that emits it once, synchronously, the moment something subscribes. This is the line a real implementation swaps for `this.http.get<boolean>('/api/username-taken', …)`.",
    },
    {
      line: 10,
      text: 'Stands in for round-trip latency. Skip it and you would never see `PENDING` at all — everything would resolve on the same tick.',
    },
    {
      line: 13,
      text: 'The whole contract, on one line: **any non-null value** — an object, `true`, even `false` — means "has errors"; **only `null`** means valid. Returning a bare boolean instead of `{ taken: true }` / `null` is the classic way to get this backwards — there is a self-test on exactly this further down.',
    },
  ];

  /**
   * Sample: registering it, in the `asyncValidators` slot rather than alongside
   * the synchronous ones.
   */
  protected readonly registerSample = `username: ['', {
  validators: [Validators.required],
  asyncValidators: [uniqueUsername()],
  updateOn: 'blur',   // optional: validate on blur, not every keystroke
}],`;

  /** Line-by-line walkthrough of {@link registerSample}. */
  protected readonly registerNotes: CodeNote[] = [
    {
      line: 1,
      text: "FormBuilder's object-config overload: the first array element is the initial value, the second is an **options object**. The plain shorthand `['', Validators.required]` only accepts synchronous validators, which is exactly why an async one needs this longer form.",
    },
    {
      line: 2,
      text: 'The synchronous validators array — checked first, and always synchronously, on every revalidation.',
    },
    {
      line: 3,
      text: 'A **separate** option, not appended into `validators`. A `ValidatorFn` and an `AsyncValidatorFn` have incompatible return types, so Angular exposes two slots and composes each on its own (`compose()` for sync, `composeAsyncValidators()` + `forkJoin` for async — see "Under the hood"). Putting an async validator in the sync slot throws at runtime.',
    },
    {
      line: 4,
      text: "Controls when *any* validator reruns: every `valueChanges` emission (`'change'`, the default), only on blur, or only on submit. `'blur'` is a built-in alternative to hand-rolled debouncing — one request per visit to the field, not one per keystroke.",
    },
  ];

  /**
   * Sample: debouncing inside the validator with `timer` + `switchMap`.
   */
  protected readonly debounceSample = `function uniqueUsernameDebounced(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> =>
    timer(400).pipe(                                // wait for a pause in typing
      switchMap(() => of(TAKEN.includes(control.value.toLowerCase())).pipe(delay(700))),
      map((taken) => (taken ? { taken: true } : null)),
    );
}`;

  /** Line-by-line walkthrough of {@link debounceSample}. */
  protected readonly debounceNotes: CodeNote[] = [
    {
      line: 3,
      text: '`timer(400)` emits exactly once, 400ms after something subscribes to it — the "wait for a pause in typing" mechanism. Nothing else in this pipe runs before that.',
    },
    {
      line: 4,
      text: 'Once the pause elapses, switch into the network call. `switchMap` is the conventional operator here — though see "Under the hood": for a single async validator, the real cancellation guarantee comes from `AbstractControl` itself, not from this operator.',
    },
    {
      line: 5,
      text: 'The identical contract as `defineSample`: an object means invalid, `null` means valid.',
    },
  ];

  /**
   * Sample: the edit-mode fix — skip the check entirely when the control's
   * value matches the record's own original value.
   */
  protected readonly editModeSample = `function uniqueUsernameForEdit(originalValue: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (control.value === originalValue) {
      return of(null);   // valid, synchronously — no request goes out at all
    }
    return checkServer(control.value);   // only a genuine change asks the server
  };
}`;

  /** Line-by-line walkthrough of {@link editModeSample}. */
  protected readonly editModeNotes: CodeNote[] = [
    {
      line: 1,
      text: '`originalValue` is the username the record already had — captured once, when the edit form loaded, from whatever fetched the record in the first place.',
    },
    {
      line: 3,
      text: 'Compares the CURRENT control value against the ORIGINAL one — not against the taken list. If the value has not moved, there is nothing new for a server to answer.',
    },
    {
      line: 4,
      text: '`of(null)` is a cold Observable that emits `null` and completes on the same synchronous tick it\'s subscribed. Per "Under the hood" above, `status` still flips to `PENDING` for a moment — but `setErrors(null)` runs in that same tick, so nobody watching the status pill ever sees it, unlike the ~700ms real check.',
    },
    {
      line: 6,
      text: 'Only a value that genuinely differs from the original reaches a real check — the same shape as `uniqueUsername` at the top of this page.',
    },
  ];

  /**
   * Sample: an async validator that looks correct — it reads the server and
   * resolves with the right shape — but silently strands the control on
   * `PENDING` whenever the username is actually free. See the predict block
   * that uses this sample for why.
   */
  protected readonly filteredOutSample = `function uniqueUsername(): AsyncValidatorFn {
  return (control: AbstractControl) =>
    http.get<boolean>('/api/username-taken', { params: { u: control.value } }).pipe(
      filter((taken) => taken),                 // only lets a TAKEN result through…
      map(() => ({ taken: true }) as ValidationErrors | null),
    );
}`;

  /** The predict prompt paired with {@link filteredOutSample}. */
  protected readonly filteredOutPrompt =
    'This validator only writes code for the "taken" case — `filter` is there to let a bad result ' +
    'through to `map`, and stop everything else. Type a username you know is FREE. What does the ' +
    'field show a few seconds later, and why?';

  /** The reveal for {@link filteredOutPrompt}. */
  protected readonly filteredOutAnswer =
    'It never leaves "checking…" — not even once the round trip finishes. For a free username, ' +
    '`taken` is `false`, so `filter((taken) => taken)` drops it, and the Observable completes having ' +
    "emitted **nothing at all**. Angular's internal subscription — `obs.subscribe((errors) => " +
    'this.setErrors(errors))` — only reacts to a value; if none ever arrives, `setErrors()` is never ' +
    'called, and the status stays `PENDING` forever with nothing in the console. (A taken username ' +
    'still resolves fine, which is exactly what makes this bug easy to ship — it only breaks for the ' +
    'answer you actually wanted.) The fix is not about completing anything — `http.get()` already ' +
    "completes on its own — it's making sure the stream always emits a value: " +
    '`taken ? { taken: true } : null`, no filtering.';

  /**
   * Sample: `updateValueAndValidity` simplified from the framework source —
   * where `PENDING` is set, and why sync validators gate the async ones.
   */
  protected readonly underTheHoodSample = `// Simplified from AbstractControl (@angular/forms) — runs on every value change:

updateValueAndValidity() {
  cancelExistingSubscription()          // unsubscribe the PREVIOUS async validator's Observable
  this.errors = runSyncValidators()     // sync validators run first, synchronously
  this.status = calculateStatus()       // errors present -> INVALID, else -> VALID (for now)

  if (this.status === VALID) {          // async validators are skipped if sync failed
    this.status = PENDING               // flips immediately — before anything resolves
    const obs = toObservable(this.asyncValidator(this))   // call your factory fresh, every time
    this.asyncValidationSubscription = obs.subscribe((errors) => {
      this.setErrors(errors)            // runs on every EMITTED value — no separate "on complete" handler
    })
  }
}`;

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 4,
      text: 'The **first** thing that happens on every revalidation: Angular unsubscribes whatever async validator Observable is currently in flight for this control — in full. This is the real mechanism behind the "hangs up on the last call" dialogue above; it has nothing to do with which RxJS operator your own validator happens to use.',
    },
    {
      line: 5,
      text: 'Synchronous validators run first, synchronously — `errors` is a plain object or `null`, computed and returned immediately.',
    },
    {
      line: 6,
      text: 'The result decides `status` right away: any errors → `INVALID`, none → `VALID` — provisionally, since the next line is a gate that can still change that.',
    },
    {
      line: 8,
      text: 'The gate. If a sync validator already produced an error, `status` is already `INVALID` and the async validator function is **never even called** — no wasted request for an empty required field.',
    },
    {
      line: 9,
      text: 'Set synchronously, immediately, before the Observable has done anything. This is why the UI shows "checking…" the instant you type, not 700ms later.',
    },
    {
      line: 10,
      text: "Calls your factory-returned function **fresh, every single time** — a brand-new Observable instance per revalidation, nothing cached or reused. `toObservable` also wraps a `Promise` via RxJS's `from()`, which is why an `async` function works as a validator too.",
    },
    {
      line: 11,
      text: 'Notice what this subscribe call does **not** have: an error handler. An errored source never reaches the line below.',
    },
    {
      line: 12,
      text: 'The only thing this subscription reacts to is a **value**. There is no "and then it completed" branch anywhere in this method — the precise mechanism behind the callout just below.',
    },
  ];

  /**
   * Sample: the status getters, showing that `invalid` and `pending` are separate
   * booleans over one `status` string.
   */
  protected readonly statusGettersSample = `get valid()   { return this.status === 'VALID'; }
get invalid() { return this.status === 'INVALID'; }
get pending() { return this.status === 'PENDING'; }`;

  /**
   * Sample: the wrong way to gate a submit button on validity.
   */
  protected readonly pendingWrongSample = `[disabled]="form.invalid"`;
  /**
   * Sample: the right way — blocks both `INVALID` and `PENDING`.
   */
  protected readonly pendingRightSample = `[disabled]="!form.valid"`;

  /**
   * Sample: multiple async validators, and how `composeAsyncValidators` merges
   * their error objects.
   */
  protected readonly multipleValidatorsSample = `asyncValidators: [uniqueUsername(), bannedWordCheck()],

// internally, composeAsyncValidators() does roughly —
forkJoin([uniqueUsername()(control), bannedWordCheck()(control)])
  .pipe(map((results) => mergeErrors(results)));   // spreads all results into one object`;

  /** Line-by-line walkthrough of {@link multipleValidatorsSample}. */
  protected readonly multipleValidatorsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Both validators subscribe **at the same time** — neither waits for the other to start.',
    },
    {
      line: 4,
      text: 'An RxJS operator that subscribes to every source and emits once, only after **all** of them have completed, combining their latest values into an array. Two consequences follow: the **slowest** validator sets the pace for the whole control — if one resolves in 100ms and the other takes 2 seconds, the control is `PENDING` for the full 2 seconds — and if even one of them **never completes**, `forkJoin` never emits at all, so the whole control stays `PENDING` forever, even though the other validator finished ages ago. This is the one place the "must complete" shorthand from "Under the hood" is exactly true.',
    },
    {
      line: 5,
      text: "Spreads each validator's result object into one combined object. If two validators return the **same error key**, the later one in the array silently overwrites the earlier one's value for that key — give each validator its own distinct key.",
    },
  ];

  // ── Presentation data ────────────────────────────────────────────────────

  /** Chapter rail: this lesson's position in the Forms track. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Reactive Forms', id: 'reactive-forms' },
    { label: 'Form Validation', id: 'form-validation' },
    { label: 'Async Validators' },
    { label: 'FormArray', id: 'form-arrays' },
    { label: 'Signal Forms', id: 'signal-forms' },
  ];

  // ── Shape block: the receipt ────────────────────────────────────────────────

  /** The itemised bill: one keystroke, one 700ms server check, every time. */
  protected readonly keystrokeBillRows: ReceiptRow[] = [
    { label: "'a'", amount: '1 check' },
    { label: "'ad'", amount: '1 check' },
    { label: "'adm'", amount: '1 check' },
    { label: "'admi'", amount: '1 check' },
    { label: "'admin'", amount: '1 check', tone: 'warn' },
  ];

  /** The total the bill above adds up to. */
  protected readonly keystrokeBillTotal: ReceiptRow = { label: 'TOTAL', amount: '5 server checks' };

  /**
   * The shape block's own quiz — the specific misconception the receipt's
   * numbers exist to correct: that cancelling a stale check stops it from
   * ever having been SENT. The distractors are the ways a reader could read
   * "AbstractControl cancels the previous check" and conclude the wrong
   * thing about cost rather than correctness.
   */
  protected readonly requestCountQuizOptions: QuizOption[] = [
    {
      text: 'One — AbstractControl cancels the earlier checks, so they never actually go out in the first place.',
      why: 'Cancellation unsubscribes the Observable — it stops a stale answer from ever reaching setErrors(). It does nothing to a request that already left before the next keystroke arrived, which for this validator is every single one of them.',
    },
    {
      text: 'Five — one full check fires per keystroke; cancellation only stops the ANSWER from arriving, never the request from going out.',
      correct: true,
      why: "Exactly what the receipt above counts. uniqueUsername's tap() fires the instant something subscribes — synchronously, before the 700ms delay even starts — so by the time the next keystroke cancels this one, the request is already gone. Debouncing is what stops the request from being SENT; cancellation only stops a late answer from being heard.",
    },
    {
      text: 'Five, but only the final one is a real network call — the rest are silently skipped.',
      why: 'Nothing is skipped. Every one of the five keystrokes independently triggers updateValueAndValidity(), and every one calls the async validator factory fresh — four wasted 700ms round trips, not four no-ops.',
    },
    {
      text: 'It depends on the network — a fast enough connection could let earlier checks finish before being cancelled, cutting the count.',
      why: 'Request COUNT has nothing to do with round-trip speed — five keystrokes fire five checks regardless of how fast any of them come back. Speed only changes whether a given check finishes before the next keystroke cancels it, not whether it was sent.',
    },
  ];

  /**
   * The analogy played out as a mechanism, not a vibe: two checks compete for
   * the same control, and only one of them is ever allowed to speak.
   */
  protected readonly cancelTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I typed `ad`, then before the head-office call about `ad` came back, I typed `ada`. Which call gets to answer?',
    },
    {
      who: 'AbstractControl',
      says: "Neither races. The moment you type `ada`, I call `cancelExistingSubscription()` first — `ad`'s call is hung up before I even dial `ada`'s.",
    },
    {
      who: "`ad`'s check",
      says: "I might still be on hold with the server. Doesn't matter — nobody on this end is listening to me any more.",
    },
    {
      who: "`ada`'s check",
      says: "I'm the only call this control has open. Whatever I come back with is what `setErrors()` uses.",
    },
  ];

  /** The keystroke-to-verdict timeline. */
  protected readonly checkFlow: FlowStep[] = [
    { label: 'Keystroke', detail: '`valueChanges` fires; `updateValueAndValidity()` runs' },
    {
      label: 'status → PENDING',
      detail: 'Set synchronously, before anything has come back',
      tone: 'accent',
    },
    {
      label: 'Previous check cancelled',
      detail: 'Any Observable still in flight for this control is unsubscribed first',
      tone: 'warn',
    },
    { label: 'New Observable subscribed', detail: 'Your factory function runs fresh, every time' },
    { label: 'Server responds (~700ms)', detail: 'Emits `ValidationErrors | null`' },
    {
      label: 'status → VALID / INVALID',
      detail: 'Only once that Observable has also emitted a value',
      tone: 'good',
    },
  ];

  /**
   * The self-test: returning the wrong polarity from `map`.
   *
   * The distractors are the three ways a half-knowledgeable reader actually
   * gets this wrong — confusing JS truthiness with the framework's strict
   * `=== null` check, over-trusting TypeScript to catch a runtime mismatch,
   * and mixing up the "does it emit" rule with the "does it complete" rule
   * from "Under the hood". Each `why` names the real mechanism, not just the
   * verdict (CONTRIBUTING §2A).
   */
  protected readonly polarityQuizQuestion =
    "Your async validator's `map` step returns `false` when the username is available, and " +
    "`{ taken: true }` when it's taken — assume nothing in the pipeline catches the type mismatch. " +
    'What does the control actually do?';

  /** Points back at {@link defineNotes}'s line-13 note after the reveal. */
  protected readonly polarityQuizFollowUp =
    'The fix is the one-line rule from "What does defining one actually look like?" above: ' +
    '`taken ? { taken: true } : null` — never a bare boolean.';

  protected readonly polarityQuizOptions: QuizOption[] = [
    {
      text: 'It works exactly like `null` would — `false` is falsy, so Angular treats it the same as "no errors".',
      why: "Not how the check works. Angular tests **identity with `null`** (`errors !== null`), never truthiness. `false !== null` is `true`, so this option's own premise is the actual bug.",
    },
    {
      text: 'The control is permanently `INVALID` for every username, including ones that are genuinely free.',
      correct: true,
      why: 'Any value other than exactly `null` counts as "has errors" — including `false`, `0` or `undefined`. `setErrors(false)` runs the same `errors !== null` check as `setErrors({ taken: true })`, so a free username reports as taken and can never pass.',
    },
    {
      text: "TypeScript stops this from compiling, since `false` isn't assignable to `ValidationErrors | null`.",
      why: 'True only when the return type stays annotated as `ValidationErrors | null` all the way through the `.pipe()` chain and strict mode is on. Plenty of real code loses that annotation somewhere in the middle — which is exactly why this reaches production.',
    },
    {
      text: "The control stays `PENDING` forever, because `false` doesn't satisfy the Observable's completion requirement.",
      why: 'Mixes up two separate rules. Whether the Observable ever **emits** decides if the control resolves at all (see "Under the hood"); what it resolves **to** is decided by comparing the emitted value against `null`. `false` is a perfectly good — if wrong — value to resolve with.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'The spinner never stops — the control is stuck on `PENDING`. Why?',
      a: 'Two real causes. Either the Observable never **emits** a value at all — the exact bug in the "spot the silent failure" block above — or it **errors** instead: Angular\'s internal `subscribe()` only supplies a `next` handler, so an uncaught error never reaches `setErrors()` either. `catchError` inside your own validator, always, and resolve to `null` or an error object rather than letting the source throw.',
    },
    {
      q: 'My submit button uses `[disabled]="form.invalid"` and people can still click it mid-check. What\'s wrong?',
      a: '`invalid` only reflects `status === \'INVALID\'`. `PENDING` is a separate status where `invalid` is `false` — see the compare panel above. Use `[disabled]="!form.valid"` instead.',
    },
    {
      q: 'Does `switchMap` actually cancel the stale request, or is that a myth?',
      a: "Half myth. For a **single** async validator on a control, `AbstractControl` itself unsubscribes the entire previous Observable before creating a new one — that's what actually stops a stale response from winning, independent of any operator inside your validator. `switchMap` earns its keep once a validator's Observable can emit more than once per subscription; for the common \"debounce, then one HTTP call\" shape, it isn't doing the cancelling you might think it is.",
    },
    {
      q: 'Two async validators on the same control both return an error under the key `taken`. What happens?',
      a: "Both run in parallel via `forkJoin` and their result objects are merged with a plain object spread. Whichever validator is **later** in the `asyncValidators` array wins that key — the earlier one's error is silently discarded. Give each validator its own key.",
    },
    {
      q: 'Do async validators ever run before the synchronous ones?',
      a: 'No. `updateValueAndValidity()` runs every synchronous validator first and only calls the async one if the resulting status is already `VALID` — an empty required field never reaches the server.',
    },
  ];
}
