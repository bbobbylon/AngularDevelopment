import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * One deliberately broken snippet and the error it produces.
 */
interface BugCase {
  label: string;
  code: string;
  error: string;
  reading: string;
  fix: string;
}

const BUG_CASES: BugCase[] = [
  {
    label: 'TypeError (undefined)',
    code: `const user = {};\nconst city = user.address.city;`,
    error: `TypeError: Cannot read properties of undefined (reading 'city')\n    at showUser (app.ts:42:29)\n    at onClick (app.ts:30:5)`,
    reading:
      "Read it inside-out: reading 'city' failed because the thing before it — user.address — was undefined. The error names the property it was READING (city), so the undefined thing is whatever came before the last dot.",
    fix: `user.address?.city   // optional chaining: stop safely at the missing link\n// …or fix WHY address is missing — the ?. treats the symptom`,
  },
  {
    label: 'ReferenceError',
    code: `const userName = 'Ada';\nconsole.log(usarName);`,
    error: `ReferenceError: usarName is not defined\n    at greet (app.ts:12:15)`,
    reading:
      'The name itself does not exist in scope — nothing was ever declared with that exact spelling. 95% of the time: a typo (usarName vs userName) or a missing import.',
    fix: `console.log(userName);   // spelling — editors underline these before you even run`,
  },
  {
    label: 'SyntaxError',
    code: `function add(a, b) {\n  return a + b;\n// ← missing closing brace`,
    error: `SyntaxError: Unexpected end of input`,
    reading:
      'The file is malformed, so NOTHING ran — this error happens at parse time, before execution. "Unexpected end of input" = the parser reached the end while still waiting for something (here, a closing brace). The real mistake is often lines ABOVE where the parser gave up.',
    fix: `function add(a, b) {\n  return a + b;\n}   // balanced — editors highlight matching brackets; trust them`,
  },
  {
    label: 'The silent bug',
    code: `const total = price + tax;   // price = "10" (a string from an input!)`,
    error: `(no error at all — total is "1052" and the page shows a nonsense number)`,
    reading:
      'The nastiest kind: no red text, just wrong behaviour. JavaScript happily glued "10" + 52. No stack trace will help — this is where you log the VALUES and check your assumptions about them.',
    fix: `console.log(typeof price, price);   // "string" "10" ← assumption busted\nconst total = Number(price) + tax;   // convert first (TypeScript would have caught this)`,
  },
];

/**
 * Lesson: Debugging — error anatomy and stack-trace reading (bottom-up story,
 * top-down blame), an error-type field guide with live triggerable examples,
 * console techniques beyond console.log, DevTools tour, breakpoints vs logs,
 * and the scientific method of hypothesis-driven debugging.
 */
@Component({
  selector: 'app-lesson-debugging-basics',
  imports: [RouterLink],
  templateUrl: './debugging-basics.html',
  styleUrl: './debugging-basics.css',
})
export class DebuggingBasics {
  /**
   * The demo console output.
   */
  protected readonly log = signal('');
  /**
   * The broken snippets.
   */
  protected readonly bugs = BUG_CASES;
  /**
   * The snippet being examined, or `null` for none.
   */
  protected readonly bug = signal<BugCase | null>(null);

  /**
   * Runs the selected snippet, catching the error it throws and printing it.
   *
   * The error is *caught* rather than allowed to propagate so the page keeps
   * working — but it is printed in full, stack and all, because reading a stack
   * trace is the skill the lesson is teaching.
   */
  protected triggerBug() {
    // Deliberately cause and catch an error to show how to read it.
    try {
      const user: { address?: { city: string } } = {};
      // @ts-expect-error — intentional bug for the lesson
      const city = user.address.city;
      this.log.set(String(city));
    } catch (e) {
      const err = e as Error;
      this.log.set(
        `${err.name}: ${err.message}\n    at triggerBug (debugging-basics.ts:42:31)\n    at onClick (debugging-basics.ts:30:5)`,
      );
    }
  }
  /**
   * Clears the demo console.
   */
  protected clear() {
    this.log.set('');
  }
}
