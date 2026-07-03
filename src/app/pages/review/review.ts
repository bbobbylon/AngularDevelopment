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

/**
 * Spaced-Repetition Review — resurfaces questions you got WRONG elsewhere in
 * the app (Practice page misses and Mock Exam misses both feed the shared
 * queue in `../practice/review-queue.ts`).
 *
 * Three-phase state machine, same shape as the Mock Exam:
 *   - `idle`    — dashboard: due count, queue size, mastered count, start button.
 *   - `session` — one due item at a time with immediate feedback; each answer
 *                 is graded into the Leitner schedule (correct → longer
 *                 interval, wrong → back to the start).
 *   - `summary` — session tally: advanced / reset / mastered.
 *
 * Options are shuffled via the shared OptionsShuffler so answer positions are
 * randomized but stable within a session.
 */
type Phase = 'idle' | 'session' | 'summary';

const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-review',
  imports: [RouterLink],
  styles: [`
    .rev-hero { text-align: center; padding: 48px 24px 24px; }
    .rev-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .rev-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }
    .stats-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin: 24px 0; }
    .stat-box { text-align: center; padding: 12px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); min-width: 96px; }
    .stat-box strong { display: block; font-size: 1.6rem; }
    .stat-box span { font-size: .82rem; color: var(--text-muted); }
    .stat-box.due strong { color: #6366f1; }

    .panel { max-width: 720px; margin: 0 auto 60px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px 28px; }
    .panel h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin: 0 0 10px; }
    .how { font-size: .88rem; color: var(--text-muted); line-height: 1.6; margin: 0 0 6px; }
    .next-due { font-size: .86rem; color: var(--text-muted); margin: 12px 0 0; }
    .primary-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; padding: 11px 24px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: .95rem; font-weight: 600; }
    .primary-btn:disabled { opacity: .5; cursor: default; }
    .primary-btn.small { padding: 8px 18px; font-size: .88rem; margin-top: 0; }
    .ghost-btn { padding: 8px 18px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; font-size: .88rem; }
    .link-back { display: inline-block; margin-left: 16px; font-size: .84rem; color: var(--blue); text-decoration: underline; }
    .empty { text-align: center; color: var(--text-muted); padding: 24px 0 8px; }

    .session-bar { max-width: 720px; margin: 0 auto 12px; padding: 0 4px; display: flex; align-items: center; gap: 12px; font-size: .9rem; font-weight: 600; }
    .session-bar .spacer { flex: 1; }
    .box-tag { font-size: .74rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: rgba(99,102,241,.1); color: #6366f1; }
    .q-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .badge-diff { font-size: .72rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
    .badge-diff.junior { background: #dcfce7; color: #166534; }
    .badge-diff.mid { background: #fef9c3; color: #854d0e; }
    .badge-diff.senior { background: #fee2e2; color: #991b1b; }
    .badge-type { font-size: .72rem; padding: 3px 8px; border-radius: 20px; background: rgba(99,102,241,.1); border: 1px solid #6366f1; color: #6366f1; text-transform: capitalize; }
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
    .verdict { margin: 4px 0 14px; padding: 12px 16px; border-radius: 10px; font-size: .88rem; line-height: 1.55; }
    .verdict.ok { background: rgba(34,197,94,.1); border: 1px solid #22c55e; }
    .verdict.no { background: rgba(239,68,68,.08); border: 1px solid #ef4444; }
    .verdict strong { display: block; margin-bottom: 6px; }
    .schedule-note { display: inline-block; margin-top: 10px; font-size: .8rem; font-weight: 600; padding: 4px 10px; border-radius: 12px; background: rgba(99,102,241,.1); color: #6366f1; }
    .topic-link { display: inline-block; margin-top: 10px; margin-left: 10px; font-size: .82rem; color: var(--blue); text-decoration: underline; }
    .q-actions { display: flex; justify-content: flex-end; }

    .sum-line { font-size: 1.05rem; margin: 0 0 16px; }
    .sum-grid { display: flex; gap: 24px; flex-wrap: wrap; margin: 0 0 8px; }
    .sum-grid strong { font-size: 1.5rem; display: block; }
    .sum-grid span { font-size: .8rem; color: var(--text-muted); }
  `],
  template: `
    @switch (phase()) {

      @case ('idle') {
        <div class="rev-hero">
          <span class="pill">Spaced Repetition</span>
          <h1>Review Queue</h1>
          <p>
            Every question you miss in Practice or a Mock Exam lands here.
            Answer it correctly on schedule and the gap grows —
            {{ intervalsLabel }} days — until it graduates as mastered.
            Miss it and it starts over.
          </p>
        </div>

        <div class="stats-row">
          <div class="stat-box due"><strong>{{ due().length }}</strong><span>due now</span></div>
          <div class="stat-box"><strong>{{ queueSize() }}</strong><span>in queue</span></div>
          <div class="stat-box"><strong>{{ masteredCount() }}</strong><span>mastered</span></div>
        </div>

        <div class="panel">
          @if (queueSize() === 0) {
            <div class="empty">
              @if (masteredCount() > 0) {
                Queue clear — everything you missed has been mastered. 🎉
              } @else {
                Nothing to review yet. Miss a question and it will show up here.
              }
            </div>
            <div style="text-align:center">
              <a routerLink="/practice" class="primary-btn small" style="text-decoration:none">Go practice →</a>
              <a routerLink="/mock-exam" class="link-back">or take a Mock Exam</a>
            </div>
          } @else {
            <h3>How it works</h3>
            <p class="how">
              A review session shows each due question once, with instant feedback.
              Correct answers move a question up a box (checked less often);
              wrong answers send it back to box 1 (due immediately).
            </p>
            @if (due().length > 0) {
              <button class="primary-btn" (click)="startSession(false)">
                Review {{ due().length }} due →
              </button>
            } @else {
              <p class="next-due">Nothing due right now — next review {{ nextDueLabel() }}.</p>
              <button class="ghost-btn" style="margin-top:12px" (click)="startSession(true)">
                Review all {{ queueSize() }} early
              </button>
            }
            <a routerLink="/practice" class="link-back">Practice page</a>
          }
        </div>
      }

      @case ('session') {
        <div class="rev-hero" style="padding-bottom:8px">
          <span class="pill">Spaced Repetition</span>
          <h1>Review Session</h1>
        </div>

        <div class="session-bar">
          <span>Item {{ index() + 1 }} / {{ session().length }}</span>
          <span class="spacer"></span>
          @if (current(); as ch) {
            <span class="box-tag">Box {{ boxOf(ch.id) + 1 }} / {{ boxCount }}</span>
          }
        </div>

        @if (current(); as ch) {
          <div class="panel">
            <div class="q-badges">
              <span class="badge-diff {{ ch.difficulty }}">{{ ch.difficulty }}</span>
              <span class="badge-type">{{ ch.category }}</span>
              <span class="badge-type" style="background:transparent;border-color:var(--border);color:var(--text-muted)">{{ typeLabel(ch.type) }}</span>
            </div>

            <p class="q-text">{{ ch.question }}</p>
            @if (ch.code) { <div class="q-code">{{ ch.code }}</div> }

            <div class="options">
              @for (opt of shuffledOptions(ch).options; track $index) {
                <button class="opt"
                  [class.selected]="selected() === $index && !answered()"
                  [class.correct]="answered() && $index === shuffledOptions(ch).correctIndex"
                  [class.wrong]="answered() && selected() === $index && $index !== shuffledOptions(ch).correctIndex"
                  [disabled]="answered()"
                  (click)="selected.set($index)">
                  <span class="opt-letter">{{ letters[$index] }}</span>{{ opt }}
                </button>
              }
            </div>

            @if (!answered()) {
              <button class="primary-btn small" [disabled]="selected() === null" (click)="submit(ch)">
                Submit Answer
              </button>
            } @else {
              <div class="verdict" [class.ok]="lastCorrect()" [class.no]="!lastCorrect()">
                <strong>{{ lastCorrect() ? '✓ Correct!' : '✗ Not quite.' }}</strong>
                {{ ch.explanation }}
                <br>
                <span class="schedule-note">{{ scheduleNote() }}</span>
                @if (ch.topicPath) {
                  <a [routerLink]="'/' + ch.topicPath" class="topic-link">📚 Study this topic →</a>
                }
              </div>
              <div class="q-actions">
                <button class="primary-btn small" (click)="next()">
                  {{ index() < session().length - 1 ? 'Next →' : 'Finish session →' }}
                </button>
              </div>
            }
          </div>
        }
      }

      @case ('summary') {
        <div class="rev-hero">
          <span class="pill">Spaced Repetition</span>
          <h1>Session Complete</h1>
        </div>

        <div class="panel">
          <p class="sum-line">
            <strong>{{ sessionCorrect() }} / {{ session().length }}</strong> correct this session.
          </p>
          <div class="sum-grid">
            <div><strong>{{ sessionAdvanced() }}</strong><span>moved up a box</span></div>
            <div><strong>{{ sessionReset() }}</strong><span>back to box 1</span></div>
            <div><strong>{{ sessionMastered() }}</strong><span>mastered 🎓</span></div>
          </div>
          <div>
            <button class="primary-btn" (click)="backToIdle()">
              {{ due().length > 0 ? due().length + ' more due — continue' : 'Done' }}
            </button>
            <a routerLink="/practice" class="link-back">Practice page</a>
          </div>
        </div>
      }
    }
  `,
})
export class Review {
  private readonly shuffler = new OptionsShuffler();
  /** Challenge lookup by id — the queue stores ids only. */
  private readonly byId = new Map<number, Challenge>(CHALLENGES.map((c) => [c.id, c]));

  readonly letters = ['A', 'B', 'C', 'D'];
  readonly boxCount = REVIEW_INTERVALS_DAYS.length;
  readonly intervalsLabel = REVIEW_INTERVALS_DAYS.slice(1).join(' → ');

  readonly phase = signal<Phase>('idle');
  readonly queue = signal<ReviewQueue>(loadQueue());
  readonly masteredCount = signal(loadMastered().length);

  readonly queueSize = computed(() => Object.keys(this.queue()).length);
  /** Due items whose challenge still exists in the bank. */
  readonly due = computed(() => dueItems(this.queue()).filter((i) => this.byId.has(i.id)));

  // --- session state ---
  readonly session = signal<Challenge[]>([]);
  readonly index = signal(0);
  readonly selected = signal<number | null>(null);
  readonly answered = signal(false);
  readonly lastCorrect = signal(false);
  /** Human note about where the just-graded item went in the schedule. */
  readonly scheduleNote = signal('');
  readonly sessionCorrect = signal(0);
  readonly sessionAdvanced = signal(0);
  readonly sessionReset = signal(0);
  readonly sessionMastered = signal(0);

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

  boxOf(id: number): number {
    return this.queue()[id]?.box ?? 0;
  }

  shuffledOptions(ch: Challenge): { options: string[]; correctIndex: number } {
    if (!ch.options) return { options: [], correctIndex: -1 };
    return this.shuffler.getShuffledOptions(ch.id, ch.options, ch.answer as number);
  }

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
        this.scheduleNote.set(`↑ Box ${prevBox + 2} — next review in ${days} day${days === 1 ? '' : 's'}`);
      }
    } else {
      this.sessionReset.update((n) => n + 1);
      this.scheduleNote.set('↓ Back to box 1 — due again right away');
    }
  }

  next(): void {
    if (this.index() < this.session().length - 1) {
      this.index.update((i) => i + 1);
      this.selected.set(null);
      this.answered.set(false);
    } else {
      this.phase.set('summary');
    }
  }

  backToIdle(): void {
    this.phase.set('idle');
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
