import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, of, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, mergeMap, switchMap } from 'rxjs/operators';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Core Operators — the handful worth knowing, and the choice that
 * matters most.
 *
 * Covers `map`, `filter`, `tap`, `debounceTime`, `distinctUntilChanged`,
 * `catchError`, `take`/`takeUntil`, and the four flattening operators.
 *
 * Two live demos:
 *
 * - **A type-ahead**, counting keystrokes against searches actually issued, so
 *   `debounceTime` + `distinctUntilChanged` show up as a number rather than a
 *   claim.
 * - **`switchMap` against `mergeMap`**, racing the same trigger through both.
 *   This is the choice the lesson cares about: `switchMap` cancels the previous
 *   inner observable, `mergeMap` lets them all run. For a search box, `mergeMap`
 *   is a race condition with a stale winner; for a save queue, `switchMap`
 *   silently drops writes. Same signature, opposite failure modes — which is why
 *   the demo fires both from one button and shows the outputs side by side.
 *
 * @see intermediate/rxjs-observables — what these operate on.
 */
@Component({
  selector: 'app-lesson-rxjs-operators',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './rxjs-operators.html',
  styleUrl: './rxjs-operators.css',
})
export class RxjsOperators implements OnDestroy {
  /**
   * How to pick a flattening operator, as four questions asked in order. Framed as
   * a decision path rather than a table of definitions because the definitions are
   * easy and the *choice* is what people get wrong — and the choice is nearly
   * always settled by the first question that gets a yes.
   */
  protected readonly choosing = [
    {
      label: 'Does only the newest matter?',
      detail: 'Yes → `switchMap`. Search, autocomplete, a detail page following a selection',
      tone: 'accent' as const,
    },
    {
      label: 'Must they happen in order?',
      detail: 'Yes → `concatMap`. Queued writes, sequenced animations',
    },
    {
      label: 'Are they independent?',
      detail: 'Yes → `mergeMap`. Parallel uploads, fire-and-forget analytics',
    },
    {
      label: 'Should extras be ignored while busy?',
      detail: 'Yes → `exhaustMap`. Submit buttons, login, refresh',
    },
    {
      label: 'Still unsure?',
      detail:
        'If the values are writes, it is not `switchMap`. That rules out the dangerous answer',
      tone: 'good' as const,
    },
  ];

  /** The switchMap-for-writes trap. */
  protected readonly autosaveSample = `// Autosave a form as the user types.
this.formChanges$.pipe(
  debounceTime(500),
  switchMap((draft) => this.api.save(draft)),
).subscribe();

// The user types steadily for ten seconds.
// The API is slow — each save takes ~2s.
// What ends up on the server?`;

  /** Choices for the catchError-placement check. */
  protected readonly catchOptions = [
    {
      text: 'The failed search shows an error, and the next keystroke searches normally',
      why: 'That is what you get when `catchError` is on the *inner* observable — inside the `switchMap` callback. Placed on the outer pipe, it is handling the error after it has already escaped the inner stream.',
    },
    {
      text: 'The search box stops working entirely — no further keystroke does anything',
      correct: true,
      why: 'An error propagating to the outer stream *terminates* it. Observables have exactly one terminal event, and once the source has errored it will never emit again — `catchError` at that level can substitute a replacement observable, but the original keystroke stream is already dead. The input keeps accepting text and nothing happens, with no error in the console because you handled it. Put `catchError` inside the `switchMap` callback, on the inner request, so the failure is contained to that one lookup.',
    },
    {
      text: 'Every subsequent search also returns the fallback value',
      why: 'Closer to the truth in spirit — the pipeline is permanently altered — but nothing returns anything, because nothing runs. The stream is not stuck on a value; it has completed.',
    },
    {
      text: 'Nothing changes; `catchError` behaves the same wherever you put it in the pipe',
      why: 'Position is the entire question with `catchError`. It handles errors coming from *upstream of itself*, and what counts as upstream depends on whether you are inside or outside the flattening callback.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Do I really need to learn all four flattening operators?',
      a: "You need `switchMap` and `concatMap` fluently, because between them they cover reads and writes and the wrong one of those pair is a real bug. `exhaustMap` is worth recognising for the one job it is perfect at — a submit button that must not double-fire. `mergeMap` you will mostly meet in other people's code; it is the right answer when the calls are genuinely independent, and the wrong answer whenever order matters.",
    },
    {
      q: 'Why does `debounceTime` need `distinctUntilChanged` next to it?',
      a: 'Because debouncing is about *timing* and says nothing about *value*. Type "ng", delete both characters, retype "ng" slowly enough for the debounce to settle twice, and you have issued the same search twice. `distinctUntilChanged` drops an emission equal to the previous one, so the pair together mean "wait for a pause, and only then if something actually changed."',
    },
    {
      q: 'Is `tap` just for logging?',
      a: 'That is its most common honest use, along with setting a loading flag. The thing to avoid is treating it as a place to *do the work* — writing to a signal, navigating, mutating a store — because `tap` runs per subscription, so a stream with two subscribers runs your side effect twice. If it must happen exactly once, it belongs in the `subscribe` callback or behind a `shareReplay`.',
    },
    {
      q: 'What is the difference between `switchMap` and just using the newest value?',
      a: '`switchMap` actively unsubscribes from the previous inner observable, and for an HTTP request that unsubscribe aborts the network call. So you are not merely ignoring stale answers, you are cancelling the work. Filtering results by hand — checking "is this still the query I want?" in the subscribe — gets you the same UI and pays for every request anyway.',
    },
    {
      q: 'Why is a nested `subscribe` inside a `subscribe` an anti-pattern?',
      a: 'It works, which is why it survives review. What it loses is everything the operator would have given you: no cancellation of the inner stream when the outer emits again, no error propagation to a single handler, and no single subscription to tear down — so the inner ones leak. Every nested subscribe is a `*Map` operator waiting to be written; the only question is which of the four.',
    },
  ];

  /**
   * Keystrokes typed into the type-ahead.
   */
  protected readonly keystrokes = signal(0);
  /**
   * Searches actually issued. The gap against {@link keystrokes} is what
   * debouncing bought.
   */
  protected readonly searches = signal(0);
  /**
   * The type-ahead's latest result.
   */
  protected readonly result = signal('—');

  /**
   * The type-ahead's input stream.
   */
  private readonly query$ = new Subject<string>();
  /**
   * Every subscription this component holds, unsubscribed together on destroy.
   */
  private readonly subs = new Subscription();

  // --- Live #2: switchMap vs mergeMap race ---
  /**
   * Sequence source for race-demo request ids.
   */
  private fireId = 0;
  /**
   * Trigger for the `switchMap` arm of the race.
   */
  private readonly switch$ = new Subject<number>();
  /**
   * Trigger for the `mergeMap` arm — the same events, a different policy.
   */
  private readonly merge$ = new Subject<number>();
  /**
   * Requests fired, in order.
   */
  protected readonly fired = signal<number[]>([]);
  /**
   * Results that made it out of the `switchMap` arm. Shorter than {@link fired}:
   * the cancelled ones never arrive.
   */
  protected readonly switchOut = signal<number[]>([]);
  /**
   * Results that made it out of the `mergeMap` arm. Every request completes — but
   * not necessarily in the order it was fired.
   */
  protected readonly mergeOut = signal<number[]>([]);

  /**
   * Wires both demos.
   *
   * The type-ahead chains `debounceTime` (wait for a pause) then
   * `distinctUntilChanged` (ignore a repeat) before `switchMap`, which is the
   * standard three-step and does most of the work of not hammering an API.
   */
  constructor() {
    this.subs.add(
      this.query$
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap((q) => {
            this.searches.update((n) => n + 1);
            // simulate an API returning a transformed result
            return of(q).pipe(map((s) => (s ? `found "${s}"` : '—')));
          }),
        )
        .subscribe((r) => this.result.set(r)),
    );

    // Each fired id starts a 700ms "task"; switchMap cancels stale ones, mergeMap keeps all.
    this.subs.add(
      this.switch$
        .pipe(switchMap((id) => timer(700).pipe(map(() => id))))
        .subscribe((id) => this.switchOut.update((a) => [...a, id])),
    );
    this.subs.add(
      this.merge$
        .pipe(mergeMap((id) => timer(700).pipe(map(() => id))))
        .subscribe((id) => this.mergeOut.update((a) => [...a, id])),
    );
  }

  /**
   * Feeds a keystroke into the type-ahead.
   *
   * @param value The input's current text.
   */
  protected onType(value: string) {
    this.keystrokes.update((n) => n + 1);
    this.query$.next(value);
  }

  /**
   * Fires one request into both arms of the race, so the two policies are compared
   * on identical input.
   */
  protected fire() {
    const id = ++this.fireId;
    this.fired.update((a) => [...a, id]);
    this.switch$.next(id);
    this.merge$.next(id);
  }

  /**
   * Clears the race demo.
   */
  protected resetRace() {
    this.fireId = 0;
    this.fired.set([]);
    this.switchOut.set([]);
    this.mergeOut.set([]);
  }

  /**
   * Unsubscribes everything on teardown.
   */
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
