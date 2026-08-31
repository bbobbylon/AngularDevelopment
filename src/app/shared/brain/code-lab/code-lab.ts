import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RichText } from '../../teaching/rich-text/rich-text';
import { highlightLines } from './highlight-lines';

/** An annotation attached to one line of a snippet. */
export interface CodeNote {
  /** 1-based source line this note explains. */
  line: number;
  /** What that line does. One or two sentences; say what every symbol is. */
  text: string;
}

/** A line as rendered: its HTML, its number, and the note marker it carries. */
interface RenderedLine {
  html: string;
  number: number;
  /** 1-based marker number, or 0 when this line has no note. */
  marker: number;
}

/**
 * An editor window with numbered, line-by-line annotations and an optional
 * predict-then-reveal output strip.
 *
 * ## Why this component exists
 *
 * "Annotate code snippets line by line" is the single most repeated request in
 * this project's history, and the reason every previous attempt drifted back to
 * a paragraph above a 30-line block is that the markup for doing it properly is
 * fiddly: you need the line to be addressable, the note to point at it, and the
 * pair to stay in sync when the snippet is edited. Hand-rolling that per lesson
 * guarantees it decays. Here it is one input:
 *
 * ```ts
 * protected readonly notes: CodeNote[] = [
 *   { line: 3, text: '`inject()` asks the current injector for the service…' },
 * ];
 * ```
 *
 * The component takes it from there: line 3 gets a numbered marker, note 1 gets
 * the same number, and hovering or focusing either one lights up the other. A
 * learner who cannot yet read the snippet — which is the entire audience — gets
 * a way in that does not require holding the whole block in their head.
 *
 * **Never assume the reader can read the snippet.** If a line introduces a
 * symbol, the note says what the symbol is. That is the bar; a note that
 * restates the line in English ("this sets the value") fails it.
 *
 * ## Usage
 *
 * ```html
 * <app-code-lab
 *   file="cart.service.ts"
 *   [code]="serviceSource"
 *   [notes]="notes"
 *   prompt="Trace it before you scroll — what does the log print?"
 *   output="total: 24"
 * />
 * ```
 *
 * With `prompt` and `output` set, the window grows a strip along the bottom
 * that withholds the result behind a button — the "ask before telling" beat,
 * attached to the code it is about rather than floating in a separate box.
 *
 * ## Accessibility
 *
 * The snippet is a `<pre>`; line numbers are drawn with a CSS counter so they
 * are never selected or copied with the code. Every marker is a real button
 * labelled "Note N: <the note>", and every note in the list is a button too, so
 * the pairing is reachable from the keyboard in both directions. Activating
 * either sets `aria-pressed` on both. The reveal button is an ordinary
 * disclosure with `aria-expanded` / `aria-controls`. Nothing here depends on
 * hover: hover is a shortcut for what focus already does.
 */
@Component({
  selector: 'app-code-lab',
  imports: [RichText],
  templateUrl: './code-lab.html',
  styleUrl: './code-lab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeLab {
  /** Filename shown in the title bar. Also the block's accessible name. */
  readonly file = input<string>('');

  /** Raw source. Keep trailing `//` comments in it — they are half the teaching. */
  readonly code = input.required<string>();

  /** Line annotations. Order is irrelevant; they are numbered by line. */
  readonly notes = input<CodeNote[]>([]);

  /** Heading above the note list. */
  readonly notesLabel = input<string>('Line by line');

  /** Predict prompt for the bottom strip. Empty hides the strip. */
  readonly prompt = input<string>('');

  /** What the snippet prints. Revealed by the strip's button. */
  readonly output = input<string>('');

  /** Button copy for the reveal. */
  readonly revealLabel = input<string>('Reveal output');

  /** Which note/line pair is lit, 1-based. 0 is none. */
  protected readonly active = signal(0);

  /** Whether the output has been revealed. */
  protected readonly revealed = signal(false);

  /** Unique enough for aria-controls within a page of several of these. */
  protected readonly panelId = `code-lab-out-${Math.random().toString(36).slice(2, 9)}`;

  /** Notes sorted by line and numbered, so markers read top to bottom. */
  protected readonly ordered = computed(() =>
    [...this.notes()]
      .sort((a, b) => a.line - b.line)
      .map((note, index) => ({ ...note, number: index + 1 })),
  );

  /** Every source line, with its number and any marker it carries. */
  protected readonly lines = computed<RenderedLine[]>(() => {
    const markers = new Map(this.ordered().map((note) => [note.line, note.number]));
    return highlightLines(this.code()).map((html, index) => ({
      html,
      number: index + 1,
      marker: markers.get(index + 1) ?? 0,
    }));
  });

  /** Toggle: clicking the lit pair turns it off, which is what a reader expects. */
  protected toggle(number: number): void {
    this.active.update((current) => (current === number ? 0 : number));
  }

  protected reveal(): void {
    this.revealed.set(true);
  }
}
