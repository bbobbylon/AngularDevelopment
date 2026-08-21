/** Straggler fix: lengthen one distractor so the correct option is no longer the
 * unique longest. Answer text and letter references unchanged. */
export default {
  209: { answer: 1, options: [
    `{ user: {id:1}, ticks: 0 } after one full second elapses, then done`,
    `Nothing — forkJoin needs all to complete; interval never does`,
    `{ user: {id:1} } immediately, ignoring the pending ticks`,
    `It errors because you cannot mix finite and infinite sources`,
  ] },
};
