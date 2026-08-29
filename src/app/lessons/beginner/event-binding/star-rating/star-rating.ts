import { Component, output, signal } from '@angular/core';

/**
 * Live-demo child for the "component outputs" section. It is deliberately NOT
 * the `Rating` component from the outputs.ts lesson — this one exists purely to
 * give event-binding a real, emitting child so `$event` for a custom output can
 * be shown behaving, not just described in prose.
 */
@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css',
})
export class StarRating {
  /**
   * The star positions to render.
   */
  protected readonly stars = [1, 2, 3, 4, 5];
  /**
   * The committed rating.
   */
  protected readonly value = signal(0);
  /**
   * The rating being hovered, kept separate from {@link value} so hovering
   * previews without committing.
   */
  protected readonly hover = signal(0);

  /** A typed custom event — the parent's `$event` is inferred as `number`. */
  readonly rated = output<number>();

  /**
   * Commits a rating and emits it.
   *
   * @param star The clicked star.
   */
  protected rate(star: number) {
    this.value.set(star);
    this.rated.emit(star);
  }
}
