/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of "rxjs"
 * MC questions. Distractor text and answer index unchanged. Also doubles as the
 * fix for the 5 ids (9, 155, 192, 170, 32) that were strictly-shortest. */
export default {
  9: { answer: 0, options: [
    `map() transforms each emitted value synchronously; switchMap() cancels the stale inner subscription`,
    `map() is for filtering streams; switchMap() is for transforming`,
    `They are aliases for the same operator, just with different names`,
    `switchMap() works only with Observables; map() with any iterable`,
  ] },
  155: { answer: 1, options: [
    `It merges the sources and emits every value as they each arrive`,
    `It waits for every source Observable to complete, then emits an array of their final values together`,
    `It subscribes to a$, then b$, then c$ strictly sequentially`,
    `It emits the first value from whichever emits first, then stops`,
  ] },
  192: { answer: 1, options: [
    `They are identical — ReplaySubject(1) is a BehaviorSubject alias`,
    `Both replay the most recent value to late subscribers, but ReplaySubject(1) starts empty until something is emitted`,
    `ReplaySubject(1) emits asynchronously; BehaviorSubject is sync`,
    `ReplaySubject replays to all; BehaviorSubject only to new ones`,
  ] },
  170: { answer: 1, options: [
    `exhaustMap cancels the current inner when a new value arrives`,
    `exhaustMap ignores every new source value while its current inner Observable is still active`,
    `exhaustMap is identical to concatMap but runs in parallel`,
    `exhaustMap subscribes to all inners, emitting whichever is first`,
  ] },
  32: { answer: 1, options: [
    `1 request — shared across all subscriptions`,
    `3 requests total — a cold Observable re-executes its producer for each new subscription`,
    `0 requests — cold observables never execute`,
    `Depends on Zone.js timer configuration`,
  ] },
  11: { answer: 2, options: [
    `mergeMap — runs all requests concurrently and emits every result`,
    `concatMap — queues the requests sequentially for guaranteed order`,
    `switchMap — cancels the previous in-flight request and switches to the newest one`,
    `exhaustMap — ignores new requests while one is still in flight`,
  ] },
  84: { answer: 1, options: [
    `It scans the source for a value and filters non-matching ones`,
    `It accumulates like Array.prototype.reduce, but emits each running accumulated result as it goes`,
    `It buffers all emissions and emits them as one array at the end`,
    `It is identical to reduce() but works on hot Observables`,
  ] },
  85: { answer: 1, options: [
    `throttleTime waits 1s after the last event; debounceTime every 1s`,
    `debounceTime waits for 1s of silence before emitting; throttleTime emits immediately, then silences for 1s`,
    `They are identical — use whichever one is already imported`,
    `throttleTime is deprecated; you should always use debounceTime`,
  ] },
  88: { answer: 1, options: [
    `It delays the subscription to observable$ by one microtask`,
    `It re-runs the factory function fresh for each new subscriber, which is what makes it lazy`,
    `It stores the Observable reference and replays it on subscribe`,
    `It is equivalent to shareReplay(1) but without any caching`,
  ] },
  163: { answer: 1, options: [
    `The mergeMap operator simply cannot be used together with HttpClient`,
    `mergeMap runs every request concurrently, so a stale response can overwrite a newer one; use switchMap instead`,
    `valueChanges does not emit on the initial control value`,
    `mergeMap requires a resultSelector second argument`,
  ] },
  207: { answer: 1, options: [
    `It buffers every emission forever; cap it with take(1)`,
    `The source Observable stays subscribed even after every subscriber unsubscribes; pass refCount: true to fix it`,
    `shareReplay makes a new subscription per subscriber; use share()`,
    `It only works inside components; move it to a service to fix`,
  ] },
};
