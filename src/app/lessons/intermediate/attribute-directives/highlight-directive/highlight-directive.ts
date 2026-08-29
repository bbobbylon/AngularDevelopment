import { Directive, HostListener, WritableSignal, input, signal } from '@angular/core';

/** Modern style: inject() instead of constructor params, signal input(), host metadata */
@Directive({
  selector: '[appHighlight]',
  standalone: true,
  // host: {} replaces every @HostBinding — cleaner, compiled away at build time.
  host: {
    '[style.transition]': '"background-color .15s ease"',
    '[style.cursor]': '"pointer"',
    '[style.backgroundColor]': 'bg()',
  },
})
export class HighlightDirective {
  /** signal input: typed, readonly, no @Input() needed. Default = amber highlight. */
  appHighlight = input<string>('var(--amber)');

  /**
   * The background the host binding reads. Empty means no highlight.
   */
  protected readonly bg: WritableSignal<string> = signal('');

  /**
   * Nothing to wire — the host bindings are declarative and the listeners below
   * drive them. Kept as a marker for where an `effect` would go if the colour had
   * to be derived rather than set.
   */
  constructor() {
    // effect() could also sync the color, but @HostListener is simpler here.
  }

  /**
   * Applies the highlight on pointer entry.
   */
  @HostListener('mouseenter') onEnter() {
    this.bg.set(this.appHighlight());
  }
  /**
   * Removes it on pointer exit.
   */
  @HostListener('mouseleave') onLeave() {
    this.bg.set('');
  }
}
