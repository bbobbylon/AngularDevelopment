import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CATEGORY_FILTERS,
  CHALLENGES,
  DIFF_FILTERS,
  shuffle,
  type Challenge,
  type Category,
  type ChallengeType,
  type Difficulty,
} from '../practice/practice-data';
import { OptionsShuffler } from '../practice/practice-helpers';
import { recordMisses } from '../practice/review-queue';
import { downloadTextFile } from '../../shared/download-file';
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';

/** Which screen the exam is on. See {@link MockExam} for what each phase does. */
type Phase = 'config' | 'active' | 'review';

/** Seconds allotted per question — sets the exam-like pace. */
const SECONDS_PER_QUESTION = 90;
/** Percentage needed to pass, matching typical certification thresholds. */
const PASS_MARK = 70;

/** Format a second count as m:ss for the countdown / elapsed displays. */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** One completed exam attempt, persisted so the config screen can show progress. */
interface HistoryEntry {
  /** Epoch ms of when the exam was submitted. */
  when: number;
  scorePercent: number;
  correct: number;
  total: number;
  passed: boolean;
  category: Category;
  difficulty: 'all' | Difficulty;
  secondsUsed: number;
  /** Per-category results for this attempt; absent on entries saved before this field existed. */
  categories?: Record<string, { correct: number; total: number }>;
}

/** Minimum questions seen in a category (across attempts) before it can be called weak. */
const WEAK_MIN_SAMPLE = 3;

/** Keep only the most recent attempts so storage stays bounded. */
const HISTORY_LIMIT = 20;

/**
 * Reads past exam attempts, newest first.
 *
 * @returns Stored attempts, or `[]` when absent/unavailable/corrupt.
 */
function loadHistory(): HistoryEntry[] {
  return readJson<HistoryEntry[]>(STORAGE_KEYS.mockExamHistory, []);
}

/**
 * Persists exam attempts. Callers are responsible for trimming to
 * {@link HISTORY_LIMIT} before calling.
 *
 * @param entries The complete history to store, newest first.
 */
function saveHistory(entries: HistoryEntry[]): void {
  writeJson(STORAGE_KEYS.mockExamHistory, entries);
}

/**
 * Timed Mock Exam — a certification-style assessment over the shared challenge
 * bank (`../practice/practice-data.ts`).
 *
 * A three-phase state machine, all of it driven by signals:
 *
 * - **`config`** — pick a question count, a focus category and a level. The
 *   time limit is *derived*, not chosen ({@link SECONDS_PER_QUESTION} each), so
 *   pace is constant however long the exam is. This screen also surfaces
 *   {@link MockExam.weakAreas} from past attempts.
 * - **`active`** — one question at a time with a live countdown, a navigator
 *   grid, and flag-for-review. Crucially there is **no answer feedback** here,
 *   unlike the Practice page: the point is to measure, not to teach. Hitting
 *   zero auto-submits whatever has been answered.
 * - **`review`** — pass/fail, score, time used, a per-category breakdown, and
 *   every question with the correct answer and explanation.
 *
 * ## How it relates to the rest of the app
 *
 * - Options are shuffled by the same {@link OptionsShuffler} the Practice page
 *   uses, so positions are randomized per exam but stable while navigating
 *   back and forth between questions.
 * - Answered-but-wrong questions feed the spaced-repetition queue on submit;
 *   *skipped* ones deliberately do not (see {@link MockExam.finish}).
 * - Attempt history persists under `STORAGE_KEYS.mockExamHistory` and is read
 *   by the Progress dashboard as well as by this page's own config screen.
 *
 * @see pages/practice/practice.ts — the untimed, feedback-rich counterpart.
 * @see pages/exam-day/exam-day.ts — wraps a shorter version of this in a
 *      readiness check alongside coding tasks.
 */
@Component({
  selector: 'app-mock-exam',
  imports: [RouterLink],
  styleUrl: './mock-exam.css',
  templateUrl: './mock-exam.html',
})
export class MockExam implements OnDestroy {
  /** Per-exam option shuffling. Reset in {@link start} so each exam re-randomizes. */
  private readonly shuffler = new OptionsShuffler();

  /** Handle for the 1-second countdown, or `null` when no exam is running. */
  private timerId: ReturnType<typeof setInterval> | null = null;

  /** Option labels, indexed by position. */
  readonly letters = ['A', 'B', 'C', 'D'];

  /** Exposed to the template so the pass threshold is stated, not hard-coded in markup. */
  readonly passMark = PASS_MARK;

  /** Size of the whole bank — shown on the config screen for context. */
  readonly totalAvailable = CHALLENGES.length;

  /** Selectable exam lengths. */
  readonly countChoices = [10, 20, 30];

  /** Which of the three screens is showing. */
  readonly phase = signal<Phase>('config');

  // --- config selections ---

  /** Requested question count. Clamped by {@link effectiveCount}. */
  readonly selectedCount = signal<number>(20);

  /** Category to draw from, or `all`. */
  readonly selectedCategory = signal<Category>('all');

  /** Difficulty to draw from, or `all`. */
  readonly selectedDiff = signal<'all' | Difficulty>('all');

  /** Category chips, shared with the Practice page so the two stay in step. */
  readonly categoryFilters = CATEGORY_FILTERS;

  /** Difficulty chips, likewise shared. */
  readonly diffFilters = DIFF_FILTERS;

  /** Challenges matching the current focus/level selections. */
  readonly availableForFilters = computed(() => {
    const cat = this.selectedCategory();
    const diff = this.selectedDiff();
    return CHALLENGES.filter(
      (c) => (cat === 'all' || c.category === cat) && (diff === 'all' || c.difficulty === diff),
    );
  });
  /** Requested count clamped to what the filters can actually supply. */
  readonly effectiveCount = computed(() =>
    Math.min(this.selectedCount(), this.availableForFilters().length),
  );
  /** Time limit for the configured exam, derived from its length. */
  readonly totalSeconds = computed(() => this.effectiveCount() * SECONDS_PER_QUESTION);

  /** {@link totalSeconds} in whole minutes, for the "45 minutes" summary line. */
  readonly totalMinutes = computed(() => Math.round(this.totalSeconds() / 60));

  // --- active exam state ---

  /** The questions drawn for this attempt, in presentation order. */
  readonly questions = signal<Challenge[]>([]);

  /** Position within {@link questions}. */
  readonly currentIndex = signal(0);

  /**
   * Chosen option index per challenge id, keyed by id rather than position so
   * the navigator can jump around freely without answers following the cursor.
   */
  readonly answers = signal<Record<number, number | null>>({});

  /** Flag-for-review marks, keyed by challenge id. */
  readonly flagged = signal<Record<number, boolean>>({});

  /** Countdown, decremented once a second by {@link startTimer}. */
  readonly secondsLeft = signal(0);

  /** The limit this attempt started with — needed to compute elapsed time. */
  private readonly examTotalSeconds = signal(0);

  /** Whether the "submit early?" confirmation is showing. */
  readonly confirmingSubmit = signal(false);

  /** The question on screen. */
  readonly current = computed(() => this.questions()[this.currentIndex()]);

  /** Remaining time as `m:ss`. */
  readonly timeLabel = computed(() => formatClock(this.secondsLeft()));

  /** Time used so far as `m:ss`. */
  readonly elapsedLabel = computed(() => formatClock(this.examTotalSeconds() - this.secondsLeft()));

  /** How many questions have an answer — the "12 of 20 answered" progress line. */
  readonly answeredCount = computed(
    () => this.questions().filter((q) => this.isAnswered(q.id)).length,
  );

  // --- review results ---

  /** Number correct. Unanswered questions count as wrong (see {@link isCorrect}). */
  readonly correctCount = computed(
    () => this.questions().filter((ch) => this.isCorrect(ch)).length,
  );

  /** Score as a whole percentage; `0` for an empty exam rather than `NaN`. */
  readonly scorePercent = computed(() => {
    const n = this.questions().length;
    return n === 0 ? 0 : Math.round((this.correctCount() / n) * 100);
  });

  /** Whether the attempt cleared {@link PASS_MARK}. */
  readonly passed = computed(() => this.scorePercent() >= PASS_MARK);

  /** Which review cards to show: everything, only misses, or only flagged. */
  readonly reviewFilter = signal<'all' | 'incorrect' | 'flagged'>('all');

  /** Questions paired with their original exam position, filtered for review. */
  readonly reviewItems = computed(() => {
    const filter = this.reviewFilter();
    return this.questions()
      .map((ch, i) => ({ ch, i }))
      .filter(({ ch }) => {
        if (filter === 'incorrect') return !this.isCorrect(ch);
        if (filter === 'flagged') return this.isFlagged(ch.id);
        return true;
      });
  });
  /** Count behind the "Incorrect" review tab. Includes skipped questions. */
  readonly incorrectTotal = computed(
    () => this.questions().filter((ch) => !this.isCorrect(ch)).length,
  );

  /** Count behind the "Flagged" review tab. */
  readonly flaggedTotal = computed(
    () => this.questions().filter((ch) => this.isFlagged(ch.id)).length,
  );

  /** Per-category correct/total for the exam just taken, worst score first. */
  readonly categoryBreakdown = computed(() => {
    const byCat = new Map<string, { correct: number; total: number }>();
    for (const ch of this.questions()) {
      const row = byCat.get(ch.category) ?? { correct: 0, total: 0 };
      row.total++;
      if (this.isCorrect(ch)) row.correct++;
      byCat.set(ch.category, row);
    }
    return [...byCat.entries()]
      .map(([id, r]) => ({
        id,
        label: this.categoryFilters.find((c) => c.id === id)?.label ?? id,
        correct: r.correct,
        total: r.total,
        pct: Math.round((r.correct / r.total) * 100),
      }))
      .sort((a, b) => a.pct - b.pct);
  });

  // --- attempt history (persisted) ---

  /**
   * Past attempts, newest first. Seeded from storage at construction and
   * written back on each {@link finish} — also read by the Progress dashboard.
   */
  readonly history = signal<HistoryEntry[]>(loadHistory());

  /** How many misses from the exam just finished went into the review queue. */
  readonly missedQueued = signal(0);

  /**
   * Categories scoring under the pass mark, aggregated across all recorded
   * attempts — the "study this next" suggestion on the config screen. Needs a
   * minimum sample per category so one unlucky question is not called a weakness.
   */
  readonly weakAreas = computed(() => {
    const agg = new Map<string, { correct: number; total: number }>();
    for (const h of this.history()) {
      if (!h.categories) continue; // entries saved before per-category tracking
      for (const [id, r] of Object.entries(h.categories)) {
        const cur = agg.get(id) ?? { correct: 0, total: 0 };
        cur.correct += r.correct;
        cur.total += r.total;
        agg.set(id, cur);
      }
    }
    return [...agg.entries()]
      .filter(([, r]) => r.total >= WEAK_MIN_SAMPLE)
      .map(([id, r]) => ({
        id: id as Category,
        label: this.categoryLabel(id as Category),
        pct: Math.round((r.correct / r.total) * 100),
      }))
      .filter((a) => a.pct < PASS_MARK)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3);
  });

  /** Wipes attempt history from the config screen, in memory and on disk. */
  clearHistory(): void {
    this.history.set([]);
    saveHistory([]);
  }

  /**
   * Formats an attempt timestamp for the history list, e.g. `Mar 10, 2:05 PM`.
   * Uses the browser locale rather than a fixed format.
   *
   * @param when Epoch ms.
   */
  formatWhen(when: number): string {
    return new Date(when).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Formats a duration as `m:ss` for the history list. A thin wrapper so the
   * template does not have to reach for the module-level {@link formatClock}.
   *
   * @param seconds Elapsed seconds.
   */
  formatUsed(seconds: number): string {
    return formatClock(seconds);
  }

  /**
   * Display label for a category id, falling back to the raw id so a category
   * added to the bank but not to the filter list still renders.
   *
   * @param id A category id from the challenge bank.
   */
  categoryLabel(id: Category): string {
    return this.categoryFilters.find((c) => c.id === id)?.label ?? id;
  }

  // --- lifecycle ---

  /**
   * Draws the questions and begins the timed run.
   *
   * Resets everything an attempt owns — answers, flags, cursor, option
   * shuffles — so a retake shares nothing with the previous run. The pool is
   * shuffled *before* slicing, so a 10-question exam is a random 10 rather
   * than the first 10 of the filtered set.
   */
  start(): void {
    const pool = shuffle(this.availableForFilters());
    const qs = pool.slice(0, this.effectiveCount());
    this.shuffler.reset();
    this.questions.set(qs);
    this.answers.set({});
    this.flagged.set({});
    this.currentIndex.set(0);
    this.confirmingSubmit.set(false);
    const secs = qs.length * SECONDS_PER_QUESTION;
    this.examTotalSeconds.set(secs);
    this.secondsLeft.set(secs);
    this.phase.set('active');
    this.startTimer();
  }

  /**
   * Starts the one-second countdown, auto-submitting at zero.
   *
   * Calls {@link stopTimer} first so a stray interval can never be left
   * running — cheap insurance, since two intervals would decrement the clock
   * at double speed.
   */
  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      const left = this.secondsLeft() - 1;
      if (left <= 0) {
        this.secondsLeft.set(0);
        this.finish();
      } else {
        this.secondsLeft.set(left);
      }
    }, 1000);
  }

  /** Cancels the countdown if one is running. Idempotent. */
  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // --- option helpers (shared shuffle with the Practice page) ---

  /**
   * This exam's option order for a challenge, plus where the correct answer
   * ended up. Stable for the duration of an attempt.
   *
   * @param ch The challenge.
   * @returns Shuffled options and the correct index; empty with `-1` for a
   *          challenge that has no options.
   */
  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  /** Letter (A/B/C/D) of the correct option, for the per-wrong-answer callout. */
  correctOptionLetter(ch: Challenge): string {
    return this.letters[this.shuffledOptions(ch).correctIndex] ?? '';
  }

  // --- active interactions ---

  /**
   * Records an answer for the current question. Re-choosing simply overwrites:
   * answers stay editable until the exam is submitted.
   *
   * @param index Position in the *shuffled* option list.
   */
  choose(index: number): void {
    const ch = this.current();
    if (!ch) return;
    this.answers.update((a) => ({ ...a, [ch.id]: index }));
  }
  /**
   * Whether an option is the one currently selected, for the highlight state.
   *
   * @param index Position in the shuffled option list.
   */
  isChosen(index: number): boolean {
    const ch = this.current();
    return ch ? this.answers()[ch.id] === index : false;
  }
  /**
   * Whether a question has been answered at all — drives the navigator dots
   * and {@link answeredCount}. Checks for both `null` and `undefined` because
   * an untouched question has no key in the map at all.
   *
   * @param id Challenge id.
   */
  isAnswered(id: number): boolean {
    const v = this.answers()[id];
    return v !== null && v !== undefined;
  }

  /** Flags or unflags the current question for review. */
  toggleFlag(): void {
    const ch = this.current();
    if (!ch) return;
    this.flagged.update((f) => ({ ...f, [ch.id]: !f[ch.id] }));
  }
  /**
   * Whether a question is flagged.
   *
   * @param id Challenge id.
   */
  isFlagged(id: number): boolean {
    return !!this.flagged()[id];
  }

  /** Advances one question. Stops at the last rather than wrapping. */
  next(): void {
    if (this.currentIndex() < this.questions().length - 1) this.currentIndex.update((i) => i + 1);
  }
  /** Goes back one question. Stops at the first rather than wrapping. */
  prev(): void {
    if (this.currentIndex() > 0) this.currentIndex.update((i) => i - 1);
  }
  /**
   * Jumps straight to a question from the navigator grid.
   *
   * @param i Zero-based position in {@link questions}.
   */
  goTo(i: number): void {
    this.currentIndex.set(i);
  }

  /** Opens the "submit early?" confirmation. Submitting is not reversible. */
  requestFinish(): void {
    this.confirmingSubmit.set(true);
  }
  /** Dismisses the submit confirmation and returns to the exam. */
  cancelFinish(): void {
    this.confirmingSubmit.set(false);
  }
  /**
   * Ends the attempt: stops the clock, scores it, records it, and moves to the
   * review screen.
   *
   * Two subtleties worth knowing:
   *
   * 1. **The phase guard is load-bearing.** This is reachable both from the
   *    submit button and from the countdown hitting zero, and those can fire
   *    in the same tick. Without the guard the attempt would be written to
   *    history twice and misses queued twice.
   * 2. **Skipped questions are not queued for review.** Only answered-but-wrong
   *    ones are. A timed-out exam can leave a dozen questions untouched, and
   *    treating those as misses would flood the spaced-repetition queue with
   *    material the user never actually got wrong.
   */
  finish(): void {
    if (this.phase() !== 'active') return; // timer + button can race; record once
    this.stopTimer();
    this.confirmingSubmit.set(false);
    this.reviewFilter.set('all');
    this.phase.set('review');

    const entry: HistoryEntry = {
      when: Date.now(),
      scorePercent: this.scorePercent(),
      correct: this.correctCount(),
      total: this.questions().length,
      passed: this.passed(),
      category: this.selectedCategory(),
      difficulty: this.selectedDiff(),
      secondsUsed: this.examTotalSeconds() - this.secondsLeft(),
      categories: Object.fromEntries(
        this.categoryBreakdown().map((r) => [r.id, { correct: r.correct, total: r.total }]),
      ),
    };
    const next = [entry, ...this.history()].slice(0, HISTORY_LIMIT);
    this.history.set(next);
    saveHistory(next);

    // Feed answered-but-wrong questions to the spaced-repetition queue.
    // Skipped questions are excluded so a timed-out exam does not flood it.
    const missed = this.questions()
      .filter((ch) => this.isAnswered(ch.id) && !this.isCorrect(ch))
      .map((ch) => ch.id);
    recordMisses(missed);
    this.missedQueued.set(missed.length);
  }

  // --- scoring ---

  /**
   * Whether a question was answered correctly.
   *
   * An unanswered question is `false`, not a separate state — it counts
   * against the score exactly like a wrong answer, which is how the real exam
   * treats a blank. The review screen still distinguishes the two for display.
   *
   * @param ch The challenge to score.
   */
  isCorrect(ch: Challenge): boolean {
    const sel = this.answers()[ch.id];
    if (sel === null || sel === undefined) return false;
    return sel === this.shuffledOptions(ch).correctIndex;
  }

  /**
   * Returns to the config screen for another attempt, keeping the previous
   * selections so "same again" is one click.
   */
  retake(): void {
    this.stopTimer();
    this.secondsLeft.set(0);
    this.phase.set('config');
  }

  /** Downloads a Markdown summary of the exam just finished — score, category breakdown, and a per-question review with explanations. */
  exportResults(): void {
    const when = Date.now();
    const lines: string[] = [];

    lines.push(`# Mock Exam Results — ${new Date(when).toLocaleString()}`, '');
    lines.push(
      `**Score:** ${this.scorePercent()}% (${this.correctCount()}/${this.questions().length}) — ${this.passed() ? 'PASS' : 'FAIL'} (pass mark ${this.passMark}%)`,
    );
    lines.push(`**Time used:** ${this.elapsedLabel()} of ${formatClock(this.examTotalSeconds())}`);
    lines.push(
      `**Focus:** ${this.categoryLabel(this.selectedCategory())} · ${this.selectedDiff() === 'all' ? 'All levels' : this.selectedDiff()}`,
      '',
    );

    if (this.categoryBreakdown().length > 1) {
      lines.push('## By category', '');
      for (const row of this.categoryBreakdown()) {
        lines.push(`- ${row.label}: ${row.correct}/${row.total} (${row.pct}%)`);
      }
      lines.push('');
    }

    lines.push('## Question review', '');
    this.questions().forEach((ch, i) => {
      const shuffled = this.shuffledOptions(ch);
      const ok = this.isCorrect(ch);
      lines.push(
        `### Q${i + 1} — ${this.categoryLabel(ch.category)} · ${ch.difficulty} — ${ok ? '✓ Correct' : this.isAnswered(ch.id) ? '✗ Incorrect' : '⚠ Not answered'}`,
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

    const stamp = new Date(when).toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadTextFile(`mock-exam-results_${stamp}.md`, lines.join('\n'));
  }

  /**
   * Clears the countdown on teardown. Without it, navigating away mid-exam
   * leaves an interval running against a destroyed component — it would keep
   * ticking, and would eventually call {@link finish} on a dead page.
   */
  ngOnDestroy(): void {
    this.stopTimer();
  }

  /**
   * Display label for a challenge type, shown as a badge on each question.
   *
   * A `Record` rather than a `switch` so TypeScript fails the build if a new
   * {@link ChallengeType} is added to the bank without a label here.
   *
   * @param type The challenge's type.
   */
  typeLabel(type: ChallengeType): string {
    const map: Record<ChallengeType, string> = {
      'multiple-choice': 'Multiple Choice',
      'spot-the-bug': 'Spot the Bug',
      'predict-output': 'Predict Output',
      'fill-blank': 'Fill in the Blank',
    };
    return map[type];
  }
}
