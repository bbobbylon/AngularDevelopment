import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

/**
 * Live demo #2 — fine-grained reactivity. A tiny "cart" whose total is a
 * computed signal. Adding an item updates only what depends on the data;
 * you never recompute or re-render by hand.
 */
@Component({
  selector: 'app-wa-cart',
  imports: [CurrencyPipe],
  templateUrl: './wa-cart.html',
  styleUrl: './wa-cart.css',
})
export class WaCart {
  /**
   * Id source for cart lines. A counter rather than array length, so ids stay
   * unique after a removal.
   */
  private nextId = 1;
  /**
   * The cart contents — the single source of truth this demo derives everything
   * else from.
   */
  readonly items = signal<{ id: number; name: string; price: number }[]>([]);
  /** Derived: number of items. Recomputes only when `items` changes. */
  readonly count = computed(() => this.items().length);
  /** Derived: sum of prices. Angular keeps this in sync with `items` for you. */
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  /**
   * Adds a line to the cart.
   *
   * Replaces the array rather than pushing to it. Signals notify on assignment,
   * so an in-place `push` would change the data and update nothing — the habit
   * that matters most when the app later moves to `OnPush`.
   *
   * @param name  Item name.
   * @param price Item price.
   */
  add(name: string, price: number) {
    // Replace the array (new reference) rather than mutating it in place —
    // signals notify on assignment, and this is the habit that keeps OnPush happy.
    this.items.update((list) => [...list, { id: this.nextId++, name, price }]);
  }
}
