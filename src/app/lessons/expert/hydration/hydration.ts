import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-hydration',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Rendering &amp; Delivery</span>
      <h1>Hydration</h1>
      <p class="lead">
        Hydration is how the client-side app "adopts" the server-rendered HTML instead
        of throwing it away and re-rendering. Angular reuses the existing DOM nodes,
        attaches event listeners and wires up state — eliminating the flicker that
        destructive bootstrapping used to cause.
      </p>

      <h2>Enabling it</h2>
      <div class="code">
        <pre>import {{ '{' }} provideClientHydration, withEventReplay {{ '}' }} from '&#64;angular/platform-browser';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [provideClientHydration(withEventReplay())],
{{ '}' }};</pre>
      </div>
      <p>Without hydration, Angular would discard the server DOM and re-render from scratch (a visible flash).</p>

      <h2>Event replay</h2>
      <p>
        <code>withEventReplay()</code> records clicks/inputs that happen <em>before</em>
        the app finishes hydrating and replays them afterwards — so an eager user's
        first tap is never lost.
      </p>

      <h2>Incremental hydration</h2>
      <p>
        Combine hydration with <code>&#64;defer</code> to hydrate parts of the page only
        when needed — the DOM is present immediately, but the JavaScript that makes a
        section interactive loads on a trigger:
      </p>
      <div class="code">
        <pre>&#64;defer (hydrate on viewport) {{ '{' }}
  &lt;app-comments /&gt;     &lt;!-- server-rendered now, hydrated when scrolled into view --&gt;
{{ '}' }}</pre>
      </div>

      <div class="tip">
        For stable hydration, the server and client must produce the <strong>same</strong>
        DOM. Avoid direct <code>innerHTML</code> manipulation outside Angular and don't
        branch markup on browser-only values during render, or you'll get hydration
        mismatch warnings.
      </div>
      <div class="note">
        Without hydration, the client throws away the server DOM and re-renders — a
        visible flash and wasted work. With it, Angular adopts the existing nodes, so
        the client does far less. Incremental hydration (<code>&#64;defer (hydrate …)</code>)
        goes further: a section stays interactive-dormant until its trigger fires,
        shrinking the JavaScript needed to become interactive. Skip hydration for a
        specific subtree with <code>ngSkipHydration</code> when a third-party widget owns
        that DOM.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Hydration reuses server HTML instead of re-rendering — no flicker.</li>
        <li><code>provideClientHydration()</code> turns it on; pair it with SSR.</li>
        <li><code>withEventReplay()</code> preserves early user interactions.</li>
        <li><code>&#64;defer (hydrate …)</code> enables incremental hydration of sections.</li>
      </ul>

      <p><a routerLink="/pwa-service-worker">Next: PWA &amp; Service Worker →</a></p>
    </article>
  `,
})
export class Hydration {}
