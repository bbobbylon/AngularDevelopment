/**
 * Minimal TypeScript/JavaScript syntax highlighter used by the lesson pages.
 *
 * Hand-written rather than pulling in Prism or Shiki: the app ships ~100 lesson
 * pages full of code samples, and a real highlighter would add more to the
 * bundle than the entire rest of the app. This one is a single linear scan with
 * no dependencies and no build step, and it only has to be right for the
 * Angular/TS snippets in this curriculum — not for arbitrary source.
 *
 * @see styles.css for the `.hl-*` classes it emits.
 */

/**
 * Words rendered as keywords. Includes the primitive type names
 * (`string`, `number`, …) alongside real reserved words, because in TS code
 * samples they read as keywords even though the parser treats them as
 * identifiers.
 */
const KEYWORDS = new Set([
  'abstract',
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'declare',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'get',
  'if',
  'implements',
  'import',
  'in',
  'infer',
  'instanceof',
  'interface',
  'keyof',
  'let',
  'module',
  'namespace',
  'new',
  'null',
  'of',
  'override',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'satisfies',
  'set',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'true',
  'false',
  'never',
  'any',
  'string',
  'number',
  'boolean',
  'object',
]);

/**
 * Globals and Angular/RxJS API names that an editor resolves and tints even
 * though they are ordinary identifiers. Colouring these is a large part of why
 * real editor output looks structured rather than uniform.
 */
const BUILTINS = new Set([
  'console',
  'window',
  'document',
  'Math',
  'JSON',
  'Object',
  'Array',
  'Promise',
  'Error',
  'Date',
  'Map',
  'Set',
  'signal',
  'computed',
  'effect',
  'input',
  'output',
  'model',
  'inject',
  'resource',
  'linkedSignal',
]);

/**
 * Characters that form operators. Scanned as runs so `=>`, `===`, `?.` and `??`
 * come out as one token rather than three.
 */
const OPERATOR_CHARS = new Set([
  '=',
  '+',
  '-',
  '*',
  '/',
  '<',
  '>',
  '!',
  '&',
  '|',
  '?',
  ':',
  '%',
  '^',
  '~',
]);

/** Structural punctuation, dimmed the way an editor dims it. */
const PUNCT_CHARS = new Set(['{', '}', '(', ')', '[', ']', ';', ',', '.']);

/**
 * Escapes text for interpolation into the HTML string this module builds.
 *
 * Every branch of {@link highlight} routes its output through here, which is
 * what makes the result safe to bind with `[innerHTML]`: the input is treated
 * strictly as source text, so a sample containing `<script>` is displayed
 * rather than executed.
 */
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
        if (code[j] === '\\') {
          j += 2;
          continue;
        }
        if (code[j] === ch) {
          j++;
          break;
        }
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

    // Identifier / keyword / type / property / function call
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < len && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);

      // Skip whitespace to peek at next non-space char
      let k = j;
      while (k < len && code[k] === ' ') k++;

      // Look back (past whitespace) for a `.` — the marker of a member access,
      // which an editor colours differently from a free identifier.
      let b = i - 1;
      while (b >= 0 && code[b] === ' ') b--;
      const afterDot = b >= 0 && code[b] === '.' && code[b - 1] !== '.';

      if (KEYWORDS.has(word)) {
        out += `<span class="hl-kw">${esc(word)}</span>`;
      } else if (BUILTINS.has(word)) {
        out += `<span class="hl-builtin">${esc(word)}</span>`;
      } else if (code[k] === '(') {
        // A call. Members read as methods, bare names as functions — same colour
        // family in most editor themes, but methods are not bolded.
        out += `<span class="${afterDot ? 'hl-method' : 'hl-fn'}">${esc(word)}</span>`;
      } else if (afterDot) {
        out += `<span class="hl-prop">${esc(word)}</span>`;
      } else if (/^[A-Z]/.test(word)) {
        // Capitalised and not a call: a class, interface, enum or type name.
        out += `<span class="hl-type">${esc(word)}</span>`;
      } else {
        out += esc(word);
      }
      i = j;
      continue;
    }

    // Operators and punctuation. Editors dim braces/semicolons and tint
    // operators; leaving both as plain body text is most of why an unstyled
    // snippet reads as a grey wall.
    if (OPERATOR_CHARS.has(ch)) {
      let j = i;
      while (j < len && OPERATOR_CHARS.has(code[j])) j++;
      out += `<span class="hl-op">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (PUNCT_CHARS.has(ch)) {
      out += `<span class="hl-punct">${esc(ch)}</span>`;
      i++;
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}
