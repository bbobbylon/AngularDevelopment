import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-cli-project-structure',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Getting Started</span>
      <h1>CLI & Project Structure</h1>
      <p class="lead">
        The Angular CLI (<code>ng</code>) scaffolds, builds, serves, tests and
        upgrades your app. Knowing its core commands and the default project layout
        is exam-essential.
      </p>

      <h2>Core commands</h2>
      <div class="code">
        <pre>npm install -g &#64;angular/cli      # install the CLI
ng new my-app                    # create a project
ng serve                         # dev server + live reload (localhost:4200)
ng build                         # production build → dist/
ng test                          # unit tests
ng generate component foo        # scaffold (alias: ng g c foo)
ng generate service bar          # service, directive, pipe, guard, …
ng update                        # upgrade Angular & migrate code
ng add &#64;angular/material         # install + configure a library</pre>
      </div>

      <h2>Generate schematics</h2>
      <table class="t">
        <tr><td><code>ng g component x</code></td><td>standalone component (+ spec)</td></tr>
        <tr><td><code>ng g service x</code></td><td>injectable service</td></tr>
        <tr><td><code>ng g directive x</code></td><td>attribute/structural directive</td></tr>
        <tr><td><code>ng g pipe x</code></td><td>custom pipe</td></tr>
        <tr><td><code>ng g guard x</code></td><td>functional route guard</td></tr>
        <tr><td><code>ng g interface x</code> / <code>enum x</code></td><td>plain TS types</td></tr>
      </table>

      <h2>Default project layout</h2>
      <div class="code">
        <pre>my-app/
├─ src/
│  ├─ main.ts              # bootstraps the root component
│  ├─ index.html           # the single host page (&lt;app-root&gt;)
│  ├─ styles.css           # global styles
│  └─ app/
│     ├─ app.ts            # root component
│     ├─ app.html / .css   # its template & styles
│     ├─ app.config.ts     # app-wide providers
│     └─ app.routes.ts     # route table
├─ public/                 # static assets copied as-is
├─ angular.json            # CLI workspace config (builders, budgets)
├─ tsconfig*.json          # TypeScript config
└─ package.json            # dependencies & scripts</pre>
      </div>

      <h2>Key config files</h2>
      <ul>
        <li><strong>angular.json</strong> — build/serve/test "architect" targets, asset globs, production budgets.</li>
        <li><strong>tsconfig.json</strong> — compiler strictness (this project is fully <code>strict</code>) and Angular template options.</li>
        <li><strong>app.config.ts</strong> — where you register providers like <code>provideRouter</code> / <code>provideHttpClient</code>.</li>
      </ul>

      <h2>Useful flags & build configurations</h2>
      <div class="code">
        <pre>ng serve --port 4300 --open       # custom port, open the browser
ng build --configuration development   # un-minified, source maps, no budgets
ng generate component foo --inline-template --skip-tests --flat
ng test --watch=false --code-coverage  # one-shot run with coverage</pre>
      </div>
      <p>
        <code>angular.json</code> defines named <strong>configurations</strong>
        (<code>production</code>, <code>development</code>) that swap optimization,
        source maps and file replacements. The build output goes to <code>dist/</code>;
        the CLI cache lives in <code>.angular/cache</code>.
      </p>

      <div class="tip">
        Run <code>ng generate --help</code> or <code>ng &lt;command&gt; --help</code> to see
        every option. The CLI also powers <code>ng update</code> migrations that
        rewrite your code when Angular evolves (e.g. control-flow migration).
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>ng new/serve/build/test/generate/update/add</code> are the everyday commands.</li>
        <li>An app boots from <code>main.ts</code> → root component, configured in <code>app.config.ts</code>.</li>
        <li><code>angular.json</code> drives builds; <code>tsconfig.json</code> drives type-checking.</li>
      </ul>

      <p><a routerLink="/components">Next: Components →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { white-space: nowrap; }`,
  ],
})
export class CliProjectStructure {}
