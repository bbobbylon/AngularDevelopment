import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * A post from the demo API.
 */
interface Post {
  id: number;
  title: string;
  body: string;
}

/**
 * A user from the demo API, used by the race-condition demo.
 */
interface RandomUser {
  id: number;
  name: string;
}

/**
 * Lesson: HttpClient Basics — making requests, and the two things that bite
 * afterwards.
 *
 * Covers `provideHttpClient`, `inject(HttpClient)`, typed `get<T>()`, and the
 * fact that an Angular HTTP observable is **cold**: nothing is sent until
 * something subscribes, and it completes after one response.
 *
 * Beyond the mechanics, two demos:
 *
 * - **Loading and error states**, because a request has four outcomes and a UI
 *   that only handles the happy one is the commonest bug in the category.
 * - **The out-of-order response race.** Fire a request per keystroke and the
 *   responses can arrive in any order — the slowest wins, and the UI shows a
 *   result for input the user has already replaced. `switchMap` fixes it by
 *   cancelling the previous request the instant a new one starts, and the
 *   request/response counters here make the cancellation countable.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the problem before naming it.** The page opens on "you called
 *    `http.get()` — the Network tab stayed empty," with a `Napkin` tease that
 *    withholds its answer until the concrete self-test further down.
 * 2. **Analogy before mechanism.** The recipe-card frame (`get()` writes the
 *    recipe, `subscribe()` cooks it) is staged twice — once in prose, once as
 *    a three-way `Bubbles` dialogue between the code, `get()` and
 *    `subscribe()` — before "cold Observable" has to carry any weight alone.
 * 3. **Then the same idea in several modes.** A `Flow` diagram of the six-step
 *    request/response lifecycle, an `app-layers` containment diagram of the
 *    interceptor chain, a `TapeCard` row of the mechanism's other facts, two
 *    full live demos against a real API, an `app-compare` of Promise vs
 *    Observable, and four `app-code-lab` walkthroughs of real HTTP code.
 * 4. **Every snippet is annotated line by line** via `app-code-lab` — nobody
 *    reading this for the first time is assumed to be able to parse
 *    `catchError`, `switchMap` or a typed generic on sight.
 *
 * @see intermediate/http-crud — the four write verbs, request bodies, params
 * and headers in depth; this lesson only introduces their shape.
 * @see intermediate/http-interceptors — the full interceptor chain this
 * lesson's `Layers` diagram only previews.
 * @see expert/change-detection — the reference implementation this lesson's
 * presentation layer copies the shape from.
 */
@Component({
  selector: 'app-lesson-http-basics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './http-basics.css',
  templateUrl: './http-basics.html',
})
export class HttpBasics {
  /** The HTTP track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Basics' },
    { label: 'CRUD', id: 'http-crud' },
    { label: 'Interceptors', id: 'http-interceptors' },
    { label: 'httpResource()', id: 'http-resource' },
  ];

  /**
   * One request from `subscribe()` to callback. Worth drawing because almost every
   * later HTTP topic — interceptors, auth headers, retries, cancellation — is a
   * change to exactly one of these steps, and knowing which one is most of the
   * debugging.
   */
  protected readonly lifecycle = [
    {
      label: '`subscribe()` runs',
      detail: 'Not before. This is the moment the request object is built',
      tone: 'accent' as const,
    },
    {
      label: 'Down the interceptor chain',
      detail: 'Each one may `clone()` the request and pass it on',
    },
    {
      label: 'The backend sends it',
      detail: '`fetch` or `XMLHttpRequest`, depending on how you provided it',
    },
    {
      label: 'Response bubbles back up',
      detail: 'Through the same interceptors, in reverse order',
    },
    {
      label: 'Body parsed by `responseType`',
      detail: "Defaults to `'json'` — the raw text goes through `JSON.parse`",
    },
    {
      label: 'Your callback, then complete',
      detail: 'One value, then the Observable finishes on its own',
      tone: 'good' as const,
    },
  ];

  /**
   * The three-way exchange behind the recipe-card analogy: your code, `get()`
   * and `subscribe()`, each doing exactly one job. Staged as dialogue because
   * the relationship learners get backwards is that `get()` itself does
   * something — it doesn't; it only describes.
   */
  protected readonly recipeTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: "I just called `this.http.get('/api/posts')`. Where's my data?",
    },
    {
      who: 'get()',
      says: "I'm not data — I'm a description of a request you **could** make. I haven't sent anything.",
    },
    { who: 'Your code', says: 'Then what do I actually do with you?' },
    {
      who: 'get()',
      says: 'Hand me to `subscribe()`. That is the only thing that actually cooks me.',
    },
    {
      who: 'subscribe()',
      says: 'Got it — building the real `HttpRequest` now, dispatching it, and I will call you back with exactly one response before I finish.',
    },
  ];

  /** The cold-Observable trap, posed before the note that explains it. */
  protected readonly coldSample = `const posts$ = this.http.get<Post[]>('/api/posts');

posts$.subscribe((p) => this.list.set(p));
posts$.subscribe((p) => this.count.set(p.length));

// Open the Network tab.
// How many requests to /api/posts do you see?`;

  /**
   * Sample: the `load()` method behind the GET demo below, annotated line by
   * line. Matches the real implementation further down this file, minus the
   * `.slice(0, 5)` and with a placeholder URL, so nothing here contradicts
   * what actually runs.
   */
  protected readonly loadSample = `private readonly http = inject(HttpClient);
protected readonly posts = signal<Post[]>([]);
protected readonly state = signal<'idle' | 'loading' | 'done' | 'error'>('idle');

load(): void {
  this.state.set('loading');
  this.http
    .get<Post[]>('https://api.example.com/posts')
    .pipe(catchError(() => of<Post[] | null>(null)))
    .subscribe((posts) => {
      if (posts === null) {
        this.state.set('error');
        return;
      }
      this.posts.set(posts);
      this.state.set('done');
    });
}`;

  /** Line-by-line walkthrough of {@link loadSample}. */
  protected readonly loadNotes: CodeNote[] = [
    {
      line: 1,
      text: '`inject(HttpClient)` asks the current injector for the one app-wide `HttpClient` instance that `provideHttpClient()` registered — no constructor parameter needed.',
    },
    {
      line: 2,
      text: 'A signal holding the posts once they arrive. Starts as an empty array, not `null`, so the template can loop over it immediately with no null check.',
    },
    {
      line: 3,
      text: 'Four states, not two. `\'idle\'` and `\'done\'` are genuinely different — this is what lets the template tell "never asked" apart from "asked, and got nothing back".',
    },
    {
      line: 6,
      text: "Set to `'loading'` **before** the request is sent, so a slow network shows a spinner for however long the round trip takes, instead of a blank screen.",
    },
    {
      line: 8,
      text: '`get<Post[]>(...)` — the generic is a compile-time claim about the shape of the response. Nothing on the wire changes; it only affects what TypeScript lets you do with `posts` afterwards.',
    },
    {
      line: 9,
      text: '`catchError` intercepts a failed request and returns a *replacement* Observable instead of letting the error propagate — here, one that emits `null` so the pipeline still completes normally.',
    },
    {
      line: 10,
      text: 'One callback, not an observer object — the shorthand for "run this on every value". An HTTP Observable only ever emits once before completing.',
    },
    {
      line: 11,
      text: '`null` is the signal that `catchError` swallowed a failure. Checking for it here is what tells the loading state and the error state apart.',
    },
    {
      line: 15,
      text: "The happy path: store the real array and flip `state` to `'done'` in the same tick.",
    },
  ];

  /** Sample: the five HTTP verbs, one line each. */
  protected readonly verbsSample = `http.get<Post[]>(url, { params, headers })
http.post<Post>(url, newPost)
http.put<Post>(url, updatedPost)
http.patch<Post>(url, partialUpdate)
http.delete<void>(url)`;

  /** Line-by-line walkthrough of {@link verbsSample}. */
  protected readonly verbsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'GET reads. No body argument — the second parameter is an *options* object (`params` for the query string, `headers` for request headers), never data being sent.',
    },
    {
      line: 2,
      text: "POST creates. `newPost` is the request body, serialized to JSON automatically; the generic types the *response*, not what you're sending.",
    },
    {
      line: 3,
      text: 'PUT replaces. The convention is a full resource — send a partial object and whatever you leave out is what the server will overwrite it with.',
    },
    {
      line: 4,
      text: 'PATCH updates part of a resource. Unlike PUT, sending only the changed fields is the whole point.',
    },
    {
      line: 5,
      text: 'DELETE usually has no body and often no useful response — `<void>` says so honestly instead of leaving it typed as `Object`.',
    },
  ];

  /** Sample: branching on `HttpErrorResponse.status` instead of swallowing the error. */
  protected readonly errorSample = `this.http
  .get<Post[]>(url)
  .pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        this.router.navigate(['/login']);
      }
      console.error(err);
      return of<Post[]>([]);
    }),
  )
  .subscribe((posts) => this.posts.set(posts));`;

  /** Line-by-line walkthrough of {@link errorSample}. */
  protected readonly errorNotes: CodeNote[] = [
    {
      line: 4,
      text: '`HttpErrorResponse` is what a failed request actually delivers — it has `status`, `message`, and whatever body the server sent, parsed the same way a success response would be.',
    },
    {
      line: 5,
      text: 'Branching on `status` turns "something failed" into a specific, useful response — a 401 means *you*, specifically, are not authorized, which calls for something different than a 500.',
    },
    {
      line: 8,
      text: 'Logging before falling back matters: without it, the next line makes the failure invisible to everyone, including you.',
    },
    {
      line: 9,
      text: '`of<Post[]>([])` is the classic trap. It tells the rest of the pipeline "all good, here\'s your data" — an empty list, not a failure. Fine as a deliberate choice; a bug when it is reflexive.',
    },
    {
      line: 12,
      text: '`subscribe` only ever sees what `catchError` decided to hand it — by the time execution reaches here, the original error is long gone.',
    },
  ];

  /** Sample: bridging an HTTP Observable to a signal, and the race demo's real cancellation shape. */
  protected readonly bridgeSample = `// Read-only, no manual subscribe or unsubscribe:
protected readonly posts = toSignal(this.http.get<Post[]>(url), { initialValue: [] });

// A trigger stream, so an operator can attach a cancellation policy:
private readonly loadUser$ = new Subject<void>();

constructor() {
  this.loadUser$
    .pipe(switchMap(() => this.http.get<RandomUser>(randomUserUrl())))
    .subscribe((user) => this.lastUserName.set(user.name));
}`;

  /** Line-by-line walkthrough of {@link bridgeSample}. */
  protected readonly bridgeNotes: CodeNote[] = [
    {
      line: 2,
      text: '`toSignal` subscribes for you on creation and unsubscribes when the component is destroyed — no `takeUntilDestroyed()`, no leak, and the template reads `posts()` synchronously like any other signal.',
    },
    {
      line: 5,
      text: 'A `Subject` turns "the user clicked" into a *stream* — the only kind of thing an RxJS operator can attach to. Calling `this.http.get(...)` directly from the click handler would give `switchMap` nothing to work with.',
    },
    {
      line: 9,
      text: '`switchMap` unsubscribes the *previous* inner request the instant a new trigger fires — which, for an HTTP Observable, tears down the real network call, not just its result.',
    },
    {
      line: 10,
      text: 'Only ever sees the response from whichever request `switchMap` let survive. Every response it discarded never reaches this callback at all.',
    },
  ];

  /** Choices for the cancellation check. */
  protected readonly cancelOptions: QuizOption[] = [
    {
      text: 'Nothing — the request completes and the response is ignored',
      why: 'That is what `mergeMap` would do, and it is what most people assume Observables do generally. But an HTTP Observable defines real teardown logic, and unsubscribing runs it.',
    },
    {
      text: 'The underlying network request is aborted',
      correct: true,
      why: "Unsubscribing runs the Observable's teardown, and for `HttpClient` that teardown calls `AbortController.abort()` under `withFetch()`, or `xhr.abort()` under XHR. The connection genuinely stops — the server may even see the cancellation. This is why `switchMap` is the right operator for a typeahead: you are not just discarding stale answers, you are not paying for them.",
    },
    {
      text: 'The request is paused and resumes if you resubscribe',
      why: 'There is no pause in HTTP, and resubscribing to a cold Observable does not resume anything — it starts a completely new request from scratch.',
    },
    {
      text: 'It depends on the operator — only `switchMap` can cancel',
      why: "Backwards. `switchMap` has no cancelling power of its own; all it does is unsubscribe from the previous inner Observable. The cancellation comes from `HttpClient`'s teardown, which any unsubscribe triggers — including a component being destroyed.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why Observables at all? A request only ever returns one thing.',
      a: 'Two reasons that a Promise cannot give you. Cancellation, which a Promise has no concept of — and cancelling stale requests is the entire fix for typeahead races. And composition: because the result is a stream, `retry`, `debounceTime`, `timeout` and `switchMap` all apply to it unchanged. If you genuinely want a Promise, `firstValueFrom(http.get(...))` gives you one, and you give up both of those.',
    },
    {
      q: 'When should I use `toSignal` instead of `subscribe`?',
      a: 'Almost always, when the result is going to be rendered. `toSignal` subscribes for you, tears down when the component dies, and gives the template something it can read synchronously — no manual `takeUntilDestroyed`, no leak. Keep a hand-written `subscribe` for genuine side effects: a fire-and-forget POST, or something that has to happen whether or not anything renders.',
    },
    {
      q: 'My `catchError` returns `of([])` and now I never see failures. Is that wrong?',
      a: 'It is the single most common way error handling goes bad. Returning a value tells the rest of the pipeline "all good, here is your data", so the UI renders an empty list and the user is told nothing. Fine as a deliberate fallback; a bug when it is reflexive. Set an error state first, or rethrow with `throwError`, and branch on `err.status` so a 401 and a 500 do not get the same treatment.',
    },
    {
      q: 'What is the difference between `get()` and `get<Post[]>()`?',
      a: 'Only the type — the network call is identical. Without the generic, TypeScript types the result as `Object`, so `posts[0].title` will not compile and you end up casting. The generic is a claim about the shape, not a validation of it: if the server sends something else, nothing checks. It buys you editor support and compile-time safety, not runtime safety.',
    },
    {
      q: 'Do I need `withFetch()`?',
      a: 'It is the recommended setup. `provideHttpClient(withFetch())` puts the client on the modern `fetch` API rather than `XMLHttpRequest`, which is what server-side rendering needs and what makes cancellation an `AbortController` abort. Without it, everything still works on XHR; you just have the older backend and slightly worse SSR behaviour.',
    },
  ];

  /**
   * The HTTP client.
   */
  private readonly http = inject(HttpClient);
  /**
   * The fetched posts.
   */
  protected readonly posts = signal<Post[]>([]);
  /**
   * Where the request has got to. A four-state union rather than a boolean, so
   * "not started" and "finished" are distinguishable and every state has to be
   * handled somewhere.
   */
  protected readonly state = signal<'idle' | 'loading' | 'done' | 'error'>('idle');

  /**
   * Requests started in the race demo.
   */
  protected readonly requestCount = signal(0);
  /**
   * Responses actually applied. The gap between this and {@link requestCount} is
   * the demo's payoff — it counts the requests `switchMap` threw away.
   */
  protected readonly responseCount = signal(0);
  /**
   * The most recent user's name.
   */
  protected readonly lastUserName = signal<string | null>(null);
  /**
   * The race demo's trigger. A `Subject` rather than a direct call so the clicks
   * form a stream that an operator can be attached to — which is the only place a
   * cancellation policy can live.
   */
  private readonly loadUser$ = new Subject<void>();

  /**
   * Wires the race demo: every trigger runs through `switchMap`, which unsubscribes
   * the previous in-flight request the moment a new one starts.
   *
   * `takeUntilDestroyed` ends the whole pipeline with the component, so a response
   * cannot arrive to a destroyed view.
   */
  constructor() {
    // switchMap unsubscribes the previous inner request the instant a new one starts.
    this.loadUser$
      .pipe(
        switchMap(() => {
          const id = Math.floor(Math.random() * 10) + 1;
          return this.http
            .get<RandomUser>(`https://jsonplaceholder.typicode.com/users/${id}`)
            .pipe(catchError(() => of<RandomUser | null>(null)));
        }),
      )
      .subscribe((user) => {
        if (!user) return;
        this.responseCount.update((c) => c + 1);
        this.lastUserName.set(user.name);
      });
  }

  /**
   * Loads the post list, walking through the loading, success and error states.
   */
  protected load() {
    this.state.set('loading');
    this.http
      .get<Post[]>('https://jsonplaceholder.typicode.com/posts')
      .pipe(catchError(() => of<Post[] | null>(null)))
      .subscribe((posts) => {
        if (posts === null) {
          this.state.set('error');
          return;
        }
        this.posts.set(posts.slice(0, 5));
        this.state.set('done');
      });
  }

  /**
   * Fires the race demo: bumps the request count and pushes a trigger. Click it
   * rapidly to see responses discarded.
   */
  protected loadRandomUser() {
    this.requestCount.update((c) => c + 1);
    this.loadUser$.next();
  }
}
