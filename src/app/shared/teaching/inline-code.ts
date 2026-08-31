/** One piece of a string that has been split on backtick- and asterisk-delimited spans. */
export interface TextSegment {
  /** The text of this piece, with the delimiters already stripped. */
  readonly text: string;
  /** True when this piece was inside backticks and should render as `<code>`. */
  readonly code: boolean;
  /** True when this piece was inside `**` and should render as `<strong>`. */
  readonly bold?: boolean;
}

/**
 * Splits a string on backtick-delimited code spans and `**bold**` spans, Markdown-style.
 *
 * ## Why not `[innerHTML]`
 *
 * The teaching components (`Quiz`, `Faq`, `Predict`) and the presentation components
 * (`CodeLab`, `Bubbles`, `Layers`) take their copy as plain strings in a component's
 * TypeScript rather than as projected markup, because a lesson listing ten Q&A pairs as
 * an array is far easier to read and edit than ten blocks of nested HTML. But those
 * strings constantly need to name an API — `computed()`, `ChangeDetectorRef`, `@if` — and
 * unformatted identifiers in running prose are genuinely harder to read.
 *
 * The obvious fix, letting the strings contain HTML and binding them with `[innerHTML]`,
 * is the wrong trade. It routes lesson copy through the sanitizer, makes every one of
 * those inputs a place where an XSS bug could later be introduced, and sits badly in an
 * app whose own `expert/security` lesson teaches not to do this. Two Markdown delimiters
 * give the same readability through the normal template path, with no HTML in the data.
 *
 * ## Why bold, and why only these two
 *
 * `**bold**` was added with the brain-friendly layer, when line-by-line code annotations
 * arrived: an annotation's job is to make one word of a line land ("this runs **once**",
 * "touches the DOM **only if they differ**"), and without emphasis every note is a flat
 * sentence the eye slides off. Code and emphasis are the two things teaching copy
 * genuinely needs. Anything more — links, lists, headings — belongs in projected markup,
 * not in a data string, and adding it here would turn this into a Markdown parser that
 * nobody asked for and everybody would have to maintain.
 *
 * ## Precedence and error tolerance
 *
 * Backticks are resolved first and win: `` `a ** b` `` is code containing two literal
 * asterisks, not a broken bold span. An unclosed delimiter of either kind is treated as
 * literal text rather than an error — teaching copy is edited constantly, and a stray
 * backtick should look slightly wrong, not blow up a lesson.
 *
 * @param text Copy that may contain `backtick` and `**bold**` spans.
 * @returns Alternating plain, code and bold segments, in order. Empty pieces are dropped.
 *
 * @example
 * segmentInlineCode('call `set()` to write')
 * // [{text: 'call ', code: false}, {text: 'set()', code: true}, {text: ' to write', code: false}]
 *
 * @example
 * segmentInlineCode('runs **once**')
 * // [{text: 'runs ', code: false}, {text: 'once', code: false, bold: true}]
 */
export function segmentInlineCode(text: string): TextSegment[] {
  const pieces = splitOnDelimiter(text, '`');

  return pieces
    .flatMap((piece, index) =>
      index % 2 === 1
        ? // Inside backticks: emit verbatim, so `**` in a code span stays literal.
          [{ text: piece, code: true }]
        : splitOnDelimiter(piece, '**').map((run, boldIndex) =>
            boldIndex % 2 === 1
              ? { text: run, code: false, bold: true }
              : { text: run, code: false },
          ),
    )
    .filter((segment) => segment.text.length > 0);
}

/**
 * Splits on a delimiter, returning alternating outside/inside runs.
 *
 * When the delimiter count is odd the last one is unmatched, so the trailing run is
 * re-joined onto its predecessor as literal text — that is what makes a stray backtick
 * render as a stray backtick instead of swallowing the rest of the sentence.
 */
function splitOnDelimiter(text: string, delimiter: string): string[] {
  const pieces = text.split(delimiter);

  if (pieces.length % 2 === 0) {
    const tail = pieces.pop() ?? '';
    pieces[pieces.length - 1] = `${pieces[pieces.length - 1]}${delimiter}${tail}`;
  }

  return pieces;
}
