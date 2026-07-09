import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: NgModules & the standalone migration — the compilation-scope model
 * that explains every NgModule error (with an interactive scope quiz), the
 * declarations/imports/exports/providers anatomy, forRoot/forChild and why
 * they existed, the three-step migration schematic, the provide* function
 * map, mixing both worlds, and the classic error messages decoded.
 */

interface ScopeScenario {
  label: string;
  question: string;
  works: boolean;
  why: string;
}

const SCENARIOS: ScopeScenario[] = [
  {
    label: 'declared here, used here',
    question: 'UserCard is declared in FeatureModule. Another component declared in FeatureModule uses <app-user-card>.',
    works: true,
    why: "Same compilation scope — a module's declarations all see each other. This is the baseline case.",
  },
  {
    label: 'declared there, no export',
    question: 'UserCard is declared in SharedModule (NOT exported). AdminModule imports SharedModule and a component there uses <app-user-card>.',
    works: false,
    why: 'Declarations are PRIVATE by default. Importing a module gives you only its EXPORTS. Result: "app-user-card is not a known element" — the single most common NgModule error. Fix: add UserCard to SharedModule\'s exports.',
  },
  {
    label: 'exported + imported',
    question: 'UserCard is declared AND exported by SharedModule. AdminModule imports SharedModule.',
    works: true,
    why: "exports define the module's public template API; importing the module pulls those into your compilation scope. Declared-and-exported is the shared-UI pattern.",
  },
  {
    label: 'declared in two modules',
    question: 'UserCard is added to the declarations of BOTH FeatureAModule and FeatureBModule.',
    works: false,
    why: 'NG6007: a declarable may belong to exactly ONE module. The fix was declaring it once in a shared module and importing that everywhere — or, today, making it standalone.',
  },
  {
    label: 'service, not exported',
    question: 'AuthService is in SharedModule\'s providers (not exported). AdminModule imports SharedModule and injects AuthService.',
    works: true,
    why: 'The trap question: exports only govern TEMPLATE scope (components/directives/pipes). Providers ignore it — an eagerly-loaded module\'s providers merge into the app-wide injector. This asymmetry confused everyone, and is one reason standalone splits the concepts cleanly.',
  },
  {
    label: 'standalone into NgModule',
    question: 'StatCard is a standalone component. LegacyModule adds it to its imports array, and a declared component uses it.',
    works: true,
    why: 'Standalone components import like a module: put them in the NgModule\'s IMPORTS (never declarations — NG6008). This interop is what makes incremental migration possible.',
  },
];

@Component({
  selector: 'app-lesson-ngmodules-migration',
  imports: [RouterLink],
  styles: [`
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 12px; }
    .chips button { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 18px; padding: 6px 14px; font-size: .84rem; }
    .chips button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

    .verdict { display: inline-block; font-weight: 700; font-size: .85rem; padding: 4px 14px; border-radius: 8px; margin: 8px 0 6px; }
    .verdict.yes { background: rgba(16,185,129,.12); color: var(--green); }
    .verdict.no { background: rgba(239,68,68,.12); color: #ef4444; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>NgModules &amp; Standalone Migration</h1>
      <p class="lead">
        For a decade, every component lived inside an <code>NgModule</code>; standalone
        components made that ceremony optional, then made its absence the default.
        Senior work still demands both: you'll read NgModule code in every mature
        codebase, migrate it incrementally, and explain <em>why</em> the old model
        confused people — which is exactly what its compilation-scope rules did.
      </p>

      <h2>NgModule anatomy — four arrays, two different worlds</h2>
      <div class="code"><pre>{{ anatomySample }}</pre></div>
      <table class="cmp">
        <tr><th>Array</th><th>Governs</th><th>Visibility rule</th></tr>
        <tr><td><code>declarations</code></td><td>template scope</td><td>private to this module unless exported; each declarable in exactly ONE module</td></tr>
        <tr><td><code>imports</code></td><td>template scope</td><td>pulls in other modules' <em>exports</em></td></tr>
        <tr><td><code>exports</code></td><td>template scope</td><td>this module's public template API (can re-export imported modules)</td></tr>
        <tr><td><code>providers</code></td><td>injector</td><td>ignores exports entirely — eager modules merge providers app-wide</td></tr>
      </table>
      <p>
        The asymmetry in that last row — template scope obeys exports, the injector
        doesn't — generated years of confusion and is a core motivation for standalone's
        cleaner split: components own template deps, <code>app.config.ts</code>/routes
        own providers.
      </p>

      <h2>Test yourself — the compilation-scope quiz</h2>
      <div class="demo">
        <p class="demo__title">Interactive — does it work? Predict before you click</p>
        <div class="chips">
          @for (s of scenarios; track s.label) {
            <button [class.on]="active() === s" (click)="active.set(s)">{{ s.label }}</button>
          }
        </div>
        @if (active(); as s) {
          <p style="font-size:.92rem">{{ s.question }}</p>
          <span class="verdict" [class.yes]="s.works" [class.no]="!s.works">{{ s.works ? '✓ works' : '✗ fails' }}</span>
          <p style="font-size:.9rem; margin:6px 0 0">{{ s.why }}</p>
        } @else {
          <p style="color:var(--text-muted);font-size:.88rem">Six scenarios; two are the errors that dominated Angular Stack Overflow for years, one is a trap.</p>
        }
      </div>

      <h2>forRoot / forChild — why that pattern existed</h2>
      <div class="code"><pre>{{ forRootSample }}</pre></div>
      <p>
        A module imported by five lazy features would register its providers five times
        — five instances of a "singleton". <code>forRoot()</code> returned
        module-plus-providers for the root import; <code>forChild()</code> returned the
        module without them. It was a convention (not a language feature) papering over
        the provider-scope asymmetry — standalone's <code>provide*()</code> functions
        make the whole dance unnecessary.
      </p>

      <h2>The standalone world</h2>
      <div class="code"><pre>{{ standaloneSample }}</pre></div>
      <ul>
        <li><strong>Template deps live on the component</strong> — its <code>imports</code>
          array names exactly what its template uses (components, directives, pipes,
          or whole NgModules).</li>
        <li><strong>standalone is the default</strong> — modern components don't write
          <code>standalone: true</code>; NgModule-declared components are the ones that
          need explicit marking (<code>standalone: false</code>).</li>
        <li><strong>Providers centralize</strong> — <code>app.config.ts</code> for the app,
          route <code>providers</code> for feature scope, component
          <code>providers</code> for per-instance.</li>
      </ul>

      <h2>The migration — three schematic passes</h2>
      <div class="code"><pre>{{ migrationSample }}</pre></div>
      <table class="cmp">
        <tr><th>NgModule-era import</th><th>Standalone replacement</th></tr>
        <tr><td><code>HttpClientModule</code></td><td><code>provideHttpClient(withInterceptors(...))</code></td></tr>
        <tr><td><code>RouterModule.forRoot(routes)</code></td><td><code>provideRouter(routes, withComponentInputBinding(), …)</code></td></tr>
        <tr><td><code>RouterModule.forChild(routes)</code></td><td>a plain <code>Routes</code> file + <code>loadChildren: () =&gt; import('./x.routes')</code></td></tr>
        <tr><td><code>BrowserModule</code></td><td>nothing — <code>bootstrapApplication</code> covers it</td></tr>
        <tr><td><code>BrowserAnimationsModule</code></td><td>gone with the deprecated animations package (see <a routerLink="/animations">Animations</a>)</td></tr>
        <tr><td><code>CommonModule</code> (for *ngIf/*ngFor)</td><td>usually nothing — <code>&#64;if</code>/<code>&#64;for</code> are built into templates; import only the pipes you use (<code>DatePipe</code>, <code>AsyncPipe</code>…)</td></tr>
        <tr><td>provider-only library modules</td><td><code>importProvidersFrom(TheModule)</code> in app.config as the bridge</td></tr>
      </table>

      <h2>Mixing worlds during migration</h2>
      <div class="code"><pre>{{ interopSample }}</pre></div>
      <div class="note">
        Both directions work, so migrate leaf-first without a big bang: convert leaf
        components to standalone (NgModules can import them), walk up the tree, delete
        each module when its last declaration leaves, and finish by swapping
        <code>platformBrowserDynamic().bootstrapModule(AppModule)</code> for
        <code>bootstrapApplication(App, appConfig)</code>.
      </div>

      <h2>Error messages, decoded</h2>
      <table class="cmp">
        <tr><th>Error</th><th>Meaning</th><th>Fix</th></tr>
        <tr><td>"'app-x' is not a known element"</td><td>X isn't in the compilation scope</td><td>standalone: add to the component's <code>imports</code>; NgModule: export from its module and import that module</td></tr>
        <tr><td>NG6007 "part of the declarations of 2 modules"</td><td>declarable double-declared</td><td>declare once in a shared module — or make it standalone</td></tr>
        <tr><td>NG6008 "standalone and cannot be declared"</td><td>standalone component in a <code>declarations</code> array</td><td>move it to the module's <code>imports</code></td></tr>
        <tr><td>NG0302 "the pipe 'date' could not be found"</td><td>pipe not in scope</td><td>import <code>DatePipe</code> (standalone) / <code>CommonModule</code> (NgModule)</td></tr>
      </table>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Module A imports module B. Can A's components use B's declared-but-unexported directive?</summary>
        <div>No — imports grant access to B's <em>exports</em> only. Declarations are
        private by default. This asymmetry (vs providers, which leak app-wide from eager
        modules) is the single most-tested NgModule fact.</div>
      </details>
      <details class="qa">
        <summary>Why did <code>RouterModule</code> need forRoot/forChild?</summary>
        <div>To register the router's singleton services exactly once: forRoot returned
        module + providers for the app root; forChild returned only the directives for
        lazy features — otherwise each lazy import would create duplicate router state.
        <code>provideRouter()</code> + plain route arrays replaced the whole pattern.</div>
      </details>
      <details class="qa">
        <summary>During migration, how does an NgModule use an already-converted standalone component?</summary>
        <div>Add the component class to the NgModule's <code>imports</code> array (not
        declarations — that's NG6008). Standalone things import like modules.</div>
      </details>
      <details class="qa">
        <summary>A library only ships <code>SomeLibModule</code> with providers. Standalone app — now what?</summary>
        <div><code>importProvidersFrom(SomeLibModule)</code> inside
        <code>app.config.ts</code> providers extracts the module's provider graph into
        the environment injector. It's the designated bridge until the library ships a
        <code>provideSomeLib()</code> function.</div>
      </details>
      <details class="qa">
        <summary>Do you still need <code>CommonModule</code> in standalone components?</summary>
        <div>Rarely. <code>&#64;if/&#64;for/&#64;switch</code> replaced the structural
        directives, so you import only what you actually use — typically individual pipes
        like <code>AsyncPipe</code> or <code>DatePipe</code>. Blanket CommonModule imports
        are a migration smell.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>NgModule mental model: declarations are private, exports are the public template API, imports pull in exports — and providers ignore all of it.</li>
        <li>forRoot/forChild existed to fake provider scoping; <code>provide*()</code> functions made it obsolete.</li>
        <li>Standalone puts template deps on the component and providers in app.config/routes — the two concerns NgModules tangled.</li>
        <li>Migrate leaf-first with <code>ng generate &#64;angular/core:standalone</code> (convert → prune modules → bootstrap), bridging gaps with <code>importProvidersFrom</code>.</li>
        <li>Know the error map: unknown element = scope; NG6007 = double declaration; NG6008 = standalone in declarations.</li>
      </ul>

      <p><a routerLink="/libraries-schematics">Next: Libraries &amp; Schematics →</a></p>
    </article>
  `,
})
export class NgmodulesMigration {
  readonly scenarios = SCENARIOS;
  readonly active = signal<ScopeScenario | null>(null);

  readonly anatomySample = `@NgModule({
  declarations: [UserCard, HighlightDirective, InitialsPipe], // template scope (private!)
  imports:      [CommonModule, SharedModule],                  // other modules' exports
  exports:      [UserCard],                                    // my public template API
  providers:    [UserService],                                 // injector — different world
  bootstrap:    [AppComponent],                                // root module only
})
export class UserModule {}`;

  readonly forRootSample = `// the old convention, seen in every router/config-style library
@NgModule({ declarations: [...], exports: [...] })
export class CarouselModule {
  static forRoot(config: CarouselConfig): ModuleWithProviders<CarouselModule> {
    return {
      ngModule: CarouselModule,
      providers: [{ provide: CAROUSEL_CONFIG, useValue: config }], // ONCE, at root
    };
  }
  // lazy features import CarouselModule (or forChild()) — directives, no providers
}`;

  readonly standaloneSample = `@Component({
  selector: 'app-user-card',
  imports: [RouterLink, DatePipe, StatBadge],   // exactly what THIS template uses
  template: \`…\`,
})
export class UserCard {}          // standalone by default — no module anywhere

// main.ts
bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});`;

  readonly migrationSample = `ng generate @angular/core:standalone
# run three times, once per mode:
#   1. "Convert all components…"  → adds imports arrays, flips declarations
#   2. "Remove unnecessary NgModules" → deletes emptied modules
#   3. "Bootstrap the application…"   → AppModule → bootstrapApplication + app.config.ts

# then review: leftover provider-only modules, forRoot calls, route modules`;

  readonly interopSample = `// standalone component INSIDE an NgModule app:
@NgModule({
  imports: [StatCard],        // standalone things go in imports (NG6008 if declared)
  declarations: [LegacyPage], // legacy component using <app-stat-card>
})

// NgModule INSIDE a standalone component:
@Component({
  imports: [LegacyChartsModule],   // whole module's exports become available
})`;
}
