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
  styleUrl: './resolvers.css',
  templateUrl: './resolvers.html',
})
export class Resolvers {
  // --- Demo 1: flicker vs resolver ---
  /**
   * State of the no-resolver panel: it navigates instantly, then sits empty while
   * it fetches.
   */
  protected readonly panelA = signal<'idle' | 'loading' | 'ready'>('idle');
  /**
   * State of the resolver panel: it stays on the old page while resolving, then
   * arrives complete. Same total wait, different place to spend it.
   */
  protected readonly panelB = signal<'idle' | 'resolving' | 'ready'>('idle');
  /**
   * Invalidates in-flight timers when the first demo is reset, so a stale timeout
   * cannot write over a fresh run.
   */
  private demo1Token = 0;

  /**
   * Runs both panels at once, so the two loading experiences are side by side.
   */
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

  /**
   * Resets the first demo.
   */
  protected resetDemo1(): void {
    this.demo1Token++; // invalidate any in-flight timer
    this.panelA.set('idle');
    this.panelB.set('idle');
  }

  // --- Demo 2: an Observable resolver must complete ---
  /**
   * Whether the second demo uses `first()`.
   */
  protected readonly useFirst = signal(false);
  /**
   * State of the second demo's resolver.
   */
  protected readonly demo2 = signal<'idle' | 'pending' | 'done'>('idle');
  /**
   * Invalidation token for the second demo's timers.
   */
  private demo2Token = 0;

  /**
   * Runs the second demo's resolver.
   *
   * The trap: a resolver's observable must **complete**, or the navigation hangs
   * forever with no error and no page change. A stream that emits but never
   * completes — a `BehaviorSubject`, an interval, a socket — leaves the router
   * waiting. `first()` (or `take(1)`) is the fix, and the toggle here is what turns
   * a permanent hang into a resolved navigation.
   */
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

  /**
   * Resets the second demo.
   */
  protected resetDemo2(): void {
    this.demo2Token++;
    this.demo2.set('idle');
  }

  // --- Code samples (class properties so braces/backticks need no template escaping) ---
  /**
   * Sample: a `ResolveFn` — a plain function, injected into, returning the data.
   */
  protected readonly resolverSample = `import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export const userResolver: ResolveFn<User> = (route) => {
  const api = inject(UserApi);
  return api.getById(route.paramMap.get('id')!);   // Observable<User>
};

// route:
{ path: 'users/:id', component: UserPage, resolve: { user: userResolver } }`;

  /**
   * Sample: where resolvers sit in the navigation pipeline. Notably *after* the
   * guards, so a resolver never fetches for a route the user cannot reach.
   */
  protected readonly pipelineSample = `1. Route matched
2. CanDeactivate  guards on the route being LEFT
3. CanMatch / CanActivate / CanActivateChild guards   ── must all pass ──┐
4. RESOLVERS run (all resolve keys, in parallel)  ◄─── only reached if ──┘
5. Data ready → component activated → NavigationEnd

A guard that returns false / a UrlTree / RedirectCommand
short-circuits here — the resolvers never run.`;

  /**
   * Sample: the two ways to read resolved data — bound to an `input()` via
   * `withComponentInputBinding`, or off `ActivatedRoute`'s `data`.
   */
  protected readonly readSample = `// A) component input binding — with withComponentInputBinding()
export class UserPage {
  user = input.required<User>();   // matched by the resolve key name 'user'
}

// B) the data Observable (updates on re-resolve)
private route = inject(ActivatedRoute);
user$ = this.route.data.pipe(map(d => d['user'] as User));

// C) the snapshot (frozen at activation — fine only if the route isn't reused)
user = this.route.snapshot.data['user'] as User;`;

  /**
   * Sample: handling a failed resolve. Returning `RedirectCommand` sends the user
   * somewhere useful; letting the error escape just cancels the navigation and
   * leaves them where they were with no explanation.
   */
  protected readonly errorSample = `import { ResolveFn, RedirectCommand, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

// The return type is a UNION: either the data, or an instruction to go
// somewhere else. That union is the whole pattern.
export const userResolver: ResolveFn<User | RedirectCommand> = (route) => {
  // Both injected in the resolver body — this is the injection context.
  const api = inject(UserApi);
  const router = inject(Router);
  // route.paramMap.get('id') returns string | null; the ! asserts it exists,
  // which is safe because the route pattern declares :id.
  return api.getById(route.paramMap.get('id')!).pipe(
    // ESSENTIAL. The router waits for the observable to COMPLETE, not just
    // emit. A stream that emits and stays open freezes navigation on a blank
    // screen with no error. first() completes after the first value.
    first(),                                   // complete → don't hang navigation
    catchError(() =>
      // RETURNING a RedirectCommand beats calling router.navigate() here: it
      // is one atomic decision the router acts on, so there is no half-loaded
      // route and no competing navigation.
      // parseUrl turns the string into the UrlTree the command expects.
      of(new RedirectCommand(router.parseUrl('/not-found'))),
    ),
  );
};`;

  /**
   * Sample: static `data` on a route — the same reading mechanism without a
   * resolver, for values known at build time.
   */
  protected readonly staticDataSample = `{
  path: 'admin',
  component: Admin,
  canActivate: [roleGuard],
  data: { roles: ['admin'], breadcrumb: 'Administration' },
}

// read it the same way as resolved data:
this.route.snapshot.data['roles'];   // ['admin']
// a shared roleGuard reads route.data['roles'] generically for every route`;

  /**
   * Sample: `title`, which is a resolver slot of its own — a string or a
   * `ResolveFn<string>`.
   */
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
