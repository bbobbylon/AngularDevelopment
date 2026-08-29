import { Component, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  styleUrl: './resource-api.css',
  templateUrl: './resource-api.html',
})
export class ResourceApi {
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
