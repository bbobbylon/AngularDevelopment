import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** A custom form control: a 1–5 star rating that plugs into Angular forms. */
@Component({
  selector: 'app-star-rating',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StarRating), multi: true },
  ],
  templateUrl: './star-rating.html',
})
export class StarRating implements ControlValueAccessor {
  /**
   * The five stars.
   */
  protected readonly stars = [1, 2, 3, 4, 5];
  /**
   * The current rating — the view's copy of the form control's value.
   */
  protected readonly value = signal(0);
  /**
   * The star being hovered, for the preview. Purely visual; never written to the
   * form.
   */
  protected readonly hover = signal(0);
  /**
   * Whether the control is disabled. Set by the form, not by this component.
   */
  protected readonly disabled = signal(false);

  /**
   * The callback that pushes a new value into the form control. Supplied by
   * `registerOnChange`; a no-op until then, which is why it is initialised rather
   * than left undefined.
   */
  private onChange: (v: number) => void = () => {};
  /**
   * The callback that marks the control touched. Supplied by `registerOnTouched`.
   */
  protected onTouched: () => void = () => {};

  // ControlValueAccessor — the four-method bridge between the form model and the UI:
  /**
   * Model → view. The form calls this when its value changes.
   *
   * The `?? 0` is not defensive padding: `form.reset()` passes `null`, and a CVA
   * that does not handle it renders a broken control after every reset.
   *
   * @param v The value from the form.
   */
  writeValue(v: number): void {
    this.value.set(v ?? 0); // handle null: form.reset() passes null
  }
  /**
   * Receives the callback for pushing values back to the form.
   *
   * @param fn The callback to store.
   */
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  /**
   * Receives the callback for marking the control touched.
   *
   * @param fn The callback to store.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  /**
   * Applies the form's disabled state.
   *
   * The form is the source of truth here — this is why `[disabled]` on a
   * reactive-form control is a mistake and `control.disable()` is not.
   *
   * @param isDisabled Whether the control is disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /**
   * View → model. Records a rating and pushes it into the form.
   *
   * Calls both callbacks: `onChange` for the value, `onTouched` because the user
   * has now interacted. Skipping the second leaves the control forever `pristine`
   * and any "show errors once touched" logic silently dead.
   *
   * @param s The rating.
   */
  protected rate(s: number): void {
    if (this.disabled()) return;
    this.value.set(s);
    this.onChange(s); // ← push the new value into the form control
    this.onTouched();
  }
}
