import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [RouterLink, FormsModule],
  providers: [TaskStore],
  styleUrl: './task-manager.css',
  templateUrl: './task-manager.html',
})
export class TaskManager {
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
