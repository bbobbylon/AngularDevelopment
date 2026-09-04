import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * One stage of the call-stack walkthrough: what is happening, and to what.
 */
interface CallFrame {
  stage: string;
  detail: string;
  code: string;
}

/** One call of tip(50, 20), slowed down to its four moments. */
const CALL_TRACE: CallFrame[] = [
  {
    stage: '1 · The call',
    code: `const t = tip(50, 20);`,
    detail:
      'Execution reaches this line. The parentheses after a name mean "run it". Before anything is assigned to t, the program JUMPS into the function, carrying the two argument values along.',
  },
  {
    stage: '2 · Parameters filled',
    code: `function tip(bill, percent)  →  bill = 50, percent = 20`,
    detail:
      'Inside the function, the parameter names become real variables pre-loaded with the arguments, matched by position: first argument → first parameter. These boxes exist ONLY inside this call.',
  },
  {
    stage: '3 · The body runs',
    code: `return bill * (percent / 100);   // 50 * 0.2 → 10`,
    detail:
      'The body computes. When it hits return, two things happen at once: the function ENDS immediately (any lines below are skipped), and the value 10 travels back to the call site.',
  },
  {
    stage: '4 · Back at the call site',
    code: `const t = 10;   // the call was REPLACED by its return value`,
    detail:
      'The expression tip(50, 20) has collapsed into 10, and normal top-to-bottom execution resumes. Mental model: a function call is an expression that gets replaced by whatever it returns. bill and percent are gone — they lived only for the duration of the call.',
  },
];

/**
 * Lesson: Functions — the vending-machine shape (parameters in, body runs,
 * return out), a live call traced moment by moment, what happens when an
 * argument is missing or extra (default and rest parameters), scope,
 * closures, declaration-vs-expression hoisting, arrow syntax, and functions
 * as first-class values (callbacks) — the idea that unlocks `map`, every
 * Angular event binding and most of what RxJS does later.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`).
 * The reference implementation is `expert/change-detection`; this lesson copies
 * its section rhythm — eyebrow, declarative headline, ask-before-telling, then
 * mechanism in several modes — and `foundations/arrays-objects-basics`'s
 * discipline of never assuming the reader can read a snippet, since this is the
 * earliest lesson in the curriculum to reach the brain-friendly layer.
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the repetition problem before naming the fix.** Three near-identical
 *    blocks of arithmetic, then a napkin asking the reader to sketch the shape
 *    of a machine that would replace them — before "parameter" or "return" has
 *    been said once.
 * 2. **Vending machine before vocabulary.** The analogy (input → work → output,
 *    and crucially that *building* the machine does not run it) lands before
 *    "parameter", "argument", "call" and "return value" get their formal names,
 *    so the words have a picture to attach to.
 * 3. **A call traced in four live, steppable moments**, plus a predict box on
 *    nested calls (`double(double(3))`) — because "a call is replaced by its
 *    return value" is the single idea the rest of the page leans on.
 * 4. **Then the coverage gaps this lesson used to leave silent**, each folded
 *    into existing material rather than bolted on: default/rest parameters
 *    extend the tip calculator the reader is already using; closures extend
 *    Scope with a dialogue, a containment diagram, live independent counters
 *    and a quiz; declaration-vs-expression hoisting extends the arrow-function
 *    section with a comparison and a quiz; pure-vs-side-effecting and the
 *    guard-clause shape close the callbacks section.
 * 5. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *    Nothing on this page assumes the reader can already read the snippet —
 *    they are here, first in the curriculum's Functions lesson, because they
 *    cannot yet.
 */
@Component({
  selector: 'app-lesson-functions-basics',
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
  templateUrl: './functions-basics.html',
  styleUrl: './functions-basics.css',
})
export class FunctionsBasics {
  // ── Demo 1: the tip calculator ──────────────────────────────────────────

  /**
   * The bill in the tip calculator.
   */
  protected readonly bill = signal(50);
  /**
   * The tip percentage.
   */
  protected readonly percent = signal(18);
  /**
   * The tip, derived rather than stored — the demo's point is that a value
   * computed from inputs should not be a second source of truth.
   */
  protected readonly tipAmount = computed(() => (this.bill() * this.percent()) / 100);
  /**
   * The total, likewise derived.
   */
  protected readonly total = computed(() => this.bill() + this.tipAmount());

  // ── Demo 2: the call-stack walkthrough ──────────────────────────────────

  /**
   * The call-stack walkthrough stages.
   */
  protected readonly callTrace = CALL_TRACE;
  /**
   * Which stage the walkthrough is on.
   */
  protected readonly stage = signal(0);
  /**
   * Advances a stage, stopping at the last.
   */
  protected stageFwd() {
    this.stage.update((s) => Math.min(s + 1, this.callTrace.length - 1));
  }
  /**
   * Steps back a stage, stopping at the first.
   */
  protected stageBack() {
    this.stage.update((s) => Math.max(s - 1, 0));
  }

  // ── Demo 3: missing arguments, live ─────────────────────────────────────

  /**
   * Whether the "call it with the percent argument left off" checkbox is
   * ticked. Drives {@link argsReadout}, which calls both a naive and a
   * defaulted version of `tip` with the exact same (possibly missing)
   * arguments, side by side.
   */
  protected readonly omitPercent = signal(false);

  /**
   * A genuine re-implementation of the naive, no-default `tip` from the
   * anatomy section — called directly by {@link argsReadout} so the `NaN`
   * the reader sees is real, not narrated. The cast silences TypeScript's
   * complaint about dividing a possibly-`undefined` value; it changes
   * nothing at runtime, which is exactly the point — JavaScript itself
   * performs no such check.
   *
   * @param bill The bill amount.
   * @param percent The tip percent, or `undefined` to reproduce a missing argument.
   */
  private tipNaive(bill: number, percent?: number): number {
    return bill * ((percent as number) / 100);
  }

  /**
   * The same function with a default parameter — the fix.
   *
   * @param bill The bill amount.
   * @param percent The tip percent; falls back to `15` when omitted or `undefined`.
   */
  private tipSafe(bill: number, percent: number = 15): number {
    return bill * (percent / 100);
  }

  /** {@link tipNaive}, called with the demo's live bill and (maybe) omitted percent. */
  protected readonly naiveResult = computed(() =>
    this.tipNaive(this.bill(), this.omitPercent() ? undefined : this.percent()),
  );

  /** {@link tipSafe}, called with the exact same arguments. */
  protected readonly safeResult = computed(() =>
    this.tipSafe(this.bill(), this.omitPercent() ? undefined : this.percent()),
  );

  /**
   * The missing-argument demo's readout: the same bill run through the naive
   * function and the defaulted one, so the reader watches one produce `NaN`
   * silently while the other keeps working.
   */
  protected readonly argsReadout = computed(() => {
    const b = this.bill();
    const p = this.percent();
    const call = this.omitPercent() ? `tip(${b})` : `tip(${b}, ${p})`;
    const safeCall = this.omitPercent() ? `tipSafe(${b})` : `tipSafe(${b}, ${p})`;
    const naive = this.naiveResult();
    return [
      `${call}`,
      `  → ${Number.isNaN(naive) ? 'NaN' : naive}`,
      '',
      `${safeCall}      // percent = 15 by default`,
      `  → ${this.safeResult()}`,
    ].join('\n');
  });

  // ── Demo 4: closures — two independent counters ─────────────────────────

  /**
   * The factory itself, reproduced as a real method rather than narrated —
   * every call creates a fresh `count` and a fresh `increment` closing over
   * it, exactly like {@link closureSample} on the page.
   *
   * @returns A function that increments and returns its own private counter.
   */
  private createCounter(): () => number {
    let count = 0;
    return () => {
      count += 1;
      return count;
    };
  }

  /** One call to {@link createCounter} — its own private `count`. */
  private readonly counterA = this.createCounter();
  /** A second, entirely separate call — a second, entirely separate `count`. */
  private readonly counterB = this.createCounter();

  /** What counter A's button last displayed. */
  protected readonly counterAValue = signal(0);
  /** What counter B's button last displayed. */
  protected readonly counterBValue = signal(0);

  /** Presses counter A, reading the live value back out of its closure. */
  protected pressCounterA(): void {
    this.counterAValue.set(this.counterA());
  }
  /** Presses counter B — provably independent of A, since it closes over a different `count`. */
  protected pressCounterB(): void {
    this.counterBValue.set(this.counterB());
  }

  // ── Presentation data ────────────────────────────────────────────────────

  /** The Programming from Zero track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Programming Basics', id: 'programming-basics' },
    { label: 'Functions' },
    { label: 'Arrays & Objects', id: 'arrays-objects-basics' },
    { label: 'Decisions & Loops', id: 'decisions-loops' },
    { label: 'Async Basics', id: 'async-basics' },
  ];

  /**
   * Sample: the smallest possible function, called twice — the vocabulary
   * lesson's whole exhibit.
   */
  protected readonly anatomySample = `function double(n) {
  return n * 2;
}

double(5);   // 10
double(8);   // 16`;

  /** Line-by-line walkthrough of {@link anatomySample}. */
  protected readonly anatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`function` starts a **function declaration**. `double` is the name you will call it by. `(n)` declares one **parameter** — a placeholder that will hold whatever value comes in, whatever it turns out to be.',
    },
    {
      line: 2,
      text: '`return` sends a value back to wherever this function was called from, **and ends the function immediately** — nothing written after a `return` inside the same function ever runs. `n * 2` is the expression whose result travels back.',
    },
    {
      line: 5,
      text: 'The parentheses are the **call** — the only thing that makes the body actually run. `5` is the **argument**: the real value handed over for this one call, landing in the parameter `n`.',
    },
    {
      line: 6,
      text: 'Same function, a different argument. One definition, endless calls — this is the entire point of writing it as a function instead of retyping the maths.',
    },
  ];

  /**
   * Sample: what happens to a missing argument, and the default-parameter
   * fix. Line 6 is deliberately left as `?` — the CodeLab's predict strip
   * withholds the answer rather than spoiling it in a trailing comment.
   */
  protected readonly defaultsSample = `function tip(bill, percent) {
  return bill * (percent / 100);
}

tip(50, 20);   // 10 — both arguments supplied
tip(50);       // ?  — percent was never supplied

function tipSafe(bill, percent = 15) {
  return bill * (percent / 100);
}

tipSafe(50);       // 7.5 — falls back to the default
tipSafe(50, 20);   // 10  — your value wins whenever you give one`;

  /** Line-by-line walkthrough of {@link defaultsSample}. */
  protected readonly defaultsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'An ordinary two-parameter function — nothing about its definition demands that both arguments actually show up at the call site.',
    },
    {
      line: 5,
      text: 'Both arguments supplied, matched by position as always: `bill = 50`, `percent = 20`.',
    },
    {
      line: 6,
      text: "Only **one** argument. JavaScript does not complain — it never checks a call's argument count against the definition. `percent` simply becomes `undefined` for this call, and the arithmetic on line 2 runs anyway.",
    },
    {
      line: 8,
      text: "`percent = 15` after the parameter name is a **default parameter**. Read the whole signature as: 'if the caller doesn't hand me a `percent`, use `15` instead.'",
    },
    {
      line: 12,
      text: 'The default fires here, because `percent` was left out — this call behaves exactly like `tip(50, 15)` would.',
    },
    {
      line: 13,
      text: 'And the default is skipped entirely the moment a real value shows up — defaults only cover the gap, they never override a value you actually supplied.',
    },
  ];

  /**
   * Sample: extra arguments silently dropped by a fixed-arity function, then
   * the rest-parameter fix for "any number of arguments".
   */
  protected readonly restSample = `function sum3(a, b, c) {
  return a + b + c;
}

sum3(1, 2, 3, 4, 5);   // 6 — 4 and 5 were never even looked at

function sum(...numbers) {
  return numbers.length;
}

sum(1, 2, 3);        // 3
sum(1, 2, 3, 4, 5);  // 5
sum();               // 0 — zero arguments is still a valid call`;

  /** Line-by-line walkthrough of {@link restSample}. */
  protected readonly restNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Three declared parameters — `a`, `b`, `c`. Nothing stops a caller from handing over more than that.',
    },
    {
      line: 5,
      text: 'Five arguments arrive; only three parameters exist to catch them. The extras — `4` and `5` — are silently thrown away. `sum3` never even knows they were sent; only `a`, `b` and `c` get filled.',
    },
    {
      line: 7,
      text: 'Three dots before a parameter name are **rest parameters** — read them as "gather everything else". Instead of matching arguments one at a time by position, `numbers` scoops up **all** of them into a single list, however many arrive. (That list is an **array** — you will meet the type properly in the very next lesson; for now, `.length` is all you need.)',
    },
    {
      line: 11,
      text: 'Three arguments in, `numbers.length` is `3` — every one of them landed in the list, nothing dropped.',
    },
    {
      line: 13,
      text: 'Zero arguments is still a completely valid call. `numbers` is an **empty** list, not `undefined` — its `.length` is `0`.',
    },
  ];

  /**
   * Sample: the outward-only visibility rule scope runs on.
   */
  protected readonly scopeSample = `const taxRate = 0.2;              // OUTER scope

function priceWithTax(price) {
  const tax = price * taxRate;    // sees outward: taxRate is visible
  return price + tax;
}

priceWithTax(100);   // 120
// tax;               // ReferenceError — tax only exists INSIDE the function`;

  /** Line-by-line walkthrough of {@link scopeSample}. */
  protected readonly scopeNotes: CodeNote[] = [
    {
      line: 1,
      text: "Declared at the **top level** — this is what 'outer scope' means: nothing wraps it.",
    },
    {
      line: 3,
      text: 'A new scope begins the moment this function is defined. Anything declared **inside** these braces will be invisible outside them.',
    },
    {
      line: 4,
      text: 'Reads `taxRate` from **outside** its own scope. A function can always see outward to variables declared around it — one-way visibility, inside-out.',
    },
    {
      line: 8,
      text: 'The call. `price` is filled with `100` for this call only; when the call ends, both `price` and `tax` vanish.',
    },
    {
      line: 9,
      text: 'Commented out on purpose — this line would throw `ReferenceError: tax is not defined`. `tax` was born inside `priceWithTax` and dies with it; the outer scope can never see inward.',
    },
  ];

  /**
   * Sample: a closure factory — `makeCounter()` called twice, producing two
   * provably independent counters.
   */
  protected readonly closureSample = `function makeCounter() {
  let count = 0;

  return function increment() {
    count += 1;
    return count;
  };
}

const counterA = makeCounter();
const counterB = makeCounter();

counterA();   // 1
counterA();   // 2
counterB();   // 1  ← independent!`;

  /** Line-by-line walkthrough of {@link closureSample}. */
  protected readonly closureNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A perfectly ordinary function — nothing about this line is special yet.',
    },
    {
      line: 2,
      text: 'A **local** variable. Everything taught in the Scope section above says this should be destroyed the instant `makeCounter` finishes running.',
    },
    {
      line: 4,
      text: 'Instead of returning a plain value, this `return`s **another function** — `increment`, defined right here, nested inside `makeCounter`. Being born inside is exactly what lets it see `count` at all.',
    },
    {
      line: 5,
      text: "Reads **and** writes the outer `count`. Legal only because `increment` was defined inside `makeCounter`'s scope — the same outward-visibility rule as the tax example, just one level deeper.",
    },
    {
      line: 10,
      text: 'Calls `makeCounter()` **once**. It runs top to bottom, creates its own private `count`, and hands back `increment` — but this time `count` is not thrown away, because the function it just returned still needs to read and write it.',
    },
    {
      line: 11,
      text: 'Calls `makeCounter()` **again** — a separate call, which means a separate `count`, starting fresh from `0`. Two calls in, two completely private boxes now exist.',
    },
    {
      line: 13,
      text: "`counterA`'s `increment` bumps `counterA`'s own private `count` from `0` to `1`. There is nothing shared here for `counterB` to notice.",
    },
    {
      line: 15,
      text: '`counterB` has never been called before this line, so its private `count` is still sitting at `0` — this press takes it to `1`, completely unaffected by the two presses of `counterA` immediately above.',
    },
  ];

  /**
   * Sample: the classic and arrow spellings of the same function, ending
   * with the implicit-vs-explicit-return distinction.
   */
  protected readonly arrowSample = `// classic:
function add(a, b) {
  return a + b;
}

// arrow — read "=>" as "goes to":
const add2 = (a, b) => a + b;

// with braces you're back to writing return yourself:
const add3 = (a, b) => {
  const sum = a + b;
  return sum;
};

// one parameter may drop its parentheses:
const double = n => n * 2;`;

  /** Line-by-line walkthrough of {@link arrowSample}. */
  protected readonly arrowNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The classic form — same `function` keyword and `return` you saw in the very first example on this page.',
    },
    {
      line: 7,
      text: "`=>` reads as **'goes to'**: `(a, b) => a + b` is 'a and b go to a + b'. No braces means a **single expression**, and a single expression's value is returned automatically — there is no `return` keyword anywhere on this line, and none is needed.",
    },
    {
      line: 10,
      text: 'The moment you add `{ }`, you are back to writing a **full function body** — one or more statements, and nothing comes back out unless you say so explicitly.',
    },
    {
      line: 12,
      text: 'So `return` is required again here, exactly like the classic form on line 3. Leave it off and `add3` silently hands back `undefined` — see the predict box just below for precisely this trap.',
    },
    {
      line: 16,
      text: 'Exactly **one** parameter is the one case where the parentheses around it are optional — `n => n * 2` and `(n) => n * 2` mean the same thing. Zero parameters or two-plus always need them.',
    },
  ];

  /** Sample for the arrow-implicit-return predict box. */
  protected readonly arrowTrapSample = `const sum = (a, b) => {
  a + b;
};

sum(2, 3);   // ?`;

  /** Sample for the nested-call predict box. */
  protected readonly nestedCallSample = `function double(n) {
  return n * 2;
}

double(double(3));`;

  /** Sample: a function declaration, hoisted whole. */
  protected readonly declarationSample = `greet('Ada');   // 'Hi Ada' — works, even called first

function greet(name) {
  return 'Hi ' + name;
}`;

  /** Sample: a function expression stored in `const`, not hoisted. */
  protected readonly expressionSample = `greet('Ada');   // ReferenceError: Cannot access
                // 'greet' before initialization

const greet = (name) => 'Hi ' + name;`;

  /**
   * Sample: functions as values — three different callers, one identical
   * rule, and the classic "called it by accident" bug.
   */
  protected readonly callbackSample = `const shout = (name) => name.toUpperCase() + '!';

['ada', 'grace'].map(shout);
// ['ADA!', 'GRACE!'] — map calls shout once per item

button.addEventListener('click', onSave);
// the browser calls onSave once per click

setTimeout(ping, 2000);
// the timer calls ping after 2 seconds

setTimeout(ping(), 2000);
// ping ran RIGHT NOW — setTimeout got whatever ping returned, probably undefined`;

  /** Line-by-line walkthrough of {@link callbackSample}. */
  protected readonly callbackNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Nothing new — `shout` is a function stored in a `const`, the same shape as `add2` earlier.',
    },
    {
      line: 3,
      text: '**No parentheses after `shout`.** Passing `shout` — the machine, unpressed — is completely different from passing `shout()` — the machine, pressed right now. `map` is what does the calling here, once per item; you will meet it properly in the very next lesson, but for now: it hands each array item to `shout` in turn and collects what comes back.',
    },
    {
      line: 6,
      text: 'Same shape, a different caller: the **browser** calls `onSave` for you, whenever a click actually happens. You never call it yourself — you just hand it over and wait.',
    },
    {
      line: 9,
      text: 'And a **timer** calls `ping` — later, not immediately. Three completely different callers across this sample — `map`, the browser, `setTimeout` — and one identical rule: hand over the function itself, unpressed.',
    },
    {
      line: 12,
      text: '**The classic bug.** Parentheses call `ping` **immediately**, right here on this line, before `setTimeout` is even involved. Whatever `ping` returns — often `undefined` — is what actually gets passed to `setTimeout`. Two seconds later, nothing happens, because there was never a function sitting there to call.',
    },
  ];

  /** Sample: a pure function — same input, same output, touches nothing outside. */
  protected readonly pureSample = `function withTax(price, rate) {
  return price * (1 + rate);
}

withTax(100, 0.2);   // 120 — always, no matter how many times you call it`;

  /** Sample: the same job, done with a side effect instead. */
  protected readonly sideEffectSample = `let cartTotal = 0;

function addToCart(price) {
  cartTotal += price;   // reaches OUTSIDE itself
}

addToCart(20);   // returns undefined — the real work was the side effect`;

  /** Sample: the guard-clause shape, using "return ends the function" on purpose. */
  protected readonly guardSample = `function save(user) {
  if (!user) return;    // guard clause — bail out early
  sendToServer(user);   // the real work, un-nested
}`;

  /**
   * The exchange a closure actually depends on — `increment` reaching
   * outward for `count`, and the engine keeping `makeCounter`'s scope alive
   * because something can still reach into it.
   *
   * Prose describing "the inner function keeps a reference to the enclosing
   * scope" is a sentence a beginner can read and take nothing from. Staging
   * it as a conversation — one party asking why it isn't being destroyed,
   * the other explaining that it is still being held onto — makes the
   * mechanism the thing that sticks, not the definition.
   */
  protected readonly closureTalk: BubbleTurn[] = [
    {
      who: 'increment (the inner function)',
      says: "I need to read and change `count`. I don't see one declared anywhere inside me.",
    },
    {
      who: 'makeCounter (the outer function)',
      says: 'I declared one. You were born inside me, so you can see outward into my scope — same rule as any nested block.',
    },
    {
      who: 'increment',
      says: "Fair. But you're about to finish running and hand me back to whoever called you. Won't `count` be destroyed the moment you return?",
    },
    {
      who: 'makeCounter',
      says: "Normally, yes. But you're still holding onto me — the engine can see that, so it keeps my scope alive instead of discarding it.",
    },
    {
      who: 'increment',
      says: "So every time I get called, I'm not remembering a copy of `count` — I'm reaching into the one and only version that lives in the scope I was born in.",
    },
    {
      who: 'A second call to makeCounter()',
      says: 'And I create a whole new version of that scope, with my own `count`. Nothing my sibling `increment` sees can reach mine, or the other way round.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'I passed one argument to a function that expects two, and nothing crashed. Is that normal?',
      a: "Completely normal, if a little alarming the first time. JavaScript never checks argument counts against a function's definition — a missing argument simply becomes `undefined` inside the function, and any arithmetic done with it becomes `NaN`. Nothing throws until *you* try to use that `NaN` or `undefined` somewhere that demands a real value, often several lines later and far from the actual mistake. Default parameters (`percent = 15`) are the fix for arguments you expect might go missing; there is no way to make JavaScript itself refuse a wrong count — that is exactly the kind of thing TypeScript's compiler catches, at build time rather than at runtime.",
    },
    {
      q: "If I change a parameter's value inside a function, does that affect the variable the caller passed in?",
      a: "For plain values — numbers, strings, booleans — no, never. The parameter got its own private copy, and reassigning it inside the function just points that local copy somewhere else; `bill = bill + 5;` inside `tip` leaves the caller's original variable completely untouched. Objects and arrays are a different story: what gets copied into the parameter is a **reference**, and mutating whatever it points to reaches back to the caller. That distinction — and exactly why it matters — gets its own full treatment in the very next lesson.",
    },
    {
      q: "If closures 'remember' a variable forever, doesn't that leak memory?",
      a: "It keeps memory alive for as long as something can still reach it — which is not the same as forever. The moment nothing holds a reference to `counterA` any more, the garbage collector can see that its private `count` is now unreachable by anything, and frees it, exactly like any other variable that falls out of use. 'Remembers forever' is really 'remembers for as long as it's kept around' — closures don't get a special exemption from garbage collection, they just change what counts as reachable.",
    },
    {
      q: 'Can a function call itself?',
      a: "Yes — it's called **recursion**, and it's the natural way to process anything shaped like 'a thing that contains more of the same thing' (nested folders, nested comments, a tree of components). Every recursive function needs a **base case** — a condition where it stops calling itself and just returns — or it calls itself forever until the program gives up with `RangeError: Maximum call stack size exceeded`, the recursive cousin of an infinite loop. It's a big enough idea to deserve its own proper treatment later in the curriculum; for now, just recognise the shape: a function with its own name inside its own body.",
    },
    {
      q: '`makeCounter()` returned a function. Is that a special trick for teaching closures, or does real code do that?',
      a: "Real code does it constantly — a function that accepts or returns another function is called a **higher-order function**, and you are about to meet a whole family of them. `array.map()`, coming in the very next lesson, *takes* a function as an argument; Angular's `computed()` does too. `makeCounter` returning `increment` is not a special case built for this page — it is the everyday shape of a huge amount of code you are about to write.",
    },
  ];

  /**
   * Self-test 0 — the scope-isolation check (originally an "exam corner"
   * item in this lesson's pre-migration version), confirming each call gets
   * its own private copies of its parameters.
   */
  protected readonly scopeQuizOptions: QuizOption[] = [
    {
      text: 'Yes — there is only one bill variable, and the second call overwrites it.',
      why: 'That would be true for a single shared variable declared outside any function. Parameters are not that — each call creates its own fresh copy, invisible to every other call.',
    },
    {
      text: 'No — every call gets its own private copies of its parameters and locals.',
      correct: true,
      why: 'Exactly. Scope is created per call, not per function. A hundred simultaneous calls to `tip` would produce a hundred completely independent sets of boxes.',
    },
    {
      text: 'It depends on whether the calls run synchronously or not.',
      why: 'Timing has nothing to do with it — even two calls that finish in the same tick get separate scopes. What matters is that each is a distinct call, full stop.',
    },
    {
      text: 'Only if you forget to declare bill with const or let inside the function.',
      why: 'A parameter is automatically local — there is no way to accidentally make it shared by omitting a keyword. Every parameter behaves as if declared fresh, every single call.',
    },
  ];

  /**
   * Self-test 1 — the arrow-implicit-return trap is answered by
   * {@link Predict} instead; this quiz targets the OTHER classic slip in the
   * same neighbourhood: order-of-definition, which the compare panels above
   * illustrate but do not, on their own, force the reader to commit to.
   */
  protected readonly hoistingQuizOptions: QuizOption[] = [
    {
      text: "It doesn't really throw — the console just shows a warning.",
      why: "It's a hard error — `ReferenceError`, not a warning. Reaching a `const` before its own line has run stops execution completely; nothing after it in that scope runs either.",
    },
    {
      text: "The arrow function is somehow 'slower' to define than a regular function.",
      why: 'Speed has nothing to do with it — both lines run at the same moment, top to bottom. What differs is what JavaScript does when it first scans the file, before running anything: for a `function` declaration it registers the *whole function*; for `const greet = …` it only registers the *name*, locked, until its own line executes.',
    },
    {
      text: 'Function declarations are hoisted with their entire body; `const` is only hoisted as a locked, empty binding.',
      correct: true,
      why: "Exactly the asymmetry. 'Hoisted' does not mean 'not hoisted' for `const` — the name is reserved from the top of the scope either way. The difference is whether anything useful is attached to it yet.",
    },
    {
      text: '`const` variables can never be functions, only values like numbers and strings.',
      why: 'A function is a value, and `const` can hold any value — including a function, as `greet` in the right-hand panel above proves once its own line has run. The restriction is about *timing*, not *type*.',
    },
  ];

  /**
   * Self-test 2 — the closures comprehension check.
   *
   * The first distractor is the misconception the whole section exists to
   * break — that two calls to a factory share one piece of state — so its
   * `why` gets the most room.
   */
  protected readonly closureQuizOptions: QuizOption[] = [
    {
      text: '4 — one shared count is now on its fourth press.',
      why: 'That would be true if both calls returned the SAME inner function sharing one `count`. But `makeCounter()` ran twice, and every call to a function creates a fresh scope. `counterA` and `counterB` were born from two separate calls, so they got two separate `count` variables — pressing one can never advance the other.',
    },
    {
      text: '1',
      correct: true,
      why: "counterB's `count` started at 0 the moment its own `makeCounter()` call ran — a call that has nothing to do with counterA's. One press takes it from 0 to 1, no matter how many times counterA was pressed first.",
    },
    {
      text: 'undefined — counterB was never initialised.',
      why: "counterB was fully initialised the moment `makeCounter()` ran for it — that call created its own `count = 0` and its own `increment`. `undefined` would only happen if `makeCounter` forgot its own `return`, which this code doesn't.",
    },
    {
      text: 'It throws, because count was already used by counterA.',
      why: "Variables aren't 'used up' by being read or written, and there's nothing here that would throw. The tempting logic is treating `count` as if it were one shared box; it's two, and closures are exactly the mechanism that keeps them apart.",
    },
  ];
}
