import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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

/**
 * Lesson: Decisions & loops — if/else mechanics, truthiness, the three-part
 * anatomy of a for loop (traced live), for...of, while, break/continue,
 * map/filter/reduce with a live pipeline, and how all of this maps onto
 * Angular's @if/@for template syntax later.
 */
@Component({
  selector: 'app-lesson-decisions-loops',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './decisions-loops.html',
  styleUrl: './decisions-loops.css',
})
export class DecisionsLoops {
  /**
   * The zero-discount truthiness puzzle used by the ask-before-telling block.
   *
   * A user who enters a real (if unhelpful) 0%-off code is told the exact
   * opposite of what happened — because `0` is falsy, `if (discountPercent)`
   * can't tell "no code entered" apart from "a code worth nothing was entered".
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly zeroDiscountSample = `function describeDiscount(discountPercent) {
  if (discountPercent) {
    return \`\${discountPercent}% off applied!\`;
  }
  return 'No discount code entered';
}

// the user DID enter a real code — it just happens to be worth 0%
console.log(describeDiscount(0));`;

  /**
   * The self-test, on whether map/filter chain order affects the result. Every
   * wrong answer assumes the two operations commute, when doubling-then-filtering
   * changes WHICH values even reach the filter.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'No — they give different results. map-then-filter doubles everything FIRST, and doubling any integer always produces an even number, so the filter afterward keeps all six: [2,4,6,8,10,12]. filter-then-map keeps only the originally-even numbers first, then doubles just those three: [4,8,12].',
      correct: true,
      why: "This is 'each stage feeds the next' made concrete: filter's job is to look at whatever array the PREVIOUS stage produced, not the original one. Doubling every number before filtering destroys the very distinction (even vs odd) the filter was trying to use, because every doubled number is even.",
    },
    {
      text: 'Yes — map and filter are commutative, so applying them in either order over the same array always produces the same set of values.',
      why: "They're not commutative in general. Swapping the order can change which values ever reach the later stage — exactly what happens here, since map's transformation (doubling) changes which numbers count as even.",
    },
    {
      text: 'Yes, both produce [4, 8, 12] — filter always evaluates against the ORIGINAL array nums, regardless of where it sits in the chain.',
      why: 'Each array method receives whatever the previous method in the chain returned, not the original array. A filter placed after a map is testing the MAPPED values, not the source data.',
    },
    {
      text: 'No, but only because a reduce step is missing — adding .reduce((s, n) => s + n, 0) to the end of both chains would make them produce the same final result.',
      why: "Reducing both arrays to a sum doesn't make the underlying difference disappear — [2,4,6,8,10,12] and [4,8,12] sum to different totals (42 vs 24), so the reduce step would still expose the order-dependence, not erase it.",
    },
  ];

  /**
   * The age in the `if`/`else` demo.
   */
  protected readonly age = signal(20);
  /**
   * The branch the current age takes.
   */
  protected readonly voteMessage = computed(() =>
    this.age() >= 18 ? 'You can vote 🗳️' : 'Too young to vote',
  );

  /**
   * The loop walkthrough frames.
   */
  protected readonly frames = LOOP_FRAMES;
  /**
   * Which frame the walkthrough is on.
   */
  protected readonly frame = signal(0);
  /**
   * Advances a frame, stopping at the last.
   */
  protected frameFwd() {
    this.frame.update((f) => Math.min(f + 1, this.frames.length - 1));
  }
  /**
   * Steps back a frame, stopping at the first.
   */
  protected frameBack() {
    this.frame.update((f) => Math.max(f - 1, 0));
  }

  /**
   * The input array for the array-method pipeline demo.
   */
  protected readonly nums = [1, 2, 3, 4, 5, 6, 7, 8];
  /**
   * Whether `filter` is in the pipeline.
   */
  protected readonly useFilter = signal(true);
  /**
   * Whether `map` is in the pipeline.
   */
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
}
