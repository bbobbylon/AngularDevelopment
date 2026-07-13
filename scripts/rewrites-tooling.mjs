/** Length-balanced option rewrites for the `tooling` category (10 Qs).
 * Answer indices unchanged; correct option trimmed into the distractor band,
 * distractors made plausible and comparable, depth left in each (untouched)
 * explanation. Backtick strings — no option contains a backtick or ${ . */
export default {
  409: { answer: 1, options: [
    `Alphabetical convention only — the split carries no real meaning at all`,
    `dependencies ship in the app; devDependencies are build-time-only tools`,
    `devDependencies are optional and may silently fail to install`,
    `Packages in devDependencies cannot be imported from TypeScript`,
  ] },
  410: { answer: 1, options: [
    `Lists the JavaScript files to inject directly into the index.html page`,
    `Names commands run via npm run, with node_modules/.bin on PATH`,
    `Configures the Angular compiler's entry script files`,
    `Registers the service workers used by the production build`,
  ] },
  411: { answer: 1, options: [
    `The npm manifest listing project dependencies and run scripts`,
    `The CLI workspace config: projects, build/serve/test targets, options`,
    `The TypeScript compiler configuration used across the project`,
    `A runtime config file the browser fetches during application bootstrap`,
  ] },
  412: { answer: 1, options: [
    `^ means beta releases, while ~ means only stable releases instead`,
    `^ allows minor+patch, ~ only patch; the lockfile pins exact versions`,
    `They are interchangeable — npm quietly ignores the range prefix entirely`,
    `^ pins the one exact version while ~ allows anything strictly newer`,
  ] },
  413: { answer: 1, options: [
    `It imported that CSS into every single component's scoped styles`,
    `It bundles the CSS globally; angular.json isn't watched, hence restart`,
    `It only adds a <link> tag for production builds, never for the dev serve`,
    `Nothing — third-party CSS has to be imported inside main.ts instead`,
  ] },
  414: { answer: 1, options: [
    `Monetary cost limits applied to each of the app's cloud deployments`,
    `Bundle size thresholds checked at build time — warn, then fail`,
    `Wall-clock time limits on how long a single ng build may run`,
    `Memory usage limits imposed on the dev server process`,
  ] },
  415: { answer: 1, options: [
    `Three fully independent configs that must be kept in sync entirely by hand`,
    `The base holds shared options; app and spec extend it, narrowing scope`,
    `Only tsconfig.app.json is real; the other two are legacy stubs`,
    `They correspond to the dev, staging and production builds`,
  ] },
  416: { answer: 1, options: [
    `Nothing — it is simply an alias for the same strict flag`,
    `It extends strict type-checking into templates; binding typos fail the build`,
    `It forces every component template into a separate external .html file`,
    `It enables a whole set of extra runtime assertions inside production templates`,
  ] },
  417: { answer: 1, options: [
    `It only sets NODE_ENV and then hopes the libraries react to it`,
    `It merges the named "configurations" overrides: optimize, hash, budgets`,
    `It runs the exact same build twice over and then diffs the two resulting outputs`,
    `A production build simply pulls in a different framework version`,
  ] },
  418: { answer: 1, options: [
    `Nothing here matters — CI just needs a newer Node version`,
    `The app tsconfig now sweeps in spec files, which lack test "types"`,
    `describe must now be imported from @angular/core in every spec file`,
    `The "files" and "extends" keys cannot be used together at all`,
  ] },
};
