/** Rebalance pass: lengthen the correct answer with genuine clarifying detail so
 * it becomes the strictly-longest option, on a representative subset of
 * "tooling" MC questions. Distractor text and answer index unchanged. */
export default {
  411: { answer: 1, options: [
    `The npm manifest listing project dependencies and run scripts`,
    `The Angular CLI's workspace config: every project's build/serve/test targets and their options`,
    `The TypeScript compiler configuration used across the project`,
    `A runtime config file the browser fetches during application bootstrap`,
  ] },
  418: { answer: 1, options: [
    `Nothing here matters — CI just needs a newer Node version`,
    `The app's tsconfig now sweeps in the spec files too, and they lack the test runner's "types" entries`,
    `describe must now be imported from @angular/core in every spec file`,
    `The "files" and "extends" keys cannot be used together at all`,
  ] },
  413: { answer: 1, options: [
    `It imported that CSS into every single component's scoped styles`,
    `It bundles the CSS as a global style; angular.json edits aren't watched by the dev server, hence the restart`,
    `It only adds a <link> tag for production builds, never for the dev serve`,
    `Nothing — third-party CSS has to be imported inside main.ts instead`,
  ] },
};
