import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

/**
 * Global toast overlay — place once in app.html.
 * Uses @for + signal<Toast[]> from ToastService; click any toast to dismiss early.
 */
@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.css',
})
export class ToastsComponent {
  /** The app-wide stack this component renders. It owns the state; this owns the pixels. */
  protected readonly toast = inject(ToastService);

  /**
   * Glyph per {@link ToastType}. Kept here rather than in the service so the
   * service stays free of presentation, and typed loosely as
   * `Record<string, string>` so the template can index it with the raw
   * `type` string without a cast.
   */
  protected readonly icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    warn: '⚠',
  };
}
