import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One dependency-placement choice, with the failure mode picking wrong causes.
 */
interface DepChoice {
  label: string;
  field: 'peerDependencies' | 'dependencies' | 'devDependencies';
  why: string;
}

const DEP_CHOICES: DepChoice[] = [
  {
    label: '@angular/core',
    field: 'peerDependencies',
    why: "The consumer already has Angular — declaring it as a regular dependency risks TWO copies of the framework in one app (broken DI, doubled bundle). Peer means: 'I work with YOUR Angular, require version >= X'.",
  },
  {
    label: 'tslib',
    field: 'dependencies',
    why: 'Runtime helpers your compiled output actually imports. Consumers should get it automatically without knowing it exists — the classic legitimate "dependencies" entry for a library (ng-packagr adds it by default).',
  },
  {
    label: "date-fns (used in your lib's code)",
    field: 'dependencies',
    why: 'A true runtime dependency the consumer does not necessarily have. Regular dependency — but every one you add is weight and version-conflict surface for every consumer; audit ruthlessly. ng-packagr will warn unless it\'s whitelisted in "allowedNonPeerDependencies".',
  },
  {
    label: 'jest / vitest',
    field: 'devDependencies',
    why: 'Build/test-time only — never shipped, never installed by consumers. Tooling always goes here in the workspace root.',
  },
  {
    label: '@angular/material (you build on top of it)',
    field: 'peerDependencies',
    why: "Same rule as the framework: the consumer's app almost certainly pins its own Material version, and two copies means broken theming and duplicated styles. Peer + a honest version range.",
  },
];

/**
 * Lesson: Angular libraries & schematics in depth — the Angular Package
 * Format and partial compilation (what actually ships to npm), public-api
 * surface discipline, secondary entry points, the peerDependencies quiz
 * (interactive), authoring schematics on the virtual Tree, and wiring
 * ng add / ng update so consumers install and upgrade automatically.
 */
@Component({
  selector: 'app-lesson-libraries-schematics',
  imports: [RouterLink],
  styleUrl: './libraries-schematics.css',
  templateUrl: './libraries-schematics.html',
})
export class LibrariesSchematics {
  /**
   * The dependency-placement choices.
   */
  readonly depChoices = DEP_CHOICES;
  /**
   * The choice being examined, or `null` for none.
   */
  readonly activeDep = signal<DepChoice | null>(null);

  /**
   * Sample: `ng generate library`, and what the Angular Package Format build
   * produces.
   */
  readonly createSample = `ng generate library ui-kit     # projects/ui-kit + ng-package.json
ng build ui-kit                # → dist/ui-kit in Angular Package Format

// projects/ui-kit/src/public-api.ts — THE public surface
export * from './lib/button/button';
export * from './lib/card/card';
export { UiKitConfig } from './lib/config';   // deliberate, named exports

// dist layout (APF):
//   fesm2022/ui-kit.mjs      flat ES module, partially compiled
//   index.d.ts               types
//   package.json             exports map, sideEffects: false`;

  /**
   * Sample: secondary entry points, so consumers can import test helpers without
   * dragging them into the main bundle.
   */
  readonly entryPointsSample = `projects/ui-kit/
  src/public-api.ts            → import { Button } from 'ui-kit'
  testing/
    ng-package.json            → makes it an entry point
    src/public-api.ts          → import { FakeApi } from 'ui-kit/testing'`;

  /**
   * Sample: `collection.json` and a schematic factory — a `Tree` in, a `Tree` out.
   */
  readonly schematicSample = `// collection.json — the schematic registry
{ "schematics": {
    "widget": { "factory": "./widget/index#widget",
                "schema": "./widget/schema.json",
                "description": "Generate a ui-kit widget" } } }

// widget/index.ts — a Rule over the virtual Tree
export function widget(options: WidgetSchema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const source = apply(url('./files'), [        // ./files holds templates
      template({ ...options, ...strings }),        // __name__.ts.template etc.
      move(options.path),
    ]);
    return chain([mergeWith(source)]);             // atomic: all or nothing
  };
}

ng generate ui-kit:widget --name=save-button --dry-run`;

  /**
   * Sample: `SchematicTestRunner`, which runs a schematic against an in-memory
   * tree so it can be tested without touching disk.
   */
  readonly testSample = `// in-memory schematic test — no disk, no publishing
const runner = new SchematicTestRunner('ui-kit', collectionPath);
const tree = await runner.runSchematic('widget', { name: 'save' }, Tree.empty());

expect(tree.files).toContain('/save/save.ts');
expect(tree.readContent('/save/save.ts')).toContain('class Save');`;

  /**
   * Sample: `ng-add`, the hook that runs when someone installs the library.
   */
  readonly ngAddSample = `// package.json
{ "schematics": "./schematics/collection.json",
  "ng-add": { "save": "dependencies" } }        // or false: tooling-only, don't save

// schematics/ng-add/index.ts
export function ngAdd(): Rule {
  return chain([
    addRootProvider('my-lib', ({ code, external }) =>
      code\`\${external('provideMyLib', 'my-lib')}()\`),   // wires app.config.ts
    (tree) => addStyleToAngularJson(tree, 'node_modules/my-lib/styles.css'),
  ]);
}`;

  /**
   * Sample: `ng-update` migrations — the mechanism that lets a library ship a
   * breaking change with a codemod that fixes it.
   */
  readonly ngUpdateSample = `// package.json
{ "ng-update": { "migrations": "./schematics/migrations.json" } }

// migrations.json — keyed by the version that introduced the break
{ "schematics": {
    "rename-config-token": {
      "version": "3.0.0",
      "factory": "./migrations/v3/rename-token",
      "description": "MY_LIB_CONFIG → provideMyLib()" },
    "signal-inputs": {
      "version": "4.0.0",
      "factory": "./migrations/v4/signal-inputs" } } }

ng update my-lib   # 2.x → 4.x runs BOTH migrations, in order`;
}
