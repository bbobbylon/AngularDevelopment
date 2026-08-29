import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import { GreetingCard } from './greeting-card/greeting-card';

/**
 * Lesson: Components — the building block everything else is made of.
 *
 * Covers the `@Component` decorator's core metadata (`selector`, `template`,
 * `styles`, `imports`), how a component composes others by importing them, and
 * the split between state a component owns and state it receives.
 *
 * The demo hosts a real child component — {@link GreetingCard} — and drives it
 * from an input, so the parent/child boundary is on screen rather than
 * described. The child keeps its own clap count alongside, which makes the point
 * that a child is not merely a template fragment: it has state of its own.
 *
 * Retention scaffolding comes from `shared/teaching`: a {@link Flow} diagram of
 * the decorator → compiled definition → instance pipeline, a {@link Predict} on
 * the NG8001 missing-import error every beginner hits, and a {@link Quiz} on
 * instance isolation, which is the idea learners most often get wrong.
 */
@Component({
  selector: 'app-lesson-components',
  imports: [RouterLink, GreetingCard, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './components.html',
})
export class Components {
  /**
   * The name passed down to the demo card.
   */
  protected readonly displayName = signal('Ada');

  /** Code sample for the missing-import prediction, kept out of the template. */
  protected readonly missingImportSample = `@Component({
  selector: 'app-dashboard',
  imports: [],                       // <- note what is NOT here
  template: '<app-greeting-card name="Ada" />',
})
export class Dashboard {}`;

  /** Steps in the diagram of how a class becomes pixels. */
  protected readonly pipeline = [
    { label: 'You write', detail: 'A class with a `@Component` decorator' },
    {
      label: 'Compiler reads it',
      detail: 'At build time, not in the browser',
      tone: 'accent' as const,
    },
    { label: 'Emits `ɵcmp`', detail: 'A template *function*, not HTML' },
    { label: 'Tag matched', detail: 'One fresh instance per tag', tone: 'accent' as const },
    {
      label: 'DOM patched',
      detail: 'Change detection re-runs the function',
      tone: 'good' as const,
    },
  ];

  /** Answer choices for the instance-isolation check. */
  protected readonly isolationOptions = [
    {
      text: 'All three show 1 — they share the class, so they share the field',
      why: 'A class is a blueprint, not a shared object. Sharing the class does not share its fields any more than two houses share a wall because they came from one drawing.',
    },
    {
      text: 'Only the clicked card shows 1',
      correct: true,
      why: 'Each tag creates a separate instance with its own `claps` signal. That isolation is what makes a component reusable.',
    },
    {
      text: 'It depends on whether `claps` is a signal',
      why: 'Signal or plain field makes no difference here. Either way each instance gets its own copy — the signal only affects whether the *screen* updates.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'If a component is just a class, why can I not use `new GreetingCard()`?',
      a: 'You can, in a test — but the object you get has no template attached and no injector behind it. Angular creates instances through the dependency injector so constructor parameters and `inject()` calls resolve, and so the compiled template function has a view to write into.',
    },
    {
      q: 'Do I have to prefix my selectors with `app-`?',
      a: 'No. The compiler accepts `greeting-card` happily. The prefix is a lint rule from `angular.json` plus the style guide, and it exists so your components never collide with a current or future HTML element — every real tag is a single word, so a hyphenated prefix is permanently safe.',
    },
    {
      q: 'When should I use `template` instead of `templateUrl`?',
      a: 'Inline `template` is fine for anything that fits on a screen — a small card, a demo. Past that, `templateUrl` gets you editor tooling, real HTML syntax highlighting, and a diff that is readable. This repo splits every component out for exactly that reason.',
    },
    {
      q: 'Is a component the same thing as a directive?',
      a: 'Almost. A component *is* a directive that also produces a view. Same decorator machinery, same lifecycle, same injector — `@Directive` just skips the template half. That is why anything you can do to an element with a directive you can also do from a component host.',
    },
  ];

  /**
   * Mirrors the text box into {@link displayName}.
   *
   * @param event The input event.
   */
  protected rename(event: Event) {
    this.displayName.set((event.target as HTMLInputElement).value);
  }
}
