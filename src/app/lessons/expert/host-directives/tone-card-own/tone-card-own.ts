import { Component } from '@angular/core';
import { ToneBlue } from '../tone-blue/tone-blue';
import { ToneRed } from '../tone-red/tone-red';

/** Precedence demo B: same two directives, but the component binds the property itself. */
@Component({
  selector: 'app-tone-card-own',
  hostDirectives: [ToneRed, ToneBlue],
  host: { '[style.background]': '"rgba(16,185,129,.18)"' },
  templateUrl: './tone-card-own.html',
  styleUrl: './tone-card-own.css',
})
export class ToneCardOwn {}
