import { Component, Directive, Input, TemplateRef, ViewContainerRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A structural directive adds/removes elements from the DOM. It injects the
 * TemplateRef it is attached to and a ViewContainerRef to stamp it into.
 * `*appUnless` is the inverse of `@if` — it renders when the value is falsy.
 */
@Directive({ selector: '[appUnless]' })
export class UnlessDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private rendered = false;

  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl);
      this.rendered = true;
    } else if (condition && this.rendered) {
      this.vcr.clear();
      this.rendered = false;
    }
  }
}

@Component({
  selector: 'app-lesson-structural-directives',
  imports: [RouterLink, UnlessDirective],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Pipes &amp; Directives</span>
      <h1>Custom Structural Directives</h1>
      <p class="lead">
        Structural directives shape the DOM by adding and removing whole template
        blocks — the same mechanism behind <code>*ngIf</code> and <code>*ngFor</code>.
        They inject a <code>TemplateRef</code> (the content) and a
        <code>ViewContainerRef</code> (where to render it).
      </p>

      <h2>The <code>*</code> is sugar</h2>
      <p>These two are identical — the asterisk desugars to an <code>ng-template</code>:</p>
      <div class="code">
        <pre>&lt;p *appUnless="hidden"&gt;Visible when NOT hidden&lt;/p&gt;

&lt;!-- desugars to --&gt;
&lt;ng-template [appUnless]="hidden"&gt;
  &lt;p&gt;Visible when NOT hidden&lt;/p&gt;
&lt;/ng-template&gt;</pre>
      </div>

      <h2>The directive</h2>
      <div class="code">
        <pre>&#64;Directive({{ '{' }} selector: '[appUnless]' {{ '}' }})
export class UnlessDirective {{ '{' }}
  private tpl = inject(TemplateRef&lt;unknown&gt;);
  private vcr = inject(ViewContainerRef);
  private rendered = false;

  &#64;Input() set appUnless(condition: boolean) {{ '{' }}
    if (!condition &amp;&amp; !this.rendered) {{ '{' }}
      this.vcr.createEmbeddedView(this.tpl);   // stamp it in
      this.rendered = true;
    {{ '}' }} else if (condition &amp;&amp; this.rendered) {{ '{' }}
      this.vcr.clear();                         // tear it down
      this.rendered = false;
    {{ '}' }}
  {{ '}' }}
{{ '}' }}</pre>
      </div>

      <h2>Try it</h2>
      <div class="demo">
        <p class="demo__title">Live</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="hidden.set(!hidden())">
            {{ hidden() ? 'Show' : 'Hide' }} the message
          </button>
          <span class="pill">hidden = {{ hidden() }}</span>
        </div>
        <p *appUnless="hidden()" style="color:var(--green)">
          ✅ I am rendered because <code>hidden</code> is false (created via ViewContainerRef).
        </p>
      </div>

      <h2>Passing context</h2>
      <div class="code">
        <pre>this.vcr.createEmbeddedView(this.tpl, {{ '{' }} $implicit: item, index: i {{ '}' }});
// template:  *appEach="let item; let i = index"</pre>
      </div>
      <p>
        The context object's <code>$implicit</code> fills the bare <code>let item</code>;
        named keys map to <code>let i = index</code>. For type-checked context vars in
        the template, add a static <code>ngTemplateContextGuard</code> to the directive.
      </p>

      <div class="note">
        Modern Angular favours the built-in <code>&#64;if</code>/<code>&#64;for</code>
        blocks for everyday conditionals and lists. Custom structural directives are
        still useful for reusable rendering patterns (e.g. role-based access,
        repeating with custom context).
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <code>*</code> prefix is shorthand for wrapping content in an <code>ng-template</code>.</li>
        <li>Inject <code>TemplateRef</code> (the content) and <code>ViewContainerRef</code> (the host).</li>
        <li><code>createEmbeddedView()</code> renders; <code>clear()</code> removes.</li>
        <li>Pass context to the view for custom <code>let-</code> variables.</li>
      </ul>

      <p><a routerLink="/content-projection">Next: Content Projection →</a></p>
    </article>
  `,
})
export class StructuralDirectives {
  protected readonly hidden = signal(false);
}
