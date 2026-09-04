import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Faq,
  type FaqItem,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';

/**
 * One worked type-evaluation: an expression and the steps the compiler takes to
 * reduce it.
 */
interface EvalCase {
  label: string;
  expr: string;
  steps: string[];
  result: string;
}

const EVAL_CASES: EvalCase[] = [
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
];

/**
 * Lesson: Mapped & conditional types — the type-level programming model
 * (types as functions over types), mapped-type anatomy piece by piece, key
 * remapping and filtering, conditional types + infer with a live evaluator,
 * distribution over unions (and how to switch it off), template literals,
 * and rebuilding the standard utility types from scratch.
 */
@Component({
  selector: 'app-lesson-ts-mapped-conditional',
  imports: [RouterLink, Faq, Predict, Quiz, Remember],
  templateUrl: './mapped-conditional.html',
  styleUrl: './mapped-conditional.css',
})
export class MappedConditional {
  /**
   * The worked examples.
   */
  protected readonly cases = EVAL_CASES;

  /**
   * The `IsNever` puzzle used by the ask-before-telling block.
   *
   * Lives here rather than inline in the template because the snippet contains
   * `{`/`}`, which Angular's template parser reads as control-flow block syntax
   * inside an attribute value. Bound as `[code]` instead — the convention the
   * other lessons follow.
   */
  protected readonly isNeverSample = `type IsNever<T> = T extends never ? true : false;

type A = IsNever<string>;   // false — makes sense, string is not never
type B = IsNever<never>;    // ...what does THIS one give you?`;

  /**
   * The distribution self-test. The wrong answers each name a real misreading:
   * confusing distribution with the tuple-wrapped form, mis-remembering what
   * `unknown` accepts, and the same non-distributive answer in different clothes.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: '`string[] | number[]`',
      correct: true,
      why: 'Right. `T` is a bare type parameter, so the conditional distributes: it runs once for `string` (giving `string[]`), once for `number` (giving `number[]`), then unions the two results.',
    },
    {
      text: '`(string | number)[]`',
      why: 'That is the answer for `ToArrayND<T> = [T] extends [unknown] ? T[] : never` — the tuple wrap switches distribution off and keeps the union whole. Without the brackets you get the distributed version.',
    },
    {
      text: '`never`, because `string | number` does not extend `unknown`',
      why: 'Everything extends `unknown` — it is the top type, the safe `any`. The condition is always true here; the interesting part is not *whether* it matches but *how many times it runs*.',
    },
    {
      text: '`Array<string | number>`',
      why: 'This is `(string | number)[]` written the long way, so it is the same wrong answer: it keeps the union intact instead of splitting it. Distribution splits first, then re-unions.',
    },
  ];

  /**
   * The small doubts learners actually have about type-level programming — the
   * ones the handbook does not answer because they are about intuition, not syntax.
   */
  protected readonly questions: readonly FaqItem[] = [
    {
      q: 'Does any of this cost anything at runtime?',
      a: 'Nothing at all. Every type in this lesson is erased before the JavaScript is emitted — a `Getters<T>` that generates forty method signatures produces zero bytes of output. The only cost is compile time, and that is real: deeply recursive conditional types can slow the checker down noticeably.',
    },
    {
      q: 'Why does `extends` mean two different things?',
      a: 'It really is doing two jobs. In `class A extends B` and `T extends string` (a *constraint*, in the angle brackets) it means "must be at least this". In `T extends string ? X : Y` it is a *question* — "is it?". Position tells you which: after a `?` follows, it is the question form.',
    },
    {
      q: 'When would I ever write one of these in real code?',
      a: 'Library and framework boundaries, mostly: a typed event bus (`Handlers<T>`), a form builder that mirrors your model, an API client that derives response types from a route map. In feature code you should be *consuming* `Partial`/`Pick`/`ReturnType`, not writing new ones.',
    },
    {
      q: 'How do I debug a type that comes out wrong?',
      a: 'Hover it. Then break it into named intermediate steps — `type Step1 = keyof T; type Step2 = ...` — and hover each one. Type-level code has no debugger, so naming the intermediates *is* the debugger. If the result is inexplicably `never`, suspect distribution.',
    },
    {
      q: 'Is `never` the same as `void` or `undefined`?',
      a: 'No. `undefined` has one value, `void` means "ignore the return", and `never` has *no* values — it is the empty set. That is why it disappears from unions (`"a" | never` is `"a"`) and why remapping a key to `never` deletes it: there is nothing there to keep.',
    },
  ];
  /**
   * Which example is being stepped through.
   */
  protected readonly active = signal<EvalCase>(EVAL_CASES[0]);
  /**
   * How far through its steps the walkthrough is.
   */
  protected readonly step = signal(0);

  /**
   * Selects an example, restarting its walkthrough at the first step.
   *
   * @param c The example to show.
   */
  protected select(c: EvalCase) {
    this.active.set(c);
    this.step.set(0);
  }
  /**
   * Advances one step, stopping at the last.
   */
  protected nextStep() {
    this.step.update((s) => Math.min(s + 1, this.active().steps.length - 1));
  }
}
