import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OptionsShuffler } from './practice-helpers';
import { CATEGORY_FILTERS, CHALLENGES, DIFF_FILTERS, shuffle, type Challenge, type Category, type ChallengeType, type Difficulty } from './practice-data';
import { dueCount, loadQueue, recordMisses } from './review-queue';

/** Per-challenge progress, keyed by challenge id so it survives the per-session shuffle. */
type PracticeStates = Record<number, { selected: number | null; answered: boolean; correct: boolean; expanded: boolean }>;

/** localStorage key for persisted Practice progress (bump the suffix to invalidate old data). */
const PROGRESS_KEY = 'angular-practice-progress-v1';

/** Load saved progress; returns {} when storage is unavailable (SSR/private mode) or corrupt. */
function loadProgress(): PracticeStates {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as PracticeStates) : {};
  } catch {
    return {};
  }
}

/** Persist progress, swallowing quota/permission errors so the UI never breaks on a write. */
function saveProgress(states: PracticeStates): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(states));
  } catch {
    // ignore — storage full or blocked
  }
}

@Component({
  selector: 'app-practice',
  imports: [RouterLink],
  styles: [`
    .practice-hero { text-align: center; padding: 48px 24px 32px; }
    .practice-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .practice-hero p { max-width: 640px; margin: 0 auto 16px; color: var(--text-muted); }
    .exam-cta { display: inline-block; margin: 0 6px 24px; padding: 9px 20px; border-radius: 20px; background: #6366f1; color: #fff; font-size: .88rem; font-weight: 600; text-decoration: none; }
    .exam-cta:hover { filter: brightness(1.08); }
    .review-cta { background: transparent; border: 1px solid #6366f1; color: #6366f1; }
    .stats-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
    .stat-box { text-align: center; padding: 12px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
    .stat-box strong { display: block; font-size: 1.6rem; }
    .stat-box span { font-size: .82rem; color: var(--text-muted); }
    .filters { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 24px 16px; max-width: 900px; margin: 0 auto; }
    .filters button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .84rem; color: var(--text); }
    .filters button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .challenges { max-width: 900px; margin: 0 auto; padding: 0 24px 60px; display: flex; flex-direction: column; gap: 16px; }
    .challenge-card { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); }
    .challenge-card.answered-correct { border-color: #22c55e; }
    .challenge-card.answered-wrong { border-color: #ef4444; }
    .ch-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px 12px; cursor: pointer; }
    .ch-badges { display: flex; gap: 6px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-type { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
    .ch-question { font-weight: 500; font-size: .95rem; flex: 1; }
    .ch-number { font-size: .82rem; color: var(--text-muted); flex-shrink: 0; margin-left: auto; }
    .ch-body { padding: 0 20px 16px; }
    .ch-code { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .82rem; font-family: monospace; white-space: pre-wrap; margin: 10px 0; overflow-x: auto; }
    .options { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
    .opt { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: .9rem; background: transparent; text-align: left; color: var(--text); transition: background .15s; }
    .opt:hover:not(:disabled) { background: var(--surface); }
    .opt.selected { border-color: #6366f1; background: rgba(99,102,241,.08); }
    .opt.correct { border-color: #22c55e; background: rgba(34,197,94,.1); }
    .opt.wrong { border-color: #ef4444; background: rgba(239,68,68,.1); }
    .opt:disabled { cursor: default; }
    .opt-letter { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: .78rem; font-weight: 600; flex-shrink: 0; }
    .ch-submit { margin: 12px 0 0; padding: 8px 20px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: .9rem; }
    .ch-submit:disabled { opacity: 0.5; cursor: default; }
    .explanation { margin: 12px 0 0; padding: 12px 16px; border-radius: 10px; font-size: .88rem; line-height: 1.5; }
    .explanation.correct { background: rgba(34,197,94,.1); border: 1px solid #22c55e; }
    .explanation.wrong { background: rgba(239,68,68,.08); border: 1px solid #ef4444; }
    .explanation strong { display: block; margin-bottom: 4px; }
    .progress-bar-outer { height: 8px; background: var(--border); border-radius: 4px; margin: 0 24px 16px; max-width: 900px; }
    .progress-bar-inner { height: 100%; background: #22c55e; border-radius: 4px; transition: width .3s; }
    .empty-state { text-align: center; padding: 60px 24px; color: var(--text-muted); }
    .reset-btn { margin: 0 24px 0; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .84rem; color: var(--text); }
  `],
  template: `
    <div class="practice-hero">
      <span class="pill">Interactive Practice</span>
      <h1>Practice Challenges</h1>
      <p>
        424 challenges across all levels — spot bugs, predict output, and answer
        multiple-choice questions. Every answer comes with a full explanation.
        Questions are randomized each session.
      </p>
      <a routerLink="/mock-exam" class="exam-cta">⏱ Try the timed Mock Exam →</a>
      <a routerLink="/review" class="exam-cta review-cta">
        🔁 Review queue{{ reviewDue() > 0 ? ' (' + reviewDue() + ' due)' : '' }}
      </a>
      <a routerLink="/flashcards" class="exam-cta review-cta">🃏 Flashcard drills</a>
      <div class="stats-row">
        <div class="stat-box">
          <strong>{{ totalVisible() }}</strong>
          <span>challenges</span>
        </div>
        <div class="stat-box">
          <strong>{{ answeredCount() }}</strong>
          <span>answered</span>
        </div>
        <div class="stat-box">
          <strong>{{ correctCount() }}</strong>
          <span>correct</span>
        </div>
        <div class="stat-box">
          <strong>{{ scorePercent() }}%</strong>
          <span>score</span>
        </div>
      </div>
    </div>

    <div class="filters">
      @for (cat of categoryFilters; track cat.id) {
        <button [class.active]="activeCategory() === cat.id" (click)="activeCategory.set(cat.id)">
          {{ cat.label }}
        </button>
      }
    </div>

    <div class="filters" style="margin-top:0;padding-top:0">
      @for (d of diffFilters; track d.id) {
        <button [class.active]="activeDiff() === d.id" (click)="activeDiff.set(d.id)">
          {{ d.label }}
        </button>
      }
      <button class="reset-btn" (click)="reshuffle()" style="margin-left:auto">🔀 Shuffle</button>
      @if (answeredCount() > 0) {
        <button class="reset-btn" (click)="reset()">Reset all</button>
      }
    </div>

    @if (answeredCount() > 0) {
      <div style="max-width:900px;margin:0 auto;padding:0 24px 8px">
        <div class="progress-bar-outer" style="margin:0">
          <div class="progress-bar-inner" [style.width]="scorePercent() + '%'"></div>
        </div>
      </div>
    }

    <div class="challenges">
      @if (visibleChallenges().length === 0) {
        <div class="empty-state">No challenges match the selected filters.</div>
      }
      @for (ch of visibleChallenges(); track ch.id) {
        <div class="challenge-card"
          [class.answered-correct]="getState(ch.id).answered && getState(ch.id).correct"
          [class.answered-wrong]="getState(ch.id).answered && !getState(ch.id).correct">

          <div class="ch-header" (click)="toggleExpand(ch.id)">
            <div style="flex:1">
              <div class="ch-badges">
                <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
                <span class="badge-type">{{ typeLabel(ch.type) }}</span>
                <span class="badge-type" style="background:rgba(99,102,241,.1);border-color:#6366f1;color:#6366f1">{{ ch.category }}</span>
              </div>
              <p class="ch-question" style="margin:6px 0 0">{{ ch.question }}</p>
            </div>
            <span class="ch-number">#{{ ch.id }}</span>
          </div>

          @if (isExpanded(ch.id) || getState(ch.id).answered) {
            <div class="ch-body">
              @if (ch.code) {
                <div class="ch-code">{{ ch.code }}</div>
              }

              @if (ch.options) {
                <div class="options">
                  @for (opt of getShuffledChallengeOptions(ch).options; track $index) {
                    <button class="opt"
                      [class.selected]="getState(ch.id).selected === $index && !getState(ch.id).answered"
                      [class.correct]="getState(ch.id).answered && $index === getShuffledChallengeOptions(ch).correctIndex"
                      [class.wrong]="getState(ch.id).answered && getState(ch.id).selected === $index && $index !== getShuffledChallengeOptions(ch).correctIndex"
                      [disabled]="getState(ch.id).answered"
                      (click)="selectOption(ch.id, $index)">
                      <span class="opt-letter">{{ letters[$index] }}</span>
                      {{ opt }}
                    </button>
                  }
                </div>
                @if (!getState(ch.id).answered) {
                  <button class="ch-submit"
                    [disabled]="getState(ch.id).selected === null"
                    (click)="submit(ch)">
                    Submit Answer
                  </button>
                }
              }

              @if (getState(ch.id).answered) {
                <div class="explanation" [class.correct]="getState(ch.id).correct" [class.wrong]="!getState(ch.id).correct">
                  <strong>{{ getState(ch.id).correct ? '✓ Correct!' : '✗ Not quite.' }}</strong>

                  @if (!getState(ch.id).correct) {
                    <div style="margin-top:8px;padding:8px;background:rgba(226,29,72,.08);border-radius:4px;font-size:.85rem">
                      <strong>Correct answer: {{ getCorrectOptionLetter(ch) }}</strong>
                    </div>
                  }

                  <div style="margin-top:12px">
                    {{ ch.explanation }}
                  </div>

                  @if (ch.topicPath) {
                    <a [routerLink]="'/' + ch.topicPath" target="_blank" style="display:inline-block;margin-top:12px;font-size:.82rem;color:var(--blue);text-decoration:underline">
                      📚 Study this topic in detail →
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class Practice {
  private readonly states = signal<PracticeStates>(loadProgress());
  private readonly shuffledAll = signal(shuffle(CHALLENGES));
  private readonly optionsShuffler = new OptionsShuffler();

  /** How many spaced-repetition items are due — shown on the Review CTA. */
  readonly reviewDue = signal(dueCount(loadQueue()));

  constructor() {
    // Persist progress to localStorage whenever it changes (keyed by challenge id).
    effect(() => saveProgress(this.states()));
  }

  readonly activeCategory = signal<Category>('all');
  readonly activeDiff = signal<'all' | Difficulty>('all');

  readonly visibleChallenges = computed(() => {
    const cat = this.activeCategory();
    const diff = this.activeDiff();
    return this.shuffledAll().filter((c) => {
      const catOk = cat === 'all' || c.category === cat;
      const diffOk = diff === 'all' || c.difficulty === diff;
      return catOk && diffOk;
    });
  });

  readonly totalVisible = computed(() => this.visibleChallenges().length);

  readonly answeredCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered).length,
  );
  readonly correctCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered && s.correct).length,
  );
  readonly scorePercent = computed(() => {
    const total = this.answeredCount();
    return total === 0 ? 0 : Math.round((this.correctCount() / total) * 100);
  });

  readonly letters = ['A', 'B', 'C', 'D'];

  readonly categoryFilters = CATEGORY_FILTERS;
  readonly diffFilters = DIFF_FILTERS;

  /**
   * Get shuffled options for a challenge
   * Options are shuffled once per session and reused for consistency
   */
  getShuffledChallengeOptions(ch: Challenge) {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.optionsShuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  /**
   * Check if the selected option is correct (accounting for shuffled positions)
   */
  isAnswerCorrect(ch: Challenge, selectedIndex: number): boolean {
    if (!ch.options) return false;
    const shuffled = this.getShuffledChallengeOptions(ch);
    return selectedIndex === shuffled.correctIndex;
  }

  /**
   * Get the correct option letter for display (A, B, C, D)
   */
  getCorrectOptionLetter(ch: Challenge): string {
    if (!ch.options) return '';
    const shuffled = this.getShuffledChallengeOptions(ch);
    return this.letters[shuffled.correctIndex] || '';
  }

  getState(id: number) {
    return this.states()[id] ?? { selected: null, answered: false, correct: false, expanded: false };
  }

  isExpanded(id: number) {
    return this.getState(id).expanded;
  }

  toggleExpand(id: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, expanded: !cur.expanded } }));
  }

  selectOption(id: number, index: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, selected: index } }));
  }

  submit(ch: Challenge) {
    const cur = this.getState(ch.id);
    if (cur.answered || cur.selected === null) return;
    const correct = this.isAnswerCorrect(ch, cur.selected);
    this.states.update((s) => ({
      ...s,
      [ch.id]: { ...cur, answered: true, correct, expanded: true },
    }));
    if (!correct) {
      // Feed the spaced-repetition queue so /review resurfaces this later.
      this.reviewDue.set(dueCount(recordMisses([ch.id])));
    }
  }

  reset() {
    this.states.set({});
  }

  reshuffle() {
    this.shuffledAll.set(shuffle(CHALLENGES));
    this.states.set({});
    this.optionsShuffler.reset();  // Reset option shuffles when reshuffling questions
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
