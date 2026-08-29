import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './mapped-conditional.html',
  styleUrl: './mapped-conditional.css',
})
export class MappedConditional {
  /**
   * The worked examples.
   */
  protected readonly cases = EVAL_CASES;
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
