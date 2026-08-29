import { ApplicationRef, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the View Transitions API — the browser primitive, Angular's router
 * integration (withViewTransitions), a LIVE same-document morph demo driven by
 * document.startViewTransition + ApplicationRef.tick, shared-element morphs,
 * the pseudo-element tree, and the pitfalls (duplicate names, fixed headers,
 * reduced motion).
 */
@Component({
  selector: 'app-lesson-view-transitions',
  imports: [RouterLink],
  styleUrl: './view-transitions.css',
  templateUrl: './view-transitions.html',
})
export class ViewTransitions {
  /**
   * The application ref, so a transition can flush rendering synchronously.
   */
  private readonly appRef = inject(ApplicationRef);
  // TypeScript's DOM lib types startViewTransition natively; older browsers
  // may still lack it at runtime, hence the typeof guard below.
  /**
   * The document, aliased so the feature check and the calls read the same.
   */
  private readonly doc = document;

  /**
   * Whether the browser supports the View Transition API. Everything degrades to
   * an instant, un-animated change when it does not.
   */
  protected readonly supported = typeof this.doc.startViewTransition === 'function';

  /**
   * The cards being animated.
   */
  protected readonly cards = signal([
    { id: 1, color: 'rgba(79,70,229,.25)' },
    { id: 2, color: 'rgba(16,185,129,.25)' },
    { id: 3, color: 'rgba(245,158,11,.25)' },
    { id: 4, color: 'rgba(239,68,68,.25)' },
    { id: 5, color: 'rgba(139,92,246,.25)' },
    { id: 6, color: 'rgba(14,165,233,.25)' },
  ]);
  /**
   * Which card is enlarged, or `null`.
   */
  protected readonly grownId = signal<number | null>(null);

  /** Run a state change inside a view transition (or plainly, if unsupported). */
  private withTransition(change: () => void) {
    if (!this.doc.startViewTransition) {
      change();
      return;
    }
    this.doc.startViewTransition(() => {
      change();
      // Signal writes only SCHEDULE rendering — flush synchronously so the
      // "new" snapshot sees the updated DOM (the router integration does this too).
      this.appRef.tick();
    });
  }

  /**
   * Shuffles the cards inside a transition, so they morph to their new positions.
   */
  protected shuffle() {
    this.withTransition(() =>
      this.cards.update((list) =>
        list
          .map((c, i) => ({ c, k: Math.sin(c.id * 7919 + i + list[0].id) }))
          .sort((a, b) => a.k - b.k)
          .map(({ c }) => c),
      ),
    );
  }

  /**
   * Sorts the cards inside a transition.
   */
  protected sort() {
    this.withTransition(() => this.cards.update((list) => [...list].sort((a, b) => a.id - b.id)));
  }

  /**
   * Grows or shrinks one card inside a transition.
   *
   * @param id The card.
   */
  protected toggleGrow(id: number) {
    this.withTransition(() => this.grownId.update((g) => (g === id ? null : id)));
  }

  /**
   * Sample: `document.startViewTransition` — the browser primitive. It snapshots
   * the old pixels, runs your DOM update, snapshots the new, and cross-fades
   * between them.
   */
  readonly primitiveSample = `const transition = document.startViewTransition(async () => {
  // ← old pixels are frozen on screen right now
  await updateTheDOM();          // mutate, swap routes, re-render …
  // ← when this promise resolves, the browser snapshots the NEW state
});

await transition.ready;      // pseudo-elements exist, animation about to start
await transition.finished;   // animation done, overlay removed`;

  /**
   * Sample: this demo's own code, including the per-item `view-transition-name`
   * that is what makes an element morph rather than cross-fade.
   */
  readonly demoSample = `// template — a unique name per item is what enables the morph:
// <div [style.view-transition-name]="'vt-card-' + card.id" …>

private withTransition(change: () => void) {
  if (!document.startViewTransition) { change(); return; }  // graceful no-op
  document.startViewTransition(() => {
    change();              // signal update
    this.appRef.tick();    // flush rendering BEFORE the new snapshot
  });
}`;

  /**
   * Sample: `withViewTransitions()`, the router integration.
   */
  readonly enableSample = `// app.config.ts
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
  ],
};`;

  /**
   * Sample: the pseudo-element tree a transition creates, which is what the CSS
   * selectors are actually targeting.
   */
  readonly pseudoTreeSample = `::view-transition                      ← full-viewport overlay
└─ ::view-transition-group(root)       ← one group per view-transition-name
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)   ← bitmap of the outgoing state
      └─ ::view-transition-new(root)   ← the incoming state`;

  /**
   * Sample: the keyframes this app animates with.
   */
  readonly cssSample = `/* ── the animation used in this app ── */
@keyframes vt-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes vt-fade-out {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-4px); }
}

::view-transition-new(root) { animation: vt-fade-in 0.22s ease both; }
::view-transition-old(root) { animation: vt-fade-out 0.18s ease both; }`;

  /**
   * Sample: a shared-element transition across a route change — the same
   * `view-transition-name` on both pages is the entire mechanism.
   */
  readonly sharedSample = `/* list page */
.card-thumbnail { view-transition-name: hero-image; }

/* detail page */
.detail-hero    { view-transition-name: hero-image; }

/* keep the sticky nav from cross-fading with the page: pair it with itself */
.site-header    { view-transition-name: header; }`;

  /**
   * Sample: `onViewTransitionCreated`, for skipping the animation on navigations
   * that should not have one.
   */
  readonly hookSample = `withViewTransitions({
  onViewTransitionCreated: ({ transition, from, to }) => {
    // Skip animation for anchor-only navigations (same page, different hash)
    if (from.url[0]?.path === to.url[0]?.path) {
      transition.skipTransition();
    }
    // Direction-aware CSS: <html class="vt-back"> … scope your ::view-transition rules
    document.documentElement.classList.toggle('vt-back', isBackNav(from, to));
    transition.finished.finally(() =>
      document.documentElement.classList.remove('vt-back'));
  },
})`;

  /**
   * Sample: honouring `prefers-reduced-motion`.
   */
  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.01ms !important;
  }
}`;
}
