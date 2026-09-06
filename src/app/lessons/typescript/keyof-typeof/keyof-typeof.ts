import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

const THEME = {
  primary: '#dd0031',
  accent: '#7c4dff',
  success: '#2ec16b',
} as const;

/**
 * The keys of the theme object, derived rather than written out.
 *
 * `typeof THEME` lifts the runtime value into the type world; `keyof` then takes
 * its keys. Adding a colour to `THEME` widens this automatically — which is the
 * point: one source of truth instead of a value and a matching union that drift.
 */
type ThemeKey = keyof typeof THEME; // 'primary' | 'accent' | 'success'

const ROLES = ['admin', 'editor', 'viewer'] as const;

/**
 * Lesson: keyof / typeof / indexed access — deriving types FROM values so
 * nothing drifts, each operator dissected on its own with edge cases, the
 * three composed into one compound expression, the type-safe getter built up
 * parameter by parameter, live derived-keys demos, and the single-source-of-
 * truth pattern (const object → keys → values → unions) used across real
 * Angular codebases.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the drift problem before naming the fix.** A hand-written union
 *    sitting next to an object it describes is a bug every reader has already
 *    shipped — the operators are introduced as the cure for a pain they
 *    recognise, not as three names to memorise.
 * 2. **One analogy carries the whole page.** Typing a type by hand is typing a
 *    number into a spreadsheet cell; `typeof`/`keyof`/`T[K]` are the formula
 *    bar. It explains `as const` (keep the exact value) and erasure (the
 *    printout has no formulas on it) as the same idea applied twice.
 * 3. **A dialogue covers the mix-up the table alone can't.** `keyof THEME` is a
 *    type error because `THEME` is a value — staged as the compiler correcting
 *    a developer, so the value/type distinction is *felt* before it is stated.
 * 4. **Every operator gets its own annotated snippet**, then the three are
 *    recomposed as one chain diagram and one generic function, because the
 *    exam-relevant failure mode is reading the individual pieces fine and
 *    still not being able to parse `(typeof ROUTES)[keyof typeof ROUTES]`.
 * 5. **Every snippet is annotated line by line** via `app-code-lab`. Nothing on
 *    this page assumes the reader can already read the snippet.
 *
 * ## Demos
 *
 * Two, both signal-driven, both carried over unchanged from the previous
 * version of this lesson: the `T[number]` role picker and the `keyof typeof
 * THEME` colour picker — the latter is also what the opening napkin asks the
 * reader to predict against.
 */
@Component({
  selector: 'app-lesson-ts-keyof-typeof',
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
  templateUrl: './keyof-typeof.html',
  styleUrl: './keyof-typeof.css',
})
export class KeyofTypeof {
  // ── Demo 1: the THEME colour picker ─────────────────────────────────────────

  /**
   * The theme keys, for the picker. The assertion is needed because
   * `Object.keys` is typed as `string[]` — it cannot promise no extra keys exist
   * at runtime.
   */
  protected readonly keys = Object.keys(THEME) as ThemeKey[];
  /** The selected key. */
  protected readonly key = signal<ThemeKey>('primary');
  /**
   * Its value. Indexing `THEME` by a `ThemeKey` is checked at compile time, so a
   * typo here would not build.
   */
  protected readonly value = computed(() => THEME[this.key()]);

  // ── Demo 2: the roles picker (T[number]) ────────────────────────────────────

  /** The `as const` role tuple, whose literal types drive the demo. */
  protected readonly roles = ROLES;
  /** Which role is selected. */
  protected readonly roleIndex = signal(0);
  /**
   * The selected role — typed as the literal union, not `string`, because the
   * source array is `as const`.
   */
  protected readonly role = computed(() => this.roles[this.roleIndex()]);

  // ── Presentation data ────────────────────────────────────────────────────────

  /**
   * Sample: a hand-written union going stale next to the object it describes.
   *
   * Kept as a bound field rather than typed directly into the template: a
   * literal `{` inside plain template text is read by Angular's parser as the
   * start of an ICU expression, so copy containing a brace has to be bound
   * instead — see `mapped-conditional.ts` for the same rule.
   */
  protected readonly configSample = `const config = { retries: 3, url: '/api', timeout: 5000 };

type ConfigKey = 'retries' | 'url' | 'timeout';`;

  /** Sample: this component's own THEME-picker source, for the live demo below it. */
  protected readonly themeSourceSample = `const THEME = { primary: …, accent: …, success: … } as const;

type ThemeKey = keyof typeof THEME;        // 'primary' | 'accent' | 'success'
const keys = Object.keys(THEME) as ThemeKey[];   // the buttons above
const key  = signal<ThemeKey>('primary');        // can ONLY hold real keys`;

  /** The as-const-freeze quiz's question, bound for the same brace reason. */
  protected readonly asConstQuizQuestion =
    "Now the other direction. `const config = { retries: 3, url: '/api' } as const;` and `function update<K extends keyof typeof config>(key: K, value: (typeof config)[K]) {}`. Does `update('retries', 5)` compile?";

  /** The Advanced Types track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Utility Types', id: 'ts-utility-types' },
    { label: 'keyof & typeof' },
    { label: 'Mapped & Conditional', id: 'ts-mapped-conditional' },
  ];

  /**
   * The mix-up this whole page exists to prevent, staged as a conversation
   * rather than a paragraph: a developer expects `keyof` to read a value, and
   * the compiler has to correct them before the real operator combo lands.
   */
  protected readonly mixupTalk: BubbleTurn[] = [
    { who: 'You', says: '`keyof THEME` should give me the keys, right?' },
    {
      who: 'The compiler',
      says: '`THEME` is a **value**. `keyof` only reads types — I don’t know what to do with a value.',
    },
    { who: 'You', says: 'Fine — `typeof THEME`, then?' },
    {
      who: 'The compiler',
      says: 'Now you’re talking. That’s a type — the exact shape `THEME` has. Hand me that instead.',
    },
    { who: 'You', says: 'So: `keyof typeof THEME`?' },
    {
      who: 'The compiler',
      says: "`'primary' | 'accent' | 'success'`. Every time. That's why the two words always travel together.",
    },
  ];

  /**
   * The three operators, named and shelved as a row of cards right after the
   * dialogue above stages the confusion between them.
   */
  protected readonly operators = [
    {
      op: 'typeof x',
      kicker: 'takes a value',
      gives: "that value's type",
      use: 'typeof THEME, ReturnType<typeof fn>',
      trap: 'Forgetting `as const`, so literals widen to `string`',
      tone: 'accent' as const,
    },
    {
      op: 'keyof T',
      kicker: 'takes a type',
      gives: 'a union of its key names',
      use: 'keyof typeof THEME',
      trap: '`keyof someArray` includes `push`, `length` and friends',
      tone: 'gold' as const,
    },
    {
      op: 'T[K]',
      kicker: 'takes a type + a key type',
      gives: 'the type stored at that key',
      use: "User['id'], T[keyof T], T[number]",
      trap: 'The key must be a type — `T[myVar]` is not valid',
      tone: 'olive' as const,
    },
  ];

  /** Sample: `typeof` lifting a value (and a function) into the type world. */
  protected readonly typeofSample = `const theme = { primary: '#dd0031', accent: '#7c4dff' } as const;

type Theme = typeof theme;
// = { readonly primary: '#dd0031'; readonly accent: '#7c4dff' }

function makeUser(name: string) {
  return { id: 1, name };
}

type UserShape = ReturnType<typeof makeUser>;
// = { id: number; name: string }`;

  /** Line-by-line walkthrough of {@link typeofSample}. */
  protected readonly typeofNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The only hand-written thing here. `as const` freezes every property to its exact literal type — drop it and `theme.primary` would just be the wide type `string`, and everything derived below would inherit that wideness.',
    },
    {
      line: 3,
      text: 'The type-level `typeof`. It shares a keyword with the **runtime** `typeof x === \'string\'` from the narrowing lesson, but this one only exists in a type position and is resolved — then discarded — entirely at compile time.',
    },
    {
      line: 4,
      text: "What the compiler actually produced, written as a comment because there's no way to print a type once the program is running. Both members came out `readonly` — that's `as const` again, stamped onto every property.",
    },
    {
      line: 6,
      text: "An ordinary function that builds an object. `typeof makeUser` alone would give you its whole function type; the combination on the next real line is what makes that useful.",
    },
    {
      line: 10,
      text: "The combo you'll type weekly: `ReturnType<>` unwraps a function type down to what it returns, and `typeof makeUser` is what lets it operate on a function whose return type you never wrote out by hand.",
    },
  ];

  /** Sample: `keyof`, plus the two edge cases worth having met once. */
  protected readonly keyofSample = `type ThemeKey = keyof typeof theme;
// = 'primary' | 'accent'

type AnyKey = keyof Record<string, number>;
// = string | number    — an index signature's keyof includes both

type ArrKeys = keyof string[];
// = number | 'length' | 'push' | 'slice' | …   — every array member, too`;

  /** Line-by-line walkthrough of {@link keyofSample}. */
  protected readonly keyofNotes: CodeNote[] = [
    {
      line: 1,
      text: "value → type → union of key names, the pairing you'll write constantly. `typeof theme` lifts the value from the last CodeLab; `keyof` takes that type's key names and unions them into `'primary' | 'accent'`.",
    },
    {
      line: 4,
      text: "`Record<string, number>` has an **index signature**, not a fixed list of properties — there's nothing for `keyof` to enumerate, so it falls back to the signature's own key type instead of a list of literal names.",
    },
    {
      line: 5,
      text: "`number` shows up too, even though the signature only says `string`. A numeric property access (`obj[0]`) is stringified before TypeScript looks it up, so a `string` index signature's key type quietly includes `number` as well.",
    },
    {
      line: 7,
      text: "Arrays are objects with methods. `keyof` has no way to know you meant \"the valid indexes\" — it walks every member `string[]` genuinely has, methods included.",
    },
    {
      line: 8,
      text: "This result is almost always a sign you actually wanted `T[number]` — the element type, not the enormous list of everything you could call on the array. That's exactly what the next section builds.",
    },
  ];

  /** Sample: indexed access, including the nested and tuple cases. */
  protected readonly indexedSample = `interface User {
  id: number;
  roles: string[];
  address: { city: string };
}

type Id = User['id'];
// = number

type City = User['address']['city'];
// = string     — one bracket per layer you travel through

type Vals = User[keyof User];
// = number | string[] | { city: string }   — index by a UNION of keys

type Role = User['roles'][number];
// = string   — "the element type of roles"

type Tuple = [boolean, string];
type Second = Tuple[1];
// = string   — tuples index per position, not per element type`;

  /** Line-by-line walkthrough of {@link indexedSample}. */
  protected readonly indexedNotes: CodeNote[] = [
    {
      line: 1,
      text: "A plain interface, nothing special yet — including one nested object member, `address`. Every bracket trick below operates on this one shape.",
    },
    {
      line: 7,
      text: "Same brackets as a runtime property lookup (`user['id']`), but operating on the **type** `User`, not a value. The key has to be a literal type — `'id'`, not a variable that merely holds the string `'id'` at runtime.",
    },
    {
      line: 10,
      text: 'Chain the brackets to reach inside a nested member. Read it left to right, one layer travelled per pair of brackets — exactly like the runtime access it mirrors.',
    },
    {
      line: 13,
      text: 'Index by `keyof User` — every key at once — and you get the union of every value type instead of a single one. Keys go in as a union; value types come out as a union.',
    },
    {
      line: 16,
      text: 'Indexing by the type `number` means "give me the element type", for an array or a tuple. This is the idiom for "one item of an array I already have" — used constantly.',
    },
    {
      line: 20,
      text: "A tuple indexes by exact **position**, not generically like an array. `Tuple[1]` is specifically the second slot's type, `string` — not the union of every element the way an array's `T[number]` would give you.",
    },
  ];

  /** The nested-property containment diagram — outermost ring first. */
  protected readonly indexedRings: Layer[] = [
    { label: 'User', sub: 'where the chain starts' },
    { label: 'address', sub: "one bracket in — User['address']" },
  ];

  /** The core of {@link indexedRings} — where the chain bottoms out. */
  protected readonly indexedCore: Layer = {
    label: 'city',
    sub: 'string — the value the whole chain resolves to',
  };

  /**
   * The derivation chain, one link at a time. Worth drawing because people learn
   * these three operators separately and then cannot read
   * `(typeof ROUTES)[keyof typeof ROUTES]` — which is nothing but the chain below
   * written in one line.
   */
  protected readonly chain: FlowStep[] = [
    {
      label: '`const THEME = { … } as const`',
      detail: 'A real runtime value. The only thing you hand-write',
      tone: 'accent',
    },
    {
      label: '`typeof THEME` → a type',
      detail: 'Lifts the value into the type world. `as const` keeps the literals exact',
    },
    {
      label: '`keyof typeof THEME` → key union',
      detail: "`'primary' | 'accent' | 'success'`",
    },
    {
      label: '`(typeof THEME)[ThemeKey]` → value union',
      detail: "`'#dd0031' | '#7c4dff' | '#2ec16b'`",
    },
    {
      label: 'Everything above is erased',
      detail: 'Zero bytes in the bundle. The object is the only survivor',
      tone: 'good',
    },
  ];

  /** Sample: the classic type-safe getter, built from all three operators. */
  protected readonly getterSample = `function prop<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

prop(user, 'id');     // return type: number
prop(user, 'roles');  // return type: string[]

// prop(user, 'xyz'); // ❌ 'xyz' is not assignable to keyof User`;

  /** Line-by-line walkthrough of {@link getterSample}. */
  protected readonly getterNotes: CodeNote[] = [
    {
      line: 1,
      text: "Three type parameters, read as one sentence: `T` is inferred from `obj` — the object's whole type. `K extends keyof T` says the key has to be ONE of `T`'s real keys, and captures **which** one, as a literal — pass `'id'` and `K` is the literal `'id'`, not the wider `string`. `T[K]` is the return type, looked up from that exact key.",
    },
    {
      line: 2,
      text: 'Nothing to validate at runtime — `K extends keyof T` already proved `key` is safe to index with. `T` and `K` never appear in the compiled JavaScript; this line is genuinely all that survives.',
    },
    {
      line: 5,
      text: "The compiler does the lookup for you: `K` is inferred as the literal `'id'`, so `T[K]` resolves to `User['id']`, which is `number`.",
    },
    {
      line: 6,
      text: "Different key, different type — `K` is `'roles'` this time, so `T[K]` resolves to `string[]`. Same function, no overloads, no casts.",
    },
    {
      line: 8,
      text: "`'xyz'` isn't assignable to `keyof User`, so `K` has nothing to be — this line fails to compile. The typo is caught **before** the function is ever called, not as a runtime `undefined` three files away.",
    },
  ];

  /** Reveal for the getter CodeLab's ask-before-telling strip. */
  protected readonly getterAnswer =
    "`string[]` — `K` is inferred as the literal `'roles'`, and `T[K]` looks that up on `User`. And `prop(user, 'xyz')` fails because `'xyz'` was never a member of `keyof User` to begin with; `K extends keyof T` rules it out at the call site, before the function body ever runs.";

  /** The missing-`as const` trap. */
  protected readonly widenSample = `const roles = ['admin', 'editor', 'viewer'];

type Role = (typeof roles)[number];

function setRole(r: Role) { /* … */ }

setRole('emperor');

// Does this compile?`;

  /** Choices for the as-const-cost check. */
  protected readonly literalOptions: QuizOption[] = [
    {
      text: 'Yes — `retries` is a number and `5` is a number',
      why: 'It would be, without `as const`. The assertion is what changes the answer, and that is the whole point of the question.',
    },
    {
      text: 'No — `as const` makes `retries` the literal type `3`, and `5` is not `3`',
      correct: true,
      why: "`as const` freezes every property to its exact literal type, so `Config` is `{ readonly retries: 3; readonly url: '/api' }`. `Config['retries']` is therefore the type `3` — the only value assignable to it is `3` itself. Perfect for a lookup table you will only ever read, actively wrong for a config you intend to update. When you need the keys but not the frozen values, widen deliberately: `Config[K] extends string ? string : Config[K]`, or drop `as const` and annotate the object with an explicit interface instead.",
    },
    {
      text: 'No — a `readonly` property cannot be passed to a function at all',
      why: '`readonly` restricts assignment *to* the property, not reading from it. Passing `config.retries` somewhere is completely fine.',
    },
    {
      text: 'Yes, but only because `K` was inferred as `keyof Config` rather than a single key',
      why: 'K is inferred as the literal `\'retries\'` here — that narrowing is exactly what makes `Config[K]` resolve to one specific type rather than a union. It is working correctly; it is just working against you.',
    },
  ];

  /** Sample: the traditional `enum`, for the Compare panel's left side. */
  protected readonly enumRouteSample = `enum Route {
  Home = '/',
  Lesson = '/lessons',
  Practice = '/practice',
}

function go(to: Route) {
  router.navigateByUrl(to);
}`;

  /** Sample: const object + derived types, for the Compare panel's right side. */
  protected readonly constRouteSample = `export const ROUTES = {
  home: '/',
  lesson: '/lessons',
  practice: '/practice',
} as const;

type RouteKey = keyof typeof ROUTES;
type RoutePath = (typeof ROUTES)[RouteKey];

function go(to: RouteKey) {
  router.navigateByUrl(ROUTES[to]);
}`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why does `Object.keys(obj)` return `string[]` instead of `(keyof T)[]`?',
      a: 'Structural typing. A value of type `T` is allowed to carry extra properties beyond what `T` declares, so the only honest static answer to "what keys are there at runtime" is `string[]`. When you own the object — a local `const` nobody else touches — the assertion `as (keyof typeof obj)[]` is a reasonable, documented exception, and this lesson’s own demo uses it.',
    },
    {
      q: 'How do I get the type of one item of `const rows = fetchRows()` without importing `Row`?',
      a: '`type OneRow = ReturnType<typeof fetchRows>[number]`. Read it right to left: `typeof` lifts the function, `ReturnType` pulls out `Row[]`, and `[number]` indexes into the array to reach the element type. Chaining operators like this so you never re-declare a shape is exactly what they exist for.',
    },
    {
      q: 'What is the difference between `keyof T` and `T[keyof T]`?',
      a: "`keyof T` is the union of key *names* — `'id' | 'name'`. `T[keyof T]` indexes `T` by all of those keys at once, giving the union of the value *types* — `number | string`. Keys versus values; the brackets do the hop. If you can say that sentence out loud you can read most generic TypeScript.",
    },
    {
      q: 'My typed getter rejects a plain `string` variable. Why?',
      a: '`string` is wider than `keyof User`, and the compiler cannot prove an arbitrary string is one of the real keys — which is precisely the protection you asked for. Fix it at the source by typing the variable as `keyof User`, or narrow it first: `if (key in user)` narrows a `string` to `keyof User` in modern TypeScript.',
    },
    {
      q: 'Is any of this in my bundle?',
      a: 'Not one byte. `typeof`, `keyof` and indexed access are resolved during type-checking and then erased, so the compiled JavaScript contains only the `THEME` object. This is worth knowing for the opposite reason too: because nothing survives to runtime, none of it can validate data arriving from a server. Types describe what you *believe*; a runtime check is what makes it true.',
    },
  ];
}
