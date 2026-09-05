import { ApplicationRef, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Layers } from '../../../shared/brain';
import type { ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: the View Transitions API — the browser primitive, Angular's router
 * integration (withViewTransitions), a LIVE same-document morph demo driven by
 * document.startViewTransition + ApplicationRef.tick, shared-element morphs,
 * the pseudo-element tree, and the pitfalls (duplicate names, fixed headers,
 * reduced motion).
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer. One analogy carries the whole page:
 * **two photographs and a dissolve.** Before anything changes, the browser
 * takes a picture of the page exactly as it is (the old snapshot). Then,
 * behind a curtain — your callback — the DOM gets rearranged, invisibly to
 * the user. The instant that settles, a second picture is taken (the new
 * snapshot). Only then does the browser project both photos and cross-fade
 * between them, morphing any piece that wears the same name tag in both.
 * That framing pays for itself repeatedly: it explains why a plain signal
 * write inside the callback animates nothing (the DOM hasn't actually
 * changed when the second photo is taken — see the opening Predict), why
 * hover states and videos freeze mid-transition (you're looking at a
 * photograph, not the live element), and why a duplicate
 * `view-transition-name` is fatal (two things can't wear the same name tag
 * in one photograph).
 */
@Component({
  selector: 'app-lesson-view-transitions',
  imports: [RouterLink, BfPage, Chapter, CodeLab, Layers, Faq, Predict, Quiz, Remember],
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Cross-Cutting track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Security', id: 'security' },
    { label: 'i18n', id: 'i18n' },
    { label: 'Accessibility', id: 'a11y' },
    { label: 'Animations', id: 'animations' },
    { label: 'View Transitions' },
  ];

  /** Abstract code for the opening predict — a signal write with no `tick()`. */
  readonly predictCode = `document.startViewTransition(() => {
  this.grownId.set(id);   // a signal write — no tick()
});`;

  /** The pseudo-element containment tree, as a nesting diagram. */
  protected readonly pseudoCore: Layer = {
    label: 'old / new',
    sub: '::view-transition-old / -new(name)',
  };
  /** Rings around {@link pseudoCore}, outermost first. */
  protected readonly pseudoRings: Layer[] = [
    { label: '::view-transition', sub: 'full-page overlay' },
    { label: '::view-transition-group(name)', sub: 'one per view-transition-name' },
    { label: '::view-transition-image-pair(name)', sub: 'holds both snapshots for that name' },
  ];

  /** Options for the duplicate-name self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'All twelve thumbnails morph into the hero image at once',
      why: 'The browser pairs elements by name, but it still needs exactly one element per name, per side of the transition, to know what maps to what. Twelve elements sharing one tag is not twelve morphs — it is an invalid snapshot before the transition can even start.',
    },
    {
      text: 'The browser skips the transition entirely and just navigates',
      correct: true,
      why: 'A view-transition-name must be unique on the page at the moment of the snapshot. Twelve elements sharing one name makes that snapshot invalid, so the browser throws it out and falls back to an instant, unanimated navigation — the same graceful failure as an unsupported browser.',
    },
    {
      text: 'Only the clicked thumbnail morphs; the other eleven fade normally',
      why: "Tempting, because it's what you probably wanted — but the browser has no way to know which of the twelve you clicked. It only sees a page with a duplicate name and gives up on the whole transition.",
    },
    {
      text: 'The console throws and the navigation is blocked',
      why: "It fails far more quietly than that. Nothing blocks the navigation — the page just navigates instantly with no animation, easy to miss unless you're specifically comparing against a working version.",
    },
  ];

  /** The "no dumb questions" block. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Can I start a new view transition while one is still running?',
      a: "Not usefully. Call startViewTransition again while one is in flight and there's no queue — the earlier transition is skipped and your change just applies instantly. There's no built-in debouncing, so guard fast repeated triggers yourself (disable the button, or track an in-flight flag) if a user can double-click.",
    },
    {
      q: 'My list morph stopped working after I added a second list using the same ids.',
      a: "view-transition-name collisions — two elements sharing a name in one snapshot invalidate the whole transition, the same failure as the duplicate-name quiz above. Namespace them: 'inbox-' + id versus 'archive-' + id.",
    },
    {
      q: 'How do I get a different animation for back vs forward navigation?',
      a: 'In onViewTransitionCreated, compare from/to — route depth or a dedicated nav-direction service — and set a class like vt-back on document.documentElement, then scope your ::view-transition-* CSS under it. Remove the class once transition.finished settles.',
    },
    {
      q: "What happens in a browser that doesn't support the API at all?",
      a: "Nothing bad: withViewTransitions() feature-detects document.startViewTransition and simply navigates without animation when it is missing. No polyfill, no error, no extra code path for you to write — the same fallback this lesson's own live demo uses.",
    },
    {
      q: 'Is there any real difference between transition.ready and transition.finished?',
      a: 'Yes — they mark different moments. ready resolves once the pseudo-element tree exists and the animation is about to start, which is the moment to kick off a custom Web Animations API call you want in sync with it. finished resolves once the animation has actually completed and the overlay is torn down — the correct moment for cleanup, like removing a direction class.',
    },
  ];

  // --- code samples ---
  /**
   * Sample: `document.startViewTransition` — the browser primitive. It snapshots
   * the old pixels, runs your DOM update, snapshots the new, and cross-fades
   * between them.
   */
  readonly primitiveSample = `const transition = document.startViewTransition(async () => {
  await updateTheDOM(); // mutate, swap routes, re-render …
});

await transition.ready; // pseudo-elements exist, about to animate
await transition.finished; // animation done, overlay removed`;

  /** Line-by-line notes for {@link primitiveSample}. */
  protected readonly primitiveNotes: CodeNote[] = [
    {
      line: 1,
      text: "This call is the shutter click on the OLD photograph — the browser freezes what's on screen right now, before your callback runs a single line.",
    },
    {
      line: 2,
      text: "Whatever happens here is invisible to the user — the old photo is still what's on screen. Mutate the DOM, swap routes, re-render — anything, as long as it finishes before the promise you return resolves.",
    },
    {
      line: 3,
      text: 'The instant this callback\'s promise resolves, the browser takes the second photograph automatically — you never call anything like "captureNewState()" yourself.',
    },
    {
      line: 5,
      text: 'ready resolves once the pseudo-element tree exists and the animation is about to start — the moment to fire off any custom Web Animations API call you want synced with it.',
    },
    {
      line: 6,
      text: 'finished resolves once the animation has actually finished playing and the overlay is torn down. This is the safe point for cleanup, like removing a temporary class.',
    },
  ];

  /**
   * Sample: this demo's own code, including the per-item `view-transition-name`
   * that is what makes an element morph rather than cross-fade.
   */
  readonly demoSample = `<div [style.view-transition-name]="'vt-card-' + card.id" …>

private withTransition(change: () => void) {
  if (!document.startViewTransition) { change(); return; }
  document.startViewTransition(() => {
    change(); // e.g. this.grownId.set(id) — a signal write
    this.appRef.tick(); // force the DOM to catch up before the new photo
  });
}`;

  /** Line-by-line notes for {@link demoSample}. */
  protected readonly demoNotes: CodeNote[] = [
    {
      line: 1,
      text: "The name tag — derived from each card's own id, so all six cards get distinct tags instead of one shared one. That's what turns a plain cross-fade into a tracked morph.",
    },
    {
      line: 4,
      text: 'The graceful-degradation branch: on a browser without the API, the change just runs with no photographs taken at all — no error, no missing feature to polyfill.',
    },
    {
      line: 5,
      text: 'The same primitive from the previous sample, wrapped in one small helper so every button in this demo can reuse it.',
    },
    {
      line: 6,
      text: 'A plain signal write only schedules a render — it has not reached the DOM yet at the moment this line returns.',
    },
    {
      line: 7,
      text: "Without this line, the browser's \"new\" photo would be taken before the DOM actually changed, so there would be nothing to animate — the card would silently snap to its grown size a moment later, once Angular's scheduler got around to it. Try predicting that failure again: it's exactly the opening Predict, reproduced in this demo's own source.",
    },
  ];

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

  /** Line-by-line notes for {@link enableSample}. */
  protected readonly enableNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Both ordinary named imports from @angular/router — no separate package to install, no schematic to run.',
    },
    {
      line: 6,
      text: "withViewTransitions() is a router feature function — passing it here is the entire opt-in. Every navigation now runs through document.startViewTransition() automatically, using Angular's own default cross-fade unless you add CSS to override it.",
    },
  ];

  /**
   * Sample: the keyframes this app animates with, plus the built-in `root`
   * pseudo-elements they target.
   */
  readonly cssSample = `@keyframes vt-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

@keyframes vt-fade-out {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-4px); }
}

::view-transition-new(root) { animation: vt-fade-in 0.22s ease both; }
::view-transition-old(root) { animation: vt-fade-out 0.18s ease both; }`;

  /** Line-by-line notes for {@link cssSample}. */
  protected readonly cssNotes: CodeNote[] = [
    {
      line: 1,
      text: "The incoming page's animation: starts slightly low and transparent, settles into place — the new photograph's entrance.",
    },
    {
      line: 6,
      text: 'The outgoing page leaves upward while the new one arrives from below — opposite directions read as one continuous movement instead of two unrelated fades.',
    },
    {
      line: 11,
      text: '`root` is the built-in name covering everything you never tagged yourself. `both` holds the first keyframe before the animation starts and the last one after it ends — drop it and you get a one-frame flash of the un-animated state at each end.',
    },
    {
      line: 12,
      text: 'The exit is deliberately faster than the entrance (0.18s vs 0.22s) — overlapping them this way avoids a visible gap where neither photograph is fully on screen. These pseudo-elements only exist in DevTools while a transition is actually running; pause the animation to inspect them.',
    },
  ];

  /**
   * Sample: a shared-element transition across a route change — the same
   * `view-transition-name` on both pages is the entire mechanism.
   */
  readonly sharedSample = `/* list page */
.card-thumbnail { view-transition-name: hero-image; }

/* detail page — same name, different element, different page */
.detail-hero    { view-transition-name: hero-image; }

/* pair the sticky header with itself so it doesn't cross-fade */
.site-header    { view-transition-name: header; }`;

  /** Line-by-line notes for {@link sharedSample}. */
  protected readonly sharedNotes: CodeNote[] = [
    {
      line: 2,
      text: "One name tag on the list page's thumbnail.",
    },
    {
      line: 5,
      text: "The SAME name tag, on a completely different element on a completely different page. That's the whole trick — the browser pairs any two elements sharing a name across the transition and morphs position, size and shape between them, so the thumbnail visibly grows into the hero image.",
    },
    {
      line: 8,
      text: 'Anything without its own name falls into the built-in root group and cross-fades as one flat bitmap — including a fixed header, which then visibly flickers. Giving it its own name pairs it with itself across the navigation instead, so it just sits still.',
    },
  ];

  /**
   * Sample: `onViewTransitionCreated`, for skipping the animation on navigations
   * that should not have one.
   */
  readonly hookSample = `withViewTransitions({
  onViewTransitionCreated: ({ transition, from, to }) => {
    if (from.url[0]?.path === to.url[0]?.path) {
      transition.skipTransition();
    }
    document.documentElement.classList.toggle('vt-back', isBackNav(from, to));
    transition.finished.finally(() =>
      document.documentElement.classList.remove('vt-back'));
  },
})`;

  /** Line-by-line notes for {@link hookSample}. */
  protected readonly hookNotes: CodeNote[] = [
    {
      line: 2,
      text: "Fires for every navigation that would start a transition — before startViewTransition() has actually been called — with the ViewTransition object plus the router's from/to snapshots.",
    },
    {
      line: 4,
      text: "Same-page, different-hash navigations (jumping to an anchor) don't need a full-page photograph swap. skipTransition() cancels it and the navigation happens instantly, with none of the pseudo-element machinery running at all.",
    },
    {
      line: 6,
      text: "Comparing route depth (or a dedicated nav-direction service) tags the whole document as a 'back' navigation — CSS scoped under .vt-back can then reverse the slide direction, so a back button visually feels like going back.",
    },
    {
      line: 7,
      text: 'The same finished promise from the first code sample in this lesson — resolving once the animation completes and the overlay is torn down, the correct moment to remove a class you only needed during the transition.',
    },
  ];

  /**
   * Sample: honouring `prefers-reduced-motion`.
   */
  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.01ms !important;
  }
}`;

  /** Line-by-line notes for {@link reducedMotionSample}. */
  protected readonly reducedMotionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Reads the same OS-level setting used throughout this app — one override here silently fixes every transition on the page at once, because it targets the built-in root pseudo-elements every transition uses by default.',
    },
    {
      line: 4,
      text: '0.01ms, not `animation: none`. The transition machinery relies on an animation actually finishing to tear its pseudo-elements down — cancelling it outright can strand the overlay on screen. An imperceptibly short duration still fires the finish event, so cleanup still happens, without the motion. `!important` matters too: these rules typically live in a global stylesheet that would otherwise lose on specificity.',
    },
  ];
}
