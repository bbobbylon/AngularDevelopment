import { Component, computed, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Signals Basics — Angular's reactive primitive, and the flagship
 * beginner page of the app.
 *
 * Covers the three pieces and how they differ: `signal()` holds writable state,
 * `computed()` derives from it lazily and caches, and `effect()` runs a side
 * effect when its dependencies change. Then it goes past the API into the
 * mechanism a beginner needs in order to stop being surprised — laziness,
 * memoisation, dynamically tracked dependencies, the glitch-free guarantee,
 * `Object.is` equality and the mutation trap that falls out of it.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem first.** The page opens on "you changed the number —
 *    who told the screen?" and makes the reader commit to a guess on a napkin
 *    before any API appears.
 * 2. **Analogy before vocabulary.** The spreadsheet frame arrives before the
 *    words *signal*, *computed* and *effect* have to carry any weight, so those
 *    words land on something the reader already owns.
 * 3. **Then the same idea in several modes** — a taped row of the three
 *    primitives, annotated snippets, a dialogue between a template and a
 *    `computed`, a containment diagram of the read path, a hand-drawn diamond
 *    for glitch-freedom, and four live demos.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Demos on this page
 *
 * - the counter (`count`, `doubled`, `parity`) — the original demo, kept;
 * - the effect log — the original demo, kept;
 * - **laziness and caching**: a `computed` with a visible run counter that only
 *   moves when something actually reads it. This is the demo that turns "pull,
 *   not push" from a claim into a number;
 * - **mutate vs replace**: an array signal you can push into (invisible) or
 *   replace (announced), with a no-op button that proves the pushed items were
 *   there all along and simply never announced.
 *
 * @see lessons/intermediate/signals-advanced — `linkedSignal`, `untracked`,
 * custom `equal` and effect cleanup in depth.
 */
@Component({
  selector: 'app-lesson-signals',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './signals.html',
  styleUrl: './signals.css',
})
export class Signals {
  // ── Demo 1: the counter ────────────────────────────────────────────────────

  /** The counter — the one piece of writable state on the page. */
  protected readonly count = signal(0);

  /**
   * Twice the count. Derived, not stored: a second signal kept in sync by hand
   * is exactly the bug `computed` removes.
   */
  protected readonly doubled = computed(() => this.count() * 2);

  /**
   * Whether the count is even or odd. A second derivation off the same source,
   * so the reader sees one signal feeding many consumers.
   */
  protected readonly parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));

  // ── Demo 2: the effect log ─────────────────────────────────────────────────

  /** Lines recorded by the effect, so its firing is visible rather than implied. */
  protected readonly effectLog = signal<string[]>([]);

  // ── Demo 3: laziness and caching ───────────────────────────────────────────

  /**
   * Run counter for {@link lazyDerived}, incremented from inside the computed's
   * body.
   *
   * That is deliberately impure, and it is the only honest way to *show* that a
   * `computed` body did not run: purity is the rule for application code, and
   * this is an instrument bolted to the thing being measured. A plain field
   * rather than a signal on purpose — writing a signal inside a computed is the
   * one thing Angular actually forbids.
   */
  private lazyRuns = 0;

  /** The source the reader can change without anything reading the result. */
  protected readonly lazySource = signal(1);

  /** The derivation whose body only executes when somebody pulls on it. */
  protected readonly lazyDerived = computed(() => {
    this.lazyRuns += 1;
    return this.lazySource() * 10;
  });

  /**
   * The last value anybody actually asked for.
   *
   * Held in its own signal rather than read straight from the template: if the
   * template read `lazyDerived()` the demo would destroy the very thing it is
   * demonstrating, because a template binding is a consumer like any other.
   */
  protected readonly lazyReadout = signal('nobody has asked yet');

  /** The run count as of the last pull, so the number on screen is a pull result. */
  protected readonly lazyRunsSeen = signal(0);

  // ── Demo 4: mutate vs replace ──────────────────────────────────────────────

  /** An array signal, for the mutation trap. */
  protected readonly items = signal<string[]>(['alpha', 'beta']);

  /** Names the added entries so mutated and replaced additions are told apart. */
  private nextItem = 0;

  // ── Demo behaviour ─────────────────────────────────────────────────────────

  /** Bumps the lazy demo's source. Marks the computed stale; runs nothing. */
  protected bumpLazySource(): void {
    this.lazySource.update((n) => n + 1);
  }

  /**
   * Reads the computed once — the pull.
   *
   * Two writes, in this order on purpose: the value first, then the run count,
   * so the number on screen is the count *after* the body had its chance.
   */
  protected peekLazy(): void {
    this.lazyReadout.set(String(this.lazyDerived()));
    this.lazyRunsSeen.set(this.lazyRuns);
  }

  /** Puts the laziness demo back to its starting state. */
  protected resetLazy(): void {
    this.lazySource.set(1);
    this.lazyRuns = 0;
    this.lazyReadout.set('nobody has asked yet');
    this.lazyRunsSeen.set(0);
  }

  /**
   * Pushes into the array the signal already holds.
   *
   * The array genuinely grows. The signal's value — the array *reference* — does
   * not, so nothing is notified and nothing re-renders.
   */
  protected mutateItems(): void {
    this.nextItem += 1;
    this.items().push(`ghost ${this.nextItem}`);
  }

  /** Replaces the array with a new one. A new reference, so everyone is told. */
  protected replaceItems(): void {
    this.nextItem += 1;
    this.items.update((list) => [...list, `seen ${this.nextItem}`]);
  }

  /**
   * Does nothing, deliberately.
   *
   * Clicking it still causes a render: Angular's template listeners mark the
   * view before your handler runs. The pushed items then appear all at once —
   * they were never lost, only never announced.
   */
  protected nudge(): void {}

  /** Puts the mutation demo back to its starting state. */
  protected resetItems(): void {
    this.items.set(['alpha', 'beta']);
    this.nextItem = 0;
  }

  /**
   * Registers the demo effect.
   *
   * In an injection context, so it is torn down with the component — an effect
   * created outside one has to be disposed by hand, and forgetting is a leak.
   */
  constructor() {
    // Demonstrates effect(): reacts to count changes and records them.
    effect(() => {
      const value = this.count();
      this.effectLog.update((log) => [`count changed to ${value}`, ...log].slice(0, 8));
    });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The reactivity path a beginner walks, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Components', id: 'components' },
    { label: 'Interpolation', id: 'interpolation' },
    { label: 'Signals' },
    { label: 'Signals Advanced', id: 'signals-advanced' },
    { label: 'Change Detection', id: 'change-detection' },
  ];

  /**
   * Sample: the mutation trap, posed by `app-predict` before the traps table
   * names it. Deliberately the shortest snippet on the page — the bug has to be
   * visible in one glance for the prediction to be worth making.
   */
  protected readonly mutationSample = `items = signal(['a', 'b']);

addItem() {
  this.items().push('c');   // read the array, then push into it
}`;

  /** Sample: a plain variable next to a signal, in four lines. */
  protected readonly plainVsSignalSample = `let count = 0;             // a plain variable: a silent box
count = 5;                 // it really is 5 now — and nothing in the world knows

const total = signal(0);   // a signal: a box with a mailing list
total.set(5);              // every reader of total() is told, and re-runs`;

  /** Sample: the whole writable-signal API, one line per idea. */
  protected readonly signalApiSample = `import { signal } from '@angular/core';

const count = signal(0);      // create — 0 is the value it starts holding

count();                      // READ  -> 0
count.set(5);                 // WRITE a brand-new value -> 5
count.update((n) => n + 1);   // WRITE from the old value -> 6

const readOnlyCount = count.asReadonly();

const user = signal(loadUser(), {
  equal: (a, b) => a.id === b.id,
});`;

  /** Line-by-line walkthrough of {@link signalApiSample}. */
  protected readonly signalApiNotes: CodeNote[] = [
    {
      line: 1,
      text: '`signal` is an ordinary function exported from `@angular/core` — not a decorator, not a base class, nothing to register. Importing it is the entire setup.',
    },
    {
      line: 3,
      text: '`signal(0)` hands back **a function with methods bolted onto it**. `count` is that function; `0` is the value it starts holding. Nothing is watching anything yet — a signal with no readers is just a box.',
    },
    {
      line: 5,
      text: 'Reading is a **call**, and the parentheses are load-bearing. `count` without them is the function object itself, which is why `{{ count }}` in a template prints something that starts with `function` instead of a number.',
    },
    {
      line: 6,
      text: '`.set(v)` replaces the value outright and notifies every consumer that read it. Reach for it when the new value has nothing to do with the old one — a fetched response, a reset, a user selection.',
    },
    {
      line: 7,
      text: '`.update(fn)` calls your function with the current value — that is what `n` is — and stores whatever you return. Same notification as `set`; the difference is that the read and the write are one expression, so nothing can wander in between them.',
    },
    {
      line: 9,
      text: '`.asReadonly()` returns **the same signal** with `set` and `update` hidden from the type. Nothing is copied and nothing is watched twice. This is how a service publishes state: readers get the value, only the service can change it.',
    },
    {
      line: 11,
      text: 'The second argument is an options object. Leave it out and a signal answers "did this change?" with `Object.is` — value equality for numbers and strings, **reference** equality for objects and arrays.',
    },
    {
      line: 12,
      text: '`equal` is your own answer to that question. Return `true` and the write is **swallowed**: the new value is stored, but nobody is notified. Here two user objects with the same `id` count as unchanged, so a re-fetch that returns identical data re-renders nothing.',
    },
  ];

  /** Sample: `computed`, including a dependency that only exists on some runs. */
  protected readonly derivedSample = `readonly count = signal(0);
readonly showTax = signal(false);
readonly taxRate = signal(0.2);

readonly doubled = computed(() => this.count() * 2);

readonly total = computed(() => {
  const base = this.count() * 10;
  if (!this.showTax()) return base;   // taxRate is never reached on this run
  return base * (1 + this.taxRate());
});`;

  /** Line-by-line walkthrough of {@link derivedSample}. */
  protected readonly derivedNotes: CodeNote[] = [
    {
      line: 5,
      text: '`computed(fn)` returns a **read-only** signal: it has `()` but no `set` and no `update`. You never assign to `doubled` — you change `count`, and `doubled` follows.',
    },
    {
      line: 7,
      text: 'Nothing runs on this line. Creating a `computed` stores the function; the body has not executed even once, and will not until somebody calls `total()`.',
    },
    {
      line: 8,
      text: 'The call to `this.count()` inside the body is what creates the dependency. **Reading is subscribing** — there is no dependency array to declare and no way to get it out of sync with the code, because it *is* the code.',
    },
    {
      line: 9,
      text: 'The early `return` is the line worth staring at. While `showTax()` is `false`, `taxRate()` is never reached, so on this run `total` has **no dependency on it at all**. Writing `taxRate.set(0.5)` right now marks nothing dirty and re-renders nothing.',
    },
    {
      line: 10,
      text: 'Flip `showTax` to `true`, the body takes this branch, reads `taxRate()`, and the edge appears. Dependencies are **rebuilt from scratch on every run** — that is what "dynamically tracked" means, and it is why an untaken `if` branch can never leave a stale subscription behind.',
    },
  ];

  /** Sample: `effect`, its cleanup callback, and the ownership rule. */
  protected readonly effectSample = `constructor() {
  effect((onCleanup) => {
    const id = this.userId();          // tracked — this read IS the subscription
    const socket = openSocket(id);
    onCleanup(() => socket.close());   // before the NEXT run, and on destroy
  });
}

// Outside an injection context you have to name the owner yourself:
const ref = effect(() => log(this.count()), { injector: this.injector });
ref.destroy();`;

  /** Line-by-line walkthrough of {@link effectSample}. */
  protected readonly effectNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A constructor is an **injection context** — Angular knows which component is currently being built, so it can tie the effect’s lifetime to it. Create the effect here (or in a field initialiser) and it is destroyed with the component for free.',
    },
    {
      line: 2,
      text: '`effect(fn)` schedules `fn` to run once shortly, then again whenever a signal it read changes. `onCleanup` is a function Angular passes **into** your callback — you do not import it and you do not have to accept it.',
    },
    {
      line: 3,
      text: '`this.userId()` is an ordinary signal read, and inside an effect body it is tracked exactly as it would be inside a `computed`. There is no `subscribe` anywhere: this one call is the whole subscription.',
    },
    {
      line: 5,
      text: 'You hand `onCleanup` a teardown function. Angular calls it **before the next run** and once more on destroy, so run 3’s socket is closed before run 4 opens another. Leave this out and every change leaks a live connection.',
    },
    {
      line: 9,
      text: 'Constructors and field initialisers are injection contexts. A click handler, a `setTimeout` callback and `ngOnInit` are **not** — create an effect in one of those and Angular throws NG0203 rather than quietly building something nothing will ever destroy.',
    },
    {
      line: 10,
      text: '`{ injector: … }` names the owner explicitly. `this.injector` is what you get from `inject(Injector)` back when you **were** in a context; the effect now dies with that injector. This is the escape hatch, not the habit.',
    },
    {
      line: 11,
      text: '`effect()` returns an `EffectRef`, and `destroy()` stops it early. Worth knowing it exists; needing it usually means the effect was created in the wrong place.',
    },
  ];

  /** Sample: the diamond that would glitch in a naive reactive system. */
  protected readonly glitchSample = `readonly first = signal('Ada');
readonly last = signal('Lovelace');
readonly full = computed(() => this.first() + ' ' + this.last());

effect(() => console.log(this.first(), this.full()));

this.first.set('Grace');`;

  /** Line-by-line walkthrough of {@link glitchSample}. */
  protected readonly glitchNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Two independent source signals. Nothing links them to each other yet — the link is made below, by something reading both.',
    },
    {
      line: 3,
      text: '`full` reads both sources, so the graph is now a **diamond**: `first` feeds `full`, and (on the next line) `first` also feeds the effect directly. One source, two paths, one reader.',
    },
    {
      line: 5,
      text: 'The effect reads the raw source **and** the derived value. This is the shape where a naive push-based system glitches: it would fire once for `first` changing, printing the new `Grace` next to the stale `Ada Lovelace`, then fire again with the pair fixed.',
    },
    {
      line: 7,
      text: 'One write. Signals mark the entire affected graph stale *before* letting anything recompute, so the effect runs **exactly once** and everything it reads is from the same instant. The inconsistent pair is never observable — not even for a microtask.',
    },
  ];

  /** Sample: the wrong way to derive — an effect writing into a second signal. */
  protected readonly effectDeriveSample = `readonly price = signal(10);
readonly qty = signal(2);
readonly total = signal(0);   // a second copy of the truth

constructor() {
  effect(() => {
    this.total.set(this.price() * this.qty());
  });
}`;

  /** Sample: the same derivation done properly. */
  protected readonly computedDeriveSample = `readonly price = signal(10);
readonly qty = signal(2);
readonly total = computed(() => this.price() * this.qty());`;

  /**
   * The template and a `computed` negotiating a read.
   *
   * Deliberately *not* the "I read you" / "I noted you" exchange between a
   * signal and a template — the change-detection lesson already stages that, and
   * two pages running the same dialogue teach the reader that the device is
   * wallpaper. This one stages the **pull**: who asks, what the cache checks,
   * and why an answer can arrive without the formula running.
   */
  protected readonly pullTalk: BubbleTurn[] = [
    {
      who: 'Template',
      says: 'I need `doubled()` for this binding. What have you got?',
    },
    {
      who: 'doubled',
      says: 'I already have `8` from last time. Give me a second — I need to check whether anything I read has moved since.',
    },
    {
      who: 'Template',
      says: "Check? I assumed you'd just recompute. You were marked dirty.",
    },
    {
      who: 'doubled',
      says: 'Dirty only means **maybe** stale. I ask `count` for its version number. Same number as last time, and you get the cached `8` — my body never runs.',
    },
    {
      who: 'Template',
      says: 'And when the number has moved?',
    },
    {
      who: 'doubled',
      says: "Then I run the formula, and compare my new result with the old one. If they're equal by `Object.is`, I don't even wake my own readers. The ripple stops here.",
    },
  ];

  /** What actually happens when you write to a signal. */
  protected readonly propagation: FlowStep[] = [
    { label: '`set()`', detail: 'The value changes and the version counter ticks' },
    {
      label: 'Mark dirty',
      detail: 'Every consumer that read it is flagged',
      tone: 'accent',
    },
    {
      label: 'Nothing runs',
      detail: 'Marking is not running — this is the surprising part',
      tone: 'warn',
    },
    { label: 'Something reads', detail: 'A template or `computed` asks for the value' },
    { label: 'Recompute', detail: 'Only then does the formula re-run', tone: 'good' },
  ];

  /**
   * Self-test 1 — laziness and memoisation.
   *
   * The distractors are the three ways a beginner mis-imagines the machinery:
   * that a write pushes work, that `computed` shares `effect`'s
   * run-once-on-creation lifecycle, and that "lazy" means "never".
   */
  protected readonly lazyOptions: QuizOption[] = [
    {
      text: 'Three times — once for each `set()`.',
      why: 'That is the **push** model, and it is precisely what signals do not do. A `set()` bumps a version number and flags its consumers; it never runs them. Flagging costs the same whether the formula is one multiplication or a thousand-row sort, which is the entire reason this design was chosen.',
    },
    {
      text: 'Once — on the read at the end.',
      correct: true,
      why: 'Lazy **and** memoised. The three writes only invalidate; the single read is what pulls, and it pulls once, seeing `3`. Read `derived()` again without touching `source` and the body does not run at all — you get the cached number back.',
    },
    {
      text: 'Four times — once when it was created, then once per `set()`.',
      why: "That is `effect`'s lifecycle you are remembering, not `computed`'s. An **effect** runs once on creation because its whole job is to *do* something. A **computed** runs zero times on creation: its body is stored, not called, until somebody wants the answer.",
    },
    {
      text: 'Never — nothing on screen reads it, so it never runs.',
      why: 'True right up until the last line of the question. A pull is a pull from anywhere — a template, another `computed`, or a plain function in a click handler. "Nobody reads it" would have to stay true **forever** for the count to stay at zero.',
    },
  ];

  /** Self-test 2 — effect scheduling and batching. */
  protected readonly batchOptions: QuizOption[] = [
    {
      text: 'Three times — once per `set()`',
      why: 'Signal writes are synchronous, but effects are not. Running an effect once per write would mean it sees intermediate states that never appeared on screen — and it would make a loop of ten `set()` calls cost ten runs of whatever the effect does.',
    },
    {
      text: 'Once, with the final value',
      correct: true,
      why: 'Effects are **scheduled**, not immediate. Angular batches them into the next change-detection pass, so all three writes collapse into a single run that sees `3`. This is the same coalescing that stops five signal writes from causing five renders.',
    },
    {
      text: 'Twice — once on creation and once at the end',
      why: 'Half right, and the half that is right is about a different moment. An effect does run once on creation — but that already happened, before this function was called. **Within** one synchronous block afterwards, three writes produce one run.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why do I call a signal like a function? It looks odd.',
      a: 'Because the call **is** the tracking mechanism. When `count()` runs inside a template or a `computed`, the signal records who is asking, and that record is what lets it notify exactly the right consumers later. A plain property read would be invisible to it — there is no hook in JavaScript that fires when you read `obj.count`.',
    },
    {
      q: 'What is the actual difference between `computed` and `effect`? Both react to changes.',
      a: 'A `computed` **returns a value** and must be pure; an `effect` returns nothing and exists for the impure work. If you are writing `effect(() => this.total.set(...))`, you wanted a `computed`. The rule: deriving is `computed`, doing is `effect`.',
    },
    {
      q: 'Are signals the same as RxJS `BehaviorSubject`?',
      a: 'They overlap but solve different problems. A signal always has a value, is read synchronously, and tracks its own dependencies. An Observable is a stream over time with operators for combining, debouncing and cancelling. Use signals for state, RxJS for events and async pipelines — and `toSignal` / `toObservable` to cross between them.',
    },
    {
      q: 'Do I have to use `update()`, or can I read and then `set()`?',
      a: '`count.set(count() + 1)` works and is not wrong. `update()` is preferred because it makes the read-then-write one atomic expression, which avoids a class of bug where the read happens further away from the write than you think.',
    },
    {
      q: 'What happens if I create an `effect` outside a constructor?',
      a: 'Angular throws NG0203 unless you are in an injection context or you pass an explicit `injector`. This is deliberate: an effect needs an owner to be destroyed with, and one without an owner runs forever. That is a memory leak the framework would rather stop at creation than let you ship.',
    },
    {
      q: 'Do I have to turn every field in my app into a signal?',
      a: 'No. A field that never changes after construction, or that nothing renders, gains nothing from being a signal. The test is: **does something need to re-run when this changes?** If yes, signal. If it is a config value, an injected service or a constant, leave it alone — wrapping it just adds parentheses.',
    },
    {
      q: 'People keep mentioning `linkedSignal`. Is that a third thing I have to learn now?',
      a: 'Not now. `linkedSignal` is a `computed` you are also allowed to write to — a formula cell you can type over, which then re-derives the next time its source changes. It solves one specific problem (a selection that should reset when the list reloads) and it is much easier to understand once `computed` is second nature. It has its own section in Signals Advanced.',
    },
  ];
}
