import { Component, inject } from '@angular/core';
import { Elevate } from '../elevate/elevate';

/**
 * The component composes Elevate in — and, because a host directive is a
 * regular provider on the host element, the component can inject its own
 * Elevate instance and render its state.
 *
 * `liftedChange` is re-exported under the alias `lifted`, so a *consumer* of
 * `app-fancy-card` can also listen for it with `(lifted)` — proof, alongside
 * `StatusCard`'s re-exported input, that both directions of the private-by-
 * default rule work the same way.
 */
@Component({
  selector: 'app-fancy-card',
  hostDirectives: [{ directive: Elevate, outputs: ['liftedChange: lifted'] }],
  templateUrl: './fancy-card.html',
  styleUrl: './fancy-card.css',
})
export class FancyCard {
  /** The host directive's instance — injectable like any element provider. */
  protected readonly elevate = inject(Elevate);
}
