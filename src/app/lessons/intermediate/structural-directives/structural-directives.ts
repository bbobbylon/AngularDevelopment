import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnlessDirective } from './unless-directive/unless-directive';
import { RepeatDirective } from './repeat-directive/repeat-directive';
import { BfPage, Bubbles, Chapter, CodeLab, Layers, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';

// ── Main lesson component ─────────────────────────────────────────────────────

/**
 * Lesson: Custom Structural Directives.
 *
 * Goes past a single *appUnless toggle: explains the `*` desugaring precisely,
 * decodes the microsyntax token by token, shows the TemplateRef/ViewContainerRef
 * machinery, demos passing CONTEXT ($implicit + named vars) with a live
 * *appRepeat, covers type-safe context via ngTemplateContextGuard, and lists the
 * real traps (two structural directives on one element, forgetting to clear,
 * when to prefer built-in @if/@for).
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), copying the teaching order documented on
 * `ChangeDetection` — the reference implementation:
 *
 * 1. **Pose the problem before naming it.** The lesson opens on "why not just
 *    `[hidden]` it?" and makes the reader commit to a guess (which paragraph's
 *    child gets destroyed) before any mechanism is described.
 * 2. **Analogy next, mechanism after.** The blueprint-and-building-lot frame for
 *    `TemplateRef`/`ViewContainerRef` gives the reader somewhere to put those two
 *    words before they show up as `inject()` calls.
 * 3. **Then the same idea in several modes** — a dialogue between the two
 *    injected handles, a containment diagram for why only one star fits on one
 *    element, a seven-step flow, annotated source via `app-code-lab`, and two
 *    live directives (`*appUnless`, `*appRepeat`) — because the retention bar is
 *    redundancy across modes, not repetition in one.
 * 4. **Every non-trivial snippet is annotated line by line** via `app-code-lab`.
 *    Nothing here assumes the reader can already parse the snippet.
 *
 * This lesson already scored 9/9 on the retention audit before this migration;
 * the analogy, the traps and the two live directives are the same ones that
 * earned that score, reshaped rather than replaced.
 */
@Component({
  selector: 'app-lesson-structural-directives',
  imports: [
    RouterLink,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Layers,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
    UnlessDirective,
    RepeatDirective,
  ],
  templateUrl: './structural-directives.html',
  styleUrl: './structural-directives.css',
})
export class StructuralDirectives {
  /** The Pipes & Directives track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Custom Pipes', id: 'custom-pipes' },
    { label: 'Attribute Directives', id: 'attribute-directives' },
    { label: 'Structural Directives' },
  ];

  /**
   * From written markup to nodes on the page. Drawn out because almost every
   * question people have here — why the comment node is in the DOM, why only one
   * star per element, why the element appears *after* where you wrote it — is
   * answered by one of these seven steps rather than by any rule worth
   * memorising separately.
   */
  protected readonly pipeline: FlowStep[] = [
    {
      label: 'You write `*appUnless="hidden()"`',
      detail: 'One element, one star. That is all the source you have',
      tone: 'accent',
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
      tone: 'good',
    },
  ];

  /**
   * The exchange a `*appUnless="hidden()"` binding actually sets off.
   *
   * This exists because the analogy in prose gives the reader a picture, but a
   * picture alone still leaves "who calls whom" to be inferred. Staging it as a
   * conversation makes the division of labour explicit: the directive orchestrates,
   * `TemplateRef` never touches the DOM, and `ViewContainerRef` neither knows nor
   * cares what a template even is.
   */
  protected readonly handoffTalk: BubbleTurn[] = [
    {
      who: 'The directive',
      says: 'I just got created. `inject(TemplateRef)` and `inject(ViewContainerRef)` — what do I actually have?',
    },
    {
      who: 'TemplateRef',
      says:
        "I'm the drawings between your `<ng-template>` tags. I don't render anything myself — " +
        'call `createEmbeddedView` on the container if you want a copy built.',
    },
    {
      who: 'ViewContainerRef',
      says:
        "I'm the anchor already sitting in the DOM — that `<!--container-->` comment you keep " +
        "seeing in DevTools. I don't know what a template is; I just insert whatever view you hand me.",
    },
    {
      who: 'The directive',
      says: '`vcr.createEmbeddedView(tpl)`, then. One call, and now there is a real `<p>` in the DOM.',
    },
    {
      who: 'ViewContainerRef',
      says:
        'Call `clear()` next and I destroy it — subscriptions, child components, all of it. ' +
        "I don't hide. I demolish.",
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
  protected readonly clearOptions: QuizOption[] = [
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
  protected readonly questions: FaqItem[] = [
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
   * Sample: what the star syntax desugars to, left side — an `<ng-template>` is
   * what actually gets the directive, which is why a structural directive is a
   * normal directive that happens to inject `TemplateRef`.
   */
  protected readonly desugarBefore = `<p *appUnless="hidden()">Visible when NOT hidden</p>`;

  /** Sample: the same thing, right side — what the compiler actually produces. */
  protected readonly desugarAfter = `<ng-template [appUnless]="hidden()">
  <p>Visible when NOT hidden</p>
</ng-template>`;

  /**
   * Sample: the `*appUnless` directive in full, stripped of its own trailing
   * comments — the {@link directiveNotes} carry that job instead.
   */
  protected readonly directiveSample = `@Directive({ selector: '[appUnless]' })
export class UnlessDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
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
}`;

  /** Line-by-line walkthrough of {@link directiveSample}. */
  protected readonly directiveNotes: CodeNote[] = [
    {
      line: 1,
      text: "`selector: '[appUnless]'` — an attribute selector. The template writes it with a star, `*appUnless`, but the compiled form is exactly this attribute on an `<ng-template>` — no different from any other directive's selector.",
    },
    {
      line: 3,
      text: '`inject(TemplateRef)` — a handle to the content between the tags. It is *not* rendered yet; it is a blueprint you are holding, not a house.',
    },
    {
      line: 4,
      text: '`inject(ViewContainerRef)` — the anchor already sitting in the DOM (that `<!--container-->` comment), where copies of the template get inserted.',
    },
    {
      line: 5,
      text: 'A plain flag, not framework state. Its whole job is to stop the setter re-stamping or re-clearing when asked to do something it already did.',
    },
    {
      line: 7,
      text: '`@Input() set appUnless(...)` — a setter input, not a signal. It runs every single time the bound value changes, which is where you decide: stamp, or clear?',
    },
    {
      line: 9,
      text: '`createEmbeddedView(tpl)` — instantiates the template into the container. This is the moment real DOM nodes, real components and real lifecycle hooks come into existence.',
    },
    {
      line: 12,
      text: '`vcr.clear()` — destroys the view. Not hidden, not detached: destroyed. Child components inside it run `ngOnDestroy`, and their subscriptions are torn down.',
    },
  ];

  /**
   * Sample: microsyntax. Not an expression but a small grammar of its own, which
   * is why `let i = index` parses at all.
   */
  protected readonly microsyntaxSample = `<li *ngFor="let item of items;
            let i = index;
            let last = last">
  …
</li>`;

  /** Line-by-line walkthrough of {@link microsyntaxSample}. */
  protected readonly microsyntaxNotes: CodeNote[] = [
    {
      line: 1,
      text: "Two clauses share this line. `let item` declares a template variable that receives the context's `$implicit` value. `of items` is different: the word after `of` becomes the directive's *main input* — `items` gets bound to `ngForOf`, not to a local variable.",
    },
    {
      line: 2,
      text: '`let i = index` binds a *named* context property, `index`, to the local `i`. This is the shape every `let x = key` clause uses: key on the right, local name on the left.',
    },
    {
      line: 3,
      text: 'One more named binding, then the closing quote. The semicolons throughout are clause separators — this is microsyntax, not a JavaScript expression, so semicolons belong where a real expression would never allow them.',
    },
  ];

  /**
   * Sample: `*appRepeat` and its context object, stripped of trailing comments —
   * {@link repeatNotes} carries that job instead.
   */
  protected readonly repeatSample = `@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
  private tpl = inject(TemplateRef<RepeatContext>);
  private vcr = inject(ViewContainerRef);

  @Input() set appRepeat(times: number) {
    this.vcr.clear();
    for (let i = 0; i < times; i++) {
      this.vcr.createEmbeddedView(this.tpl, {
        $implicit: i + 1,
        index: i,
        first: i === 0,
      });
    }
  }
}

// template:
// <span *appRepeat="times; let n; let i = index; let f = first">…</span>`;

  /** Line-by-line walkthrough of {@link repeatSample}. */
  protected readonly repeatNotes: CodeNote[] = [
    {
      line: 3,
      text: 'Typed this time: `TemplateRef<RepeatContext>` tells TypeScript — and, with the guard further down, the template compiler too — exactly what shape the context object will be.',
    },
    {
      line: 7,
      text: '`vcr.clear()` runs first, unconditionally, on *every* call. Delete this one line and you get the missing-clear bug the quiz below is about.',
    },
    {
      line: 9,
      text: 'One `createEmbeddedView` call per copy, which is why the loop matters. The second argument is the context object — a plain object, handed to this exact template instance.',
    },
    {
      line: 10,
      text: '`$implicit` is the special key that fills a *bare* `let n`, with no `= key`. Here it is a 1-based count rather than the raw loop index.',
    },
    {
      line: 11,
      text: 'A named key, `index`, fills `let i = index` in the template. The local name on the left does not have to match the key on the right.',
    },
    {
      line: 12,
      text: 'Same idea again: `first` fills `let f = first`. Three context keys, three different `let` clauses, one object.',
    },
    {
      line: 19,
      text: 'The template that actually consumes this context: `let n`, `let i = index` and `let f = first` — three separate clauses, each pulling a different key out of the one object built above.',
    },
  ];

  /**
   * Sample: `ngTemplateContextGuard`, the purely compile-time hook that tells the
   * template type-checker what the `let` variables are.
   */
  protected readonly guardSample = `interface RepeatContext {
  $implicit: number;
  index: number;
  first: boolean;
}

static ngTemplateContextGuard(
  _dir: RepeatDirective,
  _ctx: unknown,
): _ctx is RepeatContext {
  return true;
}

// Now 'let n' is typed as number; 'let x = indx' fails to compile.`;

  /** Line-by-line walkthrough of {@link guardSample}. */
  protected readonly guardNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The shape of the context object, named so it can be reused elsewhere — this is the same interface `RepeatDirective` uses to type its `TemplateRef`.',
    },
    {
      line: 7,
      text: 'A *static* method — called by the template type-checker at compile time, never at runtime. Neither `_dir` nor `_ctx` is ever a real value, hence the leading underscores.',
    },
    {
      line: 10,
      text: 'The return type is the whole trick: `_ctx is RepeatContext` is a TypeScript type predicate. The compiler calls this purely to read that annotation — the `return true` on the next line is never actually run against real data.',
    },
    {
      line: 14,
      text: 'The payoff: once this guard exists, `let n` in a template is typed `number`, and a typo like `let x = indx` becomes a compile error instead of a silently `undefined` value.',
    },
  ];
}
