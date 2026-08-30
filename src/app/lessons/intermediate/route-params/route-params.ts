import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/** One parsed row in the URL playground. */
interface ParsedEntry {
  key: string;
  value: string;
}

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
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './route-params.html',
  styleUrl: './route-params.css',
})
export class RouteParams {
  /**
   * Why a component survives a parameter change. Drawn out because the staleness
   * bug is not really about `snapshot` — it is about this reuse decision, and once
   * you can see where it happens the bug stops being surprising.
   */
  protected readonly reuse = [
    { label: 'URL changes', detail: '`/users/1` → `/users/2`' },
    {
      label: 'Router resolves a new snapshot tree',
      detail: 'A fresh `ActivatedRouteSnapshot` for the whole tree',
    },
    {
      label: 'Diff against the current tree',
      detail: 'Same route *config*? Then reuse — param values are not consulted',
      tone: 'accent' as const,
    },
    {
      label: 'The node is kept',
      detail: 'No `ngOnDestroy`, no `ngOnInit`, same component instance',
    },
    {
      label: 'New params pushed onto it',
      detail: '`paramMap` emits. Anything you copied out earlier does not',
      tone: 'warn' as const,
    },
  ];

  /** The `queryParamsHandling` default, posed before the table that explains it. */
  protected readonly handlingTrap = `// Current URL:
//   /search?q=hello&sort=name&view=grid

// The user clicks "next page":
this.router.navigate([], { queryParams: { page: 2 } });

// What is the URL now?`;

  /** Choices for the string-coercion check. */
  protected readonly coercionOptions = [
    {
      text: '`NaN`, so the `isNaN` guard catches it',
      why: 'That would be the merciful outcome, and it is what people assume by analogy with `Number(undefined)`. But `paramMap.get` returns `null` for a missing key, not `undefined`, and the two coerce differently.',
    },
    {
      text: '`0` — and the guard passes',
      correct: true,
      why: '`Number(null)` is `0`. The guard sees a perfectly good number and lets it through, so you go and fetch user 0, or index 0, or whatever a zero means in your domain. This is the exact shape of bug that reaches production: a missing parameter silently becomes a valid-looking one. Check for `null` *before* converting, or use `Number(id ?? NaN)`.',
    },
    {
      text: '`undefined`, because the key is absent',
      why: '`ParamMap.get` is specified to return `string | null` — it normalises a missing key to `null` rather than `undefined`, precisely so the return type is a two-case union. Which is what makes the coercion trap possible.',
    },
    {
      text: 'A runtime error — you cannot convert `null`',
      why: '`Number` never throws on `null`; it is defined to produce `0`. Only `BigInt(null)` and a few similar conversions throw. The silence is the whole problem.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'When is `snapshot` actually fine?',
      a: 'When the route can never re-navigate to itself with different params — a detail page reached only from a list, and never from a link on the page itself. The trouble is that this is a property of your *whole app\'s* linking, not of the component, so it stops being true the day someone adds a "next record" button. The reactive read costs one `toSignal` and is never wrong, which is why it is the default advice.',
    },
    {
      q: 'Path param or query param — how do I choose?',
      a: 'Ask whether it identifies the thing or describes how you are looking at it. `/users/42` is a different resource; `/users?sort=name` is the same resource sorted differently. A good tell: if removing it leaves a URL that still makes sense, it is a query param. Another: path params are required by the route definition, query params never are.',
    },
    {
      q: 'Does changing a query param re-run my guards and resolvers?',
      a: "Not by default. The router only re-runs them when the path match changes, because that is what `runGuardsAndResolvers: 'paramsOrQueryParamsChange'` exists to override. So a resolver that loads data based on `?sort=` will not fire on a sort change unless you ask it to — which is either a performance feature or a bug, depending on what you meant.",
    },
    {
      q: 'Is `withComponentInputBinding()` strictly better than injecting `ActivatedRoute`?',
      a: 'Usually, and it makes the component testable without a router at all — you just set the inputs. Two caveats. It binds path params, query params *and* resolved data into one namespace, so an `:id` path param and an `?id=` query param fight over the same input and only one wins. And you still get strings, so the conversion problem does not go away.',
    },
    {
      q: 'What are matrix params, and should I use them?',
      a: 'They are params attached to a single URL segment — `/users;view=grid/7` — rather than to the whole URL, and they arrive in `paramMap` alongside path params. The appeal is scoping: state that belongs to one segment of a nested route does not leak into siblings. In practice they are rare, unfamiliar to most teams, and awkward to hand-write, so query params are the pragmatic default unless you have a genuine scoping problem.',
    },
  ];

  /**
   * The URL being dissected in the playground. Seeded with one of everything — a
   * path param, a matrix param, a repeated query key and a fragment — because the
   * point of the demo is that these are four different mechanisms that a URL
   * carries at once, and people routinely conflate them.
   */
  protected readonly playgroundUrl = signal('/users/42;view=grid?tag=ng&tag=rxjs&sort=name#bio');

  /** The path portion, before any `?` or `#`. */
  private readonly pathPart = computed(() => this.playgroundUrl().split('#')[0].split('?')[0]);

  /** Path segments with their matrix params stripped off. */
  protected readonly segments = computed(() =>
    this.pathPart()
      .split('/')
      .filter(Boolean)
      .map((s) => s.split(';')[0]),
  );

  /**
   * Matrix params, flattened across every segment. Flattened because that is how
   * `paramMap` presents them — which is itself a small surprise worth showing.
   */
  protected readonly matrixParams = computed<ParsedEntry[]>(() =>
    this.pathPart()
      .split('/')
      .filter(Boolean)
      .flatMap((seg) => seg.split(';').slice(1))
      .filter(Boolean)
      .map((pair) => {
        const [key, value = ''] = pair.split('=');
        return { key, value };
      }),
  );

  /**
   * Query params in the order they appear, keeping duplicates — the duplicates are
   * the point, since they are what `getAll` exists for.
   */
  protected readonly queryParams = computed<ParsedEntry[]>(() => {
    const q = this.playgroundUrl().split('#')[0].split('?')[1];
    if (!q) return [];
    return q
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [key, value = ''] = pair.split('=');
        return { key, value };
      });
  });

  /** Keys that appear more than once, so the demo can point at `get` vs `getAll`. */
  protected readonly repeatedKeys = computed(() => {
    const seen = new Map<string, number>();
    for (const { key } of this.queryParams()) seen.set(key, (seen.get(key) ?? 0) + 1);
    return [...seen].filter(([, n]) => n > 1).map(([key]) => key);
  });

  /** The `#fragment`, which never leaves the browser. */
  protected readonly fragment = computed(() => this.playgroundUrl().split('#')[1] ?? null);

  /**
   * This page's own route, so the demos read real parameters off the real URL.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * The `theme` query parameter, as a signal. Reactive: it tracks the URL.
   */
  protected readonly theme = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('theme'))));
  /**
   * The `sort` query parameter, as a signal.
   */
  protected readonly sort = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('sort'))));

  // Read once, at construction — deliberately NOT reactive, to demonstrate the staleness trap.
  /**
   * The same `theme` value read once from `snapshot`, at construction.
   *
   * Deliberately not reactive, and deliberately shown next to {@link theme}: when
   * the router reuses a component instance across a parameter change — which it
   * does by default for a same-route navigation — the snapshot keeps its original
   * value while the observable updates. That divergence is the staleness trap.
   */
  protected readonly snapshotTheme = this.route.snapshot.queryParamMap.get('theme') ?? '(none)';

  /**
   * Sample: declaring a parameterised route and reading it back.
   */
  protected readonly readSample = `{ path: 'users/:id', component: UserPage }
<a [routerLink]="['/users', user.id]">View</a>

// in the component:
private route = inject(ActivatedRoute);

// reactive (preferred — survives same-component navigation):
id = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

// snapshot (one-time read — goes stale if the route is reused):
const id = this.route.snapshot.paramMap.get('id');`;

  /**
   * Sample: `queryParamsHandling`, and what `merge` against `preserve` does to the
   * existing parameters.
   */
  protected readonly handlingSample = `<a [routerLink]="['/search']"
   [queryParams]="{ q: 'angular', page: 2 }"
   queryParamsHandling="merge"
   fragment="results">Search</a>

// remove a param while merging: set it to null
router.navigate([], { queryParams: { page: null }, queryParamsHandling: 'merge' });`;

  /**
   * Sample: repeated keys and `getAll`, since a query string can carry a list.
   */
  protected readonly arraysSample = `// repeated key → array
// URL:  /list?tag=ng&tag=rxjs
route.snapshot.queryParamMap.getAll('tag');   // ['ng', 'rxjs']
route.snapshot.queryParamMap.get('tag');      // 'ng'  (first only)

// fragment (the #hash)
route.fragment;                               // Observable<string | null>

// matrix params — scoped to one segment: /users;view=grid;page=2
route.snapshot.paramMap.get('view');          // 'grid'`;

  /**
   * Sample: `withComponentInputBinding`, which binds path parameters, query
   * parameters and resolved data straight to `input()`s by name — no
   * `ActivatedRoute` in the component at all.
   */
  protected readonly inputSample = `provideRouter(routes, withComponentInputBinding());

// path params, query params AND resolved data bind to inputs by name:
id   = input<string>();     // from /users/:id
q    = input<string>();     // from ?q=...
user = input<User>();       // from a resolver keyed 'user'`;
}
