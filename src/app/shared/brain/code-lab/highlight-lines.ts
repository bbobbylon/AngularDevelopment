import { highlight } from '../../highlighter';

/**
 * Syntax-highlights a snippet and returns it as one HTML string per source line.
 *
 * ## Why this is not just `highlight(code).split('\n')`
 *
 * {@link highlight} emits `<span class="hl-*">…</span>` wrappers around whole
 * tokens, and two token kinds legitimately contain newlines: block comments and
 * template literals. Splitting the emitted HTML on `\n` therefore cuts through
 * the middle of a `<span>`, leaving line N with an unclosed tag and line N+1
 * with an orphan `</span>`. Angular's sanitiser silently repairs each fragment
 * on its own, and the result is a block comment that is grey on its first line
 * and default-coloured on every line after it.
 *
 * So this walks the emitted HTML instead, and at every newline closes whatever
 * span is open, ends the line, and re-opens the same span at the start of the
 * next one. Each returned string is independently well-formed.
 *
 * The walk is safe because {@link highlight} escapes `<`, `>` and `"` in the
 * source before emitting, so the only real tags in its output are the wrappers
 * it wrote itself, and they are never nested.
 *
 * @param code raw source text (not HTML)
 * @returns one well-formed HTML fragment per line, in order
 */
export function highlightLines(code: string): string[] {
  const html = highlight(code);
  const lines: string[] = [];
  const OPEN = '<span class="';
  const CLOSE = '</span>';

  let current = '';
  let openClass: string | null = null;
  let i = 0;

  while (i < html.length) {
    if (html.startsWith(OPEN, i)) {
      const attrEnd = html.indexOf('">', i);
      openClass = html.slice(i + OPEN.length, attrEnd);
      current += html.slice(i, attrEnd + 2);
      i = attrEnd + 2;
      continue;
    }

    if (html.startsWith(CLOSE, i)) {
      openClass = null;
      current += CLOSE;
      i += CLOSE.length;
      continue;
    }

    if (html[i] === '\n') {
      lines.push(openClass ? current + CLOSE : current);
      current = openClass ? `${OPEN}${openClass}">` : '';
      i += 1;
      continue;
    }

    current += html[i];
    i += 1;
  }

  lines.push(openClass ? current + CLOSE : current);
  return lines;
}
