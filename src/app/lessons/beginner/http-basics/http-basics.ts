import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 */
@Component({
  selector: 'app-lesson-http-basics',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  styleUrl: './http-basics.css',
  templateUrl: './http-basics.html',
})
export class HttpBasics {
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

  /** The cold-Observable trap, posed before the note that explains it. */
  protected readonly coldSample = `const posts$ = this.http.get<Post[]>('/api/posts');

posts$.subscribe((p) => this.list.set(p));
posts$.subscribe((p) => this.count.set(p.length));

// Open the Network tab.
// How many requests to /api/posts do you see?`;

  /** Choices for the cancellation check. */
  protected readonly cancelOptions = [
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
  protected readonly questions = [
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
