import { NgClass, NgStyle } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, NgClass, NgStyle, Compare, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './class-style-binding.html',
  styleUrl: './class-style-binding.css',
})
export class ClassStyleBinding {
  /**
   * How the final `class` attribute is assembled. Presented as layers rather than
   * prose because the two things people get wrong — that bindings merge rather
   * than replace, and that collisions resolve by binding *kind* — are both facts
   * about the stacking, not about the values.
   */
  protected readonly layers = [
    { label: 'Static `class="box"`', detail: 'Applied once at creation. No binding can remove it' },
    { label: '`[class]` map or string', detail: 'Adds and removes only the keys it names' },
    {
      label: '`[class.box--active]`',
      detail: 'Per-class bindings sit above maps and win any collision',
      tone: 'accent' as const,
    },
    {
      label: 'Angular diffs',
      detail: 'Compares against last pass — unchanged entries are left alone',
    },
    {
      label: '`classList.add` / `remove`',
      detail: 'Only what actually changed is touched',
      tone: 'good' as const,
    },
  ];

  /** The merge misconception, posed before the note that corrects it. */
  protected readonly mergeSample = `<div class="card shadow"
     [class]="{ active: isActive() }">
  …
</div>

// isActive() is true.
// What is the element's final class attribute?`;

  /** Choices for the unit-suffix check. */
  protected readonly unitOptions = [
    {
      text: 'The element is 8 pixels wide — Angular infers `px` for numbers',
      why: 'Angular does no inference here. It passes your value through to `style.setProperty` essentially untouched; the `px` has to come from somewhere, and nothing supplies it.',
    },
    {
      text: 'No width is applied at all',
      correct: true,
      why: '`width: 8` is not valid CSS — a length needs a unit — so the browser discards the declaration silently. Nothing throws and nothing warns; the element simply keeps its default width, which is why this one can survive review. Write `[style.width.px]="8"` and the suffix appends the unit for you.',
    },
    {
      text: 'A console warning, and the width falls back to `auto`',
      why: 'The width does effectively stay at its default, but there is no warning. Browsers drop invalid declarations without comment, which is exactly what makes this hard to spot.',
    },
    {
      text: 'The width is set to 8% of the parent',
      why: 'Nothing in the binding mentions a percentage. An invalid unit-less length is dropped rather than reinterpreted as some other unit.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'If they all merge, why does `[class.x]` beat a key inside `[class]`?',
      a: 'Because the two are different kinds of instruction, and Angular gives them a fixed priority — the more specific binding wins, exactly like it does for `[style.color]` over `[style]`. Note what this is *not*: it has nothing to do with CSS specificity or the cascade. Angular settles the argument at the styling layer and hands the browser a single answer. Reordering the attributes in your template changes nothing.',
    },
    {
      q: 'So should I use `[class.x]` or `[class]`?',
      a: 'Use `[class.x]` when you know the class name at author time, which is most of the time — it is the cheapest to update because Angular only has to check one boolean. Reach for the `[class]` map when the *set* of classes is data-driven, like a status that could be any of five values. What you should not do is drive the same class from both; that is the collision the demo above shows, and the winner is not obvious to whoever reads it next.',
    },
    {
      q: 'Is `ngClass` actually deprecated?',
      a: 'Not formally — it still works and nothing warns. But it needs a `CommonModule`/`NgClass` import, it goes through a general-purpose differ rather than a compiled instruction, and it does the same job as syntax that is built into the template compiler. In new code the native bindings are simply the better default. Existing `ngClass` is not a bug and does not need an urgent migration.',
    },
    {
      q: 'Why does camelCase work in one place and kebab-case in another?',
      a: 'In the binding *syntax* (`[style.fontSize.px]`), the property name is part of a template expression, so it follows the DOM style-object convention: camelCase. Inside a bound *object* (`[style]="{ ... }"`), the key is a plain string being passed to `setProperty`, and CSS itself accepts `font-size`. Both `fontSize` and `\'font-size\'` work there. When in doubt, kebab-case inside objects is the form that never surprises anyone.',
    },
    {
      q: 'Can a binding remove a class that came from the static attribute?',
      a: 'No, and that trips people up when they try to override a class from a design system. The static `class` is applied once at element creation and no binding gets to erase it. If you need the class to be conditional, it has to be conditional at the source: move it out of the static attribute and into `[class.x]="condition"`. Fighting it with CSS overrides works but leaves the wrong class in the DOM for the next person to puzzle over.',
    },
  ];

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
