import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  JsonPipe,
  LowerCasePipe,
  PercentPipe,
  SlicePipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-pipes',
  imports: [
    RouterLink,
    UpperCasePipe,
    LowerCasePipe,
    TitleCasePipe,
    DecimalPipe,
    PercentPipe,
    CurrencyPipe,
    DatePipe,
    JsonPipe,
    SlicePipe,
  ],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Pipes</span>
      <h1>Built-in Pipes</h1>
      <p class="lead">
        A pipe transforms a value for display, right in the template, using the
        <code>|</code> operator. Pipes are pure functions of their input — they
        format data without mutating it.
      </p>

      <h2>Text pipes</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <input [value]="text()" (input)="text.set($any($event.target).value)" style="width:100%;margin-bottom:12px" />
        <table class="pipes">
          <tr><td><code>uppercase</code></td><td>{{ text() | uppercase }}</td></tr>
          <tr><td><code>lowercase</code></td><td>{{ text() | lowercase }}</td></tr>
          <tr><td><code>titlecase</code></td><td>{{ text() | titlecase }}</td></tr>
          <tr><td><code>slice:0:5</code></td><td>{{ text() | slice: 0 : 5 }}</td></tr>
        </table>
      </div>

      <h2>Number pipes (with parameters)</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <input type="number" [value]="num()" (input)="num.set(+$any($event.target).value)" style="margin-bottom:12px" />
        <table class="pipes">
          <tr><td><code>number:'1.2-2'</code></td><td>{{ num() | number: '1.2-2' }}</td></tr>
          <tr><td><code>percent</code></td><td>{{ num() / 100 | percent }}</td></tr>
          <tr><td><code>currency:'USD'</code></td><td>{{ num() | currency: 'USD' }}</td></tr>
          <tr><td><code>currency:'EUR':'code'</code></td><td>{{ num() | currency: 'EUR' : 'code' }}</td></tr>
        </table>
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:10px">
          The <code>'1.2-2'</code> means: at least 1 integer digit, 2–2 fraction digits.
        </p>
      </div>

      <h2>Date pipe</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <table class="pipes">
          <tr><td><code>date</code></td><td>{{ now() | date }}</td></tr>
          <tr><td><code>date:'short'</code></td><td>{{ now() | date: 'short' }}</td></tr>
          <tr><td><code>date:'fullDate'</code></td><td>{{ now() | date: 'fullDate' }}</td></tr>
          <tr><td><code>date:'HH:mm:ss'</code></td><td>{{ now() | date: 'HH:mm:ss' }}</td></tr>
          <tr><td><code>date:'yyyy-MM-dd'</code></td><td>{{ now() | date: 'yyyy-MM-dd' }}</td></tr>
        </table>
      </div>

      <h2>json (great for debugging)</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="code"><pre>{{ sample() | json }}</pre></div>
      </div>

      <h2>Chaining pipes</h2>
      <p>Pipes compose left to right:</p>
      <div class="code">
        <pre>{{ '{{' }} now() | date: 'fullDate' | uppercase {{ '}}' }}
&rarr; {{ now() | date: 'fullDate' | uppercase }}</pre>
      </div>

      <div class="tip">
        The <strong>async</strong> pipe is special: it subscribes to an Observable or
        reads a Signal and auto-unsubscribes. It is covered alongside RxJS in the
        intermediate track. The <code>keyvalue</code> pipe lets you
        <code>&#64;for</code> over an object's entries.
      </div>

      <h2>Purity & performance</h2>
      <p>
        Built-in pipes are <strong>pure</strong>: Angular memoizes the result and only
        re-runs <code>transform()</code> when the input <em>reference</em> changes. That
        makes <code>{{ '{{' }} list | sort {{ '}}' }}</code> cheap on every CD pass — far
        cheaper than calling a method. Arguments can be bound and dynamic
        (<code>num() | number: format()</code>).
      </p>
      <div class="note">
        <code>currency</code>, <code>date</code>, <code>number</code> and
        <code>percent</code> format according to <code>LOCALE_ID</code>. For non-default
        locales you must register the locale data (<code>registerLocaleData()</code>) and
        provide the locale, or those pipes throw at runtime.
      </div>

      <h2>Pitfalls that show up in exams &amp; code review</h2>
      <ul>
        <li><strong>Forgetting to import the pipe.</strong> Standalone components must list each pipe
          in <code>imports</code> (e.g. <code>DatePipe</code>) — a missing import gives "no pipe found".</li>
        <li><strong>Mutating an array and expecting a re-run.</strong> Pure pipes only re-run when the
          input <em>reference</em> changes. <code>arr.push(x)</code> won't trigger it — assign a new
          array.</li>
        <li><strong>Writing a stateful "impure" pipe.</strong> Impure pipes run every CD cycle and wreck
          perf; do filtering/sorting in the component (a computed signal), not a pipe.</li>
        <li><strong>Locale pipes without locale data.</strong> <code>date</code>/<code>currency</code>/
          <code>number</code> throw for non-default locales unless you
          <code>registerLocaleData()</code> and provide <code>LOCALE_ID</code>.</li>
        <li><strong>Misreading the digits format.</strong> <code>'1.2-2'</code> is
          <em>minInteger.minFraction-maxFraction</em> — not "1 to 2".</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>What does "pure pipe" mean, and why does it matter?</summary>
        <div>Angular memoizes the result and only re-runs <code>transform()</code> when the input
        reference changes — so pipes are cheap on every change-detection pass. Mutating in place skips
        the re-run.</div>
      </details>
      <details class="qa">
        <summary>Decode <code>number: '1.2-2'</code>.</summary>
        <div>At least 1 integer digit, at least 2 and at most 2 fraction digits — i.e.
        <em>minIntegerDigits.minFractionDigits-maxFractionDigits</em>.</div>
      </details>
      <details class="qa">
        <summary>Where should list filtering/sorting live — a pipe or the component?</summary>
        <div>The component (a <code>computed</code> signal). A filtering pipe would have to be impure and
        run every cycle. Keep pipes pure and for display formatting.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Syntax: <code>value | pipeName: arg1 : arg2</code> — args can be bound/dynamic.</li>
        <li>Built-ins live in <code>&#64;angular/common</code>; import the ones you use.</li>
        <li>Pipes are pure, memoized transforms for <em>display</em> — they never mutate the source.</li>
        <li>Locale-aware pipes need the locale registered; chain pipes with multiple <code>|</code>.</li>
      </ul>

      <p><a routerLink="/lifecycle">Next: Lifecycle Hooks →</a></p>
    </article>
  `,
  styles: [
    `
      .pipes {
        width: 100%;
        border-collapse: collapse;
      }
      .pipes td {
        padding: 6px 8px;
        border-bottom: 1px solid var(--border);
      }
      .pipes td:first-child {
        width: 220px;
        color: var(--text-muted);
      }
      .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
      .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
      .qa div { padding: 10px 14px; font-size: .9rem; }
    `,
  ],
})
export class Pipes {
  protected readonly text = signal('the quick brown fox');
  protected readonly num = signal(1234.5);
  protected readonly now = signal(new Date());
  protected readonly sample = signal({ id: 1, tags: ['a', 'b'], active: true });
}
