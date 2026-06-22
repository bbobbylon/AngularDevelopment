import {
  AfterContentInit,
  Component,
  Directive,
  ElementRef,
  contentChild,
  contentChildren,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

// ── Demo components used in live examples ─────────────────────────────────────

@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <div class="panel">
      <header class="panel__head">
        <ng-content select="[panel-title]">
          <!-- fallback shown when nothing is projected into this slot -->
          <span style="color:var(--text-muted);font-style:italic">No title provided</span>
        </ng-content>
      </header>
      <div class="panel__body">
        <ng-content />   <!-- default (catch-all) slot -->
      </div>
      <footer class="panel__foot">
        <ng-content select="[panel-actions]" />
      </footer>
    </div>
  `,
  styles: [`
    .panel { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg-elevated); }
    .panel__head { padding: 10px 16px; font-weight: 600; border-bottom: 1px solid var(--border); background: var(--bg-card); }
    .panel__body { padding: 14px 16px; color: var(--text); }
    .panel__foot { padding: 10px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
  `],
})
export class Panel {}

/** Marks a tab label — picked up by contentChildren() in TabGroup */
@Directive({ selector: '[tabLabel]', standalone: true })
export class TabLabel {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
}

/** Marks a tab panel body — picked up by contentChildren() in TabGroup */
@Directive({ selector: '[tabPanel]', standalone: true })
export class TabPanel {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
}

/**
 * TabGroup demonstrates contentChildren(): it queries projected TabLabel
 * and TabPanel directives to drive its tab bar without any template binding.
 */
@Component({
  selector: 'app-tab-group',
  standalone: true,
  imports: [TabLabel, TabPanel],
  template: `
    <div class="tg">
      <div class="tg__bar" role="tablist">
        @for (label of labels(); track $index) {
          <button
            class="tg__tab"
            [class.tg__tab--active]="active() === $index"
            (click)="onTabClick($index)"
            role="tab"
          >{{ label.el.nativeElement.textContent }}</button>
        }
      </div>
      <!-- The projected content is always in the DOM but we hide/show via CSS -->
      <div class="tg__body">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .tg { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
    .tg__bar { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-card); }
    .tg__tab { background: none; border: none; padding: 8px 16px; cursor: pointer; color: var(--text-muted); font-size: .88rem; border-bottom: 2px solid transparent; transition: color .12s, border-color .12s; }
    .tg__tab--active { color: var(--accent); border-bottom-color: var(--accent); }
    .tg__body { padding: 16px; }
    [tabPanel] { display: none; }
    [tabPanel].visible { display: block; }
  `],
})
export class TabGroup implements AfterContentInit {
  protected readonly active = signal(0);

  // contentChildren() — signal-based query over projected directives.
  // Runs after content initialises and updates reactively if children change.
  readonly labels  = contentChildren(TabLabel);
  readonly panels  = contentChildren(TabPanel);

  ngAfterContentInit(): void {
    // Sync visible panel whenever active index changes — effect() would also work.
    this.syncPanels();
  }

  protected syncPanels(): void {
    const idx = this.active();
    this.panels().forEach((p, i) => {
      if (i === idx) p.el.nativeElement.classList.add('visible');
      else           p.el.nativeElement.classList.remove('visible');
    });
  }

  protected onTabClick(idx: number): void {
    this.active.set(idx);
    this.syncPanels();
  }
}

/** Demonstrates ngProjectAs — projects ng-container as a specific selector */
@Component({
  selector: 'app-badge-host',
  standalone: true,
  template: `
    <span class="badge-host">
      <ng-content select=".badge" />
    </span>
  `,
  styles: [`
    .badge-host { display: inline-flex; gap: 4px; flex-wrap: wrap; }
  `],
})
export class BadgeHost {}

// ── The lesson component ───────────────────────────────────────────────────────

@Component({
  selector: 'app-lesson-content-projection',
  standalone: true,
  imports: [RouterLink, Panel, TabGroup, TabLabel, TabPanel, BadgeHost],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Components &amp; Templates</span>
      <h1>Content Projection</h1>
      <p class="lead">
        Content projection lets a parent inject its own DOM into a child component's
        template. <code>&lt;ng-content&gt;</code> is the insertion point — the foundation
        of flexible card layouts, dialog boxes, tabs, and every other "shell" component.
        Angular 17+ adds signal-based <code>contentChild()</code> /
        <code>contentChildren()</code> to query projected nodes reactively.
      </p>

      <h2>1 — Single slot (default)</h2>
      <p>
        The simplest form: one <code>&lt;ng-content&gt;</code> absorbs everything the
        parent puts between the component's open and close tags.
      </p>
      <div class="code"><pre>// child component
&#64;Component(&#123;
  selector: 'app-callout',
  template: \`
    &lt;div class="callout"&gt;
      &lt;ng-content /&gt;   &lt;!-- ← everything projected here --&gt;
    &lt;/div&gt;
  \`,
&#125;)
export class Callout &#123;&#125;

// parent template
&lt;app-callout&gt;
  &lt;strong&gt;Heads up!&lt;/strong&gt; This is projected content.
&lt;/app-callout&gt;</pre></div>

      <h2>2 — Multi-slot with select</h2>
      <p>
        Add a CSS <code>select</code> attribute to route specific content to named slots.
        Anything that does <em>not</em> match a selector falls into the bare
        <code>&lt;ng-content&gt;</code> (default slot).
      </p>
      <div class="code"><pre>&#64;Component(&#123;
  template: \`
    &lt;header&gt;&lt;ng-content select="[panel-title]" /&gt;&lt;/header&gt;
    &lt;div&gt;&lt;ng-content /&gt;&lt;/div&gt;           &lt;!-- default --&gt;
    &lt;footer&gt;&lt;ng-content select="[panel-actions]" /&gt;&lt;/footer&gt;
  \`,
&#125;)
export class Panel &#123;&#125;

// parent
&lt;app-panel&gt;
  &lt;h3 panel-title&gt;Invoice #42&lt;/h3&gt;
  &lt;p&gt;Body goes in the default slot.&lt;/p&gt;
  &lt;ng-container panel-actions&gt;
    &lt;button&gt;Pay now&lt;/button&gt;
  &lt;/ng-container&gt;
&lt;/app-panel&gt;</pre></div>

      <h2>Demo 1 — multi-slot Panel</h2>
      <div class="demo">
        <p class="demo__title">Live — three slots: title, body (default), actions</p>
        <app-panel>
          <h3 panel-title style="margin:0">Invoice #42</h3>
          <p style="margin:0">This paragraph lands in the <strong>default</strong> slot.</p>
          <ng-container panel-actions>
            <button>Pay now</button>
            <button class="ghost">Dismiss</button>
          </ng-container>
        </app-panel>
      </div>

      <h2>3 — Fallback content</h2>
      <p>
        Place default markup inside <code>&lt;ng-content&gt;</code>. It renders only
        when the parent projects <em>nothing</em> into that slot.
      </p>
      <div class="code"><pre>&lt;ng-content select="[panel-title]"&gt;
  &lt;span style="color:gray"&gt;No title provided&lt;/span&gt;   &lt;!-- fallback --&gt;
&lt;/ng-content&gt;</pre></div>

      <h2>Demo 2 — fallback title</h2>
      <div class="demo">
        <p class="demo__title">Live — title slot left empty, fallback shows</p>
        <app-panel>
          <!-- No panel-title projected here — fallback renders -->
          <p style="margin:0">Body content is still projected normally.</p>
          <ng-container panel-actions>
            <button>OK</button>
          </ng-container>
        </app-panel>
      </div>

      <h2>4 — contentChild() and contentChildren()</h2>
      <p>
        Signal-based queries that find projected directives or elements. They replace the
        decorator equivalents (<code>&#64;ContentChild</code> / <code>&#64;ContentChildren</code>)
        and update reactively when projected content changes.
      </p>
      <div class="code"><pre>&#64;Component(&#123; selector: 'app-tab-group', … &#125;)
export class TabGroup implements AfterContentInit &#123;
  // Returns a readonly Signal&lt;readonly TabLabel[]&gt;
  readonly labels  = contentChildren(TabLabel);   // ← directive token
  readonly panels  = contentChildren(TabPanel);

  ngAfterContentInit(): void &#123;
    // labels() is live — reads it inside effect() to react to changes
    console.log(this.labels().length, 'tabs found');
  &#125;
&#125;

// Parent template
&lt;app-tab-group&gt;
  &lt;span tabLabel&gt;Overview&lt;/span&gt;
  &lt;div  tabPanel&gt;Overview content…&lt;/div&gt;
  &lt;span tabLabel&gt;Settings&lt;/span&gt;
  &lt;div  tabPanel&gt;Settings content…&lt;/div&gt;
&lt;/app-tab-group&gt;</pre></div>

      <h2>Demo 3 — contentChildren() driving a tab bar</h2>
      <div class="demo">
        <p class="demo__title">Live — TabGroup queries projected TabLabel / TabPanel directives</p>
        <app-tab-group>
          <span tabLabel>Overview</span>
          <div tabPanel>
            <p style="margin:0">This is the <strong>Overview</strong> tab. Switch tabs above to hide/show panels.</p>
          </div>
          <span tabLabel>Features</span>
          <div tabPanel>
            <p style="margin:0"><strong>Features</strong> tab — same component instance, different projected content shown.</p>
          </div>
          <span tabLabel>API</span>
          <div tabPanel>
            <p style="margin:0"><strong>API</strong> reference tab. The <code>TabGroup</code> reads labels and panels via <code>contentChildren()</code>.</p>
          </div>
        </app-tab-group>
      </div>

      <h2>5 — ngProjectAs</h2>
      <p>
        <code>ngProjectAs</code> makes Angular treat a node as if it matched a different
        selector. Useful when a wrapper (e.g., <code>ng-container</code>) has to satisfy
        a <code>select</code> that targets a class or element.
      </p>
      <div class="code"><pre>// child expects: &lt;ng-content select=".badge" /&gt;

// parent — wrap several badges in ng-container, project as .badge
&lt;app-badge-host&gt;
  &lt;ng-container ngProjectAs=".badge"&gt;
    &lt;span class="pill"&gt;New&lt;/span&gt;
    &lt;span class="pill"&gt;Beta&lt;/span&gt;
  &lt;/ng-container&gt;
&lt;/app-badge-host&gt;</pre></div>

      <h2>Demo 4 — ngProjectAs</h2>
      <div class="demo">
        <p class="demo__title">Live — ng-container projected as .badge selector</p>
        <app-badge-host>
          <ng-container ngProjectAs=".badge">
            <span class="pill">New</span>
            <span class="pill" style="background:rgba(124,77,255,.15);color:#7c3aed;border-color:rgba(124,77,255,.3)">Beta</span>
            <span class="pill" style="background:rgba(5,150,105,.12);color:#059669;border-color:rgba(5,150,105,.3)">Stable</span>
          </ng-container>
        </app-badge-host>
      </div>

      <h2>Projection vs. ViewChild — which query to use?</h2>
      <table class="t">
        <thead><tr><th>Situation</th><th>Use</th></tr></thead>
        <tbody>
          <tr><td>Query something inside the component's own template</td><td><code>viewChild()</code> / <code>viewChildren()</code></td></tr>
          <tr><td>Query content projected from the parent</td><td><code>contentChild()</code> / <code>contentChildren()</code></td></tr>
          <tr><td>Access a projected element's DOM node</td><td><code>contentChild(SomeDirective)</code> then <code>.el.nativeElement</code></td></tr>
          <tr><td>Query projected components (not directives)</td><td><code>contentChildren(MyComponent)</code></td></tr>
        </tbody>
      </table>

      <div class="note">
        <strong>Projected content keeps its original injection context.</strong>
        The projected nodes are created by the <em>parent</em>, not the child. This means
        services, tokens, and lifecycle hooks belong to the parent component tree, not the
        child that hosts the <code>ng-content</code>.
      </div>
      <div class="warn">
        Projected content is <strong>always instantiated eagerly</strong>, even if its
        <code>ng-content</code> slot is hidden by <code>&#64;if</code> in the child. To
        truly defer projection, use <code>&#64;defer</code> in the <em>parent</em> or pass
        a template reference (<code>TemplateRef</code>) and render it lazily via
        <code>NgTemplateOutlet</code>.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&lt;ng-content&gt;</code> is where the parent's projected content renders.</li>
        <li><code>select</code> routes matching nodes to named slots; the bare one is the default.</li>
        <li>Place fallback markup inside <code>&lt;ng-content&gt;</code> — it shows when the slot is empty.</li>
        <li><code>contentChildren(Token)</code> returns a live signal; query projected directives/components reactively.</li>
        <li><code>ngProjectAs</code> changes the selector match for a node without changing its real tag or class.</li>
        <li>Projected content keeps its parent injection context — querying it uses <code>contentChild</code>, not <code>viewChild</code>.</li>
      </ul>

      <p><a routerLink="/view-queries">Next: View Queries →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
  `],
})
export class ContentProjection {}
