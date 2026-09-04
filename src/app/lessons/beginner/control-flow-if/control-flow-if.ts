import { Component, ElementRef, effect, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { ToggleChild } from './toggle-child/toggle-child';

/**
 * The demo's user, deliberately nullable so `@if (user(); as u)` has
 * something worth narrowing away.
 */
interface User {
  name: string;
  role: 'admin' | 'member';
}

/**
 * Lesson: the built-in `@if` / `@else if` / `@else` control-flow block.
 *
 * Covers the syntax, then the four things that actually cost people marks: the
 * `; as` alias is not a DRY nicety but the only thing that makes
 * `@if (user()) { user().name }` *compile* under `strictTemplates` (TypeScript
 * cannot narrow through a function call); a false branch does not hide, it
 * **destroys** — DOM, component instances, signals and any `viewChild()`
 * pointed inside it, all gone, and rebuilt from nothing on the way back;
 * the condition itself is not evaluated once, it reruns on every
 * change-detection pass that reaches this view, which is a live proof that a
 * signal read inside it behaves completely differently from a plain field
 * read there; and the `*ngIf` → `@if` migration, including the then/else
 * template-ref pattern `@if` replaced.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the problem before naming it.** A template can only show one
 *    version of itself at a time — so what happens to the version that
 *    isn't showing? The reader commits to a guess on a napkin before the
 *    live proof arrives, several sections later.
 * 2. **Analogy before vocabulary.** `@if` is framed as an eviction —
 *    changing the locks and clearing the room — against `[hidden]`'s closed
 *    blinds, where the tenant never left. That contrast is what the whole
 *    lesson hangs off, and it is restaged as a dialogue between the two
 *    APIs before a single demo runs.
 * 3. **Then the same idea in several modes**: a dialogue, a compiled-output
 *    walkthrough, a step diagram of the scheduling path, and four separate
 *    live demos, each proving one consequence of "false destroys" rather
 *    than asserting it.
 * 4. **Every substantial snippet is annotated line by line** via
 *    `app-code-lab`; short two-sided contrasts use `app-compare` instead,
 *    matching the precedent in `lessons/beginner/signals`.
 *
 * ## Demos on this page
 *
 * - the login chain (`user`, `logIn`) — the original demo, kept, now
 *   annotated by an `app-code-lab` right above it;
 * - the truthiness trap (`count`) — the original demo, kept, now paired with
 *   an `app-compare` showing the *compile-time* reason `; as` exists, not
 *   just the runtime one;
 * - **scheduling**: a signal-gated branch against a plain-field-gated one
 *   (`readySignal` / `readyPlain`), proving a condition reruns only when
 *   something actually causes a pass to reach it;
 * - the destroy-vs-hide split (`showBoxes`) — the original demo, kept, now
 *   extended with `ToggleChild` so the "state is destroyed" claim is proven
 *   twice over: lost text, and a freshly constructed child that refetches;
 * - **refs get evicted too**: a `viewChild()` (`refBox`) pointed inside the
 *   `@if` branch, `undefined` while it's false, and reacted to with an
 *   `effect()` rather than polled from `ngOnInit`.
 */
@Component({
  selector: 'app-lesson-control-flow-if',
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
    ToggleChild,
  ],
  styleUrl: './control-flow-if.css',
  templateUrl: './control-flow-if.html',
})
export class ControlFlowIf {
  // ── Demo 1: the login chain ────────────────────────────────────────────────

  /** The signed-in user, or `null`. Starts `null` so the demo opens on `@else`. */
  protected readonly user = signal<User | null>(null);

  /**
   * Signs a user in with the given role.
   *
   * @param role Which role to sign in as.
   */
  protected logIn(role: 'admin' | 'member'): void {
    this.user.set({ name: role === 'admin' ? 'Root' : 'Sam', role });
  }

  // ── Demo 2: the truthiness trap ────────────────────────────────────────────

  /** Drives the `; as` truthiness-trap demo. */
  protected readonly count = signal(3);

  // ── Demo 3: scheduling — signal-gated vs plain-field-gated ────────────────

  /** The honest gate: reading it inside `@if` registers this view as a consumer. */
  protected readonly readySignal = signal(false);

  /** The trap: a plain field. Nothing about reading it inside `@if` registers anything. */
  protected readyPlain = false;

  /**
   * Flips {@link readyPlain} from inside a `setTimeout`.
   *
   * Asynchronous on purpose, exactly like the change-detection and signals
   * lessons' equivalent demos: no click-triggered pass to piggyback on, no
   * signal to notify anyone. The field really changes; nothing renders it.
   */
  protected flipPlainSilently(): void {
    // async on purpose: no event, no signal → nothing schedules or marks
    setTimeout(() => {
      this.readyPlain = !this.readyPlain;
    });
  }

  /**
   * Does nothing, deliberately.
   *
   * Clicking it still triggers a change-detection pass — a template event
   * listener marks its view and schedules a pass regardless of whether the
   * handler changed anything — which is what finally lets the plain-gated
   * panel catch up to reality.
   */
  protected nudge(): void {}

  // ── Demo 4: destroy vs hide ────────────────────────────────────────────────

  /**
   * Drives the destroy-vs-hide demo.
   *
   * `@if` **removes** the element from the DOM, destroying the component and
   * its state, whereas `[hidden]`/`display:none` leaves it alive and merely
   * invisible. Toggling this and watching `ToggleChild`'s instance number
   * climb on one side and sit still on the other is the difference made
   * concrete a second way.
   */
  protected readonly showBoxes = signal(true);

  // ── Demo 5: refs get evicted too ───────────────────────────────────────────

  /** Gates the branch the ref lives inside. Starts open so there's something to type into. */
  protected readonly showRefBox = signal(true);

  /** The input inside the `@if` branch — `undefined` whenever that branch is false. */
  protected readonly refBox = viewChild<ElementRef<HTMLInputElement>>('refBox');

  /** What the last "check the ref right now" press found. */
  protected readonly refCheck = signal('— press the button to find out —');

  /** Recent transitions of {@link refBox} from `undefined` to defined, newest first. */
  protected readonly refAppearances = signal<string[]>([]);

  /** Reads {@link refBox} right now, synchronously, from a click handler. */
  protected checkRef(): void {
    const el = this.refBox();
    this.refCheck.set(
      el
        ? `found it — its value is "${el.nativeElement.value || '(empty)'}"`
        : "undefined — the branch is false, so there's nothing there to find",
    );
  }

  /**
   * Reacts to {@link refBox} the moment it actually has a value.
   *
   * An `effect()` in the constructor, not a check in `ngOnInit` — `ngOnInit`
   * runs exactly once, at component creation, long before a conditionally
   * rendered ref could possibly exist. An effect reruns automatically every
   * time the signal it reads changes, which is what "react to a viewChild"
   * has to mean once the thing it queries can appear and disappear.
   */
  constructor() {
    effect(() => {
      const el = this.refBox();
      if (el) {
        this.refAppearances.update((log) =>
          [`ref appeared — value starts as "${el.nativeElement.value || '(empty)'}"`, ...log].slice(
            0,
            4,
          ),
        );
      }
    });
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Control Flow track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: '@if / @else' },
    { label: '@for', id: 'control-flow-for' },
    { label: '@switch', id: 'control-flow-switch' },
    { label: '@let', id: 'let-block' },
  ];

  /**
   * The eviction, staged as an argument between the two APIs.
   *
   * The relationship a beginner reliably gets backwards is that `[hidden]`
   * "does less" than `@if` and is therefore the safe default. Staged as
   * dialogue, each side gets to state its own contract with the DOM in its
   * own words, and the asymmetry — one rebuilds, one remembers — becomes the
   * thing the reader takes away rather than a rule they have to memorise.
   */
  protected readonly evictionTalk: BubbleTurn[] = [
    {
      who: '@if',
      says: "False? Then you don't exist any more. I tear your DOM out, and every bit of state inside it goes with it.",
    },
    {
      who: '[hidden]',
      says: "I just toggle `display: none`. You're still standing exactly where you were — only invisible.",
    },
    {
      who: '@if',
      says: 'Flip me back true and you get a stranger. Same markup on the page, but a brand-new instance underneath: fresh state, fresh everything.',
    },
    {
      who: '[hidden]',
      says: "Flip me back and it's the same tenant. Same scroll position, same half-typed input, like nothing happened.",
    },
    {
      who: '@if',
      says: 'Which is exactly why nobody should reach for me on a toggle they flip fifty times a minute.',
    },
    {
      who: '[hidden]',
      says: 'And exactly why nobody should reach for me when what they actually need is that subscription torn down.',
    },
  ];

  /**
   * Sample: the full `@if` / `@else if` / `@else` chain with an `as` alias —
   * the syntax reference for the login demo directly below it.
   */
  protected readonly basicSample = `@if (user(); as u) {
  <p>Welcome, {{ u.name }}</p>
} @else if (loading()) {
  <p>Loading…</p>
} @else {
  <p>Please log in</p>
}`;

  /** Line-by-line walkthrough of {@link basicSample}. */
  protected readonly basicNotes: CodeNote[] = [
    {
      line: 1,
      text: '`@if` takes any template expression. `user()` is a signal call, so this whole block re-evaluates on its own whenever that signal changes — exactly when, and why a plain field would not, gets its own section further down. `; as u` captures the **result** of the condition in `u`, a new read-only template variable scoped to this block.',
    },
    {
      line: 2,
      text: "`u` is `user()`'s result, already captured — never `user()!.name`, never a second call. The block only exists while `user()` was truthy, so treat `u` as narrowed to non-null here.",
    },
    {
      line: 3,
      text: "`@else if` reruns its own condition — `loading()` — only when `user()` was falsy. Branches are checked top to bottom and exactly one runs. It must open on the **same line** as the previous block's closing `}`; a line break there is a compile error.",
    },
    {
      line: 5,
      text: 'A bare `@else`, reached only when every condition above it was falsy. `@else` cannot appear on its own — it must attach directly to an `@if` (or an `@else if`) with nothing between them, not even a whitespace text node with real content in it.',
    },
    {
      line: 7,
      text: "The chain ends here. Unlike `*ngIf`, nothing was imported to make any of this work — `@if` is compiler syntax, always available, and the branches that don't win are never created in the DOM at all.",
    },
  ];

  /**
   * Sample: what the compiler turns a two-branch `@if` into — one template
   * function per branch, plus a single instruction that decides which one is
   * active.
   */
  protected readonly compiledSample = `function Greeting_Template(rf: RenderFlags, ctx: Greeting) {
  if (rf & RenderFlags.Create) {
    ɵɵtemplate(0, Greeting_Conditional_0_Template, 2, 1);
    ɵɵtemplate(1, Greeting_Conditional_1_Template, 1, 0);
  }
  if (rf & RenderFlags.Update) {
    ɵɵconditional(ctx.user() ? 0 : 1);
  }
}

function Greeting_Conditional_0_Template(rf: RenderFlags, ctx: Greeting) {
  if (rf & RenderFlags.Create) {
    ɵɵelementStart(0, 'p');
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & RenderFlags.Update) {
    ɵɵadvance(1);
    ɵɵtextInterpolate1('Welcome, ', ctx.user().name, '');
  }
}`;

  /** Line-by-line walkthrough of {@link compiledSample}. */
  protected readonly compiledNotes: CodeNote[] = [
    {
      line: 1,
      text: "`Greeting_Template` is the compiled form of the whole component template — the same shape as the change-detection lesson's `Counter_Template`. `rf` is a bitmask saying which mode to run; `ctx` is the component instance, so `ctx.user` is your field.",
    },
    {
      line: 3,
      text: "`ɵɵtemplate` runs once, at **Create**, and just registers the `@if` branch's own template function under slot `0` — it does not run that function yet. The `2, 1` are the DOM-node count and binding count that branch needs, worked out at compile time.",
    },
    {
      line: 4,
      text: 'Slot `1` is the `@else` branch, registered exactly the same way. Two branches, two separate functions, both declared up front. Deciding which one is **active** is a completely separate step, four lines down.',
    },
    {
      line: 6,
      text: 'The **Update** branch — this is what runs on every single pass that reaches this view.',
    },
    {
      line: 7,
      text: '`ɵɵconditional` is the entirety of `@if`/`@else`, reduced to one call. It reruns `ctx.user()` and picks the matching slot: `0` for truthy, `1` for falsy. Pass the same slot as last time and nothing happens. Pass a **different** one and the previously-active view is destroyed and the new one is created — this single call is the eviction from the analogy above, expressed as one line of compiled code.',
    },
    {
      line: 11,
      text: "The winning branch's own template function, declared above and invoked only once `ɵɵconditional` picks slot `0`. Everything from here down exists only while this branch is the active one.",
    },
    {
      line: 13,
      text: "This branch's own **Create** pass — building its `<p>` and its text node — the exact same create/update split as any other view, just for a view that can be torn down as a whole rather than merely re-checked.",
    },
    {
      line: 19,
      text: "This branch's own **Update** pass, which reruns every time *this branch is active* and a change-detection pass reaches it. `ctx.user().name` is read fresh here, same as any binding — which is exactly the repeated call the `; as` alias exists to avoid.",
    },
  ];

  /** Sample: `@if` with the `async` pipe, unwrapping an observable once into a non-null binding. */
  protected readonly asyncSample = `@if (user$ | async; as user) {
  <h2>{{ user.name }}</h2>
}`;

  /** Sample: the compiler rejects narrowing through a repeated function call. */
  protected readonly noAliasSample = `@if (user()) {
  <p>{{ user().name }}</p>   <!-- Object is possibly 'null'. ts(2531) -->
}`;

  /** Sample: capturing the call's result once fixes it. */
  protected readonly withAliasSample = `@if (user(); as u) {
  <p>{{ u.name }}</p>        <!-- u is narrowed — this compiles -->
}`;

  /** What actually has to happen for a signal-gated `@if` condition to rerun. */
  protected readonly schedulingSteps: FlowStep[] = [
    {
      label: 'Read inside the condition',
      detail: '`readySignal()` registers this view as a consumer',
    },
    {
      label: 'Write, from anywhere',
      detail: '`.set()` or `.update()` — even from an unrelated component or service',
      tone: 'accent',
    },
    {
      label: 'View marked + pass scheduled',
      detail: 'Only because this view was a registered consumer of that exact signal',
      tone: 'warn',
    },
    {
      label: 'The pass reaches this view',
      detail: 'Its whole update block reruns — every binding, not just this one',
    },
    {
      label: 'Condition re-evaluated',
      detail: '`ɵɵconditional` picks a branch again, using the fresh value',
      tone: 'good',
    },
  ];

  /** The self-test on scheduling — the distractors are the three ways people mis-time this. */
  protected readonly schedulingOptions: QuizOption[] = [
    {
      text: 'It flips to `true` immediately — the field really changed.',
      why: 'The field really did change; the **screen** is what has not. Angular only reruns a condition during a pass, and a plain assignment inside a `setTimeout` schedules nothing — reading and rendering are different moments here.',
    },
    {
      text: 'It keeps showing `false` until something else causes a pass — then it catches up.',
      correct: true,
      why: "Exactly. The write isn't lost, it's unannounced. The very next pass — triggered by literally anything, including the unrelated no-op button — reruns this view's update block, rereads the plain field during it, and the branch flips to match.",
    },
    {
      text: 'It throws an error, because the condition changed after the view was already checked.',
      why: "That's NG0100's trigger, and NG0100 needs the value to change **during** a pass, so dev mode's same-pass verification run disagrees with itself. A `setTimeout` fires long after the pass has finished — no disagreement, no error, just a screen that quietly disagrees with memory.",
    },
    {
      text: "Nothing — Angular doesn't allow plain fields inside `@if` conditions.",
      why: "`@if` accepts any expression; it compiles and runs fine. The problem was never legality — it's that nothing about a plain field can notify anyone when it changes.",
    },
  ];

  /** Sample: the condition itself doing real, repeated work. */
  protected readonly expensiveConditionSample = `@if (items().filter(i => i.active).length > 0) {
  <p>Something needs your attention.</p>
}`;

  /** Sample: the fix — a `computed()` `@if` just reads. */
  protected readonly cheapConditionSample = `readonly hasActive = computed(() =>
  items().some(i => i.active)
);

@if (hasActive()) {
  <p>Something needs your attention.</p>
}`;

  /** Sample: the legacy `*ngIf` then/else template-ref pattern. */
  protected readonly legacySample = `<!-- else lives in a SEPARATE named ng-template -->
<div *ngIf="user$ | async as user; else loading">
  {{ user.name }}
</div>
<ng-template #loading><spinner /></ng-template>`;

  /** Sample: the same behaviour, migrated to `@if`/`@else`. */
  protected readonly modernSample = `<!-- inline, no ng-template, nothing to keep in sync -->
@if (user$ | async; as user) {
  <div>{{ user.name }}</div>
} @else {
  <spinner />
}`;

  /** The self-test on the truthiness trap and why `; as` alone doesn't save it. */
  protected readonly truthinessOptions: QuizOption[] = [
    {
      text: '`0 items` — the alias correctly captures a valid `0`.',
      why: "This is the trap. `; as` only decides what NAME the result gets **once the block is already showing** — it does nothing to change whether `0` passes the truthiness check in the first place, and `0` never passes. Nobody's block runs, so nobody's alias ever captures anything.",
    },
    {
      text: 'A compile error, because `0` is not assignable to a boolean condition.',
      why: '`@if` accepts any expression, boolean or not — nothing here is being typed-checked against `boolean`. It compiles fine and picks a branch at runtime purely by truthiness, and `0` truthily loses.',
    },
    {
      text: '`none` — the `@else` branch runs, because `0` is falsy.',
      correct: true,
      why: "Right. `; as` never changes what counts as truthy; it only names the result **when** the block already won. `0`, `''` and `false` are all falsy despite being real, valid values — test explicitly (`count() !== null`) when a value type could legitimately be one of them.",
    },
    {
      text: 'It throws NG0100, because `c` was read before it was assigned.',
      why: '`c` is never read at all here — the `@else` branch runs instead, and `c` is never created. NG0100 is about a binding changing mid-pass; nothing here does that.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why did my block vanish when the value is a perfectly legitimate `0`?',
      a: "`@if (n(); as x)` — and a plain `@if (n())` — both test for **truthiness**, and `0`, `''` and `false` are all falsy even though they're real, valid values. Test explicitly instead: `@if (n() !== null)` or `@if (n() >= 0)`.",
    },
    {
      q: 'Does `@if` hide the element, or actually remove it?',
      a: "Remove, completely. The false branch's DOM nodes, any component instances inside it, and all of their state are destroyed — not paused, not hidden, gone. `[hidden]` or `display: none` is what keeps something alive but invisible.",
    },
    {
      q: '`@if (user())` guards the block right above `{{ user().name }}` — why does that still fail to compile?',
      a: "Because TypeScript can't narrow the result of a **function call**. `user()` being truthy on the condition line tells the compiler nothing about what a second, separate call to `user()` inside the block will return — for all it knows, another call could return something else entirely. Capture the result once with `; as` (or `@let`) and narrow *that* variable, not the call.",
    },
    {
      q: 'My `viewChild()` for something inside an `@if` keeps coming back `undefined`. What am I doing wrong?',
      a: "Probably nothing — that's correct while the branch is false, and it can stay `undefined` for a beat even right after the branch turns true, until a change-detection pass has actually built the view. Read the query from an `effect()`, which reruns the moment the signal changes, rather than `ngOnInit`, which runs exactly once, at the very start, long before a conditional branch has necessarily rendered anything.",
    },
    {
      q: 'What replaced `*ngIf="x; else tpl"` and its `<ng-template>`?',
      a: "An inline `@else` block — `@if (x) { … } @else { … }` — with no separate template and no reference variable to keep in sync. `ng generate @angular/core:control-flow` rewrites a whole project's `*ngIf`/`*ngFor`/`*ngSwitch` to the block syntax automatically.",
    },
  ];
}
