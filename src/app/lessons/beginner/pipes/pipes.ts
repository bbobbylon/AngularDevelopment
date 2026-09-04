import {
  CurrencyPipe,
  DatePipe,
  DecimalPipe,
  JsonPipe,
  KeyValuePipe,
  LowerCasePipe,
  PercentPipe,
  SlicePipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Predict, Quiz, type QuizOption, Remember } from '../../../shared/teaching';

/**
 * Lesson: Built-in Pipes — formatting values in the template.
 *
 * Covers the everyday set (`uppercase`, `titlecase`, `date`, `number`,
 * `currency`, `percent`, `json`, `slice`, `keyvalue`, `async`), chaining, and
 * passing parameters.
 *
 * The under-the-hood point the lesson makes: the built-ins are **pure**, so
 * Angular only re-runs them when the input reference changes. That is why a pipe
 * is cheaper than a method call in a template — and why a pipe that reads
 * mutable state without a new reference appears to be broken.
 */
@Component({
  selector: 'app-lesson-pipes',
  imports: [
    RouterLink,
    UpperCasePipe,
    LowerCasePipe,
    TitleCasePipe,
    DecimalPipe,
    PercentPipe,
    CurrencyPipe,
    DatePipe,
    JsonPipe,
    SlicePipe,
    KeyValuePipe,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './pipes.html',
  styleUrl: './pipes.css',
})
export class Pipes {
  /**
   * The date-string-is-UTC puzzle used by the ask-before-telling block. This is
   * the most-reported "Angular bug" that isn't one: a date-only ISO string is
   * parsed as midnight **UTC** per the ECMAScript spec, then rendered in local
   * time — so west of Greenwich it displays as the previous day.
   *
   * Held in the class rather than the template because the snippet contains
   * `{`/`}`, which Angular's parser reads as control-flow syntax in an attribute.
   */
  protected readonly dateTrapSample = `// The API returns a date-only string. No time, no timezone.
birthday = '2024-03-15';

// The template:
//   {{ birthday | date: 'fullDate' }}
//
// A user in New York (UTC-4) reports it shows the wrong day.
// A user in Berlin (UTC+1) says it looks fine.`;

  /**
   * The self-test, on `digitsInfo` — the single most misread string in the
   * built-in pipe set. Each wrong answer is a specific misreading of the format.
   */
  protected readonly quizOptions: readonly QuizOption[] = [
    {
      text: '`1,234.50` — grouping separators are added, and the fraction is padded to exactly two digits.',
      correct: true,
      why: 'Right. `1.2-2` means *at least 1 integer digit, at least 2 and at most 2 fraction digits*. The `.5` is padded to `.50`, and `DecimalPipe` always groups the integer part for the active locale.',
    },
    {
      text: '`1234.50` — `number` only formats decimals; you need a separate pipe to add thousands separators.',
      why: 'Grouping is part of what `DecimalPipe` does, not an extra step. It calls `Intl.NumberFormat` under the hood, which groups by default for the active locale.',
    },
    {
      text: '`1,234.5` — the value already has one fraction digit, and `2-2` sets the maximum, not the minimum.',
      why: 'The `2-2` is `minFraction-maxFraction`, so 2 is both. The *first* number, before the dot, is the one that only sets a minimum.',
    },
    {
      text: '`1.23` — `1.2-2` means "between 1 and 2 digits before the dot, 2 after".',
      why: 'This is the reading the format invites and it is wrong. The dot inside `digitsInfo` is a separator between two settings, not a decimal point in an example number.',
    },
  ];

  /**
   * Text for the case pipes.
   */
  protected readonly text = signal('the quick brown fox');
  /**
   * Number for `number`, `currency` and `percent`.
   */
  protected readonly num = signal(1234.5);
  /**
   * Date for the `date` pipe.
   */
  protected readonly now = signal(new Date());
  /**
   * An object for the `json` pipe.
   */
  protected readonly sample = signal({ id: 1, tags: ['a', 'b'], active: true });

  /**
   * An object for the `keyvalue` pipe.
   */
  protected readonly settings = signal({ theme: 'dark', locale: 'en-US', beta: true });
  /**
   * Whether `keyvalue` sorts. Toggles between its default alphabetical order and
   * the insertion order produced by the no-op comparator below — a default that
   * surprises people the first time a form's fields come out in the wrong order.
   */
  protected readonly sorted = signal(true);
  /** A no-op compare function: keeps keyvalue's output in insertion order. */
  protected readonly noSort = (): number => 0;
}
