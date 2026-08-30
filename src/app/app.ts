import { DOCUMENT } from '@angular/common';
import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { fromEvent, merge } from 'rxjs';
import { filter, map, throttleTime } from 'rxjs/operators';
import { APP_CONFIG } from './core/app-config.token';
import { ProgressService } from './core/progress.service';
import { dueCount, loadQueue } from './pages/practice/review-queue';
import { ToastService } from './core/toast.service';
import { StreakService } from './core/streak.service';
import { BookmarksService } from './core/bookmarks.service';
import { CURRICULUM } from './core/curriculum';
import { highlight } from './shared/highlighter';
import { ToastsComponent } from './shared/toasts.component';
import { STORAGE_KEYS, readRaw, writeRaw } from './core/storage';

/**
 * The application shell — the only component that is always on screen.
 *
 * Everything outside the `<router-outlet>` lives here: the top nav with its
 * badges, the theme toggle, the reading-progress bar, the footer, and the
 * toast stack. It is also where all the app-wide *cross-cutting* behaviour is
 * centralised, deliberately, so no individual page has to remember to do it:
 *
 * - **Lesson visit tracking.** One `NavigationEnd` subscription marks the
 *   destination visited, rather than 100 lesson components each reporting
 *   themselves (and one of them inevitably forgetting).
 * - **Streak ticking.** Same subscription; a no-op after the first navigation
 *   each day.
 * - **Review-badge refresh.** localStorage is not reactive, so the due count
 *   is re-read on navigation — precisely when the nav bar is next looked at.
 * - **Syntax highlighting.** Lesson templates ship plain-text code blocks;
 *   they are highlighted after render rather than at author time, so no lesson
 *   has to hand-write markup.
 * - **Theme.** A signal mirrored to both `data-theme` on `<html>` and
 *   localStorage.
 *
 * The services it injects are `protected`, not `private`, because `app.html`
 * binds to them directly (`progress.visitedCount()`, `streak.current()`).
 *
 * @see core/storage.ts, core/progress.service.ts, core/streak.service.ts
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** App name shown in the header. A signal purely to model the idiom for readers. */
  protected readonly title = signal('Angular Concepts');
  /** Active colour scheme, seeded from the last session's choice. */
  protected readonly theme = signal<'light' | 'dark'>(
    readRaw<'light' | 'dark'>(STORAGE_KEYS.theme, 'light'),
  );

  /** Scroll progress (0–100) for the reading-progress bar. */
  protected readonly scrollPct = signal(0);

  /**
   * Spaced-repetition items due now — the badge on the Review nav link.
   * localStorage is not reactive, so the count is re-read on every
   * NavigationEnd: answering questions anywhere updates it on the next
   * route change, which is exactly when the nav is glanced at.
   */
  protected readonly reviewDue = signal(dueCount(loadQueue()));

  /** Curriculum lesson id for the current route, or null on a non-lesson page — drives the bookmark star. */
  protected readonly currentLessonId = signal<string | null>(null);

  /** Injected via InjectionToken — no class needed for plain config objects. */
  protected readonly config = inject(APP_CONFIG);

  /** Visited-lesson store. Bound in the footer for the count and the reset button. */
  protected readonly progress = inject(ProgressService);

  /** Raises the confirmations shown for theme, reset, bookmark and streak events. */
  protected readonly toast = inject(ToastService);

  /** Consecutive-study-day counter, ticked below and rendered as the fire badge. */
  protected readonly streak = inject(StreakService);

  /** Starred lessons/questions. Drives the header star and the nav count badge. */
  protected readonly bookmarks = inject(BookmarksService);

  /**
   * Wires up the app-wide reactions.
   *
   * All of them belong in the constructor rather than `ngOnInit` because
   * `takeUntilDestroyed()` and `effect()` both need an injection context,
   * which the constructor provides and lifecycle hooks do not.
   */
  constructor() {
    const router = inject(Router);
    const doc = inject(DOCUMENT);

    // effect() — sync theme signal to DOM attribute + localStorage on every write.
    effect(() => {
      doc.documentElement.setAttribute('data-theme', this.theme());
      writeRaw(STORAGE_KEYS.theme, this.theme());
    });

    // takeUntilDestroyed() auto-unsubscribes when this component is destroyed.
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        const lessonId = url.split('?')[0].replace(/^\//, '');
        if (lessonId) this.progress.markVisited(lessonId);

        // The bookmark star only makes sense on an actual curriculum lesson.
        this.currentLessonId.set(CURRICULUM.some((l) => l.id === lessonId) ? lessonId : null);

        // Refresh the Review badge — misses/reviews on the page just left
        // may have changed what is due.
        this.reviewDue.set(dueCount(loadQueue()));

        // One streak-day tick per navigation; a no-op after the first visit today.
        const newStreak = this.streak.recordVisit();
        if (newStreak !== null && newStreak > 1) {
          this.toast.show(`🔥 ${newStreak}-day study streak!`, 'success', 2600);
        }

        // Re-apply syntax highlighting after each navigation.
        setTimeout(() => {
          // `.code pre` is the overwhelmingly common shape, but a handful of
          // lessons use a bare `<pre class="code-block">`; both are code the
          // learner is meant to read closely, so both get tokenised.
          doc.querySelectorAll('.code pre, pre.code-block').forEach((pre) => {
            if (pre.closest('.demo')) return;
            const text = pre.textContent ?? '';
            if (!text.trim()) return;
            pre.innerHTML = highlight(text);
          });
        }, 0);
      });

    // fromEvent + takeUntilDestroyed for the scroll progress bar.
    // Uses throttleTime so we don't set the signal on every pixel.
    merge(
      fromEvent(window, 'scroll', { passive: true }),
      fromEvent(window, 'resize', { passive: true }),
    )
      .pipe(
        throttleTime(16, undefined, { leading: true, trailing: true }),
        map(() => {
          const el = doc.documentElement;
          const scrollable = el.scrollHeight - el.clientHeight;
          return scrollable > 0 ? Math.min(100, Math.round((el.scrollTop / scrollable) * 100)) : 0;
        }),
        takeUntilDestroyed(),
      )
      .subscribe((pct) => this.scrollPct.set(pct));
  }

  /** Flips between light and dark. The constructor effect persists and applies it. */
  protected toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
    this.toast.show(`${this.theme() === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 1400);
  }

  /**
   * Clears visited-lesson history from the footer button, reporting how much
   * was cleared. Reads the count *before* resetting, since it is zero after.
   */
  protected resetProgress(): void {
    const count = this.progress.visitedCount();
    this.progress.reset();
    this.toast.show(`Cleared ${count} visited lesson${count === 1 ? '' : 's'}`, 'success');
  }

  /**
   * Stars or un-stars the lesson currently being read, from the header.
   *
   * No-op off a lesson route. The curriculum title is looked up so the
   * Bookmarks page shows a real name rather than a route slug.
   */
  protected toggleBookmark(): void {
    const id = this.currentLessonId();
    if (!id) return;
    const lesson = CURRICULUM.find((l) => l.id === id);
    this.bookmarks.toggle(id, lesson?.title ?? id);
    this.toast.show(
      this.bookmarks.isBookmarked(id) ? 'Bookmarked' : 'Bookmark removed',
      'success',
      1400,
    );
  }

  /** ? key opens the keyboard shortcuts panel — demonstrates @defer when in app.html */
  protected readonly showShortcuts = signal(false);

  /**
   * Global keyboard handler: `?` toggles the shortcuts panel, `Escape` closes it.
   *
   * Bound on `document` rather than the host so it works no matter where focus
   * is. The `INPUT`/`TEXTAREA` check is what keeps it from hijacking a literal
   * `?` typed into the curriculum search box or a bookmark note.
   *
   * @param e The keydown event, passed through by the host listener.
   */
  @HostListener('document:keydown', ['$event'])
  protected onGlobalKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      this.showShortcuts.update((v) => !v);
    }
    if (e.key === 'Escape') {
      this.showShortcuts.set(false);
    }
  }
}
