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
  styleUrl: './practice.css',
  templateUrl: './practice.html',
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
