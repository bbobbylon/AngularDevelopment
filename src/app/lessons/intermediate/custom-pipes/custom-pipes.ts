import { Component, Pipe, PipeTransform, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// ── 1. Pure pipe — truncate ─────────────────────────────────────────────────
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 20, trail = '…'): string {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit).trimEnd() + trail : value;
  }
}

// ── 2. Pure pipe — sentenceCase ──────────────────────────────────────────────
@Pipe({ name: 'sentenceCase', standalone: true })
export class SentenceCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}

// ── 3. Pure pipe — filterBy (array filter, same pattern as FilterLessonsPipe) ─
@Pipe({ name: 'filterBy', standalone: true })
export class FilterByPipe implements PipeTransform {
  transform<T extends object>(items: T[], field: keyof T, query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => String(item[field]).toLowerCase().includes(q));
  }
}

// ── 4. Pipe that injects a service (DatePipe) ────────────────────────────────
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  private readonly datePipe = inject(DatePipe);

  transform(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return this.datePipe.transform(isoDate, 'mediumDate') ?? isoDate;
  }
}

// ── 5. Impure pipe — highlight search term (pure: false) ─────────────────────
@Pipe({ name: 'highlight', standalone: true, pure: false })
export class HighlightPipe implements PipeTransform {
  transform(value: string, term: string): string {
    if (!term) return value;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
}

interface Fruit { name: string; color: string }
interface Post  { id: number; title: string; date: string }

@Component({
  selector: 'app-lesson-custom-pipes',
  imports: [RouterLink, FormsModule, TruncatePipe, SentenceCasePipe, FilterByPipe, RelativeTimePipe, HighlightPipe, DatePipe],
  providers: [DatePipe],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Pipes &amp; Directives</span>
      <h1>Custom Pipes</h1>
      <p class="lead">
        A pipe transforms a value for display — formatting, filtering, mapping — without
        touching the component class. Decorate a class with <code>&#64;Pipe</code>,
        implement <code>transform()</code>, add it to a component's <code>imports</code>,
        and use the <code>|</code> operator in the template.
      </p>

      <h2>Anatomy</h2>
      <div class="code"><pre>&#64;Pipe(&#123; name: 'truncate', standalone: true &#125;)   // pure by default
export class TruncatePipe implements PipeTransform &#123;
  transform(value: string, limit = 20, trail = '…'): string &#123;
    return value.length > limit
      ? value.slice(0, limit).trimEnd() + trail
      : value;
  &#125;
&#125;

// In a component:
imports: [TruncatePipe]

// Template — extra args follow the colon:
{{ '{{' }} title | truncate:40:'...' {{ '}}' }}</pre></div>

      <h2>Demo 1 — truncate (pure)</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <label style="font-size:.85rem;color:var(--text-muted)">Limit: {{ limit() }}</label>
        <input type="range" min="5" max="80"
          [ngModel]="limit()" (ngModelChange)="limit.set(+$event)"
          style="width:100%;margin-bottom:12px" />
        <p><span class="pill">original</span> {{ longText }}</p>
        <p><span class="pill" style="color:var(--green)">| truncate:{{ limit() }}</span>
           {{ longText | truncate: limit() }}</p>
      </div>

      <h2>Demo 2 — sentenceCase (pure)</h2>
      <div class="code"><pre>&#64;Pipe(&#123; name: 'sentenceCase', standalone: true &#125;)
export class SentenceCasePipe implements PipeTransform &#123;
  transform(value: string): string &#123;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  &#125;
&#125;</pre></div>
      <div class="demo">
        <p class="demo__title">Live</p>
        <input [(ngModel)]="rawText" placeholder="Type in any case…" style="width:100%;margin-bottom:10px" />
        <p>
          <span class="pill" style="color:var(--green)">| sentenceCase</span>
          {{ rawText() | sentenceCase }}
        </p>
      </div>

      <h2>Demo 3 — filterBy (generic array filter)</h2>
      <p>
        A generic filter pipe takes an array, a field name, and a query string. This is
        the same pattern as the <code>FilterLessonsPipe</code> powering the home-page
        search in this app.
      </p>
      <div class="code"><pre>&#64;Pipe(&#123; name: 'filterBy', standalone: true &#125;)
export class FilterByPipe implements PipeTransform &#123;
  transform&lt;T extends Record&lt;string, unknown&gt;&gt;(
    items: T[], field: keyof T, query: string
  ): T[] &#123;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =&gt; String(i[field]).toLowerCase().includes(q));
  &#125;
&#125;

// Template:
&#64;for (f of fruits | filterBy:'name':query(); track f.name) &#123; … &#125;</pre></div>
      <div class="demo">
        <p class="demo__title">Live</p>
        <input [(ngModel)]="fruitQuery" placeholder="Filter fruits…" style="width:100%;margin-bottom:10px" />
        <div class="row" style="flex-wrap:wrap;gap:8px">
          @for (f of fruits | filterBy:'name':fruitQuery(); track f['name']) {
            <span class="pill" [style.border-color]="f['color']" [style.color]="f['color']">
              {{ f['name'] }}
            </span>
          } @empty {
            <span style="color:var(--text-muted);font-size:.85rem">No fruits match.</span>
          }
        </div>
      </div>

      <h2>Demo 4 — relativeTime (pipe that injects a service)</h2>
      <p>
        Pipes run in an injection context — <code>inject()</code> works inside them just
        like in components. Here <code>RelativeTimePipe</code> injects Angular's built-in
        <code>DatePipe</code> as a fallback formatter.
      </p>
      <div class="code"><pre>&#64;Pipe(&#123; name: 'relativeTime', standalone: true &#125;)
export class RelativeTimePipe implements PipeTransform &#123;
  private readonly datePipe = inject(DatePipe);   // ← inject inside a pipe

  transform(isoDate: string): string &#123;
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins &lt; 60) return &#96;&#36;&#123;mins&#125;m ago&#96;;
    return this.datePipe.transform(isoDate, 'mediumDate') ?? isoDate;
  &#125;
&#125;

// Add DatePipe to the component's providers array.</pre></div>


      <div class="demo">
        <p class="demo__title">Live</p>
        @for (post of posts; track post.id) {
          <div class="post-row">
            <span>{{ post.title }}</span>
            <span class="pill" style="color:var(--text-muted);white-space:nowrap">
              {{ post.date | relativeTime }}
            </span>
          </div>
        }
      </div>

      <h2>Demo 5 — highlight (impure, pure: false)</h2>
      <p>
        An impure pipe (<code>pure: false</code>) re-runs on <em>every</em>
        change-detection pass. Use it sparingly — only when you need to react to
        mutations inside an existing object or array reference.
      </p>
      <div class="code"><pre>&#64;Pipe(&#123; name: 'highlight', standalone: true, pure: false &#125;)
export class HighlightPipe implements PipeTransform &#123;
  transform(value: string, term: string): string &#123;
    if (!term) return value;
    return value.replace(new RegExp(&#96;($&#123;term&#125;)&#96;, 'gi'), '&lt;mark&gt;$1&lt;/mark&gt;');
  &#125;
&#125;

// Template: bind innerHTML because the pipe returns HTML
&lt;p [innerHTML]="sentence | highlight: term()"&gt;&lt;/p&gt;</pre></div>
      <div class="demo">
        <p class="demo__title">Live</p>
        <input [(ngModel)]="highlightQuery" placeholder="Term to highlight…" style="width:100%;margin-bottom:10px" />
        @for (item of highlightItems; track item) {
          <p style="margin:4px 0" [innerHTML]="item | highlight: highlightQuery()"></p>
        }
      </div>

      <h2>Pure vs impure — quick reference</h2>
      <table class="t">
        <thead>
          <tr><th>Property</th><th>Pure (default)</th><th>Impure (<code>pure: false</code>)</th></tr>
        </thead>
        <tbody>
          <tr><td>Re-runs when</td><td>Input <em>reference</em> changes</td><td>Every change-detection pass</td></tr>
          <tr><td>Memoized by Angular</td><td>Yes</td><td>No</td></tr>
          <tr><td>Performance</td><td>Fast</td><td>Can be slow — use sparingly</td></tr>
          <tr><td>Best for</td><td>Formatting, filtering by value, mapping</td><td>Reactive mutations inside existing refs</td></tr>
          <tr><td>Alternatives</td><td>—</td><td><code>computed()</code> reacts to mutations too and is faster</td></tr>
        </tbody>
      </table>

      <div class="warn">
        Before reaching for an impure pipe to filter a mutable array, try a
        <code>computed()</code> signal — it only re-runs when its dependencies change,
        not on every CD pass.
      </div>
      <div class="note">
        Pipes are standalone tree-shakable classes. Chain them freely:
        <code>{{ '{{' }} value | truncate:30 | sentenceCase {{ '}}' }}</code>. A pipe instance
        is <strong>reused</strong> — keep <code>transform()</code> free of hidden mutable
        state. All extra template arguments land in <code>transform(value, ...args)</code>
        in order.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;Pipe(&#123; name, standalone: true &#125;)</code> + <code>transform(value, ...args)</code> is all you need.</li>
        <li>Pure pipes are memoized — they only re-run when the input reference changes.</li>
        <li>Pipes can <code>inject()</code> services: <code>DatePipe</code>, <code>HttpClient</code>, I18n services…</li>
        <li>For filtering reactive state, prefer <code>computed()</code> over impure pipes.</li>
        <li>Standalone pipes live in a component's <code>imports</code> array — no NgModule needed.</li>
      </ul>

      <p><a routerLink="/attribute-directives">Next: Custom Attribute Directives →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    mark { background: rgba(250,200,60,.35); border-radius: 2px; padding: 0 2px; color: inherit; }
    .post-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid var(--border); gap: 12px;
      font-size: .9rem;
    }
  `],
})
export class CustomPipes {
  protected readonly longText =
    'Angular pipes transform display values declaratively inside templates without touching component logic.';
  protected readonly limit = signal(40);
  protected readonly rawText = signal('HELLO WORLD from angular pipes');
  protected readonly fruitQuery = signal('');
  protected readonly highlightQuery = signal('pipe');

  protected readonly fruits: Fruit[] = [
    { name: 'Apple', color: '#e53e3e' },
    { name: 'Banana', color: '#d69e2e' },
    { name: 'Blueberry', color: '#5a67d8' },
    { name: 'Grape', color: '#805ad5' },
    { name: 'Mango', color: '#dd6b20' },
    { name: 'Orange', color: '#ed8936' },
    { name: 'Peach', color: '#f687b3' },
    { name: 'Strawberry', color: '#fc8181' },
  ];

  protected readonly posts: Post[] = [
    { id: 1, title: 'Signal-based state management', date: new Date(Date.now() - 3 * 60_000).toISOString() },
    { id: 2, title: 'Building with @defer', date: new Date(Date.now() - 2 * 3_600_000).toISOString() },
    { id: 3, title: 'View Transitions deep dive', date: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    { id: 4, title: 'Zoneless Angular migration', date: new Date(Date.now() - 14 * 86_400_000).toISOString() },
  ];

  protected readonly highlightItems = [
    'Angular pipes transform values for display in templates.',
    'A pure pipe is memoized and re-runs only on reference change.',
    'Pipes can inject services using the inject() function.',
    'Chain multiple pipes: value | truncate:30 | sentenceCase.',
  ];
}
