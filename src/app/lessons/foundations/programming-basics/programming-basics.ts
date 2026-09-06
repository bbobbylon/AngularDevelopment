import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

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
 * Lesson: programming basics — values, types, variables, assignment, how the
 * computer executes a program one line at a time, operators, and the small
 * set of traps (`=` vs `===`, silent type coercion, a stale variable) that
 * catch nearly every beginner at least once. Zero prior coding knowledge
 * assumed — this is the very first lesson in the app.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`,
 * `src/brain-friendly.css`). Shape copied from `expert/change-detection` (the
 * reference implementation) and `foundations/arrays-objects-basics` (the tone
 * reference for this same absolute-beginner track).
 *
 * ## Teaching order, and why it is this order
 *
 * 1. **Pose the problem before naming it.** A computer does not infer intent
 *    — it is asked what a program even needs before "variable" is defined.
 * 2. **Values and their types**, in prose, a table, an annotated snippet and
 *    a live playground — four modes of the single fact that `+` means two
 *    different things depending on what is either side of it.
 * 3. **The box analogy, at length**, because it is the idea the rest of the
 *    lesson — and every later lesson on state — is built on top of: prose,
 *    an SVG diagram, a dialogue between a replaceable box and a sealed one,
 *    and an annotated snippet.
 * 4. **Execution order** — the single most useful skill on the page is being
 *    able to trace a program line by line. A `Flow` diagram states the three
 *    moves inside one assignment; a `Predict` asks the reader to commit to
 *    an answer about a stale value *before* the interactive stepper lets
 *    them check themselves.
 * 5. **Operators**, annotated, plus a "go try this yourself" nudge — this
 *    material has to become muscle memory, not reading comprehension.
 * 6. **`=` vs `==` vs `===`** gets its own section rather than a stray note,
 *    because it is the single most repeated exam trap in the whole track: a
 *    `Predict` on the classic `if (score = 100)` bug, then a `Quiz` on the
 *    coercion difference between `==` and `===`.
 * 7. **Naming and comments** — lighter material, still annotated.
 * 8. **A round-up of the four traps** as named cards, a second, structural
 *    pass over material already taught, followed by the FAQ and recap.
 */
@Component({
  selector: 'app-lesson-programming-basics',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Napkin,
    Predict,
    Quiz,
    Remember,
  ],
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

  // ── Presentation data ─────────────────────────────────────────────────────

  /** The Programming from Zero track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Programming Basics' },
    { label: 'Functions', id: 'functions-basics' },
    { label: 'Arrays & Objects', id: 'arrays-objects-basics' },
    { label: 'Decisions & Loops', id: 'decisions-loops' },
    { label: 'Async Basics', id: 'async-basics' },
  ];

  /**
   * Sample: the same `+` doing two different jobs depending on the type either
   * side of it, with the silent, no-error middle case that makes it a trap.
   */
  protected readonly plusSample = `5 + 5;         // 10
'5' + '5';     // '55'
'5' + 5;       // '55'`;

  /** Line-by-line walkthrough of {@link plusSample}. */
  protected readonly plusNotes: CodeNote[] = [
    {
      line: 1,
      text: 'No quotes around either `5`, so both are **numbers**. `+` between two numbers means exactly what it means in maths: add them. `10` comes out, also a number. The `;` just marks "this instruction is finished" — like a full stop.',
    },
    {
      line: 2,
      text: "Quotes around **both** `5`s make them **strings** — text, not numbers, even though a human reads the same digit. `+` between two strings does not add; it **glues them end to end**. `'5'` next to `'5'` becomes the four-character string `'55'`, not the number `10`.",
    },
    {
      line: 3,
      text: "One string, one number — and here is the trap. JavaScript does not raise an error or ask which you meant. It silently converts the number `5` into the text `'5'`, then glues, giving `'55'` again. No warning was printed anywhere that a number just became text.",
    },
  ];

  /**
   * Sample: the box model — creating a reassignable box, replacing its
   * contents, and what a sealed box does when you try the same thing to it.
   */
  protected readonly boxSample = `let score = 0;
score = 10;

const name = 'Ada';
// name = 'Grace';   ← try it for real: throws here`;

  /** Line-by-line walkthrough of {@link boxSample}. */
  protected readonly boxNotes: CodeNote[] = [
    {
      line: 1,
      text: '`let` is the keyword that makes a brand-new, **reassignable** box and gives it the label `score`. Read the rest right to left: `= 0` means "put the value `0` into the box just named" — the equals sign is an instruction to **store**, not a claim that two things are equal. `;` closes the instruction.',
    },
    {
      line: 2,
      text: 'No `let` here, because the box already exists — writing `let score` a second time would be an error. This line reaches into the **existing** box and replaces what is inside it. Same box, same label, new contents. Nothing about the box itself changed.',
    },
    {
      line: 4,
      text: "`const` makes a box too, but a **sealed** one: once it holds a value, that box can never be pointed at anything else. `name` now permanently means `'Ada'`.",
    },
    {
      line: 5,
      text: 'The `//` at the start turns everything after it on this line into a **comment** — the computer skips it completely, so as written this line does nothing. It is left disabled on purpose: delete the `//` and run it for real, and JavaScript stops the program with `TypeError: Assignment to constant variable.` That error is the proof that `const` seals the box.',
    },
  ];

  /**
   * The box arguing with itself about what "changing a variable" means — the
   * exchange the whole section is built on, because "a box you can put a new
   * value into" is a sentence a beginner can repeat without it meaning
   * anything yet. Staging it as two boxes with opposite privileges makes the
   * asymmetry — reassignable vs sealed — the thing that sticks.
   */
  protected readonly boxTalk: BubbleTurn[] = [
    {
      who: 'let score',
      says: "I started at 0. Then someone wrote `score = 10;`. I'm still me — same label, same spot — I just have a 10 in me now instead of a 0.",
    },
    {
      who: 'const name',
      says: "I started at 'Ada'. Someone tried `name = 'Grace';` on me.",
    },
    {
      who: 'The program',
      says: 'And it threw. `TypeError: Assignment to constant variable.` I never even got to run the next line.',
    },
    {
      who: 'let score',
      says: "That wouldn't happen to me. `let` boxes expect to be refilled — that's the entire reason to write `let` instead of `const`.",
    },
    {
      who: 'const name',
      says: "And that's the entire reason to write `const` instead: I would rather crash loudly the moment something tries to move me than silently hold the wrong value for the rest of the program.",
    },
  ];

  /**
   * The three moves hiding inside one assignment statement — the mechanism
   * that explains why a variable does not "stay linked" to the formula that
   * produced it, drawn as a sequence rather than stated as a rule, because
   * the failure later in the section is entirely about *order*.
   */
  protected readonly assignFlow: FlowStep[] = [
    {
      label: 'Read the right side',
      detail:
        'Look up whatever is currently in `price` and `qty` — the values right now, nothing stored for later',
    },
    {
      label: 'Compute the answer',
      detail:
        '20 × 3 → 60. This step has already forgotten that it used `price` and `qty` to get there.',
      tone: 'accent',
    },
    {
      label: 'Store it in the box',
      detail: '`total` now holds 60 — a plain number, with no memory of the formula that made it',
      tone: 'good',
    },
  ];

  /**
   * Sample for the stale-total predict: the exact program the interactive
   * stepper below plays out, isolated to the two lines that matter.
   */
  protected readonly staleTotalSample = `let qty = 3;
let total = price * qty;   // total becomes 60

qty = 4;

console.log(total);        // ?`;

  /**
   * Sample for the assignment-in-condition predict: the classic `=` vs `===`
   * bug, shown doing real, silent damage rather than described.
   */
  protected readonly assignBugSample = `let score = 0;

if (score = 100) {
  console.log('You win!');
} else {
  console.log('Try again.');
}

console.log(score);   // ?`;

  /**
   * Sample: arithmetic, comparison and logical operators, each doing a
   * genuinely different job — this is the snippet the whole "operators"
   * section is built to annotate, not summarise.
   */
  protected readonly operatorsSample = `7 % 3;             // 1
5 === 5;           // true
5 !== 4;           // true
true && false;     // false
true || false;     // true
!true;              // false`;

  /** Line-by-line walkthrough of {@link operatorsSample}. */
  protected readonly operatorsNotes: CodeNote[] = [
    {
      line: 1,
      text: '`%` is **modulo**: "divide, and give me the leftover." 7 divided by 3 is 2 with 1 left over, so this is `1`. It looks exotic and it is everywhere — `n % 2 === 0` is the standard way to ask "is `n` even?"',
    },
    {
      line: 2,
      text: 'Three equals signs mean **strict comparison**: "are these exactly the same, with no conversion?" It does not store anything — it produces one of exactly two values, `true` or `false`, which you can then keep or hand to a decision.',
    },
    {
      line: 3,
      text: '`!==` is "strictly **not** equal". `5` and `4` genuinely differ, so this comes out `true`. Note this is a comparison, spelled with `!`, not the assignment operator from the box section — different symbol, different job.',
    },
    {
      line: 4,
      text: '`&&` is **AND**: the whole expression is only `true` if **both** sides are. One side here is `false`, so the answer is `false` without JavaScript even needing to know what the other side was.',
    },
    {
      line: 5,
      text: '`||` is **OR**: `true` if **at least one** side is. The left side alone is already `true`, so the result is `true` regardless of the right side.',
    },
    {
      line: 6,
      text: '`!` is **NOT** — it flips a boolean to its opposite. It reads right on its own value: `!true` is `false`, and `!false` would be `true`.',
    },
  ];

  /**
   * Sample: the two ways to write a comment — a whole-line or trailing
   * double-slash comment, and a slash-star pair that can span several lines.
   */
  protected readonly commentsSample = `// anything after two slashes is a comment — the computer ignores it.
let total = 5; // they can also sit at the end of a line

/* a slash-star pair opens a
   comment that can span several lines */`;

  /** Line-by-line walkthrough of {@link commentsSample}. */
  protected readonly commentsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two forward slashes, `//`, turn the rest of **that line** into a comment — nothing after them is ever run. This one occupies a whole line by itself.',
    },
    {
      line: 2,
      text: 'A `//` comment can also start partway through a line of real code: everything before it still runs — `total` really is created and set to `5` — and everything from `//` onward is ignored.',
    },
    {
      line: 4,
      text: 'A forward slash and a star together, `/*`, open a comment that keeps going — across as many lines as you like — until the matching `*/` closes it two lines down. Nothing between the two is ever run.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "What does `let x = 5; let y = x; x = 10;` leave in `y`? I've seen this catch people out.",
      a: "`y` is `5`. Line 2 **copied the value** out of `x`'s box into `y`'s own, separate box — after that they have nothing to do with each other, so line 3 only ever touches `x`. Numbers, strings and booleans always copy this cleanly. The `Arrays & Objects` lesson right after this one shows why objects behave completely differently, and it is worth taking seriously when you get there.",
    },
    {
      q: "Why does `'10' + 5` give `'105'` but `'10' - 5` gives `5`?",
      a: "`+` has two jobs, and when either side is a string it picks **gluing**: the `5` becomes `'5'` and you get `'105'`. `-` only ever has one job — subtraction — so JavaScript instead converts `'10'` into the number `10` and does the maths, giving `5`. Yes, that is inconsistent. It is exactly the kind of inconsistency TypeScript exists to catch before your code ever runs, which is where this course goes next.",
    },
    {
      q: 'When should I actually reach for `let` instead of `const`?',
      a: 'Only when the box genuinely needs new contents later: a counter you increment, a running total you build up across steps, a value you reset. Everything else should default to `const`. It is worth the habit — a sealed box that someone tries to reassign fails loudly and immediately, right where the mistake is, instead of quietly holding the wrong value for the rest of the program.',
    },
    {
      q: "Is `undefined` the same thing as `null`? They both seem to mean 'nothing'.",
      a: "Close, but they mean two different kinds of nothing. `undefined` is JavaScript's own answer when **no one ever gave a variable a value** — it is the default emptiness. `null` is a value **you** chose to put there on purpose, meaning this is deliberately empty — a form field left blank, a search that found nothing. You will see both constantly; the distinction rarely matters day to day, but it matters the moment you are checking whether something was ever set versus intentionally cleared.",
    },
    {
      q: 'Do I actually have to put a semicolon at the end of every line?',
      a: 'JavaScript will often insert missing ones for you — a feature called automatic semicolon insertion — which is exactly why relying on it is a bad idea: the rules for when it kicks in are stranger than they look, and a line broken across two lines can silently combine (or fail to) in a way you did not intend. Every sample in this course ends a statement with `;` on purpose, and doing the same in your own code costs nothing and removes an entire category of confusion.',
    },
  ];

  /**
   * Self-test — the `=` vs `==` vs `===` trap, the single most repeated exam
   * question in this track. The distractors are the two real confusions:
   * assuming `==` and `===` always agree, and assuming `===` silently
   * converts the way `==` does.
   */
  protected readonly equalityQuizOptions: QuizOption[] = [
    {
      text: "`true`, then `true` — they're just two ways to write the same comparison.",
      why: 'They agree astonishingly often, which is exactly what makes this dangerous — until one side is a different type from the other, at which point they can flatly disagree. `==` (loose equality) converts types before comparing; `===` (strict equality) refuses to, and treats a type mismatch as an automatic `false`.',
    },
    {
      text: '`true`, then `false` — `==` converts the string to a number first; `===` refuses to and sees a number next to a string.',
      correct: true,
      why: "Exactly. `'5' == 5` quietly converts `'5'` into `5` before comparing, and `5 === 5` is obviously `true`. `'5' === 5` skips that step entirely: a string can never strictly equal a number, no matter what digits it contains, so the answer is `false` without JavaScript looking at the value at all.",
    },
    {
      text: '`false`, then `true` — `===` is the more forgiving one, since it checks more equals signs.',
      why: 'More `=` signs does not mean more forgiving — it means the opposite. `===` is the **stricter** comparison precisely because it does less work on your behalf: no conversion, no guessing what you meant. `==` is the forgiving (and riskier) one.',
    },
    {
      text: "Both throw an error, because you can't compare a string to a number.",
      why: 'Comparing mismatched types is completely legal in JavaScript and never throws — it just quietly answers `true` or `false` for you, sometimes not the answer you expected. Errors and silent wrong answers are different failure modes, and this whole lesson is about how often JavaScript picks the second one.',
    },
  ];
}
