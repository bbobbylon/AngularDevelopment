import { Component, inject } from '@angular/core';
import { Elevate } from '../elevate/elevate';

/**
 * The component composes Elevate in — and, because a host directive is a
 * regular provider on the host element, the component can inject its own
 * Elevate instance and render its state.
 */
@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],
  templateUrl: './fancy-card.html',
  styleUrl: './fancy-card.css',
})
export class FancyCard {
  /** The host directive's instance — injectable like any element provider. */
  protected readonly elevate = inject(Elevate);
}
