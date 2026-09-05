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
 * (`bash`, `sql`, `python`, `java`, `yaml`, `json`, `text`) reuse the exact same
 * scanner, parametrised by a small per-language config — different comment
 * markers, keyword/builtin sets, and a couple of language-specific token rules
 * (shell flags/variables for `bash`, the `key:` in `key: value` for `yaml` and
 * `json`). `text` skips tokenising entirely — it means "this block is plain
 * output, not source."
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
export type HighlightLang = 'ts' | 'bash' | 'sql' | 'python' | 'java' | 'yaml' | 'json' | 'text';

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
}

const LANGS: Record<Exclude<HighlightLang, 'text'>, LangConfig> = {
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
  },
  json: {
    keywords: JSON_KEYWORDS,
    builtins: EMPTY,
    caseInsensitiveKeywords: false,
    lineComment: null,
    blockComment: null,
    decorators: false,
    richIdentifiers: false,
    shellTokens: false,
    keyColon: true,
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
