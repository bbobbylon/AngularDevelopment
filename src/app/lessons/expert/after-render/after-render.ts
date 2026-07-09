import {
  Component,
  ElementRef,
  afterEveryRender,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: the render hooks in depth — why afterNextRender/afterEveryRender
 * replaced the ngAfterViewInit-for-DOM-work habit, the phase system that
 * prevents layout thrashing, a live run-counter proving "after EVERY
 * render", the third-party-widget integration recipe, and how these hooks
 * relate to SSR, ResizeObserver and requestAnimationFrame.
 */
@Component({
  selector: 'app-lesson-after-render',
  imports: [RouterLink],
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    td.bad { color: #ef4444; }

    .counter-box { display: inline-flex; flex-direction: column; gap: 2px; border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; background: var(--bg-card); min-width: 180px; }
    .counter-box small { color: var(--text-muted); font-size: .74rem; }
    .counter-box strong { font-family: monospace; font-size: 1.2rem; }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Runtime &amp; Performance</span>
      <h1>afterNextRender &amp; afterEveryRender</h1>
      <p class="lead">
        Some work can only happen after Angular has written to the DOM: measuring an
        element, wiring a chart library, focusing a node. The render hooks are the
        sanctioned home for it — they run <em>after</em> rendering completes, outside
        change detection, and <strong>never on the server</strong>. That last property
        quietly replaced a whole genre of <code>isPlatformBrowser</code> boilerplate.
      </p>

      <h2>Why not ngAfterViewInit?</h2>
      <table class="cmp">
        <tr><th></th><th>ngAfterViewInit / ngAfterViewChecked</th><th>afterNextRender / afterEveryRender</th></tr>
        <tr><td>Runs during</td><td>change detection (mid-cycle)</td><td>after the whole render pass finishes</td></tr>
        <tr><td>On the server (SSR)</td><td class="bad"><strong>yes</strong> — your DOM code crashes every request</td><td><strong>never</strong> — browser-only by contract</td></tr>
        <tr><td>Sees final DOM of…</td><td>this component's view only</td><td>the entire application</td></tr>
        <tr><td>Batching discipline</td><td>none — read/write interleaving is on you</td><td>explicit phases prevent layout thrashing</td></tr>
        <tr><td>Registered from</td><td>lifecycle interface</td><td>any injection context (constructor, or pass an injector)</td></tr>
      </table>
      <div class="code"><pre>{{ hooksSample }}</pre></div>

      <h2>Live — measure after render</h2>
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
        <p style="color:var(--text-muted);font-size:.85rem">
          The initial width was read in <code>afterNextRender</code> — the earliest
          moment the element measurably exists. Reading it in <code>ngOnInit</code>
          returns 0 (not laid out yet); on the server it would throw.
        </p>
      </div>

      <h2>Live — proof that afterEveryRender means EVERY render</h2>
      <div class="demo">
        <p class="demo__title">Live — run counters (written straight to the DOM)</p>
        <div class="row">
          <div class="counter-box">
            <small>afterNextRender ran</small>
            <strong #onceEl>0</strong>
          </div>
          <div class="counter-box">
            <small>afterEveryRender ran</small>
            <strong #everyEl>0</strong>
          </div>
          <button (click)="ticks.set(ticks() + 1)">Trigger a render (tick {{ ticks() }})</button>
        </div>
        <p style="margin-top:10px;color:var(--text-muted);font-size:.85rem">
          Every button click (and the slider above) re-renders the page — the right
          counter climbs, the left one stays at 1. The counters are written with
          <code>textContent</code> <em>inside the hook itself</em>: updating a signal
          there would schedule another render, which runs the hook again… an infinite
          loop. Render hooks read the DOM and write the DOM — they should not write
          state that re-triggers rendering.
        </p>
      </div>

      <h2>Phases — the layout-thrashing defense</h2>
      <p>
        Interleaving DOM reads and writes forces the browser into repeated synchronous
        layout passes (write → read forces layout → write invalidates it → read forces
        it again…). The hooks take a phase object and run all registered callbacks
        phase by phase across the whole app — every read batched before every write:
      </p>
      <div class="code"><pre>{{ phasesSample }}</pre></div>
      <table class="cmp">
        <tr><th>Phase</th><th>Order</th><th>For</th></tr>
        <tr><td><code>earlyRead</code></td><td>1</td><td>read layout needed to <em>compute</em> a write (measure before reposition)</td></tr>
        <tr><td><code>write</code></td><td>2</td><td>DOM writes — styles, attributes, canvas sizing</td></tr>
        <tr><td><code>mixedReadWrite</code></td><td>3</td><td>genuinely interleaved read/write (avoid if separable)</td></tr>
        <tr><td><code>read</code></td><td>4</td><td>final measurements after all writes landed</td></tr>
      </table>

      <h2>The third-party widget recipe</h2>
      <p>
        The complete lifecycle for wrapping a non-Angular library (chart, map, editor)
        — creation after first render, updates via effect, teardown on destroy:
      </p>
      <div class="code"><pre>{{ chartSample }}</pre></div>

      <h2>The right tool for the job</h2>
      <table class="cmp">
        <tr><th>Need</th><th>Tool</th></tr>
        <tr><td>One-time DOM setup / measurement</td><td><code>afterNextRender</code></td></tr>
        <tr><td>Keep DOM in sync after each render</td><td><code>afterEveryRender</code> (tiny callbacks, right phase)</td></tr>
        <tr><td>React to an <em>element</em> resizing (not renders)</td><td><code>ResizeObserver</code> — renders don't imply resizes, resizes don't imply renders</td></tr>
        <tr><td>Per-frame animation work</td><td><code>requestAnimationFrame</code> loop — render hooks fire per render, not per frame</td></tr>
        <tr><td>React to signal changes (no DOM)</td><td><code>effect()</code> — reaching for render hooks without DOM work is a smell</td></tr>
      </table>

      <h2>Pitfalls</h2>
      <ul>
        <li><strong>NG0203 outside injection context</strong> — calling the hooks in a
          click handler or timer. Register in the constructor, or pass
          <code>&#123; injector &#125;</code> captured earlier.</li>
        <li><strong>Signal writes inside the hook</strong> — schedules another render →
          runs the hook again → loop. Write to the DOM, or guard with real equality.</li>
        <li><strong>Measuring too early anyway</strong> — fonts and images load after
          first render and change layout; for size-sensitive work pair the initial
          measurement with a <code>ResizeObserver</code>.</li>
        <li><strong>Heavy afterEveryRender callbacks</strong> — they run on <em>every</em>
          render of the whole app; treat them like code inside a hot loop.</li>
        <li><strong>Old name:</strong> <code>afterRender</code> was renamed
          <code>afterEveryRender</code> — you'll see both in code from different years.</li>
      </ul>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why is <code>afterNextRender</code> the SSR-safe home for DOM code?</summary>
        <div>Its contract is browser-only — the callback simply never executes during
        server rendering, so <code>window</code>/<code>document</code> access can't crash
        the server. It replaces the manual <code>isPlatformBrowser</code> guard for
        post-render work.</div>
      </details>
      <details class="qa">
        <summary>What is layout thrashing, and how do the phases prevent it?</summary>
        <div>Alternating writes and layout reads forces the browser to recompute layout
        synchronously multiple times per frame. The phase system batches every
        registered callback app-wide: all earlyReads, then all writes, then reads —
        one layout pass instead of N.</div>
      </details>
      <details class="qa">
        <summary>Why does setting a signal inside <code>afterEveryRender</code> hang the app?</summary>
        <div>The write schedules change detection; the render completes and runs
        <code>afterEveryRender</code> again, which writes again — an infinite
        render loop. Render hooks output to the DOM, not to reactive state.</div>
      </details>
      <details class="qa">
        <summary>Chart must re-render when its data signal changes AND survive SSR. Structure?</summary>
        <div>Create the chart in <code>afterNextRender</code>; inside it, start an
        <code>effect</code> (with the captured injector) that reads the data signal and
        calls <code>chart.update()</code>; destroy via <code>DestroyRef.onDestroy</code>.
        Creation, updates and teardown each use the right primitive.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li>Render hooks run after rendering, outside CD, browser-only — the sanctioned home for DOM work.</li>
        <li><code>afterNextRender</code> = one-shot setup; <code>afterEveryRender</code> = per-render sync, kept tiny.</li>
        <li>Phases (earlyRead → write → mixedReadWrite → read) batch app-wide to kill layout thrashing.</li>
        <li>Don't write reactive state from the hooks; don't use them where ResizeObserver/rAF/effect fit better.</li>
        <li>They need an injection context — constructor, or pass an injector.</li>
      </ul>

      <p><a routerLink="/ssr">Next: Server-Side Rendering →</a></p>
    </article>
  `,
})
export class AfterRender {
  private readonly box = viewChild<ElementRef<HTMLElement>>('boxEl');
  private readonly onceEl = viewChild<ElementRef<HTMLElement>>('onceEl');
  private readonly everyEl = viewChild<ElementRef<HTMLElement>>('everyEl');

  protected readonly boxWidth = signal(60);
  protected readonly measuredPx = signal(0);
  protected readonly ticks = signal(0);

  private onceRuns = 0;
  private everyRuns = 0;

  constructor() {
    afterNextRender(() => {
      this.measure();
      this.onceRuns++;
      const el = this.onceEl()?.nativeElement;
      if (el) el.textContent = String(this.onceRuns);
    });

    // DOM write, NOT a signal write — a signal here would loop forever.
    afterEveryRender(() => {
      this.everyRuns++;
      const el = this.everyEl()?.nativeElement;
      if (el) el.textContent = String(this.everyRuns);
    });
  }

  protected measure() {
    const el = this.box()?.nativeElement;
    if (el) this.measuredPx.set(Math.round(el.getBoundingClientRect().width));
  }

  protected resize(event: Event) {
    this.boxWidth.set(+(event.target as HTMLInputElement).value);
  }

  // --- code samples ---
  readonly hooksSample = `constructor() {
  // once, after the NEXT render — one-time DOM setup:
  afterNextRender(() => {
    this.chart = new Chart(this.host.nativeElement, this.config);
  });

  // after EVERY render — continuous DOM synchronization (keep it tiny):
  afterEveryRender(() => this.syncCanvasSize());
}

// outside a constructor? bring your own context:
afterNextRender(() => el.focus(), { injector: this.injector });`;

  readonly phasesSample = `afterEveryRender({
  earlyRead: () => {
    this.rect = this.tooltipAnchor.getBoundingClientRect();  // READ layout
    return this.rect;                                        // passed to write
  },
  write: (rect) => {
    this.tooltip.style.transform =                           // WRITE — no reads!
      \`translate(\${rect.x}px, \${rect.bottom}px)\`;
  },
});
// all earlyReads across the app run first, then all writes — one layout pass`;

  readonly chartSample = `export class ChartHost {
  private host = inject(ElementRef);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  readonly data = input.required<Point[]>();
  private chart?: ThirdPartyChart;

  constructor() {
    afterNextRender(() => {
      // 1. create — DOM exists, browser guaranteed, SSR-safe
      this.chart = new ThirdPartyChart(this.host.nativeElement);

      // 2. update — react to the input signal from now on
      effect(() => this.chart!.setData(this.data()), { injector: this.injector });
    });

    // 3. teardown
    this.destroyRef.onDestroy(() => this.chart?.destroy());
  }
}`;
}
