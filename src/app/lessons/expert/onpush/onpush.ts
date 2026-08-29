import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  /**
   * Sample: opting in to `OnPush`.
   */
  readonly optInSample = `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // …
})`;

  /**
   * Sample: the mutation trap and its fix, matching the two buttons above.
   */
  readonly mutationSample = `// WRONG — same reference, OnPush child stays stale
this.user.clicks++;

// RIGHT — new reference, the input binding marks the child dirty
this.user = { ...this.user, clicks: this.user.clicks + 1 };

// arrays too:
this.items.push(item);          // stale
this.items = [...this.items, item];  // fresh`;

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

  /**
   * Sample: impure template expressions, which freeze under `OnPush` because they
   * are only re-evaluated when the view is checked.
   */
  readonly wrongRightSample = `// WRONG — impure expression: freezes under OnPush
template: '{{ getTotal() }} at {{ Date.now() }}'

// RIGHT — computed signal: recomputes AND marks the view when deps change
readonly total = computed(() => this.items().reduce((s, i) => s + i.price, 0));
template: '{{ total() }}'

// WRONG — manual subscribe + field assignment (stale under OnPush)
this.users$.subscribe((u) => (this.users = u));

// RIGHT — let the pipe/signal do the marking
template: '@for (u of users$ | async; track u.id) { … }'
readonly users = toSignal(this.users$, { initialValue: [] });`;
}
