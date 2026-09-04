import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * A discriminated union: two shapes distinguished by a literal `kind` field.
 * The discriminant is what lets TypeScript narrow the union inside a `switch`,
 * which is the mechanism {@link Types.area} demonstrates.
 */
type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; width: number; height: number };

/**
 * One inference example: an expression, and the type TypeScript works out for
 * it without an annotation.
 */
interface InferCase {
  code: string;
  inferred: string;
  why: string;
}

const INFER_CASES: InferCase[] = [
  {
    code: `let count = 0;`,
    inferred: 'number',
    why: 'let means "this may be reassigned", so TS WIDENS the literal 0 to the whole number type — any future number is allowed.',
  },
  {
    code: `const role = 'admin';`,
    inferred: `'admin'`,
    why: `const can never be reassigned, so TS keeps the narrowest possible type: the literal 'admin' itself. Not string — exactly 'admin'. This is why const values slot perfectly into unions like 'admin' | 'user'.`,
  },
  {
    code: `let role = 'admin';`,
    inferred: 'string',
    why: `Same value, but let ⇒ widening: 'admin' becomes string. If a function expects 'admin' | 'user', passing this variable is now a compile error — a classic confusion solved by const or a type annotation.`,
  },
  {
    code: `const nums = [1, 2, 3];`,
    inferred: 'number[]',
    why: 'const prevents REASSIGNING nums, but the array contents stay mutable (push/pop) — so TS widens the elements to number[] rather than the tuple [1, 2, 3].',
  },
  {
    code: `const theme = { primary: '#dd0031' } as const;`,
    inferred: `{ readonly primary: '#dd0031' }`,
    why: 'as const freezes the whole value into its narrowest, deeply-readonly form: properties become readonly and every value keeps its literal type. The go-to for config objects and building unions from data.',
  },
  {
    code: `const done = null;`,
    inferred: 'null (or any, pre-strict)',
    why: 'Initializing with null gives TS nothing to widen to — annotate these explicitly: const done: boolean | null = null. Inference is only as good as the evidence you give it.',
  },
  {
    code: `function demo() {\n  const arr = [];\n  arr.push('y');\n  return arr;\n}`,
    inferred: `string[] — it "evolved"`,
    why: "A LOCAL const arr = [] doesn't commit to a type immediately — it starts as a placeholder any[] and TS watches every push in the SAME scope, narrowing as it goes. By the time this function returns, arr is string[]. This trick is called an evolving any, and it only works for local variables the compiler can trace pushes for within one function body.",
  },
  {
    code: `class TodoList {\n  items = [];\n}\n// this.items.push('buy milk');`,
    inferred: 'never[]',
    why: "Move the exact same [] onto a CLASS FIELD and evolving-any does not apply — a field initializer runs once, outside any function body TS can watch pushes inside, so it commits immediately to the emptiest type possible: never[], an array that can hold nothing. this.items.push('buy milk') then fails to compile: Argument of type '\"buy milk\"' is not assignable to parameter of type 'never'. Fix it with items: string[] = [], items = [] as string[], or — the way a signal-based component would do it — items = signal<string[]>([]).",
  },
];

/**
 * Lesson: Types, annotations & inference — what a type actually claims and when
 * that claim disappears (erasure, proven by compiling a real function), how
 * `let`/`const`/`as const` decide inference and widening (live explorer,
 * including the empty-array-on-a-class-field `never[]` trap), `any` vs `unknown`
 * vs `never` vs `void`, union & literal types replacing stringly-typed state,
 * discriminated unions with exhaustive narrowing (live), structural typing's
 * excess-property surprise, and `as`/`!`/`satisfies` — including why `satisfies`
 * checks a shape without ever widening it.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. As the first lesson in
 * the Type System track, its job is breadth before the specialised lessons that
 * follow it (`ts-interfaces`, `ts-narrowing`, …) go deep — so several traps that
 * get a full treatment elsewhere (exhaustiveness via `never`, the narrowing
 * mechanism itself) are introduced here and cross-linked forward rather than
 * re-taught in full.
 *
 * The teaching order is deliberate:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on a function that
 *    runs fine, silently wrong, with no type in sight — then asks what a type
 *    annotation is actually FOR, before defining one.
 * 2. **Analogy, then the mechanism, in multiple modes.** A building inspector
 *    who leaves before anyone moves in gives "erasure" somewhere to live before
 *    the word appears. The same idea then repeats as a flow diagram, an
 *    annotated function, a predict-then-reveal, and the compiled JavaScript
 *    output side by side with the source that produced it.
 * 3. **Every snippet is annotated line by line** via `app-code-lab`. Nothing on
 *    this page assumes the reader can already read the snippet.
 *
 * ## Demos
 *
 * Two, both signal-driven: the discriminated-union area calculator (existing,
 * restyled) and the inference explorer (existing, extended with the
 * coverage-sweep finding on class-field arrays inferring `never[]`).
 */
@Component({
  selector: 'app-lesson-ts-types',
  imports: [
    RouterLink,
    DecimalPipe,
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
  templateUrl: './types.html',
  styleUrl: './types.css',
})
export class Types {
  // ── Demo 1: the discriminated-union area calculator ───────────────────────

  /**
   * The shape in the narrowing demo.
   */
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });

  /**
   * The current shape's area.
   *
   * The `switch` on `kind` is doing double duty: it picks the formula, and it
   * narrows the union so `s.radius` and `s.width` are each only reachable on the
   * variant that has them.
   */
  protected readonly area = computed(() => {
    const s = this.shape();
    switch (s.kind) {
      case 'circle':
        return Math.PI * s.radius ** 2;
      case 'rect':
        return s.width * s.height;
    }
  });

  /**
   * A short description of the current shape, narrowed with a ternary rather than
   * a `switch` to show the same mechanism in its smaller form.
   */
  protected describe(): string {
    const s = this.shape();
    return s.kind === 'circle' ? `circle r=${s.radius}` : `rect ${s.width}×${s.height}`;
  }

  // ── Demo 2: the inference explorer ─────────────────────────────────────────

  /**
   * The inference examples, including the two that fold in the coverage-sweep
   * finding on evolving-any vs a class field's `never[]`.
   */
  protected readonly inferCases = INFER_CASES;
  /**
   * Which inference example is showing.
   */
  protected readonly inferIdx = signal(0);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes', id: 'ts-classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  /**
   * Erasure drawn as a four-step pipeline: write or infer, check once, strip,
   * then run with nobody watching. The one highlighted step is the payload —
   * everything before it is setup, and everything after it is the consequence.
   */
  protected readonly mechanismFlow: FlowStep[] = [
    {
      label: 'You write .ts',
      detail:
        'An annotation is a claim. Leave one off and you are asking the compiler to write one for you instead.',
    },
    {
      label: 'tsc checks — once',
      detail:
        'Every claim, yours or inferred, is checked against how the value is actually built and used.',
    },
    {
      label: 'Types erased',
      detail:
        'Every `: string`, every generic, every interface — stripped out entirely. What remains is JavaScript that always could have run.',
      tone: 'warn',
    },
    {
      label: 'Runtime — on your own',
      detail:
        'Nothing checks a shape again. `any`, `never`, `unknown` — none of it exists past this line.',
    },
  ];

  /**
   * `any` and `unknown` negotiating with the compiler over how much trust each
   * one is owed.
   *
   * A dialogue rather than a paragraph because the relationship the two names
   * describe is asymmetric, and learners reliably flatten "any is unsafe" and
   * "unknown is unsafe" into the same sentence. Staging it as a conversation
   * keeps who-conceded-what in the right order.
   */
  protected readonly anyUnknownTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: "I don't know this value's shape yet. Type it `any` so you leave me alone.",
    },
    {
      who: '`any`',
      says: "Deal. I'll hold anything, return anything, and let you call any method you like — I won't check a thing.",
    },
    {
      who: 'The compiler',
      says: "And neither will I, on anything YOU touch next. Every value that flows through `any` becomes `any` too — that's not a favour, that's contagion.",
    },
    {
      who: 'You',
      says: 'Fine — give me the safe version.',
    },
    {
      who: '`unknown`',
      says: "I'll hold anything too. But you don't get to call a single method on me until you prove what I am.",
    },
    {
      who: 'The compiler',
      says: "That's the deal I actually wanted. Same flexibility at the door, none of the spread.",
    },
  ];

  /** Sample: a function signature spread across lines so the erasure walkthrough can annotate each claim separately. */
  protected readonly greetSample = `function greet(
  name: string,
  times: number = 1,
): string {
  return ('Hi ' + name + '!').repeat(times);
}`;

  /** Line-by-line walkthrough of {@link greetSample}. */
  protected readonly greetNotes: CodeNote[] = [
    {
      line: 2,
      text: '`: string` after `name` is your claim about this parameter — nothing here is enforced by anything that runs. It is only ever checked.',
    },
    {
      line: 3,
      text: '`= 1` is a **default parameter value**, and it is real JavaScript. This is the one piece of this whole signature that survives compilation completely unchanged, because a runtime genuinely needs an actual fallback value — a type has nothing to fall back to.',
    },
    {
      line: 4,
      text: 'A second claim, this time about the return value: `: string` says every path through this function hands back a string.',
    },
    {
      line: 5,
      text: 'Ordinary JavaScript: string concatenation and a `String.prototype.repeat` call. Nothing on this line is type-checking — the claims above are what let the compiler prove this line is even legal before it runs.',
    },
  ];

  /** What `tsc` actually emits for {@link greetSample} — every annotation gone, the default preserved. */
  protected readonly greetCompiledSample = `function greet(name, times = 1) {
  return ('Hi ' + name + '!').repeat(times);
}`;

  /** Sample: primitives, arrays and tuples, spread one concern per line for annotation. */
  protected readonly primitivesSample = `let name: string = 'Ada';
let age: number = 36;
let active: boolean = true;
let big: bigint = 9007199254740993n;
let sym: symbol = Symbol('id');
let nothing: null = null;
let missing: undefined = undefined;

let ids: number[] = [1, 2, 3];
let pair: [string, number] = ['a', 1];
let rest: [string, ...number[]] = ['x', 1, 2];`;

  /** Line-by-line walkthrough of {@link primitivesSample}. */
  protected readonly primitivesNotes: CodeNote[] = [
    {
      line: 1,
      text: "`: Type` after a name is an **annotation** — a claim the compiler holds you to for the rest of this binding's life. All seven primitives below follow this same shape.",
    },
    {
      line: 2,
      text: 'Every number in TypeScript is a float under the hood — JavaScript never had a separate `int` type, and TypeScript does not invent one. `36` and `36.5` are both simply `number`.',
    },
    {
      line: 4,
      text: '`bigint` exists because `number` can only represent integers exactly up to 2^53 − 1. The trailing `n` is JavaScript syntax for a BigInt literal, not something TypeScript added.',
    },
    {
      line: 6,
      text: "`null` and `undefined` are each their own type here, holding exactly one value apiece. Under `strict` mode — this app's setting — neither is assignable to `string` unless you write the union yourself: `string | null`.",
    },
    {
      line: 9,
      text: '`number[]` means "array of numbers", exactly the same type as `Array<number>` — the two spellings are interchangeable, so pick one style and stay consistent across a codebase.',
    },
    {
      line: 10,
      text: 'A **tuple**: fixed length AND a type pinned to each position. `pair[0]` is `string`, `pair[1]` is `number`, and `pair[2]` is a compile error — as far as the type is concerned, there is no third slot to read.',
    },
    {
      line: 11,
      text: 'The `...number[]` is a **rest element** — any number of trailing numbers after the fixed `string` in position 0. A tuple can mix a fixed prefix with an open tail like this one.',
    },
  ];

  /** Sample: an unguarded index read compiling under `strict` — the noUncheckedIndexedAccess gap. */
  protected readonly indexAccessSample = `function nth(xs: number[], i: number): string {
  return xs[i].toFixed(2);
  // compiles under strict. xs might have 3 elements; i might be 99.
}`;

  /** Sample: the safe boundary pattern — untyped data enters as `unknown`, not `any`. */
  protected readonly boundarySample = `function parse(json: string): unknown {
  return JSON.parse(json);
}

const data = parse('{"name":"Ada"}');

if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log(data.name);
}`;

  /** Line-by-line walkthrough of {@link boundarySample}. */
  protected readonly boundaryNotes: CodeNote[] = [
    {
      line: 1,
      text: "`JSON.parse` is declared in the standard library as returning `any` — re-declaring THIS function's return type as `unknown` overrides that and stops the contagion right at the door.",
    },
    {
      line: 2,
      text: 'The parse call is unchanged. `unknown` does not restrict what the function can return — only what a CALLER is allowed to assume about the result.',
    },
    {
      line: 5,
      text: '`data` is `unknown`, not `any`. Try `data.name` on this line right now and the compiler refuses — which is the entire point of choosing `unknown` at this boundary.',
    },
    {
      line: 7,
      text: 'Three checks joined by `&&`, so all three must pass before the branch runs: it is an object, it is not `null` (because `typeof null === "object"`, the oldest gotcha in the language), and it actually has a `name` key.',
    },
    {
      line: 8,
      text: 'Reachable only after all three checks passed. `data` is narrowed to an object with a `name` key here — the compiler decided that, not a runtime guess.',
    },
  ];

  /** Sample: the discriminated union and the switch that narrows it. */
  protected readonly shapeSample = `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.radius ** 2;
    case 'rect':
      return s.width * s.height;
  }
}`;

  /** Line-by-line walkthrough of {@link shapeSample}. */
  protected readonly shapeNotes: CodeNote[] = [
    {
      line: 2,
      text: "`'circle'` here is a **literal type** — not `string`, but the exact string `'circle'` and nothing else. That single word is what makes this whole pattern work.",
    },
    {
      line: 3,
      text: 'The other arm. It shares no properties with the circle arm except the one field that matters: `kind`.',
    },
    {
      line: 6,
      text: 'Switching on `s.kind` is what narrows. Inside each `case`, the compiler has already proven which arm `s` is — one comparison that also teaches the type checker something.',
    },
    {
      line: 8,
      text: "`.radius` only exists here. Read it inside the `'rect'` case instead and it's a compile error — `radius` genuinely is not part of that arm's type.",
    },
    {
      line: 10,
      text: 'And here the compiler knows the opposite: `s` is the rect arm, so `.width` and `.height` exist and `.radius` does not.',
    },
  ];

  /** Sample: two interfaces that never heard of each other, compatible by shape. */
  protected readonly structuralSample = `interface Point {
  x: number;
  y: number;
}

interface Coord {
  x: number;
  y: number;
}

const p: Point = { x: 1, y: 2 };
const c: Coord = p;

const labeled = { x: 1, y: 2, label: 'home' };
const p2: Point = labeled;`;

  /** Line-by-line walkthrough of {@link structuralSample}. */
  protected readonly structuralNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two interfaces, declared completely separately. `Point` and `Coord` never mention each other anywhere.',
    },
    {
      line: 6,
      text: '`Coord` repeats the exact same two fields under a different name. As far as TypeScript is concerned, that repetition is not a coincidence worth noting — it is the whole type.',
    },
    {
      line: 12,
      text: 'This compiles. `p` is assigned to a `Coord`-typed variable despite the two interfaces never heard of each other — TypeScript compares **members**, not names. Same shape, compatible, full stop.',
    },
    {
      line: 14,
      text: 'An object literal with an extra property, `label`, and no annotation — TypeScript infers its own shape, extra property included.',
    },
    {
      line: 15,
      text: "This ALSO compiles, and it's the one people don't expect: `labeled` carries more than `Point` asks for, and 'more than required' is fine when it arrives through a variable. Write the identical three properties as a fresh literal instead and it stops compiling — the next beat explains exactly why.",
    },
  ];

  /** Predict prompt: the excess-property check, contrasted with the variable case above. */
  protected readonly excessPropertyCode = `const p3: Point = { x: 1, y: 2, label: 'home' };`;

  /** The reveal for {@link excessPropertyCode}. */
  protected readonly excessPropertyAnswer =
    "No — **TS2353: Object literal may only specify known properties, and 'label' does not exist in type 'Point'.** This is the **excess property check**, and it only fires on a fresh literal written directly at the assignment. The reasoning: a literal with a property the target type never asked for is almost always a typo — you meant `Point`'s `x`/`y` and added a third field by mistake — so TypeScript flags it at the one moment it can still be caught as a mistake rather than as something deliberate. Route the exact same object through a variable first, the way `labeled` did above, and the check is skipped: by then the compiler can no longer prove the extra property was not intentional.";

  /** Sample: `as`, `!` and `satisfies`, one line each. */
  protected readonly assertionsSample = `const el = document.querySelector('input') as HTMLInputElement;
const value = el!.value;
const config = { retries: 3 } satisfies Record<string, number>;`;

  /** Line-by-line walkthrough of {@link assertionsSample}. */
  protected readonly assertionsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`querySelector` really returns `Element | null` — it has no way to know what selector you passed. `as HTMLInputElement` is an **assertion**: you tell the compiler to trust you, and it does, with **zero runtime check**. Pass the wrong selector and this line is a silent lie until `.value` crashes somewhere else entirely.',
    },
    {
      line: 2,
      text: '`el!` is the **non-null assertion** — same deal, smaller scope: "not null, right here, I promise." Get it wrong and `.value` throws `Cannot read properties of null`, with the assertion nowhere in the stack trace to blame.',
    },
    {
      line: 3,
      text: "`satisfies` **validates** `{ retries: 3 }` against `Record<string, number>` — every value really is a `number` — but, unlike an annotation, it does NOT replace `config`'s type with `Record<string, number>`. `config` keeps its own narrower, inferred shape: `{ retries: number }`.",
    },
  ];

  /** `Record<string, string[]>` annotation: open keys, no completeness check. */
  protected readonly routesAnnotationSample = `type Section = 'admin' | 'user' | 'guest';

const routes: Record<string, string[]> = {
  admin: ['/admin', '/admin/users'],
  user: ['/dashboard'],
  gust: ['/welcome'],   // typo — compiles. It's just another string key.
};

routes.whatever;   // string[] — also compiles. Nothing here actually exists.`;

  /** `satisfies Record<Section, string[]>`: closed keys, no widening of `routes` itself. */
  protected readonly routesSatisfiesSample = `type Section = 'admin' | 'user' | 'guest';

const routes = {
  admin: ['/admin', '/admin/users'],
  user: ['/dashboard'],
  gust: ['/welcome'],   // ❌ TS2561 — 'gust' does not exist in type 'Record<Section, string[]>'. Did you mean to write 'guest'?
} satisfies Record<Section, string[]>;

routes.whatever;   // ❌ Property 'whatever' does not exist`;

  /** Stringly-typed state: any string compiles, including a typo. */
  protected readonly stringlyTypedSample = `let status: string = 'active';
status = 'actvie';   // typo — compiles. Nothing catches it until it's in production.`;

  /** The same state, modelled as a literal union. */
  protected readonly literalUnionSample = `type Status = 'active' | 'paused' | 'cancelled';
let status: Status = 'active';
status = 'actvie';   // ❌ compile error — not assignable to type 'Status'`;

  /** The widening self-test's question. */
  protected readonly wideningQuizQuestion =
    "`let method = 'GET';` then `fetch(url, { method })`. TypeScript expects `method` to be `'GET' | 'POST' | ...`, and this fails to compile — yet replacing the variable with the literal `'GET'` directly at the call site works fine. What's going on?";

  /**
   * The first self-test: `let`/`const` widening, staged as an exam-style trap.
   *
   * The distractors are the three explanations a learner reaches for before
   * "widening" — a compiler bug, a rule about mutability, and a rule about
   * literals vs variables — each one plausible enough to be worth naming and
   * correcting rather than skipping past.
   */
  protected readonly wideningQuiz: QuizOption[] = [
    {
      text: "It's a TypeScript bug — the two values are identical.",
      why: 'The VALUES are identical at runtime, which is exactly why this feels unfair. But the compiler is not comparing values here, it is comparing declared TYPES — and `let` gave that variable a much wider one than the literal ever had.',
    },
    {
      text: "`let` widened `'GET'` to the general `string` type, and `string` is not assignable to the narrower union `fetch` expects.",
      correct: true,
      why: 'Exactly. Because a `let` binding CAN be reassigned, TypeScript refuses to remember the exact value — it only remembers the shape of value that could ever live there, and for a string literal that shape is `string` itself.',
    },
    {
      text: 'Function arguments always require `const` bindings.',
      why: 'Not true — a `let` variable is accepted anywhere a `const` one is. The problem is not a rule about mutability at the call site; it is which TYPE got inferred for the variable back when it was declared.',
    },
    {
      text: "TypeScript doesn't check variables passed into third-party functions, only literals written inline.",
      why: "The opposite is true — TypeScript checks a variable's DECLARED type wherever it flows, which is precisely why this mismatch gets caught at all. A literal typed `'GET'` directly at the call site never goes through a widening step in the first place, so there is nothing here to catch.",
    },
  ];

  /** The class-field-array self-test's question. */
  protected readonly neverArrayQuizQuestion =
    "You write `items = [];` as a field on an Angular component class, then call `this.items.push('buy milk')` in a method. What happens?";

  /**
   * The second self-test: the coverage-sweep finding on class fields inferring
   * `never[]`, staged so the wrong answers correct the exact three beliefs a
   * learner brings from the inference explorer above — that arrays always
   * evolve, that erasure means nothing checks field initializers, and that
   * inference looks ahead into a class's methods.
   */
  protected readonly neverArrayQuiz: QuizOption[] = [
    {
      text: 'Nothing — empty arrays are always `any[]` until you push something into them.',
      why: 'True for a LOCAL variable, where TypeScript watches the pushes and evolves the type as it goes. A class field initializer is not inside a function body TS can trace pushes through — it commits to a type immediately, and the emptiest type it can commit to is `never[]`.',
    },
    {
      text: "A compile error: Argument of type '\"buy milk\"' is not assignable to parameter of type 'never'.",
      correct: true,
      why: '`items` infers as `never[]` — an array that can hold nothing — so pushing anything at all, including a string, is rejected. Fix it with `items: string[] = []`, `items = [] as string[]`, or `items = signal<string[]>([])`.',
    },
    {
      text: "A runtime error the first time `add()` runs, because types don't check field initializers.",
      why: 'Types check EVERYTHING before a single line runs — this is caught at compile time, and the app never ships with the bug live. Erasure means checked types vanish AFTER checking; it never means some code skips the checking step.',
    },
    {
      text: 'It infers `string[]` automatically, because `push` is called with a string somewhere in the class.',
      why: "A field initializer's type is decided at the declaration, once, without scanning ahead into every method that might touch it later. Only a LOCAL variable in the very same scope as the pushes gets that lookahead treatment.",
    },
  ];

  /** Sentence used verbatim inside the "Discipline order" remember box, kept here so a typo can't drift between prose and box. */
  protected readonly satisfiesRule =
    "An **annotation** replaces an expression's type with the annotation's type — wider, here, an open dictionary that nods along to any key you type. `satisfies` only CHECKS that the expression matches the target type; the variable keeps its own exact, inferred shape afterward. You get the validation without losing the precision.";

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'If types disappear at runtime, why does my app ever crash with a type-shaped error?',
      a: 'Because something upstream made an unchecked promise. An `as`, a `!`, an `any` that snuck past a boundary, or a `fetch` response you trusted without narrowing — every one of those is a claim the compiler believed without verifying, and erasure means nothing is left to catch the moment the claim turns out to be false. The type system only protects the code it actually checked.',
    },
    {
      q: "An API function returns `any`. What's the cheapest way to contain it?",
      a: "Wrap it: assign the result to `unknown` (or declare your own wrapper function's return type explicitly), then narrow once, centrally, right at that boundary. The goal is to stop the contagion at one place instead of letting `any` seep through every caller downstream. Turning on `noImplicitAny` in `tsconfig.json` at least makes new leaks announce themselves.",
    },
    {
      q: 'Is `Record<string, V>` actually safe to index into?',
      a: 'Not by default — `dict.anyKeyAtAll` type-checks as `V` even for a key that was never set, because an open `Record<string, V>` claims every possible string is a valid key. `noUncheckedIndexedAccess` is the flag that fixes this: it makes every indexed read — arrays, `Record`, index signatures — come back as `V | undefined` instead, forcing a check before use.',
    },
    {
      q: 'True or false: `as HTMLInputElement` converts the element for you.',
      a: 'False — an assertion performs **zero** runtime work; it only changes what the compiler believes. If the element is actually a `<div>` (or `null`), the code still compiles, and it explodes on `.value` at runtime instead. Contrast with narrowing — `if (el instanceof HTMLInputElement)` — which really checks.',
    },
    {
      q: 'I already have `as const`. Do I still need `satisfies`?',
      a: 'They do different jobs and often show up together. `as const` freezes a value — every property becomes `readonly` and every literal stays exactly itself — but it does not check the value against anything. `satisfies` checks a value against a type — every key present, every value assignable — but does not freeze it. `{ retries: 3 } satisfies Record<string, number>` validates the shape; `{ retries: 3 } as const` freezes `retries` to the literal `3`. Chain them — `{ retries: 3 } as const satisfies Record<string, number>` — when you want both.',
    },
  ];
}
