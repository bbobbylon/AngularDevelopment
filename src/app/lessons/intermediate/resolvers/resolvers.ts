import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
  TapeCard,
} from '../../../shared/brain';
import {
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: route resolvers — fetching data BEFORE a route activates, so the component
 * never renders in a loading state.
 *
 * Covers the functional `ResolveFn` contract; where a resolver sits in the navigation
 * pipeline (strictly after every guard, and run in parallel with every other resolve
 * key on the route); the one rule that traps almost everyone — an Observable resolver
 * must COMPLETE, not just emit, or navigation hangs forever with nothing in the
 * console; the different failure mode of an error (an immediate, loud
 * `NavigationError` instead of a silent hang); reading resolved data three ways (bound
 * `input()`, the `data` observable, the `snapshot`); `runGuardsAndResolvers` re-run
 * modes; static route `data` and the `title` resolver slot; and when `resource()` is
 * the better tool entirely.
 *
 * ## Presentation
 *
 * Teaching order follows `expert/change-detection`, the reference implementation of
 * the brain-friendly layer: pose the problem before naming it, hand the reader an
 * analogy to hang the vocabulary on, then teach the one mechanism that trips people up
 * — a resolver's promise to *complete* before the router acts on it — four different
 * ways: a dialogue between the router and the resolver, a paired before/after
 * timeline, an annotated dump of the functional contract, and two live demos the
 * reader drives.
 *
 * @see intermediate/route-guards — the checkpoint line a navigation clears just before
 *   it ever reaches a resolver. Its analogy (an airport security line) is deliberately
 *   a different frame from this lesson's restaurant one, so the two lessons reinforce
 *   each other instead of repeating the same picture.
 */
@Component({
  selector: 'app-lesson-resolvers',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
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

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Routing track, reusing `route-guards`' stop list so the rail stays consistent. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Child Routes & Lazy', id: 'router-children-lazy' },
    { label: 'Route Guards', id: 'route-guards' },
    { label: 'Resolvers' },
    { label: 'Route Params', id: 'route-params' },
    { label: 'Navigation Events', id: 'router-events' },
  ];

  /**
   * One navigation, told from the moment guards pass to the moment the component
   * activates — with the resolver as a named party in the conversation.
   *
   * This exists because the fact learners get backwards is not ordering (the guards
   * lesson covers that) but WHAT is actually being awaited: they picture the router
   * "waiting for data" in the abstract, when what it is actually doing is waiting for
   * one specific signal — completion — that has nothing to do with whether a value
   * showed up.
   */
  protected readonly resolverTalk: BubbleTurn[] = [
    {
      who: 'Router',
      says: 'Every guard on `/users/7` passed. Before I create `UserPage` — does anyone need data first?',
    },
    {
      who: 'Resolver (key: user)',
      says: "I do. Give me a moment — I'm calling the API.",
    },
    {
      who: 'Router',
      says: "Take your time. The OLD view stays exactly where it is until you're done — nobody sees a gap.",
    },
    {
      who: 'Resolver (key: user)',
      says: "Done. And I **completed**, not just emitted — here's your `User` object.",
    },
    {
      who: 'Router',
      says: 'Completed is the word I was waiting for. Creating `UserPage` now, with `user` already attached.',
    },
  ];

  /**
   * Sample: a `ResolveFn` — a plain function, injected into, returning the data.
   */
  protected readonly resolverSample = `import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export const userResolver: ResolveFn<User> = (route) => {
  const api = inject(UserApi);
  return api.getById(route.paramMap.get('id')!); // Observable<User>
};

// route:
{ path: 'users/:id', component: UserPage, resolve: { user: userResolver } }`;

  /** Line-by-line walkthrough of {@link resolverSample}. */
  protected readonly resolverNotes: CodeNote[] = [
    {
      line: 1,
      text: '`ResolveFn<T>` is a type, not a base class — a resolver is a plain arrow function typed against it, exactly like the `CanActivateFn` guards from the previous lesson. No `@Injectable`, no lifecycle to implement.',
    },
    {
      line: 4,
      text: '`route` is the `ActivatedRouteSnapshot` for the route being entered — the same object a guard receives. The generic `<User>` is a promise: this key will produce a `User`, or the router (and TypeScript) will complain.',
    },
    {
      line: 5,
      text: '`inject()` works here for the same reason it works inside a guard: the router opens a synchronous injection context just for this one call, then closes it the moment the function returns.',
    },
    {
      line: 6,
      text: 'Returns an `Observable<User>`, **not** a `User`. The router will wait for whatever asynchronous vessel a resolver hands back — but only on one condition, which is the whole of the next section.',
    },
    {
      line: 10,
      text: '`resolve` is a map from a name you invent — `user` — to the resolver that fills it. That same string is the key you read the data back out with later, and — with component input binding on — the exact name an `input()` must match.',
    },
  ];

  /**
   * Sample: how a component actually receives what a resolver produced — three ways,
   * each with a different lifetime.
   */
  protected readonly readSample = `// A) component input binding — with withComponentInputBinding()
export class UserPage {
  user = input.required<User>(); // matched by the resolve key name 'user'
}

// B) the data Observable (updates on re-resolve)
private route = inject(ActivatedRoute);
user$ = this.route.data.pipe(map(d => d['user'] as User));

// C) the snapshot (frozen at activation — fine only if the route isn't reused)
user = this.route.snapshot.data['user'] as User;`;

  /** Line-by-line walkthrough of {@link readSample}. */
  protected readonly readNotes: CodeNote[] = [
    {
      line: 3,
      text: "`input.required<User>()` reads a value straight off the route — no `ActivatedRoute`, no subscription. The magic is entirely in the resolve **key's name** matching this property's name: `user` to `user`.",
    },
    {
      line: 7,
      text: '`inject(ActivatedRoute)` gets the handle every pre-signals reading style is built on — still the right choice when you specifically need the **observable**, not just the value it holds right now.',
    },
    {
      line: 8,
      text: '`route.data` emits again every time the route re-resolves, so a component that **stays mounted** across a param change (see `runGuardsAndResolvers` below) sees fresh data arrive here.',
    },
    {
      line: 11,
      text: '`snapshot` is a plain object, frozen the instant the route activated. Reading it once at construction is never wrong — **until** the same component instance is reused for a new param, at which point it is silently stale.',
    },
  ];

  /**
   * Sample: handling a failed resolve. Returning `RedirectCommand` sends the user
   * somewhere useful; letting the error escape just cancels the navigation and
   * leaves them where they were with no explanation.
   */
  protected readonly errorSample = `import { ResolveFn, RedirectCommand, Router } from '@angular/router';
import { catchError, first, of } from 'rxjs';

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
    first(), // complete → don't hang navigation
    catchError(() =>
      // RETURNING a RedirectCommand beats calling router.navigate() here: it
      // is one atomic decision the router acts on, so there is no half-loaded
      // route and no competing navigation.
      // parseUrl turns the string into the UrlTree the command expects.
      of(new RedirectCommand(router.parseUrl('/not-found'))),
    ),
  );
};`;

  /** Line-by-line walkthrough of {@link errorSample}. */
  protected readonly errorNotes: CodeNote[] = [
    {
      line: 6,
      text: 'The return type is a **union**: `ResolveFn<User | RedirectCommand>` — either the real data, or an instruction telling the router to go somewhere else instead. Both are legal because the router inspects what actually comes back and acts on it.',
    },
    {
      line: 9,
      text: '`Router` is injected in the **same synchronous window** as `api` — `inject()` only works before the first `await`/`.then()`, exactly the rule guards live by.',
    },
    {
      line: 12,
      text: '`.pipe()` is where the raw HTTP stream picks up the two operators this resolver actually needs: one that guarantees completion, and one that catches failure. Order matters — completion first, then error handling.',
    },
    {
      line: 16,
      text: '`first()` is not decoration. An `HttpClient` call already completes on its own, so this line changes nothing for THIS resolver — it earns its keep the day your data source is something else (a store selector, a `Subject`) that would not have completed without it.',
    },
    {
      line: 22,
      text: "`of(new RedirectCommand(...))` turns a caught error into a **new resolved value**: a redirect. The router treats this exactly like a guard's redirect — one atomic decision, nothing left to race.",
    },
  ];

  /**
   * The two flows that make the flicker problem visible as a picture: same total
   * wait, spent in a different place.
   */
  protected readonly noResolverFlow: FlowStep[] = [
    {
      label: 'Navigate',
      detail: 'The URL changes immediately — the old view is already gone.',
      tone: 'warn',
    },
    {
      label: 'Render, empty',
      detail: '`ngOnInit` fires with nothing to show yet — a spinner, or a blank shell.',
      tone: 'warn',
    },
    {
      label: 'Fetch',
      detail:
        'The HTTP call starts only **now** — the wait begins after the route already changed.',
    },
    {
      label: 'Re-render',
      detail: 'Data arrives; the component paints a second time.',
      tone: 'good',
    },
  ];

  /** The resolver's version of the same navigation. */
  protected readonly resolverFlow: FlowStep[] = [
    {
      label: 'Fetch',
      detail: 'The resolver calls the API before the navigation is committed to anything.',
    },
    {
      label: 'Old view holds',
      detail: 'Nothing changes on screen yet — this is the entire trick.',
      tone: 'accent',
    },
    {
      label: 'Navigate + render, together',
      detail:
        'The component is created already holding its data — one paint, and it is the right one.',
      tone: 'good',
    },
  ];

  /**
   * The self-test: whether wrapping a non-completing resolver in `catchError` alone
   * is enough to unblock navigation.
   *
   * The distractors are the real misconceptions this trap produces — that any RxJS
   * error handling implies completion, that the fix is a one-time exemption, and that
   * the failure surfaces as a change-detection error instead of a silent hang.
   */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'Yes — wrapping the resolver in `catchError` guarantees the stream finishes, one way or another.',
      why: '`catchError` only intervenes when the source **errors**. A stream that neither errors nor completes never reaches it at all — the callback sits there unused while the underlying stream just keeps running.',
    },
    {
      text: "No — the underlying stream still never completes, so navigation still hangs. `catchError`'s callback never runs, because nothing here failed.",
      correct: true,
      why: 'Exactly. `catchError` and `first()` guard two **completely different** failure modes — one against an error, one against a stream that simply never finishes. Fixing one does nothing for the other; this resolver still needs `first()` on top of the `catchError` it already has.',
    },
    {
      text: 'Yes, but only on the first navigation — every navigation after that hangs again.',
      why: "There's no such one-time exemption. The router re-subscribes to the resolver fresh on every navigation that reaches it, and gets the identical non-completing stream every single time.",
    },
    {
      text: "No — it throws NG0100, because the resolver's stream produced two different values in the same pass.",
      why: 'NG0100 is a change-detection error, thrown when a **template binding** disagrees with itself mid-pass. Nothing has rendered yet at this point in a navigation — there is no view to disagree with, so there is nothing for NG0100 to catch.',
    },
  ];

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
this.route.snapshot.data['roles']; // ['admin']
// a shared roleGuard reads route.data['roles'] generically for every route`;

  /** Line-by-line walkthrough of {@link staticDataSample}. */
  protected readonly staticDataNotes: CodeNote[] = [
    {
      line: 5,
      text: '`data` is fixed at compile time — no resolver, no fetch, just values you already know. It sits in the exact same slot resolved data does, which is why the read path below is identical.',
    },
    {
      line: 9,
      text: 'Read through `snapshot.data` (or the observable `route.data`) exactly as you would resolved data — nothing downstream needs to know whether a value was computed or hard-coded.',
    },
    {
      line: 10,
      text: "The payoff: one generic `roleGuard` can read `route.data['roles']` on every route that sets it, rather than a bespoke guard per section.",
    },
  ];

  /**
   * Sample: `title`, which is a resolver slot of its own — a string or a
   * `ResolveFn<string>`.
   */
  protected readonly titleSample = `{ path: 'about', component: About, title: 'About us' }              // static
{ path: 'users/:id', component: UserPage, title: userTitleResolver } // ResolveFn<string>

@Injectable({ providedIn: 'root' })
export class AppTitle extends TitleStrategy {
  private title = inject(Title);
  override updateTitle(state: RouterStateSnapshot) {
    const t = this.buildTitle(state);
    this.title.setTitle(t ? \`\${t} · Angular Concepts\` : 'Angular Concepts');
  }
}

// provideRouter(routes), { provide: TitleStrategy, useClass: AppTitle }`;

  /** Line-by-line walkthrough of {@link titleSample}. */
  protected readonly titleNotes: CodeNote[] = [
    {
      line: 1,
      text: '`title` takes a plain string when the value never changes — the simplest resolver slot there is.',
    },
    {
      line: 2,
      text: 'Or a `ResolveFn<string>` — the exact same contract as any other resolver, just constrained to return a string. The router calls it and sets `document.title` with whatever comes back.',
    },
    {
      line: 5,
      text: "`extends TitleStrategy` — Angular's own hook for centralising exactly this kind of formatting, so no individual route has to remember to append the suffix itself.",
    },
    {
      line: 8,
      text: "`buildTitle(state)` is the base class's own logic for walking the matched route tree and picking a title — reused here rather than reimplemented.",
    },
    {
      line: 9,
      text: 'Every title in the app funnels through this one line — change the suffix once, and every route, present and future, picks it up.',
    },
  ];

  /**
   * Sample: the app-level net — `withNavigationErrorHandler` — for whatever a
   * per-resolver `catchError` didn't anticipate.
   */
  protected readonly appLevelNetSample = `// bootstrapApplication(..., { providers: [
provideRouter(
  routes,
  withNavigationErrorHandler((event) => {
    // event.error is whatever escaped every per-resolver catchError —
    // including a lazy-chunk failure, not just a resolver's own mistake.
    const router = inject(Router);
    return new RedirectCommand(router.parseUrl('/error'));
  }),
),
// ] })`;

  /** Line-by-line walkthrough of {@link appLevelNetSample}. */
  protected readonly appLevelNetNotes: CodeNote[] = [
    {
      line: 3,
      text: '`withNavigationErrorHandler` is a router feature, added to `provideRouter` once for the whole app — not per-route, not per-resolver. It runs for **any** navigation error that reaches it, from any route.',
    },
    {
      line: 6,
      text: 'The callback runs inside a synchronous injection context, exactly like a resolver or a guard — `inject()` is legal here for that reason, not because this is a special case.',
    },
    {
      line: 7,
      text: "Returning a `RedirectCommand` here works exactly like returning one from a resolver's `catchError` — the router treats it as the navigation's new destination, one atomic decision instead of a dangling failed navigation.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "The resolver already fetched everything — so why does my component still need `input.required<User>()`? Isn't that redoing the same job?",
      a: "It's not fetching anything a second time — `input.required<User>()` is just how the component RECEIVES what the resolver already produced. The `required` part does real work too: Angular enforces that this input has a value before the component ever renders, so there's no `undefined` state to guard against, unlike after a component-level fetch.",
    },
    {
      q: 'Two resolvers on the same route — do they run one after another, or together?',
      a: 'Together. Every `resolve` key on the matched route (and its resolved parent routes) fires in parallel, and navigation waits for ALL of them to settle. That also means the route is only as fast as its SLOWEST resolver — one expensive key holds up every other key on the same navigation.',
    },
    {
      q: "I clicked the exact link I'm already on. Does the resolver run again?",
      a: "Not by default — Angular treats a navigation to the same URL as a no-op, so nothing re-resolves and nothing re-renders. Combine `runGuardsAndResolvers: 'always'` with `onSameUrlNavigation: 'reload'` on the route if you actually want a \"refresh\" click to refetch.",
    },
    {
      q: 'Can a resolver redirect somewhere else entirely, with no real data at all?',
      a: "Yes — return a `UrlTree`/`RedirectCommand` straight away and skip the data question completely. This is genuinely useful when the redirect DECISION itself needs data a synchronous guard can't get to in time — check whether an account finished onboarding, say, then send them to setup instead of the dashboard.",
    },
    {
      q: 'My resolver calls an endpoint that, realistically, always succeeds. Do I still need `catchError`?',
      a: "Yes. \"Always succeeds\" is a claim about today's network, today's token, today's server — not a guarantee. An uncaught error becomes a `NavigationError` that stops the user dead with nothing on screen and nothing in the URL bar. A `catchError` that redirects to a friendly fallback costs one line and turns a dead end into a page.",
    },
  ];
}
