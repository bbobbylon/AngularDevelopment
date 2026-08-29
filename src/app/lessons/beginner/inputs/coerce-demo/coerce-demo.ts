import { Component, computed, input, numberAttribute } from '@angular/core';

/**
 * Second demo child — proves that a `transform` coerces the bound value BEFORE it
 * reaches the signal. The parent binds a raw string; this child receives a real
 * number. The classic attribute gotcha, made visible.
 */
@Component({
  selector: 'app-coerce-demo',
  templateUrl: './coerce-demo.html',
  styleUrl: './coerce-demo.css',
})
export class CoerceDemo {
  /** numberAttribute turns "42" (a string) into 42 (a number) on the way in. */
  readonly size = input(0, { transform: numberAttribute });
  /**
   * The runtime type of {@link size}, which is the demo's whole point: the parent
   * binds a string and the child receives a genuine `number`.
   */
  readonly typeName = computed(() => typeof this.size());
}
