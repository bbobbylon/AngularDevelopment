import { Component, ElementRef, effect, signal, viewChild, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, Predict, Quiz, Remember],
  templateUrl: './view-queries.html',
  styleUrl: './view-queries.css',
})
export class ViewQueries {
  /**
   * The three-hook resolve-timing puzzle used by the ask-before-telling block.
   *
   * Nothing throws and nothing looks wrong — the constructor and `ngOnInit` both
   * log `undefined` for a query that plainly matches an element sitting right
   * there in the template. The only hook named for what it actually waits for is
   * `ngAfterViewInit`, and that naming is the whole lesson.
   *
   * Held in the class rather than the template because the snippet is full of
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly resolveTimingSample = `export class Example {
  box = viewChild<ElementRef>('box');

  constructor() {
    console.log('constructor:', this.box());
  }

  ngOnInit() {
    console.log('ngOnInit:', this.box());
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit:', this.box());
  }
}
// template: <input #box>  — the element is there from the start, unconditionally`;

  /**
   * The self-test, on `static: true` combined with conditional content. Every
   * wrong answer treats "static" as meaning something friendlier than what it
   * actually does, which is exactly the trap the exam sets.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: 'el is undefined in ngOnInit, and stays undefined forever — even after the *ngIf becomes true — because static: true resolves once, during the first pass, and never re-checks.',
      correct: true,
      why: '`static: true` is a promise you make to Angular: "this target is never removed by a structural directive." Angular takes you at your word, resolves once during the very first change-detection pass, and never looks again. Break the promise — put it behind an `*ngIf` that starts false — and you get a permanently stale `undefined`, with no error to tell you why.',
    },
    {
      text: 'Angular throws a compile-time error, because static queries can’t target conditional content.',
      why: 'There is no such compile-time check. `static: true` compiles fine on any target; the failure is a silent, runtime one — a reference that never resolves — which is exactly what makes it dangerous.',
    },
    {
      text: 'el is undefined in ngOnInit, but updates automatically once the *ngIf becomes true.',
      why: 'That is the behavior of `static: false` (the decorator default) or a signal query — both re-resolve after every check. `static: true` opts out of that re-checking entirely; "static" means it will not update, by design.',
    },
    {
      text: 'el resolves correctly to the ElementRef even though the *ngIf starts false, because "static" means "always resolve immediately."',
      why: '"Static" describes the *target*, not a guarantee about *when* it exists. Resolving immediately only works if the node is actually there on the first pass — asking for it early does not make an absent node appear.',
    },
  ];
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
