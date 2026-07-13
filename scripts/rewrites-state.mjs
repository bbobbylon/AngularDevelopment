/** Length-balanced option rewrites for the `state` category (24 Qs).
 * All answer indices stay 1. Depth stays in each (untouched) explanation.
 * Backtick strings — no option contains a backtick or ${ . */
export default {
  249: { answer: 1, options: [
    `A wrapper that converts NgRx actions and reducers into signals for you`,
    `A signal store composed from features like withState and withMethods`,
    `A helper for saving signals into localStorage automatically`,
    `A full replacement for Angular's dependency injection system`,
  ] },
  250: { answer: 1, options: [
    `Actions mutate state; reducers dispatch; selectors run HTTP`,
    `Actions are events; reducers are pure (state, action) => state`,
    `They are interchangeable layers usable in any order you like`,
    `Reducers perform the HTTP calls and selectors mutate the store`,
  ] },
  251: { answer: 1, options: [
    `It injects the store directly and then manages the global state`,
    `It takes inputs, emits outputs, holds no services or app state`,
    `It has no template at all, containing only its logic`,
    `It must use OnPush change detection and nothing else matters`,
  ] },
  252: { answer: 1, options: [
    `Reducers are simply not allowed to receive an action payload at all`,
    `Reducers must be pure and return a NEW state object, not mutate`,
    `push() is simply not a valid array method inside reducers`,
    `You must set state.items = [...] rather than returning it`,
  ] },
  253: { answer: 1, options: [
    `createSelector runs the derivation on a separate Web Worker`,
    `It MEMOIZES: recomputes only when input references change`,
    `It is required syntax — selectors cannot be plain functions`,
    `It automatically persists the derived value into storage`,
  ] },
  254: { answer: 1, options: [
    `Effects simply run faster than reducers do at runtime`,
    `Reducers must stay pure; effects isolate impure async work`,
    `Reducers cannot access any services, but effects mutate state`,
    `Effects fully replace reducers in a modern NgRx setup`,
  ] },
  255: { answer: 1, options: [
    `Always — the full NgRx Store has now been officially deprecated`,
    `For local/feature state; full Store suits time-travel, scale`,
    `Never — signals simply cannot hold any shared application state`,
    `Only when the application makes no HTTP calls whatsoever`,
  ] },
  256: { answer: 1, options: [
    `signal(0) should be written signal<number>(0) with an explicit type`,
    `doubled is derived state stored separately — make it a computed`,
    `The store must extend a shared BaseStore class in order to work`,
    `increment() should return the new count value it computed`,
  ] },
  278: { answer: 1, options: [
    `They are completely identical in every respect, scope included`,
    `root is one app-wide singleton; component providers make a new one`,
    `providedIn: 'root' instead creates a fresh instance for each component`,
    `Component providers are global, whereas root scope is local`,
  ] },
  279: { answer: 1, options: [
    `Plain strings are simply much faster to inject than these tokens`,
    `Interfaces are erased at compile time; a token is a runtime key`,
    `An InjectionToken can only ever hold primitive values`,
    `It automatically makes the provided value an observable`,
  ] },
  280: { answer: 1, options: [
    `They control whether the resolved service is a singleton`,
    `@Self() searches only its own injector; @SkipSelf() the parent`,
    `They decide which change detection strategy the given class uses`,
    `@Self means a private service and @SkipSelf a public one`,
  ] },
  281: { answer: 1, options: [
    `It is the only injection style allowed in Angular 17 and later`,
    `It works in field initializers, guards, and helper functions`,
    `inject() bypasses the injector entirely for better performance`,
    `inject() automatically makes every dependency it reads optional`,
  ] },
  282: { answer: 1, options: [
    `They are exact aliases with no meaningful difference whatsoever`,
    `useExisting aliases to the SAME instance; useClass makes a new one`,
    `useExisting instead creates a brand-new instance on every injection`,
    `useExisting works only with an InjectionToken, never a class`,
  ] },
  316: { answer: 1, options: [
    `Have each component poll the other every second to compare`,
    `Lift it to one shared source — a service signal both read`,
    `Pass the array back and forth with @Input/@Output each change`,
    `Store the whole array in a global window.cart variable`,
  ] },
  317: { answer: 1, options: [
    `Use document.querySelector to reach the descendant node directly`,
    `Provide a shared service at an ancestor; descendant injects it`,
    `Emit a global CustomEvent on window and listen everywhere`,
    `Merge the five components into one so no inputs are needed`,
  ] },
  318: { answer: 1, options: [
    `A decorator that hides a component from change detection`,
    `A service fronting state with a small intent-based API`,
    `A component with no template used only for routing logic`,
    `An HTTP interceptor that caches every single GET request`,
  ] },
  319: { answer: 1, options: [
    `Arrays simply cannot be stored in NgRx or signal stores`,
    `O(1) lookup/update by id, no duplicates, stable references`,
    `Normalization compresses the data to save on memory use`,
    `It is only ever needed when you are using a REST API backend`,
  ] },
  320: { answer: 1, options: [
    `Updating the UI only once the server confirms, just to be safe`,
    `Apply the change locally at once, with a rollback on failure`,
    `Retrying the failed requests forever until they succeed`,
    `Batching all writes and syncing them once every minute`,
  ] },
  387: { answer: 1, options: [
    `Keep threading inputs/outputs through every intermediate layer`,
    `A root service holding the count as a signal that all inject`,
    `Store the count in localStorage and poll it in each constructor`,
    `Emit the count through a global window event others listen for`,
  ] },
  388: { answer: 1, options: [
    `It is purely stylistic; exposing the writable signal behaves the same`,
    `It enforces one-way flow: readers can't set, mutations use methods`,
    `asReadonly() makes a defensive deep copy on every single read`,
    `Signals in services need this pattern or CD will not trigger`,
  ] },
  389: { answer: 1, options: [
    `find() returns a copy, so the mutation edits a throwaway object`,
    `Mutated in place, set() got the same reference — Object.is no-op`,
    `set() cannot take a variable; it requires an inline literal value`,
    `Signals can't hold object arrays; switch to a BehaviorSubject`,
  ] },
  390: { answer: 1, options: [
    `Immediately, in every single app — it is the professionalism baseline`,
    `When real coordination problems exist: overlapping writes, effects`,
    `Only when you require SSR, which plain services cannot support`,
    `Never — signals have now made all state libraries fully obsolete`,
  ] },
  391: { answer: 1, options: [
    `computing, computing, before read, computing, 6, computing, 6`,
    `before read, computing, 6, 6 — computeds are lazy and cached`,
    `computing, before read, 6, 6 — the computed runs eagerly once`,
    `before read, computing, 6, computing, 6 — caching is template-only`,
  ] },
  392: { answer: 1, options: [
    `ngOnInit is the wrong hook; ngAfterViewInit would stay fresh`,
    `Single source of truth: ngOnInit snapshotted; use a computed`,
    `Signals cannot be read in ngOnInit; only templates track reads`,
    `The store should push updates into each field via refresh()`,
  ] },
};
