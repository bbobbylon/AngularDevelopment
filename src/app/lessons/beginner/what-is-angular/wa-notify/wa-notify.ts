import { Component, signal } from '@angular/core';

/**
 * Live demo #3 — the trap the lesson's "ask before telling" question is built
 * on: a value that genuinely changes in memory, right next to one Angular can
 * actually see change.
 *
 * `signalVal` is a signal bumped by a click — Angular notices the read inside
 * the template and repaints the instant it changes, exactly like the counter
 * above it on the page. `plainVal` is an ordinary field mutated from inside a
 * `setTimeout` — no click handler is running when that happens, and nothing
 * about a plain field can tell Angular "look again". Both numbers are correct
 * in memory the whole time; only one of them ever gets announced.
 */
@Component({
  selector: 'app-wa-notify',
  templateUrl: './wa-notify.html',
  styleUrl: './wa-notify.css',
})
export class WaNotify {
  /** A signal. Reading it inside the template is what makes it visible. */
  readonly signalVal = signal(0);

  /** A plain field holding the same kind of number. Writes to it are invisible. */
  protected plainVal = 0;

  /** Bumps the signal. Angular repaints immediately — the "normal" case. */
  protected bumpSignal(): void {
    this.signalVal.update((n) => n + 1);
  }

  /**
   * Mutates {@link plainVal} from inside a `setTimeout` — asynchronously, with
   * no click handler running and no signal involved, so nothing notifies
   * Angular that a check is needed.
   */
  protected mutatePlain(): void {
    setTimeout(() => {
      this.plainVal++;
    }, 600);
  }

  /**
   * Does nothing at all, deliberately.
   *
   * Clicking still fires a real event listener, and every template event
   * listener causes Angular to schedule a check whether or not the handler
   * changed anything — it cannot know in advance that this one won't. That
   * check is what finally notices {@link plainVal}'s new number.
   */
  protected nudge(): void {}
}
