import { Component, OnDestroy, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CHALLENGES, shuffle, type Challenge } from '../practice/practice-data';
import { OptionsShuffler } from '../practice/practice-helpers';
import { recordMisses } from '../practice/review-queue';
import { CODING_TASKS, type CodingTask } from '../coding-tasks/coding-tasks-data';
import { downloadTextFile } from '../../shared/download-file';
import { STORAGE_KEYS, readJson, removeKey, writeJson } from '../../core/storage';

/** Which leg of the readiness check is on screen. See {@link ExamDay}. */
type Phase = 'idle' | 'exam' | 'tasks' | 'result';

/** Questions in the timed leg. Sized to be a real sitting, not a quiz. */
const EXAM_QUESTIONS = 20;

/** Per-question budget. The clock is a single pooled total, not per question,
 *  so time saved on an easy one is time available for a hard one. */
const SECONDS_PER_QUESTION = 90;

/** Percentage needed on the exam leg to clear that bar. */
const PASS_MARK = 70;

/** Briefs assigned per check, both of which must be completed. */
const TASKS_REQUIRED = 2;

/** Keep only the most recent readiness checks so storage stays bounded. */
const HISTORY_LIMIT = 10;

/** A check whose exam is finished but whose coding tasks are still pending. */
interface ActiveCheck {
  /** When the exam leg finished — the check's clock starts here, not at start. */
  startedAt: number;
  /** The exam leg's frozen outcome. Not recomputed on resume. */
  exam: { scorePercent: number; correct: number; total: number };
  /** The two assigned briefs, by {@link CodingTask} id. */
  taskIds: number[];
}

/** One completed readiness check — what the verdict history and dashboard show. */
export interface ReadinessResult {
  /** Epoch ms of the verdict. */
  when: number;
  /** Exam leg percentage. */
  examScore: number;
  /** Correct answers on the exam leg. */
  examCorrect: number;
  /** Questions asked on the exam leg. */
  examTotal: number;
  /** Assigned briefs completed at verdict time. */
  tasksDone: number;
  /** Assigned briefs, i.e. {@link TASKS_REQUIRED}. */
  tasksTotal: number;
  /** The verdict: both bars cleared. */
  ready: boolean;
}

/** Ids of coding tasks marked complete in the Coding-Task Simulator's store. */
function loadDoneTaskIds(): Set<number> {
  const states = readJson<Record<number, { done?: boolean }>>(STORAGE_KEYS.codingTasks, {});
  return new Set(
    Object.entries(states)
      .filter(([, s]) => s.done)
      .map(([id]) => Number(id)),
  );
}

/**
 * Assign the two briefs for a check: one mid + one senior, preferring tasks
 * not yet completed so the check exercises something new. Falls back to the
 * whole bank when everything is done.
 */
function pickTaskIds(doneIds: Set<number>): number[] {
  const notDone = CODING_TASKS.filter((t) => !doneIds.has(t.id));
  const pool = notDone.length >= TASKS_REQUIRED ? notDone : CODING_TASKS;
  const picks: CodingTask[] = [];
  const mid = shuffle(pool.filter((t) => t.difficulty === 'mid'))[0];
  const senior = shuffle(pool.filter((t) => t.difficulty === 'senior'))[0];
  if (mid) picks.push(mid);
  if (senior) picks.push(senior);
  for (const t of shuffle(pool)) {
    if (picks.length >= TASKS_REQUIRED) break;
    if (!picks.some((p) => p.id === t.id)) picks.push(t);
  }
  return picks.slice(0, TASKS_REQUIRED).map((t) => t.id);
}

/**
 * Formats a countdown as `m:ss`, clamped at zero so a late timer tick can never
 * render a negative clock.
 *
 * @param totalSeconds Seconds remaining.
 */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

/**
 * Exam-Day Readiness Check — the closest simulation of the real certification
 * sitting, and the only page in the app that answers "am I ready?" with a
 * single yes or no.
 *
 * Every other study tool measures one thing. This one chains two legs into
 * ONE sitting and issues a combined verdict, because passing a multiple-choice
 * exam and being able to build something are different skills and a
 * certification asks for both.
 *
 * ## Four phases
 *
 * - **`idle`** — the format, past verdicts, and start/resume.
 * - **`exam`** — a timed run over the shared challenge bank: sequential
 *   questions, a countdown, **no feedback**, auto-submit at zero. Misses feed
 *   the spaced-repetition queue like everywhere else in the app.
 * - **`tasks`** — two build briefs assigned from the coding-task bank (one mid,
 *   one senior, preferring ones not yet completed). They are done over in the
 *   Coding-Task Simulator, which owns completion; this phase only *reads* that
 *   store and re-checks it on demand.
 * - **`result`** — the verdict: exam >= {@link PASS_MARK} **and** both briefs
 *   completed. Both bars, not an average — a strong exam cannot carry an
 *   unfinished brief.
 *
 * ## What persists, and why the asymmetry is deliberate
 *
 * The in-between state (exam done, briefs pending) is written to storage, so
 * navigating to `/coding-tasks` to actually do the work and coming back
 * resumes the check rather than discarding it.
 *
 * An exam abandoned **mid-run** is deliberately *not* persisted. On the real
 * exam day you cannot pause the clock, and a resumable timer would turn the
 * one honest measurement in the app into an untimed one.
 *
 * @see pages/coding-tasks/coding-tasks.ts — owns brief completion.
 * @see pages/practice/review-queue.ts — receives this exam's misses.
 * @see core/storage.ts — the key registry and the read/write helpers.
 */
@Component({
  selector: 'app-exam-day',
  imports: [RouterLink, DatePipe],
  styleUrl: './exam-day.css',
  templateUrl: './exam-day.html',
})
export class ExamDay implements OnDestroy {
  /** Per-sitting option shuffling, reset when a new exam starts. */
  private readonly shuffler = new OptionsShuffler();

  /** Handle for the countdown interval; `null` when no exam is running. */
  private timerId: ReturnType<typeof setInterval> | null = null;

  /** Task lookup by id, built once — the assigned-brief list resolves through
   *  this on every change-detection pass. */
  private readonly taskById = new Map<number, CodingTask>(CODING_TASKS.map((t) => [t.id, t]));

  /** Option labels, indexed by position. */
  readonly letters = ['A', 'B', 'C', 'D'];

  /** {@link PASS_MARK}, exposed so the template states the bar it is judging by. */
  readonly passMark = PASS_MARK;

  /** {@link EXAM_QUESTIONS}, for the template. */
  readonly examQuestions = EXAM_QUESTIONS;

  /** The time budget in whole minutes, for the "20 questions in 30 minutes"
   *  blurb. Derived rather than written down so the two cannot drift. */
  readonly examMinutes = Math.round((EXAM_QUESTIONS * SECONDS_PER_QUESTION) / 60);

  /** {@link TASKS_REQUIRED}, for the template. */
  readonly tasksRequired = TASKS_REQUIRED;

  /** Which phase is on screen. */
  readonly phase = signal<Phase>('idle');
  /**
   * The resumable check, seeded from storage. Non-null on load means a previous
   * visit finished an exam and left briefs pending — the idle screen offers to
   * resume rather than silently starting over.
   */
  readonly active = signal<ActiveCheck | null>(
    readJson<ActiveCheck | null>(STORAGE_KEYS.examDayActive, null),
  );

  /** Past verdicts, newest first, capped at {@link HISTORY_LIMIT}. */
  readonly history = signal<ReadinessResult[]>(
    readJson<ReadinessResult[]>(STORAGE_KEYS.examDayHistory, []),
  );

  /** The verdict on the result screen. In-memory only; {@link history} is the
   *  durable record. */
  readonly lastResult = signal<ReadinessResult | null>(null);

  // --- exam leg state (in-memory only; abandoning mid-exam forfeits it) ---
  /** The drawn questions, in presentation order. */
  readonly questions = signal<Challenge[]>([]);

  /** Position within {@link questions}. Free to move both ways — see {@link prev}. */
  readonly index = signal(0);

  /** Chosen option index by challenge id. Keyed by id, not position, so it
   *  survives any future reordering of the drawn set. */
  readonly answers = signal<Record<number, number>>({});

  /** Countdown remaining, ticked once a second by {@link startTimer}. */
  readonly secondsLeft = signal(0);

  /** The question on screen. */
  readonly current = computed(() => this.questions()[this.index()]);

  /** {@link secondsLeft} as `m:ss`. */
  readonly timeLabel = computed(() => formatClock(this.secondsLeft()));

  // --- tasks leg state ---
  /** Completion set read from the Coding-Task Simulator's store. */
  readonly doneTaskIds = signal<Set<number>>(loadDoneTaskIds());
  /** The two assigned briefs, resolved from {@link ActiveCheck.taskIds}. Empty
   *  when no check is active. Unknown ids are dropped rather than rendered as
   *  holes, so removing a task from the bank cannot break an in-flight check. */
  readonly assignedTasks = computed(() => {
    const check = this.active();
    if (!check) return [];
    return check.taskIds.map((id) => this.taskById.get(id)).filter((t): t is CodingTask => !!t);
  });
  /** How many of the assigned briefs are complete — the second pass bar. */
  readonly assignedDoneCount = computed(
    () => this.assignedTasks().filter((t) => this.doneTaskIds().has(t.id)).length,
  );

  // --- flow ---
  /**
   * Starts the exam leg: draws a fresh random set, clears any previous answers,
   * and starts the clock.
   */
  startCheck(): void {
    const qs = shuffle(CHALLENGES).slice(0, EXAM_QUESTIONS);
    this.shuffler.reset();
    this.questions.set(qs);
    this.answers.set({});
    this.index.set(0);
    this.secondsLeft.set(qs.length * SECONDS_PER_QUESTION);
    this.phase.set('exam');
    this.startTimer();
  }

  /**
   * Ends the exam leg, scores it, and moves to the briefs.
   *
   * Guarded because the countdown hitting zero and the user clicking "Finish"
   * can happen in the same tick; without the guard the check would be scored
   * twice and two `ActiveCheck`s written.
   *
   * Only answered-but-wrong questions go to the review queue. A question left
   * blank because the clock ran out says nothing about whether the topic is
   * understood, and queueing it would pollute the schedule with time-management
   * failures.
   */
  finishExam(): void {
    if (this.phase() !== 'exam') return; // timer + button can race; run once
    this.stopTimer();

    const qs = this.questions();
    const correct = qs.filter((ch) => this.isCorrect(ch)).length;
    const scorePercent = qs.length === 0 ? 0 : Math.round((correct / qs.length) * 100);

    // Answered-but-wrong questions feed the review queue, same as the mock exam.
    const missed = qs
      .filter((ch) => this.answers()[ch.id] !== undefined && !this.isCorrect(ch))
      .map((ch) => ch.id);
    recordMisses(missed);

    const check: ActiveCheck = {
      startedAt: Date.now(),
      exam: { scorePercent, correct, total: qs.length },
      taskIds: pickTaskIds(loadDoneTaskIds()),
    };
    this.active.set(check);
    writeJson(STORAGE_KEYS.examDayActive, check);
    this.refreshTaskStatus();
    this.phase.set('tasks');
  }

  /**
   * Picks a persisted check back up at the briefs leg, re-reading completion
   * from the Coding-Task Simulator first — the whole point of leaving is to go
   * do them.
   */
  resume(): void {
    if (!this.active()) return;
    this.refreshTaskStatus();
    this.phase.set('tasks');
  }

  /**
   * Discards the pending check without recording a verdict. No history entry:
   * an abandoned check is not a failed one.
   */
  abandon(): void {
    this.active.set(null);
    removeKey(STORAGE_KEYS.examDayActive);
    this.phase.set('idle');
  }

  /**
   * Re-reads brief completion from the Coding-Task Simulator's store.
   *
   * Polled on demand rather than watched, because that store is plain
   * localStorage rather than a reactive service — and the user has to
   * physically come back to this tab to press the button anyway.
   */
  refreshTaskStatus(): void {
    this.doneTaskIds.set(loadDoneTaskIds());
  }

  /**
   * Issues the verdict and closes the check.
   *
   * `ready` requires **both** bars — exam at or above {@link PASS_MARK} *and*
   * every assigned brief completed. Deliberately not an average: the two legs
   * measure different skills, so a strong exam must not compensate for a brief
   * that was never finished.
   *
   * Clears the active check, so the verdict is final and the next check starts
   * from scratch.
   */
  evaluate(): void {
    const check = this.active();
    if (!check) return;
    this.refreshTaskStatus();

    const result: ReadinessResult = {
      when: Date.now(),
      examScore: check.exam.scorePercent,
      examCorrect: check.exam.correct,
      examTotal: check.exam.total,
      tasksDone: this.assignedDoneCount(),
      tasksTotal: check.taskIds.length,
      ready:
        check.exam.scorePercent >= PASS_MARK && this.assignedDoneCount() >= check.taskIds.length,
    };

    const next = [result, ...this.history()].slice(0, HISTORY_LIMIT);
    this.history.set(next);
    writeJson(STORAGE_KEYS.examDayHistory, next);

    this.active.set(null);
    removeKey(STORAGE_KEYS.examDayActive);
    this.lastResult.set(result);
    this.phase.set('result');
  }

  /** Returns to the dashboard from the result screen. */
  backToIdle(): void {
    this.phase.set('idle');
  }

  /** Downloads a Markdown summary of the readiness check just evaluated — verdict, both legs, and the exam leg's per-question review. */
  exportResults(r: ReadinessResult): void {
    const when = r.when;
    const lines: string[] = [];

    lines.push(`# Exam-Day Readiness Check — ${new Date(when).toLocaleString()}`, '');
    lines.push(
      `**Verdict:** ${r.ready ? 'READY' : 'NOT YET'} (pass bar: exam ≥ ${this.passMark}% and ${this.tasksRequired}/${this.tasksRequired} briefs completed)`,
    );
    lines.push(`**Timed exam:** ${r.examScore}% (${r.examCorrect}/${r.examTotal})`);
    lines.push(`**Build briefs:** ${r.tasksDone}/${r.tasksTotal} completed`, '');

    const tasks = this.assignedTasks();
    if (tasks.length > 0) {
      lines.push('## Assigned briefs', '');
      for (const task of tasks) {
        lines.push(
          `- ${this.doneTaskIds().has(task.id) ? '✅' : '⬜'} ${task.title} (${task.difficulty}, ${task.category})`,
        );
      }
      lines.push('');
    }

    const qs = this.questions();
    if (qs.length > 0) {
      lines.push('## Exam leg — question review', '');
      qs.forEach((ch, i) => {
        const shuffled = this.shuffledOptions(ch);
        const ok = this.isCorrect(ch);
        const answered = this.answers()[ch.id] !== undefined;
        lines.push(
          `### Q${i + 1} — ${ch.category} · ${ch.difficulty} — ${ok ? '✓ Correct' : answered ? '✗ Incorrect' : '⚠ Not answered'}`,
        );
        lines.push(ch.question);
        if (ch.code) lines.push('', '```', ch.code, '```');
        lines.push('');
        shuffled.options.forEach((opt, idx) => {
          const marks = [
            idx === shuffled.correctIndex ? 'correct' : null,
            this.answers()[ch.id] === idx ? 'your answer' : null,
          ].filter(Boolean);
          const tag = marks.length ? ` (${marks.join(', ')})` : '';
          lines.push(`- ${this.letters[idx]}) ${opt}${tag}`);
        });
        lines.push('', `Explanation: ${ch.explanation}`, '');
      });
    }

    const stamp = new Date(when).toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadTextFile(`exam-day-results_${stamp}.md`, lines.join('\n'));
  }

  // --- exam leg interactions ---
  /**
   * Records an answer. Freely changeable until the leg is submitted, and never
   * graded on the spot — this leg gives no feedback.
   *
   * @param ch          The question.
   * @param optionIndex Index into the *shuffled* options.
   */
  choose(ch: Challenge, optionIndex: number): void {
    this.answers.update((a) => ({ ...a, [ch.id]: optionIndex }));
  }

  /** Moves forward one question, stopping at the last. */
  next(): void {
    if (this.index() < this.questions().length - 1) this.index.update((i) => i + 1);
  }

  /**
   * Moves back one question, stopping at the first. Backwards navigation is
   * allowed on purpose — the real exam lets you revisit answers.
   */
  prev(): void {
    if (this.index() > 0) this.index.update((i) => i - 1);
  }

  /**
   * This sitting's option order for a question, plus where the correct answer
   * landed. Stable for the sitting, so revisiting a question does not reshuffle
   * it under an already-recorded answer.
   *
   * @param ch The question.
   */
  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  /**
   * Whether a question was answered correctly. Compares against the *shuffled*
   * correct index, not `ch.answer`, because the recorded answer is a position
   * in the shuffled list.
   *
   * @param ch The question.
   */
  private isCorrect(ch: Challenge): boolean {
    const sel = this.answers()[ch.id];
    return sel !== undefined && sel === this.shuffledOptions(ch).correctIndex;
  }

  /**
   * Starts the one-second countdown, auto-submitting at zero.
   *
   * Stops any existing timer first so a double start cannot leave two intervals
   * running and burn the clock at double speed.
   */
  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      const left = this.secondsLeft() - 1;
      if (left <= 0) {
        this.secondsLeft.set(0);
        this.finishExam();
      } else {
        this.secondsLeft.set(left);
      }
    }, 1000);
  }

  /** Clears the countdown if one is running. Safe to call repeatedly. */
  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** Clears the countdown on teardown so navigating away mid-exam cannot leave
   *  an interval ticking against a destroyed component. */
  ngOnDestroy(): void {
    this.stopTimer();
  }
}
