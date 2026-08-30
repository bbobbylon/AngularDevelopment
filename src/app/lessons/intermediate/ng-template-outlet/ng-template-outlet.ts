import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlotHost } from './slot-host/slot-host';
import { Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';

/**
 * One row in the swappable-template demo.
 */
interface Person {
  name: string;
  role: string;
}

/**
 * Lesson: `<ng-template>` and `NgTemplateOutlet` — markup as a value.
 *
 * An `<ng-template>` is not rendered where it is written; it is captured as a
 * `TemplateRef` that can be passed around and stamped out elsewhere, as many
 * times as needed or not at all. `NgTemplateOutlet` is the directive that does
 * the stamping, and `ngTemplateOutletContext` supplies the `let-` variables.
 *
 * The demos cover the three ways to get a `TemplateRef` — a `#ref` in the same
 * template, an `input()` (see {@link SlotHost}), and `viewChild` — plus swapping
 * between two templates at runtime, which is the pattern behind every
 * customisable list or table component.
 */
@Component({
  selector: 'app-lesson-ng-template-outlet',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet, SlotHost, Faq, Flow, Predict, Quiz, Remember],
  templateUrl: './ng-template-outlet.html',
  styleUrl: './ng-template-outlet.css',
})
export class NgTemplateOutletLesson {
  /**
   * From written markup to nodes on the page. Worth drawing because the whole
   * lesson rests on one counter-intuitive fact — that markup can be a *value* —
   * and the sequence is where that becomes concrete.
   */
  protected readonly stamping = [
    {
      label: '`<ng-template>` compiles to a factory',
      detail: 'A function that knows how to build a view. It builds nothing yet',
      tone: 'accent' as const,
    },
    {
      label: '`#ref` hands you a `TemplateRef`',
      detail: 'A value. Store it, pass it to a child, keep it in a signal',
    },
    {
      label: 'An outlet supplies a `ViewContainerRef`',
      detail: 'The anchor comment marking *where* nodes will go',
    },
    {
      label: '`createEmbeddedView(tpl, ctx)`',
      detail: 'The factory runs. `let-` variables read from `ctx`',
    },
    {
      label: 'Nodes inserted at the anchor',
      detail: 'Stamp it again and you get a second, independent view',
      tone: 'good' as const,
    },
  ];

  /** The context-key mismatch. */
  protected readonly contextSample = `<ng-template #row let-person="person">
  <span>{{ person }}</span>
</ng-template>

<ng-container
  [ngTemplateOutlet]="row"
  [ngTemplateOutletContext]="{ $implicit: user }" />

<!-- user is { name: 'Ada' }. What renders? -->`;

  /** Choices for the view-reuse check. */
  protected readonly reuseOptions = [
    {
      text: 'The embedded view is destroyed and rebuilt from the template',
      why: 'That is what happens when the `TemplateRef` itself changes — pointing the outlet at a different template really does tear down and rebuild. A new context object with the same shape is a much cheaper event.',
    },
    {
      text: 'The existing view is kept and its context updated in place',
      correct: true,
      why: '`NgTemplateOutlet` compares the *shape* of the context — its set of keys — against the previous one. Same keys means the already-created view can simply be given the new values and re-checked, so DOM nodes, focus and component state all survive. Add or remove a key and the shape has changed, and then it does rebuild. This is why swapping data through an outlet is cheap and swapping templates is not.',
    },
    {
      text: 'Nothing happens — the outlet only reads the context once, at creation',
      why: 'Then the signal-driven demos on this page could not work. The context is a live binding, re-evaluated on every change-detection pass like any other.',
    },
    {
      text: 'It depends on whether the object is mutated or replaced',
      why: 'Mutation versus replacement changes whether the *binding* is seen as changed at all, but not the recreate decision. Once the outlet does see a new context, what governs recreation is whether the key set differs — not how the object came to be new.',
    },
  ];

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions = [
    {
      q: 'When do I use this instead of `ng-content`?',
      a: "Use `ng-content` when the consumer hands you a finished chunk of markup and you just need somewhere to put it. Reach for a `TemplateRef` when you need to render it *more than once*, *not at all*, at a *different time*, or with *data you supply* — a table that stamps the consumer's row template once per record cannot be built with `ng-content`, because there is only one piece of projected content and no way to feed it a row.",
    },
    {
      q: 'Why does my `let-x` come out `undefined`?',
      a: 'Almost always a key mismatch. The bare `let-x` reads `context.$implicit` and nothing else; `let-x="foo"` reads `context.foo`. If your context says `{ person: … }` and your template says `let-p`, they never meet. Nothing warns you, because the context is an untyped object and Angular has no way to know what you meant.',
    },
    {
      q: 'Can I have two unnamed `let-` variables?',
      a: 'No. The shorthand always means `$implicit`, and there is only one `$implicit` per context, so a second bare `let-` would just be another alias for the same value. Anything beyond the primary value gets a named key — which is a reasonable design, since it forces the *main* thing a template is about to be obvious.',
    },
    {
      q: 'Is `<ng-template>` the same thing as the HTML `<template>` element?',
      a: "Related in spirit, unrelated in mechanism. The browser's `<template>` holds inert DOM you clone by hand. Angular's `<ng-template>` never becomes a DOM element at all — it compiles away into a view factory, and what you clone is a fully-wired Angular view with bindings, directives and change detection already attached.",
    },
    {
      q: 'Is a falsy `[ngTemplateOutlet]` an error?',
      a: 'No, and that is deliberate — `null` is a legitimate "render nothing here" value, which makes optional slots easy to express. The cost is that a typo in a template reference looks exactly like an intentionally empty slot. If an outlet is mysteriously blank, check the spelling of the `#ref` before anything else.',
    },
  ];

  /**
   * Which template the swap demo is rendering.
   */
  protected readonly view = signal<'compact' | 'detailed'>('compact');
  /**
   * The rows both templates render.
   */
  protected readonly people = signal<Person[]>([
    { name: 'Ada Lovelace', role: 'Admin' },
    { name: 'Grace Hopper', role: 'Member' },
    { name: 'Alan Turing', role: 'Member' },
  ]);
  /**
   * A template fetched by query rather than by reference — the third way to get
   * hold of one.
   */
  protected readonly vcTemplate = viewChild<TemplateRef<unknown>>('vcTpl');
}
