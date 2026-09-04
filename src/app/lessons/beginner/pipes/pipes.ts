import {
  AsyncPipe,
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
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Built-in Pipes — formatting values in the template, and the pipe most
 * tutorials skip.
 *
 * Covers the everyday set (`uppercase`, `titlecase`, `date`, `number`,
 * `currency`, `percent`, `json`, `slice`, `keyvalue`) plus a full treatment of
 * `async` — subscription lifecycle, the `null`-before-first-emission contract,
 * and why it needs no manual unsubscribe. Also corrects two claims the old
 * version of this page got wrong: **most** built-ins are pure, not all of them
 * (`async`, `json`, `keyvalue` and `slice` are impure by design, each for a
 * different reason), and the locale-aware pipes format from Angular's own
 * shipped locale data, not from the browser's `Intl` API.
 *
 * The under-the-hood point the lesson makes: a pipe is an ordinary class with a
 * `transform()` method, `pure` (default `true`) decides whether Angular bothers
 * calling it again, and `async` is the one built-in that turns that knob off —
 * which is exactly what lets it notice a new value on its own.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the formatting problem before naming the operator.** A raw number
 *    needs to become a price; the reader is shown two clumsy ways to do that in
 *    the class before `|` is introduced as the better answer.
 * 2. **Analogy before vocabulary.** The Unix pipe (`cmd1 | cmd2 | cmd3`) is a
 *    shape most readers already own, and Angular borrowed both the symbol and
 *    the idea on purpose.
 * 3. **Then the same idea in several modes** — a taped row of vocabulary, an
 *    annotated minimal pipe class, a step diagram of one `transform()` call, a
 *    dialogue between a template and `AsyncPipe`, and eleven live demos.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Demos on this page
 *
 * - text & number pipes on live inputs (kept from the original lesson);
 * - the date pipe across formats, then timezone and date-only parsing, where a
 *   single string produces two different instants depending on which parser
 *   touches it first;
 * - calling a pipe from TypeScript by injecting it, next to the same
 *   formatting done in the template — proof they are the same call;
 * - `json` reflecting an in-place mutation the moment *anything* forces a
 *   pass, resolving the "but mutation is supposed to be invisible" confusion
 *   left over from the signals lesson;
 * - `keyvalue` sorting live data, with the default-sort-vs-insertion-order
 *   toggle kept from the original lesson;
 * - three independent `| async` bindings on one cold Observable next to the
 *   `as` pattern that turns them into one subscription;
 * - `async` returning `null` until a delayed source actually emits;
 * - a ticking `async` source that restarts from `1` after being unmounted and
 *   remounted — the observable proof that the subscription really was torn
 *   down, not merely hidden.
 *
 * @see lessons/intermediate/custom-pipes — writing your own pure and impure
 * pipes with `@Pipe` and `transform()`.
 */
@Component({
  selector: 'app-lesson-pipes',
  imports: [
    RouterLink,
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
    AsyncPipe,
  ],
  // DatePipe is also injected directly (see `datePipe` below), to prove it is
  // an ordinary class — that only works if it is also registered here.
  providers: [DatePipe],
  templateUrl: './pipes.html',
  styleUrl: './pipes.css',
})
export class Pipes {
  // ── Demo 1: text & number pipes (original) ─────────────────────────────────

  /** Text for the case pipes. */
  protected readonly text = signal('the quick brown fox');
  /** Number for `number`, `currency` and `percent`. */
  protected readonly num = signal(1234.5);
  /** Date for the `date` pipe, and for the class-injected pipe demo below. */
  protected readonly now = signal(new Date());

  /** Re-stamps {@link now} to the current instant, for both date demos on the page. */
  protected refreshNow(): void {
    this.now.set(new Date());
  }

  // ── Demo 2: calling a pipe from TypeScript ──────────────────────────────────

  /**
   * `DatePipe` injected exactly like a service. It is an ordinary class with a
   * `ɵfac` factory, not template-only magic — the only reason this line works
   * is that `DatePipe` is also listed in this component's `providers`.
   */
  private readonly datePipe = inject(DatePipe);

  /** The identical formatting `| date:'shortTime'` does in the template, called by hand. */
  protected readonly formattedInClass = computed(() =>
    this.datePipe.transform(this.now(), 'shortTime'),
  );

  // ── Demo 3: json / keyvalue (original, kept) ────────────────────────────────

  /**
   * An object for the `json` pipe, and for the purity demo further down —
   * mutating its `tags` array in place is the whole point of that section.
   */
  protected readonly sample = signal({ id: 1, tags: ['a', 'b'], active: true });

  /** An object for the `keyvalue` pipe. */
  protected readonly settings = signal({ theme: 'dark', locale: 'en-US', beta: true });
  /**
   * Whether `keyvalue` sorts. Toggles between its default alphabetical order and
   * the insertion order produced by the no-op comparator below — a default that
   * surprises people the first time a form's fields come out in the wrong order.
   */
  protected readonly sorted = signal(true);
  /** A no-op compare function: keeps keyvalue's output in insertion order. */
  protected readonly noSort = (): number => 0;

  // ── Demo 4: purity — mutate a signal and prove nothing scheduled a pass ────

  /**
   * Pushes into `sample().tags` in place — the array genuinely grows, but
   * `sample` never gets `set()` or `update()`, so nothing is notified and no
   * pass is scheduled. Whether that mutation ever reaches the screen is then
   * entirely down to whether *something else* forces a pass, and whether the
   * pipe reading it is pure or impure.
   */
  protected mutateSampleTags(): void {
    this.sample().tags.push(`extra-${this.sample().tags.length}`);
  }

  /** Puts the purity demo back to its starting shape. */
  protected resetSample(): void {
    this.sample.set({ id: 1, tags: ['a', 'b'], active: true });
  }

  /**
   * Does nothing, deliberately. Clicking it still forces a change-detection
   * pass — a template event listener marks its view and notifies the
   * scheduler *before* your handler runs, regardless of what the handler
   * does. It is the "something else" that reveals a mutation an impure pipe
   * was already able to see.
   */
  protected noop(): void {}

  // ── Demo 5: async — three bindings vs `as` ──────────────────────────────────

  /**
   * How many times {@link makeColdSource}'s producer function has run.
   *
   * A plain field, deliberately never read from a template — only the
   * *emitted* numbers are shown, via `| async`. Reading it directly in a
   * binding would risk exactly the mid-pass mutation trap this app's
   * `change-detection` lesson warns about; keeping it off-template avoids the
   * question entirely.
   */
  private coldRequests = 0;

  /**
   * Builds a fresh cold Observable. Subscribing to it re-runs this producer
   * function from scratch, synchronously: it bumps the tally, emits once,
   * and completes. Three independent subscriptions to the object this
   * returns means three independent runs of this function.
   */
  private makeColdSource(): Observable<number> {
    return new Observable<number>((subscriber) => {
      this.coldRequests += 1;
      subscriber.next(this.coldRequests);
      subscriber.complete();
    });
  }

  /**
   * Wrapped in a signal so the reset button can swap in a genuinely new
   * Observable — `| async` only re-subscribes when the *reference* it is
   * bound to changes, exactly like a pure pipe's input check.
   */
  protected readonly coldSource = signal(this.makeColdSource());

  /** Swaps in a fresh cold source and starts the request tally back at zero. */
  protected resetCold(): void {
    this.coldRequests = 0;
    this.coldSource.set(this.makeColdSource());
  }

  // ── Demo 6: async — null before the first emission ─────────────────────────

  /**
   * Builds a source that waits 1.5s before emitting once. The wait is a real
   * `setTimeout`, so the emission happens as its own task, nowhere near a
   * synchronous render — which is what makes it safe for `AsyncPipe` to call
   * `markForCheck()` when it finally arrives, scheduling an ordinary pass
   * rather than fighting the one already in progress.
   */
  private makeDelayedSource(): Observable<string> {
    return new Observable<string>((subscriber) => {
      const id = setTimeout(() => {
        subscriber.next('Fetched — welcome back.');
        subscriber.complete();
      }, 1500);
      return () => clearTimeout(id);
    });
  }

  /** The delayed source, held in a signal so the demo can be replayed. */
  protected readonly delayedSource = signal(this.makeDelayedSource());

  /** Restarts the "loading" demo with a brand-new delayed source. */
  protected restartDelayed(): void {
    this.delayedSource.set(this.makeDelayedSource());
  }

  // ── Demo 7: async — unsubscribe on destroy ──────────────────────────────────

  /**
   * A cold ticking source. Each subscribe starts its own `setInterval` from
   * `n = 0`, and the function returned from the producer is the teardown —
   * exactly what `AsyncPipe.ngOnDestroy()` calls when its host view goes
   * away. One field, reused across every mount: if unsubscribing genuinely
   * stopped the old interval, remounting restarts the count at `1`; if it
   * didn't, two intervals would now be racing and the count would already be
   * high, or climbing unevenly, the moment it reappears.
   */
  protected readonly ticker: Observable<number> = new Observable<number>((subscriber) => {
    let n = 0;
    const id = setInterval(() => subscriber.next(++n), 650);
    return () => clearInterval(id);
  });

  /** Whether the ticker demo's `@if` block — and the `async` pipe inside it — is mounted. */
  protected readonly showTicker = signal(true);

  // ── Presentation data ────────────────────────────────────────────────────────

  /**
   * The "you are here" rail. `pipes` is the only lesson in the `Pipes`
   * category in `CURRICULUM`, so this is a single-item list — `app-chapter`
   * hides the rail itself once there is nothing to compare against, which is
   * the correct behaviour here rather than a gap to fill with invented
   * neighbours.
   */
  protected readonly stops: ChapterStop[] = [{ label: 'Built-in Pipes' }];

  /** What happens, in order, when one `value | pipeName:arg` expression is checked. */
  protected readonly transformSteps: FlowStep[] = [
    { label: 'Template evaluates the value', detail: '`num()` runs → `1234.5`' },
    {
      label: '`transform()` is called',
      detail: 'the value first, then every `:arg`, in order',
      tone: 'accent',
    },
    {
      label: 'Pure (the default): compare first',
      detail:
        'Same reference or primitive as last time? Skip the call, hand back the cached result',
    },
    {
      label: "Impure (`pure: false`): don't bother comparing",
      detail: 'Runs on every single pass that reaches it, no matter what',
      tone: 'warn',
    },
    {
      label: 'DOM updated',
      detail: 'Only if the new formatted value actually differs from what is painted',
      tone: 'good',
    },
  ];

  /**
   * Sample: the entire shape of a pipe — a class, a decorator, one method.
   * Deliberately not `UpperCasePipe` itself; a made-up pipe keeps the reader
   * from wondering whether some detail is special-cased for a built-in.
   */
  protected readonly pipeShapeSample = `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shout',        // this is what appears after the |
  pure: true,            // the default — can be left out entirely
})
export class ShoutPipe implements PipeTransform {
  transform(value: string, times: number = 1): string {
    return value.toUpperCase() + '!'.repeat(times);
  }
}

// <p>{{ 'ready' | shout:3 }}</p>  →  READY!!!`;

  /** Line-by-line walkthrough of {@link pipeShapeSample}. */
  protected readonly pipeShapeNotes: CodeNote[] = [
    {
      line: 1,
      text: '`Pipe` is the decorator; `PipeTransform` is a TypeScript interface that types `transform()` for you. Implementing it is optional, but it is what catches a wrong parameter type at compile time instead of at runtime.',
    },
    {
      line: 3,
      text: '`@Pipe(…)` is the entire registration step. There is no separate place a pipe gets "wired up" — the decorator is what turns a plain class into something the template compiler recognises.',
    },
    {
      line: 4,
      text: '`name` is the literal string that appears after `|` in a template. Rename it here and every `| shout` in every template breaks, with a compile-time error naming the missing pipe.',
    },
    {
      line: 5,
      text: "`pure: true` is the default, so writing it is optional — shown only so you can see the knob exists. It decides whether Angular bothers calling `transform()` again on the next pass, and it's the entire subject of a section further down this page.",
    },
    {
      line: 7,
      text: '`implements PipeTransform` is a compile-time contract only. Angular does not check for it at runtime — a class with a `transform()` method and an `@Pipe` decorator works identically with or without it.',
    },
    {
      line: 8,
      text: "`value` is always whatever sits to the left of `|` — here, `'ready'`. Every argument after a `:` in the template becomes a positional parameter after it, in the order written, so `shout:3` fills `times` with `3`.",
    },
    {
      line: 9,
      text: 'The entire job of a pipe, in one line: read `value`, compute something, `return` a brand-new one. Nothing is mutated — the string handed in is never touched, only read.',
    },
    {
      line: 13,
      text: "The calling convention, both ends. `'ready'` becomes `value`, `3` becomes `times`, and whatever comes back is what the template shows — no different from calling `shout('ready', 3)` as an ordinary function, because that is essentially what happens.",
    },
  ];

  /**
   * Sample: a simplified but accurate shape of `AsyncPipe` — enough to show
   * the reference check, the notify call and the teardown, without the extra
   * Promise-vs-Observable strategy dispatch the real implementation adds.
   */
  protected readonly asyncPipeShapeSample = `@Pipe({ name: 'async', pure: false })
export class AsyncPipe implements OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private value: unknown = null;
  private source: unknown = null;
  private sub?: { unsubscribe(): void };

  transform(source: Observable<unknown> | Promise<unknown> | null) {
    if (source !== this.source) {
      this.sub?.unsubscribe();      // drop the old subscription first
      this.source = source;
      this.sub = this.watch(source);
    }
    return this.value;               // always returns synchronously
  }

  private watch(source: unknown) {
    // ...calls source.subscribe(v => { this.value = v; this.ref.markForCheck(); })
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}`;

  /** Line-by-line walkthrough of {@link asyncPipeShapeSample}. */
  protected readonly asyncPipeShapeNotes: CodeNote[] = [
    {
      line: 1,
      text: '`pure: false` — the single line separating `async` from every text or number pipe on this page. It means: never trust a cached result, run `transform()` on every pass that reaches it.',
    },
    {
      line: 3,
      text: '`inject(ChangeDetectorRef)` gets this pipe its own handle to the view it renders into — the same object a component gets from injecting `ChangeDetectorRef` itself. This is how the pipe will notify Angular later, entirely on its own.',
    },
    {
      line: 6,
      text: 'The live subscription, kept so it can be torn down later. The real implementation picks between a Promise strategy and an Observable strategy depending on what was passed in; this version keeps the shape and drops that split.',
    },
    {
      line: 8,
      text: '`source` accepts an `Observable`, a `Promise`, or `null` — nothing else. Pass an array or a plain object and it throws.',
    },
    {
      line: 9,
      text: 'The reference check that makes calling `transform()` every pass safe: a **new** source (by reference) triggers a fresh subscription; the same one, checked again next pass, does not.',
    },
    {
      line: 10,
      text: 'Unsubscribing the OLD source before attaching the new one — miss this line and switching sources leaks the previous subscription forever.',
    },
    {
      line: 12,
      text: 'Subscribing is a side effect, not a return value — `watch()` starts listening and hands back a handle to stop later. `transform()` never waits for it.',
    },
    {
      line: 14,
      text: '`transform()` always returns immediately and synchronously with whatever is cached — `null` until the first value has actually arrived. That `null` is what your template has to be built to tolerate.',
    },
    {
      line: 18,
      text: 'The line doing the real work, elided for space: on every emission it stores the new value **and** calls `this.ref.markForCheck()`. That single call is the entire reason `async` works under `OnPush` — nothing else in this file is Angular-specific.',
    },
    {
      line: 22,
      text: "`ngOnDestroy()` unsubscribes. Angular calls this automatically when the pipe's host view is destroyed — an `@if` closing, a component being routed away from — which is the whole trick behind `async` needing no manual cleanup.",
    },
  ];

  /**
   * Sample: the exact branch Angular's internal date parser takes for a bare
   * `'YYYY-MM-DD'` string, next to what the JavaScript engine itself does
   * with the same characters.
   */
  protected readonly dateParseSample = `// What Angular's date pipe does with the value you hand it:
toDate('2024-03-15')                 // matches YYYY-MM-DD only
  → new Date(2024, 2, 15, 0, 0, 0)   // built with setFullYear/setHours — LOCAL time

// What the JavaScript engine does with the exact same string:
new Date('2024-03-15')               // ECMA-262 date-only form
  → 2024-03-15T00:00:00.000Z         // always UTC, per the spec

// Two different instants, from one string that looked unambiguous.`;

  /** Line-by-line walkthrough of {@link dateParseSample}. */
  protected readonly dateParseNotes: CodeNote[] = [
    {
      line: 2,
      text: "This is the exact branch Angular's internal `toDate()` takes for a bare `'YYYY-MM-DD'` string — before any formatting happens, the string has to become a `Date` object first, and this is how.",
    },
    {
      line: 3,
      text: "`setFullYear`/`setHours` run in the browser's **local** time zone. There is no `UTC` anywhere in this call — three missing characters are the entire bug.",
    },
    {
      line: 6,
      text: 'Handing the identical string straight to `Date` — the constructor itself, not Angular — takes a completely different, spec-defined path.',
    },
    {
      line: 7,
      text: 'A date-**only** ISO string (no time part) is defined by ECMA-262 to always parse as UTC midnight. A date-**time** string with no explicit zone parses as local instead — the rule flips depending on whether a time is present, which is its own separate trap.',
    },
    {
      line: 9,
      text: "Same characters in, two different moments out, purely because of which parser touched the string first — Angular's own, when it is the `date` pipe's argument, or the engine's, if you called `new Date(...)` yourself before handing it over.",
    },
  ];

  /** Sample for the ternary/pipe-precedence trap, posed before the section names it. */
  protected readonly ternarySample = `// ok is true
{{ ok ? 'yes' : 'no' | uppercase }}`;

  /** A `Date` created the JS-native way, for the live parse comparison below. */
  protected readonly nativeParsedDate = new Date('2024-03-15');

  /**
   * The two parties in one `async` binding's first render, staged as
   * dialogue rather than described in a paragraph — chosen because it is the
   * exact relationship learners get backwards, assuming the pipe blocks
   * rendering until a value exists rather than handing back `null` and
   * catching up later on its own.
   */
  protected readonly asyncTalk: BubbleTurn[] = [
    { who: 'Template', says: 'I need `orders$ | async` for this binding. What have you got?' },
    {
      who: 'AsyncPipe',
      says: "Nothing yet — I only just subscribed. Take `null` for now; I'll tell you the moment something arrives.",
    },
    {
      who: 'Template',
      says: "Understood — rendering `null` this pass. I won't ask again; I'll wait for you.",
    },
    {
      who: 'AsyncPipe',
      says: "A value just came in. I've stored it, and I'm calling `markForCheck()` on your behalf — you never had to ask.",
    },
    {
      who: 'Template',
      says: 'Good, because scheduling that pass myself was never something I could have known to do.',
    },
  ];

  /**
   * The self-test on purity.
   *
   * Every option targets a distinct, real way to misjudge this scenario —
   * confusing "impure" with "self-scheduling", confusing it with "always
   * pure", and confusing the *moment* a mutation becomes visible with the
   * moment it happened. This is precisely the nuance the old version of this
   * page got backwards.
   */
  protected readonly purityQuizOptions: QuizOption[] = [
    {
      text: 'Nothing — json is a display pipe, and display pipes are always pure.',
      why: "Four built-ins are impure by design: `async`, `json`, `keyvalue` and `slice`. `json` is one of them precisely because its job is to show you what's inside an object right now, mutations included — a memoized JSON pipe would be a debugging tool that lies to you.",
    },
    {
      text: "The new tag appears the moment you click 'mutate' — before the no-op click.",
      why: "Mutating in place never schedules anything, impure pipe or not — a signal write is what notifies the scheduler, and `sample().tags.push(...)` isn't one. Nothing renders until **something else** forces a pass.",
    },
    {
      text: 'The new tag appears only after the no-op click, because that click is what finally causes a pass to reach this binding.',
      correct: true,
      why: 'Exactly right, and for the right two-part reason: the mutation itself schedules nothing, but a click on **any** listener does — every template event marks its view and notifies the scheduler regardless of what the handler does. Once that pass reaches the binding, `json` being impure means it re-stringifies unconditionally, mutation and all.',
    },
    {
      text: 'Nothing ever appears — mutating an array inside a signal is permanently invisible, no matter what else happens.',
      why: 'That would be true for a **pure** pipe reading the same data, because a pure pipe compares the reference and the reference never changed. `json` skips that comparison entirely — impurity is specifically the escape hatch from "permanently invisible".',
    },
  ];

  /** The self-test on `async` and subscriptions. */
  protected readonly asyncQuizOptions: QuizOption[] = [
    {
      text: 'Once — Angular recognises the two expressions are identical and reuses the result.',
      why: 'Template expressions aren\'t deduplicated. `AsyncPipe` caches per **pipe instance**, and each `| async` you write creates its own instance — Angular has no notion of "this expression looks like that one".',
    },
    {
      text: 'Four — three from the independent bindings, one from the `as` block.',
      correct: true,
      why: 'Each of the three separate `| async` usages subscribes on its own — three runs. The `@if (… ; as v)` block evaluates `| async` exactly once and reuses the captured `v` for every `{{ v }}` after it — one more run. Four subscriptions in total for what reads like two lines.',
    },
    {
      text: 'Six — every `{{ v }}` inside the `as` block triggers its own subscription too.',
      why: '`as v` captures the **value**, not the pipe. Every later `{{ v }}` is a plain interpolation with no `async` involved at all — reusing `v` is exactly what avoids the extra subscriptions.',
    },
    {
      text: 'Zero after the very first subscriber — a cold observable only has one run in it, period.',
      why: '"Cold" means the opposite: the producer function runs **fresh for every subscriber**, with nothing shared between them. A source that only ran once regardless of subscriber count would be "hot" or multicast — a different thing, covered in the RxJS lessons.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "If `async` is impure, doesn't putting it in three places on one page slow things down?",
      a: "Angular really does call `transform()` on every pass — that's what impure means. But look back at the `AsyncPipe` shape above: the body of that call is cheap, just `source !== this.source` (should it resubscribe?) and `return this.value` (hand back what's cached) — trivial, whether it runs once or a thousand times. The real cost, if there is one, is in what the **source** does on each subscribe: three bindings on a cold HTTP-backed observable really are three network requests. That's a reason to reach for `as` (or a `resource()`/signal you read once), not evidence that impure pipes themselves are slow.",
    },
    {
      q: 'Does `OnPush` stop `async` from updating the screen?',
      a: 'No — and this is the one built-in pipe engineered specifically to survive it. `AsyncPipe` holds its own `ChangeDetectorRef` and calls `markForCheck()` itself the moment a new value arrives, which is the exact API an `OnPush` component would call by hand. It participates in the same notify system a signal write does.',
    },
    {
      q: "Why does `keyvalue` come out in a different order than I typed the object's keys?",
      a: "Its default comparator sorts alphabetically by key — insertion order isn't preserved unless you ask. Pass your own compare function (the demo above uses a no-op one, `() => 0`) to keep whatever order the object already has.",
    },
    {
      q: 'I bound `date` with a locale I never registered, and nothing broke — so is locale data actually required?',
      a: "It only throws when you explicitly ask for a locale Angular hasn't loaded — `NG0701: Missing locale data for the locale \"…\"`. `LOCALE_ID` defaults to `'en-US'`, which ships built in, so a page that never changes it or passes an explicit locale argument never hits the missing-data path at all.",
    },
    {
      q: 'Can I use a pipe outside of a template — from a service, say?',
      a: "Yes — a pipe is an ordinary injectable class. Add it to a component's `providers`, `inject()` it, and call `.transform(...)` by hand, exactly like the live demo higher up this page does with `DatePipe`. That is, in fact, close to what the compiled template does on your behalf.",
    },
    {
      q: 'Where should filtering or sorting a list actually live — a pipe, or the component?',
      a: 'The component, as a `computed()` — see the signals lesson for why a derived value belongs there. A filtering pipe has to be impure to see array mutations, and an impure pipe re-runs on every single pass, mutated or not. `computed()` gets you the caching a pure pipe has and the reactivity an impure one needs, without the cost of either failure mode. The custom-pipes lesson has the full pure/impure decision table.',
    },
  ];
}
