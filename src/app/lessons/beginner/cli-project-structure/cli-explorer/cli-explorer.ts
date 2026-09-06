import { Component, computed, signal } from '@angular/core';
import { FileNode } from '../cli-project-structure.shared';

/**
 * Live demo — click a file in a fresh `ng new` tree to learn its job.
 * A single `selected` signal drives both the highlighted row and the detail
 * panel; the panel text is derived with `computed`.
 */
@Component({
  selector: 'app-cli-explorer',
  templateUrl: './cli-explorer.html',
  styleUrl: './cli-explorer.css',
})
export class CliExplorer {
  /**
   * The tree a fresh `ng new` produces today, in the order it appears on
   * disk (Angular 21, 2025-style file naming, `public/` in place of the old
   * `src/assets/`) — verified against this project's own root files rather
   * than assumed from memory.
   */
  readonly files: FileNode[] = [
    {
      path: 'public/favicon.ico',
      label: '├─ favicon.ico',
      role: 'A binary image, not code. Copied byte-for-byte from public/ into the build output root, thanks to the assets glob in angular.json — this is the whole reason public/ exists as its own top-level folder instead of living under src/.',
    },
    {
      path: 'src/main.ts',
      label: '├─ main.ts',
      role: 'The entry point. Calls bootstrapApplication(App, appConfig) — this is the very first line of your own code the browser runs.',
    },
    {
      path: 'src/index.html',
      label: '├─ index.html',
      role: 'The single host page. Contains <app-root></app-root>; Angular renders the whole app inside that tag. This is the "single page" of your SPA.',
    },
    {
      path: 'src/styles.css',
      label: '├─ styles.css',
      role: 'Global styles applied to the whole document — resets, CSS variables, fonts. Component styles (app.css and friends) are scoped to their own component; this one is not scoped to anything.',
    },
    {
      path: 'src/app/app.ts',
      label: '│  ├─ app.ts',
      role: "The root component's class and @Component metadata. Every other component renders somewhere inside its template, usually via <router-outlet />.",
    },
    {
      path: 'src/app/app.html',
      label: '│  ├─ app.html',
      role: "The root component's template — one line, <router-outlet />, in a fresh project. Whatever route is active renders exactly there.",
    },
    {
      path: 'src/app/app.css',
      label: '│  ├─ app.css',
      role: "The root component's own styles, scoped to it alone. Empty in a fresh project — there's nothing to style yet.",
    },
    {
      path: 'src/app/app.config.ts',
      label: '│  ├─ app.config.ts',
      role: 'App-wide providers live here: provideRouter(routes), provideHttpClient(), and anything else the whole app needs from DI. This is the standalone replacement for the old root NgModule.',
    },
    {
      path: 'src/app/app.routes.ts',
      label: '│  ├─ app.routes.ts',
      role: 'The route table: an array mapping URL paths to components (often lazy-loaded with loadComponent).',
    },
    {
      path: 'src/app/app.spec.ts',
      label: '│  └─ app.spec.ts',
      role: 'The unit test for the root component, scaffolded automatically alongside it — this is exactly the file a --skip-tests flag would have skipped.',
    },
    {
      path: 'angular.json',
      label: '├─ angular.json',
      role: 'The CLI workspace config: build/serve/test targets, the asset glob that makes public/ meaningful, and production size budgets. Drives everything ng build and ng serve do.',
    },
    {
      path: 'package.json',
      label: '├─ package.json',
      role: 'Dependencies and npm scripts (start, build, test). npm install reads this to populate node_modules — and it does NOT control build output, a common mix-up with angular.json.',
    },
    {
      path: 'tsconfig.json',
      label: '├─ tsconfig.json',
      role: 'The base TypeScript + Angular compiler options shared by the whole workspace: strictness, target, and template type-checking.',
    },
    {
      path: 'tsconfig.app.json',
      label: '├─ tsconfig.app.json',
      role: 'Extends tsconfig.json specifically for the application build — this is the config ng build actually compiles against.',
    },
    {
      path: 'tsconfig.spec.json',
      label: '└─ tsconfig.spec.json',
      role: 'Extends tsconfig.json specifically for the test build ng test compiles against — kept separate so test-only types never leak into the app bundle.',
    },
  ];
  /**
   * The file being examined. Seeded on `main.ts` (index 1 — index 0 is
   * `favicon.ico`) since that is the first file the lesson's prose walks
   * through, so the explorer opens already agreeing with the reading order.
   */
  readonly selected = signal<FileNode>(this.files[1]);
  /**
   * Its description.
   */
  readonly role = computed(() => this.selected().role);
}
