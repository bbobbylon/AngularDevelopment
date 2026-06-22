import { Component, ElementRef, afterNextRender, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-after-render',
  imports: [RouterLink],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>afterRender &amp; afterNextRender</h1>
      <p class="lead">
        Some work can only happen <em>after</em> Angular has written to the DOM:
        measuring an element, integrating a third-party chart, or focusing a node.
        <code>afterRender</code> and <code>afterNextRender</code> are the safe hooks
        for that — they run after the framework finishes rendering, outside change
        detection.
      </p>

      <h2>The two hooks</h2>
      <div class="code">
        <pre>constructor() {{ '{' }}
  // runs once, after the NEXT render — perfect for one-time DOM setup:
  afterNextRender(() =&gt; this.measure());

  // runs after EVERY render — for continuous DOM reads/writes (use sparingly):
  afterRender(() =&gt; {{ '{' }} /* e.g. keep a canvas sized */ {{ '}' }});
{{ '}' }}</pre>
      </div>
      <p>
        Both only run in the browser (never during server-side rendering), so they are
        the correct home for code that touches <code>window</code>/<code>document</code>.
      </p>

      <h2>Try it — measure after render</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div
          #boxEl
          [style.width.%]="boxWidth()"
          style="padding:10px;background:var(--bg-elevated);border:1px solid var(--violet);border-radius:8px;transition:width .15s">
          I am {{ measuredPx() }} px wide.
        </div>
        <div class="row" style="margin-top:12px">
          <input type="range" min="20" max="100" [value]="boxWidth()" (input)="resize($event)" />
          <button class="ghost" (click)="measure()">Re-measure</button>
        </div>
        <p class="lead" style="font-size:.95rem">
          The initial width was read with <code>afterNextRender</code>; drag the slider
          and re-measure to read the new layout.
        </p>
      </div>

      <div class="warn">
        Never read layout (<code>offsetWidth</code>, <code>getBoundingClientRect</code>)
        in <code>ngOnInit</code> or a constructor — the view isn't in the DOM yet, and
        on the server there is no DOM. Use these hooks (or a signal query in an effect).
      </div>
      <div class="note">
        Because these callbacks never run during SSR, they're the right home for chart
        libraries, measuring, focus, and scroll restoration. Splitting work into the
        <code>earlyRead</code> → <code>write</code> phases batches all DOM reads before
        writes, avoiding the layout thrashing that comes from interleaving them. Keep
        <code>afterRender</code> callbacks tiny — they run after <em>every</em> render.
      </div>

      <h2>Phases (advanced)</h2>
      <div class="code">
        <pre>afterRender({{ '{' }}
  earlyRead: () =&gt; readSize(),     // read layout
  write: () =&gt; applyStyles(),      // then write — avoids layout thrashing
{{ '}' }});</pre>
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>afterNextRender</code> = one-shot DOM setup after the next render.</li>
        <li><code>afterRender</code> = after every render; keep the callback lightweight.</li>
        <li>Both are browser-only — safe for <code>document</code>/<code>window</code> work.</li>
        <li>Use the read/write phases to batch DOM reads before writes.</li>
      </ul>

      <p><a routerLink="/ssr">Next: Server-Side Rendering →</a></p>
    </article>
  `,
})
export class AfterRender {
  private readonly box = viewChild<ElementRef<HTMLElement>>('boxEl');
  protected readonly boxWidth = signal(60);
  protected readonly measuredPx = signal(0);

  constructor() {
    afterNextRender(() => this.measure());
  }

  protected measure() {
    const el = this.box()?.nativeElement;
    if (el) this.measuredPx.set(Math.round(el.getBoundingClientRect().width));
  }

  protected resize(event: Event) {
    this.boxWidth.set(+(event.target as HTMLInputElement).value);
  }
}
