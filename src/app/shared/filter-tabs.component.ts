import { Component, input, model } from '@angular/core';

/** One selectable tab in a {@link FilterTabsComponent} bar. */
export interface TabOption {
  /** Value written back through the `value` model when this tab is picked. */
  id: string;
  /** Text shown on the tab. */
  label: string;
}

/**
 * Reusable tab-bar component demonstrating the model() signal API for
 * two-way binding. Parent uses [(value)]="mySignal" — no @Output needed.
 */
@Component({
  selector: 'app-filter-tabs',
  templateUrl: './filter-tabs.component.html',
  styleUrl: './filter-tabs.component.css',
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
