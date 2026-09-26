import { Component, computed, linkedSignal, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { BrainPower, NoDumbQuestions, Scribble, Whiteboard } from '../../../shared/shapes';
import type { NdqItem } from '../../../shared/shapes';

/**
 * Lesson: Advanced Signals — the parts beyond `signal` / `computed` / `effect`.
 *
 * Covers `linkedSignal`, `untracked`, equality functions, and how the dependency
 * graph actually works (pull-based, lazily evaluated, glitch-free).
 *
 * Two demos:
 *
 * - **`linkedSignal`**, which is writable state that *resets* when its source
 *   changes. The classic case is a select whose options get replaced: a plain
 *   `signal` keeps the now-invalid selection, a `computed` cannot be written to
 *   at all, and `linkedSignal` is the thing that is both.
 * - **`untracked`**, reading a signal without subscribing to it. The demo makes
 *   the consequence concrete: the `computed` recomputes when `a` changes and not
 *   when `b` does, even though it reads both — which is either exactly what you
 *   wanted or a stale-value bug, depending on whether you meant it.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. This lesson already scored 9/9 on the
 * retention audit before this pass — the analogy, the predicts, the quiz and the
 * FAQ below are carried over rather than reinvented. What changed is how they are
 * presented: every snippet now runs through `app-code-lab` with real line-by-line
 * notes, the ASCII decision tree became a row of `app-tape-card`s (a picture that
 * actually reads as one, rather than monospace art forced into a `<pre>`), and a
 * `app-bubbles` dialogue dramatises the one misconception the quiz exists to
 * correct — that a still-valid option survives a `linkedSignal` reset. It does
 * not; the computation re-derives from a blank slate every time, and the
 * dialogue stages that in the actors' own voices before the quiz asks the reader
 * to commit to it.
 *
 * @see beginner/signals — the spreadsheet analogy this page builds on, and the
 * lesson that first name-drops `linkedSignal` as "a third thing to learn later".
 * @see intermediate/resource-api — the next stop on the Signals track, which
 * uses `linkedSignal` internally to hold `resource()`'s result.
 */
@Component({
  selector: 'app-lesson-signals-advanced',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    BrainPower,
    NoDumbQuestions,
    Scribble,
    Whiteboard,
  ],
  templateUrl: './signals-advanced.html',
  styleUrl: './signals-advanced.css',
})
export class SignalsAdvanced {
  // -- Page-shape block: "There Are No Dumb Questions" --

  /**
   * Escalates from the misconception ("my override survives if it's still a
   * valid option") through where it bites at work, to the fix. Carries the
   * whole explanation on its own, so every answer threads "you"/"your".
   */
  protected readonly resetQuestions: NdqItem[] = [
    {
      q: "I picked 'Blue' by hand, then the options reloaded — and the new list still contains 'Blue'. Doesn't my pick survive?",
      a: "No — and that's the one thing about `linkedSignal` almost everyone assumes wrong. The one-argument form has no memory of what you wrote. The moment its source changes, it just re-runs its computation from scratch, and whether 'Blue' happens to still be in the new list is not a question that computation was ever given a way to ask.",
    },
    {
      q: 'So what actually happens to my typed-over value?',
      a: "It's discarded completely — not degraded, not queued for reapplication. `options()` changes, `selected` re-derives `() => this.options()[0]` as if your click never happened, and reading `selected()` a moment later returns whatever that fresh computation says.",
    },
    {
      q: "Isn't that a bug — shouldn't it check first?",
      a: "It's the documented behaviour, on purpose: a select whose backing data just changed genuinely might not have your old pick as a sensible option anymore (a deleted row, a different currency). Resetting eagerly is the **safe default**. The two-argument `prev` form, further down this page, is what you reach for when you want the *other* behaviour.",
    },
    {
      q: 'Where does this actually bite, at work?',
      a: "A filters dropdown bound to a `linkedSignal`, backed by category ids from an API. You pick 'Electronics', a background refresh brings back a list where 'Electronics' is *still* the second entry, same id, same label — doesn't matter. The one-argument form re-derives 'first item' regardless, and your selection silently reverts mid-session, with no error and no warning that anything happened at all.",
    },
    {
      q: "What's the fix, if I actually want the selection to survive when it's still valid?",
      a: 'The two-argument object form. Its `computation` receives `prev` — the previous `{ source, value }` pair — so it can explicitly check whether the old pick is still in the new list and keep it if so. The shorthand was never handed that information to check with; the object form is.',
    },
    {
      q: 'How is this different from a plain `computed()`?',
      a: '`computed()` can\'t be typed over at all — no setter, so "the user picked something else" isn\'t representable. `linkedSignal` is writable like a plain `signal` *and* resets like a `computed` — which is exactly why the reset surprises people who mentally filed it under "a writable computed" and stopped there.',
    },
  ];

  /**
   * What a write actually does, including the step most mental models skip: the
   * equality check happens *after* recomputation, and a value that compares equal
   * stops the ripple there rather than passing it on.
   */
  protected readonly propagation: FlowStep[] = [
    { label: 'You call `set()`', detail: 'The value lands and the version counter ticks' },
    { label: 'Dependents marked dirty', detail: 'Marked, not run — nothing is recomputed yet' },
    {
      label: 'Something reads',
      detail: 'A template or `computed` finally asks for the value',
      tone: 'accent',
    },
    { label: 'Formula re-runs', detail: 'Only now, and only for the consumers that read' },
    {
      label: '`equal(old, new)`?',
      detail: 'Equal → the ripple stops here and nobody downstream is told',
      tone: 'warn',
    },
    {
      label: 'Different → notify',
      detail: 'The next layer is marked dirty and it repeats',
      tone: 'good',
    },
  ];

  /**
   * Sample: the basic `linkedSignal` shorthand — writable state derived from a
   * source, in as few lines as the API allows.
   */
  protected readonly linkedBasicSample = `options = signal(['Red', 'Green', 'Blue']);

// defaults to the first option, but stays user-writable:
selected = linkedSignal(() => this.options()[0]);`;

  /** Line-by-line walkthrough of {@link linkedBasicSample}. */
  protected readonly linkedBasicNotes: CodeNote[] = [
    {
      line: 1,
      text: '`options` is an ordinary writable `signal` — nothing on this line says anything is derived. It could be replaced with a brand-new array at any time, from anywhere.',
    },
    {
      line: 4,
      text: '`linkedSignal(fn)` looks exactly like `computed(fn)` — same shape, same laziness, the same dependency on `this.options()` discovered by reading it. The difference is invisible right here and everywhere in the demo below: the value this hands back is **writable**, the same way a plain `signal` is.',
    },
  ];

  /** Choices for the linkedSignal reset check. */
  protected readonly linkedOptions: QuizOption[] = [
    {
      text: "'Blue' — it only resets when the old value disappears",
      why: 'That is the behaviour people expect, and it is what the `source` / `computation` form further down this page gives you. The plain one-argument form has no idea what the previous value was, so it cannot make that comparison at all.',
    },
    {
      text: 'The first option of the new list',
      correct: true,
      why: 'The computation `() => this.options()[0]` re-runs in full whenever `options` changes, and it says "the first one" unconditionally. Whether the old selection is still present never enters into it — nothing in that expression looks.',
    },
    {
      text: "'Blue', but only until the next read of `selected()`",
      why: 'There is no deferred reset in signals. A `linkedSignal` settles synchronously the moment its source changes; reading it later just returns the value it already settled on.',
    },
    {
      text: 'It stays whatever the user last wrote until you call `.set()` again',
      why: 'That would make it an ordinary `signal`. The entire point of `linkedSignal` is that it *does* re-derive from its source — writability is the addition, not a replacement.',
    },
  ];

  /**
   * The reset dramatised as a conversation, one turn per actor. Exists because
   * the misconception the quiz corrects — "it stays 'Blue' because 'Blue' is
   * still in the new list" — is a claim about what `linkedSignal` *checks*, and
   * a dialogue can show that it never asks the question at all far more plainly
   * than a paragraph describing the same absence.
   */
  protected readonly resetTalk: BubbleTurn[] = [
    { who: 'You', says: "`selected.set('Blue')` — I'm overriding the formula by hand." },
    {
      who: 'linkedSignal',
      says: "Noted. I'll show 'Blue' — right up until my source changes, at which point I forget you ever wrote anything.",
    },
    {
      who: 'The source',
      says: "`options.set([...])` — a brand-new array just arrived. It happens to still contain 'Blue'.",
    },
    {
      who: 'linkedSignal',
      says: "Doesn't matter. I don't compare your old pick against the new list — I just re-run my computation from a blank slate.",
    },
    {
      who: 'The computation',
      says: "`() => this.options()[0]` — that's simply 'the first entry of whatever `options` holds right now'. It never asked whether 'Blue' survived, because it was never given a way to ask.",
    },
  ];

  /**
   * Sample: the mechanism behind the staleness trap — two reads inside one
   * `computed`, tracked completely differently.
   */
  protected readonly untrackedMechanismSample = `a = signal(1);
b = signal(100);

// a() is a normal tracked read — every write to a marks sum dirty
// b() is wrapped in untracked() — this read records NO dependency
sum = computed(() => this.a() + untracked(this.b));`;

  /** Line-by-line walkthrough of {@link untrackedMechanismSample}. */
  protected readonly untrackedMechanismNotes: CodeNote[] = [
    {
      line: 1,
      text: '`a` and `b` are declared identically — two ordinary signals. Nothing here hints that one of them is about to be read differently from the other.',
    },
    {
      line: 6,
      text: 'One `computed`, two reads, two outcomes. `this.a()` is a normal tracked read: it registers `sum` as a consumer of `a`, the standard way. `untracked(this.b)` is different — `untracked()` takes a **function** and calls it outside the current reactive context, so no dependency is recorded. `this.b` already *is* a zero-argument function (that is what a signal getter is), which is why you can hand it straight to `untracked()` instead of writing `untracked(() => this.b())`.',
    },
  ];

  /** Sample fed to the ask-before-telling prediction. */
  protected readonly untrackedSample = `a = signal(1);
b = signal(100);

sum = computed(() => this.a() + untracked(this.b));
// sum() is 101

this.b.set(500);

// What does sum() return now?`;

  /**
   * Sample: `effect`'s cleanup callback, the tool for tearing down whatever a
   * previous run set up.
   */
  protected readonly effectCleanupSample = `effect((onCleanup) => {
  const id = setInterval(tick, 1000);
  onCleanup(() => clearInterval(id));   // runs before re-run / on destroy
});`;

  /** Line-by-line walkthrough of {@link effectCleanupSample}. */
  protected readonly effectCleanupNotes: CodeNote[] = [
    {
      line: 1,
      text: "`effect(fn)` — `fn`'s first parameter is `onCleanup`, a function **Angular hands to you**. You never import it or construct it yourself.",
    },
    {
      line: 2,
      text: 'Starts a repeating timer — a side effect in the literal sense, since nothing is returned. This is exactly the kind of work `effect` exists for, and exactly the kind `computed` is forbidden from doing.',
    },
    {
      line: 3,
      text: 'Registering the teardown. Angular calls this callback automatically **right before the effect body runs again**, and once more when the effect itself is destroyed — so a timer started on run 3 is always cleared before run 4 starts a new one.',
    },
  ];

  /** Sample: the default `Object.is` check next to a custom `equal`. */
  protected readonly equalitySample = `// default: Object.is — a new object is "different" even with identical fields
const draft = signal({ id: 1, name: 'Ari' });

// custom: compare by id — an equivalent object is treated as unchanged
const user = signal(initial, { equal: (a, b) => a.id === b.id });`;

  /** Line-by-line walkthrough of {@link equalitySample}. */
  protected readonly equalityNotes: CodeNote[] = [
    {
      line: 2,
      text: 'With no second argument, a signal decides "did this change?" using `Object.is` — reference equality for anything that isn\'t a primitive. Replace `draft` with a brand-new object holding the exact same fields, and every reader is still notified.',
    },
    {
      line: 5,
      text: 'The second argument to `signal()` is an options object. `equal` is your own answer to "did this change?" — it receives the old and new values and, if it returns `true`, the write is stored but **nobody downstream is told**. Two user objects that merely share an `id` now count as identical.',
    },
  ];

  /**
   * Sample: the object form of `linkedSignal`, which hands the computation a
   * memory of what it returned last time.
   */
  protected readonly linkedPrevSample = `selected = linkedSignal({
  source: this.options,
  computation: (options, prev) =>
    options.includes(prev?.value) ? prev!.value : options[0],
});`;

  /** Line-by-line walkthrough of {@link linkedPrevSample}. */
  protected readonly linkedPrevNotes: CodeNote[] = [
    {
      line: 2,
      text: "`source` is the object form's first field — any zero-argument function that supplies the upstream value. A plain `signal` works, and so does a `computed`. Whenever it changes, `computation` runs again, exactly the trigger the one-argument shorthand already uses.",
    },
    {
      line: 3,
      text: '`computation` receives **two** arguments where the shorthand form only ever saw one: the fresh `options`, and `prev` — either `undefined` on the very first run, or an object shaped `{ source, value }` holding what `source` returned and what this function returned, both from last time.',
    },
    {
      line: 4,
      text: '`prev?.value` is what lets this version ask "is the old selection still valid?" — something `() => this.options()[0]` has no way to ask at all, because it was never handed a previous value in the first place.',
    },
  ];

  /**
   * Sample: an effect that reads and writes the same signal — the
   * self-feedback loop this "advanced" tier is really about.
   */
  protected readonly selfFeedbackLoopSample = `value = signal(0);
changeCount = signal(0);

// looks harmless: "count how many times value has changed"
effect(() => {
  this.value();                                   // dependency #1: value
  this.changeCount.set(this.changeCount() + 1);   // reads changeCount()... then writes it
});

// value.set(1) fires the effect once — and that is where it stops being fine:
// the effect just wrote the very signal it also reads, so it is immediately
// scheduled to run again. Reads changeCount, writes changeCount, forever —
// one microtask apart, with no stack overflow, just a CPU that never idles.`;

  /** Line-by-line walkthrough of {@link selfFeedbackLoopSample}. */
  protected readonly selfFeedbackLoopNotes: CodeNote[] = [
    {
      line: 5,
      text: 'Reading `this.value()` registers the dependency the effect is meant to have — this line looks exactly like every other effect on this page so far.',
    },
    {
      line: 6,
      text: '`this.changeCount()` on the right-hand side is a **tracked read** too — nothing about being inside a `.set(...)` call exempts it. It quietly adds `changeCount` as a second dependency of this same effect, one line before that effect writes to it.',
    },
    {
      line: 10,
      text: 'Writing a signal an effect depends on marks that effect dirty again — and this effect depends on `changeCount` now, because of line 6. It reruns, reads `changeCount()` again, writes it again, and marks itself dirty again. Nothing external ever stops it.',
    },
  ];

  /**
   * Sample: fixing the loop above with `untracked` — read the current value
   * without subscribing to it.
   */
  protected readonly loopFixUntrackedSample = `effect(() => {
  this.value();                                  // the only real dependency
  const current = untracked(this.changeCount);   // read WITHOUT registering a dependency
  this.changeCount.set(current + 1);
});`;

  /** Line-by-line walkthrough of {@link loopFixUntrackedSample}. */
  protected readonly loopFixUntrackedNotes: CodeNote[] = [
    {
      line: 3,
      text: '`untracked(this.changeCount)` still returns the live value — untracked reads are not stale, they just do not get **recorded**. This effect now depends only on `value`.',
    },
    {
      line: 4,
      text: 'Writing `changeCount` here no longer re-triggers this effect, because this effect was never subscribed to it in the first place. The loop is broken at the dependency, not the write.',
    },
  ];

  /**
   * Sample: the better fix — there was never a reason for an effect here.
   * `linkedSignal`'s `prev` argument (introduced above) already carries what
   * this effect was manually reimplementing.
   */
  protected readonly loopFixLinkedSignalSample = `// no effect, no manual read-then-write — changeCount IS the derived state
changeCount = linkedSignal({
  source: this.value,
  computation: (_value, prev) => (prev?.value ?? 0) + 1,
});`;

  /** Line-by-line walkthrough of {@link loopFixLinkedSignalSample}. */
  protected readonly loopFixLinkedSignalNotes: CodeNote[] = [
    {
      line: 3,
      text: '`source: this.value` is the only thing this computation depends on — there is no second signal to accidentally read and write in the same breath.',
    },
    {
      line: 4,
      text: "`prev?.value` is this `linkedSignal`'s own last result, handed back deliberately — the same mechanism the palette picker above uses to remember a selection. `?? 0` covers the very first run, when there is no previous result yet.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'When do I actually need `linkedSignal` rather than `computed`?',
      a: 'Only when a human has to be able to overwrite the derived value. Selection state is the giveaway: the default comes from the data (first row, cheapest plan, current month), but the user can pick something else, and reloading the data should sensibly reset it. If nothing ever writes it, `computed` is simpler and you should prefer it.',
    },
    {
      q: 'Is `untracked` a code smell?',
      a: 'Used often, yes. It silently removes an edge from the dependency graph, which is invisible at the call site and produces stale values that look like data bugs rather than reactivity bugs. It has genuine uses — reading a logger, a config that never changes, or breaking a feedback loop — but "I want the current value here" is almost always better served by passing that value in as a parameter.',
    },
    {
      q: 'Does a custom `equal` work on `computed` too, or only writable signals?',
      a: 'Both. `computed(fn, { equal })` compares the newly computed value against the cached one and, if they match, does not notify anything downstream. That is the useful case, actually — a computed that rebuilds an array every run will hand out a new reference every time, and a value-based `equal` stops that from invalidating half your template.',
    },
    {
      q: 'What happens if I write to a signal inside a `computed`?',
      a: 'Angular throws. A `computed` is expected to be pure and can be re-run at any time, in any order, or skipped entirely if nobody reads it — so a write inside one would fire an unpredictable number of times. The framework refuses rather than letting you build something that works in development and misbehaves under a different read pattern.',
    },
    {
      q: 'Why is `effect` said to be worse than `computed` for copying a value?',
      a: 'Timing and honesty. An effect is scheduled, so the copy lands a beat after the source changed, and anything reading in between sees the old value — a real glitch. It also hides the relationship: with a `computed`, the dependency is visible in the expression, whereas an effect that writes a signal makes you read the body to discover that the two are connected at all.',
    },
  ];

  /**
   * The palettes the `linkedSignal` demo cycles through.
   */
  private readonly palettes = [
    ['Red', 'Green', 'Blue'],
    ['Cyan', 'Magenta', 'Yellow'],
    ['Amber', 'Violet', 'Teal'],
  ];
  /**
   * Which palette is showing.
   */
  private paletteIndex = 0;

  /**
   * The current options — the source the selection is linked to.
   */
  protected readonly options = signal(this.palettes[0]);
  /**
   * The selection. A `linkedSignal`, so it is writable like a `signal` *and* resets
   * to the first option whenever the options change. Neither `signal` nor
   * `computed` alone does both.
   */
  protected readonly selected = linkedSignal(() => this.options()[0]);

  /**
   * Tracked dependency of {@link sum}.
   */
  protected readonly a = signal(1);
  /**
   * Untracked dependency of {@link sum} — read, but not subscribed to.
   */
  protected readonly b = signal(100);
  /**
   * The sum. Recomputes on `a`, not on `b`: `untracked` reads the value without
   * registering a dependency, so the displayed total can be stale by design.
   */
  protected readonly sum = computed(() => this.a() + untracked(this.b));

  /**
   * Swaps in the next palette, which is what makes the linked selection reset.
   */
  protected reshuffle() {
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
    this.options.set(this.palettes[this.paletteIndex]);
  }

  /** The reactivity path this page sits on, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Signals', id: 'signals' },
    { label: 'Advanced Signals' },
    { label: 'resource()', id: 'resource-api' },
  ];
}
