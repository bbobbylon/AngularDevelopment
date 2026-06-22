import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * A custom component with a two-way bindable value via `model()`.
 * Parents can write `[(value)]="something"`.
 */
@Component({
  selector: 'app-stepper',
  template: `
    <div class="stepper">
      <button (click)="dec()">−</button>
      <strong>{{ value() }}</strong>
      <button (click)="inc()">+</button>
    </div>
  `,
  styles: [
    `
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 6px 12px;
      }
      strong {
        min-width: 2ch;
        text-align: center;
      }
    `,
  ],
})
export class Stepper {
  /** model() creates a writable, two-way bindable signal input. */
  readonly value = model(0);

  inc() {
    this.value.update((v) => v + 1);
  }
  dec() {
    this.value.update((v) => v - 1);
  }
}

@Component({
  selector: 'app-lesson-two-way-binding',
  imports: [RouterLink, FormsModule, Stepper],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Two-Way Binding</h1>
      <p class="lead">
        Two-way binding keeps a value in sync in <em>both</em> directions: the
        view updates the data and the data updates the view. The syntax is the
        "banana in a box": <code>[(x)]</code> — brackets (property binding) inside
        parentheses (event binding).
      </p>

      <h2>It is just sugar</h2>
      <p><code>[(x)]="value"</code> expands to a property binding plus an event binding:</p>
      <div class="code">
        <pre>&lt;app-stepper [(value)]="count" /&gt;

&lt;!-- is exactly equivalent to --&gt;
&lt;app-stepper [value]="count" (valueChange)="count = $event" /&gt;</pre>
      </div>
      <p>
        Angular looks for an input <code>value</code> and an output named
        <code>valueChange</code>. A <code>model()</code> signal creates both at once.
      </p>

      <h2>Two-way binding to a custom component</h2>
      <div class="demo">
        <p class="demo__title">Live — both stay in sync</p>
        <div class="row">
          <app-stepper [(value)]="count" />
          <span class="pill">parent's count = {{ count() }}</span>
          <button class="ghost" (click)="count.set(0)">Reset from parent</button>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          The stepper updates the parent, and the parent's reset updates the stepper.
        </p>
      </div>

      <h2>Two-way binding with ngModel (forms)</h2>
      <p>
        For form elements, <code>FormsModule</code> provides the
        <code>[(ngModel)]</code> directive — the classic two-way binding for inputs.
      </p>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:10px">
          <input [(ngModel)]="text" placeholder="type here" style="flex:1" />
        </div>
        <p>You typed: <strong>{{ text() }}</strong> ({{ text().length }} chars)</p>
        <label class="row">
          <input type="checkbox" [(ngModel)]="agree" /> I agree
        </label>
        <p>agree = {{ agree() }}</p>
      </div>

      <div class="code">
        <pre>import {{ '{' }} FormsModule {{ '}' }} from '&#64;angular/forms';
// add FormsModule to the component's imports

&lt;input [(ngModel)]="text" /&gt;</pre>
      </div>

      <div class="tip">
        Since these are signals, <code>[(ngModel)]="text"</code> binds directly to
        the <code>text</code> signal — no getter/setter boilerplate needed.
      </div>

      <h2>model() options & the assignability rule</h2>
      <div class="code">
        <pre>value = model(0);                       // optional, defaults to 0
value = model.required&lt;number&gt;();        // parent MUST provide [(value)]
size  = model(0, {{ '{' }} alias: 'dimension' {{ '}' }}); // bind as [(dimension)]</pre>
      </div>
      <div class="warn">
        The target of <code>[(x)]="expr"</code> must be <strong>assignable</strong> —
        Angular writes back to it. <code>[(value)]="user().name"</code> fails because a
        method call isn't a valid assignment target; bind to a signal or a plain
        property instead. Two-way is just sugar, so you can always drop to the explicit
        <code>[value]</code> + <code>(valueChange)</code> pair for full control.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>[(x)]</code> = <code>[x]</code> + <code>(xChange)</code>.</li>
        <li><code>model()</code> makes a component property two-way bindable.</li>
        <li><code>[(ngModel)]</code> (from <code>FormsModule</code>) does it for form controls.</li>
      </ul>

      <p><a routerLink="/class-style-binding">Next: Class &amp; Style Binding →</a></p>
    </article>
  `,
})
export class TwoWayBinding {
  protected readonly count = signal(5);
  protected readonly text = signal('');
  protected readonly agree = signal(false);
}
