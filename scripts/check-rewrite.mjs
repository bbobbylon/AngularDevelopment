/**
 * Dry pre-flight for a rewrites module — run BEFORE apply-option-rewrites.
 *   node scripts/check-rewrite.mjs scripts/rewrites-X.mjs
 * Verifies, against the live bank:
 *   1. every id exists,
 *   2. the module's answer index equals the CURRENT correct index (so we are not
 *      silently moving the right answer to a different option),
 *   3. the new correct option is NOT the strictly-longest option (the balance goal).
 * Prints a FIX line for any question that fails (3) so it can be edited, then exits
 * non-zero if any check fails.
 */
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const src = fs.readFileSync('src/app/pages/practice/practice-data.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const byId = new Map(mod.exports.CHALLENGES.map((c) => [c.id, c]));

const rw = (await import(pathToFileURL(path.resolve(process.argv[2])).href)).default;

let problems = 0;
for (const [idStr, r] of Object.entries(rw)) {
  const id = Number(idStr);
  const c = byId.get(id);
  if (!c) { console.log(`#${id} MISSING from bank`); problems++; continue; }
  if (c.answer !== r.answer) {
    console.log(`#${id} ANSWER-INDEX MISMATCH: current=${c.answer} module=${r.answer}`);
    problems++;
  }
  const ansLen = r.options[r.answer].length;
  const strictLongest = r.options.every((o, i) => i === r.answer || o.length < ansLen);
  if (strictLongest) {
    const lens = r.options.map((o, i) => (i === r.answer ? `*${o.length}` : o.length)).join(' ');
    console.log(`#${id} STILL-LONGEST answer (lens ${lens})`);
    console.log(`   FIX: shorten "${r.options[r.answer]}" or lengthen a distractor`);
    problems++;
  }
}
console.log(problems ? `\n${problems} problem(s) — fix before applying` : `clean: ${Object.keys(rw).length} ids OK, no answer is strictly longest`);
process.exit(problems ? 1 : 0);
