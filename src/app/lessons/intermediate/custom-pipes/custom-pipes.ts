import { Component, Pipe, PipeTransform, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// ── 1. Pure pipe — truncate ─────────────────────────────────────────────────
/**
 * Shortens a string and appends an ellipsis.
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  /**
   * @param value The text.
   * @param limit Maximum characters before truncating.
   * @param trail Suffix appended when truncated.
   * @returns The text, shortened if it was over the limit.
   */
  transform(value: string, limit = 20, trail = '…'): string {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit).trimEnd() + trail : value;
  }
}

// ── 2. Pure pipe — sentenceCase ──────────────────────────────────────────────
/**
 * Capitalises the first letter and lowercases the rest.
 */
@Pipe({ name: 'sentenceCase', standalone: true })
export class SentenceCasePipe implements PipeTransform {
  /**
   * @param value The text.
   * @returns The text in sentence case.
   */
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}

// ── 3. Pure pipe — filterBy (array filter, same pattern as FilterLessonsPipe) ─
/**
 * Filters a list by a substring match on one field.
 */
@Pipe({ name: 'filterBy', standalone: true })
export class FilterByPipe implements PipeTransform {
  /**
   * Generic over the item type and constrained to `keyof T`, so a typo in the
   * field name is a compile error rather than a filter that silently matches
   * nothing.
   *
   * Note this pipe is **pure**, so it only re-runs when the array reference
   * changes — mutating the array in place will not update the view. Filtering in
   * a `computed` avoids that class of bug entirely, which is what the lesson
   * recommends for anything more than a demo.
   *
   * @param items The list.
   * @param field Which field to match against.
   * @param query The substring to look for.
   * @returns The matching items, or all of them when the query is blank.
   */
  transform<T extends object>(items: T[], field: keyof T, query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => String(item[field]).toLowerCase().includes(q));
  }
}

// ── 4. Pipe that injects a service (DatePipe) ────────────────────────────────
/**
 * Formats a timestamp as "3 minutes ago", falling back to a date once it is old
 * enough for that to be more useful.
 */
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  /**
   * The built-in date pipe, injected. A pipe is a normal injectable, so it can use
   * DI and compose with other pipes rather than reimplementing them.
   */
  private readonly datePipe = inject(DatePipe);

  /**
   * @param isoDate An ISO timestamp.
   * @returns A relative description, or an absolute date past a threshold.
   */
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
/**
 * Wraps matches of a search term in `<mark>`.
 *
 * Declared **impure** (`pure: false`), so it re-runs on every change-detection
 * pass. That is the trade the lesson highlights: it catches changes a pure pipe
 * would miss, and it costs a call on every pass — which is why impure pipes are
 * a last resort rather than a convenience.
 */
@Pipe({ name: 'highlight', standalone: true, pure: false })
export class HighlightPipe implements PipeTransform {
  /**
   * Escapes regex metacharacters in the term before building the pattern, so a
   * search for `c++` is a search rather than a syntax error.
   *
   * @param value The text.
   * @param term  The term to highlight.
   * @returns The text with matches wrapped.
   */
  transform(value: string, term: string): string {
    if (!term) return value;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
}

/**
 * A fruit in the filter demo.
 */
interface Fruit { name: string; color: string }
/**
 * A post in the relative-time demo.
 */
interface Post  { id: number; title: string; date: string }

/**
 * Lesson: Custom Pipes — writing your own template transforms.
 *
 * Covers the `@Pipe` decorator, `PipeTransform`, parameters and defaults,
 * injecting into a pipe, and — the part that matters — **pure against impure**.
 *
 * A pure pipe is memoized: Angular re-runs it only when its inputs change by
 * reference. That makes it cheap, and it makes a pipe over a mutated array
 * appear broken. An impure pipe re-runs on every change-detection pass, which
 * fixes that and costs accordingly.
 *
 * The lesson's recommendation is to reach for neither by default: a `computed`
 * is usually the right home for derived data, and a pipe is for genuinely
 * presentational formatting.
 *
 * Five pipes are defined and demonstrated live above the explanation.
 */
@Component({
  selector: 'app-lesson-custom-pipes',
  imports: [RouterLink, FormsModule, TruncatePipe, SentenceCasePipe, FilterByPipe, RelativeTimePipe, HighlightPipe],
  // DatePipe is provided (not template-imported): RelativeTimePipe inject()s it.
  providers: [DatePipe],
  templateUrl: './custom-pipes.html',
  styleUrl: './custom-pipes.css',
})
export class CustomPipes {
  /**
   * Text for the truncate demo.
   */
  protected readonly longText =
    'Angular pipes transform display values declaratively inside templates without touching component logic.';
  /**
   * The truncation limit.
   */
  protected readonly limit = signal(40);
  /**
   * Text for the sentence-case demo.
   */
  protected readonly rawText = signal('HELLO WORLD from angular pipes');
  /**
   * The filter demo's query.
   */
  protected readonly fruitQuery = signal('');
  /**
   * The highlight demo's search term.
   */
  protected readonly highlightQuery = signal('pipe');

  /**
   * The list the filter demo filters.
   */
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

  /**
   * Posts with staggered timestamps, so the relative-time pipe has several
   * thresholds to show at once.
   */
  protected readonly posts: Post[] = [
    { id: 1, title: 'Signal-based state management', date: new Date(Date.now() - 3 * 60_000).toISOString() },
    { id: 2, title: 'Building with @defer', date: new Date(Date.now() - 2 * 3_600_000).toISOString() },
    { id: 3, title: 'View Transitions deep dive', date: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    { id: 4, title: 'Zoneless Angular migration', date: new Date(Date.now() - 14 * 86_400_000).toISOString() },
  ];

  /**
   * Sentences for the highlight demo.
   */
  protected readonly highlightItems = [
    'Angular pipes transform values for display in templates.',
    'A pure pipe is memoized and re-runs only on reference change.',
    'Pipes can inject services using the inject() function.',
    'Chain multiple pipes: value | truncate:30 | sentenceCase.',
  ];
}
