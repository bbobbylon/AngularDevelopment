import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shell component that renders any TemplateRef passed to it as an input(). */
@Component({
  selector: 'app-slot-host',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="slot-host">
      <div class="slot-host__label">Rendered inside SlotHost:</div>
      <ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />
    </div>
  `,
  styles: [`
    .slot-host { border: 2px dashed var(--accent); border-radius: 10px; padding: 14px 18px; }
    .slot-host__label { font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; color: var(--accent); margin-bottom: 8px; }
  `],
})
export class SlotHost {
  template = input.required<TemplateRef<unknown>>();
  ctx      = input<Record<string, unknown>>({});
}

interface Person { name: string; role: string; }

@Component({
  selector: 'app-lesson-ng-template-outlet',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, SlotHost],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Components &amp; Templates</span>
      <h1>ng-template &amp; NgTemplateOutlet</h1>
      <p class="lead">
        <code>&lt;ng-template&gt;</code> declares a view blueprint that is never rendered
        on its own — you stamp it out on demand via <code>NgTemplateOutlet</code>.
        This is the primitive Angular itself uses for <code>&#64;if</code>, <code>&#64;for</code>,
        skeleton loaders, and every "bring-your-own-row" table/list component.
      </p>

      <h2>1 — Define once, render multiple times</h2>
      <div class="code"><pre>&lt;ng-template #greetTpl&gt;
  &lt;p&gt;Hello from the blueprint!&lt;/p&gt;
&lt;/ng-template&gt;

&lt;!-- Render the same template in two places --&gt;
&lt;ng-container [ngTemplateOutlet]="greetTpl" /&gt;
&lt;ng-container [ngTemplateOutlet]="greetTpl" /&gt;</pre></div>

      <h2>Demo 1 — one template, two outlets</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <ng-template #greetTpl>
          <div style="padding:8px 12px;background:var(--bg-elevated);border-radius:8px;border:1px solid var(--border)">
            ✨ Hello from the blueprint!
          </div>
        </ng-template>
        <div style="display:flex;flex-direction:column;gap:8px">
          <ng-container [ngTemplateOutlet]="greetTpl" />
          <ng-container [ngTemplateOutlet]="greetTpl" />
        </div>
      </div>

      <h2>2 — Template context ($implicit + named keys)</h2>
      <p>
        Pass a context object to inject variables into the template.
        <code>$implicit</code> maps to the unnamed <code>let-x</code>;
        other keys need <code>let-x="key"</code>.
      </p>
      <div class="code"><pre>&lt;ng-template #personRow let-p let-badge="badge"&gt;
  &lt;strong&gt;{{ '{{' }} p.name {{ '}}' }}&lt;/strong&gt; — {{ '{{' }} p.role {{ '}}' }}
  &#64;if (badge) &#123; &lt;span&gt;{{ '{{' }} badge {{ '}}' }}&lt;/span&gt; &#125;
&lt;/ng-template&gt;

&#64;for (person of people(); track person.name) &#123;
  &lt;ng-container
    [ngTemplateOutlet]="personRow"
    [ngTemplateOutletContext]="&#123; $implicit: person, badge: person.role === 'Admin' ? '★' : '' &#125;"
  /&gt;
&#125;</pre></div>

      <h2>Demo 2 — context per outlet</h2>
      <div class="demo">
        <p class="demo__title">Live — same template, different context each render</p>
        <ng-template #personRow let-p let-badge="badge">
          <div style="display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);margin-bottom:5px">
            <strong>{{ p.name }}</strong>
            <span class="pill">{{ p.role }}</span>
            @if (badge) { <span class="pill" style="color:var(--green);border-color:var(--green)">{{ badge }}</span> }
          </div>
        </ng-template>
        @for (p of people(); track p.name) {
          <ng-container
            [ngTemplateOutlet]="personRow"
            [ngTemplateOutletContext]="{ $implicit: p, badge: p.role === 'Admin' ? '★ owner' : '' }"
          />
        }
      </div>

      <h2>3 — Signal-driven layout swap</h2>
      <p>
        Store which template to use in a signal. Switching the signal changes the outlet
        immediately — no <code>&#64;if</code> duplication needed.
      </p>
      <div class="code"><pre>protected readonly view = signal&lt;'compact' | 'detailed'&gt;('compact');

// Template
&lt;ng-container [ngTemplateOutlet]="view() === 'compact' ? compactTpl : detailedTpl"
              [ngTemplateOutletContext]="{ $implicit: item }" /&gt;</pre></div>

      <h2>Demo 3 — swap layouts with a signal</h2>
      <div class="demo">
        <p class="demo__title">Live — toggle between compact chips and detailed rows</p>
        <div class="row" style="margin-bottom:12px">
          <button [class.active]="view() === 'compact'" (click)="view.set('compact')">Compact</button>
          <button [class.active]="view() === 'detailed'" (click)="view.set('detailed')">Detailed</button>
        </div>
        <ng-template #compactTpl let-p>
          <span class="pill" style="margin-right:6px">{{ p.name }}</span>
        </ng-template>
        <ng-template #detailedTpl let-p>
          <div style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:5px">
            <strong>{{ p.name }}</strong> · <span style="color:var(--text-muted)">{{ p.role }}</span>
          </div>
        </ng-template>
        @for (p of people(); track p.name) {
          <ng-container
            [ngTemplateOutlet]="view() === 'compact' ? compactTpl : detailedTpl"
            [ngTemplateOutletContext]="{ $implicit: p }"
          />
        }
      </div>

      <h2>4 — TemplateRef as a component input()</h2>
      <p>
        Pass a <code>TemplateRef</code> into a child component — the child controls
        <em>where/when</em> to render; the parent controls <em>what</em>.
        This is the pattern behind Angular Material tables, CDK overlays, and
        any "bring-your-own-template" API.
      </p>
      <div class="code"><pre>&#64;Component(&#123;
  selector: 'app-slot-host',
  imports: [NgTemplateOutlet],
  template: \`
    &lt;ng-container
      [ngTemplateOutlet]="template()"
      [ngTemplateOutletContext]="ctx()"
    /&gt;
  \`,
&#125;)
export class SlotHost &#123;
  template = input.required&lt;TemplateRef&lt;unknown&gt;&gt;();
  ctx      = input&lt;Record&lt;string, unknown&gt;&gt;(&#123;&#125;);
&#125;

// Parent
&lt;ng-template #myRow let-who="who"&gt;
  &lt;p&gt;Hello &#123;&#123; who &#125;&#125;!&lt;/p&gt;
&lt;/ng-template&gt;
&lt;app-slot-host [template]="myRow" [ctx]="&#123; who: 'World' &#125;" /&gt;</pre></div>

      <h2>Demo 4 — TemplateRef input + viewChild</h2>
      <div class="demo">
        <p class="demo__title">Live — parent owns the template; SlotHost renders it with context</p>
        <ng-template #vcTpl let-who="who" let-emoji="emoji">
          <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,rgba(2,132,199,.08),rgba(124,58,237,.08));border-radius:10px;border:1px solid var(--border)">
            <span style="font-size:1.5rem">{{ emoji }}</span>
            <span>Captured by <code>viewChild()</code>, rendered inside <code>&lt;app-slot-host&gt;</code>. Hello, <strong>{{ who }}</strong>!</span>
          </div>
        </ng-template>
        @if (vcTemplate()) {
          <app-slot-host [template]="vcTemplate()!" [ctx]="{ who: 'Angular dev', emoji: '🚀' }" />
        }
      </div>

      <h2>When to reach for each API</h2>
      <table class="t">
        <thead><tr><th>Pattern</th><th>Use when</th></tr></thead>
        <tbody>
          <tr><td><code>[ngTemplateOutlet]</code></td><td>Reusing a snippet 2+ times in the same component</td></tr>
          <tr><td><code>TemplateRef</code> as <code>input()</code></td><td>Building library-style "shell" components (table rows, card bodies)</td></tr>
          <tr><td>Signal-driven outlet swap</td><td>Skeleton ↔ content, list ↔ grid, view ↔ edit toggles</td></tr>
          <tr><td><code>ng-content</code> (projection)</td><td>Consumer supplies entire slot with no context variables needed</td></tr>
        </tbody>
      </table>

      <div class="tip">
        Prefer <code>ng-content</code> for simple slot injection; reach for
        <code>TemplateRef</code> when you need to <strong>render the template in a
        different context</strong> or at a <strong>different time</strong> than where it
        was defined.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>&lt;ng-template&gt;</code> is a DOM blueprint — invisible until stamped by an outlet.</li>
        <li><code>[ngTemplateOutlet]</code> renders it; <code>[ngTemplateOutletContext]</code> injects variables.</li>
        <li><code>$implicit</code> → bare <code>let-x</code>; named key → <code>let-x="key"</code>.</li>
        <li>Signal-driven template swapping replaces repeated <code>@if</code> blocks cleanly.</li>
        <li>Pass <code>TemplateRef</code> as an <code>input()</code> to build customizable shell components.</li>
        <li><code>viewChild&lt;TemplateRef&lt;unknown&gt;&gt;('ref')</code> captures a template in TypeScript.</li>
      </ul>

      <p><a routerLink="/change-detection">Next: Change Detection Deep Dive →</a></p>
    </article>
  `,
  styles: [`
    .t { width: 100%; border-collapse: collapse; font-size: .88rem; margin: 12px 0; }
    .t th, .t td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; text-align: left; }
    .t th { color: var(--text-muted); font-weight: 600; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  `],
})
export class NgTemplateOutletLesson {
  protected readonly view = signal<'compact' | 'detailed'>('compact');
  protected readonly people = signal<Person[]>([
    { name: 'Ada Lovelace', role: 'Admin' },
    { name: 'Grace Hopper', role: 'Member' },
    { name: 'Alan Turing', role: 'Member' },
  ]);
  protected readonly vcTemplate = viewChild<TemplateRef<unknown>>('vcTpl');
}
