import { Component } from '@angular/core';
import { ToneBlue } from '../tone-blue/tone-blue';
import { ToneRed } from '../tone-red/tone-red';

/** Precedence demo A: two conflicting host directives, no own binding — later wins. */
@Component({
  selector: 'app-tone-card-bare',
  hostDirectives: [ToneRed, ToneBlue],
  templateUrl: './tone-card-bare.html',
  styleUrl: './tone-card-bare.css',
})
export class ToneCardBare {}
