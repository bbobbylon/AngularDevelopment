/** One piece of a string that has been split on backtick-delimited code spans. */
export interface TextSegment {
  /** The text of this piece, with the delimiting backticks already stripped. */
  readonly text: string;
  /** True when this piece was inside backticks and should render as `<code>`. */
  readonly code: boolean;
}

/**
 * Splits a string on backtick-delimited code spans, Markdown-style.
 *
 * ## Why not `[innerHTML]`
 *
 * The teaching components (`Quiz`, `Faq`, `Predict`) take their copy as plain strings in
 * a component's TypeScript rather than as projected markup, because a lesson listing ten
 * Q&A pairs as an array is far easier to read and edit than ten blocks of nested HTML.
 * But those strings constantly need to name an API — `computed()`, `ChangeDetectorRef`,
 * `@if` — and unformatted identifiers in running prose are genuinely harder to read.
 *
 * The obvious fix, letting the strings contain HTML and binding them with `[innerHTML]`,
 * is the wrong trade. It routes lesson copy through the sanitizer, makes every one of
 * those inputs a place where an XSS bug could later be introduced, and sits badly in an
 * app whose own `expert/security` lesson teaches not to do this. Backticks give the same
 * readability through the normal template path, with no HTML in the data at all.
 *
 * An unclosed backtick is treated as literal text rather than an error: teaching copy is
 * edited constantly and a stray backtick should look slightly wrong, not blow up a lesson.
 *
 * @param text Copy that may contain `backtick` spans.
 * @returns Alternating plain and code segments, in order. Empty pieces are dropped.
 *
 * @example
 * segmentInlineCode('call `set()` to write')
 * // [{text: 'call ', code: false}, {text: 'set()', code: true}, {text: ' to write', code: false}]
 */
export function segmentInlineCode(text: string): TextSegment[] {
  const pieces = text.split('`');

  // An even number of backticks produces an odd number of pieces. An odd number means one
  // is unmatched, so the trailing piece is re-joined as literal text rather than silently
  // becoming code.
  if (pieces.length % 2 === 0) {
    const tail = pieces.pop() ?? '';
    pieces[pieces.length - 1] = `${pieces[pieces.length - 1]}\`${tail}`;
  }

  return pieces
    .map((piece, index) => ({ text: piece, code: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}
