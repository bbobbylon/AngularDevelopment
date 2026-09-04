import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookmarksService } from '../../core/bookmarks.service';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { Napkin } from '../../shared/brain';

/**
 * Bookmarks & Notes — every starred lesson or practice question in one
 * place, each with a free-text note. Stars are set from two spots: the
 * global header star (any lesson page, wired in app.ts) and the per-card
 * star on Practice challenges (practice.ts). This page only reads/edits the
 * shared BookmarksService store; it owns no state of its own.
 *
 * Restyled onto the brain-friendly tokens (see bookmarks.css's header
 * comment) — `Napkin` dresses the empty state and `appReveal` staggers the
 * card list in on scroll; neither changes what the page does.
 */
@Component({
  selector: 'app-bookmarks',
  imports: [RouterLink, DatePipe, RevealOnScrollDirective, Napkin],
  styleUrl: './bookmarks.css',
  templateUrl: './bookmarks.html',
})
export class Bookmarks {
  /** The store. This page is a thin view over it and owns no state of its own. */
  protected readonly bookmarks = inject(BookmarksService);

  /**
   * Whether a bookmark points at a lesson (and so can link straight to its
   * route) rather than a practice question (which has no route, so the card
   * links to `/practice` instead).
   *
   * The `practice-` prefix is the only discriminator — see the id convention
   * on {@link BookmarksService}.
   *
   * @param id A namespaced bookmark id.
   */
  protected isLesson(id: string): boolean {
    return !id.startsWith('practice-');
  }

  /**
   * Saves an edited note on every keystroke. No debounce: the write is a
   * synchronous localStorage set behind a signal, and losing the last few
   * characters because the user navigated away mid-debounce would be worse
   * than the cost of writing often.
   *
   * @param id    The bookmark being edited.
   * @param event The textarea input event.
   */
  protected onNoteChange(id: string, event: Event): void {
    this.bookmarks.setNote(id, (event.target as HTMLTextAreaElement).value);
  }
}
