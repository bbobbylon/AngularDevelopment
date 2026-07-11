import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: change detection deep dive — what a CD pass actually is (LView,
 * binding slots, === comparison), what schedules one (zone era vs zoneless),
 * Default vs OnPush proven side-by-side with live check counters, signals'
 * targeted marking, detach/reattach, and NG0100 (ExpressionChanged…).
 */

// ── OnPush demo child — re-checks only when its input changes / it's marked ──

@Component({
  selector: 'app-cd-onpush-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box box--violet">
      <div class="box__label">OnPush child</div>
      <div class="box__checks">template checks: {{ checks }}</div>
      <div>value input: <strong>{{ value() }}</strong></div>
    </div>
  `,
  styles: [`
    .box { border: 2px solid #7c3aed; border-radius: 10px; padding: 12px 16px; font-size: .88rem; }
    .box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .07em; color: #7c3aed; margin-bottom: 6px; }
    .box__checks { color: var(--text-muted); margin-bottom: 4px; }
  `],
})
export class OnPushChild {
  /** A real input this time — the parent binding is what marks this view dirty. */
  readonly value = input(0);
  private ticks = 0;
  protected get checks(): number {
    return ++this.ticks;
  }
}

// ── Default (CheckAlways) child ──────────────────────────────────────────────

@Component({
  selector: 'app-cd-default-child',
  // No changeDetection set → Default = CheckAlways
  template: `
    <div class="box">
      <div class="box__label">Default (CheckAlways) child</div>
      <div class="box__checks">template checks: {{ checks }}</div>
    </div>
  `,
  styles: [`
    .box { border: 2px solid var(--accent); border-radius: 10px; padding: 12px 16px; font-size: .88rem; }
    .box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .07em; color: var(--accent); margin-bottom: 6px; }
    .box__checks { color: var(--text-muted); }
  `],
})
export class DefaultChild {
  private ticks = 0;
  protected get checks(): number {
    return ++this.ticks;
  }
}

// ── Detachable child — cdr.detach() removes it from the tree entirely ───────

@Component({
  selector: 'app-cd-detach-child',
  template: `
    <div class="box" [class.box--off]="detached">
      <div class="box__label">{{ detached ? 'DETACHED from the CD tree' : 'attached' }}</div>
      <div class="box__checks">template checks: {{ checks }}</div>
      <div>value input: <strong>{{ value() }}</strong></div>
    </div>
  `,
  styles: [`
    .box { border: 2px solid var(--green, #10b981); border-radius: 10px; padding: 12px 16px; font-size: .88rem; }
    .box--off { border-style: dashed; opacity: .75; }
    .box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .07em; color: var(--green, #10b981); margin-bottom: 6px; }
    .box__checks { color: var(--text-muted); margin-bottom: 4px; }
  `],
})
export class DetachChild {
  readonly value = input(0);
  protected detached = false;
  private readonly cdr = inject(ChangeDetectorRef);
  private ticks = 0;
  protected get checks(): number {
    return ++this.ticks;
  }

  toggle(): void {
    this.detached = !this.detached;
    if (this.detached) {
      this.cdr.detach(); // out of the tree — nothing re-checks this view anymore
    } else {
      this.cdr.reattach(); // back in — it catches up on the next pass
      this.cdr.markForCheck();
    }
  }
}

// ── Main lesson component ─────────────────────────────────────────────────────

@Component({
  selector: 'app-lesson-change-detection',
  imports: [RouterLink, OnPushChild, DefaultChild, DetachChild],
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>Change Detection Deep Dive</h1>
      <p class="lead">
        Change detection (CD) is how Angular keeps the DOM in sync with component
        state: a top-down traversal that re-evaluates template bindings and patches
        exactly the DOM nodes whose values changed. Mastering it means knowing three
        separate things — <strong>when a pass is scheduled</strong>,
        <strong>which views it refreshes</strong>, and <strong>what one refresh
        actually does</strong>. This page takes them in turn, with live counters.
      </p>

      <h2>What one "check" actually does — LView and binding slots</h2>
      <div class="code"><pre>{{ lviewSample }}</pre></div>
      <ul>
        <li>Each component instance owns an <strong>LView</strong> — an array holding its DOM nodes, binding values and state. The compiled template is a function run in two modes: <em>create</em> (build nodes once) and <em>update</em> (compare bindings).</li>
        <li>Checking a view = running the update mode: evaluate each binding expression, compare with the value stored in its slot using <code>===</code> (reference equality for objects — the root of every "mutation doesn't render" story), and touch the DOM <em>only</em> for slots that differ.</li>
        <li>So "change detection is slow" is really "my bindings are expensive": the diffing itself is a flat array walk. A getter or function call in a binding runs on <em>every</em> check — that's the cost center.</li>
      </ul>
      <div class="warn">
        <strong>Never call expensive functions in template bindings.</strong>
        <code>{{ '{{' }} expensiveSort(list) {{ '}}' }}</code> runs on every check of
        that view. Memoize with <code>computed()</code> (or a pure pipe) so the work
        reruns only when its inputs change.
      </div>

      <h2>When is a pass scheduled? Zone era vs today</h2>
      <div class="code"><pre>{{ schedulingSample }}</pre></div>
      <p>
        Zone-era Angular patched async APIs and ticked after <em>anything</em>
        happened. Modern (zoneless) Angular — which <strong>this app runs</strong> —
        schedules a pass only on explicit notifications: signal writes, template
        events, <code>markForCheck()</code>, input writes. The
        <a routerLink="/zoneless">zoneless lesson</a> drills the scheduling side; here
        we focus on the pass itself.
      </p>

      <h2>Demo 1 — every event schedules a pass, even a no-op</h2>
      <div class="demo">
        <p class="demo__title">Live — "passes" counts every check of this lesson's view</p>
        <div class="row" style="margin-bottom:10px">
          <span class="pill">passes this lesson has run: {{ renderTick }}</span>
          <span class="pill">signal count: {{ count() }}</span>
        </div>
        <div class="row">
          <button (click)="count.update(c => c + 1)">Increment signal</button>
          <button class="ghost" (click)="noop()">No-op click (still schedules a pass!)</button>
        </div>
        <p style="margin-top:10px;font-size:.85rem;color:var(--text-muted)">
          Angular can't know your handler changed nothing — every template event
          listener marks its view dirty and schedules a tick <em>before</em> your code
          runs. That's why cheap bindings matter: no-op passes are a fact of life.
        </p>
      </div>

      <h2>Which views refresh? Default vs OnPush</h2>
      <table class="t">
        <thead><tr><th>Condition that re-checks an OnPush view</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td>An input <em>reference</em> changed</td><td>parent binding passes a new value/object</td></tr>
          <tr><td>An event originated inside the component</td><td>button click inside the OnPush subtree</td></tr>
          <tr><td><code>cdr.markForCheck()</code> was called</td><td>async pipe emission, manual call after an external mutation</td></tr>
          <tr><td>A signal the template reads changed</td><td><code>count.set(1)</code> in a shared service</td></tr>
        </tbody>
      </table>

      <h2>Demo 2 — OnPush vs Default side-by-side</h2>
      <div class="demo">
        <p class="demo__title">Live — both children in the same tree; count their checks</p>
        <div class="row" style="margin-bottom:14px;flex-wrap:wrap">
          <button (click)="noop()">No-op click (parent event)</button>
          <button (click)="onPushValue.update(v => v + 1)">
            Update OnPush child's input → {{ onPushValue() }}
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <app-cd-default-child />
          <app-cd-onpush-child [value]="onPushValue()" />
        </div>
        <p style="margin-top:10px;font-size:.84rem;color:var(--text-muted)">
          Every click re-checks the Default child (its counter climbs on no-ops). The
          OnPush child's counter moves only when its <em>input actually changes</em> —
          the pass reaches it, sees no dirty flag and no new input, and prunes the
          subtree. The <a routerLink="/onpush">OnPush lesson</a> dissects all five
          re-check triggers with more live proofs.
        </p>
      </div>

      <h2>Signals — marking exactly the right views</h2>
      <div class="code"><pre>{{ signalsSample }}</pre></div>
      <p>
        A template that reads a signal registers the view as that signal's consumer.
        Writing the signal marks <em>those views</em> dirty directly — no guessing from
        the root, no manual bookkeeping. Combined with OnPush (or zoneless, where this
        is the native model), updates become nearly surgical.
      </p>

      <h2>Demo 3 — signal update vs plain mutation</h2>
      <div class="demo">
        <p class="demo__title">Live — why mutation does NOT render</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="sigVal.update(v => v + 1)">Signal: sigVal.update()</button>
          <button class="ghost" (click)="mutatePlain()">Mutate plain field silently</button>
          <button class="ghost" (click)="noop()">No-op (schedules a pass)</button>
        </div>
        <div class="row">
          <span class="pill">signal: {{ sigVal() }}</span>
          <span class="pill">plain field: {{ plainVal }}</span>
        </div>
        <p style="margin-top:8px;font-size:.84rem;color:var(--text-muted)">
          "Mutate plain field silently" uses <code>setTimeout</code>, so no event and
          no signal is involved — the number on screen goes stale until the next pass
          (click the no-op). The signal write both schedules the pass <em>and</em>
          marks this view. Two different jobs, one API.
        </p>
      </div>

      <h2>Demo 4 — detach: leaving the tree entirely</h2>
      <div class="demo">
        <p class="demo__title">Live — cdr.detach() vs the same input binding</p>
        <div class="row" style="margin-bottom:14px">
          <button (click)="detachValue.update(v => v + 1)">
            Update detachable child's input → {{ detachValue() }}
          </button>
          <button class="ghost" (click)="detachChildRef.toggle()">
            detach() / reattach()
          </button>
        </div>
        <app-cd-detach-child #detachChildRef [value]="detachValue()" />
        <p style="margin-top:10px;font-size:.84rem;color:var(--text-muted)">
          While detached, even a <em>changed input</em> renders nothing — the view is
          simply not part of any traversal. Reattaching (+ markForCheck) catches it up
          on the next pass. <code>detach()</code> is the nuclear option for
          extremely hot components (tickers, canvas overlays) where you re-render
          manually via <code>detectChanges()</code> on your own schedule.
        </p>
      </div>

      <h2>NG0100 — ExpressionChangedAfterItHasBeenChecked</h2>
      <div class="code"><pre>{{ ng0100Sample }}</pre></div>
      <p>
        In dev mode Angular runs every check <strong>twice</strong> and compares: if a
        binding produced a different value the second time, something mutated state
        <em>during</em> the pass — which means unidirectional data flow was violated
        (parent finished checking, then a child changed the parent's data mid-pass).
        Classic sources: a child constructor/<code>ngOnInit</code> writing to a parent
        via a service, <code>ngAfterViewInit</code> setting bound state, or impure
        getters returning new values each call. Fixes, in order of preference:
        restructure so data flows down (move the write to the right owner), make the
        state a <strong>signal</strong> (signals integrate with the pass and schedule a
        follow-up instead of corrupting the current one), or as a last resort defer the
        write (<code>afterNextRender</code> / <code>setTimeout</code>).
      </p>

      <h2>ChangeDetectorRef — the full API</h2>
      <div class="code"><pre>{{ cdrSample }}</pre></div>

      <h2>The strategy landscape</h2>
      <table class="cmp">
        <tr><th>Layer</th><th>Question it answers</th><th>Options</th></tr>
        <tr><td>Scheduling</td><td><em>when</em> does a pass run?</td><td>zone.js (any async) → zoneless (explicit notifications)</td></tr>
        <tr><td>Strategy</td><td><em>which subtrees</em> get refreshed?</td><td>Default (always) → OnPush (dirty/marked only)</td></tr>
        <tr><td>Reactivity</td><td><em>who gets marked</em> dirty?</td><td>manual (markForCheck/events) → signals (automatic, per-view)</td></tr>
      </table>
      <div class="tip">
        <strong>Signals + OnPush + zoneless = the modern stack:</strong> explicit
        scheduling, pruned traversal, per-view marking. Each layer composes with the
        others — and each has its own lesson in this app.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Walk through exactly what happens between a button click and the DOM updating.</summary>
        <div>The wrapped listener marks the component's view dirty (up the ancestor
        path) and notifies the scheduler → your handler runs → a tick starts at the
        root and walks down, refreshing Default views and dirty OnPush views → each
        refresh runs the template's update function, comparing each binding slot with
        <code>===</code> → only changed slots touch the DOM → lifecycle hooks
        (<code>ngAfterViewChecked</code> etc.) fire on the way out.</div>
      </details>
      <details class="qa">
        <summary>Why does Angular compare bindings with <code>===</code> instead of deep equality?</summary>
        <div>Cost and predictability: deep-comparing arbitrary object graphs on every
        check would be unbounded. Reference equality is O(1) per binding and pushes
        you toward immutable updates — replace, don't mutate — which is also what
        makes OnPush and signals reliable.</div>
      </details>
      <details class="qa">
        <summary>NG0100 appears only in dev builds. Is production safe then?</summary>
        <div>No — production skips the second verification check, so instead of an
        error you get a <em>silently stale or inconsistent UI</em> until the next
        pass. NG0100 is a gift: it points at a real unidirectional-data-flow
        violation that exists in prod too.</div>
      </details>
      <details class="qa">
        <summary>When is <code>cdr.detach()</code> the right tool, and what's the contract?</summary>
        <div>A component receiving extremely frequent updates (price ticker, mouse
        tracker) where rendering every change is wasteful. After detaching, Angular
        never checks the view; you re-render on your own cadence with
        <code>detectChanges()</code> (e.g. throttled). Contract: you own consistency
        now — forget to re-render and the view lies.</div>
      </details>
      <details class="qa">
        <summary>A getter in a template returns <code>new Date()</code>-based text. What breaks, and under which strategies?</summary>
        <div>Under Default it "works" but recomputes every pass (and can trigger
        NG0100 in dev since two consecutive checks differ). Under OnPush the value
        freezes — nothing marks the view when time passes. Correct: a signal updated
        by an interval, or a pure pipe over a changing input.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Three layers: scheduling (when), strategy (which subtrees), reactivity (who's marked). Don't blur them — exam questions target the seams.</li>
        <li>A check = run the template update function, <code>===</code> per binding slot, patch only changed slots. Expensive bindings, not the walk, are the cost.</li>
        <li>Default checks always; OnPush needs an input change, own event, markForCheck or signal — otherwise the subtree is pruned.</li>
        <li>Signals mark exactly the consuming views and schedule the pass — mutation without notification renders nothing (proven live).</li>
        <li><code>detach()</code>/<code>detectChanges()</code> hand you manual control; NG0100 means state changed mid-pass — fix the data flow, don't suppress the error.</li>
      </ul>

      <p><a routerLink="/dynamic-components">Next: Dynamic Components →</a></p>
    </article>
  `,
})
export class ChangeDetection {
  private ticks = 0;
  protected readonly count = signal(0);
  protected readonly onPushValue = signal(0);
  protected readonly detachValue = signal(0);
  protected readonly sigVal = signal(0);
  protected plainVal = 0;

  protected get renderTick(): number {
    return ++this.ticks;
  }
  protected noop(): void {}
  protected mutatePlain(): void {
    // async on purpose: no event, no signal → nothing schedules or marks
    setTimeout(() => this.plainVal++);
  }

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

  readonly schedulingSample = `// ZONE ERA — implicit:
click / setTimeout / fetch / Promise.then
  → zone.js notices the async work finished
  → onMicrotaskEmpty → ApplicationRef.tick()      // pass after ANYTHING

// ZONELESS (this app) — explicit:
signal.set(…) | (click) handler | markForCheck() | input binding write
  → ChangeDetectionScheduler.notify()             // coalesced
  → one tick                                       // pass only when TOLD`;

  readonly signalsSample = `// the view that renders {{ count() }} is registered as a consumer
readonly count = signal(0);

// this write does BOTH jobs:
this.count.set(1);
// 1. marks the consuming views dirty (not the whole tree)
// 2. notifies the scheduler that a pass is needed`;

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

  readonly cdrSample = `private readonly cdr = inject(ChangeDetectorRef);

cdr.markForCheck();    // flag this view + ancestor path for the NEXT pass
cdr.detectChanges();   // check this view + children synchronously NOW
cdr.detach();          // leave the CD tree — no pass touches this view
cdr.reattach();        // rejoin the tree
inject(ApplicationRef).tick();   // run a full top-down pass yourself`;
}
