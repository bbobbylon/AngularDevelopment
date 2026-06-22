import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-libraries-schematics',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Tooling</span>
      <h1>Libraries &amp; Schematics</h1>
      <p class="lead">
        When code needs to be shared across apps, package it as an Angular
        <strong>library</strong> built with <code>ng-packagr</code>. Pair it with
        <strong>schematics</strong> — code generators and <code>ng add</code>/
        <code>ng update</code> automations — to give consumers a first-class install and
        upgrade experience.
      </p>

      <h2>Creating a library</h2>
      <div class="code">
        <pre>ng generate library ui-kit        // creates projects/ui-kit (built by ng-packagr)
ng build ui-kit                   // emits the Angular Package Format to dist/

// public-api.ts — the library's surface:
export * from './lib/button/button';
export * from './lib/card/card';</pre>
      </div>
      <p>
        Export only what consumers should use through <code>public-api.ts</code>. The
        build produces the Angular Package Format (APF) — partial-compiled, tree-shakable
        output that any Angular app can consume.
      </p>

      <h2>What are schematics?</h2>
      <p>
        A schematic is a transform that generates or updates files in a project — the
        same engine behind <code>ng generate component</code>. They operate on a virtual
        file <code>Tree</code> so changes are atomic and previewable.
      </p>
      <div class="code">
        <pre>export function addButton(options: Schema): Rule {{ '{' }}
  return (tree: Tree) =&gt; {{ '{' }}
    tree.create(\`/src/\${{ '{' }}options.name{{ '}' }}.ts\`, '// generated');
    return tree;
  {{ '}' }};
{{ '}' }}

ng generate ui-kit:button --name=save   // run your schematic</pre>
      </div>

      <h2>ng add &amp; ng update</h2>
      <ul>
        <li><strong>ng add</strong> — an install schematic: wires providers, imports and config when someone adds your library.</li>
        <li><strong>ng update</strong> — <em>migration</em> schematics automatically fix breaking changes across versions.</li>
        <li>Declared in <code>ng-package.json</code> / <code>package.json</code> via the <code>schematics</code> and <code>ng-update</code> fields.</li>
      </ul>

      <div class="tip">
        Migration schematics are why <code>ng update &#64;angular/core</code> can rewrite
        your code across major versions — the framework ships its own schematics. Build
        the same experience for your library to keep consumers effortlessly up to date.
      </div>
      <div class="note">
        Packaging details that matter: declare <code>&#64;angular/*</code> as
        <strong>peerDependencies</strong> (not <code>dependencies</code>) so the
        consumer's version wins and you avoid duplicate Angular copies; expose
        <strong>secondary entry points</strong> (e.g. <code>my-lib/testing</code>) for
        opt-in extras; and test schematics with <code>SchematicTestRunner</code> against a
        virtual <code>Tree</code> so generation logic is verified without touching disk.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>ng generate library</code> + <code>ng-packagr</code> produce shareable APF output.</li>
        <li><code>public-api.ts</code> defines the library's public surface.</li>
        <li>Schematics generate/update files via an atomic virtual <code>Tree</code>.</li>
        <li><code>ng add</code> installs and configures; <code>ng update</code> migrations automate upgrades.</li>
      </ul>

      <p><a routerLink="/">Back to all concepts →</a></p>
    </article>
  `,
})
export class LibrariesSchematics {}
