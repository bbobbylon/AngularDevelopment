import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GLOSSARY, type GlossaryTerm } from '../../core/glossary-data';

interface GlossaryGroup {
  letter: string;
  terms: GlossaryTerm[];
}

const SORTED = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));

/**
 * Glossary / Cheat Sheet — a searchable A-Z reference of every Angular and
 * TypeScript term used across the curriculum. Pure read-only view over the
 * static `GLOSSARY` data; the only state is the search query. `window.print()`
 * plus the `@media print` block below gives a clean, single-column printout.
 */
@Component({
  selector: 'app-glossary',
  imports: [RouterLink],
  styles: [`
    .gl-hero { text-align: center; padding: 48px 24px 24px; }
    .gl-hero h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); margin: 12px 0; }
    .gl-hero p { max-width: 620px; margin: 0 auto; color: var(--text-muted); }
    .pill { display: inline-block; font-size: .74rem; letter-spacing: .05em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; background: rgba(99,102,241,.12); color: #6366f1; font-weight: 600; }

    .gl-toolbar { max-width: 760px; margin: 0 auto 8px; padding: 0 24px; display: flex; gap: 10px; align-items: center; }
    .gl-search { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: .92rem; }
    .print-btn { padding: 9px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; font-size: .84rem; white-space: nowrap; }

    .gl-jump { max-width: 760px; margin: 14px auto 24px; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 4px; }
    .gl-jump a { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: .78rem; font-weight: 600; text-decoration: none; color: var(--text-muted); }
    .gl-jump a.has-terms { color: #6366f1; }
    .gl-jump a.has-terms:hover { background: rgba(99,102,241,.12); }
    .gl-jump a.no-terms { pointer-events: none; opacity: .3; }

    .gl-body { max-width: 760px; margin: 0 auto; padding: 0 24px 60px; }
    .gl-group { margin-bottom: 28px; }
    .gl-group h2 { font-size: 1.1rem; color: #6366f1; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin: 0 0 12px; }
    .gl-term { padding: 12px 0; border-bottom: 1px dashed var(--border); }
    .gl-term:last-child { border-bottom: none; }
    .gl-term dt { font-weight: 700; font-size: .95rem; margin-bottom: 4px; }
    .gl-term dd { margin: 0; color: var(--text-muted); font-size: .88rem; line-height: 1.55; }
    .gl-link { display: inline-block; margin-top: 6px; font-size: .8rem; color: var(--blue); text-decoration: underline; }
    .empty-state { text-align: center; padding: 60px 24px; color: var(--text-muted); }

    @media print {
      .gl-toolbar, .gl-jump, .gl-link { display: none !important; }
      .gl-hero { padding: 0 0 16px; text-align: left; }
      .gl-body { max-width: none; padding: 0; }
      .gl-term { break-inside: avoid; }
    }
  `],
  template: `
    <div class="gl-hero">
      <span class="pill">Reference</span>
      <h1>Glossary &amp; Cheat Sheet</h1>
      <p>
        {{ totalCount }} Angular and TypeScript terms used across the curriculum,
        in one searchable, printable A-Z reference.
      </p>
    </div>

    <div class="gl-toolbar">
      <input
        class="gl-search"
        type="search"
        placeholder="Search terms or definitions…"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      <button class="print-btn" (click)="print()">🖨 Print</button>
    </div>

    <div class="gl-jump">
      @for (letter of alphabet; track letter) {
        <a
          [class.has-terms]="letterHasTerms(letter)"
          [class.no-terms]="!letterHasTerms(letter)"
          [attr.href]="letterHasTerms(letter) ? '#letter-' + letter : null"
        >{{ letter }}</a>
      }
    </div>

    <div class="gl-body">
      @if (groups().length === 0) {
        <div class="empty-state">No terms match "{{ query() }}".</div>
      } @else {
        @for (group of groups(); track group.letter) {
          <div class="gl-group" [id]="'letter-' + group.letter">
            <h2>{{ group.letter }}</h2>
            <dl>
              @for (t of group.terms; track t.term) {
                <div class="gl-term">
                  <dt>{{ t.term }}</dt>
                  <dd>{{ t.definition }}</dd>
                  @if (t.topicPath) {
                    <a [routerLink]="'/' + t.topicPath" class="gl-link">📚 Study this topic →</a>
                  }
                </div>
              }
            </dl>
          </div>
        }
      }
    </div>
  `,
})
export class Glossary {
  protected readonly query = signal('');
  protected readonly totalCount = SORTED.length;
  protected readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  private readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return SORTED;
    return SORTED.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
  });

  private readonly allLetters = computed(
    () => new Set(SORTED.map((t) => t.term[0].toUpperCase())),
  );

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

  protected letterHasTerms(letter: string): boolean {
    return this.allLetters().has(letter);
  }

  protected print(): void {
    window.print();
  }
}
