import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { highlight } from '../../../shared/highlighter';

// ── Types used by the live demos ──────────────────────────────────────────────

/**
 * One arm of the {@link Pet} union.
 */
interface Cat {
  type: 'cat';
  meow(): string;
}

/**
 * The other arm of the {@link Pet} union.
 */
interface Dog {
  type: 'dog';
  bark(): string;
}

/**
 * A union of two object types sharing a literal `type` field — the discriminant
 * that makes narrowing possible.
 */
type Pet = Cat | Dog;

/**
 * A user-defined type guard, used by the cat/dog demo below.
 *
 * The `p is Cat` return type is the whole point: to the compiler this is not a
 * function returning `boolean`, it is a function that *proves* something. Inside
 * an `if (isCat(p))` the type is narrowed to `Cat`, which a plain `boolean`
 * return would not achieve.
 *
 * It is also the lesson's own worked example of the trust problem — nothing here
 * is verified by the compiler beyond "`Cat` is a possible type for `p`". The
 * body could `return true` and every call site would still narrow.
 *
 * @param p The pet to test.
 * @returns Whether it is a cat — and, to the type system, evidence of it.
 */
function isCat(p: Pet): p is Cat {
  return p.type === 'cat';
}

/**
 * The classic three-state load union.
 *
 * Modelled as a union rather than as `{ loading: boolean; data?: string[];
 * error?: string }` on purpose: the union makes the impossible states
 * unrepresentable, so "loaded but also errored" cannot be constructed at all.
 */
type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; data: string[] }
  | { status: 'error'; message: string };

// ── The guard bench: modelling what the compiler is tracking ──────────────────

/**
 * The eight strings JavaScript's `typeof` operator can return. Only the five
 * this lesson's demo union can produce are listed.
 */
type TypeofTag = 'string' | 'number' | 'object' | 'undefined' | 'function';

/**
 * How a type behaves under a bare `if (value)`.
 *
 * `either` is the interesting one, and the whole reason truthiness narrowing is
 * a trap: `string` and `number` contain both falsy values (`''`, `0`, `NaN`) and
 * truthy ones, so they cannot be removed from *either* branch.
 */
type Truthiness = 'always' | 'never' | 'either';

/**
 * One member of the demo union, plus every runtime fact a guard can interrogate.
 *
 * This interface is the demo's whole trick: a narrowing guard is not magic, it
 * is a *predicate over the members of a union*. Give each member the handful of
 * observable facts (`typeof` tag, is-it-an-array, is-it-a-Date, how it behaves
 * when coerced to boolean) and every built-in guard becomes a one-line filter —
 * which is very close to what the compiler is actually doing.
 */
interface Candidate {
  /** Stable key for `@for` tracking. */
  readonly id: string;
  /** How the type is written in source, e.g. `string[]`. */
  readonly label: string;
  /** What `typeof` reports for a value of this type at runtime. */
  readonly tag: TypeofTag;
  /** Whether `Array.isArray()` returns true for it. */
  readonly array: boolean;
  /** Whether it is an instance of `Date`. */
  readonly date: boolean;
  /** How it behaves in a truthiness test. */
  readonly truthiness: Truthiness;
  /** A member call that becomes legal once this is the only survivor. */
  readonly can: string;
}

/**
 * The union the bench narrows: `string | number | string[] | Date | null`.
 *
 * Chosen so that every classic trap is reachable in two clicks — `null` shares a
 * `typeof` tag with `Date` and `string[]`, arrays and dates are both `'object'`,
 * and `string`/`number` are the two members truthiness cannot eliminate.
 */
const UNION: readonly Candidate[] = [
  {
    id: 'string',
    label: 'string',
    tag: 'string',
    array: false,
    date: false,
    truthiness: 'either',
    can: "x.trim() — and every other method on String.prototype. Note that '' is a string too, so a truthiness check never fully cleared it.",
  },
  {
    id: 'number',
    label: 'number',
    tag: 'number',
    array: false,
    date: false,
    truthiness: 'either',
    can: 'x.toFixed(2) — a Number.prototype method. 0 and NaN are numbers, which is why if (x) is the wrong tool for this one.',
  },
  {
    id: 'array',
    label: 'string[]',
    tag: 'object',
    array: true,
    date: false,
    truthiness: 'always',
    can: "x.join(', ') and x.length. An array is an object, so typeof reports 'object' — Array.isArray is the only reliable way to pick it out.",
  },
  {
    id: 'date',
    label: 'Date',
    tag: 'object',
    array: false,
    date: true,
    truthiness: 'always',
    can: 'x.toISOString(). Date is a real class with a prototype, so instanceof works on it — unlike an interface, which is erased before runtime.',
  },
  {
    id: 'null',
    label: 'null',
    tag: 'object',
    array: false,
    date: false,
    truthiness: 'never',
    can: 'nothing at all — reading any property of null throws. The compiler is telling you the check you still owe it.',
  },
];

/** Which side of an `if` the reader chose to walk down. */
type Branch = 'true' | 'false';

/**
 * One guard the bench can apply, as the compiler models it: a source string to
 * show, and a predicate saying which union members survive its *true* branch.
 *
 * For every guard that asks a *type-level* question — `typeof`, `instanceof`,
 * `Array.isArray`, equality against a literal — the else branch is the exact
 * complement, and that symmetry is the point the demo exists to make visible,
 * because "the else narrows too" is the single most under-appreciated fact
 * about control-flow analysis. So {@link keepsElse} defaults to `!keeps`.
 *
 * Truthiness is the exception, and it is the whole reason {@link keepsElse}
 * exists as a separate hook rather than being derived. `if (x)` does not
 * partition a union: `string` and `number` each contain both falsy and truthy
 * values, so they survive on **both** sides and neither branch is the other's
 * complement. Deriving the else side would make the bench report `null` alone
 * for `else { … }`, which is precisely the wrong answer this lesson exists to
 * correct. Verified against `tsc` 5.9: the else branch of `if (x)` over this
 * union is `string | number | null`.
 */
interface Guard {
  /** Stable key for `@for` tracking and for the button's DOM identity. */
  readonly id: string;
  /** The guard as you would type it. */
  readonly source: string;
  /** Members that survive the *true* branch. */
  readonly keeps: (c: Candidate) => boolean;
  /**
   * Members that survive the *else* branch. Omit it for any guard whose two
   * branches really are complements — the fold falls back to `!keeps`.
   */
  readonly keepsElse?: (c: Candidate) => boolean;
  /** What the compiler concluded, when the reader took the true branch. */
  readonly whenTrue: string;
  /** What it concluded on the else side. */
  readonly whenFalse: string;
}

/**
 * The guards on the bench, in the order they are worth trying.
 *
 * `typeof x === 'object'` is deliberately second: it is the one that surprises
 * people, and having it early means most readers hit the `null` survival within
 * their first two clicks rather than after they have stopped experimenting.
 */
const GUARDS: readonly Guard[] = [
  {
    id: 'typeof-string',
    source: "typeof x === 'string'",
    keeps: (c) => c.tag === 'string',
    whenTrue:
      'Only members whose runtime typeof tag is "string" survive. That is exactly one of them.',
    whenFalse:
      'Everything whose tag is NOT "string" survives. The else branch narrows just as hard as the if — it simply keeps the complement.',
  },
  {
    id: 'typeof-object',
    source: "typeof x === 'object'",
    keeps: (c) => c.tag === 'object',
    whenTrue:
      'Date, string[] AND null all report "object". typeof null === "object" is a bug from the first JavaScript in 1995 that can never be fixed, and TypeScript models the language as it really is.',
    whenFalse:
      'Only the primitives survive: string and number. null is not on this side — it answered "object" to the guard, so it walked down the other branch. Every member you did not eliminate is a member you now have to handle.',
  },
  {
    id: 'not-null',
    source: 'x !== null',
    keeps: (c) => c.id !== 'null',
    whenTrue:
      'Equality against null removes exactly one member. This is the check every typeof-object guard owes you.',
    whenFalse:
      'The else of x !== null is x === null, so null is all that is left. The compiler subtracts in both directions.',
  },
  {
    id: 'is-array',
    source: 'Array.isArray(x)',
    keeps: (c) => c.array,
    whenTrue:
      'Array.isArray is declared in the standard library as a type predicate (arg is any[]), which is the only reason a plain function call can narrow anything.',
    whenFalse:
      'Everything that is not an array survives — including null, which is not an array but is still "object".',
  },
  {
    id: 'instanceof-date',
    source: 'x instanceof Date',
    keeps: (c) => c.date,
    whenTrue:
      'instanceof walks the prototype chain looking for Date.prototype. It works because Date is a real class at runtime.',
    whenFalse: 'Date is subtracted. Everything else, null included, is still on the list.',
  },
  {
    id: 'truthy',
    source: 'if (x)',
    keeps: (c) => c.truthiness !== 'never',
    keepsElse: (c) => c.truthiness !== 'always',
    whenTrue:
      'Truthiness only removes members that are ALWAYS falsy. string and number both survive, because "" and 0 are perfectly ordinary values of those types.',
    whenFalse:
      'Look closely: string and number are STILL here, alongside null. This is the only guard on the bench whose else branch is not the complement of its if — "" is a string and 0 is a number, so neither type can be eliminated on either side. The falsy trap, in one line.',
  },
];

/** One applied step, kept so the trace can be replayed and undone. */
interface Step {
  readonly guard: Guard;
  readonly taken: Branch;
}

/** A rendered trace row: what was applied, and what the compiler thought after it. */
interface TraceRow {
  readonly n: number;
  readonly source: string;
  readonly result: string;
  readonly note: string;
  readonly removed: number;
}

/** A rendered shortlist chip: a union member and whether it is still in play. */
interface ShortlistEntry {
  readonly id: string;
  readonly label: string;
  readonly out: boolean;
}

// ── The second demo: what survives between the check and the use ──────────────

/**
 * One thing that can happen between narrowing a value and using it.
 *
 * Every `survives` flag here was verified against TypeScript 5.9 in strict mode
 * rather than recalled, because this is precisely the area where the folklore is
 * wrong. In particular: an ordinary function call and an `await` do **not**
 * discard narrowing on a property, even though the value really can have changed
 * underneath you. That unsoundness is deliberate on the TypeScript team's part,
 * and it is far more useful to teach than the widespread belief that any call
 * resets everything.
 */
interface Interruption {
  /** Stable key, and the value the button's `aria-pressed` state keys off. */
  readonly id: string;
  /** Button copy. */
  readonly label: string;
  /** The whole snippet, so each case reads honestly rather than as a fragment. */
  readonly code: string;
  /** Whether the narrowing is still in force on the line that uses the value. */
  readonly survives: boolean;
  /** The one-line verdict shown beside the badge. */
  readonly verdict: string;
  /** Why the compiler behaves this way — the actual teaching. */
  readonly why: string;
}

/** The interruptions the survival bench can put between the check and the use. */
const INTERRUPTIONS: readonly Interruption[] = [
  {
    id: 'none',
    label: 'nothing at all',
    survives: true,
    verdict: 'x is string',
    why: 'The baseline. One guard, one use, nothing in between — narrowing holds from the check to the closing brace of the branch.',
    code: `function use(x: string | null) {
  if (x === null) return;

  x.length;   // ✓ x: string
}`,
  },
  {
    id: 'reassign',
    label: 'reassign it — x = read()',
    survives: false,
    verdict: 'narrowing LOST — x is string | null again',
    why: 'An assignment is the one thing that genuinely resets control-flow analysis. The compiler re-narrows to the type of whatever you just assigned, and read() is declared as string | null, so every name is back on the shortlist. Reassignment is the only entry in this list that TypeScript treats as a hard reset.',
    code: `function use(x: string | null, read: () => string | null) {
  if (x === null) return;

  x = read();

  x.length;   // ✗ 'x' is possibly 'null'
}`,
  },
  {
    id: 'closure-reassigned',
    label: 'use it in a callback, and reassign x later',
    survives: false,
    verdict: "narrowing LOST — error 18047: 'x' is possibly 'null'",
    why: 'The callback body runs at an unknown time. If x is assigned ANYWHERE in the enclosing function — even ten lines below, even after the callback was created — the compiler cannot know which value the callback will see when it finally runs, so it falls back to the declared type.',
    code: `function use(x: string | null) {
  if (x === null) return;

  setTimeout(() => x.length);   // ✗ 'x' is possibly 'null'

  x = null;   // ← this line, anywhere in the function, is what breaks it
}`,
  },
  {
    id: 'closure-const',
    label: 'use it in a callback, never reassign x',
    survives: true,
    verdict: 'x is string — narrowing survives (TS 5.4+)',
    why: 'Same callback, one difference: nothing assigns to x. A variable that is never assigned anywhere is treated as effectively const, so its narrowing has always been safe to carry into a callback — the compiler knows there is no later value for the callback to see. TypeScript 5.4 widened the rule to cover functions created after the LAST assignment, which is why so much old advice about closures is now out of date. Capturing into a const first (const held = x) is the version that works on every compiler and still reads better.',
    code: `function use(x: string | null) {
  if (x === null) return;

  setTimeout(() => x.length);   // ✓ x is never assigned, so this holds

  const held = x;
  setTimeout(() => held.length);   // ✓ a const can never change
}`,
  },
  {
    id: 'call',
    label: 'call some unrelated function',
    survives: true,
    verdict: 'compiles — and this is the dangerous one',
    why: 'You probably expected an error. TypeScript deliberately does NOT invalidate narrowing after an arbitrary call: almost every line of real code calls something, and resetting each time would make narrowed code unwritable. So it assumes refresh() did not touch state.name. When that assumption is wrong you get a clean build and a runtime crash — the best-known soundness hole in control-flow analysis.',
    code: `function use(state: { name: string | null }, refresh: () => void) {
  if (state.name === null) return;

  refresh();   // may well set state.name = null

  state.name.length;   // ✓ compiles. ✗ can throw at runtime.
}`,
  },
  {
    id: 'await',
    label: 'await something',
    survives: true,
    verdict: 'compiles — same hole, longer window',
    why: 'An await is an ordinary expression as far as narrowing is concerned, so the narrowing survives it. The difference is the runtime risk: an await hands control back to the event loop, so every other handler in your app gets a turn before the next line runs. Same optimism as a plain call, with far more time for reality to move.',
    code: `async function use(state: { name: string | null }, save: () => Promise<void>) {
  if (state.name === null) return;

  await save();   // the whole app runs while this is pending

  state.name.length;   // ✓ compiles. ✗ can throw at runtime.
}`,
  },
  {
    id: 'getter',
    label: 'read it through a get accessor',
    survives: true,
    verdict: 'compiles — and calls the getter twice',
    why: 'TypeScript narrows a get accessor exactly like a stored property, because it has no way to tell them apart at a call site. But every mention of session.token RUNS the getter. The guard calls it once, the use calls it again, and a getter that computes or expires can return null the second time. If a getter can change its answer, read it into a const once and narrow the const.',
    code: `class Session {
  get token(): string | null {
    return Date.now() % 2 ? 'abc' : null;   // a different answer each call
  }
}

function use(session: Session) {
  if (session.token === null) return;

  session.token.length;   // ✓ compiles, ✗ second call may be null
}`,
  },
  {
    id: 'signal',
    label: 'read it through a signal — user()',
    survives: false,
    verdict: 'never narrowed at all — TS2531',
    why: 'The one that bites hardest in an Angular codebase. TypeScript only narrows a REFERENCE: a plain identifier, a property access like state.name, an element access with a literal index, or this. A call expression is none of those. Two calls to user() are two separate expressions, and the compiler will not assume they return the same value — so the check on the first one tells it nothing about the second. Note how badly this contrasts with the getter above: session.token IS a property access, so it narrows even though it can change; user() cannot change under you and does not narrow. The fix is the const you have been reading about all page, and the template spelling of it is @if (user(); as u).',
    code: `// user is a signal: calling it reads the value out.
function show(user: () => User | null) {
  if (user()) {
    user().name;   // ✗ TS2531 'user()' is possibly 'null'
  }

  const u = user();
  if (u) u.name;   // ✓ one call, one reference, narrowing sticks
}`,
  },
  {
    id: 'boundary',
    label: 'hand it to a helper function',
    survives: false,
    verdict: 'narrowing does not cross the boundary',
    why: 'Narrowing is per-function bookkeeping and it stops at the parameter list. Inside show(), the compiler knows only what show declares — string | null — no matter how thoroughly you checked at the call site. That is a feature: it is what lets you read a function in isolation. The fix is to declare the parameter as the narrow type and let the caller prove it.',
    code: `function show(v: string | null) {
  v.length;   // ✗ 'v' is possibly 'null' — the caller's check means nothing here
}

function use(x: string | null) {
  if (x === null) return;
  show(x);   // x is string HERE, but show only ever sees its own declaration
}`,
  },
];

// ── The lesson component ──────────────────────────────────────────────────────

/**
 * Lesson: type narrowing — control-flow analysis as a shrinking shortlist of
 * candidate types, every built-in guard with the quirk that catches people out
 * (`typeof null === 'object'`, truthiness eating `0` and `''`, `in` counting
 * optional properties, `instanceof` failing on interfaces and across realms),
 * discriminated unions as the exam-critical pattern, user-defined predicates and
 * assertion functions as *unchecked promises*, exhaustiveness via `never`, and
 * the five ways narrowing is lost or silently becomes a lie.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order is
 * deliberate:
 *
 * 1. **Pose the problem first.** The lesson opens on "why can't I call anything
 *    on a union?" and puts a napkin prediction in front of the reader before any
 *    mechanism is named.
 * 2. **Analogy, then vocabulary.** The shortlist-of-suspects frame gives the
 *    reader somewhere to put "control-flow analysis" before that phrase appears.
 *    Every later section is a variation on crossing names off the list.
 * 3. **The same idea in four modes** — a flow diagram, a live bench whose chips
 *    visibly go out, annotated code, and a dialogue between the compiler and a
 *    lying guard.
 * 4. **The traps are load-bearing, not decoration.** Every claim about *when*
 *    narrowing survives was verified against `tsc` 5.9 in strict mode rather
 *    than recalled, because the folklore in this area is measurably wrong — an
 *    arbitrary call and an `await` do not reset narrowing, and saying they do
 *    teaches the reader to distrust the wrong line.
 *
 * ## Demos
 *
 * Four, all signal-driven: the guard bench (apply a guard, watch the shortlist
 * shrink, reach `never`), the survival bench (choose what happens between the
 * check and the use), the discriminated-union state machine, and the
 * custom-guard cat/dog picker.
 */
@Component({
  selector: 'app-lesson-ts-narrowing',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './narrowing.html',
  styleUrl: './narrowing.css',
})
export class Narrowing {
  // ── Demo 1: the guard bench ────────────────────────────────────────────────

  /** The guards the reader can apply. */
  protected readonly guards = GUARDS;

  /** Which side of the next guard the reader wants to walk down. */
  protected readonly branch = signal<Branch>('true');

  /** The guards applied so far, in order. Empty means "nothing narrowed yet". */
  private readonly steps = signal<Step[]>([]);

  /**
   * The fold: replay every applied step over the full union.
   *
   * Done in one computed rather than two so the intermediate result after each
   * step is captured for the trace as it goes — recomputing the prefix for every
   * row would be the same work done N² times for no benefit.
   */
  private readonly folded = computed(() => {
    let alive: Candidate[] = [...UNION];
    const trace: TraceRow[] = [];

    this.steps().forEach((step, index) => {
      const before = alive.length;
      const keepsElse = step.guard.keepsElse ?? ((c: Candidate) => !step.guard.keeps(c));
      alive = alive.filter((c) => (step.taken === 'true' ? step.guard.keeps(c) : keepsElse(c)));
      trace.push({
        n: index + 1,
        source:
          step.taken === 'true'
            ? `if (${step.guard.source})`
            : `else  // ${step.guard.source} was false`,
        result: alive.length ? alive.map((c) => c.label).join(' | ') : 'never',
        note: step.taken === 'true' ? step.guard.whenTrue : step.guard.whenFalse,
        removed: before - alive.length,
      });
    });

    return { alive, trace };
  });

  /** The union members the compiler still considers possible. */
  protected readonly alive = computed(() => this.folded().alive);

  /** The applied steps, rendered. */
  protected readonly trace = computed(() => this.folded().trace);

  /**
   * All five members with an `out` flag, rather than only the survivors.
   *
   * Showing the eliminated ones struck through instead of removing them is the
   * whole visual argument: narrowing is *subtraction from a fixed set*, and a
   * list that simply got shorter would not say that.
   */
  protected readonly shortlist = computed<ShortlistEntry[]>(() => {
    const survivors = new Set(this.alive().map((c) => c.id));
    return UNION.map((c) => ({ id: c.id, label: c.label, out: !survivors.has(c.id) }));
  });

  /** The type as the compiler would print it — `never` when nothing survives. */
  protected readonly typeText = computed(() => {
    const alive = this.alive();
    return alive.length ? alive.map((c) => c.label).join(' | ') : 'never';
  });

  /** What the reader may legally write at this point in the flow. */
  protected readonly verdict = computed(() => {
    const alive = this.alive();
    if (alive.length === 0) {
      return 'Every candidate is gone, so the type is never — the compiler has proved this branch is unreachable. This is not an error; it is the exact mechanism behind exhaustiveness checking.';
    }
    if (alive.length === 1) {
      return `One candidate left, so x IS ${alive[0].label}. You can call ${alive[0].can}`;
    }
    return `Still a union of ${alive.length}. You may only touch what exists on EVERY surviving arm, which is never more than toString and valueOf — nothing worth calling. Apply another guard.`;
  });

  /** Whether the flow has narrowed to `never`, so the template can say so loudly. */
  protected readonly isNever = computed(() => this.alive().length === 0);

  /** Whether anything has been applied yet, for the undo/reset button states. */
  protected readonly hasSteps = computed(() => this.trace().length > 0);

  /**
   * Applies a guard down whichever branch is currently selected.
   *
   * @param guard The guard the reader clicked.
   */
  protected apply(guard: Guard): void {
    this.steps.update((steps) => [...steps, { guard, taken: this.branch() }]);
  }

  /** Removes the most recent step, so a reader can back out of a dead end. */
  protected undo(): void {
    this.steps.update((steps) => steps.slice(0, -1));
  }

  /** Returns to the declared type. */
  protected resetBench(): void {
    this.steps.set([]);
  }

  /**
   * Chooses which side of the next guard to descend into.
   *
   * @param branch `true` for the body of the `if`, `false` for the `else`.
   */
  protected setBranch(branch: Branch): void {
    this.branch.set(branch);
  }

  // ── Demo 2: what survives between the check and the use ────────────────────

  /** The interruptions the reader can insert. */
  protected readonly interruptions = INTERRUPTIONS;

  /** Which interruption is selected. Starts on the baseline. */
  protected readonly interruption = signal<Interruption>(INTERRUPTIONS[0]);

  /**
   * The selected snippet, tokenised into `<span class="hl-*">` markup.
   *
   * Highlighted here rather than by the app-wide sweep in `app.ts`, which
   * deliberately skips any `<pre>` inside a `.demo` — a demo's code can change
   * after render, and re-tokenising a live block from the DOM would fight the
   * binding. Safe to bind with `[innerHTML]`: {@link highlight} escapes every
   * character it emits, so the sample is displayed as source rather than parsed
   * as markup. `Predict` does exactly the same thing for the same reason.
   */
  protected readonly interruptionCode = computed(() => highlight(this.interruption().code));

  /**
   * Selects an interruption.
   *
   * @param interruption The scenario the reader clicked.
   */
  protected choose(interruption: Interruption): void {
    this.interruption.set(interruption);
  }

  // ── Demo 3: the discriminated-union state machine ──────────────────────────

  /**
   * The load state in the discriminated-union demo.
   */
  protected readonly state = signal<LoadState>({ status: 'loading' });

  /**
   * Switches to the loading state.
   */
  protected setLoading(): void {
    this.state.set({ status: 'loading' });
  }

  /**
   * Switches to the loaded state, with data attached — only legal on this arm.
   */
  protected setLoaded(): void {
    this.state.set({ status: 'loaded', data: ['alpha', 'beta', 'gamma'] });
  }

  /**
   * Switches to the error state, with a message attached — only legal on this arm.
   */
  protected setError(): void {
    this.state.set({ status: 'error', message: 'HTTP 500 — server exploded' });
  }

  /**
   * The loaded data, or an empty array. The `status` check is what makes `s.data`
   * reachable; without it the property does not exist on the union.
   */
  protected loadedData(): string[] {
    const s = this.state();
    return s.status === 'loaded' ? s.data : [];
  }

  /**
   * The error message, or an empty string, narrowed the same way.
   */
  protected errorMessage(): string {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  }

  // ── Demo 4: the custom guard ───────────────────────────────────────────────

  /**
   * The animal-sound demo's output.
   */
  protected readonly sound = signal('—');

  /**
   * Builds a pet of the chosen kind and calls its sound through {@link isCat},
   * so the guard is doing the work rather than a cast.
   *
   * @param type Which animal to make.
   */
  protected pick(type: 'cat' | 'dog'): void {
    const pet: Pet =
      type === 'cat'
        ? { type: 'cat', meow: () => '🐱 meow' }
        : { type: 'dog', bark: () => '🐶 woof' };
    this.sound.set(isCat(pet) ? pet.meow() : pet.bark());
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes', id: 'ts-classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing' },
  ];

  /**
   * Control-flow analysis drawn as a sequence.
   *
   * Vertical because the details are full sentences, and a horizontal row would
   * squeeze each one into three words. The `warn` step at the end is the payload:
   * readers expect a narrowing diagram to end narrow, and ending it on the
   * assignment that undoes everything is what makes that step memorable.
   */
  protected readonly cfaSteps: FlowStep[] = [
    {
      label: 'x: string | number | null',
      detail:
        'The declared type. Three names on the shortlist, and nothing you can call — no method exists on all three.',
    },
    {
      label: 'if (x === null) return;',
      detail:
        'The return ends that path, so `null` is crossed off for the whole rest of the function. Shortlist: `string | number`.',
      tone: 'accent',
    },
    {
      label: "if (typeof x === 'string')",
      detail:
        'The true branch keeps `string`. The else branch keeps the complement — `number` — without you writing a second check.',
      tone: 'accent',
    },
    {
      label: 'x.trim() / x.toFixed(2)',
      detail:
        'One name left on each side, so each side can call that type’s own methods. Nothing was cast; the compiler ran out of alternatives.',
      tone: 'good',
    },
    {
      label: 'x = read();',
      detail:
        'An assignment puts every name back. Narrowing is a fact about a *point in the flow*, not a property of the variable.',
      tone: 'warn',
    },
  ];

  /**
   * The compiler and a type predicate, negotiating.
   *
   * A dialogue rather than a paragraph because the relationship is a *contract*
   * with two parties and asymmetric obligations, and learners consistently
   * misremember which party checks what. Staged as a conversation, the moment
   * the compiler says "I will not read your body" lands as something someone
   * said to you rather than as a clause in a description.
   */
  protected readonly predicateTalk: BubbleTurn[] = [
    {
      who: 'Your function',
      says: 'I am `isCat(p)`. I return a `boolean`, like everything else.',
    },
    {
      who: 'The compiler',
      says: "Then I can't use you for narrowing. A `boolean` tells me the answer was yes. It does not tell me what yes *means* about `p`.",
    },
    {
      who: 'Your function',
      says: 'Fine — my return type is now `p is Cat`.',
    },
    {
      who: 'The compiler',
      says: 'Better. I will check exactly one thing: that `Cat` is a possible type for `p`. I will **not** read your body to see whether you actually checked anything.',
    },
    {
      who: 'Your function',
      says: 'So if I just `return true`…',
    },
    {
      who: 'The compiler',
      says: '…then every caller narrows to `Cat` with my full blessing, and you find out in production. You signed for it.',
    },
  ];

  /** Sample: control-flow analysis, the whole idea in six lines. */
  protected readonly cfaSample = `function describe(x: string | number | null): string {
  if (x === null) return 'nothing';

  if (typeof x === 'string') {
    return x.trim();
  }

  return x.toFixed(2);
}`;

  /** Line-by-line walkthrough of {@link cfaSample}. */
  protected readonly cfaNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The `|` is a **union**: `x` is one of three types, and the compiler does not yet know which. Right here it will let you call **nothing** — a method has to exist on every arm of a union before it can be called, and `string`, `number` and `null` share none.',
    },
    {
      line: 2,
      text: '`===` compares by value with no coercion, and the compiler treats the comparison as *evidence*. The `return` is the half people skip: it ends this path, so from line 3 onward `null` is off the shortlist for the whole function. **Early returns are the cheapest narrowing you own.**',
    },
    {
      line: 4,
      text: '`typeof` is a real JavaScript operator that returns a string at runtime. The compiler special-cases the comparison and keeps only the union members whose tag is `"string"`. This line is ordinary JS that also happens to be a proof.',
    },
    {
      line: 5,
      text: 'Inside the braces the shortlist is one name long, so `x` **is** `string` and `.trim()` — a method that exists only on strings — is legal. Nothing was cast and nothing was asserted; the compiler simply ran out of alternatives.',
    },
    {
      line: 8,
      text: 'No guard here at all, and yet `x` is `number`. Line 2 removed `null` and line 4 consumed `string`, so **subtraction alone** got you here. This is the fact most people miss: the `else` side of a guard narrows exactly as hard as the `if` side.',
    },
  ];

  /** Sample: `typeof` and the three ways it surprises people. */
  protected readonly typeofSample = `function inspect(x: string | Date | string[] | null): string {
  if (typeof x === 'object') {
    // x: Date | string[] | null   ← null is STILL here
    if (x === null) return 'nothing';
    if (Array.isArray(x)) return x.join(', ');
    return x.toISOString();
  }

  return x.toUpperCase();
}`;

  /** Line-by-line walkthrough of {@link typeofSample}. */
  protected readonly typeofNotes: CodeNote[] = [
    {
      line: 2,
      text: '`typeof` returns one of exactly eight strings, and `"object"` is the bucket for everything that is neither a primitive nor a function. Both `Date` and `string[]` land in it — an array **is** an object in JavaScript, which is why there is no `"array"` tag.',
    },
    {
      line: 3,
      text: 'The comment is the whole trap. **`typeof null === "object"`** — a bug in the very first JavaScript implementation in 1995, kept because fixing it would break the web. TypeScript models the language it actually has, so `null` walks straight through this guard.',
    },
    {
      line: 4,
      text: 'The null check that every `typeof x === "object"` owes you. Without this line, `x.toISOString()` below compiles and throws `Cannot read properties of null` at runtime.',
    },
    {
      line: 5,
      text: '`Array.isArray` is declared in the standard library as `arg is any[]` — a **type predicate**, which is the only reason an ordinary function call is allowed to narrow. Prefer it to `x instanceof Array`, which is `false` for an array created in another iframe or worker.',
    },
    {
      line: 6,
      text: 'By elimination `x` is `Date`, so `.toISOString()` is legal. Three guards, three subtractions, one name left.',
    },
    {
      line: 9,
      text: 'The else of line 2. Everything whose tag is not `"object"` survives — here just `string` — so `.toUpperCase()` is fine. You never wrote a `typeof x === "string"` check; the complement did it for you.',
    },
  ];

  /** Sample: truthiness, the falsy trap, and the else branch nobody predicts. */
  protected readonly truthySample = `function label(count: number | undefined): string {
  if (!count) return 'unknown';
  return count + ' items';
}
label(0);   // 'unknown'  ← a real count of zero, reported as missing

function betterLabel(count: number | undefined): string {
  if (count === undefined) return 'unknown';
  return count + ' items';
}
betterLabel(0);   // '0 items'

function trim(s: string | undefined): string | undefined {
  if (s) return s.trim();
  return s;
}`;

  /** Line-by-line walkthrough of {@link truthySample}. */
  protected readonly truthyNotes: CodeNote[] = [
    {
      line: 2,
      text: '`!count` is a truthiness test with the sense flipped. It is true for `undefined`, and **also** for every other falsy value JavaScript has — `false`, `0`, `-0`, `0n`, `""`, `null` and `NaN`, eight in total. Only two of those are actually "absent". The compiler is happy; your product manager is not.',
    },
    {
      line: 5,
      text: 'The bug, made concrete. `0` is a perfectly good number that happens to be falsy, so an item count of zero takes the "missing" branch. This is the single most common narrowing bug in application code.',
    },
    {
      line: 8,
      text: '`=== undefined` asks the question you actually meant: is the value *absent*? Only `undefined` is removed. `0` now flows to line 9 and renders as `"0 items"`.',
    },
    {
      line: 14,
      text: 'The true branch does what you expect — `s` is `string`, so `.trim()` is legal.',
    },
    {
      line: 15,
      text: 'And here is the half that surprises everyone. Truthiness only removes members that are **always** falsy. `""` is a string, so `string` cannot leave the else branch, and `s` here is still `string | undefined` — not `undefined`. The declared return type on line 13 is not laziness; it is the truth.',
    },
  ];

  /** Sample: the rest of the guard family, one line each. */
  protected readonly familySample = `type Admin = { role: 'admin'; ban(id: string): void };
type Guest = { role: 'guest' };

function act(u: Admin | Guest, e: Error | string, d: unknown): void {
  if ('ban' in u) u.ban('42');
  if (e instanceof Error) console.log(e.stack);
  if (u.role === 'admin') u.ban('42');
  if (typeof d === 'function') d();
}`;

  /** Line-by-line walkthrough of {@link familySample}. */
  protected readonly familyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`role: \'admin\'` is a **literal type** — not "some string" but "the string `admin` and nothing else". That single quirk is what will make line 7 work.',
    },
    {
      line: 5,
      text: "`in` is JavaScript's property-presence operator, and TypeScript narrows a union by *which arm declares the key*. Only `Admin` declares `ban`, so `u` is `Admin` inside. Watch out: an **optional** property (`ban?: …`) counts as declared for narrowing even though it may be `undefined` at runtime.",
    },
    {
      line: 6,
      text: '`instanceof` walks the prototype chain looking for `Error.prototype`. It works only on things that exist at runtime: `Error` is a real class, so this is fine. Write `e instanceof SomeInterface` and you get error **TS2693 — only refers to a type, but is being used as a value**, because interfaces are erased before the JavaScript is emitted.',
    },
    {
      line: 7,
      text: "Equality against a literal. Because `role` is typed `'admin' | 'guest'` rather than `string`, comparing it to `'admin'` eliminates the `Guest` arm — and that unlocks `u.ban`. A `switch` is just a stack of these. **This is the discriminated union, in one line.**",
    },
    {
      line: 8,
      text: '`unknown` is the safe top type: it holds anything and lets you do nothing until you prove what it is. `"function"` is its own `typeof` tag — one of the eight — and it narrows `unknown` to something callable.',
    },
  ];

  /** Sample: the discriminated union and the switch that consumes it. */
  protected readonly unionSample = `type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; data: string[] }
  | { status: 'error'; message: string };

function render(s: LoadState): string {
  switch (s.status) {
    case 'loading': return 'Spinner';
    case 'loaded':  return s.data.join(', ');
    case 'error':   return s.message;
  }
}`;

  /** Line-by-line walkthrough of {@link unionSample}. */
  protected readonly unionNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A union of three **object** types. The leading `|` on the next line is cosmetic — TypeScript allows it so every arm lines up.',
    },
    {
      line: 2,
      text: "The `'loading'` here is a literal type, not the type `string`. That is the entire mechanism: because the field can only ever hold one exact string per arm, comparing it identifies the arm.",
    },
    {
      line: 3,
      text: '`data` exists **only** on this arm. There is no optional property and no `undefined` — the shape is honest about what a loaded state carries.',
    },
    {
      line: 4,
      text: '`message` likewise lives only on the error arm. Notice what you now cannot build: a value with both `data` and `message`. The illegal state is not discouraged, it is **unrepresentable**.',
    },
    {
      line: 7,
      text: '`s.status` is the **discriminant** — the one field every arm declares, with a different literal type in each. The compiler recognises this shape by name and narrows the whole object from it.',
    },
    {
      line: 9,
      text: '`s.data` is legal here and nowhere else in this function. Move this line into the `loading` case and you get error TS2339: *Property `data` does not exist on type `{ status: "loading" }`*.',
    },
    {
      line: 11,
      text: 'There is no `default` and no `return` after the switch, and it still compiles — the compiler can see the three cases cover the union exhaustively, so every path returns. Add a fourth arm to `LoadState` and this function starts erroring instead of silently returning `undefined`.',
    },
  ];

  /**
   * Sample for the discriminant-widening predict.
   *
   * Kept as a two-liner because the whole point is that nothing about the *shape*
   * is wrong — a reader who is shown more code starts hunting for a typo.
   */
  protected readonly wideningSample = `const draft = { status: 'loaded', data: ['a'] };
const s: LoadState = draft;`;

  /** The reveal for {@link wideningSample}. */
  protected readonly wideningAnswer =
    "Because `status` was inferred as `string`, not as `'loaded'`. A property of an object literal is mutable — you could write `draft.status = 'nonsense'` on the next line — so TypeScript **widens** the literal to its base type. And `string` is not assignable to `'loading' | 'loaded' | 'error'`, so no arm of the union matches and the error names the property rather than the shape. Three fixes, best first: annotate the variable (`const draft: LoadState = …`) so the literal is checked in place; or pass the object literal directly where a `LoadState` is expected; or pin the one field with `status: 'loaded' as const`. **A discriminated union stops working the instant its discriminant widens to `string`** — and this is how that happens by accident.";

  /** Sample for the lying-guard predict. */
  protected readonly liarSample = `function isAdmin(u: User): u is Admin {
  return true;   // someone stubbed this during a refactor
}

if (isAdmin(user)) user.deleteEverything();`;

  /** The reveal for {@link liarSample}. */
  protected readonly liarAnswer =
    "Nothing. It compiles, everywhere, forever. A type predicate is an **axiom**, not a proof: the compiler verifies only that `Admin` is a plausible type for `u`, then trusts the body completely. Every call site now treats every user as an `Admin` with the compiler's blessing, and the failure surfaces at runtime somewhere far from this function. It is the same trust class as an `as` cast or a `!` — just better dressed, which is exactly what makes it dangerous. Consequences worth acting on: keep guards tiny, keep them next to the type they guard, and **unit-test them** — a five-line predicate deserves tests more than almost any other function you will write.";

  /** Sample: type predicates, and the generic one worth stealing. */
  protected readonly guardSample = `function isCat(p: Pet): p is Cat {
  return p.type === 'cat';
}

if (isCat(pet)) pet.meow();
else pet.bark();

function isPresent<T>(v: T): v is NonNullable<T> {
  return v != null;
}

const names: string[] = ['a', null, 'b'].filter(isPresent);`;

  /** Line-by-line walkthrough of {@link guardSample}. */
  protected readonly guardNotes: CodeNote[] = [
    {
      line: 1,
      text: '`p is Cat` is a **type predicate**, and it replaces `boolean` in the return-type position. It says: "when I return true, treat the argument named `p` as a `Cat`". The name before `is` must match a parameter name exactly.',
    },
    {
      line: 2,
      text: 'The body is ordinary code returning an ordinary boolean. The compiler checks only that `Cat` is *plausible* for `p` — it never verifies that this line implements the claim. Replace it with `return true;` and everything still compiles.',
    },
    {
      line: 5,
      text: 'At the call site the predicate does what a raw `boolean` cannot: inside the `if`, `pet` is `Cat`, so `.meow()` resolves. A function returning plain `boolean` here would leave `pet` as `Pet` and `.meow()` would not exist.',
    },
    {
      line: 6,
      text: 'And the `else` subtracts `Cat` from the union, leaving `Dog` — so `.bark()` is legal without a second guard. Predicates narrow in both directions, exactly like `typeof`.',
    },
    {
      line: 8,
      text: '`<T>` makes this work for any type. `NonNullable<T>` is a built-in utility type meaning "`T` with `null` and `undefined` removed", so one function cleans up every nullable union you own.',
    },
    {
      line: 9,
      text: '`!=` with one `=` is **loose** inequality, and `v != null` is true unless `v` is `null` **or** `undefined` — the coercion catches both in one comparison. This is one of the only two sanctioned uses of loose equality in TypeScript.',
    },
    {
      line: 12,
      text: 'Because `filter` accepts a predicate, the result is `string[]` and not `(string | null)[]`. Since TypeScript 5.5 a simple inline lambda like `v => v != null` gets its predicate **inferred**, so the named guard is no longer strictly required — but it is still the version you can unit-test.',
    },
  ];

  // ── Copy that cannot live in the template ─────────────────────────────────
  //
  // Angular's template parser reads a bare `{` in text or in an attribute value
  // as the start of an ICU expression, so any copy containing a brace has to be
  // bound rather than typed inline. Since CONTRIBUTING §2A wants long copy in
  // the `.ts` anyway, all of the long strings live here — the ones with braces
  // because they must, the rest so that the template stays scannable.

  /** The wrong side of the truthiness comparison. */
  protected readonly truthyWrongSample = `if (!count) return 'unknown';
// count === 0 lands here too`;

  /** The right side of the truthiness comparison. */
  protected readonly truthyRightSample = `if (count === undefined) return 'unknown';
// or: if (count == null) — catches null AND undefined`;

  /** Predict prompt attached to {@link truthySample}. */
  protected readonly truthyPrompt =
    'Line 15 returns `s` from the else side of `if (s)`. What type does the compiler give it there?';

  /** The reveal for {@link truthyPrompt}. */
  protected readonly truthyOutput =
    '`string | undefined` — **not** `undefined`. Truthiness only removes members that are *always* falsy, and `""` is a perfectly good `string`, so the `string` arm has to survive on both sides of the check.';

  /** The "bag of flags" shape, for the modelling comparison. */
  protected readonly flagsSample = `{
  loading: boolean;
  data?: string[];
  error?: string;
}`;

  /** The same three states, modelled as a discriminated union. */
  protected readonly unionShapeSample = `| { status: 'loading' }
| { status: 'loaded'; data: string[] }
| { status: 'error'; message: string }`;

  /** The `typeof "object"` self-test question. */
  protected readonly typeofQuizQuestion =
    "`x: string | Date | null`. Inside the `if (typeof x === 'object')` branch, what type does the compiler give `x`?";

  /** The lost-narrowing self-test question. */
  protected readonly lostQuizQuestion =
    'You write `if (this.user.name !== null)`, call `refresh()`, then read `this.user.name.length`. `refresh()` happens to set `this.user.name = null`. What does the compiler tell you?';

  /** Predict prompt attached to {@link exhaustiveSample}. */
  protected readonly exhaustivePrompt =
    "A teammate adds a fourth arm — `{ status: 'refreshing' }` — to `LoadState` next sprint and does not touch this function. What happens?";

  /** The reveal for {@link exhaustivePrompt}. */
  protected readonly exhaustiveOutput =
    'The build breaks on **line 6**, pointing at this exact switch. With a fourth arm unhandled, `s` in the `default` is no longer `never` — it is the `refreshing` variant, and that is not assignable to a `never` parameter. Delete the `default` and nothing breaks at all: the switch silently returns `undefined` for the new state, from a function that still promises a `string`.';

  /** Sample: assertion functions and the `never` trick. */
  protected readonly assertSample = `function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function assertIsUser(v: unknown): asserts v is User {
  if (typeof v !== 'object' || v === null || !('id' in v)) throw new Error('not a user');
}

const check = assert;
check(user, 'no user');

function assertNever(x: never): never {
  throw new Error('Unhandled variant: ' + JSON.stringify(x));
}`;

  /** Line-by-line walkthrough of {@link assertSample}. */
  protected readonly assertNotes: CodeNote[] = [
    {
      line: 1,
      text: '`asserts cond` is an **assertion signature**. It says: "if I return at all, the argument passed as `cond` was truthy." The function has no declared return value — its whole contribution is the narrowing it leaves behind on every line after the call.',
    },
    {
      line: 2,
      text: 'The `throw` is not decoration, it is the contract. `asserts` means "returned normally = the claim held", so an assertion function that can return without throwing on a false condition is a silent lie the compiler will happily believe.',
    },
    {
      line: 5,
      text: '`asserts v is User` is the other form: not "this was truthy" but "this was a `User`". After a successful call, `v` is `User` for the rest of the block — no `if`, no nesting, no cast.',
    },
    {
      line: 6,
      text: 'This body actually checks something, which matters more here than anywhere else: an assertion at an I/O boundary — parsing JSON, reading `localStorage` — is the *only* thing standing between untrusted data and code that trusts its types. Check **every** field you claim.',
    },
    {
      line: 9,
      text: 'The trap. Aliasing an assertion function to a plain `const` loses the assertion, because TypeScript needs the declaration to be visible at the call site.',
    },
    {
      line: 10,
      text: 'This line fails with **TS2775: Assertions require every name in the call target to be declared with an explicit type annotation.** The fix is to annotate the alias — `const check: typeof assert = assert;` — or, better, just call `assert` directly.',
    },
    {
      line: 12,
      text: '`never` is the empty type: no value has it. A parameter typed `never` can therefore only be satisfied by something the compiler has already proved impossible — which is what makes the next line a build-time guarantee rather than a runtime hope.',
    },
    {
      line: 13,
      text: "Called from a `switch` default, this errors the moment a new union arm exists that no `case` handles: the leftover arm no longer narrows to `never`, so passing it is a type error pointing at the exact switch you forgot. It's a runtime `throw` that mostly exists to be a compile-time alarm.",
    },
  ];

  /** Sample: exhaustiveness wired into the switch. */
  protected readonly exhaustiveSample = `function render(s: LoadState): string {
  switch (s.status) {
    case 'loading': return 'Spinner';
    case 'loaded':  return s.data.join(', ');
    case 'error':   return s.message;
    default:        return assertNever(s);
  }
}`;

  /** Line-by-line walkthrough of {@link exhaustiveSample}. */
  protected readonly exhaustiveNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Read the `switch` as the bench from three sections up, running by itself. `s` starts as all three arms; each `case` below crosses one off for the code underneath it. Nothing here is special syntax — it is the same subtraction, spelled as a statement.',
    },
    {
      line: 5,
      text: 'This is the last arm. After it, the shortlist is empty — every candidate has been eliminated — which is the `never` state you can reach by hand on the bench. Everything the next line does depends on that having already happened.',
    },
    {
      line: 6,
      text: 'By the time control reaches `default`, all three arms have been handled, so the compiler has subtracted every one of them and `s` is `never`. `assertNever` accepts `never`, so today this line is perfectly legal and costs nothing.',
    },
    {
      line: 7,
      text: 'The closing brace matters: with the `default` present, every path returns a `string`, so the function needs no trailing return. Without it, an unhandled arm would fall out of the switch and return `undefined` while the signature still promised `string`.',
    },
  ];

  /** Sample: narrowing and closures — the rule that actually applies. */
  protected readonly closureSample = `function schedule(x: string | null): void {
  if (x === null) return;

  setTimeout(() => x.length);

  const held = x;
  setTimeout(() => held.length);

  x = null;
}`;

  /** Line-by-line walkthrough of {@link closureSample}. */
  protected readonly closureNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Standard early-return narrowing. From here to the end of the function, straight-line code sees `x` as `string`.',
    },
    {
      line: 4,
      text: 'The arrow function is a **closure** — it captures the variable itself, not its current value, and it runs later. This line errors with **TS18047: `x` is possibly `null`**, and the reason is not on this line at all.',
    },
    {
      line: 6,
      text: '`const held = x` copies the *narrowed* value into a binding that can never be reassigned. The compiler records `held` as `string`, permanently, because there is no future assignment that could change it.',
    },
    {
      line: 7,
      text: 'So the identical callback compiles here. This is the fix worth memorising: **capture into a `const`, then close over the `const`.**',
    },
    {
      line: 9,
      text: 'Here is the culprit for line 4. Because `x` is assigned *somewhere* in this function, the compiler cannot know which value a deferred callback will see, so it falls back to the declared type. **Delete this line and line 4 compiles**, because a variable that is never assigned has nothing a callback could see change. Since TypeScript 5.4 you can also keep the assignment and move it *above* line 4: narrowing survives into any function created after the last assignment.',
    },
  ];

  /**
   * The first self-test: the `typeof "object"` trap.
   *
   * Every distractor is a real answer a learner gives out loud. `Date` is the
   * confident-and-wrong one; `Date | string | null` is the reader who has
   * over-corrected into believing narrowing barely does anything; `object` is
   * the reader who thinks a guard *casts* rather than *subtracts*, which is the
   * deepest misconception of the three and the one worth the longest `why`.
   */
  protected readonly typeofQuiz: QuizOption[] = [
    {
      text: '`Date` — the only object type in the union.',
      why: 'The confident answer, and the one the runtime disagrees with. `typeof null` has returned `"object"` since JavaScript shipped in 1995 — a bug that could never be fixed without breaking the web. TypeScript models the language as it is rather than as it should be, so `null` passes this guard untouched and `x.toISOString()` compiles and then throws.',
    },
    {
      text: '`Date | null` — `null` passes the guard too.',
      correct: true,
      why: 'Right, and this is why every `typeof x === "object"` in real code is immediately followed by a null check. The idiomatic single check is `if (typeof x === "object" && x !== null)`.',
    },
    {
      text: '`Date | string | null` — `typeof` is too weak to remove anything.',
      why: 'Over-corrected. `typeof` is precise about primitives: `string` reports the tag `"string"`, which is not `"object"`, so it is eliminated on the first question. The trap is not that narrowing fails — it is that it removes slightly **less** than you assumed. One member survives that you did not expect; the rest behave exactly as advertised.',
    },
    {
      text: '`object` — the guard tells the compiler it is an object.',
      why: 'This is the deepest of the three misconceptions: it treats a guard as a **cast**. Narrowing never invents a type — it can only remove members from the union you already wrote, and `object` was never one of `string`, `Date` or `null`. A guard is evidence the compiler subtracts with, not an instruction that overwrites the type.',
    },
  ];

  /**
   * The second self-test: the soundness hole.
   *
   * This one exists because the wrong answers here are the *sensible* ones. Most
   * readers assume TypeScript is conservative about function calls, and telling
   * them plainly that it is not — and that the resulting crash is by design — is
   * worth more than any amount of correct description of what does work.
   */
  protected readonly lostQuiz: QuizOption[] = [
    {
      text: 'An error. Calling a function invalidates narrowing on a property.',
      why: 'Reasonable, and wrong. TypeScript deliberately does **not** reset narrowing after an arbitrary call. It would be the sound choice, and it would also make narrowed code unwritable — almost every line of real code calls something, so a check would expire before you could use it. The team took usability over soundness here, on purpose.',
    },
    {
      text: 'Nothing. It compiles cleanly, and it throws at runtime.',
      correct: true,
      why: 'Exactly, and this is the most important sentence in the section: a green build is not a proof that the value is still what you checked. Narrow into a `const` — `const name = this.user.name; if (name === null) return;` — and the crash becomes impossible, because a `const` cannot be changed by anyone.',
    },
    {
      text: 'Nothing, and it cannot throw — the compiler proved `name` is a string.',
      why: 'It proved it at **one moment**: the line where you checked. It has no idea what `refresh()` does to another object, and it never looks inside another function to find out. That is an assumption, not a proof — the difference between the two is what this whole section is about.',
    },
    {
      text: 'An error, because `this.user` might have been reassigned.',
      why: 'TypeScript does discard the narrowing when it can **see** an assignment to `this.user` or `this.user.name` in this function body. It sees nothing here, because the assignment lives inside `refresh()` — and control-flow analysis never crosses a function boundary in either direction.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why not just write `as` and move on?',
      a: '`as` is an **assertion**: you overrule the compiler and it stops arguing. A guard is **evidence**: the compiler narrows because the check would really be true at runtime. The difference shows up when the code changes — add an arm to your union and every guard keeps working while every `as` silently keeps lying. Use `as` when you genuinely know something the type system cannot express, and treat each one as a small unchecked debt.',
    },
    {
      q: 'Does any of this exist at runtime?',
      a: 'None of it. Types are erased before the JavaScript is emitted. What survives is the ordinary code you wrote — `typeof`, `instanceof`, `in`, `===` are all real JavaScript operators doing real work — and the *narrowing* is bookkeeping the compiler did while reading it. That is exactly why a guard has to be written as a runtime check: it has to be something the emitted JavaScript can actually evaluate.',
    },
    {
      q: 'Why does `arr.filter(x => x != null)` still hand me `(T | null)[]`?',
      a: 'Historically, because a lambda returning plain `boolean` gives the compiler nothing to work with — `filter` only saw `(v) => boolean` and had no reason to change the element type. Two fixes: annotate the predicate yourself, `filter((x): x is T => x != null)`, or reach for a reusable `isPresent`. Since TypeScript 5.5 simple single-return lambdas like this one get their predicate inferred automatically, so on a modern compiler it just works — knowing *why* is what tells you when it will not.',
    },
    {
      q: "`instanceof` doesn't work on my interface. What did I do wrong?",
      a: 'Nothing — it cannot work. `instanceof` is a runtime check against a constructor function, and an interface is erased, so `v instanceof MyInterface` fails with **TS2693: only refers to a type, but is being used as a value**. Narrow structural types with `in`, with a discriminant field, or with your own `v is MyInterface` predicate. `instanceof` is for classes, `Error`, `Date`, `Map` — things that still exist when the types are gone.',
    },
    {
      q: 'Is the non-null assertion `!` the same thing as narrowing?',
      a: 'No, and the difference is worth internalising. `x!.length` removes `null` for that one expression and leaves no trace — nothing is tracked, nothing carries forward, and if `x` really is null you get a runtime crash with no warning. `if (x !== null)` is checked at runtime *and* recorded by the compiler for the rest of the block. `!` is a cast wearing a smaller costume.',
    },
    {
      q: 'Do Angular templates narrow the same way?',
      a: 'Yes — the template type-checker runs the same control-flow analysis, so `@switch (state().status)` narrows a discriminated union in each `@case` exactly like a TypeScript `switch`. The catch is the one that catches everybody: **a signal read is a function call, and TypeScript never narrows a call expression** — only a plain identifier, a property access, an element access with a literal index, or `this`. So in a `.ts` file `if (user()) { user().name }` fails with **TS2531**, because the second `user()` is a different expression from the first. Assign it once — `const u = user();` — and narrow `u`. The template has its own spelling of exactly that: `@if (user(); as u)`, then use `u` inside.',
    },
  ];
}
