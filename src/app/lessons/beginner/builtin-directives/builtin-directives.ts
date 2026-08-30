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
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * Lesson: Built-in Directives & Legacy Control Flow — `*ngIf`, `*ngFor`,
 * `ngClass`, `ngStyle` and `ngSwitch`.
 *
 * A deliberately *legacy* lesson. The modern equivalents (`@if`, `@for`,
 * `@switch`, and plain `[class.x]` / `[style.x]` bindings) are covered in their
 * own lessons and are what you should write today. This page exists because you
 * will still meet the structural-directive syntax in every codebase older than
 * Angular 17, in most tutorials, and in exam questions — and because the `*`
 * prefix is not obvious once you stop seeing it every day.
 *
 * The demos run both forms side by side so the mapping is direct.
 */
@Component({
  selector: 'app-lesson-builtin-directives',
  imports: [
    RouterLink,
    NgIf,
    NgFor,
    NgClass,
    NgStyle,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './builtin-directives.html',
  styleUrl: './builtin-directives.css',
})
export class BuiltinDirectives {
  /**
   * What the compiler does with one `*`. Drawn out because every confusing thing
   * about structural directives — the one-per-element rule, why `ng-container`
   * exists, why the element genuinely leaves the DOM — is a consequence of exactly
   * one of these steps.
   */
  protected readonly desugar = [
    {
      label: 'Compiler sees `*ngIf` on `<p>`',
      detail: 'The `*` is the marker. Everything below is automatic',
    },
    {
      label: 'Wrap `<p>` in an `<ng-template>`',
      detail: 'The element is now *inside* a template — so by default it renders nowhere',
      tone: 'accent' as const,
    },
    {
      label: 'Move the expression to `[ngIf]`',
      detail: 'Bound on the template, not on your element',
    },
    {
      label: '`NgIf` injects `TemplateRef` + `ViewContainerRef`',
      detail: 'The stencil, and the place to press it',
    },
    {
      label: 'Truthy → `createEmbeddedView`',
      detail: 'Falsy → `clear()`. Real nodes created and destroyed, not hidden',
      tone: 'good' as const,
    },
  ];

  /** The `*ngIf` vs `[hidden]` distinction, posed on a component with a live subscription. */
  protected readonly hiddenSample = `<!-- VideoPlayer polls the server every second
     and holds a WebSocket open. -->

<app-video-player [hidden]="!showPlayer" />

<!-- The user hides the player and walks away
     for an hour. What is the app doing? -->`;

  /** Choices for the desugaring check. */
  protected readonly desugarOptions = [
    {
      text: '`<p style="display: none">Welcome</p>` when the expression is falsy',
      why: 'That is `[hidden]`, which is a CSS toggle on an element that stays in the DOM. Structural directives do not hide anything — there is no element left to hide.',
    },
    {
      text: '`<ng-template [ngIf]="loggedIn"><p>Welcome</p></ng-template>`',
      correct: true,
      why: 'The `*` wraps the host element in an `<ng-template>` and moves the binding onto it. Everything odd about structural directives follows from this one rewrite: you cannot put two on an element because there is only one template to wrap, `<ng-container>` exists to give a `*` somewhere to live without adding a `<div>`, and the element truly disappears because the template was never instantiated.',
    },
    {
      text: '`<p *ngIf>` with the directive reading the attribute value at runtime',
      why: 'There is no runtime attribute reading. `*ngIf="expr"` is microsyntax that the *compiler* expands before your code ever runs — by the time the app is executing, the `*` no longer exists in any form.',
    },
    {
      text: '`@if (loggedIn) { <p>Welcome</p> }` — they compile to the same thing',
      why: 'They do the same job, but not the same way. `@if` is a control-flow block emitted directly into the template function: no directive class, no `TemplateRef` injection, nothing to import. That difference is exactly why forgetting an import can break `*ngIf` and can never break `@if`.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'If `@if` is better, why learn `*ngIf` at all?',
      a: 'Because you will read far more Angular than you write. Every codebase older than v17, most Stack Overflow answers, most tutorials and a good chunk of the certification question bank use the directive forms. You need to *read* them fluently and *write* the block forms — that asymmetry is the whole point of this lesson.',
    },
    {
      q: 'Why can I not put `*ngIf` and `*ngFor` on the same element?',
      a: 'Because each `*` wants to wrap that element in its own `<ng-template>`, and there is only one element to wrap. The compiler rejects it rather than guessing an order — which is right, because the two orders mean genuinely different things. Put one on an `<ng-container>` to get a second wrapping layer for free, with no extra DOM node.',
    },
    {
      q: 'Is `<ng-container>` a real element?',
      a: 'No — it compiles to a comment node and never appears in the rendered HTML. That is its whole reason to exist: somewhere to attach a structural directive when adding a `<div>` would break your flex or grid layout. You cannot style it, give it a class, or query for it, because there is nothing there.',
    },
    {
      q: 'What is the difference between `*ngIf` and `[hidden]`?',
      a: 'Destruction versus concealment. `*ngIf` creates and destroys real DOM, so a hidden component is genuinely gone — its subscriptions torn down, its timers cleared, its state lost. `[hidden]` sets `display: none` on an element that is still fully alive and still doing whatever it was doing. Use `*ngIf` by default; use `[hidden]` when you specifically want the state and the cost preserved, such as a tab you toggle constantly.',
    },
    {
      q: 'Do `ngClass` and `ngStyle` replace my static `class` attribute?',
      a: 'No, they merge with it, and this is the same rule the native `[class]` binding follows. They diff against what they applied last time and patch only the difference, calling `addClass`/`removeClass` — so a class that came from the static attribute is not theirs to remove and stays put.',
    },
  ];

  /**
   * Toggles the `*ngIf` demo.
   */
  protected readonly show = signal(true);
  /**
   * The list for the `*ngFor` demo.
   */
  protected readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  /**
   * The `ngSwitch` demo's selected fruit.
   */
  protected readonly selected = signal('Banana');
  /**
   * The `ngSwitch` demo's state — three arms plus a default.
   */
  protected readonly status = signal<'loading' | 'success' | 'error'>('loading');

  /**
   * `trackBy` function for the `*ngFor` demo.
   *
   * The old-style counterpart to `@for`'s `track` expression, and the reason
   * `@for` made tracking mandatory: `*ngFor` without a `trackBy` re-creates every
   * DOM node when the array is replaced, and nothing warns you.
   *
   * @param _index Unused — the name is the identity here.
   * @param name   The item.
   * @returns The tracking key.
   */
  protected trackByName(_index: number, name: string): string {
    return name;
  }
}
