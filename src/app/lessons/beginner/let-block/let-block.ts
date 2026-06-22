import { CurrencyPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-let-block',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Control Flow</span>
      <h1>Local Template Variables: &#64;let</h1>
      <p class="lead">
        <code>&#64;let</code> declares a local variable inside a template. Use it to
        name a computed value once and reuse it — keeping templates DRY and
        readable without adding fields to the component class.
      </p>

      <h2>Declare once, reuse everywhere</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <label>price <input type="number" [value]="price()" (input)="price.set(+$any($event.target).value)" /></label>
          <label>qty <input type="number" [value]="qty()" (input)="qty.set(+$any($event.target).value)" /></label>
        </div>

        @let subtotal = price() * qty();
        @let tax = subtotal * 0.2;
        @let total = subtotal + tax;

        <table class="bill">
          <tr><td>Subtotal</td><td>{{ subtotal | currency }}</td></tr>
          <tr><td>Tax (20%)</td><td>{{ tax | currency }}</td></tr>
          <tr class="grand"><td>Total</td><td>{{ total | currency }}</td></tr>
        </table>
      </div>

      <div class="code">
        <pre>&#64;let subtotal = price() * qty();
&#64;let tax = subtotal * 0.2;
&#64;let total = subtotal + tax;

&lt;p&gt;Total: {{ '{{' }} total | currency {{ '}}' }}&lt;/p&gt;</pre>
      </div>

      <h2>Great with the async pipe</h2>
      <p>
        A classic use is unwrapping an Observable/Signal once and reusing it,
        instead of piping it in several places:
      </p>
      <div class="code">
        <pre>&#64;let user = user$ | async;
&#64;if (user) {{ '{' }}
  &lt;h2&gt;{{ '{{' }} user.name {{ '}}' }}&lt;/h2&gt;
  &lt;p&gt;{{ '{{' }} user.email {{ '}}' }}&lt;/p&gt;
{{ '}' }}</pre>
      </div>

      <div class="note">
        Scope &amp; rules: a <code>&#64;let</code> is available in its current and nested
        scopes but <strong>not</strong> earlier in the template (no forward references).
        It is read-only — you cannot assign to it from an event handler. Its value
        updates reactively whenever its dependencies change. A <code>&#64;let</code> may
        reference earlier <code>&#64;let</code>s (chaining, as above) and template
        reference variables.
      </div>
      <p>
        It shines inside <code>&#64;for</code>: declare a per-row derived value once and
        reuse it across that row's markup, instead of recomputing the expression in
        several bindings.
      </p>
      <div class="code">
        <pre>&#64;for (p of products(); track p.id) {{ '{' }}
  &#64;let line = p.price * p.qty;
  &lt;td&gt;{{ '{{' }} line | currency {{ '}}' }}&lt;/td&gt;&lt;td&gt;{{ '{{' }} line * 0.2 | currency {{ '}}' }}&lt;/td&gt;
{{ '}' }}</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;let name = expr;</code> creates a reusable, reactive template variable.</li>
        <li>It reduces duplication and keeps derived values out of the class.</li>
        <li>Read-only and lexically scoped to where (and below where) it is declared.</li>
      </ul>

      <p><a routerLink="/builtin-directives">Next: Built-in Directives →</a></p>
    </article>
  `,
  styles: [
    `
      .bill {
        width: 100%;
        max-width: 320px;
        border-collapse: collapse;
      }
      .bill td {
        padding: 6px 8px;
        border-bottom: 1px solid var(--border);
      }
      .bill td:last-child {
        text-align: right;
      }
      .bill .grand td {
        font-weight: 700;
        border-bottom: none;
        color: var(--accent);
      }
    `,
  ],
})
export class LetBlock {
  protected readonly price = signal(9.99);
  protected readonly qty = signal(3);
}
