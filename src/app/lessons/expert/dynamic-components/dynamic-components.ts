import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  ComponentRef,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Lesson: dynamic components — NgComponentOutlet vs createComponent(), live
 * demos for both plus output wiring and lifecycle control, lazy import()
 * splitting, custom injectors for dialog patterns, projectable nodes, and the
 * ComponentRef API. This is the machinery behind modals, toasts and CMS
 * block renderers.
 */

// ── Demo components that will be rendered dynamically ────────────────────────

@Component({
  selector: 'app-info-panel',
  template: `
    <div class="dyn-panel dyn-panel--info">
      ℹ️ <strong>Info</strong> — {{ message() }}
    </div>
  `,
  styles: [`.dyn-panel { padding:12px 16px; border-radius:0 10px 10px 0; font-size:.9rem; }
    .dyn-panel--info { border-left:3px solid var(--blue); background:rgba(2,132,199,.08); }`],
})
export class InfoPanel {
  message = input('all systems nominal');
}

@Component({
  selector: 'app-warning-panel',
  template: `
    <div class="dyn-panel dyn-panel--warn">
      ⚠️ <strong>Warning</strong> — {{ message() }}
    </div>
  `,
  styles: [`.dyn-panel { padding:12px 16px; border-radius:0 10px 10px 0; font-size:.9rem; }
    .dyn-panel--warn { border-left:3px solid var(--amber); background:rgba(217,119,6,.08); }`],
})
export class WarningPanel {
  message = input('check your inputs');
}

@Component({
  selector: 'app-success-panel',
  template: `
    <div class="dyn-panel dyn-panel--success">
      ✓ <strong>Success</strong> — {{ message() }}
    </div>
  `,
  styles: [`.dyn-panel { padding:12px 16px; border-radius:0 10px 10px 0; font-size:.9rem; }
    .dyn-panel--success { border-left:3px solid var(--green); background:rgba(5,150,105,.08); }`],
})
export class SuccessPanel {
  message = input('operation completed');
}

/** A dialog-like component with OUTPUTS — the parent wires them imperatively. */
@Component({
  selector: 'app-confirm-panel',
  template: `
    <div class="confirm">
      <strong>{{ question() }}</strong>
      <div class="row" style="margin-top:10px">
        <button (click)="confirmed.emit(true)">Yes, do it</button>
        <button class="ghost" (click)="confirmed.emit(false)">Cancel</button>
      </div>
    </div>
  `,
  styles: [`.confirm { border: 1px solid var(--border); border-left: 3px solid var(--violet); border-radius: 0 10px 10px 0; padding: 14px 16px; }`],
})
export class ConfirmPanel {
  question = input('Are you sure?');
  confirmed = output<boolean>();
}

// ── Lesson component ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-lesson-dynamic-components',
  // Panels are instantiated via NgComponentOutlet / createComponent (runtime
  // class references), so they do not belong in template imports.
  imports: [RouterLink, NgComponentOutlet],
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    button.active { background: var(--accent); color: #fff; border-color: var(--accent); }

    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }

    .qa { border: 1px solid var(--border); border-radius: 10px; margin: 10px 0; overflow: hidden; }
    .qa summary { cursor: pointer; padding: 10px 14px; font-weight: 600; font-size: .92rem; background: var(--bg-elevated); }
    .qa div { padding: 10px 14px; font-size: .9rem; }
  `],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>Dynamic Components</h1>
      <p class="lead">
        Dynamic components let you decide <em>which component to render at runtime</em>
        — not at write time. Angular provides two APIs: the declarative
        <code>NgComponentOutlet</code> directive (template-driven) and the imperative
        <code>ViewContainerRef.createComponent()</code> (TypeScript-driven).
        They power dashboards, CMS block renderers, modal systems, and toast overlays.
      </p>

      <h2>1 — Declarative: NgComponentOutlet</h2>
      <p>
        Bind a component <em>class</em> to <code>[ngComponentOutlet]</code>. Angular
        instantiates, mounts, and destroys it as the binding changes — fully lifecycle-aware.
        Pass inputs via <code>[ngComponentOutletInputs]</code>.
      </p>
      <div class="code"><pre>{{ outletSample }}</pre></div>

      <h2>Demo 1 — NgComponentOutlet swap</h2>
      <div class="demo">
        <p class="demo__title">Live — same outlet, different component class</p>
        <div class="row" style="margin-bottom:12px;flex-wrap:wrap">
          <button [class.active]="current() === InfoPanel"    (click)="current.set(InfoPanel)">Info</button>
          <button [class.active]="current() === WarningPanel" (click)="current.set(WarningPanel)">Warning</button>
          <button [class.active]="current() === SuccessPanel" (click)="current.set(SuccessPanel)">Success</button>
        </div>
        <ng-container
          [ngComponentOutlet]="current()"
          [ngComponentOutletInputs]="{ message: note() }"
        />
        <input
          [value]="note()"
          (input)="note.set($any($event.target).value)"
          placeholder="Edit the message…"
          style="margin-top:10px;width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text)"
        />
        <p style="margin-top:8px;font-size:.83rem;color:var(--text-muted)">
          Swapping the class <strong>destroys</strong> the old instance and creates a
          new one (state resets); changing only the inputs object updates the same
          instance in place.
        </p>
      </div>

      <h2>2 — Imperative: ViewContainerRef.createComponent()</h2>
      <p>
        When you need a <code>ComponentRef</code> — to call methods, subscribe to
        outputs, control position, or destroy it from TypeScript — use
        <code>ViewContainerRef.createComponent()</code>.
      </p>
      <div class="code"><pre>{{ imperativeSample }}</pre></div>

      <h2>Demo 2 — createComponent() imperatively</h2>
      <div class="demo">
        <p class="demo__title">Live — TypeScript creates, updates, and destroys the component</p>
        <div class="row" style="margin-bottom:12px;flex-wrap:wrap">
          <button (click)="imperativeMount()">Mount</button>
          <button class="ghost" (click)="imperativeUpdate()">Update message</button>
          <button class="ghost" (click)="imperativeDestroy()">Destroy</button>
        </div>
        <!-- ViewChild anchor — components are inserted here -->
        <div #anchor></div>
        <p style="margin-top:8px;font-size:.83rem;color:var(--text-muted)">
          Status: <code>{{ imperativeStatus() }}</code> — note
          <code>setInput()</code> rather than <code>ref.instance.message = …</code>:
          it validates the input name, marks the view dirty, and drives
          <code>ngOnChanges</code>/signal inputs correctly.
        </p>
      </div>

      <h2>Demo 3 — wiring OUTPUTS of a dynamic component</h2>
      <p>
        The template can't bind <code>(confirmed)="…"</code> on a component that only
        exists at runtime — you subscribe on the instance instead. This is the essence
        of every dialog service's <code>afterClosed()</code>:
      </p>
      <div class="demo">
        <p class="demo__title">Live — a confirm dialog created and awaited from TypeScript</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="ask()">Open confirm panel</button>
        </div>
        <div #confirmAnchor></div>
        <p style="margin-top:8px;font-size:.83rem;color:var(--text-muted)">
          Last answer: <code>{{ confirmResult() }}</code>
        </p>
      </div>
      <div class="code"><pre>{{ outputsSample }}</pre></div>

      <h2>3 — Lazy loading with dynamic import()</h2>
      <p>
        Pass the class through a <code>dynamic import()</code> so the component's JS is
        only downloaded when it's actually needed. The bundler splits it into a
        separate chunk automatically — same mechanics as
        <a routerLink="/deferrable-views">&#64;defer</a>, but under your control:
      </p>
      <div class="code"><pre>{{ lazySample }}</pre></div>
      <div class="note">
        <code>NgComponentOutlet</code> supports lazy loading too:
        <code>[ngComponentOutlet]="lazyClass()"</code> — bind a signal that starts as
        <code>null</code> and resolves to the class after the async import; the outlet
        renders nothing, then mounts.
      </div>

      <h2>4 — Custom injector for scoped DI (the dialog pattern)</h2>
      <p>
        Pass an <code>Injector</code> to scope the dynamic component's DI context —
        this is how Material's <code>MatDialog</code> hands <code>MAT_DIALOG_DATA</code>
        to your dialog component:
      </p>
      <div class="code"><pre>{{ injectorSample }}</pre></div>

      <h2>5 — Projecting content into dynamic components</h2>
      <div class="code"><pre>{{ projectionSample }}</pre></div>
      <p>
        <code>projectableNodes</code> fills the component's <code>&lt;ng-content&gt;</code>
        slots — one array per slot, in the order the slots are declared. This is how a
        toast/dialog service lets callers supply arbitrary body content.
      </p>

      <h2>Under the hood — views, hosts and attachment</h2>
      <ul>
        <li>
          <strong>No factories anymore:</strong> since Ivy, the component class
          <em>is</em> the factory — <code>createComponent()</code> reads the compiled
          definition off the class (<code>ɵcmp</code>). The old
          <code>ComponentFactoryResolver</code>/<code>entryComponents</code> ceremony
          is dead; any standalone class reference works.
        </li>
        <li>
          <strong>Two things always get created:</strong> a host DOM element
          (<code>ref.location</code>) and a view (<code>ref.hostView</code>). The view
          must be part of a change-detection tree to update: a
          <code>ViewContainerRef</code> attaches it automatically; the low-level
          <code>createComponent()</code> function does <em>not</em> — you must call
          <code>appRef.attachView(ref.hostView)</code> yourself (forget it and the
          component renders once, then never updates).
        </li>
        <li>
          <strong>Environment vs element injector:</strong> <code>environmentInjector</code>
          supplies app/route-level services; the optional <code>elementInjector</code>
          layers per-instance tokens (dialog data) on top — the resolution walk from
          the <a routerLink="/di-advanced">DI lesson</a> applies unchanged.
        </li>
      </ul>

      <h2>NgComponentOutlet vs createComponent()</h2>
      <table class="cmp">
        <tr><th></th><th>NgComponentOutlet</th><th>ViewContainerRef.createComponent()</th></tr>
        <tr><td>Style</td><td>declarative, in the template</td><td>imperative, in TypeScript</td></tr>
        <tr><td>Inputs</td><td><code>[ngComponentOutletInputs]</code> object</td><td><code>ref.setInput()</code> per input</td></tr>
        <tr><td>Outputs</td><td>not bindable — a real limitation</td><td><code>ref.instance.someOutput.subscribe()</code></td></tr>
        <tr><td>Lifecycle/cleanup</td><td>automatic (binding change / host destroyed)</td><td>yours: <code>ref.destroy()</code> / <code>vcr.clear()</code></td></tr>
        <tr><td>Position control</td><td>where the ng-container sits</td><td>any container, any index, even <code>document.body</code></td></tr>
        <tr><td>Best for</td><td>CMS blocks, pluggable widgets, tab bodies</td><td>modals, toasts, overlays, drag-drop insertion</td></tr>
      </table>

      <h2>ComponentRef API cheatsheet</h2>
      <table class="t">
        <thead><tr><th>API</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td><code>ref.setInput('name', value)</code></td><td>Trigger-safe input update — validates the name, marks the view dirty, drives signal inputs &amp; ngOnChanges</td></tr>
          <tr><td><code>ref.instance</code></td><td>The component class instance (call methods, subscribe outputs)</td></tr>
          <tr><td><code>ref.location.nativeElement</code></td><td>The host DOM element</td></tr>
          <tr><td><code>ref.hostView</code></td><td>The view — what gets attached to / detached from CD</td></tr>
          <tr><td><code>ref.changeDetectorRef</code></td><td>Per-component CD control (markForCheck etc.)</td></tr>
          <tr><td><code>ref.onDestroy(fn)</code> / <code>ref.destroy()</code></td><td>Cleanup hook / teardown + detach from the view tree</td></tr>
          <tr><td><code>vcr.clear()</code>, <code>vcr.remove(i)</code>, <code>vcr.move(view, i)</code></td><td>Container-level management of created views</td></tr>
          <tr><td><code>appRef.attachView(ref.hostView)</code></td><td>Attach a root-level view (e.g. toast overlay on body)</td></tr>
        </tbody>
      </table>

      <div class="tip">
        <strong>Prefer <code>NgComponentOutlet</code> when you can.</strong>
        It handles inputs, the injector, and lifecycle cleanly in the template.
        Reach for <code>createComponent()</code> only when you need the
        <code>ComponentRef</code> handle — modal services, programmatic toasts,
        output subscriptions, or attaching to <code>document.body</code>.
      </div>
      <div class="warn">
        Always destroy what you create. Leaked <code>ComponentRef</code>s hold their
        whole subtree in memory and keep subscriptions alive. Call <code>ref.destroy()</code>
        or <code>vcr.clear()</code> in <code>ngOnDestroy</code> or after the user closes
        the overlay — and remember output subscriptions die with the ref, so destroy
        order matters if you need the final event.
      </div>

      <h2>Exam corner</h2>
      <details class="qa">
        <summary>Why <code>ref.setInput('x', v)</code> instead of <code>ref.instance.x = v</code>?</summary>
        <div>Direct assignment bypasses the framework: no dirty marking (OnPush
        components won't re-render), no <code>ngOnChanges</code>, and it breaks
        entirely for signal inputs (they're read-only <code>InputSignal</code>s).
        <code>setInput</code> goes through the same path as a template binding.</div>
      </details>
      <details class="qa">
        <summary>Your body-appended toast renders once and never updates. What was forgotten?</summary>
        <div>The view isn't in any CD tree. <code>createComponent()</code> (the
        standalone function) creates but doesn't attach —
        <code>appRef.attachView(ref.hostView)</code> is required; a
        <code>ViewContainerRef</code> would have done it for you.</div>
      </details>
      <details class="qa">
        <summary>How does a dialog service pass data to the dialog component it opens?</summary>
        <div>A custom element injector: <code>Injector.create(&#123; providers: [&#123; provide:
        DIALOG_DATA, useValue: data &#125;] &#125;)</code> passed at creation; the dialog does
        <code>inject(DIALOG_DATA)</code>. Results flow back via an output/subject the
        service subscribes to before returning its <code>afterClosed()</code>
        observable.</div>
      </details>
      <details class="qa">
        <summary>NgComponentOutlet re-created your component and lost its state — you only wanted new inputs. Why?</summary>
        <div>The <em>class binding</em> changed identity (or you passed a new class),
        which is defined as destroy + recreate. To update state, keep the class
        reference stable and change only <code>ngComponentOutletInputs</code> values.</div>
      </details>
      <details class="qa">
        <summary>What replaced <code>ComponentFactoryResolver</code> and <code>entryComponents</code>, and why could they be deleted?</summary>
        <div>Ivy's locality: each compiled class carries its own definition, so the
        class reference is directly instantiable —
        <code>vcr.createComponent(MyCmp)</code>. No factory lookup, no need to
        pre-register dynamic components in a module.</div>
      </details>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>NgComponentOutlet</code> mounts a class declaratively — swap the class to change components (destroy+create), change the inputs object to update in place.</li>
        <li><code>createComponent()</code> returns a <code>ComponentRef</code>: <code>setInput</code> for inputs, <code>instance.output.subscribe</code> for outputs, <code>destroy()</code> when done.</li>
        <li>Views must live in a CD tree — <code>ViewContainerRef</code> attaches automatically; manual creation needs <code>attachView</code>.</li>
        <li>Dynamic <code>import()</code> + a class signal gives you code-split dynamic components; custom element injectors deliver dialog data.</li>
        <li>Cleanup is yours in the imperative world — leaked refs are the classic production bug.</li>
      </ul>

      <p><a routerLink="/host-directives">Next: Directive Composition API →</a></p>
    </article>
  `,
})
export class DynamicComponents implements OnDestroy {
  protected readonly InfoPanel = InfoPanel;
  protected readonly WarningPanel = WarningPanel;
  protected readonly SuccessPanel = SuccessPanel;

  protected readonly current = signal<Type<unknown>>(InfoPanel);
  protected readonly note = signal('all systems nominal');
  protected readonly imperativeStatus = signal('not mounted');
  protected readonly confirmResult = signal('— none yet —');

  @ViewChild('anchor', { read: ViewContainerRef }) private anchor!: ViewContainerRef;
  @ViewChild('confirmAnchor', { read: ViewContainerRef }) private confirmAnchor!: ViewContainerRef;
  private imperativeRef: ComponentRef<InfoPanel> | null = null;
  private confirmRef: ComponentRef<ConfirmPanel> | null = null;
  private updateCount = 0;

  protected imperativeMount(): void {
    this.anchor?.clear();
    this.imperativeRef = this.anchor.createComponent(InfoPanel);
    this.imperativeRef.setInput('message', 'created imperatively!');
    this.imperativeStatus.set('mounted ✓');
  }

  protected imperativeUpdate(): void {
    if (!this.imperativeRef) {
      this.imperativeStatus.set('not mounted — click Mount first');
      return;
    }
    this.updateCount++;
    this.imperativeRef.setInput('message', `updated ${this.updateCount} time${this.updateCount === 1 ? '' : 's'}`);
    this.imperativeStatus.set(`updated (${this.updateCount}×)`);
  }

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

  ngOnDestroy(): void {
    this.imperativeRef?.destroy();
    this.confirmRef?.destroy();
  }

  // ── code samples ────────────────────────────────────────────────────────
  readonly outletSample = `// TypeScript
protected readonly current = signal<Type<unknown>>(InfoPanel);

// Template
<ng-container
  [ngComponentOutlet]="current()"
  [ngComponentOutletInputs]="{ message: note() }"
/>

// Swap component at runtime — old instance destroyed, new one created
current.set(WarningPanel);`;

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

  readonly outputsSample = `const ref = this.vcr.createComponent(ConfirmPanel);
ref.setInput('question', 'Deploy to production?');

// subscribe to the output on the instance — OutputEmitterRef has subscribe()
ref.instance.confirmed.subscribe((yes: boolean) => {
  this.result.set(yes);
  ref.destroy();               // subscription is cleaned up with the ref
});`;

  readonly lazySample = `async mountLazy(): Promise<void> {
  // The chunk is NOT downloaded until this line runs:
  const { HeavyChart } = await import('./heavy-chart.component');
  this.vcr.createComponent(HeavyChart);
}

// declarative flavor — outlet renders nothing until the signal resolves:
protected readonly lazyClass = signal<Type<unknown> | null>(null);
async load() { this.lazyClass.set((await import('./heavy-chart.component')).HeavyChart); }`;

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

  readonly projectionSample = `// component with slots:  <ng-content select="[body]" />  <ng-content />
const body = renderer.createText('Saved successfully.');

const ref = this.vcr.createComponent(ToastShell, {
  projectableNodes: [
    [bodyElement],      // → first  <ng-content select="[body]">
    [footerElement],    // → second <ng-content>
  ],
});`;
}
