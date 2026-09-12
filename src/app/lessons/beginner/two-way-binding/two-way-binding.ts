import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BfPage, Chapter, CodeLab } from '../../../shared/brain';
import type { ChapterStop, CodeNote } from '../../../shared/brain';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { Stepper } from './stepper/stepper';

/**
 * Lesson: two-way binding, from the syntax sugar down to the emission rules.
 *
 * Covers the exact desugaring of [(x)], the x/xChange naming contract, the
 * model() API in depth (including when valueChange does and does NOT fire),
 * splitting the banana to intercept writes, ngModel with ngModelOptions,
 * the assignability rule, the legacy @Input/@Output pattern, and the
 * pitfalls that show up in exams and code review.
 *
 * The Stepper below is a real child component used by several live demos.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer. One analogy replaces "it's like a
 * mirror" (the intuitive but WRONG mental model, since a mirror updates both
 * ways symmetrically): **two pipes, glued together.** `[(x)]` looks like one
 * wire, but it is an inbound pipe (`[x]`, parent → child) and an outbound
 * pipe (`(xChange)`, child → parent) fused by syntax, not by behaviour.
 * Water only leaves the outbound pipe when the CHILD pours something in —
 * the inbound pipe filling up never spills into it. That single image pays
 * for the lesson's two hardest facts: why a parent's write never fires
 * `valueChange` (it only ever uses the inbound pipe — see the opening
 * Predict and the two Flow diagrams), and what "splitting the banana"
 * literally means (unglue the two pipes and put a valve on the outbound
 * one, which is exactly the clamping demo).
 */
@Component({
  selector: 'app-lesson-two-way-binding',
  imports: [
    RouterLink,
    FormsModule,
    Stepper,
    BfPage,
    Chapter,
    CodeLab,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
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
   * The value in the clamping demo.
   */
  protected readonly clamped = signal(5);
  /**
   * Sets the value, clamped to 0–10.
   *
   * The reason to split `[(x)]` into `[x]` and `(xChange)`: the sugar writes every
   * emission straight into state, so there is nowhere to reject or adjust one. The
   * long form gives you that seam back.
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
   * The log for the sync-vs-microtask readback demo — proof that `[ngModel]`'s
   * write into the DOM lands one microtask after the signal itself changes.
   */
  protected readonly clearLog = signal<string[]>([]);

  /**
   * Clears {@link text} and reads the input's real DOM value twice: once
   * synchronously, right after the write, and once more after a microtask has
   * had a chance to run.
   *
   * `NgModel` defers the actual `element.value = ...` write inside a
   * `Promise.resolve().then(...)` — the same trick `template-forms` documents
   * for control *registration* — specifically to avoid clashing with the
   * change-detection pass that is still in progress when `ngOnChanges` fires.
   * A synchronous test assertion made right after `set('')` sees the OLD
   * value for exactly this reason.
   *
   * @param inputEl The native `<input>` element behind the `[(ngModel)]="text"` demo.
   */
  protected clearAndInspect(inputEl: HTMLInputElement): void {
    this.text.set('');
    this.clearLog.set([
      `synchronously, right after set(''): input.value is still "${inputEl.value}"`,
    ]);
    queueMicrotask(() => {
      this.clearLog.update((l) => [
        ...l,
        `one microtask later: input.value is now "${inputEl.value}"`,
      ]);
    });
  }
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
    { label: 'Property & Attribute', id: 'property-binding' },
    { label: 'Event Binding', id: 'event-binding' },
    { label: 'Two-Way Binding' },
    { label: 'Class & Style', id: 'class-style-binding' },
  ];

  /** Code for the opening predict — a parent writing the signal directly. */
  readonly predictCode = `setFromParent() {
  this.logged.set(42);   // writes the signal directly
}`;

  /** The child-originated write path — the only one that emits. */
  protected readonly childWriteFlow: FlowStep[] = [
    { label: 'Child calls .set() / .update()', detail: 'e.g. inc(), from inside the component' },
    { label: 'valueChange emits', detail: "the model()'s output fires", tone: 'accent' },
    {
      label: "Parent's (valueChange) handler runs",
      detail: 'state updates, log entry added',
      tone: 'good',
    },
  ];

  /** The parent-originated write path — silent by design. */
  protected readonly parentWriteFlow: FlowStep[] = [
    { label: 'Parent writes the signal', detail: 'e.g. logged.set(42)' },
    { label: 'Input value updates', detail: 'the child re-renders with the new value' },
    {
      label: 'valueChange does NOT emit',
      detail: 'otherwise this would loop forever',
      tone: 'warn',
    },
  ];

  /** Options for the naming-contract self-test. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: '`sizeChange`',
      correct: true,
      why: "model() always generates the output by appending the literal suffix Change to the input's name — no exceptions, no configuration.",
    },
    {
      text: '`sizeChanged`',
      why: 'Close, but wrong — the suffix is exactly Change, not Changed. This is the single most common typo in the entire naming contract.',
    },
    {
      text: '`onSizeChange`',
      why: "A familiar pattern from event-handler naming elsewhere, but Angular's two-way binding sugar has one fixed rule: input name + Change, with no onX prefix.",
    },
    {
      text: "Whatever name you configure in model()'s options",
      why: "model() does let you alias the INPUT name via { alias: 'x' } — but the paired output name is always derived automatically as inputName + Change; there is no separate output alias option.",
    },
  ];

  /** The "no dumb questions" block. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'What does `[(visible)]="show"` expand to, exactly?',
      a: '`[visible]="show" (visibleChange)="show = $event"` — and if `show` is a writable signal, the write is `show.set($event)`. The output name is always input-name + Change.',
    },
    {
      q: 'Can I two-way-bind to a plain getter/setter pair instead of a signal?',
      a: 'Yes — `[(x)]="expr"` only needs `expr` to be assignable, the same rule the assignability table below is built around. A plain property with a getter and setter works exactly like the `user.name` row: Angular calls the setter with `$event`, no signal required.',
    },
    {
      q: 'Why does `[(value)]="count()"` fail to compile?',
      a: '`count()` is a call expression — there is nothing to assign back into. Bind the signal itself: `[(value)]="count"`; Angular detects the WritableSignal and writes via `.set()`.',
    },
    {
      q: "You see NG8002: Can't bind to 'ngModel'. First thing to check?",
      a: "Whether FormsModule is in the component's imports array. Without it, the NgModel directive isn't in template scope, so ngModel looks like an unknown property of <input>.",
    },
    {
      q: "How do you validate a child's value before accepting it?",
      a: 'Split the banana: `[value]="v()" (valueChange)="accept($event)"` and put the policy (clamp, validate, confirm, dispatch) in `accept()`. Two-way binding is sugar, so the explicit pair is always available.',
    },
  ];

  // --- code samples (kept as properties so braces/backticks need no template escaping) ---
  /**
   * Sample: `[(value)]` desugared into its `[value]` + `(valueChange)` pair.
   */
  readonly desugarSample = `<app-stepper [(value)]="count" />

<!-- is exactly equivalent to -->
<app-stepper [value]="count" (valueChange)="count = $event" />

<!-- and when count is a WritableSignal, the write-back becomes -->
<app-stepper [value]="count()" (valueChange)="count.set($event)" />`;

  /** Line-by-line notes for {@link desugarSample}. */
  protected readonly desugarNotes: CodeNote[] = [
    {
      line: 1,
      text: "The banana-in-a-box: brackets (property binding) inside parentheses (event binding), fused into one piece of syntax. Nothing here is special — it's a compiler-level find-and-replace.",
    },
    {
      line: 4,
      text: "The literal expansion: an ordinary property binding plus an ordinary event binding. valueChange isn't a magic name Angular invented for this component specifically — it's value (the input's name) with the literal suffix Change glued on.",
    },
    {
      line: 7,
      text: 'count is read with count() on the way in (a plain value, not the signal object) and written with count.set($event) on the way out. This is the one place the compiler special-cases signals — plain properties instead get a bare count = $event assignment, as shown above.',
    },
  ];

  /**
   * Sample: the `model()` API, including `model.required()`.
   */
  readonly modelApiSample = `export class Stepper {
  value = model(0);                        // input "value" + output "valueChange"
  size  = model.required<number>();        // parent MUST bind it (or NG8008 at compile time)
  width = model(0, { alias: 'dimension' }); // parent binds [(dimension)]

  inc() {
    this.value.update(v => v + 1);         // child-side write → valueChange emits
  }
}

// inside the child, value is a full signal:
doubled = computed(() => this.value() * 2); // reacts to parent AND child writes`;

  /** Line-by-line notes for {@link modelApiSample}. */
  protected readonly modelApiNotes: CodeNote[] = [
    {
      line: 2,
      text: 'model(0) in one line generates BOTH halves — an input named value (default 0) and an output named valueChange — matching exactly the naming contract from the previous sample.',
    },
    {
      line: 3,
      text: "model.required() has no default; if the parent's template doesn't bind size, Angular's template type checker reports it at build time (NG8008), not at runtime.",
    },
    {
      line: 4,
      text: 'alias only renames the INPUT half. The output is still derived automatically from the ORIGINAL name plus Change — so the paired output here is widthChange, not dimensionChange, and the parent still writes [(dimension)].',
    },
    {
      line: 7,
      text: '.update() (or .set()) from inside the child is the ONLY thing that fires valueChange. This single line is the entire emission rule — the next section shows what happens when the write comes from the parent instead.',
    },
    {
      line: 12,
      text: "Because value is a genuine signal on the child's side, not just a plain field, it composes with computed() exactly like any other signal — and this one reacts to writes from either side, parent or child.",
    },
  ];

  /**
   * Sample: splitting the banana-in-a-box to intercept a change before it lands.
   */
  readonly splitBananaSample = `<!-- sugar: every child emission lands in state unchecked -->
<app-stepper [(value)]="clamped" />

<!-- explicit pair: the parent owns the policy -->
<app-stepper [value]="clamped()" (valueChange)="setClamped($event)" />`;

  /** Line-by-line notes for {@link splitBananaSample}. */
  protected readonly splitBananaNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The fused form: convenient, but every emission lands directly in clamped with no chance to inspect or reject it first.',
    },
    {
      line: 5,
      text: 'Unglue the two pipes: the inbound one ([value]) is untouched, but the outbound one now routes through setClamped() instead of writing state directly — the valve-on-the-outbound-pipe move from the analogy above.',
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

  /** Line-by-line notes for {@link ngModelSample}. */
  protected readonly ngModelNotes: CodeNote[] = [
    {
      line: 1,
      text: "Nothing works without this import — NgModel isn't a core directive, it lives in FormsModule and must be added to the component's own imports array.",
    },
    {
      line: 4,
      text: 'Same [(x)] syntax, same desugaring rule as a component: this is [ngModel] + (ngModelChange) under the hood — Angular treats a native form control exactly like any other two-way-bindable child.',
    },
    {
      line: 9,
      text: "updateOn: 'blur' changes WHEN the write-back fires, not whether it fires — the value still round-trips through the same [(ngModel)] pair, just on leaving the field instead of every keystroke.",
    },
    {
      line: 13,
      text: 'Inside a real <form>, NgModel registers itself with the parent NgForm under this name — required so the form can track and validate it as a named control.',
    },
    {
      line: 14,
      text: "standalone: true opts a control out of that registration — for a field that doesn't belong to the form's own validity/value, without needing to move it outside the <form> tag.",
    },
  ];

  /**
   * Sample: the legacy `@Input()` + `@Output() xChange` pair, and the naming rule
   * that made the sugar work.
   */
  readonly legacySample = `export class Stepper {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();  // name MUST be value + "Change"

  inc() {
    this.value++;
    this.valueChange.emit(this.value);  // forget this line → parent silently desyncs
  }
}`;

  /** Line-by-line notes for {@link legacySample}. */
  protected readonly legacyNotes: CodeNote[] = [
    {
      line: 2,
      text: 'Half of the pair, built by hand — this is the exact input model(0) would have generated for you.',
    },
    {
      line: 3,
      text: 'The other half, ALSO built by hand — and this is where the naming contract stops being automatic and starts being your responsibility to get exactly right.',
    },
    {
      line: 7,
      text: "Nothing connects this.value++ to the output automatically. model()'s entire value proposition is that this line — the one people forget — simply can't be forgotten, because there's no separate line to write.",
    },
  ];
}
