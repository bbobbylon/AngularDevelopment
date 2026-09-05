import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { StarRating } from './star-rating/star-rating';

/**
 * Lesson: Event Binding — `(event)="statement"`, and what `$event` actually is.
 *
 * Covers native DOM events, `$event` and its real type per event, key modifiers
 * like `(keyup.enter)`, template reference variables as handler arguments, and
 * binding to a child component's `output()` with the same syntax.
 *
 * ## Presentation
 *
 * Follows the brain-friendly teaching order: pose the problem (property
 * binding gets data IN — how does it get back OUT?), analogy before
 * vocabulary (a one-way instruction vs. a genuine interruption), then the
 * same mechanism in four modes — a dialogue between the DOM and the class, a
 * flow diagram of what a listener binding actually does, three annotated
 * code labs replacing the old hand-rolled "line by line" tables, and live
 * demos.
 *
 * The two points the lesson keeps returning to:
 *
 * - A template statement may have **side effects** — unlike an interpolation
 *   expression, which may only read. That asymmetry is the whole reason both
 *   syntaxes exist.
 * - `$event` is not one type. On `(click)` it is a `MouseEvent`; on a component
 *   output it is whatever that output emits. The demo binds both so the
 *   difference is concrete.
 */
@Component({
  selector: 'app-lesson-event-binding',
  imports: [
    RouterLink,
    StarRating,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './event-binding.css',
  templateUrl: './event-binding.html',
})
export class EventBinding {
  /**
   * Click count for the simplest demo.
   */
  protected readonly clicks = signal(0);
  /**
   * Pointer position from `(mousemove)`, showing `$event` as a real `MouseEvent`.
   */
  protected readonly pos = signal({ x: 0, y: 0 });
  /**
   * Items added through the `(keyup.enter)` demo.
   */
  protected readonly items = signal<string[]>([]);
  /**
   * The last rating received from the child component.
   */
  protected readonly lastRating = signal(0);
  /**
   * How many rating events have arrived, so the demo distinguishes a repeated
   * value from no event.
   */
  protected readonly ratingEvents = signal(0);

  /**
   * Records the pointer position relative to the box.
   *
   * @param e The mouse event — typed, not `any`.
   */
  protected track(e: MouseEvent) {
    this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
  }

  /**
   * Adds an item, ignoring blank input.
   *
   * @param value Text from the template reference variable.
   */
  protected add(value: string) {
    const v = value.trim();
    if (v) {
      this.items.update((list) => [...list, v]);
    }
  }

  /**
   * Handles the child's `rated` output. Here `$event` is a `number`, not a DOM
   * event — the same binding syntax, a completely different payload type.
   *
   * @param n The emitted rating.
   */
  protected onRated(n: number) {
    this.lastRating.set(n);
    this.ratingEvents.update((c) => c + 1);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Data Binding track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Property & Attribute', id: 'property-binding' },
    { label: 'Event Binding' },
    { label: 'Two-Way Binding', id: 'two-way-binding' },
    { label: 'Class & Style', id: 'class-style-binding' },
  ];

  /**
   * The DOM and the class, either side of the asymmetry the whole lesson is
   * about: one direction is a scheduled read, the other is a genuine
   * interruption. Learners who blur the two try to assign inside an
   * interpolation, or expect $event to always be a DOM event.
   */
  protected readonly bridgeTalk: BubbleTurn[] = [
    { who: 'Your class', says: "Here's the value, via [prop]. Render it." },
    {
      who: 'The DOM',
      says: "Rendered. I'm not allowed to talk back through this channel — it only flows one way.",
    },
    { who: 'The DOM', says: 'Hey — the user just clicked, over here on (click).' },
    {
      who: 'Your class',
      says: 'Noted. Running my statement now — this time I can assign, mutate, chain with `;`.',
    },
    { who: 'Your class', says: 'Done. Marking my view — and every ancestor — dirty.' },
    {
      who: 'The DOM',
      says: "I'll wait for the next scheduled pass before anything actually repaints.",
    },
  ];

  /**
   * Sample: `(click)` and `(mousemove)` with `$event`.
   */
  protected readonly clickMousemoveSample = `<button (click)="clicks.set(clicks() + 1)">...</button>
<div (mousemove)="track($event)">...</div>

track(e: MouseEvent) {
  this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
}`;

  /** Line-by-line walkthrough of {@link clickMousemoveSample}. */
  protected readonly clickMousemoveNotes: CodeNote[] = [
    {
      line: 1,
      text: '`(click)` attaches to the native `click` DOM event. Unlike an interpolation expression, the right side is a **template statement** — it may have side effects. Here it reads `clicks()`, adds 1, and writes the result with `.set()`.',
    },
    {
      line: 2,
      text: "`(mousemove)` fires continuously — potentially dozens of times a second — while the pointer moves inside the element. `$event` is passed positionally as `track`'s only argument.",
    },
    {
      line: 4,
      text: 'For a **native DOM** event, `$event` is typed as the real DOM interface — a `MouseEvent` here — so TypeScript can check that `e.offsetX` / `e.offsetY` actually exist. Not `any`.',
    },
    {
      line: 5,
      text: 'Builds a brand-new object and swaps it in wholesale rather than mutating the old one — the signal convention, and what keeps an `OnPush` child safe if this were ever passed down as an input.',
    },
  ];

  /**
   * Sample: `(keyup.enter)` plus a template reference variable, and clearing the
   * input in the same statement.
   */
  protected readonly keyupEnterSample = `<input #box (keyup.enter)="add(box.value); box.value = ''" />
<button (click)="add(box.value); box.value=''">Add</button>

// also valid: (keydown.escape), (keyup.control.s)`;

  /** Line-by-line walkthrough of {@link keyupEnterSample}. */
  protected readonly keyupEnterNotes: CodeNote[] = [
    {
      line: 1,
      text: "Two things at once. `#box` is a **template reference variable** pointing at the raw `<input>` — no directive here, so it's the native `HTMLInputElement`, and `box.value` is direct DOM access with no `ngModel` needed for a case this simple. `(keyup.enter)` is a **key-modifier pseudo-event**: Angular still listens for the real `keyup` DOM event, but inserts a guard so your statement only runs when `event.key`, lower-cased, equals `'enter'`.",
    },
    {
      line: 2,
      text: "Two statements chained with `;`. First call the method with the input's current value; then assign straight back to the element's `.value` property, which mutates the real DOM node and visually clears the field. Interpolation cannot assign — only an event binding's statement context can.",
    },
    {
      line: 4,
      text: 'Same pseudo-event mechanism, any key name, and any number of chained modifiers — Angular requires every one of them to be true.',
    },
  ];

  /**
   * Sample: binding a component `output()`, and typing the handler's parameter.
   */
  protected readonly outputSample = `<form (submit)="save($event)">…</form>

save(e: SubmitEvent) {
  e.preventDefault();     // Angular has no .prevent modifier — do it yourself
  // ...persist the form data
}

<app-star-rating (rated)="onRated($event)" />

onRated(n: number) {
  this.lastRating.set(n);  // $event is the emitted number, not a DOM Event
}`;

  /** Line-by-line walkthrough of {@link outputSample}. */
  protected readonly outputNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Binds the native `submit` event fired by the `<form>`; `$event` is explicitly threaded through as a `SubmitEvent`.',
    },
    {
      line: 3,
      text: 'The parameter is typed as the real DOM interface — same idea as `track(e: MouseEvent)` above.',
    },
    {
      line: 4,
      text: "There's no `.prevent` modifier in Angular — you call the real browser API yourself, before it performs its default full-page reload on submit.",
    },
    {
      line: 8,
      text: '`rated` is **not** a DOM event — it is a custom `output<number>()` property declared on the `StarRating` child. Binding `(rated)="…"` subscribes to it with the exact same parenthesis syntax as a native event.',
    },
    {
      line: 10,
      text: '`$event` resolves to whatever the child passed to `.emit(...)` — here a plain `number`. Calling `$event.preventDefault()` in this handler would fail at runtime: there is no DOM event to prevent, only a value that already happened.',
    },
  ];

  /**
   * The five-step version of "what a listener binding actually does" — the
   * same mechanism as {@link underTheHoodSample}, in diagram form.
   */
  protected readonly listenerFlow: FlowStep[] = [
    {
      label: 'DOM event fires',
      detail: 'click, keyup, submit — a real browser event.',
      tone: 'accent',
    },
    {
      label: "Angular's own wrapper runs",
      detail: 'Not your function directly — a listener instruction, registered once via Renderer2.',
    },
    {
      label: 'Your statement runs',
      detail: '$event supplied as the argument, this bound to the component instance.',
    },
    {
      label: 'View + every ancestor marked dirty',
      detail: 'One of the five official OnPush re-check triggers.',
      tone: 'accent',
    },
    {
      label: 'A pass is scheduled, not run inline',
      detail: 'Coalesced into one microtask even if several events fire back to back.',
    },
  ];

  /**
   * Sample: roughly what a `(click)` binding compiles to — the `listener`
   * instruction, and where `this` comes from.
   */
  protected readonly underTheHoodSample = `// what (click)="doThing($event)" roughly compiles to
ɵɵlistener('click', function EventBinding_click_listener($event) {
  ctx.doThing($event);         // your statement — this = the component instance
  markViewDirty(currentView);  // + every ancestor up to the root
});

// registered ONCE via Renderer2 when the view is created:
renderer.listen(buttonEl, 'click', thatWrapperFunction);`;

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 2,
      text: '`ɵɵlistener` is the compiled instruction — not `addEventListener(yourFn)` directly. Angular wraps your statement in its own function first.',
    },
    {
      line: 3,
      text: 'Your statement runs **first**, with `$event` supplied as the argument and `this` bound to the component instance.',
    },
    {
      line: 4,
      text: '**Then** Angular marks the view dirty — this component\'s view and every ancestor up to the root. This is exactly one of the five official triggers that re-check an `OnPush` view: "an event bound in its own template."',
    },
    {
      line: 8,
      text: 'One real listener, registered **once** via `Renderer2` when the view is created — not one per change-detection pass. `addEventListener` is never called again just because something re-rendered.',
    },
  ];

  /** The self-test. Targets the one thing $event genuinely is not: one fixed type. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'A CustomEvent wrapping the number, so you would read $event.detail.',
      why: "That's the native Web Components pattern, not Angular's. A component `output()` skips the DOM event system entirely — nothing is ever dispatched.",
    },
    {
      text: 'Whatever value the child passed to .emit(...) — here, a plain number.',
      correct: true,
      why: '`(event)="…"` binding syntax is shared between DOM events and component outputs, but the TYPE of `$event` depends entirely on the source: a DOM interface for a real event, or the output\'s own generic type for a component output.',
    },
    {
      text: 'A MouseEvent, because $event is always a DOM event no matter the source.',
      why: 'Only for bindings to real DOM events. A component output was never dispatched by the browser — there is no DOM event object to hand you.',
    },
    {
      text: "undefined, because component outputs don't populate $event.",
      why: 'Outputs populate `$event` exactly the way DOM events do, syntactically — just with a different kind of value.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'How do you stop a form from reloading the page on submit?',
      a: 'There\'s no `.prevent` modifier — bind `(submit)="save($event)"` and call `$event.preventDefault()` inside `save`.',
    },
    {
      q: 'What is $event for (click) vs. a component output?',
      a: "For DOM events it's the native event object (a `MouseEvent`, a `SubmitEvent`, …). For an `output()` it's the emitted value itself — a plain `number`, `string`, object, whatever that output was typed to emit.",
    },
    {
      q: 'How do you run something on Ctrl/⌘+S?',
      a: "Pseudo-event combos: `(keydown.control.s)` for Ctrl, `(keydown.meta.s)` for ⌘/Win — and `preventDefault()` to stop the browser's own save dialog.",
    },
    {
      q: 'I bound (click)="save" — no parentheses — and nothing happens. Why?',
      a: 'Without `()`, the statement evaluates the bare identifier `save` — a reference to the method — and discards the result. It never calls it. It has to be `(click)="save()"`.',
    },
    {
      q: 'Does firing a handler re-render the component immediately, in the same call?',
      a: "The handler runs, then Angular marks the view — and its ancestors — dirty, synchronously. But the actual refresh is scheduled, not run inline; in this zoneless app it's coalesced into a microtask, so several events firing in a row still produce one render pass, not one per event.",
    },
  ];
}
