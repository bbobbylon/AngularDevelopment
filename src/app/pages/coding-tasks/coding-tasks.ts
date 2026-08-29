import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CODING_TASKS, type CodingTask } from './coding-tasks-data';
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';

/** Everything remembered about one brief. Persisted; see {@link loadStates}. */
interface TaskState {
  /** One flag per requirement, positional against `CodingTask.requirements`. */
  checks: boolean[];
  /** How many hints have been revealed, as a prefix count — hints are strictly
   *  ordered, so a count is enough and a set would allow nonsense states. */
  hintsShown: number;
  /** Whether the model solution has been shown. */
  revealed: boolean;
  /** Whether the brief is marked complete. Gated on every check — see
   *  {@link CodingTasks.toggleCheck}. */
  done: boolean;
}

/** State by task id. Sparse: a brief never opened has no entry. */
type TaskStates = Record<number, TaskState>;

/**
 * Reads per-task completion state.
 *
 * Also read by the Exam-Day page (which needs the done-count for its readiness
 * verdict) and the Progress dashboard, both via the same shared key.
 *
 * @returns Stored task states, or `{}` when absent/unavailable/corrupt.
 */
function loadStates(): TaskStates {
  return readJson<TaskStates>(STORAGE_KEYS.codingTasks, {});
}

/**
 * Persists per-task completion state.
 *
 * @param states The complete state map to store.
 */
function saveStates(states: TaskStates): void {
  writeJson(STORAGE_KEYS.codingTasks, states);
}

/**
 * Coding-Task Simulator — the hands-on companion to the Practice page.
 *
 * Mirrors the certificates.dev **practical** exam: a timeboxed brief you
 * implement in your own editor, then verify against a requirements checklist
 * and a model solution. The app deliberately does not try to be an editor —
 * there is no in-browser runtime here, because the exam is sat in a real
 * project and practising in a toy sandbox trains the wrong reflexes.
 *
 * ## Flow
 *
 * Task list → workspace. The workspace holds the scenario, starter code to copy
 * into a scratch project, a self-check list (one box per acceptance criterion),
 * progressive hints revealed one at a time, and a collapsed model solution.
 *
 * ## Why completion is gated
 *
 * "Mark complete" unlocks only once **every** requirement is checked, and
 * unchecking one silently un-completes the brief. Self-reported completion
 * would be worthless on its own — but the Exam-Day readiness check treats these
 * counts as one of its two pass bars, so the number has to mean something. The
 * checklist is what makes it a rubric rather than a mood.
 *
 * Hints are revealed one at a time for the same reason: a brief solved by
 * opening the model solution should be visibly different from one that was not.
 *
 * @see pages/coding-tasks/coding-tasks-data.ts — the brief bank.
 * @see pages/exam-day/exam-day.ts — reads this page's completion state.
 */
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
  /** The brief bank, rendered as the task list. */
  readonly tasks = CODING_TASKS;

  /** Per-task state, seeded from storage and written back by the constructor's
   *  effect. Private: every mutation goes through {@link patch}. */
  private readonly states = signal<TaskStates>(loadStates());

  /** The open brief, or `null` for the list. Doubles as the router-free
   *  "which view" flag — the workspace is not a separate route, so an open
   *  brief is not restored across a reload. */
  readonly selected = signal<CodingTask | null>(null);
  /** Transient "copied!" feedback on the starter-code button. */
  readonly copied = signal(false);

  /** Briefs marked complete — the figure Exam Day's second pass bar reads. */
  readonly completedCount = computed(() =>
    this.tasks.filter((t) => this.states()[t.id]?.done).length,
  );

  /**
   * Mirrors {@link states} to storage on every change.
   *
   * An `effect` rather than a save call in each mutator: there are six of them,
   * and one forgotten call would lose a user's checklist without any visible
   * symptom until they came back.
   */
  constructor() {
    effect(() => saveStates(this.states()));
  }

  /**
   * State for a brief, or a fresh blank one. Never returns `undefined`, so the
   * template and every mutator can read fields without guarding.
   *
   * @param id The brief's id.
   */
  stateOf(id: number): TaskState {
    return (
      this.states()[id] ?? { checks: [], hintsShown: 0, revealed: false, done: false }
    );
  }

  /**
   * Opens a brief's workspace, clearing any stale "copied!" flash from the
   * previously open one.
   *
   * @param task The brief to open.
   */
  open(task: CodingTask): void {
    this.copied.set(false);
    this.selected.set(task);
  }

  /** Returns to the task list. Nothing is discarded — state is per-task and
   *  already persisted. */
  close(): void {
    this.selected.set(null);
  }

  /**
   * How many requirements are ticked, for the `3 / 5` counter.
   *
   * @param task The brief.
   */
  checkedCount(task: CodingTask): number {
    return this.stateOf(task.id).checks.filter(Boolean).length;
  }

  /**
   * The hints revealed so far — a prefix of the brief's hint list, since hints
   * go from nudge to near-solution and are only useful in order.
   *
   * @param task The brief.
   */
  visibleHints(task: CodingTask): string[] {
    return task.hints.slice(0, this.stateOf(task.id).hintsShown);
  }

  /**
   * Toggles one requirement.
   *
   * Rebuilds the flag array from `task.requirements` rather than mutating the
   * stored one, so a brief whose requirements were edited after the user last
   * touched it re-aligns instead of carrying a stale-length array.
   *
   * Unchecking also clears `done`: completion is defined as "every box ticked",
   * so a completed brief with an unticked box would be an unreachable state
   * that Exam Day would still count.
   *
   * @param task  The brief.
   * @param index Which requirement to toggle.
   */
  toggleCheck(task: CodingTask, index: number): void {
    const cur = this.stateOf(task.id);
    const checks = task.requirements.map((_, i) => (i === index ? !cur.checks[i] : !!cur.checks[i]));
    // Unchecking a requirement also un-completes the task — the rubric no longer passes.
    const done = cur.done && checks.every(Boolean);
    this.patch(task.id, { checks, done });
  }

  /**
   * Reveals the next hint, if any are left.
   *
   * @param task The brief.
   */
  showHint(task: CodingTask): void {
    const cur = this.stateOf(task.id);
    if (cur.hintsShown < task.hints.length) {
      this.patch(task.id, { hintsShown: cur.hintsShown + 1 });
    }
  }

  /**
   * Reveals the model solution. Persisted rather than transient, so the fact
   * that it was consulted survives a reload.
   *
   * @param task The brief.
   */
  reveal(task: CodingTask): void {
    this.patch(task.id, { revealed: true });
  }

  /**
   * Marks a brief complete or not. The button is disabled in the template until
   * every requirement is ticked.
   *
   * @param task The brief.
   * @param done The new completion state.
   */
  setDone(task: CodingTask, done: boolean): void {
    this.patch(task.id, { done });
  }

  /**
   * Copies the starter code to the clipboard and flashes a confirmation.
   *
   * Wrapped in a `try` because the Clipboard API is absent under SSR and
   * blocked without permission in some contexts. Failure is silent by design:
   * the code block is selectable, so the user can still copy it by hand, and an
   * error toast would be noise about something they can already do.
   *
   * @param task The brief whose starter code to copy.
   */
  copyStarter(task: CodingTask): void {
    try {
      void navigator.clipboard?.writeText(task.starterCode);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // clipboard unavailable (permissions/SSR) — the code is still selectable
    }
  }

  /**
   * Merges a partial update into one brief's state, immutably — the signal is
   * only notified by a new object identity, and the persistence effect only
   * runs when it is.
   *
   * @param id      The brief to update.
   * @param partial Fields to overwrite.
   */
  private patch(id: number, partial: Partial<TaskState>): void {
    this.states.update((s) => ({ ...s, [id]: { ...this.stateOf(id), ...partial } }));
  }
}
