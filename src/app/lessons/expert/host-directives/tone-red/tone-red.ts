import { Directive } from '@angular/core';

/** Two deliberately conflicting behaviors for the precedence demo. */
@Directive({
  selector: '[appToneRed]',
  host: { '[style.background]': '"rgba(239,68,68,.18)"' },
})
export class ToneRed {}
