import { Component, computed, input, signal } from '@angular/core';

/**
 * A small child component demonstrating that components are composable,
 * reusable building blocks. Declared in the same file to keep the lesson
 * self-contained. It receives its name through an input (covered in depth in
 * the "Component Inputs" lesson).
 */
@Component({
  selector: 'app-greeting-card',
  templateUrl: './greeting-card.html',
  styleUrl: './greeting-card.css',
})
export class GreetingCard {
  /**
   * The name to greet. A **signal input**: readable in the template like any
   * signal, and re-renders the card when the parent changes it.
   */
  readonly name = input('Ada');
  /**
   * The name's first letter for the avatar, uppercased. Falls back to `?` on an
   * empty name so the avatar is never blank.
   */
  readonly initial = computed(() => this.name().charAt(0).toUpperCase() || '?');
  /**
   * The card's own clap count — state that belongs to the child, not the parent,
   * to show that a component owns local state as well as receiving inputs.
   */
  protected readonly claps = signal(0);
}
