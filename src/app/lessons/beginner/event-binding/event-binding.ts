import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StarRating } from './star-rating/star-rating';

/**
 * Lesson: Event Binding — `(event)="statement"`, and what `$event` actually is.
 *
 * Covers native DOM events, `$event` and its real type per event, key modifiers
 * like `(keyup.enter)`, template reference variables as handler arguments, and
 * binding to a child component's `output()` with the same syntax.
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
  imports: [RouterLink, StarRating],
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

  /**
   * Sample: `(click)` and `(mousemove)` with `$event`.
   */
  readonly clickMousemoveSample = `<button (click)="clicks.set(clicks() + 1)">...</button>
<div (mousemove)="track($event)">...</div>

track(e: MouseEvent) {
  this.pos.set({ x: Math.round(e.offsetX), y: Math.round(e.offsetY) });
}`;

  /**
   * Sample: `(keyup.enter)` plus a template reference variable, and clearing the
   * input in the same statement.
   */
  readonly keyupEnterSample = `<input #box (keyup.enter)="add(box.value); box.value = ''" />
<button (click)="add(box.value); box.value=''">Add</button>

<!-- also valid: (keydown.escape), (keyup.control.s) -->`;

  /**
   * Sample: binding a component `output()`, and typing the handler's parameter.
   */
  readonly outputSample = `<form (submit)="save($event)">…</form>

save(e: SubmitEvent) {
  e.preventDefault();     // Angular has no .prevent modifier — do it yourself
  // ...persist the form data
}

<app-star-rating (rated)="onRated($event)" />

onRated(n: number) {
  this.lastRating.set(n);  // $event is the emitted number, not a DOM Event
}`;

  /**
   * Sample: roughly what a `(click)` binding compiles to — the `listener`
   * instruction, and where `this` comes from.
   */
  readonly underTheHoodSample = `// what (click)="doThing($event)" roughly compiles to
ɵɵlistener('click', function EventBinding_click_listener($event) {
  ctx.doThing($event);         // your statement — this = the component instance
  markViewDirty(currentView);  // + every ancestor up to the root
});

// registered ONCE via Renderer2 when the view is created:
renderer.listen(buttonEl, 'click', thatWrapperFunction);`;
}
