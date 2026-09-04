import { Component } from '@angular/core';
import { DiHostProbe } from './di-host-probe';

/**
 * Child WITHOUT a provider, whose {@link DiHostProbe} sits one level inside
 * its OWN template rather than on its host tag — the nesting `host: true`
 * needs to mean something different from `self`. See `DiHostProbe` for why.
 *
 * Attribute selector on `<tr>`, matching {@link DiChildOwn} and
 * {@link DiChildBare}: a custom element inside `<table>` would be
 * foster-parented out of the table by the HTML parser.
 */
@Component({
  selector: 'tr[appDiHostChild]',
  imports: [DiHostProbe],
  templateUrl: './di-host-child.html',
})
export class DiHostChild {}
