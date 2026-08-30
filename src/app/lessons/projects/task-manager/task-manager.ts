import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 * @see expert/state-management — the store pattern.
 * @see intermediate/template-forms — the add form.
 */
@Component({
  selector: 'app-project-task-manager',
  standalone: true,
  imports: [RouterLink, FormsModule, Compare, Faq, Flow, Predict, Quiz, Remember],
  providers: [TaskStore],
  styleUrl: './task-manager.css',
  templateUrl: './task-manager.html',
})
export class TaskManager {
  /**
   * One trip around the unidirectional loop. Every interaction on the board — add,
   * move, remove, filter — takes exactly this path, which is the point of the
   * architecture and the thing a reader should be able to recite afterwards.
   */
  protected readonly loop = [
    { label: 'User clicks', detail: 'A button in the template fires an event' },
    {
      label: 'Component calls the store',
      detail: 'It never touches state itself — only `store.move(id, status)`',
    },
    {
      label: 'Store `.update()`s',
      detail: 'A *new* array replaces the old one; the signal version ticks',
      tone: 'accent' as const,
    },
    {
      label: '`byStatus` recomputes',
      detail: 'Derived state regroups the columns — nobody told it to',
    },
    {
      label: 'Template re-renders',
      detail: 'Only the bindings that read the changed signal',
      tone: 'good' as const,
    },
    { label: '`save()` writes storage', detail: 'The board survives a refresh' },
  ];

  /** The mutation trap — the single most common way to break this board. */
  protected readonly mutationSample = `// In a component, "just add one task":
addTask(task: Task) {
  this.store.tasks().push(task);
}

// The array really does contain the new task.
// Does the board show it?`;

  /** Choices for the provider-scope check. */
  protected readonly scopeOptions = [
    {
      text: "Nothing visible — `providers` and `providedIn: 'root'` are two spellings of the same thing",
      why: 'They both make the service injectable, but at different *scopes*, and scope decides lifetime. That difference is exactly what this board depends on.',
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
  protected readonly questions = [
    {
      q: 'Why are the writable signals private with a separate read-only copy? It looks like ceremony.',
      a: 'Because `asReadonly()` makes the rule enforceable instead of merely agreed. If components could call `tasks.set(...)`, then "what changes the board?" has as many answers as there are templates. With one private signal and a handful of named methods, the answer is a list you can read in one screen — and `save()` is guaranteed to run, because every write goes through a method that calls it.',
    },
    {
      q: 'Why is `byStatus` one computed returning three lists, rather than three computeds?',
      a: 'So the columns cannot disagree. One computed reads `_tasks` once and splits it, so all three lists always describe the same snapshot. Three separate computeds would each read independently — fine in practice today, but it makes an inconsistent intermediate state *representable*, and the cheapest bugs are the ones the shape rules out.',
    },
    {
      q: 'Why `track task.id` and not `track $index`?',
      a: 'Because tasks move between columns and get removed from the middle. With `$index`, deleting the first task shifts every later one up an index, and Angular concludes that every row changed — so it rebuilds DOM that was perfectly good, throwing away focus and animation state. A stable id lets it match rows to elements and move just the one that actually moved.',
    },
    {
      q: 'Why save on every mutation instead of using an `effect()`?',
      a: 'An `effect` would work and is arguably tidier. The trade-off is timing: effects are *scheduled*, so the write lands a microtask later, and a refresh in that gap loses the change. Calling `save()` inside the mutator makes the write synchronous with the change. At this size, boring and immediate beats elegant and deferred.',
    },
    {
      q: 'The demo board is one component. The walkthrough splits it into four. Which is right?',
      a: 'Both, for different jobs. The walkthrough shows the shape you want in a real app — `TaskCard` as a dumb leaf with an input and two outputs is reusable and independently testable. The live demo is deliberately flattened so you can read the whole thing in one file while learning. Splitting is what you do once the component stops fitting on a screen.',
    },
  ];

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
