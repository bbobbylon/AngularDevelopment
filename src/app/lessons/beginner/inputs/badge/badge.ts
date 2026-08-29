import { Component, booleanAttribute, input } from '@angular/core';

/** A presentational badge driven entirely by inputs. */
@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class Badge {
  /** Required input — the parent must provide it. */
  readonly label = input.required<string>();
  /** Optional input with a default. */
  readonly color = input('#7c4dff');
  /** Optional number, undefined when not set. */
  readonly count = input<number | undefined>(undefined);
  /** Aliased + transformed: parent writes [large], stored as `big`, coerced to boolean. */
  readonly big = input(false, { alias: 'large', transform: booleanAttribute });
}
