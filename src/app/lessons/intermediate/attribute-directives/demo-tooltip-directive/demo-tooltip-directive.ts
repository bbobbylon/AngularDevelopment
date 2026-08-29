import { Directive, ElementRef, HostListener, OnDestroy, Renderer2, inject, input } from '@angular/core';

/** Real-world: tooltip that this app's shared TooltipDirective is based on */
@Directive({
  selector: '[appDemoTooltip]',
  standalone: true,
})
export class DemoTooltipDirective implements OnDestroy {
  /**
   * The tooltip text. Aliased to the selector, so `appDemoTooltip="…"` both applies
   * the directive and supplies its input.
   */
  text = input<string>('', { alias: 'appDemoTooltip' });

  /**
   * The host element, used to position the tooltip against.
   */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /**
   * The renderer, for creating and removing the tooltip node.
   */
  private readonly renderer = inject(Renderer2);
  /**
   * The live tooltip node, or `null` when hidden.
   */
  private tip: HTMLElement | null = null;

  /**
   * Creates and positions the tooltip on pointer entry.
   */
  @HostListener('mouseenter') show(): void {
    if (!this.text()) return;
    this.tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(this.tip, 'app-tooltip');
    this.renderer.setProperty(this.tip, 'textContent', this.text());
    this.renderer.appendChild(document.body, this.tip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(this.tip, 'left', `${rect.left + rect.width / 2 + window.scrollX}px`);
    this.renderer.setStyle(this.tip, 'top', `${rect.top - 36 + window.scrollY}px`);
  }

  /**
   * Removes the tooltip.
   */
  @HostListener('mouseleave') hide(): void {
    if (this.tip) {
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    }
  }

  /**
   * Removes the tooltip on teardown.
   *
   * Not optional: the node is appended to `document.body` rather than to the host,
   * so destroying the host does **not** take it with it. Skip this and every
   * hover leaves an orphan behind.
   */
  ngOnDestroy(): void { this.hide(); }
}
