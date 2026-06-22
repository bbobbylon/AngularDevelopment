import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-ngmodules',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · NgModules</span>
      <h1>NgModules Explained</h1>
      <p class="lead">
        Angular is <strong>standalone-first</strong> today — you've been writing
        standalone components this whole curriculum. But for ~8 years every Angular app
        was organised with <strong>NgModules</strong>, and the certification exam still
        tests them. You'll meet them in almost any existing codebase, so you need to read
        and reason about them confidently. Here's the whole model.
      </p>

      <h2>What an NgModule is</h2>
      <p>
        A class annotated with <code>&#64;NgModule</code> that groups related building
        blocks and tells Angular how they fit together. It has five metadata buckets:
      </p>
      <div class="code">
        <pre>&#64;NgModule({{ '{' }}
  declarations: [HomeComponent, HighlightDirective, MoneyPipe], // OWNED by this module
  imports:      [CommonModule, FormsModule, RouterModule],        // other modules you use
  exports:      [HomeComponent],                                  // re-expose to importers
  providers:    [UserService],                                    // services (DI)
  bootstrap:    [AppComponent],                                   // root cmp — AppModule only
{{ '}' }})
export class AppModule {{ '{' }}{{ '}' }}</pre>
      </div>
      <table class="t">
        <tr><td><code>declarations</code></td><td>The components, directives &amp; pipes that <strong>belong to</strong> this module. Each declarable belongs to <em>exactly one</em> module.</td></tr>
        <tr><td><code>imports</code></td><td>Other <em>modules</em> whose <strong>exported</strong> declarables/providers you want to use here.</td></tr>
        <tr><td><code>exports</code></td><td>The subset of your declarables (and re-exported modules) that importers may use.</td></tr>
        <tr><td><code>providers</code></td><td>Services registered for DI (module-level, or app-wide for the root module).</td></tr>
        <tr><td><code>bootstrap</code></td><td>The root component Angular renders at startup. Only the root <code>AppModule</code> has this.</td></tr>
      </table>

      <h2>The mental model</h2>
      <div class="code">
        <pre>A module is a "visibility box". Inside it, its declarations can see
each other. To use something from ANOTHER box you must:

   Box B exports Foo  ──imports──▶  Box A can now use Foo

   AppModule
   ├─ declarations: AppComponent, NavComponent
   ├─ imports: BrowserModule, SharedModule ──┐
   │                                          ▼
   └─ SharedModule exports: ButtonComponent, CardComponent
                                              ▲
              (declared once in SharedModule, used everywhere it's imported)</pre>
      </div>

      <h2>NgModule vs Standalone — same app, two wirings</h2>
      <div class="row" style="margin-bottom:10px">
        <button [class.ghost]="mode() !== 'ngmodule'" (click)="mode.set('ngmodule')">
          NgModule way
        </button>
        <button [class.ghost]="mode() !== 'standalone'" (click)="mode.set('standalone')">
          Standalone way (modern)
        </button>
      </div>
      <div class="code">
        <pre>{{ sample() }}</pre>
      </div>
      <p>{{ explanation() }}</p>

      <h2>Feature modules &amp; lazy loading</h2>
      <p>
        Big apps split into <strong>feature modules</strong>, each lazy-loaded by the
        router so its code only downloads when the user visits it:
      </p>
      <div class="code">
        <pre>// app.routes (or RouterModule.forRoot)
{{ '{' }} path: 'admin',
  loadChildren: () =&gt; import('./admin/admin.module').then(m =&gt; m.AdminModule) {{ '}' }}

// admin.module.ts
&#64;NgModule({{ '{' }}
  declarations: [AdminDashboard],
  imports: [CommonModule, RouterModule.forChild(ADMIN_ROUTES)], // forChild in features!
{{ '}' }})
export class AdminModule {{ '{' }}{{ '}' }}</pre>
      </div>
      <div class="note">
        <code>RouterModule.forRoot(routes)</code> is called <strong>once</strong> in the
        root module (it sets up the router service). Feature modules use
        <code>RouterModule.forChild(routes)</code>, which only registers routes. Mixing
        them up gives you duplicate router instances and broken navigation.
      </div>

      <h2>The classic module trio</h2>
      <table class="t">
        <tr><td><code>AppModule</code></td><td>The root. <code>bootstrap</code>s the app, imports <code>BrowserModule</code>.</td></tr>
        <tr><td><code>SharedModule</code></td><td>Declares + <strong>exports</strong> reusable components/pipes/directives. Imported by many feature modules. Never put singleton services here.</td></tr>
        <tr><td><code>CoreModule</code></td><td>App-wide <em>singletons</em> (services, the nav bar) imported <strong>once</strong> by <code>AppModule</code>.</td></tr>
      </table>

      <h2>How they bootstrap</h2>
      <div class="code">
        <pre>// Legacy NgModule bootstrap (main.ts)
platformBrowserDynamic().bootstrapModule(AppModule);

// Modern standalone bootstrap (main.ts)
bootstrapApplication(App, {{ '{' }}
  providers: [provideRouter(routes), provideHttpClient()],
{{ '}' }});</pre>
      </div>
      <p>
        They interoperate: you can <code>import</code> a standalone component into an
        NgModule's <code>imports</code>, and pull NgModule providers into a standalone app
        with <code>importProvidersFrom(SomeModule)</code>.
      </p>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr>
          <td>Declaring a component in two modules</td>
          <td>"Type X is part of the declarations of 2 modules." Each declarable belongs to one module; <strong>export</strong> it and import that module instead.</td>
        </tr>
        <tr>
          <td>Using a component but forgetting to export it</td>
          <td>Importers can't see non-exported declarables. Add it to <code>exports</code>.</td>
        </tr>
        <tr>
          <td><code>*ngIf</code> / pipes fail in a feature module</td>
          <td>You forgot to import <code>CommonModule</code> (only <code>BrowserModule</code> in the root re-exports it).</td>
        </tr>
        <tr>
          <td><code>forRoot()</code> in a feature module</td>
          <td>Use <code>forChild()</code>. <code>forRoot</code> belongs only in the root module.</td>
        </tr>
        <tr>
          <td>Providing a service in <code>SharedModule</code></td>
          <td>Lazy modules get their <em>own</em> instance — accidental duplicates. Prefer <code>providedIn: 'root'</code>.</td>
        </tr>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;NgModule</code> = <code>declarations</code> (owns) + <code>imports</code> (uses) + <code>exports</code> (shares) + <code>providers</code> + <code>bootstrap</code>.</li>
        <li>A declarable belongs to exactly one module; share by exporting and importing.</li>
        <li><code>forRoot()</code> once in the root; <code>forChild()</code> in features; lazy-load with <code>loadChildren</code>.</li>
        <li>Standalone is the modern default, but NgModules still appear everywhere and on the exam.</li>
        <li>The two models interoperate via <code>imports</code> and <code>importProvidersFrom</code>.</li>
      </ul>

      <p><a routerLink="/reactive-forms">Next: Reactive Forms →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 160px; white-space: nowrap; }`,
  ],
})
export class Ngmodules {
  protected readonly mode = signal<'ngmodule' | 'standalone'>('ngmodule');

  protected readonly sample = computed(() =>
    this.mode() === 'ngmodule'
      ? `// greeting.component.ts — declared, can't stand alone
@Component({ selector: 'app-greeting', template: '<h2>Hi</h2>' })
export class GreetingComponent {}

// greeting.module.ts — must be wrapped in a module
@NgModule({
  declarations: [GreetingComponent],
  imports: [CommonModule],
  exports: [GreetingComponent],   // so other modules can use it
})
export class GreetingModule {}`
      : `// greeting.ts — self-contained, no module needed
@Component({
  selector: 'app-greeting',
  standalone: true,            // (the default in Angular 19+)
  imports: [CommonModule],     // declares its OWN dependencies
  template: '<h2>Hi</h2>',
})
export class Greeting {}
// just import Greeting directly wherever you use it`,
  );

  protected readonly explanation = computed(() =>
    this.mode() === 'ngmodule'
      ? 'The NgModule way: a component is inert until a module declares it, and other modules can only use it if the owning module exports it. More files, more indirection.'
      : 'The standalone way: the component carries its own dependencies in imports and is used by importing the class directly. No declarations bucket, no wrapper module.',
  );
}
