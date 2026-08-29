import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LESSON_BY_ID } from '../../core/curriculum';
import { LEVELS } from '../../core/lesson.model';

/**
 * Fallback page for curriculum entries that are enumerated but whose dedicated
 * lesson component has not been written yet. It reads the `lessonId` from route
 * data and renders the concept's metadata so the scope stays visible.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink],
  templateUrl: './coming-soon.html',
})
export class ComingSoon {
  /** Source of the `lessonId` route datum this page renders. */
  private readonly route = inject(ActivatedRoute);

  /**
   * The curriculum entry this placeholder stands in for, or `undefined` if the
   * route carries no `lessonId` or the id is unknown.
   *
   * A plain arrow function rather than a `computed`: it reads
   * `route.snapshot`, which is not reactive, so a computed would cache the
   * first lesson forever and show the wrong one after an in-place navigation.
   * The template calls it, so it re-reads on each change-detection pass.
   */
  protected readonly lesson = () => {
    const id = this.route.snapshot.data['lessonId'] as string | undefined;
    return id ? LESSON_BY_ID.get(id) : undefined;
  };

  /**
   * Turns a level id into its display label (`beginner` -> `Beginner`),
   * falling back to the raw id so an unrecognised level still renders.
   *
   * @param level A level id from the curriculum.
   */
  protected levelLabel(level: string): string {
    return LEVELS.find((l) => l.id === level)?.label ?? level;
  }
}
