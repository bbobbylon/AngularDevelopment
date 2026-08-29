import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CURRICULUM } from '../../core/curriculum';
import { ProgressService } from '../../core/progress.service';
import { StreakService } from '../../core/streak.service';
import { BookmarksService } from '../../core/bookmarks.service';
import { ACHIEVEMENTS, type AchievementStats } from '../../core/achievements';
import { CHALLENGES, type Category } from '../practice/practice-data';
import { dueCount, loadMastered, loadQueue } from '../practice/review-queue';
import { CODING_TASKS } from '../coding-tasks/coding-tasks-data';
import { downloadTextFile } from '../../shared/download-file';
import { STORAGE_KEYS, readJson } from '../../core/storage';

/*
 * The three interfaces below mirror data owned by *other* pages.
 *
 * Keys come from the shared registry in `core/storage.ts`, but the SHAPES are
 * re-declared here rather than imported: pulling a type out of an owning
 * component file would couple their lazily-loaded chunks together for no
 * runtime benefit. They are a deliberate structural-typing contract, not an
 * oversight — if an owner changes what it persists, update the mirror here.
 * Every read already tolerates missing or mismatched data, so drift degrades
 * a tile rather than breaking the page.
 */

/** Mirror of one entry in the Practice page's per-challenge state map. */
interface PracticeState {
  answered: boolean;
  correct: boolean;
}

/** Mirror of one Exam-Day readiness verdict. Owner: `pages/exam-day`. */
interface ReadinessEntry {
  /** Epoch ms of the verdict. */
  when: number;
  /** Exam-leg score as a percentage. */
  examScore: number;
  /** Coding briefs completed during the check. */
  tasksDone: number;
  /** Coding briefs assigned. */
  tasksTotal: number;
  /** The overall READY / NOT YET verdict. */
  ready: boolean;
}

/** Mirror of one Mock Exam attempt. Owner: `pages/mock-exam`. */
interface ExamAttempt {
  /** Epoch ms of submission. */
  when: number;
  /** Score as a percentage. */
  scorePercent: number;
  /** Questions correct. */
  correct: number;
  /** Questions asked. */
  total: number;
  /** Whether the attempt cleared the pass mark. */
  passed: boolean;
  /** Per-category results; absent on attempts saved before this was tracked. */
  categories?: Record<string, { correct: number; total: number }>;
}

/**
 * Minimum questions seen in a category across exams before it can be called
 * weak — stops a single unlucky question from branding a whole topic.
 */
const WEAK_MIN_SAMPLE = 3;

/** Accuracy (%) below which a sufficiently-sampled category is flagged weak. */
const WEAK_THRESHOLD = 70;

/**
 * Progress Dashboard — one read-only page that aggregates every study store in
 * the app, so "am I ready?" has a single answer instead of six.
 *
 * It **writes nothing**. Each section deep-links to the page that owns the
 * underlying store, which is what keeps the aggregation safe: there is exactly
 * one writer per store and this is never it.
 *
 * ## Sources
 *
 * | Data | Owner |
 * |---|---|
 * | Lessons visited | {@link ProgressService} |
 * | Study streak | {@link StreakService} |
 * | Bookmarks | {@link BookmarksService} |
 * | Practice progress | `STORAGE_KEYS.practiceProgress` (`pages/practice`) |
 * | Mock exam history | `STORAGE_KEYS.mockExamHistory` (`pages/mock-exam`) |
 * | Spaced repetition | `pages/practice/review-queue.ts` |
 * | Coding tasks | `STORAGE_KEYS.codingTasks` (`pages/coding-tasks`) |
 * | Exam-day verdicts | `STORAGE_KEYS.examDayHistory` (`pages/exam-day`) |
 *
 * ## Snapshot, not a live view
 *
 * localStorage is not reactive, so the raw reads happen once at construction
 * and the page is a snapshot as of when it was opened. That is fine because
 * the component is route-scoped: navigating away and back builds a new one.
 * The `computed`s wrapping those reads exist for composition and caching, not
 * because the underlying data can change while the page is open.
 *
 * @see core/achievements.ts for the badges this page derives.
 */
@Component({
  selector: 'app-progress',
  imports: [RouterLink, DatePipe],
  styles: [`
    .pg-hero { text-align: center; padding: 48px 24px 24px; }
    .pg-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .pg-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }

    .score-panel { display: flex; gap: 28px; align-items: center; max-width: 760px; margin: 24px auto 8px; padding: 24px 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; flex-wrap: wrap; justify-content: center; }
    .ring { width: 140px; height: 140px; flex-shrink: 0; }
    .ring-track { fill: none; stroke: var(--border); stroke-width: 10; }
    .ring-fill { fill: none; stroke: #6366f1; stroke-width: 10; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 60px 60px; transition: stroke-dashoffset .8s ease; }
    .ring-num { font-size: 30px; font-weight: 800; fill: var(--text); text-anchor: middle; }
    .ring-sub { font-size: 11px; fill: var(--text-muted); text-anchor: middle; }
    .score-info { flex: 1; min-width: 260px; }
    .score-grade { margin: 0 0 6px; font-size: 1.3rem; }
    .score-note { font-size: .82rem; color: var(--text-muted); line-height: 1.55; margin: 0 0 14px; }
    .insight-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .insight { padding: 8px 14px; border: 1px solid var(--border); border-radius: 12px; }
    .insight strong { display: block; font-size: .95rem; }
    .insight span { font-size: .72rem; color: var(--text-muted); }
    .insight.good { border-color: rgba(34,197,94,.5); }
    .insight.good strong { color: #16a34a; }
    .insight.bad { border-color: rgba(239,68,68,.5); }
    .insight.bad strong { color: #dc2626; }

    .stats-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px auto; max-width: 900px; padding: 0 24px; }
    .stat-box { text-align: center; padding: 14px 22px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); min-width: 110px; }
    .stat-box strong { display: block; font-size: 1.6rem; }
    .stat-box span { font-size: .8rem; color: var(--text-muted); }
    .stat-box.accent strong { color: #6366f1; }
    .stat-box.good strong { color: #16a34a; }
    .stat-box.warn strong { color: #d97706; }

    .grid { max-width: 960px; margin: 8px auto 60px; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; align-items: start; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin: 0 0 4px; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; }
    .panel .sub { font-size: .82rem; color: var(--text-muted); margin: 0 0 14px; }
    .bar-outer { height: 8px; background: var(--border); border-radius: 4px; margin: 6px 0 4px; }
    .bar-inner { height: 100%; border-radius: 4px; background: #6366f1; transition: width .3s; }
    .bar-inner.green { background: #22c55e; }
    .bar-label { display: flex; justify-content: space-between; font-size: .8rem; color: var(--text-muted); }
    .metric-line { display: flex; justify-content: space-between; font-size: .88rem; padding: 6px 0; border-bottom: 1px dashed var(--border); }
    .metric-line:last-of-type { border-bottom: none; }
    .metric-line strong.good { color: #16a34a; }
    .metric-line strong.bad { color: #dc2626; }
    .go-link { display: inline-block; margin-top: 12px; font-size: .84rem; color: var(--blue); text-decoration: underline; }
    .empty { font-size: .86rem; color: var(--text-muted); font-style: italic; margin: 4px 0 0; }

    .cat-row { display: grid; grid-template-columns: 130px 1fr 64px; gap: 10px; align-items: center; font-size: .82rem; padding: 3px 0; }
    .cat-row .name { color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cat-row .pct { text-align: right; font-weight: 600; }
    .cat-row .pct.weak { color: #dc2626; }

    .attempt { display: flex; gap: 12px; align-items: center; font-size: .85rem; padding: 7px 0; border-bottom: 1px dashed var(--border); }
    .attempt:last-of-type { border-bottom: none; }
    .attempt .when { color: var(--text-muted); flex: 1; }
    .attempt .badge { font-size: .72rem; font-weight: 700; padding: 2px 10px; border-radius: 12px; }
    .attempt .badge.pass { background: rgba(34,197,94,.12); color: #16a34a; }
    .attempt .badge.fail { background: rgba(239,68,68,.1); color: #dc2626; }
    .weak-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .weak-chip { font-size: .78rem; font-weight: 600; padding: 4px 12px; border-radius: 14px; background: rgba(239,68,68,.08); border: 1px solid #ef4444; color: #dc2626; }

    .badge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; margin-top: 4px; }
    .badge { text-align: center; padding: 14px 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg, transparent); }
    .badge.unlocked { border-color: rgba(99,102,241,.5); background: rgba(99,102,241,.06); }
    .badge-icon { font-size: 1.6rem; display: block; filter: grayscale(1); opacity: .35; }
    .badge.unlocked .badge-icon { filter: none; opacity: 1; }
    .badge-title { display: block; font-size: .8rem; font-weight: 700; margin-top: 6px; }
    .badge-desc { display: block; font-size: .7rem; color: var(--text-muted); margin-top: 2px; line-height: 1.35; }
    .badge-bar-outer { height: 5px; background: var(--border); border-radius: 3px; margin-top: 8px; }
    .badge-bar-inner { height: 100%; border-radius: 3px; background: #6366f1; }
  `],
  template: `
    <div class="pg-hero">
      <span class="pill">Your Journey</span>
      <h1>Progress Dashboard</h1>
      <p>
        Everything you have studied, answered, drilled and built — in one place.
        Each section links to the tool that owns it.
      </p>
      <button class="ghost-btn" style="margin-top:14px" (click)="exportReport()">⬇ Export Full Report</button>
    </div>

    <div class="score-panel">
      <svg class="ring" viewBox="0 0 120 120" role="img" [attr.aria-label]="'Readiness score ' + readinessScore() + ' percent'">
        <circle class="ring-track" cx="60" cy="60" r="52" />
        <circle class="ring-fill" cx="60" cy="60" r="52"
          [style.strokeDasharray]="ringCircumference"
          [style.strokeDashoffset]="ringOffset()" />
        <text x="60" y="56" class="ring-num">{{ readinessScore() }}</text>
        <text x="60" y="74" class="ring-sub">/ 100</text>
      </svg>
      <div class="score-info">
        <h2 class="score-grade">{{ readinessGrade() }}</h2>
        <p class="score-note">
          A weighted blend of lesson coverage, practice coverage &amp; accuracy,
          best mock-exam score, coding tasks and review-queue mastery — only
          areas you have touched count, so it never punishes an untried tool.
        </p>
        <div class="insight-row">
          <div class="insight"><strong>{{ totalAnswered() }}</strong><span>total questions faced</span></div>
          <div class="insight"><strong>{{ examPassRate() }}%</strong><span>exam pass rate</span></div>
          <div class="insight"><strong>{{ reviewMastered() }}</strong><span>mastered via review</span></div>
          @if (strongestCategory(); as strongest) {
            <div class="insight good"><strong>{{ strongest.label }}</strong><span>strongest · {{ strongest.percent }}%</span></div>
          }
          @if (weakestCategory(); as weakest) {
            <div class="insight bad"><strong>{{ weakest.label }}</strong><span>focus here · {{ weakest.percent }}%</span></div>
          }
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-box accent"><strong>{{ practiceAnswered() }}</strong><span>challenges answered</span></div>
      <div class="stat-box" [class.good]="practiceAccuracy() >= 70"><strong>{{ practiceAccuracy() }}%</strong><span>practice accuracy</span></div>
      <div class="stat-box" [class.good]="bestExam() >= 70"><strong>{{ examAttempts().length === 0 ? '—' : bestExam() + '%' }}</strong><span>best mock exam</span></div>
      <div class="stat-box" [class.warn]="reviewDue() > 0"><strong>{{ reviewDue() }}</strong><span>reviews due</span></div>
      <div class="stat-box"><strong>{{ tasksDone() }}/{{ tasksTotal }}</strong><span>coding tasks</span></div>
      <div class="stat-box" [class.good]="streak.current() > 0">
        <strong>🔥 {{ streak.current() }}</strong>
        <span>day streak (best {{ streak.longest() }})</span>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <h2>📖 Lessons</h2>
        <p class="sub">Curriculum pages opened at least once.</p>
        <div class="bar-label"><span>{{ lessonsVisited() }} of {{ lessonsBuilt }} visited</span><span>{{ lessonsPercent() }}%</span></div>
        <div class="bar-outer"><div class="bar-inner" [style.width]="lessonsPercent() + '%'"></div></div>
        <a routerLink="/" class="go-link">Browse the curriculum →</a>
      </div>

      <div class="panel">
        <h2>🔁 Review Queue</h2>
        <p class="sub">Spaced repetition over everything you have missed.</p>
        <div class="metric-line"><span>Due now</span><strong [class.bad]="reviewDue() > 0">{{ reviewDue() }}</strong></div>
        <div class="metric-line"><span>In the queue</span><strong>{{ reviewQueueSize() }}</strong></div>
        <div class="metric-line"><span>Mastered</span><strong class="good">{{ reviewMastered() }}</strong></div>
        <a routerLink="/review" class="go-link">{{ reviewDue() > 0 ? 'Clear what is due →' : 'Open the review queue →' }}</a>
      </div>

      <div class="panel">
        <h2>🎓 Exam-Day Readiness</h2>
        <p class="sub">The full dress rehearsal: timed exam + build briefs.</p>
        @if (readinessChecks().length === 0) {
          <p class="empty">No readiness checks run yet — the one number that says "book it".</p>
        } @else {
          @for (check of recentReadiness(); track check.when) {
            <div class="attempt">
              <span class="when">{{ check.when | date: 'MMM d, y · HH:mm' }}</span>
              <span>exam {{ check.examScore }}% · tasks {{ check.tasksDone }}/{{ check.tasksTotal }}</span>
              <span class="badge" [class.pass]="check.ready" [class.fail]="!check.ready">
                {{ check.ready ? 'READY' : 'NOT YET' }}
              </span>
            </div>
          }
        }
        <a routerLink="/exam-day" class="go-link">
          {{ readinessChecks().length === 0 ? 'Run the readiness check →' : 'Run another check →' }}
        </a>
      </div>

      <div class="panel">
        <h2>🛠️ Coding Tasks</h2>
        <p class="sub">Practical-exam build briefs completed.</p>
        <div class="bar-label"><span>{{ tasksDone() }} of {{ tasksTotal }} completed</span><span>{{ tasksPercent() }}%</span></div>
        <div class="bar-outer"><div class="bar-inner green" [style.width]="tasksPercent() + '%'"></div></div>
        <a routerLink="/coding-tasks" class="go-link">Take on a build task →</a>
      </div>

      <div class="panel wide">
        <h2>⚡ Practice Challenges</h2>
        <p class="sub">
          {{ practiceAnswered() }} of {{ challengeTotal }} answered ·
          {{ practiceCorrect() }} correct ({{ practiceAccuracy() }}%)
        </p>
        <div class="bar-label"><span>Bank coverage</span><span>{{ practiceCoverage() }}%</span></div>
        <div class="bar-outer"><div class="bar-inner" [style.width]="practiceCoverage() + '%'"></div></div>

        @if (categoryStats().length > 0) {
          <p class="sub" style="margin-top:16px">Accuracy by category (answered questions only):</p>
          @for (cat of categoryStats(); track cat.id) {
            <div class="cat-row">
              <span class="name">{{ cat.label }}</span>
              <div class="bar-outer" style="margin:0">
                <div class="bar-inner" [class.green]="cat.percent >= 70" [style.width]="cat.percent + '%'"></div>
              </div>
              <span class="pct" [class.weak]="cat.percent < 70">{{ cat.percent }}% ({{ cat.total }})</span>
            </div>
          }
        } @else {
          <p class="empty">No challenges answered yet — the category breakdown appears here.</p>
        }
        <a routerLink="/practice" class="go-link">Go practice →</a>
      </div>

      <div class="panel wide">
        <h2>⏱ Mock Exams</h2>
        @if (examAttempts().length === 0) {
          <p class="empty">No mock exams taken yet. A timed run is the closest thing to the real exam.</p>
        } @else {
          <p class="sub">
            {{ examAttempts().length }} attempt{{ examAttempts().length === 1 ? '' : 's' }} ·
            best {{ bestExam() }}% · average {{ avgExam() }}% ·
            {{ passCount() }} passed
          </p>

          @for (attempt of recentAttempts(); track attempt.when) {
            <div class="attempt">
              <span class="when">{{ attempt.when | date: 'MMM d, y · HH:mm' }}</span>
              <span>{{ attempt.correct }}/{{ attempt.total }} ({{ attempt.scorePercent }}%)</span>
              <span class="badge" [class.pass]="attempt.passed" [class.fail]="!attempt.passed">
                {{ attempt.passed ? 'PASS' : 'FAIL' }}
              </span>
            </div>
          }

          @if (weakCategories().length > 0) {
            <p class="sub" style="margin-top:14px">
              Weak areas across attempts (&lt;{{ weakThreshold }}% on {{ weakMinSample }}+ questions):
            </p>
            <div class="weak-chips">
              @for (weak of weakCategories(); track weak.id) {
                <span class="weak-chip">{{ weak.label }} — {{ weak.percent }}%</span>
              }
            </div>
          }
        }
        <a routerLink="/mock-exam" class="go-link">Take a mock exam →</a>
      </div>

      <div class="panel wide">
        <h2>🏅 Achievements</h2>
        <p class="sub">{{ unlockedCount() }} of {{ achievements().length }} unlocked.</p>
        <div class="badge-grid">
          @for (a of achievements(); track a.id) {
            <div class="badge" [class.unlocked]="a.unlocked" [title]="a.description">
              <span class="badge-icon">{{ a.icon }}</span>
              <span class="badge-title">{{ a.title }}</span>
              <span class="badge-desc">{{ a.description }}</span>
              @if (!a.unlocked) {
                <div class="badge-bar-outer"><div class="badge-bar-inner" [style.width]="a.progress + '%'"></div></div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Progress {
  /** Visited-lesson store. Named to avoid colliding with this class. */
  private readonly lessonProgress = inject(ProgressService);

  /** Study streak. `protected` because the template renders it directly. */
  protected readonly streak = inject(StreakService);

  /** Bookmark count, used only as an achievement input. */
  private readonly bookmarksService = inject(BookmarksService);

  // --- static denominators ---

  /**
   * Lessons that actually have a component, not merely a curriculum entry.
   * Using the total would make 100% unreachable while lessons are still being
   * written, and would quietly understate real coverage.
   */
  readonly lessonsBuilt = CURRICULUM.filter((l) => l.loadComponent).length;

  /** Size of the challenge bank — the denominator for practice coverage. */
  readonly challengeTotal = CHALLENGES.length;

  /** Number of coding briefs available. */
  readonly tasksTotal = CODING_TASKS.length;

  /** Exposed so the template can state the weak-category threshold it applies. */
  readonly weakThreshold = WEAK_THRESHOLD;

  /** Exposed so the template can state the minimum sample size. */
  readonly weakMinSample = WEAK_MIN_SAMPLE;

  // --- snapshot reads (localStorage is not reactive; navigation refreshes) ---

  /** Practice answer state, keyed by challenge id. */
  private readonly practiceStates = readJson<Record<number, PracticeState>>(STORAGE_KEYS.practiceProgress, {});

  /** Mock-exam attempts, newest first. */
  readonly examAttempts = computed(() => readJson<ExamAttempt[]>(STORAGE_KEYS.mockExamHistory, []));

  /** Coding-task completion, keyed by task id. */
  private readonly taskStates = readJson<Record<number, { done?: boolean }>>(STORAGE_KEYS.codingTasks, {});

  /** The spaced-repetition queue as of page load. */
  private readonly reviewQueue = loadQueue();

  // --- lessons ---

  /** Distinct lessons opened. */
  readonly lessonsVisited = computed(() => this.lessonProgress.visitedCount());

  /** Lesson coverage as a percentage of {@link lessonsBuilt}. */
  readonly lessonsPercent = computed(() =>
    this.lessonsBuilt === 0 ? 0 : Math.round((this.lessonsVisited() / this.lessonsBuilt) * 100),
  );

  // --- practice ---

  /** Challenges answered at least once on the Practice page. */
  readonly practiceAnswered = computed(
    () => Object.values(this.practiceStates).filter((s) => s.answered).length,
  );

  /** Of those, how many were right. */
  readonly practiceCorrect = computed(
    () => Object.values(this.practiceStates).filter((s) => s.answered && s.correct).length,
  );

  /**
   * Accuracy over answered questions — how well you do on what you attempt.
   * Distinct from {@link practiceCoverage}, which is how much you have
   * attempted; the readiness score weighs both, because either alone is
   * gameable.
   */
  readonly practiceAccuracy = computed(() => {
    const answered = this.practiceAnswered();
    return answered === 0 ? 0 : Math.round((this.practiceCorrect() / answered) * 100);
  });

  /** Share of the whole bank attempted. */
  readonly practiceCoverage = computed(() =>
    Math.round((this.practiceAnswered() / this.challengeTotal) * 100),
  );

  /** Per-category accuracy over answered practice challenges, worst first. */
  readonly categoryStats = computed(() => {
    const byId = new Map(CHALLENGES.map((c) => [c.id, c.category]));
    const agg = new Map<Exclude<Category, 'all'>, { correct: number; total: number }>();
    for (const [idStr, state] of Object.entries(this.practiceStates)) {
      if (!state.answered) continue;
      const category = byId.get(Number(idStr));
      if (!category) continue; // stale id — the bank moved on
      const entry = agg.get(category) ?? { correct: 0, total: 0 };
      entry.total++;
      if (state.correct) entry.correct++;
      agg.set(category, entry);
    }
    return [...agg.entries()]
      .map(([id, { correct, total }]) => ({
        id,
        label: this.categoryLabel(id),
        correct,
        total,
        percent: Math.round((correct / total) * 100),
      }))
      .sort((a, b) => a.percent - b.percent);
  });

  // --- mock exams ---

  /** Highest exam score ever recorded. Feeds the readiness score. */
  readonly bestExam = computed(() =>
    this.examAttempts().reduce((best, a) => Math.max(best, a.scorePercent), 0),
  );

  /** Mean exam score across all attempts; `0` with none. */
  readonly avgExam = computed(() => {
    const attempts = this.examAttempts();
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length);
  });

  /** Number of exams passed. */
  readonly passCount = computed(() => this.examAttempts().filter((a) => a.passed).length);

  /** The five most recent attempts, for the history strip. */
  readonly recentAttempts = computed(() => this.examAttempts().slice(0, 5));

  /** Categories under the threshold across ALL exam attempts combined. */
  readonly weakCategories = computed(() => {
    const agg = new Map<string, { correct: number; total: number }>();
    for (const attempt of this.examAttempts()) {
      for (const [cat, r] of Object.entries(attempt.categories ?? {})) {
        const entry = agg.get(cat) ?? { correct: 0, total: 0 };
        entry.correct += r.correct;
        entry.total += r.total;
        agg.set(cat, entry);
      }
    }
    return [...agg.entries()]
      .filter(([, r]) => r.total >= WEAK_MIN_SAMPLE)
      .map(([id, r]) => ({
        id,
        label: this.categoryLabel(id as Exclude<Category, 'all'>),
        percent: Math.round((r.correct / r.total) * 100),
      }))
      .filter((c) => c.percent < WEAK_THRESHOLD)
      .sort((a, b) => a.percent - b.percent);
  });

  // --- readiness score (weighted blend; untouched areas are excluded and the
  //     remaining weights renormalized, so a fresh tool never drags the score) ---
  /**
   * Circumference of the SVG progress ring (r=52), used with `stroke-dashoffset`
   * to draw a partial arc — the standard trick for an SVG progress circle.
   */
  readonly ringCircumference = 2 * Math.PI * 52;

  /**
   * The headline 0-100 readiness number: a weighted blend of lesson coverage,
   * practice coverage and accuracy, best exam score, coding tasks, and review
   * health.
   *
   * The important detail is the **renormalization**. A tool you have never
   * touched is excluded from the blend entirely and the remaining weights are
   * rescaled to sum to 1. Without that, adding a new study tool would
   * instantly drop everyone's score, and someone doing serious practice would
   * be capped at 85 purely for not having opened the coding tasks. Untouched
   * means "no signal", not "scored zero".
   */
  readonly readinessScore = computed(() => {
    const parts: { value: number; weight: number; hasData: boolean }[] = [
      { value: this.lessonsPercent(), weight: 0.1, hasData: this.lessonsVisited() > 0 },
      { value: this.practiceCoverage(), weight: 0.15, hasData: this.practiceAnswered() > 0 },
      { value: this.practiceAccuracy(), weight: 0.2, hasData: this.practiceAnswered() > 0 },
      { value: this.bestExam(), weight: 0.25, hasData: this.examAttempts().length > 0 },
      { value: this.tasksPercent(), weight: 0.15, hasData: this.tasksDone() > 0 },
      {
        value: this.reviewHealth(),
        weight: 0.15,
        hasData: this.reviewQueueSize() + this.reviewMastered() > 0,
      },
    ];
    const active = parts.filter((p) => p.hasData);
    if (active.length === 0) return 0;
    const totalWeight = active.reduce((sum, p) => sum + p.weight, 0);
    return Math.round(active.reduce((sum, p) => sum + p.value * (p.weight / totalWeight), 0));
  });

  /** `stroke-dashoffset` for the ring: full circumference at 0, zero at 100. */
  readonly ringOffset = computed(
    () => this.ringCircumference * (1 - this.readinessScore() / 100),
  );

  /** A plain-language band for {@link readinessScore}, shown under the ring. */
  readonly readinessGrade = computed(() => {
    const score = this.readinessScore();
    if (score >= 80) return '🎓 Exam-ready';
    if (score >= 60) return '🔥 Almost there';
    if (score >= 30) return '📈 Building momentum';
    return '🌱 Just getting started';
  });

  /** Share of ever-missed questions that graduated out of the review queue. */
  readonly reviewHealth = computed(() => {
    const total = this.reviewQueueSize() + this.reviewMastered();
    return total === 0 ? 0 : Math.round((this.reviewMastered() / total) * 100);
  });

  // --- insight tiles ---
  /** Practice answers + every question faced across recorded mock exams. */
  readonly totalAnswered = computed(
    () => this.practiceAnswered() + this.examAttempts().reduce((sum, a) => sum + a.total, 0),
  );
  /** Share of exam attempts that passed. */
  readonly examPassRate = computed(() => {
    const attempts = this.examAttempts();
    return attempts.length === 0 ? 0 : Math.round((this.passCount() / attempts.length) * 100);
  });
  /** Best/worst practice category with a meaningful sample (3+ answered). */
  readonly strongestCategory = computed(() => {
    const qualified = this.categoryStats().filter((c) => c.total >= 3);
    return qualified.length === 0 ? null : qualified[qualified.length - 1];
  });
/**
   * The weakest practice category, or `null` when there is nothing worth
   * flagging — either no category has a meaningful sample, or the worst one is
   * still respectable. Naming a "focus area" that you are already passing
   * would be noise.
   */
  readonly weakestCategory = computed(() => {
    const qualified = this.categoryStats().filter((c) => c.total >= 3);
    // categoryStats is sorted worst-first; only flag a real weakness.
    return qualified.length === 0 || qualified[0].percent >= 70 ? null : qualified[0];
  });

  // --- exam-day readiness ---

  /** All recorded Exam-Day verdicts, newest first. */
  readonly readinessChecks = computed(() => readJson<ReadinessEntry[]>(STORAGE_KEYS.examDayHistory, []));

  /** The three most recent verdicts, for the summary strip. */
  readonly recentReadiness = computed(() => this.readinessChecks().slice(0, 3));

  // --- review queue ---

  /** Review items due right now. */
  readonly reviewDue = computed(() => dueCount(this.reviewQueue));

  /** Items in the queue, due or not. */
  readonly reviewQueueSize = computed(() => Object.keys(this.reviewQueue).length);

  /** Questions that graduated out of the queue — a lifetime total. */
  readonly reviewMastered = computed(() => loadMastered().length);

  // --- coding tasks ---

  /** Briefs completed, per the Coding-Task Simulator's checklist gate. */
  readonly tasksDone = computed(
    () => Object.values(this.taskStates).filter((s) => s.done).length,
  );

  /** Completed briefs as a percentage of {@link tasksTotal}. */
  readonly tasksPercent = computed(() =>
    this.tasksTotal === 0 ? 0 : Math.round((this.tasksDone() / this.tasksTotal) * 100),
  );

  // --- achievements ---

  /**
   * The stats snapshot every badge predicate is evaluated against. Assembling
   * it here is what lets `core/achievements.ts` stay pure data with no
   * knowledge of where any of it came from.
   */
  private readonly achievementStats = computed<AchievementStats>(() => ({
    lessonsVisited: this.lessonsVisited(),
    lessonsBuilt: this.lessonsBuilt,
    practiceAnswered: this.practiceAnswered(),
    practiceCorrect: this.practiceCorrect(),
    examsPassed: this.passCount(),
    bestExam: this.bestExam(),
    streakLongest: this.streak.longest(),
    bookmarksCount: this.bookmarksService.count(),
    tasksDone: this.tasksDone(),
    reviewMastered: this.reviewMastered(),
  }));
  /**
   * Every badge with its unlock state and progress resolved against the
   * current stats. Recomputed rather than stored, so a badge added to the
   * catalogue is immediately correct for past activity.
   */
  readonly achievements = computed(() => {
    const stats = this.achievementStats();
    return ACHIEVEMENTS.map((a) => ({
      id: a.id,
      icon: a.icon,
      title: a.title,
      description: a.description,
      unlocked: a.unlocked(stats),
      progress: a.progress(stats),
    }));
  });
  /** How many badges are earned — the "7 of 12" header on the achievements grid. */
  readonly unlockedCount = computed(() => this.achievements().filter((a) => a.unlocked).length);

  /** Downloads a Markdown snapshot of the whole dashboard — every section on the page, in the same order. */
  exportReport(): void {
    const when = Date.now();
    const lines: string[] = [];

    lines.push(`# Angular Study Progress Report — ${new Date(when).toLocaleString()}`, '');
    lines.push(`**Readiness score:** ${this.readinessScore()}/100 — ${this.readinessGrade()}`);
    lines.push(`${this.totalAnswered()} total questions faced · ${this.examPassRate()}% exam pass rate · ${this.reviewMastered()} mastered via review`);
    if (this.strongestCategory()) lines.push(`Strongest: ${this.strongestCategory()!.label} (${this.strongestCategory()!.percent}%)`);
    if (this.weakestCategory()) lines.push(`Focus area: ${this.weakestCategory()!.label} (${this.weakestCategory()!.percent}%)`);
    lines.push('');

    lines.push('## Lessons', '');
    lines.push(`${this.lessonsVisited()} of ${this.lessonsBuilt} visited (${this.lessonsPercent()}%)`, '');

    lines.push('## Review queue', '');
    lines.push(`Due now: ${this.reviewDue()} · In queue: ${this.reviewQueueSize()} · Mastered: ${this.reviewMastered()}`, '');

    lines.push('## Exam-Day readiness checks', '');
    if (this.readinessChecks().length === 0) {
      lines.push('No readiness checks run yet.', '');
    } else {
      for (const check of this.readinessChecks()) {
        lines.push(`- ${new Date(check.when).toLocaleString()} — exam ${check.examScore}% · tasks ${check.tasksDone}/${check.tasksTotal} — ${check.ready ? 'READY' : 'NOT YET'}`);
      }
      lines.push('');
    }

    lines.push('## Coding tasks', '');
    lines.push(`${this.tasksDone()} of ${this.tasksTotal} completed (${this.tasksPercent()}%)`, '');

    lines.push('## Practice challenges', '');
    lines.push(`${this.practiceAnswered()} of ${this.challengeTotal} answered · ${this.practiceCorrect()} correct (${this.practiceAccuracy()}%) · bank coverage ${this.practiceCoverage()}%`, '');
    if (this.categoryStats().length > 0) {
      lines.push('Accuracy by category (answered questions only):', '');
      for (const cat of this.categoryStats()) {
        lines.push(`- ${cat.label}: ${cat.correct}/${cat.total} (${cat.percent}%)`);
      }
      lines.push('');
    }

    lines.push('## Mock exams', '');
    if (this.examAttempts().length === 0) {
      lines.push('No mock exams taken yet.', '');
    } else {
      lines.push(`${this.examAttempts().length} attempts · best ${this.bestExam()}% · average ${this.avgExam()}% · ${this.passCount()} passed`, '');
      for (const attempt of this.examAttempts()) {
        lines.push(`- ${new Date(attempt.when).toLocaleString()} — ${attempt.correct}/${attempt.total} (${attempt.scorePercent}%) — ${attempt.passed ? 'PASS' : 'FAIL'}`);
      }
      lines.push('');
      if (this.weakCategories().length > 0) {
        lines.push(`Weak areas across attempts (<${this.weakThreshold}% on ${this.weakMinSample}+ questions):`, '');
        for (const weak of this.weakCategories()) {
          lines.push(`- ${weak.label}: ${weak.percent}%`);
        }
        lines.push('');
      }
    }

    const stamp = new Date(when).toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadTextFile(`progress-report_${stamp}.md`, lines.join('\n'));
  }

  /** Display labels matching the filter chips on the Practice/Mock Exam pages. */
  private categoryLabel(id: string): string {
    const labels: Record<string, string> = {
      components: 'Components', templates: 'Templates & HTML', styling: 'Styling & CSS',
      signals: 'Signals', rxjs: 'RxJS', forms: 'Forms',
      routing: 'Routing', testing: 'Testing', performance: 'Performance',
      typescript: 'TypeScript', security: 'Security', a11y: 'Accessibility',
      state: 'State & Architecture', i18n: 'i18n', tooling: 'Tooling & Config',
    };
    return labels[id] ?? id;
  }
}
