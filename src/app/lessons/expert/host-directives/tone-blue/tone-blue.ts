import { Directive } from '@angular/core';

/**
 * The second conflicting behaviour. Ordering between this and {@link ToneRed} is
 * the precedence demo.
 */
@Directive({
  selector: '[appToneBlue]',
  host: { '[style.background]': '"rgba(79,70,229,.18)"' },
})
export class ToneBlue {}
