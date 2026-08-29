import { Component, input } from '@angular/core';

/**
 * A third interchangeable panel.
 */
@Component({
  selector: 'app-success-panel',
  templateUrl: './success-panel.html',
  styleUrl: './success-panel.css',
})
export class SuccessPanel {
  /**
   * The panel's message.
   */
  message = input('operation completed');
}
