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

/** An abstract dependency, implemented two ways and swapped via useClass. */
abstract class Notifier {
  abstract send(msg: string): string;
}
class EmailNotifier extends Notifier {
  send(msg: string) {
    return `📧 emailed: "${msg}"`;
  }
}

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
        A provider tells the injector <em>how</em> to create a dependency for a token.
        Beyond the common <code>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})</code>,
        you can map a token to a class, a ready-made value, or a factory.
      </p>

      <h2>The four provider recipes</h2>
      <div class="code">
        <pre>{{ '{' }} provide: Logger, useClass: FancyLogger {{ '}' }}     // construct this class
{{ '{' }} provide: API_URL, useValue: '/api' {{ '}' }}          // use this literal value
{{ '}' }} provide: Store, useFactory: makeStore, deps: [Http] {{ '}' }} // call a function
{{ '}' }} provide: OldToken, useExisting: NewToken {{ '}' }}    // alias to another token</pre>
      </div>

      <h2>InjectionToken for non-class deps</h2>
      <p>
        Values and interfaces have no runtime class to use as a key, so wrap them in an
        <code>InjectionToken</code>. A <code>factory</code> makes it tree-shakable —
        nothing is bundled unless something injects it.
      </p>
      <div class="code">
        <pre>const APP_CONFIG = new InjectionToken&lt;AppConfig&gt;('APP_CONFIG', {{ '{' }}
  factory: () =&gt; ({{ '{' }} apiUrl: '/api', retries: 3 {{ '}' }}),
{{ '}' }});

const config = inject(APP_CONFIG);   // typed AppConfig</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <p class="row">
          <span class="pill">apiUrl: {{ config.apiUrl }}</span>
          <span class="pill">retries: {{ config.retries }}</span>
        </p>
        <p>
          The <code>Notifier</code> token is provided <code>useClass: EmailNotifier</code>
          on this component:
        </p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="notify()">notifier.send('Build passed')</button>
        </div>
        @if (out()) {
          <p style="color:var(--green)">{{ out() }}</p>
        }
      </div>

      <h2>Factory dependencies</h2>
      <div class="code">
        <pre>{{ '{' }}
  provide: Store,
  useFactory: (http: HttpClient) =&gt; new Store(http),
  deps: [HttpClient],          // injected and passed to the factory in order
{{ '}' }}</pre>
      </div>

      <div class="note">
        Providers are hierarchical: a token provided on a component overrides the same
        token from a parent or from root, but only for that component and its children.
        This is how you scope a service to a feature. <code>useFactory</code> lists its
        own <code>deps</code>; <code>multi: true</code> collects providers into an array
        (the mechanism behind <code>HTTP_INTERCEPTORS</code>); and
        <code>useExisting</code> aliases two tokens to the <em>same</em> instance rather
        than creating a second one.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>useClass</code> / <code>useValue</code> / <code>useFactory</code> / <code>useExisting</code> map a token to an implementation.</li>
        <li>Use <code>InjectionToken</code> for values and interfaces (no runtime type).</li>
        <li>A token <code>factory</code> keeps the default tree-shakable.</li>
        <li>Component-level <code>providers</code> override root providers for that subtree.</li>
      </ul>

      <p><a routerLink="/signals-advanced">Next: Advanced Signals →</a></p>
    </article>
  `,
})
export class DiProviders {
  protected readonly config = inject(APP_CONFIG);
  private readonly notifier = inject(Notifier);
  protected readonly out = signal('');

  protected notify() {
    this.out.set(this.notifier.send('Build passed'));
  }
}
