import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  private onTouched: () => void = () => {};

  // ControlValueAccessor — the four-method bridge between the form model and the UI:
  writeValue(v: number): void {
    this.value.set(v ?? 0);
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

@Component({
  selector: 'app-lesson-control-value-accessor',
  imports: [RouterLink, ReactiveFormsModule, StarRating],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Forms</span>
      <h1>Custom Form Controls (CVA)</h1>
      <p class="lead">
        <code>ControlValueAccessor</code> is the bridge that lets your own component
        behave like a native <code>&lt;input&gt;</code> inside Angular forms — usable
        with <code>formControlName</code>, <code>[(ngModel)]</code>, validation and
        disabled state. Implement four methods and register the provider.
      </p>

      <h2>The four methods</h2>
      <div class="code">
        <pre>writeValue(v)          // model → view: the form sets the control's value
registerOnChange(fn)   // view → model: call fn(value) when the user changes it
registerOnTouched(fn)  // call fn() to mark the control "touched" (blur)
setDisabledState(bool) // reflect form.disable()/enable() in your UI</pre>
      </div>

      <h2>Registering as a value accessor</h2>
      <div class="code">
        <pre>&#64;Component({{ '{' }}
  selector: 'app-star-rating',
  providers: [{{ '{' }}
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() =&gt; StarRating),   // forwardRef: class defined below
    multi: true,
  {{ '}' }}],
{{ '}' }})</pre>
      </div>

      <h2>Try it — a star rating in a reactive form</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <app-star-rating [formControl]="rating" />
        <p class="row" style="margin-top:10px">
          <span class="pill">value: {{ rating.value }}</span>
          <span class="pill">touched: {{ rating.touched }}</span>
          <span class="pill">disabled: {{ rating.disabled }}</span>
        </p>
        <div class="row">
          <button (click)="rating.setValue(0)">Reset</button>
          <button class="ghost" (click)="toggleDisabled()">
            {{ rating.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
        <p class="lead" style="font-size:.95rem">
          The component knows nothing about <em>this</em> form — it just speaks the CVA
          contract, so the same control works with any <code>FormControl</code> or
          <code>ngModel</code>.
        </p>
      </div>

      <div class="tip">
        Implement <code>Validator</code> (via <code>NG_VALIDATORS</code>) alongside CVA
        if the control should contribute its own validation. Always reflect
        <code>setDisabledState</code> in the UI so <code>form.disable()</code> works.
      </div>
      <div class="warn">
        Two easy mistakes: forgetting to call the registered <code>onChange(value)</code>
        — then the form never sees user edits and stays <code>pristine</code>; and
        forgetting <code>onTouched()</code> on blur — then <code>touched</code> never
        flips and your "show errors when touched" logic never triggers. The provider
        <strong>must</strong> use <code>multi: true</code> so the control can coexist with
        other value accessors, and <code>forwardRef</code> because the class is
        referenced before its declaration.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>CVA makes a custom component a first-class form control.</li>
        <li>Implement <code>writeValue</code>, <code>registerOnChange</code>, <code>registerOnTouched</code>, <code>setDisabledState</code>.</li>
        <li>Register with <code>NG_VALUE_ACCESSOR</code> (multi) + <code>forwardRef</code>.</li>
        <li>Call the registered <code>onChange</code> to push user edits back to the model.</li>
      </ul>

      <p><a routerLink="/di-advanced">Next: Advanced DI →</a></p>
    </article>
  `,
})
export class ControlValueAccessorLesson {
  protected readonly rating = new FormControl(3);

  protected toggleDisabled(): void {
    this.rating.disabled ? this.rating.enable() : this.rating.disable();
  }
}
