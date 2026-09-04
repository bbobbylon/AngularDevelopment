import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHALLENGES, shuffle, type Challenge, type ChallengeType } from '../practice/practice-data';
import { OptionsShuffler } from '../practice/practice-helpers';
import {
  REVIEW_INTERVALS_DAYS,
  dueItems,
  gradeReview,
  loadMastered,
  loadQueue,
  type ReviewQueue,
} from '../practice/review-queue';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { Bubbles, Napkin, TapeCard, type BubbleTurn } from '../../shared/brain';

/** Which screen the review page is on. See {@link Review}. */
type Phase = 'idle' | 'session' | 'summary';

/** Milliseconds in a day — converts a due timestamp into "in N days". */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Spaced-Repetition Review — resurfaces the questions you got **wrong**
 * elsewhere in the app.
 *
 * This page owns none of the queue's logic. Practice, Mock Exam and Exam Day
 * all record their misses into the shared store in
 * `../practice/review-queue.ts`; this page reads what is due, asks it, and
 * grades the answer back into the Leitner schedule.
 *
 * Three phases, the same shape as the Mock Exam:
 *
 * - **`idle`** — how many are due, how big the queue is, how many have been
 *   mastered, and when the next item comes up.
 * - **`session`** — one item at a time **with** immediate feedback (unlike the
 *   Mock Exam: this is practice, not measurement). Each answer moves the item
 *   through the schedule — correct promotes it to a longer interval, wrong
 *   sends it back to the start.
 * - **`summary`** — the tally: advanced, reset, mastered.
 *
 * ## Reviewing early
 *
 * {@link startSession} takes an `early` flag that runs the *whole* queue
 * rather than only what is due. It grades exactly the same way, so an early
 * correct answer still promotes. This is deliberate — the schedule is a
 * suggestion for when review is most efficient, not a lockout.
 *
 * @see pages/practice/review-queue.ts — the store, the box intervals, and the
 *      graduation rule.
 */
@Component({
  selector: 'app-review',
  imports: [RouterLink, RevealOnScrollDirective, Bubbles, Napkin, TapeCard],
  styleUrl: './review.css',
  templateUrl: './review.html',
})
export class Review {
  /** Per-session option shuffling; reset at the start of each session. */
  private readonly shuffler = new OptionsShuffler();
  /** Challenge lookup by id — the queue stores ids only. */
  private readonly byId = new Map<number, Challenge>(CHALLENGES.map((c) => [c.id, c]));

  /** Option labels, indexed by position. */
  readonly letters = ['A', 'B', 'C', 'D'];

  /** Number of Leitner boxes. Reaching the top box graduates an item. */
  readonly boxCount = REVIEW_INTERVALS_DAYS.length;

  /** The intervals as `1 → 3 → 7 → 14 → 30`, explaining the schedule in the UI.
   *  Drops the first entry, which is 0 (due immediately) and reads as noise. */
  readonly intervalsLabel = REVIEW_INTERVALS_DAYS.slice(1).join(' → ');

  /** Which of the three screens is showing. */
  readonly phase = signal<Phase>('idle');

  /**
   * The queue, seeded from storage. Held in a signal because grading mutates
   * it during a session and the box badges must update live — the store
   * itself is not reactive, so this page holds the reactive copy.
   */
  readonly queue = signal<ReviewQueue>(loadQueue());

  /** Lifetime mastered count, incremented locally as items graduate. */
  readonly masteredCount = signal(loadMastered().length);

  /** Items in the queue, due or not. */
  readonly queueSize = computed(() => Object.keys(this.queue()).length);
  /** Due items whose challenge still exists in the bank. */
  readonly due = computed(() => dueItems(this.queue()).filter((i) => this.byId.has(i.id)));

  /**
   * The empty-queue state, staged as a two-line exchange instead of a flat
   * sentence — the same device Practice uses for its own empty-filter state.
   * Purely presentational: derived from the same {@link masteredCount} signal
   * the old plain-text branches already read, and changes nothing about what
   * counts as "empty".
   */
  readonly emptyStateTurns = computed<BubbleTurn[]>(() =>
    this.masteredCount() > 0
      ? [
          { who: 'You', says: 'Anything left in the queue?' },
          { who: 'Review', says: 'Queue clear — everything you missed has been **mastered**. 🎉' },
        ]
      : [
          { who: 'You', says: 'Anything to review yet?' },
          {
            who: 'Review',
            says: "Not yet — miss a question in `Practice` or a Mock Exam and it'll show up here.",
          },
        ],
  );

  // --- session state ---

  /** Challenges drawn for this session, in presentation order. */
  readonly session = signal<Challenge[]>([]);

  /** Position within {@link session}. */
  readonly index = signal(0);

  /** Chosen option index for the current item, or `null`. */
  readonly selected = signal<number | null>(null);

  /** Whether the current item has been graded — flips the card to feedback. */
  readonly answered = signal(false);

  /** Whether the last graded answer was right, for the feedback styling. */
  readonly lastCorrect = signal(false);
  /** Human note about where the just-graded item went in the schedule. */
  readonly scheduleNote = signal('');
  /** Correct answers this session. */
  readonly sessionCorrect = signal(0);

  /** Items promoted a box this session. */
  readonly sessionAdvanced = signal(0);

  /** Items knocked back to box 0 this session. */
  readonly sessionReset = signal(0);

  /** Items that graduated out of the queue this session. */
  readonly sessionMastered = signal(0);

  /** The item on screen. */
  readonly current = computed(() => this.session()[this.index()]);

  /** Relative label for the soonest upcoming (not yet due) item. */
  nextDueLabel(): string {
    const upcoming = Object.values(this.queue())
      .filter((i) => this.byId.has(i.id))
      .sort((a, b) => a.due - b.due)[0];
    if (!upcoming) return 'never';
    const days = Math.ceil((upcoming.due - Date.now()) / DAY_MS);
    if (days <= 0) return 'now';
    return days === 1 ? 'tomorrow' : `in ${days} days`;
  }

  /** Start a session over the due items — or the whole queue when reviewing early. */
  startSession(early: boolean): void {
    const items = early
      ? Object.values(this.queue()).filter((i) => this.byId.has(i.id))
      : this.due();
    const challenges = shuffle(items.map((i) => this.byId.get(i.id)!));
    if (challenges.length === 0) return;
    this.shuffler.reset();
    this.session.set(challenges);
    this.index.set(0);
    this.selected.set(null);
    this.answered.set(false);
    this.sessionCorrect.set(0);
    this.sessionAdvanced.set(0);
    this.sessionReset.set(0);
    this.sessionMastered.set(0);
    this.phase.set('session');
  }

  /**
   * Which Leitner box an item is in; `0` for anything not queued.
   *
   * @param id Challenge id.
   */
  boxOf(id: number): number {
    return this.queue()[id]?.box ?? 0;
  }

  /**
   * This session's option order for a challenge, plus where the correct answer
   * ended up. Stable for the session.
   *
   * @param ch The challenge.
   */
  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

  /** Letter (A/B/C/D) of the correct option, for the per-wrong-answer callout. */
  correctOptionLetter(ch: Challenge): string {
    return this.letters[this.shuffledOptions(ch).correctIndex] ?? '';
  }

  /**
   * Grades the current answer and moves the item through the schedule.
   *
   * The box is read **before** grading, because {@link gradeReview} rewrites
   * it — `prevBox` is what makes it possible to say where the item went ("↑
   * Box 3 — next review in 7 days") rather than just that it moved. It is also
   * how graduation is detected: promoting past the last box removes the item
   * from the queue entirely, so there is no post-grade box left to inspect.
   *
   * @param ch The challenge being answered.
   */
  submit(ch: Challenge): void {
    const sel = this.selected();
    if (this.answered() || sel === null) return;
    const correct = sel === this.shuffledOptions(ch).correctIndex;
    const prevBox = this.boxOf(ch.id);

    this.queue.set(gradeReview(ch.id, correct));
    this.answered.set(true);
    this.lastCorrect.set(correct);

    if (correct) {
      this.sessionCorrect.update((n) => n + 1);
      if (prevBox + 1 >= this.boxCount) {
        this.sessionMastered.update((n) => n + 1);
        this.masteredCount.update((n) => n + 1);
        this.scheduleNote.set('🎓 Mastered — out of the queue!');
      } else {
        this.sessionAdvanced.update((n) => n + 1);
        const days = REVIEW_INTERVALS_DAYS[prevBox + 1];
        this.scheduleNote.set(
          `↑ Box ${prevBox + 2} — next review in ${days} day${days === 1 ? '' : 's'}`,
        );
      }
    } else {
      this.sessionReset.update((n) => n + 1);
      this.scheduleNote.set('↓ Back to box 1 — due again right away');
    }
  }

  /**
   * Advances to the next item, clearing the per-item answer state, or ends the
   * session when there are none left.
   */
  next(): void {
    if (this.index() < this.session().length - 1) {
      this.index.update((i) => i + 1);
      this.selected.set(null);
      this.answered.set(false);
    } else {
      this.phase.set('summary');
    }
  }

  /** Returns to the dashboard from the summary screen. */
  backToIdle(): void {
    this.phase.set('idle');
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
