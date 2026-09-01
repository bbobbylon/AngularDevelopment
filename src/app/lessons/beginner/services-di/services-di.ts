import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { CartService, CounterService, LifecycleLog } from './services-di.shared';
import { CartIndicator } from './cart-indicator/cart-indicator';
import { CounterWidget } from './counter-widget/counter-widget';

/**
 * Lesson: Services & Dependency Injection — sharing logic and state between
 * components without passing it through them, and without any component
 * ever calling `new` on its own dependencies.
 *
 * Covers `@Injectable`, `inject()` against constructor injection, injection
 * contexts, the injector hierarchy (element, component, route and root/
 * environment), `InjectionToken`, service teardown, and circular
 * dependencies.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), following the teaching order set out in
 * `expert/change-detection`: pose the problem before naming it, give the
 * reader an analogy to hang the vocabulary on, then teach the same idea
 * across several modes — a diagram, a dialogue, live code, and a demo the
 * reader operates themselves.
 *
 * The page is still built around the one contrast the previous version used,
 * shown live rather than described:
 *
 * - {@link CartService} is `providedIn: 'root'` — **one instance**, shared by
 *   every component that injects it. Add an item anywhere and every indicator
 *   on the page updates.
 * - {@link CounterService} is listed in a component's `providers` — **one
 *   instance per component**. Two widgets side by side count independently.
 *
 * That single choice is most of what people get wrong about DI, and seeing
 * both behaviours on one screen settles it faster than any explanation of
 * the injector tree — which the lesson then goes on to give, plus the
 * material a coverage sweep found missing from the previous version: route-
 * scoped providers, when (and whether) a service's `ngOnDestroy` actually
 * runs, `inject()` in a base class, and the circular-dependency error two
 * services can produce.
 */
@Component({
  selector: 'app-lesson-services-di',
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
    CartIndicator,
    CounterWidget,
  ],
  styleUrl: './services-di.css',
  templateUrl: './services-di.html',
})
export class ServicesDi {
  /**
   * The shared cart, the same instance the indicator components see.
   */
  protected readonly cart = inject(CartService);
  /**
   * Products that can be added, for the demo.
   */
  protected readonly products = ['☕ Coffee', '🍩 Donut', '🥪 Sandwich'];
  /**
   * Whether the third, dynamically-added counter widget is on the page —
   * drives the "Service teardown" demo. Adding it creates a fresh
   * `CounterService`; removing it destroys the widget's element injector,
   * which is what makes `ngOnDestroy` fire.
   */
  protected readonly showWidgetC = signal(false);
  /**
   * The shared teardown log, read directly by the template so the reader can
   * watch entries appear the instant they happen.
   */
  protected readonly lifecycleLog = inject(LifecycleLog);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Dependency Injection track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Services & DI' },
    { label: 'DI Providers', id: 'di-providers' },
    { label: 'Advanced DI', id: 'di-advanced' },
  ];

  /**
   * Sample: defining a service with `@Injectable({ providedIn: 'root' })`.
   */
  protected readonly serviceDefinitionSample = `// @Injectable marks the class as something the injector can build.
// providedIn: 'root' does two jobs at once: it registers the service on the
// root injector, AND it makes the class tree-shakable — never inject it and
// the bundler drops it entirely.
@Injectable({ providedIn: 'root' })
export class CartService {
  // private: nothing outside this class can call .set() or .update().
  private readonly items = signal<string[]>([]);
  // Derived, so the count can never disagree with the list. It recomputes
  // itself; no code anywhere has to remember to keep it in sync.
  readonly count = computed(() => this.items().length);
  // The public read handle. Same signal, minus the write methods, so
  // components can display the items but cannot reach in and change them.
  readonly list = this.items.asReadonly();

  // The three writers below are the ENTIRE surface for changing the cart.
  add(item: string) {
    // Spread into a new array — a new reference is what makes the signal
    // notify its consumers. items().push(item) would change nothing on screen.
    this.items.update(i => [...i, item]);
  }
  remove(index: number) {
    // filter() already returns a new array. The \`_\` names the unused element,
    // since only the index matters here.
    this.items.update(i => i.filter((_, idx) => idx !== index));
  }
  clear() {
    // set() replaces the value outright; update() is for deriving the next
    // value from the current one. Use whichever says what you mean.
    this.items.set([]);
  }
}`;

  /** Line-by-line walkthrough of {@link serviceDefinitionSample}. */
  protected readonly serviceDefinitionNotes: CodeNote[] = [
    {
      line: 5,
      text: "`@Injectable({ providedIn: 'root' })` — the decorator marks the class as DI-eligible; the object argument is a provider recipe, and `'root'` names which injector owns it. Together they register **and** build lazily: nothing is constructed until the first `inject(CartService)` anywhere in the app.",
    },
    {
      line: 8,
      text: '`private` — visible only inside this class, so nothing outside can call `.set()`/`.update()` on `items` directly. `signal<string[]>([])` is a writable signal typed to hold a string array, starting empty.',
    },
    {
      line: 11,
      text: '`computed(() => …)` — a derived, cached signal, not a getter. `this.items().length` is read when the computed runs; Angular remembers that it read `items`, so a future `items` write invalidates this cache automatically.',
    },
    {
      line: 14,
      text: "`this.items.asReadonly()` — returns a signal that shares `items`'s current value but strips `set`/`update`. Consumers get the array without a back door to mutate the service's own state.",
    },
    {
      line: 20,
      text: '`.update(i => [...i, item])` — `i` is the current array; `[...i, item]` spreads it into a **brand-new** array with `item` appended. That new reference is what a signal actually compares to decide something changed.',
    },
    {
      line: 25,
      text: '`.filter((_, idx) => idx !== index)` — `filter` already returns a new array, so no spread is needed here. `_` is a throwaway name for the array element, since only its position (`idx`) is being tested.',
    },
  ];

  /** Sample: `inject()`, the modern style — half of the equivalence Compare. */
  protected readonly injectModernSample = `// Modern style — the inject() function
export class ProductList {
  private cart = inject(CartService);       // resolved once, at construction
  addToCart(p: string) { this.cart.add(p); }
}`;

  /** Sample: constructor parameter injection — the classic style. */
  protected readonly injectClassicSample = `// Classic style — constructor parameter injection
export class ProductList {
  constructor(private cart: CartService) {} // Angular supplies the argument
  addToCart(p: string) { this.cart.add(p); }
}`;

  /** Sample: the one place constructor injection and `inject()` are NOT interchangeable — inheritance, wrong side. */
  protected readonly baseClassWrongSample = `// WRONG-ISH — constructor injection through an abstract base
export abstract class BaseList {
  constructor(
    protected http: HttpClient,
    protected route: ActivatedRoute,
  ) {}
}

export class ProductList extends BaseList {
  // Every subclass must repeat the exact same parameter list AND forward it —
  // miss super(http, route) and the base class's fields are never set.
  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }
}`;

  /** Sample: the same inheritance case, right side — field-initializer `inject()`. */
  protected readonly baseClassRightSample = `// RIGHT — field-initializer inject() in the base class
export abstract class BaseList {
  protected http = inject(HttpClient);
  protected route = inject(ActivatedRoute);
}

export class ProductList extends BaseList {
  // Nothing to repeat, nothing to forward, nothing to get wrong.
  // ProductList doesn't need a constructor at all.
}`;

  /**
   * Sample: a consumer of the root-provided service.
   */
  protected readonly cartIndicatorSample = `@Component({
  selector: 'app-cart-indicator',
  // Reads cart.count() straight from the injected service. No @Input, no
  // event wiring — and no matter where this component sits in the tree, it
  // sees the same numbers as every other consumer of CartService.
  template: '<span class="pill">🛒 cart: {{ cart.count() }} item(s)</span>',
})
export class CartIndicator {
  // protected = visible to this class's TEMPLATE, invisible to other classes.
  // (private would work at runtime but the template type-checker rejects it.)
  // Note there is no providers array here: this component finds CartService
  // by walking up to the root injector, where providedIn: 'root' put it.
  protected readonly cart = inject(CartService);
}`;

  /** Line-by-line walkthrough of {@link cartIndicatorSample}. */
  protected readonly cartIndicatorNotes: CodeNote[] = [
    {
      line: 6,
      text: '`{{ cart.count() }}` inside the template — reading the computed signal here registers this view as one of its consumers, so a future `add`/`remove`/`clear` anywhere re-renders exactly this span.',
    },
    {
      line: 8,
      text: '`export class CartIndicator` — no constructor, no `providers` array. Every dependency this component needs is declared as a field below.',
    },
    {
      line: 13,
      text: '`protected readonly cart = inject(CartService)` — `protected` so the template above can read `cart`; `readonly` because nothing should ever reassign the field. `inject(CartService)` runs once, during construction.',
    },
  ];

  /**
   * The self-test for the root-singleton demo. The distractors are the two
   * mistakes people make about a shared service: that a fresh component
   * starts from zero, and that injecting an already-injected class is a
   * conflict rather than the normal case.
   */
  protected readonly cartQuizOptions: QuizOption[] = [
    {
      text: 'It shows 0 — a brand-new component always starts from zero.',
      why: "That's true for a component's *own* fields, but `cart` isn't one — it's a reference to the one shared `CartService` instance. The indicator shows whatever that instance currently holds, never zero just because the badge is new.",
    },
    {
      text: 'It shows whatever the shared cart currently holds — the same number as the other two.',
      correct: true,
      why: "Right. `inject(CartService)` with no local `providers` array walks to the same root injector every previous consumer reached, and gets back the same cached object. There's only ever one cart to report on.",
    },
    {
      text: "It throws, because CartService is already 'in use' by the other two indicators.",
      why: "Services aren't a resource you can run out of. `providedIn: 'root'` means every request past the first returns the same cached object — injecting an already-injected singleton is the normal case, not a conflict.",
    },
  ];

  /**
   * The tree walk that resolves `inject(CartService)` from inside
   * `<app-cart-indicator>` — dramatised as the request it actually is.
   */
  protected readonly injectorTalk: BubbleTurn[] = [
    { who: 'The component', says: '`inject(CartService)` — where do I look first?' },
    {
      who: "This component's own injector",
      says: 'Nothing registered for CartService here. Try my parent.',
    },
    { who: 'Every ancestor in between', says: 'Nothing here either. Keep going up.' },
    {
      who: 'The root injector',
      says: "Found it — `providedIn: 'root'` put it here. First request ever? I'll build one now and cache it.",
    },
    {
      who: 'The component',
      says: 'Got it. Every other component that ever asks — from anywhere — gets this exact same object back.',
    },
  ];

  /**
   * Sample: a component-provided service, and the per-instance behaviour it gives.
   */
  protected readonly counterWidgetSample = `// No providedIn. The class is injectABLE but not yet registered anywhere —
// inject it without a provider in scope and you get NullInjectorError.
@Injectable()
export class CounterService {
  readonly count = signal(0);
  increment() { this.count.update(c => c + 1); }
  reset() { this.count.set(0); }
}

@Component({
  selector: 'app-counter-widget',
  // ← THE ONE LINE THAT CHANGES EVERYTHING. Each instance of CounterWidget
  // gets its OWN element injector, and this array registers CounterService
  // on it. Put three widgets on a page and you get three counters, each
  // counting independently — nothing is shared.
  providers: [CounterService],
  template: '<span>{{ counter.count() }}</span>',
})
export class CounterWidget {
  // Identical call to the root case. inject() looks the same either way; the
  // provider location alone decides whether you get a shared singleton or a
  // per-instance object. That is the whole idea worth carrying away.
  protected readonly counter = inject(CounterService);
}`;

  /** Line-by-line walkthrough of {@link counterWidgetSample}. */
  protected readonly counterWidgetNotes: CodeNote[] = [
    {
      line: 3,
      text: '`@Injectable()` with **no** `providedIn` argument — the class is DI-eligible but registers no provider anywhere on its own. Something else has to list it.',
    },
    {
      line: 16,
      text: '`providers: [CounterService]` inside `@Component` — creates a brand-new element injector for *this* component and stocks it with its own `CounterService`. This is the entire difference from `CartService`.',
    },
    {
      line: 23,
      text: "`inject(CounterService)` — the exact same call as `inject(CartService)` in the last demo. It finds an entry on the very first injector it checks (this component's own), so the walk stops immediately and never reaches an ancestor.",
    },
  ];

  /**
   * Sample: a route with its own `providers` — the third scope, alongside
   * root and component.
   */
  protected readonly routeProvidersSample = `export const routes: Routes = [
  {
    path: 'checkout',
    // Creates an environment injector, owned by this route activation.
    providers: [CheckoutStore],
    loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout),
  },
];`;

  /** Line-by-line walkthrough of {@link routeProvidersSample}. */
  protected readonly routeProvidersNotes: CodeNote[] = [
    {
      line: 1,
      text: '`Routes` — the array type the router configures itself from. This is the same shape as the app-wide route table, just for one lazy feature.',
    },
    {
      line: 5,
      text: "`providers: [CheckoutStore]` on a `Route` — the standalone-app replacement for a lazy `NgModule`'s own injector. It creates a fresh **environment injector**, not an element injector, scoped to this route.",
    },
    {
      line: 6,
      text: '`loadComponent` — lazy-loads the component only when this route activates. The provider above already exists before that component, or anything inside it, ever asks for `CheckoutStore`.',
    },
  ];

  /**
   * Sample: `CounterService`, extended with a fake "held resource" and the
   * `OnDestroy` hook that releases it — what the teardown demo below is
   * actually running.
   */
  protected readonly counterServiceTeardownSample = `@Injectable()
export class CounterService implements OnDestroy {
  private readonly log = inject(LifecycleLog);
  readonly count = signal(0);
  // Stands in for a resource a real service might hold open — a socket, a
  // poll, a subscription. It ticks every 400ms so you can watch it run...
  readonly heartbeat = signal(0);
  private readonly timer = setInterval(() => this.heartbeat.update((h) => h + 1), 400);

  constructor() {
    this.log.record('CounterService: created');
  }

  increment() { this.count.update((c) => c + 1); }
  reset() { this.count.set(0); }

  // ...and stop, the moment this instance's owner is destroyed.
  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.log.record('CounterService: destroyed — heartbeat cleared');
  }
}`;

  /** Line-by-line walkthrough of {@link counterServiceTeardownSample}. */
  protected readonly counterServiceTeardownNotes: CodeNote[] = [
    {
      line: 2,
      text: "`implements OnDestroy` — a lifecycle interface Angular's injector honours for **any** injectable, not just components. `ngOnDestroy` (below) is the method it looks for.",
    },
    {
      line: 3,
      text: "`inject(LifecycleLog)` — one service injecting another. `inject()` works identically no matter what kind of class calls it; `LifecycleLog` is `providedIn: 'root'`, so every `CounterService` instance, however many exist, writes to the same log.",
    },
    {
      line: 8,
      text: "`setInterval(...)` runs immediately, at construction, and keeps firing on its own schedule until something clears it. Creating a service doesn't pause a timer it starts.",
    },
    {
      line: 18,
      text: "`ngOnDestroy()` — called once, when the injector owning this instance is itself destroyed. For a component-provided service, that's the moment the component is removed.",
    },
    {
      line: 19,
      text: '`clearInterval(this.timer)` — without this line the interval fires forever, invisibly, on an object nothing can reach any more. This is the actual leak the interface exists to prevent.',
    },
  ];

  /** Sample: calling `inject()` outside an injection context — the WRONG half. */
  protected readonly injectionContextWrongSample = `// WRONG — inject() called from inside a method, after construction
export class ProductList {
  private cart!: CartService;
  addToCart(p: string) {
    this.cart = inject(CartService);   // ✗ NG0203: not an injection context
    this.cart.add(p);
  }
}`;

  /** Sample: capturing the dependency as a field instead — the RIGHT half. */
  protected readonly injectionContextRightSample = `// RIGHT — capture the dependency as a field, during construction
export class ProductList {
  private cart = inject(CartService);  // ✓ field initializer = injection context
  addToCart(p: string) { this.cart.add(p); }
}`;

  /**
   * Sample: two services that need each other — `NG0200`, and the two ways
   * out.
   */
  protected readonly circularDepSample = `@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);   // needs ApiService to refresh a token
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private auth = inject(AuthService); // needs AuthService to attach a token
}

// Whichever one gets built first, building it needs the other one built —
// which needs the first one again, before it has even finished.
// → NG0200: Circular dependency in DI detected for ApiService`;

  /** Line-by-line walkthrough of {@link circularDepSample}. */
  protected readonly circularDepNotes: CodeNote[] = [
    {
      line: 3,
      text: '`inject(ApiService)` inside a field initializer — this runs while `AuthService` is still under construction, before its own constructor body has finished.',
    },
    {
      line: 8,
      text: '`inject(AuthService)` — the same situation, in the other direction. Neither class can finish being built without the other already existing.',
    },
    {
      line: 13,
      text: '`NG0200` — Angular detects the loop instead of recursing forever, and names whichever service it was in the middle of building when the cycle closed.',
    },
  ];

  /**
   * Sample: `InjectionToken`, for injecting a config value or anything else that
   * is not a class.
   */
  protected readonly injectionTokenSample = `// A dependency that ISN'T a class — e.g. a plain config value
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// Give it a value where you configure providers (e.g. app.config.ts)
providers: [
  { provide: API_BASE_URL, useValue: 'https://api.example.com' },
]

// Inject it exactly like a class dependency
export class ApiService {
  private baseUrl = inject(API_BASE_URL);
}`;

  /** Line-by-line walkthrough of {@link injectionTokenSample}. */
  protected readonly injectionTokenNotes: CodeNote[] = [
    {
      line: 2,
      text: "`new InjectionToken<string>('API_BASE_URL')` — a unique, type-safe DI lookup key for a value that isn't a class. The string argument is only a debug label; the token's real identity is the object itself.",
    },
    {
      line: 6,
      text: "`{ provide: API_BASE_URL, useValue: '...' }` — a provider recipe spelled out explicitly: when something asks for this token, hand back this value. The **DI Providers** lesson covers the other recipes this same shape supports — `useFactory`, `useClass`, `useExisting`.",
    },
    {
      line: 11,
      text: '`inject(API_BASE_URL)` — identical call shape to injecting a class. Same walk, same injection-context rule, just a different kind of key.',
    },
  ];

  /**
   * The self-test for shadowing — the single most-tested DI trap, and the
   * one the exam pitfalls below used to only describe in prose.
   */
  protected readonly shadowingQuizOptions: QuizOption[] = [
    {
      text: "The subtree's own local instance — a second, separate CartService, not the root one.",
      correct: true,
      why: "Right — `providers: [CartService]` doesn't add a second root registration, it creates a completely new instance scoped to that subtree. The walk finds it on the very first injector it checks and stops there. The root instance still exists; nothing inside this subtree can reach it any more.",
    },
    {
      text: "The root singleton — providedIn: 'root' always wins.",
      why: 'Backwards. The walk starts at the nearest injector and stops at the first match, which is exactly why a local `providers` array is powerful enough to shadow root in the first place.',
    },
    {
      text: "A NullInjectorError — you can't provide a service twice.",
      why: "There's nothing illegal about registering the same class at two levels. It isn't an error; it's exactly what 'shadowing' means — two live instances of the same class, resolved differently depending on where you ask from.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I need @Injectable() on every service, even ones with no dependencies of their own?',
      a: "Yes, if you ever plan to `inject()` it or list it in a `providers` array. The decorator is what attaches the metadata Angular's compiler needs to construct the class through DI — a plain undecorated class can still be built with `new`, just never handed out by an injector.",
    },
    {
      q: "Is providedIn: 'root' instant, or does it build the service when the app starts?",
      a: "Lazy. The class isn't constructed until the very first `inject(CartService)` anywhere in the running app actually executes. An app that never injects a registered root service never pays to build it — which is also what makes it tree-shakable: if nothing ever asks, the bundler can drop the class entirely.",
    },
    {
      q: 'Can I test a component without its real CartService?',
      a: "Yes — that's most of the reason DI exists. Supply `{ provide: CartService, useValue: fakeCart }` (or `useClass: FakeCartService`) to `TestBed.configureTestingModule`, and every component under test that injects `CartService` gets your fake instead, with zero changes to the component itself.",
    },
    {
      q: "What's the actual difference between an element injector and an environment injector?",
      a: "An element injector belongs to one component instance and is torn down with it — that's what `providers: [CounterService]` creates. An environment injector is a bigger, standalone scope — the app root, or a lazy route's own injector — that can outlive and sit above several components. Both answer to the exact same `inject()` call; the difference is only in what owns them, and when they die.",
    },
    {
      q: 'If two unrelated components both write providers: [CounterService], do they ever share state?',
      a: "No. `providers` on a component creates a new element injector for *that* component every time it's instantiated — two `<app-counter-widget>` elements on a page are two separate instantiations, so they get two separate injectors, each with its own `CounterService`. 'Same class' and 'same instance' are different questions, and this lesson's second demo exists to make that visible.",
    },
  ];
}
