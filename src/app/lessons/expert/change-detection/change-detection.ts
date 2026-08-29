import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OnPushChild } from './on-push-child/on-push-child';
import { DefaultChild } from './default-child/default-child';
import { DetachChild } from './detach-child/detach-child';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: change detection deep dive — what a CD pass actually is (LView,
 * binding slots, === comparison), what schedules one (zone era vs zoneless),
 * Default vs OnPush proven side-by-side with live check counters, signals'
 * targeted marking, detach/reattach, and NG0100 (ExpressionChanged…).
 */
@Component({
  selector: 'app-lesson-change-detection',
  imports: [RouterLink, OnPushChild, DefaultChild, DetachChild],
  styleUrl: './change-detection.css',
  templateUrl: './change-detection.html',
})
export class ChangeDetection {
  /**
   * How many times the lesson component has been checked.
   */
  private ticks = 0;
  /**
   * A counter driving the demo.
   */
  protected readonly count = signal(0);
  /**
   * The value fed to the `OnPush` child.
   */
  protected readonly onPushValue = signal(0);
  /**
   * The value fed to the detachable child.
   */
  protected readonly detachValue = signal(0);
  /**
   * A signal value, for the signal-versus-plain-field comparison.
   */
  protected readonly sigVal = signal(0);
  /**
   * A plain field holding the equivalent value. Writes to it are invisible.
   */
  protected plainVal = 0;

  /**
   * The lesson component's own check count.
   */
  protected get renderTick(): number {
    return ++this.ticks;
  }
  /**
   * Does nothing, deliberately.
   *
   * Clicking it still triggers a change-detection pass — an event handler marks
   * its view dirty regardless of whether the handler changed anything. That is
   * why a button that does nothing still makes the counters move.
   */
  protected noop(): void {}
  /**
   * Mutates a plain field from a `setTimeout`.
   *
   * Asynchronous on purpose: no event to mark the view, no signal to notify the
   * scheduler. The field really changes; nothing renders it.
   */
  protected mutatePlain(): void {
    // async on purpose: no event, no signal → nothing schedules or marks
    setTimeout(() => this.plainVal++);
  }

  /**
   * Sample: what the compiler turns a template into — one function with a create
   * pass and an update pass, plus the binding slots it compares against.
   */
  readonly lviewSample = `// compiled template = one function, two modes (conceptually):
function Counter_Template(rf: RenderFlags, ctx: Counter) {
  if (rf & RenderFlags.Create) {          // once: build DOM, allot binding slots
    ɵɵelementStart(0, 'p');
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & RenderFlags.Update) {          // every check of this view:
    ɵɵadvance(1);
    ɵɵtextInterpolate1('Count: ', ctx.count(), '');
    // compares against the previous value in this LView slot (===)
    // → touches the DOM only if different
  }
}`;

  /**
   * Sample: scheduling, zone era against signal era.
   */
  readonly schedulingSample = `// ZONE ERA — implicit:
click / setTimeout / fetch / Promise.then
  → zone.js notices the async work finished
  → onMicrotaskEmpty → ApplicationRef.tick()      // pass after ANYTHING

// ZONELESS (this app) — explicit:
signal.set(…) | (click) handler | markForCheck() | input binding write
  → ChangeDetectionScheduler.notify()             // coalesced
  → one tick                                       // pass only when TOLD`;

  /**
   * Sample: how a signal read inside a template registers that view as a consumer,
   * which is what makes a signal write able to mark exactly the right views.
   */
  readonly signalsSample = `// the view that renders {{ count() }} is registered as a consumer
readonly count = signal(0);

// this write does BOTH jobs:
this.count.set(1);
// 1. marks the consuming views dirty (not the whole tree)
// 2. notifies the scheduler that a pass is needed`;

  /**
   * Sample: NG0100 — `ExpressionChangedAfterItHasBeenCheckedError`. Dev mode runs
   * every pass twice and compares, so a binding that changes as a side effect of
   * being read is caught rather than left as a mystery.
   */
  readonly ng0100Sample = `// dev mode: every pass runs twice — check, then VERIFY nothing moved
Parent template binds:   <app-child [label]="title" />

// child violates one-way data flow:
ngOnInit() {
  this.parentState.title = 'changed!';   // parent was ALREADY checked this pass
}
// → second (verify) run sees a different value → NG0100

// fixes, best first:
// 1. move the write to the owner (data flows down, events flow up)
// 2. make it a signal — the write schedules a NEXT pass instead
// 3. last resort: afterNextRender(() => …) to defer past the pass`;

  /**
   * Sample: the `ChangeDetectorRef` API — `markForCheck`, `detectChanges`,
   * `detach`, `reattach` — and which direction through the tree each one goes.
   */
  readonly cdrSample = `private readonly cdr = inject(ChangeDetectorRef);

cdr.markForCheck();    // flag this view + ancestor path for the NEXT pass
cdr.detectChanges();   // check this view + children synchronously NOW
cdr.detach();          // leave the CD tree — no pass touches this view
cdr.reattach();        // rejoin the tree
inject(ApplicationRef).tick();   // run a full top-down pass yourself`;
}
