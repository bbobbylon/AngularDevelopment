import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One step of the variable-trace walkthrough: a line of code and what it does
 * to the values in memory.
 */
interface TraceLine {
  code: string;
  effect: string;
  boxes: { name: string; value: string }[];
}

/** A tiny program traced line by line — the "computer's eye view". */
const TRACE: TraceLine[] = [
  {
    code: `let price = 20;`,
    effect: 'Create a box named "price" and put the number 20 in it.',
    boxes: [{ name: 'price', value: '20' }],
  },
  {
    code: `let qty = 3;`,
    effect: 'Create a second box, "qty", holding 3. "price" is untouched.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '3' },
    ],
  },
  {
    code: `let total = price * qty;`,
    effect:
      'The RIGHT side runs first: look inside price (20) and qty (3), multiply → 60. Only then is the result stored in a new box "total". The boxes it read are not changed.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '3' },
      { name: 'total', value: '60' },
    ],
  },
  {
    code: `qty = 4;`,
    effect:
      'Replace the contents of "qty" with 4. Important: "total" is STILL 60 — line 3 already ran. Variables do not stay linked to the formula that produced them; a program is steps in time, not a spreadsheet.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '4' },
      { name: 'total', value: '60 (!)' },
    ],
  },
  {
    code: `total = price * qty;`,
    effect:
      'To refresh total you must run the calculation AGAIN. Now the right side reads 20 and 4 → 80, and that replaces the 60.',
    boxes: [
      { name: 'price', value: '20' },
      { name: 'qty', value: '4' },
      { name: 'total', value: '80' },
    ],
  },
];

/**
 * Lesson: Programming basics — values, types, variables, operators,
 * expressions vs statements, how the computer executes line by line,
 * and the classic beginner traps (= vs ===, string '5' vs number 5,
 * copy vs reference preview). Zero prior knowledge assumed.
 */
@Component({
  selector: 'app-lesson-programming-basics',
  imports: [RouterLink],
  templateUrl: './programming-basics.html',
  styleUrl: './programming-basics.css',
})
export class ProgrammingBasics {
  /**
   * The trace steps.
   */
  protected readonly trace = TRACE;
  /**
   * Which step the walkthrough is on.
   */
  protected readonly lineNo = signal(0);

  /**
   * Left operand of the `+` playground.
   */
  protected readonly left = signal('5');
  /**
   * Right operand of the `+` playground.
   */
  protected readonly right = signal('5');
  /**
   * Whether the left operand is treated as a number or a string. Separate from
   * the value itself so the same characters can be fed in as either — which is
   * the whole point: `5 + 5` and `'5' + '5'` are different operations.
   */
  protected readonly leftIsNum = signal(true);
  /**
   * Whether the right operand is treated as a number or a string.
   */
  protected readonly rightIsNum = signal(true);

  /** Renders the + expression with true JS semantics for the chosen types. */
  protected readonly plusExpr = computed(() => {
    const l: string | number = this.leftIsNum() ? Number(this.left()) || 0 : this.left();
    const r: string | number = this.rightIsNum() ? Number(this.right()) || 0 : this.right();
    const show = (v: string | number) => (typeof v === 'string' ? `'${v}'` : String(v));
    // `as never` keeps TS happy about the intentionally-mixed addition we're demonstrating
    const result = (l as never as number) + (r as never as number);
    return `${show(l)} + ${show(r)}   →   ${show(result)}   (${typeof result})`;
  });

  /**
   * Advances the trace, stopping at the last step.
   */
  protected stepFwd() {
    this.lineNo.update((n) => Math.min(n + 1, this.trace.length - 1));
  }
  /**
   * Steps the trace back, stopping at the first.
   */
  protected stepBack() {
    this.lineNo.update((n) => Math.max(n - 1, 0));
  }
}
