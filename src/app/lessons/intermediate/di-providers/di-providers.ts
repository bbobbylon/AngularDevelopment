import { Component, InjectionToken, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

// ── Live-demo primitives ────────────────────────────────────────────────────

/** A strongly-typed token with a tree-shakable default factory. */
interface AppConfig {
  apiUrl: string;
  retries: number;
}
const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiUrl: '/api', retries: 3 }),
});

/** An abstract dependency, implemented and swapped via `useClass`. */
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
  /** @inheritDoc */
  send(msg: string) {
    return `📧 emailed: "${msg}"`;
  }
}

/** A multi-provider token — several providers accumulate into one array. */
const PLUGINS = new InjectionToken<string[]>('PLUGINS');

/**
 * An abstract dependency used to prove `useExisting` against `useClass` —
 * two tokens, one blueprint, and a live counter that shows which one shares
 * state and which one forked.
 */
abstract class LoggerBase {
  abstract log(note: string): string;
}
/**
 * The concrete implementation. Registered once as itself, then aliased by one
 * token (`LoggerBase`, via `useExisting`) and cloned by another
 * (`CLONED_LOGGER`, via `useClass`) — the whole live section below is built
 * out of nothing but this one class and three provider entries.
 */
class AppLogger extends LoggerBase {
  /** How many times this exact instance has logged. Read directly in the template. */
  calls = 0;
  log(note: string): string {
    this.calls++;
    return `📝 [${this.calls}] ${note}`;
  }
}
/** A second token, deliberately provided with `useClass: AppLogger` — a SEPARATE instance. */
const CLONED_LOGGER = new InjectionToken<LoggerBase>('CLONED_LOGGER');

// ── Main lesson component ───────────────────────────────────────────────────

/**
 * Lesson: DI providers in depth.
 *
 * `@Injectable({ providedIn: 'root' })` answers exactly one question — build
 * one of this class — and the whole rest of this lesson is the much bigger set
 * of questions that leaves open: what do you hand over when there is no class
 * to build, how do you swap an implementation for one subtree without
 * touching the rest of the app, where does an unresolved token actually get
 * looked for, and how does a whole *feature*, not just one service, publish
 * its own configurable providers.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (`shared/brain/`,
 * `src/brain-friendly.css`), following the section rhythm the reference
 * implementation in `expert/change-detection` established:
 *
 * 1. **Pose the problem before naming it.** `@Injectable()` cannot construct
 *    an abstract class, and the reader is made to commit to that on a napkin
 *    before the word "provider" is defined.
 * 2. **Analogy, then vocabulary.** A provider is framed as the instruction
 *    card taped to a request slip — a token asks, an injector consults its
 *    filing cabinet of recipes, never the dependency itself.
 * 3. **The same idea in several modes** — a dialogue between "you" and the
 *    injector, a scattered tape-card grid of the four recipes, an annotated
 *    code sample, and three separate live benches (`useClass`, `useFactory`'s
 *    footgun, `useExisting` against `useClass`) proving the abstract claims.
 * 4. **Every substantial snippet is annotated line by line** via
 *    `app-code-lab`; nothing here assumes the reader can already read it.
 *
 * ## Coverage-sweep material folded in (docs/COVERAGE-SWEEP.md § intermediate/di-providers)
 *
 * - `provideX()` / `makeEnvironmentProviders()` — the pattern behind every
 *   modern `provideRouter()`/`provideHttpClient()`-shaped API.
 * - `providedIn: 'any'` and `'platform'`, previously unmentioned here.
 * - `useFactory`'s modern deps-free `inject()` form, next to the classic
 *   `deps` array and the positional footgun that array carries.
 * - `provideAppInitializer()` / `APP_INITIALIZER` / `ENVIRONMENT_INITIALIZER`.
 * - `useExisting` proven live against `useClass`, not just asserted.
 *
 * Multi providers, the resolution modifiers, `viewProviders` and `forwardRef`
 * stay — this lesson introduces them; `di-advanced` (next in this track) goes
 * deeper with a live self/skipSelf/host playground and its own worked
 * `forwardRef` example, so this page keeps those sections tight and links
 * onward rather than re-building the same live proof twice.
 */
@Component({
  selector: 'app-lesson-di-providers',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
  ],
  // Component-level providers — these win over root providers for this subtree.
  providers: [
    { provide: Notifier, useClass: EmailNotifier },
    { provide: PLUGINS, useValue: 'spellcheck', multi: true },
    { provide: PLUGINS, useValue: 'autosave', multi: true },
    { provide: PLUGINS, useValue: 'analytics', multi: true },
    AppLogger,
    { provide: LoggerBase, useExisting: AppLogger },
    { provide: CLONED_LOGGER, useClass: AppLogger },
  ],
  templateUrl: './di-providers.html',
  styleUrl: './di-providers.css',
})
export class DiProviders {
  // ── Live bench 1: useClass ──────────────────────────────────────────────

  /**
   * The config object, from a token whose default comes from its own factory —
   * so it resolves even with no provider anywhere.
   */
  protected readonly config = inject(APP_CONFIG);
  /**
   * The notifier. Declared as the abstract type; resolved to `EmailNotifier` by
   * this component's own `providers`.
   */
  private readonly notifier = inject(Notifier);
  /** The last notification sent. */
  protected readonly out = signal('');
  /** Everything registered under the multi-provider token, as one array. */
  protected readonly plugins = inject(PLUGINS);

  /** Sends a notification through whichever implementation DI supplied. */
  protected notify(): void {
    this.out.set(this.notifier.send('Build passed'));
  }

  // ── Live bench 2: useExisting vs useClass ───────────────────────────────

  /** The concrete class, injected by itself. Every counter below traces back to this one object — or doesn't. */
  protected readonly appLogger = inject(AppLogger);
  /**
   * `LoggerBase`, resolved via `useExisting: AppLogger` — should be the identical object as
   * {@link appLogger}. Injecting against the abstract type is the whole point (that is what
   * lets a consumer depend on `LoggerBase` without knowing `AppLogger` exists), but this demo
   * also needs to read `.calls` for its live counter — a field the abstraction deliberately
   * does not declare. The cast is safe only because the providers below guarantee this token
   * always resolves to an `AppLogger`; it is not a general licence to assume more than a type
   * promises.
   */
  protected readonly aliasedLogger = inject(LoggerBase) as AppLogger;
  /** `CLONED_LOGGER`, resolved via `useClass: AppLogger` — a second, independent instance. Same cast, same reason. */
  protected readonly clonedLogger = inject(CLONED_LOGGER) as AppLogger;
  /** What the last button press actually logged. */
  protected readonly lastLog = signal('');

  /** Logs through the concrete class directly. */
  protected logDirect(): void {
    this.lastLog.set(this.appLogger.log('via AppLogger, directly'));
  }
  /** Logs through the alias — proves it shares state with {@link appLogger}. */
  protected logAlias(): void {
    this.lastLog.set(this.aliasedLogger.log('via LoggerBase (useExisting)'));
  }
  /** Logs through the clone — proves it does NOT share state. */
  protected logClone(): void {
    this.lastLog.set(this.clonedLogger.log('via CLONED_LOGGER (useClass)'));
  }

  // ── Presentation data ────────────────────────────────────────────────────

  /** The Dependency Injection track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Services & DI', id: 'services-di' },
    { label: 'DI Providers' },
    { label: 'Advanced DI', id: 'di-advanced' },
  ];

  /**
   * "You" asking an injector for an abstract token, and finding out what a
   * provider actually is in the process.
   *
   * This exchange exists because "a provider maps a token to a recipe" is
   * true and instantly forgettable as a sentence. Staged as the injector
   * explaining itself, it also plants the NullInjectorError payoff the
   * pitfalls section returns to later — the reader meets the error's shape
   * once, in plain English, before ever seeing it in a stack trace.
   */
  protected readonly providerTalk: BubbleTurn[] = [
    { who: 'You', says: '`inject(Notifier)` — give me one.' },
    {
      who: 'The injector',
      says: '`Notifier` is abstract. I have no idea how to build one of those on my own.',
    },
    { who: 'You', says: 'Then how does this page work at all?' },
    {
      who: 'The injector',
      says: 'Because somewhere above you, a `providers` array told me: when anyone asks for `Notifier`, build an `EmailNotifier` instead. I never construct a **token** — I follow whatever recipe was registered against it.',
    },
    { who: 'You', says: 'And if nobody registered one?' },
    {
      who: 'The injector',
      says: "Then I ask my parent injector the exact same question. If nobody, all the way up to the root, has an answer... `NullInjectorError`, with your token's name right there in the message.",
    },
  ];

  /**
   * Sample: the four provider recipes — `useClass`, `useValue`, `useFactory`,
   * `useExisting`.
   */
  protected readonly recipesSample = `{ provide: Logger, useClass: FancyLogger }         // construct this class
{ provide: API_URL, useValue: '/api' }             // use this literal value
{ provide: Store, useFactory: makeStore, deps: [Http] } // call a function
{ provide: OldToken, useExisting: NewToken }       // alias to another token`;

  /** Line-by-line walkthrough of {@link recipesSample}. */
  protected readonly recipesNotes: CodeNote[] = [
    {
      line: 1,
      text: "`provide: Logger` says **which token** this entry answers for. `useClass: FancyLogger` says how: construct one, calling `new FancyLogger(...)` — resolving FancyLogger's own constructor dependencies first, exactly like `providedIn` would.",
    },
    {
      line: 2,
      text: '`useValue` skips construction entirely. Whatever you write on the right is handed back **as-is**, every time — the only recipe that works for a plain string, number or object with no class behind it at all.',
    },
    {
      line: 3,
      text: '`useFactory` calls `makeStore` as an ordinary function and uses whatever it **returns**. `deps: [Http]` says what to inject and pass in as arguments, in order — see the `useFactory` section below for why that array is riskier than it looks.',
    },
    {
      line: 4,
      text: '`useExisting` builds **nothing new**. It resolves `NewToken` first, through whatever recipe answers for it, and hands that **same object** back for `OldToken` too — an alias, not a duplicate. Compare it with `useClass: NewToken`, which would build a second, independent copy.',
    },
  ];

  /**
   * Sample: `InjectionToken` with a default factory, for dependencies that are
   * not classes.
   */
  protected readonly tokenSample = `const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiUrl: '/api', retries: 3 }),
});

const config = inject(APP_CONFIG);   // typed AppConfig, no cast`;

  /** Line-by-line walkthrough of {@link tokenSample}. */
  protected readonly tokenNotes: CodeNote[] = [
    {
      line: 1,
      text: "`InjectionToken<AppConfig>` ties the token to a TS type at compile time, so `inject(APP_CONFIG)` comes back typed as `AppConfig` with no cast. The string `'APP_CONFIG'` is only a **debug label** printed in error messages — the token's identity is the object itself, not this string.",
    },
    {
      line: 2,
      text: '`factory` is a fallback recipe baked into the token. It runs only if **nothing else** provides `APP_CONFIG` **and** something actually injects it — which is what makes this **tree-shakable**: a token nobody ever asks for is dropped from the bundle, factory included.',
    },
    {
      line: 5,
      text: '`inject(APP_CONFIG)` — the identical call you would use for a class-based service. The token being an object rather than a class is invisible at the call site, which is the whole point of `InjectionToken`.',
    },
  ];

  /**
   * Sample: classic `useFactory`, with a positional `deps` array.
   */
  protected readonly factoryClassicSample = `{ provide: Store, useFactory: (http: HttpClient, cfg: AppConfig) =>
    new Store(http, cfg.apiUrl),
  deps: [HttpClient, APP_CONFIG] }`;

  /**
   * Sample: modern `useFactory`, calling `inject()` inside the factory itself
   * instead of declaring `deps`.
   */
  protected readonly factoryModernSample = `{ provide: Store, useFactory: () =>
    new Store(inject(HttpClient), inject(APP_CONFIG).apiUrl) }`;

  /**
   * Sample behind the `deps`-reorder trap: identical factory, `deps` swapped.
   */
  protected readonly factorySwapSample = `{ provide: Store, useFactory: (http: HttpClient, cfg: AppConfig) =>
    new Store(http, cfg.apiUrl),
  deps: [APP_CONFIG, HttpClient] }        // ← swapped; the factory above was never touched`;

  /**
   * Sample: the providers behind the `useExisting`-vs-`useClass` live bench —
   * the exact array declared on this component, annotated.
   */
  protected readonly loggerProvidersSample = `providers: [
  AppLogger,                                        // construct the concrete class itself
  { provide: LoggerBase, useExisting: AppLogger },  // ALIAS — same instance, new name
  { provide: CLONED_LOGGER, useClass: AppLogger },  // CLONE — a second, separate instance
],

appLogger = inject(AppLogger);
aliasedLogger = inject(LoggerBase);       // === appLogger
clonedLogger = inject(CLONED_LOGGER);     // !== appLogger`;

  /** Line-by-line walkthrough of {@link loggerProvidersSample}. */
  protected readonly loggerProvidersNotes: CodeNote[] = [
    {
      line: 2,
      text: 'A bare class in a `providers` array is shorthand for `{ provide: AppLogger, useClass: AppLogger }` — Angular constructs exactly one `AppLogger` and files it under its own class as the token.',
    },
    {
      line: 3,
      text: '`useExisting: AppLogger` builds **nothing**. It says: when something asks for `LoggerBase`, resolve `AppLogger` — the recipe on line 2 — and hand back **that same object**.',
    },
    {
      line: 4,
      text: '`useClass: AppLogger` builds a **second, brand-new** `AppLogger` under a different token. Same blueprint, same class — but nothing connects this instance to the one on line 2. From here they are just two unrelated objects that happen to share a type.',
    },
    {
      line: 8,
      text: 'Two different tokens, `AppLogger` and `LoggerBase`, resolving to **one object**. This is exactly what `aliasedLogger === appLogger` reading `true` on the bench below means.',
    },
    {
      line: 9,
      text: 'A third token, `CLONED_LOGGER`, with its **own** independent `.calls` counter — which is exactly why the bench below shows it drifting apart from the other two.',
    },
  ];

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
   * Sample: `provideAppInitializer()`, what it replaces, and its
   * non-blocking sibling `ENVIRONMENT_INITIALIZER` — `multi: true` doing a
   * second job.
   */
  protected readonly appInitSample = `// modern (Angular 19+) — one function, runs during bootstrap:
providers: [
  provideAppInitializer(() => inject(ConfigService).load()),
],

// what that replaces:
providers: [
  {
    provide: APP_INITIALIZER,
    useFactory: (cfg: ConfigService) => () => cfg.load(),
    deps: [ConfigService],
    multi: true,
  },
],

// ENVIRONMENT_INITIALIZER — fires eagerly, does NOT block bootstrap:
providers: [
  { provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(Analytics).installListeners(), multi: true },
],`;

  /** Line-by-line walkthrough of {@link appInitSample}. */
  protected readonly appInitNotes: CodeNote[] = [
    {
      line: 3,
      text: '`provideAppInitializer(fn)` — `fn` runs during bootstrap. Return a `Promise` or `Observable` and Angular **waits** for it to settle before finishing bootstrap; throw or reject and bootstrap **aborts** entirely.',
    },
    {
      line: 10,
      text: "`useFactory` here doesn't return the loaded config — it returns **another function**, `() => cfg.load()`, and that inner function is what `APP_INITIALIZER` actually calls. That extra layer of arrows is exactly the boilerplate `provideAppInitializer()` removes.",
    },
    {
      line: 12,
      text: '`multi: true` — there can be several initializers registered across an app. All of them run, and bootstrap waits for **every one** before the application is considered ready.',
    },
    {
      line: 18,
      text: '`ENVIRONMENT_INITIALIZER` runs the moment the environment injector that provides it is constructed. Nothing awaits it and it does not delay rendering — reach for it for "start listening" work, and for `APP_INITIALIZER` only when the app genuinely should not render before this finishes.',
    },
  ];

  /**
   * Sample: the `provideX()` / `makeEnvironmentProviders()` pattern behind
   * every modern `provideRouter()` / `provideHttpClient()`-shaped API.
   */
  protected readonly provideXSample = `export interface AnalyticsConfig {
  key: string;
}
const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG');

export function provideAnalytics(cfg: AnalyticsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    AnalyticsService,
    { provide: ANALYTICS_CONFIG, useValue: cfg },
  ]);
}

// bootstrap.ts
bootstrapApplication(App, {
  providers: [provideAnalytics({ key: 'prod-9f2' })],
});`;

  /** Line-by-line walkthrough of {@link provideXSample}. */
  protected readonly provideXNotes: CodeNote[] = [
    {
      line: 4,
      text: '`ANALYTICS_CONFIG` — the same `InjectionToken` pattern as `APP_CONFIG` earlier on this page, just scoped to one feature instead of the whole app.',
    },
    {
      line: 6,
      text: "`: EnvironmentProviders` is the return type, and it's deliberate. It is an **opaque wrapper**, not `Provider[]` — see the warning below for what that buys you.",
    },
    {
      line: 7,
      text: '`makeEnvironmentProviders([...])` takes an ordinary array of providers — exactly what you would write inline in a `providers` array — and wraps it in that opaque type. Nothing runs yet; this only **packages** the array.',
    },
    {
      line: 8,
      text: '`AnalyticsService` bare, same as line 2 of the `useExisting` sample above: shorthand for `{ provide: AnalyticsService, useClass: AnalyticsService }`.',
    },
    {
      line: 9,
      text: '`ANALYTICS_CONFIG` now resolves to whichever `cfg` object was passed to `provideAnalytics(...)` at the call site below — each call can configure it differently.',
    },
    {
      line: 15,
      text: "`provideAnalytics({ key: 'prod-9f2' })` — called once, at the app's own bootstrap, returning the packaged `EnvironmentProviders` that `providers` unwraps and installs into the **root environment injector**.",
    },
  ];

  /**
   * Sample: the injector hierarchy, and the order resolution walks it —
   * kept here as a compact reference alongside the {@link Layers} diagram.
   */
  protected readonly hierarchySample = `platform injector
  └─ root environment injector        // providedIn: 'root', bootstrap providers
       └─ route environment injector  // route providers: [...]
            └─ element injector        // component providers: [...]  ← inject() starts here
// inject(Token) walks OUTWARD through this chain; the first provider found wins.`;

  /**
   * Sample: the resolution modifiers — `optional`, `self`, `skipSelf`.
   */
  protected readonly modifiersSample = `theme = inject(THEME, { optional: true }) ?? 'light';   // null-safe default
own   = inject(PanelState, { self: true });             // only THIS injector
parent = inject(FormGroup, { skipSelf: true });         // the parent's instance`;

  /**
   * Self-test 1 — `providedIn: 'any'` against lazy-loaded routes.
   *
   * The distractors are the three stories people tell themselves about `any`:
   * that it behaves like `root`, that sibling lazy routes somehow share one
   * instance, and that it needs an explicit provider entry somewhere. Each
   * `why` names the specific belief instead of only restating the count.
   */
  protected readonly providedAnyQuiz: QuizOption[] = [
    {
      text: "One — `'any'` still means one shared instance app-wide, same as `'root'`.",
      why: "That's what `'root'` means. `'any'` exists specifically to opt **out** of that: every environment injector that doesn't already have a path to an existing instance builds its own the first time it's asked.",
    },
    {
      text: 'Three — one at the root, and one per lazy route, because each lazy-loaded module gets its own environment injector.',
      correct: true,
      why: "Correct. The eager root route creates one instance in the root environment injector. Each of the two lazy routes gets a **separate environment injector** when its chunk loads, and `'any'` builds a fresh instance the first time **that** injector is asked — three instances behind what looks like one `@Injectable()`.",
    },
    {
      text: 'Two — the two lazy routes share one instance, separate from the root one.',
      why: "Lazy routes don't share with each other just because they're both lazy. Each lazy-loaded module gets its **own, independent** environment injector — there is no sibling channel between them.",
    },
    {
      text: "Zero — `providedIn: 'any'` needs an explicit provider entry somewhere, or nothing is ever constructed.",
      why: "`'any'` is a `providedIn` value, exactly like `'root'` — it already tells Angular how to build the service tree-shakably. No `providers` entry is needed anywhere; the only difference from `'root'` is **how many** instances that self-sufficiency produces.",
    },
  ];

  /**
   * Self-test 2 — the classic "I added it to `providers` just to be safe" bug.
   *
   * The `why` on the correct option is doing the real work here — this is the
   * "why is my state not shared?" trap the pitfalls list below promises, made
   * concrete with an actual scenario instead of left as a warning.
   */
  protected readonly duplicateProviderQuiz: QuizOption[] = [
    {
      text: "Nothing changes — Angular notices it's already provided at root and ignores the duplicate.",
      why: "Angular doesn't deduplicate across scopes like that. Listing a class in a component's `providers` is a real, independent registration every time — it always creates a second recipe, local to that subtree.",
    },
    {
      text: 'That component and everything inside it now get a separate instance — a second one, disconnected from the root singleton.',
      correct: true,
      why: '"Why is my state not shared?" The root instance still exists and is still handed to everyone else in the app; only this one subtree quietly forked its own copy, because a component-level provider always wins over root for the component that lists it.',
    },
    {
      text: "It throws at bootstrap — a service can't legally be provided in two places.",
      why: "Nothing stops this syntactically or at runtime. Each injector only tracks its own recipe list, which is exactly the mechanism that lets a legitimate subtree override — like this very lesson's own `Notifier` — work at all.",
    },
    {
      text: "The component's instance replaces the root one for the whole app.",
      why: "A component provider is scoped to that component's own element injector and its descendants — it has no reach upward or sideways. The root injector's instance is completely unaffected outside this one subtree.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If `useExisting` aliases to the same instance, why not just inject the concrete class everywhere and skip the abstraction?',
      a: 'Because the token is often the only thing every consumer is allowed to depend on. `useExisting` lets you keep injecting the abstract `LoggerBase` throughout your code while swapping which concrete class answers for it in one place — a test module, a different environment, a later refactor. Inject the concrete class directly and every one of those call sites has to change instead.',
    },
    {
      q: 'Does the function inside `useFactory` run every time something injects the token?',
      a: 'No — once. A provider is constructed the first time its token is requested from a given injector, and the result is cached on that injector forever after. A hundred components injecting the same factory-provided token all get the **one** object the factory returned the very first time.',
    },
    {
      q: 'Why does `makeEnvironmentProviders()` need its own return type instead of just returning `Provider[]`?',
      a: "So the mistake is caught before the app runs. `EnvironmentProviders` is a distinct, opaque type — not structurally compatible with `Provider[]` — so passing one to a `@Component`'s `providers` array is a **compile error**, not a confusing runtime failure three files away. The rule that these providers only make sense at the app or route level is enforced by the type checker, not by a comment.",
    },
    {
      q: "What's the real difference between `providedIn: 'any'` and just putting a provider in one route's own `providers` array?",
      a: "Scope of the decision. A route's `providers` array is one specific choice, made once, for that one route tree. `providedIn: 'any'` is a standing rule on the **service itself** — every environment injector that doesn't already have access to an instance builds its own automatically, for every route that lazy-loads, with nobody having to remember to list it anywhere.",
    },
    {
      q: 'Do I even need `deps` if I write `inject()` inside `useFactory`?',
      a: "No — and that's the whole appeal. `inject()` works inside a factory function because Angular runs it in an injection context, so the factory just asks for what it needs instead of declaring it positionally in a separate array. `deps` still works and you'll see it in older code, but new code has no reason to reach for it.",
    },
  ];
}
