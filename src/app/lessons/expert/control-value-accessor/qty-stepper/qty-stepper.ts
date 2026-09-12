import { Component, effect, forwardRef, input, signal } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

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
  templateUrl: './qty-stepper.html',
  styleUrl: './qty-stepper.css',
})
export class QtyStepper implements ControlValueAccessor, Validator {
  /**
   * The lowest allowed quantity.
   */
  readonly min = input(1);
  /**
   * The highest allowed quantity.
   */
  readonly max = input(5);

  /**
   * The current quantity.
   */
  protected readonly value = signal(1);
  /**
   * Whether the control is disabled.
   */
  protected readonly disabled = signal(false);

  /**
   * The value callback, from `registerOnChange`.
   */
  private onChange: (v: number) => void = () => {};
  /**
   * The touched callback, from `registerOnTouched`.
   */
  private onTouched: () => void = () => {};
  /**
   * The callback from `registerOnValidatorChange` — call it whenever
   * something the validator itself depends on changes, so the forms system
   * knows to re-run `validate()` even though `control.value` didn't move.
   */
  private onValidatorChange: () => void = () => {};

  /**
   * Re-runs validation whenever {@link min} or {@link max} change.
   *
   * Without this, changing `[max]` from 5 to 3 while the value sits at 4
   * leaves the control reporting VALID forever — the forms system has no way
   * to know the validator's own configuration moved, since nothing calls
   * `validate()` again until the *value* next changes.
   */
  private readonly revalidateOnRangeChange = effect(() => {
    this.min();
    this.max();
    this.onValidatorChange();
  });

  /**
   * Model → view.
   *
   * @param v The value from the form.
   */
  writeValue(v: number): void {
    this.value.set(v ?? this.min());
  }
  /**
   * Receives the value callback.
   *
   * @param fn The callback to store.
   */
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  /**
   * Receives the touched callback.
   *
   * @param fn The callback to store.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  /**
   * Applies the form's disabled state.
   *
   * @param isDisabled Whether the control is disabled.
   */
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

  /**
   * Receives the callback that tells the forms system "re-run `validate()`
   * now" — even though nobody called `onChange`. Stored, then fired by
   * {@link revalidateOnRangeChange} whenever `min`/`max` move.
   *
   * @param fn The callback to store.
   */
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /**
   * Steps the quantity and pushes it into the form.
   *
   * Deliberately does **not** clamp to the range: letting the value go out of
   * bounds is what makes `validate()` fire and the form flip to `INVALID`, which
   * is the demo. A clamping control would be more polite and would show nothing.
   *
   * @param delta How much to step by.
   */
  protected step(delta: number): void {
    if (this.disabled()) return;
    this.value.update((v) => v + delta); // intentionally unclamped — watch validate()
    this.onChange(this.value());
    this.onTouched();
  }
}
