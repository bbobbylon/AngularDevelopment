import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  type BubbleTurn,
  Chapter,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
} from '../../../shared/brain';
import {
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';
import { BrainPower, Scribble, Whiteboard } from '../../../shared/shapes';

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
 *
 * ## Page shape (BACKLOG §2.10 step 5, batch 6)
 *
 * Opens as `whiteboard`: a structural gotcha, not a misconception or a cost —
 * ONE mechanism (factories evaluate top-down, the decorators they return
 * apply bottom-up) drawn as two columns that run in opposite directions.
 * `app-brain-power` is posed before the figure ("which one runs first" has
 * two different correct answers depending on WHICH pass you mean);
 * `app-whiteboard` draws both passes with three `app-scribble` call-outs;
 * `app-flow` reuses the existing {@link orderFlow} (already this exact
 * story, so relocated rather than duplicated); the block's own
 * {@link orderQuizOptions} tests application order at CALL time — the
 * sharper, second half of the confusion the existing {@link aotQuizOptions}
 * (kept, later in the page) does not touch. The pre-existing opening napkin
 * and gift-wrapping analogy relocate into a new, properly labelled "mental
 * model" section right after the block, rather than being duplicated. See
 * `docs/CONTRIBUTING.md` §2C.
 */
@Component({
  selector: 'app-lesson-ts-decorators',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    Scribble,
    Whiteboard,
  ],
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

  // ── brain-friendly content ──────────────────────────────────────────────

  /** The "you are here" rail — neighbouring Language Features lessons. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Decorators' },
    { label: 'Modules & Exports', id: 'ts-modules' },
    { label: 'Promises & Async', id: 'ts-async' },
    { label: 'Optional Chaining', id: 'ts-nullish' },
  ];

  /** Factory vs decorator, arguing about who ran when. */
  protected readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'Factory',
      says: "I'm just a function call — `First()`. I run the moment the class body is being defined, top to bottom.",
    },
    {
      who: 'Decorator',
      says: "I'm what you *return*. I don't run until every factory above me already has.",
    },
    { who: 'Factory', says: "So by the time you exist, I've already logged myself." },
    {
      who: 'Decorator',
      says: 'Right — but we decorators apply bottom-up. The one written closest to the method wraps first.',
    },
    {
      who: 'Factory',
      says: 'Which means the one written on top ends up wrapping everything underneath.',
    },
    {
      who: 'Decorator',
      says: 'Same rule as `f(g(x))` — read us from the outside in to know who wraps whom.',
    },
  ];

  /** Line-by-line walkthrough of {@link orderSample}. */
  protected readonly orderNotes: CodeNote[] = [
    {
      line: 6,
      text: 'This runs the instant `First()` is evaluated — before Angular, or anything, has applied a single decorator.',
    },
    {
      line: 7,
      text: "The returned function IS the decorator. It hasn't run yet — only handed back, ready to be applied.",
    },
    {
      line: 21,
      text: '`@First()` calls the factory immediately (step 1 in the log), then holds onto whatever it returned.',
    },
    {
      line: 22,
      text: '`@Second()`, closer to the method, is evaluated second (step 2) — but applies **first** (step 3), because decorators wrap from the inside out.',
    },
  ];

  /** The two passes, drawn as a diagram — the same idea the live log proves. */
  protected readonly orderFlow: FlowStep[] = [
    { label: 'First() called', detail: 'Factory runs immediately — just a function call' },
    { label: 'Second() called', detail: 'Factories evaluate top-down, left to right' },
    {
      label: "Second's decorator applied",
      detail: 'Closest to the method wraps first',
      tone: 'accent',
    },
    {
      label: "First's decorator applied",
      detail: 'Then wraps that — like `First(Second(method))`',
      tone: 'accent',
    },
  ];

  /** Line-by-line walkthrough of {@link memoizeSample}. */
  protected readonly memoizeNotes: CodeNote[] = [
    {
      line: 5,
      text: 'Three parameters, always in this order for a method decorator — no configuration possible without wrapping this in a factory.',
    },
    {
      line: 8,
      text: "Saved before it's overwritten. Skip this and the replacement would call *itself* — infinite recursion.",
    },
    {
      line: 12,
      text: 'One `Map`, created once, when the class is defined — not once per instance.',
    },
    {
      line: 15,
      text: '`function`, deliberately not an arrow — an arrow here would capture the wrong `this`.',
    },
    {
      line: 21,
      text: 'The cache key is the stringified argument list. First call for a given `n` computes and stores; every later call for that same `n` is a lookup.',
    },
    {
      line: 28,
      text: "No `()` — a plain reference, not a call. Add parentheses and this breaks: `Memoize` isn't a factory, it IS the decorator.",
    },
    {
      line: 34,
      text: "Recursion goes through `this.fib` — the *decorated* method — so every intermediate subproblem is cached too. That's what turns exponential into linear.",
    },
  ];

  /** Line-by-line walkthrough of {@link aotSample}. */
  protected readonly aotNotes: CodeNote[] = [
    {
      line: 2,
      text: 'This decorator is read once, at build time — and then thrown away. It never appears in the compiled output below.',
    },
    {
      line: 8,
      text: '`ɵfac` — the factory the framework calls to construct your component. Generated, not written by you.',
    },
    {
      line: 9,
      text: '`ɵcmp` — the compiled component definition: your template turned into instructions, your metadata turned into static config. This is what Angular actually runs.',
    },
  ];

  /**
   * The shape block's quiz: application order at CALL time, not evaluation
   * order at class-definition time — the second, sharper half of the same
   * confusion the block's figure draws. The distractors are the three ways
   * people carry the wrong half of the lesson forward: assuming the
   * "closest wraps first" rule means closest RUNS first at call time
   * (backwards — closest means innermost, so it runs LAST), conflating
   * evaluation order with application order, and assuming stacked
   * decorators are simply unordered.
   */
  protected readonly orderQuizOptions: QuizOption[] = [
    {
      text: "Second's — it's the innermost wrapper, so its own logging runs before anything else gets a turn.",
      why: "Backwards. Being innermost means Second's wrapper is the LAST thing control reaches on the way in, not the first — First's wrapper is what actually receives the call.",
    },
    {
      text: "First's — decorators apply bottom-up, so First's wrapper ends up OUTERMOST, and an outer wrapper's own code always runs before it calls into what it wraps.",
      correct: true,
      why: "Exactly the shape the figure draws: Second's decorator applies first (step 3) but ends up on the INSIDE, closest to the real method; First's applies second (step 4) but ends up wrapping everything, on the OUTSIDE. Call `method()` and you hit the outside layer first — First's — exactly like `First(Second(method))` read from the outside in.",
    },
    {
      text: "Whichever decorator's FACTORY evaluated first — First's, since factories run top-down.",
      why: 'That answers a different question. Factory evaluation (steps 1–2) happens once, at class-definition time, long before anyone calls `method()`. Which wrapper answers a real call is decided by application order (steps 3–4) instead — the two passes this whole block exists to keep separate.',
    },
    {
      text: "It's not guaranteed — stacked decorators can apply in either order depending on the engine.",
      why: 'Fully deterministic, and specified: decorators always apply bottom-up, closest-to-the-target first, every engine, every time. Nothing here is a coin flip.',
    },
  ];

  /** Self-test: whether AOT tolerates metadata computed at runtime. */
  protected readonly aotQuizOptions: QuizOption[] = [
    {
      text: 'It works fine — decorators run at runtime anyway',
      why: 'Only true under JIT, which almost nothing uses today. AOT — the default production build — never executes `@Component` at all.',
    },
    {
      text: "The build fails: the compiler can't statically evaluate the template at build time",
      correct: true,
      why: 'ngtsc reads decorator metadata at compile time to generate `ɵcmp`. A value only known at runtime has nothing for it to read yet.',
    },
    {
      text: 'Angular falls back to JIT automatically for that one component',
      why: 'There is no per-component fallback — a build is AOT or JIT for the whole app, decided ahead of time, not component by component.',
    },
  ];

  /** The small doubts this lesson tends to leave behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'In what order do `@A() @B() method()` run?',
      a: "Factories evaluate top-down (A's factory, then B's), then the returned decorators apply bottom-up (B decorates the method, A decorates the result) — function composition, `A(B(method))`.",
    },
    {
      q: 'Does @Component execute in a production build?',
      a: 'No. AOT compilation reads it statically, generates `ɵcmp`/`ɵfac` static fields, and drops the decorator. It only executes under JIT compilation.',
    },
    {
      q: 'How many times does a method decorator run for 100 instances?',
      a: 'Once — at class-definition time, when the module first loads. The rewritten descriptor (and any closure state, like a memo cache) is shared by all 100 instances.',
    },
    {
      q: "Why can't Angular adopt TC39 decorators for @Inject?",
      a: "The stage-3 standard has no parameter decorators. That's one driver behind `inject()` — it moves DI out of constructor parameters entirely, so no parameter decoration or reflection metadata is needed.",
    },
    {
      q: 'Why must @Component metadata be statically analyzable?',
      a: "Because the AOT compiler evaluates it at build time to generate template instructions. A template or selector computed at runtime can't be compiled ahead of time — the build fails.",
    },
  ];
}
