import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text = '';

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private tip: HTMLElement | null = null;

  @HostListener('mouseenter')
  show(): void {
    if (!this.text || this.tip) return;
    const tip: HTMLElement = this.renderer.createElement('div');
    this.renderer.addClass(tip, 'app-tooltip');
    this.renderer.appendChild(tip, this.renderer.createText(this.text));
    this.renderer.appendChild(document.body, tip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(tip, 'left', `${rect.left + rect.width / 2}px`);
    this.renderer.setStyle(tip, 'top', `${rect.bottom + window.scrollY + 8}px`);
    this.tip = tip;
  }

  @HostListener('mouseleave')
  hide(): void {
    if (this.tip) {
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
