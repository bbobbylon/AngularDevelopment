import { Component, model } from '@angular/core';

/**
 * The demo child: a stepper whose value is a `model()`, so a parent can bind it
 * with `[(value)]`.
 */
@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
})
export class Stepper {
  /** model() creates a writable, two-way bindable signal input. */
  readonly value = model(0);

  /**
   * Increments and emits. Writing to a `model()` is what fires its implicit
   * `valueChange`.
   */
  inc() {
    this.value.update((v) => v + 1);
  }
  /**
   * Decrements and emits.
   */
  dec() {
    this.value.update((v) => v - 1);
  }
}
