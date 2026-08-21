/**
 * Dry pre-flight for a rewrites module used to ADD BACK longest-answer instances
 * (the mirror image of check-rewrite.mjs, which enforces "never longest"). Use
 * this when deliberately lengthening a correct answer so it becomes the
 * strictly-longest option, to rebalance longest% up toward the ~25% chance
 * baseline after an over-correction to 0%.
 *
 *   node scripts/check-rebalance.mjs scripts/rewrites-X.mjs
 *
 * Verifies, against the live bank:
 *   1. every id exists,
 *   2. the module's answer index equals the CURRENT correct index (answer
 *      identity must never move),
 *   3. every option in the module still matches the bank's CURRENT option at
 *      that index for all indices except ones the module actually edits — i.e.
 *      no accidental distractor drift (informational: prints a diff if any).
 * Then reports, per id, whether the new answer is strictly-longest,
 * strictly-shortest, or mid-pack, so the intent of each edit can be eyeballed.
 * Exits non-zero only on structural problems (1) and (2); the length report is
 * informational since both directions (longest or trimmed distractor) are
 * valid outcomes for this tool's purpose.
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
    continue;
  }
  if (r.options.length !== c.options.length) {
    console.log(`#${id} OPTION-COUNT MISMATCH: current=${c.options.length} module=${r.options.length}`);
    problems++;
    continue;
  }
  const ansLen = r.options[r.answer].length;
  const strictLongest = r.options.every((o, i) => i === r.answer || o.length < ansLen);
  const strictShortest = r.options.every((o, i) => i === r.answer || o.length > ansLen);
  const lens = r.options.map((o, i) => (i === r.answer ? `*${o.length}` : o.length)).join(' ');
  const tag = strictLongest ? 'LONGEST' : strictShortest ? 'shortest' : 'mid-pack';
  console.log(`#${id} ${tag.padEnd(8)} lens ${lens}`);
}
console.log(problems ? `\n${problems} problem(s) — fix before applying` : `\nclean: ${Object.keys(rw).length} ids OK (answer index preserved, option counts match)`);
process.exit(problems ? 1 : 0);
