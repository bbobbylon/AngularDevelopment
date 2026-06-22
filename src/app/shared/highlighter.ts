const KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export',
  'extends', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
  'import', 'in', 'infer', 'instanceof', 'interface', 'keyof', 'let', 'module',
  'namespace', 'new', 'null', 'of', 'override', 'private', 'protected', 'public',
  'readonly', 'return', 'satisfies', 'set', 'static', 'super', 'switch', 'this',
  'throw', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while', 'with',
  'yield', 'true', 'false', 'never', 'any', 'string', 'number', 'boolean', 'object',
]);

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Tokenises TypeScript/JavaScript source text and returns an HTML string with
 * <span class="hl-*"> wrappers. Operates on plain text (textContent), not HTML.
 * Handles: line comments, block comments, strings (single/double/template),
 * decorators, numbers, keywords, and function-call identifiers.
 */
export function highlight(code: string): string {
  let out = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];
    const ch2 = code[i + 1];

    // Line comment
    if (ch === '/' && ch2 === '/') {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? len : nl;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Block comment
    if (ch === '/' && ch2 === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? len : close + 2;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // String literals
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < len) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === ch) { j++; break; }
        j++;
      }
      out += `<span class="hl-str">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Decorator
    if (ch === '@' && ch2 && /\w/.test(ch2)) {
      let j = i + 1;
      while (j < len && /\w/.test(code[j])) j++;
      out += `<span class="hl-dec">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Number (not preceded by a word char)
    if (/[0-9]/.test(ch) && (i === 0 || !/\w/.test(code[i - 1]))) {
      let j = i;
      while (j < len && /[0-9.]/.test(code[j])) j++;
      out += `<span class="hl-num">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Identifier / keyword / function call
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < len && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);

      // Skip whitespace to peek at next non-space char
      let k = j;
      while (k < len && code[k] === ' ') k++;

      if (KEYWORDS.has(word)) {
        out += `<span class="hl-kw">${esc(word)}</span>`;
      } else if (code[k] === '(') {
        out += `<span class="hl-fn">${esc(word)}</span>`;
      } else {
        out += esc(word);
      }
      i = j;
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}
