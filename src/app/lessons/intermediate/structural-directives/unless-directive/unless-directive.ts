import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

/** `*appUnless` — the inverse of @if: renders its template when the value is falsy. */
@Directive({ selector: '[appUnless]' })
export class UnlessDirective {
  /**
   * The template the star syntax wrapped — the blueprint, not yet in the DOM.
   */
  private readonly tpl = inject(TemplateRef<unknown>);
  /**
   * Where views get stamped out.
   */
  private readonly vcr = inject(ViewContainerRef);
  /**
   * Whether the view is currently stamped, so a repeated `false` does not stamp it
   * twice.
   */
  private rendered = false;

  /**
   * Stamps the template when the condition is false, clears it when true.
   *
   * A setter rather than a signal input because this is deliberately the classic
   * form: it is what `*ngIf` looks like inside, and the star syntax desugars to an
   * input binding, so the setter is where the reaction has to live.
   *
   * @param condition Render the content when this is false.
   */
  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl); // stamp the template into the DOM
      this.rendered = true;
    } else if (condition && this.rendered) {
      this.vcr.clear(); // remove the previously-stamped view
      this.rendered = false;
    }
  }
}
