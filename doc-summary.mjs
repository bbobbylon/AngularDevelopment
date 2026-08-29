import { readFileSync } from 'node:fs';
const { rows, total } = JSON.parse(readFileSync('doc-audit.json', 'utf8'));
const area = (f) => {
  const p = f.split('\\').join('/');
  if (p.includes('/lessons/')) return 'lessons';
  if (p.includes('/pages/')) return 'pages';
  if (p.includes('/core/')) return 'core';
  if (p.includes('/shared/')) return 'shared';
  return 'root';
};
const acc = {};
for (const r of rows) {
  const a = area(r.file);
  acc[a] = acc[a] || { files: 0, gaps: 0 };
  acc[a].files++;
  acc[a].gaps += r.gaps.length;
}
console.log(JSON.stringify(acc, null, 1));
console.log('TOTAL', total);
const kinds = {};
for (const r of rows) for (const g of r.gaps) kinds[g.kind] = (kinds[g.kind] || 0) + 1;
console.log(JSON.stringify(kinds, null, 1));
console.log('\n--- non-lesson files ---');
for (const r of rows.filter((r) => area(r.file) !== 'lessons'))
  console.log(String(r.gaps.length).padStart(4), r.file.split('\\').join('/'));
