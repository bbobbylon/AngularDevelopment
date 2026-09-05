import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHEAT_SHEETS, type CheatCategory, type CheatSheet } from '../../core/cheat-sheets';

/** One entry in the category filter row, including the "show everything" option. */
interface CategoryFilter {
  value: CheatCategory | 'all';
  label: string;
}

const CATEGORIES: CategoryFilter[] = [
  { value: 'all', label: 'All' },
  { value: 'language', label: 'Languages' },
  { value: 'framework', label: 'Frameworks' },
  { value: 'database', label: 'Databases' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'deployment', label: 'Deployment' },
];

/**
 * Cheat Sheets hub — a searchable, filterable index of every sheet in
 * `core/cheat-sheets`, linking out to `/cheat-sheets/<id>`.
 *
 * Pure read-only view over the static `CHEAT_SHEETS` list; the only state is
 * the search query and the active category, both local to this component
 * (nothing here needs to survive a navigation, unlike Practice's filters).
 */
@Component({
  selector: 'app-cheat-sheets',
  imports: [RouterLink],
  templateUrl: './cheat-sheets.html',
  styleUrl: './cheat-sheets.css',
})
export class CheatSheets {
  /** Free-text search, matched against title, tagline and intro. */
  protected readonly query = signal('');

  /** Which category chip is active. 'all' shows every sheet. */
  protected readonly activeCategory = signal<CheatCategory | 'all'>('all');

  protected readonly categories = CATEGORIES;

  /** Total sheet count, shown in the header — fixed, not affected by filtering. */
  protected readonly totalCount = CHEAT_SHEETS.length;

  /** Sheets matching both the active category and the search query. */
  protected readonly filtered = computed<CheatSheet[]>(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.activeCategory();
    return CHEAT_SHEETS.filter((sheet) => {
      if (cat !== 'all' && sheet.category !== cat) return false;
      if (!q) return true;
      return (
        sheet.title.toLowerCase().includes(q) ||
        sheet.tagline.toLowerCase().includes(q) ||
        sheet.intro.toLowerCase().includes(q)
      );
    });
  });

  /**
   * Selects a category chip.
   *
   * @param category The chip's value; 'all' clears the filter.
   */
  protected setCategory(category: CheatCategory | 'all'): void {
    this.activeCategory.set(category);
  }
}
