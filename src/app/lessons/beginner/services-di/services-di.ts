import { Component, Injectable, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A singleton service. `providedIn: 'root'` registers it once for the whole app,
 * so every injector returns the same instance — perfect for shared state.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  /**
   * The cart contents. **Private** — the only way in is through the methods below,
   * which is what makes this a service rather than a shared mutable object.
   */
  private readonly items = signal<string[]>([]);
  /**
   * How many items are in the cart.
   */
  readonly count = computed(() => this.items().length);
  /**
   * A read-only view of the items for consumers. `asReadonly()` hands out the
   * signal's *value* without its `set`/`update`, so a component can subscribe to
   * changes but cannot make them behind the service's back.
   */
  readonly list = this.items.asReadonly();

  /**
   * Adds an item.
   *
   * @param item The item to add.
   */
  add(item: string) {
    this.items.update((i) => [...i, item]);
  }
  /**
   * Removes the item at an index.
   *
   * @param index Position to drop.
   */
  remove(index: number) {
    this.items.update((i) => i.filter((_, idx) => idx !== index));
  }
  /**
   * Empties the cart.
   */
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
  /**
   * The shared cart. Injected, not passed in — this component sits several levels
   * below whoever owns the cart, and DI is what spares every layer in between
   * from having to know about it.
   */
  protected readonly cart = inject(CartService);
}

/**
 * Deliberately has NO `providedIn`. It becomes injectable only once something
 * lists it in a `providers` array — the star of the component-scoped-instance demo.
 */
@Injectable()
export class CounterService {
  /**
   * The count. Per-instance, because this service is provided by the component
   * rather than at root.
   */
  readonly count = signal(0);
  /**
   * Increments the count.
   */
  increment() {
    this.count.update((c) => c + 1);
  }
  /**
   * Resets the count to zero.
   */
  reset() {
    this.count.set(0);
  }
}

/** Every <app-counter-widget> gets its OWN CounterService — see `providers` below. */
@Component({
  selector: 'app-counter-widget',
  providers: [CounterService],
  template: `
    <div class="row">
      <span class="pill">{{ label() }} → count: {{ counter.count() }}</span>
      <button class="ghost" (click)="counter.increment()">+1</button>
      <button class="ghost" (click)="counter.reset()">reset</button>
    </div>
  `,
})
export class CounterWidget {
  /**
   * This widget's **own** counter instance.
   *
   * The demo's punchline: because {@link CounterService} is listed in this
   * component's `providers`, every widget gets a separate instance — whereas the
   * cart above, provided in `root`, is one object shared by everyone.
   */
  protected readonly counter = inject(CounterService);
  /**
   * Display name, so two widgets on the page can be told apart.
   */
  readonly label = input('Widget');
}

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
  styles: [`
    .table-wrap { overflow-x: auto; margin: 10px 0 22px; }
    table.grid { width: 100%; border-collapse: collapse; font-size: .86rem; }
    table.grid th, table.grid td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.grid th { background: var(--bg-elevated); }
    table.grid td:first-child, table.grid th:first-child { min-width: 220px; }
  `],
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

      <h2>Why not just <code>new CartService()</code>?</h2>
      <p>
        You could construct <code>new CartService()</code> inside every component that
        needs a cart — but then each one gets its <em>own empty cart</em>, none of them
        can share state, and you can't swap in a fake version for tests. Dependency
        injection flips the direction: a component <em>declares</em> "I need a
        CartService" and a system called the <strong>injector</strong> decides which
        instance to hand back (building it the first time, then reusing it) — the
        component never touches a constructor itself.
      </p>

      <h2>Defining a service</h2>
      <div class="code">
        <pre>{{ serviceDefinitionSample }}</pre>
      </div>
      <h3>Line-by-line</h3>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Line</th><th>What it does &amp; why</th></tr>
          <tr>
            <td><code>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})</code></td>
            <td>Marks the class as DI-eligible <em>and</em> registers a single, app-wide
              provider on the root injector in one step. Angular builds the instance
              <strong>lazily</strong> — only the first time anything injects it — then
              caches and reuses that exact object forever. Because it's declared this
              way (not added by hand to some array), it's also <strong>tree-shakable</strong>:
              if nothing ever injects <code>CartService</code>, it never ships in the
              production bundle.</td>
          </tr>
          <tr>
            <td><code>private readonly items = signal&lt;string[]&gt;([])</code></td>
            <td>The cart's real state lives in a signal, not a plain array field.
              <code>private</code> keeps it encapsulated — nothing outside this class can
              call <code>.set()</code>/<code>.update()</code> on it directly; everyone
              else must go through <code>add</code>/<code>remove</code>/<code>clear</code>.</td>
          </tr>
          <tr>
            <td><code>readonly count = computed(() =&gt; this.items().length)</code></td>
            <td>A <strong>computed</strong> signal, not a plain getter: Angular tracks
              that it read <code>items()</code>, memoizes the result, and only
              recomputes when <code>items</code> actually changes. Any template that
              calls <code>count()</code> becomes a dependent and re-renders on its own —
              no manual subscription anywhere.</td>
          </tr>
          <tr>
            <td><code>readonly list = this.items.asReadonly()</code></td>
            <td>Exposes the array for <em>reading</em> (e.g. in an <code>&#64;for</code>
              loop) without exposing the writable signal API. Consumers can display the
              cart but cannot bypass <code>add</code>/<code>remove</code>/<code>clear</code>
              to mutate it directly.</td>
          </tr>
          <tr>
            <td><code>add()</code> / <code>remove()</code> / <code>clear()</code></td>
            <td>Each mutator calls <code>.update()</code>/<code>.set()</code> with a
              <strong>brand-new array</strong> (spread or <code>filter</code>) instead of
              mutating the existing one in place. Signals compare by reference — a fresh
              array is what actually triggers dependents to re-run.</td>
          </tr>
        </table>
      </div>

      <h2>Injecting it — two equivalent styles</h2>
      <div class="code">
        <pre>{{ injectSample }}</pre>
      </div>
      <h3>Line-by-line</h3>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Line</th><th>What it does &amp; why</th></tr>
          <tr>
            <td><code>private cart = inject(CartService);</code></td>
            <td>A field initializer runs while the class is being constructed, which
              Angular recognizes as a valid <strong>injection context</strong>.
              <code>inject()</code> walks the injector tree starting at this component
              and hands back whatever it finds registered for <code>CartService</code>.</td>
          </tr>
          <tr>
            <td><code>constructor(private cart: CartService) {{ '{' }}{{ '}' }}</code></td>
            <td>The pre-<code>inject()</code> idiom: Angular reads the constructor's
              parameter types and supplies matching instances automatically when it
              constructs the class. This performs the <em>exact same lookup</em> as the
              line above — same injector walk, same result — just older syntax you'll
              still meet in exams and legacy code.</td>
          </tr>
          <tr>
            <td><code>addToCart(p: string) {{ '{' }} this.cart.add(p); {{ '}' }}</code></td>
            <td>Neither variant stores cart data locally — the component just calls a
              method on the <em>shared</em> service. That's the whole point of DI here:
              two unrelated components stay in sync without ever referencing each other.</td>
          </tr>
        </table>
      </div>

      <h2>Live demo — one instance, shared everywhere</h2>
      <div class="demo">
        <p class="demo__title">Live — root singleton (providedIn: 'root')</p>
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
          The indicator badge above and this lesson component both called
          <code>inject(CartService)</code> independently, yet they see the very same
          state — that is the root singleton at work. Click a product, then watch the
          badge update with no wiring between the two components at all.
        </p>
      </div>

      <p>The badge you just clicked is this tiny component — its whole source:</p>
      <div class="code">
        <pre>{{ cartIndicatorSample }}</pre>
      </div>
      <h3>Line-by-line</h3>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Line</th><th>What it does &amp; why</th></tr>
          <tr>
            <td><code>&#64;Component({{ '{' }} selector: 'app-cart-indicator', ... {{ '}' }})</code></td>
            <td>No <code>providers</code> array here — deliberately. This component
              relies entirely on whatever the injector tree hands it; it never creates
              its own instance of anything.</td>
          </tr>
          <tr>
            <td>the template reads <code>cart.count()</code></td>
            <td>Reading the shared computed signal straight in the template registers
              this view as a <strong>consumer</strong> of <code>count</code>. Any
              <code>add</code>/<code>remove</code>/<code>clear</code> call anywhere in
              the app re-renders just this badge — nothing else has to be told.</td>
          </tr>
          <tr>
            <td><code>protected readonly cart = inject(CartService);</code></td>
            <td>The same walk-up-the-tree lookup as before. Because neither this
              component nor any ancestor provides its own <code>CartService</code>, the
              walk reaches the root injector and returns the one cached singleton — the
              exact same object every other injector in the app receives.</td>
          </tr>
        </table>
      </div>

      <h2>Where a service "lives"</h2>
      <p>
        Registering a service isn't all-or-nothing — <em>where</em> you register it
        controls how many instances exist and who ends up sharing which one:
      </p>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Provider location</th><th>How many instances</th><th>Typical use</th></tr>
          <tr>
            <td><code>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})</code></td>
            <td>One, for the whole application; built lazily on first injection</td>
            <td>The default choice — tree-shakable, shared state (our <code>CartService</code>)</td>
          </tr>
          <tr>
            <td><code>&#64;Injectable({{ '{' }} providedIn: 'platform' {{ '}' }})</code></td>
            <td>One, shared across every Angular app instance on the page</td>
            <td>Rare — mainly micro-frontend setups</td>
          </tr>
          <tr>
            <td>Component <code>providers: [Service]</code></td>
            <td>A fresh instance for that component <em>and</em> every descendant that
              injects it — separate from any root instance</td>
            <td>State that should reset per feature/instance — form wizards, per-row
              editors, our <code>CounterWidget</code> below</td>
          </tr>
          <tr>
            <td>Route <code>providers: [...]</code></td>
            <td>One instance per activation of that route, living in its own
              environment injector</td>
            <td>Scope state to a lazy-loaded feature without a full NgModule</td>
          </tr>
          <tr>
            <td><code>&#64;Injectable()</code> with no <code>providedIn</code> at all</td>
            <td>None, anywhere, until something lists it in a <code>providers</code> array</td>
            <td>Forces every consumer to opt in to a scope explicitly — what
              <code>CounterService</code> does next</td>
          </tr>
        </table>
      </div>

      <h2>Live demo — a fresh instance per component</h2>
      <p>
        This time each widget below lists <code>CounterService</code> in its own
        <code>providers</code> array. Watch what happens when you click <strong>+1</strong>
        on one of them:
      </p>
      <div class="demo">
        <p class="demo__title">Live — component-scoped instances</p>
        <div style="display:grid; gap:10px">
          <app-counter-widget label="Widget A" />
          <app-counter-widget label="Widget B" />
        </div>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:10px">
          Widget A's count never moves when you click Widget B — unlike the cart demo
          above, these two <code>&lt;app-counter-widget&gt;</code> elements each got
          their <strong>own</strong> <code>CounterService</code> object. Same class,
          two completely independent instances.
        </p>
      </div>

      <div class="code">
        <pre>{{ counterWidgetSample }}</pre>
      </div>
      <h3>Line-by-line</h3>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Line</th><th>What it does &amp; why</th></tr>
          <tr>
            <td><code>&#64;Injectable()</code> <em>(no <code>providedIn</code>)</em></td>
            <td>Marks the class DI-eligible but registers <strong>no provider anywhere</strong>
              by itself. If nothing lists <code>CounterService</code> in a
              <code>providers</code> array somewhere in the ancestor chain, injecting it
              throws a <code>NullInjectorError</code> at runtime — see "Under the hood" below.</td>
          </tr>
          <tr>
            <td><code>readonly count = signal(0)</code>, plus <code>increment()</code> / <code>reset()</code></td>
            <td>The exact same state-holding shape as <code>CartService</code>. What
              differs between this demo and the cart demo isn't the class code — it's
              <em>where each instance lives</em>.</td>
          </tr>
          <tr>
            <td><code>providers: [CounterService]</code> <em>(inside <code>&#64;Component</code>)</em></td>
            <td>The crucial line. It tells Angular to create a <strong>new element
              injector</strong> for this component (and its descendants) that owns its
              own <code>CounterService</code> instance — shadowing anything with the
              same type further up the tree.</td>
          </tr>
          <tr>
            <td><code>protected readonly counter = inject(CounterService);</code></td>
            <td>Resolved by walking up starting from <em>this</em> component. Because
              this component's own injector already has an entry (from the
              <code>providers</code> line above), the walk stops immediately — it never
              reaches an ancestor, and never touches another widget's instance.</td>
          </tr>
          <tr>
            <td><code>readonly label = input('Widget');</code></td>
            <td>A plain signal input purely so the two demo instances can be told apart
              in the UI text. It has nothing to do with DI — every input still creates a
              fresh signal per component instance too, which is a separate mechanism
              from providers.</td>
          </tr>
        </table>
      </div>

      <h2>Under the hood — walking the injector tree</h2>
      <p>
        Every component has its own <strong>element injector</strong>, nested inside its
        parent's, all the way up to the root (environment) injector. When you call
        <code>inject(X)</code>, Angular walks <em>up</em> that chain from the component
        that called it until it finds a provider for <code>X</code> — the first one it
        finds wins, and the walk stops there. Here is exactly what happened in the two
        demos above:
      </p>
      <div class="code">
        <pre>{{ injectorTreeSample }}</pre>
      </div>
      <ul>
        <li>
          <strong>Root providers get found late, cached forever.</strong>
          <code>CartService</code> has no local provider anywhere, so every lookup walks
          all the way to the root — but only the <em>first ever</em> lookup actually
          builds the object; every call after that returns the cached instance.
        </li>
        <li>
          <strong>Local providers get found immediately, and stop the walk.</strong>
          <code>CounterService</code> is found on the very first injector checked (the
          component's own), so the search never even looks at ancestors — that's exactly
          why two <code>&lt;app-counter-widget&gt;</code> elements never see each other's state.
        </li>
        <li>
          <strong>No provider anywhere = NullInjectorError.</strong> If
          <code>CounterService</code> were injected from a component that (and whose
          ancestors) never lists it in a <code>providers</code> array, the walk reaches
          the root, finds nothing (there's no <code>providedIn</code> on the class
          either), and Angular throws rather than guessing.
        </li>
      </ul>

      <h2><code>inject()</code> needs an injection context</h2>
      <p>
        <code>inject()</code> only works while Angular is actively constructing
        something — a component, a directive, a pipe, or a factory function it invokes
        directly (like a functional route guard). Call it later and there is no
        injector for it to walk from:
      </p>
      <div class="code">
        <pre>{{ injectionContextSample }}</pre>
      </div>
      <ul>
        <li>
          The <strong>WRONG</strong> version calls <code>inject()</code> from inside
          <code>addToCart</code> — a method that only runs later, in response to a
          click. By then construction is long over and there is no active injection
          context, so Angular throws <code>NG0203</code> instead of silently returning
          the wrong thing.
        </li>
        <li>
          The <strong>RIGHT</strong> version captures the dependency as a field
          initializer, which runs <em>during</em> construction — a guaranteed injection
          context — and simply stores the result in a field for every later method to use.
        </li>
      </ul>
      <div class="tip">
        Field initializers, constructors, and factory functions (route
        guards/resolvers written as plain functions) are injection contexts. A click
        handler, a <code>setTimeout</code> callback, or any method invoked after the
        object already exists is not — capture what you need as a field first.
      </div>

      <h2>Beyond classes — <code>InjectionToken</code></h2>
      <p>
        DI isn't limited to classes. A plain string, a config object, or an interface
        (which doesn't even exist at runtime) can be injected too, using an
        <code>InjectionToken</code> as the lookup key:
      </p>
      <div class="code">
        <pre>{{ injectionTokenSample }}</pre>
      </div>
      <h3>Line-by-line</h3>
      <div class="table-wrap">
        <table class="grid">
          <tr><th>Line</th><th>What it does &amp; why</th></tr>
          <tr>
            <td><code>new InjectionToken&lt;string&gt;('API_BASE_URL')</code></td>
            <td>Creates a unique, type-safe DI lookup key for a value that isn't a
              class — a string, an interface shape, a function, even a primitive config
              flag. The string argument is only a debug label; the token's identity is
              the object itself, not that text.</td>
          </tr>
          <tr>
            <td><code>{{ '{' }} provide: API_BASE_URL, useValue: '...' {{ '}' }}</code></td>
            <td>A provider recipe, exactly like registering a class, just spelled out
              explicitly: "when something asks for this token, give it this value."
              The same provider shape also supports <code>useFactory</code> (compute the
              value) and <code>useExisting</code> (alias another provider).</td>
          </tr>
          <tr>
            <td><code>private baseUrl = inject(API_BASE_URL);</code></td>
            <td><code>inject()</code> works identically for tokens and classes — the
              same walk-up-the-tree algorithm, the same injection-context rule, just a
              different kind of lookup key.</td>
          </tr>
        </table>
      </div>

      <h2>Exam pitfalls</h2>
      <ul>
        <li>
          <strong>Shadowing a root provider.</strong> Listing a
          <code>providedIn: 'root'</code> service in a component's own
          <code>providers</code> array does not add a second root instance — it creates
          a completely separate instance scoped to that subtree. Every
          <code>inject()</code> call inside that subtree now resolves to the
          <em>local</em> one, never the root singleton, even though
          <code>providedIn: 'root'</code> is still sitting right there on the class.
        </li>
        <li>
          <strong>Calling <code>inject()</code> outside an injection context throws
          <code>NG0203</code></strong>, it doesn't fail silently. It only works in
          constructors, field initializers, and Angular-invoked factory functions —
          never in a click handler, a <code>setTimeout</code>, or a method called after
          construction.
        </li>
        <li>
          <strong><code>&#64;Injectable()</code> alone does not register a provider.</strong>
          The decorator only makes a class eligible for DI metadata; without
          <code>providedIn</code> on the decorator <em>or</em> an entry in some
          <code>providers</code> array, injecting it throws
          <code>NullInjectorError: No provider for X!</code> — a common "works in one
          component, crashes in another" bug.
        </li>
        <li>
          <strong><code>providedIn: 'root'</code> means one instance per root/environment
          injector</strong>, not "one instance, ever, no matter what." A lazy-loaded
          route with its own providers, or a component that re-declares the service
          locally, each get their own instance — the precise phrasing matters on an exam.
        </li>
        <li>
          <strong>Constructor injection and <code>inject()</code> are equivalent, not
          competing.</strong> Both perform the exact same injector-tree walk at the
          exact same point (construction) — a question contrasting them is testing
          whether you know they're the same lookup, not that one is "more correct."
        </li>
        <li>
          <strong>Mutating shared service state in place</strong> (e.g.
          <code>this.items.push(x)</code> instead of
          <code>this.items.update(i =&gt; [...i, x])</code>) breaks the same-reference
          check signals rely on. A service is not an escape hatch from Angular's
          reactivity rules — it still needs immutable updates to notify consumers.
        </li>
      </ul>

      <h2>Key takeaways</h2>
      <ul>
        <li>Services hold shared logic/state; DI supplies instances so you never call <code>new</code> yourself.</li>
        <li><code>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})</code> = one lazily-built, tree-shakable, app-wide instance.</li>
        <li>A component's own <code>providers: [Service]</code> creates a fresh instance for that subtree — same class, different object.</li>
        <li><code>inject()</code> (or a constructor parameter) walks the injector tree upward from where it's called until it finds a provider — the nearest one wins.</li>
        <li><code>InjectionToken</code> extends the exact same system to values that aren't classes.</li>
        <li><code>inject()</code> must run in an injection context — constructors, field initializers, and factory functions. Elsewhere it throws <code>NG0203</code>.</li>
      </ul>

      <p><a routerLink="/signals">Next: Signals Basics →</a></p>
    </article>
  `,
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
