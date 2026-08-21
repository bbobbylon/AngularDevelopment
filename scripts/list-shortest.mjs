/**
 * List the ids in a category whose correct answer is the STRICTLY-shortest option
 * (the "pick shortest" exploit introduced by the longest-answer rebalance).
 *   node scripts/list-shortest.mjs <category>
 * Prints each id with the answer length and the gap to the next-shortest option,
 * so the smallest gaps (cheapest to fix by lengthening the answer) are obvious.
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
  if (c.category !== cat) continue;
  if (!Array.isArray(c.options) || typeof c.answer !== 'number') continue;
  const lens = c.options.map((o) => o.length);
  const ansLen = lens[c.answer];
  const others = lens.filter((_, i) => i !== c.answer);
  const minOther = Math.min(...others);
  if (ansLen < minOther) {
    rows.push({ id: c.id, ansLen, gap: minOther - ansLen, next: minOther });
  }
}
rows.sort((a, b) => a.gap - b.gap);
for (const r of rows) console.log(`#${r.id}  ans=${r.ansLen}  next-shortest=${r.next}  need +${r.gap + 1}`);
console.log(`\n${rows.length} strictly-shortest answers in "${cat}"`);
