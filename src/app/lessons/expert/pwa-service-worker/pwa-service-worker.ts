import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-pwa-service-worker',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>PWA &amp; Service Worker</h1>
      <p class="lead">
        A Progressive Web App can be installed, works offline, and loads instantly on
        repeat visits. Angular ships an opinionated service worker
        (<code>&#64;angular/service-worker</code>) that caches your app shell and assets
        with zero hand-written worker code.
      </p>

      <h2>Adding it</h2>
      <div class="code">
        <pre>ng add &#64;angular/pwa     // adds the worker, a manifest &amp; icons

// app.config.ts
import {{ '{' }} provideServiceWorker {{ '}' }} from '&#64;angular/service-worker';

provideServiceWorker('ngsw-worker.js', {{ '{' }}
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000',
{{ '}' }})</pre>
      </div>

      <h2>ngsw-config.json — caching strategies</h2>
      <div class="code">
        <pre>"assetGroups": [
  {{ '{' }} "name": "app", "installMode": "prefetch",
    "resources": {{ '{' }} "files": ["/index.html", "/*.css", "/*.js"] {{ '}' }} {{ '}' }}
],
"dataGroups": [
  {{ '{' }} "name": "api", "urls": ["/api/**"],
    "cacheConfig": {{ '{' }} "strategy": "freshness", "maxAge": "1h", "timeout": "3s" {{ '}' }} {{ '}' }}
]</pre>
      </div>
      <ul>
        <li><strong>prefetch</strong> — cache eagerly at install (app shell).</li>
        <li><strong>freshness</strong> — network-first, fall back to cache (live data).</li>
        <li><strong>performance</strong> — cache-first, fastest (rarely-changing data).</li>
      </ul>

      <h2>Updates</h2>
      <div class="code">
        <pre>private updates = inject(SwUpdate);
this.updates.versionUpdates.subscribe((e) =&gt; {{ '{' }}
  if (e.type === 'VERSION_READY') promptUserToReload();
{{ '}' }});</pre>
      </div>

      <div class="warn">
        The Angular service worker only activates in a <strong>production build</strong>
        served over HTTPS (or localhost) — it is disabled in <code>ng serve</code>.
        Test with <code>ng build</code> + a static server.
      </div>
      <div class="note">
        Updates are <strong>atomic</strong>: the SW keeps serving the current version
        until a new one is fully downloaded, then activates on the next load (or when you
        prompt via <code>SwUpdate</code>) — users never see a half-updated app. The web
        app manifest (<code>name</code>, <code>icons</code>, <code>theme_color</code>,
        <code>display: 'standalone'</code>) is what makes it installable to the home
        screen.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>ng add &#64;angular/pwa</code> scaffolds the worker, manifest and icons.</li>
        <li><code>ngsw-config.json</code> declares cache groups and strategies — no worker code.</li>
        <li>Strategies: prefetch shell, freshness for live data, performance for static data.</li>
        <li><code>SwUpdate</code> notifies you when a new version is ready to activate.</li>
      </ul>

      <p><a routerLink="/state-management">Next: State Management →</a></p>
    </article>
  `,
})
export class PwaServiceWorker {}
