import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

/**
 * Lesson: path params, query params, fragments and matrix params.
 *
 * Beyond reading a value: the snapshot-vs-observable reuse trap (why the
 * snapshot goes stale on same-component navigation), queryParamsHandling modes,
 * array query params via getAll, matrix params, withComponentInputBinding and
 * the name-collision caveat, the everything-is-a-string trap, and the exam
 * questions. Includes a live demo that mutates this page's own query string.
 */
@Component({
  selector: 'app-lesson-route-params',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Route &amp; Query Parameters</h1>
      <p class="lead">
        Routes carry data in the URL two ways: <strong>path params</strong>
        (<code>/users/42</code>) identify a resource, and <strong>query params</strong>
        (<code>?sort=name&amp;page=2</code>) carry optional, shareable state. Read them
        reactively — the URL is state, and the same component often stays mounted while
        that state changes.
      </p>

      <h2>Declaring &amp; reading path params</h2>
      <div class="code"><pre>{{ readSample }}</pre></div>
      <div class="warn">
        Prefer the <strong>observable</strong> <code>paramMap</code> over the snapshot.
        Navigating <code>/users/1</code> → <code>/users/2</code> reuses the component (the
        router doesn't destroy and recreate it for a param change), so
        <code>snapshot.paramMap</code> is <em>frozen at the first activation</em> and never
        updates — the observable emits the new id. This is the single most common routing
        bug in reviews.
      </div>

      <h2>Live — query params on this very page</h2>
      <div class="demo">
        <p class="demo__title">Live — these links rewrite <code>?theme=…&amp;sort=…</code></p>
        <div class="row" style="margin-bottom:10px">
          <a routerLink="." [queryParams]="{ theme: 'dark', sort: 'name' }" queryParamsHandling="merge">theme=dark</a>
          <a routerLink="." [queryParams]="{ theme: 'light', sort: 'date' }" queryParamsHandling="merge">theme=light</a>
          <a routerLink="." [queryParams]="{}">clear</a>
        </div>
        <ul>
          <li><code>theme</code> = <strong>{{ theme() ?? '(none)' }}</strong></li>
          <li><code>sort</code> = <strong>{{ sort() ?? '(none)' }}</strong></li>
        </ul>
        <p style="color:var(--text-muted);font-size:.85rem">
          Look at the address bar — the state lives in the URL, so it's bookmarkable and
          shareable. The component instance never changes; the signals just re-emit.
        </p>
      </div>

      <h2>Setting query params: <code>queryParamsHandling</code></h2>
      <p>
        When you navigate, what happens to the query params already in the URL depends on
        this option:
      </p>
      <table class="cmp">
        <tr><th>Value</th><th>Effect on existing query params</th></tr>
        <tr><td><code>'' </code><em>(default)</em></td><td>replaced entirely by the new <code>[queryParams]</code> (drops the rest).</td></tr>
        <tr><td><code>'merge'</code></td><td>merged — new keys added/overwritten, others kept. Set a key to <code>null</code> to remove it.</td></tr>
        <tr><td><code>'preserve'</code></td><td>keeps the current query params, ignores the new ones.</td></tr>
      </table>
      <div class="code"><pre>{{ handlingSample }}</pre></div>

      <h2>Arrays, fragments &amp; matrix params</h2>
      <div class="code"><pre>{{ arraysSample }}</pre></div>
      <div class="note">
        A key repeated in the URL (<code>?tag=a&amp;tag=b</code>) is read with
        <code>queryParamMap.getAll('tag')</code> → <code>['a','b']</code>;
        <code>get('tag')</code> returns only the first. <strong>Matrix params</strong>
        (<code>/users;view=grid;page=2</code>) attach to a single segment and live in
        <code>paramMap</code> — handy for scoping state to one route segment rather than
        the whole URL.
      </div>

      <h2>Component input binding</h2>
      <div class="code"><pre>{{ inputSample }}</pre></div>
      <div class="warn">
        With <code>withComponentInputBinding()</code>, path params, query params <em>and</em>
        resolved data all bind to inputs by matching name — so <strong>avoid name
        collisions</strong> (a path <code>:id</code> and a <code>?id=</code> and a resolver
        keyed <code>id</code> all target one input, and only one wins). Also: params are
        always <strong>strings</strong> or <code>null</code>. <code>get('id')</code> gives
        <code>'42'</code>, not <code>42</code> — convert with <code>Number(id)</code> and
        validate, guarding the <code>null</code> case before parsing.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Stale snapshot on reuse.</strong> Read <code>route.paramMap</code>
          (observable/signal), not <code>snapshot.paramMap</code>, when the same route can
          re-navigate with different params.</li>
        <li><strong>Everything is a string.</strong> <code>+id</code> / <code>Number(id)</code>;
          a missing param is <code>null</code>, so parse defensively.</li>
        <li><strong>Default handling drops query params.</strong> Omitting
          <code>queryParamsHandling</code> replaces the whole query string — use
          <code>'merge'</code> to keep the rest.</li>
        <li><strong><code>get</code> vs <code>getAll</code>.</strong> Repeated keys need
          <code>getAll</code>; <code>get</code> silently returns just the first.</li>
        <li><strong>Query params don't re-run resolvers by default.</strong> That's a
          <code>runGuardsAndResolvers</code> setting — see
          <a routerLink="/resolvers">Resolvers</a>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Navigating <code>/users/1</code> → <code>/users/2</code> doesn't update the page. Why?</summary>
        <div>You read <code>snapshot.paramMap</code>. The component is reused, so the snapshot
        is stale. Subscribe to <code>route.paramMap</code> (or <code>toSignal</code> it).</div>
      </details>
      <details class="qa">
        <summary>How do you add <code>?page=2</code> without losing <code>?sort=name</code>?</summary>
        <div>Navigate with <code>queryParamsHandling: 'merge'</code>. To remove a param, set
        it to <code>null</code> in the merge.</div>
      </details>
      <details class="qa">
        <summary>The URL has <code>?tag=a&amp;tag=b</code>. How do you read both?</summary>
        <div><code>route.snapshot.queryParamMap.getAll('tag')</code> → <code>['a','b']</code>.
        <code>get</code> returns only <code>'a'</code>.</div>
      </details>
      <details class="qa">
        <summary>Is a route param a number?</summary>
        <div>No — always a string or <code>null</code>. Convert and validate
        (<code>Number(id)</code>), and handle a missing/NaN value.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Path params identify resources (<code>:id</code>); query params carry optional, shareable state.</li>
        <li>Read via the reactive <code>paramMap</code>/<code>queryParamMap</code>, not the snapshot, on reusable routes.</li>
        <li><code>queryParamsHandling: 'merge'</code> preserves existing query params; the default replaces them.</li>
        <li>Params are strings — convert explicitly; <code>withComponentInputBinding()</code> maps them to inputs (mind name collisions).</li>
      </ul>

      <p><a routerLink="/http-crud">Next: HttpClient CRUD →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class RouteParams {
  private readonly route = inject(ActivatedRoute);

  protected readonly theme = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('theme'))));
  protected readonly sort = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('sort'))));

  protected readonly readSample = `{ path: 'users/:id', component: UserPage }
<a [routerLink]="['/users', user.id]">View</a>

// in the component:
private route = inject(ActivatedRoute);

// reactive (preferred — survives same-component navigation):
id = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

// snapshot (one-time read — goes stale if the route is reused):
const id = this.route.snapshot.paramMap.get('id');`;

  protected readonly handlingSample = `<a [routerLink]="['/search']"
   [queryParams]="{ q: 'angular', page: 2 }"
   queryParamsHandling="merge"
   fragment="results">Search</a>

// remove a param while merging: set it to null
router.navigate([], { queryParams: { page: null }, queryParamsHandling: 'merge' });`;

  protected readonly arraysSample = `// repeated key → array
// URL:  /list?tag=ng&tag=rxjs
route.snapshot.queryParamMap.getAll('tag');   // ['ng', 'rxjs']
route.snapshot.queryParamMap.get('tag');      // 'ng'  (first only)

// fragment (the #hash)
route.fragment;                               // Observable<string | null>

// matrix params — scoped to one segment: /users;view=grid;page=2
route.snapshot.paramMap.get('view');          // 'grid'`;

  protected readonly inputSample = `provideRouter(routes, withComponentInputBinding());

// path params, query params AND resolved data bind to inputs by name:
id   = input<string>();     // from /users/:id
q    = input<string>();     // from ?q=...
user = input<User>();       // from a resolver keyed 'user'`;
}
