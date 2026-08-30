import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Compare, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './control-flow-for.html',
  styleUrl: './control-flow-for.css',
})
export class ControlFlowFor {
  /**
   * What one update to the bound collection actually costs. Spelled out because
   * "Angular re-renders the list" is the wrong mental model and it is the one
   * everyone arrives with — the whole point of `track` is that almost nothing is
   * re-rendered.
   */
  protected readonly diff = [
    { label: 'Collection changes', detail: 'A new array reference reaches the `@for` block' },
    {
      label: 'Compute track keys',
      detail: 'Your `track` expression runs once per item, in order',
      tone: 'accent' as const,
    },
    { label: 'Match against last pass', detail: 'Same key = same row. This is the whole trick' },
    { label: 'Move, create, destroy', detail: 'Only rows whose keys changed are touched' },
    {
      label: 'Refresh the context',
      detail: '`$index`, `$first`, `$last`, `$count` recomputed for every surviving row',
      tone: 'good' as const,
    },
  ];

  /** The prepend-with-$index trap, posed before the letters demo explains it. */
  protected readonly prependSample = `@for (row of rows(); track $index) {
  <input [placeholder]="row.name" />
}

// rows() is [Ada, Grace, Linus].
// The user types "hello" into Ada's input.
// Then a new row, Zoe, is prepended:
// rows() becomes [Zoe, Ada, Grace, Linus].`;

  /** Choices for the duplicate-key check. */
  protected readonly duplicateOptions = [
    {
      text: 'The duplicates are silently de-duplicated — you see one row per unique key',
      why: 'Angular never drops your data. It has no basis to decide which of two identically-keyed items is the "real" one, so discarding either would be a worse failure than complaining.',
    },
    {
      text: 'It renders fine — `track` keys only have to be unique per render',
      why: 'They have to be unique *within* a render, and that is exactly what has been violated here. Two rows claiming the same key in the same pass is the problem.',
    },
    {
      text: 'A runtime error naming the duplicated key',
      correct: true,
      why: 'The keyed diff is a lookup from key to row. Two rows with the same key make that lookup ambiguous — Angular cannot tell which DOM node belongs to which item on the next pass — so it throws instead of guessing. The message names the offending key, which is usually enough to spot the bug. If the values genuinely can repeat and no id exists, `track $index` is the honest fallback.',
    },
    {
      text: 'A compile-time error — the template will not build',
      why: 'The compiler enforces that `track` is *present*, because that is checkable from the source. Whether the values it produces collide depends on runtime data, so it can only be caught when the list is actually rendered.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Why is `track` mandatory when `trackBy` was optional?',
      a: 'Because optional was the bug. `*ngFor` without `trackBy` fell back to tracking by object identity, which broke the moment anyone mapped or spread the array — the list looked correct and quietly rebuilt every row on every update. Nothing warned you. Making `track` part of the `@for` grammar converts a silent performance-and-state bug into a compile error you cannot ship past.',
    },
    {
      q: 'Is `track $index` always wrong?',
      a: 'No — it is wrong for lists that reorder, filter in the middle, or insert anywhere but the end. For a list that only ever grows at the end, or a static list of options, `$index` is a perfectly stable key and costs nothing. It is also the honest answer for primitive arrays that can contain duplicates, where no unique key exists to track.',
    },
    {
      q: 'Can I use `track item` on an array of objects?',
      a: 'You can, and it works as long as the objects are the *same references* between renders. The trouble is that idiomatic signal code rarely keeps them: `map`, spread and immutable updates all produce new objects, so every row looks new and the entire list is rebuilt. That is the exact failure `trackBy` used to hide. Track a stable id whenever your data has one.',
    },
    {
      q: 'Does `@empty` run when my collection is `null`?',
      a: 'No — it throws. `@empty` is a sibling branch that renders when the iterable has length 0, not a null-guard. A `null` or `undefined` collection gives `@for` nothing to iterate and errors out. Default to `[]` at the source, or wrap the whole block in an `@if`.',
    },
    {
      q: 'Why do nested loops need different `let` aliases?',
      a: 'Because the inner block\'s aliases shadow the outer ones by ordinary scoping rules. Write `let i = $index` at both levels and the inner `i` wins everywhere inside it, so your "row number" silently becomes the cell number. Name them for what they are — `let r = $index` outside, `let c = $index` inside — and the bug cannot happen.',
    },
  ];

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
