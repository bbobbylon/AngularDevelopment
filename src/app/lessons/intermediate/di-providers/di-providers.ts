import { Component, InjectionToken, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A strongly-typed token with a tree-shakable default factory. */
interface AppConfig {
  apiUrl: string;
  retries: number;
}
const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiUrl: '/api', retries: 3 }),
});

/** An abstract dependency, implemented and swapped via useClass. */
abstract class Notifier {
  abstract send(msg: string): string;
}
class EmailNotifier extends Notifier {
  send(msg: string) {
    return `📧 emailed: "${msg}"`;
  }
}

/**
 * Lesson: DI providers in depth.
 *
 * Beyond the four recipes: the injector hierarchy and how resolution walks up
 * it (element → environment → root → platform), the inject() resolution
 * modifiers (optional/self/skipSelf/host), multi providers (the mechanism
 * behind interceptors/validators), InjectionToken for non-class deps, and the
 * exam traps (missing deps, NullInjectorError, providedIn vs providers). Keeps a
 * real live DI demo (component-scoped useClass + a token factory).
 */
@Component({
  selector: 'app-lesson-di-providers',
  imports: [RouterLink],
  // Component-level providers — these win over root providers for this subtree.
  providers: [{ provide: Notifier, useClass: EmailNotifier }],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Dependency Injection</span>
      <h1>DI Providers In Depth</h1>
      <p class="lead">
        A provider tells an injector <em>how</em> to create a dependency for a token.
        Beyond <code>&#64;Injectable(&#123; providedIn: 'root' &#125;)</code>, you can map a
        token to a class, a ready-made value, a factory, or an alias — and scope it to a
        component or route subtree.
      </p>

      <h2>The four provider recipes</h2>
      <div class="code"><pre>{{ recipesSample }}</pre></div>

      <h2>InjectionToken for non-class deps</h2>
      <p>
        Values and interfaces have no runtime class to use as a key, so wrap them in an
        <code>InjectionToken</code>. A <code>factory</code> makes it tree-shakable — nothing
        is bundled unless something injects it:
      </p>
      <div class="code"><pre>{{ tokenSample }}</pre></div>

      <h2>Live — real DI on this component</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <p class="row">
          <span class="pill">apiUrl: {{ config.apiUrl }}</span>
          <span class="pill">retries: {{ config.retries }}</span>
        </p>
        <p>The <code>Notifier</code> token is provided <code>useClass: EmailNotifier</code> on this component:</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="notify()">notifier.send('Build passed')</button>
        </div>
        @if (out()) { <p style="color:var(--green)">{{ out() }}</p> }
      </div>

      <h2>The injector hierarchy</h2>
      <p>
        Injectors form a tree. When you <code>inject(Token)</code>, Angular starts at the
        current <strong>element injector</strong> and walks <em>up</em> — through parent
        elements, then the route/environment injectors, then root, then platform — until it
        finds a provider. The first match wins, which is exactly why a component-level
        provider overrides root for that subtree:
      </p>
      <div class="code"><pre>{{ hierarchySample }}</pre></div>
      <div class="note">
        <code>providedIn: 'root'</code> registers in the root environment injector (one
        app-wide singleton, tree-shakable). Component/route <code>providers</code> create a
        <em>new</em> instance per component/route subtree. If no provider is found anywhere,
        you get a <strong>NullInjectorError: No provider for X</strong>.
      </div>

      <h2>Resolution modifiers</h2>
      <p>You can steer the walk with options on <code>inject()</code> (and the old parameter decorators):</p>
      <table class="cmp">
        <tr><th>Option</th><th>Meaning</th></tr>
        <tr><td><code>&#123; optional: true &#125;</code></td><td>return <code>null</code> instead of throwing if unprovided.</td></tr>
        <tr><td><code>&#123; self: true &#125;</code></td><td>look only in the current injector — don't walk up.</td></tr>
        <tr><td><code>&#123; skipSelf: true &#125;</code></td><td>skip the current injector; start at the parent.</td></tr>
        <tr><td><code>&#123; host: true &#125;</code></td><td>stop the search at the host component's injector.</td></tr>
      </table>
      <div class="code"><pre>{{ modifiersSample }}</pre></div>

      <h2>Multi providers</h2>
      <p>
        <code>multi: true</code> collects several providers for one token into an
        <em>array</em> — the mechanism behind <code>HTTP_INTERCEPTORS</code>,
        <code>NG_VALIDATORS</code>, and app initializers:
      </p>
      <div class="code"><pre>{{ multiSample }}</pre></div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Missing <code>deps</code> on <code>useFactory</code>.</strong> The factory's
          arguments come from <code>deps</code> in order — omit them and you get
          <code>undefined</code> or a NullInjectorError.</li>
        <li><strong><code>NullInjectorError</code>.</strong> No provider up the whole chain.
          Add a provider, or use <code>&#123; optional: true &#125;</code> if absence is valid.</li>
        <li><strong><code>providedIn: 'root'</code> vs <code>providers: []</code>.</strong> Root is
          one shared singleton; listing it in <code>providers</code> makes a new instance for
          that subtree — accidental duplicates cause "why is my state not shared?" bugs.</li>
        <li><strong><code>useExisting</code> vs <code>useClass</code>.</strong>
          <code>useExisting</code> aliases to the <em>same</em> instance; <code>useClass</code>
          constructs a <em>second</em> one.</li>
        <li><strong>Injecting outside an injection context.</strong> <code>inject()</code> works
          in constructors, field initializers, factories and guards — not in arbitrary
          callbacks. Capture the dependency in the constructor.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Where do <code>useFactory</code> arguments come from?</summary>
        <div>From the <code>deps</code> array, injected and passed in order. No <code>deps</code>
        → no arguments.</div>
      </details>
      <details class="qa">
        <summary>Difference between <code>providedIn: 'root'</code> and component <code>providers</code>?</summary>
        <div>Root = one app-wide singleton in the root injector. Component
        <code>providers</code> = a fresh instance for that component and its children (a new
        element injector).</div>
      </details>
      <details class="qa">
        <summary>What does <code>&#123; skipSelf: true &#125;</code> do?</summary>
        <div>Skips the current injector and resolves starting from the parent — useful for a
        component that provides a token but wants the parent's version.</div>
      </details>
      <details class="qa">
        <summary>How do you register several implementations under one token?</summary>
        <div><code>multi: true</code> — each provider is added to an array injected for that
        token (how <code>HTTP_INTERCEPTORS</code> works).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>useClass</code> / <code>useValue</code> / <code>useFactory</code> / <code>useExisting</code> map a token to an implementation.</li>
        <li>Injection walks up the injector tree; the first provider found wins — component/route providers override root for their subtree.</li>
        <li><code>InjectionToken</code> keys values/interfaces; a token <code>factory</code> keeps the default tree-shakable.</li>
        <li><code>optional/self/skipSelf/host</code> steer resolution; <code>multi: true</code> collects providers into an array.</li>
      </ul>

      <p><a routerLink="/signals-advanced">Next: Advanced Signals →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class DiProviders {
  protected readonly config = inject(APP_CONFIG);
  private readonly notifier = inject(Notifier);
  protected readonly out = signal('');

  protected notify() {
    this.out.set(this.notifier.send('Build passed'));
  }

  protected readonly recipesSample = `{ provide: Logger, useClass: FancyLogger }         // construct this class
{ provide: API_URL, useValue: '/api' }             // use this literal value
{ provide: Store, useFactory: makeStore, deps: [Http] } // call a function
{ provide: OldToken, useExisting: NewToken }       // alias to another token`;

  protected readonly tokenSample = `const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiUrl: '/api', retries: 3 }),
});

const config = inject(APP_CONFIG);   // typed AppConfig`;

  protected readonly hierarchySample = `platform injector
  └─ root environment injector        // providedIn: 'root', bootstrap providers
       └─ route environment injector  // route providers: [...]
            └─ element injector        // component providers: [...]  ← inject() starts here
// inject(Token) walks UP this chain; first provider found wins.`;

  protected readonly modifiersSample = `theme = inject(THEME, { optional: true }) ?? 'light';   // null-safe default
own   = inject(PanelState, { self: true });             // only THIS injector
parent = inject(FormGroup, { skipSelf: true });         // the parent's instance`;

  protected readonly multiSample = `provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,  multi: true
provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true
// inject(HTTP_INTERCEPTORS) → [AuthInterceptor, LoggingInterceptor]`;
}
