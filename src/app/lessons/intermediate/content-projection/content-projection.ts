import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from './panel/panel';
import { TabLabel } from './tab-label/tab-label';
import { TabPanel } from './tab-panel/tab-panel';
import { TabGroup } from './tab-group/tab-group';
import { BadgeHost } from './badge-host/badge-host';

// ── The lesson component ───────────────────────────────────────────────────────

/**
 * Lesson: Content Projection — letting the caller supply the markup.
 *
 * Covers `<ng-content />`, named slots via `select=`, fallback content, and the
 * content queries (`contentChild` / `contentChildren`) that let a component find
 * what was projected into it.
 *
 * The distinction that matters: projected content belongs to the **caller**, not
 * to the component rendering it. It is compiled in the caller's context, styled
 * by the caller's styles, and — as {@link TabGroup} shows — the receiving
 * component can only find it through a content query, never a view query.
 */
@Component({
  selector: 'app-lesson-content-projection',
  standalone: true,
  imports: [RouterLink, Panel, TabGroup, TabLabel, TabPanel, BadgeHost],
  templateUrl: './content-projection.html',
  styleUrl: './content-projection.css',
})
export class ContentProjection {}
