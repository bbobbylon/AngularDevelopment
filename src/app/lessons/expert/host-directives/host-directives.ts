import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote, Layer } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { Elevate } from './elevate/elevate';
import { FancyCard } from './fancy-card/fancy-card';
import { StatusCard } from './status-card/status-card';
import { ToneCardBare } from './tone-card-bare/tone-card-bare';
import { ToneCardOwn } from './tone-card-own/tone-card-own';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: the Directive Composition API (`hostDirectives`) — attaching another
 * directive's behavior straight onto a component's own host element, with no
 * base class, no wrapper DOM, and no consumer who has to remember an
 * attribute. Live demos prove input **and** output re-export, host-binding
 * precedence, and that the host injects its own composed directives; static
 * examples cover the five compile-time diagnostics that guard the feature and
 * the transitive re-export chain a multi-level design system needs.
 *
 * ## Presentation
 *
 * Migrated onto the brain-friendly layer (`shared/brain/`, `docs/UI-DESIGN.md`
 * §9), following the teaching order set by the reference lesson,
 * `expert/change-detection`:
 *
 * 1. **Pose the problem before naming the fix.** The lesson opens on "one
 *    class, two behaviors" and makes the reader notice that TypeScript's
 *    single-inheritance rule already forecloses the obvious answer, before
 *    `hostDirectives` is ever mentioned.
 * 2. **Analogy next, mechanism after.** "A costume, not your DNA" gives the
 *    reader a place to put "private by default" and "compile-time" before
 *    those words carry any weight.
 * 3. **Then the same idea in several modes** — a dialogue between the card and
 *    the directive it composes, a containment diagram for three-level
 *    composition, a step diagram for precedence, and annotated compiled code —
 *    because the retention bar is redundancy across *modes*, not repetition in
 *    one.
 * 4. **Every snippet is annotated line by line** via `app-code-lab`, and every
 *    demo is real: `FancyCard` really does re-export `Elevate`'s output, and
 *    the counter on screen really is driven by that binding.
 */
@Component({
  selector: 'app-lesson-host-directives',
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
    FancyCard,
    StatusCard,
    ToneCardBare,
    ToneCardOwn,
    Elevate,
  ],
  styleUrl: './host-directives.css',
  templateUrl: './host-directives.html',
})
export class HostDirectives {
  /**
   * The tone `StatusCard` is showing, via its re-exported `tone` input — real
   * name `Accent.accent`, aliased.
   */
  protected readonly tone = signal('var(--green)');

  /**
   * How many times either `FancyCard` has fired its re-exported `(lifted)`
   * output. Driven entirely by a consumer-side event binding — nothing inside
   * `FancyCard` increments this; the lesson does, from the outside, exactly
   * the way any consumer of the component would.
   */
  protected readonly liftCount = signal(0);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Architecture track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'State Management', id: 'state-management' },
    { label: 'Dynamic Components', id: 'dynamic-components' },
    { label: 'Directive Composition' },
    { label: 'NgModules Migration', id: 'ngmodules-migration' },
  ];

  /**
   * The card asking for a behavior it doesn't want to own, and the directive
   * explaining the terms on which it'll provide it.
   *
   * This exists because the relationship learners get backwards is exactly
   * which side is in charge: `Elevate` sounds like it's "wrapping" `FancyCard`,
   * the way a decorator wraps an object it holds a reference to. It isn't.
   * `Elevate` attaches to `FancyCard`'s own host element and is a sibling
   * provider on it — nobody holds a reference to anybody.
   */
  protected readonly costumeTalk: BubbleTurn[] = [
    {
      who: 'FancyCard',
      says:
        "I need to lift a little on hover. I don't want to own that logic, and I definitely don't " +
        'want an `<app-hoverable>` wrapped around me.',
    },
    {
      who: 'Elevate',
      says: "Put me in your `hostDirectives` array. I'll bind straight to **your** host element — no wrapper, no subclass.",
    },
    {
      who: 'FancyCard',
      says: "Can I still see what you're doing? I want to show `lifted` in my own template.",
    },
    {
      who: 'Elevate',
      says: "Of course — I'm a provider on your element injector, same as anything else there. `inject(Elevate)` and I'm yours.",
    },
    {
      who: 'A consumer',
      says: 'Can **I** read `lifted` from outside, on `<app-fancy-card>`?',
    },
    {
      who: 'Elevate',
      says: "Not unless FancyCard re-exports me. I'm private by default — that's not modesty, that's the whole point of composition.",
    },
  ];

  /**
   * Sample: the entire `Elevate` / `FancyCard` pair from the live demo below,
   * trimmed to what `hostDirectives` actually needs.
   */
  protected readonly composeSample = `@Directive({
  selector: '[appElevate]',
  host: {
    '[style.transform]': 'lifted() ? "translateY(-4px)" : "none"',
    '(mouseenter)': 'lifted.set(true)',
    '(mouseleave)': 'lifted.set(false)',
  },
})
export class Elevate {
  readonly lifted = signal(false);
}

@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],   // ← the card now HAS Elevate's behavior
  template: '…',
})
export class FancyCard {
  protected readonly elevate = inject(Elevate);   // and can talk to it
}`;

  /** Line-by-line walkthrough of {@link composeSample}. */
  protected readonly composeNotes: CodeNote[] = [
    {
      line: 2,
      text: "A directive selector, same as any other `@Directive`. Nothing about `Elevate` knows or cares that it's about to be composed rather than applied with an attribute — that decision is made entirely on the **consuming** side.",
    },
    {
      line: 3,
      text: "The `host` object is the signal-era spelling of `@HostBinding`/`@HostListener`: each key is either `[binding]` (a property to write) or `(event)` (a listener to attach), both against **this directive's own host element**.",
    },
    {
      line: 4,
      text: '`lifted()` calls the signal to read it. The whole line reads as one ternary: write `translateY(-4px)` to `style.transform` when lifted, `none` otherwise — recomputed every time `lifted` changes.',
    },
    {
      line: 10,
      text: '`signal(false)` creates a `WritableSignal<boolean>`. Nothing here says this signal is private — the next section is entirely about who else gets to see it.',
    },
    {
      line: 15,
      text: "The line that matters. `hostDirectives: [Elevate]` tells the compiler to graft `Elevate`'s `host` bindings onto `FancyCard`'s **own** host element — the same tag `<app-fancy-card>` already renders. No instance is constructed by hand anywhere; the compiler wires it.",
    },
    {
      line: 19,
      text: '`inject(Elevate)` retrieves the **exact instance** Angular created for this element when it processed line 15 — not a new one. A host directive is a normal element-injector provider, which is what makes this legal.',
    },
  ];

  /**
   * Sample: re-exporting a composed directive's input **and** output, both
   * under an alias. Uses the two real directives from the live demos —
   * `Accent` (an input) and `Elevate` (an output) — rather than an invented
   * one, so the sample and the running page never disagree.
   */
  protected readonly reexportSample = `hostDirectives: [
  { directive: Accent,  inputs:  ['accent: tone'] },          // re-export an input, aliased
  { directive: Elevate, outputs: ['liftedChange: lifted'] },  // re-export an output, aliased
]

// consumer:
// <app-status-card [tone]="'var(--green)'" />
// <app-fancy-card (lifted)="onLift()" />
//
// [accent] and (liftedChange) would NOT compile on these hosts —
// the un-exported names simply don't exist there.`;

  /** Line-by-line walkthrough of {@link reexportSample}. */
  protected readonly reexportNotes: CodeNote[] = [
    {
      line: 2,
      text: "`'accent: tone'` is `'<the directive's real name>: <the alias the host exposes>'`. `Accent` still calls its own field `accent` internally — only the host's public name changed.",
    },
    {
      line: 3,
      text: "Outputs alias the exact same way, just in the `outputs` array. `Elevate.liftedChange` becomes `FancyCard`'s `(lifted)` — the event object it emits is unchanged, only the name a template binds to.",
    },
    {
      line: 7,
      text: "`[tone]` works because it's the alias `StatusCard` chose to expose — not because `Accent` is composed at all. A consumer never needs to know `Accent` exists.",
    },
    {
      line: 8,
      text: 'Same idea for the output: the demo further up wires exactly this binding to a counter, from **outside** `FancyCard`.',
    },
    {
      line: 10,
      text: "Try either un-exported name and the template type-checker rejects it at compile time — the same category of error as binding to an input that was never declared, because as far as the host's public API is concerned, it wasn't.",
    },
  ];

  /**
   * Sample: precedence when several sources bind the same host property.
   * Matches `ToneCardOwn` from the live demo below exactly, so the comment
   * block at the bottom can be checked against the running page.
   */
  protected readonly precedenceSample = `@Component({
  selector: 'app-tone-card-own',
  hostDirectives: [ToneRed, ToneBlue],                        // both bind style.background
  host: { '[style.background]': '"rgba(16,185,129,.18)"' },   // so does the component
})
export class ToneCardOwn {}

// render order for the SAME property, style.background:
//   ToneRed   →  overwritten by ToneBlue (later in the array)
//   ToneBlue  →  overwritten by the component's own host binding
// ⇒ the component always wins; delete its binding and blue wins instead`;

  /**
   * Sample: the five diagnostics the compiler raises against invalid
   * `hostDirectives` metadata — demonstrated as one worked failure and its
   * fix, since a genuinely failing build can't be shipped as a live demo.
   */
  protected readonly guardrailSample = `@Directive({
  selector: '[appTooltip]',
  host: { '[title]': 'text()' },
})
export class Tooltip {
  readonly text = input.required<string>();   // no default — MUST be supplied
}

@Component({
  selector: 'app-info-card',
  hostDirectives: [Tooltip],   // ✗ NG2019 — required input never exposed
})
export class InfoCard {}

// fixed — expose it, so a consumer CAN satisfy the requirement:
@Component({
  selector: 'app-info-card',
  hostDirectives: [{ directive: Tooltip, inputs: ['text'] }],
})
export class InfoCard {}`;

  /** Line-by-line walkthrough of {@link guardrailSample}. */
  protected readonly guardrailNotes: CodeNote[] = [
    {
      line: 3,
      text: "`Tooltip` has no template of its own — it can only ever put `text()`'s value on the host through this `host` binding. There is no other route in.",
    },
    {
      line: 6,
      text: '`input.required<string>()` — no default value, no fallback. Something, somewhere, **must** set it, or the directive is unusable.',
    },
    {
      line: 11,
      text: 'This is the failure. `Tooltip` demands `text`, but `InfoCard` never re-exports it — there is now no way for ANY consumer to ever satisfy the requirement. The compiler refuses to build rather than ship a directive that can never be given what it needs: **NG2019**.',
    },
    {
      line: 18,
      text: "The fix is one word: expose it. `inputs: ['text']` gives `InfoCard`'s own consumers a `[text]` binding that reaches `Tooltip` — the requirement can now actually be met.",
    },
  ];

  /**
   * Sample: exposure across a three-level composition chain — `Ripple` inside
   * `Interactive` inside `ds-button`. Feeds the {@link Layers} diagram above
   * it in the template.
   */
  protected readonly transitivitySample = `@Directive({ selector: '[dsRipple]' })
export class Ripple {
  readonly pressed = input(false);
}

@Directive({
  selector: '[dsInteractive]',
  hostDirectives: [{ directive: Ripple, inputs: ['pressed'] }],   // relay #1 — same name
})
export class Interactive {}

@Component({
  selector: 'ds-button',
  hostDirectives: [{ directive: Interactive, inputs: ['pressed: dsPressed'] }],  // relay #2 — renamed
})
export class DsButton {}

// consumer:
// <ds-button [dsPressed]="isPressed()" />   ✓ compiles
// <ds-button [pressed]="isPressed()" />     ✗ unknown input 'pressed'`;

  /** Line-by-line walkthrough of {@link transitivitySample}. */
  protected readonly transitivityNotes: CodeNote[] = [
    {
      line: 3,
      text: '`Ripple` is the innermost layer — the actual state, `pressed`, lives here and nowhere else.',
    },
    {
      line: 8,
      text: "Relay #1: `Interactive` re-exports `Ripple`'s `pressed` **under the same name**. From outside `Interactive`, `pressed` now exists — but only on `Interactive`, not yet on anything that composes `Interactive`.",
    },
    {
      line: 14,
      text: "Relay #2: `ds-button` composes `Interactive`, not `Ripple` — it has never heard of `Ripple`. It re-exports `Interactive`'s `pressed`, and chooses to rename it to `dsPressed` on the way out. Each hop's alias is independent of every other hop's.",
    },
    {
      line: 20,
      text: "`pressed` doesn't fail because it's spelled wrong — it fails because at THIS hop, `ds-button`, that name was never chosen. `Interactive` having exposed it one level down is irrelevant; exposure does not travel automatically.",
    },
  ];

  /**
   * Sample: the CDK's real menu-item composition, next to a design system
   * doing the same nested trick this lesson's transitivity example teaches.
   */
  protected readonly realWorldSample = `// the CDK composes real behavior from smaller directives:
@Directive({
  selector: '[cdkMenuItemCheckbox]',
  hostDirectives: [CdkMenuItem],   // focus, typeahead, keyboard dispatch…
})
export class CdkMenuItemCheckbox { … }

// a design system does the same, and it nests:
@Component({
  selector: 'ds-button',
  hostDirectives: [
    { directive: Interactive, inputs: ['pressed: dsPressed'] },  // itself composes Ripple
    { directive: Disableable, inputs: ['disabled'] },
  ],
})
export class DsButton { … }`;

  /** Light walkthrough of {@link realWorldSample} — real API names, briefly glossed. */
  protected readonly realWorldNotes: CodeNote[] = [
    {
      line: 4,
      text: '`CdkMenuItem` is a real Angular CDK export. Composing it is how `cdkMenuItemCheckbox` gets focus management and keyboard dispatch without reimplementing either.',
    },
    {
      line: 12,
      text: 'This is the exact three-level chain from the diagram above, written the way a design system would actually ship it — two composed behaviors, each re-exported under the name the button wants its own consumers to use.',
    },
  ];

  /** Feeds the {@link Layers} diagram: the wrappers, outermost first. */
  protected readonly transitivityRings: Layer[] = [
    { label: 'ds-button', sub: "exposes 'dsPressed'" },
    { label: 'Interactive', sub: "exposes 'pressed'" },
  ];

  /** Feeds the {@link Layers} diagram: the innermost, solid thing. */
  protected readonly transitivityCore: Layer = { label: 'Ripple', sub: "defines 'pressed'" };

  /** Left panel of the static-vs-dynamic {@link Compare}: the compile-time array. */
  protected readonly staticComposeSample = `@Component({
  selector: 'app-fancy-card',
  hostDirectives: [Elevate],
})
export class FancyCard {}`;

  /** Right panel of the static-vs-dynamic {@link Compare}: runtime composition. */
  protected readonly dynamicComposeSample = `anchor().createComponent(FancyCard, {
  directives: [
    Elevate,
    { type: Accent, bindings: [inputBinding('accent', () => tone())] },
  ],
});`;

  /** Left panel of the intro wrong-ways {@link Compare}. */
  protected readonly wrongApproachesSample = `// one base class only; DI leaks; can't mix two behaviors
export class FancyCard extends HoverableBase { … }

// extra DOM breaks flex/grid parent-child CSS
<app-hoverable><app-card /></app-hoverable>

// works only if every consumer remembers to add it
<app-card appElevate>`;

  /** Right panel of the intro wrong-ways {@link Compare}. */
  protected readonly rightApproachSample = `// the component owns its own behavior — nobody has to remember anything
@Component({
  selector: 'app-card',
  hostDirectives: [Elevate],
})
export class FancyCard {}`;

  /** Steps for the precedence {@link Flow} diagram. */
  protected readonly precedenceFlow: FlowStep[] = [
    { label: 'ToneRed applies', detail: 'first in the array — sets `style.background`' },
    {
      label: 'ToneBlue applies',
      detail: 'later in the array — overwrites the same slot',
      tone: 'accent',
    },
    {
      label: "Component's own `host`",
      detail: 'if it binds the same property, it overwrites both',
      tone: 'good',
    },
  ];

  /**
   * The self-test's question. Kept as a field, not inline in the template,
   * because it quotes a literal template attribute (`[pressed]="true"`) —
   * embedding that directly in an HTML attribute value would need the quotes
   * escaped, which HTML attributes can't do with a backslash.
   */
  protected readonly transitivityQuizQuestion =
    "`Interactive` re-exports `Ripple`'s `pressed` input as-is. `ds-button` composes `Interactive` and re-exports " +
    '**that** under the new alias `dsPressed`. A teammate writes `<ds-button [pressed]="true" />`. What happens?';

  /**
   * The self-test's options.
   *
   * The distractors are the two mistakes this section exists to correct: that
   * exposure at one hop is enough for the whole chain, and that a bound name
   * degrades to a silent no-op rather than failing to compile. The `why` on
   * each wrong answer is the most valuable copy on the page (CONTRIBUTING
   * §2A), so each one names the misconception rather than just restating the
   * right answer.
   */
  protected readonly transitivityQuizOptions: QuizOption[] = [
    {
      text: 'It works — `Interactive` already exposed `pressed`, and `ds-button` composes `Interactive`.',
      why: "`ds-button` never composes `Ripple` directly — it composes `Interactive`, and only `Interactive`'s OWN re-exports are visible from there. What `Interactive` chose to call its input has no bearing on what `ds-button` chose to call ITS input.",
    },
    {
      text: "It's a compile error — `pressed` isn't a declared input of `ds-button`.",
      correct: true,
      why: 'Exactly. `ds-button` only ever declared `dsPressed`. Exposure resets at every hop — `pressed` is exactly as private on `ds-button` as if `Interactive` had never re-exported anything at all.',
    },
    {
      text: 'It silently binds but does nothing — `Ripple` never sees the value.',
      why: "Angular's template type-checker doesn't accept unknown bindings and quietly drop them. An input name the host doesn't declare is a compile-time error, not a runtime no-op — the same rule that makes NG2017 possible.",
    },
    {
      text: "It works, because `Ripple`'s `pressed` has a default value of `false`.",
      why: "A default on the innermost directive has nothing to do with which NAME is visible at the outermost host. That's decided entirely by what each intermediate hop chose to re-export — a default just means the directive still runs if nobody ever sets it.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "If I don't re-export an input, is it just... gone?",
      a: "No — it's private, not deleted. The composed directive still runs with whatever default it was written with, or with nothing at all if it's `input.required()` and nobody supplied it — which is exactly what NG2019 catches at compile time. Re-exporting only controls whether an outside consumer is **allowed** to set it.",
    },
    {
      q: 'Can a host directive and the host component both bind `(click)` on the same element?',
      a: "Yes, and there's no winner to pick. Property-style bindings like `[style.*]` and `[class.*]` write to a single slot, so the last one in overwrites the rest — but every `(event)` listener bound to an element runs, host directive and component alike. Precedence only exists where there's a single slot to fight over.",
    },
    {
      q: 'Does `hostDirectives` only work on components, or can a directive use it too?',
      a: "Both. A `@Directive` can declare `hostDirectives` exactly like a `@Component` can — that's what lets the pattern nest at all (`Interactive` composing `Ripple`, above). A component just happens to be the more common place you'll reach for it.",
    },
    {
      q: 'Why must a host directive be standalone?',
      a: "The compiler inlines `hostDirectives` straight into the host's own definition at compile time, with no runtime registration step. There's no `NgModule` left in that process to resolve a non-standalone directive through — hence **NG2014**.",
    },
    {
      q: 'When is inheritance still the right call?',
      a: "When you're sharing class logic — methods, injected services, computed state — rather than host behavior. `hostDirectives` can't hand you a base class's methods or its template; a plain abstract base with no host bindings is still completely fine for that.",
    },
  ];
}
