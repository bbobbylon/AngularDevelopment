import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CURRICULUM } from '../../core/curriculum';
import { ProgressService } from '../../core/progress.service';
import { CHALLENGES, type Category } from '../practice/practice-data';
import { dueCount, loadMastered, loadQueue } from '../practice/review-queue';
import { CODING_TASKS } from '../coding-tasks/coding-tasks-data';

/**
 * Progress Dashboard — one read-only page aggregating every study store in the
 * app so the "am I ready?" question has a single answer. It writes nothing;
 * each section deep-links to the page that owns the underlying store.
 *
 * Sources (all localStorage, read once at construction — the dashboard is a
 * snapshot, refreshed on navigation):
 *   - Lessons visited        — ProgressService (`core/progress.service.ts`)
 *   - Practice progress      — `angular-practice-progress-v1` (owner: practice.ts)
 *   - Mock exam history      — `angular-mock-exam-history-v1` (owner: mock-exam.ts)
 *   - Spaced-repetition      — shared store in `../practice/review-queue.ts`
 *   - Coding tasks           — `angular-coding-tasks-v1` (owner: coding-tasks.ts)
 *
 * The practice/mock-exam keys and shapes are duplicated here as narrow local
 * types on purpose: importing the owning COMPONENT files for a constant would
 * couple lazy chunks together, and all readers already tolerate missing or
 * corrupt data. If a key's -v suffix is ever bumped, update it here too.
 */
interface PracticeState { answered: boolean; correct: boolean; }
interface ReadinessEntry {
  when: number;
  examScore: number;
  tasksDone: number;
  tasksTotal: number;
  ready: boolean;
}
interface ExamAttempt {
  when: number;
  scorePercent: number;
  correct: number;
  total: number;
  passed: boolean;
  categories?: Record<string, { correct: number; total: number }>;
}

const PRACTICE_KEY = 'angular-practice-progress-v1';
const EXAM_HISTORY_KEY = 'angular-mock-exam-history-v1';
const CODING_TASKS_KEY = 'angular-coding-tasks-v1';
const EXAM_DAY_HISTORY_KEY = 'angular-exam-day-history-v1';

/** Minimum questions seen in a category across exams before it can be called weak. */
const WEAK_MIN_SAMPLE = 3;
const WEAK_THRESHOLD = 70;

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

@Component({
  selector: 'app-progress',
  imports: [RouterLink, DatePipe],
  styles: [`
    .pg-hero { text-align: center; padding: 48px 24px 24px; }
    .pg-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .pg-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

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
  `],
  template: `
    <div class="pg-hero">
      <span class="pill">Your Journey</span>
      <h1>Progress Dashboard</h1>
      <p>
        Everything you have studied, answered, drilled and built — in one place.
        Each section links to the tool that owns it.
      </p>
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
    </div>
  `,
})
export class Progress {
  private readonly lessonProgress = inject(ProgressService);

  // --- static denominators ---
  readonly lessonsBuilt = CURRICULUM.filter((l) => l.loadComponent).length;
  readonly challengeTotal = CHALLENGES.length;
  readonly tasksTotal = CODING_TASKS.length;
  readonly weakThreshold = WEAK_THRESHOLD;
  readonly weakMinSample = WEAK_MIN_SAMPLE;

  // --- snapshot reads (localStorage is not reactive; navigation refreshes) ---
  private readonly practiceStates = readJson<Record<number, PracticeState>>(PRACTICE_KEY, {});
  readonly examAttempts = computed(() => readJson<ExamAttempt[]>(EXAM_HISTORY_KEY, []));
  private readonly taskStates = readJson<Record<number, { done?: boolean }>>(CODING_TASKS_KEY, {});
  private readonly reviewQueue = loadQueue();

  // --- lessons ---
  readonly lessonsVisited = computed(() => this.lessonProgress.visitedCount());
  readonly lessonsPercent = computed(() =>
    this.lessonsBuilt === 0 ? 0 : Math.round((this.lessonsVisited() / this.lessonsBuilt) * 100),
  );

  // --- practice ---
  readonly practiceAnswered = computed(
    () => Object.values(this.practiceStates).filter((s) => s.answered).length,
  );
  readonly practiceCorrect = computed(
    () => Object.values(this.practiceStates).filter((s) => s.answered && s.correct).length,
  );
  readonly practiceAccuracy = computed(() => {
    const answered = this.practiceAnswered();
    return answered === 0 ? 0 : Math.round((this.practiceCorrect() / answered) * 100);
  });
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
  readonly bestExam = computed(() =>
    this.examAttempts().reduce((best, a) => Math.max(best, a.scorePercent), 0),
  );
  readonly avgExam = computed(() => {
    const attempts = this.examAttempts();
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length);
  });
  readonly passCount = computed(() => this.examAttempts().filter((a) => a.passed).length);
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
  readonly ringCircumference = 2 * Math.PI * 52;

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

  readonly ringOffset = computed(
    () => this.ringCircumference * (1 - this.readinessScore() / 100),
  );

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
  readonly examPassRate = computed(() => {
    const attempts = this.examAttempts();
    return attempts.length === 0 ? 0 : Math.round((this.passCount() / attempts.length) * 100);
  });
  /** Best/worst practice category with a meaningful sample (3+ answered). */
  readonly strongestCategory = computed(() => {
    const qualified = this.categoryStats().filter((c) => c.total >= 3);
    return qualified.length === 0 ? null : qualified[qualified.length - 1];
  });
  readonly weakestCategory = computed(() => {
    const qualified = this.categoryStats().filter((c) => c.total >= 3);
    // categoryStats is sorted worst-first; only flag a real weakness.
    return qualified.length === 0 || qualified[0].percent >= 70 ? null : qualified[0];
  });

  // --- exam-day readiness ---
  readonly readinessChecks = computed(() => readJson<ReadinessEntry[]>(EXAM_DAY_HISTORY_KEY, []));
  readonly recentReadiness = computed(() => this.readinessChecks().slice(0, 3));

  // --- review queue ---
  readonly reviewDue = computed(() => dueCount(this.reviewQueue));
  readonly reviewQueueSize = computed(() => Object.keys(this.reviewQueue).length);
  readonly reviewMastered = computed(() => loadMastered().length);

  // --- coding tasks ---
  readonly tasksDone = computed(
    () => Object.values(this.taskStates).filter((s) => s.done).length,
  );
  readonly tasksPercent = computed(() =>
    this.tasksTotal === 0 ? 0 : Math.round((this.tasksDone() / this.tasksTotal) * 100),
  );

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
