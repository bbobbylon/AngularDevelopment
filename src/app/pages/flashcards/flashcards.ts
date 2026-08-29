import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_FILTERS, CHALLENGES, DIFF_FILTERS, shuffle, type Category, type Challenge, type Difficulty } from '../practice/practice-data';
import { recordMisses } from '../practice/review-queue';

/** Which screen the drill page is on. See {@link Flashcards}. */
type Phase = 'config' | 'drill' | 'summary';

/** Deck-size chips. "All" is offered alongside these in the template. */
const DECK_SIZES = [10, 20, 40] as const;

/**
 * Flashcard Drills — rapid-fire recall practice over the shared challenge bank.
 *
 * Same questions as everywhere else in the app, exercised the opposite way
 * round. Practice is *recognition*: read four options and pick one. A drill is
 * *recall*: the front shows only the question, you answer from memory, then
 * flip to check yourself. Recognition is much easier than recall, so a bank you
 * can pass on the Practice page is not necessarily a bank you know.
 *
 * ## The self-graded loop
 *
 * - **"Got it"** — the card leaves the deck.
 * - **"Again"** — the card goes to the **back** of the deck and comes round
 *   again, so a deck is not finished until every card has been recalled at
 *   least once. Its first miss is also recorded into the shared
 *   spaced-repetition queue, so it resurfaces on `/review` days later — the
 *   drill fixes it now, the queue keeps it fixed.
 *
 * Grading is honour-system, which is the trade recall practice makes: there is
 * no way to machine-check an answer held in your head, and the alternative
 * (multiple choice) is the recognition exercise this page exists to avoid.
 *
 * ## Phases
 *
 * `config` (category / difficulty / deck size) → `drill` → `summary`.
 *
 * Keyboard-first, because the value of a drill is in its pace: Space or Enter
 * flips, ← or `1` is Again, → or `2` is Got it.
 *
 * @see pages/practice/practice-data.ts — the shared bank.
 * @see pages/practice/review-queue.ts — receives first misses.
 */
@Component({
  selector: 'app-flashcards',
  imports: [RouterLink],
  host: { '(window:keydown)': 'onKey($event)' },
  styleUrl: './flashcards.css',
  templateUrl: './flashcards.html',
})
export class Flashcards {
  /** Which of the three screens is showing. */
  readonly phase = signal<Phase>('config');

  // --- config state ---

  /** Category filter for the draw; `'all'` uses the whole bank. */
  readonly category = signal<Category>('all');

  /** Difficulty filter for the draw; `'all'` uses every tier. */
  readonly difficulty = signal<'all' | Difficulty>('all');

  /** Requested deck size, or `'all'` for the entire filtered pool. May exceed
   *  the pool — see {@link effectiveDeckSize}. */
  readonly deckSize = signal<number | 'all'>(20);

  /** {@link DECK_SIZES}, for the size chips. */
  readonly deckSizes = DECK_SIZES;

  /** Category chips, shared with the Practice page so the two never drift. */
  readonly categoryFilters = CATEGORY_FILTERS;

  /** Difficulty chips, likewise shared. */
  readonly diffFilters = DIFF_FILTERS;

  /** Cards matching the current filters — the population a deck is drawn from. */
  readonly pool = computed(() => {
    const cat = this.category();
    const diff = this.difficulty();
    return CHALLENGES.filter((c) => {
      const catOk = cat === 'all' || c.category === cat;
      const diffOk = diff === 'all' || c.difficulty === diff;
      return catOk && diffOk;
    });
  });

  /** The deck size that will actually be drawn (a size chip can exceed the pool). */
  readonly effectiveDeckSize = computed(() => {
    const size = this.deckSize();
    return size === 'all' ? this.pool().length : Math.min(size, this.pool().length);
  });

  // --- drill state ---
  /** Remaining cards; the head is the visible card, "Again" re-queues to the tail. */
  readonly queue = signal<Challenge[]>([]);

  /** Cards drawn for this deck. Fixed at {@link start} — re-queued cards do not
   *  inflate it, so progress is measured against distinct cards. */
  readonly deckTotal = signal(0);

  /** Whether the visible card is showing its back. */
  readonly flipped = signal(false);
  /** Ids graded "Again" at least once this deck — each is reported to the review queue once. */
  readonly missedIds = signal<Set<number>>(new Set());

  /** The visible card: the head of the queue. */
  readonly current = computed(() => this.queue()[0]);

  /** Cards fully cleared from the deck. */
  readonly cleared = computed(() => this.deckTotal() - this.uniqueRemaining());

  /**
   * Cards recalled correctly on the **first** attempt — the number that
   * actually says something. Every deck ends at 100% cleared, because a missed
   * card just comes round again; first-try is what distinguishes knowing the
   * material from grinding through it.
   */
  readonly firstTryCount = computed(() => this.deckTotal() - this.missedIds().size);

  /** Percentage of distinct cards cleared, for the progress bar. */
  readonly progressPercent = computed(() =>
    this.deckTotal() === 0 ? 0 : Math.round((this.cleared() / this.deckTotal()) * 100),
  );

  /** Distinct cards still in the queue (a re-queued card counts once). */
  private uniqueRemaining(): number {
    return new Set(this.queue().map((c) => c.id)).size;
  }

  /**
   * Draws a deck from the filtered pool and enters the drill.
   *
   * Bails on an empty pool rather than entering a drill with no cards — a
   * filter combination with no matches is reachable from the config screen.
   */
  start(): void {
    const deck = shuffle(this.pool()).slice(0, this.effectiveDeckSize());
    if (deck.length === 0) return;
    this.queue.set(deck);
    this.deckTotal.set(deck.length);
    this.flipped.set(false);
    this.missedIds.set(new Set());
    this.phase.set('drill');
  }

  /** Reveals the card's back. One-way: a card is not un-flipped, only replaced. */
  flip(): void {
    this.flipped.set(true);
  }

  /** Click-to-flip on the card body — a no-op once the back is showing. */
  flipFromCard(): void {
    if (!this.flipped()) this.flip();
  }

  /**
   * The card's back text. Every challenge in the bank carries options with a
   * numeric answer index (fill-blanks included); the string branch covers any
   * future free-text answers.
   */
  correctAnswer(ch: Challenge): string {
    if (ch.options && typeof ch.answer === 'number') return ch.options[ch.answer];
    return String(ch.answer);
  }

  /** Self-grade the flipped card: clear it, or send it to the back of the deck. */
  grade(gotIt: boolean): void {
    const ch = this.current();
    if (!ch || !this.flipped()) return;

    if (gotIt) {
      this.queue.update((q) => q.slice(1));
    } else {
      this.queue.update((q) => [...q.slice(1), ch]);
      if (!this.missedIds().has(ch.id)) {
        recordMisses([ch.id]);
        this.missedIds.update((ids) => new Set(ids).add(ch.id));
      }
    }
    this.flipped.set(false);
    if (this.queue().length === 0) this.phase.set('summary');
  }

  /** Space/Enter flips; after the flip, ←/1 = again, →/2 = got it. */
  onKey(event: KeyboardEvent): void {
    if (this.phase() !== 'drill') return;
    // Never hijack keys while the user is typing (e.g. a future search box).
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!this.flipped()) this.flip();
    } else if (this.flipped() && (event.key === 'ArrowLeft' || event.key === '1')) {
      event.preventDefault();
      this.grade(false);
    } else if (this.flipped() && (event.key === 'ArrowRight' || event.key === '2')) {
      event.preventDefault();
      this.grade(true);
    }
  }
}
