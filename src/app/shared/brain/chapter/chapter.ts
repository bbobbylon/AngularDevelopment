import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** One stop on the "you are here" rail — a sibling concept in the same track. */
export interface ChapterStop {
  /** Short label under the dot. Keep it to one or two words; the rail is tight. */
  label: string;
  /** Route id to link to. Omitted for the current stop, which is not a link. */
  id?: string;
}

/**
 * The lesson header for a brain-friendly lesson: ghost chapter numeral, track
 * badge, "you are here" rail, display title and a handwritten subtitle.
 *
 * ## Why a lesson opens like this
 *
 * The original header was an eyebrow, an `<h1>` and a lead paragraph. Correct,
 * and completely forgettable — nothing about it told a learner *where they were
 * in a sequence*, which is the single thing that makes a curriculum feel like a
 * book instead of a pile of pages.
 *
 * Head First solves that with the same three moves this component makes:
 *
 * 1. **A number.** Set enormous and nearly invisible behind the title. It says
 *    "this is chapter N of a thing" without occupying any reading attention.
 * 2. **A rail.** The neighbouring concepts, with the current one filled in and
 *    labelled by hand. A learner who can see what came before and what comes
 *    next reads the lesson as a step rather than an entry.
 * 3. **A subtitle in the author's handwriting.** `title` states the concept;
 *    `hand` says why you should care, in a different voice. Two channels beat
 *    one longer sentence.
 *
 * ## Usage
 *
 * ```html
 * <app-chapter
 *   number="4"
 *   kicker="Angular Expert · Runtime"
 *   title="Change Detection"
 *   hand="or, how Angular decides that a pixel is now wrong"
 *   [stops]="[
 *     { label: 'Signals', id: 'signals' },
 *     { label: 'Change Detection' },
 *     { label: 'OnPush', id: 'onpush' },
 *   ]"
 *   [current]="1"
 * >
 *   <p class="lead">Long-form intro goes here, projected.</p>
 * </app-chapter>
 * ```
 *
 * ## Accessibility
 *
 * The rail is an ordered list, so it is announced as the sequence it depicts.
 * The current stop carries `aria-current="step"` and the visible "you are here"
 * label; the ghost numeral and the dots are `aria-hidden` because they repeat
 * information the text already gives. The title renders as the page's only
 * `<h1>`.
 */
@Component({
  selector: 'app-chapter',
  imports: [RouterLink],
  templateUrl: './chapter.html',
  styleUrl: './chapter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chapter {
  /** Chapter numeral drawn as a watermark. Any short string — "4", "12", "A". */
  readonly number = input<string>('');

  /** Track label on the badge, e.g. `Angular Expert · Runtime`. */
  readonly kicker = input<string>('');

  /** The concept name. Rendered as the page `<h1>`. */
  readonly title = input.required<string>();

  /** The handwritten subtitle: why this concept is worth the next 20 minutes. */
  readonly hand = input<string>('');

  /** Neighbouring concepts, in curriculum order. Empty hides the rail. */
  readonly stops = input<ChapterStop[]>([]);

  /** Index into `stops` for the lesson being read. */
  readonly current = input<number>(-1);

  /** True when there is enough of a sequence for a rail to mean anything. */
  protected readonly showRail = computed(() => this.stops().length > 1);
}
