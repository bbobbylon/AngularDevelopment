import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ============================================================
// WHAT YOU'LL BUILD: a full Task Manager app covering:
//   Signals + Signal Store, Components + Inputs/Outputs,
//   Template Control Flow, Two-way Binding, Local Persistence
// ============================================================

/**
 * How urgent a task is.
 */
type Priority = 'low' | 'medium' | 'high';
/**
 * Which board column a task sits in.
 */
type Status = 'todo' | 'in-progress' | 'done';

/**
 * A task on the board.
 */
interface Task {
  id: number;
  title: string;
  priority: Priority;
  status: Status;
  createdAt: number;
  deadline?: number;
}

// ---------- STEP 3: The Signal Store ----------
/**
 * The board's store — a signal store owning the tasks, the filter and the
 * persistence.
 *
 * Same shape as the one in the state-management lesson, applied to something
 * with enough moving parts to justify it: private writable signals, read-only
 * exposure, derived views, and mutation only through methods. Every mutator
 * writes through to `localStorage`, so the board survives a refresh.
 *
 * @see expert/state-management — the pattern this is an instance of.
 */
@Injectable()
class TaskStore {
  /**
   * The tasks. Seeded from storage.
   */
  private readonly _tasks = signal<Task[]>(this.load());
  /**
   * The active priority filter.
   */
  private readonly _priorityFilter = signal<Priority | 'all'>('all');
  /**
   * Sequence source for task ids, continued from whatever was loaded so a restored
   * board cannot reuse an id.
   */
  private nextId = Math.max(0, ...this._tasks().map((t) => t.id)) + 1;

  /**
   * The tasks, read-only.
   */
  readonly tasks = this._tasks.asReadonly();
  /**
   * The filter, read-only.
   */
  readonly priorityFilter = this._priorityFilter.asReadonly();

  /**
   * The tasks grouped by column, with the priority filter applied.
   *
   * One `computed` produces all three columns, so they cannot disagree about which
   * tasks exist — and it recomputes on a task change or a filter change without
   * either having to know about it.
   */
  readonly byStatus = computed(() => {
    const pf = this._priorityFilter();
    const apply = (list: Task[]) => (pf === 'all' ? list : list.filter((t) => t.priority === pf));
    return {
      todo: apply(this._tasks().filter((t) => t.status === 'todo')),
      'in-progress': apply(this._tasks().filter((t) => t.status === 'in-progress')),
      done: apply(this._tasks().filter((t) => t.status === 'done')),
    };
  });

  /**
   * Board totals, derived.
   */
  readonly stats = computed(() => ({
    total: this._tasks().length,
    done: this._tasks().filter((t) => t.status === 'done').length,
    high: this._tasks().filter((t) => t.priority === 'high' && t.status !== 'done').length,
  }));

  /**
   * Adds a task.
   *
   * @param title    What to do.
   * @param priority How urgent.
   * @param deadline Optional due date, as a timestamp.
   */
  add(title: string, priority: Priority, deadline?: number) {
    if (!title.trim()) return;
    const task: Task = {
      id: this.nextId++,
      title: title.trim(),
      priority,
      status: 'todo',
      createdAt: Date.now(),
      deadline,
    };
    this._tasks.update((l) => [...l, task]);
    this.save();
  }

  /**
   * Moves a task to another column.
   *
   * @param id     Which task.
   * @param status Where to move it.
   */
  move(id: number, status: Status) {
    this._tasks.update((l) => l.map((t) => (t.id === id ? { ...t, status } : t)));
    this.save();
  }

  /**
   * Removes a task.
   *
   * @param id Which task.
   */
  remove(id: number) {
    this._tasks.update((l) => l.filter((t) => t.id !== id));
    this.save();
  }

  /**
   * Removes every completed task.
   */
  clearDone() {
    this._tasks.update((l) => l.filter((t) => t.status !== 'done'));
    this.save();
  }

  /**
   * Sets the priority filter.
   *
   * @param p The priority to show, or `all`.
   */
  setPriorityFilter(p: Priority | 'all') {
    this._priorityFilter.set(p);
  }

  /**
   * Writes the board to storage.
   */
  private save() {
    localStorage.setItem('ng-tasks', JSON.stringify(this._tasks()));
  }

  /**
   * Reads the board from storage.
   *
   * Wrapped in a `try`, because `localStorage` throws in private-mode browsers and
   * the stored JSON may have been written by an older version of this page. A
   * failure has to mean "empty board", not "the page will not load".
   *
   * @returns The stored tasks, or an empty board.
   */
  private load(): Task[] {
    try {
      return JSON.parse(localStorage.getItem('ng-tasks') ?? '[]');
    } catch {
      return [];
    }
  }
}

// ---------- MAIN LESSON COMPONENT ----------
/**
 * Project: Task Manager — a kanban board built from the pieces the lessons
 * cover.
 *
 * A practice project rather than a lesson. It puts a signal store, derived state,
 * forms, persistence and conditional styling together into one working feature,
 * which is the part that reading them separately does not teach.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9). `expert/change-detection` is the reference for a
 * *concept* lesson — pose the problem, then analogy, then mechanism, then the
 * same idea in several modes. A capstone project does not fit that single arc:
 * there is no one mechanism to reveal, there is a **build**, made of several
 * pieces that depend on each other. So this page keeps the concept lesson's
 * ingredients — an analogy before the code, a real visual, ask-before-telling,
 * annotated snippets, a self-test, a recap — but sequences them as
 * "here is the next piece, and here is why it looks like this":
 *
 * 1. **The shape of the build**, before any code: a containment diagram (data
 *    flows down through the component tree, events flow back up) and the
 *    request-to-render loop every interaction on the board takes.
 * 2. **The mental model** — the store as a warehouse with one loading dock —
 *    delivered twice: once as prose, once as a dialogue between a component and
 *    the store that dramatizes the same rule from the other side.
 * 3. **Six pieces, in build order**, each its own `app-code-lab` with real,
 *    line-annotated source: the data model, the store's state and derived
 *    views, its mutations, its persistence, the host component, and the
 *    `TaskCard` leaf. Two self-tests are embedded where the trap actually is —
 *    the mutation that "should" work, and `track` by id versus by index.
 * 4. **The live board itself**, unchanged from before this migration and
 *    extended beyond the walkthrough (priority filter, deadlines, clear-done) —
 *    the thing a reader can actually click, exactly as it always worked.
 * 5. **A scope quiz, an FAQ, and a recap** phrased as rules to keep, not a
 *    table of contents.
 *
 * @see expert/state-management — the store pattern.
 * @see intermediate/template-forms — the add form.
 */
@Component({
  selector: 'app-project-task-manager',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  providers: [TaskStore],
  styleUrl: './task-manager.css',
  templateUrl: './task-manager.html',
})
export class TaskManager {
  // ── Chapter header ─────────────────────────────────────────────────────────

  /** The Projects track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Task Manager' },
    { label: 'Auth Flow', id: 'auth-flow' },
    { label: 'Data Dashboard', id: 'data-dashboard' },
  ];

  // ── The shape of the build ──────────────────────────────────────────────────

  /** The leaf every binding is ultimately reaching: the containment diagram's core. */
  protected readonly boardCore: Layer = {
    label: 'TaskCard',
    sub: 'one task, no state of its own',
  };

  /** Everything `TaskCard` sits inside, outermost first. */
  protected readonly boardRings: Layer[] = [
    { label: 'TaskManagerPage', sub: 'injects TaskStore, provides it here' },
    { label: 'the @for over columns', sub: 'reads store.byStatus()' },
  ];

  /**
   * One trip around the unidirectional loop. Every interaction on the board — add,
   * move, remove, filter — takes exactly this path, which is the point of the
   * architecture and the thing a reader should be able to recite afterwards.
   */
  protected readonly loop: FlowStep[] = [
    { label: 'User clicks', detail: 'A button in the template fires an event' },
    {
      label: 'Component calls the store',
      detail: 'It never touches state itself — only `store.move(id, status)`',
    },
    {
      label: 'Store `.update()`s',
      detail: 'A **new** array replaces the old one; the signal version ticks',
      tone: 'accent',
    },
    {
      label: '`byStatus` recomputes',
      detail: 'Derived state regroups the columns — nobody told it to',
    },
    {
      label: 'Template re-renders',
      detail: 'Only the bindings that read the changed signal',
      tone: 'good',
    },
    { label: '`save()` writes storage', detail: 'The board survives a refresh' },
  ];

  // ── The mental model ────────────────────────────────────────────────────────

  /**
   * The warehouse analogy, dramatized as a dialogue instead of restated as prose.
   * Same rule — private writes, public reads — from the other side of the counter.
   */
  protected readonly dockTalk: BubbleTurn[] = [
    { who: 'Component', says: "I'll just grab `tasks()`, filter it myself, and show my own copy." },
    {
      who: 'Store',
      says: 'You get `tasks` read-only. Filtering happens once, in `byStatus` — for every component, not one.',
    },
    { who: 'Component', says: 'Fine — I want to mark this one done.' },
    {
      who: 'Store',
      says: "Call `move(id, 'done')`. I'll build the new array, notify everyone reading it, and save it. You never touch `_tasks`.",
    },
    { who: 'Component', says: 'What if I `push()` straight onto the array `tasks()` gave me?' },
    {
      who: 'Store',
      says: "You'll get the same array back — same reference — so nothing renders, and nothing gets saved. That's exactly why I never hand out the write methods.",
    },
  ];

  // ── Piece 1: the data model ─────────────────────────────────────────────────

  /** Sample: the domain types every other piece builds on. */
  protected readonly dataModelSample = `type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in-progress' | 'done';

interface Task {
  id: number;          // stable identity — what @for tracks by
  title: string;       // the only field the user types
  priority: Priority;  // reuses the union above, so a typo can't sneak in
  status: Status;      // which Kanban column this task currently sits in
  createdAt: number;   // Date.now() in ms, not a Date object
  deadline?: number;   // optional — same reason: survives JSON round-trips
}`;

  /** Line-by-line walkthrough of {@link dataModelSample}. */
  protected readonly dataModelNotes: CodeNote[] = [
    {
      line: 1,
      text: "Union types, not `string`. Typo `'hgih'` anywhere in the app and the compiler stops you — a plain `string` would let it through all the way to production, and this union also drives every filter button and `<select>` in the demo below.",
    },
    {
      line: 4,
      text: 'The shape every task in the app conforms to. Nothing constructs a `Task` by hand outside the store — see the next piece.',
    },
    {
      line: 5,
      text: '`id` is the identity `@for` will `track` by, later on. It has to stay stable across renders, which is why it is never recomputed from position in the array.',
    },
    {
      line: 6,
      text: 'The only field a person actually types. Everything else on this interface is either derived or assigned by the store.',
    },
    {
      line: 8,
      text: 'Which of the three Kanban columns this task currently renders in. Changing it is the entire job of `move()`, two pieces from now.',
    },
    {
      line: 9,
      text: 'A plain millisecond number from `Date.now()`, not a `Date` object. Numbers survive `JSON.stringify`/`JSON.parse` intact; a `Date` would come back out of `localStorage` as a plain string.',
    },
    {
      line: 10,
      text: '`?` makes this optional — most tasks have no deadline. Stored as a timestamp for the same JSON round-trip reason as `createdAt`.',
    },
  ];

  // ── Piece 2: the store's state and derived views ───────────────────────────

  /** Sample: the store's private state, its read-only exposure, and its derived views. */
  protected readonly storeStateSample = `@Injectable()
class TaskStore {
  // ---- THE ONE SOURCE OF TRUTH ----
  // Nothing outside this class can call .set() or .update() on it.
  private readonly _tasks = signal<Task[]>(this.load());

  // ---- READ-ONLY WINDOW ONTO IT ----
  // Same signal, write methods stripped from its TYPE — zero runtime cost.
  readonly tasks = this._tasks.asReadonly();

  private readonly _priorityFilter = signal<Priority | 'all'>('all');
  readonly priorityFilter = this._priorityFilter.asReadonly();

  // ---- DERIVED STATE ----
  // One computed produces all three columns, so they cannot disagree.
  readonly byStatus = computed(() => {
    const pf = this._priorityFilter();
    const apply = (list: Task[]) =>
      pf === 'all' ? list : list.filter((t) => t.priority === pf);
    return {
      todo: apply(this._tasks().filter((t) => t.status === 'todo')),
      'in-progress': apply(this._tasks().filter((t) => t.status === 'in-progress')),
      done: apply(this._tasks().filter((t) => t.status === 'done')),
    };
  });

  readonly stats = computed(() => ({
    total: this._tasks().length,
    done: this._tasks().filter((t) => t.status === 'done').length,
    high: this._tasks().filter((t) => t.priority === 'high' && t.status !== 'done').length,
  }));

  // add(), move(), remove(), clearDone(), save() and load() continue below.
}`;

  /** Line-by-line walkthrough of {@link storeStateSample}. */
  protected readonly storeStateNotes: CodeNote[] = [
    {
      line: 5,
      text: '`private` plus the underscore convention means nothing outside this class can call `.set()` or `.update()` here. The initial value comes from `load()` — a call into the persistence piece coming up two sections from now — so a refresh restores the board before the component even renders.',
    },
    {
      line: 9,
      text: '`asReadonly()` returns the **same** signal with the write methods removed from its TYPE — no copy, no runtime cost. Components can call `tasks()` to read; `tasks.set(...)` is a compile error.',
    },
    {
      line: 11,
      text: "A second private signal, same pattern, for which priority the board is currently filtered to. `'all'` is the default — nothing hidden until the reader picks a filter.",
    },
    {
      line: 16,
      text: '`byStatus` is the board`s three columns, computed from one source. It recomputes automatically whenever `_tasks` or `_priorityFilter` changes — and only if something is currently reading it.',
    },
    {
      line: 18,
      text: "One small filter helper shared by all three columns, so the `'all'` bypass is written once instead of three times with three chances to drift apart.",
    },
    {
      line: 22,
      text: 'Quoted because the key contains a hyphen — `in-progress` is not a valid bare identifier in an object literal.',
    },
    {
      line: 27,
      text: 'A second `computed` reading the same `_tasks` signal — the board`s totals, for the stat pills. Independent of `byStatus`, so reading one never recomputes the other.',
    },
  ];

  // ── Piece 3: mutations, the only way in ─────────────────────────────────────

  /** Sample: the four named mutations — the store's entire public write surface. */
  protected readonly storeMutationsSample = `add(title: string, priority: Priority, deadline?: number) {
  if (!title.trim()) return;
  const task: Task = {
    id: this.nextId++,
    title: title.trim(),
    priority,
    status: 'todo',
    createdAt: Date.now(),
    deadline,
  };
  // update() takes the CURRENT array and returns the NEXT one. The spread
  // builds a new array — a new reference — which is what makes the
  // signal notify. l.push(task) would mutate in place and change nothing.
  this._tasks.update((l) => [...l, task]);
  this.save();
}

move(id: number, status: Status) {
  // map() rebuilds the array; only the matching task gets a spread copy
  // with the new status. Every other task comes back as the SAME
  // reference, so its TaskCard has no reason to re-render.
  this._tasks.update((l) => l.map((t) => (t.id === id ? { ...t, status } : t)));
  this.save();
}

remove(id: number) {
  // filter() naturally returns a new array, so this one is safe by default.
  this._tasks.update((l) => l.filter((t) => t.id !== id));
  this.save();
}

clearDone() {
  this._tasks.update((l) => l.filter((t) => t.status !== 'done'));
  this.save();
}`;

  /** Line-by-line walkthrough of {@link storeMutationsSample}. */
  protected readonly storeMutationsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`deadline?` is optional — the caller passes intent (title, priority, optionally a date). Everything else about a `Task` — its `id`, its starting `status`, its `createdAt` — is the store`s job, never the caller`s.',
    },
    {
      line: 2,
      text: 'Guards against an empty or whitespace-only title before anything else runs. `trim()` on line 5 is what actually gets stored, so a title of three spaces never reaches the board at all.',
    },
    {
      line: 14,
      text: 'The spread `[...l, task]` builds a brand-new array. `_tasks.update()` swaps the signal to that new reference, which is the only thing that makes anything notice.',
    },
    {
      line: 22,
      text: 'The ternary inside `map` is the whole trick: replace the ONE matching task with a copy carrying the new `status`, and let every other task pass through untouched — same object, same reference.',
    },
    {
      line: 28,
      text: '`filter()` is naturally non-mutating — it always returns a new array — so unlike `push`, there is no wrong way to write this one.',
    },
    {
      line: 33,
      text: 'Same shape as `remove()`, just a different predicate: drop everything with `status === \'done\'`. A named mutation for a one-line operation, because "named mutation" is the rule here, not an exception made for short ones.',
    },
  ];

  /** The mutation trap — the single most common way to break this board. */
  protected readonly mutationSample = `// In a component, "just add one task":
addTask(task: Task) {
  this.store.tasks().push(task);
}

// The array really does contain the new task.
// Does the board show it?`;

  // ── Piece 4: persistence ────────────────────────────────────────────────────

  /** Sample: the two private methods that make the board survive a refresh. */
  protected readonly persistenceSample = `// Reading this._tasks() inside save() is fine: it's a plain method call,
// not a computed, so it creates no reactive dependency.
private save() {
  localStorage.setItem('ng-tasks', JSON.stringify(this._tasks()));
}

private load(): Task[] {
  // ?? '[]' covers the very first visit, when getItem() returns null.
  try {
    return JSON.parse(localStorage.getItem('ng-tasks') ?? '[]');
  } catch {
    // A half-written value, or a manual edit in DevTools, would otherwise
    // throw during field initialisation and take the whole page down.
    // An empty board beats a blank screen.
    return [];
  }
}`;

  /** Line-by-line walkthrough of {@link persistenceSample}. */
  protected readonly persistenceNotes: CodeNote[] = [
    {
      line: 3,
      text: 'Called from inside every mutator — `add`, `move`, `remove`, `clearDone` — never from a template. `private`, because nothing outside this class needs to know storage exists at all.',
    },
    {
      line: 4,
      text: 'Reading `this._tasks()` here creates no reactive dependency — `save` is an ordinary method, not a `computed` or an `effect`, so nothing re-runs it automatically. It only ever runs because a mutator called it, synchronously, in the same tick as the change.',
    },
    {
      line: 9,
      text: 'Wrapped in a `try` on purpose. `localStorage` throws in some private-mode browsers, and the JSON it returns could have been written by an older version of this page.',
    },
    {
      line: 10,
      text: "`?? '[]'` covers the very first visit: a brand-new browser has never called `setItem`, so `getItem` returns `null`, and `JSON.parse(null)` would throw without this fallback.",
    },
    {
      line: 15,
      text: 'Falling back to an empty board is the whole point of the `catch`. One corrupted entry should mean "start fresh", never "the page is now blank."',
    },
  ];

  // ── Piece 5: the host component ─────────────────────────────────────────────

  /** Sample: a simplified host component — providers, template control flow, the add form. */
  protected readonly hostSample = `@Component({
  selector: 'app-task-manager-page',
  standalone: true,
  // providers: [TaskStore] — NOT providedIn: 'root'. This component tree
  // gets its own instance, and it dies when the component is destroyed.
  providers: [TaskStore],
  template: \`
    <div class="add-form">
      <!-- [(ngModel)] is two-way: typing updates newTitle, and clearing
           newTitle in add() below empties the box on screen again. -->
      <input [(ngModel)]="newTitle" placeholder="New task..." />
      <button (click)="add()">Add Task</button>
    </div>

    <div class="board">
      <!-- OUTER loop: the three column definitions, a static array. -->
      @for (col of columns; track col.id) {
        <div class="column">
          <h3>{{ col.label }}</h3>
          <!-- INNER loop: the tasks in THIS column. track task.id, not
               $index — tasks move between columns and get removed from
               the middle, and only a stable id survives that. -->
          @for (task of store.byStatus()[col.id]; track task.id) {
            <!-- Data flows DOWN via [task]; events flow UP via the two
                 outputs. $event is whatever TaskCard passed to emit(). -->
            <app-task-card
              [task]="task"
              (onMove)="store.move($event.id, $event.status)"
              (onRemove)="store.remove($event)"
            />
          }
        </div>
      }
    </div>
  \`,
})
export class TaskManagerPage {
  // protected = reachable from the template, invisible to other classes.
  protected readonly store = inject(TaskStore);
  // A plain field, not a signal — ngModel writes to it directly, and this
  // is transient form state, not application state the store should own.
  newTitle = '';

  add() {
    // The component's whole job: hand the store the user's intent...
    this.store.add(this.newTitle, 'medium');
    // ...and reset the input. The extended demo below also resets a
    // priority and a deadline field the same way.
    this.newTitle = '';
  }
}`;

  /** Line-by-line walkthrough of {@link hostSample}. */
  protected readonly hostNotes: CodeNote[] = [
    {
      line: 6,
      text: "This is what actually creates a fresh `TaskStore` per component instance, instead of sharing one across the whole app the way `providedIn: 'root'` would.",
    },
    {
      line: 11,
      text: "Typing updates `newTitle` on the class; the class emptying `newTitle` in `add()` clears the box back on screen. That's the whole of two-way binding — one property binding plus one event binding, wearing a bow.",
    },
    {
      line: 17,
      text: 'The outer `@for` is over a small, static array of column definitions — `track col.id` here is good hygiene more than a necessity.',
    },
    {
      line: 23,
      text: 'The inner `@for` is the one that matters. Tasks move between columns and get deleted from the middle of the list, so `track task.id` is what lets Angular relocate an existing DOM node instead of tearing it down and rebuilding it.',
    },
    {
      line: 26,
      text: '`[task]` sends data down; `(onMove)`/`(onRemove)` send events up. `$event` is exactly whatever `TaskCard` passed to `.emit()` — the `{ id, status }` object and the bare number respectively.',
    },
    {
      line: 39,
      text: '`inject()` is the field-initialiser form of dependency injection — no constructor needed, and `protected` is exactly enough visibility for the template to reach it.',
    },
    {
      line: 46,
      text: "The component's whole job in one line: hand the store the user's intent. It never assembles a `Task` itself — that stays the store's responsibility from piece 3.",
    },
  ];

  /** Sample: what happens to the DOM when a keyed loop tracks by position instead of identity. */
  protected readonly trackSample = `@for (task of tasks; track $index) {
  <app-task-card [task]="task" />
}

// Delete the FIRST task in a column.
// Every task after it now sits at a different index than last render.
// What does Angular conclude changed?`;

  // ── Piece 6: the TaskCard leaf ───────────────────────────────────────────────

  /** Sample: a leaf presentation component — one input, two outputs, no state. */
  protected readonly taskCardSample = `@Component({
  selector: 'app-task-card',
  standalone: true,
  template: \`
    <div class="task-card">
      <!-- task is a SIGNAL, so every read is a call: task(), then .title. -->
      <p class="task-title">{{ task().title }}</p>
      <span class="priority priority-{{ task().priority }}">
        {{ task().priority }}
      </span>
      <!-- Hide the "complete" button on tasks already done. -->
      @if (task().status !== 'done') {
        <!-- emit() sends the payload to whatever the parent bound to
             (onMove). This card decides WHAT happened; it has no idea
             how the parent will store it — that ignorance is the point. -->
        <button (click)="onMove.emit({ id: task().id, status: 'done' })">
          ✓
        </button>
      }
      <button (click)="onRemove.emit(task().id)">✕</button>
    </div>
  \`,
})
export class TaskCard {
  // .required means there is no default — forget [task] on the parent
  // and the build fails, instead of rendering an undefined card at runtime.
  task = input.required<Task>();
  // The type parameter IS the event payload contract. Emit the wrong
  // shape and TypeScript catches it here, before the parent ever sees it.
  onMove = output<{ id: number; status: Status }>();
  onRemove = output<number>();
  // Notice what is NOT here: no state, no store, no injected service.
  // The card renders what it is given and reports what was clicked.
}`;

  /** Line-by-line walkthrough of {@link taskCardSample}. */
  protected readonly taskCardNotes: CodeNote[] = [
    {
      line: 7,
      text: '`task` is a signal input, so every read is a call: `task()`, then `.title`. Forget the parentheses and TypeScript hands you the signal object, not a `Task`.',
    },
    {
      line: 8,
      text: 'Interpolation inside a class attribute builds a dynamic class name — `priority-high`, `priority-medium`, `priority-low` — so one CSS rule per priority colours the badge.',
    },
    {
      line: 11,
      text: 'Hides the "complete" button once a task is already `done`. A finished task has nowhere left to move to.',
    },
    {
      line: 16,
      text: '`emit()` sends the payload to whichever handler the parent bound to `(onMove)`. This card decides **what** happened; it has no idea **how** the parent will store it — that ignorance is what makes it reusable.',
    },
    {
      line: 27,
      text: '`input.required<Task>()` means there is no default. Forget `[task]` on the parent and the **build** fails, instead of silently rendering an undefined card at runtime.',
    },
    {
      line: 30,
      text: 'The type parameter on `output<{ id: number; status: Status }>()` IS the event contract. Emit the wrong shape from anywhere in this class and TypeScript catches it here — before the parent ever sees it.',
    },
    {
      line: 32,
      text: 'Notice what is NOT here: no state, no store, no injected service. `TaskCard` renders what it is given and reports what was clicked — nothing else. That is what "presentational component" means in practice.',
    },
  ];

  // ── Recap and self-tests ────────────────────────────────────────────────────

  /** Choices for the provider-scope check. */
  protected readonly scopeOptions: QuizOption[] = [
    {
      text: "Nothing visible — `providers` and `providedIn: 'root'` are two spellings of the same thing",
      why: 'They both make the service injectable, but at different **scopes**, and scope decides lifetime. That difference is exactly what this board depends on.',
    },
    {
      text: 'Each visit to the page gets a fresh store, seeded from localStorage',
      correct: true,
      why: 'A component-level provider creates one instance per component instance and destroys it with the component. Navigate away and back and you get a brand-new store — which re-runs `load()`, so the board rehydrates from storage rather than from a stale in-memory copy.',
    },
    {
      text: 'The store becomes a singleton shared with every other lesson page',
      why: "That is what `providedIn: 'root'` would do. Here the provider is on the component, so the instance cannot escape this component's subtree.",
    },
    {
      text: 'Tasks stop persisting, because the store is destroyed on navigation',
      why: 'Destroying the store loses nothing: `save()` already wrote every mutation to localStorage as it happened. That is precisely why the store can afford to be disposable.',
    },
  ];

  /** The doubts this project reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why are the writable signals private with a separate read-only copy? It looks like ceremony.',
      a: 'Because `asReadonly()` makes the rule enforceable instead of merely agreed. If components could call `tasks.set(...)`, then "what changes the board?" has as many answers as there are templates. With one private signal and a handful of named methods, the answer is a list you can read in one screen — and `save()` is guaranteed to run, because every write goes through a method that calls it.',
    },
    {
      q: 'Why is `byStatus` one computed returning three lists, rather than three computeds?',
      a: 'So the columns cannot disagree. One computed reads `_tasks` once and splits it, so all three lists always describe the same snapshot. Three separate computeds would each read independently — fine in practice today, but it makes an inconsistent intermediate state **representable**, and the cheapest bugs are the ones the shape rules out.',
    },
    {
      q: 'Why `track task.id` and not `track $index`?',
      a: 'Because tasks move between columns and get removed from the middle. With `$index`, deleting the first task shifts every later one up an index, and Angular concludes that every row changed — so it rebuilds DOM that was perfectly good, throwing away focus and animation state. A stable id lets it match rows to elements and move just the one that actually moved.',
    },
    {
      q: 'Why save on every mutation instead of using an `effect()`?',
      a: 'An `effect` would work and is arguably tidier. The trade-off is timing: effects are **scheduled**, so the write lands a microtask later, and a refresh in that gap loses the change. Calling `save()` inside the mutator makes the write synchronous with the change. At this size, boring and immediate beats elegant and deferred.',
    },
    {
      q: 'The demo board is one component. The walkthrough splits it into four. Which is right?',
      a: 'Both, for different jobs. The walkthrough shows the shape you want in a real app — `TaskCard` as a dumb leaf with an input and two outputs is reusable and independently testable. The live demo is deliberately flattened so you can read the whole thing in one file while learning. Splitting is what you do once the component stops fitting on a screen.',
    },
  ];

  // ── The live demo (unchanged) ────────────────────────────────────────────────

  /**
   * The board's store, provided here so each visit starts from storage rather than
   * from a stale instance.
   */
  protected readonly store = inject(TaskStore);
  /**
   * The new task's title.
   */
  protected newTitle = '';
  /**
   * The new task's priority.
   */
  protected newPriority: Priority = 'medium';
  /**
   * The new task's deadline, as the date input's string.
   */
  protected newDeadline = '';

  /**
   * The board's columns.
   */
  protected readonly columns: { id: Status; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
  ];

  /**
   * The priority filter options.
   */
  protected readonly priorityFilters: { id: Priority | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  /**
   * Adds a task from the form and clears it.
   */
  protected add() {
    const deadline = this.newDeadline ? new Date(this.newDeadline).getTime() : undefined;
    this.store.add(this.newTitle, this.newPriority, deadline);
    this.newTitle = '';
    this.newDeadline = '';
  }

  /**
   * Whether a task is due soon enough to flag.
   *
   * Completed tasks are never urgent, however overdue — a done task with a red
   * border is noise.
   *
   * @param task The task.
   * @returns Whether it is due within three days.
   */
  protected isUrgent(task: Task): boolean {
    if (!task.deadline || task.status === 'done') return false;
    return task.deadline - Date.now() < 3 * 24 * 60 * 60 * 1000;
  }

  /**
   * Formats a task's deadline as a relative phrase.
   *
   * @param task The task.
   * @returns Something like "in 2 days" or "overdue", or empty if there is no
   *          deadline.
   */
  protected formatDeadline(task: Task): string {
    if (!task.deadline) return '';
    const diff = Math.ceil((task.deadline - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return (
      'Due ' +
      new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
  }
}
