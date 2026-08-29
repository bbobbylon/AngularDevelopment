import { Component, afterEveryRender, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Interpolation & template expressions — the {{ }} syntax, what kinds
 * of expressions are legal inside it, a live proof that a template method
 * call re-runs every check while computed() memoizes, null/undefined
 * handling with safe navigation, the [object Object] pitfall, and what the
 * Angular compiler actually generates for an interpolated text node.
 */
@Component({
  selector: 'app-lesson-interpolation',
  imports: [RouterLink],
  styleUrl: './interpolation.css',
  templateUrl: './interpolation.html',
})
export class Interpolation {
  /**
   * First name for the string-expression demo.
   */
  protected readonly first = signal('Grace');
  /**
   * Last name for the string-expression demo.
   */
  protected readonly last = signal('Hopper');
  /**
   * A number for the arithmetic and ternary demos.
   */
  protected readonly count = signal(3);

  /**
   * Squares a number, called straight from the template.
   *
   * Exists so the lesson can point at what that costs: see {@link noisyDouble}.
   *
   * @param n The input.
   */
  protected square(n: number): number {
    return n * n;
  }

  // ---- Live proof: computed() memoizes, a plain method call in a template does not ----
  /**
   * The input to both halves of the method-vs-`computed` demo.
   */
  protected readonly seed = signal(2);
  /**
   * An **unrelated** signal, changed by a button that touches nothing the demo
   * reads.
   *
   * It is the control in the experiment: bumping it must not change either
   * result, so any re-execution it causes is pure waste — which is exactly what
   * the method-call counter goes on to show.
   */
  protected readonly unrelatedTick = signal(0);

  /** Plain (non-signal) counter — safe to mutate for demo instrumentation; it notifies nobody. */
  protected noisyRuns = 0;
  /**
   * What the template actually shows. Angular's dev-mode double-check re-invokes
   * `noisyDouble()` a second time within the same tick (to verify nothing changed), so
   * `noisyRuns` itself is already one increment ahead of what the first pass rendered by the
   * time that second pass re-reads it — binding straight to `noisyRuns` would make the two
   * passes disagree and throw ExpressionChangedAfterItHasBeenCheckedError. Snapshotting it
   * once per full render (below, via `afterEveryRender`) keeps it stable for the whole tick.
   */
  protected noisyRunsDisplay = 0;
  /** Called directly from the template; re-executes on every change-detection pass that reaches it. */
  protected noisyDouble(): number {
    this.noisyRuns++;
    return this.seed() * 2;
  }

  /**
   * Snapshots the method-call counter once per render.
   *
   * The display value cannot be bound directly: dev mode runs change detection a
   * second time to verify nothing changed, which calls {@link noisyDouble} again
   * and leaves the counter one ahead of what the first pass rendered. The two
   * passes would then disagree and Angular would throw
   * `ExpressionChangedAfterItHasBeenCheckedError` — the demo's instrumentation
   * causing the very bug the demo is not about.
   */
  constructor() {
    afterEveryRender(() => { this.noisyRunsDisplay = this.noisyRuns; });
  }

  /**
   * How many times the `computed` has actually recomputed.
   *
   * The number to compare against the method's counter: the method's climbs on
   * every change-detection pass, this one only when {@link seed} changes.
   */
  protected computedRuns = 0;
  /**
   * computed() tracks exactly which signals were read on its last run (here, only
   * seed()) and only re-invokes this callback when one of them actually changed.
   */
  protected readonly computedDouble = computed(() => {
    this.computedRuns++;
    return this.seed() * 2;
  });

  /**
   * Bumps the input both halves of the demo depend on. Both counters advance.
   */
  protected bumpSeed(): void {
    this.seed.update((v) => v + 1);
  }

  /**
   * Bumps the unrelated signal. Only the method's counter advances — the point of
   * the whole demo.
   */
  protected bumpUnrelated(): void {
    this.unrelatedTick.update((v) => v + 1);
  }

  // ---- Live proof: null handling & the [object Object] pitfall ----
  /**
   * A nullable user for the safe-navigation demo.
   */
  protected readonly user = signal<{ name: string } | null>({ name: 'Ada' });

  /**
   * Toggles the user between present and `null`, so `{{ user()?.name }}` can be
   * seen surviving both.
   */
  protected toggleUser(): void {
    this.user.update((u) => (u ? null : { name: 'Ada' }));
  }

  /**
   * Sample: interpolating values and expressions.
   */
  readonly basicSample = `<p>Full name: {{ first() }} {{ last() }}</p>
<p>Characters: {{ (first() + last()).length }}</p>
<p>Uppercase: {{ (first() + ' ' + last()).toUpperCase() }}</p>`;

  /**
   * Sample: arithmetic and ternaries inside `{{ }}`.
   */
  readonly mathSample = `<span>count = {{ count() }}</span>
<p>Doubled: {{ count() * 2 }}</p>
<p>Is even? {{ count() % 2 === 0 ? 'yes' : 'no' }}</p>
<p>Squared via method: {{ square(count()) }}</p>`;

  /**
   * Sample: the method-call against `computed` comparison, with the component code
   * alongside the template.
   */
  readonly noisyVsComputedSample = `// Component class
protected readonly seed = signal(2);

protected noisyRuns = 0;
protected noisyDouble(): number {
  this.noisyRuns++;              // proves this body ran again
  return this.seed() * 2;
}

protected computedRuns = 0;
protected readonly computedDouble = computed(() => {
  this.computedRuns++;           // proves this body ran again
  return this.seed() * 2;
});

// Template
<p>Method call: {{ noisyDouble() }} (ran {{ noisyRuns }} times)</p>
<p>computed(): {{ computedDouble() }} (ran {{ computedRuns }} times)</p>`;

  /**
   * Sample: expressions a template *cannot* contain — assignment, `new`,
   * increment, chained statements — and why the restriction exists.
   */
  readonly invalidSample = `<!-- Assignment: templates may only READ, never write -->
<p>{{ count = 5 }}</p>              <!-- compile error -->

<!-- new / increment / decrement mutate — also blocked -->
<p>{{ new Date() }}</p>             <!-- compile error -->
<p>{{ count()++ }}</p>              <!-- compile error -->

<!-- Chaining with ; or , isn't a single expression -->
<p>{{ first(); last() }}</p>        <!-- compile error -->

<!-- No ambient globals inside the expression sandbox -->
<p>{{ window.innerWidth }}</p>      <!-- compile error -->

<!-- | is ALWAYS the pipe operator here, never bitwise OR -->
<p>{{ a | b }}</p>                  <!-- 'b' is looked up as a pipe name -->`;

  /**
   * Sample: handling null safely, and when to reach for a binding or a pipe
   * instead of interpolation.
   */
  readonly nullHandlingSample = `<p>{{ user()?.name }}</p>          <!-- '' if user() is null, no crash -->
<img [src]="avatar()" />           <!-- property binding, not interpolation -->
<p>{{ price() | currency }}</p>    <!-- format with a pipe -->`;

  /**
   * Sample: roughly what the compiler emits for an interpolated line — the
   * `advance`/`textInterpolate` pair and its dirty check.
   */
  readonly underTheHoodSample = `// This template line:
<p>Hi {{ name() }}, you have {{ count() }} messages</p>

// compiles to (simplified) instructions for the component's view:

// --- creation mode: runs once ---
ɵɵelementStart(0, 'p');
ɵɵtext(1);                      // reserves an empty text node at slot 1
ɵɵelementEnd();

// --- update mode: runs every change-detection pass that reaches this view ---
ɵɵadvance(1);                   // move the slot pointer to node 1
ɵɵtextInterpolate2(
  'Hi ', ctx.name(), ', you have ', ctx.count(), ' messages'
);
// diffs the freshly-built string against what it wrote last time;
// the DOM Text node's .data is only touched when it actually changed.`;
}
