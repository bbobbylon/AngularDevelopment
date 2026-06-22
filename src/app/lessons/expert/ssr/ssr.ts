import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ssr',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>Server-Side Rendering (SSR)</h1>
      <p class="lead">
        With SSR, Angular renders your components to HTML on the server for the first
        request. The browser receives a fully-formed page — fast first paint and
        crawlable content — then the same app boots and takes over on the client.
      </p>

      <h2>Adding SSR</h2>
      <div class="code">
        <pre>ng add &#64;angular/ssr        // scaffolds server.ts, the server build &amp; entry

// app.config.server.ts
import {{ '{' }} provideServerRendering {{ '}' }} from '&#64;angular/ssr';
export const config = {{ '{' }} providers: [provideServerRendering()] {{ '}' }};</pre>
      </div>
      <p>
        <code>ng build</code> then produces a <strong>browser</strong> bundle and a
        <strong>server</strong> bundle; <code>ng serve</code> renders on the server in
        development too.
      </p>

      <h2>Why it matters</h2>
      <ul>
        <li><strong>SEO</strong> — crawlers see real content, not an empty <code>&lt;app-root&gt;</code>.</li>
        <li><strong>Perceived speed</strong> — meaningful paint before JS executes (better FCP/LCP).</li>
        <li><strong>Social previews</strong> — Open Graph/meta tags are present in the initial HTML.</li>
        <li><strong>Low-power devices</strong> — less work to first content.</li>
      </ul>

      <h2>Writing SSR-safe code</h2>
      <div class="code">
        <pre>// ❌ window/document/localStorage don't exist on the server
// ✅ guard platform-specific code:
private platformId = inject(PLATFORM_ID);
if (isPlatformBrowser(this.platformId)) {{ '{' }} /* use window */ {{ '}' }}

// ✅ or run DOM work in a browser-only hook:
afterNextRender(() =&gt; document.title = 'Ready');</pre>
      </div>

      <div class="warn">
        The number-one SSR bug is touching browser globals during construction/render.
        Keep DOM access inside <a routerLink="/after-render"><code>afterNextRender</code></a>
        or <code>isPlatformBrowser</code> guards. Static rendering at build time
        (SSG/prerender) is available too via the prerender builder.
      </div>
      <div class="note">
        Avoid the "double fetch": data loaded on the server should transfer to the client
        so it isn't requested again during hydration. <code>HttpClient</code> has a
        built-in transfer cache (configure via
        <code>withHttpTransferCacheOptions(...)</code>), or use <code>TransferState</code>
        directly. Render modes can be mixed per route — server (SSR), prerender (SSG), or
        client-only — to match each page's needs.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>SSR renders HTML on the server for fast first paint and SEO.</li>
        <li><code>ng add &#64;angular/ssr</code> wires up the server build and entry point.</li>
        <li>The build emits separate browser and server bundles.</li>
        <li>Guard browser-only APIs with <code>isPlatformBrowser</code> / <code>afterNextRender</code>.</li>
      </ul>

      <p><a routerLink="/hydration">Next: Hydration →</a></p>
    </article>
  `,
})
export class Ssr {}
