// Rewrites for the 22 'signals'-category questions whose explanations referenced
// distractors by bare original-letter position (A/B/C/D). Consumed by
// scripts/apply-option-rewrites.mjs. Do not run that tool from here — a human
// runs it centrally after all category rewrite modules are ready.

export default {
  66: {
    options: [
      "http.get() is simply not allowed to be called inside of an effect",
      "The .subscribe() is never cleaned up, so rapid changes stack subscriptions",
      "this.user.set() is simply not allowed to be called inside of an effect",
      "effect() re-runs synchronously on every single change-detection cycle here"
    ],
    answer: 1,
    explanation: "Each time `userId` changes, the effect re-runs and creates a NEW subscription, but the previous one is never unsubscribed. Multiple in-flight HTTP requests accumulate. Fix: use the cleanup function — `effect((onCleanup) => { const sub = ...; onCleanup(() => sub.unsubscribe()); })` — or better, replace the pattern with `resource(() => ({ request: this.userId(), loader: ({ request: id }) => firstValueFrom(this.http.get('/api/user/' + id)) }))`. The claim that `this.user.set()` isn't allowed inside an effect is wrong — `set()` is allowed in effects (though using computed() is cleaner for derived values)."
  },
  67: {
    options: [
      "The signal will only ever store arrays — the equal function is a type guard",
      "Arrays of the same length are treated as equal by default reference equality, so consumers are never notified",
      "The signal throws whenever you set an array of a different length than before",
      "It switches on deep structural equality checking for the nested array items"
    ],
    answer: 1,
    explanation: "signals use `Object.is()` by default. A custom `equal` function overrides this — Angular only notifies dependents when the function returns `false`. Here, two arrays of equal length are treated as identical regardless of content. This is a performance optimisation for cases where length is the only thing views care about. The \"type guard\" idea is wrong — `equal` is a comparison function, not a type restriction, so the signal can still hold anything. The \"throws on different length\" idea is wrong — mismatched lengths just count as unequal and trigger notification, they don't throw. The \"deep structural equality\" idea is wrong — the function shown compares only `.length`, not the nested items."
  },
  68: {
    options: [
      "A Promise that resolves once to the signal's current value on read",
      "An Observable that emits the value now, then on every later change",
      "A Subject you must manually push the signal's values into yourself",
      "An Observable that emits once with the final value on component destroy"
    ],
    answer: 1,
    explanation: "`toObservable(signal)` from `@angular/core/rxjs-interop` creates an Observable that emits the current value synchronously on subscription (via `ReplaySubject(1)` semantics) and then emits on every subsequent signal change. It creates an internal `effect()` to watch the signal and push to the Subject. Use it to bridge signals with RxJS operators. The \"resolves once as a Promise\" idea is wrong — it is an Observable, not a Promise. The \"Subject you push into yourself\" idea is wrong — it is auto-managed internally. The \"emits once on destroy\" idea is wrong — it is a live stream that emits on every change, not just at teardown."
  },
  69: {
    options: [
      "The read is not tracked as a dependency, so the context will not re-run",
      "It logs the signal read to the Angular DevTools without a dependency",
      "It takes a one-time snapshot of the value that then never updates again",
      "It throws if used inside a computed — it is valid only within effects"
    ],
    answer: 0,
    explanation: "`untracked()` executes a function outside the reactive tracking context. Any signals read inside `untracked()` are NOT registered as dependencies. This is useful when you need a signal's value for a side-effect purpose but do not want the computed/effect to re-run when that signal changes. The \"logs to DevTools\" idea is wrong — no DevTools logging occurs. The \"one-time snapshot\" idea is wrong — it does not snapshot; the value is live if read again later. The \"only valid in effects\" idea is wrong — `untracked` works in both `computed` and `effect`."
  },
  70: {
    options: [
      "Export one global signal object and mutate it freely from any component",
      "Keep writable signals private, expose them publicly via readonly()/asReadonly(), and expose named mutator methods",
      "Keep state in a BehaviorSubject and pipe it to a signal in each component",
      "Store all of the state in the router query params so it syncs to the URL"
    ],
    answer: 1,
    explanation: "The \"mini-store\" pattern: private `_items = signal<Item[]>([])`, public `readonly items = this._items.asReadonly()`, public `addItem(item: Item)` method. This gives components read access but only the service can mutate state, preventing race conditions and making state flows traceable. The \"one global mutable signal object\" idea is wrong — global mutable signals produce untraceable mutations. The \"BehaviorSubject piped to a signal per component\" approach works but mixes paradigms unnecessarily. The \"router query params\" idea is wrong — router query params do not auto-sync with signals."
  },
  72: {
    options: [
      "rxResource() is always faster, so you should just prefer it every time",
      "When the loader returns an Observable (HttpClient) instead of a Promise",
      "rxResource() caches its results permanently; resource() never caches at all",
      "rxResource() works under SSR while resource() is strictly browser-only"
    ],
    answer: 1,
    explanation: "`rxResource()` (from `@angular/core/rxjs-interop`) accepts a `loader` returning an `Observable<T>`, while `resource()` accepts one returning `Promise<T>`. Since Angular's `HttpClient` returns Observables, `rxResource()` integrates naturally without needing `firstValueFrom()`. Both expose the same `value`, `status`, `isLoading`, and `error` signals. The \"always faster\" claim is wrong — neither is universally faster. The \"permanent caching\" claim is wrong — neither provides permanent caching. The \"SSR vs browser-only\" claim is wrong — both have the same SSR limitations."
  },
  73: {
    options: [
      "The component renders \"0\" — required inputs default to 0",
      "Angular throws a runtime error: required input \"start\" must be provided",
      "The component renders \"NaN\" because start is undefined",
      "TypeScript prevents compilation if start is not bound in the parent template"
    ],
    answer: 1,
    explanation: "`input.required<T>()` enforces that the parent must provide a value. Angular throws a runtime error at component initialisation if the binding is missing. The error message is \"Required input 'start' is not provided.\" The \"renders 0\" idea is wrong — there is no default-to-zero behaviour. The \"renders NaN\" idea is wrong — it never reaches rendering. The \"TypeScript prevents compilation\" idea is wrong — the check is at runtime, not compile time (though Angular's language service in strict mode may warn)."
  },
  74: {
    options: [
      "this.myOutput.next(value)",
      "this.myOutput.emit(value)",
      "this.myOutput.set(value)",
      "this.myOutput.push(value)"
    ],
    answer: 1,
    explanation: "`output()` returns an `OutputEmitterRef` and you call `.emit(value)` to fire it — identical to `EventEmitter.emit()`. The `.next(value)` idea is wrong — `.next()` is the Subject/Observable API. The `.set(value)` idea is wrong — `.set()` is the signal write API. The `.push(value)` idea is wrong — `.push()` is the Array API. The `output()` function is the modern replacement for `@Output() myOutput = new EventEmitter()`."
  },
  75: {
    options: [
      "It chains two signals so setting one sets the other, bidirectionally",
      "A writable signal that automatically resets to a newly derived value whenever its source signal changes",
      "A performance-tuned variant of computed() for deeply nested object trees",
      "It links a signal to an Observable stream so it updates automatically here"
    ],
    answer: 1,
    explanation: "`linkedSignal({ source: items, computation: items => items[0] })` creates a writable signal that resets to `items[0]` whenever `items` changes, but can be overridden by the user in between resets. `computed()` is purely derived and read-only. Use `linkedSignal()` for \"selected item defaults to first but user can change\" patterns. The \"bidirectional chaining\" idea is wrong — it is not bidirectional linking between two independent signals. The \"performance-tuned variant for deeply nested trees\" idea is wrong — linkedSignal isn't about performance for nested data at all; it's about writable, resettable derived state, and offers no special diffing for deep object trees beyond what computed() already does. The \"links to an Observable stream\" idea is wrong — linkedSignal's source is a synchronous computation over other signals, not an Observable; that kind of interop is what toSignal() is for."
  },
  76: {
    options: [
      "A plain array holding the matching ItemComponent instances in the view",
      "A Signal<ReadonlyArray<ItemComponent>> that updates as children change",
      "A QueryList<ItemComponent> that emits whenever the children change here",
      "One ItemComponent instance — use viewChildren for the plural form here"
    ],
    answer: 1,
    explanation: "`viewChildren(ItemComponent)` (Angular 17+) is the signal-based plural query. It returns a `Signal<ReadonlyArray<T>>` — you read it as `this.items()` and it reactively updates when the list changes. The \"plain array\" idea is wrong — it is a signal, not a plain array. The \"QueryList that emits\" idea is wrong — `QueryList` is the old `@ViewChildren` API. The \"single instance, use viewChildren for plural\" idea is wrong — `viewChildren` IS the plural form."
  },
  77: {
    options: [
      "Signals are synchronous and type-safe; FormControl is Observable-based",
      "FormControl renders faster; signal() is the faster option for services",
      "Signals cannot hold complex objects; FormControl is built for nested data",
      "They are equivalent — Angular converts signals to FormControls for you"
    ],
    answer: 0,
    explanation: "signals are synchronous reactive primitives ideal for UI state; `FormControl` provides an Observable-based API with built-in validation, dirty/touched/pristine tracking, and integration with Angular Forms directives (`formControlName`, validators). For a simple counter or toggle, use signal(). For a form field that needs validation, error display, and `FormGroup` coordination, use `FormControl`. The \"FormControl renders faster / signal() is faster for services\" claim is wrong — it's an incoherent performance comparison with no basis; speed isn't the axis that distinguishes the two. The \"signals cannot hold complex objects\" claim is wrong — a signal can hold any value, including nested objects and arrays, just as easily as a primitive. The \"Angular converts signals to FormControls for you\" claim is wrong — no such automatic conversion exists; bridging the two requires explicit code."
  },
  78: {
    options: [
      "computed() flatly does not allow any conditional logic inside its body",
      "A throw marks the computed errored and re-throws to every reader of it",
      "The error is swallowed silently, so result() simply returns undefined",
      "computed() catches the thrown error for you and returns null in its place"
    ],
    answer: 1,
    explanation: "If a `computed()` getter throws, Angular stores the error and re-throws it every time the computed signal is read. Any template expression that reads it will throw during change detection. Handle this by either catching inside the computed (`try/catch` returning a fallback), or guarding reads with `@if (divisor() !== 0)`. The \"no conditional logic allowed\" idea is wrong — conditional logic is fine inside computed(). The \"error is swallowed silently\" idea is wrong — errors are not swallowed. The \"computed() catches and returns null\" idea is wrong — there is no automatic null fallback."
  },
  79: {
    options: [
      "Simply call fixture.detectChanges() a second consecutive time",
      "Use TestBed.flushEffects() (or tick() in fakeAsync); they are async",
      "Effects flush automatically once you read a signal — no test code needed",
      "Wrap the assertion in a setTimeout(() => { ... }, 0) callback instead"
    ],
    answer: 1,
    explanation: "Angular effects are scheduled microtasks. In tests, `TestBed.flushEffects()` (Angular 18+) or `tick()` inside `fakeAsync()` forces all pending effects to run immediately. Without it, assertions run before the effect fires and the test sees stale state. The \"call detectChanges() twice\" idea is wrong — `detectChanges()` runs change detection but does not guarantee effect flushing. The \"effects flush automatically on signal read\" idea is wrong — reading a signal does not trigger effect execution. The \"wrap in setTimeout\" idea is wrong — using setTimeout makes tests brittle and timing-dependent."
  },
  80: {
    options: [
      "Calling set() inside any effect is simply not allowed by the framework",
      "It syncs one signal to another via a side effect — use computed() instead",
      "The effect will throw because doing this creates a real dependency cycle here",
      "Effects that call set() were formally deprecated back in Angular 18+"
    ],
    answer: 1,
    explanation: "The Angular team explicitly discourages using `effect()` to copy signal values from one to another. `computed()` is synchronous, lazy, and glitch-free — it guarantees the derived value is always consistent. `effect()` fires asynchronously after render, meaning there is a brief window where `b` has not yet updated. Use `const b = computed(() => a() + 1)` instead. The \"set() is never allowed in effects\" idea is wrong — you CAN set inside effects (with `allowSignalWrites: true` on older versions, or unguarded on the modern API). The \"this always throws from a dependency cycle\" idea is wrong — cycles only occur if both signals end up reading each other, which isn't the case here. The \"formally deprecated in Angular 18+\" idea is wrong — there's no such deprecation; effect() writes to signals remain a supported capability, just discouraged style for this particular sync-copy use case."
  },
  153: {
    options: [
      "Angular always notifies dependents, even when the value is unchanged",
      "By default Object.is() equality skips notifying dependents on equal values",
      "Angular immediately throws a \"duplicate set\" error at you in this case",
      "The signal's internal version counter still increments even on the equal values"
    ],
    answer: 1,
    explanation: "signals use `Object.is()` by default to check equality. If you `set()` the same primitive value or the same object reference, Angular skips notification of dependents entirely. This is a key performance optimisation. To force notification even with equal values, call `.update()` with a new object reference, or provide a custom `equal: () => false` function. The \"always notifies\" claim is wrong — that's the opposite of the default equality-check behavior. The \"throws a duplicate set error\" claim is wrong — setting an equal value is a legal no-op, not an error. The \"version counter still increments\" claim is wrong — the whole point of the equality check is to skip marking the signal dirty, so nothing increments when the value is considered unchanged."
  },
  162: {
    options: [
      "effect() is for synchronous logic while computed() is meant for async",
      "computed() lazily derives and memoizes a signal value; effect() exists only to run side effects",
      "effect() re-runs each change-detection cycle; computed() only when read",
      "They are interchangeable — just use whichever one happens to read cleaner"
    ],
    answer: 1,
    explanation: "`computed()` is for derived state — it produces a read-only signal. `effect()` is for side effects — it produces nothing and is used for things that must happen when state changes (saving to localStorage, updating a third-party chart, logging). A key distinction: `computed()` is lazy (only recalculates when read); `effect()` is eager (runs after every change, scheduled asynchronously). Never use `effect()` purely for derived values — that is `computed()`'s job. The \"effect() is sync, computed() is async\" framing is wrong — both are synchronous JavaScript constructs; neither has an \"async mode.\" The \"effect() re-runs every change-detection cycle\" claim is wrong — it reruns when its tracked dependencies actually change, not on a fixed CD cadence. The \"interchangeable\" claim is wrong — one derives a read/template-facing value, the other performs side effects; swapping them breaks the intended data flow."
  },
  169: {
    options: [
      "toSignal() converts a Promise to a signal; it cannot handle Observables",
      "Wraps an Observable as a read-only signal that updates on each emission; needs an injection context to subscribe",
      "toSignal() sets up a two-way binding between an Observable and a signal",
      "toSignal() behaves just like takeUntilDestroyed — it only handles cleanup"
    ],
    answer: 1,
    explanation: "`toSignal(obs$)` returns `Signal<T | undefined>` unless you provide `{ initialValue: T }` (making it `Signal<T>`) or `{ requireSync: true }` (for synchronous sources like BehaviorSubject). Call it at class construction time inside an injection context. It subscribes immediately and unsubscribes automatically on destroy. The \"converts a Promise, can't handle Observables\" idea is wrong — it works with Observables, not Promises, exactly the reverse of the claim. The \"two-way binding\" idea is wrong — toSignal() only reads from the Observable into the signal; there's no path for writes back into the source. The \"behaves like takeUntilDestroyed, only handles cleanup\" idea is wrong — toSignal() does the actual subscribing and maps each emission into the signal's value; takeUntilDestroyed only handles unsubscription, a narrower, complementary concern."
  },
  172: {
    options: [
      "update() triggers change detection whereas set() does not do so at all",
      "set(value) replaces it; update(fn) maps the current value to a new one",
      "update() is meant for objects while set() is meant only for primitives",
      "They are identical — update(fn) is just shorthand for set(fn(signal()))"
    ],
    answer: 1,
    explanation: "`set(value)` takes a direct value. `update(fn)` takes a function that receives the current value and returns the new one — avoiding the need to read the signal separately before setting. `counter.update(v => v + 1)` is cleaner than `counter.set(counter() + 1)`. The \"update(fn) is just shorthand for set(fn(signal()))\" framing is close but misses the point — `update` is for ergonomics and avoids an extra read expression. The \"update() triggers change detection, set() doesn't\" claim is wrong — both trigger dependents. The \"update() is for objects, set() is for primitives only\" claim is wrong — both work identically regardless of whether the signal holds a primitive or an object."
  },
  179: {
    options: [
      "The phases control which components in the tree get to render first",
      "Four ordered phases (read/write) run reads after writes, avoiding thrash",
      "The phases are used by the Angular animations engine to sequence work",
      "The afterRender phases only ever apply within server-side rendering here"
    ],
    answer: 1,
    explanation: "`afterRender({ read: () => { /* measure DOM */ }, write: () => { /* update DOM */ } })` lets Angular batch DOM reads before DOM writes. Without phase control, alternating read-then-write patterns cause the browser to reflow the page on each pair (layout thrashing). Batching all reads first, then all writes, reduces reflows to one. The \"controls which components render first\" idea is wrong — phase ordering batches DOM read/write callbacks that run after Angular has already rendered; it has nothing to do with component render order. The \"used by the animations engine to sequence work\" idea is wrong — afterRender is a general-purpose DOM lifecycle API, not owned by the animations engine. The \"only applies within SSR\" idea is wrong and actually backwards — afterRender callbacks are specifically for the browser/client; they don't run during server-side rendering at all, since there's no DOM to read or write."
  },
  189: {
    options: [
      "resource() caches responses forever; Observable subscriptions do not",
      "It ties async loading to signals: auto re-fetch, status, and cancellation",
      "resource() is only for HTTP; Observables can work with any async source here",
      "resource() is faster because it uses the Fetch API instead of HttpClient"
    ],
    answer: 1,
    explanation: "`resource()` integrates async loading with Angular's reactive graph. When you do `const id = signal(1); const user = resource({ request: id, loader: ({request}) => fetch(...) })`, changing `id` automatically triggers a re-fetch and the `user.isLoading()`, `user.value()`, `user.error()` signals update accordingly. With a manual Observable subscription, you write all this orchestration yourself. The \"caches forever\" claim is wrong — no permanent caching happens. The \"only for HTTP\" claim is wrong — the loader can wrap any async operation (fetch, any Promise-returning function), not just HTTP calls. The \"faster because it uses Fetch instead of HttpClient\" claim is wrong — the loader can call HttpClient, fetch, or anything else; resource()'s value is reactive orchestration, not raw request speed."
  },
  199: {
    options: [
      "No — signals inside @if blocks never update because the block may not run",
      "Yes — the compiler tracks signal reads in @if, @for and @switch blocks",
      "Only if you manually call detectChanges() after each and every update",
      "Yes, but only for OnPush components; default detection ignores the reads"
    ],
    answer: 1,
    explanation: "Angular's template engine tracks signal reads throughout the entire template, including inside control flow blocks. If `showAdmin()` is a signal read inside `@if (showAdmin())`, and if `user()` inside that block is a signal, both are tracked. When either signal changes, Angular re-evaluates the template. Signal tracking in templates is one of the core benefits of Angular's reactivity model. The \"never updates because the block may not run\" idea is wrong — reads inside the block are tracked live and do update when the block re-enters or its signals change. The \"only via manual detectChanges()\" idea is wrong — no manual call is needed; Angular's scheduler picks up the tracked signal changes automatically. The \"only works with OnPush\" idea is wrong — signal-based template tracking works the same way regardless of the component's change detection strategy."
  },
  262: {
    options: [
      "'b' — the manual override that the user set sticks around permanently",
      "'x' — linkedSignal resets to its derived value when the source changes",
      "'a' — it always returns the original first option no matter what happens",
      "'y' — it takes the last element of the array rather than the first one"
    ],
    answer: 1,
    explanation: "`'x'` is correct. `linkedSignal` is writable but also reactive: `choice.set('b')` overrides it to `'b'`, but the moment its source computation's dependencies change (`options.set([...])`), it RESETS to the freshly derived value `options()[0]`, which is now `'x'`. That is exactly the behavior `computed` cannot give you (computed is read-only) and a plain writable signal cannot give you (it would keep `'b'`). Why the other answers fail: the override is transient — it survives only until the source changes, so it doesn't stick around permanently. It re-derives from the current `options` array, not the original one, so it isn't pinned to the original array's index-0 value forever. And the derivation reads `options()[0]`, not the highest index, so it never takes the tail element of the array."
  }
};
