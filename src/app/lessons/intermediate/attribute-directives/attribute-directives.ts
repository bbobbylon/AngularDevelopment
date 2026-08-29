import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HighlightDirective } from './highlight-directive/highlight-directive';
import { BadgeDirective } from './badge-directive/badge-directive';
import { DemoTooltipDirective } from './demo-tooltip-directive/demo-tooltip-directive';

/**
 * Lesson: Custom Attribute Directives — behaviour without a template.
 *
 * A directive is a component without a view: it attaches to an existing element
 * and changes how it looks or behaves. Covers signal inputs on directives, the
 * `host` metadata object (which replaces `@HostBinding` / `@HostListener`),
 * `ElementRef` against `Renderer2`, `exportAs`, and cleanup.
 *
 * Three directives are defined and demonstrated: {@link HighlightDirective} for
 * host bindings, {@link BadgeDirective} for `exportAs` and derived ARIA, and
 * {@link DemoTooltipDirective} for creating DOM — and disposing of it.
 *
 * @see shared/tooltip.directive — the app's own tooltip, built on this pattern.
 */
@Component({
  selector: 'app-lesson-attribute-directives',
  standalone: true,
  imports: [RouterLink, HighlightDirective, BadgeDirective, DemoTooltipDirective],
  templateUrl: './attribute-directives.html',
  styleUrl: './attribute-directives.css',
})
export class AttributeDirectives {}
