import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap } from 'rxjs';

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
  imports: [RouterLink],
  styleUrl: './http-basics.css',
  templateUrl: './http-basics.html',
})
export class HttpBasics {
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
