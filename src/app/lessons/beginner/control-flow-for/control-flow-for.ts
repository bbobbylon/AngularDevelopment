import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Task {
  id: number;
  label: string;
  done: boolean;
}

@Component({
  selector: 'app-lesson-control-flow-for',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Control Flow: &#64;for</h1>
      <p class="lead">
        The <code>&#64;for</code> block repeats a chunk of template for each item in
        a collection. A <code>track</code> expression is <strong>required</strong>
        so Angular can identify items efficiently across updates.
      </p>

      <h2>Basic loop with track</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:12px">
          <input #t placeholder="new task" (keyup.enter)="add(t.value); t.value=''" style="flex:1" />
          <button (click)="add(t.value); t.value=''">Add</button>
          <button class="ghost" (click)="shuffle()">Shuffle</button>
        </div>

        @for (task of tasks(); track task.id) {
          <label class="taskrow">
            <input type="checkbox" [checked]="task.done" (change)="toggle(task.id)" />
            <span [style.textDecoration]="task.done ? 'line-through' : 'none'">
              {{ task.label }}
            </span>
            <button class="ghost" (click)="remove(task.id)">✕</button>
          </label>
        } @empty {
          <p style="color:var(--text-muted)">No tasks — add one above.</p>
        }
      </div>

      <div class="code">
        <pre>&#64;for (task of tasks(); track task.id) {{ '{' }}
  &lt;li&gt;{{ '{{' }} task.label {{ '}}' }}&lt;/li&gt;
{{ '}' }} &#64;empty {{ '{' }}
  &lt;li&gt;Nothing here yet&lt;/li&gt;
{{ '}' }}</pre>
      </div>

      <div class="warn">
        <strong>track is mandatory.</strong> Use a stable unique id
        (<code>track item.id</code>). Only use <code>track $index</code> for static
        lists that never reorder. Good tracking lets Angular reuse DOM nodes
        instead of recreating them — this is the single biggest list-perf lever.
      </div>
      <p>
        For primitive arrays with no id, <code>track item</code> (the value itself) is
        fine if values are unique. For objects without an id you control, you may
        <code>track $index</code> — accepting that edits in the middle re-render rows.
        In <strong>nested</strong> loops, alias each level's variables so they don't
        collide: <code>&#64;for (row of rows; track row.id; let r = $index)</code> then an
        inner <code>&#64;for (cell of row.cells; track cell.id; let c = $index)</code>.
      </p>

      <h2>Contextual variables</h2>
      <p>Inside <code>&#64;for</code> you get handy implicit variables:</p>
      <div class="demo">
        <p class="demo__title">Live — $index, $first, $last, $even</p>
        @for (task of tasks(); track task.id; let i = $index, isFirst = $first, isLast = $last, isEven = $even) {
          <div class="meta" [class.even]="isEven">
            <span class="pill">#{{ i }}</span>
            {{ task.label }}
            @if (isFirst) { <span class="pill">first</span> }
            @if (isLast) { <span class="pill">last</span> }
          </div>
        }
      </div>

      <div class="code">
        <pre>&#64;for (item of items(); track item.id;
      let i = $index, e = $even, f = $first, l = $last, c = $count) {{ '{' }} … {{ '}' }}</pre>
      </div>

      <ul>
        <li><code>$index</code> — zero-based position</li>
        <li><code>$first</code> / <code>$last</code> — boolean edges</li>
        <li><code>$even</code> / <code>$odd</code> — parity helpers</li>
        <li><code>$count</code> — total length of the collection</li>
      </ul>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Omitting <code>track</code>.</strong> Unlike the old <code>*ngFor</code>,
          <code>track</code> is <em>required</em> — the template won't compile without it.</li>
        <li><strong><code>track $index</code> on a reorderable list.</strong> Angular then keys rows
          by position, so a sort or middle-insert re-renders and can desync form/checkbox state.
          Track a stable id instead.</li>
        <li><strong>Tracking a non-unique value.</strong> Duplicate track keys throw at runtime.
          For primitive arrays with possible dupes, fall back to <code>$index</code>.</li>
        <li><strong>Colliding aliases in nested loops.</strong> Give each level its own
          <code>let i = $index</code> alias; reusing the same name shadows the outer one.</li>
        <li><strong>Expecting <code>&#64;empty</code> to fire on <code>null</code>.</strong> It renders
          for an empty iterable; a <code>null</code>/<code>undefined</code> collection errors — default
          to <code>[]</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why is <code>track</code> mandatory in <code>&#64;for</code>?</summary>
        <div>It lets Angular match items to DOM nodes across updates and reuse them instead of
        recreating. Because it's central to correctness and perf, the compiler requires it.</div>
      </details>
      <details class="qa">
        <summary>When is <code>track $index</code> acceptable?</summary>
        <div>For static lists that never reorder or filter in the middle, or primitive arrays with
        duplicate values where no stable id exists.</div>
      </details>
      <details class="qa">
        <summary>What renders when the collection is empty?</summary>
        <div>The optional <code>&#64;empty</code> block. It fires only for an empty iterable — not for
        <code>null</code>, which throws.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;for (x of xs; track x.id)</code> repeats a template — track is required.</li>
        <li><code>&#64;empty</code> renders when the collection is empty.</li>
        <li>Implicit vars (<code>$index</code>, <code>$first</code>, …) are aliased with <code>let</code>.</li>
        <li>Track a stable id for reorderable lists; <code>$index</code> only for static ones.</li>
      </ul>

      <p><a routerLink="/control-flow-switch">Next: Control Flow — &#64;switch →</a></p>
    </article>
  `,
  styles: [
    `
      .taskrow {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0;
      }
      .taskrow span {
        flex: 1;
      }
      .meta {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
      }
      .meta.even {
        background: var(--bg-elevated);
      }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class ControlFlowFor {
  private nextId = 4;
  protected readonly tasks = signal<Task[]>([
    { id: 1, label: 'Learn @if', done: true },
    { id: 2, label: 'Learn @for', done: false },
    { id: 3, label: 'Learn @switch', done: false },
  ]);

  protected add(label: string) {
    const l = label.trim();
    if (l) {
      this.tasks.update((t) => [...t, { id: this.nextId++, label: l, done: false }]);
    }
  }

  protected toggle(id: number) {
    this.tasks.update((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  protected remove(id: number) {
    this.tasks.update((t) => t.filter((x) => x.id !== id));
  }

  protected shuffle() {
    this.tasks.update((t) => [...t].sort(() => Math.random() - 0.5));
  }
}
