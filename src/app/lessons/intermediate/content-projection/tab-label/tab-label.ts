import { Directive, ElementRef, inject } from '@angular/core';

/** Marks a tab label — picked up by contentChildren() in TabGroup */
@Directive({ selector: '[tabLabel]', standalone: true })
export class TabLabel {
  /**
   * The host element, so {@link TabGroup} can move the projected label's DOM.
   */
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
}
