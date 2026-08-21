// Rewrites for the 20 'rxjs'-category questions whose explanations referenced
// distractors by bare original-letter position (e.g. "A is wrong", "C describes...").
// Consumed by scripts/apply-option-rewrites.mjs — do not run that tool from here.

export default {
  81: {
    options: [
      "share() replays the last value to late subscribers; shareReplay does not",
      "shareReplay(1) replays the last value to new subscribers; share does not",
      "They are identical — shareReplay is just an alias with a buffer",
      "share() refcounts automatically; shareReplay keeps the source alive"
    ],
    answer: 1,
    explanation: "`share()` is equivalent to `multicast(new Subject()).refCount()` — when all subscribers unsubscribe the source is torn down; late subscribers miss past emissions. `shareReplay(1)` (with `refCount: true`) replays the last value to any new subscriber even after the source completes — critical for HTTP requests used by multiple components. The claim that share() replays to late subscribers while shareReplay does not has it exactly backwards. Calling them identical aside from a buffer is wrong — their subscriber/replay semantics genuinely differ. The claim that share() refcounts automatically while shareReplay simply keeps the source alive is only partially true for `shareReplay({ bufferSize: 1, refCount: false })` — the default refCount behaviour changed in RxJS 6.4."
  },
  82: {
    options: [
      "of(null) completes the stream; EMPTY throws a brand-new error",
      "of(null) emits one null then completes; EMPTY emits nothing",
      "EMPTY emits undefined; of(null) emits null — effectively the same",
      "of(null) retries the source; EMPTY cancels the subscription"
    ],
    answer: 1,
    explanation: "`of(null)` creates an Observable that emits `null` once and completes — your `next` handler fires with null. `EMPTY` completes immediately without any emission — your `next` handler never fires, only `complete` does. Use `of(fallback)` when the consumer needs a value on error; use `EMPTY` when you want to silently swallow the error and complete the stream. The claim that of(null) completes the stream while EMPTY throws a brand-new error is wrong — EMPTY never throws anything, it just completes with zero emissions. Saying EMPTY emits undefined and is thus 'effectively the same' as of(null) is wrong — EMPTY calls `next` zero times, it never emits undefined or any other value, so anything reading a value from the stream sees nothing at all, not undefined. And of(null) doesn't retry the source, nor does EMPTY cancel a subscription — both operators simply complete; neither performs retry or cancellation logic."
  },
  83: {
    options: [
      "1, 2, 3",
      "0, 1, 2, 3",
      "0",
      "0, 1, 2, 3, 0"
    ],
    answer: 1,
    explanation: "`startWith(0)` prepends the specified value(s) BEFORE the source emits. The output is 0, 1, 2, 3 — the prepended value first, then the source values. Omitting the prepended 0 and showing just 1, 2, 3 is wrong — that drops startWith's contribution entirely. Showing only 0 is wrong — the source's own values are still emitted afterward. And showing 0, 1, 2, 3, 0 is wrong — startWith only prepends, it does not also append the value again at the end."
  },
  84: {
    options: [
      "It scans the source for a value and filters non-matching ones",
      "It accumulates like Array.prototype.reduce, but emits each running accumulated result as it goes",
      "It buffers all emissions and emits them as one array at the end",
      "It is identical to reduce() but works on hot Observables"
    ],
    answer: 1,
    explanation: "`scan((acc, val) => acc + val, 0)` on `of(1, 2, 3)` emits 1, 3, 6 — unlike `reduce()` which only emits the final value. `scan()` emits after EVERY item, making it perfect for building a running total, an accumulated array (`scan((acc, item) => [...acc, item], [])`), or an event log. Describing it as scanning for a value and filtering non-matches is wrong — that's what `filter` does. Describing it as buffering everything and emitting one array at the end is wrong — that's `toArray()`. And it isn't simply reduce() restricted to hot Observables — `reduce()` emits only the final value (and only once the source completes) regardless of whether the source is hot or cold, whereas `scan()` emits every intermediate value as it goes."
  },
  85: {
    options: [
      "throttleTime waits 1s after the last event; debounceTime every 1s",
      "debounceTime waits for 1s of silence before emitting; throttleTime emits immediately, then silences for 1s",
      "They are identical — use whichever one is already imported",
      "throttleTime is deprecated; you should always use debounceTime"
    ],
    answer: 1,
    explanation: "`debounceTime(300)` waits for a pause — fire only after the user stops typing for 300ms. `throttleTime(1000)` rate-limits — fire immediately but then ignore events for 1000ms. Use debounce for inputs, search, autocomplete. Use throttle for scroll, resize, drag, or any rapid event where you want a guaranteed max frequency. Claiming throttleTime waits until 1s after the last event while debounceTime just fires on a flat every-1s cadence reverses their actual behaviour. They are not interchangeable 'use whichever is imported' — swapping them changes the UX outcome (immediate-then-silenced vs. wait-for-a-pause). And throttleTime is not deprecated — both operators are current APIs serving different purposes."
  },
  86: {
    options: [
      "Observable.interval(500) — the static creation helper method",
      "interval(500) from \"rxjs\" — emits 0, 1, 2... every 500ms",
      "timer(500) from \"rxjs\" — the recurring timer creator",
      "fromEvent(window, \"timer\", 500) — a timer DOM event"
    ],
    answer: 1,
    explanation: "`interval(500)` from the `rxjs` package emits an incrementing integer (0, 1, 2...) every 500ms indefinitely. You subscribe and clean up via `takeUntilDestroyed()` or `unsubscribe()`. The `Observable.interval(...)` static-method form is wrong — no such API exists in modern RxJS; the correct import is the standalone `interval(500)` function. Calling `timer(500)` 'the recurring timer creator' is wrong — `timer(500)` alone fires ONCE after 500ms and completes; only the two-argument form `timer(500, 500)` repeats. And `fromEvent(window, \"timer\", 500)` is wrong — `fromEvent` listens for real DOM/EventEmitter events, there is no built-in 'timer' event, and it doesn't accept a delay argument like that."
  },
  87: {
    options: [
      "It merges a$ and b$ so the two run fully in parallel",
      "When a$ emits, it grabs b$'s latest and pairs them as a tuple",
      "It replaces each a$ emission with the latest b$ value",
      "It subscribes to b$ first and waits for it to complete before a$"
    ],
    answer: 1,
    explanation: "`withLatestFrom(b$)` combines the latest `a$` emission with the most recent `b$` value. It only subscribes to `b$` once (when the outer Observable subscribes) and reads its cached latest value on each `a$` emission. If `b$` has not yet emitted, the `a$` value is silently dropped. Use it for \"on this action, also grab the current state\". Describing it as merging a$ and b$ so both run fully in parallel is wrong — b$'s values never surface on their own, they only ever ride along with an a$ emission. Saying it replaces each a$ emission with b$'s latest value is wrong — a$'s own value is preserved and paired with b$'s, not discarded. And it doesn't subscribe to b$ first and wait for it to complete — both are subscribed together, it simply reads whatever b$'s latest cached value happens to be whenever a$ emits."
  },
  88: {
    options: [
      "It delays the subscription to observable$ by one microtask",
      "It re-runs the factory function fresh for each new subscriber, which is what makes it lazy",
      "It stores the Observable reference and replays it on subscribe",
      "It is equivalent to shareReplay(1) but without any caching"
    ],
    answer: 1,
    explanation: "`defer(factory)` calls `factory()` fresh for each subscriber, ensuring each gets a brand new Observable. Use it when the Observable depends on a value that may change between subscriptions (e.g., `defer(() => of(Date.now()))`), or to defer the creation of a hot Observable until subscription. It is not a time-delay mechanism — the 'delays by one microtask' framing is wrong, since defer's factory runs synchronously at subscription time rather than after some scheduled tick. It also doesn't store a single Observable reference and replay it — that would defeat the whole purpose, since a fresh Observable is created per subscriber rather than one cached instance being replayed. And comparing it to shareReplay(1) without caching is wrong — defer has no caching or multicasting behaviour at all; each subscriber gets its own fully independent execution, same as any other cold Observable."
  },
  90: {
    options: [
      "It emits values in pairs, waiting for two then resetting",
      "It emits [prev, curr] for every emission after the first",
      "It combines two Observables into pairs, exactly like zip()",
      "It is functionally identical to bufferCount(2) in every case"
    ],
    answer: 1,
    explanation: "`pairwise()` on `of(1, 2, 3, 4)` emits `[1,2]`, `[2,3]`, `[3,4]` — sliding window of the previous and current value. The first value is always dropped because there is no previous to pair it with. Use it to detect direction changes (previous route vs current route), calculate deltas, or animate between states. The 'waits for two then resets' framing is wrong — pairwise doesn't batch in resetting chunks, it's a sliding window, so consecutive pairs share a value (3 appears in both [2,3] and [3,4]). It's not combining two separate Observables the way `zip()` does either — pairwise operates on a single source's successive values, not two independent streams. And it isn't functionally identical to bufferCount(2) — bufferCount(2) on 1,2,3,4 would emit non-overlapping [1,2] then [3,4], not the overlapping sliding pairs pairwise produces."
  },
  91: {
    options: [
      "HttpClient simply cannot be used inside service constructors",
      "http.get() is cold; nothing subscribes, so no request fires",
      "The request fires but the response is lost with no subscriber",
      "Angular retries the request automatically if it fails once"
    ],
    answer: 1,
    explanation: "`http.get()` returns a COLD Observable. Simply calling it creates an Observable object but no HTTP request is made until a subscriber calls `.subscribe()`. This is the most common Angular gotcha for developers coming from Promises. Fix: `.subscribe(res => this.config = res)`, use `toSignal(http.get(...))`, or store and expose the Observable for consumers to subscribe. The claim that HttpClient simply can't be used inside a constructor is wrong — it works fine there; the real issue is purely about never subscribing. Saying the request fires but the response gets lost is also wrong — with no subscriber the request never fires in the first place, since the Observable is cold. And there's no automatic single retry happening either — nothing at all happens without a subscription, retried or otherwise."
  },
  92: {
    options: [
      "first() throws EmptyError on no emit; take(1) stays silent",
      "take(1) waits for completion; first() unsubscribes after one",
      "first() applies only to BehaviorSubject; take(1) to any source",
      "They are completely identical in every possible case"
    ],
    answer: 0,
    explanation: "`first()` throws `EmptyError` if the source completes without emitting — it REQUIRES a value. `take(1)` completes silently after 0 or 1 emissions. `first(predicate)` also finds the first matching value and throws if none match. Use `take(1)` when a no-emission case is acceptable; use `first()` when a missing value is an error condition. Claiming take(1) waits for the source to complete while first() unsubscribes after one emission is wrong — both operators unsubscribe as soon as they get their single value; take(1) does not wait around for completion. Restricting first() to BehaviorSubject sources is wrong — first() works on any Observable, not only Subjects. And they are not completely identical in every case — the EmptyError-on-no-emission behaviour described above is exactly the difference that distinguishes them."
  },
  93: {
    options: [
      "retry() must always be placed after catchError() in the pipe",
      "retry(3) retries on ANY error, even a 404; filter to transient",
      "catchError is not allowed to re-throw an error; return EMPTY instead",
      "The subscription is GC'd because no reference is stored"
    ],
    answer: 1,
    explanation: "`retry(3)` blindly retries on any error — including 404 Not Found or 403 Forbidden that will NEVER succeed no matter how many times you retry. Best practice: use `retry({ count: 3, delay: (err) => err.status >= 500 ? timer(1000) : throwError(() => err) })` to retry only server errors. Claiming retry() must always be placed after catchError() in the pipe is wrong — the order shown here (retry, then catchError) is exactly correct for retrying before falling back to error handling; reversing it would let catchError swallow the error before retry ever saw it. Claiming catchError can't re-throw an error is wrong — `throwError(() => err)` inside catchError is a completely valid, common pattern for re-propagating an error after logging it. And the subscription isn't being wrongly garbage-collected — an unstored subscription reference is fine for a one-shot HTTP call like this one, even though storing it for manual unsubscription is generally good practice elsewhere."
  },
  94: {
    options: [
      "It stops combineLatest subscribing until both a$ and b$ emit",
      "combineLatest emits once all have; the filter drops null states",
      "filter() forces emission only when BOTH streams change together",
      "It converts a hot combineLatest into a cold Observable"
    ],
    answer: 1,
    explanation: "`combineLatest` emits after every source has emitted at least once. But if you initialise `BehaviorSubject`s with `null` as a placeholder, the first combined emission will be `[null, null]` — potentially causing errors in the downstream. The `filter` guards against this initial null state. Claiming the filter delays combineLatest's subscription until both streams emit is wrong — combineLatest subscribes to all sources immediately regardless of any downstream filter; the filter only affects what passes through afterward. Claiming filter forces emission only when both streams change together is wrong — after the initial combined emission, combineLatest re-emits whenever ANY single source emits a new value, not only when both change simultaneously. And there's no hot-to-cold conversion happening — combineLatest's multicast relationship to its sources is unaffected by piping the result through filter."
  },
  95: {
    options: [
      "It subscribes to both of them and then emits from whichever is first",
      "It checks the condition lazily at subscription, per subscriber",
      "It creates a conditional merge based on each emitted value",
      "iif() is now deprecated — use a plain ternary of observables"
    ],
    answer: 1,
    explanation: "`iif(() => this.isAdmin, adminObs$, userObs$)` defers the condition check to subscription time. The condition function is called fresh for each subscriber, so if the condition changes between subscriptions, different subscribers may get different Observables. This is distinct from `condition ? trueObs$ : falseObs$` which evaluates eagerly at construction time. The 'subscribes to both and emits whichever resolves first' framing is wrong — only one of the two Observables is ever subscribed to, chosen by the condition's value at subscription time; the other is never touched. And iif() is not deprecated — it remains a valid, commonly used operator in current RxJS."
  },
  155: {
    options: [
      "It merges the sources and emits every value as they each arrive",
      "It waits for every source Observable to complete, then emits an array of their final values together",
      "It subscribes to a$, then b$, then c$ strictly sequentially",
      "It emits the first value from whichever emits first, then stops"
    ],
    answer: 1,
    explanation: "`forkJoin` subscribes to all sources simultaneously and waits for ALL to complete, then emits `[lastValueOfA, lastValueOfB, lastValueOfC]`. Perfect for parallel HTTP requests where you need all responses before proceeding. If any source never completes or errors, forkJoin never emits. Emitting every value as each source arrives describes `merge`, not forkJoin. Subscribing to each source strictly in sequence describes `concat`, not forkJoin. And emitting only the first value from whichever source resolves first, then stopping, describes `race` — forkJoin instead waits for every source to complete before emitting one combined array."
  },
  163: {
    options: [
      "The mergeMap operator simply cannot be used together with HttpClient",
      "mergeMap runs every request concurrently, so a stale response can overwrite a newer one; use switchMap instead",
      "valueChanges does not emit on the initial control value",
      "mergeMap requires a resultSelector second argument"
    ],
    answer: 1,
    explanation: "`mergeMap` (aka `flatMap`) subscribes to all inner Observables concurrently. For search, if the user types quickly, multiple HTTP requests fly simultaneously. Responses arrive out of order — a slow earlier request can overwrite a fast later one. Fix: `switchMap` automatically unsubscribes from the previous inner Observable when a new value arrives, ensuring only the latest request's response is used. Claiming mergeMap simply can't be used together with HttpClient is wrong — it works fine mechanically; the problem is purely the concurrency/ordering behaviour described above, not a compatibility restriction. Claiming valueChanges doesn't emit on the initial control value is wrong (and beside the point) — valueChanges emits on every change after subscription, which is exactly what triggers the concurrent requests in the first place. And mergeMap doesn't require a resultSelector argument — that's a long-deprecated optional second parameter, not a requirement, and it has nothing to do with this race condition."
  },
  170: {
    options: [
      "exhaustMap cancels the current inner when a new value arrives",
      "exhaustMap ignores every new source value while its current inner Observable is still active",
      "exhaustMap is identical to concatMap but runs in parallel",
      "exhaustMap subscribes to all inners, emitting whichever is first"
    ],
    answer: 1,
    explanation: "While `switchMap` cancels the in-progress inner Observable on each new source value, `exhaustMap` ignores new source values entirely while an inner Observable is still active. Perfect for a Save button — if a save is in progress, additional clicks are silently ignored until the current save completes. Use `switchMap` for cancellable operations (search), `concatMap` for ordering, `mergeMap` for parallelism, `exhaustMap` for ignoring duplicates. Cancelling the current inner Observable when a new value arrives is what `switchMap` does, not exhaustMap — that's effectively the opposite of exhaustMap's ignore-while-busy behaviour. Calling it 'concatMap but running in parallel' is wrong and self-contradictory — concatMap queues and runs inners strictly one after another, and exhaustMap doesn't run anything in parallel either; it just drops new values while busy rather than queueing them. And subscribing to all inners and emitting whichever resolves first describes `race`, not exhaustMap."
  },
  176: {
    options: [
      "2, 4, 6 (once) — the result is shared between both subscribers",
      "2, 4, 6, 2, 4, 6 — each subscription re-runs the cold source",
      "An error — you cannot subscribe to an Observable more than once",
      "2, 2, 4, 4, 6, 6 — the values interleave between subscribers"
    ],
    answer: 1,
    explanation: "`of(1,2,3)` is a COLD Observable — every `subscribe()` call creates a brand new, independent execution. Both subscriptions run the full sequence independently, logging 2, 4, 6 twice. This contrasts with HOT Observables (like `fromEvent`, `Subject`) which share one execution. Getting 2, 4, 6 only once, shared between subscribers, would be the behaviour of a hot or multicasted Observable (for example after piping through `share()`) — not this plain cold `of(...).pipe(map(...))` chain. Throwing an error on the second subscribe is wrong — multiple independent subscriptions to a cold Observable are fully supported and expected. And the values don't interleave between subscribers either — each cold subscription runs its own synchronous execution to completion before control returns to the next subscribe call, so there's no interleaving of 2, 2, 4, 4, 6, 6."
  },
  184: {
    options: [
      "It makes template expressions run async so they never block render",
      "It subscribes in the template and auto-unsubscribes on destroy",
      "It converts a Promise to an Observable before template use",
      "It is required to use async/await inside component methods"
    ],
    answer: 1,
    explanation: "`{{ data$ | async }}` or `@if (user$ | async; as user)` subscribes to the Observable and renders the current value. Crucially, it automatically calls `unsubscribe()` in `ngOnDestroy`, preventing memory leaks. Multiple async pipes on the same Observable create multiple subscriptions — use `shareReplay(1)` or a single `@let` variable to share one subscription. Framing it as making template expressions 'run async so they never block render' is wrong — it doesn't change change-detection or rendering timing; it's purely a subscribe/unsubscribe convenience wired into the template. It doesn't convert a Promise to an Observable either — the async pipe actually accepts both Promises and Observables directly, subscribing to or resolving whichever is passed in, with no conversion step needed by the developer. And it has nothing to do with enabling async/await inside component methods — that's native JavaScript syntax, entirely unrelated to this template feature."
  },
  192: {
    options: [
      "They are identical — ReplaySubject(1) is a BehaviorSubject alias",
      "Both replay the most recent value to late subscribers, but ReplaySubject(1) starts empty until something is emitted",
      "ReplaySubject(1) emits asynchronously; BehaviorSubject is sync",
      "ReplaySubject replays to all; BehaviorSubject only to new ones"
    ],
    answer: 1,
    explanation: "The key practical difference is the initial state requirement. `BehaviorSubject` must be constructed with a value (`new BehaviorSubject<User | null>(null)`) and always has a `.value` getter. `ReplaySubject(1)` is empty until the first `next()` call — late subscribers get nothing if no value has been emitted yet. Use BehaviorSubject when there is a sensible initial state; use ReplaySubject(1) when \"no value yet\" is a valid state you want to preserve. They are not identical or aliases of one another — the initial-value requirement described above is a real behavioural difference, not just a naming difference. Both are synchronous in how they emit — the claim that ReplaySubject(1) emits asynchronously while BehaviorSubject is sync is wrong; neither introduces asynchrony on its own. And 'ReplaySubject replays to all' is imprecise and wrong — both Subjects replay their retained value only to newly-arriving late subscribers, not to subscribers already receiving live emissions."
  }
};
