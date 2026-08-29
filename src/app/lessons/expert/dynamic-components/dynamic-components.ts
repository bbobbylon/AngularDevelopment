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
  imports: [RouterLink, NgComponentOutlet],
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
  readonly imperativeSample = `private readonly vcr = inject(ViewContainerRef);
private ref: ComponentRef<InfoPanel> | null = null;

mount(): void {
  this.vcr.clear();
  this.ref = this.vcr.createComponent(InfoPanel);
  this.ref.setInput('message', 'Created imperatively!');
}

update(msg: string): void {
  this.ref?.setInput('message', msg);   // NOT ref.instance.message = …
}

destroy(): void {
  this.ref?.destroy();
  this.ref = null;
}`;

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
}
