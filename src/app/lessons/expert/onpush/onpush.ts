import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BfPage, Bubbles, Chapter, CodeLab, Napkin } from '../../../shared/brain';
import type { BubbleTurn, ChapterStop, CodeNote } from '../../../shared/brain';
import { Compare, Faq, Flow, Predict, Quiz, Remember } from '../../../shared/teaching';
import type { FaqItem, FlowStep, QuizOption } from '../../../shared/teaching';
import { TickerStore } from './onpush.shared';
import { OnpushChild } from './onpush-child/onpush-child';
import { OnpushMutateChild } from './onpush-mutate-child/onpush-mutate-child';
import { OnpushSilentChild } from './onpush-silent-child/onpush-silent-child';
import { OnpushReader } from './onpush-reader/onpush-reader';
import { OnpushNonReader } from './onpush-non-reader/onpush-non-reader';

/**
 * Lesson: OnPush change detection — what actually marks a view dirty, live
 * proof of the skip, the mutation trap, markForCheck vs detectChanges, and
 * how signals turn OnPush into precise per-view reactivity.
 *
 * ## Presentation
 *
 * Pose the problem (Default checks everything, always — what if you want it
 * to skip?), analogy before vocabulary (a smoke detector wired to five
 * specific alarms, not a patrol), then the same mechanism in four modes —
 * a dialogue between the scheduler and a view, a five-step flow diagram of
 * marking-up/checking-down, two annotated code labs, and the five live demos
 * this lesson already had, kept exactly as they were: they are the actual
 * proof, and the whole reason this lesson is the one most likely to regress
 * into NG0100 if touched carelessly.
 */
@Component({
  selector: 'app-lesson-onpush',
  imports: [
    RouterLink,
    OnpushChild,
    OnpushMutateChild,
    OnpushSilentChild,
    OnpushReader,
    OnpushNonReader,
    BfPage,
    Bubbles,
    Chapter,
    CodeLab,
    Napkin,
    Compare,
    Faq,
    Flow,
    Predict,
    Quiz,
    Remember,
  ],
  styleUrl: './onpush.css',
  templateUrl: './onpush.html',
})
export class Onpush {
  /**
   * The value fed to the `OnPush` child.
   */
  protected readonly value = signal(0);
  /**
   * Clicks on the do-nothing button.
   */
  protected readonly pokes = signal(0);
  /**
   * The shared store, written by the reader/non-reader demo.
   */
  protected readonly store = inject(TickerStore);

  /** Plain (non-signal) object on purpose — the mutation-trap demo star. */
  protected user = { name: 'Ada', clicks: 0 };

  /**
   * Bumps a signal the lesson component reads, forcing a pass without touching any
   * child's input.
   */
  protected poke() {
    this.pokes.update((p) => p + 1);
  }

  /**
   * Mutates the child's input object in place.
   *
   * Same reference, so the `OnPush` child's input is unchanged as far as Angular
   * is concerned and the child is never re-checked. The data is new; the view is
   * not.
   */
  protected mutate() {
    this.user.clicks++; // same reference — OnPush child never notices
  }

  /**
   * Replaces the input object with a copy.
   *
   * Identical contents, new reference — and that is all `OnPush` needs. Which is
   * why `OnPush` and immutable updates are one decision, not two.
   */
  protected replace() {
    this.user = { ...this.user }; // new reference — input binding marks the child
  }

  // ── Presentation data ──────────────────────────────────────────────────────

  /** The Runtime & Performance track, for the "you are here" rail. */
  protected readonly stops: ChapterStop[] = [
    { label: 'Change Detection', id: 'change-detection' },
    { label: 'OnPush' },
    { label: 'Zoneless', id: 'zoneless' },
    { label: '@defer', id: 'deferrable-views' },
    { label: 'Performance', id: 'performance' },
  ];

  /**
   * The scheduler and a view, negotiating whether a check is actually owed.
   * Mirrors the five official triggers without reciting the table again.
   */
  protected readonly bridgeTalk: BubbleTurn[] = [
    { who: "Angular's scheduler", says: 'Something happened somewhere. Do you need re-checking?' },
    {
      who: 'The OnPush view',
      says: "Only if it's one of my five alarms. Otherwise I'm not moving.",
    },
    {
      who: "Angular's scheduler",
      says: "Fair enough — here's your input again. Same object reference as last time.",
    },
    {
      who: 'The OnPush view',
      says: "Then nothing happened, as far as I'm concerned. Same paper — I don't care what you scribbled on it.",
    },
    {
      who: "Angular's scheduler",
      says: "Fine. Here's a signal write — and your template actually reads it.",
    },
    {
      who: 'The OnPush view',
      says: "Now we're talking. Checking myself, right now — you didn't even have to ask my parent.",
    },
  ];

  /**
   * The five-step version of "marking walks up, checking walks down" — the same
   * mechanism as {@link underTheHoodSample}, in diagram form.
   */
  protected readonly markingFlow: FlowStep[] = [
    {
      label: 'markForCheck() called',
      detail: 'From an async callback, or the async pipe, or a manual call.',
      tone: 'accent',
    },
    { label: 'This view: flagged Dirty', detail: 'The one concrete "please refresh me" flag.' },
    {
      label: 'Every ancestor up to root: "traverse me"',
      detail: 'Not dirty themselves — just marked as a path leading to a dirty view.',
    },
    {
      label: 'Next scheduled pass starts at the root',
      detail: 'Marking never runs the check itself — it only earns a place in line.',
    },
    {
      label: 'Walks down, refreshing flagged views, pruning the rest',
      detail: 'A clean OnPush view with no "traverse me" flag stops the walk cold.',
      tone: 'good',
    },
  ];

  /**
   * Sample: opting in to `OnPush`.
   */
  readonly optInSample = `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // …
})`;

  /**
   * Sample: `markForCheck` for async work that `OnPush` would otherwise miss.
   */
  readonly markForCheckSample = `private cdr = inject(ChangeDetectorRef);

load() {
  this.api.fetch().subscribe((data) => {
    this.data = data;        // field write — nobody is notified
    this.cdr.markForCheck(); // flag view + ancestors, schedule a pass
  });
}

// …or skip the ceremony entirely:
readonly data = toSignal(this.api.fetch());   // signal read marks the view
readonly data$ = this.api.fetch();            // async pipe calls markForCheck`;

  /** Line-by-line walkthrough of {@link markForCheckSample}. */
  protected readonly markForCheckNotes: CodeNote[] = [
    {
      line: 1,
      text: "Injects the current view's `ChangeDetectorRef` — the handle used to flag *this* view manually.",
    },
    {
      line: 4,
      text: 'A plain field assignment inside a subscribe callback. By the time this line runs, whatever change-detection pass was in flight when `load()` was called has long since finished — nothing is watching this line.',
    },
    {
      line: 5,
      text: '`markForCheck()` is the manual version of what an input change or a signal read does automatically: flags this view, flags every ancestor with "traverse me", and schedules the next pass.',
    },
    {
      line: 9,
      text: '`toSignal` converts the observable into a signal — reading it in the template registers this view as a tracked consumer, so every emission marks the view directly. No `cdr` needed.',
    },
    {
      line: 10,
      text: 'The `async` pipe does the exact same job as line 5, just automatically: it calls `markForCheck()` on every value it receives, which is the entire reason it "just works" under `OnPush`.',
    },
  ];

  /**
   * Sample: under the hood — `markForCheck` walks **up**, flagging the ancestor
   * path so the next pass can reach the dirty view, while `detectChanges` walks
   * **down** from where it is called. Knowing which direction each goes explains
   * most of the surprising cases.
   */
  readonly underTheHoodSample = `// marking: WALKS UP — flag me, and flag the path so the pass can reach me
markForCheck()  →  view.flags |= Dirty
                   for each ancestor: flags |= HasChildViewsToRefresh

// checking: WALKS DOWN from the root
refreshView(root)
  Default view?            → refresh bindings, descend
  OnPush view, dirty?      → refresh bindings, descend, clear flag
  OnPush view, clean?      → PRUNE — skip the entire subtree
  clean but "traverse me"? → descend without refreshing (reach the dirty leaf)`;

  /** Line-by-line walkthrough of {@link underTheHoodSample}. */
  protected readonly underTheHoodNotes: CodeNote[] = [
    {
      line: 2,
      text: 'The one concrete flag: `Dirty` means "actually refresh this view\'s bindings on the next pass."',
    },
    {
      line: 3,
      text: 'A second, weaker flag placed on every ancestor: not "refresh me", just "something under me needs reaching" — so the walk doesn\'t prune before it gets there.',
    },
    {
      line: 7,
      text: 'A `Default` view has no opt-out: every pass refreshes it, dirty flag or not.',
    },
    {
      line: 8,
      text: 'An `OnPush` view refreshes only when its own `Dirty` flag is set — set by one of the five triggers.',
    },
    {
      line: 9,
      text: 'The prune. No `Dirty` flag and no "traverse me" flag means the entire subtree is skipped — bindings unevaluated, getters uncalled, children unvisited.',
    },
    {
      line: 10,
      text: 'The reason a dirty grandchild still gets reached: its clean parent is marked "traverse me", so the walk passes *through* without refreshing it.',
    },
  ];

  /** The self-test for live proof #4 — the signal precision claim, stated as a prediction. */
  protected readonly readerQuizOptions: QuizOption[] = [
    {
      text: "Only OnpushReader re-renders — its template actually reads the signal, so it's a tracked consumer.",
      correct: true,
      why: 'Exactly it: a signal read registers that view as a consumer directly. The write goes straight to its readers, bypassing the parent-down "did my input change" check entirely.',
    },
    {
      text: "Both re-render — they're siblings under the same OnPush parent, so a check reaches them together.",
      why: "OnPush's classic triggers are per-view, not per-sibling-group. More importantly, a signal write doesn't even travel through the parent-down path — it marks readers directly, wherever they sit in the tree.",
    },
    {
      text: 'Neither re-renders, because store.count lives in a service, not a component input.',
      why: "Inputs aren't the only thing OnPush watches. A template that reads ANY signal — no matter where that signal is declared — becomes a tracked consumer of it.",
    },
    {
      text: "Only OnpushNonReader re-renders, because it hasn't been checked in a while and is 'due'.",
      why: "There's no such fairness scheduling in Angular's change detector. Re-checking is driven entirely by what a view's template actually reads — never by how long it's been.",
    },
  ];

  /**
   * Sample: the wrong-way test — mutating the component instance directly and
   * expecting `detectChanges()` to notice. For {@link Compare}'s left panel.
   */
  protected readonly testWrongSample = `it('shows the new title', () => {
  fixture.componentInstance.title = 'Updated';
  fixture.detectChanges();

  expect(el.textContent).toContain('Updated');
  // ✗ fails — nothing marked the view dirty
});`;

  /**
   * Sample: the right-way test — drive an input through `setInput`, and flag
   * internal state through `markForCheck`. For {@link Compare}'s right panel.
   */
  protected readonly testRightSample = `it('shows the new title', () => {
  fixture.componentRef.setInput('title', 'Updated');
  // ^ the real framework input write — this is what marks the view

  fixture.detectChanges();
  expect(el.textContent).toContain('Updated'); // ✓ passes
});

it('shows internal state set outside a template event', () => {
  fixture.componentInstance.internalFlag = true;
  fixture.changeDetectorRef.markForCheck(); // ← flag this view dirty first
  fixture.detectChanges();

  expect(el.textContent).toContain('…');
});`;

  /** The doubts this lesson reliably leaves behind. */
  protected readonly questions: FaqItem[] = [
    {
      q: 'An OnPush child renders a stale user name after the parent updates it. What are the possible causes?',
      a: 'Three, in order of likelihood: (1) the parent mutated the object in place — same reference, no dirty mark. (2) the value was assigned inside an async callback with no markForCheck()/signal. (3) the template calls an impure function or getter whose result changed with no input actually changing.',
    },
    {
      q: 'Why does the async pipe "fix" OnPush components with observables?',
      a: 'Because on every emission `AsyncPipe` calls `ChangeDetectorRef.markForCheck()` for you. A manual `subscribe()` plus a field assignment skips that step entirely, which is exactly why it goes stale under OnPush.',
    },
    {
      q: 'markForCheck() was called but nothing re-rendered until the user clicked something. Why?',
      a: "That's the classic zone-era symptom: markForCheck() only flags views — under zone.js it doesn't itself schedule a pass, so something else (the click) had to trigger the tick. Zoneless Angular fixed exactly this: marking now notifies the scheduler directly, so a pass always follows.",
    },
    {
      q: 'A click inside an OnPush component re-renders it even though no input changed. Why?',
      a: 'Angular wraps every template event listener so firing it calls `markViewDirty()` on that view before your handler even runs. An event bound in its own template is one of the five official re-check triggers, by design.',
    },
    {
      q: 'What exactly does a change-detection pass skip for a clean OnPush view?',
      a: "The whole subtree: bindings aren't re-evaluated, getters aren't called, child components aren't visited at all. An ancestor flagged 'traverse me' is descended through without being refreshed itself, so one dirty leaf never forces work on its clean ancestors.",
    },
  ];
}
