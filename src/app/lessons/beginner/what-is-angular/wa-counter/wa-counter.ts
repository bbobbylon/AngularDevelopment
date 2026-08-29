import { Component, computed, signal } from '@angular/core';

/**
 * Live demo #1 — the smallest useful component: a counter.
 * It exists to show the three parts of every component working together
 * (template + class + the binding that glues them) and to prove that you
 * never touch the DOM yourself: you change a value, Angular re-renders.
 */
@Component({
  selector: 'app-wa-counter',
  templateUrl: './wa-counter.html',
  styleUrl: './wa-counter.css',
})
export class WaCounter {
  /** A signal: a reactive value. Reading it (count()) subscribes the template. */
  readonly count = signal(0);
  /** A computed signal: re-derives itself only when `count` changes. */
  readonly doubled = computed(() => this.count() * 2);
}
