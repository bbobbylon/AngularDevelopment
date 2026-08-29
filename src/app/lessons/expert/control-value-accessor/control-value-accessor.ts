import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StarRating } from './star-rating/star-rating';
import { QtyStepper } from './qty-stepper/qty-stepper';

/**
 * Lesson: ControlValueAccessor — the contract that makes ANY component a
 * first-class form control. Two live custom controls (a star rating, and a
 * quantity stepper that also VALIDATES itself), the two-direction data flow,
 * how formControlName finds the accessor under the hood, and the classic
 * mistakes (missing onChange, echo loops, forgotten multi:true).
 */
@Component({
  selector: 'app-lesson-control-value-accessor',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe, StarRating, QtyStepper],
  styleUrl: './control-value-accessor.css',
  templateUrl: './control-value-accessor.html',
})
export class ControlValueAccessorLesson {
  /**
   * The star-rating control's form control.
   */
  protected readonly rating = new FormControl(3);
  /**
   * The quantity stepper's form control.
   */
  protected readonly qty = new FormControl(1);

  /**
   * Toggles the rating control's disabled state, so `setDisabledState` can be seen
   * firing.
   */
  protected toggleDisabled(): void {
    this.rating.disabled ? this.rating.enable() : this.rating.disable();
  }

  /**
   * Sample: the two directions of the bridge, and which of the four methods
   * handles each.
   */
  readonly flowSample = `        model → view                        view → model
FormControl.setValue(4)              user clicks the 4th star
        │                                    │
        ▼                                    ▼
   writeValue(4)                     this.onChange(4)   // fn from registerOnChange
   render 4 stars                    control.value = 4, dirty = true
                                     this.onTouched()   // fn from registerOnTouched`;

  /**
   * Sample: registering with `NG_VALUE_ACCESSOR`.
   *
   * The `forwardRef` is required, not stylistic: the class is referenced inside its
   * own decorator, before the binding exists.
   */
  readonly registerSample = `@Component({
  selector: 'app-star-rating',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRating),  // class defined below this point
    multi: true,                                // contribute, don't replace
  }],
})
export class StarRating implements ControlValueAccessor { … }`;

  /**
   * Sample: a control that is also its own validator, via `NG_VALIDATORS`.
   */
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

  /**
   * Sample: how `formControlName` finds the accessor — a `@Self()` injection of
   * the multi-provided `NG_VALUE_ACCESSOR` array, which is why the provider has to
   * be on the component itself.
   */
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

  /**
   * Sample: the echo bug.
   *
   * Calling `onChange` from inside `writeValue` sends the form's own value straight
   * back to it, producing an infinite loop or a `pristine` control that reports
   * itself dirty. `writeValue` receives; it never emits.
   */
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
