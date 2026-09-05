import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

// ── Live demo 1: evaluation order vs. application order ────────────────────
// Factories run top-down as expressions, at class-definition time; the
// decorators they RETURN apply bottom-up. This log is filled once, at module
// load, when the class below is defined — before this lesson component even
// exists.
const ORDER_LOG: string[] = [];

/**
 * Outer decorator in the evaluation-order demo. Logs when its *factory* runs,
 * and again when the *decorator it returns* is applied.
 *
 * @returns The decorator itself, which fires the second log line.
 */
function First() {
  ORDER_LOG.push('1. First() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('4. First’s decorator applied');
  };
}
/**
 * Inner decorator in the evaluation-order demo — same shape as {@link First}.
 */
function Second() {
  ORDER_LOG.push('2. Second() factory evaluated');
  return function (_target: object, _key: string, _desc: PropertyDescriptor) {
    ORDER_LOG.push('3. Second’s decorator applied');
  };
}

/**
 * Carries both demo decorators so their real evaluation/application order can
 * be observed. Never instantiated — the whole point happens at class
 * definition, which already occurred by the time this module finished
 * loading.
 */
class OrderDemo {
  /** Empty on purpose — this method exists only to be decorated. */
  @First()
  @Second()
  method() {}
}
// referencing the class prevents an unused-declaration lint error
void OrderDemo;

// ── Live demo 2: a real @Memoize decorator, benchmarked ─────────────────────

/**
 * Method decorator: replaces the method with a caching wrapper. Legacy
 * signature — (prototype, methodName, descriptor). Runs ONCE per class, and
 * the rewritten descriptor — including its cache — is shared by every
 * instance of that class.
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

/** Naive recursive Fibonacci: exponential, and the baseline `FibMemo` is measured against. */
class FibSlow {
  /**
   * @param n Which Fibonacci number.
   * @returns The value, recomputed from scratch on every call.
   */
  fib(n: number): number {
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

/** The identical recursion, behind `@Memoize`. */
class FibMemo {
  /**
   * Identical body to {@link FibSlow.fib}. The reason memoizing helps so
   * dramatically here is that the recursive calls dispatch through the
   * prototype — through the decorated wrapper — so every *sub*-problem gets
   * cached too, not just the top-level call.
   *
   * @param n Which Fibonacci number.
   */
  @Memoize
  fib(n: number): number {
    // recursive calls go through this.fib, i.e. through the memoized
    // wrapper on the prototype — so intermediate results are cached too
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}

// ── Live demo 3: a property decorator vs. a class-field initializer ────────
// This log is filled fresh on every click, not at module load — it has to
// run AFTER the two classes below are constructed, so it lives as a plain
// module-level array the component copies into a signal.
let LOUD_LOG: string[] = [];

/**
 * Property decorator: installs a get/set pair on the PROTOTYPE that logs
 * every write. A property decorator's legacy signature has no descriptor at
 * all — (prototype, key) only — so this is all it *can* do: install
 * something new. It cannot wrap an existing value, because there isn't one
 * yet.
 */
function Loud(target: object, key: string) {
  const backing = new WeakMap<object, unknown>();
  Object.defineProperty(target, key, {
    configurable: true,
    get(this: object) {
      return backing.get(this);
    },
    set(this: object, value: unknown) {
      LOUD_LOG.push('setter fired — ' + key + ' = ' + JSON.stringify(value));
      backing.set(this, value);
    },
  });
}

/**
 * `name` has an INITIALIZER. Compiled with this repo's `target: ES2022`
 * (native class fields, `[[Define]]` semantics), that creates a brand-new
 * property directly on every INSTANCE before its constructor body runs —
 * shadowing the prototype accessor `@Loud` installed. The setter never fires.
 */
class Announced {
  @Loud name = 'Ada';
}

/**
 * `name` is `declare`d, not initialized — TypeScript erases the declaration
 * entirely, so no instance property is created. The constructor's plain
 * assignment resolves up the prototype chain and lands squarely on
 * `@Loud`'s setter.
 */
class AnnouncedLate {
  @Loud declare name: string;
  constructor() {
    this.name = 'Grace';
  }
}

// ── Live demo 4: two ways a CLASS decorator can behave ──────────────────────

/**
 * FLAVOUR A — mutate the constructor, then return nothing. `Widget` stays
 * the exact function you wrote; it only gains a new static property.
 */
function WithVersion(version: string) {
  return function (target: { new (...args: unknown[]): unknown }) {
    Object.defineProperty(target, 'version', { value: version, enumerable: true });
  };
}

/**
 * FLAVOUR B — return a brand-new class. Whatever binds to `Point` after this
 * decorator runs points at THIS class: a subclass of the one actually
 * written below, built to seal every instance right after construction.
 */
function Sealed<T extends new (...args: any[]) => object>(Base: T) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
      Object.seal(this);
    }
  };
}

@WithVersion('2.1.0')
class Widget {}

@Sealed
class Point {
  x = 0;
  y = 0;
}

/**
 * Lesson: TypeScript decorators, from "it's just a function" to how
 * Angular's own compiler treats them, why a subclass of a decorated class
 * can fail to build, and the two dialects TypeScript now speaks at once.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (`shared/brain/`); shape and rhythm
 * copied from `expert/change-detection`, the reference implementation. The
 * teaching order:
 *
 * 1. **Pose the mystery before naming it.** The `@` symbol is used
 *    thousands of times before anyone asks what it does; the opening napkin
 *    asks the reader to commit to two guesses — one about *how many times* a
 *    decorator's machinery runs, one about whether it runs *at all* in
 *    production — both paid off by later live proof rather than told upfront.
 * 2. **Analogy before vocabulary.** A decorator as a blueprint inspector who
 *    visits exactly once, before a single unit is built, gives "runs once at
 *    class-definition time" somewhere to live before that phrase is used.
 * 3. **Every decorator that actually wraps something is real, running code**
 *    compiled by this project's own `experimentalDecorators: true` — the
 *    evaluation/application-order log, the `@Memoize` benchmark, the
 *    property-decorator-vs-field-initializer trap, and both class-decorator
 *    flavours all execute live in the browser, not simulated. Only the
 *    TC39 stage-3 rewrite is illustrative — it uses a dialect this project's
 *    tsconfig does not compile, on purpose, since Angular does not use it.
 * 4. **The coverage gaps a prior sweep found in this exact lesson** — no
 *    code for a class decorator's own two behaviours, the NG2007 subclassing
 *    trap, `reflect-metadata`/`design:paramtypes` and the interface-as-token
 *    failure, no stage-3 sample, and the field-initializer exam trap — are
 *    folded in as full sections with their own live proof or annotated code,
 *    not just mentioned in passing.
 */
@Component({
  selector: 'app-lesson-ts-decorators',
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
  styleUrl: './decorators.css',
  templateUrl: './decorators.html',
})
export class Decorators {
  /**
   * The order log, filled at module load when the decorators were evaluated
   * and applied — already complete before this component exists.
   */
  readonly orderLog = ORDER_LOG;

  /** Milliseconds for the un-memoized run. */
  protected readonly benchPlain = signal<string | null>(null);
  /** Milliseconds for the first memoized run — real work, but each sub-problem solved once. */
  protected readonly benchMemo = signal<string | null>(null);
  /** Milliseconds for the *second* memoized run — a pure cache hit. */
  protected readonly benchMemoAgain = signal<string | null>(null);

  /**
   * Runs the benchmark: naive, memoized, then memoized again. Uses
   * `performance.now()` and a deliberately large input so the difference is
   * visible on a real machine rather than lost in noise.
   */
  protected runBench(): void {
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

  /** Log lines from the most recent field-initializer run. Empty until the demo is run. */
  protected readonly loudLog = signal<string[]>([]);

  /**
   * Constructs one `Announced` and one `AnnouncedLate`, then copies whatever
   * `@Loud`'s setter logged into a signal so the template can render it.
   */
  protected runFieldDemo(): void {
    LOUD_LOG = [];
    new Announced();
    new AnnouncedLate();
    this.loudLog.set([...LOUD_LOG]);
  }

  /** `Widget.version` — proof the mutating flavour patched the real class. */
  protected readonly widgetVersion = signal<string | null>(null);
  /** `Point.name` after the replacing flavour ran — the class-identity caveat, live. */
  protected readonly pointName = signal<string | null>(null);
  /** Whether `Object.seal` inside the decorator actually took effect. */
  protected readonly pointSealed = signal<boolean | null>(null);
  /** Whether `p instanceof Point` still reads true against the REPLACED class. */
  protected readonly pointIsInstance = signal<boolean | null>(null);

  /** Runs both class-decorator flavours and reads back their effects. */
  protected runClassDecoDemo(): void {
    this.widgetVersion.set((Widget as unknown as { version: string }).version);
    const p = new Point();
    this.pointName.set(Point.name);
    this.pointSealed.set(Object.isSealed(p));
    this.pointIsInstance.set(p instanceof Point);
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Language Features track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Decorators' },
    { label: 'Modules', id: 'ts-modules' },
    { label: 'Async', id: 'ts-async' },
    { label: 'Nullish', id: 'ts-nullish' },
  ];

  /**
   * The dialogue behind "does `@Component` actually run?" — staged as a
   * conversation because the relationship it describes (source syntax vs.
   * what a specific compiler chooses to do with it) is exactly the kind of
   * two-party contract a paragraph makes the reader reconstruct themselves.
   */
  protected readonly aotTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I wrote `@Component({ selector: ..., template: ... }) export class Hello {}`. What happens when I build for production?',
    },
    {
      who: 'TypeScript',
      says: 'I see `experimentalDecorators: true`, so I recognise the syntax. I don’t run it myself — I hand your code to whichever build tool you’re using.',
    },
    {
      who: 'ngtsc, Angular’s AOT compiler',
      says: 'I read `Component`’s argument object **statically** — as data, at compile time. I never call the `Component` function.',
    },
    {
      who: 'You',
      says: 'So the decorator never actually executes?',
    },
    {
      who: 'ngtsc',
      says: 'Not in AOT. By the time your app runs in a browser it is gone — replaced by `ɵcmp` and `ɵfac`, two static fields sitting where the decorator used to be.',
    },
  ];

  // --- code samples (properties, so braces need no template escaping) ---

  /** Sample: the five things a decorator can be attached to, all on one class Angular ships. */
  protected readonly fiveTargetsSample = `@Component({ selector: 'app-x', template: '...' })  // class decorator (factory)
export class X {
  @Input() value = 0;                          // property decorator
  @Output() done = new EventEmitter<void>();    // property decorator
  @ViewChild('box') box!: ElementRef;           // property decorator
  @HostListener('click') onClick() {}           // method decorator
  @Input() set width(w: number) {}              // accessor decorator
  constructor(@Inject(TOKEN) dep: Dep) {}       // parameter decorator
}`;

  /** Sample: a generic method decorator, the shape every wrapping decorator on this page shares. */
  protected readonly loggedSample = `function Logged(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;                 // the real method, captured before we overwrite it
  desc.value = function (...args: unknown[]) {
    console.log('calling ' + key, args);
    return original.apply(this, args);          // forward "this" and the arguments
  };
}

class Api {
  @Logged
  fetch(id: number) { /* ... */ }
}
// Logged(Api.prototype, 'fetch', <the original descriptor>) runs ONCE, when
// this module loads — not once per call, not once per instance.`;

  /** Line-by-line walkthrough of {@link loggedSample}. */
  protected readonly loggedNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The legacy three-argument method-decorator signature: `target` is the prototype the method lives on, `key` is its name as a string, and `desc` is its `PropertyDescriptor` — the object whose `.value` **is** the function itself.',
    },
    {
      line: 2,
      text: '`desc.value` is the original function. Save it before overwriting `desc.value` below, or the replacement would call itself and blow the stack.',
    },
    {
      line: 3,
      text: 'A plain `function`, not an arrow — an arrow would capture `this` from the module scope instead of whatever instance called `fetch`.',
    },
    {
      line: 5,
      text: '`.apply(this, args)` forwards both the call’s receiver and its arguments, so `fetch` still runs exactly as written — it just also gets a console line first.',
    },
    {
      line: 10,
      text: '`@Logged` — no parentheses, because `Logged` already **is** the decorator. Nothing needs configuring first.',
    },
    {
      line: 13,
      text: 'Once — at class-definition time. Every instance of `Api`, however many exist, shares this exact wrapper; there is only ever one `desc.value` for the whole class.',
    },
  ];

  /** Sample: the evaluation-order demo, matching {@link First} and {@link Second}. */
  protected readonly orderSample = `// A decorator FACTORY: a function that returns the actual decorator. The
// outer body runs when the () is evaluated; the returned function runs when
// the decorator is APPLIED. Those are two different moments.
function First() {
  log('1. First() factory evaluated');
  return (t, k, d) => log('4. First\\u2019s decorator applied');
}
function Second() {
  log('2. Second() factory evaluated');
  return (t, k, d) => log('3. Second\\u2019s decorator applied');
}

class OrderDemo {
  // Read the numbers in the log, not the source order:
  //   FACTORIES evaluate TOP-DOWN     → 1, then 2
  //   DECORATORS apply BOTTOM-UP      → 3, then 4
  // First applies LAST, so it ends up wrapping Second's result — First is
  // the outer layer, Second the inner one, same as First(Second(method)).
  @First()
  @Second()
  method() {}
}`;

  /** Line-by-line walkthrough of {@link orderSample}. */
  protected readonly orderNotes: CodeNote[] = [
    {
      line: 4,
      text: 'Calling `First()` — with parentheses — runs this outer function body immediately, while the class is still being parsed. It does not decorate anything yet; it builds and returns the decorator that will.',
    },
    {
      line: 6,
      text: 'This arrow is the real decorator, the thing `First()` returns. It has not run yet on line 4 — it only runs when it is **applied**, below.',
    },
    {
      line: 19,
      text: '`@First()` — evaluating the factory call happens now, top-to-bottom with `@Second()` on the next line. Applying the decorator it returns happens later, in the **opposite** order.',
    },
    {
      line: 21,
      text: 'The real, empty method — the innermost layer. Both decorators wrap this.',
    },
  ];

  /** Sample: the `@Memoize` implementation, including the caveat that its cache is per-class. */
  protected readonly memoizeSample = `// A method decorator receives three arguments:
//   target — the prototype (for a static method, the constructor)
//   key    — the method's name as a string
//   desc   — the property descriptor, whose .value IS the function itself
function Memoize(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  // Shared by ALL instances: the decorator runs once, on the prototype, so
  // there is exactly one Map for the whole class.
  const cache = new Map<string, unknown>();
  desc.value = function (...args: unknown[]) {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, original.apply(this, args));
    return cache.get(k);
  };
}

class Math2 {
  @Memoize
  fib(n: number): number {
    // Recursive calls go through this.fib — the DECORATED version — so
    // every sub-problem hits the cache too. That's what turns this from
    // exponential into linear.
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}`;

  /** Line-by-line walkthrough of {@link memoizeSample}. */
  protected readonly memoizeNotes: CodeNote[] = [
    {
      line: 6,
      text: 'Captured **before** `desc.value` is overwritten below — skip this and the replacement would call itself forever.',
    },
    {
      line: 9,
      text: 'One `Map`, created once, closed over by every call the wrapper makes from here on. This is the entire cache.',
    },
    {
      line: 11,
      text: 'A cheap structural key: fine for primitive arguments like `n`, but it would treat `{a:1,b:2}` and `{b:2,a:1}` as different keys, and it throws on circular objects.',
    },
    {
      line: 12,
      text: '`.apply(this, args)` forwards the real receiver and arguments, so a cached call still behaves like the original method — just remembered.',
    },
    {
      line: 18,
      text: 'No parentheses: `Memoize` is used directly as the decorator, not called first to configure it. It needs no configuration.',
    },
    {
      line: 23,
      text: 'Every recursive call here goes through `this.fib`, which by now points at the **wrapped** version on the prototype — so `fib(30)` calling `fib(29)` and `fib(28)` hits the cache too, not just the outermost call.',
    },
  ];

  /** Sample: a small toolbox of practical method decorators — same anatomy, different wrapper. */
  protected readonly toolboxSample = `// Debounce: coalesce rapid calls (resize / scroll / input handlers)
function Debounce(ms: number) {
  return (t: object, k: string, d: PropertyDescriptor) => {
    const original = d.value;
    let handle: ReturnType<typeof setTimeout>;
    d.value = function (...args: unknown[]) {
      clearTimeout(handle);                          // cancel the pending call
      handle = setTimeout(() => original.apply(this, args), ms);
    };
    // the method now returns undefined — the real call happens LATER.
    // Debounce things that ACT, not things that ANSWER.
  };
}

// Deprecated: warn once, then keep working — never break the caller
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

  /** Sample: both class-decorator flavours, matching {@link WithVersion} and {@link Sealed}. */
  protected readonly classDecoSample = `// FLAVOUR A — mutate the constructor, then return nothing. \`Widget\` itself
// is still the exact function you wrote; it just got a new static property.
function WithVersion(version: string) {
  return function (target: { new (...args: unknown[]): unknown }) {
    Object.defineProperty(target, 'version', { value: version, enumerable: true });
  };
}

// FLAVOUR B — return a brand-new class. Whatever binds to \`Point\` after
// this runs points at THIS class, a subclass of the one actually written.
function Sealed<T extends new (...args: any[]) => object>(Base: T) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
      Object.seal(this);              // no new properties, ever, on any instance
    }
  };
}

@WithVersion('2.1.0')
class Widget {}

@Sealed
class Point {
  x = 0;
  y = 0;
}`;

  /** Line-by-line walkthrough of {@link classDecoSample}. */
  protected readonly classDecoNotes: CodeNote[] = [
    {
      line: 4,
      text: '`target` here is the **constructor itself** — a class decorator’s version of `target` is the whole class, not a prototype. The type says "anything you can `new`".',
    },
    {
      line: 5,
      text: '`Object.defineProperty` on the constructor adds a **static** property — `Widget.version`, not something on an instance. Nothing about existing or future instances changes.',
    },
    {
      line: 11,
      text: '`T extends new (...args) => object` — a generic constrained to "any class". A decorator that **returns** a class needs this so TypeScript knows `Base` is something `extends`-able.',
    },
    {
      line: 12,
      text: '`return class extends Base { ... }` — the whole trick. Whatever calls this decorator gets handed back a **new** class, not the original.',
    },
    {
      line: 14,
      text: '`super(...args)` runs the original constructor first — `x = 0; y = 0;` still happen — before this one adds its own behaviour.',
    },
    {
      line: 15,
      text: '`Object.seal` locks the instance’s shape after construction: existing properties (`x`, `y`) stay writable, but no new one can ever be added.',
    },
    {
      line: 20,
      text: "The factory call `WithVersion('2.1.0')` runs now, at class-definition time, and returns the mutating decorator defined above.",
    },
    {
      line: 23,
      text: '`@Sealed` — no parentheses, because `Sealed` already **is** the decorator. Applying it replaces what the binding `Point` refers to, from here on.',
    },
  ];

  /** Sample: an undecorated abstract base using Angular features — and the one-line fix. */
  protected readonly baseListSample = `// FAILS TO COMPILE — NG2007: "Class is using Angular features but is not
// decorated. Please add an explicit Angular decorator."
export abstract class BaseList<T> {
  @Input() items: T[] = [];
  protected readonly logger = inject(LoggerService);
  abstract render(item: T): string;
}

// THE FIX — a bare @Directive(), no selector, marks the base class itself
// as "Angular-aware" without making it a usable directive on its own.
@Directive()
export abstract class BaseList<T> {
  @Input() items: T[] = [];
  protected readonly logger = inject(LoggerService);
  abstract render(item: T): string;
}`;

  /** Line-by-line walkthrough of {@link baseListSample}. */
  protected readonly baseListNotes: CodeNote[] = [
    {
      line: 3,
      text: 'No decorator on this class at all. `abstract` only stops TypeScript from letting you `new` it directly — it says nothing to Angular’s compiler.',
    },
    {
      line: 4,
      text: '`@Input()` is an Angular decorator, but Angular decorators are read by `ngtsc` **per class** — it has to already know a class is Angular-aware before it goes looking for these.',
    },
    {
      line: 5,
      text: '`inject()` has the same requirement: it needs an Angular injection context, which `ngtsc` only sets up for classes it recognises.',
    },
    {
      line: 11,
      text: '`@Directive()` with no `selector` — it can never be used as an attribute in a template. Its only job here is to be **present**, so `ngtsc` processes this class’s `@Input`s and DI.',
    },
    {
      line: 12,
      text: 'Same class, same members — the only change is the decorator on line 11. That one addition is the entire fix.',
    },
  ];

  /** Sample: what Angular's AOT compiler turns a decorated class into. */
  protected readonly aotSample = `// what you write
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

  /** Line-by-line walkthrough of {@link aotSample}. */
  protected readonly aotNotes: CodeNote[] = [
    {
      line: 2,
      text: '`Component(...)` — the function call your source contains. In an AOT build this call is never actually made; `ngtsc` reads the object literal you passed it as data, at compile time, and discards the call itself.',
    },
    {
      line: 6,
      text: 'No decorator here at all — line 2 is gone entirely from the compiled output, not merely skipped.',
    },
    {
      line: 8,
      text: '`ɵfac` (factory) replaces whatever the decorator’s runtime logic would have set up: a plain function that knows how to construct a `Hello`.',
    },
    {
      line: 9,
      text: '`ɵcmp` (component definition) is where your decorator’s metadata actually ended up — `selector`, `template`, everything — compiled into a plain object Angular’s renderer reads directly.',
    },
    {
      line: 11,
      text: 'Your template string is gone too, compiled into this instruction function — the same shape the change-detection lesson pulls apart line by line.',
    },
  ];

  /** Sample: `emitDecoratorMetadata` and the `reflect-metadata` polyfill it depends on. */
  protected readonly reflectSample = `// with emitDecoratorMetadata: true, TypeScript emits each constructor's
// PARAMETER TYPES as runtime metadata, using the reflect-metadata polyfill.
import 'reflect-metadata';

@Injectable()
class ReportService {
  constructor(private http: HttpClient, private label: string) {}
}

// roughly what the compiler emits alongside the class:
Reflect.metadata('design:paramtypes', [HttpClient, String])(ReportService);

// Angular's JIT-era DI read that array to know what to construct and pass
// in, in order — no @Inject needed for CLASS types, because a class exists
// at runtime and can be looked up directly.`;

  /** Line-by-line walkthrough of {@link reflectSample}. */
  protected readonly reflectNotes: CodeNote[] = [
    {
      line: 3,
      text: 'The polyfill itself — `Reflect.metadata` is not a real JavaScript API; this import adds it. Forget it and the emitted call below throws at runtime.',
    },
    {
      line: 5,
      text: '`@Injectable()` — needs **some** decorator on the class for TypeScript to emit parameter metadata at all. An undecorated class gets none, decorator or not.',
    },
    {
      line: 7,
      text: 'Two parameters, two very different outcomes below: `HttpClient` is a class, so its type survives into the emitted metadata. `label: string` is a primitive type — TypeScript can only emit the `String` constructor for it, which is useless as a DI token.',
    },
    {
      line: 11,
      text: 'This is what `design:paramtypes` actually holds: an array of **values that exist at runtime** — the classes themselves — never type names. Only types that are also real runtime values can appear here.',
    },
    {
      line: 14,
      text: 'This is also why an interface parameter can never work this way — see the trap below.',
    },
  ];

  /** Sample: the property-decorator-vs-field-initializer trap, matching {@link Announced} and {@link AnnouncedLate}. */
  protected readonly fieldSample = `function Loud(target: object, key: string) {
  const backing = new WeakMap<object, unknown>();
  Object.defineProperty(target, key, {
    configurable: true,
    get(this: object) {
      return backing.get(this);
    },
    set(this: object, value: unknown) {
      LOG.push('setter fired — ' + key + ' = ' + JSON.stringify(value));
      backing.set(this, value);
    },
  });
}

class Announced {
  @Loud name = 'Ada';           // a class field WITH an initializer
}

class AnnouncedLate {
  @Loud declare name: string;   // \`declare\` — no runtime field at all
  constructor() {
    this.name = 'Grace';         // a plain assignment, nothing pre-empts it
  }
}`;

  /** Line-by-line walkthrough of {@link fieldSample}. */
  protected readonly fieldNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A property decorator’s legacy signature has only two useful parameters — the prototype and the key. No descriptor: there is nothing yet to describe. All it can do is install something new, like the accessor below.',
    },
    {
      line: 3,
      text: '`Object.defineProperty` on the **prototype** installs a get/set pair every instance inherits — unless something puts its own same-named property directly on the instance first. That is exactly what is about to happen on line 15.',
    },
    {
      line: 9,
      text: 'This line only runs when the **setter** actually fires. Whether it does is the entire point of this snippet.',
    },
    {
      line: 15,
      text: "`name = 'Ada'` is a class field with an initializer. Compiled with this repo’s `target: ES2022` (native class fields, `[[Define]]` semantics), this creates a brand-new property directly **on the instance**, before the constructor body even starts — which shadows the prototype accessor `@Loud` installed. The setter above never runs.",
    },
    {
      line: 19,
      text: '`declare` tells TypeScript "trust me, this exists" and erases the line entirely at compile time — no field, no `[[Define]]`, nothing. There is truly no own property here yet.',
    },
    {
      line: 21,
      text: 'With no own property in the way, this plain assignment resolves up the prototype chain and lands on `@Loud`’s setter. The log fills — proof the same decorator behaves differently depending on nothing but how the field was declared.',
    },
  ];

  /** Sample: the same `@Memoize` decorator, rewritten for TC39 stage-3. Illustrative only — this project's `experimentalDecorators: true` compiles the legacy dialect, not this one. */
  protected readonly stage3Sample = `// Stage-3 signature: (value, context) — NOT (target, key, descriptor).
// \`value\` is the method itself; \`context\` describes where it's attached.
function memoize(value: Function, context: ClassMethodDecoratorContext) {
  const cache = new Map<string, unknown>();
  // context.kind, context.name, context.private, context.static — the
  // legacy dialect made you infer all of this from the descriptor's shape.
  console.log('memoizing ' + String(context.kind) + ' "' + String(context.name) + '"');

  return function (this: unknown, ...args: unknown[]) {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, value.apply(this, args));
    return cache.get(k);
  };
}

class Math3 {
  @memoize
  fib(n: number): number {
    return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2);
  }
}`;

  /** Line-by-line walkthrough of {@link stage3Sample}. */
  protected readonly stage3Notes: CodeNote[] = [
    {
      line: 3,
      text: '`value` is the original method — what `desc.value` used to give you. `context` is new: an object describing the member, standardised so every runtime implements it the same way.',
    },
    {
      line: 7,
      text: "`context.kind` is `'method'` here (elsewhere it would be `'field'`, `'getter'`, `'setter'`, `'class'` or `'accessor'`), and `context.name` is `'fib'`. The legacy dialect never told you the kind directly — you inferred it from which arguments showed up.",
    },
    {
      line: 9,
      text: 'The return value **is** the new method — the same idea as reassigning `desc.value`, just returned instead of assigned. A stage-3 method decorator replaces by returning, always.',
    },
    {
      line: 16,
      text: 'Same call site as the legacy version: `@memoize`, no parentheses. The decorated code barely changes; only the decorator’s own implementation had to be rewritten.',
    },
  ];

  /** Sample: the legacy `@Memoize` signature, trimmed for the side-by-side comparison. */
  protected readonly legacyShapeSample = `function Memoize(target, key, desc) {
  const original = desc.value;
  desc.value = function (...args) {
    // ...
  };
}`;

  /** Sample: the stage-3 `memoize` signature, trimmed for the side-by-side comparison. */
  protected readonly stage3ShapeSample = `function memoize(value, context) {
  // context.kind === 'method'
  return function (...args) {
    // ...
  };
}`;

  /** Sample: `accessor` auto-accessors — the stage-3 syntax with no legacy equivalent. */
  protected readonly accessorSample = `class Draggable {
  accessor x = 0;   // auto-accessor: stage-3 only, no legacy equivalent
  accessor y = 0;
}
// \`accessor\` generates a private backing field plus a get/set pair for
// you — exactly the shape a logging or validating decorator needs to
// intercept, which is why stage-3 examples reach for it:
//   @logged accessor x = 0;`;

  /** Self-test 1 — application order, right after the demo that proves it. */
  protected readonly orderQuizOptions: QuizOption[] = [
    {
      text: "Second's — its factory ran second, so it must be innermost and first to fire.",
      why: 'That confuses factory **evaluation** order with wrapper **execution** order. Second’s factory running second only says when its configuring code ran; the wrapper it produced is applied first (closest to the method), which makes it the innermost layer — the one control reaches last on the way in.',
    },
    {
      text: "First's — because it applied last, it ends up wrapping everything else, so it's the outermost layer and the first code a call reaches.",
      correct: true,
      why: 'Exactly. Decorators compose like nested function calls, `First(Second(method))`. The outside function is whichever applied **last**, and outside is exactly where a call starts.',
    },
    {
      text: "Neither — decorators don't wrap anything; they just attach metadata.",
      why: 'Metadata-only decorators exist — that is mostly what Angular’s own decorators are, read by `ngtsc`. But a decorator that mutates `descriptor.value`, like `First`/`Second` here, genuinely replaces the function with a new one. Angular’s decorators are the metadata-only exception, not the rule.',
    },
    {
      text: 'It depends on the order the decorators are declared, which is decided at runtime when the class is instantiated.',
      why: 'Both the factory calls and the decorator applications happen once, at class-**definition** time — when the module loads, long before any instance exists. Nothing here is decided per-call or per-instance.',
    },
  ];

  /** Self-test 2 — the AOT-erasure trap, placed right after the dialogue and CodeLab that prove it. */
  protected readonly aotQuizOptions: QuizOption[] = [
    {
      text: 'Once — at module load, like every other decorator.',
      why: 'That is the general rule for decorators you write yourself. Angular’s own class decorators are the deliberate exception: `ngtsc` reads `@Component`’s argument object statically and never calls the function at all in an AOT build — which is what lets it disappear from the compiled output entirely.',
    },
    {
      text: 'Once per component instance created.',
      why: 'That would be true of a decorator that installs a per-instance wrapper. `@Component` never runs at all under AOT — there is no wrapper to invoke, once or a thousand times.',
    },
    {
      text: 'Zero — AOT reads its arguments statically and replaces it with ɵcmp/ɵfac before your code ever runs.',
      correct: true,
      why: 'Right. The decorator is a compile-time marker here, not a runtime mechanism — the whole reason `@Component` metadata has to be statically analyzable (no function calls, no runtime-computed strings) is that nothing ever executes it to find out.',
    },
    {
      text: 'It depends on whether the class also implements OnInit.',
      why: 'Lifecycle hooks control what runs during a component’s life; they have nothing to do with whether the compiler executes the class decorator describing it. That is decided purely by which compilation mode — JIT or AOT — is in effect.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "If a method decorator runs once for the whole class, how does `@Memoize`'s cache end up different for two different classes that both use it?",
      a: "It never gets confused between classes — only across instances of the SAME class. `@Memoize` runs once for each class it decorates, creating one `Map` closed over by that class's wrapped method. A second class using `@Memoize` gets its own separate call to the decorator, and therefore its own separate `Map`.",
    },
    {
      q: 'Does the field-initializer trap above affect Angular’s own `@Input()`?',
      a: "No — and it's worth knowing precisely why. `@Loud` only works because it installs a real runtime accessor that a plain field write can shadow. Angular's AOT compiler never lets `@Input()` run at all (the same erasure as `@Component`); it reads the decorator statically and generates plain binding instructions that read and write the field directly, no getter/setter involved. There's no accessor for an initializer to shadow, so the trap simply doesn't apply.",
    },
    {
      q: 'Why does Angular still ship the legacy dialect instead of the TC39 standard?',
      a: 'Mostly parameter decorators. `@Inject`, `@Optional`, `@Self` and friends have no stage-3 equivalent at all — the standard dropped parameter decorators entirely — and a huge amount of existing Angular code depends on them. `inject()` is the actual long-term answer: it needs no decorator of any dialect, which sidesteps the incompatibility rather than solving it.',
    },
    {
      q: 'Is `reflect-metadata` still doing anything in a modern Angular app?',
      a: "Not for DI — `inject()` and Ivy's generated factories need no reflection at all, which is a large part of why they exist. You'd only meet `reflect-metadata` today inside an older library still leaning on `emitDecoratorMetadata`, or if you hand-roll decorator-based DI outside Angular.",
    },
    {
      q: 'What is an auto-accessor, and would I use `accessor` outside a decorator?',
      a: '`accessor x = 0;` is stage-3 syntax that generates a private backing field plus a matching get/set pair for you. On its own it behaves like a normal property — the entire reason to reach for it is to give a decorator something interceptable to attach to, since a plain field (as you saw above) offers no accessor to intercept at all.',
    },
  ];
}
