/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of "state"
 * MC questions. Distractor text and answer index unchanged. Also doubles as the
 * fix for the 4 ids (391, 281, 318, 387) that were strictly-shortest. */
export default {
  391: { answer: 1, options: [
    `computing, computing, before read, computing, 6, computing, 6`,
    `before read, computing, 6, 6 — computed signals are lazily evaluated and then cached`,
    `computing, before read, 6, 6 — the computed runs eagerly once`,
    `before read, computing, 6, computing, 6 — caching is template-only`,
  ] },
  281: { answer: 1, options: [
    `It is the only injection style allowed in Angular 17 and later`,
    `It works in field initializers, functional guards, resolvers, and any plain helper function`,
    `inject() bypasses the injector entirely for better performance`,
    `inject() automatically makes every dependency it reads optional`,
  ] },
  318: { answer: 1, options: [
    `A decorator that hides a component from change detection`,
    `A plain service fronting shared state behind a small, intent-based public API`,
    `A component with no template used only for routing logic`,
    `An HTTP interceptor that caches every single GET request`,
  ] },
  387: { answer: 1, options: [
    `Keep threading inputs/outputs through every intermediate layer`,
    `A root-provided singleton service holding the count as a signal that every component injects`,
    `Store the count in localStorage and poll it in each constructor`,
    `Emit the count through a global window event others listen for`,
  ] },
  251: { answer: 1, options: [
    `It injects the store directly and then manages the global state`,
    `It only takes inputs and emits outputs — no injected services and no application state at all`,
    `It has no template at all, containing only its logic`,
    `It must use OnPush change detection and nothing else matters`,
  ] },
  279: { answer: 1, options: [
    `Plain strings are simply much faster to inject than these tokens`,
    `TypeScript interfaces are fully erased at compile time; an InjectionToken is a real runtime key`,
    `An InjectionToken can only ever hold primitive values`,
    `It automatically makes the provided value an observable`,
  ] },
};
