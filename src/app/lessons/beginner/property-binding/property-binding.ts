import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-property-binding',
  imports: [RouterLink],
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
