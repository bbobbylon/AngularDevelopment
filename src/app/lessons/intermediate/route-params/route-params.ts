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
  templateUrl: './route-params.html',
  styleUrl: './route-params.css',
})
export class RouteParams {
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
