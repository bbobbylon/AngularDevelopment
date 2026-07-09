import { Component, Injectable, InjectionToken, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: advanced dependency injection — the two injector trees, a LIVE
 * resolution-modifier playground (real components proving self/skipSelf/
 * optional against real instances), multi providers, viewProviders,
 * injection context rules, tree-shakable tokens, and forwardRef.
 */

/** A multi-provider token — many providers contribute to one array. */
const FEATURE = new InjectionToken<string>('FEATURE');

/**
 * Instance beacon for the live playground: every instantiation gets the next
 * id, so components can PROVE which injector their dependency came from.
 */
@Injectable()
export class Beacon {
  private static next = 1;
  readonly id = Beacon.next++;
}

/**
 * Child WITH its own provider — default resolution stops at itself.
 * Attribute selector on <tr>: a custom element inside <table> would be
 * foster-parented out of the table by the HTML parser.
 */
@Component({
  selector: 'tr[appDiChildOwn]',
  template: `
    <td><code>&lt;child providers=[Beacon]&gt;</code></td>
    <td><code>inject(Beacon)</code> → <strong>#{{ own.id }}</strong> (its own)</td>
    <td><code>skipSelf: true</code> → <strong>#{{ fromParent.id }}</strong> (the lesson's)</td>
  `,
  providers: [Beacon],
})
export class DiChildOwn {
  readonly own = inject(Beacon);
  readonly fromParent = inject(Beacon, { skipSelf: true });
}

/** Child WITHOUT a provider — default resolution walks up to the parent. */
@Component({
  selector: 'tr[appDiChildBare]',
  template: `
    <td><code>&lt;child&gt;</code> (no provider)</td>
    <td><code>inject(Beacon)</code> → <strong>#{{ inherited.id }}</strong> (the lesson's)</td>
    <td><code>self + optional</code> → <strong>{{ selfOnly ? '#' + selfOnly.id : 'null' }}</strong> (nothing local)</td>
  `,
})
export class DiChildBare {
  readonly inherited = inject(Beacon);
  readonly selfOnly = inject(Beacon, { self: true, optional: true });
}

@Component({
  selector: 'app-lesson-di-advanced',
  imports: [RouterLink, DiChildOwn, DiChildBare],
  providers: [
    Beacon,
    { provide: FEATURE, useValue: 'logging', multi: true },
    { provide: FEATURE, useValue: 'analytics', multi: true },
    { provide: FEATURE, useValue: 'offline-cache', multi: true },
  ],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Dependency Injection</span>
      <h1>Advanced DI</h1>
      <p class="lead">
        Angular's injector is not one container — it's <strong>two cooperating
        trees</strong>, and every advanced DI feature (modifiers, multi providers,
        viewProviders, route providers) is a way of steering resolution through them.
        This page proves the resolution rules with live components, then covers the
        patterns built on top.
      </p>

      <h2>The two injector trees</h2>
      <table class="cmp">
        <tr><th></th><th>Element injectors</th><th>Environment injectors</th></tr>
        <tr><td>Created by</td><td>components &amp; directives (<code>providers</code>/<code>viewProviders</code>)</td><td><code>bootstrapApplication</code> (root), lazy routes with <code>providers</code></td></tr>
        <tr><td>Shape</td><td>mirrors the DOM/component tree</td><td>mirrors the route/bundle structure</td></tr>
        <tr><td>Lifetime</td><td>dies with the component</td><td>root lives forever; route env injectors live while routed</td></tr>
      </table>
      <p>
        Resolution order for <code>inject(Token)</code> in a component: walk the
        <strong>element</strong> injector chain from the component up through its DOM
        ancestors; if nothing matches, continue through the <strong>environment</strong>
        chain (route → root → platform). <code>NullInjectorError</code> means both
        walks came up empty.
      </p>

      <h2>Live proof — the same token, four resolutions</h2>
      <p>
        <code>Beacon</code> is a service whose every instance gets a sequential id.
        This lesson component provides one; the two children below inject it four
        different ways and report which <em>actual instance</em> they received:
      </p>
      <div class="demo">
        <p class="demo__title">Live — real components, real injectors (lesson's own instance: #{{ lessonBeacon.id }})</p>
        <table class="cmp">
          <tr><th>Component</th><th>default resolution</th><th>with modifier</th></tr>
          <tr appDiChildOwn></tr>
          <tr appDiChildBare></tr>
        </table>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:6px">
          The child with its own provider gets its own instance by default and must
          <code>skipSelf</code> to reach the lesson's. The bare child inherits the
          lesson's instance, and <code>self</code> proves it has none locally —
          without <code>optional: true</code> that lookup would throw.
        </p>
      </div>
      <div class="code"><pre>{{ modifiersSample }}</pre></div>
      <ul>
        <li><strong>optional</strong> — return <code>null</code> instead of throwing. Combine with any other modifier.</li>
        <li><strong>self</strong> — only this element's injector. "Give me MY instance or nothing."</li>
        <li><strong>skipSelf</strong> — start at the parent. The classic tool for recursive/tree components that need the <em>ancestor's</em> instance while providing their own.</li>
        <li><strong>host</strong> — stop the walk at the host component boundary. How form directives find their surrounding <code>ControlContainer</code> without accidentally grabbing one from a parent form far above.</li>
      </ul>

      <h2>Multi providers — one token, many contributors</h2>
      <div class="demo">
        <p class="demo__title">Live — three providers, one token, one array</p>
        <p class="row">
          @for (f of features; track f) {<span class="pill" style="color:var(--green)">{{ f }}</span>}
        </p>
      </div>
      <div class="code"><pre>{{ multiSample }}</pre></div>
      <p>
        This is the extension-point pattern the framework itself is built on:
        <code>NG_VALIDATORS</code> (all validators on a control),
        <code>NG_VALUE_ACCESSOR</code>, app initializers, and router interceptors all
        collect contributions this way. Forgetting <code>multi: true</code> on one
        registration silently <em>replaces</em> the whole collection instead of adding
        to it — a classic production bug.
      </p>

      <h2>providers vs viewProviders</h2>
      <div class="code"><pre>{{ viewProvidersSample }}</pre></div>
      <p>
        <code>providers</code> are visible to the component's view <em>and</em> to
        content projected into it; <code>viewProviders</code> are visible to the view
        only. Use <code>viewProviders</code> when a service is an internal
        implementation detail that projected content (written by your component's
        <em>consumers</em>) must not accidentally inject — encapsulation for DI.
      </p>

      <h2>Injection context — where inject() is legal</h2>
      <div class="code"><pre>{{ contextSample }}</pre></div>
      <p>
        <code>inject()</code> works only while an injector is "current": field
        initializers, constructors, provider factories, and router
        guards/resolvers/interceptors (they run in an injection context by design).
        Call it later — in a click handler, a subscribe callback, a
        <code>setTimeout</code> — and you get <strong>NG0203</strong>. The escape hatch
        is capturing the injector and using <code>runInInjectionContext</code>.
      </p>

      <h2>Tokens, factories &amp; tree-shakability</h2>
      <div class="code"><pre>{{ tokenSample }}</pre></div>
      <ul>
        <li><strong><code>providedIn: 'root'</code></strong> — one app-wide instance,
          tree-shaken away if never injected. The default choice.</li>
        <li><strong>Token with a factory</strong> — computed defaults with zero
          registration; the factory itself runs in an injection context, so it can
          <code>inject()</code> other services.</li>
        <li><strong>Component <code>providers</code> array</strong> — a fresh instance per
          component instance; also the unit-testing seam (override per test).</li>
        <li><strong>Route <code>providers</code></strong> — an environment injector scoped
          to a lazy feature: "singleton within the feature" without polluting root.</li>
      </ul>

      <h2>forwardRef — breaking declaration-order cycles</h2>
      <div class="code"><pre>{{ forwardRefSample }}</pre></div>
      <p>
        Class decorators evaluate when the class is defined; if a provider references a
        class declared <em>later in the same file</em> (the CVA pattern's self-reference),
        <code>forwardRef(() =&gt; X)</code> defers the dereference until injection time.
      </p>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Walk the resolution for <code>inject(Cfg)</code> inside a deeply nested component.</summary>
        <div>Element injectors first: the component's own, then each DOM ancestor's, up to
        the root component. Then environment injectors: the lazy route's (if any), the
        root, the platform. First provider found wins; none →
        <code>NullInjectorError</code>.</div>
      </details>
      <details class="qa">
        <summary>A tree component provides <code>TreeLevelService</code> and needs its parent level's too. How?</summary>
        <div><code>providers: [TreeLevelService]</code> for its own, plus
        <code>inject(TreeLevelService, &#123; skipSelf: true, optional: true &#125;)</code> for
        the ancestor's — optional because the root node has no parent level.</div>
      </details>
      <details class="qa">
        <summary>You registered a second validator and the first stopped working. Why?</summary>
        <div>Missing <code>multi: true</code>. Without it the second registration replaces
        the token's provider instead of contributing to the array — every multi-token
        registration must say <code>multi: true</code>, every time.</div>
      </details>
      <details class="qa">
        <summary>NG0203: inject() must be called from an injection context. What happened?</summary>
        <div><code>inject()</code> ran after construction — in an event handler, timer or
        subscription. Move it to a field initializer, or capture
        <code>Injector</code> at construction and wrap the late call in
        <code>runInInjectionContext(injector, () =&gt; …)</code>.</div>
      </details>
      <details class="qa">
        <summary>Why prefer <code>providedIn: 'root'</code> over root-level <code>providers: []</code>?</summary>
        <div>Tree-shakability: the service is only bundled if something injects it. It also
        avoids the duplicate-instance trap where two lazy bundles each register their own
        copy of a supposedly shared service.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Two trees: element injectors (DOM-shaped) then environment injectors (route/root) — that walk IS the mental model.</li>
        <li><code>optional/self/skipSelf/host</code> steer the walk; the live table above is the proof.</li>
        <li><code>multi: true</code> turns a token into an extension point — omit it once and you replace the collection.</li>
        <li><code>viewProviders</code> hides services from projected content; route providers scope singletons to features.</li>
        <li><code>inject()</code> needs an injection context (NG0203 otherwise); <code>runInInjectionContext</code> is the bridge.</li>
      </ul>

      <p><a routerLink="/rxjs-advanced">Next: Advanced RxJS →</a></p>
    </article>
  `,
})
export class DiAdvanced {
  readonly lessonBeacon = inject(Beacon);
  protected readonly features = inject(FEATURE) as unknown as string[];

  readonly modifiersSample = `readonly own        = inject(Beacon);                          // nearest, self included
readonly fromParent = inject(Beacon, { skipSelf: true });      // start at parent
readonly localOnly  = inject(Beacon, { self: true, optional: true }); // mine or null
readonly bounded    = inject(ControlContainer, { host: true }); // stop at host component

// decorator-era spelling of the same thing:
constructor(@Optional() @SkipSelf() parent: Beacon) {}`;

  readonly multiSample = `{ provide: FEATURE, useValue: 'logging',       multi: true },
{ provide: FEATURE, useValue: 'analytics',     multi: true },
{ provide: FEATURE, useValue: 'offline-cache', multi: true },

const features = inject(FEATURE);  // string[] — all three

// the framework's own extension points work exactly like this:
{ provide: NG_VALIDATORS, useExisting: MyValidator, multi: true }`;

  readonly viewProvidersSample = `@Component({
  selector: 'app-card',
  providers:     [CardState],   // view + projected content can inject
  viewProviders: [CardTheme],   // ONLY the view — projected content cannot
  template: '<div class="card"><ng-content /></div>',
})

// consumer writes: <app-card><app-badge /></app-card>
// app-badge CAN inject CardState, CANNOT inject CardTheme`;

  readonly contextSample = `export class Widget {
  private http = inject(HttpClient);        // ✓ field initializer
  private injector = inject(Injector);      // capture for later

  constructor() {
    const cfg = inject(APP_CONFIG);         // ✓ constructor
  }

  onClick() {
    const svc = inject(Thing);              // ✗ NG0203 — no context here
    runInInjectionContext(this.injector, () => {
      const svc = inject(Thing);            // ✓ bridged
    });
  }
}`;

  readonly tokenSample = `// tree-shakable service — bundled only if injected
@Injectable({ providedIn: 'root' })
export class Metrics {}

// token with a factory default (factory runs in an injection context)
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => inject(ENVIRONMENT).apiUrl,
});

// route-scoped environment injector — feature singleton, not app singleton
{
  path: 'admin',
  providers: [AdminAuditService],
  loadChildren: () => import('./admin/admin.routes'),
}`;

  readonly forwardRefSample = `@Component({
  selector: 'app-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RatingControl),  // class not defined yet
    multi: true,
  }],
})
export class RatingControl implements ControlValueAccessor { … }`;
}
