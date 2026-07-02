import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CHALLENGES,
  shuffle,
  type Challenge,
  type Category,
  type ChallengeType,
  type Difficulty,
} from '../practice/practice-data';
import { OptionsShuffler } from '../practice/practice-helpers';

/**
 * Timed Mock Exam — a certification-style assessment built on top of the shared
 * challenge bank (see `../practice/practice-data.ts`).
 *
 * It is a three-phase state machine driven by signals:
 *   - `config`  — choose count / focus category / level; time is derived.
 *   - `active`  — one question at a time, a live countdown, a question navigator,
 *                 flag-for-review, and NO answer feedback (unlike the Practice page).
 *                 Auto-submits when the clock hits zero.
 *   - `review`  — pass/fail, score, time used, and a per-question breakdown with the
 *                 correct answer and full explanation.
 *
 * Options are shuffled once per exam via the same `OptionsShuffler` the Practice
 * page uses, so answer positions are randomized but stable across navigation.
 */
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
}

/** localStorage key for past exam results (bump the suffix to invalidate old data). */
const HISTORY_KEY = 'angular-mock-exam-history-v1';
/** Keep only the most recent attempts so storage stays bounded. */
const HISTORY_LIMIT = 20;

/** Load past attempts; returns [] when storage is unavailable (SSR/private mode) or corrupt. */
function loadHistory(): HistoryEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Persist attempts, swallowing quota/permission errors so the UI never breaks on a write. */
function saveHistory(entries: HistoryEntry[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore — storage full or blocked
  }
}

@Component({
  selector: 'app-mock-exam',
  imports: [RouterLink],
  styles: [`
    .exam-hero { text-align: center; padding: 48px 24px 24px; }
    .exam-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .exam-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .config-card, .q-card, .review-card, .history-section, .breakdown { max-width: 760px; margin: 0 auto; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
    .config-card { padding: 24px 28px 28px; }
    .config-card h3, .history-head h3, .breakdown h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin: 20px 0 10px; }
    .config-card h3:first-child { margin-top: 0; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: .84rem; color: var(--text); }
    .chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .config-summary { display: flex; gap: 28px; margin: 24px 0 8px; padding: 16px 0; border-top: 1px solid var(--border); }
    .config-summary strong { font-size: 1.5rem; display: block; }
    .config-summary span { font-size: .8rem; color: var(--text-muted); }
    .warn { color: #b45309; font-size: .86rem; margin: 8px 0 0; }

    .primary-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 11px 24px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .primary-btn:disabled { opacity: .5; cursor: default; }
    .primary-btn.small { padding: 8px 18px; font-size: .88rem; margin-top: 0; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }
    .ghost-btn:disabled { opacity: .4; cursor: default; }
    .link-back { display: inline-block; margin-left: 16px; font-size: .84rem; color: var(--blue); text-decoration: underline; }

    .exam-bar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 16px; max-width: 760px; margin: 0 auto; padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .exam-progress { font-weight: 600; font-size: .9rem; }
    .timer { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 1.05rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.1); color: #6366f1; }
    .timer.warn { background: rgba(239,68,68,.12); color: #ef4444; animation: pulse 1s infinite; }
    @keyframes pulse { 50% { opacity: .55; } }
    .submit-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid #ef4444; background: transparent; color: #ef4444; cursor: pointer; font-size: .84rem; font-weight: 600; }

    .nav-grid { display: flex; flex-wrap: wrap; gap: 6px; max-width: 760px; margin: 16px auto 8px; padding: 0 24px; }
    .nav-dot { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .78rem; color: var(--text-muted); }
    .nav-dot.done { background: rgba(99,102,241,.15); color: #6366f1; border-color: #6366f1; }
    .nav-dot.current { outline: 2px solid #6366f1; outline-offset: 1px; color: var(--text); font-weight: 700; }
    .nav-dot.flag { border-color: #f59e0b; box-shadow: inset 0 -3px 0 #f59e0b; }

    .q-card { padding: 24px 28px; margin-top: 12px; }
    .q-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-type { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(99,102,241,.1); border: 1px solid #6366f1; color: #6366f1; text-transform: capitalize; }
    .flag-btn { margin-left: auto; padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: .78rem; color: var(--text-muted); }
    .flag-btn.on { border-color: #f59e0b; color: #b45309; }
    .q-text { font-weight: 500; font-size: 1.02rem; margin: 0 0 14px; line-height: 1.5; }
    .q-code { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .82rem; font-family: monospace; white-space: pre-wrap; margin: 0 0 14px; overflow-x: auto; }
    .options { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 16px; }
    .opt { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: .9rem; background: transparent; text-align: left; color: var(--text); }
    .opt:hover:not(:disabled) { background: rgba(99,102,241,.05); }
    .opt.selected { border-color: #6366f1; background: rgba(99,102,241,.1); }
    .opt.correct { border-color: #22c55e; background: rgba(34,197,94,.12); }
    .opt.wrong { border-color: #ef4444; background: rgba(239,68,68,.1); }
    .opt:disabled { cursor: default; }
    .opt-letter { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 600; flex-shrink: 0; }
    .q-actions { display: flex; justify-content: space-between; gap: 12px; }

    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 20; padding: 24px; }
    .confirm-box { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; max-width: 380px; text-align: center; }
    .confirm-box h3 { margin: 0 0 8px; }
    .confirm-box p { color: var(--text-muted); font-size: .88rem; margin: 0 0 18px; }
    .confirm-actions { display: flex; gap: 10px; justify-content: center; }

    .result-hero { max-width: 760px; margin: 40px auto 0; text-align: center; padding: 36px 24px; border-radius: 20px; border: 1px solid var(--border); }
    .result-hero.pass { background: rgba(34,197,94,.08); border-color: #22c55e; }
    .result-hero.fail { background: rgba(239,68,68,.06); border-color: #ef4444; }
    .result-badge { display: inline-block; font-size: .8rem; font-weight: 700; letter-spacing: .08em; padding: 5px 16px; border-radius: 20px; }
    .result-hero.pass .result-badge { background: #22c55e; color: #fff; }
    .result-hero.fail .result-badge { background: #ef4444; color: #fff; }
    .result-score { font-size: 3.2rem; font-weight: 800; margin: 12px 0 4px; }
    .result-hero p { color: var(--text-muted); margin: 0 0 20px; }
    .result-actions { display: flex; align-items: center; justify-content: center; gap: 4px; }

    .review-list { max-width: 760px; margin: 24px auto 60px; display: flex; flex-direction: column; gap: 16px; padding: 0 24px; }
    .review-card { padding: 20px 24px; }
    .review-card.ok { border-left: 4px solid #22c55e; }
    .review-card.no { border-left: 4px solid #ef4444; }
    .rev-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .rev-num { font-weight: 700; font-size: .84rem; }
    .rev-mark { font-weight: 700; }
    .review-card.ok .rev-mark { color: #22c55e; }
    .review-card.no .rev-mark { color: #ef4444; }
    .skipped { font-size: .82rem; color: #b45309; margin: -6px 0 10px; }
    .explanation { margin: 4px 0 0; padding: 12px 16px; border-radius: 10px; font-size: .86rem; line-height: 1.55; background: var(--bg, rgba(127,127,127,.06)); }
    .topic-link { display: inline-block; margin-top: 10px; font-size: .82rem; color: var(--blue); text-decoration: underline; }

    .history-section { margin: 20px auto 60px; padding: 20px 28px; }
    .history-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .history-head h3 { margin: 0; }
    .ghost-btn.small { padding: 4px 12px; font-size: .78rem; }
    .history-row, .bd-row { display: flex; align-items: center; gap: 12px; }
    .history-row { padding: 9px 0; border-top: 1px solid var(--border); font-size: .86rem; }
    .h-result { font-size: .7rem; font-weight: 700; letter-spacing: .06em; padding: 2px 8px; border-radius: 12px; flex-shrink: 0; }
    .h-result.pass { background: rgba(34,197,94,.15); color: #16a34a; }
    .h-result.fail { background: rgba(239,68,68,.12); color: #ef4444; }
    .h-score { font-weight: 700; min-width: 44px; }
    .h-detail { color: var(--text-muted); flex: 1; }
    .h-when { color: var(--text-muted); font-size: .78rem; flex-shrink: 0; }

    .breakdown { margin: 20px auto 0; padding: 20px 28px; }
    .breakdown h3 { margin: 0 0 12px; }
    .bd-row { padding: 5px 0; }
    .bd-label { width: 150px; flex-shrink: 0; font-size: .86rem; text-align: right; }
    .bd-bar-outer { flex: 1; height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
    .bd-bar-inner { height: 100%; background: #22c55e; border-radius: 5px; transition: width .4s; }
    .bd-bar-inner.low { background: #ef4444; }
    .bd-score { width: 44px; flex-shrink: 0; font-size: .84rem; font-variant-numeric: tabular-nums; color: var(--text-muted); }

    .rev-filters { display: flex; gap: 8px; max-width: 760px; margin: 20px auto 0; padding: 0 24px; }
    .rev-empty { text-align: center; color: var(--text-muted); padding: 32px; }

    @media (max-width: 560px) {
      .history-row { flex-wrap: wrap; row-gap: 2px; }
      .h-when { width: 100%; }
      .bd-label { width: 96px; font-size: .78rem; }
      .exam-bar { flex-wrap: wrap; gap: 10px; }
      .timer { margin-left: auto; }
      .submit-btn { order: 3; flex: 1; }
      .config-summary { gap: 18px; }
      .config-card, .q-card, .review-card { border-radius: 12px; }
    }
  `],
  template: `
    @switch (phase()) {

      @case ('config') {
        <div class="exam-hero">
          <span class="pill">Timed Assessment</span>
          <h1>Mock Exam</h1>
          <p>
            Simulate the real certification: a fixed set of questions, a countdown
            clock, and no answers revealed until you finish. Pass mark is {{ passMark }}%.
          </p>
        </div>

        <div class="config-card">
          <h3>Number of questions</h3>
          <div class="chip-row">
            @for (n of countChoices; track n) {
              <button class="chip" [class.active]="selectedCount() === n" (click)="selectedCount.set(n)">{{ n }}</button>
            }
            <button class="chip" [class.active]="selectedCount() === totalAvailable" (click)="selectedCount.set(totalAvailable)">
              All ({{ totalAvailable }})
            </button>
          </div>

          <h3>Focus area</h3>
          <div class="chip-row">
            @for (cat of categoryFilters; track cat.id) {
              <button class="chip" [class.active]="selectedCategory() === cat.id" (click)="selectedCategory.set(cat.id)">{{ cat.label }}</button>
            }
          </div>

          <h3>Level</h3>
          <div class="chip-row">
            @for (d of diffFilters; track d.id) {
              <button class="chip" [class.active]="selectedDiff() === d.id" (click)="selectedDiff.set(d.id)">{{ d.label }}</button>
            }
          </div>

          <div class="config-summary">
            <div><strong>{{ effectiveCount() }}</strong><span>questions</span></div>
            <div><strong>{{ totalMinutes() }}</strong><span>minutes</span></div>
            <div><strong>{{ passMark }}%</strong><span>to pass</span></div>
          </div>

          @if (availableForFilters().length === 0) {
            <p class="warn">No questions match those filters — widen your selection.</p>
          } @else if (effectiveCount() < selectedCount() && selectedCount() !== totalAvailable) {
            <p class="warn">Only {{ effectiveCount() }} questions available for this focus/level.</p>
          }

          <div>
            <button class="primary-btn" [disabled]="effectiveCount() === 0" (click)="start()">Start Exam →</button>
            <a routerLink="/practice" class="link-back">or use self-paced Practice</a>
          </div>
        </div>

        @if (history().length > 0) {
          <div class="history-section">
            <div class="history-head">
              <h3>Previous attempts</h3>
              <button class="ghost-btn small" (click)="clearHistory()">Clear</button>
            </div>
            @for (h of history(); track h.when) {
              <div class="history-row">
                <span class="h-result" [class.pass]="h.passed" [class.fail]="!h.passed">{{ h.passed ? 'PASS' : 'FAIL' }}</span>
                <span class="h-score">{{ h.scorePercent }}%</span>
                <span class="h-detail">{{ h.correct }}/{{ h.total }} · {{ categoryLabel(h.category) }} · {{ h.difficulty === 'all' ? 'All levels' : h.difficulty }} · {{ formatUsed(h.secondsUsed) }}</span>
                <span class="h-when">{{ formatWhen(h.when) }}</span>
              </div>
            }
          </div>
        }
      }

      @case ('active') {
        <div class="exam-bar">
          <span class="exam-progress">Question {{ currentIndex() + 1 }} / {{ questions().length }}</span>
          <span class="timer" [class.warn]="secondsLeft() <= 60">⏱ {{ timeLabel() }}</span>
          <button class="submit-btn" (click)="requestFinish()">Submit Exam</button>
        </div>

        <div class="nav-grid">
          @for (q of questions(); track q.id; let i = $index) {
            <button class="nav-dot"
              [class.current]="i === currentIndex()"
              [class.done]="isAnswered(q.id)"
              [class.flag]="isFlagged(q.id)"
              (click)="goTo(i)">{{ i + 1 }}</button>
          }
        </div>

        @if (current(); as ch) {
          <div class="q-card">
            <div class="q-badges">
              <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
              <span class="badge-type">{{ ch.category }}</span>
              <button class="flag-btn" [class.on]="isFlagged(ch.id)" (click)="toggleFlag()">
                {{ isFlagged(ch.id) ? '🚩 Flagged' : '⚑ Flag' }}
              </button>
            </div>

            <p class="q-text">{{ ch.question }}</p>
            @if (ch.code) { <div class="q-code">{{ ch.code }}</div> }

            <div class="options">
              @for (opt of shuffledOptions(ch).options; track $index) {
                <button class="opt" [class.selected]="isChosen($index)" (click)="choose($index)">
                  <span class="opt-letter">{{ letters[$index] }}</span>{{ opt }}
                </button>
              }
            </div>

            <div class="q-actions">
              <button class="ghost-btn" [disabled]="currentIndex() === 0" (click)="prev()">← Previous</button>
              @if (currentIndex() < questions().length - 1) {
                <button class="primary-btn small" (click)="next()">Next →</button>
              } @else {
                <button class="primary-btn small" (click)="requestFinish()">Finish →</button>
              }
            </div>
          </div>
        }

        @if (confirmingSubmit()) {
          <div class="confirm-overlay">
            <div class="confirm-box">
              <h3>Submit exam?</h3>
              <p>
                {{ answeredCount() }} of {{ questions().length }} answered.
                @if (answeredCount() < questions().length) { {{ questions().length - answeredCount() }} still blank. }
              </p>
              <div class="confirm-actions">
                <button class="ghost-btn" (click)="cancelFinish()">Keep going</button>
                <button class="primary-btn small" (click)="finish()">Submit now</button>
              </div>
            </div>
          </div>
        }
      }

      @case ('review') {
        <div class="result-hero" [class.pass]="passed()" [class.fail]="!passed()">
          <span class="result-badge">{{ passed() ? 'PASS' : 'FAIL' }}</span>
          <div class="result-score">{{ scorePercent() }}%</div>
          <p>{{ correctCount() }} / {{ questions().length }} correct · {{ elapsedLabel() }} used · pass mark {{ passMark }}%</p>
          <div class="result-actions">
            <button class="primary-btn" (click)="retake()">Take Another →</button>
            <a routerLink="/practice" class="link-back">Self-paced Practice</a>
          </div>
        </div>

        @if (categoryBreakdown().length > 1) {
          <div class="breakdown">
            <h3>By category</h3>
            @for (row of categoryBreakdown(); track row.id) {
              <div class="bd-row">
                <span class="bd-label">{{ row.label }}</span>
                <div class="bd-bar-outer">
                  <div class="bd-bar-inner" [class.low]="row.pct < passMark" [style.width.%]="row.pct"></div>
                </div>
                <span class="bd-score">{{ row.correct }}/{{ row.total }}</span>
              </div>
            }
          </div>
        }

        <div class="rev-filters">
          <button class="chip" [class.active]="reviewFilter() === 'all'" (click)="reviewFilter.set('all')">
            All ({{ questions().length }})
          </button>
          <button class="chip" [class.active]="reviewFilter() === 'incorrect'" (click)="reviewFilter.set('incorrect')">
            ✗ Incorrect ({{ incorrectTotal() }})
          </button>
          @if (flaggedTotal() > 0) {
            <button class="chip" [class.active]="reviewFilter() === 'flagged'" (click)="reviewFilter.set('flagged')">
              🚩 Flagged ({{ flaggedTotal() }})
            </button>
          }
        </div>

        <div class="review-list">
          @if (reviewItems().length === 0) {
            <div class="rev-empty">Nothing here — {{ reviewFilter() === 'incorrect' ? 'every answer was correct 🎉' : 'no questions were flagged' }}.</div>
          }
          @for (item of reviewItems(); track item.ch.id) {
            @let ch = item.ch;
            @let i = item.i;
            <div class="review-card" [class.ok]="isCorrect(ch)" [class.no]="!isCorrect(ch)">
              <div class="rev-head">
                <span class="rev-num">Q{{ i + 1 }}</span>
                <span class="rev-mark">{{ isCorrect(ch) ? '✓' : '✗' }}</span>
                <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
                <span class="badge-type">{{ ch.category }}</span>
              </div>

              <p class="q-text">{{ ch.question }}</p>
              @if (ch.code) { <div class="q-code">{{ ch.code }}</div> }

              <div class="options">
                @for (opt of shuffledOptions(ch).options; track $index) {
                  <button class="opt"
                    [class.correct]="$index === shuffledOptions(ch).correctIndex"
                    [class.wrong]="answers()[ch.id] === $index && $index !== shuffledOptions(ch).correctIndex"
                    disabled>
                    <span class="opt-letter">{{ letters[$index] }}</span>{{ opt }}
                  </button>
                }
              </div>

              @if (!isAnswered(ch.id)) { <div class="skipped">Not answered</div> }

              <div class="explanation">{{ ch.explanation }}</div>
              @if (ch.topicPath) {
                <a [routerLink]="'/' + ch.topicPath" class="topic-link">📚 Study this topic →</a>
              }
            </div>
          }
        </div>
      }
    }
  `,
})
export class MockExam implements OnDestroy {
  private readonly shuffler = new OptionsShuffler();
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly letters = ['A', 'B', 'C', 'D'];
  readonly passMark = PASS_MARK;
  readonly totalAvailable = CHALLENGES.length;
  readonly countChoices = [10, 20, 30];

  readonly phase = signal<Phase>('config');

  // --- config selections ---
  readonly selectedCount = signal<number>(20);
  readonly selectedCategory = signal<Category>('all');
  readonly selectedDiff = signal<'all' | Difficulty>('all');

  readonly categoryFilters: { id: Category; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'components', label: 'Components' },
    { id: 'signals', label: 'Signals' },
    { id: 'rxjs', label: 'RxJS' },
    { id: 'forms', label: 'Forms' },
    { id: 'routing', label: 'Routing' },
    { id: 'testing', label: 'Testing' },
    { id: 'performance', label: 'Performance' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'security', label: 'Security' },
    { id: 'a11y', label: 'Accessibility' },
    { id: 'state', label: 'State & Architecture' },
    { id: 'i18n', label: 'i18n' },
  ];

  readonly diffFilters: { id: 'all' | Difficulty; label: string }[] = [
    { id: 'all', label: 'All levels' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid', label: 'Mid' },
    { id: 'senior', label: 'Senior' },
  ];

  /** Challenges matching the current focus/level selections. */
  readonly availableForFilters = computed(() => {
    const cat = this.selectedCategory();
    const diff = this.selectedDiff();
    return CHALLENGES.filter(
      (c) => (cat === 'all' || c.category === cat) && (diff === 'all' || c.difficulty === diff),
    );
  });
  /** Requested count clamped to what the filters can actually supply. */
  readonly effectiveCount = computed(() => Math.min(this.selectedCount(), this.availableForFilters().length));
  readonly totalSeconds = computed(() => this.effectiveCount() * SECONDS_PER_QUESTION);
  readonly totalMinutes = computed(() => Math.round(this.totalSeconds() / 60));

  // --- active exam state ---
  readonly questions = signal<Challenge[]>([]);
  readonly currentIndex = signal(0);
  readonly answers = signal<Record<number, number | null>>({});
  readonly flagged = signal<Record<number, boolean>>({});
  readonly secondsLeft = signal(0);
  private readonly examTotalSeconds = signal(0);
  readonly confirmingSubmit = signal(false);

  readonly current = computed(() => this.questions()[this.currentIndex()]);
  readonly timeLabel = computed(() => formatClock(this.secondsLeft()));
  readonly elapsedLabel = computed(() => formatClock(this.examTotalSeconds() - this.secondsLeft()));
  readonly answeredCount = computed(
    () => this.questions().filter((q) => this.isAnswered(q.id)).length,
  );

  // --- review results ---
  readonly correctCount = computed(() => this.questions().filter((ch) => this.isCorrect(ch)).length);
  readonly scorePercent = computed(() => {
    const n = this.questions().length;
    return n === 0 ? 0 : Math.round((this.correctCount() / n) * 100);
  });
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
  readonly incorrectTotal = computed(() => this.questions().filter((ch) => !this.isCorrect(ch)).length);
  readonly flaggedTotal = computed(() => this.questions().filter((ch) => this.isFlagged(ch.id)).length);

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
  readonly history = signal<HistoryEntry[]>(loadHistory());

  clearHistory(): void {
    this.history.set([]);
    saveHistory([]);
  }

  formatWhen(when: number): string {
    return new Date(when).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  formatUsed(seconds: number): string {
    return formatClock(seconds);
  }

  categoryLabel(id: Category): string {
    return this.categoryFilters.find((c) => c.id === id)?.label ?? id;
  }

  // --- lifecycle ---
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

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // --- option helpers (shared shuffle with the Practice page) ---
  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  // --- active interactions ---
  choose(index: number): void {
    const ch = this.current();
    if (!ch) return;
    this.answers.update((a) => ({ ...a, [ch.id]: index }));
  }
  isChosen(index: number): boolean {
    const ch = this.current();
    return ch ? this.answers()[ch.id] === index : false;
  }
  isAnswered(id: number): boolean {
    const v = this.answers()[id];
    return v !== null && v !== undefined;
  }

  toggleFlag(): void {
    const ch = this.current();
    if (!ch) return;
    this.flagged.update((f) => ({ ...f, [ch.id]: !f[ch.id] }));
  }
  isFlagged(id: number): boolean {
    return !!this.flagged()[id];
  }

  next(): void {
    if (this.currentIndex() < this.questions().length - 1) this.currentIndex.update((i) => i + 1);
  }
  prev(): void {
    if (this.currentIndex() > 0) this.currentIndex.update((i) => i - 1);
  }
  goTo(i: number): void {
    this.currentIndex.set(i);
  }

  requestFinish(): void {
    this.confirmingSubmit.set(true);
  }
  cancelFinish(): void {
    this.confirmingSubmit.set(false);
  }
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
    };
    const next = [entry, ...this.history()].slice(0, HISTORY_LIMIT);
    this.history.set(next);
    saveHistory(next);
  }

  // --- scoring ---
  isCorrect(ch: Challenge): boolean {
    const sel = this.answers()[ch.id];
    if (sel === null || sel === undefined) return false;
    return sel === this.shuffledOptions(ch).correctIndex;
  }

  retake(): void {
    this.stopTimer();
    this.secondsLeft.set(0);
    this.phase.set('config');
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

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
