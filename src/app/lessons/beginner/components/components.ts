import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GreetingCard } from './greeting-card/greeting-card';

/**
 * Lesson: Components — the building block everything else is made of.
 *
 * Covers the `@Component` decorator's core metadata (`selector`, `template`,
 * `styles`, `imports`), how a component composes others by importing them, and
 * the split between state a component owns and state it receives.
 *
 * The demo hosts a real child component — {@link GreetingCard} — and drives it
 * from an input, so the parent/child boundary is on screen rather than
 * described. The child keeps its own clap count alongside, which makes the point
 * that a child is not merely a template fragment: it has state of its own.
 */
@Component({
  selector: 'app-lesson-components',
  imports: [RouterLink, GreetingCard],
  templateUrl: './components.html',
})
export class Components {
  /**
   * The name passed down to the demo card.
   */
  protected readonly displayName = signal('Ada');

  /**
   * Mirrors the text box into {@link displayName}.
   *
   * @param event The input event.
   */
  protected rename(event: Event) {
    this.displayName.set((event.target as HTMLInputElement).value);
  }
}
