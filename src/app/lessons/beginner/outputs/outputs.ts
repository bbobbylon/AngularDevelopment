import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, NoDumbQuestions } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';
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
 * ## Shape: `no-dumb-questions`
 *
 * The lesson opens on the misconception this topic reliably produces — "doesn't
 * `.emit()` call the parent directly?" — and lets {@link ndq} carry the entire
 * explanation, escalating from that misconception through the service-as-event-bus
 * anti-pattern actually seen at work, to the one-sentence fix. `app-brain-power`
 * poses an open question about where behavior for the *same* child differs across
 * two parents, `app-layers` answers it as a containment figure (the child can't see
 * out past its own edge; the parent's binding, one layer out, can see all the way
 * in), a quiz checks the "no listener" case, and the block closes on `app-napkin`
 * with the doorbell analogy. See `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer — see `expert/change-detection` for the
 * reference shape this copies: pose the problem before naming it, an analogy
 * before the mechanism, then the same idea again in several modes. After the
 * shape block, the lesson replays the doorbell idea as a dialogue
 * ({@link mechanismTalk}), then the child/parent problem, the mechanism as two
 * `<app-code-lab>` panels (the child's side, then the parent's), a live demo, a
 * table against `input()` (the missing signal this migration adds), and a
 * comparison of `output()` against the classic `@Output() EventEmitter`.
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
    Layers,
    Napkin,
    TapeCard,
    BrainPower,
    NoDumbQuestions,
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
  /**
   * The shape block's spine: six to eight questions escalating from the child-
   * calls-the-parent-directly misconception, through the service-as-event-bus
   * anti-pattern, to the one-sentence fix. Carries the entire explanation on
   * its own — see `NoDumbQuestions`'s own doc comment for why that is the point.
   */
  protected readonly ndq: NdqItem[] = [
    {
      q: "Doesn't `child.emit(value)` call the parent's handler directly?",
      a: "No — and that's the whole lesson in one sentence. The child calls `.emit()` on **its own** emitter; Angular's compiler is what wires that emitter to whichever `(rate)=\"onRate($event)\"` binding the parent's template happens to have. The child holds no reference to the parent, its method, or even whether anyone is listening at all.",
    },
    {
      q: "So what happens if nobody's listening — does `.emit()` throw?",
      a: "Nothing happens, and nothing throws. If the parent's template has no `(rate)` binding, the call still runs, still finishes, and the value goes **nowhere**. That's not a bug — it's the point. A component that could tell whether it had an audience would start having opinions about one, and that's exactly the coupling outputs exist to avoid.",
    },
    {
      q: 'Could I put an `output()` on a plain `@Injectable` service, so any component anywhere can react to it?',
      a: 'You can write it, and it will compile — `output()` only needs *an* injection context to construct itself, and a DI-built service has one. What it can\'t do is the one thing an output exists for: `(saved)="…"` binding syntax only exists for fields the compiler finds while processing an `@Component`/`@Directive` class. A plain `@Injectable` never goes through that step, so the emitter runs forever, talking to an empty room.',
    },
    {
      q: "I've actually seen that at work — a `NotificationService` with an output on it, used like an app-wide event bus. Why did it seem to work?",
      a: "Because nothing throws, and the code that calls `.emit()` genuinely runs. The mistake is invisible until someone goes looking for the listener and finds there isn't one — and can't be. The fix is a `Subject` on the service if other code needs to react to **each occurrence**, or a `signal` if it just needs to read **the current state**. `output()` has exactly one legal home: an actual component or directive.",
    },
    {
      q: "Okay — so what *is* `$event`, inside the parent's handler?",
      a: 'The exact payload the child passed to `.emit()`, typed as whatever the output declared — here a `RateEvent`. Nothing wraps it, nothing translates it. It shares its name with DOM event bindings purely by convention, and mixing the two up is the single most common trip in this lesson.',
    },
    {
      q: "If the child can't reach the parent, how does two-way `[(value)]` binding work — doesn't that go both directions?",
      a: "It still only ever goes one way at a time, twice. `[(value)]` is sugar for an input `value` plus an output `valueChange` — `model()` generates exactly that pair — and the square-bracket-parens syntax wires both bindings for you. Nothing about the underlying mechanism changes; you're just looking at two one-way wires stapled together.",
    },
    {
      q: 'What actually breaks if I name my output `click` or `change`?',
      a: 'It collides with the **real** DOM event of the same name on the host element. A parent that writes `(click)="…"` expecting your custom output can end up wired to an ordinary mouse click instead — or both fire, depending on what else is bound. It\'s the kind of bug that only shows up once the component ships inside a page that already has a click handler sitting on it.',
    },
    {
      q: "So what's the one line that fixes basically all of these?",
      a: 'Name the output for the **event**, not the reaction to it (`rate`, never `onRate`); put it only on a component or directive, never a service; and remember it can only announce — it never decides. Everything else above is just a specific way of forgetting that one sentence.',
    },
  ];

  /** The block's own quiz: the "no listener" case the misconception in {@link ndq} sets up. */
  protected readonly silentEmitQuizOptions: QuizOption[] = [
    {
      text: 'Angular throws NG0304 — "output has no listener."',
      why: 'There is no such error. Angular never checks whether an output binding exists anywhere for a given emitter — it has no way to know, and it does not try.',
    },
    {
      text: 'The value queues up and fires the moment a `(rate)` binding does exist.',
      why: '`output()` does not buffer. There is no queue, no replay, no "catch up later" — the moment passes and the value is gone.',
    },
    {
      text: 'The nearest ancestor with a matching output name receives it, the way a DOM event bubbles.',
      why: 'Outputs are not DOM events and do not bubble. A `(rate)` binding only ever connects to the exact `<app-rating>` element it is written on.',
    },
    {
      text: 'Nothing — the call runs, finishes, and the value goes nowhere.',
      correct: true,
      why: 'This is the whole lesson in one outcome. `.emit()` never checks for a listener before running, because checking would mean the child could develop an opinion about whether it has one — and that opinion is exactly what keeps a component reusable.',
    },
  ];

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

  /**
   * The doubts this lesson reliably leaves behind. Deliberately distinct from
   * {@link ndq}: that block already carries the emit-reaches-the-parent
   * misconception and the service-as-event-bus anti-pattern, so this closer
   * covers doubts that only surface once the reader has already sat with the
   * mechanism for a while.
   */
  protected readonly questions: FaqItem[] = [
    {
      q: "Is `.emit()` synchronous — does the parent's handler run before `.emit()` itself returns?",
      a: "Yes. There's no microtask hop, no scheduling, nothing async hiding in there — `.emit()` calls the parent's handler in the same call stack, synchronously, before the line after `.emit()` in the child ever runs. If you need to see a side effect land immediately after emitting, it already has.",
    },
    {
      q: 'Can two different parents bind to the same child output at once?',
      a: "Yes, as long as they're two separate elements. Drop the exact same `<app-rating (rate)=\"...\">` into two different templates and each gets its own independent binding to its own handler — the child's `.emit()` doesn't know or care how many places it's used, only that this one call belongs to whichever single template this particular element sits in.",
    },
    {
      q: "If I rename an output, does every parent's binding update with it?",
      a: 'No — and TypeScript won\'t catch the mismatch either. `(rate)="onRate($event)"` is just text inside the template; renaming the child\'s `rate` output to `starPicked` silently breaks every existing `(rate)` binding, and you find out at runtime (the handler stops firing) rather than at compile time.',
    },
    {
      q: 'What if the event genuinely carries no data — does the output still need a type?',
      a: "Declare `output<void>()` for a bare notification (this lesson's `(cleared)` output is exactly that) and call `.emit()` with no argument. The parent's handler still runs on the notification itself; `$event` is simply `void`, and there's nothing to unpack.",
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
