import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GLOSSARY, type GlossaryTerm } from '../../core/glossary-data';
import { Bubbles, Napkin, type BubbleTurn } from '../../shared/brain';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';

/** One letter's worth of the A-Z listing. */
interface GlossaryGroup {
  /** The uppercase initial, used as the heading and the `#letter-X` anchor. */
  letter: string;
  /** Terms starting with {@link letter}, in sorted order. */
  terms: GlossaryTerm[];
}

/**
 * The glossary sorted once at module load rather than per render. Copied first
 * because `sort` mutates, and `GLOSSARY` is shared with the integrity spec.
 */
const SORTED = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));

/**
 * Glossary / Cheat Sheet — a searchable A-Z reference of every Angular and
 * TypeScript term used across the curriculum. Pure read-only view over the
 * static `GLOSSARY` data; the only state is the search query. `window.print()`
 * plus the `@media print` block below gives a clean, single-column printout.
 */
@Component({
  selector: 'app-glossary',
  imports: [RouterLink, RevealOnScrollDirective, Napkin, Bubbles],
  styleUrl: './glossary.css',
  templateUrl: './glossary.html',
})
export class Glossary {
  /** Free-text search, matched against both term and definition. */
  protected readonly query = signal('');

  /** Total number of terms, shown in the header. Fixed — not affected by the filter. */
  protected readonly totalCount = SORTED.length;

  /**
   * Every letter, so the jump bar renders a full A-Z. Letters with no terms
   * are shown greyed out rather than omitted, which keeps the bar a stable
   * width instead of reflowing as you type.
   */
  protected readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  /** Terms matching {@link query}; all of them when the box is empty. */
  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return SORTED;
    return SORTED.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
  });

  /**
   * Letters that have at least one term in the *unfiltered* glossary.
   *
   * Deliberately computed from `SORTED`, not from {@link filtered}: the jump
   * bar should not flicker letters in and out of the enabled state while the
   * user is still typing.
   */
  private readonly allLetters = computed(() => new Set(SORTED.map((t) => t.term[0].toUpperCase())));

  /** The filtered terms bucketed by initial letter, A-Z — what the page renders. */
  protected readonly groups = computed<GlossaryGroup[]>(() => {
    const byLetter = new Map<string, GlossaryTerm[]>();
    for (const term of this.filtered()) {
      const letter = term.term[0].toUpperCase();
      const bucket = byLetter.get(letter) ?? [];
      bucket.push(term);
      byLetter.set(letter, bucket);
    }
    return [...byLetter.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, terms]) => ({ letter, terms }));
  });

  /**
   * Whether a jump-bar letter should be an active link.
   *
   * @param letter An uppercase initial.
   */
  protected letterHasTerms(letter: string): boolean {
    return this.allLetters().has(letter);
  }

  /**
   * Purely presentational: the two-line "You asked / nothing back" exchange
   * shown by `<app-bubbles>` when {@link groups} comes back empty. Mirrors the
   * same device on the Practice page's own empty state — echoes the search
   * back so the reader can see at a glance whether it was a typo before
   * trying again. Does not change what the empty state IS, only how it reads;
   * {@link groups}, the actual filtering, is untouched.
   */
  protected readonly emptyStateTurns = computed<BubbleTurn[]>(() => {
    const q = this.query().trim();
    return [
      { who: 'You', says: q ? `Got anything for **"${q}"**?` : 'Got anything for that?' },
      { who: 'Glossary', says: 'Nothing yet — double-check the spelling, or try a shorter word.' },
    ];
  });

  /**
   * Opens the browser print dialog for a paper cheat-sheet.
   *
   * The print rules that hide the app chrome live in `src/styles.css`, not in
   * this component's styles: component styles are view-encapsulated and cannot
   * match the topbar, footer or toast outlet, which are rendered by the root
   * shell.
   */
  protected print(): void {
    window.print();
  }
}
