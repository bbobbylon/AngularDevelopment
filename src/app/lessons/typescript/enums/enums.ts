import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Types used by the live demos ────────────────────────────────────────────

/**
 * A literal union — the modern default for "a fixed set of named values". No
 * runtime object is emitted for this declaration at all: it is purely a
 * compile-time fact about which strings are allowed, so it crosses a JSON
 * boundary, a `Record` key, or a `switch` unchanged.
 */
type Direction = 'north' | 'east' | 'south' | 'west';

/** Read permission — bit 0. */
const READ = 1 << 0;
/** Write permission — bit 1. */
const WRITE = 1 << 1;
/** Delete permission — bit 2. */
const DELETE = 1 << 2;

/**
 * A real string enum, declared for real — not just a code sample — so the
 * "enums are unusable in a template without re-exposing them" section below
 * can prove its fix against actual compiled TypeScript instead of asserting
 * it. See `protected readonly Role = Role` on the class for the fix itself,
 * and the live demo it drives.
 */
enum Role {
  Admin = 'ADMIN',
  Member = 'MEMBER',
}

/**
 * Lesson: Enums & literal unions — the one place TypeScript keeps a real
 * runtime footprint instead of erasing itself. Covers what a numeric enum
 * compiles to (the IIFE and its reverse map), why string enums are
 * quasi-nominal, member rules (constant vs computed vs heterogeneous), bit
 * flags with a live permissions demo, `const enum` inlining and why
 * `isolatedModules` (and now `erasableSyntaxOnly`) rejects it, why an enum
 * needs a re-export to be readable from a template — a standard interview
 * question this app previously never asked — and the modern literal-union /
 * `as const` pattern that replaces most enums outright.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9); shaped after the reference implementation in
 * `expert/change-detection`. The throughline is the single fact that makes
 * every other fact on this page make sense: **TypeScript erases almost
 * everything it adds, except `enum`.**
 *
 * 1. **Pose the erasure question before naming the exception.** Section 1
 *    asks the reader to predict whether an `enum` declaration changes bundle
 *    size at all, before any mechanism is shown.
 * 2. **Analogy next, mechanism after.** The "erasable sticky note vs. printed
 *    ink" frame gives the reader somewhere to put the IIFE and reverse map
 *    before those words appear.
 * 3. **Then the same idea in several modes** — a dialogue between TypeScript
 *    and `enum`, an annotated compiled-output panel for both enum flavours, a
 *    live bit-flag permissions demo, and a live proof of the template
 *    re-export fix.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`. Nothing
 *    here assumes the reader can already read a compiled IIFE or a type
 *    predicate; they are here because they cannot yet.
 *
 * ## Demos
 *
 * Three, all signal-driven: the literal-union direction picker (heading in
 * degrees, proven exhaustive by a typed `Record`), the bit-flag permission
 * toggles (a combined bitmask shown in binary), and a role picker that proves
 * the class-side re-export is what makes `@if (role() === Role.Admin)`
 * compile at all — flip it off in the code sample and watch the reasoning,
 * not the demo, since the actual failure only happens at build time.
 */
@Component({
  selector: 'app-lesson-ts-enums',
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
  templateUrl: './enums.html',
  styleUrl: './enums.css',
})
export class Enums {
  // ── Demo 1: literal union — the direction picker ────────────────────────────

  /** The directions, for the picker. */
  protected readonly directions: Direction[] = ['north', 'east', 'south', 'west'];
  /** The selected direction. */
  protected readonly dir = signal<Direction>('north');

  /**
   * The selected direction in degrees.
   *
   * The lookup is typed `Record<Direction, number>`, so adding a direction to
   * the union makes this a compile error until the new case is handled — the
   * property a literal union has that a bare `string` does not.
   */
  protected degrees(): number {
    const map: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270 };
    return map[this.dir()];
  }

  // ── Demo 2: bit flags — the permissions demo ────────────────────────────────

  /** Read permission — bit 0. */
  protected readonly READ = READ;
  /** Write permission — bit 1. */
  protected readonly WRITE = WRITE;
  /** Delete permission — bit 2. */
  protected readonly DELETE = DELETE;
  /**
   * The permission bitmask. A single number holding all three flags, which is
   * what bit flags buy: one value to store, pass around and compare.
   */
  protected readonly perms = signal(READ);
  /**
   * The mask in binary, zero-padded to three digits, so the demo shows the
   * bits rather than the decimal number they add up to.
   */
  protected readonly permsBinary = computed(() => this.perms().toString(2).padStart(3, '0'));

  /**
   * Whether a flag is set, by bitwise AND.
   *
   * @param flag The bit to test.
   */
  protected hasFlag(flag: number): boolean {
    return (this.perms() & flag) !== 0;
  }

  /**
   * Flips a flag, by bitwise XOR. XOR rather than OR because this has to turn
   * a flag *off* as well as on — see the bit-flags code sample for why that
   * rules out the `&= ~` technique used to clear a flag unconditionally.
   *
   * @param flag The bit to flip.
   */
  protected toggle(flag: number): void {
    this.perms.update((p) => p ^ flag);
  }

  // ── Demo 3: the template re-export fix — the role picker ───────────────────

  /** The two roles, for the picker. */
  protected readonly roles: Role[] = [Role.Member, Role.Admin];
  /** The signed-in demo user's role. */
  protected readonly role = signal<Role>(Role.Member);
  /**
   * The fix, demonstrated live rather than just described. Delete this line
   * and `@if (role() === Role.Admin)` in the template stops compiling — the
   * template type-checker only resolves names against the component
   * **instance**, and without this field `Role` exists only as a *type*, not
   * a value the template can read. See "Enums in templates" below.
   */
  protected readonly Role = Role;

  // ── Presentation data ────────────────────────────────────────────────────

  /** The Type System track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Types', id: 'ts-types' },
    { label: 'Interfaces', id: 'ts-interfaces' },
    { label: 'Classes', id: 'ts-classes' },
    { label: 'Generics', id: 'ts-generics' },
    { label: 'Enums' },
    { label: 'Narrowing', id: 'ts-narrowing' },
  ];

  /**
   * TypeScript and `enum`, arguing about erasure.
   *
   * This exists because the fact that carries the whole lesson — "TypeScript
   * erases itself, except this once" — lands far better staged as a
   * disagreement than asserted as a sentence. `const enum` gets the last
   * word on purpose: it is the one flavour that keeps TypeScript's promise.
   */
  protected readonly erasureTalk: BubbleTurn[] = [
    {
      who: 'TypeScript',
      says: 'Almost everything I add for you disappears at compile time — interfaces, generics, type aliases. Check your logic, then get out of the way.',
    },
    {
      who: 'enum',
      says: "Not me. I'm not a note in the margin, I'm printed on the page. Call me by name and I hand back a value — and if I'm numeric, call me by value and I'll hand back the name.",
    },
    {
      who: 'TypeScript',
      says: "Which means you ship a real object whether you meant to or not. I can't prove a bundler is safe to remove it, so nothing does.",
    },
    {
      who: 'const enum',
      says: 'Unless you write `const` in front of me. Then I really do vanish — every reference to me gets replaced by a plain literal before the file leaves the compiler.',
    },
  ];

  /**
   * Sample: a numeric enum and what it compiles to — the IIFE that builds a
   * double-keyed object.
   */
  protected readonly numericEnumSample = `enum Status { Idle, Loading, Done }

// …compiles to:
var Status;
(function (Status) {
  Status[Status["Idle"] = 0] = "Idle";
  Status[Status["Loading"] = 1] = "Loading";
  Status[Status["Done"] = 2] = "Done";
})(Status || (Status = {}));`;

  /** Line-by-line walkthrough of {@link numericEnumSample}. */
  protected readonly numericEnumNotes: CodeNote[] = [
    {
      line: 1,
      text: '`Idle`, `Loading` and `Done` get no `=`, so TypeScript auto-numbers them from `0`.',
    },
    {
      line: 4,
      text: '`var Status` — a real variable, hoisted to module scope. This is the object every `Status.Idle` reference in your compiled code actually points at.',
    },
    {
      line: 5,
      text: 'An IIFE — a function defined and called in the same statement — so `Status` is built once, right here, with no leftover temporary names lying around.',
    },
    {
      line: 6,
      text: '`Status[Status["Idle"] = 0] = "Idle"` reads inside-out: `Status["Idle"] = 0` sets the forward entry **and evaluates to `0`**, so the outer assignment then runs `Status[0] = "Idle"` — one line, two entries. That is the **reverse map**.',
    },
    {
      line: 9,
      text: '`Status || (Status = {})` — reuse `Status` if this file already declared it in an earlier block, otherwise build a fresh object. This is what lets an `enum` be declared in more than one place and merge, the same trick namespaces use.',
    },
  ];

  /**
   * Sample: a string enum and what it compiles to — name-to-value only, no
   * reverse map, and the assignability rule that makes it quasi-nominal.
   */
  protected readonly stringEnumSample = `enum Role { Admin = 'ADMIN', Member = 'MEMBER' }

// …compiles to:
var Role;
(function (Role) {
  Role["Admin"] = "ADMIN";
  Role["Member"] = "MEMBER";
})(Role || (Role = {}));

let r: Role = Role.Admin;   // 'ADMIN' at runtime
let bad: Role = 'ADMIN';    // ✗ compile error — the raw string isn't enough`;

  /** Line-by-line walkthrough of {@link stringEnumSample}. */
  protected readonly stringEnumNotes: CodeNote[] = [
    {
      line: 6,
      text: 'One assignment per member, name → value only. Compare this with the numeric version above: no `Role["ADMIN"] = "Admin"` line, because a reverse entry would collide with a member name that already happens to be a string.',
    },
    {
      line: 8,
      text: 'Same merge guard as the numeric enum — string enums are built the same way, just with a smaller object.',
    },
    {
      line: 10,
      text: "`Role.Admin` **is** the string `'ADMIN'` at runtime — log it and that is exactly what prints.",
    },
    {
      line: 11,
      text: "But the *type* `Role` refuses a raw literal, even this exact one. That's **quasi-nominal** typing: TypeScript is checking which named type the value came from, not just its shape — the one place enums part ways with the rest of this structurally-typed language.",
    },
  ];

  /** Sample: the bitwise mechanics behind the permissions demo above. */
  protected readonly bitFlagsSample = `const READ   = 1 << 0;   // 0b001 — bit 0
const WRITE  = 1 << 1;   // 0b010 — bit 1
const DELETE = 1 << 2;   // 0b100 — bit 2

let perms = READ | WRITE;      // 0b011 = 3 — both bits set at once
perms & WRITE;                 // truthy — bit 1 is set
perms &= ~READ;                // clears bit 0 only, leaves WRITE alone`;

  /** Line-by-line walkthrough of {@link bitFlagsSample}. */
  protected readonly bitFlagsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`1 << 0` shifts the bit `1` left by zero places — it stays `1`. Each flag claims one bit, so no two flags can ever collide.',
    },
    {
      line: 2,
      text: '`1 << 1` shifts `1` left one place: binary `10`, decimal `2`. Powers of two matter here because each shift lights up a bit nothing else uses.',
    },
    {
      line: 5,
      text: '`|` — bitwise OR — merges bits: wherever *either* operand has a `1`, the result does too. Two separate permissions become one number.',
    },
    {
      line: 6,
      text: '`&` — bitwise AND — tests bits: the result is non-zero only where **both** operands have a `1`. `perms` and `WRITE` both have bit 1 set, so this is truthy.',
    },
    {
      line: 7,
      text: "`~READ` flips every bit of `READ`; `&=` then keeps only the bits that survive that mask. Net effect: clear exactly bit 0, touch nothing else. This is why the live demo's `toggle()` uses `^` (XOR) instead — XOR flips a bit whichever way it currently sits, which is what a toggle button needs, while `&= ~` only ever clears.",
    },
  ];

  /** Sample: `const enum` and its zero-object compile strategy. */
  protected readonly constEnumSample = `const enum Size { S, M, L }

const shirt = Size.M;
// …compiles to:
const shirt = 1 /* Size.M */;   // no Size object exists anywhere`;

  /** Line-by-line walkthrough of {@link constEnumSample}. */
  protected readonly constEnumNotes: CodeNote[] = [
    {
      line: 1,
      text: '`const enum` — the same declaration syntax as a regular enum, one keyword different, and a completely different compile strategy.',
    },
    {
      line: 3,
      text: 'Ordinary-looking code. Nothing about this line tells you whether `Size` survives into the compiled output.',
    },
    {
      line: 5,
      text: "It doesn't. Every reference to a `const enum` member is replaced by its literal value at compile time — the comment is TypeScript being polite about what it inlined, not real output. No object, no import needed at runtime, nothing to iterate.",
    },
  ];

  /** Sample: the class-side fix that makes an enum readable from a template. */
  protected readonly roleFixSample = `enum Role { Admin = 'ADMIN', Member = 'MEMBER' }

export class RoleBadge {
  protected readonly role = signal<Role>(Role.Member);

  protected readonly Role = Role;   // ← the fix — see the note below
}`;

  /** Line-by-line walkthrough of {@link roleFixSample}. */
  protected readonly roleFixNotes: CodeNote[] = [
    {
      line: 4,
      text: 'The state itself — a signal holding one member of `Role`. This line alone does not explain the fix; the template can already read `role()` fine, because `role` was always an instance member.',
    },
    {
      line: 6,
      text: "**This** is the fix. `protected readonly Role = Role;` puts a field named `Role` on the class, holding the enum object — the type `Role` and this field share a name on purpose, since a type name and a value name live in separate declaration spaces and never collide. `protected`, not `private`: Angular's template type-checker only sees members a template could actually reach, and `private` fails with the same 'does not exist' error, just for a different reason.",
    },
  ];

  /**
   * Sample: a reusable type guard for validating a raw wire string into a
   * string enum — the step a literal union skips when the field is already
   * typed at the boundary (see the parallel `isSize` example below).
   */
  protected readonly guardSample = `function isRole(value: string): value is Role {
  return (Object.values(Role) as string[]).includes(value);
}

function parseRole(raw: string): Role {
  if (!isRole(raw)) throw new Error('not a Role: ' + raw);
  return raw;   // narrowed to Role here — no cast needed
}`;

  /** Line-by-line walkthrough of {@link guardSample}. */
  protected readonly guardNotes: CodeNote[] = [
    {
      line: 1,
      text: "`value is Role` is a **type predicate** — it tells the compiler 'if this returns `true`, treat `value` as a `Role` from here on', not just as a plain `boolean`. That is what makes line 7 legal.",
    },
    {
      line: 2,
      text: "`Object.values(Role)` reads the enum's own runtime object back — `['ADMIN', 'MEMBER']` — so the check stays correct if a member is ever added. `as string[]` is needed because `Object.values` types the array as `Role[]`, and `.includes` wants to compare like with like against a plain `string`.",
    },
    {
      line: 6,
      text: "Reject anything that isn't one of the enum's own values before it goes anywhere near application code — the wire only ever hands you a `string`, never a `Role`.",
    },
    {
      line: 7,
      text: 'Because line 6 already threw for every other case, TypeScript narrows `raw` from `string` down to `Role` for the rest of the function — no `as Role` cast required.',
    },
  ];

  /** Sample: the literal-union parallel to {@link guardSample} — same shape, no import. */
  protected readonly isSizeSample = `const SIZES = ['s', 'm', 'l'] as const;
type Size = (typeof SIZES)[number];

const isSize = (v: string): v is Size =>
  (SIZES as readonly string[]).includes(v);   // same shape as isRole, no enum import`;

  /**
   * Sample: exhaustiveness checking over the {@link Direction} literal union.
   */
  protected readonly exhaustivenessSample = `function label(d: Direction): string {
  switch (d) {
    case 'north': return 'N';
    case 'east':  return 'E';
    case 'south': return 'S';
    case 'west':  return 'W';
    default:      return assertNever(d);
  }
}`;

  /** Line-by-line walkthrough of {@link exhaustivenessSample}. */
  protected readonly exhaustivenessNotes: CodeNote[] = [
    {
      line: 2,
      text: "Switching on `d`, whose type is the whole `Direction` union. Every `case` below narrows what TypeScript still thinks `d` could be inside that branch — the same mechanism as the narrowing lesson's guards, just driven by a `switch`.",
    },
    {
      line: 3,
      text: "Once this case is matched or skipped, TypeScript removes `'north'` from the set of types `d` could still be in every branch **below** this one.",
    },
    {
      line: 6,
      text: 'The fourth and last member. Once this case is behind it too, the type of `d` in `default` has narrowed all the way down to `never` — literally nothing is left.',
    },
    {
      line: 7,
      text: "`assertNever` takes a parameter typed `never`. `d` really is `never` here, so this compiles — **today**. Add `'up'` to `Direction` and `d` becomes `'up'` in this branch instead of `never`, and this single line fails to compile, pointing straight at the switch that needs a new case.",
    },
  ];

  /** Sample: the literal-union side of the assignability comparison. */
  protected readonly compareUnionSample = `type Direction = 'north' | 'east' | 'south' | 'west';

let d: Direction = 'north';   // compiles — the literal IS the type`;

  /** Sample: the string-enum side of the assignability comparison. */
  protected readonly compareEnumSample = `enum Role { Admin = 'ADMIN', Member = 'MEMBER' }

let r: Role = 'ADMIN';        // error — a raw string never satisfies Role, only a member does`;

  /**
   * The expression that appears, byte-for-byte identical, on both sides of
   * the "enums in templates" Compare — only the class changes.
   */
  protected readonly roleTemplateExpr = `role() === Role.Admin`;

  /**
   * Sample: deriving a union type AND a runtime, iterable value from one
   * `as const` object — the pattern that replaces most enums outright.
   */
  protected readonly asConstSample = `const LogLevel = { Debug: 'debug', Info: 'info', Error: 'error' } as const;
type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

Object.values(LogLevel);`;

  /** Line-by-line walkthrough of {@link asConstSample}. */
  protected readonly asConstNotes: CodeNote[] = [
    {
      line: 1,
      text: '`as const` freezes every property to its exact literal type. Without it, `Debug` would be inferred as plain `string`, and neither line below would work.',
    },
    {
      line: 2,
      text: "Read this inside-out. `typeof LogLevel` is the object's own type; `keyof` lists its keys (`'Debug' | 'Info' | 'Error'`); indexing the type by all of them at once returns the union of the **values** — `'debug' | 'info' | 'error'`.",
    },
    {
      line: 4,
      text: 'The value and the type share the name `LogLevel` on purpose — a type name and a value name live in separate declaration spaces, so this is not a redeclaration. `Object.values` reading the object back is the payoff for going through `as const` instead of a bare object literal: a real, iterable list at runtime, matching the type exactly.',
    },
  ];

  /** Steps for the bit-flags Flow diagram. */
  protected readonly bitFlagsFlow: FlowStep[] = [
    {
      label: 'Declare the bits',
      detail:
        '`Read = 1 << 0`, `Write = 1 << 1`, `Delete = 1 << 2` — one bit per flag, so none can ever collide.',
    },
    {
      label: 'Combine with `|`',
      detail: 'Bitwise OR merges every set bit into one number. `Read | Write` is `3`.',
      tone: 'accent',
    },
    {
      label: 'Test with `&`',
      detail:
        'Bitwise AND is non-zero only where both sides have a `1`. `perms & Write` answers "can it write?" in one comparison.',
      tone: 'good',
    },
  ];

  /**
   * The first self-test, placed right after the reverse-map mechanism.
   *
   * The distractors are the two ways learners get `Object.keys` on a numeric
   * enum wrong — assuming it behaves like a plain object, and assuming an
   * enum isn't a "real" object at all. The `why` on each is the correction.
   */
  protected readonly quizOptions1: QuizOption[] = [
    {
      text: '`3` — one key per member, same as any plain object.',
      why: "True for a **string** enum, or a plain object literal. A numeric enum's compiled object is double-keyed — read on.",
    },
    {
      text: '`6` — the reverse map means every member appears as both a name and a number.',
      correct: true,
      why: "Right. The emitted object holds `Idle: 0, Loading: 1, Done: 2` **and** `0: 'Idle', 1: 'Loading', 2: 'Done'` — six keys from three members. `Object.keys` returns them all as strings, numeric ones included, which is why iterating a numeric enum's *names* needs a filter: `Object.keys(Status).filter(k => isNaN(Number(k)))`.",
    },
    {
      text: "`0` — enums aren't real objects, so `Object.keys` can't see inside them.",
      why: 'A regular enum compiles to a genuine `var` holding a genuine object — that is the whole point of this section. `Object.keys` sees it fine; the surprise is how much it sees.',
    },
    {
      text: 'It throws, because enum members are read-only.',
      why: "`Object.keys` only reads; it never writes, so read-only-ness never comes into it. And nothing about a numeric enum is actually frozen at runtime — `Status[99] = 'Mystery'` would happily add a seventh key.",
    },
  ];

  /**
   * The second self-test, on the coverage-sweep's highest-priority finding:
   * enums are unusable in a template without a class-side re-export. The
   * distractors are the three ways learners misdiagnose the failure —
   * scope, build mode, and change detection — none of which is the actual
   * cause.
   */
  protected readonly quizOptions2: QuizOption[] = [
    {
      text: 'It compiles — `import` already put `Status` in scope for the whole file, template included.',
      why: "An `import` puts a name in scope for the **TypeScript file**. Angular's template type-checker resolves every name in a template against the component **instance** only — an import is invisible to it, no matter how it got into the `.ts`.",
    },
    {
      text: 'It compiles under JIT, but fails once the app is built with AOT.',
      why: 'The failure has nothing to do with JIT versus AOT — this app builds AOT-only anyway. It is a plain name-resolution error against the component class, and it happens the same way, this early, under either mode.',
    },
    {
      text: "It fails to compile: `Status` isn't a member of the component class.",
      correct: true,
      why: "Exactly — and the fix is one line: `protected readonly Status = Status;` on the class, so the template has an instance member to read. A literal union needs none of this, since a comparison like `status() === 'done'` is just a string comparison — one more reason the decision table below leans union.",
    },
    {
      text: 'It throws `NG0100` the first time the view is checked.',
      why: 'NG0100 is a **change-detection** error — a value disagreeing with itself mid-pass. This is a **template type-checking** error, caught at build time, long before any pass runs. Different failure, different phase.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "`let d: Direction = 'north'` compiles but `let r: Role = 'ADMIN'` doesn't — even though `Role.Admin` really is `'ADMIN'` at runtime. Why the double standard?",
      a: 'Because string enums are deliberately **quasi-nominal**: TypeScript checks which named type a value came from, not just its shape. `Direction` is purely structural — the literal itself IS the type, so any matching string qualifies. This is the single biggest behavioural difference between the two, and it bites hardest parsing JSON, where the wire only ever hands you plain strings.',
    },
    {
      q: 'My build tool errors on a `const enum` imported from another file. What did I do wrong?',
      a: "Nothing you can fix locally — it's the tool. Single-file transpilers (esbuild, swc, Babel — most modern build chains, Angular's included, under `isolatedModules`) compile each file in isolation, with no visibility into another file's values, so there is nothing to inline `Size.M` into. Fixes: make it a regular `enum`, move the declaration into the file that uses it, or switch to an `as const` object, which has a real value and needs no inlining at all.",
    },
    {
      q: "How do I get a plain union type back out of an array I already wrote, like `const SIZES = ['s', 'm', 'l'] as const`?",
      a: "`type Size = (typeof SIZES)[number]` — index the tuple's type by `number` and TypeScript unions every element type together, giving `'s' | 'm' | 'l'`. Drop the `as const` and the array is just `string[]`, so this would produce plain `string` instead — the const assertion is what preserves each literal.",
    },
    {
      q: "A teammate says our enums won't work once we turn on Node's built-in TypeScript support. Is that real?",
      a: "Yes. Type-stripping runtimes remove type syntax without running a real compiler, so they only accept syntax that erases to nothing — TypeScript's `erasableSyntaxOnly` flag rejects `enum` (regular **and** `const`), non-`declare` namespaces, constructor parameter properties, and a couple of other conveniences that secretly emit code. Enums fail for the exact reason this whole lesson keeps circling back to: they aren't erasable. An `as const` object already is plain JavaScript, so it's the one form of this pattern that survives type-stripping untouched.",
    },
    {
      q: "If enums are 'not tree-shakable', does the whole enum ship even if I only ever use one member?",
      a: "Yes. The IIFE that builds the object contains assignment expressions, which count as side effects — a bundler can't prove removing them is safe, so it keeps the whole thing just in case. Compare that to a `const enum`, which leaves nothing behind to ship, or an `as const` object, a plain value declaration a bundler can trace member by member like any other object.",
    },
  ];
}
