import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * One frame of the loop walkthrough: the phase, the counter, and what happens.
 */
interface LoopFrame {
  phase: string;
  i: string;
  test: string;
  output: string[];
  note: string;
}

/** Every micro-step of `for (let i = 0; i < 3; i++)` — the loop, slowed down. */
const LOOP_FRAMES: LoopFrame[] = [
  {
    phase: '① init',
    i: '0',
    test: '—',
    output: [],
    note: 'Runs ONCE before anything: create the counter box i = 0.',
  },
  {
    phase: '② test',
    i: '0',
    test: '0 < 3 → true',
    output: [],
    note: 'Before every lap: is the condition still true? Yes → enter the body.',
  },
  {
    phase: '③ body',
    i: '0',
    test: '—',
    output: ['Hello 0'],
    note: 'Run the code between the braces with the current i.',
  },
  {
    phase: '④ step',
    i: '1',
    test: '—',
    output: ['Hello 0'],
    note: 'After the body: i++ bumps the counter to 1. Back to the test.',
  },
  {
    phase: '② test',
    i: '1',
    test: '1 < 3 → true',
    output: ['Hello 0'],
    note: 'Still true → another lap.',
  },
  {
    phase: '③ body',
    i: '1',
    test: '—',
    output: ['Hello 0', 'Hello 1'],
    note: 'Body runs again, this time i is 1.',
  },
  {
    phase: '④ step',
    i: '2',
    test: '—',
    output: ['Hello 0', 'Hello 1'],
    note: 'i++ → 2. Back to the test.',
  },
  {
    phase: '② test',
    i: '2',
    test: '2 < 3 → true',
    output: ['Hello 0', 'Hello 1'],
    note: 'True one last time.',
  },
  {
    phase: '③ body',
    i: '2',
    test: '—',
    output: ['Hello 0', 'Hello 1', 'Hello 2'],
    note: 'Third and final body run.',
  },
  {
    phase: '④ step',
    i: '3',
    test: '—',
    output: ['Hello 0', 'Hello 1', 'Hello 2'],
    note: 'i++ → 3.',
  },
  {
    phase: '② test',
    i: '3',
    test: '3 < 3 → FALSE',
    output: ['Hello 0', 'Hello 1', 'Hello 2'],
    note: 'The test finally fails → the loop ends. Execution continues after the closing brace. Total: 3 laps, and i ended at 3, not 2.',
  },
];

/** The values the `switch` demo can be pointed at. */
type AccountStatus = 'active' | 'pending' | 'banned' | 'archived';

/**
 * The three non-default cases, in switch-declaration order — what the buggy
 * (no-`break`) version below cascades through.
 *
 * Not written as an actual fallthrough `switch`: this project's own
 * `tsconfig.json` turns on `noFallthroughCasesInSwitch`, which correctly
 * *refuses to compile* a case with a statement in it that isn't followed by
 * `break`/`return`/`throw` — it is precisely this bug, caught before the
 * page ever loads. So the demo reproduces the same output — everything from
 * the matched case to the end runs, then the default — without writing the
 * bug into checked source.
 */
const STATUS_CASES: readonly { status: AccountStatus; message: string }[] = [
  { status: 'active', message: 'Account is active.' },
  { status: 'pending', message: 'Verification pending.' },
  { status: 'banned', message: 'Account banned — access revoked.' },
];

/** What a switch with every `break` deleted would print. See {@link STATUS_CASES}. */
function switchNoBreak(status: AccountStatus): string[] {
  const startIndex = STATUS_CASES.findIndex((c) => c.status === status);
  const cascaded = startIndex === -1 ? [] : STATUS_CASES.slice(startIndex).map((c) => c.message);
  return [...cascaded, '(reached the default branch)'];
}

/** The same switch, correctly `break`-ed — exactly one line ever prints. */
function switchWithBreak(status: AccountStatus): string[] {
  const log: string[] = [];
  switch (status) {
    case 'active':
      log.push('Account is active.');
      break;
    case 'pending':
      log.push('Verification pending.');
      break;
    case 'banned':
      log.push('Account banned — access revoked.');
      break;
    default:
      log.push('(reached the default branch)');
  }
  return log;
}

/**
 * Removes even numbers from a list with a counting `for` loop that `splice`s
 * as it goes. Reads as reasonable and is subtly wrong: deleting a slot
 * shifts every later item one place left, but `i` still advances by one, so
 * whatever just slid into the deleted slot is skipped over completely.
 */
function removeEvensBuggy(list: readonly number[]): number[] {
  const copy = [...list];
  for (let i = 0; i < copy.length; i++) {
    if (copy[i] % 2 === 0) {
      copy.splice(i, 1);
    }
  }
  return copy;
}

/** The fix: build a new array instead of editing the one you're walking. */
function removeEvensSafe(list: readonly number[]): number[] {
  return list.filter((n) => n % 2 !== 0);
}

/**
 * Lesson: Decisions & Loops — how straight-line code learns to choose a path
 * (`if`/`else`/`else if`, truthiness, the ternary, `&&`/`||`, `switch`) and
 * to repeat itself (the three-part `for`, `for...of`, `while`, `break` and
 * `continue`, `map`/`filter`/`reduce`), traced live rather than merely
 * described.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`,
 * `src/brain-friendly.css`); `expert/change-detection` is the reference
 * implementation whose section rhythm this copies — eyebrow, declarative
 * headline, ask-before-telling, then mechanism in several modes.
 *
 * ## Teaching order, and why
 *
 * 1. **Pose the problem before naming the fix.** The opening napkin makes the
 *    reader commit to a truthiness guess — including the deliberately unfair
 *    `'0'` (a string, and therefore truthy) — before "falsy six" is ever said
 *    out loud.
 * 2. **One analogy carries the whole first half.** `if`/`else` is a railway
 *    switch: one train, one fork, exactly one track. Truthiness, the
 *    ternary, `&&`/`||` and `switch` are all just more ways of asking that
 *    same fork a question, so the picture is introduced once and referenced
 *    forward rather than redrawn per topic.
 * 3. **Every failure mode gets proof, not a warning label.** The reversed
 *    `else if` order, `forEach`'s missing `break`, and splicing an array
 *    you're mid-loop over are each demonstrated — live where the bug is
 *    demonstrable with a button (the splice skip), and as a trace-it-first
 *    `app-predict` where the point is the reader's own wrong guess (the
 *    other two).
 * 4. **The loop's four phases get three separate treatments** — an SVG
 *    cycle diagram, a row of tape cards, and the (pre-existing) live
 *    micro-stepper — because "redundancy across different modes" is the
 *    single highest-leverage retention device available for a mechanism
 *    this mechanical.
 * 5. **Coverage-sweep findings folded in as new material**: `switch`/`case`
 *    with its fall-through failure mode, the ternary and `&&`/`||` as
 *    value-producing operators (not just boolean glue), `forEach`'s missing
 *    `break` plus the splice-while-looping bug, and `reduce` deepened with
 *    an accumulator trace and a non-numeric (group-by) use.
 */
@Component({
  selector: 'app-lesson-decisions-loops',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './decisions-loops.html',
  styleUrl: './decisions-loops.css',
})
export class DecisionsLoops {
  // ── Demo 1: if / else ───────────────────────────────────────────────────

  /** The age in the `if`/`else` demo. */
  protected readonly age = signal(20);
  /** The branch the current age takes. */
  protected readonly voteMessage = computed(() =>
    this.age() >= 18 ? 'You can vote 🗳️' : 'Too young to vote',
  );

  // ── Demo 2: the || defaulting trap, live ────────────────────────────────

  /** Which of four values — including a genuine `undefined` — the `||` demo currently holds. */
  protected readonly orDemoValue = signal<number | undefined>(undefined);

  /** `value || 10` — the naive default, which mishandles a real `0`. */
  protected readonly orDefaulted = computed(() => this.orDemoValue() || 10);

  /** The explicit fix already established above: compare to `undefined`, not truthiness. */
  protected readonly explicitlyDefaulted = computed(() =>
    this.orDemoValue() !== undefined ? this.orDemoValue() : 10,
  );

  /** The demo's readout, with the one row where the two defaults disagree flagged. */
  protected readonly orDemoReadout = computed(() => {
    const raw = this.orDemoValue();
    const label = raw === undefined ? 'undefined' : String(raw);
    const naive = this.orDefaulted();
    const explicit = this.explicitlyDefaulted();
    const flag = naive !== explicit ? '   ⚠ disagree — 0 was real data' : '   agree';
    return [
      `value                              = ${label}`,
      `value || 10                        → ${naive}${flag}`,
      `value !== undefined ? value : 10   → ${explicit}`,
    ].join('\n');
  });

  // ── Demo 3: switch fall-through, live ───────────────────────────────────

  /** Which status the switch demo is currently testing. */
  protected readonly status = signal<AccountStatus>('active');
  /** Whether the demo runs the correctly `break`-ed version or the buggy one. */
  protected readonly useBreaks = signal(true);

  /** The switch's own log lines, numbered for the readout. */
  protected readonly switchLog = computed(() => {
    const lines = this.useBreaks() ? switchWithBreak(this.status()) : switchNoBreak(this.status());
    return lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
  });

  // ── Demo 4: the for loop, traced live (pre-existing) ────────────────────

  /** The loop walkthrough frames. */
  protected readonly frames = LOOP_FRAMES;
  /** Which frame the walkthrough is on. */
  protected readonly frame = signal(0);
  /** Advances a frame, stopping at the last. */
  protected frameFwd() {
    this.frame.update((f) => Math.min(f + 1, this.frames.length - 1));
  }
  /** Steps back a frame, stopping at the first. */
  protected frameBack() {
    this.frame.update((f) => Math.max(f - 1, 0));
  }

  // ── Demo 5: the splice-while-looping bug, live ──────────────────────────

  /** The fixed source array the splice demo always starts from. */
  protected readonly spliceSource: readonly number[] = [2, 4, 6, 7, 9];

  /** The result of the version the reader last ran, or `null` before either has run. */
  protected readonly spliceResult = signal<number[] | null>(null);

  /** Whether an even number survived — the visible symptom of the bug. */
  protected readonly spliceHasBug = computed(() => {
    const result = this.spliceResult();
    return result !== null && result.some((n) => n % 2 === 0);
  });

  /** The demo's readout. */
  protected readonly spliceReadout = computed(() => {
    const source = `source: [${this.spliceSource.join(', ')}]`;
    const result = this.spliceResult();
    if (result === null) {
      return `${source}\n\n(run a version below)`;
    }
    const note = this.spliceHasBug()
      ? `⚠ ${result.filter((n) => n % 2 === 0).join(', ')} survived — an even number got skipped over.`
      : '✓ every even number is gone.';
    return `${source}\nresult: [${result.join(', ')}]\n\n${note}`;
  });

  /** Runs the buggy for-loop-with-splice version. */
  protected runSpliceBuggy(): void {
    this.spliceResult.set(removeEvensBuggy(this.spliceSource));
  }
  /** Runs the safe `filter` version. */
  protected runSpliceSafe(): void {
    this.spliceResult.set(removeEvensSafe(this.spliceSource));
  }
  /** Clears the demo back to its unrun state. */
  protected resetSplice(): void {
    this.spliceResult.set(null);
  }

  // ── Demo 6: map / filter / reduce pipeline (pre-existing) ───────────────

  /** The input array for the array-method pipeline demo. */
  protected readonly nums = [1, 2, 3, 4, 5, 6, 7, 8];
  /** Whether `filter` is in the pipeline. */
  protected readonly useFilter = signal(true);
  /** Whether `map` is in the pipeline. */
  protected readonly useMap = signal(false);
  /**
   * Whether `reduce` is in the pipeline. The three toggle independently so the
   * demo can show that order matters and that each stage feeds the next.
   */
  protected readonly useReduce = signal(false);

  /** Renders the chained pipeline with the intermediate value after each stage. */
  protected readonly pipelineExpr = computed(() => {
    let arr: number[] = this.nums;
    let text = `[${this.nums.join(', ')}]`;
    if (this.useFilter()) {
      arr = arr.filter((n) => n % 2 === 0);
      text += `\n  .filter(n => n % 2 === 0)   → [${arr.join(', ')}]`;
    }
    if (this.useMap()) {
      arr = arr.map((n) => n * 3);
      text += `\n  .map(n => n * 3)            → [${arr.join(', ')}]`;
    }
    if (this.useReduce()) {
      const sum = arr.reduce((s, n) => s + n, 0);
      text += `\n  .reduce((s, n) => s + n, 0) → ${sum}`;
    }
    return text;
  });

  // ── Presentation data ────────────────────────────────────────────────────

  /** The Programming from Zero track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Programming Basics', id: 'programming-basics' },
    { label: 'Functions', id: 'functions-basics' },
    { label: 'Arrays & Objects', id: 'arrays-objects-basics' },
    { label: 'Decisions & Loops' },
    { label: 'Async Basics', id: 'async-basics' },
  ];

  /**
   * `break` and `continue` arguing about which of them does what — the
   * two-word pair every learner mixes up at least once, staged as the
   * dialogue rather than left as a sentence to misremember.
   */
  protected readonly breakContinueTalk: BubbleTurn[] = [
    {
      who: 'break',
      says: 'I leave the loop. Completely. The instant I run, there is no more loop — execution jumps straight to the line after it.',
    },
    {
      who: 'continue',
      says: "I don't leave anything. I abandon *this* lap only, and jump back to the test for the next one.",
    },
    {
      who: 'break',
      says: "People swap us constantly. They expect you to quietly skip one item, the way I don't.",
    },
    {
      who: 'continue',
      says: "And they expect you to end the whole loop on the spot, the way I don't. We're opposites, not synonyms.",
    },
    {
      who: 'break',
      says: 'Same word, same rule inside a `switch`, by the way — I end the switch. I have nothing to do with any loop it happens to sit inside.',
    },
  ];

  // ── Code samples: if / else ──────────────────────────────────────────────

  /** Sample: the basic if/else, for the opening mechanism section. */
  protected readonly ifElseSample = `const age = 20;

if (age >= 18) {
  console.log('You can vote.');
} else {
  console.log('Too young.');
}`;

  /** Line-by-line walkthrough of {@link ifElseSample}. */
  protected readonly ifElseNotes: CodeNote[] = [
    {
      line: 1,
      text: '`const` declares a variable that can never be reassigned. `age` holds a plain number — nothing special yet.',
    },
    {
      line: 3,
      text: "`if` followed by a condition **in parentheses** — always parentheses, never optional. `age >= 18` collapses to one boolean: here, `20 >= 18` is `true`. The `{` opens the block that runs only when that's `true`.",
    },
    {
      line: 4,
      text: "Runs **only if** line 3's condition was `true`. Mentally skip it and re-read the whole block as one unit — that's what `if` actually controls.",
    },
    {
      line: 5,
      text: '`}` closes the `if` block; `else {` opens the block for **everything else** — every value that made line 3 `false`. `else` is optional: delete it, and a false condition simply skips past line 7 with no error.',
    },
    {
      line: 6,
      text: 'Runs only when line 3 was `false`. Exactly one of line 4 or line 6 executes — never both, never neither, so long as `else` is present.',
    },
    {
      line: 7,
      text: 'Closes the `else` block. Execution continues on whatever comes after this line, regardless of which branch ran.',
    },
  ];

  /** Sample: reversed else-if order — the exam-trap Predict. */
  protected readonly reversedGradeSample = `function letterGrade(score) {
  if (score > 80) return 'B';
  if (score > 90) return 'A';
  return 'C';
}

letterGrade(95);`;

  // ── Code samples: expressions, not statements ───────────────────────────

  /** Sample: if/else vs the ternary, doing the same job. */
  protected readonly ternarySample = `const age = 20;

// if/else — a STATEMENT: it can't produce a value
let label;
if (age >= 18) {
  label = 'adult';
} else {
  label = 'minor';
}

// ternary — an EXPRESSION: it IS a value
const label2 = age >= 18 ? 'adult' : 'minor';

console.log('You are an ' + label2 + '.');`;

  /** Line-by-line walkthrough of {@link ternarySample}. */
  protected readonly ternaryNotes: CodeNote[] = [
    {
      line: 4,
      text: '`label` has to be declared with `let`, **outside** the `if`, because both branches need to reach it — a `const` declared inside either block would vanish the moment that block ends.',
    },
    {
      line: 6,
      text: 'Each branch **assigns into** the `label` declared on line 4, rather than declaring its own. This whole four-line dance — declare outside, assign inside, twice — is exactly what a ternary replaces with one line.',
    },
    {
      line: 12,
      text: '`condition ? valueIfTrue : valueIfFalse` — read the `?` as "then" and the `:` as "otherwise". Unlike `if`, this entire expression **evaluates to a value**, which is why it can sit directly on the right of `=` — no outer `let`, no branches to assign into by hand.',
    },
    {
      line: 14,
      text: "Because it's a value, it can go anywhere a value can go — glued into a string with `+`, the same as any other variable. An `if` statement could never appear on this line; it doesn't produce anything to glue.",
    },
  ];

  /** Sample: && and || as value-producing operators. */
  protected readonly andOrSample = `// || returns the first TRUTHY operand
const nickname = '';
const shown = nickname || 'Guest';        // '' is falsy → 'Guest'

// the same trap, wearing a different hat:
const count = 0;
const displayed = count || 10;            // 10 — but 0 was real data!

// && returns the first FALSY operand, or the last one if all are truthy
const user = null;
const canEdit = user && user.isAdmin;     // null — short-circuits before .isAdmin

// the "guard" idiom: "IF user exists, THEN do this"
user && console.log(user.isAdmin);        // never runs — user is null`;

  /** Line-by-line walkthrough of {@link andOrSample}. */
  protected readonly andOrNotes: CodeNote[] = [
    {
      line: 3,
      text: "`||` checks `nickname` first. `''` is one of the falsy six, so `||` moves on and hands back its **right-hand operand** instead. Notice what it returns: not `true` — the actual string `'Guest'`.",
    },
    {
      line: 7,
      text: 'Same operator, and here is the trap: `count` is `0`, which is falsy — so `||` again reaches straight past it to `10`, even though `0` was a perfectly real, intended value. This is the discount bug from before, written with `||` instead of an `if`.',
    },
    {
      line: 11,
      text: '`&&` walks left to right and stops at the **first falsy value**. `user` is `null`, so it stops right there and returns `null` without ever touching `.isAdmin` — that short-circuit is what saves this line from crashing.',
    },
    {
      line: 14,
      text: 'The same short-circuit, used as a **guard**: read `a && b` as "if `a`, then `b`". Because `user` is falsy, JavaScript never even evaluates `console.log(user.isAdmin)` — the line silently does nothing, which is the intended behaviour here, not a bug.',
    },
  ];

  // ── Code samples: switch ────────────────────────────────────────────────

  /** Sample: switch, correctly `break`-ed — the mechanism CodeLab. */
  protected readonly switchSample = `function statusLabel(status) {
  switch (status) {
    case 'active':
      return 'Account is active.';
    case 'pending':
      return 'Verification pending.';
    case 'banned':
      return 'Account banned.';
    default:
      return 'Unknown status.';
  }
}

statusLabel('pending');`;

  /** Line-by-line walkthrough of {@link switchSample}. */
  protected readonly switchNotes: CodeNote[] = [
    {
      line: 2,
      text: "`switch` takes **one value** — `status` — and tests it against every `case` below in order, top to bottom, using **strict `===`**. That last part matters: a `case 1` never matches the string `'1'`.",
    },
    {
      line: 3,
      text: "One `case` is one possible **exact** value. When `status === 'active'`, execution jumps straight to line 4 and skips every case above it entirely.",
    },
    {
      line: 4,
      text: '`return` ends the function immediately, which — as a side effect — also ends the `switch`. It plays the same role `break` would, which is why this sample never needs to write `break` at all.',
    },
    {
      line: 9,
      text: "`default` is the catch-all: it runs when **no** `case` matched anything. It doesn't have to be written last, but placing it last means there is nothing below it to fall into by accident.",
    },
  ];

  // ── Code samples: for loop anatomy ──────────────────────────────────────

  /** Sample: the four-part for-loop header. */
  protected readonly forHeaderSample = `for (let i = 0; i < 3; i++) {
  console.log('Hello ' + i);
}`;

  /** Line-by-line walkthrough of {@link forHeaderSample}. */
  protected readonly forHeaderNotes: CodeNote[] = [
    {
      line: 1,
      text: "Three instructions packed into one header, separated by semicolons. **`let i = 0`** is the init — it runs exactly **once**, before anything else. **`i < 3`** is the test — checked **before every lap**; the loop keeps going only while this reads `true`. **`i++`** is the step — it runs **after** every lap's body, and it is what eventually makes the test fail.",
    },
    {
      line: 2,
      text: 'The body — everything between `{` and `}`. Runs once per lap, in order, with whatever value `i` currently holds. This is `③` in the phase stepper below.',
    },
    {
      line: 3,
      text: 'Closes the loop. The instant the test on line 1 reads `false`, execution jumps straight here and carries on below — the loop simply stops. No error, no signal, nothing else happens.',
    },
  ];

  // ── Code samples: for...of, while, break/continue ───────────────────────

  /** Sample: for...of and while, side by side with break/continue. */
  protected readonly forOfWhileSample = `// for...of — walk every ITEM, no counter to get wrong
for (const fruit of ['apple', 'banana', 'cherry']) {
  console.log(fruit);
}

// while — loop while a condition holds; you don't know the lap count up front
let tries = 0;
while (!connected && tries < 5) {
  attemptConnection();
  tries++;             // forget this line → infinite loop, frozen tab
}

break;      // leave the loop entirely, right now
continue;   // abandon THIS lap, jump to the next test`;

  /** Line-by-line walkthrough of {@link forOfWhileSample}. */
  protected readonly forOfWhileNotes: CodeNote[] = [
    {
      line: 2,
      text: '`for...of` reads as "for each item **of** this array". `fruit` is a name **you** choose — it holds one item per lap, no index, nothing to get off-by-one on.',
    },
    {
      line: 7,
      text: '`tries` has to live **outside** the loop — a `while` has no init slot of its own, so any counter it needs is set up on the line before.',
    },
    {
      line: 8,
      text: '`while` takes **just a condition**, checked before every lap exactly like a `for`\'s test — but there is no built-in init or step. `!connected && tries < 5` reads as "keep going while we\'re not connected, but give up after 5 tries."',
    },
    {
      line: 10,
      text: 'This is the step, and nothing forces you to write it — that is the entire danger of `while`. Delete this line and `tries` never changes, the condition never turns `false`, and the loop runs **forever**.',
    },
    {
      line: 13,
      text: '`break` exits the **whole loop** immediately — the nearest enclosing `for`, `while`, or `switch`. Nothing after it in the loop ever runs again.',
    },
    {
      line: 14,
      text: '`continue` is milder: it ends only the **current lap** and jumps straight back to the test. The loop itself keeps going.',
    },
  ];

  // ── Code samples: the forEach trap ───────────────────────────────────────

  /** Sample: forEach's missing early exit — the second Predict. */
  protected readonly forEachTrapSample = `function findFirstNegative(nums) {
  nums.forEach((n) => {
    if (n < 0) {
      return n;
    }
  });
}

findFirstNegative([4, 9, -3, 7, -1]);`;

  // ── Code samples: the splice-while-looping bug ──────────────────────────

  /** Sample: the buggy for-loop-with-splice, annotated. */
  protected readonly spliceBugSample = `function removeEvensBuggy(list) {
  const copy = [...list];
  for (let i = 0; i < copy.length; i++) {
    if (copy[i] % 2 === 0) {
      copy.splice(i, 1);
    }
  }
  return copy;
}

removeEvensBuggy([2, 4, 6, 7, 9]);`;

  /** Line-by-line walkthrough of {@link spliceBugSample}. */
  protected readonly spliceBugNotes: CodeNote[] = [
    {
      line: 2,
      text: "A copy, made with spread, so the caller's original array is left untouched — a good instinct. The bug that's coming has nothing to do with this line.",
    },
    {
      line: 3,
      text: "The test re-reads `copy.length` on **every** lap, which matters here because `splice` is about to change it mid-loop. Here's the actual trap: after a splice removes index `i`, the item that was at `i + 1` slides down **into** slot `i` — and then `i++` moves the loop past it without ever checking it. One deleted slot, one skipped neighbour.",
    },
    {
      line: 5,
      text: '`splice(i, 1)` deletes one item at index `i` and shifts everything after it one slot left to close the gap — real, in-place surgery on the very array you are mid-walk over.',
    },
    {
      line: 8,
      text: 'Whatever survived the walk — which, as the demo below shows, is not always just the odd numbers.',
    },
  ];

  // ── Code samples: reduce, deepened ───────────────────────────────────────

  /** The accumulator's value at each lap of `reduce`, traced as a Flow. */
  protected readonly reduceFlow: FlowStep[] = [
    {
      label: 'seed',
      detail: '`sum = 0` — the starting accumulator, from the `0` argument',
      tone: 'accent',
    },
    { label: 'lap 1: n = 2', detail: '`sum = 0 + 2` → `2`' },
    { label: 'lap 2: n = 5', detail: '`sum = 2 + 5` → `7`' },
    { label: 'lap 3: n = 3', detail: '`sum = 7 + 3` → `10`', tone: 'good' },
  ];

  /** Sample: reduce building an object, not a number — the group-by/lookup use. */
  protected readonly reduceLookupSample = `const people = [
  { name: 'Ada', age: 36 },
  { name: 'Grace', age: 41 },
  { name: 'Alan', age: 29 },
];

const ageByName = people.reduce((lookup, person) => {
  lookup[person.name] = person.age;
  return lookup;
}, {});

ageByName;              // { Ada: 36, Grace: 41, Alan: 29 }
ageByName['Grace'];     // 41`;

  /** Line-by-line walkthrough of {@link reduceLookupSample}. */
  protected readonly reduceLookupNotes: CodeNote[] = [
    {
      line: 7,
      text: "`reduce`'s function takes **two** arguments this time: `lookup` is the accumulator — whatever you're building, carried from lap to lap — and `person` is the current item. The `{}` on line 10 is the **seed**: the accumulator's starting value, and this time it's an empty object, not `0`.",
    },
    {
      line: 8,
      text: 'Adds one key to the accumulator: `person.name` becomes the key, `person.age` the value. Three laps, three keys added — the accumulator **grows** rather than summing.',
    },
    {
      line: 9,
      text: '**Must** return the accumulator, every lap — `reduce` hands whatever you return here to the *next* lap as its `lookup`. Forget this line and the next lap receives `undefined` instead of your object.',
    },
    {
      line: 10,
      text: "The closing `}, {})` — end of the callback, then the seed. `map` and `filter` can only hand back a differently sized or transformed **array**. This is the one thing the other two can't do: array in, **object** out.",
    },
    {
      line: 13,
      text: "And here's the payoff: one lookup, no scanning. Compare it to `people.find((p) => p.name === 'Grace').age`, which walks the whole array again every single time you ask.",
    },
  ];

  // ── Self-tests ────────────────────────────────────────────────────────────

  /**
   * Self-test 1 — the truthiness trap, straight off the discount example.
   */
  protected readonly truthinessQuizOptions: QuizOption[] = [
    {
      text: 'Yes — `0` is a number, and numbers are truthy.',
      why: "Only **nonzero** numbers are truthy. `0` is one of exactly six falsy values in JavaScript, and it doesn't matter that it's a real, meaningful piece of data — `if` only ever sees a value's truthiness, never its meaning.",
    },
    {
      text: 'No — `0` is falsy, so the block is skipped even though `0` is a real, intended value.',
      correct: true,
      why: 'Right. `discount` genuinely holds `0` — a real, valid discount — but `if` converts it to a boolean first, and `0` converts to `false`. The data is correct; the test is simply the wrong tool for a value that can legitimately be zero.',
    },
    {
      text: 'No — because `discount` was never assigned a real value.',
      why: 'It absolutely was assigned — `const discount = 0;` is a real assignment to a real number. The block is skipped for a completely different reason: `0` just happens to be one of the six falsy values, assigned or not.',
    },
    {
      text: '`if` only cares whether a variable exists, not what it holds, so it runs.',
      why: "`if` doesn't check existence at all — it converts whatever value is inside to `true` or `false`. `discount` exists and holds `0`; it's the *value* `0` that fails the test.",
    },
  ];

  /**
   * Self-test 2 — switch fall-through, mirroring the live demo above it.
   */
  protected readonly switchQuizOptions: QuizOption[] = [
    {
      text: "Only `'Verification pending.'` — switch stops at the first matching case automatically.",
      why: "That's how an `if`/`else if` chain works, not `switch`. A `case` without its own `break` doesn't stop anything — execution just keeps running downward into whatever comes next, match or no match.",
    },
    {
      text: "Both `'Verification pending.'` AND `'Account banned.'` — execution falls through until it hits a `break`.",
      correct: true,
      why: "Exactly. Once `case 'pending'` matches, JavaScript stops **testing** entirely and just runs every line downward until a `break` (or the switch ends). `'Account banned.'` prints even though the account was never banned.",
    },
    {
      text: "Nothing — `status` doesn't match `'banned'`, so that case is skipped.",
      why: "Fall-through isn't a second test being run and failed — once a case matches, the switch stops testing altogether. `'banned'`'s condition is never re-checked; its code just happens to sit next in line.",
    },
    {
      text: 'A syntax error — every `case` needs its own `break`.',
      why: '`break` is entirely optional syntactically — that is exactly what makes fall-through possible at all, deliberately (grouped cases) or, as here, by accident.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Why does JavaScript let `0` stand for `false` at all — isn't that asking for bugs?",
      a: "It's a convenience that pays for itself constantly — `if (list.length)` reads as \"if the list has anything in it\" with zero ceremony, and that's genuinely the common case. The bug only shows up when `0` (or `''`) is itself a **meaningful value** rather than an absence, which is exactly the discount example above.",
    },
    {
      q: 'Is `switch` actually faster than a long `if`/`else if` chain?',
      a: 'In modern JS engines, not meaningfully — for a handful of cases the difference is noise. Reach for `switch` for **readability**: it says "test this one value against several exact possibilities" more clearly than a wall of `===` checks does. Speed is not the argument.',
    },
    {
      q: 'When would I actually *want* fall-through in a `switch`?',
      a: "Grouped cases that share one action — several labels, one outcome. `case 'Sat': case 'Sun': return 'Weekend';` deliberately lets `'Sat'` fall into `'Sun'`'s line with no code of its own. Same mechanism as the bug above, aimed on purpose.",
    },
    {
      q: 'Can I `break` out of a `forEach` if I really need to?',
      a: 'No — not with `break`, not with `continue`, and a `return` inside the callback only ends that one call, nothing more. If you need an early exit, reach for a `for...of` loop with a real `break`, or `.some()` / `.find()`, which are built to stop the moment they have an answer.',
    },
    {
      q: 'I keep seeing `??` mentioned as "the fix" for the `0` trap — why isn\'t it here?',
      a: "`??` (nullish coalescing) treats only `null` and `undefined` as \"missing\" and lets `0` and `''` sail straight through — a more precise tool for exactly this problem than `||`. It's TypeScript-tier syntax you'll meet properly soon; until then, the explicit comparison above (`!== undefined`) does the identical job.",
    },
    {
      q: 'My `reduce` had no starting value and it *mostly* worked — what happened?',
      a: "Leaving off the seed doesn't fail silently, it changes the rules: `reduce` uses the array's **first element** as the initial accumulator and starts from the second one instead. That happens to give the right answer for summing numbers, which is exactly what makes it dangerous — try it on an **empty array** with no seed and it throws `TypeError: Reduce of empty array with no initial value`. Always pass one explicitly.",
    },
  ];
}
