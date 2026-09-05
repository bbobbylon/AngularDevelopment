import type { CheatSheet } from './cheat-sheet.model';

/** Angular CLI — scaffold, generate, serve, build. */
export const ANGULAR_CLI_SHEET: CheatSheet = {
  id: 'angular-cli',
  title: 'Angular CLI',
  icon: '🅰️',
  tagline: 'Zero to a running Angular app, from scaffold to production build.',
  category: 'framework',
  intro:
    'The CLI is how you touch an Angular project on the command line: it scaffolds new apps, ' +
    'generates the pieces inside them, runs the dev server, and produces the build you ship. ' +
    'Everything below assumes a recent CLI (v17+), where standalone components are the default ' +
    'and NgModules are opt-in rather than required.',
  sections: [
    {
      title: 'Install & scaffold',
      intro: 'One global install, then one command per new project.',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'npm install -g @angular/cli',
              note: 'Installs the `ng` command globally. You only do this once per machine.',
            },
            {
              code: 'ng new my-app',
              note:
                'Scaffolds a new standalone-components app, asks a few prompts (routing, stylesheet ' +
                'format), and runs the first `npm install` for you.',
            },
            {
              code: 'ng new my-app --style=scss --routing --skip-tests',
              note: 'The same scaffold, non-interactively — useful in scripts or CI.',
            },
            {
              code: 'cd my-app && ng serve',
              note: 'Starts the dev server with live reload, default at http://localhost:4200.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'tip',
          text:
            'Add "--dry-run" to any `ng generate`/`ng new` command to preview exactly which files ' +
            'it would create or touch, without writing anything.',
        },
      ],
    },
    {
      title: 'Generate code',
      intro:
        'Every `ng generate` has a short alias — `ng g c` is the same as `ng generate component`.',
      blocks: [
        {
          kind: 'table',
          title: 'Common schematics',
          headers: ['Command', 'Alias', 'Creates'],
          rows: [
            ['ng generate component foo', 'ng g c foo', 'A standalone component (.ts/.html/.css)'],
            ['ng generate service foo', 'ng g s foo', 'An @Injectable service class'],
            ['ng generate directive foo', 'ng g d foo', 'A standalone directive'],
            ['ng generate pipe foo', 'ng g p foo', 'A standalone pipe'],
            ['ng generate guard foo', 'ng g g foo', 'A CanActivate-style route guard function'],
            ['ng generate interface foo', 'ng g i foo', 'A plain .ts file with one interface'],
            ['ng generate resolver foo', 'ng g r foo', 'A route data resolver function'],
          ],
        },
        {
          kind: 'tip',
          tone: 'gotcha',
          text:
            'Since Angular 17, `ng generate component` produces a standalone component by default ' +
            '(no NgModule to declare it in). If a tutorial you are following shows `declarations: [...]` ' +
            'in an NgModule, it predates this default — pass `--standalone=false` only if you deliberately ' +
            'want the old style.',
        },
      ],
    },
    {
      title: 'Daily commands',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            { code: 'ng serve', note: 'Dev server with live reload. Default port 4200.' },
            {
              code: 'ng serve --port 4300 --open',
              note: 'Custom port, and opens the browser automatically.',
            },
            {
              code: 'ng build',
              note: 'Production build by default, output to dist/<project-name>.',
            },
            {
              code: 'ng build --configuration development',
              note: 'A faster, unminified build for debugging a build-only issue.',
            },
            {
              code: 'ng test',
              note: 'Runs the unit test suite (Karma/Jasmine or Vitest, per project setup).',
            },
            {
              code: 'ng lint',
              note: 'Runs ESLint over the project, if the schematic is installed.',
            },
            {
              code: 'ng update',
              note: 'Upgrades Angular and CLI packages one major version at a time, rewriting code where it can.',
            },
            {
              code: 'ng add @angular/material',
              note: 'Installs a library AND runs its setup schematic — not just an npm install.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'warn',
          text:
            'A production `ng build` output is a set of static files with client-side routing. Deploying ' +
            'it to a plain static host without a rewrite rule means a deep link like /practice returns a ' +
            '404 on refresh — the host needs to serve index.html for unknown paths (this is what ' +
            '"--base-href" and your host\'s SPA-rewrite setting are both about).',
        },
      ],
    },
  ],
};
