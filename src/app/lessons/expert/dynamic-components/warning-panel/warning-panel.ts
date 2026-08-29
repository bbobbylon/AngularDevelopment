import { Component, input } from '@angular/core';

/**
 * A second interchangeable panel.
 */
@Component({
  selector: 'app-warning-panel',
  templateUrl: './warning-panel.html',
  styleUrl: './warning-panel.css',
})
export class WarningPanel {
  /**
   * The panel's message.
   */
  message = input('check your inputs');
}
