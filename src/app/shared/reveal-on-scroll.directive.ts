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
  readonly delayMs = input(0, { alias: 'appRevealDelay' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

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
