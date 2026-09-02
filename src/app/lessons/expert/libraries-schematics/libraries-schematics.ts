import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

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
    why: 'A true runtime dependency the consumer does not necessarily have. Regular dependency — but every one you add is weight and version-conflict surface for every consumer; audit ruthlessly. ng-packagr FAILS the build over an unlisted one unless it\'s explicitly allowed via "allowedNonPeerDependencies".',
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
 * Lesson: Angular libraries & schematics in depth.
 *
 * What actually gets built when you run `ng build` on a library (Angular
 * Package Format, partial compilation, the linker handshake that lets one
 * artifact serve several Angular majors); the two contracts you sign the
 * moment you publish (`public-api.ts` forever, `peerDependencies` borrowed
 * not owned); how to design a library's OWN public configuration surface
 * (`provideX()` + `makeEnvironmentProviders` + a tree-shakable `withXyz()`
 * feature union, replacing `forRoot()`); authoring schematics on the virtual
 * `Tree` — including the hard half most tutorials skip, editing a file that
 * already exists, with the recorder-offset trap that corrupts it if you get
 * it wrong; and wiring `ng add` / `ng update` so consumers install and
 * upgrade automatically, `NodePackageInstallTask` included.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, see
 * `expert/change-detection` for the reference shape). The analogy running
 * through the whole page is a flat-pack shelf: a published library ships
 * PARTS and an instructions card, not a glued, finished object, and every
 * hard rule on this page — partial compilation, peer dependencies,
 * `public-api.ts` — is that same idea from a different angle. The dependency
 * contract in particular gets taught three ways in three different sections:
 * a dialogue (package manager negotiating with a library's package.json), a
 * live picker demo (unchanged from the lesson's original interactive), and a
 * quiz — because it is the single most exam-tested idea in this material and
 * the one every learner half-remembers wrong.
 */
@Component({
  selector: 'app-lesson-libraries-schematics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './libraries-schematics.css',
  templateUrl: './libraries-schematics.html',
})
export class LibrariesSchematics {
  /**
   * The dependency-placement choices, for the live picker demo.
   */
  readonly depChoices = DEP_CHOICES;
  /**
   * The choice being examined, or `null` for none.
   */
  readonly activeDep = signal<DepChoice | null>(null);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** This is the only lesson in the Tooling category — a rail of one hides itself. */
  protected readonly stops: ChapterStop[] = [{ label: 'Libraries & Schematics' }];

  /**
   * The dependency contract, staged as the negotiation it actually is — npm
   * deciding what to install against what the library's own package.json
   * asks for. This is the same rule the picker demo and the quiz test later,
   * from a different angle: hearing it as a back-and-forth, rather than as a
   * rule stated once, is what makes "peer means borrowed, not owned" stick.
   */
  protected readonly depTalk: BubbleTurn[] = [
    {
      who: 'npm',
      says: 'Installing `my-lib@2.4.0`. Its package.json lists `@angular/core` — where do I get a copy?',
    },
    {
      who: "my-lib's package.json",
      says: "Don't fetch one. `@angular/core` is in **peerDependencies** — use whatever copy the app already has.",
    },
    {
      who: 'npm',
      says: 'The app has `21.0.3`. Your peer range says `>=19.0.0 <22.0.0` — that satisfies it. No install needed.',
    },
    {
      who: "my-lib's package.json",
      says: "Good. Now `tslib` — that one's a real **dependency**. Install it quietly; the app never needs to know it exists.",
    },
    {
      who: 'npm',
      says: "And `date-fns`? Also **dependencies** — something your code actually imports that the app doesn't already have.",
    },
    {
      who: "my-lib's package.json",
      says: "Exactly. Every regular dependency is weight and version-conflict surface I'm asking every consumer to carry. I keep that list short on purpose.",
    },
  ];

  /**
   * Sample: `ng generate library`, and what the Angular Package Format build
   * actually produces.
   */
  protected readonly createSample = `ng generate library ui-kit       # projects/ui-kit + ng-package.json
ng build ui-kit                  # → dist/ui-kit, in Angular Package Format

// projects/ui-kit/src/public-api.ts — the ENTIRE public surface
export * from './lib/button/button';
export * from './lib/card/card';
export { UiKitConfig } from './lib/config';   // deliberate, named — not export *

// dist/ui-kit — what ng-packagr actually wrote
//   fesm2022/ui-kit.mjs      one flat ES module, PARTIALLY compiled
//   index.d.ts               your public types, and only your public types
//   package.json             exports map + "sideEffects": false`;

  /** Line-by-line walkthrough of {@link createSample}. */
  protected readonly createNotes: CodeNote[] = [
    {
      line: 1,
      text: '`ng generate library` scaffolds `projects/ui-kit/` — its own `ng-package.json`, a `src/lib/` folder, and a starter `public-api.ts`. This is NOT `npm publish`; nothing leaves your machine yet.',
    },
    {
      line: 2,
      text: "`ng build ui-kit` runs `ng-packagr`, not the app's own builder. The library gets its own compiled output, separate from `dist/<app-name>`.",
    },
    {
      line: 5,
      text: '`export *` re-exports everything a file exports. Fine for a small internal module you fully control — risky as your whole public surface, because a new export inside `button.ts` silently becomes public API too.',
    },
    {
      line: 7,
      text: 'A deliberate named export. Anyone importing `ui-kit` sees exactly `Button`, `Card` and `UiKitConfig` — nothing else exists as far as the type checker is concerned, however many other files `lib/` actually has.',
    },
    {
      line: 10,
      text: "`fesm2022` = Flattened ES Module, ES2022 syntax. One file, no `import` statements between your OWN library's internal modules — a bundler resolves it once, not once per file.",
    },
    {
      line: 11,
      text: "Generated from your TypeScript, restricted to what `public-api.ts` exported. Consumers get autocomplete for `Button` and nothing for `button.ts`'s private helpers.",
    },
    {
      line: 12,
      text: "The `exports` field is what makes `import { Button } from 'ui-kit'` resolve at all in a modern bundler; `sideEffects: false` is your promise that an unused export is safe to delete entirely, not just ignore.",
    },
  ];

  /**
   * Sample: the two working setups for developing against a workspace
   * library, and why a fresh clone can look broken.
   */
  protected readonly tsconfigSample = `// generated by \`ng generate library ui-kit\`
{
  "compilerOptions": {
    "paths": {
      "ui-kit": ["dist/ui-kit"],
      "ui-kit/*": ["dist/ui-kit/*"]
    }
  }
}`;

  /**
   * Sample: secondary entry points, so consumers can import test helpers without
   * dragging them into the main bundle.
   */
  protected readonly entryPointsSample = `projects/ui-kit/
  src/public-api.ts            → import { Button } from 'ui-kit'
  testing/
    ng-package.json            → makes it an entry point
    src/public-api.ts          → import { FakeApi } from 'ui-kit/testing'`;

  /**
   * Sample: a library's own public configuration surface — the standalone-era
   * replacement for `forRoot()`. `MyLibFeature` is a discriminated union so a
   * future version could detect two conflicting features being combined; the
   * `withXyz()` functions are the same tree-shakable pattern `provideRouter`
   * and `provideHttpClient` use.
   */
  protected readonly provideMyLibSample = `export const MY_LIB_CONFIG = new InjectionToken<MyLibConfig>('MY_LIB_CONFIG', {
  factory: () => DEFAULT_CONFIG,
});

export interface MyLibFeature {
  kind: 'debug-logging' | 'custom-icons';
  providers: Provider[];
}

export function withDebugLogging(): MyLibFeature {
  return { kind: 'debug-logging', providers: [{ provide: DEBUG_LOGGING, useValue: true }] };
}

export function withCustomIcons(set: IconSet): MyLibFeature {
  return { kind: 'custom-icons', providers: [{ provide: ICON_SET, useValue: set }] };
}

export function provideMyLib(
  config: Partial<MyLibConfig>,
  ...features: MyLibFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: MY_LIB_CONFIG, useValue: { ...DEFAULT_CONFIG, ...config } },
    ...features.flatMap((f) => f.providers),
  ]);
}`;

  /** Line-by-line walkthrough of {@link provideMyLibSample}. */
  protected readonly provideMyLibNotes: CodeNote[] = [
    {
      line: 1,
      text: '`InjectionToken<MyLibConfig>` — a typed DI key for plain data that has no class to `useClass`. The string is only a debug label; DI never looks a token up by name.',
    },
    {
      line: 2,
      text: '`factory` supplies a default the FIRST time anything injects this token with nothing else provided — so a consumer who never calls `provideMyLib()` at all still gets a working config, not `undefined`.',
    },
    {
      line: 6,
      text: "A **discriminated-union tag**. `kind` is what a later version could switch on to catch two conflicting `withCustomIcons()` calls — the string literal, not the object's shape, is what makes TypeScript able to narrow between features.",
    },
    {
      line: 7,
      text: "Every feature is really just a bag of `Provider`s waiting to be flattened. Nothing here is library-specific machinery — it's the same shape Angular's own `withInterceptors()` uses.",
    },
    {
      line: 11,
      text: "The feature function's whole job: build providers, tag them, return. It does **not** call `inject()` itself — that happens later, when `provideMyLib` flattens everything into `makeEnvironmentProviders`.",
    },
    {
      line: 20,
      text: '`...features: MyLibFeature[]` is why usage reads as `provideMyLib(config, withDebugLogging(), withCustomIcons(set))` — a variadic, tree-shakable menu instead of one config object with a boolean for every capability nobody asked for.',
    },
    {
      line: 21,
      text: 'Returning `EnvironmentProviders`, not `Provider[]`, is deliberate: it is an **opaque** wrapper a consumer cannot destructure or reorder. They can only spread it into `providers: [...]` — your internal provider list stays yours to change without that being a breaking change.',
    },
    {
      line: 22,
      text: "`makeEnvironmentProviders` is what actually produces that opaque wrapper. Everything inside its array is an ordinary `Provider`; the function's whole value is bundling them behind a type nobody can pick apart.",
    },
    {
      line: 24,
      text: "Every feature's providers land in the same array as `provideMyLib`'s own config provider. Order matters for `useFactory` dependencies — which is exactly why the base config provider is listed first, ahead of any feature.",
    },
  ];

  /**
   * Sample: the `forRoot()` NgModule pattern `provideMyLib()` replaces — kept
   * short on purpose, for the side-by-side comparison.
   */
  protected readonly forRootSample = `@NgModule({})
export class MyLibModule {
  static forRoot(config: MyLibConfig): ModuleWithProviders<MyLibModule> {
    return { ngModule: MyLibModule, providers: [{ provide: MY_LIB_CONFIG, useValue: config }] };
  }
}

// consumer — must remember to call forRoot(), and only ONCE
imports: [MyLibModule.forRoot({ theme: 'dark' })]`;

  /** Sample: the standalone-era call site, for the same comparison. */
  protected readonly provideCallSample = `// consumer — a plain function call, tree-shakable per feature
providers: [
  provideMyLib({ theme: 'dark' }, withDebugLogging()),
]`;

  /**
   * Sample: `collection.json` and a schematic factory — a `Tree` in, a `Tree` out.
   */
  protected readonly schematicSample = `// collection.json — the schematic registry
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

  /** Line-by-line walkthrough of {@link schematicSample}. */
  protected readonly schematicNotes: CodeNote[] = [
    {
      line: 3,
      text: '`factory` points at an exported function — `./widget/index#widget` means "the `widget` export of `widget/index.ts`". That function IS the schematic; everything else here is metadata about it.',
    },
    {
      line: 4,
      text: '`schema` is a JSON Schema file describing the options `widget` accepts — types, defaults, prompts. There is a worked one later on this page.',
    },
    {
      line: 8,
      text: '`Rule` is a function from a `Tree` (plus options) to a new `Tree` — or a `Promise`/`Observable` of one. `widget(options)` does not run anything yet; it returns that function.',
    },
    {
      line: 9,
      text: 'The actual rule. `tree` is the virtual filesystem; `context` carries logging and — as the ng-add section shows — the ability to queue tasks that run after the Tree commits.',
    },
    {
      line: 10,
      text: "`url('./files')` points at a template folder; `apply` returns a `Source` — a lazy description of files to generate, not files on disk.",
    },
    {
      line: 11,
      text: "`template()` fills `__name__` and other placeholders using `options` plus TypeScript's own `strings` helpers (`classify`, `dasherize`, …).",
    },
    {
      line: 12,
      text: '`move()` relocates the generated files into `options.path` — still entirely inside the Tree, still in memory.',
    },
    {
      line: 14,
      text: '`mergeWith(source)` merges the generated `Source` into the working tree. Wrapping it in `chain([...])` is what makes several such steps commit as ONE atomic unit — a later step throwing rolls back none of it, because none of it has landed yet.',
    },
    {
      line: 18,
      text: '`--dry-run` runs every rule and prints what WOULD change without writing anything. Previewing costs nothing extra, because the Tree is entirely in-memory until the very last step.',
    },
  ];

  /**
   * Sample: `SchematicTestRunner`, which runs a schematic against an in-memory
   * tree so it can be tested without touching disk.
   */
  protected readonly testSample = `// in-memory schematic test — no disk, no publishing
const runner = new SchematicTestRunner('ui-kit', collectionPath);
const tree = await runner.runSchematic('widget', { name: 'save' }, Tree.empty());

expect(tree.files).toContain('/save/save.ts');
expect(tree.readContent('/save/save.ts')).toContain('class Save');`;

  /** Line-by-line walkthrough of {@link testSample}. */
  protected readonly testNotes: CodeNote[] = [
    {
      line: 2,
      text: '`SchematicTestRunner` loads a collection by path — the same `collection.json` `ng generate` reads — without going through the CLI or npm at all.',
    },
    {
      line: 3,
      text: "`runSchematic` runs the rule against `Tree.empty()`: no scaffolded workspace, no disk I/O, just the rule's own logic against a blank virtual filesystem. The `await` matters — a `Rule` returning an `Observable` or `Promise` needs it.",
    },
    {
      line: 5,
      text: '`tree.files` lists every path in the (still virtual) result — catches "generated the file in the wrong folder" without ever running `ls`.',
    },
    {
      line: 6,
      text: '`readContent` reads a virtual file back out as a string, so the test asserts on generated code exactly the way any other unit test asserts on a return value.',
    },
  ];

  /**
   * Sample: the hard half of schematics — editing a file that already
   * exists, with `ts.createSourceFile` and a `Tree` recorder.
   */
  protected readonly fileEditSample = `import * as ts from 'typescript';
import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';

export function renameConfigToken(): Rule {
  return (tree: Tree) => {
    const path = '/src/app/app.config.ts';
    const original = tree.read(path);
    if (!original) {
      throw new SchematicsException(\`\${path} not found — nothing to migrate.\`);
    }

    const text = original.toString('utf-8');
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const target = findIdentifier(source, 'MY_LIB_CONFIG_TOKEN');
    if (!target) return tree;                     // already migrated — leave it alone

    const recorder = tree.beginUpdate(path);
    recorder.remove(target.getStart(), target.getWidth());
    recorder.insertLeft(target.getStart(), 'MY_LIB_CONFIG');
    tree.commitUpdate(recorder);

    return tree;
  };
}`;

  /** Line-by-line walkthrough of {@link fileEditSample}. */
  protected readonly fileEditNotes: CodeNote[] = [
    {
      line: 7,
      text: "`tree.read(path)` returns a `Buffer | null` — `null` when the file doesn't exist in this Tree at all. It reads the CURRENT content, including any edits an earlier rule in the same chain already committed.",
    },
    {
      line: 9,
      text: "`SchematicsException` is how a rule aborts. Thrown anywhere in the chain, the whole migration fails and nothing gets written — not even an earlier rule's edits. The Tree is all-or-nothing at the whole-chain level, not just within one rule.",
    },
    {
      line: 13,
      text: '`ts.createSourceFile` parses the text into a real TypeScript AST, entirely in memory — the same parser the compiler itself uses. `findIdentifier` (not shown) is your own walk over that tree, looking for a matching `ts.Identifier` node.',
    },
    {
      line: 14,
      text: 'Nodes carry their own source **offsets**, computed against the exact `text` string handed to `createSourceFile` on line 13 — not against the file on disk, and not against any edit made after this point.',
    },
    {
      line: 17,
      text: "`beginUpdate` opens an `UpdateRecorder` for this path. Everything queued on it is computed against the file's content AT THIS EXACT MOMENT — which is why opening a second recorder on the same path before this one commits is dangerous. See the napkin below.",
    },
    {
      line: 18,
      text: "`remove(start, width)` deletes `target`'s exact character range — the offsets `ts` calculated back on line 13's parse, still valid because nothing has touched this file since.",
    },
    {
      line: 19,
      text: '`insertLeft` inserts new text at that same position, replacing what `remove` just deleted. (`insertLeft` vs `insertRight` only matters when a SECOND edit lands at that exact same offset — irrelevant here, with one edit.)',
    },
    {
      line: 20,
      text: "`commitUpdate` writes the recorder's queued edits into the Tree — still not to disk. Nothing after this point can safely reuse `target`'s offsets; a later rule editing this file needs a fresh parse.",
    },
  ];

  /**
   * Sample: a worked `schema.json` — the options contract a schematic's
   * factory is validated against before it ever runs.
   */
  protected readonly schemaSample = `{
  "$schema": "http://json-schema.org/draft-07/schema",
  "$id": "UiKitWidget",
  "title": "Ui Kit Widget",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The widget's name.",
      "$default": { "$source": "argv", "index": 0 },
      "x-prompt": "What should the widget be called?"
    },
    "project": {
      "type": "string",
      "description": "The workspace project to generate into.",
      "$default": { "$source": "projectName" }
    },
    "style": {
      "type": "string",
      "enum": ["css", "scss"],
      "default": "css"
    }
  },
  "required": ["name"]
}`;

  /** Line-by-line walkthrough of {@link schemaSample}. */
  protected readonly schemaNotes: CodeNote[] = [
    {
      line: 10,
      text: '`$default` fills this option when the CLI is called positionally — `ng generate ui-kit:widget save-button` supplies `"save-button"` here with no `--name=` needed. `$source: "argv"` + `index: 0` means "the first bare argument".',
    },
    {
      line: 11,
      text: '`x-prompt` turns a MISSING value into an interactive question instead of an error. Run the schematic with no `name` and the CLI asks; scripted or CI runs that always pass `--name` never see it.',
    },
    {
      line: 16,
      text: '`$source: "projectName"` resolves to the workspace\'s active project automatically — the same mechanism `ng generate component` uses so you rarely type `--project` in a single-project workspace.',
    },
    {
      line: 21,
      text: '`enum` + `default` is a validated, self-documenting choice: the CLI rejects anything outside `["css", "scss"]` before the rule ever runs — `--style=less` fails fast with a clear message instead of your code silently mishandling an unexpected string.',
    },
    {
      line: 24,
      text: '`required` is schema-level validation, enforced before `widget()` is ever called — a missing required option never reaches your rule as `undefined`.',
    },
  ];

  /** The `ng add` sequence, as a diagram rather than only as code. */
  protected readonly ngAddFlow: FlowStep[] = [
    {
      label: 'npm install my-lib',
      detail: 'Package lands in node_modules — its schematics/ folder included',
    },
    {
      label: 'ng-add rule runs',
      detail: 'The CLI reads package.json → schematics and invokes it',
      tone: 'accent',
    },
    { label: 'Providers wired', detail: '`addRootProvider` patches app.config.ts for you' },
    {
      label: 'Styles registered',
      detail: "angular.json's styles array gets the library's stylesheet",
    },
    {
      label: 'context.addTask runs',
      detail: 'NodePackageInstallTask installs anything the rule just added to package.json',
      tone: 'good',
    },
  ];

  /**
   * Sample: `ng-add`, the hook that runs when someone installs the library —
   * now with the install task most examples leave out.
   */
  protected readonly ngAddSample = `// package.json
{ "schematics": "./schematics/collection.json",
  "ng-add": { "save": "dependencies" } }        // or false: tooling-only, don't save

// schematics/ng-add/index.ts
export function ngAdd(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());   // runs AFTER the Tree below commits
    return chain([
      addRootProvider('my-lib', ({ code, external }) =>
        code\`\${external('provideMyLib', 'my-lib')}()\`),   // wires app.config.ts
      (t) => addStyleToAngularJson(t, 'node_modules/my-lib/styles.css'),
    ]);
  };
}`;

  /** Line-by-line walkthrough of {@link ngAddSample}. */
  protected readonly ngAddNotes: CodeNote[] = [
    {
      line: 3,
      text: '`"save": "dependencies"` tells `ng add` which field to record the install under in the CONSUMER\'s package.json — almost always `dependencies`. `false` means "install and run the schematic, but add no entry at all" — for pure dev tooling.',
    },
    {
      line: 8,
      text: "`addTask` QUEUES a task; it does not run one. `NodePackageInstallTask` runs `npm install` (or the workspace's package manager) once every rule in this chain has finished — needed if a rule elsewhere just added a dependency to package.json and the app needs it on disk before it can build.",
    },
    {
      line: 10,
      text: "`addRootProvider`, from `@schematics/angular/utility`, is a ready-made rule that edits `app.config.ts`'s `providers` array for you — the AST surgery from the previous section, already written and tested. Reach for this before hand-rolling `ts.createSourceFile` yourself.",
    },
    {
      line: 11,
      text: "The `code` tagged template plus `external()` generate a real import statement and a real call expression — `import { provideMyLib } from 'my-lib'; providers: [provideMyLib()]` — as correctly-formatted TypeScript, not string concatenation.",
    },
  ];

  /**
   * Sample: `ng-update` migrations — the mechanism that lets a library ship a
   * breaking change with a codemod that fixes it.
   */
  protected readonly ngUpdateSample = `// package.json
{ "ng-update": { "migrations": "./schematics/migrations.json" } }

// migrations.json — keyed by the version that introduced the break
{ "schematics": {
    "rename-config-token": {
      "version": "3.0.0",
      "factory": "./migrations/v3/rename-token",
      "description": "MY_LIB_CONFIG → provideMyLib()" },
    "signal-inputs": {
      "version": "4.0.0",
      "factory": "./migrations/v4/signal-inputs" } } }`;

  /** Line-by-line walkthrough of {@link ngUpdateSample}. */
  protected readonly ngUpdateNotes: CodeNote[] = [
    {
      line: 2,
      text: '`ng-update.migrations` points at a SEPARATE collection from your regular schematics — one the CLI runs automatically, unasked, whenever `ng update my-lib` crosses one of its tagged versions.',
    },
    {
      line: 7,
      text: "`version` is the tag `ng update` compares against the consumer's INSTALLED version, not their target. Installed `2.1.0`, target `4.x` → `3.0.0` is greater than installed, so this one runs.",
    },
    {
      line: 9,
      text: '`description` is the one line `ng update` prints as this migration runs — worth writing like a changelog entry, because for most consumers it is the only thing they will ever read about the change.',
    },
  ];

  /**
   * Sample: a minimal custom builder — the "runs every build" counterpart to
   * a schematic's "runs once".
   */
  protected readonly builderSample = `// builders/copy-icons/index.ts
export default createBuilder<CopyIconsOptions>((options, context) => {
  context.logger.info(\`Copying icons into \${options.outputPath}\`);
  copySync(options.iconsPath, options.outputPath);
  return { success: true };
});

// builders.json
{ "builders": { "copy-icons": { "implementation": "./copy-icons", "schema": "./schema.json" } } }

// angular.json — swap it into the architect section
"icons": { "builder": "my-lib:copy-icons", "options": { "iconsPath": "src/icons" } }`;

  /** Sample: shipping assets and a theming partial alongside compiled component styles. */
  protected readonly packagingSample = `// ng-package.json
{
  "lib": { "entryFile": "src/public-api.ts" },
  "assets": ["src/lib/theming/_index.scss"],
  "stylePreprocessorOptions": { "includePaths": ["src/lib/theming"] }
}`;

  /**
   * The dependency-contract self-test. Distractors are the two ways
   * "@angular/core in dependencies" is misdiagnosed — as harmless (npm
   * dedupes) or as a build-time failure (ng-packagr or tsc would catch it).
   * Neither is true, which is exactly why the bug is dangerous.
   */
  protected readonly depQuizOptions: QuizOption[] = [
    {
      text: 'Nothing — npm always deduplicates identical package versions automatically.',
      why: 'It often does, in the simple case — which is exactly what makes this dangerous. The moment version ranges diverge even slightly, or the install sits inside a stricter resolution mode, npm installs a SECOND copy instead of collapsing to one, with no warning at install time.',
    },
    {
      text: 'The consumer can end up with two Angular copies — two DI containers, `instanceof` checks failing, a doubled bundle.',
      correct: true,
      why: "Exactly the disaster peerDependencies exists to prevent. `dependencies` says 'install a copy for me'; the consumer's app already has its own Angular, and two live copies of a framework holding injector state break in ways that look nothing like the actual cause.",
    },
    {
      text: 'TypeScript throws a compile error in the consuming app.',
      why: 'Nothing about this is a type error — both copies of Angular type-check fine on their own. That is what makes it dangerous: the failure shows up later, at runtime or in bundle size, not at a red squiggle anyone could point at.',
    },
    {
      text: '`ng-packagr` refuses to build the library.',
      why: "`ng-packagr` builds your library in isolation — it has no idea what a future consumer's `node_modules` will look like, so it cannot catch this. The problem is entirely downstream, in someone else's install.",
    },
  ];

  /**
   * The workspace-library self-test — the tsconfig-paths trap from the
   * section above, phrased as a "why doesn't this work" bug report.
   */
  protected readonly workspaceQuizOptions: QuizOption[] = [
    {
      text: 'OnPush is blocking the re-render.',
      why: "This isn't a change-detection problem at all — the compiled JavaScript on disk hasn't moved, so there is nothing new for ANY change-detection strategy to even notice.",
    },
    {
      text: "The app's `tsconfig.json` paths still point at `dist/ui-kit`, which you haven't rebuilt.",
      correct: true,
      why: "Exactly — a generated workspace library's `paths` entry maps the import specifier straight at its BUILT output, not its source. Editing `button.ts` changes nothing the app can see until `ng build ui-kit` (or `--watch`) regenerates `dist/ui-kit`.",
    },
    {
      text: 'A hard refresh, clearing the browser cache, will pick up the change.',
      why: 'A hard refresh just re-fetches the same stale `dist/ui-kit` output, faster. The bytes on disk have not changed, so neither does anything the browser downloads.',
    },
    {
      text: 'Workspace libraries need `ng generate library` run again after every edit.',
      why: "That regenerates a library's SCAFFOLDING — a fresh `ng-package.json` and starter files — it doesn't rebuild the one you already wrote, and running it again risks overwriting the very file you just edited.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I need ng-packagr if this library never gets published — just shared inside one workspace?',
      a: "Yes. `ng build` on any Angular library project runs ng-packagr regardless of whether you ever `npm publish` — it's what produces the Angular Package Format output your OWN app consumes from `dist/`, secondary entry points included. Skipping publish only means you never run that one extra command.",
    },
    {
      q: 'Why bother with SchematicTestRunner when I can just run ng generate and look at the files?',
      a: 'Because that means npm-linking your schematic and running it against a real scaffolded workspace just to check one rule — slow, and it leaves a folder to clean up. `SchematicTestRunner` runs the same rule against an in-memory `Tree` with no disk I/O at all, fast enough to run on every commit like any other unit test.',
    },
    {
      q: 'What actually stops a broken rule from writing garbage straight to disk?',
      a: "Throwing `SchematicsException` anywhere in the rule chain — it aborts everything, and because the Tree only commits once every rule has succeeded, nothing partial gets written. That's the real safety net; the architecture makes a half-finished write impossible, the CLI isn't being especially careful.",
    },
    {
      q: 'If my-lib/testing is a separate import path, is it a separate npm package?',
      a: "No — one package, published once. ng-packagr just emits a second ES module root plus an extra entry in package.json's `exports` map, so `import { FakeApi } from 'my-lib/testing'` resolves to its own bundle without publishing anything beyond `my-lib` itself.",
    },
    {
      q: 'My library needs to generate some icons before it compiles. Schematic or builder?',
      a: 'Neither, usually — a plain prebuild step in your own tooling handles a one-off generation step fine. Reach for a full custom builder only when the step must re-run on every build the way compilation itself does; reach for a schematic only for something that runs once, at generate- or install-time, and leaves ordinary files behind.',
    },
  ];
}
