import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

// ── OnPush demo child — only re-checks when inputs change or markForCheck() ──

@Component({
  selector: 'app-onpush-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="onpush-box">
      <div class="onpush-box__label">OnPush child</div>
      <div class="onpush-box__checks">template checks: {{ checks() }}</div>
      <div class="onpush-box__value">value input: <strong>{{ value() }}</strong></div>
    </div>
  `,
  styles: [`
    .onpush-box { border: 2px solid #7c3aed; border-radius: 10px; padding: 12px 16px; font-size: .88rem; }
    .onpush-box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .07em; color: #7c3aed; margin-bottom: 6px; }
    .onpush-box__checks { color: var(--text-muted); margin-bottom: 4px; }
    .onpush-box__value strong { color: var(--accent); }
  `],
})
export class OnPushChild {
  private ticks = 0;
  protected value = signal(0);

  private readonly cdr = inject(ChangeDetectorRef);

  // Increment value so the parent can drive it
  updateValue(n: number): void {
    this.value.set(n);
    // For a non-signal update: cdr.markForCheck() would be needed
  }

  protected checks(): number { return ++this.ticks; }
}

// ── Default (CheckAlways) child ──────────────────────────────────────────────

@Component({
  selector: 'app-default-child',
  standalone: true,
  // No changeDetection: ChangeDetectionStrategy.OnPush = Default = CheckAlways
  template: `
    <div class="default-box">
      <div class="default-box__label">Default (CheckAlways) child</div>
      <div class="default-box__checks">template checks: {{ checks() }}</div>
    </div>
  `,
  styles: [`
    .default-box { border: 2px solid var(--accent); border-radius: 10px; padding: 12px 16px; font-size: .88rem; }
    .default-box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .07em; color: var(--accent); margin-bottom: 6px; }
    .default-box__checks { color: var(--text-muted); }
  `],
})
export class DefaultChild {
  private ticks = 0;
  protected checks(): number { return ++this.ticks; }
}

// ── Main lesson component ─────────────────────────────────────────────────────

@Component({
  selector: 'app-lesson-change-detection',
  standalone: true,
  imports: [RouterLink, OnPushChild, DefaultChild],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>Change Detection Deep Dive</h1>
      <p class="lead">
        Change detection (CD) is Angular's mechanism for keeping the DOM in sync with
        component state. Every button click, timer, or HTTP response can trigger a
        top-down tree traversal that re-evaluates every template binding.
        Understanding <em>when</em> that tree runs — and how to short-circuit it —
        is the foundation of Angular performance optimisation.
      </p>

      <h2>What triggers a CD pass</h2>
      <div class="code"><pre>// Zone.js monkey-patches async APIs and notifies Angular after each one:
click / input / submit ──┐
setTimeout / setInterval  ├──▶ Zone.js ──▶ ApplicationRef.tick() ──▶ full tree CD
Promise.then / XHR/fetch ─┘</pre></div>
      <p>
        By default every component in the tree is checked on <em>every</em> pass,
        top-down. Each binding does a reference/identity comparison against the
        previous value — <code>===</code> for primitives, pointer equality for objects.
      </p>

      <h2>Demo 1 — observe the full-tree default</h2>
      <div class="demo">
        <p class="demo__title">Live — "template checks" ticks every CD pass, even on noops</p>
        <div class="row" style="margin-bottom:10px">
          <span class="pill">passes this lesson has run: {{ renderTick }}</span>
          <span class="pill">signal count: {{ count() }}</span>
        </div>
        <div class="row">
          <button (click)="count.update(c => c + 1)">Increment signal</button>
          <button class="ghost" (click)="noop()">No-op click (still triggers CD!)</button>
        </div>
        <p style="margin-top:10px;font-size:.85rem;color:var(--text-muted)">
          The no-op button fires an event → Zone.js sees it → Angular runs a full CD
          pass anyway. The tick counter goes up each time.
        </p>
      </div>

      <div class="warn">
        <strong>Never call expensive functions in template bindings.</strong>
        <code>{{ '{{' }} expensiveSort(list) {{ '}}' }}</code> runs on <em>every</em> CD pass —
        often 60+ times per second. Use <code>computed()</code> signals or <code>pipe: pure</code>
        to memoize the result.
      </div>

      <h2>OnPush — skip subtrees that can't have changed</h2>
      <p>
        <code>ChangeDetectionStrategy.OnPush</code> tells Angular: "Only check this
        component (and its children) if one of these conditions is true:"
      </p>
      <table class="t">
        <thead><tr><th>Condition</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td>An <code>input()</code> reference changed</td><td>Parent passes a new object</td></tr>
          <tr><td>An event originated inside this component</td><td>Button click inside the OnPush subtree</td></tr>
          <tr><td><code>cdr.markForCheck()</code> was called</td><td>After an async update outside the component</td></tr>
          <tr><td>A signal the template reads was updated</td><td><code>count.set(1)</code> in a service</td></tr>
        </tbody>
      </table>
      <div class="code"><pre>&#64;Component(&#123;
  changeDetection: ChangeDetectionStrategy.OnPush,
  // …
&#125;)
export class MyComponent &#123;
  // signal inputs and signals in the template are auto-tracked
  // — no markForCheck() needed for signal-based state.
  readonly count = signal(0);
&#125;</pre></div>

      <h2>Demo 2 — OnPush vs Default side-by-side</h2>
      <p>
        Click the parent-level buttons. Watch how the Default child is checked on every
        pass; the OnPush child only re-renders when its input signal actually changes.
      </p>
      <div class="demo">
        <p class="demo__title">Live — both children are in the tree; count their CD checks</p>
        <div class="row" style="margin-bottom:14px;flex-wrap:wrap">
          <button (click)="noop()">No-op click (parent event)</button>
          <button (click)="onPushValue.update(v => v + 1)">
            Update OnPush input → {{ onPushValue() }}
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <app-default-child />
          <app-onpush-child />
        </div>
        <p style="margin-top:10px;font-size:.84rem;color:var(--text-muted)">
          The Default child checks on every click. The OnPush child only checks when
          "Update OnPush input" is clicked (or when the signal inside it changes).
        </p>
      </div>

      <h2>Signals bypass Zone entirely</h2>
      <p>
        Signals don't need Zone.js to schedule updates. When a signal in a template
        changes, Angular marks <em>just that view</em> dirty and re-renders only it
        during the next microtask flush — no full-tree traversal.
      </p>
      <div class="code"><pre>// Zoneless app (Angular 18+):
// provideExperimentalZonelessChangeDetection()
//
// Signal update ──▶ Angular marks affected view dirty
//               ──▶ scheduleIfIdle / scheduleIfNeeded
//               ──▶ only dirty views re-render
//
// No Zone.js patch, no full tree walk, no setTimeout monkey-patch.</pre></div>

      <h2>Demo 3 — signal update vs plain mutation</h2>
      <div class="demo">
        <p class="demo__title">Live — see why mutation does NOT trigger a re-render</p>
        <div class="row" style="margin-bottom:10px">
          <button (click)="sigVal.update(v => v + 1)">Signal: sigVal.update()</button>
          <button class="ghost" (click)="mutatePlain()">Mutate plain field (then click noop to see)</button>
          <button class="ghost" (click)="noop()">No-op (triggers CD)</button>
        </div>
        <div class="row">
          <span class="pill">signal: {{ sigVal() }}</span>
          <span class="pill">plain field: {{ plainVal }}</span>
        </div>
        <p style="margin-top:8px;font-size:.84rem;color:var(--text-muted)">
          The plain field mutation won't show until the next CD pass (the no-op click).
          The signal update is reflected immediately.
        </p>
      </div>

      <h2>ChangeDetectorRef API</h2>
      <div class="code"><pre>private readonly cdr = inject(ChangeDetectorRef);

cdr.markForCheck();    // OnPush: mark this view dirty for the next pass
cdr.detectChanges();   // Check this view + children right now (synchronous)
cdr.detach();          // Remove this view from CD — you drive updates manually
cdr.reattach();        // Put it back in the tree
inject(ApplicationRef).tick(); // Full app-wide CD pass</pre></div>

      <div class="tip">
        <strong>Signals + OnPush = best-of-both:</strong> use OnPush everywhere to opt
        out of the full-tree scan, and let signal dependencies drive fine-grained
        targeted updates. You get minimal re-renders without writing a single
        <code>markForCheck()</code>.
      </div>
      <div class="note">
        <strong>Rule of thumb:</strong> start with <code>OnPush</code> on every new
        component. Only drop back to Default when third-party code mutates state outside
        Angular's signal/input system and you can't refactor it.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>Default CD checks the entire tree on every Zone.js-observed async event — including no-ops.</li>
        <li><code>OnPush</code> skips a subtree unless an input changed, a child event fired, or <code>markForCheck()</code> was called.</li>
        <li>Signals are automatically tracked; updating one schedules only the affected views, no Zone interaction needed.</li>
        <li>Avoid expensive template expressions — they run on every CD pass.</li>
        <li>Combine <code>OnPush</code> with signals for the most efficient update strategy with no manual bookkeeping.</li>
      </ul>

      <p><a routerLink="/dynamic-components">Next: Dynamic Components →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
  `],
})
export class ChangeDetection {
  private ticks = 0;
  protected readonly count = signal(0);
  protected readonly onPushValue = signal(0);
  protected readonly sigVal = signal(0);
  protected plainVal = 0;

  protected get renderTick(): number { return ++this.ticks; }
  protected noop(): void {}
  protected mutatePlain(): void { this.plainVal++; }
}
