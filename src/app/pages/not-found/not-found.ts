import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 404 page — the router's wildcard destination.
 *
 * Distinct from {@link ComingSoon}, which handles a *known* curriculum entry
 * whose lesson component is not written yet. This one is for URLs the
 * curriculum has never heard of.
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  styleUrl: './not-found.css',
  templateUrl: './not-found.html',
})
export class NotFound {}
