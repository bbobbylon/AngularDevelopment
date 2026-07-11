import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: zoneless Angular — what Zone.js actually did, what schedules change
 * detection without it, LIVE proofs (this very app runs zoneless), write
 * coalescing, the migration checklist, and the interop escape hatches.
 */
@Component({
  selector: 'app-lesson-zoneless',
  imports: [RouterLink],
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .t th, .t td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }

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
      <h1>Zoneless Angular</h1>
      <p class="lead">
        Zoneless Angular drops <code>Zone.js</code> entirely. Instead of
        monkey-patching every async API to guess when state <em>might</em> have
        changed, Angular runs change detection only when something explicitly tells
        the scheduler — a signal write, a template event, a
        <code>markForCheck()</code>. <strong>This app itself runs zoneless</strong>
        (no <code>zone.js</code> in its dependencies), so every demo below shows the
        real behavior, live.
      </p>

      <h2>Zone.js — what it was doing</h2>
      <p>
        Zone.js wraps every browser async API (<code>setTimeout</code>,
        <code>Promise</code>, <code>addEventListener</code>, XHR, fetch…) so Angular
        could be told "some async work just finished." Angular subscribed to the
        zone's <code>onMicrotaskEmpty</code> and called
        <code>ApplicationRef.tick()</code> — re-checking <em>from the root</em> —
        after every such moment. It works, but the costs are structural:
      </p>
      <table class="t">
        <thead><tr><th>Problem</th><th>Why it hurts</th></tr></thead>
        <tbody>
          <tr><td><strong>~77 kB minified / ~25 kB gzipped</strong> polyfill in every bundle</td><td>Shipped on every page load, forever</td></tr>
          <tr><td>Ticks the <em>whole tree</em> after <em>any</em> async</td><td>Fires on third-party timers, analytics pings, WebSocket heartbeats, mousemove-driven promises…</td></tr>
          <tr><td>Monkey-patches 20+ global APIs at startup</td><td>Slower boot, polluted stack traces, subtle breakage with native <code>async/await</code> and some libraries</td></tr>
          <tr><td>Implicit — no way to see or opt out per callback</td><td>Performance work degenerates into <code>runOutsideAngular()</code> whack-a-mole</td></tr>
        </tbody>
      </table>
      <div class="code"><pre>{{ zoneEraSample }}</pre></div>

      <h2>Enabling zoneless</h2>
      <div class="code"><pre>{{ enableSample }}</pre></div>
      <p>
        New Angular apps are generated zoneless — there is nothing to enable; the
        absence of the zone provider (and of <code>zone.js</code> in
        <code>polyfills</code>) <em>is</em> the configuration. Existing zone apps opt
        in with <code>provideZonelessChangeDetection()</code>, which swaps
        <code>NgZone</code> for a no-op implementation and installs the notification
        scheduler.
      </p>

      <h2>What schedules change detection now — the complete list</h2>
      <table class="cmp">
        <tr><th>Notification</th><th>Example</th></tr>
        <tr><td><strong>Signal write</strong> (read somewhere reactive)</td><td><code>count.set(1)</code> — marks consumer views dirty + schedules a tick</td></tr>
        <tr><td><strong>Template / host event listener</strong></td><td>any <code>(click)</code> handler — the view is marked dirty before your code runs</td></tr>
        <tr><td><strong><code>markForCheck()</code></strong> (directly or via <code>async</code> pipe)</td><td>observable emission through <code>| async</code></td></tr>
        <tr><td><strong>Input set by the framework</strong></td><td>parent binding wrote a new value, <code>setInput()</code> on a component ref</td></tr>
        <tr><td><strong>Structural operations</strong></td><td>attaching/detaching views, <code>createComponent()</code></td></tr>
        <tr><td><strong>Explicit tick</strong></td><td><code>ApplicationRef.tick()</code> — the manual crank</td></tr>
      </table>
      <p>
        Everything else — <code>setTimeout</code>, promise chains, fetch callbacks,
        WebSocket messages, DOM listeners registered with
        <code>addEventListener</code> by hand — updates your data and tells no one.
      </p>

      <h2>Live proof #1 — async mutation is invisible, signals aren't</h2>
      <div class="demo">
        <p class="demo__title">Live — two timeouts, one difference (this app really is zoneless)</p>
        <p class="row">
          <span class="pill">plain field: {{ plainValue }}</span>
          <span class="pill" style="color:var(--green)">signal: {{ signalValue() }}</span>
        </p>
        <div class="row">
          <button class="ghost" (click)="timeoutPlain()">setTimeout → plain field ✗</button>
          <button (click)="timeoutSignal()">setTimeout → signal ✓</button>
        </div>
        <p style="font-size:.85rem;color:var(--text-muted);margin-top:8px">
          Both timers fire after 300ms and both really do assign. Under Zone.js the
          patched <code>setTimeout</code> would trigger a tick and you'd see both.
          Here the plain-field write renders <em>nothing</em> — until you click the
          signal button and the resulting pass re-reads the stale field too. That
          "ghost update appearing late" is the classic symptom of missing
          notifications.
        </p>
      </div>

      <h2>Live proof #2 — template events still "just work"</h2>
      <div class="demo">
        <p class="demo__title">Live — plain field mutated in a click handler</p>
        <p class="row"><span class="pill">clicks (plain field, no signal): {{ plainClicks }}</span></p>
        <div class="row">
          <button (click)="plainClicks = plainClicks + 1">Mutate plain field in (click) ✓</button>
        </div>
        <p style="font-size:.85rem;color:var(--text-muted);margin-top:8px">
          Surprised? Zoneless doesn't mean "signals only": Angular wraps every
          <em>template</em> event listener, marks the view dirty and schedules a tick
          before your handler runs. The rule of thumb: synchronous work in template
          handlers renders fine; it's the <strong>async continuation</strong> that
          needs a signal or <code>markForCheck()</code>.
        </p>
      </div>

      <h2>Live proof #3 — writes coalesce into one render pass</h2>
      <div class="demo">
        <p class="demo__title">Live — three signal writes, one tick</p>
        <p class="row">
          <span class="pill">a: {{ a() }}</span>
          <span class="pill">b: {{ b() }}</span>
          <span class="pill">c: {{ c() }}</span>
          <span class="pill" style="color:var(--violet)">render passes over this view: {{ renderCount }}</span>
        </p>
        <div class="row">
          <button (click)="writeAllThree()">a.set / b.set / c.set — in one handler</button>
        </div>
        <p style="font-size:.85rem;color:var(--text-muted);margin-top:8px">
          The render counter (a getter that increments per check of this view) goes up
          by <strong>one</strong> per click, not three: notifications are coalesced —
          any number of synchronous writes produce a single change-detection pass.
        </p>
      </div>

      <h2>Under the hood — the notification scheduler</h2>
      <div class="code"><pre>{{ schedulerSample }}</pre></div>
      <ul>
        <li>
          <strong>Producers notify, the scheduler coalesces:</strong> every trigger in
          the table above funnels into one <code>ChangeDetectionScheduler</code>. The
          first notification schedules a tick; further notifications before it runs
          are absorbed into the same pass.
        </li>
        <li>
          <strong>The tick is still top-down:</strong> zoneless didn't change
          <em>how</em> checking works (root → leaves, OnPush pruning, signal-marked
          views refreshed) — it changed <em>when</em> a pass is scheduled. OnPush +
          signals decide the <em>where</em>; zoneless decides the <em>when</em>.
        </li>
        <li>
          <strong><code>NgZone</code> becomes a no-op:</strong> injected
          <code>NgZone.run()</code> / <code>runOutsideAngular()</code> still execute
          your callback — they just no longer control change detection. Code that
          <em>listens</em> to <code>NgZone.onStable</code> / <code>onMicrotaskEmpty</code>
          is the real migration risk.
        </li>
      </ul>

      <h2>Migration checklist (zone app → zoneless)</h2>
      <ol>
        <li>Go <strong>OnPush-first</strong>: enable <code>ChangeDetectionStrategy.OnPush</code> across the app. It enforces the identical discipline (explicit notifications) while Zone.js is still there to catch you — see the <a routerLink="/onpush">OnPush lesson</a>.</li>
        <li>Hunt mutable fields assigned in async callbacks (<code>subscribe</code>, <code>then</code>, timers, sockets) — convert to <code>signal()</code> / <code>toSignal()</code>, or add <code>markForCheck()</code>.</li>
        <li>Search for <code>NgZone.onStable</code>, <code>onMicrotaskEmpty</code>, <code>zone.run</code> in your code <em>and your dependencies</em> — replace with <code>afterNextRender()</code> or explicit notifications.</li>
        <li>Add <code>provideZonelessChangeDetection()</code> in a branch and run the full test suite — failures map 1:1 to missing notifications.</li>
        <li>Remove <code>"zone.js"</code> from <code>polyfills</code> in <code>angular.json</code> (this is the bundle-size payoff — the provider alone doesn't remove the polyfill).</li>
        <li>For imperative third-party widgets (charts, maps, jQuery-era plugins), wrap their callbacks: write results into signals, or call <code>markForCheck()</code> after mutating bound state.</li>
      </ol>

      <h2>Testing without the zone</h2>
      <div class="code"><pre>{{ testingSample }}</pre></div>
      <p>
        <code>fakeAsync</code>/<code>tick()</code> are zone features — zoneless tests
        use real async: <code>await fixture.whenStable()</code> and
        <code>fixture.detectChanges()</code> driven by the same notification rules as
        production. That's a feature: a test that fails zoneless is showing you a
        component that would render stale in production.
      </p>

      <h2>Zone vs Zoneless — at a glance</h2>
      <table class="t">
        <thead><tr><th></th><th>Zone.js</th><th>Zoneless</th></tr></thead>
        <tbody>
          <tr><td>Bundle size</td><td>+25 kB gzip</td><td>0</td></tr>
          <tr><td>CD trigger</td><td>any patched async completing (implicit)</td><td>signal / event / markForCheck / input (explicit)</td></tr>
          <tr><td>Wasted passes</td><td>constant — every timer &amp; ping ticks the app</td><td>none — no notification, no pass</td></tr>
          <tr><td>Stack traces</td><td>polluted by zone wrapper frames</td><td>clean native frames</td></tr>
          <tr><td>Third-party interop</td><td>usually transparent</td><td>manual <code>markForCheck</code>/signal bridge for imperative libs</td></tr>
          <tr><td>Native async/await</td><td>downleveled to promises so the patch sees it</td><td>runs native</td></tr>
          <tr><td>SSR &amp; tests</td><td>zone-specific machinery (<code>fakeAsync</code>)</td><td>plain promises, <code>whenStable()</code></td></tr>
        </tbody>
      </table>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>"It worked before"</strong> — code assigning fields in <code>subscribe()</code> rendered fine under zone. Zoneless makes the missing notification visible. The fix is signals/async pipe, not sprinkling <code>tick()</code>.</li>
        <li><strong>Removing the provider isn't enough backwards:</strong> forgetting to delete <code>zone.js</code> from polyfills keeps shipping 25 kB for nothing.</li>
        <li><strong>Libraries that require the zone</strong> (rare now): anything awaiting <code>onStable</code> for overlay positioning, e.g. very old CDK versions — upgrade them; modern CDK/Material are zoneless-ready.</li>
        <li><strong><code>requestAnimationFrame</code> loops</strong> for canvas/WebGL never needed CD — keep them plain, write summarized state into a signal only when the UI must reflect it.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Exactly which mechanisms schedule a CD pass in a zoneless app?</summary>
        <div>Signal writes with reactive consumers, template/host event listeners,
        <code>markForCheck()</code> (including via the async pipe), framework input
        writes (<code>setInput</code>), view attach/detach, and explicit
        <code>ApplicationRef.tick()</code>. Raw async APIs schedule nothing.</div>
      </details>
      <details class="qa">
        <summary>Why is OnPush described as "zoneless training wheels"?</summary>
        <div>OnPush already ignores un-notified changes <em>for that component</em> —
        stale views surface immediately while Zone.js still guarantees passes happen.
        An app that is fully OnPush-clean has, by definition, adopted the explicit
        notification discipline zoneless requires globally.</div>
      </details>
      <details class="qa">
        <summary>A WebSocket handler updates a field and the UI freezes at the old value — but only in production. Diagnose.</summary>
        <div>Production is zoneless (or the component OnPush): the socket callback is
        unpatched async — no notification, no pass. Convert the field to a signal (or
        route the stream through <code>toSignal</code>/async pipe). The dev/prod
        difference usually means dev still had zone.js loaded.</div>
      </details>
      <details class="qa">
        <summary>What happens to <code>NgZone.runOutsideAngular()</code> calls after going zoneless?</summary>
        <div>They still run the callback, but they're inert — there's no zone to step
        out of, and change detection wasn't listening anyway. Safe to leave during
        migration, ripe for deletion after. Code <em>listening</em> to
        <code>onStable</code>/<code>onMicrotaskEmpty</code>, by contrast, must be
        rewritten (e.g. <code>afterNextRender()</code>).</div>
      </details>
      <details class="qa">
        <summary>Three signals are set in one click handler. How many renders? Why?</summary>
        <div>One. Each write notifies the scheduler, but a tick is already pending
        after the first — notifications coalesce into a single top-down pass (proven
        live above). Consistency bonus: the template can never observe a half-applied
        state.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Zoneless = explicit scheduling: signals, template events, <code>markForCheck</code>, input writes. Unpatched async renders nothing.</li>
        <li>It changes <em>when</em> passes run; OnPush/signals still decide <em>which views</em> refresh. The three features compose.</li>
        <li>Migrate OnPush-first, convert async-assigned fields to signals, audit <code>onStable</code> listeners, then drop the polyfill (that's the −25 kB).</li>
        <li>Writes coalesce — any burst of synchronous updates is one render pass.</li>
        <li>Zoneless failures are honest: they expose updates that were always un-notified, previously papered over by zone ticks.</li>
      </ul>

      <p><a routerLink="/deferrable-views">Next: Deferrable Views (&#64;defer) →</a></p>
    </article>
  `,
})
export class Zoneless {
  protected plainValue = '—';
  protected readonly signalValue = signal('—');
  protected plainClicks = 0;

  protected readonly a = signal(0);
  protected readonly b = signal(0);
  protected readonly c = signal(0);
  private renders = 0;
  /** Increments once per check of this view — a live render-pass counter. */
  protected get renderCount() {
    return ++this.renders;
  }

  private plainN = 0;
  private signalN = 0;

  protected timeoutPlain(): void {
    setTimeout(() => {
      // really assigns — but in a zoneless app nobody schedules a pass
      this.plainValue = `write #${++this.plainN} (invisible until the next pass)`;
    }, 300);
  }

  protected timeoutSignal(): void {
    setTimeout(() => {
      this.signalValue.set(`write #${++this.signalN}`);
    }, 300);
  }

  protected writeAllThree(): void {
    this.a.update((v) => v + 1);
    this.b.update((v) => v + 1);
    this.c.update((v) => v + 1);
    // three notifications → one coalesced render pass (watch the counter)
  }

  readonly zoneEraSample = `// how zone-era Angular knew when to render:
// 1. zone.js patches the async API
window.setTimeout = zonePatched(setTimeout);
// 2. your callback runs inside the zone
// 3. the zone reports "microtasks drained"
ngZone.onMicrotaskEmpty.subscribe(() => appRef.tick());  // check EVERYTHING`;

  readonly enableSample = `// New apps (Angular 20+ CLI): zoneless is the default — nothing to add.

// Migrating an existing zone app:
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};

// angular.json — the actual bundle savings:
// "polyfills": []        ← was ["zone.js"]`;

  readonly schedulerSample = `// every trigger funnels into one scheduler:
signal.set(v)        ─┐
(click) handler       ├─► ChangeDetectionScheduler.notify()
markForCheck()        │      └─ tick already pending? absorb.
input binding write  ─┘         else: schedule appRef.tick()

// the pass itself is unchanged: root → leaves,
// clean OnPush subtrees pruned, signal-dirty views refreshed`;

  readonly testingSample = `// zone era:
it('updates', fakeAsync(() => {
  component.load();
  tick(300);                    // zone-powered virtual time
  fixture.detectChanges();
}));

// zoneless:
it('updates', async () => {
  component.load();
  await fixture.whenStable();   // real async, same notifications as prod
  expect(el.textContent).toContain('loaded');
});`;
}
