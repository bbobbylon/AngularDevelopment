import { Directive, ElementRef, inject } from '@angular/core';

/** Marks a tab panel body — picked up by contentChildren() in TabGroup */
@Directive({ selector: '[tabPanel]', standalone: true })
export class TabPanel {
  /**
   * The host element, so {@link TabGroup} can show and hide the projected panel.
   */
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
}
