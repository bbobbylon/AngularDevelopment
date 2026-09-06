import { Component, signal } from '@angular/core';

/**
 * A tiny, genuinely running counter — the live twin of the `CounterComponent`
 * described in every `anatomySample`-style spec further down the lesson.
 *
 * It exists so the reader can click something real before being shown the
 * test file that would prove it works: the lesson poses "how would you prove
 * this renders and reacts, without a browser?" right next to a component
 * doing exactly that, in a browser, right now.
 *
 * Deliberately as plain as possible — no lifecycle hook, no `OnPush`, no
 * async work. Anything more would teach change detection, which is a
 * different lesson (`expert/change-detection`); this one only needs to be a
 * believable, clickable subject for a `TestBed`.
 */
@Component({
  selector: 'app-td-counter-demo',
  template: `
    <p class="count">Count: {{ count() }}</p>
    <button type="button" (click)="increment()">+1</button>
  `,
})
export class CounterDemo {
  /** The state a real test of this component would set up and assert on. */
  protected readonly count = signal(0);

  /** What the button's `(click)` binding calls. */
  protected increment(): void {
    this.count.update((n) => n + 1);
  }
}
