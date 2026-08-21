import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: CLI & Project Structure.
 *
 * Beyond a command cheat-sheet, this lesson builds a real mental model of the
 * toolchain: an interactive file-role explorer (click any file in a scaffolded
 * tree to see exactly what it does and why it exists), line-by-line reads of the
 * four files every new app boots from, a tour of angular.json / tsconfig and
 * build budgets, how `ng update` migrations actually work, and the CLI gotchas
 * (global vs local, cache, budgets) that trip people up.
 */

interface FileNode {
  path: string;
  label: string;
  role: string;
}

/**
 * Live demo — click a file in a fresh `ng new` tree to learn its job.
 * A single `selected` signal drives both the highlighted row and the detail
 * panel; the panel text is derived with `computed`.
 */
@Component({
  selector: 'app-cli-explorer',
  template: `
    <div class="cli-grid">
      <ul class="cli-tree">
        @for (f of files; track f.path) {
          <li>
            <button
              class="cli-row"
              [class.active]="selected().path === f.path"
              (click)="selected.set(f)">
              {{ f.label }}
            </button>
          </li>
        }
      </ul>
      <div class="cli-detail">
        <code>{{ selected().path }}</code>
        <p>{{ role() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .cli-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px; }
    .cli-tree { list-style: none; margin: 0; padding: 0; font-family: var(--font-mono, monospace); font-size: .85rem; }
    .cli-row { width: 100%; text-align: left; background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; cursor: pointer; color: var(--text); white-space: pre; }
    .cli-row:hover { background: var(--bg-elevated); }
    .cli-row.active { background: var(--violet); color: #fff; }
    .cli-detail { border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
    .cli-detail code { color: var(--violet); font-weight: 600; }
    .cli-detail p { margin: 8px 0 0; font-size: .9rem; }
    @media (max-width: 560px) { .cli-grid { grid-template-columns: 1fr; } }
  `],
})
export class CliExplorer {
  readonly files: FileNode[] = [
    { path: 'src/main.ts', label: '├─ main.ts', role: 'The entry point. Calls bootstrapApplication(App, appConfig) — this is the very first line of your code the browser runs.' },
    { path: 'src/index.html', label: '├─ index.html', role: 'The single host page. Contains <app-root></app-root>; Angular renders the whole app inside that tag. This is the "single page" of your SPA.' },
    { path: 'src/styles.css', label: '├─ styles.css', role: 'Global styles applied to the whole document — resets, CSS variables, fonts. Component styles are scoped; these are not.' },
    { path: 'src/app/app.ts', label: '│  ├─ app.ts', role: 'The root component. Every other component renders somewhere inside its template (usually via <router-outlet />).' },
    { path: 'src/app/app.config.ts', label: '│  ├─ app.config.ts', role: 'App-wide providers live here: provideRouter(routes), provideHttpClient(), and anything else the whole app needs from DI.' },
    { path: 'src/app/app.routes.ts', label: '│  └─ app.routes.ts', role: 'The route table: an array mapping URL paths to components (often lazy-loaded with loadComponent).' },
    { path: 'angular.json', label: '├─ angular.json', role: 'The CLI workspace config: build/serve/test targets, asset globs, and production budgets. Drives everything ng build does.' },
    { path: 'tsconfig.json', label: '├─ tsconfig.json', role: 'TypeScript + Angular compiler options: strictness, target, and template type-checking. This project is fully strict.' },
    { path: 'package.json', label: '└─ package.json', role: 'Dependencies and npm scripts (start, build, test). npm install reads this to set up node_modules.' },
  ];
  readonly selected = signal<FileNode>(this.files[0]);
  readonly role = computed(() => this.selected().role);
}

@Component({
  selector: 'app-lesson-cli-project-structure',
  imports: [RouterLink, CliExplorer],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Getting Started</span>
      <h1>CLI &amp; Project Structure</h1>
      <p class="lead">
        The Angular CLI (<code>ng</code>) is the one tool that scaffolds, builds, serves,
        tests and upgrades your app. It matters because it makes every Angular project look
        the same: learn one layout and you can navigate any codebase. This lesson explains
        not just <em>which</em> commands to run but <em>what each generated file is for</em>,
        how the build is configured, and how upgrades stay painless.
      </p>

      <h2>Why a CLI at all?</h2>
      <p>
        Modern front-end apps need a compiler (TypeScript → JS), a bundler, a dev server,
        a test runner, and a way to keep all of them on compatible versions. The CLI bundles
        that entire toolchain behind a handful of commands, so you configure almost nothing.
        The alternative — wiring webpack/esbuild, Karma/Vitest and tsconfig by hand — is exactly
        the "glue work" Angular is designed to remove.
      </p>

      <h2>Core commands</h2>
      <div class="code"><pre>{{ commandsSample }}</pre></div>
      <ul>
        <li><code>ng new</code> — scaffolds a workspace: installs deps, sets up Git, TypeScript, testing and a runnable app.</li>
        <li><code>ng serve</code> — compiles in memory and serves at <code>localhost:4200</code> with live reload; it never writes to <code>dist/</code>.</li>
        <li><code>ng build</code> — produces an optimized bundle in <code>dist/</code> for deployment (minified, tree-shaken, hashed filenames).</li>
        <li><code>ng generate</code> (<code>ng g</code>) — runs a <strong>schematic</strong>: a code generator that creates files <em>and</em> wires them up correctly.</li>
        <li><code>ng update</code> — upgrades Angular packages and runs migrations that rewrite your code for breaking changes.</li>
        <li><code>ng add</code> — installs a library <em>and</em> runs its setup schematic (e.g. Angular Material configures theming for you).</li>
      </ul>

      <h2>Live — what is each file for?</h2>
      <p>
        This is the tree <code>ng new my-app</code> produces. Click any file to see the job it
        does. Notice how few files there are: a modern standalone app has no <code>NgModule</code>
        boilerplate to wade through.
      </p>
      <div class="demo">
        <p class="demo__title">Live — click a file to learn its role</p>
        <app-cli-explorer />
      </div>

      <h2>The four files an app boots from</h2>
      <p>Reading these top-to-bottom shows the whole startup path. First, the entry point:</p>
      <div class="code"><pre>{{ mainSample }}</pre></div>
      <ul>
        <li><code>import {{ '{' }} App {{ '}' }}</code> — the root component class.</li>
        <li><code>import {{ '{' }} appConfig {{ '}' }}</code> — the providers object from <code>app.config.ts</code>.</li>
        <li><code>bootstrapApplication(App, appConfig)</code> — mounts <code>App</code> into <code>&lt;app-root&gt;</code> and returns a promise; <code>.catch</code> logs any startup error.</li>
      </ul>
      <p>Next, the providers it hands in:</p>
      <div class="code"><pre>{{ configSample }}</pre></div>
      <ul>
        <li><code>ApplicationConfig</code> — a typed object with a <code>providers</code> array.</li>
        <li><code>provideRouter(routes)</code> — enables routing using the table from <code>app.routes.ts</code>.</li>
        <li><code>provideHttpClient()</code> — registers <code>HttpClient</code> so services can call APIs.</li>
        <li>Anything added here is available to <em>every</em> component via dependency injection.</li>
      </ul>
      <p>The route table:</p>
      <div class="code"><pre>{{ routesSample }}</pre></div>
      <ul>
        <li>Each entry maps a <code>path</code> to a component.</li>
        <li><code>loadComponent: () =&gt; import(...)</code> — <strong>lazy loads</strong> the component: its code ships as a separate chunk downloaded only when the route is visited.</li>
        <li>Order matters: the router picks the <em>first</em> match, so put specific paths before wildcards.</li>
      </ul>
      <p>And the root component itself:</p>
      <div class="code"><pre>{{ appSample }}</pre></div>
      <ul>
        <li><code>imports: [RouterOutlet]</code> — standalone components list their own template dependencies.</li>
        <li><code>&lt;router-outlet /&gt;</code> — the placeholder where the router renders the matched route's component.</li>
      </ul>

      <h2>Generate schematics (and why they beat copy-paste)</h2>
      <p>
        <code>ng generate</code> doesn't just drop a file — it applies your project's conventions
        and can update related files. Generating a component gives you a correctly-decorated
        standalone class and (optionally) its spec, named per the Angular style guide.
      </p>
      <table class="cmp">
        <tr><th>Command</th><th>Creates</th></tr>
        <tr><td><code>ng g component x</code></td><td>A standalone component (+ <code>.spec.ts</code>)</td></tr>
        <tr><td><code>ng g service x</code></td><td>An <code>&#64;Injectable()</code> service</td></tr>
        <tr><td><code>ng g directive x</code></td><td>An attribute/structural directive</td></tr>
        <tr><td><code>ng g pipe x</code></td><td>A custom pipe class</td></tr>
        <tr><td><code>ng g guard x</code></td><td>A functional route guard</td></tr>
        <tr><td><code>ng g interface x</code> / <code>enum x</code></td><td>Plain TypeScript types</td></tr>
      </table>

      <h2>Build configurations &amp; budgets</h2>
      <div class="code"><pre>{{ flagsSample }}</pre></div>
      <p>
        <code>angular.json</code> defines named <strong>configurations</strong> —
        <code>production</code> and <code>development</code> — that swap optimization, source maps
        and file replacements. Production also enforces <strong>budgets</strong>: size ceilings
        that fail the build if a bundle or a component's CSS grows too large, catching bloat before
        it ships. The build output lands in <code>dist/</code>; the CLI cache lives in
        <code>.angular/cache</code>.
      </p>

      <h2>How <code>ng update</code> keeps upgrades boring</h2>
      <p>
        When Angular makes a breaking change, it also ships a <strong>migration schematic</strong>.
        <code>ng update</code> bumps the versions <em>and</em> runs those migrations against your
        source — for example, the automated rewrite from <code>*ngIf</code>/<code>*ngFor</code> to
        the new <code>&#64;if</code>/<code>&#64;for</code> control flow. That's why Angular upgrades
        are usually a command and a review, not a rewrite.
      </p>

      <h2>Gotchas that trip people up</h2>
      <div class="qa">
        <details>
          <summary>"ng: command not found" after cloning a project.</summary>
          <div>Use the <em>local</em> CLI via npm scripts (<code>npm start</code>, <code>npm run build</code>) or <code>npx ng ...</code>. A globally-installed <code>ng</code> can also be a different version than the project's — prefer the local one for consistency.</div>
        </details>
        <details>
          <summary>"Budget exceeded" build error.</summary>
          <div>A bundle or component stylesheet crossed the ceiling in <code>angular.json</code>. Either trim it, or raise the budget deliberately — the error is a prompt to decide, not a bug.</div>
        </details>
        <details>
          <summary>Stale/weird build results.</summary>
          <div>Clear <code>.angular/cache</code> (or run with <code>--no-cache</code>). Also check your Node version matches the range in <code>package.json</code>'s <code>engines</code>.</div>
        </details>
      </div>

      <div class="tip">
        Run <code>ng &lt;command&gt; --help</code> to see every flag. <code>ng generate --help</code>
        lists all available schematics — including any added by libraries you installed with
        <code>ng add</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>ng new / serve / build / test / generate / update / add</code> cover the everyday workflow.</li>
        <li>An app boots <code>main.ts</code> → <code>bootstrapApplication(App, appConfig)</code> → routes render in <code>&lt;router-outlet /&gt;</code>.</li>
        <li><code>angular.json</code> drives builds (configs + budgets); <code>tsconfig.json</code> drives type-checking.</li>
        <li>Schematics generate <em>and wire up</em> code; <code>ng update</code> migrations rewrite it across versions.</li>
        <li>Prefer the project-local CLI (<code>npm run …</code> / <code>npx ng</code>) over a global install.</li>
      </ul>

      <p><a routerLink="/components">Next: Components →</a></p>
    </article>
  `,
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    table.cmp td:first-child { white-space: nowrap; }

    .qa { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
    .qa details { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
})
export class CliProjectStructure {
  protected readonly commandsSample = `npm install -g @angular/cli      # install the CLI (or use npx)
ng new my-app                    # create a project
ng serve                         # dev server + live reload (localhost:4200)
ng build                         # production build → dist/
ng test                          # unit tests
ng generate component foo        # scaffold (alias: ng g c foo)
ng update                        # upgrade Angular & migrate code
ng add @angular/material         # install + configure a library`;

  protected readonly mainSample = `// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));`;

  protected readonly configSample = `// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};`;

  protected readonly routesSample = `// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.Home) },
  { path: 'about', loadComponent: () => import('./about/about').then(m => m.About) },
  { path: '**', loadComponent: () => import('./not-found/not-found').then(m => m.NotFound) },
];`;

  protected readonly appSample = `// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',   // matched route renders here
})
export class App {}`;

  protected readonly flagsSample = `ng serve --port 4300 --open              # custom port, open the browser
ng build --configuration development     # un-minified, source maps, no budgets
ng g component foo --inline-template --skip-tests --flat
ng test --watch=false --code-coverage    # one-shot run with coverage`;
}
