import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CliExplorer } from './cli-explorer/cli-explorer';

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
@Component({
  selector: 'app-lesson-cli-project-structure',
  imports: [RouterLink, CliExplorer],
  templateUrl: './cli-project-structure.html',
  styleUrl: './cli-project-structure.css',
})
export class CliProjectStructure {
  /**
   * Sample: the commands you actually use day to day.
   */
  protected readonly commandsSample = `npm install -g @angular/cli      # install the CLI (or use npx)
ng new my-app                    # create a project
ng serve                         # dev server + live reload (localhost:4200)
ng build                         # production build → dist/
ng test                          # unit tests
ng generate component foo        # scaffold (alias: ng g c foo)
ng update                        # upgrade Angular & migrate code
ng add @angular/material         # install + configure a library`;

  /**
   * Sample: `main.ts` — `bootstrapApplication`, the first line of the app to run.
   */
  protected readonly mainSample = `// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));`;

  /**
   * Sample: `app.config.ts` — where providers are registered in a standalone app,
   * in place of the old root module.
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

  /**
   * Sample: `app.routes.ts` — the route table, with a lazy `loadComponent`.
   */
  protected readonly routesSample = `// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.Home) },
  { path: 'about', loadComponent: () => import('./about/about').then(m => m.About) },
  { path: '**', loadComponent: () => import('./not-found/not-found').then(m => m.NotFound) },
];`;

  /**
   * Sample: `app.ts` — the root component and its `<router-outlet />`.
   */
  protected readonly appSample = `// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',   // matched route renders here
})
export class App {}`;

  /**
   * Sample: the CLI flags worth knowing, including the generation flags that stop
   * `ng g` producing files you do not want.
   */
  protected readonly flagsSample = `ng serve --port 4300 --open              # custom port, open the browser
ng build --configuration development     # un-minified, source maps, no budgets
ng g component foo --inline-template --skip-tests --flat
ng test --watch=false --code-coverage    # one-shot run with coverage`;
}
