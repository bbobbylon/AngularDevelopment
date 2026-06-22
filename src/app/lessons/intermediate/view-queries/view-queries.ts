import { Component, ElementRef, viewChild, viewChildren, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-view-queries',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Components &amp; Templates</span>
      <h1>View Queries</h1>
      <p class="lead">
        View queries give a component a typed handle to elements, directives or child
        components in <em>its own</em> template. The modern signal queries —
        <code>viewChild()</code> and <code>viewChildren()</code> — return signals that
        stay in sync as the view changes.
      </p>

      <h2>Signal queries</h2>
      <div class="code">
        <pre>// returns Signal&lt;ElementRef | undefined&gt;
box = viewChild&lt;ElementRef&lt;HTMLInputElement&gt;&gt;('box');

// required — never undefined (errors if missing)
title = viewChild.required&lt;ElementRef&gt;('title');

// a live list — Signal&lt;readonly ElementRef[]&gt;
items = viewChildren&lt;ElementRef&gt;('item');

focus() {{ '{' }} this.box()?.nativeElement.focus(); {{ '}' }}</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="field">
          <input #box placeholder="I get focused & filled programmatically" style="width:340px" />
        </div>
        <div class="row" style="margin-bottom:14px">
          <button (click)="focusBox()">Focus via viewChild()</button>
          <button class="ghost" (click)="fillBox()">Set value</button>
        </div>

        <p>Three queried rows:</p>
        <p #item class="pill">Row A</p>
        <p #item class="pill">Row B</p>
        <p #item class="pill">Row C</p>
        <div class="row" style="margin-top:10px">
          <button (click)="count.set(rows().length)">Count rows via viewChildren()</button>
          <span class="pill">counted: {{ count() }}</span>
        </div>
      </div>

      <div class="tip">
        Signal queries resolve after the view renders — read them in event handlers,
        an <code>effect()</code>, or <code>afterNextRender()</code>, not in the
        constructor. The old decorator form is <code>&#64;ViewChild('box') box!: ElementRef</code>,
        available in <code>ngAfterViewInit</code>.
      </div>
      <div class="warn">
        View queries can't see inside an <code>&#64;if</code>/<code>&#64;for</code> until
        that content actually renders, so a query may be <code>undefined</code> until the
        condition is true — that's exactly why signal queries (which re-resolve
        reactively) are nicer than the decorator form. Use <code>contentChild</code> (not
        <code>viewChild</code>) for projected content, and <code>read:</code> to choose
        the token returned.
      </div>

      <h2>Querying child components & directives</h2>
      <div class="code">
        <pre>// grab a child component instance and call its API
chart = viewChild(ChartComponent);
refresh() {{ '{' }} this.chart()?.redraw(); {{ '}' }}

// read() to get a specific token from the matched element
ref = viewChild('box', {{ '{' }} read: ElementRef {{ '}' }});</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>viewChild()</code>/<code>viewChildren()</code> return reactive signals.</li>
        <li>Use <code>.required()</code> when the target must exist.</li>
        <li>Query by template reference, component type, or directive type.</li>
        <li><code>read:</code> selects which token to return from the matched node.</li>
      </ul>

      <p><a routerLink="/ng-template-outlet">Next: ng-template &amp; ngTemplateOutlet →</a></p>
    </article>
  `,
})
export class ViewQueries {
  protected readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  protected readonly rows = viewChildren<ElementRef<HTMLElement>>('item');
  protected readonly count = signal(0);

  protected focusBox() {
    this.box()?.nativeElement.focus();
  }
  protected fillBox() {
    const el = this.box()?.nativeElement;
    if (el) el.value = 'Set from the component!';
  }
}
