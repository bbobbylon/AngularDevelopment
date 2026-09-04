import { Component, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * A user from the demo API.
 */
interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

/**
 * Lesson: the `resource()` API — async data as signal state.
 *
 * `resource()` takes a reactive `params` and an async `loader` and gives back a
 * signal-shaped object with `value`, `status`, `error` and `isLoading`, plus
 * `reload()` and a locally-writable `value` via `set`.
 *
 * What it removes is the boilerplate everyone writes anyway: the loading flag,
 * the error field, the stale-response guard. The `abortSignal` handed to the
 * loader is the interesting part — change `params` while a request is in flight
 * and the previous one is genuinely aborted, so the out-of-order response that
 * normally requires `switchMap` cannot happen.
 */
@Component({
  selector: 'app-lesson-resource-api',
  imports: [RouterLink, Predict, Quiz, Remember],
  styleUrl: './resource-api.css',
  templateUrl: './resource-api.html',
})
export class ResourceApi {
  /**
   * The dead-params puzzle used by the ask-before-telling block: the signal is
   * read *outside* the `params` callback, so the reactive context sees no
   * dependency and the loader never re-runs. It fetches once, correctly, which
   * is exactly why nobody notices until QA changes the id.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly deadParamsSample = `export class UserPanel {
  userId = signal(1);

  // Read the signal into a plain const first — it looks tidier.
  private readonly id = this.userId();

  userResource = resource({
    params: () => this.id,                       // returns a plain number
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(\`/users/\${params}\`, { signal: abortSignal });
      return (await res.json()) as User;
    },
  });

  next() { this.userId.update(n => n + 1); }     // the button calls this
}`;

  /**
   * The self-test, on `undefined` params. Each wrong answer is a reasonable
   * guess about what a "missing" request value should do, and only one matches
   * what Angular actually specified.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'No request is made at all. The resource sits in `idle`, and `value()` stays `undefined` until the params produce a real value.',
      correct: true,
      why: 'Right, and this is a designed feature rather than an accident. Returning `undefined` is how you say “not ready yet” — you use it to hold off fetching until a route param has arrived or a filter has been chosen.',
    },
    {
      text: 'The loader runs with `params` set to `undefined`, so the URL contains the literal text `undefined`.',
      why: 'That is what a hand-rolled effect would do, and it is exactly the bug `resource()` is avoiding. Angular checks for `undefined` before calling the loader and skips the request entirely.',
    },
    {
      text: 'The resource throws, and `error()` is populated with a "missing params" error.',
      why: 'Nothing throws. `undefined` params is a normal, expected state — it is the state a resource starts in whenever its inputs are not ready, which is most components on first render.',
    },
    {
      text: 'The previous value is kept and the loader re-runs with the last non-undefined params.',
      why: 'The resource does not remember and replay old params. Once params are `undefined` the resource is idle; it is waiting, not repeating.',
    },
  ];
  /**
   * Which user to load. Changing it re-runs the loader and aborts any request
   * still in flight.
   */
  protected readonly userId = signal(1);

  /**
   * The user resource: params, loader, and the loading/error state it tracks for
   * you.
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
   * Loads the next user.
   */
  protected next() {
    this.userId.update((n) => Math.min(10, n + 1));
  }
  /**
   * Loads the previous user.
   */
  protected prev() {
    this.userId.update((n) => Math.max(1, n - 1));
  }
  /**
   * Writes an edit into the resource's value locally, without a request.
   *
   * Shows that a resource's value is writable: optimistic edits are possible, and
   * the next `reload()` or params change overwrites them with the server's answer.
   */
  protected saveLocal() {
    const current = this.userResource.value();
    if (!current || !this.draftName().trim()) return;
    this.userResource.value.set({ ...current, name: this.draftName().trim() });
  }
}
