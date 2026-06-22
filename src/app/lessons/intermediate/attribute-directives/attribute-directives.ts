import {
  Component,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  WritableSignal,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** Modern style: inject() instead of constructor params, signal input(), host metadata */
@Directive({
  selector: '[appHighlight]',
  standalone: true,
  // host: {} replaces every @HostBinding — cleaner, compiled away at build time.
  host: {
    '[style.transition]': '"background-color .15s ease"',
    '[style.cursor]': '"pointer"',
    '[style.backgroundColor]': 'bg()',
  },
})
export class HighlightDirective {
  /** signal input: typed, readonly, no @Input() needed. Default = amber highlight. */
  appHighlight = input<string>('var(--amber)');

  protected readonly bg: WritableSignal<string> = signal('');

  constructor() {
    // effect() could also sync the color, but @HostListener is simpler here.
  }

  @HostListener('mouseenter') onEnter() { this.bg.set(this.appHighlight()); }
  @HostListener('mouseleave') onLeave() { this.bg.set(''); }
}

/** Modern: inject() for ElementRef/Renderer2, host: {} for bindings */
@Directive({
  selector: '[appBadge]',
  standalone: true,
  exportAs: 'appBadge',           // parent template can grab: #b="appBadge"
  host: {
    '[class.badge-active]': 'active()',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class BadgeDirective {
  label = input<string>('New');

  readonly active = signal(true);
  readonly ariaLabel = signal('');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      this.ariaLabel.set(this.active() ? `Badge: ${this.label()}` : '');
    });
  }

  toggle(): void { this.active.update(v => !v); }
}

/** Real-world: tooltip that this app's shared TooltipDirective is based on */
@Directive({
  selector: '[appDemoTooltip]',
  standalone: true,
})
export class DemoTooltipDirective implements OnDestroy {
  text = input<string>('', { alias: 'appDemoTooltip' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private tip: HTMLElement | null = null;

  @HostListener('mouseenter') show(): void {
    if (!this.text()) return;
    this.tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(this.tip, 'app-tooltip');
    this.renderer.setProperty(this.tip, 'textContent', this.text());
    this.renderer.appendChild(document.body, this.tip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(this.tip, 'left', `${rect.left + rect.width / 2 + window.scrollX}px`);
    this.renderer.setStyle(this.tip, 'top', `${rect.top - 36 + window.scrollY}px`);
  }

  @HostListener('mouseleave') hide(): void {
    if (this.tip) {
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    }
  }

  ngOnDestroy(): void { this.hide(); }
}

@Component({
  selector: 'app-lesson-attribute-directives',
  standalone: true,
  imports: [RouterLink, HighlightDirective, BadgeDirective, DemoTooltipDirective],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Pipes &amp; Directives</span>
      <h1>Custom Attribute Directives</h1>
      <p class="lead">
        Attribute directives attach behavior to an existing element — no template of their
        own, just host bindings and event listeners. They are the primitive behind
        <code>NgClass</code>, <code>NgStyle</code>, and every third-party UI library's
        interactive helpers. In Angular 17+ the patterns got cleaner: <code>inject()</code>
        replaces constructor injection, <code>input()</code> replaces <code>&#64;Input()</code>,
        and <code>host: &#123;&#125;</code> in the decorator replaces <code>&#64;HostBinding</code>.
      </p>

      <h2>Modern directive anatomy</h2>
      <div class="code"><pre>&#64;Directive(&#123;
  selector: '[appHighlight]',
  standalone: true,
  // host: &#123;&#125; replaces every &#64;HostBinding — compiled away at build time
  host: &#123;
    '[style.transition]': '"background-color .15s ease"',
    '[style.backgroundColor]': 'bg()',   // reads a signal
  &#125;,
&#125;)
export class HighlightDirective &#123;
  // signal input — replaces &#64;Input()
  appHighlight = input&lt;string&gt;('var(--amber)');
  protected readonly bg = signal('');

  &#64;HostListener('mouseenter') onEnter() &#123; this.bg.set(this.appHighlight()); &#125;
  &#64;HostListener('mouseleave') onLeave() &#123; this.bg.set(''); &#125;
&#125;</pre></div>

      <p>Three modern patterns in one directive:</p>
      <ul>
        <li><strong><code>host: &#123;&#125;</code></strong> — property/event bindings in the decorator metadata. No <code>&#64;HostBinding</code> needed. Angular compiles these directly into the directive's change-detection code — faster than decorators at runtime.</li>
        <li><strong><code>input()</code></strong> — signal-based, typed, readonly. Reading it inside <code>host</code> bindings or <code>effect()</code> creates reactive dependencies automatically.</li>
        <li><strong><code>inject()</code></strong> in the constructor body or as a field initialiser — replaces constructor parameter injection. Same DI resolution, cleaner code.</li>
      </ul>

      <h2>Demo 1 — hover highlight (signal input)</h2>
      <div class="demo">
        <p class="demo__title">Live — hover each row</p>
        <p appHighlight style="padding:8px 12px;border-radius:8px;margin-bottom:8px">
          Default amber — <code>&lt;p appHighlight&gt;</code>
        </p>
        <p [appHighlight]="'rgba(124,77,255,.35)'" style="padding:8px 12px;border-radius:8px;margin-bottom:8px">
          Violet — <code>[appHighlight]="'rgba(124,77,255,.35)'"</code>
        </p>
        <p [appHighlight]="'rgba(46,193,107,.30)'" style="padding:8px 12px;border-radius:8px">
          Green — <code>[appHighlight]="'rgba(46,193,107,.30)'"</code>
        </p>
      </div>

      <h2>Injecting ElementRef and Renderer2</h2>
      <p>
        When you need to read or modify the host element directly, inject
        <code>ElementRef</code> and <code>Renderer2</code>. Use <code>Renderer2</code>
        rather than touching <code>.nativeElement</code> directly — it stays compatible
        with SSR and Web Workers.
      </p>
      <div class="code"><pre>private readonly el = inject&lt;ElementRef&lt;HTMLElement&gt;&gt;(ElementRef);
private readonly renderer = inject(Renderer2);

// Add a CSS class safely across all platforms:
this.renderer.addClass(this.el.nativeElement, 'is-active');

// Set an inline style:
this.renderer.setStyle(this.el.nativeElement, 'color', 'red');

// Create and append a child element:
const tip = this.renderer.createElement('span');
this.renderer.setProperty(tip, 'textContent', 'Hello');
this.renderer.appendChild(this.el.nativeElement, tip);</pre></div>

      <h2>exportAs — access directive from the template</h2>
      <p>
        Set <code>exportAs</code> in the decorator to give the template a reference to the
        directive instance. Useful for calling directive methods from the parent.
      </p>
      <div class="code"><pre>&#64;Directive(&#123;
  selector: '[appBadge]',
  exportAs: 'appBadge',   // ← the alias
&#125;)
export class BadgeDirective &#123;
  label = input&lt;string&gt;('New');
  active = signal(true);
  toggle() &#123; this.active.update(v => !v); &#125;
&#125;

// Template — grab the directive instance via #b="appBadge"
&lt;span appBadge label="Beta" #b="appBadge"&gt;&lt;/span&gt;
&lt;button (click)="b.toggle()"&gt;Toggle badge&lt;/button&gt;</pre></div>

      <h2>Demo 2 — exportAs + signal input</h2>
      <div class="demo">
        <p class="demo__title">Live — toggle the badge visibility</p>
        <div class="row" style="gap:12px;align-items:center">
          <span appBadge [label]="'Beta'" #badge="appBadge"
                style="padding:4px 12px;border-radius:999px;background:var(--bg-elevated);border:1px solid var(--border)">
            Feature {{ badge.active() ? badge.label() : '(hidden)' }}
          </span>
          <button (click)="badge.toggle()">Toggle badge</button>
        </div>
        <p style="margin-top:10px;font-size:.85rem;color:var(--text-muted)">
          <code>active()</code> = {{ badge.active() }} · <code>ariaLabel()</code> = "{{ badge.ariaLabel() }}"
        </p>
      </div>

      <h2>Real-world: tooltip directive</h2>
      <p>
        The app-wide tooltip in this platform (<code>shared/tooltip.directive.ts</code>) is
        an attribute directive. It dynamically appends a floating <code>div</code> to
        <code>document.body</code>, positions it via <code>getBoundingClientRect()</code>,
        and cleans up in <code>ngOnDestroy</code>.
      </p>
      <div class="code"><pre>&#64;Directive(&#123; selector: '[appTooltip]', standalone: true &#125;)
export class TooltipDirective implements OnDestroy &#123;
  text = input&lt;string&gt;('', &#123; alias: 'appTooltip' &#125;);

  private readonly el     = inject&lt;ElementRef&lt;HTMLElement&gt;&gt;(ElementRef);
  private readonly renderer = inject(Renderer2);
  private tip: HTMLElement | null = null;

  &#64;HostListener('mouseenter') show(): void &#123;
    this.tip = this.renderer.createElement('div');
    this.renderer.addClass(this.tip, 'app-tooltip');
    this.renderer.setProperty(this.tip, 'textContent', this.text());
    this.renderer.appendChild(document.body, this.tip);
    // position relative to host bounding box…
  &#125;

  &#64;HostListener('mouseleave') hide(): void &#123;
    if (this.tip) &#123;
      this.renderer.removeChild(document.body, this.tip);
      this.tip = null;
    &#125;
  &#125;

  ngOnDestroy(): void &#123; this.hide(); &#125;
&#125;</pre></div>

      <h2>Demo 3 — tooltip directive</h2>
      <div class="demo">
        <p class="demo__title">Live — hover each button</p>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          <button [appDemoTooltip]="'Saves your progress'">Save</button>
          <button [appDemoTooltip]="'Permanently deletes — cannot undo'">Delete</button>
          <button [appDemoTooltip]="'Sends a copy to your inbox'">Share</button>
        </div>
      </div>

      <h2>Old patterns vs. modern equivalents</h2>
      <table class="t">
        <thead><tr><th>Old pattern</th><th>Modern Angular 17+ equivalent</th></tr></thead>
        <tbody>
          <tr><td><code>&#64;Input() color = ''</code></td><td><code>color = input&lt;string&gt;('')</code></td></tr>
          <tr><td><code>&#64;HostBinding('class.active') isActive</code></td><td><code>host: &#123; '[class.active]': 'isActive()' &#125;</code></td></tr>
          <tr><td><code>constructor(private el: ElementRef) &#123;&#125;</code></td><td><code>private el = inject(ElementRef)</code></td></tr>
          <tr><td><code>&#64;Input('appTooltip') text</code> (alias)</td><td><code>text = input('', &#123; alias: 'appTooltip' &#125;)</code></td></tr>
          <tr><td>Manually implement <code>OnChanges</code> to watch inputs</td><td><code>effect(() =&gt; &#123; /* reads input() signals reactively */ &#125;)</code></td></tr>
        </tbody>
      </table>

      <div class="tip">
        <strong>When to use <code>host: &#123;&#125;</code> vs <code>&#64;HostBinding</code>:</strong>
        <code>host: &#123;&#125;</code> is resolved at compile time and optimised — prefer it for all
        new directives. <code>&#64;HostBinding</code> / <code>&#64;HostListener</code> still work
        and may be clearer for simple cases.
      </div>
      <div class="warn">
        Never write to <code>el.nativeElement</code> in a loop without <code>Renderer2</code> —
        raw DOM access breaks SSR and makes tests harder. Renderer2 methods are always safe.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&#64;Directive</code> with an attribute selector adds behaviour to any existing element — no template.</li>
        <li><code>host: &#123;&#125;</code> in the decorator replaces <code>&#64;HostBinding</code> and is more efficient.</li>
        <li><code>input()</code> replaces <code>&#64;Input()</code> — signal-based, reactive, readonly in the directive.</li>
        <li><code>inject()</code> replaces constructor param injection — works in the constructor body or as a field initializer.</li>
        <li><code>exportAs</code> lets the parent template call methods on the directive instance.</li>
        <li>Always clean up created DOM and subscriptions in <code>ngOnDestroy</code>.</li>
      </ul>

      <p><a routerLink="/content-projection">Next: Content Projection →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    .badge-active { outline: 2px solid var(--accent); outline-offset: 2px; }
  `],
})
export class AttributeDirectives {}
