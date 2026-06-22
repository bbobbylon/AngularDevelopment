import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

// ============================================================
// WHAT YOU'LL BUILD: a Data Dashboard covering:
//   resource() API, HTTP simulation, signal stores,
//   computed selectors, sorting/filtering, charts (ASCII),
//   loading/error states, performance (OnPush, computed)
// ============================================================

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

type SortKey = 'amount' | 'product' | 'month';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 5;

@Injectable({ providedIn: 'root' })
class SalesStore {
  private readonly _data = signal<SaleRecord[]>(MOCK_SALES);
  private readonly _catFilter = signal<SaleRecord['category'] | 'all'>('all');
  private readonly _regionFilter = signal<SaleRecord['region'] | 'all'>('all');
  private readonly _monthFrom = signal<number>(1);
  private readonly _monthTo = signal<number>(12);
  private readonly _sortKey = signal<SortKey>('amount');
  private readonly _sortDir = signal<SortDir>('desc');
  private readonly _page = signal<number>(1);

  readonly catFilter    = this._catFilter.asReadonly();
  readonly regionFilter = this._regionFilter.asReadonly();
  readonly monthFrom    = this._monthFrom.asReadonly();
  readonly monthTo      = this._monthTo.asReadonly();
  readonly sortKey      = this._sortKey.asReadonly();
  readonly sortDir      = this._sortDir.asReadonly();
  readonly page         = this._page.asReadonly();

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

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  readonly paginatedRows = computed(() => {
    const p = Math.min(this._page(), this.totalPages());
    return this.filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  });

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

  setCatFilter(v: SaleRecord['category'] | 'all')  { this._catFilter.set(v); this._page.set(1); }
  setRegionFilter(v: SaleRecord['region'] | 'all') { this._regionFilter.set(v); this._page.set(1); }
  setMonthFrom(m: number) { this._monthFrom.set(m); this._page.set(1); }
  setMonthTo(m: number)   { this._monthTo.set(m); this._page.set(1); }
  setPage(p: number)      { this._page.set(Math.max(1, Math.min(p, this.totalPages()))); }
  nextPage()              { this.setPage(this._page() + 1); }
  prevPage()              { this.setPage(this._page() - 1); }

  setSort(key: SortKey) {
    if (this._sortKey() === key) {
      this._sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this._sortKey.set(key);
      this._sortDir.set('desc');
    }
    this._page.set(1);
  }

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

@Component({
  selector: 'app-project-data-dashboard',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin: 14px 0; }
    .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; }
    .kpi__label { font-size: .78rem; color: var(--text-muted); margin: 0 0 4px; }
    .kpi__value { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .filter-row button { padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-size: .82rem; color: var(--text); }
    .filter-row button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    .data-table th { background: var(--surface); padding: 8px 10px; text-align: left; border-bottom: 2px solid var(--border); cursor: pointer; user-select: none; }
    .data-table th:hover { background: rgba(99,102,241,.06); }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
    .badge-cat { font-size: .72rem; padding: 2px 7px; border-radius: 20px; }
    .badge-hardware { background: #dbeafe; color: #1e40af; }
    .badge-software { background: #ede9fe; color: #5b21b6; }
    .badge-services { background: #d1fae5; color: #065f46; }
    .bar-container { display: flex; align-items: center; gap: 8px; }
    .bar-track { flex: 1; height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 5px; transition: width .3s; }
    .bar-fill-software { background: #8b5cf6; }
    .bar-fill-hardware { background: #3b82f6; }
    .bar-fill-services { background: #22c55e; }
    .region-table { width: 100%; font-size: .87rem; }
    .region-table td { padding: 6px 0; }
    .step-callout { background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.2); border-radius: 10px; padding: 12px 16px; margin: 14px 0; font-size: .88rem; line-height: 1.5; }
    .step-callout h4 { margin: 0 0 6px; color: #6366f1; }
    .sort-icon { font-size: .7rem; margin-left: 4px; color: var(--text-muted); }
    .month-range { display: flex; align-items: center; gap: 8px; font-size: .82rem; color: var(--text-muted); flex-wrap: wrap; }
    .month-range input[type=range] { width: 100px; accent-color: #6366f1; }
    .pagination { display: flex; align-items: center; gap: 8px; margin: 10px 0; font-size: .84rem; }
    .pagination button { padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; color: var(--text); }
    .pagination button:disabled { opacity: .4; cursor: default; }
    .export-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid #22c55e; background: rgba(34,197,94,.08); color: #16a34a; cursor: pointer; font-size: .82rem; font-weight: 600; }
    .export-btn:hover { background: rgba(34,197,94,.16); }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Projects · Full Walkthrough</span>
      <h1>Project: Data Dashboard</h1>
      <p class="lead">
        Build a sales dashboard with live filtering, sorting, KPI cards and a category
        breakdown chart. This project focuses on reactive data patterns — computed
        selectors, signal stores for filter state, and performance best practices.
      </p>

      <h2>What you will build</h2>
      <ul>
        <li>KPI cards: total revenue, record count, average deal</li>
        <li>Filter by category (hardware/software/services) and region</li>
        <li>Sortable data table with click-to-sort column headers</li>
        <li>Category breakdown bar chart (signal-driven, no library)</li>
        <li>All computed from a signal store — zero redundant state</li>
      </ul>

      <h2>Architecture overview</h2>
      <div class="code">
        <pre>SalesStore (service)
  _data:         Signal&lt;SaleRecord[]&gt;     // raw data (from HTTP in production)
  _catFilter:    Signal&lt;category | 'all'&gt;
  _regionFilter: Signal&lt;region | 'all'&gt;
  _sortKey:      Signal&lt;SortKey&gt;
  _sortDir:      Signal&lt;asc | desc&gt;

  filtered: computed()  // applies filters + sort — the "view" of the data
  summary:  computed()  // total, avg, byCategory, byRegion — all derived

DashboardPage
  injects SalesStore
  template reads only computed signals — no logic in the template</pre>
      </div>

      <h2>Step 1 — Model and mock data</h2>
      <div class="code">
        <pre>interface SaleRecord {{ '{' }}
  id: number;
  product: string;
  category: 'hardware' | 'software' | 'services';
  amount: number;
  region: 'north' | 'south' | 'east' | 'west';
  month: number;
{{ '}' }}

// In production, load from HTTP:
// readonly data = rxResource({{ '{' }} loader: () =&gt; this.http.get&lt;SaleRecord[]&gt;('/api/sales') {{ '}' }});</pre>
      </div>

      <h2>Step 2 — Signal store with filter + sort state</h2>
      <div class="step-callout">
        <h4>Key pattern: all UI state in signals, all derived data in computed()</h4>
        The filter and sort values are signals. The filtered/sorted list and all KPIs are
        computed() — they re-derive automatically whenever any input signal changes.
        There is no "refresh" method and no intermediate state to synchronize.
      </div>
      <div class="code">
        <pre>&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class SalesStore {{ '{' }}
  private readonly _data         = signal&lt;SaleRecord[]&gt;([]);
  private readonly _catFilter    = signal&lt;'all' | Category&gt;('all');
  private readonly _regionFilter = signal&lt;'all' | Region&gt;('all');
  private readonly _sortKey      = signal&lt;SortKey&gt;('amount');
  private readonly _sortDir      = signal&lt;'asc' | 'desc'&gt;('desc');

  readonly filtered = computed(() =&gt; {{ '{' }}
    const cat = this._catFilter(), reg = this._regionFilter();
    const key = this._sortKey(),   dir = this._sortDir();
    return [...this._data()]
      .filter(r =&gt; (cat === 'all' || r.category === cat)
                &amp;&amp; (reg === 'all' || r.region === reg))
      .sort((a, b) =&gt; {{ '{' }}
        const cmp = typeof a[key] === 'string'
          ? (a[key] as string).localeCompare(b[key] as string)
          : (a[key] as number) - (b[key] as number);
        return dir === 'asc' ? cmp : -cmp;
      {{ '}' }});
  {{ '}' }});

  readonly summary = computed(() =&gt; {{ '{' }}
    const rows  = this.filtered();
    const total = rows.reduce((s, r) =&gt; s + r.amount, 0);
    return {{ '{' }} total, count: rows.length, avg: Math.round(total / (rows.length || 1)) {{ '}' }};
  {{ '}' }});

  setCatFilter(v: string)    {{ '{' }} this._catFilter.set(v as any); {{ '}' }}
  setRegionFilter(v: string) {{ '{' }} this._regionFilter.set(v as any); {{ '}' }}
  setSort(key: SortKey) {{ '{' }}
    if (this._sortKey() === key)
      this._sortDir.update(d =&gt; d === 'asc' ? 'desc' : 'asc');
    else {{ '{' }} this._sortKey.set(key); this._sortDir.set('desc'); {{ '}' }}
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Step 3 — Loading real data with resource()</h2>
      <div class="code">
        <pre>// For a real HTTP backend, replace the mock signal with rxResource():
&#64;Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class SalesStore {{ '{' }}
  private http = inject(HttpClient);

  // rxResource fetches once on init, exposes isLoading/error/value signals:
  private salesResource = rxResource({{ '{' }}
    loader: () =&gt; this.http.get&lt;SaleRecord[]&gt;('/api/sales'),
  {{ '}' }});

  readonly isLoading = this.salesResource.isLoading;
  readonly error     = this.salesResource.error;

  readonly filtered = computed(() =&gt; {{ '{' }}
    const data = this.salesResource.value() ?? [];
    // ... same filter/sort logic
  {{ '}' }});
{{ '}' }}

// In template:
&#64;if (store.isLoading()) {{ '{' }}
  &lt;div class="loading-skeleton"&gt;Loading...&lt;/div&gt;
{{ '}' }} &#64;else if (store.error()) {{ '{' }}
  &lt;div class="error"&gt;Failed to load data. &lt;button (click)="store.reload()"&gt;Retry&lt;/button&gt;&lt;/div&gt;
{{ '}' }} &#64;else {{ '{' }}
  &lt;!-- render the table --&gt;
{{ '}' }}</pre>
      </div>

      <h2>Step 4 — Performance: computed() vs. template methods</h2>
      <div class="step-callout">
        <h4>Never compute in the template — always use computed()</h4>
        A method call in the template runs on every CD pass. computed() runs only when
        its signal dependencies change. For a dashboard, this is the difference between
        re-sorting 1000 rows every frame vs. only when the sort column changes.
      </div>
      <div class="code">
        <pre>// ❌ Recomputes on every CD pass (can be 60x/sec under interaction):
&lt;td&gt;{{ '{{' }} formatCurrency(record.amount) {{ '}}' }}&lt;/td&gt;

// ✅ Computed selector — recomputes only when filtered() changes:
readonly formattedRows = computed(() =&gt;
  this.store.filtered().map(r =&gt; ({{ '{' }}
    ...r,
    displayAmount: new Intl.NumberFormat('en-US', {{ '{' }} style: 'currency', currency: 'USD' {{ '}' }}).format(r.amount)
  {{ '}' }}))
);

// ✅ Pure pipe alternative — also memoized by Angular:
&#64;Pipe({{ '{' }} name: 'currency', pure: true {{ '}' }})
export class CurrencyPipe implements PipeTransform {{ '{' }}
  transform(value: number): string {{ '{' }}
    return new Intl.NumberFormat('en-US', {{ '{' }} style: 'currency', currency: 'USD' {{ '}' }}).format(value);
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Live demo — extended dashboard</h2>
      <div class="demo">
        <p class="demo__title">Month filter · Pagination · CSV export — all signal-driven</p>

        <div class="kpi-row">
          <div class="kpi">
            <p class="kpi__label">Total Revenue</p>
            <p class="kpi__value">\${{ store.summary().total.toLocaleString() }}</p>
          </div>
          <div class="kpi">
            <p class="kpi__label">Records</p>
            <p class="kpi__value">{{ store.summary().count }}</p>
          </div>
          <div class="kpi">
            <p class="kpi__label">Avg Deal</p>
            <p class="kpi__value">\${{ store.summary().avg.toLocaleString() }}</p>
          </div>
          <div class="kpi">
            <p class="kpi__label">Top Region</p>
            <p class="kpi__value" style="font-size:1.1rem">
              {{ store.summary().byRegion[0]?.reg ?? 'N/A' }}
            </p>
          </div>
        </div>

        <div class="filter-row">
          <strong style="font-size:.82rem;color:var(--text-muted);align-self:center">Category:</strong>
          @for (c of categories; track c) {
            <button [class.active]="store.catFilter() === c" (click)="store.setCatFilter($any(c))">
              {{ c }}
            </button>
          }
        </div>
        <div class="filter-row" style="margin-top:0">
          <strong style="font-size:.82rem;color:var(--text-muted);align-self:center">Region:</strong>
          @for (r of regions; track r) {
            <button [class.active]="store.regionFilter() === r" (click)="store.setRegionFilter($any(r))">
              {{ r }}
            </button>
          }
        </div>

        <div class="month-range">
          <strong>Months:</strong>
          M{{ store.monthFrom() }}
          <input type="range" min="1" max="12" [value]="store.monthFrom()"
            (input)="store.setMonthFrom($any($event.target).valueAsNumber)" />
          –
          <input type="range" min="1" max="12" [value]="store.monthTo()"
            (input)="store.setMonthTo($any($event.target).valueAsNumber)" />
          M{{ store.monthTo() }}
          <span style="color:var(--text-muted)">({{ store.summary().count }} records)</span>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 4px">
          <p style="font-size:.82rem;color:var(--text-muted);margin:0">Click column headers to sort</p>
          <button class="export-btn" (click)="store.exportCSV()">↓ Export CSV</button>
        </div>

        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="store.setSort('product')">
                  Product <span class="sort-icon">{{ sortIcon('product') }}</span>
                </th>
                <th>Category</th>
                <th>Region</th>
                <th (click)="store.setSort('month')">
                  Month <span class="sort-icon">{{ sortIcon('month') }}</span>
                </th>
                <th (click)="store.setSort('amount')" style="text-align:right">
                  Amount <span class="sort-icon">{{ sortIcon('amount') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (row of store.paginatedRows(); track row.id) {
                <tr>
                  <td>{{ row.product }}</td>
                  <td><span class="badge-cat badge-{{ row.category }}">{{ row.category }}</span></td>
                  <td>{{ row.region }}</td>
                  <td>M{{ row.month }}</td>
                  <td style="text-align:right;font-family:monospace">\${{ row.amount.toLocaleString() }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button (click)="store.prevPage()" [disabled]="store.page() === 1">← Prev</button>
          <span>Page {{ store.page() }} / {{ store.totalPages() }}</span>
          <button (click)="store.nextPage()" [disabled]="store.page() === store.totalPages()">Next →</button>
        </div>

        <h3 style="margin-top:20px;font-size:.95rem">Revenue by Category</h3>
        @for (item of store.summary().byCategory; track item.cat) {
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:3px">
              <span>{{ item.cat }}</span>
              <span>\${{ item.sum.toLocaleString() }} ({{ item.pct }}%)</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill bar-fill-{{ item.cat }}" [style.width]="item.pct + '%'"></div>
            </div>
          </div>
        }
      </div>

      <h2>What you practiced</h2>
      <ul>
        <li><strong>Signal store with filter/sort/page state</strong> — all UI state as signals, derived data as computed()</li>
        <li><strong>Month range filter</strong> — two range inputs bound to monthFrom/monthTo signals</li>
        <li><strong>Pagination</strong> — currentPage + totalPages computed from filtered().length; paginatedRows slices it</li>
        <li><strong>CSV export</strong> — Blob + URL.createObjectURL(), no server needed; always exports the full filtered set</li>
        <li><strong>Performance best practices</strong> — no logic in templates, computed() over methods</li>
        <li><strong>Derived chart data</strong> — bar widths from percentage signals, no chart library needed</li>
      </ul>

      <h2>Further extensions</h2>
      <ul>
        <li>Load data from a real API using rxResource() — replace MOCK_SALES with the HTTP call</li>
        <li>Add a sparkline SVG trend chart using path data computed from monthly totals</li>
        <li>Add column visibility toggles — a Set&lt;string&gt; signal + NgClass to show/hide columns</li>
      </ul>

      <p><a routerLink="/">Back to All Concepts →</a></p>
    </article>
  `,
})
export class DataDashboard {
  protected readonly store = inject(SalesStore);
  protected readonly categories = ['all', 'hardware', 'software', 'services'];
  protected readonly regions = ['all', 'north', 'south', 'east', 'west'];

  sortIcon(key: SortKey): string {
    if (this.store.sortKey() !== key) return '⇅';
    return this.store.sortDir() === 'asc' ? '↑' : '↓';
  }
}
