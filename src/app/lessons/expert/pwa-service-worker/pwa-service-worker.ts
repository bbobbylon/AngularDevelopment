import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Angular's service worker and PWAs in depth — what ng add scaffolds,
 * how the generated ngsw engine actually versions and serves your app,
 * assetGroups vs dataGroups with a strategy decision lab, a live SwUpdate
 * lifecycle simulator (deploy → detect → ready → activate), SwPush, and the
 * debugging/gotcha list (ngsw/state, ngsw-bypass, the safety worker).
 */

interface Resource {
  label: string;
  group: 'assetGroup' | 'dataGroup';
  strategy: string;
  why: string;
  snippet: string;
}

const RESOURCES: Resource[] = [
  {
    label: 'App shell (JS/CSS/index.html)',
    group: 'assetGroup',
    strategy: 'installMode: prefetch',
    why: 'The shell IS the app — cache every file eagerly at install so the next visit (or offline visit) boots instantly. Files are content-hashed, so updates are exact.',
    snippet: `"assetGroups": [{
  "name": "app",
  "installMode": "prefetch",
  "resources": { "files": ["/index.html", "/*.css", "/*.js"] }
}]`,
  },
  {
    label: 'Fonts & hero images',
    group: 'assetGroup',
    strategy: 'installMode: lazy, updateMode: prefetch',
    why: 'Big and not needed on first paint everywhere — cache each one the first time it is requested (lazy), but refresh already-cached ones eagerly when a new version ships.',
    snippet: `"assetGroups": [{
  "name": "media",
  "installMode": "lazy",
  "updateMode": "prefetch",
  "resources": { "files": ["/assets/**/*.(png|webp|woff2)"] }
}]`,
  },
  {
    label: 'Live API data (prices, feed)',
    group: 'dataGroup',
    strategy: 'strategy: freshness',
    why: 'Network-first: always try the real API (with a timeout), fall back to cache only when offline or too slow. Stale prices are worse than a spinner.',
    snippet: `"dataGroups": [{
  "name": "api-live",
  "urls": ["/api/prices/**"],
  "cacheConfig": {
    "strategy": "freshness",
    "timeout": "3s",
    "maxAge": "1h", "maxSize": 100
  }
}]`,
  },
  {
    label: 'Rarely-changing lookups (countries, config)',
    group: 'dataGroup',
    strategy: 'strategy: performance',
    why: 'Cache-first: serve instantly from cache until maxAge expires, then refetch. The user never waits for data that changes twice a year.',
    snippet: `"dataGroups": [{
  "name": "api-static",
  "urls": ["/api/lookups/**"],
  "cacheConfig": {
    "strategy": "performance",
    "maxAge": "7d", "maxSize": 50
  }
}]`,
  },
];

/** One step in the simulated update lifecycle. */
interface SimState {
  id: 'v1' | 'deployed' | 'detected' | 'ready' | 'activated';
  log: string[];
}

@Component({
  selector: 'app-lesson-pwa-service-worker',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

    .strat-pill { display: inline-block; font-family: monospace; font-weight: 700; font-size: .84rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.12); color: var(--accent); margin: 8px 0 6px; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .sim { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
    .sim .stage { font-size: .78rem; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-muted); }
    .sim .stage.hit { background: var(--accent); border-color: var(--accent); color: #fff; }
    .sim-log { background: var(--code-bg); color: var(--code-fg); border-radius: 10px; padding: 12px 16px; font-family: monospace; font-size: .8rem; min-height: 130px; }
    .sim-log p { margin: 3px 0; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>PWA &amp; Service Worker</h1>
      <p class="lead">
        A Progressive Web App installs to the home screen, works offline, and loads
        instantly on repeat visits. Angular ships a <em>generated, declarative</em>
        service worker — you write JSON config, not worker code — with atomic versioned
        updates and a small runtime API (<code>SwUpdate</code>/<code>SwPush</code>).
        This page covers the engine, the caching strategies, the update lifecycle, and
        the production gotchas.
      </p>

      <h2>What makes a PWA — and what ng add scaffolds</h2>
      <ul>
        <li><strong>HTTPS</strong> — service workers refuse to register on insecure origins (localhost excepted).</li>
        <li><strong>A web app manifest</strong> — <code>manifest.webmanifest</code>: name, icons, <code>theme_color</code>, <code>display: "standalone"</code>. This is what makes the browser offer "install".</li>
        <li><strong>A service worker</strong> — the offline/caching engine.</li>
      </ul>
      <div class="code"><pre>{{ setupSample }}</pre></div>
      <div class="warn">
        The worker is <strong>disabled in ng serve</strong> and only activates in a
        production build served over HTTPS/localhost. Test with
        <code>ng build</code> + any static server. Caching bugs that "survive" your
        fixes are usually a stale worker — unregister it in DevTools → Application →
        Service Workers, or bump the version.
      </div>

      <h2>How the engine works (this is the exam-worthy part)</h2>
      <p>
        <code>ng build</code> generates <code>ngsw.json</code> — a manifest listing every
        cacheable file <em>with its content hash</em>. The generic
        <code>ngsw-worker.js</code> engine reads it and treats each manifest as an
        immutable <strong>app version</strong>:
      </p>
      <ul>
        <li><strong>Atomic updates</strong> — the worker serves the current version in full
          while downloading the next one in the background. Users never get v1's HTML
          with v2's JS (the classic broken-deploy bug ngsw exists to solve).</li>
        <li><strong>Hash-verified</strong> — if a cached file's hash doesn't match the
          manifest (a CDN served a stale file), the worker treats the version as broken
          and falls back to the network.</li>
        <li><strong>One tab, one version</strong> — a running tab keeps its version until
          reload; the new version activates on the next load or when you call
          <code>activateUpdate()</code>.</li>
      </ul>

      <h2>Caching strategy decision lab</h2>
      <div class="demo">
        <p class="demo__title">Interactive — pick a resource type, get the config + reasoning</p>
        <div class="chips">
          @for (r of resources; track r.label) {
            <button [class.on]="activeResource() === r" (click)="activeResource.set(r)">{{ r.label }}</button>
          }
        </div>
        @if (activeResource(); as r) {
          <span class="strat-pill">{{ r.group }} · {{ r.strategy }}</span>
          <p style="font-size:.9rem; margin: 6px 0 10px">{{ r.why }}</p>
          <div class="code" style="font-size:.82rem"><pre>{{ r.snippet }}</pre></div>
        } @else {
          <p style="color:var(--text-muted);font-size:.88rem">The core distinction: <strong>assetGroups</strong> = versioned files that ship with the app; <strong>dataGroups</strong> = runtime API responses with independent lifetimes.</p>
        }
      </div>
      <table class="cmp">
        <tr><th></th><th>assetGroups</th><th>dataGroups</th></tr>
        <tr><td>For</td><td>files of the app itself (JS, CSS, images, fonts)</td><td>API responses at runtime</td></tr>
        <tr><td>Updated</td><td>with each app version (hash-tracked)</td><td>by its own <code>maxAge</code>/policy, independent of versions</td></tr>
        <tr><td>Knobs</td><td><code>installMode</code>/<code>updateMode</code>: prefetch | lazy</td><td><code>strategy</code>: freshness (network-first) | performance (cache-first), plus <code>timeout</code>, <code>maxAge</code>, <code>maxSize</code></td></tr>
      </table>

      <h2>The update lifecycle, simulated</h2>
      <div class="demo">
        <p class="demo__title">Interactive — walk a deploy through SwUpdate</p>
        <div class="sim">
          @for (s of stages; track s.id) {
            <span class="stage" [class.hit]="reached(s.id)">{{ s.label }}</span>
          }
        </div>
        <div class="row" style="margin-bottom:10px">
          <button (click)="advance()" [disabled]="state().id === 'activated'">{{ nextAction() }}</button>
          <button class="ghost" (click)="resetSim()">Reset</button>
        </div>
        <div class="sim-log">
          @for (line of state().log; track $index) {
            <p>{{ line }}</p>
          }
        </div>
      </div>
      <div class="code"><pre>{{ updateSample }}</pre></div>
      <div class="note">
        <code>versionUpdates</code> emits <code>VERSION_DETECTED</code> (download
        starting), <code>VERSION_READY</code> (installed — safe to prompt),
        <code>VERSION_INSTALLATION_FAILED</code>, and
        <code>NO_NEW_VERSION_DETECTED</code>. The worker checks for updates on
        registration and navigation — for long-lived tabs (dashboards people keep open
        for days) poll with <code>checkForUpdate()</code> on an interval. Handle
        <code>unrecoverable</code> too: it fires when the cached version is broken and
        the only fix is a reload.
      </div>

      <h2>Push notifications — SwPush in one glance</h2>
      <div class="code"><pre>{{ pushSample }}</pre></div>
      <p>
        <code>requestSubscription</code> needs your VAPID public key and user permission;
        the resulting subscription goes to your backend, which sends pushes through the
        browser's push service. Messages arrive on <code>swPush.messages</code>; clicks on
        <code>notificationClicks</code>. The heavy lifting is the backend integration —
        treat it as a real feature, not a checkbox.
      </p>

      <h2>Production gotchas &amp; debugging</h2>
      <ul>
        <li><strong>ngsw/state</strong> — visit <code>/ngsw/state</code> in the app: the worker
          reports its current versions, clients, and update status. First stop for "why is it
          serving old code".</li>
        <li><strong>ngsw-bypass</strong> — add the <code>ngsw-bypass</code> header (or query
          param) to any request and the worker steps aside — essential when debugging API
          calls you suspect are cached.</li>
        <li><strong>The safety worker</strong> — shipping a broken worker can pin users to a
          bad version. Angular provides <code>safety-worker.js</code>: deploy it at the same
          URL to unregister the worker and clear its caches for everyone.</li>
        <li><strong>Never cache what you can't hash</strong> — external CDN scripts in
          assetGroups (via <code>urls</code>) are cached but not hash-verified; prefer
          bundling or dataGroups with a short maxAge.</li>
        <li><strong>index.html must not be aggressively CDN-cached</strong> — the worker
          bootstraps from it; an edge cache serving week-old HTML defeats the whole
          update mechanism.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>freshness vs performance — which for a stock ticker, which for a country list?</summary>
        <div>Ticker: <strong>freshness</strong> (network-first with timeout — stale prices are
        harmful). Country list: <strong>performance</strong> (cache-first — instant, and staleness
        for 7 days is irrelevant).</div>
      </details>
      <details class="qa">
        <summary>Why don't users see a half-updated app during deploys?</summary>
        <div>Updates are atomic: the worker serves the complete current version while the new
        manifest's files download; only when every hash-verified file is cached does the new
        version become activatable — on next load or explicit <code>activateUpdate()</code>.</div>
      </details>
      <details class="qa">
        <summary>A user reports week-old code. Diagnosis path?</summary>
        <div>Check <code>/ngsw/state</code> for the served version; verify index.html isn't
        edge-cached with a long TTL; confirm the tab isn't simply long-lived without a
        <code>checkForUpdate()</code> poll; worst case, the deployed worker is broken —
        ship the safety worker to unregister it.</div>
      </details>
      <details class="qa">
        <summary>Why is the service worker off during <code>ng serve</code>?</summary>
        <div>Dev rebuilds constantly change file hashes — the worker would thrash caching
        stale bundles and mask live-reload. It's enabled only for production builds
        (<code>enabled: !isDevMode()</code>), served over HTTPS or localhost.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>PWA = HTTPS + manifest + service worker; <code>ng add &#64;angular/pwa</code> scaffolds all three.</li>
        <li>The generated engine versions the app via hashed manifests — updates are atomic and verified.</li>
        <li>assetGroups cache the app (prefetch/lazy); dataGroups cache APIs (freshness/performance + maxAge/timeout).</li>
        <li>Drive updates with <code>SwUpdate.versionUpdates</code> (<code>VERSION_READY</code> → prompt → <code>activateUpdate()</code> → reload); poll long-lived tabs.</li>
        <li>Debug with <code>/ngsw/state</code> and <code>ngsw-bypass</code>; keep <code>safety-worker.js</code> in your back pocket.</li>
      </ul>

      <p><a routerLink="/state-management">Next: State Management →</a></p>
    </article>
  `,
})
export class PwaServiceWorker {
  readonly resources = RESOURCES;
  readonly activeResource = signal<Resource | null>(null);

  // --- update lifecycle simulator ---
  readonly stages = [
    { id: 'v1' as const, label: 'running v1' },
    { id: 'deployed' as const, label: 'v2 deployed' },
    { id: 'detected' as const, label: 'VERSION_DETECTED' },
    { id: 'ready' as const, label: 'VERSION_READY' },
    { id: 'activated' as const, label: 'activated + reloaded' },
  ];
  private readonly order = this.stages.map((s) => s.id);

  readonly state = signal<SimState>({
    id: 'v1',
    log: ['[app] running version v1 — service worker serving from cache'],
  });

  readonly nextAction = computed(() => {
    switch (this.state().id) {
      case 'v1': return 'Deploy v2 to the server';
      case 'deployed': return 'Worker checks for update (navigation / poll)';
      case 'detected': return 'Finish downloading v2 in the background';
      case 'ready': return 'User accepts → activateUpdate() + reload';
      default: return 'Done';
    }
  });

  reached(id: SimState['id']): boolean {
    return this.order.indexOf(id) <= this.order.indexOf(this.state().id);
  }

  advance() {
    const s = this.state();
    switch (s.id) {
      case 'v1':
        this.state.set({ id: 'deployed', log: [...s.log,
          '[server] v2 deployed — new ngsw.json manifest with fresh hashes',
          '[app] tab unaffected: still serving v1 atomically'] });
        break;
      case 'deployed':
        this.state.set({ id: 'detected', log: [...s.log,
          '[sw] update check → manifest hash differs',
          '[SwUpdate] versionUpdates emits: VERSION_DETECTED',
          '[sw] downloading v2 files in the background…'] });
        break;
      case 'detected':
        this.state.set({ id: 'ready', log: [...s.log,
          '[sw] all v2 files cached & hash-verified',
          '[SwUpdate] versionUpdates emits: VERSION_READY',
          '[app] good moment to prompt: "A new version is available — reload?"'] });
        break;
      case 'ready':
        this.state.set({ id: 'activated', log: [...s.log,
          '[app] swUpdate.activateUpdate() → worker switches to v2',
          '[app] document.location.reload()',
          '[app] running version v2 — v1 caches cleaned up'] });
        break;
    }
  }

  resetSim() {
    this.state.set({ id: 'v1', log: ['[app] running version v1 — service worker serving from cache'] });
  }

  // --- code samples ---
  readonly setupSample = `ng add @angular/pwa     # manifest + icons + ngsw-config.json + provider

// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';

provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  // don't compete with app startup for bandwidth — register when
  // the app stabilizes (or after 30s, whichever comes first):
  registrationStrategy: 'registerWhenStable:30000',
})`;

  readonly updateSample = `export class UpdateService {
  private updates = inject(SwUpdate);

  constructor() {
    // 1. react to the lifecycle
    this.updates.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUser());

    // 2. long-lived tabs: poll (worker only auto-checks on navigation)
    setInterval(() => this.updates.checkForUpdate(), 6 * 60 * 60 * 1000);

    // 3. broken cache → only way out is a reload
    this.updates.unrecoverable.subscribe(() => document.location.reload());
  }

  async promptUser() {
    if (confirm('A new version is available. Reload?')) {
      await this.updates.activateUpdate();
      document.location.reload();
    }
  }
}`;

  readonly pushSample = `private swPush = inject(SwPush);

async subscribe() {
  const sub = await this.swPush.requestSubscription({
    serverPublicKey: VAPID_PUBLIC_KEY,
  });
  await firstValueFrom(this.http.post('/api/push/subscribe', sub));
}

// receive while the app is open; clicks route the user somewhere useful
this.swPush.messages.subscribe(msg => this.toast.show(msg));
this.swPush.notificationClicks.subscribe(({ notification }) =>
  this.router.navigateByUrl(notification.data.url));`;
}
