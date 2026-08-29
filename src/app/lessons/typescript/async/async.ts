import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink],
  templateUrl: './async.html',
  styleUrl: './async.css',
})
export class Async {
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
