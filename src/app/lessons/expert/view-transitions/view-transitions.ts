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
  styles: [`
    .demo a { color: var(--blue); }

    .vt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 460px; }
    .vt-card {
      padding: 18px 0; text-align: center; font-weight: 700; border-radius: 10px;
      border: 1px solid var(--border); background: var(--bg-elevated);
    }
    .vt-card.grown { grid-column: span 3; padding: 34px 0; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>View Transitions</h1>
      <p class="lead">
        The browser's native View Transitions API animates between two DOM
        <strong>snapshots</strong>: freeze the old pixels, let you mutate the DOM, then
        animate old → new with plain CSS. Angular's router integrates it via
        <code>withViewTransitions()</code> — one line of config —
        <strong>and this very app uses it</strong> for every navigation. This page
        covers the primitive itself, the router wiring, a live same-document morph,
        and the production pitfalls.
      </p>

      <h2>The primitive — document.startViewTransition()</h2>
      <div class="code"><pre>{{ primitiveSample }}</pre></div>
      <p>
        Three phases: (1) the browser <em>captures</em> the current state as an image,
        (2) it runs your callback — this is where the DOM actually changes — and waits
        for the promise you return, (3) it captures the new state and animates between
        the two. While the transition runs, the page is covered by a tree of
        pseudo-elements you can style like any other element.
      </p>

      <h2>Live — same-document morph (no router involved)</h2>
      <p>
        Each card below has a unique <code>view-transition-name</code>, so the browser
        treats it as a tracked element: when the DOM changes inside
        <code>startViewTransition()</code>, matching names morph from old position/size
        to new — position, scale, everything — with zero animation code:
      </p>
      <div class="demo">
        <p class="demo__title">Live — per-item names + startViewTransition ({{ supported ? 'supported here ✓' : 'not supported in this browser — buttons still work, just without the morph' }})</p>
        <div class="vt-grid">
          @for (card of cards(); track card.id) {
            <div
              class="vt-card"
              [class.grown]="grownId() === card.id"
              [style.background]="card.color"
              [style.view-transition-name]="'vt-card-' + card.id"
              (click)="toggleGrow(card.id)"
            >
              {{ card.id }}
            </div>
          }
        </div>
        <div class="row" style="margin-top:12px">
          <button (click)="shuffle()">Shuffle (watch them fly)</button>
          <button class="ghost" (click)="sort()">Sort back</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          Click a card to grow/shrink it — same mechanism, the size change morphs.
          No <code>&#64;keyframes</code>, no animation library: the names pair the
          snapshots and the browser interpolates the geometry.
        </p>
      </div>
      <div class="code"><pre>{{ demoSample }}</pre></div>
      <div class="note">
        The subtle part in an Angular app: the browser waits for your callback, but a
        signal write only <em>schedules</em> rendering. The demo calls
        <code>ApplicationRef.tick()</code> inside the callback so the DOM is truly
        updated before the "new" snapshot is taken — which is exactly what the
        router's integration does for navigations.
      </div>

      <h2>Router integration — enable it</h2>
      <div class="code"><pre>{{ enableSample }}</pre></div>
      <p>
        That is the entire Angular-side setup. Every router navigation now wraps the
        activation in <code>document.startViewTransition()</code>: the browser freezes
        the old route's pixels, Angular swaps the component tree and runs change
        detection inside the callback, then the browser cross-fades (by default)
        between the snapshots.
      </p>

      <h2>The pseudo-element tree — what you actually style</h2>
      <div class="code"><pre>{{ pseudoTreeSample }}</pre></div>
      <table class="cmp">
        <tr><th>Pseudo-element</th><th>What it is</th></tr>
        <tr><td><code>::view-transition</code></td><td>root overlay covering the viewport during the transition</td></tr>
        <tr><td><code>::view-transition-group(name)</code></td><td>per-name container; its default animation IS the position/size morph</td></tr>
        <tr><td><code>::view-transition-image-pair(name)</code></td><td>holds the two snapshots for that name</td></tr>
        <tr><td><code>::view-transition-old(name)</code></td><td>screenshot of the outgoing state (default: fade out)</td></tr>
        <tr><td><code>::view-transition-new(name)</code></td><td>live representation of the incoming state (default: fade in)</td></tr>
      </table>
      <p>
        Everything not explicitly named belongs to the built-in name
        <code>root</code> — which is why customizing the whole-page animation targets
        <code>::view-transition-old(root)</code> / <code>::view-transition-new(root)</code>.
      </p>

      <h2>Customise the route animation with CSS</h2>
      <div class="code"><pre>{{ cssSample }}</pre></div>

      <h2>Shared-element morph across routes</h2>
      <p>
        Assign the <em>same</em> <code>view-transition-name</code> to a matching element
        in the old and new route. The browser pairs them and morphs — the classic
        "thumbnail expands into hero image" effect, no FLIP math, no animation library:
      </p>
      <div class="code"><pre>{{ sharedSample }}</pre></div>
      <div class="note">
        <code>view-transition-name</code> must be <strong>unique per page at snapshot
        time</strong> — a duplicate name skips the transition entirely (the console
        warns). For lists, derive it from the id:
        <code>[style.view-transition-name]="'item-' + item.id"</code> — exactly what the
        live demo above does.
      </div>

      <h2>Hook in from TypeScript</h2>
      <div class="code"><pre>{{ hookSample }}</pre></div>
      <p>
        <code>onViewTransitionCreated</code> fires with the <code>ViewTransition</code>
        object plus the from/to router states — the place to skip transitions for
        same-page navigations, add a direction class (back vs forward) for
        slide-left/slide-right CSS, or await <code>transition.finished</code> for
        cleanup.
      </p>

      <h2>View Transitions vs Angular route animations</h2>
      <table class="cmp">
        <tr><th></th><th>View Transitions API</th><th>&#64;angular/animations route animations</th></tr>
        <tr><td>Setup</td><td>1 line + CSS</td><td>trigger + query/group/animate DSL on the outlet</td></tr>
        <tr><td>Shared-element morph</td><td>built in (names)</td><td>manual FLIP-style measurement, hard</td></tr>
        <tr><td>Runs on</td><td>compositor snapshots — old view stays visible while the new one loads</td><td>live DOM — both trees exist simultaneously in the outlet</td></tr>
        <tr><td>Works outside Angular</td><td>yes — it's a web platform API</td><td>no</td></tr>
        <tr><td>Support</td><td>needs a modern browser (graceful no-op elsewhere)</td><td>everywhere Angular runs</td></tr>
      </table>
      <p>
        The animations package is also in maintenance mode — for route-level motion,
        view transitions are the modern default; reach for the DSL only when you need
        orchestration the snapshot model can't express.
      </p>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>Duplicate names</strong> silently skip the transition — dynamic lists must derive names from ids.</li>
        <li><strong>Fixed headers "swim":</strong> the default root cross-fade snapshots the <em>whole page</em>, including your sticky nav. Give the header its own <code>view-transition-name: header;</code> so it's paired with itself and stays rock-solid while content fades.</li>
        <li><strong>Snapshots aren't live:</strong> the old view is a bitmap — hover states, videos, and canvases freeze during the transition. Keep durations short (150–250ms).</li>
        <li><strong>The page is non-interactive</strong> while a transition runs — a 2s artistic transition means 2s of dead clicks.</li>
        <li><strong>Names must exist on both sides</strong> for a morph; a name present only on one side just fades in/out as its own group.</li>
      </ul>

      <h2>Always respect reduced motion</h2>
      <div class="code"><pre>{{ reducedMotionSample }}</pre></div>
      <div class="warn">
        Omitting the reduced-motion override means users with vestibular disorders
        experience forced animation on every navigation. Always add it. Browsers that
        don't support the API navigate instantly as a no-op — no polyfill needed.
      </div>

      <h2>Try it — navigate between lessons</h2>
      <div class="demo">
        <p class="demo__title">Live — this app uses withViewTransitions()</p>
        <p style="margin:0 0 12px">Click any link in the nav bar or the cards on the home page.
        Watch the subtle fade+slide as Angular hands off between routes — that is the
        View Transitions API in action.</p>
        <div class="row">
          <a routerLink="/" style="font-size:.9rem">← Go home and come back</a>
          <span class="pill">withViewTransitions() ✓ active</span>
        </div>
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Walk through what the browser does during <code>startViewTransition(cb)</code>.</summary>
        <div>Capture a snapshot of every named element (plus <code>root</code>); run
        <code>cb</code> and await its promise — the DOM mutates here while the old
        pixels stay on screen; capture the new state; build the
        <code>::view-transition</code> pseudo-tree and run the default (or your CSS)
        animations old → new; resolve <code>finished</code> and tear the overlay down.</div>
      </details>
      <details class="qa">
        <summary>Why does Angular need to run change detection <em>inside</em> the transition callback?</summary>
        <div>The "new" snapshot is taken when the callback's promise resolves. If the
        DOM update were merely scheduled (signal write, markForCheck), the new
        snapshot would capture the <em>old</em> DOM and nothing would animate. The
        router integration performs activation + CD within the callback for exactly
        this reason.</div>
      </details>
      <details class="qa">
        <summary>Your list morph stopped working after adding a second list with the same item ids. Why?</summary>
        <div><code>view-transition-name</code> collisions: two elements sharing a name
        in one snapshot invalidate the transition. Namespace them
        (<code>'inbox-' + id</code> vs <code>'archive-' + id</code>).</div>
      </details>
      <details class="qa">
        <summary>How do you get a different animation for back vs forward navigation?</summary>
        <div>In <code>onViewTransitionCreated</code>, compare from/to (e.g. route depth
        or a nav-direction service), set a class like <code>vt-back</code> on
        <code>document.documentElement</code>, and scope your
        <code>::view-transition-*</code> CSS under it. Remove the class when
        <code>transition.finished</code> settles.</div>
      </details>
      <details class="qa">
        <summary>What happens in Firefox ESR / older Safari with <code>withViewTransitions()</code> enabled?</summary>
        <div>Nothing bad: the integration feature-detects
        <code>document.startViewTransition</code> and simply navigates without
        animation. No polyfill, no error, no extra code path for you to write.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>The API is snapshot-based: capture old → mutate DOM in the callback → capture new → animate. The DOM must be truly updated before the callback resolves.</li>
        <li><code>withViewTransitions()</code> is one line; customise with <code>::view-transition-old/new(root)</code> CSS.</li>
        <li>Matching <code>view-transition-name</code>s morph elements across states — unique per page, derive from ids in lists.</li>
        <li>Name your sticky header so it doesn't cross-fade; keep transitions ≤250ms; always add the reduced-motion override.</li>
        <li>Unsupported browsers degrade to instant navigation automatically.</li>
      </ul>

      <p><a routerLink="/ngmodules-migration">Next: NgModules &amp; Standalone Migration →</a></p>
    </article>
  `,
})
export class ViewTransitions {
  private readonly appRef = inject(ApplicationRef);
  // TypeScript's DOM lib types startViewTransition natively; older browsers
  // may still lack it at runtime, hence the typeof guard below.
  private readonly doc = document;

  protected readonly supported = typeof this.doc.startViewTransition === 'function';

  protected readonly cards = signal(
    [
      { id: 1, color: 'rgba(79,70,229,.25)' },
      { id: 2, color: 'rgba(16,185,129,.25)' },
      { id: 3, color: 'rgba(245,158,11,.25)' },
      { id: 4, color: 'rgba(239,68,68,.25)' },
      { id: 5, color: 'rgba(139,92,246,.25)' },
      { id: 6, color: 'rgba(14,165,233,.25)' },
    ],
  );
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

  protected sort() {
    this.withTransition(() =>
      this.cards.update((list) => [...list].sort((a, b) => a.id - b.id)),
    );
  }

  protected toggleGrow(id: number) {
    this.withTransition(() => this.grownId.update((g) => (g === id ? null : id)));
  }

  readonly primitiveSample = `const transition = document.startViewTransition(async () => {
  // ← old pixels are frozen on screen right now
  await updateTheDOM();          // mutate, swap routes, re-render …
  // ← when this promise resolves, the browser snapshots the NEW state
});

await transition.ready;      // pseudo-elements exist, animation about to start
await transition.finished;   // animation done, overlay removed`;

  readonly demoSample = `// template — a unique name per item is what enables the morph:
// <div [style.view-transition-name]="'vt-card-' + card.id" …>

private withTransition(change: () => void) {
  if (!document.startViewTransition) { change(); return; }  // graceful no-op
  document.startViewTransition(() => {
    change();              // signal update
    this.appRef.tick();    // flush rendering BEFORE the new snapshot
  });
}`;

  readonly enableSample = `// app.config.ts
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
  ],
};`;

  readonly pseudoTreeSample = `::view-transition                      ← full-viewport overlay
└─ ::view-transition-group(root)       ← one group per view-transition-name
   └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)   ← bitmap of the outgoing state
      └─ ::view-transition-new(root)   ← the incoming state`;

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

  readonly sharedSample = `/* list page */
.card-thumbnail { view-transition-name: hero-image; }

/* detail page */
.detail-hero    { view-transition-name: hero-image; }

/* keep the sticky nav from cross-fading with the page: pair it with itself */
.site-header    { view-transition-name: header; }`;

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

  readonly reducedMotionSample = `@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.01ms !important;
  }
}`;
}
