import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnlessDirective } from './unless-directive/unless-directive';
import { RepeatDirective } from './repeat-directive/repeat-directive';

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
  templateUrl: './structural-directives.html',
  styleUrl: './structural-directives.css',
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
