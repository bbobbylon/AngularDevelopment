import { Directive, inject } from '@angular/core';
import { Beacon } from '../di-advanced.shared';

/**
 * Sits one level INSIDE {@link DiHostChild}'s own template — not on its host
 * tag — so this directive's injection point is genuinely one view removed
 * from where `DiHostChild` itself sits in the DOM.
 *
 * That gap is what makes `host: true` show something `self` cannot: this
 * directive can see everything inside `DiHostChild`'s own view (there is
 * nothing there — `DiHostChild` provides no `Beacon`), but it is walled off
 * from the lesson's `Beacon`, one hop further up, even though the default
 * walk sails straight past that wall and finds it without breaking a sweat.
 */
@Directive({
  selector: '[appDiHostProbe]',
  exportAs: 'appDiHostProbe',
})
export class DiHostProbe {
  /**
   * The default walk has no such wall — it keeps climbing past `DiHostChild`
   * and finds the lesson's instance.
   */
  readonly viaChain = inject(Beacon, { optional: true });
  /**
   * `host: true` — allowed to see `DiHostChild`'s own view, forbidden from
   * reaching anything beyond it. `DiHostChild` provides nothing, so this is
   * always `null`, no matter what an ancestor component provides.
   */
  readonly viaHost = inject(Beacon, { host: true, optional: true });
}
