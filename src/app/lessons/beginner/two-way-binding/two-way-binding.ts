import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Lesson: two-way binding, from the syntax sugar down to the emission rules.
 *
 * Covers the exact desugaring of [(x)], the x/xChange naming contract, the
 * model() API in depth (including when valueChange does and does NOT fire),
 * splitting the banana to intercept writes, ngModel with ngModelOptions,
 * the assignability rule, the legacy @Input/@Output pattern, and the
 * pitfalls that show up in exams and code review.
 *
 * The Stepper below is a real child component used by several live demos.
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
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    table.cmp td code { white-space: nowrap; }
    .ok { color: var(--green); font-weight: 700; }
    .bad { color: #ef4444; font-weight: 700; }

    .event-log { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; margin-top: 10px; font-family: monospace; font-size: .8rem; max-height: 150px; overflow-y: auto; }
    .event-log p { margin: 2px 0; }
    .event-log .from-child { color: var(--accent); }
    .event-log .from-parent { color: var(--text-muted); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }

    .field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .field-grid label { display: block; font-size: .8rem; color: var(--text-muted); margin-bottom: 4px; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Data Binding</span>
      <h1>Two-Way Binding</h1>
      <p class="lead">
        Two-way binding keeps a value in sync in <em>both</em> directions: the
        view updates the data and the data updates the view. The syntax is the
        "banana in a box": <code>[(x)]</code> — brackets (property binding) inside
        parentheses (event binding). This page goes from the sugar down to the
        emission rules, interception patterns, and the traps.
      </p>

      <h2>It is just sugar — the exact expansion</h2>
      <p>
        The compiler rewrites <code>[(x)]="expr"</code> into a property binding plus
        an event binding whose name follows a strict contract: <strong>the output
        must be named <code>xChange</code></strong> — the input's name with the
        literal suffix <code>Change</code>. There is no configuration for this;
        it is a naming convention baked into the compiler.
      </p>
      <div class="code"><pre>{{ desugarSample }}</pre></div>
      <p>
        The write-back is signal-aware: when the bound expression is a
        <code>WritableSignal</code>, Angular calls <code>count.set($event)</code>
        instead of a plain assignment. That is why you bind
        <code>[(value)]="count"</code> — the signal itself, <em>never</em>
        <code>count()</code> (a call expression cannot be assigned to).
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

      <h2>What model() actually creates — and when it emits</h2>
      <p>
        <code>model()</code> declares an input/output <em>pair</em> in one line: an
        input named <code>value</code> and an output named <code>valueChange</code>.
        The returned <code>ModelSignal</code> is writable from inside the child
        (<code>.set()</code> / <code>.update()</code>), and every child-side write
        emits on the output. The subtle rule most people get wrong:
        <strong>parent-side writes do NOT emit <code>valueChange</code></strong> —
        the event only fires for changes that originate in the child. Watch the log:
      </p>
      <div class="demo">
        <p class="demo__title">Live — who triggers valueChange?</p>
        <div class="row">
          <app-stepper [value]="logged()" (valueChange)="onLoggedChange($event)" />
          <span class="pill">parent's value = {{ logged() }}</span>
          <button class="ghost" (click)="setFromParent()">Set to 42 from parent</button>
        </div>
        <div class="event-log">
          @if (log().length === 0) {
            <p class="from-parent">— interact above; child clicks emit, parent sets don't —</p>
          }
          @for (entry of log(); track $index) {
            <p [class.from-child]="entry.startsWith('valueChange')" [class.from-parent]="!entry.startsWith('valueChange')">{{ entry }}</p>
          }
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Clicking + / − inside the stepper logs a <code>valueChange</code> emission.
          "Set to 42 from parent" updates the input silently — no event. If it did emit,
          every two-way binding would be an infinite loop.
        </p>
      </div>
      <div class="code"><pre>{{ modelApiSample }}</pre></div>
      <div class="note">
        Because <code>model()</code> is just an input + output pair, all three usages
        are legal: full two-way <code>[(value)]="x"</code>, one-way in
        <code>[value]="x"</code> (child changes stay local), or listen-only
        <code>(valueChange)="onChange($event)"</code>.
      </div>

      <h2>Splitting the banana: intercept, validate, clamp</h2>
      <p>
        Because <code>[(x)]</code> is sugar, you can always drop to the explicit pair
        and put logic between the child's emission and your state. This is <em>the</em>
        pattern for validation, clamping, confirmation dialogs, or dispatching to a
        store instead of assigning:
      </p>
      <div class="code"><pre>{{ splitBananaSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — parent clamps every write to 0…10</p>
        <div class="row">
          <app-stepper [value]="clamped()" (valueChange)="setClamped($event)" />
          <span class="pill">clamped = {{ clamped() }}</span>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Try stepping past 10 or below 0 — the child asks, the parent decides.
          The child still works unmodified; the policy lives where the state lives.
        </p>
      </div>

      <h2>ngModel — two-way binding for form controls</h2>
      <p>
        Native form elements have no <code>valueChange</code> output, so
        <code>[(value)]</code> on a raw <code>&lt;input&gt;</code> does nothing useful.
        <code>FormsModule</code> provides the <code>NgModel</code> directive, which
        adapts each control type (text, checkbox, select, radio) to the two-way
        contract via a <em>ControlValueAccessor</em>. <code>[(ngModel)]</code> desugars
        to <code>[ngModel]</code> + <code>(ngModelChange)</code> exactly like any
        other banana.
      </p>
      <div class="code"><pre>{{ ngModelSample }}</pre></div>
      <div class="demo">
        <p class="demo__title">Live — one directive, every control type</p>
        <div class="field-grid">
          <div>
            <label>text — updates every keystroke</label>
            <input [(ngModel)]="text" placeholder="type here" style="width:100%" />
          </div>
          <div>
            <label>text — updateOn: 'blur' (leave the field to commit)</label>
            <input [ngModel]="blurText()" (ngModelChange)="blurText.set($event)"
              [ngModelOptions]="{ updateOn: 'blur' }" placeholder="type, then click away" style="width:100%" />
          </div>
          <div>
            <label>select</label>
            <select [(ngModel)]="framework" style="width:100%">
              <option value="signals">Signals</option>
              <option value="rxjs">RxJS</option>
              <option value="both">Both, appropriately</option>
            </select>
          </div>
          <div>
            <label>checkbox</label>
            <label class="row" style="color:var(--text)">
              <input type="checkbox" [(ngModel)]="agree" /> I agree
            </label>
          </div>
        </div>
        <div class="event-log" style="margin-top:14px">
          <p>text = "{{ text() }}" ({{ text().length }} chars)</p>
          <p>blurText = "{{ blurText() }}" — only updates on blur</p>
          <p>framework = "{{ framework() }}"</p>
          <p>agree = {{ agree() }}</p>
        </div>
      </div>
      <div class="tip">
        Since these are signals, <code>[(ngModel)]="text"</code> binds directly to
        the <code>text</code> signal — Angular writes via <code>.set()</code>, no
        getter/setter boilerplate. The blur demo shows <code>ngModelOptions</code>:
        <code>updateOn</code> accepts <code>'change'</code> (default),
        <code>'blur'</code>, or <code>'submit'</code> — the same knob reactive forms
        expose, useful when per-keystroke updates trigger expensive work.
      </div>
      <div class="warn">
        Two errors everyone hits once: (1) forgetting to import
        <code>FormsModule</code> produces <em>NG8002: Can't bind to 'ngModel' since it
        isn't a known property of 'input'</em> — the directive simply doesn't exist in
        the template's scope. (2) An <code>ngModel</code> inside a
        <code>&lt;form&gt;</code> tag must have a <code>name</code> attribute (it
        registers with the parent NgForm under that name), or use
        <code>[ngModelOptions]="&#123; standalone: true &#125;"</code> to opt out of
        registration.
      </div>

      <h2>The assignability rule — what compiles, what doesn't</h2>
      <p>
        Angular writes <em>back</em> into your expression, so the target of
        <code>[(x)]="expr"</code> must be something you could put on the left of
        <code>=</code> (or a writable signal). The compiler enforces it:
      </p>
      <table class="cmp">
        <tr><th>Binding</th><th></th><th>Why</th></tr>
        <tr>
          <td><code>[(value)]="count"</code> (WritableSignal)</td><td class="ok">✓</td>
          <td>Signal-aware: compiles to <code>count.set($event)</code>.</td>
        </tr>
        <tr>
          <td><code>[(value)]="user.name"</code> (plain property)</td><td class="ok">✓</td>
          <td>Plain assignment: <code>user.name = $event</code>.</td>
        </tr>
        <tr>
          <td><code>[(value)]="count()"</code></td><td class="bad">✗</td>
          <td>A call expression — nothing to assign to. Bind the signal, not its value.</td>
        </tr>
        <tr>
          <td><code>[(value)]="user().name"</code></td><td class="bad">✗</td>
          <td>Reading through a signal call: the write target isn't assignable. Copy to a
              local writable signal or split the banana.</td>
        </tr>
        <tr>
          <td><code>[(value)]="total"</code> (computed)</td><td class="bad">✗</td>
          <td><code>computed()</code> is read-only — no <code>.set()</code> to call.</td>
        </tr>
        <tr>
          <td><code>[(value)]="a || b"</code></td><td class="bad">✗</td>
          <td>Arbitrary expressions aren't assignment targets.</td>
        </tr>
      </table>

      <h2>Before model(): the decorator-era pattern</h2>
      <p>
        You will read this in every pre-v17 codebase, and it clarifies why the naming
        contract exists — you used to build both halves by hand:
      </p>
      <div class="code"><pre>{{ legacySample }}</pre></div>
      <table class="cmp">
        <tr><th></th><th><code>model()</code> (modern)</th><th><code>&#64;Input</code> + <code>&#64;Output</code> (legacy)</th></tr>
        <tr><td>Declaration</td><td>one line, pair generated</td><td>two members, names must align manually</td></tr>
        <tr><td>Child updates it</td><td><code>value.set(v)</code> — emits automatically</td><td>set the field <em>and</em> remember to <code>emit(v)</code></td></tr>
        <tr><td>Read in child</td><td><code>value()</code> — reactive, works in <code>computed()</code></td><td>plain field — needs <code>ngOnChanges</code> to react</td></tr>
        <tr><td>Required + alias</td><td><code>model.required()</code>, <code>&#123; alias &#125;</code></td><td><code>&#64;Input(&#123; required: true &#125;)</code>, alias on both, kept in sync by hand</td></tr>
      </table>

      <h2>Pitfalls that show up in exams and code review</h2>
      <ul>
        <li><strong>Mutation doesn't propagate.</strong> Two-way binding syncs
          <em>assignments</em>. If you bind an object and mutate its properties, no
          input fires and no event emits — same rule as every other binding.
          Prefer immutable updates or bind primitives.</li>
        <li><strong><code>&#64;for</code> loop variables aren't assignable.</strong>
          <code>[(ngModel)]="item"</code> inside a loop fails — the loop variable is a
          snapshot, not a storage location. Bind to a property of the item
          (<code>[(ngModel)]="item.name"</code>) instead.</li>
        <li><strong>The suffix is exactly <code>Change</code>.</strong> An output named
          <code>valueChanged</code> or <code>onValueChange</code> silently breaks the
          banana — the compiler reports no matching output for the desugared binding.</li>
        <li><strong><code>(ngModelChange)</code> ≠ <code>(change)</code>.</strong>
          <code>ngModelChange</code> emits the parsed <em>value</em> on every model
          update; the native <code>change</code> event fires per DOM rules (text inputs:
          on blur) and hands you a raw <code>Event</code>.</li>
        <li><strong>Template-driven vs reactive:</strong> <code>[(ngModel)]</code> is the
          entry point to template-driven forms. Mixing it onto a control that already has
          a <code>formControlName</code> is an error — pick one system per control.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What does <code>[(visible)]="show"</code> expand to, exactly?</summary>
        <div><code>[visible]="show" (visibleChange)="show = $event"</code> — and if
        <code>show</code> is a writable signal, the write is <code>show.set($event)</code>.
        The output name is always input-name + <code>Change</code>.</div>
      </details>
      <details class="qa">
        <summary>Does <code>valueChange</code> fire when the parent changes the value?</summary>
        <div>No. <code>model()</code> emits only for child-originated writes
        (<code>.set()</code>/<code>.update()</code> inside the component). Parent writes
        flow in through the input half silently — otherwise two-way binding would loop
        forever.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>[(value)]="count()"</code> fail to compile?</summary>
        <div><code>count()</code> is a call expression — there is nothing to assign back
        into. Bind the signal itself: <code>[(value)]="count"</code>; Angular detects the
        WritableSignal and writes via <code>.set()</code>.</div>
      </details>
      <details class="qa">
        <summary>You see <em>NG8002: Can't bind to 'ngModel'</em>. First thing to check?</summary>
        <div>Whether <code>FormsModule</code> is in the component's <code>imports</code>
        array. Without it, the NgModel directive isn't in template scope, so
        <code>ngModel</code> looks like an unknown property of <code>&lt;input&gt;</code>.</div>
      </details>
      <details class="qa">
        <summary>How do you validate a child's value before accepting it?</summary>
        <div>Split the banana: <code>[value]="v()" (valueChange)="accept($event)"</code>
        and put the policy (clamp, validate, confirm, dispatch) in <code>accept()</code>.
        Two-way binding is sugar, so the explicit pair is always available.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>[(x)]</code> = <code>[x]</code> + <code>(xChange)</code> — the suffix is a hard compiler contract.</li>
        <li><code>model()</code> generates the pair; it emits on child writes only, never on parent writes.</li>
        <li>Bind the signal itself, never its call — the target must be assignable.</li>
        <li>Split the banana whenever a write needs interception (clamp, validate, dispatch).</li>
        <li><code>[(ngModel)]</code> adapts native controls via ControlValueAccessor; remember FormsModule, <code>name</code>-in-forms, and <code>ngModelOptions.updateOn</code>.</li>
      </ul>

      <p>
        Drill this with the <a routerLink="/practice">Components &amp; Templates challenges</a>,
        then continue to <a routerLink="/class-style-binding">Class &amp; Style Binding →</a>
      </p>
    </article>
  `,
})
export class TwoWayBinding {
  protected readonly count = signal(5);

  // --- emission-rules demo ---
  protected readonly logged = signal(5);
  protected readonly log = signal<string[]>([]);
  onLoggedChange(v: number) {
    this.logged.set(v);
    this.log.update((l) => [`valueChange emitted: ${v}  (child clicked)`, ...l].slice(0, 8));
  }
  setFromParent() {
    this.logged.set(42);
    this.log.update((l) => ['parent wrote 42 — input updated, NO valueChange', ...l].slice(0, 8));
  }

  // --- split-banana clamp demo ---
  protected readonly clamped = signal(5);
  setClamped(v: number) {
    this.clamped.set(Math.max(0, Math.min(10, v)));
  }

  // --- ngModel demos ---
  protected readonly text = signal('');
  protected readonly blurText = signal('');
  protected readonly framework = signal('signals');
  protected readonly agree = signal(false);

  // --- code samples (kept as properties so braces/backticks need no template escaping) ---
  readonly desugarSample = `<app-stepper [(value)]="count" />

<!-- is exactly equivalent to -->
<app-stepper [value]="count" (valueChange)="count = $event" />

<!-- and when count is a WritableSignal, the write-back becomes -->
<app-stepper [value]="count()" (valueChange)="count.set($event)" />`;

  readonly modelApiSample = `export class Stepper {
  value = model(0);                        // input "value" + output "valueChange"
  size  = model.required<number>();        // parent MUST bind it (or NG8008 at compile time)
  width = model(0, { alias: 'dimension' }); // parent binds [(dimension)]

  inc() {
    this.value.update(v => v + 1);         // child-side write → valueChange emits
  }
}

// inside the child, value is a full signal:
doubled = computed(() => this.value() * 2); // reacts to parent AND child writes`;

  readonly splitBananaSample = `<!-- sugar: every child emission lands in state unchecked -->
<app-stepper [(value)]="clamped" />

<!-- explicit pair: the parent owns the policy -->
<app-stepper [value]="clamped()" (valueChange)="setClamped($event)" />`;

  readonly ngModelSample = `import { FormsModule } from '@angular/forms';
// add FormsModule to the component's imports array

<input [(ngModel)]="text" />                              <!-- text: string -->
<input type="checkbox" [(ngModel)]="agree" />             <!-- boolean -->
<select [(ngModel)]="framework"> ... </select>            <!-- option value -->

<!-- commit on blur instead of every keystroke -->
<input [(ngModel)]="draft" [ngModelOptions]="{ updateOn: 'blur' }" />

<!-- inside a <form>: a name is required (or opt out with standalone) -->
<form>
  <input name="email" [(ngModel)]="email" />
  <input [(ngModel)]="scratch" [ngModelOptions]="{ standalone: true }" />
</form>`;

  readonly legacySample = `export class Stepper {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();  // name MUST be value + "Change"

  inc() {
    this.value++;
    this.valueChange.emit(this.value);  // forget this line → parent silently desyncs
  }
}`;
}
