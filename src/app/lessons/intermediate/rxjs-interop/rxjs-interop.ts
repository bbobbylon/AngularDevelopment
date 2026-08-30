import { Component, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, map } from 'rxjs';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Signals ↔ RxJS Interop — converting at the boundary.
 *
 * Signals and observables are not competing answers to one question. A signal is
 * synchronous state with a value you can always read; an observable is a stream
 * of things that happen over time, with operators for debouncing, retrying and
 * cancelling. `@angular/core/rxjs-interop` supplies the two bridges —
 * `toSignal` and `toObservable` — so each can be used where it fits.
 *
 * The demos are a stream consumed as state (`toSignal` over an interval, no
 * `async` pipe in the template), and the full round trip: a signal out to RxJS
 * for `debounceTime` and straight back to a signal, which is how you get
 * operator power over signal-shaped state.
 *
 * @see intermediate/rxjs-operators — the operators worth crossing the bridge for.
 */
@Component({
  selector: 'app-lesson-rxjs-interop',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './rxjs-interop.html',
  styleUrl: './rxjs-interop.css',
})
export class RxjsInterop {
  /**
   * The round trip the demo below performs, station by station. Worth laying out
   * because the useful insight is that both *ends* are signals — RxJS is visited
   * for the middle three steps and then left behind.
   */
  protected readonly roundTrip = [
    { label: '`query` signal', detail: 'Set on every keystroke — synchronous state' },
    {
      label: '`toObservable()`',
      detail: 'Crossing into stream-land, where operators live',
      tone: 'accent' as const,
    },
    { label: '`debounceTime(500)`', detail: 'Swallow everything until the typing stops' },
    { label: '`switchMap()`', detail: 'In a real search: fire the request, cancel any in flight' },
    {
      label: '`toSignal()`',
      detail: 'Back to a value the template can just read',
      tone: 'good' as const,
    },
    { label: 'Template', detail: 'No `async` pipe, no subscription to remember' },
  ];

  /** The undefined-before-first-emission trap. */
  protected readonly initialValueSample = `@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  readonly users = toSignal(this.http.get<User[]>('/api/users'));
}

// In a component template, on first render:
//   {{ users().length }}

// The request takes 200ms. What renders?`;

  /** Choices for the debounce + switchMap check. */
  protected readonly pipelineOptions = [
    {
      text: 'Three — one per keystroke',
      why: 'That is what you get *without* `debounceTime`. Its whole job is to swallow emissions that are followed by another one too quickly, so the three keystrokes never reach `switchMap` as three separate values.',
    },
    {
      text: 'One',
      correct: true,
      why: '`debounceTime(300)` only lets a value through once 300ms have passed with no new one. Typing quickly means the first two are discarded before they are ever emitted, so `switchMap` is handed a single value and makes a single request.',
    },
    {
      text: 'Three, but only the last response is used',
      why: 'This describes `switchMap` alone — it does cancel the *subscription* to earlier inner observables, so earlier responses are ignored. But cancelling a response is not the same as never sending the request: your server would still see three. Debouncing is what stops them being sent.',
    },
    {
      text: 'None — `toObservable` only emits after the component stabilises',
      why: '`toObservable` emits the current value to each new subscriber and then every subsequent change. There is no gate on component stability; the values flow as soon as they are set.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Why does `toSignal` need an `initialValue` at all? Observables manage without one.',
      a: 'Because the two shapes differ on exactly this point. A signal is defined by always having a value — that is what lets a template read it synchronously during rendering. An Observable may not have emitted yet. `initialValue` is what you put on the whiteboard while you wait for the first value off the tape. Without one, the type is `T | undefined` and you have to handle it.',
    },
    {
      q: 'What is `requireSync` for?',
      a: 'It is the escape hatch for sources that genuinely do emit immediately — a `BehaviorSubject`, or a `startWith(...)` pipeline. `{ requireSync: true }` tells Angular "trust me, a value arrives synchronously", and in exchange the type is plain `T` rather than `T | undefined`. If the source turns out not to emit synchronously, it throws at creation rather than handing you a broken signal.',
    },
    {
      q: 'What happens if the Observable errors?',
      a: 'The error is re-thrown *when you read the signal* — which usually means during template rendering, in a stack trace that points at your template rather than at the HTTP call that failed. Put a `catchError` in the pipe before `toSignal` and map the failure into a value your template can render, such as an empty array or an error object.',
    },
    {
      q: 'Do I still need the `async` pipe?',
      a: 'Rarely, and that is the point. `toSignal` does the same job in the class instead of the template: subscribes, unsubscribes on destroy, and gives you something readable. It is also more flexible — you can feed the result into a `computed`, which you cannot do with an `async` pipe result. The `async` pipe is not deprecated, it is just usually the more awkward of the two now.',
    },
    {
      q: 'Should I convert everything to signals and be done with RxJS?',
      a: 'No, and trying is how people end up reimplementing operators badly. Anything involving *time* — debouncing, retry with backoff, cancelling a request because a newer one arrived, combining two sources by arrival order — is what streams are for, and signals have no answer to it. Convert at the boundary: state lives as signals, orchestration happens in RxJS.',
    },
  ];

  // toSignal: an Observable consumed as a signal, auto-unsubscribed on destroy.
  /**
   * A counter driven by an interval and consumed as a signal. `initialValue`
   * removes the `undefined` a not-yet-emitted stream would otherwise produce.
   */
  protected readonly tick = toSignal(interval(1000).pipe(map((n) => n + 1)), {
    initialValue: 0,
  });

  /**
   * The same tick multiplied, fed by an RxJS pipeline in the constructor rather
   * than a `computed` — so the round trip is visible.
   */
  protected readonly tickTimesTen = signal(0);

  // The full round-trip: a signal → toObservable → debounceTime → toSignal.
  /**
   * What the user typed, immediately.
   */
  protected readonly query = signal('');
  /**
   * The same text after a 500 ms pause: signal → `toObservable` → `debounceTime`
   * → `toSignal`. Nothing in signals alone does this, which is the argument for
   * the bridge existing.
   */
  protected readonly debounced = toSignal(toObservable(this.query).pipe(debounceTime(500)), {
    initialValue: '',
  });

  /**
   * Wires the `toObservable` demo. `takeUntilDestroyed` ends the subscription with
   * the component, which is what makes subscribing here safe.
   */
  constructor() {
    // Demonstrate toObservable + takeUntilDestroyed feeding another signal.
    const tick$ = toObservable(this.tick);
    tick$.pipe(takeUntilDestroyed()).subscribe((v) => this.tickTimesTen.set(v * 10));
  }

  /**
   * Updates the query.
   *
   * @param v The input's text.
   */
  protected setQuery(v: string): void {
    this.query.set(v);
  }
}
