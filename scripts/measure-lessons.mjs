import fs from 'node:fs';
import path from 'node:path';

function walk(d) {
  let r = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) r = r.concat(walk(p));
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.spec.ts')) r.push(p);
  }
  return r;
}

const files = walk('src/app/lessons');
const rows = files.map((f) => {
  const src = fs.readFileSync(f, 'utf8');
  // crude "prose" heuristic: characters inside the template string
  const tpl = src.match(/template:\s*`([\s\S]*?)`\s*,?\s*(styles|\}\))/);
  return {
    f: f.split(path.sep).join('/').replace('src/app/lessons/', ''),
    lines: src.split(/\n/).length,
    bytes: fs.statSync(f).size,
  };
});
rows.sort((a, b) => a.lines - b.lines);
console.log('lesson component files:', rows.length);
console.log('--- thinnest 18 ---');
for (const r of rows.slice(0, 18)) console.log(String(r.lines).padStart(5), (r.bytes + 'b').padStart(9), r.f);
console.log('--- thickest 6 ---');
for (const r of rows.slice(-6)) console.log(String(r.lines).padStart(5), (r.bytes + 'b').padStart(9), r.f);
const tot = rows.reduce((a, b) => a + b.lines, 0);
console.log('median lines:', rows[Math.floor(rows.length / 2)].lines, '| avg lines:', Math.round(tot / rows.length));
