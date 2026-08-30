import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnlessDirective } from './unless-directive/unless-directive';
import { RepeatDirective } from './repeat-directive/repeat-directive';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

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
  imports: [RouterLink, UnlessDirective, RepeatDirective, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './structural-directives.html',
  styleUrl: './structural-directives.css',
})
export class StructuralDirectives {
  /**
   * From written markup to nodes on the page. Drawn out because almost every
   * question people have here — why the comment node is in the DOM, why only one
   * star per element, why the element appears *after* where you wrote it — is
   * answered by one of these seven steps rather than by any rule worth
   * memorising separately.
   */
  protected readonly pipeline = [
    {
      label: 'You write `*appUnless="hidden()"`',
      detail: 'One element, one star. That is all the source you have',
      tone: 'accent' as const,
    },
    {
      label: 'The compiler wraps the host',
      detail: 'Your element moves inside a generated `<ng-template>`',
    },
    {
      label: 'The directive matches the template',
      detail: 'Not your element — the wrapper. That relocation is the whole trick',
    },
    {
      label: 'DI hands it two things',
      detail: '`TemplateRef` (the blueprint) and `ViewContainerRef` (the lot)',
    },
    {
      label: 'An anchor comment is left behind',
      detail: 'The `<!--container-->` you see in DevTools. It marks the spot',
    },
    {
      label: 'The input setter runs on every change',
      detail: 'This is your decision point: stamp, or tear down',
    },
    {
      label: '`createEmbeddedView` inserts *after* the anchor',
      detail: 'Real nodes, real components, real lifecycle hooks',
      tone: 'good' as const,
    },
  ];

  /** The signal-passed-as-value trap. */
  protected readonly signalSample = `// The directive, unchanged:
@Input() set appUnless(condition: boolean) {
  if (!condition && !this.rendered) { /* stamp */ }
  else if (condition && this.rendered) { /* clear */ }
}

// The component:
protected readonly hidden = signal(false);

<!-- Note the missing parentheses -->
<p *appUnless="hidden">You should be able to see me.</p>

<!-- hidden() is false. Does the paragraph render? -->`;

  /** Choices for the missing-clear check. */
  protected readonly clearOptions = [
    {
      text: 'Five — the container replaces its contents on each call',
      why: 'A reasonable expectation, and what `@for` appears to do, but nothing about a `ViewContainerRef` is declarative. It has `insert`, `remove` and `clear` methods, and it does exactly what you call and nothing more.',
    },
    {
      text: 'Eight — the three old views are still there and five more were added',
      correct: true,
      why: '`createEmbeddedView` is an **insert**, not a render-this-state. The setter ran a second time, looped five times, and appended five fresh views on top of the three that were already sitting in the container. This is the single most common bug in a hand-written structural directive, and it is quietly cumulative: nudge the number a few more times and you have dozens of stale views, each with live subscriptions. `this.vcr.clear()` at the top of the setter is the fix, which is why the version in this lesson opens with exactly that line.',
    },
    {
      text: 'Five, but the first three leak because they were never destroyed',
      why: 'Close to the right instinct about leaking, but wrong about the DOM. Nothing removed the first three, so they are not orphaned — they are still on screen, above the new five.',
    },
    {
      text: 'It throws — a view container cannot hold views from two setter calls',
      why: 'A container is designed to hold many views; that is how `@for` renders a list from one template. Holding several is normal, and holding the *wrong* several is the bug.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'Should I still write these now that `@if` and `@for` exist?',
      a: "For conditionals and lists, no — the built-in blocks are faster, need no import and are what a reviewer expects. Custom structural directives earn their place when the *decision* is the reusable part: `*appHasRole=\"'admin'\"`, `*appFeatureFlag=\"'new-checkout'\"`, `*appHasPermission`. Writing `@if (auth.hasRole('admin')) {}` in forty templates is the smell that means you wanted a directive.",
    },
    {
      q: 'Can one structural directive take more than one input?',
      a: 'Yes, and the microsyntax has a specific shape for it. `*appRepeat="n; delay: 200"` binds `n` to `appRepeat` and `200` to an input named `appRepeatDelay` — the directive selector, then the clause key, camel-cased. Get that name wrong and the input silently never receives anything, which is a miserable ten minutes if you do not know the rule.',
    },
    {
      q: 'What is the `<!--container-->` comment in my DOM?',
      a: 'The anchor. A `ViewContainerRef` has to insert views *somewhere*, so Angular leaves a comment node as a stable marker in the DOM and inserts after it. It is inert, it costs nothing, and every `@if`, `@for` and structural directive on the page has one. Seeing it is a useful signal in DevTools: it tells you a view container lives right there.',
    },
    {
      q: 'Can I use `input()` signals instead of an `@Input` setter?',
      a: 'You can, and it reads better — but you need somewhere to react. A signal input has no setter, so the stamp-or-clear work moves into an `effect()` that reads it. That is a real improvement for anything with several inputs, since one effect sees all of them consistently instead of a setter firing per-input in binding order.',
    },
    {
      q: 'How do I test a structural directive?',
      a: 'Mount a tiny host component whose template uses it, then assert on the DOM: `fixture.nativeElement.querySelectorAll(...)`. Do not try to construct the directive directly — its whole behaviour is expressed through `TemplateRef` and `ViewContainerRef`, both of which only exist inside a real view. Count elements before and after changing the input, and you have tested the thing that matters.',
    },
  ];

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
<p *appUnless="hidden()">Visible when NOT hidden</p>

<!-- what the compiler produces -->
<ng-template [appUnless]="hidden()">
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
