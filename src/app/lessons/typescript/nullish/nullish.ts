import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * A deliberately hole-y shape: both the address and its city are optional, so
 * the demo needs two links of optional chaining to reach the city.
 */
interface Profile {
  name: string;
  address?: { city?: string };
  prefs?: { theme?: string };
}

/**
 * The falsy values worth distinguishing. `0`, `''` and `false` are falsy but
 * perfectly valid data; `null` and `undefined` are absence. Conflating the two
 * groups is exactly the bug `??` exists to prevent.
 */
type Falsyish = 0 | '' | false | null | undefined;

/**
 * One falsy value with a label, for the `||` against `??` comparison.
 */
interface FalsyCase {
  label: string;
  value: Falsyish;
}

const FALSY_CASES: FalsyCase[] = [
  { label: '0', value: 0 },
  { label: "''", value: '' },
  { label: 'false', value: false },
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
];

/**
 * Lesson: Optional chaining & nullish coalescing — exact short-circuit
 * semantics (?. always yields undefined, never null; the whole chain tail is
 * skipped), the || vs ?? falsy-vs-nullish distinction with a live comparison
 * demo, the logical-assignment trio, both flavors of the ! assertion, and how
 * strictNullChecks makes all of it matter.
 */
@Component({
  selector: 'app-lesson-ts-nullish',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './nullish.html',
  styleUrl: './nullish.css',
})
export class Nullish {
  /**
   * The skipped-argument puzzle used by the ask-before-telling block.
   *
   * The surprising part isn't that the call is skipped — it's that the
   * *argument expression* is skipped too, along with whatever side effect it
   * was going to have. People correctly predict `a?.notify(...)` doesn't run
   * `notify`, then still get this one wrong.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly skippedArgumentSample = `let ranSideEffect = false;

function computeArg() {
  ranSideEffect = true;   // a side effect, hiding inside an argument
  return 5;
}

const a = null;
a?.notify(computeArg());   // the line in question

console.log(ranSideEffect);`;

  /**
   * The self-test, on the zero-runtime-check property of `!`. Every wrong
   * answer imagines some safety net that the assertion simply does not provide.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: "It throws a plain runtime TypeError — \"Cannot read properties of undefined (reading 'getFullYear')\" — the same crash you'd get with no assertion at all.",
      correct: true,
      why: '`!` is erased at compile time and adds no check of its own. Telling the compiler "trust me, not null" changes what TypeScript lets you write, not what happens when the code actually runs against a value that really is undefined.',
    },
    {
      text: 'The compiler catches it during the build, because `!` still requires the compiler to verify the value is non-null before allowing the assertion.',
      why: 'It is the opposite: `!` exists specifically to *skip* that verification. The compiler trusts the assertion unconditionally, which is exactly why it is dangerous when the promise is wrong.',
    },
    {
      text: '`date!.getFullYear()` returns `undefined` instead of throwing, because the assertion converts a nullish access into a safe one at runtime.',
      why: 'That describes `?.`, not `!`. The two look similar but do opposite things: `?.` adds a real runtime check and degrades gracefully; `!` adds no check and crashes exactly like an unguarded access would.',
    },
    {
      text: 'Angular intercepts the error and reports it as a template error (like NG0100), since the assertion is used inside a component.',
      why: "This has nothing to do with templates or Angular's error codes — it is a plain JavaScript property access on `undefined`, throwing the same native `TypeError` it would in any JavaScript file.",
    },
  ];
  /**
   * The profile in the optional-chaining demo. Starts `null` so the demo opens on
   * the case that would throw without `?.`.
   */
  protected readonly profile = signal<Profile | null>(null);

  /**
   * The falsy values to compare.
   */
  protected readonly falsyCases = FALSY_CASES;
  /**
   * Which one is selected.
   */
  protected readonly picked = signal<FalsyCase>(FALSY_CASES[0]);

  /**
   * The selected value through `||`.
   *
   * Falls back on **any** falsy value — so a real `0` or `''` is silently
   * replaced by the fallback. Shown next to {@link nullishResult} so the
   * difference is visible rather than asserted.
   */
  protected orResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v || 'fallback') as unknown);
  }

  /**
   * The selected value through `??`. Falls back only on `null` or `undefined`, so
   * `0` and `''` survive.
   */
  protected nullishResult(): string {
    const v = this.picked().value;
    return JSON.stringify((v ?? 'fallback') as unknown);
  }

  /**
   * Loads a complete profile — every link in the chain present.
   */
  protected full() {
    this.profile.set({ name: 'Ada', address: { city: 'London' } });
  }
  /**
   * Loads a profile with no address — the middle link missing.
   */
  protected partial() {
    this.profile.set({ name: 'Ada' });
  }
  /**
   * Clears the profile entirely — the outermost link missing.
   */
  protected empty() {
    this.profile.set(null);
  }

  /**
   * The city, reached through two optional links with a fallback.
   *
   * One expression that survives all three demo states: without `?.` this throws
   * on a null profile, and without `??` it renders `undefined`.
   */
  protected city(): string {
    return this.profile()?.address?.city ?? 'Unknown';
  }
}
