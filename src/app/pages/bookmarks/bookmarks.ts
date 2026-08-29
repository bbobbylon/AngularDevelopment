import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookmarksService } from '../../core/bookmarks.service';

/**
 * Bookmarks & Notes — every starred lesson or practice question in one
 * place, each with a free-text note. Stars are set from two spots: the
 * global header star (any lesson page, wired in app.ts) and the per-card
 * star on Practice challenges (practice.ts). This page only reads/edits the
 * shared BookmarksService store; it owns no state of its own.
 */
@Component({
  selector: 'app-bookmarks',
  imports: [RouterLink, DatePipe],
  styles: [`
    .bm-hero { text-align: center; padding: 48px 24px 32px; }
    .bm-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .bm-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .empty-state { text-align: center; padding: 60px 24px; color: var(--text-muted); max-width: 480px; margin: 0 auto; }

    .bm-list { max-width: 760px; margin: 0 auto; padding: 0 24px 60px; display: flex; flex-direction: column; gap: 14px; }
    .bm-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; background: var(--surface); }
    .bm-head { display: flex; align-items: flex-start; gap: 12px; }
    .bm-title { flex: 1; font-weight: 600; font-size: .95rem; color: var(--text); text-decoration: none; }
    .bm-title:hover { text-decoration: underline; }
    .bm-remove { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: .95rem; flex-shrink: 0; }
    .bm-remove:hover { color: #ef4444; }
    .bm-note { width: 100%; margin-top: 10px; font-size: .85rem; resize: vertical; min-height: 44px; box-sizing: border-box; }
    .bm-date { display: block; margin-top: 8px; font-size: .74rem; color: var(--text-muted); }
  `],
  template: `
    <div class="bm-hero">
      <span class="pill">Saved</span>
      <h1>Bookmarks &amp; Notes</h1>
      <p>
        Lessons and practice questions you starred, with any notes you attached.
        Star a lesson from the ☆ button in the header, or a practice question
        from its card on the Practice page.
      </p>
    </div>

    @if (bookmarks.list().length === 0) {
      <div class="empty-state">
        Nothing bookmarked yet — look for the ☆ star on a lesson page, or on
        any practice challenge, to save it here.
      </div>
    } @else {
      <div class="bm-list">
        @for (b of bookmarks.list(); track b.id) {
          <div class="bm-card">
            <div class="bm-head">
              @if (isLesson(b.id)) {
                <a [routerLink]="'/' + b.id" class="bm-title">{{ b.label }}</a>
              } @else {
                <a routerLink="/practice" class="bm-title">{{ b.label }}</a>
              }
              <button class="bm-remove" (click)="bookmarks.remove(b.id)" aria-label="Remove bookmark">✕</button>
            </div>
            <textarea
              class="bm-note"
              placeholder="Add a note…"
              [value]="b.note"
              (change)="onNoteChange(b.id, $event)"
            ></textarea>
            <span class="bm-date">Saved {{ b.addedAt | date: 'MMM d, y · HH:mm' }}</span>
          </div>
        }
      </div>
    }
  `,
})
export class Bookmarks {
  protected readonly bookmarks = inject(BookmarksService);

  protected isLesson(id: string): boolean {
    return !id.startsWith('practice-');
  }

  protected onNoteChange(id: string, event: Event): void {
    this.bookmarks.setNote(id, (event.target as HTMLTextAreaElement).value);
  }
}
