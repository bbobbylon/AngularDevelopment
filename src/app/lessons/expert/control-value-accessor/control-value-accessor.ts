import { JsonPipe } from '@angular/common';
import { Component, forwardRef, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Lesson: ControlValueAccessor — the contract that makes ANY component a
 * first-class form control. Two live custom controls (a star rating, and a
 * quantity stepper that also VALIDATES itself), the two-direction data flow,
 * how formControlName finds the accessor under the hood, and the classic
 * mistakes (missing onChange, echo loops, forgotten multi:true).
 */

/** A custom form control: a 1–5 star rating that plugs into Angular forms. */
@Component({
  selector: 'app-star-rating',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRating), multi: true },
  ],
  template: `
    @for (s of stars; track s) {
      <button
        type="button"
        [disabled]="disabled()"
        (click)="rate(s)"
        (blur)="onTouched()"
        (mouseenter)="hover.set(s)"
        (mouseleave)="hover.set(0)"
        style="background:transparent;border:none;color:var(--amber);font-size:1.6rem;line-height:1;cursor:pointer;padding:0 2px">
        {{ (hover() || value()) >= s ? '★' : '☆' }}
      </button>
    }
  `,
})
export class StarRating implements ControlValueAccessor {
  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly value = signal(0);
  protected readonly hover = signal(0);
  protected readonly disabled = signal(false);

  private onChange: (v: number) => void = () => {};
  protected onTouched: () => void = () => {};

  // ControlValueAccessor — the four-method bridge between the form model and the UI:
  writeValue(v: number): void {
    this.value.set(v ?? 0); // handle null: form.reset() passes null
  }
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected rate(s: number): void {
    if (this.disabled()) return;
    this.value.set(s);
    this.onChange(s); // ← push the new value into the form control
    this.onTouched();
  }
}

/**
 * A control that is ALSO its own validator: CVA + Validator on one class.
 * The stepper deliberately lets you exceed the range so you can watch the
 * form flip to INVALID with the control's own error object.
 */
@Component({
  selector: 'app-qty-stepper',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => QtyStepper), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => QtyStepper), multi: true },
  ],
  template: `
    <span class="stepper" [class.stepper--disabled]="disabled()">
      <button type="button" [disabled]="disabled()" (click)="step(-1)">−</button>
      <strong>{{ value() }}</strong>
      <button type="button" [disabled]="disabled()" (click)="step(1)">+</button>
    </span>
  `,
  styles: [`
    .stepper { display: inline-flex; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; }
    .stepper--disabled { opacity: .5; }
    .stepper button { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; font-size: 1.1rem; }
  `],
})
export class QtyStepper implements ControlValueAccessor, Validator {
  readonly min = input(1);
  readonly max = input(5);

  protected readonly value = signal(1);
  protected readonly disabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: number): void {
    this.value.set(v ?? this.min());
  }
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** Validator — the form calls this whenever the control's value changes. */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as number;
    if (v < this.min()) return { qtyTooLow: { min: this.min(), actual: v } };
    if (v > this.max()) return { qtyTooHigh: { max: this.max(), actual: v } };
    return null;
  }

  protected step(delta: number): void {
    if (this.disabled()) return;
    this.value.update((v) => v + delta); // intentionally unclamped — watch validate()
    this.onChange(this.value());
    this.onTouched();
  }
}

@Component({
  selector: 'app-lesson-control-value-accessor',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe, StarRating, QtyStepper],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }

    .err { color: var(--red, #ef4444); font-size: .85rem; margin-top: 6px; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Forms</span>
      <h1>Custom Form Controls (CVA)</h1>
      <p class="lead">
        <code>ControlValueAccessor</code> is the bridge that lets your own component
        behave like a native <code>&lt;input&gt;</code> inside Angular forms — usable
        with <code>formControlName</code>, <code>[(ngModel)]</code>, validation,
        statuses and disabled state. It's a four-method contract plus one provider
        registration — and it is <em>the same mechanism</em> Angular uses for native
        inputs: <code>DefaultValueAccessor</code>, <code>CheckboxControlValueAccessor</code>
        and friends are just built-in CVAs.
      </p>

      <h2>The two directions of data flow</h2>
      <div class="code"><pre>{{ flowSample }}</pre></div>
      <table class="cmp">
        <tr><th>Method</th><th>Direction</th><th>When the form calls it / you call it</th></tr>
        <tr><td><code>writeValue(v)</code></td><td>model → view</td><td><code>setValue()</code>, <code>patchValue()</code>, <code>reset()</code>, initial value — render <code>v</code>, and expect <code>null</code> on reset</td></tr>
        <tr><td><code>registerOnChange(fn)</code></td><td>view → model</td><td>the form hands you its callback once at setup; you call <code>fn(value)</code> on every user edit</td></tr>
        <tr><td><code>registerOnTouched(fn)</code></td><td>view → model</td><td>call <code>fn()</code> when the user "leaves" the control (blur) — drives <code>touched</code> and error-display logic</td></tr>
        <tr><td><code>setDisabledState(b)</code></td><td>model → view</td><td><code>control.disable()/enable()</code> — reflect it or the API silently doesn't work</td></tr>
      </table>
      <div class="warn">
        The subtle rule: user edits go through <code>onChange</code> <em>only</em>;
        programmatic writes arrive via <code>writeValue</code> <em>only</em>. Never
        call <code>onChange</code> from inside <code>writeValue</code> — that echoes
        model writes back at the form, re-triggering <code>valueChanges</code> and,
        with two bound controls, an infinite ping-pong.
      </div>

      <h2>Registering as a value accessor</h2>
      <div class="code"><pre>{{ registerSample }}</pre></div>
      <ul>
        <li><strong><code>multi: true</code></strong> — <code>NG_VALUE_ACCESSOR</code> is a multi-token; without it you'd blow away other registrations instead of contributing.</li>
        <li><strong><code>forwardRef</code></strong> — the provider references the class before its declaration completes (decorators evaluate at class-definition time).</li>
        <li><strong><code>useExisting</code></strong> — reuse the component instance itself; <code>useClass</code> would create a <em>second</em>, disconnected instance.</li>
      </ul>

      <h2>Live #1 — a star rating in a reactive form</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <app-star-rating [formControl]="rating" />
        <p class="row" style="margin-top:10px">
          <span class="pill">value: {{ rating.value }}</span>
          <span class="pill">touched: {{ rating.touched }}</span>
          <span class="pill">dirty: {{ rating.dirty }}</span>
          <span class="pill">disabled: {{ rating.disabled }}</span>
        </p>
        <div class="row">
          <button (click)="rating.setValue(0)">setValue(0) → writeValue</button>
          <button (click)="rating.reset()">reset() → writeValue(null)</button>
          <button class="ghost" (click)="toggleDisabled()">
            {{ rating.disabled ? 'enable()' : 'disable()' }} → setDisabledState
          </button>
        </div>
        <p class="lead" style="font-size:.95rem">
          The component knows nothing about <em>this</em> form — it just speaks the CVA
          contract, so the same control works with any <code>FormControl</code>,
          <code>formControlName</code> or <code>[(ngModel)]</code>. Note
          <code>dirty</code> flips only on star clicks (user edits via
          <code>onChange</code>), never on the buttons (programmatic writes via
          <code>writeValue</code>) — the two directions really are separate.
        </p>
      </div>

      <h2>Live #2 — a control that validates itself (CVA + Validator)</h2>
      <p>
        Register the same class under <code>NG_VALIDATORS</code> too and the control
        contributes its own errors — consumers get validation for free, no matter
        which form they embed it in:
      </p>
      <div class="demo">
        <p class="demo__title">Live — quantity stepper, allowed range 1–5 (goes out of range on purpose)</p>
        <app-qty-stepper [formControl]="qty" [min]="1" [max]="5" />
        <p class="row" style="margin-top:10px">
          <span class="pill">value: {{ qty.value }}</span>
          <span class="pill" [style.color]="qty.valid ? 'var(--green)' : 'var(--amber)'">status: {{ qty.status }}</span>
        </p>
        @if (qty.errors; as errs) {
          <p class="err">errors: {{ errs | json }}</p>
        }
        <p style="color:var(--text-muted);font-size:.85rem">
          Step past 5 (or below 1) and the <em>form control</em> turns INVALID with the
          component's own error object — the parent form wrote zero validation code.
        </p>
      </div>
      <div class="code"><pre>{{ validatorSample }}</pre></div>

      <h2>Under the hood — how formControl finds your CVA</h2>
      <div class="code"><pre>{{ underHoodSample }}</pre></div>
      <ol>
        <li>The <code>formControl</code>/<code>formControlName</code>/<code>ngModel</code> directive injects <code>NG_VALUE_ACCESSOR</code> <strong>from its own element</strong> (<code>&#64;Self()</code>) — which is why the provider must sit on your component, and why putting <code>formControlName</code> on an element with no accessor throws <em>"No value accessor for form control"</em>.</li>
        <li>If several accessors match, Angular picks by precedence: your <strong>custom</strong> accessor wins over built-in ones (checkbox/select/etc.), which win over <code>DefaultValueAccessor</code>.</li>
        <li><code>setUpControl()</code> then wires both directions: it calls your <code>registerOnChange</code>/<code>registerOnTouched</code> with the form's callbacks, and hooks the model so <code>setValue</code> flows into your <code>writeValue</code>.</li>
        <li>Validators from <code>NG_VALIDATORS</code> on the same element are composed with any validators passed to the <code>FormControl</code> itself.</li>
      </ol>

      <h2>CVA vs plain &#64;Input/&#64;Output</h2>
      <table class="cmp">
        <tr><th></th><th>value <code>input</code> + <code>output</code></th><th>ControlValueAccessor</th></tr>
        <tr><td>Works with <code>formControlName</code>/<code>ngModel</code></td><td>no</td><td>yes — both, unchanged</td></tr>
        <tr><td>touched / dirty / statuses</td><td>reimplement by hand</td><td>free</td></tr>
        <tr><td>Validation integration</td><td>manual wiring per consumer</td><td><code>NG_VALIDATORS</code>, composed automatically</td></tr>
        <tr><td><code>form.disable()</code></td><td>ignored</td><td><code>setDisabledState</code></td></tr>
        <tr><td>Best for</td><td>non-form widgets (toolbars, toggles outside forms)</td><td>anything a user "fills in"</td></tr>
      </table>

      <h2>Wrong way vs right way</h2>
      <div class="code"><pre>{{ wrongRightSample }}</pre></div>

      <div class="tip">
        Under <strong>OnPush</strong>, remember that <code>writeValue</code> is a plain
        method call from the forms runtime — not an input binding — so setting a plain
        field there won't mark the view dirty. Store the value in a
        <strong>signal</strong> (as both demos here do) and the problem disappears.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>"No value accessor for form control name: 'rating'" — what's wrong?</summary>
        <div>The element carrying <code>formControlName</code> provides no
        <code>NG_VALUE_ACCESSOR</code>: either the custom control forgot the provider
        (or the <code>multi: true</code>), or the directive was put on a plain
        <code>&lt;div&gt;</code>. The directive looks for the accessor with
        <code>&#64;Self()</code> — it must be on the same element.</div>
      </details>
      <details class="qa">
        <summary>The form stays pristine no matter what the user does. Which method is broken?</summary>
        <div>The control never calls the function from
        <code>registerOnChange</code>. User edits must be pushed via
        <code>onChange(value)</code> — that call is what updates the model AND flips
        <code>dirty</code>.</div>
      </details>
      <details class="qa">
        <summary>Why does <code>form.reset()</code> crash your CVA, and what's the fix?</summary>
        <div><code>reset()</code> calls <code>writeValue(null)</code>. A
        <code>writeValue</code> that assumes a real value
        (<code>v.toString()</code>, <code>v.length</code>…) throws. Always normalize:
        <code>this.value.set(v ?? defaultValue)</code>.</div>
      </details>
      <details class="qa">
        <summary>setValue() on control A causes valueChanges storms on control B bound to the same model. Root cause?</summary>
        <div>A CVA calling <code>onChange</code> inside <code>writeValue</code>:
        programmatic write → writeValue → onChange → model update → writeValue on the
        other control → … Keep the directions strictly separate; writeValue only
        renders.</div>
      </details>
      <details class="qa">
        <summary>How would you add a required-style validation that lives inside the custom control?</summary>
        <div>Implement <code>Validator</code> (<code>validate(control)</code> returning
        <code>ValidationErrors | null</code>) and register the class under
        <code>NG_VALIDATORS</code> with <code>multi: true, useExisting: forwardRef(…)</code>
        — exactly like the stepper demo. For async rules, it's
        <code>AsyncValidator</code> + <code>NG_ASYNC_VALIDATORS</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>CVA is the same contract native inputs use — implement it and every form API (reactive + template-driven) works with your component.</li>
        <li>Four methods, two directions: <code>writeValue</code> renders model writes; <code>onChange</code>/<code>onTouched</code> report user interaction. Never cross them.</li>
        <li>Provider must be <code>NG_VALUE_ACCESSOR</code> + <code>multi: true</code> + <code>forwardRef</code> + <code>useExisting</code>, on the component itself (<code>&#64;Self</code> lookup).</li>
        <li>Handle <code>null</code> in <code>writeValue</code> (reset) and honor <code>setDisabledState</code>.</li>
        <li>Add <code>NG_VALIDATORS</code> to ship self-validating controls; store view state in signals so OnPush just works.</li>
      </ul>

      <p><a routerLink="/di-advanced">Next: Advanced DI →</a></p>
    </article>
  `,
})
export class ControlValueAccessorLesson {
  protected readonly rating = new FormControl(3);
  protected readonly qty = new FormControl(1);

  protected toggleDisabled(): void {
    this.rating.disabled ? this.rating.enable() : this.rating.disable();
  }

  readonly flowSample = `        model → view                        view → model
FormControl.setValue(4)              user clicks the 4th star
        │                                    │
        ▼                                    ▼
   writeValue(4)                     this.onChange(4)   // fn from registerOnChange
   render 4 stars                    control.value = 4, dirty = true
                                     this.onTouched()   // fn from registerOnTouched`;

  readonly registerSample = `@Component({
  selector: 'app-star-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRating),  // class defined below this point
    multi: true,                                // contribute, don't replace
  }],
})
export class StarRating implements ControlValueAccessor { … }`;

  readonly validatorSample = `providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => QtyStepper), multi: true },
  { provide: NG_VALIDATORS,     useExisting: forwardRef(() => QtyStepper), multi: true },
]
export class QtyStepper implements ControlValueAccessor, Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const v = control.value as number;
    if (v < this.min()) return { qtyTooLow:  { min: this.min(), actual: v } };
    if (v > this.max()) return { qtyTooHigh: { max: this.max(), actual: v } };
    return null;
  }
}`;

  readonly underHoodSample = `// inside the formControl/ngModel directive (simplified):
constructor(
  @Self() @Optional() @Inject(NG_VALUE_ACCESSOR) accessors: ControlValueAccessor[],
  @Self() @Optional() @Inject(NG_VALIDATORS)     validators: Validator[],
) {
  this.valueAccessor = selectValueAccessor(accessors);
  // precedence: your custom CVA  >  built-in (checkbox/select/…)  >  DefaultValueAccessor
}

// setUpControl(control, dir) wires both directions:
dir.valueAccessor.writeValue(control.value);
dir.valueAccessor.registerOnChange((v) => updateControl(control, v));
dir.valueAccessor.registerOnTouched(() => control.markAsTouched());`;

  readonly wrongRightSample = `// WRONG — echoing model writes back into the form
writeValue(v: number) {
  this.value.set(v);
  this.onChange(v);        // ✗ infinite ping-pong risk, phantom valueChanges
}

// WRONG — dies on form.reset()
writeValue(v: string) { this.text = v.trim(); }        // v is null on reset
// RIGHT
writeValue(v: string) { this.text = (v ?? '').trim(); }

// WRONG — marking touched on every keystroke (errors flash while typing)
onInput() { this.onChange(this.text); this.onTouched(); }
// RIGHT — touched belongs to blur
onInput() { this.onChange(this.text); }
onBlur()  { this.onTouched(); }`;
}
