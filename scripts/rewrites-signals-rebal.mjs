/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "signals" MC questions. Distractor text and answer index unchanged. Also
 * doubles as the fix for the 5 ids (30, 169, 70, 6, 67) that were
 * strictly-shortest. */
export default {
  30: { answer: 1, options: [
    `effect() is not allowed to be created inside a component constructor`,
    `Reading count() and then setting it again inside the same effect creates an infinite re-triggering cycle`,
    `You must use computed() instead for any kind of numeric state derivation`,
    `effect() cannot call signal.set(); only read-only operations are allowed`,
  ] },
  169: { answer: 1, options: [
    `toSignal() converts a Promise to a signal; it cannot handle Observables`,
    `Wraps an Observable as a read-only signal that updates on each emission; needs an injection context to subscribe`,
    `toSignal() sets up a two-way binding between an Observable and a signal`,
    `toSignal() behaves just like takeUntilDestroyed — it only handles cleanup`,
  ] },
  70: { answer: 1, options: [
    `Export one global signal object and mutate it freely from any component`,
    `Keep writable signals private, expose them publicly via readonly()/asReadonly(), and expose named mutator methods`,
    `Keep state in a BehaviorSubject and pipe it to a signal in each component`,
    `Store all of the state in the router query params so it syncs to the URL`,
  ] },
  6: { answer: 1, options: [
    `computed() cannot be a const; use let with an explicit generic type`,
    `price and tax are both signals, so you must call them as functions to read: price() + tax()`,
    `A numeric signal and a decimal signal cannot be added due to typing`,
    `computed() must return an Observable, not a plain numeric value here`,
  ] },
  67: { answer: 1, options: [
    `The signal will only ever store arrays — the equal function is a type guard`,
    `Arrays of the same length are treated as equal by default reference equality, so consumers are never notified`,
    `The signal throws whenever you set an array of a different length than before`,
    `It switches on deep structural equality checking for the nested array items`,
  ] },
  223: { answer: 1, options: [
    `Nothing — it is honestly just a shorter syntax for the same behavior`,
    `A reactive re-fetch whenever the request changes, exposing value/status/error signals plus abort support`,
    `It caches every one of the results permanently and then never refetches`,
    `It converts an Observable into a Promise for you behind the scenes here`,
  ] },
  346: { answer: 1, options: [
    `"computing" three times (once per value), and then it prints 6, 6`,
    `"computing" only once, then 6, then 6 again — computed() is both lazy and memoized here`,
    `"computing", 6, "computing", 6 — every single read recomputes the body`,
    `"computing", 2, then 6, 6 — the intermediate value 2 prints in between`,
  ] },
  349: { answer: 1, options: [
    `toSignal waits for the first template read before it ever subscribes`,
    `It subscribes immediately, requires an injection context, and reads as undefined before the first emission`,
    `It throws an error at you unless the source observable actually completes`,
    `It re-subscribes to the source observable again on every single read`,
  ] },
  8: { answer: 1, options: [
    `signal() cannot be used inside services; use a BehaviorSubject instead`,
    `items is exposed as a public writable signal; keep it private instead and expose it via asReadonly()`,
    `computed() may not reference other signals from its own store class here`,
    `Stateful services must extend the NgRx StoreModule or add lifecycle hooks`,
  ] },
  75: { answer: 1, options: [
    `It chains two signals so setting one sets the other, bidirectionally`,
    `A writable signal that automatically resets to a newly derived value whenever its source signal changes`,
    `A performance-tuned variant of computed() for deeply nested object trees`,
    `It links a signal to an Observable stream so it updates automatically here`,
  ] },
  162: { answer: 1, options: [
    `effect() is for synchronous logic while computed() is meant for async`,
    `computed() lazily derives and memoizes a signal value; effect() exists only to run side effects`,
    `effect() re-runs each change-detection cycle; computed() only when read`,
    `They are interchangeable — just use whichever one happens to read cleaner`,
  ] },
};
