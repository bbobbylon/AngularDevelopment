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
  /**
   * Sends a notification.
   *
   * @param msg The message.
   * @returns What was sent, for display.
   */
  abstract send(msg: string): string;
}
/**
 * The concrete implementation swapped in via `useClass`. Consumers inject the
 * abstract {@link Notifier} and never learn which one they got — the point of
 * providing against an abstraction.
 */
class EmailNotifier extends Notifier {
  /**
   * @inheritDoc
   */
  send(msg: string) {
    return `📧 emailed: "${msg}"`;
  }
}

/** A multi-provider token — several providers accumulate into one array. */
const PLUGINS = new InjectionToken<string[]>('PLUGINS');

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
  providers: [
    { provide: Notifier, useClass: EmailNotifier },
    { provide: PLUGINS, useValue: 'spellcheck', multi: true },
    { provide: PLUGINS, useValue: 'autosave', multi: true },
    { provide: PLUGINS, useValue: 'analytics', multi: true },
  ],
  templateUrl: './di-providers.html',
  styleUrl: './di-providers.css',
})
export class DiProviders {
  /**
   * The config object, from a token whose default comes from its own factory — so
   * it resolves even with no provider anywhere.
   */
  protected readonly config = inject(APP_CONFIG);
  /**
   * The notifier. Declared as the abstract type; resolved to `EmailNotifier` by
   * this component's own `providers`.
   */
  private readonly notifier = inject(Notifier);
  /**
   * The last notification sent.
   */
  protected readonly out = signal('');
  /**
   * Everything registered under the multi-provider token, as one array.
   */
  protected readonly plugins = inject(PLUGINS);

  /**
   * Sends a notification through whichever implementation DI supplied.
   */
  protected notify() {
    this.out.set(this.notifier.send('Build passed'));
  }

  /**
   * Sample: the four provider recipes — `useClass`, `useValue`, `useFactory`,
   * `useExisting`.
   */
  protected readonly recipesSample = `{ provide: Logger, useClass: FancyLogger }         // construct this class
{ provide: API_URL, useValue: '/api' }             // use this literal value
{ provide: Store, useFactory: makeStore, deps: [Http] } // call a function
{ provide: OldToken, useExisting: NewToken }       // alias to another token`;

  /**
   * Sample: `InjectionToken` with a default factory, for dependencies that are not
   * classes.
   */
  protected readonly tokenSample = `const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiUrl: '/api', retries: 3 }),
});

const config = inject(APP_CONFIG);   // typed AppConfig`;

  /**
   * Sample: the injector hierarchy, and the order resolution walks it.
   */
  protected readonly hierarchySample = `platform injector
  └─ root environment injector        // providedIn: 'root', bootstrap providers
       └─ route environment injector  // route providers: [...]
            └─ element injector        // component providers: [...]  ← inject() starts here
// inject(Token) walks UP this chain; first provider found wins.`;

  /**
   * Sample: the resolution modifiers — `optional`, `self`, `skipSelf`.
   */
  protected readonly modifiersSample = `theme = inject(THEME, { optional: true }) ?? 'light';   // null-safe default
own   = inject(PanelState, { self: true });             // only THIS injector
parent = inject(FormGroup, { skipSelf: true });         // the parent's instance`;

  /**
   * Sample: `multi: true`, the mechanism behind interceptors and validators.
   */
  protected readonly multiSample = `provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,  multi: true
provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true
// inject(HTTP_INTERCEPTORS) → [AuthInterceptor, LoggingInterceptor]`;

  /**
   * Sample: the multi-provider registration behind this page's own live demo.
   */
  protected readonly multiLiveSample = `// three providers, same token, all multi: true
providers: [
  { provide: PLUGINS, useValue: 'spellcheck', multi: true },
  { provide: PLUGINS, useValue: 'autosave',   multi: true },
  { provide: PLUGINS, useValue: 'analytics',  multi: true },
]

plugins = inject(PLUGINS);   // ['spellcheck', 'autosave', 'analytics']`;
}
