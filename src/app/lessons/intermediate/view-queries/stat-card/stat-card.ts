import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * A tiny "dashboard tile" child component — the far side of the view-query
 * boundary in the parent lesson's live demo.
 *
 * It exists to make one claim concrete rather than asserted: a parent's
 * `viewChild(StatCard)` can call {@link flash} because it is a public method
 * on the instance — ordinary object interaction, nothing query-specific — and
 * a parent's `viewChild(StatCard, { read: ElementRef })` resolves to *this
 * component's host element*, the `<app-stat-card>` tag, never a node from
 * inside this template. There is no third option; the parent genuinely cannot
 * reach anything else in here.
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  /** The number on the tile. */
  readonly value = input.required<number>();

  /** The small caption above the number. */
  readonly label = input<string>('');

  /** True for a moment right after {@link flash} runs — drives the pop animation. */
  protected readonly flashing = signal(false);

  /**
   * The one door a parent is allowed to knock on. Called from outside via
   * `viewChild(StatCard)`, exactly like calling a method on any other object —
   * a view query hands back a real instance, not a restricted proxy.
   */
  flash(): void {
    this.flashing.set(true);
    setTimeout(() => this.flashing.set(false), 650);
  }
}
