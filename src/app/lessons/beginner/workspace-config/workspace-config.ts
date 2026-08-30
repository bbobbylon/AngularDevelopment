import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 */
@Component({
  selector: 'app-lesson-workspace-config',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  styleUrl: './workspace-config.css',
  templateUrl: './workspace-config.html',
})
export class WorkspaceConfig {
  /**
   * What `ng build` actually does with the three files, in order. The ordering is
   * the point: each file is consulted at a different moment, which is why editing
   * one mid-session has a different effect from editing another.
   */
  protected readonly buildFlow = [
    { label: 'npm installs', detail: '`package.json` + the lockfile fill `node_modules`' },
    {
      label: 'CLI reads `angular.json`',
      detail: 'Once, at startup — picks the builder and the named configuration',
      tone: 'accent' as const,
    },
    {
      label: 'TypeScript compiles',
      detail: '`tsconfig.app.json` decides which files and how strictly',
    },
    {
      label: 'Bundle & budget check',
      detail: 'Over `maximumError` and the build fails here',
      tone: 'warn' as const,
    },
    {
      label: '`dist/` written',
      detail: 'Assets copied, global styles injected into index.html',
      tone: 'good' as const,
    },
  ];

  /** The edit-while-serving trap, posed before the warning box names it. */
  protected readonly liveEditSample = `// ng serve is running. You add a global stylesheet:
"styles": [
  "src/styles.css",
  "node_modules/some-framework/dist/framework.min.css"
]
// …and save. Does the running app pick it up?`;

  /** Choices for the ambient-types check. */
  protected readonly tsconfigOptions = [
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
  protected readonly questions = [
    {
      q: 'There is a `scripts` key in package.json AND in angular.json. Are they related?',
      a: 'Not at all, and the collision catches people constantly. `package.json` → `scripts` is a list of **commands** you run with `npm run`. `angular.json` → `scripts` is a list of **JavaScript files** to bundle into a global `<script>` tag. Same word, unrelated jobs.',
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

  /**
   * The exercises.
   */
  readonly tasks = CONFIG_TASKS;
  /**
   * The exercise being examined, or `null` for none.
   */
  readonly active = signal<ConfigTask | null>(null);

  /**
   * Sample: an annotated `package.json`, focused on the scripts and the
   * dependency/devDependency split.
   */
  readonly packageJsonSample = `{
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

  /**
   * Sample: an annotated `angular.json`, focused on builder options, budgets and
   * configurations.
   */
  readonly angularJsonSample = `// Yes, comments are legal here. angular.json is parsed as JSONC by the CLI,
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
}
