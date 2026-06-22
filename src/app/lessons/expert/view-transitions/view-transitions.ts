import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-view-transitions',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Cross-Cutting</span>
      <h1>View Transitions</h1>
      <p class="lead">
        The browser's native View Transitions API animates between two DOM snapshots
        with a cross-fade (or any CSS animation you define). Angular's router integrates
        it via <code>withViewTransitions()</code> — one line of config, then pure CSS
        to customise. <strong>This very app uses it</strong> for every navigation.
      </p>

      <h2>Enable it</h2>
      <div class="code"><pre>// app.config.ts
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
  ],
};</pre></div>
      <p>
        That is the entire Angular-side setup. Every navigation now wraps in
        <code>document.startViewTransition()</code>: the browser freezes the old view,
        Angular swaps in the new component, then the browser animates between the two
        snapshots.
      </p>

      <h2>Customise the animation with CSS</h2>
      <p>
        The browser exposes two pseudo-elements — the outgoing and incoming snapshots —
        that you can target with regular <code>@keyframes</code>:
      </p>
      <div class="code"><pre>/* ── the animation used in this app ── */
&#64;keyframes vt-fade-in &#123;
  from &#123; opacity: 0; transform: translateY(6px); &#125;
  to   &#123; opacity: 1; transform: none; &#125;
&#125;
&#64;keyframes vt-fade-out &#123;
  from &#123; opacity: 1; transform: none; &#125;
  to   &#123; opacity: 0; transform: translateY(-4px); &#125;
&#125;

::view-transition-new(root) &#123;
  animation: vt-fade-in 0.22s ease both;
&#125;
::view-transition-old(root) &#123;
  animation: vt-fade-out 0.18s ease both;
&#125;</pre></div>

      <h2>Shared-element morph</h2>
      <p>
        Assign the <em>same</em> <code>view-transition-name</code> to a matching element
        in both the old and new view. The browser automatically morphs it across the
        navigation — the classic "thumbnail expands into hero image" effect.
      </p>
      <div class="code"><pre>/* list page */
.card-thumbnail { view-transition-name: hero-image; }

/* detail page */
.detail-hero    { view-transition-name: hero-image; }</pre></div>
      <div class="note">
        <code>view-transition-name</code> must be unique per element per page; duplicate
        names disable the transition for those elements. For dynamic lists, set the name
        from the item's ID: <code>[style.view-transition-name]="'item-' + item.id"</code>.
      </div>

      <h2>Hook in from TypeScript</h2>
      <div class="code"><pre>withViewTransitions({
  onViewTransitionCreated: ({ transition, from, to }) => {
    // Skip animation for anchor-only navigations (same page, different hash)
    if (from.url[0]?.path === to.url[0]?.path) {
      transition.skipTransition();
    }
  },
})</pre></div>

      <h2>Always respect reduced motion</h2>
      <div class="code"><pre>@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.01ms !important;
  }
}</pre></div>
      <div class="warn">
        Omitting the reduced-motion override means users with vestibular disorders or
        motion sensitivity experience forced animation on every page load. Always add it.
        Browsers that don't support the API navigate instantly as a no-op — no polyfill
        needed.
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

      <h2>Browser support</h2>
      <p>
        Chrome/Edge 111+, Safari 18+. Firefox ships it behind a flag (as of mid-2025).
        Angular degrades gracefully — unsupported browsers navigate without any animation,
        zero extra code path needed.
      </p>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>withViewTransitions()</code> is one line in <code>provideRouter()</code>.</li>
        <li>Customise old/new snapshots via <code>::view-transition-old(root)</code> / <code>::view-transition-new(root)</code>.</li>
        <li>Shared <code>view-transition-name</code> morphs a matching element between routes.</li>
        <li>Always add a <code>prefers-reduced-motion</code> override to cut the duration to near-zero.</li>
        <li>Degrades gracefully in unsupported browsers — no polyfill required.</li>
      </ul>

      <p><a routerLink="/ngmodules-migration">Next: NgModules &amp; Standalone Migration →</a></p>
    </article>
  `,
  styles: [`
    .demo a { color: var(--blue); }
  `],
})
export class ViewTransitions {
  protected readonly active = signal(false);
}
