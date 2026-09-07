import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LESSON_BY_ID } from '../../core/curriculum';
import { LEVELS, type Lesson } from '../../core/lesson.model';
import { Bubbles, Napkin, type BubbleTurn } from '../brain';
import { RevealOnScrollDirective } from '../reveal-on-scroll.directive';

/**
 * Fallback page for curriculum entries that are enumerated but whose dedicated
 * lesson component has not been written yet. It reads the `lessonId` from route
 * data and renders the concept's metadata so the scope stays visible.
 *
 * This is a status page, not a lesson — it does not opt into `.lesson.bf` or
 * any of the retention devices. It picks up the warm brain-friendly palette
 * and type for free from the app-wide token remap (`src/brain-friendly.css`
 * §3); the two presentation devices below (`app-bubbles`, `app-napkin`) are
 * used only because they genuinely fit this page's own content — a short
 * "is it ready yet?" exchange, and the one thing a reader can do about it.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink, Bubbles, Napkin, RevealOnScrollDirective],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css',
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

  /**
   * The short "is this ready yet?" exchange rendered by `app-bubbles` in
   * place of a plain status paragraph — a two-line dialogue is easier to
   * take in at a glance than a sentence explaining the same thing.
   *
   * A plain method rather than a `computed`, matching {@link lesson}: it is
   * cheap, pure, and only ever called with the resolved lesson from the
   * template's `@if (lesson(); as l)`, so there is no reactive value worth
   * memoizing here.
   *
   * @param l The curriculum entry this placeholder stands in for.
   */
  protected statusTurns(l: Lesson): BubbleTurn[] {
    return [
      { who: 'You', says: `Is **${l.title}** ready yet?` },
      {
        who: 'Curriculum',
        says: "Mapped and reserved — but nobody's written the demo for this one yet. Soon.",
      },
    ];
  }
}
