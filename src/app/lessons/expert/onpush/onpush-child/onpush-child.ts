import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

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
   * The check count, incremented from `ngDoCheck` — fires once per real check of
   * THIS view, and being a lifecycle hook rather than a bound expression, is
   * exempt from dev mode's double-read verify pass (a template getter that
   * mutates on read is not, and throws NG0100).
   */
  protected readonly tick = signal(0);

  ngDoCheck(): void {
    this.tick.update((n) => n + 1);
  }
}
