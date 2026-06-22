import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Simulates a "heavy" chunk — its JS is only fetched when the @defer block triggers. */
@Component({
  selector: 'app-heavy-widget',
  template: `
    <div style="padding:16px;border:1px dashed var(--violet);border-radius:8px;text-align:center">
      🎉 <strong>Heavy widget loaded!</strong><br />
      <span style="font-size:.85rem;color:var(--text-muted)">
        Its JavaScript chunk was downloaded lazily — only when you triggered the block.
      </span>
    </div>
  `,
})
export class HeavyWidget {}

@Component({
  selector: 'app-lesson-deferrable-views',
  imports: [RouterLink, HeavyWidget],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>Deferrable Views (&#64;defer)</h1>
      <p class="lead">
        <code>&#64;defer</code> lazily loads a block of template — and every component,
        directive and pipe it uses — splitting them into a separate JS chunk that is
        only fetched when a trigger fires. It is the most granular code-split Angular
        offers, written directly in the template with no dynamic imports.
        <strong>This app uses it</strong> to defer lesson card grids until they scroll
        into view.
      </p>

      <h2>The four companion blocks</h2>
      <div class="code"><pre>&#64;defer (on viewport) {
  &lt;app-heavy-widget /&gt;           &lt;!-- ← only this is lazy-loaded --&gt;
} &#64;placeholder {
  &lt;p&gt;Shown before loading starts&lt;/p&gt;   &lt;!-- stays in main bundle --&gt;
} &#64;loading (after 100ms; minimum 500ms) {
  &lt;p&gt;Fetching chunk…&lt;/p&gt;
} &#64;error {
  &lt;p&gt;Failed to load.&lt;/p&gt;
}</pre></div>
      <p>
        Only the <code>&#64;defer</code> block is split out; everything in
        <code>&#64;placeholder</code> / <code>&#64;loading</code> / <code>&#64;error</code>
        ships in the main bundle — keep those blocks small.
      </p>

      <h2>All triggers</h2>
      <table class="t">
        <thead><tr><th>Trigger</th><th>When it fires</th></tr></thead>
        <tbody>
          <tr><td><code>on idle</code> (default)</td><td>When the browser is idle (<code>requestIdleCallback</code>)</td></tr>
          <tr><td><code>on viewport</code></td><td>When the placeholder enters the viewport</td></tr>
          <tr><td><code>on interaction</code></td><td>On first click or keydown on the placeholder</td></tr>
          <tr><td><code>on hover</code></td><td>On first <code>mouseenter</code> / <code>focusin</code></td></tr>
          <tr><td><code>on timer(2s)</code></td><td>After the specified delay</td></tr>
          <tr><td><code>on immediate</code></td><td>As soon as the page renders (no delay)</td></tr>
          <tr><td><code>when expr()</code></td><td>When a signal/expression becomes truthy</td></tr>
        </tbody>
      </table>
      <p>
        Combine triggers: <code>on hover; on timer(5s)</code> loads whichever fires first.
        Reference another element: <code>on viewport(myRef)</code>.
        Prefetch early while still showing the placeholder: <code>prefetch on idle</code>.
      </p>

      <h2>Demo 1 — on interaction</h2>
      <div class="demo">
        <p class="demo__title">Live — click the placeholder to fetch the chunk</p>
        @defer (on interaction) {
          <app-heavy-widget />
        } @placeholder {
          <button>Click to load the heavy widget →</button>
        } @loading (minimum 400ms) {
          <p>⏳ Fetching widget chunk…</p>
        } @error {
          <p style="color:var(--accent)">⚠ Failed to load.</p>
        }
      </div>

      <h2>Demo 2 — on timer</h2>
      <div class="demo">
        <p class="demo__title">Live — loads automatically after 2 s</p>
        @defer (on timer(2s)) {
          <app-heavy-widget />
        } @placeholder {
          <p>⏳ Widget arrives in 2 s…</p>
        }
      </div>

      <h2>Demo 3 — on hover + prefetch on idle</h2>
      <div class="demo">
        <p class="demo__title">Live — hover to load; chunk is prefetched when browser is idle</p>
        @defer (on hover; prefetch on idle) {
          <app-heavy-widget />
        } @placeholder {
          <div style="padding:14px;border:1px dashed var(--border);border-radius:8px;text-align:center;cursor:default">
            Hover me — the chunk is already prefetched in the background
          </div>
        }
      </div>

      <h2>Demo 4 — when (signal-controlled)</h2>
      <div class="demo">
        <p class="demo__title">Live — load on demand via a signal</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="showWidget.set(true)" [disabled]="showWidget()">
            Set showWidget = true
          </button>
          <button class="ghost" (click)="showWidget.set(false)">Reset</button>
        </div>
        @defer (when showWidget()) {
          <app-heavy-widget />
        } @placeholder {
          <p style="color:var(--text-muted)">Waiting for <code>showWidget()</code> to be true…</p>
        }
      </div>

      <h2>How this app uses @defer</h2>
      <div class="code"><pre>@defer (on viewport; prefetch on idle) {
  &lt;div class="grid"&gt;
    &lt;!-- lesson cards for each level --&gt;
  &lt;/div&gt;
} @placeholder {
  &lt;div class="grid"&gt;
    &lt;!-- shimmer skeleton cards --&gt;
  &lt;/div&gt;
}</pre></div>
      <p>
        Each level section's card grid is deferred. The shimmer skeleton is the
        placeholder that the viewport observer watches — when it scrolls into view,
        Angular fetches and renders the real cards. <code>prefetch on idle</code> means
        the chunk is fetched opportunistically so the transition is nearly instant.
      </p>

      <h2>Incremental hydration (SSR)</h2>
      <p>
        With server-side rendering, <code>&#64;defer</code> pairs with incremental
        hydration: the server renders the full HTML, and the client hydrates each
        deferred block only when its trigger fires, not all at once:
      </p>
      <div class="code"><pre>&#64;defer (hydrate on viewport) &#123;
  &lt;app-expensive-chart /&gt;
&#125;
// Client JS for the chart downloads + hydrates only when scrolled into view</pre></div>

      <div class="tip">
        For the lazy split to happen, the component/pipe/directive must be used
        <strong>only</strong> inside <code>&#64;defer</code> blocks. If it's also used
        eagerly elsewhere in the same file, the bundler keeps it in the main chunk.
      </div>
      <div class="warn">
        <code>&#64;placeholder</code> content must be lightweight — it lives in the main
        bundle and renders immediately. Put skeleton UIs or simple spinners there, never
        the heavy content you're trying to defer.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;defer</code> code-splits a template block and all its dependencies automatically — no dynamic import needed.</li>
        <li>Triggers: idle, viewport, interaction, hover, timer, immediate, or a custom <code>when</code> expression.</li>
        <li><code>&#64;placeholder</code> → <code>&#64;loading</code> → content (or <code>&#64;error</code>) cover every state.</li>
        <li><code>prefetch on …</code> decouples <em>fetching</em> the chunk from <em>showing</em> it — makes loads feel instant.</li>
        <li>With SSR: <code>hydrate on viewport</code> defers client hydration until needed.</li>
      </ul>

      <p><a routerLink="/performance">Next: Performance Optimization →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    .t code { font-size: .82rem; }
  `],
})
export class DeferrableViews {
  protected readonly showWidget = signal(false);
}
