import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { CoerceDemo } from './coerce-demo/coerce-demo';
import { Badge } from './badge/badge';

/**
 * Lesson: Component Inputs — passing data down.
 *
 * Covers the signal-based `input()` function, optional against `input.required()`,
 * aliasing, and `transform`.
 *
 * The demo the lesson is built around is coercion. An attribute in a template is
 * always a string; without a `transform` a child declared as taking a number
 * quietly receives `"42"`, and `size() + 1` yields `"421"`. `numberAttribute`
 * and `booleanAttribute` fix that at the boundary, and {@link CoerceDemo} shows
 * the runtime type so the fix is visible rather than asserted.
 *
 * Also contrasts `input()` with the older `@Input()` decorator: the signal form
 * is readable in a `computed`, needs no `ngOnChanges` to react to, and cannot be
 * written to from inside the child.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. This lesson was already deep before the
 * migration — it just had no picture. The one new idea the diagram earns its
 * keep on is **directionality**: an input is a channel that only ever carries
 * data one way, and that is the single fact everything else in the lesson (the
 * read-only rule, the constructor-timing trap, "don't mutate what you were
 * handed") turns out to be a consequence of.
 *
 * The teaching order:
 *
 * 1. **Pose the problem before naming the fix.** A component's fields are
 *    private to it; the opening section asks the reader to predict whether a
 *    child can simply reach up and read a parent's field before naming `input()`
 *    as the sanctioned door in.
 * 2. **Analogy, then a two-party dialogue.** "An input is a function parameter"
 *    is the mental model; {@link Bubbles} restages the same contract as a
 *    conversation between the parent and the child, because the relationship a
 *    beginner gets backwards here is *who is allowed to write*, and a dialogue
 *    makes that ownership explicit in a way a paragraph does not.
 * 3. **Then the mechanism as a picture.** {@link Flow} draws the one arrow this
 *    whole lesson is about: parent binding → change detection → child signal —
 *    and nothing drawn goes the other way.
 * 4. **The same idea in the remaining modes** — annotated source via
 *    {@link CodeLab}, a live demo, a predict-then-reveal trap, a quiz, and an
 *    old-API/new-API comparison — because redundancy across modes is the
 *    retention bar, not repetition within one.
 *
 * @see beginner/outputs — the channel that carries data back up, the other
 * half of parent/child communication.
 * @see beginner/services-di — the alternative to a long prop chain: shared
 * state neither side "owns" the way a parent owns an input.
 */
@Component({
  selector: 'app-lesson-inputs',
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
    Badge,
    CoerceDemo,
  ],
  templateUrl: './inputs.html',
})
export class Inputs {
  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Component Communication pair plus its neighbours, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Lifecycle', id: 'lifecycle' },
    { label: 'Component Inputs' },
    { label: 'Component Outputs', id: 'outputs' },
    { label: 'Services & DI', id: 'services-di' },
    { label: 'Signals', id: 'signals' },
  ];

  /**
   * The one arrow this lesson is about. Three steps, never a fourth going
   * backward: a parent's binding, the pass that carries it across, and the
   * signal on the other side that receives it.
   */
  protected readonly dataFlowSteps: FlowStep[] = [
    {
      label: 'Parent template',
      detail: '`[color]="theme()"` — a property binding, decided entirely by the parent',
    },
    {
      label: 'Change detection',
      detail: 'Angular carries the value across on its next pass',
      tone: 'accent',
    },
    {
      label: "Child's input()",
      detail: "`color = input('#7c4dff')` receives it as a read-only signal",
      tone: 'good',
    },
  ];

  /**
   * The parent/child contract, staged as dialogue rather than left as a
   * paragraph about ownership. This is the relationship beginners reliably get
   * backwards — assuming the child can ask for a value, or push one back —
   * so it gets the two-party treatment instead of a bullet point.
   */
  protected readonly contractTalk: BubbleTurn[] = [
    {
      who: 'Parent',
      says: 'I own `theme`. I\'m binding `[color]="theme()"` into you — that\'s the whole arrangement.',
    },
    {
      who: 'Badge (child)',
      says: "Understood. I'll read it as `color()`. What if I decide I don't like the value?",
    },
    {
      who: 'Parent',
      says: "You can look, not touch. There's no `color.set(...)` on your side of this — I own that signal, not you.",
    },
    {
      who: 'Badge (child)',
      says: "Fair. And if you change `theme` after I'm already on screen?",
    },
    {
      who: 'Parent',
      says: 'Then I re-bind, and your `color()` updates on its own next pass. You never poll me, and I never call back into you.',
    },
    {
      who: 'Badge (child)',
      says: 'So it really is one door, and it only ever swings one way.',
    },
  ];

  /**
   * Sample: the child's three inputs, in the three shapes this lesson covers —
   * required, optional-with-default, and aliased-plus-transformed. The exact
   * class the live demo below actually runs.
   */
  protected readonly badgeInputsSample = `export class Badge {
  label = input.required<string>();

  color = input('#7c4dff');

  big = input(false, {
    alias: 'large',
    transform: booleanAttribute,
  });
}`;

  /** Line-by-line walkthrough of {@link badgeInputsSample}. */
  protected readonly badgeInputsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The class every `<app-badge>` in a template becomes an instance of. Three fields, three different shapes of `input()` — that is the whole lesson in miniature.',
    },
    {
      line: 2,
      text: '`input.required<string>()` has no default and no fallback: the type is `Signal<string>`, and if a parent never binds `[label]`, Angular throws before this component ever renders. Read the value as `label()` — the call is what makes it reactive.',
    },
    {
      line: 4,
      text: "`input('#7c4dff')` is the ordinary shape: the argument is the default the signal holds until a parent's binding overrides it. Omit `[color]` in the parent and the badge is simply purple.",
    },
    {
      line: 7,
      text: '`alias: \'large\'` renames the binding as the *template* sees it. A parent must write `[large]="…"` — `[big]` does not exist as far as the template is concerned — but inside this class the field is still called `big`. Bind the alias, read the field.',
    },
    {
      line: 8,
      text: "`transform: booleanAttribute` runs on whatever the parent binds, before the value ever reaches the signal. Even the string `'false'` becomes the real boolean `false` here — the fix for the trap the Predict further down is built around.",
    },
  ];

  /**
   * Sample: the parent's template — the other half of {@link badgeInputsSample},
   * and the exact bindings the live demo below is wired to.
   */
  protected readonly parentBindingsSample = `<app-badge
  [label]="label()"
  [color]="color()"
  [count]="count()"
  [large]="large()"
/>`;

  /** Line-by-line walkthrough of {@link parentBindingsSample}. */
  protected readonly parentBindingsNotes: CodeNote[] = [
    {
      line: 1,
      text: "This is the *parent's* template — `Badge` never sees this markup, only the values that arrive through it.",
    },
    {
      line: 2,
      text: 'Square brackets mean **"evaluate this as an expression,"** not "paste this text." Drop them and `label="label()"` would hand the child the literal seven characters `label()` — the parentheses would never run.',
    },
    {
      line: 3,
      text: "`color()` is the parent reading its *own* signal. What crosses into the child is the plain value that call returns — a string like `'#2ec16b'` — never the signal object itself.",
    },
    {
      line: 4,
      text: 'Numbers need the brackets for the same reason: `[count]="3"` passes the number `3`. Drop the brackets and `count="3"` passes the *string* `"3"` instead.',
    },
    {
      line: 5,
      text: 'The costliest version of the same trap: `[large]="false"` passes the boolean `false`. Without the brackets, `large="false"` passes the *string* `\'false\'` — which is truthy, so the child ends up thinking it should be large.',
    },
  ];

  /** The `disabled="false"` trap, posed before the transform section explains it. */
  protected readonly coercionTrapSample = `// child
disabled = input(false);          // no transform

// parent template
<app-button disabled="false" />`;

  /**
   * Sample: `transform` coercing on the way in — a named helper Angular ships,
   * and a hand-written one to show it is just a function.
   */
  protected readonly transformSample = `size = input(0, { transform: numberAttribute });

slug = input('', {
  transform: (v: string) => v.trim().toLowerCase(),
});`;

  /** Line-by-line walkthrough of {@link transformSample}. */
  protected readonly transformNotes: CodeNote[] = [
    {
      line: 1,
      text: '`numberAttribute` is a transform Angular ships. Whatever the parent binds — even the string `"8"` — runs through it before the signal stores anything, so `size()` always hands back a genuine `number`.',
    },
    {
      line: 3,
      text: 'A `transform` does not have to be a named helper. Any pure function of the incoming value works — declared inline, right inside the options object.',
    },
    {
      line: 4,
      text: 'The function runs once, on the way in, **before** the signal ever holds a value. Trim it, lower-case it, and that is the only version `slug()` will ever return — nothing downstream sees the raw string.',
    },
  ];

  /**
   * Sample: the classic `@Input()` decorator, in its three shapes — plain,
   * required, and transformed — mirroring {@link badgeInputsSample}.
   */
  protected readonly decoratorSample = `@Input() label = '';
@Input({ required: true }) id!: string;
@Input({ transform: booleanAttribute }) disabled = false;`;

  /** Line-by-line walkthrough of {@link decoratorSample}. */
  protected readonly decoratorNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The classic form: a **decorator** sitting directly above a plain field, rather than a function call. No signal here — reading this field never registers a dependency the way `label()` does.',
    },
    {
      line: 2,
      text: '`{ required: true }` is the decorator era\'s version of `input.required()`. The `!` after `id` is TypeScript\'s **definite assignment assertion** — it tells the compiler "trust me, something sets this before anything reads it," because unlike a signal input, the decorator gives TypeScript no way to prove that itself.',
    },
    {
      line: 3,
      text: 'Decorators accept the same transforms signal inputs do. `booleanAttribute` fixes the exact same `disabled="false"` trap here — the mechanism never changed between the two APIs, only the syntax wrapping it.',
    },
  ];

  /** Compare, left panel: derived state kept in sync by hand, in `ngOnChanges`. */
  protected readonly compareOldSample = `// The OLD way. Derived state has to
// be stored in its own field...
@Input() label = '';
initials = '';

// ...and manually recomputed in a
// lifecycle hook.
ngOnChanges(c: SimpleChanges) {
  // SimpleChanges is a plain object
  // keyed by input NAME AS A STRING.
  // Rename the input and this key
  // silently stops matching — no
  // compile error, no warning.
  if (c['label']) {
    // Forget this guard and it runs
    // on EVERY input change, not just
    // label's.
    this.initials =
      this.label.slice(0, 2).toUpperCase();
  }
}`;

  /** Compare, right panel: the same derivation as one `computed`. */
  protected readonly compareNewSample = `label = input('');

initials = computed(() =>
  this.label().slice(0, 2).toUpperCase()
);`;

  /** Choices for the constructor-read check — the single most common input mistake. */
  protected readonly timingOptions: QuizOption[] = [
    {
      text: 'It logs the value the parent bound',
      why: 'Bindings have not been applied when the constructor runs. The instance exists, but nothing has been passed into it yet.',
    },
    {
      text: 'It logs `undefined`',
      why: 'Close, and that is what happens for an *optional* input — but a required input is stricter than that.',
    },
    {
      text: 'It throws',
      correct: true,
      why: 'Reading a `required` input before it is set throws NG0950. Angular would rather fail loudly than hand you an `undefined` that surfaces as a bug three layers away. Read it in `ngOnInit`, a `computed`, or the template.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why is an input a function I have to call, rather than a plain property?',
      a: 'Because the call is what registers the dependency. When a `computed` or a template reads `label()`, the reactivity graph records that it depends on this input, so it can re-run exactly those readers when the value changes. A plain property read gives Angular no way to know who cared.',
    },
    {
      q: 'Is `@Input()` deprecated? Should I rewrite everything?',
      a: 'Not deprecated, and no. The decorator form works and will keep working. Use `input()` in new code because it composes with `computed` and removes the need for `ngOnChanges`, and migrate existing code when you are touching it anyway — not as a project of its own.',
    },
    {
      q: 'If inputs are read-only, how do I let the child change the value?',
      a: 'Use `model()`, which gives you a writable signal plus an automatic `xChange` output, so the parent can bind `[(value)]`. Reach for it only when the child genuinely owns the value — a form control, a toggle. For everything else, one-way in and an event out is easier to reason about.',
    },
    {
      q: 'I mutated an object I received as an input and the parent changed too. Is that a bug?',
      a: 'It is doing what JavaScript does — you were handed the same reference, not a copy. It is still a bug in the design: it is a hidden two-way channel that OnPush will not notice, so the parent can end up displaying stale data it technically already has. Treat inputs as immutable and emit an event instead.',
    },
  ];

  /**
   * Text passed to the badge demo.
   */
  protected readonly label = signal('Online');
  /**
   * Colour passed to the badge demo.
   */
  protected readonly color = signal('#2ec16b');
  /**
   * A number passed to the badge demo.
   */
  protected readonly count = signal(7);
  /**
   * A boolean passed to the badge demo, for the `booleanAttribute` transform.
   */
  protected readonly large = signal(false);
  /**
   * Initials derived from {@link label} — a `computed` over a signal that happens
   * to feed an input, to show the two composing.
   */
  protected readonly initials = computed(() => this.label().slice(0, 2).toUpperCase());
  /**
   * The **string** bound to the coercion demo's numeric input. A string on purpose:
   * that is what a template attribute always is.
   */
  protected readonly raw = signal('42');
}
