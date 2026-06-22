import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-interpolation',
  imports: [RouterLink],
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
