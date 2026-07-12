/**
 * Surgical rewriter for the challenge bank's multiple-choice options.
 *
 * WHY THIS EXISTS: `practice-data.ts` is 6k+ lines and holds `code:` template
 * literals, section comments and hand-tuned formatting we must NOT disturb. So
 * instead of re-serializing the whole array (which would lose all that), this
 * script does targeted, quote-aware string surgery on ONLY three properties of a
 * named challenge: `options`, `answer`, and (optionally) `explanation`.
 *
 * INPUT: a rewrites module that default-exports `{ [id]: { options, answer,
 * explanation? } }`. Run:  node scripts/apply-option-rewrites.mjs <rewrites.mjs>
 *
 * SAFETY: after writing, it transpiles+evals the result and asserts every
 * touched challenge now matches the requested content, the id set is unchanged,
 * and every answer index is valid. Any mismatch throws before you can commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const DATA = 'src/app/pages/practice/practice-data.ts';

/** Eval the TS bank into the live CHALLENGES array (types stripped). */
function loadChallenges(src) {
  const js = ts.transpileModule(src, {
    compilerOptions: { module: 'commonjs', target: 'es2020' },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
  return mod.exports.CHALLENGES;
}

/**
 * Scan forward from `start` over a JS array/string literal, honoring ' " ` and
 * backslash escapes, and return the index just past the matching close bracket.
 */
function endOfBracket(src, start) {
  // src[start] must be '['
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unterminated options array from index ' + start);
}

/** End index (exclusive) of a single-quoted string starting at `start`. */
function endOfSingleQuoted(src, start) {
  // src[start] must be a quote char
  const quote = src[start];
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue; }
    if (src[i] === quote) return i + 1;
  }
  throw new Error('unterminated string from index ' + start);
}

/** Serialize an options array as double-quoted TS with two-space item indent. */
function serializeOptions(options, indent = '    ') {
  const inner = options.map((o) => `${indent}  ${JSON.stringify(o)}`).join(',\n');
  return `options: [\n${inner},\n${indent}]`;
}

async function main() {
  const rewritesPath = process.argv[2];
  if (!rewritesPath) throw new Error('usage: node apply-option-rewrites.mjs <rewrites.mjs>');
  const rewrites = (await import(pathToFileURL(path.resolve(rewritesPath)).href)).default;

  let src = fs.readFileSync(DATA, 'utf8');
  const before = loadChallenges(src);
  const beforeIds = new Set(before.map((c) => c.id));

  // Apply id-by-id. We re-find offsets after each edit because earlier edits
  // shift later indices; simplest correct approach for a few dozen edits.
  const ids = Object.keys(rewrites).map(Number);
  for (const id of ids) {
    const rw = rewrites[id];
    // Locate the challenge object: `id: <n>,` then its `options: [` and `answer:`.
    const idRe = new RegExp(`\\bid:\\s*${id}\\s*,`);
    const idMatch = idRe.exec(src);
    if (!idMatch) throw new Error(`could not find challenge id ${id}`);
    const from = idMatch.index;

    // --- options array ---
    const optKey = src.indexOf('options:', from);
    const optOpen = src.indexOf('[', optKey);
    const optClose = endOfBracket(src, optOpen);
    const indent = ' '.repeat(src.slice(0, optKey).length - src.lastIndexOf('\n', optKey) - 1);
    src =
      src.slice(0, optKey) +
      serializeOptions(rw.options, indent) +
      src.slice(optClose);

    // --- answer index (the numeric literal right after `answer:`) ---
    const ansKey = src.indexOf('answer:', optKey);
    const ansValStart = ansKey + 'answer:'.length;
    const ansRe = /\s*[0-9]+/y;
    ansRe.lastIndex = ansValStart;
    const ansMatch = ansRe.exec(src);
    if (!ansMatch) throw new Error(`challenge ${id}: expected numeric answer after options`);
    src =
      src.slice(0, ansValStart) + ' ' + rw.answer + src.slice(ansValStart + ansMatch[0].length);

    // --- explanation (optional) ---
    if (rw.explanation != null) {
      const expKey = src.indexOf('explanation:', ansKey);
      if (expKey === -1) throw new Error(`challenge ${id}: no explanation field`);
      let q = expKey + 'explanation:'.length;
      while (/\s/.test(src[q])) q++;
      if (src[q] !== "'" && src[q] !== '"') {
        throw new Error(`challenge ${id}: explanation is not a simple quoted string`);
      }
      const expEnd = endOfSingleQuoted(src, q);
      src = src.slice(0, q) + JSON.stringify(rw.explanation) + src.slice(expEnd);
    }
  }

  // --- validate before writing to disk ---
  const after = loadChallenges(src);
  const afterIds = new Set(after.map((c) => c.id));
  if (afterIds.size !== beforeIds.size) throw new Error('id count changed!');
  for (const id of beforeIds) if (!afterIds.has(id)) throw new Error(`lost id ${id}`);
  const byId = new Map(after.map((c) => [c.id, c]));
  for (const id of ids) {
    const c = byId.get(Number(id));
    const rw = rewrites[id];
    if (JSON.stringify(c.options) !== JSON.stringify(rw.options))
      throw new Error(`id ${id}: options did not apply cleanly`);
    if (c.answer !== rw.answer) throw new Error(`id ${id}: answer did not apply`);
    if (c.answer < 0 || c.answer >= c.options.length)
      throw new Error(`id ${id}: answer index out of range`);
    if (rw.explanation != null && c.explanation !== rw.explanation)
      throw new Error(`id ${id}: explanation did not apply`);
  }

  fs.writeFileSync(DATA, src);
  console.log(`applied ${ids.length} rewrite(s): ids ${ids.join(', ')}`);
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
