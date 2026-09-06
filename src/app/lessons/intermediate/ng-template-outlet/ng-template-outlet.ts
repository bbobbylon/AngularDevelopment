import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin, TapeCard } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import { SlotHost } from './slot-host/slot-host';

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
 *
 * ## Presentation
 *
 * Migrated to the brain-friendly layer (see `shared/brain/` and
 * `docs/UI-DESIGN.md` §9), following the teaching order set by
 * `expert/change-detection` — the reference implementation: pose the problem
 * before naming it, give the reader an analogy to hang the vocabulary on, then
 * the same idea in four modes (dialogue, live demo, annotated code, glossary
 * diagram). The rubber-stamp analogy, the `Flow` step diagram, the context
 * mismatch `Predict`, and the view-reuse `Quiz` all carry over from the
 * pre-migration retention pass — this rewrite restructures and deepens them
 * rather than replacing them.
 */
@Component({
  selector: 'app-lesson-ng-template-outlet',
  imports: [
    RouterLink,
    NgTemplateOutlet,
    SlotHost,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    TapeCard,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  templateUrl: './ng-template-outlet.html',
  styleUrl: './ng-template-outlet.css',
})
export class NgTemplateOutletLesson {
  // ── Live demo state ────────────────────────────────────────────────────────

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

  // ── Presentation data — the "you are here" rail ────────────────────────────

  /** The Components & Templates track, in curriculum order. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Content Projection', id: 'content-projection' },
    { label: 'View Queries', id: 'view-queries' },
    { label: 'ng-template & Outlet' },
    { label: 'Encapsulation', id: 'view-encapsulation' },
  ];

  /**
   * The mental-model dialogue: the parts of a stamp-and-press exchange
   * introducing themselves, in the order a `[ngTemplateOutlet]="greetTpl"`
   * binding actually sets them off. Staged as dialogue rather than described in
   * prose so the reader follows a conversation instead of reconstructing a
   * relationship — see `Bubbles`' own JSDoc for why that sticks better.
   */
  protected readonly stampingTalk: BubbleTurn[] = [
    { who: 'You', says: 'I wrote `<ng-template>` right here, in the middle of my markup.' },
    {
      who: 'The template',
      says: "Noted. I've compiled into a factory that knows how to build a view — I haven't built one yet.",
    },
    {
      who: 'NgTemplateOutlet',
      says: 'Point me at that factory and hand me a context object, and I will ask a `ViewContainerRef` to stamp it.',
    },
    {
      who: 'The ViewContainerRef',
      says: '`createEmbeddedView(tpl, ctx)` — done. Nodes are in the DOM now, fully wired to that context.',
    },
    { who: 'You', says: 'Stamp me a second one — same template, fresh data.' },
    {
      who: 'The ViewContainerRef',
      says: 'Done again. A completely independent view. Change one and the other does not move.',
    },
  ];

  // ── Code samples + line-by-line notes ──────────────────────────────────────

  /** Sample: the whole basic API in six lines — declare once, press twice. */
  protected readonly basicOutletSample = `<ng-template #greetTpl>
  <p>Hello from the blueprint!</p>
</ng-template>

<!-- Render the SAME template in two places -->
<ng-container [ngTemplateOutlet]="greetTpl" />
<ng-container [ngTemplateOutlet]="greetTpl" />`;

  /** Line-by-line walkthrough of {@link basicOutletSample}. */
  protected readonly basicOutletNotes: CodeNote[] = [
    {
      line: 1,
      text: '`#greetTpl` is a **template reference variable** — it names this block so something else can point at it. It does not create an element; `<ng-template>` never becomes a DOM node at all.',
    },
    {
      line: 3,
      text: 'Everything between here and line 1 has compiled into a view factory. Zero DOM nodes exist because of this block by itself — that is the whole reason writing one "does nothing" on its own.',
    },
    {
      line: 6,
      text: '`[ngTemplateOutlet]` is the directive doing the actual work: it asks its host’s `ViewContainerRef` to `createEmbeddedView(greetTpl)`. `<ng-container>` itself renders no element of its own, so the stamp leaves no extra wrapper behind.',
    },
    {
      line: 7,
      text: 'Same `TemplateRef`, a second outlet. This produces a second, completely independent embedded view — proof that a template is a value you can stamp as many times as you want, or not at all.',
    },
  ];

  /** Sample: template context — `$implicit`, a named key, and the `@for` that feeds it. */
  protected readonly contextOutletSample = `<ng-template #personRow let-p let-badge="badge">
  <strong>{{ p.name }}</strong> — {{ p.role }}
  @if (badge) { <span>{{ badge }}</span> }
</ng-template>

@for (person of people(); track person.name) {
  <ng-container
    [ngTemplateOutlet]="personRow"
    [ngTemplateOutletContext]="{ $implicit: person, badge: person.role === 'Admin' ? '★' : '' }"
  />
}`;

  /** Line-by-line walkthrough of {@link contextOutletSample}. */
  protected readonly contextOutletNotes: CodeNote[] = [
    {
      line: 1,
      text: 'The bare `let-p` reads `context.$implicit`; `let-badge="badge"` reads `context.badge`. The names on the **left** are yours to choose — the strings on the **right** must match the context’s own keys exactly, or the variable comes out `undefined` with no warning at all.',
    },
    {
      line: 3,
      text: '`badge` is now an ordinary local variable inside this template, usable in an `@if`, an interpolation, anywhere a template expression is allowed.',
    },
    {
      line: 8,
      text: '`[ngTemplateOutlet]` says **which** `TemplateRef` to stamp — the same one, every iteration.',
    },
    {
      line: 9,
      text: '`[ngTemplateOutletContext]` supplies the data, rebuilt fresh on every pass of the `@for` — same template, different values each time. `$implicit` is the one "main thing" this template is about; `badge` is a named extra.',
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

  /** Sample: swapping which `TemplateRef` an outlet points at, driven by a signal. */
  protected readonly swapSample = `protected readonly view = signal<'compact' | 'detailed'>('compact');

@for (p of people(); track p.name) {
  <ng-container
    [ngTemplateOutlet]="view() === 'compact' ? compactTpl : detailedTpl"
    [ngTemplateOutletContext]="{ $implicit: p }"
  />
}`;

  /** Line-by-line walkthrough of {@link swapSample}. */
  protected readonly swapNotes: CodeNote[] = [
    {
      line: 1,
      text: 'A signal holding which template is "active" right now. `NgTemplateOutlet` neither knows nor cares that this came from a signal — it just reads whatever `TemplateRef` the binding evaluates to on each check.',
    },
    {
      line: 5,
      text: 'The whole switch lives in one ternary. Flip `view()` and this line evaluates to a **different `TemplateRef`** on the very next check — no `@if`/`@else` duplication of the row markup needed.',
    },
    {
      line: 6,
      text: 'The context shape — `{ $implicit: p }` — is identical for both templates here. That matters for what comes next: what does Angular do when only the `TemplateRef` changes and the context shape does not?',
    },
  ];

  /** Sample: `TemplateRef` handed to a child component as an `input()`. */
  protected readonly slotHostSample = `@Component({
  selector: 'app-slot-host',
  imports: [NgTemplateOutlet],
  template: '<ng-container [ngTemplateOutlet]="template()" [ngTemplateOutletContext]="ctx()" />',
})
export class SlotHost {
  template = input.required<TemplateRef<unknown>>();
  ctx = input<Record<string, unknown>>({});
}

// ---- Parent ----
<ng-template #myRow let-who="who">
  <p>Hello {{ who }}!</p>
</ng-template>
<app-slot-host [template]="myRow" [ctx]="{ who: 'World' }" />`;

  /** Line-by-line walkthrough of {@link slotHostSample}. */
  protected readonly slotHostNotes: CodeNote[] = [
    {
      line: 3,
      text: '`NgTemplateOutlet` is a **standalone directive** — it has to be imported here to be usable inside `SlotHost`’s own template, exactly like any other directive.',
    },
    {
      line: 7,
      text: 'A `TemplateRef` is a first-class value: store it, pass it as an `input()`, keep it in an array. `.required()` because there is nothing sensible to render without one.',
    },
    {
      line: 8,
      text: 'The data to feed the template, defaulting to an empty object — so a context-free template works with no extra binding at the call site.',
    },
    {
      line: 12,
      text: 'Declared in the **parent**, not inside `SlotHost` — so it can use the parent’s own fields, pipes and styles, even though `SlotHost` is what actually stamps it out.',
    },
    {
      line: 15,
      text: 'Passing `#myRow` by name hands over the `TemplateRef` itself, not a copy of markup. This exact mechanism is what powers Angular Material tables, CDK overlays, and every "bring-your-own-template" API you have ever used.',
    },
  ];

  // ── Diagram + self-test data ────────────────────────────────────────────────

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
}
