import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

/**
 * Global toast overlay — place once in app.html.
 * Uses @for + signal<Toast[]> from ToastService; click any toast to dismiss early.
 */
@Component({
  selector: 'app-toasts',
  standalone: true,
  template: `
    @if (toast.count() > 0) {
      <div class="toast-stack" aria-live="polite" aria-atomic="false">
        @for (t of toast.toasts(); track t.id) {
          <div
            class="toast"
            [class]="'toast toast--' + t.type"
            role="status"
            (click)="toast.dismiss(t.id)"
            title="Click to dismiss"
          >
            <span class="toast__icon">{{ icons[t.type] }}</span>
            <span class="toast__msg">{{ t.message }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: .88rem;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,.18);
      pointer-events: all;
      cursor: pointer;
      animation: toast-in .2s ease;
      max-width: 320px;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px) scale(.97); }
      to   { opacity: 1; transform: none; }
    }
    .toast--info    { background: var(--bg-card); border: 1px solid var(--border); color: var(--text); }
    .toast--success { background: rgba(5,150,105,.12); border: 1px solid rgba(5,150,105,.3); color: #059669; }
    .toast--warn    { background: rgba(217,119,6,.1); border: 1px solid rgba(217,119,6,.35); color: #d97706; }
    .toast__icon { font-size: 1rem; flex-shrink: 0; }
    .toast__msg  { line-height: 1.4; }
  `],
})
export class ToastsComponent {
  protected readonly toast = inject(ToastService);
  protected readonly icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    warn: '⚠',
  };
}
