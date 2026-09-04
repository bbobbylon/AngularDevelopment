import { Component, InjectionToken, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Predict, Quiz, Remember],
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

  /**
   * The accidental-fork puzzle used by the ask-before-telling block.
   *
   * Nothing errors. `AdminPanel` gets a real, working `CartService` — just not
   * the SAME one everything else in the app is using, and there is no message
   * anywhere telling you two carts now exist.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly accidentalForkSample = `@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<string[]>([]);
}

// header.ts — reads the app-wide cart
export class Header {
  private cart = inject(CartService);
  readonly count = computed(() => this.cart.items().length);
}

// admin-panel.ts — someone "made sure DI was set up" for a new feature
@Component({
  providers: [CartService],   // <-- looked harmless, copied from another component
})
export class AdminPanel {
  private cart = inject(CartService);   // gets a NEW instance, not the app-wide one
}

// A user adds an item while AdminPanel is open. Does Header's count update?`;

  /**
   * The self-test, on `skipSelf` when the current injector genuinely does have
   * a matching provider. Every wrong answer assumes some behavior other than
   * "start the search one level higher than usual" for what the modifier does.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: "The parent's instance — skipSelf explicitly excludes the current injector from the search, even though the current injector has its own provider for this exact token, so the walk starts one level up instead of zero.",
      correct: true,
      why: "This is the actual use case for `skipSelf`: a component that provides its own instance of something but also wants a handle on the ancestor's instance — the classic pattern behind nested form controls reading their parent `ControlContainer`.",
    },
    {
      text: "The local one, since a component's own inject() calls always prefer that component's own providers array.",
      why: 'That describes what happens with no modifier at all. `skipSelf` is specifically the opt-out of that default preference — it tells Angular to ignore the current injector even when it has an answer.',
    },
    {
      text: 'It throws NullInjectorError, because skipSelf is only valid when the current injector has no matching provider.',
      why: 'There is no such restriction. `skipSelf` works whether or not the current injector has a provider — it simply is never consulted either way.',
    },
    {
      text: 'Both — Angular merges same-token providers across injector levels when skipSelf is used, similar to multi: true.',
      why: 'Only `multi: true` collects multiple values into an array, and that happens within a single provider list, not across injector levels. `skipSelf` still returns one single instance — just from a different injector than usual.',
    },
  ];
}
