import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Async — why the single thread can't wait, execution-order traced
 * live, callbacks → promises → async/await with each code block dissected,
 * promise states, parallel vs sequential awaits, and error handling. The
 * groundwork for HttpClient and Observables later.
 */
@Component({
  selector: 'app-lesson-async-basics',
  imports: [RouterLink],
  templateUrl: './async-basics.html',
  styleUrl: './async-basics.css',
})
export class AsyncBasics {
  /**
   * Where the fake request has got to, driving the demo's button and spinner.
   */
  protected readonly status = signal<'idle' | 'loading' | 'done'>('idle');
  /**
   * The fake request's result text.
   */
  protected readonly result = signal('');

  /**
   * The execution-order log — the A/C/B proof, appended to as each callback runs.
   */
  protected readonly orderLog = signal<string[]>([]);
  /**
   * Whether the ordering demo is mid-run, so it cannot be started twice.
   */
  protected readonly orderRunning = signal(false);

  /** The A/C/B execution-order proof — really uses setTimeout(…, 0). */
  protected runOrder() {
    this.orderRunning.set(true);
    this.orderLog.set([]);
    const log = (s: string) => this.orderLog.update((l) => [...l, s]);

    log(`console.log('A')  → A`);
    setTimeout(() => {
      log(`(the timer callback finally runs)  → B`);
      this.orderRunning.set(false);
    }, 0);
    log(`console.log('C')  → C   ← ran before B despite the 0ms delay`);
  }

  /**
   * Runs the fake request: sets `loading`, waits, then sets `done`.
   *
   * Deliberately `async`/`await` over a timer rather than a real fetch — the
   * lesson is about *when* code runs, and a real network call adds failure modes
   * that are a different lesson.
   */
  protected async load() {
    this.status.set('loading');
    this.result.set('');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    this.result.set('{ name: "Ada", role: "admin" }');
    this.status.set('done');
  }
}
