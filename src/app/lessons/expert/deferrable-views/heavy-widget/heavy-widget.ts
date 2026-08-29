import { Component } from '@angular/core';

/** Simulates a "heavy" chunk — its JS is only fetched when the @defer block triggers. */
@Component({
  selector: 'app-heavy-widget',
  templateUrl: './heavy-widget.html',
})
export class HeavyWidget {}
