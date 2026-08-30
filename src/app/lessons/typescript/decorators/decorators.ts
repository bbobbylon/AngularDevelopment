import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

// ---- Live demo 1: evaluation vs application order ------------------------
// Factories run top-down as expressions; the decorators they return apply
// bottom-up. This log is filled at module load, when the class is defined.
const ORDER_LOG: string[] = [];

/**
 * First decorator in the evaluation-order demo. Logs when the *factory* runs.
 *
 * @returns The decorator, which logs when it is *applied*.
 */
function First() {
  ORDER_LOG.push('1. First() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('4. First’s decorator applied');
  };
}
/**
 * Second decorator in the evaluation-order demo.
 *
 * @returns The decorator, which logs when it is applied.
 */
function Second() {
  ORDER_LOG.push('2. Second() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('3. Second’s decorator applied');
  };
}

/**
 * Carries both demo decorators so their evaluation order can be observed.
 */
class OrderDemo {
  /**
   * Empty on purpose — the method exists only to be decorated.
   */
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

/**
 * Naive recursive Fibonacci: exponential, and the baseline the memoized version
 * is measured against.
 */
class FibSlow {
  /**
   * @param n Which Fibonacci number.
   * @returns The value, recomputed from scratch every call.
   */
  fib(n: number): number {
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

/**
 * The same recursion behind `@Memoize`.
 */
class FibMemo {
  /**
   * Identical body to {@link FibSlow.fib}.
   *
   * The reason memoizing helps so dramatically here is that the recursive calls go
   * through the prototype — that is, through the decorated wrapper — so every
   * *sub*-problem is cached too, not just the top-level call.
   *
   * @param n Which Fibonacci number.
   */
  @Memoize
  fib(n: number): number {
    // recursive calls dispatch through the prototype — i.e. through the
    // memoized wrapper — so intermediate results are cached too
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

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
@Component({
  selector: 'app-lesson-ts-decorators',
  imports: [RouterLink],
  styleUrl: './decorators.css',
  templateUrl: './decorators.html',
})
export class Decorators {
  /**
   * The order log, filled at module load when the decorators were evaluated.
   *
   * Already complete before this component exists: decorators run when the class
   * is *defined*, not when it is instantiated. That is the point the demo makes.
   */
  readonly orderLog = ORDER_LOG;

  /**
   * Milliseconds for the un-memoized run.
   */
  protected readonly benchPlain = signal<string | null>(null);
  /**
   * Milliseconds for the first memoized run — still real work, but each
   * sub-problem solved once.
   */
  protected readonly benchMemo = signal<string | null>(null);
  /**
   * Milliseconds for the *second* memoized run, which is a pure cache hit and the
   * reason the numbers are formatted to three decimal places.
   */
  protected readonly benchMemoAgain = signal<string | null>(null);

  /**
   * Runs the benchmark: naive, memoized, then memoized again.
   *
   * Uses `performance.now()` and a deliberately large input so the difference is
   * visible on a real machine rather than lost in noise.
   */
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
  /**
   * Sample: the five things a decorator can be attached to.
   */
  readonly fiveTargetsSample = `@Component({ selector: 'app-x', template: '...' })  // class decorator (factory)
export class X {
  @Input() value = 0;                        // property decorator
  @Output() done = new EventEmitter();       // property decorator
  @ViewChild('box') box!: ElementRef;        // property decorator
  @HostListener('click') onClick() {}        // method decorator
  @Input() set width(w: number) {}           // accessor decorator
  constructor(@Inject(TOKEN) dep: Dep) {}    // parameter decorator
}`;

  /**
   * Sample: a method decorator that wraps the original function.
   */
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

  /**
   * Sample: the evaluation-order demo, matching {@link First} and {@link Second}.
   */
  readonly orderSample = `// A decorator FACTORY: a function that returns the actual decorator. The
// outer body runs when the () is evaluated; the returned arrow runs when the
// decorator is applied. Those are two different moments — that is the whole
// point of this demo.
function First() {
  log('1. First() factory evaluated');
  return (t, k, d) => log('4. First\\u2019s decorator applied');
}
function Second() {
  log('2. Second() factory evaluated');
  return (t, k, d) => log('3. Second\\u2019s decorator applied');
}

class OrderDemo {
  // Read the numbers in the logs above, not the source order:
  //   FACTORIES evaluate TOP-DOWN     → 1 then 2
  //   DECORATORS apply BOTTOM-UP      → 3 then 4
  // The mnemonic is that decorators wrap like an onion: the closest one to
  // the method goes on first, and the outermost one wraps last (so it runs
  // FIRST at call time). Same rule as function composition, f(g(x)).
  @First()
  @Second()
  method() {}
}`;

  /**
   * Sample: the `@Memoize` implementation, including the caveat that the cache is
   * shared by all instances.
   */
  readonly memoizeSample = `// A method decorator receives three arguments:
//   target — the prototype (for a static method, the constructor)
//   key    — the method's name as a string
//   desc   — the property descriptor, whose .value IS the function itself
function Memoize(target: object, key: string, desc: PropertyDescriptor) {
  // Capture the original BEFORE overwriting it, or the replacement below
  // would call itself and blow the stack.
  const original = desc.value;
  // NOTE: shared by ALL instances. The decorator runs once, on the prototype,
  // so there is exactly one Map for the whole class — two Math2 objects share
  // a cache. Fine for pure maths, a data leak for anything user-specific.
  const cache = new Map<string, unknown>();
  // Replace the method. \`function\`, not an arrow: an arrow would capture
  // \`this\` from here (the module) instead of the calling instance.
  desc.value = function (...args: unknown[]) {
    // Cheap structural cache key. Good enough for primitives; it would treat
    // {a:1,b:2} and {b:2,a:1} as different, and chokes on circular objects.
    const k = JSON.stringify(args);
    // .apply(this, args) forwards both the receiver and the arguments, so
    // the original still sees the instance it was called on.
    if (!cache.has(k)) cache.set(k, original.apply(this, args));
    return cache.get(k);
  };
}

class Math2 {
  // No parentheses — Memoize is used directly, not as a factory.
  @Memoize
  fib(n: number): number {
    // The recursive calls go through this.fib, which is the DECORATED
    // version, so every subproblem hits the cache too. That is what turns
    // this from exponential into linear — and it only works because the
    // decorator replaced the method on the prototype.
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}`;

  /**
   * Sample: a small toolbox of practical decorators — debounce and friends.
   */
  readonly toolboxSample = `// Debounce: coalesce rapid calls (resize/scroll/input handlers)
function Debounce(ms: number) {
  // A FACTORY, because it takes configuration. Called as @Debounce(300).
  return (t: object, k: string, d: PropertyDescriptor) => {
    const original = d.value;
    // \`handle\` lives in the closure, so it persists between calls — that is
    // the state machine. ReturnType<typeof setTimeout> types it correctly in
    // both Node (an object) and the browser (a number).
    let handle: ReturnType<typeof setTimeout>;
    d.value = function (...args: unknown[]) {
      // Cancel the previous pending call. This is the whole trick: fire the
      // method 20 times quickly and the first 19 timers are torn down.
      clearTimeout(handle);
      // Schedule a fresh one. Only ms of SILENCE lets it through.
      handle = setTimeout(() => original.apply(this, args), ms);
    };
    // The catch: the method now returns undefined, because the real call
    // happens later. Debounce things that act, not things that answer.
  };
}

// Deprecated: warn (once) when legacy API is still being called
function Deprecated(alternative: string) {
  return (t: object, k: string, d: PropertyDescriptor) => {
    const original = d.value;
    // Closure state again — one flag per decorated method.
    let warned = false;
    d.value = function (...args: unknown[]) {
      // Warn ONCE, not on every call. A method called in a render loop would
      // otherwise flood the console until nobody reads it any more.
      // \`k\` is the method name the decorator was given, so the message names
      // itself without you hardcoding a string.
      if (!warned) { console.warn(k + ' is deprecated; use ' + alternative); warned = true; }
      // Crucially, it still WORKS — this decorator adds a warning, it does
      // not break the caller. Behaviour-preserving wrapping is what makes
      // decorators safe to sprinkle on an existing codebase.
      return original.apply(this, args);
    };
  };
}`;

  /**
   * Sample: what Angular's AOT compiler turns a decorated class into.
   */
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

  /**
   * Sample: DI before and after the move away from decorator metadata.
   */
  readonly diSample = `// decorator era (needs emitDecoratorMetadata + reflection at JIT time)
constructor(private http: HttpClient,
            @Inject(API_URL) private url: string) {}

// modern era — a plain function call, no reflection, works anywhere injection
// context exists (field initializers, factory functions, guards):
private http = inject(HttpClient);
private url  = inject(API_URL);`;
}
