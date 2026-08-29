import {
  Component,
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/** `*appUnless` — the inverse of @if: renders its template when the value is falsy. */
@Directive({ selector: '[appUnless]' })
export class UnlessDirective {
  /**
   * The template the star syntax wrapped — the blueprint, not yet in the DOM.
   */
  private readonly tpl = inject(TemplateRef<unknown>);
  /**
   * Where views get stamped out.
   */
  private readonly vcr = inject(ViewContainerRef);
  /**
   * Whether the view is currently stamped, so a repeated `false` does not stamp it
   * twice.
   */
  private rendered = false;

  /**
   * Stamps the template when the condition is false, clears it when true.
   *
   * A setter rather than a signal input because this is deliberately the classic
   * form: it is what `*ngIf` looks like inside, and the star syntax desugars to an
   * input binding, so the setter is where the reaction has to live.
   *
   * @param condition Render the content when this is false.
   */
  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl); // stamp the template into the DOM
      this.rendered = true;
    } else if (condition && this.rendered) {
      this.vcr.clear(); // remove the previously-stamped view
      this.rendered = false;
    }
  }
}

/** Context object type for *appRepeat — enables type-checked `let` vars in templates. */
interface RepeatContext {
  $implicit: number; // fills the bare `let n`
  index: number; // fills `let i = index`
  first: boolean; // fills `let f = first`
}

/**
 * `*appRepeat="n"` — stamps its template `n` times, handing each copy a context
 * object. Demonstrates how @for-style `let` variables actually get their values.
 */
@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
  /**
   * The template, typed with its context so `let` variables are type-checked.
   */
  private readonly tpl = inject(TemplateRef<RepeatContext>);
  /**
   * Where the copies get stamped.
   */
  private readonly vcr = inject(ViewContainerRef);

  /**
   * Stamps the template `times` times, handing each copy its own context.
   *
   * The context object is the mechanism behind every `let` variable you have ever
   * written in an `*ngFor`: `$implicit` fills the bare `let n`, and each named key
   * fills `let x = key`. Clearing and rebuilding on every change is deliberately
   * naive — the real `@for` reuses views by tracking key.
   *
   * @param times How many copies.
   */
  @Input() set appRepeat(times: number) {
    this.vcr.clear(); // rebuild from scratch on every change (simple, not optimized)
    for (let i = 0; i < times; i++) {
      this.vcr.createEmbeddedView(this.tpl, {
        $implicit: i + 1, // the "1-based number" exposed as `let n`
        index: i,
        first: i === 0,
      });
    }
  }

  /** Tells the template type-checker what the `let` vars are. Purely compile-time. */
  static ngTemplateContextGuard(_dir: RepeatDirective, _ctx: unknown): _ctx is RepeatContext {
    return true;
  }
}

/**
 * Lesson: Custom Structural Directives.
 *
 * Goes past a single *appUnless toggle: explains the `*` desugaring precisely,
 * decodes the microsyntax token by token, shows the TemplateRef/ViewContainerRef
 * machinery, demos passing CONTEXT ($implicit + named vars) with a live
 * *appRepeat, covers type-safe context via ngTemplateContextGuard, and lists the
 * real traps (two structural directives on one element, forgetting to clear,
 * when to prefer built-in @if/@for).
 */
@Component({
  selector: 'app-lesson-structural-directives',
  imports: [RouterLink, UnlessDirective, RepeatDirective],
  template: `
    <article class="lesson">
      <span class="lesson__eyebrow">Intermediate · Pipes &amp; Directives</span>
      <h1>Custom Structural Directives</h1>
      <p class="lead">
        A <strong>structural</strong> directive changes the shape of the DOM — it adds and
        removes whole template blocks. It's the exact mechanism behind <code>&#64;if</code>,
        <code>&#64;for</code> and the legacy <code>*ngIf</code>/<code>*ngFor</code>. The trick
        it's built on: a directive can inject the <em>template</em> it's attached to
        (<code>TemplateRef</code>) and a place to render copies of it
        (<code>ViewContainerRef</code>), then stamp or clear that template on demand.
      </p>

      <h2>The <code>*</code> is pure syntax sugar</h2>
      <p>
        The asterisk has no magic of its own — it tells Angular to wrap the host element in an
        <code>&lt;ng-template&gt;</code> and move the directive onto it. These two are compiled
        to exactly the same thing:
      </p>
      <div class="code"><pre>{{ desugarSample }}</pre></div>
      <p>
        This is why you can't put two structural directives on one element: there's only one
        host to wrap, so <code>*ngIf</code> and <code>*ngFor</code> together is a compile error.
        You nest them (or, in modern Angular, use <code>&#64;if</code> inside <code>&#64;for</code>).
      </p>

      <h2>Anatomy of the directive</h2>
      <div class="code"><pre>{{ directiveSample }}</pre></div>
      <ul>
        <li><code>selector: '[appUnless]'</code> — an attribute selector; the template writes it as <code>*appUnless</code>.</li>
        <li><code>inject(TemplateRef)</code> — a handle to the content between the tags. It is <em>not</em> rendered yet; it's a blueprint.</li>
        <li><code>inject(ViewContainerRef)</code> — the anchor in the DOM where copies get inserted.</li>
        <li><code>&#64;Input() set appUnless(...)</code> — a <strong>setter</strong> input. It runs every time the bound value changes, which is where we decide to stamp or clear.</li>
        <li><code>createEmbeddedView(tpl)</code> — instantiates the template into the container (renders it).</li>
        <li><code>vcr.clear()</code> — destroys the rendered view. The <code>rendered</code> flag stops us doing redundant work.</li>
      </ul>

      <h2>Live #1 — toggle with <code>*appUnless</code></h2>
      <div class="demo">
        <p class="demo__title">Live — renders only while <code>hidden</code> is false</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="hidden.set(!hidden())">
            {{ hidden() ? 'Show' : 'Hide' }} the message
          </button>
          <span class="pill">hidden = {{ hidden() }}</span>
        </div>
        <p *appUnless="hidden()" style="color:var(--green)">
          ✅ I exist in the DOM because <code>hidden</code> is false. Toggle it and this whole
          element is created/destroyed — not just hidden with CSS.
        </p>
      </div>
      <div class="tip">
        Structural directives <strong>remove</strong> elements from the DOM, they don't hide them.
        That's different from <code>[hidden]</code> or <code>display:none</code>, where the element
        still exists. Removal means child components are destroyed and their subscriptions cleaned up.
      </div>

      <h2>The microsyntax, decoded</h2>
      <p>
        The string after <code>*appRepeat=</code> isn't a normal expression — it's
        <strong>microsyntax</strong>, a mini-grammar Angular parses into template inputs and
        <code>let</code> bindings. Take the loop form:
      </p>
      <div class="code"><pre>{{ microsyntaxSample }}</pre></div>
      <ul>
        <li><code>let n</code> — declares a template variable; it receives the context's <code>$implicit</code>.</li>
        <li><code>of items</code> — the word after <code>of</code> becomes the directive's main input.</li>
        <li><code>let i = index</code> — binds a named context property (<code>index</code>) to a local.</li>
        <li><code>;</code> — separates clauses. Semicolons, not commas.</li>
      </ul>

      <h2>Live #2 — passing context with <code>*appRepeat</code></h2>
      <p>
        This directive stamps its template N times, handing each copy a context object. The
        template pulls values out of that context with <code>let</code>:
      </p>
      <div class="demo">
        <p class="demo__title">Live — {{ times() }} cop{{ times() === 1 ? 'y' : 'ies' }}</p>
        <div class="row" style="margin-bottom:12px">
          <button (click)="times.set(Math.max(0, times() - 1))">−</button>
          <button (click)="times.set(times() + 1)">+</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <span *appRepeat="times(); let n; let i = index; let f = first" class="pill">
            n={{ n }} · index={{ i }}{{ f ? ' · first' : '' }}
          </span>
        </div>
      </div>
      <div class="code"><pre>{{ repeatSample }}</pre></div>
      <ul>
        <li><code>$implicit</code> in the context fills the bare <code>let n</code>.</li>
        <li>Named keys (<code>index</code>, <code>first</code>) fill <code>let i = index</code>, <code>let f = first</code>.</li>
        <li>This is precisely how <code>&#64;for</code> exposes <code>$index</code>, <code>$first</code>, <code>$last</code>, etc.</li>
      </ul>

      <h2>Type-checking the context</h2>
      <p>
        By default the template compiler doesn't know what type <code>n</code> or <code>i</code>
        are. A static <code>ngTemplateContextGuard</code> tells it — so <code>let n</code> is typed
        as <code>number</code> and typos in <code>let x = indx</code> become compile errors:
      </p>
      <div class="code"><pre>{{ guardSample }}</pre></div>

      <h2>Wrong way vs right way</h2>
      <table class="cmp">
        <tr><th>Trap</th><th>Fix</th></tr>
        <tr><td>Two structural directives on one element (<code>*ngIf</code> + <code>*ngFor</code>)</td><td>Nest them, or use <code>&#64;if</code> inside <code>&#64;for</code></td></tr>
        <tr><td>Re-creating the view on every setter call without checking state</td><td>Track a <code>rendered</code> flag (or diff the input) before stamping/clearing</td></tr>
        <tr><td>Rebuilding the whole list each change (like our simple <code>*appRepeat</code>)</td><td>Real lists should diff & reuse views — that's what <code>&#64;for</code>'s <code>track</code> does</td></tr>
        <tr><td>Untyped context vars</td><td>Add <code>ngTemplateContextGuard</code></td></tr>
      </table>

      <div class="note">
        Modern Angular favours the built-in <code>&#64;if</code>/<code>&#64;for</code> blocks for
        everyday conditionals and lists — they're faster and need no import. Reach for a
        <strong>custom</strong> structural directive when you have a reusable rendering pattern:
        role-based access (<code>*appHasRole</code>), a permission gate, or custom repetition with
        bespoke context.
      </div>

      <h2>Key takeaways</h2>
      <ul>
        <li>The <code>*</code> prefix desugars to an <code>&lt;ng-template&gt;</code> wrapper — that's why only one per element.</li>
        <li>Inject <code>TemplateRef</code> (the blueprint) and <code>ViewContainerRef</code> (where to stamp it).</li>
        <li><code>createEmbeddedView(tpl, context)</code> renders; <code>vcr.clear()</code> removes and destroys.</li>
        <li>The context's <code>$implicit</code> feeds bare <code>let</code>; named keys feed <code>let x = key</code>.</li>
        <li>Add <code>ngTemplateContextGuard</code> to type-check <code>let</code> variables; prefer <code>&#64;if</code>/<code>&#64;for</code> for the common cases.</li>
      </ul>

      <p><a routerLink="/content-projection">Next: Content Projection →</a></p>
    </article>
  `,
  styles: [`
    table.cmp { width: 100%; border-collapse: collapse; font-size: .86rem; margin: 12px 0; }
    table.cmp th, table.cmp td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    table.cmp th { background: var(--bg-elevated); }
    .pill { display: inline-block; padding: 3px 9px; border: 1px solid var(--border); border-radius: 999px; font-size: .8rem; }
    .note { border-left: 3px solid var(--violet); background: var(--bg-elevated); padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: .92rem; }
  `],
})
export class StructuralDirectives {
  /**
   * `Math`, exposed so the template can call it. Templates resolve names against
   * the component instance only, so globals have to be re-exported like this.
   */
  protected readonly Math = Math;
  /**
   * The condition driving the `*appUnless` demo.
   */
  protected readonly hidden = signal(false);
  /**
   * How many copies the `*appRepeat` demo stamps.
   */
  protected readonly times = signal(3);

  /**
   * Sample: what the star syntax desugars to — an `<ng-template>` plus an input
   * binding, which is why a structural directive is a normal directive that
   * happens to inject `TemplateRef`.
   */
  protected readonly desugarSample = `<!-- what you write -->
<p *appUnless="hidden">Visible when NOT hidden</p>

<!-- what the compiler produces -->
<ng-template [appUnless]="hidden">
  <p>Visible when NOT hidden</p>
</ng-template>`;

  /**
   * Sample: the `*appUnless` directive in full.
   */
  protected readonly directiveSample = `@Directive({ selector: '[appUnless]' })
export class UnlessDirective {
  private tpl = inject(TemplateRef<unknown>);   // the content (a blueprint)
  private vcr = inject(ViewContainerRef);        // where to render copies
  private rendered = false;

  @Input() set appUnless(condition: boolean) {   // runs on every value change
    if (!condition && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl);     // stamp it in
      this.rendered = true;
    } else if (condition && this.rendered) {
      this.vcr.clear();                          // tear it down
      this.rendered = false;
    }
  }
}`;

  /**
   * Sample: microsyntax. Not an expression but a small grammar of its own, which
   * is why `let i = index` parses at all.
   */
  protected readonly microsyntaxSample = `<!-- microsyntax (a mini-grammar), NOT a plain expression -->
<li *ngFor="let item of items; let i = index; let last = last">…</li>

<!--
  let item      → template var, gets context.$implicit
  of items      → 'items' becomes the directive's ngForOf input
  let i = index → binds context.index to a local
  ;             → clause separator
-->`;

  /**
   * Sample: `*appRepeat` and its context object.
   */
  protected readonly repeatSample = `@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
  private tpl = inject(TemplateRef<RepeatContext>);
  private vcr = inject(ViewContainerRef);

  @Input() set appRepeat(times: number) {
    this.vcr.clear();
    for (let i = 0; i < times; i++) {
      this.vcr.createEmbeddedView(this.tpl, {
        $implicit: i + 1,   // → let n
        index: i,           // → let i = index
        first: i === 0,     // → let f = first
      });
    }
  }
}

// template:
// <span *appRepeat="times; let n; let i = index; let f = first">…</span>`;

  /**
   * Sample: `ngTemplateContextGuard`, the purely compile-time hook that tells the
   * template type-checker what the `let` variables are.
   */
  protected readonly guardSample = `interface RepeatContext {
  $implicit: number;
  index: number;
  first: boolean;
}

// Static guard: purely compile-time, tells the template checker the shape.
static ngTemplateContextGuard(
  _dir: RepeatDirective,
  _ctx: unknown,
): _ctx is RepeatContext {
  return true;
}
// Now 'let n' is typed as number; 'let x = indx' fails to compile.`;
}
