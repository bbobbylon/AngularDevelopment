import { Directive, OnDestroy, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Marks a lesson as using the brain-friendly presentation layer.
 *
 * ## Why a directive and not just a class
 *
 * The `bf` class on the article is enough to restyle the article. It is not
 * enough to restyle the *page*: a cream lesson column floating on the app's
 * zinc background reads like an embedded iframe rather than a redesigned page.
 * The paper tint has to reach `<html>`, which no component stylesheet can do.
 *
 * So a lesson opts in twice, from one place:
 *
 * ```html
 * <article class="lesson bf" bfPage> … </article>
 * ```
 *
 * `class="lesson bf"` scopes the typography (see `src/brain-friendly.css`), and
 * `bfPage` puts `bf-page` on `<html>` for as long as this lesson is mounted.
 * The class is removed on destroy, so navigating from a migrated lesson to an
 * un-migrated one restores the original theme with no flash — the router
 * destroys the outgoing component before it creates the incoming one.
 *
 * It deliberately does NOT touch `data-theme`. Light and dark are the user's
 * choice and the brain-friendly palette has a full expression in both; this
 * only swaps *which* palette the page is painted from.
 */
@Directive({
  selector: '[bfPage]',
})
export class BfPage implements OnDestroy {
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.doc.documentElement.classList.add('bf-page');
  }

  ngOnDestroy(): void {
    this.doc.documentElement.classList.remove('bf-page');
  }
}
