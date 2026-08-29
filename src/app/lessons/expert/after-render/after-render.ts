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
  styleUrl: './after-render.css',
  templateUrl: './after-render.html',
})
export class AfterRender {
  /**
   * The element the measuring demo measures.
   */
  private readonly box = viewChild<ElementRef<HTMLElement>>('boxEl');
  /**
   * Where the `afterNextRender` run count is written.
   */
  private readonly onceEl = viewChild<ElementRef<HTMLElement>>('onceEl');
  /**
   * Where the `afterEveryRender` run count is written.
   */
  private readonly everyEl = viewChild<ElementRef<HTMLElement>>('everyEl');

  /**
   * The requested width, driven by the slider.
   */
  protected readonly boxWidth = signal(60);
  /**
   * The width actually measured from the DOM after render.
   */
  protected readonly measuredPx = signal(0);
  /**
   * Renders forced, to show `afterEveryRender` firing repeatedly.
   */
  protected readonly ticks = signal(0);

  /**
   * How many times the once-hook has run. Stays at one, which is the demo.
   */
  private onceRuns = 0;
  /**
   * How many times the every-hook has run.
   */
  private everyRuns = 0;

  /**
   * Registers both hooks.
   *
   * Both write to the DOM **directly** rather than to a signal, and that is not
   * incidental: a signal write inside `afterEveryRender` marks the view dirty,
   * which schedules another render, which runs the hook again — an infinite loop.
   * The hooks are for reading and writing DOM, not for feeding state back into
   * Angular.
   *
   * They are also browser-only, so they never run during SSR — which is exactly
   * why they are the right home for anything touching `window` or measuring
   * layout.
   */
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

  /**
   * Measures the box from the real DOM.
   */
  protected measure() {
    const el = this.box()?.nativeElement;
    if (el) this.measuredPx.set(Math.round(el.getBoundingClientRect().width));
  }

  /**
   * Handles the slider.
   *
   * @param event The input event.
   */
  protected resize(event: Event) {
    this.boxWidth.set(+(event.target as HTMLInputElement).value);
  }

  // --- code samples ---
  /**
   * Sample: `afterNextRender` against `afterEveryRender`, and what each is for.
   */
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

  /**
   * Sample: the render phases — `earlyRead`, `write`, `mixedReadWrite`, `read` —
   * which exist to batch reads and writes and avoid layout thrashing.
   */
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

  /**
   * Sample: the real use case — initialising a third-party chart library that
   * needs a mounted element, and cleaning it up on destroy.
   */
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
