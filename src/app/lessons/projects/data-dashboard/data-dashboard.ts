import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

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
  { id: 1, product: 'Angular Pro', category: 'software', amount: 4200, region: 'north', month: 1 },
  { id: 2, product: 'Dev Laptop', category: 'hardware', amount: 1800, region: 'south', month: 1 },
  { id: 3, product: 'Support Plan', category: 'services', amount: 900, region: 'east', month: 1 },
  { id: 4, product: 'Angular Pro', category: 'software', amount: 3800, region: 'west', month: 2 },
  { id: 5, product: 'Keyboard', category: 'hardware', amount: 280, region: 'north', month: 2 },
  { id: 6, product: 'Consulting', category: 'services', amount: 2400, region: 'south', month: 2 },
  { id: 7, product: 'Angular Pro', category: 'software', amount: 5100, region: 'east', month: 3 },
  { id: 8, product: 'Monitor', category: 'hardware', amount: 640, region: 'west', month: 3 },
  { id: 9, product: 'Support Plan', category: 'services', amount: 1200, region: 'north', month: 3 },
  {
    id: 10,
    product: 'TypeScript Lib',
    category: 'software',
    amount: 2900,
    region: 'south',
    month: 4,
  },
  { id: 11, product: 'Dev Laptop', category: 'hardware', amount: 3600, region: 'east', month: 4 },
  { id: 12, product: 'Consulting', category: 'services', amount: 1800, region: 'west', month: 4 },
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
 * The cascade is worth reading top to bottom: `filtered` → `sorted` →
 * `paginatedRows`, with `totalPages` and `summary` hanging off `filtered` as
 * well. Change one filter and every one of those updates exactly once; change
 * the sort column and only the two selectors that depend on it do any work.
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
  readonly catFilter = this._catFilter.asReadonly();
  /**
   * The region filter, read-only.
   */
  readonly regionFilter = this._regionFilter.asReadonly();
  /**
   * The month range start, read-only.
   */
  readonly monthFrom = this._monthFrom.asReadonly();
  /**
   * The month range end, read-only.
   */
  readonly monthTo = this._monthTo.asReadonly();
  /**
   * The sort column, read-only.
   */
  readonly sortKey = this._sortKey.asReadonly();
  /**
   * The sort direction, read-only.
   */
  readonly sortDir = this._sortDir.asReadonly();
  /**
   * The current page, read-only.
   */
  readonly page = this._page.asReadonly();

  /**
   * Every row that passes the filters. The root of the derivation chain.
   *
   * Deliberately does **not** sort. Filtering and sorting are split into two
   * selectors so that each reads only the signals it genuinely needs: changing the
   * sort column leaves this one's cache valid, and so leaves `totalPages` and
   * `summary` — which both hang off it — untouched. Folding the sort in here would
   * work identically on screen while invalidating the entire graph on every header
   * click.
   */
  readonly filtered = computed(() => {
    const cat = this._catFilter();
    const reg = this._regionFilter();
    const mf = this._monthFrom();
    const mt = this._monthTo();
    return this._data().filter(
      (r) =>
        (cat === 'all' || r.category === cat) &&
        (reg === 'all' || r.region === reg) &&
        r.month >= mf &&
        r.month <= mt,
    );
  });

  /**
   * The filtered rows in sort order.
   *
   * Copies before sorting, because `Array.prototype.sort` mutates in place and the
   * array it receives is `filtered`'s cached value — sorting it directly would
   * corrupt a cache other selectors are still reading.
   */
  readonly sorted = computed(() => {
    const key = this._sortKey();
    const dir = this._sortDir();
    return [...this.filtered()].sort((a, b) => {
      const av = a[key],
        bv = b[key];
      const cmp =
        typeof av === 'string'
          ? (av as string).localeCompare(bv as string)
          : (av as number) - (bv as number);
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
    return this.sorted().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
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
    const byRegion = ['north', 'south', 'east', 'west']
      .map((reg) => {
        const sum = rows.filter((r) => r.region === reg).reduce((s, r) => s + r.amount, 0);
        return { reg, sum };
      })
      .sort((a, b) => b.sum - a.sum);
    return {
      total,
      count: rows.length,
      byCategory,
      byRegion,
      avg: rows.length > 0 ? Math.round(total / rows.length) : 0,
    };
  });

  /**
   * Sets the category filter.
   *
   * Resets to page 1, as every filter setter does: staying on page 4 of a result
   * that now has one page is the classic filtering bug.
   *
   * @param v The category, or `all`.
   */
  setCatFilter(v: SaleRecord['category'] | 'all') {
    this._catFilter.set(v);
    this._page.set(1);
  }
  /**
   * Sets the region filter and resets to page 1.
   *
   * @param v The region, or `all`.
   */
  setRegionFilter(v: SaleRecord['region'] | 'all') {
    this._regionFilter.set(v);
    this._page.set(1);
  }
  /**
   * Sets the month range start and resets to page 1.
   *
   * @param m The month.
   */
  setMonthFrom(m: number) {
    this._monthFrom.set(m);
    this._page.set(1);
  }
  /**
   * Sets the month range end and resets to page 1.
   *
   * @param m The month.
   */
  setMonthTo(m: number) {
    this._monthTo.set(m);
    this._page.set(1);
  }
  /**
   * Goes to a page, clamped to the valid range.
   *
   * @param p The page.
   */
  setPage(p: number) {
    this._page.set(Math.max(1, Math.min(p, this.totalPages())));
  }
  /**
   * Goes to the next page.
   */
  nextPage() {
    this.setPage(this._page() + 1);
  }
  /**
   * Goes to the previous page.
   */
  prevPage() {
    this.setPage(this._page() - 1);
  }

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
    const lines = rows.map(
      (r) => `${r.id},"${r.product}",${r.category},${r.amount},${r.region},${r.month}`,
    );
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
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/` + `shared/teaching/`; see
 * `expert/change-detection` for the reference implementation of the layer
 * itself). A *concept* lesson tells pose → analogy → mechanism → four modes; a
 * *project* lesson this size instead walks the real build piece by piece —
 * `SaleRecord` → the store's sources → its writers → each `computed` selector, in
 * dependency order — because the thing being taught is a working system, not one
 * idea. Every code sample under "Piece N" is the actual {@link SalesStore}
 * source, not a simplified stand-in, broken into focused `app-code-lab` blocks
 * rather than one unannotated wall. The live demo below keeps its exact original
 * markup and the store's public API untouched — only the teaching scaffolding
 * around it changed shape.
 *
 * @see expert/state-management — the store pattern.
 * @see beginner/signals — `computed` and why derived state beats stored state.
 */
@Component({
  selector: 'app-project-data-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './data-dashboard.css',
  templateUrl: './data-dashboard.html',
})
export class DataDashboard {
  /** The Projects track "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Task Manager', id: 'task-manager' },
    { label: 'Auth Flow', id: 'auth-flow' },
    { label: 'Data Dashboard' },
  ];

  /**
   * The derivation chain, as stations on a line. Each `computed` reads only the
   * stage above it, which is what makes a filter change and a sort change cost
   * different amounts of work.
   */
  protected readonly pipeline = [
    { label: '`_data`', detail: 'The raw records — the only writable signal in the chain' },
    {
      label: '`filtered`',
      detail: 'Category, region and month narrow the set',
      tone: 'accent' as const,
    },
    { label: '`sorted`', detail: 'Reorders them — the only station that reads the sort key' },
    { label: '`totalPages`', detail: 'Reads the filtered *length*; sorting cannot change a count' },
    { label: '`paginatedRows`', detail: 'Slices the current page out of `sorted`' },
    {
      label: '`summary`',
      detail: 'KPIs branch off `filtered`, not off the page',
      tone: 'good' as const,
    },
    { label: 'Template', detail: 'Reads the end of the chain; nothing computes in the markup' },
  ];

  // ── Piece 1: the model ─────────────────────────────────────────────────────

  /** The exact `SaleRecord` interface, unchanged from the real file. */
  protected readonly modelSample = `interface SaleRecord {
  id: number;
  product: string;
  category: 'hardware' | 'software' | 'services';
  amount: number;
  region: 'north' | 'south' | 'east' | 'west';
  month: number;
}`;

  /** Line-by-line walkthrough of {@link modelSample}. */
  protected readonly modelNotes: CodeNote[] = [
    {
      line: 1,
      text: 'One row in the dataset. Every signal, filter and `computed` selector in this project works with exactly this shape — get it right once and nothing downstream has to guess.',
    },
    {
      line: 2,
      text: "A stable, unique key. It exists for `@for`'s `track` clause — never track by array index, because a filter or sort reordering the rows would then reuse the wrong DOM node for the wrong row.",
    },
    {
      line: 4,
      text: 'An inline union instead of `string`. The filter buttons, the KPI grouping keys and this field now share one list of valid values, defined in exactly one place — add a category here and the compiler points at every place that also needs it.',
    },
    {
      line: 5,
      text: 'Whole currency units, not a formatted string. `toLocaleString()` turns it into `$4,200` at render time — the number itself stays cheap to sum and to sort.',
    },
    {
      line: 6,
      text: 'Same trick as `category`, one line up: a closed set of four regions instead of an open `string`.',
    },
    {
      line: 7,
      text: "1–12 as a number, not `'January'` as a string. Sorting a number is a subtraction; sorting the word would need a lookup table just to know that March comes after February.",
    },
  ];

  // ── Piece 2: the sources ───────────────────────────────────────────────────

  /** The store's writable signals, verbatim from {@link SalesStore}. */
  protected readonly sourcesSample = `private readonly _data = signal<SaleRecord[]>(MOCK_SALES);
private readonly _catFilter = signal<SaleRecord['category'] | 'all'>('all');
private readonly _regionFilter = signal<SaleRecord['region'] | 'all'>('all');
private readonly _monthFrom = signal<number>(1);
private readonly _monthTo = signal<number>(12);
private readonly _sortKey = signal<SortKey>('amount');
private readonly _sortDir = signal<SortDir>('desc');
private readonly _page = signal<number>(1);`;

  /** Line-by-line walkthrough of {@link sourcesSample}. */
  protected readonly sourcesNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The only place raw rows live. Every other signal on this page is a decision *about* this data; in production this exact slot is where an `rxResource()` value would sit instead — see "Going to production" below.',
    },
    {
      line: 2,
      text: "`'all'` is a sentinel meaning *no filter*, not a fifth category. Every selector that reads this treats `'all'` as one special case, checked once, rather than branching on it all over the codebase.",
    },
    {
      line: 4,
      text: 'Two signals, not one range object. `computed()` tracks each signal it reads independently, so dragging only the *left* thumb of the month slider never invalidates a selector that only reads `_monthTo`.',
    },
    {
      line: 6,
      text: 'Which column, typed as the literal union `SortKey` rather than `string`. Misspelling a column name here is a compile error, not a bug that only surfaces the day someone clicks that particular header.',
    },
    {
      line: 8,
      text: 'The current page. It is stored, on purpose — see Piece 6 for why the page *count* sitting right next to it is not.',
    },
  ];

  // ── Piece 3: the writers ───────────────────────────────────────────────────

  /** The only two setters that touch the filter/sort signals, verbatim. */
  protected readonly writersSample = `setCatFilter(v: SaleRecord['category'] | 'all') {
  this._catFilter.set(v);
  this._page.set(1);
}

setSort(key: SortKey) {
  if (this._sortKey() === key) {
    this._sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  } else {
    this._sortKey.set(key);
    this._sortDir.set('desc');
  }
  this._page.set(1);
}`;

  /** Line-by-line walkthrough of {@link writersSample}. */
  protected readonly writersNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Components never touch `_catFilter` directly. Every write goes through a method like this one — which is what lets the method enforce a rule the raw signal cannot enforce by itself.',
    },
    {
      line: 3,
      text: 'Every setter in this store ends with this same line. Skip it in just one of them and you get the classic filtering bug: three rows left, and the page indicator is stubbornly parked on page 4 of what used to be a five-page result.',
    },
    {
      line: 7,
      text: "Clicking the column you're **already** sorted by flips the direction instead of doing nothing — `update()` reads the current direction and writes its opposite.",
    },
    {
      line: 9,
      text: "A *different* column resets to descending on purpose. The first click on a new column means 'show me the biggest first', not 'carry on whatever ordering happened to be running'.",
    },
    {
      line: 13,
      text: 'The same page-reset as `setCatFilter`, and the same reason: changing the sort can change what the top of the list looks like, and a stale page number should never be left pointing at the wrong rows.',
    },
  ];

  // ── Piece 4: filtered ───────────────────────────────────────────────────────

  /** The `filtered` selector, verbatim from {@link SalesStore}. */
  protected readonly filteredSample = `readonly filtered = computed(() => {
  const cat = this._catFilter();
  const reg = this._regionFilter();
  const mf = this._monthFrom();
  const mt = this._monthTo();
  return this._data().filter(
    (r) =>
      (cat === 'all' || r.category === cat) &&
      (reg === 'all' || r.region === reg) &&
      r.month >= mf &&
      r.month <= mt,
  );
});`;

  /** Line-by-line walkthrough of {@link filteredSample}. */
  protected readonly filteredNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The root of the whole derivation chain. Every other `computed` in this store eventually reads this one — directly, or through another `computed` that does.',
    },
    {
      line: 2,
      text: 'All four filter signals are read into locals **before** `.filter()` runs, rather than inside the callback. Reading them once, up front, makes the full list of what this selector depends on obvious at a glance — instead of buried inside a function that runs once per row.',
    },
    {
      line: 8,
      text: "Each clause short-circuits on `'all'`, so 'no filter applied' costs one cheap comparison rather than a separate `if` branch living somewhere else in the code.",
    },
    {
      line: 12,
      text: "Notice what's missing: no sorting anywhere in here. `filtered` only narrows the set — see Piece 5 for why keeping that split matters.",
    },
  ];

  // ── Piece 5: sorted ─────────────────────────────────────────────────────────

  /** The `sorted` selector, verbatim from {@link SalesStore}. */
  protected readonly sortedSample = `readonly sorted = computed(() => {
  const key = this._sortKey();
  const dir = this._sortDir();
  return [...this.filtered()].sort((a, b) => {
    const av = a[key],
      bv = b[key];
    const cmp =
      typeof av === 'string'
        ? (av as string).localeCompare(bv as string)
        : (av as number) - (bv as number);
    return dir === 'asc' ? cmp : -cmp;
  });
});`;

  /** Line-by-line walkthrough of {@link sortedSample}. */
  protected readonly sortedNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Reads `filtered()`, not `_data()` directly — sorting always happens on the already-narrowed set, never on the whole dataset.',
    },
    {
      line: 4,
      text: "`[...this.filtered()]` — **the spread is not optional.** `Array.prototype.sort` mutates in place, and `filtered()` hands back its own cached array. Sort that directly and you've silently corrupted a value every other selector reading `filtered()` still trusts.",
    },
    {
      line: 5,
      text: '`a[key]` — `key` is a `SortKey`, so this reads whichever column is currently active without a `switch` for every possible column.',
    },
    {
      line: 8,
      text: "One comparator, two column types: `localeCompare` for text (handles accents and casing correctly), subtraction for numbers. The `as` casts exist because `a[key]`'s type is a union of both.",
    },
    {
      line: 11,
      text: 'Direction is applied by negating the result. One comparator, both directions — no duplicated logic for ascending versus descending.',
    },
  ];

  // ── Piece 6: pagination ─────────────────────────────────────────────────────

  /** `totalPages` and `paginatedRows`, verbatim from {@link SalesStore}. */
  protected readonly paginationSample = `readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

readonly paginatedRows = computed(() => {
  const p = Math.min(this._page(), this.totalPages());
  return this.sorted().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
});`;

  /** Line-by-line walkthrough of {@link paginationSample}. */
  protected readonly paginationNotes: CodeNote[] = [
    {
      line: 1,
      text: "Reads `filtered().length` — a **count**, not the sorted or paginated data. Reordering a thousand rows can never change how many pages they fill, so `totalPages` has no reason to react to a sort. `Math.max(1, …)` keeps an empty result reading as 'page 1 of 1' instead of the more honest but uglier 'page 1 of 0'.",
    },
    {
      line: 4,
      text: 'Clamps the stored page against the **current** `totalPages()` on every read, instead of trusting whatever `_page` last held. Filter down to two pages while parked on page 4 and this recovers you to page 2 automatically — no extra code path needed for it.',
    },
    {
      line: 5,
      text: "Slices `sorted()`, not `filtered()`. Pagination has to happen *after* the order is decided, or 'page 2' would mean a different set of rows every time the sort changed.",
    },
  ];

  // ── Piece 7: summary — the KPI derivation ──────────────────────────────────

  /** The `summary` selector, verbatim from {@link SalesStore}. */
  protected readonly summarySample = `readonly summary = computed(() => {
  const rows = this.filtered();
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCategory = ['hardware', 'software', 'services'].map((cat) => {
    const sum = rows.filter((r) => r.category === cat).reduce((s, r) => s + r.amount, 0);
    return { cat, sum, pct: total > 0 ? Math.round((sum / total) * 100) : 0 };
  });
  const byRegion = ['north', 'south', 'east', 'west']
    .map((reg) => {
      const sum = rows.filter((r) => r.region === reg).reduce((s, r) => s + r.amount, 0);
      return { reg, sum };
    })
    .sort((a, b) => b.sum - a.sum);
  return {
    total,
    count: rows.length,
    byCategory,
    byRegion,
    avg: rows.length > 0 ? Math.round(total / rows.length) : 0,
  };
});`;

  /** Line-by-line walkthrough of {@link summarySample}. */
  protected readonly summaryNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Reads `filtered()` — **not** `sorted()` and not `paginatedRows()`. A KPI that changed when you turned the page would be describing your scroll position, not your business. Keep this in mind for the Predict below.',
    },
    {
      line: 3,
      text: 'One `reduce` over the whole filtered set. Cheap even at real scale, because `computed()` only re-runs this when `filtered()` itself actually changed.',
    },
    {
      line: 6,
      text: "`total > 0 ? … : 0` guards the empty-result case. Filter every row out and `sum / total` would otherwise be `0 / 0`, which is `NaN` — which renders as the literal text 'NaN%' on the bar chart below.",
    },
    {
      line: 13,
      text: "Sorted **descending by revenue**, purely so the live demo's 'Top Region' KPI can just read `byRegion[0]`. The sort *is* the 'find the biggest' logic — no separate max-finding code needed.",
    },
    {
      line: 19,
      text: 'The same `NaN` guard as line 6, same reason: an empty filtered set must not divide by zero.',
    },
  ];

  /**
   * The three-actor exchange a single header click sets off — which of the five
   * selectors downstream of a sort key actually have to redo any work.
   */
  protected readonly dependencyTalk: BubbleTurn[] = [
    { who: 'You', says: 'I click the **Amount** column header to sort by it.' },
    {
      who: '`setSort()`',
      says: "Different column, so I set `_sortKey` to `'amount'` and `_sortDir` to `'desc'` — and I reset `_page` to 1, same as always.",
    },
    {
      who: '`sorted`',
      says: "I read `_sortKey` and `_sortDir` on every run, so I'm invalidated. Recomputing now.",
    },
    {
      who: '`filtered`',
      says: 'I never read `_sortKey` or `_sortDir`. My cache from last time is still good — nothing for me to do.',
    },
    {
      who: '`summary`',
      says: "I only read `filtered`, which didn't change. Still valid — the KPI totals hold perfectly still while the table reorders underneath them.",
    },
    {
      who: '`paginatedRows`',
      says: 'I read `sorted`, which *did* change, so I re-slice. Same page number, a different set of rows sitting on it.',
    },
  ];

  /** Choices for the dependency-tracking check. */
  protected readonly chainOptions: QuizOption[] = [
    {
      text: 'All five — a change anywhere invalidates the whole chain',
      why: 'That is how a naive cache would behave. Signals track dependencies per *read*, so invalidation follows the actual graph: only selectors that touched `_sortKey`, directly or through something that did, are affected.',
    },
    {
      text: '`sorted` and `paginatedRows`',
      correct: true,
      why: '`sorted` is the only selector that reads `_sortKey`, and `paginatedRows` slices `sorted`, so it goes stale too. `filtered` never looks at the sort key, so its cache stands — which means `totalPages` and `summary`, both of which read only `filtered`, are untouched. Reordering rows cannot change how many there are or what they add up to.',
    },
    {
      text: '`filtered`, `sorted` and `paginatedRows`',
      why: 'The dependency runs the other way. `sorted` reads `filtered`, so a *filter* change reaches sorting — but a sort change does not travel back *upstream*. `filtered` has no idea the sort key exists.',
    },
    {
      text: 'None until something reads them',
      why: 'The better instinct, and half right: `computed` is lazy, so nothing recomputes at the instant you call `set()`. But the template is reading these on the very next render, so the real question is which ones got *marked* stale — and that is `sorted` and `paginatedRows`.',
    },
  ];

  // ── Going to production ─────────────────────────────────────────────────────

  /** The mock signal this project actually ships with. */
  protected readonly mockSourceSample = `private readonly _data = signal<SaleRecord[]>(MOCK_SALES);

readonly filtered = computed(() => {
  const data = this._data();
  // ...apply the four filters
});`;

  /** The same slot, swapped for a real HTTP call via rxResource(). */
  protected readonly resourceSourceSample = `private readonly http = inject(HttpClient);

private readonly salesResource = rxResource({
  // The loader runs automatically — no ngOnInit, no manual subscribe.
  loader: () => this.http.get<SaleRecord[]>('/api/sales'),
});

readonly isLoading = this.salesResource.isLoading;
readonly error = this.salesResource.error;

readonly filtered = computed(() => {
  // value() is undefined during the first load — '?? []' means every
  // downstream selector can assume an array instead of crashing on it.
  const data = this.salesResource.value() ?? [];
  // ...apply the four filters
});`;

  /** All three load states, handled in the template with no boolean flags. */
  protected readonly loadingStatesSample = `@if (store.isLoading()) {
  <!-- A skeleton, not a spinner: it reserves the layout so nothing jumps. -->
  <div class="loading-skeleton">Loading…</div>
} @else if (store.error()) {
  <!-- Always give the user a way out, not a dead end. -->
  <div class="error">Failed to load. <button (click)="store.reload()">Retry</button></div>
} @else {
  <!-- Reached only once loading finished AND nothing failed. -->
}`;

  // ── Performance ─────────────────────────────────────────────────────────────

  /** The template-method trap, posed before the section names it. */
  protected readonly templateCallSample = `// In the table template:
<td>{{ formatCurrency(record.amount) }}</td>

formatCurrency(n: number) {
  console.count('formatCurrency');
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(n);
}

// 50 rows on screen. You type one character into a
// search box that has nothing to do with the amounts.
// What does the counter say?`;

  /** The method-call version — recomputes on every change-detection pass. */
  protected readonly badMethodSample = `<td>{{ formatCurrency(record.amount) }}</td>

formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}`;

  /** The computed-selector version — recomputes only when filtered() changes. */
  protected readonly goodComputedSample = `readonly formattedRows = computed(() =>
  this.filtered().map((r) => ({
    ...r,
    displayAmount: currencyFormatter.format(r.amount),
  })),
);`;

  /** The doubts this project reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why is a method call in the template so bad? It is the same function either way.',
      a: "Same function, wildly different call count. Angular cannot know whether a method's result changed without calling it, so it calls it on *every* change-detection pass — for every row. A `computed` is asked once, caches, and is only re-asked when a signal it read actually changed. The work is identical; the number of times you pay for it is not.",
    },
    {
      q: 'Is a long chain of computeds slow? This one is five deep.',
      a: 'No, and depth is the wrong thing to worry about. Each link caches, so a five-stage chain where nothing changed costs five cheap version checks and zero recomputation. What costs you is *width* — a selector that reads a signal it does not need, dragging itself into invalidations that have nothing to do with it. Keep each `computed` reading the minimum.',
    },
    {
      q: 'Why is the current page a signal but `totalPages` a computed?',
      a: 'Because one is a decision and the other is a consequence. The user picks a page — nothing else determines it, so it has to be stored. Total pages is a fact about the filtered data; storing it would mean keeping it in step by hand, and the first filter change you forget leaves a pager offering page 7 of a 3-page list. If you can derive it, derive it.',
    },
    {
      q: 'When would a pure pipe be better than a computed?',
      a: 'When the formatting belongs to the *view*, not the data, and you want it reusable across templates. `{{ amount | currency }}` is memoised per input by Angular, so it has the same cheap-repeat property as a `computed`, and it keeps display concerns out of the store. Reach for `computed` when the derived value is shared or feeds other derivations; reach for a pure pipe when it is per-cell presentation.',
    },
    {
      q: "So pagination is completely walled off from the KPI totals — doesn't that feel like two separate features bolted together?",
      a: "They're two separate *concerns*, which is different from separate features: paging is about what's currently on your screen, and the KPIs are about the whole selection. `summary` and `paginatedRows` both branch off the exact same `filtered()`, so a filter change updates both, together, from one source — what they don't share is *each other*, which is exactly the property that made the Predict above true.",
    },
  ];

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
