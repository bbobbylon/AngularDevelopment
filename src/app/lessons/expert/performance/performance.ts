import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

type Tab = 'load' | 'runtime' | 'webvitals' | 'images' | 'profiling';

@Component({
  selector: 'app-lesson-performance',
  imports: [RouterLink],
  styles: [`
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .tab-row button { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: .85rem; color: var(--text); }
    .tab-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .perf-table { width: 100%; border-collapse: collapse; font-size: .87rem; margin: 12px 0; }
    .perf-table th { background: var(--surface); padding: 8px 10px; text-align: left; border-bottom: 2px solid var(--border); }
    .perf-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .bad { color: #ef4444; }
    .good { color: #22c55e; }
    .vital-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin: 12px 0; }
    .vital-card { padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); }
    .vital-card h4 { margin: 0 0 4px; font-size: .9rem; }
    .vital-card .target { font-size: .8rem; font-weight: 600; color: #22c55e; }
    .vital-card p { margin: 4px 0 0; font-size: .8rem; color: var(--text-muted); }
    .perf-demo { font-family: monospace; font-size: .82rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>Performance Optimization</h1>
      <p class="lead">
        Performance has two axes: <strong>load time</strong> (how fast the first paint
        happens) and <strong>runtime</strong> (how fast the app responds to user
        interactions). Each needs a different toolkit. And the first rule is always:
        <em>measure, then optimize</em>.
      </p>

      <div class="tab-row">
        @for (t of tabs; track t.id) {
          <button [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'load') {
        <h2>Load time: ship less JavaScript</h2>
        <p>The #1 load-time win is reducing the initial bundle size — JavaScript is the most
        expensive resource on a page (parsed, compiled, executed).</p>

        <h3>Lazy loading routes</h3>
        <div class="code">
          <pre>// Every feature behind loadComponent/loadChildren is code-split automatically.
// These chunks download only when the user navigates to that route.
{{ '{' }}
  path: 'dashboard',
  loadComponent: () =&gt; import('./dashboard/dashboard').then(m =&gt; m.Dashboard),
{{ '}' }},
{{ '{' }}
  path: 'settings',
  loadChildren: () =&gt; import('./settings/settings.routes').then(m =&gt; m.SETTINGS_ROUTES),
{{ '}' }}</pre>
        </div>

        <h3>Preloading strategies</h3>
        <div class="code">
          <pre>// Option 1 — preload ALL lazy chunks after initial load (simple, works well for small apps):
provideRouter(routes, withPreloading(PreloadAllModules))

// Option 2 — preload selectively with data flag (better for large apps):
export class SelectivePreload implements PreloadingStrategy {{ '{' }}
  preload(route: Route, load: () =&gt; Observable&lt;any&gt;) {{ '{' }}
    return route.data?.['preload'] === true ? load() : EMPTY;
  {{ '}' }}
{{ '}' }}
// Then tag routes:
{{ '{' }} path: 'dashboard', data: {{ '{' }} preload: true {{ '}' }}, loadComponent: ... {{ '}' }}</pre>
        </div>

        <h3>&#64;defer — code-split within a route</h3>
        <div class="code">
          <pre>&#64;defer (on viewport) {{ '{' }}
  &lt;app-heavy-chart [data]="chartData()" /&gt;
{{ '}' }}
&#64;placeholder {{ '{' }}
  &lt;div class="chart-skeleton"&gt;&lt;/div&gt;
{{ '}' }}

// The HeavyChart component chunk is NOT in the initial bundle.
// It downloads only when the placeholder scrolls into the viewport.</pre>
        </div>

        <h3>Bundle budgets — fail the build before you ship too much</h3>
        <div class="code">
          <pre>// angular.json:
"budgets": [
  {{ '{' }} "type": "initial",            "maximumWarning": "500kB", "maximumError": "1MB"  {{ '}' }},
  {{ '{' }} "type": "anyComponentStyle",  "maximumError": "4kB"                             {{ '}' }},
  {{ '{' }} "type": "anyLazyModule",      "maximumWarning": "150kB", "maximumError": "500kB"{{ '}' }}
]

// Analyze bundle contents:
ng build --stats-json
// Then open the stats.json in https://webpack.github.io/analyse/
// or: npx source-map-explorer dist/app/browser/main*.js</pre>
        </div>

        <h2>Load-time checklist</h2>
        <table class="perf-table">
          <tr><th>Optimization</th><th>Impact</th></tr>
          <tr><td>Lazy-load every feature route</td><td class="good">High — splits largest chunks</td></tr>
          <tr><td>&#64;defer for below-the-fold widgets</td><td class="good">High — removes from critical path</td></tr>
          <tr><td>Preloading strategy after initial load</td><td class="good">Medium — improves navigation feel</td></tr>
          <tr><td>Bundle budgets in CI</td><td class="good">Medium — prevents accidental bloat</td></tr>
          <tr><td>SSR + hydration</td><td class="good">High — fast first paint, good SEO</td></tr>
          <tr><td>NgOptimizedImage + LCP image priority</td><td class="good">High — biggest LCP improvement</td></tr>
          <tr><td>Remove unused imports from app.config</td><td>Low-medium — every provider adds overhead</td></tr>
        </table>
      }

      @if (activeTab() === 'runtime') {
        <h2>Runtime: do less work per change</h2>
        <p>Runtime performance is about reducing how much Angular does on every user
        interaction — fewer components checked, fewer DOM mutations, fewer recalculations.</p>

        <h3>OnPush + Signals — the modern default</h3>
        <div class="code">
          <pre>&#64;Component({{ '{' }}
  changeDetection: ChangeDetectionStrategy.OnPush
{{ '}' }})
export class ProductCard {{ '{' }}
  // With signals, OnPush components update automatically when signals change.
  // Angular only checks this component when:
  //   1. An input reference changes
  //   2. An event fires inside it
  //   3. An async pipe emits
  //   4. A signal it reads changes  (new in Angular's signal integration)
  readonly price = input.required&lt;number&gt;();
  readonly discounted = computed(() =&gt; this.price() * 0.9);
{{ '}' }}</pre>
        </div>

        <h3>Track by stable id in &#64;for</h3>
        <div class="code">
          <pre>// ✅ Angular re-uses existing DOM nodes when items reorder:
&#64;for (item of items(); track item.id) {{ '{' }}
  &lt;app-product-row [item]="item" /&gt;
{{ '}' }}

// ❌ track $index when the list reorders — Angular destroys and recreates every row:
&#64;for (item of items(); track $index) {{ '{' }} ... {{ '}' }}</pre>
        </div>

        <h3>Memoize with computed() — never compute in templates</h3>
        <div class="code">
          <pre>// ❌ This runs on EVERY change-detection pass (can be 60x/sec):
&lt;p&gt;{{ '{{' }} items().filter(i =&gt; i.active).length {{ '}}' }}&lt;/p&gt;

// ✅ computed() re-evaluates only when items() changes:
readonly activeCount = computed(() =&gt; this.items().filter(i =&gt; i.active).length);
// template:
&lt;p&gt;{{ '{{' }} activeCount() {{ '}}' }}&lt;/p&gt;

// Same rule applies to pure pipes — they are memoized by Angular.
// But impure pipes run on every pass like a template function call.</pre>
        </div>

        <h3>Avoiding memory leaks</h3>
        <div class="code">
          <pre>// ❌ This subscription leaks if the component is destroyed:
ngOnInit() {{ '{' }}
  this.dataService.items$.subscribe(items =&gt; this.items.set(items));
{{ '}' }}

// ✅ Option 1 — takeUntilDestroyed (Angular 16+):
private destroyRef = inject(DestroyRef);
ngOnInit() {{ '{' }}
  this.dataService.items$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(items =&gt; this.items.set(items));
{{ '}' }}

// ✅ Option 2 — toSignal (auto-unsubscribes with the component):
readonly items = toSignal(this.dataService.items$, {{ '{' }} initialValue: [] {{ '}' }});

// ✅ Option 3 — async pipe in the template (auto-unsubscribes):</pre>
        </div>

        <h2>Runtime checklist</h2>
        <table class="perf-table">
          <tr><th>Optimization</th><th>Impact</th></tr>
          <tr><td>OnPush on every "leaf" component</td><td class="good">High</td></tr>
          <tr><td>Signals instead of Subjects for state</td><td class="good">High — automatic fine-grained updates</td></tr>
          <tr><td>track by stable id in &#64;for</td><td class="good">High for long lists</td></tr>
          <tr><td>computed() for derived values (no template functions)</td><td class="good">Medium-high</td></tr>
          <tr><td>Unsubscribe / takeUntilDestroyed</td><td class="good">Critical for memory</td></tr>
          <tr><td>Zoneless (provideZonelessChangeDetection)</td><td class="good">High for very active apps</td></tr>
          <tr><td>Virtual scrolling for long lists (CDK)</td><td class="good">Critical for lists 100+</td></tr>
        </table>
      }

      @if (activeTab() === 'webvitals') {
        <h2>Core Web Vitals</h2>
        <p>Google's Core Web Vitals are the metrics that directly affect SEO rankings and
        user experience scores. They measure real user experience, not lab benchmarks.</p>

        <div class="vital-grid">
          <div class="vital-card">
            <h4>LCP — Largest Contentful Paint</h4>
            <div class="target">Target: &lt; 2.5s</div>
            <p>Time until the largest visible element (hero image, heading) is rendered. The most important metric for perceived load speed.</p>
          </div>
          <div class="vital-card">
            <h4>INP — Interaction to Next Paint</h4>
            <div class="target">Target: &lt; 200ms</div>
            <p>How long from a user interaction until the next frame paints. Replaced FID in 2024. OnPush + signals + short event handlers are key.</p>
          </div>
          <div class="vital-card">
            <h4>CLS — Cumulative Layout Shift</h4>
            <div class="target">Target: &lt; 0.1</div>
            <p>Sum of all unexpected layout shifts during page load. Fix with explicit image dimensions, skeleton placeholders, and avoid DOM insertion above content.</p>
          </div>
          <div class="vital-card">
            <h4>TTFB — Time to First Byte</h4>
            <div class="target">Target: &lt; 800ms</div>
            <p>Server response time. SSR reduces TTFB by sending HTML from the server rather than waiting for the full Angular bootstrap.</p>
          </div>
        </div>

        <h2>Angular-specific fixes per vital</h2>
        <table class="perf-table">
          <tr><th>Vital</th><th>Angular fix</th></tr>
          <tr>
            <td><strong>LCP</strong></td>
            <td>
              Add <code>priority</code> to the LCP image with NgOptimizedImage (<code>[ngSrc] [priority]</code>),
              use SSR for above-the-fold content, avoid lazy-loading LCP components.
            </td>
          </tr>
          <tr>
            <td><strong>INP</strong></td>
            <td>
              OnPush + signals for fast CD, break long event handlers with
              <code>setTimeout</code> or <code>rxScheduler</code>, avoid synchronous
              DOM reads in event handlers, use <code>afterNextRender</code> for DOM work.
            </td>
          </tr>
          <tr>
            <td><strong>CLS</strong></td>
            <td>
              Set explicit <code>width</code>/<code>height</code> on images (NgOptimizedImage
              does this automatically), use <code>&#64;defer</code> placeholders with exact
              dimensions, avoid injecting ads/banners above existing content.
            </td>
          </tr>
        </table>
      }

      @if (activeTab() === 'images') {
        <h2>NgOptimizedImage — the correct way to handle images</h2>
        <p>
          Images are often the #1 LCP element. <code>NgOptimizedImage</code> (built into
          Angular, no install needed) adds lazy loading, responsive <code>srcset</code>,
          size hints, and LCP priority — all automatically.
        </p>
        <div class="code">
          <pre>import {{ '{' }} NgOptimizedImage {{ '}' }} from '&#64;angular/common';

&#64;Component({{ '{' }}
  imports: [NgOptimizedImage],
  template: '...'
{{ '}' }})

// In template — note ngSrc instead of src:
&lt;img ngSrc="/hero.webp" width="1200" height="600" priority /&gt;
//                                                ^^^^^^^^^
// priority=true adds fetchpriority="high" + preload link → critical LCP fix

// Below the fold (lazy by default):
&lt;img ngSrc="/product.jpg" width="400" height="400" /&gt;
// Angular adds loading="lazy" and generates srcset automatically

// With a CDK image loader (Cloudinary, Imgix, etc.):
// app.config.ts:
provideImgixLoader('https://mysite.imgix.net')
// Then in template — NgOptimizedImage calls imgix to resize:
&lt;img ngSrc="products/shirt.jpg" width="400" height="400" /&gt;</pre>
        </div>

        <h2>What NgOptimizedImage does for you</h2>
        <table class="perf-table">
          <tr><th>Feature</th><th>Manual img</th><th>NgOptimizedImage</th></tr>
          <tr><td>Lazy loading below fold</td><td class="bad">Must add loading="lazy"</td><td class="good">Automatic</td></tr>
          <tr><td>LCP priority preload</td><td class="bad">Must add fetchpriority + link rel</td><td class="good">Add [priority] attribute</td></tr>
          <tr><td>Responsive srcset</td><td class="bad">Must write manually</td><td class="good">Automatic with loaders</td></tr>
          <tr><td>Intrinsic size warning</td><td class="bad">Silent layout shift</td><td class="good">Build-time warning if width/height missing</td></tr>
          <tr><td>CLS prevention</td><td class="bad">Must add aspect-ratio CSS</td><td class="good">width/height attributes set it automatically</td></tr>
        </table>

        <div class="warn">
          <code>src</code> and <code>ngSrc</code> are mutually exclusive — using both on
          the same image is an error. Migrate by renaming all <code>src=</code> to
          <code>ngSrc=</code> and adding <code>width</code> + <code>height</code> attributes.
        </div>
      }

      @if (activeTab() === 'profiling') {
        <h2>Measuring — find the real bottleneck</h2>
        <p>
          Never optimize blindly. Use the Angular DevTools profiler and browser performance
          tools to find what's actually slow, then fix only that.
        </p>

        <h3>Angular DevTools Profiler</h3>
        <div class="code">
          <pre>// Install Angular DevTools browser extension (Chrome/Firefox).
// 1. Open DevTools → "Angular" tab → "Profiler"
// 2. Click "Record", interact with the slow part, click "Stop"
// 3. The flame chart shows:
//    - Every component that ran change detection
//    - How many milliseconds each CD pass took
//    - Which component triggered the cycle

// What to look for:
// - Components that run CD on every tick but rarely change → add OnPush
// - Components that take > 16ms → you're missing frames (jank)
// - Deep component trees re-checking the same data → signals or memoize</pre>
        </div>

        <h3>Bundle analysis workflow</h3>
        <div class="code">
          <pre>// Step 1 — build with stats
ng build --stats-json
// Creates dist/app/browser/stats.json

// Step 2 — visualize with source-map-explorer
npx source-map-explorer 'dist/app/browser/main.*.js'
// Shows which modules/packages occupy how many bytes

// Step 3 — common culprits:
// - moment.js: replace with date-fns (tree-shakeable) or Temporal
// - lodash: use lodash-es or native Array methods
// - A massive third-party library in the initial chunk: lazy-load it
// - Angular animations package if you're not using it: remove the import</pre>
        </div>

        <h3>Lighthouse / Web Vitals in Chrome DevTools</h3>
        <div class="code">
          <pre>// DevTools → Lighthouse tab:
// - Run "Performance" audit in incognito (no extensions)
// - Check "Opportunities" section — most impactful fixes first
// - LCP element is highlighted: add [priority] if it's an image

// DevTools → Performance tab:
// - Record while interacting
// - Long Tasks (red) block the main thread > 50ms each
// - Find the function causing them and defer/split it

// Real-world vitals via web-vitals library:
import {{ '{' }} onLCP, onINP, onCLS {{ '}' }} from 'web-vitals';
onLCP(console.log);   // run in app.config or main.ts</pre>
        </div>

        <h2>Common mistakes</h2>
        <table class="perf-table">
          <tr><th>Mistake</th><th>Fix</th></tr>
          <tr>
            <td class="bad">Function call in template: <code>{{ '{{' }} sort(items()) {{ '}}' }}</code></td>
            <td class="good">Move to <code>computed(() =&gt; sort(items()))</code></td>
          </tr>
          <tr>
            <td class="bad"><code>track $index</code> on a reorderable list</td>
            <td class="good"><code>track item.id</code> — stable identity</td>
          </tr>
          <tr>
            <td class="bad">Default change detection on every component</td>
            <td class="good">OnPush on components that only change via inputs/signals</td>
          </tr>
          <tr>
            <td class="bad">Unsubscribed observables</td>
            <td class="good"><code>takeUntilDestroyed</code> or <code>toSignal()</code></td>
          </tr>
          <tr>
            <td class="bad">Importing the whole library: <code>import _ from 'lodash'</code></td>
            <td class="good">Named ES imports: <code>import {{ '{' }} debounce {{ '}' }} from 'lodash-es'</code></td>
          </tr>
          <tr>
            <td class="bad">No <code>priority</code> on the LCP image</td>
            <td class="good">Add <code>[priority]</code> to the hero image with NgOptimizedImage</td>
          </tr>
        </table>
      }

      <h2>Key takeaways</h2>
      <ul>
        <li><strong>Load time:</strong> lazy routes, &#64;defer for below-fold, bundle budgets, SSR+hydration, NgOptimizedImage.</li>
        <li><strong>Runtime:</strong> OnPush, signals, track by stable id, computed() instead of template functions.</li>
        <li><strong>Web Vitals:</strong> LCP (image priority), INP (short event handlers), CLS (image dimensions).</li>
        <li><strong>Memory:</strong> always unsubscribe — use takeUntilDestroyed or toSignal.</li>
        <li><strong>Measure first:</strong> Angular DevTools profiler + Lighthouse before optimizing anything.</li>
      </ul>

      <p><a routerLink="/after-render">Next: afterRender &amp; afterNextRender →</a></p>
    </article>
  `,
})
export class Performance {
  protected readonly activeTab = signal<Tab>('load');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'load', label: 'Load Time' },
    { id: 'runtime', label: 'Runtime' },
    { id: 'webvitals', label: 'Web Vitals' },
    { id: 'images', label: 'NgOptimizedImage' },
    { id: 'profiling', label: 'Profiling' },
  ];
}
