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
