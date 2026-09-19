import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

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
 *
 * ## Shape: `whiteboard`
 *
 * The lesson opens on one big figure: the four kinds of parameter drawn as
 * four boxes, with arrows showing which three ride in the actual HTTP
 * request and which one — the fragment — the browser strips off before the
 * request ever leaves. `app-brain-power` asks which piece gets stripped,
 * posed before the reader sees the figure; three `app-scribble`s quote the
 * figure's own labels, including the correction that "never leaves the
 * browser" describes the network boundary, not what Angular code itself can
 * see; a `.bf-answer` paragraph resolves the open question outright.
 * `app-flow` restates the same four mechanisms as a numbered sequence, a
 * quiz checks the guard/fragment nuance directly, and the block closes on
 * `app-napkin` with the postal-address analogy. See
 * `docs/CONTRIBUTING.md` §2C.
 *
 * ## Presentation
 *
 * After the shape block, "the mental model, in full" replays the
 * postal-address analogy at full length, then the rest of the page carries
 * on in the order it always did, following the teaching order recorded on
 * the reference implementation, `lessons/expert/change-detection/`:
 *
 * 1. **Analogy, restaged.** The postal-address frame — street address,
 *    delivery instructions, "once you're inside go to the kitchen", a note
 *    stapled to one line of the address — gives path/query/fragment/matrix
 *    somewhere to live before the router vocabulary has to carry any weight
 *    on its own.
 * 2. **Then the same idea in four modes.** Prose, a four-card visual restating
 *    the analogy, the URL-dissector live demo (unchanged from the pre-migration
 *    lesson — this is the load-bearing teaching device the migration was asked
 *    to preserve), and an annotated `app-code-lab` reading the same four things
 *    off a real `ActivatedRoute`.
 * 3. **The reuse trap gets its own two modes.** A `Bubbles` dialogue between the
 *    router, the component, the snapshot and the observable stages the same
 *    mechanism an `app-flow` diagram lays out as steps — dialogue for the
 *    *why*, steps for the *sequence*.
 *
 * ## The URL dissector
 *
 * `playgroundUrl` down to `fragment` below is the interactive demo this
 * migration was told to preserve exactly: a live URL split into path segments,
 * matrix params, query params (with repeated-key detection, since that is what
 * `getAll` exists for) and the fragment. Every piece of its reactive state is a
 * `signal`/`computed` — required for template binding under zoneless change
 * detection, and also what makes the demo genuinely live rather than a static
 * illustration.
 */
@Component({
  selector: 'app-lesson-route-params',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    BrainPower,
    Scribble,
    Whiteboard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './route-params.html',
  styleUrl: './route-params.css',
})
export class RouteParams {
  /**
   * The shape block's quiz: whether client-side Angular code (a guard) can
   * read the fragment even though the fragment never reaches the server —
   * the distinction most people get backwards.
   */
  protected readonly fragmentQuizOptions: QuizOption[] = [
    {
      text: "No — a guard runs IN the browser, the same place the fragment already lives. It reads it straight off the route snapshot's `fragment` property, same as any component would.",
      correct: true,
      why: '"Never leaves the browser" is a statement about the network — it describes what the server, an interceptor or a backend log can see. A guard is Angular code running client-side, not a network boundary, so nothing stops it from reading `route.fragment` directly.',
    },
    {
      text: "Yes — 'never leaves the browser' means no Angular code can see it, guard included.",
      why: "This is the exact misconception the phrase invites. 'Never leaves the browser' describes the HTTP request, not the reach of client-side JavaScript. A guard, a resolver, a component — anything running in the app itself — is on the same side of that boundary as the fragment.",
    },
    {
      text: 'Only if the guard is asynchronous and awaits the navigation first.',
      why: "Sync or async makes no difference here — `route.fragment` is a plain property on the snapshot either way. Awaiting something doesn't cross the boundary that actually matters, which is client-side code versus an HTTP request.",
    },
    {
      text: 'Only on the very first navigation, before Angular has taken over routing.',
      why: "Backwards, if anything — Angular's router (and therefore any guard) only runs once Angular has taken over. The fragment is available to a guard on every navigation the router itself handles, first or not.",
    },
  ];

  /** The Routing stretch of the Intermediate track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Child Routes & Lazy Loading', id: 'router-children-lazy' },
    { label: 'Route Guards', id: 'route-guards' },
    { label: 'Resolvers', id: 'resolvers' },
    { label: 'Route Params' },
    { label: 'Navigation Events', id: 'router-events' },
    { label: 'HTTP CRUD', id: 'http-crud' },
  ];

  /**
   * The reuse mechanism, staged as a conversation. This is the two/three-party
   * relationship learners reliably get backwards: they assume the *snapshot*
   * is what goes stale, when really the router's reuse decision is what
   * creates the conditions for staleness in the first place — the snapshot is
   * just the object that is unlucky enough to have been read too early.
   */
  protected readonly reuseTalk: BubbleTurn[] = [
    {
      who: 'The component',
      says: 'The URL just went from `/users/1` to `/users/2`. Are you destroying me and building a new one?',
    },
    {
      who: 'The router',
      says: "Depends. Same route *config* both times — same path template, `users/:id` — so no. I'm keeping you.",
    },
    {
      who: 'The component',
      says: "But the id changed. Doesn't that count for anything?",
    },
    {
      who: 'The router',
      says: 'Not to me. My reuse strategy checks the config, not the param values. I just push the new params onto you and move on.',
    },
    {
      who: 'The snapshot',
      says: 'Which is bad news for me — I already read the old id once, at construction, and nobody is telling me to read it again.',
    },
    {
      who: 'The observable',
      says: "I don't have that problem. I'm still subscribed. New params arrive, I re-emit, and whoever reads me sees `2` a moment later.",
    },
  ];

  /**
   * Why a component survives a parameter change, as a sequence of steps —
   * the same mechanism as {@link reuseTalk}, in a different mode. Drawn out
   * because the staleness bug is not really about `snapshot` — it is about
   * this reuse decision, and once you can see where it happens the bug stops
   * being surprising.
   */
  protected readonly reuse: FlowStep[] = [
    { label: 'URL changes', detail: '`/users/1` → `/users/2`' },
    {
      label: 'Router resolves a new snapshot tree',
      detail: 'A fresh `ActivatedRouteSnapshot` for the whole tree',
    },
    {
      label: 'Diff against the current tree',
      detail: 'Same route *config*? Then reuse — param values are not consulted',
      tone: 'accent',
    },
    {
      label: 'The node is kept',
      detail: 'No `ngOnDestroy`, no `ngOnInit`, same component instance',
    },
    {
      label: 'New params pushed onto it',
      detail: '`paramMap` emits. Anything you copied out earlier does not',
      tone: 'warn',
    },
  ];

  /** The `queryParamsHandling` default, posed before the table that explains it. */
  protected readonly handlingTrap = `// Current URL:
//   /search?q=hello&sort=name&view=grid

// The user clicks "next page":
this.router.navigate([], { queryParams: { page: 2 } });

// What is the URL now?`;

  /** Choices for the string-coercion check. */
  protected readonly coercionOptions: QuizOption[] = [
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
  protected readonly questions: FaqItem[] = [
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

  // ── The URL dissector (preserve exactly — see class JSDoc) ─────────────────

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

  // ── Code samples ────────────────────────────────────────────────────────────

  /**
   * Sample: declaring a parameterised route and reading it back, snapshot next
   * to reactive so the divergence is visible in one block.
   */
  protected readonly readSample = `{ path: 'users/:id', component: UserPage }
<a [routerLink]="['/users', user.id]">View</a>

// in the component:
private route = inject(ActivatedRoute);

// reactive (preferred — survives same-component navigation):
id = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));

// snapshot (one-time read — goes stale if the route is reused):
const id = this.route.snapshot.paramMap.get('id');`;

  /** Line-by-line walkthrough of {@link readSample}. */
  protected readonly readNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A route config, not a component. `:id` is a **path param placeholder** — it matches any single segment (`/users/42`, `/users/abc`, anything) and whatever matched is handed back as a string under the key `id`. `component` says what mounts when this path matches.',
    },
    {
      line: 2,
      text: "`[routerLink]=\"['/users', user.id]\"` builds the path by handing the router an array of segments instead of a hand-written string. The router joins them with `/` — `['/users', 42]` becomes `/users/42` — so you never `+`-concatenate a URL yourself.",
    },
    {
      line: 5,
      text: "`inject(ActivatedRoute)` is the modern, function-based way to ask the DI system for this component's own activated route — the object holding everything the router matched to get here. `private` because nothing outside this class needs it directly.",
    },
    {
      line: 8,
      text: "`toSignal(...)` turns an RxJS Observable into a signal a template can read with `id()`. `.pipe(map(p => p.get('id')))` runs on every emission: `p` is a `ParamMap`, and `.get('id')` pulls out the string (or `null` if it is missing). Because `paramMap` is an Observable on the *same* `ActivatedRoute` the router reuses, this keeps re-emitting on every later navigation — no re-subscribe needed.",
    },
    {
      line: 11,
      text: "`route.snapshot` is a frozen picture of the route **at the moment this line ran** — usually once, in a constructor or `ngOnInit`. `.paramMap.get('id')` reads the same kind of string, but reads it exactly once. If the router reuses this component for a later navigation, this line never runs again and the value never changes.",
    },
  ];

  /**
   * Sample: encoding — the router encodes a param it builds from an array, but
   * a hand-built string never gets that treatment.
   */
  protected readonly encodingSample = `// id = 'AB/12' — a value that itself contains a slash

[routerLink]="['/users', id]"          // encodes each segment → /users/AB%2F12
router.navigate(['/users', id]);       // same — encodes each segment
routerLink="/users/{{id}}"             // NOT encoded → /users/AB/12 (wrong path!)
router.navigateByUrl('/users/' + id);  // NOT encoded — same bug

// reading it back, either way:
route.snapshot.paramMap.get('id');   // 'AB/12' — already DECODED for you

// query values: '+' means a literal plus, never a space
router.navigate([], { queryParams: { q: 'a+b' } }); // → ?q=a%2Bb, reads back 'a+b'`;

  /** Line-by-line walkthrough of {@link encodingSample}. */
  protected readonly encodingNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The array-form `routerLink` and `navigate()` both build the URL segment by segment, and each segment is percent-encoded on the way in — a literal `/` inside the value becomes `%2F`, so it stays part of ONE segment instead of accidentally starting a new one.',
    },
    {
      line: 5,
      text: 'String interpolation into a `routerLink`, or string concatenation into `navigateByUrl`, never runs through that encoding step — whatever characters the value contains land in the URL verbatim, which here creates an extra path segment nobody intended.',
    },
    {
      line: 9,
      text: '`paramMap.get()` always hands back the DECODED value — `%2F` comes back as `/` — so application code never encodes or decodes params itself; that work happens entirely at the router boundary.',
    },
    {
      line: 12,
      text: "In a query string specifically, `+` is a reserved shorthand for a space by convention — Angular's serializer escapes a literal `+` you pass as `%2B` so it survives as an actual plus, not a decoded space.",
    },
  ];

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
   * Sample: `replaceUrl` for transient query-param updates, and `skipLocationChange`
   * for the option that doesn't touch the address bar at all.
   */
  protected readonly replaceUrlSample = `// A debounced search box syncing to the URL on every keystroke:
router.navigate([], {
  queryParams: { q: term },
  queryParamsHandling: 'merge',
  replaceUrl: true,   // rewrites the CURRENT history entry — no new one
});

// State the user should be able to Back out of keeps the default push:
router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });

// skipLocationChange: the route changes, but the address bar does not move
// at all — neither a push NOR a replace touches it.
router.navigate(['/preview'], { skipLocationChange: true });`;

  /** Line-by-line walkthrough of {@link replaceUrlSample}. */
  protected readonly replaceUrlNotes: CodeNote[] = [
    {
      line: 5,
      text: '`replaceUrl: true` swaps the CURRENT history entry for the new URL instead of pushing a new one — so twenty keystrokes leave one history entry, not twenty, and the Back button still does something useful.',
    },
    {
      line: 9,
      text: 'Left at its default (push), every call adds a new entry. Reach for that default whenever the state genuinely deserves its own Back stop — a page number, opening a detail panel — not for something that changes on every keystroke.',
    },
    {
      line: 13,
      text: "`skipLocationChange` is a different knob entirely: the router still navigates and the component still activates, but the URL bar is left completely untouched — useful for a preview that shouldn't be bookmookmarkable at its own address. Neither a push nor a replace happens.",
    },
  ];

  /**
   * Sample: what the dissector demo above reads by hand — repeated keys via
   * `getAll`, the fragment as an Observable, and matrix params surfacing
   * through `paramMap` rather than `queryParamMap`.
   */
  protected readonly arraysSample = `// repeated key → array
// URL:  /list?tag=ng&tag=rxjs
route.snapshot.queryParamMap.getAll('tag');   // ['ng', 'rxjs']
route.snapshot.queryParamMap.get('tag');      // 'ng'  (first only)

// fragment (the #hash)
route.fragment;                               // Observable<string | null>

// matrix params — scoped to one segment: /users;view=grid;page=2
route.snapshot.paramMap.get('view');          // 'grid'`;

  /** Line-by-line walkthrough of {@link arraysSample}. */
  protected readonly arraysNotes: CodeNote[] = [
    {
      line: 3,
      text: "`getAll('tag')` returns **every** value a repeated key carried, in order, as a string array. This is the only correct way to read `?tag=ng&tag=rxjs` — the URL is not malformed, it is a list.",
    },
    {
      line: 4,
      text: '`get(\'tag\')` on the exact same URL silently returns only the **first** match. Nothing about the call site tells you a value was dropped — this is the bug that reaches code review as "why did we lose the second tag?"',
    },
    {
      line: 7,
      text: '`route.fragment` is an `Observable<string | null>` — the `#hash` portion, kept separate from both param maps because it is not sent to the server at all. Subscribe to it (or `toSignal` it) the same way you would `paramMap`.',
    },
    {
      line: 10,
      text: "The trap in this whole block: matrix params look like they belong with query params — they're written with punctuation in the URL, not as a path segment — but the router surfaces them through **`paramMap`**, the same map path params use, never `queryParamMap`.",
    },
  ];

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

  /** Line-by-line walkthrough of {@link inputSample}. */
  protected readonly inputNotes: CodeNote[] = [
    {
      line: 1,
      text: '`withComponentInputBinding()` is a router *feature*, opted into once where routes are provided. Without it, none of the bindings below happen and the component must `inject(ActivatedRoute)` instead.',
    },
    {
      line: 4,
      text: 'A plain signal `input()` — no decorator, no constructor wiring. The router looks for a path param named `id` and writes it here automatically, by **name only**.',
    },
    {
      line: 5,
      text: 'Same mechanism, a query param this time. The router does not care which source a name came from — which is exactly the collision risk the warning below spells out.',
    },
    {
      line: 6,
      text: "A **resolver's** resolved value binds the same way, matched by the key it was registered under in the route's `resolve` object. One `input()` API covers all three sources.",
    },
  ];
}
