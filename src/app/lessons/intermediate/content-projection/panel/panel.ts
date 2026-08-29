import { Component } from '@angular/core';

// ── Demo components used in live examples ─────────────────────────────────────

/**
 * A card with three projection slots: a title, a default body, and an actions
 * footer.
 *
 * Demonstrates `select=` for named slots, the unselected `<ng-content />` as the
 * catch-all, and content inside an `<ng-content>` acting as a **fallback** when
 * nothing is projected into that slot.
 */
@Component({
  selector: 'app-panel',
  standalone: true,
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel {}
