import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Types used by the live demos ──────────────────────────────────────────────

/**
 * The four states in the basic `@switch` demo.
 */
type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * A discriminated union for the narrowing demo — each arm carries different
 * fields, reachable only after `kind` has been matched.
 */
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number };

/**
 * The fruits in the grouped-case demo. `kiwi` is deliberately not handled by
 * any `@case` — it is the button that lands on `@default`.
 */
type Fruit = 'apple' | 'pear' | 'cherry' | 'peach' | 'banana' | 'kiwi';

/**
 * The enum in the "expose it on the class" demo.
 *
 * A **string** enum on purpose: its members compare with `===` exactly like
 * any other literal, so nothing about `@switch` changes — the only new fact
 * this section teaches is that `RequestStatus` itself has to be reachable
 * from the template, which a bare TypeScript import never is.
 */
enum RequestStatus {
  Loading = 'LOADING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

/**
 * Lesson: the built-in `@switch` / `@case` / `@default` control-flow block.
 *
 * Beyond the state-machine demo: strict `===` matching (never coercion) and
 * why order decides a duplicate case, the v21 bodyless-case grouping that
 * replaced the old "no multi-value case" advice, per-case discriminated-union
 * narrowing and the `@let` requirement it actually has, the v21
 * `@default never;` compiler-enforced exhaustiveness check, the enum/constant
 * case trap (a template can only read class members, never a bare import),
 * the corrected `*ngSwitchCase` migration story, and the mechanism `@switch`
 * shares with a chained `@if`.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape set by `expert/change-detection`. The teaching order is
 * deliberate:
 *
 * 1. **Pose the problem first.** The page opens on "one value, four screens —
 *    which one shows?", puts the chained-`@if` version next to it, and makes
 *    the reader commit to a guess about strict equality on a napkin before
 *    `@switch` itself is fully explained.
 * 2. **Analogy before mechanism.** The bouncer-with-a-guest-list frame gives
 *    the reader somewhere to put "evaluated once", "strict match" and "first
 *    match wins" before those become rules to memorise in the abstract.
 * 3. **The same idea in several modes** — a taped row of the three block
 *    names, annotated live demos, a wrong/right comparison for the `@let`
 *    requirement, a dialogue between the reader and the compiler about
 *    exhaustiveness, and a flow diagram of the underlying mechanism.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 * 5. **The two coverage-sweep gaps this lesson used to have — `@default never;`
 *    and bodyless-case grouping — are both live, working demos**, not just
 *    prose. Both are checked against the installed `@angular/compiler-cli`
 *    (`npx ngc -p tsconfig.app.json`, which runs real template type-checking —
 *    plain `tsc` never looks at a template at all) before being wired into the
 *    page. That check is what surfaced the reason `@default never;` gets its
 *    own `@let kind = shape().kind` rather than reusing the narrowing panel's
 *    `s`: re-asserting `s.kind` as `never` fails to compile once `s` itself has
 *    narrowed to nothing, even though the switch is genuinely exhaustive — see
 *    **Why two `@let`s?** in the questions section.
 */
@Component({
  selector: 'app-lesson-control-flow-switch',
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
  ],
  templateUrl: './control-flow-switch.html',
  styleUrl: './control-flow-switch.css',
})
export class ControlFlowSwitch {
  // ── Demo 1: the basic state machine ────────────────────────────────────────

  /** The state in the basic `@switch` demo. */
  protected readonly status = signal<Status>('idle');

  // ── Demo 2: grouped cases ──────────────────────────────────────────────────

  /** The fruit in the grouped-case demo. `kiwi` deliberately hits `@default`. */
  protected readonly fruit = signal<Fruit>('apple');

  // ── Demo 3: discriminated-union narrowing + exhaustiveness ─────────────────

  /** The shape in the narrowing / exhaustiveness demo. */
  protected readonly shape = signal<Shape>({ kind: 'circle', radius: 5 });

  /**
   * The current shape's area.
   *
   * Computed in TypeScript rather than in the template because that is where
   * the narrowing matters: `@switch` picks which markup renders, but it is the
   * `switch` on the discriminant here that lets each branch read the fields
   * only its own variant has — exactly the same narrowing the template's own
   * `@switch (s.kind)` performs a few lines below it.
   */
  protected readonly area = computed(() => {
    const s = this.shape();
    switch (s.kind) {
      case 'circle':
        return +(Math.PI * s.radius ** 2).toFixed(2);
      case 'square':
        return s.side ** 2;
      case 'triangle':
        return (s.base * s.height) / 2;
    }
  });

  // ── Demo 4: the enum / constant case ───────────────────────────────────────

  /** The state in the enum-case demo. */
  protected readonly requestStatus = signal<RequestStatus>(RequestStatus.Loading);

  /**
   * Re-exposes the module-level enum on the class.
   *
   * This line is not decoration — it is the fix the whole section is about. A
   * template can only read members of the component instance; `RequestStatus`
   * the import is invisible to it no matter how many `@case` blocks reference
   * it, so without this line `@case (RequestStatus.Loading)` fails to compile.
   */
  protected readonly RequestStatus = RequestStatus;

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Control Flow track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: '@if / @else', id: 'control-flow-if' },
    { label: '@for', id: 'control-flow-for' },
    { label: '@switch' },
    { label: '@let', id: 'let-block' },
  ];

  /**
   * Sample: the same four states as a chained `@if`, shown before `@switch`
   * is introduced so the reader has something concrete to compare it against.
   */
  protected readonly chainedIfSample = `@if (status() === 'idle') {
  <p>💤 Nothing happening yet.</p>
} @else if (status() === 'loading') {
  <p>⏳ Loading your data…</p>
} @else if (status() === 'success') {
  <p>✅ Loaded successfully!</p>
} @else {
  <p>❌ Something went wrong.</p>
}`;

  /**
   * Sample: `@switch` with `@case` arms and a `@default`, mirroring the live
   * demo above it exactly.
   */
  protected readonly basicSwitchSample = `@switch (status()) {
  @case ('idle') {
    <p>💤 Nothing happening yet.</p>
  }
  @case ('loading') {
    <p>⏳ Loading your data…</p>
  }
  @case ('success') {
    <p>✅ Loaded successfully!</p>
  }
  @default {
    <p>❌ Something went wrong.</p>
  }
}`;

  /** Line-by-line walkthrough of {@link basicSwitchSample}. */
  protected readonly basicSwitchNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@switch (status())` runs the expression in parentheses **exactly once** per check. Read it as "take one snapshot of `status()`, then go looking for a match" — not "re-evaluate this for every case below."',
    },
    {
      line: 2,
      text: "`@case ('idle')` is compared against that one snapshot with strict `===`. Match, and this block — and only this block — gets built.",
    },
    {
      line: 4,
      text: 'No `break` here, and none needed. Unlike a JavaScript `switch`, `@switch` never falls through — exactly one branch ever runs, so there is nothing to fall out of.',
    },
    {
      line: 5,
      text: 'Order matters. Angular checks cases top to bottom and stops at the **first** one that matches; everything after that point — matching or not — is never even looked at on this pass.',
    },
    {
      line: 11,
      text: "`@default` is the catch-all: it runs only when nothing above matched. It's optional — leave it out and an unmatched value renders nothing at all.",
    },
  ];

  /**
   * Sample: bodyless `@case` blocks stacked together, sharing the body of
   * whichever `@case` comes next. Mirrors the live fruit demo exactly.
   */
  protected readonly groupedCaseSample = `@switch (fruit()) {
  @case ('apple') {}
  @case ('pear') {
    <p>🍎🍐 Pome family — a core full of seeds.</p>
  }
  @case ('cherry') {}
  @case ('peach') {
    <p>🍒🍑 Drupe family — one big stone in the middle.</p>
  }
  @case ('banana') {
    <p>🍌 Its own case — nothing else here looks like it.</p>
  }
  @default {
    <p>🤷 Not on the list — the general-admission line.</p>
  }
}`;

  /** Line-by-line walkthrough of {@link groupedCaseSample}. */
  protected readonly groupedCaseNotes: CodeNote[] = [
    {
      line: 2,
      text: "`@case ('apple') {}` — an empty body. On its own this would render nothing at all for `'apple'`; instead, a bodyless case gets folded into whichever `@case` comes directly after it.",
    },
    {
      line: 3,
      text: "`@case ('pear')` is the one that actually has a body, so Angular groups it with every bodyless `@case` immediately above it. `'apple'` and `'pear'` now share this exact block — that is the entire feature.",
    },
    {
      line: 7,
      text: "Same trick again: `'cherry'` (bodyless, line 6) groups with `'peach'` here. There is no limit on how many bodyless cases can stack before the one that finally has a body.",
    },
    {
      line: 13,
      text: '`@default` still only runs when nothing above matched — grouping cases does not change that rule at all.',
    },
  ];

  /**
   * Sample: the invalid multi-value syntax people reach for before they know
   * about grouping. Shown as a short illustration, never wired into a live
   * template — this is exactly the shape that fails to compile.
   */
  protected readonly multiValueCaseSample = `@case ('apple', 'pear') { /* ... */ }`;

  /**
   * Sample: fails to narrow, because `shape()` is a function call and
   * TypeScript never narrows through one.
   */
  protected readonly shapeDirectCallSample = `@switch (shape().kind) {
  @case ('circle') {
    {{ shape().radius }}
  }
}`;

  /**
   * Sample: the fix — name the call once with `@let`, then switch on the
   * stable reference.
   */
  protected readonly shapeLetSample = `@let s = shape();
@switch (s.kind) {
  @case ('circle') { {{ s.radius }} }
}`;

  /**
   * Sample: the narrowing demo — mirrors the live shape panel exactly. No
   * `@default never;` here on purpose; see {@link exhaustiveShapeSample} for
   * why the exhaustiveness check needs a `@let` of its own.
   */
  protected readonly shapeNarrowingSample = `@let s = shape();
@switch (s.kind) {
  @case ('circle') {
    <p>⬤ Circle · radius {{ s.radius }} → area = {{ area() }}</p>
  }
  @case ('square') {
    <p>◼ Square · side {{ s.side }} → area = {{ area() }}</p>
  }
  @case ('triangle') {
    <p>▲ Triangle · {{ s.base }}×{{ s.height }} → area = {{ area() }}</p>
  }
}`;

  /** Line-by-line walkthrough of {@link shapeNarrowingSample}. */
  protected readonly shapeNarrowingNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@let` names the result of calling `shape()` **once**, right here. `s` is now a plain reference — the one shape TypeScript can actually narrow — instead of a function call repeated everywhere a field is read.',
    },
    {
      line: 2,
      text: 'Switching on `s.kind` — not `shape().kind` — is what makes every case below type-check. `kind` is the **discriminant**: the one field every arm of the union declares, with a different literal value in each.',
    },
    {
      line: 4,
      text: 'Inside this block, `s` is narrowed to exactly the circle variant, so `s.radius` compiles here. Write `s.side` on this line instead and the compiler stops you — `side` does not exist on a circle.',
    },
  ];

  /**
   * Sample: the exhaustiveness-only demo, mirroring the live panel in the
   * next section exactly. Deliberately a **second, separate** `@let` from
   * {@link shapeNarrowingSample}'s `s` — see the FAQ below for why reusing
   * `s.kind` as the switch expression breaks `@default never;` even though
   * it narrows perfectly well on its own.
   */
  protected readonly exhaustiveShapeSample = `@let kind = shape().kind;
@switch (kind) {
  @case ('circle')   { <p>⬤ Accounted for.</p> }
  @case ('square')   { <p>◼ Accounted for.</p> }
  @case ('triangle') { <p>▲ Accounted for.</p> }
  @default never;
}`;

  /** Line-by-line walkthrough of {@link exhaustiveShapeSample}. */
  protected readonly exhaustiveShapeNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A second `@let`, on purpose — not the `s` from the panel above. `kind` captures **just the one field** the exhaustiveness check needs to reason about, once, as a plain value.',
    },
    {
      line: 2,
      text: 'Switching on `kind` itself — rather than `shape().kind` or `s.kind` written inline — is what lets `@default never;` below actually compile. See **Why two `@let`s?** in the questions section for the trap this sidesteps.',
    },
    {
      line: 6,
      text: '`@default never;` asserts the three cases above are the whole story for `kind`. Add a fourth `Shape` variant with no matching `@case`, and this line — not the narrowing panel above — is where the build fails.',
    },
  ];

  /**
   * Sample: a hypothetical fourth `Shape` arm, for the exhaustiveness predict.
   * Illustrative only — the real `Shape` type above stays at three variants,
   * or the live demo above would stop being exhaustive.
   */
  protected readonly hexagonSample = `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'triangle'; base: number; height: number }
  | { kind: 'hexagon'; side: number };   // ← new, and the switch above is untouched`;

  /**
   * Sample: a duplicate `@case` for the exact same value, for the
   * order-of-matching predict.
   */
  protected readonly duplicateCaseSample = `@switch (status()) {
  @case ('loading') { <p>First spinner</p> }
  @case ('loading') { <p>Second spinner — dead code</p> }
}`;

  /**
   * Sample: the enum case, mirroring the live request-status panel exactly.
   */
  protected readonly enumCaseSample = `@switch (requestStatus()) {
  @case (RequestStatus.Loading) {
    <p>⏳ Working on it…</p>
  }
  @case (RequestStatus.Success) {
    <p>✅ Done.</p>
  }
  @case (RequestStatus.Failed) {
    <p>❌ It broke.</p>
  }
}`;

  /** Line-by-line walkthrough of {@link enumCaseSample}. */
  protected readonly enumCaseNotes: CodeNote[] = [
    {
      line: 1,
      text: '`requestStatus()` is a signal read — the same rule as every other `@switch` on this page, evaluated once per check.',
    },
    {
      line: 2,
      text: "`RequestStatus.Loading` is a member access, and a template can only read members of the **component instance**. This compiles only because the class also has `protected readonly RequestStatus = RequestStatus;` — delete that one line and this becomes `Property 'RequestStatus' does not exist on type 'ControlFlowSwitch'`, even though the enum is imported at the top of the file.",
    },
  ];

  /**
   * Sample: migrating `ngSwitch` — three cooperating directives plus
   * `CommonModule` — to the single built-in block.
   */
  protected readonly legacySwitchSample = `<div [ngSwitch]="status">
  <app-spinner *ngSwitchCase="'loading'" />
  <app-results *ngSwitchCase="'success'" />
  <app-error   *ngSwitchDefault />
</div>`;

  /** Sample: the built-in equivalent of {@link legacySwitchSample}. */
  protected readonly blockSwitchSample = `@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('success') { <app-results /> }
  @default          { <app-error /> }
}`;

  /**
   * The reader and the compiler, negotiating what `@default never;` actually
   * promises.
   *
   * A dialogue rather than a paragraph because exhaustiveness is a contract
   * with two sides — what the reader is claiming, and what the compiler is
   * willing to verify — and learners reliably assume the check is stronger
   * (or weaker) than it is. Staged as a conversation, "hand me a bare
   * function call and I have nothing stable to prove `never` about" lands as
   * something said to you rather than a clause in a description.
   */
  protected readonly exhaustivenessTalk: BubbleTurn[] = [
    {
      who: 'You',
      says: 'I added `@default never;` to the bottom of my switch. What does that actually do?',
    },
    {
      who: 'The compiler',
      says: "I check whether every `@case` above it, together, accounts for the whole type. If they do, whatever's left over is `never` — nothing — and I let the line compile.",
    },
    {
      who: 'You',
      says: 'And if a teammate adds a new variant next sprint and forgets a case for it?',
    },
    {
      who: 'The compiler',
      says: "Then what's left over isn't `never` any more. It's the variant nobody handled, and I refuse to build until somebody does.",
    },
    {
      who: 'You',
      says: 'So this only works because I already switched on a narrowed reference.',
    },
    {
      who: 'The compiler',
      says: 'Exactly. Hand me a bare function call instead and I have nothing stable to prove `never` about — `@let` it first, always.',
    },
  ];

  /** What happens when `@switch` checks a value, as a sequence. */
  protected readonly mechanismSteps: FlowStep[] = [
    {
      label: '`@switch (status())`',
      detail: 'Evaluated once per check — a single read, not one per case',
    },
    {
      label: 'Compare, top to bottom',
      detail: 'Each `@case` tested against it with `===`, in source order',
    },
    {
      label: 'First match wins',
      detail: 'The search stops the instant one case agrees — nothing after it is even evaluated',
      tone: 'accent',
    },
    {
      label: "Build that branch's view",
      detail: 'Only the matching branch is instantiated; every other branch does not exist yet',
    },
    {
      label: 'Switch again → destroy, not hide',
      detail: 'A new match tears down the old view (running its `ngOnDestroy`) and builds fresh',
      tone: 'warn',
    },
  ];

  /**
   * The order-of-matching self-test.
   *
   * The distractors are the three real misconceptions: that `@switch`
   * coerces types, that a mismatched earlier case stops the search, and that
   * mixing case types is a compile error. Each `why` names the specific wrong
   * belief rather than just restating the right answer.
   */
  protected readonly orderQuizOptions: QuizOption[] = [
    {
      text: "The `@case ('2')` block — `2` and `'2'` are close enough for `@switch` to accept.",
      why: "**`@switch` never coerces.** `===` fails the instant the types differ, no matter how the values print. `'2'` is a string; `status` is holding the number `2`, so this case is skipped entirely.",
    },
    {
      text: 'The `@case (2)` block.',
      correct: true,
      why: "Right — `@case (2)` is the number `2`, `status` is the number `2`, and `===` agrees on both type and value. The `@case ('2')` above it was checked first, failed on type, and was passed over.",
    },
    {
      text: 'The `@default` block — neither case is an exact type-and-value match.',
      why: "One of them is. `@case (2)` (the number) matches `status` exactly — you're right that `@case ('2')` (the string) does not, but the switch keeps checking after a failed case instead of giving up at the first mismatch.",
    },
    {
      text: "Angular throws a compile error — you can't mix a string case and a number case in one switch.",
      why: "Nothing stops you mixing case types in the same switch; each `@case` is judged entirely on its own against the expression. This isn't caught anywhere at build time — which is exactly why it's worth memorising.",
    },
  ];

  /**
   * The exhaustiveness self-test.
   *
   * Distractors target the two ways people misjudge `@default never;`:
   * assuming a plain `@default` inherits its protection, and confusing it
   * with an unrelated runtime error.
   */
  protected readonly exhaustivenessQuizOptions: QuizOption[] = [
    {
      text: 'Same as before — the build still fails on that switch.',
      why: 'That protection came specifically from `never`. An ordinary `@default` has no idea how many variants a union is supposed to have — it just accepts whatever failed to match anything else.',
    },
    {
      text: "It compiles, and the new shape silently renders 'Unknown'.",
      correct: true,
      why: 'Exactly the trade being made. A plain `@default` is a safety net for **humans** — it always compiles and always catches whatever falls through, a genuinely new variant or a typo alike, with no way to tell the two apart.',
    },
    {
      text: 'It compiles, but throws NG0100 the first time the new shape appears.',
      why: 'Wrong error, wrong cause. NG0100 (`ExpressionChangedAfterItHasBeenCheckedError`) is about a binding changing value **during** a change-detection pass — nothing to do with an unhandled switch arm.',
    },
    {
      text: 'TypeScript infers the missing case and adds it for you automatically.',
      why: "TypeScript checks types; it doesn't write template branches for you. Nothing generates a `@case` — the entire reason `@default never;` exists is that a forgotten arm is otherwise invisible.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Do I have to use `@let` every single time I `@switch` on something?',
      a: "No — only when you want per-case type narrowing on an expression TypeScript can't already track as a stable reference, which in practice means a function call: a signal read, a getter, a method. Switching on a plain field, or on something already named with `@let`, narrows fine without a second one. The rule is narrower than 'always `@let` it': narrow a **call**, not a reference.",
    },
    {
      q: 'Can `@switch` compare things other than strings — numbers, booleans, enum members?',
      a: "Anything `===` can compare: numbers, booleans, string or numeric enum members (once exposed on the class — see above), even `null` and `undefined`. There's no type restriction in the syntax itself, only the equality rule — same type, same value, no coercion.",
    },
    {
      q: 'What actually happens if I forget `@default` and nothing matches?',
      a: "Nothing renders, and nothing errors. The switch simply has no active branch, so its spot in the DOM stays empty — no placeholder, no console warning, nothing to search for. If 'unknown value' should be visible to a user, you have to say so yourself with a `@default`.",
    },
    {
      q: 'Does `@default never;` do anything at runtime — is it checking every value as it arrives?',
      a: "No runtime behaviour at all. It's a compile-time-only assertion, the same trick as TypeScript's `assertNever(x: never)` pattern, just spelled for a template. Once the compiler is convinced every case is covered, the line contributes nothing to the emitted code — it exists purely to make a forgotten case a build failure instead of a shipped bug.",
    },
    {
      q: 'The narrowing panel switches on `s.kind`. The exhaustiveness panel a few scrolls down switches on a `@let kind = shape().kind` instead. Why not write `@switch (s.kind) { … @default never; }` in one panel and be done?',
      a: "Try it, and `@default never;` itself fails to compile — even though the switch is genuinely exhaustive. `@default never;` re-checks the **exact expression** written in the `@switch (...)` parentheses, not the object that expression reads from. Switch on `s.kind`, and by the time every case is handled, `s` itself has correctly narrowed to nothing at all — but nothing has no `.kind` to re-read, so the compiler chokes re-reading it, even though the switch really is exhaustive. Capture the field **on its own** first — `@let kind = shape().kind`, then switch on `kind` — and there is no further property access left to trip over: `kind`'s own type narrows straight to `never`, and the assertion holds.",
    },
    {
      q: 'Is `@switch` actually faster than a chain of `@if` / `@else if`?',
      a: "Not meaningfully — they compile through the same underlying mechanism (see **Under the hood** below), so there's no performance case for choosing one over the other. Reach for `@switch` because it reads better for 'one value, several exact possibilities'; reach for a chained `@if` when the conditions are genuinely unrelated booleans. Readability is the whole argument either way.",
    },
  ];
}
