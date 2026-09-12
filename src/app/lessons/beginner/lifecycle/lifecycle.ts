import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LifecycleLog } from './lifecycle.shared';
import { LifecycleChild } from './lifecycle-child/lifecycle-child';
import { LifecycleLeakyChild } from './lifecycle-leaky-child/lifecycle-leaky-child';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, QuizOption } from '../../../shared/teaching';

/**
 * Lesson: Lifecycle Hooks — the order Angular calls them in, which ones still
 * earn their keep now that signals exist, and the two traps every interview
 * reliably asks about: constructor vs `ngOnInit`, and parent/child ordering.
 *
 * The demo mounts and unmounts a child that logs every hook it receives, so the
 * sequence is *observed* rather than memorised — including the parts that
 * surprise people, like `ngOnChanges` running before `ngOnInit`, and content
 * hooks running before view hooks.
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (`shared/brain/`, `src/brain-friendly.css`),
 * following the shape of the reference implementation in
 * `lessons/expert/change-detection/`. The teaching order is deliberate:
 *
 * 1. **Pose the problem before naming hooks.** The lesson opens on "Angular
 *    creates your component — then what?" and a napkin makes the reader
 *    commit to a guess about parent/child ordering before any mechanism is
 *    explained, with a pointer to the live demo further down to check it.
 * 2. **Analogy next, mechanism after.** The building-site frame (framed
 *    outside-in, signed off inside-out) gives the reader somewhere to *put*
 *    the ordering before the hook names arrive — reinforced immediately by a
 *    `Bubbles` dialogue staging the same handshake between Angular, a parent
 *    and its child.
 * 3. **Then the same idea in several modes**: an annotated read of the real
 *    `LifecycleChild` source via `CodeLab`, a `Flow` diagram of the full
 *    order, a `Quiz` testing that exact order, a live demo logging real hook
 *    firings, and a reference table — because the retention bar is
 *    redundancy across modes, not repetition in one.
 * 4. **The modern replacement, last.** A `Compare` sets the decorator-input
 *    pattern against its signal-based replacement, closing on the two hooks
 *    that remain genuinely necessary.
 */
@Component({
  selector: 'app-lesson-lifecycle',
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
    LifecycleChild,
    LifecycleLeakyChild,
  ],
  providers: [LifecycleLog],
  templateUrl: './lifecycle.html',
  styleUrl: './lifecycle.css',
})
export class Lifecycle {
  /** The Components & Templates neighbourhood, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Built-in Pipes', id: 'pipes' },
    { label: 'Lifecycle Hooks' },
    { label: 'Component Inputs', id: 'inputs' },
    { label: 'Component Outputs', id: 'outputs' },
    { label: 'Services & DI', id: 'services-di' },
  ];

  /**
   * The handshake a `<app-child>` binding actually sets off, staged as
   * dialogue instead of described in a paragraph — the ordering people get
   * backwards in interviews, in a mode a reader follows without having to
   * hold both parties in their head at once.
   */
  protected readonly mechanismTalk: BubbleTurn[] = [
    {
      who: 'Angular',
      says: "Time to render `<app-child>` inside the parent's template. First, I create the instance.",
    },
    {
      who: 'Parent',
      says: "My `ngOnInit` already ran — but I'm not finished. Rendering my own template is what creates you.",
    },
    {
      who: 'Child',
      says: "I exist now. My `ngOnChanges` and `ngOnInit` run before you're allowed to say your view is complete.",
    },
    {
      who: 'Child',
      says: 'My view — and anything inside it — is ready. `ngAfterViewInit` just fired. I report in first.',
    },
    {
      who: 'Parent',
      says: 'Now that every child under me has reported ready, my own `ngAfterViewInit` finally fires.',
    },
  ];

  /**
   * One component's life in order. Grouped the way the mnemonic groups it —
   * create, then content, then view, then destroy — because exam questions on
   * this topic are almost always "which of these two fires first?".
   */
  protected readonly order = [
    { label: 'constructor', detail: 'DI only. Inputs are not set and there is no view yet' },
    { label: '`ngOnChanges`', detail: 'Inputs arrive — runs *before* init, then on every change' },
    {
      label: '`ngOnInit`',
      detail: 'Once. Inputs are bound, so this is where setup belongs',
      tone: 'accent' as const,
    },
    { label: '`ngDoCheck`', detail: 'Every change-detection pass, app-wide. Expensive by nature' },
    {
      label: 'Content hooks',
      detail: '`ngAfterContentInit` / `Checked` — projected content is ready',
    },
    {
      label: 'View hooks',
      detail: '`ngAfterViewInit` / `Checked` — own view and children are ready',
    },
    {
      label: '`ngOnDestroy`',
      detail: 'Last call. Unsubscribe, clear timers, detach listeners',
      tone: 'warn' as const,
    },
  ];

  /**
   * The real `LifecycleChild` source (trimmed of doc comments), read line by
   * line so a hook stops being an abstract name and becomes a method the
   * reader can see Angular actually calling.
   */
  protected readonly childSource = `@Component({
  selector: 'app-lifecycle-child',
  templateUrl: './lifecycle-child.html',
})
export class LifecycleChild implements OnChanges, OnInit, DoCheck, AfterViewInit, OnDestroy {
  @Input() value = 0;
  private readonly log = inject(LifecycleLog);

  ngOnChanges(changes: SimpleChanges) {
    const v = changes['value'];
    this.log.add(\`ngOnChanges — value \${v.previousValue} → \${v.currentValue}\`);
  }
  ngOnInit() {
    this.log.add('ngOnInit — component initialised');
  }
  ngDoCheck() {
    this.log.add('ngDoCheck — change detection ran');
  }
  ngAfterViewInit() {
    this.log.add('ngAfterViewInit — view & children ready');
  }
  ngOnDestroy() {
    this.log.add('ngOnDestroy — cleaning up');
  }
}`;

  /** Line-by-line walkthrough of {@link childSource}. */
  protected readonly childNotes: CodeNote[] = [
    {
      line: 5,
      text: "Five TypeScript interfaces, one per hook used below. They're erased at runtime — implementing `OnInit` only buys you a compiler check that `ngOnInit` is spelled right. Angular itself never looks at this list.",
    },
    {
      line: 6,
      text: 'A plain decorator `@Input()`, not the newer `input()` function — deliberately. `ngOnChanges` only ever fires for decorator inputs, so this is the one field in the app written the old way on purpose, to prove the point.',
    },
    {
      line: 7,
      text: "`inject(LifecycleLog)` grabs the log this child and the lesson's own component share, so every hook below can write into the same panel you'll watch fire live.",
    },
    {
      line: 9,
      text: 'Angular calls this **before** `ngOnInit`, the first time, and again on every later change to `value` — never on any other property.',
    },
    {
      line: 10,
      text: "`changes['value']` is a `SimpleChanges` entry keyed by input name. It's the only hook that hands you the *previous* value alongside the current one.",
    },
    {
      line: 13,
      text: 'Runs exactly once, after the first `ngOnChanges` and before the first render. This is where setup belongs — inputs are guaranteed to be set by now.',
    },
    {
      line: 16,
      text: 'Runs on **every** change-detection pass this component is reached by — not just when `value` changes. That is what makes it the hook most likely to become a performance problem.',
    },
    {
      line: 19,
      text: "Runs once, after this component's own view and every child inside it exist. The earliest point a `viewChild` query is safe to read.",
    },
    {
      line: 22,
      text: "The cleanup hook — unsubscribe, clear timers, disconnect observers. Fires when Angular removes this component, which in the demo below is the moment you click 'Destroy'.",
    },
  ];

  /** Choices for the parent/child ordering check. */
  protected readonly orderOptions: QuizOption[] = [
    {
      text: 'Parent init, parent view-init, child init, child view-init',
      why: 'This assumes the parent finishes entirely before the child starts. It cannot: the child only exists because the parent rendered it, so the parent is midway through its own setup when the child begins.',
    },
    {
      text: 'Parent init, child init, child view-init, parent view-init',
      correct: true,
      why: 'Creation runs outside-in — the parent has to exist before it can render a child. "View ready" runs inside-out, because a parent\'s view is not complete until every child in it is complete. So the child reports ready first, and the parent last. That is why `ngAfterViewInit` is the earliest hook where a parent can safely measure its children.',
    },
    {
      text: 'Child init, child view-init, parent init, parent view-init',
      why: 'Backwards at the start. A child cannot initialise before its parent, because nothing has instantiated it yet — the parent creates it while rendering its own template.',
    },
    {
      text: 'Parent init, child init, parent view-init, child view-init',
      why: 'Half right: the inits are correct. But the parent cannot declare its view ready while a child inside that view has not finished — "ready" propagates upward, so the child gets there first.',
    },
  ];

  /** The ExpressionChanged trap. */
  protected readonly expressionChangedSample = `@Component({
  template: '<p>{{ label }}</p>',
})
export class Banner implements AfterViewInit {
  label = 'loading…';

  ngAfterViewInit() {
    this.label = 'ready';   // the binding above already read it
  }
}

// You run this in development. What do you see?`;

  /** Sample: the decorator-input pattern against its signal-based replacement. */
  protected readonly oldHooksSample = `@Input() value = 0;

ngOnChanges(changes: SimpleChanges) {
  this.total = changes['value'].currentValue * 2;
}
ngOnInit() {
  this.sub = this.source.subscribe((v) => (this.latest = v));
}
ngOnDestroy() {
  this.sub.unsubscribe();
}`;

  /** Sample: the modern equivalent — no ngOnChanges, no manual unsubscribe. */
  protected readonly modernSample = `value = input(0);

readonly total = computed(() => this.value() * 2);

readonly latest = toSignal(this.source$);
// cleanup is automatic — no ngOnDestroy needed here`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'Why not just put my setup in the constructor?',
      a: 'Because inputs are not there yet. The constructor runs when the object is created, before Angular has bound a single `@Input` — so anything reading one gets `undefined`. Keep the constructor for `inject()` and nothing else; by `ngOnInit`, the inputs are set and the component knows who it is.',
    },
    {
      q: 'Does `ngOnChanges` fire when a signal `input()` changes?',
      a: 'No, and this catches people migrating. `SimpleChanges` is built by the binding machinery that services decorator `@Input()`s. Signal inputs are reactive by themselves, so the framework has no reason to build a change record — you react with a `computed` that reads the input, or an `effect` if you truly need a side effect. In practice this is an upgrade: you get the *specific* thing that changed rather than a bag of everything.',
    },
    {
      q: 'Why is `ngDoCheck` singled out as expensive?',
      a: "Because it runs on every change-detection pass anywhere in the app, not just when your component's data changes. A click on an unrelated button, an HTTP response, a timer — all of them call it. Put anything non-trivial in there and you have added that cost to every interaction in the entire application.",
    },
    {
      q: 'Do I still need `ngOnDestroy` in modern Angular?',
      a: 'Less often than you would think. `takeUntilDestroyed()` handles RxJS subscriptions, `toSignal` cleans up after itself, and effects created in an injection context are torn down with their owner. What is left is genuinely manual resources: a `setInterval`, a `ResizeObserver`, a listener attached to `window`, a third-party chart instance. `DestroyRef.onDestroy()` is also available if a callback suits you better than implementing the interface.',
    },
    {
      q: 'When would I use `afterNextRender` instead of `ngAfterViewInit`?',
      a: 'When the work needs the *browser* rather than just the component tree — measuring an element, initialising a canvas library, reading `scrollHeight`. `ngAfterViewInit` also runs during server-side rendering, where there is no DOM to touch; `afterNextRender` runs only in the browser and only once painting is done. If you have ever guarded a hook with `isPlatformBrowser`, that is the code `afterNextRender` replaces.',
    },
  ];

  /**
   * The shared log the child writes into.
   */
  protected readonly log = inject(LifecycleLog);
  /**
   * Whether the child is mounted — toggling it is what drives the whole demo.
   */
  protected readonly show = signal(false);
  /**
   * The value bound to the child's input, so `ngOnChanges` can be provoked without
   * remounting.
   */
  protected readonly value = signal(0);

  /**
   * Mounts or unmounts the child, producing the init or destroy hooks.
   */
  protected toggle() {
    this.show.update((s) => !s);
  }

  /**
   * Whether the leak demo's child is currently mounted.
   */
  protected readonly leakShow = signal(false);
  /**
   * Whether the leak demo's child clears its own interval on destroy —
   * checked before creating it, then left alone until the next create.
   */
  protected readonly leakCleanup = signal(false);

  /**
   * Mounts or unmounts the leaky child, with whatever cleanup setting is
   * currently checked.
   */
  protected leakToggle() {
    this.leakShow.update((s) => !s);
  }
}
