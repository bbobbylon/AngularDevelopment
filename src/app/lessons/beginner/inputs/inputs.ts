import {
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Second demo child — proves that a `transform` coerces the bound value BEFORE it
 * reaches the signal. The parent binds a raw string; this child receives a real
 * number. The classic attribute gotcha, made visible.
 */
@Component({
  selector: 'app-coerce-demo',
  template: `
    <div class="cd">
      <div>raw <code>size</code> the child received: <strong>{{ size() }}</strong></div>
      <div>its runtime type: <strong style="color:var(--violet)">{{ typeName() }}</strong></div>
      <div>size + 1 (real math): <strong>{{ size() + 1 }}</strong></div>
    </div>
  `,
  styles: [`.cd { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: .9rem; }`],
})
export class CoerceDemo {
  /** numberAttribute turns "42" (a string) into 42 (a number) on the way in. */
  readonly size = input(0, { transform: numberAttribute });
  readonly typeName = computed(() => typeof this.size());
}

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
  imports: [RouterLink, Badge, CoerceDemo],
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

      <h2>Live #2 — a transform coerces before the signal sees it</h2>
      <p>
        Type into the box below. The parent binds a <em>string</em>, but the child declares
        <code>size = input(0, {{ '{' }} transform: numberAttribute {{ '}' }})</code> — so the
        value is coerced on the way in and the child receives a real <code>number</code>
        (watch the "runtime type" line, and that <code>size + 1</code> does math, not string
        concatenation):
      </p>
      <div class="demo">
        <p class="demo__title">Live — parent passes the string "{{ raw() }}"</p>
        <div class="row" style="margin-bottom:12px">
          <input [value]="raw()" (input)="raw.set($any($event.target).value)" placeholder="type a number" style="width:140px" />
        </div>
        <app-coerce-demo [size]="raw()" />
      </div>

      <h2>Under the hood — inputs are reactive consumers</h2>
      <p>
        A signal input isn't a plain property that Angular happens to set. When the parent's
        binding produces a new value, Angular writes it into the input signal, which
        <strong>notifies every <code>computed</code> and view that read it</strong> — exactly
        like any other signal. That's why deriving with <code>computed()</code> "just works"
        and why <code>ngOnChanges</code> is unnecessary: the reactivity graph already knows who
        depends on the input. It also means an input read is only tracked where you actually
        call <code>label()</code>; untouched inputs cost nothing.
      </p>

      <h2>Exam pitfalls</h2>
      <ul>
        <li><strong>Reading a <code>required</code> input in the constructor throws.</strong> Bindings aren't applied yet at construction — read it in a <code>computed</code>, <code>ngOnInit</code>, or the template.</li>
        <li><strong>Inputs are one-way and read-only inside the child.</strong> You can't <code>label.set(...)</code> on an input; use <code>model()</code> for two-way binding.</li>
        <li><strong>The string-attribute coercion trap.</strong> Without <code>booleanAttribute</code>, <code>disabled="false"</code> passes the <em>string</em> <code>'false'</code> — which is truthy — so the child looks disabled. The transform fixes it.</li>
        <li><strong>Alias confusion.</strong> With <code>{{ '{' }} alias: 'large' {{ '}' }}</code> the <em>template</em> binds <code>[large]</code> but the field is <code>big</code>. Bind the alias, read the field.</li>
        <li><strong>Mutating an object input in the child.</strong> You share the parent's reference — mutating it is a hidden two-way channel and breaks OnPush assumptions. Treat inputs as immutable.</li>
      </ul>

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
  protected readonly raw = signal('42');
}
