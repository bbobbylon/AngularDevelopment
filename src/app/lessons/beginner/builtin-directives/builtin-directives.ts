import { Component, signal } from '@angular/core';
import {
  NgClass,
  NgFor,
  NgIf,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Built-in Directives & Legacy Control Flow — `*ngIf`, `*ngFor`,
 * `ngClass`, `ngStyle` and `ngSwitch`.
 *
 * A deliberately *legacy* lesson. The modern equivalents (`@if`, `@for`,
 * `@switch`, and plain `[class.x]` / `[style.x]` bindings) are covered in their
 * own lessons and are what you should write today. This page exists because you
 * will still meet the structural-directive syntax in every codebase older than
 * Angular 17, in most tutorials, and in exam questions — and because the `*`
 * prefix is not obvious once you stop seeing it every day.
 *
 * The demos run both forms side by side so the mapping is direct.
 */
@Component({
  selector: 'app-lesson-builtin-directives',
  imports: [RouterLink, NgIf, NgFor, NgClass, NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './builtin-directives.html',
  styleUrl: './builtin-directives.css',
})
export class BuiltinDirectives {
  /**
   * Toggles the `*ngIf` demo.
   */
  protected readonly show = signal(true);
  /**
   * The list for the `*ngFor` demo.
   */
  protected readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  /**
   * The `ngSwitch` demo's selected fruit.
   */
  protected readonly selected = signal('Banana');
  /**
   * The `ngSwitch` demo's state — three arms plus a default.
   */
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');

  /**
   * `trackBy` function for the `*ngFor` demo.
   *
   * The old-style counterpart to `@for`'s `track` expression, and the reason
   * `@for` made tracking mandatory: `*ngFor` without a `trackBy` re-creates every
   * DOM node when the array is replaced, and nothing warns you.
   *
   * @param _index Unused — the name is the identity here.
   * @param name   The item.
   * @returns The tracking key.
   */
  protected trackByName(_index: number, name: string): string {
    return name;
  }
}
