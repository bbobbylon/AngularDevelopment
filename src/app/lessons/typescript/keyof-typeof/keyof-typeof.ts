import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
 * nothing drifts, each operator dissected with edge cases, the type-safe
 * getter built up parameter by parameter, a live derived-keys demo, and the
 * single-source-of-truth pattern (const object → keys → values → unions)
 * used across real Angular codebases.
 */
@Component({
  selector: 'app-lesson-ts-keyof-typeof',
  imports: [RouterLink, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './keyof-typeof.html',
  styleUrl: './keyof-typeof.css',
})
export class KeyofTypeof {
  /**
   * The derivation chain, one link at a time. Worth drawing because people learn
   * these three operators separately and then cannot read
   * `(typeof ROUTES)[keyof typeof ROUTES]` — which is nothing but the chain below
   * written in one line.
   */
  protected readonly chain = [
    {
      label: '`const THEME = { … } as const`',
      detail: 'A real runtime value. The only thing you hand-write',
      tone: 'accent' as const,
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
      tone: 'good' as const,
    },
  ];

  /** The missing-`as const` trap. */
  protected readonly widenSample = `const roles = ['admin', 'editor', 'viewer'];

type Role = (typeof roles)[number];

function setRole(r: Role) { /* … */ }

setRole('emperor');

// Does this compile?`;

  /** Choices for the as-const-cost check. */
  protected readonly literalOptions = [
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
      why: "K is inferred as the literal `'retries'` here — that narrowing is exactly what makes `Config[K]` resolve to one specific type rather than a union. It is working correctly; it is just working against you.",
    },
  ];

  /**
   * The three operators side by side. A table because the confusion is almost
   * always about which one takes a *value* and which take a *type* — a
   * distinction that reads much faster in columns than in prose.
   */
  protected readonly operators = [
    {
      op: 'typeof x',
      takes: 'A value (an identifier or property chain)',
      gives: 'That value’s type',
      use: 'typeof THEME, ReturnType<typeof fn>',
      trap: 'Forgetting `as const`, so literals widen to `string`',
    },
    {
      op: 'keyof T',
      takes: 'A type',
      gives: 'A union of its key names',
      use: 'keyof typeof THEME',
      trap: '`keyof someArray` includes `push`, `length` and friends',
    },
    {
      op: 'T[K]',
      takes: 'A type and a key type',
      gives: 'The type stored at that key',
      use: "User['id'], T[keyof T], T[number]",
      trap: 'The key must be a type — `T[myVar]` is not valid',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
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

  /**
   * The theme keys, for the picker. The assertion is needed because
   * `Object.keys` is typed as `string[]` — it cannot promise no extra keys exist
   * at runtime.
   */
  protected readonly keys = Object.keys(THEME) as ThemeKey[];
  /**
   * The selected key.
   */
  protected readonly key = signal<ThemeKey>('primary');
  /**
   * Its value. Indexing `THEME` by a `ThemeKey` is checked at compile time, so a
   * typo here would not build.
   */
  protected readonly value = computed(() => THEME[this.key()]);

  /**
   * The `as const` role tuple, whose literal types drive the demo.
   */
  protected readonly roles = ROLES;
  /**
   * Which role is selected.
   */
  protected readonly roleIndex = signal(0);
  /**
   * The selected role — typed as the literal union, not `string`, because the
   * source array is `as const`.
   */
  protected readonly role = computed(() => this.roles[this.roleIndex()]);
}
