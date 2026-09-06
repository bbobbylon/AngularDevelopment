import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
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
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. This lesson already scored well on the
 * retention audit before the migration — the blueprint analogy, the missing-import
 * {@link Predict}, and the instance-isolation {@link Quiz} all survive unchanged.
 * What the migration adds:
 *
 * 1. **A metadata reference table** — the one representation the lesson was
 *    missing. The anatomy code sample explains `selector`/`template`/`styles`/
 *    `imports` in prose and as annotated code; the table says the same four
 *    facts again as a scannable reference, which is exactly the "same idea,
 *    another mode" the retention bar asks for.
 * 2. **Two `app-code-lab` walkthroughs** for the anatomy sample and the selector
 *    forms, replacing bare `<pre>` blocks — nothing on this page assumes the
 *    reader can already read Angular source.
 * 3. **A `TapeCard` row** for the three encapsulation modes, replacing a plain
 *    bullet list with three named, pinned artefacts.
 */
@Component({
  selector: 'app-lesson-components',
  imports: [
    RouterLink,
    BfPage,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    GreetingCard,
  ],
  templateUrl: './components.html',
})
export class Components {
  /**
   * The name passed down to the demo card.
   */
  protected readonly displayName = signal('Ada');

  /** The first stretch of the Beginner track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'What is Angular?', id: 'what-is-angular' },
    { label: 'CLI & Structure', id: 'cli-project-structure' },
    { label: 'Components' },
    { label: 'Interpolation', id: 'interpolation' },
    { label: 'Signals', id: 'signals' },
  ];

  /** Code sample for the missing-import prediction, kept out of the template. */
  protected readonly missingImportSample = `@Component({
  selector: 'app-dashboard',
  imports: [],                       // <- note what is NOT here
  template: '<app-greeting-card name="Ada" />',
})
export class Dashboard {}`;

  /**
   * Sample: a complete, minimal component — every idea the anatomy section
   * names, in one file.
   */
  protected readonly anatomySample = `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-greeting-card',   // how you use it in a template
  imports: [],                     // components/directives/pipes it uses
  template: '<p>Hello, {{ name() }}</p>',
  styles: ['p { color: hotpink }'],
})
export class GreetingCard {
  readonly name = input('Ada');
}`;

  /** Line-by-line walkthrough of {@link anatomySample}. */
  protected readonly anatomyNotes: CodeNote[] = [
    {
      line: 1,
      text: '`Component` is the decorator function used below. `input` is what turns a plain class field into a **signal input** — a value the parent can set from outside, read here as `name()`.',
    },
    {
      line: 3,
      text: '`@Component({` opens the decorator. Everything down to the matching `})` on line 8 is **metadata describing the class** — it is configuration, not code that runs when the app starts.',
    },
    {
      line: 4,
      text: '`selector` is the CSS-like string Angular watches for. Write `<app-greeting-card>` in **any** template in the app and Angular builds a fresh instance of this class right there.',
    },
    {
      line: 5,
      text: '`imports` lists every other component, directive or pipe this template refers to. Empty here because the template below uses nothing but a plain `<p>` — no child components, no directives.',
    },
    {
      line: 6,
      text: '`template` is the HTML this component renders. `{{ name() }}` is **interpolation** — note the parentheses: `name` is a signal, so reading its current value means *calling* it, not just naming it.',
    },
    {
      line: 7,
      text: '`styles` is an array of CSS strings, scoped to this component alone (more on that below) — this `hotpink` rule cannot leak out and colour a `<p>` somewhere else in the app.',
    },
    {
      line: 9,
      text: '`export class GreetingCard {` is the blueprint itself. `export` makes it importable elsewhere; everything the component owns — its fields, its methods — lives inside these braces down to line 11.',
    },
    {
      line: 10,
      text: "`readonly name = input('Ada')` creates the signal input, defaulting to `'Ada'`. A parent overrides it by writing `[name]=\"someValue\"` on the `<app-greeting-card>` tag.",
    },
  ];

  /** Sample: the four forms a selector can take. */
  protected readonly selectorFormsSample = `selector: 'app-card'              // element:   <app-card>
selector: '[appCard]'             // attribute: <div appCard>
selector: '.app-card'             // class:     <div class="app-card">
selector: 'app-card, [appCard]'   // multiple — match either form`;

  /** Line-by-line walkthrough of {@link selectorFormsSample}. */
  protected readonly selectorFormsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The form you have seen already — a brand-new HTML tag. The browser has never heard of `<app-card>` on its own; the Angular **compiler** is what recognises it and swaps in the component.',
    },
    {
      line: 2,
      text: 'Square brackets mean an **attribute selector**, exactly as in CSS. Angular activates on any element carrying that attribute — the tag itself does not have to change at all, which is how attribute directives are built.',
    },
    {
      line: 3,
      text: 'A leading dot is a **class selector**. Rare in practice, since `class` usually drives styling too, but the compiler accepts it.',
    },
    {
      line: 4,
      text: 'A comma joins selectors the way it does in CSS: this component matches **either** form — the tag or the attribute — whichever a template happens to use.',
    },
  ];

  /** Steps in the diagram of how a class becomes pixels. */
  protected readonly pipeline: FlowStep[] = [
    { label: 'You write', detail: 'A class with a `@Component` decorator' },
    {
      label: 'Compiler reads it',
      detail: 'At build time, not in the browser',
      tone: 'accent',
    },
    { label: 'Emits `ɵcmp`', detail: 'A template *function*, not HTML' },
    { label: 'Tag matched', detail: 'One fresh instance per tag', tone: 'accent' },
    {
      label: 'DOM patched',
      detail: 'Change detection re-runs the function',
      tone: 'good',
    },
  ];

  /** Answer choices for the instance-isolation check. */
  protected readonly isolationOptions: QuizOption[] = [
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
  protected readonly questions: FaqItem[] = [
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
