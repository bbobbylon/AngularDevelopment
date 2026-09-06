import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One "where would you change this?" exercise: a goal, the file that owns it,
 * and the answer.
 */
interface ConfigTask {
  label: string;
  file: string;
  answer: string;
  snippet: string;
}

const CONFIG_TASKS: ConfigTask[] = [
  {
    label: 'Add a CSS framework globally',
    file: 'angular.json',
    answer:
      'The "styles" array under the build target compiles global stylesheets into the app — unscoped, document-wide. (Config changes need a dev-server restart!)',
    snippet: `"architect": {
  "build": {
    "options": {
      "styles": [
        "src/styles.css",
        "node_modules/some-framework/dist/framework.min.css"
      ]
    }
  }
}`,
  },
  {
    label: 'Pin a dependency version exactly',
    file: 'package.json',
    answer:
      'Drop the range prefix: "^20.1.0" accepts minors, "~20.1.0" accepts patches, "20.1.0" is exact. package-lock.json then freezes the whole resolved tree for npm ci.',
    snippet: `"dependencies": {
  "@angular/core": "^20.1.0",   // any 20.x.y >= 20.1.0
  "some-fragile-lib": "3.2.1"   // exactly 3.2.1
}`,
  },
  {
    label: 'Fail the build if the bundle grows too big',
    file: 'angular.json',
    answer:
      'Budgets in the production configuration turn bundle size into a build contract — warning at one threshold, hard failure at another. CI catches the bloat, not your users.',
    snippet: `"configurations": {
  "production": {
    "budgets": [
      { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
      { "type": "anyComponentStyle", "maximumWarning": "4kB" }
    ]
  }
}`,
  },
  {
    label: 'Turn on strict template type-checking',
    file: 'tsconfig.json',
    answer:
      'angularCompilerOptions lives in the BASE tsconfig — strictTemplates extends strict typing into templates, so a wrong-typed [input] fails the build instead of misbehaving at runtime.',
    snippet: `{
  "compilerOptions": { "strict": true },
  "angularCompilerOptions": {
    "strictTemplates": true
  }
}`,
  },
  {
    label: 'Keep spec files out of the app build',
    file: 'tsconfig.app.json',
    answer:
      'The app tsconfig EXTENDS the base and narrows the file set — main.ts in, *.spec.ts out. Test files compile under tsconfig.spec.json, whose "types" provides describe/it/expect.',
    snippet: `{
  "extends": "./tsconfig.json",
  "files": ["src/main.ts"],
  "exclude": ["src/**/*.spec.ts"]
}`,
  },
  {
    label: 'Change what "npm start" runs',
    file: 'package.json',
    answer:
      'The scripts block is the project command palette. npm puts node_modules/.bin on the PATH, so the locally-pinned ng runs — no global CLI needed.',
    snippet: `"scripts": {
  "start": "ng serve --open",
  "build": "ng build",
  "test": "ng test"
}`,
  },
];

/**
 * Lesson: the three configuration layers of every Angular workspace —
 * package.json (what to install), angular.json (how to build), and the
 * tsconfig family (how to compile TypeScript). Includes an interactive
 * "where does this setting live?" explorer.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem before naming the three files.** The page opens on a
 *    "which file do you reach for?" napkin prediction, before any of the
 *    three files has been described — a reader who has committed to a guess
 *    reads the rest of the page checking their own answer, not absorbing a
 *    list.
 * 2. **Analogy before vocabulary.** The building-site frame (materials order /
 *    build plan / building code) gives `package.json`, `angular.json` and
 *    `tsconfig*.json` somewhere to live before their names have to carry any
 *    weight on their own.
 * 3. **Then the same idea in several modes** — a taped row of the three
 *    files, a step diagram of when each is read, an interactive
 *    "which file owns this?" explorer, two full `app-code-lab` walkthroughs of
 *    real config, a nested-scope diagram of `angular.json` itself, and a
 *    dialogue + side-by-side contrast of the one collision every learner
 *    hits (`scripts` meaning two unrelated things).
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## The trap this lesson exists to fix
 *
 * The `scripts` key exists in both `package.json` (commands) and
 * `angular.json` (files) — same word, same file format, unrelated jobs. It is
 * taught three times on purpose: as a dialogue ({@link fileTalk}), as a
 * side-by-side `app-compare`, and as an `app-faq` answer — because it is the
 * single most repeated question this lesson's own FAQ inbox receives.
 *
 * @see expert/change-detection — the reference implementation this page's
 * shape is copied from.
 */
@Component({
  selector: 'app-lesson-workspace-config',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './workspace-config.css',
  templateUrl: './workspace-config.html',
})
export class WorkspaceConfig {
  /** The Getting Started track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'What is Angular?', id: 'what-is-angular' },
    { label: 'CLI & Project Structure', id: 'cli-project-structure' },
    { label: 'Workspace Config' },
    { label: 'Components', id: 'components' },
    { label: 'Interpolation', id: 'interpolation' },
  ];

  /**
   * What `ng build` actually does with the three files, in order. The ordering is
   * the point: each file is consulted at a different moment, which is why editing
   * one mid-session has a different effect from editing another.
   */
  protected readonly buildFlow: FlowStep[] = [
    { label: 'npm installs', detail: '`package.json` + the lockfile fill `node_modules`' },
    {
      label: 'CLI reads `angular.json`',
      detail: 'Once, at startup — picks the builder and the named configuration',
      tone: 'accent',
    },
    {
      label: 'TypeScript compiles',
      detail: '`tsconfig.app.json` decides which files and how strictly',
    },
    {
      label: 'Bundle & budget check',
      detail: 'Over `maximumError` and the build fails here',
      tone: 'warn',
    },
    {
      label: '`dist/` written',
      detail: 'Assets copied, global styles injected into index.html',
      tone: 'good',
    },
  ];

  /**
   * The three files, arguing about who owns the word `scripts`.
   *
   * This exchange exists because the collision it stages is the single most
   * repeated question this lesson leaves behind (see {@link questions}, first
   * item). A paragraph explaining "they're unrelated" is forgettable; watching
   * each file deny responsibility in its own voice is not.
   */
  protected readonly fileTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: '`package.json` and `angular.json` both have a `scripts` key. Same feature, right?',
    },
    {
      who: 'package.json',
      says: 'Mine holds **commands**. `"start": "ng serve"` means: when someone runs `npm start`, run that string in a shell.',
    },
    {
      who: 'angular.json',
      says: 'Mine holds **files** — plain JavaScript bundled into one global `<script>` tag alongside your app. Nothing in my array is ever "run" by name.',
    },
    {
      who: 'tsconfig.json',
      says: "Don't look at me. I don't have a `scripts` key at all — I only tell the compiler how to read your TypeScript.",
    },
  ];

  /** The edit-while-serving trap, posed before the warning box names it. */
  protected readonly liveEditSample = `// ng serve is running. You add a global stylesheet:
"styles": [
  "src/styles.css",
  "node_modules/some-framework/dist/framework.min.css"
]
// …and save. Does the running app pick it up?`;

  /** Prompt for the {@link liveEditSample} prediction. */
  protected readonly liveEditPrompt =
    "`ng serve` is running and hot-reloading your components happily. You add a global stylesheet to `angular.json` and save. Does the framework's CSS appear?";

  /** Reveal for the {@link liveEditSample} prediction. */
  protected readonly liveEditAnswer =
    'No — and nothing in the terminal tells you why. The dev server watches your *source* files, but it read `angular.json` once at boot and never looks again. Your edit is correct and completely inert until you stop the server and start it again. Whenever a config change "does nothing", restart before you debug the change itself.';

  /** Choices for the ambient-types check. */
  protected readonly tsconfigOptions: QuizOption[] = [
    {
      text: 'The `vitest` package is missing from `devDependencies`',
      why: 'Then the failure would be a module-resolution error naming `vitest`, and it would happen when the runner starts — not a bare `describe` type error during the build.',
    },
    {
      text: 'A spec file got swept into the app compilation',
      correct: true,
      why: "`describe` is not a JavaScript keyword — it is an *ambient type* supplied by the test runner's type package, which only `tsconfig.spec.json` lists under `types`. Compile a spec file under `tsconfig.app.json` and the name genuinely does not exist there.",
    },
    {
      text: '`strictTemplates` was switched on in the base tsconfig',
      why: '`strictTemplates` type-checks *template* expressions — wrong-typed inputs, misspelled members. It has nothing to say about which globals exist in a `.ts` file.',
    },
    {
      text: 'The TypeScript version in `package.json` drifted',
      why: 'A version mismatch shows up as unsupported-syntax or a peer-dependency warning. Missing ambient globals is a `types`/file-set problem, not a compiler-version one.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'There is a `scripts` key in package.json AND in angular.json. Are they related?',
      a: 'Not at all, and the collision catches people constantly — see the exchange and the side-by-side above if you want it spelled out again. `package.json` → `scripts` is a list of **commands** you run with `npm run`. `angular.json` → `scripts` is a list of **JavaScript files** to bundle into a global `<script>` tag. Same word, unrelated jobs.',
    },
    {
      q: 'Should package-lock.json be committed? It creates huge diffs.',
      a: 'Commit it. The ranges in `package.json` express what you *accept*; the lockfile records what you actually *got* — the entire resolved tree, transitive dependencies included. `npm ci` installs exactly that, which is what makes your machine and CI agree. Deleting the lockfile to fix an install is how "works on my machine" is born.',
    },
    {
      q: 'Why two tsconfigs? Why not one?',
      a: 'Because the app build and the test build need different file sets *and* different ambient types. Specs must not ship to production, and `describe`/`it`/`expect` must not exist in application code — if they did, a stray `it(...)` in a component would compile happily.',
    },
    {
      q: 'Does putting something in `devDependencies` keep it out of my bundle?',
      a: 'No — the bundler follows `import` statements, not the dependency section. The split matters for **install time**: `npm ci --omit=dev` skips devDependencies, so a deploy image stays small. If your app code imports it, it ships regardless of which section names it.',
    },
    {
      q: 'My build failed on a budget. Can I just raise the number?',
      a: 'You can, and sometimes that is right — an app legitimately grows. But treat the failure as the question it is: what got bigger? Usually it is a library imported eagerly that belongs behind a lazy route. Raising the ceiling silences the alarm without moving the furniture.',
    },
  ];

  /** The exercises. */
  protected readonly tasks = CONFIG_TASKS;

  /** The exercise being examined, or `null` for none. */
  protected readonly active = signal<ConfigTask | null>(null);

  /**
   * Sample: an annotated `package.json`, focused on the scripts and the
   * dependency/devDependency split.
   */
  protected readonly packageJsonSample = `{
  "scripts": {
    "start": "ng serve",       // npm start
    "build": "ng build",       // npm run build
    "test": "ng test"          // npm test
  },
  "dependencies": {
    "@angular/core": "^20.1.0",     // ships in the bundle
    "rxjs": "~7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^20.1.0",      // build-time only
    "typescript": "~5.8.0",
    "vitest": "^4.0.0"
  }
}`;

  /** Line-by-line walkthrough of {@link packageJsonSample}. */
  protected readonly packageJsonNotes: CodeNote[] = [
    {
      line: 2,
      text: '`scripts` is the project\'s command palette — every key here becomes something you can run with `npm run <key>` (two of them, `start` and `test`, get their own shortcut without the word "run").',
    },
    {
      line: 3,
      text: "`npm start` runs exactly the string on the right, `ng serve`, in a shell. npm quietly puts this project's own `node_modules/.bin` on the `PATH` first, so the locally-installed CLI runs even with nothing installed globally.",
    },
    {
      line: 4,
      text: '`npm run build` — note the word `run`. Only `start`, `test`, `stop` and `restart` get to skip it; every other script name needs it spelled out.',
    },
    {
      line: 5,
      text: '`npm test` is the other name that skips `run`, by the same historical npm convention as `start`.',
    },
    {
      line: 7,
      text: '`dependencies` — everything a browser genuinely needs. The bundler follows `import` statements from here, so these ship inside your `dist/` output.',
    },
    {
      line: 8,
      text: 'The caret `^` is a **range**, not a version: it accepts `20.1.0` up through (but not including) `21.0.0` — any newer minor or patch release.',
    },
    {
      line: 9,
      text: 'The tilde `~` is a tighter range: only patch releases of `7.8.x` are accepted, never a new minor version.',
    },
    {
      line: 11,
      text: '`devDependencies` — tools that build or test the app but never ship inside it: the compiler, the CLI, the test runner. A production install can skip this whole block.',
    },
    {
      line: 12,
      text: "Pinning the CLI version here keeps it in sync with `@angular/core` above — a CLI far ahead of the framework it's building is a classic source of `ng build` failures that have nothing to do with your own code.",
    },
    {
      line: 13,
      text: 'The TypeScript compiler itself. Its version has to satisfy whatever range `@angular/compiler-cli` (pulled in transitively) demands, which is why bumping this alone can break a build.',
    },
    {
      line: 14,
      text: "The test runner. Its ambient types — `describe`, `it`, `expect` — are what `tsconfig.spec.json`'s `types` array points at further down this page; they don't exist anywhere until this package is installed.",
    },
  ];

  /**
   * Sample: an annotated `angular.json`, focused on builder options, budgets and
   * configurations.
   */
  protected readonly angularJsonSample = `// Yes, comments are legal here. angular.json is parsed as JSONC by the CLI,
// so you can annotate your own workspace exactly like this.
{
  // A workspace can hold SEVERAL projects — apps and libraries side by side.
  "projects": {
    // The key is the project name you pass to the CLI: ng build my-app
    "my-app": {
      // "architect" (aka "targets") maps a command name to a builder + options.
      "architect": {
        // Everything under here runs on: ng build
        "build": {
          // WHICH tool does the work. @angular/build:application is the modern
          // esbuild-based builder; older projects show :browser (webpack).
          "builder": "@angular/build:application",
          // Options that apply to EVERY configuration.
          "options": {
            "outputPath": "dist/my-app",       // where the bundle is written
            "index": "src/index.html",         // the HTML shell to inject into
            "browser": "src/main.ts",          // the entry point — bootstrap lives here
            "tsConfig": "tsconfig.app.json",   // app-only TS config (specs use another)
            // Copied verbatim into the output. NOT processed or hashed — put
            // things here only if they must keep their exact filename.
            "assets": ["src/favicon.ico", "src/assets"],
            // GLOBAL styles, outside any component's encapsulation.
            "styles": ["src/styles.css"],
            // Global scripts. Almost always empty in a modern app — prefer an
            // import in TypeScript so the bundler can see and tree-shake it.
            "scripts": []
          },
          // Named overrides, MERGED over "options" above when selected.
          "configurations": {
            "production": {
              // A build-time size limit. Exceed it and the build FAILS — the
              // cheapest possible guard against a bundle quietly doubling.
              "budgets": [{ "type": "initial", "maximumError": "1MB" }],
              // Adds a content hash to filenames (main-A1B2C3.js) so a new
              // deploy can never be served from a stale browser cache.
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,   // skip minify/tree-shake — much faster rebuilds
              "sourceMap": true        // debug your TypeScript, not the bundle
            }
          },
          // Which configuration a bare "ng build" uses. It is PRODUCTION by
          // default — the reason a plain ng build is slower than ng serve.
          "defaultConfiguration": "production"
        }
      }
    }
  }
}`;

  /** Line-by-line walkthrough of {@link angularJsonSample}. */
  protected readonly angularJsonNotes: CodeNote[] = [
    {
      line: 5,
      text: 'A workspace can hold **more than one project** — an app and a component library both live under this one key, side by side.',
    },
    {
      line: 7,
      text: "The project's name — whatever you passed to `ng new`. It's also the string you'd pass explicitly if this workspace ever grew a second project: `ng build my-app`.",
    },
    {
      line: 9,
      text: 'Older workspaces spell this `architect`; newer ones may say `targets` — same job, either name. It maps a **command name** (`build`, `serve`, `test`) to the builder that runs it.',
    },
    {
      line: 11,
      text: 'This is the block `ng build` reads. `ng serve` and `ng test` each get their own sibling block here, structured exactly the same way.',
    },
    {
      line: 14,
      text: 'The actual tool doing the work, referenced by package name. `@angular/build:application` is the modern esbuild-based builder; a project migrated from webpack may still show `@angular-devkit/build-angular:browser` here instead.',
    },
    {
      line: 16,
      text: 'The **defaults** — settings that apply no matter which named configuration below gets selected.',
    },
    {
      line: 17,
      text: 'Where `ng build` writes the finished bundle. This exact folder is what a deploy pipeline uploads.',
    },
    {
      line: 20,
      text: "Which tsconfig compiles the app. Note it's **not** the base `tsconfig.json` directly — `tsconfig.app.json` extends that base and narrows the file set, covered later on this page.",
    },
    {
      line: 23,
      text: 'Copied **byte-for-byte** into the output folder — never processed, never hashed. Put something here only if its exact filename has to survive (a `robots.txt`, a favicon).',
    },
    {
      line: 25,
      text: '**Global** stylesheets — the ones NOT scoped to a single component. This is the array the "add a CSS framework" task in the explorer above points you to.',
    },
    {
      line: 28,
      text: "The exact same key name as `package.json`'s `scripts` — and a completely different job: this one lists **JavaScript files** to bundle into a global `<script>` tag, not commands to run. The dialogue and comparison below untangle this properly.",
    },
    {
      line: 31,
      text: '**Named overrides.** Nothing here replaces `options` above — each key only overrides the specific settings it mentions; everything else falls through unchanged.',
    },
    {
      line: 35,
      text: 'A byte ceiling enforced **only** while this configuration is selected. Cross `maximumError` and `ng build` exits non-zero — on purpose, before a user ever downloads the bloat.',
    },
    {
      line: 38,
      text: 'Appends a content hash to every filename (`main-A1B2C3.js`). Deploy a new hash and an old browser cache can never serve stale code for it — the file name itself changed.',
    },
    {
      line: 47,
      text: "Which block from `configurations` a bare `ng build` uses when you don't pass `-c`. It's **production** by default — the entire reason a plain `ng build` is slower and stricter than `ng serve`.",
    },
  ];

  /** Sample: the `scripts` collision — package.json's side. */
  protected readonly scriptsPkgSample = `"scripts": {
  "start": "ng serve",
  "build": "ng build"
}`;

  /** Sample: the `scripts` collision — angular.json's side. */
  protected readonly scriptsAngSample = `"scripts": [
  "node_modules/some-lib/dist/lib.min.js"
]`;

  /** Caption under the {@link scriptsPkgSample}/{@link scriptsAngSample} comparison. */
  protected readonly scriptsCompareNote =
    'Same key, same file format, completely unrelated jobs — the single most common config mix-up in this curriculum.';
}
