import { Component, ElementRef, computed, effect, signal, viewChild, viewChildren } from '@angular/core';
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
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Components &amp; Templates</span>
      <h1>View Queries</h1>
      <p class="lead">
        View queries give a component a typed handle to elements, directives or child
        components in <em>its own</em> template. The modern signal queries —
        <code>viewChild()</code> and <code>viewChildren()</code> — return signals that
        re-resolve as the view changes, so you read them like any other signal.
      </p>

      <h2>Signal queries</h2>
      <div class="code"><pre>{{ apiSample }}</pre></div>

      <h2>Focus &amp; fill via viewChild()</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="field" style="margin-bottom:12px">
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
          <span class="pill">viewChildren() sees: {{ rows().length }} rows</span>
        </div>
      </div>

      <h2>Queries re-resolve reactively</h2>
      <p>
        This is the headline difference from the old decorator form. A signal query
        tracks the view: put the target inside an <code>&#64;if</code> and the signal is
        <code>undefined</code> until it renders, then updates the moment it appears or
        disappears. No <code>ngAfterViewInit</code>, no manual re-check:
      </p>
      <div class="demo">
        <p class="demo__title">Live — watch the signal flip</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="showTarget.update(v => !v)">
            {{ showTarget() ? 'Remove' : 'Render' }} the target
          </button>
          <span class="pill" [style.color]="target() ? 'var(--green)' : 'var(--text-muted)'">
            target() = {{ target() ? 'ElementRef ✓' : 'undefined' }}
          </span>
        </div>
        @if (showTarget()) {
          <input #target placeholder="queried element" style="width:340px" />
        }
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          The query result is driven by the view. An <code>effect()</code> logging
          <code>target()</code> would fire each time it resolves or clears — reacting to
          view changes is a one-liner.
        </p>
        <p class="pill">effect log: {{ effectLog() }}</p>
      </div>

      <h2>Resolve timing — don't read in the constructor</h2>
      <div class="warn">
        Queries resolve <strong>after</strong> the view renders, so in the constructor
        (and field initializers) the result is <code>undefined</code>. Read them in an
        event handler, an <code>effect()</code>, or <code>afterNextRender()</code> — never
        synchronously during construction. Signal queries make this safe by design: the
        signal simply reads <code>undefined</code> until it's ready.
      </div>

      <h2>Required queries, locators &amp; <code>read:</code></h2>
      <div class="code"><pre>{{ readSample }}</pre></div>
      <ul>
        <li><strong>Locator:</strong> a template reference (<code>'box'</code>), a component
          type (<code>ChartComponent</code>), or a directive type.</li>
        <li><strong><code>.required()</code>:</strong> returns <code>Signal&lt;T&gt;</code>
          (never <code>undefined</code>); throws if the target is missing at resolve time.</li>
        <li><strong><code>read:</code></strong> chooses which token to return from the
          matched node — e.g. the <code>ElementRef</code>, a specific directive instance,
          or a <code>ViewContainerRef</code>.</li>
      </ul>

      <h2>Decorator form ↔ signal form</h2>
      <table class="cmp">
        <tr><th></th><th>signal query (modern)</th><th><code>&#64;ViewChild</code> (legacy)</th></tr>
        <tr><td>Declaration</td><td><code>box = viewChild('box')</code></td><td><code>&#64;ViewChild('box') box!: ElementRef</code></td></tr>
        <tr><td>Read where</td><td>anytime — it's a signal (<code>undefined</code> until ready)</td><td><code>ngAfterViewInit</code> (or <code>static: true</code> in the ctor)</td></tr>
        <tr><td>Updates on view change</td><td class="ok">yes — re-resolves reactively</td><td>no — set once (or you re-read manually)</td></tr>
        <tr><td>List type</td><td><code>Signal&lt;readonly T[]&gt;</code></td><td><code>QueryList&lt;T&gt;</code> (subscribe to <code>.changes</code>)</td></tr>
        <tr><td>Works in <code>effect()</code></td><td class="ok">yes</td><td>no</td></tr>
      </table>

      <h2>View vs content</h2>
      <div class="note">
        <code>viewChild</code>/<code>viewChildren</code> see nodes in <em>this component's
        own template</em>. Nodes a parent projects in via <code>&lt;ng-content&gt;</code>
        are <strong>not</strong> view children — query those with
        <code>contentChild</code>/<code>contentChildren</code>. Mixing them up is the most
        common "my query is always undefined" cause.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Reading in the constructor.</strong> Undefined there — use a handler,
          <code>effect()</code>, or <code>afterNextRender()</code>.</li>
        <li><strong>Target hidden by <code>&#64;if</code>/<code>&#64;defer</code>.</strong> The
          signal is <code>undefined</code> until it renders. That's a feature — react to
          it — but <code>.required()</code> will throw if it never appears.</li>
        <li><strong>Projected content queried with <code>viewChild</code>.</strong> Use
          <code>contentChild</code> for anything arriving through <code>&lt;ng-content&gt;</code>.</li>
        <li><strong>Expecting <code>viewChildren()</code> to be a <code>QueryList</code>.</strong>
          Signal queries return a plain reactive array; there's no <code>.changes</code>
          Observable — use the signal itself (or <code>effect()</code>).</li>
        <li><strong>Forgetting <code>read:</code> when you need a different token.</strong>
          Querying a component's host element? Ask for <code>read: ElementRef</code>.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why is my <code>viewChild()</code> <code>undefined</code> in the constructor?</summary>
        <div>Queries resolve after the view renders. Read the signal in an
        <code>effect()</code>, <code>afterNextRender()</code>, or an event handler — it's
        <code>undefined</code> until then.</div>
      </details>
      <details class="qa">
        <summary>The element is inside an <code>&#64;if</code> that's false — what does the query return?</summary>
        <div><code>undefined</code>, until the condition becomes true and it renders. A
        signal query updates automatically when that happens.</div>
      </details>
      <details class="qa">
        <summary>How do I query content projected by a parent?</summary>
        <div>Not with <code>viewChild</code> — use <code>contentChild</code>/<code>contentChildren</code>.
        View queries only see this component's own template.</div>
      </details>
      <details class="qa">
        <summary>How do I get the <code>ElementRef</code> of a matched component?</summary>
        <div>Pass <code>read</code>: <code>viewChild(ChartComponent, &#123; read: ElementRef &#125;)</code>.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>viewChild()</code>/<code>viewChildren()</code> return reactive signals that re-resolve as the view changes.</li>
        <li>Use <code>.required()</code> when the target must exist; read queries after render, not in the constructor.</li>
        <li>Query by template reference, component type, or directive type; <code>read:</code> picks the returned token.</li>
        <li>View queries see this template only — projected content needs <code>contentChild</code>.</li>
      </ul>

      <p><a routerLink="/ng-template-outlet">Next: ng-template &amp; ngTemplateOutlet →</a></p>
    </article>
  `,
  styles: [
    `
      table.cmp { width: 100%; border-collapse: collapse; font-size: .82rem; margin: 12px 0; }
      table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
      table.cmp th { background: var(--bg-elevated); }
      table.cmp td code { white-space: nowrap; }
      .ok { color: var(--green); font-weight: 700; }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class ViewQueries {
  protected readonly box = viewChild<ElementRef<HTMLInputElement>>('box');
  protected readonly rows = viewChildren<ElementRef<HTMLElement>>('item');

  // --- reactive re-resolution demo ---
  protected readonly showTarget = signal(false);
  protected readonly target = viewChild<ElementRef<HTMLInputElement>>('target');
  protected readonly effectLog = signal('(waiting)');

  constructor() {
    // Reading a query signal inside effect() re-runs whenever it resolves/clears.
    effect(() => {
      this.effectLog.set(this.target() ? 'resolved → ElementRef' : 'cleared → undefined');
    });
  }

  protected focusBox() {
    this.box()?.nativeElement.focus();
  }
  protected fillBox() {
    const el = this.box()?.nativeElement;
    if (el) el.value = 'Set from the component!';
  }

  protected readonly apiSample = `// Signal<ElementRef<HTMLInputElement> | undefined>
box = viewChild<ElementRef<HTMLInputElement>>('box');

// required — never undefined (throws if missing at resolve time)
title = viewChild.required<ElementRef>('title');

// a live list — Signal<readonly ElementRef[]>
items = viewChildren<ElementRef>('item');

focus() { this.box()?.nativeElement.focus(); }`;

  protected readonly readSample = `// grab a child component instance and call its API
chart = viewChild(ChartComponent);
refresh() { this.chart()?.redraw(); }

// read: choose which token to return from the matched node
elRef  = viewChild('box', { read: ElementRef });
vcr    = viewChild('slot', { read: ViewContainerRef });

// required list
tabs = viewChildren(TabComponent);   // Signal<readonly TabComponent[]>`;
}
