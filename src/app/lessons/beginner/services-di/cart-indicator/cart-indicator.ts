import { Component, inject } from '@angular/core';
import { CartService } from '../services-di.shared';

/** A separate component that shares the same CartService instance. */
@Component({
  selector: 'app-cart-indicator',
  templateUrl: './cart-indicator.html',
})
export class CartIndicator {
  /**
   * The shared cart. Injected, not passed in — this component sits several levels
   * below whoever owns the cart, and DI is what spares every layer in between
   * from having to know about it.
   */
  protected readonly cart = inject(CartService);
}
