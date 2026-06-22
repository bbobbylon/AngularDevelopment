import { Pipe, PipeTransform } from '@angular/core';
import { LevelGroup } from '../core/lesson.model';

@Pipe({ name: 'filterLessons', standalone: true, pure: true })
export class FilterLessonsPipe implements PipeTransform {
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
