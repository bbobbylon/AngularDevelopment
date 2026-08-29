import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OptionsShuffler } from './practice-helpers';
import { CATEGORY_FILTERS, CHALLENGES, DIFF_FILTERS, shuffle, type Challenge, type Category, type ChallengeType, type Difficulty } from './practice-data';
import { dueCount, loadQueue, recordMisses } from './review-queue';
import { downloadTextFile } from '../../shared/download-file';
import { BookmarksService } from '../../core/bookmarks.service';
import { ToastService } from '../../core/toast.service';
import { STORAGE_KEYS, readJson, writeJson } from '../../core/storage';

/** Per-challenge progress, keyed by challenge id so it survives the per-session shuffle. */
type PracticeStates = Record<number, { selected: number | null; answered: boolean; correct: boolean; expanded: boolean }>;

/** Difficulty tiers in ascending order, so index ±1 is one step harder/easier. */
const DIFF_LEVELS: Difficulty[] = ['junior', 'mid', 'senior'];

/** Consecutive correct answers before the adaptive level steps up one notch. */
const LEVEL_UP_STREAK = 3;

/**
 * Consecutive misses before the adaptive level steps down. Deliberately lower
 * than {@link LEVEL_UP_STREAK}: dropping someone who is struggling should
 * happen faster than promoting someone who is coasting.
 */
const LEVEL_DOWN_STREAK = 2;

/**
 * How many challenge cards are added to the DOM at a time. Roughly two
 * screenfuls on a laptop — enough that the list never looks truncated, small
 * enough that first paint stays instant with a 400+ question bank.
 */
const RENDER_BATCH = 25;

/** Persisted adaptive-difficulty state. */
interface AdaptiveState {
  /** Whether adaptive mode is driving the difficulty filter. */
  enabled: boolean;
  /** The tier currently being served. */
  level: Difficulty;
  /** Signed run length: positive = correct streak, negative = miss streak, 0 = just changed level. */
  streak: number;
}

/** Adaptive mode starts off, at the easiest tier. */
const DEFAULT_ADAPTIVE: AdaptiveState = { enabled: false, level: 'junior', streak: 0 };

/**
 * Reads persisted adaptive state, spread over the defaults so a state object
 * saved before a new field existed still loads cleanly.
 */
function loadAdaptive(): AdaptiveState {
  return { ...DEFAULT_ADAPTIVE, ...readJson<Partial<AdaptiveState>>(STORAGE_KEYS.practiceAdaptive, {}) };
}

/**
 * Practice — the app's main question surface: the whole 400+ challenge bank as
 * a filterable, answerable list with per-card explanations.
 *
 * Unlike the Mock Exam (timed, no feedback) or Flashcards (recall, self-graded),
 * this page is untimed and gives feedback immediately on submit. It is where
 * you *learn* the bank; the other pages are where you test whether you have.
 *
 * ## What it hooks into
 *
 * A wrong answer is pushed into the shared spaced-repetition queue, so `/review`
 * resurfaces it days later. Cards can be starred into {@link BookmarksService}.
 * Answers persist by challenge id, so the page is resumable across reloads.
 *
 * ## Two non-obvious mechanics
 *
 * **Incremental rendering.** Only {@link RENDER_BATCH} cards are in the DOM at
 * a time — see {@link renderLimit} for why the bank cannot be rendered whole.
 *
 * **Adaptive difficulty.** When enabled, the difficulty filter stops being
 * manual and is driven by a rolling streak instead: {@link LEVEL_UP_STREAK}
 * correct in a row promotes a tier, {@link LEVEL_DOWN_STREAK} misses demote
 * one. The point is to keep the questions at the edge of what you can do,
 * which is neither the tier you picked when you were feeling optimistic nor
 * the one you picked when you were not.
 *
 * @see pages/practice/practice-data.ts — the bank.
 * @see pages/practice/review-queue.ts — receives misses.
 */
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
    .reset-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .filters button:disabled { opacity: .45; cursor: default; }
    .adaptive-note { max-width: 900px; margin: -8px auto 16px; padding: 0 24px; font-size: .82rem; color: var(--text-muted); }
    .bookmark-star { background: none; border: none; cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 2px; flex-shrink: 0; color: var(--text-muted); }
    .bookmark-star.starred { color: #f59e0b; }
    .show-more { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; padding: 8px 0 0; }
    .show-more span { font-size: .84rem; color: var(--text-muted); }
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
        <button [class.active]="activeCategory() === cat.id" (click)="setCategory(cat.id)">
          {{ cat.label }}
        </button>
      }
    </div>

    <div class="filters" style="margin-top:0;padding-top:0">
      @for (d of diffFilters; track d.id) {
        <button
          [class.active]="activeDiff() === d.id"
          [disabled]="adaptiveEnabled()"
          (click)="setDifficulty(d.id)">
          {{ d.label }}
        </button>
      }
      <button
        class="reset-btn"
        [class.active]="adaptiveEnabled()"
        (click)="toggleAdaptive()"
        title="Auto-adjust difficulty based on your streak">
        🎚 Adaptive{{ adaptiveEnabled() ? ': ' + adaptiveLevel() : '' }}
      </button>
      <button class="reset-btn" (click)="reshuffle()" style="margin-left:auto">🔀 Shuffle</button>
      @if (answeredCount() > 0) {
        <button class="reset-btn" (click)="exportResults()">⬇ Export results</button>
        <button class="reset-btn" (click)="reset()">Reset all</button>
      }
    </div>

    @if (adaptiveEnabled()) {
      <p class="adaptive-note">
        🎚 Adaptive mode is serving <strong>{{ adaptiveLevel() }}</strong> questions.
        {{ adaptiveStreak() > 0
          ? (levelUpStreak - adaptiveStreak()) + ' more correct in a row to level up.'
          : (adaptiveLevel() === 'senior' ? 'Top level reached.' : 'Answer correctly to climb back up.') }}
      </p>
    }

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
      @for (ch of pagedChallenges(); track ch.id) {
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
            <button
              class="bookmark-star"
              [class.starred]="isBookmarked(ch.id)"
              (click)="toggleBookmark(ch, $event)"
              [attr.aria-label]="isBookmarked(ch.id) ? 'Remove bookmark' : 'Bookmark this question'">
              {{ isBookmarked(ch.id) ? '★' : '☆' }}
            </button>
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

      @if (hiddenCount() > 0) {
        <div class="show-more">
          <span>Showing {{ pagedChallenges().length }} of {{ totalVisible() }}</span>
          <button class="reset-btn" (click)="showMore()">Show more</button>
          <button class="reset-btn" (click)="showAll()">Show all {{ totalVisible() }}</button>
        </div>
      }
    </div>
  `,
})
export class Practice {
  /** Answer state by challenge id, seeded from storage and mirrored back by an
   *  effect in the constructor. */
  private readonly states = signal<PracticeStates>(
    readJson<PracticeStates>(STORAGE_KEYS.practiceProgress, {}),
  );

  /** The bank in this session's order. A signal because {@link reshuffle}
   *  replaces it; shuffled once at construction so the list is not the same
   *  every visit. */
  private readonly shuffledAll = signal(shuffle(CHALLENGES));

  /** Per-session option shuffling, memoized per challenge id. */
  private readonly optionsShuffler = new OptionsShuffler();

  /** Backs the star on each card. */
  private readonly bookmarks = inject(BookmarksService);

  /** Used for the adaptive level-change and bookmark confirmations. */
  private readonly toast = inject(ToastService);

  /** How many spaced-repetition items are due — shown on the Review CTA. */
  readonly reviewDue = signal(dueCount(loadQueue()));

  /**
   * Difficulty adaptation — when enabled, the level (junior/mid/senior) is
   * driven automatically by a rolling correct/miss streak instead of the
   * manual filter buttons: LEVEL_UP_STREAK correct in a row steps up one
   * notch, LEVEL_DOWN_STREAK misses in a row steps down one notch.
   */
  private readonly adaptive = signal<AdaptiveState>(loadAdaptive());

  /** Whether adaptive mode is driving the difficulty filter. */
  readonly adaptiveEnabled = computed(() => this.adaptive().enabled);

  /** The tier adaptive mode is currently serving. */
  readonly adaptiveLevel = computed(() => this.adaptive().level);

  /** The current **correct** run, for the "2 / 3 to level up" indicator. Clamped
   *  at zero: the stored streak goes negative to track misses, but a miss run
   *  has no progress bar to fill. */
  readonly adaptiveStreak = computed(() => Math.max(0, this.adaptive().streak));

  /** {@link LEVEL_UP_STREAK}, so the template can show the target. */
  readonly levelUpStreak = LEVEL_UP_STREAK;

  /** Mirrors answer state and adaptive state to storage whenever either
   *  changes. Two separate effects so a change to one does not rewrite the
   *  other's key. */
  constructor() {
    // Persist progress to localStorage whenever it changes (keyed by challenge id).
    effect(() => writeJson(STORAGE_KEYS.practiceProgress, this.states()));
    effect(() => writeJson(STORAGE_KEYS.practiceAdaptive, this.adaptive()));
  }

  /** Category filter. Set through {@link setCategory}, which also resets paging. */
  readonly activeCategory = signal<Category>('all');

  /** Manual difficulty filter. Ignored while adaptive mode is on. */
  readonly activeDiff = signal<'all' | Difficulty>('all');

  /** Challenges matching the active filters — the full matching set, of which
   *  only {@link pagedChallenges} is rendered. */
  readonly visibleChallenges = computed(() => {
    const cat = this.activeCategory();
    const diff = this.adaptiveEnabled() ? this.adaptiveLevel() : this.activeDiff();
    return this.shuffledAll().filter((c) => {
      const catOk = cat === 'all' || c.category === cat;
      const diffOk = diff === 'all' || c.difficulty === diff;
      return catOk && diffOk;
    });
  });

  /** How many challenges match the filters, rendered or not. */
  readonly totalVisible = computed(() => this.visibleChallenges().length);

  /**
   * How many of {@link visibleChallenges} are actually in the DOM.
   *
   * The bank holds 400+ challenges and an unfiltered page used to render every
   * card at once — each with a code block, four option buttons and an
   * explanation panel. That is tens of thousands of DOM nodes built before
   * first paint, for a list nobody scrolls more than a screen or two into.
   *
   * Rendering in batches keeps the initial cost flat regardless of bank size.
   * Deliberately a "Show more" button rather than `@defer (on viewport)`:
   * the cards are stateful (an answered card must stay answered) and an
   * explicit, testable limit is easier to reason about than a scroll-position
   * trigger. Answer state lives in {@link states}, keyed by challenge id, so a
   * card that has not been rendered yet still restores correctly when it is.
   */
  private readonly renderLimit = signal(RENDER_BATCH);

  /** The slice of {@link visibleChallenges} currently rendered. */
  readonly pagedChallenges = computed(() => this.visibleChallenges().slice(0, this.renderLimit()));

  /** How many matching challenges are filtered in but not yet rendered. */
  readonly hiddenCount = computed(() =>
    Math.max(0, this.visibleChallenges().length - this.pagedChallenges().length),
  );

  /** Renders the next batch. Backs the "Show more" button below the list. */
  showMore(): void {
    this.renderLimit.update((n) => n + RENDER_BATCH);
  }

  /**
   * Renders everything that matches the current filters, for the reader who
   * wants Ctrl-F over the whole set.
   */
  showAll(): void {
    this.renderLimit.set(this.visibleChallenges().length);
  }

  /**
   * Collapses back to the first batch. Called whenever the visible set
   * changes (filter, difficulty, shuffle) — without it, narrowing a filter
   * after expanding to 400 cards would leave the limit uselessly high, and
   * widening one would dump the whole new set into the DOM at once.
   */
  private resetRenderLimit(): void {
    this.renderLimit.set(RENDER_BATCH);
  }

  /** Switches the category filter and returns to the top of the list. */
  setCategory(category: Category): void {
    this.activeCategory.set(category);
    this.resetRenderLimit();
  }

  /** Switches the difficulty filter and returns to the top of the list. */
  setDifficulty(difficulty: 'all' | Difficulty): void {
    this.activeDiff.set(difficulty);
    this.resetRenderLimit();
  }

  /** Challenges answered — across the whole bank, not just the current filter,
   *  since the score line reports lifetime practice rather than this view. */
  readonly answeredCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered).length,
  );

  /** Of those, how many were right. */
  readonly correctCount = computed(() =>
    Object.values(this.states()).filter((s) => s.answered && s.correct).length,
  );

  /** Running score as a percentage of answered questions; `0` before any. */
  readonly scorePercent = computed(() => {
    const total = this.answeredCount();
    return total === 0 ? 0 : Math.round((this.correctCount() / total) * 100);
  });

  /** Option labels, indexed by position. */
  readonly letters = ['A', 'B', 'C', 'D'];

  /** Category chips, shared with Flashcards so the two never drift. */
  readonly categoryFilters = CATEGORY_FILTERS;

  /** Difficulty chips, likewise shared. */
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

  /**
   * Answer state for a challenge, or a blank one. Never `undefined`, so the
   * template can read fields without guarding.
   *
   * @param id The challenge's id.
   */
  getState(id: number) {
    return this.states()[id] ?? { selected: null, answered: false, correct: false, expanded: false };
  }

  /**
   * Whether a card is open. Answering forces this true, so an answered card
   * always shows its explanation.
   *
   * @param id The challenge's id.
   */
  isExpanded(id: number) {
    return this.getState(id).expanded;
  }

  /**
   * Opens or closes a card. A no-op once answered — collapsing away an
   * explanation you have just earned is never what the click meant.
   *
   * @param id The challenge's id.
   */
  toggleExpand(id: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, expanded: !cur.expanded } }));
  }

  /**
   * Selects an option without grading it. Freely changeable until submit, and
   * locked after — this page gives one attempt per card, so the retry path is
   * `/review`, not clicking again.
   *
   * @param id    The challenge's id.
   * @param index Index into the *shuffled* options.
   */
  selectOption(id: number, index: number) {
    const cur = this.getState(id);
    if (cur.answered) return;
    this.states.update((s) => ({ ...s, [id]: { ...cur, selected: index } }));
  }

  /**
   * Grades the selected option, reveals the explanation, and feeds the wider
   * app: a miss goes to the spaced-repetition queue, and adaptive mode (if on)
   * advances its streak.
   *
   * Guarded against re-submission and against submitting with nothing selected.
   *
   * @param ch The challenge being answered.
   */
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
    if (this.adaptiveEnabled()) this.advanceAdaptive(correct);
  }

  /** Steps the adaptive difficulty level up/down after LEVEL_UP/DOWN_STREAK in a row. */
  private advanceAdaptive(correct: boolean): void {
    const state = this.adaptive();
    const streak = correct ? Math.max(1, state.streak + 1) : Math.min(-1, state.streak - 1);
    const levelIndex = DIFF_LEVELS.indexOf(state.level);

    if (streak >= LEVEL_UP_STREAK && levelIndex < DIFF_LEVELS.length - 1) {
      const level = DIFF_LEVELS[levelIndex + 1];
      this.adaptive.set({ ...state, level, streak: 0 });
      this.toast.show(`🎚 Difficulty up → ${level}`, 'success', 2000);
    } else if (streak <= -LEVEL_DOWN_STREAK && levelIndex > 0) {
      const level = DIFF_LEVELS[levelIndex - 1];
      this.adaptive.set({ ...state, level, streak: 0 });
      this.toast.show(`🎚 Difficulty down → ${level}`, 'info', 2000);
    } else {
      this.adaptive.set({ ...state, streak });
    }
  }

  /**
   * Turns adaptive difficulty on or off, resetting the streak either way so a
   * run built up under manual filtering does not immediately promote you.
   * Also collapses the render limit, since the visible set changes.
   */
  toggleAdaptive(): void {
    this.adaptive.update((s) => ({ ...s, enabled: !s.enabled, streak: 0 }));
    this.resetRenderLimit();
    if (this.adaptiveEnabled()) {
      this.toast.show(`🎚 Adaptive difficulty on — starting at ${this.adaptiveLevel()}`, 'info', 2200);
    }
  }

  /**
   * Whether a challenge is starred. Bookmark ids are namespaced `practice-<id>`
   * so a challenge id and a lesson id can never collide in the shared store.
   *
   * @param id The challenge's id.
   */
  isBookmarked(id: number): boolean {
    return this.bookmarks.isBookmarked(`practice-${id}`);
  }

  /**
   * Stars or un-stars a challenge from its card.
   *
   * @param ch    The challenge whose star was clicked.
   * @param event The click, stopped from propagating so the star does not also
   *              toggle the card's expand/collapse header.
   */
  toggleBookmark(ch: Challenge, event: Event): void {
    event.stopPropagation();
    const id = `practice-${ch.id}`;
    this.bookmarks.toggle(id, BookmarksService.practiceLabel(ch.id, ch.question));
    this.toast.show(this.bookmarks.isBookmarked(id) ? 'Bookmarked' : 'Bookmark removed', 'success', 1400);
  }

  /**
   * Clears every answer, keeping the current question and option order.
   *
   * The counterpart to {@link reshuffle}, which clears answers *and* reorders.
   * Because the order is untouched here, the stored `selected` indices stay
   * meaningful — there is simply nothing left to point at.
   */
  reset() {
    this.states.set({});
  }

  /** Downloads a Markdown summary of every answered challenge in this session. */
  exportResults(): void {
    const answered = this.visibleChallenges().filter((ch) => this.getState(ch.id).answered);
    const when = Date.now();
    const lines: string[] = [];

    lines.push(`# Practice Session Results — ${new Date(when).toLocaleString()}`, '');
    lines.push(`**Score:** ${this.scorePercent()}% (${this.correctCount()}/${this.answeredCount()} correct)`, '');
    lines.push('## Question review', '');

    for (const ch of answered) {
      const state = this.getState(ch.id);
      const shuffled = this.getShuffledChallengeOptions(ch);
      lines.push(`### ${ch.category} · ${ch.difficulty} — ${state.correct ? '✓ Correct' : '✗ Incorrect'}`);
      lines.push(ch.question);
      if (ch.code) lines.push('', '```', ch.code, '```');
      lines.push('');
      shuffled.options.forEach((opt, idx) => {
        const marks = [
          idx === shuffled.correctIndex ? 'correct' : null,
          state.selected === idx ? 'your answer' : null,
        ].filter(Boolean);
        const tag = marks.length ? ` (${marks.join(', ')})` : '';
        lines.push(`- ${this.letters[idx]}) ${opt}${tag}`);
      });
      lines.push('', `Explanation: ${ch.explanation}`, '');
    }

    const stamp = new Date(when).toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadTextFile(`practice-results_${stamp}.md`, lines.join('\n'));
  }

  /**
   * Starts a fresh practice session: new question order, new option order, and
   * a cleared answer sheet.
   *
   * Note this is a full reset, not just a re-sort — "Shuffle" deliberately
   * discards answers. Keeping them would be worse than losing them: the option
   * order is re-randomized too, so a stored `selected` index would point at a
   * different option than the one that was actually clicked, and cards would
   * come back marked wrong for answers that were right.
   *
   * The render limit collapses with it, since the whole list is new anyway.
   */
  reshuffle() {
    this.shuffledAll.set(shuffle(CHALLENGES));
    this.resetRenderLimit();
    this.states.set({});
    this.optionsShuffler.reset();
  }

  /**
   * Display label for a challenge type. A `Record` rather than a `switch` so
   * a new type added to the bank fails the build here.
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
