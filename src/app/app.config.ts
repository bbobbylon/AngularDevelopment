import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

/**
 * Root application providers — everything the app needs bootstrapped once.
 *
 * - `provideBrowserGlobalErrorListeners()` routes uncaught errors and unhandled
 *   promise rejections into Angular's error handler instead of letting them
 *   vanish into the console.
 * - `withComponentInputBinding()` binds route params straight to component
 *   `input()`s, so lesson pages read their id as a normal input rather than
 *   injecting `ActivatedRoute`.
 * - `withViewTransitions()` opts navigations into the View Transitions API,
 *   giving the cross-fade between lessons for free where the browser supports
 *   it and degrading silently where it does not.
 * - `withFetch()` puts `HttpClient` on the Fetch API rather than `XMLHttpRequest`.
 *   The app makes no real network calls, but several lessons demonstrate
 *   `HttpClient`, and Fetch is the modern default.
 *
 * @see app.routes.ts for the route table this consumes.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch()),
  ],
};
