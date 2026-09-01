import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** OnPush child with an OBJECT input — the star of the mutation trap demo. */
@Component({
  selector: 'app-onpush-mutate-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onpush-mutate-child.html',
  styleUrl: './onpush-mutate-child.css',
})
export class OnpushMutateChild {
  /**
   * A plain object passed as an input. Plain on purpose: `OnPush` compares inputs
   * by reference, so mutating this object is invisible and replacing it is not.
   */
  user = input.required<{ name: string; clicks: number }>();
  /**
   * The check count, incremented from `ngDoCheck` rather than a template getter —
   * see `expert/change-detection`'s `OnPushChild.checks` for why a getter that
   * mutates on read throws NG0100 in dev mode.
   */
  protected readonly tick = signal(0);

  ngDoCheck(): void {
    this.tick.update((n) => n + 1);
  }
}
