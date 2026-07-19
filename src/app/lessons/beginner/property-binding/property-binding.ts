import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-property-binding',
  imports: [RouterLink],
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .84rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Property & Attribute Binding</h1>
      <p class="lead">
        Property binding — <code>[property]="expr"</code> — sets a DOM
        <em>property</em> (or a component input) from a component value. It is
        one-way: data flows from the class into the view.
      </p>

      <h2>Binding DOM properties</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom: 12px">
          <label><input type="checkbox" [checked]="disabled()" (change)="disabled.set($any($event.target).checked)" /> disable the button</label>
        </div>
        <button [disabled]="disabled()">I am {{ disabled() ? 'disabled' : 'enabled' }}</button>
        <div class="row" style="margin-top: 16px">
          <input [value]="url()" (input)="url.set($any($event.target).value)" style="flex:1" />
        </div>
        <p style="margin-top: 12px">
          Bound image source:
        </p>
        <img [src]="url()" [alt]="'preview of ' + url()" width="120" style="border-radius:8px;border:1px solid var(--border)" />
      </div>

      <div class="code">
        <pre>&lt;button [disabled]="disabled()"&gt;Save&lt;/button&gt;
&lt;img [src]="url()" [alt]="caption()" /&gt;</pre>
      </div>

      <div class="note">
        <code>[disabled]="false"</code> actually removes the disabled state. With
        the plain HTML attribute <code>disabled="false"</code> the button would
        still be disabled, because attribute presence is what matters. Property
        binding sets the live DOM property, which is what you almost always want.
      </div>

      <h2>Property vs attribute</h2>
      <p>
        HTML <strong>attributes</strong> initialize the DOM; <strong>properties</strong>
        are the live state. Most things you bind are properties. But a few things
        (ARIA, <code>colspan</code>, SVG, custom <code>data-*</code>) exist only as
        attributes — for those use <code>[attr.*]</code>:
      </p>
      <div class="demo">
        <p class="demo__title">Live — attribute binding</p>
        <div class="row" style="margin-bottom: 12px">
          <button (click)="span.set(span() === 2 ? 1 : 2)">toggle colspan ({{ span() }})</button>
        </div>
        <table style="border-collapse:collapse">
          <tr>
            <td [attr.colspan]="span()" style="border:1px solid var(--border);padding:8px">
              spans {{ span() }} column(s)
            </td>
            @if (span() === 1) {
              <td style="border:1px solid var(--border);padding:8px">second</td>
            }
          </tr>
        </table>
        <p style="margin-top:12px">
          <span [attr.aria-label]="'rating ' + span() + ' of 5'" class="pill">aria-label set via [attr.*]</span>
        </p>
      </div>

      <div class="code">
        <pre>&lt;td [attr.colspan]="span()"&gt;...&lt;/td&gt;
&lt;span [attr.aria-label]="label()"&gt;...&lt;/span&gt;</pre>
      </div>

      <h2>Binding to component inputs & shorthand</h2>
      <p>
        The same <code>[prop]</code> syntax passes values into a child component's
        inputs — the compiler checks the input exists and its type matches:
      </p>
      <div class="code">
        <pre>&lt;app-avatar [user]="currentUser()" [size]="48" /&gt;   // [size]="48" binds the number 48
&lt;app-avatar size="48" /&gt;                            // without [], "48" is the string '48'
&lt;img bind-src="url()" /&gt;                            // canonical form of [src]</pre>
      </div>
      <div class="warn">
        Property binding is also a <strong>security boundary</strong>: Angular sanitizes
        values bound to risky properties like <code>[innerHTML]</code>, <code>[href]</code>
        and <code>[src]</code>, stripping <code>javascript:</code> URLs and scripts.
        Concatenating untrusted strings into the DOM yourself bypasses that — don't.
      </div>

      <h2>Property vs attribute vs interpolation</h2>
      <table class="cmp">
        <tr><th>Syntax</th><th>Sets</th><th>Value type</th><th>Use for</th></tr>
        <tr><td><code>[prop]="x"</code></td><td>live DOM property / component input</td><td>the real type of <code>x</code></td><td>almost everything</td></tr>
        <tr><td><code>[attr.name]="x"</code></td><td>HTML attribute</td><td>stringified; <code>null</code> removes it</td><td>ARIA, colspan, SVG, data-*</td></tr>
        <tr><td><code>prop="{{ '{{' }} x {{ '}}' }}"</code></td><td>attribute → often reflected to property</td><td>always a string</td><td>plain text attributes only</td></tr>
      </table>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong><code>disabled="false"</code> still disables.</strong> Attribute presence is
          what counts — use <code>[disabled]="false"</code> to actually enable.</li>
        <li><strong>Passing a number as a string.</strong> <code>size="48"</code> binds
          <code>'48'</code>; <code>[size]="48"</code> binds the number.</li>
        <li><strong>Using <code>[attr.*]</code> where a property exists.</strong> Prefer the
          property; reach for <code>[attr.*]</code> only when there's no DOM property.</li>
        <li><strong>Binding untrusted HTML/URLs.</strong> Angular sanitizes
          <code>[innerHTML]</code>/<code>[href]</code>/<code>[src]</code>; hand-concatenating
          into the DOM bypasses that — don't.</li>
        <li><strong>Expecting <code>null</code> to blank a property.</strong> On
          <code>[attr.*]</code> it removes the attribute; on a property it sets the literal
          <code>null</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why does <code>disabled="false"</code> still disable the button?</summary>
        <div>It's an <em>attribute</em> — presence alone disables. Bind the <em>property</em>:
        <code>[disabled]="false"</code> sets the live DOM property to false.</div>
      </details>
      <details class="qa">
        <summary>When do you need <code>[attr.*]</code> instead of <code>[prop]</code>?</summary>
        <div>When there's no matching DOM property — ARIA (<code>aria-*</code>),
        <code>colspan</code>, SVG attributes, custom <code>data-*</code>.</div>
      </details>
      <details class="qa">
        <summary><code>[size]="48"</code> vs <code>size="48"</code> on a component input?</summary>
        <div>The first passes the number <code>48</code>; the second passes the string
        <code>'48'</code> (no brackets = literal attribute string).</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>[prop]="expr"</code> sets a DOM property or component input, one-way.</li>
        <li>Prefer property binding; it reflects the live state, not just the initial markup.</li>
        <li>Use <code>[attr.name]="expr"</code> when there is no matching DOM property.</li>
        <li>Binding <code>null</code>/<code>undefined</code> to <code>[attr.*]</code> removes the attribute.</li>
      </ul>

      <p><a routerLink="/event-binding">Next: Event Binding →</a></p>
    </article>
  `,
})
export class PropertyBinding {
  protected readonly disabled = signal(false);
  protected readonly url = signal('https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif');
  protected readonly span = signal(2);
}
