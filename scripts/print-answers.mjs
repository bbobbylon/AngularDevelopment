/** Print id, answer index, and each option (with length + * on answer) for a list
 * of ids passed on the command line: node scripts/print-answers.mjs 45 137 138 ... */
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const src = fs.readFileSync('src/app/pages/practice/practice-data.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const byId = new Map(mod.exports.CHALLENGES.map((c) => [c.id, c]));
const ids = process.argv.slice(2).map(Number);
for (const id of ids) {
  const c = byId.get(id);
  if (!c) { console.log(`#${id} NOT FOUND`); continue; }
  console.log(`#${id} [${c.category}] answer=${c.answer}`);
  c.options.forEach((o, i) => console.log(`  ${i === c.answer ? '*' : ' '}${i} [${o.length}] ${o}`));
  console.log('');
}
