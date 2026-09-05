import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CHEAT_SHEETS, type CheatSheet } from '../../../core/cheat-sheets';

/**
 * Renders one cheat sheet. Every route generated from `CHEAT_SHEETS` in
 * `app.routes.ts` points at this same component, distinguished only by a
 * `sheetId` route datum — the same "one component, many static routes"
 * shape `ComingSoon` uses for not-yet-written lessons.
 *
 * Code/command samples are plain strings in the model; the app-wide
 * highlight sweep in `app.ts` tokenises any `.code pre` after each
 * navigation, reading the language from this template's `data-lang`
 * attribute (defaulting to `ts` when absent, which this page never wants,
 * so every code element sets it explicitly from `block.lang`).
 */
@Component({
  selector: 'app-cheat-sheet-detail',
  imports: [RouterLink],
  templateUrl: './cheat-sheet-detail.html',
  styleUrl: './cheat-sheet-detail.css',
})
export class CheatSheetDetail {
  private readonly route = inject(ActivatedRoute);

  /**
   * The sheet this route renders, or `undefined` for an unknown id.
   *
   * A plain method reading `route.snapshot`, not a `computed` seeded once:
   * every sheet route reuses this same component instance, so a `computed`
   * would cache the first sheet visited and keep showing it after
   * navigating straight to another one. The template calls this, so it
   * re-reads on every change-detection pass — see `ComingSoon` for the same
   * pattern and the same reason.
   */
  protected readonly sheet = (): CheatSheet | undefined => {
    const id = this.route.snapshot.data['sheetId'] as string | undefined;
    return id ? CHEAT_SHEETS.find((s) => s.id === id) : undefined;
  };

  /** Key of the command/code row just copied, for a per-row "Copied!" flash. */
  protected readonly copiedKey = signal<string | null>(null);

  /**
   * Copies one snippet to the clipboard and flashes a confirmation on that
   * row only — `key` disambiguates which of many copy buttons on the page
   * was pressed.
   *
   * Wrapped in a `try` because the Clipboard API is absent under SSR and
   * blocked without permission in some contexts; failure is silent since the
   * text is still selectable by hand.
   *
   * @param key  Unique id for the row/block being copied.
   * @param text The raw text to copy.
   */
  protected copy(key: string, text: string): void {
    try {
      void navigator.clipboard?.writeText(text);
      this.copiedKey.set(key);
      setTimeout(() => this.copiedKey.set(null), 1500);
    } catch {
      // Clipboard unavailable — the code is still selectable by hand.
    }
  }

  /**
   * Opens the browser print dialog for a paper copy of the sheet.
   *
   * The print rules that hide the app chrome live in `src/styles.css`, not
   * here: component styles are view-encapsulated and cannot match the
   * topbar/footer/toast outlet the root shell renders.
   */
  protected print(): void {
    window.print();
  }
}
