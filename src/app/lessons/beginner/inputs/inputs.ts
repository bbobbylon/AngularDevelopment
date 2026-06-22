import { Component, booleanAttribute, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A presentational badge driven entirely by inputs. */
@Component({
  selector: 'app-badge',
  template: `
    <span class="badge" [class.badge--lg]="big()" [style.background]="color()">
      {{ label() }}
      @if (count() !== undefined) {
        <strong>{{ count() }}</strong>
      }
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #fff;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.8rem;
      }
      .badge--lg {
        font-size: 1rem;
        padding: 8px 16px;
      }
    `,
  ],
})
export class Badge {
  /** Required input — the parent must provide it. */
  readonly label = input.required<string>();
  /** Optional input with a default. */
  readonly color = input('#7c4dff');
  /** Optional number, undefined when not set. */
  readonly count = input<number | undefined>(undefined);
  /** Aliased + transformed: parent writes [large], stored as `big`, coerced to boolean. */
  readonly big = input(false, { alias: 'large', transform: booleanAttribute });
}

@Component({
  selector: 'app-lesson-inputs',
  imports: [RouterLink, Badge],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Component Communication</span>
      <h1>Component Inputs</h1>
      <p class="lead">
        Inputs let a parent pass data <em>into</em> a child component. Modern
        Angular uses the <code>input()</code> function, which returns a read-only
        <strong>signal</strong> — so inputs are reactive out of the box.
      </p>

      <h2>Signal inputs</h2>
      <div class="code">
        <pre>export class Badge {{ '{' }}
  label = input.required&lt;string&gt;();              // must be provided
  color = input('#7c4dff');                       // optional + default
  big   = input(false, {{ '{' }} alias: 'large',        // rename for the template
                        transform: booleanAttribute {{ '}' }});
{{ '}' }}</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:14px">
          <input [value]="label()" (input)="label.set($any($event.target).value)" placeholder="label" />
          <input type="color" [value]="color()" (input)="color.set($any($event.target).value)" />
          <input type="number" [value]="count()" (input)="count.set(+$any($event.target).value)" style="width:90px" placeholder="count" />
          <label><input type="checkbox" [checked]="large()" (change)="large.set($any($event.target).checked)" /> large</label>
        </div>
        <app-badge [label]="label()" [color]="color()" [count]="count()" [large]="large()" />
      </div>

      <div class="code">
        <pre>&lt;app-badge
  [label]="label()"
  [color]="color()"
  [count]="count()"
  [large]="large()" /&gt;</pre>
      </div>

      <h2>Reacting to inputs with computed()</h2>
      <p>
        Because inputs are signals, you derive from them with <code>computed()</code>
        — no <code>ngOnChanges</code> needed:
      </p>
      <div class="code">
        <pre>readonly initials = computed(() =&gt; this.label().slice(0, 2).toUpperCase());</pre>
      </div>
      <p>Preview: <span class="pill">{{ initials() }}</span></p>

      <h2>Transforms & read-timing</h2>
      <p>
        A <code>transform</code> coerces the bound value before it reaches the signal —
        Angular ships <code>booleanAttribute</code> and <code>numberAttribute</code>, and
        you can pass any pure function:
      </p>
      <div class="code">
        <pre>size = input(0, {{ '{' }} transform: numberAttribute {{ '}' }});       // "8" → 8
slug = input('', {{ '{' }} transform: (v: string) =&gt; v.trim().toLowerCase() {{ '}' }});</pre>
      </div>
      <div class="warn">
        Signal inputs are <strong>read-only</strong> from inside the component — only the
        parent sets them (use <code>model()</code> for two-way). And don't read an input
        in the <strong>constructor</strong>: bindings aren't applied yet, so a
        <code>required</code> input throws there. Read it in <code>ngOnInit</code>, a
        <code>computed</code>, or the template.
      </div>

      <h2>The classic &#64;Input decorator</h2>
      <p>You will still see the decorator form in many codebases and exams:</p>
      <div class="code">
        <pre>&#64;Input() label = '';
&#64;Input({{ '{' }} required: true {{ '}' }}) id!: string;
&#64;Input({{ '{' }} transform: booleanAttribute {{ '}' }}) disabled = false;</pre>
      </div>
      <div class="note">
        Both styles work. Prefer <strong>signal inputs</strong> in new code: they are
        reactive, type-safe, and play perfectly with <code>computed</code> and
        <code>effect</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>input()</code> returns a read-only signal; read it as <code>label()</code>.</li>
        <li><code>input.required&lt;T&gt;()</code> forces the parent to provide a value.</li>
        <li>Options: <code>alias</code> to rename, <code>transform</code> to coerce (e.g. <code>booleanAttribute</code>).</li>
        <li>Derive from inputs with <code>computed()</code> instead of <code>ngOnChanges</code>.</li>
      </ul>

      <p><a routerLink="/outputs">Next: Component Outputs →</a></p>
    </article>
  `,
})
export class Inputs {
  protected readonly label = signal('Online');
  protected readonly color = signal('#2ec16b');
  protected readonly count = signal(7);
  protected readonly large = signal(false);
  protected readonly initials = computed(() => this.label().slice(0, 2).toUpperCase());
}
