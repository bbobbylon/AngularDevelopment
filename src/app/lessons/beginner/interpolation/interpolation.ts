import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-interpolation',
  imports: [RouterLink],
  styles: [
    `
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
      .render-note { font-family: monospace; font-size: .8rem; color: var(--text-muted); }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Components & Templates</span>
      <h1>Interpolation & Template Expressions</h1>
      <p class="lead">
        Interpolation — the <code>{{ '{{' }} ... {{ '}}' }}</code> syntax — renders a
        component's data into the DOM as text. Angular evaluates the expression
        inside, converts the result to a string and keeps it in sync.
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

      <div class="code">
        <pre>&lt;p&gt;Full name: {{ '{{' }} first() {{ '}}' }} {{ '{{' }} last() {{ '}}' }}&lt;/p&gt;
&lt;p&gt;Characters: {{ '{{' }} (first() + last()).length {{ '}}' }}&lt;/p&gt;</pre>
      </div>

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
        safe-navigation <code>?.</code> stops a nullish path from throwing:
      </p>
      <div class="code">
        <pre>&lt;p&gt;{{ '{{' }} user()?.name {{ '}}' }}&lt;/p&gt;          &lt;!-- '' if user() is null, no crash --&gt;
&lt;img [src]="avatar()" /&gt;                &lt;!-- property binding, not interpolation --&gt;
&lt;p&gt;{{ '{{' }} price() | currency {{ '}}' }}&lt;/p&gt;     &lt;!-- format with a pipe --&gt;</pre>
      </div>
      <p>
        Templates are type-checked too: if <code>first()</code> were a number,
        <code>.toUpperCase()</code> would be a build error. Use <code>$any(x)</code> as
        an escape hatch only when you must opt out of that checking.
      </p>

      <h2>Under the hood: it runs every change detection</h2>
      <p>
        Each <code>{{ '{{' }} … {{ '}}' }}</code> compiles to a binding Angular re-evaluates on
        every change-detection pass, comparing the new string to the last and touching the
        DOM only if it changed. That's why a <em>method</em> call in a template
        (<code>{{ '{{' }} square(count()) {{ '}}' }}</code>) is a smell for anything expensive: it
        re-runs constantly. Move heavy or shared derivations to a <code>computed()</code> or a
        <strong>pure pipe</strong>, both of which cache until their inputs change.
      </p>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Expensive method calls.</strong> They run every change detection — prefer
          <code>computed()</code> or a pure pipe.</li>
        <li><strong>Interpolating into a property.</strong> <code>value="{{ '{{' }} x {{ '}}' }}"</code>
          always yields a <em>string</em>; use <code>[value]="x"</code> to keep the real type.</li>
        <li><strong>Objects print as <code>[object Object]</code>.</strong> Use <code>| json</code>
          while debugging, or interpolate a specific field.</li>
        <li><strong>Side effects.</strong> No assignments/increments in an expression — Angular
          may evaluate it many times; it must be pure.</li>
        <li><strong>ExpressionChangedAfterItHasBeenChecked.</strong> Mutating bound state
          <em>after</em> it was read in the same cycle throws in dev mode — set it earlier.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why avoid calling a method inside <code>{{ '{{' }} … {{ '}}' }}</code>?</summary>
        <div>It re-runs on every change-detection pass (no caching). Use a
        <code>computed()</code> signal or a pure pipe for anything non-trivial.</div>
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

      <h2>Key takeaways</h2>
      <ul>
        <li><code>{{ '{{' }} expr {{ '}}' }}</code> renders <code>expr</code> as text and keeps it live.</li>
        <li>The result is coerced to a string; <code>null</code>/<code>undefined</code> become <code>''</code>.</li>
        <li>It's for text content — bind DOM properties with <code>[prop]</code> instead.</li>
        <li>Expressions are sandboxed and type-checked: no assignments, no globals, no side effects.</li>
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
}
