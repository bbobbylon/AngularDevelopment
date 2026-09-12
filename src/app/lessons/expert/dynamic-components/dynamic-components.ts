import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  ComponentRef,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BfPage,
  Bubbles,
  Chapter,
  type BubbleTurn,
  type ChapterStop,
  CodeLab,
  type CodeNote,
  Napkin,
} from '../../../shared/brain';
import {
  Compare,
  Faq,
  type FaqItem,
  Flow,
  type FlowStep,
  Predict,
  Quiz,
  type QuizOption,
  Remember,
} from '../../../shared/teaching';
import { InfoPanel } from './info-panel/info-panel';
import { WarningPanel } from './warning-panel/warning-panel';
import { SuccessPanel } from './success-panel/success-panel';
import { ConfirmPanel } from './confirm-panel/confirm-panel';

// ── Lesson component ──────────────────────────────────────────────────────────

/**
 * Lesson: dynamic components — NgComponentOutlet vs createComponent(), live
 * demos for both plus output wiring and lifecycle control, lazy import()
 * splitting, custom injectors for dialog patterns, projectable nodes, and the
 * ComponentRef API. This is the machinery behind modals, toasts and CMS
 * block renderers.
 */
@Component({
  selector: 'app-lesson-dynamic-components',
  // Panels are instantiated via NgComponentOutlet / createComponent (runtime
  // class references), so they do not belong in template imports.
  imports: [
    RouterLink,
    NgComponentOutlet,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './dynamic-components.css',
  templateUrl: './dynamic-components.html',
})
export class DynamicComponents implements OnDestroy {
  /**
   * The info panel's class, exposed so the template can name it. Templates resolve
   * against the component instance, so an imported class is not otherwise
   * reachable.
   */
  protected readonly InfoPanel = InfoPanel;
  /**
   * The warning panel's class.
   */
  protected readonly WarningPanel = WarningPanel;
  /**
   * The success panel's class.
   */
  protected readonly SuccessPanel = SuccessPanel;

  /**
   * Which component `NgComponentOutlet` is rendering. A `Type`, not an instance —
   * swapping it swaps the rendered component.
   */
  protected readonly current = signal<Type<unknown>>(InfoPanel);
  /**
   * The message passed to whichever panel is showing.
   */
  protected readonly note = signal('all systems nominal');
  /**
   * Status line for the imperative demo.
   */
  protected readonly imperativeStatus = signal('not mounted');
  /**
   * The last answer from the confirm demo.
   */
  protected readonly confirmResult = signal('— none yet —');

  /**
   * The insertion point for the imperative demo.
   *
   * `read: ViewContainerRef` is what turns the template reference into a container
   * rather than an `ElementRef`. Note the new component is inserted as a **sibling**
   * of the anchor, not inside it.
   */
  @ViewChild('anchor', { read: ViewContainerRef }) private anchor!: ViewContainerRef;
  /**
   * The insertion point for the confirm demo.
   */
  @ViewChild('confirmAnchor', { read: ViewContainerRef }) private confirmAnchor!: ViewContainerRef;
  /**
   * The imperatively created panel, or `null`. Held because creating it is only
   * half the job — this is the handle that updates and destroys it.
   */
  private imperativeRef: ComponentRef<InfoPanel> | null = null;
  /**
   * The imperatively created confirm panel, or `null`.
   */
  private confirmRef: ComponentRef<ConfirmPanel> | null = null;
  /**
   * How many imperative updates have run, so each shows a different message.
   */
  private updateCount = 0;

  /**
   * Creates a panel imperatively.
   */
  protected imperativeMount(): void {
    this.anchor?.clear();
    this.imperativeRef = this.anchor.createComponent(InfoPanel);
    this.imperativeRef.setInput('message', 'created imperatively!');
    this.imperativeStatus.set('mounted ✓');
  }

  /**
   * Updates the created panel's input.
   *
   * Via `setInput` rather than by assigning to `ref.instance.message` directly:
   * `setInput` marks the view dirty and works with `OnPush`, while a raw property
   * assignment updates the field and may never be rendered.
   */
  protected imperativeUpdate(): void {
    if (!this.imperativeRef) {
      this.imperativeStatus.set('not mounted — click Mount first');
      return;
    }
    this.updateCount++;
    this.imperativeRef.setInput(
      'message',
      `updated ${this.updateCount} time${this.updateCount === 1 ? '' : 's'}`,
    );
    this.imperativeStatus.set(`updated (${this.updateCount}×)`);
  }

  /**
   * Destroys the created panel.
   *
   * Creating a component this way opts you out of Angular's lifecycle management —
   * nothing will destroy it for you, and an undestroyed component keeps its
   * subscriptions and its DOM.
   */
  protected imperativeDestroy(): void {
    this.imperativeRef?.destroy();
    this.imperativeRef = null;
    this.anchor?.clear();
    this.imperativeStatus.set('destroyed');
  }

  /** Demo 3 — create a dialog-ish component and subscribe to its output. */
  protected ask(): void {
    this.confirmAnchor.clear();
    this.confirmRef = this.confirmAnchor.createComponent(ConfirmPanel);
    this.confirmRef.setInput('question', 'Deploy to production?');
    // the imperative twin of (confirmed)="…" — impossible to bind in a template
    this.confirmRef.instance.confirmed.subscribe((yes) => {
      this.confirmResult.set(yes ? 'confirmed ✓' : 'cancelled ✗');
      this.confirmRef?.destroy(); // dialogs close themselves after answering
      this.confirmRef = null;
    });
  }

  /**
   * Destroys anything still mounted when the lesson is left.
   */
  ngOnDestroy(): void {
    this.imperativeRef?.destroy();
    this.confirmRef?.destroy();
  }

  // ── code samples ────────────────────────────────────────────────────────
  /**
   * Sample: `NgComponentOutlet`, the declarative form — enough for most cases.
   */
  readonly outletSample = `// TypeScript
protected readonly current = signal<Type<unknown>>(InfoPanel);

// Template
<ng-container
  [ngComponentOutlet]="current()"
  [ngComponentOutletInputs]="{ message: note() }"
/>

// Swap component at runtime — old instance destroyed, new one created
current.set(WarningPanel);`;

  /**
   * Sample: `ViewContainerRef.createComponent`, the imperative form, and the
   * `ComponentRef` it returns.
   */
  readonly imperativeSample = `// ViewContainerRef is the INSERTION POINT — a handle on a place in the DOM
// where views can be added. Injected here, it points just AFTER this
// component's own host element, not inside it.
private readonly vcr = inject(ViewContainerRef);
// Hold the reference or you cannot update or destroy what you created.
// Typed with the component class, so setInput below is type-aware.
private ref: ComponentRef<InfoPanel> | null = null;

mount(): void {
  // Remove anything previously created here. Without this, calling mount()
  // twice stacks two panels — a genuinely common leak.
  this.vcr.clear();
  // Pass the CLASS itself. No factory resolver, no NgModule: since Ivy the
  // component class carries everything needed to instantiate it.
  this.ref = this.vcr.createComponent(InfoPanel);
  // setInput, not assignment. It marks the view dirty AND runs the input's
  // transform, so the component actually re-renders.
  this.ref.setInput('message', 'Created imperatively!');
}

update(msg: string): void {
  // ?. because the panel may not be mounted. Assigning
  // ref.instance.message directly WOULD change the field — and the screen
  // would not update under OnPush, because nothing marked the view dirty.
  this.ref?.setInput('message', msg);   // NOT ref.instance.message = …
}

destroy(): void {
  // Runs ngOnDestroy, removes the DOM node, and tears down any subscription
  // registered on the ref.
  this.ref?.destroy();
  // Null the field too, or you keep a reference to a destroyed component and
  // the next update() silently does nothing.
  this.ref = null;
}`;

  /**
   * Sample: where the `createComponent()` call is safe to make, and where it
   * throws `NG0100` — and the escape hatch for the DOM-dependent case that
   * forces the question.
   */
  readonly createTimingSample = `ngOnInit(): void {
  this.vcr.createComponent(Toast);       // ✓ fine — runs BEFORE the first CD pass
}

onSaveClick(): void {
  this.vcr.createComponent(Toast);       // ✓ fine — a user gesture, not inside a CD pass
}

ngAfterViewInit(): void {
  this.vcr.createComponent(Toast);       // ✗ NG0100 in dev mode — see below
}

constructor() {
  afterNextRender(() => {
    this.vcr.createComponent(Toast);     // ✓ the sanctioned escape hatch —
  });                                     //   runs entirely OUTSIDE change detection
}`;

  /** Line-by-line notes for {@link createTimingSample}. */
  protected readonly createTimingNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Runs once, before Angular has checked this view for the first time — creating a component here is no different from any other setup work in `ngOnInit`.',
    },
    {
      line: 5,
      text: "An event handler runs completely outside any change-detection pass — Angular is not partway through checking anything when a click fires, so there's nothing to contradict.",
    },
    {
      line: 9,
      text: "`ngAfterViewInit` runs DURING change detection — Angular is still walking this view's checks when this hook fires. Creating a component here changes the view tree Angular is mid-walk through, which is exactly what `NG0100` (ExpressionChangedAfterItHasBeenCheckedError) exists to catch.",
    },
    {
      line: 13,
      text: '`afterNextRender()` schedules its callback for AFTER the browser has painted — fully outside Angular\'s change-detection cycle. It exists precisely for "I need the real DOM, or I need to create something, and I need change detection to be finished, not in progress."',
    },
  ];

  /**
   * Sample: `ref.setInput()` given a name that isn't a declared input — what
   * "validates the input name" actually looks like when it fails.
   */
  readonly setInputTypoSample = `const ref = this.vcr.createComponent(InfoPanel);
ref.setInput('mesage', 'Hi!');   // typo: InfoPanel has no "mesage" input
// NG0303: Can't set value of the 'mesage' input on the 'InfoPanel' component.
// Make sure that the 'mesage' property is declared as an input using the
// input() or model() function or the @Input() decorator.`;

  /**
   * Sample: subscribing to a dynamically created component's outputs — the
   * imperative twin of an event binding.
   */
  readonly outputsSample = `const ref = this.vcr.createComponent(ConfirmPanel);
ref.setInput('question', 'Deploy to production?');

// subscribe to the output on the instance — OutputEmitterRef has subscribe()
ref.instance.confirmed.subscribe((yes: boolean) => {
  this.result.set(yes);
  ref.destroy();               // subscription is cleaned up with the ref
});`;

  /**
   * Sample: creating a component from a lazily imported chunk, which is where
   * imperative creation genuinely earns its cost.
   */
  readonly lazySample = `async mountLazy(): Promise<void> {
  // The chunk is NOT downloaded until this line runs:
  const { HeavyChart } = await import('./heavy-chart.component');
  this.vcr.createComponent(HeavyChart);
}

// declarative flavor — outlet renders nothing until the signal resolves:
protected readonly lazyClass = signal<Type<unknown> | null>(null);
async load() { this.lazyClass.set((await import('./heavy-chart.component')).HeavyChart); }`;

  /**
   * Sample: `createComponent` with a custom injector, for passing data into a
   * component that has no parent template to bind from — the mechanism behind
   * every dialog service's `DIALOG_DATA`.
   *
   * Note the `attachView` line. A component created outside the view tree is not
   * in any change-detection pass until it is attached, so skipping it produces a
   * dialog that renders once and then never updates.
   */
  readonly injectorSample = `import { createComponent, EnvironmentInjector, Injector } from '@angular/core';

const injector = Injector.create({
  providers: [{ provide: DIALOG_DATA, useValue: { title: 'Confirm' } }],
  parent: inject(EnvironmentInjector),
});

const ref = createComponent(MyDialog, {
  environmentInjector: inject(EnvironmentInjector),
  elementInjector: injector,          // dialog does: inject(DIALOG_DATA)
});
inject(ApplicationRef).attachView(ref.hostView);  // ← or it never updates!
document.body.appendChild(ref.location.nativeElement);`;

  /**
   * Sample: `projectableNodes`, which supplies content for a dynamically created
   * component's `<ng-content>` slots. The array is positional — one entry per slot,
   * in declaration order.
   */
  readonly projectionSample = `// component with slots:  <ng-content select="[body]" />  <ng-content />
const body = renderer.createText('Saved successfully.');

const ref = this.vcr.createComponent(ToastShell, {
  projectableNodes: [
    [bodyElement],      // → first  <ng-content select="[body]">
    [footerElement],    // → second <ng-content>
  ],
});`;

  // ── brain-friendly content ──────────────────────────────────────────────

  /** The "you are here" rail — neighbouring Architecture-track lessons. */
  protected readonly stops: ChapterStop[] = [
    { label: 'State Management', id: 'state-management' },
    { label: 'Dynamic Components' },
    { label: 'Directive Composition', id: 'host-directives' },
    { label: 'NgModules Migration', id: 'ngmodules-migration' },
  ];

  /** The two APIs arguing about who owns what they create. */
  protected readonly bridgeTalk: BubbleTurn[] = [
    {
      who: 'NgComponentOutlet',
      says: "Bind me a class — I'll mount it, swap it, tear down the old one. You never touch a `ComponentRef`.",
    },
    {
      who: 'createComponent()',
      says: "That's the trade. I hand you a real `ComponentRef` — but now *you* own the thing I made.",
    },
    { who: 'NgComponentOutlet', says: 'Owning it sounds like work.' },
    {
      who: 'createComponent()',
      says: "It is. Call its methods, subscribe to its outputs, and when you're done — `ref.destroy()`. Skip that and you've leaked a whole subtree.",
    },
    {
      who: 'NgComponentOutlet',
      says: 'I can\'t give you outputs at all — no `(confirmed)="…"` on a class that only exists at runtime.',
    },
    {
      who: 'createComponent()',
      says: 'Which is exactly why every dialog service reaches for me instead of you.',
    },
  ];

  /** Line-by-line walkthrough of {@link outletSample}, paired with Demo 1. */
  protected readonly outletNotes: CodeNote[] = [
    {
      line: 2,
      text: "A signal holding a component **class** — a constructor, not an instance. `Type<unknown>` is TypeScript's type for 'a class reference'.",
    },
    {
      line: 6,
      text: 'Bind the class straight from the signal. Angular creates, mounts, and will destroy this for you — no `ComponentRef` in sight.',
    },
    {
      line: 7,
      text: "One object carries every input; keys must match the target's `input()`/`@Input()` names exactly. There's no per-input binding syntax here.",
    },
    {
      line: 11,
      text: 'Setting a genuinely **different** class is what triggers destroy-then-recreate. Setting the same class again is a no-op — see the Predict below.',
    },
  ];

  /** Line-by-line walkthrough of {@link imperativeSample}, paired with Demo 2. */
  protected readonly imperativeNotes: CodeNote[] = [
    {
      line: 4,
      text: "`ViewContainerRef` is injected as a handle on a place in the DOM — not an `ElementRef`. The template version gets this same handle from `@ViewChild('anchor', { read: ViewContainerRef })` instead of `inject()`.",
    },
    {
      line: 7,
      text: "Typed with the component class up front, so every `setInput` call below is checked against `InfoPanel`'s real inputs.",
    },
    {
      line: 12,
      text: 'Clears anything already created here. Skip this and a second mount() call stacks a second panel — see the Quiz below.',
    },
    {
      line: 15,
      text: 'The class itself, not a factory. Ivy compiles everything `createComponent` needs directly onto the class.',
    },
    {
      line: 18,
      text: '`setInput`, never `ref.instance.message = …` — direct assignment skips dirty-marking entirely.',
    },
    {
      line: 25,
      text: '`?.` matters here: calling `update()` before `mount()` should do nothing, not throw.',
    },
    {
      line: 31,
      text: '`destroy()` runs `ngOnDestroy`, removes the DOM node, and tears down anything subscribed on the ref.',
    },
    {
      line: 34,
      text: 'Nulling the field is easy to forget — without it, the next `update()` silently targets a dead reference.',
    },
  ];

  /** Line-by-line walkthrough of {@link outputsSample}, paired with Demo 3. */
  protected readonly outputsNotes: CodeNote[] = [
    {
      line: 1,
      text: 'Same `createComponent` call as before — the only new thing here is what happens next.',
    },
    {
      line: 5,
      text: 'No `(confirmed)="…"` exists for a component created at runtime, so you subscribe directly on `ref.instance` — the imperative twin of an event binding.',
    },
    {
      line: 7,
      text: 'Destroying inside the callback is deliberate: a one-shot dialog answers once, then removes itself.',
    },
  ];

  /** Line-by-line walkthrough of {@link injectorSample} — the dialog-data pattern. */
  protected readonly injectorNotes: CodeNote[] = [
    {
      line: 3,
      text: 'A *scoped* injector — its providers exist only for whatever gets created with it, not app-wide.',
    },
    {
      line: 4,
      text: 'This is the entire mechanism behind `MAT_DIALOG_DATA`: a token, a value, and nothing more magical than that.',
    },
    {
      line: 5,
      text: "Parented to the app's `EnvironmentInjector` so the dialog can still resolve ordinary app-wide services alongside its scoped data.",
    },
    {
      line: 8,
      text: 'This is the standalone `createComponent()` *function*, not a `ViewContainerRef` method — that distinction is exactly why line 12 is needed.',
    },
    {
      line: 10,
      text: 'The element injector layers on top of the environment injector — per-instance tokens win over app-wide ones.',
    },
    {
      line: 12,
      text: 'Skip this and the dialog renders once, then never again — no `ViewContainerRef` is watching this view, so nothing schedules it for checking.',
    },
    {
      line: 13,
      text: 'Manual DOM insertion too — `document.body` is outside any Angular-managed container, so nothing places this element for you either.',
    },
  ];

  /** What always happens under the hood, and the one optional step that is easy to skip. */
  protected readonly attachmentFlow: FlowStep[] = [
    {
      label: 'createComponent(Cmp)',
      detail: 'Reads the compiled definition off the class — no factory lookup, no registration',
    },
    {
      label: 'Host element',
      detail: '`ref.location.nativeElement` — a real DOM node, not yet meaningfully placed',
    },
    { label: 'View created', detail: '`ref.hostView` — what change detection actually walks' },
    {
      label: 'Attached to CD tree?',
      detail: 'A `ViewContainerRef` does this automatically; the bare function does not',
      tone: 'warn',
    },
    {
      label: 'Renders & updates',
      detail: 'Only reachable once attached — otherwise: one paint, then silence',
      tone: 'good',
    },
  ];

  /** Self-test: whether a swap or a no-op input change triggers destroy+recreate. */
  protected readonly quizOptions: QuizOption[] = [
    {
      text: 'The second call throws — the container already has a view',
      why: "`ViewContainerRef` happily holds any number of views; there's no uniqueness constraint to violate.",
    },
    {
      text: 'Two toast instances now render, stacked in the container',
      correct: true,
      why: "`createComponent()` always appends — it never checks for or replaces an existing view. That's exactly why `imperativeMount()` in Demo 2 calls `this.anchor?.clear()` first.",
    },
    {
      text: 'The first instance is destroyed and replaced automatically',
      why: "That's `NgComponentOutlet`'s behavior when its bound class changes — not `createComponent()`'s. The imperative API never destroys anything for you.",
    },
  ];

  /** The small doubts this lesson tends to leave behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: "Why `ref.setInput('x', v)` instead of `ref.instance.x = v`?",
      a: "Direct assignment bypasses the framework entirely: no dirty marking (so an OnPush component won't re-render), no `ngOnChanges`, and it breaks completely for signal inputs, which are read-only `InputSignal`s under the hood. `setInput` goes through the same path a template binding would.",
    },
    {
      q: 'Your body-appended toast renders once and never updates. What did you forget?',
      a: 'Attaching its view to a change-detection tree. The standalone `createComponent()` function creates the component but does not attach it — you need `appRef.attachView(ref.hostView)` yourself. A `ViewContainerRef` would have done this automatically.',
    },
    {
      q: 'How does a dialog service pass data into the dialog component it opens?',
      a: 'A custom element injector: `Injector.create({ providers: [{ provide: DIALOG_DATA, useValue: data }] })`, passed at creation. The dialog component then does `inject(DIALOG_DATA)`. Results flow back the other way via an output or subject the service subscribes to before returning its `afterClosed()` observable.',
    },
    {
      q: 'NgComponentOutlet re-created your component and lost its state — you only wanted new inputs. Why?',
      a: "The class binding's *identity* changed (or you genuinely passed a new class) — and a class change is defined as destroy-then-recreate, full stop. To update state instead, keep the class reference stable and change only the `ngComponentOutletInputs` object.",
    },
    {
      q: 'What replaced ComponentFactoryResolver and entryComponents, and why could they be deleted?',
      a: "Ivy's locality: every compiled class carries its own definition (`ɵcmp`), so the class reference alone is directly instantiable — `vcr.createComponent(MyCmp)`, no lookup required. There's nothing left to resolve and nothing to pre-register.",
    },
  ];
}
