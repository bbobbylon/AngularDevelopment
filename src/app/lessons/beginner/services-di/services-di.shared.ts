/**
 * Declarations shared by the ServicesDi lesson and its demo components.
 *
 * Hoisted out of `services-di.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

import { Injectable, computed, signal } from '@angular/core';

/**
 * A singleton service. `providedIn: 'root'` registers it once for the whole app,
 * so every injector returns the same instance — perfect for shared state.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  /**
   * The cart contents. **Private** — the only way in is through the methods below,
   * which is what makes this a service rather than a shared mutable object.
   */
  private readonly items = signal<string[]>([]);
  /**
   * How many items are in the cart.
   */
  readonly count = computed(() => this.items().length);
  /**
   * A read-only view of the items for consumers. `asReadonly()` hands out the
   * signal's *value* without its `set`/`update`, so a component can subscribe to
   * changes but cannot make them behind the service's back.
   */
  readonly list = this.items.asReadonly();

  /**
   * Adds an item.
   *
   * @param item The item to add.
   */
  add(item: string) {
    this.items.update((i) => [...i, item]);
  }
  /**
   * Removes the item at an index.
   *
   * @param index Position to drop.
   */
  remove(index: number) {
    this.items.update((i) => i.filter((_, idx) => idx !== index));
  }
  /**
   * Empties the cart.
   */
  clear() {
    this.items.set([]);
  }
}

/**
 * Deliberately has NO `providedIn`. It becomes injectable only once something
 * lists it in a `providers` array — the star of the component-scoped-instance demo.
 */
@Injectable()
export class CounterService {
  /**
   * The count. Per-instance, because this service is provided by the component
   * rather than at root.
   */
  readonly count = signal(0);
  /**
   * Increments the count.
   */
  increment() {
    this.count.update((c) => c + 1);
  }
  /**
   * Resets the count to zero.
   */
  reset() {
    this.count.set(0);
  }
}
