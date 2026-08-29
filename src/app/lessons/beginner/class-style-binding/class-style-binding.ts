import { NgClass, NgStyle } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: Class & Style Binding — five ways to change how an element looks, and
 * which to reach for.
 *
 * Covers `[class.x]`, `[class]`, `[style.prop]`, `[style.prop.unit]`, `[style]`,
 * and the older `ngClass` / `ngStyle` directives.
 *
 * The guidance the lesson lands on: the per-class and per-property forms are the
 * default, because they are the ones Angular can update surgically and the ones
 * that compose without fighting each other. `ngClass` and `ngStyle` still work,
 * but they replace whole objects and are no longer the recommended form.
 *
 * The demos run each form against the same element so the differences — and the
 * precedence when two of them touch the same class — are visible.
 */
@Component({
  selector: 'app-lesson-class-style-binding',
  imports: [RouterLink, NgClass, NgStyle],
  templateUrl: './class-style-binding.html',
  styleUrl: './class-style-binding.css',
})
export class ClassStyleBinding {
  /**
   * Drives the `[class.active]` demo.
   */
  protected readonly active = signal(true);
  /**
   * Drives the `[style.font-size.px]` demo, showing the unit suffix.
   */
  protected readonly size = signal(20);
  /**
   * Drives the `[style.color]` demo.
   */
  protected readonly color = signal('#7c4dff');
  /**
   * Drives the `[class]` map demo — three states, one binding.
   */
  protected readonly state = signal<'ok' | 'warn' | 'error'>('ok');
  /**
   * Whether the *object* form asks for `active`.
   */
  protected readonly objectWantsActive = signal(true);
  /**
   * Whether the *per-class* form asks for `active`. Paired with
   * {@link objectWantsActive} so the two can disagree, which is how the demo shows
   * which one wins.
   */
  protected readonly perClassActive = signal(false);
}
