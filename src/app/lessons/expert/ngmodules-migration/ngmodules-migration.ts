import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ngmodules-migration',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>NgModules &amp; Standalone Migration</h1>
      <p class="lead">
        For years every Angular building block lived inside an <code>NgModule</code> that
        declared components and wired up dependencies. Standalone components removed that
        ceremony — they declare their own dependencies via <code>imports</code> — and are
        now the default. Understanding both helps you read older code and migrate it.
      </p>

      <h2>The NgModule world</h2>
      <div class="code">
        <pre>&#64;NgModule({{ '{' }}
  declarations: [AppComponent, UserCardComponent],   // components/directives/pipes
  imports: [CommonModule, FormsModule, RouterModule], // other modules
  providers: [UserService],
  bootstrap: [AppComponent],
{{ '}' }})
export class AppModule {{ '{' }}{{ '}' }}</pre>
      </div>
      <p>Every component had to be <em>declared</em> in exactly one module, which also had to import whatever that component used.</p>

      <h2>The standalone world</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  selector: 'app-user-card',
  imports: [CommonModule, RouterLink],   // deps live ON the component
  template: \`…\`,
{{ '}' }})
export class UserCard {{ '{' }}{{ '}' }}   // no NgModule needed

// bootstrap:
bootstrapApplication(App, {{ '{' }} providers: [provideRouter(routes)] {{ '}' }});</pre>
      </div>

      <h2>Automated migration</h2>
      <div class="code">
        <pre>ng generate &#64;angular/core:standalone   // run repeatedly, choosing each step:
//   1) convert declarations to standalone
//   2) remove unnecessary NgModules
//   3) switch to bootstrapApplication</pre>
      </div>
      <p>Providers move from module <code>providers</code> to <code>app.config.ts</code> as <code>provide*</code> functions (e.g. <code>provideHttpClient()</code>, <code>provideRouter()</code>).</p>

      <div class="tip">
        You can mix the two: standalone components can be imported into NgModules, and
        NgModules can be imported into a standalone component's <code>imports</code>.
        Migrate incrementally — there is no big-bang rewrite required.
      </div>
      <div class="note">
        When a library only ships an <code>NgModule</code> of <em>providers</em>, bridge
        it with <code>importProvidersFrom(ThatModule)</code> in your
        <code>app.config.ts</code>. Lazy routes use a <code>Routes</code> array via
        <code>loadChildren</code> instead of a routing module. The end state — no
        <code>declarations</code>, providers as <code>provide*</code> functions,
        <code>bootstrapApplication</code> — is smaller, more tree-shakable, and easier for
        tooling to follow.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>NgModules grouped declarations, imports and providers; standalone moves deps onto the component.</li>
        <li>Standalone components are the default and use their own <code>imports</code> array.</li>
        <li><code>bootstrapApplication</code> + <code>app.config.ts</code> replace the root <code>AppModule</code>.</li>
        <li>The <code>&#64;angular/core:standalone</code> schematic migrates code automatically and incrementally.</li>
      </ul>

      <p><a routerLink="/libraries-schematics">Next: Libraries &amp; Schematics →</a></p>
    </article>
  `,
})
export class NgmodulesMigration {}
