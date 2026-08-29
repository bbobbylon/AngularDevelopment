import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WaCounter } from './wa-counter/wa-counter';
import { WaCart } from './wa-cart/wa-cart';

/**
 * Lesson: What is Angular? — the first page of the curriculum.
 *
 * Rather than restate the marketing summary, this lesson makes the core idea
 * tangible: a framework is a machine that re-renders your UI from your data.
 * Two live demos prove it (a signal-driven counter and a fine-grained cart
 * total), every code sample is walked line by line, and the component model,
 * bootstrap pipeline, render pipeline, standalone-vs-NgModule history and the
 * classic beginner misconceptions are all covered so a newcomer finishes with
 * a real mental model — not a list of buzzwords.
 */
@Component({
  selector: 'app-lesson-what-is-angular',
  imports: [RouterLink, WaCounter, WaCart],
  templateUrl: './what-is-angular.html',
  styleUrl: './what-is-angular.css',
})
export class WhatIsAngular {
  /**
   * Sample: the counter component, annotated — the smallest complete Angular
   * component.
   */
  protected readonly counterSample = `@Component({
  selector: 'app-wa-counter',          // the tag you write: <app-wa-counter />
  template: \`
    <p>{{ count() }}</p>               <!-- interpolation: prints & tracks the signal -->
    <p>doubled: {{ doubled() }}</p>     <!-- derived value, updates automatically -->
    <button (click)="count.set(count() + 1)">+1</button>  <!-- event binding -->
  \`,
})
export class WaCounter {
  count = signal(0);                    // a reactive value, starts at 0
  doubled = computed(() => this.count() * 2);  // recomputes only when count changes
}`;

  /**
   * Sample: the cart's state, showing one source of truth with two derivations.
   */
  protected readonly cartSample = `export class WaCart {
  items = signal<{ id: number; name: string; price: number }[]>([]); // source of truth
  count = computed(() => this.items().length);                       // derived
  total = computed(() => this.items().reduce((s, i) => s + i.price, 0)); // derived

  add(name: string, price: number) {
    // new array (new reference) → the signal notifies; never push() in place
    this.items.update(list => [...list, { id: nextId++, name, price }]);
  }
}`;

  /**
   * Sample: `main.ts` and `bootstrapApplication` — the standalone entry point,
   * with no root `NgModule` in sight.
   */
  protected readonly bootstrapSample = `// main.ts — the single entry point of the app
bootstrapApplication(App, {
  providers: [
    provideRouter(routes),     // turn on routing with your URL → component map
    provideHttpClient(),       // make HttpClient injectable for API calls
  ],
});`;
}
