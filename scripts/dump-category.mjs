import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const src = fs.readFileSync('src/app/pages/practice/practice-data.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', js)(mod.exports, mod, require);
const CH = mod.exports.CHALLENGES;

const cat = process.argv[2];
const list = CH.filter((c) => c.category === cat && Array.isArray(c.options) && typeof c.answer === 'number');
for (const c of list) {
  console.log('#' + c.id + ' [' + c.difficulty + '] ' + c.type);
  console.log('Q: ' + c.question);
  if (c.code) console.log('CODE:\n' + c.code);
  c.options.forEach((o, i) => console.log((i === c.answer ? ' *' : '  ') + i + ') [' + o.length + '] ' + o));
  console.log('EXPL: ' + c.explanation);
  console.log('---');
}
console.log('count:', list.length);
