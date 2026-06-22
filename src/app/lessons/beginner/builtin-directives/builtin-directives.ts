import { Component, signal } from '@angular/core';
import {
  NgClass,
  NgFor,
  NgIf,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lesson-builtin-directives',
  imports: [RouterLink, NgIf, NgFor, NgClass, NgStyle, NgSwitch, NgSwitchCase, NgSwitchDefault],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Beginner · Directives</span>
      <h1>Built-in Directives &amp; Legacy Control Flow</h1>
      <p class="lead">
        Modern Angular gives you the <code>&#64;if</code> / <code>&#64;for</code> /
        <code>&#64;switch</code> blocks you've already met. But every existing codebase —
        and the certification exam's question bank — is full of the
        <strong>structural directives</strong> they replaced:
        <code>*ngIf</code>, <code>*ngFor</code>, <code>*ngSwitch</code>, plus the
        attribute directives <code>ngClass</code> and <code>ngStyle</code>. You must be
        fluent in both. This lesson is the legacy half — and the demo below is running
        the <em>real</em> directives.
      </p>

      <div class="note">
        These directives live in <code>&#64;angular/common</code>. A standalone component
        imports the ones it uses (<code>NgIf</code>, <code>NgFor</code>, …) — or the whole
        <code>CommonModule</code> in an NgModule app. Forget the import and the
        <code>*ngIf</code> silently does nothing.
      </div>

      <h2>The asterisk is sugar</h2>
      <p>
        The <code>*</code> marks a <strong>structural</strong> directive — one that adds or
        removes DOM. It's shorthand: Angular desugars it into an
        <code>&lt;ng-template&gt;</code>.
      </p>
      <div class="code">
        <pre>&lt;p *ngIf="loggedIn"&gt;Welcome&lt;/p&gt;

&lt;!-- is exactly --&gt;
&lt;ng-template [ngIf]="loggedIn"&gt;
  &lt;p&gt;Welcome&lt;/p&gt;
&lt;/ng-template&gt;</pre>
      </div>
      <p>That's why you can't put two structural directives (<code>*ngIf</code> and <code>*ngFor</code>) on the same element — there's only one template slot. Wrap one in <code>&lt;ng-container&gt;</code>.</p>

      <h2>*ngIf — with else, then &amp; as</h2>
      <div class="code">
        <pre>&lt;p *ngIf="user as u; else loading"&gt;Hi {{ '{{' }} u.name {{ '}}' }}&lt;/p&gt;
&lt;ng-template #loading&gt;Loading…&lt;/ng-template&gt;

&lt;!-- then/else both as templates --&gt;
&lt;div *ngIf="ready; then content; else spinner"&gt;&lt;/div&gt;</pre>
      </div>

      <h2>*ngFor — track, index and the booleans</h2>
      <div class="code">
        <pre>&lt;li *ngFor="let item of items;
            let i = index;
            let first = first; let last = last;
            let even = even; let odd = odd;
            trackBy: trackById"&gt;
  {{ '{{' }} i {{ '}}' }}: {{ '{{' }} item.name {{ '}}' }}
&lt;/li&gt;

trackById(index: number, item: Item) {{ '{' }} return item.id; {{ '}' }}</pre>
      </div>
      <div class="warn">
        Always provide <code>trackBy</code> for lists that change. Without it Angular
        tracks by object identity and re-creates every DOM node when the array reference
        changes — slow, and it destroys input focus/animation state. (The new
        <code>&#64;for</code> makes <code>track</code> mandatory for exactly this reason.)
      </div>

      <h2>[ngSwitch]</h2>
      <div class="code">
        <pre>&lt;div [ngSwitch]="status"&gt;
  &lt;p *ngSwitchCase="'loading'"&gt;Loading…&lt;/p&gt;
  &lt;p *ngSwitchCase="'success'"&gt;Done&lt;/p&gt;
  &lt;p *ngSwitchDefault&gt;Unknown&lt;/p&gt;
&lt;/div&gt;</pre>
      </div>

      <h2>ngClass &amp; ngStyle</h2>
      <div class="code">
        <pre>&lt;!-- object: keys are classes, truthy values apply them --&gt;
&lt;div [ngClass]="{{ '{' }} active: isActive, disabled: !enabled {{ '}' }}"&gt;
&lt;!-- string or array forms too --&gt;
&lt;div [ngClass]="'a b c'"&gt;   &lt;div [ngClass]="['a', 'b']"&gt;

&lt;div [ngStyle]="{{ '{' }} color: c, 'font-size.px': size {{ '}' }}"&gt;</pre>
      </div>
      <p>
        For a <em>single</em> class or style, the native bindings
        <code>[class.active]="isActive"</code> and
        <code>[style.color]="c"</code> are lighter — reach for <code>ngClass</code>/<code>ngStyle</code>
        when you're toggling several at once from an object.
      </p>

      <h2>Try it — the real directives, live</h2>
      <div class="demo">
        <p class="demo__title">Every directive below is the genuine &#64;angular/common one</p>

        <p class="row" style="margin-bottom:6px">
          <button (click)="show.set(!show())">Toggle *ngIf</button>
        </p>
        <p *ngIf="show(); else hidden" class="pill" style="color:var(--green)">
          Shown by <code>*ngIf</code>
        </p>
        <ng-template #hidden>
          <span class="pill">Hidden — the <code>#else</code> template renders instead</span>
        </ng-template>

        <p class="demo__title" style="margin-top:16px">*ngFor + ngClass + ngStyle (click a row)</p>
        <ul class="list">
          <li
            *ngFor="let f of fruits(); let i = index; trackBy: trackByName"
            [ngClass]="{ active: f === selected() }"
            [ngStyle]="{ 'font-weight': f === selected() ? '700' : '400' }"
            (click)="selected.set(f)"
          >
            {{ i + 1 }}. {{ f }} <span *ngIf="f === selected()">←</span>
          </li>
        </ul>

        <p class="demo__title" style="margin-top:16px">[ngSwitch]</p>
        <div class="row" style="margin-bottom:8px">
          <button class="ghost" (click)="status.set('loading')">loading</button>
          <button class="ghost" (click)="status.set('success')">success</button>
          <button class="ghost" (click)="status.set('error')">error</button>
        </div>
        <div [ngSwitch]="status()">
          <p *ngSwitchCase="'loading'">⏳ Loading…</p>
          <p *ngSwitchCase="'success'">✅ Done!</p>
          <p *ngSwitchDefault>⚠️ Something went wrong.</p>
        </div>
      </div>

      <h2>ng-container &amp; ng-template</h2>
      <p>
        <code>&lt;ng-container&gt;</code> is a grouping element that leaves <em>no</em> node
        in the DOM — perfect for applying a structural directive without an extra wrapper:
      </p>
      <div class="code">
        <pre>&lt;ng-container *ngIf="user as u"&gt;
  &lt;h2&gt;{{ '{{' }} u.name {{ '}}' }}&lt;/h2&gt;
  &lt;p&gt;{{ '{{' }} u.email {{ '}}' }}&lt;/p&gt;
&lt;/ng-container&gt;

&lt;!-- a named, reusable fragment rendered on demand --&gt;
&lt;ng-template #row let-name&gt;&lt;td&gt;{{ '{{' }} name {{ '}}' }}&lt;/td&gt;&lt;/ng-template&gt;
&lt;ng-container *ngTemplateOutlet="row; context: {{ '{' }} $implicit: 'Ada' {{ '}' }}"&gt;&lt;/ng-container&gt;</pre>
      </div>

      <h2>Old → new at a glance</h2>
      <table class="t">
        <tr><td><code>*ngIf="x"</code></td><td><code>&#64;if (x) {{ '{' }} … {{ '}' }}</code></td></tr>
        <tr><td><code>*ngIf="x; else e"</code></td><td><code>&#64;if (x) {{ '{' }} … {{ '}' }} &#64;else {{ '{' }} … {{ '}' }}</code></td></tr>
        <tr><td><code>*ngFor="let i of xs; trackBy: fn"</code></td><td><code>&#64;for (i of xs; track i.id) {{ '{' }} … {{ '}' }}</code></td></tr>
        <tr><td><code>[ngSwitch]</code> + <code>*ngSwitchCase</code></td><td><code>&#64;switch</code> + <code>&#64;case</code></td></tr>
        <tr><td><code>&lt;ng-container *ngIf&gt;</code></td><td>(no wrapper needed — blocks aren't elements)</td></tr>
      </table>

      <h2>Common mistakes</h2>
      <table class="t">
        <tr>
          <td>Two structural directives on one element</td>
          <td><code>*ngIf</code> and <code>*ngFor</code> together is a compile error. Move one onto an <code>&lt;ng-container&gt;</code>.</td>
        </tr>
        <tr>
          <td><code>*ngIf</code> renders nothing and no error</td>
          <td>You forgot to import <code>NgIf</code>/<code>CommonModule</code> in the standalone component.</td>
        </tr>
        <tr>
          <td>List re-renders / loses focus on every change</td>
          <td>Missing <code>trackBy</code>. Return a stable id.</td>
        </tr>
        <tr>
          <td><code>[hidden]</code> used like <code>*ngIf</code></td>
          <td><code>[hidden]</code> only toggles CSS <code>display</code> — the element (and its component, subscriptions, etc.) stays alive. <code>*ngIf</code> removes it entirely.</td>
        </tr>
        <tr>
          <td>Combining <code>[ngClass]</code> and <code>class</code> and expecting one to win</td>
          <td>They merge. Static <code>class</code> plus <code>[ngClass]</code> object both apply; don't fight them.</td>
        </tr>
      </table>

      <h2>Key takeaways</h2>
      <ul>
        <li><code>*</code> = structural directive = adds/removes DOM; it desugars to <code>&lt;ng-template&gt;</code>.</li>
        <li><code>*ngIf</code> (else/then/as), <code>*ngFor</code> (trackBy/index/first/last/even/odd), <code>[ngSwitch]</code>.</li>
        <li><code>ngClass</code>/<code>ngStyle</code> for multiple classes/styles; native <code>[class.x]</code>/<code>[style.x]</code> for one.</li>
        <li><code>ng-container</code> groups without adding a DOM node; <code>ng-template</code> is a fragment you render on demand.</li>
        <li>You'll write <code>&#64;if</code>/<code>&#64;for</code> in new code, but you must <em>read</em> the directive forms fluently.</li>
      </ul>

      <p><a routerLink="/pipes">Next: Built-in Pipes →</a></p>
    </article>
  `,
  styles: [
    `.t { width: 100%; border-collapse: collapse; }
     .t td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
     .t td:first-child { width: 320px; }
     .list { list-style: none; padding: 0; margin: 6px 0; }
     .list li { padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px;
                margin-bottom: 4px; cursor: pointer; }
     .list li.active { border-color: var(--accent); background: rgba(221,0,49,0.08); }`,
  ],
})
export class BuiltinDirectives {
  protected readonly show = signal(true);
  protected readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  protected readonly selected = signal('Banana');
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');

  protected trackByName(_index: number, name: string): string {
    return name;
  }
}
