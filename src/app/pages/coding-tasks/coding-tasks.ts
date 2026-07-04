import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CODING_TASKS, type CodingTask } from './coding-tasks-data';

/**
 * Coding-Task Simulator — the hands-on companion to the Practice page,
 * mirroring the certificates.dev PRACTICAL exam format: a timeboxed brief you
 * implement in your own editor, then verify against a requirements checklist
 * and a model solution.
 *
 * Flow: task list → workspace. The workspace shows the scenario, starter code
 * (to copy into a scratch project), a self-check checklist (one box per
 * acceptance criterion), progressive hints (revealed one at a time), and a
 * collapsed model solution + explanation. "Mark complete" unlocks once every
 * requirement is checked.
 *
 * Per-task state (checked boxes, hints revealed, solution revealed, completed)
 * persists to localStorage with the same SSR-safe pattern as the Practice
 * progress store. Task content lives in `./coding-tasks-data.ts`.
 */
interface TaskState {
  checks: boolean[];
  hintsShown: number;
  revealed: boolean;
  done: boolean;
}

type TaskStates = Record<number, TaskState>;

const STORAGE_KEY = 'angular-coding-tasks-v1';

function loadStates(): TaskStates {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaskStates) : {};
  } catch {
    return {};
  }
}

function saveStates(states: TaskStates): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch {
    // ignore — storage full or blocked
  }
}

@Component({
  selector: 'app-coding-tasks',
  imports: [RouterLink],
  styles: [`
    .ct-hero { text-align: center; padding: 48px 24px 24px; }
    .ct-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .ct-hero p { max-width: 640px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }
    .done-line { font-size: .9rem; font-weight: 600; margin: 16px 0 0; }

    .task-grid { max-width: 900px; margin: 24px auto 60px; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .task-card { text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 20px; cursor: pointer; color: var(--text); display: flex; flex-direction: column; gap: 10px; }
    .task-card:hover { border-color: #6366f1; }
    .task-card.completed { border-color: #22c55e; }
    .task-card h3 { margin: 0; font-size: 1rem; line-height: 1.4; }
    .card-badges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-cat { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(99,102,241,.1); border: 1px solid #6366f1; color: #6366f1; }
    .badge-time { font-size: .72rem; color: var(--text-muted); margin-left: auto; }
    .done-tick { font-size: .8rem; font-weight: 600; color: #16a34a; margin-top: auto; }

    .workspace { max-width: 860px; margin: 0 auto 60px; padding: 0 24px; }
    .ws-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .back-btn { padding: 7px 16px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .86rem; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px 26px; margin-bottom: 16px; }
    .panel h2 { margin: 0 0 10px; font-size: 1.3rem; }
    .panel h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin: 0 0 10px; }
    .scenario { font-size: .94rem; line-height: 1.65; margin: 0; }
    .code-block { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .8rem; font-family: monospace; white-space: pre-wrap; overflow-x: auto; margin: 0; }
    .copy-btn { margin-top: 10px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .82rem; }

    .req { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; font-size: .9rem; line-height: 1.5; cursor: pointer; }
    .req input { margin-top: 3px; accent-color: #22c55e; width: 16px; height: 16px; flex-shrink: 0; }
    .req.checked { color: var(--text-muted); text-decoration: line-through; }
    .req-progress { font-size: .82rem; color: var(--text-muted); margin: 8px 0 0; }

    .hint { background: rgba(99,102,241,.06); border: 1px dashed #6366f1; border-radius: 10px; padding: 10px 14px; font-size: .87rem; line-height: 1.5; margin: 0 0 10px; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }
    .primary-btn { padding: 10px 22px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: .92rem; font-weight: 600; }
    .primary-btn:disabled { opacity: .5; cursor: default; }
    .primary-btn.done { background: #22c55e; }
    .explanation { font-size: .88rem; line-height: 1.6; color: var(--text-muted); margin: 14px 0 0; }
    .topic-link { display: inline-block; margin-top: 10px; font-size: .82rem; color: var(--blue); text-decoration: underline; }
    .ws-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .complete-note { font-size: .82rem; color: var(--text-muted); }
  `],
  template: `
    @if (!selected()) {
      <div class="ct-hero">
        <span class="pill">Practical Exam Prep</span>
        <h1>Coding-Task Simulator</h1>
        <p>
          Timeboxed build briefs in the style of the practical exam. Copy the
          starter into a scratch project, implement against the requirements,
          then verify yourself with the checklist and model solution.
        </p>
        <p class="done-line">{{ completedCount() }} / {{ tasks.length }} tasks completed</p>
      </div>

      <div class="task-grid">
        @for (task of tasks; track task.id) {
          <button class="task-card" [class.completed]="stateOf(task.id).done" (click)="open(task)">
            <div class="card-badges">
              <span class="badge-diff {{ task.difficulty }}">{{ task.difficulty }}</span>
              <span class="badge-cat">{{ task.category }}</span>
              <span class="badge-time">⏱ {{ task.timeboxMinutes }} min</span>
            </div>
            <h3>{{ task.title }}</h3>
            @if (stateOf(task.id).done) {
              <span class="done-tick">✓ Completed</span>
            }
          </button>
        }
      </div>
    } @else {
      @if (selected(); as task) {
        <div class="workspace" style="padding-top:32px">
          <div class="ws-top">
            <button class="back-btn" (click)="close()">← All tasks</button>
            <span class="badge-diff {{ task.difficulty }}">{{ task.difficulty }}</span>
            <span class="badge-cat">{{ task.category }}</span>
            <span class="badge-time">⏱ suggested timebox: {{ task.timeboxMinutes }} min</span>
          </div>

          <div class="panel">
            <h2>{{ task.title }}</h2>
            <p class="scenario">{{ task.scenario }}</p>
          </div>

          <div class="panel">
            <h3>Starter code — copy into a scratch project</h3>
            <pre class="code-block">{{ task.starterCode }}</pre>
            <button class="copy-btn" (click)="copyStarter(task)">
              {{ copied() ? '✓ Copied' : '📋 Copy starter code' }}
            </button>
          </div>

          <div class="panel">
            <h3>Requirements — check each one off as you verify it</h3>
            @for (req of task.requirements; track $index) {
              <label class="req" [class.checked]="stateOf(task.id).checks[$index]">
                <input type="checkbox"
                  [checked]="stateOf(task.id).checks[$index]"
                  (change)="toggleCheck(task, $index)" />
                <span>{{ req }}</span>
              </label>
            }
            <p class="req-progress">{{ checkedCount(task) }} / {{ task.requirements.length }} verified</p>
          </div>

          <div class="panel">
            <h3>Hints</h3>
            @for (hint of visibleHints(task); track $index) {
              <p class="hint">💡 {{ hint }}</p>
            }
            @if (stateOf(task.id).hintsShown < task.hints.length) {
              <button class="ghost-btn" (click)="showHint(task)">
                Reveal hint {{ stateOf(task.id).hintsShown + 1 }} of {{ task.hints.length }}
              </button>
            } @else if (task.hints.length > 0) {
              <p class="complete-note">All hints revealed.</p>
            }
          </div>

          <div class="panel">
            <h3>Model solution</h3>
            @if (!stateOf(task.id).revealed) {
              <p class="complete-note" style="margin:0 0 10px">
                Attempt the task before peeking — recall is the whole workout.
              </p>
              <button class="ghost-btn" (click)="reveal(task)">Reveal solution</button>
            } @else {
              <pre class="code-block">{{ task.solutionCode }}</pre>
              <p class="explanation">{{ task.explanation }}</p>
              @if (task.topicPath) {
                <a [routerLink]="'/' + task.topicPath" target="_blank" class="topic-link">
                  📚 Study this topic in detail →
                </a>
              }
            }
          </div>

          <div class="ws-actions">
            @if (stateOf(task.id).done) {
              <button class="primary-btn done" (click)="setDone(task, false)">✓ Completed — click to undo</button>
            } @else {
              <button class="primary-btn"
                [disabled]="checkedCount(task) < task.requirements.length"
                (click)="setDone(task, true)">
                Mark complete
              </button>
              @if (checkedCount(task) < task.requirements.length) {
                <span class="complete-note">Verify all requirements to complete the task.</span>
              }
            }
          </div>
        </div>
      }
    }
  `,
})
export class CodingTasks {
  readonly tasks = CODING_TASKS;

  private readonly states = signal<TaskStates>(loadStates());
  readonly selected = signal<CodingTask | null>(null);
  /** Transient "copied!" feedback on the starter-code button. */
  readonly copied = signal(false);

  readonly completedCount = computed(() =>
    this.tasks.filter((t) => this.states()[t.id]?.done).length,
  );

  constructor() {
    effect(() => saveStates(this.states()));
  }

  stateOf(id: number): TaskState {
    return (
      this.states()[id] ?? { checks: [], hintsShown: 0, revealed: false, done: false }
    );
  }

  open(task: CodingTask): void {
    this.copied.set(false);
    this.selected.set(task);
  }

  close(): void {
    this.selected.set(null);
  }

  checkedCount(task: CodingTask): number {
    return this.stateOf(task.id).checks.filter(Boolean).length;
  }

  visibleHints(task: CodingTask): string[] {
    return task.hints.slice(0, this.stateOf(task.id).hintsShown);
  }

  toggleCheck(task: CodingTask, index: number): void {
    const cur = this.stateOf(task.id);
    const checks = task.requirements.map((_, i) => (i === index ? !cur.checks[i] : !!cur.checks[i]));
    // Unchecking a requirement also un-completes the task — the rubric no longer passes.
    const done = cur.done && checks.every(Boolean);
    this.patch(task.id, { checks, done });
  }

  showHint(task: CodingTask): void {
    const cur = this.stateOf(task.id);
    if (cur.hintsShown < task.hints.length) {
      this.patch(task.id, { hintsShown: cur.hintsShown + 1 });
    }
  }

  reveal(task: CodingTask): void {
    this.patch(task.id, { revealed: true });
  }

  setDone(task: CodingTask, done: boolean): void {
    this.patch(task.id, { done });
  }

  copyStarter(task: CodingTask): void {
    try {
      void navigator.clipboard?.writeText(task.starterCode);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // clipboard unavailable (permissions/SSR) — the code is still selectable
    }
  }

  private patch(id: number, partial: Partial<TaskState>): void {
    this.states.update((s) => ({ ...s, [id]: { ...this.stateOf(id), ...partial } }));
  }
}
