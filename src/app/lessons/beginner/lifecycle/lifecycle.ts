import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LifecycleLog } from './lifecycle.shared';
import { LifecycleChild } from './lifecycle-child/lifecycle-child';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Lifecycle Hooks — the order Angular calls them in, and which ones you
 * still need.
 *
 * The demo mounts and unmounts a child that logs every hook it receives, so the
 * sequence is observed rather than memorised — including the parts that surprise
 * people, like `ngOnChanges` running *before* `ngOnInit`, and content hooks
 * running before view hooks.
 *
 * The modern framing the lesson gives: most of these hooks existed to work
 * around the lack of reactivity. With signals, `ngOnChanges` is usually a
 * `computed`, and `ngOnInit` is usually just a field initialiser. The two that
 * remain genuinely necessary are `ngOnDestroy` for cleanup and the
 * `afterNextRender` / `afterEveryRender` family for work that needs real DOM.
 */
@Component({
  selector: 'app-lesson-lifecycle',
  imports: [RouterLink, LifecycleChild, Faq, Flow, Predict, Quiz, Remember],
  providers: [LifecycleLog],
  templateUrl: './lifecycle.html',
  styleUrl: './lifecycle.css',
})
export class Lifecycle {
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

  /** Choices for the parent/child ordering check. */
  protected readonly orderOptions = [
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

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
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
}
