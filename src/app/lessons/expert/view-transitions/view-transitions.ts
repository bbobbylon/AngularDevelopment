import { ApplicationRef, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: the View Transitions API — the browser primitive
 * (`document.startViewTransition`), Angular's router integration
 * (`withViewTransitions`), a LIVE same-document morph demo driven by
 * `startViewTransition` + `ApplicationRef.tick`, shared-element morphs and the
 * structural rules that break them, the pseudo-element tree, and the pitfalls
 * (duplicate names, fixed headers, lazy routes, reduced motion).
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9) following the shape set by
 * `expert/change-detection`: pose the problem before naming it, give the
 * mechanism an analogy before the vocabulary, then say the same thing across
 * several modes — a dialogue, a step diagram, a containment diagram, an
 * annotated snippet, a live demo — because redundancy across modes is what
 * makes it stick, not repetition within one.
 *
 * ## Coverage added over the pre-migration lesson
 *
 * A prior coverage sweep (`docs/COVERAGE-SWEEP.md`) flagged four gaps, all
 * folded in here: `skipInitialTransition` and a per-route `onViewTransitionCreated`
 * opt-out; the structural rules that break a shared-element morph (a named
 * element must generate a single box, and it is lifted out of every ancestor's
 * clipping/radius/transform for the length of the transition); `object-fit` on
 * a stretched image plus `view-transition-class`; and the two-part failure mode
 * where a lazy route freezes the old snapshot while `transition.ready` rejects
 * on a skipped transition but `transition.finished` does not.
 */
@Component({
  selector: 'app-lesson-view-transitions',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Flow,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
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
    { label: 'a11y', id: 'a11y' },
    { label: 'Animations', id: 'animations' },
    { label: 'View Transitions' },
  ];

  /**
   * The exchange between your code and the browser during one transition.
   *
   * Exists because the misconception this lesson keeps correcting — that the
   * browser somehow inspects *how* the DOM changed — dissolves the moment you
   * see it as a conversation with exactly two photograph-taking moments in it.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: 'I called `startViewTransition(callback)`. Go.',
    },
    {
      who: 'The browser',
      says: "Hold still — I'm photographing everything on screen, right now, before your callback runs.",
    },
    {
      who: 'Your code',
      says: 'Picture taken. Mutating the DOM inside your callback — router navigation, a signal write, whatever I want.',
    },
    {
      who: 'The browser',
      says: "I'll wait for your promise to resolve... done. Second photograph. Now I build an overlay, pair up anything sharing a name, and animate old into new — you were frozen behind glass the whole time.",
    },
  ];

  /**
   * Sample: `document.startViewTransition` — the browser primitive. Snapshot
   * old, run the callback, snapshot new, animate the two bitmaps.
   */
  protected readonly primitiveSample = `const transition = document.startViewTransition(async () => {
  await updateTheDOM();       // the DOM really changes here — old pixels stay frozen on screen
});

await transition.ready;       // pseudo-elements exist; the animation is about to start
await transition.finished;    // animation done, overlay torn down`;

  /** Line-by-line walkthrough of {@link primitiveSample}. */
  protected readonly primitiveNotes: CodeNote[] = [
    {
      line: 1,
      text: '`document.startViewTransition(callback)` returns a `ViewTransition` object, here assigned to `transition`. The callback is `async`, which is what lets you `await` real work inside it — a plain synchronous function works too, it just can’t wait for anything.',
    },
    {
      line: 2,
      text: 'The only place your DOM is allowed to change. The browser already has its **old** screenshot in hand before this line runs, so whatever you do here — however drastic — happens invisibly behind that photograph.',
    },
    {
      line: 3,
      text: 'The callback’s returned promise settles here. This exact moment is when the browser takes its **second** screenshot. Everything after this point is animation, not DOM work.',
    },
    {
      line: 5,
      text: '`transition.ready` resolves once the pseudo-element tree — `::view-transition`, `::view-transition-group`, and friends — has been built and the animation is about to start. It **rejects** if the transition never really starts, so a bare `await` here is a real risk (more on that later).',
    },
    {
      line: 6,
      text: '`transition.finished` resolves once the animation has actually played out and the overlay has been torn down. Unlike `ready`, it resolves even for a **skipped** transition — which makes it the safer place for cleanup that must always run.',
    },
  ];

  /**
   * Sample: this demo's own code, including the per-item `view-transition-name`
   * that is what makes an element morph rather than cross-fade.
   */
  protected readonly demoSample = `// each card gets its OWN name, so the browser can pair it individually:
// <div [style.view-transition-name]="'vt-card-' + card.id">

private withTransition(change: () => void): void {
  if (!document.startViewTransition) {
    change();                // unsupported browser — just apply the change
    return;
  }
  document.startViewTransition(() => {
    change();                 // e.g. this.cards.update(...)
    this.appRef.tick();       // flush the render BEFORE the browser's 2nd screenshot
  });
}`;

  /** Line-by-line walkthrough of {@link demoSample}. */
  protected readonly demoNotes: CodeNote[] = [
    {
      line: 2,
      text: '`[style.view-transition-name]` is an ordinary Angular style binding — nothing view-transition-specific about the syntax. It just happens to write a CSS property the browser treats specially.',
    },
    {
      line: 4,
      text: '`change: () => void` is the actual mutation this helper wraps — in this demo, a call that updates the `cards` signal.',
    },
    {
      line: 5,
      text: 'The exact same feature check as `supported` above — `document.startViewTransition` is simply `undefined` in a browser that lacks it, so the `!` short-circuits straight to plainly applying the change.',
    },
    {
      line: 9,
      text: 'The real call. `document.startViewTransition` takes a callback and hands back a `ViewTransition` — unused here, but it’s what you’d hold onto to read `.ready` / `.finished`.',
    },
    {
      line: 10,
      text: 'Runs the mutation while the **old** screenshot is still the only thing on screen.',
    },
    {
      line: 11,
      text: '**Easy to forget, and the whole reason this demo works at all.** A signal write only schedules a render — `appRef.tick()` forces Angular to apply it synchronously, right now, before control returns to the browser and it takes its second screenshot.',
    },
  ];

  /**
   * Sample: `withViewTransitions()`, the router integration, with the option
   * every real app ends up flipping on.
   */
  protected readonly enableSample = `// app.config.ts
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions({
      skipInitialTransition: true,
    })),
  ],
};`;

  /** Line-by-line walkthrough of {@link enableSample}. */
  protected readonly enableNotes: CodeNote[] = [
    {
      line: 2,
      text: '`withViewTransitions` is a router **feature function** — the same family as `withPreloading` or `withComponentInputBinding` — passed as a second argument to `provideRouter`.',
    },
    {
      line: 6,
      text: 'This one call wraps **every** navigation from now on: activation and change detection run inside `document.startViewTransition()`’s callback automatically. You never call the browser API yourself for routed navigations.',
    },
    {
      line: 7,
      text: '`skipInitialTransition: true` — the option covered next. Without it, the very first navigation animates too, and there is no meaningful “old” page to animate from.',
    },
  ];

  /**
   * Sample: shared-element morph across a route change — same
   * `view-transition-name` on both pages is the entire mechanism.
   */
  protected readonly sharedSample = `/* list page */
.card-thumbnail {
  view-transition-name: 'hero-image';
}

/* detail page — SAME literal name, different element, different page */
.detail-hero {
  view-transition-name: 'hero-image';
}

/* the sticky header gets its own name too, or it cross-fades with
   everything else lumped into (root) and visibly flickers */
.site-header {
  view-transition-name: 'header';
}`;

  /** Line-by-line walkthrough of {@link sharedSample}. */
  protected readonly sharedNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The name that makes this element trackable at all. On its own, on one page, it does nothing special — the trick only appears once a **second** element claims the same name.',
    },
    {
      line: 8,
      text: 'Different selector, different page, but the **exact same string**. That is the entire mechanism: the browser pairs any two elements that carried this name across the navigation and morphs position, size and shape between them — the thumbnail visibly grows into the hero image.',
    },
    {
      line: 14,
      text: 'Nothing here is *for* the thumbnail/hero pair — this is the fixed header opting itself out of the default `(root)` cross-fade, so it sits rock-solid instead of flickering with the rest of the page.',
    },
  ];

  /**
   * Sample: customising the route animation with CSS on the built-in `root`
   * pseudo-elements.
   */
  protected readonly cssSample = `@keyframes vt-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
@keyframes vt-fade-out {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-4px); }
}

::view-transition-new(root) { animation: vt-fade-in 0.22s ease both; }
::view-transition-old(root) { animation: vt-fade-out 0.18s ease both; }`;

  /** Line-by-line walkthrough of {@link cssSample}. */
  protected readonly cssNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A normal `@keyframes` block — nothing about its name is special to the API. It describes the incoming page’s own fade-and-rise.',
    },
    {
      line: 3,
      text: 'Settles fully opaque with no offset — the state the new page holds once the animation ends.',
    },
    {
      line: 10,
      text: '`::view-transition-new(root)` targets the **incoming** snapshot for the built-in name `root` — anything that never got its own `view-transition-name`. `both` keeps the first keyframe’s values before the animation starts and the last one’s after it ends, so there is no one-frame flash of the un-animated state.',
    },
    {
      line: 11,
      text: 'The outgoing animation is **faster** than the incoming one on purpose — 0.18s against 0.22s. Overlapping them this way means there is never a moment where neither page is fully visible.',
    },
  ];

  /**
   * Sample: `onViewTransitionCreated` extended with a per-route opt-out and the
   * `ready` rejection every real app eventually hits.
   */
  protected readonly hookSample = `withViewTransitions({
  skipInitialTransition: true,        // no meaningful "old" page on first load
  onViewTransitionCreated: ({ transition, from, to }) => {
    // Per-route opt-out: mark a route with data: { skipTransition: true }
    if (to.data?.['skipTransition']) {
      transition.skipTransition();
      return;
    }
    // Anchor-only navigation — same page, different hash — needs no transition
    if (from.url[0]?.path === to.url[0]?.path) {
      transition.skipTransition();
      return;
    }
    document.documentElement.classList.toggle('vt-back', isBackNav(from, to));
    // A skipped transition rejects "ready" — never leave that unhandled
    transition.ready.catch(() => {});
    transition.finished.finally(() =>
      document.documentElement.classList.remove('vt-back'));
  },
})`;

  /** Line-by-line walkthrough of {@link hookSample}. */
  protected readonly hookNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The flag from the section above, shown here alongside the hook it is usually paired with — both are how a real app tunes `withViewTransitions()` past its defaults.',
    },
    {
      line: 3,
      text: 'Fires for every navigation that reaches this point, handing you the in-flight `transition` plus `from`/`to` route snapshots — your one chance to inspect or cancel before the animation commits.',
    },
    {
      line: 5,
      text: '`to.data` reads the **route config’s** static `data` object — the standard place to tag a route with metadata your own code can act on, here a flag named `skipTransition`.',
    },
    {
      line: 6,
      text: '`skipTransition()` cancels the animation for **this navigation only**. The route still activates and the DOM still swaps — just instantly, with no transition.',
    },
    {
      line: 10,
      text: 'Catches an anchor-only jump: same route, only the fragment changed. Animating a whole-page cross-fade for that would be a distraction, not a feature.',
    },
    {
      line: 14,
      text: 'Toggles a class the CSS can key off — the standard way to give back-navigation a different animation (e.g. reversing a slide direction) from forward navigation.',
    },
    {
      line: 16,
      text: '`ready` rejects whenever a transition does not actually start — skipped here, or the document went hidden. Leave this unhandled and it is an unhandled promise rejection in the console on every skip.',
    },
    {
      line: 17,
      text: '`finished` resolves once the animation has genuinely played out — **and, unlike `ready`, it resolves even when the transition was skipped** — which is exactly why cleanup belongs here rather than after `ready`.',
    },
  ];

  /** Sample: honouring `prefers-reduced-motion`. */
  protected readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.01ms !important;
  }
}`;

  /** Line-by-line walkthrough of {@link reducedMotionSample}. */
  protected readonly reducedMotionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The OS/browser-level signal that a person has asked for reduced motion. It overrides your own animation preference as the developer, not the other way round.',
    },
    {
      line: 2,
      text: 'Both pseudo-elements — old **and** new — need the override, or half of every transition (yours, plus the browser’s own defaults) keeps animating.',
    },
    {
      line: 4,
      text: '**`0.01ms`, never `animation: none`.** The transition machinery tears its overlay down when an animation *finishes* — cancel one outright with `none` and you can strand the overlay on screen instead. An imperceptibly short duration still fires the finish event, so cleanup still happens normally. The `!important` is because these rules often have to beat a global stylesheet’s own specificity.',
    },
  ];

  /**
   * The self-test.
   *
   * The distractors are the ways learners misdiagnose the `appRef.tick()`
   * gotcha demonstrated live above — as a thrown error, as a permanently stuck
   * page, and as something zoneless made unnecessary. The `why` on each wrong
   * answer names that specific misconception (CONTRIBUTING §2A).
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'It throws — `startViewTransition()` requires the DOM to already match by the time the callback resolves.',
      why: 'It does not throw, and there is no such requirement. The API has no idea whether your callback did anything at all — it just takes its "before" and "after" screenshots and animates between them, whatever they happen to show.',
    },
    {
      text: 'The transition still plays, but the "after" screenshot is taken before Angular applies the change — so nothing appears to move.',
      correct: true,
      why: 'Exactly. `set()`/`update()` only mark the view dirty and schedule a render; they do not run one. The callback’s promise resolves immediately after that scheduling call, long before the scheduled render happens, so the browser’s second screenshot is identical to its first.',
    },
    {
      text: 'The route stays on the old page forever, until you refresh.',
      why: 'The pending render is not lost, only late. The very next change-detection pass — triggered by anything at all, a click somewhere else, a timer — applies it instantly, with zero animation. That is what makes this bug look like "the transition did not work" rather than "nothing rendered".',
    },
    {
      text: 'Nothing — signal writes render synchronously in a zoneless app, `tick()` or not.',
      why: 'Zoneless removes the automatic zone.js trigger; it does not make signal writes synchronous. Marking-and-scheduling is exactly the same operation with or without zones — something still has to run the scheduled pass, and inside a transition callback nothing does unless you force it.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'What’s the difference between `transition.ready` and `transition.finished`?',
      a: '`ready` resolves once the pseudo-element tree exists and the animation is about to start — your last chance to tweak something before it plays. `finished` resolves once the animation has actually played out and the overlay is gone — your cleanup hook. The trap: `ready` **rejects** if the transition never really starts (skipped, or the tab went hidden), so always pair it with a `.catch()`. `finished` resolves either way.',
    },
    {
      q: 'My list morph stopped working after I added a second list with the same item ids.',
      a: 'A name collision. Two elements sharing one `view-transition-name` inside the same snapshot invalidates the whole transition — the browser cannot tell which one is really `card-3`. Namespace it per list, e.g. `inbox-3` and `archive-3`, so the two never clash.',
    },
    {
      q: 'Why does Angular run change detection *inside* the transition callback instead of just letting the signal write happen on its own?',
      a: 'Because the browser takes its "after" screenshot the instant your callback’s promise resolves — not whenever Angular gets around to rendering. If the update were only scheduled, the screenshot would show the same picture twice. The router’s integration forces a render inside the callback for every navigation; the live demo above does the same thing by hand with `appRef.tick()`.',
    },
    {
      q: 'What happens in a browser that does not support the API at all?',
      a: 'Nothing bad. Both the raw API calls and `withViewTransitions()` feature-detect `document.startViewTransition` and just apply the change with no animation and no error. No polyfill, no fallback code path for you to write — which is exactly why this app can use it in production without worrying about who is visiting.',
    },
    {
      q: 'Can the same view-transition-name be reused on completely different pages?',
      a: 'Yes — that is the whole shared-element trick. The uniqueness rule is **per snapshot**, not app-wide. A list page’s thumbnail and a detail page’s hero image can share a name precisely because they are never both on screen, and named, at the same instant.',
    },
  ];
}
