/**
 * Length-balance meter for the multiple-choice challenge bank.
 *
 * WHY: a test-taker must not be able to guess the correct option just by picking
 * the longest (or the odd-one-out shortest) answer. This reports, per category and
 * overall, how exploitable that heuristic still is.
 *
 * METRICS (per scope):
 *   longest%  — share of MC questions where the correct answer is the STRICTLY
 *               longest option. This is the primary signal to drive toward ~25%.
 *   rank      — average length-rank of the correct answer (1 = shortest option …
 *               n = longest). Balanced ≈ (n+1)/2 (2.5 for 4 options).
 *   n(longest)— raw count of questions where the answer is strictly longest.
 *
 * Run:  node scripts/measure-balance.mjs [category]
 *       (no arg = full aggregate + per-category table)
 */
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const src = fs.readFileSync('src/app/pages/practice/practice-data.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const CH = mod.exports.CHALLENGES;

/** MC-style questions only: an options array plus a numeric answer index. */
const isMC = (c) => Array.isArray(c.options) && c.options.length >= 2 && typeof c.answer === 'number';

/** 1-based length rank of the answer (1 = shortest). Ties share the lower rank. */
function answerRank(c) {
  const len = c.options[c.answer].length;
  const shorter = c.options.filter((o) => o.length < len).length;
  return shorter + 1;
}
const isStrictLongest = (c) =>
  c.options.every((o, i) => i === c.answer || o.length < c.options[c.answer].length);
const isStrictShortest = (c) =>
  c.options.every((o, i) => i === c.answer || o.length > c.options[c.answer].length);

function stats(list) {
  const n = list.length;
  if (!n) return { n: 0 };
  const longest = list.filter(isStrictLongest).length;
  const shortest = list.filter(isStrictShortest).length;
  const rank = list.reduce((s, c) => s + answerRank(c), 0) / n;
  return { n, longest, shortest, rank, longestPct: (100 * longest) / n };
}

function fmt(label, s) {
  if (!s.n) return `${label}: (no MC questions)`;
  return `${label.padEnd(14)} longest ${s.longestPct.toFixed(1).padStart(5)}%  ` +
    `rank ${s.rank.toFixed(2)}  n(longest)=${String(s.longest).padStart(3)}  ` +
    `n(shortest)=${String(s.shortest).padStart(3)}  total=${s.n}`;
}

const only = process.argv[2];
const mc = CH.filter(isMC).filter((c) => !only || c.category === only);

if (only) {
  console.log(fmt(only, stats(mc)));
  // list the still-exploitable ones so they're easy to find
  const bad = mc.filter(isStrictLongest);
  if (bad.length) {
    console.log('  answer-is-longest ids: ' + bad.map((c) => '#' + c.id).join(' '));
  }
} else {
  const cats = [...new Set(mc.map((c) => c.category))].sort();
  for (const cat of cats) console.log(fmt(cat, stats(CH.filter(isMC).filter((c) => c.category === cat))));
  console.log('-'.repeat(90));
  console.log(fmt('AGGREGATE', stats(mc)));
}
