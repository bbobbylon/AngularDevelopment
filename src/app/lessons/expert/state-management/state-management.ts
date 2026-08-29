import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A todo in the signal-store demo.
 */
interface Todo {
  id: number;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Which todos the list shows.
 */
type Filter = 'all' | 'active' | 'done';

/**
 * A signal store — the pattern this lesson argues for.
 *
 * A plain injectable holding private writable signals, exposing them read-only,
 * deriving everything else with `computed`, and mutating only through methods.
 * No library, no reducers, no action types: the encapsulation that NgRx provides
 * by convention falls out of `private` plus `asReadonly()`.
 *
 * The lesson's position is that most apps never need more than this, and that
 * reaching for a store library before feeling the pain it solves is how a todo
 * list ends up with fifteen files.
 */
@Injectable()
class TodoStore {
  /**
   * The todos. Private and writable; exposed read-only below.
   */
  private readonly _todos = signal<Todo[]>([
    { id: 1, title: 'Learn signals', done: true, priority: 'high' },
    { id: 2, title: 'Build a signal store', done: false, priority: 'high' },
    { id: 3, title: 'Add NgRx when team grows', done: false, priority: 'low' },
  ]);
  /**
   * The active filter. Private and writable.
   */
  private readonly _filter = signal<Filter>('all');
  /**
   * Sequence source for todo ids.
   */
  private nextId = 4;

  /**
   * The todos, read-only. Consumers can read and react but not write, so every
   * mutation goes through a method and is therefore findable.
   */
  readonly todos = this._todos.asReadonly();
  /**
   * The filter, read-only.
   */
  readonly filter = this._filter.asReadonly();

  /**
   * The todos the current filter admits. Derived, so nothing has to remember to
   * recompute it.
   */
  readonly filtered = computed(() => {
    const f = this._filter();
    return this._todos().filter((t) =>
      f === 'active' ? !t.done : f === 'done' ? t.done : true,
    );
  });
  /**
   * How many todos are outstanding.
   */
  readonly remaining = computed(() => this._todos().filter((t) => !t.done).length);
  /**
   * How many todos there are.
   */
  readonly total = computed(() => this._todos().length);
  /**
   * Whether everything is done — derived from two other derivations, which costs
   * nothing extra because `computed` is lazy and cached.
   */
  readonly allDone = computed(() => this.total() > 0 && this.remaining() === 0);

  /**
   * Adds a todo, ignoring blank input.
   *
   * @param title    What to do.
   * @param priority How urgent.
   */
  add(title: string, priority: Todo['priority'] = 'medium') {
    if (!title.trim()) return;
    this._todos.update((l) => [...l, { id: this.nextId++, title, done: false, priority }]);
  }
  /**
   * Toggles a todo's done state.
   *
   * @param id Which todo.
   */
  toggle(id: number) {
    this._todos.update((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  /**
   * Removes a todo.
   *
   * @param id Which todo.
   */
  remove(id: number) {
    this._todos.update((l) => l.filter((t) => t.id !== id));
  }
  /**
   * Removes every completed todo.
   */
  clearDone() {
    this._todos.update((l) => l.filter((t) => !t.done));
  }
  /**
   * Sets the filter.
   *
   * @param f Which todos to show.
   */
  setFilter(f: Filter) {
    this._filter.set(f);
  }
}

/**
 * Lesson: State Management — how much machinery a given app actually needs.
 *
 * Walks up the ladder: component state, a shared service with signals, a signal
 * store ({@link TodoStore}), and only then NgRx or NgRx SignalStore — with the
 * question at each rung being what the next one buys you.
 *
 * The demo is deliberately a todo list, the canonical Redux example, built as a
 * signal store in about forty lines. Reading it next to the equivalent NgRx
 * setup is the argument.
 */
@Component({
  selector: 'app-lesson-state-management',
  imports: [RouterLink],
  providers: [TodoStore],
  styleUrl: './state-management.css',
  templateUrl: './state-management.html',
})
export class StateManagement {
  /**
   * The store, provided at this component so the demo starts fresh on each visit.
   */
  protected readonly store = inject(TodoStore);
}
