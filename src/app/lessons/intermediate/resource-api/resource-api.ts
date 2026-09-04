import { Component, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * A user from the demo API.
 */
interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: the `resource()` API — async data as reactive signal state, and its
 * `httpResource()` / `rxResource()` siblings.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and the reference
 * implementation, `expert/change-detection`). The teaching order follows the
 * same recipe: pose the problem before naming the fix, give the mechanism an
 * analogy before its vocabulary, then the same idea in several modes.
 *
 * ## The one thing worth knowing before you touch this file
 *
 * `resource()`'s `status()` has two "a request is happening" states —
 * `loading` and `reloading` — and almost every explanation of the API
 * (including, until this rewrite, this lesson's own) treats them as
 * interchangeable. They are not, and the difference is verified straight from
 * `@angular/core`'s shipped source (`_resource-chunk.mjs`), not guessed from
 * the docs:
 *
 * - A **`params` change** (`this.userId.set(2)`) is a brand-new request. The
 *   resource's internal state drops the previous resolved stream immediately,
 *   so `status()` goes to `'loading'` and `value()` reverts to `undefined` (or
 *   `defaultValue`) — there is nothing stale left to show.
 * - **`reload()`** re-runs the loader for the *same, unchanged* params. The
 *   previous stream is kept in place while the new one is fetched, so
 *   `status()` goes to `'reloading'` and `value()` keeps returning the old
 *   result until the new one lands.
 *
 * This is why the live demo below has two separate controls — Next/Prev
 * (params change → blank) and Reload (same id → stale-while-revalidate) — and
 * why the room-service analogy in the mental-model section is built around
 * exactly this distinction. It also drives the corrected quiz and status
 * table: most write-ups (and the coverage sweep that flagged this lesson for
 * a rewrite) describe `reloading` as "any refetch after a resolved value,"
 * which the source does not support.
 *
 * The second correction, also source-verified: reading `value()` while
 * `status()` is `'error'` **throws** — it does not quietly return `undefined`
 * or fall back to `defaultValue`. `defaultValue` only rescues `idle` and
 * `loading`. `hasValue()` is safe to call in every state because it checks
 * `status()` internally before ever touching `value()`; that is the actual
 * reason the docs recommend it over `value() ?? fallback`.
 *
 * ## Why httpResource() has no live instance on this page
 *
 * `HttpResourceImpl` (in `@angular/common/http`) extends the very same
 * `ResourceImpl` traced above, so it registers the same `PendingTasks` entry
 * while a request is in flight. `lessons.smoke.spec.ts` mounts every lesson
 * with `provideHttpClientTesting()` and nothing in that spec ever flushes a
 * captured request — so a field-initializer `httpResource()` here would leave
 * a pending task open forever, and `fixture.whenStable()` would hang the
 * smoke test for this exact lesson. `userResource` above is unaffected: it
 * calls the real `fetch()` directly, which the HTTP testing backend never
 * sees and which settles on its own. `httpResource()` is taught here through
 * {@link httpResourceSample} and the before/after `<app-compare>` instead.
 */
@Component({
  selector: 'app-lesson-resource-api',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './resource-api.css',
  templateUrl: './resource-api.html',
})
export class ResourceApi {
  /**
   * Which user to load. Changing it starts a brand-new request — see the
   * class doc above for why that is a *different* thing from `reload()`.
   */
  protected readonly userId = signal(1);

  /**
   * The hand-wired version: `resource()` plus a raw `fetch()` loader. This is
   * what `httpResource()` (further down the page) removes the boilerplate of.
   */
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

  /**
   * The draft name in the local-edit demo.
   */
  protected readonly draftName = signal('');

  /**
   * Loads the next user — a **params change**: a new request, old value gone.
   */
  protected next() {
    this.userId.update((n) => Math.min(10, n + 1));
  }
  /**
   * Loads the previous user — same rule as {@link next}.
   */
  protected prev() {
    this.userId.update((n) => Math.max(1, n - 1));
  }
  /**
   * Points `userId` at an id jsonplaceholder doesn't have, so
   * {@link userResource} lands in `status: 'error'` on purpose.
   */
  protected breakIt() {
    this.userId.set(999);
  }
  /**
   * Back to a real user after {@link breakIt}.
   */
  protected reset() {
    this.userId.set(1);
  }
  /**
   * Writes an edit into the resource's value locally, without a request.
   *
   * Shows that a resource's value is writable: optimistic edits are possible,
   * and the next `reload()` or params change overwrites them with the
   * server's answer.
   */
  protected saveLocal() {
    const current = this.userResource.value();
    if (!current || !this.draftName().trim()) return;
    this.userResource.value.set({ ...current, name: this.draftName().trim() });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Signals track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Signals', id: 'signals' },
    { label: 'Advanced Signals', id: 'signals-advanced' },
    { label: 'resource()' },
  ];

  /**
   * The naive, hand-rolled version of async state — four signals and an
   * effect — set up so the reader feels the boilerplate before `resource()`
   * removes it.
   */
  protected readonly naiveSample = `protected readonly userId = signal(1);
protected readonly user = signal<User | undefined>(undefined);
protected readonly loading = signal(false);
protected readonly error = signal<string | undefined>(undefined);

constructor() {
  effect(() => {
    const id = this.userId();               // read INSIDE the effect — this is what makes it reactive
    this.loading.set(true);
    this.error.set(undefined);
    fetch(\`/users/\${id}\`)
      .then((res) => res.json())
      .then((data) => this.user.set(data))
      .catch((e) => this.error.set(String(e)))
      .finally(() => this.loading.set(false));
  });
}`;

  /** Line-by-line walkthrough of {@link naiveSample}. */
  protected readonly naiveNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Three more signals — `user`, `loading`, `error` — one per piece of state a real fetch needs. Multiply this by every async call in a real app and it is the same four fields, hand-copied, every time.',
    },
    {
      line: 8,
      text: 'Reading `this.userId()` **inside** the effect is what registers it as a dependency — exactly like reading a signal in a template. Change `userId` and this whole block reruns.',
    },
    {
      line: 9,
      text: "Reset the flags before the new request starts, by hand, every time. Forget this line and a failed second request still shows the first request's stale `loading: false`.",
    },
    {
      line: 11,
      text: 'No `AbortSignal` anywhere. If `userId` changes again before this resolves, the old `fetch` keeps running in the background with nothing telling it to stop.',
    },
    {
      line: 12,
      text: '`res.json()` with no check on `res.ok` first — a 404 or 500 still has a JSON *body* (often something like `{ message: "not found" }`), so this line happily "succeeds" and stores a shaped error as if it were the user.',
    },
    {
      line: 13,
      text: 'Nothing here compares "is this response for the request I most recently started?" If the response for `userId 1` arrives **after** the response for `userId 2`, it silently overwrites the newer, correct data — the race condition the rest of this page exists to close.',
    },
  ];

  /**
   * The two-party exchange behind the "new order vs same order" distinction —
   * see the class doc for why this is the load-bearing fact on the page.
   */
  protected readonly resourceTalk: BubbleTurn[] = [
    { who: 'You', says: '`userId.set(2)`.' },
    {
      who: 'resource()',
      says: "I read that inside `params` — I'm watching it. That's a brand-new request, not a continuation of the old one.",
    },
    { who: 'You', says: "What happens to what's on screen right now?" },
    {
      who: 'resource()',
      says: "Gone, the instant I see the new value. `status()` goes back to `'loading'` — a params change means **start over**, not refresh.",
    },
    { who: 'You', says: 'And if I call `reload()` instead, with the same id?' },
    {
      who: 'resource()',
      says: "Different story. Same request, so I leave last time's value exactly where it is and mark myself `'reloading'` while I fetch you a fresh one.",
    },
  ];

  /**
   * Sample: declaring a resource — `params`, `loader`, `abortSignal` — the
   * fix for every gap {@link naiveSample} left open.
   */
  protected readonly declareSample = `protected readonly userId = signal(1);

protected readonly userResource = resource({
  params: () => this.userId(),
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(\`https://api.example.com/users/\${params}\`, {
      signal: abortSignal,
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return (await res.json()) as User;
  },
});`;

  /** Line-by-line walkthrough of {@link declareSample}. */
  protected readonly declareNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The reactive input. Nothing new here — the exact same signal from the naive version.',
    },
    {
      line: 3,
      text: '`resource()` takes ONE options object and must be created in an **injection context** — a field initializer or a constructor — because it registers a `DestroyRef` callback to clean itself up, and that needs an injector to read from.',
    },
    {
      line: 4,
      text: '`params` is a **function**, not a value. Reading `this.userId()` inside it registers a dependency exactly like `computed()` or `effect()` — change `userId` and the loader reruns automatically. Nobody calls `.reload()` for this.',
    },
    {
      line: 5,
      text: 'The loader receives one object, destructured here into `params` (the resolved value `params()` just returned) and `abortSignal` — a fresh `AbortSignal` for this call specifically.',
    },
    {
      line: 7,
      text: "`signal: abortSignal` wires this call into Angular's own `AbortController`. `resource()` will discard a stale RESULT on its own even without this line — this line is what makes the underlying network call actually stop instead of finishing uselessly in the background.",
    },
    {
      line: 9,
      text: "`fetch` does not reject on a 404 or 500 — `res.ok` is the real check. Skip it and a 404's JSON body gets returned as though it were a valid user, same trap as in the naive version.",
    },
    {
      line: 10,
      text: "Whatever this returns becomes the new `value()`. Once it resolves, `status()` flips to `'resolved'` and every consumer of `value()` re-renders.",
    },
  ];

  /** The params-change sequence — contrast this with `reload()`, covered right after. */
  protected readonly abortSteps: FlowStep[] = [
    {
      label: 'params reads userId()',
      detail: 'Registered as a dependency, same as inside computed()',
    },
    { label: 'userId changes', detail: 'Something calls userId.set(2)', tone: 'accent' },
    {
      label: 'Previous stream dropped',
      detail: 'status() → loading. The OLD value is gone, not dimmed.',
      tone: 'warn',
    },
    { label: 'New loader call', detail: 'Gets its own fresh abortSignal', tone: 'good' },
  ];

  /**
   * The corrected self-test: `reloading` is not "any refetch," it is
   * specifically a `reload()` against unchanged params. The distractors are
   * the two ways almost every write-up of this API gets it wrong.
   */
  protected readonly statusQuizOptions: QuizOption[] = [
    {
      text: "User 3's data, dimmed — the old value is kept on screen until the new one lands.",
      why: 'That IS what happens — but only when the SAME params are asked for again, via `reload()`. A params change is treated as an entirely new request, so the previous resolved stream is dropped immediately rather than kept and dimmed.',
    },
    {
      text: "Nothing — value() reverts to undefined (or your defaultValue), because status() is 'loading', not 'reloading'.",
      correct: true,
      why: 'Exactly. A params change discards the previous stream the moment the new value is read, so there is nothing stale to show. `reloading` is reserved for a `reload()` against params that have not changed.',
    },
    {
      text: "It throws, because the old value doesn't match the new params.",
      why: "`value()` only throws when `status()` is `'error'` — a failed load, not a normal params change. This scenario never touches the error path at all.",
    },
    {
      text: "Whatever shows is up to isLoading() — it's true in both cases, so it can't tell you.",
      why: "True that `isLoading()` can't discriminate the two — but the question is what the SCREEN shows, and that's governed by `status()`/`value()`, which the loading case above answers directly: nothing.",
    },
  ];

  /**
   * Sample: the full options-object form of `httpResource()` — the shape
   * behind the coverage-sweep finding that this API surface was entirely
   * absent from the lesson that owns `resource()`.
   */
  protected readonly httpResourceSample = `protected readonly query = signal('');

protected readonly hits = httpResource<SearchHit[]>(
  () => ({
    url: 'https://api.example.com/search',
    params: { q: this.query(), limit: 20 },
    headers: { 'X-Client': 'lesson-demo' },
  }),
  {
    defaultValue: [],
    parse: (raw) => searchHitsSchema.parse(raw),
  },
);`;

  /** Line-by-line walkthrough of {@link httpResourceSample}. */
  protected readonly httpResourceNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A plain signal driving the search box — nothing resource-specific yet.',
    },
    {
      line: 3,
      text: 'The generic `<SearchHit[]>` is the PARSED type — what you get back after `parse` below runs, not necessarily what the server literally sent.',
    },
    {
      line: 4,
      text: 'The whole first argument is one function. Angular tracks every signal it reads while producing this object — the same reactive rule as `params` in plain `resource()`, applied to a request shape instead of a plain value.',
    },
    {
      line: 6,
      text: 'Reading `this.query()` **here**, inside the factory, is what makes the request reactive. Read it from a plain variable instead and this resource simply never refetches — the single most common `httpResource` bug.',
    },
    {
      line: 10,
      text: '`defaultValue: []` — `hits.value()` is `SearchHit[]`, never `SearchHit[] | undefined`. Templates can iterate it directly with no `hasValue()` guard for "nothing yet".',
    },
    {
      line: 11,
      text: "`parse` runs on every response, before it is stored. Throwing here — a failed schema check, say — surfaces through the exact same `status: 'error'` channel as a failed HTTP request, so one error-handling path covers both.",
    },
  ];

  /**
   * The `resource()` vs `httpResource()` self-test — what the swap actually
   * buys, since it is not "less code" alone.
   */
  protected readonly httpResourceQuizOptions: QuizOption[] = [
    {
      text: "The request goes through your app's HTTP interceptors.",
      correct: true,
      why: 'That is the headline benefit: httpResource() is built on HttpClient, so an auth-header interceptor, a retry interceptor, or a testing backend (provideHttpClientTesting) all apply — none of them can see a raw fetch() call.',
    },
    {
      text: 'You no longer need to read params reactively.',
      why: "The reactive-URL rule is identical: httpResource's request callback must read a signal to be reactive. Build the URL from a plain variable and it never refetches, same trap as plain resource().",
    },
    {
      text: 'POST and PUT become possible through the same resource.',
      why: 'httpResource() is still shaped for reads. A resource represents state kept in sync with its inputs — re-running a POST every time an unrelated signal changes is exactly the bug that causes duplicate submissions. Mutations still go through http.post()/put() directly, from a handler.',
    },
    {
      text: 'Errors are silently swallowed instead of thrown.',
      why: 'The opposite: a failed request surfaces through error() as a real HttpErrorResponse — more structured than a plain Error, not less visible.',
    },
  ];

  /**
   * Sample: `rxResource()` — the Observable-flavoured sibling, with the
   * `loader` → `stream` rename the coverage sweep flagged as commonly missed.
   */
  protected readonly rxResourceSample = `protected readonly query = signal('');

protected readonly results = rxResource({
  params: () => this.query(),
  stream: ({ params }) =>
    this.http.get<Hit[]>('/api/search', { params: { q: params } }).pipe(debounceTime(300)),
});`;

  /** Line-by-line walkthrough of {@link rxResourceSample}. */
  protected readonly rxResourceNotes: CodeNote[] = [
    {
      line: 1,
      text: "The search box's value, same shape as every other example on this page.",
    },
    {
      line: 3,
      text: '`rxResource` — the same `params`/`value`/`status` shape as `resource()`, imported from `@angular/core/rxjs-interop`, for when your source is naturally an **Observable** rather than a Promise.',
    },
    {
      line: 4,
      text: '`params` does the identical job it does in `resource()` — reads `query()` reactively and hands the resolved value to the option below.',
    },
    {
      line: 5,
      text: '**`stream`, not `loader`.** This is the option Angular renamed after the earliest developer-preview releases — older blog posts and out-of-date snippets still say `loader` here and will not compile.',
    },
    {
      line: 6,
      text: "Returns an **Observable**, not a Promise. Every time `params` changes, `rxResource` unsubscribes the previous stream and subscribes to this fresh one — which is why `debounceTime`, `retry` and friends compose naturally here in a way a raw Promise `loader` can't.",
    },
  ];

  /**
   * The trap: `value()` before the first response has arrived.
   */
  protected readonly valuePredictPrompt =
    'You write `protected readonly count = resource({ loader: () => fetchCount() });` — on the very next line, before any network response has arrived, what does `count.value()` return?';
  protected readonly valuePredictAnswer =
    "`undefined`. `resource()` returns immediately with `status()` at `'loading'`; the loader is asynchronous. There is no value yet unless you set a `defaultValue`, which is exactly why templates check `hasValue()` (or branch on `status()`) instead of assuming `value()` is populated.";

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Does resource() only work inside a component?',
      a: 'No — the rule is about where it is CREATED, not what kind of class it is in. Call `resource()`/`httpResource()` in a field initializer or a constructor (both are injection contexts) and it works identically in an `@Injectable` service. Call it later, inside a method or a factory function, and it throws unless you pass `{ injector: this.injector }` explicitly.',
    },
    {
      q: "What's actually different between isLoading() and status() === 'loading'?",
      a: '`isLoading()` is true for BOTH `loading` and `reloading` — it just means "a request is in flight right now". `status()` tells you which of the two you\'re in, and that matters because `value()` behaves differently in each: empty during `loading`, still holding the old data during `reloading`. If your UI needs to choose "show a skeleton" vs "dim the existing content", you need `status()`, not `isLoading()`.',
    },
    {
      q: 'Can I use resource() to send a POST?',
      a: "Technically the loader can run any async code, including a POST — but don't. A resource represents a piece of state kept in sync as its inputs change; re-running a POST every time some unrelated signal changes is exactly the bug that causes duplicate orders and double-charged cards. Keep resource()/httpResource() for reads, and call http.post()/put() directly, from a handler, for commands.",
    },
    {
      q: 'Is resource() safe to use in a real project, or is "experimental" a red flag?',
      a: "In this exact Angular version, `resource()`, `rxResource()` and `httpResource()` are all still tagged `@experimental` in their type declarations — one step earlier than `@developerPreview`. That means the framework team may still change the shape without a deprecation cycle. In practice the core `params`/`loader`/`value`/`status` contract has held steady across several releases and is what Angular's own docs steer you toward, so most teams use it and just watch the changelog.",
    },
    {
      q: 'I forgot to wire abortSignal into my fetch — what actually breaks?',
      a: 'Less than you\'d think. `resource()` always fires its internal AbortController the moment a newer request supersedes an old one, AND it separately checks "is this still the current request?" before ever committing a result to state — so a stale response can\'t overwrite fresher data even if your `fetch` call never looked at the signal. What you actually lose by skipping `signal: abortSignal` is the network call itself: the browser keeps sending and receiving bytes for a request nobody wants any more. A real bug, just a performance one, not a correctness one.',
    },
  ];
}
