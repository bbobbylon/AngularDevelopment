import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

// ============================================================
// WHAT YOU'LL BUILD: a Data Dashboard covering:
//   resource() API, HTTP simulation, signal stores,
//   computed selectors, sorting/filtering, charts (ASCII),
//   loading/error states, performance (OnPush, computed)
// ============================================================

/**
 * One sale in the dataset.
 */
interface SaleRecord {
  id: number;
  product: string;
  category: 'hardware' | 'software' | 'services';
  amount: number;
  region: 'north' | 'south' | 'east' | 'west';
  month: number;
}

const MOCK_SALES: SaleRecord[] = [
  { id:  1, product: 'Angular Pro',    category: 'software', amount: 4200, region: 'north', month: 1 },
  { id:  2, product: 'Dev Laptop',     category: 'hardware', amount: 1800, region: 'south', month: 1 },
  { id:  3, product: 'Support Plan',   category: 'services', amount: 900,  region: 'east',  month: 1 },
  { id:  4, product: 'Angular Pro',    category: 'software', amount: 3800, region: 'west',  month: 2 },
  { id:  5, product: 'Keyboard',       category: 'hardware', amount: 280,  region: 'north', month: 2 },
  { id:  6, product: 'Consulting',     category: 'services', amount: 2400, region: 'south', month: 2 },
  { id:  7, product: 'Angular Pro',    category: 'software', amount: 5100, region: 'east',  month: 3 },
  { id:  8, product: 'Monitor',        category: 'hardware', amount: 640,  region: 'west',  month: 3 },
  { id:  9, product: 'Support Plan',   category: 'services', amount: 1200, region: 'north', month: 3 },
  { id: 10, product: 'TypeScript Lib', category: 'software', amount: 2900, region: 'south', month: 4 },
  { id: 11, product: 'Dev Laptop',     category: 'hardware', amount: 3600, region: 'east',  month: 4 },
  { id: 12, product: 'Consulting',     category: 'services', amount: 1800, region: 'west',  month: 4 },
];

/**
 * Which column the table is sorted by.
 */
type SortKey = 'amount' | 'product' | 'month';
/**
 * Which way it is sorted.
 */
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 5;

/**
 * The dashboard's store — the dataset plus every view over it.
 *
 * The interesting property is that **nothing here is stored twice**. The filters,
 * the sort and the page number are the only writable state; the filtered rows,
 * the page count, the visible page and the summary totals are all `computed` off
 * them. So there is no way for the summary to disagree with the table, no
 * "recalculate" call to forget, and no ordering problem between a filter change
 * and a re-sort.
 *
 * The cascade is worth reading top to bottom: `filtered` → `totalPages` →
 * `paginatedRows`, with `summary` hanging off `filtered` as well. Change one
 * filter and every one of those updates exactly once.
 */
@Injectable({ providedIn: 'root' })
class SalesStore {
  /**
   * The dataset.
   */
  private readonly _data = signal<SaleRecord[]>(MOCK_SALES);
  /**
   * The category filter.
   */
  private readonly _catFilter = signal<SaleRecord['category'] | 'all'>('all');
  /**
   * The region filter.
   */
  private readonly _regionFilter = signal<SaleRecord['region'] | 'all'>('all');
  /**
   * Start of the month range.
   */
  private readonly _monthFrom = signal<number>(1);
  /**
   * End of the month range.
   */
  private readonly _monthTo = signal<number>(12);
  /**
   * The sort column.
   */
  private readonly _sortKey = signal<SortKey>('amount');
  /**
   * The sort direction.
   */
  private readonly _sortDir = signal<SortDir>('desc');
  /**
   * The current page.
   */
  private readonly _page = signal<number>(1);

  /**
   * The category filter, read-only.
   */
  readonly catFilter    = this._catFilter.asReadonly();
  /**
   * The region filter, read-only.
   */
  readonly regionFilter = this._regionFilter.asReadonly();
  /**
   * The month range start, read-only.
   */
  readonly monthFrom    = this._monthFrom.asReadonly();
  /**
   * The month range end, read-only.
   */
  readonly monthTo      = this._monthTo.asReadonly();
  /**
   * The sort column, read-only.
   */
  readonly sortKey      = this._sortKey.asReadonly();
  /**
   * The sort direction, read-only.
   */
  readonly sortDir      = this._sortDir.asReadonly();
  /**
   * The current page, read-only.
   */
  readonly page         = this._page.asReadonly();

  /**
   * Every row that passes the filters, in sort order. The root of the derivation
   * chain.
   */
  readonly filtered = computed(() => {
    const cat = this._catFilter();
    const reg = this._regionFilter();
    const mf  = this._monthFrom();
    const mt  = this._monthTo();
    const key = this._sortKey();
    const dir = this._sortDir();
    return [...this._data()]
      .filter((r) =>
        (cat === 'all' || r.category === cat) &&
        (reg === 'all' || r.region === reg) &&
        r.month >= mf && r.month <= mt
      )
      .sort((a, b) => {
        const av = a[key], bv = b[key];
        const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
        return dir === 'asc' ? cmp : -cmp;
      });
  });

  /**
   * How many pages the filtered rows fill. At least one, so an empty result still
   * reads as "page 1 of 1" rather than "page 1 of 0".
   */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  /**
   * The rows on the current page.
   *
   * Clamps the page against {@link totalPages} on read rather than trusting the
   * stored value: filtering down to fewer rows while on page 4 would otherwise show
   * an empty table.
   */
  readonly paginatedRows = computed(() => {
    const p = Math.min(this._page(), this.totalPages());
    return this.filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  });

  /**
   * Totals for the filtered rows — derived from the same source as the table, so
   * the two cannot disagree.
   */
  readonly summary = computed(() => {
    const rows = this.filtered();
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const byCategory = ['hardware', 'software', 'services'].map((cat) => {
      const sum = rows.filter((r) => r.category === cat).reduce((s, r) => s + r.amount, 0);
      return { cat, sum, pct: total > 0 ? Math.round((sum / total) * 100) : 0 };
    });
    const byRegion = ['north', 'south', 'east', 'west'].map((reg) => {
      const sum = rows.filter((r) => r.region === reg).reduce((s, r) => s + r.amount, 0);
      return { reg, sum };
    }).sort((a, b) => b.sum - a.sum);
    return { total, count: rows.length, byCategory, byRegion, avg: rows.length > 0 ? Math.round(total / rows.length) : 0 };
  });

  /**
   * Sets the category filter.
   *
   * Resets to page 1, as every filter setter does: staying on page 4 of a result
   * that now has one page is the classic filtering bug.
   *
   * @param v The category, or `all`.
   */
  setCatFilter(v: SaleRecord['category'] | 'all')  { this._catFilter.set(v); this._page.set(1); }
  /**
   * Sets the region filter and resets to page 1.
   *
   * @param v The region, or `all`.
   */
  setRegionFilter(v: SaleRecord['region'] | 'all') { this._regionFilter.set(v); this._page.set(1); }
  /**
   * Sets the month range start and resets to page 1.
   *
   * @param m The month.
   */
  setMonthFrom(m: number) { this._monthFrom.set(m); this._page.set(1); }
  /**
   * Sets the month range end and resets to page 1.
   *
   * @param m The month.
   */
  setMonthTo(m: number)   { this._monthTo.set(m); this._page.set(1); }
  /**
   * Goes to a page, clamped to the valid range.
   *
   * @param p The page.
   */
  setPage(p: number)      { this._page.set(Math.max(1, Math.min(p, this.totalPages()))); }
  /**
   * Goes to the next page.
   */
  nextPage()              { this.setPage(this._page() + 1); }
  /**
   * Goes to the previous page.
   */
  prevPage()              { this.setPage(this._page() - 1); }

  /**
   * Sorts by a column, or flips the direction if it is already the sort column.
   *
   * @param key The column.
   */
  setSort(key: SortKey) {
    if (this._sortKey() === key) {
      this._sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this._sortKey.set(key);
      this._sortDir.set('desc');
    }
    this._page.set(1);
  }

  /**
   * Exports the filtered rows as a CSV download.
   *
   * Built from a `Blob` and an object URL with no library involved — worth seeing
   * once, because "export to CSV" tends to get treated as a dependency. Exports
   * what is *filtered*, not what is on the current page, which is almost always
   * what the user meant.
   */
  exportCSV(): void {
    const rows = this.filtered();
    const header = 'id,product,category,amount,region,month';
    const lines = rows.map((r) => `${r.id},"${r.product}",${r.category},${r.amount},${r.region},${r.month}`);
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Project: Data Dashboard — filtering, sorting, pagination and export over one
 * dataset.
 *
 * A practice project rather than a lesson. The point of it is the derivation
 * chain in {@link SalesStore}: four filters, a sort and a page number as the only
 * state, with the table, the page count and the summary all computed. Nothing is
 * kept in sync by hand, because nothing is duplicated.
 *
 * @see expert/state-management — the store pattern.
 * @see beginner/signals — `computed` and why derived state beats stored state.
 */
@Component({
  selector: 'app-project-data-dashboard',
  standalone: true,
  imports: [RouterLink],
  styleUrl: './data-dashboard.css',
  templateUrl: './data-dashboard.html',
})
export class DataDashboard {
  /**
   * The store.
   */
  protected readonly store = inject(SalesStore);
  /**
   * The category options.
   */
  protected readonly categories = ['all', 'hardware', 'software', 'services'];
  /**
   * The region options.
   */
  protected readonly regions = ['all', 'north', 'south', 'east', 'west'];

  /**
   * The sort indicator for a column header.
   *
   * @param key The column.
   * @returns An arrow for the sorted column, a neutral glyph otherwise.
   */
  sortIcon(key: SortKey): string {
    if (this.store.sortKey() !== key) return '⇅';
    return this.store.sortDir() === 'asc' ? '↑' : '↓';
  }
}
