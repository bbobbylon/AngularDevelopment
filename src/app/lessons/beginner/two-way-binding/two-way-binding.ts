import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';
import { Stepper } from './stepper/stepper';

/**
 * Lesson: two-way binding, from the syntax sugar down to the emission rules —
 * and the failure mode that shows up the moment a parent is allowed to say no.
 *
 * Covers the exact desugaring of `[(x)]`, the `x`/`xChange` naming contract, the
 * `model()` API in depth (including when `valueChange` does and does NOT fire),
 * splitting the banana to intercept writes — and what actually happens to the
 * child when the parent rejects a value, which the lesson now demonstrates live
 * rather than leaving as an exercise for later. Also: `model()` versus writing a
 * real `ControlValueAccessor`, when `input()` + `output()` (or `linkedSignal()`)
 * is the better call than `model()`, `[(ngModel)]` with `ngModelOptions`, the
 * assignability rule, and the legacy `@Input`/`@Output` pattern.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order:
 *
 * 1. **Pose the problem first.** One-way binding gets data down and events up —
 *    but keeping one value in sync in *both* directions by hand means writing the
 *    same handler everywhere a value is owned by a parent and edited by a child.
 *    The reader is asked to guess the desugaring before it is shown.
 * 2. **Analogy before vocabulary.** "Banana in a box" — Angular's own metaphor for
 *    `[(x)]` — gets a real diagram: two parallel channels, the box (`[value]`,
 *    always down) and the banana (`(valueChange)`, always up), glued into one
 *    piece of syntax by a strict naming rule the compiler enforces.
 * 3. **Then the failure mode, live.** The split-banana "clamp" demo is the same
 *    demo the un-migrated lesson shipped — restyled here to also expose what it
 *    was already doing wrong: reading the child's own displayed number next to
 *    the parent's, so a rejected write's desync is something the reader watches
 *    happen rather than something the lesson merely asserts.
 * 4. **Every substantial snippet is annotated line by line** via `app-code-lab`.
 *
 * ## Demos on this page
 *
 * - the basic `[(value)]="count"` two-way bind to `<app-stepper>` — the original
 *   demo, kept;
 * - "who triggers `valueChange`" — the original demo, kept, now paired with a
 *   quiz on the emission asymmetry it proves;
 * - the split-banana clamp demo — the original demo, kept, now also reading the
 *   child's own value through a template reference so the desync is visible;
 * - the `[(ngModel)]` field grid (text, blur-committed text, select, checkbox) —
 *   the original demo, kept, with a "Clear (from code)" button added to make the
 *   scheduled-write note concrete.
 */
@Component({
  selector: 'app-lesson-two-way-binding',
  imports: [
    RouterLink,
    FormsModule,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Predict,
    Quiz,
    Remember,
    Stepper,
  ],
  styleUrl: './two-way-binding.css',
  templateUrl: './two-way-binding.html',
})
export class TwoWayBinding {
  /**
   * The plainly-bound value in the basic `[(value)]` demo.
   */
  protected readonly count = signal(5);

  // --- emission-rules demo ---
  /**
   * The value in the emission-rules demo.
   */
  protected readonly logged = signal(5);
  /**
   * A log of what emitted and what did not — the demo's actual output.
   */
  protected readonly log = signal<string[]>([]);
  /**
   * Handles a change that came **from the child**, and logs it.
   *
   * @param v The new value.
   */
  onLoggedChange(v: number) {
    this.logged.set(v);
    this.log.update((l) => [`valueChange emitted: ${v}  (child clicked)`, ...l].slice(0, 8));
  }
  /**
   * Writes the value **from the parent** and logs that no `valueChange` fired.
   *
   * The asymmetry is the lesson: a `model()` emits when the *child* writes it, not
   * when the parent does. Otherwise binding a parent's write back into its own
   * handler would loop.
   */
  setFromParent() {
    this.logged.set(42);
    this.log.update((l) => ['parent wrote 42 — input updated, NO valueChange', ...l].slice(0, 8));
  }

  // --- split-banana clamp demo ---
  /**
   * The value in the clamping demo — the parent's authoritative copy.
   */
  protected readonly clamped = signal(5);
  /**
   * Sets the value, clamped to 0–10.
   *
   * The reason to split `[(x)]` into `[x]` and `(xChange)`: the sugar writes every
   * emission straight into state, so there is nowhere to reject or adjust one. The
   * long form gives you that seam back — **but see the section below**: giving a
   * value back the seam does not, on its own, stop the child from disagreeing
   * with you about what the value is.
   *
   * @param v The value the child proposed.
   */
  setClamped(v: number) {
    this.clamped.set(Math.max(0, Math.min(10, v)));
  }

  // --- ngModel demos ---
  /**
   * Text bound with `[(ngModel)]` on each keystroke.
   */
  protected readonly text = signal('');
  /**
   * Text bound with `[(ngModel)]` on blur, to contrast the update timing.
   */
  protected readonly blurText = signal('');
  /**
   * The `[(ngModel)]` select demo's value.
   */
  protected readonly framework = signal('signals');
  /**
   * The `[(ngModel)]` checkbox demo's value.
   */
  protected readonly agree = signal(false);

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Data Binding track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Property Binding', id: 'property-binding' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding' },
    { label: 'Class & Style', id: 'class-style-binding' },
  ];

  /**
   * The four-turn exchange that stages the naming contract and, in its last
   * line, foreshadows the emission asymmetry the "who triggers valueChange"
   * demo proves a few sections down.
   */
  protected readonly bananaTalk: BubbleTurn[] = [
    {
      who: 'Parent',
      says: "Here's the value. I'm handing it to you through `[value]`.",
    },
    {
      who: 'Child',
      says: "Got it. If I ever change it myself, I'll shout back through `(valueChange)`.",
    },
    {
      who: 'Parent',
      says: "I'm listening for that — the moment you shout, I'll update my own copy to match.",
    },
    {
      who: 'Child',
      says: "But if **you** change your copy instead, I won't shout back. I just quietly show whatever you send.",
    },
  ];

  /**
   * Sample: `[(value)]` desugared into its `[value]` + `(valueChange)` pair,
   * plus the signal-aware form of the write-back.
   */
  readonly desugarSample = `<app-stepper [(value)]="count" />

<!-- desugars to -->
<app-stepper [value]="count" (valueChange)="count = $event" />

<!-- and because count is a WritableSignal, the write-back becomes -->
<app-stepper [value]="count()" (valueChange)="count.set($event)" />`;

  /** Line-by-line walkthrough of {@link desugarSample}. */
  readonly desugarNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The banana in the box: `( )` — an event binding — sitting inside `[ ]` — a property binding. `value` is the **input** name; the compiler derives the output name from it.',
    },
    {
      line: 4,
      text: 'The exact expansion. `[value]` is an ordinary property binding, reading down. `(valueChange)` is an ordinary event binding, writing up — and that name is not a guess: it is always the input name plus the literal suffix `Change`.',
    },
    {
      line: 7,
      text: "`count()` reads the signal's current value for the down arrow. `count.set($event)` is what the compiler actually emits for the up arrow when the bound expression is a `WritableSignal` — a plain assignment would not compile against a signal.",
    },
  ];

  /**
   * Sample: the `model()` API, including `model.required()` and `alias`.
   */
  readonly modelApiSample = `export class Stepper {
  value = model(0);                          // creates input "value" + output "valueChange"
  size  = model.required<number>();          // parent MUST bind it, or NG8008 at compile time
  width = model(0, { alias: 'dimension' });  // parent binds [(dimension)] instead

  inc() {
    this.value.update((v) => v + 1);         // child-side write → valueChange emits
  }
}

// value is a full signal inside the child too:
readonly doubled = computed(() => this.value() * 2);  // reacts to parent AND child writes`;

  /** Line-by-line walkthrough of {@link modelApiSample}. */
  readonly modelApiNotes: CodeNote[] = [
    {
      line: 2,
      text: 'One call creates **both** halves at once: an input named `value`, seeded with `0`, and an output named `valueChange` that nothing here writes to directly.',
    },
    {
      line: 3,
      text: '`model.required<number>()` — no default, so the parent is compiler-required to bind it. Mirrors `input.required()`; skipping the binding is `NG8008`, caught before the app ever runs.',
    },
    {
      line: 4,
      text: "`{ alias: 'dimension' }` renames the **public** binding names — the parent writes `[(dimension)]` — while the field inside this class stays `width`.",
    },
    {
      line: 7,
      text: 'A **child-side write**. `.update()` (or `.set()`) on a `model()` is exactly the kind of write that fires the implicit `valueChange` — the thing the next demo puts a number on.',
    },
    {
      line: 12,
      text: "Inside the child, `value` is a genuine signal — `this.value()` is a legal read anywhere a signal read is legal, including a `computed()`. It isn't a plain field with two extra decorators bolted on.",
    },
  ];

  /**
   * Sample: splitting the banana-in-a-box to intercept a change before it lands.
   */
  readonly splitBananaSample = `<!-- sugar: every child emission lands in state unchecked -->
<app-stepper [(value)]="clamped" />

<!-- explicit pair: the parent owns the policy -->
<app-stepper #ref [value]="clamped()" (valueChange)="setClamped($event)" />`;

  /** Line-by-line walkthrough of {@link splitBananaSample}. */
  readonly splitBananaNotes: CodeNote[] = [
    {
      line: 1,
      text: '"Unchecked" is doing real work in this comment — it\'s the seed of the failure mode the next section demonstrates live.',
    },
    {
      line: 2,
      text: 'The sugar form: every proposal the child makes is written straight into `clamped`, with no step in between where the parent could refuse.',
    },
    {
      line: 5,
      text: 'Splitting `[(x)]` back into `[x]` + `(xChange)` gives the seam back: `setClamped($event)` runs **before** anything lands in state, so it can clamp, reject, or transform the proposal. `#ref` is a template reference to the child instance itself — used just below to read what the child is *actually* showing.',
    },
  ];

  /**
   * Sample: `[(ngModel)]` and the `FormsModule` import it needs.
   */
  readonly ngModelSample = `import { FormsModule } from '@angular/forms';
// add FormsModule to the component's imports array

<input [(ngModel)]="text" />                              <!-- text: string -->
<input type="checkbox" [(ngModel)]="agree" />             <!-- boolean -->
<select [(ngModel)]="framework"> ... </select>            <!-- option value -->

<!-- commit on blur instead of every keystroke -->
<input [(ngModel)]="draft" [ngModelOptions]="{ updateOn: 'blur' }" />

<!-- inside a <form>: a name is required (or opt out with standalone) -->
<form>
  <input name="email" [(ngModel)]="email" />
  <input [(ngModel)]="scratch" [ngModelOptions]="{ standalone: true }" />
</form>`;

  /** Line-by-line walkthrough of {@link ngModelSample}. */
  readonly ngModelNotes: CodeNote[] = [
    {
      line: 1,
      text: "`FormsModule` is what puts the `NgModel` directive in template scope. A standalone component sees nothing by default, so it has to be added to **this** component's own `imports` array — the exact list at the top of the `.ts` file.",
    },
    {
      line: 4,
      text: '`NgModel` adapts a native `<input>` to the same `[(x)]` contract you just saw for a custom component — except the output it desugars to is always spelled `ngModelChange`, never a made-up `xChange`.',
    },
    {
      line: 5,
      text: 'On a checkbox the same directive reads and writes the DOM `checked` property instead of `value` — the accessor underneath is type-aware, not a one-size-fits-all string binding.',
    },
    {
      line: 6,
      text: 'On a `<select>`, it reads back whichever `<option [value]>` currently matches.',
    },
    {
      line: 9,
      text: '`[ngModelOptions]="{ updateOn: \'blur\' }"` changes **when** the write-back happens: not on every keystroke, only once the field loses focus.',
    },
    {
      line: 13,
      text: 'A `name` attribute registers this control with the parent `NgForm` under that name — required on any `ngModel` that sits inside a `<form>`.',
    },
    {
      line: 14,
      text: '`{ standalone: true }` opts a control out of that registration entirely, so it can skip the `name` attribute — useful for a field the surrounding form should not track.',
    },
  ];

  /**
   * Sample: the legacy `@Input()` + `@Output() xChange` pair, and the naming rule
   * that made the sugar work before `model()` existed.
   */
  readonly legacySample = `export class Stepper {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();  // name MUST be value + "Change"

  inc() {
    this.value++;
    this.valueChange.emit(this.value);  // forget this line → parent silently desyncs
  }
}`;

  /** Line-by-line walkthrough of {@link legacySample}. */
  readonly legacyNotes: CodeNote[] = [
    {
      line: 2,
      text: '`@Input()` alone only ever handles the **down** direction — a decorator marking `value` as bindable from a parent. Nothing here notifies anyone of anything.',
    },
    {
      line: 3,
      text: '`@Output()` pairs it by hand. `EventEmitter<number>` is what a `(valueChange)` in a parent template actually listens to — and the name has to be `value` + the literal word `Change`, by convention only. Nothing checks it at compile time the way `model()` does.',
    },
    {
      line: 6,
      text: 'A plain increment on a plain field. On its own, this is invisible to any parent, exactly like the plain-field demos in the Change Detection lesson.',
    },
    {
      line: 7,
      text: "This line is the whole difference from `model()`: nothing emits automatically, so **you** must call `.emit()` on every write that should be announced — miss it once and the parent's copy silently falls behind with no error anywhere.",
    },
  ];

  /** Code shown inside the `@for` assignability {@link Predict}. */
  readonly forLoopPredictCode = `@for (item of items(); track item.id) {
  <input [(ngModel)]="item" />        <!-- ??? -->
  <input [(ngModel)]="item.name" />   <!-- ??? -->
}`;

  /**
   * The self-test: the emission asymmetry the "who triggers valueChange" demo
   * just proved. The distractor options are the two mistakes learners actually
   * make — assuming any change fires the event, and assuming a parent write is
   * somehow illegal rather than merely silent.
   */
  readonly quizOptions: QuizOption[] = [
    {
      text: 'It emits 42 on `valueChange`, because the value changed.',
      why: 'A value changing is not what fires the output — where the write **came from** is. `model()` only announces writes made from **inside** the child; if a parent write emitted too, binding a value back to its own handler could recurse forever.',
    },
    {
      text: "Nothing fires. The child's input updates to 42, and no event is emitted.",
      correct: true,
      why: 'Exactly — and this is the whole reason `model()` is safe to bind to your own state with no infinite loop: writing a value **into** the binding never triggers the event that would write it back **out**.',
    },
    {
      text: 'It throws, because you wrote to a `model()` field from outside the component.',
      why: "Writing the bound expression from a parent is completely ordinary — that's the entire point of an input. What `model()` guards is only which writes get **announced**, never who is allowed to write in.",
    },
    {
      text: 'It emits once immediately, then queues a second emission for the next render.',
      why: "There's no queued emission waiting anywhere. The rule has no timing component: an emission happens if and only if the write originated inside the child, full stop.",
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  readonly questions: FaqItem[] = [
    {
      q: 'What does `[(visible)]="show"` expand to, exactly?',
      a: '`[visible]="show" (visibleChange)="show = $event"` — and if `show` is a writable signal, the write-back compiles to `show.set($event)` instead of a plain assignment. The output name is always the input name plus the literal suffix `Change`.',
    },
    {
      q: 'Does `valueChange` fire when the parent changes the value?',
      a: "No — never. `model()` emits only for child-originated writes (`.set()`/`.update()` called inside the component that owns the model). A parent's write flows in through the input half silently, or two-way binding a value to its own state would loop forever.",
    },
    {
      q: 'Why does `[(value)]="count()"` fail to compile?',
      a: '`count()` is a call expression — there is nothing on the left of an implied `=` to assign back into. Bind the signal itself: `[(value)]="count"`. Angular detects that it\'s a `WritableSignal` and writes through `.set()` for you.',
    },
    {
      q: "I got NG8002: Can't bind to 'ngModel'. First thing to check?",
      a: "Whether `FormsModule` is in **this** component's own `imports` array. Without it, the `NgModel` directive isn't in the template's scope at all, so `ngModel` reads to the compiler as an unrecognised property of `<input>`.",
    },
    {
      q: 'Do I ever need to write a real `ControlValueAccessor` instead of `model()`?',
      a: 'Yes — the moment your component needs to work inside a `<form>`, as `[(ngModel)]="x"` or `[formControlName]="x"` on your own component rather than a native one. `model()` only ever gives you `[(x)]`; a `ControlValueAccessor` is what plugs a component into the forms machinery — validators, `dirty`/`touched`, disablement. The full implementation is the Custom Form Controls lesson.',
    },
  ];
}
