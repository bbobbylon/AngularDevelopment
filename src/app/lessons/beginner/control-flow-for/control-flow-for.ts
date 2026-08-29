import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A to-do item for the `@for` demo.
 */
interface Task {
  id: number;
  label: string;
  done: boolean;
}

/**
 * Lesson: Control Flow `@for` — the built-in repeater.
 *
 * Covers the block's syntax, the contextual variables (`$index`, `$first`,
 * `$last`, `$even`, `$odd`, `$count`), the `@empty` block, and — above all —
 * the mandatory `track` expression.
 *
 * `track` is the reason this lesson has two demos rather than one. It is what
 * tells Angular which DOM node belongs to which item, so a reordered list moves
 * nodes instead of rebuilding them. `*ngFor` made the equivalent (`trackBy`)
 * optional, and the resulting quiet performance bugs are why `@for` does not.
 * The letters demo shuffles a list so the difference between tracking by
 * identity and tracking by index is visible as DOM behaviour, not theory.
 */
@Component({
  selector: 'app-lesson-control-flow-for',
  imports: [RouterLink],
  templateUrl: './control-flow-for.html',
  styleUrl: './control-flow-for.css',
})
export class ControlFlowFor {
  /**
   * Id source for new tasks. A counter rather than array length, so ids stay
   * unique after a removal.
   */
  private nextId = 4;
  /**
   * The task list.
   */
  protected readonly tasks = signal<Task[]>([
    { id: 1, label: 'Learn @if', done: true },
    { id: 2, label: 'Learn @for', done: false },
    { id: 3, label: 'Learn @switch', done: false },
  ]);

  /**
   * Appends a task, ignoring blank input. Replaces the array rather than pushing,
   * so the signal notifies.
   *
   * @param label The raw input text.
   */
  protected add(label: string) {
    const l = label.trim();
    if (l) {
      this.tasks.update((t) => [...t, { id: this.nextId++, label: l, done: false }]);
    }
  }

  /**
   * Flips a task's done flag, replacing both the array and the item — the item
   * too, because a mutated object would be the same reference and `@for` would
   * have no reason to update that row.
   *
   * @param id The task to toggle.
   */
  protected toggle(id: number) {
    this.tasks.update((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  /**
   * Removes a task.
   *
   * @param id The task to remove.
   */
  protected remove(id: number) {
    this.tasks.update((t) => t.filter((x) => x.id !== id));
  }

  /**
   * Shuffles the tasks, to show `track` moving existing DOM nodes rather than
   * rebuilding them.
   */
  protected shuffle() {
    this.tasks.update((t) => [...t].sort(() => Math.random() - 0.5));
  }

  /**
   * A short list for the tracking demo, small enough that every node's fate can be
   * watched at once.
   */
  protected readonly letters = signal([
    { id: 1, ch: 'A' },
    { id: 2, ch: 'B' },
    { id: 3, ch: 'C' },
    { id: 4, ch: 'D' },
  ]);

  /**
   * Shuffles the letters — the demo that makes the cost of a bad `track` visible.
   */
  protected shuffleLetters() {
    this.letters.update((l) => [...l].sort(() => Math.random() - 0.5));
  }
}
