import { Component, computed, inject, Injectable, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ============================================================
// WHAT YOU'LL BUILD: a full Task Manager app covering:
//   Signals + Signal Store, Components + Inputs/Outputs,
//   Template Control Flow, Two-way Binding, Local Persistence
// ============================================================

type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in-progress' | 'done';

interface Task {
  id: number;
  title: string;
  priority: Priority;
  status: Status;
  createdAt: number;
  deadline?: number;
}

// ---------- STEP 3: The Signal Store ----------
@Injectable()
class TaskStore {
  private readonly _tasks = signal<Task[]>(this.load());
  private readonly _priorityFilter = signal<Priority | 'all'>('all');
  private nextId = Math.max(0, ...this._tasks().map((t) => t.id)) + 1;

  readonly tasks = this._tasks.asReadonly();
  readonly priorityFilter = this._priorityFilter.asReadonly();

  readonly byStatus = computed(() => {
    const pf = this._priorityFilter();
    const apply = (list: Task[]) => (pf === 'all' ? list : list.filter((t) => t.priority === pf));
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

  add(title: string, priority: Priority, deadline?: number) {
    if (!title.trim()) return;
    const task: Task = { id: this.nextId++, title: title.trim(), priority, status: 'todo', createdAt: Date.now(), deadline };
    this._tasks.update((l) => [...l, task]);
    this.save();
  }

  move(id: number, status: Status) {
    this._tasks.update((l) => l.map((t) => (t.id === id ? { ...t, status } : t)));
    this.save();
  }

  remove(id: number) {
    this._tasks.update((l) => l.filter((t) => t.id !== id));
    this.save();
  }

  clearDone() {
    this._tasks.update((l) => l.filter((t) => t.status !== 'done'));
    this.save();
  }

  setPriorityFilter(p: Priority | 'all') {
    this._priorityFilter.set(p);
  }

  private save() {
    localStorage.setItem('ng-tasks', JSON.stringify(this._tasks()));
  }

  private load(): Task[] {
    try {
      return JSON.parse(localStorage.getItem('ng-tasks') ?? '[]');
    } catch {
      return [];
    }
  }
}

// ---------- MAIN LESSON COMPONENT ----------
@Component({
  selector: 'app-project-task-manager',
  standalone: true,
  imports: [RouterLink, FormsModule],
  providers: [TaskStore],
  styles: [`
    .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    @media (max-width: 640px) { .board { grid-template-columns: 1fr; } }
    .column { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
    .col-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .col-head h3 { margin: 0; font-size: .9rem; }
    .col-count { font-size: .8rem; padding: 2px 8px; border-radius: 20px; background: rgba(99,102,241,.1); color: #6366f1; }
    .task-card-item { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
    .task-title { font-size: .88rem; font-weight: 500; margin: 0 0 6px; }
    .task-meta { display: flex; gap: 6px; align-items: center; }
    .priority { font-size: .72rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .priority-high   { background: #fee2e2; color: #991b1b; }
    .priority-medium { background: #fef9c3; color: #854d0e; }
    .priority-low    { background: #f0fdf4; color: #166534; }
    .task-btns { display: flex; gap: 4px; margin-left: auto; }
    .task-btns button { padding: 2px 7px; font-size: .74rem; border-radius: 6px;
      border: 1px solid var(--border); background: var(--surface); cursor: pointer; color: var(--text); }
    .task-btns button:hover { background: rgba(99,102,241,.1); }
    .stat-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 10px 0 16px; }
    .stat-pill { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); font-size: .85rem; background: var(--surface); }
    .add-form { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; }
    .add-form input { flex: 1; min-width: 180px; }
    .add-form select { border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; background: var(--surface); color: var(--text); }
    .step-callout { background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-size: .88rem; line-height: 1.5; }
    .step-callout h4 { margin: 0 0 6px; color: #6366f1; }
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 10px; align-items: center; }
    .filter-row strong { font-size: .82rem; color: var(--text-muted); white-space: nowrap; }
    .filter-row button { padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .8rem; color: var(--text); }
    .filter-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .deadline-badge { font-size: .7rem; padding: 2px 6px; border-radius: 6px; background: rgba(99,102,241,.1); color: #6366f1; white-space: nowrap; }
    .deadline-badge.urgent { background: rgba(239,68,68,.12); color: #dc2626; }
    .task-card-item.urgent { border-color: rgba(239,68,68,.5); }
    .clear-done-btn { font-size: .7rem; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; color: var(--text-muted); }
    .clear-done-btn:hover { color: #ef4444; border-color: #ef4444; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Projects · Full Walkthrough</span>
      <h1>Project: Task Manager</h1>
      <p class="lead">
        Build a Kanban-style task manager from scratch. This walkthrough connects
        signals, a signal store, components, two-way binding, control flow and
        localStorage persistence into one working application.
      </p>

      <h2>What you will build</h2>
      <ul>
        <li>A three-column Kanban board: Todo → In Progress → Done</li>
        <li>Add tasks with title and priority (high/medium/low)</li>
        <li>Move tasks between columns</li>
        <li>Tasks persist across page reloads via localStorage</li>
        <li>Live stats: total, done, high-priority remaining</li>
      </ul>

      <h2>Architecture overview</h2>
      <div class="code">
        <pre>TaskManagerPage          ← host component (injects TaskStore)
  AddTaskForm            ← child component, emits new-task event
  KanbanBoard            ← renders 3 columns from byStatus computed
    TaskCard x N         ← leaf component, input task, emits move/remove
TaskStore (service)      ← signal store: private state, computed, methods</pre>
      </div>

      <h2>Step 1 — Define the data model</h2>
      <div class="step-callout">
        <h4>Concept: TypeScript interfaces for domain types</h4>
        Always start with your data model. Strong typing catches bugs before they reach the browser.
      </div>
      <div class="code">
        <pre>type Priority = 'low' | 'medium' | 'high';
type Status   = 'todo' | 'in-progress' | 'done';

interface Task {{ '{' }}
  id: number;
  title: string;
  priority: Priority;
  status: Status;
  createdAt: number;         // Date.now() timestamp
{{ '}' }}</pre>
      </div>

      <h2>Step 2 — Sketch the signal store interface</h2>
      <p>Before writing code, sketch what the store exposes:</p>
      <div class="code">
        <pre>// Public API of TaskStore:
readonly tasks:    Signal&lt;Task[]&gt;       // all tasks
readonly byStatus: Signal&lt;Record&lt;Status, Task[]&gt;&gt;   // grouped for columns
readonly stats:    Signal&lt;{{ '{' }} total, done, high {{ '}' }}&gt;

add(title: string, priority: Priority): void
move(id: number, status: Status): void
remove(id: number): void</pre>
      </div>

      <h2>Step 3 — Implement the signal store</h2>
      <div class="step-callout">
        <h4>Concepts: signal(), computed(), .asReadonly(), private writes</h4>
        The store owns all task state. Components read signals but never write directly.
        localStorage is synced on every mutation.
      </div>
      <div class="code">
        <pre>&#64;Injectable()
class TaskStore {{ '{' }}
  private readonly _tasks = signal&lt;Task[]&gt;(this.load());

  readonly tasks    = this._tasks.asReadonly();
  readonly byStatus = computed(() =&gt; ({{ '{' }}
    todo:        this._tasks().filter(t =&gt; t.status === 'todo'),
    'in-progress': this._tasks().filter(t =&gt; t.status === 'in-progress'),
    done:        this._tasks().filter(t =&gt; t.status === 'done'),
  {{ '}' }}));
  readonly stats = computed(() =&gt; ({{ '{' }}
    total: this._tasks().length,
    done:  this._tasks().filter(t =&gt; t.status === 'done').length,
    high:  this._tasks().filter(t =&gt; t.priority === 'high' &amp;&amp; t.status !== 'done').length,
  {{ '}' }}));

  add(title: string, priority: Priority) {{ '{' }}
    const task: Task = {{ '{' }} id: this.nextId++, title, priority, status: 'todo', createdAt: Date.now() {{ '}' }};
    this._tasks.update(l =&gt; [...l, task]);
    this.save();
  {{ '}' }}
  move(id: number, status: Status) {{ '{' }}
    this._tasks.update(l =&gt; l.map(t =&gt; t.id === id ? {{ '{' }} ...t, status {{ '}' }} : t));
    this.save();
  {{ '}' }}
  remove(id: number) {{ '{' }}
    this._tasks.update(l =&gt; l.filter(t =&gt; t.id !== id));
    this.save();
  {{ '}' }}

  private save() {{ '{' }} localStorage.setItem('ng-tasks', JSON.stringify(this._tasks())); {{ '}' }}
  private load(): Task[] {{ '{' }}
    try {{ '{' }} return JSON.parse(localStorage.getItem('ng-tasks') ?? '[]'); {{ '}' }}
    catch {{ '{' }} return []; {{ '}' }}
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 4 — Host component</h2>
      <div class="step-callout">
        <h4>Concepts: inject(), providers[], template control flow</h4>
        Provide the store at the component level (not root) so the board has its own
        isolated state. Inject it with inject() and pass data down via template bindings.
      </div>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  standalone: true,
  providers: [TaskStore],              // scoped to this component tree
  template: '
    &lt;div class="stat-row"&gt;
      &lt;span&gt;Total: {{ '{{' }} store.stats().total {{ '}}' }}&lt;/span&gt;
      &lt;span&gt;Done: {{ '{{' }} store.stats().done {{ '}}' }}&lt;/span&gt;
      &lt;span&gt;High priority: {{ '{{' }} store.stats().high {{ '}}' }}&lt;/span&gt;
    &lt;/div&gt;

    &lt;!-- add form --&gt;
    &lt;div class="add-form"&gt;
      &lt;input [(ngModel)]="newTitle" placeholder="New task..." /&gt;
      &lt;select [(ngModel)]="newPriority"&gt;...&lt;/select&gt;
      &lt;button (click)="add()"&gt;Add Task&lt;/button&gt;
    &lt;/div&gt;

    &lt;!-- board --&gt;
    &lt;div class="board"&gt;
      &#64;for (col of columns; track col.id) {{ '{' }}
        &lt;div class="column"&gt;
          &lt;div class="col-head"&gt;
            &lt;h3&gt;{{ '{{' }} col.label {{ '}}' }}&lt;/h3&gt;
            &lt;span class="col-count"&gt;{{ '{{' }} store.byStatus()[col.id].length {{ '}}' }}&lt;/span&gt;
          &lt;/div&gt;
          &#64;for (task of store.byStatus()[col.id]; track task.id) {{ '{' }}
            &lt;app-task-card [task]="task"
              (onMove)="store.move($event.id, $event.status)"
              (onRemove)="store.remove($event)" /&gt;
          {{ '}' }}
        &lt;/div&gt;
      {{ '}' }}
    &lt;/div&gt;
  '
{{ '}' }})
export class TaskManagerPage {{ '{' }}
  protected readonly store = inject(TaskStore);
  newTitle = '';
  newPriority: Priority = 'medium';

  add() {{ '{' }}
    this.store.add(this.newTitle, this.newPriority);
    this.newTitle = '';
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 5 — TaskCard child component</h2>
      <div class="step-callout">
        <h4>Concepts: input(), output(), child components</h4>
        TaskCard receives one task via input and emits move/remove events to the parent.
        It has no internal state — it's a pure presentation component.
      </div>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  selector: 'app-task-card',
  standalone: true,
  template: '
    &lt;div class="task-card"&gt;
      &lt;p class="task-title"&gt;{{ '{{' }} task().title {{ '}}' }}&lt;/p&gt;
      &lt;div class="task-meta"&gt;
        &lt;span class="priority priority-{{ '{{' }} task().priority {{ '}}' }}"&gt;{{ '{{' }} task().priority {{ '}}' }}&lt;/span&gt;
        &#64;if (task().status !== 'done') {{ '{' }}
          &lt;button (click)="onMove.emit({{ '{' }} id: task().id, status: 'done' {{ '}' }})"&gt;✓&lt;/button&gt;
        {{ '}' }}
        &lt;button (click)="onRemove.emit(task().id)"&gt;✕&lt;/button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  '
{{ '}' }})
export class TaskCard {{ '{' }}
  task = input.required&lt;Task&gt;();
  onMove   = output&lt;{{ '{' }} id: number; status: Status {{ '}' }}&gt;();
  onRemove = output&lt;number&gt;();
{{ '}' }}</pre>
      </div>

      <h2>Live demo — extended board</h2>
      <div class="demo">
        <p class="demo__title">Priority filter · Deadline dates · Clear done — all wired to the signal store</p>
        <div class="stat-row">
          <span class="stat-pill">Total: {{ store.stats().total }}</span>
          <span class="stat-pill" style="color:#22c55e">Done: {{ store.stats().done }}</span>
          @if (store.stats().high > 0) {
            <span class="stat-pill" style="color:#ef4444">High pending: {{ store.stats().high }}</span>
          }
        </div>

        <div class="filter-row">
          <strong>Priority:</strong>
          @for (p of priorityFilters; track p.id) {
            <button [class.active]="store.priorityFilter() === p.id"
                    (click)="store.setPriorityFilter($any(p.id))">{{ p.label }}</button>
          }
        </div>

        <div class="add-form">
          <input [(ngModel)]="newTitle" placeholder="New task title..." (keyup.enter)="add()" />
          <select [(ngModel)]="newPriority" style="border:1px solid var(--border);border-radius:6px;padding:6px 10px;background:var(--surface);color:var(--text)">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="date" [(ngModel)]="newDeadline"
            style="border:1px solid var(--border);border-radius:6px;padding:6px 8px;background:var(--surface);color:var(--text);font-size:.84rem"
            title="Optional deadline" />
          <button (click)="add()">Add Task</button>
        </div>

        <div class="board">
          @for (col of columns; track col.id) {
            <div class="column">
              <div class="col-head">
                <h3>{{ col.label }}</h3>
                <span class="col-count">{{ store.byStatus()[col.id].length }}</span>
                @if (col.id === 'done' && store.byStatus().done.length > 0) {
                  <button class="clear-done-btn" (click)="store.clearDone()">Clear</button>
                }
              </div>
              @for (task of store.byStatus()[col.id]; track task.id) {
                <div class="task-card-item" [class.urgent]="isUrgent(task)">
                  <p class="task-title">{{ task.title }}</p>
                  <div class="task-meta">
                    <span class="priority priority-{{ task.priority }}">{{ task.priority }}</span>
                    @if (task.deadline) {
                      <span class="deadline-badge" [class.urgent]="isUrgent(task)">
                        {{ formatDeadline(task) }}
                      </span>
                    }
                    <div class="task-btns">
                      @if (task.status !== 'in-progress') {
                        <button (click)="store.move(task.id, 'in-progress')">▶</button>
                      }
                      @if (task.status !== 'done') {
                        <button (click)="store.move(task.id, 'done')">✓</button>
                      }
                      @if (task.status !== 'todo') {
                        <button (click)="store.move(task.id, 'todo')">↩</button>
                      }
                      <button (click)="store.remove(task.id)" style="color:#ef4444">✕</button>
                    </div>
                  </div>
                </div>
              }
              @if (store.byStatus()[col.id].length === 0) {
                <p style="text-align:center;color:var(--text-muted);font-size:.82rem;padding:16px">Empty</p>
              }
            </div>
          }
        </div>
      </div>

      <h2>What you practiced</h2>
      <ul>
        <li><strong>Signal store pattern</strong> — private writes, public reads, computed selectors, named mutations</li>
        <li><strong>Priority filter</strong> — a <code>_priorityFilter</code> signal applied inside <code>byStatus</code> computed</li>
        <li><strong>Deadline field</strong> — optional timestamp stored in the model; urgency computed at render time</li>
        <li><strong>clearDone()</strong> — a named store mutation, immutable update with filter()</li>
        <li><strong>Two-way binding</strong> — [(ngModel)] for text, select, and date inputs</li>
        <li><strong>&#64;for with track</strong> — efficient list rendering in three columns</li>
        <li><strong>localStorage persistence</strong> — save on every mutation, hydrate in the store constructor</li>
      </ul>

      <h2>Further extensions</h2>
      <ul>
        <li>Add drag-and-drop between columns (HTML5 drag events — no library needed)</li>
        <li>Add an urgency sort within columns: tasks due soonest appear first</li>
        <li>Write a unit test for <code>TaskStore.add()</code> and <code>clearDone()</code></li>
        <li>Add a "tag" system: comma-separated tags stored in the model, filter by tag</li>
      </ul>

      <p><a routerLink="/auth-flow">Next Project: Auth Flow Walkthrough →</a></p>
    </article>
  `,
})
export class TaskManager {
  protected readonly store = inject(TaskStore);
  protected newTitle = '';
  protected newPriority: Priority = 'medium';
  protected newDeadline = '';

  protected readonly columns: { id: Status; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
  ];

  protected readonly priorityFilters: { id: Priority | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  protected add() {
    const deadline = this.newDeadline ? new Date(this.newDeadline).getTime() : undefined;
    this.store.add(this.newTitle, this.newPriority, deadline);
    this.newTitle = '';
    this.newDeadline = '';
  }

  protected isUrgent(task: Task): boolean {
    if (!task.deadline || task.status === 'done') return false;
    return task.deadline - Date.now() < 3 * 24 * 60 * 60 * 1000;
  }

  protected formatDeadline(task: Task): string {
    if (!task.deadline) return '';
    const diff = Math.ceil((task.deadline - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return 'Due ' + new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
