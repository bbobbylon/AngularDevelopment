import { Component, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

@Component({
  selector: 'app-lesson-resource-api',
  imports: [RouterLink],
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .82rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Signals</span>
      <h1>The resource() API</h1>
      <p class="lead">
        <code>resource()</code> bridges async data and signals. You give it a reactive
        <code>params</code> and a <code>loader</code>; it tracks loading/error state,
        re-fetches when the params change, and cancels stale requests via an
        <code>AbortSignal</code> — all exposed as signals.
      </p>

      <h2>Declaring a resource</h2>
      <div class="code">
        <pre>userId = signal(1);

userResource = resource({{ '{' }}
  params: () =&gt; this.userId(),                 // reactive — re-runs the loader
  loader: async ({{ '{' }} params, abortSignal {{ '}' }}) =&gt; {{ '{' }}
    const res = await fetch(\`/users/\${{ '{' }}params{{ '}' }}\`, {{ '{' }} signal: abortSignal {{ '}' }});
    return (await res.json()) as User;
  {{ '}' }},
{{ '}' }});</pre>
      </div>

      <h2>Try it — live fetch</h2>
      <div class="demo">
        <p class="demo__title">Live — real requests to jsonplaceholder</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="prev()" [disabled]="userId() <= 1">‹ Prev</button>
          <span class="pill">userId = {{ userId() }}</span>
          <button (click)="next()" [disabled]="userId() >= 10">Next ›</button>
          <button class="ghost" (click)="userResource.reload()">Reload</button>
        </div>

        <p class="row">
          <span class="pill">status: {{ userResource.status() }}</span>
          <span class="pill">loading: {{ userResource.isLoading() }}</span>
        </p>

        @if (userResource.isLoading()) {
          <p>⏳ Loading user…</p>
        } @else if (userResource.error()) {
          <p style="color:var(--accent)">⚠ {{ userResource.error() }}</p>
        } @else if (userResource.hasValue()) {
          <div class="code"><pre>name:    {{ userResource.value().name }}
email:   {{ userResource.value().email }}
company: {{ userResource.value().company.name }}</pre></div>
        }
      </div>

      <h2>What it exposes</h2>
      <div class="code">
        <pre>userResource.value()      // Signal&lt;User | undefined&gt;
userResource.status()     // 'idle' | 'loading' | 'resolved' | 'error' | …
userResource.isLoading()  // boolean signal
userResource.error()      // unknown signal
userResource.hasValue()   // type-guard signal
userResource.reload()     // re-run the loader manually</pre>
      </div>

      <div class="tip">
        Prefer <code>rxResource</code> (from <code>&#64;angular/core/rxjs-interop</code>)
        when your loader is an Observable — pass a <code>stream</code> instead of a
        <code>loader</code>. Both re-run automatically when <code>params</code> change
        and abort the in-flight request.
      </div>
      <div class="note">
        The loader's <code>abortSignal</code> is wired to <code>fetch</code> so a stale
        request is genuinely cancelled when <code>params</code> change. You can write the
        value locally — <code>userResource.value.set(edited)</code> — for optimistic
        updates (the status becomes <code>'local'</code>) until the next reload. Returning
        <code>undefined</code> from a param means "no request"
        (<code>idle</code>), which is how you defer loading until inputs are ready.
      </div>

      <h2>resource() vs the alternatives</h2>
      <table class="cmp">
        <tr><th>Tool</th><th>Gives you</th><th>Reach for it when</th></tr>
        <tr><td><code>resource()</code></td><td>value + status + error + isLoading signals, auto re-fetch, cancellation</td><td>reactive reads keyed off a signal (an id, a filter) with real loading/error UI</td></tr>
        <tr><td><code>toSignal(http$)</code></td><td>a signal of the latest value</td><td>a one-shot fetch you just want as a signal; no built-in status/error</td></tr>
        <tr><td>manual <code>subscribe()</code></td><td>full RxJS control</td><td>complex streams (debounce, combine, retry) — but you manage state + teardown</td></tr>
        <tr><td>route <a routerLink="/resolvers">resolver</a></td><td>data before the route activates</td><td>small, critical data that must be present on first paint (blocks navigation)</td></tr>
      </table>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Reading params non-reactively.</strong> The <code>params</code> callback must
          read signals so the loader re-runs — a plain variable won't trigger re-fetch.</li>
        <li><strong>Ignoring <code>abortSignal</code>.</strong> Wire it into <code>fetch</code>
          (or <code>rxResource</code>) so stale requests are actually cancelled.</li>
        <li><strong>Expecting <code>value()</code> to always be set.</strong> It's
          <code>undefined</code> while loading/idle — guard with <code>hasValue()</code> or
          <code>isLoading()</code>.</li>
        <li><strong>Observable loader in <code>resource()</code>.</strong> Use
          <code>rxResource</code> with a <code>stream</code> for Observable sources.</li>
        <li><strong>Forgetting the "no request" signal.</strong> Return <code>undefined</code>
          from a param to stay <code>idle</code> until inputs are ready.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>How does a resource know to re-fetch?</summary>
        <div>Its <code>params</code> callback reads signals; when any change, the loader re-runs
        and the previous request is aborted.</div>
      </details>
      <details class="qa">
        <summary><code>resource()</code> vs a route resolver?</summary>
        <div><code>resource()</code> shows the route immediately and streams data in with
        loading/error signals. A resolver blocks navigation until small, critical data is
        ready.</div>
      </details>
      <details class="qa">
        <summary>My loader is an Observable — which API?</summary>
        <div><code>rxResource</code> from <code>&#64;angular/core/rxjs-interop</code>; pass a
        <code>stream</code> instead of a <code>loader</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>resource()</code> turns async loads into reactive signal state.</li>
        <li>A change to <code>params</code> re-runs the loader and cancels the old one.</li>
        <li>Read <code>value</code>, <code>status</code>, <code>isLoading</code>, <code>error</code> as signals.</li>
        <li>Use <code>rxResource</code> for Observable-based loaders.</li>
      </ul>

      <p><a routerLink="/testing-components">Next: Testing Components →</a></p>
    </article>
  `,
})
export class ResourceApi {
  protected readonly userId = signal(1);

  protected readonly userResource = resource({
    params: () => this.userId(),
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${params}`, {
        signal: abortSignal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as User;
    },
  });

  protected next() {
    this.userId.update((n) => Math.min(10, n + 1));
  }
  protected prev() {
    this.userId.update((n) => Math.max(1, n - 1));
  }
}
