import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHALLENGES, shuffle, type Category, type Challenge, type Difficulty } from '../practice/practice-data';
import { recordMisses } from '../practice/review-queue';

/**
 * Flashcard Drills — rapid-fire recall practice over the shared challenge bank
 * in `../practice/practice-data.ts` (the same single source of truth behind
 * Practice, the Mock Exam, and the Review queue).
 *
 * Where Practice is "read four options and pick one", a drill inverts the
 * exercise: the FRONT shows only the question (and code), you answer from
 * memory, then flip to check yourself against the correct answer and its
 * explanation. Self-grading drives the loop:
 *   - "Got it"  — the card leaves the deck.
 *   - "Again"   — the card goes to the BACK of the deck and comes around until
 *                 you get it; its first miss is also recorded into the shared
 *                 spaced-repetition queue (see `../practice/review-queue.ts`)
 *                 so it resurfaces on the /review schedule in later days.
 *
 * Three-phase state machine like the Mock Exam and Review pages:
 *   `config` (pick category / difficulty / deck size) → `drill` → `summary`.
 *
 * Keyboard-first: Space/Enter flips, ← or 1 = Again, → or 2 = Got it.
 */
type Phase = 'config' | 'drill' | 'summary';

const DECK_SIZES = [10, 20, 40] as const;

@Component({
  selector: 'app-flashcards',
  imports: [RouterLink],
  host: { '(window:keydown)': 'onKey($event)' },
  styles: [`
    .fc-hero { text-align: center; padding: 48px 24px 24px; }
    .fc-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .fc-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .panel { max-width: 760px; margin: 0 auto 60px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; }
    .panel h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin: 18px 0 10px; }
    .panel h3:first-child { margin-top: 0; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chips button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: .84rem; color: var(--text); }
    .chips button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .pool-note { font-size: .84rem; color: var(--text-muted); margin: 16px 0 0; }
    .primary-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 18px; padding: 11px 24px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .primary-btn:disabled { opacity: .5; cursor: default; }
    .primary-btn.small { padding: 8px 18px; font-size: .88rem; margin-top: 0; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }
    .link-back { display: inline-block; margin-left: 16px; font-size: .84rem; color: var(--blue); text-decoration: underline; }
    .kbd-note { font-size: .8rem; color: var(--text-muted); margin: 14px 0 0; }
    kbd { border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 5px; padding: 1px 6px; font-size: .76rem; font-family: monospace; background: var(--surface); }

    .drill-bar { max-width: 760px; margin: 0 auto 12px; padding: 0 4px; display: flex; align-items: center; gap: 12px; font-size: .9rem; font-weight: 600; }
    .drill-bar .spacer { flex: 1; }
    .queue-tag { font-size: .74rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: rgba(99,102,241,.1); color: #6366f1; }
    .progress-outer { max-width: 760px; margin: 0 auto 20px; height: 8px; background: var(--border); border-radius: 4px; }
    .progress-inner { height: 100%; background: #22c55e; border-radius: 4px; transition: width .3s; }

    .card-scene { max-width: 760px; margin: 0 auto; perspective: 1400px; }
    .card-inner { display: grid; transform-style: preserve-3d; transition: transform .45s cubic-bezier(.4, 0, .2, 1); }
    .card-inner.flipped { transform: rotateY(180deg); }
    .card-face { grid-area: 1 / 1; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; min-height: 300px; display: flex; flex-direction: column; }
    .card-face.back { transform: rotateY(180deg); border-color: #6366f1; }
    .q-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-cat { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(99,102,241,.1); border: 1px solid #6366f1; color: #6366f1; }
    .again-tag { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(239,68,68,.1); border: 1px solid #ef4444; color: #ef4444; font-weight: 600; }
    .q-text { font-weight: 500; font-size: 1.05rem; margin: 0 0 14px; line-height: 1.5; }
    .q-code { background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 14px 16px; font-size: .82rem; font-family: monospace; white-space: pre-wrap; margin: 0 0 14px; overflow-x: auto; }
    .flip-hint { margin-top: auto; text-align: center; font-size: .84rem; color: var(--text-muted); padding-top: 14px; }
    .answer-label { font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #22c55e; margin: 0 0 6px; }
    .answer-text { font-size: .95rem; font-weight: 600; line-height: 1.5; margin: 0 0 12px; }
    .explanation { font-size: .86rem; line-height: 1.55; color: var(--text-muted); max-height: 260px; overflow-y: auto; padding-right: 6px; }
    .topic-link { display: inline-block; margin-top: 10px; font-size: .82rem; color: var(--blue); text-decoration: underline; }

    .grade-row { max-width: 760px; margin: 18px auto 60px; display: flex; gap: 12px; justify-content: center; }
    .grade-btn { flex: 1; max-width: 220px; padding: 13px 20px; border-radius: 12px; font-size: .95rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
    .grade-btn.flip { background: #6366f1; border-color: #6366f1; color: #fff; }
    .grade-btn.again { border-color: #ef4444; color: #ef4444; }
    .grade-btn.again:hover { background: rgba(239,68,68,.08); }
    .grade-btn.got { border-color: #22c55e; color: #16a34a; }
    .grade-btn.got:hover { background: rgba(34,197,94,.08); }

    .sum-line { font-size: 1.05rem; margin: 0 0 16px; }
    .sum-grid { display: flex; gap: 24px; flex-wrap: wrap; margin: 0 0 16px; }
    .sum-grid strong { font-size: 1.5rem; display: block; }
    .sum-grid span { font-size: .8rem; color: var(--text-muted); }
    .sum-note { font-size: .86rem; color: var(--text-muted); margin: 0 0 8px; }
  `],
  template: `
    @switch (phase()) {

      @case ('config') {
        <div class="fc-hero">
          <span class="pill">Active Recall</span>
          <h1>Flashcard Drills</h1>
          <p>
            Answer from memory before you flip — no options to lean on. Cards you
            miss cycle back until you clear them, and also land in the
            spaced-repetition review queue for later days.
          </p>
        </div>

        <div class="panel">
          <h3>Category</h3>
          <div class="chips">
            @for (cat of categoryFilters; track cat.id) {
              <button [class.active]="category() === cat.id" (click)="category.set(cat.id)">
                {{ cat.label }}
              </button>
            }
          </div>

          <h3>Difficulty</h3>
          <div class="chips">
            @for (d of diffFilters; track d.id) {
              <button [class.active]="difficulty() === d.id" (click)="difficulty.set(d.id)">
                {{ d.label }}
              </button>
            }
          </div>

          <h3>Deck size</h3>
          <div class="chips">
            @for (size of deckSizes; track size) {
              <button [class.active]="deckSize() === size" [disabled]="pool().length < size" (click)="deckSize.set(size)">
                {{ size }} cards
              </button>
            }
            <button [class.active]="deckSize() === 'all'" (click)="deckSize.set('all')">
              All ({{ pool().length }})
            </button>
          </div>

          <p class="pool-note">{{ pool().length }} cards match the current filters.</p>

          <button class="primary-btn" [disabled]="pool().length === 0" (click)="start()">
            Start drilling {{ effectiveDeckSize() }} cards →
          </button>
          <a routerLink="/practice" class="link-back">Practice page</a>

          <p class="kbd-note">
            Keyboard: <kbd>Space</kbd> flip · <kbd>←</kbd> again · <kbd>→</kbd> got it
          </p>
        </div>
      }

      @case ('drill') {
        <div class="fc-hero" style="padding-bottom:8px">
          <span class="pill">Active Recall</span>
          <h1>Flashcard Drill</h1>
        </div>

        <div class="drill-bar">
          <span>{{ cleared() }} / {{ deckTotal() }} cleared</span>
          <span class="spacer"></span>
          <span class="queue-tag">{{ queue().length }} in deck</span>
        </div>
        <div class="progress-outer">
          <div class="progress-inner" [style.width]="progressPercent() + '%'"></div>
        </div>

        @if (current(); as ch) {
          <div class="card-scene">
            <div class="card-inner" [class.flipped]="flipped()" (click)="flipFromCard()">
              <div class="card-face">
                <div class="q-badges">
                  <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
                  <span class="badge-cat">{{ ch.category }}</span>
                  @if (missedIds().has(ch.id)) {
                    <span class="again-tag">↻ again</span>
                  }
                </div>
                <p class="q-text">{{ ch.question }}</p>
                @if (ch.code) { <div class="q-code">{{ ch.code }}</div> }
                <div class="flip-hint">Think of your answer, then flip ↴</div>
              </div>

              <div class="card-face back">
                <p class="answer-label">Answer</p>
                <p class="answer-text">{{ correctAnswer(ch) }}</p>
                <div class="explanation">{{ ch.explanation }}</div>
                @if (ch.topicPath) {
                  <a [routerLink]="'/' + ch.topicPath" target="_blank" class="topic-link" (click)="$event.stopPropagation()">
                    📚 Study this topic →
                  </a>
                }
              </div>
            </div>
          </div>

          <div class="grade-row">
            @if (!flipped()) {
              <button class="grade-btn flip" (click)="flip()">Flip card (Space)</button>
            } @else {
              <button class="grade-btn again" (click)="grade(false)">✗ Again (←)</button>
              <button class="grade-btn got" (click)="grade(true)">✓ Got it (→)</button>
            }
          </div>
        }
      }

      @case ('summary') {
        <div class="fc-hero">
          <span class="pill">Active Recall</span>
          <h1>Deck Cleared 🎉</h1>
        </div>

        <div class="panel">
          <p class="sum-line">
            <strong>{{ firstTryCount() }} / {{ deckTotal() }}</strong> known on the first flip.
          </p>
          <div class="sum-grid">
            <div><strong>{{ deckTotal() }}</strong><span>cards drilled</span></div>
            <div><strong>{{ firstTryCount() }}</strong><span>first-try</span></div>
            <div><strong>{{ missedIds().size }}</strong><span>needed repeats</span></div>
          </div>
          @if (missedIds().size > 0) {
            <p class="sum-note">
              The {{ missedIds().size }} card{{ missedIds().size === 1 ? '' : 's' }} you missed
              {{ missedIds().size === 1 ? 'was' : 'were' }} added to the spaced-repetition queue.
            </p>
          }
          <div>
            <button class="primary-btn" (click)="phase.set('config')">New deck</button>
            @if (missedIds().size > 0) {
              <a routerLink="/review" class="link-back">Go to Review queue →</a>
            } @else {
              <a routerLink="/practice" class="link-back">Practice page</a>
            }
          </div>
        </div>
      }
    }
  `,
})
export class Flashcards {
  readonly phase = signal<Phase>('config');

  // --- config state ---
  readonly category = signal<Category>('all');
  readonly difficulty = signal<'all' | Difficulty>('all');
  readonly deckSize = signal<number | 'all'>(20);
  readonly deckSizes = DECK_SIZES;

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
  readonly deckTotal = signal(0);
  readonly flipped = signal(false);
  /** Ids graded "Again" at least once this deck — each is reported to the review queue once. */
  readonly missedIds = signal<Set<number>>(new Set());

  readonly current = computed(() => this.queue()[0]);
  readonly cleared = computed(() => this.deckTotal() - this.uniqueRemaining());
  readonly firstTryCount = computed(() => this.deckTotal() - this.missedIds().size);
  readonly progressPercent = computed(() =>
    this.deckTotal() === 0 ? 0 : Math.round((this.cleared() / this.deckTotal()) * 100),
  );

  /** Distinct cards still in the queue (a re-queued card counts once). */
  private uniqueRemaining(): number {
    return new Set(this.queue().map((c) => c.id)).size;
  }

  start(): void {
    const deck = shuffle(this.pool()).slice(0, this.effectiveDeckSize());
    if (deck.length === 0) return;
    this.queue.set(deck);
    this.deckTotal.set(deck.length);
    this.flipped.set(false);
    this.missedIds.set(new Set());
    this.phase.set('drill');
  }

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
