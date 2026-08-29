import { Component, input } from '@angular/core';

// ── Demo components that will be rendered dynamically ────────────────────────

/**
 * One of the interchangeable panels, for the `NgComponentOutlet` demo.
 */
@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.html',
  styleUrl: './info-panel.css',
})
export class InfoPanel {
  /**
   * The panel's message.
   */
  message = input('all systems nominal');
}
