import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Modules — what "every file is a module" really changes (scope!),
 * named/default/namespace/side-effect imports each dissected, live imports
 * lab, module resolution, barrels + circular-import mechanics, type-only
 * imports and why isolatedModules cares, dynamic import() as the engine of
 * lazy loading, and the singleton nature of module state.
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
      'No braces = the default export. YOU choose the local name, which is exactly its weakness: three files can call it Logger, Log and L, and rename-refactoring can\'t connect them. Hence the Angular-world preference for named exports.',
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

@Component({
  selector: 'app-lesson-ts-modules',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Modules, Imports &amp; Exports</h1>
      <p class="lead">
        Every <code>.ts</code> file with at least one <code>import</code> or
        <code>export</code> is an <strong>ES module</strong> — and that changes the
        fundamental rules of the file: everything inside is <em>private by
        default</em>, visible elsewhere only if exported. Imports/exports are also
        the raw material of Angular's build optimizations: tree-shaking and lazy
        loading both work by analyzing this graph. (Heads-up: ES modules ≠ Angular's
        legacy <code>NgModule</code> — unrelated concepts sharing a word.)
      </p>

      <h2>What "module" changes: scope</h2>
      <div class="code"><pre>// before modules, in plain &lt;script&gt; files:
var config = {{ '{' }} … {{ '}' }};      // GLOBAL — visible to (and clobberable by) every script

// in a module file:
const config = {{ '{' }} … {{ '}' }};    // private to THIS FILE unless exported
export const VERSION = '1.0';   // the export keyword is the only door out</pre></div>
      <p>
        This is the payoff of the scope story from the Functions lesson, at file
        scale: a 500-file app where no file can accidentally trample another's
        variables. The module's <em>public API</em> is exactly its export list —
        everything else is implementation detail you can refactor freely.
      </p>

      <h2>Exports — the vocabulary</h2>
      <div class="code"><pre>// user.ts
export interface User {{ '{' }} id: number; {{ '}' }}          // export inline, at declaration…
export function makeUser(): User {{ '{' }} return {{ '{' }} id: 1 {{ '}' }}; {{ '}' }}
export const VERSION = '1.0';

const helper = () => {{ '{' }} … {{ '}' }};                    // private — no export
export {{ '{' }} helper as publicHelper {{ '}' }};             // …or export a list at the bottom, renamed

export default class Logger {{ '{' }} {{ '}' }}                // ONE default per module, no name needed</pre></div>

      <h2>Imports — try each kind</h2>
      <div class="demo">
        <p class="demo__title">Live — six import forms and what each really does</p>
        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          @for (k of kinds; track k.label) {
            <button [class.ghost]="kind() !== k" (click)="kind.set(k)">{{ k.label }}</button>
          }
        </div>
        <div class="code"><pre>{{ kind().code }}</pre></div>
        <p style="font-size:.92rem">{{ kind().explain }}</p>
      </div>
      <div class="tip">
        House style for Angular codebases: <strong>named exports everywhere</strong>.
        They're refactor-safe, auto-importable, and grep-able. Default exports have
        one modern niche — Angular's lazy routes accept them without the
        <code>.then(m =&gt; m.X)</code> selector:
        <code>loadComponent: () =&gt; import('./admin-page')</code> just works when
        the file default-exports the component.
      </div>

      <h2>Where does <code>'./user'</code> actually point? Resolution in 20 seconds</h2>
      <div class="code"><pre>import {{ '{' }} User {{ '}' }} from './user';        // relative → a FILE next to this one
import {{ '{' }} inject {{ '}' }} from '&#64;angular/core'; // bare → node_modules/&#64;angular/core
import {{ '{' }} CartService {{ '}' }} from '&#64;app/core/cart';  // aliased → tsconfig "paths"

// tsconfig.json:
// "paths": {{ '{' }} "&#64;app/*": ["src/app/*"] {{ '}' }}   ← kills ../../../../ imports</pre></div>
      <p>
        Three shapes, three meanings: <code>./</code> or <code>../</code> = relative
        to the importing file; a bare name = a package in
        <code>node_modules</code>; an alias = whatever <code>paths</code> maps it to.
        When an editor says "cannot find module", check which of the three you've
        accidentally written.
      </p>

      <h2>Re-exports &amp; barrels — and their sharp edge</h2>
      <div class="code"><pre>// core/index.ts — a "barrel": one file re-exporting a folder's public API
export * from './user';
export {{ '{' }} Logger {{ '}' }} from './logger';
export {{ '{' }} Logger as AppLogger {{ '}' }} from './logger';   // re-export with a rename

// consumers get one tidy import:
import {{ '{' }} User, Logger {{ '}' }} from './core';</pre></div>
      <div class="warn">
        <strong>How barrels go wrong — the actual mechanism.</strong> Modules load
        once, in dependency order. If <code>a.ts</code> imports the barrel, and the
        barrel lists <code>b.ts</code>, and <code>b.ts</code> imports something from
        the barrel again, you have a <strong>cycle</strong>: one of the files
        executes while the other is only partially initialized, and you get the
        infamous <em>"Cannot access 'X' before initialization"</em> at runtime —
        often only in production builds where module order differs. Rules of thumb:
        a folder's own files never import their own barrel; hot paths import
        specific files; and keep barrels for genuinely public package surfaces.
      </div>

      <h2>Type-only imports — erased by design</h2>
      <div class="code"><pre>import type {{ '{' }} User {{ '}' }} from './user';        // whole import erased from the JS output
import {{ '{' }} type User, makeUser {{ '}' }} from './user';  // mixed: type part erased, function kept</pre></div>
      <p>
        Why a keyword for this? Because this project (like most modern ones) compiles
        with <code>isolatedModules</code>, where each file is transpiled
        <em>alone</em> — the compiler can't peek into <code>./user</code> to figure
        out whether <code>User</code> is a type (erase it) or a value (keep it). The
        <code>type</code> keyword tells it locally. Bonus: erased imports create no
        runtime dependency edge, which can dissolve circular-import crashes when the
        cycle was only ever about types.
      </p>

      <h2>Dynamic <code>import()</code> — the engine of lazy loading</h2>
      <div class="code"><pre>// static import: top of file, ALWAYS in the initial bundle
import {{ '{' }} Chart {{ '}' }} from './charts';

// dynamic import(): an EXPRESSION returning a Promise — bundler splits the file
const {{ '{' }} Chart {{ '}' }} = await import('./charts');   // downloaded only when this line runs

// Angular's router uses exactly this — this app's routes do it for every lesson:
{{ '{' }} path: 'admin', loadComponent: () => import('./admin').then(m => m.Admin) {{ '}' }}</pre></div>
      <p>
        Line by line: the static form is declarative and hoisted — it <em>must</em>
        be resolvable at build time, and its code lands in the initial bundle. The
        dynamic form is just a function call returning a promise of the module's
        export object — the bundler sees it and <strong>splits</strong>
        <code>./charts</code> into its own chunk, fetched over the network the first
        time the call runs. Angular's <code>loadComponent</code>/
        <code>loadChildren</code> are thin wrappers over this — which is why every
        lesson in this app is a separate lazy chunk (you saw them scroll past in the
        build output).
      </p>

      <h2>Module state is a singleton</h2>
      <div class="code"><pre>// counter.ts
let count = 0;                        // module-level state
export const next = () => ++count;

// a.ts and b.ts both: import {{ '{' }} next {{ '}' }} from './counter';
next(); // a.ts → 1
next(); // b.ts → 2  ← SAME count. Modules execute once and are cached;
        //             every importer shares the one instance.</pre></div>
      <p>
        A module's top-level code runs exactly once, on first import; afterwards the
        loader hands out the cached instance. That makes module scope a natural
        singleton — worth knowing both as a tool and as a warning (shared mutable
        module state is invisible coupling; Angular's DI, which you'll meet soon,
        offers the same singleton-ness with far better testability and lifecycle
        control).
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>"export default" vs named export — give one concrete refactoring difference.</summary>
        <div>Rename a named export and tooling updates every import (they share the
        symbol). A default export has no canonical name — each importer chose its
        own, so a rename tool can't find them, and different names for the same
        thing accumulate across the codebase. That's the practical core of the
        named-exports-preferred rule.</div>
      </details>
      <details class="qa">
        <summary>Production build crashes with "Cannot access 'OrderService' before initialization"; dev was fine. Prime suspect?</summary>
        <div>A circular import — often via a barrel — where module A executes while
        B is partially initialized. Dev and prod bundlers can order cycles
        differently, which is why it "only breaks in prod". Trace the cycle (build
        tools and lint rules like import/no-cycle can print it), then break it by
        importing concrete files instead of the barrel, or making one edge
        <code>import type</code>.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>import './analytics';</code> with "nothing imported" still change app behaviour?</summary>
        <div>Side-effect import: the module's top-level code runs (registers a
        listener, patches a global, self-registers). And because modules are cached,
        it runs exactly once no matter how many files import it.</div>
      </details>
      <details class="qa">
        <summary>What must be true of the argument to <code>import()</code> for code-splitting to work well?</summary>
        <div>The bundler must be able to see the module statically — a literal path
        (or a clearly constrained template) at build time. A fully dynamic
        <code>import(someRuntimeString)</code> can't be pre-split into a chunk. This
        is why lazy routes always use literal-path arrow functions.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A module = file-private scope; the export list <em>is</em> the public API. Everything unexported is refactor-safe implementation detail.</li>
        <li>Import forms: named (preferred — tooling-friendly, tree-shakeable), default (lazy-route niche), namespace (<code>* as</code>), side-effect (runs code, imports nothing), <code>import type</code> (erased; required rigor under <code>isolatedModules</code>).</li>
        <li>Paths resolve three ways: relative (<code>./</code>), bare (node_modules), aliased (tsconfig <code>paths</code>).</li>
        <li>Barrels tidy imports but enable cycles — "cannot access X before initialization" means a circular import; never import your own barrel.</li>
        <li><code>import()</code> returns a promise and triggers code-splitting — it is literally how Angular lazy loading works. Module top-level code runs once; module state is a shared singleton.</li>
      </ul>

      <p><a routerLink="/ts-async">Next: Promises &amp; async/await →</a></p>
    </article>
  `,
  styles: [
    `.qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
     .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
     .qa div { padding: 10px 14px; font-size: .9rem; }`,
  ],
})
export class Modules {
  protected readonly kinds = IMPORT_KINDS;
  protected readonly kind = signal<ImportKind>(IMPORT_KINDS[0]);
}
