import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules {
  /**
   * The import forms the demo can step through.
   */
  protected readonly kinds = IMPORT_KINDS;
  /**
   * Which import form is currently selected.
   */
  protected readonly kind = signal<ImportKind>(IMPORT_KINDS[0]);
}
