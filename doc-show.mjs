import { readFileSync } from 'node:fs';
const { rows } = JSON.parse(readFileSync('doc-audit.json', 'utf8'));
const want = process.argv.slice(2);
for (const r of rows) {
  const f = r.file.split('\\').join('/');
  if (!want.some((w) => f.includes(w))) continue;
  console.log(`\n### ${f}  (${r.gaps.length})`);
  for (const g of r.gaps) console.log(`  ${String(g.line).padStart(4)}  ${g.kind.padEnd(14)} ${g.label}`);
}
