import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Lesson: Promises & async/await — the three promise states and what await
 * desugars to, microtask vs macrotask ordering with a live log demo, error
 * handling including the return-await subtlety, all four combinators with
 * their failure semantics, a live sequential-vs-parallel timing race, and the
 * Promise/Observable bridge Angular code crosses daily.
 */
@Component({
  selector: 'app-lesson-ts-async',
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './async.html',
  styleUrl: './async.css',
})
export class Async {
  /**
   * The microtask-starvation puzzle used by the ask-before-telling block.
   *
   * A microtask that re-schedules itself forever means the microtask queue
   * never fully drains — and the engine only reaches a macrotask (the timer)
   * once that queue is empty. The timer isn't slow here; it's starved.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly microtaskStarvationSample = `function loop() {
  Promise.resolve().then(loop);   // schedules ANOTHER microtask, forever
}
loop();

setTimeout(() => console.log('does this ever run?'), 0);`;

  /**
   * The self-test, on when a Promise's executor actually runs. Every wrong
   * answer imagines Promises behave like the lazy Observables discussed later
   * on the page, rather than the eager machine this lesson opens with.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: "Immediately — 'X' logs the instant new Promise(...) executes, before .then is ever attached, and even if .then is never called at all.",
      correct: true,
      why: "Promises are eager: the executor function is called synchronously as part of constructing the Promise. Attaching .then only schedules what happens with the RESULT later — it has no bearing on when the executor itself runs. That's the opposite of an Observable, whose producer function doesn't run until something subscribes.",
    },
    {
      text: "Not until p.then(...) is called — the executor waits for a subscriber the same way an Observable's producer does.",
      why: "This is exactly the Observable behavior, and Promises don't share it. A Promise's executor has already run to completion (or started running) by the time new Promise(...) returns — there's no 'waiting for someone to listen' step.",
    },
    {
      text: "It depends on whether resolve(1) is called synchronously inside the executor — if it were async, 'X' would wait too.",
      why: "The executor body always runs synchronously and immediately, regardless of when resolve is eventually called. 'X' logs right away either way; only the .then callback's timing depends on when/if resolve fires.",
    },
    {
      text: 'Only on the next microtask tick, since all Promise-related code is queued as a microtask.',
      why: 'Microtask scheduling applies to .then/.catch/.finally CALLBACKS reacting to a settled promise — not to the executor function itself, which runs synchronously during construction, not as a queued microtask.',
    },
  ];

  /**
   * Whether the await demo is running, for the button's disabled state.
   */
  protected readonly busy = signal(false);
  /**
   * The await demo's output.
   */
  protected readonly result = signal('idle');

  /**
   * The execution-order log, appended to as each callback fires.
   */
  protected readonly orderLog = signal<string[]>([]);

  /**
   * Whether the sequential-vs-parallel race is running.
   */
  protected readonly racing = signal(false);
  /**
   * Elapsed time for the sequential run.
   */
  protected readonly seqTime = signal('—');
  /**
   * Elapsed time for the parallel run — the number the demo exists to contrast.
   */
  protected readonly parTime = signal('—');

  /**
   * Runs the basic `await` demo: shows the loading state, waits, then shows the
   * result.
   */
  protected async run() {
    this.busy.set(true);
    this.result.set('loading…');
    await wait(900);
    this.result.set('✅ resolved after 900ms');
    this.busy.set(false);
  }

  /**
   * Runs the execution-order demo, logging synchronous code, a resolved promise's
   * `.then`, and a zero-delay `setTimeout` in the order they actually fire.
   *
   * The result is the microtask/macrotask distinction made visible: the promise
   * callback runs before the timer even though the timer was scheduled for `0`.
   */
  protected runOrder() {
    this.orderLog.set([]);
    const log = (line: string) => this.orderLog.update((l) => [...l, line]);
    log('1: sync');
    setTimeout(() => log('4: macrotask (timer)'));
    Promise.resolve().then(() => log('3: microtask'));
    log('2: sync');
  }

  /**
   * Races two `await` strategies over the same work: sequential `await`s against
   * `Promise.all`.
   *
   * The point is that `await` in a loop is *not* how you do concurrent work —
   * sequential awaits add up, `Promise.all` overlaps them — and the two timings
   * printed side by side make the cost concrete.
   */
  protected async raceStrategies() {
    this.racing.set(true);
    this.seqTime.set('running…');
    this.parTime.set('…');

    const t0 = performance.now();
    await wait(400);
    await wait(400);
    await wait(400);
    this.seqTime.set(`${Math.round(performance.now() - t0)}ms`);

    const t1 = performance.now();
    await Promise.all([wait(400), wait(400), wait(400)]);
    this.parTime.set(`${Math.round(performance.now() - t1)}ms`);
    this.racing.set(false);
  }
}
