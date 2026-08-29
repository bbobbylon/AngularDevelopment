import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
   * How many times this view has been checked.
   */
  private n = 0;
  /**
   * The check count.
   */
  get tick() {
    return ++this.n;
  }
}
