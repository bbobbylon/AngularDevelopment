import { Component, computed, signal } from '@angular/core';
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
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }

      table.lbl { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 4px 0 20px; }
      table.lbl th, table.lbl td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.lbl th { background: var(--bg-elevated); }
      table.lbl td:first-child { white-space: pre-wrap; font-family: 'JetBrains Mono', Menlo, Consolas, monospace; font-size: .82rem; width: 34%; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Components & Templates</span>
      <h1>Interpolation & Template Expressions</h1>
      <p class="lead">
        Interpolation — the <code>{{ '{{' }} ... {{ '}}' }}</code> syntax — renders a
        component's data into the DOM as text. Angular evaluates the expression
        inside, converts the result to a string and keeps it in sync on every
        change-detection pass. It looks like "just print this value", but the exam
        cares about three things underneath that: exactly which expressions are
        legal, how expensive an interpolated call can be, and what happens when the
        value is null, undefined, or an object.
      </p>

      <h2>Basic interpolation</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom: 12px">
          <input [value]="first()" (input)="first.set($any($event.target).value)" placeholder="first" />
          <input [value]="last()" (input)="last.set($any($event.target).value)" placeholder="last" />
        </div>
        <p>Full name: <strong>{{ first() }} {{ last() }}</strong></p>
        <p>Characters: {{ (first() + last()).length }}</p>
        <p>Uppercase: {{ (first() + ' ' + last()).toUpperCase() }}</p>
      </div>

      <div class="code"><pre>{{ basicSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>{{ '{{' }} first() {{ '}}' }} {{ '{{' }} last() {{ '}}' }}</td>
          <td>Two separate interpolations in one text node. Signals are callable, so
            <code>first()</code> reads the current value (not the signal object itself);
            Angular stringifies each result and stitches them together with the literal
            space that sits between the two <code>{{ '{{' }} {{ '}}' }}</code> pairs in the source.</td>
        </tr>
        <tr>
          <td>(first() + last()).length</td>
          <td>A normal TypeScript expression is allowed as long as it's a single,
            side-effect-free read: string concatenation, then <code>.length</code> off the
            result. Angular re-runs the <em>whole</em> expression on every check — there's
            no partial re-evaluation of sub-expressions.</td>
        </tr>
        <tr>
          <td>.toUpperCase()</td>
          <td>Calling a method on the computed string is fine because
            <code>String.prototype.toUpperCase</code> is pure and deterministic for the
            same input — exactly the class of call the template sandbox is designed to
            allow (contrast with the noisy method-call demo below).</td>
        </tr>
      </table>

      <h2>Expressions can do math & call methods</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom: 12px">
          <button (click)="count.set(count() - 1)">−</button>
          <span class="pill">count = {{ count() }}</span>
          <button (click)="count.set(count() + 1)">+</button>
        </div>
        <p>Doubled: {{ count() * 2 }}</p>
        <p>Is even? {{ count() % 2 === 0 ? 'yes' : 'no' }}</p>
        <p>Squared via method: {{ square(count()) }}</p>
      </div>

      <div class="code"><pre>{{ mathSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>{{ '{{' }} count() {{ '}}' }}</td>
          <td>Reads the counter signal directly. This is the cheapest possible
            interpolation: no operators, no method call, just a value read.</td>
        </tr>
        <tr>
          <td>count() * 2</td>
          <td>Arithmetic is allowed inline. Angular re-evaluates <code>count() * 2</code>
            on every pass that reaches this view, but only writes to the DOM
            <code>Text</code> node when the new string differs from the last one.</td>
        </tr>
        <tr>
          <td>count() % 2 === 0 ? 'yes' : 'no'</td>
          <td>The ternary operator is explicitly permitted — it's still a single
            expression, unlike an <code>if/else</code> statement, which is not. Strict
            <code>===</code> avoids the type-coercion surprises <code>==</code> can cause.</td>
        </tr>
        <tr>
          <td>square(count())</td>
          <td>Legal syntax, but this is the exact anti-pattern the demo below measures:
            Angular can't know <code>square()</code> is pure just from calling it, so it
            re-invokes it on <em>every</em> change-detection pass that reaches this
            template — fine for something this trivial, costly for anything that isn't.</td>
        </tr>
      </table>

      <h2>Live proof — a template method call re-runs every check; computed() doesn't</h2>
      <p>
        Both rows below compute the same value (<code>seed() * 2</code>) and both
        increment a counter every time their logic actually executes. Click
        <strong>"trigger unrelated re-render"</strong> a few times — it changes a signal
        this template reads (so a change-detection pass happens) but has nothing to do
        with <code>seed</code>:
      </p>
      <div class="demo">
        <p class="demo__title">Live — instrumented run counters</p>
        <p>Method call: <strong>{{ noisyDouble() }}</strong> · ran <span class="pill">{{ noisyRuns }}</span> times</p>
        <p>computed(): <strong>{{ computedDouble() }}</strong> · ran <span class="pill">{{ computedRuns }}</span> times</p>
        <div class="row" style="margin-top: 12px">
          <button (click)="bumpSeed()">seed.update(+1) — bumps BOTH counters</button>
          <button class="ghost" (click)="bumpUnrelated()">trigger unrelated re-render ({{ unrelatedTick() }})</button>
        </div>
        <p style="color:var(--text-muted);font-size:.85rem">
          The unrelated button forces this component to re-render (it reads
          <code>unrelatedTick()</code> above), so <em>every</em> interpolation in the
          template — including <code>noisyDouble()</code> — is re-evaluated and its
          counter climbs. <code>computedDouble()</code>'s counter holds still, because
          its cached value is still valid: <code>seed</code>, the only signal it read
          last time, hasn't changed. Click the seed button and both counters move
          together.
        </p>
      </div>
      <div class="code"><pre>{{ noisyVsComputedSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>seed = signal(2)</td>
          <td>The writable signal both derivations depend on — the single "source of
            truth" this whole comparison is built around.</td>
        </tr>
        <tr>
          <td>noisyRuns = 0</td>
          <td>A plain (non-signal) instance field, used purely to make invocations
            visible for this demo. Mutating a plain field never notifies Angular of
            anything — it's just instrumentation, not reactive state.</td>
        </tr>
        <tr>
          <td>noisyDouble() {{ '{' }} this.noisyRuns++; return this.seed() * 2; {{ '}' }}</td>
          <td>An ordinary method. Angular has no way to know it "really" only depends on
            <code>seed()</code> — it must assume the return value could differ on every
            single check, so it calls the whole method body (increment included) every
            time the template is checked.</td>
        </tr>
        <tr>
          <td>computedRuns = 0</td>
          <td>Same instrumentation trick, this time to count how often the
            <code>computed()</code> callback body actually executes.</td>
        </tr>
        <tr>
          <td>computedDouble = computed(() =&gt; {{ '{' }} this.computedRuns++; return this.seed() * 2; {{ '}' }})</td>
          <td><code>computed()</code> records exactly which signals were read during its
            last run (here, only <code>seed()</code>). It only re-invokes the callback —
            and therefore only re-runs the increment — when one of those recorded
            dependencies actually produced a new value; otherwise it hands back the
            memoized result without touching the function body at all.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} noisyDouble() {{ '}}' }} … {{ '{{' }} computedDouble() {{ '}}' }}</td>
          <td>Both are <em>read</em> on every check that reaches this view — that part is
            unavoidable, it's just a function/signal call. The difference is entirely
            inside: one body always runs to completion, the other short-circuits to a
            cached value when its dependency graph says nothing changed.</td>
        </tr>
      </table>
      <div class="tip">
        This is the real reason the exam (and every style guide) tells you to avoid
        calling component methods from interpolation for anything non-trivial: it isn't
        that method calls are "banned", it's that they can't be memoized the way a
        <code>computed()</code> signal or a pure pipe can.
      </div>

      <h2>What expressions are NOT allowed</h2>
      <p>
        Template expressions are intentionally limited to keep templates simple and
        side-effect free. You <strong>cannot</strong> use:
      </p>
      <ul>
        <li>Assignments (<code>=</code>, <code>+=</code>) — except inside event statements</li>
        <li><code>new</code>, <code>++</code> / <code>--</code></li>
        <li>Bitwise operators <code>|</code> and <code>&amp;</code> (the <code>|</code> means "pipe" in templates)</li>
        <li>Chaining with <code>;</code> or <code>,</code></li>
        <li>Global references like <code>window</code> or <code>document</code></li>
      </ul>
      <div class="code"><pre>{{ invalidSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>Why it's rejected</th></tr>
        <tr>
          <td>{{ '{{' }} count = 5 {{ '}}' }}</td>
          <td>Assignment writes state; template expressions may only <strong>read</strong>.
            Writes belong in an event binding, e.g. <code>(click)="count.set(5)"</code>,
            which is parsed as a statement, not an expression.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} new Date() {{ '}}' }}</td>
          <td><code>new</code> is disallowed — constructing an object is exactly the kind
            of non-idempotent operation the expression grammar deliberately excludes.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} count()++ {{ '}}' }}</td>
          <td>Increment/decrement mutate a value in place; same "reads only" rule blocks
            them, same as assignment above.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} first(); last() {{ '}}' }}</td>
          <td><code>;</code> and <code>,</code> chain statements. A template expression must
            parse as one single expression, not a sequence — there is no way to "run two
            things" inside one interpolation.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} window.innerWidth {{ '}}' }}</td>
          <td>Top-level template expressions resolve only against the component instance
            and template-local variables (like <code>let item</code> in <code>&#64;for</code>) —
            ambient globals aren't in scope. Inject what you need (e.g. via a service) and
            expose it as a component member instead.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} a | b {{ '}}' }}</td>
          <td>Inside a template, <code>|</code> is <em>always</em> the pipe operator, never
            JS bitwise OR. <code>b</code> here is looked up as a <strong>pipe name</strong>,
            and the build fails if no pipe called <code>b</code> is registered.</td>
        </tr>
      </table>

      <div class="warn">
        Keep interpolation expressions simple and <strong>fast</strong>. They run on
        every change detection cycle, so avoid heavy work or anything with side
        effects — move that into the component class or a pure pipe.
      </div>

      <h2>Text content only & null handling</h2>
      <p>
        Interpolation produces <strong>text</strong>, so it belongs in element content
        (and string attributes). For DOM properties, prefer property binding
        (<code>[value]</code>) over <code>value="{{ '{{' }} x {{ '}}' }}"</code>.
        <code>null</code> and <code>undefined</code> render as an empty string, and the
        safe-navigation <code>?.</code> stops a nullish path from throwing.
      </p>
      <div class="demo">
        <p class="demo__title">Live — toggle the signal between an object and null</p>
        <div class="row" style="margin-bottom: 12px">
          <button (click)="toggleUser()">toggle user() — currently {{ user() ? "an object" : "null" }}</button>
        </div>
        <p>Safe navigation: <code>user()?.name</code> → <strong>"{{ user()?.name }}"</strong></p>
        <p>Direct object interpolation: <code>user()</code> → <strong>"{{ user() }}"</strong></p>
        <p style="color:var(--text-muted);font-size:.85rem">
          Toggle to "an object": the second row prints
          <code>[object Object]</code> — Angular stringifies with <code>'' + value</code>
          under the hood, and a plain object's default <code>toString()</code> is exactly
          that placeholder. Toggle to "null": both rows print an empty string instead of
          throwing, because <code>?.</code> short-circuits before the property read and
          Angular treats <code>null</code>/<code>undefined</code> as <code>''</code>.
        </p>
      </div>

      <div class="code"><pre>{{ nullHandlingSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>{{ '{{' }} user()?.name {{ '}}' }}</td>
          <td>The safe-navigation operator short-circuits to <code>undefined</code> the
            instant <code>user()</code> is <code>null</code>/<code>undefined</code>, instead
            of throwing "Cannot read properties of null". Angular then stringifies that
            <code>undefined</code> to an empty string — no crash, no visible error.</td>
        </tr>
        <tr>
          <td>[src]="avatar()"</td>
          <td>Square brackets are a <strong>property binding</strong>, not interpolation:
            the raw return value of <code>avatar()</code> is assigned directly to the DOM
            <code>src</code> property, preserving its real type. Writing
            <code>src="{{ '{{' }} avatar() {{ '}}' }}"</code> instead would force it through
            string interpolation and could break relative-URL resolution.</td>
        </tr>
        <tr>
          <td>{{ '{{' }} price() | currency {{ '}}' }}</td>
          <td>The pipe runs <em>after</em> the signal is read, formatting the raw number
            into a display string (e.g. <code>"$12.00"</code>). Pipes are the idiomatic
            place for display formatting — not string concatenation inside the expression
            itself.</td>
        </tr>
      </table>
      <p>
        Templates are type-checked too: if <code>first()</code> were a number,
        <code>.toUpperCase()</code> would be a build error. Use <code>$any(x)</code> as
        an escape hatch only when you must opt out of that checking.
      </p>

      <h2>Under the hood: what the compiler generates</h2>
      <p>
        Each <code>{{ '{{' }} … {{ '}}' }}</code> compiles to two things: a <strong>creation-mode</strong>
        instruction that reserves a text node once, and an <strong>update-mode</strong>
        instruction that re-runs the expression(s) and diffs the result on every
        change-detection pass. That's why a <em>method</em> call in a template
        (<code>{{ '{{' }} square(count()) {{ '}}' }}</code>) is a smell for anything expensive: the
        update-mode instruction re-executes it constantly. Move heavy or shared
        derivations to a <code>computed()</code> or a <strong>pure pipe</strong>, both of which
        cache until their inputs change.
      </p>
      <div class="code"><pre>{{ underTheHoodSample }}</pre></div>
      <h3>Line-by-line</h3>
      <table class="lbl">
        <tr><th>Line</th><th>What it does &amp; why</th></tr>
        <tr>
          <td>ɵɵelementStart(0,'p') / ɵɵtext(1) / ɵɵelementEnd()</td>
          <td>Creation-mode instructions that run <strong>once</strong> per view instance:
            they build the static DOM shape — the <code>&lt;p&gt;</code> element and an
            empty text node reserved at slot 1 — before any data exists to fill it.</td>
        </tr>
        <tr>
          <td>ɵɵadvance(1)</td>
          <td>Moves an internal slot pointer forward before the next instruction touches
            that node. Every update-mode interpolation instruction is preceded by an
            <code>ɵɵadvance</code> so Angular knows which node to update without re-walking
            the whole template tree on every pass.</td>
        </tr>
        <tr>
          <td>ɵɵtextInterpolate2(...)</td>
          <td>The "2" means the compiler found exactly two dynamic expressions in that
            text node. Angular generates a specialized instruction per expression-count
            (<code>textInterpolate1</code> through <code>8</code>, then a generic
            <code>textInterpolateV</code> for more) purely to avoid allocating an array for
            the common cases — a build-time optimization you never see in the source.</td>
        </tr>
        <tr>
          <td>diffs the freshly-built string…</td>
          <td>The expressions themselves always re-run on a pass that reaches this view —
            that part can't be skipped short of OnPush/computed-style memoization further
            up the chain. But the real DOM <code>Text.data</code> is only written when the
            new string differs from the last one, which is why interpolation stays cheap
            even though "it runs every pass".</td>
        </tr>
      </table>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Expensive method calls.</strong> They run every change detection — prefer
          <code>computed()</code> or a pure pipe (proven live above).</li>
        <li><strong>Interpolating into a property.</strong> <code>value="{{ '{{' }} x {{ '}}' }}"</code>
          always yields a <em>string</em>; use <code>[value]="x"</code> to keep the real type.</li>
        <li><strong>Objects print as <code>[object Object]</code>.</strong> Use <code>| json</code>
          while debugging, or interpolate a specific field.</li>
        <li><strong>Side effects.</strong> No assignments/increments in an expression — Angular
          may evaluate it many times; it must be pure.</li>
        <li><strong><code>|</code> is always the pipe operator</strong> inside a template —
          never bitwise OR, even though it's legal JS outside one.</li>
        <li><strong>ExpressionChangedAfterItHasBeenChecked.</strong> Mutating bound state
          <em>after</em> it was read in the same cycle throws in dev mode — set it earlier.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why avoid calling a method inside <code>{{ '{{' }} … {{ '}}' }}</code>?</summary>
        <div>It re-runs on every change-detection pass that reaches the view — there is no
        memoization, unlike <code>computed()</code>, which only re-invokes its callback when
        a signal it actually read has changed. Use a <code>computed()</code> signal or a pure
        pipe for anything non-trivial.</div>
      </details>
      <details class="qa">
        <summary>A component reads an unrelated signal and re-renders. Does a plain
        method call in its template re-execute even though the values it depends on
        didn't change?</summary>
        <div>Yes. Angular can't tell that a method's result is unrelated to whatever
        triggered the pass — it re-invokes every interpolated method call the view
        reaches. Only <code>computed()</code> (and pure pipes with unchanged inputs) skip
        the work, because they track their own dependency list.</div>
      </details>
      <details class="qa">
        <summary><code>value="{{ '{{' }} n {{ '}}' }}"</code> vs <code>[value]="n"</code>?</summary>
        <div>Interpolation stringifies, so the first passes <code>'42'</code>; property binding
        passes the number <code>42</code>. Bind properties with <code>[prop]</code>.</div>
      </details>
      <details class="qa">
        <summary>What renders when the value is <code>null</code> or <code>undefined</code>?</summary>
        <div>An empty string. Use <code>?.</code> to guard a nullish path so it doesn't throw.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>{{ '{{' }} a | b {{ '}}' }}</code> fail to compile with "no pipe found"
        instead of doing a bitwise OR?</summary>
        <div>Angular's template grammar reserves <code>|</code> exclusively for pipes; it
        never falls back to JavaScript's bitwise operator inside an interpolation, no matter
        what the operands look like.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>{{ '{{' }} expr {{ '}}' }}</code> renders <code>expr</code> as text and keeps it live, via a
          creation-mode instruction (once) plus an update-mode instruction (every pass).</li>
        <li>The result is coerced to a string; <code>null</code>/<code>undefined</code> become <code>''</code>,
          and plain objects stringify to <code>[object Object]</code>.</li>
        <li>It's for text content — bind DOM properties with <code>[prop]</code> instead.</li>
        <li>Expressions are sandboxed and type-checked: no assignments, no globals, no side effects,
          <code>|</code> always means "pipe".</li>
        <li>A template method call always re-executes on every reachable change-detection pass;
          <code>computed()</code>/pure pipes memoize by tracking their real dependencies.</li>
      </ul>

      <p><a routerLink="/property-binding">Next: Property &amp; Attribute Binding →</a></p>
    </article>
  `,
})
export class Interpolation {
  protected readonly first = signal('Grace');
  protected readonly last = signal('Hopper');
  protected readonly count = signal(3);

  protected square(n: number): number {
    return n * n;
  }

  // ---- Live proof: computed() memoizes, a plain method call in a template does not ----
  protected readonly seed = signal(2);
  protected readonly unrelatedTick = signal(0);

  /** Plain (non-signal) counter — safe to mutate for demo instrumentation; it notifies nobody. */
  protected noisyRuns = 0;
  /** Called directly from the template; re-executes on every change-detection pass that reaches it. */
  protected noisyDouble(): number {
    this.noisyRuns++;
    return this.seed() * 2;
  }

  protected computedRuns = 0;
  /**
   * computed() tracks exactly which signals were read on its last run (here, only
   * seed()) and only re-invokes this callback when one of them actually changed.
   */
  protected readonly computedDouble = computed(() => {
    this.computedRuns++;
    return this.seed() * 2;
  });

  protected bumpSeed(): void {
    this.seed.update((v) => v + 1);
  }

  protected bumpUnrelated(): void {
    this.unrelatedTick.update((v) => v + 1);
  }

  // ---- Live proof: null handling & the [object Object] pitfall ----
  protected readonly user = signal<{ name: string } | null>({ name: 'Ada' });

  protected toggleUser(): void {
    this.user.update((u) => (u ? null : { name: 'Ada' }));
  }

  readonly basicSample = `<p>Full name: {{ first() }} {{ last() }}</p>
<p>Characters: {{ (first() + last()).length }}</p>
<p>Uppercase: {{ (first() + ' ' + last()).toUpperCase() }}</p>`;

  readonly mathSample = `<span>count = {{ count() }}</span>
<p>Doubled: {{ count() * 2 }}</p>
<p>Is even? {{ count() % 2 === 0 ? 'yes' : 'no' }}</p>
<p>Squared via method: {{ square(count()) }}</p>`;

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

  readonly nullHandlingSample = `<p>{{ user()?.name }}</p>          <!-- '' if user() is null, no crash -->
<img [src]="avatar()" />           <!-- property binding, not interpolation -->
<p>{{ price() | currency }}</p>    <!-- format with a pipe -->`;

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
