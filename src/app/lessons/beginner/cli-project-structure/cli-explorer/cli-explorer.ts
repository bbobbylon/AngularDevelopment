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
   * The tree a fresh `ng new` produces, in the order it appears on disk.
   */
  readonly files: FileNode[] = [
    {
      path: 'src/main.ts',
      label: '├─ main.ts',
      role: 'The entry point. Calls bootstrapApplication(App, appConfig) — this is the very first line of your code the browser runs.',
    },
    {
      path: 'src/index.html',
      label: '├─ index.html',
      role: 'The single host page. Contains <app-root></app-root>; Angular renders the whole app inside that tag. This is the "single page" of your SPA.',
    },
    {
      path: 'src/styles.css',
      label: '├─ styles.css',
      role: 'Global styles applied to the whole document — resets, CSS variables, fonts. Component styles are scoped; these are not.',
    },
    {
      path: 'src/app/app.ts',
      label: '│  ├─ app.ts',
      role: 'The root component. Every other component renders somewhere inside its template (usually via <router-outlet />).',
    },
    {
      path: 'src/app/app.config.ts',
      label: '│  ├─ app.config.ts',
      role: 'App-wide providers live here: provideRouter(routes), provideHttpClient(), and anything else the whole app needs from DI.',
    },
    {
      path: 'src/app/app.routes.ts',
      label: '│  └─ app.routes.ts',
      role: 'The route table: an array mapping URL paths to components (often lazy-loaded with loadComponent).',
    },
    {
      path: 'angular.json',
      label: '├─ angular.json',
      role: 'The CLI workspace config: build/serve/test targets, asset globs, and production budgets. Drives everything ng build does.',
    },
    {
      path: 'tsconfig.json',
      label: '├─ tsconfig.json',
      role: 'TypeScript + Angular compiler options: strictness, target, and template type-checking. This project is fully strict.',
    },
    {
      path: 'package.json',
      label: '└─ package.json',
      role: 'Dependencies and npm scripts (start, build, test). npm install reads this to set up node_modules.',
    },
  ];
  /**
   * The file being examined. Seeded with the first so the explorer opens on
   * something rather than an empty panel.
   */
  readonly selected = signal<FileNode>(this.files[0]);
  /**
   * Its description.
   */
  readonly role = computed(() => this.selected().role);
}
