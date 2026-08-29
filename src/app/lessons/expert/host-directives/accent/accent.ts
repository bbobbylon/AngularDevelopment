import { Directive, input } from '@angular/core';

/** A second behavior with an INPUT — the re-export demo. */
@Directive({
  selector: '[appAccent]',
  host: { '[style.borderLeft]': '"4px solid " + accent()' },
})
export class Accent {
  /**
   * The accent colour. Re-exported under an alias by composing hosts, which is
   * what lets a composed input keep a name that makes sense on the host.
   */
  readonly accent = input('gray');
}
