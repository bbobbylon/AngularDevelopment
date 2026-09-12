import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { RateEvent } from './outputs.shared';
import { Rating } from './rating/rating';

/**
 * Lesson: Component Outputs — sending events up.
 *
 * Covers the `output()` function, emitting typed payloads, `output<void>()` for
 * bare notifications, and how a parent binds with `(eventName)`.
 *
 * The framing the lesson uses: inputs flow down, outputs flow up, and neither
 * crosses back. A child never writes to its input, and a parent never reaches
 * into a child — the two talk only through this pair. Keeping that boundary is
 * what makes a component reusable somewhere it was not designed for.
 *
 * Also notes what changed from `@Output() new EventEmitter()`: `output()` is not
 * an RxJS subject, has no `.subscribe()` for consumers, and is completed for you
 * when the component is destroyed.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer — see `expert/change-detection` for the
 * reference shape this copies: pose the problem before naming it, an analogy
 * before the mechanism, then the same idea again in several modes. Here that
 * means the child/parent problem first, the doorbell analogy, the mechanism as
 * two `<app-code-lab>` panels (the child's side, then the parent's), a live
 * demo, a table against `input()` (the missing signal this migration adds), and
 * a comparison of `output()` against the classic `@Output() EventEmitter`.
 *
 * @see beginner/inputs — the other half of the contract; the table below
 * compares them directly.
 */
@Component({
  selector: 'app-lesson-outputs',
  imports: [
    RouterLink,
    Rating,
    DatePipe,
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
  ],
  templateUrl: './outputs.html',
  styleUrl: './outputs.css',
})
export class Outputs {
  /** The "you are here" rail — the local neighbourhood of the beginner track. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Lifecycle', id: 'lifecycle' },
    { label: 'Inputs', id: 'inputs' },
    { label: 'Outputs' },
    { label: 'Services & DI', id: 'services-di' },
    { label: 'Signals', id: 'signals' },
  ];

  /**
   * The child's side of the mechanism: declaring a typed output and emitting
   * from it. Shown in its own `<app-code-lab>` before the parent's side, so the
   * reader sees "announce" before they see "react".
   */
  protected readonly declareSample = `export class Rating {
  rate = output<RateEvent>();

  select(stars: number) {
    this.rate.emit({ stars, at: new Date() });
  }
}`;

  /** Line-by-line walkthrough of {@link declareSample}. */
  protected readonly declareNotes: CodeNote[] = [
    {
      line: 1,
      text: "The child component. Nothing on this line marks it as talking to a parent — that is entirely the next line's job.",
    },
    {
      line: 2,
      text: '`output<RateEvent>()` creates a typed emitter and assigns it to `rate`. No `new`, and calling `output()` here only *creates* the emitter — it does not fire anything yet.',
    },
    {
      line: 4,
      text: 'An ordinary method, triggered by a star being clicked (see `rating.html`). Nothing forces it to announce anything — the next line is a deliberate choice this method makes.',
    },
    {
      line: 5,
      text: 'The whole contract, on one line. `rate.emit(...)` packages a `RateEvent` object and sends it upward. There is no matching way for a parent to reach back in and read `rate` directly — emitting is the only door out.',
    },
  ];

  /**
   * The parent's side: binding the output and reading `$event`. Deliberately a
   * separate sample from {@link declareSample} — the two halves of the wire,
   * read in the order the reader will actually write them.
   */
  protected readonly bindSample = `<app-rating (rate)="onRate($event)" (cleared)="onClear()" />

onRate(e: RateEvent) {
  this.last.set(e);
}`;

  /** Line-by-line walkthrough of {@link bindSample}. */
  protected readonly bindNotes: CodeNote[] = [
    {
      line: 1,
      text: '`(rate)` is event-binding syntax — parentheses, not square brackets, because this *listens* rather than pushes a value in. `$event` inside the quotes will be filled in with whatever the child passed to `.emit()`.',
    },
    {
      line: 3,
      text: '`e: RateEvent` — the same type the child declared on `output<RateEvent>()`. TypeScript can check this end to end because the output was typed, not just named.',
    },
    {
      line: 4,
      text: 'The parent decides what a rating event *means*. Here it remembers the last one; a different parent could ignore it, log it, or save it to a server — the child has no say, and no way of finding out which.',
    },
  ];

  /** The `$event` question, posed before the note that answers it. */
  protected readonly eventSample = `// child
rate = output<RateEvent>();
this.rate.emit({ stars: 4, at: new Date() });

// parent
<app-rating (rate)="onRate($event)" />`;

  /**
   * The exchange a `rate.emit(...)` actually sets off. Exists because the
   * relationship it describes is the one beginners reliably get backwards:
   * they assume the child is somehow calling the parent's method. It never is.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'The child (`Rating`)',
      says: "Someone tapped 4 stars. I'm calling `rate.emit({ stars: 4, at: ... })`.",
    },
    {
      who: 'The parent',
      says: "`$event` just arrived — `{ stars: 4, at: ... }`. I'll decide what that means.",
    },
    {
      who: 'The child',
      says: "I don't know what you'll do with it. I don't even know if anyone's listening at all.",
    },
    {
      who: 'The parent',
      says: "That's fine by design. I could save it, log it, or throw it away — you'll never find out, and you don't need to.",
    },
  ];

  /** The unidirectional data loop, which is the real subject of this lesson. */
  protected readonly loop: FlowStep[] = [
    { label: 'Child emits', detail: 'A typed payload leaves the child' },
    {
      label: 'Parent handles',
      detail: 'The bound method runs with `$event`',
      tone: 'accent' as const,
    },
    { label: 'Parent updates', detail: 'It changes state it owns' },
    {
      label: 'Input flows down',
      detail: 'The child re-renders from the new value',
      tone: 'good' as const,
    },
  ];

  /** Compact "before" snippet for the classic-vs-modern comparison. */
  protected readonly classicOutputSample = `@Output() rate = new EventEmitter<RateEvent>();

select(stars: number) {
  this.rate.emit({ stars, at: new Date() });
}`;

  /** Compact "now" snippet for the classic-vs-modern comparison. */
  protected readonly modernOutputSample = `rate = output<RateEvent>();

select(stars: number) {
  this.rate.emit({ stars, at: new Date() });
}`;

  /** Choices for the two-way binding check. */
  protected readonly twoWayOptions: QuizOption[] = [
    {
      text: 'An input called `value` and an output called `valueChange`',
      correct: true,
      why: 'That is the whole convention. `[(value)]` is pure syntax sugar over `[value]` plus `(valueChange)`, and the `Change` suffix is what makes the pair discoverable to the compiler. `model()` generates exactly this.',
    },
    {
      text: 'A single two-way binding primitive built into Angular',
      why: 'There is no such primitive. The banana-in-a-box is desugared by the compiler into the input/output pair before anything runs.',
    },
    {
      text: 'A shared mutable object passed by reference',
      why: 'That is how you would fake it without the framework, and it is the pattern outputs exist to replace — a shared mutable reference is invisible to OnPush and impossible to trace.',
    },
  ];

  /** Sample: the anti-pattern — reaching for `output()` as a cross-component event bus inside a plain service. */
  protected readonly busAntiPatternSample = `@Injectable({ providedIn: 'root' })
export class NotificationBus {
  saved = output<string>();   // compiles, constructs, and goes nowhere
}

// anywhere else in the app:
this.bus.saved.emit('Profile saved');   // runs without error — and reaches nobody`;

  /** Sample: the two correct replacements — a stream for multiple subscribers, or a signal for shared state. */
  protected readonly busFixSample = `// a real STREAM, for code that wants to react to each event as it happens
@Injectable({ providedIn: 'root' })
export class NotificationBus {
  private readonly _saved = new Subject<string>();
  readonly saved$ = this._saved.asObservable();
  notify(msg: string) { this._saved.next(msg); }
}

// shared STATE, for code that just wants to read "is it saved right now"
@Injectable({ providedIn: 'root' })
export class SessionState {
  readonly isSaved = signal(false);
}`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If inputs update automatically, why do I have to call `.emit()` myself?',
      a: "Because an output isn't a value Angular is watching — it's a decision your code makes. An input changes because the parent's binding re-evaluates on every check; an output only fires the instant you call `.emit()`, because 'something happened' is an event, not a fact about a signal. Skip the call and nothing is ever emitted — there's no automatic path standing in for it.",
    },
    {
      q: 'Does `.emit()` reach into the parent and run its handler?',
      a: "No — the child never touches the parent at all. `.emit()` just notifies Angular's own event-binding machinery, which is what actually calls `onRate($event)` on the parent's behalf. The child holds no reference to the parent, its method, or even whether anything is listening.",
    },
    {
      q: 'What happens if I emit and nothing is bound to it?',
      a: 'Nothing — and that is on purpose. `.emit()` with zero listeners is a safe no-op, the same way shouting into an empty room does not error. That is part of what keeps a component reusable: it never needs to know or care whether this particular screen wired anything up.',
    },
    {
      q: 'Is `$event` always the DOM event, like in `(click)="log($event)"`?',
      a: "Only for real DOM event bindings. On a custom output like `(rate)=\"onRate($event)\"`, `$event` is whatever you passed to `.emit()` — here a `RateEvent`, not a `MouseEvent`. Angular reuses the same `$event` name for both because from the template's point of view they are both 'the thing that came with this event', but the type is entirely up to whoever declared the output.",
    },
  ];

  /**
   * The most recent event from the rating child.
   */
  protected readonly last = signal<RateEvent | null>(null);
  /**
   * Every event received, so the demo shows the stream rather than a snapshot.
   */
  protected readonly history = signal<RateEvent[]>([]);

  /**
   * Records a rating event.
   *
   * @param e The emitted payload.
   */
  protected onRate(e: RateEvent) {
    this.last.set(e);
    this.history.update((h) => [...h, e]);
  }

  /**
   * Handles the child's clear event.
   */
  protected onClear() {
    this.last.set(null);
  }
}
