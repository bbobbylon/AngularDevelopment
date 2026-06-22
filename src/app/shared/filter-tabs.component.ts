import { Component, input, model } from '@angular/core';

export interface TabOption {
  id: string;
  label: string;
}

/**
 * Reusable tab-bar component demonstrating the model() signal API for
 * two-way binding. Parent uses [(value)]="mySignal" — no @Output needed.
 */
@Component({
  selector: 'app-filter-tabs',
  standalone: true,
  template: `
    <div class="tab-bar" role="group">
      @for (opt of options(); track opt.id) {
        <button
          [class.active]="value() === opt.id"
          (click)="value.set(opt.id)"
          [attr.aria-pressed]="value() === opt.id"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .tab-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    button {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 14px;
      font-size: .85rem;
    }
    button.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }
  `],
})
export class FilterTabsComponent {
  /** Available tab options passed in from the parent. */
  options = input<TabOption[]>([]);

  /**
   * model() creates a two-way bindable writable signal.
   * Parent writes: [(value)]="myWritableSignal"
   * Internally: value() to read, value.set() to emit upward.
   */
  value = model<string>('all');
}
