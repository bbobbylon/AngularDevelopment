/**
 * Data model for the /cheat-sheets feature — printable, searchable "zero to
 * running" references for the tools and languages around this curriculum
 * (databases, cloud providers, languages, frameworks).
 *
 * Everything is data, not markup: each sheet lives in its own file under
 * `core/cheat-sheets/` exporting one {@link CheatSheet}, aggregated by
 * `index.ts`. The two pages under `pages/cheat-sheets/` render the model with
 * the shared multi-language highlighter, which is why code samples here are
 * plain strings — no NG5002 brace-escaping, no per-sheet templates, and a new
 * sheet is automatically routed, smoke-tested and a11y-scanned via the route
 * table.
 */

/** Languages the shared highlighter can tokenise (see `shared/highlighter.ts`). */
export type CheatLang =
  'ts' | 'bash' | 'sql' | 'python' | 'java' | 'yaml' | 'json' | 'css' | 'html' | 'text';

/** One command (or short snippet) plus the annotation explaining what it does. */
export interface CommandRow {
  /** The command/snippet itself, shown highlighted and copyable. */
  code: string;
  /**
   * What the command does, why you'd run it, or the flag worth knowing —
   * rendered beside/beneath the code. Never leave a command unexplained; the
   * annotation is the cheat sheet.
   */
  note: string;
}

/**
 * A table of commands — the workhorse block. Each row is one command with its
 * explanation, so the rendered result reads like an annotated terminal session.
 */
export interface CommandsBlock {
  kind: 'commands';
  /** Optional heading above the table (e.g. "Daily driver commands"). */
  title?: string;
  lang: CheatLang;
  rows: CommandRow[];
}

/** A single multi-line code sample (config file, script, snippet) with a caption. */
export interface CodeBlock {
  kind: 'code';
  /** Optional heading above the block (e.g. "docker-compose.yml"). */
  title?: string;
  lang: CheatLang;
  code: string;
  /** Explanation rendered under the block — what the sample shows and why. */
  note?: string;
}

/** A callout: a tip worth remembering, a warning, or a trap people hit. */
export interface TipBlock {
  kind: 'tip';
  /** tip = good practice · warn = costs money/data if ignored · gotcha = surprising behaviour. */
  tone: 'tip' | 'warn' | 'gotcha';
  text: string;
}

/** A small comparison/reference table (ports, editions, flag matrices…). */
export interface TableBlock {
  kind: 'table';
  /** Optional heading above the table. */
  title?: string;
  headers: string[];
  rows: string[][];
}

export type CheatBlock = CommandsBlock | CodeBlock | TipBlock | TableBlock;

/** One titled section of a sheet — becomes a TOC entry and a print page-break candidate. */
export interface CheatSection {
  title: string;
  /** Optional one-paragraph lead-in below the section heading. */
  intro?: string;
  blocks: CheatBlock[];
}

/** Broad grouping used by the hub page's filter tabs. */
export type CheatCategory = 'database' | 'cloud' | 'language' | 'framework' | 'deployment';

/** A complete cheat sheet: one tool/language, from install to daily use. */
export interface CheatSheet {
  /** URL slug — the sheet renders at `/cheat-sheets/<id>`. */
  id: string;
  title: string;
  /** Emoji shown on the hub card and page header. */
  icon: string;
  /** One-line promise of what the sheet gets you ("Zero to a running cluster"). */
  tagline: string;
  category: CheatCategory;
  /** Opening paragraph: what this tool is and what the sheet covers. */
  intro: string;
  sections: CheatSection[];
}
