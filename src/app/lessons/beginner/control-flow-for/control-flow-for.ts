import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

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
 * `track` is the reason this lesson has two live demos rather than one. It is
 * what tells Angular which DOM node belongs to which item, so a reordered
 * list moves nodes instead of rebuilding them. `*ngFor` made the equivalent
 * (`trackBy`) optional, and the resulting quiet performance-and-state bugs
 * are why `@for` does not. The letters demo shuffles a list so the
 * difference between tracking by identity and tracking by position is
 * visible as DOM behaviour, not theory.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`,
 * `src/brain-friendly.css`), following the teaching order set out in
 * `lessons/expert/change-detection/`:
 *
 * 1. **Pose the problem before naming it.** A collection just changed — so
 *    for every item in it now, is this an existing row or a new one? The
 *    reader commits to a guess about a half-typed note surviving a prepend,
 *    a few sections before any demo settles it.
 * 2. **Analogy before vocabulary.** `track` is framed as a coat-check ticket
 *    against a numbered hook, then restaged as a short argument between the
 *    two tracking strategies before a single demo runs.
 * 3. **Then the same idea in several modes**: a dialogue, an annotated
 *    live-looking snippet, a keyed-diff flow diagram, a live task list, a
 *    live two-column identity-vs-position demo, and a before/after key
 *    table.
 * 4. **Every substantial snippet is annotated line by line** via
 *    `app-code-lab`.
 */
@Component({
  selector: 'app-lesson-control-flow-for',
  imports: [
    RouterLink,
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
  templateUrl: './control-flow-for.html',
  styleUrl: './control-flow-for.css',
})
export class ControlFlowFor {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Control Flow track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: '@if / @else', id: 'control-flow-if' },
    { label: '@for' },
    { label: '@switch', id: 'control-flow-switch' },
    { label: '@let', id: 'let-block' },
  ];

  /**
   * The coat-check ticket vs. the hook number, staged as an argument.
   *
   * The relationship a beginner reliably gets backwards is that `$index` is
   * merely a slower, simpler version of a real id. Staged as dialogue, each
   * side states its own contract with the DOM in its own words, and the
   * asymmetry — one follows the data, the other follows a slot — becomes the
   * thing the reader takes away rather than a rule they have to memorise.
   */
  protected readonly trackTalk: BubbleTurn[] = [
    {
      who: 'track item.id',
      says: 'I staple a real, permanent number to your data. Shuffle the array all you like — I still know exactly which node belongs to which item.',
    },
    {
      who: 'track $index',
      says: "I don't look at your data at all. I only know positions — you're hook 0, you're hook 1, and that's the whole of what I remember.",
    },
    {
      who: 'track item.id',
      says: 'So when a row moves from position two to position zero, you move its node to match?',
    },
    {
      who: 'track $index',
      says: "No — I don't even know a row moved. Position zero is still position zero. I just rebind whatever's sitting there now with fresh data and call it done.",
    },
    {
      who: 'track item.id',
      says: 'Which is the bug, right there: the node at hook zero never went anywhere, but who it belongs to just changed underneath it. Anything it was holding — a half-typed word, focus, scroll position — now belongs to a stranger.',
    },
  ];

  /**
   * Sample: a live `@for` with a required `track` and a sibling `@empty`
   * branch — the exact shape the task-list demo below renders.
   */
  protected readonly basicForSample = `@for (task of tasks(); track task.id) {
  <label class="taskrow">
    <input type="checkbox" [checked]="task.done" (change)="toggle(task.id)" />
    <span>{{ task.label }}</span>
    <button (click)="remove(task.id)">✕</button>
  </label>
} @empty {
  <p>No tasks — add one above.</p>
}`;

  /** Line-by-line walkthrough of {@link basicForSample}. */
  protected readonly basicForNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@for` opens a repeating block. `tasks()` is a signal call, so this whole block re-evaluates whenever that signal changes. `track task.id` is not optional — leave it off and the template fails to compile.',
    },
    {
      line: 2,
      text: 'Everything down to line 6 is the template for **one** item. `task`, declared on line 1, is that single item — in scope for every line inside the block.',
    },
    {
      line: 3,
      text: "`[checked]` binds to this row's own `done` flag; `(change)` calls back with this row's own `id`. Every row rendered gets its own independently-bound copy of this line.",
    },
    {
      line: 4,
      text: "Interpolates this row's own text. Nothing here is shared between rows — each repetition of the block gets a fresh `task`.",
    },
    {
      line: 5,
      text: "This button closes over `task.id` too, so clicking any one row's ✕ removes exactly that row and no other.",
    },
    {
      line: 6,
      text: 'Closes one iteration. One `<label>` like this exists per item currently in `tasks()` — no more, no fewer.',
    },
    {
      line: 7,
      text: "`}` ends the repeating block. `@empty` is a **sibling** branch, not an `else` — it renders only when the collection's length is exactly 0.",
    },
    {
      line: 8,
      text: "@empty's own template, built once and shown only while `tasks()` is empty.",
    },
    {
      line: 9,
      text: 'Closes `@empty`.',
    },
  ];

  /**
   * What one update to the bound collection actually costs. Spelled out
   * because "Angular re-renders the list" is the wrong mental model and it is
   * the one everyone arrives with — the whole point of `track` is that
   * almost nothing is re-rendered.
   */
  protected readonly diff: FlowStep[] = [
    { label: 'Collection changes', detail: 'A new array reference reaches the `@for` block' },
    {
      label: 'Compute track keys',
      detail: 'Your `track` expression runs once per item, in order',
      tone: 'accent',
    },
    { label: 'Match against last pass', detail: 'Same key = same row. This is the whole trick' },
    { label: 'Move, create, destroy', detail: 'Only rows whose keys changed are touched' },
    {
      label: 'Refresh the context',
      detail: '`$index`, `$first`, `$last`, `$count` recomputed for every surviving row',
      tone: 'good',
    },
  ];

  /**
   * Sample: the full contextual-variable alias list — the syntax reference
   * for the "$index, $first, $last, $even" live demo directly below it.
   */
  protected readonly contextVarsSample = `@for (task of tasks(); track task.id;
      let i = $index, first = $first, last = $last, even = $even) {
  <div [class.even]="even">
    #{{ i }} {{ task.label }}
    @if (first) { <span>first</span> }
    @if (last) { <span>last</span> }
  </div>
}`;

  /** Line-by-line walkthrough of {@link contextVarsSample}. */
  protected readonly contextVarsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The collection and `track` expression, exactly as before — this can span several lines, since it is all one statement.',
    },
    {
      line: 2,
      text: "`let` aliases the block's implicit context variables to names you choose. `$index`, `$first`, `$last`, `$even` — and `$odd`, `$count`, not used here — only exist inside this block, and only under whatever name you give them on this line.",
    },
    {
      line: 3,
      text: '`[class.even]` reads the aliased `even` variable, not a property on `task` — it is something this block computed, not part of your data.',
    },
    {
      line: 4,
      text: "`i` is this item's zero-based position in the **current** pass, recomputed for every row on every update.",
    },
    {
      line: 5,
      text: '`first` is `true` for exactly one row — whichever sits at position 0 right now.',
    },
    {
      line: 6,
      text: '`last` is the mirror of `first` — `true` only for the final row in the current pass.',
    },
    {
      line: 7,
      text: 'Closes one row.',
    },
    {
      line: 8,
      text: 'Closes the block.',
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

  /** Sample: the keyed diff before/after a prepend, tracked by position. */
  protected readonly keyDiffIndexBefore = `Before:  [0:Ada] [1:Grace] [2:Linus]
Prepend Zoe
After:   [0:Zoe] [1:Ada]   [2:Grace] [3:Linus]

Keys 0,1,2 already exist → nodes kept in place,
their bindings rewritten. One new node at the end.
→ 3 rows re-bound, all row state misaligned`;

  /** Sample: the same prepend, tracked by a stable id. */
  protected readonly keyDiffIdAfter = `Before:  [id7:Ada] [id2:Grace] [id9:Linus]
Prepend Zoe
After:   [id4:Zoe] [id7:Ada]   [id2:Grace] [id9:Linus]

Key id4 is new → one node created and inserted
first. id7, id2, id9 are untouched.
→ 1 row created, all row state intact`;

  /** Choices for the duplicate-key check. */
  protected readonly duplicateOptions: QuizOption[] = [
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
  protected readonly questions: FaqItem[] = [
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
      a: 'No — it throws. `@empty` is a sibling branch that renders when the iterable has length 0, not a null-guard. A `null` or `undefined` collection gives `@for` nothing to iterate, and it errors out. Default to `[]` at the source, or wrap the whole block in an `@if`.',
    },
    {
      q: 'Why do nested loops need different `let` aliases?',
      a: 'Because the inner block\'s aliases shadow the outer ones by ordinary scoping rules. Write `let i = $index` at both levels and the inner `i` wins everywhere inside it, so your "row number" silently becomes the cell number. Name them for what they are — `let r = $index` outside, `let c = $index` inside — and the bug cannot happen.',
    },
  ];

  // ── Demo state ──────────────────────────────────────────────────────────────

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

  /**
   * Rows whose own `name` field gets used — wrongly, on purpose — as one
   * column's `track` key. Neither a duplicate nor a reorder: the third way
   * `track` fails, where the tracked value is the exact thing being edited.
   */
  protected readonly editRows = signal([
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ]);

  /**
   * Updates a row's name, replacing both the array and the item so `@for`
   * sees a genuinely new reference — and, on the `track row.name` column, a
   * genuinely new key.
   *
   * @param id   The row to update.
   * @param name The freshly-typed value.
   */
  protected renameRow(id: number, name: string) {
    this.editRows.update((rows) => rows.map((r) => (r.id === id ? { ...r, name } : r)));
  }
}
