/**
 * Minimal multi-language syntax highlighter used by the lesson pages and the
 * cheat-sheet pages.
 *
 * Hand-written rather than pulling in Prism or Shiki: the app ships ~100 lesson
 * pages full of code samples, and a real highlighter would add more to the
 * bundle than the entire rest of the app. This one is a single linear scan with
 * no dependencies and no build step, and it only has to be right for the
 * snippets in this curriculum — not for arbitrary source.
 *
 * TypeScript/JavaScript is the default and its output is byte-identical to the
 * original TS-only version: {@link highlight}'s second argument defaults to
 * `'ts'`, and the `'ts'` {@link LangConfig} reproduces every branch the
 * original single-language scanner had (decorators, member-access vs. free
 * identifier, capitalised type names, call detection). The other languages
 * (`bash`, `sql`, `python`, `java`, `yaml`, `json`, `css`, `text`) reuse the exact
 * same scanner, parametrised by a small per-language config — different comment
 * markers, keyword/builtin sets, and a couple of language-specific token rules
 * (shell flags/variables for `bash`, the `key:` in `key: value` for `yaml` and
 * `json`, and hex colours for `css`). `text` skips tokenising entirely — it
 * means "this block is plain output, not source."
 *
 * `html` is the one exception: markup needs two scanner states (inside a tag vs.
 * between tags) rather than one, so it has its own pass in
 * {@link highlightMarkup}, which also understands Angular template syntax —
 * bindings, interpolations and `@if`/`@for` blocks.
 *
 * The two scanners also co-operate on *mixed* samples. Dozens of lessons show a
 * component class and its template in one block (`// component … // template`),
 * and a `.css` sample will end with the markup that consumes it. Rather than
 * force every such block to pick one wrong language, the linear scanner hands
 * any line that *starts* with a template construct — a tag, an `{{ }}`, an
 * `@if` — to the markup scanner and resumes on the next line
 * (`templateIslands` in {@link LangConfig}). That is the whole "mixed" story:
 * no third mode, no per-line language tags in the samples.
 *
 * Known, accepted gap: Python triple-quoted strings (`"""…"""`) are not
 * modelled — the string scanner is a single-char-delimiter scan shared by every
 * language, and three quotes in a row would close-then-reopen rather than open
 * one long string. Cheat-sheet/lesson Python samples use single-line strings
 * only, which is the same "not for arbitrary source" trade-off the rest of this
 * file makes.
 *
 * @see styles.css for the `.hl-*` classes it emits.
 */

/** Languages {@link highlight} can tokenise. `ts` is the default. */
export type HighlightLang =
  'ts' | 'bash' | 'sql' | 'python' | 'java' | 'yaml' | 'json' | 'css' | 'html' | 'text';

/**
 * Words rendered as keywords. Includes the primitive type names
 * (`string`, `number`, …) alongside real reserved words, because in TS code
 * samples they read as keywords even though the parser treats them as
 * identifiers.
 */
const TS_KEYWORDS = new Set([
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
const TS_BUILTINS = new Set([
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

const JAVA_KEYWORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'record',
  'return',
  'sealed',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'var',
  'void',
  'volatile',
  'while',
  'yield',
  'true',
  'false',
  'null',
]);

const JAVA_BUILTINS = new Set([
  'System',
  'String',
  'Integer',
  'Long',
  'Double',
  'Boolean',
  'List',
  'Map',
  'Set',
  'Optional',
  'Stream',
  'ArrayList',
  'HashMap',
  'Objects',
]);

const PYTHON_KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'self',
  'try',
  'while',
  'with',
  'yield',
]);

const PYTHON_BUILTINS = new Set([
  'print',
  'len',
  'range',
  'str',
  'int',
  'float',
  'list',
  'dict',
  'set',
  'tuple',
  'open',
  'input',
  'super',
  'isinstance',
  'type',
  'Exception',
]);

const SQL_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'DATABASE',
  'INDEX',
  'ALTER',
  'DROP',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'FULL',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AND',
  'OR',
  'NOT',
  'NULL',
  'IS',
  'IN',
  'LIKE',
  'BETWEEN',
  'AS',
  'DISTINCT',
  'UNION',
  'ALL',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'DEFAULT',
  'CONSTRAINT',
  'UNIQUE',
  'CHECK',
  'GRANT',
  'REVOKE',
  'WITH',
  'CASE',
  'WHEN',
  'THEN',
  'END',
  'IF',
  'EXISTS',
  'USE',
  'SHOW',
  'DESCRIBE',
  'EXPLAIN',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'TRANSACTION',
  'ENGINE',
  'CHARSET',
  'AUTO_INCREMENT',
  'VARCHAR',
  'INT',
  'BIGINT',
  'TEXT',
  'BOOLEAN',
  'TIMESTAMP',
  'DATE',
  'DATETIME',
  'DECIMAL',
  'FLOAT',
  'DOUBLE',
]);

const SQL_BUILTINS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'NOW', 'CONCAT', 'COALESCE']);

const BASH_KEYWORDS = new Set([
  'if',
  'then',
  'elif',
  'else',
  'fi',
  'for',
  'in',
  'do',
  'done',
  'while',
  'until',
  'case',
  'esac',
  'function',
  'return',
  'exit',
  'break',
  'continue',
  'select',
  'time',
]);

const BASH_BUILTINS = new Set([
  'echo',
  'cd',
  'ls',
  'grep',
  'sed',
  'awk',
  'cat',
  'export',
  'local',
  'readonly',
  'declare',
  'set',
  'unset',
  'source',
  'alias',
  'trap',
  'pwd',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'chmod',
  'chown',
  'curl',
  'wget',
  'npm',
  'npx',
  'git',
  'docker',
  'kubectl',
  'mysql',
  'psql',
  'ssh',
  'scp',
  'tar',
  'find',
  'xargs',
  'sudo',
]);

const YAML_KEYWORDS = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']);

const JSON_KEYWORDS = new Set(['true', 'false', 'null']);

/**
 * CSS words that read as keywords rather than as values — the `!important`
 * flag, the inherit-family globals, and the words that only ever appear in a
 * structural position. At-rules (`@media`, `@keyframes`) are not listed
 * because the shared `decorators` rule already catches any `@word`.
 */
const CSS_KEYWORDS = new Set([
  'important',
  'inherit',
  'initial',
  'unset',
  'revert',
  'from',
  'to',
  'and',
  'not',
  'only',
]);

/**
 * Common CSS value keywords. Not exhaustive and not meant to be — the point is
 * that `display: flex` shows `flex` as a resolved value rather than as
 * undifferentiated body text, the same job `console` does in a TS snippet.
 */
const CSS_VALUES = new Set([
  'absolute',
  'auto',
  'block',
  'border-box',
  'center',
  'column',
  'contents',
  'cover',
  'ease',
  'ease-in-out',
  'fixed',
  'flex',
  'grid',
  'hidden',
  'inline',
  'inline-block',
  'inline-flex',
  'linear',
  'none',
  'nowrap',
  'pointer',
  'relative',
  'row',
  'space-between',
  'sticky',
  'transparent',
  'visible',
  'wrap',
]);

const EMPTY = new Set<string>();

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

/** Per-language scanner behaviour. See the module doc for what each flag controls. */
interface LangConfig {
  keywords: Set<string>;
  builtins: Set<string>;
  /** SQL samples mix `SELECT`/`select` freely; match on the upper-cased word. */
  caseInsensitiveKeywords: boolean;
  lineComment: string | null;
  blockComment: readonly [string, string] | null;
  /** `@Word` tokens — Angular/Java annotations, Python decorators. */
  decorators: boolean;
  /** The C-family/OO heuristics: `.prop` vs free identifier, `Capitalised` types, `name(` calls. */
  richIdentifiers: boolean;
  /** `$VAR`, `${VAR}` and `-x`/`--flag` tokens. */
  shellTokens: boolean;
  /** Colour the key half of `key: value` (bare word or quoted string) as `hl-key`. */
  keyColon: boolean;
  /** `#fff` / `#1a2b3c` hex colours — css only. */
  hexColors: boolean;
  /**
   * Hand a line that starts with a tag, an interpolation or an `@if`-style
   * block to the markup scanner. On for the languages whose samples embed
   * template fragments (ts, css); off where `<` at a line start means
   * something else.
   */
  templateIslands: boolean;
}

const LANGS: Record<Exclude<HighlightLang, 'text' | 'html'>, LangConfig> = {
  ts: {
    keywords: TS_KEYWORDS,
    builtins: TS_BUILTINS,
    caseInsensitiveKeywords: false,
    lineComment: '//',
    blockComment: ['/*', '*/'],
    decorators: true,
    richIdentifiers: true,
    shellTokens: false,
    keyColon: false,
    hexColors: false,
    templateIslands: true,
  },
  java: {
    keywords: JAVA_KEYWORDS,
    builtins: JAVA_BUILTINS,
    caseInsensitiveKeywords: false,
    lineComment: '//',
    blockComment: ['/*', '*/'],
    decorators: true,
    richIdentifiers: true,
    shellTokens: false,
    keyColon: false,
    hexColors: false,
    templateIslands: false,
  },
  python: {
    keywords: PYTHON_KEYWORDS,
    builtins: PYTHON_BUILTINS,
    caseInsensitiveKeywords: false,
    lineComment: '#',
    blockComment: null,
    decorators: true,
    richIdentifiers: true,
    shellTokens: false,
    keyColon: false,
    hexColors: false,
    templateIslands: false,
  },
  sql: {
    keywords: SQL_KEYWORDS,
    builtins: SQL_BUILTINS,
    caseInsensitiveKeywords: true,
    lineComment: '--',
    blockComment: ['/*', '*/'],
    decorators: false,
    richIdentifiers: false,
    shellTokens: false,
    keyColon: false,
    hexColors: false,
    templateIslands: false,
  },
  bash: {
    keywords: BASH_KEYWORDS,
    builtins: BASH_BUILTINS,
    caseInsensitiveKeywords: false,
    lineComment: '#',
    blockComment: null,
    decorators: false,
    richIdentifiers: false,
    shellTokens: true,
    keyColon: false,
    hexColors: false,
    templateIslands: false,
  },
  yaml: {
    keywords: YAML_KEYWORDS,
    builtins: EMPTY,
    caseInsensitiveKeywords: false,
    lineComment: '#',
    blockComment: null,
    decorators: false,
    richIdentifiers: false,
    shellTokens: false,
    keyColon: true,
    hexColors: false,
    templateIslands: false,
  },
  css: {
    keywords: CSS_KEYWORDS,
    builtins: CSS_VALUES,
    caseInsensitiveKeywords: false,
    lineComment: null,
    blockComment: ['/*', '*/'],
    decorators: true,
    richIdentifiers: false,
    shellTokens: false,
    keyColon: true,
    hexColors: true,
    // A stylesheet sample often ends with the markup that consumes it.
    templateIslands: true,
  },
  json: {
    keywords: JSON_KEYWORDS,
    builtins: EMPTY,
    caseInsensitiveKeywords: false,
    // Strict JSON has no comments, but every config file the curriculum shows
    // (tsconfig.json, angular.json) accepts them, and the samples lean on
    // `// angular.json:` labels. Leaving these untokenised turned the label
    // into a row of stray operators.
    lineComment: '//',
    blockComment: ['/*', '*/'],
    decorators: false,
    richIdentifiers: false,
    shellTokens: false,
    keyColon: true,
    hexColors: false,
    templateIslands: false,
  },
};

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

/** True if, skipping spaces from `from`, the next character is a single `:` (not `::`). */
function isFollowedByColon(code: string, from: number): boolean {
  let k = from;
  while (k < code.length && code[k] === ' ') k++;
  return code[k] === ':' && code[k + 1] !== ':';
}

/**
 * Angular's built-in control-flow blocks, minus the leading `@`. These read as
 * keywords in a template the way `if` and `for` read as keywords in TypeScript,
 * so they are deliberately *not* routed through the generic decorator rule:
 * `@if` is control flow, `@Component` is an annotation, and colouring them the
 * same would teach the reader they are the same kind of thing.
 */
const TEMPLATE_BLOCKS = new Set([
  'if',
  'else',
  'for',
  'empty',
  'switch',
  'case',
  'default',
  'defer',
  'placeholder',
  'loading',
  'error',
  'let',
]);

/**
 * Words that are keywords only inside a template expression: the `of` and
 * `track` of `@for (item of items; track item.id)`, the `as` of an alias, the
 * `when` of a `@defer` trigger. TypeScript's scanner knows none of them, so an
 * un-special-cased block head comes out as a row of undifferentiated words.
 */
const TEMPLATE_EXPR_KEYWORDS = /\b(?:of|track|as|when|let)\b/g;

/**
 * Highlights the TypeScript-ish expression inside an interpolation, a binding
 * value, or a control-flow block head.
 *
 * The expression language of a template is TypeScript plus a handful of extra
 * words ({@link TEMPLATE_EXPR_KEYWORDS}), so this splits on those words, hands
 * every segment between them to {@link highlight} with the ordinary `ts` rules,
 * and emits the words themselves as keywords.
 *
 * Splitting rather than post-processing matters: each segment is highlighted
 * independently, so no span ever ends up nested inside another, which is the
 * invariant `highlightLines` relies on when it closes and re-opens spans across
 * line breaks.
 */
function templateExpr(src: string): string {
  let out = '';
  let last = 0;
  for (const m of src.matchAll(TEMPLATE_EXPR_KEYWORDS)) {
    const at = m.index ?? 0;
    out += highlight(src.slice(last, at), 'ts');
    out += `<span class="hl-kw">${esc(m[0])}</span>`;
    last = at + m[0].length;
  }
  return out + highlight(src.slice(last), 'ts');
}

/** Index of the `)` matching the `(` at `open`, or the end of the string. */
function matchParen(code: string, open: number): number {
  let depth = 0;
  for (let k = open; k < code.length; k++) {
    if (code[k] === '(') depth++;
    else if (code[k] === ')' && --depth === 0) return k;
  }
  return code.length;
}

/** True when only spaces or tabs separate `i` from the previous newline (or the start). */
function isLineStart(code: string, i: number): boolean {
  let k = i - 1;
  while (k >= 0 && (code[k] === ' ' || code[k] === '\t')) k--;
  return k < 0 || code[k] === '\n';
}

/**
 * Does a template construct begin at `i`? A tag or `<!--` comment, an
 * interpolation, or a control-flow block — `@if`, never `@Component`, which is
 * why this consults {@link TEMPLATE_BLOCKS} rather than accepting any `@word`.
 */
function startsTemplateConstruct(code: string, i: number): boolean {
  const ch = code[i];
  if (ch === '<') return /[a-zA-Z/!]/.test(code[i + 1] ?? '');
  if (ch === '{') return code[i + 1] === '{';
  if (ch === '@') {
    let j = i + 1;
    while (j < code.length && /\w/.test(code[j])) j++;
    return TEMPLATE_BLOCKS.has(code.slice(i + 1, j));
  }
  return false;
}

/**
 * Where the template island starting at `i` ends: just past the end of the line
 * on which its opening construct closes.
 *
 * A tag's `>` may be several lines down (`<ng-container\n  [x]="y"\n/>`), and
 * handing the whole tag over is what keeps a multi-line binding coloured as a
 * binding. Quotes inside the tag are honoured so a `>` in an attribute value
 * (`[disabled]="a > b"`) does not end it early. A comment runs to `-->`, an
 * interpolation to `}}`, and a control-flow head is always a single line.
 */
function templateRunEnd(code: string, i: number): number {
  const len = code.length;
  let k = i;
  if (code.startsWith('<!--', i)) {
    const close = code.indexOf('-->', i + 4);
    k = close === -1 ? len : close + 3;
  } else if (code.startsWith('{{', i)) {
    const close = code.indexOf('}}', i + 2);
    k = close === -1 ? len : close + 2;
  } else if (code[i] === '<') {
    let quote: string | null = null;
    for (k = i + 1; k < len; k++) {
      const c = code[k];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '>') {
        k++;
        break;
      }
    }
  }
  const nl = code.indexOf('\n', k);
  return nl === -1 ? len : nl;
}

/**
 * Tokenises HTML and Angular templates.
 *
 * ## Why this is not another {@link LangConfig}
 *
 * Every other language here is a single linear scan over one token space, which
 * is why they can share one scanner parametrised by a config object. Markup is
 * not: the same character means different things depending on whether you are
 * inside a tag or between tags. `class` is an attribute name in
 * `<div class="x">` and a reserved word in `class Foo {}`; a bare `>` closes a
 * tag in one place and is a comparison in the other. Modelling that with flags
 * would have meant a flag per rule, so this is a second small scanner with two
 * states (text and tag) instead.
 *
 * Before this existed, every template sample in the curriculum was tokenised
 * with the TypeScript rules, which coloured `class`, `for` and `let` inside
 * templates as reserved words and left every tag and attribute name as plain
 * body text - the exact grey wall the palette exists to prevent.
 *
 * What it colours:
 * - tag names (`hl-tag`), including custom elements like `<app-lesson-nav>`
 * - plain attribute names (`hl-attr`) vs. Angular binding syntax (`hl-bind`):
 *   `[prop]`, `(event)`, `[(banana)]`, `*structural`, `#ref`
 * - the *value* of a binding as a real expression rather than as a string: the
 *   quotes stay string-coloured and the contents go through {@link templateExpr},
 *   so `[disabled]="form.invalid()"` reads like code, because it is code
 * - `{{ interpolations }}`, likewise as expressions
 * - `@if` / `@for` / `@defer` blocks and their heads
 * - `<!-- comments -->`, and a `//` that opens a line. The second is not HTML,
 *   but it is how this curriculum's template samples are annotated
 *   (`// template`, `// re-runs every pass`), and it can only ever be a URL
 *   scheme when it is *not* at the start of a line.
 *
 * Not modelled, deliberately: inline `<script>` and `<style>` bodies keep markup
 * rules rather than switching language mid-document. No lesson in this
 * curriculum embeds either, and the "only has to be right for the snippets in
 * this curriculum" trade-off the rest of this file makes applies here too.
 */
function highlightMarkup(code: string): string {
  let out = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];

    // <!-- comment -->
    if (code.startsWith('<!--', i)) {
      const close = code.indexOf('-->', i + 4);
      const end = close === -1 ? len : close + 3;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // // annotation — only when it opens the line (see the doc comment above).
    if (code.startsWith('//', i) && isLineStart(code, i)) {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? len : nl;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // {{ interpolation }} - the braces are punctuation, the inside is code.
    if (code.startsWith('{{', i)) {
      const close = code.indexOf('}}', i + 2);
      const end = close === -1 ? len : close;
      out += '<span class="hl-punct">{{</span>';
      out += templateExpr(code.slice(i + 2, end));
      if (close !== -1) out += '<span class="hl-punct">}}</span>';
      i = close === -1 ? len : close + 2;
      continue;
    }

    // @if (...) / @for (...) / @let x = ... - control flow, not an annotation.
    if (ch === '@' && /[a-z]/.test(code[i + 1] ?? '')) {
      let j = i + 1;
      while (j < len && /\w/.test(code[j])) j++;
      const word = code.slice(i + 1, j);
      if (TEMPLATE_BLOCKS.has(word)) {
        out += `<span class="hl-kw">@${esc(word)}</span>`;
        i = j;
        while (i < len && code[i] === ' ') {
          out += ' ';
          i++;
        }
        if (code[i] === '(') {
          // A block head: @for (item of items; track item.id)
          const close = matchParen(code, i);
          out += '<span class="hl-punct">(</span>';
          out += templateExpr(code.slice(i + 1, close));
          if (close < len) out += '<span class="hl-punct">)</span>';
          i = close + 1;
        } else if (word === 'let') {
          // @let has no parens - its whole declaration runs to the semicolon.
          const semi = code.indexOf(';', i);
          const end = semi === -1 ? len : semi;
          out += templateExpr(code.slice(i, end));
          i = end;
        }
        continue;
      }
    }

    // A tag: <div ...>, </div>, <app-thing />
    if (ch === '<' && /[a-zA-Z/]/.test(code[i + 1] ?? '')) {
      const nameStart = i + 1 + (code[i + 1] === '/' ? 1 : 0);
      let n = nameStart;
      while (n < len && /[\w:-]/.test(code[n])) n++;
      out += `<span class="hl-punct">${esc(code.slice(i, nameStart))}</span>`;
      out += `<span class="hl-tag">${esc(code.slice(nameStart, n))}</span>`;
      i = n;

      // Attribute state, until the tag closes. Tracked so that a binding's value
      // can be highlighted as an expression while a plain attribute's value
      // stays a string - `[x]="a()"` is code, `class="a"` is not.
      let bindingValue = false;
      while (i < len && code[i] !== '>') {
        const c = code[i];

        if (/\s/.test(c)) {
          out += c;
          i++;
          continue;
        }
        if (c === '/') {
          out += '<span class="hl-punct">/</span>';
          i++;
          continue;
        }
        if (c === '=') {
          out += '<span class="hl-op">=</span>';
          i++;
          continue;
        }
        if (c === '"' || c === "'") {
          let k = i + 1;
          while (k < len && code[k] !== c) k++;
          const inner = code.slice(i + 1, k);
          if (bindingValue && inner.trim()) {
            out += `<span class="hl-str">${esc(c)}</span>`;
            out += templateExpr(inner);
            if (k < len) out += `<span class="hl-str">${esc(c)}</span>`;
          } else {
            out += `<span class="hl-str">${esc(code.slice(i, Math.min(k + 1, len)))}</span>`;
          }
          bindingValue = false;
          i = k + 1;
          continue;
        }
        if (/[\w[(*#@]/.test(c)) {
          let k = i;
          while (k < len && /[\w:.\-[\]()*#@$]/.test(code[k])) k++;
          const name = code.slice(i, k);
          bindingValue = /^[[(*#@]/.test(name);
          out += `<span class="${bindingValue ? 'hl-bind' : 'hl-attr'}">${esc(name)}</span>`;
          i = k;
          continue;
        }

        out += esc(c);
        i++;
      }
      if (i < len) {
        out += '<span class="hl-punct">&gt;</span>';
        i++;
      }
      continue;
    }

    out += esc(ch);
    i++;
  }

  return out;
}

/**
 * Tokenises source text for the given language and returns an HTML string
 * with `<span class="hl-*">` wrappers. Operates on plain text (textContent),
 * not HTML.
 *
 * `lang` defaults to `'ts'`, and that path is byte-identical to the original
 * TypeScript-only implementation — every existing call site (the app-wide
 * highlight sweep, `Predict`, `CodeLab`) keeps working unchanged.
 */
export function highlight(code: string, lang: HighlightLang = 'ts'): string {
  if (lang === 'text') return esc(code);
  if (lang === 'html') return highlightMarkup(code);

  const cfg = LANGS[lang];
  let out = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];
    const ch2 = code[i + 1];

    // Line comment
    if (cfg.lineComment && code.startsWith(cfg.lineComment, i)) {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? len : nl;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Block comment
    if (cfg.blockComment && code.startsWith(cfg.blockComment[0], i)) {
      const [open, close] = cfg.blockComment;
      const closeAt = code.indexOf(close, i + open.length);
      const end = closeAt === -1 ? len : closeAt + close.length;
      out += `<span class="hl-cmt">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Template island: a line of markup inside a mixed sample. Checked here,
    // before strings and operators, because at a line start a `<` cannot be
    // inside a string and would otherwise scan as a comparison operator. Only
    // at a line start — mid-line, `a < b` and `Array<string>` are TypeScript.
    if (cfg.templateIslands && isLineStart(code, i) && startsTemplateConstruct(code, i)) {
      const end = templateRunEnd(code, i);
      out += highlightMarkup(code.slice(i, end));
      i = end;
      continue;
    }

    // An interpolation mid-line — `<td>{{ x }}</td>` after a tag island has
    // handed control back, or prose-like sample text. `{{` never occurs in
    // real TypeScript outside a string, and strings were consumed above.
    if (cfg.templateIslands && ch === '{' && ch2 === '{') {
      const close = code.indexOf('}}', i + 2);
      const end = close === -1 ? len : close + 2;
      out += highlightMarkup(code.slice(i, end));
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
      const raw = code.slice(i, j);
      const cls = cfg.keyColon && isFollowedByColon(code, j) ? 'hl-key' : 'hl-str';
      out += `<span class="${cls}">${esc(raw)}</span>`;
      i = j;
      continue;
    }

    // Shell variable: $VAR, ${VAR}, $1, $@, $?
    if (cfg.shellTokens && ch === '$') {
      if (ch2 === '{') {
        const close = code.indexOf('}', i + 2);
        const end = close === -1 ? len : close + 1;
        out += `<span class="hl-var">${esc(code.slice(i, end))}</span>`;
        i = end;
        continue;
      }
      let j = i + 1;
      while (j < len && /\w/.test(code[j])) j++;
      const end = j > i + 1 ? j : i + 1;
      out += `<span class="hl-var">${esc(code.slice(i, end))}</span>`;
      i = end;
      continue;
    }

    // Shell flag: -x or --long-flag, at the start of a token (not a subtraction).
    if (
      cfg.shellTokens &&
      ch === '-' &&
      ch2 &&
      /[a-zA-Z-]/.test(ch2) &&
      (i === 0 || /[\s|(]/.test(code[i - 1]))
    ) {
      let j = i + 1;
      while (j < len && /[\w-]/.test(code[j])) j++;
      out += `<span class="hl-flag">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Decorator
    if (cfg.decorators && ch === '@' && ch2 && /\w/.test(ch2)) {
      let j = i + 1;
      while (j < len && /\w/.test(code[j])) j++;
      out += `<span class="hl-dec">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // CSS hex colour: #fff, #1a2b3c, #1a2b3cff
    if (cfg.hexColors && ch === '#' && ch2 && /[0-9a-fA-F]/.test(ch2)) {
      let j = i + 1;
      while (j < len && /[0-9a-fA-F]/.test(code[j])) j++;
      out += `<span class="hl-num">${esc(code.slice(i, j))}</span>`;
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

    // Identifier / keyword / builtin / key / property / function call
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < len && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);

      if (cfg.keyColon && isFollowedByColon(code, j)) {
        out += `<span class="hl-key">${esc(word)}</span>`;
        i = j;
        continue;
      }

      const wordKey = cfg.caseInsensitiveKeywords ? word.toUpperCase() : word;

      if (cfg.keywords.has(wordKey)) {
        out += `<span class="hl-kw">${esc(word)}</span>`;
        i = j;
        continue;
      }
      if (cfg.builtins.has(wordKey)) {
        out += `<span class="hl-builtin">${esc(word)}</span>`;
        i = j;
        continue;
      }

      if (!cfg.richIdentifiers) {
        out += esc(word);
        i = j;
        continue;
      }

      // Skip whitespace to peek at next non-space char
      let k = j;
      while (k < len && code[k] === ' ') k++;

      // Look back (past whitespace) for a `.` — the marker of a member access,
      // which an editor colours differently from a free identifier.
      let b = i - 1;
      while (b >= 0 && code[b] === ' ') b--;
      const afterDot = b >= 0 && code[b] === '.' && code[b - 1] !== '.';

      if (code[k] === '(') {
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
