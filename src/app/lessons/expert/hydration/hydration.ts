import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: hydration in depth — destructive vs hydrated bootstrap, how DOM
 * adoption works under the hood (ngh annotations), the strict rules it
 * imposes (matching DOM, valid HTML), the mismatch-error clinic (NG0500 &
 * friends), ngSkipHydration, event replay, and incremental hydration with
 * @defer (hydrate ...) triggers.
 *
 * Interactive: a bootstrap comparator (destructive vs hydrated, step by
 * step) and a mismatch clinic mapping each classic cause to its fix.
 */

type Boot = 'destructive' | 'hydrated';

const BOOT_STEPS: Record<Boot, { title: string; steps: { text: string; bad?: boolean }[] }> = {
  destructive: {
    title: 'Without hydration (destructive re-render)',
    steps: [
      { text: 'Server HTML arrives — the user sees real content' },
      { text: 'JS bundles download; Angular bootstraps' },
      { text: 'Angular THROWS AWAY the server-rendered DOM', bad: true },
      { text: 'Everything re-renders from scratch — visible flicker, layout shift (CLS)', bad: true },
      { text: 'Focus, selection and scroll state inside the content are lost', bad: true },
      { text: 'Media elements (video, iframes) reload', bad: true },
      { text: 'App interactive — after paying for a full second render' },
    ],
  },
  hydrated: {
    title: 'With provideClientHydration()',
    steps: [
      { text: 'Server HTML arrives — annotated with hydration metadata (ngh)' },
      { text: 'JS bundles download; Angular bootstraps' },
      { text: 'Angular WALKS the existing DOM, matching it to the component tree' },
      { text: 'Existing nodes are adopted — nothing is destroyed or re-created' },
      { text: 'Event listeners attach; internal state wires up' },
      { text: 'No flicker, no layout shift, media keeps playing' },
      { text: 'App interactive — the first render was the only render' },
    ],
  },
};

interface Mismatch {
  label: string;
  error: string;
  cause: string;
  fix: string;
}

const MISMATCHES: Mismatch[] = [
  {
    label: 'Direct DOM manipulation',
    error: 'NG0500: hydration node mismatch',
    cause:
      'Code (or a third-party script) added/moved DOM nodes outside Angular — innerHTML on an ElementRef, a jQuery plugin, a cookie banner injecting itself. The server HTML no longer matches what Angular expects to find.',
    fix: 'Move DOM work into afterNextRender (browser-only, post-hydration), render through templates instead, or put ngSkipHydration on the component hosting the widget.',
  },
  {
    label: 'Invalid HTML nesting',
    error: 'NG0500 — usually deep inside a table or list',
    cause:
      'The template contains HTML the browser "corrects" while parsing: <table> without <tbody> (browser inserts one), a <div> inside a <p> (browser closes the <p> early), nested <a> tags. The parsed DOM differs from the template structure, so node matching derails.',
    fix: 'Write valid HTML: add the tbody explicitly, never block elements inside <p>. Validate with the W3C checker if the error location looks baffling.',
  },
  {
    label: 'Different server vs client output',
    error: 'NG0500 / text-content mismatch',
    cause:
      'The template renders values that differ per run: Date.now(), Math.random(), locale-dependent formatting, or platform-branched markup (if (isBrowser) in the template path).',
    fix: 'Render deterministic values; compute volatile ones after hydration (afterNextRender + signal). Keep server and client rendering the same markup, always.',
  },
  {
    label: 'Whitespace / comment differences',
    error: 'silent corruption or NG0500',
    cause:
      'HTML minifiers, CDNs, or proxies that rewrite the server response (strip comments, collapse whitespace) destroy the hydration annotations and node positions Angular relies on.',
    fix: 'Serve the SSR output byte-for-byte: disable HTML minification/rewriting layers for document responses.',
  },
  {
    label: 'i18n blocks (older versions)',
    error: 'hydration skipped for the block',
    cause:
      'i18n-translated regions originally were not hydratable — Angular fell back to destroying and re-rendering them.',
    fix: 'Modern Angular supports it: enable withI18nSupport() in provideClientHydration.',
  },
];

@Component({
  selector: 'app-lesson-hydration',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

    .steps { list-style: none; margin: 0; padding: 0; counter-reset: step; }
    .steps li { counter-increment: step; display: flex; gap: 10px; align-items: baseline; padding: 6px 0; border-bottom: 1px dashed var(--border); font-size: .9rem; }
    .steps li:last-child { border-bottom: none; }
    .steps li::before { content: counter(step); flex: 0 0 22px; height: 22px; border-radius: 50%; background: var(--bg-elevated); border: 1px solid var(--border); font-size: .72rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
    .steps li.bad { color: #ef4444; }
    .steps li.bad::before { background: rgba(239,68,68,.12); border-color: #ef4444; color: #ef4444; }

    .err-pill { display: inline-block; font-family: monospace; font-weight: 700; font-size: .84rem; padding: 4px 12px; border-radius: 8px; background: rgba(239,68,68,.1); color: #ef4444; margin: 10px 0 6px; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>Hydration</h1>
      <p class="lead">
        Hydration is how the client-side app <em>adopts</em> the server-rendered HTML
        instead of throwing it away: Angular reuses the existing DOM nodes, attaches
        event listeners and wires up state. It's what makes SSR feel seamless — and it
        imposes strict rules that produce the infamous NG0500 when broken. This page
        covers the machinery, the rules, the error clinic, event replay, and
        incremental hydration.
      </p>

      <h2>Destructive bootstrap vs hydration</h2>
      <div class="demo">
        <p class="demo__title">Interactive — compare the two client bootstraps</p>
        <div class="chips">
          @for (b of boots; track b) {
            <button [class.on]="boot() === b" (click)="boot.set(b)">{{ bootSteps[b].title }}</button>
          }
        </div>
        <ul class="steps">
          @for (s of bootSteps[boot()].steps; track $index) {
            <li [class.bad]="s.bad">{{ s.text }}</li>
          }
        </ul>
      </div>
      <div class="code"><pre>{{ enableSample }}</pre></div>

      <h2>Under the hood: DOM adoption</h2>
      <p>
        During server rendering, Angular annotates the HTML with hydration metadata —
        <code>ngh</code> attributes and comment markers recording how many nodes each
        view claimed, where embedded views (loops, conditionals) begin and end, and
        which containers hold what. On the client, instead of calling its usual
        create-DOM instructions, the runtime <em>walks</em> the existing DOM using that
        map, claiming node after node for each component:
      </p>
      <div class="code"><pre>{{ annotatedSample }}</pre></div>
      <p>
        This is why the contract is strict: the walk succeeds only if the DOM the
        client finds is <em>exactly</em> the DOM the server produced, in structure and
        order. Anything that perturbs it — a browser "fixing" invalid HTML, a script
        injecting a node, a proxy stripping whitespace — derails the node matching, and
        Angular reports a mismatch.
      </p>

      <h2>The mismatch clinic — NG0500 and friends</h2>
      <div class="demo">
        <p class="demo__title">Interactive — pick a cause, get the diagnosis and the fix</p>
        <div class="chips">
          @for (m of mismatches; track m.label) {
            <button [class.on]="activeMismatch() === m" (click)="activeMismatch.set(m)">{{ m.label }}</button>
          }
        </div>
        @if (activeMismatch(); as m) {
          <span class="err-pill">{{ m.error }}</span>
          <p style="font-size:.9rem; margin: 6px 0"><strong>Cause:</strong> {{ m.cause }}</p>
          <p style="font-size:.9rem; margin: 6px 0"><strong>Fix:</strong> {{ m.fix }}</p>
        } @else {
          <p style="color:var(--text-muted); font-size:.88rem">Select a failure mode above — these five cover nearly every real-world hydration bug.</p>
        }
      </div>
      <div class="tip">
        Escape hatch for DOM you don't own: put <code>ngSkipHydration</code> on a
        component's host element and that subtree re-renders destructively instead of
        hydrating — the right call for a third-party widget that rewrites its own DOM.
        It's a per-subtree opt-out, not a fix; each skipped region gives back its
        hydration benefits.
      </div>

      <h2>Event replay — the dead-click gap</h2>
      <p>
        Between first paint (HTML visible) and hydration (listeners attached) there's a
        window where the page <em>looks</em> interactive but isn't. With
        <code>withEventReplay()</code>, a tiny inline script captures user events at the
        document root during that gap and replays them once hydration completes — the
        eager user's first click lands instead of vanishing:
      </p>
      <div class="code"><pre>{{ replaySample }}</pre></div>

      <h2>Incremental hydration — &#64;defer (hydrate …)</h2>
      <p>
        Full hydration still downloads and executes the JavaScript for the whole page
        eventually. Incremental hydration goes further: the server renders everything,
        but marked sections stay <em>dormant</em> — real visible DOM, zero attached
        JS — until their trigger fires. Unlike a plain <code>&#64;defer</code>, there is
        no placeholder swap: the content is already on screen.
      </p>
      <div class="code"><pre>{{ incrementalSample }}</pre></div>
      <table class="cmp">
        <tr><th>Trigger</th><th>Hydrates when…</th><th>Use for</th></tr>
        <tr><td><code>hydrate on idle</code></td><td>the browser goes idle</td><td>default "eventually" sections</td></tr>
        <tr><td><code>hydrate on viewport</code></td><td>scrolled into view</td><td>below-the-fold content (comments, footers)</td></tr>
        <tr><td><code>hydrate on interaction</code></td><td>the user clicks/focuses it</td><td>widgets that are static until touched</td></tr>
        <tr><td><code>hydrate on hover</code></td><td>pointer approaches</td><td>menus, cards with actions</td></tr>
        <tr><td><code>hydrate when expr</code></td><td>a boolean turns true</td><td>app-driven activation</td></tr>
        <tr><td><code>hydrate never</code></td><td>never — stays static HTML forever</td><td>purely presentational server output</td></tr>
      </table>
      <div class="note">
        Triggers compose with event replay: click a not-yet-hydrated
        <code>hydrate on interaction</code> section and that same click both starts
        hydration <em>and</em> replays into the freshly attached listener. Nested
        <code>&#64;defer (hydrate ...)</code> blocks hydrate top-down — a child cannot be
        live inside a dormant parent.
      </div>

      <h2>What hydration buys you (and what it doesn't)</h2>
      <ul>
        <li><strong>Buys:</strong> no flash of re-rendered content, no CLS spike at bootstrap,
          less client work (adopt beats rebuild), preserved media/iframe state, and — with
          incremental hydration — dramatically less JavaScript executed up front.</li>
        <li><strong>Doesn't buy:</strong> a faster FCP (that's SSR itself), and it does not
          relax the SSR-safety rules — the server and client must still render identical
          output (see the <a routerLink="/ssr">SSR lesson</a>).</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What exactly happens without <code>provideClientHydration()</code>?</summary>
        <div>The client app discards the server-rendered DOM and re-renders everything
        from scratch — a visible flicker, layout shift, lost focus/selection, reloaded
        media. SSR still helped FCP and SEO, but the bootstrap is destructive.</div>
      </details>
      <details class="qa">
        <summary>NG0500 appears only in production. Likeliest culprits?</summary>
        <div>Something between the server and the browser rewrites the HTML — a CDN/proxy
        minifying documents or stripping comments (killing the ngh annotations) — or a
        prod-only third-party script injecting DOM before hydration completes.</div>
      </details>
      <details class="qa">
        <summary>Why does a missing <code>&lt;tbody&gt;</code> break hydration?</summary>
        <div>The browser's parser inserts one automatically, so the client-side DOM has an
        extra element the server annotations don't account for — node matching derails.
        Hydration requires writing valid HTML the parser won't "correct".</div>
      </details>
      <details class="qa">
        <summary>How is <code>&#64;defer (hydrate on viewport)</code> different from plain <code>&#64;defer (on viewport)</code>?</summary>
        <div>Plain defer renders a placeholder and swaps in the content when triggered —
        the content isn't there yet. Incremental hydration ships the real server-rendered
        content immediately (visible, SEO-crawlable) and defers only the JavaScript that
        makes it interactive.</div>
      </details>
      <details class="qa">
        <summary>A cookie-consent script breaks hydration. Options?</summary>
        <div>Load it after hydration (afterNextRender), keep its DOM outside the app root,
        or wrap the affected region in a component marked <code>ngSkipHydration</code> so
        that subtree re-renders destructively while the rest of the page hydrates.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Hydration adopts server DOM instead of rebuilding — no flicker, no CLS, less work.</li>
        <li>It works by walking annotated HTML; the server and client DOM must match exactly.</li>
        <li>NG0500 causes: DOM manipulation, invalid HTML, non-deterministic output, HTML-rewriting proxies — <code>ngSkipHydration</code> is the per-subtree escape hatch.</li>
        <li><code>withEventReplay()</code> bridges the dead-click gap before listeners attach.</li>
        <li><code>&#64;defer (hydrate …)</code> = content now, JavaScript on demand — including <code>hydrate never</code> for static sections.</li>
      </ul>

      <p><a routerLink="/pwa-service-worker">Next: PWA &amp; Service Worker →</a></p>
    </article>
  `,
})
export class Hydration {
  readonly boots: Boot[] = ['destructive', 'hydrated'];
  readonly bootSteps = BOOT_STEPS;
  readonly boot = signal<Boot>('destructive');

  readonly mismatches = MISMATCHES;
  readonly activeMismatch = signal<Mismatch | null>(null);

  readonly enableSample = `import { provideClientHydration, withEventReplay, withIncrementalHydration }
  from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),           // capture & replay pre-hydration clicks
      withIncrementalHydration(),  // enable @defer (hydrate ...) triggers
    ),
  ],
};`;

  readonly annotatedSample = `<!-- simplified server output: metadata the client runtime navigates by -->
<app-root ngh="0">
  <header ngh="1">…</header>
  <!--ngh: container start (the @for block claimed 3 root nodes)-->
  <article>…</article>
  <article>…</article>
  <article>…</article>
  <!--ngh: container end-->
</app-root>
<script id="ng-state" type="application/json">
  { "__nghData__": [...], "transfer-cache": { ... } }
</script>`;

  readonly replaySample = `provideClientHydration(withEventReplay())

// timeline without replay:
//   HTML painted ──── user clicks "Add to cart" ──── hydration done
//                      └─ click hits a listener-less button: LOST
// with replay:
//   the click is recorded at the document root and re-dispatched
//   to the real listener the moment hydration attaches it`;

  readonly incrementalSample = `@defer (hydrate on viewport) {
  <app-comments />        <!-- server-rendered NOW, visible immediately;
                               its JS loads & attaches when scrolled into view -->
} @placeholder {
  <div>…</div>            <!-- used only by client-side navigations,
                               where there is no server HTML to adopt -->
}

@defer (hydrate never) {
  <app-static-footer />   <!-- stays inert server HTML forever: zero JS shipped -->
}`;
}
