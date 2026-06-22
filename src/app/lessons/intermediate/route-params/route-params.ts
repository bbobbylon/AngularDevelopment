import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-lesson-route-params',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Route & Query Parameters</h1>
      <p class="lead">
        Routes carry data in the URL two ways: <strong>path params</strong>
        (<code>/users/42</code>) identify a resource, and <strong>query params</strong>
        (<code>?sort=name&amp;page=2</code>) carry optional, shareable state.
      </p>

      <h2>Declaring path params</h2>
      <div class="code">
        <pre>{{ '{' }} path: 'users/:id', component: UserPage {{ '}' }}
&lt;a [routerLink]="['/users', user.id]"&gt;View&lt;/a&gt;</pre>
      </div>

      <h2>Reading params reactively</h2>
      <div class="code">
        <pre>private route = inject(ActivatedRoute);

// reactive (preferred — survives same-component navigation):
id = toSignal(this.route.paramMap.pipe(map(p =&gt; p.get('id'))));

// snapshot (one-time read):
const id = this.route.snapshot.paramMap.get('id');</pre>
      </div>
      <div class="warn">
        Prefer the <strong>observable</strong> <code>paramMap</code> over the snapshot.
        When navigating from <code>/users/1</code> to <code>/users/2</code> Angular may
        reuse the component — the snapshot will <em>not</em> update, but the observable
        will.
      </div>

      <h2>Query params & fragments</h2>
      <div class="code">
        <pre>&lt;a [routerLink]="['/search']"
   [queryParams]="{{ '{' }} q: 'angular', page: 2 {{ '}' }}"
   fragment="results"&gt;Search&lt;/a&gt;

this.route.queryParamMap;   // observable
this.route.fragment;        // observable</pre>
      </div>

      <h2>Try it — live query params on this page</h2>
      <div class="demo">
        <p class="demo__title">Live — these links change the URL ?theme=…&amp;sort=…</p>
        <div class="row" style="margin-bottom:10px">
          <a routerLink="." [queryParams]="{ theme: 'dark', sort: 'name' }" queryParamsHandling="merge">theme=dark</a>
          <a routerLink="." [queryParams]="{ theme: 'light', sort: 'date' }" queryParamsHandling="merge">theme=light</a>
          <a routerLink="." [queryParams]="{}">clear</a>
        </div>
        <p>this route sees:</p>
        <ul>
          <li><code>theme</code> = <strong>{{ theme() ?? '(none)' }}</strong></li>
          <li><code>sort</code> = <strong>{{ sort() ?? '(none)' }}</strong></li>
        </ul>
        <p style="color:var(--text-muted);font-size:.85rem">
          Look at the browser address bar — the state lives in the URL, so it is
          bookmarkable and shareable.
        </p>
      </div>

      <h2>Component input binding</h2>
      <div class="code">
        <pre>provideRouter(routes, withComponentInputBinding());

// then path params, query params, AND resolved route data all bind to inputs by name:
id = input&lt;string&gt;();      // from /users/:id
q  = input&lt;string&gt;();      // from ?q=...
user = input&lt;User&gt;();      // from a resolver keyed 'user'</pre>
      </div>
      <div class="warn">
        Params are always <strong>strings</strong> (or <code>null</code>) —
        <code>paramMap.get('id')</code> gives <code>'42'</code>, not <code>42</code>.
        Convert explicitly (<code>Number(id)</code>) and validate. A missing param is
        <code>null</code>, so guard for it before parsing.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Path params identify resources (<code>:id</code>); query params carry optional state.</li>
        <li>Read with the reactive <code>paramMap</code>/<code>queryParamMap</code>, not just the snapshot.</li>
        <li>Set query params via <code>[queryParams]</code> + <code>queryParamsHandling</code>.</li>
        <li><code>withComponentInputBinding()</code> maps params straight to component inputs.</li>
      </ul>

      <p><a routerLink="/http-crud">Next: HttpClient CRUD →</a></p>
    </article>
  `,
})
export class RouteParams {
  private readonly route = inject(ActivatedRoute);

  protected readonly theme = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('theme'))),
  );
  protected readonly sort = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('sort'))),
  );
}
