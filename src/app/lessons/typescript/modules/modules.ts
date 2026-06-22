import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ts-modules',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Modules, Imports & Exports</h1>
      <p class="lead">
        Every <code>.ts</code> file is an ES module. <code>import</code> /
        <code>export</code> wire your code together and drive Angular's lazy loading
        and tree-shaking. (Note: ES modules ≠ Angular <code>NgModule</code>s.)
      </p>

      <h2>Named exports (the common case)</h2>
      <div class="code">
        <pre>// user.ts
export interface User {{ '{' }} id: number; {{ '}' }}
export function makeUser(): User {{ '{' }} return {{ '{' }} id: 1 {{ '}' }}; {{ '}' }}
export const VERSION = '1.0';

// elsewhere
import {{ '{' }} User, makeUser, VERSION {{ '}' }} from './user';
import {{ '{' }} makeUser as create {{ '}' }} from './user';   // rename on import</pre>
      </div>

      <h2>Default exports</h2>
      <div class="code">
        <pre>// logger.ts
export default class Logger {{ '{' }}{{ '}' }}

// import — you choose the name
import Logger from './logger';</pre>
      </div>
      <div class="tip">
        Prefer <strong>named exports</strong> in Angular code: they are
        refactor-friendly, auto-importable by tooling, and consistent. Angular's
        lazy routes even support default exports:
        <code>loadComponent: () =&gt; import('./x')</code> works with a default.
      </div>

      <h2>Namespace & side-effect imports</h2>
      <div class="code">
        <pre>import * as utils from './utils';   // namespace import — utils.formatDate(...)
import './polyfills';               // side-effect only — runs the module, imports nothing</pre>
      </div>

      <h2>Re-exports & barrels</h2>
      <div class="code">
        <pre>// index.ts — a "barrel" that re-exports a folder's public API
export * from './user';
export {{ '{' }} Logger {{ '}' }} from './logger';
export {{ '{' }} Logger as AppLogger {{ '}' }} from './logger';  // re-export with a rename

import {{ '{' }} User, Logger {{ '}' }} from './core';   // one tidy import</pre>
      </div>
      <div class="warn">
        Barrels are convenient but can create <strong>circular imports</strong> and
        defeat tree-shaking if they pull in a whole folder. Import from specific files in
        hot paths, and avoid a module importing its own barrel.
      </div>

      <h2>Type-only imports</h2>
      <p>Mark imports used only as types so they are fully erased from the build:</p>
      <div class="code">
        <pre>import type {{ '{' }} User {{ '}' }} from './user';
import {{ '{' }} type User, makeUser {{ '}' }} from './user';   // mixed</pre>
      </div>
      <p>
        This matters under <code>isolatedModules</code> (enabled in this project)
        and keeps the dependency graph clean.
      </p>

      <h2>Dynamic import() — the basis of lazy loading</h2>
      <div class="code">
        <pre>const {{ '{' }} heavy {{ '}' }} = await import('./heavy');   // returns a Promise, code-split

// Angular routes use exactly this:
{{ '{' }} path: 'admin', loadComponent: () =&gt; import('./admin').then(m =&gt; m.Admin) {{ '}' }}</pre>
      </div>

      <h2>Path mapping</h2>
      <div class="code">
        <pre>// tsconfig.json → "paths": {{ '{' }} "&#64;app/*": ["src/app/*"] {{ '}' }}
import {{ '{' }} CartService {{ '}' }} from '&#64;app/core/cart.service';   // no ../../../</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Each file is an ES module; <code>export</code>/<code>import</code> connect them.</li>
        <li>Prefer named exports; default exports are valid (and lazy routes support them).</li>
        <li>Barrels (<code>index.ts</code>) bundle a folder's public surface.</li>
        <li><code>import type</code> is erased at build time; <code>import()</code> powers lazy loading.</li>
      </ul>

      <p><a routerLink="/ts-async">Next: Promises &amp; async/await →</a></p>
    </article>
  `,
})
export class Modules {}
