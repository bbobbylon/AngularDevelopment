import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-zoneless',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>Zoneless Angular</h1>
      <p class="lead">
        Zoneless Angular drops <code>Zone.js</code> entirely. Instead of monkey-patching
        every async API to guess when state <em>might</em> have changed, Angular schedules
        change detection only when something explicitly signals a change — a signal write,
        a template event, or an <code>async</code> pipe emission.
      </p>

      <h2>Zone.js — what it was doing</h2>
      <p>
        Zone.js wraps every browser async API (<code>setTimeout</code>,
        <code>Promise</code>, <code>addEventListener</code>, XHR, fetch…) so that Angular
        can call <code>ApplicationRef.tick()</code> after each one. This works, but has
        real costs:
      </p>
      <table class="t">
        <thead><tr><th>Problem</th><th>Why it hurts</th></tr></thead>
        <tbody>
          <tr><td><strong>~77 kB minified / ~25 kB gzipped</strong> polyfill in every bundle</td><td>Shipped on every page load, forever</td></tr>
          <tr><td>Re-renders the <em>whole tree</em> after <em>any</em> async</td><td>Fires on third-party library timers, analytics pings, WebSocket heartbeats…</td></tr>
          <tr><td>Monkey-patches 20+ global APIs at startup</td><td>Slower boot, polluted stack traces, breaks some libraries</td></tr>
          <tr><td>No way to opt out per callback</td><td>Can't easily say "don't check after this timer"</td></tr>
        </tbody>
      </table>

      <h2>Enabling zoneless</h2>
      <div class="code"><pre>// app.config.ts
import &#123; provideZonelessChangeDetection &#125; from '&#64;angular/core';

export const appConfig: ApplicationConfig = &#123;
  providers: [provideZonelessChangeDetection()],
&#125;;

// angular.json — remove Zone.js from polyfills:
// "polyfills": []   ← was ["zone.js"]</pre></div>

      <h2>What drives change detection now</h2>
      <div class="code"><pre>// ✅ Signal write — notifies Angular synchronously
count = signal(0);
count.update(c => c + 1);

// ✅ Template events always notify
// ✅ async pipe notifies on each emission
// ✅ ChangeDetectorRef.markForCheck() for imperative cases

// ❌ Mutating a plain class field inside setTimeout / Promise
//    will NOT re-render without a signal or markForCheck()</pre></div>

      <div class="demo">
        <p class="demo__title">Live — signal-driven counter (zoneless-ready)</p>
        <p class="row">
          <span class="pill">count: {{ count() }}</span>
          <span class="pill" style="color:var(--green)">renders: {{ renders() }}</span>
        </p>
        <div class="row">
          <button (click)="increment()">Signal increment ✓</button>
          <button class="ghost" (click)="silentMutate()">Plain field mutate (no re-render)</button>
        </div>
        <p style="font-size:.85rem;color:var(--text-muted);margin-top:8px">
          The "plain field mutate" button changes an internal variable but <em>doesn't
          update the pill</em> because there's no signal write — exactly how zoneless behaves.
        </p>
      </div>

      <h2>Migration checklist</h2>
      <ol>
        <li>Audit components for mutable fields that update inside async callbacks — convert them to <code>signal()</code>.</li>
        <li>Enable <code>ChangeDetectionStrategy.OnPush</code> on all components first (it enforces the same discipline and makes the eventual switch painless).</li>
        <li>Add <code>provideZonelessChangeDetection()</code> and run your tests — test failures reveal any remaining reliance on Zone.js.</li>
        <li>Remove <code>"zone.js"</code> from <code>polyfills</code> in <code>angular.json</code>.</li>
        <li>For third-party libraries that mutate DOM imperatively, wrap in <code>NgZone.run()</code> temporarily or switch to signal-based equivalents.</li>
      </ol>

      <div class="tip">
        Components should be <strong>OnPush-clean before you flip the switch</strong>.
        The easiest way to test readiness: add <code>provideZonelessChangeDetection()</code>
        to a test environment and run your full suite. Any broken test reveals reliance on
        Zone.js's implicit re-render scheduling.
      </div>
      <div class="note">
        Zoneless coalesces multiple signal writes in one tick into a single render pass,
        so rapid-fire updates (<code>a.set(1); b.set(2); c.set(3)</code>) produce one DOM
        update, not three. For state a third-party library mutates imperatively (canvas,
        WebGL, legacy jQuery widgets), nudge Angular with
        <code>ChangeDetectorRef.markForCheck()</code> or wrap the mutation in
        <code>ngZone.run()</code> as an escape hatch while you migrate.
      </div>

      <h2>Zone vs Zoneless — at a glance</h2>
      <table class="t">
        <thead><tr><th></th><th>Zone.js</th><th>Zoneless</th></tr></thead>
        <tbody>
          <tr><td>Bundle size</td><td>+25 kB gzip</td><td>0</td></tr>
          <tr><td>CD trigger</td><td>Any async (implicit)</td><td>Signal / event / async pipe (explicit)</td></tr>
          <tr><td>Stack traces</td><td>Polluted by Zone wrapper frames</td><td>Clean native frames</td></tr>
          <tr><td>Third-party lib interop</td><td>Usually transparent</td><td>Manual <code>markForCheck</code> for imperative libs</td></tr>
          <tr><td>Server-side rendering</td><td>Requires <code>fakeAsync</code> / zone setup</td><td>Works natively</td></tr>
        </tbody>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>provideZonelessChangeDetection()</code> + remove <code>zone.js</code> from polyfills.</li>
        <li>CD is scheduled by signals, template events and the <code>async</code> pipe — not by patched async APIs.</li>
        <li>Saves ~25 kB gzip, faster boot, cleaner stack traces, better third-party interop.</li>
        <li>Go OnPush-first — that discipline makes zoneless migration straightforward.</li>
        <li>Use <code>ChangeDetectorRef.markForCheck()</code> for imperative third-party code as an escape hatch.</li>
      </ul>

      <p><a routerLink="/deferrable-views">Next: Deferrable Views (&#64;defer) →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .t th, .t td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
  `],
})
export class Zoneless {
  protected readonly count = signal(0);
  protected readonly renders = signal(0);
  private _silent = 0;

  protected increment(): void {
    this.count.update((c) => c + 1);
    this.renders.update((r) => r + 1);
  }

  protected silentMutate(): void {
    this._silent++; // plain field — no signal, no re-render in zoneless
  }
}
