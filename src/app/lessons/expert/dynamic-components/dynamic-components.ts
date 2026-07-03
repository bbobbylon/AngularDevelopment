import { NgComponentOutlet } from '@angular/common';
import {
  ApplicationRef,
  Component,
  ComponentRef,
  EnvironmentInjector,
  Input,
  OnDestroy,
  Type,
  ViewChild,
  ViewContainerRef,
  createComponent,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

// ── Demo components that will be rendered dynamically ────────────────────────

@Component({
  selector: 'app-info-panel',
  standalone: true,
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
  standalone: true,
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
  standalone: true,
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

// ── Lesson component ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-lesson-dynamic-components',
  standalone: true,
  // Panels are instantiated via NgComponentOutlet (runtime class references),
  // so they do not belong in template imports.
  imports: [RouterLink, NgComponentOutlet],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Expert · Architecture</span>
      <h1>Dynamic Components</h1>
      <p class="lead">
        Dynamic components let you decide <em>which component to render at runtime</em>
        — not at write time. Angular provides two APIs: the declarative
        <code>NgComponentOutlet</code> directive (template-driven) and the imperative
        <code>ViewContainerRef.createComponent()</code> (TypeScript-driven).
        They power dashboards, CMS block renderers, modal systems, and toast overlays
        (exactly how this app's <code>ToastService</code> works under the hood).
      </p>

      <h2>1 — Declarative: NgComponentOutlet</h2>
      <p>
        Bind a component <em>class</em> to <code>[ngComponentOutlet]</code>. Angular
        instantiates, mounts, and destroys it as the binding changes — fully lifecycle-aware.
        Pass inputs via <code>[ngComponentOutletInputs]</code>.
      </p>
      <div class="code"><pre>// TypeScript
protected readonly current = signal&lt;Type&lt;unknown&gt;&gt;(InfoPanel);

// Template
&lt;ng-container
  [ngComponentOutlet]="current()"
  [ngComponentOutletInputs]="&#123; message: note() &#125;"
/&gt;

// Swap component at runtime
current.set(WarningPanel);</pre></div>

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
      </div>

      <h2>2 — Imperative: ViewContainerRef.createComponent()</h2>
      <p>
        When you need a <code>ComponentRef</code> — to call methods, subscribe to
        outputs, control position, or destroy it from TypeScript — use
        <code>ViewContainerRef.createComponent()</code>.
      </p>
      <div class="code"><pre>private readonly vcr = inject(ViewContainerRef);
private ref: ComponentRef&lt;InfoPanel&gt; | null = null;

mount(): void &#123;
  this.vcr.clear();
  this.ref = this.vcr.createComponent(InfoPanel);
  this.ref.setInput('message', 'Created imperatively!');
&#125;

update(msg: string): void &#123;
  this.ref?.setInput('message', msg);
&#125;

destroy(): void &#123;
  this.ref?.destroy();
  this.ref = null;
  this.vcr.clear();
&#125;</pre></div>

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
          Status: <code>{{ imperativeStatus() }}</code>
        </p>
      </div>

      <h2>3 — Lazy loading with dynamic import()</h2>
      <p>
        Pass the class through a <code>dynamic import()</code> so the component's JS is
        only downloaded when it's actually needed. Angular's bundler splits it into a
        separate chunk automatically.
      </p>
      <div class="code"><pre>async mountLazy(): Promise&lt;void&gt; &#123;
  // The chunk is NOT downloaded until this line runs:
  const &#123; InfoPanel &#125; = await import('./info-panel.component');
  this.vcr.createComponent(InfoPanel);
&#125;</pre></div>
      <div class="note">
        <code>NgComponentOutlet</code> supports lazy loading too:
        <code>[ngComponentOutlet]="lazyClass()"</code> — bind a signal that resolves
        to the class after an async import and the outlet will mount it automatically.
      </div>

      <h2>4 — Custom injector for scoped DI</h2>
      <p>
        Pass an <code>Injector</code> to scope the dynamic component's DI context —
        useful for providing dialog-specific data or overriding a service.
      </p>
      <div class="code"><pre>import &#123; createComponent, EnvironmentInjector, Injector &#125; from '&#64;angular/core';

const injector = Injector.create(&#123;
  providers: [&#123; provide: DIALOG_DATA, useValue: &#123; title: 'Confirm' &#125; &#125;],
  parent: inject(EnvironmentInjector),
&#125;);

const ref = createComponent(MyDialog, &#123;
  environmentInjector: inject(EnvironmentInjector),
  elementInjector: injector,
&#125;);
inject(ApplicationRef).attachView(ref.hostView);
document.body.appendChild(ref.location.nativeElement);</pre></div>

      <h2>ComponentRef API cheatsheet</h2>
      <table class="t">
        <thead><tr><th>API</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td><code>ref.setInput('name', value)</code></td><td>Trigger-safe input update — goes through signal / CD</td></tr>
          <tr><td><code>ref.instance</code></td><td>Access the component class instance directly</td></tr>
          <tr><td><code>ref.location.nativeElement</code></td><td>The host DOM element</td></tr>
          <tr><td><code>ref.changeDetectorRef.markForCheck()</code></td><td>Schedule a CD check for this component</td></tr>
          <tr><td><code>ref.destroy()</code></td><td>Destroy + detach from the view tree</td></tr>
          <tr><td><code>vcr.clear()</code></td><td>Destroy all components created in this container</td></tr>
          <tr><td><code>appRef.attachView(ref.hostView)</code></td><td>Attach a root-level view (e.g. toast overlay on body)</td></tr>
        </tbody>
      </table>

      <div class="tip">
        <strong>Prefer <code>NgComponentOutlet</code> when you can.</strong>
        It handles inputs, the injector, and lifecycle cleanly in the template.
        Reach for <code>createComponent()</code> only when you need the
        <code>ComponentRef</code> handle — modal services, programmatic toasts,
        drag-and-drop insertion, or attaching to <code>document.body</code>.
      </div>
      <div class="warn">
        Always destroy what you create. Leaked <code>ComponentRef</code>s hold their
        whole subtree in memory and keep subscriptions alive. Call <code>ref.destroy()</code>
        or <code>vcr.clear()</code> in <code>ngOnDestroy</code> or after the user closes
        the overlay.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>NgComponentOutlet</code> mounts a component class declaratively — swap the bound class to change components.</li>
        <li><code>[ngComponentOutletInputs]</code> feeds typed inputs without casting.</li>
        <li><code>ViewContainerRef.createComponent()</code> returns a <code>ComponentRef</code> for full programmatic control.</li>
        <li>Wrap the class in a <code>dynamic import()</code> for automatic code-splitting.</li>
        <li>Provide a custom <code>Injector</code> to scope DI — essential for modal/dialog patterns.</li>
        <li>Always call <code>ref.destroy()</code> to prevent memory leaks.</li>
      </ul>

      <p><a routerLink="/host-directives">Next: Directive Composition API →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  `],
})
export class DynamicComponents implements OnDestroy {
  protected readonly InfoPanel    = InfoPanel;
  protected readonly WarningPanel = WarningPanel;
  protected readonly SuccessPanel = SuccessPanel;

  protected readonly current = signal<Type<unknown>>(InfoPanel);
  protected readonly note    = signal('all systems nominal');
  protected readonly imperativeStatus = signal('not mounted');

  @ViewChild('anchor', { read: ViewContainerRef }) private anchor!: ViewContainerRef;
  private imperativeRef: ComponentRef<InfoPanel> | null = null;
  private updateCount = 0;

  protected imperativeMount(): void {
    this.anchor?.clear();
    this.imperativeRef = this.anchor.createComponent(InfoPanel);
    this.imperativeRef.setInput('message', 'created imperatively!');
    this.imperativeStatus.set('mounted ✓');
  }

  protected imperativeUpdate(): void {
    if (!this.imperativeRef) { this.imperativeStatus.set('not mounted — click Mount first'); return; }
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

  ngOnDestroy(): void {
    this.imperativeRef?.destroy();
  }
}
