import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  styleUrl: './workspace-config.css',
  templateUrl: './workspace-config.html',
})
export class WorkspaceConfig {
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
