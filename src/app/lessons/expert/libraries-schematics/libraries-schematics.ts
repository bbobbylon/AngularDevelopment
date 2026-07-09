import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Angular libraries & schematics in depth — the Angular Package
 * Format and partial compilation (what actually ships to npm), public-api
 * surface discipline, secondary entry points, the peerDependencies quiz
 * (interactive), authoring schematics on the virtual Tree, and wiring
 * ng add / ng update so consumers install and upgrade automatically.
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
    label: 'date-fns (used in your lib\'s code)',
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

@Component({
  selector: 'app-lesson-libraries-schematics',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
    .field-pill { display: inline-block; font-family: monospace; font-weight: 700; font-size: .86rem; padding: 4px 12px; border-radius: 8px; background: rgba(99,102,241,.12); color: var(--accent); margin: 8px 0 6px; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Tooling</span>
      <h1>Libraries &amp; Schematics</h1>
      <p class="lead">
        Sharing Angular code across applications means packaging it as a
        <strong>library</strong> in the Angular Package Format, and giving consumers a
        first-class experience with <strong>schematics</strong> — the code-generation
        engine behind <code>ng generate</code>, <code>ng add</code> and
        <code>ng update</code>. This page covers what actually ships to npm, the
        dependency rules that prevent duplicate-Angular disasters, and how to author
        the automations.
      </p>

      <h2>Do you even need a published library?</h2>
      <table class="cmp">
        <tr><th>Situation</th><th>Right tool</th></tr>
        <tr><td>Several apps in ONE repo share UI/logic</td><td>a workspace library (path-mapped, built together) — no npm publishing ceremony</td></tr>
        <tr><td>Separate repos / teams / release cadences consume it</td><td>a published APF library with semver, peer deps, and migration schematics</td></tr>
        <tr><td>Two components share a helper</td><td>a folder and an import — don't build infrastructure for a utils file</td></tr>
      </table>

      <h2>Creating a library — and what APF really is</h2>
      <div class="code"><pre>{{ createSample }}</pre></div>
      <p>
        The build output is the <strong>Angular Package Format</strong>: FESM bundles,
        type definitions, and — the expert detail — <strong>partially compiled</strong>
        templates. Libraries can't ship fully compiled code because Angular's generated
        instructions aren't guaranteed stable across versions. So <code>ng-packagr</code>
        compiles to a stable intermediate form
        (<code>compilationMode: "partial"</code>), and the <em>consumer's</em> build
        finishes the job with its own Angular version via the linker. That handshake is
        why one published library version works across a range of Angular majors.
      </p>
      <div class="warn">
        <code>public-api.ts</code> is your contract. Everything exported there is
        public API forever — renaming an exported symbol is a breaking change requiring
        a major version. Export deliberately, not <code>export *</code> from every file.
      </div>

      <h2>The dependency quiz — where does each package go?</h2>
      <div class="demo">
        <p class="demo__title">Interactive — pick a package your library uses</p>
        <div class="chips">
          @for (d of depChoices; track d.label) {
            <button [class.on]="activeDep() === d" (click)="activeDep.set(d)">{{ d.label }}</button>
          }
        </div>
        @if (activeDep(); as d) {
          <span class="field-pill">{{ d.field }}</span>
          <p style="font-size:.9rem; margin: 6px 0 0">{{ d.why }}</p>
        } @else {
          <p style="color:var(--text-muted);font-size:.88rem">Get one of these wrong and consumers get duplicate Angular copies, version conflicts, or phantom installs.</p>
        }
      </div>

      <h2>Secondary entry points</h2>
      <div class="code"><pre>{{ entryPointsSample }}</pre></div>
      <p>
        <code>my-lib/testing</code>, <code>my-lib/icons</code> — separate entry points
        keep optional heavyweight pieces out of the main bundle and let consumers
        deep-import cleanly. Angular Material is the reference example: every component
        is its own entry point, so importing a button never pays for the datepicker.
      </p>

      <h2>Schematics — code that writes code</h2>
      <p>
        A schematic is a function from options to a <code>Rule</code>: a transform over
        a virtual file <code>Tree</code>. Nothing touches disk until the whole rule
        chain succeeds — changes are atomic, previewable with <code>--dry-run</code>,
        and testable in memory:
      </p>
      <div class="code"><pre>{{ schematicSample }}</pre></div>
      <div class="code"><pre>{{ testSample }}</pre></div>

      <h2>ng add — the red-carpet install</h2>
      <div class="code"><pre>{{ ngAddSample }}</pre></div>
      <p>
        <code>ng add my-lib</code> installs the package, then runs its
        <code>ng-add</code> schematic — which is where you wire providers into
        <code>app.config.ts</code>, add styles to <code>angular.json</code>, or create
        starter config. The difference between "works after one command" and a
        five-step README is this schematic.
      </p>

      <h2>ng update — migrations that fix breaking changes</h2>
      <div class="code"><pre>{{ ngUpdateSample }}</pre></div>
      <p>
        Migration schematics are keyed by version: updating from 2.x to 4.x runs every
        migration in between, in order. This is exactly how
        <code>ng update &#64;angular/core</code> rewrites your code across majors — the
        framework ships its own migrations. Offering the same for your library is what
        keeps consumers upgrading instead of pinning old versions forever.
      </p>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>Angular as a regular dependency</strong> — the classic disaster:
          consumers get two Angular copies, DI breaks in baffling ways. Framework and
          framework-adjacent packages are peers, always.</li>
        <li><strong>Untested against the supported range</strong> — peer range says
          <code>&gt;=19 &lt;22</code>? CI should build a consumer on each major.</li>
        <li><strong>Leaking internals</strong> — a "temporary" export from public-api
          becomes load-bearing in someone's app; deprecate before removing, with a
          migration schematic where feasible.</li>
        <li><strong>Testing schematics by publishing</strong> — <code>SchematicTestRunner</code>
          runs them in memory; <code>npm pack</code> + a local install covers the
          integration path. Publishing to test is how broken versions escape.</li>
        <li><strong>Forgetting <code>sideEffects: false</code></strong> — without it,
          bundlers can't tree-shake unused parts of your library aggressively.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why do libraries ship partially compiled code instead of fully compiled?</summary>
        <div>Angular's generated instruction code isn't stable API across versions.
        Partial compilation emits a stable declaration format; the consumer's own
        compiler/linker finishes compilation — so one published artifact supports a
        range of Angular versions.</div>
      </details>
      <details class="qa">
        <summary>What breaks if &#64;angular/core is in dependencies instead of peerDependencies?</summary>
        <div>Package managers may install a second Angular copy for the library.
        Two copies means two DI systems and two sets of framework internals: injection
        fails oddly, <code>instanceof</code> checks break, bundles double. Peer
        declares "use the host app's copy".</div>
      </details>
      <details class="qa">
        <summary>What is the Tree in a schematic, and why does it matter?</summary>
        <div>A virtual, in-memory staging of the filesystem. Rules read and mutate the
        Tree; the engine commits to disk only when every rule succeeds — atomic
        all-or-nothing generation, plus <code>--dry-run</code> previews and unit tests
        without touching disk.</div>
      </details>
      <details class="qa">
        <summary>How does <code>ng update</code> know which migrations to run?</summary>
        <div>The package's <code>ng-update.migrations</code> collection lists schematics
        tagged with target versions; the CLI runs every migration between the installed
        and target version, in version order.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>APF + partial compilation is why one library artifact serves multiple Angular versions.</li>
        <li><code>public-api.ts</code> is a forever-contract; secondary entry points keep optional weight out of the main bundle.</li>
        <li>Framework packages are peerDependencies — everything else you add is conflict surface.</li>
        <li>Schematics transform an atomic virtual Tree; test with <code>SchematicTestRunner</code>.</li>
        <li><code>ng add</code> = install experience; <code>ng update</code> migrations = upgrade loyalty.</li>
      </ul>

      <p><a routerLink="/task-manager">Next: Project — Task Manager →</a></p>
    </article>
  `,
})
export class LibrariesSchematics {
  readonly depChoices = DEP_CHOICES;
  readonly activeDep = signal<DepChoice | null>(null);

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

  readonly entryPointsSample = `projects/ui-kit/
  src/public-api.ts            → import { Button } from 'ui-kit'
  testing/
    ng-package.json            → makes it an entry point
    src/public-api.ts          → import { FakeApi } from 'ui-kit/testing'`;

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

  readonly testSample = `// in-memory schematic test — no disk, no publishing
const runner = new SchematicTestRunner('ui-kit', collectionPath);
const tree = await runner.runSchematic('widget', { name: 'save' }, Tree.empty());

expect(tree.files).toContain('/save/save.ts');
expect(tree.readContent('/save/save.ts')).toContain('class Save');`;

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
