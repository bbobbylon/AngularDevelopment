import { Component, OnDestroy, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CHALLENGES, shuffle, type Challenge } from '../practice/practice-data';
import { OptionsShuffler } from '../practice/practice-helpers';
import { recordMisses } from '../practice/review-queue';
import { CODING_TASKS, type CodingTask } from '../coding-tasks/coding-tasks-data';

/**
 * Exam-Day Readiness Check — the closest simulation of the real certification
 * sitting: ONE flow that chains a timed 20-question mixed exam with two
 * assigned coding-task briefs, then issues a single READY / NOT YET verdict.
 *
 * Four-phase state machine:
 *   - `idle`   — explains the format, shows past verdicts, offers start/resume.
 *   - `exam`   — a compact timed run over the shared challenge bank: sequential
 *                questions, countdown, no feedback, auto-submit at zero. Misses
 *                feed the spaced-repetition queue like everywhere else.
 *   - `tasks`  — two build briefs assigned from the coding-task bank (one mid,
 *                one senior, preferring ones you have not completed). They are
 *                done in the Coding-Task Simulator, which owns completion —
 *                this phase reads that store and re-checks on demand.
 *   - `result` — the verdict: exam >= pass mark AND both tasks completed.
 *
 * The in-between state (exam finished, tasks pending) persists to localStorage
 * so navigating to /coding-tasks and back resumes the check. An exam abandoned
 * MID-RUN is intentionally NOT persisted — on the real exam day you cannot
 * pause the clock either.
 *
 * NOTE: `CODING_TASKS_DONE_KEY` mirrors the constant in coding-tasks.ts (file
 * private there; importing the component file here would couple lazy chunks).
 * If its -v suffix is ever bumped, update it here and in progress.ts too.
 */
type Phase = 'idle' | 'exam' | 'tasks' | 'result';

const EXAM_QUESTIONS = 20;
const SECONDS_PER_QUESTION = 90;
const PASS_MARK = 70;
const TASKS_REQUIRED = 2;

const ACTIVE_KEY = 'angular-exam-day-active-v1';
const HISTORY_KEY = 'angular-exam-day-history-v1';
const CODING_TASKS_DONE_KEY = 'angular-coding-tasks-v1';
const HISTORY_LIMIT = 10;

/** A check whose exam is finished but whose coding tasks are still pending. */
interface ActiveCheck {
  startedAt: number;
  exam: { scorePercent: number; correct: number; total: number };
  taskIds: number[];
}

/** One completed readiness check — what the verdict history and dashboard show. */
export interface ReadinessResult {
  when: number;
  examScore: number;
  examCorrect: number;
  examTotal: number;
  tasksDone: number;
  tasksTotal: number;
  ready: boolean;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — storage full or blocked
  }
}

function removeKey(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Ids of coding tasks marked complete in the Coding-Task Simulator's store. */
function loadDoneTaskIds(): Set<number> {
  const states = readJson<Record<number, { done?: boolean }>>(CODING_TASKS_DONE_KEY, {});
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

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-exam-day',
  imports: [RouterLink, DatePipe],
  styles: [`
    .ed-hero { text-align: center; padding: 48px 24px 24px; }
    .ed-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .ed-hero p { max-width: 640px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .panel { max-width: 760px; margin: 0 auto 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; }
    .panel h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin: 0 0 10px; }
    .panel.last { margin-bottom: 60px; }
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin: 8px 0 4px; }
    .step { border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
    .step strong { display: block; margin-bottom: 6px; font-size: .94rem; }
    .step span { font-size: .84rem; color: var(--text-muted); line-height: 1.5; }
    .bar-note { font-size: .88rem; color: var(--text-muted); margin: 14px 0 0; }

    .primary-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 11px 24px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .primary-btn:disabled { opacity: .5; cursor: default; }
    .primary-btn.small { padding: 8px 18px; font-size: .88rem; margin-top: 0; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }
    .link-back { display: inline-block; margin-left: 16px; font-size: .84rem; color: var(--blue); text-decoration: underline; }
    .resume-box { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; padding: 14px 16px; border: 1px solid #f59e0b; background: rgba(245,158,11,.07); border-radius: 12px; font-size: .88rem; }
    .resume-box .grow { flex: 1; min-width: 200px; }

    .history-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-top: 1px solid var(--border); font-size: .86rem; }
    .h-verdict { font-size: .7rem; font-weight: 700; letter-spacing: .06em; padding: 2px 10px; border-radius: 12px; flex-shrink: 0; }
    .h-verdict.ready { background: rgba(34,197,94,.15); color: #16a34a; }
    .h-verdict.notyet { background: rgba(239,68,68,.12); color: #ef4444; }
    .h-detail { color: var(--text-muted); flex: 1; }
    .h-when { color: var(--text-muted); font-size: .78rem; }

    .exam-bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 16px; max-width: 760px; margin: 0 auto; padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .exam-progress { font-weight: 600; font-size: .9rem; }
    .timer { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 1.05rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.1); color: #6366f1; }
    .timer.warn { background: rgba(239,68,68,.12); color: #ef4444; animation: edpulse 1s infinite; }
    @keyframes edpulse { 50% { opacity: .55; } }

    .q-card { max-width: 760px; margin: 16px auto 60px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; }
    .q-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-type { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(99,102,241,.1); border: 1px solid #6366f1; color: #6366f1; text-transform: capitalize; }
    .q-text { font-weight: 500; font-size: 1.02rem; margin: 0 0 14px; line-height: 1.5; }
    .q-code { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .82rem; font-family: monospace; white-space: pre-wrap; margin: 0 0 14px; overflow-x: auto; }
    .options { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 16px; }
    .opt { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: .9rem; background: transparent; text-align: left; color: var(--text); }
    .opt:hover { background: rgba(99,102,241,.05); }
    .opt.selected { border-color: #6366f1; background: rgba(99,102,241,.1); }
    .opt-letter { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 600; flex-shrink: 0; }
    .q-actions { display: flex; justify-content: space-between; gap: 12px; }

    .score-chip { display: inline-block; font-size: .88rem; font-weight: 700; padding: 6px 16px; border-radius: 16px; margin-bottom: 4px; }
    .score-chip.pass { background: rgba(34,197,94,.12); color: #16a34a; }
    .score-chip.fail { background: rgba(239,68,68,.1); color: #dc2626; }
    .task-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-top: 1px solid var(--border); }
    .task-row:first-of-type { border-top: none; }
    .task-status { font-size: 1.3rem; flex-shrink: 0; line-height: 1.3; }
    .task-info { flex: 1; }
    .task-info strong { display: block; font-size: .96rem; margin-bottom: 4px; }
    .task-info p { margin: 0; font-size: .84rem; color: var(--text-muted); line-height: 1.5; }
    .task-meta { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
    .tasks-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
    .hint-note { font-size: .84rem; color: var(--text-muted); }

    .verdict-hero { max-width: 760px; margin: 24px auto 16px; text-align: center; padding: 36px 24px; border-radius: 20px; border: 1px solid var(--border); }
    .verdict-hero.ready { background: rgba(34,197,94,.08); border-color: #22c55e; }
    .verdict-hero.notyet { background: rgba(239,68,68,.06); border-color: #ef4444; }
    .verdict-badge { display: inline-block; font-size: .8rem; font-weight: 700; letter-spacing: .08em; padding: 5px 16px; border-radius: 20px; }
    .verdict-hero.ready .verdict-badge { background: #22c55e; color: #fff; }
    .verdict-hero.notyet .verdict-badge { background: #ef4444; color: #fff; }
    .verdict-title { font-size: 2.2rem; font-weight: 800; margin: 12px 0 4px; }
    .verdict-hero p { color: var(--text-muted); margin: 0 0 8px; }
    .verdict-lines { max-width: 400px; margin: 16px auto 0; text-align: left; }
    .v-line { display: flex; justify-content: space-between; gap: 12px; font-size: .92rem; padding: 8px 0; border-bottom: 1px dashed var(--border); }
    .v-line:last-child { border-bottom: none; }
    .v-line strong.good { color: #16a34a; }
    .v-line strong.bad { color: #dc2626; }
  `],
  template: `
    @switch (phase()) {

      @case ('idle') {
        <div class="ed-hero">
          <span class="pill">The Full Dress Rehearsal</span>
          <h1>Exam-Day Readiness Check</h1>
          <p>
            One sitting, just like the real thing: a timed {{ examQuestions }}-question
            exam followed by two practical build briefs. Pass both bars and
            you are ready to book the exam.
          </p>
        </div>

        <div class="panel">
          <h3>The format</h3>
          <div class="steps">
            <div class="step">
              <strong>1 · Timed exam</strong>
              <span>{{ examQuestions }} mixed questions from the full bank, {{ examMinutes }} minutes,
              no feedback until the end. Score {{ passMark }}%+ to pass this leg.</span>
            </div>
            <div class="step">
              <strong>2 · Build briefs</strong>
              <span>Two coding tasks assigned from the simulator (one mid, one senior).
              Complete them in the Coding-Task Simulator, then come back.</span>
            </div>
            <div class="step">
              <strong>3 · Verdict</strong>
              <span>READY means exam ≥ {{ passMark }}% <em>and</em> both briefs done.
              Anything less tells you exactly which leg to train.</span>
            </div>
          </div>
          <p class="bar-note">
            Misses from the exam leg feed your review queue, and every verdict
            shows up on the Progress Dashboard.
          </p>

          @if (active(); as check) {
            <div class="resume-box">
              <span class="grow">
                ⏸ Check in progress — exam scored <strong>{{ check.exam.scorePercent }}%</strong>,
                coding tasks pending.
              </span>
              <button class="primary-btn small" (click)="resume()">Resume →</button>
              <button class="ghost-btn" (click)="abandon()">Discard</button>
            </div>
          } @else {
            <div>
              <button class="primary-btn" (click)="startCheck()">Start the check →</button>
              <a routerLink="/mock-exam" class="link-back">or a plain mock exam</a>
            </div>
          }
        </div>

        @if (history().length > 0) {
          <div class="panel last">
            <h3>Past checks</h3>
            @for (r of history(); track r.when) {
              <div class="history-row">
                <span class="h-verdict" [class.ready]="r.ready" [class.notyet]="!r.ready">
                  {{ r.ready ? 'READY' : 'NOT YET' }}
                </span>
                <span class="h-detail">
                  exam {{ r.examScore }}% ({{ r.examCorrect }}/{{ r.examTotal }}) ·
                  tasks {{ r.tasksDone }}/{{ r.tasksTotal }}
                </span>
                <span class="h-when">{{ r.when | date: 'MMM d, y · HH:mm' }}</span>
              </div>
            }
          </div>
        }
      }

      @case ('exam') {
        <div class="exam-bar">
          <span class="exam-progress">Question {{ index() + 1 }} / {{ questions().length }}</span>
          <span class="timer" [class.warn]="secondsLeft() <= 60">⏱ {{ timeLabel() }}</span>
        </div>

        @if (current(); as ch) {
          <div class="q-card">
            <div class="q-badges">
              <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
              <span class="badge-type">{{ ch.category }}</span>
            </div>

            <p class="q-text">{{ ch.question }}</p>
            @if (ch.code) { <div class="q-code">{{ ch.code }}</div> }

            <div class="options">
              @for (opt of shuffledOptions(ch).options; track $index) {
                <button class="opt" [class.selected]="answers()[ch.id] === $index" (click)="choose(ch, $index)">
                  <span class="opt-letter">{{ letters[$index] }}</span>{{ opt }}
                </button>
              }
            </div>

            <div class="q-actions">
              <button class="ghost-btn" [disabled]="index() === 0" (click)="prev()">← Previous</button>
              @if (index() < questions().length - 1) {
                <button class="primary-btn small" (click)="next()">Next →</button>
              } @else {
                <button class="primary-btn small" (click)="finishExam()">Finish exam leg →</button>
              }
            </div>
          </div>
        }
      }

      @case ('tasks') {
        <div class="ed-hero">
          <span class="pill">Leg 2 of 2</span>
          <h1>Build Briefs</h1>
          <p>
            Exam leg done. Now complete both assigned tasks in the
            Coding-Task Simulator — check every requirement and mark them
            complete there, then evaluate.
          </p>
        </div>

        <div class="panel last">
          @if (active(); as check) {
            <span class="score-chip" [class.pass]="check.exam.scorePercent >= passMark" [class.fail]="check.exam.scorePercent < passMark">
              Exam leg: {{ check.exam.scorePercent }}% ({{ check.exam.correct }}/{{ check.exam.total }})
              — {{ check.exam.scorePercent >= passMark ? 'passed' : 'below the ' + passMark + '% bar' }}
            </span>

            <h3 style="margin-top:18px">Your assigned tasks</h3>
            @for (task of assignedTasks(); track task.id) {
              <div class="task-row">
                <span class="task-status">{{ doneTaskIds().has(task.id) ? '✅' : '⬜' }}</span>
                <div class="task-info">
                  <strong>{{ task.title }}</strong>
                  <p>{{ task.scenario }}</p>
                  <div class="task-meta">
                    <span class="badge-diff {{ task.difficulty }}">{{ task.difficulty }}</span>
                    <span class="badge-type">{{ task.category }}</span>
                    <span class="hint-note">⏱ {{ task.timeboxMinutes }} min</span>
                  </div>
                </div>
              </div>
            }

            <div class="tasks-actions">
              <a routerLink="/coding-tasks" class="primary-btn small" style="text-decoration:none">
                Open the simulator →
              </a>
              <button class="ghost-btn" (click)="refreshTaskStatus()">↻ Re-check status</button>
              <button class="primary-btn small" (click)="evaluate()">Evaluate readiness</button>
            </div>
            <p class="hint-note" style="margin-top:12px">
              {{ assignedDoneCount() }} / {{ tasksRequired }} briefs completed.
              You can evaluate any time — incomplete briefs just count against the verdict.
            </p>
          }
        </div>
      }

      @case ('result') {
        @if (lastResult(); as r) {
          <div class="verdict-hero" [class.ready]="r.ready" [class.notyet]="!r.ready">
            <span class="verdict-badge">{{ r.ready ? 'READY' : 'NOT YET' }}</span>
            <div class="verdict-title">
              {{ r.ready ? 'Book the exam. 🎉' : 'Close — train the weak leg.' }}
            </div>
            <p>Pass bar: exam ≥ {{ passMark }}% and {{ tasksRequired }}/{{ tasksRequired }} briefs completed.</p>

            <div class="verdict-lines">
              <div class="v-line">
                <span>Timed exam</span>
                <strong [class.good]="r.examScore >= passMark" [class.bad]="r.examScore < passMark">
                  {{ r.examScore }}% ({{ r.examCorrect }}/{{ r.examTotal }})
                </strong>
              </div>
              <div class="v-line">
                <span>Build briefs</span>
                <strong [class.good]="r.tasksDone >= r.tasksTotal" [class.bad]="r.tasksDone < r.tasksTotal">
                  {{ r.tasksDone }} / {{ r.tasksTotal }} completed
                </strong>
              </div>
            </div>

            <div style="margin-top:20px">
              <button class="primary-btn" (click)="backToIdle()">Done</button>
              @if (!r.ready) {
                <a routerLink="/progress" class="link-back">see weak areas →</a>
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class ExamDay implements OnDestroy {
  private readonly shuffler = new OptionsShuffler();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly taskById = new Map<number, CodingTask>(CODING_TASKS.map((t) => [t.id, t]));

  readonly letters = ['A', 'B', 'C', 'D'];
  readonly passMark = PASS_MARK;
  readonly examQuestions = EXAM_QUESTIONS;
  readonly examMinutes = Math.round((EXAM_QUESTIONS * SECONDS_PER_QUESTION) / 60);
  readonly tasksRequired = TASKS_REQUIRED;

  readonly phase = signal<Phase>('idle');
  readonly active = signal<ActiveCheck | null>(readJson<ActiveCheck | null>(ACTIVE_KEY, null));
  readonly history = signal<ReadinessResult[]>(readJson<ReadinessResult[]>(HISTORY_KEY, []));
  readonly lastResult = signal<ReadinessResult | null>(null);

  // --- exam leg state (in-memory only; abandoning mid-exam forfeits it) ---
  readonly questions = signal<Challenge[]>([]);
  readonly index = signal(0);
  readonly answers = signal<Record<number, number>>({});
  readonly secondsLeft = signal(0);

  readonly current = computed(() => this.questions()[this.index()]);
  readonly timeLabel = computed(() => formatClock(this.secondsLeft()));

  // --- tasks leg state ---
  /** Completion set read from the Coding-Task Simulator's store. */
  readonly doneTaskIds = signal<Set<number>>(loadDoneTaskIds());
  readonly assignedTasks = computed(() => {
    const check = this.active();
    if (!check) return [];
    return check.taskIds
      .map((id) => this.taskById.get(id))
      .filter((t): t is CodingTask => !!t);
  });
  readonly assignedDoneCount = computed(
    () => this.assignedTasks().filter((t) => this.doneTaskIds().has(t.id)).length,
  );

  // --- flow ---
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
    writeJson(ACTIVE_KEY, check);
    this.refreshTaskStatus();
    this.phase.set('tasks');
  }

  resume(): void {
    if (!this.active()) return;
    this.refreshTaskStatus();
    this.phase.set('tasks');
  }

  abandon(): void {
    this.active.set(null);
    removeKey(ACTIVE_KEY);
    this.phase.set('idle');
  }

  refreshTaskStatus(): void {
    this.doneTaskIds.set(loadDoneTaskIds());
  }

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
    writeJson(HISTORY_KEY, next);

    this.active.set(null);
    removeKey(ACTIVE_KEY);
    this.lastResult.set(result);
    this.phase.set('result');
  }

  backToIdle(): void {
    this.phase.set('idle');
  }

  // --- exam leg interactions ---
  choose(ch: Challenge, optionIndex: number): void {
    this.answers.update((a) => ({ ...a, [ch.id]: optionIndex }));
  }

  next(): void {
    if (this.index() < this.questions().length - 1) this.index.update((i) => i + 1);
  }

  prev(): void {
    if (this.index() > 0) this.index.update((i) => i - 1);
  }

  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  private isCorrect(ch: Challenge): boolean {
    const sel = this.answers()[ch.id];
    return sel !== undefined && sel === this.shuffledOptions(ch).correctIndex;
  }

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

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
