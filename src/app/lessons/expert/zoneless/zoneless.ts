import { Component, afterRenderEffect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: zoneless Angular — what Zone.js actually did, what schedules change
 * detection without it, LIVE proofs (this very app runs zoneless), write
 * coalescing, the migration checklist, and the interop escape hatches.
 */
@Component({
  selector: 'app-lesson-zoneless',
  imports: [RouterLink],
  styleUrl: './zoneless.css',
  templateUrl: './zoneless.html',
})
export class Zoneless {
  constructor() {
    afterRenderEffect(() => this.renderCount.update((n) => n + 1));
  }

  /**
   * A plain field, written by a `setTimeout`. In a zoneless app nothing notices,
   * which is the demo.
   */
  protected plainValue = '—';
  /**
   * A signal written the same way. This one does update the view.
   */
  protected readonly signalValue = signal('—');
  /**
   * Clicks on the plain-field button. Also plain, so also invisible until
   * something else forces a pass.
   */
  protected plainClicks = 0;

  /**
   * First of three signals written together.
   */
  protected readonly a = signal(0);
  /**
   * Second of three.
   */
  protected readonly b = signal(0);
  /**
   * Third of three.
   */
  protected readonly c = signal(0);
  /**
   * How many render passes have reached this view.
   *
   * Incremented from `afterRenderEffect` rather than a template getter — a
   * getter that mutates on read is guaranteed to disagree with itself on dev
   * mode's double-read verify pass, throwing NG0100 (see
   * `expert/change-detection`'s `passes` field for the full story).
   * `afterRenderEffect` runs once per application render, strictly after the
   * verify window.
   */
  protected readonly renderCount = signal(0);

  /**
   * Sequence number for plain writes, so each one is distinguishable.
   */
  private plainN = 0;
  /**
   * Sequence number for signal writes.
   */
  private signalN = 0;

  /**
   * Writes a plain field from a `setTimeout`.
   *
   * The assignment genuinely happens — the field really does hold the new value.
   * Without zone.js patching `setTimeout`, though, nothing tells Angular to check,
   * so the screen keeps showing the old one. "The value is wrong" and "nobody
   * looked" are different bugs, and this is the second.
   */
  protected timeoutPlain(): void {
    setTimeout(() => {
      // really assigns — but in a zoneless app nobody schedules a pass
      this.plainValue = `write #${++this.plainN} (invisible until the next pass)`;
    }, 300);
  }

  /**
   * Writes a signal from a `setTimeout`. The signal notifies the scheduler itself,
   * so no zone is needed.
   */
  protected timeoutSignal(): void {
    setTimeout(() => {
      this.signalValue.set(`write #${++this.signalN}`);
    }, 300);
  }

  /**
   * Writes three signals in a row.
   *
   * The render counter goes up by one, not three: the scheduler coalesces
   * notifications into a single pass at the end of the microtask. Batching is a
   * property of the scheduler, not something you have to arrange.
   */
  protected writeAllThree(): void {
    this.a.update((v) => v + 1);
    this.b.update((v) => v + 1);
    this.c.update((v) => v + 1);
    // three notifications → one coalesced render pass (watch the counter)
  }

  /**
   * Sample: how the zone era worked — zone.js monkey-patching every async API so
   * Angular could know when something might have changed.
   */
  readonly zoneEraSample = `// how zone-era Angular knew when to render:
// 1. zone.js patches the async API
window.setTimeout = zonePatched(setTimeout);
// 2. your callback runs inside the zone
// 3. the zone reports "microtasks drained"
ngZone.onMicrotaskEmpty.subscribe(() => appRef.tick());  // check EVERYTHING`;

  /**
   * Sample: enabling zoneless, and removing the zone.js polyfill.
   */
  readonly enableSample = `// New apps (Angular 20+ CLI): zoneless is the default — nothing to add.

// Migrating an existing zone app:
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};

// angular.json — the actual bundle savings:
// "polyfills": []        ← was ["zone.js"]`;

  /**
   * Sample: the scheduler every trigger funnels into.
   */
  readonly schedulerSample = `// every trigger funnels into one scheduler:
signal.set(v)        ─┐
(click) handler       ├─► ChangeDetectionScheduler.notify()
markForCheck()        │      └─ tick already pending? absorb.
input binding write  ─┘         else: schedule appRef.tick()

// the pass itself is unchanged: root → leaves,
// clean OnPush subtrees pruned, signal-dirty views refreshed`;

  /**
   * Sample: testing. `fakeAsync` and `tick` give way to `await fixture.whenStable()`
   * once there is no zone to fake.
   */
  readonly testingSample = `// zone era:
it('updates', fakeAsync(() => {
  component.load();
  tick(300);                    // zone-powered virtual time
  fixture.detectChanges();
}));

// zoneless:
it('updates', async () => {
  component.load();
  await fixture.whenStable();   // real async, same notifications as prod
  expect(el.textContent).toContain('loaded');
});`;
}
