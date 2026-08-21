// The explanation field's "Why others fail: (A) ... (C) ... (D) ..." labels reference the
// ORIGINAL (unshuffled) option order, but options are shuffled per session in Practice/
// Mock Exam/Review — so on screen the letters point at the wrong option. Since (A)-(D) only
// ever appear in this file inside that clause, a blanket strip is safe and removes the
// misinformation without touching the (already option-name-qualified) prose.
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/app/pages/practice/practice-data.ts';
const before = readFileSync(path, 'utf8');

const pattern = /\([A-D]\) /g;
const matches = before.match(pattern) ?? [];
const after = before.replace(pattern, '');

writeFileSync(path, after, 'utf8');
console.log(`Stripped ${matches.length} letter labels from ${path}`);
