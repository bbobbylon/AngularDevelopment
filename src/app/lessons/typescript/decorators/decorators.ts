import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: TypeScript decorators from first principles to how Angular's
 * compiler actually treats them.
 *
 * The decorators below (@Memoize, order-logging factories) are REAL legacy
 * decorators that execute in this module — this project's tsconfig sets
 * "experimentalDecorators": true, so the live demos run the genuine article,
 * not a simulation. Covers all five targets, factories, evaluation vs
 * application order, practical custom decorators, AOT (why @Component never
 * runs in a production build), emitDecoratorMetadata history, the TC39
 * stage-3 dialect, and the decorator→signal-function migration map.
 */

// ---- Live demo 1: evaluation vs application order ------------------------
// Factories run top-down as expressions; the decorators they return apply
// bottom-up. This log is filled at module load, when the class is defined.
const ORDER_LOG: string[] = [];

function First() {
  ORDER_LOG.push('1. First() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('4. First’s decorator applied');
  };
}
function Second() {
  ORDER_LOG.push('2. Second() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('3. Second’s decorator applied');
  };
}

class OrderDemo {
  @First()
  @Second()
  method() {}
}
// referencing the class prevents an unused-declaration lint error
void OrderDemo;

// ---- Live demo 2: a real @Memoize decorator -------------------------------
/**
 * Method decorator: replaces the method with a caching wrapper. Legacy
 * signature — (prototype, methodName, descriptor). Runs ONCE per class,
 * and the rewritten descriptor is shared by every instance.
 */
function Memoize(_target: object, _key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  const cache = new Map<string, unknown>();
  desc.value = function (...args: unknown[]) {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, original.apply(this, args));
    return cache.get(k);
  };
}

class FibSlow {
  fib(n: number): number {
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

class FibMemo {
  @Memoize
  fib(n: number): number {
    // recursive calls dispatch through the prototype — i.e. through the
    // memoized wrapper — so intermediate results are cached too
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

@Component({
  selector: 'app-lesson-ts-decorators',
  imports: [RouterLink],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .order-log { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-family: monospace; font-size: .82rem; }
    .order-log p { margin: 3px 0; }

    .bench { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
    .bench .card { border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; background: var(--bg-card); min-width: 200px; }
    .bench .card h4 { margin: 0 0 6px; font-size: .82rem; color: var(--text-muted); font-weight: 600; }
    .bench .card strong { font-size: 1.15rem; font-family: monospace; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">TypeScript · Language Features</span>
      <h1>Decorators</h1>
      <p class="lead">
        A decorator is a function prefixed with <code>&#64;</code> that attaches
        metadata or behavior to a class, method, accessor, property or parameter.
        Angular is built on them — and understanding what they really are (plain
        functions with a calling convention) demystifies half the framework,
        including why <code>&#64;Component</code> never even runs in a production build.
      </p>

      <h2>The five targets — as Angular uses them</h2>
      <div class="code"><pre>{{ fiveTargetsSample }}</pre></div>
      <p>
        Each decorator kind receives different arguments. That signature difference
        is why you can't put <code>&#64;Component</code> on a method or
        <code>&#64;Input</code> on a class — the function would be called with
        arguments it doesn't expect.
      </p>
      <table class="cmp">
        <tr><th>Kind</th><th>Receives (legacy dialect)</th><th>Angular examples</th></tr>
        <tr><td>Class</td><td>the constructor function; may return a replacement class</td><td><code>&#64;Component</code>, <code>&#64;Directive</code>, <code>&#64;Injectable</code>, <code>&#64;Pipe</code></td></tr>
        <tr><td>Method</td><td>prototype, method name, <code>PropertyDescriptor</code></td><td><code>&#64;HostListener</code></td></tr>
        <tr><td>Property</td><td>prototype, property name — <em>no descriptor</em></td><td><code>&#64;Input</code>, <code>&#64;Output</code>, <code>&#64;ViewChild</code>, <code>&#64;HostBinding</code></td></tr>
        <tr><td>Accessor</td><td>prototype, name, descriptor (get/set)</td><td><code>&#64;Input</code> on a setter</td></tr>
        <tr><td>Parameter</td><td>target, method name, parameter index</td><td><code>&#64;Inject</code>, <code>&#64;Optional</code>, <code>&#64;Self</code>, <code>&#64;SkipSelf</code>, <code>&#64;Host</code></td></tr>
      </table>

      <h2>A decorator is just a function</h2>
      <p>
        A method decorator receives the prototype, the member name and the property
        descriptor — mutate or replace <code>descriptor.value</code> and you've wrapped
        the method for <em>every instance of the class, forever</em>. This is the whole
        trick behind logging, memoization, debouncing and deprecation decorators:
      </p>
      <div class="code"><pre>{{ loggedSample }}</pre></div>
      <div class="warn">
        Decorators run <strong>once, at class-definition time</strong> — when the module
        is first imported — not per instance and not per call. State captured in the
        decorator's closure (like a cache) is therefore shared across all instances.
        Design for that or key the state per-instance (e.g. a <code>WeakMap</code>).
      </div>

      <h2>Factories, and the two orderings everyone mixes up</h2>
      <p>
        A factory is a function that <em>returns</em> a decorator — that is why
        Angular's decorators take arguments: <code>&#64;Component(&#123;...&#125;)</code>
        calls <code>Component</code> with your metadata, and the returned function
        decorates the class. With multiple decorators on one member there are two
        distinct orders: <strong>factories evaluate top-down</strong> (they're just
        expressions), then <strong>the returned decorators apply bottom-up</strong>
        (composition, like nested function calls). The log below was produced for real
        when this page's module loaded:
      </p>
      <div class="code"><pre>{{ orderSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — actual execution order, captured at module load</p>
        <div class="order-log">
          @for (line of orderLog; track $index) {
            <p>{{ line }}</p>
          }
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Bottom-up application means the decorator <em>closest to the method</em> wraps
          it first, and the one above wraps that wrapper — exactly like
          <code>First(Second(method))</code>.
        </p>
      </div>

      <h2>A real custom decorator, benchmarked live</h2>
      <p>
        <code>&#64;Memoize</code> below is a genuine legacy decorator compiled by this
        project (our tsconfig sets <code>experimentalDecorators: true</code>). It swaps
        the method for a caching wrapper. <code>fib(32)</code> naive recursion makes
        ~7 million calls; memoized, recursive calls dispatch through the wrapper so it
        does ~33:
      </p>
      <div class="code"><pre>{{ memoizeSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — run both implementations</p>
        <button (click)="runBench()">Compute fib(32) both ways</button>
        @if (benchPlain() !== null) {
          <div class="bench">
            <div class="card">
              <h4>plain fib(32)</h4>
              <strong>{{ benchPlain() }} ms</strong>
            </div>
            <div class="card">
              <h4>&#64;Memoize fib(32)</h4>
              <strong>{{ benchMemo() }} ms</strong>
            </div>
            <div class="card">
              <h4>&#64;Memoize again (cache hit)</h4>
              <strong>{{ benchMemoAgain() }} ms</strong>
            </div>
          </div>
        }
      </div>
      <p>Other decorators worth having in your toolbox — same anatomy, different wrapper:</p>
      <div class="code"><pre>{{ toolboxSample }}</pre></div>

      <h2>What Angular actually does with them (AOT)</h2>
      <p>
        Here is the part that separates "knows the syntax" from "knows the system":
        in a production (AOT) build, <strong><code>&#64;Component</code> never
        executes</strong>. The Angular compiler (<code>ngtsc</code>) statically reads
        the decorator's metadata at build time, compiles your template into
        instructions, and replaces the decorator with generated static fields
        (<code>ɵcmp</code>, <code>ɵfac</code>) on the class. The decorator is a
        compile-time <em>marker</em>, not a runtime mechanism:
      </p>
      <div class="code"><pre>{{ aotSample }}</pre></div>
      <ul>
        <li><strong>JIT mode</strong> (rare today: some tests, dynamic compilation) is the
          only place Angular decorators genuinely run at runtime — which is why
          <code>experimentalDecorators</code> is still switched on in CLI projects.</li>
        <li>This is also why decorator metadata must be <strong>statically analyzable</strong>:
          <code>template: someRuntimeString()</code> breaks AOT because the compiler
          can't evaluate it at build time.</li>
        <li>And why you can't apply <code>&#64;Component</code> conditionally or at
          runtime — by the time your code runs, the decorator is gone.</li>
      </ul>

      <h2>emitDecoratorMetadata — how constructor injection used to work</h2>
      <p>
        With <code>emitDecoratorMetadata</code>, TypeScript emits each constructor's
        parameter <em>types</em> as runtime metadata. Angular's JIT DI read that to know
        what to inject — it's why <code>constructor(private http: HttpClient)</code>
        worked with no token in sight. AOT replaced this with generated factories, and
        the modern <code>inject(HttpClient)</code> function needs no reflection at all —
        one reason the framework is migrating away from parameter decorators entirely
        (the TC39 standard doesn't even support them).
      </p>
      <div class="code"><pre>{{ diSample }}</pre></div>

      <h2>Legacy vs TC39 stage-3 decorators</h2>
      <p>
        TypeScript 5 ships the standardized decorator proposal alongside the legacy
        dialect. They are <em>different languages</em> with different signatures —
        Angular still uses the legacy dialect (hence
        <code>"experimentalDecorators": true</code> in this repo's tsconfig; remove it
        and the compiler switches to stage-3 semantics and Angular's decorators break):
      </p>
      <table class="cmp">
        <tr><th></th><th>Legacy (Angular today)</th><th>TC39 stage-3 (TS 5+ default)</th></tr>
        <tr><td>Enabled by</td><td><code>experimentalDecorators: true</code></td><td>default when the flag is absent</td></tr>
        <tr><td>Method signature</td><td><code>(target, key, descriptor)</code></td><td><code>(value, context)</code> — context has kind, name, <code>addInitializer</code></td></tr>
        <tr><td>Parameter decorators</td><td>supported (<code>&#64;Inject</code>)</td><td><strong>not in the standard</strong></td></tr>
        <tr><td>Metadata emit</td><td><code>emitDecoratorMetadata</code></td><td>separate metadata proposal</td></tr>
        <tr><td>Replace a class/method</td><td>mutate descriptor / return class</td><td>return the replacement from the decorator</td></tr>
      </table>

      <h2>The signal era — the migration map</h2>
      <p>
        Modern Angular replaces most <em>member</em> decorators with plain functions that
        create signals — no reflection, better types, works with the new compilation
        model. The <em>class</em> decorators remain (they're the compiler's entry points):
      </p>
      <table class="cmp">
        <tr><th>Decorator era</th><th>Signal era</th><th>Gained</th></tr>
        <tr><td><code>&#64;Input() x = 0</code></td><td><code>x = input(0)</code></td><td>read-only signal, required inputs, transforms</td></tr>
        <tr><td><code>&#64;Output() e = new EventEmitter()</code></td><td><code>e = output()</code></td><td>no RxJS coupling, cleaner types</td></tr>
        <tr><td><code>&#64;Input</code> + <code>&#64;Output</code> pair</td><td><code>x = model(0)</code></td><td>two-way binding in one line</td></tr>
        <tr><td><code>&#64;ViewChild('ref')</code></td><td><code>viewChild('ref')</code></td><td>signal, timing-safe, required variant</td></tr>
        <tr><td><code>&#64;ContentChildren(Tab)</code></td><td><code>contentChildren(Tab)</code></td><td>signal of readonly array</td></tr>
        <tr><td><code>constructor(&#64;Inject(TOKEN) t)</code></td><td><code>t = inject(TOKEN)</code></td><td>works in field initializers &amp; functions, inheritance-friendly</td></tr>
        <tr><td><code>&#64;HostListener</code> / <code>&#64;HostBinding</code></td><td><code>host: &#123;...&#125;</code> metadata</td><td>statically analyzable, the style guide's preference</td></tr>
        <tr><td><code>&#64;Component</code>, <code>&#64;Directive</code>, <code>&#64;Injectable</code>, <code>&#64;Pipe</code></td><td colspan="2">stay — they are how the compiler finds Angular classes</td></tr>
      </table>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>In what order do <code>&#64;A() &#64;B() method()</code> run?</summary>
        <div>Factories evaluate top-down (A's factory, then B's), the returned decorators
        apply bottom-up (B decorates the method, A decorates the result) — function
        composition, <code>A(B(method))</code>.</div>
      </details>
      <details class="qa">
        <summary>Does <code>&#64;Component</code> execute in a production build?</summary>
        <div>No. AOT compilation reads it statically, generates <code>ɵcmp</code>/<code>ɵfac</code>
        static fields, and drops the decorator. It only executes under JIT compilation.</div>
      </details>
      <details class="qa">
        <summary>How many times does a method decorator run for 100 instances?</summary>
        <div>Once — at class-definition time, when the module first loads. The rewritten
        descriptor (and any closure state, like a memo cache) is shared by all 100
        instances.</div>
      </details>
      <details class="qa">
        <summary>Why can't Angular adopt TC39 decorators for <code>&#64;Inject</code>?</summary>
        <div>The stage-3 standard has no parameter decorators. That's one driver behind
        <code>inject()</code> — it moves DI out of constructor parameters entirely, so no
        parameter decoration (or reflection metadata) is needed.</div>
      </details>
      <details class="qa">
        <summary>Why must <code>&#64;Component</code> metadata be statically analyzable?</summary>
        <div>Because the AOT compiler evaluates it at build time to generate template
        instructions. A template or selector computed at runtime can't be compiled ahead
        of time — the build fails.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>A decorator is a plain function called with a target-kind-specific signature at class-definition time — once, not per instance.</li>
        <li>Factories evaluate top-down; decorators apply bottom-up (composition).</li>
        <li>In AOT builds Angular decorators are compile-time markers — <code>&#64;Component</code> never runs; JIT is the exception that keeps <code>experimentalDecorators</code> alive.</li>
        <li>Angular uses the legacy dialect; TC39 stage-3 has different signatures and no parameter decorators.</li>
        <li>Member decorators are migrating to signal functions (<code>input()</code>, <code>output()</code>, <code>viewChild()</code>, <code>inject()</code>); class decorators stay.</li>
      </ul>

      <p>
        Drill this with the <a routerLink="/practice">TypeScript challenges</a>, then
        continue to <a routerLink="/ts-modules">Modules, Imports &amp; Exports →</a>
      </p>
    </article>
  `,
})
export class Decorators {
  readonly orderLog = ORDER_LOG;

  protected readonly benchPlain = signal<string | null>(null);
  protected readonly benchMemo = signal<string | null>(null);
  protected readonly benchMemoAgain = signal<string | null>(null);

  runBench() {
    const slow = new FibSlow();
    const memo = new FibMemo();

    let t = performance.now();
    slow.fib(32);
    this.benchPlain.set((performance.now() - t).toFixed(1));

    t = performance.now();
    memo.fib(32);
    this.benchMemo.set((performance.now() - t).toFixed(2));

    t = performance.now();
    memo.fib(32);
    this.benchMemoAgain.set((performance.now() - t).toFixed(3));
  }

  // --- code samples (properties, so braces need no template escaping) ---
  readonly fiveTargetsSample = `@Component({ selector: 'app-x', template: '...' })  // class decorator (factory)
export class X {
  @Input() value = 0;                        // property decorator
  @Output() done = new EventEmitter();       // property decorator
  @ViewChild('box') box!: ElementRef;        // property decorator
  @HostListener('click') onClick() {}        // method decorator
  @Input() set width(w: number) {}           // accessor decorator
  constructor(@Inject(TOKEN) dep: Dep) {}    // parameter decorator
}`;

  readonly loggedSample = `function Logged(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;               // the real method
  desc.value = function (...args: unknown[]) {
    console.log('calling ' + key, args);
    return original.apply(this, args);       // preserve "this"!
  };
}

class Api {
  @Logged
  fetch(id: number) { /* ... */ }
}
// runs ONCE when the class is defined; wraps fetch for every instance`;

  readonly orderSample = `function First() {
  log('1. First() factory evaluated');
  return (t, k, d) => log('4. First\\u2019s decorator applied');
}
function Second() {
  log('2. Second() factory evaluated');
  return (t, k, d) => log('3. Second\\u2019s decorator applied');
}

class OrderDemo {
  @First()
  @Second()
  method() {}
}`;

  readonly memoizeSample = `function Memoize(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  const cache = new Map<string, unknown>();   // NOTE: shared by ALL instances
  desc.value = function (...args: unknown[]) {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, original.apply(this, args));
    return cache.get(k);
  };
}

class Math2 {
  @Memoize
  fib(n: number): number {
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}`;

  readonly toolboxSample = `// Debounce: coalesce rapid calls (resize/scroll/input handlers)
function Debounce(ms: number) {
  return (t: object, k: string, d: PropertyDescriptor) => {
    const original = d.value;
    let handle: ReturnType<typeof setTimeout>;
    d.value = function (...args: unknown[]) {
      clearTimeout(handle);
      handle = setTimeout(() => original.apply(this, args), ms);
    };
  };
}

// Deprecated: warn (once) when legacy API is still being called
function Deprecated(alternative: string) {
  return (t: object, k: string, d: PropertyDescriptor) => {
    const original = d.value;
    let warned = false;
    d.value = function (...args: unknown[]) {
      if (!warned) { console.warn(k + ' is deprecated; use ' + alternative); warned = true; }
      return original.apply(this, args);
    };
  };
}`;

  readonly aotSample = `// what you write
@Component({ selector: 'app-hello', template: '<h1>Hi {{name}}</h1>' })
export class Hello { name = 'Ada'; }

// what the AOT compiler emits (simplified) — the decorator is GONE
export class Hello {
  name = 'Ada';
  static ɵfac = () => new Hello();
  static ɵcmp = defineComponent({
    selectors: [['app-hello']],
    template: (rf, ctx) => { /* compiled instructions */ },
  });
}`;

  readonly diSample = `// decorator era (needs emitDecoratorMetadata + reflection at JIT time)
constructor(private http: HttpClient,
            @Inject(API_URL) private url: string) {}

// modern era — a plain function call, no reflection, works anywhere injection
// context exists (field initializers, factory functions, guards):
private http = inject(HttpClient);
private url  = inject(API_URL);`;
}
