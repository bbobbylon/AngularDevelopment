import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Property & Attribute Binding — `[prop]="expr"` and its variants.
 *
 * Covers the distinction the lesson exists for: `[x]` sets a **DOM property**,
 * while `[attr.x]` sets an **HTML attribute**. They look interchangeable and are
 * not — attributes are the initial value in the markup, properties are the live
 * state of the element — which is why `[attr.colspan]` works and `[colspan]`
 * does not.
 *
 * Also covers `[class.x]`, `[style.x]`, and why interpolation into an attribute
 * is a different mechanism from binding to a property.
 *
 * The live demos bind a checkbox to `disabled`, an image `src` to a URL, and a
 * table cell's `colspan` through `[attr.]`.
 */
@Component({
  selector: 'app-lesson-property-binding',
  imports: [RouterLink],
  styleUrl: './property-binding.css',
  templateUrl: './property-binding.html',
})
export class PropertyBinding {
  /**
   * Backs the `[disabled]` demo — a genuine DOM *property*, so `[disabled]` is
   * the correct form and `[attr.disabled]` would be the wrong one.
   */
  protected readonly disabled = signal(false);
  /**
   * Backs the `[src]` demo. Points at a real remote image so the binding visibly
   * does something when it changes.
   */
  protected readonly url = signal('https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif');
  /**
   * Backs the `[attr.colspan]` demo. `colspan` has no matching DOM property, which
   * is exactly why it needs the `attr.` prefix.
   */
  protected readonly span = signal(2);

  /**
   * A hand-written sketch of the instructions the compiler emits for a property
   * binding, shown in the "under the hood" panel.
   *
   * Approximate rather than real output: the point is that a binding compiles to
   * an imperative `setProperty` call guarded by a dirty check — not that this is
   * byte-for-byte what Angular generates.
   */
  readonly underTheHoodSample = `// roughly what the compiler generates for:
// <button [disabled]="disabled()">
// <img [src]="url()" [alt]="caption()">

function PropertyBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();                                  // move to <button>'s node slot
    ɵɵproperty('disabled', ctx.disabled());       // setProperty-style: el.disabled = value

    ɵɵadvance();                                  // move to <img>'s node slot
    ɵɵproperty('src', ɵɵsanitizeUrl(ctx.url()));  // sanitized BEFORE setProperty
    ɵɵproperty('alt', 'preview of ' + ctx.url());
  }
}

// compare with an attribute binding, e.g. [attr.colspan]="span()":
function AttrBinding_UpdateBlock(rf, ctx) {
  if (rf & 2 /* Update */) {
    ɵɵadvance();
    ɵɵattribute('colspan', ctx.span());  // el.setAttribute / el.removeAttribute(null)
  }
}`;
}
