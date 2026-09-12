import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { CliExplorer } from './cli-explorer/cli-explorer';

/**
 * Lesson: CLI & Project Structure — what `ng new` actually handed you, and why.
 *
 * Covers the everyday CLI commands, an interactive file-role explorer over a
 * real `ng new` tree, line-by-line reads of the four files every standalone
 * app boots from, the two-line slice of `angular.json` that decides where a
 * static asset ends up, generate schematics, and how `ng update` migrations
 * rewrite code rather than just bump a version number.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem first.** The page opens on "you typed one command —
 *    where did the rest come from?" and asks the reader to predict the shape
 *    of the tree before the explorer ever shows it.
 * 2. **Analogy before vocabulary.** The contractor-handing-you-a-finished-house
 *    frame gives the four boot files somewhere to live before their names have
 *    to carry any weight on their own.
 * 3. **Then the same idea in several modes** — a taped row of the four boot
 *    files, an interactive tree explorer, annotated real source for each file,
 *    a before/after of what a migration schematic actually rewrites, and a
 *    closing table mapping each config layer back to the file that owns it.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## The two traps this lesson exists to fix
 *
 * Beginners reliably reach for the wrong file when they want to change a
 * build setting (guessing `package.json` when the answer is `angular.json`),
 * and reach for a folder that has not existed in a default workspace since
 * Angular 17 when they want to add a static asset (`src/assets/`, replaced by
 * a top-level `public/`). Both get their own `app-predict`, grounded in this
 * project's own `angular.json` and `index.html`.
 *
 * @see beginner/workspace-config — goes file-by-file through `package.json`,
 * `angular.json` and the `tsconfig` family in depth. This lesson deliberately
 * stays at the "what is this file even for" level and hands off to that one
 * for the settings themselves.
 */
@Component({
  selector: 'app-lesson-cli-project-structure',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
    CliExplorer,
  ],
  templateUrl: './cli-project-structure.html',
  styleUrl: './cli-project-structure.css',
})
export class CliProjectStructure {
  /** The Getting Started track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'What is Angular?', id: 'what-is-angular' },
    { label: 'CLI & Project Structure' },
    { label: 'Workspace Config', id: 'workspace-config' },
    { label: 'Components', id: 'components' },
    { label: 'Interpolation', id: 'interpolation' },
  ];

  /**
   * Sample: the commands used every day. Each line already carries its own
   * `#` comment; {@link commandsNotes} adds the symbol-level detail a beginner
   * needs that a one-line comment has no room for.
   */
  protected readonly commandsSample = `npm install -g @angular/cli      # install the CLI (or use npx — no install needed)
ng new my-app                    # scaffold a whole runnable project
ng serve                         # dev server + live reload — never writes to dist/
ng build                         # production build → dist/, minified & budgeted
ng test                          # run the unit tests
ng generate component foo        # scaffold + wire up a file (alias: ng g c foo)
ng update                        # upgrade Angular AND migrate your code
ng add @angular/material         # install a library AND run its setup schematic`;

  /** Line-by-line walkthrough of {@link commandsSample}. */
  protected readonly commandsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The CLI is just an npm package. `-g` installs it once, globally — or skip this line entirely and prefix every command with `npx` instead, which always runs the version pinned in the CURRENT project.',
    },
    {
      line: 2,
      text: 'The one command that creates something from nothing: installs dependencies, sets up Git, TypeScript and testing, and leaves you with an app that already runs. Everything below only makes sense once this has happened.',
    },
    {
      line: 3,
      text: 'Compiles in memory and serves at `localhost:4200` with live reload. Note what it does **not** do: `dist/` is never written, so a clean `ng serve` proves nothing about whether `ng build` will succeed.',
    },
    {
      line: 4,
      text: 'The one that actually ships: minified, tree-shaken, hashed filenames, and — unlike `ng serve` — checked against the size budgets in `angular.json`.',
    },
    {
      line: 5,
      text: 'Runs the project once through its test runner. Add `--watch` to keep it running as you edit, or see the flags below for the one-shot form a CI pipeline wants.',
    },
    {
      line: 6,
      text: '`ng generate` (`ng g`) runs a **schematic** — a generator that creates a file AND updates anything that needs to know about it. `foo` comes out as a correctly named, already-wired standalone component.',
    },
    {
      line: 7,
      text: 'The only command on this list that touches your source on purpose. It bumps the version **and** runs whatever migration schematics that version ships, rewriting code for breaking changes automatically.',
    },
    {
      line: 8,
      text: '`ng add` is `npm install` with a setup step stapled to it: it installs the package, then runs that package’s own schematic — which is how adding Angular Material also wires up its theming for you.',
    },
  ];

  /**
   * The "it works locally, 404s in prod" napkin question — coverage-sweep
   * failure mode: nothing in the lesson said what happens to `dist/` after
   * `ng build` finishes.
   */
  protected readonly deployPrompt =
    'You run `ng build`, copy the whole `dist/my-app/browser` folder onto a static file host, and it works — you can click every link in the app. Then someone bookmarks `/about`, closes the tab, and opens the bookmark fresh. What do they see?';

  /** The server-side rewrite rule every static host needs, three ways. */
  protected readonly deployRewriteSample = `# nginx
location / { try_files $uri $uri/ /index.html; }

# Netlify — a _redirects file next to index.html
/*    /index.html   200

# Firebase — firebase.json
{ "hosting": { "rewrites": [{ "source": "**", "destination": "/index.html" }] } }`;

  /** Line-by-line walkthrough of {@link deployRewriteSample}. */
  protected readonly deployRewriteNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Read this right to left: for every request, try the exact file (`$uri`), then a matching directory (`$uri/`), and if neither exists on disk, serve `/index.html` instead of letting nginx return its own 404.',
    },
    {
      line: 5,
      text: 'Netlify reads a plain-text `_redirects` file: any path (`/*`) rewrites to `/index.html`, and the `200` matters — a `301`/`302` here would visibly redirect the URL bar instead of quietly serving the same file at the original address.',
    },
    {
      line: 8,
      text: "Firebase Hosting's config format for the identical rule: any `source` matching `**` (everything) rewrites to `/index.html` before the request ever 404s.",
    },
  ];

  /** The two other build-to-deploy flags people never meet until they need them. */
  protected readonly deployFlagsSample = `ng build --base-href /app/                # app is served from example.com/app/, not the domain root
ng serve --proxy-config proxy.conf.json   # forward /api/* to a real backend in dev, no CORS needed`;

  /**
   * Sample: `main.ts` — `bootstrapApplication`, the first line of the app to
   * run. Deliberately the shortest real file in the whole lesson; the {@link Quiz}
   * a few sections down is built entirely around how short it is.
   */
  protected readonly mainSample = `// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));`;

  /** Line-by-line walkthrough of {@link mainSample}. */
  protected readonly mainNotes: CodeNote[] = [
    {
      line: 2,
      text: '`bootstrapApplication` is the standalone replacement for the old `platformBrowserDynamic().bootstrapModule(AppModule)` — one function call instead of a module class.',
    },
    {
      line: 3,
      text: 'The providers object from `app.config.ts`, a few lines below. Nothing here inlines what is in it — `main.ts` only needs to know that it exists.',
    },
    {
      line: 4,
      text: 'The root component class, imported the same way you would import any other component. `main.ts` has no idea what is inside it.',
    },
    {
      line: 6,
      text: "The actual boot: mount `App` into the `<app-root>` tag in `index.html`, wired up with everything `appConfig` describes. This call returns a `Promise` — that's what makes line 7 legal.",
    },
    {
      line: 7,
      text: 'Logs a startup failure — a bad provider, a syntax error that survived to runtime — to the console. If this ever fires, nothing in your app rendered at all.',
    },
  ];

  /**
   * Sample: `app.config.ts` — where providers are registered in a standalone
   * app, in place of the old root module.
   */
  protected readonly configSample = `// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// This object replaces the old AppModule. Everything that used to go in
// @NgModule imports/providers now lives in one flat providers array.
export const appConfig: ApplicationConfig = {
  providers: [
    // Each provideX() is a FEATURE being switched on. Omit one and the
    // corresponding feature simply is not available — inject Router without
    // this line and you get NullInjectorError.
    provideRouter(routes),
    // Note the parentheses: these are function CALLS that return providers,
    // not classes. provideHttpClient takes optional features too, e.g.
    // provideHttpClient(withInterceptors([authInterceptor])).
    provideHttpClient(),
  ],
};
// Tree-shaking is why it works this way: never call provideHttpClient() and
// the entire HTTP module is dropped from your bundle.`;

  /** Line-by-line walkthrough of {@link configSample}. */
  protected readonly configNotes: CodeNote[] = [
    {
      line: 2,
      text: '`ApplicationConfig` is the type this whole object satisfies — a plain interface with one required property, `providers`. Nothing here needs a base class or a module.',
    },
    {
      line: 3,
      text: '`provideRouter` is a **function**, not a component or a class. Calling it returns a small bundle of providers that, together, make the `Router` service and things like `routerLink` work.',
    },
    {
      line: 4,
      text: 'Same shape as `provideRouter` — a function from `@angular/common/http` that supplies the `HttpClient` service to the injector.',
    },
    {
      line: 9,
      text: '`export const` — this file exists to produce exactly **one value**, and `main.ts` imports that one name. There is no class here, and nothing ever calls `new` on it.',
    },
    {
      line: 10,
      text: '`providers` is the only property `ApplicationConfig` needs. Everything that used to be split across an `@NgModule`’s `imports:` and `providers:` lives in this one flat array now.',
    },
    {
      line: 14,
      text: 'The call happens **here**, inside the array — line 3 only imported the function. Leave off the parentheses (`provideRouter` with no `()`) and you would be pushing the function itself into the array instead of its result, which fails at runtime.',
    },
    {
      line: 18,
      text: 'Tree-shaking depends on this line existing at all: if nothing in your source ever calls `provideHttpClient()`, the bundler can prove the whole HTTP module is unreachable and drops it — a smaller bundle, for free.',
    },
  ];

  /**
   * Sample: `app.routes.ts` — the route table, with a lazy `loadComponent`.
   */
  protected readonly routesSample = `// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: 'about', loadComponent: () => import('./about/about').then((m) => m.About) },
  { path: '**', loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound) },
];`;

  /** Line-by-line walkthrough of {@link routesSample}. */
  protected readonly routesNotes: CodeNote[] = [
    {
      line: 2,
      text: '`Routes` is just a TypeScript type — an array of route objects. Importing it buys you autocomplete and a compile error on a misspelled property, nothing more at runtime.',
    },
    {
      line: 5,
      text: "`path: ''` matches the site root. `loadComponent` is a function returning a **dynamic `import()`** — the bundler splits `home.ts` into its own chunk, downloaded only when this route is actually visited.",
    },
    {
      line: 6,
      text: 'Same shape, different path. Nothing links these two routes to each other; the router just tries each one in order until it finds a match.',
    },
    {
      line: 7,
      text: "`'**'` matches anything nothing else matched — and it has to come **last**. The router stops at the first match, so a wildcard earlier in the array would swallow every route beneath it.",
    },
  ];

  /**
   * Sample: `app.ts` — the root component. Three separate files by default
   * (`app.ts` / `app.html` / `app.css`), not an inline template — verified
   * against this very project's own `src/app/app.ts`.
   */
  protected readonly appSample = `// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}`;

  /** The two files {@link appSample}'s templateUrl/styleUrl point at. */
  protected readonly appHtmlSample = `<!-- src/app/app.html -->
<router-outlet />`;

  /** Line-by-line walkthrough of {@link appSample}. */
  protected readonly appNotes: CodeNote[] = [
    {
      line: 3,
      text: '`RouterOutlet` has to be imported and listed below before `<router-outlet />` can be used in `app.html` — a standalone component declares its own template dependencies instead of inheriting them from a module.',
    },
    {
      line: 6,
      text: '`app-root` is the exact tag `index.html` contains. Angular finds that tag on the page and mounts this component into it — that is the literal meaning of “bootstrap”.',
    },
    {
      line: 7,
      text: 'Listing `RouterOutlet` here is what makes the one line of `app.html` legal. Forget it and `<router-outlet />` fails silently — the tag renders as nothing rather than throwing an error.',
    },
    {
      line: 8,
      text: '`templateUrl` points at a SEPARATE file — `app.html` — rather than inlining markup here. That file holds the ENTIRE template of a fresh project: one `<router-outlet />` tag, and nothing else.',
    },
    {
      line: 9,
      text: 'Same idea for styles: `styleUrl` (singular — one file) points at `app.css`, scoped to this component alone by default.',
    },
  ];

  /**
   * Sample: the two-line slice of `angular.json` that decides where a static
   * asset ends up, and what a size budget actually enforces. A trimmed
   * excerpt on purpose — `beginner/workspace-config` is where the whole
   * `architect.build` block gets read line by line.
   */
  protected readonly angularJsonSample = `{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "options": {
            // Copied byte-for-byte into the output. This one line is the
            // entire reason "public/" exists as its own top-level folder.
            "assets": [{ "glob": "**/*", "input": "public" }]
          },
          "configurations": {
            "production": {
              "budgets": [{ "type": "initial", "maximumError": "1MB" }]
            }
          },
          "defaultConfiguration": "production"
        }
      }
    }
  }
}`;

  /** Line-by-line walkthrough of {@link angularJsonSample}. */
  protected readonly angularJsonNotes: CodeNote[] = [
    {
      line: 9,
      text: 'This is the line that decides whether `public/` matters at all: the glob `**/*` means EVERYTHING under `public/` (the `input`), copied as-is into the build output. Point this at `src/assets` instead — the old default — and `public/` would be dead weight.',
    },
    {
      line: 14,
      text: '`maximumError` is a hard ceiling: cross it and `ng build` **fails**, on purpose, rather than shipping a bundle nobody agreed to. A separate `maximumWarning` (left out of this excerpt) can flag a smaller threshold without failing the build.',
    },
    {
      line: 17,
      text: 'A bare `ng build` uses whichever configuration is named here — `production`, by default. That default is WHY `ng build` alone is slower and stricter than `ng serve`, which defaults to `development` instead.',
    },
  ];

  /**
   * Sample: the CLI flags worth knowing, including the generation flags that
   * stop `ng g` from producing files you did not ask for.
   */
  protected readonly flagsSample = `ng serve --port 4300 --open              # custom port, opens the browser automatically
ng build --configuration development     # un-minified, source maps, budgets relaxed
ng g component foo --inline-template --skip-tests --flat
ng test --watch=false --code-coverage    # one-shot run, with a coverage report`;

  /** Line-by-line walkthrough of {@link flagsSample}. */
  protected readonly flagsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`--port` overrides the default 4200; `--open` launches your default browser once the server is ready. Neither flag touches `angular.json` — both apply to this one invocation only.',
    },
    {
      line: 2,
      text: "This is the fix to the Predict above, spelled out: it swaps in the `development` configuration's settings — no minification, source maps on — without editing a single file.",
    },
    {
      line: 3,
      text: '`--inline-template` keeps the HTML inside the `.ts` file instead of a separate `.html`. `--skip-tests` skips the `.spec.ts` (see the questions below for why you might not want to). `--flat` skips creating a subfolder for the component.',
    },
    {
      line: 4,
      text: '`--watch=false` is what makes a test run finish and exit instead of staying open — the flag a CI pipeline needs. `--code-coverage` adds a report under `coverage/`.',
    },
  ];

  /**
   * Predict #1 — the "which file actually controls this?" trap. `package.json`
   * and `angular.json` collide on more than the word "scripts", and a
   * beginner hunting for a build setting reaches for the wrong one on
   * reflex — see {@link buildSettingAnswer}.
   */
  protected readonly buildSettingPrompt =
    'You want the next production build to skip minification, so you can read a real stack trace in devtools. You open `package.json` and start hunting through `scripts.build`. Are you in the right file?';

  /** The line the reader is staring at when they make their guess. */
  protected readonly buildSettingCode = `"scripts": {
  "build": "ng build"      // shells out to ng build — nothing more
}`;

  /** Reveal for {@link buildSettingPrompt}. */
  protected readonly buildSettingAnswer =
    'No — and the miss runs backwards from how it looks. `scripts.build` is a SHORTCUT: typing `npm run build` just runs the string on the right, which is `ng build` itself. It has no opinion about minification, source maps or optimisation. Those live in `angular.json`, under `architect.build.configurations` — `development` turns optimisation off, `production` (the default) turns it on. The fix is `ng build --configuration development`, or editing `angular.json` directly. `package.json` never comes into it.';

  /**
   * Predict #2 — the static-asset trap. `src/assets/` is what years of
   * tutorials still show, and it has not existed in a default workspace
   * since Angular 17 introduced the top-level `public/` folder — see
   * {@link assetsAnswer}.
   */
  protected readonly assetsPrompt =
    'You want a logo to show up at `yoursite.com/logo.png`. You drop `logo.png` into `src/assets/logo.png` — the way older tutorials show — and reference it with `<img src="logo.png">`. Does it survive a production build?';

  /** The two candidate locations, so the reader commits to one before reading on. */
  protected readonly assetsCode = `src/assets/logo.png     <- where an older tutorial says to put it
public/logo.png         <- where it actually has to go today`;

  /** Reveal for {@link assetsPrompt}. */
  protected readonly assetsAnswer =
    "No — and not because of a typo. A default Angular workspace has not had a `src/assets/` folder since Angular 17; today's default puts static files in a top-level `public/` folder instead, and `angular.json`'s asset glob points there, not at `src/`. Put the file in `public/logo.png` and it ships completely untouched, at exactly `yoursite.com/logo.png`. `src/assets/logo.png` today is just a file sitting in your source tree — nothing copies it anywhere.";

  /**
   * The self-test: the myth that `main.ts` is where "the real code" lives.
   *
   * Each wrong option names one of the OTHER three boot files this lesson
   * covers, so a reader who mixes them up learns exactly which file they were
   * actually thinking of — not just that they were wrong (CONTRIBUTING §2A.2).
   */
  protected readonly mainTsQuizOptions: QuizOption[] = [
    {
      text: 'About three lines: two imports and one call to `bootstrapApplication(App, appConfig)`.',
      correct: true,
      why: "That is the whole file, on purpose. `main.ts` exists to do exactly one job — start the app — and nothing else. It doesn't even need to know what's INSIDE `App` or `appConfig`, only that they exist.",
    },
    {
      text: "The root component's template and its stylesheet.",
      why: "That's `app.html` and `app.css` — the actual markup and styles for the root component. `main.ts` never contains a template; it only imports the `App` class by name and hands it to `bootstrapApplication`.",
    },
    {
      text: 'The full list of routes the app supports.',
      why: "That's `app.routes.ts` — an array mapping a URL path to a component. `main.ts` doesn't know or care what the routes are; it just passes `appConfig` (which already imports the routes) straight through.",
    },
    {
      text: 'Every provider the app registers — the router, the HTTP client, error handling.',
      why: "That's `app.config.ts`. `main.ts` imports the finished `appConfig` object as a single value — it never lists a provider itself, so adding a new one never touches this file.",
    },
  ];

  /**
   * Sample: the pre-standalone bootstrap, for the {@link Compare} showing what
   * a migration schematic actually rewrites — not just recommends.
   */
  protected readonly bootstrapBeforeSample = `// main.ts, the NgModule era
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));`;

  /** Sample: the standalone bootstrap — the exact file read earlier on this page. */
  protected readonly bootstrapAfterSample = `// main.ts, current style
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));`;

  /** Caption under the before/after bootstrap comparison. */
  protected readonly migrationNote =
    "`ng update` didn't just bump a version number here — an actual migration schematic deleted `app.module.ts`, rewrote `main.ts`, and did the same across every file in the project that mentioned `AppModule`. That's the difference between a library update and a framework migration.";

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: '"ng: command not found" right after cloning a project I did not create. What is going on?',
      a: "You probably don't have the CLI installed globally, and you don't need it. Every project already has its own copy in `devDependencies` — run it through npm instead: `npm start`, `npm run build`, or `npx ng generate component foo`. A globally-installed `ng` can also just be a different version than the project expects, so preferring the local one is the safer habit even once you do have a global install.",
    },
    {
      q: 'My build failed with "budget exceeded" and I have never touched a budget in my life.',
      a: "`angular.json` ships with default size ceilings under `configurations.production.budgets`, so this can happen on a totally untouched project the moment a bundle crosses roughly 500kB. It isn't a bug — it's the CLI asking you to make a decision: trim what got heavier, or raise the number in `angular.json` on purpose. Treat it as a prompt, not an obstacle.",
    },
    {
      q: 'ng serve looks fine, then ng build shows something different, or fails outright.',
      a: '`ng serve` never writes to `dist/` and defaults to the **development** configuration — unminified, source maps on, budgets loosely enforced. A bare `ng build` defaults to **production** instead, which is the whole point: catching problems before a deploy rather than after. When the two disagree, run `ng build --configuration development` to isolate whether the bug is your code or the production settings.',
    },
    {
      q: 'What is actually different between `ng update` and `npm update`?',
      a: '`npm update` only resolves version ranges in `package.json` against whatever is newer — a plain dependency bump. `ng update` does that too, but it also runs any migration schematics Angular ships for that version, rewriting your source code for breaking changes automatically. That is the difference between "a newer library" and "a newer library, with your code already adjusted to match it".',
    },
    {
      q: 'I ran `ng generate component foo` and it also made a `foo.spec.ts` I never asked for. Why?',
      a: "That's the schematic doing its whole job, not just dropping a file. Angular's own generator assumes you want a test alongside every component; pass `--skip-tests` if you genuinely don't. This is also the advantage schematics have over copy-pasting an existing component: they know your project's conventions well enough to wire up more than one file at a time.",
    },
  ];
}
