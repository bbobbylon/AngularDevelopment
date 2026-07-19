import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: route resolvers, static route data, and the navigation lifecycle.
 *
 * Goes well past "a resolver fetches data before activation": it shows the
 * loading-flicker problem a resolver solves (side-by-side live simulation of a
 * component-level fetch vs a resolver), where resolvers sit in the guard →
 * resolve → activate pipeline, the hard rule that an Observable resolver must
 * COMPLETE or navigation hangs (live demo), the runGuardsAndResolvers re-run
 * modes, error handling with RedirectCommand / EMPTY, static data + TitleStrategy,
 * and when to reach for resource() instead. Ends with the pitfalls and exam
 * questions that trip people up.
 *
 * The two demos are self-contained signal simulations (setTimeout guarded by a
 * monotonic token so stale timers can't clobber a reset) — no real router
 * navigation happens, so the lesson page itself never actually leaves.
 */
@Component({
  selector: 'app-lesson-resolvers',
  imports: [RouterLink],
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      table.cmp td code { white-space: nowrap; }
      .ok { color: var(--green); font-weight: 700; }
      .bad { color: #ef4444; font-weight: 700; }

      .browsers { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 4px 0 12px; }
      .browser { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg-card); }
      .browser__bar { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--bg-elevated); border-bottom: 1px solid var(--border); }
      .browser__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border); }
      .browser__url { flex: 1; font-family: monospace; font-size: .74rem; color: var(--text-muted); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .browser__progress { height: 3px; background: linear-gradient(90deg, var(--accent), transparent); animation: slide 1s linear infinite; }
      @keyframes slide { from { opacity: .4; } 50% { opacity: 1; } to { opacity: .4; } }
      .browser__screen { padding: 16px; min-height: 118px; display: flex; flex-direction: column; justify-content: center; gap: 8px; font-size: .82rem; }
      .browser__label { font-size: .68rem; letter-spacing: .04em; text-transform: uppercase; color: var(--text-muted); padding: 4px 10px; }
      .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .usercard { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; background: var(--bg-elevated); }
      .usercard strong { display: block; }
      .usercard span { color: var(--text-muted); font-size: .76rem; }
      .flickered { color: #ef4444; font-weight: 600; }
      .noflicker { color: var(--green); font-weight: 600; }

      .status-pill { display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: .8rem; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg-elevated); }

      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }

      .seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
      .seg button { background: var(--bg-card); border: 0; padding: 6px 14px; cursor: pointer; font-size: .82rem; color: var(--text-muted); }
      .seg button.active { background: var(--accent); color: #fff; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Routing</span>
      <h1>Resolvers &amp; Route Data</h1>
      <p class="lead">
        A resolver fetches data <em>before</em> a route activates, so the component
        renders with its data already present — no in-component loading flicker, no
        empty first paint. Static <code>data</code> attaches fixed values to a route.
        The catch: resolvers block navigation, so they carry rules (complete or hang,
        keep them fast, handle errors) that this page drills with live simulations.
      </p>

      <h2>The problem a resolver solves</h2>
      <p>
        Fetch data <em>inside</em> the component and the route activates instantly with
        nothing to show — you paint a spinner, then swap in the data (a "flicker").
        A resolver moves that wait to <em>before</em> activation: the old view stays up
        while data loads, then the new route appears already populated. Same total time;
        very different feel. Click once and watch both timelines:
      </p>
      <div class="demo">
        <p class="demo__title">Live — component-level fetch vs resolver</p>
        <div class="browsers">
          <div>
            <span class="browser__label">Fetch inside component (no resolver)</span>
            <div class="browser">
              <div class="browser__bar">
                <span class="browser__dot"></span>
                <span class="browser__url">{{ panelA() === 'idle' ? '/dashboard' : '/users/7' }}</span>
              </div>
              <div class="browser__screen">
                @switch (panelA()) {
                  @case ('idle') { <div>📊 Dashboard <span style="color:var(--text-muted)">(previous page)</span></div> }
                  @case ('loading') { <div><span class="spinner"></span> Loading user…</div><div class="flickered">↑ route already changed, component has no data yet</div> }
                  @case ('ready') {
                    <div class="usercard"><strong>Ada Lovelace</strong><span>ada&#64;example.com · id 7</span></div>
                    <div class="flickered">user saw an empty loading state first</div>
                  }
                }
              </div>
            </div>
          </div>

          <div>
            <span class="browser__label">Resolver (data before activation)</span>
            <div class="browser">
              <div class="browser__bar">
                <span class="browser__dot"></span>
                <span class="browser__url">{{ panelB() === 'ready' ? '/users/7' : '/dashboard' }}</span>
              </div>
              @if (panelB() === 'resolving') { <div class="browser__progress"></div> }
              <div class="browser__screen">
                @switch (panelB()) {
                  @case ('idle') { <div>📊 Dashboard <span style="color:var(--text-muted)">(previous page)</span></div> }
                  @case ('resolving') { <div>📊 Dashboard <span style="color:var(--text-muted)">(still showing — navigation pending)</span></div> }
                  @case ('ready') {
                    <div class="usercard"><strong>Ada Lovelace</strong><span>ada&#64;example.com · id 7</span></div>
                    <div class="noflicker">route appeared already populated — no flicker</div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <button (click)="navigate()">Navigate to /users/7</button>
          <button class="ghost" (click)="resetDemo1()">Reset</button>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Both take the same ~900 ms. The left route changes first and shows a spinner;
          the right keeps the old view up until the data is ready, then swaps in one step.
        </p>
      </div>

      <h2>A functional resolver</h2>
      <p>
        A resolver is a <code>ResolveFn&lt;T&gt;</code> — a plain function that can
        <code>inject()</code> and returns the data, a <code>Promise</code>, or an
        <code>Observable</code>. Register it under a key in the route's
        <code>resolve</code> map:
      </p>
      <div class="code"><pre>{{ resolverSample }}</pre></div>

      <h2>Where resolvers run — the navigation pipeline</h2>
      <p>
        Resolvers are not the first thing the router does. A navigation runs a fixed
        pipeline, and resolvers sit near the end — they only run once every guard has
        passed, so you never waste a fetch on a route the user isn't allowed to enter:
      </p>
      <div class="code"><pre>{{ pipelineSample }}</pre></div>
      <div class="note">
        All resolve keys on the activated route (and its resolved parents) run
        <strong>in parallel</strong>, and navigation waits for <em>all</em> of them.
        One slow resolver holds up the whole transition — the route is only as fast as
        its slowest resolver. That is also why guards run first: an unauthorized user
        should be redirected <em>before</em> you pay for the data.
      </div>

      <h2>Reading resolved data</h2>
      <div class="code"><pre>{{ readSample }}</pre></div>
      <div class="tip">
        With <code>provideRouter(routes, withComponentInputBinding())</code> (enabled in
        this app), each <code>resolve</code> key, path param and query param is bound
        straight to a matching component <code>input()</code> — no
        <code>ActivatedRoute</code> plumbing. The input name must equal the resolve key.
        Prefer the observable <code>route.data</code> over
        <code>snapshot.data</code> when the same component instance is reused across
        param changes (see <code>runGuardsAndResolvers</code> below) — the snapshot is
        frozen at activation and won't update on re-resolve.
      </div>

      <h2>An Observable resolver must complete</h2>
      <p>
        This is the number-one resolver bug. The router subscribes to your resolver and
        waits for it to <strong>complete</strong>, not just emit. An
        <code>HttpClient</code> call completes after one value, so it's fine. But a
        long-lived stream — a <code>Subject</code>, <code>valueChanges</code>, a
        store <code>select()</code>, <code>interval()</code> — emits and keeps going, so
        the router waits forever and the navigation silently hangs. Take one value with
        <code>first()</code> (or <code>take(1)</code>) to force completion:
      </p>
      <div class="demo">
        <p class="demo__title">Live — does navigation ever finish?</p>
        <div class="row">
          <span>Resolver returns a store stream</span>
          <span class="seg">
            <button [class.active]="!useFirst()" (click)="useFirst.set(false)">store.select(user)</button>
            <button [class.active]="useFirst()" (click)="useFirst.set(true)">…pipe(first())</button>
          </span>
        </div>
        <div class="row" style="margin-top:12px">
          <button (click)="runResolver2()">Start navigation</button>
          <button class="ghost" (click)="resetDemo2()">Reset</button>
          <span class="status-pill">
            @switch (demo2()) {
              @case ('idle') { <span>idle</span> }
              @case ('pending') { <span class="spinner"></span> <span>resolving… navigation blocked</span> }
              @case ('done') { <span class="ok">✓ navigated</span> }
            }
          </span>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          @if (demo2() === 'pending' && !useFirst()) {
            The stream emitted the user, but never completed — the router is still
            waiting. In a real app the URL is stuck and nothing happens.
          } @else {
            <code>first()</code> completes the stream after the first value, so the
            router unblocks and the route activates.
          }
        </p>
      </div>
      <div class="warn">
        If a resolver <em>errors</em> (or its Observable errors), the navigation is
        cancelled and the router emits <code>NavigationError</code> — the user is left
        on the current page with no route change. Always catch and decide: redirect,
        return an empty/placeholder value, or rethrow to a global handler.
      </div>

      <h2>Error handling &amp; redirects from a resolver</h2>
      <div class="code"><pre>{{ errorSample }}</pre></div>
      <div class="note">
        <code>RedirectCommand</code> (Angular 17.1+) is the clean way to bail out of a
        guard or resolver: return <code>new RedirectCommand(router.parseUrl('/login'))</code>
        and the router redirects instead of throwing. Before it, you injected the
        <code>Router</code> and called <code>navigate()</code> as a side effect while
        returning <code>EMPTY</code> to abort the original navigation.
      </div>

      <h2>Re-running: <code>runGuardsAndResolvers</code></h2>
      <p>
        Navigate from <code>/users/7</code> to <code>/users/9</code> and Angular reuses
        the same component instance. By default the resolver does <strong>not</strong>
        re-run on a query-param-only change — which is a classic "why is my data stale?"
        bug. The route's <code>runGuardsAndResolvers</code> controls exactly when:
      </p>
      <table class="cmp">
        <tr><th>Value</th><th>Re-runs guards + resolvers when…</th></tr>
        <tr><td><code>'paramsChange'</code> <em>(default)</em></td><td>a <strong>matrix/path param</strong> changes (<code>:id</code>). Query-only changes do <em>not</em> re-run.</td></tr>
        <tr><td><code>'pathParamsChange'</code></td><td>only a path param changes — ignores matrix params like <code>;view=grid</code>.</td></tr>
        <tr><td><code>'paramsOrQueryParamsChange'</code></td><td>any param <em>or</em> query param changes — use when <code>?page=2</code> should refetch.</td></tr>
        <tr><td><code>'pathParamsOrQueryParamsChange'</code></td><td>path params or query params (ignores matrix params).</td></tr>
        <tr><td><code>'always'</code></td><td>every navigation that lands on this route, even same-URL. Combine with <code>onSameUrlNavigation: 'reload'</code> to support a "refresh" click.</td></tr>
        <tr><td>a <code>function</code></td><td>you return a boolean from <code>(from, to) =&gt; boolean</code> for full control.</td></tr>
      </table>

      <h2>Resolver, resource(), guard, or component fetch?</h2>
      <p>
        Resolvers are not always the answer. Blocking navigation for a big or slow fetch
        makes the app feel frozen — the user clicks and nothing happens. Match the tool
        to the data:
      </p>
      <table class="cmp">
        <tr><th>Use…</th><th>When</th><th>Trade-off</th></tr>
        <tr>
          <td><strong>Resolver</strong></td>
          <td>Small, fast, must-have data the first paint depends on (the user record for a profile page). You'd rather delay the route than flash an empty shell.</td>
          <td>Blocks navigation; a slow resolver = a frozen click. Keep it fast.</td>
        </tr>
        <tr>
          <td><strong><code>resource()</code></strong> <span class="ok">modern</span></td>
          <td>Data that can stream in after the route shows. Render the shell immediately, load reactively, drive skeletons off <code>isLoading</code>. Re-fetches when its params signal changes.</td>
          <td>You design the loading/empty/error states in the template.</td>
        </tr>
        <tr>
          <td><strong>Guard</strong> (<code>CanActivate</code>)</td>
          <td>Deciding <em>whether</em> the route may activate (auth, feature flag) — not fetching its content.</td>
          <td>Returns boolean / UrlTree / RedirectCommand, not data.</td>
        </tr>
        <tr>
          <td><strong>Component fetch</strong></td>
          <td>Secondary or below-the-fold data, or anything where a spinner is acceptable UX.</td>
          <td>First paint has no data — plan the flicker away with skeletons.</td>
        </tr>
      </table>
      <div class="tip">
        Rule of thumb in the signals era: reach for
        <a routerLink="/resource-api"><code>resource()</code></a> first for responsiveness,
        and keep resolvers for the small, critical, must-be-present-on-first-paint data.
      </div>

      <h2>Static route data</h2>
      <p>
        The <code>data</code> property attaches fixed values to a route — read the exact
        same way as resolved data. Use it for roles, breadcrumbs, feature flags, or
        anything a shared guard/component reads generically:
      </p>
      <div class="code"><pre>{{ staticDataSample }}</pre></div>

      <h2>Titles: the built-in string resolver</h2>
      <p>
        A route's <code>title</code> is really a tiny resolver: give it a string, or a
        <code>ResolveFn&lt;string&gt;</code> for a dynamic one, and the router sets
        <code>document.title</code> for you. Centralise formatting (e.g. append
        "· Angular Concepts") with a custom <code>TitleStrategy</code> — which is exactly
        how this app titles every lesson page:
      </p>
      <div class="code"><pre>{{ titleSample }}</pre></div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Non-completing Observable → hung navigation.</strong> The router waits
          for completion, not the first emission. Pipe <code>first()</code>/<code>take(1)</code>
          onto any long-lived stream you resolve.</li>
        <li><strong>Reading <code>snapshot.data</code> when the route is reused.</strong> On a
          param change with <code>runGuardsAndResolvers</code>, the snapshot is stale —
          subscribe to <code>route.data</code> or bind an <code>input()</code> instead.</li>
        <li><strong>Query-param changes don't re-resolve by default.</strong> Add
          <code>runGuardsAndResolvers: 'paramsOrQueryParamsChange'</code> when
          <code>?page=</code> or <code>?sort=</code> must refetch.</li>
        <li><strong>Heavy resolver = frozen app.</strong> Users perceive the whole app as
          hung during a slow resolver because the URL hasn't changed yet. Prefer
          <code>resource()</code> for anything that can stream in.</li>
        <li><strong>Unhandled resolver error kills the navigation.</strong> It's a
          <code>NavigationError</code>, not a component-level catch — handle it in the
          resolver (redirect / EMPTY / fallback value).</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Your resolver returns <code>store.select(x)</code> and the page never loads. Why?</summary>
        <div>The selector is a long-lived Observable — it emits but never completes, so the
        router waits forever. Add <code>.pipe(first())</code> so it completes after the
        first value.</div>
      </details>
      <details class="qa">
        <summary>Do guards or resolvers run first?</summary>
        <div>Guards. <code>CanDeactivate</code> → <code>CanActivate</code>/<code>CanMatch</code>
        → <strong>resolvers</strong> → activation. Resolvers run only if every guard passed,
        so you never fetch data for a route the user can't enter.</div>
      </details>
      <details class="qa">
        <summary>Navigating <code>/users/7?tab=posts</code> → <code>?tab=likes</code> doesn't refetch. Fix?</summary>
        <div>Only the query param changed, and the default is <code>'paramsChange'</code>.
        Set <code>runGuardsAndResolvers: 'paramsOrQueryParamsChange'</code> on the route.</div>
      </details>
      <details class="qa">
        <summary>Resolver vs <code>resource()</code> — one line?</summary>
        <div>Resolver blocks navigation until small, critical data is ready (no flicker,
        but a slow fetch freezes the click). <code>resource()</code> shows the route now
        and streams data in reactively (responsive, but you design the loading state).</div>
      </details>
      <details class="qa">
        <summary>How do you redirect from a resolver in modern Angular?</summary>
        <div>Return <code>new RedirectCommand(router.parseUrl('/somewhere'))</code>. Pre-17.1
        you injected <code>Router</code>, called <code>navigate()</code>, and returned
        <code>EMPTY</code> to abort the original navigation.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A <code>ResolveFn&lt;T&gt;</code> pre-fetches data before activation, removing the first-paint flicker.</li>
        <li>Resolvers run <em>after</em> guards, in parallel, and block navigation until all complete.</li>
        <li>An Observable resolver must <strong>complete</strong> — pipe <code>first()</code> or the route hangs.</li>
        <li>Read via bound <code>input()</code>s or <code>route.data</code>; avoid stale <code>snapshot.data</code> on reused routes.</li>
        <li><code>runGuardsAndResolvers</code> controls re-fetch on param/query changes; static <code>data</code> and <code>title</code> use the same read path.</li>
        <li>Prefer <code>resource()</code> for anything that can stream in; keep resolvers for small, must-have data.</li>
      </ul>

      <p>
        Drill routing with the <a routerLink="/practice">Routing challenges</a>, compare
        with <a routerLink="/route-guards">Route Guards</a>, then continue to
        <a routerLink="/route-params">Route &amp; Query Parameters →</a>
      </p>
    </article>
  `,
})
export class Resolvers {
  // --- Demo 1: flicker vs resolver ---
  protected readonly panelA = signal<'idle' | 'loading' | 'ready'>('idle');
  protected readonly panelB = signal<'idle' | 'resolving' | 'ready'>('idle');
  private demo1Token = 0;

  protected navigate(): void {
    const token = ++this.demo1Token;
    // No resolver: the route changes now, the component mounts empty and fetches.
    this.panelA.set('loading');
    // Resolver: navigation is pending; the OLD view stays up until data is ready.
    this.panelB.set('resolving');
    setTimeout(() => {
      if (token !== this.demo1Token) return; // a reset (or re-click) superseded us
      this.panelA.set('ready');
      this.panelB.set('ready');
    }, 900);
  }

  protected resetDemo1(): void {
    this.demo1Token++; // invalidate any in-flight timer
    this.panelA.set('idle');
    this.panelB.set('idle');
  }

  // --- Demo 2: an Observable resolver must complete ---
  protected readonly useFirst = signal(false);
  protected readonly demo2 = signal<'idle' | 'pending' | 'done'>('idle');
  private demo2Token = 0;

  protected runResolver2(): void {
    const token = ++this.demo2Token;
    this.demo2.set('pending');
    // With first(), the stream completes → the router unblocks after the value.
    // Without it, the stream emits but never completes → 'pending' stays forever,
    // which is exactly the hung-navigation bug the demo illustrates.
    if (this.useFirst()) {
      setTimeout(() => {
        if (token === this.demo2Token) this.demo2.set('done');
      }, 700);
    }
  }

  protected resetDemo2(): void {
    this.demo2Token++;
    this.demo2.set('idle');
  }

  // --- Code samples (class properties so braces/backticks need no template escaping) ---
  protected readonly resolverSample = `import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export const userResolver: ResolveFn<User> = (route) => {
  const api = inject(UserApi);
  return api.getById(route.paramMap.get('id')!);   // Observable<User>
};

// route:
{ path: 'users/:id', component: UserPage, resolve: { user: userResolver } }`;

  protected readonly pipelineSample = `1. Route matched
2. CanDeactivate  guards on the route being LEFT
3. CanMatch / CanActivate / CanActivateChild guards   ── must all pass ──┐
4. RESOLVERS run (all resolve keys, in parallel)  ◄─── only reached if ──┘
5. Data ready → component activated → NavigationEnd

A guard that returns false / a UrlTree / RedirectCommand
short-circuits here — the resolvers never run.`;

  protected readonly readSample = `// A) component input binding — with withComponentInputBinding()
export class UserPage {
  user = input.required<User>();   // matched by the resolve key name 'user'
}

// B) the data Observable (updates on re-resolve)
private route = inject(ActivatedRoute);
user$ = this.route.data.pipe(map(d => d['user'] as User));

// C) the snapshot (frozen at activation — fine only if the route isn't reused)
user = this.route.snapshot.data['user'] as User;`;

  protected readonly errorSample = `import { ResolveFn, RedirectCommand, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

export const userResolver: ResolveFn<User | RedirectCommand> = (route) => {
  const api = inject(UserApi);
  const router = inject(Router);
  return api.getById(route.paramMap.get('id')!).pipe(
    first(),                                   // complete → don't hang navigation
    catchError(() =>
      of(new RedirectCommand(router.parseUrl('/not-found'))),
    ),
  );
};`;

  protected readonly staticDataSample = `{
  path: 'admin',
  component: Admin,
  canActivate: [roleGuard],
  data: { roles: ['admin'], breadcrumb: 'Administration' },
}

// read it the same way as resolved data:
this.route.snapshot.data['roles'];   // ['admin']
// a shared roleGuard reads route.data['roles'] generically for every route`;

  protected readonly titleSample = `{ path: 'about', component: About, title: 'About us' }              // static
{ path: 'users/:id', component: UserPage, title: userTitleResolver } // ResolveFn<string>

// app-wide formatting via a custom strategy:
@Injectable({ providedIn: 'root' })
export class AppTitle extends TitleStrategy {
  private title = inject(Title);
  override updateTitle(state: RouterStateSnapshot) {
    const t = this.buildTitle(state);
    this.title.setTitle(t ? \`\${t} · Angular Concepts\` : 'Angular Concepts');
  }
}
// provideRouter(routes), { provide: TitleStrategy, useClass: AppTitle }`;
}
