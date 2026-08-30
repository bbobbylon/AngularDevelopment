import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HighlightDirective } from './highlight-directive/highlight-directive';
import { BadgeDirective } from './badge-directive/badge-directive';
import { DemoTooltipDirective } from './demo-tooltip-directive/demo-tooltip-directive';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Custom Attribute Directives — behaviour without a template.
 *
 * A directive is a component without a view: it attaches to an existing element
 * and changes how it looks or behaves. Covers signal inputs on directives, the
 * `host` metadata object (which replaces `@HostBinding` / `@HostListener`),
 * `ElementRef` against `Renderer2`, `exportAs`, and cleanup.
 *
 * Three directives are defined and demonstrated: {@link HighlightDirective} for
 * host bindings, {@link BadgeDirective} for `exportAs` and derived ARIA, and
 * {@link DemoTooltipDirective} for creating DOM — and disposing of it.
 *
 * @see shared/tooltip.directive — the app's own tooltip, built on this pattern.
 */
@Component({
  selector: 'app-lesson-attribute-directives',
  standalone: true,
  imports: [
    RouterLink,
    HighlightDirective,
    BadgeDirective,
    DemoTooltipDirective,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './attribute-directives.html',
  styleUrl: './attribute-directives.css',
})
export class AttributeDirectives {
  /**
   * The life of a directive instance, from selector match to teardown. Laid out
   * because the two things that bite people — reading an input too early, and
   * leaking DOM created outside the host — are both really questions about
   * *when* in this sequence your code is running.
   */
  protected readonly lifecycle = [
    {
      label: 'The compiler matches the selector',
      detail: 'Any element carrying the attribute, anywhere the directive is imported',
      tone: 'accent' as const,
    },
    {
      label: 'An instance is constructed',
      detail: '`inject()` works here. Inputs do **not** have values yet',
    },
    {
      label: 'Inputs are set',
      detail: 'First change detection pass, before `ngOnInit`',
    },
    {
      label: 'Host bindings fold into the element',
      detail: '`host: {}` is compiled into the element’s own update function',
    },
    {
      label: 'Host listeners are attached',
      detail: 'Angular registers them and will remove them for you',
    },
    {
      label: 'It lives as long as the element does',
      detail: 'Re-rendered by `@if`? New element, new directive instance',
    },
    {
      label: '`ngOnDestroy` — your only chance',
      detail: 'Host bindings clean themselves up. Anything you appended elsewhere does not',
      tone: 'good' as const,
    },
  ];

  /** The orphaned-tooltip trap. */
  protected readonly orphanSample = `@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  @HostListener('mouseenter') show() {
    this.tip = this.renderer.createElement('div');
    this.renderer.appendChild(document.body, this.tip);
  }

  @HostListener('mouseleave') hide() {
    this.renderer.removeChild(document.body, this.tip);
    this.tip = null;
  }
  // note: no ngOnDestroy
}

<!-- The host: -->
@if (showButton()) {
  <button appTooltip="Deletes everything">Delete</button>
}

// You hover the button. While the tooltip is up,
// something sets showButton() to false. Then what?`;

  /** Choices for the input-timing check. */
  protected readonly timingOptions = [
    {
      text: 'It works — inputs are resolved before the constructor runs',
      why: 'Inputs are written onto the instance, so the instance has to exist first. There is no ordering in which the constructor could already see them.',
    },
    {
      text: 'It throws `NG0950` — the input has no value during construction',
      correct: true,
      why: 'Angular constructs the directive, *then* sets its inputs on the first change-detection pass. A required signal input asked for its value before that point throws `NG0950: Input is required but no value is available yet`, which is a genuinely good error — the old `@Input` equivalent silently handed you `undefined` and let the bug surface three files away. Move the work to `ngOnInit`, which runs after inputs are set, or into an `effect()`, which additionally re-runs whenever the input changes later.',
    },
    {
      text: 'It returns `undefined` and the directive silently does nothing',
      why: 'That is exactly what `@Input() text: string` used to do, and the reason `input.required()` was given a real error instead. Silence here is the old behaviour, not the current one.',
    },
    {
      text: 'It works, but only when the value is a static attribute rather than a binding',
      why: 'A tempting distinction, since static attributes are known at compile time. Angular still applies both through the same input-setting step, after construction.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'When should this be a directive rather than a component?',
      a: 'Ask whether you are adding markup or adding behaviour. If the answer involves rendering something with a shape of its own — a card, a dialog, a chart — that is a component. If it is "make an element that already exists do something extra" — highlight on hover, autofocus, confirm before click, track visibility — that is a directive. The strongest tell is the wrapper test: if turning it into a component would force you to wrap other people’s markup in an extra element, you wanted a directive.',
    },
    {
      q: 'Can I put several attribute directives on one element?',
      a: 'Yes, as many as you like — and this is the sharpest difference from structural directives, where the `*` allows exactly one. `<button appTooltip="Save" appHighlight appAnalytics="save-click">` is completely normal. The catch is collisions: if two of them bind `[style.backgroundColor]`, the result is whichever ran last, and nothing warns you. Directives that write to the same host property should be designed not to overlap.',
    },
    {
      q: 'Why bother with `Renderer2` when `nativeElement` is right there?',
      a: 'Because `nativeElement` is only a DOM node when there is a DOM. Under server-side rendering there is not one, and code that reaches for `document` or `.style` directly either crashes the render or silently produces different HTML than the browser would. `Renderer2` is an abstraction over "whatever is drawing right now". If your app will never be server-rendered you can get away without it; if you are unsure, use it, because retrofitting is far more work than starting with it.',
    },
    {
      q: 'Do the square brackets in the selector matter?',
      a: "They are the whole point. `selector: 'appHighlight'` matches an `<appHighlight>` **element**; `selector: '[appHighlight]'` matches any element with that **attribute**, which is what you want. You can also narrow it: `'button[appConfirm]'` matches only buttons, so misusing your directive on a `<div>` becomes a compile-time non-match rather than a runtime surprise.",
    },
    {
      q: 'How do I react when an input changes, without `ngOnChanges`?',
      a: 'Read it in an `effect()`, or derive from it with `computed()`. Both track the signal input automatically, so they re-run only when that specific input changes — rather than `ngOnChanges` firing for every input on the directive and handing you a bag of `SimpleChange` objects to sort through. If the reaction is purely visual, better still: put the expression straight in a `host` binding and let change detection handle it.',
    },
  ];
}
