import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the three configuration layers of every Angular workspace —
 * package.json (what to install), angular.json (how to build), and the
 * tsconfig family (how to compile TypeScript). Includes an interactive
 * "where does this setting live?" explorer.
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
    answer: 'The "styles" array under the build target compiles global stylesheets into the app — unscoped, document-wide. (Config changes need a dev-server restart!)',
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
    answer: 'Drop the range prefix: "^20.1.0" accepts minors, "~20.1.0" accepts patches, "20.1.0" is exact. package-lock.json then freezes the whole resolved tree for npm ci.',
    snippet: `"dependencies": {
  "@angular/core": "^20.1.0",   // any 20.x.y >= 20.1.0
  "some-fragile-lib": "3.2.1"   // exactly 3.2.1
}`,
  },
  {
    label: 'Fail the build if the bundle grows too big',
    file: 'angular.json',
    answer: 'Budgets in the production configuration turn bundle size into a build contract — warning at one threshold, hard failure at another. CI catches the bloat, not your users.',
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
    answer: 'angularCompilerOptions lives in the BASE tsconfig — strictTemplates extends strict typing into templates, so a wrong-typed [input] fails the build instead of misbehaving at runtime.',
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
    answer: 'The app tsconfig EXTENDS the base and narrows the file set — main.ts in, *.spec.ts out. Test files compile under tsconfig.spec.json, whose "types" provides describe/it/expect.',
    snippet: `{
  "extends": "./tsconfig.json",
  "files": ["src/main.ts"],
  "exclude": ["src/**/*.spec.ts"]
}`,
  },
  {
    label: 'Change what "npm start" runs',
    file: 'package.json',
    answer: 'The scripts block is the project command palette. npm puts node_modules/.bin on the PATH, so the locally-pinned ng runs — no global CLI needed.',
    snippet: `"scripts": {
  "start": "ng serve --open",
  "build": "ng build",
  "test": "ng test"
}`,
  },
];

@Component({
  selector: 'app-lesson-workspace-config',
  imports: [RouterLink],
  styles: [`
    .layer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 16px 0; }
    .layer { border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; background: var(--bg-card); }
    .layer h4 { margin: 0 0 6px; font-family: monospace; font-size: .9rem; color: var(--accent); }
    .layer p { margin: 0; font-size: .85rem; color: var(--text-muted); }

    .task-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .task-chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .task-chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .answer-file { display: inline-block; font-family: monospace; font-weight: 700; font-size: .9rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.12); color: var(--accent); margin: 10px 0 6px; }
    .answer-text { font-size: .9rem; margin: 0 0 10px; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    table.cmp td:first-child { font-family: monospace; white-space: nowrap; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Getting Started</span>
      <h1>Workspace Configuration: package.json, angular.json &amp; tsconfig</h1>
      <p class="lead">
        Three files govern everything that happens before your code runs:
        <strong>package.json</strong> says what to install, <strong>angular.json</strong>
        says how to build, and the <strong>tsconfig family</strong> says how to compile
        TypeScript. Knowing which knob lives where turns "mystery build errors"
        into five-minute fixes.
      </p>

      <h2>The three layers</h2>
      <div class="layer-grid">
        <div class="layer">
          <h4>package.json</h4>
          <p>The npm manifest: dependencies vs devDependencies, the scripts
          command palette, and the semver ranges the lockfile pins down.</p>
        </div>
        <div class="layer">
          <h4>angular.json</h4>
          <p>The CLI workspace: which builder runs each target (build / serve /
          test), global styles &amp; scripts, assets, budgets, and named
          configurations like production.</p>
        </div>
        <div class="layer">
          <h4>tsconfig*.json</h4>
          <p>The compiler: one base config with shared strictness, extended by
          tsconfig.app.json (app files) and tsconfig.spec.json (test files).</p>
        </div>
      </div>

      <h2>Try it: where does this setting live?</h2>
      <div class="demo">
        <p class="demo__title">Interactive</p>
        <p>Pick a task — the answer shows the file, the why, and the exact snippet.</p>
        <div class="task-chips">
          @for (task of tasks; track task.label) {
            <button [class.on]="active() === task" (click)="active.set(task)">{{ task.label }}</button>
          }
        </div>
        @if (active(); as task) {
          <span class="answer-file">📄 {{ task.file }}</span>
          <p class="answer-text">{{ task.answer }}</p>
          <div class="code"><pre>{{ task.snippet }}</pre></div>
        }
      </div>

      <h2>package.json — what to install and how to run</h2>
      <p>
        <code>dependencies</code> ship with the app (framework code that ends up in
        your bundles); <code>devDependencies</code> are build-time tools — the CLI,
        the compiler, the test runner. A deploy pipeline running
        <code>npm ci --omit=dev</code> skips the tooling entirely.
      </p>
      <div class="code">
        <pre>{{ packageJsonSample }}</pre>
      </div>
      <div class="note">
        <strong>^ vs ~ vs nothing:</strong> <code>^20.1.0</code> accepts any compatible
        minor/patch (&lt;21.0.0), <code>~20.1.0</code> accepts only patches
        (&lt;20.2.0), and a bare version is exact. Ranges express intent —
        <strong>package-lock.json guarantees reality</strong> by freezing the entire
        resolved tree. Commit the lockfile; deleting it to "fix" an install is how
        works-on-my-machine bugs are born.
      </div>

      <h2>angular.json — how the CLI builds</h2>
      <p>
        Each project maps <em>architect targets</em> to a <em>builder</em> plus options.
        <code>ng build -c production</code> selects a named configuration whose options
        override the defaults for that run:
      </p>
      <div class="code">
        <pre>{{ angularJsonSample }}</pre>
      </div>
      <ul>
        <li><strong>styles / scripts</strong> — global bundles injected into index.html (a classic
          name collision with package.json's "scripts": npm scripts are commands, these are files).</li>
        <li><strong>assets</strong> — files copied verbatim to the output (images, fonts, favicon).</li>
        <li><strong>budgets</strong> — size thresholds; exceed maximumError and the BUILD FAILS.</li>
        <li><strong>configurations</strong> — production enables optimization, output hashing and
          budgets; development keeps sourcemaps and fast rebuilds. <code>fileReplacements</code>
          is the traditional environment-file swap.</li>
      </ul>
      <div class="warn">
        angular.json is read ONCE when the dev server boots. Source files are
        watched; workspace config is not — edit it and restart <code>ng serve</code>.
      </div>

      <h2>The tsconfig family — one base, two leaves</h2>
      <table class="cmp">
        <tr><th>File</th><th>Role</th><th>Key contents</th></tr>
        <tr>
          <td>tsconfig.json</td>
          <td>Base ("solution") config every leaf extends</td>
          <td>strict, target, module, <code>angularCompilerOptions.strictTemplates</code></td>
        </tr>
        <tr>
          <td>tsconfig.app.json</td>
          <td>The application compilation</td>
          <td>files: main.ts · excludes *.spec.ts</td>
        </tr>
        <tr>
          <td>tsconfig.spec.json</td>
          <td>The test compilation</td>
          <td>includes spec files · "types" adds the runner globals (describe/it)</td>
        </tr>
      </table>
      <p>
        The split exists because the two compilations need different file sets AND
        different ambient types: <code>describe</code> exists only where the test
        runner's type package is listed. Sweep spec files into the app build and CI
        greets you with <em>"Cannot find name describe"</em>.
      </p>
      <div class="tip">
        <strong>strictTemplates</strong> is the single highest-value flag to verify in an
        existing repo: it extends type-checking into templates, so a wrong-typed
        <code>[input]</code>, a misspelled interpolation member, or an untyped
        <code>$event</code> fails the <em>build</em> instead of a user's session.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>package.json = install &amp; run · angular.json = build · tsconfig = compile.</li>
        <li>dependencies ship, devDependencies build; ranges express intent, the lockfile pins reality.</li>
        <li>angular.json's styles/scripts arrays are GLOBAL bundles — and config edits need a server restart.</li>
        <li>Budgets make bundle size a CI failure instead of a production surprise.</li>
        <li>One base tsconfig, two leaves: app excludes specs; spec adds test-runner types.</li>
      </ul>

      <p>
        Drill this with the <a routerLink="/practice">Tooling &amp; Config challenges</a>
        or see the real files in this very repo — it is a standard CLI workspace.
      </p>

      <p><a routerLink="/components">Next: Components →</a></p>
    </article>
  `,
})
export class WorkspaceConfig {
  readonly tasks = CONFIG_TASKS;
  readonly active = signal<ConfigTask | null>(null);

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

  readonly angularJsonSample = `{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.css"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [{ "type": "initial", "maximumError": "1MB" }],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        }
      }
    }
  }
}`;
}
