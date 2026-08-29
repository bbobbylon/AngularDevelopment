import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A discriminated union: two shapes distinguished by a literal `kind` field.
 * The discriminant is what lets TypeScript narrow the union inside a `switch`,
 * which is the mechanism {@link Types.area} demonstrates.
 */
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

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
];

/**
 * Lesson: Types, annotations & inference — primitives/tuples, how inference
 * and widening actually decide a type (live explorer), any/unknown/never/void
 * with the "any spreads" trap, unions + discriminated unions with exhaustive
 * checking (live), structural typing's surprises, and assertion discipline.
 */
@Component({
  selector: 'app-lesson-ts-types',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './types.html',
  styleUrl: './types.css',
})
export class Types {
  /**
   * The shape in the narrowing demo.
   */
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });

  /**
   * The inference examples.
   */
  protected readonly inferCases = INFER_CASES;
  /**
   * Which inference example is showing.
   */
  protected readonly inferIdx = signal(0);

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
}
