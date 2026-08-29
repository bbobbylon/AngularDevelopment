import { Component } from '@angular/core';
import { Accent } from '../accent/accent';

/**
 * Re-export demo: Accent's `accent` input is private by default; listing it
 * under the alias `tone` makes it part of THIS component's public API.
 */
@Component({
  selector: 'app-status-card',
  hostDirectives: [{ directive: Accent, inputs: ['accent: tone'] }],
  templateUrl: './status-card.html',
  styleUrl: './status-card.css',
})
export class StatusCard {}
