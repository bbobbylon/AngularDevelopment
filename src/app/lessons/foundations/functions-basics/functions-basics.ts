import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One stage of the call-stack walkthrough: what is happening, and to what.
 */
interface CallFrame {
  stage: string;
  detail: string;
  code: string;
}

/** One call of tip(50, 20), slowed down to its four moments. */
const CALL_TRACE: CallFrame[] = [
  {
    stage: '1 · The call',
    code: `const t = tip(50, 20);`,
    detail:
      'Execution reaches this line. The parentheses after a name mean "run it". Before anything is assigned to t, the program JUMPS into the function, carrying the two argument values along.',
  },
  {
    stage: '2 · Parameters filled',
    code: `function tip(bill, percent)  →  bill = 50, percent = 20`,
    detail:
      'Inside the function, the parameter names become real variables pre-loaded with the arguments, matched by position: first argument → first parameter. These boxes exist ONLY inside this call.',
  },
  {
    stage: '3 · The body runs',
    code: `return bill * (percent / 100);   // 50 * 0.2 → 10`,
    detail:
      'The body computes. When it hits return, two things happen at once: the function ENDS immediately (any lines below are skipped), and the value 10 travels back to the call site.',
  },
  {
    stage: '4 · Back at the call site',
    code: `const t = 10;   // the call was REPLACED by its return value`,
    detail:
      'The expression tip(50, 20) has collapsed into 10, and normal top-to-bottom execution resumes. Mental model: a function call is an expression that gets replaced by whatever it returns. bill and percent are gone — they lived only for the duration of the call.',
  },
];

/**
 * Lesson: Functions — definition vs call, parameters vs arguments, return
 * (including the "return ends the function" rule), a live call traced
 * step-by-step, scope, arrow functions, functions-as-values (callbacks) —
 * the concept that unlocks map/filter, event handlers and all of RxJS later.
 */
@Component({
  selector: 'app-lesson-functions-basics',
  imports: [RouterLink],
  templateUrl: './functions-basics.html',
  styleUrl: './functions-basics.css',
})
export class FunctionsBasics {
  /**
   * The bill in the tip calculator.
   */
  protected readonly bill = signal(50);
  /**
   * The tip percentage.
   */
  protected readonly percent = signal(18);
  /**
   * The tip, derived rather than stored — the demo's point is that a value
   * computed from inputs should not be a second source of truth.
   */
  protected readonly tipAmount = computed(() => (this.bill() * this.percent()) / 100);
  /**
   * The total, likewise derived.
   */
  protected readonly total = computed(() => this.bill() + this.tipAmount());

  /**
   * The call-stack walkthrough stages.
   */
  protected readonly callTrace = CALL_TRACE;
  /**
   * Which stage the walkthrough is on.
   */
  protected readonly stage = signal(0);
  /**
   * Advances a stage, stopping at the last.
   */
  protected stageFwd() {
    this.stage.update((s) => Math.min(s + 1, this.callTrace.length - 1));
  }
  /**
   * Steps back a stage, stopping at the first.
   */
  protected stageBack() {
    this.stage.update((s) => Math.max(s - 1, 0));
  }
}
