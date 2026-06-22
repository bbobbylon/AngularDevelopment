import { DOCUMENT } from '@angular/common';
import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { fromEvent, merge } from 'rxjs';
import { filter, map, throttleTime } from 'rxjs/operators';
import { APP_CONFIG } from './core/app-config.token';
import { ProgressService } from './core/progress.service';
import { ToastService } from './core/toast.service';
import { highlight } from './shared/highlighter';
import { ToastsComponent } from './shared/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Angular Concepts');
  protected readonly theme = signal<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  );

  /** Scroll progress (0–100) for the reading-progress bar. */
  protected readonly scrollPct = signal(0);

  /** Injected via InjectionToken — no class needed for plain config objects. */
  protected readonly config = inject(APP_CONFIG);
  protected readonly progress = inject(ProgressService);
  protected readonly toast = inject(ToastService);

  constructor() {
    const router = inject(Router);
    const doc = inject(DOCUMENT);

    // effect() — sync theme signal to DOM attribute + localStorage on every write.
    effect(() => {
      doc.documentElement.setAttribute('data-theme', this.theme());
      localStorage.setItem('theme', this.theme());
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

        // Re-apply syntax highlighting after each navigation.
        setTimeout(() => {
          doc.querySelectorAll('.code pre').forEach((pre) => {
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

  protected toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
    this.toast.show(`${this.theme() === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 1400);
  }

  protected resetProgress(): void {
    const count = this.progress.visitedCount();
    this.progress.reset();
    this.toast.show(`Cleared ${count} visited lesson${count === 1 ? '' : 's'}`, 'success');
  }

  /** ? key opens the keyboard shortcuts panel — demonstrates @defer when in app.html */
  protected readonly showShortcuts = signal(false);

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
