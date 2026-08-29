import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RichText } from '../rich-text/rich-text';

/** Colour treatment for a step, used to mark where something notable happens. */
export type FlowTone = 'default' | 'accent' | 'good' | 'warn';

/** One box in the diagram. Both text fields may contain `backtick` code spans. */
export interface FlowStep {
  /** Short name for the step — two or three words. This is the box's title. */
  readonly label: string;
  /** One line of detail under the label. Optional; omit for a bare sequence. */
  readonly detail?: string;
  /** Highlights this step. Use sparingly — one or two per diagram at most. */
  readonly tone?: FlowTone;
}

/**
 * A labelled step diagram: boxes joined by arrows, horizontally or vertically.
 *
 * ## Why a component instead of an SVG per lesson
 *
 * The retention audit found that almost no lesson had a visual, and the reason is
 * friction: hand-authoring an SVG for every sequence is slow, the results drift apart
 * stylistically, and they rarely survive dark mode or a narrow viewport. Most of what
 * these lessons actually need to draw is the *same shape* — an ordered sequence of named
 * steps, sometimes with one highlighted. Component lifecycle, an HTTP request's journey
 * through interceptors, change detection's pass over the tree, route guard resolution,
 * the build pipeline. One component covers all of them.
 *
 * The arrows are CSS, not SVG, which is what makes the diagram reflow: the horizontal
 * layout wraps to vertical on a narrow screen without a second set of coordinates, and it
 * inherits the theme's colours rather than baking them in.
 *
 * For a genuinely bespoke picture — a marble diagram, a memory layout — write an inline
 * SVG in the lesson. This is for the common case, not every case.
 *
 * ## Usage
 *
 * ```html
 * <app-flow
 *   caption="What happens when a signal changes"
 *   [steps]="[
 *     { label: 'set()', detail: 'You write a new value' },
 *     { label: 'Notify', detail: 'Dependents are marked dirty', tone: 'accent' },
 *     { label: 'Re-render', detail: 'Only affected views update', tone: 'good' },
 *   ]"
 * />
 * ```
 *
 * ## Accessibility
 *
 * The steps are an `<ol>`, so the sequence and its length are announced without relying
 * on the arrows, which are decorative and hidden from assistive tech. The caption is a
 * real `<figcaption>` tied to the figure, so the diagram is not an unlabelled shape.
 */
@Component({
  selector: 'app-flow',
  templateUrl: './flow.html',
  styleUrl: './flow.css',
  imports: [RichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Flow {
  /** The steps, in order. */
  readonly steps = input.required<readonly FlowStep[]>();

  /** What the diagram shows. Required in practice — an unlabelled diagram teaches little. */
  readonly caption = input<string>('');

  /**
   * `horizontal` wraps to vertical on narrow screens automatically. Choose `vertical`
   * when the steps have long detail text that would be cramped in a column.
   */
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
}
