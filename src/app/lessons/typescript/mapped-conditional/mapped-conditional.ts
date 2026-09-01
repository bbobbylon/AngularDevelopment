import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

// ── The live bench: step through a real type evaluation ───────────────────────

/**
 * One worked type-evaluation: an expression and the steps the compiler takes to
 * reduce it, revealed one at a time.
 */
interface EvalCase {
  readonly label: string;
  readonly expr: string;
  readonly steps: readonly string[];
  readonly result: string;
}

/**
 * The bench's cases, in the order a reader should try them.
 *
 * The first four exercise mapped types, conditional types and `infer` on their
 * own; the last two are deliberately the two "gotcha" results from later
 * sections (the homomorphic special case, and the distributive-`never` edge) —
 * placed here so a reader can rediscover both by stepping through them by hand
 * before the prose further down explains why the compiler landed there.
 */
const EVAL_CASES: readonly EvalCase[] = [
  {
    label: `Partial<User>`,
    expr: `type User = { id: number; name: string };
type Partial<T> = { [K in keyof T]?: T[K] };

Partial<User> = ?`,
    steps: [
      `keyof User → 'id' | 'name' — the union of key names.`,
      `[K in keyof T] loops: first K = 'id', then K = 'name' — like a for...of over keys, at the type level.`,
      `For K = 'id': the ? modifier makes it optional, T[K] looks up its value type → id?: number.`,
      `For K = 'name': same → name?: string.`,
    ],
    result: `{ id?: number; name?: string }`,
  },
  {
    label: `IsString<42>`,
    expr: `type IsString<T> = T extends string ? 'yes' : 'no';

IsString<'hi'> = ?
IsString<42>  = ?`,
    steps: [
      `"T extends string" asks: is T assignable to string?`,
      `'hi' is a string literal → assignable → take the true branch → 'yes'.`,
      `42 is a number → not assignable → false branch → 'no'.`,
      `That's the whole idea: a conditional type is an if/else that runs in the compiler.`,
    ],
    result: `IsString<'hi'> = 'yes'   ·   IsString<42> = 'no'`,
  },
  {
    label: `Unwrap<Promise<User>>`,
    expr: `type Unwrap<T> = T extends Promise<infer V> ? V : T;

Unwrap<Promise<User>> = ?
Unwrap<number>        = ?`,
    steps: [
      `"T extends Promise<infer V>" tries to MATCH T against the pattern Promise<something>.`,
      `Promise<User> matches — and infer V captures the something: V = User. True branch returns V.`,
      `number doesn't match the pattern → false branch returns T unchanged → number.`,
      `infer = destructuring for types: name a part of a matched pattern, then use it. This is exactly how the built-in Awaited<T> and ReturnType<T> work.`,
    ],
    result: `Unwrap<Promise<User>> = User   ·   Unwrap<number> = number`,
  },
  {
    label: `Exclude<'a'|'b'|'c', 'b'>`,
    expr: `type Exclude<T, U> = T extends U ? never : T;

Exclude<'a' | 'b' | 'c', 'b'> = ?`,
    steps: [
      `KEY RULE: when T is a bare type parameter and you feed it a union, the conditional runs on EACH MEMBER separately ("distribution").`,
      `'a' extends 'b' ? → no → 'a' survives.`,
      `'b' extends 'b' ? → yes → never (never = "nothing" — it vanishes from a union).`,
      `'c' extends 'b' ? → no → 'c' survives. Reassemble: 'a' | never | 'c' = 'a' | 'c'.`,
    ],
    result: `'a' | 'c'`,
  },
  {
    label: `Partial<string[]>`,
    expr: `type Partial<T> = { [K in keyof T]?: T[K] };

Partial<string[]> = ?`,
    steps: [
      `T appears BARE inside keyof T — that bareness is the trigger for TypeScript's homomorphic special case.`,
      `Homomorphic means "copy the input's own structure". T is an array, so the result stays an array — TypeScript does not iterate keyof string[] into separate object properties.`,
      `Each element's type gets unioned with undefined instead of gaining a ? — arrays don't have per-index optional properties, so ? becomes | undefined.`,
      `This is why the result is NOT { 0?: string; length?: number; push?: ... } — the object-shaped guess almost everyone makes on the first try.`,
    ],
    result: `(string | undefined)[]`,
  },
  {
    label: `IsNever<never>`,
    expr: `type IsNever<T> = T extends never ? true : false;

IsNever<never> = ?`,
    steps: [
      `T is a bare type parameter, and you fed it never — the EMPTY union. Zero members.`,
      `A distributive conditional runs once per member of the union it's fed. With zero members, there's nothing to run at all.`,
      `The whole expression evaluates to never itself — not the true branch, not the false branch. Neither ? true nor : false is ever consulted.`,
      `The fix: wrap both sides in a one-element tuple — [T] extends [never] — which makes T a non-bare pattern and switches distribution off.`,
    ],
    result: `never — not true. The classic distributive gotcha.`,
  },
];

/**
 * Lesson: Mapped & conditional types — the type-level programming model (types
 * as a small language over types), mapped-type anatomy, the homomorphic
 * special case that silently preserves arrays and tuples, key remapping and
 * filtering, conditional types + `infer` with a live evaluator, distribution
 * over unions (its `never` AND `any` edge cases), template literal types both
 * building and — the half most material skips — parsing strings apart,
 * recursion's depth limit and the tail-position fix, and rebuilding the
 * standard utility types from scratch.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the problem before naming it.** The lesson opens by revealing that
 *    `Partial<T>` is a one-line program, not a compiler built-in — then
 *    immediately complicates that "just a loop" framing with a napkin
 *    prediction (`Partial<string[]>`) the reader can't yet answer.
 * 2. **Four building blocks, named once, reused everywhere.** A short table of
 *    tape-cards frames mapped types, conditional types, `infer` and template
 *    literal types as one small vocabulary before any of them is taught in
 *    depth, so every later section is "one of the four you already met".
 * 3. **The same idea in several modes.** The live bench lets a reader
 *    rediscover the homomorphic special case and the `never` edge case by
 *    hand, before the prose explains either — the bench doubles as both a
 *    demo (§2.1 of CONTRIBUTING) and an ask-before-telling device.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`, including
 *    the "rebuild the standard library" capstone, which the pre-migration
 *    version left completely unannotated.
 *
 * ## Coverage-sweep findings folded in
 *
 * Homomorphic vs non-homomorphic mapped types (high), template literal types
 * parsing a string apart with `infer` (high), the `any` edge case in
 * conditional types (medium), contravariant `infer` via `UnionToIntersection`
 * (medium), and the recursion depth limit plus the `Prettify` trick (medium).
 * All five are from `docs/COVERAGE-SWEEP.md`'s `typescript/mapped-conditional`
 * section.
 */
@Component({
  selector: 'app-lesson-ts-mapped-conditional',
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
  templateUrl: './mapped-conditional.html',
  styleUrl: './mapped-conditional.css',
})
export class MappedConditional {
  // ── The live bench ───────────────────────────────────────────────────────

  /** The worked examples. */
  protected readonly cases = EVAL_CASES;
  /** Which example is being stepped through. */
  protected readonly active = signal<EvalCase>(EVAL_CASES[0]);
  /** How far through its steps the walkthrough is. */
  protected readonly step = signal(0);

  /**
   * Selects an example, restarting its walkthrough at the first step.
   *
   * @param c The example to show.
   */
  protected select(c: EvalCase): void {
    this.active.set(c);
    this.step.set(0);
  }

  /** Advances one step, stopping at the last. */
  protected nextStep(): void {
    this.step.update((s) => Math.min(s + 1, this.active().steps.length - 1));
  }

  // ── Presentation data ───────────────────────────────────────────────────

  /** The Advanced Types track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Utility Types', id: 'ts-utility-types' },
    { label: 'keyof & typeof', id: 'ts-keyof-typeof' },
    { label: 'Mapped & Conditional' },
  ];

  /**
   * The template-literal-type syntax shown on the vocabulary tape-card and in
   * the recap table.
   *
   * Kept as a bound field rather than typed directly into the template: the
   * literal `{` inside a plain attribute or text node is read by Angular's
   * template parser as the start of an ICU expression, so any copy containing
   * a brace has to be bound instead — see `narrowing.ts` for the same rule
   * applied to longer copy.
   */
  protected readonly templateLiteralSyntax = '`on${K}`';

  /** The homomorphic quiz's question, bound for the same brace reason. */
  protected readonly homomorphicQuizQuestion =
    'type Partial<T> = { [K in keyof T]?: T[K] }. What does Partial<string[]> resolve to?';

  /** Sample: `Partial<T>`'s real, one-line definition. */
  protected readonly partialSourceSample = `type Partial<T> = { [K in keyof T]?: T[K] };`;

  /** Sample: the mapped-type anatomy, self-annotated with drawn arrows. */
  protected readonly anatomySample = `type Optional<T> = { [K in keyof T]?: T[K] };
//                    │  │      │    │   └── value: look up K's original type
//                    │  │      │    └────── the ? modifier: make each key optional
//                    │  │      └─────────── keyof T = the union of T's key names
//                    │  └────────────────── K takes each key in turn — the loop variable
//                    └───────────────────── [K in …] is the mapped-type syntax itself`;

  /** Sample: the modifiers a mapped type can add or strip. */
  protected readonly modifiersSample = `type Required2<T> = { [K in keyof T]-?: T[K] };          // -? strips optionality
type Mutable<T>   = { -readonly [K in keyof T]: T[K] };  // -readonly strips readonly
type Frozen<T>    = { readonly [K in keyof T]: T[K] };   // adds readonly (≈ Readonly<T>)`;

  /** Line-by-line walkthrough of {@link modifiersSample}. */
  protected readonly modifiersNotes: CodeNote[] = [
    {
      line: 1,
      text: '`-?` strips the optional modifier a mapped type would otherwise keep. It uses the exact same `[K in keyof T]` loop as `Optional` — only the sign in front of `?` changed.',
    },
    {
      line: 2,
      text: '`-readonly` sits in front of the brackets, not after `T[K]`, and strips `readonly` from every property the loop visits.',
    },
    {
      line: 3,
      text: 'No minus sign this time: `readonly` here **adds** the modifier to every key. This one line is the real definition of the built-in `Readonly<T>`.',
    },
  ];

  /** Sample: homomorphic vs non-homomorphic mapped types, resolved. */
  protected readonly homomorphicSample = `type Optional<T> = { [K in keyof T]?: T[K] };
type PickAt<T, K extends keyof T> = { [P in K]: T[P] };

type A = Optional<[a: string, b: number]>;   // [a?: string, b?: number]
type B = PickAt<[boolean, string], 0>;       // { 0: boolean }`;

  /** Line-by-line walkthrough of {@link homomorphicSample}. */
  protected readonly homomorphicNotes: CodeNote[] = [
    {
      line: 1,
      text: "`keyof T` appears with `T` completely bare — nothing wraps it. That bareness is the trigger for a special case: TypeScript treats this mapped type as **homomorphic** and copies `T`'s own structure (array, tuple, readonly-ness) instead of building a plain object.",
    },
    {
      line: 2,
      text: 'Here the loop variable `P` ranges over `K`, a type parameter of its own — `T` never appears bare inside a `keyof`. Without that exact `[X in keyof T]` shape, the mapped type is **non-homomorphic**: it always produces an ordinary object, no matter what you feed it.',
    },
    {
      line: 4,
      text: '`Optional` is homomorphic, so mapping over a tuple keeps it a tuple. Each element becomes optional **in place**: `[a?: string, b?: number]` — not an object with a `length?` and numeric keys.',
    },
    {
      line: 5,
      text: '`PickAt` is non-homomorphic. Feeding it a tuple and the key `0` does not preserve tuple-ness — the result collapses to the plain object `{ 0: boolean }`. This is the exact mechanism behind the built-in `Pick`, and it is why picking a tuple index does not hand you back a tuple.',
    },
  ];

  /** The homomorphic self-test. */
  protected readonly homomorphicQuiz: QuizOption[] = [
    {
      text: `{ 0?: string; 1?: string; length?: number; push?: ...} — every property becomes optional.`,
      why: `This is the plain-object mental model of a mapped type, and it's the natural guess — but \`keyof T\` here is bare, so TypeScript special-cases the whole mapped type instead of iterating \`string[]\`'s huge index signature into separate properties. The array's own shape survives untouched.`,
    },
    {
      text: `(string | undefined)[] — still an array, each element optional.`,
      correct: true,
      why: `Right — a homomorphic mapped type (\`T\` used bare inside \`keyof T\`) copies the input's structure. For an array that means: stay an array, and turn \`?\` into \`| undefined\` per element, since arrays don't have per-index optional properties.`,
    },
    {
      text: `string[] | undefined — the whole array might be missing.`,
      why: `That would be the type of an optional PROPERTY holding an array (\`arr?: string[]\`), not what a mapped type does to the array itself. \`Partial<T>\` never touches whether \`T\` as a whole is present — only what's inside it.`,
    },
    {
      text: `A compile error — keyof doesn't work on arrays.`,
      why: `\`keyof string[]\` compiles fine; it's the union of every array method name plus every numeric index, as a string — \`'length' | 'push' | ... | number\`. The homomorphic special case is exactly what steers the mapped type away from actually iterating that huge union into properties.`,
    },
  ];

  /** Sample: renaming a key with `as`, and dropping one by remapping to `never`. */
  protected readonly keyRemapSample = `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};

type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
};`;

  /** Line-by-line walkthrough of {@link keyRemapSample}. */
  protected readonly keyRemapNotes: CodeNote[] = [
    {
      line: 2,
      text: '`as` sits right after the loop variable and rewrites the key it produces. The template literal builds the new name from `K`; `string & K` is a formality that drops rare `symbol` keys so `Capitalize` — which only accepts `string` — always gets one.',
    },
    {
      line: 6,
      text: 'Remapping a key to `never` **deletes** it — a property cannot exist under a type that has no values. That makes this the type-level `.filter()`: keep the key when `T[K] extends Function` is true, drop it otherwise. It combines the loop (mapped type) with the test (conditional type) in one line.',
    },
  ];

  /** Sample: the plain if/else form of a conditional type. */
  protected readonly conditionalBasicsSample = `type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<'hi'>;   // 'yes'
type B = IsString<42>;     // 'no'`;

  /** Line-by-line walkthrough of {@link conditionalBasicsSample}. */
  protected readonly conditionalBasicsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`extends` here is not inheritance — it means **"is assignable to"**, the exact compatibility question the checker asks at every assignment. `?`/`:` are the true/false branches, same as JavaScript\'s ternary, just evaluated by the compiler instead of at runtime.',
    },
    {
      line: 3,
      text: "`'hi'` is a string literal, and every string literal is assignable to `string` — so the test is true and the type resolves to the literal `'yes'`.",
    },
    {
      line: 4,
      text: "`42` is a number, and `number` is never assignable to `string` — the test is false, so the whole type is the literal `'no'`.",
    },
  ];

  /** Sample: `infer` as pattern matching over a matched shape. */
  protected readonly inferSample = `type ElementType<T> = T extends (infer U)[] ? U : T;
type Unwrap<T>      = T extends Promise<infer V> ? V : T;
type MyReturn<T>    = T extends (...args: never[]) => infer R ? R : never;

type A = ElementType<number[]>;     // number
type B = Unwrap<Promise<string>>;   // string`;

  /** Line-by-line walkthrough of {@link inferSample}. */
  protected readonly inferNotes: CodeNote[] = [
    {
      line: 1,
      text: '`(infer U)[]` is a **pattern**, not a type you could write on its own. Read it as: "if `T` matches *some array*, name that array\'s element type `U` and hand it back." `infer` is pattern-matching for types — destructuring, but for the compiler.',
    },
    {
      line: 2,
      text: 'Same trick against `Promise<infer V>`. If `T` really is a `Promise` of something, `V` captures that *something* — this exact line is the skeleton of the built-in `Awaited<T>`.',
    },
    {
      line: 3,
      text: "`infer R` sits in **return position** of a function-type pattern. `never[]` is used instead of `any[]` for the parameters on purpose — it accepts a wider range of function shapes, because a function's parameters are checked contravariantly. This is the real `ReturnType<T>`.",
    },
    {
      line: 5,
      text: '`number[]` matches `(infer U)[]` with `U = number`, so the true branch returns `number`, unpacked from the array.',
    },
    {
      line: 6,
      text: '`Promise<string>` matches `Promise<infer V>` with `V = string`, so the whole type collapses to the plain value `string` — the promise wrapper is gone.',
    },
  ];

  /** Sample: peeling nested promises recursively, for the {@link Layers} diagram. */
  protected readonly deepUnwrapSample = `type DeepUnwrap<T> = T extends Promise<infer V> ? DeepUnwrap<V> : T;`;

  /** The nested-`Promise` containment diagram — outermost ring first. */
  protected readonly deepUnwrapRings: Layer[] = [
    { label: 'Promise<Promise<Promise<T>>>', sub: 'as written' },
    { label: 'Promise<Promise<T>>', sub: 'after 1 unwrap' },
    { label: 'Promise<T>', sub: 'after 2 unwraps' },
  ];

  /** The core of {@link deepUnwrapRings} — where the recursion bottoms out. */
  protected readonly deepUnwrapCore: Layer = {
    label: 'T',
    sub: 'a plain value — recursion stops here',
  };

  /** Sample: the distribution rule, and the tuple-wrap that switches it off. */
  protected readonly distributiveSample = `type ToArray<T> = T extends unknown ? T[] : never;

type A = ToArray<string | number>;
// string[] | number[]   — mapped member by member`;

  /** Sample: the same conditional, non-distributive. */
  protected readonly nonDistributiveSample = `type ToArrayND<T> = [T] extends [unknown] ? T[] : never;

type B = ToArrayND<string | number>;
// (string | number)[]   — the union stays whole`;

  /**
   * The conditional and each union member, negotiating what survives.
   *
   * A dialogue rather than another paragraph because distribution is the rule
   * learners most often apply backwards — they picture the conditional running
   * once, over the whole union, when it actually asks each member the question
   * separately and only reassembles the union at the very end.
   */
  protected readonly distributionTalk: BubbleTurn[] = [
    {
      who: 'Your code',
      says: `I wrote \`Exclude<'a' | 'b' | 'c', 'b'>\`. What do I get?`,
    },
    {
      who: 'The conditional',
      says: "`T extends U ? never : T`, and you fed me a bare `T` with a union. I don't run once — I run once per member.",
    },
    { who: "'a'", says: "extends 'b'? No. I survive." },
    {
      who: "'b'",
      says: "extends 'b'? Yes — so I become `never`, and `never` vanishes out of a union.",
    },
    { who: "'c'", says: "extends 'b'? No. I survive too." },
    {
      who: 'The conditional',
      says: `Reassemble what's left: \`'a' | never | 'c'\`. \`never\` contributes nothing — you get \`'a' | 'c'\`.`,
    },
  ];

  /** Sample: nested conditionals, run against `any`. */
  protected readonly weirdAnySample = `type Weird<T> = T extends string ? 1 : T extends number ? 2 : 3;

type W = Weird<any>;`;

  /** Sample: the `IsAny<T>` detector — the one edge case that turns the trap into a tool. */
  protected readonly anyEdgeSample = `type IsAny<T> = 0 extends (1 & T) ? true : false;

type A = IsAny<any>;      // true
type B = IsAny<string>;   // false`;

  /** Line-by-line walkthrough of {@link anyEdgeSample}. */
  protected readonly anyEdgeNotes: CodeNote[] = [
    {
      line: 1,
      text: '`1 & T` is the trick, and it avoids putting `T` in the CHECKED position — the thing to its left of `extends` is the literal `0`, not `T`. Intersecting anything with `any` collapses back to `any` (`any` absorbs everything), so when `T` is `any`, `1 & T` is `any`, and `0 extends any` is true. For every other `T`, `1 & T` is either `never` or `1` itself, and neither `0 extends never` nor `0 extends 1` is true.',
    },
    {
      line: 3,
      text: '`T` is `any`. `1 & any` is `any`, and `0 extends any` is one of the few `extends` checks that is true no matter what stands on the left — so the result is `true`.',
    },
    {
      line: 4,
      text: '`T` is `string`. `1 & string` is `never` — the numeric literal `1` and `string` share no values — and `0 extends never` is false, so the result is `false`, same as every ordinary type.',
    },
  ];

  /** The `any`-edge self-test. */
  protected readonly anyEdgeQuiz: QuizOption[] = [
    {
      text: `'not-str' — any isn't literally string, so the false branch wins.`,
      why: `That's how the check behaves for every ORDINARY type that isn't a string — but \`any\` is exempt from the assignability test this conditional relies on.`,
    },
    {
      text: `'str' | 'not-str' — both branches, unioned.`,
      correct: true,
      why: `When the type being CHECKED (the left side of \`extends\`) is exactly \`any\`, TypeScript skips the assignability test and returns the union of both branches instead. It isn't picking a branch — it's refusing to choose, because \`any\` could be anything.`,
    },
    {
      text: `'str' — any is compatible with everything, including string, so the true branch wins.`,
      why: `Compatible with \`string\`, yes — but also with every OTHER branch a conditional could have. Taking only the true branch would silently drop information the false branch might have carried.`,
    },
    {
      text: `never — the conditional can't decide, so it resolves to nothing.`,
      why: `\`never\` shows up when a distributive conditional is fed the EMPTY union — zero members to iterate over. \`any\` is the opposite problem: it behaves as if it were EVERY member at once, not none.`,
    },
  ];

  /** Sample: constructing new string literal types. */
  protected readonly templateBasicsSample = `type EventName = \`on\${Capitalize<'click' | 'hover'>}\`;
// unions inside a template DISTRIBUTE combinatorially:
// → 'onClick' | 'onHover'

type Px = \`\${number}px\`;           // matches '4px', '12.5px' — any number, then 'px'
type Route = \`/users/\${string}\`;   // constrains the shape of the string`;

  /** Sample: template literal types composed with key remapping. */
  protected readonly handlersSample = `type Handlers<T> = {
  [K in keyof T as \`on\${Capitalize<string & K>}Change\`]: (v: T[K]) => void
};

type Sample = Handlers<{ name: string; age: number }>;
// { onNameChange: (v: string) => void; onAgeChange: (v: number) => void }`;

  /** Line-by-line walkthrough of {@link handlersSample}. */
  protected readonly handlersNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Two earlier sections in one line: key remapping (`as`) builds the new name from `K`, and a template literal type is what builds that name. The value side attaches a function type — that part is nothing new.',
    },
    {
      line: 5,
      text: 'Feed it a plain two-property object and get back a fully-typed handler map — one line of input, two strongly-typed function properties out. This is the pattern behind typed event-map builders and typed form libraries: name the shape once and let the handler types derive themselves.',
    },
  ];

  /** Sample: the half of template literal types most material skips — parsing. */
  protected readonly paramsSample = `type Params<S extends string> = S extends \`\${string}:\${infer P}/\${infer R}\`
  ? P | Params<R>
  : S extends \`\${string}:\${infer P}\`
    ? P
    : never;

type Route = Params<'/users/:id/posts/:postId'>;
// 'id' | 'postId'`;

  /** Line-by-line walkthrough of {@link paramsSample}. */
  protected readonly paramsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The first arm matches a segment that has ANOTHER `:param/` somewhere later in the string. `${string}` at the front eats anything up to the first colon; `infer P` captures the param name up to the next `/`; `infer R` captures everything after that slash — the rest of the path, still to be processed.',
    },
    {
      line: 2,
      text: 'Recursion: keep `P`, the segment just captured, and union it with whatever `Params<R>` finds further down the string. This builds the result up one path segment at a time, exactly like `Params` peeling the route apart from the front.',
    },
    {
      line: 3,
      text: 'The base case: no more `/` after the next `:`, so this pattern requires only ONE more `:param` and nothing following it — the last segment of the path.',
    },
    {
      line: 7,
      text: `\`'/users/:id/posts/:postId'\` matches the first arm with \`P = 'id'\`, \`R = '/posts/:postId'\`, recurses, matches the SECOND arm this time on the remainder with \`P = 'postId'\` — and unions the two: \`'id' | 'postId'\`.`,
    },
  ];

  /** Sample: contravariant `infer` — the standard union-to-intersection trick. */
  protected readonly unionToIntersectionSample = `type UnionToIntersection<U> =
  (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void
    ? I
    : never;`;

  /** Line-by-line walkthrough of {@link unionToIntersectionSample}. */
  protected readonly unionToIntersectionNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Read the parenthesised part first: for each member of `U` (distribution, because `U` is bare), build a function type that accepts just that one member. A three-member union becomes a union of three single-argument function types.',
    },
    {
      line: 3,
      text: 'That union of functions is matched, as a whole, against the pattern `(arg: infer I) => void`. Parameters are the one place TypeScript infers **contravariantly** — to be compatible with every function in the union at once, `I` has to become their intersection, not their union.',
    },
    {
      line: 4,
      text: 'So the union you fed in comes back out the other side intersected. This is the trick behind merging a union of event-handler shapes, or several overloaded call signatures, into one callable type.',
    },
  ];

  /** Sample: recursion that is not in tail position, and blows the depth limit. */
  protected readonly naiveRecursionSample = `type Naive<N extends number, R extends unknown[] = []> = R['length'] extends N
  ? R
  : [...Naive<N, R>, unknown];

type Big = Naive<2000>;
// error TS2589: Type instantiation is excessively
//               deep and possibly infinite.`;

  /** Sample: the identical idea, restructured so the recursive call is a tail call. */
  protected readonly tailRecursionSample = `type Repeat<N extends number, R extends unknown[] = []> = R['length'] extends N
  ? R
  : Repeat<N, [...R, unknown]>;

type Big = Repeat<2000>;   // fine — recurses in tail position`;

  /** Sample: the `Prettify` trick, before and after a hover. */
  protected readonly prettifySample = `type Prettify<T> = { [K in keyof T]: T[K] } & {};

type Combined = { a: string } & { b: number };
type Clean    = Prettify<Combined>;`;

  /** Line-by-line walkthrough of {@link prettifySample}. */
  protected readonly prettifyNotes: CodeNote[] = [
    {
      line: 1,
      text: "The mapped type does nothing structurally — it loops over `T`'s own keys and copies each one straight through. Its job is to force the compiler to **flatten** the type into a fresh object literal before displaying it; the trailing `& {}` nudges the checker into evaluating it eagerly.",
    },
    {
      line: 3,
      text: 'Hover this in your editor and you see it exactly as written: `{ a: string } & { b: number }` — correct, but two intersected pieces you have to mentally merge.',
    },
    {
      line: 4,
      text: 'Hover this one instead: `{ a: string; b: number }` — one flat object. Same type, easier type. Reach for `Prettify` on any signature whose tooltip has become an intersection of five reused utility types.',
    },
  ];

  /** Sample: the classic interview exercise — every built-in utility, derived. */
  protected readonly rebuildStdlibSample = `type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyExclude<T, U> = T extends U ? never : T;
type MyOmit<T, K extends PropertyKey> = MyPick<T, MyExclude<keyof T, K>>;
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };
type MyReturnType<T> = T extends (...a: never[]) => infer R ? R : never;`;

  /** Line-by-line walkthrough of {@link rebuildStdlibSample}. */
  protected readonly rebuildStdlibNotes: CodeNote[] = [
    {
      line: 1,
      text: "`MyPartial` — the loop from the very first section, verbatim. This is not *like* `Partial`; the standard library's real implementation is this line.",
    },
    {
      line: 2,
      text: "`MyRequired` — the `-?` modifier strips optionality from every key. Combined with looking up `T[K]`'s own type, this is the actual `Required<T>`.",
    },
    {
      line: 3,
      text: '`MyReadonly` — adds `readonly` in front of the loop instead of stripping it. No minus sign needed; the modifier is additive by default.',
    },
    {
      line: 4,
      text: "`MyPick` — loops over `K` (the caller's chosen keys), not over `keyof T`. This is the non-homomorphic shape from earlier: it always produces a plain object.",
    },
    {
      line: 5,
      text: '`MyExclude` — a bare-parameter conditional, so feeding it a union runs it once per member and reassembles what survives. The whole distribution section, in one line.',
    },
    {
      line: 6,
      text: '`MyOmit` — composed, not hand-written: Pick the keys of `T` that survive Excluding `K` from `keyof T`. Utility types call each other exactly like ordinary functions.',
    },
    {
      line: 7,
      text: '`MyRecord` — the same shape as `MyPick`, except every key maps to the same value type `V` instead of a lookup. `PropertyKey` is the built-in union `string | number | symbol` — every legal object key.',
    },
    {
      line: 8,
      text: "`MyReturnType` — the `infer` pattern from the mechanism section, matched against a function's RETURN position this time instead of its parameters.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: `Why does Partial<string[]> come out as (string | undefined)[] and not an object with a length??`,
      a: `Because \`Partial\` is written as \`{ [K in keyof T]?: T[K] }\`, with \`T\` used bare inside \`keyof T\` — that bareness is what makes a mapped type **homomorphic**, and a homomorphic mapped type copies the input's own structure instead of building a fresh object. Feed it an array and you get an array back; feed it a tuple and you get a tuple back, arity and all. The object-shaped result only happens for a mapped type that loops over something OTHER than a bare \`keyof T\` — \`Pick\`, for instance, loops over the caller's chosen keys, not \`T\`'s own, and always produces a plain object.`,
    },
    {
      q: `What's the actual difference between T extends U as a generic constraint and T extends U ? X : Y as a conditional type?`,
      a: `They share a keyword and nothing else. \`function f<T extends U>(...)\` is a **constraint** — it never produces a new type, it just restricts what callers may pass for \`T\`, checked once at the call site. \`T extends U ? X : Y\` is a **conditional type** — it evaluates to \`X\` or \`Y\`, checked every time the type is used, and (when \`T\` is bare) can run once per member of a union. Seeing \`extends\` inside a \`<>\` list versus inside a \`?\` is the tell for which one you're looking at.`,
    },
    {
      q: `Why does my recursive type suddenly explode with "Type instantiation is excessively deep and possibly infinite"?`,
      a: `You've hit the compiler's recursion limit — normally in the thousands of levels, but far lower if the recursive call isn't in **tail position** (the direct, un-wrapped result of a branch). Wrapping the recursive call — \`[...Recurse<...>, X]\` instead of \`Recurse<..., [...Acc, X]>\` — forces TypeScript to keep every pending frame in memory while it resolves, the same way a non-tail-recursive function keeps every stack frame. Restructure the call so it IS the branch's return value and the checker can reuse the frame instead of stacking it; the section below has the exact before/after.`,
    },
    {
      q: `What's infer P extends string — is that new syntax?`,
      a: `It's TypeScript 4.7's constrained \`infer\`: you can add \`extends\` directly onto an inferred variable to narrow what it's allowed to capture, without a second nested conditional to check it afterwards. Match a numeric segment with \`infer N extends number\` instead of plain \`infer N\`, and \`N\` comes back as a numeric **literal** type instead of a \`string\` — useful whenever the captured piece needs to already be typed as something more specific than "any string" before you hand it back.`,
    },
    {
      q: `What is UnionToIntersection actually useful for?`,
      a: `Merging things that only make sense combined — most often a union of function or handler shapes into one callable with every overload, or a union of several partial config objects into the one shape a builder actually needs. You reach for it rarely, but when a library's \`.d.ts\` needs to turn "any of these signatures" into "all of these signatures at once", this is the one-liner that does it — and now you know why it works instead of having to memorise it.`,
    },
  ];
}
