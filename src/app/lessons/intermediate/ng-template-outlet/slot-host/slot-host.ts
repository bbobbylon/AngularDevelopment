import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, input } from '@angular/core';

/** Shell component that renders any TemplateRef passed to it as an input(). */
@Component({
  selector: 'app-slot-host',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './slot-host.html',
  styleUrl: './slot-host.css',
})
export class SlotHost {
  /**
   * The template to render. Passing a `TemplateRef` as an input is what lets the
   * caller own the markup while this component owns the placement.
   */
  template = input.required<TemplateRef<unknown>>();
  /**
   * The context object the template's `let-` variables destructure.
   */
  ctx      = input<Record<string, unknown>>({});
}
