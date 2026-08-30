import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * One import form, with the code that writes it and what it actually binds.
 */
interface ImportKind {
  label: string;
  code: string;
  explain: string;
}

const IMPORT_KINDS: ImportKind[] = [
  {
    label: 'named',
    code: `import { makeUser, VERSION } from './user';`,
    explain:
      'Pick specific exports by their exact names — the braces are a (limited) destructuring-like syntax. Tooling loves this form: auto-import, find-all-references, and rename refactors all key off the shared name. Tree-shaking can drop unimported siblings.',
  },
  {
    label: 'named + rename',
    code: `import { makeUser as create } from './user';`,
    explain:
      '"as" renames on the way in — for collisions (two modules both export a "Config") or clarity. The exporting file is untouched; the alias is local to this importer.',
  },
  {
    label: 'default',
    code: `import Logger from './logger';`,
    explain:
      "No braces = the default export. YOU choose the local name, which is exactly its weakness: three files can call it Logger, Log and L, and rename-refactoring can't connect them. Hence the Angular-world preference for named exports.",
  },
  {
    label: 'namespace',
    code: `import * as utils from './utils';`,
    explain:
      'Bundle every export into one object: utils.formatDate(…), utils.clamp(…). Good when a module is a grab-bag of helpers and the prefix reads well; the price is that bundlers find it harder to prove which members are unused.',
  },
  {
    label: 'side-effect',
    code: `import './polyfills';`,
    explain:
      'Imports NOTHING — it just runs the module\'s top-level code once. Used for polyfills and registrations (zone.js was historically loaded this way). If you delete an import and behaviour changes despite "nothing" being imported, it was one of these.',
  },
  {
    label: 'type-only',
    code: `import type { User } from './user';`,
    explain:
      'Declares the import is types-only, so it is FULLY ERASED from the emitted JavaScript — no runtime dependency edge at all. Required discipline under isolatedModules (this project has it on), and it can even break real circular-import crashes when the cycle is types-only.',
  },
];

/**
 * Lesson: Modules, Imports & Exports — ES modules as TypeScript uses them.
 *
 * Covers named against default exports, `import type`, re-exports and barrel
 * files, and why a module's *file* is its boundary. Also the Angular-specific
 * point that ES modules are not `NgModule`s: in standalone Angular the two are
 * unrelated, and conflating them is a common source of confusion for anyone
 * arriving from older tutorials.
 *
 * The demo steps through each import form and shows what it actually binds:
 * named, default, namespace and side-effect imports, one at a time.
 *
 * Also covers module resolution, barrels and the mechanics of a circular
 * import, why `isolatedModules` cares about type-only imports, dynamic
 * `import()` as the engine behind lazy loading, and the fact that module
 * state is a singleton — evaluated once, shared by every importer.
 */
@Component({
  selector: 'app-lesson-ts-modules',
  imports: [RouterLink, Compare, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules {
  /**
   * What happens the first time a module is imported. Worth drawing because two of
   * the lesson's headline facts — that module state is a singleton, and that a
   * circular import produces a half-initialised object rather than an obvious
   * error — are both consequences of steps in this one sequence.
   */
  protected readonly loading = [
    {
      label: 'Something imports `./user`',
      detail: 'The first import is what triggers everything below',
    },
    {
      label: 'Its own imports resolve first',
      detail: 'Depth-first. A module cannot run before what it depends on',
      tone: 'accent' as const,
    },
    {
      label: 'Top-level code runs — once',
      detail: 'Every `const`, every side effect, exactly one time',
    },
    { label: 'The module is cached', detail: 'Its exports are recorded against the resolved path' },
    {
      label: 'Every later import is a cache hit',
      detail: 'No re-run, no second copy. This is why module state is a singleton',
      tone: 'good' as const,
    },
  ];

  /** The barrel cycle. */
  protected readonly cycleSample = `// core/index.ts  (the barrel)
export * from './order-service';
export * from './user-service';

// core/user-service.ts
import { OrderService } from './index';   // ← imports its own barrel
export class UserService {
  private orders = new OrderService();
}

// Dev server: fine. Production build: crash.
// What is the error, and why only in production?`;

  /** Choices for the module-singleton check. */
  protected readonly singletonOptions = [
    {
      text: '`1` — each importing file gets its own copy of the module',
      why: 'This is the intuition from `class` or from a factory function, where each consumer constructs its own. Modules do not work that way: they are evaluated once and cached against their resolved path, and every importer is handed the same object.',
    },
    {
      text: '`2` — both files share one `count`',
      correct: true,
      why: 'A module runs its top-level code exactly once, on first import, and every later import is a cache hit. So `count` is one variable that both files are incrementing. This is genuinely useful — it is the simplest singleton in JavaScript — and genuinely dangerous, because the coupling is invisible at the call site. Angular DI gives you the same single-instance behaviour with an injector you can override in a test, which is why services beat module-level `let`.',
    },
    {
      text: '`2`, but only because `a.ts` happened to run first',
      why: 'The sharing is not an ordering accident — it would be one shared `count` regardless of who imports first. Order decides which call sees `1`; it does not decide whether the state is shared.',
    },
    {
      text: 'Unpredictable — bundlers may or may not deduplicate the module',
      why: 'Single evaluation per resolved specifier is part of the ES module specification, not a bundler optimisation. The one way to get two copies is to resolve the same file by two different paths, which is a build misconfiguration rather than normal behaviour.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Are ES modules the same thing as Angular `NgModule`s?',
      a: 'No, and the shared word is one of the more expensive collisions in the Angular vocabulary. An ES module is a *file* — a language feature about scope and imports. An `NgModule` was an Angular construct for declaring which components see which directives, and standalone components removed the need for it entirely. You use ES modules constantly; you will probably never write an `NgModule` again.',
    },
    {
      q: 'Should I use barrel files at all?',
      a: "For the public surface of a library, yes — that is exactly what an `index.ts` is for. Inside your own app, be sparing. A barrel adds a hop for the bundler to reason through, and it invites the cycle where a folder's own files import their own barrel. The rule that avoids nearly all the pain: never import your own barrel from inside the folder it describes.",
    },
    {
      q: 'Why does `import type` exist when TypeScript already erases types?',
      a: 'Because under `isolatedModules` — which this project uses, and which any modern build with esbuild or SWC effectively requires — each file is transpiled in isolation. The transpiler cannot open `./user` to check whether `User` is a type it should erase or a class it must keep, so you tell it locally. The bonus is real: an erased import creates no runtime dependency edge, so a cycle that was only ever about types simply stops existing.',
    },
    {
      q: 'Does a namespace import (`import * as utils`) hurt tree-shaking?',
      a: 'It can. Bundlers have got good at proving which members of a namespace object you actually touch, but the analysis is harder than for named imports and it gives up more easily — particularly if the object is passed around or indexed dynamically. Named imports state your intent in a form the bundler never has to infer, which is the main reason they are house style.',
    },
    {
      q: 'Can I `import()` a path built at runtime?',
      a: 'You can write it, and it will fail to code-split usefully. The bundler needs to see the target at build time to carve out a chunk for it; `import(someString)` gives it nothing to work with, so it either bundles everything that could match or leaves you with a runtime failure. This is why lazy routes are always written as an arrow function around a literal path.',
    },
  ];

  /**
   * The import forms the demo can step through.
   */
  protected readonly kinds = IMPORT_KINDS;
  /**
   * Which import form is currently selected.
   */
  protected readonly kind = signal<ImportKind>(IMPORT_KINDS[0]);
}
