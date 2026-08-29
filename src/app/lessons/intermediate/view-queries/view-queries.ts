import { Component, ElementRef, effect, signal, viewChild, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: view queries — viewChild() / viewChildren() and the decorator forms.
 *
 * Beyond "grab an element": the signal queries re-resolve reactively (a live
 * demo toggles a queried input in/out of an @if and shows the signal flipping
 * defined/undefined), the resolve-timing rules (undefined in the constructor;
 * read in effect/afterNextRender/handlers), the read: token, required queries,
 * viewChild vs contentChild, and the decorator↔signal comparison — with the
 * pitfalls that show up in exams.
 */
@Component({
  selector: 'app-lesson-view-queries',
  imports: [RouterLink],
  templateUrl: './view-queries.html',
  styleUrl: './view-queries.css',
})
export class ViewQueries {
  /**
   * An input in the view, queried by template reference variable.
   */
  protected readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  /**
   * A live list of the repeated rows.
   */
  protected readonly rows = viewChildren<ElementRef<HTMLElement>>('item');

  // --- reactive re-resolution demo ---
  /**
   * Whether the conditional target is rendered.
   */
  protected readonly showTarget = signal(false);
  /**
   * The conditional target. Resolves to `undefined` when it is not in the DOM,
   * which is why the non-required form returns an optional.
   */
  protected readonly target = viewChild<ElementRef<HTMLInputElement>>('target');
  /**
   * What the effect last saw.
   */
  protected readonly effectLog = signal('(waiting)');

  /**
   * Logs every time the query resolves or clears.
   *
   * The point of the demo: a `viewChild` is a **signal**, so reading it inside an
   * `effect` re-runs when the element appears or disappears. The old decorator
   * queries had no equivalent — you got `ngAfterViewInit` once and were on your
   * own after that.
   */
  constructor() {
    // Reading a query signal inside effect() re-runs whenever it resolves/clears.
    effect(() => {
      this.effectLog.set(this.target() ? 'resolved → ElementRef' : 'cleared → undefined');
    });
  }

  /**
   * Focuses the queried input. The `?.` is doing real work: a view query is
   * `undefined` until the view exists.
   */
  protected focusBox() {
    this.box()?.nativeElement.focus();
  }
  /**
   * Writes into the queried input's DOM value directly.
   */
  protected fillBox() {
    const el = this.box()?.nativeElement;
    if (el) el.value = 'Set from the component!';
  }

  /**
   * Sample: the query API — optional, `required`, and the plural form.
   */
  protected readonly apiSample = `// Signal<ElementRef<HTMLInputElement> | undefined>
box = viewChild<ElementRef<HTMLInputElement>>('box');

// required — never undefined (throws if missing at resolve time)
title = viewChild.required<ElementRef>('title');

// a live list — Signal<readonly ElementRef[]>
items = viewChildren<ElementRef>('item');

focus() { this.box()?.nativeElement.focus(); }`;

  /**
   * Sample: querying a component instance rather than an element, and the `read`
   * option for choosing which token comes back from a matched node.
   */
  protected readonly readSample = `// grab a child component instance and call its API
chart = viewChild(ChartComponent);
refresh() { this.chart()?.redraw(); }

// read: choose which token to return from the matched node
elRef  = viewChild('box', { read: ElementRef });
vcr    = viewChild('slot', { read: ViewContainerRef });

// required list
tabs = viewChildren(TabComponent);   // Signal<readonly TabComponent[]>`;
}
