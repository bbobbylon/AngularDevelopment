import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { RepeatContext } from '../structural-directives.shared';

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
