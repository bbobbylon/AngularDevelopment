import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** An OnPush child — only re-checked when an input reference changes (or it's marked dirty). */
@Component({
  selector: 'app-onpush-child',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onpush-child.html',
  styleUrl: './onpush-child.css',
})
export class OnpushChild {
  /**
   * The value passed in.
   */
  value = input(0);
  /**
   * How many times this view has been checked.
   */
  private n = 0;
  /** Getter runs once per check of THIS view — a live change-detection counter. */
  get tick() {
    return ++this.n;
  }
}
