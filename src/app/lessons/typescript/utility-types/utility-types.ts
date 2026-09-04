import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * The shape the utility-type demos transform.
 */
interface User {
  id: number;
  name: string;
  email: string;
}

const USER_KEYS = ['id', 'name', 'email'] as const;
/**
 * The union of `User`'s keys, derived from the runtime array with an indexed
 * access on `typeof`. One source of truth: the array drives both the picker in
 * the UI and the type used to check it.
 */
type UserKey = (typeof USER_KEYS)[number];

/**
 * Lesson: utility types — the built-in generic types that transform one
 * interface into a variant of itself, shown with their actual one-line
 * `lib.d.ts` definitions so none of it reads as folklore.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order:
 *
 * 1. **Pose the drift problem before naming the fix.** Four hand-copied
 *    interfaces silently going stale is a bug every reader has already
 *    shipped; utility types are introduced as the fix for a pain they
 *    recognise, not as a vocabulary list.
 * 2. **One analogy carries the object-transformer half of the topic** — a
 *    rubber stamp pressed on a fresh copy of a master document, never a
 *    photocopy made from memory. It explains why the built-ins are safe
 *    (read the master every time) and why hand-duplicated types are not.
 * 3. **The trap the analogy does not cover gets its own mechanism.** `Pick`
 *    and `Omit` read `keyof T` as one flat, intersected set of keys, so
 *    applying either straight to a union silently flattens it — a real,
 *    high-frequency bug in an app whose own state is modelled as
 *    discriminated unions (see `ts-narrowing`). `Exclude`/`Extract` are
 *    contrasted right after, because the reason they do NOT have this
 *    problem — a bare, distributive conditional vs. `T` wrapped in a mapped
 *    type — is the single most exam-relevant fact on the page.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`, and every
 *    claim about compiler behaviour (the union-flattening trap, the
 *    last-overload rule, `noUncheckedIndexedAccess`) is demonstrated with a
 *    concrete before/after rather than merely asserted.
 *
 * ## Coverage-sweep material folded in
 *
 * `docs/COVERAGE-SWEEP.md` → `typescript/utility-types` flagged five gaps;
 * all five are in this rewrite: `Pick`/`Omit` collapsing a discriminated
 * union (its own section, a `Compare`, a `Predict` and a `Remember`),
 * `ReturnType`/`Parameters` only seeing the last overload (a dedicated
 * section, a `Bubbles` dialogue and a `Quiz`), `Record<string, V>` lying
 * about which keys exist (a `Compare` plus a `noUncheckedIndexedAccess`
 * walkthrough), `Required` also stripping `| undefined` (a `CodeNote` on the
 * real definition, plus one sentence on `exactOptionalPropertyTypes`), and
 * `NoInfer<T>` (a `Faq` item).
 *
 * ## Demos
 *
 * Two, both signal-driven, both carried over unchanged from the previous
 * version of this lesson: the Pick/Omit key-by-key selector, and the
 * `Partial<User>` patch-and-merge bench.
 */
@Component({
  selector: 'app-lesson-ts-utility-types',
  imports: [
    RouterLink,
    JsonPipe,
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
  templateUrl: './utility-types.html',
  styleUrl: './utility-types.css',
})
export class UtilityTypes {
  // ── Demo 1: live Partial patch ─────────────────────────────────────────────

  /**
   * The starting record that patches are applied over.
   */
  private readonly base: User = { id: 1, name: 'Ada', email: 'ada@example.com' };
  /**
   * The pending changes. Typed `Partial<User>` — every field optional — which is
   * exactly what a patch is, and why `Partial` exists.
   */
  protected readonly patch = signal<Partial<User>>({});
  /**
   * The base with the patch applied. Typed as a full `User` again: spreading a
   * `Partial` over a complete value restores completeness.
   */
  protected readonly merged = computed<User>(() => ({ ...this.base, ...this.patch() }));

  // ── Demo 2: live Pick/Omit key selector ─────────────────────────────────────

  /**
   * The keys available in the Pick/Omit demo.
   */
  protected readonly userKeys = USER_KEYS;
  /**
   * Which keys are selected. Seeded with one so the demo opens on a non-empty
   * result.
   */
  protected readonly selected = signal<Set<UserKey>>(new Set<UserKey>(['email']));

  /**
   * Toggles a key in the selection.
   *
   * @param k The key to toggle.
   */
  protected toggleKey(k: UserKey) {
    this.selected.update((s) => {
      const next = new Set(s);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  /**
   * The selection rendered as a type-level union, e.g. `'id' | 'name'` — or
   * `never` when nothing is selected, which is what an empty union actually is.
   */
  protected keyUnion(): string {
    const keys = [...this.selected()];
    return keys.length ? keys.map((k) => `'${k}'`).join(' | ') : 'never';
  }

  /**
   * The runtime equivalent of `Pick<User, …>`: an object with only the selected
   * keys.
   */
  protected pickResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.selected()) (out as Record<string, unknown>)[k] = this.base[k];
    return out;
  }

  /**
   * The runtime equivalent of `Omit<User, …>`: an object with everything *except*
   * the selected keys. Shown beside {@link pickResult} because the pair is easier
   * to remember as complements than separately.
   */
  protected omitResult(): Partial<User> {
    const out: Partial<User> = {};
    for (const k of this.userKeys) {
      if (!this.selected().has(k)) (out as Record<string, unknown>)[k] = this.base[k];
    }
    return out;
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Advanced Types track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Utility Types' },
    { label: 'keyof & typeof', id: 'ts-keyof-typeof' },
    { label: 'Mapped & Conditional', id: 'ts-mapped-conditional' },
  ];

  /**
   * "Derive, don't duplicate" as a three-step pipeline — the visual restating
   * of the mental-model paragraph in a second mode.
   */
  protected readonly stampSteps: FlowStep[] = [
    {
      label: 'interface User',
      detail: 'One declared shape. Every field named exactly once, in exactly one place.',
    },
    {
      label: 'Partial<User>, Pick<User, ...>, ...',
      detail: 'A stamp pressed on a fresh copy of User, read fresh every time it is applied.',
      tone: 'accent',
    },
    {
      label: 'User gains a field',
      detail: 'Every derived type recomputes — or errors — the next time it is checked.',
      tone: 'good',
    },
  ];

  /** Sample: the real `lib.d.ts` definitions of the six object transformers. */
  protected readonly objectTransformersSample = `interface User { id: number; name: string; email: string }

type Partial<T>  = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type Record<K extends keyof any, V> = { [P in K]: V };`;

  /** Line-by-line walkthrough of {@link objectTransformersSample}. */
  protected readonly objectTransformersNotes: CodeNote[] = [
    {
      line: 1,
      text: '`interface User` is the single master shape every sample on this page derives from. Three fields: `id`, `name`, `email`.',
    },
    {
      line: 3,
      text: '`[K in keyof T]` is a **mapped type** — it walks every key of `T` and rebuilds an object one property at a time. The `?` after `T[K]` makes that property optional. This **is** `Partial`; there is no separate hidden implementation.',
    },
    {
      line: 4,
      text: "`-?` **strips** optionality rather than adding it — the minus removes the `?`. It also strips `| undefined` from the property's own type, not only the question mark: `Required<{a?: string | undefined}>` comes out as `{a: string}`, no `| undefined` left anywhere on it.",
    },
    {
      line: 5,
      text: '`readonly` before the mapped clause marks every rebuilt property immutable. It is a **type-level** lock only — the object underneath is the same JavaScript object, and nothing at runtime enforces it.',
    },
    {
      line: 6,
      text: "`K extends keyof T` is a **generic constraint**: `K` must be a real key of `T`, checked at the call site. That constraint is Pick's whole personality — pass a key `T` doesn't have and this is the line that rejects it.",
    },
    {
      line: 7,
      text: "Omit's second parameter is constrained only to `keyof any` — every string, number or symbol is legal, whether or not `T` actually has it. `Omit` is built entirely out of `Pick` and `Exclude` below — there is no separate mapped type for it at all.",
    },
    {
      line: 8,
      text: '`Record` maps over `K` directly rather than over `keyof T` — there is no `T` here, just a key union and a value type. That is why it preserves none of the modifiers the other five do: there is nothing to preserve them **from**.',
    },
  ];

  /** The typo self-test that follows the real definitions directly. */
  protected readonly omitTypoQuiz: QuizOption[] = [
    {
      text: 'Yes — same as Pick, K must name a real key.',
      why: "That's Pick's behaviour, not Omit's. Pick's `K extends keyof T` rejects an unknown key at the call; Omit's `K extends keyof any` accepts any string, number or symbol at all.",
    },
    {
      text: 'No — Omit accepts any key at all, real or not.',
      correct: true,
      why: "Right. `Omit<User, 'emial'>` compiles cleanly and hands back all three original fields untouched — the typo removed nothing, because it was never one of User's keys to begin with. Silent no-op, not an error, which is exactly why a reviewer catches it and the compiler doesn't.",
    },
    {
      text: 'No, but the resulting type collapses to never.',
      why: "Close reasoning, wrong outcome. `Omit<T,K>` is `Pick<T, Exclude<keyof T, K>>`, and `Exclude<keyof User, 'emial'>` leaves all three real keys exactly where they were — 'emial' was never among them, so there is nothing for Exclude to remove.",
    },
    {
      text: 'It depends on whether strict mode is on.',
      why: "Strict mode changes plenty about null-checking and narrowing, but it doesn't add a keys check to Omit's second type parameter. Same result with strict on or off.",
    },
  ];

  /** Sample: the union-flattening trap, and the distributive fix. */
  protected readonly unionCollapseSample = `type Loading = { status: 'loading'; id: string };
type Loaded  = { status: 'loaded';  id: string; data: string[] };
type Failed  = { status: 'error';   id: string; message: string };
type ApiState = Loading | Loaded | Failed;

// ✗ Omit reads keyof ApiState as ONE flat set — only 'status' and 'id' are common to all three arms:
type Bad = Omit<ApiState, 'id'>;
// { status: 'loading' | 'loaded' | 'error' }  — data and message never made the cut

// ✓ distribute over the union FIRST, Omit each arm on its own:
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
type Good = DistributiveOmit<ApiState, 'id'>;
// { status: 'loading' } | { status: 'loaded'; data: string[] } | { status: 'error'; message: string }`;

  /** Line-by-line walkthrough of {@link unionCollapseSample}. */
  protected readonly unionCollapseNotes: CodeNote[] = [
    {
      line: 4,
      text: '`ApiState` is the same shape a `switch (state.status)` narrows on in the type-narrowing lesson — one shared literal-tagged field, three arms, each carrying different extra data.',
    },
    {
      line: 7,
      text: "`Omit<ApiState, 'id'>` looks harmless — you're only removing a field every arm has. But `Omit`/`Pick` read `keyof ApiState`, and **`keyof` of a union is the intersection of every arm's keys**, not the union of them. Only `status` and `id` are common to all three, so that intersection is the entire set `Omit` has to work with.",
    },
    {
      line: 8,
      text: 'One flat object, not three variants. `data` (only on `Loaded`) and `message` (only on `Failed`) were never candidates for `Pick` at all — they dropped out the moment `keyof` ran, long before `Omit` did anything. `status` survives, but as a bare union of strings with nothing arm-specific left attached to it.',
    },
    {
      line: 11,
      text: '`T extends unknown` is always true, which is the point — it is the standard trick for turning a **naked type parameter** into a **distributive conditional**, so TypeScript evaluates the branch once per union member instead of once for the whole union. `ts-mapped-conditional` builds this exact pattern from first principles.',
    },
    {
      line: 12,
      text: 'Same call shape as the broken version on line 7 — only the utility changed. That is the entire fix: never `Omit` a union directly; distribute over it first.',
    },
    {
      line: 13,
      text: 'Three arms out for three arms in. `data` and `message` both survive, because each was omitted from its **own** arm before anything was merged into one shape.',
    },
  ];

  /** The safer-looking option, for the Compare panel. */
  protected readonly unionOmitResultSample = `type Bad = Omit<ApiState, 'id'>;
// { status: 'loading' | 'loaded' | 'error' }`;

  /** The fixed version, for the Compare panel. */
  protected readonly distributiveOmitResultSample = `type Good = DistributiveOmit<ApiState, 'id'>;
// { status: 'loading' } | { status: 'loaded'; data: string[] } | { status: 'error'; message: string }`;

  /** Reveal for the "is Pick any safer than Omit here" predict. */
  protected readonly pickSafetyAnswer =
    "It has the exact same problem — arguably it's worse, because `Pick<ApiState, 'status'>` is precisely the flattened type the last section produced by accident: `{ status: 'loading' | 'loaded' | 'error' }`. `Omit` is *defined* as `Pick<T, Exclude<keyof T, K>>`, so every `Omit` call on a union is secretly a `Pick` call with the same flattening problem. Pick isn't the safe half of the pair — it's the mechanism Omit is built out of. The fix is identical: distribute first, `Pick`/`Omit` second.";

  /** Sample: Exclude/Extract/NonNullable — bare, distributive conditionals. */
  protected readonly unionFilterSample = `type Role = 'admin' | 'member' | 'guest';

type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;

type Staff = Exclude<Role, 'guest'>;      // 'admin' | 'member'
type JustAdmin = Extract<Role, 'admin'>;  // 'admin'
type Real = NonNullable<string | null>;   // string`;

  /** Line-by-line walkthrough of {@link unionFilterSample}. */
  protected readonly unionFilterNotes: CodeNote[] = [
    {
      line: 3,
      text: '`T extends U ? never : T` — a **bare conditional type** over a **naked type parameter**: `T` sits on its own, not wrapped in `{ … }` or `[…]`. That nakedness is what makes it **distribute** automatically: applied to a union, TypeScript runs the check once per member and unions the survivors back together, dropping any `never`.',
    },
    {
      line: 4,
      text: "`Extract` is `Exclude`'s mirror image — keep the arm instead of dropping it. Same distributive mechanism, opposite placement of `never`.",
    },
    {
      line: 6,
      text: "Each of `'admin' | 'member' | 'guest'` is tested against `'guest'` **individually**. `'guest' extends 'guest'` is true → `never` → drops out. The other two survive and get unioned back together — three separate compiler checks, stitched into one result.",
    },
    {
      line: 8,
      text: "`NonNullable<T>` is defined as `Exclude<T, null | undefined>` — nothing new, just `Exclude` with its second argument fixed. `string | null` loses `null` exactly the way `Role` lost `'guest'`.",
    },
  ];

  /** Reveal for the "why doesn't Exclude collapse ApiState the way Omit did" predict. */
  protected readonly excludeDistributesAnswer =
    "No — and the reason is the exact mechanical difference the last two sections built up to. `Exclude` is a **bare conditional over a naked type parameter** (`T extends U ? … : …`, with nothing wrapping `T`), and TypeScript automatically distributes a bare conditional over a union — the free version of the `T extends unknown ? … : never` trick you just read for `DistributiveOmit`. `Pick`/`Omit`, by contrast, wrap `T` **inside** a mapped type (`{ [P in K]: T[P] }`), and a type parameter used inside a mapped type is no longer 'naked', so distribution never kicks in automatically. Same-looking `T`, opposite behaviour — and now you know exactly why.";

  /** Sample: the basic function/promise extractors, plus ReturnType's own definition. */
  protected readonly extractorBasicSample = `declare function makeUser(name: string, age: number): User;

type Result = ReturnType<typeof makeUser>;
// User

type Args = Parameters<typeof makeUser>;
// [name: string, age: number] — a labelled tuple, one entry per parameter

type ReturnTypeImpl<T> = T extends (...a: any) => infer R ? R : never;`;

  /** Line-by-line walkthrough of {@link extractorBasicSample}. */
  protected readonly extractorBasicNotes: CodeNote[] = [
    {
      line: 1,
      text: '`declare` says this function exists somewhere — a `.d.ts`, a library — without giving TypeScript a body to check. Enough to have a **type**, which is all an extractor needs.',
    },
    {
      line: 3,
      text: '`typeof makeUser` lifts the **runtime** function into **type space** — the type of the value `makeUser`, not a new declaration. `ReturnType` then operates on that type, never on the function itself.',
    },
    {
      line: 6,
      text: "`Parameters` returns a **tuple type**, and a modern one is labelled — `name: string` isn't a variable, it's the parameter's own name preserved for readability in tooltips and error messages.",
    },
    {
      line: 9,
      text: 'The actual `lib.d.ts` definition of `ReturnType`, word for word. `infer R` is a placeholder the compiler solves for: match the function shape, and whatever sits in the return-type position gets bound to `R`. No recursion, no loop — one pattern match.',
    },
  ];

  /** Sample: the overloaded-function trap. */
  protected readonly overloadTrapSample = `function query(id: number): User;
function query(id: number, includeDeleted: true): User | null;
function query(id: number, includeDeleted?: boolean): User | null {
  return includeDeleted ? maybeDeletedUser(id) : realUser(id);
}

type Result = ReturnType<typeof query>;
// User | null — NOT \`User\`, even though the one-argument call is the common case`;

  /** Line-by-line walkthrough of {@link overloadTrapSample}. */
  protected readonly overloadTrapNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Overload signature #1 — what most callers see, for the common, one-argument call. No body; a **signature only**.',
    },
    {
      line: 2,
      text: 'Overload signature #2 — declared **last**. That ordering is about to matter, and it is easy to write the obscure case last purely by habit.',
    },
    {
      line: 3,
      text: 'The **implementation signature**. It has a body, but it is not part of the public API: callers can never invoke `query` with an optional plain `boolean` — only the two signatures above are callable. Extractors like `ReturnType` cannot see this one either.',
    },
    {
      line: 7,
      text: '`typeof query` on an overloaded function carries **all** of its call signatures at once. When `ReturnType` pattern-matches with `infer R`, TypeScript resolves `R` against only **one** signature — whichever was declared **last** in source order.',
    },
    {
      line: 8,
      text: 'So the type most callers will actually see — plain `User`, from the common one-argument call — never shows up here. `ReturnType<typeof query>` reports the shape of the overload nobody was thinking about.',
    },
  ];

  /** The compiler and an overloaded function, negotiating what "the" return type even means. */
  protected readonly overloadTalk: BubbleTurn[] = [
    { who: 'You', says: 'What does `query` return?' },
    {
      who: 'TypeScript',
      says: 'Depends how you call it — I have two public signatures for `query`.',
    },
    { who: 'You', says: "I'm not calling it. I wrote `ReturnType<typeof query>`." },
    {
      who: 'TypeScript',
      says: "Then I can't ask which call you meant. I read the signatures top to bottom and match against whichever I saw last.",
    },
    { who: 'You', says: 'Even if almost nobody calls it that way?' },
    {
      who: 'TypeScript',
      says: 'Even then. `infer` matches a shape — it has no idea which one gets used the most.',
    },
  ];

  /** The overload self-test. */
  protected readonly overloadQuiz: QuizOption[] = [
    {
      text: 'User — the return type of the common, one-argument call.',
      why: 'The plausible answer, and the wrong one. `ReturnType` never asks which overload gets called most often — it pattern-matches with `infer` against the type, and only one signature is visible to that match.',
    },
    {
      text: 'User | null — the return type of the LAST declared overload.',
      correct: true,
      why: "Exactly. TypeScript resolves `infer` against an overloaded function's call signatures by picking whichever was declared last in source order — regardless of which one callers actually use most.",
    },
    {
      text: "User | (User | null) — a union of every overload's return type.",
      why: 'Reasonable to assume, and not how it works. `ReturnType` does not merge every signature together; it matches exactly one and stops there.',
    },
    {
      text: 'A compile error — ReturnType cannot be used on an overloaded function.',
      why: 'It compiles cleanly, which is exactly what makes this a trap: nothing in the build tells you the answer only reflects one of several signatures.',
    },
  ];

  /** Sample: the string-literal transform family, and where it earns its keep. */
  protected readonly stringHelpersSample = `type Upper = Uppercase<'hi'>;        // 'HI'
type Lower = Lowercase<'HI'>;        // 'hi'
type Cap = Capitalize<'hi'>;         // 'Hi'
type Uncap = Uncapitalize<'Hi'>;     // 'hi'

// where they earn their keep — deriving key families with template literals:
type Handlers = {
  [K in 'click' | 'focus' as \`on\${Capitalize<K>}\`]: () => void
};
// { onClick: () => void; onFocus: () => void }`;

  /** Line-by-line walkthrough of {@link stringHelpersSample}. */
  protected readonly stringHelpersNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Four string-literal transforms, and all four operate purely on the **type** — there is no `.toUpperCase()` call anywhere here, and nothing about them runs in the browser.',
    },
    {
      line: 8,
      text: 'The `as` clause **renames** the key a mapped type produces — the mapped & conditional lesson covers it properly. A template literal type builds that new name from pieces: the fixed text `on`, then whatever `Capitalize<K>` computes for each `K`. Two utility types composing inside a third.',
    },
    {
      line: 10,
      text: 'One property per member of the union `K` ranges over — the payoff for any of this: a two-branch union becomes a fully-typed two-method interface, and adding a third event to the union adds a third method here automatically.',
    },
  ];

  /** The closed dictionary, for the Compare panel. */
  protected readonly closedRecordSample = `type Role = 'admin' | 'member' | 'guest';
const labels: Record<Role, string> = { admin: 'Admin', member: 'Member' };
// ✗ Property 'guest' is missing — caught right here, at the declaration`;

  /** The open dictionary and its crash, for the Compare panel. */
  protected readonly openRecordCrashSample = `const labels: Record<string, string> = { admin: 'Admin', member: 'Member' };
labels['guest'].toUpperCase();
// ✓ compiles. ✗ throws: Cannot read properties of undefined`;

  /** Sample: turning on noUncheckedIndexedAccess and what changes. */
  protected readonly noUncheckedIndexedAccessSample = `// tsconfig.json
{ "compilerOptions": { "noUncheckedIndexedAccess": true } }

const labels: Record<string, string> = { admin: 'Admin' };

const shown = labels['guest'];
// shown: string | undefined — the truth, instead of a promise

shown.toUpperCase();
// ✗ 'shown' is possibly 'undefined' — caught at compile time now

const safe = labels['guest'] ?? 'Unknown';
// or: if ('guest' in labels) { … }
// or: reach for a Map, whose .get() has always returned V | undefined`;

  /** Line-by-line walkthrough of {@link noUncheckedIndexedAccessSample}. */
  protected readonly noUncheckedIndexedAccessNotes: CodeNote[] = [
    {
      line: 2,
      text: "One `tsconfig.json` flag rewrites the type of **every** index read in the project — `arr[i]`, `dict[key]`, both. It doesn't exist as a mapped or conditional type; it's a compiler mode, which is why the fix belongs in your config rather than in a utility type.",
    },
    {
      line: 6,
      text: "Without the flag this line types as plain `string` — a promise the compiler cannot actually keep, because `'guest'` was never checked to exist as a key.",
    },
    {
      line: 7,
      text: "With the flag on, the type tells the truth: `string | undefined`. This is the exact same shape `Partial<User>` gives every field — 'might be absent' pushed into the type instead of assumed away.",
    },
    {
      line: 10,
      text: 'The payoff. The crash from the Compare panel above becomes a **build error** instead of a **runtime exception**. Nobody has to remember to check; the compiler remembers for you.',
    },
    {
      line: 12,
      text: '`??` is the one-line fix once the type is honest — fall back to a default the moment a read might be absent. The `in` check and `Map.get()` do the same job with an explicit branch instead.',
    },
  ];

  /** Sample: composing utility types instead of duplicating a shape. */
  protected readonly combosSample = `// An update DTO: id required, everything else optional
type UserPatch = Pick<User, 'id'> & Partial<Omit<User, 'id'>>;

// Form value derived from the model
type Form = Partial<Pick<User, 'name' | 'email'>>;

// A component's writable state derived from a readonly API response
type Draft = { -readonly [K in keyof ApiUser]: ApiUser[K] };`;

  /** Line-by-line walkthrough of {@link combosSample}. */
  protected readonly combosNotes: CodeNote[] = [
    {
      line: 2,
      text: "Three utilities composed in one line: `Omit` drops `id`, `Partial` makes the rest optional, `Pick` re-adds `id` as required, and `&` glues the two pieces into one type. Read right to left — innermost first — and it's three single-purpose stamps applied in sequence.",
    },
    {
      line: 5,
      text: '`Pick` first narrows to the two fields a form actually edits; `Partial` then lets the form start out empty. Narrow-then-loosen is the standard shape for a form-value type.',
    },
    {
      line: 8,
      text: '`-readonly` is the mirror of `-?` from the very first snippet on this page — the minus **strips** a modifier instead of adding one. This unlocks a field that arrived `readonly` off the wire so local component state can mutate it.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Does `Partial<User>` make `patch.name.length` unsafe?',
      a: "Yes — and that's the feature working as intended. Every property becomes `T | undefined`, so a read has to narrow first: `patch.name?.length`. If only *some* fields can really be missing, `Partial` is the wrong tool for the whole object; model it precisely with `?` on just those fields, or `Partial<Pick<User, 'name'>> & Pick<User, 'id'>` for a mix of required and optional.",
    },
    {
      q: 'I need the resolved element type of `function load(): Promise<User[]>` without importing User. How?',
      a: "`type Loaded = Awaited<ReturnType<typeof load>>[number]`. `ReturnType` lifts out `Promise<User[]>`, `Awaited` unwraps to `User[]`, and indexing by `number` reads the element type out of the array — no manual annotation, and it updates automatically if `load`'s signature ever changes.",
    },
    {
      q: "Can I stop Omit from silently accepting a typo'd key?",
      a: "Not the built-in — its `K` is only constrained to `keyof any`, on purpose, so it keeps working on unions and intersections where an exact key check gets awkward (which is also, as you now know, exactly where it can go wrong the other way). If your codebase wants the safety back for ordinary object types, define your own: `type OmitStrict<T, K extends keyof T> = Omit<T, K>` — same implementation, a stricter constraint that rejects a key T doesn't have.",
    },
    {
      q: "What's `NoInfer<T>` for?",
      a: "It blocks a type parameter from being inferred at one specific call site, so only your *other* arguments drive inference there. `function pick<T>(items: T[], fallback: NoInfer<T>)` — without it, `pick(['a', 'b'], 'z')` widens `T` to `string`, so the typo'd `'z'` is silently accepted; wrap `NoInfer` around `fallback` and only `items` gets to decide `T`, so `'z'` correctly fails to match `'a' | 'b'`. It's a compiler-blessed inference blocker, not a mapped or conditional type you could reproduce yourself.",
    },
    {
      q: "For a dictionary that's genuinely open — any string key at all — is Record<string, V> or a Map the better call?",
      a: "Lean `Map` once you're doing real dictionary work: `.has()` forces a check before a read, `.get()` returns `V | undefined` honestly, and it never pretends every key exists the way an index type does. Keep `Record<string, V>` for the shape of incoming JSON or a quick literal, and turn on `noUncheckedIndexedAccess` so its reads are honest too — see the closed-vs-open section above for exactly what that flag changes.",
    },
  ];
}
