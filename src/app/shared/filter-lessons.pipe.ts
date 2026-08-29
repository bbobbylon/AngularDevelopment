import { Pipe, PipeTransform } from '@angular/core';
import { LevelGroup } from '../core/lesson.model';

/**
 * Filters the nested curriculum tree (level -> category -> lesson) down to the
 * entries matching a search query, for the search box on the home page.
 *
 * Rebuilds the tree rather than flattening it, so the results keep their level
 * and category headings instead of becoming a bare list. Levels and categories
 * left with no matching lessons are dropped, so no empty headings remain.
 *
 * Explicitly `pure: true` (the default, stated for emphasis): it is called for
 * every keystroke across the whole curriculum, and an impure pipe would re-run
 * that on every change-detection pass instead of only when the query changes.
 * That is only safe because the curriculum array is never mutated in place.
 */
@Pipe({ name: 'filterLessons', pure: true })
export class FilterLessonsPipe implements PipeTransform {
  /**
   * @param levels The full curriculum tree.
   * @param query  Free-text search. Matched case-insensitively against lesson
   *               title, lesson summary, and category name — so searching a
   *               category keeps all of its lessons.
   * @returns A pruned copy of the tree; the original when the query is blank.
   */
  transform(levels: LevelGroup[], query: string): LevelGroup[] {
    const q = query.trim().toLowerCase();
    if (!q) return levels;
    return levels
      .map((lvl) => ({
        ...lvl,
        categories: lvl.categories
          .map((cat) => ({
            ...cat,
            lessons: cat.lessons.filter(
              (l) =>
                l.title.toLowerCase().includes(q) ||
                l.summary.toLowerCase().includes(q) ||
                cat.name.toLowerCase().includes(q),
            ),
          }))
          .filter((cat) => cat.lessons.length > 0),
      }))
      .filter((lvl) => lvl.categories.length > 0);
  }
}
