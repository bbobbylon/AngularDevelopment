import { Directive, ElementRef, Renderer2, effect, inject, input, signal } from '@angular/core';

/** Modern: inject() for ElementRef/Renderer2, host: {} for bindings */
@Directive({
  selector: '[appBadge]',
  standalone: true,
  exportAs: 'appBadge',           // parent template can grab: #b="appBadge"
  host: {
    '[class.badge-active]': 'active()',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class BadgeDirective {
  /**
   * The badge text.
   */
  label = input<string>('New');

  /**
   * Whether the badge is active. Read by a host class binding.
   */
  readonly active = signal(true);
  /**
   * The computed ARIA label. Read by a host attribute binding, so the accessible
   * name tracks the visual state instead of drifting from it.
   */
  readonly ariaLabel = signal('');

  /**
   * The host element.
   */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /**
   * The renderer. Used instead of touching `nativeElement` directly, so the
   * directive still works where there is no DOM — server rendering, or a
   * non-browser platform.
   */
  private readonly renderer = inject(Renderer2);

  /**
   * Keeps the ARIA label in step with the active state.
   */
  constructor() {
    effect(() => {
      this.ariaLabel.set(this.active() ? `Badge: ${this.label()}` : '');
    });
  }

  /**
   * Flips the active state. Reachable from a parent template through the
   * directive's `exportAs` name.
   */
  toggle(): void { this.active.update(v => !v); }
}
