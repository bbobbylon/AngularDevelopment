/**
 * List MC questions in a category whose correct answer is CLOSE to becoming the
 * strictly-longest option (small gap = cheap to flip by lengthening the answer
 * with genuine clarifying detail). Used to pick low-effort, natural-reading
 * candidates when rebalancing longest% back up from an over-corrected 0%.
 *   node scripts/list-near-longest.mjs <category>
 * Skips questions where the answer is already strictly longest or strictly
 * shortest. Prints id, current answer length, current max-other length, gap
 * (chars needed to tie, so add gap+1 to strictly win), and the answer text.
 */
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const src = fs.readFileSync('src/app/pages/practice/practice-data.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);

const cat = process.argv[2];
const rows = [];
for (const c of mod.exports.CHALLENGES) {
  if (cat && c.category !== cat) continue;
  if (!Array.isArray(c.options) || typeof c.answer !== 'number') continue;
  const lens = c.options.map((o) => o.length);
  const ansLen = lens[c.answer];
  const others = lens.filter((_, i) => i !== c.answer);
  const maxOther = Math.max(...others);
  const minOther = Math.min(...others);
  if (ansLen >= maxOther) continue; // already strictly longest
  if (ansLen <= minOther) continue; // already strictly shortest — leave alone
  rows.push({ id: c.id, category: c.category, ansLen, maxOther, gap: maxOther - ansLen, answer: c.options[c.answer] });
}
rows.sort((a, b) => a.gap - b.gap);
for (const r of rows) {
  console.log(`#${r.id} [${r.category}] ans=${r.ansLen} maxOther=${r.maxOther} need+${r.gap + 1}  "${r.answer}"`);
}
console.log(`\n${rows.length} flippable (non-extreme) candidates${cat ? ' in "' + cat + '"' : ''}`);
