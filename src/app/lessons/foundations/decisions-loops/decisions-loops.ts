import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  { phase: '① init', i: '0', test: '—', output: [], note: 'Runs ONCE before anything: create the counter box i = 0.' },
  { phase: '② test', i: '0', test: '0 < 3 → true', output: [], note: 'Before every lap: is the condition still true? Yes → enter the body.' },
  { phase: '③ body', i: '0', test: '—', output: ['Hello 0'], note: 'Run the code between the braces with the current i.' },
  { phase: '④ step', i: '1', test: '—', output: ['Hello 0'], note: 'After the body: i++ bumps the counter to 1. Back to the test.' },
  { phase: '② test', i: '1', test: '1 < 3 → true', output: ['Hello 0'], note: 'Still true → another lap.' },
  { phase: '③ body', i: '1', test: '—', output: ['Hello 0', 'Hello 1'], note: 'Body runs again, this time i is 1.' },
  { phase: '④ step', i: '2', test: '—', output: ['Hello 0', 'Hello 1'], note: 'i++ → 2. Back to the test.' },
  { phase: '② test', i: '2', test: '2 < 3 → true', output: ['Hello 0', 'Hello 1'], note: 'True one last time.' },
  { phase: '③ body', i: '2', test: '—', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'Third and final body run.' },
  { phase: '④ step', i: '3', test: '—', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'i++ → 3.' },
  { phase: '② test', i: '3', test: '3 < 3 → FALSE', output: ['Hello 0', 'Hello 1', 'Hello 2'], note: 'The test finally fails → the loop ends. Execution continues after the closing brace. Total: 3 laps, and i ended at 3, not 2.' },
];

/**
 * Lesson: Decisions & loops — if/else mechanics, truthiness, the three-part
 * anatomy of a for loop (traced live), for...of, while, break/continue,
 * map/filter/reduce with a live pipeline, and how all of this maps onto
 * Angular's @if/@for template syntax later.
 */
@Component({
  selector: 'app-lesson-decisions-loops',
  imports: [RouterLink],
  templateUrl: './decisions-loops.html',
  styleUrl: './decisions-loops.css',
})
export class DecisionsLoops {
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
