import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A singleton service. `providedIn: 'root'` registers it once for the whole app,
 * so every injector returns the same instance — perfect for shared state.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<string[]>([]);
  readonly count = computed(() => this.items().length);
  readonly list = this.items.asReadonly();

  add(item: string) {
    this.items.update((i) => [...i, item]);
  }
  remove(index: number) {
    this.items.update((i) => i.filter((_, idx) => idx !== index));
  }
  clear() {
    this.items.set([]);
  }
}

/** A separate component that shares the same CartService instance. */
@Component({
  selector: 'app-cart-indicator',
  template: `<span class="pill">🛒 cart: {{ cart.count() }} item(s)</span>`,
})
export class CartIndicator {
  protected readonly cart = inject(CartService);
}

@Component({
  selector: 'app-lesson-services-di',
  imports: [RouterLink, CartIndicator],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Dependency Injection</span>
      <h1>Services & Dependency Injection</h1>
      <p class="lead">
        A <strong>service</strong> is a class for logic and state that does not
        belong to any single component — data access, business rules, shared state.
        Angular's <strong>dependency injection</strong> (DI) creates and supplies
        these for you, so you never call <code>new</code> yourself.
      </p>

      <h2>Defining a service</h2>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})  // app-wide singleton
export class CartService {{ '{' }}
  private items = signal&lt;string[]&gt;([]);
  count = computed(() =&gt; this.items().length);
  add(item: string) {{ '{' }} this.items.update(i =&gt; [...i, item]); {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Injecting with inject()</h2>
      <div class="code">
        <pre>export class ProductList {{ '{' }}
  private cart = inject(CartService);   // DI hands you the singleton
  addToCart(p: string) {{ '{' }} this.cart.add(p); {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Try it — two components, one shared service</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:12px">
          <app-cart-indicator />
          <button class="ghost" (click)="cart.clear()">Empty cart</button>
        </div>
        <div class="row" style="margin-bottom:14px">
          @for (p of products; track p) {
            <button (click)="cart.add(p)">Add {{ p }}</button>
          }
        </div>
        @if (cart.count()) {
          <ul>
            @for (item of cart.list(); track $index) {
              <li>{{ item }} <button class="ghost" (click)="cart.remove($index)">remove</button></li>
            }
          </ul>
        } @else {
          <p style="color:var(--text-muted)">Cart is empty. Add something!</p>
        }
        <p style="color:var(--text-muted);font-size:.85rem">
          The indicator and the list use <code>inject(CartService)</code> and see the
          very same state — that is the singleton at work.
        </p>
      </div>

      <h2>Where a service "lives"</h2>
      <ul>
        <li><code>providedIn: 'root'</code> — one shared instance for the whole app (most common, tree-shakable).</li>
        <li>Component <code>providers: [Service]</code> — a fresh instance per component subtree.</li>
        <li>Route <code>providers</code> — an instance scoped to a lazy-loaded feature.</li>
      </ul>

      <h2>How resolution works</h2>
      <p>
        Every component has its own <strong>element injector</strong>, nested inside its
        parent's, all the way up to the root (module/environment) injector. When you
        <code>inject(X)</code>, Angular walks <em>up</em> that chain until it finds a
        provider for <code>X</code> — so a provider on a component overrides the root one
        for that subtree. <code>providedIn: 'root'</code> is also tree-shakable: if
        nothing injects the service, it's dropped from the bundle.
      </p>

      <div class="tip">
        <code>inject()</code> must run in an <strong>injection context</strong>:
        constructors, field initialisers, factory functions, and route guards/resolvers.
        Calling it later (e.g. inside a click handler) throws
        <code>NG0203</code> — capture the dependency as a field instead. The older style
        — <code>constructor(private cart: CartService)</code> — is equivalent and still
        valid.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Services hold shared logic/state; DI provides them automatically.</li>
        <li><code>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})</code> makes an app-wide singleton.</li>
        <li>Inject with the <code>inject()</code> function (or constructor parameters).</li>
        <li>The provider location controls how many instances exist and who shares them.</li>
      </ul>

      <p><a routerLink="/signals">Next: Signals Basics →</a></p>
    </article>
  `,
})
export class ServicesDi {
  protected readonly cart = inject(CartService);
  protected readonly products = ['☕ Coffee', '🍩 Donut', '🥪 Sandwich'];
}
