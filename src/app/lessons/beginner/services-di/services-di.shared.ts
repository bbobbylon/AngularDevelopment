/**
 * Declarations shared by the ServicesDi lesson and its demo components.
 *
 * Hoisted out of `services-di.ts` when each demo component moved into its own
 * folder: both the lesson and the children need these, and importing them
 * from the lesson file would make the parent/child imports circular.
 */

import { Injectable, type OnDestroy, computed, inject, signal } from '@angular/core';

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
 * A tiny root-provided log, so the "when does `ngOnDestroy` actually run?"
 * demo has something on screen to point at. A real app would reach for
 * structured logging or a monitoring tool; this exists purely to make an
 * otherwise-invisible lifecycle event visible on the page.
 */
@Injectable({ providedIn: 'root' })
export class LifecycleLog {
  private readonly lines = signal<string[]>([]);
  /**
   * The log, oldest first.
   */
  readonly entries = this.lines.asReadonly();
  /**
   * Appends a line.
   *
   * @param line What happened.
   */
  record(line: string) {
    this.lines.update((l) => [...l, line]);
  }
}

/**
 * Deliberately has NO `providedIn`. It becomes injectable only once something
 * lists it in a `providers` array — the star of the component-scoped-instance demo.
 *
 * Also implements {@link OnDestroy}, which the {@link CartService} above never
 * needs to: a root service's owner is the whole application, so its
 * `ngOnDestroy` would only ever run when the app itself closes. This one is
 * owned by whichever component provides it, so it is actually destroyed —
 * see the "Service teardown" section, which removes a widget live and watches
 * the log below gain a line the instant it happens.
 */
@Injectable()
export class CounterService implements OnDestroy {
  private readonly log = inject(LifecycleLog);

  /**
   * The count. Per-instance, because this service is provided by the component
   * rather than at root.
   */
  readonly count = signal(0);

  /**
   * Stands in for a resource a real service might hold open — a WebSocket, a
   * polling interval, a subscription — so the teardown demo has something
   * that visibly keeps running until `ngOnDestroy` stops it.
   */
  readonly heartbeat = signal(0);

  /** The interval driving {@link heartbeat}. Cleared in `ngOnDestroy`. */
  private readonly timer = setInterval(() => this.heartbeat.update((h) => h + 1), 400);

  constructor() {
    this.log.record('CounterService: created');
  }

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

  /**
   * Called once, when the injector that owns this instance is destroyed —
   * for a component-provided service, that is when the component itself is
   * destroyed. Without this, {@link timer} would keep firing forever, on an
   * object nothing can reach any more.
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.log.record('CounterService: destroyed — heartbeat cleared');
  }
}
