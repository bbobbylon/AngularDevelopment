import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlotHost } from './slot-host/slot-host';

/**
 * One row in the swappable-template demo.
 */
interface Person {
  name: string;
  role: string;
}

/**
 * Lesson: `<ng-template>` and `NgTemplateOutlet` — markup as a value.
 *
 * An `<ng-template>` is not rendered where it is written; it is captured as a
 * `TemplateRef` that can be passed around and stamped out elsewhere, as many
 * times as needed or not at all. `NgTemplateOutlet` is the directive that does
 * the stamping, and `ngTemplateOutletContext` supplies the `let-` variables.
 *
 * The demos cover the three ways to get a `TemplateRef` — a `#ref` in the same
 * template, an `input()` (see {@link SlotHost}), and `viewChild` — plus swapping
 * between two templates at runtime, which is the pattern behind every
 * customisable list or table component.
 */
@Component({
  selector: 'app-lesson-ng-template-outlet',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, SlotHost],
  templateUrl: './ng-template-outlet.html',
  styleUrl: './ng-template-outlet.css',
})
export class NgTemplateOutletLesson {
  /**
   * Which template the swap demo is rendering.
   */
  protected readonly view = signal<'compact' | 'detailed'>('compact');
  /**
   * The rows both templates render.
   */
  protected readonly people = signal<Person[]>([
    { name: 'Ada Lovelace', role: 'Admin' },
    { name: 'Grace Hopper', role: 'Member' },
    { name: 'Alan Turing', role: 'Member' },
  ]);
  /**
   * A template fetched by query rather than by reference — the third way to get
   * hold of one.
   */
  protected readonly vcTemplate = viewChild<TemplateRef<unknown>>('vcTpl');
}
