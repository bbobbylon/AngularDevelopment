import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: deferrable views — template-level code splitting with @defer. Live
 * demos of the trigger kinds, the compiler mechanics that make the split
 * happen (and silently un-happen), companion-block lifecycles, SSR semantics
 * vs incremental hydration, testing with DeferBlockBehavior, and pitfalls.
 */

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
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    .t code { font-size: .82rem; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
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
      <div class="code"><pre>{{ blocksSample }}</pre></div>
      <table class="cmp">
        <tr><th>Block</th><th>Shown when</th><th>Bundled where</th></tr>
        <tr><td><code>&#64;placeholder</code></td><td>before loading starts (optionally <code>minimum</code> time)</td><td><strong>main bundle</strong></td></tr>
        <tr><td><code>&#64;loading</code></td><td>while the chunk downloads (<code>after</code> avoids flashing it for fast loads; <code>minimum</code> avoids a blink)</td><td><strong>main bundle</strong></td></tr>
        <tr><td>the <code>&#64;defer</code> content</td><td>chunk fetched + rendered</td><td><em>lazy chunk</em></td></tr>
        <tr><td><code>&#64;error</code></td><td>the dynamic import failed (offline, deploy pruned old hashes…)</td><td><strong>main bundle</strong></td></tr>
      </table>
      <p>
        Only the <code>&#64;defer</code> content is split out; the three companion
        blocks ship eagerly and render instantly — keep them light (skeletons,
        spinners), never the heavy thing you're deferring.
      </p>

      <h2>All triggers</h2>
      <table class="t">
        <thead><tr><th>Trigger</th><th>When it fires</th><th>Mechanism</th></tr></thead>
        <tbody>
          <tr><td><code>on idle</code> (default)</td><td>browser is idle</td><td><code>requestIdleCallback</code></td></tr>
          <tr><td><code>on viewport</code></td><td>placeholder enters the viewport</td><td>one shared <code>IntersectionObserver</code></td></tr>
          <tr><td><code>on interaction</code></td><td>first click / keydown on the placeholder</td><td>event listeners on the placeholder root</td></tr>
          <tr><td><code>on hover</code></td><td>first <code>mouseenter</code> / <code>focusin</code></td><td>same, hover events</td></tr>
          <tr><td><code>on timer(2s)</code></td><td>after the delay</td><td><code>setTimeout</code></td></tr>
          <tr><td><code>on immediate</code></td><td>as soon as rendering finishes</td><td>no waiting — but still async</td></tr>
          <tr><td><code>when expr()</code></td><td>expression becomes truthy — <strong>one-way</strong>, it never unloads</td><td>normal change detection</td></tr>
        </tbody>
      </table>
      <p>
        Combine triggers (OR semantics): <code>on hover; on timer(5s)</code> loads
        whichever fires first. Point a trigger at another element:
        <code>on viewport(heroRef)</code>. And <code>prefetch on idle</code> splits
        <em>fetching</em> from <em>showing</em> — the chunk downloads early while the
        placeholder stays up until the main trigger fires.
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

      <h2>Demo 4 — when (signal-controlled, and one-way!)</h2>
      <div class="demo">
        <p class="demo__title">Live — load on demand via a signal</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="showWidget.set(true)" [disabled]="showWidget()">
            Set showWidget = true
          </button>
          <button class="ghost" (click)="showWidget.set(false)">Set it back to false</button>
        </div>
        @defer (when showWidget()) {
          <app-heavy-widget />
        } @placeholder {
          <p style="color:var(--text-muted)">Waiting for <code>showWidget()</code> to be true…</p>
        }
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px">
          Now click "set it back to false": <strong>the widget stays.</strong>
          <code>&#64;defer (when …)</code> answers "when should this <em>load</em>",
          not "should this <em>show</em>" — loading is a one-way door. For show/hide
          semantics, nest an <code>&#64;if</code> <em>inside</em> the loaded block.
        </p>
      </div>

      <h2>Under the hood — what the compiler does</h2>
      <div class="code"><pre>{{ underHoodSample }}</pre></div>
      <ul>
        <li>
          <strong>The split is per-dependency, not per-block:</strong> the compiler
          collects the components/directives/pipes used inside <code>&#64;defer</code>
          and rewrites their imports as dynamic <code>import()</code> — the bundler
          does the rest.
        </li>
        <li>
          <strong>The silent un-split:</strong> if the same component is
          <em>also</em> used eagerly anywhere in the same template (or imported and
          referenced in the class), it must live in the main bundle — the
          <code>&#64;defer</code> still "works" (states, triggers) but saves zero bytes.
          This is the #1 way defer wins evaporate.
        </li>
        <li>
          <strong>Only standalone dependencies are deferrable</strong> — NgModule-declared
          ones can't be split this way.
        </li>
        <li>
          <strong>Triggers are cheap:</strong> all <code>on viewport</code> blocks share
          one <code>IntersectionObserver</code>; hover/interaction listeners attach to
          the placeholder's root node — which is why those triggers <em>require</em> a
          <code>&#64;placeholder</code> (with a single root element) or an explicit
          element reference.
        </li>
      </ul>

      <h2>&#64;defer vs the other lazy techniques</h2>
      <table class="cmp">
        <tr><th></th><th><code>&#64;defer</code></th><th>lazy route (<code>loadComponent</code>)</th><th><code>&#64;if</code></th></tr>
        <tr><td>Granularity</td><td>any template region</td><td>whole route/page</td><td>—</td></tr>
        <tr><td>Saves bundle bytes</td><td>yes (new chunk)</td><td>yes (new chunk)</td><td><strong>no</strong> — code ships regardless</td></tr>
        <tr><td>Can un-render</td><td>no (one-way)</td><td>on navigation</td><td>yes — that's its job</td></tr>
        <tr><td>Trigger vocabulary</td><td>viewport/hover/idle/timer/when…</td><td>navigation (+ preloading strategies)</td><td>any expression</td></tr>
        <tr><td>Best for</td><td>below-the-fold &amp; heavy widgets on a busy page</td><td>feature areas</td><td>pure visibility logic</td></tr>
      </table>

      <h2>How this app uses &#64;defer</h2>
      <div class="code"><pre>{{ appUsageSample }}</pre></div>
      <p>
        Each level section's card grid is deferred. The shimmer skeleton is the
        placeholder that the viewport observer watches — when it scrolls into view,
        Angular fetches and renders the real cards. <code>prefetch on idle</code> means
        the chunk is fetched opportunistically so the transition is nearly instant.
      </p>

      <h2>SSR: &#64;defer vs incremental hydration</h2>
      <div class="code"><pre>{{ hydrationSample }}</pre></div>
      <p>
        Two very different behaviors, easy to confuse in an exam:
        with plain triggers, the server renders the <strong>placeholder</strong> (the
        content wasn't loaded on the server either) and the real content appears only
        after the client trigger fires. With <code>hydrate</code> triggers, the server
        renders the <strong>full content</strong> — users and crawlers see it
        immediately — and only its JavaScript (hydration) is deferred. Choose
        <code>hydrate on viewport</code> for SEO-relevant below-the-fold content, plain
        <code>on viewport</code> for content that may never be needed at all.
      </p>

      <h2>Testing &#64;defer blocks</h2>
      <div class="code"><pre>{{ testingSample }}</pre></div>
      <p>
        Default test behavior plays the real states (placeholder → loading → complete),
        which makes assertions racy. <code>DeferBlockBehavior.Manual</code> lets a test
        drive each block deterministically through
        <code>DeferBlockState.Placeholder / Loading / Complete / Error</code>.
      </p>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>Layout shift:</strong> a 40px placeholder replaced by a 600px chart yanks the page (CLS). Size placeholders like the real content — skeletons, fixed-height shells.</li>
        <li><strong>Deferring above-the-fold content:</strong> LCP now waits for a second network round-trip. Defer what's below the fold or optional — not the hero.</li>
        <li><strong><code>on immediate</code>/<code>on idle</code> still flash:</strong> the chunk fetch is async, so there's always at least one placeholder frame. Use <code>&#64;loading (after 100ms)</code> so fast loads never blink a spinner.</li>
        <li><strong>Shared dependency kills the split</strong> — the eager usage elsewhere wins (see under the hood). Verify with a production build: does the chunk actually exist?</li>
        <li><strong><code>&#64;defer</code> inside <code>&#64;for</code>:</strong> legal, but N blocks = N triggers and N (cheap but real) registrations — for long lists prefer virtualization or one defer around the whole list.</li>
        <li><strong>viewport/hover/interaction without a placeholder</strong> is a compile error — the trigger needs a DOM node to observe. Give the placeholder a single root element.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>&#64;defer is in place but the bundle didn't shrink. Most likely cause?</summary>
        <div>The deferred component is also referenced eagerly — used elsewhere in the
        same template, or in another eagerly-loaded component. Any eager reference
        forces it into the main bundle; the defer block still functions but splits
        nothing. Check the build output for the expected lazy chunk.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>&#64;defer (on viewport)</code> demand a &#64;placeholder?</summary>
        <div>Before loading, the block renders nothing — there would be no DOM node
        for the IntersectionObserver to watch. The placeholder (single root element)
        is the observed target; alternatively pass an explicit reference:
        <code>on viewport(someRef)</code>.</div>
      </details>
      <details class="qa">
        <summary>User toggles the <code>when</code> condition true → false. What renders?</summary>
        <div>The loaded content, still. <code>when</code> controls <em>loading</em>,
        which happens once; it is not visibility. Wrap the content in
        <code>&#64;if</code> inside the block for show/hide after load (proven live in
        demo 4).</div>
      </details>
      <details class="qa">
        <summary>Difference between <code>prefetch on idle</code> and just <code>on idle</code>?</summary>
        <div><code>on idle</code> fetches <em>and renders</em> when idle.
        <code>prefetch on idle; on interaction</code> downloads the chunk during idle
        time but keeps showing the placeholder until the user interacts — instant
        render at interaction time, zero wasted rendering if they never do.</div>
      </details>
      <details class="qa">
        <summary>With SSR, what HTML does a plain <code>&#64;defer (on viewport)</code> emit vs <code>&#64;defer (hydrate on viewport)</code>?</summary>
        <div>Plain: the placeholder's HTML — content loads client-side after scroll.
        <code>hydrate</code>: the full content's HTML (great for SEO/LCP), with its JS
        chunk and hydration deferred until scrolled into view. Incremental hydration
        requires <code>withIncrementalHydration()</code> on
        <code>provideClientHydration</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;defer</code> code-splits a template block and all its dependencies automatically — no dynamic import needed, standalone deps only.</li>
        <li>Triggers: idle, viewport, interaction, hover, timer, immediate, or a custom <code>when</code> expression — combinable, OR semantics.</li>
        <li><code>&#64;placeholder</code> → <code>&#64;loading</code> → content (or <code>&#64;error</code>) cover every state; companions ship eagerly, so keep them light and same-sized (CLS).</li>
        <li><code>prefetch on …</code> decouples fetching from showing; <code>when</code> is a one-way load door, not visibility.</li>
        <li>An eager reference anywhere un-splits the chunk silently — verify in the build output; with SSR, know plain vs <code>hydrate</code> trigger semantics.</li>
      </ul>

      <p><a routerLink="/performance">Next: Performance Optimization →</a></p>
    </article>
  `,
})
export class DeferrableViews {
  protected readonly showWidget = signal(false);

  readonly blocksSample = `@defer (on viewport) {
  <app-heavy-widget />           <!-- ← only this is lazy-loaded -->
} @placeholder (minimum 500ms) {
  <p>Shown before loading starts</p>    <!-- stays in main bundle -->
} @loading (after 100ms; minimum 500ms) {
  <p>Fetching chunk…</p>
} @error {
  <p>Failed to load.</p>
}`;

  readonly underHoodSample = `// what you write:
@defer (on viewport) { <app-chart /> }

// what the compiler emits (conceptually):
ɵɵdefer(/* … */, () => [
  import('./chart.component').then(m => m.Chart),   // ← real dynamic import
]);
// the bundler sees import() → emits chart-XXXX.js as its own chunk
//
// BUT: one eager <app-chart /> anywhere in the same template, and the
// compiler must import it statically — the chunk quietly disappears.`;

  readonly appUsageSample = `@defer (on viewport; prefetch on idle) {
  <div class="grid">
    <!-- lesson cards for each level -->
  </div>
} @placeholder {
  <div class="grid">
    <!-- shimmer skeleton cards (same size → no layout shift) -->
  </div>
}`;

  readonly hydrationSample = `<!-- plain trigger + SSR: server renders the PLACEHOLDER -->
@defer (on viewport) { <app-reviews /> } @placeholder { <div class="skeleton"></div> }

<!-- hydrate trigger + SSR: server renders the CONTENT, JS arrives lazily -->
@defer (hydrate on viewport) { <app-reviews /> }
@defer (hydrate never)       { <app-static-footer /> }   <!-- never ships JS -->

// app.config.server / client:
provideClientHydration(withIncrementalHydration())`;

  readonly testingSample = `TestBed.configureTestingModule({
  deferBlockBehavior: DeferBlockBehavior.Manual,   // don't auto-play states
});
const fixture = TestBed.createComponent(Dashboard);

const [block] = await fixture.getDeferBlocks();
await block.render(DeferBlockState.Loading);      // assert the spinner
await block.render(DeferBlockState.Complete);     // assert the real content
await block.render(DeferBlockState.Error);        // assert the fallback`;
}
