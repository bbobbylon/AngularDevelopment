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
  ],
  templateUrl: './pipes.html',
  styleUrl: './pipes.css',
})
export class Pipes {
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
