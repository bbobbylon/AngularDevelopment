import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from './services-di.shared';
import { CartIndicator } from './cart-indicator/cart-indicator';
import { CounterWidget } from './counter-widget/counter-widget';

/**
 * Lesson: Services & Dependency Injection — sharing logic and state between
 * components without passing it through them.
 *
 * Covers `@Injectable`, `inject()` against constructor injection, injection
 * contexts, the injector hierarchy, and `InjectionToken` for dependencies that
 * aren't classes.
 *
 * The page is built around one contrast, shown live rather than described:
 *
 * - {@link CartService} is `providedIn: 'root'` — **one instance**, shared by
 *   every component that injects it. Add an item anywhere and every indicator
 *   on the page updates.
 * - {@link CounterService} is listed in a component's `providers` — **one
 *   instance per component**. Two widgets side by side count independently.
 *
 * That single choice is most of what people get wrong about DI, and seeing both
 * behaviours on one screen settles it faster than any explanation of the
 * injector tree — which the lesson then goes on to give.
 */
@Component({
  selector: 'app-lesson-services-di',
  imports: [RouterLink, CartIndicator, CounterWidget],
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
   * Sample: defining a service with `@Injectable({ providedIn: 'root' })`.
   */
  readonly serviceDefinitionSample = `@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<string[]>([]);
  readonly count = computed(() => this.items().length);
  readonly list = this.items.asReadonly();

  add(item: string) {
    this.items.update(i => [...i, item]);
  }
  remove(index: number) {
    this.items.update(i => i.filter((_, idx) => idx !== index));
  }
  clear() {
    this.items.set([]);
  }
}`;

  /**
   * Sample: `inject()` against constructor injection, and why the function form is
   * now preferred.
   */
  readonly injectSample = `// Modern style — the inject() function
export class ProductList {
  private cart = inject(CartService);       // resolved once, at construction
  addToCart(p: string) { this.cart.add(p); }
}

// Classic style — constructor parameter injection
export class ProductList {
  constructor(private cart: CartService) {} // Angular supplies the argument
  addToCart(p: string) { this.cart.add(p); }
}`;

  /**
   * Sample: a consumer of the root-provided service.
   */
  readonly cartIndicatorSample = `@Component({
  selector: 'app-cart-indicator',
  template: '<span class="pill">🛒 cart: {{ cart.count() }} item(s)</span>',
})
export class CartIndicator {
  protected readonly cart = inject(CartService);
}`;

  /**
   * Sample: a component-provided service, and the per-instance behaviour it gives.
   */
  readonly counterWidgetSample = `@Injectable()                    // no providedIn — not registered anywhere yet
export class CounterService {
  readonly count = signal(0);
  increment() { this.count.update(c => c + 1); }
  reset() { this.count.set(0); }
}

@Component({
  selector: 'app-counter-widget',
  providers: [CounterService],   // ← THIS registers a scoped instance HERE
  template: '<span>{{ counter.count() }}</span>',
})
export class CounterWidget {
  protected readonly counter = inject(CounterService);
}`;

  /**
   * Sample: how a resolution actually walks the injector tree, step by step, from
   * the element injector up to root.
   */
  readonly injectorTreeSample = `inject(CartService) called inside <app-cart-indicator>
  1. Check app-cart-indicator's OWN element injector    → nothing registered here
  2. Walk UP to the parent component's element injector  → nothing registered here
  3. ...keep walking up through every ancestor...        → nothing registered
  4. Reach the root / environment injector                → providedIn: 'root' registered it HERE
  5. First request ever? Build ONE instance and cache it on the root injector.
     Every future inject(CartService), from anywhere, returns that SAME cached instance.

inject(CounterService) called inside <app-counter-widget>
  1. Check app-counter-widget's OWN element injector   → providers: [CounterService] registered it HERE
  2. Found immediately → build (or reuse) the instance that belongs to THIS element injector.
     Stop. Never walks further up — never touches any other widget's instance.

inject(CounterService) called from a component with NO providers: [CounterService]
anywhere in its ancestor chain
  1..4. Walk all the way up, exactly like CartService's search above...
  5. Reach the root injector → still nothing (CounterService has no providedIn either)
     → throws NullInjectorError: No provider for CounterService!`;

  /**
   * Sample: calling `inject()` outside an injection context — the error, and the
   * fix.
   */
  readonly injectionContextSample = `// WRONG — inject() called from inside a method, after construction
export class ProductList {
  private cart!: CartService;
  addToCart(p: string) {
    this.cart = inject(CartService);   // ✗ NG0203: not an injection context
    this.cart.add(p);
  }
}

// RIGHT — capture the dependency as a field, during construction
export class ProductList {
  private cart = inject(CartService);  // ✓ field initializer = injection context
  addToCart(p: string) { this.cart.add(p); }
}`;

  /**
   * Sample: `InjectionToken`, for injecting a config value or anything else that
   * is not a class.
   */
  readonly injectionTokenSample = `// A dependency that ISN'T a class — e.g. a plain config value
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// Give it a value where you configure providers (e.g. app.config.ts)
providers: [
  { provide: API_BASE_URL, useValue: 'https://api.example.com' },
]

// Inject it exactly like a class dependency
export class ApiService {
  private baseUrl = inject(API_BASE_URL);
}`;
}
