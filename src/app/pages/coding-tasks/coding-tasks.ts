import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CODING_TASKS, type CodingTask } from './coding-tasks-data';
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { Napkin, TapeCard } from '../../shared/brain';

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
  imports: [RouterLink, RevealOnScrollDirective, TapeCard, Napkin],
  styleUrl: './coding-tasks.css',
  templateUrl: './coding-tasks.html',
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
  readonly completedCount = computed(
    () => this.tasks.filter((t) => this.states()[t.id]?.done).length,
  );

  /** Briefs not yet marked complete — presentational only, drives the hero
   *  stat row's "Remaining" tile. Nothing reads this but the template. */
  readonly remainingCount = computed(() => this.tasks.length - this.completedCount());

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
    return this.states()[id] ?? { checks: [], hintsShown: 0, revealed: false, done: false };
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
    const checks = task.requirements.map((_, i) =>
      i === index ? !cur.checks[i] : !!cur.checks[i],
    );
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
