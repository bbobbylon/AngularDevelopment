import { Injectable, computed, signal } from '@angular/core';

/**
 * Severity of a toast, which selects its colour and icon in
 * {@link ToastsComponent}.
 *
 * - `info` — neutral acknowledgement ("Adaptive mode on").
 * - `success` — something the user achieved ("Bookmarked", "Streak: 3 days").
 * - `warn` — something that needs attention but is not an error.
 *
 * There is deliberately no `error` level: the app has no network or
 * persistence failures it can surface usefully — storage writes are
 * fire-and-forget by design — so an error toast would have nothing to say.
 */
export type ToastType = 'info' | 'success' | 'warn';

/** One notification currently on screen. */
export interface Toast {
  /** Monotonic id from {@link ToastService}, used to track and dismiss it. */
  id: number;
  /** The text shown. Plain text, not HTML — it is interpolated, not bound. */
  message: string;
  /** Severity, driving colour and icon. */
  type: ToastType;
}

/**
 * App-wide transient notifications — the small cards that slide in over the
 * bottom-right corner.
 *
 * Rendered once by `<app-toasts />` in the root shell, so the stack survives
 * navigation: a toast fired by the Practice page as you leave it still
 * finishes its life on the next page. Any component can raise one with
 * `inject(ToastService).show(...)` without needing an outlet of its own.
 *
 * Every toast auto-dismisses; {@link dismiss} exists for the ✕ button and for
 * the timer itself. Dismissal is keyed by id rather than index because the
 * list mutates while timers are pending.
 *
 * @see shared/toasts.component.ts — the renderer.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** The live stack, oldest first — the order they are rendered in. */
  private readonly _toasts = signal<Toast[]>([]);

  /** Read-only view for the renderer. */
  readonly toasts = this._toasts.asReadonly();

  /** How many toasts are on screen. */
  readonly count = computed(() => this._toasts().length);

  /**
   * Source of toast ids. A plain counter, not a signal: it is never read by
   * the view, only incremented, so making it reactive would schedule
   * pointless change detection on every toast.
   */
  private nextId = 0;

  /**
   * Shows a toast and schedules its removal.
   *
   * Fire-and-forget by design — callers do not await it or hold the id. The
   * dismissal timer is not cancelled if the toast is closed early; the
   * {@link dismiss} it eventually calls is a no-op once the id is gone, which
   * is cheaper than tracking a timer handle per toast.
   *
   * @param message  Text to display.
   * @param type     Severity. Defaults to `info`.
   * @param duration Milliseconds before auto-dismissal. Callers shorten this
   *                 for incidental confirmations (a bookmark star) and lengthen
   *                 it for things worth reading (a difficulty change).
   */
  show(message: string, type: ToastType = 'info', duration = 3000): void {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  /**
   * Removes a toast. Safe to call for an id that is already gone, which is
   * what lets {@link show}'s timer fire unconditionally.
   *
   * @param id The toast's id.
   */
  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
