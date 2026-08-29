import { Directive, DestroyRef, ElementRef, Renderer2, afterNextRender, inject, input } from '@angular/core';

/**
 * Fades + slides an element in the moment it scrolls into view (IntersectionObserver,
 * fires once). Delay is per-element so callers can stagger a list: `[appRevealDelay]="i * 60"`.
 * Honors prefers-reduced-motion by revealing immediately with no animation.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealOnScrollDirective {
  /**
   * Milliseconds to delay this element's reveal, written to the
   * `--reveal-delay` custom property that the CSS transition reads.
   *
   * Exists so a list can stagger rather than popping in as one block:
   * `[appRevealDelay]="i * 60"` inside an `@for`. Aliased separately from the
   * `appReveal` selector so the common case stays a bare attribute.
   */
  readonly delayMs = input(0, { alias: 'appRevealDelay' });

  /** The host element. Unwrapped to the DOM node — the ref itself is never needed. */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Used instead of touching `el.style`/`classList` directly, so the directive stays renderer-agnostic. */
  private readonly renderer = inject(Renderer2);

  /**
   * Wires up the observer after the first render.
   *
   * `afterNextRender` rather than the constructor body or `ngOnInit`: the
   * element must be in the document before `IntersectionObserver` can measure
   * it, and this hook is also skipped entirely on the server, which is where
   * both `matchMedia` and `IntersectionObserver` would otherwise be undefined.
   *
   * The observer stops watching an element as soon as it has been revealed
   * (`unobserve`) — the animation plays once, and scrolling back past it does
   * not replay. `destroyRef.onDestroy` disconnects the rest, so navigating
   * away mid-scroll cannot leak an observer.
   */
  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.renderer.setStyle(this.el, '--reveal-delay', `${this.delayMs()}ms`);
      this.renderer.addClass(this.el, 'reveal');

      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.renderer.addClass(this.el, 'reveal--visible');
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.renderer.addClass(this.el, 'reveal--visible');
              observer.unobserve(this.el);
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
      );
      observer.observe(this.el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
