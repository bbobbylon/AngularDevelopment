import { Component, input, output } from '@angular/core';

/** A dialog-like component with OUTPUTS — the parent wires them imperatively. */
@Component({
  selector: 'app-confirm-panel',
  templateUrl: './confirm-panel.html',
  styleUrl: './confirm-panel.css',
})
export class ConfirmPanel {
  /**
   * The question to confirm.
   */
  question = input('Are you sure?');
  /**
   * Emits the user's answer. Subscribed to imperatively by the host, since a
   * dynamically created component has no template to bind `(confirmed)` in.
   */
  confirmed = output<boolean>();
}
