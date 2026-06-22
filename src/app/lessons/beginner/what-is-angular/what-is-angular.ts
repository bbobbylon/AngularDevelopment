import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-what-is-angular',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Getting Started</span>
      <h1>What is Angular?</h1>
      <p class="lead">
        Angular is a TypeScript framework for building scalable single-page web
        applications. Unlike a library, it is <em>batteries-included</em>: routing,
        forms, HTTP, testing and tooling are all official and integrated.
      </p>

      <h2>The building blocks</h2>
      <table class="t">
        <tr><td><strong>Component</strong></td><td>A reusable UI piece: template + class + styles. The core unit.</td></tr>
        <tr><td><strong>Template</strong></td><td>HTML enhanced with binding, control flow and pipes.</td></tr>
        <tr><td><strong>Directive</strong></td><td>Behavior attached to elements (attribute &amp; structural).</td></tr>
        <tr><td><strong>Pipe</strong></td><td>A pure transform for displaying values.</td></tr>
        <tr><td><strong>Service</strong></td><td>Reusable logic/state, supplied via Dependency Injection.</td></tr>
        <tr><td><strong>Router</strong></td><td>Maps URLs to components.</td></tr>
        <tr><td><strong>Signals</strong></td><td>The reactive primitive that drives change detection.</td></tr>
      </table>

      <h2>The modern, standalone-first model</h2>
      <p>
        Today's Angular is <strong>standalone by default</strong>: components declare
        their own dependencies and there is no required <code>NgModule</code>. The
        app boots from a single root component:
      </p>
      <div class="code">
        <pre>// main.ts
bootstrapApplication(App, {{ '{' }}
  providers: [provideRouter(routes), provideHttpClient()],
{{ '}' }});</pre>
      </div>

      <h2>What makes Angular distinctive</h2>
      <ul>
        <li><strong>TypeScript-first</strong> — even templates are type-checked.</li>
        <li><strong>Opinionated &amp; complete</strong> — one official way for routing, forms, HTTP.</li>
        <li><strong>Dependency Injection</strong> — a powerful, hierarchical DI system.</li>
        <li><strong>Signals</strong> — fine-grained reactivity, enabling zoneless apps.</li>
        <li><strong>Tooling</strong> — the CLI, Language Service, DevTools and schematics.</li>
        <li><strong>Rendering</strong> — client-side, SSR and hydration out of the box.</li>
      </ul>

      <h2>How a page renders (the big picture)</h2>
      <ol>
        <li><code>main.ts</code> bootstraps the root component with app-wide providers.</li>
        <li>The router matches the URL and loads the matching component.</li>
        <li>The component's template binds to its data (signals, inputs).</li>
        <li>When a signal changes, Angular updates exactly the affected DOM.</li>
      </ol>

      <h2>Release cadence & ecosystem</h2>
      <p>
        Angular ships a <strong>major version roughly every 6 months</strong>, each with
        ~18 months of support and automated <code>ng update</code> migrations, so
        upgrades are routine rather than rewrites. It's maintained by Google and used in
        many of its own products. Compared with React or Vue (UI libraries you assemble
        with third-party routing/state/HTTP), Angular bundles all of that officially —
        more to learn up front, less glue code and fewer decisions later.
      </p>

      <div class="tip">
        This very app is a standalone Angular 21 project. Browse the source —
        <code>src/app/</code> — to see every concept in this curriculum applied.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Angular is a complete, opinionated, TypeScript-based SPA framework.</li>
        <li>Components are the core unit; services + DI share logic; signals drive reactivity.</li>
        <li>Modern Angular is standalone-first — no NgModules required.</li>
      </ul>

      <p><a routerLink="/cli-project-structure">Next: CLI &amp; Project Structure →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 130px; }`,
  ],
})
export class WhatIsAngular {}
