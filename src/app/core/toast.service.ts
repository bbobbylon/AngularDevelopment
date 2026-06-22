import { Injectable, computed, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'warn';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * App-wide toast notification service.
 * Demonstrates: signal<T[]>, computed(), auto-dismiss with setTimeout.
 * Consumed in app.html via <app-toasts /> and anywhere via inject(ToastService).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  readonly count = computed(() => this._toasts().length);

  private nextId = 0;

  show(message: string, type: ToastType = 'info', duration = 3000): void {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
