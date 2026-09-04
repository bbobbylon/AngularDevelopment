import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Types used by the live demos ──────────────────────────────────────────────

/**
 * A tiny generic container, like a typed shipping box.
 *
 * The second type parameter on {@link Box.map} is what makes it useful: the
 * returned box's type follows the transform's return type, so
 * `Box<number>.map(n => String(n))` is a `Box<string>` without anyone
 * declaring it. `T` is fixed once per instance; `U` is fresh every call.
 */
class Box<T> {
  /**
   * @param value The wrapped value, exposed publicly via a parameter property.
   */
  constructor(public value: T) {}

  /**
   * Transforms the contents, returning a **new** `Box` of the result type.
   *
   * @param fn Transform applied to the value.
   * @returns A new box holding the result.
   */
  map<U>(fn: (v: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
}

/** Generic constraint used by {@link byId}: T must have an `id`. */
interface Entity {
  id: number;
}

/**
 * Finds an item by id.
 *
 * `T extends Entity` is the constraint that makes this both safe and useful:
 * the body can rely on `.id` existing, and the caller gets their *own* type
 * back rather than a widened `Entity`.
 *
 * @param items The collection to search.
 * @param id    The id to look for.
 * @returns The matching item, or `undefined`.
 */
function byId<T extends Entity>(items: T[], id: number): T | undefined {
  return items.find((i) => i.id === id);
}

// ── The lesson component ──────────────────────────────────────────────────────

/**
 * Lesson: generics — how inference actually solves T (arguments, widening,
 * best-common-supertype, const type params, `NoInfer`), constraints including
 * the `K extends keyof T` pattern, generic classes with type-threading map
 * chains, the return-only-generic-is-a-cast trap (`http.get<T>` included and
 * extended into DI erasure), variance (`Box<Dog>` vs `Box<Animal>`, unsound
 * array covariance, explicit `in`/`out` annotations), defaults, where generics
 * power every Angular API, and when NOT to genericize.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order is
 * deliberate:
 *
 * 1. **Pose the problem before naming the fix.** The lesson opens on "reach for
 *    `any` and stop checking anything at all", then a napkin has the reader
 *    predict which of three designs actually preserves a caller's type before
 *    the compare panel settles it.
 * 2. **Analogy, then vocabulary.** The labelled-box frame — a generic never
 *    looks inside, it only keeps the label honest — gives every later section
 *    (inference, constraints, the cast trap, variance) somewhere to attach.
 * 3. **The same idea in several modes** — a flow diagram for how T is solved, a
 *    containment diagram for `Box<T>`, a dialogue between code and the DI
 *    injector about erasure, annotated code for every real snippet, and two
 *    live demos threading a type through a chain.
 * 4. **Two coverage-sweep additions carry real weight, not decoration.**
 *    Variance (`Box<Dog>` → `Box<Animal>`, unsound array covariance, `in`/`out`)
 *    and DI erasure (`inject(Repo<User>)` cannot even be written) are both
 *    classic interview questions this lesson previously never reached, and both
 *    are wired into the trap section's existing "return-only generic is a
 *    cast" theme rather than bolted on as unrelated extra material.
 *
 * ## Demos
 *
 * Two, both signal-driven: a `Box<T>` map chain proving the type changes
 * (number in, string out) as it threads through `.map`, and a constrained
 * `byId` lookup proving the caller's exact type — not a widened `Entity` —
 * survives the round trip.
 */
@Component({
  selector: 'app-lesson-ts-generics',
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
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './generics.html',
  styleUrl: './generics.css',
})
export class Generics {
  // ── Demo 1: the Box<T> map chain ───────────────────────────────────────────

  /**
   * The value fed into the `Box` demo.
   */
  protected readonly seed = signal(2);

  /**
   * Runs the `Box` demo: wraps a number, maps it twice, and reports the
   * result — with the type changing along the chain (number → number →
   * string), threaded entirely by inference.
   */
  protected boxResult(): string {
    return new Box(this.seed()).map((n) => n * 10).map((n) => '#' + n).value;
  }

  // ── Demo 2: the constrained byId lookup ─────────────────────────────────────

  /**
   * The id looked up in the constraint demo.
   */
  protected readonly lookup = signal(1);

  /**
   * The collection searched by {@link byId}.
   */
  protected readonly users: Entity[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

  /**
   * Runs the constrained-lookup demo.
   */
  protected found(): string {
    const u = byId(this.users, this.lookup());
    return u ? `user with id ${u.id}` : 'not found';
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes', id: 'ts-classes' },
    { label: 'Generics' },
    { label: 'Enums', id: 'ts-enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  // ── Section: the problem ────────────────────────────────────────────────────

  /** The unsafe `any` version, for the opening compare panel. */
  protected readonly naiveSample = `function identity(value: any): any {
  return value;
}

const n = identity(42);   // n: any — every method call on it is now unchecked
n.toUpperCase();           // compiles. Runtime: TypeError, toUpperCase is not a function`;

  /** The generic version, for the opening compare panel. */
  protected readonly genericIntroSample = `function identity<T>(value: T): T {
  return value;
}

const n = identity(42);   // n: number — exactly what went in
n.toUpperCase();           // ✗ compile error: toUpperCase does not exist on type 'number'`;

  // ── Section: how T is inferred ──────────────────────────────────────────────

  /**
   * How inference actually solves T: single-site, explicit, and the
   * multi-site best-common-supertype case.
   */
  protected readonly inferenceSample = `function identity<T>(value: T): T {
  return value;
}

const a = identity('hi');            // T = string — the literal widened
const b = identity(42);              // T = number
const c = identity<boolean>(true);   // explicit — rarely needed

function pair<T>(a: T, b: T): T[] {
  return [a, b];
}

pair(1, 'a');   // T = string | number — best common supertype of both candidates`;

  /** Line-by-line walkthrough of {@link inferenceSample}. */
  protected readonly inferenceNotes: CodeNote[] = [
    {
      line: 1,
      text: '`<T>` declares a type parameter. `value: T` and the return type `T` are two separate USAGE SITES of the same parameter — inference reads both.',
    },
    {
      line: 5,
      text: "`'hi'` is a string literal type on its own, but a mutable call-argument position widens it. This is why `a` is `string`, not the literal `'hi'` — see the predict box below for the two fixes.",
    },
    {
      line: 7,
      text: "Explicit type arguments are legal but rarely needed — inference already found `boolean` from the argument. You supply ALL of a function's type arguments or none; there is no such thing as a partially explicit call.",
    },
    {
      line: 9,
      text: "`pair` introduces its OWN fresh `T`, scoped to this call. Sharing the letter with `identity`'s `T` above means nothing — they are unrelated type parameters that happen to be spelled the same.",
    },
    {
      line: 13,
      text: "Two candidates for one parameter, and neither is a subtype of the other. TypeScript does not error here — it unions the candidates into `string | number`, which is why `pair(1, 'a')` type-checks and returns exactly that.",
    },
  ];

  /** Prompt/answer for the literal-widening predict. */
  protected readonly literalPredictPrompt =
    "`const a = identity('hi')` infers as `string`. You need the literal `'hi'` itself preserved. Two different fixes — name them before you look.";

  /** Code shown alongside {@link literalPredictPrompt}. */
  protected readonly literalPredictCode = `const a = identity('hi');
//    ^? string

const a2 = identity('hi' as const);
//    ^? 'hi'

function pickLiteral<const T>(v: T) { return v; }
const a3 = pickLiteral('hi');
//    ^? 'hi'`;

  /** The reveal for {@link literalPredictPrompt}. */
  protected readonly literalPredictAnswer =
    "**Fix one — a const assertion at the call site:** `identity('hi' as const)` freezes the literal before it ever reaches `T`, so there is nothing left to widen. **Fix two — change the signature:** `function pickLiteral<const T>(v: T)` (TypeScript 5.0+) tells inference itself to prefer the literal, so every caller gets the narrow type with no `as const` needed at the call site. The underlying rule: a literal widens in a **mutable** position unless something — a const assertion, a `const` type parameter, or a constraint that leans literal (`T extends string`) — tells inference to keep it exactly as written.";

  /** How T actually gets solved, as a sequence — the mechanism behind {@link inferenceSample}. */
  protected readonly inferenceSteps: FlowStep[] = [
    {
      label: 'Look at every position T appears in the PARAMETERS',
      detail:
        'Not the return type — call arguments are the only thing inference reads from directly.',
    },
    {
      label: 'Collect a candidate type from each argument',
      detail: "`identity('hi')` offers one candidate: the literal `'hi'`, about to widen.",
      tone: 'accent',
    },
    {
      label: 'Reconcile the candidates',
      detail:
        'One candidate → use it, widened. Several related candidates → the best common supertype, like `pair(1, "a")` → `string | number`.',
      tone: 'accent',
    },
    {
      label: 'Context can supply a candidate too',
      detail:
        'An unannotated callback parameter borrows its type from where the function is USED — why `(x) => x * 2` inside `.map()` never needs `x: number`.',
    },
    {
      label: 'No candidate anywhere?',
      detail:
        'Falls back to the constraint, then the default, then `unknown`. This is the exact moment a return-only generic like `http.get<T>()` needs YOU to supply `<T>` — inference has nothing to read.',
      tone: 'warn',
    },
  ];

  /** `NoInfer<T>` (TS 5.4): opting a parameter OUT of being an inference site. */
  protected readonly noInferSample = `function createStreetLight<C extends string>(colors: C[], defaultColor?: C) {
  // …
}

createStreetLight(['red', 'yellow', 'green'], 'blue');
// compiles — C widens to 'red' | 'yellow' | 'green' | 'blue'. The typo just joined the union.

function createStreetLight2<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {
  // …
}

createStreetLight2(['red', 'yellow', 'green'], 'blue');
// ✗ Argument of type '"blue"' is not assignable to parameter of type '"red" | "yellow" | "green"'.`;

  /** Line-by-line walkthrough of {@link noInferSample}. */
  protected readonly noInferNotes: CodeNote[] = [
    {
      line: 1,
      text: '`defaultColor` is a SECOND inference site for `C`, alongside `colors`. Both sites feed the same type parameter.',
    },
    {
      line: 5,
      text: "Nothing catches the typo. `'blue'` was never in the `colors` array, but because it is ALSO an inference site, TypeScript just widens `C` to include it instead of rejecting it.",
    },
    {
      line: 8,
      text: '`NoInfer<C>` marks this parameter as a position `C` must be CHECKED against, not a position allowed to DECIDE it.',
    },
    {
      line: 12,
      text: "With the inference site removed, `C` is solved from `colors` alone — `'red' | 'yellow' | 'green'` — and `defaultColor` is now checked against that like an ordinary parameter.",
    },
  ];

  // ── Section: generic classes ────────────────────────────────────────────────

  /** The `Box<T>` class, annotated for the generic-classes section. */
  protected readonly boxSample = `class Box<T> {
  constructor(public value: T) {}

  map<U>(fn: (v: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
}

new Box(2)
  .map(n => n * 10)     // Box<number> — U inferred as number
  .map(n => '#' + n);   // Box<string> — U inferred as string this time`;

  /** Line-by-line walkthrough of {@link boxSample}. */
  protected readonly boxNotes: CodeNote[] = [
    {
      line: 1,
      text: "`class Box<T>` — T is the class's OWN type parameter, fixed once, the moment an instance is created.",
    },
    {
      line: 2,
      text: '`constructor(public value: T)` is a parameter property: `public` both declares `this.value` and assigns it, in one word, typed exactly `T`.',
    },
    {
      line: 4,
      text: "`map<U>` introduces a SECOND, independent type parameter, scoped to this one method call — fresh every time you call `.map`, unrelated to the class's own `T`.",
    },
    {
      line: 5,
      text: '`fn` is called with `this.value` (type `T`), and whatever it returns (type `U`) is wrapped in a brand-new `Box<U>` — the type genuinely changes, not just the value.',
    },
    {
      line: 10,
      text: 'First `.map` — `T` is `number` going in, and the callback returns `number`, so `U = number` and this line produces `Box<number>`.',
    },
    {
      line: 11,
      text: 'Chained onto that `Box<number>`, this callback returns a `string`, so `U = string` here and the final type is `Box<string>`. Nobody declared any of that by hand.',
    },
  ];

  /** `Box<T>`, drawn as containment: the class never looks inside T, it just wraps it. */
  protected readonly boxCore: Layer = { label: 'T', sub: 'whatever you pass in' };

  /** The single wrapper `Box<T>` puts around it. */
  protected readonly boxRings: Layer[] = [
    { label: 'Box<T>', sub: '.value holds it, .map<U> transforms it' },
  ];

  // ── Section: constraints with extends ───────────────────────────────────────

  /** `byId<T extends Entity>`, annotated. */
  protected readonly byIdSample = `interface Entity {
  id: number;
}

function byId<T extends Entity>(items: T[], id: number): T | undefined {
  return items.find(i => i.id === id);
}

// users: User[] — a type the compiler has never heard of inside byId
byId(users, 1);   // returns User | undefined, not Entity | undefined`;

  /** Line-by-line walkthrough of {@link byIdSample}. */
  protected readonly byIdNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The shape the constraint demands: anything passed to `byId` must have at least an `id: number`. It may have far more.',
    },
    {
      line: 5,
      text: '`T extends Entity` is the constraint. Read the whole signature as a contract: "give me an array of SOME type that has an id, and I will hand back exactly that type."',
    },
    {
      line: 6,
      text: '`.id` is legal here ONLY because of the constraint above — without it, `T` could be anything and `i.id` would not compile.',
    },
    {
      line: 10,
      text: '`users` is `User[]` somewhere outside this function, and `byId` never once mentions `User` in its own definition — yet this call returns `User | undefined`. `T` was solved as `User` for this call, and every property beyond `id` rode along for free.',
    },
  ];

  /** `K extends keyof T`, annotated. */
  protected readonly propSample = `function prop<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const ada = { name: 'Ada', age: 36 };

prop(ada, 'age');    // number — T['age'] resolves per call
prop(ada, 'name');   // string
prop(ada, 'email');  // ✗ compile error: 'email' is not 'name' | 'age'`;

  /** Line-by-line walkthrough of {@link propSample}. */
  protected readonly propNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two type parameters cooperating: `T` is the object\'s own shape, and `K extends keyof T` ties the SECOND parameter to the first — K can only ever be one of T\'s real property names. `T[K]` (indexed access) means "whatever type lives at key K".',
    },
    {
      line: 2,
      text: '`obj[key]` compiles because the constraint already proved `key` is a real property of `obj` — no cast, no `as`, no runtime check required.',
    },
    {
      line: 5,
      text: "`ada`'s type is inferred as `{ name: string; age: number }` — that is what `T` becomes for every call below.",
    },
    {
      line: 7,
      text: "`K` is solved as the literal `'age'`, so `T[K]` resolves to `T['age']`, which is `number`.",
    },
    {
      line: 9,
      text: "`'email'` was never a key of `ada`, so `keyof T` — `'name' | 'age'` — rejects it before `obj[key]` is even reached.",
    },
  ];

  /** Prompt for the `setProp` design predict. */
  protected readonly setPropPrompt =
    "Design a `setProp(obj, key, value)` that REJECTS a wrong-typed value for the given key — `setProp(user, 'age', 'old')` should fail to compile. What's the signature?";

  /** The naive, unchecked attempt shown alongside {@link setPropPrompt}. */
  protected readonly setPropCode = `// naive attempt — compiles, but checks nothing:
function setProp(obj: any, key: string, value: any): void {
  obj[key] = value;
}`;

  /** The reveal for {@link setPropPrompt}. */
  protected readonly setPropAnswer =
    "`function setProp<T, K extends keyof T>(obj: T, key: K, value: T[K]): void`. The trick is **reusing K in the value position** — once a call pins K to a literal key (say `'age'`), `T[K]` resolves to exactly that property's type, so `setProp(user, 'age', 'old')` fails because `T['age']` is `number` and `'old'` is a `string`. Three type parameters' worth of machinery, one shared constraint, zero runtime cost — this is the pattern behind every typed state-update helper (`patchValue`, a reducer, a form's `setValue`).";

  /** Self-test: what the generic constraint buys over a non-generic `Entity[]` signature. */
  protected readonly byIdQuizQuestion =
    "`byId<T extends Entity>(items: T[], id: number): T | undefined` and `byId(items: Entity[], id: number): Entity | undefined` both compile against `byId(users, 1)` where `users: User[]`. What does the generic version buy you that the other doesn't?";

  /**
   * The `byId` self-test.
   *
   * The distractors are the two mistakes this section exists to prevent: that
   * the non-generic version fails to compile (it doesn't — structural typing
   * accepts it fine), and that the difference is stylistic or about runtime
   * speed (it is neither — the whole payoff is at the return type).
   */
  protected readonly byIdQuiz: QuizOption[] = [
    {
      text: "Nothing really — they're equivalent, and the generic version is just a stylistic preference.",
      why: "They are not equivalent, and the difference shows up the moment you USE the result. `Entity[]` is a perfectly valid parameter type for a `User[]` argument, but the function's own body only ever knows about `Entity` — so the RETURN type is `Entity | undefined` no matter what came in, and every caller has to cast to get `name` or `email` back.",
    },
    {
      text: 'The non-generic version fails to compile when called with `User[]`.',
      why: "It compiles fine — that's exactly what makes the bug quiet. A `User[]` is assignable to `Entity[]` (every `User` has an `id`), so TypeScript accepts the call with no complaint at all. The cost shows up later, at the return type, not at the call site.",
    },
    {
      text: "The generic version preserves the caller's exact type all the way through to the return value.",
      correct: true,
      why: '`T` is solved as `User` for this call, and the function signature promises `T | undefined` back — so `byId(users, 1)` returns `User | undefined`, with `name`, `email`, everything, still attached. Generics are not about accepting more input types; structural typing already does that. They exist so the function does not FORGET which type came in.',
    },
    {
      text: 'The generic version runs faster, because the compiler specialises the function per type.',
      why: 'There is no per-type specialisation and no runtime difference at all — generics are erased before any JavaScript is emitted, so both versions compile to the exact same function body. The entire benefit lives at compile time, in what the type checker lets you do with the result.',
    },
  ];

  // ── Section: the cast trap ──────────────────────────────────────────────────

  /** The return-only generic — a disguised cast. */
  protected readonly fetchJsonSample = `function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then(r => r.json());   // json() returns any — T is never checked
}

const user = await fetchJson<User>('/api/user');   // feels safe. Is exactly \`user as User\`.`;

  /** Line-by-line walkthrough of {@link fetchJsonSample}. */
  protected readonly fetchJsonNotes: CodeNote[] = [
    {
      line: 1,
      text: '`T` appears exactly ONCE, in the return type. There is no argument for inference to read, so every caller must supply `<T>` explicitly — the tell that this is not really inference at work.',
    },
    {
      line: 2,
      text: '`r.json()` is typed `Promise<any>` by the DOM lib — nothing here reads or checks `T` at all. The generic is decoration on top of a value the compiler already gave up on.',
    },
    {
      line: 5,
      text: 'Syntactically this looks exactly like the safe, two-position generics from the last two sections. It is not the same thing: this line is a compile-time-only promise that nothing at runtime verifies.',
    },
  ];

  /** Self-test: is `http.get<T>` actually type-safe? */
  protected readonly httpQuizQuestion =
    "Is `this.http.get<User>('/api/user')` type-safe? Pick the answer you could defend in an interview.";

  /**
   * The `http.get<T>` self-test.
   *
   * The distractors map to the three ways people get this wrong: believing
   * the generic performs runtime validation, overcorrecting into "so don't
   * bother writing it", and confusing a return-type assertion with the
   * runtime narrowing a discriminated union gets (the next lesson's subject).
   */
  protected readonly httpQuiz: QuizOption[] = [
    {
      text: 'Yes — Angular validates the response body against `User` before resolving.',
      why: "Nothing validates it. `HttpClient.get<T>` is generic exactly like `fetchJson<T>` above — `T` appears only in the return type, so there's no argument for the compiler to check it against. The JSON comes back as `any` from the browser, and the generic simply asserts a shape on top of it.",
    },
    {
      text: "No — it's completely unchecked, so there's no point writing the type argument at all.",
      why: 'Overcorrected. Nothing is verified at runtime, but the annotation still does real work: every line downstream that touches `user.email` or `user.id` is now checked against `User`, and a typo like `user.emial` is caught at compile time even though the network payload itself never is.',
    },
    {
      text: 'Compile-time consistent, runtime unverified — worth writing, but the trust boundary is a separate decision.',
      correct: true,
      why: 'This is the whole shape of the trap. The generic is an honest compile-time promise, not a runtime guarantee — and knowing the difference is what tells you WHEN to add a schema validator (zod, valibot) at a boundary you do not fully trust, instead of everywhere.',
    },
    {
      text: 'Only if the response includes a discriminant field Angular can check.',
      why: "`HttpClient` does not inspect the response shape at all — `get<T>` has no idea `User` even has fields, discriminant or otherwise. This confuses a generic type assertion with the runtime narrowing a discriminated union gets from `typeof`/`in`/`===` checks — a different mechanism, and the next lesson's subject.",
    },
  ];

  // ── Section: generics are erased — and so is your DI token ─────────────────

  /**
   * Two compiler-checked people negotiating what a generic service reference
   * even means once T is gone.
   *
   * A dialogue rather than a paragraph because the relationship is a contract
   * with asymmetric knowledge: "your code" wants a specific `T`, and "the
   * injector" genuinely cannot see one — it can only match by the identity of
   * a runtime value. Staged as a conversation, the moment the injector says
   * "T was never part of the deal" lands as something someone told you rather
   * than a clause in a description.
   */
  protected readonly diTalk: BubbleTurn[] = [
    { who: 'Your code', says: 'inject(Repo<User>) please — I need the User repo.' },
    {
      who: 'The injector',
      says: "There's no such thing at runtime. `<User>` never survived the compiler — I only have one class called Repo.",
    },
    { who: 'Your code', says: 'Fine — inject(Repo), then.' },
    {
      who: 'The injector',
      says: 'Here you go. But I have exactly ONE Repo — if two features each register a provider for it hoping for a different T, the second one silently wins and the first is gone.',
    },
    { who: 'Your code', says: 'So how do I get a User one AND a Product one?' },
    {
      who: 'The injector',
      says: 'Give me two different tokens — a UserRepo class, or an InjectionToken<Repo<User>> — and I can hand out two different answers. I match by TOKEN IDENTITY. T was never part of the deal.',
    },
  ];

  /** The DI erasure trap and its two fixes, in one annotated snippet. */
  protected readonly diSample = `abstract class Repo<T> {
  abstract findAll(): T[];
}

// ✗ Type arguments only attach to a generic CALL — never to a bare class reference.
inject(Repo<User>);

// This is the only thing that compiles. And it erased T completely.
inject(Repo);

// Fix — one concrete, non-generic subclass per entity:
@Injectable({ providedIn: 'root' })
class UserRepo extends Repo<User> {
  findAll(): User[] { return []; }
}
const repo = inject(UserRepo);   // a distinct token — T is back

// Fix — or a token that carries the type for you:
const USER_REPO = new InjectionToken<Repo<User>>('user-repo');
const repo2 = inject(USER_REPO);   // Repo<User> — an assertion, exactly like http.get<T>`;

  /** Line-by-line walkthrough of {@link diSample}. */
  protected readonly diNotes: CodeNote[] = [
    {
      line: 1,
      text: '`abstract` — `Repo` cannot be instantiated directly, only extended. Its type parameter `T` exists purely at compile time, exactly like every other T in this lesson.',
    },
    {
      line: 6,
      text: 'This does not compile. `<User>` here tries to apply type arguments to `Repo` as a bare VALUE, and that syntax is only legal on a generic CALL — constructing or invoking something — never on a reference passed as an argument.',
    },
    {
      line: 9,
      text: 'The only legal call. `Repo` — no angle brackets — is a perfectly ordinary value (a class is a value at runtime), so `inject()` accepts it. But nothing on this line says which T you meant, because there is no runtime slot for T to go in.',
    },
    {
      line: 13,
      text: 'Fix one: stop trying to parameterise `Repo` at the injection site. Write one concrete, NON-generic subclass per entity, and let the subclass itself pin T.',
    },
    {
      line: 16,
      text: '`UserRepo` is a distinct class — a distinct runtime value — so it is a distinct DI token. Ask for a `ProductRepo` the same way and the two never collide.',
    },
    {
      line: 19,
      text: 'Fix two: an `InjectionToken<Repo<User>>` gives you a token that also carries a compile-time type, without needing a whole subclass.',
    },
    {
      line: 20,
      text: 'This line type-checks as `Repo<User>` for exactly the same reason `http.get<User>(url)` did two sections up — the factory above is trusted, not verified. Get the factory wrong and TypeScript will not catch it.',
    },
  ];

  // ── Section: variance ────────────────────────────────────────────────────────

  /** Covariant output position — a Box<Dog> is safely a Box<Animal>. */
  protected readonly covariantSample = `interface Box<out T> {
  readonly value: T;
}

declare let dogBox: Box<Dog>;
let animalBox: Box<Animal> = dogBox;   // ✓ — a box that PRODUCES a Dog also produces an Animal`;

  /** Contravariant input position — the direction flips. */
  protected readonly contravariantSample = `interface Sink<in T> {
  accept(v: T): void;
}

declare let animalSink: Sink<Animal>;
let dogSink: Sink<Dog> = animalSink;   // ✓ — something that ACCEPTS any Animal can accept a Dog`;

  /** Arrays are unsoundly covariant — the classic proof. */
  protected readonly arrayUnsoundSample = `const dogs: Dog[] = [new Dog(), new Dog()];
const animals: Animal[] = dogs;   // compiles — arrays are covariant
animals.push(new Cat());          // compiles too — Cat IS an Animal
dogs[2].bark();                   // 💥 runtime: dogs[2] is actually a Cat. No .bark method.`;

  /** Line-by-line walkthrough of {@link arrayUnsoundSample}. */
  protected readonly arrayUnsoundNotes: CodeNote[] = [
    {
      line: 2,
      text: '`Dog[]` is assigned to an `Animal[]`-typed variable and TypeScript allows it — arrays are covariant, the same rule that let `Box<Dog>` become a `Box<Animal>` above.',
    },
    {
      line: 3,
      text: "This is where arrays go further than `Box` and stop being sound: `.push` is a WRITE, an input position, yet the compiler still allows it — `Cat` is assignable to `Animal`, and TypeScript's array typing does not distinguish read from write here.",
    },
    {
      line: 4,
      text: '`dogs` and `animals` are the SAME array in memory. The push on line 3 landed a `Cat` inside `dogs` — a variable still typed `Dog[]` — and this line pays for it with a real runtime crash the compiler never warned about.',
    },
  ];

  /** Explicit `in`/`out` variance annotations (TS 4.7) — checked, not just documented. */
  protected readonly inOutSample = `interface Box<out T> {
  readonly value: T;
}

interface Sink<in T> {
  accept(v: T): void;
}

interface Broken<out T> {
  value: T;
  set(v: T): void;   // ✗ T used in an input position, but 'out' promised only output
}`;

  /** Line-by-line walkthrough of {@link inOutSample}. */
  protected readonly inOutNotes: CodeNote[] = [
    {
      line: 1,
      text: '`out T` (TypeScript 4.7+) is a promise you make, not something the compiler had to infer here — it says "T will only ever come OUT of this type", which is what licenses `Box<Dog>` → `Box<Animal>`.',
    },
    {
      line: 5,
      text: '`in T` is the mirror promise — "T only ever goes IN" — which licenses assignability in the opposite direction, exactly as the sink example above showed.',
    },
    {
      line: 11,
      text: 'The compiler actually CHECKS the promise against the real members, not just believes the keyword. `set(v: T)` puts T in an input position, contradicting `out` on line 9, so this interface itself fails to compile.',
    },
  ];

  // ── Section: generic interfaces, aliases, defaults ──────────────────────────

  /** Interfaces, aliases and defaults, annotated. */
  protected readonly interfaceDefaultsSample = `interface ApiResult<T = unknown> {
  data: T;
  status: number;
}

type Dict<V> = Record<string, V>;
type Pair<A, B = A> = [A, B];         // defaults may reference an EARLIER param

const r: ApiResult<User[]> = { data: [], status: 200 };
const s: ApiResult = { data: whoKnows, status: 200 };   // no <T> — default kicks in: T = unknown`;

  /** Line-by-line walkthrough of {@link interfaceDefaultsSample}. */
  protected readonly interfaceDefaultsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`T = unknown` is a default, read exactly like a default function parameter — used only when the caller supplies no type argument at all.',
    },
    {
      line: 6,
      text: 'A generic type ALIAS, not an interface — `Dict<V>` is shorthand for `Record<string, V>`, and `V` here is not defaulted, so it must always be supplied or inferred.',
    },
    {
      line: 7,
      text: "`Pair<A, B = A>` — the second parameter's default REFERENCES the first. Write `Pair<number>` and you get `[number, number]`; write `Pair<number, string>` and the default never triggers.",
    },
    {
      line: 9,
      text: 'The type argument is supplied explicitly, so `data` is `User[]` and nothing defaults.',
    },
    {
      line: 10,
      text: 'No `<…>` at all, so `T` falls back to the default — `unknown`, not `any`. Every reader of `s.data` must narrow before doing anything with it; the default did not silently switch checking off for them.',
    },
  ];

  // ── Questions this lesson reliably leaves behind ────────────────────────────

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do generics cost anything at runtime — extra checks, extra bytes?',
      a: "Nothing at all. Every `<T>`, every constraint, every default is erased before the JavaScript is emitted — compile a generic function and a hand-written non-generic equivalent and the output is identical. That's the whole reason generics can't validate JSON, can't be used to pick a DI provider, and can't tell you anything at runtime: there is no runtime T left to ask.",
    },
    {
      q: 'T, U, K… is there an actual rule for which letter to use?',
      a: 'Convention, not a compiler rule — nothing stops you writing `TItem` or `TResult`, and a long signature is often clearer for it. The common pattern: `T` for the first type, `U`/`V` for the next ones, `K` for a key (especially paired with `keyof`), `V` for a value, `E` for an array element, `R` for a return type.',
    },
    {
      q: 'Array<string> and string[] look identical. Are they?',
      a: 'The exact same type — `T[]` is shorthand the compiler desugars straight into `Array<T>`. Reach for the `Array<T>` spelling only when the shorthand would read ambiguously, like a function type: `(() => void)[]` reads oddly next to `Array<() => void>`.',
    },
    {
      q: 'Can a type parameter have more than one constraint?',
      a: 'Yes, two ways. Combine requirements with an intersection — `function merge<T extends object, U extends object>(a: T, b: U): T & U` — or constrain one parameter against another, the way `K extends keyof T` does. What you cannot write is `T extends A extends B`; stack constraints with `&` instead: `T extends A & B`.',
    },
    {
      q: 'Why did TypeScript infer unknown here instead of the type I expected?',
      a: 'It happens when inference has nowhere to solve T from at all — a return-only generic called with no explicit type argument, for instance — and the type parameter has no constraint or default to fall back to. Modern TypeScript lands on `unknown` rather than `any` in that situation, exactly the same defaulting rule `ApiResult<T = unknown>` uses on purpose two sections up.',
    },
  ];
}
