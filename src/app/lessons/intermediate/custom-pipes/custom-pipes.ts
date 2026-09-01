import {
  ChangeDetectorRef,
  Component,
  Injectable,
  OnDestroy,
  Pipe,
  PipeTransform,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subscription, interval, map } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── 1. Pure pipe — truncate ─────────────────────────────────────────────────
/**
 * Shortens a string and appends an ellipsis.
 */
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  /**
   * @param value The text.
   * @param limit Maximum characters before truncating.
   * @param trail Suffix appended when truncated.
   * @returns The text, shortened if it was over the limit.
   */
  transform(value: string, limit = 20, trail = '…'): string {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit).trimEnd() + trail : value;
  }
}

// ── 2. Pure pipe — sentenceCase ──────────────────────────────────────────────
/**
 * Capitalises the first letter and lowercases the rest.
 */
@Pipe({ name: 'sentenceCase', standalone: true })
export class SentenceCasePipe implements PipeTransform {
  /**
   * @param value The text.
   * @returns The text in sentence case.
   */
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}

// ── 3. Pure pipe — filterBy (array filter, same pattern as FilterLessonsPipe) ─
/**
 * Filters a list by a substring match on one field.
 */
@Pipe({ name: 'filterBy', standalone: true })
export class FilterByPipe implements PipeTransform {
  /**
   * Generic over the item type and constrained to `keyof T`, so a typo in the
   * field name is a compile error rather than a filter that silently matches
   * nothing.
   *
   * Note this pipe is **pure**, so it only re-runs when an argument changes by
   * reference — the array, the field name, or the query string. Mutating the
   * array in place leaves all three references exactly as they were, so the
   * view will not update; see the live demo below, which makes that failure
   * visible on purpose.
   *
   * @param items The list.
   * @param field Which field to match against.
   * @param query The substring to look for.
   * @returns The matching items, or the same array reference when the query is blank.
   */
  transform<T extends object>(items: T[], field: keyof T, query: string): T[] {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => String(item[field]).toLowerCase().includes(q));
  }
}

// ── 4. Pipe that injects a service (DatePipe) ────────────────────────────────
/**
 * Formats a timestamp as "3 minutes ago", falling back to a date once it is old
 * enough for that to be more useful.
 */
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  /**
   * The built-in date pipe, injected. A pipe is a normal injectable, so it can use
   * DI and compose with other pipes rather than reimplementing them.
   */
  private readonly datePipe = inject(DatePipe);

  /**
   * @param isoDate An ISO timestamp.
   * @returns A relative description, or an absolute date past a threshold.
   */
  transform(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return this.datePipe.transform(isoDate, 'mediumDate') ?? isoDate;
  }
}

// ── 5. Impure pipe — highlight search term (pure: false) ─────────────────────
/**
 * Wraps matches of a search term in `<mark>`.
 *
 * Declared **impure** (`pure: false`), so it re-runs on every change-detection
 * pass. That is the trade the lesson highlights: it catches changes a pure pipe
 * would miss, and it costs a call on every pass — which is why impure pipes are
 * a last resort rather than a convenience. It is also silently at the mercy of
 * whether a pass ever reaches this view at all — see "Impure pipes" below.
 */
@Pipe({ name: 'highlight', standalone: true, pure: false })
export class HighlightPipe implements PipeTransform {
  /**
   * Escapes regex metacharacters in the term before building the pattern, so a
   * search for `c++` is a search rather than a syntax error.
   *
   * @param value The text.
   * @param term  The term to highlight.
   * @returns The text with matches wrapped.
   */
  transform(value: string, term: string): string {
    if (!term) return value;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
}

// ── 6. Instrumentation for the miniAsync demo ─────────────────────────────────
/**
 * Tiny instrumentation service for the {@link MiniAsyncPipe} demo: a live
 * count of active subscriptions plus a short trailing log, so "it cleans up
 * after itself" is something the reader watches happen rather than a claim to
 * take on faith.
 *
 * Provided per-lesson — in {@link CustomPipes}'s own `providers`, next to
 * `DatePipe` — rather than `providedIn: 'root'`. This is demo scaffolding, not
 * a real application service, and it has no reason to survive navigating away
 * from the lesson.
 */
@Injectable()
export class PipeActivityLog {
  private readonly activeCount = signal(0);
  /** How many `MiniAsyncPipe` instances are currently subscribed. */
  readonly count = this.activeCount.asReadonly();

  private readonly recent = signal<string[]>([]);
  /** The last several subscribe/unsubscribe events, newest last. */
  readonly entries = this.recent.asReadonly();

  subscribed(): void {
    this.activeCount.update((n) => n + 1);
    this.push(`subscribed → ${this.activeCount()} active`);
  }

  unsubscribed(): void {
    this.activeCount.update((n) => n - 1);
    this.push(`unsubscribed → ${this.activeCount()} active`);
  }

  private push(line: string): void {
    this.recent.update((lines) => [...lines, line].slice(-6));
  }
}

// ── 7. Stateful, impure pipe — a homemade version of the built-in async pipe ─
/**
 * A from-scratch reimplementation of Angular's `async` pipe: subscribes to an
 * Observable, hands back its latest value, and cleans up after itself.
 *
 * `pure: false` here is not a shortcut — it is load-bearing. The value this
 * pipe returns changes on the *Observable's own schedule* (a tick, a socket
 * message), which is not a change to any argument the pipe was called with.
 * There is nothing for the default single-slot memoisation to key off, so
 * Angular has to ask every single check whether anything new has arrived.
 *
 * See the live demo below, which mounts and unmounts this pipe on demand and
 * counts active subscriptions, so "cleans up after itself" is something you
 * watch happen rather than a claim to take on faith.
 */
@Pipe({ name: 'miniAsync', standalone: true, pure: false })
export class MiniAsyncPipe implements PipeTransform, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly log = inject(PipeActivityLog);
  private source: Observable<unknown> | null = null;
  private subscription: Subscription | null = null;
  private latest: unknown = null;

  /**
   * @param source$ The observable to watch, or `null`/`undefined` for none.
   * @returns The most recently emitted value, or `null` before the first one.
   */
  transform<T>(source$: Observable<T> | null | undefined): T | null {
    const next = source$ ?? null;
    // Only act when a DIFFERENT observable arrives at THIS binding site. This
    // pipe re-runs on every check, so without this guard it would tear down
    // and resubscribe on every single pass instead of once per real change.
    if (next !== this.source) {
      this.teardown();
      this.source = next;
      this.latest = null;
      if (next) {
        this.subscription = next.subscribe((value) => {
          this.latest = value;
          // markForCheck(), not detectChanges(): flag this view and let the
          // NEXT pass pick the value up, exactly like every other async
          // notification in Angular.
          this.cdr.markForCheck();
        });
        this.log.subscribed();
      }
    }
    return this.latest as T | null;
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private teardown(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
      this.log.unsubscribed();
    }
  }
}

/**
 * A fruit in the filter demo.
 */
interface Fruit {
  name: string;
  color: string;
}
/**
 * A post in the relative-time demo.
 */
interface Post {
  id: number;
  title: string;
  date: string;
}

/**
 * Lesson: Custom Pipes — writing your own template transforms with `@Pipe`
 * and `PipeTransform`.
 *
 * Five real, standalone pipes are declared above this class and demonstrated
 * live in the template: a pure formatter with default arguments (`truncate`),
 * a one-argument pure transform (`sentenceCase`), a generic pure filter over
 * an array (`filterBy`), a pure pipe that injects a service (`relativeTime`),
 * and an impure one (`highlight`, `pure: false`). A sixth, `miniAsync`, is a
 * from-scratch reimplementation of Angular's own `async` pipe — the one
 * legitimate reason to reach for `pure: false`: a pipe that owns a
 * subscription and must tear it down.
 *
 * The through-line is **what "pure" actually buys you** — not "no side
 * effects" in the abstract, but a genuine single-slot memoisation Angular
 * manages per binding site — and exactly what breaks it: mutating an array
 * instead of replacing it, a fresh object/array literal as a template
 * argument, or hiding real impurity inside a pipe that is pure by default.
 *
 * Presentation follows the brain-friendly layer — see
 * `expert/change-detection` for the reference implementation. The teaching
 * order: pose "where does formatting logic live?" before naming pipes as the
 * answer, an analogy (a bouncer with one Polaroid) before the mechanism, then
 * the same idea — a pure pipe's single-slot cache — restated as a dialogue, a
 * live mutate-vs-replace demo, and a quiz built around the misconception that
 * "memoized" means a shared, keyed cache.
 */
@Component({
  selector: 'app-lesson-custom-pipes',
  imports: [
    RouterLink,
    FormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    TruncatePipe,
    SentenceCasePipe,
    FilterByPipe,
    RelativeTimePipe,
    HighlightPipe,
    MiniAsyncPipe,
  ],
  // DatePipe is provided (not template-imported): RelativeTimePipe inject()s it.
  // PipeActivityLog is scoped to this lesson too — see its own JSDoc for why.
  providers: [DatePipe, PipeActivityLog],
  templateUrl: './custom-pipes.html',
  styleUrl: './custom-pipes.css',
})
export class CustomPipes {
  /**
   * Text for the truncate demo.
   */
  protected readonly longText =
    'Angular pipes transform display values declaratively inside templates without touching component logic.';
  /**
   * The truncation limit.
   */
  protected readonly limit = signal(40);
  /**
   * Text for the sentence-case demo.
   */
  protected readonly rawText = signal('HELLO WORLD from angular pipes');
  /**
   * The filter demo's query.
   */
  protected readonly fruitQuery = signal('');
  /**
   * The highlight demo's search term.
   */
  protected readonly highlightQuery = signal('pipe');

  /**
   * The original fruit list, kept separately so the "Reset" button has
   * something to restore.
   */
  private readonly seedFruits: Fruit[] = [
    { name: 'Apple', color: '#e53e3e' },
    { name: 'Banana', color: '#d69e2e' },
    { name: 'Blueberry', color: '#5a67d8' },
    { name: 'Grape', color: '#805ad5' },
    { name: 'Mango', color: '#dd6b20' },
    { name: 'Orange', color: '#ed8936' },
    { name: 'Peach', color: '#f687b3' },
    { name: 'Strawberry', color: '#fc8181' },
  ];

  /**
   * The list the filter demo filters — a **plain field**, not a signal or a
   * `readonly` array, mutated by one button and reassigned by another. That
   * is deliberate: it is what lets the two buttons below prove, live, the
   * difference between changing an array and replacing one.
   */
  protected fruits: Fruit[] = [...this.seedFruits];

  /** Counter feeding unique names to newly added fruit. */
  private fruitSeq = 0;

  /**
   * Pushes a new fruit into the SAME array reference. `FilterByPipe`'s cached
   * `items` argument does not change, so its memoised output does not either
   * — the new fruit exists in `fruits` but will not appear in the filtered
   * list until something forces a fresh reference (see {@link addFruitByReplacing}).
   */
  protected pushFruitByMutation(): void {
    this.fruitSeq++;
    this.fruits.push({ name: `Kiwi ${this.fruitSeq}`, color: '#7cb518' });
  }

  /**
   * Adds a new fruit by building a brand-new array. The reference changes, so
   * the pure pipe's cache is invalidated and `transform()` runs again.
   */
  protected addFruitByReplacing(): void {
    this.fruitSeq++;
    this.fruits = [...this.fruits, { name: `Kiwi ${this.fruitSeq}`, color: '#7cb518' }];
  }

  /** Restores the original list, for re-running the demo. */
  protected resetFruits(): void {
    this.fruits = [...this.seedFruits];
    this.fruitSeq = 0;
  }

  /**
   * The list the filter demo filters.
   */
  protected readonly posts: Post[] = [
    {
      id: 1,
      title: 'Signal-based state management',
      date: new Date(Date.now() - 3 * 60_000).toISOString(),
    },
    {
      id: 2,
      title: 'Building with @defer',
      date: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    },
    {
      id: 3,
      title: 'View Transitions deep dive',
      date: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    },
    {
      id: 4,
      title: 'Zoneless Angular migration',
      date: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    },
  ];

  /**
   * Sentences for the highlight demo.
   */
  protected readonly highlightItems = [
    'Angular pipes transform values for display in templates.',
    'A pure pipe is memoized and re-runs only on reference change.',
    'Pipes can inject services using the inject() function.',
    'Chain multiple pipes: value | truncate:30 | sentenceCase.',
  ];

  /**
   * Whether the two live clocks (each its own `miniAsync` binding) are
   * currently mounted.
   */
  protected readonly showClocks = signal(false);

  /**
   * A shared, cold Observable ticking once a second. Bound at two separate
   * places in the template so the demo can show two independent `MiniAsyncPipe`
   * instances subscribing to it at once.
   */
  protected readonly ticks$ = interval(1000).pipe(map((n) => n + 1));

  /** The subscription counter and log the `miniAsync` demo reads from. */
  protected readonly activityLog = inject(PipeActivityLog);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Pipes & Directives track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Custom Pipes' },
    { label: 'Attribute Directives', id: 'attribute-directives' },
    { label: 'Structural Directives', id: 'structural-directives' },
  ];

  /**
   * The check-and-cache exchange a pure pipe actually runs, staged as a
   * dialogue between the template and the pipe instance sitting at one
   * binding site.
   *
   * This exists because "memoized" is the word the whole lesson keeps coming
   * back to, and prose describing a cache is exactly the kind of thing that
   * reads as clear and evaporates on recall. Watching the pipe instance
   * check its own Polaroid twice — once with a miss, once with a hit — is
   * the same fact in a mode that sticks.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'Template',
      says: "Check due. `value` is `'HELLO WORLD'` — transform it.",
    },
    {
      who: 'Pipe instance',
      says:
        "Is that `===` the one on my Polaroid? …No — last time it was `'hello'`. " +
        'Recomputing, and keeping this one as the new photo.',
    },
    {
      who: 'Template',
      says: 'Next check. `value` is still the exact same string — nobody touched it.',
    },
    {
      who: 'Pipe instance',
      says: "Same reference as my photo. Here's the stamp from last time — I never even called `transform()`.",
    },
  ];

  /** Line-by-line walkthrough of `TruncatePipe`, as shown in the anatomy `app-code-lab`. */
  protected readonly truncateSample = `@Pipe({ name: 'truncate', standalone: true })   // pure by default
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 20, trail = '…'): string {
    if (!value) return '';
    return value.length > limit
      ? value.slice(0, limit).trimEnd() + trail
      : value;
  }
}`;

  /** Notes for {@link truncateSample}. */
  protected readonly truncateNotes: CodeNote[] = [
    {
      line: 1,
      text: "`@Pipe` is a decorator, same family as `@Component`. `name: 'truncate'` is the string you actually type after `|` in a template — it does not have to match the class name. `standalone: true` means it can go straight into a component's `imports` array; no NgModule involved.",
    },
    {
      line: 2,
      text: '`implements PipeTransform` is not required at runtime — Angular just looks for a method called `transform`. Keep it anyway: it makes TypeScript check the method exists and is shaped correctly.',
    },
    {
      line: 3,
      text: 'The **first** parameter, `value`, is always whatever sat on the left of `|`. Every parameter after it comes from `:args` you write in the template, and — like `limit` and `trail` here — each can carry its own default.',
    },
    {
      line: 4,
      text: 'Guard before touching `.length`: this line is why `{{ someValue | truncate }}` renders nothing instead of throwing when `someValue` is `null` or `undefined`.',
    },
    {
      line: 5,
      text: 'The whole job, in one expression: cut to `limit` characters and add `trail` only if the string was actually over the limit. Note it builds and returns a **new** string — `value` itself is never written to.',
    },
  ];

  /** `SentenceCasePipe`, annotated for the chaining `app-code-lab`. */
  protected readonly sentenceCaseSample = `@Pipe({ name: 'sentenceCase', standalone: true })
export class SentenceCasePipe implements PipeTransform {
  // The name in the decorator is what you type after \`|\` in a template.
  // It is NOT the class name, and it must be unique across every pipe
  // the component imports.
  transform(value: string): string {
    if (!value) return '';
    // charAt(0) rather than value[0]: on '' it returns '' instead of
    // undefined, so this never throws on an empty string.
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}`;

  /** Notes for {@link sentenceCaseSample}. */
  protected readonly sentenceCaseNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The template-facing name — `sentenceCase` — is completely independent of the class name. Every pipe a template imports needs a **unique** name; two pipes both named `format` collide and only one wins.',
    },
    {
      line: 6,
      text: 'One parameter, so this pipe never takes `:args` — just `{{ value | sentenceCase }}`, nothing after a colon.',
    },
    {
      line: 10,
      text: 'Returns a **brand-new** string; `value` itself is never touched. That immutability is exactly what makes memoisation safe — see the mental-model section above for what the cache is actually holding.',
    },
  ];

  /** The chaining pipeline shown in `app-flow`. */
  protected readonly chainSteps: FlowStep[] = [
    { label: 'rawText()', detail: '`"HELLO WORLD from angular pipes"`' },
    { label: '`| truncate:20`', detail: 'cuts to 20 characters, adds `…`', tone: 'accent' },
    { label: '`| sentenceCase`', detail: 'capitalises what is left', tone: 'good' },
  ];

  /** `FilterByPipe`, annotated for the generic-pipe `app-code-lab`. */
  protected readonly filterBySample = `@Pipe({ name: 'filterBy', standalone: true })
export class FilterByPipe implements PipeTransform {
  // Generic over T, constrained to an object, so \`field\` autocompletes to
  // real property names on whatever array you pipe in — pass a typo and
  // it will not compile.
  transform<T extends object>(items: T[], field: keyof T, query: string): T[] {
    const q = query.trim().toLowerCase();
    // Empty query -> return the SAME array reference, not a copy. A fresh
    // array on every call would look like a change to this pipe's own
    // cache and defeat the memoisation it relies on.
    if (!q) return items;
    return items.filter((item) => String(item[field]).toLowerCase().includes(q));
  }
}`;

  /** Notes for {@link filterBySample}. */
  protected readonly filterByNotes: CodeNote[] = [
    {
      line: 6,
      text: '`T extends object` lets this work on any array of objects while keeping the return type `T[]` instead of collapsing to `any[]`. `keyof T` is what makes `field` autocomplete to real property names.',
    },
    {
      line: 7,
      text: 'Normalised **once**, outside the filter — not recomputed on every item.',
    },
    {
      line: 11,
      text: 'Returning the exact same reference on an empty query matters: the pure-pipe wrapper around this function compares ITS OWN cached input by `===`, and a fresh `[...items]` copy on every call would look like a change and throw the memoisation away for nothing.',
    },
    {
      line: 12,
      text: '`String(...)` coerces numbers, booleans and `null` safely, so filtering a numeric column does not throw on `.toLowerCase()`. `.includes` — not `===` — is what makes this a substring search rather than an exact match.',
    },
  ];

  /** `RelativeTimePipe`, annotated for the dependency-injection `app-code-lab`. */
  protected readonly relativeTimeSample = `@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  // A pipe is an ordinary injectable — inject() works inside one exactly
  // like it does inside a component.
  private readonly datePipe = inject(DatePipe);

  transform(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return \`\${mins}m ago\`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return \`\${hrs}h ago\`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return \`\${days}d ago\`;
    // Falls back to the injected DatePipe once "days ago" stops being useful.
    return this.datePipe.transform(isoDate, 'mediumDate') ?? isoDate;
  }
}

// Add DatePipe to the host component's own \`providers\` array — it is not
// template-imported here, so it will not resolve on its own.`;

  /** Notes for {@link relativeTimeSample}. */
  protected readonly relativeTimeNotes: CodeNote[] = [
    {
      line: 5,
      text: "`inject(DatePipe)` — a pipe runs inside an injection context, so the same `inject()` you use in components and other pipes works here too. This one reuses Angular's **built-in** `DatePipe` instead of reimplementing date formatting.",
    },
    {
      line: 9,
      text: '`60_000` is milliseconds in a minute. The underscore is a digit separator TypeScript ignores — it is there purely so a human can count the zeros.',
    },
    {
      line: 17,
      text: 'The built-in pipe is not a component or a template concern here — it is just an injected object with its own `transform()`, called directly like any other method. `?? isoDate` covers the one case it can return `null`: an unparsable date string.',
    },
    {
      line: 21,
      text: "`DatePipe` goes in the host component's `providers` array — not its `imports` — because nothing in the template writes `| date` directly; only this pipe's own field needs it resolved.",
    },
  ];

  /** `HighlightPipe`, annotated for the impure-pipes `app-code-lab`. */
  protected readonly highlightSample = `@Pipe({ name: 'highlight', standalone: true, pure: false })
export class HighlightPipe implements PipeTransform {
  transform(value: string, term: string): string {
    if (!term) return value;
    // Escape regex metacharacters in the SEARCH TERM before it becomes
    // part of a pattern, or a user typing "c++" throws instead of finding
    // anything.
    const escaped = term.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
    // 'g' = every match, 'i' = case-insensitive. The capture group is
    // what $1 refers to below, so the matched text survives the wrap.
    return value.replace(new RegExp(\`(\${escaped})\`, 'gi'), '<mark>$1</mark>');
  }
}

// Template — bind [innerHTML], not interpolation:
<p [innerHTML]="sentence | highlight: term()"></p>`;

  /** Notes for {@link highlightSample}. */
  protected readonly highlightNotes: CodeNote[] = [
    {
      line: 1,
      text: "`pure: false` is the whole point of this pipe. `term` is read from a signal in the template, and — as the section below explains — even a signal read is not enough to guarantee a pure pipe's own cache gets invalidated the way you'd expect on every path through the app. Marking it impure trades a cost (rerunning every check) for certainty.",
    },
    {
      line: 4,
      text: 'An empty term returns the input untouched, and skips building a regex that would otherwise match every position in the string.',
    },
    {
      line: 8,
      text: "Regex metacharacters in the user's own text — `.`, `*`, `(`, `[` and so on — would otherwise be parsed as pattern syntax instead of literal characters. `\\\\$&` in the replacement means 'put the whole match back, with a backslash in front of it'.",
    },
    {
      line: 16,
      text: "Binds to `[innerHTML]` because the output is a string **containing markup**. Plain interpolation would print the literal text `<mark>` instead of parsing it — Angular's sanitizer still runs and strips anything dangerous, but only `[innerHTML]` asks it to parse the string as HTML at all.",
    },
  ];

  /** `MiniAsyncPipe`, annotated for the stateful-pipes `app-code-lab`. */
  protected readonly miniAsyncSample = `@Pipe({ name: 'miniAsync', standalone: true, pure: false })
export class MiniAsyncPipe implements PipeTransform, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private source: Observable<unknown> | null = null;
  private subscription: Subscription | null = null;
  private latest: unknown = null;

  transform<T>(source$: Observable<T> | null | undefined): T | null {
    const next = source$ ?? null;
    // Only act when a DIFFERENT observable arrives at THIS binding site —
    // this pipe re-runs on every check (pure: false), so without this
    // guard it would tear down and resubscribe on every single pass.
    if (next !== this.source) {
      this.teardown();
      this.source = next;
      this.latest = null;
      if (next) {
        this.subscription = next.subscribe((value) => {
          this.latest = value;
          // markForCheck(), not detectChanges(): flag this view and let
          // the NEXT pass pick it up, like every async notification.
          this.cdr.markForCheck();
        });
      }
    }
    return this.latest as T | null;
  }

  // Never skipped: Angular calls this when the binding is destroyed —
  // a route change, an @if closing, or the app shutting down. A real
  // subscription with no ngOnDestroy is a real, permanent leak.
  ngOnDestroy(): void {
    this.teardown();
  }

  private teardown(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}`;

  /** Notes for {@link miniAsyncSample}. */
  protected readonly miniAsyncNotes: CodeNote[] = [
    {
      line: 1,
      text: "`pure: false` is load-bearing here, not a shortcut: this pipe's return value changes on the Observable's own schedule — a socket message, an interval tick — which is not a change to any **argument** the pipe was called with. There is nothing for the default memoisation to key off.",
    },
    {
      line: 3,
      text: '`ChangeDetectorRef` is how a pipe — like a component — gets a handle onto the view it belongs to, so it can ask for a re-check later.',
    },
    {
      line: 9,
      text: '`?? null` normalises `undefined` to `null` so the comparison below has exactly two states: "the same observable" or "a different one" — never a third case of "was it undefined last time?"',
    },
    {
      line: 13,
      text: 'The guard that makes an impure pipe safe to hold a subscription. Without it, every single change-detection pass — dozens a second once something is emitting — would unsubscribe and resubscribe, because `transform()` runs on every pass regardless of purity.',
    },
    {
      line: 18,
      text: '`subscribe()` is what actually starts the work. Nothing before this line has produced a value; a `miniAsync` on a source nobody has piped in yet returns `null` and does nothing.',
    },
    {
      line: 22,
      text: "This is the entire reason a value ever reaches the screen: the subscription's callback fires on every emission, and `markForCheck()` is what turns 'I have a new value' into 'a pass will actually come and read it'.",
    },
    {
      line: 36,
      text: "This whole shape — subscribe on the way in, `markForCheck()` on every value, unsubscribe here on the way out — is Angular's real `async` pipe, with the null-handling and Promise support stripped away.",
    },
  ];

  /** Code shown inside the OnPush/impure `app-compare`, left panel. */
  protected readonly onPushImpureBadSample = `@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
class ResultsPanel {
  // No signal read here, no changed @Input, no local
  // (click) — this view is simply never re-checked once
  // it first renders.
}`;

  /** Code shown inside the OnPush/impure \`app-compare\`, right panel. */
  protected readonly onPushImpureBadTemplate = `<p [innerHTML]="row | highlight: sharedSearch.term"></p>
<!-- sharedSearch.term is a PLAIN FIELD on a service,
     mutated from somewhere else in the app -->`;

  protected readonly onPushImpureGoodSample = `class ResultsPanel {
  // Reading a signal in the template is what marks
  // THIS view dirty — the fix has nothing to do with
  // the pipe's purity at all.
  protected readonly term = inject(SearchState).term;
}`;

  protected readonly onPushImpureGoodTemplate = `<p [innerHTML]="row | highlight: term()"></p>`;

  /**
   * Self-test: what "memoized" actually means for a pure pipe.
   *
   * The distractor options are the three ways learners misread "memoized" —
   * a shared cache, no caching at all, and a cache that never expires — each
   * of which leads to a different wrong prediction about the demos above.
   */
  protected readonly memoQuiz: QuizOption[] = [
    {
      text: 'One shared result per unique input value, reused by every binding in the app that pipes the same value.',
      why: 'That would be a real cache with a key. Angular keeps nothing of the sort — two separate `{{ x | truncate }}` bindings piping the identical string never share anything; each one repeats the work and keeps its own copy.',
    },
    {
      text: 'Exactly one input/output pair, held per binding instance, replaced the moment the input changes.',
      correct: true,
      why: 'Right. Each binding site gets its own pipe instance holding a single-slot memory — the last input it saw and the last output it produced. A different reference and the slot is overwritten and `transform()` runs again; the same reference and the stored output is handed back untouched.',
    },
    {
      text: "Nothing — 'pure' just means the function has no side effects, so Angular still calls transform() on every check.",
      why: "Purity is what makes the caching **safe**, not a reason to skip it. Angular does skip the call when every argument's reference is unchanged — that skip is the entire performance benefit a pure pipe buys you over calling a plain method from the template.",
    },
    {
      text: 'The output is cached until the component is destroyed, however many times the input changes after that.',
      why: 'If that were true, `{{ rawText() | sentenceCase }}` above would freeze after your first keystroke. The single slot is overwritten on every genuine change — it only skips redoing the work when the input did not change.',
    },
  ];

  /**
   * Scenario quiz: choosing between a pure pipe, an impure pipe, a raw
   * template expression, and `computed()` for the same real requirement.
   */
  protected readonly toolQuiz: QuizOption[] = [
    {
      text: 'A pure pipe: `todos | incomplete`.',
      why: 'This is exactly the mutate-vs-replace demo above, one level up. A pure pipe compares `todos` by reference; items pushed in never change that reference, so the cache keeps handing back the old, incomplete-at-the-time list.',
    },
    {
      text: 'Make the pipe impure (pure: false).',
      why: 'It would work, in the sense that it reruns on every check that reaches this view — but it now re-filters the whole array on every single one of those checks, forever, whether or not anything actually changed. A real cost for a problem signals solve for free.',
    },
    {
      text: 'Store `todos` as a signal and derive the incomplete ones with `computed()`.',
      correct: true,
      why: 'Right. `computed()` recomputes only when a signal it reads changes, caches its result once for every reader rather than per binding site, and a template that reads it registers as a dependent automatically. This is the modern default the whole lesson keeps pointing back to.',
    },
    {
      text: 'Filter directly in the template: `@for (t of todos.filter(x => !x.done); …)`.',
      why: 'This calls `.filter()` fresh on every single check of this view, with no memoisation at all — worse than either pipe option, and exactly the kind of expensive template expression the change-detection lesson warns against.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do two `| truncate` bindings on the same page share their cache?',
      a: "No. Each `| pipeName` written in a template gets its **own pipe instance**, and each instance holds its own single-slot memory. Two bindings piping the exact same string run `transform()` independently and never know about each other — 'memoized' means 'remembers its own last answer', not 'shares one answer app-wide'.",
    },
    {
      q: 'How do I unit test a pipe?',
      a: "A pure pipe with no dependencies is just a class: `expect(new TruncatePipe().transform('hello world', 5)).toBe('hello…')`, no TestBed involved. One with an injected dependency, like `RelativeTimePipe`, needs `TestBed.configureTestingModule({ providers: [DatePipe, RelativeTimePipe] })` and then `TestBed.inject(RelativeTimePipe)` to get an instance with `inject()` resolved. Test an impure pipe through a small host component instead of in isolation, since its behaviour depends on being checked repeatedly.",
    },
    {
      q: 'Can a pipe call `inject(HttpClient)` and fetch data inside transform()?',
      a: "It compiles — a pipe is an injectable and `inject()` works inside one — but don't. `transform()` can run many times a second, has no way to cancel an in-flight request, and no loading state to show while it waits. Fetch data where you already fetch data, and let the pipe format the result that is already sitting in a signal.",
    },
    {
      q: 'Is `miniAsync` above really what the built-in async pipe does?',
      a: 'Same shape, smaller. Subscribe on the way in, `markForCheck()` on every value, unsubscribe on the way out. The real `async` pipe additionally unwraps Promises (not just Observables), returns `null` while nothing has arrived yet rather than a stale value carried over from a previous source, and is tested against a long list of edge cases this version was never asked to handle.',
    },
    {
      q: 'What happens if transform() throws?',
      a: 'The same thing as a template expression throwing: Angular does not catch it for you, and the error can crash the render. A pipe that parses, divides, or reaches into a nested property should guard itself the same way any code that runs on every check should — a null check or a `try/catch` around the risky part, not an assumption that bad input can never arrive.',
    },
  ];
}
